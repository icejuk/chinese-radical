import { describe, expect, it, vi } from 'vitest'
import { LocalRecorder, type RecorderDependencies, type RecordingState } from './recorder'

function fixture(getStream?: () => Promise<MediaStream>) {
  const stopTrack = vi.fn(), stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream
  const states: RecordingState[] = []
  const fake = {
    state: 'inactive', mimeType: 'audio/webm', ondataavailable: null as null | ((event: { data: Blob }) => void), onstop: null as null | (() => void), onerror: null as null | (() => void),
    start() { this.state = 'recording' }, stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['audio']) }); this.onstop?.() },
  }
  const deps: RecorderDependencies = { getStream: getStream ?? (async () => stream), createRecorder: () => fake as unknown as MediaRecorder, createUrl: vi.fn(() => 'blob:local-recording'), revokeUrl: vi.fn() }
  return { controller: new LocalRecorder(state => states.push(state), deps), deps, fake, states, stream, stopTrack }
}
describe('local microphone ownership', () => {
  it('records locally, stops every track and releases its blob URL on exit', async () => {
    const f = fixture()
    await f.controller.start()
    expect(f.states.at(-1)?.status).toBe('recording')
    f.controller.stop()
    expect(f.stopTrack).toHaveBeenCalled()
    expect(f.states.at(-1)).toEqual({ status: 'ready', url: 'blob:local-recording' })
    f.controller.dispose()
    expect(f.deps.revokeUrl).toHaveBeenCalledWith('blob:local-recording')
  })
  it('immediately closes a microphone granted after leaving the page', async () => {
    let resolve!: (stream: MediaStream) => void
    const f = fixture(() => new Promise(done => { resolve = done }))
    const starting = f.controller.start()
    f.controller.dispose()
    resolve(f.stream)
    await starting
    expect(f.stopTrack).toHaveBeenCalled()
    expect(f.states.map(state => state.status)).toEqual(['requesting'])
    expect(f.deps.createUrl).not.toHaveBeenCalled()
  })
  it('cancels pending permission without creating a late recording', async () => {
    let resolve!: (stream: MediaStream) => void
    const f = fixture(() => new Promise(done => { resolve = done }))
    const starting = f.controller.start()
    f.controller.stop()
    resolve(f.stream)
    await starting
    expect(f.stopTrack).toHaveBeenCalled()
    expect(f.states.at(-1)?.status).toBe('idle')
    expect(f.fake.state).toBe('inactive')
    f.controller.dispose()
  })
  it('handles permission denial and still allows practice without a mic', async () => {
    const error = new Error('denied'); error.name = 'NotAllowedError'
    const f = fixture(async () => { throw error })
    await f.controller.start()
    expect(f.states.at(-1)?.status).toBe('error')
    expect(f.states.at(-1)?.error).toContain('ยังฟังตัวอย่าง')
    f.controller.dispose()
  })
  it('stops recording and tracks on recorder errors without creating an empty success', async () => {
    const f = fixture()
    await f.controller.start()
    f.fake.onerror?.()
    expect(f.stopTrack).toHaveBeenCalled()
    expect(f.states.at(-1)?.status).toBe('error')
    expect(f.deps.createUrl).not.toHaveBeenCalled()
    f.controller.dispose()
  })
})

it('stops automatically after sixty seconds and releases tracks', async () => {
  vi.useFakeTimers()
  const f = fixture()
  try {
    await f.controller.start()
    vi.advanceTimersByTime(60000)
    expect(f.stopTrack).toHaveBeenCalled()
    expect(f.states.at(-1)?.status).toBe('ready')
  } finally { f.controller.dispose(); vi.useRealTimers() }
})
it('ignores an old permission rejection after a new microphone session starts', async () => {
  let reject!: (error: Error) => void
  const f = fixture()
  let calls = 0
  f.deps.getStream = () => ++calls === 1 ? new Promise((_, no) => { reject = no }) : Promise.resolve(f.stream)
  const oldRequest = f.controller.start()
  f.controller.stop()
  await f.controller.start()
  reject(new Error('old denied'))
  await oldRequest
  expect(f.stopTrack).not.toHaveBeenCalled()
  expect(f.states.at(-1)?.status).toBe('recording')
  f.controller.dispose()
  expect(f.stopTrack).toHaveBeenCalled()
})

it('disposes an active attempt without emitting a stale ready state or retaining its timer', async () => {
  vi.useFakeTimers()
  const f = fixture()
  try {
    await f.controller.start()
    f.controller.dispose()
    expect(f.stopTrack).toHaveBeenCalled()
    expect(f.deps.createUrl).not.toHaveBeenCalled()
    expect(f.states.some(state => state.status === 'ready')).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    const next = fixture()
    expect(next.states).toEqual([])
    await next.controller.start()
    expect(next.states.at(-1)?.status).toBe('recording')
    next.controller.dispose()
  } finally { vi.useRealTimers() }
})

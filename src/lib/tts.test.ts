import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playSound, stopSound } from './tts'

class FakeAudio {
  static instances: FakeAudio[] = []
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  pause = vi.fn()
  play = vi.fn(() => Promise.resolve())
  constructor(public src: string) { FakeAudio.instances.push(this) }
}

beforeEach(() => {
  FakeAudio.instances = []
  vi.stubGlobal('window', {})
  vi.stubGlobal('Audio', FakeAudio)
})
afterEach(() => { stopSound(); vi.unstubAllGlobals() })

describe('word audio lifecycle', () => {
  it('clears playing state once when a media error occurs after play resolves', async () => {
    const done = vi.fn()
    playSound('水', done)
    await Promise.resolve()
    const audio = FakeAudio.instances[0]
    audio.onerror?.()
    audio.onended?.()
    stopSound()
    expect(done).toHaveBeenCalledTimes(1)
  })
  it('does not let delayed events from an old sound stop the current word', () => {
    const first = vi.fn(), second = vi.fn()
    playSound('水', first)
    const oldAudio = FakeAudio.instances[0]
    playSound('学生', second)
    expect(oldAudio.pause).toHaveBeenCalledOnce()
    expect(first).toHaveBeenCalledOnce()
    oldAudio.onerror?.()
    oldAudio.onended?.()
    expect(second).not.toHaveBeenCalled()
    FakeAudio.instances[1].onended?.()
    expect(second).toHaveBeenCalledOnce()
  })
  it('clears playing state when the browser refuses playback', async () => {
    class RejectedAudio extends FakeAudio { play = vi.fn(() => Promise.reject(new Error('Playback denied'))) }
    vi.stubGlobal('Audio', RejectedAudio)
    const done = vi.fn()
    playSound('水', done)
    await Promise.resolve()
    expect(done).toHaveBeenCalledOnce()
  })
})

describe('slow playback and errors', () => {
  it('uses a slower fallback URL for the same text', () => {
    playSound('学生')
    const normal = Number(new URL(FakeAudio.instances[0].src).searchParams.get('ttsspeed'))
    playSound('学生', undefined, { slow: true })
    const slow = Number(new URL(FakeAudio.instances[1].src).searchParams.get('ttsspeed'))
    expect(slow).toBeLessThan(normal)
    expect(new URL(FakeAudio.instances[1].src).searchParams.get('q')).toBe('学生')
  })
  it('reports media failure once and never accepts a stale start event', async () => {
    const error = vi.fn(), start = vi.fn()
    playSound('水', undefined, { onError: error, onStart: start })
    FakeAudio.instances[0].onerror?.()
    await Promise.resolve()
    expect(error).toHaveBeenCalledOnce()
    expect(start).not.toHaveBeenCalled()
  })
})

it('reports native speech start and failure without leaving a playing state', () => {
  const synthesis = { cancel: vi.fn(), getVoices: () => [{ name: 'Chinese', lang: 'zh-CN' }], speak: vi.fn() }
  class Utterance { onstart?: () => void; onerror?: () => void; onend?: () => void; rate = 1; constructor(public text: string) {} }
  vi.stubGlobal('window', { speechSynthesis: synthesis })
  vi.stubGlobal('speechSynthesis', synthesis)
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
  const start = vi.fn(), error = vi.fn(), end = vi.fn()
  playSound('学生', end, { slow: true, onStart: start, onError: error })
  const utterance = synthesis.speak.mock.calls[0][0] as Utterance
  expect(utterance.rate).toBeLessThan(.6)
  utterance.onstart?.(); utterance.onerror?.(); utterance.onend?.()
  expect(start).toHaveBeenCalledOnce(); expect(error).toHaveBeenCalledOnce(); expect(end).toHaveBeenCalledOnce()
})

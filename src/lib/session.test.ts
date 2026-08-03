import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { charsUsingRad, learnRads } from './tree'
import { makeSet } from './quiz'
import { dueHanzi, srsUpdate, today } from './srs'
import { todaySet } from './today'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()

  get length() {
    return this.data.size
  }

  clear() {
    this.data.clear()
  }

  getItem(key: string) {
    return this.data.get(key) ?? null
  }

  key(index: number) {
    return [...this.data.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.data.delete(key)
  }

  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true })
  vi.useRealTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('V2 daily session', () => {
  it('keeps the same five radicals after SRS changes during the day', () => {
    const first = todaySet()
    expect(first).toHaveLength(5)

    srsUpdate(first[0].r, true)
    expect(todaySet().map((radical) => radical.r)).toEqual(first.map((radical) => radical.r))
  })

  it('shuffles the chosen five once, then locks that order for the day', () => {
    const selectedByPriority = learnRads
      .filter((radical) => charsUsingRad(radical).length > 0)
      .slice(0, 5)
      .map((radical) => radical.r)

    vi.spyOn(Math, 'random').mockReturnValue(0)
    const firstOrder = todaySet().map((radical) => radical.r)

    expect(new Set(firstOrder)).toEqual(new Set(selectedByPriority))
    expect(firstOrder).not.toEqual(selectedByPriority)

    vi.mocked(Math.random).mockReturnValue(0.99)
    expect(todaySet().map((radical) => radical.r)).toEqual(firstOrder)
  })

  it('uses the learner local calendar day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 3, 23, 59, 59))
    const before = today()
    vi.setSystemTime(new Date(2026, 7, 4, 0, 0, 1))
    expect(today()).toBe(before + 1)
  })

  it('does not classify unseen characters as due', () => {
    expect(dueHanzi()).toEqual([])
  })
})

describe('V2 contextual quiz', () => {
  it('builds the default radical quiz only from the active lesson', () => {
    const focus = learnRads.slice(0, 5).map((radical) => radical.r)
    const questions = makeSet('rad2th', 5, focus)
    const learnedMeanings = new Set(learnRads.slice(0, 5).map((radical) => radical.th))
    expect(questions).toHaveLength(5)
    expect(questions.every((question) => focus.includes(question.key))).toBe(true)
    expect(questions.every((question) => question.choices.every((choice) => learnedMeanings.has(choice.label)))).toBe(true)
  })
})

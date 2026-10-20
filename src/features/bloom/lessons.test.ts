import { describe, expect, it } from 'vitest'
import { nodeById } from './catalog'
import { bloomSeedGraph } from './seed'
import { strokeChars, strokePath } from '../../data/strokeIndex'
import { existsSync } from 'node:fs'
import { allPracticeWords, dailyExamples, practiceWords, speakingFor, sentencePatterns } from './practice'
import { foundationStarters } from './foundationExpansion'
import { bloomSection, initialReview, reviewQuestions, reviewReducer, sentenceFor, sentenceSets, speakingScenes } from './lessons'

describe('complete learning flows', () => {
  it('has readings, meanings, graph membership and local strokes for every character in every word', () => {
    for (const word of bloomSeedGraph.nodes.filter(node => node.kind === 'word')) {
      for (const char of word.zh) {
        expect(nodeById.get(`c:${char}`), word.zh).toBeDefined()
        expect(strokeChars.has(char), char).toBe(true)
        expect(existsSync(`public/${strokePath(char).replace('./', '')}`), char).toBe(true)
      }
      expect(sentenceFor('meaning', word.zh)?.wordId).toBe(word.id)
    }
  })
  it('keeps Chinese, reading and Thai aligned when changing sentence slots', () => {
    for (const set of sentenceSets) for (const word of set.words) {
      const sentence = sentenceFor(set.id, word)!
      expect(sentence.zh).toContain(word)
      expect(sentence.py.toLowerCase().replace(/\s/g, '')).toContain(nodeById.get(`w:${word}`)!.py.toLowerCase().replace(/\s/g, ''))
      expect(sentence.th.length).toBeGreaterThan(3)
    }
    expect(sentenceFor('identity', '医生')?.zh).toBe('我是医生。')
    expect(sentenceFor('identity', '木材')).toBeNull()
    expect(sentenceFor('meaning', 'not-a-word')).toBeNull()
  })
  it('makes all vocabulary selectable, reviewable and speakable without fabricating example sentences', () => {
    expect(practiceWords()).toHaveLength(149)
    for (const word of allPracticeWords) {
      expect(practiceWords(word.id)[0].id).toBe(word.id)
      const question = reviewQuestions(word.id)[0]
      expect(question.id).toBe(word.id)
      expect(question.options.filter(option => option.id === word.id)).toHaveLength(1)
      expect(new Set(question.options.map(option => option.th)).size).toBe(4)
      const speaking = speakingFor(word.id)!
      expect(speaking.zh).toContain(word.zh)
      expect(speaking.answerPy).toBeTruthy()
      expect(speaking.answerTh).toBeTruthy()
      expect(speaking.hasSentence).toBe(dailyExamples.has(word.zh) || sentencePatterns.some(pattern => (pattern.words as readonly string[]).includes(word.zh)))
    }
    expect(speakingFor('missing')).toBeNull()
  })
  it('covers every foundation word with an authored sentence and keeps root pools specific', () => {
    expect(dailyExamples.size).toBeGreaterThanOrEqual(136)
    for (const root of foundationStarters) for (const word of practiceWords(`c:${root}`)) {
      expect(word.zh).toContain(root)
      expect(sentenceFor('daily', word.zh)).not.toBeNull()
      expect(speakingFor(word.id)?.hasSentence).toBe(true)
    }
    expect(practiceWords('c:月').map(word => word.zh)).toEqual(['月亮', '月份', '每月'])
    expect(reviewQuestions('c:月').map(question => question.id)).toEqual(['w:月亮', 'w:月份', 'w:每月'])
    expect(sentenceFor('daily', '月亮')?.zh).toBe('今晚的月亮很美。')
    expect(speakingFor('w:月亮')?.answer).toBe('今晚的月亮很美。')
    expect(sentenceFor('daily', '学生')).toBeNull()
  })
  it('does not check empty answers or count repeated checks', () => {
    expect(reviewReducer(initialReview, { type: 'check', correctId: 'w:学生' })).toEqual(initialReview)
    const selected = reviewReducer(initialReview, { type: 'choose', id: 'w:学生' })
    const checked = reviewReducer(selected, { type: 'check', correctId: 'w:学生' })
    expect(checked.score).toBe(1)
    expect(reviewReducer(checked, { type: 'check', correctId: 'w:学生' })).toEqual(checked)
    expect(reviewReducer(checked, { type: 'choose', id: 'w:学校' })).toEqual(checked)
  })
  it('finishes a round with correct and wrong answers and resets completely', () => {
    let state = initialReview
    const questions = reviewQuestions('wood')
    questions.forEach((question, index) => {
      state = reviewReducer(state, { type: 'choose', id: index === 1 ? 'wrong' : question.id })
      state = reviewReducer(state, { type: 'check', correctId: question.id })
      state = reviewReducer(state, { type: 'next', total: questions.length })
    })
    expect(state.finished).toBe(true)
    expect(state.score).toBe(2)
    expect(reviewReducer(state, { type: 'restart' })).toEqual(initialReview)
  })
  it('provides unique choices with exactly one matching answer in every group', () => {
    for (const group of ['learning','wood','water','people']) for (const question of reviewQuestions(group)) {
      expect(new Set(question.options.map(option => option.th)).size).toBe(4)
      expect(question.options.filter(option => option.id === question.id)).toHaveLength(1)
    }
  })
  it('supports all new section deep links without taking over legacy links', () => {
    expect(bloomSection('#sentences?word=w:学生')).toBe('sentences')
    expect(bloomSection('#review')).toBe('review')
    expect(bloomSection('#speaking')).toBe('speaking')
    expect(bloomSection('#map?focus=c:木')).toBe('map')
  })
  it('has question, sample answer, pinyin and Thai for both speaking situations', () => {
    expect(speakingScenes).toHaveLength(2)
    for (const scene of speakingScenes) for (const prompt of scene.prompts) {
      for (const value of Object.values(prompt)) expect(value.trim()).not.toBe('')
    }
  })
})

import { splitReviewBatches } from './lessons'
describe('review batch boundaries', () => {
  for (const count of [0, 1, 2, 3, 4, 6, 7, 149]) {
    it(`covers ${count} words exactly once before restarting`, () => {
      const words = Array.from({ length: count }, (_, id) => id)
      const batches = splitReviewBatches(words)
      expect(batches.flat()).toEqual(words)
      expect(batches).toHaveLength(Math.ceil(count / 3))
      expect(batches.every(batch => batch.length > 0 && batch.length <= 3)).toBe(true)
    })
  }
})

it('has a usable sentence for every catalog word', () => {
 for (const word of allPracticeWords) expect(speakingFor(word.id)?.hasSentence, word.zh).toBe(true)
})

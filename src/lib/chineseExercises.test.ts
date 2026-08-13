import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { strokeChars } from '../data/strokeIndex'
import type { ChineseCatalog } from './chineseExercises'
import { hanCharacters } from './chineseExercises'

const catalog = JSON.parse(
  readFileSync(join(process.cwd(), 'public/chinese-writing-fallback.json'), 'utf8'),
) as ChineseCatalog

describe('Chinese Study writing catalog', () => {
  it('contains all 15 lessons with vocabulary and phrases', () => {
    expect(catalog.version).toBe(1)
    expect(catalog.source).toBe('chinese-study')
    expect(catalog.lessons).toHaveLength(15)
    expect(catalog.lessons.every((lesson) => lesson.vocab.length > 0)).toBe(true)
  })

  it('has local stroke data for every exported Chinese character', () => {
    const missing = catalog.lessons.flatMap((lesson) => [...lesson.vocab, ...lesson.phrases])
      .flatMap((item) => hanCharacters(item.zh))
      .filter((char) => !strokeChars.has(char))
    expect([...new Set(missing)]).toEqual([])
  })
})

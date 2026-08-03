/* เทสคุม "ข้อมูลจริงทั้งคลัง" ไม่ใช่แค่ 2-3 เคส
   ข้อมูลชุดนี้เขียนมือหมด → พลาดง่ายมาก 3 แบบ: parts ชี้ตัวที่ไม่มีอยู่, ลืม story/hint,
   และเพิ่มตัวอักษรแล้วลืมรัน `npm run strokes` (ทำให้ปุ่มลำดับขีดกดไม่ได้ตอน deploy) */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { radicals, findRad } from './radicals'
import { hanzi } from './hanzi'
import { RAD_CATS } from './types'
import { strokeChars, strokePath } from './strokeIndex'
import { strokeGroups } from '../lib/strokeGroups'

const hanziMap = new Map(hanzi.map((h) => [h.zh, h]))

describe('radicals.ts', () => {
  it('ไม่มีรากซ้ำ (นับรูปแปรด้วย)', () => {
    const seen = new Map<string, string>()
    for (const r of radicals) {
      for (const ch of [r.r, ...(r.vars ?? [])]) {
        expect(seen.has(ch), `${ch} ซ้ำระหว่าง ${seen.get(ch)} กับ ${r.r}`).toBe(false)
        seen.set(ch, r.r)
      }
    }
  })

  it('ทุกรากมี story / th / py และ cat อยู่ในลิสต์', () => {
    for (const r of radicals) {
      expect(r.story.length, `${r.r} story ว่าง`).toBeGreaterThan(10)
      expect(r.th.length, `${r.r} th ว่าง`).toBeGreaterThan(0)
      expect(r.py.length, `${r.r} py ว่าง`).toBeGreaterThan(0)
      expect(RAD_CATS, `${r.r} cat ไม่รู้จัก: ${r.cat}`).toContain(r.cat)
      expect(r.strokes, `${r.r} strokes ต้อง 1–17`).toBeGreaterThan(0)
      expect(r.strokes).toBeLessThan(18)
    }
  })

  it('รากที่ต้องเรียน (kind rad) มีอย่างน้อย 100 ตัว', () => {
    expect(radicals.filter((r) => r.kind === 'rad').length).toBeGreaterThanOrEqual(100)
  })

  it('ทุกรากเป็นอักขระเดี่ยว 1 ตัว', () => {
    for (const r of radicals) {
      expect([...r.r].length, `${r.r} ไม่ใช่อักขระเดี่ยว`).toBe(1)
      for (const v of r.vars ?? []) expect([...v].length, `${v} ไม่ใช่อักขระเดี่ยว`).toBe(1)
    }
  })
})

describe('hanzi.ts', () => {
  it('ไม่มีตัวอักษรซ้ำ และเป็นอักขระเดี่ยว', () => {
    const seen = new Set<string>()
    for (const h of hanzi) {
      expect([...h.zh].length, `${h.zh} ไม่ใช่อักขระเดี่ยว`).toBe(1)
      expect(seen.has(h.zh), `${h.zh} ซ้ำ`).toBe(false)
      seen.add(h.zh)
    }
  })

  it('ทุก parts ต้องเป็นราก/รูปแปร หรือตัวอักษรอื่นในคลัง (แตกซ้อนชั้นได้)', () => {
    for (const h of hanzi) {
      expect(h.parts.length, `${h.zh} ไม่มี parts`).toBeGreaterThan(0)
      for (const p of h.parts) {
        const ok = !!findRad(p) || hanziMap.has(p)
        expect(ok, `${h.zh}: ส่วนประกอบ "${p}" ไม่มีทั้งใน radicals.ts และ hanzi.ts`).toBe(true)
      }
    }
  })

  it('ทุกตัวมี hint / py / th และ sound (ถ้ามี) ต้องอยู่ใน parts', () => {
    for (const h of hanzi) {
      expect(h.hint.length, `${h.zh} hint ว่าง`).toBeGreaterThan(10)
      expect(h.py.length, `${h.zh} py ว่าง`).toBeGreaterThan(0)
      expect(h.th.length, `${h.zh} th ว่าง`).toBeGreaterThan(0)
      if (h.sound) expect(h.parts, `${h.zh}: sound ${h.sound} ไม่อยู่ใน parts`).toContain(h.sound)
    }
  })

  it('ไม่มีการอ้างวนตัวเอง (ตัวอักษรแตกเป็นตัวเอง)', () => {
    for (const h of hanzi) {
      expect(h.parts, `${h.zh} แตกเป็นตัวเอง`).not.toContain(h.zh)
    }
  })

  it('แตกซ้อนชั้นแล้วต้องจบ ไม่วนลูปไม่สิ้นสุด', () => {
    const depth = (ch: string, seen: string[] = []): number => {
      expect(seen.includes(ch), `วนลูป: ${[...seen, ch].join(' → ')}`).toBe(false)
      const h = hanziMap.get(ch)
      if (!h) return 0
      return 1 + Math.max(...h.parts.map((p) => depth(p, [...seen, ch])))
    }
    for (const h of hanzi) expect(depth(h.zh)).toBeLessThan(6)
  })
})

describe('ลำดับขีด (public/strokes)', () => {
  const fileFor = (ch: string) => join(process.cwd(), 'public', strokePath(ch).replace('./', ''))

  it('ทุกรากและรูปแปรมีไฟล์ลำดับขีด — ถ้าเทสนี้แดง ให้รัน npm run strokes', () => {
    for (const r of radicals) {
      for (const ch of [r.r, ...(r.vars ?? [])]) {
        expect(strokeChars.has(ch), `${ch} ไม่อยู่ใน strokeIndex`).toBe(true)
        expect(existsSync(fileFor(ch)), `ไม่มีไฟล์ ${strokePath(ch)} (${ch})`).toBe(true)
      }
    }
  })

  it('ทุกตัวอักษรในคลังมีไฟล์ลำดับขีด', () => {
    for (const h of hanzi) {
      expect(strokeChars.has(h.zh), `${h.zh} ไม่อยู่ใน strokeIndex`).toBe(true)
      expect(existsSync(fileFor(h.zh)), `ไม่มีไฟล์ ${strokePath(h.zh)} (${h.zh})`).toBe(true)
    }
  })

  it('ตัวอักษรที่แบ่งกลุ่มขีดตามรากได้ ต้องมีอย่างน้อย 150 ตัว', () => {
    const splittable = hanzi.filter((h) => strokeGroups(h.zh) !== null)
    expect(splittable.length).toBeGreaterThanOrEqual(150)
  })

  it('ตัวที่แบ่งกลุ่มขีดไม่ได้ต้องอยู่ในลิสต์ข้อยกเว้นที่ประกาศไว้', () => {
    const expected = new Set(['学', '友', '果', '我', '理', '现', '玩'])
    const actual = hanzi.filter((h) => strokeGroups(h.zh) === null).map((h) => h.zh)

    for (const zh of actual) {
      expect(expected.has(zh), `${zh} แบ่งกลุ่มขีดไม่ได้และยังไม่อยู่ในลิสต์ข้อยกเว้น`).toBe(true)
    }
    expect(new Set(actual)).toEqual(expected)
  })
})

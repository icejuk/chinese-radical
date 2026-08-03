/* SRS (กล่องทวนซ้ำ) + ดาว "ยังไม่แม่น"
   key เป็น "อักขระเดี่ยว" เท่านั้น — ตัวอักษรจาก hanzi.ts หรือรากจาก radicals.ts
   ห้ามใช้คำ/วลีเป็น key (ข้อมูลจะโป่งใน localStorage แล้วไม่โผล่ที่สถิติเลย) */
import { KEYS, readJson, writeJson } from './storage'
import { hanzi } from '../data/hanzi'
import { radicals } from '../data/radicals'
import type { Hanzi } from '../data/types'

const INTERVALS = [0, 1, 2, 4, 7, 15, 30] // จำนวนวันจนถึงรอบทวนถัดไป (index = box)

export type SrsRow = { box: number; due: number; wrong: number; right: number }
export type SrsMap = Record<string, SrsRow>

export const today = () => Math.floor(Date.now() / 86400000)

export const srsGet = () => readJson<SrsMap>(KEYS.srs, {})
export const srsSave = (o: SrsMap) => writeJson(KEYS.srs, o)

export function srsUpdate(zh: string, correct: boolean) {
  const o = srsGet()
  const r = o[zh] ?? { box: 0, due: today(), wrong: 0, right: 0 }
  if (correct) {
    r.right++
    r.box = Math.min(r.box + 1, INTERVALS.length - 1)
    r.due = today() + INTERVALS[r.box]
  } else {
    r.wrong++
    r.box = 1
    r.due = today() // ผิด → กลับมาทวนได้เลยวันนี้
  }
  o[zh] = r
  srsSave(o)
}

/* ---- ดาว ---- */
export const starsGet = () => new Set(readJson<string[]>(KEYS.stars, []))
const starsSave = (s: Set<string>) => writeJson(KEYS.stars, [...s])

export const isStarred = (zh: string) => starsGet().has(zh)

export function toggleStar(zh: string): boolean {
  const s = starsGet()
  if (s.has(zh)) s.delete(zh)
  else s.add(zh)
  starsSave(s)
  return s.has(zh)
}

export function addStar(zh: string) {
  const s = starsGet()
  if (!s.has(zh)) {
    s.add(zh)
    starsSave(s)
  }
}

/* ---- แหล่งความจริงของ SRS/ดาว ---- */
export const allHanzi = (): Hanzi[] => hanzi
/** รากก็ทวนได้ — เก็บ key เดียวกับตัวอักษร เพราะเป็นอักขระเดี่ยวเหมือนกัน */
export const allRadChars = (): string[] => radicals.map((r) => r.r)

export function dueHanzi(): Hanzi[] {
  const o = srsGet()
  const t = today()
  return allHanzi().filter((h) => {
    const r = o[h.zh]
    return !r || r.due <= t
  })
}

export type HanziStat = Hanzi & SrsRow
/** ตัวที่ตอบผิดบ่อยสุดก่อน — ใช้โชว์สถิติหลังจบชุด */
export function weakHanzi(limit = 12): HanziStat[] {
  const o = srsGet()
  return allHanzi()
    .map((h) => ({ ...h, ...(o[h.zh] ?? { box: 0, due: 0, wrong: 0, right: 0 }) }))
    .filter((h) => h.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || a.right - b.right)
    .slice(0, limit)
}

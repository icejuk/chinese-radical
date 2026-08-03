/* ตัวช่วยเรื่องความสัมพันธ์ ราก ↔ ตัวอักษร (ไม่มี state ไม่แตะ DOM — เทสง่าย) */
import { hanzi } from '../data/hanzi'
import { findRad, radicals } from '../data/radicals'
import type { Hanzi, Radical } from '../data/types'

export const hanziMap = new Map(hanzi.map((h) => [h.zh, h]))

/** ตัวอักษรที่ใช้รากนี้ (นับรูปแปรด้วย เช่น 水 ต้องเจอตัวที่ใช้ 氵) */
export function charsUsingRad(rad: Radical): Hanzi[] {
  const forms = new Set([rad.r, ...(rad.vars ?? [])])
  return hanzi.filter((h) => h.parts.some((p) => forms.has(p)))
}

export type Node = {
  ch: string
  /** ราก (ถ้าเป็นราก) */
  rad?: Radical
  /** ตัวอักษรในคลัง (ถ้าแตกต่อได้) */
  hz?: Hanzi
  kids: Node[]
}

/** แตกตัวอักษรเป็นต้นไม้ — ลูกที่เป็นตัวอักษรในคลังจะแตกต่อไปอีกชั้นเอง
    depth จำกัดไว้กันวนลูป (เทสคุมไว้แล้วว่าข้อมูลไม่วน แต่กันพลาดตอนแก้ข้อมูลใหม่) */
export function tree(ch: string, depth = 4): Node {
  const hz = hanziMap.get(ch)
  const rad = findRad(ch)
  const kids =
    depth > 0 && hz ? hz.parts.map((p) => tree(p, depth - 1)) : []
  return { ch, rad, hz, kids }
}

/** ความหมายสั้นๆ ของอักขระ ไม่ว่าจะเป็นรากหรือตัวอักษร — ใช้โชว์ใต้ตัวในแผนภาพ */
export function glossOf(ch: string): { py: string; th: string } | undefined {
  const r = findRad(ch)
  if (r) return { py: r.py, th: r.th }
  const h = hanziMap.get(ch)
  if (h) return { py: h.py, th: h.th }
  return undefined
}

/** ราก (kind rad) ที่ตัวอักษรนี้ใช้ — ใช้ทำตัวเลือกควิซและตัวกรองหน้าคลัง */
export function radsOf(h: Hanzi): Radical[] {
  const out: Radical[] = []
  for (const p of h.parts) {
    const r = findRad(p)
    if (r && r.kind === 'rad' && !out.includes(r)) out.push(r)
  }
  return out
}

export const learnRads = radicals.filter((r) => r.kind === 'rad')

/* ---- สุ่ม ---- */
export function shuffle<T>(a: T[]): T[] {
  const out = [...a]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

/** เลือกตัวลวง n ตัวจาก pool โดยไม่เอาตัวที่ห้าม */
export function distractors<T>(pool: T[], exclude: T[], n: number): T[] {
  return shuffle(pool.filter((x) => !exclude.includes(x))).slice(0, n)
}

/* "ชุดของวันนี้" — คำตอบของคำถาม "วันนี้ควรเรียนอะไร" ที่ผู้ใช้ไม่ควรต้องตัดสินใจเอง
   ลำดับความสำคัญ: ตัวที่ครบกำหนดทวน (SRS) ก่อน → แล้วเติมรากใหม่ตามลำดับใน radicals.ts
   (ลำดับในไฟล์เรียงตามหมวดความหมาย: คน → ร่างกาย → ธรรมชาติ … ซึ่งเป็นลำดับที่เรียนแล้วต่อกันติด)

   ชุดต้องคงที่ตลอดวัน — ไม่สุ่ม เพราะถ้าปิดแอปแล้วเปิดใหม่เจอชุดใหม่ ความคืบหน้า "3/8" จะไร้ความหมาย */
import { KEYS, readJson, writeJson } from './storage'
import { srsGet, today } from './srs'
import { charsUsingRad, learnRads, shuffle } from './tree'
import type { Radical } from '../data/types'

export const DAY_SIZE = 5

type DayLog = { d: number; done: string[]; set?: string[] }

function dayLog(): DayLog {
  const l = readJson<DayLog>(KEYS.day, { d: 0, done: [] })
  if (l.d !== today()) return { d: today(), done: [] }
  return {
    d: l.d,
    done: Array.isArray(l.done) ? l.done.filter((item): item is string => typeof item === 'string') : [],
    set: Array.isArray(l.set) ? l.set.filter((item): item is string => typeof item === 'string') : undefined,
  }
}

/** อักขระที่ดูจบแล้ววันนี้ */
export const doneToday = (): string[] => dayLog().done

export function markDone(ch: string) {
  const l = dayLog()
  if (!l.done.includes(ch)) l.done.push(ch)
  writeJson(KEYS.day, l)
}

/** ชุดรากของวันนี้ — ครบกำหนดทวนก่อน แล้วเติมตัวใหม่ให้ครบ DAY_SIZE */
export function todaySet(size = DAY_SIZE): Radical[] {
  const log = dayLog()

  // ชุดมาตรฐานถูก snapshot ครั้งแรกของวัน แล้วใช้ชุดเดิมแม้ SRS จะเปลี่ยนระหว่างเรียน
  if (size === DAY_SIZE && log.set?.length) {
    const byChar = new Map(learnRads.map((radical) => [radical.r, radical]))
    const saved = log.set.map((char) => byChar.get(char)).filter((item): item is Radical => Boolean(item))
    if (saved.length) return saved
  }

  const srs = srsGet()
  const t = today()

  const due = learnRads.filter((r) => {
    const row = srs[r.r]
    return row && row.due <= t
  })

  /* รากใหม่: เอาตัวที่ "มีตัวอักษรตัวอย่างในคลัง" ขึ้นก่อน
     เพราะเรียนรากแล้วต้องเห็นทันทีว่าเอาไปอ่านตัวจริงตัวไหนได้ ไม่งั้นเหมือนท่องลอยๆ
     (เช่น 刀 ยังไม่มีตัวอักษรตัวอย่างในคลัง — ให้ไปโผล่ทีหลังเมื่อรากที่ใช้ได้จริงหมดแล้ว)
     ภายในแต่ละกลุ่มยังเรียงตามลำดับใน radicals.ts คือไล่ตามหมวดความหมาย */
  const fresh = learnRads.filter((r) => !srs[r.r])
  const withExample = fresh.filter((r) => charsUsingRad(r).length > 0)
  const withoutExample = fresh.filter((r) => charsUsingRad(r).length === 0)

  const out: Radical[] = []
  for (const r of [...due, ...withExample, ...withoutExample]) {
    if (out.length >= size) break
    if (!out.includes(r)) out.push(r)
  }
  // เรียนครบทุกรากแล้วและยังไม่มีอะไรครบกำหนด → ให้ทวนตัวที่ใกล้ครบกำหนดที่สุด
  const selected = out.length === 0
    ? [...learnRads]
      .sort((a, b) => (srs[a.r]?.due ?? 0) - (srs[b.r]?.due ?? 0))
      .slice(0, size)
    : out

  // SRS เป็นคนเลือกสมาชิกของชุด แต่สุ่มลำดับเพียงครั้งเดียวตอนสร้างชุดประจำวัน
  // แล้วเก็บลำดับที่สุ่มได้ลง day log จึงไม่สลับใหม่เมื่อ refresh หรือเปิดแอปซ้ำ
  const ordered = size === DAY_SIZE ? shuffle(selected) : selected

  if (size === DAY_SIZE) {
    writeJson(KEYS.day, { ...log, set: ordered.map((radical) => radical.r) })
  }

  return ordered
}

export type DayStats = {
  /** จำนวนรากที่เคยเรียนแล้ว (มีใน SRS) */
  learned: number
  total: number
  /** ครบกำหนดทวนวันนี้ */
  due: number
  /** ดูจบแล้ววันนี้กี่ตัว */
  done: number
}

export function dayStats(): DayStats {
  const srs = srsGet()
  const t = today()
  return {
    learned: learnRads.filter((r) => srs[r.r]).length,
    total: learnRads.length,
    due: learnRads.filter((r) => srs[r.r] && srs[r.r].due <= t).length,
    done: doneToday().length,
  }
}

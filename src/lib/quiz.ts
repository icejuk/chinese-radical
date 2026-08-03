/* สร้างข้อควิซจากข้อมูลจริง — logic ล้วน ไม่แตะ DOM
   ตัวลวงต้องมาจาก pool เดียวกับคำตอบ (เช่น ความหมายไทยของรากอื่น) ไม่ใช่ข้อความสุ่ม
   ไม่งั้นเดาถูกได้ด้วยการตัดตัวเลือกที่ดู "ไม่เข้าพวก" ทิ้ง */
import { hanzi } from '../data/hanzi'
import { learnRads, radsOf, distractors, pick, shuffle } from './tree'
import type { Hanzi, Radical } from '../data/types'

export type QuizMode = 'rad2th' | 'th2rad' | 'char2rad' | 'char2th'

export const QUIZ_MODES: { v: QuizMode; label: string; desc: string }[] = [
  { v: 'rad2th', label: 'ราก → ความหมาย', desc: 'เห็นราก เลือกว่าแปลว่าอะไร' },
  { v: 'th2rad', label: 'ความหมาย → ราก', desc: 'เห็นความหมาย เลือกรากที่ถูก' },
  { v: 'char2rad', label: 'ตัวอักษร → ราก', desc: 'ตัวนี้ประกอบจากรากอะไร' },
  { v: 'char2th', label: 'เดาความหมายจากราก', desc: 'เห็นรากที่ประกอบ เดาว่าตัวนี้แปลว่าอะไร' },
]

export type Question = {
  /** key ที่ใช้เขียน SRS — อักขระเดี่ยวเท่านั้น */
  key: string
  /** โจทย์ที่แสดงตัวใหญ่ (ตัวจีน) — ว่างได้ถ้าโจทย์เป็นข้อความ */
  glyph?: string
  /** โจทย์ที่เป็นข้อความไทย */
  prompt: string
  /** คำใบ้ใต้โจทย์ (เช่น รากที่ประกอบ) */
  sub?: string
  choices: { label: string; glyph?: string; sub?: string }[]
  answer: number
  /** เฉลยแบบอธิบาย โชว์หลังตอบ */
  explain: string
}

const radTh = (r: Radical) => r.th

function qRad2Th(): Question {
  const r = pick(learnRads)
  const wrong = distractors(learnRads, [r], 3)
  const opts = shuffle([r, ...wrong])
  return {
    key: r.r,
    glyph: r.r,
    prompt: 'รากนี้แปลว่าอะไร',
    sub: `${r.py} · ${r.strokes} ขีด`,
    choices: opts.map((o) => ({ label: radTh(o) })),
    answer: opts.indexOf(r),
    explain: r.story,
  }
}

function qTh2Rad(): Question {
  const r = pick(learnRads)
  const wrong = distractors(learnRads, [r], 3)
  const opts = shuffle([r, ...wrong])
  return {
    key: r.r,
    prompt: `รากที่แปลว่า "${r.th}" คือตัวไหน`,
    choices: opts.map((o) => ({ label: o.py, glyph: o.r })),
    answer: opts.indexOf(r),
    explain: `${r.r} (${r.py}) = ${r.th} — ${r.story}`,
  }
}

/** ตัวอักษร → เลือกรากที่ประกอบอยู่จริง (เอาราก 1 ตัวเป็นคำตอบ ตัวลวงคือรากที่ไม่ได้อยู่ในตัวนั้น) */
function qChar2Rad(): Question | null {
  const pool = hanzi.filter((h) => radsOf(h).length > 0)
  if (!pool.length) return null
  const h = pick(pool)
  const rads = radsOf(h)
  const ans = pick(rads)
  const wrong = distractors(learnRads, rads, 3)
  const opts = shuffle([ans, ...wrong])
  return {
    key: h.zh,
    glyph: h.zh,
    prompt: 'ตัวนี้มีรากตัวไหนอยู่ข้างใน',
    sub: `${h.py} · ${h.th}`,
    choices: opts.map((o) => ({ label: o.th, glyph: o.r })),
    answer: opts.indexOf(ans),
    explain: `${h.zh} = ${h.parts.join(' + ')} → ${h.hint}`,
  }
}

/** เห็นรากที่ประกอบ + พินอิน แล้วเดาความหมายไทยของตัวอักษร */
function qChar2Th(): Question | null {
  const pool = hanzi.filter((h) => h.parts.length >= 2)
  if (!pool.length) return null
  const h = pick(pool)
  const wrong = distractors(pool, [h], 3) as Hanzi[]
  const opts = shuffle([h, ...wrong])
  return {
    key: h.zh,
    glyph: h.zh,
    prompt: 'ตัวนี้แปลว่าอะไร',
    sub: `อ่าน ${h.py} · ประกอบจาก ${h.parts.join(' + ')}`,
    choices: opts.map((o) => ({ label: o.th })),
    answer: opts.indexOf(h),
    explain: h.hint,
  }
}

export function makeQuestion(mode: QuizMode): Question {
  switch (mode) {
    case 'rad2th':
      return qRad2Th()
    case 'th2rad':
      return qTh2Rad()
    case 'char2rad':
      return qChar2Rad() ?? qRad2Th()
    case 'char2th':
      return qChar2Th() ?? qRad2Th()
  }
}

/** ชุดข้อที่ไม่ซ้ำ key ติดกัน — ซ้ำติดกันทำให้รู้สึกว่าแบบฝึกพัง */
export function makeSet(mode: QuizMode, n: number): Question[] {
  const out: Question[] = []
  let guard = 0
  while (out.length < n && guard < n * 30) {
    guard++
    const q = makeQuestion(mode)
    if (out.length && out[out.length - 1].key === q.key) continue
    out.push(q)
  }
  return out
}

/* แบ่งขีดของตัวอักษรออกเป็นกลุ่มตามราก — ให้ StrokePad เล่นทีละราก แล้วหยุดพักก่อนไปรากถัดไป
   (ดูตัวอักษรวิ่งทีละก้อนตามราก ช่วยจำ "河 = 氵 + 可" ได้เร็วกว่าเห็นแค่ 8 ขีดรวมๆ)

   ⚠️ ต้องใช้จำนวนขีด "จริง" จาก strokeCount (อ่านจากไฟล์ข้อมูลเส้น) ห้ามใช้ Radical.strokes
   ที่เขียนมือ เพราะค่านั้นเป็นของรูปเต็ม เช่น 手=4 ขีด แต่รูปแปรในตัวจริง 扌=3 ขีด
   ถ้าผลรวมขีดของ parts ไม่เท่ากับขีดจริงของตัวอักษร ให้ถือว่า "แบ่งไม่ปลอดภัย" คืน null ไปเลย
   (สาเหตุมักเป็นรูปย่อที่ขีดไม่ตรงกับรูปเต็ม เช่น 学 友 果 我 理 现 玩) */
import { findRad } from '../data/radicals'
import { strokeCount } from '../data/strokeIndex'
import { hanziMap } from './tree'

export type StrokeGroup = {
  part: string
  /** ป้ายที่โชว์ตอนเล่น เช่น "氵 (น้ำ)" หรือ "可 (บอกเสียง)" */
  label: string
  /** index ขีดแรก/ขีดสุดท้ายของกลุ่มนี้ (นับจาก 0, รวมปลาย) */
  from: number
  to: number
}

function labelOf(part: string): string {
  const r = findRad(part)
  if (r) return r.kind === 'sound' ? `${part} (บอกเสียง)` : `${part} (${r.th})`
  const h = hanziMap.get(part)
  return h ? `${part} (${h.th})` : part
}

/** คืน null ถ้าแบ่งกลุ่มขีดตาม parts ไม่ได้อย่างปลอดภัย */
export function strokeGroups(zh: string): StrokeGroup[] | null {
  const h = hanziMap.get(zh)
  if (!h || h.parts.length < 2) return null

  const total = strokeCount[zh]
  if (total == null) return null

  let cursor = 0
  const groups: StrokeGroup[] = []
  for (const part of h.parts) {
    const n = strokeCount[part]
    if (n == null) return null
    groups.push({ part, label: labelOf(part), from: cursor, to: cursor + n - 1 })
    cursor += n
  }

  return cursor === total ? groups : null
}

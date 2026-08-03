/* เมนู 2 ระดับ: กลุ่ม (แถบล่าง) → แท็บย่อย (ชิปแบบแท็บกระดาษด้านบน)
   ไอคอนใช้ "ตัวจีนตัวเดียว" ไม่ใช่ emoji — เข้ากับธีมตำรา และผู้ใช้ได้เห็นตัวจีนซ้ำๆ ไปด้วย

   ⚠️ ตารางราก (`radicals`) ต้องเป็นแท็บนอกสุด/หน้าแรก — ผู้ใช้บอกชัดว่าไม่ควรอยู่ลึก
   และห้ามมีหน้าที่ "บังคับว่าวันนี้ต้องเรียนอะไร" มาขวางเป็นหน้าแรก (ข้อเสนอวันนี้เป็นการ์ดเล็กบนตารางแทน) */
import { KEYS, readRaw, writeRaw } from './lib/storage'

export type TabId = 'radicals' | 'learn' | 'quiz' | 'write' | 'breakdown' | 'chars'

export type NavItem = { t: TabId; label: string; icon: string }
export type NavGroup = { key: string; label: string; icon: string; items: NavItem[] }

export const GROUPS: NavGroup[] = [
  {
    key: 'rads',
    label: 'ราก',
    icon: '部',
    items: [{ t: 'radicals', label: 'ตารางราก', icon: '部' }],
  },
  {
    key: 'learn',
    label: 'เรียน',
    icon: '学',
    items: [{ t: 'learn', label: 'เรียนทีละราก', icon: '学' }],
  },
  {
    key: 'drill',
    label: 'ฝึก',
    icon: '练',
    items: [
      { t: 'quiz', label: 'ควิซ', icon: '问' },
      { t: 'write', label: 'ฝึกเขียน', icon: '写' },
    ],
  },
  {
    key: 'find',
    label: 'ค้น',
    icon: '查',
    items: [
      { t: 'breakdown', label: 'แตกตัวอักษร', icon: '析' },
      { t: 'chars', label: 'คลังตัวอักษร', icon: '字' },
    ],
  },
]

const ALL: NavItem[] = GROUPS.flatMap((g) => g.items)

export const isTab = (s: string): s is TabId => ALL.some((i) => i.t === s)

export const itemOf = (t: TabId): NavItem => ALL.find((i) => i.t === t)!

export const groupOf = (t: TabId): NavGroup => GROUPS.find((g) => g.items.some((i) => i.t === t))!

export const tabForGroup = (key: string): TabId => GROUPS.find((g) => g.key === key)!.items[0].t

export function initialTab(): TabId {
  const h = location.hash.replace(/^#/, '')
  if (isTab(h)) return h
  const saved = readRaw(KEYS.nav)
  // เปิดแอปมาเจอตารางรากทั้งหมด — เลือกเองได้ว่าจะเริ่มตัวไหน
  return saved && isTab(saved) ? saved : 'radicals'
}

export function rememberTab(t: TabId) {
  writeRaw(KEYS.nav, t)
  if (location.hash.replace(/^#/, '') !== t) location.hash = t
}

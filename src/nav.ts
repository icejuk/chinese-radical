/* เมนู 2 ระดับ: กลุ่ม (tab bar ล่างบนมือถือ) → แท็บย่อย (ชิปด้านบน / sidebar บนจอกว้าง) */
import { KEYS, readRaw, writeRaw } from './lib/storage'

export type TabId = 'radicals' | 'breakdown' | 'quiz' | 'write' | 'chars'

export type NavItem = { t: TabId; label: string; icon: string }
export type NavGroup = { key: string; label: string; icon: string; items: NavItem[] }

export const GROUPS: NavGroup[] = [
  {
    key: 'learn',
    label: 'เรียน',
    icon: '📖',
    items: [
      { t: 'radicals', label: 'รากศัพท์', icon: '🌱' },
      { t: 'breakdown', label: 'แตกตัวอักษร', icon: '🌳' },
    ],
  },
  {
    key: 'drill',
    label: 'ฝึก',
    icon: '🎯',
    items: [
      { t: 'quiz', label: 'ควิซ', icon: '🎯' },
      { t: 'write', label: 'ฝึกเขียน', icon: '✍️' },
    ],
  },
  {
    key: 'lib',
    label: 'คลัง',
    icon: '📚',
    items: [{ t: 'chars', label: 'คลังตัวอักษร', icon: '📚' }],
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
  return saved && isTab(saved) ? saved : 'radicals'
}

export function rememberTab(t: TabId) {
  writeRaw(KEYS.nav, t)
  // เขียน hash เพื่อให้ปุ่ม back ของเบราว์เซอร์ใช้ได้ (replace ไม่ได้ ไม่งั้น back ไม่มีอะไรให้ย้อน)
  if (location.hash.replace(/^#/, '') !== t) location.hash = t
}

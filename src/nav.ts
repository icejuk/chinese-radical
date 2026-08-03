/* V2 ใช้เมนูระดับเดียว 3 ปุ่มเท่านั้น
   เปิดแอปมาเรียนได้ทันที ส่วนหน้ารายละเอียดถือเป็นส่วนหนึ่งของ "ค้น" */
import { KEYS, readRaw, writeRaw } from './lib/storage'

export type TabId = 'learn' | 'practice' | 'explore' | 'detail'
export type RootTab = Exclude<TabId, 'detail'>

export type NavItem = {
  t: RootTab
  label: string
  icon: string
  title: string
}

export const NAV_ITEMS: NavItem[] = [
  { t: 'learn', label: 'วันนี้', icon: '学', title: 'เรียนวันนี้' },
  { t: 'practice', label: 'ฝึก', icon: '练', title: 'ฝึกให้จำ' },
  { t: 'explore', label: 'ค้น', icon: '查', title: 'ค้นรากและตัวอักษร' },
]

export const isTab = (value: string): value is TabId =>
  value === 'learn' || value === 'practice' || value === 'explore' || value === 'detail'

export const rootOf = (tab: TabId): RootTab => (tab === 'detail' ? 'explore' : tab)

export const titleOf = (tab: TabId): string =>
  tab === 'detail' ? 'เข้าใจตัวอักษร' : NAV_ITEMS.find((item) => item.t === tab)!.title

export function initialTab(): TabId {
  const hash = location.hash.replace(/^#/, '')
  if (isTab(hash)) return hash

  const saved = readRaw(KEYS.nav)
  if (saved && isTab(saved)) return saved

  // ค่าจาก V1: พากลับเข้ากลุ่มใหม่ที่ใกล้เคียง โดยไม่ทำให้ bookmark เก่าพัง
  if (hash === 'quiz' || hash === 'write') return 'practice'
  if (hash === 'radicals' || hash === 'chars' || hash === 'breakdown') return 'explore'
  return 'learn'
}

export function rememberTab(tab: TabId) {
  // detail ไม่มีอักขระอยู่ใน URL จึงไม่ควรบันทึก/เขียน hash แล้วพา reload ไปเปิด 河 แบบผิดบริบท
  if (tab === 'detail') return
  writeRaw(KEYS.nav, tab)
  if (location.hash.replace(/^#/, '') !== tab) location.hash = tab
}

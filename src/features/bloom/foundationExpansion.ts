import type { MapNode } from './map'

// Starting characters for exploration; this is not a list of formal dictionary radicals.
export const foundationStarters = ['口', '心', '手', '火', '山', '月'] as const
const characters = [
  ['口', 'kǒu', 'ปาก / ช่องเปิด'], ['心', 'xīn', 'ใจ / หัวใจ'],
  ['手', 'shǒu', 'มือ'], ['火', 'huǒ', 'ไฟ'],
  ['山', 'shān', 'ภูเขา'], ['月', 'yuè', 'ดวงจันทร์ / เดือน'],
  ['小', 'xiǎo', 'เล็ก'], ['双', 'shuāng', 'คู่ / สอง'],
  ['亮', 'liàng', 'สว่าง'], ['份', 'fèn', 'ส่วน / ชุด'], ['每', 'měi', 'แต่ละ / ทุก'],
]
const words = [
  ['门口', 'ménkǒu', 'หน้าประตู / ทางเข้า'],
  ['开口', 'kāikǒu', 'อ้าปาก / เริ่มพูด'],
  ['出口', 'chūkǒu', 'ทางออก'],
  ['开心', 'kāixīn', 'ดีใจ / มีความสุข'],
  ['小心', 'xiǎoxīn', 'ระวัง'],
  ['关心', 'guānxīn', 'ห่วงใย / ใส่ใจ'],
  ['手机', 'shǒujī', 'โทรศัพท์มือถือ'],
  ['手工', 'shǒugōng', 'งานฝีมือ / ทำด้วยมือ'],
  ['双手', 'shuāngshǒu', 'มือทั้งสองข้าง'],
  ['火车', 'huǒchē', 'รถไฟ'],
  ['火山', 'huǒshān', 'ภูเขาไฟ'],
  ['大火', 'dàhuǒ', 'ไฟไหม้ใหญ่'],
  ['高山', 'gāoshān', 'ภูเขาสูง'],
  ['上山', 'shàngshān', 'ขึ้นเขา'],
  ['山水', 'shānshuǐ', 'ภูเขาและสายน้ำ / ทิวทัศน์'],
  ['月亮', 'yuèliang', 'ดวงจันทร์'],
  ['月份', 'yuèfèn', 'เดือนในปฏิทิน'],
  ['每月', 'měiyuè', 'ทุกเดือน'],
]
export const foundationExpansionNodes: MapNode[] = [
  ...characters.map(([zh, py, th]) => ({ id: `c:${zh}`, kind: 'character' as const, zh, py, th, group: 'learning' })),
  ...words.map(([zh, py, th]) => ({ id: `w:${zh}`, kind: 'word' as const, zh, py, th, group: 'learning' })),
]

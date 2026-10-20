import type { MapNode } from './map'

// Everyday date/day vocabulary. Thai glosses are authored for BLOOM.
const characters = [
  ['子', 'zǐ', 'ลูก / เด็ก (ใน日子อ่านเสียงเบา zi)'],
  ['记', 'jì', 'จด / จำ'], ['历', 'lì', 'ผ่าน / ปฏิทิน (ในคำประสม)'],
  ['出', 'chū', 'ออก'], ['落', 'luò', 'ตก / ร่วง'], ['节', 'jié', 'เทศกาล / ข้อ / ช่วง'],
]
const words = [
  ['日子', 'rìzi', 'วัน / วันเวลา'], ['日期', 'rìqī', 'วันที่'],
  ['日记', 'rìjì', 'บันทึกประจำวัน'], ['日历', 'rìlì', 'ปฏิทิน'],
  ['日出', 'rìchū', 'พระอาทิตย์ขึ้น'], ['日落', 'rìluò', 'พระอาทิตย์ตก'],
  ['节日', 'jiérì', 'วันเทศกาล'], ['假日', 'jiàrì', 'วันหยุด'],
  ['平日', 'píngrì', 'วันปกติ / ตามปกติ'], ['工作日', 'gōngzuòrì', 'วันทำงาน'],
]
export const dailyExpansionNodes: MapNode[] = [
  ...characters.map(([zh, py, th]) => ({ id: `c:${zh}`, kind: 'character' as const, zh, py, th, group: 'learning' })),
  ...words.map(([zh, py, th]) => ({ id: `w:${zh}`, kind: 'word' as const, zh, py, th, group: 'learning' })),
]

/* อัปเดต bundled fallback จาก endpoint สาธารณะของ chinese.icejuk.dev
   หลัง sync จะให้ `npm run strokes` สร้างข้อมูลลำดับขีดให้ครบทุกอักษรในชุดใหม่ */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const url = 'https://chinese.icejuk.dev/api/writing-exercises.json'
const response = await fetch(url)
if (!response.ok) throw new Error(`โหลด ${url} ไม่สำเร็จ (${response.status})`)

const catalog = await response.json()
if (catalog?.version !== 1 || catalog?.source !== 'chinese-study' || !Array.isArray(catalog?.lessons)) {
  throw new Error('รูปแบบ writing exercises จาก Chinese Study ไม่ถูกต้อง')
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const output = join(root, 'public/chinese-writing-fallback.json')
writeFileSync(output, `${JSON.stringify(catalog, null, 2)}\n`)
console.log(`✓ sync แบบฝึกจาก ${url} → public/chinese-writing-fallback.json`)

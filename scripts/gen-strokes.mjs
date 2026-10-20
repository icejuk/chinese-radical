/* ดึงข้อมูลลำดับขีดจาก node_modules/hanzi-writer-data → public/strokes/
   ทำไมต้องก็อป: แพ็กเกจต้นทางมี 9,000+ ตัว (~32MB) ใหญ่เกินจะใส่ repo และ precache ทั้งก้อน
   เราใช้จริงแค่ ~200 ตัว (ราก + รูปแปร + ตัวอักษรในคลัง)

   ชื่อไฟล์เป็น codepoint hex ไม่ใช่ตัวจีน — กันปัญหา URL encoding และการ normalize ชื่อไฟล์ยูนิโคดบน macOS

   รันด้วย: npm run strokes  (ต้องรันใหม่ทุกครั้งที่เพิ่มราก/ตัวอักษร — มีเทสคุมว่าไฟล์ครบ) */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'node_modules', 'hanzi-writer-data')
const outDir = join(root, 'public', 'strokes')

if (!existsSync(dataDir)) {
  console.error('✗ ไม่พบ node_modules/hanzi-writer-data — รัน npm install ก่อน')
  process.exit(1)
}

/** ดึงอักขระจีนทุกตัวที่ปรากฏใน field ที่ระบุของไฟล์ .ts (อ่านเป็นข้อความ ไม่ต้อง import TS) */
function charsFrom(file, patterns) {
  const src = readFileSync(join(root, 'src', 'data', file), 'utf8')
  const out = new Set()
  for (const re of patterns) {
    for (const m of src.matchAll(re)) {
      for (const ch of m[1].match(/[㐀-鿿\u{20000}-\u{2a6df}]/gu) ?? []) out.add(ch)
    }
  }
  return out
}

const wanted = new Set([
  // ราก + รูปแปร จาก radicals.ts
  ...charsFrom('radicals.ts', [/\{ r: '(.)'/g, /vars: \[([^\]]+)\]/g]),
  // ตัวอักษร + parts จาก hanzi.ts
  ...charsFrom('hanzi.ts', [/\{ zh: '(.)'/g, /parts: \[([^\]]+)\]/g]),
])

// BLOOM vocabulary, including all characters in compound words.
for (const file of ['seed.ts', 'woodExpansion.ts', 'peopleExpansion.ts', 'dailyExpansion.ts', 'foundationExpansion.ts', 'characterCatalog.ts']) {
  const source = readFileSync(join(root, 'src', 'features', 'bloom', file), 'utf8')
  const patterns = file === 'seed.ts' ? [/"zh": "([^"]+)"/g] : [/\['([^']+)',/g]
  for (const pattern of patterns) for (const match of source.matchAll(pattern)) {
    for (const ch of match[1].match(/[㐀-鿿]/gu) ?? []) wanted.add(ch)
  }
}

// คำ/วลีจาก chinese.icejuk.dev ที่ sync มาเป็น fallback สำหรับโหมดฝึกเขียนจากบทเรียน
const chineseFallback = join(root, 'public', 'chinese-writing-fallback.json')
if (existsSync(chineseFallback)) {
  const catalog = JSON.parse(readFileSync(chineseFallback, 'utf8'))
  for (const lesson of catalog.lessons ?? []) {
    for (const item of [...(lesson.vocab ?? []), ...(lesson.phrases ?? [])]) {
      for (const ch of item.zh?.match(/[㐀-鿿\u{20000}-\u{2a6df}]/gu) ?? []) wanted.add(ch)
    }
  }
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

const have = []
const missing = []
const count = {} // อักขระ → จำนวนขีดจริง (มาจาก strokes.length ในไฟล์)
let bytes = 0

for (const ch of [...wanted].sort()) {
  const src = join(dataDir, `${ch}.json`)
  if (!existsSync(src)) {
    missing.push(ch)
    continue
  }
  const json = readFileSync(src, 'utf8')
  const code = ch.codePointAt(0).toString(16)
  writeFileSync(join(outDir, `${code}.json`), json)
  bytes += json.length
  have.push(ch)
  // เก็บจำนวนขีด "จริง" จากไฟล์ — ใช้แบ่งกลุ่มขีดตามราก (lib/strokeGroups.ts)
  // ห้ามใช้ Radical.strokes ที่เขียนมือแทน เพราะค่านั้นเป็นของรูปเต็ม (手=4) ไม่ใช่รูปแปร (扌=3)
  count[ch] = JSON.parse(json).strokes.length
}

// index ให้ฝั่ง UI เช็คก่อนเรนเดอร์ — ไม่ต้อง fetch เดาแล้วเจอ 404
writeFileSync(
  join(root, 'src', 'data', 'strokeIndex.ts'),
  `/* สร้างอัตโนมัติด้วย \`npm run strokes\` — ห้ามแก้มือ
   อักขระที่มีข้อมูลลำดับขีดใน public/strokes/<codepoint>.json */
export const strokeChars = new Set(${JSON.stringify(have.join(''))}.split(''))

/** จำนวนขีดจริงของแต่ละอักขระ (มาจาก strokes.length ในไฟล์ข้อมูล)
    ใช้คำนวณว่าตัวอักษรหนึ่งแบ่งขีดตามรากได้ยังไง — ดู src/lib/strokeGroups.ts */
export const strokeCount: Record<string, number> = ${JSON.stringify(count)}

/** พาธไฟล์ลำดับขีดของอักขระ (ชื่อไฟล์เป็น codepoint hex) */
export const strokePath = (ch: string) => \`./strokes/\${ch.codePointAt(0)!.toString(16)}.json\`
`,
)

// ไลเซนส์ของข้อมูล — ARPHIC PL บังคับให้แนบไปกับข้อมูลที่แจกจ่าย
const lic = join(dataDir, 'ARPHICPL.TXT')
if (existsSync(lic)) writeFileSync(join(outDir, 'ARPHICPL.TXT'), readFileSync(lic))

console.log(`✓ เขียน ${have.length} ไฟล์ (${(bytes / 1024).toFixed(0)} KB) → public/strokes/`)
console.log(`  ไฟล์ในโฟลเดอร์: ${readdirSync(outDir).length}`)
if (missing.length) console.log(`⚠ ไม่มีข้อมูลลำดับขีด ${missing.length} ตัว: ${missing.join(' ')}`)

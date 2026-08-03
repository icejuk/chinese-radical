# chinese-radical — 字根 (Zì Gēn)

PWA จำ **ตัวอักษรจีน** ด้วยการแตกเป็นรากศัพท์ (部首/偏旁) สำหรับผู้เรียนชาวไทย

- repo: `git@github.com:icejuk/chinese-radical.git`
- deploy: **Vercel auto-deploy เมื่อ push ขึ้น main** (build ตาม `vercel.json`: `npm run build` → เสิร์ฟ `dist/`)
- dev preview: `preview_start {name:'chinese-radical'}` → port 3470 (config อยู่ที่ `../.claude/launch.json`) — **ห้ามรัน dev server ด้วย Bash**
- build ที่แปลงแล้ว (เช็ค PWA/offline จริง): `preview_start {name:'chinese-radical-build'}` → port 3471 (ต้อง `npm run build` ก่อน)

---

## ⛔ ข้อห้ามที่สำคัญที่สุด

### 1. ห้าม commit / push จนกว่าจะได้รับอนุญาต — ทุกครั้ง

คำสั่ง "push"/"commit" ครอบ**เฉพาะสิ่งที่อยู่ใน working tree ตอนที่สั่งนั้น** งานหลังจากนั้นต้องขอใหม่ทุกครั้ง
**ทำเสร็จ → หยุด → สรุปว่าแก้อะไร + แสดงสกรีนช็อต → รอผู้ใช้สั่ง**

### 2. ที่นี่ "ต้องอ่านตัวจีน" — ตรงข้ามกับ chinese-study

`chinese-study` (แอปพี่น้องกัน) มีข้อห้ามว่าห้ามให้ผู้ใช้อ่านฮั่นจื่อเพื่อตอบ เพราะตอนนั้นผู้ใช้อ่านไม่ได้
**แอปนี้สร้างขึ้นเพื่อแก้ข้อจำกัดนั้นโดยตรง** — ตัวจีนเป็นพระเอก แสดงใหญ่ ตอบจากการดูตัวจีนได้

แต่ยังต้อง:
- มี **พินอิน + ไทย กำกับทุกที่** ที่โชว์ตัวจีน (ทั้งการ์ด ตัวเลือก และเฉลย)
- **ห้ามให้เดาเสียงจากตัวอักษรล้วน** — รากบอกความหมาย ไม่บอกเสียง ถ้าจะถามเสียงต้องมีตัวเลือกพินอินให้
- โจทย์หน้าฝึกเขียนเป็นพินอิน+ไทย (ไม่โชว์ตัวจีนให้ลอก) แต่ต้องมีปุ่ม "ดูตัวอย่าง" ให้กดเองได้

### 3. ห้ามใส่ไฟล์/asset ภายนอก

ต้องทำงาน offline → ห้าม CDN, ห้าม external font/script/image (ฟอนต์ใช้ระบบล้วนผ่าน `--font`/`--font-zh`)
`hanzi-writer` เป็น **npm dependency ไม่ใช่ CDN** และข้อมูลเส้นถูกก็อปเข้า `public/strokes/` แล้ว precache
ยกเว้นเดียว: Google Translate TTS (fallback เสียง) ที่ `runtimeCaching` ใน `vite.config.ts` แคชไว้ให้

### 4. ห้ามมี auto-advance เมื่อ "ตอบผิด" หรือ "ดูเฉลย"

- **ตอบถูก** → เด้งข้อถัดไปเองได้ (~1s)
- **ตอบผิด / เขียนจบในหน้าฝึกเขียน** → **ต้องกดปุ่มไปข้อถัดไปเอง** ไม่มี timeout ใดๆ
  (หน้าฝึกเขียนไม่มี auto-advance เลย เพราะต้องมีเวลาดูตัวที่เขียนเสร็จ)

### 5. ห้ามใส่ `Co-Authored-By` ท้าย commit message

### 6. ห้ามแก้ `src/data/strokeIndex.ts` ด้วยมือ

ไฟล์นี้ `npm run strokes` สร้างให้ — เพิ่มราก/ตัวอักษรแล้ว **ต้องรัน `npm run strokes` ใหม่**
ไม่งั้นปุ่มลำดับขีดจะกดไม่ได้ (มีเทสคุมไว้ ถ้าลืมเทสจะแดง)

---

## โครงสร้าง

```
package.json / vite.config.ts / tsconfig.json / vercel.json
scripts/gen-strokes.mjs        ← ก็อปข้อมูลลำดับขีดจาก node_modules → public/strokes/ + gen strokeIndex.ts
public/strokes/*.json          ← ข้อมูลเส้น ชื่อไฟล์เป็น codepoint hex (commit เข้า repo ด้วย)
src/
  main.tsx, App.tsx, nav.ts    ← nav 2 ระดับ (sidebar จอกว้าง / tab bar ล่างมือถือ)
  data/                        ← radicals.ts · hanzi.ts · types.ts · strokeIndex.ts (auto) · radicals.test.ts
  lib/                         ← tree.ts (ราก↔ตัวอักษร) · quiz.ts · srs.ts · tts.ts · storage.ts
  components/                  ← StrokePad.tsx (hanzi-writer wrapper) · SpeakButton · ui.tsx
  screens/                     ← RadicalsScreen · BreakdownScreen · QuizScreen · WriteScreen · CharsScreen
  styles/                      ← tokens.css (ธีมหยก + dark) · base.css · layout.css · screens.css
```

### ข้อมูล (ตัวเลขจริง ณ 2026-08-03)

| ไฟล์ | ปริมาณ |
|---|---|
| `radicals.ts` | ราก `kind:'rad'` **115 ตัว** + ส่วนบอกเสียง `kind:'sound'` **24 ตัว** |
| `hanzi.ts` | ตัวอักษร **167 ตัว** (จาก HSK 1–2) · 40 ตัวมีคำตัวอย่าง |
| `public/strokes/` | 319 ไฟล์ ~580 KB |

- `parts` ของตัวอักษรชี้ได้ทั้ง **ราก/รูปแปร** และ **ตัวอักษรอื่นในคลัง** → แผนภาพแตกซ้อนชั้นได้เอง
- `kind:'sound'` = ส่วนที่บอกเสียงไม่บอกความหมาย (可 ใน 河) — หน้าเรียนไม่โชว์ โผล่แค่ตอนแตกตัวอักษร

### localStorage (`src/lib/storage.ts` → `KEYS`)

`cr-nav` · `cr-srs` · `cr-star` · `cr-rf` (ตัวกรองหน้าราก) · `cr-cf` (ตัวกรองหน้าคลัง) · `cr-wsrc` (ชุดฝึกเขียน)

prefix `cr-` ตั้งใจให้ต่างจาก `xy-*` ของ chinese-study — **ห้ามใช้ `xy-*`**

---

## กับดักที่เคยเจอมาแล้ว (อย่าทำซ้ำ)

1. **HanziWriter ผูกกับ DOM node จริง** — ต้อง `node.innerHTML = ''` ทั้งตอนสร้างและตอน cleanup
   ไม่งั้น StrictMode (dev) จะสร้าง svg ซ้อนสองอัน และเปลี่ยนตัวอักษรแล้ว svg เก่าค้าง
2. **hanzi-writer รับสีเป็นค่าตรงๆ ไม่รู้จัก CSS variable** — ต้องอ่านค่าที่คำนวณแล้วด้วย `getComputedStyle`
   และฟัง `matchMedia('(prefers-color-scheme: dark)')` เพื่อ `updateColor` เมื่อผู้ใช้สลับธีม (ดู `StrokePad.tsx`)
3. **รูปแปรบางตัวไม่มีข้อมูลลำดับขีด** — เช่น ⺮ (U+2EAE, บล็อก Kangxi Supplement)
   ห้ามใส่อักขระบล็อกนั้นใน `vars` ให้อธิบายด้วย `story` แทน
4. **王 กับ 玉 หน้าตาเหมือนกันเมื่ออยู่ซ้าย** — ห้ามใส่ `王` เป็น `vars` ของ `玉` (จะซ้ำกับรากเดี่ยว 王 และ `findRad` คลุมเครือ)
   ในข้อมูลให้เขียน `parts: ['玉', …]` สำหรับตัวที่หมายถึงหยก (理 现 玩) แล้วอธิบายใน `hint` ว่าเขียนเป็น 王
5. **`.tree-node` ต้องเป็น 1 คอลัมน์บนมือถือ** — 2 คอลัมน์ที่ 375px ทำให้ความหมายไทยชนแท็ก "บอกเสียง"
   (มี `@media (min-width: 520px)` คุมไว้แล้ว)
6. **`<input>` ต้อง `font-size` ≥ 16px** + `autoCapitalize="none" autoCorrect="off" spellCheck={false}` ไม่งั้น iOS ซูม/แก้คำเอง
7. **`touch-action: none` บน svg ของ StrokePad** จำเป็น ไม่งั้นลากเขียนแล้วหน้าเลื่อนตามนิ้ว

---

## ต้องทำอะไรก่อนบอกว่าเสร็จ

1. `npx tsc --noEmit` — ไม่มี error
2. `npm test` — ผ่านหมด (ถ้าแตะข้อมูล ต้องรัน `npm run strokes` ก่อน ไม่งั้นเทสไฟล์เส้นจะแดง)
3. `npm run build` — ผ่าน
4. เช็คในเบราว์เซอร์: ทั้ง 5 แท็บไม่มี console error · ลำดับขีดเล่นได้ · ฝึกเขียนตรวจขีดถูก/ผิดได้ · ตอบผิดในควิซไม่เด้งข้อถัดไป
5. กวาด overflow ที่ 375px ทุกแท็บ (`document.documentElement.scrollWidth > innerWidth` ต้อง false)
6. เช็ค dark mode อ่านออก
7. แสดงสกรีนช็อตให้ผู้ใช้ดู แล้วรอสั่ง push

---

## สไตล์การคุย

- **ตอบเป็นภาษาไทย**
- ถามก่อนว่าจะทำโฟลเดอร์/ส่วนไหน อย่าเดาแล้วเปิดดูเอง
- คอมเมนต์ในโค้ดเขียนภาษาไทย บอก**เหตุผล**ที่ทำแบบนั้น (โดยเฉพาะตรงกับดักข้างบน) ไม่ใช่บอกว่าโค้ดทำอะไร

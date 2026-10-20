# BLOOM v3 — พรีวิวและแผนส่งต่อการพัฒนา

สถานะ: พรีวิวแยกจากแอปจริง เพื่อให้ผู้ใช้ตรวจ interaction ก่อนเริ่มย้ายเข้า React
วันที่: 19 ตุลาคม 2026

## สิ่งที่ผิดในรอบก่อน

`zoom()` สลับ read/overview และเรียก fit แทนการเปลี่ยน scale อย่างต่อเนื่อง ปุ่มลบจึงกระโดดออกทั้งแผนที่ ปุ่มบวกกระโดดกลับ 100% มือถือยังซ่อนเปอร์เซ็นต์และวาง dock ทับ canvas ทำให้ดูไม่ออกว่ากดแล้วเกิดอะไร

## สิ่งที่ทดลองในพรีวิวนี้

- ปุ่ม + / − เปลี่ยน scale ทีละ 1.2 เท่า ช่วง 20–240% ไม่มีการเปลี่ยนโหมดหรือจัดตำแหน่ง node ใหม่
- ตัวเลขเปอร์เซ็นต์แสดงเสมอ แตะเพื่อกลับ 100% โดยรักษาจุดกลาง
- ดูทั้งแผนที่ = fit bounds; กลับคำที่เลือก = focus ที่ขนาดอ่าน เป็นคนละคำสั่งกับ zoom
- wheel ซูมรอบ pointer; drag เลื่อน; รองรับโค้ด pinch สองนิ้วและ keyboard + / − / 0 / ลูกศร
- มือถือวางรายละเอียดต่อใต้ canvas ใน document flow เพื่อไม่ให้ toolbar ถูกบัง
- canvas ใช้ overflow:clip เพื่อไม่ให้ browser เลื่อน scroll offset เองเมื่อ focus ปุ่มภายใน; การเลื่อนเกิดจาก camera transform เท่านั้น
- ตำแหน่งการ์ดคงที่ขณะซูม ไม่ย่อ/ขยาย card bounds เมื่อสลับมุมมอง

## ไฟล์พรีวิว (แก้ได้โดยไม่กระทบแอป)

| ไฟล์ใน docs/bloom/ | หน้าที่ |
| --- | --- |
| map-design-preview.html | โครง header, breadcrumb, canvas, toolbar และรายละเอียด |
| map-preview.css | BLOOM tokens/รูปทรง/ตัวอักษร/layout desktop และ phone |
| map-preview.js | ข้อมูลตัวอย่าง, render, camera, zoom/pan/pinch, search, speech |
| MAP-DESIGN-V2.md | เหตุผลการออกแบบและภาพร่างรอบก่อน |
| MAP-PREVIEW-HANDOFF.md | สัญญาพฤติกรรมและลำดับย้ายเข้าแอปฉบับนี้ |

เปิดผ่าน dev server: `/docs/bloom/map-design-preview.html`
ตัวสลับคอมจำลองความกว้าง 1200px และย่อกรอบให้พอดีหน้าพรีวิว; ไม่ใช่ zoom ของแผนที่ ตัวสลับมือถือจำลอง 390px

## CSS style ที่ต้องรักษา

BLOOM ใช้พื้น #F7FAF4, การ์ดขาว, ตัวอักษร #203E32, ข้อความรอง #51665A, เส้น #CAD8CB, active #477455, selected peach #FBE6CE
จีน 30px และ hub 39–40px; พินอิน 16px; ไทย 15px ณ camera 100%; font stack เดิมไม่ดาวน์โหลด font เพิ่ม
การ์ด radius 16px, padding 12–16px; hub รูปเมล็ด radius 46% 54% 48% 52%; ปุ่มแตะขั้นต่ำ 44px; เงาเบาเฉพาะส่วนสำคัญ
SVG edge ใช้ vector-effect:non-scaling-stroke; toolbar และรายละเอียดอยู่ข้างนอก world ที่ transform; ไม่ใส่ scale ให้ทั้ง UI แอปจริง
Motion 220–280ms เฉพาะคำสั่ง focus/fit; drag/wheel/pinch ตอบทันที; reduced-motion ปิด transition
รอบนี้เลือกแสดงพินอิน/ไทยบนการ์ดไว้ขณะซูมเพื่อไม่เปลี่ยน geometry; ที่ซูมไกลให้อ่านรายละเอียดขนาดคงที่หรือกดกลับคำที่เลือก การทำ semantic labels เป็นงานต่อหลังรีวิว ไม่อ้างว่าพรีวิวนี้ทำแล้ว

## ขั้นตอนย้ายเข้าแอปหลังผู้ใช้รีวิว

1. **Camera math** — `src/features/bloom/camera.ts`: เพิ่ม pure functions clampScale, zoomAt, fitBounds และ focusBounds; ทุกตัวรับ viewport เป็น CSS px คืน {x,y,scale}; ห้ามแอบเปลี่ยน node layout
2. **Input** — `FocusMap.tsx`: ให้ปุ่ม, wheel, pinch ใช้ zoomAt ตัวเดียว; pointer map เก็บสองนิ้ว; drag เกิน 6px ป้องกัน click; pointercancel ปลด state/capture; ตั้ง scale min/max เป็น constant
3. **Toolbar** — แยก `MapToolbar.tsx`: ปุ่มดูทั้งหมด/กลับคำ/−/เปอร์เซ็นต์/+; disabled ที่ขอบช่วง; aria-label ชัด; toolbar ไม่รับ pan handlers และไม่ถูก world transform
4. **Layout shell** — `BloomApp.tsx`: มือถือวาง detail ใน flow หรือแถวแยกที่วัดได้; desktop rail ข้าง canvas; เปิด/ปิด details ไม่ reset camera โดยไม่จำเป็น; เก็บ URL/branch state เดิม
5. **Styles** — สร้าง `src/features/bloom/map.css`: ย้ายกฎ map จาก bloom.css มาไว้แหล่งเดียว ลบ selector map ซ้ำหลังเทียบ computed styles; ใช้ .bl-map__* และ data-selected/data-kind; ไม่ copy CSS จำลองกรอบคอมด้วย zoom เข้าแอปจริง
6. **Tree** — `tree.ts`: ย้ายการปรับ branch envelope/edge routing ตาม V2 เป็นงานแยกหลัง camera ผ่าน; รักษา occurrence id, cycle handling และกิ่งที่เปิดไว้ ห้ามนำพิกัด mock 15 nodes ไปแทนข้อมูลจริง
7. **ตรวจ regression** — `camera.test.ts` และ `navigation.test.ts`: เพิ่ม zoom anchor invariant, clamp, inverse +/−, fit bounds; navigation เดิมต้องผ่าน ทดสอบ UI จริงตามรายการด้านล่าง
8. **ส่งงาน** — รัน npm test / npm run build / git diff --check; บันทึกภาพมือถือและคอมหลัง animation จบ; อัปเดต VERIFICATION.md ด้วยสิ่งที่ตรวจจริง; อัปเดต PWA preview แล้วตรวจ bundle ใหม่ก่อนส่งลิงก์

## สูตรที่จูเนียร์ใช้ได้ทันที

ให้ pointer ใน viewport เป็น (cx,cy), scale เดิม s และใหม่ t:

```
r = t / s
newX = cx - (cx - oldX) * r
newY = cy - (cy - oldY) * r
```

สูตรนี้รักษาจุดใต้ pointer; แปลง client coordinates เป็น canvas CSS coordinates ก่อนเสมอ (กรณีพรีวิวกรอบคอมถูก CSS zoom ต้องหารอัตราขยาย)
ห้ามใช้ ResizeObserver เรียก fit ทุก render; ทำเฉพาะ viewport เปลี่ยนขนาดจริง และในแอปจริงควรรักษาจุดกลางเดิมแทน reset 100%

## เกณฑ์ตรวจด้วยตนเองก่อนส่ง

- เริ่ม 100%, กด + สองครั้งได้ 120%,144%; กด − ได้120%; กดเปอร์เซ็นต์ได้100%
- กด − ต่อเนื่องถึง20%, กด + ถึง240%; ปุ่มที่เกินช่วง disabled ไม่มี NaN/ตำแหน่งกระโดด
- กดดูทั้งแผนที่แล้ว + ต้องขยายจากเปอร์เซ็นต์ปัจจุบัน ไม่กระโดด100%
- กลับคำที่เลือกคืน selected กลางพื้นที่อ่าน และคงกิ่งที่เปิดไว้
- wheel รอบ pointer และ drag ทำให้ transform เปลี่ยน; drag ไม่เปิดรายละเอียดโดยบังเอิญ
- มือถือปุ่มทั้งห้ากดได้ ไม่อยู่ใต้ dock; เปอร์เซ็นต์อ่านได้; จีน/พินอิน/ไทย selected ไม่ทับ toolbar ที่100%
- สลับคอม/มือถือและเปิดกิ่ง 活; คำใหม่ยังอยู่หลัง zoom และ pan
- ทดสอบ320/390/768/1440px, keyboard focus, reduced motion และเครื่องสัมผัสจริงก่อนอ้างว่า pinch ผ่าน

## ขอบเขตการตรวจรอบนี้

ตรวจ JavaScript syntax และทดลองปุ่มซูมใน browser จริง ดูทั้งค่าที่แสดงและ transform ของ world; พรีวิวยังไม่ใช่ production UI และไม่ได้ยืนยันการ pinch บนอุปกรณ์จริง

# ORBIT — เก็บพรีวิวก่อนย้ายเข้าแอป

วันที่ 19 ตุลาคม 2026
ขอบเขต: พรีวิวใน docs/bloom เท่านั้น ไม่แก้ production UI, ไม่ commit/push/deploy

## สิ่งที่แก้

- เปลี่ยนจากพิกัดตัวอย่างหลายวงซ้อน เป็น arrangeOrbit() ที่คำนวณตำแหน่งจากจำนวนคำ/ขนาดการ์ด
- ตัวอย่าง63คำ +9 hub; 8ทางลัดกลุ่ม เริ่มที่中国人 เพื่อเห็นคำและต้นทางร่วมกันบนคอม
- การ์ดแยกช่องว่างอย่างน้อย24px; ขนาดจีนยาวขยายความกว้างตามจำนวนตัวอักษร
- routeOrbitEdge() ตรวจแนวเส้นกับ unrelated cards และหาเส้นผ่านช่องว่างด้วย visibility graph; มุมเส้นโค้งเล็กน้อยด้วย quadratic Bézier
- สร้าง layout/routes ครั้งเดียว; การซูม ลาก และเลือกคำเปลี่ยนเฉพาะกล้อง/สถานะ
- ภาพรวมมีป้ายกลุ่มใน screen space จึงไม่หดชื่อกลุ่มตามกราฟ; กดป้ายกลับไปอ่านที่100%
- โหมดอ่านรวม parent ในกล้องเฉพาะเมื่อทั้งสองการ์ดพอดีที่100%; หากไม่พอให้ selected อยู่กลางพื้นที่อ่าน
- มือถือแยกรายละเอียดใต้ canvas; รายการคำต่อยอดมีพินอิน ไทยและช่องเลื่อน; ไม่ซ่อนพินอินของรายการเหมือน CSS เดิม
- รายการคำของ hub ใช้ actual character membership; คน 人 มี16คำ แม้บางคำอยู่กิ่งหลักอื่น

## ไฟล์และความรับผิดชอบ

| ไฟล์ | ใช้ทำอะไร |
| --- | --- |
| orbit-layout.js | Pure box geometry, collision, deterministic placement และ edge routing |
| orbit-library.js | อ่านseed, ประกอบพรีวิว, cache routes, overview markers, camera และรายการกลุ่ม |
| design-directions.css | สีORBIT, readable labels, card sizes, mobile details และ overview markers |
| map-preview.js | shared wheel/pinch/button/keyboard interactions; source เดิมของA/C |
| tools/orbit-layout.test.js | ตรวจจำนวนคำ, spacing, routing และตำแหน่งคงที่ |
| tools/vitest.config.js | configทดสอบพรีวิวแยกจาก test production |
| tools/orbit-responsive.html | harnessกำหนดiframeจริง320/390/768/1024/1440px และรายงานtoolbar/overflow |

## ผลที่ตรวจจริง

- `npx vitest run --config docs/bloom/tools/vitest.config.js`: 3 tests passed
- 63คำครบ, ไม่มีcard overlapที่margin24px, ทุกparent edgeไม่ตัดunrelated cardในsampled geometry, rebuildตำแหน่งเหมือนเดิม
- Browser UI ที่320/390/768/1024/1440px: 72nodesทุกขนาด, toolbarอยู่ในcanvas, ไม่มีdocument horizontal overflow
- Browser search 中国人 บน390px: จีน/พินอิน/ไทยแสดงครบ; +ได้120%; กลับคำที่เลือกได้100%
- JavaScript syntax และ `git diff --check` ผ่าน

ข้อจำกัด: ไม่มีการตรวจเครื่องสัมผัสจริง/การpinchด้วยฮาร์ดแวร์ ไม่มีlinguistic auditหรือusability study; ตัวจัดวางนี้จัดเป็นfamily sectors ยังไม่ใช่branch growth/URL stateของแอปจริง ชุด63คำไม่ใช่หลักสูตร2000ตัวจีน

## ขั้นต่อไปเมื่อย้ายเข้าแอปจริง

ใช้ MAP-PREVIEW-HANDOFF.md เป็นลำดับงาน โดยรักษาโมเดลoccurrence idของproduction tree/navigation ไม่ใช้zhเป็นunique node idเหมือนพรีวิว; เพิ่มtestsสำหรับคำซ้ำที่อยู่หลายกิ่งและdeep URLก่อนเชื่อมlayoutใหม่เข้าFocusMap
routeOrbitEdgeเป็นงานsyncและตรวจหลายเส้น ต้องวัดเวลาเมื่อเพิ่ม133คำ/กิ่งลึก; ถ้าเกินงบframeให้cacheตามlayout versionและแยกคำนวณlayoutออกจากinput frameก่อนใช้จริง

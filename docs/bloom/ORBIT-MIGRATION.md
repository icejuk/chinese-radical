# ORBIT เข้าแอปจริง

วันที่ 19 ตุลาคม 2026 — ทำบน feat/bloom-learning ใน checkout เดิม ไม่ commit/push และไม่เผยแพร่สู่เว็บสาธารณะ

## ผลลัพธ์

แอปหลักใช้ธีม ORBIT กับคลัง133คำ/116ตัวอักษรเดิม ค้นจีน/พินอิน/ไทยได้ทุกคำ มีทางลัดเริ่มสำรวจ8ตัว (学 生 日 人 家 水 木 休) ส่วน4หมวดการเรียนเดิมยังใช้กับแบบฝึกและการจัดข้อมูล
เปิดหลายกิ่งบนcanvasเดิม, occurrence path/URL, Back/Forward, ประโยค, ทบทวน, ฝึกพูดและฝึกเขียนยังใช้ระบบจริงเดิม

## ไฟล์ที่รับผิดชอบแต่ละส่วน

| ไฟล์ใน src/ | งาน |
| --- | --- |
| features/bloom/orbit.css | เจ้าของstylesแผนที่และthemeใหม่ทั้งหมด: navy #101624 / surface #192236 / lavender #c7b6ff; layoutรายละเอียดซ้ายบนคอมและใต้แผนที่บนมือถือ |
| features/bloom/bloom.css | เหลือโครงฟีเจอร์เดิม; ลบ84กฎmapเก่าเพื่อลดการเขียนทับ; ห้ามเติมmap rulesกลับท้ายไฟล์นี้ |
| features/bloom/FocusMap.tsx | กล้อง, input, zoom20→240%เดิมเปลี่ยนเป็น4→240%, toolbar, ancestry highlights, screen-space overview labels, memoized routes |
| features/bloom/camera.ts | zoomAtที่รักษาจุดใต้pointerและclamp; readingPoseใช้พื้นที่เหนือtoolbar |
| features/bloom/edgeRouting.ts | หาทางเส้นผ่านช่องว่างของoccurrence boxes ด้วยvisibility graph; ไม่เปลี่ยนตำแหน่งnode |
| features/bloom/tree.ts | ใช้production layout/idsเดิม; วางentry anchorsแบบ2คอลัมน์เมื่อขยายและเปลี่ยนcollection labelเป็นORBIT |
| features/bloom/BloomApp.tsx | branding,8ทางลัด,คำต่อยอดที่แตะได้ในdetail, mobile panelอยู่ต่อจากmapและแสดงคำพร้อมpanel |
| ExperienceRoot.tsx | title/theme-colorของmodern UIเป็นORBIT; routelegacyแยกเหมือนเดิม |
| main.tsx | โหลดorbit.cssหลังstylesโครงเดิม |
| features/bloom/PwaUpdate.tsx | แจ้งอัปเดตORBITโดยให้ผู้ใช้กดก่อนreload |
| features/bloom/camera.test.ts, edgeRouting.test.ts | regressionสำหรับcursor anchor/clamp/ขนาดอ่านเหนือtoolbar/เส้นหลบcard/identityไม่เปลี่ยน |

`vite.config.ts`, `index.html`, `public/icon.svg`, `public/icon-maskable.svg` อัปเดตชื่อ สี และไอคอนPWA
เอกสารและHTML mockเก็บในdocs/bloomตามเดิม แอปจริงไม่importไฟล์mock

## ข้อควรระวังเมื่อพัฒนาต่อ

- การ์ดในแอปใช้occurrence id เช่น `c:人/w:家人/c:家`; ห้ามเปลี่ยนเป็นzh-only idแบบmock เพราะคำเดียวอยู่ได้หลายกิ่ง
- แก้padding/font/card dimensionsต้องปรับgeometryพร้อมกัน ตรวจoverlapและselected viewportใหม่
- toolbarกับoverview markersอยู่ในscreen space; map worldเป็นส่วนที่transform; อย่าscaleทั้งshellแบบหน้าพรีวิว
- มือถือเมื่อเปิดรายละเอียดcanvasจะลดความสูงตามviewport กล้องหักพื้นที่toolbar80pxก่อนจัดคำ จอ320pxใช้แผนที่200pxและpanelแบบย่อ
- route geometryคำนวณในuseMemoเมื่อtreeเปลี่ยน; drag/zoomใช้refs+RAF ไม่คำนวณrouteใหม่ทุกpointermove
- ถ้าเพิ่มคลัง/เปิดหลายกิ่งมากขึ้นให้profileเส้นทางและcacheเพิ่มก่อนใช้กับข้อมูลระดับ2000ตัว
- อย่าเพิ่มCSSselectormapในbloom.css; ปรับที่orbit.cssซึ่งเป็นเจ้าของเดียวของmap presentation

## การยืนยันผล

- `npm test`: 72 tests /10 filesผ่าน
- `npm run build`: ผ่าน; release bundle `/assets/index-Cck_fe-M.js`
- `git diff --check`: ผ่าน
- Browser: สองเส้นทางลึก 人→家人→家 และ 学→学生→生→生日→日 ที่320/375/390/768/1024/1440px รวม12กรณี: cardไม่ทับ/หน้าไม่ล้น/selectedอยู่ในmapหลังcameraหยุด
- Browser320px พร้อมรายละเอียด中国人: selected bottom186.24 < toolbar top208.20; detail bottom547.48 < navigation top552; จีน พินอินและไทยมองเห็นร่วมกับปุ่ม
- Browser: ค้น学生, เปิดประโยค我是学生, เปิดทบทวนและหน้าฝึกพูด, แตะ日ซ้ำเปิดรายละเอียด10คำ, เปิดdialog日โหลด4ขีด
- Audio: กด中国人แล้วUIเข้าสถานะกำลังเล่นเสียง; automated TTS lifecycle/error testsผ่าน; ไม่อ้างว่าตรวจฟังสำเนียงโดยเจ้าของภาษา
- PWA5199เคยแคชBLOOM: กดอัปเดตแอปแล้วตรวจmodule srcตรงกับreleasebundleด้านบน และURLคำที่เลือกยังอยู่

หลักฐาน: evidence/orbit-app-release.png, orbit-app-320.png, orbit-app-responsive.json
ลิงก์local build: http://127.0.0.1:5199/#map

ข้อจำกัด: ยังไม่ทดสอบpinchบนhardwareมือถือจริง/ไมโครโฟนจริงรอบนี้ ไม่ใช่หลักสูตร2000ตัว ไม่มีการเพิ่มaccount/SRS/progress persistence และไม่มีnative-speaker audit

## Compact families / readable overview correction — 19 October 2026

Reported route: focus 水 with branches 生、学、水. Large fixed root offsets and the distant collection created an unnecessarily large bounding box.

`tree.ts` now packs family envelopes after actual descendants have been measured. Each family moves as a unit; local branch geometry and cached occurrence identities remain stable. The collection sits immediately above the packed families. The test for global position stability now checks stability within the same family, since sibling families must be allowed to reposition as their occupied area changes.

`FocusMap.tsx` restores reading at100% on phones as well as desktop. Overview labels repaint after their DOM mounts and avoid overlapping each other. Clicking the already-selected root marker also exits overview and restores readable zoom. Overview Chinese labels render at18screen pixels where the cards have room; on smaller views only readable group labels remain, and selecting a group restores full Chinese/pinyin/Thai.

The reproduced desktop case measures2416×1301world pixels, overview Chinese18px,5root labels with zero overlap. The user's production tab was updated without losing its open branches; reading view verified at100%. Release module:index-C-hnEH4t.js.73 tests passed; build/diff checks passed. Evidence:orbit-compact-reading.png and orbit-compact-metrics.json. This supersedes the fixed2600px root-anchor presentation described above; the raw coordinates are internal memory only and are packed before display.

## Always show pinyin and Thai — 19 October 2026

The Chinese-only overview was rejected because pinyin and Thai are required on every vocabulary card. Removed all overview rules that hid those labels and removed the duplicate group-marker overlay. Every card now keeps all three lines at every supported zoom.

To make that readable without card collisions, the camera range is80–240%. Pinyin has a16screen-pixel floor and Thai14px, using inverse-scale font floors within the existing card bounds. The former global-fit action now centers the active branch and respects the minimum readable scale; larger maps are explored by panning and the eight entry shortcuts. It no longer shrinks the complete multi-group canvas to25%.

The reported 学/生/水 production route at80% was audited in-browser:29cards, no missing/hidden pinyin or Thai. 学习 measured16px pinyin and14px Thai.73tests and production build passed; verified module:index-C3W1QxRl.js. This supersedes the Chinese-only/semantic overview behavior described in the preceding correction.
Evidence:orbit-all-readings.png and orbit-all-readings.json.

## Remove 80% zoom restriction — 19 October 2026

At the user's request, removed the80% minimum. Camera is back to4–240%; button, wheel and pinch use the same limits. Chinese/pinyin/Thai remain present on every card and scale naturally together; removed inverse font floors to prevent text overflowing cards when zoomed far out. Return-to-selected/100% controls remain available. Updated the zoom regression to exercise25→30%.73tests passed.

## Entry shortcuts must include all readings — 19 October 2026

The user's repeated request also applies to the8entry buttons, not only canvas cards. BloomApp now renders three explicit lines on each shortcut: Chinese, pinyin, Thai. Removed the mobile hiding rule; controls keep98px height and scroll horizontally rather than removing labels. Selected-character status also includes pinyin and Thai. Browser-confirmed all8buttons have nonempty readings/translations at mobile width. Build and whitespace checks passed; production module:index-BJ-UCr40.js. Evidence:orbit-entry-readings.png.


### Foundation starting hubs — 2026-10-19

Added 口 kǒu (ปาก), 心 xīn (ใจ), 手 shǒu (มือ), 火 huǒ (ไฟ), 山 shān (ภูเขา), 月 yuè (ดวงจันทร์ / เดือน). These are starting characters for vocabulary exploration, not a formal radical classification. There are now 14 starting shortcuts, 149 unique words and 125 character records. The expansion adds 16 unique words; existing 门口 and 手工 are reused. Each new hub has at least three actual containing-word connections. 火山 connects both 火 and 山; 山水 also extends the existing 水 branch.

Implementation: foundationExpansion.ts stores curated character and word readings; seed.ts deduplicates and builds actual character-membership edges; catalog.ts exports the shortcut IDs; BloomApp.tsx renders all shortcuts with Chinese, pinyin and Thai. Existing ORBIT CSS and camera controls are reused. gen-strokes.mjs includes the new source file and bundles every required stroke file locally.

Validation: 74 tests across 10 files and production build passed. The content tests check six starter IDs, translations, minimum vocabulary coverage and shared-word links; existing tests check character metadata and stroke coverage. In-app browser checks opened all six shortcuts successfully and confirmed their labels. Production bundle: index-0Pyo0_6q.js. Screenshot: evidence/orbit-foundation-hubs.png. Audio uses the existing playback implementation; no native-speaker audit was performed.


### Website name — 2026-10-20

The chosen public website name is **Mandarin Trail**. Updated the visible brand, document title (including runtime switching), Apple web-app title, PWA manifest name and short name, update banner, map collection label and README. ORBIT remains the internal theme name; file paths and historical evidence retain their names. Brand letter spacing is reduced to 0.3px with no wrapping to accommodate the longer name on phones. No navigation or learning content changed.

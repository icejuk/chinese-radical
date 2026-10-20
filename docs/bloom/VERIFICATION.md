# BLOOM learning release — 2026-10-18

## Current result

The home route now opens one unified tree with all four starting groups. All four BLOOM sections are implemented in the React app: continuous word map, sentences, three-question review and local speaking practice. Word details include normal/slow audio and local stroke animation/writing. There are no placeholder navigation buttons for these sections.

The bundled vocabulary has **133 words / 116 characters**. Every character appearing in those words has pinyin, a Thai label, character-membership edges and a local stroke file. The content is a finite curated seed, not an audited 2,000-character curriculum. No accounts, new SRS, long-term learning plans, memory map or automatic speech scoring were added.

Preview: http://127.0.0.1:5199/ (latest production build), http://127.0.0.1:5197/ (development).

## Implemented behavior

| Area | Behavior |
|---|---|
| Map | All words remain on a single canvas; expand/collapse occurrences without losing parent branches. Pan/zoom, whole-tree/selected-word controls, Chinese/pinyin/Thai search, validated deep links and Back. |
| Word details | Immediate mobile bottom sheet; adjacent desktop panel. Reopen the same card, close/Escape/backdrop, return focus. Normal/slow audio, explicit loading/playing/error/retry, writing and sentence shortcuts. |
| Sentences | Five patterns. Curated identity/place/want/activity substitutions, plus a meaning question for every word. The chosen set/word is in the URL; Back from the tree restores it. Chinese, pinyin, Thai and full-sentence audio stay aligned. |
| Review | Four topic banks, three questions per round. No Chinese/pinyin answer before checking; optional explicit visual mode for unavailable audio. Empty checks disabled, answers lock after checking, duplicate checks do not add score, results/restart work. Scores remain in current component state only. |
| Speaking | Two situations, six prompts and sample answers, normal/slow playback, local recording and native playback. Track/URL cleanup on leaving/changing prompt, permission-denied/unsupported recovery and 60-second recording limit. No audio upload or fake pronunciation score. |
| Writing | Word characters can be selected individually. Local stroke animation and touch/mouse quiz via existing StrokePad; stop old work when changing characters or closing. |
| PWA/legacy | BLOOM manifest, icons, shortcuts and start route. Local content and split code chunks precached with the stroke data/license. Existing legacy routes and stored progress are retained. |

## Automated verification

`npm test`: **9 test files / 67 tests passed**.

Meaningful regressions cover graph validity and all-character/stroke coverage, search, old routes, tree occurrence layouts and cycles, collapse/deep-link restoration, sentence substitution validity, review duplicate checks/wrong answers/completion/reset, normal/slow/native/fallback speech events and recording lifecycle.

Recording tests use injected fake streams/recorders to check local Blob creation, URL revocation, stopped tracks, permission denial, cancellation, late permission after exit, old permission rejection after a new session and automatic stop after 60 seconds. These tests do not pretend to be real microphone device tests.

`npm run build`: **passed** (TypeScript, Vite and PWA generation). `git diff --check`: passed. Writing and the learning hub load in separate chunks so the map does not eagerly load the writing engine.

## Browser journeys actually performed

- Previous release home check used quick-start words and four group cards. That home has been replaced by the unified tree described below.
- Tree: 木材 → 材 → 材料 → 料 reveals 饮料/调料/原料 while retaining 木. Back restores the prior branch. The new shared word 教学 correctly also appears under 学.
- At 320px, search 木材: immediate details show mùcái and Thai. Open writing, select 材: local data loads and shows 7 strokes without horizontal overflow.
- Sentences: 学生 → 医生 updates to 我是医生 / Wǒ shì yīshēng / ฉันเป็นแพทย์. Open 医生 on the tree, then browser Back: the chosen sentence and word return.
- Writing: open 医生, start animation on 医, switch to 生 (5 strokes), then switch to writing mode. No old SVG remains. Close returns focus.
- Review: initial Check is disabled. Correct/wrong/correct produces **2/3**. Restart returns to question 1 with score 0. Answer/pinyin appear only after checking.
- Speaking: show the friend example, switch to requesting water, show its example, advance question. Previous examples clear and prompts/pinyin/Thai change together.
- Production sentence audio: normal and slow controls were accepted by the browser and showed playing state. Moving to speaking removed the old playback state; lifecycle regressions verify stopping the old voice. This is not an audit of accent/pronunciation quality.
- No unexpected warning/error logs were captured on the tested development/production learning journeys.

## Responsive checks

All four sections at **320, 375, 390, 768, 1024 and 1440 CSS px**: **24 combinations with no horizontal document overflow**. The map's eight water occurrences had zero card intersections at all six widths. Non-map pages have no map occurrences, so their zero count is not evidence about internal text overlap; visual checks were also performed at mobile and desktop widths.

These checks used iframe viewports, not physical phones. Raw results: `evidence/responsive-matrix.json`.

## Production cache check

Started the built app with `vite preview` on localhost:5198, loaded it, then stopped that preview server. Reload still displayed BLOOM from its cache. From that reloaded app, opening 学生, its writing dialog (学: 8 strokes) and the sentence page succeeded while the local origin server was stopped. The preview server was then restarted.

This proves the bundled app/chunks/strokes can be served from the installed service worker cache in this browser. External network access was not globally disabled; no claim is made that uncached external audio works offline. This was a fresh install check, not an upgrade from an already installed production release.

## Test-case workbook

`BLOOM-test-cases.xlsx`: **43 Web cases (15 Passed, 28 Not run)** and **6 E2E journeys (1 Passed, 5 Not run)**. Passed rows carry actual results/evidence; remaining rows include device/permission/performance/upgrade checks and broader scenarios not fully executed in the browser. Unit-test count and manual test-case count are deliberately separate.

## Remaining verification limits

- No real iPhone/Android microphone recording or hardware pinch/screen-reader test was performed. Mic/Blob cleanup is covered by automated lifecycle tests; the device-permission UI flow remains unverified on physical hardware.
- Production cache upgrade from the previous public release, Safari/Chrome on physical phones and measured LCP/CLS on target hardware remain release checks. No performance target is claimed as measured/passed.
- Vocabulary and examples have not received a native-speaker editorial audit.
- No commit, push or public deploy was performed.

## Evidence

- `evidence/material-branch.png`: continuous wood/material branch.
- `evidence/complete-sentences.png`: production sentence page.
- `evidence/review-result.png`: actual 2/3 result.
- `evidence/complete-speaking.png`: speaking page.
- `evidence/writing-bloom.png`, `evidence/writing-mobile320.png`: writing on desktop/mobile.
- `evidence/offline-writing.png`: stroke data loaded while preview origin was stopped.

Earlier screenshots in this folder may show the superseded pagination or smaller seed; the behaviors and counts above describe the current release.


## Update prompt and final visual correction

A final screenshot exposed insufficient height for the three-line word previews in home-group cards. The card tree now reserves space explicitly; mobile home uses one column. Browser geometry checks confirm all four card previews finish above their footers.

For future builds, registration explicitly checks for updates on load/visibility. An update banner lets users update or defer, so a review/microphone session is not automatically interrupted. Tested a controlled build-to-build upgrade on localhost:5199: installed one build, produced another, reloaded, observed the update banner, clicked Update and confirmed the stylesheet URL changed to the newly built hash. The updated cards still pass geometry checks. This does not substitute for a migration test from the older public production app.

Evidence: `evidence/pwa-update-banner.png`, latest `evidence/complete-home.png`.


## Unified tree correction — latest implementation

The separate home-group cards have been removed. `#map` starts with a single neutral collection node connected to 学 / 木 / 水 / 人 on one canvas. These dashed grouping edges do not claim a linguistic derivation. Solid edges beyond each character show actual character membership in words.

Opening another group retains every previously opened group and nested branch. Category navigation no longer remounts the map. The URL records each opened root (`branch`) and each deeper expansion (`open`); reload/Back can reconstruct them. Collapsing one group removes its own descendants only. The collection node returns to the whole-tree view without closing branches. Mobile has compact entry-point controls after expanding, plus a button to reopen character audio/writing details.

Four new automated regressions cover the single collection root and all four initial entry points, preserving multiple groups/deep branches with URL round trips and zero node intersections, collapsing one group without losing another, and selecting a starting group whose character already occurs deeper elsewhere.

Browser checks for this correction: desktop opening 学 then 木 retains both word sets; 320 px mobile opening 木 → 木材 immediately opens its detail sheet, then expanding 材 retains 木 and all other starting groups. The mobile harness reports 17 non-overlapping nodes with no document overflow for this expanded route. The compact initial overview has five connected nodes with no overlap or document overflow. Earlier card screenshots/layout JSON are historical evidence and do not describe the new home.

Latest evidence: `evidence/unified-tree-desktop.png`, `evidence/unified-tree-mobile.png`. The existing Excel workbook has not been regenerated for these new regression cases; the current unified-tree cases are listed here and in the automated test file.

Additional unified-tree browser check: on mobile, use the entry-point control to open 学 while 木 → 木材 → 材 stays expanded. The resulting 24-node canvas has zero card intersections and no horizontal document overflow at 320, 375, 390, 768, 1024 and 1440 CSS px. Raw results: `evidence/unified-responsive.json`.


## Latest six-part UX implementation

The two-sided/stable layout, portrait reading arrangement, compact non-modal word dock, 26-word people/family expansion and reading contrast/controls supersede the earlier unified-tree screenshots and workbook expectations. Current counts: 123 words / 110 characters; 人 connects to 16 words. See `UX-PASS.md` for the six requirements, actual browser journeys, manual cases and limitations. Automated suite: 64 tests / 9 files passed. Latest responsive evidence: `evidence/ux-six-responsive.json` (18 cases). Mobile browser playback entered its playing state; 家庭 writing loaded 家 (10 strokes) and newly bundled 庭 (9 strokes), played the stroke animation and returned to the same branch. No hardware-device or learner-preference claim is made.


## Latest organic mind map

The two-column placement is superseded by multi-directional radial branches and curved connectors. See `ORGANIC-MAP.md` for scope and evidence. Automated suite remains 64 passing tests; latest responsive run covers 12 people/family cases in six widths.


## 日 activation regression

The old dataset had only 生日 for 日. That word was already the source of the expanded 日 occurrence and intentionally excluded from immediate reverse branches. Clicking the selected 日 occurrence then produced the same URL and no mobile detail response. The fix gives already-open character taps an explicit details action independent of URL changes. Closed starting characters still open their branches on first tap. Card hints now distinguish opening vocabulary from reading details, and exhausted character branches explain that no new word is available in this dataset.

Added ten everyday 日 words, complete metadata for all their characters and bundled strokes. Current set: 133 words / 116 characters; 日 has 11 memberships including the source 生日. Added regressions cover the exact 学 → 学生 → 生 → 生日 → 日 route, same-route activation, first/second starting-character taps and an exhausted 庭 branch. Automated suite: 67 tests / 9 files passed; build passed.

Browser checks: opened the reported deep link, tapped 日, saw the mobile details/audio/writing panel and “10 คำอยู่บนกิ่งนี้”, closed it and tapped the same 日 again successfully. Six viewport checks (320–1440 CSS px) report zero node intersections/document overflow and an unobscured selected card. Evidence: `evidence/day-tap-details.png`, `evidence/day-tap-responsive.json`.

## ORBIT production migration — 19 October 2026

Current UI is ORBIT. 133 words /116 characters;72 tests in10 files passed, production build and diff whitespace passed. See ORBIT-MIGRATION.md for file ownership and exact browser evidence. Twelve responsive deep-branch cases and the320px selected-word/toolbar/detail/navigation geometry are recorded in evidence/orbit-app-responsive.json. Release module verified after PWA update: index-Cck_fe-M.js. No commit, push, public deployment or physical-device/native-speaker validation.

### Compact multi-family correction

Reported 生/学/水 route reproduced and packed using actual family bounds.73 tests/10 files passed; build and whitespace passed. Overview Chinese measured18px on the desktop reproduction, group markers do not overlap, root re-selection restores100%, and production PWA update retains the current URL/branches. Current module:index-C-hnEH4t.js.


### Foundation starting hubs — 2026-10-19

Added 口 kǒu (ปาก), 心 xīn (ใจ), 手 shǒu (มือ), 火 huǒ (ไฟ), 山 shān (ภูเขา), 月 yuè (ดวงจันทร์ / เดือน). These are starting characters for vocabulary exploration, not a formal radical classification. There are now 14 starting shortcuts, 149 unique words and 125 character records. The expansion adds 16 unique words; existing 门口 and 手工 are reused. Each new hub has at least three actual containing-word connections. 火山 connects both 火 and 山; 山水 also extends the existing 水 branch.

Implementation: foundationExpansion.ts stores curated character and word readings; seed.ts deduplicates and builds actual character-membership edges; catalog.ts exports the shortcut IDs; BloomApp.tsx renders all shortcuts with Chinese, pinyin and Thai. Existing ORBIT CSS and camera controls are reused. gen-strokes.mjs includes the new source file and bundles every required stroke file locally.

Validation: 74 tests across 10 files and production build passed. The content tests check six starter IDs, translations, minimum vocabulary coverage and shared-word links; existing tests check character metadata and stroke coverage. In-app browser checks opened all six shortcuts successfully and confirmed their labels. Production bundle: index-0Pyo0_6q.js. Screenshot: evidence/orbit-foundation-hubs.png. Audio uses the existing playback implementation; no native-speaker audit was performed.


### Mandarin Trail — shared learning vocabulary (2026-10-20)

See [implementation and remaining scope](LEARNING-INTEGRATION.md). All 149 words are selectable in sentences, review and speaking; 20 authored foundation examples and 13 existing sentence-pattern words have usable examples. Six new root vocabularies are covered completely. Other words retain meaning questions and pronunciation/free speaking with an explicit missing-example notice.

76 tests / 10 files passed; build and git diff --check passed. Production bundle index-DPtxFimL.js was confirmed in the actual browser. Browser checks: 月 → 月亮; daily/meaning switching with the same word; context retained between three sections; three review answers scored 3/3; restart reset to 0/3; 手机 speaking example and readable Chinese/pinyin/Thai; 学生 speaking reuses existing identity example; back to map selects 月亮 and returning to sentences retains the word. At 320px and 1280px there was no horizontal document overflow. No microphone recording was made in this run.

Evidence: evidence/mandarin-trail-lessons-desktop.png and evidence/mandarin-trail-lessons-320.png. No commit, push or public deployment.


## 20 ตุลาคม 2026 — Learning UX fixes A–F

- Implemented: setup ก่อน review/ซ่อนเฉลย, batches จบครบก่อนวน, attempt key รีเซ็ต recorder และ AudioPlayer, context picker พับ+ค้นพินอินไม่มีวรรณยุกต์, sentence เลือกเฉพาะรูปแบบที่รองรับและคำใน scope, speaking พูดตาม/ตอบเอง
- 149 คำมีประโยคผ่าน 137 authored examples และ 4 patterns (13 คำ มี 学习 ซ้ำ 1 คำ) เพิ่ม 117 authored rows ใน practiceExamples.ts
- Tests: 86 ผ่าน / 10 files; build ผ่าน; recorder เป็น mocked lifecycle รวม dispose ขณะ recording และ late permission ไม่ใช่ทดสอบไมค์จริง
- Browser verified: review ไม่มีคำตอบใน context หลังเริ่ม; 月 ฝึก 3/3 และเริ่มใหม่กลับข้อ 1 คะแนน 0; 月亮 เปลี่ยนเป็นถามความหมายโดยรักษาคำ/root; ค้น meiyue ใน 月 แล้วเลือก 每月 ได้ประโยคถูกตัว
- Responsive: review 320×780 ไม่มี horizontal overflow; speaking 390×844 เห็นโจทย์และปุ่มฟังในจอแรก; speaking 1280×900 ไม่มี horizontal overflow
- Production preview bundle ล่าสุดที่ build: index-S0T8-X51.js; โหลดผ่านปุ่มอัปเดตแอปใน browser แล้ว
- Evidence: evidence/learning-fixes-speaking-mobile.png, evidence/learning-fixes-review.png, evidence/learning-fixes-speaking-desktop.png
- ยังไม่ได้ตรวจ: ไมค์/TTS บน iOS/Android เครื่องจริง, ผู้ตรวจภาษาภายนอก, keyboard journey เต็ม และ map regression แบบ end-to-end ในรอบนี้ ตัว unit tests navigation/map ยังผ่าน
- ไม่มี commit/push/deploy ในงานนี้

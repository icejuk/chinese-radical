# BLOOM — six UX corrections

Current scope: 123 words / 110 characters; 人 connects to 16 words. No commit, push or public deployment.

| Requirement | Implemented behavior | Verification |
|---|---|---|
| 1. Layout and reading size | Desktop words grow on both sides. Small phones use two staggered columns under the character; wider screens use the available width. Default reading zoom is 95–100%, with an explicit overview control. | 18 iframe viewport checks; selected pinyin measured 14.5 px or larger on initial overview, 15.2 px or larger on reading routes. |
| 2. Expansion and motion | Existing branch positions are reserved. New descendants grow outward on desktop, then downward in the same column on phones. Camera moves in 280 ms, respects reduced motion, compensates when canvas bounds grow and keeps distant words visible above the reading dock. | Stable-position/collapse/reopen regression, mobile geometry regression, two reading-camera tests. |
| 3. Clear actions | Cards say whether they open vocabulary or word/audio details. Details expose normal/slow audio, explicit character expansion and writing. Stop clears the playback state. Overview and reading controls have visible labels. | Mobile 家人 audio entered the playing state; expansion via 家 button returned to the same canvas. |
| 4. Useful vocabulary | 26 words added. 人 begins with family/other people/man/woman/elder/guest. Headers describe counts in this dataset. Source words are not repeated as immediate reverse branches. | Graph validity, unique IDs, contextual readings, all-character metadata/stroke coverage, 人 → 家人 → 家 → 家庭 URL round trip. |
| 5. Details and context | Desktop side panel retained. Mobile uses a non-modal compact reading dock, with optional expanded details; the map and navigation stay operable. A nearby source remains in view when both cards fit at reading size. | Mobile word selection, audio, character expansion and writing journey. Hardware microphone testing is outside this change. |
| 6. BLOOM readability | Stronger text/edge contrast, 16 px reading pinyin, 15 px Thai, larger touch controls, fewer repeated headings and a shorter top bar. Compact home shows all four entry points. | Visual inspection of 320 px home and mobile/desktop reading views; no overlap or document overflow in the viewport matrix. |

## Verification and evidence

- Automated: 64 tests / 9 files passed; TypeScript/Vite/PWA build passed.
- Layout cases: home, 人, 人 → 家人 → 家 at 320 / 375 / 390 / 768 / 1024 / 1440 CSS px, 18 combinations. The measurement concerns the selected card and node rectangles; it does not claim every offscreen branch is visible at once.
- Raw results: `evidence/ux-six-responsive.json`.
- Current screenshots: `evidence/ux-six-desktop.png`, `evidence/ux-six-mobile.png`, `evidence/ux-six-writing.png`.
- The original Excel workbook describes an earlier release. New regression cases are documented here and in `navigation.test.ts` / `camera.test.ts`; the workbook has not been regenerated in this pass.

## Manual acceptance cases

1. Open home at 320 px: all four entry points belong to one tree and have Chinese, pinyin and Thai.
2. Open 人: read 家人 and 别人 in the first two branches; drag to further words.
3. Select 家人: reading dock appears; play normal/slow audio and stop. The map remains interactive.
4. Expand 家: 家人 remains the source, 家庭 is reachable, and existing 人/木 branches persist.
5. Open a distant word such as 中国人: the selected card stays within the usable viewport instead of centering an empty midpoint with its far-away source.
6. Open writing: choose 家, animate its strokes, close and return to the same branch.
7. Expand/collapse/reopen a branch: existing relative positions are unchanged; URL and browser Back restore expansion state.
8. Use overview then reading control: overview may shrink text; reading control restores readable zoom.

No physical-phone, screen-reader, native-speaker editorial or user-preference validation is claimed. These are implementation and browser checks; liking the experience still needs real learner feedback.

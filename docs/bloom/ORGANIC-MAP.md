# Organic mind map correction

The previous two-column layout is superseded. Words now occupy several directions around their starting character on both desktop and phone canvases. Small deterministic angle/radius variations avoid rigid rows; outward fans carry subsequent character/word branches. Collision placement searches nearby angles and larger radii while reserving existing positions. Text remains horizontal.

Connections attach to the facing card boundary and use curved paths in any direction. “ดูทั้งกิ่ง” fits the active starting-character subtree, including its expanded descendants, instead of shrinking the entire four-group universe. “อ่านคำ” restores readable zoom; fitting the complete branch intentionally reduces label size. On phones, the reading camera includes a nearby source when it fits without shrinking the text.

Verification: 64 automated tests passed, including branch preservation, collapse/reopen, cycle/URL handling, no overlaps and mobile distribution across at least six angular sectors. Obsolete assertions requiring two columns/strictly leftward descendants have been replaced by radial-distribution and relationship checks. Twelve browser cases (people/family at six widths) report no node intersections or document overflow, and selected cards remain readable/unobscured.

Evidence: `evidence/organic-responsive.json`, `evidence/organic-preview.png`, `evidence/organic-expanded.png`, `evidence/organic-mobile.png`. These supersede the two-column screenshots in UX-PASS.md; the vocabulary remains 123 words / 110 characters. No commit, push, public deployment or physical-device usability validation was performed.

# BLOOM vocabulary coverage

Current bundled content: **97 words / 94 characters**. The first 54 words and 16 characters came from the prototype; the wood expansion added 43 unique words and 15 characters. The complete learning release also supplies all remaining character readings/Thai labels used by these 97 words (94 characters total). Shared words such as 工人 and 校园 remain single records, connected across their relevant characters.

## Added coverage

All characters in the original 13 wood/rest-group words now have metadata and selectable connections: 木头、树木、木材、木工、木门、木马、树林、园林、林业、森林、休息、休假、午休.

New character roots: 材、树、头、工、门、马、园、业、假、午、息、料、教、身、器. Every added character connects to multiple words.

Example continuous journey: 木 → 木材 → 材 → 材料 → 料 → 饮料. 材 also connects to 教材、身材、器材. Words are connected by actual character membership; a common theme alone does not create an edge.

## Readings and Thai meanings

Chinese readings/glosses were checked against dictionary references; concise Thai explanations were authored for the app rather than copied from dictionary prose. This remains a curated learning seed, not an exhaustive dictionary or an audited HSK sequence.

- [汉典 — 材](https://zdic.net/hant/材): material/timber sense and related words 材料、教材、器材、身材.
- [Chinese Text Project — 材料](https://ctext.org/dictionary.pl?char=材料&if=en): cáiliào and the material/data senses.
- [汉典 — 身材](https://www.zdic.net/hans/身材): physique/body proportions.
- [汉典 — 假](https://www.zdic.net/hans/假), [放假](https://www.zdic.net/hans/放假), [请假](https://zdic.net/hans/请假): jià is used in the leave/holiday context. The separate jiǎ sense is not being inferred from these words.
- [汉典 — 消息](https://zdic.net/hans/消息): news/information context for 息.

Context matters: 头 is tóu as a character but neutral tou in 木头、石头、头发. 息 is xī as a character but neutral xi in 休息、消息. Words preserve their own reading rather than concatenating isolated character readings. Sound uses the existing full-word Mandarin TTS.

## Validation

Graph validation rejects missing readings/Thai meanings, duplicate IDs/edges and false character relationships. Regression tests assert complete coverage of all characters in the original wood-group vocabulary, multiple words for every added root and round-trip navigation through the six-step example above.

Every character in the current 97 words has a reading, a Thai label, graph membership and a local stroke file. Vocabulary outside this finite set is not fabricated automatically. The app does not claim to provide a 2,000-character curriculum.


## Learning release

Five sentence patterns are available. Identity/place/want/activity patterns use explicitly curated substitutions; every other word can be used in the genuine question “[word]是什么意思？” (What does [word] mean?), without forcing it into an unsuitable sentence. Speaking includes six authored questions/sample answers over two situations. Polyphonic characters are played inside a matching word context, e.g. 长 → 校长 and 乐 → 乐器, while full-word pronunciations remain independent of character readings.


## People/family expansion — latest scope

Current combined set: **123 words / 110 character entries**. Added 26 words, including 家人、别人、男人、女人、老人、客人、人口、人类 and family/visitor branches. 人 now has 16 word-membership connections. 家人 → 家 → 家庭 and 客人 → 客 → 客厅 work through real character membership; the source word is not duplicated immediately under the newly expanded character.

Readings/meanings checked against [MDBG person entries](https://www.mdbg.net/chinese/dictionary?wdqb=person&wdrst=0), [family entries](https://www.mdbg.net/chinese/dictionary?page=worddict&wdqb=family&wdrst=0), [家庭](https://www.mdbg.net/chinese/dictionary?page=worddict&wdqb=household&wdrst=0), and the dictionary's character/word entries. Thai glosses are authored for this app. Neutral-tone 别人 uses biéren; the woman/man senses use nǚrén / nánrén. Stroke generation includes all new vocabulary; the automated coverage test checks every word character against metadata and a real local stroke file. This remains a curated seed, not the complete Chinese lexicon.


## Day/date continuation

Added 日子、日期、日记、日历、日出、日落、节日、假日、平日、工作日, with pinyin, authored Thai glosses and character/stroke coverage. Current bundled totals are 133 words / 116 characters. 日 now has 11 memberships including 生日; entering from 生日 exposes 10 new words. Neutral-tone 日子 is rìzi, while standalone 子 is zǐ.


### Foundation starting hubs — 2026-10-19

Added 口 kǒu (ปาก), 心 xīn (ใจ), 手 shǒu (มือ), 火 huǒ (ไฟ), 山 shān (ภูเขา), 月 yuè (ดวงจันทร์ / เดือน). These are starting characters for vocabulary exploration, not a formal radical classification. There are now 14 starting shortcuts, 149 unique words and 125 character records. The expansion adds 16 unique words; existing 门口 and 手工 are reused. Each new hub has at least three actual containing-word connections. 火山 connects both 火 and 山; 山水 also extends the existing 水 branch.

Implementation: foundationExpansion.ts stores curated character and word readings; seed.ts deduplicates and builds actual character-membership edges; catalog.ts exports the shortcut IDs; BloomApp.tsx renders all shortcuts with Chinese, pinyin and Thai. Existing ORBIT CSS and camera controls are reused. gen-strokes.mjs includes the new source file and bundles every required stroke file locally.

Validation: 74 tests across 10 files and production build passed. The content tests check six starter IDs, translations, minimum vocabulary coverage and shared-word links; existing tests check character metadata and stroke coverage. In-app browser checks opened all six shortcuts successfully and confirmed their labels. Production bundle: index-0Pyo0_6q.js. Screenshot: evidence/orbit-foundation-hubs.png. Audio uses the existing playback implementation; no native-speaker audit was performed.

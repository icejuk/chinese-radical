/* หน้าเรียนราก — การ์ดต่อหนึ่งราก: ตัวใหญ่ + รูปแปร + เรื่องเล่าช่วยจำ + ลำดับขีด + ตัวอักษรที่ใช้ราก
   ที่นี่ "ตัวจีนเป็นพระเอก" ได้เต็มที่ (ต่างจาก chinese-study) แต่ยังมีพินอิน+ไทยกำกับทุกที่ */
import { useMemo, useState } from 'react'
import { RAD_CATS, type RadCat } from '../data/types'
import { learnRads, charsUsingRad } from '../lib/tree'
import { StrokePad } from '../components/StrokePad'
import { SpeakButton } from '../components/SpeakButton'
import { Chips } from '../components/ui'
import { KEYS, readJson, writeJson } from '../lib/storage'

type CatFilter = RadCat | 'ทั้งหมด'

export function RadicalsScreen({ onPickChar }: { onPickChar: (ch: string) => void }) {
  const saved = readJson<{ cat: CatFilter }>(KEYS.radFilter, { cat: 'ทั้งหมด' })
  const [cat, setCat] = useState<CatFilter>(
    saved.cat === 'ทั้งหมด' || RAD_CATS.includes(saved.cat as RadCat) ? saved.cat : 'ทั้งหมด',
  )
  const [open, setOpen] = useState<string | null>(null)

  const list = useMemo(
    () => (cat === 'ทั้งหมด' ? learnRads : learnRads.filter((r) => r.cat === cat)).slice(),
    [cat],
  )

  // หมวดที่มีรากจริงเท่านั้น — ไม่โชว์ชิปเปล่า
  const cats = useMemo(
    () => RAD_CATS.filter((c) => learnRads.some((r) => r.cat === c)),
    [],
  )

  return (
    <div className="stack">
      <Chips<CatFilter>
        label="หมวดของราก"
        value={cat}
        onChange={(v) => {
          setCat(v)
          writeJson(KEYS.radFilter, { cat: v })
        }}
        items={[
          { v: 'ทั้งหมด', label: `ทั้งหมด (${learnRads.length})` },
          ...cats.map((c) => ({ v: c as CatFilter, label: c })),
        ]}
      />

      <div className="rad-grid">
        {list.map((r) => {
          const kids = charsUsingRad(r)
          const isOpen = open === r.r
          return (
            <div key={r.r} className={`card rad-card ${isOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="rad-head"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : r.r)}
              >
                <span className="rad-glyph zh">{r.r}</span>
                <span className="rad-meta">
                  <span className="py">{r.py}</span>
                  <b className="rad-th">{r.th}</b>
                  <span className="muted rad-sub">
                    {r.strokes} ขีด · {r.cat}
                    {r.vars?.length ? ` · รูปแปร ${r.vars.join(' ')}` : ''}
                  </span>
                </span>
                <span className="rad-caret" aria-hidden>
                  {isOpen ? '▾' : '▸'}
                </span>
              </button>

              {isOpen && (
                <div className="rad-body">
                  <p className="rad-story">{r.story}</p>

                  <SpeakButton zh={r.r} hint={`ฟังเสียง ${r.py}`} />

                  <div className="rad-strokes">
                    <StrokePad char={r.r} mode="animate" size={180} />
                  </div>

                  {kids.length > 0 && (
                    <div className="rad-kids">
                      <div className="section-title">ตัวอักษรที่ใช้รากนี้ ({kids.length})</div>
                      <div className="chips">
                        {kids.map((h) => (
                          <button
                            key={h.zh}
                            type="button"
                            className="chip chip-zh"
                            onClick={() => onPickChar(h.zh)}
                          >
                            <span className="zh">{h.zh}</span>
                            <span className="chip-sub">
                              {h.py} · {h.th}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

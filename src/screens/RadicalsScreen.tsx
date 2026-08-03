/* ตารางราก — ไว้ "หาตัวที่รู้จักแล้ว" ไม่ใช่ไว้อ่านเรียงยาว
   เดิมเป็น accordion 115 ใบสูง 6,600px (ผู้ใช้บอกว่าใช้ยาก) → เปลี่ยนเป็นตารางตัวจีนใหญ่
   กดตัวไหนก็เข้าโหมดแฟลชการ์ดของหมวดนั้น เริ่มที่ตัวที่กด */
import { useMemo, useState } from 'react'
import { RAD_CATS, type RadCat, type Radical } from '../data/types'
import { learnRads } from '../lib/tree'
import { srsGet, starsGet } from '../lib/srs'
import { KEYS, readJson, writeJson } from '../lib/storage'
import { TodayCard } from '../components/TodayCard'

type CatFilter = RadCat | 'ทั้งหมด'

export function RadicalsScreen({
  onOpen,
  onStartToday,
}: {
  /** เปิดโหมดเรียน: ส่งชุดทั้งหมวด + ตำแหน่งที่กด */
  onOpen: (queue: Radical[], start: number, label: string) => void
  /** กดจากการ์ดแนะนำวันนี้ */
  onStartToday: () => void
}) {
  const saved = readJson<{ cat: CatFilter }>(KEYS.radFilter, { cat: 'ทั้งหมด' })
  const [cat, setCat] = useState<CatFilter>(
    saved.cat === 'ทั้งหมด' || RAD_CATS.includes(saved.cat as RadCat) ? saved.cat : 'ทั้งหมด',
  )

  const srs = useMemo(() => srsGet(), [])
  const stars = useMemo(() => starsGet(), [])

  const cats = useMemo(() => RAD_CATS.filter((c) => learnRads.some((r) => r.cat === c)), [])
  const list = useMemo(
    () => (cat === 'ทั้งหมด' ? learnRads : learnRads.filter((r) => r.cat === cat)),
    [cat],
  )

  return (
    <div className="stack">
      <TodayCard onStart={onStartToday} />

      <div className="chips">
        {[{ v: 'ทั้งหมด' as CatFilter, label: `ทั้งหมด ${learnRads.length}` },
          ...cats.map((c) => ({ v: c as CatFilter, label: c }))].map((it) => (
          <button
            key={it.v}
            type="button"
            className="chip"
            aria-selected={cat === it.v}
            onClick={() => {
              setCat(it.v)
              writeJson(KEYS.radFilter, { cat: it.v })
            }}
          >
            {it.label}
          </button>
        ))}
      </div>

      <div className="rad-table">
        {list.map((r, idx) => (
          <button
            key={r.r}
            type="button"
            className={`rad-cell ${srs[r.r] ? 'is-learned' : ''}`}
            onClick={() => onOpen(list, idx, cat === 'ทั้งหมด' ? 'ตารางราก' : cat)}
          >
            <span className="zh rad-cell-glyph">{r.r}</span>
            <span className="rad-cell-th">{r.th}</span>
            <span className="muted rad-cell-py">{r.py}</span>
            {stars.has(r.r) && <span className="rad-cell-star">⭐</span>}
            {srs[r.r] && <span className="rad-cell-dot" aria-label="เรียนแล้ว" />}
          </button>
        ))}
      </div>

      <div className="muted rad-legend">
        จุดแดงมุมขวาล่าง = เคยเรียนแล้ว · ⭐ = ทำเครื่องหมายว่ายังไม่แม่น · กดที่ตัวไหนก็เริ่มอ่านจากตัวนั้น
      </div>
    </div>
  )
}

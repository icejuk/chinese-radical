/* คลังตัวอักษร — ตารางรวม กรองตามราก / HSK / ⭐ ยังไม่แม่น
   กดที่ตัวไหนก็เด้งไปหน้าแตกตัวอักษรของตัวนั้น */
import { useMemo, useState } from 'react'
import { hanzi } from '../data/hanzi'
import { learnRads, radsOf } from '../lib/tree'
import { srsGet, starsGet } from '../lib/srs'
import { Chips } from '../components/ui'
import { KEYS, readJson, writeJson } from '../lib/storage'

type Filter = { rad: string; hsk: string; star: boolean }

export function CharsScreen({ onPickChar }: { onPickChar: (ch: string) => void }) {
  const saved = readJson<Filter>(KEYS.charFilter, { rad: '', hsk: '', star: false })
  const [f, setF] = useState<Filter>(saved)

  const set = (patch: Partial<Filter>) => {
    const nf = { ...f, ...patch }
    setF(nf)
    writeJson(KEYS.charFilter, nf)
  }

  const srs = useMemo(() => srsGet(), [])
  const stars = useMemo(() => starsGet(), [])

  // เฉพาะรากที่มีตัวอักษรใช้จริง — ไม่ให้กรองแล้วว่างเปล่า
  const radOpts = useMemo(
    () => learnRads.filter((r) => hanzi.some((h) => radsOf(h).includes(r))),
    [],
  )

  const list = useMemo(
    () =>
      hanzi.filter((h) => {
        if (f.rad && !radsOf(h).some((r) => r.r === f.rad)) return false
        if (f.hsk && String(h.hsk ?? '') !== f.hsk) return false
        if (f.star && !stars.has(h.zh)) return false
        return true
      }),
    [f, stars],
  )

  return (
    <div className="stack">
      <Chips
        label="ระดับ HSK"
        value={f.hsk}
        onChange={(v) => set({ hsk: v })}
        items={[
          { v: '', label: `ทั้งหมด (${hanzi.length})` },
          { v: '1', label: 'HSK 1' },
          { v: '2', label: 'HSK 2' },
        ]}
      />

      <Chips
        label="กรองตามราก"
        value={f.rad}
        onChange={(v) => set({ rad: v })}
        items={[
          { v: '', label: 'ทุกราก' },
          ...radOpts.map((r) => ({ v: r.r, label: `${r.r} ${r.th}` })),
        ]}
      />

      <label className="card card-pad chars-star">
        <input type="checkbox" checked={f.star} onChange={(e) => set({ star: e.target.checked })} />
        แสดงเฉพาะ ⭐ ที่ยังไม่แม่น ({stars.size} ตัวในชุดทวน)
      </label>

      <div className="muted">{list.length} ตัว</div>

      <div className="chars-grid">
        {list.map((h) => {
          const r = srs[h.zh]
          return (
            <button key={h.zh} type="button" className="card chars-cell" onClick={() => onPickChar(h.zh)}>
              <span className="zh chars-glyph">{h.zh}</span>
              <span className="py">{h.py}</span>
              <span className="chars-th">{h.th}</span>
              <span className="muted chars-parts">{h.parts.join(' ')}</span>
              {r && (r.right > 0 || r.wrong > 0) && (
                <span className="chars-srs">
                  ✓{r.right} ✗{r.wrong}
                </span>
              )}
              {stars.has(h.zh) && <span className="chars-star-mark">⭐</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

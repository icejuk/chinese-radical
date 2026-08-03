/* หน้าแตกตัวอักษร — หัวใจของแอป: เห็นว่าตัวหนึ่งประกอบจากรากอะไร แต่ละรากหมายถึงอะไร
   แตกซ้อนชั้นได้ (你 → 亻 + 尔 · 您 → 你 + 心 แล้ว 你 แตกต่อได้อีก) */
import { useEffect, useMemo, useState } from 'react'
import { hanzi } from '../data/hanzi'
import { glossOf, hanziMap, tree, type Node } from '../lib/tree'
import { StrokePad } from '../components/StrokePad'
import { SpeakButton } from '../components/SpeakButton'
import { isStarred, toggleStar } from '../lib/srs'

/** กิ่งหนึ่งของแผนภาพ — กดที่ส่วนประกอบเพื่อไปดูตัวนั้นเป็นตัวตั้งต่อได้ */
function Branch({ node, onPick }: { node: Node; onPick: (ch: string) => void }) {
  const g = glossOf(node.ch)
  const canDrill = hanziMap.has(node.ch)
  return (
    <div className="tree-node">
      <button
        type="button"
        className={`tree-chip ${node.rad?.kind === 'sound' ? 'is-sound' : ''} ${canDrill ? 'can-drill' : ''}`}
        onClick={() => canDrill && onPick(node.ch)}
        title={canDrill ? 'กดเพื่อแตกตัวนี้ต่อ' : undefined}
      >
        <span className="zh tree-glyph">{node.ch}</span>
        {g && (
          <span className="tree-gloss">
            <span className="py">{g.py}</span>
            <span className="tree-th">{g.th}</span>
          </span>
        )}
        {node.rad?.kind === 'sound' && <span className="tree-tag">บอกเสียง</span>}
      </button>

      {node.kids.length > 0 && (
        <div className="tree-kids">
          {node.kids.map((k, i) => (
            <Branch key={`${k.ch}-${i}`} node={k} onPick={onPick} />
          ))}
        </div>
      )}
    </div>
  )
}

export function BreakdownScreen({
  char,
  setChar,
}: {
  char: string
  setChar: (ch: string) => void
}) {
  const [q, setQ] = useState('')
  const [starred, setStarred] = useState(() => isStarred(char))

  useEffect(() => setStarred(isStarred(char)), [char])

  const h = hanziMap.get(char)
  const t = useMemo(() => tree(char), [char])

  const results = useMemo(() => {
    const s = q.trim()
    if (!s) return []
    return hanzi
      .filter(
        (x) =>
          x.zh === s ||
          x.py.replace(/[̄́̌̀]/g, '').includes(s.toLowerCase()) ||
          x.th.includes(s) ||
          x.parts.includes(s),
      )
      .slice(0, 24)
  }, [q])

  return (
    <div className="stack">
      <div className="card card-pad">
        <label className="section-title" htmlFor="bd-q">
          ค้นตัวอักษร (พิมพ์ตัวจีน พินอิน หรือคำแปลไทย)
        </label>
        <input
          id="bd-q"
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="เช่น 河 · he · แม่น้ำ"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        {results.length > 0 && (
          <div className="chips bd-results">
            {results.map((r) => (
              <button
                key={r.zh}
                type="button"
                className="chip chip-zh"
                onClick={() => {
                  setChar(r.zh)
                  setQ('')
                }}
              >
                <span className="zh">{r.zh}</span>
                <span className="chip-sub">
                  {r.py} · {r.th}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {h ? (
        <>
          <div className="card card-pad bd-main">
            <div className="bd-hero">
              <div className="zh bd-glyph">{h.zh}</div>
              <div className="bd-info">
                <div className="py bd-py">{h.py}</div>
                <div className="bd-th">{h.th}</div>
                {h.hsk && <div className="muted">HSK {h.hsk}</div>}
                <button
                  type="button"
                  className={`btn ${starred ? 'btn-ok solid' : ''}`}
                  onClick={() => setStarred(toggleStar(h.zh))}
                >
                  {starred ? '⭐ อยู่ในชุดทวน' : '☆ ใส่ชุดทวน'}
                </button>
              </div>
            </div>

            <SpeakButton zh={h.zh} size="xl" hint={`ฟังเสียง ${h.py}`} />

            <div className="bd-hint">{h.hint}</div>

            <div className="section-title">แตกส่วนประกอบ</div>
            <div className="tree-root">
              {t.kids.map((k, i) => (
                <Branch key={`${k.ch}-${i}`} node={k} onPick={setChar} />
              ))}
            </div>

            {h.words?.length ? (
              <>
                <div className="section-title">เจอในคำ</div>
                <div className="bd-words">
                  {h.words.map((w) => (
                    <div key={w.zh} className="bd-word">
                      <span className="zh">{w.zh}</span>
                      <span className="py">{w.py}</span>
                      <span className="muted">{w.th}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div className="card card-pad">
            <div className="section-title">ลำดับขีดของ {h.zh}</div>
            <StrokePad char={h.zh} mode="animate" size={220} />
          </div>
        </>
      ) : (
        <div className="card card-pad muted">ไม่พบตัวอักษรนี้ในคลัง — ลองค้นด้วยช่องด้านบน</div>
      )}
    </div>
  )
}

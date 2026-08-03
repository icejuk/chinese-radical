/* หน้าแตกตัวอักษร — หัวใจของแอป: เห็นว่าตัวหนึ่งประกอบจากรากอะไร แต่ละรากหมายถึงอะไร
   แตกซ้อนชั้นได้ (你 → 亻 + 尔 · 您 → 你 + 心 แล้ว 你 แตกต่อได้อีก)

   ⚠️ ลำดับขีดต้องอยู่ "แถวแรก" คู่กับข้อมูลตัวอักษร — รอบก่อนวางไว้ท้ายหน้า
   ผู้ใช้ต้องเลื่อนผ่านช่องค้นหา + ปุ่มฟังเสียง + คำอธิบาย + แผนภาพ กว่าจะเห็นว่าเขียนยังไง
   กรอบลำดับขีดโชว์ตัวอักษรอยู่แล้ว จึงไม่ต้องมีตัวจีนใหญ่ซ้ำอีกตัว */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { hanzi } from '../data/hanzi'
import { glossOf, hanziMap, tree, type Node } from '../lib/tree'
import { strokeGroups } from '../lib/strokeGroups'
import { StrokePad } from '../components/StrokePad'
import { SpeakButton } from '../components/SpeakButton'
import { isStarred, toggleStar } from '../lib/srs'

/** กิ่งหนึ่งของแผนภาพ — กดที่ส่วนประกอบเพื่อไปดูตัวนั้นเป็นตัวตั้งต่อได้
    active = รากนี้กำลังถูกเล่นอยู่ในกรอบลำดับขีดด้านบน */
function Branch({
  node,
  onPick,
  active = false,
}: {
  node: Node
  onPick: (ch: string) => void
  active?: boolean
}) {
  const g = glossOf(node.ch)
  const canDrill = hanziMap.has(node.ch)
  return (
    <div className="tree-node">
      <button
        type="button"
        className={`tree-chip ${node.rad?.kind === 'sound' ? 'is-sound' : ''} ${canDrill ? 'can-drill' : ''} ${active ? 'is-active' : ''}`}
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
  /** รากลำดับที่กรอบลำดับขีดกำลังเล่น — ใช้ไฮไลต์กิ่งในแผนภาพให้ตรงกัน */
  const [activeGroup, setActiveGroup] = useState<number | null>(null)

  useEffect(() => setStarred(isStarred(char)), [char])

  const h = hanziMap.get(char)
  const t = useMemo(() => tree(char), [char])
  /* null = แบ่งขีดตามรากไม่ได้ (เช่น 学 友 果 我 理 现 玩 ที่รูปย่อทำให้ขีดไม่ตรง)
     → StrokePad จะเล่นรวดเดียวตามเดิม */
  const groups = useMemo(() => strokeGroups(char), [char])
  const onGroupChange = useCallback((i: number | null) => setActiveGroup(i), [])

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
      {/* ช่องค้นเป็นแถบบางแถวเดียว ไม่มีการ์ดครอบ — ของสำคัญคือสิ่งที่อยู่ใต้มัน */}
      <input
        className="input bd-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ค้นตัวอักษร: 河 · he · แม่น้ำ"
        aria-label="ค้นตัวอักษรด้วยตัวจีน พินอิน หรือคำแปลไทย"
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
              className="chip-zh"
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

      {h ? (
        <>
          {/* แถวแรก = ลำดับขีด + ข้อมูล ไม่ต้องเลื่อนหา */}
          <div className="card card-pad bd-top">
            <StrokePad
              char={h.zh}
              mode="animate"
              size={190}
              groups={groups}
              onGroupChange={onGroupChange}
            />

            <div className="bd-info">
              <div className="bd-gloss">
                <span className="py bd-py">{h.py}</span>
                <span className="bd-th">{h.th}</span>
                {h.hsk && <span className="muted bd-hsk">HSK {h.hsk}</span>}
              </div>
              <div className="bd-btns">
                <SpeakButton zh={h.zh} hint="ฟังเสียง" />
                <button
                  type="button"
                  className={`btn ${starred ? 'btn-ok solid' : ''}`}
                  onClick={() => setStarred(toggleStar(h.zh))}
                >
                  {starred ? '⭐ ในชุดทวน' : '☆ ใส่ชุดทวน'}
                </button>
              </div>
            </div>
          </div>

          <div className="card card-pad bd-main">
            <div className="bd-hint">{h.hint}</div>

            <div className="section-title">แตกส่วนประกอบ</div>
            <div className="tree-root">
              {t.kids.map((k, i) => (
                <Branch
                  key={`${k.ch}-${i}`}
                  node={k}
                  onPick={setChar}
                  // กิ่งชั้นแรกเรียงตรงกับลำดับกลุ่มขีด (มาจาก parts ชุดเดียวกัน)
                  active={activeGroup === i}
                />
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
        </>
      ) : (
        <div className="card card-pad muted">ไม่พบตัวอักษรนี้ในคลัง — ลองค้นด้วยช่องด้านบน</div>
      )}
    </div>
  )
}

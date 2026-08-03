/* ฝึกเขียน — ลากเขียนตามในกรอบ ระบบตรวจทีละขีด (hanzi-writer quiz mode)
   เขียนจบตัว → บันทึก SRS (ผิดเกิน 2 ขีดถือว่ายังไม่แม่น) แล้ว "ต้องกดปุ่มไปตัวถัดไปเอง"
   ไม่มี auto-advance เลยในหน้านี้ เพราะต้องมีเวลาดูว่าตัวที่เขียนเสร็จหน้าตาถูกไหม */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { hanzi } from '../data/hanzi'
import { learnRads, shuffle } from '../lib/tree'
import { srsUpdate, starsGet, dueHanzi } from '../lib/srs'
import { StrokePad } from '../components/StrokePad'
import { SpeakButton } from '../components/SpeakButton'
import { Chips, EmptyNote } from '../components/ui'
import { KEYS, readJson, writeJson } from '../lib/storage'

type Src = 'rad' | 'char' | 'star' | 'due'

const SRC: { v: Src; label: string }[] = [
  { v: 'rad', label: 'ราก' },
  { v: 'char', label: 'ตัวอักษร' },
  { v: 'due', label: 'ครบกำหนดทวน' },
  { v: 'star', label: '⭐ ยังไม่แม่น' },
]

type Item = { zh: string; py: string; th: string }

function poolOf(src: Src): Item[] {
  switch (src) {
    case 'rad':
      return learnRads.map((r) => ({ zh: r.r, py: r.py, th: r.th }))
    case 'char':
      return hanzi.map((h) => ({ zh: h.zh, py: h.py, th: h.th }))
    case 'due':
      return dueHanzi().map((h) => ({ zh: h.zh, py: h.py, th: h.th }))
    case 'star': {
      const s = starsGet()
      const fromChar = hanzi.filter((h) => s.has(h.zh)).map((h) => ({ zh: h.zh, py: h.py, th: h.th }))
      const fromRad = learnRads.filter((r) => s.has(r.r)).map((r) => ({ zh: r.r, py: r.py, th: r.th }))
      return [...fromChar, ...fromRad]
    }
  }
}

export function WriteScreen() {
  const saved = readJson<{ src: Src }>(KEYS.writeSrc, { src: 'rad' })
  const [src, setSrc] = useState<Src>(SRC.some((s) => s.v === saved.src) ? saved.src : 'rad')
  const [queue, setQueue] = useState<Item[]>(() => shuffle(poolOf(saved.src)))
  const [i, setI] = useState(0)
  const [result, setResult] = useState<number | null>(null) // จำนวนขีดที่ผิด (null = ยังเขียนไม่จบ)
  const [showRef, setShowRef] = useState(false)

  useEffect(() => {
    setQueue(shuffle(poolOf(src)))
    setI(0)
    setResult(null)
    setShowRef(false)
    writeJson(KEYS.writeSrc, { src })
  }, [src])

  const item = queue[i]

  const onDone = useCallback(
    (mistakes: number) => {
      setResult(mistakes)
      if (item) srsUpdate(item.zh, mistakes <= 2)
    },
    [item],
  )

  const next = () => {
    setResult(null)
    setShowRef(false)
    setI((n) => n + 1)
  }

  const restart = () => {
    setQueue(shuffle(poolOf(src)))
    setI(0)
    setResult(null)
    setShowRef(false)
  }

  const stats = useMemo(() => ({ done: i, total: queue.length }), [i, queue.length])

  return (
    <div className="stack">
      <Chips<Src> label="ชุดที่จะฝึกเขียน" value={src} onChange={setSrc} items={SRC} />

      {queue.length === 0 ? (
        <EmptyNote>
          ชุดนี้ยังว่าง — ลองทำควิซหรือกด ⭐ ในหน้าแตกตัวอักษรเพื่อใส่ตัวที่ยังไม่แม่นเข้ามาก่อน
        </EmptyNote>
      ) : !item ? (
        <div className="card card-pad done">
          <div className="done-ico">🎉</div>
          <div className="done-title">เขียนครบชุดแล้ว!</div>
          <div className="muted">{stats.total} ตัว</div>
          <button type="button" className="btn btn-primary btn-lg" onClick={restart}>
            เริ่มใหม่
          </button>
        </div>
      ) : (
        <div className="card card-pad write">
          <div className="muted write-count">
            ตัวที่ {i + 1} / {queue.length}
          </div>

          {/* โจทย์เป็นพินอิน+ไทย ไม่โชว์ตัวจีนให้ลอก — แต่กด "ดูตัวอย่าง" ได้ถ้านึกไม่ออก */}
          <div className="write-prompt">
            <span className="py write-py">{item.py}</span>
            <span className="write-th">{item.th}</span>
          </div>

          <div className="write-actions">
            <SpeakButton zh={item.zh} hint={`ฟังเสียง ${item.py}`} />
            <button type="button" className="btn" onClick={() => setShowRef((v) => !v)}>
              {showRef ? '🙈 ซ่อนตัวอย่าง' : '👀 ดูตัวอย่าง'}
            </button>
          </div>

          {showRef && (
            <div className="write-ref">
              <div className="zh write-ref-glyph">{item.zh}</div>
              <StrokePad char={item.zh} mode="animate" size={160} />
            </div>
          )}

          {/* key บังคับให้ StrokePad สร้างใหม่ทุกตัว — กัน state ขีดของตัวก่อนหน้าค้าง */}
          <StrokePad key={`${item.zh}-${i}`} char={item.zh} mode="quiz" size={260} onQuizDone={onDone} />

          {result !== null && (
            <>
              <div className={`fb ${result <= 2 ? 'ok' : 'bad'}`}>
                {result === 0
                  ? '✓ เขียนถูกทุกขีดเลย!'
                  : result <= 2
                    ? `✓ เขียนจบแล้ว (ผิด ${result} ครั้ง)`
                    : `เขียนจบแล้ว แต่ผิด ${result} ครั้ง — ใส่ไว้ในชุดทวนให้แล้ว`}
              </div>
              <button type="button" className="btn btn-primary btn-lg btn-block" onClick={next}>
                ตัวถัดไป →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

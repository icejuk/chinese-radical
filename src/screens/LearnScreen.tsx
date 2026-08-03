/* หน้าเรียนแบบแฟลชการ์ดเต็มจอ — ทีละรากเท่านั้น
   ทำไมไม่ใช่ลิสต์: ลิสต์ 115 ใบทำให้ต้องตัดสินใจเองว่าจะอ่านตัวไหน (ผู้ใช้บอกว่า "ไม่รู้จะเริ่มจากไหน")
   ที่นี่มีทางเดียวคือ "ต่อไป" — ชุดถูกเลือกมาให้แล้วจาก lib/today.ts */
import { useCallback, useEffect, useState } from 'react'
import type { Radical } from '../data/types'
import { charsUsingRad } from '../lib/tree'
import { addStar, removeStar, srsUpdate } from '../lib/srs'
import { markDone } from '../lib/today'
import { StrokePad } from '../components/StrokePad'
import { SpeakButton } from '../components/SpeakButton'
import { Progress } from '../components/ui'

export function LearnScreen({
  queue,
  label,
  initialIndex,
  trackToday,
  onPickChar,
  onFinish,
  onExplore,
  onRestartToday,
  onPositionChange,
}: {
  queue: Radical[]
  /** ข้อความบอกที่มาของชุด เช่น "ชุดของวันนี้" */
  label: string
  initialIndex: number
  trackToday: boolean
  onPickChar: (ch: string) => void
  /** กดจากหน้าจบชุด — พาไปทำควิซ */
  onFinish: () => void
  onExplore: () => void
  onRestartToday: () => void
  onPositionChange: (index: number) => void
}) {
  const [i, setI] = useState(initialIndex)

  const r = queue[i]

  // ขึ้นใบใหม่: ลำดับขีดเริ่มเล่นเอง แต่ยังไม่นับว่าเรียนจนกว่าจะให้คะแนนตัวเอง
  useEffect(() => {
    if (!r) return
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [r])

  const rate = useCallback((remembered: boolean) => {
    if (!r) return
    srsUpdate(r.r, remembered)
    if (remembered) removeStar(r.r)
    else addStar(r.r)
    if (trackToday) markDone(r.r)

    const nextIndex = i + 1
    setI(nextIndex)
    onPositionChange(nextIndex)
  }, [i, onPositionChange, r, trackToday])

  const prev = useCallback(() => {
    const previousIndex = Math.max(0, i - 1)
    setI(previousIndex)
    onPositionChange(previousIndex)
  }, [i, onPositionChange])

  if (!r) {
    return (
      <div className="card card-pad done learn-done">
        <div className="done-ico">✦</div>
        <div className="done-title">เรียนครบชุดแล้ว</div>
        <div className="muted">{queue.length} ราก · {label}</div>
        <button type="button" className="btn btn-primary btn-lg btn-block" onClick={onFinish}>
          ลอง 5 ข้อจากชุดนี้ →
        </button>
        <button
          type="button"
          className="btn btn-block"
          onClick={() => {
            setI(0)
            onPositionChange(0)
          }}
        >
          ทวนชุดนี้อีกรอบ
        </button>
        {!trackToday && (
          <button type="button" className="btn btn-quiet" onClick={onRestartToday}>
            กลับไปชุดวันนี้
          </button>
        )}
      </div>
    )
  }

  const kids = charsUsingRad(r)

  return (
    <div className="learn v2-learn">
      <div className="learn-top">
        <span className="learn-count">
          <b>{i + 1}</b> / {queue.length} <span>{label}</span>
        </span>
        <button type="button" className="learn-switch" onClick={onExplore}>
          เลือกตัวอื่น
        </button>
      </div>
      <Progress value={i} max={queue.length} />

      {/* ใช้ลำดับขีดเป็น hero แทนตัวจีนภาพนิ่ง — เปิดใบแล้วเห็นและเริ่มเล่นทันที
          ผู้ใช้จึงไม่ต้องกดปุ่มหรือเลื่อนผ่านเรื่องเล่าลงไปหากรอบเขียน */}
      <div className="learn-card">
        <div className="learn-stroke-hero">
          <StrokePad char={r.r} mode="animate" size={184} autoStart />
        </div>

        <div className="learn-essential">
          <div className="learn-gloss">
            <span className="py learn-py">{r.py}</span>
            <span className="learn-th">{r.th}</span>
          </div>
          <SpeakButton zh={r.r} hint={`ฟัง ${r.py}`} className="learn-speak" />
        </div>

        <p className="learn-story">{r.story}</p>

        <details className="learn-more">
          <summary>
            รายละเอียด{kids.length ? ` · ตัวอย่าง ${kids.length} ตัว` : ''}
          </summary>
          <div className="learn-tags">
            <span className="seal">{r.strokes} ขีด</span>
            <span className="seal">{r.cat}</span>
            {r.vars?.length ? (
              <span className="seal learn-var">
                รูปแปร <b className="zh">{r.vars.join(' ')}</b>
              </span>
            ) : null}
          </div>
          {kids.length > 0 ? (
            <div className="learn-kids">
              <div className="learn-kids-grid">
                {kids.map((h) => (
                  <button
                    key={h.zh}
                    type="button"
                    className="learn-kid"
                    onClick={() => onPickChar(h.zh)}
                  >
                    <span className="zh learn-kid-glyph">{h.zh}</span>
                    <span className="py">{h.py}</span>
                    <span className="learn-kid-th">{h.th}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="muted learn-nokids">ยังไม่มีตัวอักษรตัวอย่างในคลังตอนนี้</div>
          )}
        </details>
      </div>

      <div className="learn-nav v2-rating">
        <button
          type="button"
          className="learn-prev"
          disabled={i === 0}
          aria-label="ก่อนหน้า"
          onClick={prev}
        >
          ‹
        </button>
        <button type="button" className="btn btn-lg rate-again" onClick={() => rate(false)}>
          <span>ยังไม่แม่น</span>
          <small>เก็บไว้ทวน</small>
        </button>
        <button type="button" className="btn btn-primary btn-lg rate-good" onClick={() => rate(true)}>
          <span>จำได้</span>
          <small>ไปตัวถัดไป</small>
        </button>
      </div>
    </div>
  )
}

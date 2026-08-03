/* หน้าเรียนแบบแฟลชการ์ดเต็มจอ — ทีละรากเท่านั้น
   ทำไมไม่ใช่ลิสต์: ลิสต์ 115 ใบทำให้ต้องตัดสินใจเองว่าจะอ่านตัวไหน (ผู้ใช้บอกว่า "ไม่รู้จะเริ่มจากไหน")
   ที่นี่มีทางเดียวคือ "ต่อไป" — ชุดถูกเลือกมาให้แล้วจาก lib/today.ts */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Radical } from '../data/types'
import { charsUsingRad } from '../lib/tree'
import { srsUpdate, isStarred, toggleStar } from '../lib/srs'
import { markDone } from '../lib/today'
import { StrokePad } from '../components/StrokePad'
import { SpeakButton } from '../components/SpeakButton'
import { Progress } from '../components/ui'

export function LearnScreen({
  queue,
  label,
  onPickChar,
  onFinish,
}: {
  queue: Radical[]
  /** ข้อความบอกที่มาของชุด เช่น "ชุดของวันนี้" */
  label: string
  onPickChar: (ch: string) => void
  /** กดจากหน้าจบชุด — พาไปทำควิซ */
  onFinish: () => void
}) {
  const [i, setI] = useState(0)
  const [showKids, setShowKids] = useState(false)
  const [star, setStar] = useState(false)
  const touchX = useRef<number | null>(null)

  const r = queue[i]

  // ขึ้นใบใหม่: ลำดับขีดเริ่มเล่นเองจาก StrokePad + บันทึกว่าเห็นแล้ววันนี้
  useEffect(() => {
    if (!r) return
    setShowKids(false)
    setStar(isStarred(r.r))
    markDone(r.r)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [r])

  const next = useCallback(() => {
    if (!r) return
    srsUpdate(r.r, true) // ผ่านการ์ดไปถือว่าได้ทวนแล้ว — ถ้ายังไม่แม่นผู้ใช้กดดาวเอง
    setI((n) => n + 1)
  }, [r])

  const prev = useCallback(() => setI((n) => Math.max(0, n - 1)), [])

  // ปัดซ้าย/ขวาเปลี่ยนใบ (มือถือ) — ต้องปัดเกิน 60px กันการปัดพลาดตอนเลื่อนอ่าน
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchX.current
    touchX.current = null
    if (start == null) return
    const dx = (e.changedTouches[0]?.clientX ?? start) - start
    if (dx < -60) next()
    else if (dx > 60) prev()
  }

  if (!r) {
    return (
      <div className="card card-pad done learn-done">
        <div className="done-ico">✦</div>
        <div className="done-title">เรียนครบชุดแล้ว</div>
        <div className="muted">{queue.length} ราก · {label}</div>
        <button type="button" className="btn btn-primary btn-lg btn-block" onClick={onFinish}>
          ลองทำควิซดู →
        </button>
        <button type="button" className="btn btn-block" onClick={() => setI(0)}>
          ทวนชุดนี้อีกรอบ
        </button>
      </div>
    )
  }

  const kids = charsUsingRad(r)

  return (
    <div className="learn" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="learn-top">
        <span className="muted learn-count">
          {label} · ราก <b>{i + 1}</b> / {queue.length}
        </span>
        <button
          type="button"
          className={`btn learn-star ${star ? 'btn-ok solid' : ''}`}
          onClick={() => setStar(toggleStar(r.r))}
        >
          {star ? '⭐ ยังไม่แม่น' : '☆ ทำเครื่องหมาย'}
        </button>
      </div>
      <Progress value={i} max={queue.length} />

      {/* ใช้ลำดับขีดเป็น hero แทนตัวจีนภาพนิ่ง — เปิดใบแล้วเห็นและเริ่มเล่นทันที
          ผู้ใช้จึงไม่ต้องกดปุ่มหรือเลื่อนผ่านเรื่องเล่าลงไปหากรอบเขียน */}
      <div className="learn-card">
        <div className="learn-stroke-hero">
          <StrokePad char={r.r} mode="animate" size={200} autoStart />
        </div>

        <div className="learn-gloss">
          <span className="py learn-py">{r.py}</span>
          <span className="learn-th">{r.th}</span>
        </div>

        {/* เสียงอ่านเป็นข้อมูลหลักเหมือนพินอิน — ต้องเห็นใน viewport แรกก่อนรายละเอียด/เรื่องเล่า */}
        <div className="learn-actions">
          <SpeakButton zh={r.r} hint={`ฟังเสียง ${r.py}`} className="learn-speak" />
        </div>

        <div className="learn-tags">
          <span className="seal">{r.strokes} ขีด</span>
          <span className="seal">{r.cat}</span>
          {r.vars?.length ? (
            <span className="seal learn-var">
              รูปแปร <b className="zh">{r.vars.join(' ')}</b>
            </span>
          ) : null}
        </div>

        <p className="learn-story">{r.story}</p>

        {kids.length === 0 && (
          <div className="muted learn-nokids">
            ยังไม่มีตัวอักษรตัวอย่างของรากนี้ในคลัง — จำรูปกับความหมายไว้ก่อน เดี๋ยวเจอในตัวอื่นแน่นอน
          </div>
        )}

        {kids.length > 0 && (
          <div className="learn-kids">
            <button type="button" className="learn-kids-head" onClick={() => setShowKids((v) => !v)}>
              <span>เจอรากนี้ใน {kids.length} ตัวอักษร</span>
              <span className="muted">{showKids ? '▾' : '›'}</span>
            </button>
            {showKids && (
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
            )}
          </div>
        )}
      </div>

      <div className="learn-nav">
        <button
          type="button"
          className="btn btn-round"
          disabled={i === 0}
          aria-label="ก่อนหน้า"
          onClick={prev}
        >
          ‹
        </button>
        <button type="button" className="btn btn-primary btn-lg learn-next" onClick={next}>
          ต่อไป ›
        </button>
      </div>
    </div>
  )
}

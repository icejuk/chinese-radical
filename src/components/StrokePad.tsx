/* กรอบเขียนอักษรจีน — ใช้ hanzi-writer (MIT) + ข้อมูลเส้นจาก public/strokes/ (ARPHIC PL)
   2 โหมดจาก component เดียว:
     animate = ดูลำดับขีด (เล่นทั้งตัว / ทีละขีด)
     quiz    = ลากเขียนเอง ระบบตรวจทีละขีด

   ⚠️ กับดักที่ต้องระวัง
   1. HanziWriter ผูกกับ DOM node จริง — ต้องเคลียร์ innerHTML ตอน cleanup
      ไม่งั้นเปลี่ยนตัวอักษรแล้ว svg ตัวเก่าค้างซ้อนกัน (และ StrictMode ของ React จะรัน effect 2 รอบ เห็นซ้อนทันที)
   2. สีต้องอ่านจาก CSS variable ตอนรันไทม์ เพราะ dark mode ของแอปนี้สลับด้วย prefers-color-scheme
      hanzi-writer รับแต่ค่าสีตรงๆ (hex/rgb) จึงต้องดึงค่าที่คำนวณแล้วมาใส่เอง + ฟัง event เปลี่ยนธีม */
import { useCallback, useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import { strokeChars, strokePath } from '../data/strokeIndex'

type Mode = 'animate' | 'quiz'

/** อ่านค่าสีที่คำนวณแล้วจาก CSS custom property */
function cssVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function colors() {
  return {
    strokeColor: cssVar('--ink', '#191a1c'),
    radicalColor: cssVar('--brand', '#17786a'),
    outlineColor: cssVar('--line-strong', '#cdc8c0'),
    highlightColor: cssVar('--brand', '#17786a'),
    drawingColor: cssVar('--brand-ink', '#0f5a4f'),
  }
}

export function StrokePad({
  char,
  mode = 'animate',
  size = 200,
  onQuizDone,
  autoStart = false,
}: {
  char: string
  mode?: Mode
  size?: number
  /** เรียกเมื่อเขียนครบทุกขีด — ส่งจำนวนครั้งที่ขีดผิดทั้งตัวไปให้ผู้เรียก (ใช้ตัดสิน SRS) */
  onQuizDone?: (mistakes: number) => void
  /** โหมด animate: เล่นทันทีที่ขึ้นตัวใหม่ (ใช้ในหน้าเรียน ไม่ใช้ในแบบฝึก) */
  autoStart?: boolean
}) {
  const box = useRef<HTMLDivElement>(null)
  const writer = useRef<HanziWriter | null>(null)
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState(false)
  const [done, setDone] = useState(0) // จำนวนขีดที่เขียนถูกแล้ว (โหมด quiz)
  const [miss, setMiss] = useState(0)
  const [total, setTotal] = useState(0)

  const has = strokeChars.has(char)

  useEffect(() => {
    if (!has || !box.current) return
    const node = box.current
    node.innerHTML = '' // กับดัก #1
    setReady(false)
    setErr(false)
    setDone(0)
    setMiss(0)

    const w = HanziWriter.create(node, char, {
      width: size,
      height: size,
      padding: Math.round(size * 0.06),
      showCharacter: mode === 'animate',
      showOutline: true,
      strokeAnimationSpeed: 0.8, // ช้ากว่า default เพื่อให้ตามทันว่าลากจากไหนไปไหน
      delayBetweenStrokes: 500,
      ...colors(),
      charDataLoader: (c, onLoad, onError) => {
        fetch(strokePath(c))
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
          .then(onLoad)
          .catch(onError)
      },
      onLoadCharDataError: () => setErr(true),
    })
    writer.current = w

    w.getCharacterData()
      .then((data) => {
        setTotal(data.strokes.length)
        setReady(true)
        if (mode === 'animate' && autoStart) w.animateCharacter()
      })
      .catch(() => setErr(true))

    return () => {
      w.cancelQuiz()
      writer.current = null
      node.innerHTML = ''
    }
  }, [char, mode, size, autoStart, has])

  // สลับ light/dark ระหว่างที่กรอบเปิดอยู่ → ย้อมสีใหม่ (กับดัก #2)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const w = writer.current
      if (!w) return
      const c = colors()
      for (const [k, v] of Object.entries(c)) w.updateColor(k as keyof typeof c, v)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const startQuiz = useCallback(() => {
    const w = writer.current
    if (!w) return
    setDone(0)
    setMiss(0)
    w.quiz({
      showHintAfterMisses: 3, // ผิด 3 ครั้งค่อยใบ้ — ให้โอกาสนึกเองก่อน
      leniency: 1.1, // นิ้วบนมือถือลากไม่เนี้ยบ เข้มเกินไปจะน่ารำคาญ
      onCorrectStroke: (s) => setDone(s.strokeNum + 1),
      onMistake: (s) => setMiss(s.totalMistakes),
      onComplete: (sum) => {
        setDone(total)
        onQuizDone?.(sum.totalMistakes)
      },
    })
  }, [onQuizDone, total])

  // โหมด quiz: เริ่มให้เขียนทันทีที่ข้อมูลโหลดเสร็จ (ผู้ใช้กดเข้ามาเพื่อเขียนอยู่แล้ว)
  useEffect(() => {
    if (mode === 'quiz' && ready) startQuiz()
  }, [mode, ready, startQuiz])

  if (!has) {
    return <div className="muted stroke-none">— ยังไม่มีข้อมูลลำดับขีดของตัวนี้ —</div>
  }

  return (
    <div className="strokepad">
      {/* 米字格 — เส้นตารางช่วยกะสัดส่วนเวลาเขียน (วาดด้วย CSS ไม่ใช่รูป) */}
      <div className="strokepad-grid" style={{ width: size, height: size }}>
        <div ref={box} className="strokepad-box" aria-label={`ลำดับขีดของ ${char}`} />
      </div>

      {err && <div className="fb bad">โหลดข้อมูลลำดับขีดไม่สำเร็จ</div>}

      {mode === 'animate' ? (
        <div className="strokepad-ctrl">
          <button type="button" className="btn" disabled={!ready} onClick={() => writer.current?.animateCharacter()}>
            ▶️ เล่นลำดับขีด
          </button>
          <button type="button" className="btn" disabled={!ready} onClick={() => writer.current?.loopCharacterAnimation()}>
            🔁 วนซ้ำ
          </button>
          <span className="muted strokepad-count">{total} ขีด</span>
        </div>
      ) : (
        <div className="strokepad-ctrl">
          <div className="strokepad-progress" aria-live="polite">
            ขีดที่ <b>{Math.min(done + 1, total)}</b> / {total}
            {miss > 0 && <span className="strokepad-miss"> · ผิด {miss} ครั้ง</span>}
          </div>
          <button type="button" className="btn" disabled={!ready} onClick={() => writer.current?.skipQuizStroke()}>
            ⏭ ข้ามขีดนี้
          </button>
          <button type="button" className="btn" disabled={!ready} onClick={startQuiz}>
            ↺ เขียนใหม่
          </button>
        </div>
      )}
    </div>
  )
}

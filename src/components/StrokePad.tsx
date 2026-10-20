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
import type { StrokeGroup } from '../lib/strokeGroups'

type Mode = 'animate' | 'quiz'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** อ่านค่าสีที่คำนวณแล้วจาก CSS custom property */
function cssVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function colors() {
  return {
    strokeColor: cssVar('--ink', '#1e1b16'),
    // ส่วนที่เป็น "ราก" ของตัวอักษรถูกย้อมด้วยแดงชาด — ตรงกับหัวใจของแอปนี้พอดี
    // (ข้อมูลบางตัวมี radStrokes บอกว่าขีดไหนเป็นราก ตัวที่ไม่มีก็จะเป็นสีหมึกทั้งตัว)
    radicalColor: cssVar('--seal', '#b23a2c'),
    outlineColor: cssVar('--line-strong', '#a89473'),
    highlightColor: cssVar('--seal', '#b23a2c'),
    // เส้นที่ผู้ใช้ลากเองใช้สีหยก เพื่อแยกจากเส้นเฉลย (หมึก) ให้เห็นชัดว่าตัวไหนเราเขียน
    drawingColor: cssVar('--jade', '#2c6a5a'),
  }
}

export function StrokePad({
  char,
  mode = 'animate',
  size = 200,
  onQuizDone,
  autoStart = false,
  groups,
  onGroupChange,
}: {
  char: string
  mode?: Mode
  size?: number
  /** เรียกเมื่อเขียนครบทุกขีด — ส่งจำนวนครั้งที่ขีดผิดทั้งตัวไปให้ผู้เรียก (ใช้ตัดสิน SRS) */
  onQuizDone?: (mistakes: number) => void
  /** โหมด animate: เล่นทันทีที่ขึ้นตัวใหม่ (ใช้ในหน้าเรียน ไม่ใช้ในแบบฝึก) */
  autoStart?: boolean
  /** ถ้าส่งมา ปุ่ม ▶ จะเล่นแยกทีละราก (ราก 1 วิ่งครบ → พัก → ราก 2) แทนการเล่นรวดเดียว
      ได้มาจาก strokeGroups() ซึ่งคืน null เมื่อแบ่งไม่ปลอดภัย — null/undefined = เล่นรวดเดียวตามเดิม */
  groups?: StrokeGroup[] | null
  /** บอกผู้เรียกว่ากำลังเล่นรากลำดับที่เท่าไร (null = ไม่ได้เล่น) — ใช้ไฮไลต์แผนภาพราก */
  onGroupChange?: (index: number | null) => void
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const writer = useRef<HanziWriter | null>(null)
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState(false)
  const [done, setDone] = useState(0) // จำนวนขีดที่เขียนถูกแล้ว (โหมด quiz)
  const [miss, setMiss] = useState(0)
  const [total, setTotal] = useState(0)
  /* ขนาดจริงที่วาด = เล็กกว่าหรือเท่ากับ size ที่ขอมา แล้วแต่ว่าที่ว่างจริงกว้างแค่ไหน
     จำเป็นเพราะ svg ของ hanzi-writer เป็น px ตายตัว ถ้าใหญ่กว่ากล่อง (เช่น 260 ในจอ 320)
     กรอบ 米字格 จะไม่ตรงกับตัวอักษร และพื้นที่ลากเขียนเลยขอบไป */
  const [fit, setFit] = useState(size)
  /** รากลำดับที่กำลังเล่นอยู่ (null = ไม่ได้เล่น) */
  const [playing, setPlaying] = useState<number | null>(null)
  /** รากที่เพิ่งเล่นล่าสุด — ใช้ให้ปุ่ม "เล่นเฉพาะรากนี้" รู้ว่าจะเล่นตัวไหน */
  const [lastGroup, setLastGroup] = useState(0)
  /* ธงยกเลิก: การเล่นแยกรากเป็น async loop ที่กินเวลาหลายวินาที
     ถ้าเปลี่ยนตัวอักษร/ออกจากหน้าไปกลางทาง ต้องหยุด ไม่งั้น setState หลัง unmount */
  const cancel = useRef(false)
  const onGroupChangeRef = useRef(onGroupChange)
  onGroupChangeRef.current = onGroupChange

  const has = strokeChars.has(char)

  /** เปลี่ยนรากที่กำลังเล่น + แจ้งผู้เรียก (รวมไว้ที่เดียวกันเพื่อไม่ให้หลุด sync) */
  const setGroup = useCallback((i: number | null) => {
    setPlaying(i)
    if (i != null) setLastGroup(i)
    onGroupChangeRef.current?.(i)
  }, [])

  // วัดที่ว่างจริงก่อนวาด และวัดใหม่เมื่อหมุนจอ/เปลี่ยนขนาดหน้าต่าง
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const measure = () => {
      const box = el.getBoundingClientRect()
      if (box.width <= 0) return
      /* เพดานความสูงคิดจากขนาดจอตรงๆ ไม่ใช่จาก box.top
         (box.top เชื่อไม่ได้: ตอน measure รอบแรก layout ยังไม่จัดเสร็จ — เคยทำให้กรอบ
         ตกใต้ขอบจอในโหมดแนวนอนที่จัดเป็น 2 คอลัมน์)
         สัดส่วนที่ใช้: จอเตี้ยเหลือที่ให้กรอบได้ประมาณครึ่งจอ จอสูงปกติไม่ต้องจำกัด */
      const h = window.innerHeight
      const capByHeight = h <= 480 ? h * 0.44 : h <= 620 ? h * 0.42 : size
      setFit(Math.max(150, Math.min(size, Math.floor(box.width), Math.floor(capByHeight))))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [size, mode])

  useEffect(() => {
    if (!has || !box.current) return
    const node = box.current
    let active = true
    const abort = new AbortController()
    node.innerHTML = '' // กับดัก #1
    setReady(false)
    setErr(false)
    setDone(0)
    setMiss(0)

    const w = HanziWriter.create(node, char, {
      width: fit,
      height: fit,
      padding: Math.round(fit * 0.06),
      showCharacter: mode === 'animate',
      showOutline: true,
      strokeAnimationSpeed: 0.8, // ช้ากว่า default เพื่อให้ตามทันว่าลากจากไหนไปไหน
      delayBetweenStrokes: 500,
      ...colors(),
      charDataLoader: (c, onLoad, onError) => {
        fetch(strokePath(c), { signal: abort.signal })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
          .then(data => { if (active) onLoad(data) })
          .catch(onError)
      },
      onLoadCharDataError: () => { if (active) setErr(true) },
    })
    writer.current = w

    w.getCharacterData()
      .then((data) => {
        if (!active) return
        setTotal(data.strokes.length)
        setReady(true)
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (mode === 'animate' && autoStart && !reduceMotion) w.animateCharacter()
      })
      .catch(() => { if (active) setErr(true) })

    return () => {
      active = false
      abort.abort()
      cancel.current = true // หยุด async loop ของการเล่นแยกราก
      w.cancelQuiz()
      void w.pauseAnimation().catch(() => {})
      writer.current = null
      node.innerHTML = ''
    }
  }, [char, mode, fit, autoStart, has])

  // ขึ้นตัวใหม่ = ล้างสถานะการเล่นค้าง (ป้ายกำกับกับไฮไลต์ในแผนภาพต้องหายไปด้วย)
  useEffect(() => {
    setGroup(null)
    setLastGroup(0)
  }, [char, setGroup])

  /** เล่นทีละขีดในช่วงที่กำหนด — คืน false ถ้าถูกยกเลิกกลางทาง */
  const runStrokes = useCallback(async (from: number, to: number) => {
    const w = writer.current
    if (!w) return false
    for (let i = from; i <= to; i++) {
      if (cancel.current) return false
      // await จะคลาย promise ซ้อนของ hanzi-writer ให้เอง ได้ { canceled } ตอนอนิเมชันจบ
      const res = await w.animateStroke(i)
      if (cancel.current || res?.canceled) return false
    }
    return true
  }, [])

  /** เล่นทั้งตัวแบบแยกทีละราก: ราก 1 วิ่งครบ → หยุดพัก → ราก 2 วิ่งต่อ */
  const playByGroups = useCallback(
    async (gs: StrokeGroup[]) => {
      const w = writer.current
      if (!w) return
      cancel.current = false
      w.cancelQuiz()
      await w.hideCharacter({ duration: 0 }) // เริ่มจากกระดาษเปล่า แล้วค่อยขึ้นทีละขีด
      for (let gi = 0; gi < gs.length; gi++) {
        if (cancel.current) return
        setGroup(gi)
        if (!(await runStrokes(gs[gi].from, gs[gi].to))) return
        // พักระหว่างราก — จังหวะนี้คือสิ่งที่ทำให้เห็นว่าตัวอักษรแบ่งเป็นก้อน
        if (gi < gs.length - 1) await delay(700)
      }
      if (!cancel.current) setGroup(null)
    },
    [runStrokes, setGroup],
  )

  /** เล่นเฉพาะรากเดียว (ขีดของรากนั้นล้วนๆ บนกระดาษเปล่า) */
  const playOneGroup = useCallback(
    async (g: StrokeGroup, index: number) => {
      const w = writer.current
      if (!w) return
      cancel.current = false
      w.cancelQuiz()
      await w.hideCharacter({ duration: 0 })
      setGroup(index)
      await runStrokes(g.from, g.to)
      if (!cancel.current) setGroup(null)
    },
    [runStrokes, setGroup],
  )

  /** เล่นรวดเดียวทั้งตัว (พฤติกรรมเดิม — ใช้เมื่อไม่มี groups หรือแบ่งไม่ได้) */
  const playWhole = useCallback(() => {
    cancel.current = true // ตัดการเล่นแยกรากที่อาจค้างอยู่
    setGroup(null)
    writer.current?.showCharacter({ duration: 0 })
    writer.current?.animateCharacter()
  }, [setGroup])

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
    <div className="strokepad" ref={wrap}>
      {/* 米字格 — เส้นตารางช่วยกะสัดส่วนเวลาเขียน (วาดด้วย CSS ไม่ใช่รูป)
          ขนาดต้องเท่ากับ svg เป๊ะ (fit) ไม่ใช่ size ที่ขอมา ไม่งั้นเส้นตารางเหลื่อมกับตัวอักษร */}
      <div className="strokepad-grid" style={{ width: fit, height: fit }}>
        <div ref={box} className="strokepad-box" aria-label={`ลำดับขีดของ ${char}`} />
      </div>

      {err && <div className="fb bad">โหลดข้อมูลลำดับขีดไม่สำเร็จ</div>}

      {/* ปุ่มควบคุมเป็นวงกลมไอคอนล้วนติดใต้กรอบ — ปุ่มยาวเขียนคำเต็ม ("▶️ เล่นลำดับขีด / 🔁 วนซ้ำ")
          กินพื้นที่และดูรกกว่าตัวอักษรที่เป็นพระเอก (ผู้ใช้บอกว่าไม่สวย) */}
      {mode === 'animate' ? (
        <>
          {/* ป้ายบอกว่ากำลังเขียนรากไหน — โผล่เฉพาะตอนเล่นแบบแยกราก
              นี่คือจุดที่เชื่อม "ลำดับขีด" กับ "ราก" เข้าด้วยกัน */}
          {groups && playing != null && (
            <div className="pad-now" aria-live="polite">
              <span className="pad-now-label">กำลังเขียน</span>
              <b className="zh pad-now-part">{groups[playing].part}</b>
              <span className="pad-now-gloss">
                {groups[playing].label.replace(`${groups[playing].part} `, '')} ·{' '}
                {groups[playing].to - groups[playing].from + 1} ขีด
              </span>
            </div>
          )}

          <div className="strokepad-ctrl">
            <button
              type="button"
              className="pad-btn"
              disabled={!ready}
              aria-label={groups ? 'เล่นลำดับขีดแยกทีละราก' : 'เล่นลำดับขีด'}
              title={groups ? 'เล่นลำดับขีดแยกทีละราก' : 'เล่นลำดับขีด'}
              onClick={() => (groups ? playByGroups(groups) : playWhole())}
            >
              ▶
            </button>
            {groups && (
              <button
                type="button"
                className="pad-btn"
                disabled={!ready}
                aria-label="เล่นเฉพาะรากนี้ซ้ำ"
                title={`เล่นเฉพาะ ${groups[playing ?? lastGroup]?.part ?? ''} ซ้ำ`}
                onClick={() => {
                  const i = playing ?? lastGroup
                  const g = groups[i]
                  if (g) playOneGroup(g, i)
                }}
              >
                ⇤
              </button>
            )}
            <button
              type="button"
              className="pad-btn"
              disabled={!ready}
              aria-label="เล่นวนซ้ำทั้งตัว"
              title="เล่นวนซ้ำทั้งตัว"
              onClick={() => {
                cancel.current = true
                setGroup(null)
                writer.current?.showCharacter({ duration: 0 })
                writer.current?.loopCharacterAnimation()
              }}
            >
              ↻
            </button>
            <span className="pad-note">
              {total} ขีด
              {groups ? ` · ${groups.length} ราก` : ''}
            </span>
          </div>
        </>
      ) : (
        <div className="strokepad-ctrl">
          <div className="strokepad-progress" aria-live="polite">
            <b>{Math.min(done + 1, total)}</b>
            <span className="muted">/{total} ขีด</span>
            {miss > 0 && <span className="strokepad-miss">ผิด {miss}</span>}
          </div>
          <button
            type="button"
            className="pad-btn"
            disabled={!ready}
            aria-label="ข้ามขีดนี้"
            title="ข้ามขีดนี้"
            onClick={() => writer.current?.skipQuizStroke()}
          >
            ⇥
          </button>
          <button
            type="button"
            className="pad-btn"
            disabled={!ready}
            aria-label="เริ่มเขียนใหม่"
            title="เริ่มเขียนใหม่"
            onClick={startQuiz}
          >
            ↺
          </button>
        </div>
      )}
    </div>
  )
}

/* ควิซ 4 โหมด
   กฎที่ยกมาจาก chinese-study: ตอบถูก → เด้งข้อถัดไปเองได้ (สั้นๆ)
   ตอบผิด/ดูเฉลย → ต้องกดปุ่ม "ข้อถัดไป" เอง ไม่มี timeout (เพราะต้องมีเวลาอ่านเฉลย) */
import { useCallback, useEffect, useRef, useState } from 'react'
import { QUIZ_MODES, makeSet, type QuizMode, type Question } from '../lib/quiz'
import { srsUpdate, addStar } from '../lib/srs'
import { Chips, DoneCard, Progress, ScoreBar } from '../components/ui'
import { SpeakButton } from '../components/SpeakButton'

const SET_SIZE = 10

export function QuizScreen() {
  const [mode, setMode] = useState<QuizMode>('rad2th')
  const [set, setSet] = useState<Question[]>(() => makeSet('rad2th', SET_SIZE))
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [right, setRight] = useState(0)
  const [wrong, setWrong] = useState(0)
  const timer = useRef<number | null>(null)

  // เปลี่ยนโหมด = เริ่มชุดใหม่
  useEffect(() => {
    setSet(makeSet(mode, SET_SIZE))
    setI(0)
    setChosen(null)
    setRight(0)
    setWrong(0)
  }, [mode])

  // ล้าง timer ตอน unmount ไม่งั้น setState หลัง unmount
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const q = set[i]

  const next = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    setChosen(null)
    setI((n) => n + 1)
  }, [])

  const answer = (idx: number) => {
    if (chosen !== null || !q) return
    setChosen(idx)
    const ok = idx === q.answer
    if (ok) {
      setRight((n) => n + 1)
      srsUpdate(q.key, true)
      // ถูก → เด้งเองได้
      timer.current = window.setTimeout(next, 1000)
    } else {
      setWrong((n) => n + 1)
      srsUpdate(q.key, false)
      addStar(q.key) // ผิดแล้วเข้าชุดทวนอัตโนมัติ
      // ผิด → ไม่เด้งเอง ต้องกดปุ่ม
    }
  }

  const restart = () => {
    setSet(makeSet(mode, SET_SIZE))
    setI(0)
    setChosen(null)
    setRight(0)
    setWrong(0)
  }

  return (
    <div className="stack">
      <Chips<QuizMode>
        label="โหมดควิซ"
        value={mode}
        onChange={setMode}
        items={QUIZ_MODES.map((m) => ({ v: m.v, label: m.label }))}
      />

      <ScoreBar right={right} wrong={wrong} />
      <Progress value={i} max={set.length} />

      {!q ? (
        <DoneCard right={right} total={right + wrong} onRestart={restart} />
      ) : (
        <div className="card card-pad quiz">
          {q.glyph && <div className="zh quiz-glyph">{q.glyph}</div>}
          <div className="quiz-prompt">{q.prompt}</div>
          {q.sub && <div className="muted quiz-sub">{q.sub}</div>}

          <div className="quiz-opts">
            {q.choices.map((c, idx) => {
              const isAns = idx === q.answer
              const picked = chosen === idx
              const state =
                chosen === null ? '' : isAns ? 'ok' : picked ? 'bad' : 'dim'
              return (
                <button
                  key={idx}
                  type="button"
                  className={`btn btn-lg quiz-opt ${state}`}
                  disabled={chosen !== null}
                  onClick={() => answer(idx)}
                >
                  {c.glyph && <span className="zh quiz-opt-glyph">{c.glyph}</span>}
                  <span className="quiz-opt-label">{c.label}</span>
                  {c.sub && <span className="muted">{c.sub}</span>}
                </button>
              )
            })}
          </div>

          {chosen !== null && (
            <div className={`fb ${chosen === q.answer ? 'ok' : 'bad'}`}>
              {chosen === q.answer ? '✓ ถูกต้อง' : '✗ ยังไม่ใช่'}
              <div className="quiz-explain">{q.explain}</div>
            </div>
          )}

          {chosen !== null && q.glyph && <SpeakButton zh={q.glyph} hint="ฟังเสียง" />}

          {/* ถูกแล้วเด้งเองอยู่แล้ว แต่ยังให้กดข้ามได้ทันที · ผิดแล้วต้องกดปุ่มนี้เท่านั้น */}
          {chosen !== null && (
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={next}>
              ข้อถัดไป →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

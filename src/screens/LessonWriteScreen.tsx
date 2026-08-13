import { useCallback, useEffect, useMemo, useState } from 'react'
import { StrokePad } from '../components/StrokePad'
import { SpeakButton } from '../components/SpeakButton'
import { strokeChars } from '../data/strokeIndex'
import {
  hanCharacters,
  loadChineseCatalog,
  type CatalogResult,
  type ChineseExercise,
} from '../lib/chineseExercises'
import { srsUpdate } from '../lib/srs'
import { Progress } from '../components/ui'

type Source = 'vocab' | 'phrase'

type Task = {
  char: string
  item: ChineseExercise
  itemIndex: number
  charIndex: number
  charTotal: number
}

function tasksOf(items: ChineseExercise[]): Task[] {
  return items.flatMap((item, itemIndex) => {
    const chars = hanCharacters(item.zh).filter((char) => strokeChars.has(char))
    return chars.map((char, charIndex) => ({ char, item, itemIndex, charIndex, charTotal: chars.length }))
  })
}

export function LessonWriteScreen() {
  const [loaded, setLoaded] = useState<CatalogResult | null>(null)
  const [error, setError] = useState(false)
  const [lessonId, setLessonId] = useState(1)
  const [source, setSource] = useState<Source>('vocab')
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    let alive = true
    loadChineseCatalog()
      .then((value) => {
        if (!alive) return
        setLoaded(value)
        setError(false)
      })
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [])

  const lesson = loaded?.catalog.lessons.find((item) => item.id === lessonId)
  const items = useMemo(
    () => (lesson ? (source === 'vocab' ? lesson.vocab : lesson.phrases) : []),
    [lesson, source],
  )
  const tasks = useMemo(() => tasksOf(items), [items])
  const task = tasks[index]

  const reset = (nextLesson = lessonId, nextSource = source) => {
    setLessonId(nextLesson)
    setSource(nextSource)
    setIndex(0)
    setResult(null)
    setShowAnswer(false)
  }

  const onDone = useCallback((mistakes: number) => {
    setResult(mistakes)
    if (task) srsUpdate(task.char, mistakes <= 2)
  }, [task])

  const next = () => {
    setIndex((value) => value + 1)
    setResult(null)
    setShowAnswer(false)
  }

  if (error) {
    return (
      <div className="card card-pad lesson-write-empty">
        <b>โหลดแบบฝึกไม่ได้</b>
        <p>ลองเชื่อมต่ออินเทอร์เน็ตหนึ่งครั้ง เพื่อให้ PWA เก็บแบบฝึกไว้ใช้ออฟไลน์</p>
      </div>
    )
  }

  if (!loaded || !lesson) {
    return <div className="card card-pad lesson-write-loading">กำลังดึงแบบฝึกจาก Chinese Study…</div>
  }

  return (
    <div className="stack lesson-write-shell">
      <div className="lesson-write-source">
        <label htmlFor="lesson-write-select">เลือกบทจาก Chinese Study</label>
        <select
          id="lesson-write-select"
          value={lessonId}
          onChange={(event) => reset(Number(event.target.value), source)}
        >
          {loaded.catalog.lessons.map((item) => (
            <option key={item.id} value={item.id}>บท {item.id} · {item.th}</option>
          ))}
        </select>
        <span className={`lesson-write-status ${loaded.source}`}>
          {loaded.source === 'live' ? 'เชื่อมกับ chinese.icejuk.dev' : 'ใช้สำเนาออฟไลน์'}
        </span>
      </div>

      <div className="v2-segment lesson-write-kind" role="tablist" aria-label="เลือกเนื้อหาจากบทเรียน">
        <button type="button" role="tab" aria-selected={source === 'vocab'} onClick={() => reset(lessonId, 'vocab')}>
          คำศัพท์ {lesson.vocab.length}
        </button>
        <button type="button" role="tab" aria-selected={source === 'phrase'} onClick={() => reset(lessonId, 'phrase')}>
          วลี {lesson.phrases.length}
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="card card-pad lesson-write-empty">บทนี้ยังไม่มีรายการที่ฝึกเขียนได้</div>
      ) : !task ? (
        <div className="card card-pad done lesson-write-done">
          <div className="done-ico">好</div>
          <div className="done-title">เขียนครบแล้ว!</div>
          <div className="muted">บท {lesson.id} · {items.length} {source === 'vocab' ? 'คำศัพท์' : 'วลี'}</div>
          <button type="button" className="btn btn-primary btn-lg" onClick={() => reset()}>
            ฝึกบทนี้อีกครั้ง
          </button>
        </div>
      ) : (
        <div className="card card-pad write lesson-write">
          <div className="lesson-write-progress-row">
            <span>คำที่ {task.itemIndex + 1}/{items.length}</span>
            <span>ตัว {task.charIndex + 1}/{task.charTotal}</span>
          </div>
          <Progress value={index} max={tasks.length} />

          <div className="write-prompt">
            <span className="py write-py">{task.item.py}</span>
            <span className="write-th">{task.item.th}</span>
          </div>

          <div className="lesson-word-mask" aria-label={`คำนี้มี ${task.charTotal} ตัวอักษร`}>
            {hanCharacters(task.item.zh).map((char, charIndex) => (
              <span key={`${char}-${charIndex}`} className={charIndex === task.charIndex ? 'current' : ''}>
                {showAnswer || charIndex < task.charIndex ? char : '·'}
              </span>
            ))}
          </div>

          <div className="write-actions">
            <SpeakButton zh={task.item.zh} hint={`ฟัง ${task.item.py}`} />
            <button type="button" className="btn" onClick={() => setShowAnswer((value) => !value)}>
              {showAnswer ? 'ซ่อนคำ' : 'ดูคำ'}
            </button>
          </div>

          {showAnswer && <div className="zh lesson-write-answer">เขียนตัว <b>{task.char}</b></div>}

          <StrokePad
            key={`${lessonId}-${source}-${index}-${task.char}`}
            char={task.char}
            mode="quiz"
            size={260}
            onQuizDone={onDone}
          />

          {result !== null && (
            <>
              <div className={`fb ${result <= 2 ? 'ok' : 'bad'}`}>
                {result === 0 ? '✓ ถูกทุกขีด' : result <= 2 ? `✓ เขียนจบแล้ว · ผิด ${result} ครั้ง` : `ควรทวนตัว ${task.char} อีกครั้ง`}
              </div>
              <button type="button" className="btn btn-primary btn-lg btn-block" onClick={next}>
                {index + 1 === tasks.length ? 'ดูผล →' : task.charIndex + 1 < task.charTotal ? 'ตัวถัดไปในคำ →' : 'คำถัดไป →'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

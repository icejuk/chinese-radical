import { useMemo, useState } from 'react'
import type { Radical } from '../data/types'
import { QuizScreen } from './QuizScreen'
import { WriteScreen } from './WriteScreen'

type Mode = 'quiz' | 'write'

export function PracticeScreen({
  radicals,
  label,
  onStartLearn,
}: {
  radicals: Radical[]
  label: string
  onStartLearn: () => void
}) {
  const [mode, setMode] = useState<Mode>('quiz')
  const focusKeys = useMemo(() => radicals.map((radical) => radical.r), [radicals])
  const focusItems = useMemo(
    () => radicals.map((radical) => ({ zh: radical.r, py: radical.py, th: radical.th })),
    [radicals],
  )

  return (
    <div className="practice-shell">
      <div className="v2-segment" role="tablist" aria-label="เลือกวิธีฝึก">
        <button type="button" role="tab" aria-selected={mode === 'quiz'} onClick={() => setMode('quiz')}>
          ควิซสั้น
        </button>
        <button type="button" role="tab" aria-selected={mode === 'write'} onClick={() => setMode('write')}>
          ฝึกเขียน
        </button>
      </div>

      <div className="practice-intro">
        <b>{mode === 'quiz' ? 'ตอบจากสิ่งที่จำได้' : 'เขียนจากเสียงและความหมาย'}</b>
        <span>{mode === 'quiz' ? `5 ข้อจาก${label} · เริ่มได้เลย` : `ฝึกเฉพาะ${label} · ระบบตรวจให้ทีละเส้น`}</span>
      </div>

      {radicals.length === 0 ? (
        <div className="card card-pad practice-empty">
          <span className="zh">学</span>
          <b>เรียนอย่างน้อย 1 ตัวก่อน</b>
          <p>แบบฝึกจะใช้เฉพาะรากที่คุณเคยเรียน ไม่สุ่มตัวใหม่มาให้เดา</p>
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={onStartLearn}>
            เริ่มเรียนตัวแรก →
          </button>
        </div>
      ) : mode === 'quiz' ? (
        <QuizScreen simple focusKeys={focusKeys} />
      ) : (
        <WriteScreen simple focusItems={focusItems} />
      )}
    </div>
  )
}

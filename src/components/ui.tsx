import type { ReactNode } from 'react'

export function Chips<T extends string>({
  items,
  value,
  onChange,
  variant = 'pill',
  label,
}: {
  items: { v: T; label: string }[]
  value: T
  onChange: (v: T) => void
  variant?: 'pill' | 'num'
  label?: string
}) {
  return (
    <div className="chips" role="tablist" aria-label={label}>
      {items.map((it) => (
        <button
          key={it.v}
          role="tab"
          type="button"
          className={variant === 'num' ? 'chip-num' : 'chip'}
          aria-selected={value === it.v}
          onClick={() => onChange(it.v)}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

export function ScoreBar({ right, wrong }: { right: number; wrong: number }) {
  return (
    <div className="card score">
      <div className="c">
        <b>{right}</b>
        <span>✓ ถูก</span>
      </div>
      <div className="w">
        <b>{wrong}</b>
        <span>✗ ผิด</span>
      </div>
      <div className="t">
        <b>{right + wrong}</b>
        <span>ข้อ</span>
      </div>
    </div>
  )
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <i style={{ width: pct + '%' }} />
    </div>
  )
}

/** หน้าจบชุด — ใช้ร่วมทุกแบบฝึก */
export function DoneCard({
  right,
  total,
  onRestart,
  note,
}: {
  right: number
  total: number
  onRestart: () => void
  note?: ReactNode
}) {
  const pct = total > 0 ? Math.round((right / total) * 100) : 0
  return (
    <div className="card card-pad done">
      <div className="done-ico">🎉</div>
      <div className="done-title">{total === 0 ? 'ยังไม่มีข้อในชุดนี้' : 'เก่งมาก!'}</div>
      {total > 0 && (
        <div className="muted">
          ถูก {right} / {total} ข้อ ({pct}%)
        </div>
      )}
      {note}
      <button type="button" className="btn btn-primary btn-lg" onClick={onRestart}>
        เริ่มใหม่
      </button>
    </div>
  )
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <div className="card card-pad muted" style={{ textAlign: 'center' }}>{children}</div>
}

/* การ์ด "ทวนวันนี้" — เป็นแค่ข้อเสนอ ไม่ใช่ประตูบังคับ
   รอบก่อนทำเป็นหน้าเต็มที่ต้องผ่านก่อนถึงจะไปเรียนได้ ผู้ใช้บอกว่า "เหมือนบังคับว่าต้องเรียนอะไรก่อน"
   ตอนนี้จึงเป็นการ์ดแถบเดียวอยู่บนตารางราก — อยากกดก็กด ไม่กดก็เลือกตัวไหนในตารางก็ได้ */
import { dayStats, doneToday, todaySet } from '../lib/today'

export function TodayCard({ onStart }: { onStart: () => void }) {
  const set = todaySet()
  const st = dayStats()
  const done = new Set(doneToday())
  const pct = st.total > 0 ? Math.round((st.learned / st.total) * 100) : 0
  const left = set.filter((r) => !done.has(r.r)).length

  return (
    <div className="card today-card">
      <div className="today-card-main">
        <div className="today-card-head">
          <span className="seal filled">今</span>
          <span className="today-card-title">
            {st.due > 0 ? `มีของค้างทวน ${st.due} ตัว` : 'ชุดแนะนำวันนี้'}
          </span>
          <span className="muted today-card-count">
            เรียนแล้ว {st.learned}/{st.total}
          </span>
        </div>

        {/* ตัวจีนของชุด — ตัวที่ดูแล้วขีดเส้นใต้สีหยก */}
        <div className="today-card-set">
          {set.map((r) => (
            <span key={r.r} className={`zh today-card-glyph ${done.has(r.r) ? 'is-done' : ''}`}>
              {r.r}
            </span>
          ))}
        </div>

        <div className="today-card-bar" role="progressbar" aria-valuenow={st.learned} aria-valuemax={st.total}>
          <i style={{ width: pct + '%' }} />
        </div>
      </div>

      <button type="button" className="btn btn-primary today-card-btn" onClick={onStart}>
        {left === set.length ? 'เริ่ม' : left > 0 ? `เรียนต่อ (เหลือ ${left})` : 'ทวนอีกรอบ'} →
      </button>
    </div>
  )
}

/* localStorage ทั้งหมดของแอป
   คีย์ใช้ prefix `cr-` (chinese-radical) — ห้ามใช้ `xy-*` ซ้ำกับ chinese-study
   เผื่อวันหนึ่งสองแอปมาอยู่โดเมนเดียวกัน progress จะไม่ทับกัน */
export const KEYS = {
  nav: 'cr-nav',       // แท็บล่าสุด
  srs: 'cr-srs',       // { [zh]: { box, due, wrong, right } }
  stars: 'cr-star',    // [zh, ...] ตัวที่ยังไม่แม่น
  radFilter: 'cr-rf',  // ตัวกรองหน้าราก { cat, strokes }
  charFilter: 'cr-cf', // ตัวกรองหน้าคลัง { rad, hsk, starOnly }
  writeSrc: 'cr-wsrc', // แหล่งตัวอักษรของแบบฝึกเขียน
  day: 'cr-day',       // ความคืบหน้าของวันนี้ { d: เลขวัน, done: [อักขระที่ดูแล้ว] }
} as const

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

/** เขียนแบบกลืน error — โหมด private ของ Safari throw ตอน setItem */
export function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* เต็มหรือถูกปิด — ยอมเสียการจดจำ ดีกว่าแอปพัง */
  }
}

export function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeRaw(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* เหมือน writeJson */
  }
}

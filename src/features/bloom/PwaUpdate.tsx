import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

/** Ask before reloading so a review round or microphone session is not interrupted. */
export function PwaUpdate() {
  const [available, setAvailable] = useState(false)
  const update = useRef<((reload?: boolean) => Promise<void>)>()
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    let active = true
    let registration: ServiceWorkerRegistration | undefined
    const check = () => { if (document.visibilityState === 'visible') void registration?.update().catch(() => {}) }
    update.current = registerSW({
      immediate: true,
      onNeedRefresh: () => { if (active) setAvailable(true) },
      onRegisteredSW: (_, current) => { registration = current; check() },
    })
    document.addEventListener('visibilitychange', check)
    return () => { active = false; document.removeEventListener('visibilitychange', check) }
  }, [])
  if (!available) return null
  return <aside className="bl-update-banner" aria-label="มีแอปรุ่นใหม่" role="status"><span>มี Mandarin Trail รุ่นใหม่ พร้อมใช้งานแล้ว</span><button type="button" onClick={() => void update.current?.(true)}>อัปเดตแอป</button><button type="button" onClick={() => setAvailable(false)}>ไว้ก่อน</button></aside>
}

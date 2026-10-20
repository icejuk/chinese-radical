import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react'
import { BloomApp } from './features/bloom/BloomApp'
import { isLegacyHash } from './features/bloom/navigation'

const LegacyApp = lazy(() => import('./App'))

export function ExperienceRoot() {
  const [legacy, setLegacy] = useState(() => isLegacyHash(location.hash))
  useEffect(() => {
    const sync = () => setLegacy(isLegacyHash(location.hash))
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])
  useLayoutEffect(() => {
    document.documentElement.dataset.ui = legacy ? 'legacy' : 'bloom'
    document.title = legacy ? '字根 — รากอักษรจีน' : 'Mandarin Trail · แผนที่คำจีน'
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => {
      meta.content = legacy ? (meta.media.includes('dark') ? '#0f0d0a' : '#ddd0b4') : '#101624'
    })
  }, [legacy])
  return legacy ? <Suspense fallback={<p className="bl-loading" role="status">กำลังเปิดหน้าฝึก…</p>}><LegacyApp /></Suspense> : <BloomApp />
}

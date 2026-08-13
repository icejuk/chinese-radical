export type ChineseExercise = {
  zh: string
  py: string
  th: string
  kind: 'vocab' | 'phrase'
}

export type ChineseLesson = {
  id: number
  title: string
  zh: string
  py: string
  th: string
  vocab: ChineseExercise[]
  phrases: ChineseExercise[]
}

export type ChineseCatalog = {
  version: number
  source: 'chinese-study'
  lessons: ChineseLesson[]
}

export type CatalogResult = {
  catalog: ChineseCatalog
  source: 'live' | 'offline'
}

const REMOTE_URL = 'https://chinese.icejuk.dev/api/writing-exercises.json'
const FALLBACK_URL = './chinese-writing-fallback.json'

function isCatalog(value: unknown): value is ChineseCatalog {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ChineseCatalog>
  return candidate.version === 1 && candidate.source === 'chinese-study' && Array.isArray(candidate.lessons)
}

async function getCatalog(url: string, signal?: AbortSignal): Promise<ChineseCatalog> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`โหลดแบบฝึกไม่สำเร็จ (${response.status})`)
  const value: unknown = await response.json()
  if (!isCatalog(value)) throw new Error('รูปแบบข้อมูลแบบฝึกไม่ถูกต้อง')
  return value
}

/** ดึงฉบับล่าสุดจาก chinese.icejuk.dev และถ้าออฟไลน์/ช้าให้ใช้สำเนาที่มากับ PWA */
export async function loadChineseCatalog(): Promise<CatalogResult> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 3500)
  try {
    const catalog = await getCatalog(REMOTE_URL, controller.signal)
    return { catalog, source: 'live' }
  } catch {
    return { catalog: await getCatalog(FALLBACK_URL), source: 'offline' }
  } finally {
    window.clearTimeout(timeout)
  }
}

export function hanCharacters(value: string): string[] {
  return [...value].filter((char) => /\p{Script=Han}/u.test(char))
}

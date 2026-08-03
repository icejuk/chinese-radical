import { useCallback, useEffect, useState } from 'react'
import { GROUPS, initialTab, isTab, itemOf, groupOf, rememberTab, tabForGroup, type TabId } from './nav'
import { warmVoices } from './lib/tts'
import { todaySet } from './lib/today'
import type { Radical } from './data/types'
import { LearnScreen } from './screens/LearnScreen'
import { RadicalsScreen } from './screens/RadicalsScreen'
import { BreakdownScreen } from './screens/BreakdownScreen'
import { QuizScreen } from './screens/QuizScreen'
import { WriteScreen } from './screens/WriteScreen'
import { CharsScreen } from './screens/CharsScreen'

/** หน้าที่เป็นตารางกว้าง ให้ใช้พื้นที่จอมากกว่าหน้าอ่านทีละใบ */
const WIDE: TabId[] = ['radicals', 'chars']

type Deck = { queue: Radical[]; start: number; label: string }

export default function App() {
  const [tab, setTab] = useState<TabId>(initialTab)
  const [char, setChar] = useState('河')
  // สำรับที่กำลังอ่านในโหมดแฟลชการ์ด — ค่าเริ่มคือชุดของวันนี้
  const [deck, setDeck] = useState<Deck>(() => ({ queue: todaySet(), start: 0, label: 'ชุดของวันนี้' }))

  useEffect(() => {
    warmVoices()
  }, [])

  useEffect(() => {
    rememberTab(tab)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [tab])

  useEffect(() => {
    const onHash = () => {
      const h = location.hash.replace(/^#/, '')
      if (isTab(h)) setTab(h)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const openChar = useCallback((ch: string) => {
    setChar(ch)
    setTab('breakdown')
  }, [])

  /** เริ่มชุดของวันนี้ — คำนวณใหม่ตอนกด เพราะ SRS อาจเปลี่ยนหลังทำควิซ */
  const startToday = useCallback(() => {
    setDeck({ queue: todaySet(), start: 0, label: 'ชุดของวันนี้' })
    setTab('learn')
  }, [])

  const openDeck = useCallback((queue: Radical[], start: number, label: string) => {
    setDeck({ queue, start, label })
    setTab('learn')
  }, [])

  const group = groupOf(tab)
  const item = itemOf(tab)

  return (
    <div className="app">
      <header className="header">
        <div className="header-mark zh" aria-hidden>
          根
        </div>
        <div className="header-title">
          {item.label}
          <small>字根 · รากอักษรจีน</small>
        </div>
        <div className="header-right zh">{item.icon}</div>
      </header>

      <main className={`content ${WIDE.includes(tab) ? 'wide' : ''} ${tab === 'learn' ? 'full' : ''}`}>
        {group.items.length > 1 && (
          <div className="chips group-chips" role="tablist" aria-label={'เมนู' + group.label}>
            {group.items.map((it) => (
              <button
                key={it.t}
                role="tab"
                type="button"
                className="chip"
                aria-selected={tab === it.t}
                onClick={() => setTab(it.t)}
              >
                {it.label}
              </button>
            ))}
          </div>
        )}

        {tab === 'learn' && (
          <LearnScreen
            // key บังคับให้เริ่มการ์ดใหม่เมื่อเปลี่ยนสำรับ (ไม่ค้าง index ของสำรับก่อน)
            key={deck.label + deck.start + deck.queue.length}
            queue={deck.queue.slice(deck.start)}
            label={deck.label}
            onPickChar={openChar}
            onFinish={() => setTab('quiz')}
          />
        )}
        {tab === 'radicals' && <RadicalsScreen onOpen={openDeck} onStartToday={startToday} />}
        {tab === 'breakdown' && <BreakdownScreen char={char} setChar={setChar} />}
        {tab === 'quiz' && <QuizScreen />}
        {tab === 'write' && <WriteScreen />}
        {tab === 'chars' && <CharsScreen onPickChar={openChar} />}
      </main>

      <nav className="tabbar" aria-label="เมนูหลัก">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            aria-current={group.key === g.key ? 'page' : undefined}
            onClick={() => setTab(tabForGroup(g.key))}
          >
            <i aria-hidden>{g.icon}</i>
            {g.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

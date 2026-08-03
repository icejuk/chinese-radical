import { useCallback, useEffect, useState } from 'react'
import { NAV_ITEMS, initialTab, isTab, rememberTab, rootOf, titleOf, type TabId } from './nav'
import { warmVoices } from './lib/tts'
import { doneToday, todaySet } from './lib/today'
import { srsGet } from './lib/srs'
import { learnRads } from './lib/tree'
import type { Radical } from './data/types'
import { LearnScreen } from './screens/LearnScreen'
import { BreakdownScreen } from './screens/BreakdownScreen'
import { PracticeScreen } from './screens/PracticeScreen'
import { ExploreScreen } from './screens/ExploreScreen'

type Deck = { id: number; queue: Radical[]; start: number; label: string; trackToday: boolean }

let deckId = 0

function makeTodayDeck(restart = false): Deck {
  const queue = todaySet()
  const done = new Set(doneToday())
  const next = queue.findIndex((radical) => !done.has(radical.r))
  return {
    id: ++deckId,
    queue,
    start: restart ? 0 : next < 0 ? queue.length : next,
    label: 'ชุดวันนี้',
    trackToday: true,
  }
}

export default function App() {
  const [tab, setTab] = useState<TabId>(initialTab)
  const [char, setChar] = useState('河')
  const [detailReturn, setDetailReturn] = useState<'learn' | 'explore'>('explore')
  const [deck, setDeck] = useState<Deck>(() => makeTodayDeck())

  useEffect(() => {
    warmVoices()
  }, [])

  useEffect(() => {
    rememberTab(tab)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [tab])

  useEffect(() => {
    const onHash = () => {
      const hash = location.hash.replace(/^#/, '')
      if (isTab(hash)) setTab(hash)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const openChar = useCallback((nextChar: string, returnTo: 'learn' | 'explore' = 'explore') => {
    setChar(nextChar)
    setDetailReturn(returnTo)
    setTab('detail')
  }, [])

  const openRadical = useCallback((radical: Radical) => {
    setDeck({ id: ++deckId, queue: [radical], start: 0, label: 'เลือกมาเรียน', trackToday: false })
    setTab('learn')
  }, [])

  const openToday = useCallback((restart = false) => {
    setDeck(makeTodayDeck(restart))
    setTab('learn')
  }, [])

  const activeRoot = tab === 'detail' ? detailReturn : rootOf(tab)
  const learned = srsGet()
  const learnedInDeck = deck.queue.filter((radical) => learned[radical.r])
  const practiced = new Set(learnedInDeck.map((radical) => radical.r))
  const practiceRadicals = [
    ...learnedInDeck,
    ...learnRads.filter((radical) => learned[radical.r] && !practiced.has(radical.r)),
  ]
  const practiceLabel = learnedInDeck.length ? deck.label : 'สิ่งที่เคยเรียน'

  return (
    <div className="app app-v2">
      <header className="header v2-header">
        {tab === 'detail' ? (
          <button type="button" className="header-back" aria-label="กลับ" onClick={() => setTab(detailReturn)}>
            ‹
          </button>
        ) : (
          <div className="header-mark zh" aria-hidden>根</div>
        )}
        <div className="header-title">
          {tab === 'learn' && !deck.trackToday ? 'เรียนรากนี้' : titleOf(tab)}
          <small>字根 · จำจีนให้เป็นภาพ</small>
        </div>
        <button type="button" className="header-quick" onClick={() => setTab('explore')} aria-label="ค้นหา">
         ⌕
        </button>
      </header>

      <main className={`content v2-content ${tab === 'learn' ? 'full' : ''}`}>
        {tab === 'learn' && (
          <LearnScreen
            key={deck.id}
            queue={deck.queue}
            label={deck.label}
            initialIndex={deck.start}
            trackToday={deck.trackToday}
            onPickChar={(nextChar) => openChar(nextChar, 'learn')}
            onFinish={() => setTab('practice')}
            onExplore={() => setTab('explore')}
            onRestartToday={() => openToday(false)}
            onPositionChange={(start) => setDeck((current) => ({ ...current, start }))}
          />
        )}
        {tab === 'practice' && (
          <PracticeScreen
            radicals={practiceRadicals}
            label={practiceLabel}
            onStartLearn={() => setTab('learn')}
          />
        )}
        {tab === 'explore' && <ExploreScreen onPickRadical={openRadical} onPickChar={(nextChar) => openChar(nextChar)} />}
        {tab === 'detail' && <BreakdownScreen char={char} setChar={setChar} />}
      </main>

      <nav className="tabbar v2-tabbar" aria-label="เมนูหลัก">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.t}
            type="button"
            aria-current={activeRoot === item.t ? 'page' : undefined}
            onClick={() => {
              if (item.t === 'learn' && !deck.trackToday) openToday(false)
              else setTab(item.t)
            }}
          >
            <i aria-hidden>{item.icon}</i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

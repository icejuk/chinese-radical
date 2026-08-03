import { useCallback, useEffect, useState } from 'react'
import { GROUPS, initialTab, isTab, itemOf, groupOf, rememberTab, tabForGroup, type TabId } from './nav'
import { warmVoices } from './lib/tts'
import { RadicalsScreen } from './screens/RadicalsScreen'
import { BreakdownScreen } from './screens/BreakdownScreen'
import { QuizScreen } from './screens/QuizScreen'
import { WriteScreen } from './screens/WriteScreen'
import { CharsScreen } from './screens/CharsScreen'

/** หน้าที่เป็นตาราง/ลิสต์ยาว ให้กว้างกว่าหน้าแบบฝึกบนจอใหญ่ */
const WIDE: TabId[] = ['radicals', 'chars']

export default function App() {
  const [tab, setTab] = useState<TabId>(initialTab)
  // ตัวอักษรที่กำลังดูในหน้าแตกตัวอักษร — ยกมาไว้ระดับ App เพราะหน้าอื่นกดส่งตัวอักษรมาได้
  const [char, setChar] = useState('河')

  useEffect(() => {
    warmVoices()
  }, [])

  useEffect(() => {
    rememberTab(tab)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [tab])

  // ปุ่ม back ของเบราว์เซอร์ให้ย้อนแท็บ (hash เปลี่ยน)
  useEffect(() => {
    const onHash = () => {
      const h = location.hash.replace(/^#/, '')
      if (isTab(h)) setTab(h)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  /** กดตัวอักษรจากหน้าไหนก็ตาม → เปิดหน้าแตกตัวอักษรของตัวนั้น */
  const openChar = useCallback((ch: string) => {
    setChar(ch)
    setTab('breakdown')
  }, [])

  const group = groupOf(tab)

  return (
    <div className="app">
      <nav className="sidebar" aria-label="เมนูหลัก">
        <div className="sidebar-brand">
          <img src="./icon.svg" alt="" />
          <div>
            字根
            <small>รากอักษรจีน</small>
          </div>
        </div>
        {GROUPS.map((g) => (
          <div key={g.key}>
            <div className="sidebar-group">
              {g.icon} {g.label}
            </div>
            {g.items.map((it) => (
              <button
                key={it.t}
                type="button"
                aria-current={tab === it.t ? 'page' : undefined}
                onClick={() => setTab(it.t)}
              >
                <span aria-hidden>{it.icon}</span>
                {it.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div>
        <header className="header">
          <img className="header-logo" src="./icon.svg" alt="" />
          <div className="header-title">
            {itemOf(tab).icon} {itemOf(tab).label}
          </div>
          <div className="header-sub">字根</div>
        </header>

        <main className={`content ${WIDE.includes(tab) ? 'wide' : ''}`}>
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
                  {it.icon} {it.label}
                </button>
              ))}
            </div>
          )}

          {tab === 'radicals' && <RadicalsScreen onPickChar={openChar} />}
          {tab === 'breakdown' && <BreakdownScreen char={char} setChar={setChar} />}
          {tab === 'quiz' && <QuizScreen />}
          {tab === 'write' && <WriteScreen />}
          {tab === 'chars' && <CharsScreen onPickChar={openChar} />}
        </main>
      </div>

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

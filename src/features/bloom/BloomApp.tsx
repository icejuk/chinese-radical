import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { bloomCounts, bloomGroups, startingCharacterIds, characterAudio, groupById, nodeById, parentsOf, searchWords } from './catalog'
import type { MapNode } from './map'
import { unifiedTreeLayout, wordsOf, collectionId, type LayoutMemory } from './tree'
import { activateMapNode, collapseBranch, expandCharacter, mapHash, overviewRoute, parseMapRoute, selectNode, type MapRoute } from './navigation'
import { FocusMap } from './FocusMap'
import { stopSound } from '../../lib/tts'
import { AudioPlayer } from './AudioPlayer'
const LearningHub = lazy(() => import('./LearningHub').then(module => ({ default: module.LearningHub })))
const WritingDialog = lazy(() => import('./WritingDialog').then(module => ({ default: module.WritingDialog })))
import { bloomSection, type BloomSection } from './lessons'

function HelpDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return <dialog ref={dialog} className="bl-help" aria-labelledby="bl-help-title"
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="bl-help-top"><span className="bl-kicker">ค่อย ๆ แตกคำไปด้วยกัน</span><button type="button" onClick={onClose} aria-label="ปิดวิธีสำรวจ">×</button></div>
    <h2 id="bl-help-title">หนึ่งตัวอักษร ไปได้หลายคำ</h2>
    <ol><li>แตะ 学、木、水 หรือ 人 บนต้นไม้เพื่อเปิดกิ่ง</li><li>แตะคำเพื่อดูพินอิน คำแปลไทย และฟังเสียง</li><li>เลือกตัวจีนในคำนั้น เพื่อสำรวจคำชุดใหม่</li></ol>
    <p className="bl-help-path" lang="zh-Hans">学 <span>→</span> 学生 <span>→</span> 生 <span>→</span> 生活</p>
    <p>ทุกกิ่งอยู่บนแผนที่เดียวกัน ลากเพื่อสำรวจ กด + / − เพื่อซูม หรือกด ⊞ เพื่อดูทั้งต้นไม้ กดแตกกิ่งจากรายละเอียดคำ แล้วกดยุบกิ่งได้</p>
    <button type="button" className="bl-button bl-primary" onClick={onClose}>เริ่มสำรวจ</button>
  </dialog>
}

const examples: Record<string, { zh: string; py: string; th: string }> = {
  'w:学生': { zh: '我是学生。', py: 'Wǒ shì xuésheng.', th: 'ฉันเป็นนักเรียน' },
  'w:学校': { zh: '我去学校。', py: 'Wǒ qù xuéxiào.', th: 'ฉันไปโรงเรียน' },
  'w:学习': { zh: '我学习中文。', py: 'Wǒ xuéxí Zhōngwén.', th: 'ฉันเรียนภาษาจีน' },
}

type DetailProps = { node: MapNode; onSelect: (id: string) => void; ancestors: string[]; onWrite: () => void; onSentence: () => void; onWord: (id: string) => void }
function WordDetail({ node, onSelect, ancestors, onWrite, onSentence, onWord }: DetailProps) {
  const characters = [...new Set([...node.zh])], parents = new Set(parentsOf(node).map(parent => parent.id))
  const example = examples[node.id]
  const sourceWord = [...ancestors].reverse().find(id => id.startsWith('w:'))
  const newWords = node.kind === 'character' ? wordsOf(node.id).filter(word => word.id !== sourceWord) : []
  return <aside className="bl-detail" aria-label="รายละเอียดคำที่เลือก">
    <div className="bl-kicker">{node.kind === 'word' ? 'คำที่เลือก' : 'ตัวอักษรที่กำลังสำรวจ'}</div>
    <div className="bl-detail-heading"><span className="bl-han" lang="zh-Hans">{node.zh}</span></div>
    <div className="bl-detail-pinyin">{node.py}</div><h2>{node.th}</h2>
    <AudioPlayer text={node.kind === 'character' ? characterAudio(node.zh) : node.zh} label={node.kind === 'character' && characterAudio(node.zh) !== node.zh ? `ฟังเสียงในคำ ${characterAudio(node.zh)}` : 'ฟังเสียงคำนี้'} />
    <div className="bl-detail-actions"><button type="button" className="bl-button" onClick={onWrite}>ลำดับขีด / ฝึกเขียน ✎</button><button type="button" className="bl-button" onClick={onSentence}>ลองใช้ในประโยค ↗</button></div>
    {node.kind === 'word' ? <div className="bl-detail-continue"><h3>แตกกิ่งต่อจากคำนี้</h3><div className="bl-character-options">{characters.map(character => {
      const id = `c:${character}`, known = parents.has(id), parent = nodeById.get(id), existing = ancestors.includes(id)
      return <button key={character} type="button" disabled={!known} onClick={() => onSelect(id)}
        aria-label={known ? `${existing ? 'กลับไป' : 'แตกกิ่งจาก'} ${character} ${parent?.py}` : `${character} ยังไม่มีในชุดเริ่มต้น`} title={known ? undefined : 'ยังไม่มีในชุดเริ่มต้น'}>
        <span className="bl-han" lang="zh-Hans">{character}</span><small>{known ? `${parent?.py} · ${existing ? 'กลับไป ↖' : 'แตกกิ่ง ↗'}` : 'ยังไม่เปิด'}</small>
      </button>
    })}</div><p>ตัวเดียวกัน พาไปเจอคำอีกหลายชุดได้</p></div> : <div className="bl-detail-continue"><h3>{newWords.length ? `${newWords.length} คำให้สำรวจต่อ` : 'ยังไม่มีคำใหม่ในกิ่งนี้'}</h3><p>{newWords.length ? 'แตะคำบนแผนที่เพื่อฟังความหมาย แล้วเลือกตัวจีนในคำนั้นเพื่อสำรวจต่อ' : 'คำที่มีตัวนี้ในชุดข้อมูลเชื่อมอยู่กับกิ่งก่อนหน้าแล้ว ยังฟังเสียงและฝึกเขียนได้'}</p><div className="bl-related-words">{newWords.map(word=><button type="button" key={word.id} onClick={()=>onWord(word.id)}><strong className="bl-han">{word.zh}</strong><span>{word.py}</span><small>{word.th}</small></button>)}</div></div>}
    {example ? <div className="bl-example"><span className="bl-kicker">ลองใช้ในประโยค</span><p className="bl-han" lang="zh-Hans">{example.zh}</p><small>{example.py}</small><p>{example.th}</p></div> : null}
    <div className="bl-detail-note">เส้นเชื่อมบอกว่าตัวอักษรอยู่ในคำ<br />ความหมายให้ดูจากคำทั้งคำด้วยนะ</div>
  </aside>
}

function MobileWordSheet({ node, onSelect, ancestors, onClose, onWrite, onSentence, onWord }: DetailProps & { onClose: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const sourceWord = [...ancestors].reverse().find(id => id.startsWith('w:'))
  const newWordCount = node.kind === 'character' ? wordsOf(node.id).filter(word => word.id !== sourceWord).length : 0
  useEffect(() => { setExpanded(false) }, [node.id])
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [onClose])
  return <aside className={`bl-reading-dock ${expanded ? 'is-expanded' : ''}`} aria-label={`รายละเอียด ${node.zh}`}>
    <header><div><strong className="bl-han" lang="zh-Hans">{node.zh}</strong><span>{node.py}</span><small>{node.th}</small></div><button type="button" onClick={onClose} aria-label="ปิดรายละเอียด กลับต้นไม้">×</button></header>
    {expanded ? <WordDetail node={node} onSelect={onSelect} ancestors={ancestors} onWrite={onWrite} onSentence={onSentence} onWord={onWord} /> : <>
      <AudioPlayer text={node.kind === 'character' ? characterAudio(node.zh) : node.zh} label="ฟังเสียงคำนี้" />
      {node.kind === 'character' ? <p className="bl-character-feedback" role="status">{newWordCount ? `${newWordCount} คำอยู่บนกิ่งนี้ · ปิดรายละเอียดเพื่อสำรวจต่อ` : 'ยังไม่มีคำใหม่ในกิ่งนี้ คำที่มีตัวนี้เชื่อมอยู่กับกิ่งก่อนหน้าแล้ว'}</p> : null}
      {node.kind === 'word' ? <div className="bl-dock-branches"><span>แตกกิ่งจาก</span>{parentsOf(node).map(character => <button type="button" key={character.id} onClick={() => onSelect(character.id)} aria-label={`${ancestors.includes(character.id) ? 'กลับไป' : 'แตกกิ่งจาก'} ${character.zh} ${character.py}`}><span className="bl-han" lang="zh-Hans">{character.zh}</span><small>{character.py}</small></button>)}</div> : null}
    </>}
    <footer><button type="button" onClick={onWrite}>ฝึกเขียน ✎</button><button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>{expanded ? 'ย่อรายละเอียด ↓' : 'รายละเอียด / ประโยค ↗'}</button></footer>
  </aside>
}

export function BloomApp() {
  const [section, setSection] = useState<BloomSection>(() => bloomSection(location.hash))
  const [lessonRevision, setLessonRevision] = useState(0)
  const [writing, setWriting] = useState<MapNode | null>(null)
  const closeWriting = useCallback(() => setWriting(null), [])
  const [route, setRoute] = useState(() => parseMapRoute(location.hash))
  const [detailOpen, setDetailOpen] = useState(() => nodeById.get(parseMapRoute(location.hash).selected ?? '')?.kind === 'word')
  useEffect(() => {
    if (!detailOpen || !window.matchMedia('(max-width: 700px)').matches) return
    const frame = requestAnimationFrame(() => document.querySelector('.bl-map-viewport')?.scrollIntoView({ block: 'start', behavior: 'instant' }))
    return () => cancelAnimationFrame(frame)
  }, [detailOpen, route.at])
  const closeDetail = useCallback(() => { setDetailOpen(false); stopSound() }, [])
  const [query, setQuery] = useState(''), [help, setHelp] = useState(false)
  const [visited, setVisited] = useState<string[]>([])
  const results = searchWords(query)
  const root = route.focus ? nodeById.get(route.focus) : undefined
  const group = root ? groupById.get(root.group) : undefined
  const selected = nodeById.get(route.selected ?? '') ?? root
  const [portrait, setPortrait] = useState(() => window.matchMedia('(max-width: 500px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 500px)')
    const sync = () => setPortrait(media.matches)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
  const layoutMemory = useRef<LayoutMemory>(new Map())
  const tree = useMemo(() => unifiedTreeLayout(route.roots, route.open, layoutMemory.current, portrait), [route.roots, route.open, portrait])
  useEffect(() => {
    if (selected?.kind === 'word' && window.matchMedia('(max-width: 700px)').matches) setDetailOpen(true)
  }, [route.at, selected?.kind])

  useEffect(() => {
    if (!Number.isInteger(history.state?.bloomStep)) history.replaceState({ ...history.state, bloomStep: 0 }, '', location.hash || '#map')
    const sync = () => { setLessonRevision(value => value + 1); const nextSection = bloomSection(location.hash); setSection(nextSection); if (nextSection === 'map') setRoute(parseMapRoute(location.hash)); setQuery(''); setDetailOpen(false); setWriting(null); stopSound() }
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices()
    return () => {
      stopSound()
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])
  useEffect(() => () => stopSound(), [route.focus, route.selected, route.at])
  useEffect(() => {
    if (route.selected) setVisited(previous => previous[previous.length - 1] === route.selected ? previous : [...previous, route.selected!].slice(-5))
  }, [route.selected])

  const navigate = useCallback((next: MapRoute) => {
    setQuery('')
    setSection('map')
    setDetailOpen(window.matchMedia('(max-width: 700px)').matches && nodeById.get(next.selected ?? '')?.kind === 'word')
    const hash = mapHash(next)
    if (hash === location.hash) return
    stopSound()
    const step = (Number(history.state?.bloomStep) || 0) + 1
    history.pushState({ bloomStep: step }, '', hash)
    setRoute(next)
  }, [])
  const pick = useCallback((id: string) => {
    if (window.matchMedia('(max-width: 700px)').matches) document.querySelector('.bl-map-viewport')?.scrollIntoView({ block: 'start', behavior: 'instant' })
    navigate(selectNode(id, route))
  }, [navigate, route])
  const navigateSection = (next: BloomSection) => {
    closeDetail(); setWriting(null); stopSound(); setQuery('')
    const lessonParams = new URLSearchParams(location.hash.split('?')[1])
    const lessonWord = section === 'map' ? selected?.id : lessonParams.get('word') ?? selected?.id
    const nextParams = new URLSearchParams()
    if (lessonWord) nextParams.set('word', lessonWord)
    if (section !== 'map' && lessonParams.get('root')) nextParams.set('root', lessonParams.get('root')!)
    const hash = next === 'map' ? mapHash(route) : `#${next}${nextParams.size ? `?${nextParams.toString()}` : ''}`
    if (hash !== location.hash) { const step = (Number(history.state?.bloomStep) || 0) + 1; history.pushState({ bloomStep: step }, '', hash) }
    setSection(next)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const writeSelected = () => { closeDetail(); if (selected) setWriting(selected) }
  const contextId = new URLSearchParams(location.hash.split('?')[1]).get('word') ?? selected?.id

  return <div className="bloom-app">
    <a className="bl-skip" href="#bl-main" onClick={event => { event.preventDefault(); document.getElementById('bl-main')?.focus() }}>ข้ามไปเนื้อหา</a>
    <aside className="bl-rail"><a className="bl-brand" href="#map" onClick={event => { event.preventDefault(); navigate(overviewRoute) }} aria-label="Mandarin Trail กลับทุกกลุ่มคำ"><svg className="bl-brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect x=".5" y=".5" width="39" height="39" rx="12" fill="#24243d" stroke="#575070"/><path d="M11 28V15a4 4 0 0 1 7-2.6l4 4.6a4 4 0 0 0 7-2.6V11" stroke="#d6c7ff" strokeWidth="2.4" strokeLinecap="round"/><path d="M11 28h13a5 5 0 0 0 5-5v-2" stroke="#8ee0d4" strokeWidth="2.4" strokeLinecap="round"/><circle cx="11" cy="28" r="3" fill="#d6c7ff"/><circle cx="29" cy="11" r="3" fill="#8ee0d4"/></svg><span className="bl-brand-name">Mandarin <em>Trail</em></span></a>
      <p className="bl-rail-caption">จากหนึ่งตัวอักษร<br />ค่อย ๆ แตกเป็นคำของเรา</p>
      <nav className="bl-main-nav" aria-label="เมนูหลัก"><button type="button" className={section === 'map' ? 'is-active' : ''} aria-current={section === 'map' ? 'page' : undefined} onClick={() => navigateSection('map')}><span className="bl-nav-icon bl-han">学</span><span>แผนที่คำ</span></button>
        {([['句', 'คำสู่ประโยค', 'sentences'], ['听', 'ทบทวน', 'review'], ['说', 'ฝึกพูด', 'speaking']] as const).map(([icon, label, target]) => <button type="button" key={target} className={section === target ? 'is-active' : ''} aria-current={section === target ? 'page' : undefined} onClick={() => navigateSection(target)}><span className="bl-nav-icon bl-han">{icon}</span><span>{label}</span></button>)}
      </nav>
      <div className="bl-group-nav"><span className="bl-kicker">สำรวจตามกลุ่ม</span>{bloomGroups.map(item => <button key={item.id} type="button" onClick={() => pick(item.root)} aria-pressed={group?.id === item.id}><span className="bl-han" lang="zh-Hans" style={{ color: item.color }}>{nodeById.get(item.root)!.zh}</span>{item.title}</button>)}</div>
      <div className="bl-rail-footer"><span className="bl-leaf bl-han">木</span><p>เรียนทีละนิด<br />ให้คำจีนค่อย ๆ เติบโต</p><a href="#practice">เปิดหน้าฝึกเขียนเดิม ↗</a></div>
      <button type="button" className="bl-mobile-help" onClick={() => setHelp(true)} aria-label="วิธีสำรวจแผนที่">?</button>
    </aside>
    <div className="bl-body"><header className={`bl-top ${section !== 'map' ? 'bl-top-lesson' : ''}`}><div className="bl-page-label"><span className="bl-kicker">YOUR WORD UNIVERSE</span><span>{{map:'แผนที่คำ',sentences:'คำสู่ประโยค',review:'ทบทวน',speaking:'ฝึกพูด'}[section]}</span></div>
      {section === 'map' ? <form className="bl-search" role="search" onSubmit={event => { event.preventDefault(); if (results[0]) pick(results[0].id) }}
        onKeyDown={event => { if (event.key === 'Escape') setQuery('') }}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setQuery('') }}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></svg>
        <input aria-label="ค้นตัวจีน พินอิน หรือคำแปลไทย" placeholder="ค้นตัวจีน พินอิน หรือคำแปลไทย" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" spellCheck={false} />
        {query ? <button type="button" onClick={() => setQuery('')} aria-label="ล้างการค้นหา">×</button> : <kbd>⌕</kbd>}
        {query.trim() ? <div className="bl-search-results" aria-label="ผลการค้นหา"><div className="bl-search-caption" role="status">{results.length ? 'เลือกคำที่อยากสำรวจ' : 'ยังไม่พบในชุดคำเริ่มต้น ลอง 学生 หรือ น้ำ'}</div>
          {results.map(node => <button type="button" key={node.id} onClick={() => pick(node.id)}><span className="bl-han" lang="zh-Hans">{node.zh}</span><span>{node.py}<small>{node.th}</small></span><span aria-hidden="true">↗</span></button>)}
        </div> : null}
      </form> : null}<button type="button" className="bl-help-button" onClick={() => setHelp(true)}>วิธีสำรวจ <span>?</span></button>
    </header>
    <main id="bl-main" className="bl-main" tabIndex={-1}>
      {section !== 'map' ? <Suspense fallback={<p role="status">กำลังเปิดแบบฝึก…</p>}><LearningHub key={`${section}:${contextId}:${lessonRevision}`} section={section} contextId={contextId} onMap={pick} /></Suspense> : <>
        <div className="bl-focus-intro bl-unified-intro"><div><span className="bl-kicker">จากตัวอักษร สู่คำที่เชื่อมกัน</span><h1>จักรวาลคำจีน</h1><p>เลือกคำที่คุ้น แล้วสำรวจคำที่เชื่อมต่อกัน</p></div></div>
        <div className="bl-focus-layout"><section className="bl-focus-card" aria-labelledby="bl-focus-title" style={{ '--bl-group': group?.color ?? '#4c7952', '--bl-group-soft': group?.soft ?? '#e5efdc' } as CSSProperties}>
          <header className="bl-focus-header"><div><h2 id="bl-focus-title">สำรวจคำไปด้วยกัน</h2><p role="status">{selected?.kind === 'character' ? `${selected.zh} · ${selected.py} · ${selected.th.split(' / ')[0]} · ${wordsOf(selected.id).length} คำ` : `ชุดคำ ${bloomCounts.words} คำ · เปิดพร้อมกัน ${route.roots.length} กลุ่ม`}</p></div></header>
          <nav className="bl-tree-entrypoints" aria-label="ไปยังกิ่งเริ่มต้น">{startingCharacterIds.map(id => { const node=nodeById.get(id)!; return <button type="button" key={id} onClick={() => pick(id)} aria-label={`ไปยังกิ่ง ${node.zh} ${node.py} ${node.th}`} aria-pressed={route.selected === id}><span className="bl-han" lang="zh-Hans">{node.zh}</span><span className="bl-entry-pinyin">{node.py}</span><span className="bl-entry-meaning">{node.th.split(' / ')[0]}</span></button> })}</nav>
          <FocusMap detailVisible={detailOpen} tree={tree} selectedId={route.at ?? collectionId} onSelect={at => { if (at !== collectionId && window.matchMedia('(max-width: 700px)').matches) document.querySelector('.bl-map-viewport')?.scrollIntoView({ block: 'start', behavior: 'instant' }); const action = activateMapNode(at, route); navigate(action.next); if (action.showDetails) { if (window.matchMedia('(max-width: 700px)').matches) setDetailOpen(true); else document.querySelector('.bl-inline-detail')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) } }} />
          {detailOpen && selected ? <MobileWordSheet onWord={pick} node={selected} onWrite={writeSelected} onSentence={() => navigateSection('sentences')}
      ancestors={(route.at ?? '').split('/')} onClose={closeDetail} onSelect={id => { closeDetail(); navigate(expandCharacter(id, route)) }} /> : null}
          {selected ? <button type="button" className="bl-mobile-selection bl-button" onClick={() => setDetailOpen(true)}><span className="bl-han" lang="zh-Hans">{selected.zh}</span> · {selected.py} · {selected.th.split(' / ')[0]}<span>ฟังเสียง / ฝึกเขียน ↗</span></button> : null}
          {route.open.length || route.roots.length ? <div className="bl-branch-actions">{[...route.roots, ...route.open].map(at => <button type="button" key={at} onClick={() => navigate(collapseBranch(at, route))}>ยุบกิ่ง {nodeById.get(at.split('/').at(-1)!)?.zh} ×</button>)}</div> : null}
          <div className="bl-focus-note"><i aria-hidden="true" />เส้นทึบ: ตัวจีนอยู่ในคำ · จำนวนคำเป็นข้อมูลในชุดนี้</div>
        </section><div className="bl-inline-detail">{selected ? <WordDetail onWord={pick} ancestors={(route.at ?? '').split('/')} node={selected} onWrite={writeSelected} onSentence={() => navigateSection('sentences')} onSelect={id => navigate(expandCharacter(id, route))} /> : <aside className="bl-tree-guide"><span className="bl-kicker">เริ่มตรงไหนก็ได้</span><h2>หนึ่งต้นไม้<br />หลายเส้นทาง</h2><p>แตะตัวจีนบนต้นไม้เพื่อเปิดคำที่มีตัวนั้น แล้วแตะคำเพื่อฟังเสียง ดูคำแปล หรือแตกกิ่งต่อ</p><p>เปิดหลายกลุ่มพร้อมกันได้ กิ่งเดิมจะยังอยู่ ลากและซูมเพื่อสำรวจต่อ</p><button type="button" className="bl-button" onClick={() => setHelp(true)}>ดูวิธีสำรวจ ↗</button></aside>}</div></div>
        <nav className="bl-journey" aria-label="เส้นทางที่สำรวจ"><span>เส้นทางที่สำรวจ</span>{visited.map((id, index) => <span className="bl-journey-item" key={`${id}:${index}`}>{index > 0 ? <span aria-hidden="true">›</span> : null}<button type="button" className={`bl-han ${id === selected?.id ? 'is-active' : ''}`} lang="zh-Hans" onClick={() => pick(id)}>{nodeById.get(id)?.zh}</button></span>)}</nav>
        <p className="bl-selection-status" role="status" aria-live="polite">{selected ? `${selected.zh} · ${selected.py} · ${selected.th}` : 'ทุกกลุ่มอยู่บนต้นไม้เดียวกัน แตะตัวอักษรเพื่อเปิดกิ่ง'}</p>
      </>}
    </main></div>{writing ? <Suspense fallback={<p role="status">กำลังเปิดการเขียน…</p>}><WritingDialog node={writing} onClose={closeWriting} /></Suspense> : null}{help ? <HelpDialog onClose={() => setHelp(false)} /> : null}
  </div>
}

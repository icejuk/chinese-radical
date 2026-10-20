import { useEffect, useReducer, useRef, useState } from 'react'
import { startingCharacterIds, nodeById } from './catalog'
import { AudioPlayer } from './AudioPlayer'
import { splitReviewBatches, initialReview, reviewQuestionFor, reviewReducer, sentenceFor, sentenceSets, speakingScenes, type BloomSection } from './lessons'
import { LocalRecorder, type RecordingState } from './recorder'
import { allPracticeWords, practiceWords, speakingFor } from './practice'
import { stopSound } from '../../lib/tts'

export function LearningHub({ section, contextId, onMap }: { section: Exclude<BloomSection, 'map'>; contextId?: string; onMap: (id: string) => void }) {
  const context = nodeById.get(contextId ?? '')
  const requestedRoot = new URLSearchParams(location.hash.split('?')[1]).get('root')
  const initialScope = nodeById.get(requestedRoot ?? '')?.kind === 'character' ? requestedRoot! : context?.kind === 'character' ? context.id : 'all'
  const [scope, setScope] = useState(initialScope)
  const pool = practiceWords(scope)
  const [wordId, setWordId] = useState(context?.kind === 'word' && pool.some(word => word.id === context.id) ? context.id : pool[0]?.id ?? allPracticeWords[0].id)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [started, setStarted] = useState(false)
  const changeButton = useRef<HTMLButtonElement>(null)
  const selectedWord = nodeById.get(wordId)!
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const filtered = pool.filter(word => normalize(`${word.zh} ${word.py} ${word.th}`).includes(normalize(search.trim())))
  function chooseWord(id: string, nextScope = scope, sentenceSet?: string) {
    setWordId(id); setScope(nextScope); stopSound(); setPickerOpen(false); setSearch(''); setStarted(false); changeButton.current?.focus()
    const params = new URLSearchParams({ word: id })
    if (nextScope !== 'all') params.set('root', nextScope)
    if (sentenceSet) params.set('set', sentenceSet)
    history.replaceState(history.state, '', `#${section}?${params.toString()}`)
  }
  const scopeIds = [...new Set([...startingCharacterIds, ...(scope !== 'all' ? [scope] : [])])]
  const reviewPool = [nodeById.get(wordId)!, ...pool.filter(word => word.id !== wordId)]
  return <div className="bl-lesson-page">
    <div className="bl-practice-context"><div>{section === 'review' && started ? <strong>กำลังทบทวน · ชุด {pool.length} คำ</strong> : <><strong lang="zh-Hans">{selectedWord.zh}</strong><span>{selectedWord.py}</span><span>{selectedWord.th}</span></>}</div><button ref={changeButton} type="button" className="bl-button" aria-expanded={pickerOpen} aria-controls="practice-picker" onClick={() => { setStarted(false); setPickerOpen(value => !value); stopSound() }}>{section === 'review' ? 'เปลี่ยนชุดฝึก' : 'เปลี่ยนคำ'}</button></div>
    {pickerOpen ? <section id="practice-picker" className="bl-practice-picker" aria-label="เลือกคำสำหรับฝึก">
      <label className="bl-field-label">เลือกตัวตั้งต้น <select aria-label="เลือกตัวตั้งต้น" value={scope} onChange={event => { const id = event.target.value; chooseWord(practiceWords(id)[0].id, id) }}><option value="all">ทุกคำ · {allPracticeWords.length} คำ</option>{scopeIds.filter(id => practiceWords(id).length).map(id => { const node = nodeById.get(id)!; return <option key={id} value={id}>{node.zh} · {node.py} · {node.th.split(' / ')[0]}</option> })}</select></label>
      <label className="bl-field-label">ค้นคำในกลุ่ม<input aria-label="ค้นคำในกลุ่ม" value={search} onChange={event => setSearch(event.target.value)} placeholder="จีน พินอิน หรือไทย" /></label>
      <label className="bl-field-label">คำที่ต้องการฝึก <select aria-label="คำที่ต้องการฝึก" value={filtered.some(word => word.id === wordId) ? wordId : ''} onChange={event => chooseWord(event.target.value)}><option value="" disabled>เลือกคำจากผลค้นหา</option>{filtered.map(word => <option key={word.id} value={word.id}>{word.zh} · {word.py} · {word.th.split(' / ')[0]}</option>)}</select></label>
      {!filtered.length ? <p role="status">ไม่พบคำในกลุ่มนี้ <button type="button" onClick={() => setSearch('')}>ล้างค้นหา</button></p> : null}
      <p>เลือกได้ {pool.length} คำ · ใช้คำนี้ต่อได้ทั้งสามเมนู</p>
    </section> : null}
    {section === 'sentences' ? <SentenceLesson key={wordId} pool={pool} contextId={wordId} onMap={onMap} onWord={(id, set) => chooseWord(id, pool.some(word => word.id === id) ? scope : 'all', set)} /> : section === 'review' ? started ? <ReviewLesson key={`${scope}:${wordId}`} pool={reviewPool} /> : <section className="bl-lesson-card"><h1>ฟังแล้วเลือกความหมาย</h1><p>เริ่มจากคำที่เลือก ฝึกครั้งละไม่เกินสามคำ</p><button type="button" className="bl-button bl-primary" onClick={() => { setStarted(true); setPickerOpen(false) }}>เริ่มฝึก {Math.min(3, pool.length)} คำ</button></section> : <SpeakingLesson key={wordId} wordId={wordId} />}
  </div>
}
function SentenceLesson({ contextId, onMap, onWord, pool }: { pool: typeof allPracticeWords; contextId?: string; onMap: (id: string) => void; onWord: (id: string, set: string) => void }) {
  const context = nodeById.get(contextId ?? '')
  const requestedSet = new URLSearchParams(location.hash.split('?')[1]).get('set')
  const requested = sentenceSets.find(set => set.id === requestedSet && (set.id === 'meaning' || (set.words as readonly string[]).includes(context?.zh ?? '')))
  const initial = requested ?? sentenceSets.find(set => (set.words as readonly string[]).includes(context?.zh ?? '')) ?? (context?.kind === 'word' ? sentenceSets.find(set => set.id === 'meaning')! : sentenceSets.find(set => set.id === 'identity')!)
  const [setId, setSetId] = useState<string>(initial.id)
  const [word] = useState(context?.kind === 'word' && (initial.id === 'meaning' || (initial.words as readonly string[]).includes(context.zh)) ? context.zh : initial.words[0])
  const set = sentenceSets.find(item => item.id === setId)!, sentence = sentenceFor(setId, word)!
  const choices = pool.filter(item => set.id === 'meaning' || (set.words as readonly string[]).includes(item.zh)).map(item => item.zh)
  const suggestedChoices = [...new Set([word, ...choices])].slice(0, 6)
  useEffect(() => () => stopSound(), [setId, word])
  function changeSentence(nextSet: string, zh: string) {
    setSetId(nextSet)
    onWord(`w:${zh}`, nextSet)
  }
  return <><div className="bl-lesson-intro"><span className="bl-kicker">จากคำที่รู้ สู่สิ่งที่อยากพูด</span><h1>ลองพูดเป็นประโยค</h1><p>เลือกสถานการณ์ แล้วเปลี่ยนคำเพื่อดูความหมายและฟังทั้งประโยค</p></div>
    <div className="bl-lesson-tabs" role="group" aria-label="รูปแบบประโยค">{sentenceSets.filter(item => sentenceFor(item.id, word)).map(item => <button type="button" key={item.id} aria-pressed={item.id === setId} onClick={() => changeSentence(item.id, word)}>{item.title}</button>)}</div>
    <section className="bl-lesson-card"><span className="bl-kicker">{set.title}</span><h2 className="bl-sentence-zh" lang="zh-Hans">{sentence.zh}</h2><p className="bl-sentence-py">{sentence.py}</p><p className="bl-sentence-th">{sentence.th}</p>
      <AudioPlayer key={sentence.zh} text={sentence.zh} label="ฟังทั้งประโยค" />
      <h3>ลองเปลี่ยนคำนี้</h3><div className="bl-word-choices">{suggestedChoices.map(zh => { const node = nodeById.get(`w:${zh}`)!; return <button type="button" key={zh} aria-pressed={zh === word} onClick={() => changeSentence(setId, zh)}><strong className="bl-han" lang="zh-Hans">{zh}</strong><span>{node.py}</span><small>{node.th.split(' / ')[0]}</small></button> })}</div>
      <button type="button" className="bl-button" onClick={() => onMap(sentence.wordId)}>ดูคำ {word} บนต้นไม้ ↗</button>
    </section></>
}
function ReviewLesson({ pool }: { pool: typeof allPracticeWords }) {
  const [round, setRound] = useState(0), [cycle, setCycle] = useState(0)
  const batches = splitReviewBatches(pool)
  const offset = round * 3
  if (!batches.length) return <p>ไม่มีคำในชุดนี้ กรุณาเปลี่ยนชุดฝึก</p>
  return <><div className="bl-lesson-intro"><span className="bl-kicker">ลองนึกจากเสียงที่ได้ยิน</span><h1>ทบทวนทีละสามคำ</h1><p>ชุดนี้มี {pool.length} คำ เริ่มจากคำที่เลือก แล้วฝึกชุดถัดไปได้ ผลอยู่เฉพาะรอบนี้</p></div>
    <ReviewRound key={`${cycle}:${round}`} pool={batches[round]} offset={offset} last={round === batches.length - 1} onNextRound={() => { setCycle(value => value + 1); setRound(value => value + 1 < batches.length ? value + 1 : 0) }} />
  </>
}
function ReviewRound({ pool, offset, onNextRound, last }: { last: boolean; pool: typeof allPracticeWords; offset: number; onNextRound: () => void }) {
  const questions = pool.map((word, index) => reviewQuestionFor(word.id, offset + index)), [state, dispatch] = useReducer(reviewReducer, initialReview)
  const [reading, setReading] = useState(false)
  const question = questions[state.index], node = nodeById.get(question.id)!
  useEffect(() => () => stopSound(), [state.index, state.finished])
  if (state.finished) return <section className="bl-lesson-card bl-review-summary" aria-live="polite"><span className="bl-kicker">จบรอบนี้แล้ว</span><h2>ถูก {state.score} จาก {questions.length} คำ</h2><p>{last ? 'ฝึกครบทุกคำในชุดแล้ว' : 'ฝึกชุดถัดไปได้เมื่อพร้อม'}</p><button type="button" className="bl-button bl-primary" onClick={onNextRound}>{last ? 'เริ่มชุดคำนี้ใหม่' : 'ฝึกชุดถัดไป'}</button><button type="button" className="bl-button" onClick={() => { dispatch({ type: 'restart' }); setReading(false) }}>ทบทวนชุดเดิม</button></section>
  return <section className="bl-lesson-card"><div className="bl-review-top"><span>ข้อ {state.index + 1} / {questions.length}</span><span>ตอบถูก {state.score} คำ</span></div><h2>คำที่ได้ยินหมายถึงอะไร?</h2>
    <AudioPlayer key={question.id} text={node.zh} label="ฟังโจทย์" />
    <button type="button" className="bl-text-button" onClick={() => setReading(value => !value)}>{reading ? 'กลับไปฟังอย่างเดียว' : 'เสียงใช้ไม่ได้? เปลี่ยนเป็นดูตัวจีน'}</button>
    {reading ? <p className="bl-review-reading bl-han" lang="zh-Hans">{node.zh}</p> : null}
    <div className="bl-review-options" role="group" aria-label="เลือกความหมาย">{question.options.map(option => <button type="button" key={option.id} disabled={state.checked} aria-pressed={state.selected === option.id} onClick={() => dispatch({ type: 'choose', id: option.id })}>{option.th}</button>)}</div>
    {state.checked ? <div className={`bl-review-feedback ${state.selected === question.id ? 'is-correct' : ''}`} role="status"><strong>{state.selected === question.id ? 'ถูกต้อง' : 'คำตอบที่ถูกคือ'}</strong><p><span className="bl-han" lang="zh-Hans">{node.zh}</span> · {node.py} · {node.th}</p></div> : null}
    {!state.checked ? <button type="button" className="bl-button bl-primary" disabled={!state.selected} onClick={() => dispatch({ type: 'check', correctId: question.id })}>ตรวจคำตอบ</button> : <button type="button" className="bl-button bl-primary" onClick={() => { dispatch({ type: 'next', total: questions.length }); setReading(false) }}>{state.index + 1 === questions.length ? 'ดูผลรอบนี้' : 'คำถัดไป'}</button>}
  </section>
}
function SpeakingLesson({ wordId }: { wordId: string }) {
  const [sceneId, setSceneId] = useState('word'), [index, setIndex] = useState(0), [example, setExample] = useState(false)
  const [attempt, setAttempt] = useState(0), [mode, setMode] = useState<'repeat' | 'answer'>('repeat')
  function resetAttempt() { stopSound(); setExample(false); setAttempt(value => value + 1) }
  const wordPrompt = speakingFor(wordId)!
  const scenes = [{ id: 'word', title: 'ฝึกคำที่เลือก', prompts: [wordPrompt] }, ...speakingScenes]
  const scene = scenes.find(item => item.id === sceneId)!, prompt = scene.prompts[index]
  useEffect(() => () => stopSound(), [sceneId, index])
  return <><div className="bl-lesson-intro"><span className="bl-kicker">ลองพูดในสถานการณ์ใกล้ตัว</span><h1>ฟัง แล้วตอบด้วยเสียงของเรา</h1><p>ฟังต้นแบบ แล้วลองออกเสียงตาม</p></div>
    <div className="bl-lesson-tabs" role="group" aria-label="สถานการณ์ฝึกพูด">{scenes.map(item => <button type="button" key={item.id} aria-pressed={item.id === sceneId} onClick={() => { setSceneId(item.id); setIndex(0); resetAttempt() }}>{item.title}</button>)}</div>
    <div className="bl-lesson-tabs" role="group" aria-label="วิธีฝึกพูด"><button type="button" aria-pressed={mode === 'repeat'} onClick={() => { setMode('repeat'); resetAttempt() }}>พูดตาม</button><button type="button" aria-pressed={mode === 'answer'} onClick={() => { setMode('answer'); resetAttempt() }}>ลองตอบเอง</button></div>
    {sceneId === 'word' && !wordPrompt.hasSentence ? <p className="bl-practice-note">คำนี้ยังไม่มีประโยคตัวอย่างเฉพาะคำ ลองแต่งประโยคเอง หรือฟังและออกเสียงคำศัพท์ก่อน</p> : null}
    <section className="bl-lesson-card"><span className="bl-kicker">{scene.title} · คำถาม {index + 1} / {scene.prompts.length}</span><h2 className="bl-speaking-question bl-han" lang="zh-Hans">{mode === 'repeat' ? prompt.answer : prompt.zh}</h2><p className="bl-sentence-py">{mode === 'repeat' ? prompt.answerPy : prompt.py}</p><p className="bl-sentence-th">{mode === 'repeat' ? prompt.answerTh : prompt.th}</p><AudioPlayer key={`${prompt.zh}:${attempt}`} text={mode === 'repeat' ? prompt.answer : prompt.zh} label={mode === 'repeat' ? 'ฟังต้นแบบ' : 'ฟังคำถาม'} />
      <RecorderControl key={`${sceneId}:${index}:${attempt}`} />
      {mode === 'answer' ? <button type="button" className="bl-button" aria-expanded={example} onClick={() => setExample(value => !value)}>{example ? 'ซ่อนตัวอย่าง' : sceneId === 'word' && !wordPrompt.hasSentence ? 'ฟังคำศัพท์ต้นแบบ' : 'ดูตัวอย่างคำตอบ'}</button> : null}
      {example ? <div className="bl-answer-example"><p className="bl-han" lang="zh-Hans">{prompt.answer}</p><p>{prompt.answerPy}</p><p>{prompt.answerTh}</p><AudioPlayer text={prompt.answer} label="ฟังตัวอย่างคำตอบ" /></div> : null}
      <button type="button" className="bl-button bl-primary" onClick={() => { setIndex(value => (value + 1) % scene.prompts.length); resetAttempt() }}>{index + 1 === scene.prompts.length ? 'เริ่มสถานการณ์นี้ใหม่' : 'คำถามถัดไป'}</button>
    </section></>
}
function RecorderControl() {
  const [state, setState] = useState<RecordingState>({ status: 'idle' }), controller = useRef<LocalRecorder>()
  useEffect(() => { const recorder = new LocalRecorder(setState); controller.current = recorder; return () => { recorder.dispose(); controller.current = undefined } }, [])
  return <div className="bl-recorder"><h3>ลองออกเสียงด้วยตัวเอง</h3><p>เสียงอยู่ในเครื่อง · หยุดอัตโนมัติใน 60 วินาที · ไม่มีคะแนนอัตโนมัติ</p>
    {state.status === 'recording' ? <button type="button" className="bl-button bl-recording" onClick={() => controller.current?.stop()}>■ หยุดอัดเสียง</button> : <button type="button" className="bl-button" disabled={state.status === 'requesting'} onClick={() => { stopSound(); void controller.current?.start() }}>{state.status === 'requesting' ? 'กำลังขอสิทธิ์ไมค์…' : state.url ? 'อัดเสียงใหม่' : '● เริ่มอัดเสียง'}</button>}
    {state.status === 'requesting' ? <button type="button" className="bl-text-button" onClick={() => controller.current?.stop()}>ยกเลิกการอัด</button> : null}
    <p role="status">{state.status === 'recording' ? 'กำลังอัดเสียง…' : state.error ?? (state.status === 'ready' ? 'อัดแล้ว ลองฟังเสียงตัวเอง' : '')}</p>
    {state.url ? <audio controls src={state.url} aria-label="เสียงที่คุณอัด" /> : null}
  </div>
}

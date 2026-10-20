import { useCallback, useEffect, useRef, useState } from 'react'
import { StrokePad } from '../../components/StrokePad'
import { strokeChars } from '../../data/strokeIndex'
import { characterAudio, nodeById } from './catalog'
import type { MapNode } from './map'
import { AudioPlayer } from './AudioPlayer'

export function WritingDialog({ node, onClose }: { node: MapNode; onClose: () => void }) {
  const chars = [...new Set([...node.zh])]
  const [char, setChar] = useState(chars[0]), [mode, setMode] = useState<'animate' | 'quiz'>('animate'), [done, setDone] = useState(false)
  const complete = useCallback(() => setDone(true), [])
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = dialog.current, previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow
    el?.showModal(); document.body.style.overflow = 'hidden'
    return () => { el?.close(); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }) }
  }, [])
  const reading = nodeById.get(`c:${char}`)
  return <dialog ref={dialog} className="bl-writing-dialog" aria-label={`ลำดับขีดและฝึกเขียน ${node.zh}`} onCancel={event => { event.preventDefault(); onClose() }}>
    <header className="bl-sheet-header"><span>ลำดับขีดและฝึกเขียน</span><button type="button" autoFocus onClick={onClose} aria-label="ปิดการฝึกเขียน">กลับไปเรียน ×</button></header>
    <div className="bl-writing-content"><h2><span className="bl-han" lang="zh-Hans">{node.zh}</span> <small>{node.py} · {node.th}</small></h2>
      <div className="bl-lesson-tabs" role="group" aria-label="เลือกตัวที่จะเขียน">{chars.map(item => <button type="button" key={item} aria-pressed={char === item} onClick={() => { setChar(item); setDone(false) }}><span className="bl-han" lang="zh-Hans">{item}</span></button>)}</div>
      <p>{reading?.py} · {reading?.th}</p><AudioPlayer text={characterAudio(char)} label={characterAudio(char) === char ? 'ฟังเสียงตัวอักษร' : `ฟังเสียงในคำ ${characterAudio(char)}`} slow={false} />
      <div className="bl-lesson-tabs" role="group" aria-label="โหมดเขียน">{(['animate', 'quiz'] as const).map(item => <button type="button" key={item} aria-pressed={mode === item} onClick={() => { setMode(item); setDone(false) }}>{item === 'animate' ? 'ดูลำดับขีด' : 'ลองเขียนเอง'}</button>)}</div>
      {strokeChars.has(char) ? <StrokePad key={`${char}:${mode}`} char={char} size={250} mode={mode} onQuizDone={complete} /> : <p role="status">ไม่มีข้อมูลลำดับขีดของตัวนี้ คุณยังฟังเสียงและอ่านคำต่อได้</p>}
      {done ? <p className="bl-writing-done" role="status">เขียนครบแล้ว ลองอีกครั้งหรือเลือกตัวถัดไปได้</p> : null}
      <p className="bl-writing-hint">{mode === 'animate' ? 'กด ▶ เพื่อดูทิศทางและลำดับการเขียน' : 'ลากในกรอบตามลำดับขีด หากยังนึกไม่ออกให้กลับไปดูลำดับขีด'}</p>
    </div>
  </dialog>
}

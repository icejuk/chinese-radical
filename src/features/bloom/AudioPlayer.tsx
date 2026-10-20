import { useEffect, useRef, useState } from 'react'
import { playSound, stopSound } from '../../lib/tts'

export function AudioPlayer({ text, label = 'ฟังเสียง', slow = true }: { text: string; label?: string; slow?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const alive = useRef(true), timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    alive.current = true
    setStatus('idle')
    return () => { alive.current = false; clearTimeout(timer.current); stopSound() }
  }, [text])
  function play(isSlow: boolean) {
    stopSound()
    clearTimeout(timer.current)
    setStatus('loading')
    timer.current = setTimeout(() => { stopSound(); if (alive.current) setStatus('error') }, 15000)
    playSound(text, () => {
      clearTimeout(timer.current)
      if (alive.current) setStatus(previous => previous === 'error' ? 'error' : 'idle')
    }, {
      slow: isSlow,
      onStart: () => { clearTimeout(timer.current); if (alive.current) setStatus('playing') },
      onError: () => { clearTimeout(timer.current); if (alive.current) setStatus('error') },
    })
  }
  return <div className="bl-audio">
    <div className="bl-audio-buttons"><button type="button" className="bl-button bl-primary" onClick={() => play(false)} aria-label={label}>◖)) {label}</button>
      {slow ? <button type="button" className="bl-button" onClick={() => play(true)}>ฟังช้า ๆ</button> : null}
      {status === 'playing' || status === 'loading' ? <button type="button" className="bl-button" onClick={() => { clearTimeout(timer.current); stopSound(); setStatus('idle') }}>หยุดเสียง</button> : null}</div>
    <p className={`bl-audio-status ${status === 'error' ? 'is-error' : ''}`} role="status">{status === 'loading' ? 'กำลังเปิดเสียง…' : status === 'playing' ? 'กำลังเล่นเสียง…' : status === 'error' ? 'เล่นเสียงไม่ได้ ลองกดฟังอีกครั้ง หรืออ่านพินอินเพื่อฝึกต่อได้' : ''}</p>
  </div>
}

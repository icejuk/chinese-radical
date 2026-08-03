import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { playSound } from '../lib/tts'

/** ปุ่มอ่านออกเสียง — เต็มความกว้างการ์ด แตะตรงไหนก็ได้ (วงกลมเล็กกดพลาดบ่อย)
    ข้อความใบ้อยู่ในปุ่มด้วย เพื่อให้เป็นพื้นที่กดไปในตัว */
export function SpeakButton({
  zh,
  size = 'md',
  label = 'ฟังเสียง',
  hint,
  className = '',
}: {
  zh: string
  size?: 'md' | 'xl'
  label?: string
  hint?: string
  className?: string
}) {
  const [playing, setPlaying] = useState(false)
  const alive = useRef(true)
  useEffect(() => () => { alive.current = false }, [])

  const speak = useCallback(() => {
    setPlaying(true)
    playSound(zh, () => alive.current && setPlaying(false))
  }, [zh])

  return (
    <button
      type="button"
      aria-label={label}
      className={`btn-speak ${size === 'xl' ? 'xl' : ''} ${playing ? 'playing' : ''} ${className}`}
      onClick={speak}
    >
      <span className="btn-speak-ico" aria-hidden>
        🔊
      </span>
      <span className="btn-speak-text">{hint ?? label}</span>
    </button>
  )
}

/** ครอบโจทย์ทั้งก้อนให้เป็นปุ่มฟังเสียงอันเดียว — แตะที่คำแปล/ตัวจีน/ไอคอน ก็เล่นเสียงหมด
    (ปุ่มเล็กๆ แยกอันกดพลาดง่าย ยิ่งบนมือถือ) */
export function TapToSpeak({
  zh,
  children,
  label = 'ฟังเสียง',
}: {
  zh: string
  children: ReactNode
  label?: string
}) {
  const [playing, setPlaying] = useState(false)
  const alive = useRef(true)
  useEffect(() => () => { alive.current = false }, [])

  return (
    <button
      type="button"
      aria-label={label}
      className={`tap-speak ${playing ? 'playing' : ''}`}
      onClick={() => {
        setPlaying(true)
        playSound(zh, () => alive.current && setPlaying(false))
      }}
    >
      {children}
      <span className="tap-speak-ico" aria-hidden>
        🔊
      </span>
    </button>
  )
}

/** ใช้เล่นเสียงจากที่อื่น (แตะการ์ด/แตะบรรทัดสนทนา) พร้อมสถานะกำลังเล่น */
export function useSpeak() {
  const [playingKey, setPlayingKey] = useState<string | null>(null)
  const alive = useRef(true)
  useEffect(() => () => { alive.current = false }, [])

  const speak = useCallback((zh: string, key = zh) => {
    setPlayingKey(key)
    playSound(zh, () => alive.current && setPlayingKey((k) => (k === key ? null : k)))
  }, [])

  return { playingKey, speak }
}

/* เสียงอ่านจีน — Web Speech ก่อน ถ้าไม่มี voice จีนค่อยตกไป Google Translate TTS
   (TTS เป็น "ข้อยกเว้นเดียว" ที่ยิงออกเน็ต — service worker แคชไว้ให้ใช้ offline ได้) */

const VOICE_PREFER = [
  'tingting', 'ting-ting',   // Mac/iPhone/iPad
  'meijia', 'mei-jia',       // Mac ไต้หวัน
  'xiaoxiao', 'yaoyao',      // Edge/Windows
  'sandy', 'shelley', 'flo', // Mac ใหม่
  'huihui',                  // Windows
]

/* ความเร็วอ่าน — ยิ่งยาวยิ่งต้องช้า
   คำเดี่ยวที่ 0.6 ฟังทันสบาย แต่ประโยคยาวที่ความเร็วเดียวกันไล่ตามไม่ทัน
   (ตัวเลขนับ "ตัวอักษรจีน" ไม่นับวรรคตอน เพราะ 1 ตัว = 1 พยางค์) */
function rateFor(zh: string): number {
  const syllables = (zh.match(/[一-鿿]/g) ?? []).length
  if (syllables <= 3) return 0.6   // คำเดี่ยว / วลีสั้น
  if (syllables <= 6) return 0.5   // วลียาว
  if (syllables <= 10) return 0.44 // ประโยคสั้น
  return 0.38                      // ประโยคยาว / 2 ประโยคต่อกัน
}

let activeAudio: HTMLAudioElement | null = null
let onEndCb: (() => void) | null = null

function pickVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null
  const voices = speechSynthesis.getVoices()
  if (!voices?.length) return null
  const flat = (s: string) => s.toLowerCase().replace(/[\s_-]/g, '')
  for (const want of VOICE_PREFER) {
    const v = voices.find((v) => v.name && flat(v.name).includes(flat(want)))
    if (v) return v
  }
  return (
    voices.find((v) => v.lang?.startsWith('zh') && v.lang.toLowerCase().includes('cn')) ??
    voices.find((v) => v.lang?.startsWith('zh')) ??
    null
  )
}

/** Chrome โหลดลิสต์ voice แบบ async — อุ่นเครื่องไว้ก่อน ไม่งั้นกดครั้งแรกจะไม่เจอ voice จีน */
export function warmVoices() {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.getVoices()
  speechSynthesis.addEventListener?.('voiceschanged', () => speechSynthesis.getVoices())
}

export function ttsUrl(zh: string) {
  return `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(zh)}&tl=zh-CN&client=gtx&ttsspeed=${rateFor(zh)}`
}

export function stopSound() {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio = null
  }
  if ('speechSynthesis' in window) speechSynthesis.cancel()
  const cb = onEndCb
  onEndCb = null
  cb?.()
}

/**
 * อ่านออกเสียงข้อความจีน เล่นได้ทีละเสียง (กดใหม่ = ตัดเสียงเก่า)
 * @param onEnd เรียกเมื่อจบ/ถูกตัด — ใช้ปิดสถานะ "กำลังเล่น" ของปุ่ม
 */
export function playSound(zh: string, onEnd?: () => void) {
  stopSound()
  if (!zh) {
    onEnd?.()
    return
  }
  onEndCb = onEnd ?? null
  const done = () => {
    if (onEndCb === (onEnd ?? null)) onEndCb = null
    onEnd?.()
  }

  const voice = pickVoice()
  if (voice && 'speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(zh)
    u.voice = voice
    u.lang = voice.lang || 'zh-CN'
    u.rate = rateFor(zh)
    u.pitch = 1
    u.onend = done
    u.onerror = done
    speechSynthesis.speak(u)
    return
  }

  const audio = new Audio(ttsUrl(zh))
  activeAudio = audio
  audio.onended = () => {
    if (activeAudio === audio) activeAudio = null
    done()
  }
  // เล่นไม่ได้ (autoplay policy / ออฟไลน์ครั้งแรก) — ต้องเคลียร์ activeAudio ด้วย
  // ไม่งั้น state ค้างแล้วเสียงถัดไปจะโดน pause() ของก้อนที่ตายแล้ว (บั๊กใน v1)
  audio.play().catch(() => {
    if (activeAudio === audio) activeAudio = null
    done()
  })
}

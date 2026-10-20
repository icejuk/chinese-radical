import { nodeById } from './catalog'
import { allPracticeWords, dailyExamples, practiceWords, sentencePatterns } from './practice'

export const sentenceSets = [
  { id: 'daily', title: 'ใช้คำในชีวิตประจำวัน', prefix: '', py: '', th: '', words: [...dailyExamples.keys()] },
  { id: 'meaning', title: 'ถามความหมายของคำ', prefix: '', py: '', th: '', words: ['木材', '材料', '饮料'] },
  ...sentencePatterns,
] as const
export function sentenceFor(setId: string, zh: string) {
  if (setId === 'daily') return dailyExamples.get(zh) ?? null
  const set = sentenceSets.find(item => item.id === setId)
  const word = nodeById.get(`w:${zh}`)
  if (setId === 'meaning' && word) return { zh: `${word.zh}是什么意思？`, py: `${word.py} shì shénme yìsi?`, th: `คำว่า “${word.zh}” หมายความว่าอะไร`, wordId: word.id }
  if (!set || !word || !(set.words as readonly string[]).includes(zh)) return null
  return { zh: `${set.prefix}${word.zh}。`, py: `${set.py} ${word.py}.`, th: `${set.th}${word.th.split(' / ')[0]}`, wordId: word.id }
}
export const reviewBanks: Record<string, string[]> = {
  learning: ['学生', '学校', '学习'], wood: ['木材', '公园', '木工'],
  water: ['水果', '水杯', '开水'], people: ['你们', '他们', '我们'],
}
export type ReviewQuestion = { id: string; options: { id: string; th: string }[] }
export function reviewQuestionFor(wordId: string, turn = 0): ReviewQuestion {
  const answer = nodeById.get(wordId)!
  const choices = [answer]
  const meanings = new Set([answer.th])
  const start = [...answer.zh].reduce((sum, char) => sum + char.codePointAt(0)!, turn) % allPracticeWords.length
  const distractors = [...allPracticeWords.slice(start), ...allPracticeWords.slice(0, start)]
  for (const candidate of distractors) {
    if (choices.length === 4) break
    if (!meanings.has(candidate.th)) { choices.push(candidate); meanings.add(candidate.th) }
  }
  const rotation = (turn + 1) % choices.length
  return { id: answer.id, options: [...choices.slice(rotation), ...choices.slice(0, rotation)].map(node => ({ id: node.id, th: node.th })) }
}
export function reviewQuestions(context: string, offset = 0): ReviewQuestion[] {
  const legacy = reviewBanks[context]?.map(zh => nodeById.get(`w:${zh}`)!)
  const pool = legacy ?? practiceWords(context)
  if (!pool.length) return []
  return Array.from({ length: Math.min(3, pool.length) }, (_, index) => reviewQuestionFor(pool[(offset + index) % pool.length].id, offset + index))
}
export type ReviewState = { index: number; selected: string | null; checked: boolean; score: number; finished: boolean }
export const initialReview: ReviewState = { index: 0, selected: null, checked: false, score: 0, finished: false }
export function reviewReducer(state: ReviewState, action: { type: 'choose'; id: string } | { type: 'check'; correctId: string } | { type: 'next'; total: number } | { type: 'restart' }): ReviewState {
  if (action.type === 'restart') return initialReview
  if (state.finished) return state
  if (action.type === 'choose') return state.checked ? state : { ...state, selected: action.id }
  if (action.type === 'check') return !state.selected || state.checked ? state : { ...state, checked: true, score: state.score + Number(state.selected === action.correctId) }
  if (!state.checked) return state
  return state.index + 1 >= action.total ? { ...state, finished: true } : { ...state, index: state.index + 1, selected: null, checked: false }
}
export const speakingScenes = [
  { id: 'friend', title: 'เจอเพื่อนใหม่', prompts: [
    { zh: '你叫什么名字？', py: 'Nǐ jiào shénme míngzi?', th: 'คุณชื่ออะไร', answer: '我叫小明。', answerPy: 'Wǒ jiào Xiǎomíng.', answerTh: 'ฉันชื่อเสี่ยวหมิง' },
    { zh: '你是学生吗？', py: 'Nǐ shì xuésheng ma?', th: 'คุณเป็นนักเรียนไหม', answer: '是的，我是学生。', answerPy: 'Shì de, wǒ shì xuésheng.', answerTh: 'ใช่ ฉันเป็นนักเรียน' },
    { zh: '你喜欢学习中文吗？', py: 'Nǐ xǐhuan xuéxí Zhōngwén ma?', th: 'คุณชอบเรียนภาษาจีนไหม', answer: '我喜欢学习中文。', answerPy: 'Wǒ xǐhuan xuéxí Zhōngwén.', answerTh: 'ฉันชอบเรียนภาษาจีน' },
  ] },
  { id: 'water', title: 'ขอน้ำดื่ม', prompts: [
    { zh: '你想喝什么？', py: 'Nǐ xiǎng hē shénme?', th: 'คุณอยากดื่มอะไร', answer: '我想喝水。', answerPy: 'Wǒ xiǎng hē shuǐ.', answerTh: 'ฉันอยากดื่มน้ำ' },
    { zh: '你要热水还是冷水？', py: 'Nǐ yào rèshuǐ háishi lěngshuǐ?', th: 'คุณต้องการน้ำร้อนหรือน้ำเย็น', answer: '我要热水，谢谢。', answerPy: 'Wǒ yào rèshuǐ, xièxie.', answerTh: 'ฉันต้องการน้ำร้อน ขอบคุณ' },
    { zh: '还需要别的吗？', py: 'Hái xūyào bié de ma?', th: 'ต้องการอย่างอื่นอีกไหม', answer: '不用了，谢谢。', answerPy: 'Bú yòng le, xièxie.', answerTh: 'ไม่แล้ว ขอบคุณ' },
  ] },
]
export type BloomSection = 'map' | 'sentences' | 'review' | 'speaking'
export function bloomSection(hash: string): BloomSection {
  const key = hash.replace(/^#/, '').split('?')[0]
  return key === 'sentences' || key === 'review' || key === 'speaking' ? key : 'map'
}

export function splitReviewBatches<T>(items: readonly T[]): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += 3) batches.push(items.slice(i, i + 3))
  return batches
}

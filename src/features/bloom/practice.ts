import { extendedExamples } from './practiceExamples'
import { nodeById } from './catalog'
import type { MapNode } from './map'

export const allPracticeWords = [...nodeById.values()].filter(node => node.kind === 'word')
export function practiceWords(contextId?: string): MapNode[] {
  const context = nodeById.get(contextId ?? '')
  if (context?.kind === 'character') return allPracticeWords.filter(word => word.zh.includes(context.zh))
  if (context?.kind === 'word') return [context, ...allPracticeWords.filter(word => word.id !== context.id)]
  return allPracticeWords
}

// Authored examples: do not attach one grammatical template to arbitrary vocabulary.
const examples = [
  ['人口', '中国人口很多。', 'Zhōngguó rénkǒu hěn duō.', 'ประเทศจีนมีประชากรมาก'],
  ['洗手', '吃饭前要洗手。', 'Chīfàn qián yào xǐshǒu.', 'ก่อนกินข้าวต้องล้างมือ'],
  ['门口', '我在门口等你。', 'Wǒ zài ménkǒu děng nǐ.', 'ฉันรอคุณอยู่หน้าประตู'],
  ['开口', '请先开口说话。', 'Qǐng xiān kāikǒu shuōhuà.', 'กรุณาเริ่มพูดก่อน'],
  ['出口', '出口在哪里？', 'Chūkǒu zài nǎlǐ?', 'ทางออกอยู่ที่ไหน'],
  ['开心', '我今天很开心。', 'Wǒ jīntiān hěn kāixīn.', 'วันนี้ฉันมีความสุขมาก'],
  ['小心', '过马路要小心。', 'Guò mǎlù yào xiǎoxīn.', 'ข้ามถนนต้องระวัง'],
  ['关心', '谢谢你的关心。', 'Xièxie nǐ de guānxīn.', 'ขอบคุณที่เป็นห่วง'],
  ['手机', '这是我的手机。', 'Zhè shì wǒ de shǒujī.', 'นี่คือโทรศัพท์มือถือของฉัน'],
  ['手工', '我喜欢做手工。', 'Wǒ xǐhuan zuò shǒugōng.', 'ฉันชอบทำงานฝีมือ'],
  ['双手', '请举起双手。', 'Qǐng jǔqǐ shuāngshǒu.', 'กรุณายกมือทั้งสองข้าง'],
  ['火车', '我坐火车去北京。', 'Wǒ zuò huǒchē qù Běijīng.', 'ฉันนั่งรถไฟไปปักกิ่ง'],
  ['火山', '那是一座火山。', 'Nà shì yí zuò huǒshān.', 'นั่นคือภูเขาไฟลูกหนึ่ง'],
  ['大火', '大火已经被扑灭了。', 'Dàhuǒ yǐjīng bèi pūmiè le.', 'ไฟไหม้ใหญ่ถูกดับแล้ว'],
  ['高山', '远处有一座高山。', 'Yuǎnchù yǒu yí zuò gāoshān.', 'ไกลออกไปมีภูเขาสูงลูกหนึ่ง'],
  ['上山', '我们明天上山。', 'Wǒmen míngtiān shàngshān.', 'พรุ่งนี้พวกเราจะขึ้นเขา'],
  ['山水', '这里的山水很美。', 'Zhèlǐ de shānshuǐ hěn měi.', 'ทิวทัศน์ภูเขาและสายน้ำที่นี่สวยมาก'],
  ['月亮', '今晚的月亮很美。', 'Jīnwǎn de yuèliang hěn měi.', 'ดวงจันทร์คืนนี้สวยมาก'],
  ['月份', '你最喜欢哪个月份？', 'Nǐ zuì xǐhuan nǎ ge yuèfèn?', 'คุณชอบเดือนไหนมากที่สุด'],
  ['每月', '我每月去一次图书馆。', 'Wǒ měiyuè qù yí cì túshūguǎn.', 'ฉันไปห้องสมุดเดือนละครั้ง'],
]
export const dailyExamples = new Map([...examples, ...extendedExamples].map(([word, zh, py, th]) => [word, { zh, py, th, wordId: `w:${word}` }]))
export const sentencePatterns = [
  { id: 'identity', title: 'แนะนำตัว', prefix: '我是', py: 'Wǒ shì', th: 'ฉันเป็น', words: ['学生', '医生', '工人', '中国人'] },
  { id: 'place', title: 'บอกว่าจะไปไหน', prefix: '我去', py: 'Wǒ qù', th: 'ฉันไป', words: ['学校', '公园', '海边'] },
  { id: 'want', title: 'ขอสิ่งที่ต้องการ', prefix: '我想要', py: 'Wǒ xiǎng yào', th: 'ฉันอยากได้', words: ['水果', '开水', '水杯'] },
  { id: 'action', title: 'บอกสิ่งที่กำลังทำ', prefix: '我在', py: 'Wǒ zài', th: 'ฉันกำลัง', words: ['学习', '工作', '休息'] },
] as const

export function speakingFor(wordId: string) {
  const word = nodeById.get(wordId)
  if (word?.kind !== 'word') return null
  const pattern = sentencePatterns.find(item => (item.words as readonly string[]).includes(word.zh))
  const sentence = dailyExamples.get(word.zh) ?? (pattern ? { zh: `${pattern.prefix}${word.zh}。`, py: `${pattern.py} ${word.py}.`, th: `${pattern.th}${word.th.split(' / ')[0]}` } : undefined)
  return {
    zh: `请用“${word.zh}”说一句话。`, py: `Qǐng yòng “${word.py}” shuō yí jù huà.`, th: `ลองพูดหนึ่งประโยคโดยใช้คำว่า “${word.zh}” (${word.th.split(' / ')[0]})`,
    answer: sentence?.zh ?? word.zh, answerPy: sentence?.py ?? word.py, answerTh: sentence?.th ?? word.th,
    hasSentence: Boolean(sentence),
  }
}

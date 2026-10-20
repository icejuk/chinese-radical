import { bloomSeedGraph } from './seed'
import { foundationStarters } from './foundationExpansion'
import type { MapNode } from './map'

export const bloomGroups = [
  { id: 'learning', title: 'การเรียนและชีวิต', root: 'c:学', note: 'เรียนรู้สิ่งใกล้ตัว จากห้องเรียนไปถึงชีวิตประจำวัน', color: '#78619b', soft: '#efe9f6' },
  { id: 'wood', title: 'ต้นไม้และการพัก', root: 'c:木', note: 'มองหาต้นไม้ในตัวจีน แล้วแตกคำไปด้วยกัน', color: '#4d7953', soft: '#e7efdc' },
  { id: 'water', title: 'น้ำและสิ่งรอบตัว', root: 'c:水', note: 'จากน้ำหนึ่งแก้ว ไปถึงแม่น้ำและทะเล', color: '#42778b', soft: '#e5eff2' },
  { id: 'people', title: 'คนและคำเรียก', root: 'c:人', note: 'เริ่มบทสนทนาจากคำที่ใช้เรียกกัน', color: '#a16e4b', soft: '#f8eadb' },
] as const

export const startingCharacterIds = ['学', '生', '日', '人', '家', '水', '木', '休', ...foundationStarters].map(zh => `c:${zh}`)

export const nodeById = new Map(bloomSeedGraph.nodes.map(node => [node.id, node]))
export const groupById = new Map<string, typeof bloomGroups[number]>(bloomGroups.map(group => [group.id, group]))
export const charactersFor = (group: string) => bloomSeedGraph.nodes.filter(node => node.group === group && node.kind === 'character')
export const wordsFor = (group: string) => bloomSeedGraph.nodes.filter(node => node.group === group && node.kind === 'word')

export function parentsOf(word: MapNode): MapNode[] {
  const connected = new Set(bloomSeedGraph.edges.filter(edge => edge.target === word.id && edge.kind === 'contains-character').map(edge => edge.source))
  // Reading order gives a predictable first parent: 学生 starts at 学.
  return [...new Set([...word.zh].map(character => `c:${character}`))]
    .filter(id => connected.has(id))
    .map(id => nodeById.get(id)!)
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '')
}

export function searchWords(query: string): MapNode[] {
  const text = query.trim(), normalized = normalize(text)
  if (!normalized) return []
  return bloomSeedGraph.nodes.map(node => ({
    node,
    rank: node.zh === text ? 0 : normalize(node.py) === normalized ? 1 :
      node.th.includes(text) ? 2 : node.zh.includes(text) || normalize(node.py).includes(normalized) ? 3 : 4,
  })).filter(result => result.rank < 4).sort((a, b) => a.rank - b.rank).slice(0, 6).map(result => result.node)
}

export const bloomCounts = {
  words: bloomSeedGraph.nodes.filter(node => node.kind === 'word').length,
  characters: bloomSeedGraph.nodes.filter(node => node.kind === 'character').length,
}

/** Polyphonic characters are heard in the vocabulary context that defines their reading here. */
export function characterAudio(zh: string) {
  const contexts: Record<string, string> = { 长: '校长', 校: '学校', 乐: '乐器', 调: '调料', 数: '数学', 假: '假期', 发: '头发', 教: '教材' }
  return contexts[zh] ?? zh
}

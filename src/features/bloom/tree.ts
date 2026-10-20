import { bloomSeedGraph } from './seed'
import { bloomGroups, nodeById, parentsOf } from './catalog'
import { peopleFirstWords } from './peopleExpansion'
import type { MapNode, FocusBox } from './map'

export type TreeNode = FocusBox & { node: MapNode; parent: string | null }
export function wordsOf(id: string) {
  const ids = new Set(bloomSeedGraph.edges.filter(edge => edge.kind === 'contains-character' && edge.source === id).map(edge => edge.target))
  const words = bloomSeedGraph.nodes.filter(node => ids.has(node.id))
  return id === 'c:人' ? words.sort((a, b) => peopleFirstWords.indexOf(a.zh) - peopleFirstWords.indexOf(b.zh)) : words
}
/** Occurrence paths keep a shared word in its own branch without introducing cycles. */
export function treeLayout(rootId: string, opened: string[]) {
  const nodes: TreeNode[] = [], open = new Set(opened)
  function visit(id: string, path: string, parent: string | null, depth: number, top: number, ancestors: string[]): number {
    const node = nodeById.get(id)
    if (!node) return 0
    const index = nodes.length
    nodes.push({ id: path, node, parent, x: 24 + depth * 218, y: top, width: 146, height: 96 })
    const children = node.kind === 'character' ? wordsOf(id) : parentsOf(node).filter(character => !ancestors.includes(character.id) && open.has(`${path}/${character.id}`))
    let cursor = top
    for (const child of children) cursor += visit(child.id, `${path}/${child.id}`, path, depth + 1, cursor, node.kind === 'character' ? [...ancestors, id] : ancestors)
    const height = Math.max(126, cursor - top)
    nodes[index].y = top + (height - 96) / 2
    return height
  }
  const height = visit(rootId, rootId, null, 0, 24, []) + 48
  return { nodes, height, width: Math.max(364, ...nodes.map(node => node.x + node.width + 24)) }
}

export const collectionId = 'collection:words'
export type UnifiedTreeNode = FocusBox & {
  node: MapNode | { id: string; kind: 'collection'; zh: string; py: string; th: string; group: string }
  parent: string | null
}
export type LayoutMemory = Map<string, { x: number; y: number }>
/** Stable slots reserve existing positions, including collapsed branches, while new branches grow outwards. */
export function unifiedTreeLayout(roots: string[], opened: string[], memory: LayoutMemory = new Map(), portrait = false) {
  const ids = [...new Set([...bloomGroups.map(group => group.root), ...roots])]
  const nodes: UnifiedTreeNode[] = []
  const width = roots.length ? portrait ? 128 : 176 : 120, height = roots.length ? 118 : 90, gap = 30
  const exploring = roots.length > 0
  if (!exploring || !memory.has('layout:organic') || !memory.has('layout:exploring') || memory.has('layout:portrait') !== portrait) {
    memory.clear()
    if (exploring) { memory.set('layout:exploring', { x: -10000, y: -10000 }); memory.set('layout:organic', { x: -30000, y: -30000 }) }
    if (portrait) memory.set('layout:portrait', { x: -20000, y: -20000 })
  }
  const collection = { id: collectionId, kind: 'collection' as const, zh: 'คำจีน', py: 'Mandarin Trail', th: 'ทุกกลุ่ม', group: '' }
  if (!memory.has(collectionId)) memory.set(collectionId, { x: exploring ? -700 : 75, y: exploring ? 3900 : 0 })
  ids.forEach((id, index) => { if (!memory.has(id)) memory.set(id, { x: exploring ? index % 2 * 2600 : index % 2 ? 150 : 0, y: exploring ? Math.floor(index / 2) * 2600 : index < 2 ? 110 : 220 }) })
  function place(id: string, node: UnifiedTreeNode['node'], parent: string | null, x: number, y: number) {
    if (!memory.has(id)) {
      let candidate = y, step = 0
      const collides = () => [...memory.entries()].filter(([key]) => !key.startsWith('layout:')).some(([, box]) => x < box.x + width + gap && x + width + gap > box.x && candidate < box.y + height + gap && candidate + height + gap > box.y)
      while (collides()) { step++; candidate = y + Math.ceil(step / 2) * 154 * (step % 2 ? 1 : -1) }
      memory.set(id, { x, y: candidate })
    }
    nodes.push({ id, node, parent, ...memory.get(id)!, width, height })
  }
  place(collectionId, collection, null, 170, 166)
  ids.forEach(id => place(id, nodeById.get(id)!, collectionId, 170, 620))
  const open = new Set(opened)
  function hash(path: string) { return [...path].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7) }
  function radial(at: string, child: MapNode, parent: string, angle: number, radius: number) {
    const anchor = memory.get(parent)!
    let x = 0, y = 0
    // Search nearby free angles instead of pushing a collision into a vertical column.
    for (let attempt = 0; attempt < 120; attempt++) {
      const slot = attempt % 9
      const turn = slot === 0 ? 0 : Math.ceil(slot / 2) * 9 * (slot % 2 ? 1 : -1)
      const radians = (angle + turn) * Math.PI / 180
      const distance = radius + Math.floor(attempt / 9) * 70
      x = anchor.x + Math.cos(radians) * distance
      y = anchor.y + Math.sin(radians) * distance
      const blocked = [...memory.entries()].some(([key, box]) => !key.startsWith('layout:') && key !== at && x < box.x + width + gap && x + width + gap > box.x && y < box.y + height + gap && y + height + gap > box.y)
      if (!blocked || memory.has(at)) break
    }
    place(at, child, parent, x, y)
  }
  const personAngles = [-112.5, 22.5, -67.5, -22.5, -157.5, 67.5, 112.5, 157.5]
  function grow(id: string, path: string, outward: number | null, ancestors: string[], sourceWord?: string) {
    const node = nodeById.get(id)!, anchor = memory.get(path)!
    const children = node.kind === 'character' ? wordsOf(id).filter(word => word.id !== sourceWord) : parentsOf(node).filter(character => !ancestors.includes(character.id) && open.has(`${path}/${character.id}`))
    children.forEach((child, index) => {
      const at = `${path}/${child.id}`
      const variation = (hash(at) % 13) - 6
      let angle: number, radius: number
      if (outward === null) {
        const innerCount = Math.min(8, children.length), ring = Math.floor(index / 8)
        angle = id === 'c:人' && ring === 0 ? personAngles[index] : -112.5 + (index % 8) * 360 / innerCount + ring * 22.5
        radius = (portrait ? 210 : 270) + ring * (portrait ? 175 : 220)
      } else if (node.kind === 'word') {
        const all = parentsOf(node), position = all.findIndex(character => character.id === child.id)
        angle = outward + (position - (all.length - 1) / 2) * 28
        radius = portrait ? 185 : 240
      } else {
        const fanSize = Math.min(5, children.length), tier = Math.floor(index / 5)
        angle = outward + (index % 5 - (fanSize - 1) / 2) * 26
        radius = (portrait ? 225 : 290) + tier * 190
      }
      radial(at, child, path, angle + variation * .4, radius + variation)
      const positioned = memory.get(at)!
      const direction = Math.atan2(positioned.y - anchor.y, positioned.x - anchor.x) * 180 / Math.PI
      if (child.kind === 'word' || open.has(at)) grow(child.id, at, direction, node.kind === 'character' ? [...ancestors, id] : ancestors, node.kind === 'word' ? id : undefined)
    })
  }
  roots.forEach(id => { if (nodeById.get(id)?.kind === 'character') grow(id, id, null, []) })
  if (exploring) {
    // Translate whole families after their true bounds are known. Keep local geometry in memory.
    // A large family gets room to grow; closed entries reserve only their own card.
    const families = ids.map(id => {
      const members = nodes.filter(box => box.id === id || box.id.startsWith(`${id}/`))
      const left = Math.min(...members.map(box => box.x)), top = Math.min(...members.map(box => box.y))
      return { id, members, left, top, width: Math.max(...members.map(box => box.x + box.width)) - left, height: Math.max(...members.map(box => box.y + box.height)) - top }
    }).sort((a, b) => b.width * b.height - a.width * a.height)
    const spacing = portrait ? 44 : 64
    const minimum = Math.max(...families.map(family => family.width))
    const total = families.reduce((sum, family) => sum + family.width + spacing, 0)
    let best: { score: number; placements: { family: typeof families[number]; x: number; y: number }[]; width: number; height: number } | undefined
    for (let limit = minimum; limit <= total + spacing; limit += 100) {
      let x = 0, y = 0, rowHeight = 0, usedWidth = 0
      const placements = families.map(family => {
        if (x && x + family.width > limit) { y += rowHeight + spacing; x = 0; rowHeight = 0 }
        const placed = { family, x, y }; x += family.width + spacing
        usedWidth = Math.max(usedWidth, x - spacing); rowHeight = Math.max(rowHeight, family.height)
        return placed
      })
      const usedHeight = y + rowHeight
      const score = usedWidth * usedHeight * (1 + .3 * Math.abs(Math.log((usedWidth / usedHeight) / (portrait ? .85 : 1.5))))
      if (!best || score < best.score) best = { score, placements, width: usedWidth, height: usedHeight }
    }
    const headingSpace = height + spacing
    for (const { family, x, y } of best!.placements) {
      for (const box of family.members) { box.x += x - family.left; box.y += headingSpace + y - family.top }
    }
    const center = nodes.find(box => box.id === collectionId)!
    center.x = (best!.width - width) / 2; center.y = 0
  }
  const left = Math.min(...nodes.map(box => box.x)) - 30, top = Math.min(...nodes.map(box => box.y)) - 30
  return { nodes: nodes.map(box => ({ ...box, x: box.x - left, y: box.y - top })), width: Math.max(...nodes.map(box => box.x + box.width)) - left + 30, height: Math.max(...nodes.map(box => box.y + box.height)) - top + 30 }
}

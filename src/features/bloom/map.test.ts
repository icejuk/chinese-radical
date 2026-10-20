import { describe, expect, it } from 'vitest'
import { bloomSeedGraph } from './seed'
import { woodExpansionNodes } from './woodExpansion'
import { wordsOf } from './tree'
import { expandCharacter, mapHash, parseMapRoute, selectNode } from './navigation'
import { foundationStarters } from './foundationExpansion'
import { parentsOf, nodeById, startingCharacterIds } from './catalog'
import { validateGraph } from './map'

describe('BLOOM word map foundation', () => {
  it('keeps reading, Thai meanings and valid typed relationships for the seed', () => {
    expect(validateGraph(bloomSeedGraph)).toEqual([])
    expect(bloomSeedGraph.nodes.filter(node => node.kind === 'word')).toHaveLength(149)
  })
  it('offers six usable foundation hubs with readings and shared-word connections', () => {
    for (const zh of foundationStarters) {
      const id = `c:${zh}`
      expect(startingCharacterIds).toContain(id)
      expect(nodeById.get(id)?.py).toBeTruthy()
      expect(nodeById.get(id)?.th).toBeTruthy()
      expect(wordsOf(id).length).toBeGreaterThanOrEqual(3)
    }
    expect(parentsOf(nodeById.get('w:火山')!).map(node => node.zh)).toEqual(['火', '山'])
    expect(parentsOf(nodeById.get('w:山水')!).map(node => node.zh)).toEqual(['山', '水'])
  })
  it('opens every character in the original thirteen wood words', () => {
    const initial = ['木头', '树木', '木材', '木工', '木门', '木马', '树林', '园林', '林业', '森林', '休息', '休假', '午休']
    for (const zh of initial) {
      const word = bloomSeedGraph.nodes.find(node => node.id === `w:${zh}`)!
      expect(parentsOf(word).map(node => node.zh)).toEqual([...new Set([...zh])])
      for (const parent of parentsOf(word)) expect(wordsOf(parent.id).length).toBeGreaterThan(0)
    }
  })
  it('gives every added character multiple vocabulary branches', () => {
    for (const character of woodExpansionNodes.filter(node => node.kind === 'character')) {
      expect(wordsOf(character.id).length, character.zh).toBeGreaterThan(1)
    }
  })
  it('continues 木 → 木材 → 材 → 材料 → 料 → 饮料 without replacing the tree root', () => {
    let route = expandCharacter('c:材', selectNode('w:木材', selectNode('c:木')))
    expect(wordsOf('c:材').map(node => node.zh)).toEqual(expect.arrayContaining(['材料', '教材', '身材', '器材', '木材']))
    route = expandCharacter('c:料', selectNode('w:材料', route))
    route = selectNode('w:饮料', route)
    expect(route.focus).toBe('c:木')
    expect(route.selected).toBe('w:饮料')
    expect(route.open).toHaveLength(2)
    expect(parseMapRoute(mapHash(route))).toEqual(route)
  })
  it('detects missing translations, duplicate nodes and broken links', () => {
    const graph = structuredClone(bloomSeedGraph)
    graph.nodes[0].th = ''
    graph.nodes.push(graph.nodes[1])
    graph.edges.push({ source: 'missing', target: 'c:水', kind: 'contains-component' })
    expect(validateGraph(graph).join(' ')).toContain('Missing reading or meaning')
    expect(validateGraph(graph).join(' ')).toContain('Duplicate node')
    expect(validateGraph(graph).join(' ')).toContain('Dangling edge')
  })
  it('does not mislabel a thematic word as containing a character', () => {
    const graph = structuredClone(bloomSeedGraph)
    graph.edges.push({ source: 'c:水', target: 'w:学生', kind: 'contains-character' })
    expect(validateGraph(graph).join(' ')).toContain('Invalid character relationship')
  })
})

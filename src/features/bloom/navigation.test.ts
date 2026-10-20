import { describe, expect, it } from 'vitest'
import { treeLayout, unifiedTreeLayout, collectionId } from './tree'
import { activateMapNode, collapseBranch, expandCharacter, isLegacyHash, mapHash, overviewRoute, parseMapRoute, selectNode, selectOccurrence } from './navigation'
import { searchWords } from './catalog'

describe('BLOOM journeys and deep links', () => {
  it('keeps 学 and every original word when expanding 学生 → 生 → 生活', () => {
    const student = selectNode('w:学生', selectNode('c:学'))
    const expanded = expandCharacter('c:生', student)
    const tree = treeLayout(expanded.focus!, expanded.open)
    expect(expanded.focus).toBe('c:学')
    for (const old of treeLayout('c:学', []).nodes) expect(tree.nodes.some(node => node.id === old.id)).toBe(true)
    const life = tree.nodes.find(node => node.node.id === 'w:生活')!
    const selected = selectOccurrence(life.id, expanded)
    expect(selected.selected).toBe('w:生活')
    expect(parseMapRoute(mapHash(selected))).toEqual(selected)
  })
  it('puts all six wood and eight water words on one canvas', () => {
    expect(treeLayout('c:木', []).nodes).toHaveLength(7)
    expect(treeLayout('c:水', []).nodes).toHaveLength(9)
    const sea = selectNode('w:海水', selectNode('c:水'))
    expect(sea.focus).toBe('c:水')
    expect(parseMapRoute(mapHash(sea))).toEqual(sea)
    expect(mapHash(sea)).not.toContain('page')
  })
  it('collapses descendants while preserving original siblings and selecting the parent word', () => {
    const student = selectNode('w:学生', selectNode('c:学'))
    const expanded = expandCharacter('c:生', student)
    const collapsed = collapseBranch(expanded.at!, expanded)
    expect(collapsed.open).toEqual([])
    expect(collapsed.selected).toBe('w:学生')
    expect(treeLayout(collapsed.focus!, collapsed.open).nodes).toEqual(treeLayout('c:学', []).nodes)
  })
  it('returns to the ancestor instead of expanding a cycle', () => {
    const student = selectNode('w:学生', selectNode('c:学'))
    expect(expandCharacter('c:学', student)).toEqual(selectNode('c:学'))
    expect(expandCharacter('c:水', student)).toEqual(student)
  })
  it('normalizes invalid URLs and accepts old unpaginated word links', () => {
    expect(parseMapRoute('#map?focus=missing')).toEqual(overviewRoute)
    expect(parseMapRoute('#map?focus=w:学生')).toEqual(overviewRoute)
    expect(parseMapRoute('#map?focus=c:水&selected=w:学生&page=99')).toEqual(selectNode('c:水'))
    expect(parseMapRoute('#map?focus=c:水&selected=w:海水&page=1')).toEqual(selectNode('w:海水', selectNode('c:水')))
    expect(parseMapRoute('#map?focus=c:学&open=c:学/w:学生/c:水&at=missing')).toEqual(selectNode('c:学'))
    expect(mapHash(overviewRoute)).toBe('#map')
  })
  it('searches Chinese, accent-insensitive pinyin and Thai without altering Thai tones', () => {
    for (const query of ['学生', 'xuésheng', 'xuesheng', 'นักเรียน']) expect(searchWords(query)[0].id).toBe('w:学生')
    expect(searchWords('huang he')[0].zh).toBe('黄河')
    expect(searchWords('น้ำ')[0].id).toBe('c:水')
    expect(searchWords('   ')).toEqual([])
    expect(searchWords('<script>')).toEqual([])
  })
  it('keeps every legacy bookmark on the original app', () => {
    for (const hash of ['#learn', '#practice', '#explore', '#detail', '#quiz', '#write', '#radicals', '#chars', '#breakdown']) expect(isLegacyHash(hash)).toBe(true)
    for (const hash of ['', '#map', '#map?focus=c:水', '#unknown']) expect(isLegacyHash(hash)).toBe(false)
  })
  it('restores nested branches and removes only the collapsed subtree', () => {
    let route = expandCharacter('c:生', selectNode('w:学生', selectNode('c:学')))
    const first = route.at!
    route = expandCharacter('c:人', selectNode('w:人生', route))
    expect(route.open).toHaveLength(2)
    expect(parseMapRoute(mapHash(route))).toEqual(route)
    const collapsed = collapseBranch(first, route)
    expect(collapsed.open).toEqual([])
    expect(collapsed.selected).toBe('w:学生')
  })
  it('never overlaps cards across multiple expanded branches', () => {
    let route = expandCharacter('c:生', selectNode('w:学生', selectNode('c:学')))
    route = expandCharacter('c:校', selectNode('w:学校', route))
    const boxes = treeLayout(route.focus!, route.open).nodes
    expect(boxes.length).toBeGreaterThan(15)
    boxes.forEach((a, index) => boxes.slice(index + 1).forEach(b => {
      expect(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y, `${a.id} / ${b.id}`).toBe(false)
    }))
    expect(parseMapRoute(mapHash(route))).toEqual(route)
  })
})


describe('one tree across all groups', () => {
  it('shows all four entry points connected to one collection on the home route', () => {
    const tree = unifiedTreeLayout(overviewRoute.roots, overviewRoute.open)
    expect(tree.nodes).toHaveLength(5)
    expect(tree.nodes.filter(node => !node.parent).map(node => node.id)).toEqual([collectionId])
    for (const id of ['c:学', 'c:木', 'c:水', 'c:人']) expect(tree.nodes.find(node => node.id === id)?.parent).toBe(collectionId)
  })
  it('retains every opened group and nested branch when moving between groups and reloading', () => {
    let route = expandCharacter('c:生', selectNode('w:学生', selectNode('c:学')))
    const original = unifiedTreeLayout(route.roots, route.open).nodes.map(node => node.id)
    route = selectNode('c:木', route)
    route = expandCharacter('c:材', selectNode('w:木材', route))
    route = selectNode('c:水', route)
    const tree = unifiedTreeLayout(route.roots, route.open)
    for (const id of original) expect(tree.nodes.some(node => node.id === id)).toBe(true)
    expect(tree.nodes.some(node => node.node.id === 'w:材料')).toBe(true)
    expect(route.roots).toEqual(['c:学', 'c:木', 'c:水'])
    expect(parseMapRoute(mapHash(route))).toEqual(route)
    const overview = selectOccurrence(collectionId, route)
    expect(parseMapRoute(mapHash(overview))).toEqual(overview)
    tree.nodes.forEach((a, index) => tree.nodes.slice(index + 1).forEach(b => {
      expect(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y, `${a.id} / ${b.id}`).toBe(false)
    }))
  })
  it('collapses one group without discarding other groups or their expansion state', () => {
    let route = selectNode('c:木', selectNode('c:学'))
    route = expandCharacter('c:材', selectNode('w:木材', route))
    const collapsed = collapseBranch('c:学', route)
    expect(collapsed.roots).toEqual(['c:木'])
    expect(collapsed.open).toEqual(route.open)
    expect(collapsed.at).toBe(route.at)
    expect(parseMapRoute(mapHash(collapsed))).toEqual(collapsed)
    expect(unifiedTreeLayout(collapsed.roots, collapsed.open).nodes.some(node => node.node.id === 'w:材料')).toBe(true)
  })
  it('opens a group at its own entry point even if that character already appears on another branch', () => {
    const nested = expandCharacter('c:人', selectNode('w:人生', selectNode('c:生')))
    const route = selectNode('c:人', nested)
    expect(route.at).toBe('c:人')
    expect(route.roots).toContain('c:生')
    expect(route.roots).toContain('c:人')
  })
})


describe('organic mind map exploration', () => {
  it('grows 人 around its center and preserves every existing position relative to its root', () => {
    const memory = new Map<string, { x: number; y: number }>()
    const before = unifiedTreeLayout(['c:人'], [], memory)
    const root = before.nodes.find(box => box.id === 'c:人')!
    const words = before.nodes.filter(box => box.parent === 'c:人')
    expect(words.some(box => box.x < root.x)).toBe(true)
    expect(words.some(box => box.x > root.x)).toBe(true)
    const expandedPath = 'c:人/w:家人/c:家'
    const after = unifiedTreeLayout(['c:人', 'c:木'], [expandedPath], memory)
    const newRoot = after.nodes.find(box => box.id === 'c:人')!
    for (const old of before.nodes) {
      const next = after.nodes.find(box => box.id === old.id)!
      if (old.id === 'c:人' || old.id.startsWith('c:人/')) {
        expect([next.x - newRoot.x, next.y - newRoot.y]).toEqual([old.x - root.x, old.y - root.y])
      }
    }
    const familyWord = after.nodes.find(box => box.id === 'c:人/w:家人')!
    const familyChar = after.nodes.find(box => box.id === expandedPath)!
    expect(Math.hypot(familyChar.x - newRoot.x, familyChar.y - newRoot.y)).toBeGreaterThan(Math.hypot(familyWord.x - newRoot.x, familyWord.y - newRoot.y))
    const household = after.nodes.find(box => box.id === `${expandedPath}/w:家庭`)!
    expect(household.id).toContain(expandedPath)
    after.nodes.forEach((a, index) => after.nodes.slice(index + 1).forEach(b => {
      expect(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y, `${a.id} / ${b.id}`).toBe(false)
    }))
    unifiedTreeLayout(['c:人'], [], memory)
    const reopened = unifiedTreeLayout(['c:人', 'c:木'], [expandedPath], memory)
    expect(reopened.nodes).toEqual(after.nodes)
  })
  it('keeps the people → family → household journey shareable and all words writable', () => {
    const person = selectNode('c:人')
    const family = expandCharacter('c:家', selectNode('w:家人', person))
    const household = selectNode('w:家庭', family)
    expect(household.focus).toBe('c:人')
    expect(parseMapRoute(mapHash(household))).toEqual(household)
    expect(treeLayout('c:人', []).nodes).toHaveLength(17)
  })
})


it('spreads mobile words across several directions while retaining the source and collision-free branches', () => {
  const expanded = 'c:人/w:家人/c:家'
  const tree = unifiedTreeLayout(['c:人'], [expanded], new Map(), true)
  const root = tree.nodes.find(box => box.id === 'c:人')!
  const left = tree.nodes.find(box => box.id === 'c:人/w:家人')!
  const right = tree.nodes.find(box => box.id === 'c:人/w:别人')!
  expect(left.x).toBeLessThan(root.x)
  expect(right.x).toBeGreaterThan(root.x)
  const leaves = tree.nodes.filter(box => box.parent === root.id)
  const sectors = new Set(leaves.map(box => Math.floor((Math.atan2(box.y - root.y, box.x - root.x) + Math.PI) / (Math.PI / 4))))
  expect(sectors.size).toBeGreaterThanOrEqual(6)
  expect(new Set(leaves.map(box => Math.round(box.x))).size).toBeGreaterThan(8)
  expect(new Set(leaves.map(box => Math.round(box.y))).size).toBeGreaterThan(8)
  const family = tree.nodes.find(box => box.id === expanded)!
  const household = tree.nodes.find(box => box.id === `${expanded}/w:家庭`)!
  expect(household.parent).toBe(family.id)
  expect(tree.nodes.some(box => box.id === `${expanded}/w:家人`)).toBe(false)
  tree.nodes.forEach((a, index) => tree.nodes.slice(index + 1).forEach(b => {
    expect(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y, `${a.id} / ${b.id}`).toBe(false)
  }))
})


it('opens details when a learner taps the already-open 日 node without changing or losing branches', () => {
  let route = selectNode('w:学生', selectNode('c:学'))
  route = expandCharacter('c:生', route)
  route = expandCharacter('c:日', selectNode('w:生日', route))
  const action = activateMapNode(route.at!, route)
  expect(action.showDetails).toBe(true)
  expect(action.next).toEqual(route)
  expect(parseMapRoute(mapHash(action.next))).toEqual(route)
  const tree = unifiedTreeLayout(route.roots, route.open)
  expect(tree.nodes.some(node => node.id === `${route.at}/w:日记`)).toBe(true)
  expect(tree.nodes.some(node => node.id === `${route.at}/w:日历`)).toBe(true)
  expect(tree.nodes.some(node => node.id === `${route.at}/w:生日`)).toBe(false)
})
it('opens a closed starting branch first, then opens details on subsequent taps', () => {
  const first = activateMapNode('c:人', overviewRoute)
  expect(first.next.roots).toContain('c:人')
  expect(first.showDetails).toBe(false)
  const second = activateMapNode('c:人', first.next)
  expect(second.showDetails).toBe(true)
  expect(second.next).toEqual(first.next)
})

it('opens details even when a character has no new word beyond its source', () => {
  const family = expandCharacter('c:庭', selectNode('w:家庭', selectNode('c:家')))
  const tree = unifiedTreeLayout(family.roots, family.open)
  expect(tree.nodes.filter(node => node.parent === family.at)).toHaveLength(0)
  expect(activateMapNode(family.at!, family).showDetails).toBe(true)
  expect(activateMapNode(family.at!, family).next).toEqual(family)
})

it('packs the reported three-family map using occupied bounds instead of distant anchors', () => {
  const tree = unifiedTreeLayout(['c:生', 'c:学', 'c:水'], [])
  expect(tree.width * tree.height).toBeLessThan(6_000_000)
  for (const root of ['c:生', 'c:学', 'c:水']) expect(tree.nodes.some(node => node.id === root)).toBe(true)
  tree.nodes.forEach((a, i) => tree.nodes.slice(i + 1).forEach(b => {
    expect(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y, `${a.id}/${b.id}`).toBe(false)
  }))
})

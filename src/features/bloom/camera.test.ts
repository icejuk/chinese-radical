import { describe, expect, it } from 'vitest'
import { unifiedTreeLayout } from './tree'
import { readingPose } from './camera'

describe('reading camera', () => {
  it('keeps a distant word fully visible above the mobile word dock at readable size', () => {
    const tree = unifiedTreeLayout(['c:人'], [], new Map(), true)
    for (const id of ['c:人/w:家人', 'c:人/w:中国人', 'c:人/w:人类']) {
      const pose = readingPose(tree.nodes, id, 286, 200, .95)!
      const card = tree.nodes.find(node => node.id === id)!
      expect(pose.scale).toBe(.95)
      expect(card.x * pose.scale + pose.x).toBeGreaterThanOrEqual(0)
      expect((card.x + card.width) * pose.scale + pose.x).toBeLessThanOrEqual(286)
      expect(card.y * pose.scale + pose.y).toBeGreaterThanOrEqual(0)
      expect((card.y + card.height) * pose.scale + pose.y).toBeLessThanOrEqual(200)
    }
  })
  it('keeps a word inside the space above the toolbar in a compact mobile map', () => {
    const tree = unifiedTreeLayout(['c:人'], [], new Map(), true)
    const id = 'c:人/w:中国人', card = tree.nodes.find(node => node.id === id)!
    const pose = readingPose(tree.nodes, id, 286, 120, .95)!
    expect(card.y * pose.scale + pose.y).toBeGreaterThanOrEqual(0)
    expect((card.y + card.height) * pose.scale + pose.y).toBeLessThanOrEqual(120)
  })
  it('keeps the source word and newly expanded character visible together on mobile', () => {
    const at = 'c:人/w:家人/c:家'
    const tree = unifiedTreeLayout(['c:人'], [at], new Map(), true)
    const pose = readingPose(tree.nodes, at, 286, 390, .95)!
    for (const id of ['c:人/w:家人', at]) {
      const card = tree.nodes.find(node => node.id === id)!
      expect(card.x * pose.scale + pose.x).toBeGreaterThanOrEqual(0)
      expect((card.x + card.width) * pose.scale + pose.x).toBeLessThanOrEqual(286)
      expect(card.y * pose.scale + pose.y).toBeGreaterThanOrEqual(0)
      expect((card.y + card.height) * pose.scale + pose.y).toBeLessThanOrEqual(390)
    }
  })
})

import { zoomAt, MIN_MAP_SCALE, MAX_MAP_SCALE } from './camera'
describe('ORBIT zoom', () => {
  it('keeps the world point under the pointer fixed through zoom in and out', () => {
    const before = { x: -350, y: 60, scale: .9 }, cx = 120, cy = 190
    const after = zoomAt(before, 1.2, cx, cy)
    expect((cx - after.x) / after.scale).toBeCloseTo((cx - before.x) / before.scale)
    expect((cy - after.y) / after.scale).toBeCloseTo((cy - before.y) / before.scale)
    const restored = zoomAt(after, 1 / 1.2, cx, cy)
    expect(restored.x).toBeCloseTo(before.x)
    expect(restored.y).toBeCloseTo(before.y)
  })
  it('clamps to the supported range and zooms continuously from overview', () => {
    const before = { x: 0, y: 0, scale: .25 }
    expect(zoomAt(before, 1.2, 100, 100).scale).toBeCloseTo(.3)
    expect(zoomAt(before, .001, 100, 100).scale).toBe(MIN_MAP_SCALE)
    expect(zoomAt(before, 1000, 100, 100).scale).toBe(MAX_MAP_SCALE)
  })
})

import type { UnifiedTreeNode } from './tree'

/** Include the source only when both cards fit at the readable zoom. */
export function readingPose(nodes: UnifiedTreeNode[], id: string, width: number, visibleHeight: number, scale: number) {
  const box = nodes.find(node => node.id === id)
  if (!box) return null
  const parent = nodes.find(node => node.id === box.parent)
  const pairFits = parent && parent.node.kind !== 'collection' && (Math.abs(box.x - parent.x) + box.width) * scale <= width - 8 && (Math.abs(box.y - parent.y) + box.height) * scale <= visibleHeight - 8
  const cx = pairFits ? (box.x + parent.x + box.width) / 2 : box.x + box.width / 2
  const cy = pairFits ? (box.y + parent.y + box.height) / 2 : box.y + box.height / 2
  return { scale, x: width / 2 - cx * scale, y: visibleHeight / 2 - cy * scale }
}

export type CameraPose = { x: number; y: number; scale: number }
export const MIN_MAP_SCALE = .04
export const MAX_MAP_SCALE = 2.4
/** Preserve the world point below the cursor when scale changes. */
export function zoomAt(pose: CameraPose, factor: number, cx: number, cy: number): CameraPose {
  const scale = Math.max(MIN_MAP_SCALE, Math.min(MAX_MAP_SCALE, pose.scale * factor))
  const ratio = scale / pose.scale
  return { scale, x: cx - (cx - pose.x) * ratio, y: cy - (cy - pose.y) * ratio }
}

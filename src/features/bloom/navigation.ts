import { bloomGroups, nodeById, groupById, parentsOf } from './catalog'
import { unifiedTreeLayout, collectionId } from './tree'

export type MapRoute = { focus: string | null; selected: string | null; at: string | null; open: string[]; roots: string[] }
export const overviewRoute: MapRoute = { focus: null, selected: null, at: null, open: [], roots: [] }
export function selectOccurrence(at: string, current: MapRoute): MapRoute {
  if (at === collectionId) return { ...current, focus: null, selected: null, at: null }
  const occurrence = unifiedTreeLayout(current.roots, current.open).nodes.find(node => node.id === at)
  return occurrence ? { ...current, focus: at.split('/')[0], at, selected: occurrence.node.id } : current
}
export function selectNode(id: string, current: MapRoute = overviewRoute): MapRoute {
  const node = nodeById.get(id)
  if (!node) return overviewRoute
  // Selecting a starting character opens its branch without discarding any other group.
  if (node.kind === 'character') {
    const existing = unifiedTreeLayout(current.roots, current.open).nodes.find(item => item.node.id === id && item.parent !== collectionId)
    if (existing && !bloomGroups.some(group => group.root === id)) return selectOccurrence(existing.id, current)
    return { ...current, focus: id, selected: id, at: id, roots: [...new Set([...current.roots, id])] }
  }
  const existing = unifiedTreeLayout(current.roots, current.open).nodes.find(item => item.node.id === id)
  if (existing) return selectOccurrence(existing.id, current)
  const parent = parentsOf(node)[0]
  return parent ? { ...current, focus: parent.id, selected: id, at: `${parent.id}/${id}`, roots: [...new Set([...current.roots, parent.id])] } : current
}
/** A second tap on an open character is a request for its details, even if the URL is unchanged. */
export function activateMapNode(at: string, current: MapRoute) {
  const isRoot = !at.includes('/') && at !== collectionId
  const next = isRoot ? selectNode(at, current) : selectOccurrence(at, current)
  const node = nodeById.get(next.selected ?? '')
  const alreadyOpen = current.roots.includes(at) || current.open.includes(at)
  return { next, showDetails: !!node && (node.kind === 'word' || alreadyOpen) }
}
export function expandCharacter(id: string, current: MapRoute): MapRoute {
  if (!current.focus || !current.at) return current
  const node = nodeById.get(current.selected ?? '')
  if (!node || node.kind !== 'word' || !parentsOf(node).some(parent => parent.id === id)) return current
  const ancestors = current.at.split('/')
  if (ancestors.includes(id)) return selectOccurrence(ancestors.slice(0, ancestors.indexOf(id) + 1).join('/'), current)
  const at = `${current.at}/${id}`
  return { ...current, selected: id, at, open: [...new Set([...current.open, at])] }
}
export function collapseBranch(at: string, current: MapRoute): MapRoute {
  const open = current.open.filter(path => path !== at && !path.startsWith(`${at}/`))
  if (!at.includes('/')) {
    const roots = current.roots.filter(id => id !== at)
    const removesSelection = current.at === at || current.at?.startsWith(`${at}/`)
    return removesSelection ? { ...current, open, roots, selected: null, at: null, focus: null } : { ...current, open, roots }
  }
  const parent = at.slice(0, at.lastIndexOf('/'))
  return selectOccurrence(parent, { ...current, open })
}
export function parseMapRoute(hash: string): MapRoute {
  const params = new URLSearchParams(hash.split('?')[1] ?? '')
  const root = nodeById.get(params.get('focus') ?? '')
  if (params.has('focus') && (root?.kind !== 'character' || !groupById.has(root.group))) return overviewRoute
  const roots = [...new Set([...params.getAll('branch'), ...(root ? [root.id] : [])])].filter(id => nodeById.get(id)?.kind === 'character')
  let base: MapRoute = { focus: root?.id ?? null, selected: root?.id ?? null, at: root?.id ?? null, open: [], roots }
  // Validate each expansion against a reachable parent; ignore malformed/cyclic URLs.
  for (const path of [...new Set(params.getAll('open'))].sort((a, b) => a.split('/').length - b.split('/').length)) {
    if (path.length > 1024) continue
    const parent = path.slice(0, path.lastIndexOf('/')), id = path.split('/').at(-1)!
    const selected = selectOccurrence(parent, base)
    if (selected.at === parent) base = expandCharacter(id, selected)
  }
  base = { ...base, focus: root?.id ?? null, selected: root?.id ?? null, at: root?.id ?? null }
  if (params.has('at')) return selectOccurrence(params.get('at')!, base)
  const selected = params.get('selected')
  const occurrence = unifiedTreeLayout(base.roots, base.open).nodes.find(node => node.node.id === selected)
  return occurrence ? selectOccurrence(occurrence.id, base) : base
}
export function mapHash(route: MapRoute): string {
  const params = new URLSearchParams()
  if (route.focus) params.set('focus', route.focus)
  for (const id of route.roots) params.append('branch', id)
  if (route.at && route.at !== route.focus) params.set('at', route.at)
  for (const path of route.open) params.append('open', path)
  return params.size ? `#map?${params.toString()}` : '#map'
}
export function isLegacyHash(hash: string) {
  return ['learn', 'practice', 'explore', 'detail', 'quiz', 'write', 'radicals', 'chars', 'breakdown'].includes(hash.replace(/^#/, '').split('?')[0])
}

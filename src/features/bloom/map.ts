export type MapNode = {
  id: string
  kind: 'character' | 'word'
  zh: string
  py: string
  th: string
  group: string
}
export type MapEdge = {
  source: string
  target: string
  kind: 'contains-character' | 'contains-component'
}
export type WordGraph = { nodes: MapNode[]; edges: MapEdge[] }

export function validateGraph(graph: WordGraph): string[] {
  const errors: string[] = []
  const nodes = new Map<string, MapNode>()
  for (const node of graph.nodes) {
    if (nodes.has(node.id)) errors.push(`Duplicate node: ${node.id}`)
    if (!node.id || !node.zh.trim() || !node.py.trim() || !node.th.trim()) {
      errors.push(`Missing reading or meaning: ${node.id}`)
    }
    nodes.set(node.id, node)
  }
  const edges = new Set<string>()
  for (const edge of graph.edges) {
    const source = nodes.get(edge.source), target = nodes.get(edge.target)
    const key = `${edge.kind}:${edge.source}:${edge.target}`
    if (edges.has(key)) errors.push(`Duplicate edge: ${key}`)
    edges.add(key)
    if (!source || !target) errors.push(`Dangling edge: ${key}`)
    else if (edge.kind === 'contains-character' && (
      source.kind !== 'character' || target.kind !== 'word' || !target.zh.includes(source.zh)
    )) errors.push(`Invalid character relationship: ${key}`)
    else if (edge.kind === 'contains-component' && (
      source.kind !== 'character' || target.kind !== 'character' || source.id === target.id
    )) errors.push(`Invalid component relationship: ${key}`)
  }
  return errors
}

export type FocusBox = { id: string; x: number; y: number; width: number; height: number }

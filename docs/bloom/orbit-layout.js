// Pure layout helpers shared by preview and verification. Coordinates are world CSS px.
export const boxSize = node => ({ width: node.hub ? 108 : Math.max(164, node.zh.length * 32 + 28), height: 118 })
export function overlaps(a, b, gap = 0) {
  return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y
}
export function arrangeOrbit(nodes) {
  const hubs = nodes.filter(n => n.hub)
  const placed = []
  hubs.forEach((hub, index) => {
    Object.assign(hub, boxSize(hub), { x: 850 + index % 3 * 2050, y: 850 + Math.floor(index / 3) * 1900 })
    placed.push(hub)
    const children = nodes.filter(n => n.parent === hub.zh && !n.hub)
    // One ring avoids lines passing through words on an inner ring.
    const radius = Math.max(290, children.length * 205 / (2 * Math.PI))
    children.forEach((node, i) => {
      const size = boxSize(node)
      let distance = radius, turn = 0, candidate
      do {
        const angle = -Math.PI / 2 + i * Math.PI * 2 / children.length + turn * .018
        candidate = { ...size, x: hub.x + 54 + Math.cos(angle) * distance - size.width / 2, y: hub.y + 59 + Math.sin(angle) * distance - size.height / 2 }
        turn++; if (turn % 12 === 0) distance += 30
      } while (placed.some(other => overlaps(candidate, other, 30)) && turn < 200)
      Object.assign(node, candidate); placed.push(node)
    })
  })
  // Any word whose parent isn't a hub stays near its actual parent.
  nodes.filter(n => !placed.includes(n)).forEach((node, i) => {
    Object.assign(node, boxSize(node), { x: 700 + i * 240, y: 6100 }); placed.push(node)
  })
  return { width: Math.max(...nodes.map(n => n.x + n.width)) + 100, height: Math.max(...nodes.map(n => n.y + n.height)) + 100 }
}
const center = n => ({ x: n.x + n.width / 2, y: n.y + n.height / 2 })
function inside(p, r, pad = 12) { return p.x > r.x - pad && p.x < r.x + r.width + pad && p.y > r.y - pad && p.y < r.y + r.height + pad }
function lineClear(a, b, obstacles) {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 8)
  for (let i = 0; i <= steps; i++) {
    const t = i / Math.max(1, steps), p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    if (obstacles.some(r => inside(p, r))) return false
  }
  return true
}
function boundary(node, toward) {
  const c = center(node), dx = toward.x - c.x, dy = toward.y - c.y
  const factor = 1 / Math.max(Math.abs(dx) / (node.width / 2), Math.abs(dy) / (node.height / 2), .001)
  return { x: c.x + dx * factor, y: c.y + dy * factor }
}
export function routeOrbitEdge(source, target, nodes) {
  const obstacles = nodes.filter(n => n !== source && n !== target)
  const a = center(source), b = center(target)
  // Visibility graph: obstacle corners allow the line to turn around unrelated cards.
  let points = [a, b]
  if (!lineClear(a, b, obstacles)) {
    const blockers = obstacles.filter(r => {
      const left = Math.min(a.x, b.x) - 300, right = Math.max(a.x, b.x) + 300
      const top = Math.min(a.y, b.y) - 300, bottom = Math.max(a.y, b.y) + 300
      return r.x < right && r.x + r.width > left && r.y < bottom && r.y + r.height > top
    })
    const vertices = [a, b, ...blockers.flatMap(r => [
      { x: r.x - 25, y: r.y - 25 }, { x: r.x + r.width + 25, y: r.y - 25 },
      { x: r.x - 25, y: r.y + r.height + 25 }, { x: r.x + r.width + 25, y: r.y + r.height + 25 },
    ])]
    const distances = vertices.map(() => Infinity), previous = [], visited = new Set()
    distances[0] = 0
    for (let step = 0; step < vertices.length; step++) {
      let current = -1
      for (let i = 0; i < vertices.length; i++) if (!visited.has(i) && (current === -1 || distances[i] < distances[current])) current = i
      if (current === -1 || distances[current] === Infinity || current === 1) break
      visited.add(current)
      vertices.forEach((v, i) => {
        if (visited.has(i) || !lineClear(vertices[current], v, obstacles)) return
        const next = distances[current] + Math.hypot(v.x - vertices[current].x, v.y - vertices[current].y)
        if (next < distances[i]) { distances[i] = next; previous[i] = current }
      })
    }
    if (distances[1] < Infinity) {
      const route = []; for (let i = 1; i !== undefined; i = previous[i]) route.unshift(vertices[i])
      points = route
    }
  }
  points[0] = boundary(source, points[1]); points[points.length - 1] = boundary(target, points[points.length - 2])
  // Rounded corners stay inside the 25px clearance reserved above.
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i], before = points[i - 1], after = points[i + 1]
    const l1 = Math.hypot(p.x - before.x, p.y - before.y), l2 = Math.hypot(after.x - p.x, after.y - p.y), r = Math.min(14, l1 / 3, l2 / 3)
    d += ` L${p.x + (before.x - p.x) * r / l1},${p.y + (before.y - p.y) * r / l1} Q${p.x},${p.y} ${p.x + (after.x - p.x) * r / l2},${p.y + (after.y - p.y) * r / l2}`
  }
  const end = points[points.length - 1]; d += ` L${end.x},${end.y}`
  return { d, clear: points.slice(1).every((p, i) => lineClear(points[i], p, obstacles)) }
}

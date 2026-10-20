import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import type { unifiedTreeLayout } from './tree'
import { readingPose, zoomAt, MIN_MAP_SCALE, MAX_MAP_SCALE } from './camera'
import { routeMapEdge } from './edgeRouting'
import { collectionId } from './tree'
import { bloomGroups } from './catalog'
import type { CSSProperties } from 'react'

type Pose = { x: number; y: number; scale: number }
const homePose = (): Pose => ({ x: 0, y: 0, scale: 1 })

export function FocusMap({ tree, selectedId, onSelect, detailVisible = false }: {
  tree: ReturnType<typeof unifiedTreeLayout>; selectedId: string; onSelect: (id: string) => void; detailVisible?: boolean
}) {
  const edges = useMemo(() => { const byId = new Map(tree.nodes.map(box => [box.id, box])); return tree.nodes.filter(box => box.parent).map(box => ({ box, route: routeMapEdge(byId.get(box.parent!)!, box, tree.nodes) })) }, [tree])
  const viewport = useRef<HTMLDivElement>(null), world = useRef<HTMLDivElement>(null)
  const zoomOutButton = useRef<HTMLButtonElement>(null), zoomInButton = useRef<HTMLButtonElement>(null)
  const zoomLabel = useRef<HTMLOutputElement>(null), pose = useRef(homePose())
  const frame = useRef<number | null>(null), suppressClick = useRef(false)
  const clickTimer = useRef<ReturnType<typeof setTimeout>>()
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const drag = useRef<{ id: number; x: number; y: number; pose: Pose } | null>(null)
  const pinch = useRef<{ distance: number; x: number; y: number; pose: Pose } | null>(null)
  const [width, setWidth] = useState(320)
  const [screenWidth, setScreenWidth] = useState(320)
  const fitRef = useRef(1)
  const height = screenWidth >= 701 ? 620 : tree.nodes.length === 5 ? 280 : 460
  const selectedRef = useRef(selectedId)
  selectedRef.current = selectedId
  const treeRef = useRef(tree)
  treeRef.current = tree
  const paint = useCallback(() => {
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      const next = pose.current
      if (world.current) world.current.style.transform = `translate(${next.x}px, ${next.y}px) scale(${next.scale * fitRef.current})`
      world.current?.style.setProperty('--map-scale', String(next.scale))
      viewport.current?.classList.toggle('is-zoomed', next.scale > 1.001)
      if (zoomOutButton.current) zoomOutButton.current.disabled = next.scale <= MIN_MAP_SCALE + .0001
      if (zoomInButton.current) zoomInButton.current.disabled = next.scale >= MAX_MAP_SCALE - .0001
      if (zoomLabel.current) zoomLabel.current.textContent = `${Math.round(next.scale * 100)}%`
    })
  }, [])

  const reset = useCallback(() => {
    viewport.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    const current = treeRef.current, rect = viewport.current?.getBoundingClientRect()
    if (!rect) return
    if (world.current) world.current.style.transition = 'none'
    const root = selectedRef.current.split('/')[0]
    const scope = selectedRef.current === collectionId ? current.nodes : current.nodes.filter(box => box.id === root || box.id.startsWith(`${root}/`))
    const left = Math.min(...scope.map(box => box.x)) - 28, top = Math.min(...scope.map(box => box.y)) - 28
    const scopeWidth = Math.max(...scope.map(box => box.x + box.width)) - left + 28, scopeHeight = Math.max(...scope.map(box => box.y + box.height)) - top + 28
    const scale = Math.max(MIN_MAP_SCALE, Math.min(1, (rect.width - 24) / scopeWidth, (rect.height - 104) / scopeHeight))
    pose.current = { scale, x: (rect.width - scopeWidth * scale) / 2 - left * scale, y: (rect.height - 80 - scopeHeight * scale) / 2 - top * scale }
    paint()
  }, [paint])
  const moveTo = useCallback((next: Pose, smooth = true) => {
    if (world.current) world.current.style.transition = smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'transform 280ms ease-out' : 'none'
    pose.current = next
    if (!smooth && world.current) {
      world.current.style.transform = `translate(${next.x}px, ${next.y}px) scale(${next.scale})`
      world.current.getBoundingClientRect()
    }
    paint()
  }, [paint])
  const hasFocused = useRef(false)
  const focusSelected = useCallback(() => {
    const current = treeRef.current, box = current.nodes.find(node => node.id === selectedRef.current)
    const mobile = window.matchMedia('(max-width: 700px)').matches
    if (mobile) viewport.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    const rect = viewport.current?.getBoundingClientRect()
    if (!box || !rect) return
    if (box.node.kind === 'collection') { reset(); return }
    const scale = 1
    const reservedHeight = mobile ? 80 : 12
    const visibleHeight = Math.max(120, Math.min(rect.height - 80, window.innerHeight - rect.top - reservedHeight))
    const nearby = mobile && box.parent === collectionId ? current.nodes.find(child => child.parent === box.id && (Math.abs(child.x - box.x) + child.width) * scale <= rect.width - 8 && (Math.abs(child.y - box.y) + child.height) * scale <= visibleHeight - 8) : undefined
    const next = readingPose(current.nodes, nearby?.id ?? selectedRef.current, rect.width, visibleHeight, scale)
    if (next) moveTo(next, hasFocused.current)
    hasFocused.current = true
  }, [moveTo, reset, detailVisible])
  useEffect(() => {
    // The document may grow after the initial layout pass. Focus again after paint so
    // scrollIntoView can use the final page height, including the detail panel.
    const frame = requestAnimationFrame(() => { if (selectedId !== collectionId) focusSelected() })
    return () => cancelAnimationFrame(frame)
  }, [selectedId, width, height, focusSelected])
  const zoom = useCallback((factor: number, x?: number, y?: number) => {
    const rect = viewport.current?.getBoundingClientRect()
    if (!rect) return
    if (world.current) world.current.style.transition = 'none'
    const cx = x ?? rect.width / 2, cy = y ?? (rect.height - 80) / 2
    pose.current = zoomAt(pose.current, factor, cx, cy)
    paint()
  }, [paint])

  useLayoutEffect(() => {
    const element = viewport.current
    if (!element) return
    const measure = () => { setWidth(Math.max(1, element.getBoundingClientRect().width)); setScreenWidth(element.ownerDocument.documentElement.clientWidth) }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useLayoutEffect(() => {
    if (selectedRef.current === collectionId) reset()
    else {
      if (window.matchMedia('(max-width: 700px)').matches) viewport.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
      focusSelected()
    }
  }, [width, height, focusSelected, reset])
  const previousTree = useRef(tree)
  useLayoutEffect(() => {
    const previous = previousTree.current
    previousTree.current = tree
    const anchorId = selectedId === collectionId ? collectionId : selectedId.split('/')[0]
    const oldAnchor = previous.nodes.find(box => box.id === anchorId) ?? previous.nodes.find(box => box.id === collectionId), anchor = tree.nodes.find(box => box.id === anchorId) ?? tree.nodes.find(box => box.id === collectionId)
    if (anchor && oldAnchor && tree !== previous) {
      // Bounds may grow left/up; compensate so every existing node stays in place on screen.
      moveTo({ ...pose.current, x: pose.current.x - (anchor.x - oldAnchor.x) * pose.current.scale, y: pose.current.y - (anchor.y - oldAnchor.y) * pose.current.scale }, false)
    }
    if (selectedId === collectionId) { reset(); return }
    focusSelected()
  }, [selectedId, tree, focusSelected, moveTo, reset])
  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      zoom(Math.exp(-event.deltaY * .0015), event.clientX - rect.left, event.clientY - rect.top)
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      element.removeEventListener('wheel', onWheel)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
      clearTimeout(clickTimer.current)
    }
  }, [zoom])

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (world.current) world.current.style.transition = 'none'
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (pointers.current.size === 0) suppressClick.current = false
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()], rect = event.currentTarget.getBoundingClientRect()
      pinch.current = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top, pose: { ...pose.current } }
      drag.current = null
    } else drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, pose: { ...pose.current } }
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const initialPinch = pinch.current
    if (pointers.current.size === 2 && initialPinch) {
      const [a, b] = [...pointers.current.values()], rect = event.currentTarget.getBoundingClientRect()
      const scale = Math.max(MIN_MAP_SCALE, Math.min(MAX_MAP_SCALE, initialPinch.pose.scale * Math.hypot(a.x - b.x, a.y - b.y) / initialPinch.distance))
      const ratio = scale / initialPinch.pose.scale
      pose.current = { scale, x: (a.x + b.x) / 2 - rect.left - (initialPinch.x - initialPinch.pose.x) * ratio, y: (a.y + b.y) / 2 - rect.top - (initialPinch.y - initialPinch.pose.y) * ratio }
      suppressClick.current = true
      paint()
      return
    }
    const start = drag.current
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x, dy = event.clientY - start.y
    if (Math.hypot(dx, dy) <= 6 && !suppressClick.current) return
    suppressClick.current = true
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId)
    pose.current = { ...start.pose, x: start.pose.x + dx, y: start.pose.y + dy }
    paint()
  }
  function pointerEnd(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    pinch.current = null
    const remaining = [...pointers.current.entries()][0]
    drag.current = remaining ? { id: remaining[0], ...remaining[1], pose: { ...pose.current } } : null
    if (!remaining) clickTimer.current = setTimeout(() => { suppressClick.current = false }, 0)
  }

  return <div className="bl-graph" data-overview={tree.nodes.length === 5} data-layout={width >= 620 ? 'desktop' : 'mobile'}>
    <div className="bl-map-tools"><span>ลากเพื่อเลื่อน · แตะคำเพื่อฟังและแตกกิ่ง</span><div>
      <button ref={zoomOutButton} type="button" aria-label="ซูมออก" onClick={() => zoom(1 / 1.2)}>−</button><button type="button" aria-label="กลับขนาด 100 เปอร์เซ็นต์" onClick={() => zoom(1 / pose.current.scale)}><output ref={zoomLabel} aria-label="ระดับซูม">100%</output></button>
      <button ref={zoomInButton} type="button" aria-label="ซูมเข้า" onClick={() => zoom(1.2)}>+</button><button type="button" aria-label="จัดแผนที่ให้พอดีจอ" onClick={reset} title="จัดกิ่งที่เลือกให้อยู่กลาง">จัดกลางกิ่ง</button><button type="button" aria-label="กลับมาคำที่เลือก" title="กลับมาคำที่เลือก" onClick={focusSelected}>กลับคำที่เลือก</button>
    </div></div>
    <div ref={viewport} className="bl-map-viewport" style={{ height }}
      tabIndex={0} role="region" aria-label="แผนที่คำ ลากเพื่อเลื่อน ใช้ปุ่มบวกหรือลบเพื่อซูม"
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd}
      onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation() } }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return
        if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(1.2) }
        if (event.key === '-') { event.preventDefault(); zoom(1 / 1.2) }
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); pose.current = { ...pose.current, x: pose.current.x + (event.key === 'ArrowLeft' ? 60 : event.key === 'ArrowRight' ? -60 : 0), y: pose.current.y + (event.key === 'ArrowUp' ? 60 : event.key === 'ArrowDown' ? -60 : 0) }; paint() }
        if (event.key === 'Home') { event.preventDefault(); reset() }
      }}>
      <div ref={world} className="bl-map-world" style={{ width: tree.width, height: tree.height }}>
        <svg width={tree.width} height={tree.height} aria-hidden="true" className="bl-map-lines">
          {edges.map(({ box, route }) => <path key={box.id} className={`${box.parent === collectionId ? 'is-grouping' : ''} ${selectedId === box.id || selectedId.startsWith(`${box.id}/`) ? 'is-selected' : ''}`} d={route.d} />)}
        </svg>
        {tree.nodes.map(box => <button key={box.id} type="button" className={`bl-map-node ${box.node.kind === 'character' ? 'is-root' : ''} ${box.node.kind === 'collection' ? 'is-collection' : ''} ${selectedId === box.id ? 'is-selected' : ''}`}
          style={{ left: box.x, top: box.y, width: box.width, height: box.height, '--bl-group': bloomGroups.find(group => group.id === box.node.group)?.color, '--bl-group-soft': bloomGroups.find(group => group.id === box.node.group)?.soft } as CSSProperties} aria-pressed={selectedId === box.id}
          aria-label={`${box.node.kind === 'collection' ? 'ภาพรวมต้นไม้' : box.node.kind === 'word' ? 'คำ' : 'ตัวอักษร'} ${box.node.zh} ${box.node.py} ${box.node.th}`}
          onFocus={event => { if (event.currentTarget.matches(':focus-visible')) { const rect = viewport.current?.getBoundingClientRect(); if (rect) { const scale = Math.max(.95, pose.current.scale); pose.current = { scale, x: rect.width / 2 - (box.x + box.width / 2) * scale, y: rect.height / 2 - (box.y + box.height / 2) * scale }; paint() } } }} onClick={() => onSelect(box.id)}>
          <span className={box.node.kind === 'collection' ? 'bl-collection-label' : 'bl-han'} lang={box.node.kind === 'collection' ? 'th' : 'zh-Hans'}>{box.node.zh}</span><span className="bl-pinyin">{box.node.py}</span><span className="bl-meaning">{box.node.th.split(' / ')[0]}</span>{box.node.kind !== 'collection' ? <small className="bl-node-hint">{box.node.kind === 'word' ? 'ดูคำ · ฟังเสียง ↗' : box.parent !== collectionId || tree.nodes.some(child => child.parent === box.id) ? 'ดูรายละเอียด · ฟังเสียง ↗' : 'เปิดคำที่มีตัวนี้ ↗'}</small> : null}
        </button>)}
      </div>

    </div>

  </div>
}

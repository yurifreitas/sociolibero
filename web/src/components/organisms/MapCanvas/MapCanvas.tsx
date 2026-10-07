import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { BASE, hitTest, type FillPlan, type MapGeometry } from '@/features/map/geometry'
import styles from './MapCanvas.module.css'

export type MapCanvasProps = {
  geometry: MapGeometry
  plan: FillPlan
  selected: number
  onSelect: (idx: number) => void
  renderTooltip: (idx: number) => ReactNode
  ariaLabel: string
  /** enquadra a vista numa caixa (coordenadas de mundo); `key` muda → reenquadra. null volta ao Brasil */
  focus?: { key: string; bbox: readonly [number, number, number, number] } | null
}

type View = { scale: number; tx: number; ty: number }
const MAX_ZOOM = 80
const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

export function MapCanvas({ geometry, plan, selected, onSelect, renderTooltip, ariaLabel, focus }: MapCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const composed = useRef<{ view: View; version: number } | null>(null)
  const view = useRef<View>({ scale: 1, tx: 0, ty: 0 })
  const size = useRef({ w: 0, h: 0, dpr: 1, fit: 1 })
  const touched = useRef(false)
  const raf = useRef(0)
  const planRef = useRef(plan)
  const selRef = useRef(selected)
  const hoverRef = useRef(-1)
  const ink = useRef({ stroke: '', text: '', brand: '' })
  const snap = useRef<{ canvas: HTMLCanvasElement | null; view: View | null; dirty: boolean; version: number }>({ canvas: null, view: null, dirty: true, version: 0 })
  const lastGesture = useRef(0)
  const idleTimer = useRef(0)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef({ moved: 0, startX: 0, startY: 0, pinch: 0 })
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null)

  /** Render vetorial completo (≈14 ms) num canvas offscreen; só roda quando a vista parou. */
  const renderFull = useCallback(() => {
    const { w, h, dpr } = size.current
    const sc = (snap.current.canvas ??= document.createElement('canvas'))
    const pw = Math.max(1, Math.round(w * dpr))
    const ph = Math.max(1, Math.round(h * dpr))
    if (sc.width !== pw || sc.height !== ph) {
      sc.width = pw
      sc.height = ph
    }
    const ctx = sc.getContext('2d')
    if (!ctx) return
    const { scale, tx, ty } = view.current
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, sc.width, sc.height)
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * tx, dpr * ty)
    const p = planRef.current
    // municípios cujo bbox cruza a janela (em coordenadas de mundo)
    const vx0 = -tx / scale
    const vy0 = -ty / scale
    const vx1 = (w - tx) / scale
    const vy1 = (h - ty) / scale
    const vis: number[] = []
    for (let i = 0; i < geometry.features.length; i++) {
      const b = (geometry.features[i] as { bbox: readonly [number, number, number, number] }).bbox
      if (b[2] >= vx0 && b[0] <= vx1 && b[3] >= vy0 && b[1] <= vy1) vis.push(i)
    }
    ctx.lineWidth = 0.35 / scale
    ctx.strokeStyle = ink.current.stroke
    if (vis.length > geometry.features.length * 0.5) {
      // visão ampla: 257 preenchimentos por cor + um único traço
      for (let b = 0; b < p.bins.length; b++) {
        ctx.fillStyle = p.colors[b] as string
        ctx.fill(p.bins[b] as Path2D, 'evenodd')
      }
      ctx.stroke(geometry.strokeAll)
    } else {
      // com zoom: só os visíveis, agrupados por cor; evita rasterizar milhares de polígonos fora da tela
      vis.sort((a, b) => (p.featureBin[a] as number) - (p.featureBin[b] as number))
      const outline = new Path2D()
      let cur = -1
      for (const i of vis) {
        const f = geometry.features[i] as { path: Path2D }
        const bin = p.featureBin[i] as number
        if (bin !== cur) {
          ctx.fillStyle = p.colors[bin] as string
          cur = bin
        }
        ctx.fill(f.path, 'evenodd')
        outline.addPath(f.path)
      }
      ctx.stroke(outline)
    }
    if (p.hatch) {
      // hachura diagonal só onde não há valor (RS sem índice): o cinza liso poderia ser lido como “baixo”
      ctx.save()
      ctx.clip(p.hatch, 'evenodd')
      ctx.strokeStyle = ink.current.text
      ctx.globalAlpha = 0.55
      ctx.lineWidth = 0.7 / scale
      const step = 4.5 / scale
      ctx.beginPath()
      for (let x = vx0 - (vy1 - vy0); x < vx1; x += step) {
        ctx.moveTo(x, vy1)
        ctx.lineTo(x + (vy1 - vy0), vy0)
      }
      ctx.stroke()
      ctx.restore()
    }
    snap.current.view = { ...view.current }
    snap.current.dirty = false
    snap.current.version++
  }, [geometry])

  /** Compõe o snapshot (com a transformação delta durante gestos) + contornos de hover/seleção. */
  const draw = useCallback(() => {
    raf.current = 0
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    const { dpr } = size.current
    const v = view.current
    const sv = snap.current.view
    const same = !!sv && sv.scale === v.scale && sv.tx === v.tx && sv.ty === v.ty
    const interacting = performance.now() - lastGesture.current < 130
    if (snap.current.dirty || !sv || (!same && !interacting)) renderFull()
    else if (!same) {
      // gesto em andamento: reaproveita o snapshot e agenda o render nítido para quando parar
      window.clearTimeout(idleTimer.current)
      idleTimer.current = window.setTimeout(() => requestDrawRef.current(), 150)
    }
    const base = snap.current.view as View
    // camada de dados: só recompõe quando a vista ou o snapshot mudaram (hover não toca aqui)
    const cv = composed.current
    if (!cv || cv.version !== snap.current.version || cv.view.scale !== v.scale || cv.view.tx !== v.tx || cv.view.ty !== v.ty) {
      const k = v.scale / base.scale
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.setTransform(k, 0, 0, k, dpr * (v.tx - base.tx * k), dpr * (v.ty - base.ty * k))
      if (snap.current.canvas) ctx.drawImage(snap.current.canvas, 0, 0)
      composed.current = { view: { ...v }, version: snap.current.version }
    }
    // camada de overlay: contornos de hover/seleção (barata)
    const oc = overlayRef.current
    const octx = oc?.getContext('2d')
    if (!oc || !octx) return
    octx.setTransform(1, 0, 0, 1, 0, 0)
    octx.clearRect(0, 0, oc.width, oc.height)
    octx.setTransform(dpr * v.scale, 0, 0, dpr * v.scale, dpr * v.tx, dpr * v.ty)
    const mark = (idx: number, color: string, w: number) => {
      const f = geometry.features[idx]
      if (!f) return
      octx.lineWidth = w / v.scale
      octx.strokeStyle = color
      octx.stroke(f.path)
    }
    if (hoverRef.current >= 0 && hoverRef.current !== selRef.current) mark(hoverRef.current, ink.current.text, 1.4)
    if (selRef.current >= 0) mark(selRef.current, ink.current.brand, 2.2)
  }, [geometry, renderFull])

  const requestDrawRef = useRef<() => void>(() => {})
  const requestDraw = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(draw)
  }, [draw])
  requestDrawRef.current = requestDraw
  const markGesture = () => {
    lastGesture.current = performance.now()
  }

  const fitView = useCallback(() => {
    const { w, h } = size.current
    const fit = (Math.min(w, h) / BASE) * 0.98
    size.current.fit = fit
    view.current = { scale: fit, tx: (w - BASE * fit) / 2, ty: (h - BASE * fit) / 2 }
    touched.current = false
  }, [])

  const clampView = (v: View, w: number, h: number): View => {
    const sw = BASE * v.scale
    return {
      scale: v.scale,
      tx: Math.min(w * 0.85, Math.max(-sw + w * 0.15, v.tx)),
      ty: Math.min(h * 0.85, Math.max(-sw + h * 0.15, v.ty)),
    }
  }

  const zoomAt = useCallback(
    (factor: number, px: number, py: number) => {
      const { fit, w, h } = size.current
      const v = view.current
      const next = Math.min(fit * MAX_ZOOM, Math.max(fit, v.scale * factor))
      const k = next / v.scale
      view.current = clampView({ scale: next, tx: px - (px - v.tx) * k, ty: py - (py - v.ty) * k }, w, h)
      touched.current = true
      lastGesture.current = performance.now()
      requestDraw()
    },
    [requestDraw],
  )

  // dimensionamento (ResizeObserver) + DPR
  useEffect(() => {
    const wrap = wrapRef.current
    const c = canvasRef.current
    if (!wrap || !c) return
    const apply = () => {
      const r = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      size.current = { ...size.current, w: r.width, h: r.height, dpr }
      c.width = Math.max(1, Math.round(r.width * dpr))
      c.height = Math.max(1, Math.round(r.height * dpr))
      snap.current.dirty = true
      composed.current = null
      if (overlayRef.current) {
        overlayRef.current.width = c.width
        overlayRef.current.height = c.height
      }
      if (!touched.current) fitView()
      else view.current = clampView(view.current, r.width, r.height)
      requestDraw()
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(wrap)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf.current)
      window.clearTimeout(idleTimer.current)
      raf.current = 0
    }
  }, [fitView, requestDraw])

  // wheel precisa ser não-passivo para impedir o scroll da página
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = c.getBoundingClientRect()
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), e.clientX - r.left, e.clientY - r.top)
    }
    c.addEventListener('wheel', onWheel, { passive: false })
    return () => c.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  // enquadramento (ex.: camada do RS): reenquadra quando a chave muda; sem foco, volta ao Brasil inteiro
  const focusKey = focus?.key ?? ''
  useEffect(() => {
    const { w, h } = size.current
    if (!w || !h) return
    if (!focus) {
      if (touched.current) {
        fitView()
        snap.current.dirty = true
        composed.current = null
        requestDraw()
      }
      return
    }
    const [x0, y0, x1, y1] = focus.bbox
    const bw = Math.max(1, x1 - x0)
    const bh = Math.max(1, y1 - y0)
    const sc = Math.min(w / bw, h / bh) * 0.9
    const fit = size.current.fit
    const scale = Math.min(fit * MAX_ZOOM, Math.max(fit, sc))
    view.current = { scale, tx: w / 2 - ((x0 + x1) / 2) * scale, ty: h / 2 - ((y0 + y1) / 2) * scale }
    touched.current = true
    lastGesture.current = performance.now()
    snap.current.dirty = true
    composed.current = null
    requestDraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, requestDraw, fitView])
  // plano de cores / seleção mudaram → redesenha (e relê a tinta do tema)
  useEffect(() => {
    planRef.current = plan
    ink.current = { stroke: cssVar('--map-stroke'), text: cssVar('--text'), brand: cssVar('--brand') }
    snap.current.dirty = true
    requestDraw()
  }, [plan, requestDraw])
  useEffect(() => {
    selRef.current = selected
    requestDraw()
  }, [selected, requestDraw])

  const toWorld = (px: number, py: number) => {
    const v = view.current
    return [(px - v.tx) / v.scale, (py - v.ty) / v.scale] as const
  }
  const local = (e: PointerEvent | { clientX: number; clientY: number }) => {
    const r = canvasRef.current?.getBoundingClientRect()
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) }
  }

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    gesture.current = { moved: 0, startX: p.x, startY: p.y, pinch: 0 }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }]
      gesture.current.pinch = Math.hypot(a.x - b.x, a.y - b.y)
    }
  }

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const p = local(e)
    const prev = pointers.current.get(e.pointerId)
    if (prev) {
      if (pointers.current.size === 2) {
        pointers.current.set(e.pointerId, p)
        const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (gesture.current.pinch > 0) zoomAt(d / gesture.current.pinch, (a.x + b.x) / 2, (a.y + b.y) / 2)
        gesture.current.pinch = d
        gesture.current.moved = 99
        return
      }
      const dx = p.x - prev.x
      const dy = p.y - prev.y
      pointers.current.set(e.pointerId, p)
      gesture.current.moved += Math.abs(dx) + Math.abs(dy)
      if (gesture.current.moved > 4) {
        const { w, h } = size.current
        view.current = clampView({ ...view.current, tx: view.current.tx + dx, ty: view.current.ty + dy }, w, h)
        touched.current = true
        markGesture()
        if (hoverRef.current !== -1) {
          hoverRef.current = -1
          setHover(null)
        }
        requestDraw()
      }
      return
    }
    const [wx, wy] = toWorld(p.x, p.y)
    const idx = hitTest(geometry, wx, wy)
    if (idx !== hoverRef.current) {
      hoverRef.current = idx
      requestDraw()
    }
    setHover(idx >= 0 ? { idx, x: p.x, y: p.y } : null)
  }

  const onPointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    const had = pointers.current.delete(e.pointerId)
    if (had && pointers.current.size === 0 && gesture.current.moved <= 4) {
      const p = local(e)
      const [wx, wy] = toWorld(p.x, p.y)
      const idx = hitTest(geometry, wx, wy)
      onSelect(idx === selRef.current ? -1 : idx)
    }
  }

  const onPointerLeave = () => {
    if (pointers.current.size > 0) return
    hoverRef.current = -1
    setHover(null)
    requestDraw()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLCanvasElement>) => {
    const { w, h } = size.current
    const step = 60
    const pan = (dx: number, dy: number) => {
      view.current = clampView({ ...view.current, tx: view.current.tx + dx, ty: view.current.ty + dy }, w, h)
      touched.current = true
      markGesture()
      requestDraw()
    }
    switch (e.key) {
      case 'ArrowLeft': pan(step, 0); break
      case 'ArrowRight': pan(-step, 0); break
      case 'ArrowUp': pan(0, step); break
      case 'ArrowDown': pan(0, -step); break
      case '+': case '=': zoomAt(1.5, w / 2, h / 2); break
      case '-': case '_': zoomAt(1 / 1.5, w / 2, h / 2); break
      case '0': fitView(); requestDraw(); break
      case 'Escape': onSelect(-1); break
      default: return
    }
    e.preventDefault()
  }

  const tip = hover ? renderTooltip(hover.idx) : null
  const { w: cw } = size.current
  const flip = hover ? hover.x > cw * 0.6 : false

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        tabIndex={0}
        role="img"
        aria-label={`${ariaLabel}. Setas movem, + e − aproximam, 0 redefine, Esc limpa a seleção.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
        onDoubleClick={(e) => {
          const p = local(e)
          zoomAt(2, p.x, p.y)
        }}
        onKeyDown={onKeyDown}
      />
      <canvas ref={overlayRef} className={styles.overlay} aria-hidden="true" />
      <div className={styles.zoom} role="group" aria-label="Zoom do mapa">
        <Button variant="secondary" size="sm" aria-label="Aproximar" onClick={() => zoomAt(1.6, size.current.w / 2, size.current.h / 2)}>
          <Icon name="plus" size={16} />
        </Button>
        <Button variant="secondary" size="sm" aria-label="Afastar" onClick={() => zoomAt(1 / 1.6, size.current.w / 2, size.current.h / 2)}>
          <Icon name="minus" size={16} />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          aria-label="Redefinir visão"
          onClick={() => {
            fitView()
            requestDraw()
          }}
        >
          <Icon name="reset" size={16} />
        </Button>
      </div>
      {hover && tip && (
        <div
          className={styles.tip}
          style={{ left: hover.x, top: hover.y, transform: `translate(${flip ? 'calc(-100% - 14px)' : '14px'}, 14px)` }}
        >
          {tip}
        </div>
      )}
    </div>
  )
}

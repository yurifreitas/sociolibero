import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { ANO_MAX, ANO_MIN, EPOCAS, espectroLabel, parsePeriodo, REGIMES, TIPOS, anoDe } from '@/features/eleicoes/model'
import type { Eleicao, Movimento } from '@/features/eleicoes/schemas'
import { cn } from '@/lib/cn'
import styles from './ElectionTimeline.module.css'

export type TlSel = { kind: 'e' | 'm'; id: string } | null
const W = 1200
const M = { l: 14, r: 14 }
const ROW = 22
const NICE = [1, 2, 5, 10, 20, 25, 50, 100]
const RE_MARCO = /^(Decreto|Lei\b|EC \d|AI-\d|ADI|Constitui|Código|Pacote|Qualifica|Votantes|Emenda|Proposta)/i
export const isMarco = (e: Eleicao) => RE_MARCO.test(e.cargo) || /^(lei-|ec\d|cf-|ai2|estado-novo|pacote|adi|votantes|urna|diretas|constituicao|codigo|cortes)/.test(e.id)

const ESP_CLASS: Record<string, string> = { esquerda: styles.esq ?? '', centro: styles.cen ?? '', direita: styles.dir ?? '', transversal: styles.trv ?? '', 'n/a': styles.nda ?? '' }

type Pt = { id: string; e: Eleicao; yr: number; x: number }
type Bar = { id: string; m: Movimento; a: number; b: number; x0: number; x1: number; row: number }

function packRows<T extends { x0: number; x1: number }>(items: T[], gap: number): (T & { row: number })[] {
  const ends: number[] = []
  return [...items]
    .sort((p, q) => p.x0 - q.x0)
    .map((it) => {
      let r = ends.findIndex((e) => it.x0 > e + gap)
      if (r === -1) {
        r = ends.length
        ends.push(0)
      }
      ends[r] = it.x1
      return { ...it, row: r }
    })
}

export type ElectionTimelineProps = {
  eleicoes: Eleicao[]
  movimentos: Movimento[]
  selected: TlSel
  onSelect: (s: TlSel) => void
  /** preset de época (EPOCAS[].key) */
  epoca: string
  onEpoca: (k: string) => void
}

/**
 * Linha do tempo em faixas: regimes (convenção editorial), eleições e marcos de regra, movimentos coloridos por espectro.
 * Zoom e deslocamento: botões, setas/+/− com o gráfico focado, ou arrastando.
 */
export function ElectionTimeline({ eleicoes, movimentos, selected, onSelect, epoca, onEpoca }: ElectionTimelineProps) {
  const preset = EPOCAS.find((p) => p.key === epoca) ?? EPOCAS[0]!
  const [win, setWin] = useState<[number, number]>([preset.from, preset.to])
  useEffect(() => setWin([preset.from, preset.to]), [preset.from, preset.to])
  const [w0, w1] = win
  const span = w1 - w0
  const x = (yr: number) => M.l + ((yr - w0) / span) * (W - M.l - M.r)

  const clamp = (a: number, b: number): [number, number] => {
    const s = Math.min(Math.max(b - a, 4), ANO_MAX - ANO_MIN + 40)
    let lo = a
    let hi = a + s
    if (lo < ANO_MIN - 20) [lo, hi] = [ANO_MIN - 20, ANO_MIN - 20 + s]
    if (hi > ANO_MAX) [lo, hi] = [ANO_MAX - s, ANO_MAX]
    return [lo, hi]
  }
  const zoom = (f: number) => {
    const c = (w0 + w1) / 2
    const s = (w1 - w0) * f
    setWin(clamp(c - s / 2, c + s / 2))
  }
  const pan = (frac: number) => setWin(clamp(w0 + span * frac, w1 + span * frac))

  const pts: Pt[] = useMemo(() => eleicoes.map((e) => ({ id: e.id, e, yr: anoDe(e), x: 0 })), [eleicoes])
  const visibleE = useMemo(
    () => pts.filter((p) => p.yr >= w0 - 2 && p.yr <= w1 + 2).map((p) => ({ ...p, x: x(p.yr) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pts, w0, w1],
  )
  // rótulos: ano + cargo curto, só onde cabem (3 faixas); os outros ficam no tooltip
  const labels = useMemo(() => {
    const showCargo = span < 90
    const items = visibleE.map((p) => {
      const t = showCargo ? `${p.e.ano} · ${p.e.cargo.replace(/:.*$/, '').slice(0, 26)}` : String(p.e.ano)
      const w = t.length * 5.6 + 8
      return { p, t, x0: p.x - w / 2, x1: p.x + w / 2 }
    })
    const placed = packRows(items, 2).filter((r) => r.row < 3)
    return placed
  }, [visibleE, span])

  const bars: Bar[] = useMemo(
    () =>
      packRows(
        movimentos.flatMap((m) => {
          const r = parsePeriodo(m.periodo)
          if (!r) return []
          const x0 = x(r[0])
          const x1 = Math.max(x(r[1]), x0 + 8)
          if (x1 < 0 || x0 > W) return []
          return [{ id: m.id, m, a: r[0], b: r[1], x0, x1 }]
        }),
        4,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [movimentos, w0, w1],
  )
  const mRows = Math.max(1, ...bars.map((b) => b.row + 1))

  const step = NICE.find((n) => span / n <= 11) ?? 100
  const ticks: number[] = []
  for (let t = Math.ceil(w0 / step) * step; t <= w1; t += step) ticks.push(t)

  const yReg = 30
  const yE = 90
  const yM0 = yE + 3 * 18 + 44
  const H = yM0 + mRows * ROW + 30

  // arrastar para deslocar (clique curto ainda seleciona)
  const drag = useRef<{ x: number; w0: number; w1: number; moved: boolean } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    drag.current = { x: e.clientX, w0, w1, moved: false }
  }
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (!d || e.buttons === 0) return
    const width = svgRef.current?.getBoundingClientRect().width || W
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) > 4) {
      d.moved = true
      // captura só quando o arraste começa: capturar no clique retargetaria o `click` para o svg e quebraria a seleção
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
    if (!d.moved) return
    const dy = (dx / width) * (d.w1 - d.w0)
    setWin(clamp(d.w0 - dy, d.w1 - dy))
  }
  const onUp = () => {
    window.setTimeout(() => (drag.current = null), 0)
  }
  const select = (s: TlSel) => {
    if (drag.current?.moved) return
    onSelect(s)
  }
  const keyItem = (s: TlSel) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(s)
    }
  }
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return
    if (e.key === '+' || e.key === '=') zoom(0.7)
    else if (e.key === '-') zoom(1 / 0.7)
    else if (e.key === 'ArrowLeft') pan(-0.2)
    else if (e.key === 'ArrowRight') pan(0.2)
    else if (e.key === 'Home') onEpoca('tudo')
    else return
    e.preventDefault()
  }

  const shape = (p: Pt & { x: number }, on: boolean) => {
    const e = p.e
    const marco = isMarco(e)
    const r = on ? 7.5 : e.tipo === 'municipal' ? 4 : 5.5
    const cls = cn(styles.dot, marco && styles.marco, e.tipo === 'indireta' && styles.indireta, e.tipo === 'municipal' && styles.municipal, on && styles.dotOn)
    if (marco || e.tipo === 'indireta')
      return <path d={`M${p.x} ${yE - r - 1.5} L${p.x + r + 1.5} ${yE} L${p.x} ${yE + r + 1.5} L${p.x - r - 1.5} ${yE} Z`} className={cls} />
    if (e.tipo === 'constituinte') return <rect x={p.x - r} y={yE - r} width={r * 2} height={r * 2} rx={1.5} className={cls} />
    if (e.tipo === 'plebiscito') return <path d={`M${p.x} ${yE - r - 1} L${p.x + r + 1} ${yE + r} L${p.x - r - 1} ${yE + r} Z`} className={cls} />
    return <circle cx={p.x} cy={yE} r={r} className={cls} />
  }

  return (
    <figure className={cn('card', styles.fig)}>
      <div className={styles.toolbar} role="toolbar" aria-label="Zoom e época da linha do tempo">
        <div className={styles.presets} role="radiogroup" aria-label="Época">
          {EPOCAS.map((p) => (
            <button key={p.key} type="button" role="radio" aria-checked={p.key === epoca} className={cn(styles.preset, p.key === epoca && styles.presetOn)} onClick={() => onEpoca(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className={styles.zoom}>
          <Button size="sm" variant="ghost" onClick={() => pan(-0.25)} aria-label="Deslocar para o passado">←</Button>
          <Button size="sm" variant="ghost" onClick={() => zoom(1 / 0.6)} aria-label="Afastar (mostrar mais anos)"><Icon name="minus" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => zoom(0.6)} aria-label="Aproximar (mostrar menos anos)"><Icon name="plus" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => pan(0.25)} aria-label="Deslocar para o presente">→</Button>
          <span className={styles.win} aria-live="polite">{Math.round(w0)}–{Math.round(w1)}</span>
        </div>
      </div>

      <div className={styles.scroll} tabIndex={0} onKeyDown={onKey} aria-label="Linha do tempo de eleições e movimentos. Use + e −, setas e Home com o gráfico focado; Tab percorre os itens.">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={styles.svg}
          role="group"
          aria-label={`Linha do tempo de ${Math.round(w0)} a ${Math.round(w1)}: regimes, eleições e marcos de regra, movimentos`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <defs>
            <clipPath id="tl-clip"><rect x={M.l} y={0} width={W - M.l - M.r} height={H} /></clipPath>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={16} y2={H - 14} className={styles.grid} />
              <text x={x(t)} y={12} textAnchor="middle" className={styles.tick}>{t}</text>
            </g>
          ))}
          <g clipPath="url(#tl-clip)">
            <text x={M.l} y={yReg - 6} className={styles.lane}>Regimes (convenção editorial)</text>
            {REGIMES.map((r, i) => {
              const a = Math.max(x(r.from), M.l)
              const b = Math.min(x(r.to), W - M.r)
              if (b <= a) return null
              return (
                <g key={r.key}>
                  <rect x={a} y={yReg} width={b - a} height={26} rx={6} className={i % 2 ? styles.rgB : styles.rgA} />
                  {b - a > 60 && <text x={a + 8} y={yReg + 17} className={styles.rgText}>{r.label}</text>}
                </g>
              )
            })}

            <text x={M.l} y={yE - 22} className={styles.lane}>Eleições e marcos de regra</text>
            <line x1={M.l} x2={W - M.r} y1={yE} y2={yE} className={styles.axis} />
            {visibleE.map((p) => {
              const on = selected?.kind === 'e' && selected.id === p.id
              return (
                <g
                  key={p.id}
                  tabIndex={0}
                  role="button"
                  aria-pressed={on}
                  aria-label={`${p.e.ano}, ${p.e.cargo}${isMarco(p.e) ? ' (marco de regra)' : ''}, ${TIPOS.find((t) => t.key === p.e.tipo)?.label ?? p.e.tipo}`}
                  className={styles.item}
                  onClick={() => select({ kind: 'e', id: p.id })}
                  onKeyDown={keyItem({ kind: 'e', id: p.id })}
                >
                  <title>{`${p.e.ano} · ${p.e.cargo}`}</title>
                  {shape(p, on)}
                </g>
              )
            })}
            {labels.map(({ p, t, row }) => (
              <text key={`l${p.id}`} x={p.x} y={yE + 24 + row * 16} textAnchor="middle" className={cn(styles.lbl, selected?.id === p.id && styles.lblOn)}>{t}</text>
            ))}

            <text x={M.l} y={yM0 - 12} className={styles.lane}>Movimentos (cor = espectro, rótulo de convenção editorial)</text>
            {bars.map((b) => {
              const on = selected?.kind === 'm' && selected.id === b.id
              const wpx = b.x1 - b.x0
              const name = b.m.nome.replace(/\s*\(.*$/, '')
              const maxCh = Math.floor((wpx - 12) / 5.8)
              return (
                <g
                  key={b.id}
                  tabIndex={0}
                  role="button"
                  aria-pressed={on}
                  aria-label={`${b.m.nome}, ${b.m.periodo ?? ''}, espectro: ${espectroLabel(b.m.espectro)} (convenção editorial)`}
                  className={cn(styles.item, styles.bar, ESP_CLASS[b.m.espectro ?? 'n/a'] ?? styles.nda, on && styles.barOn)}
                  onClick={() => select({ kind: 'm', id: b.id })}
                  onKeyDown={keyItem({ kind: 'm', id: b.id })}
                >
                  <title>{`${b.m.nome} (${b.m.periodo ?? ''}) · ${espectroLabel(b.m.espectro)}`}</title>
                  <rect x={b.x0} y={yM0 + b.row * ROW} width={wpx} height={ROW - 5} rx={4} className={styles.barRect} />
                  {maxCh >= 6 && (
                    <text x={b.x0 + 6} y={yM0 + b.row * ROW + 12} className={styles.barText}>
                      {name.length > maxCh ? `${name.slice(0, maxCh - 1)}…` : name}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      <figcaption className={styles.cap}>
        <span><i className={cn(styles.sw, styles.swGeral)} /> geral</span>
        <span><i className={cn(styles.sw, styles.swIndireta)} /> indireta ou marco de regra</span>
        <span><i className={cn(styles.sw, styles.swMun)} /> municipal</span>
        <span className={styles.espLeg}>
          <i className={cn(styles.sw, styles.esq)} /> esquerda <i className={cn(styles.sw, styles.cen)} /> centro <i className={cn(styles.sw, styles.dir)} /> direita <i className={cn(styles.sw, styles.trv)} /> transversal <i className={cn(styles.sw, styles.nda)} /> sem posição
        </span>
        <span>O espectro é um rótulo editorial aplicado do mesmo jeito a todos; não é medição.</span>
      </figcaption>
    </figure>
  )
}

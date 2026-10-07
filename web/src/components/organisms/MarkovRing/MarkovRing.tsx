import { useId, useState } from 'react'
import { cn } from '@/lib/cn'
import styles from './MarkovRing.module.css'

export type MarkovRingProps = {
  estados: string[]
  P: number[][]
  /** duração esperada em anos por estado (opcional) */
  duracao?: (number | null)[]
  ariaLabel: string
  className?: string
}

const W = 560
const C = W / 2
const R = 176
const NR = 50
const COLORS = ['var(--neg)', 'var(--st-parcial)', 'var(--st-derivado)', 'var(--st-oficial)']
const SHORT = (s: string) => s.replace('autocracia', 'autocr.').replace('democracia', 'democr.')
/** espessura pela raiz da probabilidade: probabilidades pequenas continuam visíveis sem esmagar a diagonal */
const widthOf = (p: number) => 1.2 + 9 * Math.sqrt(Math.max(0, p))
const selfWidth = (p: number) => 1.6 + 3.4 * Math.max(0, p)

type Pt = { x: number; y: number }
const node = (k: number, n: number): Pt => {
  const a = -Math.PI / 2 + (k * 2 * Math.PI) / n
  return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) }
}
const unit = (a: Pt, b: Pt): Pt => {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1
  return { x: (b.x - a.x) / d, y: (b.y - a.y) / d }
}

/** Cadeia de Markov desenhada em anel: nós = estados de regime; espessura da seta = probabilidade anual de transição. */
export function MarkovRing({ estados, P, duracao, ariaLabel, className }: MarkovRingProps) {
  const uid = useId().replace(/:/g, '')
  const [focus, setFocus] = useState<number | null>(null)
  const n = estados.length
  const pts = estados.map((_, k) => node(k, n))

  const edges: { i: number; j: number; p: number; d: string; lx: number; ly: number; self: boolean }[] = []
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const p = P[i]?.[j] ?? 0
      if (p < 0.002) continue
      const a = pts[i] as Pt
      const b = pts[j] as Pt
      if (i === j) {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n
        const s = { x: a.x + NR * Math.cos(ang - 0.5), y: a.y + NR * Math.sin(ang - 0.5) }
        const e = { x: a.x + (NR + 6) * Math.cos(ang + 0.5), y: a.y + (NR + 6) * Math.sin(ang + 0.5) }
        const c1 = { x: a.x + (NR + 64) * Math.cos(ang - 0.42), y: a.y + (NR + 64) * Math.sin(ang - 0.42) }
        const c2 = { x: a.x + (NR + 64) * Math.cos(ang + 0.42), y: a.y + (NR + 64) * Math.sin(ang + 0.42) }
        edges.push({ i, j, p, d: `M${s.x},${s.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${e.x},${e.y}`, lx: a.x + (NR + 56) * Math.cos(ang), ly: a.y + (NR + 56) * Math.sin(ang), self: true })
      } else {
        const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const u = unit(a, b)
        const dist = Math.hypot(b.x - a.x, b.y - a.y)
        const bend = dist * 0.26
        const ctrl = { x: m.x - u.y * bend, y: m.y + u.x * bend }
        const s0 = unit(a, ctrl)
        const e0 = unit(b, ctrl)
        const s = { x: a.x + s0.x * NR, y: a.y + s0.y * NR }
        const e = { x: b.x + e0.x * (NR + 7), y: b.y + e0.y * (NR + 7) }
        edges.push({ i, j, p, d: `M${s.x},${s.y} Q${ctrl.x},${ctrl.y} ${e.x},${e.y}`, lx: 0.25 * s.x + 0.5 * ctrl.x + 0.25 * e.x, ly: 0.25 * s.y + 0.5 * ctrl.y + 0.25 * e.y, self: false })
      }
    }

  const active = (i: number) => focus == null || focus === i
  return (
    <figure className={cn(styles.fig, className)}>
      <svg viewBox={`0 0 ${W} ${W}`} role="img" aria-label={ariaLabel} className={styles.svg}>
        <defs>
          {COLORS.map((c, k) => (
            <marker key={k} id={`${uid}-a${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" fill={c} />
            </marker>
          ))}
        </defs>
        {edges.map((e) => (
          <g key={`${e.i}-${e.j}`} style={{ color: COLORS[e.i % COLORS.length] }} className={cn(styles.edge, !active(e.i) && styles.dim)}>
            <path d={e.d} fill="none" stroke="currentColor" strokeWidth={e.self ? selfWidth(e.p) : widthOf(e.p)} strokeLinecap="round" opacity={0.28 + 0.72 * Math.min(1, Math.sqrt(e.p) * 1.4)} markerEnd={`url(#${uid}-a${e.i % COLORS.length})`}>
              <title>{`${estados[e.i]} → ${estados[e.j]}: ${(e.p * 100).toFixed(1).replace('.', ',')}% ao ano`}</title>
            </path>
            {e.p >= 0.006 && (
              <text x={e.lx} y={e.ly} className={styles.plabel} textAnchor="middle" dominantBaseline="central">
                {e.p >= 0.1 ? Math.round(e.p * 100) : (e.p * 100).toFixed(1).replace('.', ',')}%
              </text>
            )}
          </g>
        ))}
        {estados.map((s, k) => {
          const p = pts[k] as Pt
          return (
            <g
              key={s}
              tabIndex={0}
              className={cn(styles.node, !active(k) && styles.dim)}
              style={{ color: COLORS[k % COLORS.length] }}
              onMouseEnter={() => setFocus(k)}
              onMouseLeave={() => setFocus(null)}
              onFocus={() => setFocus(k)}
              onBlur={() => setFocus(null)}
              aria-label={`${s}. ${P[k]?.map((v, j) => `${(v * 100).toFixed(1).replace('.', ',')}% para ${estados[j]}`).join('; ')}`}
            >
              <circle cx={p.x} cy={p.y} r={NR} className={styles.disc} />
              <text x={p.x} y={p.y - (duracao?.[k] != null ? 6 : 0)} textAnchor="middle" className={styles.name}>
                {SHORT(s)
                  .split(' ')
                  .map((w, i) => (
                    <tspan key={w} x={p.x} dy={i === 0 ? '-0.2em' : '1.15em'}>
                      {w}
                    </tspan>
                  ))}
              </text>
              {duracao?.[k] != null && (
                <text x={p.x} y={p.y + 30} textAnchor="middle" className={styles.dur}>
                  ~{Math.round(duracao[k] as number)} anos
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <figcaption className={styles.cap}>Espessura da seta ∝ √probabilidade anual. Rótulos só acima de 0,6%. Passe o mouse ou foque um estado para isolar suas saídas.</figcaption>
    </figure>
  )
}

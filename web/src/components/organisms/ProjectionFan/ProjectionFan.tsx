import { useId } from 'react'
import styles from './ProjectionFan.module.css'

export type FanData = {
  anos: number[]
  p10?: number[][] | null
  p50?: number[][] | null
  p90?: number[][] | null
  ponto?: number[][] | null
}
export type ProjectionFanProps = {
  fan: FanData
  /** índice do estado */
  state: number
  stateLabel: string
  title: string
  subtitle?: string
  color?: string
}

const W = 520
const H = 250
const M = { l: 44, r: 64, t: 18, b: 30 }

/** Leque de projeção: mediana e faixa p10–p90 (incerteza de PARÂMETRO, não de choques) para a probabilidade de um estado. */
export function ProjectionFan({ fan, state, stateLabel, title, subtitle, color = 'var(--brand)' }: ProjectionFanProps) {
  const uid = useId().replace(/:/g, '')
  const take = (m?: number[][] | null) => (m ? m.map((r) => r[state] as number) : null)
  const p10 = take(fan.p10)
  const p90 = take(fan.p90)
  const mid = take(fan.p50) ?? take(fan.ponto)
  const xs = fan.anos
  if (!mid || xs.length === 0) return null
  const x = (i: number) => M.l + (i / (xs.length - 1)) * (W - M.l - M.r)
  const y = (v: number) => M.t + (1 - v) * (H - M.t - M.b)
  const line = (a: number[]) => a.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const band = p10 && p90 ? `${line(p90)}${[...p10].reverse().map((v, i) => `L${x(xs.length - 1 - i).toFixed(1)},${y(v).toFixed(1)}`).join('')}Z` : null
  const last = mid.length - 1
  const fmt = (v: number) => `${Math.round(v * 100)}%`
  const ticks = [0, 0.25, 0.5, 0.75, 1]
  return (
    <figure className={styles.fig}>
      <figcaption className={styles.head}>
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-labelledby={`${uid}-t`} style={{ color }}>
        <title id={`${uid}-t`}>{`${title}: probabilidade de ${stateLabel}. ${xs[0]}: ${fmt(mid[0] as number)}; ${xs[last]}: ${fmt(mid[last] as number)}${p10 && p90 ? ` (p10–p90 ${fmt(p10[last] as number)}–${fmt(p90[last] as number)})` : ''}.`}</title>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={M.l - 8} y={y(t)} textAnchor="end" dominantBaseline="central" className={styles.tick}>{Math.round(t * 100)}%</text>
          </g>
        ))}
        {xs.map((a, i) => (i % 3 === 0 || i === xs.length - 1 ? <text key={a} x={x(i)} y={H - 8} textAnchor="middle" className={styles.tick}>{a}</text> : null))}
        {band && <path d={band} fill="currentColor" opacity=".16" />}
        {p10 && <path d={line(p10)} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity=".55" />}
        {p90 && <path d={line(p90)} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity=".55" />}
        <path d={line(mid)} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(last)} cy={y(mid[last] as number)} r="4" fill="currentColor" />
        <text x={x(last) + 9} y={y(mid[last] as number)} dominantBaseline="central" className={styles.end}>{fmt(mid[last] as number)}</text>
        {p90 && <text x={x(last) + 9} y={y(p90[last] as number) - 2} className={styles.endSm}>{fmt(p90[last] as number)}</text>}
        {p10 && <text x={x(last) + 9} y={y(p10[last] as number) + 12} className={styles.endSm}>{fmt(p10[last] as number)}</text>}
      </svg>
      <details className={styles.det}>
        <summary>Tabela equivalente</summary>
        <table className={styles.tbl}>
          <thead><tr><th scope="col">Ano</th><th scope="col">{p10 ? 'p10' : ''}</th><th scope="col">{fan.p50 ? 'p50' : 'ponto'}</th><th scope="col">{p90 ? 'p90' : ''}</th></tr></thead>
          <tbody>
            {xs.map((a, i) => (
              <tr key={a}><th scope="row">{a}</th><td>{p10 ? fmt(p10[i] as number) : ''}</td><td>{fmt(mid[i] as number)}</td><td>{p90 ? fmt(p90[i] as number) : ''}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

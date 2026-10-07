import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import styles from './BandChart.module.css'

export type BandPoint = { x: number; obs?: number | null; p50?: number | null; sim?: [number, number] | null; cal?: [number, number] | null }
export type BandChartProps = {
  title: string
  subtitle?: string
  points: BandPoint[]
  fmt: (v: number) => string
  summary: string
  /** nome da unidade, para a tabela equivalente */
  unit: string
}

const H = 320
const M = { l: 56, r: 16, t: 16, b: 34 }

/**
 * Observado (ponto cheio) + projeção central (linha tracejada) + duas faixas p10–p90:
 * a simulada (estreita, só incerteza dos parâmetros) e a calibrada (soma o erro da validação retrospectiva).
 * A estreita sozinha cobriu só uma fração dos casos reais, por isso a larga é a que deve ser lida.
 */
export function BandChart({ title, subtitle, points, fmt, summary, unit }: BandChartProps) {
  const box = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(760)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(Math.max(320, Math.round(el.clientWidth))))
    ro.observe(el)
    setW(Math.max(320, Math.round(el.clientWidth)))
    return () => ro.disconnect()
  }, [])
  const xs = points.map((p) => p.x)
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const vals = points.flatMap((p) => [p.obs, p.p50, ...(p.sim ?? []), ...(p.cal ?? [])]).filter((v): v is number => v != null)
  const lo = Math.min(...vals) * 0.9
  const hi = Math.max(...vals) * 1.05
  const X = (x: number) => M.l + ((x - x0) / Math.max(1, x1 - x0)) * (W - M.l - M.r)
  const Y = (v: number) => M.t + (1 - (v - lo) / (hi - lo)) * (H - M.t - M.b)
  const band = (k: 'sim' | 'cal') => {
    const ps = points.filter((p) => p[k])
    if (ps.length < 2) return ''
    const up = ps.map((p) => `${X(p.x)},${Y((p[k] as [number, number])[1])}`)
    const dn = [...ps].reverse().map((p) => `${X(p.x)},${Y((p[k] as [number, number])[0])}`)
    return `M${up.join('L')}L${dn.join('L')}Z`
  }
  const line = (k: 'obs' | 'p50') => points.filter((p) => p[k] != null).map((p, i) => `${i ? 'L' : 'M'}${X(p.x)},${Y(p[k] as number)}`).join('')
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4)
  const xt = points.filter((_, i) => i % Math.ceil(points.length / 8) === 0)
  return (
    <figure className={cn('card', styles.fig)}>
      <figcaption className={styles.cap}><strong>{title}</strong>{subtitle && <span>{subtitle}</span>}</figcaption>
      <div ref={box} className={styles.box}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className={styles.svg} role="img" aria-label={summary}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={Y(t)} y2={Y(t)} className={styles.grid} />
            <text x={M.l - 8} y={Y(t) + 4} textAnchor="end" className={styles.tick}>{fmt(t)}</text>
          </g>
        ))}
        {xt.map((p) => <text key={p.x} x={X(p.x)} y={H - 10} textAnchor="middle" className={styles.tick}>{p.x}</text>)}
        <path d={band('cal')} className={styles.cal} />
        <path d={band('sim')} className={styles.sim} />
        <path d={line('p50')} className={styles.p50} />
        <path d={line('obs')} className={styles.obs} />
        {points.filter((p) => p.obs != null).map((p) => (
          <circle key={p.x} cx={X(p.x)} cy={Y(p.obs as number)} r={4} className={styles.dot}><title>{`${p.x}: ${fmt(p.obs as number)} (observado)`}</title></circle>
        ))}
      </svg>
      </div>
      <ul className={styles.leg}>
        <li><i className={cn(styles.sw, styles.swObs)} /> observado (cadastro do TSE)</li>
        <li><i className={cn(styles.sw, styles.swP50)} /> projeção central</li>
        <li><i className={cn(styles.sw, styles.swSim)} /> faixa simulada p10–p90 (estreita: incerteza dos parâmetros)</li>
        <li><i className={cn(styles.sw, styles.swCal)} /> faixa calibrada p10–p90 (soma o erro da validação)</li>
      </ul>
      <details className={styles.tbl}>
        <summary>Tabela equivalente</summary>
        <div className={styles.wrap}>
          <table>
            <caption className="sr-only">{title}</caption>
            <thead><tr><th>Ano</th><th>Observado ({unit})</th><th>Central</th><th>Simulada p10–p90</th><th>Calibrada p10–p90</th></tr></thead>
            <tbody>{points.map((p) => <tr key={p.x}><td>{p.x}</td><td>{p.obs != null ? fmt(p.obs) : '—'}</td><td>{p.p50 != null ? fmt(p.p50) : '—'}</td><td>{p.sim ? `${fmt(p.sim[0])} a ${fmt(p.sim[1])}` : '—'}</td><td>{p.cal ? `${fmt(p.cal[0])} a ${fmt(p.cal[1])}` : '—'}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}

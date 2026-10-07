import { cn } from '@/lib/cn'
import styles from './YearBars.module.css'

export type BarSeries = { label: string; values: (number | null)[]; tone?: 'brand' | 'accent' | 'muted' }
export type YearBarsProps = {
  title: string
  subtitle?: string
  categories: string[]
  series: BarSeries[]
  fmt?: (v: number) => string
  /** texto lido por leitores de tela */
  summary: string
}

const W = 520
const H = 230
const M = { l: 12, r: 12, t: 28, b: 38 }

/** Barras agrupadas por categoria (ano). Valor ausente fica sem barra e com “—” (nunca zero). Rótulo direto em cada barra. */
export function YearBars({ title, subtitle, categories, series, fmt = (v) => String(v), summary }: YearBarsProps) {
  const max = Math.max(1, ...series.flatMap((s) => s.values.filter((v): v is number => v != null)))
  const gw = (W - M.l - M.r) / categories.length
  const bw = Math.min(46, (gw - 14) / series.length)
  const y = (v: number) => M.t + (1 - v / (max * 1.12)) * (H - M.t - M.b)
  return (
    <figure className={cn('card', styles.fig)}>
      <figcaption className={styles.cap}>
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={summary}>
        <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} className={styles.axis} />
        {categories.map((c, i) => {
          const gx = M.l + i * gw + gw / 2
          return (
            <g key={c}>
              {series.map((s, j) => {
                const v = s.values[i]
                const x0 = gx - (series.length * bw) / 2 + j * bw
                if (v == null) return <text key={s.label} x={x0 + bw / 2} y={H - M.b - 6} textAnchor="middle" className={styles.na}>—</text>
                const top = y(v)
                return (
                  <g key={s.label}>
                    <rect x={x0 + 1.5} y={top} width={bw - 3} height={Math.max(1, H - M.b - top)} rx={3} className={cn(styles.bar, styles[s.tone ?? 'brand'])}>
                      <title>{`${c} · ${s.label}: ${fmt(v)}`}</title>
                    </rect>
                    <text x={x0 + bw / 2} y={top - 5} textAnchor="middle" className={styles.val}>{fmt(v)}</text>
                  </g>
                )
              })}
              <text x={gx} y={H - M.b + 18} textAnchor="middle" className={styles.cat}>{c}</text>
            </g>
          )
        })}
      </svg>
      {series.length > 1 && (
        <ul className={styles.leg}>
          {series.map((s) => (
            <li key={s.label}><i className={cn(styles.sw, styles[s.tone ?? 'brand'])} /> {s.label}</li>
          ))}
        </ul>
      )}
      <div className="sr-only"><table>
        <caption>{title}</caption>
        <thead><tr><th>Categoria</th>{series.map((s) => <th key={s.label}>{s.label}</th>)}</tr></thead>
        <tbody>{categories.map((c, i) => <tr key={c}><td>{c}</td>{series.map((s) => <td key={s.label}>{s.values[i] == null ? 'sem dado' : fmt(s.values[i] as number)}</td>)}</tr>)}</tbody>
      </table></div>
    </figure>
  )
}

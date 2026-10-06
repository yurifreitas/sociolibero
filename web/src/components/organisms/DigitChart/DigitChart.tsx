import { fInt, fP, fPct } from '@/lib/format'
import styles from './DigitChart.module.css'

export type DigitData = { digitos: number[]; observado: number[]; esperado: number[]; p?: number | null; n?: number | null }
export type DigitChartProps = { title: string; data: DigitData; note: string }

const W = 480
const H = 260
const M = { l: 44, r: 12, t: 28, b: 32 }

export function DigitChart({ title, data, note }: DigitChartProps) {
  const sumO = data.observado.reduce((a, b) => a + b, 0) || 1
  const sumE = data.esperado.reduce((a, b) => a + b, 0) || 1
  const obs = data.observado.map((v) => v / sumO)
  const exp = data.esperado.map((v) => v / sumE)
  const top = Math.max(...obs, ...exp) * 1.18 || 1
  const n = data.digitos.length
  const band = (W - M.l - M.r) / n
  const bw = band * 0.62
  const y = (v: number) => H - M.b - (v / top) * (H - M.t - M.b)
  const ticks = [0, 0.5, 1].map((t) => t * top)
  return (
    <figure className={styles.fig}>
      <figcaption className={styles.title}>
        <strong>{title}</strong>
        <span>
          {data.n != null ? `n = ${fInt(data.n)} · ` : ''}p = {fP(data.p)} {data.p != null && data.p >= 0.05 ? '· sem desvio detectável' : data.p != null ? '· desvio estatístico' : ''}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        className={styles.svg}
        aria-label={`${title}: ${data.digitos.map((d, i) => `dígito ${d} observado ${fPct((obs[i] ?? 0) * 100)} esperado ${fPct((exp[i] ?? 0) * 100)}`).join('; ')}`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={M.l - 8} y={y(t) + 4} textAnchor="end" className={styles.tick}>
              {fPct(t * 100)}
            </text>
          </g>
        ))}
        {data.digitos.map((d, i) => {
          const cx = M.l + band * i + band / 2
          return (
            <g key={d}>
              <rect x={cx - bw / 2} y={y(obs[i] ?? 0)} width={bw} height={H - M.b - y(obs[i] ?? 0)} rx={3} className={styles.bar}>
                <title>{`dígito ${d}: observado ${fPct((obs[i] ?? 0) * 100)} · esperado ${fPct((exp[i] ?? 0) * 100)}`}</title>
              </rect>
              <line x1={cx - bw / 2 - 3} x2={cx + bw / 2 + 3} y1={y(exp[i] ?? 0)} y2={y(exp[i] ?? 0)} className={styles.exp} />
              <text x={cx} y={H - M.b + 18} textAnchor="middle" className={styles.tick}>
                {d}
              </text>
            </g>
          )
        })}
        <g className={styles.key} transform={`translate(${M.l} 14)`}>
          <rect width="10" height="10" rx="2" className={styles.bar} />
          <text x="16" y="9">observado</text>
          <line x1="96" x2="112" y1="5" y2="5" className={styles.exp} />
          <text x="118" y="9">esperado</text>
        </g>
      </svg>
      <p className={styles.note}>{note}</p>
    </figure>
  )
}

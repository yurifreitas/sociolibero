import { scaleLinear, scaleLog } from 'd3-scale'
import { Badge } from '@/components/atoms/Badge'
import { oklchToRgb, rgbCss } from '@/lib/color'
import { fPct } from '@/lib/format'
import { useTheme } from '@/lib/theme'
import type { Validation } from '@/features/data/schemas'
import styles from './PowerCurves.module.css'

const W = 380
const H = 240
const M = { l: 40, r: 84, t: 14, b: 40 }
const HUES = [264, 165, 70, 20, 310, 210]
const DASH = ['', '6 3', '2 3', '8 3 2 3', '', '6 3']
const BAD_FPR = 0.15

const SCENARIO_LABEL: Record<string, string> = {
  enchimento: 'Enchimento de urna',
  transferencia: 'Transferência de votos',
  fabricacao: 'Fabricação de seções',
}
const scenarioLabel = (n: string) => SCENARIO_LABEL[n] ?? n.charAt(0).toUpperCase() + n.slice(1).replace(/_/g, ' ')

export type PowerCurvesProps = { validation: Validation; labels?: Record<string, string> }

export function PowerCurves({ validation, labels = {} }: PowerCurvesProps) {
  const { effective } = useTheme()
  const color = (i: number) => rgbCss(oklchToRgb(effective === 'light' ? 0.55 : 0.74, 0.15, HUES[i % HUES.length] as number))
  const alpha = typeof validation.parametros?.alpha === 'number' ? (validation.parametros.alpha as number) : 0.05
  const nameOf = (k: string) => labels[k] ?? labels[k.replace(/_p$/, '')] ?? k
  return (
    <div className={styles.root}>
      <div className={styles.grid}>
        {validation.cenarios.map((c) => {
          const x = scaleLog()
            .domain([Math.min(...c.intensidade), Math.max(...c.intensidade)])
            .range([M.l, W - M.r])
          const y = scaleLinear().domain([0, 1]).range([H - M.b, M.t])
          const dets = Object.entries(c.detectores)
          const ends = dets.map(([k, d]) => ({ k, y: y(d.tpr[d.tpr.length - 1] ?? 0) })).sort((a, b) => a.y - b.y)
          for (let j = 1; j < ends.length; j++) {
            const prev = ends[j - 1]!
            if (ends[j]!.y - prev.y < 13) ends[j]!.y = prev.y + 13
          }
          const yEnd = Object.fromEntries(ends.map((e) => [e.k, e.y]))
          return (
            <figure key={c.nome} className={styles.fig}>
              <figcaption className={styles.cap}>
                <strong>{scenarioLabel(c.nome)}</strong>
                <span>{c.descricao ?? 'poder de detecção × intensidade'}</span>
              </figcaption>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                role="img"
                className={styles.svg}
                aria-label={`${scenarioLabel(c.nome)}: ${dets.map(([k, d]) => `${nameOf(k)} detecta ${fPct((d.tpr[d.tpr.length - 1] ?? 0) * 100)} na maior intensidade, com ${fPct(d.fpr * 100)} de falsos positivos`).join('; ')}`}
              >
                {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                  <g key={t}>
                    <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className={styles.grid2} />
                    <text x={M.l - 6} y={y(t) + 4} textAnchor="end" className={styles.tick}>
                      {Math.round(t * 100)}%
                    </text>
                  </g>
                ))}
                <line x1={M.l} x2={W - M.r} y1={y(alpha)} y2={y(alpha)} className={styles.fpr} />
                <text x={M.l + 4} y={y(alpha) - 5} className={styles.fprLabel}>
                  linha do acaso ({fPct(alpha * 100)})
                </text>
                {c.intensidade.map((v) => (
                  <text key={v} x={x(v)} y={H - M.b + 16} textAnchor="middle" className={styles.tick}>
                    {v * 100 < 1 ? (v * 100).toFixed(1).replace('.', ',') : Math.round(v * 100)}%
                  </text>
                ))}
                <text x={M.l + (W - M.l - M.r) / 2} y={H - 6} textAnchor="middle" className={styles.axis}>
                  fração afetada (escala log)
                </text>
                {dets.map(([k, d], i) => {
                  const path = d.tpr.map((v, j) => `${j === 0 ? 'M' : 'L'}${x(c.intensidade[j] ?? 0)},${y(v)}`).join(' ')
                  return (
                    <g key={k}>
                      <path d={path} fill="none" stroke={color(i)} strokeWidth={2.2} strokeDasharray={DASH[i % DASH.length]} opacity={d.fpr > BAD_FPR ? 0.5 : 1} />
                      <text x={W - M.r + 4} y={(yEnd[k] ?? 0) + 4} className={styles.label} fill={color(i)}>
                        {nameOf(k).split(' ')[0]}
                      </text>
                    </g>
                  )
                })}
              </svg>
              <ul className={styles.fprs}>
                {dets.map(([k, d], i) => (
                  <li key={k}>
                    <i style={{ background: color(i) }} />
                    <span>{nameOf(k)}</span>
                    <span className={styles.fprVal}>falso positivo {fPct(d.fpr * 100)}</span>
                    {d.fpr > BAD_FPR && <Badge tone="warn">não discrimina</Badge>}
                  </li>
                ))}
              </ul>
            </figure>
          )
        })}
      </div>
      {validation.nota && <p className={styles.nota}>{validation.nota}</p>}
    </div>
  )
}

import { useMemo } from 'react'
import { MARCOS } from '@/features/eleicoes/model'
import type { Eleicao } from '@/features/eleicoes/schemas'
import { fNum1 } from '@/lib/format'
import styles from './ElectorateChart.module.css'

const W = 1100
const H = 340
const M = { l: 48, r: 24, t: 40, b: 42 }

export type ElectorateChartProps = { eleicoes: Eleicao[]; selectedId: string | null; onSelect: (id: string) => void }

/**
 * Eleitorado como % da população, ao longo do tempo, com os marcos de regra do voto.
 * Pontos “não verificados” são ocos; só existem pontos onde a fonte traz o percentual (anos recentes não têm: a coluna é nula, não zero).
 */
export function ElectorateChart({ eleicoes, selectedId, onSelect }: ElectorateChartProps) {
  const pts = useMemo(
    () =>
      eleicoes
        .filter((e) => e.eleitorado?.pct_populacao != null)
        .map((e) => ({ id: e.id, ano: e.ano, pct: e.eleitorado?.pct_populacao as number, ok: e.eleitorado?.verificado === true, cargo: e.cargo, tipo: e.eleitorado?.tipo ?? '' }))
        .sort((a, b) => a.ano - b.ano),
    [eleicoes],
  )
  if (pts.length === 0) return <p className={styles.none}>Nenhuma eleição traz o percentual da população.</p>
  const y0 = 1860
  const y1 = Math.max(...pts.map((p) => p.ano)) + 6
  const yMax = Math.ceil((Math.max(...pts.map((p) => p.pct)) * 1.08) / 10) * 10
  const x = (a: number) => M.l + ((a - y0) / (y1 - y0)) * (W - M.l - M.r)
  const y = (v: number) => M.t + (1 - v / yMax) * (H - M.t - M.b)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.ano).toFixed(1)} ${y(p.pct).toFixed(1)}`).join(' ')
  const yt = Array.from({ length: yMax / 10 + 1 }, (_, i) => i * 10)
  const xt = [1870, 1900, 1930, 1960, 1990, 2020].filter((t) => t <= y1)
  const marcos = MARCOS.filter((m) => m.ano >= y0 && m.ano <= y1)

  return (
    <figure className={`card ${styles.fig}`}>
      <figcaption className={styles.head}>
        <strong>Eleitorado como % da população</strong>
        <span>Ponto cheio = lido na fonte · ponto oco = não verificado. Anos sem ponto não têm o percentual na fonte (não é zero).</span>
      </figcaption>
      <div className={styles.scroll}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={`Eleitorado como percentual da população, de ${pts[0]?.ano} a ${pts[pts.length - 1]?.ano}: sobe de ${fNum1(pts[0]?.pct)}% em ${pts[0]?.ano} a ${fNum1(pts[pts.length - 1]?.pct)}% em ${pts[pts.length - 1]?.ano}; os pontos e a tabela equivalente listam cada ano`}>
          {yt.map((v) => (
            <g key={v}>
              <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} className={styles.grid} />
              <text x={M.l - 8} y={y(v) + 4} textAnchor="end" className={styles.tick}>{v}%</text>
            </g>
          ))}
          {xt.map((t) => (
            <text key={t} x={x(t)} y={H - M.b + 20} textAnchor="middle" className={styles.tick}>{t}</text>
          ))}
          {marcos.map((m, i) => (
            <g key={m.ano}>
              <line x1={x(m.ano)} x2={x(m.ano)} y1={M.t - 6} y2={H - M.b} className={styles.marco} />
              <text x={x(m.ano) + 4} y={M.t - 12 + (i % 2) * 12} className={styles.marcoT}>{m.ano} · {m.rotulo}</text>
            </g>
          ))}
          <path d={line} className={styles.line} />
          {pts.map((p) => (
            <g key={p.id} tabIndex={0} role="button" aria-pressed={selectedId === p.id} aria-label={`${p.ano}: ${fNum1(p.pct)}% da população${p.ok ? '' : ' (não verificado)'}`} className={styles.pt} onClick={() => onSelect(p.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(p.id))}>
              <title>{`${p.ano} · ${fNum1(p.pct)}% · ${p.tipo || p.cargo}${p.ok ? '' : ' · não verificado'}`}</title>
              <circle cx={x(p.ano)} cy={y(p.pct)} r={selectedId === p.id ? 7 : 5} className={p.ok ? styles.on : styles.off} />
            </g>
          ))}
        </svg>
      </div>
      <div className="sr-only"><table>
        <caption>Eleitorado como percentual da população</caption>
        <thead><tr><th>Ano</th><th>%</th><th>Verificado</th></tr></thead>
        <tbody>{pts.map((p) => <tr key={p.id}><td>{p.ano}</td><td>{fNum1(p.pct)}</td><td>{p.ok ? 'sim' : 'não'}</td></tr>)}</tbody>
      </table></div>
    </figure>
  )
}

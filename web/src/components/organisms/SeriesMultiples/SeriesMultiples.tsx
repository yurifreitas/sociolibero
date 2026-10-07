import { useMemo, useState, type PointerEvent } from 'react'
import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import type { Serie } from '@/features/gente/schemas'
import { fCompact, fNum1, fNum2, shortHash } from '@/lib/format'
import styles from './SeriesMultiples.module.css'

export type CycleSpan = { id: string; inicio: number; fim: number }
const W = 400
const H = 150
const M = { t: 10, r: 58, b: 22, l: 8 }

const fmt = (v: number) => (Math.abs(v) >= 10000 ? fCompact(v) : Math.abs(v) >= 100 ? fNum1(v) : fNum2(v))
const QUAL: Record<string, 'pos' | 'warn' | 'neutral'> = { alta: 'pos', media: 'warn', baixa: 'warn' }

function Chart({ s, x0, x1, cycles, selected, onSelect }: { s: Serie; x0: number; x1: number; cycles: CycleSpan[]; selected?: string; onSelect?: (id: string) => void }) {
  const [hover, setHover] = useState<number | null>(null)
  const pts = useMemo(() => [...s.pontos].sort((a, b) => a[0] - b[0]), [s.pontos])
  const ys = pts.map((p) => p[1])
  const lo = Math.min(...ys)
  const hi = Math.max(...ys)
  const pad = (hi - lo || 1) * 0.1
  const X = (x: number) => M.l + ((x - x0) / (x1 - x0)) * (W - M.l - M.r)
  const Y = (y: number) => M.t + (1 - (y - (lo - pad)) / (hi - lo + pad * 2)) * (H - M.t - M.b)
  const gaps = pts.slice(1).map((p, i) => p[0] - (pts[i] as [number, number])[0]).sort((a, b) => a - b)
  const coarse = (gaps[Math.floor(gaps.length / 2)] ?? 1) > 3
  const segs: string[][] = [[]]
  pts.forEach((p, i) => {
    if (i > 0 && !coarse && p[0] - (pts[i - 1] as [number, number])[0] > 6) segs.push([])
    ;(segs[segs.length - 1] as string[]).push(`${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`)
  })
  const span = x1 - x0
  const step = span > 300 ? 50 : span > 120 ? 25 : 10
  const ticks: number[] = []
  for (let t = Math.ceil(x0 / step) * step; t <= x1; t += step) ticks.push(t)
  const last = pts[pts.length - 1] as [number, number]
  const nearest = (clientX: number, el: SVGSVGElement) => {
    const r = el.getBoundingClientRect()
    const xv = x0 + (((clientX - r.left) / r.width) * W - M.l) / (W - M.l - M.r) * (x1 - x0)
    let best = pts[0] as [number, number]
    for (const p of pts) if (Math.abs(p[0] - xv) < Math.abs(best[0] - xv)) best = p
    return { best, xv }
  }
  const onMove = (e: PointerEvent<SVGSVGElement>) => setHover(nearest(e.clientX, e.currentTarget).best[0])
  const onClick = (e: PointerEvent<SVGSVGElement>) => {
    const { xv } = nearest(e.clientX, e.currentTarget)
    const c = cycles.find((c) => xv >= c.inicio && xv <= c.fim)
    if (c && onSelect) onSelect(c.id)
  }
  const hp = hover != null ? pts.find((p) => p[0] === hover) : undefined
  const show = hp ?? last
  return (
    <figure className={`card ${styles.card}`}>
      <figcaption className={styles.cap}>
        <div className={styles.capTop}>
          <h4 className={styles.title}>{s.rotulo}</h4>
          {s.qualidade && <Badge tone={QUAL[s.qualidade] ?? 'neutral'}>qualidade {s.qualidade}</Badge>}
        </div>
        <p className={styles.now}>
          <b className="num">{fmt(show[1])}</b> <span>{s.unidade}</span> <span className={styles.yr}>· {show[0]}</span>
        </p>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={`${s.rotulo}: ${fmt(last[1])} ${s.unidade ?? ''} em ${last[0]}; ${pts.length} pontos de ${pts[0]?.[0]} a ${last[0]}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)} onClick={onClick}>
        {cycles.filter((c) => c.fim >= x0 && c.inicio <= x1).map((c, i) => {
          const a = X(Math.max(c.inicio, x0))
          const b = X(Math.min(c.fim, x1))
          return <rect key={c.id} x={a} y={M.t} width={Math.max(0, b - a)} height={H - M.t - M.b} className={c.id === selected ? styles.bandOn : i % 2 ? styles.bandB : styles.bandA}><title>{c.id}</title></rect>
        })}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={H - M.b} y2={H - M.b + 3} className={styles.tick} />
            <text x={X(t)} y={H - 6} textAnchor="middle" className={styles.tickText}>{t}</text>
          </g>
        ))}
        {(s.quebras ?? []).filter((q) => q.ano >= x0 && q.ano <= x1).map((q) => (
          <g key={q.ano}>
            <line x1={X(q.ano)} x2={X(q.ano)} y1={M.t} y2={H - M.b} className={styles.brk} />
            <title>{`Quebra de série em ${q.ano}: ${q.motivo ?? ''}`}</title>
          </g>
        ))}
        {segs.filter((g) => g.length > 1).map((g, i) => <polyline key={i} points={g.join(' ')} fill="none" className={styles.line} />)}
        {(coarse || pts.length < 40) && pts.map((p) => <circle key={p[0]} cx={X(p[0])} cy={Y(p[1])} r="2.2" className={styles.dot} />)}
        {hp && <><line x1={X(hp[0])} x2={X(hp[0])} y1={M.t} y2={H - M.b} className={styles.cross} /><circle cx={X(hp[0])} cy={Y(hp[1])} r="4" className={styles.dotOn} /></>}
        <circle cx={X(last[0])} cy={Y(last[1])} r="3.4" className={styles.dotOn} />
        <text x={X(last[0]) + 7} y={Y(last[1]) + 4} className={styles.endLabel}>{fmt(last[1])}</text>
      </svg>
      <div className={styles.meta}>
        {s.fonte?.url ? <a href={s.fonte.url} target="_blank" rel="noreferrer">{s.fonte.nome ?? 'fonte'} <Icon name="external" size={11} /></a> : <span>{s.fonte?.nome ?? 'fonte não informada'}</span>}
        {s.fonte?.sha256 && <code title={s.fonte.sha256}>{shortHash(s.fonte.sha256)}</code>}
        {(s.quebras ?? []).length > 0 && <span className={styles.brkNote}>┆ {(s.quebras ?? []).length} quebra(s) de série</span>}
      </div>
      {s.notas && (
        <details className={styles.notesBox}>
          <summary>Nota metodológica</summary>
          <p className={styles.notes}>{s.notas}</p>
        </details>
      )}
      <details className={styles.table}>
        <summary>Dados em tabela ({pts.length} pontos)</summary>
        <div className={styles.scroll}>
          <table>
            <thead><tr><th scope="col">Ano</th><th scope="col">{s.unidade ?? 'Valor'}</th></tr></thead>
            <tbody>{pts.slice(-400).map((p) => <tr key={p[0]}><td>{p[0]}</td><td className="num">{fmt(p[1])}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}

/** Small multiples com eixo X compartilhado, faixas de ciclo (clicáveis), quebras de série e rótulo direto. */
export function SeriesMultiples({ series, cycles, selected, onSelect }: { series: Serie[]; cycles: CycleSpan[]; selected?: string; onSelect?: (id: string) => void }) {
  const valid = series.filter((s) => s.pontos.length >= 2)
  const x0 = Math.min(...valid.map((s) => s.pontos[0]?.[0] ?? Infinity))
  const x1 = Math.max(2026, ...valid.map((s) => s.pontos[s.pontos.length - 1]?.[0] ?? 0))
  if (valid.length === 0) return null
  return (
    <div className={styles.grid}>
      {valid.map((s) => {
        // séries curtas (< 80 anos) usam o próprio intervalo; as longas compartilham o eixo
        const a = s.pontos[0]?.[0] ?? x0
        const b = s.pontos[s.pontos.length - 1]?.[0] ?? x1
        const own = b - a < 80
        return <Chart key={s.id} s={s} x0={own ? a - 1 : x0} x1={own ? b + 1 : x1} cycles={cycles} selected={selected} onSelect={onSelect} />
      })}
    </div>
  )
}

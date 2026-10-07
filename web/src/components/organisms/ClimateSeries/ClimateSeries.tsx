import { useMemo, useState, type PointerEvent } from 'react'
import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { toYear } from '@/features/conhecimento/model'
import type { ClimaSerie } from '@/features/conhecimento/schemas'
import { fCompact, fNum1, fNum2, shortHash } from '@/lib/format'
import styles from './ClimateSeries.module.css'

const W = 420
const H = 160
const M = { t: 12, r: 62, b: 24, l: 8 }
const fmt = (v: number) => (Math.abs(v) >= 10000 ? fCompact(v) : Math.abs(v) >= 100 ? fNum1(v) : fNum2(v))
const QUAL: Record<string, 'pos' | 'warn'> = { alta: 'pos', media: 'warn', baixa: 'warn' }
const lbl = (t: string | number) => (typeof t === 'number' ? String(t) : t.slice(0, 7))

export type RefLine = { y: number; label: string }

/** Série climática ou econômica: linha com rótulo direto, linhas de referência, crosshair e tabela equivalente. */
export function ClimateSeries({ s, refs }: { s: ClimaSerie; refs?: RefLine[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const pts = useMemo(
    () =>
      s.pontos
        .map(([t, v]) => ({ t, x: toYear(t), v }))
        .filter((p): p is { t: string | number; x: number; v: number } => Number.isFinite(p.x) && p.v != null)
        .sort((a, b) => a.x - b.x),
    [s.pontos],
  )
  if (pts.length < 2) return null
  const xs0 = pts[0]!.x
  const xs1 = pts[pts.length - 1]!.x
  const ys = pts.map((p) => p.v)
  const refYs = (refs ?? []).map((r) => r.y)
  const lo = Math.min(...ys, ...refYs)
  const hi = Math.max(...ys, ...refYs)
  const pad = (hi - lo || 1) * 0.08
  const X = (x: number) => M.l + ((x - xs0) / (xs1 - xs0 || 1)) * (W - M.l - M.r)
  const Y = (y: number) => M.t + (1 - (y - (lo - pad)) / (hi - lo + pad * 2)) * (H - M.t - M.b)
  const span = xs1 - xs0
  const step = span > 200 ? 50 : span > 90 ? 25 : span > 40 ? 10 : span > 15 ? 5 : 2
  const ticks: number[] = []
  for (let t = Math.ceil(xs0 / step) * step; t <= xs1; t += step) ticks.push(t)
  const stride = Math.max(1, Math.floor(pts.length / 900))
  const line = pts.filter((_, i) => i % stride === 0 || i === pts.length - 1).map((p) => `${X(p.x).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]!
  const hp = hover != null ? pts.find((p) => p.x === hover) : undefined
  const show = hp ?? last
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const xv = xs0 + ((((e.clientX - r.left) / r.width) * W - M.l) / (W - M.l - M.r)) * (xs1 - xs0)
    let best = pts[0]!
    for (const p of pts) if (Math.abs(p.x - xv) < Math.abs(best.x - xv)) best = p
    setHover(best.x)
  }
  return (
    <figure className={`card ${styles.card}`}>
      <figcaption className={styles.cap}>
        <div className={styles.top}>
          <h4 className={styles.title}>{s.rotulo}</h4>
          {s.qualidade && <Badge tone={QUAL[s.qualidade] ?? 'neutral'}>qualidade {s.qualidade}</Badge>}
        </div>
        <p className={styles.now}>
          <b className="num">{fmt(show.v)}</b> <span>{s.unidade}</span> <span className={styles.yr}>· {lbl(show.t)}</span>
        </p>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={`${s.rotulo}: ${fmt(last.v)} ${s.unidade ?? ''} em ${lbl(last.t)}; ${pts.length} pontos de ${lbl(pts[0]!.t)} a ${lbl(last.t)}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={M.t} y2={H - M.b} className={styles.grid} />
            <text x={X(t)} y={H - 7} textAnchor="middle" className={styles.tick}>{t}</text>
          </g>
        ))}
        {(refs ?? []).map((r) => (
          <g key={r.label}>
            <line x1={M.l} x2={W - M.r} y1={Y(r.y)} y2={Y(r.y)} className={styles.ref} />
            <text x={W - M.r + 4} y={Y(r.y) + 3} className={styles.refText}>{r.label}</text>
          </g>
        ))}
        <polyline points={line} fill="none" className={styles.line} />
        {hp && (
          <>
            <line x1={X(hp.x)} x2={X(hp.x)} y1={M.t} y2={H - M.b} className={styles.cross} />
            <circle cx={X(hp.x)} cy={Y(hp.v)} r="4" className={styles.dot} />
          </>
        )}
        <circle cx={X(last.x)} cy={Y(last.v)} r="3.4" className={styles.dot} />
        <text x={X(last.x) + 6} y={Y(last.v) + 4} className={styles.end}>{fmt(last.v)}</text>
      </svg>
      <div className={styles.meta}>
        {s.fonte?.url ? (
          <a href={s.fonte.url} target="_blank" rel="noreferrer">
            {s.fonte.nome ?? 'fonte'} <Icon name="external" size={11} />
          </a>
        ) : (
          <span>{s.fonte?.nome ?? 'fonte não informada'}</span>
        )}
        {s.fonte?.sha256 && <code title={s.fonte.sha256}>{shortHash(s.fonte.sha256)}</code>}
      </div>
      {s.notas && (
        <details className={styles.det}>
          <summary>Nota metodológica</summary>
          <p>{s.notas}</p>
        </details>
      )}
      <details className={styles.det}>
        <summary>Dados em tabela ({pts.length} pontos{pts.length > 240 ? '; últimos 240' : ''})</summary>
        <div className={styles.scroll}>
          <table>
            <thead>
              <tr><th scope="col">Período</th><th scope="col">{s.unidade ?? 'Valor'}</th></tr>
            </thead>
            <tbody>
              {pts.slice(-240).map((p) => (
                <tr key={String(p.t)}><td>{lbl(p.t)}</td><td className="num">{fmt(p.v)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}

import { useMemo, useState } from 'react'
import { SegmentedControl } from '@/components/molecules/SegmentedControl'
import type { Curva } from '@/features/futuro/schemas'
import { fCompact, fNum1, fNum2 } from '@/lib/format'
import styles from './FutureCurve.module.css'

type Scn = 'base' | 'lento' | 'rapido' | 'todos'
const W = 640
const H = 260
const M = { t: 14, r: 64, b: 28, l: 12 }
const fmt = (v: number) => (Math.abs(v) >= 10000 ? fCompact(v) : Math.abs(v) >= 100 ? fNum1(v) : fNum2(v))
const show = (v: unknown) => (v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v))

/** Curva observada + projeção 2026–2040 com banda p10–p90 por cenário (lento/base/rápido). Projeção, não previsão. */
export function FutureCurve({ c }: { c: Curva }) {
  const [scn, setScn] = useState<Scn>('base')
  const obs = useMemo(() => [...(c.pontos_observados ?? [])].sort((a, b) => a[0] - b[0]), [c.pontos_observados])
  const anos = c.projecao?.anos ?? []
  // lento/rápido: o arquivo traz só os parâmetros (K, r, t0 ...) no quantil p10/p90 do valor em 2035;
  // a curva é reconstruída aqui com a mesma forma funcional (logística ou exponencial). Bass e Wright mostram só o central.
  type Ser = { central?: number[] | null; p10?: number[] | null; p90?: number[] | null }
  const rebuild = (k: 'lento' | 'base' | 'rapido'): Ser | null => {
    const sc = c.cenarios?.[k]
    const pr = sc?.parametros
    if (!pr || anos.length === 0) return null
    if (c.modelo === 'logistica' && pr.K != null && pr.r != null && pr.t0 != null) return { central: anos.map((t) => (pr.K as number) / (1 + Math.exp(-(pr.r as number) * (t - (pr.t0 as number))))), p10: null, p90: null }
    if (c.modelo === 'exponencial' && pr.a != null && pr.g != null && pr.tref != null) return { central: anos.map((t) => (pr.a as number) * Math.exp((pr.g as number) * (t - (pr.tref as number)))), p10: null, p90: null }
    return null
  }
  const pick = (k: 'lento' | 'base' | 'rapido'): Ser | null => (k === 'base' ? (c.projecao ?? rebuild(k)) : rebuild(k))
  const series = (['lento', 'base', 'rapido'] as const).map((k) => ({ k, s: pick(k) })).filter((x) => x.s && x.s.central && anos.length > 0)

  const all: number[] = [...obs.map((p) => p[1])]
  for (const { s } of series) for (const arr of [s?.central, s?.p10, s?.p90]) all.push(...(arr ?? []))
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const x0 = Math.min(obs[0]?.[0] ?? Infinity, anos[0] ?? Infinity)
  const x1 = Math.max(obs[obs.length - 1]?.[0] ?? -Infinity, anos[anos.length - 1] ?? -Infinity)
  if (!Number.isFinite(lo) || !Number.isFinite(x0) || !Number.isFinite(x1) || x0 === x1) return null
  const pad = (hi - lo || 1) * 0.08
  const X = (x: number) => M.l + ((x - x0) / (x1 - x0)) * (W - M.l - M.r)
  const Y = (y: number) => M.t + (1 - (y - (lo - pad)) / (hi - lo + pad * 2)) * (H - M.t - M.b)
  const line = (xs: number[], ys: number[]) => xs.map((x, i) => `${X(x).toFixed(1)},${Y(ys[i] as number).toFixed(1)}`).join(' ')
  const band = (s: { p10?: number[] | null; p90?: number[] | null }) =>
    s.p10 && s.p90 && s.p10.length === anos.length && s.p90.length === anos.length
      ? `${line(anos, s.p90)} ${line([...anos].reverse(), [...s.p10].reverse())}`
      : null
  const visible = scn === 'todos' ? series : series.filter((x) => x.k === scn)
  const step = x1 - x0 > 100 ? 25 : 5
  const ticks: number[] = []
  for (let t = Math.ceil(x0 / step) * step; t <= x1; t += step) ticks.push(t)
  const split = obs.length ? (obs[obs.length - 1] as [number, number])[0] : anos[0]
  const COLOR = { lento: 'var(--accent)', base: 'var(--brand)', rapido: 'var(--pos)' } as const
  const err = c.ajuste?.erro_teste
  const bl = c.ajuste?.baseline_erro_teste

  return (
    <article className={`card ${styles.card}`}>
      <header className={styles.head}>
        <div>
          <h3 className={styles.title}>{c.rotulo}</h3>
          <p className={styles.sub}>{[c.dominio, c.modelo].filter(Boolean).join(' · ')}</p>
        </div>
        <SegmentedControl<Scn> label="Cenário" value={scn} onChange={setScn} options={[{ value: 'lento', label: 'Lento' }, { value: 'base', label: 'Base' }, { value: 'rapido', label: 'Rápido' }, { value: 'todos', label: 'Todos' }]} />
      </header>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={`${c.rotulo}: série observada até ${split} e projeção até ${anos[anos.length - 1] ?? '—'} com faixa p10 a p90`}>
        {split != null && <rect x={X(split)} y={M.t} width={Math.max(0, W - M.r - X(split))} height={H - M.t - M.b} className={styles.future} />}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={M.t} y2={H - M.b} className={styles.grid} />
            <text x={X(t)} y={H - 9} textAnchor="middle" className={styles.tick}>{t}</text>
          </g>
        ))}
        {visible.map(({ k, s }) => {
          const b = s ? band(s) : null
          return b ? <polygon key={`b${k}`} points={b} style={{ fill: COLOR[k] }} className={styles.band} /> : null
        })}
        {obs.length > 1 && <polyline points={line(obs.map((p) => p[0]), obs.map((p) => p[1]))} fill="none" className={styles.obs} />}
        {visible.map(({ k, s }) => {
          const cen = s?.central ?? []
          return (
            <g key={k}>
              <polyline points={line(anos, cen)} fill="none" style={{ stroke: COLOR[k] }} className={styles.proj} />
              {cen.length > 0 && (
                <text x={X(anos[anos.length - 1] as number) + 6} y={Y(cen[cen.length - 1] as number) + 4} style={{ fill: COLOR[k] }} className={styles.end}>
                  {k} {fmt(cen[cen.length - 1] as number)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <p className={styles.note}>Faixa sombreada = p10–p90 (bootstrap de resíduos, que subestima a incerteza). Região à direita = projeção: extrapolação do ajuste, <b>não previsão</b>. Curvas lento/rápido = parâmetros no p10/p90 do valor em 2035.</p>

      <dl className={styles.kv}>
        {c.ajuste?.metodo && <><dt>Ajuste</dt><dd>{c.ajuste.metodo}</dd></>}
        {c.ajuste?.periodo_treino != null && <><dt>Período de treino</dt><dd>{show(c.ajuste.periodo_treino)}</dd></>}
        {err?.mape_pct != null && (
          <>
            <dt>Erro no teste</dt>
            <dd>
              MAPE {fmt(err.mape_pct)}% em {err.k} passo(s) à frente · ingênuo {bl?.ingenuo?.mape_pct != null ? `${fmt(bl.ingenuo.mape_pct)}%` : '—'} · linear {bl?.linear?.mape_pct != null ? `${fmt(bl.linear.mape_pct)}%` : '—'}
            </dd>
          </>
        )}
        {c.fonte_dados != null && <><dt>Fonte dos dados</dt><dd>{typeof c.fonte_dados === 'object' && !Array.isArray(c.fonte_dados) && 'nome' in c.fonte_dados ? String((c.fonte_dados as { nome?: string }).nome) : show(c.fonte_dados)}</dd></>}
        {c.parametros && Object.keys(c.parametros).length > 0 && <><dt>Parâmetros</dt><dd><code>{Object.entries(c.parametros).map(([k, v]) => `${k}=${show(v)}`).join(' · ')}</code></dd></>}
      </dl>
      {c.limites && <p className={styles.lim}><b>Limites.</b> {Array.isArray(c.limites) ? c.limites.join(' ') : c.limites}</p>}
      <details className={styles.table}>
        <summary>Dados em tabela</summary>
        <div className={styles.scroll}>
          <table>
            <thead><tr><th scope="col">Ano</th><th scope="col">Observado</th>{series.map(({ k }) => <th key={k} scope="col">{k} (p10 · central · p90)</th>)}</tr></thead>
            <tbody>
              {obs.slice(-30).map((p) => <tr key={`o${p[0]}`}><td>{p[0]}</td><td className="num">{fmt(p[1])}</td>{series.map(({ k }) => <td key={k}>—</td>)}</tr>)}
              {anos.map((a, i) => (
                <tr key={`p${a}`}>
                  <td>{a}</td><td>—</td>
                  {series.map(({ k, s }) => <td key={k} className="num">{[s?.p10?.[i], s?.central?.[i], s?.p90?.[i]].map((v) => (v == null ? '—' : fmt(v))).join(' · ')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </article>
  )
}

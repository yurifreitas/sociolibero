import { Badge } from '@/components/atoms/Badge'
import { InlineNote } from '@/components/molecules/InlineNote'
import type { Macro } from '@/features/futuro/schemas'
import { fNum1, fNum2, fSigned1 } from '@/lib/format'
import styles from './MacroIntegration.module.css'

type Any = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const SC = ['lento', 'base', 'rapido'] as const
const COLOR = { lento: 'var(--accent)', base: 'var(--brand)', rapido: 'var(--pos)' } as const
const W = 520
const H = 220
const M = { t: 16, r: 70, b: 34, l: 48 }

function Sensibilidade({ sens, assumed }: { sens: Any[]; assumed: number | null }) {
  const xs = sens.map((s) => s.valor as number)
  const ys = sens.map((s) => s.delta_divida_pib_2035_pp as number)
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const lo = Math.min(0, ...ys)
  const hi = Math.max(0, ...ys)
  const X = (x: number) => M.l + ((x - x0) / (x1 - x0 || 1)) * (W - M.l - M.r)
  const Y = (y: number) => M.t + (1 - (y - lo) / (hi - lo || 1)) * (H - M.t - M.b)
  return (
    <figure className={styles.fig}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label="Sensibilidade: variação da dívida/PIB em 2035 em função do ganho de produtividade assumido, por velocidade de difusão">
        <line x1={M.l} x2={W - M.r} y1={Y(0)} y2={Y(0)} className={styles.zero} />
        <text x={M.l - 8} y={Y(0) + 4} textAnchor="end" className={styles.tick}>0</text>
        <text x={M.l - 8} y={Y(lo) + 4} textAnchor="end" className={styles.tick}>{fSigned1(lo)}</text>
        {xs.length > 0 && [x0, ...(assumed != null ? [assumed] : []), x1].map((t) => (
          <text key={t} x={X(t)} y={H - 12} textAnchor="middle" className={styles.tick}>{fNum2(t)}</text>
        ))}
        {assumed != null && (
          <g>
            <line x1={X(assumed)} x2={X(assumed)} y1={M.t} y2={H - M.b} className={styles.assumed} />
            <text x={X(assumed) + 5} y={M.t + 10} className={styles.assumedText}>suposição {fNum2(assumed)} pp/ano</text>
          </g>
        )}
        {SC.map((d) => {
          const pts = sens.filter((s) => s.difusao === d).sort((a, b) => a.valor - b.valor)
          const last = pts[pts.length - 1]
          if (pts.length < 2 || !last) return null
          return (
            <g key={d}>
              <polyline points={pts.map((p) => `${X(p.valor).toFixed(1)},${Y(p.delta_divida_pib_2035_pp).toFixed(1)}`).join(' ')} fill="none" stroke={COLOR[d]} strokeWidth="2" strokeLinejoin="round" />
              <text x={X(last.valor) + 6} y={Y(last.delta_divida_pib_2035_pp) + 4} fill={COLOR[d]} className={styles.end}>{d} {fSigned1(last.delta_divida_pib_2035_pp)}</text>
            </g>
          )
        })}
        <text x={(W - M.l - M.r) / 2 + M.l} y={H - 0} textAnchor="middle" className={styles.axis}>ganho de produtividade na saturação (pp de PIB potencial por ano)</text>
      </svg>
      <figcaption className={styles.cap}>Δ dívida/PIB em 2035 (pp) vs. cenário pragmático. O efeito é praticamente proporcional à suposição.</figcaption>
    </figure>
  )
}

/** Como as curvas de adoção entram no macro: a velocidade vem do ajuste; o tamanho do ganho é suposição rotulada. */
export function MacroIntegration({ im }: { im: Macro }) {
  const dif: Any = im.difusao_derivada_das_curvas ?? {}
  const res: Any = im.resultados_2035 ?? {}
  const ref: Any = im.referencia_pragmatico ?? {}
  const sens: Any[] = im.sensibilidade ?? []
  const assumed = (res.base?.tech_productivity_pp_ano as number | undefined) ?? null
  const rows = (year: '2035' | '2038') => SC.map((d) => ({ d, y: res[d]?.[year] as Any | undefined })).filter((r) => r.y)
  const dur: Any = dif.duracoes_por_curva ?? {}
  return (
    <div className={styles.stack}>
      <InlineNote id="futuro-suposicao" tone="warn" dismissible={false} baseId="futuros" title="O tamanho do ganho é suposição, não resultado.">
        {String(im.suposicao_produtividade ?? '')}
      </InlineNote>
      <div className={styles.cards}>
        {SC.map((d) => {
          const c: Any = dif.cenarios?.[d] ?? {}
          return (
            <article key={d} className={`card ${styles.card}`}>
              <header className={styles.head}>
                <h3 className={styles.title} style={{ color: COLOR[d] }}>{d}</h3>
                <Badge>{c.duracao_10_90_anos != null ? `${fNum1(c.duracao_10_90_anos)} anos de 10% a 90%` : '—'}</Badge>
              </header>
              <p className={styles.muted}>Velocidade derivada das curvas ajustadas aos dados do Brasil (3º quartil / mediana / 1º quartil das durações).</p>
            </article>
          )
        })}
      </div>
      <div className={styles.two}>
        <section className={`card ${styles.pad}`}>
          <h3 className={styles.title}>Efeito sobre o cenário pragmático (mediana das diferenças pareadas)</h3>
          {(['2035', '2038'] as const).map((yr) => (
            <div key={yr} className={styles.wrapT}>
              <p className={styles.lbl}>{yr} · referência: dívida {fNum1(ref[yr]?.debt ?? NaN)}% · Selic {fNum1(ref[yr]?.selic ?? NaN)}% · IPCA {fNum1(ref[yr]?.ipca ?? NaN)}% · PIB {fNum1(ref[yr]?.gdp ?? NaN)}%</p>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Difusão</th>
                    <th scope="col" className={styles.n}>Dívida/PIB</th>
                    <th scope="col" className={styles.n}>Selic</th>
                    <th scope="col" className={styles.n}>IPCA</th>
                    <th scope="col" className={styles.n}>PIB a.a.</th>
                  </tr>
                </thead>
                <tbody>
                  {rows(yr).map(({ d, y }) => (
                    <tr key={d}>
                      <td><b style={{ color: COLOR[d] }}>{d}</b></td>
                      <td className={styles.n}>{fSigned1(y?.debt?.delta_vs_pragmatico ?? 0)} pp</td>
                      <td className={styles.n}>{fSigned1(y?.selic?.delta_vs_pragmatico ?? 0)} pp</td>
                      <td className={styles.n}>{fSigned1(y?.ipca?.delta_vs_pragmatico ?? 0)} pp</td>
                      <td className={styles.n}>{fSigned1(y?.gdp?.delta_vs_pragmatico ?? 0)} pp</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <p className={styles.muted}>{String(im.leitura ?? '')}</p>
        </section>
        <section className={`card ${styles.pad}`}>
          <h3 className={styles.title}>Sensibilidade ao ganho assumido</h3>
          {sens.length > 0 ? <Sensibilidade sens={sens} assumed={assumed} /> : <p className={styles.muted}>Sem varredura publicada.</p>}
          <p className={styles.muted}>A faixa p10–p90 da própria dívida é de ±6 pp e não inclui a incerteza sobre o tamanho do ganho.</p>
        </section>
      </div>
      {Object.keys(dur).length > 0 && (
        <details className={`card ${styles.pad}`}>
          <summary>Duração de 10% a 90% do teto, por curva usada ({Object.keys(dur).length})</summary>
          <ul className={styles.dur}>
            {Object.entries(dur).map(([id, v]) => (
              <li key={id}><span>{id}</span> <b className="num">{fNum1(v as number)} anos</b></li>
            ))}
          </ul>
          <p className={styles.muted}>Internet e celular entram com durações longas porque só mostram a cauda de uma curva saturada: a derivação depende de quais curvas entram.</p>
        </details>
      )}
    </div>
  )
}

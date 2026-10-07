import { useMemo, useState } from 'react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { BasisSeal } from '@/components/molecules/BasisSeal'
import { editCell, pct, runChain, type Mat } from '@/features/evolucoes/model'
import type { CenariosMacro, Evolucoes } from '@/features/evolucoes/schemas'
import styles from './ScenarioChain.module.css'

const COLORS: Record<string, string> = { lula: 'var(--st-julgamento)', pragmatico: 'var(--st-oficial)', hegemonia: 'var(--st-parcial)', extremo: 'var(--neg)' }
const SHORT: Record<string, string> = { lula: 'Lula', pragmatico: 'Pragmático', hegemonia: 'Hegemonia', extremo: 'Extremo' }
const num = (x: number, d = 1) => (Number.isNaN(x) ? '—' : x.toFixed(d).replace('.', ','))
const same = (a: Mat, b: Mat) => a.every((r, i) => r.every((v, j) => Math.abs(v - (b[i]?.[j] ?? 0)) < 1e-6))

export type ScenarioChainProps = { ev: Evolucoes; cm: CenariosMacro | null | undefined }

/** Cadeia de cenários com editor “e se?”: o usuário edita a matriz JULGADA; tudo é recalculado no navegador. */
export function ScenarioChain({ ev, cm }: ScenarioChainProps) {
  const cc = ev.cadeia_cenarios
  const judged = cc.matriz_julgada
  const variants = cc.sensibilidade?.variantes ?? {}
  const [P, setP] = useState<Mat>(() => judged.map((r) => r.slice()))
  const [preset, setPreset] = useState('julgada')
  const ref = useMemo(() => runChain(ev, cm, judged), [ev, cm, judged])
  const cur = useMemo(() => runChain(ev, cm, P), [ev, cm, P])
  const isRef = same(P, judged)
  const pubRef = cc.ruptura_regime_divida_acima_de_120.mistura_cadeia?.p_ruptura_ate_2038
  const macroPub = cc.macro_esperada?.cadeia
  const years = [2030, 2035, 2038]
  const anosMacro = macroPub?.debt?.anos ?? []

  const choose = (k: string) => {
    setPreset(k)
    setP((k === 'julgada' ? judged : (variants[k]?.matriz ?? judged)).map((r) => r.slice()))
  }
  const label = (k: string) => cc.rotulos[k] ?? k

  return (
    <div className={styles.root}>
      <header className={styles.head}>
        <div>
          <h3 className={styles.h}>Cadeia de cenários: e se a matriz fosse outra?</h3>
          <p className={styles.sub}>Quatro cenários de scenarios.py, um sorteio por ciclo eleitoral (2026 → 2030 → 2034 → 2038).</p>
        </div>
        <div className={styles.badges}>
          <Badge tone="warn">matriz = JULGAMENTO</Badge>
          <BasisSeal basis="modeled" />
        </div>
      </header>

      <p className={styles.warn}>
        <strong>Isto não é previsão.</strong> A matriz abaixo é uma premissa editável: só duas taxas têm âncora empírica (erosão {pct(cc.ancoras_empiricas?.eps, 1)} e recuperação {pct(cc.ancoras_empiricas?.rho, 1)} por ciclo de 4 anos, da matriz do Brasil); o resto é julgamento. Edite uma célula e o resto da linha se reajusta para somar 100%.
      </p>

      <div className={styles.controls}>
        <label className={styles.sel}>
          <span>Partir de</span>
          <select value={preset} onChange={(e) => choose(e.target.value)}>
            <option value="julgada">Matriz julgada (referência publicada)</option>
            {Object.keys(variants).filter((k) => !k.startsWith('julgada')).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>
        <Button variant="ghost" size="sm" onClick={() => choose('julgada')} disabled={isRef}>Restaurar a julgada</Button>
      </div>

      <div className={styles.matrixWrap}>
        <table className={styles.matrix}>
          <caption className="sr-only">Matriz de transição entre cenários por ciclo eleitoral. Cada linha soma 100%.</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.corner}>se o ciclo é… ↓ · o próximo é… →</th>
              {cc.cenarios.map((k) => (
                <th key={k} scope="col"><i style={{ background: COLORS[k] }} /> {SHORT[k] ?? k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cc.cenarios.map((from, i) => (
              <tr key={from}>
                <th scope="row"><i style={{ background: COLORS[from] }} /> {SHORT[from] ?? from}</th>
                {cc.cenarios.map((to, j) => (
                  <td key={to}>
                    <label>
                      <span className="sr-only">{`De ${label(from)} para ${label(to)}, em %`}</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step={1}
                        value={Math.round((P[i]?.[j] ?? 0) * 1000) / 10}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          if (Number.isFinite(v)) setP((m) => editCell(m, i, j, v / 100))
                        }}
                        className={i === j ? styles.diag : undefined}
                      />
                    </label>
                    <span className={styles.pct}>%</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section aria-label="Ocupação por ciclo" className={styles.block}>
        <h4 className={styles.h4}>Ocupação esperada por ciclo</h4>
        <ul className={styles.legend}>
          {cc.cenarios.map((k) => (
            <li key={k}><i style={{ background: COLORS[k] }} /> {label(k)}</li>
          ))}
        </ul>
        <div className={styles.bars}>
          {cur.occ.map((row, c) => (
            <div key={c} className={styles.barRow}>
              <span className={styles.yr}>{cc.ciclos[c]}</span>
              <div className={styles.bar} role="img" aria-label={`${cc.ciclos[c]}: ${cc.cenarios.map((k, i) => `${SHORT[k]} ${pct(row[i])}`).join(', ')}`}>
                {row.map((v, i) => (
                  <span key={i} style={{ width: `${v * 100}%`, background: COLORS[cc.cenarios[i] as string] }} title={`${label(cc.cenarios[i] as string)}: ${pct(v, 1)}`}>
                    {v >= 0.09 ? pct(v) : ''}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        {cc.nota_ciclos && <p className={styles.note}>{cc.nota_ciclos}</p>}
      </section>

      <section aria-label="Probabilidade de ruptura de regime da dívida" className={styles.kpis}>
        <div className={styles.kpi}>
          <span className={styles.kl}>P(dívida &gt; 120% do PIB até 2038)</span>
          <strong className={styles.kv}>{pct(cur.rupturaAte)}</strong>
          <span className={styles.kn}>
            {isRef ? `matriz julgada (publicado: ${pct(pubRef)})` : `vs. ${pct(ref.rupturaAte)} na julgada (${cur.rupturaAte >= ref.rupturaAte ? '+' : '−'}${num(Math.abs(cur.rupturaAte - ref.rupturaAte) * 100)} pp)`}
          </span>
          <svg viewBox="0 0 120 34" className={styles.spark} role="img" aria-label="Probabilidade acumulada de ruptura, 2027 a 2038">
            <path d={Array.from({ length: 12 }, (_, k) => `${k ? 'L' : 'M'}${(k / 11) * 118 + 1},${32 - (cur.ruptura[2027 + k] ?? 0) * 30}`).join('')} fill="none" stroke="var(--neg)" strokeWidth="2" strokeLinecap="round" />
            {!isRef && <path d={Array.from({ length: 12 }, (_, k) => `${k ? 'L' : 'M'}${(k / 11) * 118 + 1},${32 - (ref.ruptura[2027 + k] ?? 0) * 30}`).join('')} fill="none" stroke="var(--text-subtle)" strokeWidth="1.2" strokeDasharray="3 3" />}
          </svg>
        </div>
        <p className={styles.note}>
          Acima de 120% de dívida/PIB o modelo deixa de valer como trajetória: é <strong>ruptura de regime</strong> (reestruturação, dominância fiscal, ajuste forçado), não um caminho a extrapolar. A probabilidade mistura as curvas por cenário com os pesos do mandato; ignora a dívida herdada na troca.
        </p>
      </section>

      {cm && (
        <section aria-label="Macro esperada" className={styles.block}>
          <h4 className={styles.h4}>Macro: média das medianas por cenário, ponderada pela ocupação</h4>
          <div className={styles.tableWrap}>
            <table className={styles.macro}>
              <caption className="sr-only">Dívida/PIB, Selic, IPCA e crescimento do PIB em 2030, 2035 e 2038 (média das medianas dos cenários, ponderada pela ocupação).</caption>
              <thead>
                <tr><th scope="col">Ano</th><th scope="col">Dívida/PIB</th><th scope="col">Selic</th><th scope="col">IPCA</th><th scope="col">PIB a.a.</th></tr>
              </thead>
              <tbody>
                {years.map((y) => {
                  const m = cur.macro[y]
                  const ix = anosMacro.indexOf(y)
                  const pub = (v: 'debt' | 'selic' | 'ipca' | 'gdp') => macroPub?.[v]?.p50[ix]
                  return (
                    <tr key={y}>
                      <th scope="row">{y}</th>
                      {(['debt', 'selic', 'ipca', 'gdp'] as const).map((v) => (
                        <td key={v}>
                          <strong>{m ? num(m[v]) : '—'}{v === 'debt' ? '%' : ''}</strong>
                          {isRef && pub(v) != null && <span className={styles.pub}>mistura publicada: {num(pub(v) as number)}</span>}
                          {v === 'debt' && m && m.debt > 120 && <Badge tone="neg">&gt; 120%: ruptura</Badge>}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className={styles.note}>
            Aproximação: a mediana de uma mistura não é a mistura das medianas. A diferença para a mistura exata publicada aparece em cinza. Níveis acima de 120% não são projeção.
          </p>
        </section>
      )}
      {!cm && <p className={styles.note}>Trajetórias por cenário (<code>cenarios_macro.json</code>) indisponíveis: o editor mostra só ocupação e probabilidade de ruptura.</p>}

      {cc.origem_da_matriz && (
        <details className={styles.det}>
          <summary>De onde vem a matriz julgada</summary>
          <p>{cc.origem_da_matriz}</p>
          {cc.cenarios.map((k) => (
            <p key={k} className={styles.subtle}>{SHORT[k]}: {label(k)}</p>
          ))}
        </details>
      )}
    </div>
  )
}

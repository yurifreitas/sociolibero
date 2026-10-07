import { useMemo, useState } from 'react'
import { Badge } from '@/components/atoms/Badge'
import { InlineNote } from '@/components/molecules/InlineNote'
import { PageGate } from '@/components/molecules/PageGate'
import { Seal } from '@/components/molecules/Seal'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { SegmentedControl } from '@/components/molecules/SegmentedControl'
import { StatTile } from '@/components/molecules/StatTile'
import { Tabs } from '@/components/molecules/Tabs'
import { ClimateSeries, type RefLine } from '@/components/organisms/ClimateSeries'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useClima } from '@/features/conhecimento/hooks'
import { fmtIC, toYear } from '@/features/conhecimento/model'
import type { Clima } from '@/features/conhecimento/schemas'
import { fNum1, fNum2, fSigned1 } from '@/lib/format'
import { useUrlState } from '@/lib/useUrlState'
import k from './know.module.css'
import styles from './ClimaPage.module.css'

type Aba = 'series' | 'relacoes' | 'episodios' | 'cenarios' | 'macro'
type Grupo = 'todos' | 'enso' | 'clima' | 'fogo' | 'energia' | 'economia'
const GRUPO_DE = (id: string): Exclude<Grupo, 'todos'> =>
  /^(oni|nino|mei)/.test(id) ? 'enso' : /^(temp|chuva)/.test(id) ? 'clima' : /^(focos|deter|desmat)/.test(id) ? 'fogo' : /^(ear|ena|cmo)/.test(id) ? 'energia' : 'economia'
const GRUPO_LABEL: Record<Grupo, string> = { todos: 'Todas', enso: 'El Niño / La Niña', clima: 'Temperatura e chuva', fogo: 'Fogo e floresta', energia: 'Energia', economia: 'Economia' }
const CURADAS = ['oni_mensal', 'temp_brasil_cru_anomalia', 'chuva_brasil_cru_anomalia_pct', 'focos_amazonia_anual', 'desmatamento_amazonia_prodes', 'ear_se_fim_nov', 'cmo_se_anual', 'pib_agro_var', 'ipca_alimentacao_bcb', 'pib_total_var']
const REFS: Record<string, RefLine[]> = {
  oni_mensal: [{ y: 0.5, label: 'El Niño +0,5' }, { y: -0.5, label: 'La Niña −0,5' }],
  nino34_hadisst_mensal: [{ y: 0, label: '0' }],
  temp_brasil_cru_anomalia: [{ y: 0, label: 'média 51–80' }],
  chuva_brasil_cru_anomalia_pct: [{ y: 0, label: 'média' }],
  pib_agro_var: [{ y: 0, label: '0' }],
  pib_total_var: [{ y: 0, label: '0' }],
}
type Any = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function Fontes({ f }: { f?: { titulo: string; url?: string | null; verificado?: boolean | null }[] | null }) {
  if (!f?.length) return null
  return (
    <ul className={k.src} aria-label="Fontes">
      {f.map((s) => (
        <li key={s.titulo}>
          <Seal v={s.verificado} />
          {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.titulo}</a> : <span>{s.titulo}</span>}
        </li>
      ))}
    </ul>
  )
}

/** Intervalo de confiança de 95% no eixo [−1, 1], com a linha do zero: se o intervalo cruza o zero, nada se sustenta. */
function IC({ r, ic, hit }: { r?: number | null; ic?: number[] | null; hit: boolean }) {
  const W = 168
  const X = (v: number) => ((Math.max(-1, Math.min(1, v)) + 1) / 2) * (W - 8) + 4
  if (r == null || !ic || ic.length < 2) return <span className={k.muted}>—</span>
  return (
    <svg viewBox={`0 0 ${W} 22`} width={W} height={22} role="img" aria-label={`r = ${fNum2(r)}, intervalo de 95% de ${fNum2(ic[0] as number)} a ${fNum2(ic[1] as number)}${hit ? ', exclui o zero' : ', cruza o zero'}`}>
      <line x1={X(-1)} x2={X(1)} y1={11} y2={11} className={styles.axis} />
      <line x1={X(0)} x2={X(0)} y1={3} y2={19} className={styles.zero} />
      <line x1={X(ic[0] as number)} x2={X(ic[1] as number)} y1={11} y2={11} className={hit ? styles.icHit : styles.ic} />
      <circle cx={X(r)} cy={11} r={3.6} className={hit ? styles.rHit : styles.r} />
    </svg>
  )
}

function Relacoes({ c, labels }: { c: Clima; labels: Map<string, string> }) {
  const [soHit, setSoHit] = useState<'todas' | 'hit'>('todas')
  const rs = c.relacoes ?? []
  const hitIds = new Set(c.meta?.resumo_testes?.ids_ic95_exclui_zero ?? [])
  const rows = rs.filter((r) => soHit === 'todas' || hitIds.has(r.id))
  const sem = rs.filter((r) => /pib_agro|alimenta/.test(r.economia))
  const semHit = sem.filter((r) => hitIds.has(r.id)).length
  const t = c.meta?.resumo_testes
  return (
    <div className={k.stack}>
      <section className={k.callout} aria-label="Leitura honesta">
        <h3>
          {t?.ic95_exclui_zero ?? '—'} de {t?.testes_publicados ?? '—'} intervalos excluem o zero; por acaso se esperaria ~{fNum1(t?.esperado_por_acaso_se_nenhuma_relacao_real ?? 0)}
        </h3>
        <p className={k.text}>{t?.leitura}</p>
        <p className={k.text}>
          <b>O desenho não liga clima a PIB agropecuário nem a inflação de alimentos.</b>{' '}
          {semHit === 0
            ? `Entre as ${sem.length} relações dessas famílias, nenhum intervalo exclui o zero.`
            : `Entre as ${sem.length} relações dessas famílias, ${semHit} têm intervalo que exclui o zero, sem mecanismo físico claro (veja a tabela).`}{' '}
          Os padrões que se mantêm têm mecanismo físico claro: El Niño × chuva, hidrologia × custo da energia, El Niño × focos na Amazônia.
        </p>
      </section>
      <div className={k.filters}>
        <SegmentedControl<'todas' | 'hit'> label="Relações exibidas" value={soHit} onChange={setSoHit} options={[{ value: 'todas', label: `Todas (${rs.length})` }, { value: 'hit', label: `Só as que excluem o zero (${hitIds.size})` }]} />
      </div>
      <div className={`card ${k.tableWrap}`}>
        <table className={k.table}>
          <thead>
            <tr>
              <th scope="col">Clima → economia/energia</th>
              <th scope="col">Período</th>
              <th scope="col">Defasagem</th>
              <th scope="col" className={k.n}>r</th>
              <th scope="col">IC 95% (−1 … +1)</th>
              <th scope="col" className={k.n}>n</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const hit = hitIds.has(r.id)
              return (
                <tr key={r.id} className={hit ? k.hi : undefined}>
                  <td>
                    <b>{labels.get(r.clima) ?? r.clima}</b> → {labels.get(r.economia) ?? r.economia}
                    <details className={styles.det}>
                      <summary>Leitura e limites</summary>
                      {r.leitura && <p>{r.leitura}</p>}
                      {r.limites && <p className={k.muted}>{r.limites}</p>}
                    </details>
                  </td>
                  <td>{r.periodo ? `${r.periodo[0]}–${r.periodo[1]}` : '—'}</td>
                  <td>{r.defasagem ?? '—'}</td>
                  <td className={k.n}>{r.estatistica?.valor != null ? fNum2(r.estatistica.valor) : '—'}</td>
                  <td>
                    <IC r={r.estatistica?.valor} ic={r.estatistica?.ic95} hit={hit} />
                    <span className="sr-only">{fmtIC(r.estatistica?.ic95)}</span>
                  </td>
                  <td className={k.n}>{r.estatistica?.n ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className={k.muted}>
        Pearson com IC95 por bootstrap em blocos móveis. Destaque = o intervalo exclui o zero. Séries curtas e autocorrelacionadas; não controla câmbio, commodities, juros nem política. Correlação não é
        causalidade.
      </p>
    </div>
  )
}

function Macro({ c }: { c: Clima }) {
  const im: Any = c.integracao_macro ?? {}
  const sev: Any = im.severidades_suposicao ?? {}
  const por: Any = im.por_cenario_politico ?? {}
  const sens: Any[] = im.sensibilidade ?? []
  const NAMES = ['leve', 'moderado', 'severo']
  return (
    <div className={k.stack}>
      <InlineNote id="clima-macro-suposicao" tone="warn" dismissible={false} baseId="clima" title="Severidade é suposição rotulada.">
        {String(im.suposicao ?? 'As severidades leve, moderada e severa não são estimativas deste projeto nem previsões; mostram a sensibilidade do modelo.')}
      </InlineNote>
      <div className={k.grid2}>
        <section className={`card ${k.pad}`}>
          <h3 className={k.title}>Efeito em 2035 sobre o cenário pragmático</h3>
          <div className={`${k.tableWrap}`}>
            <table className={k.table}>
              <thead>
                <tr>
                  <th scope="col">Severidade</th>
                  <th scope="col" className={k.n}>Dívida/PIB</th>
                  <th scope="col" className={k.n}>Selic</th>
                  <th scope="col" className={k.n}>IPCA</th>
                  <th scope="col" className={k.n}>PIB (nível)</th>
                </tr>
              </thead>
              <tbody>
                {NAMES.filter((n) => sev[n]?.['2035']).map((n) => {
                  const y = sev[n]['2035']
                  return (
                    <tr key={n}>
                      <td>
                        <b>{n}</b>
                        <div className={k.muted}>choque {sev[n].alavancas?.climate_shock} pp/ano · prêmio {sev[n].alavancas?.climate_premium} pp</div>
                      </td>
                      <td className={k.n}>{fSigned1(y.debt?.delta_mediano ?? 0)} pp</td>
                      <td className={k.n}>{fSigned1(y.selic?.delta_mediano ?? 0)} pp</td>
                      <td className={k.n}>{fSigned1(y.ipca?.delta_mediano ?? 0)} pp</td>
                      <td className={k.n}>{fSigned1(y.nivel_pib_vs_referencia_pct ?? 0)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className={k.muted}>Medianas das diferenças pareadas por trajetória. Efeito permanente sobre o nível do PIB.</p>
        </section>
        <section className={`card ${k.pad}`}>
          <h3 className={k.title}>Δ dívida/PIB em 2035 por cenário político (pp)</h3>
          <div className={k.tableWrap}>
            <table className={k.table}>
              <thead>
                <tr>
                  <th scope="col">Cenário</th>
                  {NAMES.map((n) => <th key={n} scope="col" className={k.n}>{n}</th>)}
                </tr>
              </thead>
              <tbody>
                {Object.entries(por).map(([cen, v]) => (
                  <tr key={cen}>
                    <td><b>{cen}</b></td>
                    {NAMES.map((n) => <td key={n} className={k.n}>{(v as Any)[n]?.delta_divida_pib_2035_pp != null ? fSigned1((v as Any)[n].delta_divida_pib_2035_pp) : '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={k.muted}>O mesmo choque pesa mais onde a dívida já é mais frágil.</p>
        </section>
      </div>
      <section className={`card ${k.pad}`}>
        <h3 className={k.title}>Âncoras de ordem de grandeza (contas grosseiras)</h3>
        <ul className={k.list}>
          {((im.ancoras_ordem_de_grandeza ?? []) as Any[]).map((a) => (
            <li key={String(a.fonte)}>
              <b>{a.fonte}</b>: {a.dado} — equivale a ~{Array.isArray(a.equivale_a_pp_por_ano) ? a.equivale_a_pp_por_ano.join('–') : a.equivale_a_pp_por_ano} pp por ano. <span className={k.muted}>{a.conta}</span>
            </li>
          ))}
        </ul>
      </section>
      {sens.length > 0 && (
        <details className={`card ${k.pad}`}>
          <summary>Grade de sensibilidade ({sens.length} combinações)</summary>
          <div className={k.tableWrap}>
            <table className={k.table}>
              <thead>
                <tr>
                  <th scope="col" className={k.n}>Choque pp/ano</th>
                  <th scope="col" className={k.n}>Prêmio pp</th>
                  <th scope="col" className={k.n}>Δ dívida/PIB</th>
                  <th scope="col" className={k.n}>Δ Selic</th>
                  <th scope="col" className={k.n}>PIB nível</th>
                </tr>
              </thead>
              <tbody>
                {sens.map((s, i) => (
                  <tr key={i}>
                    <td className={k.n}>{s.climate_shock_pp_ano}</td>
                    <td className={k.n}>{s.climate_premium_pp}</td>
                    <td className={k.n}>{fSigned1(s.delta_divida_pib_2035_pp)}</td>
                    <td className={k.n}>{fSigned1(s.delta_selic_2035_pp)}</td>
                    <td className={k.n}>{fSigned1(s.nivel_pib_2035_vs_referencia_pct)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  )
}

function Content({ c }: { c: Clima }) {
  const { get, update } = useUrlState()
  const aba: Aba = (['series', 'relacoes', 'episodios', 'cenarios', 'macro'] as const).find((a) => a === get('aba')) ?? 'series'
  const grupo: Grupo = (Object.keys(GRUPO_LABEL) as Grupo[]).find((g) => g === get('g')) ?? 'todos'
  const [todas, setTodas] = useState(false)
  const byId = useMemo(() => new Map(c.series.map((s) => [s.id, s])), [c.series])
  const labels = useMemo(() => new Map(c.series.map((s) => [s.id, s.rotulo])), [c.series])
  const oni = byId.get('oni_mensal')
  const lastOni = oni?.pontos.filter((p) => p[1] != null).slice(-1)[0]
  const tendRec = c.tendencias?.find((t) => t.periodo?.[0] === 1980)
  const t = c.meta?.resumo_testes
  const lista = useMemo(() => {
    const base = todas || grupo !== 'todos' ? c.series : CURADAS.map((id) => byId.get(id)).filter((s): s is NonNullable<typeof s> => !!s)
    return base.filter((s) => grupo === 'todos' || GRUPO_DE(s.id) === grupo)
  }, [c.series, byId, grupo, todas])
  const grupos = (Object.keys(GRUPO_LABEL) as Grupo[]).map((g) => ({ value: g, label: `${GRUPO_LABEL[g]}${g === 'todos' ? ` (${c.series.length})` : ` (${c.series.filter((s) => GRUPO_DE(s.id) === g).length})`}` }))
  const eps = c.episodios ?? []
  const cen = c.cenarios_futuros ?? []
  const custos = c.custos_economicos ?? []
  const secas = c.secas_nordeste ?? []

  return (
    <div className={k.stack}>
      <div className={k.stats}>
        <StatTile
          label="ONI (El Niño), último mês"
          value={lastOni ? `${(lastOni[1] as number) >= 0 ? '+' : ''}${fNum2(lastOni[1] as number)} °C` : '—'}
          hint={lastOni ? `média móvel de 3 meses, centrada em ${String(lastOni[0]).slice(0, 7)} · acima de +0,5 °C = El Niño` : undefined}
          tone={lastOni && (lastOni[1] as number) >= 0.5 ? 'neg' : 'neutral'}
        />
        <StatTile label="Temperatura do Brasil desde 1980" value={tendRec?.por_decada != null ? `+${fNum2(tendRec.por_decada)} °C/década` : '—'} hint={tendRec?.ic95 ? `IC95 ${fNum2(tendRec.ic95[0] as number)} a ${fNum2(tendRec.ic95[1] as number)} · CRU TS` : undefined} />
        <StatTile label="Relações com IC que exclui o zero" value={`${t?.ic95_exclui_zero ?? '—'} de ${t?.testes_publicados ?? '—'}`} hint={`por acaso: ~${fNum1(t?.esperado_por_acaso_se_nenhuma_relacao_real ?? 0)}`} tone="neutral" />
        <StatTile label="Séries abertas" value={String(c.series.length)} hint="com fonte, hash e qualidade; lacunas declaradas" />
      </div>
      <InlineNote id="clima-aviso" tone="warn" dismissible={false} baseId="clima" title="Correlação de séries curtas não é causalidade.">
        {c.meta?.aviso ?? 'As relações são descritivas; só as de mecanismo físico claro se sustentam.'}
      </InlineNote>
      <Tabs<Aba>
        label="Seções de clima"
        value={aba}
        onChange={(a) => update({ aba: a === 'series' ? null : a })}
        tabs={[
          { key: 'series', label: 'Séries', count: c.series.length },
          { key: 'relacoes', label: 'Relações (IC95)', count: c.relacoes?.length ?? 0 },
          { key: 'episodios', label: 'Episódios', count: eps.length },
          { key: 'cenarios', label: 'Cenários e custos', count: cen.length + custos.length },
          { key: 'macro', label: 'Choque no macro' },
        ]}
      >
        {aba === 'series' && (
          <div className={k.stack}>
            <div className={k.filters}>
              <SegmentedControl<Grupo> label="Grupo de séries" value={grupo} onChange={(g) => update({ g: g === 'todos' ? null : g })} options={grupos} />
              {grupo === 'todos' && (
                <button type="button" className={styles.more} onClick={() => setTodas((v) => !v)} aria-pressed={todas}>
                  {todas ? 'Mostrar só as principais' : `Ver todas as ${c.series.length}`}
                </button>
              )}
            </div>
            <p className={k.muted}>{lista.length} séries. Passe o cursor para ver o valor de cada período; “Dados em tabela” traz o equivalente acessível.</p>
            <div className={k.grid}>
              {lista.map((s) => (
                <ClimateSeries key={s.id} s={s} refs={REFS[s.id]} />
              ))}
            </div>
          </div>
        )}
        {aba === 'relacoes' && <Relacoes c={c} labels={labels} />}
        {aba === 'episodios' && (
          <div className={k.stack}>
            <div className={k.grid2}>
              {eps.map((e) => (
                <article key={e.id} className={`card ${k.pad}`}>
                  <header className={k.head}>
                    <div>
                      <p className={k.lbl}>{String(e.ano ?? '')}</p>
                      <h3 className={k.title}>{e.titulo}</h3>
                    </div>
                    <Seal v={e.verificado} />
                  </header>
                  {e.evento_climatico && <p className={k.text}><b>Clima.</b> {e.evento_climatico}</p>}
                  {e.efeitos_economicos && <p className={k.text}><b>Efeitos econômicos.</b> {e.efeitos_economicos}</p>}
                  {e.efeitos_humanos && <p className={k.text}><b>Efeitos humanos.</b> {e.efeitos_humanos}</p>}
                  {e.contagem_ou_estimativa && <p className={k.text}><b>Contagem ou estimativa.</b> {e.contagem_ou_estimativa}</p>}
                  {e.incerteza && <p className={k.muted}><b>Incerteza.</b> {e.incerteza}</p>}
                  <Fontes f={e.fontes} />
                </article>
              ))}
            </div>
            {secas.length > 0 && (
              <details className={`card ${k.pad}`}>
                <summary>Secas do Nordeste listadas na literatura ({secas.length}; fonte única: Marengo et al. 2017)</summary>
                <ul className={k.chips}>
                  {secas.map((s, i) => (
                    <li key={i} title={s.observacao ?? undefined}>{String(s.periodo)}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
        {aba === 'cenarios' && (
          <div className={k.stack}>
            <h3 className={k.title}>Projeções físicas (IPCC AR6, PBMC, Embrapa, literatura)</h3>
            <div className={k.grid}>
              {cen.map((s) => (
                <article key={s.id} className={`card ${k.pad}`}>
                  <header className={k.head}>
                    <h4 className={k.title}>{s.variavel}</h4>
                    <Seal v={s.verificado} />
                  </header>
                  <p className={k.text}>{s.faixa}</p>
                  <div className={k.chips}>
                    {s.ssp && <Badge>SSP: {s.ssp}</Badge>}
                    {s.horizonte && <Badge>{s.horizonte}</Badge>}
                    {s.regiao && <Badge tone="brand">{s.regiao}</Badge>}
                  </div>
                  {s.observacao && <p className={k.muted}>{s.observacao}</p>}
                  <p className={k.muted}>
                    {s.fonte_url ? <a href={s.fonte_url} target="_blank" rel="noreferrer">{s.fonte}</a> : s.fonte}
                  </p>
                </article>
              ))}
            </div>
            <InlineNote id="clima-custos-somaveis" tone="info" dismissible={false} title="Estimativas de custo medem coisas diferentes e não são somáveis.">
              Cada estudo usa horizonte, cenário de aquecimento e conceito de perda próprios (PIB cumulativo, nível em 2050, perda anual). Compare ordens de grandeza, nunca some.
            </InlineNote>
            <h3 className={k.title}>Custos econômicos publicados</h3>
            <div className={k.grid}>
              {custos.map((s) => (
                <article key={s.id} className={`card ${k.pad}`}>
                  <header className={k.head}>
                    <h4 className={k.title}>{s.escopo}</h4>
                    <Seal v={s.verificado} />
                  </header>
                  <p className={k.text}><b>{s.estimativa}</b></p>
                  <dl className={k.kv}>
                    {s.horizonte && (<><dt>Horizonte</dt><dd>{s.horizonte}</dd></>)}
                    {s.cenario && (<><dt>Cenário</dt><dd>{s.cenario}</dd></>)}
                  </dl>
                  {s.observacao && <p className={k.muted}>{s.observacao}</p>}
                  <p className={k.muted}>{s.fonte_url ? <a href={s.fonte_url} target="_blank" rel="noreferrer">{s.fonte}</a> : s.fonte}</p>
                </article>
              ))}
            </div>
          </div>
        )}
        {aba === 'macro' && <Macro c={c} />}
      </Tabs>
    </div>
  )
}

export default function ClimaPage() {
  const q = useClima()
  void toYear
  return (
    <PageTemplate>
      <SectionHeader level={1} title="Clima e economia" description="O que o clima explica e o que não explica: séries abertas, relações com intervalo de confiança, episódios documentados, cenários do IPCC e o choque no modelo macro (suposição rotulada)." />
      <PageGate query={q} file="clima.json">
        {(c) => <Content c={c} />}
      </PageGate>
    </PageTemplate>
  )
}

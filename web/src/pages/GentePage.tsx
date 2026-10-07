import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { Select } from '@/components/atoms/Select'
import { Skeleton } from '@/components/atoms/Skeleton'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { EmptyState } from '@/components/molecules/EmptyState'
import { ErrorState } from '@/components/molecules/ErrorState'
import { Field } from '@/components/molecules/Field'
import { IndicatorCard } from '@/components/molecules/IndicatorCard'
import { InlineNote } from '@/components/molecules/InlineNote'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { CycleRuler } from '@/components/organisms/CycleRuler'
import { SeriesMultiples } from '@/components/organisms/SeriesMultiples'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useChrome } from '@/features/chrome/ChromeContext'
import { useHistoria } from '@/features/data/hooks'
import { useEconomiaHistorica, useFatorHumano, useHumanoNacional, useSeriesHistoricas } from '@/features/gente/hooks'
import type { Serie } from '@/features/gente/schemas'
import { useUrlState } from '@/lib/useUrlState'
import styles from './GentePage.module.css'

const SERIES_GROUPS: { key: string; label: string; test: RegExp }[] = [
  { key: 'economia', label: 'Economia', test: /^(pib_|ipca|igp_di|salario|divida)/ },
  { key: 'desigualdade', label: 'Desigualdade e pobreza', test: /^(gini|top1|pobreza|inseg_alimentar|desocupacao)/ },
  { key: 'saude', label: 'Saúde e educação', test: /^(expectativa|mortalidade|analfabetismo)/ },
  { key: 'violencia', label: 'Violência e território', test: /^(homicidios|desmatamento)/ },
  { key: 'escravizacao', label: 'Escravização', test: /^africanos/ },
]
const groupOf = (id: string) => SERIES_GROUPS.find((g) => g.test.test(id))?.key ?? 'outras'

const NV = /\s*\(não verificado\)\.?/gi
/** Texto com a marca “(não verificado)” convertida em selo, para nunca passar despercebida. */
function Txt({ children }: { children: string | null | undefined }) {
  if (!children) return null
  const flagged = NV.test(children)
  NV.lastIndex = 0
  const clean = children.replace(NV, '').trim()
  return (
    <>
      {clean} {flagged && <Badge tone="warn">não verificado</Badge>}
    </>
  )
}
const List = ({ items, tone }: { items: string[] | null | undefined; tone: 'pos' | 'neg' }) => (
  <ul className={styles.list}>
    {(items ?? []).map((t) => (
      <li key={t} data-tone={tone}>
        <Icon name={tone === 'pos' ? 'check' : 'alert'} size={14} />
        <span><Txt>{t}</Txt></span>
      </li>
    ))}
    {(!items || items.length === 0) && <li className={styles.none}>Sem itens neste ciclo.</li>}
  </ul>
)
const Block = ({ title, children, id }: { title: string; children: ReactNode; id?: string }) => (
  <section className={styles.block} aria-labelledby={id}>
    <h3 id={id} className={styles.bh}>{title}</h3>
    {children}
  </section>
)

export default function GentePage() {
  const { get, update } = useUrlState()
  const { openDrawer } = useChrome()
  const eco = useEconomiaHistorica()
  const fh = useFatorHumano()
  const hn = useHumanoNacional()
  const hist = useHistoria('historia.json')
  const seriesPath = import.meta.env.DEV && get('series') ? (get('series') as string) : 'series_historicas.json'
  const ser = useSeriesHistoricas(seriesPath)
  const cls = get('cl')

  const ciclos = eco.data?.ciclos ?? []
  const cId = ciclos.some((c) => c.id === get('c')) ? (get('c') as string) : (ciclos[0]?.id ?? '')
  const ci = ciclos.findIndex((c) => c.id === cId)
  const ciclo = ciclos[ci]
  const eventById = useMemo(() => new Map((hist.data?.eventos ?? []).map((e) => [e.id, e])), [hist.data])
  const indicadores = (fh.data?.indicadores ?? []).filter((i) => i.ciclo === cId)

  const homicidios: Serie | null = useMemo(() => {
    const s = hn.data?.series.taxa_homicidios?.brasil
    if (!s) return null
    const pontos = Object.entries(s).filter((e): e is [string, number] => e[1] != null).map(([y, v]) => [Number(y), v] as [number, number])
    return {
      id: 'homicidios-brasil',
      rotulo: 'Homicídios por 100 mil habitantes · Brasil',
      unidade: 'por 100 mil',
      cobertura: [pontos[0]?.[0] ?? 0, pontos[pontos.length - 1]?.[0] ?? 0],
      fonte: { nome: 'Atlas da Violência (Ipea/FBSP), via Arandu/trans — proveniência indireta', url: 'https://www.ipea.gov.br/atlasviolencia/' },
      notas: 'Série nacional fecha com o total publicado (2022–2024). O Atlas municipal de 2020 tem defeito na origem; não afeta esta série.',
      pontos,
    }
  }, [hn.data])
  const docSeries = ser.data?.series ?? []
  // a série de homicídios do arquivo de séries tem prioridade; a derivada de humano_nacional só entra se faltar
  const series = [...docSeries, ...(homicidios && !docSeries.some((x) => /homicid/.test(x.id)) ? [homicidios] : [])]
  const lacunas = (ser.data?.meta?.lacunas ?? []).map((l) => (typeof l === 'string' ? { serie: '', motivo: l } : { serie: l.serie ?? '', motivo: l.motivo ?? '' }))
  const groupCounts = SERIES_GROUPS.map((g) => ({ key: g.key, label: g.label, count: series.filter((x) => groupOf(x.id) === g.key).length })).filter((g) => g.count > 0)
  const sgParam = get('sg')
  const sg = groupCounts.some((g) => g.key === sgParam) ? (sgParam as string) : (groupCounts[0]?.key ?? '')
  const shownSeries = series.filter((x) => groupOf(x.id) === sg)
  const spans = ciclos.map((c) => ({ id: c.id, inicio: c.inicio, fim: c.fim }))

  if (eco.isError) return <ErrorState message={(eco.error as Error).message} onRetry={() => eco.refetch()} />
  const classe = eco.data?.classes?.find((c) => c.id === cls) ?? eco.data?.classes?.[0]

  return (
    <PageTemplate>
      <SectionHeader
        level={1}
        title="Economia & gente"
        description="Quatorze ciclos econômicos, do pau-brasil a 2026: o que cada um produziu, o que foi desperdiçado, quem ganhou, quem pagou a conta — e o custo humano que cabe em um número, com o que esse número não mede."
      />
      <InlineNote id="gente-conferencia" tone="warn" baseId="economia-historica" title="Leia com a régua de evidência.">
        Os ciclos vêm de fontes secundárias abertas e muitas linhas trazem “não verificado”; o custo humano tem só uma parte dos indicadores conferidos na fonte. Estimativas aparecem como faixa, nunca como valor firme.
      </InlineNote>

      {eco.isPending ? (
        <div className={styles.skel} aria-busy="true">
          <Skeleton height={72} style={{ borderRadius: 12 }} />
          <Skeleton height={32} width="55%" />
          <Skeleton height={120} style={{ borderRadius: 16 }} />
        </div>
      ) : !eco.data || ciclos.length === 0 ? (
        <EmptyState icon="users" title="Economia histórica ainda não publicada">
          O arquivo <code>economia_historica.json</code> não foi encontrado em <code>web/public/data/</code>.
        </EmptyState>
      ) : (
        <>
          <CycleRuler cycles={ciclos.map((c) => ({ id: c.id, rotulo: c.rotulo, inicio: c.inicio, fim: c.fim }))} value={cId} onChange={(id) => update({ c: id })} />

          {ciclo && (
            <section id="ciclo-painel" role="tabpanel" aria-labelledby={`ciclo-tab-${ciclo.id}`} className={styles.panel} key={ciclo.id}>
              <header className={styles.title}>
                <p className="eyebrow">Ciclo {ci + 1} de {ciclos.length} · {ciclo.inicio}–{ciclo.fim}</p>
                <h2 className={styles.h2}>{ciclo.rotulo}</h2>
                <p className={styles.motor}><Txt>{ciclo.motor_economico}</Txt></p>
                {ciclo.regioes && ciclo.regioes.length > 0 && (
                  <ul className={styles.chips} aria-label="Regiões">
                    {ciclo.regioes.map((r) => <li key={r}>{r}</li>)}
                  </ul>
                )}
              </header>

              <div className={styles.two}>
                <Block title="Potenciais" id="b-pot"><List items={ciclo.potenciais} tone="pos" /></Block>
                <Block title="Problemas estruturais" id="b-prob"><List items={ciclo.problemas} tone="neg" /></Block>
              </div>

              {ciclo.classes && ciclo.classes.length > 0 && (
                <Block title="Classes e grupos afetados" id="b-cl">
                  <div className={styles.cards}>
                    {ciclo.classes.map((c) => (
                      <article key={c.classe} className={`card ${styles.cl}`}>
                        <h4>{c.classe}</h4>
                        {c.posicao && <p className={styles.pos}><span>Posição</span> <Txt>{c.posicao}</Txt></p>}
                        {c.efeito && <p><span>Efeito</span> <Txt>{c.efeito}</Txt></p>}
                        {c.evidencia && <p className={styles.ev}><span>Evidência</span> <Txt>{c.evidencia}</Txt></p>}
                      </article>
                    ))}
                  </div>
                </Block>
              )}

              {ciclo.mudancas_drasticas && ciclo.mudancas_drasticas.length > 0 && (
                <Block title="Mudanças drásticas" id="b-md">
                  <ol className={styles.timeline}>
                    {ciclo.mudancas_drasticas.map((m) => (
                      <li key={m.id}>
                        <span className={styles.when}>{m.data ?? '—'}</span>
                        <div className={`card ${styles.md}`}>
                          <h4><Txt>{m.titulo}</Txt></h4>
                          <p className={styles.desc}><Txt>{m.descricao}</Txt></p>
                          <div className={styles.gl}>
                            {m.quem_ganhou && <p data-k="g"><span>Ganhou</span> <Txt>{m.quem_ganhou}</Txt></p>}
                            {m.quem_perdeu && <p data-k="p"><span>Perdeu</span> <Txt>{m.quem_perdeu}</Txt></p>}
                          </div>
                          {m.links_historia && m.links_historia.length > 0 && (
                            <ul className={styles.hlinks} aria-label="Eventos relacionados na História">
                              {m.links_historia.map((id) => (
                                <li key={id}>
                                  <Link to={`/historia?sel=ev:${id}`}>{eventById.get(id)?.titulo ?? id} <Icon name="arrowRight" size={12} /></Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </Block>
              )}

              <Block title="Custo humano" id="b-ch">
                {fh.isPending ? (
                  <Skeleton height={140} style={{ borderRadius: 16 }} />
                ) : indicadores.length > 0 ? (
                  <div className={styles.cards}>{indicadores.map((i) => <IndicatorCard key={i.id} i={i} />)}</div>
                ) : (
                  <p className={styles.empty}>
                    <Icon name="info" size={15} /> Nenhum indicador de custo humano com fonte confirmável para este ciclo. A lacuna é do inventário, não do fato: veja “Perguntas que os dados não respondem”, no fim da página.
                  </p>
                )}
              </Block>

              {ciclo.fontes && ciclo.fontes.length > 0 && (
                <Block title="Fontes do ciclo" id="b-fn">
                  <ul className={styles.fontes}>
                    {ciclo.fontes.map((f) => (
                      <li key={f.titulo + (f.url ?? '')}>
                        {f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.titulo} <Icon name="external" size={11} /></a> : f.titulo}
                        <Badge tone={f.verificado ? 'pos' : 'warn'}>{f.verificado ? 'lida e conferida' : 'a confirmar'}</Badge>
                      </li>
                    ))}
                  </ul>
                </Block>
              )}
            </section>
          )}

          <section className={styles.sec} aria-labelledby="s-series">
            <SectionHeader level={2} title="Séries" description="Eixo de tempo compartilhado, com os ciclos sombreados (clique para selecionar). Quebras de série aparecem tracejadas." />
            {ser.isPending && !homicidios ? (
              <Skeleton height={220} style={{ borderRadius: 16 }} />
            ) : (
              <>
                {!ser.data && (
                  <div className={`card ${styles.prep}`}>
                    <Icon name="chart" size={20} />
                    <div>
                      <h3>Séries históricas em preparação</h3>
                      <p>PIB per capita desde 1820, inflação, salário mínimo real, Gini, expectativa de vida, mortalidade infantil, analfabetismo, desmatamento e chegada de africanos escravizados. Cada série chegará com fonte, hash, qualidade e quebras de metodologia.</p>
                      <button type="button" className={styles.link} onClick={() => openDrawer('series-historicas')}>Ver o estado desta base</button>
                    </div>
                  </div>
                )}
                {groupCounts.length > 1 && (
                  <ChipGroup label="Tema" items={groupCounts.map((g) => ({ key: g.key, label: g.label, count: g.count }))} selected={new Set([sg])} onToggle={(k) => update({ sg: k })} />
                )}
                {shownSeries.length > 0 && <SeriesMultiples series={shownSeries} cycles={spans} selected={cId} onSelect={(id) => update({ c: id })} />}
                {lacunas.length > 0 && (
                  <details className={styles.lacunas}>
                    <summary>Lacunas declaradas ({lacunas.length}): o que as séries não cobrem</summary>
                    <ul>
                      {lacunas.map((l) => (
                        <li key={l.serie + l.motivo}>
                          {l.serie && <code>{l.serie}</code>} {l.motivo}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            )}
          </section>

          {eco.data.classes && eco.data.classes.length > 0 && classe && (
            <section className={styles.sec} aria-labelledby="s-traj">
              <SectionHeader level={2} title="Trajetória de uma classe ao longo dos ciclos" description="O mesmo grupo, ciclo a ciclo. Clique em um ciclo para ver o quadro completo dele." />
              <div className={styles.pick}>
                <Field label="Classe ou grupo">
                  {(id) => (
                    <Select id={id} value={classe.id} onChange={(e) => update({ cl: e.target.value })}>
                      {eco.data?.classes?.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}
                    </Select>
                  )}
                </Field>
              </div>
              {classe.descricao && <p className={styles.motor}><Txt>{classe.descricao}</Txt></p>}
              <ol className={styles.traj}>
                {(classe.trajetoria ?? []).map((t) => {
                  const c = ciclos.find((x) => x.id === t.ciclo)
                  return (
                    <li key={t.ciclo} data-on={t.ciclo === cId}>
                      <button type="button" onClick={() => { update({ c: t.ciclo }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                        <span className={styles.tyears}>{c ? `${c.inicio}–${c.fim}` : t.ciclo}</span>
                        <span className={styles.tlabel}>{c?.rotulo ?? t.ciclo}</span>
                        <span className={styles.tsit}><Txt>{t.situacao}</Txt></span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}

          {fh.data?.perguntas_abertas && fh.data.perguntas_abertas.length > 0 && (
            <section className={styles.sec} aria-labelledby="s-open">
              <SectionHeader level={2} title="Perguntas que os dados não respondem" description="O que seria preciso saber para falar do fator humano com mais firmeza." />
              <ul className={styles.open}>
                {fh.data.perguntas_abertas.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </section>
          )}
        </>
      )}
    </PageTemplate>
  )
}

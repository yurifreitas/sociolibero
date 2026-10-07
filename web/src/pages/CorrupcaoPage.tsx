import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { BasisSeal } from '@/components/molecules/BasisSeal'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { InlineNote } from '@/components/molecules/InlineNote'
import { PageGate } from '@/components/molecules/PageGate'
import { Seal } from '@/components/molecules/Seal'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { StatTile } from '@/components/molecules/StatTile'
import { Tabs } from '@/components/molecules/Tabs'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useDecisoes } from '@/features/data/hooks'
import { useClimaValor, useCustoCorrupcao } from '@/features/risco/hooks'
import { brl, brlRange, isHttp, tipoBasis } from '@/features/risco/model'
import type { Area, ClimaValor, CustoCorrupcao } from '@/features/risco/schemas'
import { cn } from '@/lib/cn'
import { useUrlState } from '@/lib/useUrlState'
import k from './know.module.css'
import styles from './CorrupcaoPage.module.css'

type Aba = 'areas' | 'empresas' | 'recuperacao' | 'clima' | 'modelos'
const ABAS: Aba[] = ['areas', 'empresas', 'recuperacao', 'clima', 'modelos']
const csv = (v: string | null) => (v ? v.split(',').filter(Boolean) : [])

function SourceLink({ fonte, url }: { fonte?: string | null; url?: string | null }) {
  if (!fonte && !url) return null
  return isHttp(url) ? (
    <a href={url} target="_blank" rel="noreferrer">{fonte ?? url}</a>
  ) : (
    <span>{fonte}</span>
  )
}

function AreaCard({ a, filtro }: { a: Area; filtro: Set<string> }) {
  const vals = a.valores.filter((v) => filtro.size === 0 || (v.tipo && filtro.has(v.tipo)) || (filtro.has('verificado') && v.verificado === true))
  const ver = a.valores.filter((v) => v.verificado).length
  return (
    <article id={a.id} className={`card ${k.pad}`}>
      <header className={k.head}>
        <div>
          <p className={k.lbl}>{a.valores.length} valor(es)</p>
          <h3 className={k.title}>{a.nome}</h3>
        </div>
        <Badge tone={ver === a.valores.length && ver > 0 ? 'pos' : ver > 0 ? 'warn' : 'neutral'}>{ver}/{a.valores.length} lidos na fonte</Badge>
      </header>
      {a.mecanismo && <p className={k.text}>{a.mecanismo}</p>}
      <ul className={styles.values}>
        {vals.map((v, i) => (
          <li key={i} className={styles.value}>
            <div className={styles.vTop}>
              <strong className={styles.vNum}>{v.valor_rs_bi != null ? brl(v.valor_rs_bi) : 'sem valor'}</strong>
              {brlRange(v.faixa_rs_bi) && <span className={styles.vRange}>faixa {brlRange(v.faixa_rs_bi)}</span>}
              <BasisSeal basis={tipoBasis(v.tipo)} verified={v.verificado} verifiedLabels={{ yes: 'lido na fonte', no: 'não lido na fonte' }} />
            </div>
            <p className={styles.vDesc}>{v.descricao}</p>
            <p className={styles.vMeta}>
              {v.periodo && <span>{v.periodo}</span>}
              <SourceLink fonte={v.fonte} url={v.url} />
            </p>
            {v.nota_verificacao && !v.verificado && <p className={styles.vNote}>{v.nota_verificacao}</p>}
          </li>
        ))}
        {vals.length === 0 && <li className={k.muted}>Nenhum valor com esse filtro.</li>}
      </ul>
      {a.efeitos_na_economia && (
        <div>
          <p className={k.lbl}>Efeito na economia</p>
          <p className={k.text}>{a.efeitos_na_economia}</p>
        </div>
      )}
      {(a.classes_afetadas?.length ?? 0) > 0 && (
        <div>
          <p className={k.lbl}>Quem é afetado</p>
          <ul className={k.chips}>{a.classes_afetadas?.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      )}
      {a.limites && (
        <p className={styles.limit}><strong>O que isto não diz:</strong> {a.limites}</p>
      )}
      {(a.decisoes_relacionadas?.length ?? 0) > 0 && (
        <ul className={k.links}>
          {a.decisoes_relacionadas?.map((d) => <li key={d}><Link to={`/decisoes?sel=${d}`}>decisão: {d}</Link></li>)}
        </ul>
      )}
      {(a.evidencia_empirica?.length ?? 0) > 0 && (
        <details className={styles.det}>
          <summary>Evidência empírica ({a.evidencia_empirica?.length})</summary>
          <ul className={styles.ev}>
            {a.evidencia_empirica?.map((e, i) => (
              <li key={i}>
                <Seal v={e.verificado} />
                {isHttp(e.url) ? <a href={e.url} target="_blank" rel="noreferrer">{e.estudo}</a> : <span>{e.estudo}</span>}
                {e.achado && <p>{e.achado}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  )
}

function DecisionBars({ d, rotulos }: { d: NonNullable<CustoCorrupcao['valor_financeiro_decisoes']>; rotulos: Map<string, string> }) {
  const rows = Object.entries(d)
    .filter(([, v]) => v.rs_bi_ano != null)
    .map(([id, v]) => ({ id, v: v.rs_bi_ano as number, pp: v.primary_target_pp }))
    .sort((a, b) => b.v - a.v)
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.v)))
  return (
    <div className={styles.bars} role="list" aria-label="Efeito julgado de cada decisão no resultado primário, em R$ bilhões por ano">
      {rows.map((r) => (
        <div key={r.id} role="listitem" className={styles.barRow}>
          <Link to={`/decisoes?sel=${r.id}`} className={styles.barName}>{rotulos.get(r.id) ?? r.id}</Link>
          <div className={styles.barTrack} aria-hidden="true">
            <i className={styles.axis} />
            <b className={cn(styles.fill, r.v < 0 ? styles.neg : styles.pos)} style={r.v < 0 ? { right: '50%', width: `${(Math.abs(r.v) / max) * 50}%` } : { left: '50%', width: `${(r.v / max) * 50}%` }} />
          </div>
          <span className={styles.barVal}>{r.v > 0 ? '+' : r.v < 0 ? '−' : ''}{brl(Math.abs(r.v)).replace('R$ ', 'R$ ')}<em>/ano</em></span>
        </div>
      ))}
    </div>
  )
}

function Content({ d }: { d: CustoCorrupcao }) {
  const { get, update } = useUrlState()
  const aba: Aba = ABAS.find((a) => a === get('aba')) ?? 'areas'
  const filtro = new Set(csv(get('t')))
  const decQ = useDecisoes('decisoes.json')
  const climaQ = useClimaValor(aba === 'clima')
  const rotulos = useMemo(() => new Map((decQ.data?.decisoes ?? []).map((x) => [x.id, x.rotulo])), [decQ.data])
  const r = d.meta.resumo ?? {}
  const pib = d.meta.ancora_pib
  const benef = d.beneficios_a_empresas ?? []
  const des = benef.find((b) => b.decisao_id === 'desoneracao-ampla')
  const desVf = d.valor_financeiro_decisoes?.['desoneracao-ampla']?.rs_bi_ano
  const toggle = (key: string) => {
    const n = new Set(filtro)
    if (n.has(key)) n.delete(key)
    else n.add(key)
    update({ t: n.size ? [...n].join(',') : null })
  }

  return (
    <>
      <div className={k.stats}>
        <StatTile label="Áreas levantadas" value={d.areas.length} hint={`${r.valores ?? '—'} valores, ${r.contagem ?? '—'} de contagem e ${r.estimativa ?? '—'} de estimativa`} />
        <StatTile label="Valores lidos na fonte" value={`${r.valores_verificados ?? '—'}/${r.valores ?? '—'}`} tone="neg" hint="o resto veio de imprensa ou resumo de busca" />
        <StatTile label="Benefícios a empresas" value={`${r.beneficios_verificados ?? '—'}/${r.beneficios ?? benef.length}`} hint="com valor verificado na fonte" />
        <StatTile label="Âncora: PIB 2025" value={pib?.valor_rs_bi != null ? brl(pib.valor_rs_bi) : '—'} hint={pib?.verificado ? 'verificado' : 'valor arredondado, NÃO verificado (o IBGE respondeu 403)'} />
      </div>

      <InlineNote id="corr-naosomar" tone="warn" dismissible={false} baseId="custo-corrupcao" title="Não some as linhas.">
        {d.nao_somar ?? 'Contagem (apurado) e estimativa (modelo) medem coisas diferentes; períodos e bases diferem; renúncia de receita não é perda.'}
      </InlineNote>
      <InlineNote id="corr-naoacusar" tone="info" dismissible={false} title="Como não acusar.">
        Este levantamento usa agregados e casos públicos documentados por órgãos oficiais. Nenhuma pessoa ou empresa é apontada por nome; um valor “apurado” indica o status do caso na fonte, não culpa. Estimativas mostram ordem de grandeza e método, não um fato contábil.
      </InlineNote>

      <Tabs<Aba>
        label="Seções do custo da corrupção e captura"
        value={aba}
        onChange={(a) => update({ aba: a === 'areas' ? null : a })}
        tabs={[
          { key: 'areas', label: 'Áreas e valores', count: d.areas.length },
          { key: 'empresas', label: 'Benefícios a empresas', count: benef.length },
          { key: 'recuperacao', label: 'Cenário de recuperação' },
          { key: 'clima', label: 'Clima: valor financeiro' },
          { key: 'modelos', label: 'Modelos e evidência', count: d.modelos?.length },
        ]}
      >
        {aba === 'areas' && (
          <div className={k.stack}>
            {(d.panorama?.length ?? 0) > 0 && (
              <section aria-labelledby="co-pan">
                <h3 id="co-pan" className={styles.h3}>Panorama: quanto custa a corrupção, segundo os estudos</h3>
                <ul className={styles.pano}>
                  {d.panorama?.map((p) => (
                    <li key={p.id} className="card">
                      <p className={styles.vDesc}>{p.descricao}</p>
                      <p className={styles.pNum}>
                        {p.faixa_pct_pib ? `${p.faixa_pct_pib[0]?.toString().replace('.', ',')}% a ${p.faixa_pct_pib[1]?.toString().replace('.', ',')}% do PIB` : p.faixa_rs_bi ? brlRange(p.faixa_rs_bi) : p.pct_pib != null ? `${p.pct_pib}% do PIB` : 'nota, não R$'}
                      </p>
                      {p.equivalente_rs_bi_ancora?.faixa && <p className={k.muted}>≈ {brlRange(p.equivalente_rs_bi_ancora.faixa)} com o PIB-âncora (cálculo nosso)</p>}
                      <p className={styles.vMeta}><BasisSeal basis={tipoBasis(p.tipo)} verified={p.verificado} verifiedLabels={{ yes: 'lido na fonte', no: 'não lido na fonte' }} /><SourceLink fonte={p.fonte} url={p.url} /></p>
                      {p.critica_metodologica && <p className={styles.vNote}>{p.critica_metodologica}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <div className={k.filters}>
              <ChipGroup label="Tipo de valor" items={[{ key: 'contagem', label: 'Contagem (apurado)' }, { key: 'estimativa', label: 'Estimativa (modelo)' }, { key: 'verificado', label: 'Lidos na fonte' }]} selected={filtro} onToggle={toggle} onClear={() => update({ t: null })} />
            </div>
            <div className={k.grid2}>{d.areas.map((a) => <AreaCard key={a.id} a={a} filtro={filtro} />)}</div>
          </div>
        )}

        {aba === 'empresas' && (
          <div className={k.stack}>
            <section aria-labelledby="co-ben">
              <h3 id="co-ben" className={styles.h3}>Quem se beneficia de decisões e regimes, e quanto custa</h3>
              <p className={k.text}>Setores e portes, nunca nomes. Valor anual da renúncia, subsídio ou benefício, com a faixa e quem paga.</p>
              <div className={styles.benefGrid}>
                {benef.map((b) => (
                  <article key={b.id} className={`card ${k.pad}`}>
                    <header className={k.head}>
                      <h4 className={k.title}>{b.tema}</h4>
                      <Seal v={b.verificado} labels={{ yes: 'lido na fonte', no: 'não lido na fonte' }} />
                    </header>
                    <p className={styles.pNum}>{b.valor_rs_bi_ano?.central != null ? `${brl(b.valor_rs_bi_ano.central)} por ano` : 'sem valor'}</p>
                    {brlRange(b.valor_rs_bi_ano?.faixa) && <p className={k.muted}>faixa {brlRange(b.valor_rs_bi_ano?.faixa)}</p>}
                    <dl className={k.kv}>
                      {b.beneficiarios && (<><dt>Quem se beneficia</dt><dd>{b.beneficiarios}</dd></>)}
                      {b.quem_paga && (<><dt>Quem paga</dt><dd>{b.quem_paga}</dd></>)}
                      {b.base && (<><dt>Base do cálculo</dt><dd>{b.base}</dd></>)}
                    </dl>
                    {b.nota && <p className={styles.vNote}>{b.nota}</p>}
                    <p className={styles.vMeta}><SourceLink fonte={b.fonte} url={b.url} />{b.decisao_id && <Link to={`/decisoes?sel=${b.decisao_id}`}>decisão: {b.decisao_id}</Link>}</p>
                  </article>
                ))}
              </div>
            </section>
            {d.valor_financeiro_decisoes && (
              <section aria-labelledby="co-vf">
                <h3 id="co-vf" className={styles.h3}>As decisões do catálogo em R$ por ano</h3>
                <p className={k.text}>
                  Conversão em reais do efeito <strong>julgado</strong> de cada decisão no resultado primário: pontos do PIB ÷ 100 × PIB nominal {pib?.ano != null ? `de ${pib.ano}` : ''} ({pib?.valor_rs_bi != null ? brl(pib.valor_rs_bi) : '—'}, não verificado). Para a direita, o primário melhora; para a esquerda, piora.
                </p>
                <DecisionBars d={d.valor_financeiro_decisoes} rotulos={rotulos} />
                <p className={styles.limit}>
                  <strong>É escala, não a conta do orçamento.</strong> Os efeitos são deltas julgados do catálogo.
                  {des?.valor_rs_bi_ano?.central != null && desVf != null && (
                    <> Exemplo: o custo documentado da desoneração da folha é {brl(des.valor_rs_bi_ano.central)} por ano, enquanto o delta julgado de “desoneração ampla” equivale a {brl(Math.abs(desVf))}: o catálogo trata uma versão muito mais ampla, e vale recalibrar o delta.</>
                  )}
                </p>
              </section>
            )}
          </div>
        )}

        {aba === 'recuperacao' && d.recuperacao_macro && (
          <div className={k.stack}>
            <section aria-labelledby="co-rec">
              <h3 id="co-rec" className={styles.h3}>E se parte do desvio fosse recuperada?</h3>
              <p className={styles.sup}><Badge tone="warn">suposição rotulada</Badge> {d.recuperacao_macro.suposicao}</p>
              <ul className={styles.rec}>
                {d.recuperacao_macro.cenarios.map((c) => (
                  <li key={c.recuperado_pct} className="card">
                    <p className={styles.recPct}>{c.recuperado_pct}%</p>
                    <p className={k.muted}>do desvio de referência</p>
                    <dl className={styles.recDl}>
                      <div><dt>Primário</dt><dd>+{c.primario_pp.toFixed(2).replace('.', ',')} pp do PIB</dd></div>
                      <div><dt>Em reais</dt><dd>+{brl(c.rs_bi_ano)} por ano</dd></div>
                      <div><dt>Dívida/PIB em 2035</dt><dd>{c.debt_2035_delta.toFixed(1).replace('.', ',').replace('-', '−')} pp</dd></div>
                      <div><dt>Selic em 2035</dt><dd>{c.selic_2035_delta.toFixed(2).replace('.', ',').replace('-', '−')} pp</dd></div>
                    </dl>
                  </li>
                ))}
              </ul>
              {d.recuperacao_macro.referencia_2035 && (
                <p className={k.muted}>Referência (cenário pragmático, 2035): dívida {d.recuperacao_macro.referencia_2035.debt?.toFixed(1).replace('.', ',')}% do PIB, Selic {d.recuperacao_macro.referencia_2035.selic?.toFixed(1).replace('.', ',')}%.</p>
              )}
              {d.recuperacao_macro.desvio_referencia && (
                <p className={styles.limit}><strong>Desvio de referência:</strong> {d.recuperacao_macro.desvio_referencia.pct_pib_central?.toString().replace('.', ',')}% do PIB por ano. {d.recuperacao_macro.desvio_referencia.descricao}</p>
              )}
              {d.recuperacao_macro.limites && <p className={styles.limit}><strong>Limites:</strong> {d.recuperacao_macro.limites}</p>}
              <p className={k.muted}>Leia como “quanto vale cada ponto percentual”, não como previsão de arrecadação: parte do desvio não é recuperável.</p>
            </section>
          </div>
        )}

        {aba === 'clima' && (
          <PageGate query={climaQ} file="clima_valor_financeiro.json">{(c) => <ClimaValue c={c} />}</PageGate>
        )}

        {aba === 'modelos' && (
          <div className={k.stack}>
            <p className={k.text}>Modelos teóricos e evidência empírica usados para ler os números acima. Cada um diz a fórmula, o uso e o que não cobre.</p>
            <div className={k.grid2}>
              {d.modelos?.map((m) => (
                <article key={m.id} className={`card ${k.pad}`}>
                  <header className={k.head}>
                    <div>
                      <p className={k.lbl}>{[m.autor, m.ano].filter(Boolean).join(' · ')}</p>
                      <h4 className={k.title}>{m.nome}</h4>
                    </div>
                  </header>
                  {m.formula && <pre className={styles.formula}>{m.formula}</pre>}
                  {m.uso && <p className={k.text}><strong>Uso:</strong> {m.uso}</p>}
                  {m.aplicacao_brasil && <p className={k.text}><strong>No Brasil:</strong> {m.aplicacao_brasil}</p>}
                  {m.limites && <p className={styles.limit}><strong>Limites:</strong> {m.limites}</p>}
                  {(m.referencias?.length ?? 0) > 0 && (
                    <ul className={k.src}>
                      {m.referencias?.map((x, i) => (
                        <li key={i}><Seal v={x.verificado} labels={{ yes: 'conferida', no: 'a confirmar' }} />{isHttp(x.url) ? <a href={x.url} target="_blank" rel="noreferrer">{x.titulo}</a> : <span>{x.titulo}</span>}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </Tabs>

      {((d.meta.lacunas?.length ?? 0) > 0 || (d.meta.divergencias?.length ?? 0) > 0) && (
        <details className={styles.det}>
          <summary>Lacunas ({d.meta.lacunas?.length ?? 0}) e divergências entre fontes ({d.meta.divergencias?.length ?? 0})</summary>
          {(d.meta.divergencias?.length ?? 0) > 0 && <><p className={k.lbl}>Divergências, não reconciliadas</p><ul className={k.list}>{d.meta.divergencias?.map((x) => <li key={x}>{x}</li>)}</ul></>}
          {(d.meta.lacunas?.length ?? 0) > 0 && <><p className={k.lbl}>Lacunas</p><ul className={k.list}>{d.meta.lacunas?.map((x) => <li key={x}>{x}</li>)}</ul></>}
        </details>
      )}
    </>
  )
}

function ClimaValue({ c }: { c: ClimaValor }) {
  const rel = c.relacao_prevencao_resposta ?? []
  const lidas = rel.filter((x) => x.verificado)
  return (
    <div className={k.stack}>
      <InlineNote id="clima-valor-aviso" tone="warn" dismissible={false} baseId="clima-valor" title="Não é uma conta única.">
        {c.nao_somar ?? 'Avaliação de danos, declarações municipais, seguro, crédito e gasto público são coisas diferentes.'}
      </InlineNote>
      <section aria-labelledby="cv-itens">
        <h3 id="cv-itens" className={styles.h3}>Rio Grande do Sul 2024 e o Brasil em R$</h3>
        <div className={k.tableWrap}>
          <table className={k.table}>
            <caption className="sr-only">Valores financeiros ligados a desastres climáticos, em R$ bilhões, com tipo, fonte e verificação.</caption>
            <thead><tr><th>Item</th><th className="n">R$ bi</th><th>Tipo</th><th>Fonte</th></tr></thead>
            <tbody>
              {c.itens.map((i) => (
                <tr key={i.id}>
                  <td>{i.descricao}{i.escopo && <p className={styles.vMeta}>{i.escopo}</p>}</td>
                  <td className="n"><strong>{i.valor_rs_bi != null ? brl(i.valor_rs_bi) : '—'}</strong>{brlRange(i.faixa_rs_bi) && <span className={styles.vRange}>{brlRange(i.faixa_rs_bi)}</span>}</td>
                  <td><BasisSeal basis={tipoBasis(i.tipo)} verified={i.verificado} verifiedLabels={{ yes: 'lido na fonte', no: 'não lido na fonte' }} /></td>
                  <td><SourceLink fonte={i.fonte} url={i.url} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {rel.length > 0 && (
        <section aria-labelledby="cv-rel">
          <h3 id="cv-rel" className={styles.h3}>Prevenção × resposta: as razões não se reconciliam</h3>
          <p className={k.text}>Duas fontes lidas dão razões muito diferentes porque medem coisas diferentes (União em 2013–2022 contra seguros em 2019–2024). <strong>Mostramos as duas lado a lado, sem conciliar.</strong></p>
          <ul className={styles.ratio}>
            {lidas.map((x) => (
              <li key={x.id} className="card">
                <p className={styles.ratioNum}>{x.razao != null ? x.razao.toString().replace('.', ',') : '—'}<span>× resposta por R$ 1 de prevenção</span></p>
                <p className={styles.vDesc}>{x.descricao}</p>
                <p className={styles.vMeta}>{x.periodo && <span>{x.periodo}</span>}{x.escopo && <span>{x.escopo}</span>}</p>
                <p className={styles.vMeta}><Seal v={x.verificado} labels={{ yes: 'lido na fonte', no: 'não lido na fonte' }} /><SourceLink fonte={x.fonte} url={x.url} /></p>
                {x.nota && <p className={styles.vNote}>{x.nota}</p>}
              </li>
            ))}
          </ul>
          {rel.length > lidas.length && (
            <details className={styles.det}>
              <summary>Razões internacionais, não verificadas ({rel.length - lidas.length})</summary>
              <ul className={k.list}>{rel.filter((x) => !x.verificado).map((x) => <li key={x.id}>{x.descricao}: {x.razao != null ? `${x.razao}×` : '—'} ({x.fonte ?? 'fonte não lida'})</li>)}</ul>
            </details>
          )}
        </section>
      )}
    </div>
  )
}

export default function CorrupcaoPage() {
  const q = useCustoCorrupcao()
  return (
    <PageTemplate>
      <SectionHeader
        level={1}
        title="Custo da corrupção e da captura, em R$"
        description="Áreas e aspectos econômicos prejudicados e decisões que beneficiam empresas, com valor, método, faixa e o que cada número não diz. Levantamento de pesquisa aberta, não auditoria."
      />
      <PageGate query={q} file="custo_corrupcao.json">{(d) => <Content d={d} />}</PageGate>
    </PageTemplate>
  )
}

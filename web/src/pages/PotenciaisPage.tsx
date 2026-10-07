import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { InlineNote } from '@/components/molecules/InlineNote'
import { PageGate } from '@/components/molecules/PageGate'
import { Seal } from '@/components/molecules/Seal'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { StatTile } from '@/components/molecules/StatTile'
import { Tabs } from '@/components/molecules/Tabs'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useDecisoes } from '@/features/data/hooks'
import { usePotenciais } from '@/features/conhecimento/hooks'
import { USO_NIVEIS, usoNivel } from '@/features/conhecimento/model'
import type { Potenciais, Potencia } from '@/features/conhecimento/schemas'
import { useUrlState } from '@/lib/useUrlState'
import k from './know.module.css'
import styles from './PotenciaisPage.module.css'

type Aba = 'potencias' | 'crescimento' | 'armadilhas' | 'perguntas'
const csv = (v: string | null) => (v ? v.split(',').filter(Boolean) : [])

/** Medidor de uso atual: lido do INÍCIO do texto de grau_de_uso (Muito baixo/Baixo/Médio/Alto). Não é medida numérica. */
function UsoMeter({ texto }: { texto?: string | null }) {
  const n = usoNivel(texto)
  return (
    <div className={styles.meter}>
      <div className={styles.steps} role="img" aria-label={n == null ? 'Uso atual: sem rótulo extraível do texto' : `Uso atual lido do texto: ${USO_NIVEIS[Math.round(n)]}`}>
        {USO_NIVEIS.map((l, i) => (
          <span key={l} className={n != null && i <= Math.round(n) && !(n === 1.5 && i === 2) ? styles.on : undefined} title={l} />
        ))}
      </div>
      <span className={styles.meterLbl}>{n == null ? 'uso: ver texto' : `uso ${USO_NIVEIS[Math.round(n)]?.toLowerCase()}${n === 1.5 ? ' a médio' : ''}`}</span>
    </div>
  )
}

function PotencyCard({ p, decisoesOk }: { p: Potencia; decisoesOk: Set<string> }) {
  const mets = p.metricas ?? []
  const ver = mets.filter((m) => m.verificado).length
  return (
    <article id={p.id} className={`card ${k.pad}`}>
      <header className={k.head}>
        <div>
          {p.categoria && <p className={k.lbl}>{p.categoria}</p>}
          <h3 className={k.title}>{p.titulo}</h3>
        </div>
        <Badge tone={ver === mets.length && mets.length > 0 ? 'pos' : ver > 0 ? 'warn' : 'neutral'}>
          {ver}/{mets.length} métricas verificadas
        </Badge>
      </header>
      <div className={styles.potUse}>
        <div>
          <p className={k.lbl}>Potencial (ranking mundial)</p>
          <p className={k.text}>{p.ranking_mundial ?? 'sem ranking verificado'}</p>
        </div>
        <div>
          <p className={k.lbl}>Uso atual</p>
          <UsoMeter texto={p.grau_de_uso} />
          <p className={k.text}>{p.grau_de_uso}</p>
        </div>
      </div>
      {p.por_que_poucos_notam && (
        <p className={styles.notice}>
          <Icon name="spark" size={14} /> <b>Por que poucos notam.</b> {p.por_que_poucos_notam}
        </p>
      )}
      {mets.length > 0 && (
        <details className={styles.det} open={mets.length <= 3}>
          <summary>Métricas ({mets.length})</summary>
          <ul className={styles.mets}>
            {mets.map((m) => (
              <li key={m.nome}>
                <div className={styles.metTop}>
                  <b>{m.nome}</b>
                  <Seal v={m.verificado} />
                </div>
                <p className={styles.metVal}>
                  <span className="num">{m.valor ?? '—'}</span> {m.unidade} {m.ano ? <span className={k.muted}>· {m.ano}</span> : null}
                </p>
                <p className={k.muted}>
                  {m.url ? (
                    <a href={m.url} target="_blank" rel="noreferrer">
                      {m.fonte}
                    </a>
                  ) : (
                    m.fonte
                  )}
                </p>
                {m.nota && <p className={k.muted}>{m.nota}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className={k.two}>
        <div>
          <p className={k.lbl}>Quem ganha</p>
          <ul className={k.list}>{(p.quem_ganha ?? []).map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div>
          <p className={k.lbl}>Quem perde</p>
          <ul className={k.list}>{(p.quem_perde ?? []).map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </div>
      {(p.barreiras?.length ?? 0) > 0 && (
        <>
          <p className={k.lbl}>Barreiras</p>
          <ul className={k.list}>{p.barreiras?.map((x) => <li key={x}>{x}</li>)}</ul>
        </>
      )}
      {p.risco_ambiental && (
        <p className={k.text}>
          <b>Risco ambiental.</b> {p.risco_ambiental}
        </p>
      )}
      {((p.ligacao_decisoes?.length ?? 0) > 0 || (p.ligacao_tendencias?.length ?? 0) > 0) && (
        <>
          <p className={k.lbl}>Decisões que destravam e tendências ligadas</p>
          <ul className={k.links}>
            {p.ligacao_decisoes?.map((id) => (
              <li key={id}>
                {decisoesOk.has(id) ? <Link to={`/decisoes?sel=${id}`}>decisão: {id}</Link> : <span className={k.tagc}>decisão: {id}</span>}
              </li>
            ))}
            {p.ligacao_tendencias?.map((id) => (
              <li key={id}>
                <Link to={`/futuro?aba=tendencias#${id}`}>tendência: {id}</Link>
              </li>
            ))}
          </ul>
          {p.ligacao_nota && <p className={k.muted}>{p.ligacao_nota}</p>}
        </>
      )}
      {(p.regioes?.length ?? 0) > 0 && <ul className={k.chips} aria-label="Regiões">{p.regioes?.map((r) => <li key={r}>{r}</li>)}</ul>}
    </article>
  )
}

function Content({ d }: { d: Potenciais }) {
  const { get, update } = useUrlState()
  const aba: Aba = (['potencias', 'crescimento', 'armadilhas', 'perguntas'] as const).find((a) => a === get('aba')) ?? 'potencias'
  const sel = new Set(csv(get('c')))
  const cats = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of d.potencias) m.set(p.categoria ?? 'sem categoria', (m.get(p.categoria ?? 'sem categoria') ?? 0) + 1)
    return [...m.entries()].map(([key, count]) => ({ key, count }))
  }, [d.potencias])
  const shown = d.potencias.filter((p) => sel.size === 0 || sel.has(p.categoria ?? 'sem categoria'))
  const mets = d.potencias.flatMap((p) => p.metricas ?? [])
  const ver = mets.filter((m) => m.verificado).length
  const cp = d.crescimento_potencial
  // ids de decisões existentes: o catálogo vive em decisoes.json; links só para ids presentes
  const decQ = useDecisoes('decisoes.json')
  const decisoesOk = useMemo(() => new Set((decQ.data?.decisoes ?? []).map((x) => x.id)), [decQ.data])
  const toggle = (key: string) => {
    const n = new Set(sel)
    if (n.has(key)) n.delete(key)
    else n.add(key)
    update({ c: [...n].join(',') || null })
  }
  return (
    <div className={k.stack}>
      <div className={k.stats}>
        <StatTile label="Potências analisadas" value={String(d.potencias.length)} hint={`${cats.length} categorias`} />
        <StatTile label="Métricas conferidas na fonte" value={`${ver} de ${mets.length}`} hint="as demais ficam com selo “não verificado”" />
        <StatTile label="Armadilhas" value={String(d.armadilhas?.length ?? 0)} hint="doença holandesa, captura, risco climático…" />
        <StatTile label="PIB potencial (FMI, médio prazo)" value="2,5% a.a." hint="único PIB potencial verificado; a decomposição ainda é lacuna" />
      </div>
      <InlineNote id="potenciais-aviso" tone="warn" dismissible={false} baseId="potenciais-brasil" title="Potencial técnico não é potencial econômico.">
        {d.meta?.aviso ?? 'Separamos potencial real de retórica de “país do futuro”: cada potência traz o grau de uso, as barreiras e quem captura o ganho.'}
      </InlineNote>
      <Tabs<Aba>
        label="Seções de potenciais"
        value={aba}
        onChange={(a) => update({ aba: a === 'potencias' ? null : a })}
        tabs={[
          { key: 'potencias', label: 'Potências', count: d.potencias.length },
          { key: 'crescimento', label: 'Potencial de crescimento' },
          { key: 'armadilhas', label: 'Armadilhas', count: d.armadilhas?.length ?? 0 },
          { key: 'perguntas', label: 'Perguntas abertas', count: d.perguntas_abertas?.length ?? 0 },
        ]}
      >
        {aba === 'potencias' && (
          <div className={k.stack}>
            <ChipGroup label="Categoria" items={cats} selected={sel} onToggle={toggle} onClear={() => update({ c: null })} />
            <p className={k.muted}>{shown.length} de {d.potencias.length} potências.</p>
            <div className={k.grid2}>
              {shown.map((p) => (
                <PotencyCard key={p.id} p={p} decisoesOk={decisoesOk} />
              ))}
            </div>
          </div>
        )}
        {aba === 'crescimento' && (
          <div className={k.stack}>
            <section className={`card ${k.pad}`}>
              <h3 className={k.title}>Estimativas publicadas</h3>
              <ul className={styles.mets}>
                {(cp?.estimativas ?? []).map((e) => (
                  <li key={e.fonte}>
                    <div className={styles.metTop}>
                      <b>{e.fonte}</b>
                      <Seal v={e.verificado} />
                    </div>
                    <p className={styles.metVal}>{e.valor}</p>
                    <p className={k.muted}>{e.periodo} · {e.metodo}</p>
                    {e.url && <a href={e.url} target="_blank" rel="noreferrer" className={k.muted}>fonte</a>}
                  </li>
                ))}
              </ul>
            </section>
            <div className={k.grid2}>
              <section className={`card ${k.pad}`}>
                <h3 className={k.title}>Decomposição (capital, trabalho, produtividade)</h3>
                <InlineNote id="pot-decomp" tone="warn" dismissible={false} title="Lacuna declarada.">
                  Não há decomposição da economia total: Penn World Table, Conference Board, FGV IBRE e Ipea não foram abertos. Só a produtividade agropecuária foi conferida.
                </InlineNote>
                <ul className={styles.mets}>
                  {(cp?.decomposicao ?? []).map((e) => (
                    <li key={e.componente}>
                      <div className={styles.metTop}><b>{e.componente}</b><Seal v={e.verificado} /></div>
                      <p className={k.text}>{e.valor}</p>
                      <p className={k.muted}>{e.url ? <a href={e.url} target="_blank" rel="noreferrer">{e.fonte}</a> : e.fonte}</p>
                      {e.nota && <p className={k.muted}>{e.nota}</p>}
                    </li>
                  ))}
                </ul>
              </section>
              <section className={`card ${k.pad}`}>
                <h3 className={k.title}>Gaps frente a economias avançadas</h3>
                <ul className={styles.mets}>
                  {(cp?.gaps ?? []).map((e) => (
                    <li key={e.gap}>
                      <div className={styles.metTop}><b>{e.gap}</b><Seal v={e.verificado} /></div>
                      <p className={k.text}>{e.valor}</p>
                      <p className={k.muted}>{e.url ? <a href={e.url} target="_blank" rel="noreferrer">{e.fonte}</a> : e.fonte}</p>
                      {e.nota && <p className={k.muted}>{e.nota}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <section className={`card ${k.pad}`}>
              <h3 className={k.title}>O que cada decisão do catálogo mexe</h3>
              <p className={k.muted}>Os efeitos do modelo (deltas) são julgamentos, não literatura. Cada linha liga a decisão ao canal de crescimento.</p>
              <dl className={styles.dec}>
                {Object.entries(cp?.o_que_cada_decisao_mexe ?? {}).map(([id, txt]) => (
                  <div key={id}>
                    <dt><Link to={`/decisoes?sel=${id}`}>{id}</Link></dt>
                    <dd>{txt}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        )}
        {aba === 'armadilhas' && (
          <div className={k.grid2}>
            {(d.armadilhas ?? []).map((a) => (
              <article key={a.id} className={`card ${k.pad}`}>
                <h3 className={k.title}>{a.titulo}</h3>
                {a.descricao && <p className={k.text}>{a.descricao}</p>}
                {a.evidencia && <p className={k.text}><b>Evidência.</b> {a.evidencia}</p>}
                {(a.fontes?.length ?? 0) > 0 && (
                  <ul className={k.src}>
                    {a.fontes?.map((f) => (
                      <li key={f.titulo}><Seal v={f.verificado} />{f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.titulo}</a> : f.titulo}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
        {aba === 'perguntas' && (
          <ol className={styles.q}>
            {(d.perguntas_abertas ?? []).map((q) => <li key={q} className="card">{q}</li>)}
          </ol>
        )}
      </Tabs>
    </div>
  )
}

export default function PotenciaisPage() {
  const q = usePotenciais()
  return (
    <PageTemplate>
      <SectionHeader level={1} title="Potências do Brasil" description="O que o país tem de sobra e quase ninguém nota, quanto já é usado, quem captura o ganho e o que destrava, com o potencial de crescimento e as armadilhas." />
      <PageGate query={q} file="potenciais_brasil.json">{(d) => <Content d={d} />}</PageGate>
    </PageTemplate>
  )
}

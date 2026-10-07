import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { InlineNote } from '@/components/molecules/InlineNote'
import { PageGate } from '@/components/molecules/PageGate'
import { Seal } from '@/components/molecules/Seal'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { Tabs } from '@/components/molecules/Tabs'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { usePilares } from '@/features/conhecimento/hooks'
import { GRUPOS, grupoDe } from '@/features/conhecimento/model'
import type { Pensador, Pilares } from '@/features/conhecimento/schemas'
import { useDecisoes } from '@/features/data/hooks'
import { useMarx } from '@/features/marx/hooks'
import { useViolencia } from '@/features/violencia/hooks'
import { useUrlState } from '@/lib/useUrlState'
import k from './know.module.css'
import styles from './PilaresPage.module.css'

type Aba = 'pensadores' | 'pilares' | 'dialogos' | 'viabilizacao'
const csv = (v: string | null) => (v ? v.split(',').filter(Boolean) : [])
const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

function Obras({ p }: { p: Pensador }) {
  const o = p.obra_chave ?? []
  if (o.length === 0) return null
  return (
    <ul className={k.src} aria-label="Obras-chave">
      {o.map((x) => (
        <li key={x.titulo}>
          <Seal v={x.verificado} />
          {x.url ? <a href={x.url} target="_blank" rel="noreferrer">{x.titulo}</a> : <span>{x.titulo}</span>}
          {x.ano ? <span>({x.ano})</span> : null}
        </li>
      ))}
    </ul>
  )
}

type Cross = { viol: { id: string; nome: string }[]; marx: { id: string; nome: string }[] }

function ThinkerCard({ p, decisoesOk, cross }: { p: Pensador; decisoesOk: Set<string>; cross?: Cross }) {
  const lig = p.ligacoes
  const casos = p.casos_e_evidencias ?? []
  return (
    <article id={p.id} className={`card ${k.pad}`}>
      <header>
        <p className={k.lbl}>{grupoDe(p)}</p>
        <h3 className={k.title}>{p.nome}</h3>
        {p.tradicao && <p className={k.sub}>{p.tradicao}</p>}
      </header>
      {p.ideia_central && <p className={k.text}>{p.ideia_central}</p>}
      {(p.conceitos?.length ?? 0) > 0 && <ul className={k.chips} aria-label="Conceitos">{p.conceitos?.map((c) => <li key={c}>{c}</li>)}</ul>}
      <Obras p={p} />
      <details className={styles.det}>
        <summary>Uso operacional, evidências e críticas</summary>
        {p.uso_operacional && <p className={k.text}><b>Uso operacional.</b> {p.uso_operacional}</p>}
        {casos.length > 0 && (
          <ul className={styles.casos}>
            {casos.map((c) => (
              <li key={c.descricao}>
                <div className={styles.casoTop}><Seal v={c.verificado} />{c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.fonte ?? 'fonte'}</a> : <span>{c.fonte}</span>}</div>
                <p className={k.text}>{c.descricao}</p>
              </li>
            ))}
          </ul>
        )}
        {p.criticas && <p className={k.text}><b>Críticas e limites.</b> {p.criticas}</p>}
        {p.relevancia_brasil && <p className={k.text}><b>Relevância para o Brasil.</b> {p.relevancia_brasil}</p>}
      </details>
      {cross && (cross.viol.length > 0 || cross.marx.length > 0) && (
        <ul className={k.links} aria-label="Mesmo autor em outras páginas">
          {cross.viol.map((x) => <li key={`v${x.id}`}><Link to={`/violencia?p=${x.id}`}>em Pensadores da violência: {x.nome}</Link></li>)}
          {cross.marx.map((x) => <li key={`m${x.id}`}><Link to={`/marx?aba=pensadores&i=${x.id}`}>em Marx e o capitalismo: {x.nome}</Link></li>)}
        </ul>
      )}
      {lig && ((lig.decisoes?.length ?? 0) > 0 || (lig.potencias?.length ?? 0) > 0 || (lig.ciclos?.length ?? 0) > 0 || (lig.leis?.length ?? 0) > 0) && (
        <ul className={k.links} aria-label="Ligações com o resto do projeto">
          {lig.decisoes?.map((id) => <li key={`d${id}`}>{decisoesOk.has(id) ? <Link to={`/decisoes?sel=${id}`}>decisão: {id}</Link> : <span className={k.tagc}>decisão: {id}</span>}</li>)}
          {lig.potencias?.map((id) => <li key={`p${id}`}><Link to={`/potenciais#${id}`}>potência: {id}</Link></li>)}
          {lig.ciclos?.map((id) => <li key={`c${id}`}><Link to={`/gente?ciclo=${id}`}>ciclo: {id}</Link></li>)}
          {lig.leis?.map((id) => <li key={`l${id}`}><Link to="/futuro">lei: {id}</Link></li>)}
        </ul>
      )}
    </article>
  )
}

function Content({ d }: { d: Pilares }) {
  const { get, update } = useUrlState()
  const aba: Aba = (['pensadores', 'pilares', 'dialogos', 'viabilizacao'] as const).find((a) => a === get('aba')) ?? 'pensadores'
  const [q, setQ] = useState('')
  const sel = new Set(csv(get('g')))
  const nome = useMemo(() => new Map(d.pensadores.map((p) => [p.id, p.nome])), [d.pensadores])
  const pilarNome = useMemo(() => new Map(d.pilares.map((p) => [p.id, p.nome])), [d.pilares])
  const decQ = useDecisoes('decisoes.json')
  const decisoes = decQ.data?.decisoes ?? []
  const violQ = useViolencia(true)
  const marxQ = useMarx(true)
  const cross = useMemo(() => {
    const m = new Map<string, Cross>()
    const get = (id: string) => m.get(id) ?? m.set(id, { viol: [], marx: [] }).get(id)!
    for (const v of violQ.data?.pensadores ?? []) {
      for (const pid of new Set([v.id, ...(v.ligacoes?.pilares ?? [])])) get(pid).viol.push({ id: v.id, nome: v.nome })
    }
    for (const x of marxQ.data?.pensadores ?? []) if (x.id_no_projeto_pilares_pensamento) get(x.id_no_projeto_pilares_pensamento).marx.push({ id: x.id, nome: x.nome })
    return m
  }, [violQ.data, marxQ.data])
  const decisoesOk = useMemo(() => new Set(decisoes.map((x) => x.id)), [decisoes])
  const porProposta = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const x of decisoes) {
      const o = String((x as { origem?: string | null }).origem ?? '')
      for (const v of o.matchAll(/V\d{2}/g)) m.set(v[0], [...(m.get(v[0]) ?? []), x.id])
    }
    return m
  }, [decisoes])
  const grupos = useMemo(() => GRUPOS.map((g) => ({ key: g, count: d.pensadores.filter((p) => grupoDe(p) === g).length })).filter((g) => g.count > 0), [d.pensadores])
  const lista = d.pensadores.filter((p) => (sel.size === 0 || sel.has(grupoDe(p))) && (!q || norm(`${p.nome} ${p.tradicao ?? ''} ${p.ideia_central ?? ''} ${(p.conceitos ?? []).join(' ')}`).includes(norm(q))))
  const toggle = (key: string) => {
    const n = new Set(sel)
    if (n.has(key)) n.delete(key)
    else n.add(key)
    update({ g: [...n].join(',') || null })
  }
  const obras = d.pensadores.flatMap((p) => p.obra_chave ?? [])
  const ver = obras.filter((o) => o.verificado).length

  return (
    <div className={k.stack}>
      <div className={styles.fixed}>
        <InlineNote id="pil-nao-prova" tone="warn" dismissible={false} baseId="pilares-pensamento" title="O que isto não prova.">
          Ideias e casos não demonstram que uma política funcionaria no Brasil. O que há é um mapa de referências, com casos em operação e suas críticas.
        </InlineNote>
        <InlineNote id="pil-romantizar" tone="info" dismissible={false} title="Como não romantizar.">
          Povos e pensadores indígenas não são uma fonte de soluções prontas; versões estatais de conceitos como o Buen Vivir foram capturadas por projetos extrativistas (Yasuní-ITT, TIPNIS). Leia as críticas
          junto de cada ideia.
        </InlineNote>
        <InlineNote id="pil-consulta" tone="danger" dismissible={false} title="Nenhuma proposta foi consultada a povo ou comunidade.">
          As propostas de viabilização são desenhos de política deste projeto, não demandas de ninguém. Qualquer uso real exige consulta livre, prévia e informada.
        </InlineNote>
      </div>
      <Tabs<Aba>
        label="Seções de pilares"
        value={aba}
        onChange={(a) => update({ aba: a === 'pensadores' ? null : a })}
        tabs={[
          { key: 'pensadores', label: 'Pensadores', count: d.pensadores.length },
          { key: 'pilares', label: 'Pilares', count: d.pilares.length },
          { key: 'dialogos', label: 'Diálogos', count: d.dialogos?.length ?? 0 },
          { key: 'viabilizacao', label: 'Viabilização', count: d.viabilizacao?.length ?? 0 },
        ]}
      >
        {aba === 'pensadores' && (
          <div className={k.stack}>
            <div className={k.filters}>
              <label className={k.search}>
                Buscar por nome, conceito ou ideia
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex.: dádiva, território, Elias" />
              </label>
              <ChipGroup label="Tradição" items={grupos} selected={sel} onToggle={toggle} onClear={() => update({ g: null })} />
            </div>
            <p className={k.muted}>
              {lista.length} de {d.pensadores.length} pensadores · {ver} de {obras.length} obras com selo “verificado”; o restante vem de resumo ou memória (veja o selo em cada obra).
            </p>
            {lista.length === 0 ? <p className={k.none}>Nenhum pensador corresponde à busca.</p> : (
              <div className={k.grid}>{lista.map((p) => <ThinkerCard key={p.id} p={p} decisoesOk={decisoesOk} cross={cross.get(p.id)} />)}</div>
            )}
          </div>
        )}
        {aba === 'pilares' && (
          <div className={k.grid2}>
            {d.pilares.map((p) => (
              <article key={p.id} id={p.id} className={`card ${k.pad}`}>
                <h3 className={k.title}>{p.nome}</h3>
                {p.principio && <p className={k.text}><b>Princípio.</b> {p.principio}</p>}
                {p.traducao_institucional && <p className={k.text}><b>Tradução institucional.</b> {p.traducao_institucional}</p>}
                {(p.origem?.length ?? 0) > 0 && (
                  <>
                    <p className={k.lbl}>Origem</p>
                    <ul className={k.chips}>{p.origem?.map((o) => <li key={o}>{nome.get(o) ?? o}</li>)}</ul>
                  </>
                )}
                {(p.exemplos_em_operacao?.length ?? 0) > 0 && (
                  <details className={styles.det}><summary>Exemplos em operação ({p.exemplos_em_operacao?.length})</summary><ul className={k.list}>{p.exemplos_em_operacao?.map((x) => <li key={x}>{x}</li>)}</ul></details>
                )}
                <div className={k.two}>
                  <div><p className={k.lbl}>Indicadores</p><ul className={k.list}>{(p.indicadores ?? []).map((x) => <li key={x}>{x}</li>)}</ul></div>
                  <div><p className={k.lbl}>Riscos</p><ul className={k.list}>{(p.riscos ?? []).map((x) => <li key={x}>{x}</li>)}</ul></div>
                </div>
                {(p.tensoes?.length ?? 0) > 0 && (<><p className={k.lbl}>Tensões com outros pilares</p><ul className={k.list}>{p.tensoes?.map((x) => <li key={x}>{x}</li>)}</ul></>)}
                {(p.ligacao_decisoes?.length ?? 0) > 0 && (
                  <ul className={k.links}>{p.ligacao_decisoes?.map((id) => <li key={id}>{decisoesOk.has(id) ? <Link to={`/decisoes?sel=${id}`}>decisão: {id}</Link> : <span className={k.tagc}>decisão: {id}</span>}</li>)}</ul>
                )}
              </article>
            ))}
          </div>
        )}
        {aba === 'dialogos' && (
          <div className={k.stack}>
            {(d.dialogos ?? []).map((x, i) => (
              <article key={i} className={`card ${k.pad}`}>
                <header>
                  <p className={k.lbl}>{x.entre.map((e) => nome.get(e) ?? e).join(' × ')}</p>
                  <h3 className={k.title}>{x.tema}</h3>
                </header>
                <div className={k.two}>
                  <div><p className={`${k.lbl} ${styles.conv}`}>Convergem</p><p className={k.text}>{x.convergencia}</p></div>
                  <div><p className={`${k.lbl} ${styles.div}`}>Divergem</p><p className={k.text}>{x.divergencia}</p></div>
                </div>
              </article>
            ))}
          </div>
        )}
        {aba === 'viabilizacao' && (
          <div className={k.grid2}>
            {(d.viabilizacao ?? []).map((v) => (
              <article key={v.id} id={v.id} className={`card ${k.pad}`}>
                <header className={k.head}>
                  <h3 className={k.title}>{v.proposta}</h3>
                  <Badge tone="brand">{v.id}</Badge>
                </header>
                <p className={k.sub}>Pilar: {pilarNome.get(v.pilar) ?? v.pilar}</p>
                <dl className={k.kv}>
                  {v.instrumento_legal && (<><dt>Instrumento</dt><dd>{v.instrumento_legal}</dd></>)}
                  {v.quorum_aproximado && (<><dt>Quórum</dt><dd>{v.quorum_aproximado}</dd></>)}
                  {v.custo_beneficio && (<><dt>Custo e benefício</dt><dd>{v.custo_beneficio}</dd></>)}
                  {v.evidencia && (<><dt>Evidência</dt><dd>{v.evidencia}</dd></>)}
                  {v.risco_de_captura && (<><dt>Risco de captura</dt><dd>{v.risco_de_captura}</dd></>)}
                  {v.indicador_de_sucesso && (<><dt>Indicador</dt><dd>{v.indicador_de_sucesso}</dd></>)}
                </dl>
                {(porProposta.get(v.id)?.length ?? 0) > 0 && (
                  <ul className={k.links} aria-label="Decisões do catálogo ligadas a esta proposta">
                    {porProposta.get(v.id)?.map((id) => <li key={id}><Link to={`/decisoes?sel=${id}`}>decisão: {id}</Link></li>)}
                  </ul>
                )}
                {(v.fontes?.length ?? 0) > 0 && (
                  <ul className={k.src}>{v.fontes?.map((f) => <li key={f.titulo}><Seal v={f.verificado} />{f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.titulo}</a> : f.titulo}</li>)}</ul>
                )}
              </article>
            ))}
          </div>
        )}
      </Tabs>
    </div>
  )
}

export default function PilaresPage() {
  const q = usePilares()
  return (
    <PageTemplate>
      <SectionHeader level={1} title="Pilares de pensamento" description="Pensamento indígena latino-americano, afro-brasileiro e decolonial lado a lado com Elias, Mauss, Polanyi, Ostrom e outros: o que cada ideia permite desenhar, com os casos em operação e as críticas." />
      <PageGate query={q} file="pilares_pensamento.json">{(d) => <Content d={d} />}</PageGate>
    </PageTemplate>
  )
}

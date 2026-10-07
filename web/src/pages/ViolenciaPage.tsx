import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { BasisSeal } from '@/components/molecules/BasisSeal'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { InlineNote } from '@/components/molecules/InlineNote'
import { PageGate } from '@/components/molecules/PageGate'
import { Seal } from '@/components/molecules/Seal'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { Tabs } from '@/components/molecules/Tabs'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { usePilares } from '@/features/conhecimento/hooks'
import { useDecisoes } from '@/features/data/hooks'
import { brl, isHttp, tipoBasis } from '@/features/risco/model'
import { useViolencia } from '@/features/violencia/hooks'
import { GRUPOS_V, grupoV, norm, partirDebate } from '@/features/violencia/model'
import type { PensadorV, Violencia } from '@/features/violencia/schemas'
import { cn } from '@/lib/cn'
import { fInt } from '@/lib/format'
import { useScrollToId } from '@/lib/useScrollToId'
import { useUrlState } from '@/lib/useUrlState'
import k from './know.module.css'
import s from './ViolenciaPage.module.css'

type Aba = 'pensadores' | 'tipologia' | 'dialogos' | 'dados' | 'custo' | 'debate' | 'perguntas'
const ABAS: Aba[] = ['pensadores', 'tipologia', 'dialogos', 'dados', 'custo', 'debate', 'perguntas']
const csv = (v: string | null) => (v ? v.split(',').filter(Boolean) : [])
const curto = (t: string | null | undefined, n = 120) => (t && t.length > n ? `${t.slice(0, n - 1)}…` : (t ?? ''))

type Refs = { pilares: Set<string>; pilarThinkers: Set<string>; decisoes: Set<string> }

function Detalhe({ p, refs, onClose, nomes }: { p: PensadorV; refs: Refs; onClose: () => void; nomes: Map<string, string> }) {
  const lig = p.ligacoes
  const verObras = (p.obra_chave ?? []).filter((o) => o.verificado).length
  return (
    <article id="violencia-detalhe" className={cn('card', k.pad, s.panel)} aria-label={`Detalhe: ${p.nome}`}>
      <header className={s.panelHead}>
        <div>
          <p className={k.lbl}>{grupoV(p)}</p>
          <h3 className={k.title}>{p.nome}</h3>
          {p.tradicao && <p className={k.sub}>{p.tradicao}</p>}
        </div>
        <button type="button" className={s.close} onClick={onClose}>Fechar detalhe</button>
      </header>
      {p.ideia_central && <p className={k.text}><b>Ideia central.</b> {p.ideia_central}</p>}
      {(p.conceitos?.length ?? 0) > 0 && <ul className={k.chips} aria-label="Conceitos">{p.conceitos?.map((c) => <li key={c}>{c}</li>)}</ul>}
      {p.explica_no_brasil && <p className={k.text}><b>O que ajuda a explicar no Brasil.</b> {p.explica_no_brasil}</p>}
      {(p.obra_chave?.length ?? 0) > 0 && (
        <>
          <p className={k.lbl}>Obras-chave · {verObras} de {p.obra_chave?.length} com referência conferida (DOI ou página com título e ano; não atesta o conteúdo)</p>
          <ul className={k.src}>
            {p.obra_chave?.map((o) => (
              <li key={o.titulo}>
                <Seal v={o.verificado} labels={{ yes: 'referência conferida', no: 'não verificado' }} />
                {isHttp(o.url) ? <a href={o.url} target="_blank" rel="noreferrer">{o.titulo}</a> : <span>{o.titulo}</span>}
                {o.ano ? <span>({o.ano})</span> : null}
              </li>
            ))}
          </ul>
        </>
      )}
      {(p.evidencias?.length ?? 0) > 0 && (
        <>
          <p className={k.lbl}>Evidências</p>
          <ul className={s.ev}>
            {p.evidencias?.map((e, i) => (
              <li key={i}>
                <div className={s.evTop}>
                  <Seal v={e.verificado} labels={{ yes: 'lido na fonte', no: 'não lido na fonte' }} />
                  {isHttp(e.url) ? <a href={e.url} target="_blank" rel="noreferrer">{e.fonte ?? 'fonte'}</a> : <span>{e.fonte}</span>}
                </div>
                <p className={k.text}>{e.descricao}</p>
              </li>
            ))}
          </ul>
        </>
      )}
      {p.criticas && (
        <div className={s.crit}>
          <p className={k.lbl}>Críticas e limites</p>
          <p className={k.text}>{p.criticas}</p>
        </div>
      )}
      <ul className={k.links} aria-label="Ligações com o resto do projeto">
        {lig?.pilares?.map((id) => (
          <li key={`p${id}`}>
            <Link to={refs.pilares.has(id) ? '/pilares?aba=pilares' : '/pilares'}>{refs.pilares.has(id) ? 'pilar' : refs.pilarThinkers.has(id) ? 'pensador em Pilares' : 'pilares'}: {nomes.get(id) ?? id}</Link>
          </li>
        ))}
        {lig?.decisoes?.map((id) => <li key={`d${id}`}>{refs.decisoes.has(id) ? <Link to={`/decisoes?sel=${id}`}>decisão: {id}</Link> : <span className={k.tagc}>decisão: {id}</span>}</li>)}
        {lig?.indicadores?.map((id) => <li key={`i${id}`}>{id.startsWith('series:') ? <Link to="/mapa?m=homicidios">série: {id.slice(7)}</Link> : <Link to="/gente">indicador: {id}</Link>}</li>)}
        {lig?.aneis?.map((id) => <li key={`a${id}`}><Link to="/historia?aba=aneis">anel: {id}</Link></li>)}
      </ul>
    </article>
  )
}

function Pensadores({ d, refs, nomesPilares }: { d: Violencia; refs: Refs; nomesPilares: Map<string, string> }) {
  const { get, update } = useUrlState()
  const [q, setQ] = useState('')
  const sel = new Set(csv(get('g')))
  const pid = get('p')
  const atual = d.pensadores.find((p) => p.id === pid) ?? null
  useScrollToId(atual ? 'violencia-detalhe' : null, atual?.id)
  const grupos = useMemo(() => GRUPOS_V.map((g) => ({ key: g, count: d.pensadores.filter((p) => grupoV(p) === g).length })).filter((g) => g.count > 0), [d.pensadores])
  const nq = norm(q.trim())
  const lista = d.pensadores.filter((p) => (sel.size === 0 || sel.has(grupoV(p))) && (!nq || norm(`${p.nome} ${p.tradicao ?? ''} ${p.ideia_central ?? ''} ${(p.conceitos ?? []).join(' ')}`).includes(nq)))
  const toggle = (key: string) => {
    const n = new Set(sel)
    if (n.has(key)) n.delete(key)
    else n.add(key)
    update({ g: [...n].join(',') || null })
  }
  const obras = d.pensadores.flatMap((p) => p.obra_chave ?? [])
  const evs = d.pensadores.flatMap((p) => p.evidencias ?? [])
  const semEv = d.pensadores.filter((p) => !(p.evidencias ?? []).some((e) => e.verificado)).length
  return (
    <div className={k.stack}>
      <div className={k.filters}>
        <label className={k.search}>
          Buscar por nome, conceito ou ideia
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex.: monopólio legítimo, sujeição criminal" />
        </label>
        <ChipGroup label="Família de leitura" items={grupos} selected={sel} onToggle={toggle} onClear={() => update({ g: null })} />
      </div>
      <p className={k.muted} aria-live="polite">
        {lista.length} de {d.pensadores.length} pensadores · {obras.filter((o) => o.verificado).length} de {obras.length} obras com referência conferida · {evs.filter((e) => e.verificado).length} de {evs.length} evidências lidas na fonte; {semEv} pensadores não têm nenhuma evidência lida na fonte.
      </p>
      {atual && <Detalhe p={atual} refs={refs} nomes={nomesPilares} onClose={() => update({ p: null })} />}
      {lista.length === 0 ? (
        <p className={k.none}>Nenhum pensador corresponde à busca.</p>
      ) : (
        <ul className={s.pick}>
          {lista.map((p) => (
            <li key={p.id}>
              <button type="button" className={s.pickBtn} aria-pressed={p.id === pid} onClick={() => update({ p: p.id === pid ? null : p.id })}>
                <span className={s.pickName}>{p.nome}</span>
                <span className={s.pickSub}>{curto(p.tradicao, 70)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Tipologia({ d, nomes, onPick }: { d: Violencia; nomes: Map<string, string>; onPick: (id: string) => void }) {
  return (
    <div className={k.grid2}>
      {(d.tipologia ?? []).map((t) => (
        <article key={t.id} className={cn('card', k.pad, s.tipo)}>
          <h3 className={k.title}>{t.tipo}</h3>
          {t.definicao && <p className={k.text}>{t.definicao}</p>}
          {(t.pensadores?.length ?? 0) > 0 && (
            <>
              <p className={k.lbl}>Quem pensou</p>
              <ul className={s.pens}>{t.pensadores?.map((id) => <li key={id}><button type="button" onClick={() => onPick(id)}>{nomes.get(id) ?? id}</button></li>)}</ul>
            </>
          )}
          {(t.exemplos_brasil?.length ?? 0) > 0 && (
            <>
              <p className={k.lbl}>Exemplos medidos no Brasil</p>
              <ul className={s.ex}>
                {t.exemplos_brasil?.map((e, i) => (
                  <li key={i}>
                    <span>{e.descricao}:</span>
                    {e.valor != null && <b>{typeof e.valor === 'number' ? fInt(e.valor) : e.valor}</b>}
                    <Seal v={e.verificado} labels={{ yes: 'lido na fonte', no: 'não verificado' }} />
                    {e.fonte && <span className={k.muted}>{e.fonte}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
          {t.como_medir && <p className={k.text}><b>Como medir.</b> {t.como_medir}</p>}
          {t.limites && <p className={k.text}><b>Limites.</b> {t.limites}</p>}
        </article>
      ))}
    </div>
  )
}

function Dialogos({ d, nomes }: { d: Violencia; nomes: Map<string, string> }) {
  return (
    <div className={k.stack}>
      <p className={k.muted}>Convergência e divergência lado a lado, sem escolher um lado. Onde há teste empírico, ele está citado no próprio texto.</p>
      <div className={s.cards}>
      {(d.dialogos ?? []).map((x, i) => (
        <article key={i} className={cn('card', k.pad)}>
          <header>
            <p className={k.lbl}>{x.entre.map((e) => nomes.get(e) ?? e).join(' × ')}</p>
            <h3 className={k.title}>{x.tema}</h3>
          </header>
          <div className={s.versus}>
            <div className={cn(s.col, s.colA)}><p className={cn(k.lbl, s.conv)}>Convergem</p><p className={k.text}>{x.convergencia}</p></div>
            <div className={cn(s.col, s.colB)}><p className={cn(k.lbl, s.div)}>Divergem</p><p className={k.text}>{x.divergencia}</p></div>
          </div>
        </article>
      ))}
      </div>
    </div>
  )
}

function Dados({ d }: { d: Violencia }) {
  const linhas = d.dados_do_repositorio ?? []
  const sim = linhas.find((x) => /intervencao_legal/.test(x.indicador_id))
  const fbsp = sim?.nota ? /([\d.]+)\s+mortes por intervenção/i.exec(sim.nota)?.[1] : undefined
  return (
    <div className={k.stack}>
      <InlineNote id="viol-dados-contagem" tone="info" dismissible={false} title="Contagens de pessoas, não ranking.">
        Os valores abaixo vêm de arquivos do repositório e são contagens de mortes e notificações. Não são causais e não entram no modelo macro. Indicadores ausentes aparecem como “sem dado”, nunca como zero.
      </InlineNote>
      {sim && (
        <section aria-labelledby="viol-disc" className={cn('card', k.pad)}>
          <p className={k.lbl} id="viol-disc">Discrepância mostrada sem reconciliar</p>
          <h3 className={k.title}>Mortes por intervenção legal ou policial, {String(sim.ano ?? '')}</h3>
          <div className={s.side}>
            <div className={cn(s.col, s.colA)}>
              <p className={k.lbl}>SIM (Sistema de Informações sobre Mortalidade, via repositório)</p>
              <p className={s.big}>{typeof sim.valor === 'number' ? fInt(sim.valor) : (sim.valor ?? '—')}</p>
              <p className={k.muted}>Intervenção legal (CID Y35–Y36), contagem de óbitos.</p>
            </div>
            <div className={cn(s.col, s.colB)}>
              <p className={k.lbl}>FBSP (Anuário), registros policiais</p>
              <p className={s.big}>{fbsp ?? '—'}</p>
              <p className={k.muted}>Mortes por intervenção policial, como informado no Anuário.</p>
            </div>
          </div>
          <p className={k.text}>Definições e registros diferem; não comparar sem ressalva. Nenhum dos dois é “o certo”: o repositório mostra os dois e não calcula diferença.</p>
        </section>
      )}
      <div className={k.tableWrap}>
        <table className={k.table}>
          <caption className="sr-only">Indicadores do repositório usados nesta página</caption>
          <thead>
            <tr><th scope="col">Indicador</th><th scope="col" className={k.n}>Valor</th><th scope="col">Ano</th><th scope="col">Arquivo</th><th scope="col">Nota</th></tr>
          </thead>
          <tbody>
            {linhas.map((x) => (
              <tr key={x.indicador_id} className={x.valor == null ? k.hi : undefined}>
                <td><code>{x.indicador_id}</code></td>
                <td className={k.n}>{x.valor == null ? 'sem dado' : typeof x.valor === 'number' ? fInt(x.valor) : x.valor}</td>
                <td>{x.ano == null ? '—' : String(x.ano)}</td>
                <td>{x.fonte_arquivo ?? '—'}</td>
                <td>{x.nota}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Custo({ d }: { d: Violencia }) {
  return (
    <div className={k.stack}>
      <InlineNote id="viol-custo-nao-somar" tone="warn" dismissible={false} title="Não somar.">
        Estimativas de custo medem coisas diferentes (gasto público, bem-estar, mercados ilícitos, dano ambiental), em anos e preços diferentes. Nada foi somado nem deflacionado.
      </InlineNote>
      <InlineNote id="viol-custo-secundaria" tone="info" dismissible={false} title="Fontes secundárias.">
        Os documentos primários do Ipea, do FBSP e do BID não foram abertos: os valores vêm de reportagens ou páginas que citam o órgão. “Lido na fonte” significa lido nessa página, não no estudo original.
      </InlineNote>
      <div className={k.grid2}>
        {(d.custo_economico ?? []).map((c, i) => (
          <article key={i} className={cn('card', k.pad, s.custo)}>
            <header className={k.head}>
              <h3 className={k.title}>{c.descricao}</h3>
              <BasisSeal basis={tipoBasis(c.tipo)} verified={c.verificado ?? false} verifiedLabels={{ yes: 'lido na fonte', no: 'não lido na fonte' }} />
            </header>
            <p className={s.valor}>{c.valor_rs_bi != null ? brl(c.valor_rs_bi) : 'sem valor em R$'}</p>
            <p className={k.sub}>{c.periodo}{c.tipo ? ` · ${c.tipo}` : ''}</p>
            {c.metodo && <p className={k.text}><b>Método.</b> {c.metodo}</p>}
            {c.ressalva && <p className={k.text}><b>Ressalva.</b> {c.ressalva}</p>}
            {c.fonte && <p className={k.muted}>{isHttp(c.url) ? <a href={c.url} target="_blank" rel="noreferrer">{c.fonte}</a> : c.fonte}</p>}
          </article>
        ))}
      </div>
    </div>
  )
}

function Debate({ d, nomes }: { d: Violencia; nomes: Map<string, string> }) {
  const dlg = (d.dialogos ?? []).find((x) => x.entre.includes('becker') && x.entre.includes('sampson'))
  const partes = partirDebate(dlg?.divergencia)
  const misse = (d.dialogos ?? []).find((x) => x.entre.includes('misse') && x.entre.includes('wacquant'))
  if (!dlg) return <p className={k.none}>O diálogo punitivista × preventivo não está no arquivo.</p>
  return (
    <div className={k.stack}>
      <InlineNote id="viol-debate" tone="info" dismissible={false} title="As duas melhores versões, lado a lado.">
        {dlg.entre.map((e) => nomes.get(e) ?? e).join(' × ')}: {dlg.tema}. Nenhuma das duas é apresentada como caricatura, e a evidência disponível vem logo abaixo.
      </InlineNote>
      {dlg.convergencia && <p className={k.text}><b>Onde convergem.</b> {dlg.convergencia}</p>}
      {partes.punitivista || partes.preventiva ? (
        <div className={s.versus}>
          <section className={cn(s.col, s.colB)} aria-labelledby="deb-pun">
            <p className={k.lbl} id="deb-pun">Melhor versão punitivista (dissuasão)</p>
            <p className={k.text}>{partes.punitivista ?? '—'}</p>
          </section>
          <section className={cn(s.col, s.colA)} aria-labelledby="deb-pre">
            <p className={k.lbl} id="deb-pre">Melhor versão preventiva (eficácia coletiva)</p>
            <p className={k.text}>{partes.preventiva ?? '—'}</p>
          </section>
        </div>
      ) : (
        <p className={k.text}>{partes.bruto}</p>
      )}
      {partes.evidencia && <p className={k.text}><b>Evidência disponível.</b> {partes.evidencia}</p>}
      {partes.sintese && <p className={k.text}><b>Síntese.</b> {partes.sintese}</p>}
      {misse && (
        <p className={k.muted}>
          Veja também: {misse.entre.map((e) => nomes.get(e) ?? e).join(' × ')} — {misse.tema}. Está na aba Diálogos.
        </p>
      )}
    </div>
  )
}

function Content({ d }: { d: Violencia }) {
  const { get, update } = useUrlState()
  const aba: Aba = ABAS.find((a) => a === get('aba')) ?? 'pensadores'
  const nomes = useMemo(() => new Map(d.pensadores.map((p) => [p.id, p.nome])), [d.pensadores])
  const pilQ = usePilares()
  const decQ = useDecisoes('decisoes.json')
  const refs: Refs = useMemo(
    () => ({
      pilares: new Set((pilQ.data?.pilares ?? []).map((x) => x.id)),
      pilarThinkers: new Set((pilQ.data?.pensadores ?? []).map((x) => x.id)),
      decisoes: new Set((decQ.data?.decisoes ?? []).map((x) => x.id)),
    }),
    [pilQ.data, decQ.data],
  )
  const nomesPilares = useMemo(() => {
    const m = new Map<string, string>()
    for (const x of pilQ.data?.pilares ?? []) m.set(x.id, x.nome)
    for (const x of pilQ.data?.pensadores ?? []) m.set(x.id, x.nome)
    return m
  }, [pilQ.data])
  return (
    <div className={k.stack}>
      <div className={s.fixed}>
        <InlineNote id="viol-justificar" tone="danger" dismissible={false} baseId="pensadores-violencia" title="Como não justificar violência.">
          Explicar por que a violência ocorre, ou como já foi usada, não é recomendá-la. Autores como Fanon, Sorel e Schmitt aparecem como objeto de estudo, ao lado de suas críticas e da tradição da não violência. Marighella e a luta armada entram como objeto histórico, sem equiparar escalas com a repressão.
        </InlineNote>
        <InlineNote id="viol-prescricao" tone="warn" dismissible={false} title="Descrição teórica ≠ prescrição.">
          Nada aqui recomenda uma política de segurança. Teorias descrevem mecanismos; o que funciona no Brasil exige evidência local, que o arquivo marca como lida ou não lida na fonte.
        </InlineNote>
        <InlineNote id="viol-vitimas" tone="info" dismissible={false} title="Vítimas são pessoas.">
          Os números são contagens de pessoas, sem imagens e sem ranking. Indicadores não são causais e não entram no modelo macro.
        </InlineNote>
      </div>
      <Tabs<Aba>
        label="Seções de pensadores da violência"
        value={aba}
        onChange={(a) => update({ aba: a === 'pensadores' ? null : a })}
        tabs={[
          { key: 'pensadores', label: 'Pensadores', count: d.pensadores.length },
          { key: 'tipologia', label: 'Tipologia', count: d.tipologia?.length ?? 0 },
          { key: 'dialogos', label: 'Diálogos', count: d.dialogos?.length ?? 0 },
          { key: 'dados', label: 'Dados do repositório', count: d.dados_do_repositorio?.length ?? 0 },
          { key: 'custo', label: 'Custo econômico', count: d.custo_economico?.length ?? 0 },
          { key: 'debate', label: 'Punitivista × preventivo' },
          { key: 'perguntas', label: 'Perguntas abertas', count: d.perguntas_abertas?.length ?? 0 },
        ]}
      >
        {aba === 'pensadores' && <Pensadores d={d} refs={refs} nomesPilares={nomesPilares} />}
        {aba === 'tipologia' && <Tipologia d={d} nomes={nomes} onPick={(id) => update({ aba: null, p: id })} />}
        {aba === 'dialogos' && <Dialogos d={d} nomes={nomes} />}
        {aba === 'dados' && <Dados d={d} />}
        {aba === 'custo' && <Custo d={d} />}
        {aba === 'debate' && <Debate d={d} nomes={nomes} />}
        {aba === 'perguntas' && (
          <div className={k.stack}>
            <p className={k.muted}>O que os dados e as leituras não respondem.</p>
            <ul className={k.list}>{(d.perguntas_abertas ?? []).map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        )}
      </Tabs>
      {(d.limites?.length ?? 0) > 0 && (
        <details className={s.det}>
          <summary>Limites declarados no arquivo ({d.limites?.length})</summary>
          <ul className={k.list}>{d.limites?.map((x) => <li key={x}>{x}</li>)}</ul>
        </details>
      )}
      {d.meta?.aviso && <p className={k.muted}><Badge>aviso do arquivo</Badge> {d.meta.aviso}</p>}
    </div>
  )
}

export default function ViolenciaPage() {
  const q = useViolencia()
  return (
    <PageTemplate>
      <SectionHeader level={1} title="Pensadores da violência" description="Setenta e um pensadores de tradições diferentes — do monopólio da força à violência simbólica, da resistência não violenta ao pensamento brasileiro — e o que cada um ajuda a entender, com evidência e crítica." />
      <PageGate query={q} file="pensadores_violencia.json">{(d) => <Content d={d} />}</PageGate>
    </PageTemplate>
  )
}

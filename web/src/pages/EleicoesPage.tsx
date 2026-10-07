import { useEffect, useMemo, useRef } from 'react'
import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { Select } from '@/components/atoms/Select'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { EmptyState } from '@/components/molecules/EmptyState'
import { InlineNote } from '@/components/molecules/InlineNote'
import { PageGate } from '@/components/molecules/PageGate'
import { Seal } from '@/components/molecules/Seal'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { Tabs } from '@/components/molecules/Tabs'
import { ElectionPanel, MovementPanel, RevisaoList } from '@/components/organisms/ElectionPanel'
import { ElectionTimeline, isMarco, type TlSel } from '@/components/organisms/ElectionTimeline'
import { ElectorateChart } from '@/components/organisms/ElectorateChart'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useTextosIndex } from '@/features/biblioteca/hooks'
import { indiceCruzado, norm } from '@/features/biblioteca/model'
import { useEleicoesTimeline } from '@/features/eleicoes/hooks'
import { espectroLabel, ESPECTROS, fmtVal, nCampo, regimeDoAno, revisoesPorId, TIPOS } from '@/features/eleicoes/model'
import type { EleicoesTimeline } from '@/features/eleicoes/schemas'
import { cn } from '@/lib/cn'
import { useUrlState } from '@/lib/useUrlState'
import k from './know.module.css'
import s from './EleicoesPage.module.css'

type Aba = 'linha' | 'movimentos' | 'regras' | 'revisao'
const ABAS: Aba[] = ['linha', 'movimentos', 'regras', 'revisao']
const csv = (v: string | null) => new Set((v ?? '').split(',').filter(Boolean))
const PAGE = 25

function Content({ d }: { d: EleicoesTimeline }) {
  const { get, update } = useUrlState()
  const aba: Aba = ABAS.find((a) => a === get('aba')) ?? 'linha'
  const epoca = get('ep') ?? 'tudo'
  const selTipo = csv(get('tipo'))
  const selEsp = csv(get('esp'))
  const q = get('q') ?? ''
  const regime = get('reg') ?? ''
  const eSel = get('e')
  const mSel = get('m')
  const tlSel: TlSel = eSel ? { kind: 'e', id: eSel } : mSel ? { kind: 'm', id: mSel } : null

  const txtQ = useTextosIndex()
  const cruz = useMemo(() => indiceCruzado(txtQ.data?.documentos ?? []), [txtQ.data])
  const eleicoes = useMemo(() => new Map(d.eleicoes.map((e) => [e.id, e])), [d.eleicoes])
  const movimentos = useMemo(() => new Map(d.movimentos.map((m) => [m.id, m])), [d.movimentos])
  const revs = d.meta?.revisao ?? []
  const revPorId = useMemo(() => revisoesPorId(revs), [revs])

  const nq = norm(q.trim())
  const regimes = useMemo(() => [...new Set(d.eleicoes.map((e) => regimeDoAno(e.ano).label))], [d.eleicoes])
  const eFilt = useMemo(
    () =>
      d.eleicoes.filter(
        (e) => (selTipo.size === 0 || selTipo.has(e.tipo)) && (!regime || regimeDoAno(e.ano).label === regime) && (nq.length < 2 || norm(`${e.cargo} ${e.ano} ${e.regime ?? ''}`).includes(nq)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d.eleicoes, get('tipo'), regime, nq],
  )
  const mFilt = useMemo(
    () => d.movimentos.filter((m) => (selEsp.size === 0 || selEsp.has(m.espectro ?? 'n/a')) && (nq.length < 2 || norm(`${m.nome} ${m.periodo ?? ''}`).includes(nq))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d.movimentos, get('esp'), nq],
  )
  const toggle = (key: string, set: Set<string>, item: string) => {
    const n = new Set(set)
    if (n.has(item)) n.delete(item)
    else n.add(item)
    update({ [key]: n.size ? [...n].join(',') : null })
  }

  const painel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!tlSel) return
    const h = requestAnimationFrame(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      painel.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
    })
    return () => cancelAnimationFrame(h)
  }, [eSel, mSel]) // eslint-disable-line react-hooks/exhaustive-deps

  const selE = eSel ? eleicoes.get(eSel) : undefined
  const selM = mSel ? movimentos.get(mSel) : undefined
  const regrasOk = d.eleicoes.filter((e) => e.regras_de_voto?.regras_verificado === true).length
  const revOk = revs.filter((r) => r.verificado === true).length

  const painelEl = selE ? (
    <ElectionPanel
      e={selE}
      revisoes={revPorId.get(selE.id) ?? []}
      biblioteca={cruz.porEleicao.get(selE.id) ?? []}
      movimentos={movimentos}
      onMovimento={(id) => update({ m: id, e: null })}
      onClose={() => update({ e: null })}
    />
  ) : selM ? (
    <MovementPanel
      m={selM}
      eleicoes={eleicoes}
      biblioteca={cruz.porMovimento.get(selM.id) ?? []}
      onEleicao={(id) => update({ e: id, m: null, aba: null })}
      onClose={() => update({ m: null })}
    />
  ) : null

  return (
    <div className={k.stack}>
      <div className={s.fixed}>
        <InlineNote id="el-neutro" tone="info" baseId="eleicoes-timeline" dismissible={false} title="Mesmo método para todos os lados.">
          Cada movimento (de esquerda, centro, direita ou transversal) tem a mesma ficha: origem, base social, organização, mídia, financiamento e regras, alianças, viradas, resultado e declínio. O rótulo de espectro é uma convenção editorial, não uma medição, e ninguém é acusado: as controvérsias ficam ao lado do que se sabe.
        </InlineNote>
        {d.meta?.aviso && (
          <InlineNote id="el-fontes" tone="warn" baseId="eleicoes-timeline" dismissible={false} title="Fontes.">
            {d.meta.aviso}
          </InlineNote>
        )}
      </div>

      <div className={k.stats}>
        <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Eleições e marcos</p><p className={s.big}>{d.eleicoes.length}</p><p className={k.muted}>{d.eleicoes.filter(isMarco).length} são marcos de regra, não eleições</p></div>
        <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Movimentos</p><p className={s.big}>{d.movimentos.length}</p><p className={k.muted}>com passos datados de construção</p></div>
        <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Regras de voto lidas no texto legal</p><p className={s.big}>{regrasOk}<span className={s.of}> / {d.eleicoes.length}</span></p><p className={k.muted}>o resto vem de fonte secundária</p></div>
        <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Correções na revisão de fontes</p><p className={s.big}>{revs.length}</p><p className={k.muted}>{revOk} lidas na fonte; o restante segue marcado</p></div>
      </div>

      <Tabs<Aba>
        label="Seções da linha do tempo eleitoral"
        value={aba}
        onChange={(a) => update({ aba: a === 'linha' ? null : a })}
        tabs={[
          { key: 'linha', label: 'Linha do tempo', count: d.eleicoes.length },
          { key: 'movimentos', label: 'Movimentos', count: d.movimentos.length },
          { key: 'regras', label: 'Regras do voto', count: d.regras_ao_longo_do_tempo?.length ?? 0 },
          { key: 'revisao', label: 'Revisão', count: revs.length },
        ]}
      >
        {aba === 'linha' && (
          <div className={k.stack}>
            <div className={k.filters} role="group" aria-label="Filtros da linha do tempo">
              <ChipGroup label="Tipo" items={TIPOS.map((t) => ({ key: t.key, label: t.label, count: d.eleicoes.filter((e) => e.tipo === t.key).length }))} selected={selTipo} onToggle={(i) => toggle('tipo', selTipo, i)} onClear={() => update({ tipo: null })} />
              <label className={s.sel}>Regime<Select value={regime} onChange={(e) => update({ reg: e.target.value || null })}><option value="">todos</option>{regimes.map((r) => <option key={r} value={r}>{r}</option>)}</Select></label>
              <label className={k.search}>Buscar cargo ou ano<input type="search" value={q} onChange={(e) => update({ q: e.target.value || null })} placeholder="ex.: Presidente, 1932, Constituição…" /></label>
            </div>
            <ElectionTimeline
              eleicoes={eFilt}
              movimentos={d.movimentos.filter((m) => selEsp.size === 0 || selEsp.has(m.espectro ?? 'n/a'))}
              selected={tlSel}
              onSelect={(sel) => update(sel ? (sel.kind === 'e' ? { e: sel.id, m: null } : { m: sel.id, e: null }) : { e: null, m: null })}
              epoca={epoca}
              onEpoca={(ep) => update({ ep: ep === 'tudo' ? null : ep })}
            />
            <ChipGroup label="Espectro dos movimentos (convenção editorial)" items={ESPECTROS.map((x) => ({ key: x.key, label: x.label, count: d.movimentos.filter((m) => (m.espectro ?? 'n/a') === x.key).length }))} selected={selEsp} onToggle={(i) => toggle('esp', selEsp, i)} onClear={() => update({ esp: null })} />
            <div ref={painel}>{painelEl ?? <p className={s.hint}><Icon name="info" size={14} /> Clique numa eleição, num marco de regra ou num movimento para abrir a ficha com fontes, selos e correções.</p>}</div>
            <ElectorateChart eleicoes={d.eleicoes} selectedId={eSel} onSelect={(id) => update({ e: id, m: null })} />
            <section aria-label="Tabela de eleições e marcos" className={k.stack}>
              <h2 className={s.h2}>Todas as eleições e marcos ({eFilt.length})</h2>
              <p className={k.muted}>Equivalente em tabela da linha do tempo: respeita os filtros acima.</p>
              <div className={k.tableWrap}>
                <table className={k.table}>
                  <caption className="sr-only">Eleições e marcos de regra, em ordem cronológica</caption>
                  <thead><tr><th>Ano</th><th>Cargo ou marco</th><th>Tipo</th><th>Regime</th><th className={k.n}>Eleitorado</th><th>Regra de voto</th></tr></thead>
                  <tbody>
                    {eFilt.map((e) => (
                      <tr key={e.id} className={cn(eSel === e.id && k.hi)}>
                        <td>{e.ano}</td>
                        <td><button type="button" className={s.rowBtn} onClick={() => update({ e: e.id, m: null })}>{e.cargo}</button>{isMarco(e) && <Badge>marco</Badge>}</td>
                        <td>{TIPOS.find((t) => t.key === e.tipo)?.label ?? e.tipo}</td>
                        <td>{e.regime ?? '—'}</td>
                        <td className={k.n}>{fmtVal(e.eleitorado?.valor)}</td>
                        <td><Seal v={e.regras_de_voto?.regras_verificado} labels={{ yes: 'lida no texto', no: 'não verificada' }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {eFilt.length === 0 && <EmptyState icon="search" title="Nada com esses filtros">Limpe o tipo, o regime ou a busca.</EmptyState>}
            </section>
          </div>
        )}

        {aba === 'movimentos' && (
          <div className={k.stack}>
            <div className={k.filters} role="group" aria-label="Filtros de movimentos">
              <ChipGroup label="Espectro (convenção editorial)" items={ESPECTROS.map((x) => ({ key: x.key, label: x.label, count: d.movimentos.filter((m) => (m.espectro ?? 'n/a') === x.key).length }))} selected={selEsp} onToggle={(i) => toggle('esp', selEsp, i)} onClear={() => update({ esp: null })} />
              <label className={k.search}>Buscar movimento<input type="search" value={q} onChange={(e) => update({ q: e.target.value || null })} placeholder="nome ou período…" /></label>
            </div>
            <div ref={painel}>{selM ? painelEl : null}</div>
            <p className={k.muted} aria-live="polite">{mFilt.length} de {d.movimentos.length} movimentos</p>
            <div className={s.cards}>
              {mFilt.map((m) => (
                <article key={m.id} className={cn('card', k.pad, mSel === m.id && s.cardOn)}>
                  <header className={k.head}>
                    <div><h3 className={k.title}>{m.nome}</h3><p className={k.sub}>{m.periodo ?? 'período n/d'}</p></div>
                    <Badge tone="brand">{espectroLabel(m.espectro)}</Badge>
                  </header>
                  <p className={k.text}>{(m.origem ?? '').length > 220 ? `${m.origem?.slice(0, 220)}…` : m.origem}</p>
                  <ul className={k.chips}><li>{m.como_se_construiu?.length ?? 0} passos</li><li>{m.viradas?.length ?? 0} viradas</li><li>{m.eleicoes_ids?.length ?? 0} eleições</li></ul>
                  <button type="button" className={s.openBtn} onClick={() => update({ m: m.id, e: null })}>Abrir a ficha <Icon name="arrowRight" size={14} /></button>
                </article>
              ))}
            </div>
          </div>
        )}

        {aba === 'regras' && <Regras d={d} />}
        {aba === 'revisao' && <Revisao d={d} />}
      </Tabs>
      {(d.limites?.length ?? 0) > 0 && (
        <details className={s.det}>
          <summary>Limites declarados no arquivo ({d.limites?.length})</summary>
          <ul className={k.list}>{d.limites?.map((x) => <li key={x}>{x}</li>)}</ul>
        </details>
      )}
    </div>
  )
}

function Regras({ d }: { d: EleicoesTimeline }) {
  const { get, update } = useUrlState()
  const q = get('q') ?? ''
  const nq = norm(q.trim())
  const rs = useMemo(() => [...(d.regras_ao_longo_do_tempo ?? [])].sort((a, b) => a.ano - b.ano).filter((r) => nq.length < 2 || norm(`${r.regra} ${r.efeito_no_eleitorado ?? ''} ${r.ano}`).includes(nq)), [d.regras_ao_longo_do_tempo, nq])
  return (
    <div className={k.stack}>
      <label className={k.search}>Buscar regra<input type="search" value={q} onChange={(e) => update({ q: e.target.value || null })} placeholder="ex.: analfabetos, mulheres, secreto…" /></label>
      <div className={k.tableWrap}>
        <table className={k.table}>
          <caption className="sr-only">Regras do voto ao longo do tempo e seus efeitos no eleitorado</caption>
          <thead><tr><th>Ano</th><th>Regra</th><th>Efeito no eleitorado</th><th>Fonte</th></tr></thead>
          <tbody>
            {rs.map((r, i) => (
              <tr key={`${r.ano}-${i}`}>
                <td>{r.ano}</td>
                <td>{r.regra}</td>
                <td>{r.efeito_no_eleitorado ?? '—'}</td>
                <td><Seal v={r.verificado} />{r.url && <> <a href={r.url} target="_blank" rel="noreferrer">{(r.fonte ?? 'fonte').slice(0, 60)} <Icon name="external" size={11} /></a></>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rs.length === 0 && <EmptyState icon="search" title="Nenhuma regra com essa busca" />}
    </div>
  )
}

function Revisao({ d }: { d: EleicoesTimeline }) {
  const { get, update } = useUrlState()
  const revs = d.meta?.revisao ?? []
  const rid = get('rid') ?? ''
  const rv = get('rv') ?? ''
  const q = get('q') ?? ''
  const nq = norm(q.trim())
  const n = Number(get('n')) || PAGE
  const ids = useMemo(() => [...new Set(revs.map((r) => r.id))].sort(), [revs])
  const filt = useMemo(
    () =>
      revs.filter((r) => (!rid || r.id === rid) && (rv === '' || (rv === 'sim' ? r.verificado === true : r.verificado !== true)) && (nq.length < 2 || norm(`${r.campo ?? ''} ${r.motivo ?? ''} ${fmtVal(r.antes)} ${fmtVal(r.depois)}`).includes(nq))),
    [revs, rid, rv, nq],
  )
  const campos = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of revs) m.set((r.campo ?? '—').split('.')[0] as string, (m.get((r.campo ?? '—').split('.')[0] as string) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [revs])
  if (revs.length === 0) return <EmptyState icon="info" title="Sem registros de revisão">O arquivo não traz <code>meta.revisao</code>.</EmptyState>
  return (
    <div className={k.stack}>
      <InlineNote id="el-rev" tone="info" dismissible={false} title="O que é a revisão.">
        Cada registro mostra o valor antes e depois, o motivo e a fonte. “Lido na fonte” significa que o agente de revisão abriu a página ou o texto legal e conferiu o dado; sem esse selo, a correção ainda não foi confirmada. Os campos mais corrigidos: {campos.map(([c, nn]) => `${nCampo(c)} (${nn})`).join(', ')}.
      </InlineNote>
      <div className={k.filters} role="group" aria-label="Filtros da revisão">
        <label className={s.sel}>Eleição ou marco<Select value={rid} onChange={(e) => update({ rid: e.target.value || null, n: null })}><option value="">todos ({revs.length})</option>{ids.map((i) => <option key={i} value={i}>{i}</option>)}</Select></label>
        <label className={s.sel}>Selo<Select value={rv} onChange={(e) => update({ rv: e.target.value || null, n: null })}><option value="">todos</option><option value="sim">lidos na fonte</option><option value="nao">não verificados</option></Select></label>
        <label className={k.search}>Buscar<input type="search" value={q} onChange={(e) => update({ q: e.target.value || null, n: null })} placeholder="campo, motivo ou valor…" /></label>
      </div>
      <p className={k.muted} aria-live="polite">{filt.length} de {revs.length} registros</p>
      <div className={s.revGrid}>
        {filt.slice(0, n).map((r, i) => (
          <div key={`${r.id}-${r.campo}-${i}`} className={cn('card', k.pad)}>
            <p className={k.sub}><button type="button" className={s.rowBtn} onClick={() => update({ aba: null, e: r.id })}>{r.id}</button> · {r.data}</p>
            <RevisaoList rs={[r]} />
          </div>
        ))}
      </div>
      {filt.length > n && <div className={s.more}><button type="button" className={s.btn} onClick={() => update({ n: String(n + PAGE) })}>Mostrar mais {Math.min(PAGE, filt.length - n)}</button></div>}
      {filt.length === 0 && <EmptyState icon="search" title="Nenhum registro com esses filtros" />}
    </div>
  )
}

export default function EleicoesPage() {
  const q = useEleicoesTimeline()
  return (
    <PageTemplate>
      <SectionHeader level={1} title="Eleições, regras do voto e movimentos" description="60 eleições e marcos de regra, de São Vicente (1532) a 2026, e 30 movimentos que tiveram força: como cada um se construiu, em passos datados, ao lado do que se sabe e do que é disputado. Cada número traz a fonte e o selo de verificação; os textos legais estão na biblioteca." />
      <PageGate query={q} file="eleicoes_timeline.json">{(d) => <Content d={d} />}</PageGate>
    </PageTemplate>
  )
}

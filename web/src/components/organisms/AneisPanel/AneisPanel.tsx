import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { EmptyState } from '@/components/molecules/EmptyState'
import { InlineNote } from '@/components/molecules/InlineNote'
import { Seal } from '@/components/molecules/Seal'
import { LoopInteractions } from '@/components/organisms/LoopInteractions'
import { LoopRing } from '@/components/organisms/LoopRing'
import { forcaLabel, isHypothesis, TIPO_LABEL, tipoShort } from '@/features/aneis/model'
import type { Aneis, Anel } from '@/features/aneis/schemas'
import { cn } from '@/lib/cn'
import styles from './AneisPanel.module.css'

export type AneisPanelProps = {
  data: Aneis
  selected: string | null
  edge: number | null
  onSelect: (id: string | null) => void
  onEdge: (i: number | null) => void
}

const toggle = (s: Set<string>, k: string) => {
  const n = new Set(s)
  if (n.has(k)) n.delete(k)
  else n.add(k)
  return n
}
const asList = (x: string | string[] | null | undefined) => (Array.isArray(x) ? x : x ? [x] : [])

function LinkChips({ ids, to, label }: { ids?: string[] | null; to: (id: string) => string; label: string }) {
  if (!ids || ids.length === 0) return null
  return (
    <div>
      <p className={styles.lbl}>{label}</p>
      <ul className={styles.chips}>
        {ids.map((id) => (
          <li key={id}>
            <Link to={to(id)}>{id}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Detail({ anel, edge, onEdge, nodeName }: { anel: Anel; edge: number | null; onEdge: (i: number | null) => void; nodeName: (id: string) => string }) {
  const sim = anel.simulado_no_modelo
  const e = edge != null ? anel.arestas[edge] : undefined
  return (
    <article className={`card ${styles.detail}`} aria-label={`Anel ${anel.nome}`}>
      <header className={styles.dhead}>
        <div>
          <p className={styles.lbl}>{TIPO_LABEL[anel.tipo] ?? anel.tipo}</p>
          <h3 className={styles.h3}>{anel.nome}</h3>
        </div>
        <div className={styles.badges}>
          <Badge tone={sim ? 'brand' : 'neutral'}>{sim?.sim ? 'simulado no modelo' : 'hipótese causal qualitativa'}</Badge>
          <Badge>{anel.arestas.filter((x) => x.contestada).length} contestada(s)</Badge>
        </div>
      </header>
      {anel.descricao && <p className={styles.text}>{anel.descricao}</p>}

      <div className={styles.ringGrid}>
        <LoopRing anel={anel} selectedEdge={edge} onSelectEdge={onEdge} />
        <div className={styles.edges}>
          <p className={styles.lbl}>Arestas ({anel.arestas.length}) — toque para ver a evidência</p>
          <ul className={styles.edgeList}>
            {anel.arestas.map((a, i) => {
              const hyp = isHypothesis(a)
              return (
                <li key={i}>
                  <button type="button" className={cn(styles.edgeBtn, edge === i && styles.edgeOn)} aria-pressed={edge === i} onClick={() => onEdge(edge === i ? null : i)}>
                    <span className={cn(styles.sg, (a.sinal.includes('-') || a.sinal.includes('−')) && styles.neg)}>{a.sinal.includes('-') || a.sinal.includes('−') ? '−' : '+'}</span>
                    <span className={styles.en}>{nodeName(a.de)} → {nodeName(a.para)}</span>
                    <span className={styles.tags}>
                      <span>{forcaLabel(a.forca)}</span>
                      {a.ramal && <span>ramal</span>}
                      {a.contestada && <span className={styles.tc}>contestada</span>}
                      {hyp && <span className={styles.th}>hipótese</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {e && (
            <div className={styles.edgeDetail} aria-live="polite">
              <h4 className={styles.h4}>{nodeName(e.de)} → {nodeName(e.para)}</h4>
              {e.defasagem && <p className={styles.text}><strong>Defasagem:</strong> {e.defasagem}</p>}
              {e.nota && <p className={styles.text}>{e.nota}</p>}
              <ul className={styles.ev}>
                {(e.evidencia ?? []).map((x, k) => (
                  <li key={k}>
                    <Seal v={x.verificado} />
                    {x.url && /^https?:/.test(x.url) ? <a href={x.url} target="_blank" rel="noreferrer">{x.ref}</a> : <span>{x.ref}{x.url ? ` (${x.url})` : ''}</span>}
                  </li>
                ))}
                {(e.evidencia ?? []).length === 0 && <li><Badge tone="warn">sem evidência registrada</Badge></li>}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className={styles.cols}>
        <section className={styles.sim}>
          <p className={styles.lbl}>No modelo macro</p>
          {sim?.sim ? (
            <>
              <p className={styles.text}>{sim.onde}</p>
              {sim.equacao && <pre className={styles.eq}>{sim.equacao}</pre>}
            </>
          ) : (
            <p className={styles.text}>Este anel <strong>não é simulado</strong> por uma equação do repositório. {sim?.onde ?? 'É uma hipótese causal documentada; entra, no máximo, por alavancas externas.'}</p>
          )}
        </section>
        <section>
          <p className={styles.lbl}>Se o anel dominar</p>
          <div className={styles.dir}>
            {anel.evolucao_se_dominar?.virtuosa && <p className={cn(styles.text, styles.v)}><strong>Espiral virtuosa.</strong> {anel.evolucao_se_dominar.virtuosa}</p>}
            {anel.evolucao_se_dominar?.viciosa && <p className={cn(styles.text, styles.vi)}><strong>Espiral viciosa.</strong> {anel.evolucao_se_dominar.viciosa}</p>}
          </div>
        </section>
      </div>

      <div className={styles.cols}>
        {(anel.alavancas?.length ?? 0) > 0 && (
          <section>
            <p className={styles.lbl}>Pontos de alavanca (Meadows)</p>
            <ul className={styles.list}>{anel.alavancas?.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
        )}
        {(anel.enfraquece?.length ?? 0) > 0 && (
          <section>
            <p className={styles.lbl}>O que enfraqueceria o anel</p>
            <ul className={styles.list}>{anel.enfraquece?.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
        )}
      </div>

      <div className={styles.links}>
        <LinkChips label="Decisões do catálogo" ids={anel.decisoes} to={(id) => `/decisoes?sel=${id}`} />
        <LinkChips label="Potências" ids={anel.potencias} to={(id) => `/potenciais#${id}`} />
        <LinkChips label="Pilares" ids={anel.pilares} to={() => '/pilares'} />
        <LinkChips label="Leis e tendências" ids={[...(anel.leis ?? []), ...(anel.tendencias ?? [])]} to={() => '/futuro'} />
      </div>
      {asList(anel.notas).length > 0 && <p className={styles.small}>{asList(anel.notas).join(' ')}</p>}
    </article>
  )
}

export function AneisPanel({ data, selected, edge, onSelect, onEdge }: AneisPanelProps) {
  const [tipos, setTipos] = useState<Set<string>>(new Set())
  const [doms, setDoms] = useState<Set<string>>(new Set())
  const [sims, setSims] = useState<Set<string>>(new Set())
  const aneis = data.aneis
  const domList = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of aneis) for (const d of new Set(a.nos.map((n) => n.dominio).filter(Boolean) as string[])) m.set(d, (m.get(d) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR')).map(([key, count]) => ({ key, count }))
  }, [aneis])
  const visible = aneis.filter(
    (a) =>
      (tipos.size === 0 || tipos.has(a.tipo)) &&
      (doms.size === 0 || a.nos.some((n) => n.dominio && doms.has(n.dominio))) &&
      (sims.size === 0 || sims.has(a.simulado_no_modelo?.sim ? 'sim' : 'hip')),
  )
  const cur = aneis.find((a) => a.id === selected) ?? null
  const nodeName = (a: Anel) => (id: string) => a.nos.find((n) => n.id === id)?.rotulo ?? id
  const c = data.meta?.contagens ?? {}

  return (
    <div className={styles.stack}>
      <InlineNote id="aneis-aviso" tone="info" baseId="aneis" dismissible={false} title="Diagramas de laços causais, não previsões.">
        Cada anel é um laço fechado de arestas com sinal; produto dos sinais positivo = reforçador (R), negativo = equilibrador (B). Defasagens e forças são estimativas qualitativas; só os anéis marcados como simulados têm equação no modelo.
      </InlineNote>

      <ul className={styles.stats} aria-label="Resumo dos anéis">
        <li><strong>{c.aneis ?? aneis.length}</strong><span>anéis ({c.reforcadores ?? '—'} R · {c.equilibradores ?? '—'} B)</span></li>
        <li><strong>{c.arestas ?? '—'}</strong><span>arestas, {c.arestas_contestadas ?? '—'} contestadas</span></li>
        <li><strong>{c.citacoes_verificadas ?? '—'}/{c.citacoes_de_evidencia ?? '—'}</strong><span>citações de evidência verificadas</span></li>
        <li><strong>{c.aneis_com_simulacao_total_ou_parcial ?? '—'}</strong><span>com simulação no modelo</span></li>
      </ul>

      <div className={styles.filters}>
        <ChipGroup label="Tipo" items={[{ key: 'reforco', label: 'Reforçador (R)' }, { key: 'equilibrio', label: 'Equilibrador (B)' }]} selected={tipos} onToggle={(k) => setTipos((s) => toggle(s, k))} onClear={() => setTipos(new Set())} />
        <ChipGroup label="Domínio" items={domList} selected={doms} onToggle={(k) => setDoms((s) => toggle(s, k))} onClear={() => setDoms(new Set())} />
        <ChipGroup label="Modelo" items={[{ key: 'sim', label: 'Simulado no modelo' }, { key: 'hip', label: 'Hipótese qualitativa' }]} selected={sims} onToggle={(k) => setSims((s) => toggle(s, k))} onClear={() => setSims(new Set())} />
      </div>

      <ul className={styles.cards} aria-label="Escolha um anel">
        {visible.map((a) => {
          const i = aneis.indexOf(a)
          return (
            <li key={a.id}>
              <button type="button" className={cn(styles.card, a.id === selected && styles.cardOn)} aria-pressed={a.id === selected} onClick={() => onSelect(a.id === selected ? null : a.id)}>
                <span className={cn(styles.rb, a.tipo === 'reforco' ? styles.rr : styles.bb)}>{tipoShort(a.tipo)}</span>
                <span className={styles.cn}><b>{i + 1}.</b> {a.nome.replace(/^Anel\s*/i, '')}</span>
                <span className={styles.cm}>{a.simulado_no_modelo?.sim ? 'simulado' : 'hipótese'} · {a.arestas.length} arestas</span>
              </button>
            </li>
          )
        })}
        {visible.length === 0 && <li className={styles.empty}>Nenhum anel com esses filtros.</li>}
      </ul>

      {cur ? <Detail anel={cur} edge={edge} onEdge={onEdge} nodeName={nodeName(cur)} /> : <EmptyState icon="compass" title="Escolha um anel">Selecione um anel acima para ver o diagrama, as arestas com evidência, o que o modelo simula e o que é hipótese.</EmptyState>}

      <section aria-labelledby="an-int" className={styles.section}>
        <h3 id="an-int" className={styles.h3}>Como os anéis se alimentam</h3>
        <p className={styles.sub}>Cada seta liga um anel a outro que ele reforça, aciona, modula, amortece ou enfraquece. Selecione um anel para isolar as suas interações.</p>
        <LoopInteractions aneis={aneis} interacoes={data.interacoes ?? []} selected={selected} onSelect={(id) => onSelect(id === selected ? null : id)} />
      </section>

      {(data.aneis_ausentes?.length ?? 0) > 0 && (
        <section aria-labelledby="an-aus" className={styles.section}>
          <h3 id="an-aus" className={styles.h3}>Anéis ausentes por falta de evidência ({data.aneis_ausentes?.length})</h3>
          <p className={styles.sub}>O que sabemos que falta. Um anel ausente não é um anel inexistente: é um laço plausível que não conseguimos ancorar.</p>
          <ul className={styles.aus}>
            {data.aneis_ausentes?.map((x) => (
              <li key={x.id}><strong>{x.id}</strong>{x.descricao && <p>{x.descricao}</p>}</li>
            ))}
          </ul>
        </section>
      )}
      {data.meta?.como_ler && (
        <details className={styles.how}>
          <summary>Como ler um diagrama de laços</summary>
          <p>{data.meta.como_ler}</p>
        </details>
      )}
    </div>
  )
}

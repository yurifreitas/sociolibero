import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { EmptyState } from '@/components/molecules/EmptyState'
import { InlineNote } from '@/components/molecules/InlineNote'
import { PageGate } from '@/components/molecules/PageGate'
import { Seal } from '@/components/molecules/Seal'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { Tabs } from '@/components/molecules/Tabs'
import { ClassMatrix } from '@/components/organisms/ClassMatrix'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { norm } from '@/features/biblioteca/model'
import { useClasses } from '@/features/classes/hooks'
import type { Classe, Classes, FuturoItem, Pessima, Teoria } from '@/features/classes/schemas'
import { useDecisoes } from '@/features/data/hooks'
import { cn } from '@/lib/cn'
import { useScrollToId } from '@/lib/useScrollToId'
import { useUrlState } from '@/lib/useUrlState'
import k from './know.module.css'
import s from './ClassesPage.module.css'

type Aba = 'classes' | 'matriz' | 'teorias' | 'pessimas' | 'futuro'
const ABAS: Aba[] = ['classes', 'matriz', 'teorias', 'pessimas', 'futuro']
const URL_RE = /(https?:\/\/[^\s)]+)/

const Fonte = ({ f }: { f: string | { titulo?: string | null; url?: string | null } }) => {
  const txt = typeof f === 'string' ? f : (f.titulo ?? '')
  const url = typeof f === 'string' ? (URL_RE.exec(f)?.[1] ?? null) : (f.url ?? null)
  const label = txt.replace(URL_RE, '').replace(/\s*\[lido\]\s*/i, ' ').trim()
  const lido = typeof f === 'string' && /\[lido\]/i.test(f)
  return (
    <li>
      {lido && <Badge tone="pos">lido</Badge>}
      {url ? <a href={url} target="_blank" rel="noreferrer">{label.length > 120 ? `${label.slice(0, 120)}…` : label || url} <Icon name="external" size={11} /></a> : <span>{label}</span>}
    </li>
  )
}
const Fontes = ({ fs }: { fs?: (string | { titulo?: string | null; url?: string | null })[] | null }) =>
  (fs?.length ?? 0) > 0 ? <ul className={k.src}>{fs?.map((f, i) => <Fonte key={i} f={f} />)}</ul> : null

const Lbl = ({ children }: { children: ReactNode }) => <p className={k.lbl}>{children}</p>

function ClasseCard({ c, foco, movimentos }: { c: Classe; foco: boolean; movimentos: Set<string> }) {
  const gp = c.ganhou_perdeu ?? []
  const lidos = gp.filter((x) => x.verificado === true).length
  const it = c.interesses
  return (
    <article id={c.id} className={cn('card', k.pad, s.card, foco && s.focus)}>
      <header className={k.head}>
        <div>
          <h3 className={k.title}>{c.nome}</h3>
          <p className={k.sub}>{c.periodos?.length ?? 0} ciclos econômicos · {gp.length} regras avaliadas ({lidos} com fato lido)</p>
        </div>
        <Badge tone="warn" title="Os interesses são hipóteses de leitura apoiadas em historiografia e teoria, não medições">{c.status_interesses ?? 'hipótese'}</Badge>
      </header>
      <div><Lbl>Base material</Lbl><p className={k.text}>{c.base_material ?? '—'}</p></div>
      <dl className={s.int}>
        <dt>Voto</dt><dd>{it?.voto ?? '—'}</dd>
        <dt>Sistema</dt><dd>{it?.sistema ?? '—'}</dd>
        <dt>Financiamento</dt><dd>{it?.financiamento ?? '—'}</dd>
        <dt>Terra</dt><dd>{it?.terra ?? '—'}</dd>
        <dt>Estado</dt><dd>{it?.estado ?? '—'}</dd>
      </dl>
      {(c.aliados?.length ?? 0) > 0 && (
        <div><Lbl>Aliados</Lbl><ul className={k.chips}>{c.aliados?.map((a) => <li key={a}>{a}</li>)}</ul></div>
      )}
      {c.leitura_contraria && (
        <div className={s.contra}><Lbl>Leitura contrária</Lbl><p className={k.text}>{c.leitura_contraria}</p></div>
      )}
      {gp.length > 0 && (
        <details className={s.det}>
          <summary>Ganhou ou perdeu com cada regra ({gp.length})</summary>
          <ul className={s.gp}>
            {gp.map((x, i) => (
              <li key={`${x.regra}-${i}`}>
                <p className={s.gpHead}><strong>{x.regra}</strong> <Seal v={x.verificado} labels={{ yes: 'fato lido', no: 'não verificado' }} /></p>
                <p className={k.text}>{x.efeito}</p>
                {x.evidencia && <p className={k.muted}>{x.evidencia}</p>}
                {x.url && <a href={x.url} target="_blank" rel="noreferrer" className={s.srcLink}>{(x.fonte ?? 'fonte').slice(0, 90)} <Icon name="external" size={11} /></a>}
              </li>
            ))}
          </ul>
        </details>
      )}
      {(c.movimentos_ids?.length ?? 0) > 0 && (
        <ul className={k.links} aria-label="Movimentos ligados">
          {c.movimentos_ids?.map((m) => <li key={m}>{movimentos.has(m) ? <Link to={`/eleicoes?aba=movimentos&m=${m}`}>movimento: {m}</Link> : <span className={k.tagc}>movimento: {m}</span>}</li>)}
        </ul>
      )}
      <Fontes fs={c.fontes} />
    </article>
  )
}

function Classes_({ d, foco }: { d: Classes; foco: string | null }) {
  const { get, update } = useUrlState()
  const q = get('q') ?? ''
  const so = get('lidos') === '1'
  const nq = norm(q.trim())
  const lista = useMemo(
    () =>
      d.classes.filter(
        (c) =>
          (nq.length < 2 || norm(`${c.nome} ${c.base_material ?? ''} ${(c.aliados ?? []).join(' ')}`).includes(nq)) &&
          (!so || (c.ganhou_perdeu ?? []).some((x) => x.verificado === true)),
      ),
    [d.classes, nq, so],
  )
  const movs = useMemo(() => new Set(d.classes.flatMap((c) => c.movimentos_ids ?? [])), [d.classes])
  return (
    <div className={k.stack}>
      <div className={k.filters} role="group" aria-label="Filtros das classes">
        <label className={k.search}>Buscar classe<input type="search" value={q} onChange={(e) => update({ q: e.target.value || null })} placeholder="ex.: operariado, coronéis, mulheres…" /></label>
        <label className={s.chk}><input type="checkbox" checked={so} onChange={(e) => update({ lidos: e.target.checked ? '1' : null })} /> só com algum fato lido na fonte</label>
      </div>
      <p className={k.muted} aria-live="polite">{lista.length} de {d.classes.length} classes e grupos</p>
      {lista.length === 0 ? <EmptyState icon="search" title="Nenhuma classe com esses filtros" /> : <div className={s.cards}>{lista.map((c) => <ClasseCard key={c.id} c={c} foco={foco === c.id} movimentos={movs} />)}</div>}
    </div>
  )
}

function Teorias({ ts, foco }: { ts: Teoria[]; foco: string | null }) {
  return (
    <div className={s.cards}>
      {ts.map((t) => (
        <article key={t.id} id={t.id} className={cn('card', k.pad, s.card, foco === t.id && s.focus)}>
          <header className={k.head}>
            <div><h3 className={k.title}>{t.autor}</h3><p className={k.sub}>{t.ano ?? 'ano n/d'}</p></div>
            <Seal v={t.verificado} labels={{ yes: 'fonte lida', no: 'não lida na fonte' }} />
          </header>
          <div><Lbl>Ideia</Lbl><p className={k.text}>{t.ideia}</p></div>
          <div><Lbl>Aplicação ao Brasil (hipótese)</Lbl><p className={k.text}>{t.aplicacao_brasil}</p></div>
          {t.leitura_contraria && <div className={s.contra}><Lbl>Leitura contrária</Lbl><p className={k.text}>{t.leitura_contraria}</p></div>}
          <Fontes fs={t.fontes} />
        </article>
      ))}
    </div>
  )
}

function Pessimas({ ps, foco }: { ps: Pessima[]; foco: string | null }) {
  return (
    <div className={s.cards}>
      {ps.map((p) => {
        const c = p.custo_ou_efeito
        return (
          <article key={p.id} id={p.id} className={cn('card', k.pad, s.card, foco === p.id && s.focus)}>
            <header className={k.head}>
              <div><h3 className={k.title}>{p.titulo}</h3><p className={k.sub}>{p.ano ?? 'ano n/d'}</p></div>
              {c && <Badge tone={c.tipo === 'contagem' ? 'pos' : 'warn'} title="Contagem = número apurado; estimativa = número aproximado ou ausência de medição">{c.tipo ?? 'tipo n/d'}</Badge>}
            </header>
            <div><Lbl>Mecanismo do dano</Lbl><p className={k.text}>{p.mecanismo_do_dano}</p></div>
            {c && (
              <div className={s.cost}>
                <Lbl>Custo ou efeito documentado <Seal v={c.verificado} labels={{ yes: 'lido na fonte', no: 'não verificado' }} /></Lbl>
                <p className={s.costVal}>{c.valor ?? 'sem valor numérico'}</p>
                {c.nota && <p className={k.muted}>{c.nota}</p>}
                {c.url && <a href={c.url} target="_blank" rel="noreferrer" className={s.srcLink}>{(c.fonte ?? 'fonte').slice(0, 90)} <Icon name="external" size={11} /></a>}
              </div>
            )}
            <div className={s.versus}>
              <div><Lbl>Quem pagou</Lbl><p className={k.text}>{p.quem_pagou ?? '—'}</p></div>
              <div className={s.contra}><Lbl>Leitura contrária</Lbl><p className={k.text}>{p.leitura_contraria ?? 'não registrada'}</p></div>
            </div>
            {((p.eleicoes_ids?.length ?? 0) > 0 || (p.historia_ids?.length ?? 0) > 0) && (
              <ul className={k.links}>
                {p.eleicoes_ids?.map((id) => <li key={`e${id}`}><Link to={`/eleicoes?e=${id}`}>eleição: {id}</Link></li>)}
                {p.historia_ids?.map((id) => <li key={`h${id}`}><Link to={`/historia?sel=ev:${id}`}>história: {id}</Link></li>)}
              </ul>
            )}
            <Fontes fs={p.fontes} />
          </article>
        )
      })}
    </div>
  )
}

function Futuro({ fs, foco, decisoes }: { fs: FuturoItem[]; foco: string | null; decisoes: Set<string> }) {
  return (
    <div className={s.cards}>
      {fs.map((f) => (
        <article key={f.id} id={f.id} className={cn('card', k.pad, s.card, foco === f.id && s.focus)}>
          <header className={k.head}><h3 className={k.title}>{f.proposta}</h3></header>
          {f.status && <div><Lbl>Situação (fontes lidas até a data do arquivo)</Lbl><p className={k.text}>{f.status}</p></div>}
          <div className={s.versus}>
            <div><Lbl>Quem ganha e quem perde (hipótese)</Lbl><p className={k.text}>{f.quem_ganha_perde ?? '—'}</p></div>
            <div><Lbl>Evidência comparada</Lbl><p className={k.text}>{f.evidencia_comparada ?? 'não pesquisada'}</p></div>
          </div>
          <div><Lbl>Riscos de uma má decisão</Lbl><p className={k.text}>{f.riscos ?? '—'}</p></div>
          {(f.sinais_precoces?.length ?? 0) > 0 && <div><Lbl>Sinais precoces mensuráveis</Lbl><ul className={k.list}>{f.sinais_precoces?.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {f.mecanismo_na_cadeia && <details className={s.det}><summary>O que faria na cadeia de Markov e nos anéis (hipótese)</summary><p className={k.text}>{f.mecanismo_na_cadeia}</p>{f.nota_decisoes && <p className={k.muted}>{f.nota_decisoes}</p>}</details>}
          <ul className={k.links} aria-label="Ligações">
            {f.aneis_ids?.map((id) => <li key={`a${id}`}><Link to={`/historia?aba=aneis&an=${id}`}>anel: {id}</Link></li>)}
            {f.decisoes_ids?.map((id) => <li key={`d${id}`}>{decisoes.has(id) ? <Link to={`/decisoes?sel=${id}`}>decisão: {id}</Link> : <span className={k.tagc}>decisão: {id}</span>}</li>)}
            {f.propostas_ids?.map((id) => <li key={`p${id}`}><Link to="/propostas">proposta: {id}</Link></li>)}
          </ul>
          <Fontes fs={f.fontes} />
        </article>
      ))}
    </div>
  )
}

function Content({ d }: { d: Classes }) {
  const { get, update } = useUrlState()
  const aba: Aba = ABAS.find((a) => a === get('aba')) ?? 'classes'
  const foco = get('i') ?? get('c')
  useScrollToId(foco, aba)
  const decQ = useDecisoes('decisoes.json')
  const decisoes = useMemo(() => new Set((decQ.data?.decisoes ?? []).map((x) => x.id)), [decQ.data])
  const ngp = d.classes.reduce((n, c) => n + (c.ganhou_perdeu?.length ?? 0), 0)
  return (
    <div className={k.stack}>
      <div className={s.fixed}>
        <InlineNote id="cl-nao-prova" tone="warn" baseId="classes-interesses" dismissible={false} title="O que isto não prova.">
          Interesse é hipótese de leitura (apoiada em historiografia e teoria, com a leitura contrária ao lado), não medição de motivo. Uma regra que “favorece” uma classe não prova que foi desenhada por isso. A matriz mostra o que cada leitura sugere, não o que aconteceu por causa disso.
        </InlineNote>
        <InlineNote id="cl-pessima" tone="info" baseId="classes-interesses" dismissible={false} title="“Péssima decisão” aqui quer dizer:">
          decisão com custo ou efeito documentado e criticada, sempre com a leitura contrária ao lado. Propostas rejeitadas entram como risco, não como dano ocorrido. O mesmo método vale para esquerda, centro e direita.
        </InlineNote>
        {d.meta?.aviso && <InlineNote id="cl-aviso" tone="warn" dismissible={false} title="Fontes.">{d.meta.aviso}</InlineNote>}
      </div>
      <div className={k.stats}>
        <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Classes e grupos</p><p className={s.big}>{d.classes.length}</p><p className={k.muted}>{ngp} linhas de “ganhou ou perdeu”</p></div>
        <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Células da matriz</p><p className={s.big}>{d.matriz_regra_x_classe?.length ?? 0}</p><p className={k.muted}>regra × classe, todas hipóteses</p></div>
        <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Teorias</p><p className={s.big}>{d.teorias?.length ?? 0}</p><p className={k.muted}>{(d.teorias ?? []).filter((t) => t.verificado === true).length} com fonte lida</p></div>
        <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Decisões criticadas</p><p className={s.big}>{d.pessimas_decisoes?.length ?? 0}</p><p className={k.muted}>com custo documentado</p></div>
      </div>
      <Tabs<Aba>
        label="Seções de classes e interesses"
        value={aba}
        onChange={(a) => update({ aba: a === 'classes' ? null : a, i: null, c: null })}
        tabs={[
          { key: 'classes', label: 'Classes', count: d.classes.length },
          { key: 'matriz', label: 'Matriz regra × classe', count: d.matriz_regra_x_classe?.length ?? 0 },
          { key: 'teorias', label: 'Teorias', count: d.teorias?.length ?? 0 },
          { key: 'pessimas', label: 'Péssimas decisões', count: d.pessimas_decisoes?.length ?? 0 },
          { key: 'futuro', label: 'Futuro das regras', count: d.futuro?.length ?? 0 },
        ]}
      >
        {aba === 'classes' && <Classes_ d={d} foco={foco} />}
        {aba === 'matriz' && <ClassMatrix celulas={d.matriz_regra_x_classe ?? []} classes={d.classes} onClasse={(id) => update({ aba: null, c: id })} />}
        {aba === 'teorias' && <Teorias ts={d.teorias ?? []} foco={foco} />}
        {aba === 'pessimas' && <Pessimas ps={d.pessimas_decisoes ?? []} foco={foco} />}
        {aba === 'futuro' && <Futuro fs={d.futuro ?? []} foco={foco} decisoes={decisoes} />}
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

export default function ClassesPage() {
  const q = useClasses()
  return (
    <PageTemplate>
      <SectionHeader level={1} title="Classes e interesses" description="Quem ganhou e quem perdeu com cada regra do voto e do sistema eleitoral, segundo a historiografia e a teoria; as decisões criticadas, com custo e leitura contrária; e o que está em debate para o futuro. Tudo como hipótese de leitura, com selo de verificação e sem nomear pessoas." />
      <PageGate query={q} file="classes_interesses.json">{(d) => <Content d={d} />}</PageGate>
    </PageTemplate>
  )
}

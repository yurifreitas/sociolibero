import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { Select } from '@/components/atoms/Select'
import { InlineNote } from '@/components/molecules/InlineNote'
import { OriginalQuote } from '@/components/molecules/OriginalQuote'
import { PageGate } from '@/components/molecules/PageGate'
import { Seal } from '@/components/molecules/Seal'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { Tabs } from '@/components/molecules/Tabs'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useDecisoes } from '@/features/data/hooks'
import { useMarx } from '@/features/marx/hooks'
import { hostOf, indiceDeUso, isEspelho, LANG_NOME, langOf, naoConferida, norm, slug, USO_ABA, type Uso } from '@/features/marx/model'
import type { Marx, MarxTexto } from '@/features/marx/schemas'
import { useViolencia } from '@/features/violencia/hooks'
import { cn } from '@/lib/cn'
import { useScrollToId } from '@/lib/useScrollToId'
import { useUrlState } from '@/lib/useUrlState'
import k from './know.module.css'
import s from './MarxPage.module.css'

type Aba = 'textos' | 'teses' | 'contra' | 'mal' | 'defs' | 'pensadores' | 'muda'
const ABAS: Aba[] = ['textos', 'teses', 'contra', 'mal', 'defs', 'pensadores', 'muda']
const PAGE = 12
const ABA_DO_USO: Record<Uso['tipo'], Aba> = { teses: 'teses', contra: 'contra', mal: 'mal', defs: 'defs' }

const curto = (t: MarxTexto) => `${t.obra.replace(/\s*\(.*$/, '')}${t.ano ? ` (${t.ano})` : ''}`

function TextoRef({ id, textos }: { id: string; textos: Map<string, MarxTexto> }) {
  const t = textos.get(id)
  return (
    <Link className={s.ref} to={`/marx?aba=textos&t=${id}`} title={t ? `${t.obra} — ${t.secao ?? ''}` : id}>
      {t ? `${curto(t)} · ${t.tema ?? ''}` : id}
    </Link>
  )
}

function Lista({ itens }: { itens?: string[] | null }) {
  if (!itens || itens.length === 0) return <p className={k.muted}>—</p>
  return <ul className={k.list}>{itens.map((x) => <li key={x}>{x}</li>)}</ul>
}

function LigacoesLinks({ lig, decisoesOk }: { lig?: { decisoes?: string[] | null; pilares?: string[] | null; aneis?: string[] | null } | null; decisoesOk: Set<string> }) {
  const d = lig?.decisoes ?? []
  const p = lig?.pilares ?? []
  const a = lig?.aneis ?? []
  if (d.length + p.length + a.length === 0) return null
  return (
    <ul className={k.links} aria-label="Ligações com o resto do projeto">
      {d.map((id) => <li key={`d${id}`}>{decisoesOk.has(id) ? <Link to={`/decisoes?sel=${id}`}>decisão: {id}</Link> : <span className={k.tagc}>decisão: {id}</span>}</li>)}
      {p.map((id) => <li key={`p${id}`}><Link to="/pilares?aba=pilares">pilar: {id}</Link></li>)}
      {a.map((id) => <li key={`a${id}`}><Link to="/historia?aba=aneis">anel: {id}</Link></li>)}
    </ul>
  )
}

function TextoCard({ t, usos, focus }: { t: MarxTexto; usos: Uso[]; focus: boolean }) {
  const lang = langOf(t)
  const espelho = isEspelho(t.url)
  const nota = t.nota_de_fonte
  return (
    <article id={t.id} className={cn('card', k.pad, s.card, focus && s.focus)}>
      <header className={s.meta}>
        <Badge tone="brand">{LANG_NOME[lang]}</Badge>
        <Seal v={t.verificado_literal} labels={{ yes: 'conferido literalmente na URL', no: 'não conferido na URL' }} />
        {naoConferida(nota) && <Badge tone="warn">página MEW não conferida</Badge>}
        {t.tema && <span className={k.tagc}>{t.tema}</span>}
      </header>
      <p className={s.obra}>
        <strong>{t.obra}</strong>
        {t.ano ? ` · ${t.ano}` : ''}
        {t.secao ? ` · ${t.secao}` : ''}
      </p>
      <div className={s.pair}>
        <OriginalQuote text={t.trecho_original} lang={lang} label={`Original · ${LANG_NOME[lang]}`} />
        <div className={s.tr}>
          <p className={k.lbl}>Tradução do agente (não revisada)</p>
          <p className={s.trText}>{t.traducao_pt ?? 'sem tradução'}</p>
          {t.leitura_curta && <p className={s.reading}><b>Leitura.</b> {t.leitura_curta}</p>}
        </div>
      </div>
      {espelho && (
        <p className={s.warnLine} role="note">
          <Icon name="alert" size={14} />
          <span>Espelho de terceiros ({hostOf(t.url)}) — conferir com a edição impressa (MEW/MEGA) antes de citar formalmente.</span>
        </p>
      )}
      {nota && <p className={s.notaFonte}>Nota de fonte: {nota}</p>}
      <div className={s.meta}>
        {t.url && (
          <a href={t.url} target="_blank" rel="noreferrer" className={k.tagc}>
            fonte: {hostOf(t.url)} <Icon name="external" size={11} />
          </a>
        )}
      </div>
      {usos.length > 0 && (
        <>
          <p className={k.lbl}>Citado em</p>
          <ul className={s.usos}>
            {usos.map((u) => (
              <li key={`${u.tipo}${u.id}`}>
                <Link to={`/marx?aba=${ABA_DO_USO[u.tipo]}&i=${u.tipo === 'defs' ? slug(u.id) : u.id}`}>
                  {USO_ABA[u.tipo]}: {u.rotulo.length > 70 ? `${u.rotulo.slice(0, 68)}…` : u.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  )
}

function Textos({ d, usos, foco }: { d: Marx; usos: Map<string, Uso[]>; foco: string | null }) {
  const { get, update } = useUrlState()
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const obra = get('obra') ?? ''
  const tema = get('tema') ?? ''
  const idioma = get('idioma') ?? ''
  const so = get('t')
  const hay = useMemo(() => d.textos.map((t) => ({ t, h: norm(`${t.trecho_original} ${t.traducao_pt ?? ''} ${t.tema ?? ''} ${t.obra} ${t.leitura_curta ?? ''}`) })), [d.textos])
  const obras = useMemo(() => [...new Set(d.textos.map((t) => t.obra))].sort(), [d.textos])
  const temas = useMemo(() => [...new Set(d.textos.map((t) => t.tema ?? '').filter(Boolean))].sort(), [d.textos])
  const nq = norm(q.trim())
  const lista = useMemo(
    () => (so ? d.textos.filter((t) => t.id === so) : hay.filter(({ t, h }) => (!obra || t.obra === obra) && (!tema || t.tema === tema) && (!idioma || langOf(t) === idioma) && (!nq || h.includes(nq))).map(({ t }) => t)),
    [d.textos, hay, so, obra, tema, idioma, nq],
  )
  useEffect(() => setLimit(PAGE), [nq, obra, tema, idioma, so])
  const mostrados = lista.slice(0, limit)
  const confer = d.textos.filter((t) => t.verificado_literal === true).length
  return (
    <div className={k.stack}>
      <div className={s.selects}>
        <label className={k.search}>
          Buscar no original, na tradução ou no tema
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex.: Warenfetisch, acumulação, Zasulich" />
        </label>
        <label>
          Obra
          <Select value={obra} onChange={(e) => update({ obra: e.target.value || null, t: null })}>
            <option value="">Todas ({obras.length})</option>
            {obras.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </label>
        <label>
          Tema
          <Select value={tema} onChange={(e) => update({ tema: e.target.value || null, t: null })}>
            <option value="">Todos ({temas.length})</option>
            {temas.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </label>
        <label>
          Idioma
          <Select value={idioma} onChange={(e) => update({ idioma: e.target.value || null, t: null })}>
            <option value="">Todos</option>
            <option value="de">Alemão</option>
            <option value="fr">Francês</option>
            <option value="en">Inglês</option>
          </Select>
        </label>
      </div>
      <p className={k.muted} aria-live="polite">
        {so ? 'Mostrando um trecho. ' : `${lista.length} de ${d.textos.length} trechos. `}
        {confer} de {d.textos.length} conferidos palavra por palavra na URL citada (isso atesta o trecho, não a edição). Textos curtos, em domínio público.
        {so && (
          <>
            {' '}
            <button type="button" className={s.ref} onClick={() => update({ t: null })} style={{ border: 0, cursor: 'pointer' }}>
              Mostrar todos os trechos
            </button>
          </>
        )}
      </p>
      {mostrados.length === 0 ? (
        <p className={k.none}>Nenhum trecho corresponde aos filtros.</p>
      ) : (
        <div className={s.cards}>{mostrados.map((t) => <TextoCard key={t.id} t={t} usos={usos.get(t.id) ?? []} focus={foco === t.id} />)}</div>
      )}
      {lista.length > limit && (
        <div className={s.more}>
          <button type="button" className={s.btn} onClick={() => setLimit((n) => n + PAGE)}>
            Mostrar mais ({lista.length - limit} restantes)
          </button>
        </div>
      )}
    </div>
  )
}

function Teses({ d, textos, decisoesOk, foco }: { d: Marx; textos: Map<string, MarxTexto>; decisoesOk: Set<string>; foco: string | null }) {
  const m01 = (d.mal_entendidos ?? []).find((x) => x.id.startsWith('m01'))
  return (
    <div className={k.stack}>
      <InlineNote id="marx-tese-nao-esta" tone="warn" dismissible={false} title="A tese de que o capitalismo não é implementável NÃO está em Marx nos trechos conferidos.">
        É inferência de Polanyi e outros; Marx fala em modo de produção e relação de capital.
        {m01?.o_que_o_texto_diz ? ` ${m01.o_que_o_texto_diz}` : ''}
        {m01 && (
          <>
            {' '}
            <Link to={`/marx?aba=mal&i=${m01.id}`}>Ver o mal-entendido completo</Link>.
          </>
        )}
      </InlineNote>
      <div className={s.cardsWide}>
      {(d.teses ?? []).map((t) => (
        <article key={t.id} id={t.id} className={cn('card', k.pad, s.card, s.tese, foco === t.id && s.focus)}>
          <header>
            <p className={k.lbl}>Tese · evidência {t.evidencia ?? 'não classificada'}</p>
            <h3 className={k.title}>{t.titulo}</h3>
          </header>
          {t.enunciado && <p className={k.text}>{t.enunciado}</p>}
          <div className={s.versus}>
            <div className={s.col}><p className={k.lbl}>Premissas</p><Lista itens={t.premissas} /></div>
            <div className={s.col}><p className={k.lbl}>Leituras rivais</p><Lista itens={t.leituras_rivais} /></div>
            <div className={s.col}><p className={k.lbl}>Objeções</p><Lista itens={t.objecoes} /></div>
            <div className={s.col}><p className={k.lbl}>Respostas</p><Lista itens={t.respostas} /></div>
          </div>
          {t.qualidade_da_evidencia && <p className={k.text}><b>Qualidade da evidência.</b> {t.qualidade_da_evidencia}</p>}
          {t.como_seria_refutada && (
            <div className={s.refute}>
              <p className={k.lbl}>Como seria refutada</p>
              <p className={k.text}>{t.como_seria_refutada}</p>
            </div>
          )}
          {(t.autores?.length ?? 0) > 0 && <ul className={k.chips} aria-label="Autores">{t.autores?.map((a) => <li key={a}>{a}</li>)}</ul>}
          {(t.textos_de_apoio?.length ?? 0) > 0 && (
            <>
              <p className={k.lbl}>Textos de apoio ({t.textos_de_apoio?.length})</p>
              <ul className={s.usos}>{t.textos_de_apoio?.map((id) => <li key={id}><TextoRef id={id} textos={textos} /></li>)}</ul>
            </>
          )}
          <LigacoesLinks lig={t.ligacoes} decisoesOk={decisoesOk} />
        </article>
      ))}
      </div>
    </div>
  )
}

function Contra({ d, textos, foco }: { d: Marx; textos: Map<string, MarxTexto>; foco: string | null }) {
  return (
    <div className={k.stack}>
      <p className={k.muted}>Mesmo peso visual das teses: cada contra-argumento aparece em sua melhor versão, com os limites que o próprio argumento reconhece.</p>
      <div className={s.cardsWide}>
      {(d.contra_argumentos ?? []).map((c) => (
        <article key={c.id} id={c.id} className={cn('card', k.pad, s.card, s.contra, foco === c.id && s.focus)}>
          <header>
            <p className={k.lbl}>Contra-argumento</p>
            <h3 className={k.title}>{c.contra_tese}</h3>
          </header>
          {(c.autores?.length ?? 0) > 0 && <ul className={k.chips} aria-label="Autores">{c.autores?.map((a) => <li key={a}>{a}</li>)}</ul>}
          {c.argumento && <p className={k.text}><b>Argumento.</b> {c.argumento}</p>}
          {c.limites && <p className={k.text}><b>Limites.</b> {c.limites}</p>}
          {(c.textos?.length ?? 0) > 0 && <ul className={s.usos}>{c.textos?.map((id) => <li key={id}><TextoRef id={id} textos={textos} /></li>)}</ul>}
        </article>
      ))}
      </div>
    </div>
  )
}

function Mal({ d, textos, foco }: { d: Marx; textos: Map<string, MarxTexto>; foco: string | null }) {
  return (
    <div className={k.stack}>
      <div className={s.cardsWide}>
      {(d.mal_entendidos ?? []).map((m) => (
        <article key={m.id} id={m.id} className={cn('card', k.pad, s.card, foco === m.id && s.focus)}>
          <div className={s.versus}>
            <div className={cn(s.col, s.equivoco)}>
              <p className={k.lbl}>O equívoco</p>
              <p className={cn(k.text, s.quote)}>{m.equivoco}</p>
            </div>
            <div className={cn(s.col, s.diz)}>
              <p className={k.lbl}>O que o texto diz</p>
              <p className={k.text}>{m.o_que_o_texto_diz}</p>
            </div>
          </div>
          {m.origem_da_confusao && <p className={k.text}><b>Origem da confusão.</b> {m.origem_da_confusao}</p>}
          {(m.textos?.length ?? 0) > 0 && <ul className={s.usos}>{m.textos?.map((id) => <li key={id}><TextoRef id={id} textos={textos} /></li>)}</ul>}
        </article>
      ))}
      </div>
    </div>
  )
}

function Defs({ d, textos, foco }: { d: Marx; textos: Map<string, MarxTexto>; foco: string | null }) {
  return (
    <div className={k.stack}>
      <div className={s.cardsWide}>
      {(d.definicoes ?? []).map((x) => (
        <article key={x.termo} id={slug(x.termo)} className={cn('card', k.pad, s.card, foco === slug(x.termo) && s.focus)}>
          <h3 className={k.title}>{x.termo}</h3>
          <div className={s.three}>
            <div className={s.col}><p className={k.lbl}>Definição marxiana</p><p className={k.text}>{x.definicao_marxiana}</p></div>
            <div className={s.col}><p className={k.lbl}>Uso corrente</p><p className={k.text}>{x.uso_corrente}</p></div>
            <div className={s.col}><p className={k.lbl}>Confusões</p><p className={k.text}>{x.confusoes}</p></div>
          </div>
          {(x.textos?.length ?? 0) > 0 && <ul className={s.usos}>{x.textos?.map((id) => <li key={id}><TextoRef id={id} textos={textos} /></li>)}</ul>}
        </article>
      ))}
      </div>
    </div>
  )
}

function Pensadores({ d, foco }: { d: Marx; foco: string | null }) {
  const [q, setQ] = useState('')
  const vQ = useViolencia(true)
  const violIds = useMemo(() => new Set((vQ.data?.pensadores ?? []).map((p) => p.id)), [vQ.data])
  const lista = (d.pensadores ?? []).filter((p) => !q || norm(`${p.nome} ${p.posicao ?? ''} ${p.relacao_com_marx ?? ''}`).includes(norm(q)))
  return (
    <div className={k.stack}>
      <InlineNote id="marx-pens-memoria" tone="warn" dismissible={false} title="Resumidos de memória.">
        Das posições destes autores só foi conferido que a obra existe e cita o título e o ano numa página aberta (em geral secundária). Não há citação literal: leia os textos antes de atribuir qualquer afirmação.
      </InlineNote>
      <label className={k.search}>
        Buscar por autor, posição ou relação com Marx
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex.: Polanyi, Hayek, dependência" />
      </label>
      <p className={k.muted}>{lista.length} de {d.pensadores?.length ?? 0} autores.</p>
      <div className={k.grid}>
        {lista.map((p) => {
          const viol = violIds.has(p.id)
          return (
            <article key={p.id} id={p.id} className={cn('card', k.pad, s.card, foco === p.id && s.focus)}>
              <h3 className={k.title}>{p.nome}</h3>
              {p.posicao && (
                <p className={k.text}>
                  <b>Posição.</b> {p.posicao}
                  {naoConferida(p.posicao) && <> <Badge tone="warn">não conferido</Badge></>}
                </p>
              )}
              {p.relacao_com_marx && <p className={k.text}><b>Relação com Marx.</b> {p.relacao_com_marx}</p>}
              {(p.obra_chave?.length ?? 0) > 0 && (
                <ul className={k.src} aria-label="Obras-chave">
                  {p.obra_chave?.map((o) => (
                    <li key={o.titulo}>
                      <Seal v={o.verificado} labels={{ yes: 'obra existe', no: 'não verificado' }} />
                      {o.url ? <a href={o.url} target="_blank" rel="noreferrer">{o.titulo}</a> : <span>{o.titulo}</span>}
                      {o.ano ? <span>({o.ano})</span> : null}
                    </li>
                  ))}
                </ul>
              )}
              <ul className={k.links}>
                {p.id_no_projeto_pilares_pensamento && <li><Link to="/pilares">em Pilares de pensamento ({p.id_no_projeto_pilares_pensamento})</Link></li>}
                {viol && <li><Link to={`/violencia?p=${p.id}`}>em Pensadores da violência</Link></li>}
              </ul>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function Muda({ d, decisoesOk }: { d: Marx; decisoesOk: Set<string> }) {
  return (
    <div className={k.stack}>
      <p className={k.muted}>Tradução da leitura em desenho institucional: a pergunta deixa de ser “capitalismo ou socialismo” e passa a ser quais instituições compõem cada economia real. Hipóteses de trabalho, não conclusões.</p>
      <div className={k.grid2}>
        {(d.o_que_muda_no_projeto ?? []).map((m) => (
          <article key={m.principio} className={cn('card', k.pad)}>
            <h3 className={k.title}>{m.principio}</h3>
            {m.traducao_institucional && <p className={k.text}>{m.traducao_institucional}</p>}
            <LigacoesLinks lig={m.ligacoes} decisoesOk={decisoesOk} />
          </article>
        ))}
      </div>
    </div>
  )
}

function NaoConferido({ d }: { d: Marx }) {
  const mew = d.textos.filter((t) => naoConferida(t.nota_de_fonte)).length
  const polanyi = (d.pensadores ?? []).find((p) => p.id === 'polanyi' && naoConferida(p.posicao))
  const engels = d.textos.find((t) => /Engels a Conrad Schmidt/i.test(t.obra))
  const solido = d.textos.find((t) => /Manifest der Kommunistischen Partei/i.test(t.obra) && /verdampf/i.test(`${t.trecho_original} ${t.leitura_curta ?? ''}`))
  const memoria = d.pensadores?.length ?? 0
  return (
    <details className={s.det} open>
      <summary>O que NÃO foi conferido (5 itens)</summary>
      <ul className={s.naoConf}>
        <li>
          <Badge tone="warn">não conferido</Badge>
          <span><b>Frase de Polanyi</b> (“o laissez-faire foi planejado; o planejamento não”): premissa central da tese 3, não lida na fonte. {polanyi ? 'Ver a nota na aba Pensadores.' : ''}</span>
        </li>
        <li>
          <Badge tone="warn">não conferido</Badge>
          <span><b>“Eu não sou marxista”</b> é relato de Engels (carta a Conrad Schmidt, 1890), lido só em inglês; o alemão e a frase original de Marx, em francês, não foram conferidos.{engels?.nota_de_fonte ? ` ${engels.nota_de_fonte}` : ''}</span>
        </li>
        <li>
          <Badge tone="warn">não literal</Badge>
          <span><b>“Tudo que é sólido desmancha no ar”</b> não é literal em alemão: o texto diz “verdampft”; a frase vem da tradução inglesa, que não foi aberta.{solido ? ' (Ver o trecho no Manifesto, aba Textos.)' : ''}</span>
        </li>
        <li>
          <Badge tone="warn">não conferido</Badge>
          <span><b>Páginas do MEW</b>: {mew} trecho{mew === 1 ? '' : 's'} trazem página de memória ou de literatura. Só o trecho na URL foi conferido palavra por palavra.</span>
        </li>
        <li>
          <Badge tone="warn">de memória</Badge>
          <span><b>{memoria} autores</b> (Polanyi, Hayek, Keynes, Piketty, brasileiros…) resumidos de memória; só a existência da obra foi conferida. Fatos empíricos dos contra-argumentos (Hong Kong, Chile, Leste Europeu) também não foram verificados.</span>
        </li>
      </ul>
      {(d.limites?.length ?? 0) > 0 && (
        <details className={s.det}>
          <summary>Limites declarados no arquivo ({d.limites?.length})</summary>
          <ul className={k.list}>{d.limites?.map((x) => <li key={x}>{x}</li>)}</ul>
        </details>
      )}
    </details>
  )
}

function Content({ d }: { d: Marx }) {
  const { get, update } = useUrlState()
  const aba: Aba = ABAS.find((a) => a === get('aba')) ?? 'textos'
  const foco = get('i')
  useScrollToId(foco, aba)
  const textos = useMemo(() => new Map(d.textos.map((t) => [t.id, t])), [d.textos])
  const usos = useMemo(() => indiceDeUso(d), [d])
  const decQ = useDecisoes('decisoes.json')
  const decisoesOk = useMemo(() => new Set((decQ.data?.decisoes ?? []).map((x) => x.id)), [decQ.data])
  return (
    <div className={k.stack}>
      <div className={s.fixed}>
        <InlineNote id="marx-neutro" tone="info" dismissible={false} baseId="marx-capitalismo" title="Sem declarar vencedor.">
          Cada tese traz leituras rivais, objeções e respostas; os contra-argumentos têm o mesmo peso. O arquivo separa texto, interpretação e juízo. Os trechos de Marx e Engels estão em domínio público; as traduções são do agente e não foram revisadas.
        </InlineNote>
        <InlineNote id="marx-nao-prova" tone="warn" dismissible={false} title="O que isto não prova.">
          Conferir o que Marx escreveu não prova que ele tenha razão, nem que as teses derivadas dele sejam dele. “Link” e “conferido literalmente” atestam o trecho na página citada, não a edição crítica.
        </InlineNote>
      </div>
      {d.sintese && (
        <details className={s.det}>
          <summary>Síntese</summary>
          <p className={k.text}>{d.sintese}</p>
        </details>
      )}
      <NaoConferido d={d} />
      <Tabs<Aba>
        label="Seções de Marx e o capitalismo"
        value={aba}
        onChange={(a) => update({ aba: a === 'textos' ? null : a, i: null, t: null })}
        tabs={[
          { key: 'textos', label: 'Textos', count: d.textos.length },
          { key: 'teses', label: 'Teses', count: d.teses?.length ?? 0 },
          { key: 'contra', label: 'Contra-argumentos', count: d.contra_argumentos?.length ?? 0 },
          { key: 'mal', label: 'Mal-entendidos', count: d.mal_entendidos?.length ?? 0 },
          { key: 'defs', label: 'Definições', count: d.definicoes?.length ?? 0 },
          { key: 'pensadores', label: 'Pensadores', count: d.pensadores?.length ?? 0 },
          { key: 'muda', label: 'O que muda no projeto', count: d.o_que_muda_no_projeto?.length ?? 0 },
        ]}
      >
        {aba === 'textos' && <Textos d={d} usos={usos} foco={foco} />}
        {aba === 'teses' && <Teses d={d} textos={textos} decisoesOk={decisoesOk} foco={foco} />}
        {aba === 'contra' && <Contra d={d} textos={textos} foco={foco} />}
        {aba === 'mal' && <Mal d={d} textos={textos} foco={foco} />}
        {aba === 'defs' && <Defs d={d} textos={textos} foco={foco} />}
        {aba === 'pensadores' && <Pensadores d={d} foco={foco} />}
        {aba === 'muda' && <Muda d={d} decisoesOk={decisoesOk} />}
      </Tabs>
    </div>
  )
}

export default function MarxPage() {
  const q = useMarx()
  return (
    <PageTemplate>
      <SectionHeader level={1} title="Marx e o capitalismo" description="O que Marx escreveu, no original, e a tese de que o capitalismo não é um sistema que se implementa: os argumentos a favor e contra, o que é inferência de outros autores e os mal-entendidos mais comuns." />
      <PageGate query={q} file="marx_capitalismo.json">{(d) => <Content d={d} />}</PageGate>
    </PageTemplate>
  )
}

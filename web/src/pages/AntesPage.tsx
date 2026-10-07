import { useMemo } from 'react'
import { Badge } from '@/components/atoms/Badge'
import { InlineNote } from '@/components/molecules/InlineNote'
import { PageGate } from '@/components/molecules/PageGate'
import { Seal } from '@/components/molecules/Seal'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { Tabs } from '@/components/molecules/Tabs'
import { DeepTimeline, type Sel } from '@/components/organisms/DeepTimeline'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useAntes } from '@/features/conhecimento/hooks'
import { parseAP } from '@/features/conhecimento/model'
import type { Antes, FonteT } from '@/features/conhecimento/schemas'
import { useUrlState } from '@/lib/useUrlState'
import k from './know.module.css'
import styles from './AntesPage.module.css'

type Aba = 'periodos' | 'eventos' | 'clima' | 'povos' | 'diversidade' | 'perguntas'
const ap = (n: number) => `${n.toLocaleString('pt-BR')} AP`
const str = (v: unknown): string => (v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v))
const num = (v: unknown) => (typeof v === 'number' ? v.toLocaleString('pt-BR') : str(v))
type Any = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function Fontes({ f }: { f?: FonteT[] | null }) {
  if (!f || f.length === 0) return null
  return (
    <ul className={k.src} aria-label="Fontes">
      {f.map((s) => (
        <li key={s.titulo}>
          <Seal v={s.verificado} />
          {s.url ? (
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.titulo}
            </a>
          ) : (
            <span>{s.titulo}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

function Detail({ d, sel, onClose }: { d: Antes; sel: NonNullable<Sel>; onClose: () => void }) {
  const e = sel.kind === 'e' ? d.eventos.find((x) => x.id === sel.id) : undefined
  const c = sel.kind === 'c' ? d.clima_eventos?.find((x) => x.id === sel.id) : undefined
  const it = e ?? c
  if (!it) return null
  const range = e ? parseAP(e.data_ap) : c ? { from: c.inicio_ap, to: c.fim_ap } : null
  return (
    <article className={`card ${k.pad}`} aria-label={it.titulo}>
      <header className={k.head}>
        <div>
          <p className={k.lbl}>{c ? 'Evento climático' : 'Evento humano'}</p>
          <h3 className={k.title}>{it.titulo}</h3>
          <p className={k.sub}>
            {range ? (range.from === range.to ? ap(range.from) : `${ap(range.from)} → ${ap(range.to)}`) : str(e?.data_ap)}
            {e?.data_calendario ? ` · ${e.data_calendario}` : ''}
            {c?.regiao ? ` · ${c.regiao}` : ''}
          </p>
        </div>
        <button type="button" onClick={onClose} className={styles.close} aria-label="Fechar detalhe">
          Fechar
        </button>
      </header>
      {(e?.resumo ?? c?.descricao) && <p className={k.text}>{e?.resumo ?? c?.descricao}</p>}
      <dl className={k.kv}>
        {it.evidencia && (
          <>
            <dt>Evidência</dt>
            <dd>{it.evidencia}</dd>
          </>
        )}
        {it.incerteza && (
          <>
            <dt>Incerteza</dt>
            <dd>{it.incerteza}</dd>
          </>
        )}
      </dl>
      <Fontes f={it.fontes} />
    </article>
  )
}

function Diversidade({ d }: { d: Antes }) {
  const div = (d.diversidade_hoje ?? {}) as Any
  const cats = Object.entries((div.composicao_cor_raca_2022?.categorias ?? {}) as Record<string, { pessoas: number; percentual: number }>)
  const ind: Any = div.povos_indigenas ?? {}
  const ling: Any = div.linguas ?? {}
  const palette = ['var(--brand)', 'var(--accent)', 'var(--pos)', 'var(--warn)', 'var(--neg)']
  return (
    <div className={k.stack}>
      <InlineNote id="antes-305-391" tone="warn" dismissible={false} title="305 etnias (2010) e 391 (2022) não são a mesma medida.">
        O Censo 2022 perguntou povo/etnia e língua pela primeira vez com outro desenho. Comparar os dois números mistura crescimento real com mudança de metodologia. Os valores de etnias e línguas
        vêm de resumo de imprensa e estão marcados como não verificados.
      </InlineNote>
      <section className={`card ${k.pad}`}>
        <div className={k.head}>
          <h3 className={k.title}>Composição por cor ou raça, Censo 2022</h3>
          <Seal v={div.composicao_cor_raca_2022?.verificado} />
        </div>
        <div className={styles.stack} role="img" aria-label={cats.map(([n, v]) => `${n} ${v.percentual}%`).join(', ')}>
          {cats.map(([n, v], i) => (
            <span key={n} style={{ width: `${Math.max(v.percentual, 0.8)}%`, background: palette[i % palette.length] }} title={`${n}: ${num(v.pessoas)} (${v.percentual}%)`} />
          ))}
        </div>
        <ul className={styles.legend}>
          {cats.map(([n, v], i) => (
            <li key={n}>
              <i style={{ background: palette[i % palette.length] }} /> <b>{n}</b>{' '}
              <span className="num">
                {num(v.pessoas)} · {String(v.percentual).replace('.', ',')}%
              </span>
            </li>
          ))}
        </ul>
        <p className={k.muted}>
          {str(div.composicao_cor_raca_2022?.nota)} · Fonte: {str(div.composicao_cor_raca_2022?.fonte_direta)}.
        </p>
      </section>
      <div className={k.grid2}>
        <section className={`card ${k.pad}`}>
          <div className={k.head}>
            <h3 className={k.title}>Povos indígenas: 2010 e 2022</h3>
          </div>
          <div className={k.two}>
            <div>
              <p className={k.lbl}>Censo 2010</p>
              <dl className={k.kv}>
                <dt>População</dt>
                <dd>{str(ind.censo_2010?.populacao)}</dd>
                <dt>Etnias</dt>
                <dd>{num(ind.censo_2010?.etnias)}</dd>
                <dt>Línguas</dt>
                <dd>{num(ind.censo_2010?.linguas)}</dd>
              </dl>
              <Seal v={ind.censo_2010?.verificado} />
            </div>
            <div>
              <p className={k.lbl}>Censo 2022</p>
              <dl className={k.kv}>
                <dt>Critério ampliado</dt>
                <dd>
                  {num(ind.censo_2022?.populacao_total_criterio_ampliado)} ({str(ind.censo_2022?.percentual)})
                </dd>
                <dt>Por cor/raça</dt>
                <dd>{num(ind.censo_2022?.populacao_autodeclarada_indigena_por_cor_raca)}</dd>
                <dt>Etnias</dt>
                <dd>{str(ind.censo_2022?.etnias)}</dd>
                <dt>Línguas</dt>
                <dd>{str(ind.censo_2022?.linguas)}</dd>
              </dl>
              <Seal v={ind.censo_2022?.verificado} />
            </div>
          </div>
          <p className={k.muted}>{str(ind.censo_2022?.nota)}</p>
        </section>
        <section className={`card ${k.pad}`}>
          <div className={k.head}>
            <h3 className={k.title}>Línguas</h3>
            <Seal v={ling.verificado} />
          </div>
          <p className={k.text}>{str(ling.hoje)}</p>
          {Array.isArray(ling.troncos_e_familias) && (
            <ul className={k.chips} aria-label="Troncos e famílias">
              {(ling.troncos_e_familias as string[]).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          <p className={k.muted}>{str(ling.ameacadas)}</p>
        </section>
      </div>
    </div>
  )
}

function Content({ d }: { d: Antes }) {
  const { get, update } = useUrlState()
  const selRaw = get('e')
  const sel: Sel = selRaw && /^[ec]:/.test(selRaw) ? { kind: selRaw[0] as 'e' | 'c', id: selRaw.slice(2) } : null
  const aba: Aba = (['periodos', 'eventos', 'clima', 'povos', 'diversidade', 'perguntas'] as const).find((a) => a === get('aba')) ?? 'periodos'
  const periodoNome = useMemo(() => new Map(d.periodos.map((p) => [p.id, p.rotulo])), [d.periodos])
  const povos = d.povos_e_origens ?? []
  const clima = d.clima_eventos ?? []
  const perg = d.perguntas_abertas ?? []
  const nver = povos.flatMap((p) => p.fontes ?? []).filter((f) => f.verificado).length

  return (
    <div className={k.stack}>
      <DeepTimeline data={d} selected={sel} onSelect={(s) => update({ e: s ? `${s.kind}:${s.id}` : null })} />
      {sel && <Detail d={d} sel={sel} onClose={() => update({ e: null })} />}
      <Tabs<Aba>
        label="Seções"
        value={aba}
        onChange={(a) => update({ aba: a === 'periodos' ? null : a })}
        tabs={[
          { key: 'periodos', label: 'Períodos', count: d.periodos.length },
          { key: 'eventos', label: 'Eventos', count: d.eventos.length },
          { key: 'clima', label: 'Clima', count: clima.length },
          { key: 'povos', label: 'Povos e origens', count: povos.length },
          { key: 'diversidade', label: 'Diversidade hoje' },
          { key: 'perguntas', label: 'Perguntas abertas', count: perg.length },
        ]}
      >
        {aba === 'periodos' && (
          <div className={k.grid2}>
            {d.periodos.map((p) => (
              <article key={p.id} className={`card ${k.pad}`}>
                <header>
                  <p className={k.lbl}>
                    {ap(p.inicio_ap)} → {ap(p.fim_ap)}
                  </p>
                  <h3 className={k.title}>{p.rotulo}</h3>
                </header>
                {p.clima && (
                  <p className={k.text}>
                    <b>Clima.</b> {p.clima}
                  </p>
                )}
                {p.povos && (
                  <p className={k.text}>
                    <b>Povos.</b> {p.povos}
                  </p>
                )}
                {p.economia_e_manejo && (
                  <p className={k.text}>
                    <b>Economia e manejo.</b> {p.economia_e_manejo}
                  </p>
                )}
                {(p.evidencias?.length ?? 0) > 0 && (
                  <>
                    <p className={k.lbl}>Evidências</p>
                    <ul className={k.list}>
                      {p.evidencias?.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </>
                )}
                {(p.controversias?.length ?? 0) > 0 && (
                  <>
                    <p className={k.lbl}>Controvérsias</p>
                    <ul className={k.list}>
                      {p.controversias?.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </>
                )}
                <Fontes f={p.fontes} />
              </article>
            ))}
          </div>
        )}
        {aba === 'eventos' && (
          <div className={k.grid}>
            {d.eventos.map((e) => (
              <article key={e.id} className={`card ${k.pad}`}>
                <header className={k.head}>
                  <div>
                    <p className={k.lbl}>
                      {str(e.data_ap)}
                      {e.data_calendario ? ` · ${e.data_calendario}` : ''}
                    </p>
                    <h3 className={k.title}>{e.titulo}</h3>
                  </div>
                  <Badge>{periodoNome.get(e.periodo) ?? e.periodo}</Badge>
                </header>
                {e.resumo && <p className={k.text}>{e.resumo}</p>}
                {e.incerteza && (
                  <p className={k.muted}>
                    <b>Incerteza.</b> {e.incerteza}
                  </p>
                )}
                <Fontes f={e.fontes} />
              </article>
            ))}
          </div>
        )}
        {aba === 'clima' && (
          <div className={k.grid}>
            {clima.map((c) => (
              <article key={c.id} className={`card ${k.pad}`}>
                <header>
                  <p className={k.lbl}>
                    {ap(c.inicio_ap)} → {ap(c.fim_ap)}
                    {c.regiao ? ` · ${c.regiao}` : ''}
                  </p>
                  <h3 className={k.title}>{c.titulo}</h3>
                </header>
                {c.descricao && <p className={k.text}>{c.descricao}</p>}
                {c.incerteza && (
                  <p className={k.muted}>
                    <b>Incerteza.</b> {c.incerteza}
                  </p>
                )}
                <Fontes f={c.fontes} />
              </article>
            ))}
          </div>
        )}
        {aba === 'povos' && (
          <>
            <p className={k.muted}>
              {povos.length} grupos e origens · {nver} fontes verificadas. “Contagem” = registro; “estimativa” = faixa com controvérsia.
            </p>
            <div className={k.grid}>
              {povos.map((g) => {
                const n = g.numero_estimado
                const contagem = /contagem/i.test(n?.tipo ?? '') && !/estimativa/i.test(n?.tipo ?? '')
                return (
                  <article key={g.id} className={`card ${k.pad}`}>
                    <header className={k.head}>
                      <h3 className={k.title}>{g.grupo}</h3>
                      <Badge tone={contagem ? 'pos' : 'warn'}>{n?.tipo ?? 'sem tipo'}</Badge>
                    </header>
                    {g.origem && (
                      <p className={k.text}>
                        <b>Origem.</b> {g.origem}
                      </p>
                    )}
                    {g.periodo_chegada && <p className={k.muted}>Chegada: {g.periodo_chegada}</p>}
                    <dl className={k.kv}>
                      <dt>Número</dt>
                      <dd>{n?.valor != null ? num(n.valor) : (n?.faixa ?? '—')}</dd>
                      {n?.valor != null && n?.faixa && (
                        <>
                          <dt>Faixa</dt>
                          <dd>{n.faixa}</dd>
                        </>
                      )}
                      {n?.fonte && (
                        <>
                          <dt>Fonte</dt>
                          <dd>{n.fonte}</dd>
                        </>
                      )}
                    </dl>
                    {g.contribuicao_historica && (
                      <p className={k.text}>
                        <b>Contribuição histórica.</b> {g.contribuicao_historica}
                      </p>
                    )}
                    {(g.regioes?.length ?? 0) > 0 && (
                      <ul className={k.chips} aria-label="Regiões">
                        {g.regioes?.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    )}
                    <Fontes f={g.fontes} />
                  </article>
                )
              })}
            </div>
          </>
        )}
        {aba === 'diversidade' && <Diversidade d={d} />}
        {aba === 'perguntas' && (
          <ol className={styles.questions}>
            {perg.map((q) => (
              <li key={q} className="card">
                {q}
              </li>
            ))}
          </ol>
        )}
      </Tabs>
    </div>
  )
}

export default function AntesPage() {
  const q = useAntes()
  return (
    <PageTemplate>
      <SectionHeader
        level={1}
        title="Antes de 1500"
        description="O território que hoje é o Brasil: povos, diversidade, clima e manejo, em anos antes do presente. Cada datação mostra a incerteza e cada fonte, o seu selo."
      />
      <InlineNote id="antes-etnia-destino" tone="info" dismissible={false} baseId="antes-de-1500" title="Etnia não é destino.">
        Aqui as trajetórias aparecem como processo histórico e institucional (terra, crédito, escravização, imigração subsidiada), nunca como determinismo racial ou cultural. É um argumento
        institucional, não um resultado quantificado.
      </InlineNote>
      <PageGate query={q} file="antes_de_1500.json">
        {(d) => <Content d={d} />}
      </PageGate>
    </PageTemplate>
  )
}

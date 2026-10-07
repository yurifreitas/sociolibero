import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { Select } from '@/components/atoms/Select'
import { InlineNote } from '@/components/molecules/InlineNote'
import { PageGate } from '@/components/molecules/PageGate'
import { Seal } from '@/components/molecules/Seal'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { Tabs } from '@/components/molecules/Tabs'
import { YearBars } from '@/components/organisms/YearBars'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useTextosIndex } from '@/features/biblioteca/hooks'
import { hrefTrecho, indiceCruzado } from '@/features/biblioteca/model'
import { useIndigenasEleicoes } from '@/features/indigenas/hooks'
import type { Comparacao, Indigenas } from '@/features/indigenas/schemas'
import { cn } from '@/lib/cn'
import { fInt, fNum1, fPp } from '@/lib/format'
import { useScrollToId } from '@/lib/useScrollToId'
import { useUrlState } from '@/lib/useUrlState'
import k from './know.module.css'
import s from './IndigenasEleicoesPage.module.css'

type Aba = 'movimento' | 'candidaturas' | 'territorio' | 'eleitos' | 'limites'
const ABAS: Aba[] = ['movimento', 'candidaturas', 'territorio', 'eleitos', 'limites']
const ANOS = ['2014', '2018', '2022', '2026']
const n1 = (v: number | null | undefined) => (v == null ? '—' : fNum1(v))

function Movimento({ d, foco }: { d: Indigenas; foco: string | null }) {
  const txt = useTextosIndex()
  const cruz = useMemo(() => indiceCruzado(txt.data?.documentos ?? []), [txt.data])
  const itens = [...d.linha_do_tempo].sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''))
  return (
    <ol className={s.timeline}>
      {itens.map((it) => {
        const bib = cruz.porIndigena.get(it.id) ?? []
        return (
          <li key={it.id} id={it.id} className={cn(s.item, foco === it.id && s.focus)}>
            <span className={s.dot} aria-hidden="true" />
            <article className={cn('card', k.pad)}>
              <header className={k.head}>
                <div><p className={k.sub}>{it.data ?? 'data n/d'}</p><h3 className={k.title}>{it.titulo}</h3></div>
              </header>
              {it.resumo && <p className={k.text}>{it.resumo}</p>}
              <div className={s.versus}>
                <div>
                  <p className={k.lbl}>Como se construiu ({it.passos_de_construcao?.length ?? 0} passos)</p>
                  <ol className={s.steps}>{it.passos_de_construcao?.map((p) => <li key={p}>{p}</li>)}</ol>
                </div>
                <div className={s.dispute}>
                  <p className={k.lbl}>O que é disputado</p>
                  <p className={k.text}>{it.controversia ?? 'Sem controvérsia registrada.'}</p>
                  {it.incerteza && (<><p className={k.lbl}>O que não foi conferido</p><p className={cn(k.text, s.warn)}>{it.incerteza}</p></>)}
                </div>
              </div>
              {((it.historia_ids?.length ?? 0) > 0 || bib.length > 0) && (
                <ul className={k.links}>
                  {it.historia_ids?.map((id) => <li key={id}><Link to={`/historia?sel=ev:${id}`}>história: {id}</Link></li>)}
                  {bib.slice(0, 6).map((b) => <li key={`${b.doc.id}-${b.trecho.id}`}><Link to={hrefTrecho(b)} title={b.trecho.por_que_importa ?? ''}><Icon name="book" size={12} /> {b.trecho.rotulo}</Link></li>)}
                </ul>
              )}
              {(it.fontes?.length ?? 0) > 0 && (
                <ul className={k.src}>
                  {it.fontes?.map((f, i) => (
                    <li key={`${f.url}-${i}`}>
                      <Seal v={f.verificado} labels={{ yes: 'lido', no: 'não verificado' }} />
                      {f.url ? <a href={f.url} target="_blank" rel="noreferrer">{(f.titulo ?? f.url).slice(0, 110)} <Icon name="external" size={11} /></a> : <span>{f.titulo}</span>}
                      {f.trecho_confirmado && <span className={k.muted}> — “{f.trecho_confirmado.slice(0, 140)}{f.trecho_confirmado.length > 140 ? '…' : ''}”</span>}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </li>
        )
      })}
    </ol>
  )
}

function Candidaturas({ d }: { d: Indigenas }) {
  const { get, update } = useUrlState()
  const c = d.candidaturas
  const ano = get('ano') ?? '2022'
  if (!c) return null
  const anos = ANOS.filter((a) => c.anos[a])
  const sel = ano === 'municipal_2024' ? c.municipal_2024 : c.anos[ano]
  const cargos = Object.entries(sel?.por_cargo ?? {}).sort((a, b) => (b[1].candidaturas ?? 0) - (a[1].candidaturas ?? 0))
  const cmp = c.validacao?.comparacoes ?? []
  const dif = cmp.filter((x) => x.diferenca != null && x.diferenca !== 0)
  const dfed = c.anos['2022']?.por_cor_raca_deputado_federal
  return (
    <div className={k.stack}>
      <div className={s.charts}>
        <YearBars title="Candidaturas indígenas (autodeclaradas)" subtitle="Eleições gerais; cor/raça só existe a partir de 2014" categories={anos} series={[{ label: 'candidaturas', values: anos.map((a) => c.anos[a]?.indigenas ?? null) }]} summary={`Candidaturas indígenas: ${anos.map((a) => `${a}: ${c.anos[a]?.indigenas ?? 'sem dado'}`).join(', ')}`} />
        <YearBars title="Indígenas eleitos" subtitle="Todos os cargos das eleições gerais (2026 é preliminar)" categories={anos} series={[{ label: 'eleitos', values: anos.map((a) => c.anos[a]?.eleitos ?? null), tone: 'accent' }]} summary={`Indígenas eleitos: ${anos.map((a) => `${a}: ${c.anos[a]?.eleitos ?? 'sem dado'}`).join(', ')}`} />
        <YearBars title="Eleitos por 100 candidaturas" subtitle="Descritivo: depende do tamanho das listas, do partido e dos recursos" categories={anos} series={[{ label: 'indígenas', values: anos.map((a) => c.anos[a]?.razao_eleitos_candidaturas_indigenas ?? null) }, { label: 'demais categorias', values: anos.map((a) => c.anos[a]?.razao_eleitos_candidaturas_demais ?? null), tone: 'muted' }]} fmt={(v) => n1(v)} summary="Eleitos por 100 candidaturas, indígenas e demais categorias, por ano" />
      </div>

      {dif.length > 0 && (
        <InlineNote id="ind-dif" tone="warn" dismissible={false} title="Números que não batem com o publicado.">
          {dif.map((x) => `${x.item}: calculado ${x.calculado}, publicado ${x.publicado} (${x.diferenca != null && x.diferenca > 0 ? '+' : ''}${x.diferenca})`).join(' · ')}.{' '}
          {(d.meta?.lacunas ?? []).concat(d.limites ?? [], d.municipios_indigenas?.ressalvas ?? []).find((x) => /Wai[ãa]pi/.test(x)) ?? ''}
        </InlineNote>
      )}

      <section className={k.stack} aria-label="Detalhe por cargo">
        <div className={k.filters}>
          <label className={s.sel}>Eleição<Select value={ano} onChange={(e) => update({ ano: e.target.value === '2022' ? null : e.target.value })}>{anos.map((a) => <option key={a} value={a}>{a}{a === '2026' ? ' (preliminar)' : ''}</option>)}{c.municipal_2024 && <option value="municipal_2024">2024 (municipal)</option>}</Select></label>
        </div>
        {sel && (
          <div className={k.stats}>
            <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Candidaturas indígenas</p><p className={s.big}>{fInt(sel.indigenas)}</p><p className={k.muted}>de {fInt(sel.total_candidaturas)} ({n1(sel.pct)}%)</p></div>
            <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Eleitos</p><p className={s.big}>{fInt(sel.eleitos)}</p><p className={k.muted}>de {fInt(sel.eleitos_total)} eleitos ({n1(sel.pct_dos_eleitos)}%)</p></div>
            <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Eleitos por 100 candidaturas</p><p className={s.big}>{n1(sel.razao_eleitos_candidaturas_indigenas)}</p><p className={k.muted}>demais categorias: {n1(sel.razao_eleitos_candidaturas_demais)}</p></div>
            <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Representação vs. Censo 2022</p><p className={s.big}>{sel.razao_representacao_vs_censo_cor_raca != null ? `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(sel.razao_representacao_vs_censo_cor_raca)}×` : '—'}</p><p className={k.muted}>{n1(sel.pct)}% das candidaturas ÷ {n1(sel.pct_censo_cor_raca)}% da população (cor/raça)</p></div>
          </div>
        )}
        <div className={k.tableWrap}>
          <table className={k.table}>
            <caption className="sr-only">Candidaturas e eleitos indígenas por cargo</caption>
            <thead><tr><th>Cargo</th><th className={k.n}>Candidaturas</th><th className={k.n}>Indígenas</th><th className={k.n}>% indígenas</th><th className={k.n}>Eleitos no cargo</th><th className={k.n}>Eleitos indígenas</th><th className={k.n}>Suplentes indígenas</th></tr></thead>
            <tbody>
              {cargos.map(([nome, v]) => (
                <tr key={nome} className={cn((v.eleitos_indigenas ?? 0) > 0 && k.hi)}>
                  <td>{nome.toLowerCase()}</td>
                  <td className={k.n}>{fInt(v.candidaturas)}</td><td className={k.n}>{fInt(v.indigenas)}</td><td className={k.n}>{n1(v.pct_indigenas)}</td>
                  <td className={k.n}>{fInt(v.eleitos)}</td><td className={k.n}>{fInt(v.eleitos_indigenas)}</td><td className={k.n}>{fInt(v.suplentes_indigenas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {dfed && ano === '2022' && (
        <section className={k.stack} aria-label="Deputados federais por cor/raça em 2022">
          <h3 className={s.h3}>Deputado federal 2022: eleitos por 100 candidaturas, por cor/raça</h3>
          <div className={k.tableWrap}>
            <table className={k.table}>
              <caption className="sr-only">Candidaturas e eleitos a deputado federal em 2022 por cor/raça</caption>
              <thead><tr><th>Cor/raça</th><th className={k.n}>Candidaturas</th><th className={k.n}>Eleitos</th><th className={k.n}>Eleitos por 100</th></tr></thead>
              <tbody>{Object.entries(dfed).map(([cr, v]) => <tr key={cr} className={cn(cr === 'indigena' && k.hi)}><td>{cr.replace('_', ' ')}</td><td className={k.n}>{fInt(v.candidaturas)}</td><td className={k.n}>{fInt(v.eleitos)}</td><td className={k.n}>{n1(v.razao_eleitos_candidaturas)}</td></tr>)}</tbody>
            </table>
          </div>
          <p className={k.muted}>Comparação descritiva: não controla partido, UF nem recursos e não mede discriminação.</p>
        </section>
      )}

      <section className={k.stack} aria-label="Contra o Censo e o eleitorado">
        <h3 className={s.h3}>Contra o Censo 2022 e o eleitorado</h3>
        <div className={k.stats}>
          <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Censo: indígenas por cor/raça</p><p className={s.big}>{fInt(c.censo_2022?.indigena_cor_raca)}</p><p className={k.muted}>{n1(c.censo_2022?.pct_cor_raca)}% da população</p></div>
          <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Censo: critério ampliado</p><p className={s.big}>{fInt(c.censo_2022?.indigena_ampliado)}</p><p className={k.muted}>{n1(c.censo_2022?.pct_ampliado)}% (inclui quem “se considera indígena”)</p></div>
          <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Cor/raça “não informado” no eleitorado</p><p className={s.big}>{n1(c.eleitorado_2024_cor_raca?.pct_sem_informacao)}%</p><p className={k.muted}>em 2024 (em 2022: {n1(c.eleitorado_2022_cor_raca?.pct_sem_informacao)}%): não há % indígena real do eleitorado</p></div>
        </div>
        {cmp.length > 0 && (
          <div className={k.tableWrap}>
            <table className={k.table}>
              <caption className="sr-only">Números calculados e publicados</caption>
              <thead><tr><th>Item</th><th className={k.n}>Calculado</th><th className={k.n}>Publicado</th><th className={k.n}>Diferença</th><th>Fonte</th></tr></thead>
              <tbody>{cmp.map((x, i) => <tr key={`${x.item}-${i}`} className={cn(x.diferenca != null && x.diferenca !== 0 && k.hi)}><td>{x.item}</td><td className={k.n}>{fInt(x.calculado)}</td><td className={k.n}>{fInt(x.publicado)}</td><td className={k.n}>{x.diferenca == null ? '—' : x.diferenca}</td><td>{(x.fonte ?? '').slice(0, 120)} {x.fonte_aberta === false && <Badge tone="warn">sem fonte aberta</Badge>}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Linha({ label, a, b, dif, ic, pp = true }: { label: string; a: number | null | undefined; b: number | null | undefined; dif: number | null; ic?: number[] | null; pp?: boolean }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td className={k.n}>{n1(a)}%</td>
      <td className={k.n}>{n1(b)}%</td>
      <td className={cn(k.n, s.diff)}>{dif == null ? '—' : pp ? fPp(dif) : n1(dif)}{ic && ic.length === 2 && <span className={s.ic}> [{n1(ic[0])}; {n1(ic[1])}]</span>}</td>
    </tr>
  )
}

function Territorio({ d }: { d: Indigenas }) {
  const { get, update } = useUrlState()
  const mi = d.municipios_indigenas
  const pleitos = Object.entries(mi?.resultados ?? {})
  const pid = get('pleito') ?? 'pres_2022_t1'
  const res = mi?.resultados?.[pid] ?? pleitos[0]?.[1]
  const key = mi?.resultados?.[pid] ? pid : (pleitos[0]?.[0] ?? pid)
  const limiares = (res?.comparacoes ?? []).map((x) => x.limiar_pct_indigena)
  const lim = Number(get('lim')) || 10
  const comp: Comparacao | undefined = res?.comparacoes?.find((x) => x.limiar_pct_indigena === lim) ?? res?.comparacoes?.[0]
  const sec = mi?.secoes_em_terras_indigenas
  const turno = key.endsWith('_t2') ? '2' : '1'
  const secT = key.startsWith('pres_2022') ? sec?.comportamento?.turnos?.[turno] : undefined
  const demais = secT?.demais_secoes_dos_mesmos_municipios
  const emTi = secT?.em_ti
  const dMun = comp?.diferenca_pp_dentro_da_uf?.comparecimento_pct ?? null
  const dSec = demais?.comparecimento_pct != null && emTi?.comparecimento_pct != null ? emTi.comparecimento_pct - demais.comparecimento_pct : null
  return (
    <div className={k.stack}>
      <InlineNote id="ind-eco" tone="warn" dismissible={false} title="Falácia ecológica.">
        Estas são comparações entre municípios e entre seções (agregados). Não dizem como indígenas individualmente votam, nem se votam diferente de não indígenas: votar em município ou seção de terra indígena inclui não indígenas e exclui indígenas que votam na cidade. Não há controle causal.
      </InlineNote>
      <div className={k.filters}>
        <label className={s.sel}>Pleito<Select value={key} onChange={(e) => update({ pleito: e.target.value === 'pres_2022_t1' ? null : e.target.value })}>{pleitos.map(([id, v]) => <option key={id} value={id}>{v.rotulo ?? id}{v.status && v.status !== 'oficial' ? ' · preliminar' : ''}</option>)}</Select></label>
        <label className={s.sel}>Município “de alto % indígena” a partir de<Select value={String(comp?.limiar_pct_indigena ?? lim)} onChange={(e) => update({ lim: e.target.value === '10' ? null : e.target.value })}>{limiares.map((l) => <option key={l} value={l}>{l}% da população</option>)}</Select></label>
      </div>

      {dMun != null && (
        <p className={s.callout} role="status">
          <Icon name="info" size={16} /> <span>Sinal de comparecimento: <strong>{fPp(dMun)}</strong> entre municípios{dSec != null ? <> e <strong>{fPp(dSec)}</strong> entre seções em terra indígena e as demais dos mesmos municípios{Math.abs(dSec) < 1.5 && Math.abs(dMun) > 2 ? ': o sinal municipal desaparece quando se olha por seção.' : '.'}</> : '. A comparação por seção só existe para 2022.'}</span>
        </p>
      )}

      <div className={s.two}>
        <section className={cn('card', k.pad)} aria-label="Entre municípios">
          <h3 className={k.title}>Entre municípios, dentro da UF</h3>
          <p className={k.sub}>{comp ? `${fInt(comp.municipios_alto)} municípios com ≥ ${comp.limiar_pct_indigena}% indígenas (${fInt(comp.aptos_alto)} aptos) × ${fInt(comp.municipios_baixo)} demais` : 'sem dado'}</p>
          {comp && (
            <div className={k.tableWrap}>
              <table className={k.table}>
                <caption className="sr-only">Municípios de alto percentual indígena contra os demais</caption>
                <thead><tr><th></th><th className={k.n}>Alto</th><th className={k.n}>Demais</th><th className={k.n}>Diferença dentro da UF [IC95]</th></tr></thead>
                <tbody>
                  <Linha label="Comparecimento" a={comp.nivel_alto?.comparecimento_pct} b={comp.nivel_baixo?.comparecimento_pct} dif={comp.diferenca_pp_dentro_da_uf?.comparecimento_pct ?? null} ic={comp.ic95_bootstrap_pp?.comparecimento_pct} />
                  <Linha label="Brancos e nulos" a={comp.nivel_alto?.brancos_nulos_pct} b={comp.nivel_baixo?.brancos_nulos_pct} dif={comp.diferenca_pp_dentro_da_uf?.brancos_nulos_pct ?? null} ic={comp.ic95_bootstrap_pp?.brancos_nulos_pct} />
                  <Linha label="Voto no 13 (Lula)" a={comp.nivel_alto?.voto_13_pct} b={comp.nivel_baixo?.voto_13_pct} dif={comp.diferenca_pp_dentro_da_uf?.voto_13_pct ?? null} ic={comp.ic95_bootstrap_pp?.voto_13_pct} />
                  <Linha label="Voto no 22" a={comp.nivel_alto?.voto_22_pct} b={comp.nivel_baixo?.voto_22_pct} dif={comp.diferenca_pp_dentro_da_uf?.voto_22_pct ?? null} ic={comp.ic95_bootstrap_pp?.voto_22_pct} />
                </tbody>
              </table>
            </div>
          )}
          <p className={k.muted}>Método: {mi?.metodo ?? '—'}</p>
        </section>

        <section className={cn('card', k.pad)} aria-label="Entre seções">
          <h3 className={k.title}>Entre seções: em terra indígena × demais seções dos mesmos municípios</h3>
          {sec?.disponivel && secT && demais && emTi ? (
            <>
              <p className={k.sub}>{fInt(emTi.secoes_com_dado)} seções em terra indígena × {fInt(demais.secoes_com_dado)} demais · {sec.ano}, turno {turno}</p>
              <div className={k.tableWrap}>
                <table className={k.table}>
                  <caption className="sr-only">Seções em terra indígena contra as demais seções dos mesmos municípios</caption>
                  <thead><tr><th></th><th className={k.n}>Em TI</th><th className={k.n}>Demais</th><th className={k.n}>Diferença</th></tr></thead>
                  <tbody>
                    <Linha label="Comparecimento" a={emTi.comparecimento_pct} b={demais.comparecimento_pct} dif={dSec} />
                    {Object.keys({ ...(emTi.voto_pct ?? {}), ...(demais.voto_pct ?? {}) }).filter((c) => (emTi.voto_pct?.[c] ?? 0) > 5 || (demais.voto_pct?.[c] ?? 0) > 5).map((c) => (
                      <Linha key={c} label={`Voto no ${c}`} a={emTi.voto_pct?.[c]} b={demais.voto_pct?.[c]} dif={(emTi.voto_pct?.[c] ?? 0) - (demais.voto_pct?.[c] ?? 0)} />
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={k.muted}>Votar numa seção dentro de terra indígena inclui não indígenas (servidores, missionários, moradores do entorno). O voto por seção não é o voto dos indígenas.</p>
            </>
          ) : (
            <p className={k.muted}>{sec?.disponivel ? 'A comparação por seção existe só para 2022.' : 'Seções em terras indígenas indisponíveis neste arquivo.'}</p>
          )}
        </section>
      </div>

      {sec?.disponivel && (
        <div className={k.stats}>
          <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Seções em terra indígena ({sec.ano})</p><p className={s.big}>{fInt(sec.secoes_em_ti)}</p><p className={k.muted}>{fInt(sec.locais_em_ti)} locais · {fInt(sec.municipios_com_secao_em_ti)} municípios · {fInt(sec.tis_com_secao)} TIs</p></div>
          <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Eleitores nessas seções</p><p className={s.big}>{fInt(sec.eleitores_em_secoes_em_ti)}</p><p className={k.muted}>{n1(sec.pct_eleitores_em_secoes_em_ti)}% do eleitorado</p></div>
        </div>
      )}
      {(sec?.maiores_municipios?.length ?? 0) > 0 && (
        <section className={k.stack} aria-label="Maiores municípios">
          <h3 className={s.h3}>Municípios com mais eleitores em seções de terra indígena</h3>
          <div className={k.tableWrap}>
            <table className={k.table}>
              <caption className="sr-only">Municípios com mais seções em terras indígenas</caption>
              <thead><tr><th>Município</th><th>UF</th><th className={k.n}>Seções</th><th className={k.n}>Eleitores</th></tr></thead>
              <tbody>{sec?.maiores_municipios?.map((m) => <tr key={`${m.uf}-${m.municipio}`}><td>{(m.municipio ?? '').toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())}</td><td>{m.uf}</td><td className={k.n}>{fInt(m.secoes)}</td><td className={k.n}>{fInt(m.eleitores)}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      )}
      {(mi?.ressalvas?.length ?? 0) > 0 && (
        <details className={s.det}><summary>Ressalvas ({mi?.ressalvas?.length})</summary><ul className={k.list}>{mi?.ressalvas?.map((x) => <li key={x}>{x}</li>)}</ul></details>
      )}
      <p className={k.muted}>Ver também a camada <Link to="/mapa?m=pop_indigena">população indígena no mapa</Link> e <Link to="/mapa?m=ti_area">terras indígenas (ha)</Link>.</p>
    </div>
  )
}

function Content({ d }: { d: Indigenas }) {
  const { get, update } = useUrlState()
  const aba: Aba = ABAS.find((a) => a === get('aba')) ?? 'movimento'
  const foco = get('i')
  useScrollToId(foco, aba)
  const lacunas = d.meta?.lacunas ?? []
  return (
    <div className={k.stack}>
      <div className={s.fixed}>
        <InlineNote id="ind-autodecl" tone="warn" baseId="indigenas-eleicoes" dismissible={false} title="Autodeclaração.">
          A cor/raça de candidaturas é autodeclarada e o TSE não a valida: contar eleitos “indígenas” pelo TSE não é o mesmo que contar a bancada do movimento. Os dados de 2026 são preliminares (snapshot de 06/10/2026).
        </InlineNote>
        {d.meta?.aviso && <InlineNote id="ind-aviso" tone="info" dismissible={false} title="Como esta página foi feita.">{d.meta.aviso}</InlineNote>}
      </div>
      <Tabs<Aba>
        label="Seções de história indígena e eleições"
        value={aba}
        onChange={(a) => update({ aba: a === 'movimento' ? null : a, i: null })}
        tabs={[
          { key: 'movimento', label: 'Como o movimento se construiu', count: d.linha_do_tempo.length },
          { key: 'candidaturas', label: 'Candidaturas e eleitos' },
          { key: 'territorio', label: 'Municípios e seções' },
          { key: 'eleitos', label: 'Figuras públicas eleitas', count: d.eleitos_figuras_publicas?.length ?? 0 },
          { key: 'limites', label: 'Lacunas e limites', count: lacunas.length + (d.limites?.length ?? 0) },
        ]}
      >
        {aba === 'movimento' && <Movimento d={d} foco={foco} />}
        {aba === 'candidaturas' && <Candidaturas d={d} />}
        {aba === 'territorio' && <Territorio d={d} />}
        {aba === 'eleitos' && (
          <div className={k.stack}>
            <p className={k.text}>Só presidente e vice, senadores, governadores e deputados federais. Nenhuma pessoa não eleita nem eleita para cargo estadual ou municipal é nomeada. A autodeclaração indígena não é validada pelo TSE.</p>
            <div className={k.tableWrap}>
              <table className={k.table}>
                <caption className="sr-only">Figuras públicas eleitas autodeclaradas indígenas</caption>
                <thead><tr><th>Nome</th><th>Cargo</th><th className={k.n}>Ano</th><th>UF</th><th>Partido</th><th>Selo</th><th>Fonte e nota</th></tr></thead>
                <tbody>{d.eleitos_figuras_publicas?.map((e) => <tr key={`${e.nome}-${e.ano}`}><td>{e.nome}</td><td>{e.cargo}</td><td className={k.n}>{e.ano}</td><td>{e.uf}</td><td>{e.partido}</td><td><Seal v={e.verificado} labels={{ yes: 'conferido em imprensa', no: 'não conferido' }} /></td><td>{e.fonte}{e.nota ? ` — ${e.nota}` : ''}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
        {aba === 'limites' && (
          <div className={k.stack}>
            {lacunas.length > 0 && <section><h3 className={s.h3}>Lacunas</h3><ul className={k.list}>{lacunas.map((x) => <li key={x}>{x}</li>)}</ul></section>}
            {(d.limites?.length ?? 0) > 0 && <section><h3 className={s.h3}>Limites</h3><ul className={k.list}>{d.limites?.map((x) => <li key={x}>{x}</li>)}</ul></section>}
            {(d.meta?.fontes?.length ?? 0) > 0 && (
              <section><h3 className={s.h3}>Dados baixados (com hash)</h3>
                <ul className={k.src}>{d.meta?.fontes?.map((f) => <li key={f.nome}><span>{f.nome}</span> <code className={s.hash} title={f.sha256 ?? ''}>{(f.sha256 ?? '').slice(0, 12)}…</code> {f.url && <a href={f.url} target="_blank" rel="noreferrer">origem <Icon name="external" size={11} /></a>}</li>)}</ul>
              </section>
            )}
          </div>
        )}
      </Tabs>
    </div>
  )
}

export default function IndigenasEleicoesPage() {
  const q = useIndigenasEleicoes()
  return (
    <PageTemplate>
      <SectionHeader level={1} title="Povos indígenas e eleições" description="Como o movimento indígena se construiu, em passos datados, até as candidaturas e os eleitos de hoje; os números do TSE por cargo; e o que as comparações entre municípios e entre seções mostram, e o que não permitem concluir." />
      <PageGate query={q} file="indigenas_eleicoes.json">{(d) => <Content d={d} />}</PageGate>
    </PageTemplate>
  )
}

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
import { BandChart, type BandPoint } from '@/components/organisms/BandChart'
import { YearBars } from '@/components/organisms/YearBars'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useTextosIndex } from '@/features/biblioteca/hooks'
import { hrefTrecho, indiceCruzado } from '@/features/biblioteca/model'
import { useEleitorado } from '@/features/eleitorado/hooks'
import type { Eleitorado } from '@/features/eleitorado/schemas'
import { cn } from '@/lib/cn'
import { fInt, fNum1 } from '@/lib/format'
import { useScrollToId } from '@/lib/useScrollToId'
import { useUrlState } from '@/lib/useUrlState'
import k from './know.module.css'
import s from './VotoAnalfabetoPage.module.css'

type Aba = 'sufragio' | 'serie' | 'comparecimento' | 'cruzamentos' | 'futuro' | 'teorias'
const ABAS: Aba[] = ['sufragio', 'serie', 'comparecimento', 'cruzamentos', 'futuro', 'teorias']
const n1 = (v: number | null | undefined) => (v == null ? '—' : fNum1(v))
const mi = (v: number) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v / 1e6)} mi`
const GRUPOS: Record<string, string> = { analfabeto: 'Analfabeto', le_escreve: 'Lê e escreve', fundamental: 'Fundamental', medio: 'Médio', superior: 'Superior', nao_informado: 'Não informado' }

type Grp = { aptos?: number; comparecimento?: number; pct_comparecimento?: number; aptos_facultativo?: number }
type Turno = { total?: Grp; por_grupo_instrucao?: Record<string, Grp>; por_grupo_etario_x_instrucao?: Record<string, Record<string, Grp>> }

function Sufragio({ d, foco }: { d: Eleitorado; foco: string | null }) {
  const txt = useTextosIndex()
  const cruz = useMemo(() => indiceCruzado(txt.data?.documentos ?? []), [txt.data])
  return (
    <ol className={s.timeline}>
      {d.historia.map((h) => {
        const bib = cruz.porHistoria.get(h.id) ?? []
        const e = h.eleitorado
        return (
          <li key={h.id} id={h.id} className={cn(s.item, foco === h.id && s.focus)}>
            <span className={s.dot} aria-hidden="true" />
            <article className={cn('card', k.pad)}>
              <header className={k.head}>
                <div><h3 className={k.title}>{h.periodo}</h3></div>
                <div className={s.pct}>
                  {e?.pct_populacao != null ? <><b>{n1(e.pct_populacao)}%</b><span>da população votava{e.verificado === false ? ' (estimativa)' : ''}</span></> : <span>eleitorado sem número lido</span>}
                  {e && <Seal v={e.verificado} labels={{ yes: 'número lido', no: 'não verificado' }} />}
                </div>
              </header>
              <div className={s.versus}>
                <div className={k.stack}>
                  <div><p className={k.lbl}>Regra</p><p className={k.text}>{h.regra}</p></div>
                  <div><p className={k.lbl}>Quem votava</p><p className={k.text}>{h.quem_votava}</p></div>
                  {h.efeito && <div><p className={k.lbl}>Efeito</p><p className={k.text}>{h.efeito}</p></div>}
                </div>
                <div className={k.stack}>
                  <div className={s.gp}><p className={k.lbl}>Quem ganhou</p><ul className={k.list}>{h.interesses?.ganhou?.map((x) => <li key={x}>{x}</li>)}</ul></div>
                  <div className={s.gp}><p className={k.lbl}>Quem perdeu</p><ul className={k.list}>{h.interesses?.perdeu?.map((x) => <li key={x}>{x}</li>)}</ul></div>
                  {(h.leituras_rivais?.length ?? 0) > 0 && <div className={s.rival}><p className={k.lbl}>Leituras rivais</p><ul className={k.list}>{h.leituras_rivais?.map((x) => <li key={x}>{x}</li>)}</ul></div>}
                </div>
              </div>
              {bib.length > 0 && <ul className={k.links}>{bib.slice(0, 6).map((b) => <li key={`${b.doc.id}-${b.trecho.id}`}><Link to={hrefTrecho(b)} title={b.trecho.por_que_importa ?? ''}><Icon name="book" size={12} /> {b.trecho.rotulo}</Link></li>)}</ul>}
              {e?.fonte && <p className={k.muted}>Número do eleitorado: {e.url ? <a href={e.url} target="_blank" rel="noreferrer">{e.fonte} <Icon name="external" size={11} /></a> : e.fonte}</p>}
              <FontesLidas fs={h.fontes} />
            </article>
          </li>
        )
      })}
    </ol>
  )
}

function FontesLidas({ fs }: { fs?: Eleitorado['historia'][number]['fontes'] }) {
  if (!fs?.length) return null
  return (
    <ul className={k.src}>
      {fs.map((f, i) => {
        const o = typeof f === 'string' ? { titulo: f, url: null, citacao: null, lido: null } : f
        const label = (o.titulo ?? o.citacao ?? '').toString()
        return <li key={i}>{o.url ? <a href={o.url} target="_blank" rel="noreferrer">{label.slice(0, 130)} <Icon name="external" size={11} /></a> : <span>{label.slice(0, 160)}</span>}</li>
      })}
    </ul>
  )
}

function Serie({ d }: { d: Eleitorado }) {
  const sr = d.serie_analfabetismo ?? []
  const tse = sr.find((x) => x.id === 'analfabetos_no_eleitorado_tse')
  const instr = d.serie_eleitorado_por_instrucao_nacional_sem_exterior ?? {}
  const anos = Object.keys(instr).sort()
  return (
    <div className={k.stack}>
      <div className={s.charts}>
        {tse?.pontos && <YearBars title="Eleitores analfabetos no cadastro do TSE" subtitle="% do eleitorado, sem o exterior; 2026 é o levantamento mais recente" categories={tse.pontos.map((p) => String(p[0]))} series={[{ label: '% do eleitorado', values: tse.pontos.map((p) => p[1]) }]} fmt={(v) => `${n1(v)}%`} summary={`Eleitores analfabetos, % do eleitorado: ${tse.pontos.map((p) => `${p[0]}: ${p[1]}%`).join(', ')}`} />}
        <YearBars title="Quantos são" subtitle="milhões de eleitores com grau de instrução ‘analfabeto’ ou ‘lê e escreve’" categories={anos} series={[{ label: 'analfabeto', values: anos.map((a) => (instr[a]?.por_grupo?.analfabeto ?? null) != null ? (instr[a]?.por_grupo?.analfabeto as number) / 1e6 : null) }, { label: 'lê e escreve', values: anos.map((a) => (instr[a]?.por_grupo?.le_escreve ?? null) != null ? (instr[a]?.por_grupo?.le_escreve as number) / 1e6 : null), tone: 'accent' }]} fmt={(v) => n1(v)} summary="Milhões de eleitores analfabetos e que leem e escrevem, por ano" />
      </div>
      <InlineNote id="va-cadastro" tone="warn" dismissible={false} title="Cadastro não é população.">
        A série do TSE conta inscritos no cadastro eleitoral com o grau de instrução declarado: inclui quem morreu ou mudou e ainda não foi excluído, e a declaração não é um teste de leitura. Já as séries de Censo e PNAD medem a população de 15 anos ou mais; não se somam nem se emendam.
      </InlineNote>
      <div className={s.charts}>
        {sr.filter((x) => x.id !== 'analfabetos_no_eleitorado_tse' && x.pontos).map((x) => (
          <YearBars key={x.id} title={x.rotulo ?? x.id} subtitle={x.unidade ?? undefined} categories={(x.pontos ?? []).map((p) => String(p[0]))} series={[{ label: x.unidade ?? 'valor', values: (x.pontos ?? []).map((p) => p[1]), tone: 'muted' }]} fmt={(v) => n1(v)} summary={`${x.rotulo}: ${(x.pontos ?? []).map((p) => `${p[0]}: ${p[1]}`).join(', ')}`} />
        ))}
      </div>
      <div className={s.cards}>
        {sr.map((x) => (
          <div key={x.id} className={cn('card', k.pad)}>
            <p className={k.lbl}>{x.rotulo}</p>
            {x.notas && <p className={k.text}>{x.notas}</p>}
            {x.fonte?.url ? <a href={x.fonte.url} target="_blank" rel="noreferrer" className={k.muted}>{(x.fonte.nome ?? 'fonte').slice(0, 120)} <Icon name="external" size={11} /></a> : x.origem ? <p className={k.muted}>{x.origem}</p> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function Comparecimento({ d }: { d: Eleitorado }) {
  const { get, update } = useUrlState()
  const c = (d.comparecimento_por_instrucao ?? {}) as Record<string, { turnos?: Record<string, Turno> } | null | string>
  const anos = ['2022', '2024'].filter((a) => typeof c[a] === 'object' && c[a])
  const ano = anos.includes(get('ano') ?? '') ? (get('ano') as string) : (anos[0] ?? '2022')
  const turno = get('turno') === '2' ? '2' : '1'
  const t = ((c[ano] as { turnos?: Record<string, Turno> } | null)?.turnos?.[turno]) as Turno | undefined
  const gr = t?.por_grupo_instrucao ?? {}
  const ordem = ['analfabeto', 'le_escreve', 'fundamental', 'medio', 'superior']
  const etario = t?.por_grupo_etario_x_instrucao ?? {}
  const faixas = Object.keys(etario)
  return (
    <div className={k.stack}>
      <InlineNote id="va-facult" tone="info" dismissible={false} title="Por que não é “abstenção” simples.">
        {typeof c.ressalva === 'string' ? c.ressalva : 'O voto do analfabeto é facultativo.'}
      </InlineNote>
      <div className={k.filters}>
        <label className={s.sel}>Eleição<Select value={ano} onChange={(e) => update({ ano: e.target.value === anos[0] ? null : e.target.value })}>{anos.map((a) => <option key={a} value={a}>{a}{a === '2024' ? ' (municipal)' : ''}</option>)}</Select></label>
        <label className={s.sel}>Turno<Select value={turno} onChange={(e) => update({ turno: e.target.value === '1' ? null : e.target.value })}><option value="1">1º turno</option><option value="2">2º turno</option></Select></label>
      </div>
      {t?.total && <p className={k.muted}>{fInt(t.total.aptos)} aptos · {n1(t.total.pct_comparecimento)}% compareceram · {fInt(t.total.aptos_facultativo)} com voto facultativo ({n1(((t.total.aptos_facultativo ?? 0) / (t.total.aptos ?? 1)) * 100)}%)</p>}
      <div className={s.charts}>
        <YearBars title="Comparecimento por instrução" subtitle={`${ano}, ${turno}º turno, todas as idades`} categories={ordem.filter((g) => gr[g]).map((g) => GRUPOS[g] ?? g)} series={[{ label: '% de comparecimento', values: ordem.filter((g) => gr[g]).map((g) => gr[g]?.pct_comparecimento ?? null) }]} fmt={(v) => `${n1(v)}%`} summary={`Comparecimento por instrução: ${ordem.filter((g) => gr[g]).map((g) => `${GRUPOS[g]} ${gr[g]?.pct_comparecimento}%`).join(', ')}`} />
        <div className={cn('card', k.pad)}>
          <p className={k.lbl}>Mesma faixa etária: comparar com cuidado</p>
          <p className={k.text}>O comparecimento dos analfabetos é puxado para baixo porque eles são mais idosos (voto facultativo a partir dos 70) e porque o cadastro tem inscritos mortos ou mudados. A tabela abaixo compara dentro de cada faixa etária.</p>
        </div>
      </div>
      {faixas.length > 0 && (
        <div className={k.tableWrap}>
          <table className={k.table}>
            <caption className="sr-only">Comparecimento por faixa etária e instrução, em %</caption>
            <thead><tr><th>Faixa etária</th>{ordem.map((g) => <th key={g} className={k.n}>{GRUPOS[g]}</th>)}</tr></thead>
            <tbody>
              {faixas.map((f) => (
                <tr key={f}><th scope="row">{f}</th>{ordem.map((g) => { const v = etario[f]?.[g]; return <td key={g} className={k.n} title={v ? `${fInt(v.aptos)} aptos` : ''}>{v?.pct_comparecimento != null && (v.aptos ?? 0) >= 500 ? `${n1(v.pct_comparecimento)}%` : '—'}</td> })}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={k.muted}>Células com menos de 500 aptos aparecem como “—”: o percentual seria ruído.</p>
    </div>
  )
}

function Cruzamentos({ d }: { d: Eleitorado }) {
  const { get, update } = useUrlState()
  const cz = d.cruzamentos
  const ids = Object.keys(cz?.resultados ?? {})
  const id = ids.includes(get('pleito') ?? '') ? (get('pleito') as string) : (ids[0] ?? '')
  const r = cz?.resultados?.[id]
  const rows: { nome: string; k: 'voto_13' | 'voto_22' | 'comparecimento_pct' }[] = [{ nome: 'Voto no 13', k: 'voto_13' }, { nome: 'Voto no 22', k: 'voto_22' }, { nome: 'Comparecimento', k: 'comparecimento_pct' }]
  return (
    <div className={k.stack}>
      <InlineNote id="va-eco" tone="warn" dismissible={false} title="Falácia ecológica: o que isto não diz.">
        Os coeficientes comparam municípios (a % de eleitores analfabetos do município contra a % de votos), dentro de cada UF. Não dizem como o analfabeto vota: analfabetismo é correlato de renda, região, cor/raça e idade, e o modelo não separa causa de associação. Votantes individuais não são observados.
      </InlineNote>
      {cz?.metodo && <p className={k.muted}>Método: {cz.metodo}</p>}
      <div className={k.filters}>
        <label className={s.sel}>Pleito<Select value={id} onChange={(e) => update({ pleito: e.target.value === ids[0] ? null : e.target.value })}>{ids.map((i) => <option key={i} value={i}>{i.replace('pres_', 'Presidente ').replace('_t', ', ')}º turno{cz?.resultados?.[i]?.status_da_apuracao && cz.resultados[i]?.status_da_apuracao !== 'oficial' ? ' · preliminar' : ''}</option>)}</Select></label>
      </div>
      {r && (
        <>
          <p className={k.muted}>Perfil de {r.ano_do_perfil} · apuração {r.status_da_apuracao ?? 'n/d'} · correlação entre os regressores: {n1(r.correlacao_entre_regressores as number | undefined)}</p>
          <div className={k.tableWrap}>
            <table className={k.table}>
              <caption className="sr-only">Associação entre % de analfabetos do município e o resultado, dentro da UF</caption>
              <thead><tr><th>Resultado</th><th className={k.n}>Pearson</th><th className={k.n}>β bivariado (pp por pp)</th><th className={k.n}>IC95 (UFs)</th><th className={k.n}>β com controles</th><th className={k.n}>IC95 (UFs)</th><th className={k.n}>R² intra-UF</th></tr></thead>
              <tbody>
                {rows.map((x) => {
                  const m = r[x.k]
                  const b = m?.bivariado_intra_uf?.pct_analfabeto
                  const mv = m?.multivariado_intra_uf?.pct_analfabeto
                  return (
                    <tr key={x.k}>
                      <th scope="row">{x.nome}</th>
                      <td className={k.n}>{n1(r.correlacao_simples_pearson?.[x.k])}</td>
                      <td className={k.n}>{n1(b?.beta_pp_por_pp)}</td>
                      <td className={k.n}>{b?.ic95_ufs ? `${n1(b.ic95_ufs[0])} a ${n1(b.ic95_ufs[1])}` : '—'}</td>
                      <td className={k.n}>{n1(mv?.beta_pp_por_pp)}</td>
                      <td className={k.n}>{mv?.ic95_ufs ? `${n1(mv.ic95_ufs[0])} a ${n1(mv.ic95_ufs[1])}` : '—'}</td>
                      <td className={k.n}>{m?.multivariado_intra_uf?.r2_intra_uf != null ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(m.multivariado_intra_uf.r2_intra_uf) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className={k.muted}>Controles: % de pretos e pardos e % de indígenas no município. Leitura: mesmo mantendo isso constante, a associação permanece, mas continua sendo entre municípios.</p>
        </>
      )}
      {(cz?.ressalvas?.length ?? 0) > 0 && <details className={s.det}><summary>Ressalvas ({cz?.ressalvas?.length})</summary><ul className={k.list}>{cz?.ressalvas?.map((x) => <li key={x}>{x}</li>)}</ul></details>}
      <p className={k.muted}>Veja a camada <Link to="/mapa?m=analfabetos">Eleitores analfabetos (%)</Link> no mapa.</p>
    </div>
  )
}

function Futuro({ d }: { d: Eleitorado }) {
  const p = d.projecao_2038
  const obs = d.serie_eleitorado_por_instrucao_nacional_sem_exterior ?? {}
  const fx = p?.faixa?.nacional_por_ano ?? {}
  const rs = p?.validacao_retrospectiva?.resumo_analfabetos
  const dec = p?.decomposicao_2026_2038
  const pts: BandPoint[] = useMemo(() => {
    const a: BandPoint[] = Object.keys(obs).sort().map((y) => ({ x: Number(y), obs: obs[y]?.por_grupo?.analfabeto ?? null }))
    const last = a[a.length - 1]
    if (last?.obs != null) { last.p50 = last.obs; last.sim = [last.obs, last.obs]; last.cal = [last.obs, last.obs] }
    for (const y of Object.keys(fx).sort()) {
      const v = fx[y]
      a.push({ x: Number(y), p50: v?.analfabetos?.p50 ?? null, sim: v?.analfabetos ? [v.analfabetos.p10 as number, v.analfabetos.p90 as number] : null, cal: (v?.analfabetos_faixa_calibrada_p10_p90 as [number, number] | undefined) ?? null })
    }
    return a
  }, [obs, fx])
  const sim2038 = fx['2038']?.analfabetos
  const cal2038 = fx['2038']?.analfabetos_faixa_calibrada_p10_p90
  return (
    <div className={k.stack}>
      <InlineNote id="va-proj" tone="warn" dismissible={false} title="Projeção não é previsão.">
        {rs ? `Na validação retrospectiva (${rs.n_previsoes} previsões), o modelo errou em média ${n1(rs.erro_absoluto_medio_modelo_pct)}% (repetir o último valor: ${n1(rs.erro_absoluto_medio_ultimo_valor_pct)}%; extrapolar linear: ${n1(rs.erro_absoluto_medio_linear_pct)}%) e a faixa simulada estreita cobriu só ${rs.cobertura_faixa_p10_p90 != null ? Math.round(rs.cobertura_faixa_p10_p90 * 100) : '—'}% dos casos reais: ela é estreita demais. Leia a faixa calibrada (mais larga), que soma o erro da validação.` : 'A faixa simulada estreita subestima a incerteza; leia a calibrada.'}
      </InlineNote>
      <BandChart
        title="Eleitores analfabetos no cadastro: observado e projeção até 2038"
        subtitle="Cadastro do TSE sem exterior; o aumento da idade média do eleitorado e a baixa entrada de novos analfabetos puxam a queda"
        points={pts}
        fmt={mi}
        unit="eleitores"
        summary={`Eleitores analfabetos: observado ${Object.keys(obs).sort().map((y) => `${y}: ${mi(obs[y]?.por_grupo?.analfabeto ?? 0)}`).join(', ')}. Projeção central 2038: ${sim2038?.p50 != null ? mi(sim2038.p50) : 'n/d'}; faixa calibrada ${cal2038 ? `${mi(cal2038[0] ?? 0)} a ${mi(cal2038[1] ?? 0)}` : 'n/d'}.`}
      />
      <div className={k.stats}>
        <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>2038, central</p><p className={s.big}>{sim2038?.p50 != null ? mi(sim2038.p50) : '—'}</p><p className={k.muted}>analfabetos no cadastro</p></div>
        <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>2038, faixa calibrada</p><p className={s.big}>{cal2038 ? `${mi(cal2038[0] ?? 0)} a ${mi(cal2038[1] ?? 0)}` : '—'}</p><p className={k.muted}>simulada estreita: {sim2038 ? `${mi(sim2038.p10 ?? 0)} a ${mi(sim2038.p90 ?? 0)}` : '—'}</p></div>
        {dec && <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Dos analfabetos de 2026…</p><p className={s.big}>{n1(dec.pct_de_2026_ainda_inscrito_2038)}%</p><p className={k.muted}>ainda estarão inscritos em 2038; só {n1(dec.pct_do_estoque_2038_que_vem_de_entrantes)}% do estoque de 2038 vem de novos entrantes</p></div>}
      </div>
      {(p?.suposicoes?.length ?? 0) > 0 && <details className={s.det}><summary>Suposições do modelo ({p?.suposicoes?.length})</summary><ul className={k.list}>{p?.suposicoes?.map((x) => <li key={x}>{x}</li>)}</ul></details>}
      {p?.longo_prazo?.aviso && <InlineNote id="va-longo" tone="warn" dismissible={false} title="Além de 2038.">{p.longo_prazo.aviso}</InlineNote>}
      {p?.faixa?.descricao && <p className={k.muted}>{p.faixa.descricao}</p>}
    </div>
  )
}

function Teorias({ d }: { d: Eleitorado }) {
  return (
    <div className={s.cards}>
      {(d.teorias ?? []).map((t) => (
        <article key={t.id} id={t.id} className={cn('card', k.pad)}>
          <header className={k.head}><div><h3 className={k.title}>{t.autor}</h3><p className={k.sub}>{t.ano ?? 'ano n/d'}</p></div></header>
          <div><p className={k.lbl}>Ideia</p><p className={k.text}>{t.ideia}</p></div>
          <div><p className={k.lbl}>Aplicação ao Brasil (hipótese)</p><p className={k.text}>{t.aplicacao_brasil}</p></div>
          <FontesLidas fs={t.fontes} />
        </article>
      ))}
    </div>
  )
}

function Content({ d }: { d: Eleitorado }) {
  const { get, update } = useUrlState()
  const aba: Aba = ABAS.find((a) => a === get('aba')) ?? 'sufragio'
  const foco = get('i')
  useScrollToId(foco, aba)
  const v = d.validacao
  const div = v?.divergencias_nao_reproduzidas ?? []
  return (
    <div className={k.stack}>
      <div className={s.fixed}>
        <InlineNote id="va-regra" tone="info" baseId="voto-analfabeto" dismissible={false} title="Hoje o voto do analfabeto é facultativo.">
          Desde a EC 25/1985 o analfabeto vota; o voto continua facultativo (CF art. 14, §1º, II, a). “Analfabeto” no cadastro é o grau de instrução declarado ao se inscrever, não um teste de leitura. Interesses e leituras rivais aparecem como hipóteses, com a leitura contrária ao lado.
        </InlineNote>
        {d.meta?.aviso && <InlineNote id="va-aviso" tone="warn" dismissible={false} title="Fontes e limites.">{d.meta.aviso}</InlineNote>}
      </div>
      <Tabs<Aba>
        label="Seções do voto do analfabeto"
        value={aba}
        onChange={(a) => update({ aba: a === 'sufragio' ? null : a, i: null })}
        tabs={[
          { key: 'sufragio', label: 'História do sufrágio', count: d.historia.length },
          { key: 'serie', label: 'Séries' },
          { key: 'comparecimento', label: 'Comparecimento' },
          { key: 'cruzamentos', label: 'Cruzamentos' },
          { key: 'futuro', label: 'Até 2038' },
          { key: 'teorias', label: 'Teorias', count: d.teorias?.length ?? 0 },
        ]}
      >
        {aba === 'sufragio' && <Sufragio d={d} foco={foco} />}
        {aba === 'serie' && <Serie d={d} />}
        {aba === 'comparecimento' && <Comparecimento d={d} />}
        {aba === 'cruzamentos' && <Cruzamentos d={d} />}
        {aba === 'futuro' && <Futuro d={d} />}
        {aba === 'teorias' && <Teorias d={d} />}
      </Tabs>
      {(d.limites?.length ?? 0) + (d.meta?.lacunas?.length ?? 0) + div.length > 0 && (
        <details className={s.det}>
          <summary>Lacunas, limites e divergências ({(d.limites?.length ?? 0) + (d.meta?.lacunas?.length ?? 0) + div.length})</summary>
          {(d.meta?.lacunas?.length ?? 0) > 0 && <><p className={k.lbl}>Lacunas</p><ul className={k.list}>{d.meta?.lacunas?.map((x) => <li key={x}>{x}</li>)}</ul></>}
          {(d.limites?.length ?? 0) > 0 && <><p className={k.lbl}>Limites</p><ul className={k.list}>{d.limites?.map((x) => <li key={x}>{x}</li>)}</ul></>}
          {div.length > 0 && <><p className={k.lbl}>Divergências não reproduzidas</p><ul className={k.list}>{div.map((x) => <li key={x}>{x}</li>)}</ul></>}
          {(v?.totais_vs_publicados?.length ?? 0) > 0 && (
            <div className={k.tableWrap}>
              <table className={k.table}>
                <caption className="sr-only">Totais calculados contra os publicados</caption>
                <thead><tr><th>Ano</th><th>Campo</th><th className={k.n}>Publicado</th><th className={k.n}>Calculado</th><th className={k.n}>Diferença</th></tr></thead>
                <tbody>{v?.totais_vs_publicados?.map((x, i) => <tr key={i} className={cn(x.dif != null && x.dif !== 0 && k.hi)}><td>{x.ano}</td><td>{x.campo}</td><td className={k.n}>{fInt(x.publicado)}</td><td className={k.n}>{fInt(x.calculado)}</td><td className={k.n}>{x.dif == null ? '—' : x.dif}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </details>
      )}
      <p className={k.muted}><Badge>fonte</Badge> Dados do TSE (perfil do eleitorado e comparecimento), IBGE e Ipeadata; hashes na aba de bases.</p>
    </div>
  )
}

export default function VotoAnalfabetoPage() {
  const q = useEleitorado()
  return (
    <PageTemplate>
      <SectionHeader level={1} title="O voto do analfabeto" description="Da exclusão pela renda e pela Lei Saraiva à EC 25/1985: quem votava, quem ganhou e quem perdeu em cada regra; quantos eleitores analfabetos existem hoje, como comparecem, o que os cruzamentos municipais mostram (e não mostram) e a projeção até 2038 com a incerteza à vista." />
      <PageGate query={q} file="eleitorado_analfabeto.json">{(d) => <Content d={d} />}</PageGate>
    </PageTemplate>
  )
}

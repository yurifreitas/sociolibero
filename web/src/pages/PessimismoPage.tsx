import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { BasisSeal } from '@/components/molecules/BasisSeal'
import { InlineNote } from '@/components/molecules/InlineNote'
import { PageGate } from '@/components/molecules/PageGate'
import { Seal } from '@/components/molecules/Seal'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { SegmentedControl } from '@/components/molecules/SegmentedControl'
import { StatTile } from '@/components/molecules/StatTile'
import { Tabs } from '@/components/molecules/Tabs'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useDecisoes } from '@/features/data/hooks'
import { useMarx } from '@/features/marx/hooks'
import { useViolencia } from '@/features/violencia/hooks'
import { usePessimismo, useVisoes } from '@/features/pessimismo/hooks'
import type { Pessimismo, Visoes } from '@/features/pessimismo/schemas'
import { brl, brlRange, isHttp, tipoBasis } from '@/features/risco/model'
import { cn } from '@/lib/cn'
import { useUrlState } from '@/lib/useUrlState'
import k from './know.module.css'
import styles from './PessimismoPage.module.css'

type Aba = 'estresse' | 'visoes'
const n1 = (x: number | null | undefined, d = 1) => (x == null || Number.isNaN(x) ? '—' : x.toFixed(d).replace('.', ',').replace('-', '−'))
const pc = (x: number | null | undefined) => (x == null ? '—' : `${Math.round(x * 100)}%`)
const CHOQUE: Record<string, string> = {
  execucao_ineficiente: 'Má execução',
  vazamento: 'Vazamento e corrupção',
  clima: 'Clima severo',
  tecnologia: 'Sem ganho tecnológico',
  institucional: 'Risco institucional',
  credibilidade: 'Perda de credibilidade fiscal',
}
const choqueLabel = (c: string) => CHOQUE[c] ?? c.replace(/_/g, ' ')
const SC: Record<string, string> = { lula: 'Lula', pragmatico: 'Pragmático', hegemonia: 'Hegemonia', extremo: 'Extremo' }

function Src({ fonte, url }: { fonte?: string | null; url?: string | null }) {
  if (!fonte && !url) return null
  return isHttp(url) ? <a href={url} target="_blank" rel="noreferrer">{fonte ?? url}</a> : <span>{fonte}</span>
}

/* ----------------------------- ESTRESSE ----------------------------- */

function Efficiency({ d, rotulos }: { d: Pessimismo['eficiencia_de_execucao']; rotulos: Map<string, string> }) {
  const levels = Object.keys(d.varredura[0]?.melhora_divida_2035_pp ?? {}).sort((a, b) => Number(b) - Number(a))
  const [lv, setLv] = useState(d.eficiencia_central_pessimista != null ? String(d.eficiencia_central_pessimista.toFixed(1)) : (levels[0] ?? '1.0'))
  const level = levels.includes(lv) ? lv : (levels[0] ?? '1.0')
  const all = d.varredura.flatMap((x) => Object.values(x.melhora_divida_2035_pp))
  const max = Math.max(1, ...all.map((v) => Math.abs(v)))
  const rows = [...d.varredura].sort((a, b) => (b.melhora_divida_2035_pp[level] ?? 0) - (a.melhora_divida_2035_pp[level] ?? 0))
  const faixa = d.faixa_proxies
  return (
    <section aria-labelledby="ps-ef" className={styles.section}>
      <header>
        <h3 id="ps-ef" className={styles.h3}>Incompetência como taxa: e se executarmos só {Math.round(Number(level) * 100)}% do que as decisões prometem?</h3>
        <p className={k.text}>A “eficiência de execução” multiplica só os <strong>benefícios</strong> de cada decisão; os custos ficam inteiros. A taxa <strong>não é medida</strong>: é uma suposição ancorada em proxies (obras federais paralisadas, execução de emendas).</p>
      </header>
      <div className={styles.slider}>
        <label htmlFor="ps-eff">Eficiência de execução: <strong>{Math.round(Number(level) * 100)}%</strong>{faixa && <span> (proxies do repositório: {Math.round((faixa[0] ?? 0) * 100)}% a {Math.round((faixa[1] ?? 0) * 100)}%; central pessimista {d.eficiencia_central_pessimista != null ? Math.round(d.eficiencia_central_pessimista * 100) : '—'}%)</span>}</label>
        <input id="ps-eff" type="range" min={0} max={levels.length - 1} step={1} value={levels.indexOf(level)} onChange={(e) => setLv(levels[levels.length - 1 - Number(e.target.value)] ?? level)} style={{ direction: 'rtl' }} aria-valuetext={`${Math.round(Number(level) * 100)}%`} />
        <div className={styles.ticks} aria-hidden="true">{levels.slice().reverse().map((l) => <span key={l}>{Math.round(Number(l) * 100)}%</span>)}</div>
      </div>
      <p className={k.muted}>Barras: quanto cada decisão ainda reduz a dívida/PIB em 2035 (direita, melhora) ou aumenta (esquerda, piora), em pontos percentuais do PIB. Escala fixa para ver o movimento.</p>
      <div className={styles.bars} role="list" aria-label={`Efeito de cada decisão na dívida/PIB em 2035 com eficiência de ${Math.round(Number(level) * 100)}%`}>
        {rows.map((r) => {
          const v = r.melhora_divida_2035_pp[level] ?? 0
          return (
            <div key={r.id} role="listitem" className={styles.barRow}>
              <Link to={`/decisoes?sel=${r.id}`} className={styles.barName}>{rotulos.get(r.id) ?? r.rotulo}</Link>
              <div className={styles.barTrack} aria-hidden="true">
                <i className={styles.axis} />
                <b className={cn(styles.fill, v < 0 ? styles.neg : styles.pos)} style={v < 0 ? { right: '50%', width: `${(Math.abs(v) / max) * 50}%` } : { left: '50%', width: `${(v / max) * 50}%` }} />
              </div>
              <span className={styles.barVal}>{v > 0 ? '+' : ''}{n1(v)} pp</span>
            </div>
          )
        })}
      </div>
      {(d.ranking_fragilidade?.length ?? 0) > 0 && (
        <div>
          <h4 className={styles.h4}>As mais frágeis à má execução (ganho que se perde)</h4>
          <div className={k.tableWrap}>
            <table className={k.table}>
              <caption className="sr-only">Ranking de fragilidade das decisões à má execução.</caption>
              <thead><tr><th>#</th><th>Decisão</th><th className="n">Perde a 60%</th><th className="n">Perde a 40%</th><th className="n">Primário perdido a 40%</th></tr></thead>
              <tbody>
                {d.ranking_fragilidade?.slice(0, 8).map((r) => (
                  <tr key={r.id}>
                    <td className="n">{r.posto}</td>
                    <td>{rotulos.get(r.id) ?? r.rotulo}<p className={styles.small}>{r.classe}</p></td>
                    <td className="n">{n1(r.perda_divida_pp_a_60)} pp</td>
                    <td className="n">{n1(r.perda_divida_pp_a_40)} pp</td>
                    <td className="n">{r.perda_primario_rs_bi_ano_a_40 != null ? `${brl(r.perda_primario_rs_bi_ano_a_40)}/ano` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {(d.robustas?.length ?? 0) > 0 && (
        <p className={styles.limit}>
          <strong>“Robustas” não significa valiosas.</strong> {d.robustas?.map((r) => rotulos.get(r.id) ?? r.rotulo).join('; ')} resistem à má execução principalmente porque têm <em>pouco a perder</em>; {d.sem_beneficio_a_perder?.length ?? 0} decisões do catálogo não têm benefício macro a perder.
        </p>
      )}
      {d.aviso_ancora && <p className={styles.limit}><strong>Âncora da taxa:</strong> {d.aviso_ancora}</p>}
    </section>
  )
}

function Adverse({ d }: { d: Pessimismo['cenario_adverso'] }) {
  const keys = Object.keys(d.resultados)
  const [sc, setSc] = useState(keys[0] ?? 'pragmatico')
  const base = d.baseline[sc]
  const adv = d.resultados[sc]?.adverso
  const anos = ['2030', '2035', '2038'].filter((y) => base?.anos[y] && adv?.anos[y])
  const att = d.atribuicao_por_choque?.[sc]
  const attRows = att ? Object.entries(att).map(([n, v]) => ({ n, v: v.sozinho_delta_divida_2035 ?? 0 })).sort((a, b) => b.v - a.v) : []
  const sumIso = attRows.reduce((a, r) => a + r.v, 0)
  const total = (adv?.anos['2035']?.debt.p50 ?? 0) - (base?.anos['2035']?.debt.p50 ?? 0)
  const maxA = Math.max(1, ...attRows.map((r) => Math.abs(r.v)))
  const pr = d.prob_ruptura?.[sc]
  const cell = (a: { p10?: number | null; p50?: number | null; p90?: number | null } | undefined, broke: boolean) => (
    <td className={cn(broke && styles.broke)}>
      <strong>{n1(a?.p50)}</strong>
      <span className={styles.small}>{n1(a?.p10)}–{n1(a?.p90)}</span>
    </td>
  )
  const rs = d.reverse_stress
  return (
    <section aria-labelledby="ps-adv" className={styles.section}>
      <header>
        <h3 id="ps-adv" className={styles.h3}>Cenário adverso composto</h3>
        <p className={k.text}>Credibilidade fiscal, independência do BC e risco institucional em queda, clima severo, má execução e nenhum ganho tecnológico <em>ao mesmo tempo</em>. É um teste de estresse: mostra o que o modelo diz quando as premissas pessimistas se juntam.</p>
      </header>
      {d.choque_composto && (
        <ul className={k.chips} aria-label="Choques combinados">
          {Object.entries(d.choque_composto).map(([key, v]) => <li key={key}>{key.replace(/_/g, ' ')}: {typeof v === 'boolean' ? (v ? 'sim' : 'não') : String(v).replace('.', ',')}</li>)}
        </ul>
      )}
      <SegmentedControl label="Cenário político de partida" value={sc} onChange={setSc} options={keys.map((x) => ({ value: x, label: SC[x] ?? x }))} />
      <div className={k.tableWrap}>
        <table className={k.table}>
          <caption className="sr-only">Dívida/PIB, Selic e IPCA no cenário base e no adverso, com mediana e intervalo p10–p90.</caption>
          <thead><tr><th>Ano</th><th>Dívida/PIB base</th><th>Dívida/PIB adverso</th><th>Selic base</th><th>Selic adversa</th><th>IPCA adverso</th></tr></thead>
          <tbody>
            {anos.map((y) => {
              const b = base?.anos[y]
              const a = adv?.anos[y]
              return (
                <tr key={y}>
                  <th scope="row">{y}</th>
                  {cell(b?.debt, b?.valido_como_trajetoria === false)}
                  <td className={cn(a?.valido_como_trajetoria === false && styles.broke)}>
                    <strong>{n1(a?.debt.p50)}%</strong>
                    <span className={styles.small}>{n1(a?.debt.p10)}–{n1(a?.debt.p90)}</span>
                    {a?.valido_como_trajetoria === false && <Badge tone="neg">ruptura: não é trajetória</Badge>}
                  </td>
                  {cell(b?.selic, false)}
                  {cell(a?.selic, false)}
                  {cell(a?.ipca, false)}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {pr && (
        <p className={k.text}>
          Probabilidade de ruptura (dívida &gt; 120% do PIB) em algum ano: <strong>{pc(pr.baseline?.qualquer_ano)}</strong> no base, <strong>{pc(pr.adverso?.qualquer_ano)}</strong> no adverso. {d.definicao_ruptura}
        </p>
      )}
      {attRows.length > 0 && (
        <div>
          <h4 className={styles.h4}>O que pesa: efeito de cada choque sozinho na dívida/PIB de 2035 (pp)</h4>
          <div className={styles.bars} role="list">
            {attRows.map((r) => (
              <div key={r.n} role="listitem" className={styles.barRow}>
                <span className={styles.barName}>{r.n}</span>
                <div className={styles.barTrack} aria-hidden="true">
                  <i className={styles.axis} />
                  <b className={cn(styles.fill, r.v < 0 ? styles.pos : styles.neg)} style={r.v < 0 ? { right: '50%', width: `${(Math.abs(r.v) / maxA) * 50}%` } : { left: '50%', width: `${(r.v / maxA) * 50}%` }} />
                </div>
                <span className={styles.barVal}>{r.v > 0 ? '+' : ''}{n1(r.v)} pp</span>
              </div>
            ))}
          </div>
          <p className={styles.limit}>
            Somados isoladamente: {n1(sumIso)} pp. Todos juntos: {n1(total)} pp. {total > sumIso ? 'Há interação: os choques se agravam entre si.' : ''} A independência do BC quase não aparece porque o modelo <strong>não tem câmbio nem dívida indexada</strong>; isso é limite da estrutura, não prova de que seja inofensiva.
          </p>
        </div>
      )}
      {rs && (
        <div className={`card ${k.pad}`}>
          <h4 className={styles.h4}>Reverse stress: o que basta para romper em 2035?</h4>
          <p className={k.text}>
            {rs.algum_choque_unico_rompe ? 'Um único choque, no máximo testado, já rompe.' : 'Nenhum choque isolado rompe.'} Das {rs.combinacoes_avaliadas?.toLocaleString('pt-BR') ?? '—'} combinações testadas, {rs.combinacoes_que_rompem?.toLocaleString('pt-BR') ?? '—'} rompem: o cenário pragmático tem <strong>pouca margem</strong>. Dívida sem choque em 2035: {n1(rs.divida_2035_sem_choque)}%.
          </p>
          {rs.choque_unico_no_maximo && (
            <ul className={k.list}>
              {Object.entries(rs.choque_unico_no_maximo).map(([key, v]) => (
                <li key={key}>{key} no máximo ({String(v.nivel_maximo).replace('.', ',')}): dívida de {n1(v.divida_2035)}% {v.divida_2035 != null && v.divida_2035 > 120 ? '— acima de 120%' : ''}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

function Judicial({ d }: { d: Pessimismo['lideranca_judicial'] }) {
  const dist = d.vagas_capturadas.distribuicao
  const scs = Object.keys(dist)
  const [sc, setSc] = useState(scs.includes('hegemonia') ? 'hegemonia' : (scs[0] ?? ''))
  const dd = dist[sc]
  const sens = d.sensibilidade_mapeamento?.[sc] ?? []
  const efeito = d.contrafactual?.[sc]
  return (
    <section aria-labelledby="ps-jud" className={styles.section}>
      <header>
        <h3 id="ps-jud" className={styles.h3}>Liderança judicial como mecanismo</h3>
        <p className={k.text}>Calcula, com os quóruns e o calendário de aposentadorias, a chance de <em>uma vaga ser ocupada por um indicado de alto conflito</em> e o risco institucional resultante. Os perfis são hipóteses do repositório sobre indicados futuros, não sobre pessoas reais.</p>
      </header>
      <InlineNote id="ps-jud-neutro" tone="info" dismissible={false} title="Neutralidade.">
        Nenhuma pessoa é acusada. “Interesse próprio” é um mecanismo de teoria da decisão judicial, e indicações também podem refletir mérito e escrutínio legítimo do Senado. “Vaga capturada” = indicado aprovado com controvérsia ≥ 0,5; o filtro de {d.quorum_senado ?? 41} votos vale para qualquer lado.
      </InlineNote>
      <p className={k.muted}>
        Vagas que abrem por aposentadoria compulsória: {d.calendario_vagas?.map((v) => v.ano).join(', ') ?? '—'}. {d.aviso}
      </p>
      <SegmentedControl label="Cenário político" value={sc} onChange={setSc} options={scs.map((x) => ({ value: x, label: SC[x] ?? x }))} />
      {dd && (
        <div className={styles.judGrid}>
          <div>
            <h4 className={styles.h4}>Quantas das 3 vagas seriam capturadas</h4>
            <div className={styles.stack} role="img" aria-label={Object.entries(dd.distribuicao_vagas_capturadas).map(([n, p]) => `${n} vaga(s): ${pc(p)}`).join(', ')}>
              {Object.entries(dd.distribuicao_vagas_capturadas).map(([n, p]) => (
                <span key={n} className={styles[`s${n}`]} style={{ width: `${p * 100}%` }}>{p >= 0.07 ? `${n} · ${pc(p)}` : ''}</span>
              ))}
            </div>
            <p className={k.muted}>Chance de pelo menos uma: <strong>{pc(dd.p_pelo_menos_uma)}</strong>. Esperança: {n1(dd.esperanca_vagas_capturadas, 2)} vaga(s).</p>
          </div>
          <div>
            <h4 className={styles.h4}>Chance de o indicado de cada vaga ser aprovado</h4>
            <ul className={k.list}>
              {Object.values(dd.p_aprovacao_indicado ?? {}).map((p, i) => (
                <li key={i}>Vaga que abre em {d.calendario_vagas?.[i]?.ano ?? '—'}: {pc(p)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {d.risco_institucional?.[sc] && (
        <p className={k.text}>
          Risco institucional (0–1) no cenário: base {n1(d.risco_institucional[sc]?.base_do_cenario, 2)}, com a mecânica das vagas {n1(d.risco_institucional[sc]?.p10, 2)} a {n1(d.risco_institucional[sc]?.p90, 2)} (mediana {n1(d.risco_institucional[sc]?.p50, 2)}).
          {efeito?.efeito_do_canal_judicial_divida_2035_pp != null && <> O canal judicial soma <strong>{n1(efeito.efeito_do_canal_judicial_divida_2035_pp)} pp</strong> à dívida de 2035 contra o contrafactual de indicações técnicas.</>}
        </p>
      )}
      {sens.length > 0 && (
        <div className={k.tableWrap}>
          <table className={k.table}>
            <caption className="sr-only">Sensibilidade do efeito judicial à suposição que liga risco institucional ao prêmio.</caption>
            <thead><tr><th>Suposição do prêmio</th><th className="n">Dívida 2035</th><th className="n">Contrafactual técnico</th><th className="n">Diferença</th></tr></thead>
            <tbody>
              {sens.map((s) => (
                <tr key={s.mapeamento}>
                  <td>{s.mapeamento}</td>
                  <td className="n">{n1(s.divida_2035_p50)}%</td>
                  <td className="n">{n1(s.divida_2035_p50_contrafactual)}%</td>
                  <td className="n">{s.divida_2035_p50 != null && s.divida_2035_p50_contrafactual != null ? `+${n1(s.divida_2035_p50 - s.divida_2035_p50_contrafactual)} pp` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.limit}><strong>“Pesa pouco” depende desta suposição:</strong> {d.suposicao_mapeamento} O efeito cresce rápido quando o parâmetro de prêmio institucional dobra.</p>
      {(d.limites_proprios?.length ?? 0) > 0 && <details className={styles.det}><summary>Limites deste módulo ({d.limites_proprios?.length})</summary><ul className={k.list}>{d.limites_proprios?.map((x) => <li key={x}>{x}</li>)}</ul></details>}
    </section>
  )
}

function Sectors({ list }: { list: Pessimismo['fragilidade_setorial'] }) {
  return (
    <section aria-labelledby="ps-set" className={styles.section}>
      <header>
        <h3 id="ps-set" className={styles.h3}>Fragilidade por setor</h3>
        <p className={k.text}>Qual setor é mais exposto a cada choque, a partir das ligações registradas entre decisões, áreas de custo e potências. O mapeamento setor ↔ decisão é <strong>julgamento</strong>.</p>
      </header>
      <InlineNote id="ps-set-null" tone="warn" dismissible={false} title="Sem escore não é robusto.">
        Setor sem ligação registrada fica <strong>sem dado</strong> (não zero): saúde, educação e segurança aparecem assim em vários choques. É falta de dado, não robustez.
      </InlineNote>
      <div className={styles.secGrid}>
        {list.map((f) => {
          const max = Math.max(1, ...Object.values(f.setores).map((s) => s.escore ?? 0))
          return (
            <article key={f.choque} className={`card ${k.pad}`}>
              <h4 className={k.title}>{choqueLabel(f.choque)}</h4>
              <p className={k.muted}>Mais exposto: {f.mais_exposto?.join(', ') ?? '—'}{f.mais_exposto_exceto_fiscal?.length ? ` (fora o fiscal: ${f.mais_exposto_exceto_fiscal.join(', ')})` : ''}{f.empate ? ' · empate' : ''}</p>
              <ul className={styles.sec}>
                {Object.entries(f.setores).map(([s, v]) => (
                  <li key={s} title={v.nota ?? undefined}>
                    <span>{s}</span>
                    {v.escore == null ? <em>sem dado</em> : <b><i style={{ width: `${(v.escore / max) * 100}%` }} /></b>}
                    <span className={styles.small}>{v.escore == null ? '' : n1(v.escore, 2)}</span>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Estresse({ d }: { d: Pessimismo }) {
  const decQ = useDecisoes('decisoes.json')
  const rotulos = useMemo(() => new Map((decQ.data?.decisoes ?? []).map((x) => [x.id, x.rotulo])), [decQ.data])
  return (
    <div className={k.stack}>
      <InlineNote id="ps-aviso" tone="warn" dismissible={false} baseId="pessimismo" title="Cenários de risco, não previsões.">
        {d.meta.aviso_longo ?? d.meta.aviso}
      </InlineNote>
      <div className={k.stats}>
        <StatTile label="Eficiência de execução" value={d.eficiencia_de_execucao.eficiencia_central_pessimista != null ? `${Math.round(d.eficiencia_de_execucao.eficiencia_central_pessimista * 100)}%` : '—'} hint="suposição, ancorada em proxies; não medida" />
        <StatTile label="Combinações que rompem" value={d.cenario_adverso.reverse_stress?.combinacoes_que_rompem != null ? `${d.cenario_adverso.reverse_stress.combinacoes_que_rompem.toLocaleString('pt-BR')}/${d.cenario_adverso.reverse_stress.combinacoes_avaliadas?.toLocaleString('pt-BR')}` : '—'} tone="neg" hint="no cenário pragmático (reverse stress)" />
        <StatTile label="Janela confiável do adverso" value="até ~2033" hint="acima de 120% de dívida é ruptura, não trajetória" />
      </div>
      <Efficiency d={d.eficiencia_de_execucao} rotulos={rotulos} />
      <Adverse d={d.cenario_adverso} />
      <Judicial d={d.lideranca_judicial} />
      <Sectors list={d.fragilidade_setorial} />
      {(d.limites?.length ?? 0) > 0 && (
        <details className={styles.det}>
          <summary>O que o modelo não captura ({d.limites?.length})</summary>
          <ul className={k.list}>{d.limites?.map((x) => <li key={x}>{x}</li>)}</ul>
        </details>
      )}
      {(d.cemiterio?.length ?? 0) > 0 && (
        <details className={styles.det}>
          <summary>Cemitério: o que não funcionou ({d.cemiterio?.length})</summary>
          <ul className={k.list}>{d.cemiterio?.map((c) => <li key={c.tentativa}><strong>{c.tentativa}.</strong> {c.resultado} {c.licao && <em>Lição: {c.licao}</em>}</li>)}</ul>
        </details>
      )}
    </div>
  )
}

/* ----------------------------- VISÕES ----------------------------- */

function Visoes({ v }: { v: Visoes }) {
  const [mec, setMec] = useState(v.captura_judicial.mecanismos[0]?.id ?? '')
  const violQ = useViolencia(true)
  const marxQ = useMarx(true)
  const violIds = useMemo(() => new Set((violQ.data?.pensadores ?? []).map((p) => p.id)), [violQ.data])
  const marxIds = useMemo(() => new Set((marxQ.data?.pensadores ?? []).map((p) => p.id)), [marxQ.data])
  const m = v.captura_judicial.mecanismos.find((x) => x.id === mec)
  return (
    <div className={k.stack}>
      <InlineNote id="vp-aviso" tone="warn" dismissible={false} baseId="visoes-pessimistas" title="Hipóteses fundamentadas, não sentenças.">
        {v.meta.aviso}
      </InlineNote>
      <InlineNote id="vp-nao-somar" tone="info" dismissible={false} title="Não some as linhas.">{v.nao_somar}</InlineNote>

      <section aria-labelledby="vp-dec" className={styles.section}>
        <h3 id="vp-dec" className={styles.h3}>Decisões ruins documentadas ({v.decisoes_ruins.length})</h3>
        <div className={k.grid2}>
          {v.decisoes_ruins.map((x) => (
            <article key={x.id} className={`card ${k.pad}`}>
              <header className={k.head}>
                <div>
                  {x.periodo && <p className={k.lbl}>{x.periodo}</p>}
                  <h4 className={k.title}>{x.titulo}</h4>
                </div>
              </header>
              {x.mecanismo_do_dano && <p className={k.text}>{x.mecanismo_do_dano}</p>}
              <div className={styles.cost}>
                {x.custo?.valor_rs_bi != null ? (
                  <>
                    <strong>{brl(x.custo.valor_rs_bi)}</strong>
                    {x.custo.ano_base && <span className={k.muted}>(base {x.custo.ano_base}, preços correntes)</span>}
                  </>
                ) : (
                  <strong>sem valor localizado</strong>
                )}
                <BasisSeal basis={x.custo?.tipo === 'nao_localizado' ? undefined : tipoBasis(x.custo?.tipo)} verified={x.custo?.verificado ?? false} verifiedLabels={{ yes: 'lido na fonte', no: 'não lido na fonte' }} />
              </div>
              {x.custo?.fonte && <p className={k.muted}>{x.custo.fonte} {isHttp(x.custo.url) && <a href={x.custo.url} target="_blank" rel="noreferrer">link</a>}</p>}
              {(x.custos_adicionais?.length ?? 0) > 0 && <ul className={k.list}>{x.custos_adicionais?.map((c, i) => <li key={i}>{c.descricao}</li>)}</ul>}
              {x.quem_pagou && <p className={k.text}><strong>Quem pagou:</strong> {x.quem_pagou}</p>}
              {(x.setores_afetados?.length ?? 0) > 0 && <ul className={k.chips}>{x.setores_afetados?.map((s) => <li key={s}>{s}</li>)}</ul>}
              {x.controversia && <p className={styles.limit}><strong>Controvérsia:</strong> {x.controversia}</p>}
              {(x.decisoes_relacionadas?.length ?? 0) > 0 && <ul className={k.links}>{x.decisoes_relacionadas?.map((id) => <li key={id}><Link to={`/decisoes?sel=${id}`}>decisão: {id}</Link></li>)}</ul>}
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="vp-jud" className={styles.section}>
        <h3 id="vp-jud" className={styles.h3}>Independência e captura judicial: mecanismos, evidência e contraponto</h3>
        <InlineNote id="vp-jud-neutro" tone="info" dismissible={false} title="Neutralidade.">
          Nenhuma pessoa, ministro, partido ou empresa é acusado. “Interesse próprio” de juízes e políticos é tratado como <em>mecanismo</em> da teoria da decisão, com evidência comparada e institucional, e a leitura contrária aparece ao lado de cada um.
        </InlineNote>
        <SegmentedControl label="Mecanismo" value={mec} onChange={setMec} options={v.captura_judicial.mecanismos.map((x) => ({ value: x.id, label: x.nome.length > 34 ? `${x.nome.slice(0, 32)}…` : x.nome }))} />
        {m && (
          <article className={`card ${k.pad}`}>
            <h4 className={k.title}>{m.nome}</h4>
            {m.descricao && <p className={k.text}>{m.descricao}</p>}
            {m.teoria && <p className={k.text}><strong>Teoria:</strong> {m.teoria}</p>}
            <div className={styles.versus}>
              <div>
                <p className={k.lbl}>Evidência comparada</p>
                <ul className={styles.cases}>
                  {m.evidencia_comparada?.map((e, i) => (
                    <li key={i}>
                      <strong>{e.caso}</strong>
                      <p>{e.efeito}</p>
                      <p className={k.muted}><Seal v={e.verificado} labels={{ yes: 'lido na fonte', no: 'não lido na fonte' }} /> <Src fonte={e.fonte} url={e.url} /></p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.contra}>
                <p className={k.lbl}>Leitura contrária</p>
                <p className={k.text}>{m.leitura_contraria ?? 'Sem leitura contrária registrada.'}</p>
              </div>
            </div>
            {(m.indicadores_brasil?.length ?? 0) > 0 && (
              <div>
                <p className={k.lbl}>Indicadores para o Brasil</p>
                <ul className={styles.ind}>
                  {m.indicadores_brasil?.map((i, n) => (
                    <li key={n}><strong>{i.nome}</strong>: {i.valor ?? '—'} {i.ano ? `(${i.ano})` : ''} <Seal v={i.verificado} labels={{ yes: 'lido na fonte', no: 'não lido na fonte' }} /> <Src fonte={i.fonte} url={i.url} /></li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}
        {(v.captura_judicial.historico_brasil?.length ?? 0) > 0 && (
          <details className={styles.det}>
            <summary>Histórico brasileiro como fato ({v.captura_judicial.historico_brasil?.length})</summary>
            <ul className={styles.hist}>{v.captura_judicial.historico_brasil?.map((h, i) => <li key={i}><time>{h.data}</time> {h.fato} <Seal v={h.verificado} labels={{ yes: 'lido na fonte', no: 'não lido na fonte' }} /></li>)}</ul>
          </details>
        )}
        {(v.captura_judicial.custo_economico?.length ?? 0) > 0 && (
          <details className={styles.det}>
            <summary>Custo econômico associado à insegurança jurídica ({v.captura_judicial.custo_economico?.length})</summary>
            <ul className={styles.hist}>{v.captura_judicial.custo_economico?.map((c, i) => <li key={i}>{c.descricao}: <strong>{c.valor ?? '—'}</strong> <Seal v={c.verificado} labels={{ yes: 'lido na fonte', no: 'não lido na fonte' }} />{c.ressalva && <em className={k.muted}> {c.ressalva}</em>}</li>)}</ul>
          </details>
        )}
      </section>

      <section aria-labelledby="vp-cap" className={styles.section}>
        <h3 id="vp-cap" className={styles.h3}>Capacidade estatal: proxies, não uma “taxa de incompetência”</h3>
        <p className={k.text}>Não existe medida direta de incompetência. Estes proxies medem partes da capacidade do Estado e cada um diz o que <strong>não</strong> mede.</p>
        <div className={k.tableWrap}>
          <table className={k.table}>
            <caption className="sr-only">Proxies de capacidade estatal no Brasil, com comparação, fonte e o que não medem.</caption>
            <thead><tr><th>Proxy</th><th>Brasil</th><th>Comparação</th><th>O que não mede</th></tr></thead>
            <tbody>
              {v.capacidade_estatal.proxies.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.nome}</strong><p className={styles.small}><Seal v={p.verificado} labels={{ yes: 'lido na fonte', no: 'não lido na fonte' }} /> <Src fonte={p.fonte} url={p.url} /></p></td>
                  <td>{p.valor_brasil ?? '—'}{p.ano ? <span className={styles.small}> ({p.ano})</span> : null}</td>
                  <td>{p.comparacao ?? '—'}</td>
                  <td>{p.o_que_nao_mede ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(v.capacidade_estatal.ineficiencia_por_setor?.length ?? 0) > 0 && (
          <div>
            <h4 className={styles.h4}>Ineficiência estimada por setor</h4>
            <div className={k.grid2}>
              {v.capacidade_estatal.ineficiencia_por_setor?.map((s) => (
                <article key={s.setor} className={`card ${k.pad}`}>
                  <h5 className={k.title}>{s.setor}</h5>
                  <p className={styles.cost}><strong>{s.valor_rs_bi != null ? `${brl(s.valor_rs_bi)}/ano` : 'sem valor'}</strong>{brlRange(s.faixa_rs_bi) && s.faixa_rs_bi && s.faixa_rs_bi[0] !== s.faixa_rs_bi[1] && <span className={k.muted}>faixa {brlRange(s.faixa_rs_bi)}</span>}<BasisSeal basis={tipoBasis(s.tipo)} verified={s.verificado} verifiedLabels={{ yes: 'lido na fonte', no: 'não lido na fonte' }} /></p>
                  {s.metodo && <p className={k.text}>{s.metodo}</p>}
                  {s.controversia && <p className={styles.limit}><strong>Controvérsia:</strong> {s.controversia}</p>}
                  <p className={k.muted}><Src fonte={s.fonte} url={s.url} /></p>
                </article>
              ))}
            </div>
            <p className={styles.limit}>Ineficiência não é desvio: mede quanto se gasta a mais que pares para o mesmo resultado, e a fronteira de eficiência é contestada.</p>
          </div>
        )}
      </section>

      {(v.pre_mortem?.length ?? 0) > 0 && (
        <section aria-labelledby="vp-pm" className={styles.section}>
          <h3 id="vp-pm" className={styles.h3}>Pré-mortem por setor: como falha e que sinais acompanhar</h3>
          <div className={k.grid2}>
            {v.pre_mortem?.map((p) => (
              <article key={p.setor} className={`card ${k.pad}`}>
                <h4 className={k.title}>{p.setor}</h4>
                {p.como_falha && <p className={k.text}>{p.como_falha}</p>}
                {(p.sinais_precoces?.length ?? 0) > 0 && <div><p className={k.lbl}>Sinais precoces</p><ul className={k.list}>{p.sinais_precoces?.map((s) => <li key={s}>{s}</li>)}</ul></div>}
                {(p.dados_abertos?.length ?? 0) > 0 && <div><p className={k.lbl}>Dados abertos que monitoram</p><ul className={k.chips}>{p.dados_abertos?.map((s) => <li key={s}>{s}</li>)}</ul></div>}
                {(p.decisoes_relacionadas?.length ?? 0) > 0 && <ul className={k.links}>{p.decisoes_relacionadas?.map((id) => <li key={id}><Link to={`/decisoes?sel=${id}`}>decisão: {id}</Link></li>)}</ul>}
              </article>
            ))}
          </div>
        </section>
      )}

      {(v.fundamentos?.length ?? 0) > 0 && (
        <section aria-labelledby="vp-fun" className={styles.section}>
          <h3 id="vp-fun" className={styles.h3}>Fundamentos pessimistas, cada um com o seu contraponto</h3>
          <div className={styles.fund}>
            {v.fundamentos?.map((f) => (
              <article key={f.id} className={`card ${k.pad}`}>
                <p className={k.lbl}>{f.autor}{f.ano ? ` · ${f.ano}` : ''}</p>
                <div className={styles.versus}>
                  <div><p className={k.lbl}>A ideia pessimista</p><p className={k.text}>{f.ideia_pessimista}</p></div>
                  <div className={styles.contra}><p className={k.lbl}>Contraponto</p><p className={k.text}>{f.contraponto}</p></div>
                </div>
                {f.aplicacao_brasil && <p className={k.text}><strong>No Brasil:</strong> {f.aplicacao_brasil}</p>}
                {(violIds.has(f.id) || marxIds.has(f.id)) && (
                  <ul className={k.links} aria-label="Mesmo autor em outras páginas">
                    {violIds.has(f.id) && <li><Link to={`/violencia?p=${f.id}`}>em Pensadores da violência</Link></li>}
                    {marxIds.has(f.id) && <li><Link to={`/marx?aba=pensadores&i=${f.id}`}>em Marx e o capitalismo</Link></li>}
                  </ul>
                )}
                {(f.referencias?.length ?? 0) > 0 && <ul className={k.src}>{f.referencias?.map((r, i) => <li key={i}><Seal v={r.verificado} labels={{ yes: 'conferida', no: 'a confirmar' }} />{isHttp(r.url) ? <a href={r.url} target="_blank" rel="noreferrer">{r.titulo}</a> : <span>{r.titulo}</span>}</li>)}</ul>}
              </article>
            ))}
          </div>
        </section>
      )}

      {(v.limites?.length ?? 0) > 0 && <details className={styles.det}><summary>Limites ({v.limites?.length})</summary><ul className={k.list}>{v.limites?.map((x) => <li key={x}>{x}</li>)}</ul></details>}
    </div>
  )
}

export default function PessimismoPage() {
  const { get, update } = useUrlState()
  const aba: Aba = get('aba') === 'visoes' ? 'visoes' : 'estresse'
  const pq = usePessimismo(aba === 'estresse')
  const vq = useVisoes(aba === 'visoes')
  return (
    <PageTemplate>
      <SectionHeader
        level={1}
        title="Visões pessimistas e testes de estresse"
        description="O que acontece se as decisões forem ruins, a execução falhar e as instituições perderem credibilidade. Cenários de risco e hipóteses fundamentadas, com o contraponto de cada uma. Não são previsões."
      />
      <Tabs<Aba>
        label="Seções de visões pessimistas"
        value={aba}
        onChange={(a) => update({ aba: a === 'estresse' ? null : a })}
        tabs={[
          { key: 'estresse', label: 'Testes de estresse' },
          { key: 'visoes', label: 'Visões pessimistas' },
        ]}
      >
        {aba === 'estresse' && <PageGate query={pq} file="pessimismo.json">{(d) => <Estresse d={d} />}</PageGate>}
        {aba === 'visoes' && <PageGate query={vq} file="visoes_pessimistas.json">{(v) => <Visoes v={v} />}</PageGate>}
      </Tabs>
    </PageTemplate>
  )
}

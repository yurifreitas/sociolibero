import { useMemo, useState } from 'react'
import { Badge } from '@/components/atoms/Badge'
import { BasisSeal } from '@/components/molecules/BasisSeal'
import { InlineNote } from '@/components/molecules/InlineNote'
import { SegmentedControl } from '@/components/molecules/SegmentedControl'
import { MarkovRing } from '@/components/organisms/MarkovRing'
import { ProjectionFan } from '@/components/organisms/ProjectionFan'
import { ScenarioChain } from '@/components/organisms/ScenarioChain'
import { TransitionMatrix } from '@/components/organisms/TransitionMatrix'
import { pct, STATE_SHORT } from '@/features/evolucoes/model'
import type { CenariosMacro, Evolucoes } from '@/features/evolucoes/schemas'
import styles from './EvolucoesPanel.module.css'

type Mkey = 'brasil' | 'america_latina' | 'global'
const MLABEL: Record<Mkey, string> = { brasil: 'Brasil (encolhida)', america_latina: 'América Latina', global: 'Mundo' }
const ALVO = 'autocracia (fechada ou eleitoral)'
const ORIGEM = 'democracia eleitoral'

const f1 = (x: number | null | undefined) => (x == null ? '—' : `${(x * 100).toFixed(1).replace('.', ',')}%`)

function EconTable({ title, regime }: { title: string; regime: NonNullable<NonNullable<Evolucoes['regimes_economicos']>['crescimento']> }) {
  const v = regime.validacao_fora_da_amostra ?? {}
  const hs = Object.keys(v).filter((k) => v[k]?.pool).sort()
  const models = ['cadeia', 'climatologia', 'hmm', 'persist_calibrada']
  const names: Record<string, string> = { cadeia: 'Cadeia', climatologia: 'Climatologia', hmm: 'HMM', persist_calibrada: 'Persistência calibrada' }
  if (hs.length === 0) return null
  return (
    <div className={styles.econ}>
      <h4 className={styles.h4}>{title}</h4>
      <div className={styles.scroll}>
        <table className={styles.tbl}>
          <caption className="sr-only">{`Log-loss fora da amostra, ${title} (menor é melhor)`}</caption>
          <thead>
            <tr><th scope="col">Horizonte</th>{models.map((m) => <th key={m} scope="col">{names[m]}</th>)}</tr>
          </thead>
          <tbody>
            {hs.map((h) => {
              const pool = v[h]?.pool ?? {}
              const best = Math.min(...models.map((m) => pool[m]?.logloss ?? Number.POSITIVE_INFINITY))
              return (
                <tr key={h}>
                  <th scope="row">{h.replace('h', '')} ano{h === 'h1' ? '' : 's'}</th>
                  {models.map((m) => {
                    const l = pool[m]?.logloss
                    return <td key={m} className={l != null && l === best ? styles.best : undefined}>{l == null ? '—' : l.toFixed(3).replace('.', ',')}</td>
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export type EvolucoesPanelProps = { ev: Evolucoes; cm: CenariosMacro | null | undefined }

export function EvolucoesPanel({ ev, cm }: EvolucoesPanelProps) {
  const rp = ev.regimes_politicos
  const [mk, setMk] = useState<Mkey>('brasil')
  const [stateName, setStateName] = useState(ORIGEM)
  const estados = rp.estados
  const M = rp.matrizes[mk]
  const dur = estados.map((e) => rp.duracao_esperada?.[mk]?.[e]?.anos ?? null)

  const range5 = useMemo(() => {
    const ps: { nome: string; p: number; ic?: number[] | null }[] = []
    for (const k of ['brasil', 'america_latina', 'global'] as Mkey[]) {
      const x = rp.primeira_passagem.find((r) => r.matriz === k && r.origem === ORIGEM && r.alvo === ALVO && r.h_anos === 5)
      if (x) ps.push({ nome: MLABEL[k], p: x.p, ic: x.ic90 })
    }
    const sm = rp.semi_markov_brasil?.primeira_passagem?.find((r) => r.h === 5 && r.alvo === ALVO)
    if (sm) ps.push({ nome: `Semi-Markov (idade ${rp.semi_markov_brasil?.idade_usada_anos ?? '—'} anos)`, p: sm.p, ic: sm.ic90 })
    return ps
  }, [rp])
  const lo = range5.length ? Math.min(...range5.map((x) => x.p)) : null
  const hi = range5.length ? Math.max(...range5.map((x) => x.p)) : null

  const pass = (k: Mkey | 'semi', h: number) =>
    k === 'semi'
      ? rp.semi_markov_brasil?.primeira_passagem?.find((r) => r.h === h && r.alvo === ALVO)
      : rp.primeira_passagem.find((r) => r.matriz === k && r.origem === ORIGEM && r.alvo === ALVO && r.h_anos === h)
  const passCell = (x: { p: number; ic90?: number[] | null } | undefined) =>
    x ? (
      <td>
        <strong>{f1(x.p)}</strong>
        {x.ic90 && <span className={styles.ic}>IC90 {f1(x.ic90[0])}–{f1(x.ic90[1])}</span>}
      </td>
    ) : (
      <td>—</td>
    )

  const si = Math.max(0, estados.indexOf(stateName))
  const projB = rp.projecao_brasil
  const projS = rp.semi_markov_brasil?.projecao
  const last = projB.anos.length - 1
  const midB = projB.p50?.[last]?.[si]
  const midS = (projS?.p50 ?? projS?.ponto)?.[last]?.[si]

  return (
    <div className={styles.stack}>
      <InlineNote id="evol-aviso" tone="warn" baseId="evolucoes" dismissible={false} title="Cadeia de Markov não é previsão.">
        Extrapola frequências históricas de transição entre regimes. Golpes, guerras e crises globais, as rupturas raras, não estão no modelo, e as faixas abaixo medem só a incerteza dos parâmetros.
      </InlineNote>

      <section className={`card ${styles.hero}`} aria-label="Faixa de risco de erosão em 5 anos">
        <div>
          <p className={styles.lbl}>Democracia eleitoral → autocracia, em 5 anos</p>
          <p className={styles.big}>{lo != null && hi != null ? `${Math.round(lo * 100)}% a ${Math.round(hi * 100)}%` : '—'}</p>
          <p className={styles.text}>
            Faixa entre {range5.length} modelos que discordam; <strong>nenhum é “a resposta”</strong>. Quanto mais o modelo leva em conta que a democracia brasileira já dura décadas, menor o risco, mas o semi-Markov, que deixa o risco variar com a idade do regime, dá o maior valor.
          </p>
        </div>
        <ul className={styles.range}>
          {range5.map((r) => (
            <li key={r.nome}>
              <span>{r.nome}</span>
              <strong>{f1(r.p)}</strong>
              {r.ic && <em>IC90 {f1(r.ic[0])}–{f1(r.ic[1])}</em>}
            </li>
          ))}
        </ul>
        <p className={styles.lbl}>
          Estado atual do Brasil na fonte: {rp.projecao_brasil.estado_inicial?.rotulo ?? '—'} em {rp.projecao_brasil.estado_inicial?.ano ?? '—'}, desde {rp.projecao_brasil.estado_inicial?.no_estado_desde ?? '—'}. A fonte ainda não tem 2026.
        </p>
      </section>

      <section aria-labelledby="ev-ring" className={styles.section}>
        <header className={styles.shead}>
          <div>
            <h3 id="ev-ring" className={styles.h3}>Os estados e a probabilidade anual de trocar</h3>
            <p className={styles.sub}>4 regimes (Regimes of the World / V-Dem v16). Três matrizes estimadas, com encolhimento hierárquico Brasil → América Latina → mundo.</p>
          </div>
          <div className={styles.badges}>
            <BasisSeal basis="modeled" verified />
            <Badge>{M.n_transicoes != null ? `${new Intl.NumberFormat('pt-BR').format(M.n_transicoes)} transições` : ''}</Badge>
          </div>
        </header>
        <SegmentedControl<Mkey> label="Matriz de transição" value={mk} onChange={setMk} options={(Object.keys(MLABEL) as Mkey[]).map((k) => ({ value: k, label: MLABEL[k] }))} />
        <div className={styles.ringGrid}>
          <MarkovRing estados={estados} P={M.P} duracao={dur} ariaLabel={`Diagrama em anel dos quatro regimes políticos com as probabilidades anuais de transição, matriz ${MLABEL[mk]}`} />
          <div className={styles.side}>
            <TransitionMatrix estados={estados} P={M.P} lo={M.ic90?.lo} hi={M.ic90?.hi} caption={`Matriz de transição anual, ${MLABEL[mk]}`} />
            <p className={styles.small}>{M.prior}{M.kappa_encolhimento != null ? ` · força do encolhimento κ=${M.kappa_encolhimento}` : ''}{M.periodo ? ` · ${M.periodo[0]}–${M.periodo[1]}` : ''}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="ev-pass" className={styles.section}>
        <h3 id="ev-pass" className={styles.h3}>Primeira passagem para autocracia, a partir de democracia eleitoral</h3>
        <div className={styles.scroll}>
          <table className={styles.tbl}>
            <caption className="sr-only">Probabilidade de a democracia eleitoral passar a autocracia (fechada ou eleitoral) em 5, 10 e 12 anos, por modelo, com intervalo de credibilidade de 90%.</caption>
            <thead>
              <tr><th scope="col">Horizonte</th><th scope="col">Brasil (encolhida)</th><th scope="col">América Latina</th><th scope="col">Mundo</th><th scope="col">Semi-Markov (global, idade {rp.semi_markov_brasil?.idade_usada_anos ?? '—'})</th></tr>
            </thead>
            <tbody>
              {[5, 10, 12].map((h) => (
                <tr key={h}>
                  <th scope="row">{h} anos</th>
                  {passCell(pass('brasil', h))}
                  {passCell(pass('america_latina', h))}
                  {passCell(pass('global', h))}
                  {passCell(pass('semi', h))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="ev-fan" className={styles.section}>
        <header className={styles.shead}>
          <div>
            <h3 id="ev-fan" className={styles.h3}>Projeção do Brasil, 2027–2038: dois modelos lado a lado</h3>
            <p className={styles.sub}>{projB.o_que_mostram_p10_p90 ?? 'Faixa p10–p90 = incerteza dos parâmetros, não de choques.'}</p>
          </div>
        </header>
        <SegmentedControl label="Estado exibido" value={stateName} onChange={setStateName} options={estados.map((e) => ({ value: e, label: STATE_SHORT[e] ?? e }))} />
        <div className={styles.fans}>
          <ProjectionFan fan={projB} state={si} stateLabel={stateName} title="Markov, matriz do Brasil" subtitle="risco constante ao longo do tempo no regime" color="var(--brand)" />
          {projS && <ProjectionFan fan={projS} state={si} stateLabel={stateName} title="Semi-Markov, matriz global" subtitle="risco de sair depende da idade do regime" color="var(--st-parcial)" />}
        </div>
        {midB != null && midS != null && (
          <p className={styles.text}>
            Em {projB.anos[last]}, a probabilidade de {STATE_SHORT[stateName]?.toLowerCase()} é {pct(midB)} no Markov e {pct(midS)} no semi-Markov. <strong>Os dois discordam e não escolhemos um:</strong> a diferença mostra o quanto a conclusão depende de assumir que o risco não muda com a idade do regime.
          </p>
        )}
      </section>

      {ev.regimes_economicos && (ev.regimes_economicos.crescimento || ev.regimes_economicos.inflacao) && (
        <section aria-labelledby="ev-econ" className={`card ${styles.econCard}`}>
          <header className={styles.shead}>
            <div>
              <h3 id="ev-econ" className={styles.h3}>Regimes econômicos: o modelo NÃO bate a baseline</h3>
              <p className={styles.sub}>Cadeias de regime de crescimento e de inflação, testadas fora da amostra.</p>
            </div>
            <Badge tone="warn">resultado nulo</Badge>
          </header>
          <p className={styles.text}>
            No crescimento, a cadeia empata ou perde para a <strong>climatologia</strong> (a distribuição histórica sem estado), e o critério BIC escolhe um único estado para o HMM. Na inflação, a <strong>persistência calibrada</strong> vence a cadeia em 3 e 5 anos. As projeções para 2027–2038 praticamente reproduzem a distribuição histórica incondicional: <strong>aqui o modelo não tem poder de previsão</strong>. Em negrito, o menor log-loss (melhor).
          </p>
          <div className={styles.econGrid}>
            {ev.regimes_economicos.crescimento && <EconTable title="Regimes de crescimento do PIB" regime={ev.regimes_economicos.crescimento} />}
            {ev.regimes_economicos.inflacao && <EconTable title="Regimes de inflação (IGP-DI)" regime={ev.regimes_economicos.inflacao} />}
          </div>
        </section>
      )}

      <section aria-label="Cadeia de cenários" className={`card ${styles.chainCard}`}>
        <ScenarioChain ev={ev} cm={cm} />
      </section>

      {(ev.cemiterio?.length ?? 0) > 0 && (
        <section aria-labelledby="ev-cem" className={styles.section}>
          <h3 id="ev-cem" className={styles.h3}>O que o pressuposto markoviano falha em explicar ({ev.cemiterio?.length} tentativas e achados)</h3>
          <p className={styles.sub}>O “cemitério”: hipóteses testadas que foram rejeitadas ou limitadas. Registrar o que falhou evita repropor o que já foi falsificado.</p>
          <ul className={styles.cem}>
            {ev.cemiterio?.map((c, i) => (
              <li key={i}>
                <details>
                  <summary>{c.tentativa}</summary>
                  <p>{c.resultado}</p>
                  {c.licao && <p className={styles.lesson}><strong>Lição:</strong> {c.licao}</p>}
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(ev.limites?.length ?? 0) > 0 && (
        <section aria-labelledby="ev-lim" className={styles.section}>
          <h3 id="ev-lim" className={styles.h3}>Limites</h3>
          <ul className={styles.limits}>{ev.limites?.map((l) => <li key={l}>{l}</li>)}</ul>
        </section>
      )}

      {(ev.meta?.fontes?.length ?? 0) > 0 && (
        <p className={styles.small}>
          Fonte dos regimes: {ev.meta?.fontes?.map((s) => s.nome).join('; ')}. {ev.meta?.fontes?.[0]?.licenca ? `Licença: ${ev.meta.fontes[0].licenca}.` : ''}
        </p>
      )}
    </div>
  )
}

import { useMemo } from 'react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { EmptyState } from '@/components/molecules/EmptyState'
import { ErrorState } from '@/components/molecules/ErrorState'
import { Notice } from '@/components/molecules/Notice'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { SegmentedControl } from '@/components/molecules/SegmentedControl'
import { StatTile } from '@/components/molecules/StatTile'
import { DataStatusBanner } from '@/components/organisms/DataStatusBanner'
import { DecisionDetail } from '@/components/organisms/DecisionDetail'
import { DecisionFilters } from '@/components/organisms/DecisionFilters'
import { DecisionScatter } from '@/components/organisms/DecisionScatter'
import { ExposureHighlights } from '@/components/organisms/ExposureHighlights'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useDecisoes, useExposicao, useGeo, useIndex } from '@/features/data/hooks'
import { namesFromGeo } from '@/features/data/names'
import { DOMINIOS, type SetorKey } from '@/features/data/schemas'
import {
  goodness,
  guessSetor,
  IMPACTS,
  impactDef,
  INSTRUMENTO_LABEL,
  quadrant,
  QUADRANT_LABEL,
  type ImpactKey,
  type Presidencia,
  type Quadrant,
} from '@/features/decisoes/model'
import { fPct, fSigned1 } from '@/lib/format'
import { useUrlState } from '@/lib/useUrlState'
import styles from './DecisoesPage.module.css'

const SETORES: SetorKey[] = ['agro', 'industria', 'servicos', 'adm_publica']
const csv = (s: string | null) => new Set((s ?? '').split(',').filter(Boolean))
const toCsv = (s: Set<string>) => (s.size ? [...s].join(',') : null)

export default function DecisoesPage() {
  const { get, update } = useUrlState()
  const indexQ = useIndex()
  const index = indexQ.data
  const decQ = useDecisoes(index ? (index.decisoes ?? 'decisoes.json') : null)
  const expQ = useExposicao(index ? (index.exposicao ?? 'exposicao.json') : null)
  const geoQ = useGeo(expQ.data ? index?.geo : undefined)
  const names = useMemo(() => namesFromGeo(geoQ.data), [geoQ.data])

  const pres: Presidencia = get('p') === 'esquerda' ? 'esquerda' : 'direita'
  const impact: ImpactKey = IMPACTS.some((i) => i.key === get('i')) ? (get('i') as ImpactKey) : 'debt'
  const selD = csv(get('d'))
  const selI = csv(get('ins'))
  const data = decQ.data

  const dominios = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of data?.decisoes ?? []) counts.set(d.dominio, (counts.get(d.dominio) ?? 0) + 1)
    const known = DOMINIOS.filter((k) => counts.has(k))
    const other = [...counts.keys()].filter((k) => !(DOMINIOS as readonly string[]).includes(k))
    return [...known, ...other].map((key) => ({ key, count: counts.get(key) ?? 0 }))
  }, [data])
  const instrumentos = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of data?.decisoes ?? []) counts.set(d.instrumento, (counts.get(d.instrumento) ?? 0) + 1)
    const order = Object.keys(INSTRUMENTO_LABEL)
    return [...counts.keys()].sort((a, b) => order.indexOf(a) - order.indexOf(b)).map((key) => ({ key, count: counts.get(key) ?? 0 }))
  }, [data])

  const visible = useMemo(
    () => (data?.decisoes ?? []).filter((d) => (selD.size === 0 || selD.has(d.dominio)) && (selI.size === 0 || selI.has(d.instrumento))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, get('d'), get('ins')],
  )
  const visibleIds = useMemo(() => new Set(visible.map((d) => d.id)), [visible])
  const counts = useMemo(() => {
    const c: Record<Quadrant, number> = { 'facil-bom': 0, 'dificil-bom': 0, 'facil-ruim': 0, 'dificil-ruim': 0 }
    for (const d of visible) c[quadrant(d, impact, pres)]++
    return c
  }, [visible, impact, pres])

  if (indexQ.isError) return <ErrorState message={(indexQ.error as Error).message} onRetry={() => indexQ.refetch()} />
  if (decQ.isError) return <ErrorState message={(decQ.error as Error).message} onRetry={() => decQ.refetch()} />
  if (!index || decQ.isPending)
    return (
      <PageTemplate>
        <div style={{ display: 'grid', gap: 16 }} aria-busy="true">
          <Skeleton width={320} height={40} />
          <Skeleton height={48} />
          <Skeleton height={420} />
        </div>
      </PageTemplate>
    )
  if (!data)
    return (
      <PageTemplate>
        <SectionHeader level={1} title="Decisões" />
        <EmptyState icon="scale" title="Camada de decisões ainda não gerada">
          Rode <code>uv run sociolibero decisoes</code> para criar <code>web/public/data/decisoes.json</code>.
        </EmptyState>
      </PageTemplate>
    )

  const selected = data.decisoes.find((d) => d.id === get('sel')) ?? null
  const setorParam = get('s') as SetorKey | null
  const setor: SetorKey = setorParam && SETORES.includes(setorParam) ? setorParam : selected ? guessSetor(selected) : 'agro'
  const def = impactDef(impact)
  const toggle = (set: Set<string>, k: string) => {
    const n = new Set(set)
    if (n.has(k)) n.delete(k)
    else n.add(k)
    return n
  }
  const sorted = [...visible].sort((a, b) => goodness(b, impact) - goodness(a, impact))

  return (
    <PageTemplate>
      <SectionHeader
        level={1}
        title="Decisões econômicas e institucionais"
        description="O que cada decisão custa ou rende em 2035, e quão viável ela é, dado o quórum exigido e a composição do Congresso eleita em 2026."
      />
      <DataStatusBanner index={index} />
      <Notice tone="warn" title="Os efeitos são julgamentos editáveis">
        Todas as decisões trazem <code>base_evidencia = “julgamento”</code>: são premissas do modelo, não estimativas econométricas.{' '}
        {data.meta.aviso} Compare ordens de grandeza e discuta as premissas; não use como previsão.
      </Notice>

      <section className={styles.controls} aria-label="Controles">
        <div className={styles.row}>
          <SegmentedControl<Presidencia>
            label="Quem ocupa o Planalto"
            value={pres}
            onChange={(p) => update({ p })}
            options={[
              { value: 'direita', label: 'Presidência de direita' },
              { value: 'esquerda', label: 'Presidência de esquerda' },
            ]}
          />
          <SegmentedControl<ImpactKey>
            label="Variável de impacto em 2035"
            value={impact}
            onChange={(i) => update({ i })}
            options={IMPACTS.map((i) => ({ value: i.key, label: i.label }))}
          />
        </div>
        <DecisionFilters
          dominios={dominios}
          instrumentos={instrumentos}
          selDominios={selD}
          selInstrumentos={selI}
          onToggleDominio={(k) => update({ d: toCsv(toggle(selD, k)) })}
          onToggleInstrumento={(k) => update({ ins: toCsv(toggle(selI, k)) })}
          onClear={() => update({ d: null, ins: null })}
        />
      </section>

      <section className={styles.tiles} aria-label="Resumo por quadrante">
        {(['facil-bom', 'dificil-bom', 'facil-ruim', 'dificil-ruim'] as Quadrant[]).map((q) => (
          <StatTile key={q} label={QUADRANT_LABEL[q]} value={counts[q]} hint={`de ${visible.length} decisões · ${def.label}`} tone={q.endsWith('bom') ? 'pos' : 'neutral'} />
        ))}
      </section>

      <section className={styles.main} aria-label="Dispersão e detalhe">
        <div className={styles.chart}>
          <DecisionScatter decisoes={data.decisoes} visibleIds={visibleIds} impact={impact} presidencia={pres} selectedId={selected?.id ?? null} onSelect={(id) => update({ sel: id })} />
        </div>
        <div className={styles.detail}>
          {selected ? (
            <>
              <DecisionDetail decisao={selected} meta={data.meta} presidencia={pres} impact={impact} onClose={() => update({ sel: null })} />
              {expQ.data && (
                <div className={styles.expo}>
                  <ExposureHighlights exposicao={expQ.data} names={names} setor={setor} onSetor={(s) => update({ s })} electionId={index.eleicoes[0]?.id ?? ''} />
                </div>
              )}
            </>
          ) : (
            <EmptyState icon="scale" title="Selecione uma decisão">
              Clique em um ponto do gráfico (ou use Tab e Enter) para ver instrumento, quórum, ganhadores, perdedores, defasagem, reversibilidade e racional.
            </EmptyState>
          )}
        </div>
      </section>

      <details className={styles.table}>
        <summary>Ver como tabela · {visible.length} decisões</summary>
        <div className={styles.scroll}>
          <table>
            <caption className="sr-only">Decisões ordenadas pelo efeito em {def.label}</caption>
            <thead>
              <tr>
                <th scope="col">Decisão</th>
                <th scope="col">Domínio</th>
                <th scope="col">Instrumento</th>
                <th scope="col" className={styles.r}>P(aprovação)</th>
                <th scope="col" className={styles.r}>Δ {def.label}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.id}>
                  <th scope="row">
                    <button type="button" className={styles.link} onClick={() => update({ sel: d.id })}>{d.rotulo}</button>
                  </th>
                  <td>{d.dominio}</td>
                  <td>{INSTRUMENTO_LABEL[d.instrumento] ?? d.instrumento}</td>
                  <td className={styles.r}>{fPct(d.p_aprovacao[pres] * 100)}</td>
                  <td className={styles.r}>{fSigned1(d.impacto_2035[impact])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </PageTemplate>
  )
}

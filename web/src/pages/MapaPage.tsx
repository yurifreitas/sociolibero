import { useMemo } from 'react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { ErrorState } from '@/components/molecules/ErrorState'
import { LegendBar } from '@/components/molecules/LegendBar'
import { ProvenanceLine } from '@/components/molecules/ProvenanceLine'
import { DataStatusBanner } from '@/components/organisms/DataStatusBanner'
import { MapCanvas } from '@/components/organisms/MapCanvas'
import { MapControls } from '@/components/organisms/MapControls'
import { MunicipalityPanel } from '@/components/organisms/MunicipalityPanel'
import { RankTable } from '@/components/organisms/RankTable'
import { MapTemplate } from '@/components/templates/MapTemplate'
import { useElection, useExposicao, useForensics, useGeo, useIndex, useTerritorios } from '@/features/data/hooks'
import type { SetorKey } from '@/features/data/schemas'
import { buildFillPlan, buildGeometry } from '@/features/map/geometry'
import { computeValues, domainFor, formatTick, formatValue, metricDef, valueAt, type MetricKey } from '@/features/map/metrics'
import { TERRITORY_WARNING } from '@/features/territorios/model'
import { Notice } from '@/components/molecules/Notice'
import { lut, rgbCss } from '@/lib/color'
import { useTheme } from '@/lib/theme'
import { useUrlState } from '@/lib/useUrlState'
import styles from './MapaPage.module.css'

const cssVar = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()
const SETOR_KEYS: SetorKey[] = ['agro', 'industria', 'servicos', 'adm_publica']

export default function MapaPage() {
  const { get, update } = useUrlState()
  const { effective: theme } = useTheme()
  const indexQ = useIndex()
  const index = indexQ.data

  const eId = get('e') && index?.eleicoes.some((x) => x.id === get('e')) ? (get('e') as string) : index?.eleicoes[0]?.id
  const bRaw = get('b')
  const bId = bRaw && bRaw !== eId && index?.eleicoes.some((x) => x.id === bRaw) ? bRaw : undefined
  const forAvail = !!(eId && index?.forense.includes(eId))

  const geoQ = useGeo(index?.geo)
  const elQ = useElection(eId)
  const otherQ = useElection(bId)
  const forQ = useForensics(eId, forAvail)
  const expQ = useExposicao(index ? (index.exposicao ?? 'exposicao.json') : null)
  const terrQ = useTerritorios(index ? (index.territorios ?? 'territorios.json') : null)

  const geometry = useMemo(() => (geoQ.data ? buildGeometry(geoQ.data) : null), [geoQ.data])

  const unavailable: Partial<Record<MetricKey, string>> = {}
  if (!forAvail) for (const k of ['score', 'zt', 'zn'] as const) unavailable[k] = 'sem forense neste pleito'
  if (!expQ.data) unavailable.exposicao = 'dados indisponíveis'
  if (!terrQ.data) for (const k of ['pop_indigena', 'pop_quilombola', 'ti_area'] as const) unavailable[k] = 'dados indisponíveis'

  const wanted = (get('m') ?? 'voto') as MetricKey
  const metric: MetricKey = unavailable[wanted] ? 'voto' : wanted
  const def = metricDef(metric)
  const candidates = elQ.data?.meta.candidatos ?? []
  const candParam = get('c')
  const leader = useMemo(() => {
    const tot = new Map<string, number>()
    for (const r of Object.values(elQ.data?.linhas ?? {})) for (const [k, v] of Object.entries(r.votos)) tot.set(k, (tot.get(k) ?? 0) + v)
    return [...tot.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? String(candidates[0]?.numero ?? '')
  }, [elQ.data, candidates])
  const cand = candidates.some((c) => String(c.numero) === candParam) ? (candParam as string) : leader
  const setorParam = get('s') as SetorKey | null
  const setor: SetorKey = setorParam && SETOR_KEYS.includes(setorParam) ? setorParam : 'agro'
  const compare = def.election && !!bId && !!otherQ.data

  const values = useMemo(() => {
    if (!geometry || !elQ.data) return null
    const ibges = geometry.features.map((f) => f.ibge)
    return computeValues(metric, ibges, { election: elQ.data, other: otherQ.data, forensics: forQ.data, exposicao: expQ.data, territorios: terrQ.data, candidate: cand, setor }, compare)
  }, [geometry, elQ.data, otherQ.data, forQ.data, expQ.data, terrQ.data, metric, cand, setor, compare])

  const domain = useMemo(() => (values ? domainFor(def, values, compare) : null), [values, def, compare])
  const plan = useMemo(
    () => (geometry && values && domain ? buildFillPlan(geometry, values, domain, theme, cssVar('--map-nodata')) : null),
    [geometry, values, domain, theme],
  )

  const stops = useMemo(() => {
    if (!domain) return []
    const l = lut(domain.kind, theme)
    return Array.from({ length: 12 }, (_, i) => rgbCss(l[Math.round((i / 11) * 255)] as never))
  }, [domain, theme])

  const selIdx = geometry && get('mun') ? (geometry.indexByIbge.get(get('mun') as string) ?? -1) : -1
  const selFeature = selIdx >= 0 ? geometry?.features[selIdx] : undefined

  const rank = useMemo(() => {
    if (!geometry || !values) return null
    const idxs: number[] = []
    for (let i = 0; i < values.length; i++) if (!Number.isNaN(values[i] as number)) idxs.push(i)
    idxs.sort((a, b) => (values[b] as number) - (values[a] as number))
    const row = (i: number) => ({ idx: i, nome: geometry.features[i]!.nome, uf: geometry.features[i]!.uf, label: formatValue(metric, values[i] as number, compare) })
    return { top: idxs.slice(0, 8).map(row), bottom: idxs.slice(-8).reverse().map(row) }
  }, [geometry, values, metric, compare])

  // ---- estados de carga/erro ----
  if (indexQ.isError)
    return <ErrorState message={(indexQ.error as Error).message} onRetry={() => indexQ.refetch()} />
  if (!index)
    return (
      <MapTemplate
        sidebar={<><Skeleton height={28} width={220} /><Skeleton height={40} /><Skeleton height={40} /><Skeleton height={40} /></>}
        map={<Skeleton height="100%" style={{ borderRadius: 0 }} />}
      />
    )

  const election = elQ.data
  const mapError = geoQ.isError ? geoQ : elQ.isError ? elQ : null

  const tooltip = (idx: number) => {
    const f = geometry?.features[idx]
    if (!f || !values) return null
    const row = election?.linhas[f.ibge]
    return (
      <div className={styles.tip}>
        <strong>{f.nome} <span className={styles.uf}>{f.uf}</span></strong>
        <span className={styles.tipValue}>{formatValue(metric, values[idx] as number, compare)}</span>
        <span className={styles.tipMeta}>{def.label}{compare ? ' · diferença' : ''}</span>
        {row && <span className={styles.tipMeta}>{new Intl.NumberFormat('pt-BR').format(row.aptos)} eleitores aptos</span>}
      </div>
    )
  }

  const sidebar = (
    <>
      <div className={styles.titleBlock}>
        <h1 className={styles.h1}>Eleições por município</h1>
        <p className={styles.sub}>5.570 municípios · cada número é rastreável à fonte.</p>
      </div>
      <DataStatusBanner index={index} />
      <MapControls
        elections={index.eleicoes}
        election={eId ?? ''}
        onElection={(id) => update({ e: id, b: bId === id ? null : bRaw, mun: get('mun') })}
        metric={metric}
        onMetric={(m) => update({ m })}
        unavailable={unavailable}
        candidates={candidates}
        candidate={cand}
        onCandidate={(c) => update({ c })}
        compareId={bId ?? ''}
        onCompare={(b) => update({ b })}
        canCompare={def.election}
        setor={setor}
        onSetor={(s) => update({ s })}
        needsCandidate={def.needsCandidate}
        needsSector={def.needsSector}
      />
      {domain && (
        <LegendBar
          title={compare ? `${def.label} — diferença (pp)` : def.label}
          stops={stops}
          ticks={[0, 0.5, 1].map((t) => ({ pos: t, label: formatTick(metric, valueAt(domain, t), compare) }))}
          note={domain.log ? 'escala log · teto = p95 dos positivos' : def.key === 'zt' || def.key === 'zn' ? 'escala fixa ±4' : def.key === 'score' ? 'escala 0–máx.' : 'escala: p2–p98'}
          nodata={cssVar('--map-nodata')}
        />
      )}
      <p className={styles.help}>{def.help}</p>
      {def.territory && terrQ.data && (
        <Notice tone="warn" title="Como ler">
          {TERRITORY_WARNING} Municípios sem dado aparecem em cinza (não como zero).{terrQ.data.meta?.aviso ? ` ${terrQ.data.meta.aviso}` : ''}
        </Notice>
      )}
      {election && <ProvenanceLine meta={election.meta} />}
      {rank && geometry && (
        <RankTable title={def.label} top={rank.top} bottom={rank.bottom} onPick={(i) => update({ mun: geometry.features[i]!.ibge })} />
      )}
    </>
  )

  const map = mapError ? (
    <ErrorState message={(mapError.error as Error).message} onRetry={() => mapError.refetch()} />
  ) : geometry && plan ? (
    <MapCanvas
      geometry={geometry}
      plan={plan}
      selected={selIdx}
      onSelect={(i) => update({ mun: i >= 0 ? (geometry.features[i]?.ibge ?? null) : null })}
      renderTooltip={tooltip}
      ariaLabel={`Mapa coroplético por município: ${def.label}${election ? `, ${election.meta.rotulo}` : ''}`}
    />
  ) : (
    <div className={styles.loading} aria-busy="true">
      <Skeleton height="100%" style={{ borderRadius: 0 }} />
      <span className={styles.loadingText}>Carregando malha e resultados…</span>
    </div>
  )

  const detail =
    selFeature && election ? (
      <MunicipalityPanel
        ibge={selFeature.ibge}
        nome={selFeature.nome}
        uf={selFeature.uf}
        election={election}
        forensics={forQ.data}
        exposicao={expQ.data}
        territorios={terrQ.data}
        variant="compact"
        onClose={() => update({ mun: null })}
      />
    ) : undefined

  return (
    <>
      <MapTemplate sidebar={sidebar} map={map} detail={detail} />
      <p className="sr-only" aria-live="polite">
        {selFeature ? `${selFeature.nome}, ${selFeature.uf} selecionado` : ''}
      </p>
    </>
  )
}

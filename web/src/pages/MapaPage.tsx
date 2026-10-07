import { useMemo } from 'react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { ErrorState } from '@/components/molecules/ErrorState'
import { LegendBar } from '@/components/molecules/LegendBar'
import { ProvenanceLine } from '@/components/molecules/ProvenanceLine'
import { MapCanvas } from '@/components/organisms/MapCanvas'
import { MapControls } from '@/components/organisms/MapControls'
import { MunicipalityPanel } from '@/components/organisms/MunicipalityPanel'
import { RankTable } from '@/components/organisms/RankTable'
import { MapTemplate } from '@/components/templates/MapTemplate'
import { useElection, useExposicao, useForensics, useGeo, useIndex, useTerritorios } from '@/features/data/hooks'
import { useClimaRs } from '@/features/climars/hooks'
import { NIVEL } from '@/components/organisms/ClimaRsBlock'
import { useHumanoMunicipal } from '@/features/gente/hooks'
import { useAnalfabetosMunicipal } from '@/features/eleitorado/hooks'
import type { SetorKey } from '@/features/data/schemas'
import { buildFillPlan, buildGeometry } from '@/features/map/geometry'
import { computeValues, domainFor, formatTick, formatValue, metricDef, valueAt, type MetricKey } from '@/features/map/metrics'
import { TERRITORY_WARNING } from '@/features/territorios/model'
import { InlineNote } from '@/components/molecules/InlineNote'
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
  const wantedDef = metricDef(get('m') ?? 'voto')
  const hmQ = useHumanoMunicipal(!!wantedDef.humano)
  const rsQ = useClimaRs(!!wantedDef.climaRs)
  const anQ = useAnalfabetosMunicipal(!!wantedDef.analf)

  const geometry = useMemo(() => (geoQ.data ? buildGeometry(geoQ.data) : null), [geoQ.data])

  const unavailable: Partial<Record<MetricKey, string>> = {}
  if (!forAvail) for (const k of ['score', 'zt', 'zn'] as const) unavailable[k] = 'sem forense neste pleito'
  if (!expQ.data) unavailable.exposicao = 'dados indisponíveis'
  if (!terrQ.data) for (const k of ['pop_indigena', 'pop_quilombola', 'ti_area'] as const) unavailable[k] = 'dados indisponíveis'
  if (rsQ.isError || (rsQ.isSuccess && !rsQ.data)) unavailable.risco_rs = 'dados indisponíveis'
  if (anQ.isError || (anQ.isSuccess && !anQ.data)) unavailable.analfabetos = 'dados indisponíveis'
  if (hmQ.isError || (hmQ.isSuccess && !hmQ.data)) for (const k of ['homicidios', 'vitimas_negras', 'mae_adolescente'] as const) unavailable[k] = 'dados indisponíveis'

  const wanted = (get('m') ?? 'voto') as MetricKey
  const metric: MetricKey = unavailable[wanted] ? 'voto' : wanted
  const def = metricDef(metric)
  const yearsAvail = def.humano ? (hmQ.data?.anos ?? []).filter((y) => y >= (def.humano?.min ?? 0) && y <= (def.humano?.max ?? 0)) : (def.analf?.years ?? [])
  const yParam = Number(get('y'))
  const ano = def.humano ? (yearsAvail.includes(yParam) ? yParam : def.humano.defaultYear) : def.analf ? (yearsAvail.includes(yParam) ? yParam : def.analf.defaultYear) : undefined
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
    return computeValues(metric, ibges, { election: elQ.data, other: otherQ.data, forensics: forQ.data, exposicao: expQ.data, territorios: terrQ.data, humano: hmQ.data, climaRs: rsQ.data, analfabetos: anQ.data, ano, candidate: cand, setor }, compare)
  }, [geometry, elQ.data, otherQ.data, forQ.data, expQ.data, terrQ.data, hmQ.data, rsQ.data, anQ.data, ano, metric, cand, setor, compare])

  const domain = useMemo(() => (values ? domainFor(def, values, compare) : null), [values, def, compare])
  // RS sem índice (cobertura insuficiente) é hachurado: o cinza liso poderia ser lido como “risco baixo”
  const hatchMask = useMemo(() => {
    if (!geometry || !values || !def.climaRs || !rsQ.data) return undefined
    const m = new Uint8Array(values.length)
    for (let i = 0; i < m.length; i++) if (geometry.features[i]?.uf === 'RS' && Number.isNaN(values[i] as number)) m[i] = 1
    return m
  }, [geometry, values, def.climaRs, rsQ.data])
  const rsFocus = useMemo(() => {
    if (!geometry || !def.climaRs) return null
    let b: [number, number, number, number] | null = null
    for (const f of geometry.features)
      if (f.uf === 'RS') b = b ? [Math.min(b[0], f.bbox[0]), Math.min(b[1], f.bbox[1]), Math.max(b[2], f.bbox[2]), Math.max(b[3], f.bbox[3])] : [f.bbox[0], f.bbox[1], f.bbox[2], f.bbox[3]]
    return b ? { key: 'rs', bbox: b } : null
  }, [geometry, def.climaRs])
  const plan = useMemo(
    () => (geometry && values && domain ? buildFillPlan(geometry, values, domain, theme, cssVar('--map-nodata'), hatchMask) : null),
    [geometry, values, domain, theme, hatchMask],
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
    // taxas de município pequeno oscilam por acaso: o ranking de violência só inclui ≥ 20 mil habitantes
    const popOf = (i: number) => {
      const pop = hmQ.data?.linhas[geometry.features[i]!.ibge]?.pop
      return pop?.[String(ano)] ?? pop?.['2022'] ?? 0
    }
    for (let i = 0; i < values.length; i++) if (!Number.isNaN(values[i] as number) && (!def.humano || popOf(i) >= 20000)) idxs.push(i)
    idxs.sort((a, b) => (values[b] as number) - (values[a] as number))
    const row = (i: number) => ({ idx: i, nome: geometry.features[i]!.nome, uf: geometry.features[i]!.uf, label: formatValue(metric, values[i] as number, compare) })
    return { top: idxs.slice(0, 8).map(row), bottom: idxs.slice(-8).reverse().map(row) }
  }, [geometry, values, metric, compare, def.humano, hmQ.data, ano])

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
    const rs = def.climaRs ? rsQ.data?.linhas[f.ibge] : undefined
    return (
      <div className={styles.tip}>
        <strong>{f.nome} <span className={styles.uf}>{f.uf}</span></strong>
        <span className={styles.tipValue}>{def.climaRs && f.uf === 'RS' && Number.isNaN(values[idx] as number) ? 'sem índice' : formatValue(metric, values[idx] as number, compare)}</span>
        {rs && <span className={styles.tipMeta}>{rs.indice.score_atual != null ? `prioridade ${NIVEL[rs.indice.nivel_atual ?? ''] ?? '—'} · cobertura ${rs.indice.cobertura_peso?.toFixed(2).replace('.', ',') ?? '—'}` : `cobertura insuficiente (${rs.indice.cobertura_peso?.toFixed(2).replace('.', ',') ?? '—'}): fora do ranking`}</span>}
        {def.climaRs && f.uf !== 'RS' && <span className={styles.tipMeta}>fora do RS: camada não cobre</span>}
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
        years={yearsAvail}
        ano={ano}
        yearHint={def.analf ? 'Perfil do eleitorado do TSE; 2026 é preliminar.' : undefined}
        onAno={(y) => update({ y: String(y) })}
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
      {def.humano && (
        <InlineNote id="mapa-humano" tone="warn" baseId="humano-municipal" title="Violência por município.">
          Dados via projeto Arandu/trans (proveniência indireta). O Atlas municipal vai até 2022; 2020 e 2023 usam o SIM, porque o Atlas municipal de 2020 tem defeito na origem. O ranking só inclui municípios com 20 mil habitantes ou mais.
        </InlineNote>
      )}
      {def.climaRs && (
        <InlineNote id="mapa-risco-rs" tone="warn" baseId="clima-rs" title="Prioridade preventiva, não previsão de cheia.">
          Só o Rio Grande do Sul (497 municípios), com dados do projeto climate (proveniência indireta; snapshot de 09/08/2026). Impacto e déficit são auto-declaração da prefeitura ao IBGE. <strong>Município hachurado não tem índice</strong> (cobertura de peso abaixo de 0,60) e fica fora do ranking: não é “risco baixo”.
        </InlineNote>
      )}
      {def.analf && (
        <InlineNote id="mapa-analfabetos" tone="warn" baseId="eleitorado-analfabeto" title="Declaração de instrução no cadastro, não leitura.">
          Percentual de eleitores com grau de instrução “analfabeto” no perfil do eleitorado do TSE. O cadastro inclui inscritos que morreram ou mudaram, e o voto do analfabeto é facultativo. Município hachurado não tem perfil no ano (não é “zero”). O 2026 é preliminar. Cruzar esta camada com o voto é comparação entre municípios, não diz como o analfabeto vota. <a href="#/voto-analfabeto?aba=cruzamentos">Ver os cruzamentos e seus limites</a>.
        </InlineNote>
      )}
      {def.analf && anQ.isPending && <p className={styles.help}>Carregando eleitores analfabetos por município (3,9 MB)…</p>}
      {def.climaRs && rsQ.isPending && <p className={styles.help}>Carregando risco climático do RS (1,2 MB)…</p>}
      {def.humano && hmQ.isPending && <p className={styles.help}>Carregando violência por município (14 MB)…</p>}
      {def.territory && terrQ.data && (
        <InlineNote id="mapa-territorio" tone="info" baseId="funai-incra" title="Como ler.">
          {TERRITORY_WARNING} Municípios sem dado aparecem em cinza (não como zero).{terrQ.data.meta?.aviso ? ` ${terrQ.data.meta.aviso}` : ''}
        </InlineNote>
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
      focus={rsFocus}
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
        climaRs={rsQ.data}
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

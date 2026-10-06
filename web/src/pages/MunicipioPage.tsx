import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Skeleton } from '@/components/atoms/Skeleton'
import { EmptyState } from '@/components/molecules/EmptyState'
import { ErrorState } from '@/components/molecules/ErrorState'
import { Field } from '@/components/molecules/Field'
import { Select } from '@/components/atoms/Select'
import { MunicipalityPanel } from '@/components/organisms/MunicipalityPanel'
import { DataStatusBanner } from '@/components/organisms/DataStatusBanner'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useElections, useExposicao, useForensics, useGeo, useIndex, useTerritorios } from '@/features/data/hooks'
import { namesFromGeo } from '@/features/data/names'
import type { Election } from '@/features/data/schemas'
import { useUrlState } from '@/lib/useUrlState'
import styles from './MunicipioPage.module.css'

export default function MunicipioPage() {
  const { ibge = '' } = useParams()
  const { get, update } = useUrlState()
  const indexQ = useIndex()
  const index = indexQ.data
  const geoQ = useGeo(index?.geo)
  const elQs = useElections(index?.eleicoes.map((e) => e.id) ?? [])
  const expQ = useExposicao(index ? (index.exposicao ?? 'exposicao.json') : null)
  const terrQ = useTerritorios(index ? (index.territorios ?? 'territorios.json') : null)

  const eId = get('e') && index?.eleicoes.some((x) => x.id === get('e')) ? (get('e') as string) : index?.eleicoes[0]?.id
  const forAvail = !!(eId && index?.forense.includes(eId))
  const forQ = useForensics(eId, forAvail)
  const names = useMemo(() => namesFromGeo(geoQ.data), [geoQ.data])

  if (indexQ.isError) return <ErrorState message={(indexQ.error as Error).message} onRetry={() => indexQ.refetch()} />
  const failed = elQs.find((q) => q.isError) ?? (geoQ.isError ? geoQ : undefined)
  if (failed) return <ErrorState message={(failed.error as Error).message} onRetry={() => failed.refetch()} />

  const loading = !index || elQs.some((q) => q.isPending) || geoQ.isPending
  if (loading)
    return (
      <PageTemplate width="narrow">
        <div style={{ display: 'grid', gap: 16 }} aria-busy="true">
          <Skeleton width={260} height={40} />
          <Skeleton height={120} />
          <Skeleton height={240} />
        </div>
      </PageTemplate>
    )

  const place = names.get(ibge)
  const all = elQs.map((q) => q.data).filter((x): x is Election => !!x)
  const election = all.find((e) => e.meta.id === eId)

  if (!place || !election)
    return (
      <PageTemplate width="narrow">
        <EmptyState icon="map" title="Município não encontrado" action={<Link to="/">Voltar ao mapa</Link>}>
          Não há município com o código IBGE “{ibge}” na malha carregada.
        </EmptyState>
      </PageTemplate>
    )

  return (
    <PageTemplate width="narrow">
      <div className={styles.top}>
        <Link to={`/?e=${election.meta.id}&mun=${ibge}`} className={styles.back}>
          ← Voltar ao mapa
        </Link>
        <div className={styles.pick}>
          <Field label="Pleito">
            {(id) => (
              <Select id={id} value={election.meta.id} onChange={(e) => update({ e: e.target.value })}>
                {index.eleicoes.map((e) => (
                  <option key={e.id} value={e.id}>{e.rotulo}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </div>
      <DataStatusBanner index={index} />
      <MunicipalityPanel
        ibge={ibge}
        nome={place.nome}
        uf={place.uf}
        election={election}
        forensics={forQ.data}
        allElections={all}
        exposicao={expQ.data}
        territorios={terrQ.data}
        variant="full"
      />
    </PageTemplate>
  )
}

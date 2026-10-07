import { Skeleton } from '@/components/atoms/Skeleton'
import { EmptyState } from '@/components/molecules/EmptyState'
import { ErrorState } from '@/components/molecules/ErrorState'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { ReferenceList } from '@/components/organisms/ReferenceList'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useIndex, useReferences } from '@/features/data/hooks'

export default function ReferenciasPage() {
  const indexQ = useIndex()
  const index = indexQ.data
  const refQ = useReferences(index ? (index.referencias ?? 'references.json') : null)

  if (indexQ.isError) return <ErrorState message={(indexQ.error as Error).message} onRetry={() => indexQ.refetch()} />
  if (refQ.isError) return <ErrorState message={(refQ.error as Error).message} onRetry={() => refQ.refetch()} />

  return (
    <PageTemplate width="narrow">
      <SectionHeader
        level={1}
        title="Referências"
        description="Projetos, artigos e bases que inspiram a metodologia. “A confirmar” indica referência ainda não checada na fonte."
      />
      {!index || refQ.isPending ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12 }} aria-busy="true">
          <Skeleton height={28} width={220} />
          <Skeleton height={72} />
          <Skeleton height={72} />
        </div>
      ) : !refQ.data || refQ.data.length === 0 ? (
        <EmptyState icon="book" title="Referências ainda não publicadas">
          O arquivo <code>references.json</code> não foi encontrado em <code>web/public/data/</code>.
        </EmptyState>
      ) : (
        <ReferenceList refs={refQ.data} />
      )}
    </PageTemplate>
  )
}

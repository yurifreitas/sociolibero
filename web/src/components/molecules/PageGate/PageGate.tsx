import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { Skeleton } from '@/components/atoms/Skeleton'
import { EmptyState } from '@/components/molecules/EmptyState'
import { ErrorState } from '@/components/molecules/ErrorState'

/** Porteiro de dados: skeleton enquanto carrega, erro com retry, estado vazio quando o arquivo ainda não existe. */
export function PageGate<T>({ query, file, children }: { query: UseQueryResult<T | null>; file: string; children: (data: T) => ReactNode }) {
  if (query.isPending)
    return (
      <div aria-busy="true" aria-label="Carregando" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--space-4)' }}>
        <Skeleton height={44} width={360} />
        <Skeleton height={260} style={{ borderRadius: 16 }} />
        <Skeleton height={160} style={{ borderRadius: 16 }} />
      </div>
    )
  if (query.isError) return <ErrorState message={(query.error as Error).message} onRetry={() => void query.refetch()} />
  if (!query.data)
    return (
      <EmptyState icon="database" title="Dados ainda não publicados">
        O arquivo <code>{file}</code> não existe em <code>web/public/data/</code>. Gere-o com o pipeline Python e recarregue.
      </EmptyState>
    )
  return <>{children(query.data)}</>
}

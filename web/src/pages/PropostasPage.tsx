import { Skeleton } from '@/components/atoms/Skeleton'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { EmptyState } from '@/components/molecules/EmptyState'
import { ErrorState } from '@/components/molecules/ErrorState'
import { InlineNote } from '@/components/molecules/InlineNote'
import { ProposalCard } from '@/components/molecules/ProposalCard'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { usePropostas } from '@/features/bases/hooks'
import { AREA_LABEL } from '@/features/bases/model'
import { useUrlState } from '@/lib/useUrlState'
import styles from './PropostasPage.module.css'

const STATUS_LABEL: Record<string, string> = { 'em-andamento': 'Em andamento', proposta: 'Proposta' }
const csv = (v: string | null) => new Set((v ?? '').split(',').filter(Boolean))
const toggle = (s: Set<string>, k: string) => {
  const n = new Set(s)
  if (n.has(k)) n.delete(k)
  else n.add(k)
  return [...n].join(',') || null
}

export default function PropostasPage() {
  const q = usePropostas()
  const { get, update } = useUrlState()
  const areas = csv(get('area'))
  const status = csv(get('status'))

  if (q.isError) return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
  const all = q.data?.propostas ?? []
  const shown = all
    .filter((p) => (areas.size === 0 || areas.has(p.area)) && (status.size === 0 || status.has(p.status)))
    .sort((a, b) => Number(b.status === 'em-andamento') - Number(a.status === 'em-andamento'))
  const count = (key: 'area' | 'status') => {
    const m = new Map<string, number>()
    for (const p of all) m.set(p[key], (m.get(p[key]) ?? 0) + 1)
    return [...m.entries()].map(([k, n]) => ({ key: k, count: n, label: key === 'area' ? (AREA_LABEL[k] ?? k) : (STATUS_LABEL[k] ?? k) }))
  }

  return (
    <PageTemplate>
      <SectionHeader
        level={1}
        title="Propostas e próximos passos"
        description="O que ainda falta para tornar cada número mais confiável — e o que pode dar errado. Propostas são hipóteses de trabalho, não resultados."
      />
      <InlineNote id="propostas-natureza" tone="info" baseId="propostas">
        Cada cartão diz do que a proposta precisa e qual é o risco. Nada aqui foi executado, salvo o que está marcado “em andamento”.
      </InlineNote>

      {q.isPending ? (
        <div className={styles.grid} aria-busy="true">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={220} style={{ borderRadius: 16 }} />)}
        </div>
      ) : all.length === 0 ? (
        <EmptyState icon="bulb" title="Propostas ainda não publicadas">
          O arquivo <code>propostas.json</code> não foi encontrado em <code>web/public/data/</code>.
        </EmptyState>
      ) : (
        <>
          <div className={styles.filters}>
            <ChipGroup label="Área" items={count('area')} selected={areas} onToggle={(k) => update({ area: toggle(areas, k) })} onClear={() => update({ area: null })} />
            <ChipGroup label="Status" items={count('status')} selected={status} onToggle={(k) => update({ status: toggle(status, k) })} onClear={() => update({ status: null })} />
          </div>
          <p className={styles.count} aria-live="polite">{shown.length} de {all.length} propostas</p>
          <div className={styles.grid}>{shown.map((p) => <ProposalCard key={p.id} p={p} />)}</div>
        </>
      )}
    </PageTemplate>
  )
}

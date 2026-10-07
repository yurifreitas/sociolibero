import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { AREA_LABEL } from '@/features/bases/model'
import type { Proposta } from '@/features/bases/schema'
import styles from './ProposalCard.module.css'

const STATUS: Record<string, { label: string; tone: 'brand' | 'warn' | 'neutral' }> = {
  'em-andamento': { label: 'em andamento', tone: 'brand' },
  proposta: { label: 'proposta', tone: 'neutral' },
}

/** Cartão de proposta: o que é, o que precisa para ser validada e o que pode dar errado. */
export function ProposalCard({ p, compact }: { p: Proposta; compact?: boolean }) {
  const st = STATUS[p.status] ?? { label: p.status, tone: 'neutral' as const }
  return (
    <article className={`card ${styles.card}`}>
      <header className={styles.head}>
        <span className={styles.icon} aria-hidden="true">
          <Icon name="bulb" size={16} />
        </span>
        <span className={styles.area}>{AREA_LABEL[p.area] ?? p.area}</span>
        <Badge tone={st.tone}>{st.label}</Badge>
      </header>
      <h3 className={styles.title}>{p.titulo}</h3>
      <p className={styles.resumo}>{p.resumo}</p>
      {!compact && p.precisa && p.precisa.length > 0 && (
        <div className={styles.block}>
          <span className={styles.label}>Precisa de</span>
          <ul>
            {p.precisa.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}
      {!compact && p.risco && (
        <div className={styles.risk}>
          <Icon name="alert" size={14} />
          <span>{p.risco}</span>
        </div>
      )}
      {p.origem && <span className={styles.origin}>origem · {p.origem}</span>}
    </article>
  )
}

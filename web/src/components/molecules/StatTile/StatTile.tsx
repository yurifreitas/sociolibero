import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import styles from './StatTile.module.css'

export type StatTileProps = {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'neutral' | 'pos' | 'neg'
}

export function StatTile({ label, value, hint, tone = 'neutral' }: StatTileProps) {
  return (
    <div className={styles.tile}>
      <span className={styles.label}>{label}</span>
      <span className={cn(styles.value, tone !== 'neutral' && styles[tone])}>{value}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}

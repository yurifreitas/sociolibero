import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/atoms/Icon'
import styles from './EmptyState.module.css'

export type EmptyStateProps = { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }

export function EmptyState({ icon = 'info', title, children, action }: EmptyStateProps) {
  return (
    <div className={styles.box}>
      <Icon name={icon} size={24} className={styles.icon} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/atoms/Icon'
import styles from './Notice.module.css'

export type NoticeProps = {
  tone?: 'info' | 'warn' | 'danger'
  title?: string
  children: ReactNode
  className?: string
}

export function Notice({ tone = 'info', title, children, className }: NoticeProps) {
  return (
    <aside className={cn(styles.notice, styles[tone], className)} role={tone === 'danger' ? 'alert' : 'note'}>
      <Icon name={tone === 'info' ? 'info' : 'alert'} size={18} className={styles.icon} />
      <div>
        {title && <strong className={styles.title}>{title}</strong>}
        <div className={styles.body}>{children}</div>
      </div>
    </aside>
  )
}

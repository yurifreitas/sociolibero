import type { ReactNode } from 'react'
import styles from './SectionHeader.module.css'

export type SectionHeaderProps = { title: string; description?: ReactNode; actions?: ReactNode; level?: 1 | 2 | 3 }

export function SectionHeader({ title, description, actions, level = 2 }: SectionHeaderProps) {
  const H = `h${level}` as 'h1' | 'h2' | 'h3'
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <H className={level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3}>{title}</H>
        {description && <p className={styles.desc}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}

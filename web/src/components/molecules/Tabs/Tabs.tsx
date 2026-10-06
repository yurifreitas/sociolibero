import { useId, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import styles from './Tabs.module.css'

export type TabItem<T extends string> = { key: T; label: string; count?: number }
export type TabsProps<T extends string> = {
  tabs: ReadonlyArray<TabItem<T>>
  value: T
  onChange: (k: T) => void
  label: string
  children: ReactNode
}

/** Abas acessíveis (WAI-ARIA tabs): setas ← → e Home/End movem o foco e a seleção. */
export function Tabs<T extends string>({ tabs, value, onChange, label, children }: TabsProps<T>) {
  const base = useId()
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.key === value)
    let n = i
    if (e.key === 'ArrowRight') n = (i + 1) % tabs.length
    else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = tabs.length - 1
    else return
    e.preventDefault()
    onChange((tabs[n] as TabItem<T>).key)
    document.getElementById(`${base}-tab-${(tabs[n] as TabItem<T>).key}`)?.focus()
  }
  return (
    <div>
      <div role="tablist" aria-label={label} className={styles.list} onKeyDown={onKey}>
        {tabs.map((t) => (
          <button
            key={t.key}
            id={`${base}-tab-${t.key}`}
            role="tab"
            type="button"
            aria-selected={t.key === value}
            aria-controls={`${base}-panel`}
            tabIndex={t.key === value ? 0 : -1}
            className={cn(styles.tab, t.key === value && styles.on)}
            onClick={() => onChange(t.key)}
          >
            {t.label}
            {t.count != null && <span className={styles.n}>{t.count}</span>}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${value}`} className={styles.panel}>
        {children}
      </div>
    </div>
  )
}

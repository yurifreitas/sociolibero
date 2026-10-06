import { cn } from '@/lib/cn'
import styles from './ChipGroup.module.css'

export type ChipGroupProps = {
  label: string
  items: { key: string; label?: string; count?: number }[]
  selected: Set<string>
  onToggle: (k: string) => void
  onClear?: () => void
}

/** Filtro por chips (multisseleção; vazio = todos). */
export function ChipGroup({ label, items, selected, onToggle, onClear }: ChipGroupProps) {
  return (
    <fieldset className={styles.set}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.chips}>
        {items.map((i) => (
          <button key={i.key} type="button" aria-pressed={selected.has(i.key)} className={cn(styles.chip, selected.has(i.key) && styles.on)} onClick={() => onToggle(i.key)}>
            {i.label ?? i.key}
            {i.count != null && <span className={styles.n}>{i.count}</span>}
          </button>
        ))}
        {onClear && selected.size > 0 && (
          <button type="button" className={styles.clear} onClick={onClear}>
            Limpar
          </button>
        )}
      </div>
    </fieldset>
  )
}

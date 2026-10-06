import { cn } from '@/lib/cn'
import styles from './SegmentedControl.module.css'

export type SegmentedOption<T extends string> = { value: T; label: string }
export type SegmentedControlProps<T extends string> = {
  value: T
  onChange: (v: T) => void
  options: ReadonlyArray<SegmentedOption<T>>
  label: string
  className?: string
}

export function SegmentedControl<T extends string>({ value, onChange, options, label, className }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn(styles.group, className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={cn(styles.opt, o.value === value && styles.on)}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

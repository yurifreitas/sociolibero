import { useId, type ReactNode } from 'react'
import styles from './Field.module.css'

export type FieldProps = {
  label: string
  hint?: string
  /** recebe o id para ligar label ↔ controle */
  children: (id: string) => ReactNode
}

export function Field({ label, hint, children }: FieldProps) {
  const id = useId()
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children(id)}
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  )
}

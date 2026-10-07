import { useEffect, useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'
import styles from './CycleRuler.module.css'

export type CycleTab = { id: string; rotulo: string; inicio: number; fim: number }

/** Régua horizontal de ciclos (tablist com setas, Home/End). O ciclo escolhido rola para o centro. */
export function CycleRuler({ cycles, value, onChange }: { cycles: CycleTab[]; value: string; onChange: (id: string) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  useEffect(() => {
    refs.current[value]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [value])
  const onKey = (e: KeyboardEvent) => {
    const i = cycles.findIndex((c) => c.id === value)
    let n = i
    if (e.key === 'ArrowRight') n = Math.min(cycles.length - 1, i + 1)
    else if (e.key === 'ArrowLeft') n = Math.max(0, i - 1)
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = cycles.length - 1
    else return
    e.preventDefault()
    const next = cycles[n]
    if (next) {
      onChange(next.id)
      refs.current[next.id]?.focus()
    }
  }
  return (
    <div className={styles.wrap}>
      <div role="tablist" aria-label="Ciclos econômicos, do pau-brasil a 2026" className={styles.list} onKeyDown={onKey}>
        {cycles.map((c, i) => {
          const on = c.id === value
          return (
            <button
              key={c.id}
              ref={(el) => {
                refs.current[c.id] = el
              }}
              type="button"
              role="tab"
              id={`ciclo-tab-${c.id}`}
              aria-selected={on}
              aria-controls="ciclo-painel"
              tabIndex={on ? 0 : -1}
              className={cn(styles.tab, on && styles.on)}
              onClick={() => onChange(c.id)}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.years}>
                {c.inicio}–{c.fim}
              </span>
              <span className={styles.label}>{c.rotulo}</span>
              <span className={styles.idx} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

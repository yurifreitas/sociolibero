import { cn } from '@/lib/cn'
import { INSTRUMENTO_LABEL } from '@/features/decisoes/model'
import styles from './DecisionFilters.module.css'

export type DecisionFiltersProps = {
  dominios: { key: string; count: number }[]
  instrumentos: { key: string; count: number }[]
  selDominios: Set<string>
  selInstrumentos: Set<string>
  onToggleDominio: (k: string) => void
  onToggleInstrumento: (k: string) => void
  onClear: () => void
}

function Chips({ label, items, sel, onToggle, fmt }: { label: string; items: { key: string; count: number }[]; sel: Set<string>; onToggle: (k: string) => void; fmt?: (k: string) => string }) {
  return (
    <fieldset className={styles.set}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.chips}>
        {items.map((i) => (
          <button key={i.key} type="button" aria-pressed={sel.has(i.key)} className={cn(styles.chip, sel.has(i.key) && styles.on)} onClick={() => onToggle(i.key)}>
            {fmt ? fmt(i.key) : i.key} <span className={styles.n}>{i.count}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function DecisionFilters(p: DecisionFiltersProps) {
  const any = p.selDominios.size > 0 || p.selInstrumentos.size > 0
  return (
    <div className={styles.root}>
      <Chips label="Domínio" items={p.dominios} sel={p.selDominios} onToggle={p.onToggleDominio} />
      <Chips label="Instrumento" items={p.instrumentos} sel={p.selInstrumentos} onToggle={p.onToggleInstrumento} fmt={(k) => INSTRUMENTO_LABEL[k] ?? k} />
      {any && (
        <button type="button" className={styles.clear} onClick={p.onClear}>
          Limpar filtros
        </button>
      )}
    </div>
  )
}

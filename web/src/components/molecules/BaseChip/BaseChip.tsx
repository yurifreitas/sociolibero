import { StatusGlyph } from '@/components/atoms/StatusGlyph'
import { cn } from '@/lib/cn'
import { STATUS_INFO } from '@/features/bases/model'
import type { Base } from '@/features/bases/schema'
import styles from './BaseChip.module.css'

export type BaseChipProps = { base: Base; onOpen: (id: string) => void; dim?: boolean }

/** Chip de uma base: glifo (forma + cor), nome curto e status. Abre a gaveta já na base certa. */
export function BaseChip({ base, onOpen, dim }: BaseChipProps) {
  return (
    <button
      type="button"
      className={cn(styles.chip, dim && styles.dim)}
      onClick={() => onOpen(base.id)}
      aria-haspopup="dialog"
      title={`${base.nome} — ${STATUS_INFO[base.status].explain}`}
    >
      <StatusGlyph status={base.status} />
      <span className={styles.name}>{base.chip.rotulo}</span>
      <span className={styles.detail}>{base.chip.detalhe}</span>
    </button>
  )
}

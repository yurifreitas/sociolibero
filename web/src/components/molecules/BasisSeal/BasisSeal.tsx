import { Seal } from '@/components/molecules/Seal'
import { cn } from '@/lib/cn'
import styles from './BasisSeal.module.css'

export type Basis = 'measured' | 'modeled' | 'synthetic'
const INFO: Record<Basis, { label: string; hint: string }> = {
  measured: { label: 'medido', hint: 'Observação: passou por contagem ou medição, não por tradução, tabela ou julgamento.' },
  modeled: { label: 'modelado', hint: 'Passou por tradução, tabela, ajuste ou julgamento. Vale o que vale o método.' },
  synthetic: { label: 'sintético', hint: 'Gerado para desenvolvimento ou validação, não é observação.' },
}

const Glyph = ({ basis }: { basis: Basis }) => (
  <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
    {basis === 'measured' && <circle cx="6" cy="6" r="4.4" fill="currentColor" />}
    {basis === 'modeled' && <path d="M6 1.2 10.8 6 6 10.8 1.2 6z" fill="color-mix(in oklch, currentColor 22%, transparent)" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />}
    {basis === 'synthetic' && <circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2" />}
  </svg>
)

export type BasisSealProps = {
  /** selo de procedência (`provenance.basis`); null/undefined = sem selo, nunca “medido” por omissão */
  basis: Basis | null | undefined
  /** segundo eixo: a fonte foi conferida? omitir para não mostrar */
  verified?: boolean | null
  /** rótulo do segundo eixo */
  verifiedLabels?: { yes?: string; no?: string; unknown?: string }
  className?: string
}

/** Selo `basis` (measured | modeled | synthetic) + eixo de verificação. Forma e cor distintas, texto sempre presente. */
export function BasisSeal({ basis, verified, verifiedLabels, className }: BasisSealProps) {
  const info = basis ? INFO[basis] : null
  return (
    <span className={cn(styles.wrap, className)}>
      <span className={cn(styles.basis, basis ? styles[basis] : styles.none)} title={info?.hint ?? 'Sem selo de procedência: não presuma que é medido.'}>
        {basis && <Glyph basis={basis} />}
        {info?.label ?? 'sem selo'}
      </span>
      {verified !== undefined && <Seal v={verified} labels={verifiedLabels} />}
    </span>
  )
}

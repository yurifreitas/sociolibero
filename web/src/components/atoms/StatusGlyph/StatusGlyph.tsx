import type { SVGProps } from 'react'

export type BaseStatus = 'oficial' | 'preliminar' | 'derivado' | 'julgamento' | 'parcial' | 'nao-verificado' | 'em-preparacao'

/** Glifos distintos por forma (não só por cor): ✓ círculo, ◔ meio, ◇ losango, △ triângulo, ◐ parcial, ○ tracejado. */
export function StatusGlyph({ status, size = 14, ...rest }: { status: BaseStatus; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  const c = `var(--st-${status === 'nao-verificado' ? 'nao' : status === 'em-preparacao' ? 'prep' : status})`
  const common = { stroke: c, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" {...rest}>
      {status === 'oficial' && (
        <>
          <circle cx="8" cy="8" r="6.2" {...common} fill={`color-mix(in oklch, ${c} 18%, transparent)`} />
          <path d="m5.2 8.2 2 2 3.6-4" {...common} />
        </>
      )}
      {status === 'preliminar' && (
        <>
          <circle cx="8" cy="8" r="6.2" {...common} />
          <path d="M8 8V1.8a6.2 6.2 0 0 1 0 12.4z" fill={c} stroke="none" />
        </>
      )}
      {status === 'derivado' && <path d="M8 1.8 14.2 8 8 14.2 1.8 8z" {...common} fill={`color-mix(in oklch, ${c} 18%, transparent)`} />}
      {status === 'julgamento' && (
        <>
          <path d="M8 2 14.4 13.4H1.6z" {...common} fill={`color-mix(in oklch, ${c} 16%, transparent)`} />
          <path d="M8 6.4v3.2M8 11.4v.2" {...common} />
        </>
      )}
      {status === 'parcial' && (
        <>
          <circle cx="8" cy="8" r="6.2" {...common} />
          <path d="M8 1.8a6.2 6.2 0 0 0 0 12.4z" fill={c} stroke="none" opacity=".85" />
        </>
      )}
      {status === 'nao-verificado' && <circle cx="8" cy="8" r="6.2" {...common} strokeDasharray="2.2 2.4" />}
      {status === 'em-preparacao' && (
        <>
          <circle cx="8" cy="8" r="6.2" {...common} strokeDasharray="1.2 2.6" />
          <circle cx="8" cy="8" r="1.4" fill={c} stroke="none" />
        </>
      )}
    </svg>
  )
}

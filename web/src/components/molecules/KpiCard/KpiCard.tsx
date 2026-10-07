import type { ReactNode } from 'react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Sparkline, type SparklineProps } from '@/components/atoms/Sparkline'
import { StatusGlyph, type BaseStatus } from '@/components/atoms/StatusGlyph'
import { useChrome } from '@/features/chrome/ChromeContext'
import { cn } from '@/lib/cn'
import { useCountUp } from '@/lib/useCountUp'
import styles from './KpiCard.module.css'

export type KpiCardProps = {
  label: string
  /** null = ainda carregando ou sem dado (nunca vira zero) */
  value?: number | null
  format?: (n: number) => string
  unit?: string
  loading?: boolean
  delta?: { text: string; tone: 'pos' | 'neg' | 'neutral' }
  spark?: Pick<SparklineProps, 'values' | 'label' | 'tone'>
  foot?: ReactNode
  /** base que sustenta o número: abre a gaveta na base certa */
  base?: { id: string; status: BaseStatus; label: string }
  children?: ReactNode
  className?: string
  size?: 'md' | 'lg'
}

/** Cartão de KPI: número animado, delta, sparkline, nota e selo da base que o sustenta. */
export function KpiCard({ label, value, format, unit, loading, delta, spark, foot, base, children, className, size = 'md' }: KpiCardProps) {
  const { openDrawer } = useChrome()
  const shown = useCountUp(value ?? null)
  return (
    <article className={cn('card', styles.card, size === 'lg' && styles.lg, className)}>
      <header className={styles.head}>
        <h3 className={styles.label}>{label}</h3>
        {base && (
          <button type="button" className={styles.base} onClick={() => openDrawer(base.id)} title={`Abrir a base: ${base.label}`}>
            <StatusGlyph status={base.status} size={12} />
            <span>{base.label}</span>
          </button>
        )}
      </header>
      {value !== undefined && (
        <div className={styles.main}>
          {loading ? (
            <Skeleton width={size === 'lg' ? 180 : 120} height={size === 'lg' ? 52 : 36} />
          ) : (
            <p className={styles.value}>
              <span className="num">{shown == null ? '—' : (format ?? String)(shown)}</span>
              {unit && <span className={styles.unit}>{unit}</span>}
            </p>
          )}
          {delta && !loading && <span className={cn(styles.delta, styles[delta.tone])}>{delta.text}</span>}
        </div>
      )}
      {spark && !loading && <div className={styles.spark}><Sparkline {...spark} width={size === 'lg' ? 260 : 150} height={size === 'lg' ? 56 : 40} /></div>}
      {children}
      {foot && <p className={styles.foot}>{foot}</p>}
    </article>
  )
}

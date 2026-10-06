import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import styles from './Badge.module.css'

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'brand' | 'warn' | 'pos' | 'neg'
}

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[tone], className)} {...rest}>
      {children}
    </span>
  )
}

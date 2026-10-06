import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'
import styles from './Skeleton.module.css'

export type SkeletonProps = { width?: number | string; height?: number | string; className?: string; style?: CSSProperties }

/** Esqueleto com a forma do conteúdo (reserva altura: sem layout shift). */
export function Skeleton({ width = '100%', height = 16, className, style }: SkeletonProps) {
  return <span aria-hidden="true" className={cn(styles.sk, className)} style={{ width, height, ...style }} />
}

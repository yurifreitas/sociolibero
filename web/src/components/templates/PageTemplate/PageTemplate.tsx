import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import styles from './PageTemplate.module.css'

export type PageTemplateProps = { children: ReactNode; width?: 'narrow' | 'wide' }

/** Esqueleto de página de leitura: só layout e ritmo vertical, nenhum dado. */
export function PageTemplate({ children, width = 'wide' }: PageTemplateProps) {
  return (
    <main className={cn(styles.page, width === 'narrow' && styles.narrow)} id="conteudo">
      {children}
    </main>
  )
}

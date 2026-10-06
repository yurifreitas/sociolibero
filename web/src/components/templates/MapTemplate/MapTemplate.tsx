import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import styles from './MapTemplate.module.css'

export type MapTemplateProps = {
  sidebar: ReactNode
  map: ReactNode
  /** painel de detalhe; quando ausente, o mapa ocupa o espaço */
  detail?: ReactNode
}

export function MapTemplate({ sidebar, map, detail }: MapTemplateProps) {
  return (
    <main className={cn(styles.root, !!detail && styles.withDetail)} id="conteudo">
      <aside className={styles.sidebar} aria-label="Controles do mapa">
        {sidebar}
      </aside>
      <div className={styles.map}>{map}</div>
      {detail && (
        <aside className={styles.detail} aria-label="Detalhe do município">
          {detail}
        </aside>
      )}
    </main>
  )
}

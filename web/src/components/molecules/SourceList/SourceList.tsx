import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import type { Fonte } from '@/features/data/schemas'
import styles from './SourceList.module.css'

export function SourceList({ fontes, title = 'Fontes' }: { fontes: Fonte[] | null | undefined; title?: string }) {
  if (!fontes || fontes.length === 0) return null
  return (
    <div className={styles.root}>
      <h4 className={styles.h}>{title}</h4>
      <ul className={styles.list}>
        {fontes.map((f, i) => (
          <li key={`${f.titulo}-${i}`}>
            {f.url ? (
              <a href={f.url} target="_blank" rel="noreferrer">
                {f.titulo} <Icon name="external" size={12} />
              </a>
            ) : (
              <span>{f.titulo}</span>
            )}
            {f.verificado === false && <Badge tone="warn">não verificado</Badge>}
            {f.verificado === true && <Badge tone="neutral">link ok</Badge>}
          </li>
        ))}
      </ul>
    </div>
  )
}

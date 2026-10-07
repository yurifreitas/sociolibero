import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import styles from './RefItem.module.css'

export type RefSeal = 'verificado' | 'a confirmar' | 'link ok'
export type RefItemData = { id: string; titulo: string; url?: string | null; seal: RefSeal; meta?: string; uso?: string | null }

const TONE = { verificado: 'pos', 'a confirmar': 'warn', 'link ok': 'neutral' } as const

/** Referência compacta com selo de verificação. */
export function RefItem({ r }: { r: RefItemData }) {
  const title = r.url && !r.url.startsWith('#') ? (
    <a href={r.url} target="_blank" rel="noreferrer" className={styles.title}>
      {r.titulo} <Icon name="external" size={12} />
    </a>
  ) : (
    <span className={styles.title}>{r.titulo}</span>
  )
  return (
    <li className={`card ${styles.item}`}>
      <div className={styles.row}>
        {title}
        <Badge tone={TONE[r.seal]}>{r.seal}</Badge>
      </div>
      {r.meta && <p className={styles.meta}>{r.meta}</p>}
      {r.uso && <p className={styles.use}>{r.uso}</p>}
    </li>
  )
}

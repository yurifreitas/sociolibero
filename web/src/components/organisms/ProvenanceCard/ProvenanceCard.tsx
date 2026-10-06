import { Badge } from '@/components/atoms/Badge'
import { fDateTime, fInt } from '@/lib/format'
import type { ElectionMeta } from '@/features/data/schemas'
import styles from './ProvenanceCard.module.css'

export type ProvenanceCardProps = { meta: ElectionMeta; municipios: number }

export function ProvenanceCard({ meta, municipios }: ProvenanceCardProps) {
  const isUrl = /^https?:\/\//.test(meta.fonte)
  const sem = meta.sem_correspondencia ?? []
  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <h3>{meta.rotulo}</h3>
        <div className={styles.badges}>
          {meta.mock && <Badge tone="warn">MOCK</Badge>}
          <Badge tone={meta.status === 'oficial' ? 'pos' : 'warn'}>{meta.status}</Badge>
        </div>
      </header>
      <dl className={styles.dl}>
        <dt>Fonte</dt>
        <dd>{isUrl ? <a href={meta.fonte} target="_blank" rel="noreferrer">{meta.fonte}</a> : <code>{meta.fonte}</code>}</dd>
        <dt>Baixado em</dt>
        <dd>{fDateTime(meta.baixado_em)}</dd>
        <dt>SHA-256</dt>
        <dd><code className={styles.hash}>{meta.sha256}</code></dd>
        <dt>Municípios</dt>
        <dd>{fInt(municipios)}{sem.length > 0 ? ` · ${fInt(sem.length)} sem correspondência no IBGE (fora do mapa)` : ''}</dd>
        <dt>Conferir</dt>
        <dd>{isUrl ? <code>curl -sL "{meta.fonte}" | sha256sum</code> : 'indisponível para dados de demonstração'}</dd>
      </dl>
    </article>
  )
}

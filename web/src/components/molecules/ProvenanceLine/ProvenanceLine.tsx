import { Badge } from '@/components/atoms/Badge'
import { fDateTime, shortHash } from '@/lib/format'
import type { ElectionMeta } from '@/features/data/schemas'
import styles from './ProvenanceLine.module.css'

export type ProvenanceLineProps = { meta: ElectionMeta }

/** Proveniência em uma linha: toda cifra exibida deve ser rastreável a isto. */
export function ProvenanceLine({ meta }: ProvenanceLineProps) {
  const isUrl = /^https?:\/\//.test(meta.fonte)
  return (
    <p className={styles.line}>
      {meta.mock && <Badge tone="warn">MOCK</Badge>}
      {meta.status !== 'oficial' && !meta.mock && <Badge tone="warn">Preliminar</Badge>}
      <span>
        Fonte:{' '}
        {isUrl ? (
          <a href={meta.fonte} target="_blank" rel="noreferrer">
            TSE (arquivo original)
          </a>
        ) : (
          <code>{meta.fonte}</code>
        )}
      </span>
      <span>baixado em {fDateTime(meta.baixado_em)}</span>
      <span>
        sha256 <code title={meta.sha256}>{shortHash(meta.sha256)}</code>
      </span>
    </p>
  )
}

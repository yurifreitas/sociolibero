import { fInt } from '@/lib/format'
import styles from './QuorumBar.module.css'

export type QuorumBarProps = {
  title: string
  seats: Record<string, number>
  quorum: number | null
}

const HUES = [264, 165, 70, 20, 310, 210]

/** Composição eleita vs. quórum exigido: a barra mostra o que cada bloco soma, o marcador mostra o piso. */
export function QuorumBar({ title, seats, quorum }: QuorumBarProps) {
  const entries = Object.entries(seats)
  const total = entries.reduce((a, [, v]) => a + v, 0)
  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <span>{title}</span>
        <span className={styles.q}>{quorum == null ? 'sem votação nesta Casa' : `quórum: ${fInt(quorum)} de ${fInt(total)}`}</span>
      </div>
      <div className={styles.bar} role="img" aria-label={`${title}: ${entries.map(([k, v]) => `${k} ${v}`).join(', ')}${quorum != null ? `; quórum ${quorum}` : ''}`}>
        {entries.map(([k, v], i) => (
          <i
            key={k}
            title={`${k}: ${v}`}
            style={{ width: `${(v / total) * 100}%`, background: k === 'outros' ? 'var(--border-strong)' : `oklch(62% .13 ${HUES[i % HUES.length]})` }}
          />
        ))}
        {quorum != null && <span className={styles.mark} style={{ left: `${(quorum / total) * 100}%` }} />}
      </div>
      <ul className={styles.legend}>
        {entries.map(([k, v], i) => (
          <li key={k}>
            <i style={{ background: k === 'outros' ? 'var(--border-strong)' : `oklch(62% .13 ${HUES[i % HUES.length]})` }} />
            {k} <span className="num">{fInt(v)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

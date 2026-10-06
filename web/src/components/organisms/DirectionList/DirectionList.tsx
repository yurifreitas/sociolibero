import { SourceList } from '@/components/molecules/SourceList'
import { toLines } from '@/features/historia/model'
import type { Historia } from '@/features/data/schemas'
import styles from '../PrincipleList/PrincipleList.module.css'

type Direcao = NonNullable<Historia['direcoes']>[number]

export function DirectionList({ items }: { items: Direcao[] }) {
  return (
    <ul className={styles.grid}>
      {items.map((d) => {
        const ev = toLines(d.evidencias)
        return (
          <li key={d.id} className={styles.card}>
            <h3 className={styles.h3}>{d.titulo}</h3>
            {d.descricao && <p>{d.descricao}</p>}
            {ev.length > 0 && (
              <section>
                <h4 className={styles.h4}>Evidências</h4>
                <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  {ev.map((l, i) => (
                    <li key={i}>
                      {l.label && <strong>{l.label}: </strong>}
                      {l.text}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <SourceList fontes={d.fontes} />
          </li>
        )
      })}
    </ul>
  )
}

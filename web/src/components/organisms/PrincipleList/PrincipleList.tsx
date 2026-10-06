import { SourceList } from '@/components/molecules/SourceList'
import type { Historia } from '@/features/data/schemas'
import styles from './PrincipleList.module.css'

type Principio = NonNullable<Historia['principios']>[number]

export function PrincipleList({ items }: { items: Principio[] }) {
  return (
    <ul className={styles.grid}>
      {items.map((p) => (
        <li key={p.id} className={styles.card}>
          <header>
            <h3 className={styles.h3}>{p.titulo}</h3>
            {(p.autor || p.ano) && (
              <p className={styles.by}>
                {[p.autor, p.ano != null ? String(p.ano) : ''].filter(Boolean).join(' · ')}
              </p>
            )}
          </header>
          {p.ideia && (
            <section>
              <h4 className={styles.h4}>Ideia</h4>
              <p>{p.ideia}</p>
            </section>
          )}
          {p.aplicacao_brasil && (
            <section>
              <h4 className={styles.h4}>Aplicação ao caso brasileiro</h4>
              <p>{p.aplicacao_brasil}</p>
            </section>
          )}
          <SourceList fontes={p.fontes} />
        </li>
      ))}
    </ul>
  )
}

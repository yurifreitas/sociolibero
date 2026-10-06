import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { SourceList } from '@/components/molecules/SourceList'
import { PODER_LABEL, toLines } from '@/features/historia/model'
import type { Evento, Periodo } from '@/features/data/schemas'
import styles from './EventPanel.module.css'

export type EventPanelProps = { evento: Evento; periodo?: Periodo; regimeColor: (r: string) => string; onClose: () => void }

function Lines({ title, value }: { title: string; value: Evento['impacto_poderes'] }) {
  const lines = toLines(value)
  if (lines.length === 0) return null
  return (
    <section className={styles.block}>
      <h3 className={styles.h3}>{title}</h3>
      <ul className={styles.list}>
        {lines.map((l, i) => (
          <li key={i}>
            {l.label && <strong>{PODER_LABEL[l.label.toLowerCase()] ?? l.label}: </strong>}
            {l.text}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function EventPanel({ evento: e, periodo, regimeColor, onClose }: EventPanelProps) {
  return (
    <article className={styles.root} aria-label={e.titulo}>
      <header className={styles.head}>
        <div className={styles.meta}>
          <span className={styles.date}>{e.data}</span>
          <Badge>{e.categoria}</Badge>
          {periodo && (
            <Badge>
              <i className={styles.sw} style={{ background: regimeColor(periodo.regime) }} /> {periodo.rotulo}
            </Badge>
          )}
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar evento">
          <Icon name="x" size={16} />
        </button>
      </header>
      <h2 className={styles.h2}>{e.titulo}</h2>
      {e.resumo && <p className={styles.resumo}>{e.resumo}</p>}
      <div className={styles.grid}>
        <Lines title="Impacto nos poderes" value={e.impacto_poderes} />
        <Lines title="Controvérsias" value={e.controversias} />
      </div>
      <SourceList fontes={e.fontes} />
    </article>
  )
}

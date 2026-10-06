import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { PODER_LABEL } from '@/features/historia/model'
import type { Periodo } from '@/features/data/schemas'
import styles from '../EventPanel/EventPanel.module.css'
import local from './PeriodPanel.module.css'

export type PeriodPanelProps = { periodo: Periodo; regimeColor: (r: string) => string; eventCount: number; onClose: () => void }

export function PeriodPanel({ periodo: p, regimeColor, eventCount, onClose }: PeriodPanelProps) {
  const poderes = (['executivo', 'legislativo', 'judiciario'] as const).filter((k) => p.poderes?.[k])
  return (
    <article className={styles.root} aria-label={p.rotulo}>
      <header className={styles.head}>
        <div className={styles.meta}>
          <span className={styles.date}>
            {p.inicio}–{p.fim ?? 'hoje'}
          </span>
          <Badge>
            <i className={styles.sw} style={{ background: regimeColor(p.regime) }} /> {p.regime}
          </Badge>
          <Badge>{eventCount} eventos listados</Badge>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar período">
          <Icon name="x" size={16} />
        </button>
      </header>
      <h2 className={styles.h2}>{p.rotulo}</h2>
      {p.descricao && <p className={styles.resumo}>{p.descricao}</p>}
      {poderes.length > 0 && (
        <div className={local.poderes}>
          {poderes.map((k) => (
            <section key={k} className={local.card}>
              <h3 className={styles.h3}>{PODER_LABEL[k]}</h3>
              <p>{p.poderes?.[k]}</p>
            </section>
          ))}
        </div>
      )}
      {p.constituicao && (
        <section className={styles.block}>
          <h3 className={styles.h3}>Constituição vigente</h3>
          <p>{p.constituicao}</p>
        </section>
      )}
    </article>
  )
}

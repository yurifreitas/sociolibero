import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { SourceList } from '@/components/molecules/SourceList'
import { Link } from 'react-router-dom'
import { hrefTrecho, type TrechoRef } from '@/features/biblioteca/model'
import { PODER_LABEL, toLines } from '@/features/historia/model'
import type { Evento, Periodo } from '@/features/data/schemas'
import styles from './EventPanel.module.css'

export type EventPanelProps = {
  evento: Evento
  periodo?: Periodo
  regimeColor: (r: string) => string
  onClose: () => void
  /** trechos-chave da biblioteca que citam este evento */
  textos?: TrechoRef[]
  /** eleições e marcos da linha do tempo eleitoral ligados a este evento */
  eleicoes?: { id: string; label: string }[]
}

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

export function EventPanel({ evento: e, periodo, regimeColor, onClose, textos = [], eleicoes = [] }: EventPanelProps) {
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
      {(textos.length > 0 || eleicoes.length > 0) && (
        <section className={styles.block} aria-label="Ligações com a biblioteca e a linha do tempo eleitoral">
          {textos.length > 0 && (
            <>
              <h3 className={styles.h3}>Textos originais ({textos.length})</h3>
              <ul className={styles.list}>
                {textos.slice(0, 8).map((t) => (
                  <li key={`${t.doc.id}-${t.trecho.id}`}>
                    <Link to={hrefTrecho(t)}><Icon name="book" size={12} /> {t.trecho.rotulo}</Link> <span>· {t.doc.titulo.length > 60 ? `${t.doc.titulo.slice(0, 60)}…` : t.doc.titulo}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {eleicoes.length > 0 && (
            <>
              <h3 className={styles.h3}>Na linha do tempo eleitoral</h3>
              <ul className={styles.list}>
                {eleicoes.slice(0, 8).map((x) => (
                  <li key={x.id}><Link to={`/eleicoes?e=${x.id}`}>{x.label}</Link></li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
      <SourceList fontes={e.fontes} />
    </article>
  )
}

import styles from './LegendBar.module.css'

export type LegendBarProps = {
  title: string
  /** cores CSS, de min a max */
  stops: string[]
  ticks: { pos: number; label: string }[] // pos 0..1
  note?: string
  nodata?: string
}

/** Legenda contínua com rótulos diretos nos extremos e no meio (sem legenda categórica). */
export function LegendBar({ title, stops, ticks, note, nodata }: LegendBarProps) {
  return (
    <figure className={styles.legend} aria-label={`Legenda: ${title}`}>
      <figcaption className={styles.title}>{title}</figcaption>
      <div className={styles.bar} style={{ background: `linear-gradient(to right, ${stops.join(', ')})` }} />
      <div className={styles.ticks} aria-hidden="true">
        {ticks.map((t) => (
          <span key={t.pos} style={{ left: `${t.pos * 100}%` }} className={styles.tick}>
            {t.label}
          </span>
        ))}
      </div>
      <div className={styles.foot}>
        {note && <span>{note}</span>}
        {nodata && (
          <span className={styles.nodata}>
            <i style={{ background: nodata }} /> sem dado
          </span>
        )}
      </div>
    </figure>
  )
}

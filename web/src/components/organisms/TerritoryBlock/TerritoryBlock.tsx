import { fInt, fPct } from '@/lib/format'
import { TERRITORY_WARNING, toPercent } from '@/features/territorios/model'
import type { Territorios } from '@/features/data/schemas'
import styles from './TerritoryBlock.module.css'

const NODATA = 'sem dado'
const n = (v: number | null | undefined) => (v == null ? NODATA : fInt(v))
const ha = (v: number | null | undefined) => (v == null ? NODATA : `${fInt(v)} ha`)

function list(v: string | string[] | null | undefined) {
  return v == null ? [] : Array.isArray(v) ? v : [v]
}

export type TerritoryBlockProps = { territorios: Territorios; ibge: string; compact?: boolean }

/** Números territoriais do município. `null` é "sem dado" e nunca é exibido como zero. */
export function TerritoryBlock({ territorios, ibge, compact }: TerritoryBlockProps) {
  const r = territorios.linhas[ibge]
  const meta = territorios.meta
  const fontes = list(meta?.fontes as string | string[] | undefined)
  const lacunas = list(meta?.lacunas)
  const pct = (v: number | null | undefined) => {
    const p = toPercent(territorios, v)
    return p == null ? '' : ` · ${fPct(p)}`
  }
  return (
    <section className={styles.root} aria-label="Povos e territórios">
      <h3 className={styles.h3}>Povos e territórios</h3>
      {!r ? (
        <p className={styles.muted}>Município sem registro em territorios.json (sem dado, não zero).</p>
      ) : (
        <dl className={styles.dl}>
          <div><dt>População total</dt><dd>{n(r.pop_total)}</dd></div>
          <div><dt>População indígena</dt><dd>{n(r.pop_indigena)}{pct(r.pct_indigena)}</dd></div>
          <div><dt>População quilombola</dt><dd>{n(r.pop_quilombola)}{pct(r.pct_quilombola)}</dd></div>
          <div><dt>Pretos e pardos</dt><dd>{r.pct_pretos_pardos == null ? NODATA : fPct(toPercent(territorios, r.pct_pretos_pardos))}</dd></div>
          <div><dt>Terras indígenas</dt><dd>{r.ti_n == null ? NODATA : `${fInt(r.ti_n)} · ${ha(r.ti_area_ha)}`}</dd></div>
          <div><dt>Territórios quilombolas</dt><dd>{r.quilombo_n == null ? NODATA : `${fInt(r.quilombo_n)} · ${ha(r.quilombo_area_ha)}`}</dd></div>
        </dl>
      )}
      <p className={styles.warning}>{TERRITORY_WARNING}</p>
      {meta?.aviso && <p className={styles.muted}>{meta.aviso}</p>}
      {(!compact || lacunas.length > 0) && (
        <details className={styles.details} open={!compact}>
          <summary>Fontes e lacunas</summary>
          {fontes.length > 0 && (
            <ul>
              {fontes.map((f, i) => (
                <li key={i}>{typeof f === 'string' ? f : (f as { titulo?: string }).titulo}</li>
              ))}
            </ul>
          )}
          {lacunas.length > 0 && (
            <>
              <strong>Lacunas:</strong>
              <ul>
                {lacunas.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </>
          )}
        </details>
      )}
    </section>
  )
}

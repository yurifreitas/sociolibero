import { fInt, fPct } from '@/lib/format'
import { pctOf, ranking } from '@/features/data/selectors'
import type { Election } from '@/features/data/schemas'
import styles from './SeriesTable.module.css'

export type SeriesTableProps = { ibge: string; elections: Election[] }

/** Série entre pleitos para o município: mesma linha, mesmas colunas, comparável de relance. */
export function SeriesTable({ ibge, elections }: SeriesTableProps) {
  const rows = elections.map((e) => ({ e, r: e.linhas[ibge] })).filter((x) => x.r)
  if (rows.length === 0) return <p className={styles.muted}>Município sem dados nos pleitos carregados.</p>
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <caption className="sr-only">Série entre pleitos do município</caption>
        <thead>
          <tr>
            <th scope="col">Pleito</th>
            <th scope="col" className={styles.r}>Aptos</th>
            <th scope="col" className={styles.r}>Comparec.</th>
            <th scope="col" className={styles.r}>Brancos+nulos</th>
            <th scope="col">Líder (% válidos)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ e, r }) => {
            const lead = ranking(r!, e.meta)[0]
            return (
              <tr key={e.meta.id}>
                <th scope="row">{e.meta.rotulo}</th>
                <td className={styles.r}>{fInt(r!.aptos)}</td>
                <td className={styles.r}>{fPct(pctOf(r!.comparecimento, r!.aptos))}</td>
                <td className={styles.r}>{fPct(pctOf(r!.brancos + r!.nulos, r!.comparecimento))}</td>
                <td>{lead ? `${lead.label} · ${fPct(lead.pct)}` : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

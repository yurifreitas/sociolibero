import styles from './RankTable.module.css'

export type RankRow = { idx: number; nome: string; uf: string; label: string }
export type RankTableProps = {
  title: string
  top: RankRow[]
  bottom: RankRow[]
  onPick: (idx: number) => void
}

/** Equivalente textual do mapa (a11y): maiores e menores valores da métrica atual. */
export function RankTable({ title, top, bottom, onPick }: RankTableProps) {
  const block = (cap: string, rows: RankRow[]) => (
    <table className={styles.table}>
      <caption>{cap}</caption>
      <thead>
        <tr>
          <th scope="col">Município</th>
          <th scope="col" className={styles.r}>
            Valor
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.idx}>
            <th scope="row">
              <button type="button" className={styles.link} onClick={() => onPick(r.idx)}>
                {r.nome} <span className={styles.uf}>{r.uf}</span>
              </button>
            </th>
            <td className={styles.r}>{r.label}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
  return (
    <details className={styles.details}>
      <summary>Ver como tabela · {title}</summary>
      <div className={styles.grid}>
        {block('Maiores valores', top)}
        {block('Menores valores', bottom)}
      </div>
    </details>
  )
}

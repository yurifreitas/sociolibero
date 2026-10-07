import { STATE_SHORT } from '@/features/evolucoes/model'
import styles from './TransitionMatrix.module.css'

export type TransitionMatrixProps = {
  estados: string[]
  P: number[][]
  lo?: number[][] | null
  hi?: number[][] | null
  caption: string
}

const f = (x: number) => (x >= 0.1 ? `${Math.round(x * 100)}` : (x * 100).toFixed(1).replace('.', ','))

/** Matriz de transição como mapa de calor acessível (tabela), com o IC90 da célula sempre visível. */
export function TransitionMatrix({ estados, P, lo, hi, caption }: TransitionMatrixProps) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={styles.corner}>de ↓ · para →</th>
            {estados.map((e) => (
              <th key={e} scope="col">{STATE_SHORT[e] ?? e}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {estados.map((e, i) => (
            <tr key={e}>
              <th scope="row">{STATE_SHORT[e] ?? e}</th>
              {estados.map((_, j) => {
                const p = P[i]?.[j] ?? 0
                const a = lo?.[i]?.[j]
                const b = hi?.[i]?.[j]
                return (
                  <td key={j} style={{ background: `color-mix(in oklch, var(--brand) ${Math.round(Math.sqrt(p) * 62)}%, var(--surface))` }}>
                    <span className={styles.p}>{f(p)}%</span>
                    {a != null && b != null && <span className={styles.ic}>{f(a)}–{f(b)}</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>Cada linha soma 100%. Em pequeno: intervalo de credibilidade de 90% da célula (incerteza do parâmetro).</p>
    </div>
  )
}

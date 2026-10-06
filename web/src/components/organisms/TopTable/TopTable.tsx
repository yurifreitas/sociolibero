import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { EmptyState } from '@/components/molecules/EmptyState'
import { Field } from '@/components/molecules/Field'
import { fInt } from '@/lib/format'
import styles from './TopTable.module.css'

export type TopRow = { ibge: string; nome: string; uf: string; n_secoes: number; score: number; confianca: string; flags: string[] }
export type TopTableProps = { rows: TopRow[]; electionId: string; flagLabels: Record<string, string> }

const PAGE = 25

export function TopTable({ rows, electionId, flagLabels }: TopTableProps) {
  const [uf, setUf] = useState('')
  const [minSecoes, setMinSecoes] = useState(30)
  const [limit, setLimit] = useState(PAGE)
  const ufs = useMemo(() => [...new Set(rows.map((r) => r.uf))].sort(), [rows])
  const filtered = useMemo(
    () => rows.filter((r) => (!uf || r.uf === uf) && r.n_secoes >= minSecoes).sort((a, b) => b.score - a.score),
    [rows, uf, minSecoes],
  )
  return (
    <div className={styles.wrap}>
      <div className={styles.filters}>
        <Field label="UF">
          {(id) => (
            <Select id={id} value={uf} onChange={(e) => { setUf(e.target.value); setLimit(PAGE) }}>
              <option value="">Todas</option>
              {ufs.map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Mínimo de seções" hint="Testes com poucas seções têm baixo poder.">
          {(id) => (
            <input
              id={id}
              type="number"
              min={0}
              step={10}
              value={minSecoes}
              className={styles.input}
              onChange={(e) => { setMinSecoes(Math.max(0, Number(e.target.value) || 0)); setLimit(PAGE) }}
            />
          )}
        </Field>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon="shield" title="Nenhum município com esses filtros">Reduza o mínimo de seções ou escolha outra UF.</EmptyState>
      ) : (
        <>
          <p className={styles.count}>{fInt(filtered.length)} municípios · ordenados por prioridade de auditoria (não é prova de irregularidade)</p>
          <div className={styles.scroll}>
            <table className={styles.table}>
              <caption className="sr-only">Municípios por prioridade de auditoria</caption>
              <thead>
                <tr>
                  <th scope="col">Município</th>
                  <th scope="col" className={styles.r}>Score</th>
                  <th scope="col" className={styles.r}>Seções</th>
                  <th scope="col">Confiança</th>
                  <th scope="col">Testes sinalizados</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, limit).map((r) => (
                  <tr key={r.ibge}>
                    <th scope="row">
                      <Link to={`/municipio/${r.ibge}?e=${electionId}`}>{r.nome}</Link> <span className={styles.uf}>{r.uf}</span>
                    </th>
                    <td className={styles.r}><strong>{Math.round(r.score)}</strong></td>
                    <td className={styles.r}>{fInt(r.n_secoes)}</td>
                    <td>{r.confianca}</td>
                    <td className={styles.flags}>
                      {r.flags.length === 0 ? <span className={styles.uf}>—</span> : r.flags.map((f) => <Badge key={f} tone="warn">{flagLabels[f] ?? f}</Badge>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > limit && (
            <Button onClick={() => setLimit((l) => l + PAGE)}>Mostrar mais {Math.min(PAGE, filtered.length - limit)}</Button>
          )}
        </>
      )}
    </div>
  )
}

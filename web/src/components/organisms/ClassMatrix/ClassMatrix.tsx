import { useMemo, useState } from 'react'
import type { Celula, Classe } from '@/features/classes/schemas'
import { cn } from '@/lib/cn'
import styles from './ClassMatrix.module.css'

const SIMB: Record<string, { s: string; label: string; cls: string }> = {
  ganha: { s: '▲', label: 'ganha', cls: styles.g ?? '' },
  perde: { s: '▼', label: 'perde', cls: styles.p ?? '' },
  ambiguo: { s: '◆', label: 'ambíguo', cls: styles.a ?? '' },
  ambíguo: { s: '◆', label: 'ambíguo', cls: styles.a ?? '' },
}
const simb = (v: string) => SIMB[v.toLowerCase()] ?? { s: '?', label: v, cls: styles.a ?? '' }

export type ClassMatrixProps = { celulas: Celula[]; classes: Classe[]; onClasse: (id: string) => void }

/**
 * Matriz regra × classe: só as células que têm leitura (as vazias ficam em branco, não “neutras”).
 * Cada célula é uma hipótese com nota; ▲ ganha, ▼ perde, ◆ ambíguo (forma e cor, nunca só cor).
 */
export function ClassMatrix({ celulas, classes, onClasse }: ClassMatrixProps) {
  const regras = useMemo(() => [...new Set(celulas.map((c) => c.regra))], [celulas])
  const cols = useMemo(() => {
    const ids = new Set(celulas.map((c) => c.classe_id))
    return classes.filter((c) => ids.has(c.id))
  }, [celulas, classes])
  const idx = useMemo(() => new Map(celulas.map((c) => [`${c.regra}||${c.classe_id}`, c])), [celulas])
  const [sel, setSel] = useState<Celula | null>(null)
  const nomeClasse = (id: string) => classes.find((c) => c.id === id)?.nome ?? id
  const tot = { ganha: 0, perde: 0, amb: 0 }
  for (const c of celulas) {
    const k = simb(c.ganha_ou_perde).label
    if (k === 'ganha') tot.ganha++
    else if (k === 'perde') tot.perde++
    else tot.amb++
  }

  return (
    <div className={styles.root}>
      <p className={styles.legend}>
        <span><b className={styles.g}>▲</b> ganha ({tot.ganha})</span>
        <span><b className={styles.p}>▼</b> perde ({tot.perde})</span>
        <span><b className={styles.a}>◆</b> ambíguo ({tot.amb})</span>
        <span className={styles.hintLeg}>Célula vazia = sem leitura registrada (não quer dizer “indiferente”). Todas são hipóteses, com leitura contrária nas fichas das classes.</span>
      </p>
      <div className={styles.wrap} tabIndex={0} aria-label="Matriz regra por classe (role para os lados em telas estreitas)">
        <table className={styles.table}>
          <caption className="sr-only">Matriz de regras eleitorais por classe: ganha, perde ou ambíguo</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.corner}>Regra</th>
              {cols.map((c) => (
                <th key={c.id} scope="col" className={styles.colh}>
                  <button type="button" className={styles.colBtn} onClick={() => onClasse(c.id)} title={`${c.nome}: abrir a ficha`}>
                    <span>{c.nome}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regras.map((r) => (
              <tr key={r}>
                <th scope="row" className={styles.rowh}>{r}</th>
                {cols.map((c) => {
                  const cell = idx.get(`${r}||${c.id}`)
                  if (!cell) return <td key={c.id} className={styles.empty} aria-label="sem leitura registrada" />
                  const m = simb(cell.ganha_ou_perde)
                  const on = sel === cell
                  return (
                    <td key={c.id} className={styles.cell}>
                      <button type="button" className={cn(styles.btn, m.cls, on && styles.on)} aria-pressed={on} aria-label={`${r} × ${c.nome}: ${m.label}`} title={cell.nota ?? m.label} onClick={() => setSel(on ? null : cell)}>
                        {m.s}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.detail} role="status" aria-live="polite">
        {sel ? (
          <>
            <p className={styles.dTitle}><b className={simb(sel.ganha_ou_perde).cls}>{simb(sel.ganha_ou_perde).s}</b> {nomeClasse(sel.classe_id)} <span>{simb(sel.ganha_ou_perde).label}</span></p>
            <p className={styles.dRegra}>{sel.regra}</p>
            <p className={styles.dNota}>{sel.nota ?? 'Sem nota.'}</p>
            <button type="button" className={styles.link} onClick={() => onClasse(sel.classe_id)}>Abrir a ficha da classe</button>
          </>
        ) : (
          <p className={styles.dNota}>Selecione uma célula para ler a nota e a hipótese por trás dela.</p>
        )}
      </div>
    </div>
  )
}

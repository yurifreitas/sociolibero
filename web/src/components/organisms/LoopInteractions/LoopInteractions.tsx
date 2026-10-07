import { useId } from 'react'
import { tipoShort } from '@/features/aneis/model'
import type { Aneis } from '@/features/aneis/schemas'
import { cn } from '@/lib/cn'
import styles from './LoopInteractions.module.css'

export type LoopInteractionsProps = {
  aneis: Aneis['aneis']
  interacoes: NonNullable<Aneis['interacoes']>
  selected: string | null
  onSelect: (id: string) => void
}

const W = 520
const C = W / 2
const R = 200
const TYPE_COLOR: Record<string, string> = {
  reforca: 'var(--st-derivado)',
  aciona: 'var(--accent)',
  modula: 'var(--text-subtle)',
  amortece: 'var(--st-oficial)',
  enfraquece: 'var(--neg)',
}
const TYPE_LABEL: Record<string, string> = { reforca: 'reforça', aciona: 'aciona', modula: 'modula', amortece: 'amortece', enfraquece: 'enfraquece' }

/** Grafo das interações entre anéis (qual anel alimenta, amortece ou aciona qual), nós em círculo. */
export function LoopInteractions({ aneis, interacoes, selected, onSelect }: LoopInteractionsProps) {
  const uid = useId().replace(/:/g, '')
  const idx = new Map(aneis.map((a, i) => [a.id, i]))
  const n = aneis.length
  const P = (i: number, r = R) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) }
  }
  const types = [...new Set(interacoes.map((x) => x.tipo))]
  const touching = (x: (typeof interacoes)[number]) => selected != null && (x.de === selected || x.para === selected)
  const list = selected ? interacoes.filter(touching) : []
  const nameOf = (id: string) => aneis[idx.get(id) ?? -1]?.nome ?? id
  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${W} ${W}`} className={styles.svg} role="img" aria-label={`Grafo de ${interacoes.length} interações entre ${n} anéis`}>
        <defs>
          {types.map((t) => (
            <marker key={t} id={`${uid}-${t}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" fill={TYPE_COLOR[t] ?? 'var(--text-muted)'} />
            </marker>
          ))}
        </defs>
        {interacoes.map((x, k) => {
          const i = idx.get(x.de)
          const j = idx.get(x.para)
          if (i == null || j == null) return null
          const a = P(i, R - 17)
          const b = P(j, R - 17)
          const ctrl = { x: C + (((a.x + b.x) / 2 - C) * 0.32), y: C + (((a.y + b.y) / 2 - C) * 0.32) }
          const on = selected == null || touching(x)
          return (
            <path key={k} d={`M${a.x},${a.y} Q${ctrl.x},${ctrl.y} ${b.x},${b.y}`} fill="none" stroke={TYPE_COLOR[x.tipo] ?? 'var(--text-muted)'} strokeWidth={on && selected ? 2.4 : 1.4} opacity={on ? (selected ? 0.95 : 0.55) : 0.08} markerEnd={`url(#${uid}-${x.tipo})`}>
              <title>{`${nameOf(x.de)} ${TYPE_LABEL[x.tipo] ?? x.tipo} ${nameOf(x.para)}`}</title>
            </path>
          )
        })}
        {aneis.map((a, i) => {
          const p = P(i)
          const on = a.id === selected
          return (
            <g key={a.id} className={styles.node} onClick={() => onSelect(a.id)} tabIndex={0} role="button" aria-label={`Anel ${i + 1}: ${a.nome}`} aria-pressed={on} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(a.id))}>
              <circle cx={p.x} cy={p.y} r="17" className={cn(styles.disc, a.tipo === 'reforco' ? styles.r : styles.b, on && styles.on)} />
              <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" className={styles.num}>{i + 1}</text>
            </g>
          )
        })}
      </svg>
      <div className={styles.side}>
        <ul className={styles.legend} aria-label="Tipos de interação">
          {types.map((t) => (
            <li key={t}><i style={{ background: TYPE_COLOR[t] }} /> {TYPE_LABEL[t] ?? t}</li>
          ))}
        </ul>
        <ol className={styles.names}>
          {aneis.map((a, i) => (
            <li key={a.id}>
              <button type="button" className={cn(styles.nm, a.id === selected && styles.nmOn)} onClick={() => onSelect(a.id)}>
                <b>{i + 1}</b> {a.nome.replace(/^Anel\s*/i, '')} <em>({tipoShort(a.tipo)})</em>
              </button>
            </li>
          ))}
        </ol>
        {selected && (
          <div className={styles.det} aria-live="polite">
            <h4 className={styles.h4}>Interações do anel selecionado ({list.length})</h4>
            {list.length === 0 ? <p className={styles.none}>Sem interações registradas.</p> : (
              <ul>
                {list.map((x, k) => (
                  <li key={k}>
                    <strong>{nameOf(x.de)}</strong> <span style={{ color: TYPE_COLOR[x.tipo] }}>{TYPE_LABEL[x.tipo] ?? x.tipo}</span> <strong>{nameOf(x.para)}</strong>
                    {x.descricao && <p>{x.descricao}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

import { useMemo, type KeyboardEvent } from 'react'
import type { Antes } from '@/features/conhecimento/schemas'
import { parseAP } from '@/features/conhecimento/model'
import styles from './DeepTimeline.module.css'

export type Sel = { kind: 'e' | 'c'; id: string } | null
const W = 1000
const M = { l: 14, r: 14 }
const MAX = 13500
const ROW = 20
const TICKS = [13000, 10000, 7000, 5000, 3000, 2000, 1000, 500, 0]

type Item = { id: string; kind: 'e' | 'c'; label: string; from: number; to: number; x0: number; x1: number; row: number }

const x = (ap: number) => M.l + (1 - Math.sqrt(Math.max(0, Math.min(MAX, ap)) / MAX)) * (W - M.l - M.r)

function pack(items: Omit<Item, 'row'>[]): Item[] {
  const ends: number[] = []
  return [...items]
    .sort((a, b) => a.x0 - b.x0)
    .map((it) => {
      let r = ends.findIndex((e) => it.x0 > e + 5)
      if (r === -1) {
        r = ends.length
        ends.push(0)
      }
      ends[r] = it.x1
      return { ...it, row: r }
    })
}

/**
 * Linha do tempo em anos antes do presente (AP) em escala de raiz quadrada: dá mais espaço ao período recente,
 * onde há mais registro. Faixa 1 = períodos; faixa 2 = eventos climáticos (barras = intervalo de datação, com incerteza);
 * faixa 3 = eventos humanos. Clique ou Enter seleciona.
 */
export function DeepTimeline({ data, selected, onSelect }: { data: Antes; selected: Sel; onSelect: (s: Sel) => void }) {
  const climate = useMemo(
    () =>
      pack(
        (data.clima_eventos ?? []).map((c) => {
          const a = x(c.inicio_ap)
          const b = x(c.fim_ap)
          return { id: c.id, kind: 'c' as const, label: c.titulo, from: c.inicio_ap, to: c.fim_ap, x0: a, x1: Math.max(b, a + 8) }
        }),
      ),
    [data.clima_eventos],
  )
  const events = useMemo(
    () =>
      pack(
        data.eventos.flatMap((e) => {
          const r = parseAP(e.data_ap)
          if (!r) return []
          const a = x(r.from)
          const b = x(r.to)
          return [{ id: e.id, kind: 'e' as const, label: e.titulo, from: r.from, to: r.to, x0: a, x1: Math.max(b, a + 8) }]
        }),
      ),
    [data.eventos],
  )
  const unplaced = data.eventos.length - events.length
  const cRows = Math.max(1, ...climate.map((i) => i.row + 1))
  const eRows = Math.max(1, ...events.map((i) => i.row + 1))
  const yP = 34
  const yC = yP + 50
  const yE = yC + cRows * ROW + 36
  const H = yE + eRows * ROW + 28

  const key = (it: Item) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(selected?.id === it.id ? null : { kind: it.kind, id: it.id })
    }
  }
  const bar = (it: Item, y: number, cls: string) => {
    const on = selected?.id === it.id && selected.kind === it.kind
    return (
      <g key={it.kind + it.id}>
        <rect
          x={it.x0}
          y={y + it.row * ROW}
          width={Math.max(8, it.x1 - it.x0)}
          height={ROW - 6}
          rx={4}
          className={`${cls} ${on ? styles.on : ''}`}
          tabIndex={0}
          role="button"
          aria-pressed={on}
          aria-label={`${it.label}, de ${it.from.toLocaleString('pt-BR')} a ${it.to.toLocaleString('pt-BR')} anos antes do presente`}
          onClick={() => onSelect(on ? null : { kind: it.kind, id: it.id })}
          onKeyDown={key(it)}
        >
          <title>{`${it.label} (${it.from.toLocaleString('pt-BR')}–${it.to.toLocaleString('pt-BR')} AP)`}</title>
        </rect>
      </g>
    )
  }

  return (
    <figure className={`card ${styles.fig}`} tabIndex={0} aria-label="Linha do tempo (role horizontalmente em telas estreitas)">
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="group" aria-label="Linha do tempo em anos antes do presente: períodos, eventos climáticos e eventos humanos">
        {TICKS.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={22} y2={H - 22} className={styles.grid} />
            <text x={x(t)} y={14} textAnchor={t === 13000 ? 'start' : t === 0 ? 'end' : 'middle'} className={styles.tick}>
              {t === 0 ? 'hoje' : `${t.toLocaleString('pt-BR')} AP`}
            </text>
          </g>
        ))}
        <line x1={x(450)} x2={x(450)} y1={22} y2={H - 22} className={styles.c1500} />
        <text x={x(450) - 4} y={H - 8} textAnchor="end" className={styles.c1500t}>1500 d.C. (450 AP)</text>

        {data.periodos.map((p, i) => (
          <g key={p.id}>
            <rect x={x(p.inicio_ap)} y={yP} width={Math.max(2, x(p.fim_ap) - x(p.inicio_ap))} height={34} rx={8} className={i % 2 ? styles.pB : styles.pA} />
            <text x={x(p.inicio_ap) + 10} y={yP + 21} className={styles.pText}>{p.rotulo}</text>
          </g>
        ))}

        <text x={M.l} y={yC - 8} className={styles.lane}>Clima (datação com incerteza)</text>
        {climate.map((it) => bar(it, yC, styles.cBar ?? ''))}
        <text x={M.l} y={yE - 8} className={styles.lane}>Povos, sítios e eventos</text>
        {events.map((it) => bar(it, yE, styles.eBar ?? ''))}
      </svg>
      <figcaption className={styles.cap}>
        <span>Escala em raiz quadrada: o recente ocupa mais espaço.</span>
        <span><i className={styles.swC} /> clima</span>
        <span><i className={styles.swE} /> humano</span>
        {unplaced > 0 && <span>{unplaced} evento(s) sem data legível ficam só na lista.</span>}
      </figcaption>
    </figure>
  )
}

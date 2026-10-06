import { useMemo } from 'react'
import { assignLanes, eventTrilhas, isCrossing, parseYear, periodEnd, periodStart, timelineRange, trilhaLabel } from '@/features/historia/model'
import type { Evento, Periodo } from '@/features/data/schemas'
import styles from './HistoryTimeline.module.css'

export type TimelineSelection = { kind: 'evento' | 'periodo'; id: string } | null
export type HistoryTimelineProps = {
  periodos: Periodo[]
  eventos: Evento[]
  allEventos: Evento[]
  /** faixas visíveis, em ordem */
  trilhas: string[]
  selected: TimelineSelection
  onSelect: (s: TimelineSelection) => void
  regimeColor: (regime: string) => string
}

const PAD = 28
const LANE_H = 26
const LANE_HEAD = 24 // faixa de cabeçalho com o rótulo da trilha
const LANE_PAD = 8
const AXIS_H = 40
const PERIODS_H = 64

type Placement = { e: Evento; year: number; trilha: string; sub: number }

export function HistoryTimeline({ periodos, eventos, allEventos, trilhas, selected, onSelect, regimeColor }: HistoryTimelineProps) {
  const { min, max } = useMemo(() => timelineRange(periodos, allEventos), [periodos, allEventos])
  const range = max - min
  const width = Math.min(6000, Math.max(960, range * 9))
  const x = (y: number) => PAD + ((y - min) / range) * width
  const step = range > 300 ? 50 : range > 120 ? 20 : 10
  const ticks = useMemo(() => {
    const out: number[] = []
    for (let y = Math.ceil(min / step) * step; y <= max; y += step) out.push(y)
    return out
  }, [min, max, step])

  // um evento pode aparecer em mais de uma faixa (cruzamento)
  const layout = useMemo(() => {
    const raw: Omit<Placement, 'sub'>[] = []
    for (const e of eventos) {
      const year = parseYear(e.data)
      if (year == null) continue
      for (const t of eventTrilhas(e)) if (trilhas.includes(t)) raw.push({ e, year, trilha: t })
    }
    const lanes = trilhas.map((t) => {
      const items = raw.filter((r) => r.trilha === t)
      const subs = assignLanes(items.map((r) => x(r.year)), 20)
      return { key: t, items: items.map((r, i) => ({ ...r, sub: subs[i] ?? 0 })), count: Math.max(1, ...subs.map((s) => s + 1)) }
    })
    let top = AXIS_H + PERIODS_H + 12
    const placed = lanes.map((l) => {
      const h = LANE_HEAD + l.count * LANE_H + LANE_PAD
      const out = { ...l, top, h }
      top += h + 6
      return out
    })
    return { lanes: placed, total: top + 8 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventos, trilhas, min, range, width])

  const laneByKey = new Map(layout.lanes.map((l) => [l.key, l]))
  const centerY = (key: string, sub: number) => (laneByKey.get(key)?.top ?? 0) + LANE_HEAD + sub * LANE_H + 10

  // conectores de cruzamento: linha vertical entre as faixas em que o evento aparece
  const connectors = layout.lanes
    .flatMap((l) => l.items)
    .filter((p) => isCrossing(p.e))
    .reduce<Map<string, { e: Evento; year: number; ys: number[] }>>((m, p) => {
      const cur = m.get(p.e.id) ?? { e: p.e, year: p.year, ys: [] }
      cur.ys.push(centerY(p.trilha, p.sub))
      m.set(p.e.id, cur)
      return m
    }, new Map())

  return (
    <div className={styles.scroll} tabIndex={0} role="region" aria-label="Linha do tempo. Role na horizontal para ver outros períodos.">
      <div className={styles.canvas} style={{ width: width + PAD * 2, height: layout.total }}>
        <div className={styles.axis}>
          {ticks.map((t) => (
            <span key={t} style={{ left: x(t) }}>
              {t}
            </span>
          ))}
        </div>
        {ticks.map((t) => (
          <i key={t} className={styles.grid} style={{ left: x(t) }} aria-hidden="true" />
        ))}
        <div className={styles.periods}>
          {periodos.map((p) => {
            const left = x(periodStart(p))
            const w = Math.max(6, x(periodEnd(p)) - left - 2)
            const on = selected?.kind === 'periodo' && selected.id === p.id
            return (
              <button
                key={p.id}
                type="button"
                className={on ? `${styles.period} ${styles.periodOn}` : styles.period}
                style={{ left, width: w, background: regimeColor(p.regime) }}
                aria-pressed={on}
                aria-label={`${p.rotulo}, regime ${p.regime}, de ${p.inicio} a ${p.fim ?? 'hoje'}`}
                title={`${p.rotulo} · ${p.regime} · ${p.inicio}–${p.fim ?? 'hoje'}`}
                onClick={() => onSelect(on ? null : { kind: 'periodo', id: p.id })}
              >
                <span className={styles.pTitle}>{p.rotulo}</span>
                <span className={styles.pSub}>
                  {p.inicio}–{p.fim ?? 'hoje'}
                </span>
              </button>
            )
          })}
        </div>

        {layout.lanes.map((l) => (
          <div key={l.key} className={styles.lane} style={{ top: l.top, height: l.h }}>
            <span className={styles.laneLabel}>{trilhaLabel(l.key)}</span>
          </div>
        ))}

        {[...connectors.values()].map((c) => {
          const y0 = Math.min(...c.ys)
          const y1 = Math.max(...c.ys)
          return <i key={c.e.id} className={styles.link} style={{ left: x(c.year), top: y0, height: y1 - y0 }} aria-hidden="true" />
        })}

        {layout.lanes.flatMap((l) =>
          l.items.map((p) => {
            const on = selected?.kind === 'evento' && selected.id === p.e.id
            const cross = isCrossing(p.e)
            // o rótulo aparece só na primeira faixa em que o evento existe
            const showLabel = on && layout.lanes.find((x) => x.items.some((i) => i.e.id === p.e.id))?.key === p.trilha
            return (
              <button
                key={`${p.e.id}-${p.trilha}`}
                type="button"
                className={[styles.dot, cross ? styles.cross : '', on ? styles.dotOn : ''].join(' ')}
                style={{ left: x(p.year), top: centerY(p.trilha, p.sub) - 8 }}
                aria-pressed={on}
                aria-label={`${p.e.data}: ${p.e.titulo}${cross ? ' (cruza trilhas)' : ''} — ${trilhaLabel(p.trilha)}`}
                title={`${p.e.data} · ${p.e.titulo}`}
                onClick={() => onSelect(on ? null : { kind: 'evento', id: p.e.id })}
              >
                {showLabel && <span className={styles.dotLabel}>{p.e.titulo}</span>}
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}

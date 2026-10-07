import { useId } from 'react'
import { domainColor, FORCA_W, isHypothesis, ringOrder, tipoShort } from '@/features/aneis/model'
import type { Anel } from '@/features/aneis/schemas'
import { cn } from '@/lib/cn'
import styles from './LoopRing.module.css'

export type LoopRingProps = {
  anel: Anel
  selectedEdge: number | null
  onSelectEdge: (i: number | null) => void
}

const W = 700
const H = 560
const CX = W / 2
const CY = H / 2
const R = 150
const NODE = 9

const wrap = (s: string, max = 17): string[] => {
  const out: string[] = []
  let cur = ''
  for (const w of s.split(' ')) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      out.push(cur)
      cur = w
    } else cur = (cur + ' ' + w).trim()
  }
  if (cur) out.push(cur)
  return out.slice(0, 4)
}

const pos = (ang: number, r = R) => ({ x: CX + r * Math.cos(ang), y: CY + r * Math.sin(ang) })

/** Diagrama de laço causal em círculo: nós em anel, arestas com sinal, espessura pela força. */
export function LoopRing({ anel, selectedEdge, onSelectEdge }: LoopRingProps) {
  const uid = useId().replace(/:/g, '')
  const { ring, branches } = ringOrder(anel)
  const n = ring.length
  const node = new Map(anel.nos.map((x) => [x.id, x]))
  const angle = new Map(ring.map((id, k) => [id, -Math.PI / 2 + (k * 2 * Math.PI) / n]))

  // posição dos ramais: ao lado do nó do laço a que se ligam
  const bpos = new Map<string, { x: number; y: number; ang: number }>()
  const perAnchor = new Map<string, number>()
  for (const b of branches) {
    const e = anel.arestas.find((x) => (x.de === b && ring.includes(x.para)) || (x.para === b && ring.includes(x.de)))
    const anchor = e ? (ring.includes(e.de) ? e.de : e.para) : (ring[0] as string)
    const k = perAnchor.get(anchor) ?? 0
    perAnchor.set(anchor, k + 1)
    const ang = (angle.get(anchor) as number) + (k % 2 === 0 ? 1 : -1) * 0.2 * Math.ceil((k + 1) / 2)
    bpos.set(b, { ...pos(ang, R + 118), ang })
  }
  const where = (id: string) => (angle.has(id) ? { ...pos(angle.get(id) as number), ang: angle.get(id) as number } : bpos.get(id))

  return (
    <figure className={styles.fig}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={`Diagrama do anel ${anel.nome}: ${ring.map((id) => node.get(id)?.rotulo).join(' → ')} e de volta ao início. Tipo ${anel.tipo === 'reforco' ? 'reforçador' : 'equilibrador'}.`}>
        <defs>
          {['pos', 'neg'].map((k) => (
            <marker key={k} id={`${uid}-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" fill={k === 'pos' ? 'var(--st-derivado)' : 'var(--neg)'} />
            </marker>
          ))}
        </defs>

        {/* aura do laço */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border-soft)" strokeWidth="1" strokeDasharray="2 6" />
        <g className={styles.center} aria-hidden="true">
          <circle cx={CX} cy={CY} r="44" className={cn(styles.core, anel.tipo === 'reforco' ? styles.r : styles.b)} />
          <text x={CX} y={CY - 2} textAnchor="middle" dominantBaseline="central" className={styles.letter}>{tipoShort(anel.tipo)}</text>
          <text x={CX} y={CY + 30} textAnchor="middle" className={styles.kind}>{anel.tipo === 'reforco' ? 'reforçador' : 'equilibrador'}</text>
        </g>

        {anel.arestas.map((e, i) => {
          const a = where(e.de)
          const b = where(e.para)
          if (!a || !b) return null
          const neg = e.sinal.includes('-') || e.sinal.includes('−')
          const w = FORCA_W[e.forca ?? ''] ?? 2.4
          const hyp = isHypothesis(e)
          const isMain = !e.ramal && ring.includes(e.de) && ring.includes(e.para)
          let d: string
          let mid: { x: number; y: number }
          if (isMain) {
            const a0 = a.ang + (NODE + 7) / R
            let a1 = b.ang - (NODE + 9) / R
            if (a1 <= a0) a1 += 2 * Math.PI
            const s = pos(a0)
            const t = pos(a1)
            d = `M${s.x},${s.y} A${R},${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${t.x},${t.y}`
            mid = pos((a0 + a1) / 2)
          } else {
            const dx = b.x - a.x
            const dy = b.y - a.y
            const len = Math.hypot(dx, dy) || 1
            const s = { x: a.x + (dx / len) * (NODE + 5), y: a.y + (dy / len) * (NODE + 5) }
            const t = { x: b.x - (dx / len) * (NODE + 8), y: b.y - (dy / len) * (NODE + 8) }
            d = `M${s.x},${s.y} L${t.x},${t.y}`
            mid = { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 }
          }
          const sel = selectedEdge === i
          return (
            <g key={i} className={cn(styles.edge, selectedEdge != null && !sel && styles.dim)}>
              <path d={d} fill="none" stroke="transparent" strokeWidth="22" className={styles.hit} onClick={() => onSelectEdge(sel ? null : i)}>
                <title>{`${node.get(e.de)?.rotulo} → ${node.get(e.para)?.rotulo} (${e.sinal})`}</title>
              </path>
              <path
                d={d}
                fill="none"
                stroke={neg ? 'var(--neg)' : 'var(--st-derivado)'}
                strokeWidth={sel ? w + 1.6 : w}
                strokeLinecap="round"
                strokeDasharray={hyp ? '0.1 6.5' : e.contestada ? '9 6' : e.ramal ? '3 4' : undefined}
                opacity={e.ramal ? 0.7 : 1}
                markerEnd={`url(#${uid}-${neg ? 'neg' : 'pos'})`}
                pointerEvents="none"
              />
              <g onClick={() => onSelectEdge(sel ? null : i)} className={styles.hit}>
                <circle cx={mid.x} cy={mid.y} r="11.5" className={cn(styles.sign, e.contestada && styles.contested, sel && styles.signSel)} stroke={neg ? 'var(--neg)' : 'var(--st-derivado)'} />
                <text x={mid.x} y={mid.y + 0.5} textAnchor="middle" dominantBaseline="central" className={styles.signText} fill={neg ? 'var(--neg)' : 'var(--st-derivado)'}>{neg ? '−' : '+'}</text>
              </g>
            </g>
          )
        })}

        {[...ring, ...branches].map((id) => {
          const p = where(id)
          const nd = node.get(id)
          if (!p || !nd) return null
          const isRing = ring.includes(id)
          const right = Math.cos(p.ang) > 0.2
          const left = Math.cos(p.ang) < -0.2
          const lx = p.x + (right ? 15 : left ? -15 : 0)
          const ly = p.y + (!right && !left ? (Math.sin(p.ang) > 0 ? 24 : -22) : 0)
          const lines = wrap(nd.rotulo)
          const c = domainColor(nd.dominio)
          return (
            <g key={id} className={styles.node}>
              <circle cx={p.x} cy={p.y} r={isRing ? NODE : 6.5} fill="var(--surface)" stroke={c} strokeWidth="3" />
              <text x={lx} y={ly - ((lines.length - 1) * 8)} textAnchor={right ? 'start' : left ? 'end' : 'middle'} className={cn(styles.label, !isRing && styles.branchLabel)}>
                {lines.map((l, k) => (
                  <tspan key={k} x={lx} dy={k === 0 ? 0 : 15}>{l}</tspan>
                ))}
              </text>
            </g>
          )
        })}
      </svg>
      <ul className={styles.legend} aria-label="Legenda do diagrama">
        <li><i className={styles.lgSolid} /> aresta com evidência verificada</li>
        <li><i className={styles.lgDot} /> hipótese pura (nenhuma evidência verificada)</li>
        <li><i className={styles.lgDash} /> contestada na literatura</li>
        <li><span className={styles.lgSign}>+</span> mesmo sentido · <span className={cn(styles.lgSign, styles.lgNeg)}>−</span> sentido oposto</li>
        <li>espessura = força (forte → incerta)</li>
      </ul>
    </figure>
  )
}

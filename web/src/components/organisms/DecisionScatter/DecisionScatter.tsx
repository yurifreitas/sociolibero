import { useState, type KeyboardEvent } from 'react'
import { scaleLinear } from 'd3-scale'
import { lut, rgbCss } from '@/lib/color'
import { fPct, fSigned1 } from '@/lib/format'
import { useTheme } from '@/lib/theme'
import { goodness, impactDef, type ImpactKey, type Presidencia } from '@/features/decisoes/model'
import type { Decisao } from '@/features/data/schemas'
import styles from './DecisionScatter.module.css'

const W = 760
const H = 480
const M = { l: 64, r: 24, t: 24, b: 56 }

export type DecisionScatterProps = {
  decisoes: Decisao[]
  visibleIds: Set<string>
  impact: ImpactKey
  presidencia: Presidencia
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function DecisionScatter({ decisoes, visibleIds, impact, presidencia, selectedId, onSelect }: DecisionScatterProps) {
  const { effective } = useTheme()
  const colors = lut('div', effective)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const def = impactDef(impact)
  const gs = decisoes.map((d) => goodness(d, impact))
  const lim = Math.max(1e-6, ...gs.map(Math.abs)) * 1.15
  const x = scaleLinear().domain([0, 1]).range([M.l, W - M.r])
  const y = scaleLinear().domain([-lim, lim]).range([H - M.b, M.t])
  const real = (g: number) => (def.higherIsBetter ? g : -g)
  const ticks = [-lim, -lim / 2, 0, lim / 2, lim]
  const midX = x(0.5)
  const midY = y(0)

  const active = hoverId ?? selectedId
  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(id === selectedId ? null : id)
    }
  }
  const quad = (tx: number, ty: number, anchor: 'start' | 'end', t: string) => (
    <text x={tx} y={ty} textAnchor={anchor} className={styles.quad}>
      {t}
    </text>
  )

  return (
    <figure className={styles.fig}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="group"
        aria-label={`Dispersão: viabilidade política com presidência ${presidencia} versus impacto de cada decisão em ${def.label} em 2035`}
      >
        <rect x={M.l} y={M.t} width={midX - M.l} height={midY - M.t} className={styles.qGood} />
        <rect x={midX} y={M.t} width={W - M.r - midX} height={midY - M.t} className={styles.qGoodEasy} />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className={t === 0 ? styles.zero : styles.grid} />
            <text x={M.l - 10} y={y(t) + 4} textAnchor="end" className={styles.tick}>
              {fSigned1(real(t))}
            </text>
          </g>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={M.t} y2={H - M.b} className={t === 0.5 ? styles.zero : styles.grid} />
            <text x={x(t)} y={H - M.b + 20} textAnchor="middle" className={styles.tick}>
              {fPct(t * 100).replace(',0', '')}
            </text>
          </g>
        ))}
        {quad(M.l + 10, M.t + 18, 'start', 'Difícil e bom')}
        {quad(W - M.r - 10, M.t + 18, 'end', 'Fácil e bom')}
        {quad(M.l + 10, H - M.b - 10, 'start', 'Difícil e ruim')}
        {quad(W - M.r - 10, H - M.b - 10, 'end', 'Fácil e ruim')}
        <text x={M.l + (W - M.l - M.r) / 2} y={H - 8} textAnchor="middle" className={styles.axis}>
          Viabilidade: P(aprovação) com presidência {presidencia === 'direita' ? 'de direita' : 'de esquerda'}
        </text>
        <text transform={`translate(14 ${M.t + (H - M.t - M.b) / 2}) rotate(-90)`} textAnchor="middle" className={styles.axis}>
          Δ {def.label} em 2035 ({def.unit}) · melhor para cima
        </text>
        {decisoes.map((d, i) => {
          const visible = visibleIds.has(d.id)
          const cx = x(d.p_aprovacao[presidencia])
          const cy = y(gs[i] ?? 0)
          const r = 5 + d.controversia * 7
          const isActive = d.id === active
          const color = rgbCss(colors[Math.round(((d.ideologia + 1) / 2) * 255)] as never)
          return (
            <g key={d.id} opacity={visible ? 1 : 0.12} style={{ pointerEvents: visible ? 'auto' : 'none' }}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={color}
                className={isActive ? styles.dotOn : styles.dot}
                tabIndex={visible ? 0 : -1}
                role="button"
                aria-pressed={d.id === selectedId}
                aria-label={`${d.rotulo}. Aprovação ${fPct(d.p_aprovacao[presidencia] * 100)}; efeito em ${def.label}: ${fSigned1(d.impacto_2035[impact])} ${def.unit}`}
                onMouseEnter={() => setHoverId(d.id)}
                onMouseLeave={() => setHoverId(null)}
                onFocus={() => setHoverId(d.id)}
                onBlur={() => setHoverId(null)}
                onClick={() => onSelect(d.id === selectedId ? null : d.id)}
                onKeyDown={(e) => onKey(e, d.id)}
              />
              {isActive && (
                <text x={cx} y={cy - r - 8} textAnchor={cx > W * 0.7 ? 'end' : cx < W * 0.3 ? 'start' : 'middle'} className={styles.lbl}>
                  {d.rotulo}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <figcaption className={styles.cap}>
        <span>
          <i className={styles.swatchL} /> cor = ideologia da proposta (esquerda → direita)
        </span>
        <span>tamanho = controvérsia</span>
        <span>efeito = variação vs. cenário pragmático <strong>se aprovada</strong></span>
      </figcaption>
    </figure>
  )
}

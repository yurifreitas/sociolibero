import { useId } from 'react'

export type SparklineProps = {
  values: ReadonlyArray<number | null>
  width?: number
  height?: number
  /** rótulo acessível com o resumo da série */
  label: string
  tone?: 'brand' | 'pos' | 'neg' | 'muted'
  /** realça o último ponto */
  dot?: boolean
}

const TONE = { brand: 'var(--brand)', pos: 'var(--pos)', neg: 'var(--neg)', muted: 'var(--text-subtle)' } as const

/** Sparkline em SVG: linha 2px + área em degradê; valores null quebram a linha (nunca viram zero). */
export function Sparkline({ values, width = 120, height = 36, label, tone = 'brand', dot = true }: SparklineProps) {
  const gid = useId()
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v))
  if (nums.length < 2) return <svg width={width} height={height} role="img" aria-label={`${label}: dados insuficientes`} />
  const lo = Math.min(...nums)
  const hi = Math.max(...nums)
  const pad = 4
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2)
  const y = (v: number) => height - pad - ((v - lo) / (hi - lo || 1)) * (height - pad * 2)
  const segs: string[][] = [[]]
  values.forEach((v, i) => {
    if (v == null || !Number.isFinite(v)) segs.push([])
    else (segs[segs.length - 1] as string[]).push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  })
  const color = TONE[tone]
  const lastIdx = values.map((v) => v != null).lastIndexOf(true)
  const last = values[lastIdx] as number
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {segs
        .filter((s) => s.length > 1)
        .map((s, i) => (
          <g key={i}>
            <polygon points={`${s[0]?.split(',')[0]},${height - pad} ${s.join(' ')} ${s[s.length - 1]?.split(',')[0]},${height - pad}`} fill={`url(#${gid})`} />
            <polyline points={s.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
      {dot && <circle cx={x(lastIdx)} cy={y(last)} r="3" fill="var(--surface)" stroke={color} strokeWidth="2" />}
    </svg>
  )
}

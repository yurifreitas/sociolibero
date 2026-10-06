export function quantile(sorted: ArrayLike<number>, q: number): number {
  if (sorted.length === 0) return Number.NaN
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  const a = sorted[lo] as number
  const b = sorted[hi] as number
  return a + (b - a) * (pos - lo)
}

export function sortedFinite(values: ReadonlyArray<number | null | undefined>): Float64Array {
  const out: number[] = []
  for (const v of values) if (v != null && Number.isFinite(v)) out.push(v)
  return Float64Array.from(out).sort()
}

import type { Territorios } from '@/features/data/schemas'

const cache = new WeakMap<Territorios, number>()

/** O arquivo pode trazer pct_* em fração (0–1) ou em percentual (0–100). Decide pelo máximo do arquivo. */
export function pctScale(t: Territorios): number {
  const hit = cache.get(t)
  if (hit != null) return hit
  let max = 0
  for (const r of Object.values(t.linhas))
    for (const v of [r.pct_indigena, r.pct_quilombola, r.pct_pretos_pardos]) if (v != null && v > max) max = v
  const scale = max > 1.5 ? 1 : 100
  cache.set(t, scale)
  return scale
}

/** Percentual de exibição; null permanece null (nunca vira zero). */
export const toPercent = (t: Territorios, v: number | null | undefined) => (v == null ? null : v * pctScale(t))

export const TERRITORY_WARNING =
  'População em terra indígena ≠ autodeclaração; correlação municipal não implica comportamento individual.'

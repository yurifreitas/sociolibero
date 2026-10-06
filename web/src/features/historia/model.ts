import type { Evento, Periodo } from '@/features/data/schemas'

export const CURRENT_YEAR = new Date().getFullYear()

/** Ano fracionário a partir de 2024, "2024-05-03" ou "1988-10"; null se não der para ler. */
export function parseYear(v: string | number | null | undefined): number | null {
  if (v == null) return null
  if (typeof v === 'number') return v
  const m = /^(-?\d{1,4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/.exec(v.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = m[2] ? Number(m[2]) - 1 : 0
  const d = m[3] ? Number(m[3]) - 1 : 0
  return y + mo / 12 + d / 365
}

export const periodStart = (p: Periodo) => parseYear(p.inicio) ?? 0
export const periodEnd = (p: Periodo) => parseYear(p.fim) ?? CURRENT_YEAR + 1

export function timelineRange(periodos: Periodo[], eventos: Evento[]) {
  const xs = [...periodos.flatMap((p) => [periodStart(p), periodEnd(p)]), ...eventos.map((e) => parseYear(e.data) ?? Number.NaN)].filter(Number.isFinite)
  const min = Math.floor(Math.min(...xs) / 10) * 10
  const max = Math.ceil(Math.max(...xs) / 10) * 10
  return { min, max: Math.max(max, min + 10) }
}

/** Valor livre (texto, lista ou mapa) → linhas de texto para exibir. */
export function toLines(v: string | string[] | Record<string, string> | null | undefined): { label?: string; text: string }[] {
  if (v == null) return []
  if (typeof v === 'string') return v.trim() ? [{ text: v }] : []
  if (Array.isArray(v)) return v.map((t) => ({ text: t }))
  return Object.entries(v).map(([label, text]) => ({ label, text }))
}

export const PODER_LABEL: Record<string, string> = { executivo: 'Executivo', legislativo: 'Legislativo', judiciario: 'Judiciário' }

/** Atribui faixas de ano às lanes para eventos próximos não se sobreporem. */
export function assignLanes(xs: number[], minGap: number): number[] {
  const order = xs.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0])
  const lastX: number[] = []
  const lane = new Array<number>(xs.length).fill(0)
  for (const [x, i] of order) {
    let l = lastX.findIndex((lx) => x - lx >= minGap)
    if (l === -1) l = lastX.length
    lastX[l] = x
    lane[i] = l
  }
  return lane
}

export const TRILHAS = [
  { key: 'estado', label: 'Estado e instituições' },
  { key: 'indigena', label: 'Povos indígenas' },
  { key: 'quilombola', label: 'Quilombos' },
] as const
export type TrilhaKey = (typeof TRILHAS)[number]['key']
export const trilhaLabel = (k: string) => TRILHAS.find((t) => t.key === k)?.label ?? k

/** Trilhas em que o evento aparece: `trilhas`/`cruza` (≥2) ligam faixas; `categoria` "cruzamento" liga as três. */
export function eventTrilhas(e: Evento): string[] {
  const list = e.trilhas ?? e.cruza
  if (list && list.length > 0) return list
  if (/cruzamento/i.test(e.categoria) && !e.trilha) return TRILHAS.map((t) => t.key)
  return [e.trilha ?? 'estado']
}
export const isCrossing = (e: Evento) => eventTrilhas(e).length > 1

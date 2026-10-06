const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const nf2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const nf3 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '')

export const fInt = (n: number | null | undefined) => (n == null ? '—' : nf0.format(n))
export const fCompact = (n: number) => compact.format(n)
export const fNum1 = (n: number | null | undefined) => (n == null ? '—' : nf1.format(n))
export const fNum2 = (n: number | null | undefined) => (n == null ? '—' : nf2.format(n))
export const fPct = (n: number | null | undefined) => (n == null ? '—' : `${nf1.format(n)}%`)
export const fPp = (n: number | null | undefined) => (n == null ? '—' : `${sign(n)}${nf1.format(Math.abs(n))} pp`)
export const fSigned1 = (n: number | null | undefined) => (n == null ? '—' : `${sign(n)}${nf1.format(Math.abs(n))}`)
export const fZ = (n: number | null | undefined) => (n == null ? '—' : `${sign(n)}${nf2.format(Math.abs(n))}`)
export const fP = (p: number | null | undefined) => (p == null ? '—' : p < 0.001 ? '< 0,001' : nf3.format(p))
export const fDateTime = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })
}
export const shortHash = (h: string) => (h.length > 16 ? `${h.slice(0, 8)}…${h.slice(-8)}` : h)

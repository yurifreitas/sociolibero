export const nf1 = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: n >= 100 ? 0 : n >= 10 ? 1 : 2 }).format(n)

/** “R$ 12,4 bi”, “R$ 1,2 tri”; valor ausente nunca vira zero. */
export function brl(bi: number | null | undefined): string {
  if (bi == null || Number.isNaN(bi)) return '—'
  const a = Math.abs(bi)
  const sign = bi < 0 ? '−' : ''
  return a >= 1000 ? `${sign}R$ ${nf1(a / 1000)} tri` : `${sign}R$ ${nf1(a)} bi`
}

export function brlRange(f: number[] | null | undefined): string | null {
  if (!f || f.length < 2) return null
  return `${brl(f[0])} a ${brl(f[1])}`
}

/** contagem = apurado em processo, auditoria ou balanço (medido); estimativa = modelo ou extrapolação (modelado). */
export const tipoBasis = (t: string | null | undefined): 'measured' | 'modeled' | undefined => (t === 'contagem' ? 'measured' : t === 'estimativa' ? 'modeled' : undefined)
export const isHttp = (u: string | null | undefined): u is string => !!u && /^https?:\/\//.test(u)

import type { ElectionMeta, ElectionRow } from './schemas'

export const candLabel = (meta: ElectionMeta, numero: string | number) => {
  const c = meta.candidatos.find((x) => String(x.numero) === String(numero))
  return c ? `${c.nome} (${c.partido} ${c.numero})` : String(numero)
}

export function ranking(row: ElectionRow, meta: ElectionMeta) {
  return Object.entries(row.votos)
    .map(([numero, votos]) => ({ numero, votos, pct: row.validos > 0 ? (votos / row.validos) * 100 : 0, label: candLabel(meta, numero) }))
    .sort((a, b) => b.votos - a.votos)
}

export const pctOf = (n: number, d: number) => (d > 0 ? (n / d) * 100 : null)
export const ELECTION_STATUS_OFFICIAL = 'oficial'

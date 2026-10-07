import type { Pensador } from './schemas'

/** Lê uma data em "anos antes do presente" de texto livre: '48000-32000 (alegação)', 'c. 11200-10000', 12000. */
export function parseAP(v: string | number | null | undefined): { from: number; to: number } | null {
  if (v == null) return null
  if (typeof v === 'number') return { from: v, to: v }
  const nums = [...v.matchAll(/\d[\d.]*/g)].map((m) => Number(m[0].replace(/\./g, ''))).filter((n) => Number.isFinite(n))
  if (nums.length === 0) return null
  const a = nums[0] as number
  const b = nums.length > 1 ? (nums[1] as number) : a
  return { from: Math.max(a, b), to: Math.min(a, b) }
}

/** 'YYYY-MM' ou 'YYYY' → ano decimal (meio do mês). */
export function toYear(t: string | number): number {
  if (typeof t === 'number') return t
  const m = /^(\d{4})(?:-(\d{2}))?/.exec(t)
  if (!m) return NaN
  return Number(m[1]) + (m[2] ? (Number(m[2]) - 0.5) / 12 : 0.5)
}

/** Agrupa a descrição livre de tradição em poucos grupos filtráveis. */
export const GRUPOS = ['Indígena', 'Afro-brasileiro', 'Decolonial e antropologia', 'Sociologia e instituições', 'Economia e sistemas', 'Direito e casos'] as const
export type Grupo = (typeof GRUPOS)[number]

export function grupoDe(p: Pick<Pensador, 'tradicao' | 'nome'>): Grupo {
  const t = `${p.tradicao ?? ''} ${p.nome}`.toLowerCase()
  if (/direito|constitu|corte|oit|convenç/.test(t) && !/antrop|soci/.test(t)) return 'Direito e casos'
  if (/afro|quilomb/.test(t)) return 'Afro-brasileiro'
  if (/indígena|indigena|quéchua|aimar|guarani|mapuche|maia|krenak|yanomami|ayni|tekoha/.test(t)) return 'Indígena'
  if (/antrop|arque|decolon|filósof|filosof|ecologista|pluriverso|boaventura|quijano|dussel|escobar|rivera/.test(t)) return 'Decolonial e antropologia'
  if (/econom|ecológic|sistemas|cientista de sistemas|meadows/.test(t)) return 'Economia e sistemas'
  return 'Sociologia e instituições'
}

/** Rótulo de “uso atual” lido do início do texto de grau_de_uso (não é medida numérica). */
export const USO_NIVEIS = ['Muito baixo', 'Baixo', 'Médio', 'Alto'] as const
export function usoNivel(texto: string | null | undefined): number | null {
  if (!texto) return null
  const t = texto.trim().toLowerCase()
  if (/^muito baixo/.test(t)) return 0
  if (/^baixo a médio|^baixo a medio/.test(t)) return 1.5
  if (/^baixo/.test(t)) return 1
  if (/^médio|^medio|^moderado/.test(t)) return 2
  if (/^alto|^muito alto/.test(t)) return 3
  return null
}

export const fmtIC = (ic?: number[] | null) => (ic && ic.length === 2 ? `${ic[0]?.toFixed(2)} a ${ic[1]?.toFixed(2)}` : '—')

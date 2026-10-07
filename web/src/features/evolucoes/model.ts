import type { CenariosMacro, Evolucoes } from './schemas'

export type Mat = number[][]

/** Renormaliza uma linha de probabilidades (soma 1). Linha toda zero vira permanência. */
export function normRow(row: number[], stay: number): number[] {
  const s = row.reduce((a, b) => a + Math.max(0, b), 0)
  if (s <= 0) return row.map((_, i) => (i === stay ? 1 : 0))
  return row.map((v) => Math.max(0, v) / s)
}

/** Edita uma célula e redistribui o resto da linha proporcionalmente, mantendo soma 1. */
export function editCell(m: Mat, i: number, j: number, value: number): Mat {
  const v = Math.min(1, Math.max(0, value))
  const row = m[i] as number[]
  const others = row.reduce((a, x, k) => (k === j ? a : a + x), 0)
  const next = row.map((x, k) => {
    if (k === j) return v
    return others > 0 ? (x / others) * (1 - v) : (1 - v) / (row.length - 1)
  })
  return m.map((r, k) => (k === i ? next : r.slice()))
}

/** Distribuição no próximo ciclo: π' = π · P */
export function step(pi: number[], P: Mat): number[] {
  return P[0]!.map((_, j) => pi.reduce((a, p, i) => a + p * (P[i]![j] as number), 0))
}

export function occupancy(pi0: number[], P: Mat, cycles: number): number[][] {
  const out = [pi0]
  for (let c = 1; c < cycles; c++) out.push(step(out[c - 1] as number[], P))
  return out
}

/** Peso de cada cenário no ano `y`: o mandato que governa o ano usa a ocupação do ciclo em que foi eleito (2026→2027-30, 2030→2031-34, 2034→2035-38). */
export function weightsForYear(occ: number[][], ciclos: number[], y: number): number[] {
  const elected = [...ciclos].reverse().find((c) => c + 1 <= y) ?? (ciclos[0] as number)
  const idx = Math.max(0, ciclos.indexOf(elected))
  return occ[Math.min(idx, occ.length - 1)] as number[]
}

export interface ChainResult {
  occ: number[][]
  /** P(dívida > 120% do PIB) acumulada por ano, mistura das curvas por cenário */
  ruptura: Record<number, number>
  rupturaAte: number
  macro: Record<number, { debt: number; selic: number; ipca: number; gdp: number }>
}

export function runChain(ev: Evolucoes, cm: CenariosMacro | null | undefined, P: Mat, years = [2030, 2035, 2038]): ChainResult {
  const cc = ev.cadeia_cenarios
  const pi0 = cc.cenarios.map((k) => cc.distribuicao_inicial_2026[k] ?? 0)
  const occ = occupancy(pi0, P, cc.ciclos.length)
  const rup = cc.ruptura_regime_divida_acima_de_120.por_cenario
  const anos = cm?.anos ?? []
  const ruptura: Record<number, number> = {}
  for (let y = 2027; y <= 2038; y++) {
    const w = weightsForYear(occ, cc.ciclos, y)
    ruptura[y] = cc.cenarios.reduce((a, k, i) => a + (w[i] as number) * (rup[k]?.p_acumulada_por_ano[String(y)] ?? 0), 0)
  }
  const macro: ChainResult['macro'] = {}
  if (cm)
    for (const y of years) {
      const w = weightsForYear(occ, cc.ciclos, y)
      const ix = anos.indexOf(y)
      const mix = (v: 'debt' | 'selic' | 'ipca' | 'gdp') => cc.cenarios.reduce((a, k, i) => a + (w[i] as number) * (cm.cenarios[k]?.[v].p50[ix] ?? Number.NaN), 0)
      if (ix >= 0) macro[y] = { debt: mix('debt'), selic: mix('selic'), ipca: mix('ipca'), gdp: mix('gdp') }
    }
  return { occ, ruptura, rupturaAte: ruptura[2038] ?? 0, macro }
}

/** Faixa de risco de erosão (democracia eleitoral → autocracia) em `h` anos entre os modelos publicados. */
export function erosionRange(ev: Evolucoes, h = 5): { lo: number; hi: number; n: number } | null {
  const rp = ev.regimes_politicos
  const ps = rp.primeira_passagem.filter((r) => r.origem === 'democracia eleitoral' && r.alvo === 'autocracia (fechada ou eleitoral)' && r.h_anos === h).map((r) => r.p)
  const sm = rp.semi_markov_brasil?.primeira_passagem?.find((r) => r.h === h && r.alvo === 'autocracia (fechada ou eleitoral)')
  if (sm) ps.push(sm.p)
  return ps.length ? { lo: Math.min(...ps), hi: Math.max(...ps), n: ps.length } : null
}

export const pct = (x: number | null | undefined, d = 0) => (x == null || Number.isNaN(x) ? '—' : `${(x * 100).toFixed(d).replace('.', ',')}%`)
export const STATE_SHORT: Record<string, string> = {
  'autocracia fechada': 'Autocracia fechada',
  'autocracia eleitoral': 'Autocracia eleitoral',
  'democracia eleitoral': 'Democracia eleitoral',
  'democracia liberal': 'Democracia liberal',
}

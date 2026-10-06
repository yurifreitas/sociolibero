import type { ScaleKind } from '@/lib/color'
import { fCompact, fInt, fNum1, fPct, fPp, fSigned1, fZ } from '@/lib/format'
import { quantile, sortedFinite } from '@/lib/stats'
import type { Election, ElectionRow, Exposicao, Forensics, SetorKey, Territorios } from '@/features/data/schemas'
import { toPercent } from '@/features/territorios/model'

export type MetricKey =
  | 'voto'
  | 'comparecimento'
  | 'abstencao'
  | 'brancos_nulos'
  | 'margem'
  | 'score'
  | 'zt'
  | 'zn'
  | 'exposicao'
  | 'pop_indigena'
  | 'pop_quilombola'
  | 'ti_area'

export interface MetricDef {
  key: MetricKey
  label: string
  kind: ScaleKind
  /** vem de uma eleição (admite modo comparar) */
  election: boolean
  forensic: boolean
  needsCandidate: boolean
  needsSector: boolean
  /** vem de territorios.json (null = sem dado, nunca zero) */
  territory?: boolean
  help: string
}

export const METRICS: MetricDef[] = [
  { key: 'voto', label: 'Voto no candidato (% válidos)', kind: 'seq', election: true, forensic: false, needsCandidate: true, needsSector: false, help: 'Votos do candidato ÷ votos válidos do município.' },
  { key: 'comparecimento', label: 'Comparecimento (% aptos)', kind: 'seq', election: true, forensic: false, needsCandidate: false, needsSector: false, help: 'Eleitores que compareceram ÷ eleitores aptos.' },
  { key: 'abstencao', label: 'Abstenção (% aptos)', kind: 'warm', election: true, forensic: false, needsCandidate: false, needsSector: false, help: '100% − comparecimento.' },
  { key: 'brancos_nulos', label: 'Brancos + nulos (% comparecimento)', kind: 'warm', election: true, forensic: false, needsCandidate: false, needsSector: false, help: '(Brancos + nulos) ÷ comparecimento.' },
  { key: 'margem', label: 'Margem entre 1º e 2º (pp)', kind: 'seq', election: true, forensic: false, needsCandidate: false, needsSector: false, help: 'Diferença entre os dois mais votados, em pontos percentuais dos válidos.' },
  { key: 'score', label: 'Prioridade de auditoria (0–100)', kind: 'warm', election: false, forensic: true, needsCandidate: false, needsSector: false, help: 'Combinação dos testes forenses. Sinaliza onde conferir primeiro — não é prova de irregularidade.' },
  { key: 'zt', label: 'Comparecimento vs vizinhos (z)', kind: 'div', election: false, forensic: true, needsCandidate: false, needsSector: false, help: 'z-score robusto contra municípios vizinhos.' },
  { key: 'zn', label: 'Brancos+nulos vs vizinhos (z)', kind: 'div', election: false, forensic: true, needsCandidate: false, needsSector: false, help: 'z-score robusto contra municípios vizinhos.' },
  { key: 'exposicao', label: 'Estrutura econômica (% do VAB)', kind: 'seq', election: false, forensic: false, needsCandidate: false, needsSector: true, help: 'Participação do setor na estrutura econômica municipal (IBGE).' },
  { key: 'pop_indigena', label: 'População indígena (% da população)', kind: 'earth', election: false, forensic: false, needsCandidate: false, needsSector: false, territory: true, help: 'População indígena ÷ população total do município (Censo). Escala logarítmica.' },
  { key: 'pop_quilombola', label: 'População quilombola (% da população)', kind: 'earth', election: false, forensic: false, needsCandidate: false, needsSector: false, territory: true, help: 'População quilombola ÷ população total do município (Censo). Escala logarítmica.' },
  { key: 'ti_area', label: 'Terras indígenas no município (ha)', kind: 'earth', election: false, forensic: false, needsCandidate: false, needsSector: false, territory: true, help: 'Área de terras indígenas sobreposta ao município, em hectares. Escala logarítmica.' },
]
export const metricDef = (k: string): MetricDef => METRICS.find((m) => m.key === k) ?? (METRICS[0] as MetricDef)

export const SETORES: { key: SetorKey; label: string }[] = [
  { key: 'agro', label: 'Agropecuária' },
  { key: 'industria', label: 'Indústria' },
  { key: 'servicos', label: 'Serviços' },
  { key: 'adm_publica', label: 'Administração pública' },
]

export function electionValue(key: MetricKey, row: ElectionRow | undefined, cand: string | undefined): number | null {
  if (!row || row.aptos <= 0) return null
  switch (key) {
    case 'voto': {
      const v = cand ? row.votos[cand] : undefined
      return v == null || row.validos <= 0 ? null : (v / row.validos) * 100
    }
    case 'comparecimento':
      return (row.comparecimento / row.aptos) * 100
    case 'abstencao':
      return 100 - (row.comparecimento / row.aptos) * 100
    case 'brancos_nulos':
      return row.comparecimento <= 0 ? null : ((row.brancos + row.nulos) / row.comparecimento) * 100
    case 'margem': {
      const vs = Object.values(row.votos).sort((a, b) => b - a)
      return row.validos <= 0 || vs.length < 2 ? null : (((vs[0] as number) - (vs[1] as number)) / row.validos) * 100
    }
    default:
      return null
  }
}

export interface MetricContext {
  election?: Election
  other?: Election
  forensics?: Forensics
  exposicao?: Exposicao | null
  territorios?: Territorios | null
  candidate?: string
  setor?: SetorKey
}

export function valueOf(key: MetricKey, ibge: string, ctx: MetricContext, compare: boolean): number | null {
  if (key === 'score' || key === 'zt' || key === 'zn') {
    const r = ctx.forensics?.linhas[ibge]
    if (!r) return null
    return key === 'score' ? r.score : (r[key] ?? null)
  }
  if (key === 'pop_indigena' || key === 'pop_quilombola' || key === 'ti_area') {
    const t = ctx.territorios
    const r = t?.linhas[ibge]
    if (!t || !r) return null
    if (key === 'ti_area') return r.ti_area_ha ?? null
    return toPercent(t, key === 'pop_indigena' ? r.pct_indigena : r.pct_quilombola)
  }
  if (key === 'exposicao') {
    const r = ctx.exposicao?.linhas[ibge]
    return r && ctx.setor ? r[ctx.setor] * 100 : null
  }
  const a = electionValue(key, ctx.election?.linhas[ibge], ctx.candidate)
  if (!compare) return a
  const b = electionValue(key, ctx.other?.linhas[ibge], ctx.candidate)
  return a == null || b == null ? null : a - b
}

export function computeValues(key: MetricKey, ibges: string[], ctx: MetricContext, compare: boolean): Float64Array {
  const out = new Float64Array(ibges.length)
  for (let i = 0; i < ibges.length; i++) out[i] = valueOf(key, ibges[i] as string, ctx, compare) ?? Number.NaN
  return out
}

export interface Domain {
  min: number
  max: number
  kind: ScaleKind
  /** cor em escala log1p (variáveis muito assimétricas) */
  log?: boolean
}

/** Valor da métrica na posição t (0–1) da legenda, respeitando a escala log. */
export const valueAt = (d: Domain, t: number) =>
  d.log ? Math.expm1(Math.log1p(d.min) + t * (Math.log1p(d.max) - Math.log1p(d.min))) : d.min + t * (d.max - d.min)
export function domainFor(def: MetricDef, values: Float64Array, compare: boolean): Domain {
  const s = sortedFinite(Array.from(values))
  if (def.territory) {
    // zeros são valores reais; o teto vem dos positivos (p95) para o contraste não morrer nos extremos
    const pos = s.filter((v) => v > 0)
    const hi = pos.length ? quantile(pos, 0.95) : 1
    return { min: 0, max: hi > 0 ? hi : 1, kind: def.kind, log: true }
  }
  const lo = quantile(s, 0.02)
  const hi = quantile(s, 0.98)
  if (compare || def.kind === 'div') {
    if (def.key === 'zt' || def.key === 'zn') return { min: -4, max: 4, kind: 'div' }
    const m = Math.max(Math.abs(lo), Math.abs(hi), 1e-6)
    return { min: -m, max: m, kind: 'div' }
  }
  if (def.key === 'score') return { min: 0, max: Math.max(40, hi || 0), kind: def.kind }
  if (!Number.isFinite(lo) || lo === hi) return { min: 0, max: 1, kind: def.kind }
  return { min: lo, max: hi, kind: def.kind }
}

export function formatValue(key: MetricKey, v: number | null | undefined, compare: boolean): string {
  if (v == null || Number.isNaN(v)) return 'sem dado'
  if (compare) return fPp(v)
  if (key === 'ti_area') return `${fInt(v)} ha`
  if (key === 'zt' || key === 'zn') return fZ(v)
  if (key === 'score') return fNum1(v)
  if (key === 'margem') return `${fNum1(v)} pp`
  return fPct(v)
}
export const formatTick = (key: MetricKey, v: number, compare: boolean): string => {
  if (compare) return fSigned1(v)
  if (key === 'ti_area') return fCompact(v)
  if (key === 'pop_indigena' || key === 'pop_quilombola') return v < 1 ? fNum1(v) + '%' : `${Math.round(v)}%`
  if (key === 'zt' || key === 'zn') return fZ(v)
  if (key === 'score') return String(Math.round(v))
  return `${Math.round(v)}${key === 'margem' ? ' pp' : '%'}`
}

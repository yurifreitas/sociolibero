import type { ScaleKind } from '@/lib/color'
import { fCompact, fInt, fNum1, fPct, fPp, fSigned1, fZ } from '@/lib/format'
import { quantile, sortedFinite } from '@/lib/stats'
import type { Election, ElectionRow, Exposicao, Forensics, SetorKey, Territorios } from '@/features/data/schemas'
import type { ClimaRs } from '@/features/climars/schemas'
import type { HumanoMunicipal } from '@/features/gente/schemas'
import type { AnalfabetosMunicipal } from '@/features/eleitorado/schemas'
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
  | 'homicidios'
  | 'vitimas_negras'
  | 'mae_adolescente'
  | 'risco_rs'
  | 'analfabetos'

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
  /** vem de clima_rs_municipal.json (só RS; sem índice = hachurado, nunca promovido) */
  climaRs?: boolean
  /** vem de humano_municipal.json (por ano; null = sem dado) */
  humano?: { min: number; max: number; defaultYear: number }
  /** vem de analfabetos_municipal.json (perfil do eleitorado TSE por ano; null = sem dado) */
  analf?: { years: number[]; defaultYear: number }
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
  { key: 'homicidios', label: 'Homicídios por 100 mil habitantes', kind: 'warm', election: false, forensic: false, needsCandidate: false, needsSector: false, humano: { min: 2010, max: 2023, defaultYear: 2022 }, help: 'Taxa de homicídios por município de residência (Atlas da Violência; 2020 e 2023 pelo SIM). Taxas de municípios pequenos oscilam por acaso.' },
  { key: 'vitimas_negras', label: 'Vítimas de homicídio negras (%)', kind: 'warm', election: false, forensic: false, needsCandidate: false, needsSector: false, humano: { min: 2015, max: 2023, defaultYear: 2023 }, help: 'Pretos e pardos ÷ vítimas com raça informada (SIM). Só municípios com pelo menos 10 vítimas com raça informada.' },
  { key: 'mae_adolescente', label: 'Nascidos de mães até 17 anos (%)', kind: 'warm', election: false, forensic: false, needsCandidate: false, needsSector: false, humano: { min: 2014, max: 2023, defaultYear: 2023 }, help: 'Nascidos vivos de mães de até 17 anos ÷ nascidos vivos (SINASC). Só municípios com pelo menos 30 nascimentos.' },
  { key: 'risco_rs', label: 'Risco climático RS: prioridade preventiva (0–100)', kind: 'warm', election: false, forensic: false, needsCandidate: false, needsSector: false, climaRs: true, help: 'Índice de PRIORIDADE preventiva dos 497 municípios do RS (impacto observado em 2024, déficit de prevenção e exposição). Não é previsão de cheia. Município sem índice aparece hachurado e fora do ranking, nunca promovido.' },
  { key: 'analfabetos', label: 'Eleitores analfabetos (% do eleitorado)', kind: 'warm', election: false, forensic: false, needsCandidate: false, needsSector: false, analf: { years: [2022, 2024, 2026], defaultYear: 2022 }, help: 'Eleitores com grau de instrução “analfabeto” no cadastro do TSE ÷ eleitorado do município (perfil do eleitorado por município). É declaração de instrução no cadastro, não um teste de leitura, e o cadastro inclui inscritos que já morreram ou mudaram. Município sem perfil no ano aparece hachurado, nunca como zero. 2026 é preliminar.' },
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
  humano?: HumanoMunicipal | null
  analfabetos?: AnalfabetosMunicipal | null
  climaRs?: ClimaRs | null
  ano?: number
  candidate?: string
  setor?: SetorKey
}

const pick = (row: Record<string, Record<string, number | null>> | undefined, f: string, y: number): number | null => row?.[f]?.[String(y)] ?? null

/** Violência e nascimentos por município e ano. null = sem dado (nunca vira zero). */
function humanoValue(key: MetricKey, ibge: string, ctx: MetricContext): number | null {
  const row = ctx.humano?.linhas[ibge]
  const y = ctx.ano
  if (!row || y == null) return null
  if (key === 'homicidios') {
    const taxa = pick(row, 'taxa_homicidios', y)
    if (taxa != null) return taxa
    // 2020 (Atlas municipal com defeito na origem) e 2023 (sem Atlas municipal): SIM ÷ população
    const sim = pick(row, 'sim_homicidios', y)
    const pop = pick(row, 'pop', y)
    return sim != null && pop != null && pop > 0 ? (sim / pop) * 100_000 : null
  }
  if (key === 'vitimas_negras') {
    const n = pick(row, 'vitimas_raca_informada', y)
    const p = pick(row, 'pct_vitimas_negras', y)
    return n != null && n >= 10 ? p : null
  }
  const nasc = pick(row, 'nascidos', y)
  const mae = pick(row, 'mae_ate_17', y)
  return nasc != null && nasc >= 30 && mae != null ? (mae / nasc) * 100 : null
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
  if (key === 'analfabetos') {
    const y = ctx.ano
    const r = y == null ? undefined : (ctx.analfabetos?.[ibge]?.[String(y) as '2022' | '2024' | '2026'] ?? undefined)
    return r?.pct_analfabeto ?? null
  }
  if (key === 'risco_rs') return ctx.climaRs?.linhas[ibge]?.indice.score_atual ?? null
  if (key === 'homicidios' || key === 'vitimas_negras' || key === 'mae_adolescente') return humanoValue(key, ibge, ctx)
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
  if (def.key === 'risco_rs') return { min: 0, max: 60, kind: def.kind }
  if (!Number.isFinite(lo) || lo === hi) return { min: 0, max: 1, kind: def.kind }
  return { min: lo, max: hi, kind: def.kind }
}

export function formatValue(key: MetricKey, v: number | null | undefined, compare: boolean): string {
  if (v == null || Number.isNaN(v)) return 'sem dado'
  if (compare) return fPp(v)
  if (key === 'ti_area') return `${fInt(v)} ha`
  if (key === 'homicidios') return `${fNum1(v)} por 100 mil`
  if (key === 'zt' || key === 'zn') return fZ(v)
  if (key === 'score' || key === 'risco_rs') return fNum1(v)
  if (key === 'margem') return `${fNum1(v)} pp`
  return fPct(v)
}
export const formatTick = (key: MetricKey, v: number, compare: boolean): string => {
  if (compare) return fSigned1(v)
  if (key === 'ti_area') return fCompact(v)
  if (key === 'homicidios') return String(Math.round(v))
  if (key === 'pop_indigena' || key === 'pop_quilombola') return v < 1 ? fNum1(v) + '%' : `${Math.round(v)}%`
  if (key === 'zt' || key === 'zn') return fZ(v)
  if (key === 'score' || key === 'risco_rs') return String(Math.round(v))
  return `${Math.round(v)}${key === 'margem' ? ' pp' : '%'}`
}

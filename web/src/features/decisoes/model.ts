import type { Decisao } from '@/features/data/schemas'
import type { SetorKey } from '@/features/data/schemas'

export type Presidencia = 'direita' | 'esquerda'
export type ImpactKey = 'debt' | 'selic' | 'ipca' | 'gdp'

export const IMPACTS: { key: ImpactKey; label: string; unit: string; higherIsBetter: boolean }[] = [
  { key: 'debt', label: 'Dívida/PIB', unit: 'pp do PIB', higherIsBetter: false },
  { key: 'selic', label: 'Selic', unit: 'pp a.a.', higherIsBetter: false },
  { key: 'ipca', label: 'IPCA', unit: 'pp a.a.', higherIsBetter: false },
  { key: 'gdp', label: 'Crescimento do PIB', unit: 'pp a.a.', higherIsBetter: true },
]
export const impactDef = (k: ImpactKey) => IMPACTS.find((i) => i.key === k) ?? (IMPACTS[0] as (typeof IMPACTS)[number])

/** "Bom" sempre para cima: inverte o sinal das métricas em que menos é melhor. */
export const goodness = (d: Decisao, k: ImpactKey) => (impactDef(k).higherIsBetter ? 1 : -1) * d.impacto_2035[k]

export type Quadrant = 'facil-bom' | 'dificil-bom' | 'facil-ruim' | 'dificil-ruim'
export const QUADRANT_LABEL: Record<Quadrant, string> = {
  'facil-bom': 'Fácil e bom',
  'dificil-bom': 'Difícil e bom',
  'facil-ruim': 'Fácil e ruim',
  'dificil-ruim': 'Difícil e ruim',
}
export function quadrant(d: Decisao, k: ImpactKey, pres: Presidencia): Quadrant {
  const easy = d.p_aprovacao[pres] >= 0.5
  const good = goodness(d, k) >= 0
  return `${easy ? 'facil' : 'dificil'}-${good ? 'bom' : 'ruim'}` as Quadrant
}

export const INSTRUMENTO_LABEL: Record<string, string> = {
  PEC: 'PEC',
  LC: 'Lei complementar',
  LO: 'Lei ordinária',
  SENADO_ABS: 'Senado (maioria absoluta)',
  SENADO_2_3: 'Senado (2/3)',
  EXECUTIVO: 'Ato do Executivo',
}

/** Palpite de setor mais afetado a partir do texto da decisão (o contrato não traz esse campo). */
export function guessSetor(d: Decisao): SetorKey {
  const t = `${d.id} ${d.rotulo} ${d.ganhadores.join(' ')} ${d.perdedores.join(' ')}`.toLowerCase()
  if (/agro|rural|safra|mercosul|exporta/.test(t)) return 'agro'
  if (/ind[uú]stri|manufatur|fabril/.test(t)) return 'industria'
  if (/servidor|administra[cç]|funcionalismo|p[uú]blic/.test(t)) return 'adm_publica'
  return 'servicos'
}

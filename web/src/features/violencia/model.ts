import type { PensadorV } from './schemas'

/** Famílias de leitura (A–F do levantamento) usadas para filtrar os pensadores. Derivadas do texto livre de `tradicao`. */
export const GRUPOS_V = [
  'Estado e poder',
  'Estrutural, simbólica e cultural',
  'Resistência não violenta',
  'Psicologia e criminologia',
  'Economia e instituições',
  'Brasil',
] as const
export type GrupoV = (typeof GRUPOS_V)[number]

const BR = /brasil|rio de janeiro|são paulo|pernambuco|ipea|fbsp|yanomami|pensamento indígena|pensamento negro|feminista negro|luta armada|memória e justiça/i
const NAO_VIOLENTA = /não violenta|direitos civis|resistência civil|transcendental/i
const ESTRUTURAL = /pesquisa para a paz|sociologia francesa|antropologia filosófica|antropologia médica|antropologia da violência|sociologia da punição/i
const ECON = /econom|institucional|ordens|nova economia/i
const PSICO = /psicologia|criminolog|funcionalista|sociologia urbana e crimin/i
const PSICO_NOMES = /Milgram|Zimbardo|Bandura|Cohen|Sampson|Merton|Wilson|Sutherland|Bauman/

export function grupoV(p: Pick<PensadorV, 'nome' | 'tradicao'>): GrupoV {
  const t = p.tradicao ?? ''
  if (BR.test(t) || /^(Gilberto|Sérgio Buarque|Florestan|Darcy)/.test(p.nome)) return 'Brasil'
  if (NAO_VIOLENTA.test(t)) return 'Resistência não violenta'
  if (ESTRUTURAL.test(t)) return 'Estrutural, simbólica e cultural'
  if (/Becker|Collier|Acemoglu|North|Skaperdas|Fajnzylber/.test(p.nome) || ECON.test(t)) return 'Economia e instituições'
  if (PSICO.test(t) || PSICO_NOMES.test(p.nome)) return 'Psicologia e criminologia'
  return 'Estado e poder'
}

export type Debate = { punitivista?: string; preventiva?: string; evidencia?: string; sintese?: string; bruto: string }

/** Separa o texto do diálogo punitivista × preventivo nas duas “melhores versões”, na evidência e na síntese. */
export function partirDebate(div: string | null | undefined): Debate {
  const t = (div ?? '').trim()
  const take = (re: RegExp) => re.exec(t)?.[1]?.trim() || undefined
  return {
    punitivista: take(/Melhor versão punitivista[^:]*:\s*([\s\S]*?)(?=\s*Melhor versão preventiva|$)/i),
    preventiva: take(/Melhor versão preventiva[^:]*:\s*([\s\S]*?)(?=\s*Evidência:|\s*Não são excludentes|$)/i),
    evidencia: take(/Evidência:\s*([\s\S]*?)(?=\s*Não são excludentes|$)/i),
    sintese: take(/(Não são excludentes[\s\S]*)$/i),
    bruto: t,
  }
}

export const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

import type { Marx, MarxTexto } from './schemas'

export const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Código de idioma do trecho (atributo lang). Usa o idioma do trecho; cai para o original. */
export function langOf(t: Pick<MarxTexto, 'idioma_do_trecho' | 'idioma_original'>): 'de' | 'fr' | 'en' {
  const s = norm(t.idioma_do_trecho ?? t.idioma_original ?? '')
  if (s.startsWith('franc')) return 'fr'
  if (s.startsWith('ingl')) return 'en'
  return 'de'
}
export const LANG_NOME = { de: 'alemão', fr: 'francês', en: 'inglês' } as const

/** Textos de fontes que não são MIA, Gutenberg nem edição conhecida são espelhos de terceiros (ex.: MEW/Zeno). */
export function isEspelho(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const h = new URL(url).hostname
    return !/marxists\.org$|gutenberg/i.test(h)
  } catch {
    return false
  }
}
export const hostOf = (url: string | null | undefined) => {
  try {
    return url ? new URL(url).hostname : ''
  } catch {
    return ''
  }
}

export type Uso = { tipo: 'teses' | 'contra' | 'mal' | 'defs'; id: string; rotulo: string }
export const USO_ABA: Record<Uso['tipo'], string> = { teses: 'Tese', contra: 'Contra-argumento', mal: 'Mal-entendido', defs: 'Definição' }

/** Índice reverso: em que teses, contra-argumentos, mal-entendidos e definições cada trecho é citado. */
export function indiceDeUso(d: Marx): Map<string, Uso[]> {
  const m = new Map<string, Uso[]>()
  const add = (tid: string, u: Uso) => m.set(tid, [...(m.get(tid) ?? []), u])
  for (const t of d.teses ?? []) for (const x of t.textos_de_apoio ?? []) add(x, { tipo: 'teses', id: t.id, rotulo: t.titulo })
  for (const t of d.contra_argumentos ?? []) for (const x of t.textos ?? []) add(x, { tipo: 'contra', id: t.id, rotulo: t.contra_tese })
  for (const t of d.mal_entendidos ?? []) for (const x of t.textos ?? []) add(x, { tipo: 'mal', id: t.id, rotulo: t.equivoco })
  for (const t of d.definicoes ?? []) for (const x of t.textos ?? []) add(x, { tipo: 'defs', id: t.termo, rotulo: t.termo })
  return m
}

/** Slug estável para ancorar definições (que não têm id). */
export const slug = (s: string) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const naoConferida = (nota: string | null | undefined) => /n[ãa]o conferid/i.test(nota ?? '')

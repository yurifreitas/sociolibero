import type { Doc, Trecho } from './schemas'

/** Separa o cabeçalho de proveniência do corpo. O marcador é a LINHA exata `=== TEXTO ===` (o cabeçalho cita o marcador entre aspas). */
export function splitTexto(raw: string): { cabecalho: string; corpo: string } {
  const m = /^=== TEXTO ===\n/m.exec(raw)
  if (!m) return { cabecalho: '', corpo: raw }
  return { cabecalho: raw.slice(0, m.index).trim(), corpo: raw.slice(m.index + m[0].length) }
}

export async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export type HashLinha = { ok: boolean; calculado: string; esperado: string }
export type HashCheck = { corpo: HashLinha; arquivo: HashLinha | null }

/** O SHA-256 do índice vale para o corpo sem a quebra de linha final; o do arquivo vale para o arquivo inteiro. */
export async function verifyHashes(raw: string, doc: Doc): Promise<HashCheck> {
  const { corpo } = splitTexto(raw)
  const calcCorpo = await sha256Hex(corpo.endsWith('\n') ? corpo.slice(0, -1) : corpo)
  const eC = doc.origem?.sha256 ?? ''
  const eA = doc.origem?.sha256_arquivo ?? ''
  const calcArq = eA ? await sha256Hex(raw) : null
  return {
    corpo: { ok: calcCorpo === eC, calculado: calcCorpo, esperado: eC },
    arquivo: calcArq ? { ok: calcArq === eA, calculado: calcArq, esperado: eA } : null,
  }
}

/** Mesmo comprimento do original: cada caractere vira sua forma-base minúscula (a busca sem acento mantém os deslocamentos). */
export function foldKeepLength(s: string): string {
  let out = ''
  for (const ch of s) {
    const b = ch.normalize('NFD')[0] ?? ch
    out += b.toLowerCase().padEnd(ch.length, ' ').slice(0, ch.length)
  }
  return out
}

export type Bloco = { n: number; ini: number; fim: number; texto: string }
/** Uma linha não vazia = um bloco; guarda o deslocamento no corpo para realçar trechos e achados. */
export function toBlocos(corpo: string): Bloco[] {
  const blocos: Bloco[] = []
  let off = 0
  let n = 0
  for (const linha of corpo.split('\n')) {
    if (linha.trim()) blocos.push({ n: n++, ini: off, fim: off + linha.length, texto: linha })
    off += linha.length + 1
  }
  return blocos
}

export type Marca = { ini: number; fim: number; tipo: 'trecho' | 'busca' | 'busca-atual'; id?: string; k?: number }

export type Estrutura = { n: number; rotulo: string }
const RE_ESTRUTURA = /^\s*(Art\.{1,2}\s*\d+[º°o]?[-A-Z]*\.?|CAP[IÍ]TULO|T[IÍ]TULO|SE[CÇ][AÃ]O|LIVRO|DISPOSI[CÇ][OÕ]ES|ATO|EMENDA|PRE[AÂ]MBULO)/i
export function indiceEstrutural(blocos: Bloco[]): Estrutura[] {
  const out: Estrutura[] = []
  for (const b of blocos) if (RE_ESTRUTURA.test(b.texto)) out.push({ n: b.n, rotulo: b.texto.trim().slice(0, 72) })
  return out
}

/** Acha a âncora de um trecho-chave no corpo (primeiro acerto exato; senão ignora acento e caixa). */
export function localizar(corpo: string, ancora: string): { ini: number; fim: number } | null {
  let i = corpo.indexOf(ancora)
  if (i >= 0) return { ini: i, fim: i + ancora.length }
  i = foldKeepLength(corpo).indexOf(foldKeepLength(ancora))
  return i >= 0 ? { ini: i, fim: i + ancora.length } : null
}

export function acharTermo(corpo: string, termo: string, max = 2000): number[] {
  const t = foldKeepLength(termo.trim())
  if (t.length < 2) return []
  const hay = foldKeepLength(corpo)
  const out: number[] = []
  let i = hay.indexOf(t)
  while (i >= 0 && out.length < max) {
    out.push(i)
    i = hay.indexOf(t, i + t.length)
  }
  return out
}

export const CONF_NIVEL = (s: string | null | undefined): { nivel: 'conferido' | 'parcial' | 'unica' | 'sem'; rotulo: string } => {
  const t = (s ?? '').toLowerCase()
  if (t.includes('original conferido')) return { nivel: 'conferido', rotulo: 'conferido contra a fonte' }
  if (t.includes('parcial')) return { nivel: 'parcial', rotulo: 'conferência parcial' }
  if (t.includes('fonte única') || t.includes('fonte unica')) return { nivel: 'unica', rotulo: 'fonte única' }
  return { nivel: 'sem', rotulo: s ? s.slice(0, 40) : 'sem conferência' }
}

export const TEMA_ROTULO: Record<string, string> = {
  voto_analfabeto: 'voto do analfabeto',
  sufragio_feminino: 'voto feminino',
  eleicao_indireta: 'eleição indireta',
  censo: 'voto censitário',
  escravidao: 'escravidão',
  sistema: 'sistema eleitoral',
  financiamento: 'financiamento',
  reeleicao: 'reeleição',
  inelegibilidade: 'inelegibilidade',
  terra_indigena: 'terra indígena',
  direitos_quilombolas: 'direitos quilombolas',
  poder_judiciario: 'Poder Judiciário',
  suspensao_direitos_politicos: 'suspensão de direitos políticos',
  partidos: 'partidos',
  cotas_genero: 'cotas de gênero',
  censura_propaganda: 'propaganda e censura',
  ia_propaganda: 'IA em propaganda',
  voto_distrital: 'voto distrital',
  voto_secreto: 'voto secreto',
  federalismo: 'federalismo',
}
export const temaRotulo = (t: string | null | undefined) => (t ? (TEMA_ROTULO[t] ?? t.replaceAll('_', ' ')) : '—')

export const temasDoc = (d: Doc): string[] => [...new Set((d.trechos_chave ?? []).map((t: Trecho) => t.tema).filter((x): x is string => !!x))]

export const norm = (s: string) => foldKeepLength(s)

/** Para cada eleição/movimento/evento, os trechos-chave da biblioteca que o citam: base dos links cruzados. */
export type TrechoRef = { doc: Doc; trecho: Trecho }
export function indiceCruzado(docs: Doc[]) {
  const porEleicao = new Map<string, TrechoRef[]>()
  const porMovimento = new Map<string, TrechoRef[]>()
  const porHistoria = new Map<string, TrechoRef[]>()
  const porIndigena = new Map<string, TrechoRef[]>()
  const push = (m: Map<string, TrechoRef[]>, k: string, v: TrechoRef) => m.set(k, [...(m.get(k) ?? []), v])
  for (const doc of docs)
    for (const trecho of doc.trechos_chave ?? []) {
      for (const k of trecho.eleicoes_ids ?? []) push(porEleicao, k, { doc, trecho })
      for (const k of trecho.movimentos_ids ?? []) push(porMovimento, k, { doc, trecho })
      for (const k of trecho.historia_ids ?? []) push(porHistoria, k, { doc, trecho })
      for (const k of trecho.indigenas_ids ?? []) push(porIndigena, k, { doc, trecho })
    }
  return { porEleicao, porMovimento, porHistoria, porIndigena }
}
export const hrefTrecho = (r: TrechoRef) => `/biblioteca?id=${r.doc.id}&trecho=${r.trecho.id}`

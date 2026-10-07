import type { Anel, Aresta } from './schemas'

/** Ordena os nós do laço principal seguindo as arestas que não são ramal; nós fora do laço viram ramais. */
export function ringOrder(a: Anel): { ring: string[]; branches: string[] } {
  const main = a.arestas.filter((e) => !e.ramal)
  const next = new Map<string, string>()
  for (const e of main) if (!next.has(e.de)) next.set(e.de, e.para)
  const start = main[0]?.de
  const ring: string[] = []
  let cur = start
  while (cur && !ring.includes(cur)) {
    ring.push(cur)
    cur = next.get(cur)
  }
  const branches = a.nos.map((n) => n.id).filter((id) => !ring.includes(id))
  return { ring, branches }
}

/** Hipótese pura: nenhuma evidência verificada na aresta. */
export const isHypothesis = (e: Aresta) => !(e.evidencia ?? []).some((x) => x.verificado === true)

export const FORCA_W: Record<string, number> = { forte: 4.6, media: 3.2, fraca: 2.2, incerta: 1.6 }
export const forcaLabel = (f?: string | null) => (f === 'media' ? 'média' : (f ?? 'sem classificação'))

export const TIPO_LABEL: Record<string, string> = { reforco: 'Reforçador (R)', equilibrio: 'Equilibrador (B)' }
export const tipoShort = (t: string) => (t === 'reforco' ? 'R' : 'B')

/** Cores por domínio dos nós (OKLCH via tokens existentes; texto sempre acompanha). */
export const DOMAIN_COLOR: Record<string, string> = {
  economia: 'var(--st-derivado)',
  Estado: 'var(--st-julgamento)',
  instituições: 'var(--st-parcial)',
  clima: 'var(--st-oficial)',
  tecnologia: 'var(--brand)',
  desigualdade: 'var(--neg)',
  social: 'var(--warn)',
  território: 'var(--accent)',
}
export const domainColor = (d?: string | null) => DOMAIN_COLOR[d ?? ''] ?? 'var(--text-muted)'

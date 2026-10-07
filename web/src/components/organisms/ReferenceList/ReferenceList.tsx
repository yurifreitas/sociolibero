import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import type { Reference } from '@/features/data/schemas'
import styles from './ReferenceList.module.css'

export const CATEGORY_LABEL: Record<string, string> = {
  'forense-eleitoral': 'Forense eleitoral',
  'dados-abertos': 'Dados abertos',
  visualizacao: 'Visualização',
  'antifraude-gastos': 'Antifraude em gastos públicos',
  'seguranca-urna': 'Segurança da urna',
  'clima-risco': 'Clima, risco e adaptação (projeto climate)',
  'textos-eleicoes': 'Textos legais e eleições',
  'pensamento-violencia': 'Pensamento, Estado e violência',
  'corrupcao-economia': 'Corrupção, economia e clima',
  'historia-povos': 'História, povos e clima antigo',
}

export function groupByCategory(refs: Reference[]): [string, Reference[]][] {
  const m = new Map<string, Reference[]>()
  for (const r of refs) m.set(r.categoria, [...(m.get(r.categoria) ?? []), r])
  const known = Object.keys(CATEGORY_LABEL).filter((k) => m.has(k))
  const other = [...m.keys()].filter((k) => !(k in CATEGORY_LABEL)).sort()
  return [...known, ...other].map((k) => [k, m.get(k) as Reference[]])
}

const authors = (a: Reference['autores']) => (Array.isArray(a) ? a.join('; ') : a ?? '')

export function ReferenceList({ refs }: { refs: Reference[] }) {
  return (
    <div className={styles.root}>
      {groupByCategory(refs).map(([cat, items]) => (
        <section key={cat} aria-labelledby={`cat-${cat}`} className={styles.group}>
          <h2 id={`cat-${cat}`} className={styles.h}>
            {CATEGORY_LABEL[cat] ?? cat}
          </h2>
          <ul className={styles.list}>
            {items.map((r) => (
              <li key={r.id} className={styles.item}>
                <div className={styles.titleRow}>
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer" className={styles.title}>
                      {r.titulo} <Icon name="external" size={13} />
                    </a>
                  ) : (
                    <span className={styles.title}>{r.titulo}</span>
                  )}
                  <Badge tone={r.verificado ? 'pos' : 'warn'}>{r.verificado ? 'verificado' : 'a confirmar'}</Badge>
                </div>
                <p className={styles.meta}>
                  {[authors(r.autores), r.ano != null ? String(r.ano) : '', r.doi ? `doi:${r.doi}` : ''].filter(Boolean).join(' · ')}
                </p>
                {r.o_que_aproveitar && (
                  <p className={styles.use}>
                    <strong>O que aproveitar:</strong> {r.o_que_aproveitar}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

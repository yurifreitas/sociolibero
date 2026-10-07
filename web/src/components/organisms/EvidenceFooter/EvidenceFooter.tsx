import { Link, useLocation } from 'react-router-dom'
import { Icon } from '@/components/atoms/Icon'
import { ProposalCard } from '@/components/molecules/ProposalCard'
import { RefItem, type RefItemData } from '@/components/molecules/RefItem'
import { useBases, usePropostas } from '@/features/bases/hooks'
import { AREA_LABEL, PROPOSAL_AREAS, pageKeyFromPath, type PageKey } from '@/features/bases/model'
import { useReferences } from '@/features/data/hooks'
import type { Reference } from '@/features/data/schemas'
import styles from './EvidenceFooter.module.css'

type Cfg = { categories: string[]; baseLinks: string[]; gap?: { text: string; proposta: string } }
const PAGE_REFS: Partial<Record<PageKey, Cfg>> = {
  mapa: { categories: ['dados-abertos', 'visualizacao'], baseLinks: [] },
  municipio: { categories: ['forense-eleitoral', 'dados-abertos'], baseLinks: [] },
  forense: { categories: ['forense-eleitoral', 'antifraude-gastos', 'seguranca-urna'], baseLinks: [] },
  decisoes: {
    categories: [],
    baseLinks: ['modelo-macro'],
    gap: { text: 'O acervo ainda não tem literatura de macroeconomia para os efeitos de cada decisão.', proposta: 'efeitos-publicados-nas-decisoes' },
  },
  historia: { categories: [], baseLinks: ['historia', 'evolucoes', 'aneis'] },
  corrupcao: { categories: ['antifraude-gastos'], baseLinks: ['custo-corrupcao', 'clima-valor'] },
  pessimismo: { categories: [], baseLinks: ['pessimismo', 'visoes-pessimistas'] },
  quebras: { categories: [], baseLinks: ['quebras', 'series-historicas'] },
  gente: { categories: [], baseLinks: ['economia-historica', 'historia'] },
  futuro: { categories: [], baseLinks: ['leis-tecnologicas', 'futuros', 'modelo-macro'] },
  antes: { categories: [], baseLinks: ['antes-de-1500'] },
  clima: { categories: ['clima-risco'], baseLinks: ['clima', 'clima-valor'] },
  potenciais: { categories: [], baseLinks: ['potenciais-brasil'] },
  pilares: { categories: [], baseLinks: ['pilares-pensamento'] },
}

const authors = (a: Reference['autores']) => (Array.isArray(a) ? a.join('; ') : (a ?? ''))

/** Rodapé de evidência de cada página: referências relevantes (com selo) e propostas relacionadas. */
export function EvidenceFooter() {
  const { pathname } = useLocation()
  const page = pageKeyFromPath(pathname)
  const cfg = PAGE_REFS[page]
  const areas = PROPOSAL_AREAS[page]
  const refsQ = useReferences(cfg && cfg.categories.length > 0 ? 'references.json' : null)
  const basesQ = useBases()
  const propQ = usePropostas()
  if (!cfg && areas.length === 0) return null

  const items: RefItemData[] = []
  for (const r of (refsQ.data ?? []).filter((x) => cfg?.categories.includes(x.categoria)).sort((a, b) => Number(!!b.verificado) - Number(!!a.verificado)).slice(0, 6))
    items.push({ id: r.id, titulo: r.titulo, url: r.url, seal: r.verificado ? 'verificado' : 'a confirmar', meta: [authors(r.autores), r.ano != null ? String(r.ano) : ''].filter(Boolean).join(' · '), uso: r.o_que_aproveitar })
  for (const id of cfg?.baseLinks ?? []) {
    const b = basesQ.data?.bases.find((x) => x.id === id)
    for (const l of (b?.links ?? []).filter((x) => x.url && !x.url.startsWith('#')).slice(0, 4))
      items.push({ id: `${id}:${l.url}`, titulo: l.titulo, url: l.url, seal: l.verificado === false ? 'a confirmar' : 'link ok', meta: l.n && l.n > 1 ? `citada ${l.n}× nesta página` : b?.nome })
  }

  const props = (propQ.data?.propostas ?? [])
    .filter((p) => areas.includes(p.area))
    .sort((a, b) => Number(b.status === 'em-andamento') - Number(a.status === 'em-andamento'))
  const gapProp = cfg?.gap ? propQ.data?.propostas.find((p) => p.id === cfg.gap?.proposta) : undefined
  const shown = props.slice(0, 3)
  const loading = (cfg?.categories.length ?? 0) > 0 ? refsQ.isPending : false

  return (
    <footer className={styles.footer} aria-label="Referências e propostas desta página">
      <div className={styles.inner}>
        {cfg && (
          <section aria-labelledby="ev-refs">
            <header className={styles.head}>
              <p className="eyebrow" id="ev-refs">Referências desta página</p>
              <Link to="/referencias" className={styles.all}>Todas as referências <Icon name="arrowRight" size={13} /></Link>
            </header>
            {loading ? (
              <p className={styles.muted}>Carregando referências…</p>
            ) : items.length > 0 ? (
              <ul className={styles.grid}>{items.slice(0, 6).map((r) => <RefItem key={r.id} r={r} />)}</ul>
            ) : null}
            {cfg.gap && (
              <p className={styles.gap}>
                <Icon name="info" size={14} /> {cfg.gap.text}
                {gapProp && <> Proposta relacionada: <Link to="/propostas">{gapProp.titulo}</Link>.</>}
              </p>
            )}
          </section>
        )}
        {shown.length > 0 && (
          <section aria-labelledby="ev-props">
            <header className={styles.head}>
              <p className="eyebrow" id="ev-props">Propostas relacionadas · {areas.map((a) => AREA_LABEL[a] ?? a).join(', ')}</p>
              <Link to={`/propostas?area=${areas[0]}`} className={styles.all}>Ver todas <Icon name="arrowRight" size={13} /></Link>
            </header>
            <div className={styles.grid}>{shown.map((p) => <ProposalCard key={p.id} p={p} />)}</div>
          </section>
        )}
      </div>
    </footer>
  )
}

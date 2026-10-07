import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '@/components/atoms/Icon'
import { Kbd } from '@/components/atoms/Kbd'
import { StatusGlyph } from '@/components/atoms/StatusGlyph'
import { CopyButton } from '@/components/molecules/CopyButton'
import { useBases } from '@/features/bases/hooks'
import { pageKeyFromPath, STATUS_INFO, type PageKey } from '@/features/bases/model'
import type { Base } from '@/features/bases/schema'
import { useChrome } from '@/features/chrome/ChromeContext'
import { cn } from '@/lib/cn'
import { fDateTime } from '@/lib/format'
import styles from './BasesDrawer.module.css'

const PAGE_LABEL: Record<PageKey, { label: string; to: string }> = {
  home: { label: 'Visão geral', to: '/' },
  mapa: { label: 'Mapa', to: '/mapa' },
  municipio: { label: 'Município', to: '/mapa' },
  decisoes: { label: 'Decisões', to: '/decisoes' },
  historia: { label: 'História', to: '/historia' },
  antes: { label: 'Antes de 1500', to: '/antes-de-1500' },
  gente: { label: 'Economia & gente', to: '/gente' },
  clima: { label: 'Clima', to: '/clima' },
  potenciais: { label: 'Potenciais', to: '/potenciais' },
  pilares: { label: 'Pilares', to: '/pilares' },
  forense: { label: 'Forense', to: '/forense' },
  corrupcao: { label: 'Custo da corrupção', to: '/corrupcao' },
  pessimismo: { label: 'Visões pessimistas', to: '/pessimismo' },
  quebras: { label: 'Quebras estruturais', to: '/quebras' },
  futuro: { label: 'Futuro', to: '/futuro' },
  propostas: { label: 'Propostas', to: '/propostas' },
  metodo: { label: 'Método & fontes', to: '/metodo' },
  referencias: { label: 'Referências', to: '/referencias' },
}

function BaseCard({ b, open, onToggle, focus }: { b: Base; open: boolean; onToggle: () => void; focus: boolean }) {
  const id = useId()
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (focus) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focus])
  return (
    <section ref={ref} className={cn(styles.card, open && styles.cardOpen, focus && styles.flash)} aria-labelledby={`${id}-h`} data-status={b.status}>
      <h3 className={styles.cardH} id={`${id}-h`}>
        <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={`${id}-b`} onClick={onToggle}>
          <StatusGlyph status={b.status} size={16} />
          <span className={styles.cardTitle}>
            <span className={styles.name}>{b.nome}</span>
            <span className={styles.cov}>{b.cobertura}</span>
          </span>
          <span className={cn(styles.pill, styles[`st_${b.status}`])}>{b.status_rotulo}</span>
          <Icon name="chevron" size={16} className={styles.chev} />
        </button>
      </h3>
      <div className={styles.collapse} data-open={open}>
        <div className={styles.inner} id={`${id}-b`} inert={!open}>
          <p className={styles.explain}>{STATUS_INFO[b.status].explain}</p>

          {b.nota && (
            <p className={styles.callout}>
              <Icon name="info" size={14} /> {b.nota}
            </p>
          )}

          {(b.fonte || b.extraido_em) && (
            <dl className={styles.kv}>
              {b.fonte && (
                <>
                  <dt>Fonte</dt>
                  <dd>
                    {b.fonte.url && !b.fonte.url.startsWith('#') ? (
                      <a href={b.fonte.url} target="_blank" rel="noreferrer">
                        {b.fonte.nome} <Icon name="external" size={12} />
                      </a>
                    ) : (
                      b.fonte.nome
                    )}
                  </dd>
                </>
              )}
              {b.extraido_em && (
                <>
                  <dt>Extraído em</dt>
                  <dd className="num">{fDateTime(b.extraido_em)}</dd>
                </>
              )}
            </dl>
          )}

          {b.hashes.length > 0 && (
            <div className={styles.group}>
              <h4 className={styles.gh}>SHA-256</h4>
              <ul className={styles.hashes}>
                {b.hashes.map((h) => (
                  <li key={h.rotulo + h.sha256}>
                    <span className={styles.hl}>{h.rotulo}</span>
                    <code className={styles.hash} title={h.sha256}>{h.curto ?? h.sha256}</code>
                    <CopyButton text={h.sha256} label={`Copiar SHA-256 completo de ${h.rotulo}`} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {b.validacoes.length > 0 && (
            <div className={styles.group}>
              <h4 className={styles.gh}>Validações feitas</h4>
              <ul className={styles.checks}>
                {b.validacoes.map((v) => (
                  <li key={v.texto} data-ok={String(v.ok)}>
                    <span className={styles.mark} aria-label={v.ok === true ? 'passou' : v.ok === false ? 'falhou ou diverge' : 'ressalva'}>
                      {v.ok === true ? <Icon name="check" size={13} /> : v.ok === false ? <Icon name="x" size={13} /> : '•'}
                    </span>
                    <span>{v.texto}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {b.limites.length > 0 && (
            <div className={styles.group}>
              <h4 className={styles.gh}>O que esta base não diz</h4>
              <ul className={styles.limits}>
                {b.limites.map((l) => (
                  <li key={l}>
                    <Icon name="alert" size={13} />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {b.links.length > 0 && (
            <div className={styles.group}>
              <h4 className={styles.gh}>Para conferir</h4>
              <ul className={styles.links}>
                {b.links.map((l) => (
                  <li key={l.url ?? l.titulo}>
                    {l.url && !l.url.startsWith('#') ? (
                      <a href={l.url} target="_blank" rel="noreferrer">
                        {l.titulo} <Icon name="external" size={12} />
                      </a>
                    ) : (
                      <span>{l.titulo}</span>
                    )}
                    {l.n != null && l.n > 1 && <span className={styles.n}>citada {l.n}×</span>}
                    {l.verificado === false && <span className={styles.bad}>não aberta</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.group}>
            <h4 className={styles.gh}>Usada em</h4>
            <ul className={styles.pages}>
              {[...new Set(b.paginas.filter((p): p is PageKey => p in PAGE_LABEL && p !== 'municipio'))].map((p) => (
                <li key={p}>
                  <Link to={PAGE_LABEL[p].to}>{PAGE_LABEL[p].label}</Link>
                </li>
              ))}
            </ul>
            {b.arquivos.length > 0 && <p className={styles.files}>{b.arquivos.join(' · ')}</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Gaveta “Bases & avisos”: <dialog> modal nativo (foco preso, ESC fecha, foco volta ao gatilho). */
export function BasesDrawer() {
  const { drawerOpen, drawerBase, closeDrawer } = useChrome()
  const { pathname } = useLocation()
  const page = pageKeyFromPath(pathname)
  const q = useBases()
  const dlg = useRef<HTMLDialogElement>(null)
  const [scope, setScope] = useState<'page' | 'all'>('page')
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const doc = q.data
  const pageIds = useMemo(() => doc?.paginas[page] ?? [], [doc, page])

  useEffect(() => {
    const d = dlg.current
    if (!d) return
    if (drawerOpen && !d.open) d.showModal()
    if (!drawerOpen && d.open) d.close()
  }, [drawerOpen])

  useEffect(() => {
    if (!drawerOpen || !doc) return
    if (drawerBase) {
      setScope(pageIds.includes(drawerBase) ? 'page' : 'all')
      setOpenIds(new Set([drawerBase]))
    } else {
      setScope('page')
      const first = [...doc.bases].filter((b) => pageIds.includes(b.id)).sort((a, b) => STATUS_INFO[a.status].order - STATUS_INFO[b.status].order)[0]
      setOpenIds(new Set(first ? [first.id] : []))
    }
  }, [drawerOpen, drawerBase, doc, pageIds])

  const list = useMemo(() => {
    const all = [...(doc?.bases ?? [])]
    const rel = (b: Base) => (pageIds.includes(b.id) ? 0 : 1)
    all.sort((a, b) => rel(a) - rel(b) || STATUS_INFO[a.status].order - STATUS_INFO[b.status].order)
    return scope === 'page' ? all.filter((b) => pageIds.includes(b.id)) : all
  }, [doc, pageIds, scope])

  const onBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
    if (!inside) closeDrawer()
  }
  const toggle = (id: string) =>
    setOpenIds((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const porStatus = doc?.resumo.por_status ?? {}
  return (
    <dialog ref={dlg} className={styles.dialog} onClose={closeDrawer} onClick={onBackdrop} aria-labelledby="bases-title">
      {drawerOpen && (
        <div className={styles.panel}>
          <header className={styles.head}>
            <div className={styles.headText}>
              <p className="eyebrow">Evidência</p>
              <h2 id="bases-title" className={styles.title}>Bases &amp; avisos</h2>
              <p className={styles.lead}>De onde vem cada número, quando foi extraído, como foi conferido e o que a base não diz.</p>
            </div>
            <button type="button" className={styles.close} onClick={closeDrawer} aria-label="Fechar gaveta de bases">
              <Icon name="x" size={18} />
            </button>
          </header>

          {doc && (
            <div className={styles.bar}>
              <div className={styles.scope} role="group" aria-label="Escopo da lista">
                <button type="button" aria-pressed={scope === 'page'} onClick={() => setScope('page')}>Esta página <span className="num">{pageIds.length}</span></button>
                <button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')}>Todas <span className="num">{doc.bases.length}</span></button>
              </div>
              <ul className={styles.legend} aria-label="Resumo por status">
                {Object.entries(porStatus)
                  .sort((a, b) => (STATUS_INFO[a[0] as Base['status']]?.order ?? 9) - (STATUS_INFO[b[0] as Base['status']]?.order ?? 9))
                  .map(([s, n]) => (
                    <li key={s} title={STATUS_INFO[s as Base['status']]?.explain}>
                      <StatusGlyph status={s as Base['status']} size={12} />
                      <span>{STATUS_INFO[s as Base['status']]?.label ?? s}</span>
                      <b className="num">{n}</b>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className={styles.body}>
            {q.isPending && <p className={styles.empty}>Carregando registro de bases…</p>}
            {q.isError && <p className={styles.empty}>Falha ao carregar o registro de bases: {(q.error as Error).message}</p>}
            {q.isSuccess && !doc && <p className={styles.empty}>Registro de bases indisponível. Gere com <code>pnpm bases</code>.</p>}
            {list.map((b) => (
              <BaseCard key={b.id} b={b} open={openIds.has(b.id)} onToggle={() => toggle(b.id)} focus={drawerBase === b.id} />
            ))}
          </div>

          <footer className={styles.foot}>
            <span><Kbd>B</Kbd> abre e fecha</span>
            <span><Kbd>Esc</Kbd> fecha</span>
            <span><Kbd>Ctrl</Kbd> <Kbd>K</Kbd> busca tudo</span>
          </footer>
        </div>
      )}
    </dialog>
  )
}

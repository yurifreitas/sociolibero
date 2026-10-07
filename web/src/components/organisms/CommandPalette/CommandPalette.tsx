import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Icon, type IconName } from '@/components/atoms/Icon'
import { Kbd } from '@/components/atoms/Kbd'
import { StatusGlyph } from '@/components/atoms/StatusGlyph'
import { useBases } from '@/features/bases/hooks'
import { useChrome } from '@/features/chrome/ChromeContext'
import { useGeo, useIndex } from '@/features/data/hooks'
import { useMarx } from '@/features/marx/hooks'
import { useViolencia } from '@/features/violencia/hooks'
import { useTheme } from '@/lib/theme'
import { useVtNavigate } from '@/lib/viewTransition'
import styles from './CommandPalette.module.css'

type Cmd = { id: string; group: 'Páginas' | 'Municípios' | 'Pensadores' | 'Trechos de Marx' | 'Bases' | 'Ações'; label: string; hint?: string; icon?: IconName; glyph?: 'base'; keywords?: string; run: () => void; status?: string }

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const score = (q: string, text: string) => {
  const t = norm(text)
  if (t.startsWith(q)) return 0
  if (t.includes(` ${q}`)) return 1
  if (t.includes(q)) return 2
  return Number.POSITIVE_INFINITY
}

const PAGES: { to: string; label: string; icon: IconName; kw: string }[] = [
  { to: '/', label: 'Visão geral', icon: 'home', kw: 'home inicio painel kpi' },
  { to: '/mapa', label: 'Mapa por município', icon: 'map', kw: 'eleicoes coropletico' },
  { to: '/decisoes', label: 'Decisões econômicas e institucionais', icon: 'scale', kw: 'quorum stf pec' },
  { to: '/historia', label: 'História institucional', icon: 'history', kw: 'constituicao ditadura marighella' },
  { to: '/antes-de-1500', label: 'Antes de 1500: povos, clima e manejo', icon: 'hourglass', kw: 'pre colombiano indigenas sambaqui terra preta ancestralidade etnias' },
  { to: '/gente', label: 'Economia & gente', icon: 'users', kw: 'ciclos classes fator humano' },
  { to: '/clima', label: 'Clima e economia', icon: 'leaf', kw: 'el nino enso seca temperatura ipcc queimadas energia' },
  { to: '/potenciais', label: 'Potências do Brasil e potencial de crescimento', icon: 'gem', kw: 'agua minerais nióbio solar pastagens pais do futuro' },
  { to: '/pilares', label: 'Pilares de pensamento', icon: 'layers', kw: 'elias krenak buen vivir ostrom clastres nego bispo viabilizacao' },
  { to: '/marx', label: 'Marx e o capitalismo (textos originais e teses)', icon: 'quote', kw: 'capital mais-valia fetichismo acumulacao primitiva capitalismo nao implementavel mal-entendidos modo de producao' },
  { to: '/violencia', label: 'Pensadores da violência', icon: 'ripple', kw: 'custo da violencia punitivista preventivo tipologia homicidios intervencao legal' },
  { to: '/forense', label: 'Forense eleitoral', icon: 'shield', kw: 'fraude benford' },
  { to: '/corrupcao', label: 'Custo da corrupção e da captura, em R$', icon: 'coins', kw: 'corrupcao sonegacao gastos tributarios beneficios empresas desonerar valor financeiro' },
  { to: '/pessimismo', label: 'Visões pessimistas e testes de estresse', icon: 'trendDown', kw: 'estresse incompetencia captura judicial decisoes ruins capacidade estatal pre-mortem' },
  { to: '/quebras', label: 'Quebras estruturais nas séries', icon: 'activity', kw: 'change point regime cusum validacao sintetica' },
  { to: '/historia?aba=evolucoes', label: 'História: evoluções (cadeias de Markov)', icon: 'history', kw: 'markov regimes democracia erosao cenarios e se matriz probabilidade' },
  { to: '/historia?aba=aneis', label: 'História: anéis de realimentação', icon: 'history', kw: 'aneis lacos causais system dynamics reforcador equilibrador meadows' },
  { to: '/mapa?m=risco_rs', label: 'Mapa: risco climático no RS', icon: 'map', kw: 'enchente rio grande do sul prioridade preventiva climate' },
  { to: '/futuro', label: 'Futuro: leis e projeções', icon: 'compass', kw: 'moore wright projecao tecnologia' },
  { to: '/propostas', label: 'Propostas e próximos passos', icon: 'bulb', kw: 'roadmap' },
  { to: '/metodo', label: 'Método & fontes', icon: 'chart', kw: 'validacao proveniencia' },
  { to: '/referencias', label: 'Referências', icon: 'book', kw: 'bibliografia' },
]
const NEXT = { system: 'light', light: 'dark', dark: 'system' } as const
const NAME = { system: 'automático', light: 'claro', dark: 'escuro' } as const

/** Paleta de comandos (Ctrl/⌘ K): navegar, buscar município, abrir uma base na gaveta, alternar tema. */
export function CommandPalette() {
  const { paletteOpen, closePalette, openDrawer } = useChrome()
  const go = useVtNavigate()
  const { pref, setPref } = useTheme()
  const dlg = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const lid = useId()
  const indexQ = useIndex()
  const wantGeo = paletteOpen
  const geoQ = useGeo(wantGeo ? indexQ.data?.geo : undefined)
  const basesQ = useBases()
  const wantText = paletteOpen && q.trim().length >= 2
  const marxQ = useMarx(wantText)
  const violQ = useViolencia(wantText)

  useEffect(() => {
    const d = dlg.current
    if (!d) return
    if (paletteOpen && !d.open) {
      setQ('')
      setActive(0)
      d.showModal()
      requestAnimationFrame(() => input.current?.focus())
    }
    if (!paletteOpen && d.open) d.close()
  }, [paletteOpen])

  const munis = useMemo(
    () => (geoQ.data?.features ?? []).map((f) => ({ ibge: f.properties.ibge, nome: f.properties.nome, uf: f.properties.uf, key: norm(`${f.properties.nome} ${f.properties.uf}`) })),
    [geoQ.data],
  )

  const results = useMemo<Cmd[]>(() => {
    const close = (fn: () => void) => () => {
      closePalette()
      fn()
    }
    const pages: Cmd[] = PAGES.map((p) => ({ id: `p:${p.to}`, group: 'Páginas', label: p.label, icon: p.icon, keywords: p.kw, run: close(() => go(p.to)) }))
    const actions: Cmd[] = [
      { id: 'a:drawer', group: 'Ações', label: 'Abrir “Bases & avisos”', hint: 'B', icon: 'database', keywords: 'gaveta fontes proveniencia hash', run: close(() => openDrawer()) },
      { id: 'a:theme', group: 'Ações', label: `Alternar tema (agora: ${NAME[pref]})`, icon: pref === 'dark' ? 'moon' : 'sun', keywords: 'claro escuro dark light', run: close(() => setPref(NEXT[pref])) },
    ]
    const bases: Cmd[] = (basesQ.data?.bases ?? []).map((b) => ({ id: `b:${b.id}`, group: 'Bases', label: b.nome, hint: b.status_rotulo, glyph: 'base', status: b.status, keywords: `${b.chip.rotulo} ${b.cobertura}`, run: close(() => openDrawer(b.id)) }))
    const nq = norm(q.trim())
    if (!nq) return [...pages, ...actions, ...bases.slice(0, 4)]
    const pick = (c: Cmd) => Math.min(score(nq, c.label), score(nq, c.keywords ?? ''))
    const rank = (arr: Cmd[]) => arr.map((c) => [c, pick(c)] as const).filter(([, s]) => Number.isFinite(s)).sort((a, b) => a[1] - b[1]).map(([c]) => c)
    const m: Cmd[] =
      nq.length >= 2
        ? munis
            .map((x) => [x, x.key.startsWith(nq) ? 0 : x.key.includes(` ${nq}`) ? 1 : x.key.includes(nq) ? 2 : Number.POSITIVE_INFINITY] as const)
            .filter(([, s]) => Number.isFinite(s))
            .sort((a, b) => a[1] - b[1] || a[0].nome.length - b[0].nome.length)
            .slice(0, 8)
            .map(([x]) => ({ id: `m:${x.ibge}`, group: 'Municípios' as const, label: `${x.nome} · ${x.uf}`, icon: 'map' as const, hint: 'abrir no mapa', run: close(() => go(`/mapa?mun=${x.ibge}`)) }))
        : []
    const pens: Cmd[] = (violQ.data?.pensadores ?? [])
      .map((x) => [x, Math.min(score(nq, x.nome), score(nq, `${x.tradicao ?? ''} ${(x.conceitos ?? []).join(' ')}`))] as const)
      .filter(([, sc]) => Number.isFinite(sc))
      .sort((a, b) => a[1] - b[1])
      .slice(0, 6)
      .map(([x]) => ({ id: `v:${x.id}`, group: 'Pensadores' as const, label: x.nome, icon: 'ripple' as const, hint: 'pensador da violência', run: close(() => go(`/violencia?p=${x.id}`)) }))
    const autores: Cmd[] = (marxQ.data?.pensadores ?? [])
      .map((x) => [x, Math.min(score(nq, x.nome), score(nq, x.posicao ?? ''))] as const)
      .filter(([, sc]) => Number.isFinite(sc))
      .sort((a, b) => a[1] - b[1])
      .slice(0, 4)
      .map(([x]) => ({ id: `ma:${x.id}`, group: 'Pensadores' as const, label: x.nome, icon: 'quote' as const, hint: 'autor em Marx e o capitalismo', run: close(() => go(`/marx?aba=pensadores&i=${x.id}`)) }))
    const trechos: Cmd[] =
      nq.length >= 3
        ? (marxQ.data?.textos ?? [])
            .map((x) => [x, Math.min(score(nq, `${x.tema ?? ''} ${x.obra}`), score(nq, `${x.trecho_original} ${x.traducao_pt ?? ''}`))] as const)
            .filter(([, sc]) => Number.isFinite(sc))
            .sort((a, b) => a[1] - b[1])
            .slice(0, 6)
            .map(([x]) => ({ id: `mt:${x.id}`, group: 'Trechos de Marx' as const, label: `${x.obra.replace(/\s*\(.*$/, '')}${x.ano ? ` (${x.ano})` : ''} · ${x.tema ?? ''}`, icon: 'quote' as const, hint: 'trecho original', run: close(() => go(`/marx?aba=textos&t=${x.id}`)) }))
        : []
    return [...rank(pages), ...m, ...pens, ...autores, ...trechos, ...rank(bases), ...rank(actions)]
  }, [q, munis, basesQ.data, violQ.data, marxQ.data, pref, closePalette, go, openDrawer, setPref])

  useEffect(() => setActive(0), [q])
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(results.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      results[active]?.run()
    }
  }
  const onBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closePalette()
  }

  let lastGroup = ''
  return (
    <dialog ref={dlg} className={styles.dialog} onClose={closePalette} onClick={onBackdrop} aria-label="Paleta de comandos">
      {paletteOpen && (
        <div className={styles.panel} onKeyDown={onKey}>
          <div className={styles.search}>
            <Icon name="search" size={18} />
            <input
              ref={input}
              className={styles.input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar município, página, base ou ação…"
              role="combobox"
              aria-expanded="true"
              aria-controls={lid}
              aria-activedescendant={results[active] ? `${lid}-${active}` : undefined}
              aria-autocomplete="list"
              spellCheck={false}
              autoComplete="off"
            />
            <Kbd>Esc</Kbd>
          </div>
          <ul className={styles.list} id={lid} role="listbox" ref={list}>
            {results.length === 0 && <li className={styles.none}>Nada encontrado para “{q}”. Tente o nome de um município, “mapa” ou “TSE”.</li>}
            {results.map((c, i) => {
              const head = c.group !== lastGroup
              lastGroup = c.group
              return (
                <li key={c.id} role="presentation">
                  {head && <p className={styles.group}>{c.group}</p>}
                  <div
                    id={`${lid}-${i}`}
                    data-i={i}
                    role="option"
                    aria-selected={i === active}
                    className={styles.item}
                    onMouseMove={() => setActive(i)}
                    onClick={c.run}
                  >
                    {c.glyph === 'base' ? <StatusGlyph status={c.status as never} size={16} /> : <Icon name={c.icon ?? 'chevron'} size={16} />}
                    <span className={styles.label}>{c.label}</span>
                    {c.hint && <span className={styles.hint}>{c.hint}</span>}
                  </div>
                </li>
              )
            })}
          </ul>
          <footer className={styles.foot}>
            <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> navegar</span>
            <span><Kbd>↵</Kbd> abrir</span>
            <span className={styles.geo}>{geoQ.isPending && q.length >= 2 ? 'carregando municípios…' : `${munis.length ? munis.length.toLocaleString('pt-BR') + ' municípios' : ''}`}</span>
          </footer>
        </div>
      )}
    </dialog>
  )
}

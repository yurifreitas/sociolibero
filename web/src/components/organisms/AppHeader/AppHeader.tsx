import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Button } from '@/components/atoms/Button'
import { Icon, type IconName } from '@/components/atoms/Icon'
import { Kbd } from '@/components/atoms/Kbd'
import { useChrome } from '@/features/chrome/ChromeContext'
import { groupKeyOf, NAV_GROUPS, NAV_HOME, type NavGroup } from '@/features/nav/model'
import { cn } from '@/lib/cn'
import { useTheme, type ThemePref } from '@/lib/theme'
import { useVtNavigate } from '@/lib/viewTransition'
import styles from './AppHeader.module.css'

const NEXT: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' }
const ICON: Record<ThemePref, IconName> = { system: 'monitor', light: 'sun', dark: 'moon' }
const NAME: Record<ThemePref, string> = { system: 'automático', light: 'claro', dark: 'escuro' }

function GroupMenu({ g, open, active, onToggle, onClose, onNav }: { g: NavGroup; open: boolean; active: boolean; onToggle: () => void; onClose: () => void; onNav: (to: string) => (e: MouseEvent<HTMLAnchorElement>) => void }) {
  const id = useId()
  const wrap = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation()
      onClose()
      btn.current?.focus()
    } else if (e.key === 'ArrowDown' && !open && document.activeElement === btn.current) {
      e.preventDefault()
      onToggle()
    } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && open) {
      const links = [...(wrap.current?.querySelectorAll<HTMLAnchorElement>('[data-item]') ?? [])]
      const i = links.indexOf(document.activeElement as HTMLAnchorElement)
      const next = e.key === 'ArrowDown' ? (i + 1) % links.length : (i - 1 + links.length) % links.length
      e.preventDefault()
      links[i < 0 && e.key === 'ArrowUp' ? links.length - 1 : next]?.focus()
    }
  }
  return (
    <div ref={wrap} className={styles.group} onKeyDown={onKey} onBlur={(e) => { if (open && !wrap.current?.contains(e.relatedTarget as Node | null)) onClose() }}>
      <button ref={btn} type="button" className={cn(styles.gbtn, active && styles.active, open && styles.open)} aria-expanded={open} aria-controls={id} onClick={onToggle}>
        <span>{g.label}</span>
        <Icon name="chevron" size={14} className={styles.chev} />
      </button>
      <div id={id} className={styles.panel} role="group" aria-label={g.label} hidden={!open}>
        <ul>
          {g.items.map((it) => (
            <li key={it.to}>
              <NavLink to={it.to} data-item onClick={onNav(it.to)} className={({ isActive }) => cn(styles.item, isActive && styles.itemOn)}>
                <Icon name={it.icon} size={18} className={styles.ic} />
                <span className={styles.itext}>
                  <b>{it.label}</b>
                  <small>{it.desc}</small>
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function MobileMenu({ open, onClose, onNav }: { open: boolean; onClose: () => void; onNav: (to: string) => (e: MouseEvent<HTMLAnchorElement>) => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} className={styles.mdialog} aria-label="Menu de navegação" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose() }}>
      <div className={styles.mpanel}>
        <header className={styles.mhead}>
          <strong>Navegação</strong>
          <button type="button" className={styles.mclose} onClick={onClose} aria-label="Fechar menu"><Icon name="x" size={18} /></button>
        </header>
        <nav aria-label="Principal (celular)" className={styles.mnav}>
          <NavLink to={NAV_HOME.to} end onClick={(e) => { onNav(NAV_HOME.to)(e); onClose() }} className={({ isActive }) => cn(styles.mitem, isActive && styles.itemOn)}>
            <Icon name={NAV_HOME.icon} size={18} /> <span>{NAV_HOME.label}</span>
          </NavLink>
          {NAV_GROUPS.map((g) => (
            <section key={g.key} aria-label={g.label} className={styles.msec}>
              <h2 className={styles.mh}>{g.label}</h2>
              <ul>
                {g.items.map((it) => (
                  <li key={it.to}>
                    <NavLink to={it.to} onClick={(e) => { onNav(it.to)(e); onClose() }} className={({ isActive }) => cn(styles.mitem, isActive && styles.itemOn)}>
                      <Icon name={it.icon} size={18} />
                      <span className={styles.itext}><b>{it.label}</b><small>{it.desc}</small></span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </div>
    </dialog>
  )
}

export function AppHeader() {
  const { pref, setPref } = useTheme()
  const { openPalette } = useChrome()
  const { pathname } = useLocation()
  const go = useVtNavigate()
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [mobile, setMobile] = useState(false)
  const nav = useRef<HTMLElement>(null)
  const activeGroup = groupKeyOf(pathname)

  const onNav = useCallback(
    (to: string) => (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      setOpenKey(null)
      go(to)
    },
    [go],
  )
  // fecha menus ao mudar de rota e ao clicar fora
  useEffect(() => setOpenKey(null), [pathname])
  useEffect(() => {
    if (!openKey) return
    const off = (e: PointerEvent) => {
      if (!nav.current?.contains(e.target as Node)) setOpenKey(null)
    }
    document.addEventListener('pointerdown', off)
    return () => document.removeEventListener('pointerdown', off)
  }, [openKey])

  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#/" onClick={onNav('/')}>
        <span className={styles.logo} aria-hidden="true" />
        <span className={styles.brandText}>Sociolibero</span>
      </a>
      <nav ref={nav} aria-label="Principal" className={styles.nav}>
        <NavLink to="/" end onClick={onNav('/')} className={({ isActive }) => cn(styles.link, isActive && styles.active)}>
          <Icon name="home" size={16} />
          <span>Visão geral</span>
        </NavLink>
        {NAV_GROUPS.map((g) => (
          <GroupMenu key={g.key} g={g} open={openKey === g.key} active={activeGroup === g.key} onToggle={() => setOpenKey((k) => (k === g.key ? null : g.key))} onClose={() => setOpenKey((k) => (k === g.key ? null : k))} onNav={onNav} />
        ))}
      </nav>
      <span className={styles.spacer} />
      <button type="button" className={styles.search} onClick={openPalette} aria-haspopup="dialog" aria-label="Buscar e navegar (Ctrl K)">
        <Icon name="search" size={15} />
        <span className={styles.searchText}>Buscar</span>
        <span className={styles.keys}>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      <Button variant="ghost" size="sm" aria-label={`Tema: ${NAME[pref]}. Alternar.`} title={`Tema: ${NAME[pref]}`} onClick={() => setPref(NEXT[pref])}>
        <Icon name={ICON[pref]} />
      </Button>
      <Button variant="ghost" size="sm" className={styles.burger} aria-label="Abrir menu de navegação" aria-haspopup="dialog" onClick={() => setMobile(true)}>
        <Icon name="menu" />
      </Button>
      <MobileMenu open={mobile} onClose={() => setMobile(false)} onNav={onNav} />
    </header>
  )
}

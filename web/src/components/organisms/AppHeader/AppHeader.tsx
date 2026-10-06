import { NavLink } from 'react-router-dom'
import { Button } from '@/components/atoms/Button'
import { Icon, type IconName } from '@/components/atoms/Icon'
import { useTheme, type ThemePref } from '@/lib/theme'
import styles from './AppHeader.module.css'

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Mapa', icon: 'map' },
  { to: '/decisoes', label: 'Decisões', icon: 'scale' },
  { to: '/historia', label: 'História', icon: 'history' },
  { to: '/forense', label: 'Forense', icon: 'shield' },
  { to: '/metodo', label: 'Método & Fontes', icon: 'chart' },
  { to: '/referencias', label: 'Referências', icon: 'book' },
]
const NEXT: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' }
const ICON: Record<ThemePref, IconName> = { system: 'monitor', light: 'sun', dark: 'moon' }
const NAME: Record<ThemePref, string> = { system: 'automático', light: 'claro', dark: 'escuro' }

export function AppHeader() {
  const { pref, setPref } = useTheme()
  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#/">
        <span className={styles.logo} aria-hidden="true" />
        Sociolibero
      </a>
      <nav aria-label="Principal" className={styles.nav}>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
            <Icon name={n.icon} size={16} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <Button variant="ghost" size="sm" aria-label={`Tema: ${NAME[pref]}. Alternar.`} title={`Tema: ${NAME[pref]}`} onClick={() => setPref(NEXT[pref])}>
        <Icon name={ICON[pref]} />
      </Button>
    </header>
  )
}

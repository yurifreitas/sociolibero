import { useCallback, useSyncExternalStore } from 'react'
import type { Theme } from './color'

export type ThemePref = 'system' | 'light' | 'dark'
const KEY = 'sl-theme'
const EVT = 'sl-theme-change'

const readPref = (): ThemePref => {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}
const mq = () => window.matchMedia('(prefers-color-scheme: dark)')

const subscribe = (cb: () => void) => {
  const m = mq()
  m.addEventListener('change', cb)
  window.addEventListener(EVT, cb)
  return () => {
    m.removeEventListener('change', cb)
    window.removeEventListener(EVT, cb)
  }
}
const snapshot = () => `${readPref()}|${mq().matches ? 'dark' : 'light'}`

export function useTheme() {
  const snap = useSyncExternalStore(subscribe, snapshot, () => 'system|light')
  const [pref, sys] = snap.split('|') as [ThemePref, Theme]
  const effective: Theme = pref === 'system' ? sys : pref
  const setPref = useCallback((p: ThemePref) => {
    try {
      if (p === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, p)
    } catch {
      /* armazenamento indisponível: segue só em memória/atributo */
    }
    if (p === 'system') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', p)
    window.dispatchEvent(new Event(EVT))
  }, [])
  return { pref, effective, setPref }
}

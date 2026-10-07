import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Chrome = {
  drawerOpen: boolean
  drawerBase: string | null
  openDrawer: (baseId?: string) => void
  closeDrawer: () => void
  paletteOpen: boolean
  openPalette: () => void
  closePalette: () => void
}
const Ctx = createContext<Chrome | null>(null)

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)
}

/** Estado do “chrome” da aplicação: gaveta de bases e paleta de comandos, com atalhos globais. */
export function ChromeProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerBase, setDrawerBase] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)

  const openDrawer = useCallback((baseId?: string) => {
    setDrawerBase(baseId ?? null)
    setDrawerOpen(true)
  }, [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const openPalette = useCallback(() => setPaletteOpen(true), [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      if (e.key.toLowerCase() === 'b' && !paletteOpen) {
        e.preventDefault()
        setDrawerOpen((o) => !o)
        setDrawerBase(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paletteOpen])

  const value = useMemo(
    () => ({ drawerOpen, drawerBase, openDrawer, closeDrawer, paletteOpen, openPalette, closePalette }),
    [drawerOpen, drawerBase, openDrawer, closeDrawer, paletteOpen, openPalette, closePalette],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useChrome(): Chrome {
  const c = useContext(Ctx)
  if (!c) throw new Error('useChrome fora do ChromeProvider')
  return c
}

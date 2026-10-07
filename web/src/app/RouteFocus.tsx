import { useEffect, useRef, type MouseEvent } from 'react'
import { useLocation } from 'react-router-dom'

const MAIN = 'conteudo'

/** Leva o foco ao <main> e a rolagem ao topo. Espera a página (lazy) montar antes de focar. */
export function focusMain() {
  const el = document.getElementById(MAIN)
  if (!el) return false
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
  return true
}

/** A cada mudança de rota (menos a carga inicial): rola ao topo e foca o conteúdo novo, no celular e no desktop. */
export function RouteFocus() {
  const { pathname } = useLocation()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    let timer = 0
    let settled = 0
    const stop = performance.now() + 3000
    const tick = () => {
      // o <main> pode ser o da página antiga até o Suspense resolver: só encerra se o foco ficar estável por 3 checagens
      const ok = focusMain() && document.activeElement === document.getElementById(MAIN)
      settled = ok ? settled + 1 : 0
      if (settled >= 3) return
      if (performance.now() < stop) timer = window.setTimeout(tick, 50)
    }
    timer = window.setTimeout(tick, 50)
    return () => window.clearTimeout(timer)
  }, [pathname])
  return null
}

/** "Pular para o conteúdo" sem tocar no hash do roteador. */
export function skipToContent(e: MouseEvent<HTMLAnchorElement>) {
  e.preventDefault()
  focusMain()
  document.getElementById(MAIN)?.scrollIntoView({ block: 'start' })
}

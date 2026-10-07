import { useEffect } from 'react'

/** Rola até o elemento com este id (respeitando prefers-reduced-motion) quando o id ou a dependência mudam. */
export function useScrollToId(id: string | null, dep?: unknown) {
  useEffect(() => {
    if (!id) return
    const h = requestAnimationFrame(() => {
      const el = document.getElementById(id)
      if (!el) return
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
    })
    return () => cancelAnimationFrame(h)
  }, [id, dep])
}

import { useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, type NavigateOptions, type To } from 'react-router-dom'

/** Navega com View Transition quando disponível (≤ 200 ms) e sem preferência de movimento reduzido. */
export function useVtNavigate() {
  const navigate = useNavigate()
  return useCallback(
    (to: To, opts?: NavigateOptions) => {
      const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!doc.startViewTransition || reduce) return navigate(to, opts)
      doc.startViewTransition(() => {
        flushSync(() => navigate(to, opts))
      })
    },
    [navigate],
  )
}

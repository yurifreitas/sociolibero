import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Estado na URL (filtros sobrevivem a refresh e são compartilháveis). */
export function useUrlState() {
  const [sp, setSp] = useSearchParams()
  const update = useCallback(
    (patch: Record<string, string | null>) =>
      setSp(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(patch)) {
            if (v == null || v === '') next.delete(k)
            else next.set(k, v)
          }
          return next
        },
        { replace: true },
      ),
    [setSp],
  )
  return { get: (k: string) => sp.get(k), update }
}

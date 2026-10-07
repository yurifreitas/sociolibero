import { useEffect, useRef, useState } from 'react'

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Contador animado (ease-out, ≤ 700 ms). Com reduced-motion, pula direto ao valor final. */
export function useCountUp(target: number | null | undefined, ms = 700): number | null {
  const [v, setV] = useState<number | null>(target == null || reduced() ? (target ?? null) : 0)
  const from = useRef(0)
  useEffect(() => {
    if (target == null) {
      setV(null)
      return
    }
    if (reduced()) {
      setV(target)
      return
    }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms)
      const e = 1 - Math.pow(1 - p, 3)
      const cur = a + (target - a) * e
      setV(cur)
      from.current = cur
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

import { Badge } from '@/components/atoms/Badge'

/** Selo de verificação: nunca omite o estado — “não verificado” é visível, e null não vira “verificado”. */
export function Seal({ v, labels }: { v: boolean | null | undefined; labels?: { yes?: string; no?: string; unknown?: string } }) {
  if (v === true) return <Badge tone="pos">{labels?.yes ?? 'verificado'}</Badge>
  if (v === false) return <Badge tone="warn">{labels?.no ?? 'não verificado'}</Badge>
  return <Badge>{labels?.unknown ?? 'sem selo'}</Badge>
}

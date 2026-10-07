import { useId, useState } from 'react'
import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import type { Indicador } from '@/features/gente/schemas'
import { cn } from '@/lib/cn'
import { fInt, fNum2 } from '@/lib/format'
import styles from './IndicatorCard.module.css'

const CAT: Record<string, string> = {
  escravizacao: 'Escravização',
  indigenas: 'Povos indígenas',
  'violencia-estado': 'Violência de Estado',
  conflito: 'Conflitos',
  'fome-seca': 'Fome e seca',
  epidemia: 'Epidemias',
  saude: 'Saúde',
  educacao: 'Educação',
  trabalho: 'Trabalho',
  'violencia-urbana': 'Violência urbana',
}
export const categoriaLabel = (c: string) => CAT[c] ?? c

const num = (n: number) => (Number.isInteger(n) || Math.abs(n) >= 1000 ? fInt(Math.round(n)) : fNum2(n))
const TONE = { corrobora: 'pos', aproximado: 'warn', diverge: 'neg' } as const

/** Indicador de custo humano: valor (ou faixa — null nunca vira zero), tipo, selo de verificação e “o que não mede”. */
export function IndicatorCard({ i }: { i: Indicador }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const shown =
    i.valor != null ? `${num(i.valor)}${i.unidade ? ` ${i.unidade}` : ''}` : i.intervalo && i.intervalo.length === 2 ? `${num(i.intervalo[0] as number)}–${num(i.intervalo[1] as number)}${i.unidade ? ` ${i.unidade}` : ''}` : null
  return (
    <article className={cn('card', styles.card)}>
      <header className={styles.head}>
        <span className={styles.cat}>{categoriaLabel(i.categoria)}</span>
        <div className={styles.seals}>
          <Badge tone={i.tipo === 'estimativa' ? 'warn' : 'neutral'}>{i.tipo}</Badge>
          <Badge tone={i.verificado ? 'pos' : 'warn'}>{i.verificado ? 'conferido na fonte' : 'a confirmar'}</Badge>
        </div>
      </header>
      <h4 className={styles.title}>{i.titulo}</h4>
      <p className={styles.value}>
        {shown ? <span className="num">{shown}</span> : <span className={styles.nodata}>sem valor central na fonte</span>}
        {i.valor != null && i.intervalo && i.intervalo.length === 2 && <span className={styles.range}>faixa {num(i.intervalo[0] as number)}–{num(i.intervalo[1] as number)}</span>}
      </p>
      <p className={styles.period}>{i.periodo}</p>
      {i.corroboracao && i.corroboracao.length > 0 && (
        <ul className={styles.corr}>
          {i.corroboracao.map((c) => (
            <li key={c.detalhe ?? c.resultado}>
              <Badge tone={TONE[c.resultado as keyof typeof TONE] ?? 'neutral'}>{c.resultado}</Badge>
              <span>{c.detalhe}</span>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className={styles.more} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {open ? 'Ocultar' : 'Como foi medido e o que não mede'} <Icon name="chevron" size={13} className={cn(styles.chev, open && styles.chevOpen)} />
      </button>
      <div className={styles.collapse} data-open={open}>
        <div id={id} className={styles.inner} inert={!open}>
          {i.metodo && <p><b>Método.</b> {i.metodo}</p>}
          {i.nao_mede && <p><b>Não mede.</b> {i.nao_mede}</p>}
          {i.fontes && i.fontes.length > 0 && (
            <ul className={styles.src}>
              {i.fontes.map((f) => (
                <li key={f.titulo}>
                  {f.url ? (
                    <a href={f.url} target="_blank" rel="noreferrer">{f.titulo} <Icon name="external" size={11} /></a>
                  ) : (
                    f.titulo
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  )
}

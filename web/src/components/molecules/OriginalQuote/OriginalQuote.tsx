import { cn } from '@/lib/cn'
import styles from './OriginalQuote.module.css'

export type OriginalQuoteProps = {
  /** texto no idioma original */
  text: string
  /** código BCP-47 (de, fr, en…): vai para o atributo lang e melhora hifenização e leitores de tela */
  lang: string
  /** rótulo acima do trecho, ex.: “Original · alemão” */
  label: string
  className?: string
}

/** Citação em idioma original: tipografia serifada legível, lang correto e rótulo visível. */
export function OriginalQuote({ text, lang, label, className }: OriginalQuoteProps) {
  return (
    <figure className={cn(styles.fig, className)}>
      <figcaption className={styles.cap}>{label}</figcaption>
      <blockquote className={styles.q} lang={lang}>
        {text}
      </blockquote>
    </figure>
  )
}

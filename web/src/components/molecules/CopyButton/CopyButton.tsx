import { useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import styles from './CopyButton.module.css'

/** Copia texto (ex.: SHA-256 completo). Confirma com “copiado” por 1,4 s, também para leitores de tela. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setDone(true)
      window.setTimeout(() => setDone(false), 1400)
    } catch {
      /* área de transferência indisponível: o hash segue selecionável na tela */
    }
  }
  return (
    <button type="button" className={styles.btn} onClick={onClick} aria-label={done ? 'Copiado' : label} title={label}>
      <Icon name={done ? 'check' : 'copy'} size={14} />
      <span aria-live="polite" className={styles.msg}>{done ? 'copiado' : ''}</span>
    </button>
  )
}

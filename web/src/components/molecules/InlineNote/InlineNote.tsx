import { useState, type ReactNode } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { useChrome } from '@/features/chrome/ChromeContext'
import { cn } from '@/lib/cn'
import styles from './InlineNote.module.css'

const KEY = 'sl-notes-dismissed'
const readDismissed = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export type InlineNoteProps = {
  /** identifica a nota para dispensa por sessão */
  id: string
  tone?: 'info' | 'warn' | 'danger'
  title?: string
  children: ReactNode
  /** base da gaveta que explica a nota (“saiba mais”) */
  baseId?: string
  dismissible?: boolean
  className?: string
}

/** Nota discreta e contextual (ícone + texto curto). Substitui os banners pesados; dispensável por sessão. */
export function InlineNote({ id, tone = 'info', title, children, baseId, dismissible = true, className }: InlineNoteProps) {
  const { openDrawer } = useChrome()
  const [gone, setGone] = useState(() => dismissible && readDismissed().includes(id))
  if (gone) return null
  const dismiss = () => {
    setGone(true)
    try {
      sessionStorage.setItem(KEY, JSON.stringify([...new Set([...readDismissed(), id])]))
    } catch {
      /* sem sessionStorage: dispensa vale só até recarregar */
    }
  }
  return (
    <aside className={cn(styles.note, styles[tone], className)} role={tone === 'danger' ? 'alert' : 'note'}>
      <Icon name={tone === 'info' ? 'info' : 'alert'} size={16} className={styles.icon} />
      <p className={styles.text}>
        {title && <strong className={styles.title}>{title} </strong>}
        {children}
        {baseId && (
          <>
            {' '}
            <button type="button" className={styles.more} onClick={() => openDrawer(baseId)}>
              saiba mais
            </button>
          </>
        )}
      </p>
      {dismissible && (
        <button type="button" className={styles.close} onClick={dismiss} aria-label="Dispensar esta nota nesta sessão">
          <Icon name="x" size={14} />
        </button>
      )}
    </aside>
  )
}

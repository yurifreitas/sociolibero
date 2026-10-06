import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import styles from './ErrorState.module.css'

export type ErrorStateProps = { title?: string; message: string; onRetry?: () => void }

export function ErrorState({ title = 'Não foi possível carregar', message, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.box} role="alert">
      <Icon name="alert" size={24} className={styles.icon} />
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

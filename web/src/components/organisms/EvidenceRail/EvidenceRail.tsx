import { useLocation } from 'react-router-dom'
import { Icon } from '@/components/atoms/Icon'
import { Kbd } from '@/components/atoms/Kbd'
import { Skeleton } from '@/components/atoms/Skeleton'
import { BaseChip } from '@/components/molecules/BaseChip'
import { useBases } from '@/features/bases/hooks'
import { pageKeyFromPath, STATUS_INFO } from '@/features/bases/model'
import { useChrome } from '@/features/chrome/ChromeContext'
import styles from './EvidenceRail.module.css'

const MAX_CHIPS = 8

/** Régua de evidência: faixa fina e fixa sob o header com o estado de cada base que sustenta a página. */
export function EvidenceRail() {
  const { pathname } = useLocation()
  const { openDrawer } = useChrome()
  const q = useBases()
  const page = pageKeyFromPath(pathname)
  const doc = q.data
  const ids = doc?.paginas[page] ?? []
  const bases = (doc?.bases ?? [])
    .filter((b) => ids.includes(b.id))
    .sort((a, b) => STATUS_INFO[a.status].order - STATUS_INFO[b.status].order)
  const shown = bases.slice(0, MAX_CHIPS)
  const extra = bases.length - shown.length
  const attention = bases.filter((b) => b.status !== 'oficial').length

  return (
    <div className={styles.rail} role="region" aria-label="Régua de evidência: estado das bases desta página">
      <span className={styles.caption} aria-hidden="true">
        <Icon name="shield" size={14} /> Evidência
      </span>
      <div className={styles.scroller}>
        <ul className={styles.chips}>
          {q.isPending && [92, 112, 84].map((w) => <li key={w}><Skeleton width={w} height={28} style={{ borderRadius: 999 }} /></li>)}
          {q.isError && <li className={styles.warn}>Não foi possível carregar o registro de bases.</li>}
          {q.isSuccess && !doc && <li className={styles.warn}>Registro de bases indisponível (rode <code>pnpm bases</code>).</li>}
          {shown.map((b) => (
            <li key={b.id}>
              <BaseChip base={b} onOpen={openDrawer} />
            </li>
          ))}
          {extra > 0 && (
            <li>
              <button type="button" className={styles.more} onClick={() => openDrawer()}>
                +{extra}
              </button>
            </li>
          )}
        </ul>
      </div>
      <button type="button" className={styles.open} onClick={() => openDrawer()} aria-haspopup="dialog">
        <Icon name="database" size={15} />
        <span className={styles.openLabel}>Bases &amp; avisos</span>
        {attention > 0 && <span className={styles.count} aria-label={`${attention} pedem atenção`}>{attention}</span>}
        <Kbd>B</Kbd>
      </button>
    </div>
  )
}

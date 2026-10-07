import type { ReactNode } from 'react'
import styles from './Kbd.module.css'

export const Kbd = ({ children }: { children: ReactNode }) => <kbd className={styles.kbd}>{children}</kbd>

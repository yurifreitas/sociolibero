import { Badge } from '@/components/atoms/Badge'
import { fInt, fNum2, fP, fPct, fZ } from '@/lib/format'
import { candLabel } from '@/features/data/selectors'
import type { ElectionMeta, ForensicRow, ForensicTest, Forensics } from '@/features/data/schemas'
import styles from './ForensicEvidence.module.css'

export const FIXED_WARNING = 'Anomalia estatística não é prova de fraude.'

export type ForensicEvidenceProps = {
  forensics: Forensics
  electionMeta: ElectionMeta
  ibge: string
  compact?: boolean
}

type Cell = { label: string; value: string; flagged: boolean }

function cellsFor(t: ForensicTest, row: ForensicRow, meta: ElectionMeta): Cell[] {
  const flagged = row.flags.includes(t.chave)
  const na = 'n/d (poucas seções)'
  switch (t.chave) {
    case 'zs':
      return Object.entries(row.zs ?? {}).map(([c, z]) => ({
        label: candLabel(meta, c),
        value: z == null ? 'n/d' : fZ(z),
        flagged: flagged && z != null && Math.abs(z) >= 3,
      }))
    case 'zt':
    case 'zn':
      return [{ label: '', value: row[t.chave] == null ? 'n/d' : fZ(row[t.chave] as number), flagged }]
    case 'ld_p':
    case 'b2_p':
      return [{ label: 'p-valor', value: row[t.chave] == null ? na : fP(row[t.chave] as number), flagged }]
    case 'rho': {
      const r = row.rho as number | null | undefined
      const z = row.rho_z as number | null | undefined
      return [{ label: 'ρ (z)', value: r == null ? na : `${fNum2(r)} (${fZ(z)})`, flagged }]
    }
    case 'bunching':
      return [{ label: 'seções nos extremos', value: row.bunching == null ? 'n/d' : fPct(row.bunching * 100), flagged }]
    default: {
      const v = row[t.chave]
      if (v === null && t.chave in row) return [{ label: '', value: na, flagged }]
      if (typeof v !== 'number') return []
      return [{ label: t.chave.endsWith('_p') ? 'p-valor' : '', value: t.chave.endsWith('_p') ? fP(v) : String(v), flagged }]
    }
  }
}

const CONF: Record<string, { tone: 'pos' | 'warn' | 'neutral'; label: string }> = {
  alta: { tone: 'pos', label: 'confiança alta' },
  media: { tone: 'warn', label: 'confiança média' },
  baixa: { tone: 'neutral', label: 'confiança baixa' },
}

export function ForensicEvidence({ forensics, electionMeta, ibge, compact }: ForensicEvidenceProps) {
  const row = forensics.linhas[ibge]
  if (!row)
    return (
      <section className={styles.section} aria-label="Evidências forenses">
        <h3 className={styles.h}>Evidências forenses</h3>
        <p className={styles.muted}>Sem teste forense para este município neste pleito (cobertura ou seções insuficientes).</p>
        <p className={styles.warning}>{FIXED_WARNING}</p>
      </section>
    )
  const conf = CONF[row.confianca] ?? { tone: 'neutral' as const, label: `confiança ${row.confianca}` }
  return (
    <section className={styles.section} aria-label="Evidências forenses">
      <div className={styles.top}>
        <h3 className={styles.h}>Evidências forenses</h3>
        <div className={styles.badges}>
          <Badge tone={conf.tone}>{conf.label}</Badge>
          <Badge>{fInt(row.n_secoes)} seções</Badge>
          {forensics.meta.mock && <Badge tone="warn">MOCK</Badge>}
        </div>
      </div>
      <div className={styles.score}>
        <span className={styles.scoreNum}>{Math.round(row.score)}</span>
        <span className={styles.scoreLabel}>
          prioridade de auditoria (0–100)
          <br />
          {row.flags.length > 0 ? `${row.flags.length} teste(s) sinalizado(s)` : 'nenhum teste sinalizado'}
        </span>
      </div>
      <p className={styles.warning}>{FIXED_WARNING}</p>
      <ul className={styles.tests}>
        {forensics.meta.testes.map((t) => {
          const cells = cellsFor(t, row, electionMeta)
          if (cells.length === 0) return null
          return (
            <li key={t.chave} className={styles.test}>
              <div className={styles.testHead}>
                <span className={styles.testName}>{t.rotulo}</span>
                {row.flags.includes(t.chave) && <Badge tone="warn">sinalizado</Badge>}
              </div>
              <ul className={styles.vals}>
                {cells.map((c, i) => (
                  <li key={i} className={c.flagged ? styles.flag : undefined}>
                    {c.label && <span className={styles.vlabel}>{c.label}</span>}
                    <span className={styles.value}>{c.value}</span>
                  </li>
                ))}
              </ul>
              <details open={!compact}>
                <summary>Como ler · limites</summary>
                {t.descricao && <p><strong>O que mede:</strong> {t.descricao}</p>}
                {t.interpretacao && <p><strong>Interpretação:</strong> {t.interpretacao}</p>}
                {t.limitacoes && <p><strong>Limitação:</strong> {t.limitacoes}</p>}
              </details>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

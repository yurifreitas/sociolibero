import { Link } from 'react-router-dom'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { ProvenanceLine } from '@/components/molecules/ProvenanceLine'
import { ForensicEvidence } from '@/components/organisms/ForensicEvidence'
import { SeriesTable } from '@/components/organisms/SeriesTable'
import { fInt, fPct } from '@/lib/format'
import { pctOf, ranking } from '@/features/data/selectors'
import { SETORES } from '@/features/map/metrics'
import { TerritoryBlock } from '@/components/organisms/TerritoryBlock'
import type { Election, Exposicao, Forensics, Territorios } from '@/features/data/schemas'
import styles from './MunicipalityPanel.module.css'

export type MunicipalityPanelProps = {
  ibge: string
  nome: string
  uf: string
  election: Election
  forensics?: Forensics | null
  allElections?: Election[]
  exposicao?: Exposicao | null
  territorios?: Territorios | null
  variant: 'compact' | 'full'
  onClose?: () => void
}

export function MunicipalityPanel({ ibge, nome, uf, election, forensics, allElections, exposicao, territorios, variant, onClose }: MunicipalityPanelProps) {
  const row = election.linhas[ibge]
  const full = variant === 'full'
  const exp = exposicao?.linhas[ibge]
  return (
    <section className={styles.panel} aria-label={`Município ${nome}`}>
      <header className={styles.head}>
        <div>
          {full ? <h1 className={styles.h1}>{nome}</h1> : <h2 className={styles.h2}>{nome}</h2>}
          <p className={styles.sub}>
            {uf} · IBGE {ibge}
          </p>
        </div>
        <div className={styles.actions}>
          {!full && (
            <Link to={`/municipio/${ibge}?e=${election.meta.id}`} className={styles.full}>
              Página completa <Icon name="external" size={14} />
            </Link>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" aria-label="Fechar painel" onClick={onClose}>
              <Icon name="x" size={16} />
            </Button>
          )}
        </div>
      </header>

      {!row ? (
        <p className={styles.muted}>Sem dados deste município em {election.meta.rotulo}.</p>
      ) : (
        <>
          <div>
            <h3 className={styles.h3}>{election.meta.rotulo}</h3>
            <dl className={styles.numbers}>
              <div><dt>Aptos</dt><dd>{fInt(row.aptos)}</dd></div>
              <div><dt>Comparecimento</dt><dd>{fInt(row.comparecimento)} <span>{fPct(pctOf(row.comparecimento, row.aptos))}</span></dd></div>
              <div><dt>Votos válidos</dt><dd>{fInt(row.validos)}</dd></div>
              <div><dt>Brancos</dt><dd>{fInt(row.brancos)} <span>{fPct(pctOf(row.brancos, row.comparecimento))}</span></dd></div>
              <div><dt>Nulos</dt><dd>{fInt(row.nulos)} <span>{fPct(pctOf(row.nulos, row.comparecimento))}</span></dd></div>
            </dl>
          </div>

          <div>
            <h3 className={styles.h3}>Votos válidos por candidato</h3>
            <ol className={styles.bars}>
              {ranking(row, election.meta).map((c, i) => (
                <li key={c.numero}>
                  <div className={styles.barTop}>
                    <span>{c.label}</span>
                    <span className="num">{fPct(c.pct)}</span>
                  </div>
                  <div className={styles.track} role="img" aria-label={`${c.label}: ${fPct(c.pct)} (${fInt(c.votos)} votos)`}>
                    <div className={i === 0 ? styles.fillLead : styles.fill} style={{ width: `${Math.min(100, c.pct)}%` }} />
                  </div>
                  <span className={styles.votes}>{fInt(c.votos)} votos</span>
                </li>
              ))}
            </ol>
          </div>

          {exp && (
            <div>
              <h3 className={styles.h3}>Estrutura econômica</h3>
              <div className={styles.stack} role="img" aria-label={SETORES.map((s) => `${s.label} ${fPct(exp[s.key] * 100)}`).join(', ')}>
                {SETORES.map((s, i) => (
                  <i key={s.key} className={styles[`s${i}`]} style={{ width: `${exp[s.key] * 100}%` }} title={`${s.label}: ${fPct(exp[s.key] * 100)}`} />
                ))}
              </div>
              <ul className={styles.legend}>
                {SETORES.map((s, i) => (
                  <li key={s.key}><i className={styles[`s${i}`]} /> {s.label} <span className="num">{fPct(exp[s.key] * 100)}</span></li>
                ))}
              </ul>
            </div>
          )}

          {territorios && <TerritoryBlock territorios={territorios} ibge={ibge} compact={!full} />}

          {forensics && <ForensicEvidence forensics={forensics} electionMeta={election.meta} ibge={ibge} compact={!full} />}

          {full && allElections && allElections.length > 1 && (
            <div>
              <h3 className={styles.h3}>Série entre pleitos</h3>
              <SeriesTable ibge={ibge} elections={allElections} />
            </div>
          )}
          <ProvenanceLine meta={election.meta} />
        </>
      )}
    </section>
  )
}

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { SegmentedControl } from '@/components/molecules/SegmentedControl'
import { fInt, fPct } from '@/lib/format'
import { SETORES } from '@/features/map/metrics'
import type { Exposicao, SetorKey } from '@/features/data/schemas'
import styles from './ExposureHighlights.module.css'

export type ExposureHighlightsProps = {
  exposicao: Exposicao
  names: Map<string, { nome: string; uf: string }>
  setor: SetorKey
  onSetor: (s: SetorKey) => void
  electionId: string
}

/** Municípios mais expostos ao setor que a decisão afeta (heurística editável: o contrato não traz o setor). */
export function ExposureHighlights({ exposicao, names, setor, onSetor, electionId }: ExposureHighlightsProps) {
  const top = useMemo(
    () =>
      Object.entries(exposicao.linhas)
        .map(([ibge, r]) => ({ ibge, share: r[setor] * 100, ...(names.get(ibge) ?? { nome: ibge, uf: '' }) }))
        .sort((a, b) => b.share - a.share)
        .slice(0, 10),
    [exposicao, names, setor],
  )
  const total = Object.keys(exposicao.linhas).length
  return (
    <section className={styles.root} aria-label="Municípios mais expostos">
      <header className={styles.head}>
        <h3 className={styles.h3}>Municípios mais expostos</h3>
        <SegmentedControl label="Setor afetado" value={setor} onChange={onSetor} options={SETORES.map((s) => ({ value: s.key, label: s.label }))} />
      </header>
      <ol className={styles.list}>
        {top.map((m) => (
          <li key={m.ibge}>
            <Link to={`/municipio/${m.ibge}?e=${electionId}`}>{m.nome}</Link> <span className={styles.uf}>{m.uf}</span>
            <span className={styles.bar} aria-hidden="true"><i style={{ width: `${Math.min(100, m.share)}%` }} /></span>
            <span className="num">{fPct(m.share)}</span>
          </li>
        ))}
      </ol>
      <p className={styles.muted}>
        Top 10 de {fInt(total)} municípios pela participação do setor na estrutura econômica (IBGE).{' '}
        <Link to={`/mapa?m=exposicao&s=${setor}&e=${electionId}`}>Ver no mapa</Link>
      </p>
    </section>
  )
}

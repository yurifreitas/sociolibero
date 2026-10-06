import { Field } from '@/components/molecules/Field'
import { Select } from '@/components/atoms/Select'
import { METRICS, SETORES, type MetricKey } from '@/features/map/metrics'
import type { ElectionEntry, SetorKey } from '@/features/data/schemas'
import styles from './MapControls.module.css'

export type MapControlsProps = {
  elections: ElectionEntry[]
  election: string
  onElection: (id: string) => void
  metric: MetricKey
  onMetric: (m: MetricKey) => void
  unavailable: Partial<Record<MetricKey, string>>
  candidates: { numero: number; nome: string; partido: string }[]
  candidate: string
  onCandidate: (n: string) => void
  compareId: string
  onCompare: (id: string) => void
  canCompare: boolean
  setor: SetorKey
  onSetor: (s: SetorKey) => void
  needsCandidate: boolean
  needsSector: boolean
}

export function MapControls(p: MapControlsProps) {
  return (
    <div className={styles.controls}>
      <Field label="Eleição">
        {(id) => (
          <Select id={id} value={p.election} onChange={(e) => p.onElection(e.target.value)}>
            {p.elections.map((e) => (
              <option key={e.id} value={e.id}>
                {e.rotulo}
                {e.status !== 'oficial' ? ' · preliminar' : ''}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Métrica">
        {(id) => (
          <Select id={id} value={p.metric} onChange={(e) => p.onMetric(e.target.value as MetricKey)}>
            {METRICS.map((m) => (
              <option key={m.key} value={m.key} disabled={!!p.unavailable[m.key]}>
                {m.label}
                {p.unavailable[m.key] ? ` — ${p.unavailable[m.key]}` : ''}
              </option>
            ))}
          </Select>
        )}
      </Field>
      {p.needsCandidate && (
        <Field label="Candidato">
          {(id) => (
            <Select id={id} value={p.candidate} onChange={(e) => p.onCandidate(e.target.value)}>
              {p.candidates.map((c) => (
                <option key={c.numero} value={String(c.numero)}>
                  {c.nome} · {c.partido} {c.numero}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
      {p.needsSector && (
        <Field label="Setor">
          {(id) => (
            <Select id={id} value={p.setor} onChange={(e) => p.onSetor(e.target.value as SetorKey)}>
              {SETORES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
      <Field label="Comparar com" hint={p.canCompare ? 'Mostra a diferença (eleição − comparação) em pontos percentuais.' : 'A comparação vale para métricas de votação.'}>
        {(id) => (
          <Select id={id} value={p.canCompare ? p.compareId : ''} disabled={!p.canCompare} onChange={(e) => p.onCompare(e.target.value)}>
            <option value="">Sem comparação</option>
            {p.elections
              .filter((e) => e.id !== p.election)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.rotulo}
                </option>
              ))}
          </Select>
        )}
      </Field>
    </div>
  )
}

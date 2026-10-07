import { BasisSeal } from '@/components/molecules/BasisSeal'
import type { ClimaRs, ClimaRsRow } from '@/features/climars/schemas'
import { cn } from '@/lib/cn'
import styles from './ClimaRsBlock.module.css'

export const NIVEL: Record<string, string> = { low: 'baixa', moderate: 'moderada', elevated: 'elevada', high: 'alta' }
const COMP: [string, string, string][] = [
  ['impacto', 'Impacto observado (MUNIC 2024)', 'declarado ao IBGE pela prefeitura'],
  ['deficit_prevencao', 'Déficit de prevenção', 'declarado ao IBGE pela prefeitura'],
  ['exposicao', 'Exposição', 'população e grupos vulneráveis'],
  ['perigo_sazonal', 'Perigo sazonal', 'estadual e uniforme: desloca todos, não reordena'],
  ['manutencao_ativos', 'Manutenção de ativos', 'nunca há base pública municipal'],
]
const pct = (x: number | null | undefined, d = 1) => (x == null ? '—' : `${(x * 100).toFixed(d).replace('.', ',')}%`)
const n1 = (x: number | null | undefined, d = 1) => (x == null ? '—' : x.toFixed(d).replace('.', ','))
const get = (o: Record<string, unknown> | null | undefined, key: string) => (o ?? {})[key] as number | boolean | string | null | undefined

export type ClimaRsBlockProps = { row: ClimaRsRow; meta?: ClimaRs['meta']; compact?: boolean }

/** Índice de prioridade preventiva do RS: componentes com selo `basis` POR componente. Sem índice = sem índice (nunca promovido). */
export function ClimaRsBlock({ row, meta, compact }: ClimaRsBlockProps) {
  const ix = row.indice
  const semIndice = ix.score_atual == null
  const comp = row.componentes ?? {}
  const med = row.medidos ?? {}
  const mod = row.modelados ?? {}
  const minimo = meta?.modelo?.cobertura_minima_peso
  const defLacunas = (comp.deficit_prevencao?.detalhe?.lacunas as string[] | undefined) ?? []
  return (
    <div className={styles.block}>
      <header className={styles.head}>
        <h3 className={styles.h3}>Risco climático no RS: prioridade preventiva</h3>
        <BasisSeal basis={ix.basis ?? (semIndice ? undefined : 'modeled')} />
      </header>
      {semIndice ? (
        <p className={styles.none}>
          <strong>Sem índice.</strong> Cobertura de peso {n1(ix.cobertura_peso, 2)}{minimo != null ? `, abaixo do mínimo de ${n1(minimo, 2)}` : ''} (completude {ix.completude ?? '—'}). O município não respondeu ao suplemento do IBGE o bastante: <strong>fica fora do ranking</strong>, nem promovido nem rebaixado.
        </p>
      ) : (
        <div className={styles.score}>
          <span className={styles.num}>{n1(ix.score_atual)}</span>
          <span className={styles.lvl}>prioridade <strong>{NIVEL[ix.nivel_atual ?? ''] ?? ix.nivel_atual ?? '—'}</strong></span>
          <span className={styles.meta}>
            {ix.posicao_ranking_atual != null ? `#${ix.posicao_ranking_atual} entre os que têm índice · ` : ''}cobertura {n1(ix.cobertura_peso, 2)} · {ix.completude}
          </span>
        </div>
      )}
      <p className={styles.warn}>É uma <strong>prioridade preventiva</strong>, não uma previsão de cheia: ordena onde a próxima tempestade encontra a pior combinação de impacto já observado, déficit de prevenção e exposição.</p>

      <details open={!compact} className={styles.det}>
        <summary>Componentes e selos</summary>
        <ul className={styles.comps}>
          {COMP.map(([key, label, hint]) => {
            const c = comp[key]
            const nullComp = c == null || c.valor == null
            return (
              <li key={key} className={cn(nullComp && styles.nullc)}>
                <span className={styles.cl}>{label}<small>{hint}</small></span>
                <strong className={styles.cv}>{nullComp ? '—' : n1(c?.valor, 2)}</strong>
                <BasisSeal basis={nullComp ? undefined : c?.basis} />
              </li>
            )
          })}
        </ul>
        {defLacunas.length > 0 && (
          <div>
            <p className={styles.lbl}>Lacunas de prevenção declaradas</p>
            <ul className={styles.gaps}>{defLacunas.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        )}
        <p className={styles.lbl}>Medidos</p>
        <ul className={styles.kv}>
          {med.memoria_hidrica && (
            <li><span>Memória hídrica (JRC 1984–2021)</span><b>{n1(get(med.memoria_hidrica, 'memoria_hidrica_km2') as number | null, 1)} km² · {pct(get(med.memoria_hidrica, 'memoria_hidrica_frac') as number | null)} da grade</b><BasisSeal basis={med.memoria_hidrica.basis} /></li>
          )}
          {med.superficie_construida_ghsl && (
            <li><span>Superfície construída (proxy de impermeabilização)</span><b>{pct(get(med.superficie_construida_ghsl, 'frac_construida') as number | null, 2)}{get(med.superficie_construida_ghsl, 'acima_do_limiar') ? ' · acima do limiar do RS' : ''}</b><BasisSeal basis={med.superficie_construida_ghsl.basis} /></li>
          )}
          {med.acesso && (
            <li><span>Acesso em 2024</span><b>{get(med.acesso, 'dano_viario') ? 'dano viário' : 'sem dano viário declarado'}{get(med.acesso, 'ficou_ilhado') ? ' · ficou ilhado' : ''}</b><BasisSeal basis={med.acesso.basis} /></li>
          )}
          {med.geotecnico && (
            <li><span>Ocorrência geotécnica</span><b>{n1(get(med.geotecnico, 'score') as number | null, 2)}</b><BasisSeal basis={med.geotecnico.basis} /></li>
          )}
        </ul>
        <p className={styles.lbl}>Modelados</p>
        <ul className={styles.kv}>
          {mod.curve_number && (
            <li><span>Curve Number (resposta ao escoamento)</span><b>CN {n1(get(mod.curve_number, 'cn2') as number | null)} (solo úmido {n1(get(mod.curve_number, 'cn3_solo_umido') as number | null)}) · {String(get(mod.curve_number, 'resposta') ?? '—')}</b><BasisSeal basis={mod.curve_number.basis} /></li>
          )}
          {mod.erosao_rusle && (
            <li><span>Erosão (RUSLE, P = 1)</span><b>{String(get(mod.erosao_rusle, 'classe') ?? '—')}</b><BasisSeal basis={mod.erosao_rusle.basis} /></li>
          )}
        </ul>
        <p className={styles.fine}>CN e erosão não foram calibrados contra vazão: sustentam a ordem entre municípios, não valores absolutos. Lâmina escoada não é vazão nem área inundada.</p>
      </details>
    </div>
  )
}

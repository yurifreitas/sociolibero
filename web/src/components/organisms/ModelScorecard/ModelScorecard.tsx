import { Badge } from '@/components/atoms/Badge'
import type { Curva } from '@/features/futuro/schemas'
import { fNum1 } from '@/lib/format'
import styles from './ModelScorecard.module.css'

type Verdict = 'ganha' | 'empate' | 'perde' | 'sem-teste'
const pct = (v?: number | null) => (v == null ? '—' : `${fNum1(v)}%`)

/** Veredito do pipeline (`ganha_do_melhor_baseline`) com a razão numérica à vista: empate técnico não vira vitória. */
export function verdict(c: Curva): { v: Verdict; ratio: number | null } {
  const m = c.ajuste?.erro_teste?.mape_pct
  const bl = c.ajuste?.baseline_erro_teste
  const best = Math.min(...[bl?.ingenuo?.mape_pct, bl?.linear?.mape_pct].filter((x): x is number => typeof x === 'number'))
  if (m == null || !Number.isFinite(best) || best <= 0) return { v: 'sem-teste', ratio: null }
  const ratio = m / best
  if (bl?.ganha_do_melhor_baseline === true) return { v: 'ganha', ratio }
  return { v: ratio > 1.1 ? 'perde' : 'empate', ratio }
}
const TONE = { ganha: 'pos', empate: 'warn', perde: 'neg', 'sem-teste': 'neutral' } as const
const LABEL = { ganha: 'supera o baseline', empate: 'não supera (empate)', perde: 'perde', 'sem-teste': 'sem teste' } as const

/** Onde o modelo ganha e onde perde para o ingênuo/linear, e quão identificado é o teto de cada curva. */
export function ModelScorecard({ curvas }: { curvas: Curva[] }) {
  const rows = curvas.map((c) => ({ c, ...verdict(c) }))
  return (
    <div className={`card ${styles.wrap}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Curva</th>
            <th scope="col">Forma</th>
            <th scope="col" className={styles.n}>Erro do modelo</th>
            <th scope="col" className={styles.n}>Ingênuo</th>
            <th scope="col" className={styles.n}>Linear</th>
            <th scope="col">Veredito</th>
            <th scope="col">Teto de adoção</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ c, v, ratio }) => {
            const t = c.identificacao_teto
            return (
              <tr key={c.id} className={v === 'perde' || v === 'empate' ? styles.hi : undefined}>
                <td>
                  <b>{c.rotulo}</b>
                  <div className={styles.sub}>{c.unidade}{c.usada_na_difusao ? ' · entra na difusão do macro' : ''}</div>
                </td>
                <td>{c.modelo}</td>
                <td className={styles.n}>{pct(c.ajuste?.erro_teste?.mape_pct)}</td>
                <td className={styles.n}>{pct(c.ajuste?.baseline_erro_teste?.ingenuo?.mape_pct)}</td>
                <td className={styles.n}>{pct(c.ajuste?.baseline_erro_teste?.linear?.mape_pct)}</td>
                <td>
                  <Badge tone={TONE[v]}>{LABEL[v]}</Badge>
                  {ratio != null && <div className={styles.sub}>{fNum1(ratio)}× o melhor baseline</div>}
                </td>
                <td>
                  {t ? (
                    <>
                      {t.frac_do_teto_ja_atingida != null && <div>{fNum1(t.frac_do_teto_ja_atingida * 100)}% do teto já atingido</div>}
                      {t.razao_teto_p90_sobre_p10 != null && <div className={styles.sub}>teto p90/p10 = {fNum1(t.razao_teto_p90_sobre_p10)}×</div>}
                      {t.replicas_com_teto_igual_ao_maximo_observado_pct != null && t.replicas_com_teto_igual_ao_maximo_observado_pct > 0 && (
                        <div className={styles.warn}>{fNum1(t.replicas_com_teto_igual_ao_maximo_observado_pct)}% das réplicas: teto = máximo observado</div>
                      )}
                      {t.ajuste_na_fronteira && <div className={styles.warn}>ajuste na fronteira de busca</div>}
                    </>
                  ) : (
                    <span className={styles.sub}>não se aplica</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

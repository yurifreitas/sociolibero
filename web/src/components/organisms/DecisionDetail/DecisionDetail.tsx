import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { Notice } from '@/components/molecules/Notice'
import { QuorumBar } from '@/components/molecules/QuorumBar'
import { StatTile } from '@/components/molecules/StatTile'
import { fNum1, fPct, fSigned1 } from '@/lib/format'
import { IMPACTS, INSTRUMENTO_LABEL, quadrant, QUADRANT_LABEL, type ImpactKey, type Presidencia } from '@/features/decisoes/model'
import type { Decisao, Decisoes } from '@/features/data/schemas'
import styles from './DecisionDetail.module.css'

export type DecisionDetailProps = {
  decisao: Decisao
  meta: Decisoes['meta']
  presidencia: Presidencia
  impact: ImpactKey
  onClose: () => void
}

const REV: Record<string, 'pos' | 'warn' | 'neg'> = { alta: 'pos', média: 'warn', media: 'warn', baixa: 'neg' }

export function DecisionDetail({ decisao: d, meta, presidencia, impact, onClose }: DecisionDetailProps) {
  const q = meta.quoruns[d.instrumento]
  const ref = meta.referencia_2035
  const pDir = d.p_aprovacao.direita
  const pEsq = d.p_aprovacao.esquerda
  return (
    <article className={styles.root} aria-label={d.rotulo}>
      <header className={styles.head}>
        <div className={styles.titles}>
          <h2 className={styles.h2}>{d.rotulo}</h2>
          <div className={styles.badges}>
            <Badge tone="brand">{d.dominio}</Badge>
            <Badge>{INSTRUMENTO_LABEL[d.instrumento] ?? d.instrumento}</Badge>
            <Badge tone={REV[d.reversibilidade] ?? 'neutral'}>reversibilidade {d.reversibilidade}</Badge>
            <Badge>defasagem {d.defasagem_anos} {d.defasagem_anos === 1 ? 'ano' : 'anos'}</Badge>
            <Badge tone="warn">{QUADRANT_LABEL[quadrant(d, impact, presidencia)]}</Badge>
          </div>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar detalhe">
          <Icon name="x" size={16} />
        </button>
      </header>

      <p className={styles.racional}>{d.racional}</p>

      <section aria-label="Viabilidade política" className={styles.block}>
        <h3 className={styles.h3}>Viabilidade: instrumento e quórum × composição eleita em 2026</h3>
        <div className={styles.probs}>
          <div>
            <span className={styles.plabel}>Presidência de direita</span>
            <strong className={styles.p}>{fPct(pDir * 100)}</strong>
          </div>
          <div>
            <span className={styles.plabel}>Presidência de esquerda</span>
            <strong className={styles.p}>{fPct(pEsq * 100)}</strong>
          </div>
        </div>
        <p className={styles.muted}>
          Probabilidade de aprovação condicional a quem ocupa o Planalto, pelo modelo simplificado de bancadas (quórum real × composição eleita).
        </p>
        <QuorumBar title="Câmara (513)" seats={meta.composicao.camara} quorum={q?.camara ?? null} />
        <QuorumBar title="Senado (81)" seats={meta.composicao.senado} quorum={q?.senado ?? null} />
        <p className={styles.muted}>
          Ideologia da proposta {fSigned1(d.ideologia)} (−1 esquerda … +1 direita) · controvérsia {fNum1(d.controversia * 100)}%
          {d.iniciativa_congresso ? ' · iniciativa do Congresso' : ''}
        </p>
      </section>

      <section aria-label="Impacto em 2035" className={styles.block}>
        <h3 className={styles.h3}>Impacto em 2035 se aprovada (vs. cenário pragmático)</h3>
        <div className={styles.tiles}>
          {IMPACTS.map((i) => {
            const v = d.impacto_2035[i.key]
            const good = i.higherIsBetter ? v > 0 : v < 0
            return (
              <StatTile
                key={i.key}
                label={i.label}
                value={`${fSigned1(v)} pp`}
                tone={Math.abs(v) < 0.05 ? 'neutral' : good ? 'pos' : 'neg'}
                hint={`referência ${fNum1(ref[i.key])}${i.key === 'debt' ? '% do PIB' : '% a.a.'} → ${fNum1(ref[i.key] + v)}`}
              />
            )
          })}
        </div>
        {d.deltas && Object.keys(d.deltas).length > 0 && (
          <p className={styles.muted}>
            Alavancas alteradas:{' '}
            {Object.entries(d.deltas).map(([k, v], i) => (
              <code key={k} className={styles.lever}>
                {i > 0 ? ' ' : ''}
                {k} {fSigned1(v)}
              </code>
            ))}
          </p>
        )}
      </section>

      <section aria-label="Ganhadores e perdedores" className={styles.cols}>
        <div>
          <h3 className={styles.h3}>Ganhadores</h3>
          <ul className={styles.list}>{d.ganhadores.map((g) => <li key={g}>{g}</li>)}</ul>
        </div>
        <div>
          <h3 className={styles.h3}>Perdedores</h3>
          <ul className={styles.list}>{d.perdedores.map((g) => <li key={g}>{g}</li>)}</ul>
        </div>
      </section>

      <Notice tone="warn" title={`Base de evidência: ${d.base_evidencia}`}>
        {meta.aviso} Os efeitos são julgamentos editáveis (<code>base_evidencia = {d.base_evidencia}</code>), não estimativas
        econométricas. Use para comparar ordens de grandeza e discutir premissas, não para prever.
      </Notice>
    </article>
  )
}

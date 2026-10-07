import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { BasisSeal } from '@/components/molecules/BasisSeal'
import { InlineNote } from '@/components/molecules/InlineNote'
import { PageGate } from '@/components/molecules/PageGate'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { SegmentedControl } from '@/components/molecules/SegmentedControl'
import { StatTile } from '@/components/molecules/StatTile'
import { Tabs } from '@/components/molecules/Tabs'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useQuebras } from '@/features/quebras/hooks'
import type { Quebras, SerieQuebra } from '@/features/quebras/schemas'
import { cn } from '@/lib/cn'
import { useUrlState } from '@/lib/useUrlState'
import k from './know.module.css'
import styles from './QuebrasPage.module.css'

type Aba = 'series' | 'historia' | 'validacao'
const pc = (x: number | null | undefined, d = 0) => (x == null ? '—' : `${(x * 100).toFixed(d).replace('.', ',')}%`)
const n2 = (x: number | null | undefined, d = 2) => (x == null ? '—' : x.toFixed(d).replace('.', ','))
const TIPO: Record<string, string> = { media: 'média', variancia: 'variância', tendencia: 'tendência' }
const lac = (x: string | { serie?: string | null; motivo?: string | null }) => (typeof x === 'string' ? x : [x.serie, x.motivo].filter(Boolean).join(': '))

function Strip({ s }: { s: SerieQuebra }) {
  const [a = 0, b = 1] = s.periodo ?? []
  const W = 640
  const x = (y: number) => 10 + ((y - a) / Math.max(1, b - a)) * (W - 20)
  return (
    <svg viewBox={`0 0 ${W} 46`} className={styles.strip} role="img" aria-label={`${s.rotulo}, ${a} a ${b}: ${s.quebras.length === 0 ? 'nenhuma quebra detectada' : s.quebras.map((q) => `${q.ano}${q.artefato_metodologico ? ' (artefato metodológico)' : ''}`).join(', ')}`}>
      <line x1="10" x2={W - 10} y1="30" y2="30" className={styles.axis} />
      <text x="10" y="44" className={styles.t}>{a}</text>
      <text x={W - 10} y="44" textAnchor="end" className={styles.t}>{b}</text>
      {s.quebras.map((q) => (
        <g key={`${q.ano}-${q.tipo}`}>
          {q.intervalo && <rect x={x(q.intervalo[0] as number)} y="25" width={Math.max(3, x(q.intervalo[1] as number) - x(q.intervalo[0] as number))} height="10" rx="3" className={cn(styles.iv, q.artefato_metodologico && styles.ivArt)} />}
          <circle cx={x(q.ano)} cy="30" r="6" className={cn(styles.dot, q.artefato_metodologico && styles.art)}>
            <title>{`${q.ano} · ${TIPO[q.tipo ?? ''] ?? q.tipo}${q.intervalo ? ` · intervalo ${q.intervalo[0]}–${q.intervalo[1]}` : ''}`}</title>
          </circle>
          <text x={x(q.ano)} y="14" textAnchor="middle" className={styles.yr}>{q.ano}</text>
        </g>
      ))}
    </svg>
  )
}

function SerieRow({ s }: { s: SerieQuebra }) {
  const [open, setOpen] = useState(false)
  return (
    <li className={`card ${styles.row}`}>
      <button type="button" className={styles.rowBtn} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className={styles.rl}>{s.rotulo}</span>
        <span className={styles.rm}>n = {s.n} · {s.periodo?.[0]}–{s.periodo?.[1]} · modo {s.modo ?? '—'}</span>
        <Badge tone={s.quebras.length ? 'warn' : 'neutral'}>{s.quebras.length ? `${s.quebras.length} quebra(s)` : 'nenhuma detectada'}</Badge>
      </button>
      <Strip s={s} />
      {open && (
        <div className={styles.more}>
          {s.quebras.length === 0 && <p className={k.text}>Nenhuma quebra sobreviveu à correção de multiplicidade. <strong>Isso não prova que não houve quebra:</strong> o poder do teste para a maioria das quebras plausíveis é baixo com este n (ver Validação).</p>}
          {s.quebras.map((q) => (
            <div key={`${q.ano}-${q.tipo}`} className={styles.q}>
              <p className={k.text}>
                <strong>{q.ano}</strong> ({TIPO[q.tipo ?? ''] ?? q.tipo}{q.intervalo ? `, intervalo ${q.intervalo[0]}–${q.intervalo[1]}` : ''}) · p ajustado {n2(q.evidencia?.p_ajustado, 3)} · q (BH) {n2(q.evidencia?.q_bh, 3)}
                {q.artefato_metodologico && <> <Badge tone="warn">artefato metodológico</Badge></>}
              </p>
              {q.artefato_metodologico && <p className={styles.note}>Coincide com uma mudança de metodologia ou de índice da própria série: <strong>não é contada como quebra econômica</strong>.</p>}
              {(q.eventos_historicos_proximos?.length ?? 0) > 0 && (
                <ul className={k.links}>
                  {q.eventos_historicos_proximos?.map((e) => <li key={e}><Link to={`/historia?sel=ev:${e}`}>evento próximo: {e}</Link></li>)}
                </ul>
              )}
            </div>
          ))}
          {(s.nos_testados?.length ?? 0) > 0 && (
            <details className={styles.det}>
              <summary>Candidatas testadas ({s.nos_testados?.length})</summary>
              <div className={k.tableWrap}>
                <table className={k.table}>
                  <caption className="sr-only">Candidatas a quebra testadas nesta série, com p bruto e p ajustado por Holm.</caption>
                  <thead><tr><th>Ano</th><th>Tipo</th><th className="n">p bruto</th><th className="n">p Holm</th></tr></thead>
                  <tbody>{s.nos_testados?.map((t) => <tr key={`${t.ano}-${t.tipo}`}><td>{t.ano}</td><td>{TIPO[t.tipo] ?? t.tipo}</td><td className="n">{n2(t.p_bruto, 4)}</td><td className="n">{n2(t.p_holm, 3)}</td></tr>)}</tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}
    </li>
  )
}

function Validation({ q }: { q: Quebras }) {
  const v = q.validacao
  const esc = v.procedimento_final?.escolhido
  const corte = esc?.corte ?? 31
  const ns = [...new Set((v.poder ?? []).map((p) => p.n))].sort((a, b) => a - b)
  const [tipo, setTipo] = useState<'media' | 'variancia' | 'tendencia'>('media')
  const rows = (v.poder ?? []).filter((p) => p.tipo === tipo)
  const mags = [...new Set(rows.map((r) => r.magnitude))].sort((a, b) => a - b)
  const tpr = (n: number, m: number) => {
    const r = rows.find((x) => x.n === n && x.magnitude === m)
    if (!r) return null
    return r.tpr[n < corte ? 'final_ols' : 'final_alt'] ?? null
  }
  const fpr = (n: number) => {
    const c = v.procedimento_final?.candidatos[String(n)]
    return (n < corte ? c?.final_ols : c?.final_alt)?.fpr_medio ?? null
  }
  const orac = (v.oraculo_tau_conhecido ?? []).filter((o) => o.tipo === 'media')
  return (
    <div className={k.stack}>
      <InlineNote id="qb-val" tone="info" dismissible={false} title="Como ler a validação.">
        Cada detector foi testado com quebras <strong>sintéticas de verdade conhecida</strong>: quantas vezes dispara sem quebra (falso positivo, esperado ≈ 5%) e quantas vezes acha uma quebra que existe (poder). Detector sem poder não pode ser lido como “não houve quebra”.
      </InlineNote>
      <section aria-labelledby="qb-poder" className={styles.sec}>
        <h3 id="qb-poder" className={styles.h3}>Poder do procedimento final, por tamanho da série</h3>
        <SegmentedControl label="Tipo de quebra" value={tipo} onChange={setTipo} options={[{ value: 'media', label: 'Média (salto)' }, { value: 'variancia', label: 'Variância' }, { value: 'tendencia', label: 'Tendência' }]} />
        <div className={k.tableWrap}>
          <table className={cn(k.table, styles.heat)}>
            <caption className="sr-only">Probabilidade de detectar uma quebra sintética (poder), por magnitude e número de observações, e taxa de falso positivo sem quebra.</caption>
            <thead><tr><th>Magnitude</th>{ns.map((n) => <th key={n} className="n">n = {n}</th>)}</tr></thead>
            <tbody>
              {mags.map((m) => (
                <tr key={m}>
                  <th scope="row">{String(m).replace('.', ',')}</th>
                  {ns.map((n) => {
                    const t = tpr(n, m)
                    return <td key={n} className="n" style={{ background: t == null ? undefined : `color-mix(in oklch, var(--st-oficial) ${Math.round(t * 70)}%, var(--surface))` }}>{t == null ? '—' : pc(t)}</td>
                  })}
                </tr>
              ))}
              <tr className={styles.fprRow}>
                <th scope="row">falso positivo (sem quebra)</th>
                {ns.map((n) => <td key={n} className="n">{pc(fpr(n), 1)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <p className={k.muted}>Procedimento: {esc?.curto ?? '—'} para n &lt; {corte}, {esc?.longo ?? '—'} a partir daí. Unidades: média em desvios-padrão marginais. Com n pequeno, o poder é baixo até para saltos grandes.</p>
      </section>
      {orac.length > 0 && (
        <section aria-labelledby="qb-orac" className={styles.sec}>
          <h3 id="qb-orac" className={styles.h3}>Quanto vale saber o ano da quebra</h3>
          <p className={k.text}>O “oráculo” sabe a data; o detector real não. A diferença mede quanto do poder se perde por não saber <em>quando</em> a quebra aconteceu.</p>
          <div className={k.tableWrap}>
            <table className={k.table}>
              <caption className="sr-only">Poder com ano da quebra conhecido e desconhecido, para salto de média.</caption>
              <thead><tr><th>Salto (dp)</th><th className="n">n</th><th className="n">Com o ano conhecido</th><th className="n">Sem saber o ano</th></tr></thead>
              <tbody>{orac.map((o, i) => <tr key={i}><td>{String(o.magnitude).replace('.', ',')}</td><td className="n">{o.n}</td><td className="n">{pc(o.tpr_oraculo)}</td><td className="n">{pc(o.tpr_sup_tau_desconhecido)}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      )}
      <section aria-labelledby="qb-cem" className={styles.sec}>
        <h3 id="qb-cem" className={styles.h3}>O que foi descartado antes de escolher o procedimento</h3>
        <ul className={styles.disc}>
          {Object.entries(v.escolhas_previas ?? {}).map(([fam, e]) => (
            <li key={fam} className="card">
              <p className={k.lbl}>{fam}</p>
              <p className={k.text}>Escolhido: <strong>{e.escolhido ?? '—'}</strong>.{' '}
                {e.fpr_maximo_sob_nulos && <>Falso positivo máximo sob nulos difíceis: {Object.entries(e.fpr_maximo_sob_nulos).map(([d, f]) => `${d} ${pc(f)}`).join(' · ')}.</>}
              </p>
            </li>
          ))}
        </ul>
        <p className={styles.note}>A escolha foi feita pela validação sintética, não por ajuste às séries reais, e o detector de variância ingênuo foi descartado por disparar demais sob heterocedasticidade.</p>
      </section>
      {v.cobertura_intervalo_tau_90 && (
        <p className={k.muted}>Intervalo do ano da quebra: cobertura de {pc(v.cobertura_intervalo_tau_90.por_temperagem[String(v.cobertura_intervalo_tau_90.temperagem_escolhida)])} para o nominal de 90% (temperagem {String(v.cobertura_intervalo_tau_90.temperagem_escolhida).replace('.', ',')}).</p>
      )}
    </div>
  )
}

function Content({ q }: { q: Quebras }) {
  const { get, update } = useUrlState()
  const aba: Aba = (['series', 'historia', 'validacao'] as const).find((a) => a === get('aba')) ?? 'series'
  const c = q.cruzamento_historia
  const cm = q.meta.metodo?.controle_metodologico
  const com = q.series.filter((s) => s.quebras.length > 0)
  const nQ = q.series.reduce((a, s) => a + s.quebras.length, 0)
  return (
    <>
      <InlineNote id="qb-aviso" tone="warn" dismissible={false} baseId="quebras" title="Quebra estatística não é causa nem evento.">
        {q.meta.aviso}
      </InlineNote>
      <div className={k.stats}>
        <StatTile label="Séries analisadas" value={q.series.length} hint={`${com.length} com alguma quebra · ${nQ} quebras no total`} />
        <StatTile label="Artefatos recuperados" value={cm ? `${cm.recuperados_apos_holm ?? '—'}/${cm.artefatos_testaveis ?? '—'}` : '—'} tone="neg" hint="mudanças de metodologia conhecidas que o detector achou: baixo poder" />
        <StatTile label="Coincidência com a história" value={c ? `${c.coincidencias}/${c.n_quebras}` : '—'} hint={c ? `esperado por acaso: ${n2(c.esperado_por_acaso, 1)} (p = ${n2(c.p_permutacao)})` : undefined} />
      </div>
      <Tabs<Aba>
        label="Seções de quebras estruturais"
        value={aba}
        onChange={(a) => update({ aba: a === 'series' ? null : a })}
        tabs={[
          { key: 'series', label: 'Séries e quebras', count: q.series.length },
          { key: 'historia', label: 'Cruzamento com a história' },
          { key: 'validacao', label: 'Validação' },
        ]}
      >
        {aba === 'series' && (
          <div className={k.stack}>
            <ul className={styles.legend} aria-label="Legenda">
              <li><i className={styles.dotL} /> quebra detectada</li>
              <li><i className={cn(styles.dotL, styles.artL)} /> artefato metodológico (não conta)</li>
              <li><i className={styles.ivL} /> intervalo provável do ano</li>
            </ul>
            <ul className={styles.list}>{q.series.map((s) => <SerieRow key={s.id} s={s} />)}</ul>
            {(q.meta.lacunas?.length ?? 0) > 0 && (
              <details className={styles.det}>
                <summary>Séries fora da análise por serem curtas ({q.meta.lacunas?.length})</summary>
                <ul className={k.list}>{q.meta.lacunas?.map((x, i) => <li key={i}>{lac(x)}</li>)}</ul>
              </details>
            )}
          </div>
        )}
        {aba === 'historia' && c && (
          <div className={k.stack}>
            <section className={`card ${styles.hero}`}>
              <p className={k.lbl}>Quebras a até {c.tolerancia_anos ?? 2} anos de uma data histórica</p>
              <p className={styles.big}>{c.coincidencias} de {c.n_quebras}</p>
              <p className={k.text}>
                Parece muito, mas o esperado <strong>por acaso</strong> é {n2(c.esperado_por_acaso, 1)} (desvio {n2(c.desvio_padrao_nulo, 1)}). O teste de permutação dá <strong>p = {n2(c.p_permutacao)}</strong>: a coincidência não é maior do que a de datas sorteadas.
              </p>
              <p className={k.text}>
                O motivo é simples: com {c.n_datas_historicas_distintas} datas históricas distintas, <strong>{pc(c.fracao_anos_a_menos_de_tol_de_uma_data)} de todos os anos</strong> estão a até {c.tolerancia_anos ?? 2} anos de alguma delas. Quase qualquer quebra “coincide” com algum evento.
              </p>
              <BasisSeal basis="modeled" verified />
            </section>
            <p className={styles.note}>Coincidência não é causa. Muitas quebras são artefato de mudança de metodologia da série e foram marcadas. Para os eventos próximos de cada quebra, abra a série na aba “Séries e quebras”.</p>
          </div>
        )}
        {aba === 'validacao' && <Validation q={q} />}
      </Tabs>
    </>
  )
}

export default function QuebrasPage() {
  const q = useQuebras()
  return (
    <PageTemplate>
      <SectionHeader
        level={1}
        title="Quebras estruturais nas séries brasileiras"
        description="Onde os dados mudam de regime, quanto o detector consegue enxergar e se isso coincide com a história além do acaso. Detectores validados com quebras sintéticas de verdade conhecida."
      />
      <PageGate query={q} file="quebras.json">{(d) => <Content q={d} />}</PageGate>
    </PageTemplate>
  )
}

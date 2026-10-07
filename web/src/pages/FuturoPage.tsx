import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { Skeleton } from '@/components/atoms/Skeleton'
import { StatusGlyph } from '@/components/atoms/StatusGlyph'
import { ErrorState } from '@/components/molecules/ErrorState'
import { InlineNote } from '@/components/molecules/InlineNote'
import { RefItem } from '@/components/molecules/RefItem'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { Tabs } from '@/components/molecules/Tabs'
import { FutureCurve } from '@/components/organisms/FutureCurve'
import { LawCard } from '@/components/organisms/LawCard'
import { MacroIntegration } from '@/components/organisms/MacroIntegration'
import { ModelScorecard, verdict } from '@/components/organisms/ModelScorecard'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useChrome } from '@/features/chrome/ChromeContext'
import { useFuturos, useLeis } from '@/features/futuro/hooks'
import { fCompact, fNum1 } from '@/lib/format'
import { useUrlState } from '@/lib/useUrlState'
import { useVtNavigate } from '@/lib/viewTransition'
import styles from './FuturoPage.module.css'

type Aba = 'leis' | 'curvas' | 'honestidade' | 'macro' | 'tendencias'
const asList = (v: string | string[] | null | undefined) => (Array.isArray(v) ? v : v ? [v] : [])

function Prep({ missing }: { missing: string[] }) {
  const { openDrawer } = useChrome()
  const go = useVtNavigate()
  return (
    <div className={`card ${styles.prep}`}>
      <div className={styles.schema} aria-hidden="true">
        <svg viewBox="0 0 320 150">
          <rect x="190" y="14" width="116" height="106" className={styles.sf} />
          <polyline points="14,112 60,100 110,86 150,70 190,58" className={styles.so} fill="none" />
          <polygon points="190,58 250,38 306,18 306,92 250,76 190,64" className={styles.sb} />
          <polyline points="190,58 250,56 306,50" className={styles.sl} fill="none" />
          <polyline points="190,58 250,44 306,30" className={styles.sl2} fill="none" />
          <text x="14" y="140" className={styles.st}>formato esperado · sem dados</text>
        </svg>
      </div>
      <div className={styles.prepText}>
        <p className="eyebrow">Em preparação</p>
        <h2>Leis tecnológicas e projeções 2026–2040</h2>
        <p>
          Esta página vai mostrar leis empíricas de tecnologia e difusão (Moore, Wright, curva logística), com a fórmula, os parâmetros medidos e o selo de verificação, o domínio em que valem, as críticas, e curvas projetadas com faixa de incerteza p10–p90 nos cenários lento, base e rápido.
        </p>
        <ul className={styles.missing}>
          {missing.map((m) => (
            <li key={m}>
              <StatusGlyph status="em-preparacao" size={13} /> <code>{m}</code> ainda não existe em <code>web/public/data/</code>
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={() => go('/propostas')}>Ver propostas <Icon name="arrowRight" size={14} /></button>
          <button type="button" className={styles.ghost} onClick={() => openDrawer('series-historicas')}>Estado das bases</button>
        </div>
      </div>
    </div>
  )
}

export default function FuturoPage() {
  const { get, update } = useUrlState()
  const leisQ = useLeis()
  const futQ = useFuturos(import.meta.env.DEV && get('futuros') ? (get('futuros') as string) : 'futuros.json')
  const aba: Aba = (['curvas', 'honestidade', 'macro', 'tendencias'] as const).find((a) => a === get('aba')) ?? 'leis'

  if (leisQ.isError) return <ErrorState message={(leisQ.error as Error).message} onRetry={() => leisQ.refetch()} />
  if (futQ.isError) return <ErrorState message={(futQ.error as Error).message} onRetry={() => futQ.refetch()} />

  const leis = leisQ.data?.leis ?? []
  const tend = leisQ.data?.tendencias ?? []
  const curvas = futQ.data?.curvas ?? []
  const loading = leisQ.isPending || futQ.isPending
  const carros = curvas.find((c) => c.id === 'carros_eletricos_brasil')?.identificacao_teto
  const gd = curvas.find((c) => c.id === 'solar_gd_brasil')?.identificacao_teto
  const missing = [...(!leisQ.data ? ['leis_tecnologicas.json'] : []), ...(!futQ.data ? ['futuros.json'] : [])]

  return (
    <PageTemplate>
      <SectionHeader level={1} title="Futuro: leis e projeções" description="Regularidades empíricas que moldam a tecnologia e a difusão — e curvas projetadas até 2040 com a incerteza à vista. Projeção não é previsão." />
      <InlineNote id="futuro-aviso" tone="warn" baseId="modelo-macro" dismissible={false} title="Extrapolação, não previsão.">
        Leis empíricas descrevem o passado dentro de um domínio de validade; fora dele, falham. Cada lei traz parâmetros com selo de verificação, críticas e o domínio em que vale.
      </InlineNote>

      {loading ? (
        <div className={styles.skel} aria-busy="true"><Skeleton height={44} width={360} /><Skeleton height={260} style={{ borderRadius: 16 }} /></div>
      ) : missing.length === 2 ? (
        <Prep missing={missing} />
      ) : (
        <>
          {missing.length === 1 && (
            <InlineNote id={`futuro-falta-${missing[0]}`} tone="info">
              Parte do conteúdo ainda não foi publicada: <code>{missing[0]}</code>. O restante já está disponível abaixo.
            </InlineNote>
          )}
          <Tabs<Aba>
            label="Seções de futuro"
            value={aba}
            onChange={(a) => update({ aba: a === 'leis' ? null : a })}
            tabs={[{ key: 'leis', label: 'Leis', count: leis.length }, { key: 'curvas', label: 'Curvas e cenários', count: curvas.length }, { key: 'honestidade', label: 'Onde o modelo perde' }, { key: 'macro', label: 'Integração macro' }, { key: 'tendencias', label: 'Tendências', count: tend.length }]}
          >
            {aba === 'leis' &&
              (leis.length > 0 ? <div className={styles.laws}>{leis.map((l) => <LawCard key={l.id} lei={l} />)}</div> : <p className={styles.none}>Sem leis publicadas.</p>)}
            {aba === 'curvas' &&
              (curvas.length > 0 ? (
                <div className={styles.curves}>
                  {curvas.map((c) => <FutureCurve key={c.id} c={c} />)}
                </div>
              ) : (
                <p className={styles.none}>Sem curvas publicadas.</p>
              ))}
            {aba === 'honestidade' &&
              (curvas.length > 0 ? (
                <div className={styles.honest}>
                  <InlineNote id="futuro-honestidade" tone="warn" dismissible={false} title={`${curvas.filter((c) => { const v = verdict(c).v; return v === 'perde' || v === 'empate' }).length} de ${curvas.length} curvas não superam o melhor baseline.`}>
                    O baseline ingênuo (“fica no último valor”) e o linear são difíceis de bater quando a série já está perto do teto. Nas séries ainda em aceleração (solar, carros elétricos, computação) o erro é de dezenas de por cento.
                  </InlineNote>
                  <ModelScorecard curvas={curvas} />
                  <section className={`card ${styles.tetoBox}`}>
                    <h3>Banda estreita não é confiança</h3>
                    <p>
                      O teto de adoção (K) é pouco identificado por poucos pontos.
                      {carros?.teto_p10_p90 && (
                        <> Nos carros elétricos o teto ajustado tem p10–p90 de {fCompact(carros.teto_p10_p90[0] as number)} a {fCompact(carros.teto_p10_p90[1] as number)} por ano ({fNum1(carros.razao_teto_p90_sobre_p10 ?? NaN)}× de ponta a ponta), e o limite de busca (4 mi/ano) é uma suposição declarada.</>
                      )}
                      {gd?.replicas_com_teto_igual_ao_maximo_observado_pct != null && (
                        <> Na solar distribuída, {fNum1(gd.replicas_com_teto_igual_ao_maximo_observado_pct)}% das réplicas devolvem teto igual ao máximo observado e o ajuste está na fronteira de busca: a banda do bootstrap fica estreita demais frente a mudanças de regra (como a Lei 14.300).</>
                      )}{' '}
                      Estreiteza da banda não mede incerteza de modelo.
                    </p>
                    <p>O bootstrap de resíduos ignora autocorrelação e erro de forma, e por isso subestima a incerteza. A forma de Bass descreve mal o Pix (o coeficiente de imitação q vai ao limite inferior), então o Pix entra pela logística.</p>
                  </section>
                  {(futQ.data?.meta?.lacunas?.length ?? 0) > 0 && (
                    <details className={`card ${styles.tetoBox}`}>
                      <summary>Lacunas declaradas ({futQ.data?.meta?.lacunas?.length})</summary>
                      <ul>{(futQ.data?.meta?.lacunas ?? []).map((l, i) => <li key={i}>{typeof l === 'string' ? l : JSON.stringify(l)}</li>)}</ul>
                    </details>
                  )}
                </div>
              ) : (
                <p className={styles.none}>Sem curvas publicadas.</p>
              ))}
            {aba === 'macro' &&
              (futQ.data?.integracao_macro && Object.keys(futQ.data.integracao_macro).length > 0 ? <MacroIntegration im={futQ.data.integracao_macro} /> : <p className={styles.none}>Integração macro ainda não publicada.</p>)}
            {aba === 'tendencias' &&
              (tend.length > 0 ? (
                <div className={styles.trends}>
                  {tend.map((t) => (
                    <article key={t.id} className={`card ${styles.trend}`}>
                      <header>
                        <h3>{t.titulo}</h3>
                        {t.horizonte && <Badge>{t.horizonte}</Badge>}
                      </header>
                      {t.evidencia && <p><b>Evidência.</b> {t.evidencia}</p>}
                      {t.incerteza && <p><b>Incerteza.</b> {t.incerteza}</p>}
                      {t.impacto_economico && <p><b>Impacto econômico.</b> {t.impacto_economico}</p>}
                      {asList(t.classes_afetadas).length > 0 && (
                        <ul className={styles.chips} aria-label="Classes afetadas">{asList(t.classes_afetadas).map((c) => <li key={c}>{c}</li>)}</ul>
                      )}
                      {t.referencias && t.referencias.length > 0 && (
                        <ul className={styles.refs}>
                          {t.referencias.map((r) => <RefItem key={r.titulo} r={{ id: r.titulo, titulo: r.titulo, url: r.url ?? (r.doi ? `https://doi.org/${r.doi}` : null), seal: r.verificado ? 'verificado' : 'a confirmar' }} />)}
                        </ul>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className={styles.none}>Sem tendências publicadas.</p>
              ))}
          </Tabs>
        </>
      )}
    </PageTemplate>
  )
}

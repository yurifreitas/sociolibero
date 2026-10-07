import { useMemo, type ReactNode } from 'react'
import { Icon, type IconName } from '@/components/atoms/Icon'
import { Kbd } from '@/components/atoms/Kbd'
import { InlineNote } from '@/components/molecules/InlineNote'
import { KpiCard } from '@/components/molecules/KpiCard'
import { useBases } from '@/features/bases/hooks'
import { useChrome } from '@/features/chrome/ChromeContext'
import { useDecisoes, useElection, useForensics, useHistoria, useReferences } from '@/features/data/hooks'
import { useAntes, useClima, usePilares, usePotenciais } from '@/features/conhecimento/hooks'
import { useCruzamento, useFatorHumano, useHumanoNacional } from '@/features/gente/hooks'
import { erosionRange } from '@/features/evolucoes/model'
import { useEvolucoes } from '@/features/evolucoes/hooks'
import { useCustoCorrupcao } from '@/features/risco/hooks'
import { fInt, fNum1, fNum2, fPct } from '@/lib/format'
import { useVtNavigate } from '@/lib/viewTransition'
import styles from './HomePage.module.css'

const TILES: { to: string; icon: IconName; title: string; text: string }[] = [
  { to: '/mapa', icon: 'map', title: 'Mapa', text: '5.570 municípios, 3 pleitos, violência e território' },
  { to: '/decisoes', icon: 'scale', title: 'Decisões', text: 'Viabilidade × impacto, com quórum e Congresso' },
  { to: '/historia', icon: 'history', title: 'História', text: '117 eventos em três trilhas' },
  { to: '/antes-de-1500', icon: 'hourglass', title: 'Antes de 1500', text: 'Povos, clima e manejo, em anos AP' },
  { to: '/gente', icon: 'users', title: 'Economia & gente', text: '14 ciclos, classes e custo humano' },
  { to: '/clima', icon: 'leaf', title: 'Clima', text: 'El Niño, séries abertas e cenários' },
  { to: '/potenciais', icon: 'gem', title: 'Potenciais', text: 'O que o país tem e quase ninguém nota' },
  { to: '/pilares', icon: 'layers', title: 'Pilares', text: 'Pensamento indígena, Elias e outros' },
  { to: '/forense', icon: 'shield', title: 'Forense', text: 'Triagem estatística, com limites à vista' },
  { to: '/corrupcao', icon: 'coins', title: 'Custo da corrupção', text: 'R$ por área, com o que cada número não diz' },
  { to: '/pessimismo', icon: 'trendDown', title: 'Visões pessimistas', text: 'Estresse, decisões ruins e capacidade estatal' },
  { to: '/quebras', icon: 'activity', title: 'Quebras estruturais', text: 'Onde as séries mudam de regime' },
  { to: '/futuro', icon: 'compass', title: 'Futuro', text: 'Leis tecnológicas e projeções' },
]

function Meter({ label, value, total, tone = 'brand', note }: { label: string; value: number; total: number; tone?: 'brand' | 'pos' | 'warn'; note?: string }) {
  const p = total > 0 ? (value / total) * 100 : 0
  return (
    <div className={styles.meter}>
      <div className={styles.meterRow}>
        <span>{label}</span>
        <b className="num">{note ?? `${fInt(value)}/${fInt(total)}`}</b>
      </div>
      <div className={styles.track} role="img" aria-label={`${label}: ${fNum1(p)}%`}>
        <span className={styles[tone]} style={{ width: `${p}%` }} />
      </div>
    </div>
  )
}

function Section({ children }: { children: ReactNode }) {
  return <div className={styles.bento}>{children}</div>
}

export default function HomePage() {
  const go = useVtNavigate()
  const { openPalette } = useChrome()
  const basesQ = useBases()
  const el = useElection('pres_2026_t1')
  const hn = useHumanoNacional()
  const dec = useDecisoes('decisoes.json')
  const forQ = useForensics('pres_2026_t1', true)
  const fh = useFatorHumano()
  const refs = useReferences('references.json')
  const hist = useHistoria('historia.json')
  const cz = useCruzamento()
  const climaQ = useClima()
  const potQ = usePotenciais()
  const pilQ = usePilares()
  const antesQ = useAntes()
  const evoQ = useEvolucoes()
  const corrQ = useCustoCorrupcao()
  const erosao = evoQ.data ? erosionRange(evoQ.data, 5) : null
  const ruptura = evoQ.data?.cadeia_cenarios.ruptura_regime_divida_acima_de_120.mistura_cadeia?.p_ruptura_ate_2038 ?? null
  const cr = corrQ.data?.meta.resumo

  const oniLast = climaQ.data?.series.find((x) => x.id === 'oni_mensal')?.pontos.filter((q) => q[1] != null).slice(-1)[0]
  const potMets = (potQ.data?.potencias ?? []).flatMap((x) => x.metricas ?? [])
  const potMetTot = potMets.length
  const potMetVer = potMets.filter((m) => m.verificado === true).length

  const B = (id: string) => {
    const b = basesQ.data?.bases.find((x) => x.id === id)
    return b ? { id, status: b.status, label: b.chip.rotulo } : undefined
  }

  const duel = useMemo(() => {
    const e = el.data
    if (!e) return null
    const tot = new Map<string, number>()
    let valid = 0
    for (const r of Object.values(e.linhas)) {
      valid += r.validos
      for (const [k, v] of Object.entries(r.votos)) tot.set(k, (tot.get(k) ?? 0) + v)
    }
    const who = (n: string, fallback: string) => {
      const c = e.meta.candidatos.find((x) => String(x.numero) === n)
      const nome = /lula/i.test(c?.nome ?? '') ? 'Lula' : /fl[áa]vio/i.test(c?.nome ?? '') ? 'Flávio Bolsonaro' : (c?.nome ?? fallback)
      return `${nome} (${c?.partido ?? '—'})`
    }
    let leadA = 0
    let leadB = 0
    for (const r of Object.values(e.linhas)) {
      const va = r.votos['22'] ?? 0
      const vb = r.votos['13'] ?? 0
      if (va > vb) leadA += 1
      else if (vb > va) leadB += 1
    }
    const a = { nome: who('22', 'Flávio Bolsonaro'), v: tot.get('22') ?? 0 }
    const b = { nome: who('13', 'Lula'), v: tot.get('13') ?? 0 }
    return { a, b, leadA, leadB, nMun: Object.keys(e.linhas).length, pa: (a.v / valid) * 100, pb: (b.v / valid) * 100, valid, secoes: (e.meta.validacao as { secoes_total?: number } | undefined)?.secoes_total ?? null }
  }, [el.data])

  const homic = useMemo(() => {
    const s = hn.data?.series.taxa_homicidios?.brasil
    if (!s) return null
    const yrs = Object.keys(s).map(Number).sort((x, y) => x - y)
    const values = yrs.map((y) => s[String(y)] ?? null)
    const idx = values.map((v) => v != null).lastIndexOf(true)
    const peakV = Math.max(...values.filter((v): v is number => v != null))
    const peakY = yrs[values.indexOf(peakV)]
    return { values, last: values[idx] as number, lastY: yrs[idx], peakV, peakY, first: yrs[0], n: yrs.length }
  }, [hn.data])

  const viab = useMemo(() => {
    const d = dec.data?.decisoes
    if (!d) return null
    return { n: d.length, dir: d.filter((x) => x.p_aprovacao.direita >= 0.5).length, esq: d.filter((x) => x.p_aprovacao.esquerda >= 0.5).length }
  }, [dec.data])

  const ev = useMemo(() => {
    const ind = fh.data?.indicadores
    const fontes = hist.data?.eventos.flatMap((e) => e.fontes ?? [])
    return {
      fh: ind ? { ok: ind.filter((i) => i.verificado === true).length, n: ind.length } : null,
      refs: refs.data ? { ok: refs.data.filter((r) => r.verificado).length, n: refs.data.length } : null,
      hist: fontes ? { ok: fontes.filter((f) => f.verificado === true).length, n: fontes.length } : null,
    }
  }, [fh.data, refs.data, hist.data])

  const cal = forQ.data?.nacional?.calibracao
  const czr = cz.data?.correlacoes.pres_2026_t1?.['13|pct_pretos_pardos']

  return (
    <main id="conteudo" className={styles.page}>
      <header className={styles.hero}>
        <p className="eyebrow">Sociolibero · visão geral</p>
        <h1 className={styles.h1}>
          O Brasil em <span className={styles.grad}>números rastreáveis</span>
        </h1>
        <p className={styles.lead}>
          Eleições por município, decisões econômicas e institucionais, história e custo humano — cada número com fonte, hash, validação e o que ele não diz.
        </p>
        <div className={styles.cta}>
          <button type="button" className={styles.primary} onClick={() => go('/mapa')}>
            Abrir o mapa <Icon name="arrowRight" size={16} />
          </button>
          <button type="button" className={styles.ghost} onClick={openPalette}>
            <Icon name="search" size={15} /> Buscar município, base ou página <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
          </button>
        </div>
      </header>

      <InlineNote id="home-prelim" tone="warn" baseId="tse-2026" title="Dados preliminares.">
        O 1º turno de 2026 usa o snapshot do TSE de 05/10/2026; o 2º turno é em 25/10/2026. Os números podem mudar até a diplomação.
      </InlineNote>

      <Section>
        <KpiCard
          className={styles.duel}
          size="lg"
          label="Presidente 2026 · 1º turno · votos válidos"
          value={duel?.pa ?? null}
          format={(n) => `${fNum1(n)}%`}
          loading={el.isPending}
          delta={duel ? { text: `${duel.a.nome.split(' ')[0]} +${fNum2(duel.pa - duel.pb)} pp`, tone: 'neutral' } : undefined}
          base={B('tse-2026')}
          foot={duel ? 'Soma dos 5.570 municípios (sem o exterior); o TSE publica 47,03% × 45,16% com o exterior. Preliminar.' : undefined}
        >
          {duel && (
            <div className={styles.duelBars}>
              {[duel.a, duel.b].map((c, i) => (
                <div key={c.nome} className={styles.duelRow}>
                  <div className={styles.duelHead}>
                    <span>{c.nome}</span>
                    <b className="num">{fInt(c.v)}</b>
                  </div>
                  <div className={styles.track} role="img" aria-label={`${c.nome}: ${fNum1(i === 0 ? duel.pa : duel.pb)}% dos válidos`}>
                    <span className={i === 0 ? styles.brand : styles.accent} style={{ width: `${i === 0 ? duel.pa : duel.pb}%` }} />
                  </div>
                </div>
              ))}
              <div className={styles.leaders}>
                <p className={styles.leadT}>Primeiro colocado em cada município</p>
                <div className={styles.stack} role="img" aria-label={`${duel.a.nome} lidera em ${fInt(duel.leadA)} municípios e ${duel.b.nome} em ${fInt(duel.leadB)}`}>
                  <span className={styles.brand} style={{ width: `${(duel.leadA / duel.nMun) * 100}%` }} />
                  <span className={styles.accent} style={{ width: `${(duel.leadB / duel.nMun) * 100}%` }} />
                </div>
                <div className={styles.leadRow}>
                  <span><i className={styles.dotA} /> {duel.a.nome.split(' ')[0]} <b className="num">{fInt(duel.leadA)}</b></span>
                  <span><i className={styles.dotB} /> {duel.b.nome.split(' ')[0]} <b className="num">{fInt(duel.leadB)}</b></span>
                </div>
                <p className={styles.leadN}>Município não é voto: poucos municípios grandes pesam mais em votos do que muitos pequenos.</p>
              </div>
            </div>
          )}
        </KpiCard>

        <KpiCard
          className={styles.sec}
          label="Seções reconciliadas com o TSE"
          value={duel?.secoes ?? null}
          format={(n) => fInt(Math.round(n))}
          loading={el.isPending}
          base={B('tse-2022')}
          delta={{ text: 'Δ 0 nos totais publicados', tone: 'pos' }}
          foot="A soma por seção bate com o total publicado de cada candidato (2022 T1, T2 e 2026 T1). Valida a ingestão, não a lisura da eleição."
        />

        <KpiCard
          className={styles.hom}
          label={homic ? `Homicídios por 100 mil · Brasil, ${homic.first}–${homic.lastY}` : 'Homicídios por 100 mil · Brasil'}
          value={homic?.last ?? null}
          format={(n) => fNum1(n)}
          loading={hn.isPending}
          base={B('humano-municipal')}
          delta={homic ? { text: `${fPct(((homic.last - homic.peakV) / homic.peakV) * 100)} desde o pico de ${homic.peakY}`, tone: 'pos' } : undefined}
          spark={homic ? { values: homic.values, label: `Taxa de homicídios no Brasil de ${homic.first} a ${homic.lastY}: ${fNum1(homic.last)} por 100 mil no último ano`, tone: 'pos' } : undefined}
          foot="Atlas da Violência (SIM/DATASUS), via projeto Arandu/trans."
        />

        <KpiCard
          className={styles.debt}
          label="Dívida bruta/PIB em 2035 · cenário pragmático"
          value={dec.data?.meta.referencia_2035.debt ?? null}
          format={(n) => `${fNum1(n)}%`}
          loading={dec.isPending}
          base={B('modelo-macro')}
          foot="Modelo reduzido com premissas julgadas — compare cenários, não leia como previsão. Acima de 120% é ruptura de regime."
        />

        <KpiCard
          className={styles.dec}
          label="Decisões catalogadas e viáveis (P ≥ 50%)"
          value={viab?.n ?? null}
          format={(n) => fInt(Math.round(n))}
          unit="decisões"
          loading={dec.isPending}
          base={B('decisoes')}
        >
          {viab && (
            <div className={styles.meters}>
              <Meter label="Com presidente de direita" value={viab.dir} total={viab.n} tone="brand" />
              <Meter label="Com presidente de esquerda" value={viab.esq} total={viab.n} tone="warn" />
            </div>
          )}
        </KpiCard>

        <KpiCard className={styles.evid} label="O quanto está conferido" base={B('fator-humano')}>
          <div className={styles.meters}>
            {ev.fh && <Meter label="Fator humano · indicadores" value={ev.fh.ok} total={ev.fh.n} tone="warn" />}
            {ev.hist && <Meter label="História · fontes com link ok" value={ev.hist.ok} total={ev.hist.n} tone="pos" />}
            {ev.refs && <Meter label="Referências verificadas" value={ev.refs.ok} total={ev.refs.n} tone="pos" />}
            {!ev.fh && !ev.hist && !ev.refs && <p className={styles.muted}>Carregando…</p>}
          </div>
          <p className={styles.footInline}>“Link ok” ≠ número conferido. A gaveta “Bases &amp; avisos” detalha cada caso.</p>
        </KpiCard>

        <KpiCard className={styles.forn} label="Forense: calibração em dados reais (2026)" value={cal?.municipios_com_flag != null ? cal.municipios_com_flag * 100 : null} format={(n) => `${fNum1(n)}%`} loading={forQ.isPending} base={B('forense')} unit="dos municípios sinalizados">
          {cal && (
            <div className={styles.meters}>
              <Meter label="Último dígito com p < 0,05 (esperado ≈ 5%)" value={(cal.municipios_ld_p_menor_0_05 ?? 0) * 100} total={100} tone="pos" note={fPct((cal.municipios_ld_p_menor_0_05 ?? 0) * 100)} />
              <Meter label="Benford 2º dígito reprova (inválido: fora do score)" value={(cal.municipios_b2_p_menor_0_05 ?? 0) * 100} total={100} tone="warn" note={fPct((cal.municipios_b2_p_menor_0_05 ?? 0) * 100)} />
            </div>
          )}
        </KpiCard>

        <KpiCard
          className={styles.clim}
          label="El Niño agora · ONI"
          value={oniLast ? (oniLast[1] as number) : null}
          format={(n) => `${n >= 0 ? '+' : ''}${fNum2(n)}`}
          unit="°C"
          loading={climaQ.isPending}
          base={B('clima')}
          delta={oniLast ? { text: `${(oniLast[1] as number) >= 0.5 ? 'acima de +0,5: El Niño' : (oniLast[1] as number) <= -0.5 ? 'abaixo de −0,5: La Niña' : 'neutro'} · média móvel de 3 meses até ${String(oniLast[0]).slice(0, 7)}`, tone: (oniLast[1] as number) >= 0.5 ? 'neg' : 'neutral' } : undefined}
          foot={climaQ.data ? `Só ${climaQ.data.meta?.resumo_testes?.ic95_exclui_zero ?? '—'} de ${climaQ.data.meta?.resumo_testes?.testes_publicados ?? '—'} relações clima × economia têm intervalo que exclui o zero (por acaso: ~${fNum1(climaQ.data.meta?.resumo_testes?.esperado_por_acaso_se_nenhuma_relacao_real ?? 0)}). Correlação não é causalidade.` : undefined}
        />
        <KpiCard
          className={styles.pot}
          label="Potências do Brasil analisadas"
          value={potQ.data?.potencias.length ?? null}
          format={(n) => fInt(n)}
          unit="com grau de uso e barreiras"
          loading={potQ.isPending}
          base={B('potenciais-brasil')}
          foot={potQ.data ? `${potMetVer} de ${potMetTot} métricas conferidas na fonte. Potencial técnico não é potencial econômico.` : undefined}
        />
        <KpiCard
          className={styles.pil}
          label="Pilares de pensamento"
          value={pilQ.data?.pensadores.length ?? null}
          format={(n) => fInt(n)}
          unit="pensadores · indígenas, afro-brasileiros, Elias e outros"
          loading={pilQ.isPending}
          base={B('pilares-pensamento')}
          foot={pilQ.data ? `${pilQ.data.viabilizacao?.length ?? 0} propostas viabilizadas, nenhuma consultada a povo ou comunidade.${antesQ.data ? ` Antes de 1500: ${antesQ.data.eventos.length} eventos e ${antesQ.data.clima_eventos?.length ?? 0} marcos climáticos.` : ''}` : undefined}
        />

        <KpiCard
          className={styles.evo}
          label="Erosão democrática em 5 anos · entre 4 modelos"
          value={erosao ? erosao.lo * 100 : null}
          format={(n) => `${fNum1(n)}%`}
          unit={erosao ? `a ${fNum1(erosao.hi * 100)}%` : undefined}
          loading={evoQ.isPending}
          base={B('evolucoes')}
          delta={{ text: 'os modelos discordam; nenhum é “a resposta”', tone: 'neutral' }}
          foot="Cadeia de Markov entre regimes: extrapola frequências históricas; eventos raros e choques externos não entram."
        />
        <KpiCard
          className={styles.rup}
          label="P(dívida > 120% do PIB até 2038) · cadeia de cenários"
          value={ruptura != null ? ruptura * 100 : null}
          format={(n) => `${Math.round(n)}%`}
          loading={evoQ.isPending}
          base={B('evolucoes')}
          delta={{ text: 'matriz de cenários = julgamento; edite em História → Evoluções', tone: 'neg' }}
          foot="Acima de 120% é ruptura de regime, não trajetória. Não é previsão."
        />
        <KpiCard
          className={styles.corr}
          label="Custo da corrupção: valores lidos na fonte"
          value={cr?.valores_verificados ?? null}
          format={(n) => fInt(Math.round(n))}
          unit={cr?.valores ? `de ${cr.valores} valores · ${corrQ.data?.areas.length ?? '—'} áreas` : undefined}
          loading={corrQ.isPending}
          base={B('custo-corrupcao')}
          foot="Contagem apurada e estimativa não se somam. Sem nomes de pessoas nem de empresas."
        />

        <KpiCard
          className={styles.terr}
          label="Voto em Lula × % pretos e pardos · entre municípios"
          value={czr?.corr_bruta ?? null}
          format={(n) => fNum2(n)}
          unit="r"
          loading={cz.isPending}
          base={B('cruzamento-territorial')}
          delta={czr ? { text: `dentro da UF ${fNum2(czr.corr_dentro_uf)} · IC95 ${fNum2(czr.ic95_dentro_uf[0] ?? 0)} a ${fNum2(czr.ic95_dentro_uf[1] ?? 0)}`, tone: 'neutral' } : undefined}
          foot="Correlação entre municípios, ponderada por votos. Não descreve o comportamento de indivíduos (falácia ecológica) nem é causal."
        >
          {cz.data?.correlacoes.pres_2026_t1 && (
            <div className={styles.meters}>
              {([['13|pct_pretos_pardos', '% pretos e pardos'], ['13|pct_quilombola', '% quilombola'], ['13|pct_indigena', '% indígena']] as const).map(([k, l]) => {
                const r = cz.data?.correlacoes.pres_2026_t1?.[k]
                return r ? <Meter key={k} label={`${l} · r bruta`} value={Math.abs(r.corr_bruta) * 100} total={100} tone="brand" note={fNum2(r.corr_bruta)} /> : null
              })}
            </div>
          )}
        </KpiCard>
      </Section>

      <nav aria-label="Seções" className={styles.tiles}>
        {TILES.map((t) => (
          <a key={t.to} href={`#${t.to}`} className={`card ${styles.tile}`} onClick={(e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) { e.preventDefault(); go(t.to) } }}>
            <span className={styles.tileIcon}><Icon name={t.icon} size={18} /></span>
            <span className={styles.tileTitle}>{t.title}</span>
            <span className={styles.tileText}>{t.text}</span>
            <Icon name="arrowRight" size={16} className={styles.tileArrow} />
          </a>
        ))}
      </nav>
    </main>
  )
}

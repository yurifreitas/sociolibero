import { useMemo } from 'react'
import { Button } from '@/components/atoms/Button'
import { Skeleton } from '@/components/atoms/Skeleton'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { EmptyState } from '@/components/molecules/EmptyState'
import { ErrorState } from '@/components/molecules/ErrorState'
import { Notice } from '@/components/molecules/Notice'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { Tabs } from '@/components/molecules/Tabs'
import { DirectionList } from '@/components/organisms/DirectionList'
import { EventPanel } from '@/components/organisms/EventPanel'
import { HistoryTimeline, type TimelineSelection } from '@/components/organisms/HistoryTimeline'
import { PeriodPanel } from '@/components/organisms/PeriodPanel'
import { PrincipleList } from '@/components/organisms/PrincipleList'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useHistoria, useIndex } from '@/features/data/hooks'
import { eventTrilhas, isCrossing, parseYear, TRILHAS, trilhaLabel } from '@/features/historia/model'
import { oklchToRgb, rgbCss } from '@/lib/color'
import { useTheme } from '@/lib/theme'
import { useUrlState } from '@/lib/useUrlState'
import styles from './HistoriaPage.module.css'

type Aba = 'linha' | 'principios' | 'direcoes'
const HUES = [250, 165, 70, 20, 310, 210]
const csv = (s: string | null) => new Set((s ?? '').split(',').filter(Boolean))
const toCsv = (s: Set<string>) => (s.size ? [...s].join(',') : null)
const toggle = (set: Set<string>, k: string) => {
  const n = new Set(set)
  if (n.has(k)) n.delete(k)
  else n.add(k)
  return n
}

export default function HistoriaPage() {
  const { get, update } = useUrlState()
  const { effective } = useTheme()
  const indexQ = useIndex()
  const index = indexQ.data
  const histQ = useHistoria(index ? (index.historia ?? 'historia.json') : null)
  const data = histQ.data

  const aba: Aba = get('aba') === 'principios' || get('aba') === 'direcoes' ? (get('aba') as Aba) : 'linha'
  const selCat = csv(get('cat'))
  const selTr = csv(get('tr'))
  const sel: TimelineSelection = useMemo(() => {
    const raw = get('sel')
    if (!raw) return null
    const [kind, ...rest] = raw.split(':')
    const id = rest.join(':')
    return (kind === 'ev' || kind === 'per') && id ? { kind: kind === 'ev' ? 'evento' : 'periodo', id } : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [get('sel')])

  const regimeColor = useMemo(() => {
    const order: string[] = []
    for (const p of data?.periodos ?? []) if (!order.includes(p.regime)) order.push(p.regime)
    const L = effective === 'light' ? 0.5 : 0.42
    return (regime: string) => rgbCss(oklchToRgb(L, 0.12, HUES[Math.max(0, order.indexOf(regime)) % HUES.length] as number))
  }, [data, effective])

  const eventos = useMemo(() => [...(data?.eventos ?? [])].sort((a, b) => (parseYear(a.data) ?? 0) - (parseYear(b.data) ?? 0)), [data])
  const categorias = useMemo(() => {
    const c = new Map<string, number>()
    for (const e of eventos) c.set(e.categoria, (c.get(e.categoria) ?? 0) + 1)
    return [...c.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR')).map(([key, count]) => ({ key, count }))
  }, [eventos])
  const trilhasPresentes = useMemo(() => {
    const present = new Set(eventos.flatMap(eventTrilhas))
    const known = TRILHAS.map((t) => t.key as string).filter((k) => present.has(k))
    return [...known, ...[...present].filter((k) => !known.includes(k)).sort()]
  }, [eventos])
  const trilhasVisiveis = selTr.size > 0 ? trilhasPresentes.filter((t) => selTr.has(t)) : trilhasPresentes
  const visiveis = useMemo(
    () =>
      eventos.filter(
        (e) => (selCat.size === 0 || selCat.has(e.categoria)) && (selTr.size === 0 || eventTrilhas(e).some((t) => selTr.has(t))),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventos, get('cat'), get('tr')],
  )

  if (indexQ.isError) return <ErrorState message={(indexQ.error as Error).message} onRetry={() => indexQ.refetch()} />
  if (histQ.isError) return <ErrorState message={(histQ.error as Error).message} onRetry={() => histQ.refetch()} />
  if (!index || histQ.isPending)
    return (
      <PageTemplate>
        <div style={{ display: 'grid', gap: 16 }} aria-busy="true">
          <Skeleton width={260} height={40} />
          <Skeleton height={44} />
          <Skeleton height={320} />
        </div>
      </PageTemplate>
    )
  if (!data)
    return (
      <PageTemplate>
        <SectionHeader level={1} title="História" />
        <EmptyState
          icon="history"
          title="Linha do tempo ainda não publicada"
          action={
            <Button variant="primary" onClick={() => histQ.refetch()}>
              Tentar novamente
            </Button>
          }
        >
          O arquivo <code>historia.json</code> não foi encontrado em <code>web/public/data/</code>.
        </EmptyState>
      </PageTemplate>
    )

  const selEvento = sel?.kind === 'evento' ? data.eventos.find((e) => e.id === sel.id) : undefined
  const selPeriodo = sel?.kind === 'periodo' ? data.periodos.find((p) => p.id === sel.id) : undefined
  const periodoDoEvento = selEvento ? data.periodos.find((p) => p.id === selEvento.periodo) : undefined
  const regimes = [...new Set(data.periodos.map((p) => p.regime))]
  const nPrinc = data.principios?.length ?? 0
  const nDir = data.direcoes?.length ?? 0
  const nCruz = visiveis.filter(isCrossing).length

  return (
    <PageTemplate>
      <SectionHeader
        level={1}
        title="História institucional"
        description="Períodos, eventos e conceitos sobre a distribuição de poderes no Brasil, em três trilhas paralelas, com fontes e indicação de verificação."
      />
      {data.meta?.mock && (
        <Notice tone="warn" title="Conteúdo de demonstração (MOCK)">
          Os textos abaixo são marcadores de posição para desenvolver a interface. Não descrevem fatos.
        </Notice>
      )}
      {data.meta?.aviso && <Notice tone="info">{data.meta.aviso}</Notice>}

      <Tabs<Aba>
        label="Seções de história"
        value={aba}
        onChange={(a) => update({ aba: a === 'linha' ? null : a })}
        tabs={[
          { key: 'linha', label: 'Linha do tempo', count: data.eventos.length },
          { key: 'principios', label: 'Princípios', count: nPrinc },
          { key: 'direcoes', label: 'Direções', count: nDir },
        ]}
      >
        {aba === 'linha' && (
          <div className={styles.stack}>
            <div className={styles.filters}>
              <ChipGroup
                label="Trilha"
                items={trilhasPresentes.map((k) => ({ key: k, label: trilhaLabel(k) }))}
                selected={selTr}
                onToggle={(k) => update({ tr: toCsv(toggle(selTr, k)) })}
                onClear={() => update({ tr: null })}
              />
              <ChipGroup
                label="Categoria"
                items={categorias}
                selected={selCat}
                onToggle={(k) => update({ cat: toCsv(toggle(selCat, k)) })}
                onClear={() => update({ cat: null })}
              />
            </div>
            <p className={styles.count}>
              {visiveis.length} de {eventos.length} eventos
              {nCruz > 0 ? ` · ${nCruz} ligam mais de uma trilha (marcador quadrado, com linha vertical)` : ''}
            </p>
            <HistoryTimeline
              periodos={data.periodos}
              eventos={visiveis}
              allEventos={eventos}
              trilhas={trilhasVisiveis.length ? trilhasVisiveis : ['estado']}
              selected={sel}
              onSelect={(s) => update({ sel: s ? `${s.kind === 'evento' ? 'ev' : 'per'}:${s.id}` : null })}
              regimeColor={regimeColor}
            />
            <ul className={styles.legend} aria-label="Regimes por cor">
              {regimes.map((r) => (
                <li key={r}>
                  <i style={{ background: regimeColor(r) }} /> {r}
                </li>
              ))}
            </ul>
            {selEvento ? (
              <EventPanel evento={selEvento} periodo={periodoDoEvento} regimeColor={regimeColor} onClose={() => update({ sel: null })} />
            ) : selPeriodo ? (
              <PeriodPanel
                periodo={selPeriodo}
                regimeColor={regimeColor}
                eventCount={eventos.filter((e) => e.periodo === selPeriodo.id).length}
                onClose={() => update({ sel: null })}
              />
            ) : (
              <EmptyState icon="history" title="Selecione um período ou um evento">
                Clique em uma faixa de período ou em um marcador para ver resumo, impacto nos poderes, controvérsias e fontes.
              </EmptyState>
            )}
          </div>
        )}
        {aba === 'principios' &&
          (nPrinc > 0 ? <PrincipleList items={data.principios ?? []} /> : <EmptyState title="Sem princípios publicados" />)}
        {aba === 'direcoes' &&
          (nDir > 0 ? <DirectionList items={data.direcoes ?? []} /> : <EmptyState title="Sem direções publicadas" />)}
      </Tabs>
    </PageTemplate>
  )
}

import { useMemo } from 'react'
import { Select } from '@/components/atoms/Select'
import { Skeleton } from '@/components/atoms/Skeleton'
import { EmptyState } from '@/components/molecules/EmptyState'
import { ErrorState } from '@/components/molecules/ErrorState'
import { Field } from '@/components/molecules/Field'
import { InlineNote } from '@/components/molecules/InlineNote'
import { StatTile } from '@/components/molecules/StatTile'
import { fInt, fPct } from '@/lib/format'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { DigitChart } from '@/components/organisms/DigitChart'
import { FingerprintHeatmap } from '@/components/organisms/FingerprintHeatmap'
import { PowerCurves } from '@/components/organisms/PowerCurves'
import { TopTable } from '@/components/organisms/TopTable'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useForensics, useGeo, useIndex, useValidation } from '@/features/data/hooks'
import { namesFromGeo } from '@/features/data/names'
import { useUrlState } from '@/lib/useUrlState'

export default function ForensePage() {
  const { get, update } = useUrlState()
  const indexQ = useIndex()
  const index = indexQ.data
  const ids = index?.forense ?? []
  const eId = get('e') && ids.includes(get('e') as string) ? (get('e') as string) : ids[0]
  const forQ = useForensics(eId, ids.length > 0)
  const valQ = useValidation(index?.validacao_sintetica)
  const geoQ = useGeo(index?.geo)
  const names = useMemo(() => namesFromGeo(geoQ.data), [geoQ.data])

  const rows = useMemo(
    () =>
      forQ.data
        ? Object.entries(forQ.data.linhas).map(([ibge, r]) => ({
            ibge,
            nome: names.get(ibge)?.nome ?? ibge,
            uf: names.get(ibge)?.uf ?? '—',
            n_secoes: r.n_secoes,
            score: r.score,
            confianca: r.confianca,
            flags: r.flags,
          }))
        : [],
    [forQ.data, names],
  )

  if (indexQ.isError) return <ErrorState message={(indexQ.error as Error).message} onRetry={() => indexQ.refetch()} />
  if (!index)
    return (
      <PageTemplate>
        <Skeleton width={320} height={40} />
        <Skeleton height={360} />
      </PageTemplate>
    )
  if (ids.length === 0)
    return (
      <PageTemplate>
        <SectionHeader level={1} title="Forense eleitoral" />
        <EmptyState icon="shield" title="Nenhuma análise forense publicada ainda">
          Rode <code>uv run sociolibero eleicoes build</code> para gerar os testes por município.
        </EmptyState>
      </PageTemplate>
    )
  if (forQ.isError) return <ErrorState message={(forQ.error as Error).message} onRetry={() => forQ.refetch()} />

  const f = forQ.data
  const nac = f?.nacional
  const testLabels = Object.fromEntries((f?.meta.testes ?? []).map((t) => [t.chave, t.rotulo]))
  const label = (k: string) => testLabels[k] ?? k

  return (
    <PageTemplate>
      <SectionHeader
        level={1}
        title="Forense eleitoral"
        description="Testes estatísticos para decidir onde conferir primeiro. Eles priorizam auditoria; não demonstram irregularidade."
        actions={
          <div style={{ width: 280 }}>
            <Field label="Pleito analisado">
              {(id) => (
                <Select id={id} value={eId} onChange={(e) => update({ e: e.target.value })}>
                  {ids.map((i) => (
                    <option key={i} value={i}>{index.eleicoes.find((x) => x.id === i)?.rotulo ?? i}</option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        }
      />
      <InlineNote id="forense-aviso" tone="warn" baseId="forense" dismissible={false} title="Anomalia estatística não é prova de fraude.">
        Desvios aparecem por acaso (com milhares de testes, alguns serão “significativos”), por diferenças legítimas entre regiões e por municípios pequenos. Cada teste traz suas limitações; veja a validação com fraude sintética abaixo.
      </InlineNote>

      {!f ? (
        <Skeleton height={360} />
      ) : (
        <>
          <section aria-labelledby="fp" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--space-6)' }}>
            <SectionHeader title="Impressão digital nacional" level={2} description="Densidade de comparecimento × voto no mais votado. A forma da nuvem é o objeto de análise." />
            {nac?.fingerprint ? <FingerprintHeatmap fp={nac.fingerprint} /> : <EmptyState title="Impressão digital indisponível" />}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--space-6)' }}>
            <SectionHeader title="Dígitos das contagens" level={2} description="Último dígito deve ser aproximadamente uniforme; o 2º dígito segue (com ressalvas) a Lei de Benford." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-12)' }}>
              {nac?.ultimo_digito && <DigitChart title="Último dígito" data={nac.ultimo_digito} note="Com muitas contagens, qualquer desvio mínimo gera p baixo: olhe o tamanho do desvio, não só o p." />}
              {nac?.benford_2bl && <DigitChart title="Benford · 2º dígito" data={nac.benford_2bl} note="A literatura critica Benford de 2º dígito em eleições; use como triagem, não como veredito." />}
            </div>
          </section>

          {nac?.calibracao && (
            <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--space-6)' }}>
              <SectionHeader
                title="Calibração: quantos falsos alarmes esperar"
                level={2}
                description="Sob “nada de errado” espera-se ~5% dos municípios com p < 0,05. Muito acima disso, o teste está detectando heterogeneidade legítima (ou ruído do método), não irregularidade."
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
                {nac.calibracao.municipios_ld_p_menor_0_05 != null && (
                  <StatTile label="Último dígito: p < 0,05" value={fPct(nac.calibracao.municipios_ld_p_menor_0_05 * 100)} hint="dos municípios · esperado ≈ 5%" tone={nac.calibracao.municipios_ld_p_menor_0_05 > 0.1 ? 'neg' : 'neutral'} />
                )}
                {nac.calibracao.municipios_b2_p_menor_0_05 != null && (
                  <StatTile label="Benford 2º dígito: p < 0,05" value={fPct(nac.calibracao.municipios_b2_p_menor_0_05 * 100)} hint="dos municípios · esperado ≈ 5%" tone={nac.calibracao.municipios_b2_p_menor_0_05 > 0.1 ? 'neg' : 'neutral'} />
                )}
                {nac.calibracao.municipios_com_flag != null && (
                  <StatTile label="Municípios sinalizados" value={fPct(nac.calibracao.municipios_com_flag * 100)} hint="com ao menos um teste no score" />
                )}
              </div>
              {nac.calibracao.persistencia && Object.keys(nac.calibracao.persistencia).length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 'var(--fs-14)' }}>
                    <caption style={{ textAlign: 'left', fontSize: 'var(--fs-12)', color: 'var(--text-muted)', paddingBottom: 'var(--space-2)' }}>
                      Persistência: quem é sinalizado aqui também é sinalizado em outro pleito? (se fosse só acaso, P(B | A) ≈ base)
                    </caption>
                    <thead>
                      <tr style={{ fontSize: 'var(--fs-12)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th scope="col" style={{ padding: '4px 16px 4px 0', fontWeight: 500 }}>Outro pleito</th>
                        <th scope="col" style={{ textAlign: 'right', padding: '4px 16px 4px 0', fontWeight: 500 }}>Sinalizados aqui</th>
                        <th scope="col" style={{ textAlign: 'right', padding: '4px 16px 4px 0', fontWeight: 500 }}>Sinalizados lá</th>
                        <th scope="col" style={{ textAlign: 'right', padding: '4px 16px 4px 0', fontWeight: 500 }}>Em ambos</th>
                        <th scope="col" style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>P(lá | aqui) vs base</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(nac.calibracao.persistencia).map(([id, r]) => (
                        <tr key={id} style={{ borderTop: '1px solid var(--border)' }}>
                          <th scope="row" style={{ textAlign: 'left', fontWeight: 500, padding: '10px 16px 10px 0' }}>{index.eleicoes.find((e) => e.id === id)?.rotulo ?? id}</th>
                          <td style={{ textAlign: 'right', padding: '10px 16px 10px 0', fontVariantNumeric: 'tabular-nums' }}>{fInt(r.flags_a)}</td>
                          <td style={{ textAlign: 'right', padding: '10px 16px 10px 0', fontVariantNumeric: 'tabular-nums' }}>{fInt(r.flags_b)}</td>
                          <td style={{ textAlign: 'right', padding: '10px 16px 10px 0', fontVariantNumeric: 'tabular-nums' }}>{fInt(r.em_ambos)}</td>
                          <td style={{ textAlign: 'right', padding: '10px 0', fontVariantNumeric: 'tabular-nums' }}>{r.p_b_dado_a == null ? '—' : fPct(r.p_b_dado_a * 100)} vs {r.base_b == null ? '—' : fPct(r.base_b * 100)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--space-6)' }}>
            <SectionHeader
              title="Validação com fraude sintética"
              level={2}
              description="Cada detector é testado contra fraude injetada de forma controlada (verdade conhecida): quanto de fraude é preciso para ser visto e com que taxa de falsos positivos."
            />
            {valQ.isError ? (
              <ErrorState message={(valQ.error as Error).message} onRetry={() => valQ.refetch()} />
            ) : valQ.data ? (
              <PowerCurves validation={valQ.data} labels={testLabels} />
            ) : valQ.isPending && index.validacao_sintetica ? (
              <Skeleton height={260} />
            ) : (
              <EmptyState title="Validação sintética indisponível" />
            )}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--space-6)' }}>
            <SectionHeader
              title="Municípios de maior prioridade de auditoria"
              level={2}
              description={f?.meta.score ? `Como o score é calculado: ${f.meta.score}` : 'Score combina os testes; confiança depende do nº de seções.'}
            />
            <TopTable rows={rows} electionId={eId ?? ''} flagLabels={Object.fromEntries(Object.keys(testLabels).map((k) => [k, label(k)]))} />
          </section>
        </>
      )}
    </PageTemplate>
  )
}

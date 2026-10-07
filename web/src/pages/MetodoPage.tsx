import { Skeleton } from '@/components/atoms/Skeleton'
import { ErrorState } from '@/components/molecules/ErrorState'
import { Notice } from '@/components/molecules/Notice'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { ProvenanceCard } from '@/components/organisms/ProvenanceCard'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useElections, useForensics, useIndex } from '@/features/data/hooks'
import styles from './MetodoPage.module.css'

const COMMANDS = `uv sync
uv run sociolibero eleicoes build    # baixa TSE/IBGE, valida, gera web/public/data
uv run sociolibero decisoes          # camada de decisões
cd web && pnpm install && pnpm dev   # interface
pnpm mock                            # (opcional) dados de demonstração`

export default function MetodoPage() {
  const indexQ = useIndex()
  const index = indexQ.data
  const elQs = useElections(index?.eleicoes.map((e) => e.id) ?? [])
  const forQ = useForensics(index?.forense[0], (index?.forense.length ?? 0) > 0)

  if (indexQ.isError) return <ErrorState message={(indexQ.error as Error).message} onRetry={() => indexQ.refetch()} />
  const tests = forQ.data?.meta.testes ?? []

  return (
    <PageTemplate width="narrow">
      <SectionHeader level={1} title="Método & Fontes" description="De onde vem cada número, como foi tratado e o que ele não permite concluir." />

      <section className={styles.sec}>
        <SectionHeader level={2} title="Proveniência por eleição" description="Arquivo de origem, data do download e SHA-256 do arquivo baixado. O mesmo hash deve sair ao baixar de novo." />
        {!index ? (
          <Skeleton height={200} />
        ) : (
          <div className={styles.cards}>
            {elQs.map((q, i) =>
              q.data ? (
                <ProvenanceCard key={q.data.meta.id} meta={q.data.meta} municipios={Object.keys(q.data.linhas).length} />
              ) : q.isError ? (
                <ErrorState key={i} message={(q.error as Error).message} onRetry={() => q.refetch()} />
              ) : (
                <Skeleton key={i} height={180} />
              ),
            )}
          </div>
        )}
      </section>

      <section className={styles.sec}>
        <SectionHeader level={2} title="Como conferir um número" />
        <ol className={styles.steps}>
          <li>Abra a página do município e anote o pleito, os votos e o hash exibidos na linha de proveniência.</li>
          <li>Baixe o arquivo original do TSE pelo link da fonte e compare o SHA-256 (<code>sha256sum arquivo.zip</code>).</li>
          <li>Filtre o CSV pelo município (código TSE) e some as zonas: o total deve bater com o painel.</li>
          <li>Para teste forense, reexecute o pipeline: os p-valores e z-scores são determinísticos.</li>
        </ol>
      </section>

      <section className={styles.sec}>
        <SectionHeader level={2} title="Testes forenses" />
        {tests.length === 0 ? (
          <p className={styles.muted}>Nenhuma análise forense publicada.</p>
        ) : (
          <dl className={styles.tests}>
            {tests.map((t) => (
              <div key={t.chave}>
                <dt>{t.rotulo}</dt>
                <dd>
                  {t.descricao}
                  {t.interpretacao && <> <strong>Interpretação:</strong> {t.interpretacao}</>}
                  {t.limitacoes && <> <strong>Limitação:</strong> {t.limitacoes}</>}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className={styles.sec}>
        <SectionHeader level={2} title="Limitações" />
        <Notice tone="warn" title="Leia antes de citar um número">
          <ul className={styles.list}>
            <li>Anomalia estatística não é prova de fraude; é uma lista de onde conferir primeiro.</li>
            <li>Resultados preliminares mudam até a totalização oficial; o selo “Preliminar” indica isso.</li>
            <li>Municípios pequenos oscilam muito: o score considera o nº de seções, mas a incerteza continua alta.</li>
            <li>Os efeitos das decisões econômicas são julgamentos editáveis, não estimativas econométricas.</li>
            <li>Dados de demonstração (MOCK) não têm valor analítico.</li>
          </ul>
        </Notice>
      </section>

      <section className={styles.sec}>
        <SectionHeader level={2} title="Como reproduzir" />
        <pre className={styles.code}>{COMMANDS}</pre>
      </section>
    </PageTemplate>
  )
}

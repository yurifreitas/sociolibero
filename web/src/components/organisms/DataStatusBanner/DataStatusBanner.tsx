import { Notice } from '@/components/molecules/Notice'
import type { DataIndex } from '@/features/data/schemas'

export function DataStatusBanner({ index }: { index: DataIndex }) {
  const mock = index.mock === true
  const prelim = index.eleicoes.filter((e) => e.status !== 'oficial')
  if (!mock && prelim.length === 0) return null
  return (
    <Notice tone="warn" title={mock ? 'Dados de demonstração (MOCK)' : 'Há eleições com resultado preliminar'}>
      {mock ? (
        <>
          Os números abaixo são sintéticos e servem só para desenvolver a interface. Para dados reais rode{' '}
          <code>uv run sociolibero eleicoes build</code>.
        </>
      ) : (
        <>Resultados preliminares podem mudar até a totalização oficial: {prelim.map((e) => e.rotulo).join('; ')}.</>
      )}
    </Notice>
  )
}

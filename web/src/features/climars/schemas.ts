import { z } from 'zod'

// clima_rs_municipal.json — índice de prioridade preventiva (projeto climate), 497 municípios do RS.
const Txt = z.string().nullish()
const Num = z.number().nullish()
const BasisV = z.enum(['measured', 'modeled', 'synthetic']).nullish()
const Comp = z.looseObject({ valor: Num, basis: BasisV, detalhe: z.record(z.string(), z.unknown()).nullish() })

export const ClimaRsSchema = z.looseObject({
  meta: z.looseObject({
    gerado_em: Txt,
    aviso: Txt,
    ressalvas: z.array(z.string()).nullish(),
    selos: z.record(z.string(), z.string()).nullish(),
    modelo: z.looseObject({ formula: Txt, pesos: z.record(z.string(), z.number()).nullish(), cobertura_minima_peso: Num, regra: Txt }).nullish(),
    fonte: z.looseObject({ projeto: Txt, as_of: Txt, as_of_fonte: Txt, snapshot_capturado_em: Txt }).nullish(),
    contagem_snapshot: z.record(z.string(), z.number()).nullish(),
  }),
  linhas: z.record(
    z.string(),
    z.looseObject({
      nome: z.string(),
      indice: z.looseObject({
        score_atual: Num,
        nivel_atual: Txt,
        score_estrutural: Num,
        basis: BasisV,
        completude: Txt,
        cobertura_peso: Num,
        posicao_ranking_atual: Num,
      }),
      componentes: z.record(z.string(), Comp).nullish(),
      medidos: z.record(z.string(), z.looseObject({ basis: BasisV })).nullish(),
      modelados: z.record(z.string(), z.looseObject({ basis: BasisV })).nullish(),
    }),
  ),
})
export type ClimaRs = z.infer<typeof ClimaRsSchema>
export type ClimaRsRow = ClimaRs['linhas'][string]

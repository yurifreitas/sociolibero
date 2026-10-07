import { z } from 'zod'

// custo_corrupcao.json e clima_valor_financeiro.json. Tolerantes: campo ausente vira estado vazio, nunca erro.
const Txt = z.string().nullish()
const Num = z.number().nullish()
const Faixa = z.array(z.number()).nullish()
const Ref = z.looseObject({ titulo: z.string(), url: Txt, doi: Txt, verificado: z.boolean().nullish() })

export const Valor = z.looseObject({
  descricao: z.string(),
  valor_rs_bi: Num,
  faixa_rs_bi: Faixa,
  periodo: Txt,
  tipo: Txt,
  metodo: Txt,
  fonte: Txt,
  url: Txt,
  verificado: z.boolean().nullish(),
  nota_verificacao: Txt,
})
const Beneficio = z.looseObject({
  id: z.string(),
  tema: z.string(),
  decisao_id: Txt,
  beneficiarios: Txt,
  valor_rs_bi_ano: z.looseObject({ central: Num, faixa: Faixa }).nullish(),
  quem_paga: Txt,
  base: Txt,
  fonte: Txt,
  url: Txt,
  verificado: z.boolean().nullish(),
  nota: Txt,
})
const Evid = z.looseObject({ estudo: z.string(), achado: Txt, url: Txt, doi: Txt, verificado: z.boolean().nullish() })

export const CustoCorrupcaoSchema = z.looseObject({
  meta: z.looseObject({
    gerado_em: Txt,
    aviso: Txt,
    criterio_verificacao: Txt,
    ancora_pib: z.looseObject({ ano: Num, valor_rs_bi: Num, fonte: Txt, url: Txt, verificado: z.boolean().nullish(), nota: Txt }).nullish(),
    resumo: z.record(z.string(), z.number()).nullish(),
    lacunas: z.array(z.string()).nullish(),
    divergencias: z.array(z.string()).nullish(),
  }),
  panorama: z
    .array(
      z.looseObject({
        id: z.string(),
        descricao: z.string(),
        faixa_rs_bi: Faixa,
        pct_pib: Num,
        faixa_pct_pib: Faixa,
        periodo: Txt,
        tipo: Txt,
        metodo: Txt,
        fonte: Txt,
        url: Txt,
        verificado: z.boolean().nullish(),
        critica_metodologica: Txt,
        equivalente_rs_bi_ancora: z.looseObject({ faixa: Faixa, nota: Txt }).nullish(),
      }),
    )
    .nullish(),
  areas: z.array(
    z.looseObject({
      id: z.string(),
      nome: z.string(),
      mecanismo: Txt,
      valores: z.array(Valor),
      efeitos_na_economia: Txt,
      classes_afetadas: z.array(z.string()).nullish(),
      limites: Txt,
      evidencia_empirica: z.array(Evid).nullish(),
      decisoes_relacionadas: z.array(z.string()).nullish(),
    }),
  ),
  beneficios_a_empresas: z.array(Beneficio).nullish(),
  modelos: z
    .array(z.looseObject({ id: z.string(), nome: z.string(), autor: Txt, ano: z.union([z.number(), z.string()]).nullish(), formula: Txt, uso: Txt, aplicacao_brasil: Txt, limites: Txt, referencias: z.array(Ref).nullish() }))
    .nullish(),
  valor_financeiro_decisoes: z
    .record(z.string(), z.looseObject({ rs_bi_ano: Num, primary_target_pp: Num, natureza: Txt, nota: Txt }))
    .nullish(),
  recuperacao_macro: z
    .looseObject({
      suposicao: Txt,
      desvio_referencia: z.looseObject({ pct_pib_central: Num, faixa_pct_pib: Faixa, descricao: Txt, fonte: Txt, url: Txt }).nullish(),
      referencia_2035: z.record(z.string(), z.number()).nullish(),
      cenarios: z.array(z.looseObject({ recuperado_pct: z.number(), primario_pp: z.number(), rs_bi_ano: z.number(), debt_2035_delta: z.number(), selic_2035_delta: z.number() })),
      limites: Txt,
    })
    .nullish(),
  nao_somar: Txt,
})
export type CustoCorrupcao = z.infer<typeof CustoCorrupcaoSchema>
export type Area = CustoCorrupcao['areas'][number]

export const ClimaValorSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt, criterio_verificacao: Txt }).nullish(),
  itens: z.array(
    z.looseObject({
      id: z.string(),
      descricao: z.string(),
      valor_rs_bi: Num,
      faixa_rs_bi: Faixa,
      periodo: Txt,
      tipo: Txt,
      escopo: Txt,
      fonte: Txt,
      url: Txt,
      verificado: z.boolean().nullish(),
      nota: Txt,
    }),
  ),
  relacao_prevencao_resposta: z
    .array(z.looseObject({ id: z.string(), descricao: z.string(), razao: Num, prevencao_rs_bi: Num, resposta_rs_bi: Num, periodo: Txt, escopo: Txt, fonte: Txt, url: Txt, verificado: z.boolean().nullish(), nota: Txt }))
    .nullish(),
  nao_somar: Txt,
})
export type ClimaValor = z.infer<typeof ClimaValorSchema>

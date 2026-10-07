import { z } from 'zod'

// Contrato tolerante: campo ausente vira estado vazio; null nunca vira zero.
const Txt = z.string().nullish()
const Lista = z.array(z.string()).nullish()
const Num = z.union([z.number(), z.string()]).nullish()
const Fonte = z.looseObject({ titulo: Txt, url: Txt, verificado: z.boolean().nullish() })

export const RegrasDeVotoSchema = z.looseObject({
  quem_votava: Txt,
  voto_secreto: z.boolean().nullish(),
  mulheres: z.boolean().nullish(),
  analfabetos: z.boolean().nullish(),
  idade_minima: z.number().nullish(),
  obrigatorio: z.boolean().nullish(),
  regras_verificado: z.boolean().nullish(),
})

const Valor = z.looseObject({
  valor: Num,
  pct: z.number().nullish(),
  pct_populacao: z.number().nullish(),
  tipo: Txt,
  fonte: Txt,
  url: Txt,
  verificado: z.boolean().nullish(),
  nota: Txt,
})

export const ResultadoSchema = z.looseObject({
  candidato: Txt,
  partido: Txt,
  votos: Num,
  pct: z.number().nullish(),
  fonte: Txt,
  url: Txt,
  verificado: z.boolean().nullish(),
  nota: Txt,
})

export const EleicaoSchema = z.looseObject({
  id: z.string(),
  ano: z.number(),
  data: Txt,
  tipo: z.string(),
  cargo: z.string(),
  regime: Txt,
  regras_de_voto: RegrasDeVotoSchema.nullish(),
  eleitorado: Valor.nullish(),
  comparecimento: Valor.nullish(),
  sistema: Txt,
  financiamento: Txt,
  resultados: z.array(ResultadoSchema).nullish(),
  mudancas_de_regra: Lista,
  movimentos_ids: Lista,
  eventos_historia_ids: Lista,
  fontes: z.array(Fonte).nullish(),
  nota: Txt,
})
export type Eleicao = z.infer<typeof EleicaoSchema>

const Passo = z.looseObject({ passo: z.number().nullish(), data: Txt, descricao: z.string(), verificado: z.boolean().nullish(), fonte: Txt, url: Txt })
const Virada = z.looseObject({ data: Txt, fato: z.string(), fonte: Txt, url: Txt, verificado: z.boolean().nullish() })

export const MovimentoSchema = z.looseObject({
  id: z.string(),
  nome: z.string(),
  periodo: Txt,
  espectro: Txt,
  origem: Txt,
  pautas: Lista,
  base_social: Txt,
  organizacao: Lista,
  midia_e_tecnologia: Lista,
  financiamento_e_regras: Txt,
  aliancas_e_rupturas: Lista,
  viradas: z.array(Virada).nullish(),
  como_se_construiu: z.array(Passo).nullish(),
  resultado_eleitoral: z
    .array(z.looseObject({ eleicao_id: Txt, desempenho: Txt, fonte: Txt, url: Txt, verificado: z.boolean().nullish() }))
    .nullish(),
  declinio_ou_transformacao: Txt,
  controversias: Txt,
  eleicoes_ids: Lista,
  fontes: z.array(Fonte).nullish(),
})
export type Movimento = z.infer<typeof MovimentoSchema>

export const RevisaoSchema = z.looseObject({
  id: z.string(),
  data: Txt,
  campo: Txt,
  antes: z.unknown().nullish(),
  depois: z.unknown().nullish(),
  motivo: Txt,
  fonte: z.looseObject({ titulo: Txt, url: Txt }).nullish(),
  verificado: z.boolean().nullish(),
})
export type Revisao = z.infer<typeof RevisaoSchema>

export const RegraTempoSchema = z.looseObject({
  ano: z.number(),
  regra: z.string(),
  efeito_no_eleitorado: Txt,
  fonte: Txt,
  url: Txt,
  verificado: z.boolean().nullish(),
})
export type RegraTempo = z.infer<typeof RegraTempoSchema>

export const EleicoesTimelineSchema = z.looseObject({
  meta: z
    .looseObject({ gerado_em: Txt, aviso: Txt, criterio_verificacao: Txt, revisado_em: Txt, revisao: z.array(RevisaoSchema).nullish() })
    .nullish(),
  eleicoes: z.array(EleicaoSchema),
  movimentos: z.array(MovimentoSchema),
  regras_ao_longo_do_tempo: z.array(RegraTempoSchema).nullish(),
  limites: z.array(z.string()).nullish(),
})
export type EleicoesTimeline = z.infer<typeof EleicoesTimelineSchema>

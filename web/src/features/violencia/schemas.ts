import { z } from 'zod'

const Txt = z.string().nullish()
const Lista = z.array(z.string()).nullish()
const Ano = z.union([z.number(), z.string()]).nullish()

export const ViolenciaSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt, criterio_verificacao: Txt }).nullish(),
  pensadores: z.array(
    z.looseObject({
      id: z.string(),
      nome: z.string(),
      tradicao: Txt,
      obra_chave: z.array(z.looseObject({ titulo: z.string(), ano: Ano, url: Txt, doi: Txt, verificado: z.boolean().nullish() })).nullish(),
      ideia_central: Txt,
      conceitos: Lista,
      explica_no_brasil: Txt,
      evidencias: z.array(z.looseObject({ descricao: z.string(), fonte: Txt, url: Txt, verificado: z.boolean().nullish() })).nullish(),
      criticas: Txt,
      ligacoes: z.looseObject({ pilares: Lista, decisoes: Lista, indicadores: Lista, aneis: Lista }).nullish(),
    }),
  ),
  tipologia: z
    .array(
      z.looseObject({
        id: z.string(),
        tipo: z.string(),
        definicao: Txt,
        pensadores: Lista,
        exemplos_brasil: z.array(z.looseObject({ descricao: z.string(), valor: z.union([z.string(), z.number()]).nullish(), fonte: Txt, verificado: z.boolean().nullish() })).nullish(),
        como_medir: Txt,
        limites: Txt,
      }),
    )
    .nullish(),
  dialogos: z.array(z.looseObject({ entre: z.array(z.string()), tema: z.string(), convergencia: Txt, divergencia: Txt })).nullish(),
  dados_do_repositorio: z
    .array(z.looseObject({ indicador_id: z.string(), valor: z.union([z.number(), z.string()]).nullish(), ano: Ano, fonte_arquivo: Txt, nota: Txt }))
    .nullish(),
  custo_economico: z
    .array(
      z.looseObject({
        descricao: z.string(),
        valor_rs_bi: z.number().nullish(),
        periodo: Txt,
        tipo: Txt,
        metodo: Txt,
        fonte: Txt,
        url: Txt,
        verificado: z.boolean().nullish(),
        ressalva: Txt,
      }),
    )
    .nullish(),
  perguntas_abertas: Lista,
  limites: Lista,
})
export type Violencia = z.infer<typeof ViolenciaSchema>
export type PensadorV = Violencia['pensadores'][number]

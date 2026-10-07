import { z } from 'zod'

// Contrato tolerante (looseObject + nullish): campo ausente vira estado vazio, nunca erro de tela.
const Txt = z.string().nullish()
const Lista = z.array(z.string()).nullish()
const Lig = z.looseObject({ decisoes: Lista, pilares: Lista, aneis: Lista }).nullish()

export const MarxTextoSchema = z.looseObject({
  id: z.string(),
  autor: Txt,
  obra: z.string(),
  ano: z.union([z.number(), z.string()]).nullish(),
  secao: Txt,
  idioma_original: Txt,
  idioma_do_trecho: Txt,
  trecho_original: z.string(),
  traducao_pt: Txt,
  fonte_da_traducao: Txt,
  url: Txt,
  verificado_literal: z.boolean().nullish(),
  tema: Txt,
  leitura_curta: Txt,
  nota_de_fonte: Txt,
})
export type MarxTexto = z.infer<typeof MarxTextoSchema>

export const MarxSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt, criterio_verificacao: Txt }).nullish(),
  textos: z.array(MarxTextoSchema),
  definicoes: z
    .array(z.looseObject({ termo: z.string(), definicao_marxiana: Txt, uso_corrente: Txt, confusoes: Txt, textos: Lista }))
    .nullish(),
  teses: z
    .array(
      z.looseObject({
        id: z.string(),
        titulo: z.string(),
        enunciado: Txt,
        premissas: Lista,
        textos_de_apoio: Lista,
        autores: Lista,
        leituras_rivais: Lista,
        objecoes: Lista,
        respostas: Lista,
        evidencia: Txt,
        qualidade_da_evidencia: Txt,
        como_seria_refutada: Txt,
        ligacoes: Lig,
      }),
    )
    .nullish(),
  contra_argumentos: z
    .array(z.looseObject({ id: z.string(), contra_tese: z.string(), autores: Lista, argumento: Txt, limites: Txt, textos: Lista }))
    .nullish(),
  mal_entendidos: z
    .array(z.looseObject({ id: z.string(), equivoco: z.string(), o_que_o_texto_diz: Txt, textos: Lista, origem_da_confusao: Txt }))
    .nullish(),
  pensadores: z
    .array(
      z.looseObject({
        id: z.string(),
        nome: z.string(),
        obra_chave: z.array(z.looseObject({ titulo: z.string(), ano: z.union([z.number(), z.string()]).nullish(), url: Txt, verificado: z.boolean().nullish() })).nullish(),
        posicao: Txt,
        relacao_com_marx: Txt,
        id_no_projeto_pilares_pensamento: Txt,
      }),
    )
    .nullish(),
  o_que_muda_no_projeto: z.array(z.looseObject({ principio: z.string(), traducao_institucional: Txt, ligacoes: Lig })).nullish(),
  sintese: Txt,
  limites: Lista,
})
export type Marx = z.infer<typeof MarxSchema>

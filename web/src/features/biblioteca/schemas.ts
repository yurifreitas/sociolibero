import { z } from 'zod'

// Contrato tolerante (looseObject + nullish): campo ausente vira estado vazio, nunca erro de tela.
const Txt = z.string().nullish()
const Lista = z.array(z.string()).nullish()

export const TrechoSchema = z.looseObject({
  id: z.string(),
  rotulo: z.string(),
  ancora: z.string(),
  por_que_importa: Txt,
  tema: Txt,
  eleicoes_ids: Lista,
  movimentos_ids: Lista,
  historia_ids: Lista,
  indigenas_ids: Lista,
})
export type Trecho = z.infer<typeof TrechoSchema>

export const DocSchema = z.looseObject({
  id: z.string(),
  titulo: z.string(),
  data: Txt,
  ano: z.number().nullish(),
  tipo: Txt,
  subtipo: Txt,
  autoridade: Txt,
  status: Txt,
  arquivo: Txt,
  texto_disponivel: z.boolean().nullish(),
  origem: z
    .looseObject({ url: Txt, espelho: Txt, tipo_de_fonte: Txt, data_captura: Txt, sha256: Txt, sha256_arquivo: Txt })
    .nullish(),
  tipo_de_versao: Txt,
  n_caracteres: z.number().nullish(),
  trechos_chave: z.array(TrechoSchema).nullish(),
  conferencia: z
    .looseObject({ status: Txt, conferido_contra: Lista, observacoes: Txt, lacunas: z.union([z.string(), z.array(z.string())]).nullish() })
    .nullish(),
  dominio_publico: z.boolean().nullish(),
  base_legal_dominio_publico: Txt,
  texto_vigente_url: Txt,
  motivo_sem_texto: Txt,
  links: z.array(z.looseObject({ rotulo: z.string(), url: z.string(), aberto: z.boolean().nullish() })).nullish(),
  resultado_votacao: z.unknown().nullish(),
  eleicoes_ids: Lista,
  movimentos_ids: Lista,
  historia_ids: Lista,
})
export type Doc = z.infer<typeof DocSchema>

export const TextosIndexSchema = z.looseObject({
  meta: z
    .looseObject({
      titulo: Txt,
      gerado_em: Txt,
      descricao: Txt,
      como_verificar_hash: Txt,
      n_textos: z.number().nullish(),
      n_sem_texto: z.number().nullish(),
      n_caracteres_total: z.number().nullish(),
    })
    .nullish(),
  documentos: z.array(DocSchema),
  sem_texto_integral: z.array(DocSchema).nullish(),
})
export type TextosIndex = z.infer<typeof TextosIndexSchema>

import { z } from 'zod'

const Txt = z.string().nullish()
const Lista = z.array(z.string()).nullish()
const Num = z.union([z.number(), z.string()]).nullish()

export const ClasseSchema = z.looseObject({
  id: z.string(),
  nome: z.string(),
  periodos: Lista,
  base_material: Txt,
  interesses: z.looseObject({ voto: Txt, sistema: Txt, financiamento: Txt, terra: Txt, estado: Txt }).nullish(),
  status_interesses: Txt,
  leitura_contraria: Txt,
  aliados: Lista,
  ganhou_perdeu: z
    .array(z.looseObject({ regra: Txt, efeito: Txt, evidencia: Txt, fonte: Txt, url: Txt, verificado: z.boolean().nullish() }))
    .nullish(),
  movimentos_ids: Lista,
  fontes: z.array(z.union([z.string(), z.looseObject({ titulo: Txt, url: Txt })])).nullish(),
})
export type Classe = z.infer<typeof ClasseSchema>

export const TeoriaSchema = z.looseObject({
  id: z.string(),
  autor: Txt,
  ano: Num,
  ideia: Txt,
  aplicacao_brasil: Txt,
  leitura_contraria: Txt,
  verificado: z.boolean().nullish(),
  fontes: z.array(z.union([z.string(), z.looseObject({ titulo: Txt, url: Txt })])).nullish(),
})
export type Teoria = z.infer<typeof TeoriaSchema>

export const CelulaSchema = z.looseObject({ regra: z.string(), classe_id: z.string(), ganha_ou_perde: z.string(), nota: Txt })
export type Celula = z.infer<typeof CelulaSchema>

export const PessimaSchema = z.looseObject({
  id: z.string(),
  ano: z.number().nullish(),
  titulo: z.string(),
  mecanismo_do_dano: Txt,
  custo_ou_efeito: z
    .looseObject({ valor: Num, tipo: Txt, fonte: Txt, url: Txt, verificado: z.boolean().nullish(), nota: Txt })
    .nullish(),
  quem_pagou: Txt,
  leitura_contraria: Txt,
  eleicoes_ids: Lista,
  historia_ids: Lista,
  fontes: z.array(z.string()).nullish(),
})
export type Pessima = z.infer<typeof PessimaSchema>

export const FuturoSchema = z.looseObject({
  id: z.string(),
  proposta: z.string(),
  status: Txt,
  quem_ganha_perde: Txt,
  evidencia_comparada: Txt,
  riscos: Txt,
  sinais_precoces: Lista,
  aneis_ids: Lista,
  decisoes_ids: Lista,
  propostas_ids: Lista,
  mecanismo_na_cadeia: Txt,
  nota_decisoes: Txt,
  fontes: z.array(z.string()).nullish(),
})
export type FuturoItem = z.infer<typeof FuturoSchema>

export const ClassesSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt, criterio_verificacao: Txt }).nullish(),
  classes: z.array(ClasseSchema),
  teorias: z.array(TeoriaSchema).nullish(),
  matriz_regra_x_classe: z.array(CelulaSchema).nullish(),
  pessimas_decisoes: z.array(PessimaSchema).nullish(),
  futuro: z.array(FuturoSchema).nullish(),
  limites: z.array(z.string()).nullish(),
})
export type Classes = z.infer<typeof ClassesSchema>

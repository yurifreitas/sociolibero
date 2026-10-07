import { z } from 'zod'

export const STATUSES = ['oficial', 'preliminar', 'derivado', 'julgamento', 'parcial', 'nao-verificado', 'em-preparacao'] as const
export type BaseStatus = (typeof STATUSES)[number]

const Link = z.looseObject({ titulo: z.string(), url: z.string().nullish(), verificado: z.boolean().nullish(), n: z.number().nullish() })

export const BaseSchema = z.looseObject({
  id: z.string(),
  nome: z.string(),
  chip: z.looseObject({ rotulo: z.string(), detalhe: z.string() }),
  status: z.enum(STATUSES),
  status_rotulo: z.string(),
  tipo: z.string(),
  fonte: z.looseObject({ nome: z.string(), url: z.string().nullish() }).nullish(),
  extraido_em: z.string().nullish(),
  hashes: z.array(z.looseObject({ rotulo: z.string(), sha256: z.string(), curto: z.string().nullish() })),
  cobertura: z.string(),
  validacoes: z.array(z.looseObject({ ok: z.boolean().nullable(), texto: z.string() })),
  limites: z.array(z.string()),
  links: z.array(Link),
  arquivos: z.array(z.string()),
  paginas: z.array(z.string()),
  nota: z.string().nullish(),
})
export type Base = z.infer<typeof BaseSchema>

export const BasesSchema = z.looseObject({
  gerado_em: z.string(),
  resumo: z.looseObject({ total: z.number(), por_status: z.record(z.string(), z.number()), atencao: z.number() }),
  paginas: z.record(z.string(), z.array(z.string())),
  bases: z.array(BaseSchema),
})
export type BasesDoc = z.infer<typeof BasesSchema>

export const PropostaSchema = z.looseObject({
  id: z.string(),
  titulo: z.string(),
  area: z.string(),
  status: z.string(),
  resumo: z.string(),
  precisa: z.array(z.string()).nullish(),
  risco: z.string().nullish(),
  origem: z.string().nullish(),
})
export type Proposta = z.infer<typeof PropostaSchema>
export const PropostasSchema = z.looseObject({
  meta: z.looseObject({ aviso: z.string().nullish(), origem: z.array(z.string()).nullish() }).nullish(),
  propostas: z.array(PropostaSchema),
})
export type Propostas = z.infer<typeof PropostasSchema>

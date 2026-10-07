import { z } from 'zod'

// aneis.json — diagramas de laços causais. Tolerante: campo ausente = estado vazio.
const Txt = z.string().nullish()
const Ev = z.looseObject({ ref: z.string(), url: Txt, verificado: z.boolean().nullish() })
const No = z.looseObject({ id: z.string(), rotulo: z.string(), dominio: Txt })
const Aresta = z.looseObject({
  de: z.string(),
  para: z.string(),
  sinal: z.string(),
  defasagem: Txt,
  forca: Txt,
  evidencia: z.array(Ev).nullish(),
  contestada: z.boolean().nullish(),
  nota: Txt,
  ramal: z.boolean().nullish(),
})
const Ids = z.array(z.string()).nullish()
const Anel = z.looseObject({
  id: z.string(),
  nome: z.string(),
  tipo: z.string(),
  descricao: Txt,
  nos: z.array(No),
  arestas: z.array(Aresta),
  simulado_no_modelo: z.looseObject({ sim: z.boolean().nullish(), onde: Txt, equacao: Txt }).nullish(),
  decisoes: Ids,
  potencias: Ids,
  tendencias: Ids,
  leis: Ids,
  pilares: Ids,
  alavancas: z.array(z.string()).nullish(),
  evolucao_se_dominar: z.looseObject({ virtuosa: Txt, viciosa: Txt }).nullish(),
  enfraquece: z.array(z.string()).nullish(),
  notas: z.union([z.string(), z.array(z.string())]).nullish(),
})
export const AneisSchema = z.looseObject({
  meta: z
    .looseObject({
      gerado_em: Txt,
      aviso: Txt,
      como_ler: Txt,
      criterio: Txt,
      contagens: z.record(z.string(), z.number()).nullish(),
    })
    .nullish(),
  aneis: z.array(Anel),
  interacoes: z.array(z.looseObject({ de: z.string(), para: z.string(), tipo: z.string(), descricao: Txt })).nullish(),
  aneis_ausentes: z.array(z.looseObject({ id: z.string(), descricao: Txt })).nullish(),
  arestas_contestadas: z.array(z.looseObject({ anel: z.string(), de: z.string(), para: z.string(), nota: Txt })).nullish(),
  referencias: z.array(z.looseObject({ titulo: z.string(), url: Txt, doi: Txt, verificado: z.boolean().nullish() })).nullish(),
})
export type Aneis = z.infer<typeof AneisSchema>
export type Anel = z.infer<typeof Anel>
export type Aresta = z.infer<typeof Aresta>

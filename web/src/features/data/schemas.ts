import { z } from 'zod'

// Contrato: docs/DATA_CONTRACT.md. looseObject tolera campos extras que o pipeline venha a acrescentar.

export const IndexSchema = z.looseObject({
  gerado_em: z.string(),
  mock: z.boolean().optional(),
  geo: z.string(),
  eleicoes: z.array(
    z.looseObject({
      id: z.string(),
      rotulo: z.string(),
      ano: z.number(),
      turno: z.number(),
      cargo: z.string(),
      status: z.string(),
      municipios: z.number(),
    }),
  ),
  forense: z.array(z.string()),
  validacao_sintetica: z.string().nullish(),
  referencias: z.string().nullish(),
  decisoes: z.string().nullish(),
  exposicao: z.string().nullish(),
  historia: z.string().nullish(),
  territorios: z.string().nullish(),
})
export type DataIndex = z.infer<typeof IndexSchema>
export type ElectionEntry = DataIndex['eleicoes'][number]

export const GeoSchema = z.looseObject({
  type: z.literal('FeatureCollection'),
  features: z.array(
    z.looseObject({
      properties: z.looseObject({ ibge: z.string(), nome: z.string(), uf: z.string() }),
      geometry: z.looseObject({ type: z.enum(['Polygon', 'MultiPolygon']), coordinates: z.array(z.any()) }),
    }),
  ),
})
export type GeoCollection = z.infer<typeof GeoSchema>

const VotesRow = z.looseObject({
  aptos: z.number(),
  comparecimento: z.number(),
  validos: z.number(),
  brancos: z.number(),
  nulos: z.number(),
  votos: z.record(z.string(), z.number()),
})
export type ElectionRow = z.infer<typeof VotesRow>

export const ElectionSchema = z.looseObject({
  meta: z.looseObject({
    id: z.string(),
    rotulo: z.string(),
    ano: z.number(),
    turno: z.number(),
    cargo: z.string(),
    status: z.string(),
    mock: z.boolean().optional(),
    fonte: z.string(),
    baixado_em: z.string(),
    sha256: z.string(),
    candidatos: z.array(z.looseObject({ numero: z.number(), nome: z.string(), partido: z.string() })),
    sem_correspondencia: z.array(z.any()).nullish(),
  }),
  linhas: z.record(z.string(), VotesRow),
})
export type Election = z.infer<typeof ElectionSchema>
export type ElectionMeta = Election['meta']

const Digits = z.looseObject({
  digitos: z.array(z.number()),
  observado: z.array(z.number()),
  esperado: z.array(z.number()),
  p: z.number().nullish(),
  n: z.number().nullish(),
})
const Num = z.number().nullish()

export const ForensicsSchema = z.looseObject({
  meta: z.looseObject({
    id: z.string(),
    mock: z.boolean().optional(),
    testes: z.array(
      z.looseObject({
        chave: z.string(),
        rotulo: z.string(),
        descricao: z.string().nullish(),
        interpretacao: z.string().nullish(),
        limitacoes: z.string().nullish(),
      }),
    ),
    aviso: z.string().nullish(),
    score: z.string().nullish(),
  }),
  nacional: z
    .looseObject({
      fingerprint: z
        .looseObject({
          x_bins: z.array(z.number()),
          y_bins: z.array(z.number()),
          contagem: z.array(z.array(z.number())),
        })
        .nullish(),
      benford_2bl: Digits.nullish(),
      ultimo_digito: Digits.nullish(),
      calibracao: z
        .looseObject({
          municipios_ld_p_menor_0_05: z.number().nullish(),
          municipios_b2_p_menor_0_05: z.number().nullish(),
          municipios_com_flag: z.number().nullish(),
          persistencia: z
            .record(
              z.string(),
              z.looseObject({ flags_a: z.number(), flags_b: z.number(), em_ambos: z.number(), p_b_dado_a: z.number().nullable(), base_b: z.number().nullable() }),
            )
            .nullish(),
        })
        .nullish(),
    })
    .nullish(),
  linhas: z.record(
    z.string(),
    z.looseObject({
      n_secoes: z.number(),
      zt: Num,
      zs: z.record(z.string(), z.number().nullable()).nullish(),
      zn: Num,
      ld_p: Num,
      b2_p: Num,
      bunching: Num,
      score: z.number(),
      confianca: z.string(),
      flags: z.array(z.string()),
    }),
  ),
})
export type Forensics = z.infer<typeof ForensicsSchema>
export type ForensicRow = Forensics['linhas'][string]
export type ForensicTest = Forensics['meta']['testes'][number]

export const ValidationSchema = z.looseObject({
  mock: z.boolean().optional(),
  nota: z.string().nullish(),
  parametros: z.record(z.string(), z.any()).nullish(),
  cenarios: z.array(
    z.looseObject({
      nome: z.string(),
      descricao: z.string().nullish(),
      intensidade: z.array(z.number()),
      detectores: z.record(z.string(), z.looseObject({ tpr: z.array(z.number()), fpr: z.number() })),
    }),
  ),
})
export type Validation = z.infer<typeof ValidationSchema>

const Reference = z.looseObject({
  id: z.string(),
  categoria: z.string(),
  titulo: z.string(),
  autores: z.union([z.string(), z.array(z.string())]).nullish(),
  ano: z.union([z.number(), z.string()]).nullish(),
  url: z.string().nullish(),
  doi: z.string().nullish(),
  o_que_aproveitar: z.string().nullish(),
  verificado: z.boolean().nullish(),
})
export const ReferencesSchema = z
  .union([z.array(Reference), z.looseObject({ referencias: z.array(Reference) })])
  .transform((v) => (Array.isArray(v) ? v : v.referencias))
export type Reference = z.infer<typeof Reference>

export const DOMINIOS = ['fiscal', 'monetário', 'tributário', 'institucional', 'social', 'setorial', 'externo'] as const
const Impacto = z.looseObject({ debt: z.number(), selic: z.number(), ipca: z.number(), gdp: z.number() })
export const DecisaoSchema = z.looseObject({
  id: z.string(),
  rotulo: z.string(),
  dominio: z.string(),
  instrumento: z.string(),
  ideologia: z.number(),
  controversia: z.number(),
  deltas: z.record(z.string(), z.number()).nullish(),
  racional: z.string(),
  ganhadores: z.array(z.string()),
  perdedores: z.array(z.string()),
  defasagem_anos: z.number(),
  reversibilidade: z.string(),
  base_evidencia: z.string(),
  iniciativa_congresso: z.boolean().nullish(),
  p_aprovacao: z.looseObject({ direita: z.number(), esquerda: z.number() }),
  impacto_2035: Impacto,
})
export type Decisao = z.infer<typeof DecisaoSchema>

export const DecisoesSchema = z.looseObject({
  meta: z.looseObject({
    baseline: z.string(),
    referencia_2035: Impacto,
    composicao: z.looseObject({
      camara: z.record(z.string(), z.number()),
      senado: z.record(z.string(), z.number()),
    }),
    quoruns: z.record(z.string(), z.looseObject({ camara: z.number().nullable(), senado: z.number().nullable() })),
    aviso: z.string(),
  }),
  decisoes: z.array(DecisaoSchema),
})
export type Decisoes = z.infer<typeof DecisoesSchema>

export const ExposicaoSchema = z.looseObject({
  linhas: z.record(
    z.string(),
    z.looseObject({ agro: z.number(), industria: z.number(), servicos: z.number(), adm_publica: z.number() }),
  ),
})
export type Exposicao = z.infer<typeof ExposicaoSchema>
export type SetorKey = 'agro' | 'industria' | 'servicos' | 'adm_publica'

// ---- História (docs: formato definido pelo coordenador; campos livres tolerados) ----
const Text = z.string().nullish()
const TextOrList = z.union([z.string(), z.array(z.string()), z.record(z.string(), z.string())]).nullish()
const Fonte = z.looseObject({ titulo: z.string(), url: z.string().nullish(), verificado: z.boolean().nullish() })
const Year = z.union([z.number(), z.string()])

export const HistoriaSchema = z.looseObject({
  meta: z.looseObject({ mock: z.boolean().optional(), aviso: Text, gerado_em: Text }).nullish(),
  periodos: z.array(
    z.looseObject({
      id: z.string(),
      rotulo: z.string(),
      inicio: Year,
      fim: Year.nullish(),
      regime: z.string(),
      descricao: Text,
      poderes: z.looseObject({ executivo: Text, legislativo: Text, judiciario: Text }).nullish(),
      constituicao: Text,
    }),
  ),
  eventos: z.array(
    z.looseObject({
      id: z.string(),
      data: z.union([z.string(), z.number()]),
      periodo: z.string().nullish(),
      categoria: z.string(),
      trilha: z.string().nullish(),
      trilhas: z.array(z.string()).nullish(),
      cruza: z.array(z.string()).nullish(),
      titulo: z.string(),
      resumo: Text,
      impacto_poderes: TextOrList,
      controversias: TextOrList,
      fontes: z.array(Fonte).nullish(),
    }),
  ),
  principios: z
    .array(z.looseObject({ id: z.string(), titulo: z.string(), autor: Text, ano: Year.nullish(), ideia: Text, aplicacao_brasil: Text, fontes: z.array(Fonte).nullish() }))
    .nullish(),
  direcoes: z
    .array(z.looseObject({ id: z.string(), titulo: z.string(), descricao: Text, evidencias: TextOrList, fontes: z.array(Fonte).nullish() }))
    .nullish(),
})
export type Historia = z.infer<typeof HistoriaSchema>
export type Periodo = Historia['periodos'][number]
export type Evento = Historia['eventos'][number]
export type Fonte = z.infer<typeof Fonte>

// ---- Territórios (indígenas/quilombolas); null = sem dado, nunca zero ----
const N = z.number().nullish()
export const TerritoriosSchema = z.looseObject({
  meta: z
    .looseObject({
      mock: z.boolean().optional(),
      fontes: z.union([z.string(), z.array(z.union([z.string(), z.looseObject({ titulo: z.string().nullish(), url: z.string().nullish() })]))]).nullish(),
      aviso: z.string().nullish(),
      lacunas: z.union([z.string(), z.array(z.string())]).nullish(),
    })
    .nullish(),
  linhas: z.record(
    z.string(),
    z.looseObject({
      pop_total: N,
      pop_indigena: N,
      pop_quilombola: N,
      pct_indigena: N,
      pct_quilombola: N,
      pct_pretos_pardos: N,
      ti_n: N,
      ti_area_ha: N,
      quilombo_n: N,
      quilombo_area_ha: N,
    }),
  ),
})
export type Territorios = z.infer<typeof TerritoriosSchema>
export type TerritorioRow = Territorios['linhas'][string]

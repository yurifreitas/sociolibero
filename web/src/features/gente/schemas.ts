import { z } from 'zod'

// Contratos: docs/DATA_CONTRACT.md + formatos dos agentes de pesquisa. looseObject tolera campos extras.
const Fonte = z.looseObject({ titulo: z.string(), url: z.string().nullish(), verificado: z.boolean().nullish() })
const Txt = z.string().nullish()
const Lista = z.array(z.string()).nullish()

export const EconomiaHistoricaSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt, criterio_verificacao: Txt }).nullish(),
  ciclos: z.array(
    z.looseObject({
      id: z.string(),
      rotulo: z.string(),
      inicio: z.number(),
      fim: z.number(),
      motor_economico: Txt,
      potenciais: Lista,
      problemas: Lista,
      classes: z
        .array(z.looseObject({ classe: z.string(), posicao: Txt, efeito: Txt, evidencia: Txt }))
        .nullish(),
      mudancas_drasticas: z
        .array(
          z.looseObject({
            id: z.string(),
            data: z.union([z.string(), z.number()]).nullish(),
            titulo: z.string(),
            descricao: Txt,
            quem_ganhou: Txt,
            quem_perdeu: Txt,
            links_historia: z.array(z.string()).nullish(),
          }),
        )
        .nullish(),
      regioes: Lista,
      fontes: z.array(Fonte).nullish(),
    }),
  ),
  classes: z
    .array(
      z.looseObject({
        id: z.string(),
        rotulo: z.string(),
        descricao: Txt,
        trajetoria: z.array(z.looseObject({ ciclo: z.string(), situacao: Txt })).nullish(),
      }),
    )
    .nullish(),
})
export type EconomiaHistorica = z.infer<typeof EconomiaHistoricaSchema>
export type Ciclo = EconomiaHistorica['ciclos'][number]

export const FatorHumanoSchema = z.looseObject({
  meta: z
    .looseObject({
      aviso: Txt,
      criterio: Txt,
      reconciliacao: z.looseObject({ data: Txt, resumo: Txt, defeito_encontrado_no_projeto_irmao: Txt }).nullish(),
    })
    .nullish(),
  indicadores: z.array(
    z.looseObject({
      id: z.string(),
      ciclo: z.string(),
      categoria: z.string(),
      titulo: z.string(),
      valor: z.number().nullish(),
      unidade: Txt,
      periodo: Txt,
      tipo: z.string(),
      intervalo: z.array(z.number()).nullish(),
      metodo: Txt,
      nao_mede: Txt,
      fontes: z.array(Fonte).nullish(),
      verificado: z.boolean().nullish(),
      corroboracao: z.array(z.looseObject({ fonte: Txt, resultado: z.string(), detalhe: Txt })).nullish(),
    }),
  ),
  perguntas_abertas: Lista,
})
export type FatorHumano = z.infer<typeof FatorHumanoSchema>
export type Indicador = FatorHumano['indicadores'][number]

export const SeriesSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt, lacunas: z.array(z.union([z.string(), z.looseObject({ serie: Txt, motivo: Txt })])).nullish() }).nullish(),
  ciclos: z.array(z.looseObject({ id: z.string(), inicio: z.number(), fim: z.number() })).nullish(),
  series: z.array(
    z.looseObject({
      id: z.string(),
      rotulo: z.string(),
      unidade: Txt,
      cobertura: z.array(z.number()).nullish(),
      fonte: z.looseObject({ nome: Txt, url: Txt, baixado_em: Txt, sha256: Txt, codigo_serie: Txt }).nullish(),
      qualidade: Txt,
      quebras: z.array(z.looseObject({ ano: z.number(), motivo: Txt })).nullish(),
      notas: Txt,
      pontos: z.array(z.tuple([z.number(), z.number()])),
    }),
  ),
})
export type SeriesDoc = z.infer<typeof SeriesSchema>
export type Serie = SeriesDoc['series'][number]

export const HumanoNacionalSchema = z.looseObject({
  meta: z.looseObject({ aviso: Txt }).nullish(),
  anos: z.array(z.number()),
  series: z.record(z.string(), z.looseObject({ brasil: z.record(z.string(), z.number().nullable()).nullish() })),
})
export type HumanoNacional = z.infer<typeof HumanoNacionalSchema>

/** Linhas são grandes (14 MB): validação rasa de propósito; acesso defensivo no uso. */
export const HumanoMunicipalSchema = z.looseObject({
  meta: z.looseObject({ aviso: Txt, lacunas: Lista }).nullish(),
  anos: z.array(z.number()),
  linhas: z.record(z.string(), z.record(z.string(), z.record(z.string(), z.number().nullable()))),
})
export type HumanoMunicipal = z.infer<typeof HumanoMunicipalSchema>

export const CruzamentoSchema = z.looseObject({
  meta: z.looseObject({ aviso: Txt }).nullish(),
  correlacoes: z.record(
    z.string(),
    z.record(
      z.string(),
      z.looseObject({ n_municipios: z.number(), corr_bruta: z.number(), corr_dentro_uf: z.number(), ic95_dentro_uf: z.array(z.number()) }),
    ),
  ),
})
export type Cruzamento = z.infer<typeof CruzamentoSchema>

import { z } from 'zod'

// Contratos tolerantes (looseObject + nullish): campo ausente vira estado vazio, nunca erro de tela.
const Txt = z.string().nullish()
const TxtOrList = z.union([z.string(), z.array(z.string())]).nullish()
const FonteObj = z.looseObject({ titulo: z.string(), url: Txt, verificado: z.boolean().nullish(), doi: Txt })
export type FonteT = z.infer<typeof FonteObj>
// Divergência de contrato: alguns arquivos trazem `fontes` como lista de textos. Texto vira {titulo} (e url, se for um link).
export const Fonte = z.union([
  FonteObj,
  z.string().transform((t): FonteT => ({ titulo: t, url: /^https?:\/\//.test(t.trim()) ? t.trim() : null, verificado: null })),
])
const Fontes = z.array(Fonte).nullish()

// ------------------------------------------------------------------ antes_de_1500.json
export const AntesSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt, criterio_verificacao: Txt }).nullish(),
  periodos: z.array(
    z.looseObject({
      id: z.string(),
      rotulo: z.string(),
      inicio_ap: z.number(),
      fim_ap: z.number(),
      clima: Txt,
      povos: Txt,
      economia_e_manejo: Txt,
      evidencias: z.array(z.string()).nullish(),
      controversias: z.array(z.string()).nullish(),
      fontes: Fontes,
    }),
  ),
  eventos: z.array(
    z.looseObject({
      id: z.string(),
      data_ap: z.union([z.string(), z.number()]).nullish(),
      data_calendario: Txt,
      periodo: z.string(),
      titulo: z.string(),
      resumo: Txt,
      evidencia: Txt,
      incerteza: Txt,
      fontes: Fontes,
    }),
  ),
  clima_eventos: z
    .array(
      z.looseObject({
        id: z.string(),
        inicio_ap: z.number(),
        fim_ap: z.number(),
        titulo: z.string(),
        descricao: Txt,
        regiao: Txt,
        evidencia: Txt,
        incerteza: Txt,
        fontes: Fontes,
      }),
    )
    .nullish(),
  povos_e_origens: z
    .array(
      z.looseObject({
        id: z.string(),
        grupo: z.string(),
        origem: Txt,
        periodo_chegada: Txt,
        numero_estimado: z
          .looseObject({ valor: z.union([z.number(), z.string()]).nullish(), faixa: Txt, tipo: Txt, fonte: Txt, verificado: z.boolean().nullish() })
          .nullish(),
        regioes: z.array(z.string()).nullish(),
        contribuicao_historica: Txt,
        fontes: Fontes,
      }),
    )
    .nullish(),
  diversidade_hoje: z.record(z.string(), z.any()).nullish(),
  perguntas_abertas: z.array(z.string()).nullish(),
})
export type Antes = z.infer<typeof AntesSchema>

// ------------------------------------------------------------------ clima.json
const Ponto = z.tuple([z.union([z.string(), z.number()]), z.number().nullable()])
export const ClimaSerieSchema = z.looseObject({
  id: z.string(),
  rotulo: z.string(),
  unidade: Txt,
  cobertura: z.array(z.union([z.string(), z.number()])).nullish(),
  fonte: z.looseObject({ nome: Txt, url: Txt, sha256: Txt }).nullish(),
  qualidade: Txt,
  pontos: z.array(Ponto),
  notas: Txt,
})
export type ClimaSerie = z.infer<typeof ClimaSerieSchema>

export const ClimaSchema = z.looseObject({
  meta: z
    .looseObject({
      gerado_em: Txt,
      aviso: Txt,
      lacunas: z.array(z.any()).nullish(),
      resumo_testes: z
        .looseObject({
          testes_publicados: z.number().nullish(),
          ic95_exclui_zero: z.number().nullish(),
          ids_ic95_exclui_zero: z.array(z.string()).nullish(),
          esperado_por_acaso_se_nenhuma_relacao_real: z.number().nullish(),
          leitura: Txt,
        })
        .nullish(),
      validacao: z.record(z.string(), z.any()).nullish(),
    })
    .nullish(),
  series: z.array(ClimaSerieSchema),
  relacoes: z
    .array(
      z.looseObject({
        id: z.string(),
        clima: z.string(),
        economia: z.string(),
        periodo: z.array(z.number()).nullish(),
        defasagem: Txt,
        estatistica: z
          .looseObject({ metodo: Txt, valor: z.number().nullish(), ic95: z.array(z.number()).nullish(), n: z.number().nullish(), spearman: z.number().nullish() })
          .nullish(),
        leitura: Txt,
        limites: Txt,
      }),
    )
    .nullish(),
  episodios: z
    .array(
      z.looseObject({
        id: z.string(),
        ano: z.union([z.string(), z.number()]).nullish(),
        titulo: z.string(),
        evento_climatico: Txt,
        efeitos_economicos: Txt,
        efeitos_humanos: Txt,
        contagem_ou_estimativa: Txt,
        incerteza: Txt,
        verificado: z.boolean().nullish(),
        fontes: Fontes,
      }),
    )
    .nullish(),
  cenarios_futuros: z
    .array(
      z.looseObject({
        id: z.string(),
        fonte: Txt,
        fonte_url: Txt,
        ssp: Txt,
        horizonte: Txt,
        variavel: Txt,
        faixa: Txt,
        regiao: Txt,
        observacao: Txt,
        verificado: z.boolean().nullish(),
      }),
    )
    .nullish(),
  custos_economicos: z
    .array(
      z.looseObject({
        id: z.string(),
        fonte: Txt,
        fonte_url: Txt,
        escopo: Txt,
        estimativa: Txt,
        horizonte: Txt,
        cenario: Txt,
        observacao: Txt,
        verificado: z.boolean().nullish(),
      }),
    )
    .nullish(),
  integracao_macro: z.record(z.string(), z.any()).nullish(),
  secas_nordeste: z.array(z.looseObject({ periodo: z.union([z.string(), z.number()]), observacao: Txt })).nullish(),
  tendencias: z.array(z.looseObject({ serie: z.string(), periodo: z.array(z.number()).nullish(), n: z.number().nullish(), por_decada: z.number().nullish(), ic95: z.array(z.number()).nullish(), unidade: Txt })).nullish(),
})
export type Clima = z.infer<typeof ClimaSchema>

// ------------------------------------------------------------------ potenciais_brasil.json
const Metrica = z.looseObject({
  nome: z.string(),
  valor: z.union([z.string(), z.number()]).nullish(),
  unidade: Txt,
  ano: z.union([z.string(), z.number()]).nullish(),
  fonte: Txt,
  url: Txt,
  verificado: z.boolean().nullish(),
  nota: Txt,
})
export type MetricaT = z.infer<typeof Metrica>
export const PotenciaisSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt, criterio_verificacao: Txt }).nullish(),
  potencias: z.array(
    z.looseObject({
      id: z.string(),
      titulo: z.string(),
      categoria: Txt,
      metricas: z.array(Metrica).nullish(),
      ranking_mundial: Txt,
      grau_de_uso: Txt,
      por_que_poucos_notam: Txt,
      barreiras: z.array(z.string()).nullish(),
      quem_ganha: z.array(z.string()).nullish(),
      quem_perde: z.array(z.string()).nullish(),
      risco_ambiental: Txt,
      ligacao_decisoes: z.array(z.string()).nullish(),
      ligacao_nota: Txt,
      ligacao_tendencias: z.array(z.string()).nullish(),
      regioes: z.array(z.string()).nullish(),
      fontes: Fontes,
    }),
  ),
  crescimento_potencial: z
    .looseObject({
      estimativas: z.array(z.looseObject({ fonte: z.string(), valor: z.union([z.string(), z.number()]).nullish(), periodo: Txt, metodo: Txt, verificado: z.boolean().nullish(), url: Txt })).nullish(),
      decomposicao: z.array(z.looseObject({ componente: z.string(), valor: z.union([z.string(), z.number()]).nullish(), fonte: Txt, verificado: z.boolean().nullish(), url: Txt, nota: Txt })).nullish(),
      gaps: z.array(z.looseObject({ gap: z.string(), valor: z.union([z.string(), z.number()]).nullish(), fonte: Txt, verificado: z.boolean().nullish(), url: Txt, nota: Txt })).nullish(),
      o_que_cada_decisao_mexe: z.record(z.string(), z.string()).nullish(),
    })
    .nullish(),
  armadilhas: z.array(z.looseObject({ id: z.string(), titulo: z.string(), descricao: Txt, evidencia: Txt, fontes: Fontes })).nullish(),
  perguntas_abertas: z.array(z.string()).nullish(),
})
export type Potenciais = z.infer<typeof PotenciaisSchema>
export type Potencia = Potenciais['potencias'][number]

// ------------------------------------------------------------------ pilares_pensamento.json
const Obra = z.looseObject({ titulo: z.string(), ano: z.union([z.number(), z.string()]).nullish(), url: Txt, verificado: z.boolean().nullish() })
export const PilaresSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt, criterio_verificacao: Txt }).nullish(),
  pensadores: z.array(
    z.looseObject({
      id: z.string(),
      nome: z.string(),
      tradicao: Txt,
      obra_chave: z.array(Obra).nullish(),
      ideia_central: Txt,
      conceitos: z.array(z.string()).nullish(),
      uso_operacional: Txt,
      casos_e_evidencias: z.array(z.looseObject({ descricao: z.string(), fonte: Txt, url: Txt, verificado: z.boolean().nullish() })).nullish(),
      criticas: Txt,
      relevancia_brasil: Txt,
      ligacoes: z
        .looseObject({
          ciclos: z.array(z.string()).nullish(),
          decisoes: z.array(z.string()).nullish(),
          potencias: z.array(z.string()).nullish(),
          leis: z.array(z.string()).nullish(),
        })
        .nullish(),
    }),
  ),
  pilares: z.array(
    z.looseObject({
      id: z.string(),
      nome: z.string(),
      origem: z.array(z.string()).nullish(),
      principio: Txt,
      traducao_institucional: Txt,
      exemplos_em_operacao: z.array(z.string()).nullish(),
      indicadores: z.array(z.string()).nullish(),
      riscos: z.array(z.string()).nullish(),
      tensoes: z.array(z.string()).nullish(),
      ligacao_decisoes: z.array(z.string()).nullish(),
    }),
  ),
  dialogos: z.array(z.looseObject({ entre: z.array(z.string()), tema: Txt, convergencia: Txt, divergencia: Txt })).nullish(),
  viabilizacao: z
    .array(
      z.looseObject({
        id: z.string(),
        pilar: z.string(),
        proposta: z.string(),
        instrumento_legal: Txt,
        quorum_aproximado: Txt,
        custo_beneficio: Txt,
        evidencia: Txt,
        risco_de_captura: Txt,
        indicador_de_sucesso: Txt,
        fontes: Fontes,
      }),
    )
    .nullish(),
})
export type Pilares = z.infer<typeof PilaresSchema>
export type Pensador = Pilares['pensadores'][number]
export { TxtOrList }

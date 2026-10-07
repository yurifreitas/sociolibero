import { z } from 'zod'

// quebras.json — quebras estruturais nas séries históricas, com validação sintética. Tolerante: ausente = estado vazio.
const Txt = z.string().nullish()
const Num = z.number().nullish()

export const QuebrasSchema = z.looseObject({
  meta: z.looseObject({
    gerado_em: Txt,
    aviso: Txt,
    metodo: z.looseObject({ procedimento: Txt, transformacao: Txt, alpha: Num, controle_metodologico: z.looseObject({ artefatos_testaveis: Num, recuperados_apos_holm: Num, n_nos_testados: Num }).nullish() }).nullish(),
    lacunas: z.array(z.union([z.string(), z.looseObject({ serie: Txt, motivo: Txt })])).nullish(),
  }),
  validacao: z.looseObject({
    nulo: z.array(z.looseObject({ nulo: z.string(), n: z.number(), fpr: z.record(z.string(), z.number()) })).nullish(),
    poder: z.array(z.looseObject({ tipo: z.string(), n: z.number(), magnitude: z.number(), tpr: z.record(z.string(), z.number()), erro_tau_mediano_abs: Num })).nullish(),
    oraculo_tau_conhecido: z.array(z.looseObject({ tipo: z.string(), n: z.number(), magnitude: z.number(), tpr_oraculo: Num, tpr_sup_tau_desconhecido: Num })).nullish(),
    procedimento_final: z
      .looseObject({
        escolhido: z.looseObject({ curto: Txt, longo: Txt, corte: Num }),
        candidatos: z.record(z.string(), z.looseObject({ final_ols: z.looseObject({ fpr_medio: Num, poder_medio: Num }).nullish(), final_alt: z.looseObject({ fpr_medio: Num, poder_medio: Num }).nullish() })),
      })
      .nullish(),
    cobertura_intervalo_tau_90: z.looseObject({ por_temperagem: z.record(z.string(), z.number()), temperagem_escolhida: Num }).nullish(),
    escolhas_previas: z.record(z.string(), z.looseObject({ fpr_maximo_sob_nulos: z.record(z.string(), z.number()).nullish(), escolhido: Txt })).nullish(),
  }),
  series: z.array(
    z.looseObject({
      id: z.string(),
      rotulo: z.string(),
      n: z.number(),
      periodo: z.array(z.number()).nullish(),
      modo: Txt,
      quebras: z.array(
        z.looseObject({
          ano: z.number(),
          intervalo: z.array(z.number()).nullish(),
          tipo: Txt,
          evidencia: z.looseObject({ estatistica: Num, p_ajustado: Num, q_bh: Num }).nullish(),
          artefato_metodologico: z.boolean().nullish(),
          eventos_historicos_proximos: z.array(z.string()).nullish(),
        }),
      ),
      sem_quebra_detectada: z.boolean().nullish(),
      controle_metodologico: z.looseObject({ anos_testaveis: z.array(z.number()).nullish(), recuperados_apos_holm: z.array(z.number()).nullish() }).nullish(),
      nos_testados: z.array(z.looseObject({ ano: z.number(), tipo: z.string(), p_bruto: Num, p_holm: Num })).nullish(),
    }),
  ),
  cruzamento_historia: z
    .looseObject({
      coincidencias: Num,
      n_quebras: Num,
      esperado_por_acaso: Num,
      desvio_padrao_nulo: Num,
      p_permutacao: Num,
      fracao_anos_a_menos_de_tol_de_uma_data: Num,
      tolerancia_anos: Num,
      n_datas_historicas_distintas: Num,
    })
    .nullish(),
})
export type Quebras = z.infer<typeof QuebrasSchema>
export type SerieQuebra = Quebras['series'][number]

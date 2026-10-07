import { z } from 'zod'

// Formato combinado com o coordenador: leis_tecnologicas.json e futuros.json (outros agentes os geram).
// Tudo tolerante: campos ausentes viram estado vazio, nunca erro.
const Txt = z.string().nullish()
const Ref = z.looseObject({ titulo: z.string(), url: Txt, doi: Txt, verificado: z.boolean().nullish() })

export const LeisSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt }).nullish(),
  leis: z.array(
    z.looseObject({
      id: z.string(),
      nome: z.string(),
      autor: Txt,
      ano: z.union([z.number(), z.string()]).nullish(),
      formula: Txt,
      formula_latex: Txt,
      descricao: Txt,
      parametros_empiricos: z
        .array(z.looseObject({ valor: z.union([z.number(), z.string()]).nullish(), periodo: Txt, fonte: Txt, verificado: z.boolean().nullish() }))
        .nullish(),
      dominio_validade: z.union([z.string(), z.array(z.string())]).nullish(),
      criticas: z.union([z.string(), z.array(z.string())]).nullish(),
      estado_atual: Txt,
      relevancia_brasil: Txt,
      referencias: z.array(Ref).nullish(),
    }),
  ),
  tendencias: z
    .array(
      z.looseObject({
        id: z.string(),
        titulo: z.string(),
        horizonte: Txt,
        evidencia: Txt,
        incerteza: Txt,
        impacto_economico: Txt,
        classes_afetadas: z.union([z.string(), z.array(z.string())]).nullish(),
        referencias: z.array(Ref).nullish(),
      }),
    )
    .nullish(),
})
export type Leis = z.infer<typeof LeisSchema>
export type Lei = Leis['leis'][number]

const Cenario = z.looseObject({
  central: z.array(z.number()).nullish(),
  p10: z.array(z.number()).nullish(),
  p90: z.array(z.number()).nullish(),
  parametros: z.record(z.string(), z.number()).nullish(),
  valor_ano_ref: z.number().nullish(),
  duracao_10_90_anos: z.number().nullish(),
})
const Erro = z.looseObject({ k: z.number().nullish(), rmse: z.number().nullish(), mape_pct: z.number().nullish() })
const Baseline = z.looseObject({ ingenuo: z.looseObject({ mape_pct: z.number().nullish() }).nullish(), linear: z.looseObject({ mape_pct: z.number().nullish() }).nullish(), ganha_do_melhor_baseline: z.boolean().nullish() })
const Teto = z.looseObject({
  teto_ajustado: z.number().nullish(),
  teto_obs_max: z.number().nullish(),
  teto_p10_p90: z.array(z.number()).nullish(),
  razao_teto_p90_sobre_p10: z.number().nullish(),
  replicas_no_limite_superior_pct: z.number().nullish(),
  replicas_com_teto_igual_ao_maximo_observado_pct: z.number().nullish(),
  ajuste_na_fronteira: z.boolean().nullish(),
  frac_do_teto_ja_atingida: z.number().nullish(),
})
export const FuturosSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt, lacunas: z.array(z.any()).nullish() }).nullish(),
  curvas: z.array(
    z.looseObject({
      id: z.string(),
      rotulo: z.string(),
      dominio: Txt,
      modelo: Txt,
      parametros: z.record(z.string(), z.any()).nullish(),
      fonte_dados: z.union([z.string(), z.array(z.string()), z.record(z.string(), z.any())]).nullish(),
      unidade: Txt,
      usada_na_difusao: z.boolean().nullish(),
      identificacao_teto: Teto.nullish(),
      ajuste: z.looseObject({ metodo: Txt, periodo_treino: z.any().nullish(), erro_teste: Erro.nullish(), baseline_erro_teste: Baseline.nullish() }).nullish(),
      pontos_observados: z.array(z.tuple([z.number(), z.number()])).nullish(),
      projecao: z.looseObject({ anos: z.array(z.number()), central: z.array(z.number()).nullish(), p10: z.array(z.number()).nullish(), p90: z.array(z.number()).nullish() }).nullish(),
      cenarios: z.looseObject({ lento: Cenario.nullish(), base: Cenario.nullish(), rapido: Cenario.nullish() }).nullish(),
      limites: z.union([z.string(), z.array(z.string())]).nullish(),
    }),
  ),
  integracao_macro: z.record(z.string(), z.any()).nullish(),
})
export type Futuros = z.infer<typeof FuturosSchema>
export type Macro = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
export type Curva = Futuros['curvas'][number]

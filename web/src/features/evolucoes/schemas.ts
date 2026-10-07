import { z } from 'zod'

// evolucoes.json (cadeias de Markov) e cenarios_macro.json (trajetórias por cenário). Tudo tolerante: campo ausente = estado vazio.
const Txt = z.string().nullish()
const Num = z.number().nullish()
const Mat = z.array(z.array(z.number()))
const Ic = z.looseObject({ lo: Mat, hi: Mat })
const Matriz = z.looseObject({
  P: Mat,
  ic90: Ic.nullish(),
  n_transicoes: Num,
  kappa_encolhimento: Num,
  prior: Txt,
  periodo: z.array(z.number()).nullish(),
})
const Fan = z.looseObject({
  anos: z.array(z.number()),
  estados: z.array(z.string()),
  p10: z.array(z.array(z.number())).nullish(),
  p50: z.array(z.array(z.number())).nullish(),
  p90: z.array(z.array(z.number())).nullish(),
  ponto: z.array(z.array(z.number())).nullish(),
  media_preditiva: z.array(z.array(z.number())).nullish(),
})
const Passagem = z.looseObject({ matriz: Txt, origem: z.string(), alvo: z.string(), h_anos: z.number(), p: z.number(), ic90: z.array(z.number()).nullish() })
const Cemit = z.looseObject({ tentativa: z.string(), resultado: z.string(), licao: Txt })
const Modelo = z.looseObject({ logloss: Num, brier: Num, n: Num })
const Bloco = z.looseObject({ pool: z.record(z.string(), Modelo).nullish() })
const EconRegime = z.looseObject({
  n: Num,
  anos: z.array(z.number()).nullish(),
  estados: z.array(z.string()),
  cortes: z.array(z.number()).nullish(),
  estado_atual: z.looseObject({ ano: Num, rotulo: Txt }).nullish(),
  validacao_fora_da_amostra: z.record(z.string(), Bloco).nullish(),
})
const Variante = z.looseObject({
  matriz: Mat,
  ocupacao: Mat,
  p_ruptura_ate_2038: Num,
  debt_2038_p10_p50_p90: z.array(z.number()).nullish(),
})
const RupturaCenario = z.looseObject({
  p_ruptura_ate_2038: z.number(),
  p_acumulada_por_ano: z.record(z.string(), z.number()),
  tempo_esperado_restrito_anos: Num,
})

export const EvolucoesSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt, fontes: z.array(z.looseObject({ nome: z.string(), url: Txt, sha256: Txt, licenca: Txt })).nullish() }).nullish(),
  regimes_politicos: z.looseObject({
    estados: z.array(z.string()),
    definicao_estados: Txt,
    matrizes: z.looseObject({ global: Matriz, america_latina: Matriz, brasil: Matriz }),
    estacionaria: z.record(z.string(), z.looseObject({ media: z.array(z.number()) })).nullish(),
    duracao_esperada: z.record(z.string(), z.record(z.string(), z.looseObject({ anos: z.number(), ic90: z.array(z.number()).nullish() }))).nullish(),
    primeira_passagem: z.array(Passagem),
    projecao_brasil: Fan.extend({ estado_inicial: z.looseObject({ ano: Num, rotulo: Txt, no_estado_desde: Num }).nullish(), o_que_mostram_p10_p90: Txt }),
    semi_markov_brasil: z.looseObject({ metodo: Txt, idade_usada_anos: Num, projecao: Fan, primeira_passagem: z.array(z.looseObject({ origem: z.string(), alvo: z.string(), h: z.number(), p: z.number(), ic90: z.array(z.number()).nullish() })).nullish() }).nullish(),
  }),
  regimes_economicos: z.looseObject({ inflacao: EconRegime.nullish(), crescimento: EconRegime.nullish() }).nullish(),
  cadeia_cenarios: z.looseObject({
    ciclos: z.array(z.number()),
    cenarios: z.array(z.string()),
    rotulos: z.record(z.string(), z.string()),
    matriz_julgada: Mat,
    origem_da_matriz: Txt,
    ancoras_empiricas: z.looseObject({ eps: Num, rho: Num, h_anos: Num }).nullish(),
    distribuicao_inicial_2026: z.record(z.string(), z.number()),
    nota_ciclos: Txt,
    ocupacao: z.looseObject({ por_ciclo: z.record(z.string(), z.array(z.number())) }),
    ruptura_regime_divida_acima_de_120: z.looseObject({
      limiar_pct_pib: Num,
      por_cenario: z.record(z.string(), RupturaCenario),
      mistura_cadeia: z.looseObject({ p_ruptura_ate_2038: Num, p_acumulada_por_ano: z.record(z.string(), z.number()).nullish() }).nullish(),
    }),
    macro_esperada: z
      .looseObject({
        cadeia: z.record(z.string(), z.looseObject({ anos: z.array(z.number()), p50: z.array(z.number()) })).nullish(),
      })
      .nullish(),
    sensibilidade: z.looseObject({ variantes: z.record(z.string(), Variante).nullish(), leitura: Txt }).nullish(),
  }),
  cemiterio: z.array(Cemit).nullish(),
  limites: z.array(z.string()).nullish(),
})
export type Evolucoes = z.infer<typeof EvolucoesSchema>

const Serie = z.looseObject({ p10: z.array(z.number()), p50: z.array(z.number()), p90: z.array(z.number()) })
export const CenariosMacroSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, fonte: Txt, aviso: Txt }).nullish(),
  anos: z.array(z.number()),
  cenarios: z.record(z.string(), z.looseObject({ debt: Serie, selic: Serie, ipca: Serie, gdp: Serie })),
})
export type CenariosMacro = z.infer<typeof CenariosMacroSchema>

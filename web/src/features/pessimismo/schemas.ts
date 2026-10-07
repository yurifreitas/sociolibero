import { z } from 'zod'

// pessimismo.json (testes de estresse) e visoes_pessimistas.json (levantamento). Tolerantes: ausente = estado vazio.
const Txt = z.string().nullish()
const Num = z.number().nullish()
const Faixa = z.array(z.number()).nullish()
const Pcts = z.looseObject({ p10: Num, p50: Num, p90: Num })
const Ano = z.looseObject({ debt: Pcts, selic: Pcts, ipca: Pcts, gdp: Pcts, prob_rompeu_ate_o_ano: Num, valido_como_trajetoria: z.boolean().nullish() })
const Anos = z.record(z.string(), Ano)

export const PessimismoSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt, aviso_longo: Txt, suposicoes: z.array(z.string()).nullish() }),
  eficiencia_de_execucao: z.looseObject({
    definicao: Txt,
    eficiencia_central_pessimista: Num,
    faixa_proxies: Faixa,
    aviso_ancora: Txt,
    ancoras_proxy: z.record(z.string(), z.looseObject({ valor: Num, leitura: Txt })).nullish(),
    varredura: z.array(
      z.looseObject({
        id: z.string(),
        rotulo: z.string(),
        dominio: Txt,
        melhora_divida_2035_pp: z.record(z.string(), z.number()),
        perda_primario_rs_bi_ano: z.record(z.string(), z.number()).nullish(),
        classe: Txt,
      }),
    ),
    ranking_fragilidade: z.array(z.looseObject({ posto: z.number(), id: z.string(), rotulo: z.string(), classe: Txt, perda_divida_pp_a_60: Num, perda_divida_pp_a_40: Num, perda_primario_rs_bi_ano_a_40: Num })).nullish(),
    robustas: z.array(z.looseObject({ id: z.string(), rotulo: z.string(), melhora_divida_2035_pp_a_100: Num, melhora_divida_2035_pp_a_40: Num })).nullish(),
    sem_beneficio_a_perder: z.array(z.looseObject({ id: z.string(), rotulo: z.string() })).nullish(),
  }),
  cenario_adverso: z.looseObject({
    definicao_ruptura: Txt,
    choque_composto: z.record(z.string(), z.union([z.number(), z.boolean(), z.string()])).nullish(),
    nota_tecnologia: Txt,
    baseline: z.record(z.string(), z.looseObject({ rotulo: Txt, anos: Anos })),
    resultados: z.record(z.string(), z.looseObject({ adverso: z.looseObject({ anos: Anos }) })),
    prob_ruptura: z.record(z.string(), z.record(z.string(), z.looseObject({ qualquer_ano: Num, em_2035: Num }))).nullish(),
    atribuicao_por_choque: z.record(z.string(), z.record(z.string(), z.looseObject({ sozinho_delta_divida_2035: Num, sozinho_delta_selic_2035: Num }))).nullish(),
    reverse_stress: z
      .looseObject({
        divida_2035_sem_choque: Num,
        combinacoes_avaliadas: Num,
        combinacoes_que_rompem: Num,
        algum_choque_unico_rompe: z.boolean().nullish(),
        choque_unico_no_maximo: z.record(z.string(), z.looseObject({ nivel_maximo: Num, divida_2035: Num })).nullish(),
        criterio: Txt,
      })
      .nullish(),
  }),
  lideranca_judicial: z.looseObject({
    aviso: Txt,
    calendario_vagas: z.array(z.looseObject({ vaga: z.string(), ano: z.number() })).nullish(),
    quorum_senado: Num,
    regra_risco: Txt,
    suposicao_mapeamento: Txt,
    vagas_capturadas: z.looseObject({
      distribuicao: z.record(
        z.string(),
        z.looseObject({ p_aprovacao_indicado: z.record(z.string(), z.number()).nullish(), distribuicao_vagas_capturadas: z.record(z.string(), z.number()), esperanca_vagas_capturadas: Num, p_pelo_menos_uma: Num }),
      ),
    }),
    risco_institucional: z.record(z.string(), z.looseObject({ base_do_cenario: Num, p10: Num, p50: Num, p90: Num, media: Num })).nullish(),
    contrafactual: z.record(z.string(), z.looseObject({ efeito_do_canal_judicial_divida_2035_pp: Num, efeito_do_canal_judicial_prob_ruptura: Num })).nullish(),
    sensibilidade_mapeamento: z.record(z.string(), z.array(z.looseObject({ mapeamento: z.string(), divida_2035_p50: Num, divida_2035_p50_contrafactual: Num }))).nullish(),
    limites_proprios: z.array(z.string()).nullish(),
  }),
  fragilidade_setorial: z.array(
    z.looseObject({
      choque: z.string(),
      mais_exposto: z.array(z.string()).nullish(),
      mais_exposto_exceto_fiscal: z.array(z.string()).nullish(),
      empate: z.boolean().nullish(),
      setores: z.record(z.string(), z.looseObject({ escore: Num, base: Txt, nota: Txt })),
    }),
  ),
  cemiterio: z.array(z.looseObject({ tentativa: z.string(), resultado: Txt, licao: Txt })).nullish(),
  limites: z.array(z.string()).nullish(),
})
export type Pessimismo = z.infer<typeof PessimismoSchema>

const Ref = z.looseObject({ titulo: z.string(), url: Txt, doi: Txt, verificado: z.boolean().nullish() })
const Fonte = z.looseObject({ titulo: z.string().nullish(), url: Txt, verificado: z.boolean().nullish() })
const Custo = z.looseObject({ valor_rs_bi: Num, faixa_rs_bi: Faixa, ano_base: Num, tipo: Txt, fonte: Txt, url: Txt, verificado: z.boolean().nullish(), descricao: Txt })

export const VisoesSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt }),
  decisoes_ruins: z.array(
    z.looseObject({
      id: z.string(),
      titulo: z.string(),
      periodo: Txt,
      mecanismo_do_dano: Txt,
      custo: Custo.nullish(),
      custos_adicionais: z.array(Custo).nullish(),
      quem_pagou: Txt,
      setores_afetados: z.array(z.string()).nullish(),
      controversia: Txt,
      decisoes_relacionadas: z.array(z.string()).nullish(),
      fontes: z.array(Fonte).nullish(),
    }),
  ),
  captura_judicial: z.looseObject({
    mecanismos: z.array(
      z.looseObject({
        id: z.string(),
        nome: z.string(),
        descricao: Txt,
        teoria: Txt,
        evidencia_comparada: z.array(z.looseObject({ caso: z.string(), efeito: Txt, fonte: Txt, url: Txt, verificado: z.boolean().nullish() })).nullish(),
        leitura_contraria: Txt,
        indicadores_brasil: z.array(z.looseObject({ nome: z.string(), valor: z.union([z.string(), z.number()]).nullish(), ano: Num, fonte: Txt, url: Txt, verificado: z.boolean().nullish() })).nullish(),
      }),
    ),
    historico_brasil: z.array(z.looseObject({ data: Txt, fato: z.string(), fonte: Txt, url: Txt, verificado: z.boolean().nullish() })).nullish(),
    custo_economico: z.array(z.looseObject({ descricao: z.string(), valor: z.union([z.string(), z.number()]).nullish(), tipo: Txt, fonte: Txt, url: Txt, verificado: z.boolean().nullish(), ressalva: Txt })).nullish(),
  }),
  capacidade_estatal: z.looseObject({
    proxies: z.array(z.looseObject({ id: z.string(), nome: z.string(), valor_brasil: z.union([z.string(), z.number()]).nullish(), comparacao: Txt, ano: Num, fonte: Txt, url: Txt, verificado: z.boolean().nullish(), o_que_nao_mede: Txt })),
    ineficiencia_por_setor: z.array(z.looseObject({ setor: z.string(), valor_rs_bi: Num, faixa_rs_bi: Faixa, metodo: Txt, tipo: Txt, fonte: Txt, url: Txt, verificado: z.boolean().nullish(), controversia: Txt })).nullish(),
  }),
  fundamentos: z.array(z.looseObject({ id: z.string(), autor: z.string(), ano: z.union([z.number(), z.string()]).nullish(), ideia_pessimista: Txt, contraponto: Txt, aplicacao_brasil: Txt, referencias: z.array(Ref).nullish() })).nullish(),
  pre_mortem: z.array(z.looseObject({ setor: z.string(), como_falha: Txt, sinais_precoces: z.array(z.string()).nullish(), dados_abertos: z.array(z.string()).nullish(), decisoes_relacionadas: z.array(z.string()).nullish() })).nullish(),
  nao_somar: Txt,
  limites: z.array(z.string()).nullish(),
})
export type Visoes = z.infer<typeof VisoesSchema>

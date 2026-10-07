import { z } from 'zod'

const Txt = z.string().nullish()
const Lista = z.array(z.string()).nullish()
const Num = z.number().nullish()
const Pct3 = z.looseObject({ p10: Num, p50: Num, p90: Num })

const FonteLida = z.union([z.string(), z.looseObject({ citacao: Txt, titulo: Txt, url: Txt, lido: Txt })])

export const HistoriaVotoSchema = z.looseObject({
  id: z.string(),
  periodo: z.string(),
  regra: Txt,
  quem_votava: Txt,
  eleitorado: z
    .looseObject({ valor: z.union([z.number(), z.string()]).nullish(), pct_populacao: Num, fonte: Txt, url: Txt, verificado: z.boolean().nullish() })
    .nullish(),
  efeito: Txt,
  interesses: z.looseObject({ ganhou: Lista, perdeu: Lista }).nullish(),
  leituras_rivais: Lista,
  fontes: z.array(FonteLida).nullish(),
})
export type HistoriaVoto = z.infer<typeof HistoriaVotoSchema>

const Grupo = z.looseObject({ analfabeto: Num, le_escreve: Num, fundamental: Num, medio: Num, superior: Num, nao_informado: Num })
const InstrucaoAno = z.looseObject({
  total: Num,
  por_grau: z.record(z.string(), z.number()).nullish(),
  por_grupo: Grupo.nullish(),
  pct_grupo: Grupo.nullish(),
  pct_analfabeto: Num,
  pct_le_escreve: Num,
  pct_analfabeto_ou_le_escreve: Num,
})
export type InstrucaoAno = z.infer<typeof InstrucaoAno>

const Coef = z.looseObject({
  beta_pp_por_pp: Num,
  ic95_municipios: z.array(z.number()).nullish(),
  ic95_ufs: z.array(z.number()).nullish(),
  efeito_da_amplitude_interquartil_intra_uf_pp: Num,
  amplitude_interquartil_media_pp: Num,
})
const Modelo = z.looseObject({ n_municipios: Num, n_ufs: Num, r2_intra_uf: Num, pct_analfabeto: Coef.nullish(), pct_pretos_pardos: Coef.nullish(), pct_indigena: Coef.nullish() })
const Cruz = z.looseObject({
  ano_do_perfil: Num,
  status_da_apuracao: Txt,
  candidatos: z.record(z.string(), z.string()).nullish(),
  correlacao_simples_pearson: z.record(z.string(), z.number()).nullish(),
  voto_13: z.looseObject({ bivariado_intra_uf: Modelo.nullish(), multivariado_intra_uf: Modelo.nullish() }).nullish(),
  voto_22: z.looseObject({ bivariado_intra_uf: Modelo.nullish(), multivariado_intra_uf: Modelo.nullish() }).nullish(),
  comparecimento_pct: z.looseObject({ bivariado_intra_uf: Modelo.nullish(), multivariado_intra_uf: Modelo.nullish() }).nullish(),
  por_uf_voto_13: z.record(z.string(), z.looseObject({ n: Num, beta_pp_por_pp: Num, ic95: z.array(z.number()).nullish() })).nullish(),
  por_uf_voto_22: z.record(z.string(), z.looseObject({ n: Num, beta_pp_por_pp: Num, ic95: z.array(z.number()).nullish() })).nullish(),
})
export type Cruz = z.infer<typeof Cruz>

const AnoProj = z.looseObject({
  eleitores: Pct3.nullish(),
  analfabetos: Pct3.nullish(),
  le_escreve: Pct3.nullish(),
  pct_analfabeto: Pct3.nullish(),
  pct_60mais: Pct3.nullish(),
  idade_media: Pct3.nullish(),
  analfabetos_faixa_calibrada_p10_p90: z.array(z.number()).nullish(),
})
export type AnoProj = z.infer<typeof AnoProj>

export const EleitoradoSchema = z.looseObject({
  meta: z
    .looseObject({
      gerado_em: Txt,
      aviso: Txt,
      fontes: z.array(z.looseObject({ nome: Txt, url: Txt, baixado_em: Txt, sha256: Txt })).nullish(),
      lacunas: Lista,
      mapa_municipal: Txt,
    })
    .nullish(),
  historia: z.array(HistoriaVotoSchema),
  serie_analfabetismo: z
    .array(z.looseObject({ id: z.string(), rotulo: Txt, unidade: Txt, pontos: z.array(z.tuple([z.number(), z.number()])).nullish(), notas: Txt, origem: Txt, fonte: z.looseObject({ nome: Txt, url: Txt }).nullish() }))
    .nullish(),
  serie_eleitorado_por_instrucao_nacional_sem_exterior: z.record(z.string(), InstrucaoAno).nullish(),
  eleitorado_por_instrucao: z
    .record(
      z.string(),
      z.looseObject({ nacional_sem_exterior: InstrucaoAno.nullish(), por_uf: z.record(z.string(), InstrucaoAno).nullish(), por_regiao: z.record(z.string(), InstrucaoAno).nullish() }),
    )
    .nullish(),
  comparecimento_por_instrucao: z.record(z.string(), z.unknown()).nullish(),
  cruzamentos: z.looseObject({ metodo: Txt, resultados: z.record(z.string(), Cruz).nullish(), ressalvas: Lista }).nullish(),
  projecao_2038: z
    .looseObject({
      suposicoes: Lista,
      parametros: z.looseObject({ origem: Num, ate: Num, caminhos: Num, erro_backtest_log_rms: Num }).nullish(),
      validacao_retrospectiva: z
        .looseObject({
          resumo_analfabetos: z.looseObject({
            n_previsoes: Num,
            erro_absoluto_medio_modelo_pct: Num,
            erro_absoluto_medio_ultimo_valor_pct: Num,
            erro_absoluto_medio_linear_pct: Num,
            cobertura_faixa_p10_p90: Num,
          }).nullish(),
        })
        .nullish(),
      faixa: z.looseObject({ descricao: Txt, nacional_por_ano: z.record(z.string(), AnoProj).nullish() }).nullish(),
      por_regiao: z.record(z.string(), z.record(z.string(), z.looseObject({ analfabetos: Pct3.nullish(), participacao_nos_analfabetos_pct: Pct3.nullish() }))).nullish(),
      decomposicao_2026_2038: z
        .looseObject({ analfabetos_2026: Num, analfabetos_2038_central: Num, pct_de_2026_ainda_inscrito_2038: Num, pct_do_estoque_2038_que_vem_de_entrantes: Num, nota: Txt })
        .nullish(),
      longo_prazo: z.looseObject({ aviso: Txt, analfabetos_por_decada: z.record(z.string(), Pct3).nullish() }).nullish(),
    })
    .nullish(),
  teorias: z
    .array(z.looseObject({ id: z.string(), autor: Txt, ano: z.union([z.number(), z.string()]).nullish(), ideia: Txt, aplicacao_brasil: Txt, fontes: z.array(FonteLida).nullish() }))
    .nullish(),
  validacao: z
    .looseObject({ divergencias_nao_reproduzidas: Lista, totais_vs_publicados: z.array(z.looseObject({ ano: Num, campo: Txt, publicado: Num, calculado: Num, dif: Num, fonte: Txt, url: Txt, como_foi_lido: Txt })).nullish() })
    .nullish(),
  limites: Lista,
})
export type Eleitorado = z.infer<typeof EleitoradoSchema>

/** analfabetos_municipal.json: { [ibge]: { uf, '2022': {...} | null, ... } } */
const AnoMun = z.looseObject({
  eleitores: Num,
  analfabeto: Num,
  le_escreve: Num,
  pct_analfabeto: Num,
  pct_le_escreve: Num,
  pct_analfabeto_60mais: Num,
})
export const AnalfabetosMunicipalSchema = z.record(
  z.string(),
  z.looseObject({ uf: Txt, '2022': AnoMun.nullish(), '2024': AnoMun.nullish(), '2026': AnoMun.nullish() }),
)
export type AnalfabetosMunicipal = z.infer<typeof AnalfabetosMunicipalSchema>

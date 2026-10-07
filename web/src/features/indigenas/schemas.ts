import { z } from 'zod'

const Txt = z.string().nullish()
const Lista = z.array(z.string()).nullish()
const Fonte = z.looseObject({ titulo: Txt, url: Txt, verificado: z.boolean().nullish(), trecho_confirmado: Txt })

const PorCargo = z.record(
  z.string(),
  z.looseObject({
    candidaturas: z.number().nullish(),
    indigenas: z.number().nullish(),
    pct_indigenas: z.number().nullish(),
    eleitos: z.number().nullish(),
    eleitos_indigenas: z.number().nullish(),
    suplentes_indigenas: z.number().nullish(),
  }),
)

export const AnoCandSchema = z.looseObject({
  total_candidaturas: z.number().nullish(),
  indigenas: z.number().nullish(),
  pct: z.number().nullish(),
  eleitos: z.number().nullish(),
  eleitos_total: z.number().nullish(),
  pct_dos_eleitos: z.number().nullish(),
  suplentes_indigenas: z.number().nullish(),
  razao_eleitos_candidaturas_indigenas: z.number().nullish(),
  razao_eleitos_candidaturas_demais: z.number().nullish(),
  por_cargo: PorCargo.nullish(),
  por_uf: z.record(z.string(), z.unknown()).nullish(),
  por_cor_raca: z.record(z.string(), z.unknown()).nullish(),
  por_cor_raca_deputado_federal: z.record(z.string(), z.looseObject({ candidaturas: z.number().nullish(), eleitos: z.number().nullish(), razao_eleitos_candidaturas: z.number().nullish() })).nullish(),
  por_espectro: z.record(z.string(), z.unknown()).nullish(),
  pct_censo_cor_raca: z.number().nullish(),
  pct_censo_ampliado: z.number().nullish(),
  razao_representacao_vs_censo_cor_raca: z.number().nullish(),
})
export type AnoCand = z.infer<typeof AnoCandSchema>

const Nivel = z.looseObject({ comparecimento_pct: z.number().nullish(), brancos_nulos_pct: z.number().nullish(), voto_13_pct: z.number().nullish(), voto_22_pct: z.number().nullish() })
const Diff = z.record(z.string(), z.number().nullish())
const IC = z.record(z.string(), z.array(z.number()).nullish())
const Comparacao = z.looseObject({
  limiar_pct_indigena: z.number(),
  municipios_alto: z.number().nullish(),
  municipios_baixo: z.number().nullish(),
  aptos_alto: z.number().nullish(),
  nivel_alto: Nivel.nullish(),
  nivel_baixo: Nivel.nullish(),
  diferenca_pp_dentro_da_uf: Diff.nullish(),
  ic95_bootstrap_pp: IC.nullish(),
})
export type Comparacao = z.infer<typeof Comparacao>

const Grupo = z.looseObject({ secoes_com_dado: z.number().nullish(), aptos: z.number().nullish(), comparecimento_pct: z.number().nullish(), votos_validos: z.number().nullish(), voto_pct: z.record(z.string(), z.number()).nullish() })

export const IndigenasSchema = z.looseObject({
  meta: z.looseObject({ gerado_em: Txt, aviso: Txt, fontes: z.array(z.looseObject({ nome: Txt, url: Txt, baixado_em: Txt, sha256: Txt })).nullish(), lacunas: Lista }).nullish(),
  linha_do_tempo: z.array(
    z.looseObject({
      id: z.string(),
      data: Txt,
      titulo: z.string(),
      resumo: Txt,
      passos_de_construcao: Lista,
      controversia: Txt,
      incerteza: Txt,
      fontes: z.array(Fonte).nullish(),
      historia_ids: Lista,
    }),
  ),
  candidaturas: z
    .looseObject({
      anos: z.record(z.string(), AnoCandSchema),
      municipal_2024: AnoCandSchema.nullish(),
      censo_2022: z.looseObject({ pop_total: z.number().nullish(), indigena_cor_raca: z.number().nullish(), indigena_ampliado: z.number().nullish(), pct_cor_raca: z.number().nullish(), pct_ampliado: z.number().nullish() }).nullish(),
      eleitorado_2022_cor_raca: z.looseObject({ pct_sem_informacao: z.number().nullish(), total_eleitores: z.number().nullish() }).nullish(),
      eleitorado_2024_cor_raca: z.looseObject({ pct_sem_informacao: z.number().nullish(), pct_indigena_dos_declarados: z.number().nullish(), total_eleitores: z.number().nullish() }).nullish(),
      validacao: z
        .looseObject({
          comparacoes: z
            .array(z.looseObject({ item: Txt, calculado: z.number().nullish(), publicado: z.number().nullish(), diferenca: z.number().nullish(), fonte: Txt, fonte_aberta: z.boolean().nullish() }))
            .nullish(),
        })
        .nullish(),
    })
    .nullish(),
  municipios_indigenas: z
    .looseObject({
      metodo: Txt,
      resultados: z
        .record(
          z.string(),
          z.looseObject({ rotulo: Txt, status: Txt, municipios_com_dados: z.number().nullish(), comparacoes: z.array(Comparacao).nullish() }),
        )
        .nullish(),
      secoes_em_terras_indigenas: z
        .looseObject({
          disponivel: z.boolean().nullish(),
          ano: z.number().nullish(),
          secoes_em_ti: z.number().nullish(),
          locais_em_ti: z.number().nullish(),
          eleitores_em_secoes_em_ti: z.number().nullish(),
          eleitores_total: z.number().nullish(),
          pct_eleitores_em_secoes_em_ti: z.number().nullish(),
          municipios_com_secao_em_ti: z.number().nullish(),
          tis_com_secao: z.number().nullish(),
          maiores_municipios: z.array(z.looseObject({ uf: Txt, municipio: Txt, secoes: z.number().nullish(), eleitores: z.number().nullish() })).nullish(),
          comportamento: z
            .looseObject({ turnos: z.record(z.string(), z.looseObject({ demais_secoes_dos_mesmos_municipios: Grupo.nullish(), em_ti: Grupo.nullish() })).nullish() })
            .nullish(),
        })
        .nullish(),
      ressalvas: Lista,
    })
    .nullish(),
  eleitos_figuras_publicas: z
    .array(z.looseObject({ nome: z.string(), cargo: Txt, ano: z.number().nullish(), uf: Txt, partido: Txt, fonte: Txt, verificado: z.boolean().nullish(), nota: Txt }))
    .nullish(),
  limites: Lista,
})
export type Indigenas = z.infer<typeof IndigenasSchema>

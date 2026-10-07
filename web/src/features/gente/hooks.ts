import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { CruzamentoSchema, EconomiaHistoricaSchema, FatorHumanoSchema, HumanoMunicipalSchema, HumanoNacionalSchema, SeriesSchema } from './schemas'

const STATIC = { staleTime: Number.POSITIVE_INFINITY, gcTime: Number.POSITIVE_INFINITY, retry: 1 } as const

export const useEconomiaHistorica = () =>
  useQuery({ queryKey: ['economia-historica'], queryFn: () => getJson('economia_historica.json', EconomiaHistoricaSchema, true), ...STATIC })

export const useFatorHumano = () =>
  useQuery({ queryKey: ['fator-humano'], queryFn: () => getJson('fator_humano.json', FatorHumanoSchema, true), ...STATIC })

/** `path` permite apontar para um arquivo de teste em dev; o padrão é o arquivo real do pipeline. */
export const useSeriesHistoricas = (path = 'series_historicas.json') =>
  useQuery({ queryKey: ['series-historicas', path], queryFn: () => getJson(path, SeriesSchema, true), ...STATIC })

export const useHumanoNacional = () =>
  useQuery({ queryKey: ['humano-nacional'], queryFn: () => getJson('humano_nacional.json', HumanoNacionalSchema, true), ...STATIC })

/** 14 MB: só carrega quando a métrica do mapa precisa (enabled). */
export const useHumanoMunicipal = (enabled: boolean) =>
  useQuery({ queryKey: ['humano-municipal'], queryFn: () => getJson('humano_municipal.json', HumanoMunicipalSchema, true), enabled, ...STATIC })

export const useCruzamento = () =>
  useQuery({ queryKey: ['cruzamento'], queryFn: () => getJson('cruzamento_territorial.json', CruzamentoSchema, true), ...STATIC })

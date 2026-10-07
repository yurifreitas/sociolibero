import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { AnalfabetosMunicipalSchema, EleitoradoSchema } from './schemas'

const STATIC = { staleTime: Number.POSITIVE_INFINITY, gcTime: Number.POSITIVE_INFINITY, retry: 1 } as const

export const useEleitorado = () =>
  useQuery({ queryKey: ['eleitorado-analfabeto'], queryFn: () => getJson('eleitorado_analfabeto.json', EleitoradoSchema, true), ...STATIC })

/** 3,9 MB: só carrega quando a métrica do mapa precisa (enabled). */
export const useAnalfabetosMunicipal = (enabled: boolean) =>
  useQuery({
    queryKey: ['analfabetos-municipal'],
    queryFn: () => getJson('analfabetos_municipal.json', AnalfabetosMunicipalSchema, true),
    enabled,
    ...STATIC,
  })

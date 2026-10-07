import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { IndigenasSchema } from './schemas'

const STATIC = { staleTime: Number.POSITIVE_INFINITY, gcTime: Number.POSITIVE_INFINITY, retry: 1 } as const

export const useIndigenasEleicoes = () =>
  useQuery({ queryKey: ['indigenas-eleicoes'], queryFn: () => getJson('indigenas_eleicoes.json', IndigenasSchema, true), ...STATIC })

import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { AntesSchema, ClimaSchema, PilaresSchema, PotenciaisSchema } from './schemas'

const STATIC = { staleTime: 60_000, retry: 1 } as const

export const useAntes = () => useQuery({ queryKey: ['antes-de-1500'], queryFn: () => getJson('antes_de_1500.json', AntesSchema, true), ...STATIC })
export const useClima = () => useQuery({ queryKey: ['clima'], queryFn: () => getJson('clima.json', ClimaSchema, true), ...STATIC })
export const usePotenciais = () => useQuery({ queryKey: ['potenciais'], queryFn: () => getJson('potenciais_brasil.json', PotenciaisSchema, true), ...STATIC })
export const usePilares = () => useQuery({ queryKey: ['pilares'], queryFn: () => getJson('pilares_pensamento.json', PilaresSchema, true), ...STATIC })

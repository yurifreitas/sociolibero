import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { ClimaValorSchema, CustoCorrupcaoSchema } from './schemas'

const STATIC = { staleTime: 60_000, retry: 1 } as const
export const useCustoCorrupcao = () => useQuery({ queryKey: ['custo-corrupcao'], queryFn: () => getJson('custo_corrupcao.json', CustoCorrupcaoSchema, true), ...STATIC })
export const useClimaValor = (enabled = true) => useQuery({ queryKey: ['clima-valor'], queryFn: () => getJson('clima_valor_financeiro.json', ClimaValorSchema, true), enabled, ...STATIC })

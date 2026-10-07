import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { CenariosMacroSchema, EvolucoesSchema } from './schemas'

const STATIC = { staleTime: 60_000, retry: 1 } as const

export const useEvolucoes = (enabled = true) => useQuery({ queryKey: ['evolucoes'], queryFn: () => getJson('evolucoes.json', EvolucoesSchema, true), enabled, ...STATIC })
export const useCenariosMacro = (enabled = true) =>
  useQuery({ queryKey: ['cenarios-macro'], queryFn: () => getJson('cenarios_macro.json', CenariosMacroSchema, true), enabled, ...STATIC })

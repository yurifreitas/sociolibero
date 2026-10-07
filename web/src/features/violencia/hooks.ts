import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { ViolenciaSchema } from './schemas'

export const useViolencia = (enabled = true) =>
  useQuery({ queryKey: ['violencia'], queryFn: () => getJson('pensadores_violencia.json', ViolenciaSchema, true), staleTime: 60_000, retry: 1, enabled })

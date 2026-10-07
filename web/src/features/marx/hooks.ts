import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { MarxSchema } from './schemas'

/** `enabled=false` permite à paleta de comandos só carregar o arquivo quando alguém busca. */
export const useMarx = (enabled = true) =>
  useQuery({ queryKey: ['marx'], queryFn: () => getJson('marx_capitalismo.json', MarxSchema, true), staleTime: 60_000, retry: 1, enabled })

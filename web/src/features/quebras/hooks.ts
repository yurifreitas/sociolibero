import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { QuebrasSchema } from './schemas'

export const useQuebras = () => useQuery({ queryKey: ['quebras'], queryFn: () => getJson('quebras.json', QuebrasSchema, true), staleTime: 60_000, retry: 1 })

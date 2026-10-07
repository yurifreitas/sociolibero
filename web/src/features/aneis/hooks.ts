import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { AneisSchema } from './schemas'

export const useAneis = (enabled = true) => useQuery({ queryKey: ['aneis'], queryFn: () => getJson('aneis.json', AneisSchema, true), enabled, staleTime: 60_000, retry: 1 })

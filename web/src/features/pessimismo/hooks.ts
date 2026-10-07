import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { PessimismoSchema, VisoesSchema } from './schemas'

const STATIC = { staleTime: 60_000, retry: 1 } as const
export const usePessimismo = (enabled = true) => useQuery({ queryKey: ['pessimismo'], queryFn: () => getJson('pessimismo.json', PessimismoSchema, true), enabled, ...STATIC })
export const useVisoes = (enabled = true) => useQuery({ queryKey: ['visoes-pessimistas'], queryFn: () => getJson('visoes_pessimistas.json', VisoesSchema, true), enabled, ...STATIC })

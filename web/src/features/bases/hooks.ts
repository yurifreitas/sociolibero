import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { BasesSchema, PropostasSchema } from './schema'

const STATIC = { staleTime: Number.POSITIVE_INFINITY, gcTime: Number.POSITIVE_INFINITY, retry: 1 } as const

export const useBases = () =>
  useQuery({ queryKey: ['bases'], queryFn: () => getJson('bases.json', BasesSchema, true), ...STATIC })

export const usePropostas = () =>
  useQuery({ queryKey: ['propostas'], queryFn: () => getJson('propostas.json', PropostasSchema, true), ...STATIC })

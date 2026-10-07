import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { FuturosSchema, LeisSchema } from './schemas'

const STATIC = { staleTime: 60_000, retry: 1 } as const

export const useLeis = () =>
  useQuery({ queryKey: ['leis-tecnologicas'], queryFn: () => getJson('leis_tecnologicas.json', LeisSchema, true), ...STATIC })

/** `path` permite apontar para uma fixture em dev; o padrão é o arquivo real do pipeline. */
export const useFuturos = (path = 'futuros.json') =>
  useQuery({ queryKey: ['futuros', path], queryFn: () => getJson(path, FuturosSchema, true), ...STATIC })

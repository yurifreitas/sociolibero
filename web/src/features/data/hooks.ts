import { useQueries, useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import {
  DecisoesSchema,
  ElectionSchema,
  ExposicaoSchema,
  ForensicsSchema,
  GeoSchema,
  HistoriaSchema,
  IndexSchema,
  ReferencesSchema,
  TerritoriosSchema,
  ValidationSchema,
} from './schemas'

const STATIC = { staleTime: Number.POSITIVE_INFINITY, gcTime: Number.POSITIVE_INFINITY, retry: 1 } as const

export const useIndex = () => useQuery({ queryKey: ['index'], queryFn: () => getJson('index.json', IndexSchema), ...STATIC })

export const useGeo = (path: string | undefined) =>
  useQuery({ queryKey: ['geo', path], queryFn: () => getJson(path as string, GeoSchema), enabled: !!path, ...STATIC })

export const electionQuery = (id: string) => ({
  queryKey: ['election', id],
  queryFn: () => getJson(`elections/${id}.json`, ElectionSchema),
  ...STATIC,
})
export const useElection = (id: string | undefined) =>
  useQuery({ ...electionQuery(id ?? ''), enabled: !!id })
export const useElections = (ids: string[]) => useQueries({ queries: ids.map(electionQuery) })

export const useForensics = (id: string | undefined, available: boolean) =>
  useQuery({
    queryKey: ['forensics', id],
    queryFn: () => getJson(`forensics/${id}.json`, ForensicsSchema),
    enabled: !!id && available,
    ...STATIC,
  })
export const useForensicsMany = (ids: string[]) =>
  useQueries({
    queries: ids.map((id) => ({
      queryKey: ['forensics', id],
      queryFn: () => getJson(`forensics/${id}.json`, ForensicsSchema),
      ...STATIC,
    })),
  })

export const useValidation = (path: string | null | undefined) =>
  useQuery({ queryKey: ['validation', path], queryFn: () => getJson(path as string, ValidationSchema), enabled: !!path, ...STATIC })

export const useReferences = (path: string | null | undefined) =>
  useQuery({
    queryKey: ['references', path],
    queryFn: () => getJson(path as string, ReferencesSchema, true),
    enabled: !!path,
    ...STATIC,
  })

export const useDecisoes = (path: string | null | undefined) =>
  useQuery({
    queryKey: ['decisoes', path],
    queryFn: () => getJson(path as string, DecisoesSchema, true),
    enabled: !!path,
    ...STATIC,
  })

export const useExposicao = (path: string | null | undefined) =>
  useQuery({
    queryKey: ['exposicao', path],
    queryFn: () => getJson(path as string, ExposicaoSchema, true),
    enabled: !!path,
    ...STATIC,
  })

export const useHistoria = (path: string | null | undefined) =>
  useQuery({
    queryKey: ['historia', path],
    queryFn: () => getJson(path as string, HistoriaSchema, true),
    enabled: !!path,
    ...STATIC,
  })

export const useTerritorios = (path: string | null | undefined) =>
  useQuery({
    queryKey: ['territorios', path],
    queryFn: () => getJson(path as string, TerritoriosSchema, true),
    enabled: !!path,
    ...STATIC,
  })

import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { EleicoesTimelineSchema } from './schemas'

const STATIC = { staleTime: Number.POSITIVE_INFINITY, gcTime: Number.POSITIVE_INFINITY, retry: 1 } as const

export const useEleicoesTimeline = (enabled = true) =>
  useQuery({ queryKey: ['eleicoes-timeline'], queryFn: () => getJson('eleicoes_timeline.json', EleicoesTimelineSchema, true), enabled, ...STATIC })

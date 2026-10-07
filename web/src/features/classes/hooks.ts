import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { ClassesSchema } from './schemas'

const STATIC = { staleTime: Number.POSITIVE_INFINITY, gcTime: Number.POSITIVE_INFINITY, retry: 1 } as const

export const useClasses = () =>
  useQuery({ queryKey: ['classes-interesses'], queryFn: () => getJson('classes_interesses.json', ClassesSchema, true), ...STATIC })

import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { ClimaRsSchema } from './schemas'

/** 1,2 MB: só carrega quando a camada ou um município do RS pede. */
export const useClimaRs = (enabled: boolean) =>
  useQuery({ queryKey: ['clima-rs'], queryFn: () => getJson('clima_rs_municipal.json', ClimaRsSchema, true), enabled, staleTime: Number.POSITIVE_INFINITY, retry: 1 })

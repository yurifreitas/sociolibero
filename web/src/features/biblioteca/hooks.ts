import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/http'
import { TextosIndexSchema } from './schemas'

const STATIC = { staleTime: Number.POSITIVE_INFINITY, gcTime: Number.POSITIVE_INFINITY, retry: 1 } as const

/** `enabled=false` deixa a paleta de comandos carregar o índice só quando alguém busca. */
export const useTextosIndex = (enabled = true) =>
  useQuery({ queryKey: ['textos-index'], queryFn: () => getJson('textos_index.json', TextosIndexSchema, true), enabled, ...STATIC })

/** Texto integral (arquivo .txt estático, sob demanda). */
export const useTextoBruto = (arquivo: string | null | undefined) =>
  useQuery({
    queryKey: ['texto-bruto', arquivo],
    enabled: !!arquivo,
    ...STATIC,
    queryFn: async () => {
      const url = `${import.meta.env.BASE_URL}${arquivo}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Falha ao carregar ${arquivo} (HTTP ${res.status}).`)
      const t = await res.text()
      // o SPA fallback devolve HTML com 200: um texto da biblioteca sempre tem o marcador
      if (!/^=== TEXTO ===$/m.test(t)) throw new Error(`${arquivo} não tem o formato da biblioteca (falta a linha “=== TEXTO ===”).`)
      return t
    },
  })

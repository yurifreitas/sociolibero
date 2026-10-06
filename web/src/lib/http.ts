import type { ZodType } from 'zod'

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly url: string,
  ) {
    super(message)
  }
}

export const dataUrl = (path: string) => `${import.meta.env.BASE_URL}data/${path}`

/** Cliente único: busca JSON e valida com zod. 404 vira `null` quando `optional`. */
export async function getJson<T>(path: string, schema: ZodType<T>, optional?: false): Promise<T>
export async function getJson<T>(path: string, schema: ZodType<T>, optional: true): Promise<T | null>
export async function getJson<T>(path: string, schema: ZodType<T>, optional = false): Promise<T | null> {
  const url = dataUrl(path)
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    throw new HttpError('Sem conexão com a origem dos dados.', null, url)
  }
  if (res.status === 404 && optional) return null
  if (!res.ok) throw new HttpError(`Falha ao carregar ${path} (HTTP ${res.status}).`, res.status, url)
  let json: unknown
  try {
    json = await res.json()
  } catch {
    // SPA fallback devolve HTML com 200: trate como ausente quando opcional
    if (optional) return null
    throw new HttpError(`${path} não é JSON válido.`, res.status, url)
  }
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    throw new HttpError(
      `${path} fora do contrato de dados: ${first ? `${first.path.join('.')} — ${first.message}` : 'formato inesperado'}.`,
      res.status,
      url,
    )
  }
  return parsed.data
}

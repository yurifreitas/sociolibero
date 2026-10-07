import type { Eleicao, Movimento, Revisao } from './schemas'

export const ANO_MIN = 1532
export const ANO_MAX = new Date().getFullYear() + 1

export const TIPOS = [
  { key: 'geral', label: 'Geral' },
  { key: 'indireta', label: 'Indireta' },
  { key: 'municipal', label: 'Municipal' },
  { key: 'constituinte', label: 'Constituinte' },
  { key: 'plebiscito', label: 'Plebiscito' },
] as const
export type TipoKey = (typeof TIPOS)[number]['key']

export const ESPECTROS = [
  { key: 'esquerda', label: 'Esquerda' },
  { key: 'centro', label: 'Centro' },
  { key: 'direita', label: 'Direita' },
  { key: 'transversal', label: 'Transversal' },
  { key: 'n/a', label: 'Sem posição' },
] as const
export type EspectroKey = (typeof ESPECTROS)[number]['key']
export const espectroLabel = (k: string | null | undefined) => ESPECTROS.find((e) => e.key === k)?.label ?? 'Sem posição'

/** Faixas de regime: convenção editorial para orientar a leitura, não periodização historiográfica única. */
export const REGIMES: { key: string; label: string; from: number; to: number }[] = [
  { key: 'colonia', label: 'Colônia', from: 1500, to: 1822 },
  { key: 'imperio', label: 'Império', from: 1822, to: 1889 },
  { key: 'rv', label: 'República Velha', from: 1889, to: 1930 },
  { key: 'vargas', label: 'Era Vargas', from: 1930, to: 1946 },
  { key: 'r46', label: 'República de 1946', from: 1946, to: 1964 },
  { key: 'ditadura', label: 'Ditadura civil-militar', from: 1964, to: 1985 },
  { key: 'nr', label: 'Nova República', from: 1985, to: ANO_MAX },
]
export const regimeDoAno = (ano: number) => REGIMES.find((r) => ano >= r.from && ano < r.to) ?? REGIMES[REGIMES.length - 1]!

export const EPOCAS: { key: string; label: string; from: number; to: number }[] = [
  { key: 'tudo', label: 'Tudo (1532–hoje)', from: 1520, to: ANO_MAX },
  { key: 'imperio', label: 'Colônia e Império', from: 1520, to: 1890 },
  { key: 'rv', label: 'República Velha', from: 1885, to: 1935 },
  { key: 'vargas', label: 'Vargas e 1946', from: 1928, to: 1966 },
  { key: 'ditadura', label: 'Ditadura e transição', from: 1962, to: 1990 },
  { key: 'nr', label: 'Nova República', from: 1984, to: ANO_MAX },
]

const anos4 = (s: string) => (s.match(/\b1[5-9]\d\d\b|\b20\d\d\b/g) ?? []).map(Number)
/** “1850-1888”, “1960-presente”, “1932-1937 (e PRP até 1965)”, “2013”. */
export function parsePeriodo(p: string | null | undefined): [number, number] | null {
  if (!p) return null
  const ys = anos4(p.replace(/\(.*\)/, ''))
  if (ys.length === 0) return null
  const a = ys[0] as number
  if (/presente|hoje|atual/i.test(p)) return [a, ANO_MAX]
  const b = ys.length > 1 ? (ys[ys.length - 1] as number) : a
  return [Math.min(a, b), Math.max(a, b) + (a === b ? 0.9 : 0.9)]
}

export const anoDe = (e: Eleicao) => {
  const m = e.data?.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/)
  if (!m) return e.ano
  return Number(m[1]) + ((Number(m[2] ?? 6) - 1) / 12 + (Number(m[3] ?? 15) - 1) / 365) / 1
}

export const fmtVal = (x: unknown): string => {
  if (x == null) return '—'
  if (typeof x === 'number') return new Intl.NumberFormat('pt-BR').format(x)
  if (typeof x === 'string') return x
  return JSON.stringify(x)
}

export const nCampo = (c: string | null | undefined) => (c ?? '—').replace(/_/g, ' ').replace(/\./g, ' › ')

export const votos = (v: number | string | null | undefined) => (typeof v === 'number' ? new Intl.NumberFormat('pt-BR').format(v) : (v ?? '—'))

/** Registros de revisão agrupados por id (eleição ou documento alterado). */
export function revisoesPorId(rs: Revisao[] | null | undefined) {
  const m = new Map<string, Revisao[]>()
  for (const r of rs ?? []) m.set(r.id, [...(m.get(r.id) ?? []), r])
  return m
}

export const movimentoAno = (m: Movimento) => parsePeriodo(m.periodo)

export type RuleMark = { ano: number; label: string; eleicao?: string }
/** Marcos que o usuário pediu no gráfico do eleitorado. Os rótulos vêm do texto da regra, não de números digitados aqui. */
export const MARCOS: { ano: number; rotulo: string }[] = [
  { ano: 1881, rotulo: 'Lei Saraiva' },
  { ano: 1891, rotulo: 'CF/1891 exclui analfabetos' },
  { ano: 1932, rotulo: 'Voto feminino' },
  { ano: 1985, rotulo: 'EC 25 (analfabetos)' },
  { ano: 1988, rotulo: 'CF/1988' },
]

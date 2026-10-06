// OKLCH → sRGB e paletas pré-computadas (LUT de 256 passos) para o mapa e gráficos.
export type Rgb = readonly [number, number, number]

const lin2srgb = (c: number) => {
  const v = Math.min(1, Math.max(0, c))
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
}

export function oklchToRgb(L: number, C: number, hDeg: number): Rgb {
  const h = (hDeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return [Math.round(lin2srgb(r) * 255), Math.round(lin2srgb(g) * 255), Math.round(lin2srgb(bl) * 255)]
}

export const rgbCss = (c: Rgb) => `rgb(${c[0]} ${c[1]} ${c[2]})`
export type Theme = 'light' | 'dark'
export type ScaleKind = 'seq' | 'warm' | 'div' | 'earth'
export const LUT_SIZE = 256

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Sequencial de um hue: claro→escuro no tema claro; escuro→claro no escuro (L monotônico). */
function seqLut(hue: number, theme: Theme, chroma: number): Rgb[] {
  const [L0, L1] = theme === 'light' ? [0.96, 0.34] : [0.27, 0.86]
  return Array.from({ length: LUT_SIZE }, (_, i) => {
    const t = i / (LUT_SIZE - 1)
    const c = chroma * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.9)) + 0.015
    return oklchToRgb(lerp(L0, L1, t), c, lerp(hue - 8, hue + 8, t))
  })
}

/** Divergente azul (neg) — neutro — laranja (pos): seguro para daltonismo vermelho/verde. */
function divLut(theme: Theme): Rgb[] {
  const [Lmid, Lend] = theme === 'light' ? [0.96, 0.42] : [0.26, 0.82]
  return Array.from({ length: LUT_SIZE }, (_, i) => {
    const t = (i / (LUT_SIZE - 1)) * 2 - 1
    const k = Math.abs(t)
    const hue = t < 0 ? 252 : 52
    const chroma = 0.17 * Math.sin((Math.PI * Math.min(1, k + 0.05)) / 2) ** 0.8
    return oklchToRgb(lerp(Lmid, Lend, k ** 0.9), chroma, hue)
  })
}

const cache = new Map<string, Rgb[]>()
export function lut(kind: ScaleKind, theme: Theme): Rgb[] {
  const key = `${kind}-${theme}`
  let v = cache.get(key)
  if (!v) {
    v = kind === 'seq' ? seqLut(262, theme, 0.15) : kind === 'warm' ? seqLut(48, theme, 0.15) : kind === 'earth' ? seqLut(158, theme, 0.12) : divLut(theme)
    cache.set(key, v)
  }
  return v
}

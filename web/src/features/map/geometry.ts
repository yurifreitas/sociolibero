import { geoArea, geoMercator, geoPath, type GeoContext } from 'd3-geo'
import type { GeoCollection } from '@/features/data/schemas'
import { LUT_SIZE, lut, rgbCss, type Theme } from '@/lib/color'
import type { Domain } from './metrics'

export const BASE = 1000 // lado do espaço de projeção (unidades de mundo)
const CELL = 16

export interface MapFeature {
  ibge: string
  nome: string
  uf: string
  path: Path2D
  bbox: readonly [number, number, number, number]
}

export interface MapGeometry {
  features: MapFeature[]
  indexByIbge: Map<string, number>
  strokeAll: Path2D
  grid: Map<number, number[]>
  gridW: number
}

type Ring = number[][]
const reverseRings = (rings: Ring[]) => rings.map((r) => [...r].reverse())

/** d3-geo espera anéis externos no sentido horário (oposto ao RFC 7946, que o IBGE segue):
 *  com o sentido errado, cada município vira "o globo menos o polígono". Reenrola só se preciso. */
function rewound<T extends GeoCollection['features'][number]>(f: T): T {
  if (geoArea(f as never) <= 2 * Math.PI) return f
  const g = f.geometry
  const coordinates = g.type === 'Polygon' ? reverseRings(g.coordinates as Ring[]) : (g.coordinates as Ring[][]).map(reverseRings)
  return { ...f, geometry: { ...g, coordinates } }
}

function lonLatBounds(features: GeoCollection['features']) {
  let minLon = 180, minLat = 90, maxLon = -180, maxLat = -90
  const visit = (c: unknown): void => {
    if (typeof (c as number[])[0] === 'number') {
      const [lon, lat] = c as number[]
      minLon = Math.min(minLon, lon as number); maxLon = Math.max(maxLon, lon as number)
      minLat = Math.min(minLat, lat as number); maxLat = Math.max(maxLat, lat as number)
    } else for (const x of c as unknown[]) visit(x)
  }
  for (const f of features) visit(f.geometry.coordinates)
  return { minLon, minLat, maxLon, maxLat }
}

export function buildGeometry(source: GeoCollection): MapGeometry {
  const geo = { ...source, features: source.features.map(rewound) }
  const b = lonLatBounds(geo.features)
  const projection = geoMercator().fitExtent(
    [
      [8, 8],
      [BASE - 8, BASE - 8],
    ],
    {
      type: 'MultiPoint',
      coordinates: [
        [b.minLon, b.minLat],
        [b.maxLon, b.maxLat],
      ],
    } as never,
  )
  const features: MapFeature[] = []
  const strokeAll = new Path2D()
  const gridW = Math.ceil(BASE / CELL)
  const grid = new Map<number, number[]>()

  geo.features.forEach((f, i) => {
    const p = new Path2D()
    const ctx: GeoContext = {
      beginPath() {},
      moveTo: (x, y) => p.moveTo(x, y),
      lineTo: (x, y) => p.lineTo(x, y),
      arc: (x, y, r, a0, a1) => p.arc(x, y, r, a0, a1),
      closePath: () => p.closePath(),
    }
    const gp = geoPath(projection, ctx)
    gp(f as never)
    const [[x0, y0], [x1, y1]] = gp.bounds(f as never)
    features.push({ ibge: f.properties.ibge, nome: f.properties.nome, uf: f.properties.uf, path: p, bbox: [x0, y0, x1, y1] })
    strokeAll.addPath(p)
    if ([x0, y0, x1, y1].every(Number.isFinite)) {
      const cx0 = Math.max(0, Math.floor(x0 / CELL))
      const cx1 = Math.min(gridW - 1, Math.floor(x1 / CELL))
      const cy0 = Math.max(0, Math.floor(y0 / CELL))
      const cy1 = Math.min(gridW - 1, Math.floor(y1 / CELL))
      for (let cy = cy0; cy <= cy1; cy++)
        for (let cx = cx0; cx <= cx1; cx++) {
          const key = cy * gridW + cx
          const arr = grid.get(key)
          if (arr) arr.push(i)
          else grid.set(key, [i])
        }
    }
  })
  return { features, indexByIbge: new Map(features.map((f, i) => [f.ibge, i])), strokeAll, grid, gridW }
}

let probe: CanvasRenderingContext2D | null = null
/** Município sob o ponto (coordenadas de mundo): grade espacial + isPointInPath exato. */
export function hitTest(g: MapGeometry, x: number, y: number): number {
  const cx = Math.floor(x / CELL)
  const cy = Math.floor(y / CELL)
  if (cx < 0 || cy < 0 || cx >= g.gridW || cy >= g.gridW) return -1
  const cand = g.grid.get(cy * g.gridW + cx)
  if (!cand) return -1
  probe ??= document.createElement('canvas').getContext('2d')
  if (!probe) return -1
  for (let k = cand.length - 1; k >= 0; k--) {
    const i = cand[k] as number
    const f = g.features[i] as MapFeature
    const b = f.bbox
    if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue
    if (probe.isPointInPath(f.path, x, y, 'evenodd')) return i
  }
  return -1
}

export const NODATA_BIN = LUT_SIZE

export interface FillPlan {
  bins: Path2D[]
  colors: string[]
  /** bin de cor de cada município (para desenhar só os visíveis quando há zoom) */
  featureBin: Uint16Array
}

/** Agrupa os municípios em ≤257 Path2D por cor: 257 fills por quadro em vez de 5570. */
export function buildFillPlan(g: MapGeometry, values: Float64Array, domain: Domain, theme: Theme, nodata: string): FillPlan {
  const bins = Array.from({ length: LUT_SIZE + 1 }, () => new Path2D())
  const featureBin = new Uint16Array(g.features.length)
  const span = domain.max - domain.min || 1
  const lmin = Math.log1p(domain.min)
  const lspan = Math.log1p(domain.max) - lmin || 1
  for (let i = 0; i < g.features.length; i++) {
    const v = values[i] as number
    let b = NODATA_BIN
    if (!Number.isNaN(v)) {
      const t = domain.log ? (Math.log1p(Math.max(v, 0)) - lmin) / lspan : (v - domain.min) / span
      b = Math.min(LUT_SIZE - 1, Math.max(0, Math.round(t * (LUT_SIZE - 1))))
    }
    featureBin[i] = b
    bins[b]?.addPath((g.features[i] as MapFeature).path)
  }
  const colors = lut(domain.kind, theme).map(rgbCss)
  colors.push(nodata)
  return { bins, colors, featureBin }
}

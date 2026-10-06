import { LUT_SIZE, lut, rgbCss } from '@/lib/color'
import { fInt } from '@/lib/format'
import { useTheme } from '@/lib/theme'
import styles from './FingerprintHeatmap.module.css'

export type Fingerprint = { x_bins: number[]; y_bins: number[]; contagem: number[][] }
const W = 560
const H = 420
const M = { l: 52, r: 12, t: 12, b: 44 }

const span = (bins: number[], n: number): [number, number] => {
  const first = bins[0] ?? 0
  const last = bins[bins.length - 1] ?? 1
  if (bins.length === n + 1) return [first, last]
  const half = n > 1 ? (last - first) / (n - 1) / 2 : 0
  return [first - half, last + half]
}

export function FingerprintHeatmap({ fp }: { fp: Fingerprint }) {
  const { effective } = useTheme()
  // contagem[i][j]: i indexa x_bins (comparecimento), j indexa y_bins (voto no mais votado)
  const cols = fp.contagem.length
  const rows = fp.contagem[0]?.length ?? 0
  if (rows === 0 || cols === 0) return <p className={styles.muted}>Sem dados para a impressão digital.</p>
  const colors = lut('seq', effective)
  const max = Math.max(1, ...fp.contagem.flat())
  const [x0, x1] = span(fp.x_bins, cols)
  const [y0, y1] = span(fp.y_bins, rows)
  const asPct = Math.max(Math.abs(x1), Math.abs(y1)) <= 1.5
  const scale = asPct ? 100 : 1
  const cw = (W - M.l - M.r) / cols
  const ch = (H - M.t - M.b) / rows
  const ticks = [0, 0.25, 0.5, 0.75, 1]
  const total = fp.contagem.flat().reduce((a, b) => a + b, 0)
  return (
    <figure className={styles.fig}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Impressão digital: densidade de ${fInt(total)} unidades por comparecimento e voto no mais votado`} className={styles.svg}>
        {fp.contagem.map((col, c) =>
          col.map((v, r) =>
            v > 0 ? (
              <rect
                key={`${r}-${c}`}
                x={M.l + c * cw}
                y={H - M.b - (r + 1) * ch}
                width={cw + 0.5}
                height={ch + 0.5}
                fill={rgbCss(colors[Math.round((Math.log1p(v) / Math.log1p(max)) * (LUT_SIZE - 1))] as never)}
              >
                <title>{`comparecimento ${(x0 + ((c + 0.5) / cols) * (x1 - x0)) * scale | 0}% · voto ${(y0 + ((r + 0.5) / rows) * (y1 - y0)) * scale | 0}% — ${fInt(v)}`}</title>
              </rect>
            ) : null,
          ),
        )}
        {ticks.map((t) => (
          <g key={t}>
            <text x={M.l + t * (W - M.l - M.r)} y={H - M.b + 18} textAnchor="middle" className={styles.tick}>
              {Math.round((x0 + t * (x1 - x0)) * scale)}%
            </text>
            <text x={M.l - 8} y={H - M.b - t * (H - M.t - M.b) + 4} textAnchor="end" className={styles.tick}>
              {Math.round((y0 + t * (y1 - y0)) * scale)}%
            </text>
          </g>
        ))}
        <text x={M.l + (W - M.l - M.r) / 2} y={H - 6} textAnchor="middle" className={styles.axis}>
          comparecimento
        </text>
        <text transform={`translate(12 ${M.t + (H - M.t - M.b) / 2}) rotate(-90)`} textAnchor="middle" className={styles.axis}>
          voto no mais votado
        </text>
      </svg>
      <figcaption className={styles.cap}>
        Cor = nº de unidades (escala logarítmica, máx. {fInt(max)}). Distribuições limpas formam uma massa compacta; caudas ou
        “ilhas” nos cantos superiores direito merecem conferência, não conclusão.
      </figcaption>
    </figure>
  )
}

// Gera dados de MOCK no formato de docs/DATA_CONTRACT.md para desenvolver o frontend
// sem o pipeline. Nunca sobrescreve arquivos reais: só (re)escreve o que não existe ou
// que carrega a marca `mock: true`.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'public', 'data')
const CACHE = join(ROOT, 'scripts', '.cache')
for (const d of [DATA, join(DATA, 'geo'), join(DATA, 'elections'), join(DATA, 'forensics'), CACHE])
  mkdirSync(d, { recursive: true })

const IBGE_MESH =
  'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo%2Bjson&qualidade=minima&intrarregiao=municipio'
const IBGE_NAMES = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios'

const isMock = (path) => {
  if (!existsSync(path)) return true
  try {
    const j = JSON.parse(readFileSync(path, 'utf8'))
    return j.mock === true || j.meta?.mock === true
  } catch {
    return true
  }
}
const write = (rel, obj) => {
  const path = join(DATA, rel)
  if (!isMock(path)) {
    console.log(`  = ${rel} (real, mantido)`)
    return false
  }
  writeFileSync(path, JSON.stringify(obj))
  console.log(`  + ${rel}`)
  return true
}
async function cached(name, url) {
  const p = join(CACHE, name)
  if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'))
  console.log(`  baixando ${url}`)
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} -> ${r.status}`)
  const text = await r.text()
  writeFileSync(p, text)
  return JSON.parse(text)
}

// ---------- geo ----------
const geoPath = join(DATA, 'geo', 'municipios.geojson')
let geo
if (existsSync(geoPath)) {
  geo = JSON.parse(readFileSync(geoPath, 'utf8'))
  console.log('  = geo/municipios.geojson (existente, mantido)')
} else {
  geo = await cached('malha.json', IBGE_MESH)
  const names = await cached('nomes.json', IBGE_NAMES)
  const byId = new Map(
    names.map((m) => [
      String(m.id),
      {
        nome: m.nome,
        uf: m.microrregiao?.mesorregiao?.UF?.sigla ?? m['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla ?? '??',
      },
    ]),
  )
  geo.features = geo.features.map((f) => {
    const ibge = String(f.properties.codarea ?? f.properties.ibge)
    const n = byId.get(ibge) ?? { nome: ibge, uf: '??' }
    return { type: 'Feature', properties: { ibge, nome: n.nome, uf: n.uf }, geometry: f.geometry }
  })
  writeFileSync(geoPath, JSON.stringify(geo))
  console.log('  + geo/municipios.geojson')
}

// ---------- util ----------
const mulberry32 = (a) => () => {
  a |= 0
  a = (a + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const gauss = (r) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r())
const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
const centroid = (g) => {
  const ring = g.type === 'Polygon' ? g.coordinates[0] : g.coordinates[0][0]
  let x = 0
  let y = 0
  for (const [lon, lat] of ring) {
    x += lon
    y += lat
  }
  return [x / ring.length, y / ring.length]
}

const places = geo.features.map((f) => {
  const [lon, lat] = centroid(f.geometry)
  return { ibge: f.properties.ibge, uf: f.properties.uf, lon, lat }
})

// ---------- eleições ----------
const SPECS = [
  { id: 'pres_2022_t1', ano: 2022, turno: 1, seed: 11, cands: [[13, 'LULA (MOCK)', 'PT'], [22, 'CANDIDATO B (MOCK)', 'PL'], [12, 'CANDIDATO C (MOCK)', 'PDT'], [15, 'CANDIDATA D (MOCK)', 'MDB']] },
  { id: 'pres_2022_t2', ano: 2022, turno: 2, seed: 12, cands: [[13, 'LULA (MOCK)', 'PT'], [22, 'CANDIDATO B (MOCK)', 'PL']] },
  { id: 'pres_2026_t1', ano: 2026, turno: 1, seed: 13, cands: [[13, 'LULA (MOCK)', 'PT'], [22, 'CANDIDATO B (MOCK)', 'PL'], [12, 'CANDIDATO C (MOCK)', 'PDT']] },
]
const now = new Date().toISOString()

function buildElection(spec) {
  const linhas = {}
  for (const p of places) {
    const r = mulberry32(Number(p.ibge) * 31 + spec.seed)
    const ne = Math.exp(-((p.lon + 40) ** 2 / 70 + (p.lat + 10) ** 2 / 60))
    const sul = p.lat < -22 ? 0.12 : 0
    const drift = spec.ano === 2026 ? -0.03 : 0
    const s13 = clamp(0.36 + 0.42 * ne - sul + drift + gauss(r) * 0.045, 0.05, 0.92)
    const aptos = Math.round(clamp(Math.exp(Math.log(9000) + gauss(r) * 1.3), 700, 9_300_000))
    const turnout = clamp(0.8 - 0.05 * ne + gauss(r) * 0.03, 0.55, 0.96)
    const comparecimento = Math.round(aptos * turnout)
    const brancos = Math.round(comparecimento * clamp(0.012 + gauss(r) * 0.004, 0.002, 0.04))
    const nulos = Math.round(comparecimento * clamp(0.028 + gauss(r) * 0.008, 0.005, 0.08))
    const validos = comparecimento - brancos - nulos
    const w = spec.cands.map(([n], i) => (i === 0 ? s13 : i === 1 ? (1 - s13) * (spec.cands.length === 2 ? 1 : 0.85) : (1 - s13) * (0.15 / (spec.cands.length - 2)) * (0.6 + r())))
    const sum = w.reduce((a, b) => a + b, 0)
    const votos = {}
    let acc = 0
    spec.cands.forEach(([n], i) => {
      const v = i === spec.cands.length - 1 ? validos - acc : Math.round((validos * w[i]) / sum)
      votos[String(n)] = Math.max(0, v)
      acc += votos[String(n)]
    })
    linhas[p.ibge] = { aptos, comparecimento, validos, brancos, nulos, votos }
  }
  return {
    meta: {
      id: spec.id,
      rotulo: `Presidente ${spec.ano} · ${spec.turno}º turno (MOCK)`,
      ano: spec.ano,
      turno: spec.turno,
      cargo: 'Presidente',
      status: 'preliminar',
      mock: true,
      fonte: 'mock://sociolibero/gerado-por-make-mock-data',
      baixado_em: now,
      sha256: 'mock'.padEnd(64, '0'),
      candidatos: spec.cands.map(([numero, nome, partido]) => ({ numero, nome, partido })),
      sem_correspondencia: [],
    },
    linhas,
  }
}

const built = {}
for (const s of SPECS) {
  const e = buildElection(s)
  built[s.id] = e
  write(`elections/${s.id}.json`, e)
}

// ---------- forense ----------
const TESTES = [
  { chave: 'zt', rotulo: 'Comparecimento vs vizinhos', descricao: 'z-score robusto (mediana/MAD) do comparecimento do município contra os municípios vizinhos.', interpretacao: 'Valores extremos indicam comparecimento muito diferente do entorno.', limitacoes: 'Diferenças reais de perfil (rural/urbano, migração) também geram desvios.' },
  { chave: 'zs', rotulo: 'Voto no candidato vs vizinhos', descricao: 'z-score robusto da fatia de votos válidos de cada candidato contra os vizinhos.', interpretacao: 'Desvios altos pedem contexto local antes de qualquer conclusão.', limitacoes: 'Voto é espacialmente heterogêneo; municípios pequenos oscilam muito.' },
  { chave: 'zn', rotulo: 'Brancos + nulos vs vizinhos', descricao: 'z-score robusto da taxa de brancos e nulos contra os vizinhos.', interpretacao: 'Taxa muito acima/abaixo do entorno é um sinal de revisão, não de irregularidade.', limitacoes: 'Depende de escolaridade, tamanho da seção e campanha de voto nulo.' },
  { chave: 'ld_p', rotulo: 'Último dígito das contagens', descricao: 'Qui-quadrado de uniformidade do último dígito dos votos por seção (≥ 30 seções).', interpretacao: 'p baixo indica preferência por certos dígitos.', limitacoes: 'Exige muitas seções; com múltiplos testes, p baixo ocorre por acaso.' },
  { chave: 'b2_p', rotulo: 'Benford (2º dígito)', descricao: 'Aderência do 2º dígito dos votos por seção à Lei de Benford.', interpretacao: 'p baixo indica desvio da distribuição esperada.', limitacoes: 'Benford de 2º dígito é controverso em eleições; seções têm tamanho limitado.' },
  { chave: 'bunching', rotulo: 'Concentração em extremos', descricao: 'Fração de seções com comparecimento ≥ 95% e voto ≥ 95% no vencedor.', interpretacao: 'Valores > 0 em muitas seções são raros e merecem conferência.', limitacoes: 'Seções pequenas e homogêneas podem chegar a esses extremos legitimamente.' },
]
const CONF = (n) => (n >= 200 ? 'alta' : n >= 30 ? 'media' : 'baixa')
function buildForensics(spec) {
  const el = built[spec.id]
  const linhas = {}
  const fx = 25
  const fy = 25
  const cont = Array.from({ length: fx }, () => Array(fy).fill(0)) // cont[x][y]
  for (const p of places) {
    const row = el.linhas[p.ibge]
    const r = mulberry32(Number(p.ibge) * 17 + spec.seed)
    const n_secoes = Math.max(1, Math.round(row.aptos / 280))
    const out = r() < 0.012
    const zt = gauss(r) * 1.1 + (out ? 4 * (r() < 0.5 ? -1 : 1) : 0)
    const zn = gauss(r) * 1.1 + (r() < 0.01 ? 4 : 0)
    const zs = {}
    for (const c of Object.keys(row.votos).slice(0, 2)) zs[c] = gauss(r) * 1.2
    const ld_p = n_secoes >= 30 ? Math.max(1e-6, r() ** (r() < 0.01 ? 4 : 1)) : null
    const b2_p = n_secoes >= 30 ? Math.max(1e-6, r() ** (r() < 0.01 ? 4 : 1)) : null
    const bunching = r() < 0.02 ? +(r() * 0.12).toFixed(3) : 0
    const flags = []
    if (Math.abs(zt) >= 3) flags.push('zt')
    if (Math.abs(zn) >= 3) flags.push('zn')
    if (Object.values(zs).some((z) => Math.abs(z) >= 3)) flags.push('zs')
    if (ld_p !== null && ld_p < 0.001) flags.push('ld_p')
    if (b2_p !== null && b2_p < 0.001) flags.push('b2_p')
    if (bunching > 0.05) flags.push('bunching')
    const mz = Math.max(Math.abs(zt), Math.abs(zn), ...Object.values(zs).map(Math.abs))
    const score = Math.round(clamp(mz * 11 + flags.length * 9, 0, 100))
    linhas[p.ibge] = { n_secoes, zt: +zt.toFixed(2), zs: Object.fromEntries(Object.entries(zs).map(([k, v]) => [k, +v.toFixed(2)])), zn: +zn.toFixed(2), ld_p, b2_p, bunching, score, confianca: CONF(n_secoes), flags }
    const turn = row.comparecimento / row.aptos
    const top = Math.max(...Object.values(row.votos)) / row.validos
    cont[clamp(Math.floor(((turn - 0.5) / 0.5) * fx), 0, fx - 1)][clamp(Math.floor(top * fy), 0, fy - 1)] += 1
  }
  const benford = Array.from({ length: 10 }, (_, d) => {
    let s = 0
    for (let k = 1; k <= 9; k++) s += Math.log10(1 + 1 / (10 * k + d))
    return s
  })
  const rr = mulberry32(spec.seed * 7)
  const N = 480000
  return {
    meta: { id: spec.id, mock: true, testes: TESTES, aviso: 'Anomalia estatística não é prova de fraude.' },
    nacional: {
      fingerprint: { x_bins: Array.from({ length: fx + 1 }, (_, i) => +(0.5 + (0.5 * i) / fx).toFixed(3)), y_bins: Array.from({ length: fy + 1 }, (_, i) => +(i / fy).toFixed(3)), contagem: cont },
      benford_2bl: { digitos: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], observado: benford.map((p) => Math.round(N * p * (1 + gauss(rr) * 0.01))), esperado: benford.map((p) => Math.round(N * p)), p: 0.31 },
      ultimo_digito: { digitos: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], observado: Array.from({ length: 10 }, () => Math.round(N * 0.1 * (1 + gauss(rr) * 0.006))), esperado: Array(10).fill(N / 10), p: 0.52 },
    },
    linhas,
  }
}
for (const s of SPECS.filter((s) => s.id !== 'pres_2022_t2')) write(`forensics/${s.id}.json`, buildForensics(s))

// ---------- validação sintética ----------
const logistic = (x, mid, k) => 1 / (1 + Math.exp(-k * (x - mid)))
const inten = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2]
const det = (mid) => ({ tpr: inten.map((i) => +logistic(Math.log10(i), Math.log10(mid), 3.2).toFixed(3)), fpr: 0.05 })
write('forensics/validacao_sintetica.json', {
  mock: true,
  cenarios: [
    { nome: 'enchimento de urna', intensidade: inten, detectores: { zt: det(0.03), zn: det(0.12), ld_p: det(0.06), b2_p: det(0.1), bunching: det(0.05) } },
    { nome: 'transferência de votos', intensidade: inten, detectores: { zs: det(0.025), zt: det(0.18), b2_p: det(0.15) } },
    { nome: 'ruído de digitação', intensidade: inten, detectores: { ld_p: det(0.02), b2_p: det(0.08) } },
  ],
})

// ---------- index ----------
write('index.json', {
  mock: true,
  gerado_em: now,
  geo: 'geo/municipios.geojson',
  eleicoes: SPECS.map((s) => ({ id: s.id, rotulo: built[s.id].meta.rotulo, ano: s.ano, turno: s.turno, cargo: 'Presidente', status: 'preliminar', municipios: places.length })),
  forense: ['pres_2022_t1', 'pres_2026_t1'],
  validacao_sintetica: 'forensics/validacao_sintetica.json',
  referencias: 'references.json',
})

// ---------- história (placeholders neutros: NÃO descrevem fatos) ----------
const ph = 'Texto de exemplo para desenvolvimento da interface.'
const fonteEx = [{ titulo: 'Fonte de exemplo (MOCK)', url: null, verificado: false }]
const ev = (n, data, periodo, categoria, trilha, extra = {}) => ({
  id: `ev${n}`, data, periodo, categoria, trilha, titulo: `Evento de exemplo ${n} (MOCK)`, resumo: ph,
  impacto_poderes: { executivo: ph, legislativo: ph, judiciario: ph }, controversias: [ph], fontes: fonteEx, ...extra,
})
write('historia.json', {
  meta: { mock: true, aviso: 'Conteúdo de demonstração.' },
  periodos: [
    { id: 'p1', rotulo: 'Período A (MOCK)', inicio: 1900, fim: 1950, regime: 'Regime X', descricao: ph, poderes: { executivo: ph, legislativo: ph, judiciario: ph }, constituicao: ph },
    { id: 'p2', rotulo: 'Período B (MOCK)', inicio: 1950, fim: 1990, regime: 'Regime Y', descricao: ph, poderes: { executivo: ph, legislativo: ph, judiciario: ph }, constituicao: ph },
    { id: 'p3', rotulo: 'Período C (MOCK)', inicio: 1990, fim: null, regime: 'Regime X', descricao: ph, poderes: { executivo: ph, legislativo: ph, judiciario: ph }, constituicao: ph },
  ],
  eventos: [
    ev(1, '1910-05-01', 'p1', 'Categoria 1', 'estado'),
    ev(2, '1922-03-10', 'p1', 'Categoria 2', 'indigena'),
    ev(3, '1935-08-20', 'p1', 'Categoria 1', 'quilombola'),
    ev(4, '1946-02-02', 'p1', 'Categoria 3', 'estado'),
    ev(5, '1960-06-06', 'p2', 'Categoria 2', 'indigena'),
    ev(6, '1962-01-15', 'p2', 'Categoria 1', 'estado'),
    ev(7, '1975-09-09', 'p2', 'cruzamento', undefined, { trilhas: ['estado', 'indigena', 'quilombola'] }),
    ev(8, '1988-10-05', 'p2', 'Categoria 3', 'estado', { trilhas: ['estado', 'indigena'] }),
    ev(9, '1995-04-04', 'p3', 'Categoria 2', 'quilombola'),
    ev(10, '2010-07-07', 'p3', 'Categoria 1', 'estado'),
  ],
  principios: [{ id: 'pr1', titulo: 'Conceito de exemplo (MOCK)', autor: 'Autor de exemplo', ano: 1900, ideia: ph, aplicacao_brasil: ph, fontes: fonteEx }],
  direcoes: [{ id: 'd1', titulo: 'Direção de exemplo (MOCK)', descricao: ph, evidencias: [ph], fontes: fonteEx }],
})

// ---------- territórios (sintético; null = sem dado, zero = valor real) ----------
const tl = {}
for (const p of places) {
  const r = mulberry32(Number(p.ibge) * 7 + 3)
  const row = built.pres_2022_t1.linhas[p.ibge]
  const pop = Math.round(row.aptos * 1.3)
  const k = r()
  const ind = k < 0.12 ? Math.round(pop * Math.min(0.9, -Math.log(r() || 1e-3) * 0.04)) : k < 0.55 ? 0 : null
  const quil = r() < 0.4 ? (r() < 0.5 ? Math.round(pop * Math.min(0.4, -Math.log(r() || 1e-3) * 0.01)) : 0) : null
  tl[p.ibge] = {
    pop_total: pop,
    pop_indigena: ind,
    pop_quilombola: quil,
    pct_indigena: ind == null ? null : +((ind / pop) * 100).toFixed(3),
    pct_quilombola: quil == null ? null : +((quil / pop) * 100).toFixed(3),
    pct_pretos_pardos: r() < 0.95 ? +(30 + r() * 60).toFixed(1) : null,
    ti_n: ind == null ? null : ind > 0 ? 1 + Math.floor(r() * 3) : 0,
    ti_area_ha: ind == null ? null : ind > 0 ? Math.round(Math.exp(5 + r() * 9)) : 0,
    quilombo_n: quil == null ? null : quil > 0 ? 1 + Math.floor(r() * 2) : 0,
    quilombo_area_ha: quil == null ? null : quil > 0 ? Math.round(Math.exp(4 + r() * 6)) : 0,
  }
}
write('territorios.json', { meta: { mock: true, fontes: ['Dados sintéticos (MOCK)'], aviso: 'Dados sintéticos para desenvolvimento.', lacunas: ['Tudo é sintético.'] }, linhas: tl })

console.log('Mock pronto.')

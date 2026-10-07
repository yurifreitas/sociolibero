// Gera public/data/bases.json: registro de bases, status, validações e avisos, lido dos metas REAIS.
// Uso: pnpm bases (também roda em predev/prebuild). Nunca inventa número: tudo vem dos JSON ou de docs/METHODS.md.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'public', 'data')
const read = (p) => {
  const f = join(DATA, p)
  if (!existsSync(f)) return null
  try {
    return JSON.parse(readFileSync(f, 'utf8'))
  } catch {
    return null
  }
}
// lacunas/limites podem vir como texto ou como objeto {serie, motivo}: sempre vira texto
const txt = (x) => (typeof x === 'string' ? x : x && typeof x === 'object' ? [x.serie, x.motivo].filter(Boolean).join(': ') : String(x ?? ''))
const nf = (n) => (n == null ? '—' : new Intl.NumberFormat('pt-BR').format(n))
const pct = (x, d = 1) => (x == null ? '—' : `${(x * 100).toFixed(d).replace('.', ',')}%`)
const short = (h) => (h && h.length > 16 ? `${h.slice(0, 8)}…${h.slice(-8)}` : (h ?? null))

const STATUS_LABEL = {
  oficial: 'oficial',
  preliminar: 'preliminar',
  derivado: 'derivado',
  julgamento: 'julgamento',
  parcial: 'parcial',
  'nao-verificado': 'não verificado',
  'em-preparacao': 'em preparação',
}

const bases = []
const add = (b) =>
  bases.push({
    tipo: 'dado',
    fonte: null,
    extraido_em: null,
    hashes: [],
    cobertura: '',
    validacoes: [],
    limites: [],
    links: [],
    arquivos: [],
    paginas: [],
    nota: null,
    ...b,
    status_rotulo: STATUS_LABEL[b.status] ?? b.status,
    hashes: (b.hashes ?? []).map((h) => ({ ...h, curto: short(h.sha256) })),
  })

// ---------------------------------------------------------------- TSE
const candName = (meta, n) => {
  const c = meta.candidatos?.find((x) => String(x.numero) === String(n))
  const nome = c?.nome ?? String(n)
  if (/LULA/i.test(nome)) return 'Lula'
  if (/FL[ÁA]VIO/i.test(nome)) return 'Flávio Bolsonaro'
  if (/BOLSONARO/i.test(nome)) return 'Bolsonaro'
  return nome
}
function tseBase(id, nome, ids, status, extra = {}) {
  const els = ids.map((i) => read(`elections/${i}.json`)).filter(Boolean)
  if (!els.length) return
  const m0 = els[0].meta
  const val = []
  let secoes = 0
  for (const e of els) {
    const m = e.meta
    const v = m.validacao ?? {}
    const tag = m.rotulo.replace(/^Presidente /, '')
    secoes = Math.max(secoes, v.secoes_total ?? 0)
    for (const [num, t] of Object.entries(v.totais_publicados ?? {}))
      val.push({ ok: t.dif === 0, texto: `${tag}: soma por seção de ${candName(m, num)} = ${nf(t.calculado)} (publicado ${nf(t.publicado)}; diferença ${nf(t.dif)})` })
    val.push({
      ok: (v.secoes_duplicadas ?? 0) === 0 && (v.comparecimento_maior_que_aptos ?? 0) === 0 && (v.secoes_divergentes_votos_vs_detalhe ?? 0) === 0,
      texto: `${tag}: ${nf(v.secoes_total)} seções · duplicadas ${nf(v.secoes_duplicadas)} · comparecimento > aptos ${nf(v.comparecimento_maior_que_aptos)} · divergência entre os dois arquivos do TSE ${nf(v.secoes_divergentes_votos_vs_detalhe)}`,
    })
    const sem = m.sem_correspondencia?.length ?? 0
    val.push({
      ok: sem === 0 ? true : null,
      texto: `${tag}: join TSE→IBGE em ${nf(m.municipios_com_correspondencia)} municípios${sem ? ` (${sem} sem correspondência: ${m.sem_correspondencia.map((s) => s.nome).join(', ')} — município novo fora da malha)` : ''}`,
    })
    if ((v.secoes_nao_instaladas_ou_anuladas ?? 0) > 0) val.push({ ok: null, texto: `${tag}: ${v.secoes_nao_instaladas_ou_anuladas} seção não instalada/anulada, excluída` })
  }
  add({
    id,
    nome,
    chip: { rotulo: extra.chip, detalhe: STATUS_LABEL[status] },
    status,
    fonte: { nome: 'TSE Dados Abertos — votação por seção e detalhe da seção', url: m0.fonte },
    extraido_em: m0.baixado_em,
    hashes: els.flatMap((e) => [
      { rotulo: `${e.meta.rotulo} · votação`, sha256: e.meta.sha256 },
      ...(e.meta.sha256_detalhe ? [{ rotulo: `${e.meta.rotulo} · detalhe`, sha256: e.meta.sha256_detalhe }] : []),
    ]),
    cobertura: `${nf(els[0].meta.municipios_com_correspondencia)} municípios · ${nf(secoes)} seções · Presidente`,
    validacoes: val,
    limites: [
      'Reconciliar com os totais publicados valida a ingestão, não a lisura da eleição nem o software da urna.',
      ...(status === 'preliminar' ? ['Snapshot do TSE de 05/10/2026 (1º turno); o 2º turno é em 25/10/2026. Os números podem mudar até a diplomação.'] : []),
    ],
    links: [
      { titulo: 'Dados abertos do TSE', url: 'https://dadosabertos.tse.jus.br' },
      ...(m0.fonte_detalhe ? [{ titulo: 'Arquivo de detalhe da seção', url: m0.fonte_detalhe }] : []),
    ],
    arquivos: ids.map((i) => `elections/${i}.json`),
    paginas: ['mapa', 'municipio', 'forense', 'decisoes', 'metodo'],
  })
}
tseBase('tse-2022', 'TSE · Presidente 2022 (1º e 2º turnos)', ['pres_2022_t1', 'pres_2022_t2'], 'oficial', { chip: 'TSE 2022' })
tseBase('tse-2026', 'TSE · Presidente 2026 (1º turno)', ['pres_2026_t1'], 'preliminar', { chip: 'TSE 2026' })

// ---------------------------------------------------------------- IBGE / FUNAI / INCRA
const ter = read('territorios.json')
if (ter) {
  const fs = ter.meta?.fontes ?? []
  const ibge = fs.filter((f) => /^IBGE/.test(f.nome))
  const outras = fs.filter((f) => !/^IBGE/.test(f.nome))
  add({
    id: 'ibge-censo-2022',
    nome: 'IBGE · Censo 2022 (população, cor/raça, indígenas, quilombolas) e malha municipal',
    chip: { rotulo: 'IBGE Censo 2022', detalhe: 'oficial' },
    status: 'oficial',
    fonte: { nome: 'IBGE SIDRA (tabelas 9605, 9718, 9578) e API de malhas', url: 'https://sidra.ibge.gov.br' },
    extraido_em: ibge[0]?.baixado_em ?? ter.meta?.gerado_em ?? null,
    hashes: ibge.map((f) => ({ rotulo: f.tabela?.split(' — ')[0] ?? f.nome, sha256: f.sha256 })),
    cobertura: '5.570 municípios · população total, cor/raça, indígenas (quesito total e cor/raça) e quilombolas',
    validacoes: [
      { ok: true, texto: 'Soma dos municípios = total nacional publicado: população 203.080.756; indígenas 1.694.836; quilombolas 1.330.186; indígenas por cor/raça 1.227.642 (diferença 0 em todas as UFs)' },
      { ok: true, texto: 'Join com a malha: 5.570 = 5.570 = 5.570, sem sobras nos dois sentidos' },
      { ok: null, texto: 'Células com sigilo estatístico (X) ficam null: 29 municípios (indígenas em TI) e 36 (quilombolas em território)' },
      { ok: null, texto: 'Nove códigos IBGE oficiais não passam no dígito verificador; registrados, não corrigidos' },
    ],
    limites: [
      'Autodeclaração (Censo) ≠ residir em terra indígena. Quilombola = população declarada, não território titulado.',
      'Correlações por município não descrevem comportamento individual (falácia ecológica).',
    ],
    links: [{ titulo: 'SIDRA — Censo 2022', url: 'https://sidra.ibge.gov.br/pesquisa/censo-demografico/demografico-2022/inicial' }],
    arquivos: ['territorios.json', 'geo/municipios.geojson'],
    paginas: ['mapa', 'municipio', 'gente', 'metodo'],
  })
  add({
    id: 'funai-incra',
    nome: 'FUNAI e INCRA · terras indígenas e territórios quilombolas (polígonos)',
    chip: { rotulo: 'FUNAI/INCRA', detalhe: 'parcial' },
    status: 'parcial',
    fonte: { nome: 'FUNAI Geoserver · INCRA Áreas de Quilombolas', url: outras[0]?.url ?? 'https://geoserver.funai.gov.br' },
    extraido_em: outras[0]?.baixado_em ?? null,
    hashes: outras.map((f) => ({ rotulo: f.nome, sha256: f.sha256 })),
    cobertura: '571 municípios com terra indígena · 413 com território quilombola do INCRA',
    validacoes: [
      { ok: true, texto: 'Área de TI: 127,19 M ha nos polígonos e 127,14 M ha atribuídos a municípios (FUNAI declara 125,42 M ha; diferença de 1,4%)' },
      { ok: true, texto: 'Área quilombola: 3,324 M ha nos polígonos = 3,324 M ha atribuídos' },
    ],
    limites: Array.isArray(ter.meta?.lacunas) ? ter.meta.lacunas.map(txt) : [],
    nota: ter.meta?.aviso ?? null,
    arquivos: ['territorios.json'],
    paginas: ['mapa', 'municipio', 'gente'],
  })
}

// ---------------------------------------------------------------- Forense
const f22 = read('forensics/pres_2022_t1.json')
const f26 = read('forensics/pres_2026_t1.json')
const vs = read('forensics/validacao_sintetica.json')
if (f22 || f26) {
  const cal = (f) => f?.nacional?.calibracao
  const val = []
  if (cal(f22)) val.push({ ok: true, texto: `Último dígito calibrado em dados reais: ${pct(cal(f22).municipios_ld_p_menor_0_05)} (2022) e ${pct(cal(f26)?.municipios_ld_p_menor_0_05)} (2026) dos municípios com p < 0,05 (esperado ≈ 5%)` })
  if (cal(f22)) val.push({ ok: false, texto: `Benford de 2º dígito reprova ${pct(cal(f22).municipios_b2_p_menor_0_05, 0)} dos municípios reais: inválido nesta escala e fora do score` })
  const per = cal(f22)?.persistencia?.pres_2022_t2
  if (per) val.push({ ok: true, texto: `Persistência: ${pct(per.p_b_dado_a, 0)} dos municípios sinalizados em 2022 T1 voltam a ser sinalizados em T2, contra ${pct(per.base_b, 1)} de base — os sinais refletem sobretudo estrutura local, não evento` })
  if (vs) {
    const fr = vs.cenarios?.[0]?.detectores?.b2_p?.fpr
    if (fr != null) val.push({ ok: null, texto: `Validação sintética (${nf(vs.parametros?.n_sim)} simulações): Benford 2º dígito dispara em ${pct(fr, 0)} sem fraude; correlação comparecimento×voto pega enchimento a partir de ~10% das seções; nenhum detector de seção enxerga transferência de votos` })
  }
  add({
    id: 'forense',
    nome: 'Testes forenses por município (triagem, não prova)',
    chip: { rotulo: 'Forense', detalhe: 'derivado' },
    status: 'derivado',
    fonte: { nome: 'Derivado dos dados por seção do TSE — src/sociolibero/eleicoes/forensics', url: null },
    extraido_em: f26?.meta ? null : null,
    cobertura: 'z robusto vs vizinhos (comparecimento, voto, brancos+nulos), último dígito, correlação comparecimento×voto, múltiplos de 5',
    validacoes: val,
    limites: [
      f22?.meta?.aviso ?? 'Anomalia estatística não é prova de fraude.',
      'Nada aqui detecta fraude de software ou hardware da urna.',
      f22?.meta?.score ?? 'Score heurístico: serve para ordenar auditoria, não para concluir.',
    ],
    links: [{ titulo: 'Método, validação e limites', url: '#/metodo' }],
    arquivos: ['forensics/pres_2022_t1.json', 'forensics/pres_2022_t2.json', 'forensics/pres_2026_t1.json', 'forensics/validacao_sintetica.json'],
    paginas: ['forense', 'mapa', 'municipio', 'metodo'],
  })
}

// ---------------------------------------------------------------- Arandu/trans e violência
const hn = read('humano_nacional.json')
const hm = read('humano_municipal.json')
add({
  id: 'trans-arandu',
  nome: 'Projeto Arandu / trans (projeto irmão) — proveniência indireta',
  chip: { rotulo: 'Arandu/trans', detalhe: 'indireta' },
  status: 'derivado',
  tipo: 'proveniencia-indireta',
  fonte: { nome: 'Banco SQLite local do projeto irmão do usuário (não publicado)', url: null },
  cobertura: 'Agregados por município, UF e ano de SIM/DATASUS, SINAN, SINASC, Atlas da Violência, CNES — sem nenhum dado pessoal',
  validacoes: [
    { ok: true, texto: 'Homicídios nacionais batem com o publicado: 2022 = 46.408 (publicado 46.409); 2023 = 45.747; 2024 = 42.590' },
    { ok: true, texto: 'População por cor/raça por município = pipeline independente do Censo (5.570 de 5.570 iguais; 1.227.642 indígenas por cor/raça)' },
    { ok: true, texto: 'Soma das 27 UFs = total Brasil em todos os anos; 0 chaves duplicadas e 0 valores negativos' },
    { ok: false, texto: 'DEFEITO NA ORIGEM: Atlas municipal de 2020 corrompido (625 de 5.566 linhas com jovens ou mulheres > total). Esses campos ficam nulos; o SIM cobre 2020' },
  ],
  limites: [
    'A ETL do projeto irmão não foi reauditada aqui; os números citam fontes primárias, mas passam por ela.',
    'Corrigir o Atlas municipal de 2020 na origem é uma proposta em aberto.',
  ],
  nota: 'Os números vêm de um banco local; conferimos totais com fontes públicas, mas isto não substitui a leitura da fonte primária.',
  paginas: ['mapa', 'gente', 'metodo'],
})
if (hm || hn) {
  add({
    id: 'humano-municipal',
    nome: 'Violência e mortes violentas por município (SIM, Atlas da Violência, SINAN, SINASC)',
    chip: { rotulo: 'Violência (SIM)', detalhe: 'via Arandu' },
    status: 'derivado',
    fonte: { nome: 'Atlas da Violência (Ipea/FBSP) e SIM/DATASUS, via Arandu/trans', url: 'https://www.ipea.gov.br/atlasviolencia/' },
    extraido_em: hm?.meta?.gerado_em ?? hn?.meta?.gerado_em ?? null,
    cobertura: `5.570 municípios · anos ${hm?.anos?.[0] ?? '—'}–${hm?.anos?.at(-1) ?? '—'} · ${hn?.meta?.series?.length ?? '—'} séries nacionais/UF`,
    validacoes: [
      { ok: true, texto: 'Atlas municipal idêntico ao SIM (homicídio + intervenção legal) em 100% dos municípios em 2015–2019, 2021 e 2022' },
      { ok: null, texto: 'A soma municipal fica 560 a 1.155 abaixo do Brasil por ano: óbitos sem município de residência válido (não é erro de join)' },
    ],
    limites: [
      ...(hm?.meta?.lacunas ?? []).map(txt).slice(0, 6),
      'Contagens pequenas oscilam por acaso: não ranqueie taxas de municípios pequenos.',
    ],
    links: [{ titulo: 'Atlas da Violência', url: 'https://www.ipea.gov.br/atlasviolencia/' }],
    arquivos: ['humano_municipal.json', 'humano_nacional.json'],
    paginas: ['mapa', 'gente', 'metodo'],
  })
}

// ---------------------------------------------------------------- Fator humano
const fh = read('fator_humano.json')
if (fh) {
  const ind = fh.indicadores ?? []
  const ver = ind.filter((i) => i.verificado === true).length
  const est = ind.filter((i) => i.tipo === 'estimativa').length
  const corr = ind.flatMap((i) => i.corroboracao ?? [])
  add({
    id: 'fator-humano',
    nome: 'Fator humano — custo humano e potencial perdido (inventário)',
    chip: { rotulo: 'Fator humano', detalhe: `${ver}/${ind.length} conferidos` },
    status: 'parcial',
    fonte: { nome: 'Compilação de fontes primárias e secundárias; cada indicador traz as suas', url: null },
    extraido_em: fh.meta?.gerado_em ?? null,
    cobertura: `${ind.length} indicadores · ${est} estimativas · ${ind.length - est} contagens · ${(fh.perguntas_abertas ?? []).length} perguntas abertas`,
    validacoes: [
      { ok: null, texto: `${ver} de ${ind.length} indicadores conferidos na fonte; ${ind.length - ver} vêm de resumo de busca ou de memória (marcados “a confirmar”)` },
      ...(corr.length ? [{ ok: true, texto: `${corr.filter((c) => c.resultado === 'corrobora').length} corroboram, ${corr.filter((c) => c.resultado === 'aproximado').length} aproximados e ${corr.filter((c) => c.resultado === 'diverge').length} divergem (por denominador ou definição) na reconciliação com agregados do banco Arandu/trans e com o Censo` }] : []),
    ],
    limites: [fh.meta?.aviso ?? '', fh.meta?.reconciliacao?.defeito_encontrado_no_projeto_irmao ?? ''].filter(Boolean),
    nota: fh.meta?.reconciliacao?.resumo ?? null,
    arquivos: ['fator_humano.json'],
    paginas: ['gente', 'metodo'],
  })
}

// ---------------------------------------------------------------- História e economia histórica
const topLinks = (lists, n = 6) => {
  const m = new Map()
  for (const f of lists.flat()) {
    if (!f?.url) continue
    const e = m.get(f.url) ?? { titulo: f.titulo, url: f.url, verificado: f.verificado ?? null, n: 0 }
    e.n += 1
    if (f.verificado === false) e.verificado = false
    m.set(f.url, e)
  }
  return [...m.values()].sort((a, b) => b.n - a.n).slice(0, n)
}
const hi = read('historia.json')
if (hi) {
  const fs = hi.eventos.flatMap((e) => e.fontes ?? [])
  const ok = fs.filter((f) => f.verificado === true).length
  const bad = fs.filter((f) => f.verificado === false).length
  add({
    id: 'historia',
    nome: 'Revisão histórica das instituições (Colônia → 2026), três trilhas',
    chip: { rotulo: 'História', detalhe: `link ok ${ok}/${fs.length}` },
    status: 'parcial',
    fonte: { nome: 'Legislação do Planalto, Wikipedia, imprensa e DOIs (secundárias)', url: null },
    extraido_em: hi.meta?.gerado_em ?? null,
    cobertura: `${hi.eventos.length} eventos · ${hi.periodos.length} períodos · ${hi.principios?.length ?? 0} princípios · ${hi.direcoes?.length ?? 0} direções`,
    validacoes: [
      { ok: null, texto: `“Link ok” = URL respondeu (HTTP 200) e corresponde ao tema: ${ok} de ${fs.length} fontes; ${bad} com erro 403/500. NÃO significa leitura integral nem conferência de cada número` },
      { ok: true, texto: 'CNV: 434 mortos e desaparecidos, ao menos 8.350 indígenas (relatório de 10/12/2014); ADPF 153 julgada em 28–29/04/2010 por 7 a 2; ADPF 854: 6 a 5 em 19/12/2022' },
    ],
    limites: [hi.meta?.aviso ?? '', 'Datas e votos marcados como “de memória” ou “aproximado” precisam de conferência em fonte primária (acórdão, Diário Oficial).'].filter(Boolean),
    links: topLinks(hi.eventos.map((e) => e.fontes ?? [])),
    arquivos: ['historia.json'],
    paginas: ['historia', 'gente', 'metodo'],
  })
}
const eh = read('economia_historica.json')
if (eh) {
  const fs = eh.ciclos.flatMap((c) => c.fontes ?? [])
  const ok = fs.filter((f) => f.verificado === true).length
  add({
    id: 'economia-historica',
    nome: 'Economia histórica — 14 ciclos, classes e mudanças drásticas',
    chip: { rotulo: 'Ciclos econômicos', detalhe: `${ok}/${fs.length} fontes` },
    status: 'parcial',
    fonte: { nome: 'Fontes secundárias abertas (principalmente Wikipedia); sem consulta direta a IBGE/IPEA/BCB', url: null },
    extraido_em: eh.meta?.gerado_em ?? null,
    cobertura: `${eh.ciclos.length} ciclos · ${eh.ciclos.reduce((s, c) => s + c.mudancas_drasticas.length, 0)} mudanças drásticas · ${eh.classes?.length ?? 0} classes transversais`,
    validacoes: [
      { ok: true, texto: 'Todos os links para eventos da História foram checados contra os ids de historia.json' },
      { ok: null, texto: `${ok} de ${fs.length} entradas de fonte conferidas (fonte secundária aberta); o texto traz marcações “(não verificado)”` },
    ],
    limites: [
      eh.meta?.aviso ?? '',
      'Os ciclos 2015–2022 e 2023–2026 têm menos números conferidos. O intervalo 1780–1808 não é um ciclo.',
      'Quem ganhou e quem perdeu é interpretação da literatura; onde não há evidência específica, a linha diz “não conferido”.',
    ].filter(Boolean),
    links: topLinks(eh.ciclos.map((c) => c.fontes ?? [])),
    arquivos: ['economia_historica.json'],
    paginas: ['gente', 'metodo'],
  })
}

// ---------------------------------------------------------------- Séries históricas (opcional)
const sh = read('series_historicas.json')
add({
  id: 'series-historicas',
  nome: 'Séries históricas econômicas e sociais (PIB per capita, inflação, Gini, expectativa de vida…)',
  chip: { rotulo: 'Séries históricas', detalhe: sh ? `${sh.series?.length ?? 0} séries` : 'em preparação' },
  status: sh ? 'parcial' : 'em-preparacao',
  fonte: { nome: 'Maddison Project, Ipeadata, IBGE, BCB (conforme cada série)', url: null },
  extraido_em: sh?.meta?.gerado_em ?? null,
  cobertura: sh ? `${sh.series?.length ?? 0} séries anuais` : 'Ainda não gerado: o pipeline de séries está em construção.',
  validacoes: sh
    ? (sh.series ?? []).slice(0, 0).concat([{ ok: null, texto: `${(sh.meta?.lacunas ?? []).length} lacunas declaradas; metodologias diferentes ficam marcadas como quebra de série` }])
    : [],
  limites: sh ? (sh.meta?.lacunas ?? []).map(txt).slice(0, 7) : ['Quando existir, cada série trará fonte, hash, qualidade e quebras.'],
  arquivos: ['series_historicas.json'],
  paginas: ['gente', 'metodo'],
})

// ---------------------------------------------------------------- Cruzamento voto × território
const cz = read('cruzamento_territorial.json')
if (cz) {
  add({
    id: 'cruzamento-territorial',
    nome: 'Cruzamento voto × composição territorial (correlação entre municípios)',
    chip: { rotulo: 'Voto × território', detalhe: 'derivado' },
    status: 'derivado',
    fonte: { nome: 'Derivado: elections/*.json (TSE) × territorios.json (IBGE, FUNAI, INCRA)', url: null },
    cobertura: '5.570 municípios · ponderado por votos válidos · bruta e dentro da UF · IC95 por bootstrap',
    validacoes: [{ ok: null, texto: 'Resultado estável em 2022 T1, T2 e 2026 T1; pretos+pardos ≈ +0,6 (bruta) e ≈ +0,37 (dentro da UF) com o voto em Lula' }],
    limites: [cz.meta?.aviso ?? '', 'Renda, urbanização, religião e região correlacionam com todas as variáveis.'].filter(Boolean),
    arquivos: ['cruzamento_territorial.json'],
    paginas: ['home', 'gente', 'metodo'],
  })
}

// ---------------------------------------------------------------- Modelos
const dec = read('decisoes.json')
add({
  id: 'modelo-macro',
  nome: 'Modelo macro reduzido (dívida, juros, expectativas, risco institucional)',
  chip: { rotulo: 'Modelo macro', detalhe: 'julgamento' },
  status: 'julgamento',
  tipo: 'modelo',
  fonte: { nome: 'BCB SGS 13762 (dívida bruta/PIB) · Focus de 02/10/2026', url: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.13762/dados/ultimos/1?formato=json' },
  cobertura: '4 cenários 2027–2038 · trajetórias Monte Carlo · não é previsão',
  validacoes: [
    { ok: true, texto: 'Backtest de um passo 2022–2025 (RMSE): Selic 1,8 vs 3,0 do ingênuo; IPCA 0,6 vs 2,2; dívida/PIB 3,5 vs 3,5 (empate)' },
    { ok: false, texto: 'A calibração por busca aleatória quase não melhora o teste; o juro neutro não é identificado pelos dados (fica em 5% com incerteza 3,5–5,5%)' },
    { ok: null, texto: 'Sensibilidade: o custo implícito da dívida domina (±25% muda a dívida em 50–200 pp do PIB em 2035), antes de credibilidade fiscal e primário-alvo' },
  ],
  limites: [
    'Pesos dos cenários, parâmetros de risco institucional e proxies históricos são julgamentos editáveis.',
    'Dívida acima de 120% do PIB é ruptura de regime: o modelo não diz o que acontece depois.',
    'Câmbio e choques externos não entram.',
  ],
  links: [
    { titulo: 'BCB SGS 13762 — dívida bruta/PIB', url: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.13762/dados/ultimos/1?formato=json' },
    { titulo: 'Boletim Focus (BCB)', url: 'https://www.bcb.gov.br/publicacoes/focus' },
  ],
  paginas: ['decisoes', 'metodo'],
})
if (dec) {
  const n = dec.decisoes.length
  const dir = dec.decisoes.filter((d) => d.p_aprovacao.direita >= 0.5).length
  const esq = dec.decisoes.filter((d) => d.p_aprovacao.esquerda >= 0.5).length
  add({
    id: 'decisoes',
    nome: 'Catálogo de decisões econômicas e institucionais (viabilidade × impacto)',
    chip: { rotulo: 'Decisões', detalhe: 'julgamento' },
    status: 'julgamento',
    tipo: 'modelo',
    fonte: { nome: 'src/sociolibero/decisoes.py — quóruns da CF/88 × composição eleita em 2026', url: null },
    extraido_em: null,
    cobertura: `${n} decisões · ${dir} com P ≥ 50% sob presidência de direita · ${esq} sob presidência de esquerda`,
    validacoes: [
      { ok: true, texto: 'Quóruns conferidos com a CF/88: PEC 308 e 49; LC 257 e 41; remoção de ministro do STF 54' },
      { ok: true, texto: `Composição: ${Object.entries(dec.meta.composicao.camara).map(([k, v]) => `${k} ${v}`).join(', ')} (Câmara); Senado 81 cadeiras` },
    ],
    limites: [dec.meta.aviso, 'Efeitos (deltas) são julgamentos, não estimativas da literatura; P(aprovação) supõe independência entre iniciativa, Câmara e Senado.'],
    links: [{ titulo: 'Proposta: trocar efeitos julgados por estimativas publicadas', url: '#/propostas' }],
    arquivos: ['decisoes.json'],
    paginas: ['decisoes', 'metodo'],
  })
}

// ---------------------------------------------------------------- Referências e propostas
const refsRaw = read('references.json')
const refs = Array.isArray(refsRaw) ? refsRaw : (refsRaw?.referencias ?? [])
if (refs.length) {
  const ok = refs.filter((r) => r.verificado).length
  add({
    id: 'referencias',
    nome: 'Referências (forense eleitoral, dados abertos, visualização, antifraude, segurança da urna)',
    chip: { rotulo: 'Referências', detalhe: `${ok}/${refs.length}` },
    status: 'parcial',
    tipo: 'texto',
    cobertura: `${refs.length} itens · ${ok} verificados (DOI no Crossref, URL por requisição) · ${refs.length - ok} a confirmar`,
    validacoes: [{ ok: true, texto: 'Dois DOIs lembrados de memória estavam errados e foram corrigidos pela consulta ao Crossref' }],
    limites: ['Vários artigos foram checados por metadados e resumo, não lidos na íntegra.', 'O relatório original das Forças Armadas e o laudo da PF sobre a urna de 2022 não foram obtidos.'],
    arquivos: ['references.json'],
    paginas: ['referencias', 'metodo'],
  })
}
const pr = read('propostas.json')
if (pr) {
  const st = (s) => pr.propostas.filter((p) => p.status === s).length
  add({
    id: 'propostas',
    nome: 'Propostas e próximos passos',
    chip: { rotulo: 'Propostas', detalhe: `${pr.propostas.length}` },
    status: 'julgamento',
    tipo: 'texto',
    cobertura: `${pr.propostas.length} propostas · ${st('em-andamento')} em andamento · ${st('proposta')} propostas`,
    validacoes: [],
    limites: [pr.meta?.aviso ?? 'Propostas são hipóteses de trabalho, não resultados.'],
    arquivos: ['propostas.json'],
    paginas: ['propostas', 'metodo'],
  })
}

// ---------------------------------------------------------------- Antes de 1500
const ab = read('antes_de_1500.json')
if (ab) {
  const fs = [...ab.periodos.map((x) => x.fontes ?? []), ...ab.eventos.map((x) => x.fontes ?? []), ...(ab.clima_eventos ?? []).map((x) => x.fontes ?? []), ...(ab.povos_e_origens ?? []).map((x) => x.fontes ?? []), ab.diversidade_hoje?.fontes ?? []].flat()
  const ok = fs.filter((f) => f.verificado === true).length
  add({
    id: 'antes-de-1500',
    nome: 'Antes de 1500 — povos, diversidade, clima e manejo (anos antes do presente)',
    chip: { rotulo: 'Antes de 1500', detalhe: `${ok}/${fs.length} fontes` },
    status: 'parcial',
    fonte: { nome: 'IBGE SIDRA (Censo 2022, lido via API) e fontes secundárias abertas (principalmente Wikipedia); artigos científicos só por resumo', url: 'https://apisidra.ibge.gov.br/values/t/9605/n1/all/v/93/p/2022/c86/all' },
    extraido_em: ab.meta?.gerado_em ?? null,
    cobertura: `${ab.periodos.length} períodos · ${ab.eventos.length} eventos · ${ab.clima_eventos?.length ?? 0} eventos climáticos · ${ab.povos_e_origens?.length ?? 0} grupos e origens`,
    validacoes: [
      { ok: true, texto: `Censo 2022 por cor/raça lido na API do SIDRA (tabela 9605): total ${nf(ab.diversidade_hoje?.composicao_cor_raca_2022?.total)}; indígenas por cor/raça 1.227.642, igual ao territorios.json e ao banco do trans (três fontes independentes)` },
      { ok: null, texto: `${ok} de ${fs.length} entradas de fonte conferidas; muitas são fonte secundária ou resumo de busca` },
      { ok: false, texto: 'Etnias e línguas (305/274 em 2010; 391/295 em 2022) vêm de resumo de imprensa e NÃO são comparáveis: 2022 usou outro desenho de pergunta' },
    ],
    limites: [ab.meta?.aviso ?? '', 'Datas e expansões (Tupi, mandioca, megafauna, evento de 4,2 mil AP) estão de memória e marcadas assim.', 'O total ampliado de indígenas aqui (1.693.535) difere da soma do SIDRA 9718 em territorios.json (1.694.836).', 'Etnia não é destino: as trajetórias são processo histórico e institucional, não determinismo.'].filter(Boolean),
    links: topLinks([fs]),
    arquivos: ['antes_de_1500.json'],
    paginas: ['antes', 'metodo'],
  })
}

// ---------------------------------------------------------------- Clima
const cl = read('clima.json')
if (cl) {
  const rt = cl.meta?.resumo_testes ?? {}
  const eps = cl.episodios ?? []
  const cen = cl.cenarios_futuros ?? []
  const cus = cl.custos_economicos ?? []
  const verif = (a) => a.filter((x) => x.verificado === true).length
  const seen = new Map()
  for (const sr of cl.series) if (sr.fonte?.sha256 && !seen.has(sr.fonte.nome)) seen.set(sr.fonte.nome, sr.fonte.sha256)
  const v = cl.meta?.validacao ?? {}
  add({
    id: 'clima',
    nome: 'Clima e economia — séries abertas, relações com IC95, episódios e cenários',
    chip: { rotulo: 'Clima', detalhe: `${cl.series.length} séries` },
    status: 'parcial',
    fonte: { nome: 'NOAA (ONI, ERSSTv5), CRU TS 4.09 e ERA5 via Banco Mundial CCKP, Berkeley Earth, NASA GISS, INPE, ONS, IBGE/SIDRA, BCB, IPCC AR6', url: null },
    extraido_em: cl.meta?.gerado_em ?? null,
    hashes: [...seen.entries()].slice(0, 8).map(([rotulo, sha256]) => ({ rotulo, sha256 })),
    cobertura: `${cl.series.length} séries · ${cl.relacoes?.length ?? 0} relações · ${eps.length} episódios · ${cen.length} projeções físicas · ${cus.length} estimativas de custo`,
    validacoes: [
      { ok: true, texto: `Produtos climáticos concordam: CRU × ERA5 r = ${v.concordancia_entre_produtos_climaticos?.cru_vs_era5_temp?.r_niveis ?? '—'}; IPCA alimentação BCB × SIDRA: diferença máxima ${v.ipca_alimentacao_sgs_vs_sidra?.max_dif_pp ?? '—'} pp` },
      { ok: null, texto: `${rt.ic95_exclui_zero ?? '—'} de ${rt.testes_publicados ?? '—'} intervalos de confiança excluem o zero; por acaso se esperaria ~${rt.esperado_por_acaso_se_nenhuma_relacao_real ?? '—'}. Só relações de mecanismo físico claro se sustentam` },
      { ok: null, texto: `Conferidos na fonte: ${verif(eps)} de ${eps.length} episódios, ${verif(cen)} de ${cen.length} projeções, ${verif(cus)} de ${cus.length} custos` },
    ],
    limites: [cl.meta?.aviso ?? '', 'O desenho não tem poder para ligar clima a PIB agropecuário nem a inflação de alimentos (chuva média nacional, séries curtas, sem controles).', 'Estimativas de custo medem coisas diferentes e não são somáveis.', ...(cl.meta?.lacunas ?? []).map(txt).slice(0, 4)].filter(Boolean),
    links: topLinks([eps.flatMap((e) => e.fontes ?? [])]),
    arquivos: ['clima.json'],
    paginas: ['clima', 'metodo'],
  })
}

// ---------------------------------------------------------------- Potenciais
const po = read('potenciais_brasil.json')
if (po) {
  const mets = po.potencias.flatMap((x) => x.metricas ?? [])
  const ok = mets.filter((m) => m.verificado === true).length
  const fs = po.potencias.map((x) => x.fontes ?? [])
  add({
    id: 'potenciais-brasil',
    nome: 'Potências do Brasil e potencial de crescimento',
    chip: { rotulo: 'Potenciais', detalhe: `${ok}/${mets.length} métricas` },
    status: 'parcial',
    fonte: { nome: 'USGS Mineral Commodity Summaries 2026, FMI Article IV 2025 (CR 25/194), Ipea, IBGE Atlas Rural, Embrapa; água e biodiversidade via Wikipedia (secundária)', url: null },
    extraido_em: po.meta?.gerado_em ?? null,
    cobertura: `${po.potencias.length} potências · ${mets.length} métricas · ${po.armadilhas?.length ?? 0} armadilhas`,
    validacoes: [
      { ok: true, texto: 'Lidos em PDF primário: USGS 2026 (nióbio, terras raras, grafite, lítio, manganês, níquel), FMI (crescimento de 2,5% no médio prazo), Ipea (PTF agropecuária) e IBGE Atlas Rural (Gini da terra 0,867)' },
      { ok: null, texto: `${ok} de ${mets.length} métricas conferidas; ${mets.length - ok} sem conferência (12% da água doce, potencial solar, eólica offshore, PISA 2022, custo Brasil…)` },
      { ok: true, texto: 'Todos os ids de decisões e de tendências foram checados contra decisoes.json e leis_tecnologicas.json' },
    ],
    limites: [po.meta?.aviso ?? '', 'Sem decomposição do crescimento (capital, trabalho, produtividade) da economia total; o único PIB potencial verificado é o do FMI.', 'Tabelas do USGS vieram de PDF com colunas desalinhadas: a leitura das reservas de nióbio e terras raras tem incerteza residual.', 'Potencial técnico não é potencial econômico.'].filter(Boolean),
    links: topLinks(fs),
    arquivos: ['potenciais_brasil.json'],
    paginas: ['potenciais', 'metodo'],
  })
}

// ---------------------------------------------------------------- Pilares de pensamento
const pi = read('pilares_pensamento.json')
if (pi) {
  const obras = pi.pensadores.flatMap((x) => x.obra_chave ?? [])
  const casos = pi.pensadores.flatMap((x) => x.casos_e_evidencias ?? [])
  const okO = obras.filter((o) => o.verificado === true).length
  const okC = casos.filter((o) => o.verificado === true).length
  add({
    id: 'pilares-pensamento',
    nome: 'Pilares de pensamento — pensadores, pilares, diálogos e propostas de viabilização',
    chip: { rotulo: 'Pilares', detalhe: `${okO}/${obras.length} obras` },
    status: 'parcial',
    tipo: 'texto',
    fonte: { nome: 'Constituição do Equador (Constitute Project) e Sentencia T-622/2016 lidas; demais obras e normas de resumo de busca ou memória', url: 'https://www.constituteproject.org/constitution/Ecuador_2021' },
    extraido_em: pi.meta?.gerado_em ?? null,
    cobertura: `${pi.pensadores.length} pensadores · ${pi.pilares.length} pilares · ${pi.dialogos?.length ?? 0} diálogos · ${pi.viabilizacao?.length ?? 0} propostas de viabilização`,
    validacoes: [
      { ok: null, texto: `${okO} de ${obras.length} obras e ${okC} de ${casos.length} casos com selo “verificado”; o restante é de resumo de busca ou de memória` },
      { ok: true, texto: 'Todos os ids de ciclos, decisões, potências e leis foram checados contra os outros arquivos' },
    ],
    limites: [pi.meta?.aviso ?? '', 'Nenhuma fonte primária indígena foi lida; maia, mapuche, guarani e ayni/ayllu estão fracos.', 'Nenhuma proposta foi consultada a povo ou comunidade; os quóruns seguem a convenção de institutions.py e não estimam chance de aprovação.', 'Não há evidência de efeito medido dos direitos da natureza em municípios brasileiros (Bonito, Paudalho).'].filter(Boolean),
    links: topLinks([obras, casos]),
    arquivos: ['pilares_pensamento.json'],
    paginas: ['pilares', 'metodo'],
  })
}

// ---------------------------------------------------------------- Leis tecnológicas e futuros
const lt = read('leis_tecnologicas.json')
if (lt) {
  const pars = lt.leis.flatMap((l) => l.parametros_empiricos ?? [])
  const refs = [...lt.leis.flatMap((l) => l.referencias ?? []), ...(lt.tendencias ?? []).flatMap((t) => t.referencias ?? [])]
  const okP = pars.filter((p) => p.verificado === true).length
  const okR = refs.filter((r) => r.verificado === true).length
  add({
    id: 'leis-tecnologicas',
    nome: 'Leis e tendências tecnológicas (Moore, Wright, difusão, escala de IA…)',
    chip: { rotulo: 'Leis', detalhe: `${okP}/${pars.length} parâmetros` },
    status: 'parcial',
    tipo: 'texto',
    fonte: { nome: 'Epoch AI, BNEF, FMI, OIT, FGV IBRE, arXiv e DOIs conferidos no Crossref; vários expoentes e parâmetros de memória', url: null },
    extraido_em: lt.meta?.gerado_em ?? null,
    cobertura: `${lt.leis.length} leis e modelos · ${lt.tendencias?.length ?? 0} tendências · ${pars.length} parâmetros empíricos · ${refs.length} referências`,
    validacoes: [
      { ok: null, texto: `${okP} de ${pars.length} parâmetros e ${okR} de ${refs.length} referências conferidos; expoentes de Kaplan, p/q de Bass, taxa de Swanson e “20 tokens por parâmetro” de Chinchilla estão de memória` },
    ],
    limites: [lt.meta?.aviso ?? '', 'Leis empíricas valem dentro de um domínio; fora dele falham (fim do escalonamento de Dennard, desaceleração de Moore).', 'O impacto econômico das tendências está em termos qualitativos, sem números inventados.'].filter(Boolean),
    links: topLinks([refs]),
    arquivos: ['leis_tecnologicas.json'],
    paginas: ['futuro', 'metodo'],
  })
}
const fu = read('futuros.json')
if (fu) {
  const ratio = (c) => {
    const m = c.ajuste?.erro_teste?.mape_pct
    const b = [c.ajuste?.baseline_erro_teste?.ingenuo?.mape_pct, c.ajuste?.baseline_erro_teste?.linear?.mape_pct].filter((x) => typeof x === 'number')
    return m != null && b.length ? m / Math.min(...b) : null
  }
  const st = { ganha: 0, empate: 0, perde: 0 }
  for (const c of fu.curvas) {
    const r = ratio(c)
    if (r == null) continue
    if (c.ajuste?.baseline_erro_teste?.ganha_do_melhor_baseline === true) st.ganha += 1
    else if (r > 1.1) st.perde += 1
    else st.empate += 1
  }
  const seen = new Map()
  for (const c of fu.curvas) if (c.fonte_dados?.sha256 && !seen.has(c.fonte_dados.nome)) seen.set(c.fonte_dados.nome, c.fonte_dados.sha256)
  add({
    id: 'futuros',
    nome: 'Curvas de adoção e custo (Pix, solar, carros elétricos…) e integração ao modelo macro',
    chip: { rotulo: 'Curvas', detalhe: `${st.ganha}/${fu.curvas.length} superam baseline` },
    status: 'parcial',
    tipo: 'modelo',
    fonte: { nome: 'BCB (Pix), IBGE PNAD TIC, ANEEL, OWID/IRENA/Ember/IEA/Epoch AI', url: null },
    extraido_em: fu.meta?.gerado_em ?? null,
    hashes: [...seen.entries()].slice(0, 8).map(([rotulo, sha256]) => ({ rotulo, sha256 })),
    cobertura: `${fu.curvas.length} curvas ajustadas · horizonte ${fu.meta?.horizonte?.join('–') ?? '—'} · ${fu.meta?.bootstrap_replicas ?? '—'} réplicas de bootstrap`,
    validacoes: [
      { ok: null, texto: `Teste fora da amostra contra o baseline: ${st.ganha} superam, ${st.empate} empatam, ${st.perde} perdem (de ${fu.curvas.length})` },
      { ok: false, texto: 'O teto de adoção é pouco identificado; banda estreita do bootstrap não é confiança' },
    ],
    limites: [fu.meta?.aviso ?? '', 'O ganho de produtividade por tecnologia é SUPOSIÇÃO rotulada (0,3 pp/ano, varrida de 0,05 a 1,0), não estimativa.', ...(fu.meta?.lacunas ?? []).map(txt).slice(0, 3)].filter(Boolean),
    arquivos: ['futuros.json'],
    paginas: ['futuro', 'metodo'],
  })
}

// ---------------------------------------------------------------- Evoluções (Markov), anéis, quebras
const evo = read('evolucoes.json')
if (evo) {
  const rp = evo.regimes_politicos
  const h1 = rp.validacao?.loco?.h1?.modelos ?? {}
  const f = evo.meta?.fontes?.[0]
  const ece = rp.validacao?.calibracao_por_faixas_loco?.markov?.h1?.ece
  add({
    id: 'evolucoes',
    nome: 'Evoluções: cadeias de Markov entre regimes políticos e econômicos',
    chip: { rotulo: 'Markov', detalhe: 'regimes' },
    status: 'derivado',
    tipo: 'modelo',
    fonte: { nome: 'Regimes of the World (V-Dem v16) via Our World in Data, CC BY 4.0', url: f?.url ?? null },
    extraido_em: f?.baixado_em ?? evo.meta?.gerado_em ?? null,
    hashes: f?.sha256 ? [{ rotulo: 'political-regime.csv (OWID)', sha256: f.sha256 }] : [],
    cobertura: '183 países, 1900–2025 (Brasil desde 1822) · 4 regimes · matrizes do Brasil (encolhida), da América Latina e do mundo, e semi-Markov',
    validacoes: [
      { ok: true, texto: `Leave-country-out, 1 ano: log-loss ${h1.markov?.logloss?.toFixed(3) ?? '—'} (cadeia) contra ${h1.persist_calibrada?.logloss?.toFixed(3) ?? '—'} (persistência calibrada); Brier quase igual: o ganho está nas trocas raras` },
      { ok: true, texto: `Calibração por faixas: ECE ${ece != null ? ece.toFixed(3) : '—'} em 1 ano; controle sintético recupera a cadeia (cobertura do IC90 de 89%; ~85% no tamanho do Brasil)` },
      { ok: false, texto: 'Regimes econômicos: a cadeia NÃO bate a climatologia (crescimento) nem a persistência calibrada (inflação)' },
      { ok: false, texto: 'Pressuposto markoviano rejeitado em parte: a permanência não é geométrica e o semi-Markov vence fora da amostra; matriz de 1900–49 prevê 2000–24 pior que a de 1990–99' },
    ],
    limites: [
      evo.meta?.aviso ?? 'Cadeia de Markov não é previsão.',
      'Golpes, guerras e crises globais (eventos raros) e choques externos não entram; os intervalos medem só a incerteza dos parâmetros.',
      'A classificação V-Dem diverge da periodização de historia.json (ex.: Brasil 1950–86 como autocracia eleitoral); usamos os estados da fonte, sem ajuste.',
      'A fonte imputa regimes a países ainda não soberanos e não marca essas linhas; séries duplicadas de ex-colônias provavelmente estreitam os intervalos.',
      'O dado do Brasil vai até 2025; 2026 e a eleição de 25/10/2026 estão fora.',
    ],
    links: [{ titulo: 'Our World in Data — Political regime', url: f?.url ?? 'https://ourworldindata.org/grapher/political-regime' }],
    arquivos: ['evolucoes.json'],
    paginas: ['historia', 'home', 'metodo'],
  })
  const cc = evo.cadeia_cenarios
  const rup = cc.ruptura_regime_divida_acima_de_120?.mistura_cadeia?.p_ruptura_ate_2038
  add({
    id: 'cadeia-cenarios',
    nome: 'Cadeia de cenários (matriz julgada) e editor “e se?”',
    chip: { rotulo: 'Cadeia de cenários', detalhe: 'julgamento' },
    status: 'julgamento',
    tipo: 'modelo',
    fonte: { nome: 'src/sociolibero/markov.py + scenarios.py; cenarios_macro.json (scenarios.run, semente 7)', url: null },
    extraido_em: evo.meta?.gerado_em ?? null,
    cobertura: `${cc.cenarios.length} cenários × ${cc.ciclos.length} ciclos eleitorais (${cc.ciclos.join(', ')}) · P(dívida > 120% até 2038) = ${rup != null ? Math.round(rup * 100) : '—'}% na matriz julgada`,
    validacoes: [
      { ok: true, texto: `Duas taxas têm âncora empírica (erosão ${cc.ancoras_empiricas?.eps != null ? (cc.ancoras_empiricas.eps * 100).toFixed(1) : '—'}% e recuperação ${cc.ancoras_empiricas?.rho != null ? (cc.ancoras_empiricas.rho * 100).toFixed(1) : '—'}% por ciclo de 4 anos), da matriz do Brasil` },
      { ok: false, texto: 'O restante da matriz é julgamento: permanência de cada cenário, deriva do pragmático, captura e moderação' },
      { ok: null, texto: 'A mistura macro quase não discrimina matrizes: o resultado é dominado pelos próprios cenários, que já passam de 120% em três dos quatro' },
    ],
    limites: [
      'A matriz é premissa editável, não estimativa; o editor mostra o que muda, não o que vai acontecer.',
      'Macro no editor = média das medianas por cenário ponderada pela ocupação (aproximação); a mistura exata não é recalculável no navegador.',
      'Acima de 120% de dívida/PIB é ruptura de regime, não trajetória; a mistura ignora a dívida herdada na troca de cenário.',
    ],
    arquivos: ['evolucoes.json', 'cenarios_macro.json'],
    paginas: ['historia', 'home', 'decisoes', 'metodo'],
  })
}
const an = read('aneis.json')
if (an) {
  const c = an.meta?.contagens ?? {}
  add({
    id: 'aneis',
    nome: 'Anéis de realimentação (diagramas de laços causais)',
    chip: { rotulo: 'Anéis', detalhe: `${c.citacoes_verificadas ?? '—'}/${c.citacoes_de_evidencia ?? '—'} evidências` },
    status: 'parcial',
    tipo: 'modelo',
    fonte: { nome: 'Curadoria do repositório (Forrester, Meadows) ancorada em economy.py e nos demais arquivos de dados', url: null },
    extraido_em: an.meta?.gerado_em ?? null,
    cobertura: `${c.aneis ?? an.aneis.length} anéis (${c.reforcadores ?? '—'} reforçadores, ${c.equilibradores ?? '—'} equilibradores) · ${c.arestas ?? '—'} arestas · ${c.aneis_ausentes ?? '—'} anéis ausentes por falta de evidência`,
    validacoes: [
      { ok: true, texto: 'Todo laço fecha; o tipo (R ou B) bate com a contagem de sinais negativos; ids de decisões, potências, pilares e leis conferidos' },
      { ok: null, texto: `${c.citacoes_verificadas ?? '—'} de ${c.citacoes_de_evidencia ?? '—'} citações de evidência verificadas; ${c.referencias_verificadas ?? '—'} de ${c.referencias ?? '—'} referências externas (as demais só tiveram o DOI conferido)` },
      { ok: null, texto: `${c.aneis_com_simulacao_total_ou_parcial ?? '—'} anéis têm equação em economy.py; os outros são hipóteses causais qualitativas` },
    ],
    limites: [
      an.meta?.aviso ?? 'Diagramas de laços causais, não previsões.',
      `${c.arestas_contestadas ?? '—'} das ${c.arestas ?? '—'} arestas são contestadas na literatura; defasagens e forças são estimativas qualitativas, nenhuma foi medida em dados.`,
      'O modelo não tem câmbio nem dívida indexada: o anel das expectativas não vira espiral na dívida dentro dele (limite da estrutura).',
    ],
    links: topLinks([(an.referencias ?? []).map((r) => ({ titulo: r.titulo, url: r.url, verificado: r.verificado }))]),
    arquivos: ['aneis.json'],
    paginas: ['historia', 'metodo'],
  })
}
const qb = read('quebras.json')
if (qb) {
  const cm = qb.meta?.metodo?.controle_metodologico ?? {}
  const cr = qb.cruzamento_historia ?? {}
  const nq = qb.series.reduce((a, x) => a + x.quebras.length, 0)
  add({
    id: 'quebras',
    nome: 'Quebras estruturais nas séries históricas, com validação sintética',
    chip: { rotulo: 'Quebras', detalhe: `${nq} em ${qb.series.length} séries` },
    status: 'derivado',
    tipo: 'modelo',
    fonte: { nome: 'src/sociolibero/quebras.py sobre series_historicas.json (BCB, IBGE, Ipea, Maddison, OWID…)', url: null },
    extraido_em: qb.meta?.gerado_em ?? null,
    cobertura: `${qb.series.length} séries · ${nq} quebras · ${(qb.meta?.lacunas ?? []).length} séries fora por serem curtas`,
    validacoes: [
      { ok: true, texto: 'Procedimento escolhido pela validação com quebras sintéticas de verdade conhecida (falso positivo e poder), não por ajuste às séries reais' },
      { ok: false, texto: `Controle metodológico: só ${cm.recuperados_apos_holm ?? '—'} de ${cm.artefatos_testaveis ?? '—'} artefatos conhecidos foram recuperados: o poder é baixo` },
      { ok: false, texto: `Cruzamento com a história: ${cr.coincidencias ?? '—'} de ${cr.n_quebras ?? '—'} quebras coincidem com datas históricas, mas o esperado por acaso é ${cr.esperado_por_acaso != null ? cr.esperado_por_acaso.toFixed(1) : '—'} (p de permutação = ${cr.p_permutacao ?? '—'})` },
    ],
    limites: [qb.meta?.aviso ?? '', 'Quebra estatística não é causa nem evento; muitas são artefato de mudança de metodologia da série (marcadas).', 'Detector sem poder não pode ser lido como “não houve quebra”.'].filter(Boolean),
    arquivos: ['quebras.json'],
    paginas: ['quebras', 'metodo'],
  })
}

// ---------------------------------------------------------------- Custo da corrupção e clima em R$
const cc2 = read('custo_corrupcao.json')
if (cc2) {
  const r = cc2.meta?.resumo ?? {}
  add({
    id: 'custo-corrupcao',
    nome: 'Custo da corrupção e da captura, em R$ (áreas, benefícios a empresas, recuperação)',
    chip: { rotulo: 'Custo da corrupção', detalhe: `${r.valores_verificados ?? '—'}/${r.valores ?? '—'} lidos` },
    status: 'parcial',
    fonte: { nome: 'CGU, TCU, Receita (DGT), CADE, BCB, IBGE e pesquisa aberta; ver cada valor', url: null },
    extraido_em: cc2.meta?.gerado_em ?? null,
    cobertura: `${cc2.areas.length} áreas · ${r.valores ?? '—'} valores (${r.contagem ?? '—'} de contagem, ${r.estimativa ?? '—'} de estimativa) · ${r.beneficios ?? '—'} benefícios a empresas · ${r.modelos ?? '—'} modelos`,
    validacoes: [
      { ok: null, texto: `${r.valores_verificados ?? '—'} de ${r.valores ?? '—'} valores lidos na fonte; ${r.beneficios_verificados ?? '—'} de ${r.beneficios ?? '—'} benefícios a empresas` },
      { ok: false, texto: `PIB-âncora ${cc2.meta?.ancora_pib?.ano ?? ''}: R$ ${nf(cc2.meta?.ancora_pib?.valor_rs_bi)} bi, valor arredondado NÃO verificado (o IBGE respondeu 403); todas as conversões de pp do PIB em R$ dependem dele` },
      { ok: true, texto: 'Itens que só tinham link de imprensa foram rebaixados a “não lido na fonte”' },
    ],
    limites: [
      cc2.meta?.aviso ?? '',
      'Contagem (apurada) e estimativa (modelo) medem coisas diferentes: não some as linhas.',
      'O valor em R$ de cada decisão é o delta julgado de primário × PIB nominal: é escala, não a conta do orçamento.',
      ...(cc2.meta?.divergencias ?? []).slice(0, 3),
    ].filter(Boolean),
    links: topLinks([cc2.areas.flatMap((a) => a.valores.map((v) => ({ titulo: v.fonte ?? v.descricao, url: v.url, verificado: v.verificado })))]),
    arquivos: ['custo_corrupcao.json'],
    paginas: ['corrupcao', 'pessimismo', 'metodo'],
  })
}
const cv = read('clima_valor_financeiro.json')
if (cv) {
  const ok = cv.itens.filter((i) => i.verificado).length
  add({
    id: 'clima-valor',
    nome: 'Clima: valor financeiro (RS 2024, Brasil, prevenção × resposta)',
    chip: { rotulo: 'Clima em R$', detalhe: `${ok}/${cv.itens.length} lidos` },
    status: 'parcial',
    fonte: { nome: 'BID/CEPAL/Banco Mundial, CNM, CNseg, TCU, governo do RS (via reportagens que citam a fonte)', url: null },
    extraido_em: cv.meta?.gerado_em ?? null,
    cobertura: `${cv.itens.length} itens · ${(cv.relacao_prevencao_resposta ?? []).length} razões prevenção × resposta`,
    validacoes: [
      { ok: true, texto: `${ok} de ${cv.itens.length} itens lidos em página aberta (quase todos em reportagem que cita a fonte primária)` },
      { ok: false, texto: 'As razões prevenção × resposta do TCU (2,3) e da CNseg (9,7) não se reconciliam: medem coisas diferentes' },
    ],
    limites: [cv.meta?.aviso ?? '', cv.nao_somar ?? ''].filter(Boolean),
    arquivos: ['clima_valor_financeiro.json'],
    paginas: ['clima', 'corrupcao', 'metodo'],
  })
}
const rs = read('clima_rs_municipal.json')
if (rs) {
  const ct = rs.meta?.contagem_snapshot ?? {}
  const vl = rs.meta?.validacao ?? {}
  add({
    id: 'clima-rs',
    nome: 'Risco climático no RS: índice de prioridade preventiva (projeto climate)',
    chip: { rotulo: 'Risco RS', detalhe: `${ct.n_total ?? '—'} municípios` },
    status: 'derivado',
    tipo: 'dado',
    fonte: { nome: 'Projeto climate (snapshot congelado de 09/08/2026) sobre IBGE MUNIC 2024, JRC GSW, GHSL, ANA, NOAA CPC', url: null },
    extraido_em: rs.meta?.fonte?.snapshot_capturado_em ?? rs.meta?.gerado_em ?? null,
    cobertura: `${ct.n_total ?? '—'} municípios do RS · ${ct.n_completo ?? '—'} completos, ${ct.n_parcial ?? '—'} parciais, ${ct.n_insuficiente ?? '—'} sem índice`,
    validacoes: [
      { ok: vl.juncao_ok === true, texto: `Junção com a malha: ${vl.n_snapshot ?? '—'} do snapshot e ${vl.n_geojson_rs ?? '—'} do RS na malha, sem sobras` },
      { ok: true, texto: `Cobertura mínima de peso 0,60: ${vl.regra_cobertura_minima?.violacoes?.length ?? '—'} violações; ${vl.regra_cobertura_minima?.n_sem_indice_corretamente ?? '—'} município sem índice, corretamente (não promovido)` },
      { ok: null, texto: `População do snapshot (estimativa 2024) ${vl.populacao_snapshot_vs_territorios?.dif_soma_pct ?? '—'}% acima do Censo 2022 de territorios.json; nenhum município com diferença acima de 10%` },
    ],
    limites: [
      rs.meta?.aviso ?? '',
      'Impacto e déficit de prevenção são auto-declaração da prefeitura ao IBGE; manutenção de ativos é sempre nula (sem base pública).',
      'Proveniência indireta: a ETL do projeto climate não foi reauditada aqui. Pesos do índice são escolha editorial, nunca calibrada contra desfecho.',
      'Município sem índice aparece hachurado no mapa e fora do ranking: não é “risco baixo”.',
    ].filter(Boolean),
    arquivos: ['clima_rs_municipal.json'],
    paginas: ['mapa', 'municipio', 'clima', 'metodo'],
  })
}

// ---------------------------------------------------------------- Pessimismo
const ps = read('pessimismo.json')
if (ps) {
  const rs2 = ps.cenario_adverso?.reverse_stress ?? {}
  add({
    id: 'pessimismo',
    nome: 'Testes de estresse (má execução, adverso composto, liderança judicial como mecanismo)',
    chip: { rotulo: 'Estresse', detalhe: 'cenário de risco' },
    status: 'julgamento',
    tipo: 'modelo',
    fonte: { nome: 'src/sociolibero/pessimismo.py sobre economy.py, decisoes.py e institutions.py', url: null },
    extraido_em: ps.meta?.gerado_em ?? null,
    cobertura: `${ps.eficiencia_de_execucao?.varredura?.length ?? '—'} decisões varridas · adverso em 2 cenários · ${rs2.combinacoes_avaliadas ?? '—'} combinações de choques (reverse stress)`,
    validacoes: [
      { ok: true, texto: 'Regressão: com eficiência 1,0 os resultados do catálogo ficam idênticos; monotonicidade: 0 violações em 30 decisões' },
      { ok: true, texto: `Sementes: piso de ruído de ${ps.validacao?.sementes?.piso_de_ruido_p50_divida_2035 ?? '—'} pp na dívida de 2035` },
      { ok: false, texto: 'Eficiência de execução, severidades, vazamento e desperdício são suposições declaradas; a incerteza sobre elas não entra nos p10–p90' },
    ],
    limites: [ps.meta?.aviso ?? 'cenários de risco, não previsões', ...(ps.limites ?? []).slice(0, 4)].filter(Boolean),
    arquivos: ['pessimismo.json'],
    paginas: ['pessimismo', 'decisoes', 'metodo'],
  })
}
const vp = read('visoes_pessimistas.json')
if (vp) {
  const count = (o) => {
    let n = 0
    let ok = 0
    const walk = (x) => {
      if (Array.isArray(x)) x.forEach(walk)
      else if (x && typeof x === 'object') {
        if (typeof x.verificado === 'boolean') {
          n += 1
          if (x.verificado) ok += 1
        }
        Object.values(x).forEach(walk)
      }
    }
    walk(o)
    return { n, ok }
  }
  const c = count(vp)
  add({
    id: 'visoes-pessimistas',
    nome: 'Visões pessimistas: decisões ruins, captura judicial (mecanismos), capacidade estatal',
    chip: { rotulo: 'Visões pessimistas', detalhe: `${c.ok}/${c.n} lidos` },
    status: 'parcial',
    fonte: { nome: 'TCU, Tesouro, Receita, Banco Mundial (WGI), WJP, FMI, STF e literatura; cada item com a sua fonte', url: null },
    extraido_em: vp.meta?.gerado_em ?? null,
    cobertura: `${vp.decisoes_ruins.length} decisões ruins · ${vp.captura_judicial.mecanismos.length} mecanismos · ${vp.capacidade_estatal.proxies.length} proxies · ${(vp.pre_mortem ?? []).length} pré-mortems · ${(vp.fundamentos ?? []).length} fundamentos`,
    validacoes: [
      { ok: null, texto: `${c.ok} de ${c.n} itens com selo foram lidos na fonte; itens de imprensa ficam “não lidos na fonte” mesmo quando a página foi aberta` },
      { ok: true, texto: 'Nenhuma pessoa é acusada; “interesse próprio” é tratado como mecanismo, com a leitura contrária ao lado' },
    ],
    limites: [vp.meta?.aviso ?? '', 'Não existe “taxa de incompetência” medida: os proxies medem partes da capacidade do Estado e dizem o que não medem.', ...(vp.limites ?? []).slice(0, 3)].filter(Boolean),
    arquivos: ['visoes_pessimistas.json'],
    paginas: ['pessimismo', 'metodo'],
  })
}

// vínculos extras (página → base já registrada)
const link = (id, pages) => {
  const b = bases.find((x) => x.id === id)
  if (b) for (const p of pages) if (!b.paginas.includes(p)) b.paginas.push(p)
}
link('ibge-censo-2022', ['antes'])
link('historia', ['antes', 'pilares'])
link('series-historicas', ['clima', 'futuro'])
link('modelo-macro', ['clima', 'potenciais', 'futuro'])
link('decisoes', ['potenciais', 'pilares'])
link('trans-arandu', ['antes', 'mapa'])
link('modelo-macro', ['pessimismo', 'quebras', 'corrupcao'])
link('decisoes', ['corrupcao'])
link('series-historicas', ['quebras'])
link('economia-historica', ['quebras'])
link('historia', ['quebras'])

// ---------------------------------------------------------------- páginas → bases e resumo
const PAGINAS = ['home', 'mapa', 'municipio', 'decisoes', 'historia', 'antes', 'gente', 'clima', 'potenciais', 'pilares', 'forense', 'corrupcao', 'pessimismo', 'quebras', 'futuro', 'propostas', 'metodo', 'referencias']
const paginas = Object.fromEntries(PAGINAS.map((p) => [p, bases.filter((b) => b.paginas.includes(p) || p === 'metodo').map((b) => b.id)]))
paginas.home = ['tse-2022', 'tse-2026', 'ibge-censo-2022', 'forense', 'modelo-macro', 'evolucoes', 'custo-corrupcao', 'fator-humano', 'historia', 'trans-arandu', 'clima', 'potenciais-brasil', 'pilares-pensamento'].filter((id) => bases.some((b) => b.id === id))
paginas.futuro = ['futuros', 'leis-tecnologicas', 'modelo-macro', 'series-historicas', 'propostas'].filter((id) => bases.some((b) => b.id === id))
paginas.referencias = ['referencias']

const porStatus = {}
for (const b of bases) porStatus[b.status] = (porStatus[b.status] ?? 0) + 1
const out = {
  gerado_em: new Date().toISOString(),
  resumo: { total: bases.length, por_status: porStatus, atencao: bases.filter((b) => b.status !== 'oficial').length },
  paginas,
  bases,
}
writeFileSync(join(DATA, 'bases.json'), JSON.stringify(out, null, 1))
console.log(`bases.json: ${bases.length} bases`, porStatus)

# Fontes de dados e atribuição

Todo número deste repositório pode ser rastreado até uma fonte. Os arquivos brutos **não** são versionados (`data/raw/` está no `.gitignore`); cada download gera um `PROVENIENCIA.json` com URL, data e SHA-256, e o módulo correspondente baixa de novo (`uv run sociolibero <módulo> baixar`).

A coluna **Licença** diz o que foi *conferido*; quando está "ver termos da fonte", o termo exato não foi verificado por este projeto e você deve consultá-lo antes de reutilizar.

| Fonte | Uso aqui | Licença / termos |
|---|---|---|
| **TSE — Dados Abertos** (votação por seção, detalhe, candidaturas, perfil do eleitorado, comparecimento) — <https://dadosabertos.tse.jus.br> | resultados por município, forense, indígenas e analfabetos | ver termos da fonte |
| **IBGE** (malha municipal, localidades, SIDRA/Censo 2022, estatísticas históricas) — <https://www.ibge.gov.br> | geometria, população, cor/raça, indígenas e quilombolas | ver termos da fonte |
| **Banco Central do Brasil — SGS** (dívida bruta, séries) — <https://api.bcb.gov.br> | macro | ver termos da fonte |
| **Our World in Data / Regimes of the World (V-Dem v16)** — <https://ourworldindata.org> | regimes políticos (Markov) | **CC BY 4.0** (conferida no metadado baixado) |
| **Maddison Project Database** — <https://www.rug.nl/ggdc/historicaldevelopment/maddison/> | PIB per capita de longo prazo | ver termos da fonte |
| **World Inequality Database** — <https://wid.world> | participação do 1% mais rico | ver termos da fonte |
| **Ipeadata** — <http://www.ipeadata.gov.br> | séries históricas | ver termos da fonte |
| **INPE** (PRODES, DETER, focos de calor) — <https://terrabrasilis.dpi.inpe.br> | desmatamento e queimadas | ver termos da fonte |
| **ONS — Dados Abertos** (EAR, ENA, CMO) | energia armazenada e custo marginal | **CC BY** (indicado na própria fonte) |
| **ANEEL** (geração distribuída) / **EPE** | curva de adoção solar | ver termos da fonte |
| **FUNAI** (terras indígenas, WFS) / **INCRA** (territórios quilombolas) | territórios | ver termos da fonte |
| **NOAA / CPC / PSL** (ONI, MEI, Niño 3.4), **CRU TS / ERA5 via Banco Mundial CCKP**, **Berkeley Earth**, **NASA GISTEMP** | clima | ver termos de cada fonte |
| **Banco Mundial** (WGI, indicadores) / **WJP** / **TCU** / **FMI** | capacidade estatal e visões pessimistas | ver termos de cada fonte |
| **Atlas da Violência (Ipea/FBSP)**, **SIM/DATASUS**, **SINAN**, **SINASC** | violência e mortes por município | dados públicos; agregados via projeto Arandu/`trans` do autor (ver abaixo) |
| **SlaveVoyages** | tráfico negreiro | termos da fonte (uso acadêmico/não comercial — **verificar antes de redistribuir**) |
| **OpenStreetMap** (via projeto `climate` do autor) | parte das medidas da camada climática do RS | **ODbL** — atribuição e compartilhamento pela mesma licença nas partes derivadas |
| **Câmara dos Deputados, Senado, Planalto, Wayback Machine** | textos legais e atos oficiais | domínio público (atos oficiais) |
| **marxists.org, Project Gutenberg, Projekt Gutenberg-DE, Wikisource, Zeno, Internet Archive, Domínio Público (MEC)** | textos clássicos de domínio público | domínio público no texto; cada obra registra a origem |

## Proveniência indireta (projetos do autor)
- `humano_municipal.json` e `humano_nacional.json` foram gerados a partir do banco do projeto **Arandu/`trans`** (agregados por município/UF/ano, **sem dados pessoais**), que por sua vez cita as fontes primárias acima. A ETL desse projeto **não foi reauditada aqui**; o Atlas municipal de 2020 tem defeito conhecido de origem e foi omitido.
- `clima_rs_municipal.json` vem do snapshot do projeto **`climate`** (Central de Risco Climático RS), que cita IBGE MUNIC/BDiA, JRC Global Surface Water, GHSL, ANA, CNES e OpenStreetMap.

## Como citar
Veja [`CITATION.cff`](CITATION.cff).

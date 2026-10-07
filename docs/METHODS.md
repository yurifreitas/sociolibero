# Método, validação e limites

> **Anomalia estatística não é prova de fraude.** Os testes aqui são *triagem para auditoria* e foram
> calibrados em dados reais e sintéticos. Cada teste informa o que detecta **e o que não detecta**.

## 1. Proveniência (todo número tem origem)
- Dados brutos: TSE Dados Abertos (`cdn.tse.jus.br/estatistica/sead/odsele`) — `votacao_secao`, `detalhe_votacao_secao`,
  `consulta_cand`; IBGE (malha e nomes). Cada download vira uma pasta própria com `PROVENIENCIA.json`
  (URL, data, `Last-Modified`, bytes, **SHA-256**). Extração só de nomes sem caminho (anti zip-slip).
- 2026 (1º turno) é marcado **preliminar**: snapshot do TSE de 05/10/2026 14:03; o 2º turno é 25/10/2026.
- Reprodução: `uv run sociolibero eleicoes baixar && uv run sociolibero eleicoes build`.

## 2. Validação dos dados (antes de qualquer teste)
O build falha visivelmente (e grava em `meta.validacao`) se algo não fecha. Resultado nos 3 pleitos:

| Checagem | Resultado |
|---|---|
| Soma de votos por seção = totais nacionais publicados (inclui exterior) | **diferença 0** (Lula, Bolsonaro/Flávio, 2022 T1/T2 e 2026 T1) |
| Chave (município, zona, seção) duplicada | 0 |
| Comparecimento > aptos | 0 |
| Válidos + brancos + nulos ≠ comparecimento | 0 |
| Votos por candidato (arquivo A) ≠ nominais+legenda (arquivo B), por seção | 0 divergências |
| Seções não instaladas/anuladas | 0 (2026) · 1 (2022 T2), excluída |
| Join TSE→IBGE (UF + nome) | 5570/5570 em 2022 · 5569/5570 em 2026 (Boa Esperança do Norte: município novo fora da malha) |

Dois arquivos independentes do TSE reconciliam entre si e com os totais divulgados — isso valida a *ingestão*,
não a *lisura da eleição*.

## 3. Testes forenses (por município; `src/sociolibero/eleicoes/forensics/`)
| Teste | Detecta | Cego a | Observação |
|---|---|---|---|
| `zt`, `zn`, `zs` — z robusto vs. vizinhos (mediana/MAD, contiguidade) | município fora do padrão local (comparecimento, brancos+nulos, voto) | efeitos regionais compartilhados | único sensível a **transferência de votos** |
| `ld_p` — χ² do último dígito (contagens ≥ 50) | números fabricados/arredondados | enchimento, transferência | Beber & Scacco 2012 |
| `rho_z` — Spearman comparecimento × voto nas seções, z empírico nacional | enchimento de urnas | fabricação, transferência | p paramétrico é anticonservador em dados reais ⇒ usa z empírico |
| `mult5_p` — excesso de múltiplos de 5 | arredondamento humano | demais | |
| `b2_p` — Benford 2º dígito | — | — | **fora do score**: rejeita 98% (sintético) / 59–62% (real) dos municípios sem indício algum |
| impressão digital (comparecimento × voto do líder) | assinatura de fraude extrema | — | Klimek et al. 2012; bloco nacional |

**Score (0–100)** = 25 pontos por teste sinalizado (q<0,05 por Benjamini–Hochberg, ou |z|≥4) + 5 por unidade de |z|
acima de 2. Heurístico: serve para ordenar auditoria, não para concluir. `confianca` depende de aptos
(alta ≥ 20 mil, média ≥ 5 mil).

## 4. Validação dos próprios detectores
**Sintética** (`forensics/synthetic.py`, `validacao_sintetica.json`): fraude injetada com verdade conhecida em 300 seções,
α = 0,05, 200 simulações por célula.
- Último dígito: pega números fabricados (TPR ≈ 60% com 10% das seções; ≈ 100% com 20%); **TPR ≈ α para enchimento e transferência**.
- Correlação comparecimento×voto: pega enchimento (TPR 86% com 10%; 100% com 20%), FPR 2%; cega a fabricação/transferência.
- Transferência de votos com comparecimento intacto: **nenhum detector de seção a enxerga**.
- Benford 2º dígito: FPR 98% ⇒ inválido nesta escala.

**Real** (calibração): fração de municípios com `ld_p` < 0,05 é 5,6–5,8% (esperado 5%) ⇒ teste bem calibrado.
**Persistência**: municípios sinalizados em um pleito voltam a ser sinalizados em outro 22–41% das vezes, contra 3–5% de base
(5–9× o acaso) ⇒ os sinais refletem sobretudo características estruturais persistentes (demografia, geografia),
não eventos de uma eleição específica.

## 5. O que este repositório **não** consegue dizer
- Ausência de fraude (poder limitado, ver §4) nem presença dela (anomalia ≠ prova).
- Nada sobre o software/hardware da urna: para isso há auditorias, testes públicos e cotejo de boletins de urna (ver `REFERENCES.md`, categoria segurança-urna).
- Resultados 2026 são preliminares; efeitos de decisões econômicas (`decisoes.json`) são **julgamentos editáveis**.

## 6. Próximas validações possíveis
Cotejo boletim-de-urna × resultado publicado (BU público do TSE); teste por modelo de urna dentro do município
(`DS_MODELO_URNA`); horário de recebimento do BU (`DT_RECEBIMENTO_BU_HOR_TSE`); modelos espaciais (SAR/Moran) e
detecção por mistura (eforensics, Mebane).

## 7. Territórios (povos indígenas e quilombolas por município)
Gerado por `uv run sociolibero territorios baixar && uv run sociolibero territorios build` → `web/public/data/territorios.json`
(`{meta:{fontes,aviso,lacunas,validacao}, linhas:{ibge:{...}}}`; chave = código IBGE de 7 dígitos, string). Campos sem dado = `null`.
Campos além do contrato mínimo: `pop_indigena_cor_raca`, `pop_indigena_em_ti`, `pop_quilombola_em_territorio`, `ti_fases`, `quilombo_fases`, `quilombo_titulado_n`.

**Proveniência.** Cada fonte baixa para `data/raw/<nome>/` com `PROVENIENCIA.json` (URL, data, `Last-Modified`, bytes, SHA-256; para pastas com
vários arquivos o hash é o SHA-256 de `nome:sha` ordenados). Dados tratados como não confiáveis: JSON via `json`, shapefile/DBF por parser binário
próprio (`struct`), ZIP do INCRA extraído com nomes fixos. Nada baixado é importado ou executado.

| Dado | Fonte (confirmada pela API/arquivo) |
|---|---|
| População total, preta, parda, indígena (cor/raça) | IBGE SIDRA **9605** (Censo 2022, var. 93, classif. 86) |
| Pessoas indígenas (cor/raça **ou** "se considera indígena"), total e em terras indígenas | IBGE SIDRA **9718** (var. 350; quesito 1714 × localização 2661) |
| Pessoas quilombolas, total e em territórios quilombolas | IBGE SIDRA **9578** (var. 4709, classif. 2661) — 1ª contagem quilombola |
| Terras indígenas (polígonos, fase do procedimento) | FUNAI geoserver WFS `Funai:tis_poligonais` (665 feições; 403 sem `maxFeatures`/User-Agent identificado, não é login) |
| Territórios quilombolas (polígonos, fase) | INCRA, "Áreas de Quilombolas" (shapefile, 445 polígonos) |
| Malha municipal | IBGE malhas v3, `estados/{uf}`, qualidade **máxima** (a "mínima" do mapa distorceria a área) |

- `pop_indigena` = SIDRA 9718, quesito "Total" (cor/raça indígena **+** "se considera indígena" = 1.694.836, número oficial); `pop_indigena_cor_raca` = só cor/raça (1.227.642).
- `pct_*` em 0–100, sobre `pop_total` (9605). `pct_pretos_pardos` = (preta + parda) / total.
- SIDRA: `-` = zero verdadeiro; `X` (sigilo), `..`, `...` ⇒ `null`.
- Área: interseção feição × município em projeção Albers equal-area (parâmetros IBGE, GRS80), em ha. Pares com < 1 ha são tratados como sliver de borda
  (malhas de origens diferentes) e **não** contam em `*_n` nem em `*_area_ha` (soma descartada: ~19 ha TI, ~13 ha quilombo). Um território que cruza
  municípios conta 1× em cada um; `quilombo_n` conta processos distintos (`nr_process`, senão nome). `ti_n`/`quilombo_n` somados no país são pares (território, município).
- Fases FUNAI em `ti_fases` (Em Estudo, Delimitada, Declarada, Homologada, Regularizada, Encaminhada RI); fases INCRA em `quilombo_fases` (RTID, Portaria, Decreto, Título parcial, Titulado, CCDRU…).
  `quilombo_titulado_n` = TITULADO + TITULO PARCIAL + CCDRU (título expedido, inclusive estadual). `ti_n`/`ti_area_ha` incluem **todas** as fases (use `ti_fases` para filtrar).

**Validações (resultado do build; detalhes em `meta.validacao`).**
| Checagem | Resultado |
|---|---|
| Soma dos 5570 municípios vs. total Brasil publicado (SIDRA n1): pop. total, indígena, indígena (cor/raça), quilombola | **diferença 0** (203.080.756 · 1.694.836 · 1.227.642 · 1.330.186) |
| Mesma soma por UF vs. SIDRA n3 | 0 em todas as UFs nesses 4 campos |
| `pop_indigena_em_ti` e `pop_quilombola_em_territorio` | soma 622.396 (publicado 622.844) e 167.425 (167.769): a diferença (448 e 344) são células `X` (sigilo estatístico) em 29 e 36 municípios, que ficam `null`; listadas por UF em `ufs_com_diferenca` |
| Municípios sem match: censo ↔ `geo/municipios.geojson` ↔ malha máxima | 0 nos dois sentidos (5570 = 5570 = 5570); Boa Esperança do Norte (MT) não consta nas malhas do IBGE e portanto aqui também não |
| Códigos | 7 dígitos, UF válida; 9 códigos oficiais (ex. 2201919, 3152131) não obedecem ao algoritmo do dígito verificador — informativo, vêm assim do IBGE |
| Área TI: polígonos (Albers) / atribuída a municípios / fora da malha | 127,19 M ha / 127,14 M ha / 54 mil ha (0,04%: TIs que avançam sobre mar/limite internacional); a soma `superficie_perimetro_ha` declarada pela FUNAI é 125,42 M ha (−1,4%, diferença entre área declarada e geométrica) |
| Área quilombola: polígonos / atribuída | 3,324 M ha / 3,324 M ha |

**Limites (ler antes de cruzar com eleições).**
- **População em TI ≠ autodeclaração.** `pop_indigena` é autodeclaração (Censo); `pop_indigena_em_ti` é residência dentro do polígono de TI (inclui não indígenas
  e exclui os 60%+ de indígenas que vivem fora de TI). `ti_area_ha` mede território, não população. Várias TIs ainda não regularizadas (declarada/delimitada/em estudo) não
  são posse efetiva.
- **Quilombola: território delimitado vs. população.** O Censo contou 1,33 mi de quilombolas em 1.700 municípios, mas a camada do INCRA tem só 659 pares (território, município)
  em 413 municípios, e 214 deles com título. Só 167 mil quilombolas vivem em território delimitado (SIDRA 9578). `quilombo_n = 0` significa "nenhum polígono INCRA", **não** ausência de quilombolas. Idem `ti_n = 0`.
- Fases e geometrias refletem a data do download (`baixado_em`); a FUNAI informa `data_atualizacao` por feição (a mais antiga é de anos atrás). Município de residência ≠ município de votação do eleitor indígena/quilombola; zonas/seções eleitorais em aldeias não foram mapeadas aqui.
- Percentuais em municípios pequenos oscilam por acaso/sigilo estatístico; considere `pop_total` ao ponderar.
- Esta camada é descritiva: correlação com padrões eleitorais não implica causalidade e não é evidência de irregularidade.

## 8. Cruzamento voto × território (`src/sociolibero/cruzamento.py`)
Correlação ponderada (votos válidos) entre a participação de Lula/Bolsonaro/Flávio e % indígena, % quilombola e % pretos+pardos
por município (n = 5570), bruta e **dentro da UF** (média estadual removida), com IC95 por bootstrap.
Resultado, estável em 2022 T1/T2 e 2026 T1: % pretos+pardos ≈ +0,6 (bruta) e ≈ +0,37 (dentro da UF) com o voto em Lula;
% quilombola ≈ +0,31 e +0,22; % indígena fraca (≈ +0,12 e +0,15; ponderada por votos, dominada por poucos municípios).
**Limites:** é correlação entre municípios, não comportamento individual (falácia ecológica); não é causal; renda, urbanização,
religião e região correlacionam com todas as variáveis; `pct_quilombola` mede população declarada, não território titulado.

## 9. Fator humano municipal (`src/sociolibero/humano.py`)
Gerado por `uv run sociolibero humano build --db <trans.db>` (ou `SOCIOLIBERO_TRANS_DB`; o caminho nunca fica no repositório) →
`web/public/data/humano_municipal.json` (`{meta:{fontes,aviso,lacunas,validacao}, anos, linhas:{ibge7:{campo:{ano:valor}}}}`) e
`web/public/data/humano_nacional.json` (`{meta:{series[{id,tabela,fonte_primaria,unidade,nivel,anos}],...}, anos, series:{id:{brasil:{ano:v}, uf:{UF:{ano:v}}}}}`).
Campo ausente = sem dado (`null` ≠ 0). Códigos IBGE de 7 dígitos; o banco já traz 7 dígitos (6 dígitos seriam convertidos pelo prefixo contra
`geo/municipios.geojson`; nesta carga: 0 conversões, 0 colisões de prefixo, 0 linhas sem match, 5.570 municípios em todas as tabelas municipais exceto saúde mental/SINAN/álcool).

**Proveniência indireta.** Nada foi baixado das fontes primárias. Os dados vêm do banco SQLite do projeto Arandu/"trans" do autor, que cita:
SIM/DATASUS (óbitos, via FTP), Atlas da Violência (Ipea/FBSP, via Ipeadata `AVIOL12_*`), SINAN Violência e SINASC (DATASUS), IBGE/SIDRA (Censo 2010/2022 e projeção),
CNES, PNS 2019, SISDEPEN/SENAPPEN. Este repositório **não reaudita aquela ETL**; confere somas, duplicatas, negativos, números publicados e `territorios.json`.
O banco é aberto somente leitura e tratado como não confiável; só agregados por município/UF/ano são exportados (nenhum nome, documento, doador, sócio, parlamentar ou alerta nominal).

| Tabela do banco | Campos exportados (município) | Anos |
|---|---|---|
| `violencia` (Atlas) | `pop`, `homicidios`, `homicidios_jovens` (15-29), `homicidios_mulheres`, `suicidios`, `taxa_homicidios` (calculada: n/pop·100 mil; o `taxa_homicidios` do banco é nulo quando n=0) | 2010-2022 (2020 excluído, ver abaixo) |
| `mortes_violentas` (SIM) | `sim_homicidios` (X85-Y09), `sim_intervencao_legal`, `sim_homicidios_{arma_fogo,jovens,mulheres}`, `vitimas_raca_informada`, `pct_vitimas_negras` (preta+parda sobre raça informada) | 2015-2023 |
| `nascidos_mae_menor` (SINASC) | `nascidos`, `mae_ate_14`, `mae_ate_17` | 2015-2023 (nacional desde 2014) |
| `violencia_infantil`, `sinan_violencia` (SINAN) | `viol_infantil_notif`, `viol_infantil_sexual`, `sinan_notif_mulheres`, `sinan_parceiro_mulheres` | 2015-2024 / 2019-2024 |
| `populacao_grupo` (IBGE) | `pop_censo`, `pop_{jovens_15_29,mulheres,brancos,pretos,pardos,amarelos,indigenas}`, `taxa_homicidios_{jovens,mulheres}` (por 100 mil do grupo) | só 2010 e 2022 |
| `saude_mental` (CNES) | `caps`, `leitos_psiq_sus` | retrato 2024 |
| `consumo_alcool`, `indicadores_sociais`, `populacao_prisional` | só em `humano_nacional.json` (UF/Brasil) | 2019 / 2012-2025 / 2025-S2 |

**Validações (resultado do build; detalhes em `meta.validacao`).**
| Checagem | Resultado |
|---|---|
| Homicídios Brasil (Atlas, banco) × publicados | 2022: 46.408 vs 46.409 publicado (−1); 2023: 45.747 = 45.747; 2024: 42.590 = 42.590. Publicados lidos em páginas de imprensa/Ipea que citam o Atlas, não no PDF do Atlas |
| Soma das 27 UFs = linha Brasil (Atlas, jovens, mulheres, população, projeção IBGE) | diferença 0 em todos os anos |
| Soma municipal × Brasil (Atlas) | municipal é menor 560-1.155/ano (≈1-2%): óbitos sem município de residência válido. Não é erro de join |
| Atlas municipal × SIM (homicídio + intervenção legal) por município | 100% idênticos em 2015-2019, 2021, 2022: o Atlas municipal do banco **é** o SIM agregado |
| **Atlas municipal 2020 corrompido** | 625 de 5.566 linhas com jovens ou mulheres > total, soma 51.755 (> UF 49.868 e > SIM 49.159), `homicidios_homens` quase vazio. Campos Atlas de 2020 ficam `null` no município; usar `sim_*` em 2020 |
| Duplicatas de chave, valores negativos, prefixo de código × coluna `uf` | 0 em todas as tabelas |
| `populacao_grupo` × `territorios.json` (Censo 2022) | pop. total: 5.570/5.570 iguais (203.080.756); indígenas cor/raça: 4.825/4.825 iguais (1.227.642); % pretos+pardos: 5.570/5.570 (dif. ≤ 0,0001 pp). Dois pipelines independentes concordam |
| `pop_indigena` oficial (1.694.836, inclui "se considera indígena") × cor/raça | divergem por definição (1.227.642 vs 1.694.752 somados em `territorios.json`) |

**Limites e o que não mede.**
- Município = **residência** (SIM, SINAN, SINASC), não ocorrência. Taxas de municípios pequenos oscilam por acaso; ponderar por `pop`.
- `sim_homicidios` (X85-Y09) exclui intervenção legal; o Atlas soma as duas. Mortes violentas de causa indeterminada (MVCI) não entram e podem esconder homicídios.
- `pct_vitimas_negras` usa só raça informada (≈1% ignorada no SIM nacional, mas muito mais em alguns municípios). Não é razão de risco: falta denominador racial anual.
- SINAN (infantil, mulheres) é **notificação**, com cobertura desigual e crescimento por ampliação da notificação (2009 → 2024), não necessariamente da violência. Município sem linha é `null` (sem notificante ≠ sem violência).
- Taxas por jovens/mulheres só em anos de Censo; nas séries nacionais o denominador é a projeção IBGE vigente no banco (uma só revisão), por isso a queda 2017-2023 da taxa de jovens (35,8%) não reproduz o 30,2% do Atlas, que usa a população de cada edição.
- Consumo de álcool municipal do banco é a taxa da UF repetida (estimativa) e **não é exportado**; população prisional é só UF, conta incidências penais e não cruza raça com crime.
- Não há população quilombola em `populacao_grupo`: a conferência com SIDRA 9578 não é possível aqui. Nada neste arquivo é causal.

## 10. Séries históricas (`src/sociolibero/series/`, `web/public/data/series_historicas.json`)
`uv run sociolibero series baixar` baixa cada fonte para `data/raw/<nome>/` com `PROVENIENCIA.json` (URL, data, SHA-256, bytes); `series build` lê **só** esses arquivos e grava o JSON.
Falha de acesso (403, certificado inválido, login, página fora do ar) é registrada em `data/raw/_falhas_series.json` e vira item de `meta.lacunas`; não se contorna (nada de `verify=False`, token ou scraping de área logada).
Respostas 200 com corpo inválido (gateway devolvendo HTML) são rejeitadas e repetidas. O WID (zip de ~880 MB) é lido por HTTP Range: só `WID_data_BR.csv` e `WID_metadata_BR.csv` são extraídos, por nome fixo.

| Fonte | Séries |
|---|---|
| Maddison Project Database 2023 (Dataverse NL, doi 10.34894/INZBF2) | PIB per capita 1820-2022 (US$ 2011) |
| Ipeadata (API odata4) | IPCA e IGP-DI anuais, salário mínimo real, Gini, PIB real/variação, desocupação, pobreza (Ipea e IBGE/PNADC), EBIA, expectativa de vida e mortalidade infantil (IBGE), analfabetismo, homicídios |
| IBGE SIDRA 6784 e 1737 | PIB per capita (variação real) e conferência de PIB e IPCA |
| Banco Mundial (WDI) | PIB per capita PPC, mortalidade infantil (UN IGME), insegurança alimentar grave (FAO/FIES), pobreza US$ 3 (só conferência) |
| Our World in Data | expectativa de vida de longo prazo |
| WID.world | participação do 1% mais rico (`sptincj992`, p99p100) |
| INPE/TerraBrasilis (arquivo `rates2025.json` do dashboard) | PRODES Amazônia Legal, soma dos 9 estados, ano PRODES = ano de término (ago-jul) |
| SlaveVoyages (`tastdb-exp-2019.csv`) | africanos desembarcados no Brasil (`SLAMIMP` somado nas regiões 50100-50500, rótulos confirmados no `.sav` oficial) |
| BCB SGS 13762 | dívida bruta/PIB, valor de dezembro |

**Regras.** Ponto ausente é omitido, nunca interpolado. Repetição de valor em anos consecutivos que a fonte usa como carry-forward (WID 1981-2001 e 2024) é removida e declarada em `notas`.
Metodologias diferentes ficam em séries separadas (ex.: pobreza Ipea encadeada vs IBGE/PNADC; EBIA/IBGE vs FIES/FAO; censos 1900-1991 vs Atlas 1991-2022) ou com `quebras` (PNAD→PNADC em 2012, mudança de fonte do PIB em 1901/1921/1948/1991/1996/2001, CID-9→CID-10 em 1996).
`qualidade`: alta = estatística oficial contínua; média = encadeada, estimada ou com quebra; baixa = reconstrução histórica incompleta ou modelo (tráfico negreiro, FIES).

**Validações (resultado em `meta.validacao`).** Por série: anos duplicados (série com duplicata não é emitida), ordenação, limites plausíveis, último ponto. Cruzadas:
IPCA Ipeadata vs SIDRA 1737 (46 anos, diferença máxima 0,005 p.p.); variação real do PIB Ipeadata vs SIDRA 6784 (28 anos, máx. 0,08 p.p.) e vs variação implícita do nível; expectativa de vida OWID vs Banco Mundial (64 anos, máx. 0,0005 ano);
mortalidade infantil IBGE vs UN IGME (23 anos, máx. 1,7 por mil); pobreza US$ 3 Ipea vs Banco Mundial (mesma trajetória, correlação 0,99, mas nível do Ipea em média 4,3 p.p. acima: não misturar);
crescimento Maddison vs Banco Mundial (correlação 0,98); homicídios: taxa × população do Maddison vs contagem (desvio máx. 6,5% em 1988-2000, diferença de população usada).

**Limites.** (i) O comentário da série `AVIOL12_THOMIC` no Ipeadata cita códigos de suicídio (provável erro de cópia); a ordem de grandeza e a conferência com a contagem indicam homicídios. (ii) SlaveVoyages: soma das viagens **documentadas** (≈3,17 mi para o Brasil), não a estimativa total do tráfico; subestima.
(iii) PRODES: 1993 e 1994 idênticos na fonte (média do biênio, não observação). (iv) Trabalhadores resgatados (MTE/Smartlab), Rede PENSSAN/VIGISAN, desocupação pré-2012 e PIB per capita real do IBGE pré-1996 ficaram em `meta.lacunas` com o motivo.
(v) Valores de 2025 de algumas séries do Ipeadata são preliminares ou estimados (marcado em `quebras`). (vi) Séries de longo prazo (Maddison, WID, expectativa de vida pré-1950) são reconstruções com incerteza grande.


## 11. Clima (`src/sociolibero/clima/`, `web/public/data/clima.json`, `docs/CLIMA_E_ECONOMIA.md`)
`uv run sociolibero clima baixar` baixa cada fonte para `data/raw/<nome>/` com `PROVENIENCIA.json` (URL, data, SHA-256, bytes) e `clima build` lê **só** esses arquivos. Mesmas regras da seção 10: 401/403/404 e erros de certificado vão para `data/raw/_falhas_clima.json` e viram `meta.lacunas`, nunca são contornados (o PLD da CCEE respondeu 403 e ficou como lacuna). Zips do INPE são lidos em memória, sem extrair para o disco, com o nome do membro validado.

| Fonte | O que entra |
|---|---|
| NOAA CPC (ONI) e PSL (MEI.v2, Niño 3.4 HadISST) | ENSO; ano Y = média nov(Y)-jan(Y+1); episódios pela regra de 5 janelas com ONI de ±0,5 |
| Berkeley Earth, NASA GISTEMP, Banco Mundial CCKP (CRU TS 4.09 e ERA5) | temperatura e chuva; anomalia de temperatura contra 1951-1980 e de chuva contra 1961-1990, calculadas no build |
| INPE Queimadas (satélite de referência, 23 zips anuais), DETER-B (WFS em blocos mensais; bloco no teto de 50.000 linhas é erro, não truncamento silencioso), PRODES (já no projeto) | focos de calor, alertas e taxa de desmatamento |
| ONS dados abertos (CKAN: EAR, ENA, CMO; CC-BY) | energia armazenada (% da capacidade), afluência (% da média) e custo marginal de operação |
| IBGE SIDRA 5932, 1419 e 7060, BCB SGS 1635 | PIB por setor (4º trimestre acumulado em 4 trimestres = ano), IPCA alimentação e energia (composição das 12 variações mensais; ano incompleto omitido) |

**Estatística.** Pearson (Spearman reportado ao lado) com IC95 por bootstrap em **blocos móveis de pares** (tamanho ≈ n^(1/3), mínimo 2; 2.000 reamostragens; semente fixa), e diferença de médias entre anos de El Niño e os demais (mesmo bootstrap). Séries com tendência secular (temperatura, focos) têm a tendência linear removida de ambas antes. Menos de 8 pares: sem estimativa. Todos os 36 testes são publicados e `meta.resumo_testes` informa quantos intervalos excluem zero contra o esperado por acaso (5%); o leitor deve descontar a multiplicidade. Inclui um controle (placebo): PIB de serviços.
**Validações** (`meta.validacao`): CRU×ERA5×Berkeley, IPCA BCB×SIDRA (diferença máxima 0), DETER×PRODES (r = 0,92, razão média 0,73).
**Curadoria** (`clima/curadoria/*.json`): episódios e cenários futuros escritos a partir de fontes abertas realmente lidas; cada item tem URL, `trecho_conferido` e `verificado`. As fichas e o capítulo 12 do IPCC AR6 foram baixados com SHA-256 (`data/raw/ipcc_ar6_america_do_sul`); o que não abriu (403, PDF ilegível, só resumo de busca) ficou fora e consta em `lacunas`.
**Macro.** `economy.Levers.climate_shock` e `climate_premium` (padrão 0,0, resultados idênticos aos anteriores, testado contra valores capturados antes da alteração). As severidades são **SUPOSIÇÕES** rotuladas, com âncoras de ordem de grandeza e grade de sensibilidade; não são estimadas dos dados.
**Limites.** (i) Séries anuais de 14-30 pontos e autocorrelacionadas: o IC cobre incerteza amostral, não de especificação. (ii) Chuva é a média nacional (CRU/ERA5); ENA do ONS é proxy hidrológico por subsistema. (iii) CMO não é PLD nem tarifa e chega a zero (2023). (iv) DETER é alerta, não taxa. (v) Berkeley termina em 2020; 2025-2026 incompletos em várias séries. (vi) Nenhuma relação é ajustada por controles: correlação não é causalidade.


## 11. Futuro tecnológico (`src/sociolibero/tecnologia.py`, `web/public/data/futuros.json`)
`uv run sociolibero futuros baixar` baixa cada fonte para `data/raw/<nome>/` com `PROVENIENCIA.json` (URL, data, SHA-256); `uv run sociolibero futuros build` ajusta as curvas, roda o macro e grava o JSON. Testes offline em `tests/test_tecnologia.py`.
Contrato: `{meta:{gerado_em,aviso,lacunas}, curvas:[{id,rotulo,dominio,modelo,parametros,fonte_dados,ajuste,pontos_observados,projecao,cenarios,limites,...}], integracao_macro:{suposicao_produtividade,resultados_2035,sensibilidade,...}}`.
**Projeção não é previsão**: é a extrapolação de uma forma funcional, com incerteza só de parâmetro (bootstrap). Mudança de regra, choque de custo ou saturação diferente da forma ajustada ficam fora da banda.

**Séries (todas abertas, baixadas e conferidas).**
| id | Dado | Fonte | Pontos |
|---|---|---|---|
| `pix_usuarios`, `pix_usuarios_bass` | usuários (PF+PJ) cadastrados no DICT, fim de mês | BCB Olinda `PixUsuariosCadastradosDICT` | 71 meses (nov/2020-set/2026); ajuste desde jun/2021 |
| `pix_transacoes` | transações por mês (soma de `QUANTIDADE` de `EstatisticasTransacoesPix`, 1 download por mês) | BCB Olinda | 71 meses; ajuste desde jun/2021 |
| `internet_domicilios` | % dos domicílios com utilização de internet | IBGE PNAD Contínua TIC, SIDRA 7307 | 9 anos (2016-2025, sem 2020) |
| `celular_pessoas` | % das pessoas 10+ com celular pessoal | IBGE PNAD Contínua TIC, SIDRA 6863 | 8 anos (2016-2024, sem 2020) |
| `solar_gd_brasil` | potência UFV de GD acumulada por ano | ANEEL, relação de empreendimentos de GD (parquet) | 2017-2025 (2026 parcial fora) |
| `solar_total_brasil` | capacidade solar instalada (GD + centralizada) | OWID (IRENA/Ember) | 2017-2025 |
| `carros_eletricos_brasil` | carros BEV+PHEV vendidos por ano | IEA via OWID | 2018-2025 |
| `computacao_treino_fronteira` (global) | maior FLOP de treino por ano | Epoch AI via OWID | 2016-2025 |
| `solar_custo_wright`, `solar_custo_moore` (global) | US$/W do módulo × capacidade global acumulada | Nemet/Lafond et al./IRENA via OWID | 1990-2024 |

**Formas e estimação.** Logística `K/(1+e^{-r(t-t0)})`; Bass (adotantes acumulados, `m, p, q`, ano de lançamento `ts` fixo); Wright `a·x^-b` (taxa de aprendizado `1-2^-b` por dobra do x acumulado); exponencial/Moore `a·e^{g(t-tref)}`. Mínimos quadrados não lineares no **log** (resíduo multiplicativo; `scipy.optimize.least_squares`, vários pontos de partida); Wright e exponencial são lineares no log. O teto (`K`, `m`) tem um limite superior de busca por curva, que é **suposição declarada** no campo `limites` (ex.: 100% para percentuais; 300 mi de usuários Pix; 4 mi/ano para carros). O limite inferior é o máximo observado.
**Incerteza:** bootstrap de resíduos (B=300, reajuste a cada réplica), que dá `p10/p90` da projeção e do parâmetro. Ele ignora autocorrelação e erro de forma, então **subestima** a incerteza. Para o teto das curvas S o `identificacao_teto` traz: teto ajustado, `p10-p90`, razão `p90/p10`, % de réplicas no limite de busca, `central_dentro_de_p10_p90` e `ajuste_na_fronteira`. Os cenários lento/base/rápido de cada curva são réplicas do bootstrap com valor em 2035 nos quantis 10/50/90 (parâmetros coerentes entre si; para custo, "rápido" = custo menor).

**Validação fora da amostra** (treina até T-k, prevê os k seguintes, k=12 meses nas séries mensais, 3 pontos nas anuais, 5 nas de custo; Wright é condicional ao x observado). Erro = MAPE do teste; baselines: ingênuo (último valor) e linear (OLS no treino).
| Curva | Modelo | MAPE teste | Ingênuo | Linear | Modelo bate os dois? |
|---|---|---|---|---|---|
| `pix_usuarios` | logística | 2,0% | 2,9% | 6,8% | sim |
| `pix_usuarios_bass` | Bass | 3,8% | 2,9% | 6,8% | não |
| `pix_transacoes` | logística | 5,8% | 10,0% | 4,3% | não (linear melhor) |
| `internet_domicilios` | logística | 0,6% | 2,3% | 6,4% | sim |
| `celular_pessoas` | logística | 1,5% | 3,7% | 0,7% | não (linear melhor) |
| `solar_gd_brasil` | logística | 34,5% | 46,0% | 37,1% | não (marginal; erro enorme) |
| `solar_total_brasil` | logística | 6,0% | 49,1% | 41,3% | sim |
| `carros_eletricos_brasil` | logística | 66,8% | 79,8% | 73,0% | sim, mas com erro de 67% |
| `computacao_treino_fronteira` | exponencial | 58,1% | 95,6% | 95,4% | sim (erro alto) |
| `solar_custo_wright` | Wright | 42,5% | 43,2% | 42,5% | empate (a queda recente de custo superou a lei) |
| `solar_custo_moore` | exponencial | 41,4% | 43,2% | 686% | marginal |
Leitura: nas séries que já estão perto do teto (internet, celular, Pix) o modelo acerta porque quase tudo é "continue perto do último valor"; nas que ainda aceleram (solar, carros, computação) o erro fora da amostra é de dezenas de % e o modelo ganha pouco ou nada do baseline. Com 8-10 pontos, trocar a janela de ajuste muda `K` em 2-3x (ex.: carros elétricos, `K` entre ~270 mil e ~760 mil por ano conforme o ano inicial).

**Teto pouco identificado (o ponto principal).** Quando a série ainda não curvou, `K` quase não é identificado (carros elétricos: `K` central 290 mil/ano, `p10-p90` 181 mil a 1,06 milhão, razão 5,9, com 9,7% das réplicas no piso). Quando a série já saturou, a curva "descobre" um teto igual ao último ponto (solar GD: `K` = máximo observado em 47% das réplicas; Pix: 98% do teto já atingido) e a banda fica estreita demais para o que se sabe de mudanças de regra (Lei 14.300/2022 e subsídios na GD, isenção/tarifa de importação nos elétricos). Estreiteza da banda não é confiança.

**Integração ao macro (`economy.py`).** Alavanca opcional em `Levers`: `tech_productivity` (pp/ano de PIB potencial quando a difusão satura; **padrão 0,0**), `tech_midpoint`, `tech_rate`, `tech_lag`. O ganho de crescimento em cada ano é `tech_productivity × S(ano - lag)`, com `S` logística normalizada a 0 em 2026 e saturando em 1; o hiato do produto usa o potencial elevado (para a Selic não reagir a um "hiato" que é só produtividade). Com `tech_productivity = 0` as trajetórias são idênticas bit a bit às anteriores (teste de regressão com valores calculados pelo código antigo).
Os três cenários de difusão vêm das curvas: duração 10%→90% do teto de cada curva de adoção brasileira (`logistica`/Bass central, 7 curvas): lento = 3º quartil (11,2 anos), base = mediana (6,6), rápido = 1º quartil (4,7); `tech_rate = 2 ln9 / duração`, `tech_midpoint = 2025 + duração/2`, defasagem 1 ano. Internet e celular entram com durações longas (15 e 42 anos) porque só mostram a cauda de uma curva já saturada; a derivação é, portanto, sensível à escolha das curvas.
**Suposição explícita e rotulada (julgamento, não estimativa):** 0,3 pp/ano de PIB potencial na saturação, varrida de 0,05 a 1,0. Âncoras de literatura (citadas de memória, **não reconferidas nesta execução**; conferir antes de citar): Acemoglu (2024, NBER w32487), ganho de PTF de IA ≤ ~0,7% em 10 anos (~0,07 pp/ano, EUA); McKinsey (2023), 0,1-0,6 pp/ano de produtividade do trabalho por IA generativa até 2040; Goldman Sachs (2023), ~1,5 pp/ano em 10 anos nos EUA (extremo otimista). Nenhuma é do Brasil e a faixa cobre uma ordem de grandeza e meia: o efeito no macro é praticamente proporcional à suposição. Não há deslocamento de emprego, custo de transição, efeito fiscal direto nem distribuição do ganho; é um limite superior do que "ter a tecnologia" faz, não uma previsão.
Resultado (cenário `pragmatico` com choques e sementes idênticos, base macro offline `data.FALLBACK`; mediana das diferenças pareadas; referência 2035: dívida 101,4% do PIB, Selic 11,4%, IPCA 3,45%, PIB 1,21%; 2038: 105,6%, 11,9%, 3,49%, 1,03%). Com 0,3 pp/ano:
| Difusão | Δ dívida/PIB 2035 | Δ Selic 2035 | Δ IPCA 2035 | Δ PIB 2035 (a.a.) | Δ dívida/PIB 2038 | Δ PIB nível 2038 |
|---|---|---|---|---|---|---|
| lenta | -0,9 pp | -0,06 pp | -0,01 pp | +0,23 pp | -1,9 pp | +1,8% |
| base | -1,6 pp | -0,11 pp | -0,01 pp | +0,31 pp | -2,7 pp | +2,6% |
| rápida | -1,9 pp | -0,14 pp | -0,02 pp | +0,33 pp | -3,1 pp | +3,0% |
Sensibilidade (campo `sensibilidade`): em 2035, `base`, a dívida cai 0,3 / 0,5 / 1,0 / 1,6 / 2,6 / 5,1 pp para 0,05 / 0,1 / 0,2 / 0,3 / 0,5 / 1,0 pp/ano; defasagem de 0 a 3 anos move o resultado de -1,8 a -1,0 pp; deslocar o ponto médio ±2 anos, de -2,0 a -1,0 pp. O efeito é pequeno frente à própria incerteza da trajetória (`p10-p90` da dívida em 2035 de ±6 pp), e as diferenças pareadas não incluem incerteza sobre o tamanho do ganho, que domina.

**Lacunas.** ABVE/Fenabrave (emplacamentos de elétricos e híbridos): sem série aberta baixável confirmada, substituída por IEA/OWID (BEV+PHEV, anual); Cetic.br TIC Domicílios não baixado (usado IBGE/SIDRA); solar centralizada separada da GD: sem série aberta que a separe, não derivada; ABSOLAR/EPE não consultadas; custo por FLOP de hardware (Moore) sem série aberta confirmada, usado FLOP de treino na fronteira (mede escala, não custo); uso efetivo do Pix (usuários ativos) não existe aberto, só cadastro; 2020 não existe na PNAD TIC; curvas de custo solar e computação são **globais**.
**Limites de fonte.** A data da GD da ANEEL vem de `DthAtualizaCadastralEmpreend` (única data do arquivo; a soma acumulada, ~53,7 GW de UFV, é coerente com o parque conhecido, mas pode não ser a data de conexão). O download do parquet da ANEEL (106 MB) quebrou no meio no cliente padrão e foi retomado com `curl -C -`; o SHA-256 registrado é do arquivo completo. O mês corrente do Pix (set/2026) foi incluído porque o volume é coerente com o anterior.


## Custo da corrupção e benefícios a empresas (`corrupcao.py`)

Curadoria manual (`corrupcao_curadoria.json`) validada por `corrupcao.validar` (tipos, faixas, DOIs, ids de decisão) e convertida em `web/public/data/custo_corrupcao.json`; tabelas em `docs/CUSTO_DA_CORRUPCAO.md`.
- **Contagem × estimativa** em todo valor; `verificado:true` só se o número foi lido na fonte primária (links de imprensa foram rebaixados a `false`). Nunca se soma entre linhas (`nao_somar`).
- **Âncora:** PIB nominal 2025 = R$ 12.700 bi (IBGE; arredondado, não verificado). `valor_financeiro` de cada decisão = `primary_target` / 100 × PIB, em preços do ano da âncora; é escala em R$ de um delta que continua sendo julgamento.
- **Recuperação:** desvio de referência 1,84% do PIB (ponto médio FIESP, percepção); recuperar 10/25/50% vira primário adicional no `economy.simulate` determinístico. Resultado, pareado com `BASELINE` (2035): +0,18/+0,46/+0,92 pp de primário (R$ 23/58/117 bi/ano) dão dívida/PIB -1,6/-4,0/-7,9 pp e Selic -0,12/-0,31/-0,61 pp. A parte irrecuperável e a incerteza da estimativa macro não estão no intervalo; é suposição, não previsão.
- **Lacunas e divergências** ficam em `meta.lacunas` e `meta.divergencias`; Mauro (1995) não reproduz os números da premissa inicial (ver doc).

## Camada climática RS (projeto climate) (`src/sociolibero/climars.py`, `web/public/data/clima_rs_municipal.json`)

Saída de `uv run sociolibero climars build`. Cobre os 497 municípios do RS (código IBGE de 7 dígitos) com o **índice de prioridade preventiva** e seus componentes, mais campos medidos e modelados úteis. Não é previsão de cheia: ordena onde a próxima tempestade encontra a pior combinação de impacto já observado (MUNIC 2024, evento de 26/04/2024), déficit declarado de prevenção e exposição.

**Proveniência indireta.** Nenhum número é recalculado aqui. Os dados vêm do snapshot congelado (`web/public/static-api/`, capturado em 2026-08-09) da API do projeto irmão `climate` do usuário (Central de Risco Climática RS), que cita as fontes primárias: IBGE MUNIC 2024 (impacto, déficit, grupos expostos), IBGE malha e população, NOAA CPC ONI (perigo sazonal), JRC Global Surface Water 1984-2021 (memória hídrica), GHSL (superfície construída), IBGE BDiA 1:250.000 e GHCN-Daily (CN e erosão), ANA, CNES e OpenStreetMap. A cadeia ETL do projeto climate não foi reauditada aqui; o módulo apenas lê o snapshot (nunca escreve no projeto de origem), junta por código IBGE e valida.

**Conteúdo por município (`linhas[cod]`).** `indice` (score atual, estrutural e OND 2026, nível, `basis`, `completude`, `cobertura_peso` derivada aqui, posição no ranking); `componentes` (impacto, déficit de prevenção, exposição, perigo sazonal, manutenção de ativos, cada um com `valor` e `basis` próprio; `detalhe` só para impacto, déficit e exposição); `medidos` (memória hídrica JRC, superfície construída GHSL, dano viário e ilhamento, escore geotécnico); `modelados` (Curve Number e índice RUSLE, com a ressalva de que só ordenam). Fórmula do índice: `R = 100 * (0,38 I + 0,34 D + 0,28 E) * (0,62 + 0,38 H)`, com renormalização sobre os componentes presentes; cortes fixos 55/42/28 (alto, elevado, moderado). O cenário estrutural não tem H.

**Regras de rigor preservadas e conferidas.** (1) Ausência é `null`, nunca `0`; os 183 componentes iguais a zero (39 de impacto, 144 de déficit) são zeros medidos de municípios que responderam. (2) Selo por componente (ver `docs/SELOS_DE_PROVENIENCIA.md`); `manutencao_ativos` é sempre `null` por falta de base pública. (3) Cobertura mínima de peso 0,60 e impacto ou déficit presente (ADR-019 do projeto climate): zero violações nas 497 linhas; 37 municípios `parcial` (cobertura 0,66) e 1 `insuficiente`. (4) Bagé (4301602) não respondeu ao suplemento: `score = null`, `cobertura_peso = 0,28`, sem posição no ranking, em vez de ser promovida pelo componente de exposição (90/100 na primeira versão do projeto de origem).

**Validações gravadas em `meta.validacao`.** Junção com `web/public/data/geo/municipios.geojson`: 497 do RS nos dois lados, nenhuma ausência. População do snapshot (estimativa 2024) contra `territorios.json` `pop_total` (Censo 2022): soma 11.229.915 contra 10.882.965 (+3,19%), mediana da diferença absoluta 2,1%, nenhum município acima de 10% (maior: Cruzeiro do Sul, +8,4%); diferença esperada por serem anos diferentes. Reprodução da fórmula do índice: diferença máxima 0,1 ponto (arredondamento do multiplicador de 4 casas). Um nome diverge da malha (`SantAna do Livramento` no snapshot; o JSON usa o nome da malha em `nome`).

**Limites.** Retrato de um único evento; auto-declaração municipal com incentivo assimétrico; perigo sazonal estadual e uniforme (desloca o nível, não reordena); pesos editoriais não calibrados contra desfecho; memória hídrica fora do índice (arrozais irrigados); CN e RUSLE sem calibração contra vazão; malha do IBGE exclui as grandes lagoas; o snapshot é de 2026-08-09 e não se atualiza sozinho. No cenário atual o snapshot dá selo `measured` ao perigo sazonal e o model card o descreve como `modeled`; a inconsistência foi preservada e declarada em `meta.ressalvas`.


## Evoluções (Markov) (`markov.py`)

Detalhe, tabelas e cemitério em `docs/EVOLUCOES_MARKOV.md`; saída em `web/public/data/evolucoes.json`; reprodução: `uv run sociolibero evolucoes baixar && uv run sociolibero evolucoes build`. **Markov não é previsão**: extrapola frequências de transição; eventos raros e choques externos não estão no modelo; os p10-p90 são incerteza de parâmetro.
- **Dados:** regime político por país-ano (Regimes of the World / V-Dem v16 via OWID, **CC BY 4.0**, `data/raw/owid_political_regime/` e `owid_continentes/` com `PROVENIENCIA.json`), 183 países, 1900-2025 (Brasil 1822-2025). Brasil em 2025: democracia eleitoral (desde 1987), verificado no dado; 2026 não existe na fonte. A classificação V-Dem **diverge** da periodização de `historia.json` (ex.: 1950-86 = autocracia eleitoral).
- **Estimação:** contagens + Dirichlet, encolhimento hierárquico Brasil → América Latina → mundo (kappa por verossimilhança marginal leave-one-country-out: 20 e 100); IC90 por amostragem do posterior; estacionária, duração esperada, primeira passagem (alvo absorvente) e fan 2027-2038.
- **Pressuposto testado (e refutado em parte):** duração geométrica rejeitada (Weibull beta ≈ 0,6-0,8; semi-Markov vence o Markov fora da amostra, mas não é monótono em democracias), ordem 2 e heterogeneidade por era/continente rejeitadas; os p-valores vêm de um **nulo simulado** (o qui-quadrado nominal erra: 32% de falso positivo na ordem 2).
- **Validação:** leave-country-out, leave-continent-out, leave-AL-out e cortes temporais (1960/1980/2000), h = 1, 5, 10, contra persistência calibrada e climatologia, log-loss e Brier, bootstrap por país, calibração por faixas; a cadeia vence a persistência (log-loss 0,207 vs 0,231 em h=1), mas P^h perde para a previsão direta em h ≥ 5. Controles sintéticos: painel com P conhecida (cobertura IC90 89%), cadeia do tamanho do Brasil (prior fraco: cobertura 72%), HMM de parâmetros conhecidos.
- **Regimes econômicos:** IGP-DI e PIB real em classes com cortes declarados; cadeia Dirichlet e HMM gaussiano (Baum-Welch em NumPy). Resultado honesto: a cadeia **não bate a climatologia** no crescimento (HMM k=1 por BIC) e **perde para a persistência** na inflação em 3-5 anos.
- **Cadeia de cenários:** matriz 4×4 por ciclo eleitoral **julgada**, ancorada em duas taxas empíricas (erosão 0,067 e recuperação 0,063 por 4 anos); sensibilidade por Dirichlet, varredura e variantes; macro esperada por mistura de seções transversais das amostras de `scenarios.run` (sem dependência de trajetória; acima de 120% de dívida não é projeção) e tempo até ruptura por cenário.
- **Lacunas:** sem 2026, sem série longa de Selic/dívida (regimes de juros e dívida não estimados), imputação histórica da fonte não marcada.

## Testes de estresse pessimistas (`pessimismo.py`)

Saída de `uv run sociolibero pessimismo build` (`web/public/data/pessimismo.json`); texto completo, tabelas e limites em `docs/PESSIMISMO_E_ESTRESSE.md`. **Cenários de risco, não previsões.** Não altera `economy.py`, `decisoes.py` nem `scenarios.py`; base macro offline `data.FALLBACK`.
- **Eficiência de execução** (`execution_efficiency` ∈ [0,1], padrão 1,0 = resultados atuais, com teste de regressão): multiplica os deltas que melhoram (`supply_reform>0`, `fiscal_credibility>0`, `primary_target>0`, `institutional_risk<0`, `bc_erosion<0`); os que pioram ficam integrais. Varredura de 100% a 40% e ranking pela perda de benefício em dívida/PIB 2035 e em R$ bi/ano. A eficiência **não é medida**: proxies do repositório (obras federais paralisadas 41-51%, execução de emendas 67%) dão faixa 0,49-0,67; central 0,6. Mais frágeis em valor absoluto: reforçar o arcabouço (perde 8,5 pp de dívida/PIB a 40%), desvincular o mínimo, nova Previdência, cortar gastos tributários; três decisões de benefício pequeno viram prejuízo na faixa (minerais críticos, rastreio do ouro, terras indígenas).
- **Vazamento/desperdício:** desvio de referência 1,84% do PIB (FIESP/Decomtec, não verificado) × fração fiscal 10/25/50% (suposição) e desperdício 0,5-1,5% do PIB (suposição) entram como redução do alvo de primário e da oferta (0-0,27 pp/ano por pp, teto em Mauro 1995). Central combinado: +13 pp de dívida/PIB 2035.
- **Cenário adverso composto** (credibilidade -0,40, BC +0,30, risco institucional +0,45, clima 0,6/0,6, eficiência 0,6, tecnologia 0) sobre `pragmatico` e `hegemonia`, 5 sementes × 2.000 trajetórias; ruptura = dívida > 120%. Pragmático: P(ruptura) de 2% a 100%; níveis acima do limiar são artefato e marcados `valido_como_trajetoria=false`. Reverse stress (4.096 combinações): a credibilidade fiscal sozinha, de 0,80 para ~0,385, basta; nenhum outro choque isolado rompe.
- **Liderança judicial:** vagas 2028/2029/2030, quórum de 41, distribuição exata de vagas capturadas por cenário e risco institucional resultante; efeito no macro de +3,5 a +4,2 pp (hegemonia, extremo) contra o contrafactual técnico, com sensibilidade a `prem_inst` (suposição).
- **Validação:** regressão (eficiência 1,0 = catálogo; valores dourados), monotonicidade (0 violações em 30 decisões), 5 sementes e piso de ruído (0,28 pp no p50), cemitério com 9 itens. **Não capturado:** câmbio, dívida indexada (a erosão do BC não piora a dívida no modelo), defasagem das decisões e das vagas, falha da reação fiscal, efeitos sociais.

## Quebras estruturais (`src/sociolibero/quebras.py`, `web/public/data/quebras.json`, `docs/QUEBRAS_ESTRUTURAIS.md`)
`uv run sociolibero quebras build` valida os detectores com dados sintéticos (verdade conhecida), escolhe o procedimento pela validação (não pelas séries reais), aplica às séries anuais com 20 anos consecutivos ou mais e cruza as quebras com as datas históricas.
- **Detectores:** sup-F/Quandt-Andrews (degrau e dobradiça, com tendência linear como incômodo), CUSUM de quadrados com variância de longo prazo (variância), OLS-CUSUM, Bayes factor com mistura sobre τ, segmentação MDL/BIC por programação dinâmica, Page, Shiryaev-Roberts e BOCPD (online, só com o passado) e o oráculo com τ conhecido (teto).
- **Calibração:** p por bootstrap AR(1) com φ̂ da série, reestimando φ̂ em cada réplica (nunca tabela de série limpa); Holm sobre todos os nós testados de todas as séries (séries × candidatas); BH registrado.
- **Validação (α=0,05):** FPR do procedimento final de 0,01-0,07 em AR(1), AR(1) com tendência, ARCH e outliers com n ≥ 50, mas 0,18 em passeio aleatório com n=50 (0,08 com n=100) e 0,07-0,29 com n ≤ 30 no `alt`; poder: salto de 5 desvios, 0,67 (n=50) e 0,97 (n=100); de 3 desvios, 0,17 e 0,55; mudança de inclinação de 7σ, 0,68 e 0,96; razão de desvios ×3, 0,33 e 0,84. Para n < 30, ~0,04. O oráculo com τ conhecido chega a 0,995 onde varrer τ dá 0,46 (n=50, 5σ).
- **Falhas declaradas:** degrau sem tendência e Page/SR/MDL cru dão FPR 0,2-0,9 em série com tendência ou I(1); variância por LR gaussiana, 0,36-0,78 sob ARCH/outliers (trocada pela HAC); duas quebras são subestimadas (escada ~0-4%); tendência e curvatura geram quebras espúrias; quebra de inclinação perto da borda não é vista.
- **Resultado nas séries reais:** 18 séries testadas, 12 sem n suficiente (`meta.lacunas`). Sobreviveram 4 quebras, 2 delas artefato metodológico (PIB, 1948-49); restam 2 (expectativa de vida 2016, tráfico negreiro 1700), ambas provável má especificação. O controle metodológico recuperou 2 de 14 artefatos registrados (0,23 esperado por acaso): o detector acha artefatos grandes e perde pequenos.
- **Cruzamento com a história:** 1 das 2 quebras cai a ≤ 2 anos de uma data histórica; esperado por acaso 1,22; p de permutação 1,00 (81% dos anos estão a ≤ 2 anos de alguma data). **Coincidência não é causa**, e sem poder para testar.
- **Não diz:** causa nem evento; ausência de quebra em série curta (o poder é baixo); quebra em série com curvatura, ciclo ou mais de uma quebra; qualquer coisa sobre séries com menos de 20 anos consecutivos.

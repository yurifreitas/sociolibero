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

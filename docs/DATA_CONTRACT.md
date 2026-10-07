# Contrato de dados (pipeline Python → frontend)

Tudo é estático, servido de `web/public/data/` e gerado por `uv run sociolibero eleicoes build`.
Chaves de município = **código IBGE de 7 dígitos como string** (ex.: `"3550308"`).
Todo número exibido na UI deve poder ser rastreado até `meta.fonte`, `meta.baixado_em` e `meta.sha256`.

## `index.json`
```json
{ "gerado_em": "2026-10-06T...Z",
  "geo": "geo/municipios.geojson",
  "eleicoes": [ {"id":"pres_2022_t1","rotulo":"Presidente 2022 · 1º turno","ano":2022,"turno":1,
                 "cargo":"Presidente","status":"oficial|preliminar","municipios":5570} ],
  "forense": ["pres_2022_t1"],
  "validacao_sintetica": "forensics/validacao_sintetica.json",
  "referencias": "references.json" }
```

## `geo/municipios.geojson`
FeatureCollection (IBGE, qualidade mínima). `properties`: `{ibge, nome, uf}`.

## `elections/{id}.json`
```json
{ "meta": { "id":"pres_2022_t1", "rotulo":"...", "ano":2022, "turno":1, "cargo":"Presidente",
            "status":"oficial", "fonte":"https://cdn.tse.jus.br/...zip", "baixado_em":"ISO",
            "sha256":"...", "candidatos":[{"numero":13,"nome":"LULA","partido":"PT"}] },
  "linhas": { "3550308": { "aptos":9000000, "comparecimento":7000000, "validos":6800000,
                           "brancos":90000, "nulos":110000, "votos":{"13":3000000,"22":2900000} } } }
```
Exterior (ZZ) e municípios sem correspondência no IBGE ficam fora de `linhas` e são listados em
`meta.sem_correspondencia` (validação do join).

## `forensics/{id}.json`
```json
{ "meta": { "id":"pres_2022_t1", "testes":[ {"chave":"zt","rotulo":"Comparecimento vs vizinhos",
             "descricao":"...", "interpretacao":"...", "limitacoes":"..."} ],
            "aviso":"Anomalia estatística não é prova de fraude." },
  "nacional": { "fingerprint": {"x_bins":[...],"y_bins":[...],"contagem":[[...]]},
                "benford_2bl": {"digitos":[0,...,9],"observado":[...],"esperado":[...],"p":0.31},
                "ultimo_digito": {"digitos":[...],"observado":[...],"esperado":[...],"p":0.52} },
  "linhas": { "3550308": { "n_secoes":12000, "zt":0.4, "zs":{"13":-1.2,"22":1.1}, "zn":0.2,
              "ld_p":0.41, "b2_p":0.66, "bunching":0.0, "score":12, "confianca":"alta|media|baixa",
              "flags":["zt"] } } }
```
`z*` = z-score robusto (mediana/MAD) contra municípios vizinhos (contiguidade). `*_p` = p-valor
(ajustado para múltiplas comparações no `score`). `score` 0–100 = prioridade de auditoria, **não** prova.
`confianca` depende do nº de eleitores aptos (alta ≥ 20 mil, média ≥ 5 mil, baixa abaixo): municípios pequenos oscilam por acaso. Testes de dígito exigem ≥ 100 contagens (≈ 50 seções), senão `null`.
Campos extras: `rho` (Spearman comparecimento×voto), `rho_z` (z empírico nacional, usado no flag), `mult5_p`, `bunching`. `b2_p` (Benford 2º dígito) é publicado só por transparência e **fora do score**.
`nacional.calibracao`: fração de municípios com p<0,05 (esperado ≈ 5% se o teste for válido) e `persistencia` (flags repetidos entre pleitos).

## `forensics/validacao_sintetica.json`
Poder/falsos positivos de cada detector com fraude injetada sinteticamente (ground truth):
`{ "cenarios":[ {"nome":"enchimento de urna","intensidade":[0.01,0.02,...],
  "detectores":{"zt":{"tpr":[...],"fpr":0.05},"ld_p":{...}} } ] }`

## `references.json`
`[{ "id","categoria","titulo","autores","ano","url","doi","o_que_aproveitar","verificado":true }]`
Categorias: `forense-eleitoral`, `dados-abertos`, `visualizacao`, `antifraude-gastos`, `seguranca-urna`.

## `decisoes.json` (camada de decisões — gerado por `uv run sociolibero decisoes`)
```json
{ "meta": { "baseline":"pragmatico", "referencia_2035":{"debt":104.5,"selic":12.1,"ipca":3.5,"gdp":1.1},
            "composicao":{"camara":{"PL":121,...},"senado":{"PL":28,...}},
            "quoruns":{"PEC":{"camara":308,"senado":49},"LC":{"camara":257,"senado":41}},
            "aviso":"..." },
  "decisoes": [ { "id":"reforcar-arcabouco","rotulo":"...","dominio":"fiscal|monetário|tributário|institucional|social|setorial|externo",
      "instrumento":"PEC|LC|LO|SENADO_ABS|SENADO_2_3|EXECUTIVO","ideologia":0.5,"controversia":0.35,
      "deltas":{"primary_target":1.2,"fiscal_credibility":0.2},"racional":"...",
      "ganhadores":["..."],"perdedores":["..."],"defasagem_anos":2,"reversibilidade":"alta|média|baixa",
      "base_evidencia":"julgamento",
      "p_aprovacao":{"direita":0.42,"esquerda":0.09},
      "impacto_2035":{"debt":-15.2,"selic":-1.8,"ipca":-0.1,"gdp":0.2} } ] }
```
`impacto_2035` = variação vs. o cenário pragmático **se aprovada** (pp do PIB, pp a.a.). `p_aprovacao` é
condicional à presidência (quem ocupa o Planalto) e usa o quórum real × composição eleita em 2026.
Visual sugerido: dispersão **viabilidade (P) × impacto (Δdívida)**, quadrantes "fácil e bom / difícil e bom /
fácil e ruim / difícil e ruim", alternando presidência; tabela com instrumento/quórum, ganhadores/perdedores,
defasagem, reversibilidade e o aviso de que efeitos são *julgamentos*.

## `exposicao.json` (opcional, quando disponível)
Estrutura econômica municipal (IBGE/SIDRA): `{ "linhas": { ibge: {"agro":0.31,"industria":0.12,"servicos":0.35,"adm_publica":0.22} } }`
para cruzar decisões × municípios (ex.: quem perde com reforma administrativa ou ganha com acordo Mercosul–UE).

## Notas de implementação (reconciliadas com o frontend)
- `fingerprint.contagem` é `[x][y]` (x = comparecimento, y = voto do líder); `x_bins`/`y_bins` são **bordas** (n+1 valores).
- `zs`, `ld_p`, `b2_p`, `rho`, `mult5_p`, `bunching` podem ser `null` (poucas seções/vizinhos). `null` ≠ 0.
- Na validação sintética o detector de correlação chama-se `rho_p`; na UI corresponde ao teste `rho`.
- `meta.score` descreve a fórmula do score; `nacional.calibracao` traz fração com p<0,05 e `persistencia`.
- `historia.json`: cada evento tem `trilha` (`estado|indigena|quilombola`) ou `trilhas[]`/`cruza[]` para cruzamentos; sem trilha ⇒ `estado`.
- `territorios.json`: `pct_*` em fração **ou** percentual (a UI infere pelo máximo do arquivo); preferir um só e documentar.
- Caminhos padrão quando ausentes do `index.json`: `historia.json`, `territorios.json`, `decisoes.json`, `exposicao.json`, `references.json`.

## Terceira rodada (Evoluções, Anéis, Corrupção, Pessimismo, Quebras, Risco RS)
Todos os arquivos abaixo são opcionais; ausência vira estado vazio (`PageGate`), nunca zero. Esquemas zod em `web/src/features/*/schemas.ts`
(`looseObject`, campos `nullish`).

| arquivo | consumido por | pontos de atenção |
|---|---|---|
| `evolucoes.json` | História › Evoluções, home | `regimes_politicos` (matrizes Brasil/AL/Mundo com IC90, primeira passagem, semi-Markov, validação leave-country-out, cemitério), `regimes_economicos` (resultados nulos), `cadeia_cenarios` (matriz **julgada**, ocupação, ruptura da dívida > 120%). |
| `cenarios_macro.json` | editor "e se?" | Gerado por `web/scripts/make-cenarios-macro.py` (`scenarios.run`, semente 7, n=2000): p10/p50/p90 por cenário e ano. A mistura no navegador é a média das medianas ponderada pela ocupação: aproxima (~1 pp na dívida de 2038: 159,5 contra 158,1 publicado), não reproduz a mistura exata. |
| `aneis.json` | História › Anéis | `aneis[].arestas[]` (`sinal`, `forca`, `contestada`, `ramal`, `evidencia[]`), `interacoes`, `aneis_ausentes`. `simulado` é verdadeiro em 4 anéis, enquanto o relatório do agente fala em 7 com cobertura parcial: a UI mostra o campo, não o texto. |
| `custo_corrupcao.json` | /corrupcao | `areas[].valores[]` com `tipo` (contagem/estimativa) e `verificado`. **Divergência:** o texto do arquivo está sem acentos (gerado antes da regra); a UI exibe como está. |
| `clima_valor_financeiro.json` | /corrupcao › clima, /clima | Razões prevenção × resposta não se reconciliam (TCU 2,3 × CNseg 9,7); não somar itens. |
| `clima_rs_municipal.json` | mapa (camada "Risco climático RS"), município RS, painel | 497 municípios: 459 completos, 37 parciais, 1 sem índice. Município sem índice (`indice` nulo) é hachurado e fora do ranking; nunca "risco baixo". `basis` por componente alimenta o selo. |
| `pessimismo.json` | /pessimismo › estresse | Eficiência de execução, adverso composto (com reverse stress) e bloco judicial **sem nomes**: mostra a vaga que abre por ano. |
| `visoes_pessimistas.json` | /pessimismo › visões | Mecanismos com leitura contrária ao lado; proxies de capacidade estatal dizem o que não medem. |
| `quebras.json` | /quebras | Quebras por série (`oco` = artefato metodológico), cruzamento com a história (14/15 coincidências contra 14,2 esperadas, p=1,0), validação (poder, FPR, detectores descartados). |

Selo `basis` (`medido|modelado|sintetico`) é eixo separado do `status` e da verificação. `bases.json` (gerado por `pnpm bases` a partir dos metas
reais) passou a incluir: evolucoes, cadeia-cenarios, aneis, quebras, custo-corrupcao, clima-valor, clima-rs, pessimismo, visoes-pessimistas.
O seletor de matriz da aba Evoluções oferece Brasil/AL/Mundo; o semi-Markov não tem matriz única e aparece só na projeção e na tabela de primeira passagem.


## `marx_capitalismo.json` (página `/marx`)
`{meta{gerado_em,aviso,criterio_verificacao}, textos[], definicoes[], teses[], contra_argumentos[], mal_entendidos[], pensadores[], o_que_muda_no_projeto[], sintese, limites[]}`.
- `textos[]`: `{id, autor, obra, ano(int), secao, idioma_original, idioma_do_trecho, trecho_original, traducao_pt, fonte_da_traducao, url, verificado_literal, tema, leitura_curta, nota_de_fonte}`.
  A UI usa `idioma_do_trecho` (cai para `idioma_original`) para o atributo `lang` (de/fr/en). **Divergência:** `idioma_original` traz variantes
  livres ("francês (manuscrito)", "alemão (carta); frase de Marx em francês"); `nota_de_fonte` é sempre texto, e a UI sinaliza "página MEW não conferida" por regex `/não conferid/`.
- `verificado_literal=true` atesta que o trecho aparece palavra por palavra na URL citada, **não** que a página seja edição crítica. 52 de 66 URLs são o espelho de terceiros `read.19491007.xyz` (MEW/Zeno): a UI mostra aviso por cartão sempre que o host não é marxists.org nem gutenberg.
- `teses[]`: `{id,titulo,enunciado,premissas[],textos_de_apoio[ids],autores[],leituras_rivais[],objecoes[],respostas[],evidencia,qualidade_da_evidencia,como_seria_refutada,ligacoes{decisoes,pilares,aneis}}`.
  `contra_argumentos[]`, `mal_entendidos[]` e `definicoes[]` (sem `id`; a UI ancora por slug de `termo`) citam trechos por id; a UI constrói o índice reverso "Citado em".
- `pensadores[]`: `{id,nome,obra_chave[],posicao,relacao_com_marx,id_no_projeto_pilares_pensamento}`; `verificado` nas obras significa só que a página abre com título e ano (autores resumidos de memória).
- O aviso fixo "a tese do 'não implementável' NÃO está em Marx" lê o `mal_entendidos` cujo id começa com `m01`.
- Links de entrada: `/marx?aba=<textos|teses|contra|mal|defs|pensadores|muda>&i=<id>` (rola e destaca) e `&t=<id>` (mostra um trecho).

## `pensadores_violencia.json` (página `/violencia`)
`{meta, pensadores[], tipologia[], dialogos[], dados_do_repositorio[], custo_economico[], perguntas_abertas[], limites[]}`.
- `pensadores[]`: `{id,nome,tradicao(texto livre),obra_chave[{titulo,ano,url,doi,verificado}],ideia_central,conceitos[],explica_no_brasil,evidencias[{descricao,fonte,url,verificado}],criticas,ligacoes{pilares,decisoes,indicadores,aneis}}`.
  **Divergência:** não há campo de família; a UI deriva 6 grupos por regex de `tradicao` (`features/violencia/model.ts`). `ligacoes.pilares` mistura ids de pilares e de pensadores de `pilares_pensamento.json`; `ligacoes.indicadores` mistura ids de `fator_humano.json` e `series:<chave>` de `humano_nacional.json`.
- `dados_do_repositorio[]`: `valor` pode ser `null` ("sem dado", nunca zero). A discrepância SIM (2.274) × FBSP (6.393) em 2023 vem da `nota` da linha `series:sim_intervencao_legal`: a UI extrai o número do FBSP por regex e mostra os dois lado a lado, sem reconciliar.
- `custo_economico[]`: `tipo` = contagem|estimativa; `valor_rs_bi` pode ser `null`; `verificado` = lido em página que cita o órgão (documentos primários não abertos).
- O debate punitivista × preventivo é o diálogo `becker × sampson`; `divergencia` traz as duas "melhores versões", a evidência e a síntese em texto corrido, que a UI separa por regex (cai para o texto bruto se o padrão mudar).
- Links de entrada: `/violencia?p=<id>` abre o detalhe; `&aba=<tipologia|dialogos|dados|custo|debate|perguntas>`; `&g=<grupo>` filtra.


## Quinta rodada (Biblioteca, Eleições, Classes, Indígenas, Voto do analfabeto)
Rotas: `/biblioteca`, `/eleicoes`, `/classes`, `/indigenas-eleicoes`, `/voto-analfabeto` e a camada de mapa `m=analfabetos`. Grupo de navegação "Eleições e poder".
Todos os esquemas são `looseObject` com campos `nullish`: o que não está no contrato é ignorado, não quebra.

### `textos_index.json` + `textos/<id>.txt` (página `/biblioteca`)
`{meta{titulo,gerado_em,descricao,como_verificar_hash,n_textos,n_sem_texto,n_caracteres_total}, documentos[], sem_texto_integral[]}`.
- `documentos[]`: `{id,titulo,data,ano,tipo,subtipo,autoridade,status,arquivo,texto_disponivel,origem{url,espelho,tipo_de_fonte,data_captura,sha256,sha256_arquivo},tipo_de_versao,n_caracteres,trechos_chave[],conferencia{status,conferido_contra,observacoes,lacunas},dominio_publico,base_legal_dominio_publico,texto_vigente_url}`.
- `trechos_chave[]`: `{id,rotulo,tema,ancora,por_que_importa,eleicoes_ids[],movimentos_ids[],historia_ids[],indigenas_ids[]}`; a UI localiza `ancora` no corpo sem diferenciar acento e maiúsculas, e destaca; âncora não encontrada aparece como aviso, nunca some em silêncio.
- **Formato do `.txt`:** cabeçalho de proveniência, depois a linha exata `=== TEXTO ===`, depois o corpo. **Armadilha:** o cabeçalho cita o marcador entre aspas, então o corpo começa na linha que é só o marcador (regex multilinha `^=== TEXTO ===$`), não na primeira ocorrência da string.
- **Hash:** `origem.sha256` = SHA-256 do corpo (tudo após a linha do marcador, sem o `\n` final, UTF-8); `origem.sha256_arquivo` = SHA-256 do arquivo inteiro. Conferido nos 44 textos. O botão "Verificar hash no navegador" refaz o cálculo (SubtleCrypto).
- `conferencia.status` é texto livre; a UI classifica por substring (`original conferido` > `parcial` > `fonte única`). Hoje: 6 conferidos, 12 parciais, 26 de fonte única.
- `sem_texto_integral[]` (6) aparecem como cartões só com metadados e link (direito autoral). Texto de até ~300 mil caracteres: o leitor divide em blocos memoizados com `content-visibility: auto`.
- Links de entrada: `/biblioteca?id=<doc>&trecho=<id>` (+ filtros `tipo,status,versao,conf,tema,q`).

### `eleicoes_timeline.json` (página `/eleicoes`)
`{meta{gerado_em,aviso,criterio_verificacao,revisado_em,revisao[]}, eleicoes[], movimentos[], regras_ao_longo_do_tempo[], limites[]}`.
- `eleicoes[]` (60, incluindo marcos de regra que não são eleição): `{id,ano,data,cargo,tipo,regime,regras_de_voto{quem_votava,voto_secreto,mulheres,analfabetos,obrigatorio,idade_minima,regras_verificado},eleitorado{valor,pct_populacao,tipo,fonte,url,nota,verificado},comparecimento{...},resultados[],sistema,financiamento,mudancas_de_regra[],movimentos_ids[],eventos_historia_ids[],fontes[]}`.
  **Divergência:** `eleitorado.valor` é número ou texto (estimativa, faixa); a UI formata sem converter. Booleanos nulos viram "sem dado", nunca "não".
- `movimentos[]` (30): `{id,nome,periodo,espectro,origem,como_se_construiu[{passo,data,descricao,fonte,url,verificado}],pautas[],base_social,organizacao[],midia_e_tecnologia[],financiamento_e_regras,aliancas_e_rupturas[],viradas[],resultado_eleitoral[],declinio_ou_transformacao,controversias,eleicoes_ids[],fontes[]}`. `periodo` é texto livre ("1932–1937"); `parsePeriodo` extrai ano inicial e final por regex e cai para ponto se só houver um ano.
- `espectro` é convenção editorial (rótulos fixos em `features/eleicoes/model.ts`), assim como a faixa de regimes da timeline; nenhum dos dois é medição.
- `meta.revisao[]` (174): `{id,campo,antes,depois,motivo,fonte{titulo,url},verificado,data}`; `antes`/`depois` podem ser texto, número ou objeto (a UI serializa). 166 `verificado:true`, 8 `false`.
- Links de entrada: `/eleicoes?e=<id>`, `?m=<id>`, `?aba=<movimentos|regras|revisao>`, `?ep=<época>`, filtros `tipo,esp,reg,q`.

### `classes_interesses.json` (página `/classes`)
`{meta{gerado_em,aviso,criterio_verificacao,contagens}, classes[], teorias[], matriz_regra_x_classe[], pessimas_decisoes[], futuro[], limites[]}`.
- `classes[]` (23): `{id,nome,base_material,interesses{voto,sistema,financiamento,terra,estado},aliados[],periodos[],ganhou_perdeu[{regra,efeito,evidencia,fonte,url,verificado}],leitura_contraria,status_interesses,movimentos_ids[],fontes[]}`.
- `matriz_regra_x_classe[]` (79 células, esparsa): `{regra,classe_id,ganha_ou_perde,nota}`; célula ausente = **sem leitura** (não "neutro"). `ganha_ou_perde` aceita `ganha|perde|ambiguo|ambíguo`; qualquer outro valor vira "?".
- `pessimas_decisoes[]` (19): `custo_ou_efeito{valor(texto),tipo(contagem|estimativa),fonte,url,nota,verificado}`; `valor` é texto livre, nunca somado. `futuro[]` (14): `{proposta,status,quem_ganha_perde,evidencia_comparada,riscos,sinais_precoces[],mecanismo_na_cadeia,aneis_ids[],decisoes_ids[],propostas_ids[]}`; ids de decisão ausentes em `decisoes.json` aparecem sem link.
- `fontes` em classes e teorias pode ser string (com URL embutida e `[lido]`) ou objeto; a UI extrai a URL por regex.

### `indigenas_eleicoes.json` (página `/indigenas-eleicoes`)
`{meta{gerado_em,aviso,fontes[{nome,url,sha256}],lacunas[]}, linha_do_tempo[], candidaturas{anos{2014,2018,2022,2026},municipal_2024,censo_2022,eleitorado_2022_cor_raca,eleitorado_2024_cor_raca,validacao{comparacoes[]}}, municipios_indigenas{metodo,resultados{<pleito>{comparacoes[]}},secoes_em_terras_indigenas,ressalvas[]}, eleitos_figuras_publicas[], limites[]}`.
- **Divergência (4 anos gerais × 5 ciclos):** `candidaturas.anos` tem 2014, 2018, 2022 e 2026 (eleições gerais), mais `municipal_2024` à parte; a UI não emenda gerais com municipais no mesmo gráfico. 2026 é preliminar.
- `validacao.comparacoes[]` traz números calculados × publicados com `diferenca`; diferenças ≠ 0 são destacadas e **não reconciliadas** (inclui o caso Waiãpi). Cor/raça "não informado" no eleitorado impede qualquer % indígena real.
- Comparação **municipal** (`comparacoes[].diferenca_pp_dentro_da_uf`, IC95 bootstrap) e **por seção** (`secoes_em_terras_indigenas.comportamento.turnos`, só 2022) aparecem lado a lado; a UI diz quando o sinal municipal some por seção. Ambas são agregadas (falácia ecológica).
- `eleitos_figuras_publicas[]`: só cargos federais e governos; nenhum nome não eleito.

### `eleitorado_analfabeto.json` e `analfabetos_municipal.json` (página `/voto-analfabeto` e camada de mapa)
`eleitorado_analfabeto.json`: `{meta, historia[9], serie_analfabetismo[], serie_eleitorado_por_instrucao_nacional_sem_exterior{<ano>}, eleitorado_por_instrucao, comparecimento_por_instrucao, cruzamentos{metodo,resultados{pres_2022_t1,pres_2022_t2,pres_2026_t1},ressalvas}, projecao_2038, teorias[], validacao, limites[]}`.
- **Divergência:** `comparecimento_por_instrucao['2026']` é `null` (sem dado) e `ressalva` é string no mesmo objeto dos anos; a UI só oferece 2022 e 2024. Células etárias com menos de 500 aptos viram "—".
- `historia[].eleitorado.pct_populacao` pode ser `null` (Estado Novo); `verificado:false` aparece como "estimativa".
- `projecao_2038.faixa.nacional_por_ano[ano]` traz **duas faixas**: `analfabetos.p10/p90` (simulada, estreita: só incerteza de κ e entrantes) e `analfabetos_faixa_calibrada_p10_p90` (soma o erro RMS da validação). Na validação retrospectiva a simulada cobriu só **33%** (`cobertura_faixa_p10_p90`, 6 previsões); o gráfico mostra as duas e a nota manda ler a calibrada.
- `analfabetos_municipal.json` (3,9 MB, carregado só quando a camada é aberta): `{<ibge7>:{uf,'2022','2024','2026'}}`, cada ano `{eleitores,analfabeto,le_escreve,pct_analfabeto,pct_le_escreve,pct_analfabeto_60mais}` ou `null`. 2022: 5.570 de 5.571 municípios com dado (5101837 sem perfil, hachurado). Camada `m=analfabetos`, `y=2022|2024|2026`.

### Bases e páginas
`bases.json` ganhou: `biblioteca-textos`, `biblioteca-fontes`, `eleicoes-timeline`, `classes-interesses`, `indigenas-eleicoes`, `eleitorado-analfabeto`, `voto-analfabeto`; `PageKey` ganhou `biblioteca|eleicoes|classes|indigenas|voto`. Os números dos chips são lidos dos arquivos. Os subtítulos de página citam "60 eleições e marcos" e "30 movimentos" como texto fixo (pendente: ler de `meta`).

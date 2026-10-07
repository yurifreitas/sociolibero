# Selos de proveniência (`basis`) e invariantes deste repositório

Origem: o README do projeto irmão `climate` ("Central de Risco Climática RS") lista 8 invariantes de rigor e o vocabulário `provenance.basis`. Este documento os adapta ao `sociolibero`, mapeia o vocabulário que já usamos e audita onde os JSON de `web/public/data/` cumprem ou violam cada regra. Data da auditoria: 2026-10-06. A auditoria foi feita lendo os arquivos reais (contagens por script), não os documentos; o que não foi lido está dito.

## 1. Vocabulário `basis`

Um selo diz **que tipo de número** é, não se ele foi conferido (isso é outro eixo, seção 3).

| `basis` | Significado | Exemplos aqui |
|---|---|---|
| `measured` | Observado e registrado por alguém: contagem, medição, declaração, registro administrativo. Aritmética direta sobre medidos (soma, razão, taxa) continua `measured`, com a origem dita em `derivado_de`. | População do Censo 2022, homicídios do SIM, impacto declarado ao IBGE (MUNIC 2024), superfície construída (GHSL) |
| `modeled` | Resultado de modelo, ajuste, estimativa estatística ou escolha editorial aplicada a medidos. Tem hipóteses que podem falhar. | Índice de prioridade preventiva (pesos editoriais), Curve Number, erosão RUSLE, curvas de difusão tecnológica, MAPE de teste |
| `synthetic` | Gerado por simulação, suposição ou cenário; não observa nem ajusta nada do mundo. | Severidades do choque climático (0,1/0,3/0,6 pp, `integracao_macro`), dados sintéticos de validação, cenário "OND 2026" ancorado em ONI 2,0 |
| ausente (`null`) | Sem valor, **sem selo**. Selo sem valor é erro. | `manutencao_ativos` (sempre nulo), Bagé sem índice |

Regras:
- O selo vai **por componente** e por campo numérico, não só no envelope. O composto de componentes mistos é `modeled`.
- `measured` não promete que o número está certo: a auto-declaração de uma prefeitura ao IBGE é `measured` (foi o que declarou) e tem incentivo assimétrico, dito em `ressalvas`.
- Cada selo viaja com a data da fonte: "foi medido" e "quando" são informações distintas.

## 2. As 8 invariantes aplicadas aqui

1. **A defasagem vai no nome.** Toda variável que entra numa relação ou previsão com lag declara o lag no id: `nino_pib_total_lag0_1996`, nunca `nino_pib`. Em `relacoes[].defasagem` o texto ("mesmo ano", "ano seguinte") repete o que o id diz.
2. **O gate anti-vazamento roda por fold e cobre o que ajustou z-score, PCA, CDF ou normalização**, não só o valor. Qualquer padronização "nacional" ou por amostra inteira usada num teste fora da amostra é vazamento até prova em contrário (`docs/RIGOR_DE_VALIDACAO.md`, regra 3).
3. **Nenhuma métrica é reportada como valor pontual.** Correlação, erro (MAPE), skill e estimativa em R$ saem com intervalo (IC bootstrap em blocos para séries autocorrelacionadas) ou faixa; sem faixa, o campo diz por quê.
4. **Aceitação = limite inferior do IC de 90% > 0.** Enquanto um modelo, relação ou detector não passa, vale a referência ingênua (climatologia, último valor, tendência linear) e a interface diz isso. "Não distinguível de zero" é resultado publicável.
5. **Cores e rótulos de dado pertencem ao dado.** Cor semântica de escala (frio/quente, bom/ruim) não é usada como cromo de interface. (Regra herdada do climate, ADR-023; aplicação ao `web/src` não foi auditada aqui.)
6. **Pré-registro:** hipóteses, lista de testes, pesos e cortes são congelados e datados **antes** de olhar o resultado. Mudar a especificação por causa de um resultado observado invalida aquele experimento; recomeça-se com novo registro datado, e hipóteses falsificadas ficam registradas (regra 9 de `RIGOR_DE_VALIDACAO.md`).
7. **Todo número derivado carrega `basis`, por componente.** Índice composto = `modeled`; cada componente mantém o seu selo.
8. **Ausência é `null` (na interface, "—"), nunca `0`.** Zero só quando medido como zero. Zero com significado diferente (por exemplo "nenhuma feição sobrepõe o município") fica documentado no `meta` e não se mistura com ausência. Quem não respondeu fica fora do ranking em vez de promovido por falta de dado (caso Bagé, seção 5).

## 3. Mapeamento do vocabulário atual para `basis`

Nossos arquivos usam dois eixos misturados: a **natureza** do número (oficial, derivado, julgamento, contagem, estimativa) e o **estado de conferência** (`verificado`, "link ok", "não verificado"). O selo `basis` cobre só a natureza; a conferência fica como segundo campo.

| Vocabulário atual | Onde aparece | `basis` | Campo adicional |
|---|---|---|---|
| `oficial` | `bases.json` (`status`), `index.json` | `measured` | `fonte_primaria: true` |
| `preliminar` | `bases.json`, `index.json` | `measured` | `preliminar: true` (sujeito a revisão da fonte) |
| `parcial` | `bases.json` | `measured` | `cobertura < 1` (o selo não muda; a cobertura sim) |
| `derivado` | `bases.json` | `measured` se for aritmética direta (soma, taxa); `modeled` se houver ajuste ou modelo | `derivado_de: [ids]` |
| `julgamento` | `bases.json` | `modeled` (escolha editorial sobre medidos) | `julgamento: true` |
| `tipo: contagem` | `custo_corrupcao`, `fator_humano`, `antes_de_1500`, `clima_valor_financeiro` | `measured` | soma de registros ou declarações |
| `tipo: estimativa` / `natureza: estimativa` | idem | `modeled` (avaliação de terceiros ou nossa) | `faixa` obrigatória |
| cenário, suposição, severidade assumida | `clima.json` (`integracao_macro`), `futuros.json` | `synthetic` | `suposicao: true` |
| `qualidade: alta/media/baixa` | `clima.json`, `series_historicas.json` | não é `basis`: é confiança | manter como está |
| `verificado: true` | quase todos | não é `basis` | `verificacao: "verificado"` (número lido na fonte) |
| `verificado: false` / "não verificado" | todos | não é `basis` | `verificacao: "nao_verificado"` |
| "link ok" | `bases.json` | não é `basis` | `verificacao: "link_ok"` (URL respondeu 200 e bate com o tema; **não** confere o número) |
| `corrobora` / `diverge` | `humano_nacional.json` | não é `basis` | resultado de conferência cruzada |

Regra de leitura: `basis` responde "que tipo de número?"; `verificacao` responde "alguém conferiu na fonte?". Um `measured` + `nao_verificado` é um número que alguém declarou medido e que ainda não reabrimos.

## 4. Auditoria dos JSON (2026-10-06)

Arquivos lidos: os 21 de `web/public/data/` mais `clima_rs_municipal.json` e `clima_valor_financeiro.json` (novos). Os demais subdiretórios (`elections/`, `forensics/`, `geo/`) não foram auditados.

| # | Invariante | Veredito | Evidência real |
|---|---|---|---|
| 1 | Lag no nome | Cumpre onde há relação | `clima.json`: `relacoes[].id` = `nino_pib_total_lag0_1996`, `nino_pib_total_lag0_longo`, `nino_pib_agro_lag0`; campo `defasagem` = "mesmo ano". Séries (`oni_mensal`, `oni_pico_ndj`) não têm lag porque não são preditores. Não auditei `quebras.json` nem `futuros.json` para lags. |
| 2 | Gate por fold | Não demonstrado | `docs/RIGOR_DE_VALIDACAO.md`, "Lacunas": "Auditar o uso de estatísticas globais (z nacional, normalização por amostra completa) contra vazamento (regra 3)" está listada como pendente. `futuros.json` usa holdout temporal (k pontos finais), que evita vazamento do futuro no ajuste da curva, mas não há gate por fold para normalizações. |
| 3 | Selo `basis` por componente | **Viola** | `basis` não aparece em nenhum dos 21 arquivos anteriores; aparece só em `clima_rs_municipal.json` (5.964 ocorrências). Os arquivos têm `tipo`, `status`, `qualidade` ou `verificado`, mas nenhum selo por campo numérico. `humano_municipal.json` declara a fonte só no nível da tabela (`meta.fontes`), não por campo. |
| 4 | Ausência é null, nunca 0 | Em geral cumpre; dois pontos de atenção | Cumpre: `humano_municipal.json` ("só aparecem campos/anos com dado (null ≠ 0)"; `consumo_alcool` municipal não é exportado por ser taxa da UF repetida); `territorios.json` (29 `null` em `pop_indigena_em_ti` e 36 em `pop_quilombola_em_territorio`, SIDRA `X`/`..` viram `null`; zero SIDRA `-` é zero verdadeiro). Atenção 1: `territorios.json` tem 4.999 municípios com `ti_n = 0` e `ti_area_ha = 0`, que significam "nenhuma feição sobrepõe", convenção documentada no `meta` mas indistinguível de "camada não avaliada" olhando só o campo. Atenção 2 (possível violação): `humano_nacional.json`, `series/viol_infantil_negligencia/uf/RO/2009 = 0` e `2011 = 0` entre anos com 3, 5 e 14 notificações; é contagem de notificação SINAN, e zeros em UF/ano de implantação do sistema podem ser ausência de notificação, não ausência de casos. Não conferi na fonte se são zeros reais. |
| 5 | Pré-registro | **Não cumpre** | Não encontrei registro datado da lista de testes antes de rodar. Em `clima.json` os 36 testes de `relacoes` são todos publicados (bom: 6 intervalos excluem zero, ~1,8 esperados por acaso), mas a lista nasceu junto com o resultado. Recomendação: congelar a lista de relações em arquivo datado antes de uma nova rodada. |
| 6 | Aceitação por IC | Parcial | `clima.json`: IC95 por bootstrap em blocos em toda `relacoes[].estatistica`, e a leitura dos "não se sustentam" é feita (intervalos incluem zero). O critério explícito "limite inferior do IC 90% > 0, senão vale a referência" não está escrito como regra; é aplicado por leitura. `futuros.json` compara com baselines (`baseline_erro_teste`: ingênuo e linear). |
| 7 | Nenhuma métrica pontual | **Viola em parte** | `custo_corrupcao.json`: 101 registros com valor em R$, 72 sem `faixa_rs_bi`; 20 deles são `tipo: estimativa` pontual (por exemplo "Indice de Economia Subterranea ETCO/FGV-Ibre 2020: 17,1% do PIB (~R$ 1,2 tri)"). `futuros.json`: erro de teste publicado como `mape_pct` pontual (`erro_teste`), sem IC. Cumpre: `clima.json` (IC95), `quebras.json` (taxas de falso positivo em validação), `clima_valor_financeiro.json` (itens pontuais declaram o escopo e `tipo`; faixa só quando a fonte dá). |
| 8 | Cores de dado | Não auditado | Fora do escopo (`web/src` não foi lido). |

Outros achados:
- `pilares_pensamento.json`: 135 de 139 itens `verificado: false`; `leis_tecnologicas.json`: 57 de 115. Declarar `false` é cumprir a transparência, mas números nesses itens circulam sem selo de natureza.
- `references.json`: 113 `verificado: true` e 14 `false` (ver `docs/REFERENCES.md`). O "verificado" de DOI significa título, autores e ano conferidos no Crossref; o texto não foi lido.
- `bases.json`: "link ok 163/168" confere URL e tema, não o número; o próprio arquivo avisa. O vocabulário `status` tem 20 de 22 itens com atenção (`parcial` 12, `derivado` 4, `julgamento` 3, `preliminar` 1).

## 5. Como a camada nova aplica os selos

`web/public/data/clima_rs_municipal.json` (`uv run sociolibero climars build`) é a primeira saída com selo por componente: `impacto`, `deficit_prevencao`, `exposicao` e `perigo_sazonal` trazem `basis` próprio; `indice.basis` do composto é `modeled`; `manutencao_ativos` é `null` com selo `null`; CN e erosão são `modeled`; memória hídrica e superfície construída são `measured`. Validações gravadas em `meta.validacao`: regra de cobertura mínima 0,60 (zero violações), reprodução da fórmula do índice (diferença máxima 0,1 ponto, arredondamento do multiplicador), e Bagé sem índice (`completude: insuficiente`, `cobertura_peso: 0,28`) em vez de promovida pelo componente de exposição. Inconsistência herdada do projeto climate, preservada e declarada em `meta.ressalvas`: no cenário atual o snapshot dá selo `measured` ao perigo sazonal, e o model card do mesmo arquivo o chama de `modeled`.

## 6. Próximos passos sugeridos (não executados)

1. Acrescentar `basis` e `verificacao` aos geradores dos 21 JSON anteriores (campo por campo onde houver número; por bloco onde o bloco é homogêneo), começando por `humano_municipal.json` e `territorios.json`.
2. Exigir `faixa` para todo `tipo: estimativa` em `custo_corrupcao.json` e `fator_humano.json`, ou `faixa: null` com motivo.
3. Dar IC (bootstrap em blocos) ao `mape_pct` de `futuros.json`.
4. Congelar com data a lista de relações de `clima.json` antes da próxima rodada e escrever a regra de aceitação (item 4 das invariantes) em `docs/METHODS.md`.
5. Conferir na fonte os zeros de `viol_infantil_*` por UF/ano antes de exibi-los como número.

# Evoluções possíveis por cadeias de Markov (`markov.py`)

> **Markov não é previsão.** As cadeias abaixo extrapolam frequências históricas de transição sob um pressuposto
> (estado discreto; probabilidade de sair depende só do estado atual) que os testes deste documento **refutam em parte**.
> Eventos raros e choques externos não estão no modelo. Os intervalos p10-p90 são incerteza sobre os **parâmetros**, não sobre o futuro.
> A matriz da cadeia de cenários (parte 3) é **suposição** rotulada, ancorada em duas taxas empíricas.

Reprodução: `uv run sociolibero evolucoes baixar && uv run sociolibero evolucoes build` (~5 min; `--rapido` para depurar). Saída: `web/public/data/evolucoes.json`. Testes: `tests/test_markov.py` (offline).

## 1. Dados e proveniência
| Fonte | Uso | Licença | Pasta (URL, data, SHA-256 em `PROVENIENCIA.json`) |
|---|---|---|---|
| Regimes of the World (Lührmann et al. 2018), V-Dem v16 via Our World in Data, 1789-2025, 205 entidades | estado por país-ano | **CC BY 4.0** (conferida em `political-regime.metadata.json`, `origins[0].license`) | `data/raw/owid_political_regime/` |
| Continentes OWID | grupos do leave-region-out | CC BY 4.0 | `data/raw/owid_continentes/` |
| `series_historicas.json` (IGP-DI 1945-2025, IPCA 1980-2025, PIB real 1901-2025) | regimes econômicos | Ipeadata | ver `fonte` de cada série |
| `scenarios.py`/`economy.py` | cadeia de cenários | — | mesmas amostras de `scenarios.run(seed=7, n=2000)` (teste de consistência) |

Estados: 0 autocracia fechada, 1 autocracia eleitoral, 2 democracia eleitoral, 3 democracia liberal. Não houve cadastro nem 403. **Estado atual do Brasil (verificado no dado): 2025 = democracia eleitoral, desde 1987**; 2026 ainda não existe na fonte.

Cuidados: a fonte imputa regimes de entes históricos a países ainda não soberanos e não marca as linhas imputadas; por isso o painel usa **1900-2025** e o Brasil **1822-2025**. Entidades históricas (`OWID_*`) foram descartadas (183 países). Ex-colônias com séries duplicadas reduzem as unidades independentes: os ICs são provavelmente estreitos.

**A classificação não é a periodização do projeto.** V-Dem/RoW codifica o Brasil como autocracia eleitoral de 1950 a 1986 e como autocracia fechada em 1930-49 (`brasil_por_periodo_historia` no JSON): a "República de 1946" de `historia.json` aparece como 15 anos de autocracia eleitoral e 4 de fechada; o Império, 57 de 66 anos como fechada. O Brasil nunca é "democracia liberal" no dado.

## 2. Método (regimes políticos)
- **Contagens + Dirichlet por linha.** Mundo: prior 0,5/célula. América Latina (20 países): `Dirichlet(kappa_AL · P_mundo + contagens AL)`. Brasil: `Dirichlet(kappa_BR · P_AL sem Brasil + contagens do Brasil 1822-2025)` (o Brasil não é contado duas vezes).
- **kappa** por verossimilhança marginal Dirichlet-multinomial leave-one-country-out dentro da AL (grade 1-1000): `kappa_AL = 20`, `kappa_BR = 100`.
- **Incerteza:** 3000 amostras do posterior; todo IC é o intervalo de 90% (quantis 5-95) das amostras. Estacionária por solução linear, duração esperada `1/(1-p_ii)`, primeira passagem por matriz com alvo absorvente.
- **Projeção do Brasil 2027-2038:** parte do estado de 2025 (2 passos até 2027). Fan p10/p50/p90 da probabilidade de cada estado sobre o posterior; alternativas (global, AL, global só 1990+, semi-Markov) em `projecao_brasil_alternativas` e `semi_markov_brasil`.

## 3. Testes do pressuposto markoviano
Todo p-valor de LRT é lido contra um **nulo simulado** (100 painéis de cadeia homogênea com a mesma máscara de ausência), porque o qui-quadrado nominal é inexato em células raras: o corte nominal do LRT de ordem 2 é ultrapassado em **32%** das simulações do nulo (esperado 5%); o de era, 6%; os de Weibull, 4-7%. Todos os LRT observados ficam muito além do p95 do nulo (p empírico ≤ 0,02, o mínimo possível com 100 sims é 0,01).

| Pressuposto | Teste | Resultado |
|---|---|---|
| Permanência geométrica | Weibull discreta vs geométrica (spells sem censura à esquerda, censura à direita tratada) | **Rejeitado.** beta = 0,64 / 0,63 / 0,79 / 0,67 (fechada / eleitoral / dem. eleitoral / liberal); LRT 94 / 127 / 12 / 8. Risco de sair cai com a idade nas autocracias; na democracia eleitoral cai até ~16 anos e a faixa 32+ volta a subir (15 saídas em 233 exposições): **não monótono**. |
| Ordem 1 | ordem 2 vs 1 | LRT 259 (gl 16, p empírico 0,01); BIC 8560 vs 8659; fora da amostra o ganho é pequeno mas distinguível de zero (log-loss 0,2014 vs 0,2067, ep 0,001). |
| Homogeneidade | matriz comum vs por era (1900-45, 46-89, 90-2024) e por continente | **Rejeitada** (LRT 270 e 275). A matriz de 1900-49 prevê 2000-24 pior (0,269) que a de 1990-99 (0,262); a própria amostra de 2000-24 dá o teto (0,243). Brasil vs resto da AL: LRT 7,4, p = 0,60 — **sem poder**, não é prova de igualdade. |
| Chapman-Kolmogorov (P^h = previsão direta de h passos) | log-loss leave-country-out | Previsão direta ganha de P^h em h=5 (0,523 vs 0,530) e h=10 (0,694 vs 0,720). |
| Semi-Markov (risco por faixa de idade) | leave-country-out nos pontos com idade conhecida | Vence o Markov: log-loss 0,243 vs 0,254 (h=1), 0,596 vs 0,622 (h=5), 0,773 vs 0,812 (h=10). |

## 4. Validação fora da amostra
Modelos: cadeia (P^h), previsão direta, **persistência calibrada** (probabilidade de ficar = taxa de treino; baseline correta), persistência dura (0,99; só Brier/log-loss de referência), climatologia (estacionária da matriz de treino), semi-Markov. Métricas: log-loss (nats, menor é melhor) e Brier por transição; diferenças pareadas com **bootstrap por país** (piso de ruído: ganho dentro de ±1 ep é "não distinguível de zero").

Leave-country-out (183 países, 21001 transições a 1 ano):
| h | cadeia | direto | persist. calibrada | persist. dura | climatologia |
|---|---|---|---|---|---|
| 1 | **0,207** | 0,207 | 0,231 | 0,268 | 1,297 |
| 5 | 0,530 | **0,523** | 0,581 | 0,865 | 1,302 |
| 10 | 0,720 | **0,694** | 0,764 | 1,262 | 1,310 |

Cadeia vs persistência calibrada: -0,024 / -0,050 / -0,044 nats (ep 0,002 / 0,007 / 0,011), distinguível de zero. No **Brier** a diferença é minúscula (h=1: 0,0865 vs 0,0872): o ganho está nas probabilidades das raras trocas, não na classe mais provável.
Splits adicionais (regra de ≥3 splits): leave-continent-out (6) e leave-AL-out reproduzem a ordem dos modelos (cadeia 0,209/0,545/0,747 nos continentes); cortes temporais 1960/1980/2000 (treina antes, testa depois) também, com log-loss absoluto pior (ex.: h=1, 0,258/0,276/0,269). O leave-country-out é o teto otimista: países da mesma época compartilham choques.
**América Latina:** a matriz AL encolhida bate a global (log-loss 0,299 vs 0,319, h=1; 0,708 vs 0,767, h=5; 0,886 vs 0,969, h=10; todos distinguíveis de zero) — justifica a hierarquia.
**Calibração por faixas** (cadeia, leave-country-out; `calibracao_por_faixas_loco`): ECE 0,003 (h=1), 0,020 (h=5), 0,045 (h=10); em h=10 a cadeia é pior calibrada nas faixas intermediárias (previsto 0,32, observado 0,18).

Controles de verdade conhecida:
- **Painel sintético** com P conhecida (máscara real, 100 réplicas): erro absoluto médio por célula 0,0017; cobertura do IC90 **89%**; ganho do oráculo sobre o estimado 0,0003 nats/transição (o teto informacional é praticamente alcançado com 21 mil transições).
- **Cadeia do tamanho do Brasil** (204 passos, P conhecida): prior fraco dá erro 0,096 e cobertura do IC90 de **72%**; encolhimento ao prior certo, erro 0,005 e cobertura 85%; a prior **errada** (global), erro 0,013 e cobertura 84%. Ou seja, sem hierarquia o Brasil sozinho é inestimável, e mesmo com ela o IC90 tem cobertura ~85%, não 90%.
- **HMM** de parâmetros conhecidos (regimes econômicos): ver §6.

## 5. Resultados (regimes políticos)
**Matrizes anuais** (média posterior; IC90, contagens e `n_transicoes` no JSON): mundo 21001 transições; AL 2459; Brasil 200. Estacionária (Brasil, média): 0,20 / 0,31 / 0,34 / 0,15 com ICs muito largos (ex.: liberal 0,004-0,76), porque o Brasil quase não visita os extremos.
**Duração esperada geométrica** (anos; mundo): 30 / 12 / 18 / 68; Brasil: 11 / 15 / 47 (IC 23-166) / 95 (IC 33-1684). Pelo semi-Markov essas durações deixam de ser constantes.

**Primeira passagem para autocracia (fechada ou eleitoral), a partir de democracia eleitoral** (p; IC90):
| matriz | 5 anos | 10 anos | 12 anos |
|---|---|---|---|
| Brasil (encolhida) | 8,3% (2,0-17,9) | 15,7% (4,0-32,4) | 18,5% (4,7-37,4) |
| América Latina | 10,6% | 19,8% | 23,2% |
| Mundo | 16,9% | 29,8% | 34,0% |
| **Semi-Markov global, idade 39** | 19,4% (12,4-28,2) | 33,5% (22,6-45,0) | 38,1% (26,2-50,1) |
A partir de democracia liberal o risco é de 0,3-1,2% em 5 anos e 1,4-4,4% em 12 (conforme a matriz). Para o alvo estrito "autocracia eleitoral" (Brasil): 6,2% / 12,5% / 15,0%. O resultado depende fortemente da matriz e do modelo de duração: **a faixa honesta é 8% a 19% em 5 anos**, não um número.

**Projeção 2027-2038 do Brasil** (matriz Brasil, a partir de democracia eleitoral em 2025): P(democracia eleitoral) cai de 0,96 (2027, p10-p90 0,93-0,98) para **0,79 em 2038 (p10-p90 0,63-0,91)**; autocracia eleitoral 0,11 e fechada 0,05; democracia liberal 0,02. O semi-Markov global dá 0,51 (0,39-0,62) para democracia eleitoral em 2038 e 0,17 para liberal (a matriz Brasil e o semi-Markov **discordam**; nenhum é a "resposta"). Isso é incerteza de parâmetro e de especificação, **não** a probabilidade de um golpe específico.

## 6. Regimes econômicos
- **Inflação** (IGP-DI anual 1945-2025; IPCA concorda em 83% dos anos 1980-2025): cortes declarados baixa < 8%, moderada 8-30%, alta 30-300%, hiperinflação >= 300%. **Crescimento** (variação real do PIB 1901-2025): recessão < 0, baixo 0-2,5%, médio 2,5-5%, alto >= 5%. Os cortes são escolhas, não estimativas.
- **Cadeia:** Dirichlet(4 · frequência marginal + contagens). **HMM gaussiano** (Baum-Welch em NumPy, 4 inícios, pi0 = estacionária; inflação em `ln(1+IGP/100)`); k por BIC. Inflação: k=3. Crescimento: BIC escolhe **k=1** (um regime) — usa-se k=2 para a comparação.
- **Controle sintético do HMM** (A, médias e DPs conhecidos, 30 réplicas): com T=125, erro absoluto médio das médias 0,4/0,2, dos DPs 0,23/0,16, das diagonais de A 0,04-0,05; com T=500 cai à metade; BIC escolhe k=2 em 100% das réplicas; acurácia de decodificação 0,919 vs 0,922 do oráculo.
- **Validação (origem móvel, treina até t, prevê t+h; h=1,3,5; blocos de origens por época):**
  - Inflação, log-loss: h=1 cadeia 0,999, persistência calibrada **0,986**, HMM 1,369, climatologia 1,450; h=3 cadeia 1,521 vs persistência **1,275**; h=5 1,785 vs **1,422**. A persistência calibrada **vence** a cadeia e o HMM; só a climatologia é pior.
  - Crescimento: cadeia 1,336, climatologia **1,318**, HMM 1,312, persistência 1,414 (h=1): **a cadeia não bate a climatologia**; o crescimento anual é quase i.i.d. nas classes.
- **Distribuição 2027-2038 (condicionada ao último ano: IGP-DI 2025 = -1,2%, "baixa"; PIB 2025 = 2,3%, "baixo")**: inflação 2038, cadeia (p50): baixa 0,28, moderada 0,40, alta 0,24, hiper 0,05 (hiper p10-p90 0,02-0,13); HMM: 0,25 / 0,47 / 0,22 / 0,06. Crescimento 2038, cadeia: recessão 0,14, baixo 0,20, médio 0,26, alto 0,41. **Leia como a distribuição incondicional dos últimos 80-125 anos**: a memória do estado atual desaparece em poucos anos e a validação mostra que a cadeia não acrescenta informação além da climatologia (crescimento) ou da persistência (inflação). O regime atual de inflação baixa não está ancorado no modelo (a inflação 2026-38 depende do regime monetário, que a cadeia não conhece).

## 7. Cadeia de cenários (liga ao modelo macro)
Estados: `lula`, `pragmatico`, `hegemonia`, `extremo` (de `scenarios.py`); ciclos 2026 → 2030 → 2034 → 2038 (2026 = quem governa 2027-30; 2030 governa 2031-34; 2034 governa 2035-38; 2038 só ocupação).
**Origem da matriz (rotulada, não é estimativa).**
- *Ancorado no dado* (matriz Brasil, h = 4 anos): `eps` = P(democracia eleitoral → autocracia) = **0,067**, usada (× `m_erosao` = 2) como taxa hegemonia → extremo; `rho` = P(autocracia eleitoral → democracia) = **0,063**, a saída de `extremo`. O mapeamento regime V-Dem → cenário é suposição.
- *Reuso:* pesos de direita `WEIGHTS_IF_FLAVIO` (0,50/0,35/0,15), já julgamento de `scenarios.py`.
- *Só julgado:* permanência da esquerda 0,40; alternância 0,40; deriva do pragmático (0,70/0,25/0,05); captura reduz a alternância pela metade; moderação 0,15.
- Distribuição inicial = pesos de `scenarios.run` em 2026 (P de Flávio = 0,80 no simulador de 2º turno; eleição em 25/10/2026 em aberto).

Matriz julgada (linhas = de, colunas = para): lula [0,40 0,30 0,21 0,09]; pragmático [0,40 0,42 0,15 0,03]; hegemonia [0,17 0,10 0,59 0,13]; extremo [0,025 0,019 0,019 0,94].
**Ocupação por ciclo** (lula/prag/heg/ext): 2026 0,20/0,40/0,28/0,12; 2030 0,29/0,26/0,27/0,18; 2034 0,27/0,23/0,26/0,24; 2038 0,25/0,21/0,25/0,29. `extremo` acumula porque a saída empírica de regimes erodidos é rara (rho = 6%).
**Macro esperada** (mistura de seções transversais com as amostras de `scenarios.run`; **sem dependência de trajetória**, a dívida herdada na troca de cenário é ignorada): em 2030, dívida/PIB p10/p50/p90 = 93/99/106%, Selic 10,5/12,7/15,6%, IPCA 3,0/4,1/5,6%, PIB -0,6/0,7/2,1%. Em 2038 as medianas passam de 120% de dívida (181%, p10-p90 105-324%) — **faixa em que o modelo macro não vale como projeção**; leia `fracao_acima_de_120_por_ano` (0,19 em 2032, 0,59 em 2034, 0,78 em 2038).
**Tempo até ruptura (dívida > 120%), usando as trajetórias existentes:** P até 2038 / tempo esperado restrito (anos desde 2026; censura em 13): lula 99,95% / 8,6; pragmático 3,2% / 12,96; hegemonia 100% / 7,2; extremo 100% / 6,1; mistura da cadeia 78%.
**O que muda se a matriz muda (2038):**
| variante | ocupação lula/prag/heg/ext | P(ruptura) | dívida p10/p50/p90 |
|---|---|---|---|
| julgada | 0,25/0,21/0,25/0,29 | 0,78 | 105/181/324 |
| sem erosão (m=0) | 0,28/0,23/0,31/0,19 | 0,77 | 104/176/303 |
| erosão 4× | 0,23/0,19/0,20/0,37 | 0,79 | 105/187/336 |
| catraca forte (6×, sem recuperação) | 0,20/0,17/0,15/0,48 | 0,80 | 106/200/344 |
| esquerda persistente | 0,38/0,16/0,20/0,25 | 0,83 | 107/174/319 |
| direita persistente | 0,13/0,26/0,32/0,30 | 0,72 | 103/191/325 |
| sem memória (como 2026) | 0,20/0,40/0,28/0,12 | 0,61 | 101/158/275 |
Dirichlet em torno da matriz (concentração 30 e 100, 1500 matrizes) e varredura `m_erosao × alternância` estão em `sensibilidade`: a massa em hegemonia+extremo em 2038 vai de ~0,48 a ~0,59 (p10-p90, conc. 100); a ocupação responde bem mais à matriz do que a dívida/ruptura, porque três dos quatro cenários já ultrapassam o limiar nas trajetórias existentes. O que isso diz: **a mistura macro quase não discrimina matrizes** — o fator dominante é o próprio resultado dos cenários, não a cadeia.

## 8. Cemitério (o que não funcionou)
Registrado no JSON (`cemiterio`, 12 itens, com números). Resumo: (1) permanência geométrica refutada; (2) uma matriz única para todas as eras/regiões refutada; (3) Brasil sozinho inestimável (cobertura do IC90 72%); (4) persistência dura como baseline infla o ganho; (5) P^h pior que a previsão direta; (6) leave-country-out é régua otimista; (7) qui-quadrado nominal inexato (32% de falso positivo na ordem 2); (8) "o Brasil é diferente" sem poder (p = 0,60); (9) não há monotonicidade de "democracia velha = segura"; (10) cadeia do crescimento não bate climatologia (HMM k=1); (11) cadeia/HMM de inflação perde para persistência em 3-5 anos; (12) mistura macro sem trajetória e acima de 120% de dívida não é projeção.

## 9. Limites e lacunas
Ver `limites` e `meta.lacunas`. Principais: o pressuposto markoviano falha em duração e em heterogeneidade; classificação V-Dem diverge da periodização do projeto; sem 2026; imputação histórica não marcada; matriz de cenários é julgamento; regimes de juros e de dívida **não estimados** (sem série longa aberta; dívida bruta só desde 2006); duas cadeias econômicas independentes e sem choques externos; HMM univariado em séries curtas.

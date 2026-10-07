# Anéis de realimentação: possíveis evoluções do Brasil

Compilado em 2026-10-06 junto com `web/public/data/aneis.json` (gerado de uma única estrutura e validado por script: ids de decisões, potências, pilares, leis e tendências conferidos nos JSON atuais; cada laço fecha; a polaridade bate com o tipo). São diagramas de laços causais no sentido de system dynamics (Forrester, Meadows) que ligam instituições, economia, clima, tecnologia, desigualdade e Estado.

> **Aviso central.** Só o laço fiscal e monetário de `src/sociolibero/economy.py` tem equação e parâmetros (e os parâmetros são de calibração, não estimativas com intervalo). Todo o resto é hipótese causal qualitativa, ancorada em evidência de correlação, em estudos de outros contextos ou em julgamento. Um diagrama de laços mostra o que *poderia* se reforçar ou se equilibrar; não prevê o que vai acontecer. Correlação não é causalidade (ver `docs/RIGOR_DE_VALIDACAO.md`).

**Contagens:** 14 anéis (9 reforçadores, 5 equilibradores), 68 arestas (das quais 28 contestadas), 175 citações de evidência (137 verificadas), 11 anéis ausentes por falta de evidência, 34 referências externas (15 com resumo ou página aberta).

## Como ler um diagrama de laços

- **Nó** é uma variável que pode subir ou descer (dívida, chuva, confiança).
- **Aresta** `A ─(+)→ B` significa que, mantido o resto igual, se A sobe, B sobe (mesmo sentido); `A ─(−)→ B` significa que, se A sobe, B desce (sentido oposto). O sinal descreve a direção do efeito, não a força.
- **Laço fechado** volta ao nó inicial. Conte os sinais negativos: **número par (inclusive zero) = anel reforçador (R)**, que amplifica qualquer mudança (espiral virtuosa ou viciosa); **número ímpar = anel equilibrador (B)**, que puxa o sistema de volta a uma meta.
- **Defasagem** é o tempo entre causa e efeito. Defasagem longa num anel equilibrador produz oscilação e ultrapassagem; num reforçador, esconde a espiral até ela ficar grande.
- **Ramal** é uma aresta fora do laço principal (outro caminho que também conversa com o anel). Não entra na conta de polaridade.
- **Força** é qualitativa: *forte* (identidade contábil do modelo ou efeito em desenho causal), *média* (evidência plausível mas indireta), *fraca* (um indício), *incerta* (a literatura diverge ou não há estimativa).
- **Contestada** marca arestas em que a literatura diverge ou em que o sinal depende de um juízo. Uma aresta contestada pode mudar o tipo do anel (exemplo: no anel 7, se a queda de renda por hectare reduzir em vez de aumentar a pressão por expansão, o anel vira equilibrador).
- **Pontos de alavanca** seguem a lista de Meadows (1999), do menos ao mais eficaz: 1 parâmetros, 2 tamanho de estoques tampão, 3 estrutura física, 4 defasagens, 5 força de laços balanceadores, 6 ganho de laços reforçadores, 7 fluxos de informação, 8 regras, 9 poder de autoorganização, 10 metas, 11 paradigmas, 12 transcender paradigmas.

## O que o modelo simula e o que é hipótese

Equações do laço simulado, em `economy.py` (entradas: `Levers` e `Params`):

```
debt_excess = max(d - 75, 0) / 10
premium = prem_base 1,0 + prem_debt 0,8*debt_excess + prem_inst 2,5*institutional_risk
          + prem_cred 2,0*(1 - fiscal_credibility)*debt_excess + climate_premium
pi_lr   = 3,0 + pi_bc 3,0*bc_erosion + pi_debt 0,6*debt_excess*(1 - fiscal_credibility)
pi      = max(1, 0,5*pi_prev + 0,5*pi_lr)
taylor  = 0,5*(pi - 3) + 0,5*gap
i       = max(2, 0,6*i_prev + 0,4*(neutral_real 5,0 + pi + premium + taylor))
g       = 2,0 + tech_boost + supply_reform - 0,30*(i - pi - 5,0) - 1,2*institutional_risk - climate_shock
p       = 0,6*p_prev + 0,4*(primary_target + 0,14*(0,3 + 0,7*fiscal_credibility)*clip(d - 80, -10, 40))
d       = d*(1 + 0,8*i/100)/(1 + g_nominal) - p
```

| # | Anel | Simulado? | Onde no modelo | O que é só hipótese |
|---|---|---|---|---|
| 1 | `fiscal-juros-divida` | sim | economy.py, função simulate(): variáveis debt, selic, ipca, gdp | Magnitudes de prem_debt, g_rate e implicit são de calibração; a relação dívida-crescimento é contestada; sem câmbio nem indexação da dívida |
| 2 | `expectativas-ancoragem` | sim | economy.py: pi_lr, pi e taylor dentro de simulate() | Que a perda de ancoragem vire espiral na dívida (no modelo eleva Selic e inflação, mas a dívida quase não muda); o canal cambial de Blanchard (2004); bc_erosion é exógeno |
| 3 | `reacao-fiscal` | sim | economy.py: bloco 'reação fiscal (tipo Bohn)' em simulate() | O custo político da reação e a fadiga fiscal; o parâmetro 0,14 não tem intervalo |
| 4 | `disciplina-de-mercado` | parcial | Parcial: a aresta regra → prêmio está em economy.py (prem_cred e fiscal_credibility) | A resposta política ao prêmio (prêmio, custo político, regra); a credibilidade é alavanca exógena |
| 5 | `captura-concentracao` | não | Não há nó de concentração nem de influência política | Todas as quatro arestas |
| 6 | `legitimidade-impunidade` | parcial | Parcial: o custo da erosão está em economy.py (institutional_risk entra no prêmio e no crescimento), mas institutional_risk é alavanca exógena | As quatro arestas; só o custo econômico de institutional_risk é simulado |
| 7 | `clima-floresta-agro` | não | Não há desmatamento, chuva nem terra no modelo | Todas as arestas; só o efeito final (climate_shock, climate_premium) entra, como suposição de severidade |
| 8 | `clima-fiscal-adaptacao` | parcial | Parcial: o custo final entra via Levers.climate_shock e climate_premium (economy.py), que alimentam o anel 1 | Resposta, prevenção, vulnerabilidade e retorno da prevenção; ramais do prêmio soberano e do CMO |
| 9 | `desigualdade-educacao-produtividade` | não | Não há desigualdade nem capital humano no modelo | Todas as arestas; só supply_reform das decisões entra, e o modelo aplica o efeito desde o 1º ano |
| 10 | `tecnologia-produtividade-capacidade` | sim | economy.py: tech_boost() e a equação do PIB (primeiras duas arestas, via Levers.tech_productivity, tech_midpoint, tech_rate, tech_lag) | tech_productivity é suposição; as arestas de investimento e infraestrutura são hipótese |
| 11 | `automacao-trabalho-demanda` | não | Não simulado | Todas as arestas |
| 12 | `violencia-capital-humano` | não | Não simulado | Todas as arestas |
| 13 | `territorio-indigena-conservacao` | não | Não simulado | Todas as arestas; o benefício ambiental não é modelado |
| 14 | `controle-externo-eleitor` | não | Não simulado | Todas as arestas; entra indiretamente por institutional_risk e fiscal_credibility |

**Execuções ilustrativas deste trabalho (`sim_ilus`).** Para ver a ordem de grandeza dos laços, rodamos `simulate()` de forma determinística (`n=1`, `shocks=False`, base `FALLBACK`: dívida 82,86%, Selic 13,5%, IPCA esperado 5,01%, PIB 1,85%, primário -0,40%) com alavancas `primary_target=1,0`, `institutional_risk=0,1`, `bc_erosion=0`, `supply_reform=0`, `fiscal_credibility=0,5`. **Não são cenários do projeto nem previsão.** Resultados em 2038:

| Variação | Dívida/PIB | Selic | IPCA | PIB |
|---|---:|---:|---:|---:|
| Base ilustrativa | 135,7% | 17,11% | 4,43% | -0,42% |
| `bc_erosion` = 0,4 | 134,8% | 18,58% | 5,60% | -0,52% |
| `institutional_risk` = 0,4 | 158,6% | 19,81% | 4,85% | -1,47% |
| `fiscal_credibility` = 0,1 | 233,1% | 34,05% | 8,17% | -4,38% |
| `fiscal_credibility` = 0,9 | 102,0% | 10,88% | 3,15% | +1,06% |
| `primary_target` = -1,0 | 193,5% | 23,16% | 5,47% | -1,93% |
| `climate_shock` = 0,3 e `climate_premium` = 0,3 | 146,1% | 18,21% | 4,63% | -1,00% |
| `tech_productivity` = 0,5 | 129,5% | 16,48% | 4,32% | +0,23% |

Três leituras honestas. (1) A credibilidade fiscal é a alavanca de maior ganho do laço (233% contra 102% de dívida). (2) O laço de expectativas **não** vira espiral na dívida dentro do modelo: inflação maior corrói a dívida nominal e não há câmbio nem dívida indexada; o anel 2 só é reforçador por construção parcial. (3) A inclinação local do prêmio por dívida é 0,26, 0,18 e 0,10 pp por pp de dívida (credibilidade 0,1, 0,5 e 0,9) e a dívida responde à Selic em ~0,008*d por ano; o ganho do laço pelo canal direto fica abaixo de 1 (~0,13 ao ano com credibilidade 0,5), então a explosão vem da soma com déficit primário e juro real alto, não do laço isolado (cálculos nossos a partir de `economy.py`).

## Os 14 anéis em resumo

| # | Anel | Tipo | Simulado | Arestas (contestadas) |
|---|---|---|---|---|
| 1 | Anel fiscal: juros, dívida e prêmio de risco | R | sim | 7 (1) |
| 2 | Anel de expectativas: erosão do BC, inflação esperada e Selic | R | sim | 5 (3) |
| 3 | Anel balanceador: reação do primário à dívida | B | sim | 3 (1) |
| 4 | Anel balanceador: mercado de capitais disciplinando o fiscal | B | parcial | 3 (1) |
| 5 | Anel de captura: concentração, influência política e regras favoráveis | R | não | 4 (2) |
| 6 | Anel de legitimidade: impunidade, desconfiança e erosão institucional | R | parcial | 4 (4) |
| 7 | Anel clima–floresta–agro: desmatamento, chuva e pressão por expansão | R | não | 6 (3) |
| 8 | Anel clima–fiscal: eventos extremos, gasto emergencial e prevenção | R | parcial | 8 (3) |
| 9 | Anel desigualdade–educação–produtividade | R | não | 7 (2) |
| 10 | Anel tecnologia–produtividade–capacidade de investir | R | sim | 4 (1) |
| 11 | Anel balanceador: automação, trabalho e demanda | B | não | 6 (3) |
| 12 | Anel violência–capital humano | R | não | 4 (1) |
| 13 | Anel balanceador: território, terras indígenas e conservação | B | não | 4 (2) |
| 14 | Anel balanceador: auditoria, imprensa, Judiciário e voto | B | não | 3 (1) |

## 1. Anel fiscal: juros, dívida e prêmio de risco (R)

Mais dívida acima de ~75% do PIB eleva o prêmio de risco; o prêmio entra na Selic; a Selic mais alta encarece a dívida e a eleva. Um ramal secundário passa pelo crescimento: juro real acima do neutro derruba o PIB, e menos PIB piora a razão dívida/PIB.

**Diagrama textual** (laço principal; `(+)` mesmo sentido, `(−)` sentido oposto):

```
[Dívida bruta/PIB]
   ─(+)→ [Prêmio de risco (pp)]
   ─(+)→ [Selic]
   ─(+)→ [Custo de carregar a dívida]
   ─(+)→ [Dívida bruta/PIB]
   ↺ fecha no início: anel REFORÇADOR (0 sinal(is) negativo(s))
ramal: [Selic] ─(+)→ [Juro real (Selic - IPCA)]
ramal: [Juro real (Selic - IPCA)] ─(−)→ [Crescimento do PIB]
ramal: [Crescimento do PIB] ─(−)→ [Dívida bruta/PIB]
```

| Aresta | Sinal | Defasagem (base) | Força | Contest. | Evidência (verificado) | Nota |
|---|:-:|---|---|:-:|---|---|
| Dívida bruta/PIB → Prêmio de risco (pp) | + | contemporânea no modelo (base: premium usa d do período anterior); prática de mercado em semanas a meses | forte | não | economy.py (sim); [Blanchard (2004), Fiscal Dominance and Inflation Targeting](https://www.nber.org/papers/w10389) (sim); [Ardagna, Caselli, Lane (2007), Fiscal Discipline and the Cost of Publi](https://doi.org/10.2202/1935-1690.1417) (não) | No modelo: prem_debt = 0,8 pp por 10 pp de dívida acima de 75%, mais prem_cred = 2,0 vezes (1 - credibilidade) por 10 pp. A inclinação resulta em 0,26 pp de prêmio por pp de dívida com credibilidade 0,1; 0,18 com 0,5; 0,10 com 0,9 (cálculo nosso). Ardagna et al. (DOI conferido, conteúdo não lido) tratam do custo da dívida em países da OCDE; a magnitude brasileira não foi estimada aqui. |
| Prêmio de risco (pp) → Selic | + | suavização 0,6/0,4: a Selic fecha ~40% da lacuna por ano (meia-vida ~1,4 ano, derivada da equação) | forte | não | economy.py (sim); [Taylor (1993), Discretion versus policy rules in practice (DOI conferi](https://doi.org/10.1016/0167-2231(93)90009-L) (não) | i = 0,6*i_prev + 0,4*(neutral_real 5,0 + pi + premio + taylor). Passagem de 1 para 1 no longo prazo. A regra de Taylor do modelo (taylor_pi 0,5; taylor_gap 0,5) é estilizada. |
| Selic → Custo de carregar a dívida | + | 1 a 2 anos (estoque de dívida refinancia aos poucos) | media | não | economy.py (sim) | O modelo usa implicit = 0,8: o custo implícito da dívida é 80% da Selic, sem separar títulos prefixados, indexados ao IPCA, à Selic ou ao câmbio. A parcela real indexada não foi levantada nesta rodada. |
| Custo de carregar a dívida → Dívida bruta/PIB | + | 1 ano | forte | não | economy.py (sim) | d_t = d_{t-1}*(1 + 0,8*i/100)/(1 + g_nominal) - p. Cálculo nosso: ∂d/∂i ≈ 0,008*d, ou ~0,7 a 0,8 pp de dívida por pp de Selic para d entre 90% e 100%. |
| Selic → Juro real (Selic - IPCA) (ramal) | + | contemporânea | media | não | economy.py (sim) | real = i - pi. A inflação sobe junto com a Selic nas equações, então o juro real sobe menos que a Selic. |
| Juro real (Selic - IPCA) → Crescimento do PIB (ramal) | − | contemporânea no modelo; na literatura, 4 a 8 trimestres | incerta | sim | economy.py (sim); [Herndon, Ash, Pollin (2014), Does high public debt consistently stifle](https://doi.org/10.1093/cje/bet075) (não) | g = 2,0 + ... - g_rate*(real - 5,0), com g_rate = 0,30. É um parâmetro de calibração do projeto e não foi estimado em microdados. A relação entre dívida alta e crescimento é contestada (Reinhart-Rogoff vs. Herndon et al.). |
| Crescimento do PIB → Dívida bruta/PIB (ramal) | − | 1 ano | media | não | economy.py (sim) | O crescimento nominal entra no denominador da dívida. Fecha um segundo laço reforçador pelo crescimento. |

**No modelo:** simulado. economy.py, função simulate(): variáveis debt, selic, ipca, gdp; Params prem_debt, prem_cred, prem_base, neutral_real, implicit, g_rate, taylor_pi, taylor_gap; alavancas fiscal_credibility e primary_target.

```
debt_excess = max(d-75,0)/10; premium = prem_base 1,0 + prem_debt 0,8*debt_excess + prem_inst 2,5*institutional_risk + prem_cred 2,0*(1-fiscal_credibility)*debt_excess + climate_premium; i = max(2, 0,6*i_prev + 0,4*(5,0 + pi + premium + 0,5*(pi-3) + 0,5*gap)); d = d*(1+0,8*i/100)/(1+g_nominal) - p
```

**Decisões do catálogo que tocam o anel:** `flexibilizar-arcabouco`, `reforcar-arcabouco`, `desvincular-minimo`, `reforma-previdencia-2`, `cortar-beneficios-fiscais`, `desoneracao-ampla`, `ampliar-assistencia`, `perdao-dividas`, `credito-subsidiado`, `privatizacoes`, `reforma-administrativa`

**Potências:** `janela-demografica`, `matriz-eletrica-renovavel`. **Tendências:** `difusao_cauda`. **Leis:** `solow`. **Pilares:** `tempo-longo-e-geracoes`, `capacidades-e-suficiencia`.

**Pontos de alavanca (Meadows):**

- Meadows 6 (ganho do laço reforçador): a credibilidade fiscal muda a inclinação do prêmio (prem_cred); nas execuções ilustrativas, credibilidade 0,1 leva a dívida de 2038 a 233% do PIB e 0,9 a 102%, contra 136% em 0,5 (ver sim_ilus)
- Meadows 5 e 8: regras que fortalecem o laço balanceador (reação fiscal, anel 3) e a regra fiscal em si (reforcar-arcabouco: primary_target +1,2, credibilidade +0,2)
- Meadows 4 (defasagem): alongar prazo médio da dívida reduz o repasse da Selic ao custo (hipótese; sem dado do prazo nesta rodada)

**Se o anel dominar.** Espiral virtuosa: Com primário consistente e credibilidade alta, a dívida estabiliza perto de 100% e o prêmio cai, a Selic converge ao neutro e o juro real baixo recompõe o crescimento. Nas execuções ilustrativas, credibilidade 0,9 leva Selic de 2038 a 10,9% e dívida a 102%. Espiral viciosa: Dívida crescente com baixa credibilidade amplia o prêmio e o custo, a Selic sobe e o primário exigido cresce. Nas execuções ilustrativas, credibilidade 0,1 leva a Selic de 2038 a 34% e a dívida a 233%, e primário alvo de -1,0 leva a 193%. São resultados de um modelo anual reduzido, sem câmbio nem indexação, para mostrar a dinâmica e não para prever.

**O que o enfraqueceria:** Reação endógena do primário (anel 3); Prazo médio longo e base de investidores doméstica (hipótese não conferida); Inflação que corrói a dívida nominal (efeito presente no modelo, mas limitado pelo repasse à Selic); Superávit primário persistente.

**Notas:** Execuções ilustrativas deste trabalho (sim_ilus): dívida 2038 = 135,7% com credibilidade 0,5; 233,1% com 0,1; 102,0% com 0,9; 193,5% com primary_target = -1,0.

## 2. Anel de expectativas: erosão do BC, inflação esperada e Selic (R)

Mais dívida com baixa credibilidade fiscal (dominância fiscal) eleva a inflação de longo prazo esperada; a Selic sobe para conter a inflação (regra de Taylor mais a inflação no piso da taxa); a Selic alta aumenta a dívida. A erosão da independência do BC é a alavanca exógena que desloca a inflação de longo prazo. O laço só fecha se o aperto monetário não for compensado pela erosão nominal da dívida, e esse é o ponto frágil do modelo.

**Diagrama textual** (laço principal; `(+)` mesmo sentido, `(−)` sentido oposto):

```
[Dívida bruta/PIB]
   ─(+)→ [Dominância fiscal (dívida acima de 75% sem credibilidade)]
   ─(+)→ [Inflação de longo prazo esperada]
   ─(+)→ [Selic]
   ─(+)→ [Dívida bruta/PIB]
   ↺ fecha no início: anel REFORÇADOR (0 sinal(is) negativo(s))
ramal: [Independência do BC (alavanca bc_erosion)] ─(+)→ [Inflação de longo prazo esperada]
```

| Aresta | Sinal | Defasagem (base) | Força | Contest. | Evidência (verificado) | Nota |
|---|:-:|---|---|:-:|---|---|
| Dívida bruta/PIB → Dominância fiscal (dívida acima de 75% sem credibilidade) | + | contemporânea no modelo; na prática, anos | media | não | economy.py (sim); [economia_historica.json#decada-perdida-hiperinflacao](https://pt.wikipedia.org/wiki/Plano_Real) (sim) | pi_debt = 0,6 pp de inflação por 10 pp de dívida acima de 75%, multiplicado por (1 - credibilidade). O precedente da hiperinflação é descritivo e não identifica o mecanismo. |
| Dominância fiscal (dívida acima de 75% sem credibilidade) → Inflação de longo prazo esperada | + | meia-vida ~0,7 ano (pi = 0,5*pi_prev + 0,5*pi_lr) | media | não | economy.py (sim); [Blanchard (2004), Fiscal Dominance and Inflation Targeting](https://www.nber.org/papers/w10389) (sim) | pi_lr = 3,0 + pi_bc*bc_erosion + pi_debt*excess*(1-cred). Blanchard (2004) discute a dominância fiscal no Brasil de 2002-03. |
| Inflação de longo prazo esperada → Selic | + | contemporânea; suavização da Selic 0,6/0,4 | forte | sim | economy.py (sim); [Taylor (1993), Discretion versus policy rules in practice (DOI conferi](https://doi.org/10.1016/0167-2231(93)90009-L) (não) | A inflação entra duas vezes na Selic: 1 para 1 em neutral_real + pi, e 0,5 pela regra de Taylor. A Selic nominal sobe 1,5 pp por pp de inflação (cálculo nosso). |
| Selic → Dívida bruta/PIB | + | 1 ano | forte | sim | economy.py (sim); [Blanchard (2004), Fiscal Dominance and Inflation Targeting](https://www.nber.org/papers/w10389) (sim) | No modelo, mais Selic eleva a dívida, mas mais inflação a reduz pelo denominador nominal. Execução ilustrativa: bc_erosion de 0 para 0,4 sobe a Selic de 2038 de 17,11% para 18,58% e o IPCA de 4,43% para 5,60%, e a dívida cai de 135,7% para 134,8% (sim_ilus). Ou seja, o laço de expectativas NÃO se mostra reforçador na dívida dentro do modelo. Blanchard (2004) argumenta que, com dívida alta e passivos em moeda estrangeira, apertar pode piorar a inflação por depreciação, canal ausente do modelo. |
| Independência do BC (alavanca bc_erosion) → Inflação de longo prazo esperada (ramal) | + | anos (ancoragem se perde devagar e se recupera mais devagar) | media | sim | economy.py (sim); [Alesina e Summers (1993), Central Bank Independence and Macroeconomic ](https://doi.org/10.2307/2077833) (não); [historia.json#lc179-2021](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp179.htm) (sim) | Alavanca exógena bc_erosion (0-1) multiplicada por pi_bc = 3,0 pp. A literatura sobre independência do BC (Alesina e Summers; DOI conferido, conteúdo não lido) é cross-country e debate causalidade. Decisões do catálogo mudam a alavanca: reduzir-autonomia-bc +0,4, diretoria-bc-alinhada +0,15. |

**No modelo:** simulado. economy.py: pi_lr, pi e taylor dentro de simulate(); alavanca Levers.bc_erosion; Params pi_bc, pi_debt, taylor_pi. Parcial: a sinalização do BC é exógena, e não há câmbio nem dívida indexada.

```
pi_lr = 3,0 + 3,0*bc_erosion + 0,6*debt_excess*(1-fiscal_credibility); pi = max(1, 0,5*pi_prev + 0,5*pi_lr); taylor = 0,5*(pi-3) + 0,5*gap
```

**Decisões do catálogo que tocam o anel:** `reduzir-autonomia-bc`, `diretoria-bc-alinhada`, `politica-precos-combustiveis`, `flexibilizar-arcabouco`, `reforcar-arcabouco`

**Potências:** `infraestrutura-publica-digital`. **Tendências:** `pagamentos_digitais`. **Leis:** nenhuma. **Pilares:** `autocontrole-e-monopolio-legitimo`, `tempo-longo-e-geracoes`.

**Pontos de alavanca (Meadows):**

- Meadows 8 (regras): mandato fixo e objetivo único do BC (LC 179/2021)
- Meadows 7 (informação): metas, relatórios e comunicação que reforçam a ancoragem
- Meadows 10 (objetivos): coerência entre meta fiscal e meta de inflação

**Se o anel dominar.** Espiral virtuosa: Âncora firme: inflação de longo prazo perto de 3%, Selic menor e prêmio menor, o que libera espaço fiscal. Espiral viciosa: Âncora perdida: na simulação, inflação de longo prazo ~1,2 pp acima e Selic ~1,5 pp acima em 2038, com queda adicional de crescimento. A espiral explosiva clássica (inflação, juros e dívida) só aparece se houver canal cambial ou dívida indexada, o que o modelo não tem; isso é hipótese, apoiada em Blanchard (2004) e na história de 1980-94.

**O que o enfraqueceria:** Credibilidade fiscal alta; Mandato fixo do BC e diretoria não alinhada; Prazo longo e prefixado da dívida (hipótese); Câmbio estável e reservas (fora do modelo).

## 3. Anel balanceador: reação do primário à dívida (B)

Quando a dívida passa de 80% do PIB, o primário-alvo é ajustado para cima (reação à Bohn), com força maior se o mercado acredita na regra. Mais primário reduz a dívida.

**Diagrama textual** (laço principal; `(+)` mesmo sentido, `(−)` sentido oposto):

```
[Dívida bruta/PIB]
   ─(+)→ [Reação fiscal (ajuste do primário)]
   ─(+)→ [Resultado primário (% PIB)]
   ─(−)→ [Dívida bruta/PIB]
   ↺ fecha no início: anel EQUILIBRADOR (1 sinal(is) negativo(s))
```

| Aresta | Sinal | Defasagem (base) | Força | Contest. | Evidência (verificado) | Nota |
|---|:-:|---|---|:-:|---|---|
| Dívida bruta/PIB → Reação fiscal (ajuste do primário) | + | 1 a 3 anos (processo orçamentário e político) | media | sim | economy.py (sim); [Bohn (1998), The Behavior of U.S. Public Debt and Deficits (DOI confer](https://doi.org/10.1162/003355398555793) (não); [Ghosh et al. (2013), Fiscal Fatigue, Fiscal Space and Debt Sustainabil](https://doi.org/10.1111/ecoj.12010) (não) | react = reaction*(0,3 + 0,7*credibilidade)*clip(d - 80, -10, 40), reaction = 0,14. Com d = 100 e credibilidade 0,5, react = 1,8 pp. Bohn (1998) é o referencial teórico (DOI conferido, conteúdo não lido); Ghosh et al. (2013) tratam de fadiga fiscal, em que a reação se esgota em dívida alta. O parâmetro 0,14 é de calibração, não estimativa brasileira com intervalo. |
| Reação fiscal (ajuste do primário) → Resultado primário (% PIB) | + | meia-vida ~1,4 ano (p = 0,6*p_prev + 0,4*alvo) | forte | não | economy.py (sim); [historia.json#lc200-2023](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp200.htm) (sim) | No mundo real, o primário-alvo depende da regra (LC 200/2023: despesa limitada a 70% do aumento da receita) e do Congresso, não da dívida diretamente. |
| Resultado primário (% PIB) → Dívida bruta/PIB | − | 1 ano | forte | não | economy.py (sim) | d_t = ... - p. É identidade contábil do modelo. |

**No modelo:** simulado. economy.py: bloco 'reação fiscal (tipo Bohn)' em simulate(); Params.reaction; Levers.primary_target e fiscal_credibility.

```
react = 0,14*(0,3+0,7*fiscal_credibility)*clip(d-80,-10,40); p = 0,6*p_prev + 0,4*(primary_target + react) + ruído(0; 0,35)
```

**Decisões do catálogo que tocam o anel:** `reforcar-arcabouco`, `desvincular-minimo`, `reforma-previdencia-2`, `reforma-administrativa`, `cortar-beneficios-fiscais`, `comissario-das-geracoes-futuras`

**Potências:** `janela-demografica`. **Tendências:** nenhuma. **Leis:** nenhuma. **Pilares:** `tempo-longo-e-geracoes`, `capacidades-e-suficiencia`.

**Pontos de alavanca (Meadows):**

- Meadows 5 (força do laço balanceador): rigidez do gasto obrigatório reduz a capacidade de reagir; desvincular-minimo e reforma-previdencia-2 aumentam a margem
- Meadows 4 (defasagem): quanto mais lenta a reação (maior defasagem), maior a oscilação da dívida
- Meadows 8 (regras): gatilhos automáticos de despesa (reforcar-arcabouco)

**Se o anel dominar.** Espiral virtuosa: Dívida converge para o nível em que o primário-alvo a estabiliza; choques são absorvidos em poucos anos. Espiral viciosa: Se a reação é lenta ou politicamente bloqueada (fadiga fiscal), a reação some e prevalece o anel 1. A reação do modelo é mecânica e não inclui o custo político.

**O que o enfraqueceria:** Despesa obrigatória rígida e vinculada; Calendário eleitoral; Fadiga fiscal e conflito distributivo; Gastos tributários e emendas impositivas (EC 86/2015, EC 100/2019) que reduzem a margem discricionária.

## 4. Anel balanceador: mercado de capitais disciplinando o fiscal (B)

Prêmio e Selic altos encarecem a dívida e aumentam o custo político de gastar sem regra; isso cria demanda por regras fiscais críveis e por ajuste; mais credibilidade reduz o prêmio. O modelo simula só o efeito da credibilidade sobre o prêmio e a dívida; a reação política que eleva a credibilidade é hipótese.

**Diagrama textual** (laço principal; `(+)` mesmo sentido, `(−)` sentido oposto):

```
[Prêmio de risco]
   ─(+)→ [Custo político de gastar sem regra]
   ─(+)→ [Regra fiscal crível (fiscal_credibility)]
   ─(−)→ [Prêmio de risco]
   ↺ fecha no início: anel EQUILIBRADOR (1 sinal(is) negativo(s))
```

| Aresta | Sinal | Defasagem (base) | Força | Contest. | Evidência (verificado) | Nota |
|---|:-:|---|---|:-:|---|---|
| Prêmio de risco → Custo político de gastar sem regra | + | 1 a 3 anos (ciclos de estresse levam a mudança de regra) | incerta | sim | [economia_historica.json#recessao-ajuste-polarizacao](https://pt.wikipedia.org/wiki/Reforma_trabalhista_no_Brasil_em_2017) (não); [historia.json#ec95-2016](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc95.htm) (sim); [historia.json#lc200-2023](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp200.htm) (sim); [historia.json#direcoes/fiscal](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm) (sim) | Hipótese: depois dos estresses de 2015-16 vieram a EC 95/2016 e depois a LC 200/2023. A sequência é temporal e não identifica causalidade (houve também mudança de governo). Não há estimativa do custo político. |
| Custo político de gastar sem regra → Regra fiscal crível (fiscal_credibility) | + | 1 a 2 anos para aprovar, mais para a regra ganhar credibilidade | fraca | não | [historia.json#lrf-2000](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm) (sim); [historia.json#ec95-2016](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc95.htm) (sim); [historia.json#lc200-2023](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp200.htm) (sim) | Decisões do catálogo mexem na credibilidade: reforcar-arcabouco +0,20, flexibilizar-arcabouco -0,25. A credibilidade é uma alavanca exógena do modelo. |
| Regra fiscal crível (fiscal_credibility) → Prêmio de risco | − | contemporânea no modelo; na prática, a credibilidade se constrói em anos | forte | não | economy.py (sim); [Ardagna, Caselli, Lane (2007), Fiscal Discipline and the Cost of Publi](https://doi.org/10.2202/1935-1690.1417) (não); [Blanchard (2004), Fiscal Dominance and Inflation Targeting](https://www.nber.org/papers/w10389) (sim) | No modelo, (1 - credibilidade) multiplica prem_cred = 2,0 sobre o excesso de dívida: com credibilidade 0,9 o prêmio por dívida cai ~45% frente a 0,5 (cálculo nosso: 0,10 vs. 0,18 pp por pp de dívida). |

**No modelo:** não simulado (ou só parcialmente). Parcial: a aresta regra → prêmio está em economy.py (prem_cred e fiscal_credibility); as arestas prêmio → custo político → regra são exógenas (alavanca fiscal_credibility definida por cenário e por decisão).

```
premium inclui prem_cred*(1-fiscal_credibility)*debt_excess
```

**Decisões do catálogo que tocam o anel:** `reforcar-arcabouco`, `flexibilizar-arcabouco`, `perdao-dividas`, `politica-precos-combustiveis`, `comissario-das-geracoes-futuras`

**Potências:** nenhuma. **Tendências:** nenhuma. **Leis:** nenhuma. **Pilares:** `tempo-longo-e-geracoes`.

**Pontos de alavanca (Meadows):**

- Meadows 7 (fluxo de informação): metas e relatórios fiscais acessíveis
- Meadows 8 (regras): gatilhos e sanções da regra fiscal
- Meadows 9 (autoorganização): instituição fiscal independente (hipótese; não consta do catálogo)

**Se o anel dominar.** Espiral virtuosa: O mercado sinaliza cedo, a regra se endurece antes da crise e o prêmio permanece baixo. Espiral viciosa: Se o custo político nunca ultrapassa o benefício de gastar (ou se as regras são flexibilizadas a cada estresse), o anel não opera e o anel 1 domina.

**O que o enfraqueceria:** Captura do orçamento por emendas e benefícios setoriais (anel 5); Regras flexibilizadas sem contrapartida; Financiamento por bancos públicos e dívidas rurais que contornam a regra (perdao-dividas, credito-subsidiado).

## 5. Anel de captura: concentração, influência política e regras favoráveis (R)

Quem concentra renda e poder de mercado tem mais capacidade de financiar e influenciar a política; a influência produz regras, subsídios e contratos favoráveis; essas regras aumentam a concentração. É uma hipótese causal qualitativa; não está no modelo.

**Diagrama textual** (laço principal; `(+)` mesmo sentido, `(−)` sentido oposto):

```
[Concentração de renda e de mercado]
   ─(+)→ [Influência política (financiamento, lobby, emendas)]
   ─(+)→ [Regras, benefícios e contratos favoráveis]
   ─(+)→ [Renda extraordinária e vantagem competitiva]
   ─(+)→ [Concentração de renda e de mercado]
   ↺ fecha no início: anel REFORÇADOR (0 sinal(is) negativo(s))
```

| Aresta | Sinal | Defasagem (base) | Força | Contest. | Evidência (verificado) | Nota |
|---|:-:|---|---|:-:|---|---|
| Concentração de renda e de mercado → Influência política (financiamento, lobby, emendas) | + | ciclo eleitoral (2 a 4 anos) | media | não | [Boas, Hidalgo, Richardson (2014), The Spoils of Victory](https://doi.org/10.1017/s002238161300145x) (não); [custo_corrupcao.json#stigler-captura](https://doi.org/10.2307/3003160) (sim); leis_tecnologicas.json#potencia_pareto (não) | Boas et al. (2014) estudam doações de campanha e contratos públicos no Brasil (DOI conferido; resumo não lido). A concentração de renda do topo (10% com ~59%, WIR, não verificado) é o motivo para supor que o dinheiro político é desigual. A causalidade é contestada (doadores escolhem vencedores prováveis). |
| Influência política (financiamento, lobby, emendas) → Regras, benefícios e contratos favoráveis | + | 1 a 5 anos (aprovação de lei e regulamentação) | media | sim | [custo_corrupcao.json#emendas-orcamento-secreto](https://www.poder360.com.br/poder-congresso/tcu-aprova-auditoria-sobre-r-22-bilhoes-em-emendas-pix/) (não); [historia.json#rp9-2021](https://pt.wikipedia.org/wiki/Or%C3%A7amento_secreto) (sim); [historia.json#adpf854-2022](https://www.conjur.com.br/2022-dez-19/maioria-stf-declara-inconstitucionalidade-orcamento-secreto/) (sim); [historia.json#direcoes/coalizao](https://pt.wikipedia.org/wiki/S%C3%A9rgio_Abranches) (sim); [historia.json#ec86-2015](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc86.htm) (sim); [historia.json#ec100-2019](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc100.htm) (sim); [custo_corrupcao.json#gastos-tributarios](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/relatorios/renuncia/gastos-tributarios-ploa/dgt-previsao-ploa-2026-base-conceitual.pdf) (sim) | Há mecanismos documentados de poder do Congresso sobre o orçamento (RP9 declarado inconstitucional por 6 a 5; migração do volume para emendas individuais, de bancada, de comissão e transferências especiais). O tamanho dos gastos tributários (R$ 612,84 bi em 2026, 4,43% do PIB) mede renúncia, e a RFB e o repositório ressaltam que parte é desenho do regime, não abuso. Ligar o tamanho à captura é hipótese. |
| Regras, benefícios e contratos favoráveis → Renda extraordinária e vantagem competitiva | + | imediata a 3 anos | media | não | [custo_corrupcao.json#gastos-tributarios](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/relatorios/renuncia/gastos-tributarios-ploa/dgt-previsao-ploa-2026-base-conceitual.pdf) (sim); [custo_corrupcao.json#licitacoes-carteis](https://portal.tcu.gov.br/imprensa/noticias/carteis-superfaturamento-e-a-atuacao-do-tcu) (sim); [custo_corrupcao.json#tullock-krueger-rent-seeking](https://doi.org/10.1111/j.1465-7295.1967.tb01923.x) (sim) | Rent-seeking (Tullock, Krueger). O catálogo lista 14 benefícios a empresas (7 verificados) em custo_corrupcao.json#beneficios_a_empresas, com valores em R$; a incidência real (quem captura a renda) não foi medida. |
| Renda extraordinária e vantagem competitiva → Concentração de renda e de mercado | + | contínua | incerta | sim | [custo_corrupcao.json#acemoglu-robinson-extrativas](https://doi.org/10.1257/aer.91.5.1369) (sim); [custo_corrupcao.json#klitgaard](https://doi.org/10.1525/9780520911185) (sim) | Acemoglu e Robinson descrevem instituições extrativas que perpetuam elites; a evidência brasileira específica sobre o laço fechado (renda captada que volta a concentrar) não foi encontrada nesta rodada. |

**No modelo:** não simulado (ou só parcialmente). Não há nó de concentração nem de influência política. O modelo só vê o resultado final das decisões (primary_target e fiscal_credibility dos itens do catálogo, por exemplo cortar-beneficios-fiscais +0,6 e desoneracao-ampla -0,5).

**Decisões do catálogo que tocam o anel:** `cortar-beneficios-fiscais`, `desoneracao-ampla`, `credito-subsidiado`, `privatizacoes`, `perdao-dividas`, `politica-precos-combustiveis`, `estrategia-minerais-criticos`, `reforma-administrativa`, `ampliar-assistencia`

**Potências:** `niobio-concentracao-global`, `minerais-transicao-reservas`, `agricultura-tropical-ptf`, `sociobioeconomia`, `amazonia-azul-petroleo`, `matriz-eletrica-renovavel`. **Tendências:** `difusao_cauda`, `ia_generativa_agentes`. **Leis:** `potencia_pareto`. **Pilares:** `bens-comuns`, `reciprocidade-e-darva`.

**Pontos de alavanca (Meadows):**

- Meadows 7 (informação): transparência de beneficiários (ADPF 854 determinou divulgação)
- Meadows 8 (regras): sunset e avaliação de gastos tributários; financiamento eleitoral
- Meadows 9: capacidade de organização de quem hoje não tem voz (conselhos, orçamento participativo)

**Se o anel dominar.** Espiral virtuosa: Se o laço é interrompido por transparência e competição, as regras passam a ser avaliadas por resultado e a renda extraordinária diminui. Espiral viciosa: Elites extrativas consolidadas: gastos tributários e emendas crescem, a margem fiscal diminui (alimenta o anel 1), a desconfiança aumenta (alimenta o anel 6).

**O que o enfraqueceria:** Transparência de beneficiários e avaliação periódica de gastos tributários; Concorrência (CADE) e abertura comercial; Controle externo e eleitoral (anel 14); Financiamento eleitoral limitado.

## 6. Anel de legitimidade: impunidade, desconfiança e erosão institucional (R)

A percepção de impunidade reduz a confiança nas instituições; menos confiança reduz o custo político de romper regras; a ruptura de regras erode controles; controles erodidos aumentam a impunidade. Anel de hipótese; o modelo só simula o custo econômico da erosão (institutional_risk), não o mecanismo que a produz.

**Diagrama textual** (laço principal; `(+)` mesmo sentido, `(−)` sentido oposto):

```
[Impunidade percebida]
   ─(+)→ [Desconfiança e polarização]
   ─(−)→ [Custo político de romper regras]
   ─(−)→ [Erosão institucional (alavanca institutional_risk)]
   ─(+)→ [Impunidade percebida]
   ↺ fecha no início: anel REFORÇADOR (2 sinal(is) negativo(s))
```

| Aresta | Sinal | Defasagem (base) | Força | Contest. | Evidência (verificado) | Nota |
|---|:-:|---|---|:-:|---|---|
| Impunidade percebida → Desconfiança e polarização | + | ciclos eleitorais; anos | media | sim | [custo_corrupcao.json#ti-ipc-2025](https://transparenciainternacional.org.br/ipc/) (sim); [custo_corrupcao.json#fisman-miguel](https://doi.org/10.1086/527495) (sim); [custo_corrupcao.json#ferraz-finan-reeleicao](https://doi.org/10.1162/qjec.2008.123.2.703) (sim) | O IPC 2025 do Brasil é 35/100, medida de percepção, não de impunidade real. Fisman e Miguel mostram que a tolerância à corrupção depende de normas (modelo no repositório). Percepção e impunidade real não são a mesma coisa; a causalidade percepção -> desconfiança política é contestada. |
| Desconfiança e polarização → Custo político de romper regras | − | anos | incerta | sim | [Svolik (2019), Polarization versus Democracy, Journal of Democracy (DO](https://doi.org/10.1353/jod.2019.0039) (não); [historia.json#principios/levitsky](https://en.wikipedia.org/wiki/How_Democracies_Die) (sim); [historia.json#principios/bermeo](https://doi.org/10.1353/jod.2016.0012) (sim) | Hipótese: eleitores polarizados toleram violações de regras do lado de quem apoiam (Svolik 2019, DOI conferido, conteúdo de memória). Não há medida brasileira do 'custo político' no repositório. |
| Custo político de romper regras → Erosão institucional (alavanca institutional_risk) | − | 1 a 5 anos | media | sim | [historia.json#principios/bermeo](https://doi.org/10.1353/jod.2016.0012) (sim); [historia.json#principios/levitsky](https://en.wikipedia.org/wiki/How_Democracies_Die) (sim); [historia.json#oito-janeiro-2023](https://pt.wikipedia.org/wiki/Ataques_de_8_de_janeiro_em_Bras%C3%ADlia) (sim); [historia.json#bolsonaro-2025](https://www.metropoles.com/brasil/trama-golpista-stf-condena-bolsonaro-a-27-anos-e-3-meses-de-prisao) (sim); [historia.json#tse-inelegivel-2023](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_gerais_no_Brasil_em_2022) (sim); [historia.json#pec8-2023](https://www.poder360.com.br/congresso/senado-aprova-pec-que-limita-poderes-do-stf) (sim); [historia.json#direcoes/militares](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) (sim) | Bermeo e Levitsky-Ziblatt descrevem erosão gradual por meios legais. No catálogo, as decisões institucionais mexem na alavanca (ampliar-stf +0,25; remover-ministros-stf +0,30; anistia-politica +0,08). Os eventos de 2023-2025 mostram também resposta institucional (condenação em 2025), que é o laço balanceador, não o reforçador. |
| Erosão institucional (alavanca institutional_risk) → Impunidade percebida | + | 1 a 4 anos | media | sim | [historia.json#l14230-2021](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14230.htm) (sim); [historia.json#lj-anulacoes-2021](https://www.gazetadopovo.com.br/republica/fachin-explica-anulacao-condenacoes-lula-lava-jato/) (sim); [historia.json#direcoes/autonomias](https://pt.wikipedia.org/wiki/Tribunal_de_Contas_da_Uni%C3%A3o) (sim); [historia.json#direcoes/judicializacao](https://pt.wikipedia.org/wiki/Judicializa%C3%A7%C3%A3o_da_pol%C3%ADtica) (sim) | Mudanças como a Lei 14.230/2021 (dolo específico na improbidade) e as anulações da Lava Jato (2021) são lidas por uns como correção de abuso e por outros como enfraquecimento do controle: a leitura é contestada e depende de juízo normativo. |

**No modelo:** não simulado (ou só parcialmente). Parcial: o custo da erosão está em economy.py (institutional_risk entra no prêmio e no crescimento), mas institutional_risk é alavanca exógena; as quatro arestas do anel não são simuladas.

```
premium += 2,5*institutional_risk; g -= 1,2*institutional_risk. Execução ilustrativa: institutional_risk de 0,1 para 0,4 leva Selic 2038 de 17,1% para 19,8%, dívida de 135,7% para 158,6% e PIB de -0,42% para -1,47% (sim_ilus)
```

**Decisões do catálogo que tocam o anel:** `ampliar-stf`, `remover-ministros-stf`, `anistia-politica`, `reduzir-autonomia-bc`, `diretoria-bc-alinhada`, `reforma-administrativa`, `consulta-previa-regulamentada`, `comissario-das-geracoes-futuras`

**Potências:** `diversidade-ativo-institucional`, `infraestrutura-publica-digital`. **Tendências:** nenhuma. **Leis:** nenhuma. **Pilares:** `autocontrole-e-monopolio-legitimo`, `autonomia-e-confluencia`, `pluralismo-epistemico`.

**Pontos de alavanca (Meadows):**

- Meadows 7 (informação): auditoria pública e transparência de decisões
- Meadows 8 (regras): critérios de composição e mandato de cortes e agências
- Meadows 10 (objetivos) e 11 (paradigmas): norma social de que regras valem para todos

**Se o anel dominar.** Espiral virtuosa: Se a sanção é percebida como imparcial (processo, prova, devido processo), a confiança sobe e o custo de romper regras aumenta. Espiral viciosa: Espiral de desconfiança: cada lado vê o outro como ilegítimo; no modelo, risco institucional de 0,4 custa ~2,7 pp de Selic e ~1 pp de crescimento em 2038 (execução ilustrativa).

**O que o enfraqueceria:** Sanção imparcial e previsível (anel 14); Mandatos fixos e critérios técnicos de indicação; Eleições competitivas e aceitação do resultado; Redução de captura (anel 5).

## 7. Anel clima–floresta–agro: desmatamento, chuva e pressão por expansão (R)

O desmatamento reduz a chuva regional (além de um limiar de escala); menos chuva reduz a produtividade e a renda agropecuária; renda menor por hectare pode induzir mais abertura de área para compensar; mais abertura é mais desmatamento. O tipo do anel depende de uma aresta contestada (renda menor leva a mais ou a menos expansão?).

**Diagrama textual** (laço principal; `(+)` mesmo sentido, `(−)` sentido oposto):

```
[Desmatamento]
   ─(−)→ [Chuva regional na estação seca]
   ─(+)→ [Produtividade agropecuária]
   ─(+)→ [Renda por hectare]
   ─(−)→ [Pressão por abrir área nova]
   ─(+)→ [Desmatamento]
   ↺ fecha no início: anel REFORÇADOR (2 sinal(is) negativo(s))
ramal: [Chuva regional na estação seca] ─(−)→ [Focos de calor na Amazônia]
```

| Aresta | Sinal | Defasagem (base) | Força | Contest. | Evidência (verificado) | Nota |
|---|:-:|---|---|:-:|---|---|
| Desmatamento → Chuva regional na estação seca | − | anos a décadas; efeito não linear por escala | media | não | [Leite-Filho et al. (2021), Deforestation reduces rainfall and agricult](https://doi.org/10.1038/s41467-021-22840-7) (sim); [Staal et al. (2020), Hysteresis of tropical forests in the 21st centur](https://doi.org/10.1038/s41467-020-18728-7) (sim); [Spracklen, Arnold, Taylor (2012), Observations of increased tropical r](https://doi.org/10.1038/nature11390) (não); [Nobre et al. (2016), Land-use and climate change risks in the Amazon a](https://doi.org/10.1073/pnas.1605516113) (não); clima.json#cenarios_futuros (sim) | Leite-Filho et al.: até 55-60% de perda em células de 28 km eleva a chuva; acima disso a reduz. Os limiares no nível da bacia amazônica divergem (20-25% vs. 40%) e o IPCC AR6 dá confiança média, sem limiar numérico. |
| Chuva regional na estação seca → Produtividade agropecuária | + | mesma safra (seca) a poucos anos | media | sim | [Leite-Filho et al. (2021), Deforestation reduces rainfall and agricult](https://doi.org/10.1038/s41467-021-22840-7) (sim); clima.json#relacoes/chuva_agro_lag0 (sim); clima.json#relacoes/nino_pib_agro_lag0 (sim); [potenciais_brasil.json#agricultura-tropical-ptf](https://repositorio.ipea.gov.br/bitstream/11058/11199/1/td_2764.pdf) (sim) | A relação regional em Leite-Filho et al. conflita com a ausência de sinal na série nacional do repositório (r = -0,07; IC95 -0,40 a 0,40). A divergência é de escala e de poder estatístico: o repositório declara que a média nacional não representa o ano agrícola regional. |
| Produtividade agropecuária → Renda por hectare | + | mesma safra | forte | não | [potenciais_brasil.json#agricultura-tropical-ptf](https://repositorio.ipea.gov.br/bitstream/11058/11199/1/td_2764.pdf) (sim) | A PTF agropecuária cresceu 3,18% a.a. em 2000-2019 (Ipea), com queda recente associada a choques climáticos. |
| Renda por hectare → Pressão por abrir área nova | − | 1 a 3 anos | incerta | sim | [Cohn et al. (2014), Cattle ranching intensification in Brazil can redu](https://doi.org/10.1073/pnas.1307163111) (sim); [de Assis Costa et al. (2026), Agricultural intensification increases r](https://doi.org/10.1016/j.landusepol.2025.107842) (não); [Barona et al. (2010), The role of pasture and soybean in deforestation](https://doi.org/10.1088/1748-9326/5/2/024002) (não); [Assunção, Gandour, Rocha (2015), Deforestation slowdown in the Brazili](https://doi.org/10.1017/s1355770x15000078) (sim) | Se a renda por hectare cai, o produtor pode compensar abrindo mais terra (sinal -, anel reforçador) ou reduzir o investimento em expansão (sinal +, o anel viraria balanceador). Cohn et al. (2014) modelam que intensificar pode poupar terra; de Assis Costa et al. (2026, só o título foi lido) falam em paradoxo de Jevons. Assunção et al. mostram que o desmatamento respondeu aos preços agrícolas. A literatura diverge. |
| Pressão por abrir área nova → Desmatamento | + | 1 ano | forte | não | [Assunção, Gandour, Rocha (2015), Deforestation slowdown in the Brazili](https://doi.org/10.1017/s1355770x15000078) (sim); [Assunção, Gandour, Rocha, Rocha (2020), The Effect of Rural Credit on ](https://doi.org/10.1093/ej/uez060) (sim); [Nepstad et al. (2014), Slowing Amazon deforestation through public pol](https://doi.org/10.1126/science.1248525) (sim); [potenciais_brasil.json#floresta-carbono-restauracao](https://www.poder360.com.br/poder-sustentavel/desmatamento-no-brasil-cai-324-em-2024-diz-mapbiomas/) (sim); [potenciais_brasil.json#pastagens-recuperaveis](https://revistacultivar.com.br/noticias/brasil-possui-28-milhoes-de-ha-de-pastagens-degradadas-com-potencial-para-expansao-agricola) (sim) | Em 2024, 97% da perda de vegetação nativa veio da agropecuária; terra nova ainda é mais barata que intensificar nas pastagens (28 Mha recuperáveis). Políticas de 2004 e 2008 evitaram ~73 mil km² (56%) em 2005-2009 e a restrição de crédito rural reduziu o desmatamento: esse é o canal que o desenho de decisões atinge. |
| Chuva regional na estação seca → Focos de calor na Amazônia (ramal) | − | 1 ano | fraca | sim | clima.json#relacoes/nino_focos_amazonia_lag1 (sim) | ENSO tende a antecipar menos chuva e mais fogo na Amazônia com 1 ano de defasagem (r = +0,48, 1 teste em 36, n = 23); os focos também seguem fiscalização. |

**No modelo:** não simulado (ou só parcialmente). Não há desmatamento, chuva nem terra no modelo. O efeito econômico final entra de forma exógena por climate_shock (pp de PIB por ano) e climate_premium (pp de prêmio), ambos 0 por padrão; severidades 0,1/0,3/0,6 são SUPOSIÇÕES.

```
g -= climate_shock; premium += climate_premium. Repositório (clima.json#integracao_macro): choque moderado = +3,3 p.p. de dívida/PIB em 2035 no cenário pragmático
```

**Decisões do catálogo que tocam o anel:** `recuperar-pastagens-degradadas`, `credito-subsidiado`, `perdao-dividas`, `acordo-mercosul-ue`, `psa-governanca-comunitaria`, `homologar-terras-indigenas-e-titular-quilombos`, `combate-garimpo-ilegal-e-rastreio-do-ouro`, `direitos-da-natureza-municipais`, `seguranca-hidrica-saneamento`, `reforcar-arcabouco`

**Potências:** `floresta-carbono-restauracao`, `pastagens-recuperaveis`, `agricultura-tropical-ptf`, `agua-doce`, `terras-indigenas-contencao`. **Tendências:** `biotec_agro`. **Leis:** `jevons`. **Pilares:** `limites-planetarios`, `direitos-da-natureza`, `bens-comuns`, `tempo-longo-e-geracoes`.

**Pontos de alavanca (Meadows):**

- Meadows 8 (regras): crédito condicionado, rastreabilidade de cadeias, fiscalização (Assunção; Nepstad)
- Meadows 2 (estoque tampão): manter cobertura florestal acima do limiar é o estoque que protege a chuva
- Meadows 6: reduzir o ganho do laço pelo preço da terra nova (restauração de pastagens, titulação)
- Meadows 10 (objetivos): meta de desmatamento zero com restauração

**Se o anel dominar.** Espiral virtuosa: Se o anel for contido, a floresta mantém a chuva, a produtividade rural se sustenta e a pressão de expansão é absorvida por intensificação que poupa terra. Espiral viciosa: Ultrapassado o limiar regional, menos chuva e mais fogo reduzem produtividade e renda, o que pode induzir mais abertura (se a aresta renda -> pressão for negativa). O limiar da Amazônia é incerto; é o risco de cauda, não previsão.

**O que o enfraqueceria:** Fiscalização e punição efetivas (anel 13); Crédito condicionado e rastreabilidade; Intensificação com preço de terra que inibe expansão; Áreas protegidas e terras indígenas.

## 8. Anel clima–fiscal: eventos extremos, gasto emergencial e prevenção (R)

Eventos extremos geram danos e gasto de resposta; o gasto de resposta consome o espaço e a atenção política que iriam para prevenção; sem prevenção, o próximo evento causa mais dano. Um ramal passa pelo prêmio soberano. Há ainda o ramal hídrico-energético (afluência, CMO, inflação, Selic).

**Diagrama textual** (laço principal; `(+)` mesmo sentido, `(−)` sentido oposto):

```
[Dano por evento extremo]
   ─(+)→ [Gasto de resposta e recuperação]
   ─(−)→ [Recursos para prevenção e adaptação]
   ─(+)→ [Investimento efetivo em prevenção]
   ─(−)→ [Vulnerabilidade e exposição]
   ─(+)→ [Dano por evento extremo]
   ↺ fecha no início: anel REFORÇADOR (2 sinal(is) negativo(s))
ramal: [Dano por evento extremo] ─(+)→ [Prêmio de risco soberano]
ramal: [Prêmio de risco soberano] ─(−)→ [Recursos para prevenção e adaptação]
ramal: [Dano por evento extremo] ─(+)→ [CMO e tarifa de energia]
```

| Aresta | Sinal | Defasagem (base) | Força | Contest. | Evidência (verificado) | Nota |
|---|:-:|---|---|:-:|---|---|
| Dano por evento extremo → Gasto de resposta e recuperação | + | meses (dano) a 1-2 anos (reconstrução) | forte | não | [clima_valor_financeiro.json#rs2024_danos_perdas_dala](https://www.worldbank.org/pt/news/press-release/2024/11/28/relatorio-banco-mundial-bid-cepal-impacto-enchentes-pib-rio-grande-sul) (sim); [clima_valor_financeiro.json#rs2024_uniao_destinado_emergencial_62_5](https://www.noticiasagricolas.com.br/noticias/politica-economia/377817-ajuda-do-governo-federal-ao-rio-grande-do-sul-ja-soma-r-625-bilhoes.html) (sim) | RS 2024: R$ 88,9 bi de danos e perdas; dos R$ 62,5 bi 'destinados emergencialmente', a maior parte foi crédito e adiamento de dívida, não gasto. As linhas medem coisas diferentes e não se somam. |
| Gasto de resposta e recuperação → Recursos para prevenção e adaptação | − | 1 a 3 anos (orçamento, atenção política) | media | sim | [clima_valor_financeiro.json#tcu_federal_2013_2022](https://www.poder360.com.br/brasil/governo-investiu-31-dos-recursos-para-desastres-em-prevencao/) (sim); [clima_valor_financeiro.json#cnseg_2019_2024](https://legismap.com.br/conteudos/artigos-e-noticias/cnseg-brasil-gasta-quase-10-vezes-mais-com-resposta-a-desastres-do-que-com-prevencao) (sim); [Healy e Malhotra (2009), Myopic Voters and Natural Disaster Policy (re](https://doi.org/10.1017/S0003055409990104) (sim) | Gasto federal 2013-2022: 31% em prevenção e 69% em resposta (TCU); CNseg dá razão resposta/prevenção de 9,7 em 2019-2024; as razões não se reconciliam. Healy e Malhotra: nos EUA, eleitores premiam o socorro, não a preparação, o que desloca o orçamento para a resposta (evidência de outro país). |
| Recursos para prevenção e adaptação → Investimento efetivo em prevenção | + | 1 a 2 anos (execução) | media | não | [clima_valor_financeiro.json#tcu_federal_2013_2022](https://www.poder360.com.br/brasil/governo-investiu-31-dos-recursos-para-desastres-em-prevencao/) (sim) | Execução de prevenção depende de capacidade estatal e não só de dotação (não medido aqui). |
| Investimento efetivo em prevenção → Vulnerabilidade e exposição | − | 3 a 10 anos (obras, zoneamento, drenagem) | media | não | [clima_valor_financeiro.json#rs2024_danos_perdas_dala](https://www.worldbank.org/pt/news/press-release/2024/11/28/relatorio-banco-mundial-bid-cepal-impacto-enchentes-pib-rio-grande-sul) (sim); [Healy e Malhotra (2009), Myopic Voters and Natural Disaster Policy (re](https://doi.org/10.1017/S0003055409990104) (sim) | Razões de retorno citadas (US$ 4 a 15 por US$ 1; R$ 10 por R$ 1) vieram de resultados de busca (verificado = false) e não se transferem automaticamente ao RS. |
| Vulnerabilidade e exposição → Dano por evento extremo | + | imediata no próximo evento | forte | não | [clima_valor_financeiro.json#rs2024_danos_perdas_dala](https://www.worldbank.org/pt/news/press-release/2024/11/28/relatorio-banco-mundial-bid-cepal-impacto-enchentes-pib-rio-grande-sul) (sim); clima.json#relacoes/nino_chuva_brasil_lag1 (sim) | Dano = perigo × exposição × vulnerabilidade. A frequência do perigo (ENSO, chuva) tem sinal moderado nos dados (ENSO vs. chuva do Brasil, r = -0,33). |
| Dano por evento extremo → Prêmio de risco soberano (ramal) | + | 1 a 5 anos | incerta | sim | [Klusak et al. (2023), Rising Temperatures, Falling Ratings, Management](https://doi.org/10.1287/mnsc.2023.4869) (sim); clima.json#integracao_macro (sim) | Klusak et al. simulam rebaixamentos soberanos por clima para 109 países a partir de 2030; não é estimativa do Brasil. No modelo, climate_premium é suposição (0,1/0,3/0,6 pp). |
| Prêmio de risco soberano → Recursos para prevenção e adaptação (ramal) | − | 1 a 3 anos | incerta | não | economy.py (sim) | Prêmio maior encarece a dívida (anel 1) e reduz o espaço fiscal; elo hipotético, não quantificado. |
| Dano por evento extremo → CMO e tarifa de energia (ramal) | + | mesma estação a 1 ano | media | sim | clima.json#relacoes/ena_se_cmo_se_lag0 (sim); clima.json#relacoes/ear_nov_se_cmo_se_lag1 (sim); clima.json#episodios/crise-hidro-energetica-2021 (sim); clima.json#relacoes/ena_se_ipca_energia_lag0 (sim) | Menos afluência significa maior CMO (r = -0,50; ENA do Sudeste vs. CMO do Sudeste, n = 21). A relação com o IPCA de energia não é distinguível de zero (tarifa depende de bandeiras, reajustes e tributos). A crise de 2021 mostra o contexto, não o efeito causal. |

**No modelo:** não simulado (ou só parcialmente). Parcial: o custo final entra via Levers.climate_shock e climate_premium (economy.py), que alimentam o anel 1; as arestas do anel (resposta, prevenção, vulnerabilidade) não são simuladas.

```
g = ... - climate_shock; premium = ... + climate_premium
```

**Decisões do catálogo que tocam o anel:** `seguranca-hidrica-saneamento`, `reforcar-arcabouco`, `reforma-administrativa`, `psa-governanca-comunitaria`, `direitos-da-natureza-municipais`, `comissario-das-geracoes-futuras`, `politica-industrial-verde`

**Potências:** `agua-doce`, `matriz-eletrica-renovavel`, `solar-eolica-potencial-tecnico`, `floresta-carbono-restauracao`. **Tendências:** `solar_eolica`, `baterias_ve`. **Leis:** `wright`. **Pilares:** `limites-planetarios`, `tempo-longo-e-geracoes`, `territorio-e-cuidado`.

**Pontos de alavanca (Meadows):**

- Meadows 3 (estrutura física): drenagem, zoneamento, diversificação da matriz
- Meadows 7 (informação): alerta precoce e mapa de risco
- Meadows 8 (regras): piso de gasto em prevenção protegido de contingenciamento (hipótese)
- Meadows 2 (estoque tampão): reserva de contingência e seguro público

**Se o anel dominar.** Espiral virtuosa: Investir em prevenção diminui a vulnerabilidade, reduz o dano por evento e libera orçamento: o laço se inverte. Espiral viciosa: Cada evento consome o orçamento de prevenção; no modelo, o choque moderado custa ~3,3 p.p. de dívida/PIB em 2035 e ~3% de nível do PIB (suposições), sem contar o efeito endógeno do anel.

**O que o enfraqueceria:** Piso de prevenção blindado; Capacidade estatal local (defesa civil, planos de risco); Seguro e resseguro; Diversificação da matriz elétrica e segurança hídrica.

## 9. Anel desigualdade–educação–produtividade (R)

Desigualdade de renda e de oportunidade reduz o acesso a educação de qualidade; menos capital humano reduz a renda do trabalho de baixa renda; isso perpetua a desigualdade. Ramal: menos capital humano reduz produtividade e crescimento, e menos arrecadação limita o investimento em educação.

**Diagrama textual** (laço principal; `(+)` mesmo sentido, `(−)` sentido oposto):

```
[Desigualdade de renda e de oportunidade]
   ─(−)→ [Acesso a educação de qualidade]
   ─(+)→ [Capital humano e aprendizagem]
   ─(+)→ [Renda do trabalho de baixa renda]
   ─(−)→ [Desigualdade de renda e de oportunidade]
   ↺ fecha no início: anel REFORÇADOR (2 sinal(is) negativo(s))
ramal: [Capital humano e aprendizagem] ─(+)→ [Produtividade do trabalho]
ramal: [Produtividade do trabalho] ─(+)→ [Arrecadação e espaço fiscal]
ramal: [Arrecadação e espaço fiscal] ─(+)→ [Acesso a educação de qualidade]
```

| Aresta | Sinal | Defasagem (base) | Força | Contest. | Evidência (verificado) | Nota |
|---|:-:|---|---|:-:|---|---|
| Desigualdade de renda e de oportunidade → Acesso a educação de qualidade | − | uma geração (8 a 15 anos) | media | não | [Galor e Zeira (1993), Income Distribution and Macroeconomics (DOI conf](https://doi.org/10.2307/2297811) (não); [Bourguignon, Ferreira, Menéndez (2007), Inequality of Opportunity in B](https://doi.org/10.1111/j.1475-4991.2007.00247.x) (não); [potenciais_brasil.json#capital-humano-gap](https://www.oecd.org/en/publications/pisa-2022-results-volume-i-and-ii-country-notes_ed6fbcc5-en/brazil_61690648-en.html) (não); [fator_humano.json#edu-jovens-sem-em-2023](https://www.ibge.gov.br/estatisticas/sociais/educacao/17270-pnad-continua.html) (não) | Galor e Zeira (1993): restrição de crédito e desigualdade reduzem investimento em capital humano (DOI conferido; conteúdo de memória). Bourguignon et al. estudam a desigualdade de oportunidade no Brasil (DOI conferido; resumo não lido). PISA 2022 e 'jovens sem ensino médio' estão com verificado = false. |
| Acesso a educação de qualidade → Capital humano e aprendizagem | + | 4 a 12 anos (alfabetização na idade certa a ensino médio) | media | não | [potenciais_brasil.json#capital-humano-gap](https://www.oecd.org/en/publications/pisa-2022-results-volume-i-and-ii-country-notes_ed6fbcc5-en/brazil_61690648-en.html) (não); [fator_humano.json#edu-jovens-sem-em-2023](https://www.ibge.gov.br/estatisticas/sociais/educacao/17270-pnad-continua.html) (não) | O catálogo estima defasagem de 8 anos para educacao-tecnica-e-alfabetizacao (limite do modelo: aplica o benefício desde o 1º ano). |
| Capital humano e aprendizagem → Renda do trabalho de baixa renda | + | 10 a 30 anos para o efeito na renda | media | sim | [Hanushek e Woessmann (2012), Do better schools lead to more growth? (D](https://doi.org/10.1007/s10887-012-9081-x) (não); [potenciais_brasil.json (FMI Article IV 2025)](https://meetings.imf.org/-/media/Files/Publications/CR/2025/English/1braea2025001-source-pdf.ashx) (sim) | Hanushek e Woessmann ligam habilidades cognitivas e resultados econômicos (título lido; a causalidade é discutida). A informalidade >40% (FMI) dilui o retorno à qualificação (hipótese). |
| Renda do trabalho de baixa renda → Desigualdade de renda e de oportunidade | − | contínua | forte | não | [Bourguignon, Ferreira, Menéndez (2007), Inequality of Opportunity in B](https://doi.org/10.1111/j.1475-4991.2007.00247.x) (não) | Renda do trabalho de baixa renda mais alta reduz a desigualdade por definição estatística; a magnitude depende da estrutura de salários e de transferências. |
| Capital humano e aprendizagem → Produtividade do trabalho (ramal) | + | 10 a 30 anos | media | não | [Hanushek e Woessmann (2012), Do better schools lead to more growth? (D](https://doi.org/10.1007/s10887-012-9081-x) (não); [potenciais_brasil.json#agricultura-tropical-ptf](https://repositorio.ipea.gov.br/bitstream/11058/11199/1/td_2764.pdf) (sim) | Produtividade do trabalho: 21,2 no Brasil vs. 81,8 nos EUA (ILO 2025; mistura de bases, só ordem de grandeza). |
| Produtividade do trabalho → Arrecadação e espaço fiscal (ramal) | + | anos | media | não | futuros.json#integracao_macro (sim); [custo_corrupcao.json#gastos-tributarios](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/relatorios/renuncia/gastos-tributarios-ploa/dgt-previsao-ploa-2026-base-conceitual.pdf) (sim) | Mais produtividade eleva a base tributável; o modelo traduz isso em supply_reform (suposição). |
| Arrecadação e espaço fiscal → Acesso a educação de qualidade (ramal) | + | 1 a 3 anos | fraca | sim | [potenciais_brasil.json (FMI Article IV 2025)](https://meetings.imf.org/-/media/Files/Publications/CR/2025/English/1braea2025001-source-pdf.ashx) (sim) | Rigidez do gasto obrigatório e vinculação limitam a capacidade de expandir educação (barreira citada em capital-humano-gap). |

**No modelo:** não simulado (ou só parcialmente). Não há desigualdade nem capital humano no modelo. O efeito final de educação entra como supply_reform da decisão educacao-tecnica-e-alfabetizacao (+0,12 pp/ano) e primary_target -0,3 (custo).

```
g = 2,0 + tech_boost + supply_reform - ...
```

**Decisões do catálogo que tocam o anel:** `educacao-tecnica-e-alfabetizacao`, `ampliar-assistencia`, `desvincular-minimo`, `reforma-administrativa`, `orcamento-participativo-e-moedas-sociais`, `indicadores-complementares-ao-pib`

**Potências:** `capital-humano-gap`, `janela-demografica`, `diversidade-ativo-institucional`, `sociobioeconomia`. **Tendências:** `conectividade`, `ia_generativa_agentes`. **Leis:** `solow`, `romer`, `potencia_pareto`. **Pilares:** `capacidades-e-suficiencia`, `reciprocidade-e-darva`, `tempo-longo-e-geracoes`.

**Pontos de alavanca (Meadows):**

- Meadows 4 (defasagem): o benefício chega em ~8 anos, então o horizonte de política precisa ser maior que o ciclo eleitoral
- Meadows 3 (estrutura de estoques e fluxos): creche, alfabetização na idade certa e permanência no ensino médio
- Meadows 8 (regras): critérios de distribuição de recursos por necessidade (hipótese)
- Meadows 10 (objetivos): meta de aprendizagem, não só de matrícula

**Se o anel dominar.** Espiral virtuosa: Acesso crescente a educação de qualidade eleva a renda dos mais pobres, reduz desigualdade e amplia a base tributária; a janela demográfica é aproveitada. Espiral viciosa: Armadilha de baixa qualificação: a população atinge o pico em 2041 e o país envelhece antes de enriquecer (cenário descrito em potenciais_brasil.json#janela-demografica-fechando).

**O que o enfraqueceria:** Alfabetização na idade certa e ensino técnico; Transferências de renda condicionadas; Crédito educacional e acesso à creche; Redução da informalidade.

## 10. Anel tecnologia–produtividade–capacidade de investir (R)

A difusão de tecnologia eleva o PIB potencial; o crescimento maior melhora a razão dívida/PIB e a arrecadação; mais espaço fiscal e menor prêmio financiam infraestrutura, conectividade e educação que aceleram a difusão. As duas primeiras arestas estão no modelo; o fechamento é hipótese.

**Diagrama textual** (laço principal; `(+)` mesmo sentido, `(−)` sentido oposto):

```
[Difusão tecnológica]
   ─(+)→ [PIB potencial (tech_boost)]
   ─(+)→ [Espaço fiscal e prêmio menor]
   ─(+)→ [Investimento em infraestrutura digital, energia e educação]
   ─(+)→ [Difusão tecnológica]
   ↺ fecha no início: anel REFORÇADOR (0 sinal(is) negativo(s))
```

| Aresta | Sinal | Defasagem (base) | Força | Contest. | Evidência (verificado) | Nota |
|---|:-:|---|---|:-:|---|---|
| Difusão tecnológica → PIB potencial (tech_boost) | + | tech_lag = 1 ano no modelo; curva logística com ponto médio em 2031 | incerta | sim | economy.py (sim); futuros.json#integracao_macro (sim); leis_tecnologicas.json#tarefas (não); [leis_tecnologicas.json#ia_generativa_agentes](https://epoch.ai/trends) (sim) | tech_boost = tech_productivity * (S(ano - lag) - S0)/(1 - S0), com S logística (tech_midpoint 2031; tech_rate 0,8). tech_productivity é SUPOSIÇÃO explícita. Acemoglu estima ≤ 0,66% de PTF em 10 anos nos EUA (resumo), limite conservador de referência. |
| PIB potencial (tech_boost) → Espaço fiscal e prêmio menor | + | 1 a 3 anos | media | não | economy.py (sim); Execução determinística ilustrativa deste trabalho (n=1, shocks=False, (sim) | Mais crescimento reduz a dívida pelo denominador e o prêmio pelo excesso de dívida. Execução ilustrativa: tech_productivity de 0 para 0,5 leva a dívida de 2038 de 135,7% a 129,5% e a Selic de 17,1% a 16,5% (sim_ilus). |
| Espaço fiscal e prêmio menor → Investimento em infraestrutura digital, energia e educação | + | 2 a 5 anos | fraca | não | [leis_tecnologicas.json#solar_eolica](https://www.irena.org/Publications/2025/Jun/Renewable-Power-Generation-Costs-in-2024) (não); [potenciais_brasil.json (FMI Article IV 2025)](https://meetings.imf.org/-/media/Files/Publications/CR/2025/English/1braea2025001-source-pdf.ashx) (sim) | Hipótese: capacidade de investir depende de espaço fiscal e de capacidade estatal; gargalos de rede elétrica e curtailment aparecem na tendência solar_eolica. |
| Investimento em infraestrutura digital, energia e educação → Difusão tecnológica | + | 2 a 8 anos | media | não | [leis_tecnologicas.json#ia_generativa_agentes](https://epoch.ai/trends) (sim); [leis_tecnologicas.json#solar_eolica](https://www.irena.org/Publications/2025/Jun/Renewable-Power-Generation-Costs-in-2024) (não) | Conectividade, rede e energia são pré-requisitos de difusão (Pix, fibra, solar); o catálogo não tem decisão específica de infraestrutura digital. |

**No modelo:** simulado. economy.py: tech_boost() e a equação do PIB (primeiras duas arestas, via Levers.tech_productivity, tech_midpoint, tech_rate, tech_lag). As arestas de investimento são exógenas.

```
g = 2,0 + tech_boost + supply_reform - 0,30*(real-5,0) - 1,2*institutional_risk - climate_shock; gap = 0,6*gap + (g - 2,0 - boost)
```

**Decisões do catálogo que tocam o anel:** `politica-industrial-verde`, `abertura-comercial`, `acordo-mercosul-ue`, `acelerar-ibs-cbs`, `privatizacoes`, `educacao-tecnica-e-alfabetizacao`, `estrategia-minerais-criticos`

**Potências:** `infraestrutura-publica-digital`, `matriz-eletrica-renovavel`, `solar-eolica-potencial-tecnico`, `eolica-offshore-hidrogenio-verde`, `minerais-transicao-reservas`. **Tendências:** `ia_generativa_agentes`, `solar_eolica`, `baterias_ve`, `conectividade`, `pagamentos_digitais`, `energia_data_centers`. **Leis:** `moore`, `wright`, `aprendizado_baterias`, `scaling_chinchilla`, `tendencia_compute_ia`, `logistica`, `bass`. **Pilares:** `tempo-longo-e-geracoes`, `limites-planetarios`.

**Pontos de alavanca (Meadows):**

- Meadows 3 (estrutura física): rede de transmissão e armazenamento
- Meadows 6 (ganho do laço reforçador): complementaridade entre educação e tecnologia
- Meadows 8 (regras): regra de GD, tarifas de importação e regulação de IA (PL 2338/2023 em tramitação)

**Se o anel dominar.** Espiral virtuosa: Difusão ampla com capacidade estatal e energia disponível: PIB potencial mais alto, menor dívida/PIB e financiamento de mais infraestrutura. Espiral viciosa: Difusão concentrada e gargalo de rede/energia: o ganho de produtividade fica em poucos setores e não chega à arrecadação; leis de aprendizado falham fora de seus domínios de validade (docs/LEIS_E_TENDENCIAS.md §2).

**O que o enfraqueceria:** Gargalos de rede e energia (curtailment); Juros reais altos encarecem tecnologias intensivas em capital; Capital humano insuficiente (anel 9); Concentração dos ganhos (anel 5).

## 11. Anel balanceador: automação, trabalho e demanda (B)

Quando o trabalho fica relativamente caro, aumenta o incentivo para automatizar; a automação desloca tarefas e reduz a demanda por trabalho e o salário, o que reduz o custo relativo do trabalho. Ramal: novas tarefas (reinstatement) e queda da demanda agregada. É hipótese qualitativa ancorada em Acemoglu-Restrepo; o Brasil tem informalidade alta que muda o cálculo.

**Diagrama textual** (laço principal; `(+)` mesmo sentido, `(−)` sentido oposto):

```
[Custo relativo do trabalho]
   ─(+)→ [Incentivo à automação (IA, robôs)]
   ─(+)→ [Deslocamento de tarefas]
   ─(−)→ [Demanda por trabalho e salários]
   ─(+)→ [Custo relativo do trabalho]
   ↺ fecha no início: anel EQUILIBRADOR (1 sinal(is) negativo(s))
ramal: [Deslocamento de tarefas] ─(+)→ [Novas tarefas]
ramal: [Demanda por trabalho e salários] ─(+)→ [Demanda agregada das famílias]
```

| Aresta | Sinal | Defasagem (base) | Força | Contest. | Evidência (verificado) | Nota |
|---|:-:|---|---|:-:|---|---|
| Custo relativo do trabalho → Incentivo à automação (IA, robôs) | + | 1 a 5 anos (adoção) | media | não | [Acemoglu e Restrepo (2019), Automation and New Tasks, JEP (resumo lido](https://doi.org/10.1257/jep.33.2.3) (sim); [leis_tecnologicas.json#exposicao_ia](https://blogdoibre.fgv.br/posts/inteligencia-artificial-generativa-e-mercado-de-trabalho-no-brasil-evidencias-iniciais-sobre) (sim) | Framework de tarefas: automação substitui trabalho onde o capital é mais barato. A elasticidade para o Brasil não é conhecida (repositório: exposição ≠ adoção). |
| Incentivo à automação (IA, robôs) → Deslocamento de tarefas | + | 2 a 8 anos (curva de adoção, logística/Bass) | incerta | sim | [leis_tecnologicas.json#exposicao_ia](https://blogdoibre.fgv.br/posts/inteligencia-artificial-generativa-e-mercado-de-trabalho-no-brasil-evidencias-iniciais-sobre) (sim); [leis_tecnologicas.json#exposicao_ia](https://www.imf.org/en/Blogs/Articles/2024/01/14/ai-will-transform-the-global-economy-lets-make-sure-it-benefits-humanity) (sim); [leis_tecnologicas.json#ia_generativa_agentes](https://epoch.ai/trends) (sim) | 29,6% dos ocupados com alguma exposição (FGV IBRE) e ~5,2 milhões na mais alta; efeito detectado concentrado em jovens de 18 a 29 anos nos dados de 2022-2025; FMI: nas avançadas, metade dos expostos tende a ganhar. Exposição não é desemprego. |
| Deslocamento de tarefas → Demanda por trabalho e salários | − | 1 a 5 anos | incerta | sim | [Acemoglu e Restrepo (2019), Automation and New Tasks, JEP (resumo lido](https://doi.org/10.1257/jep.33.2.3) (sim); [leis_tecnologicas.json#exposicao_ia](https://blogdoibre.fgv.br/posts/inteligencia-artificial-generativa-e-mercado-de-trabalho-no-brasil-evidencias-iniciais-sobre) (sim) | Displacement effect, contrabalançado por reinstatement. O sinal líquido depende da criação de novas tarefas e é a divergência central da literatura. |
| Demanda por trabalho e salários → Custo relativo do trabalho | + | 1 a 3 anos | media | não | [potenciais_brasil.json (FMI Article IV 2025)](https://meetings.imf.org/-/media/Files/Publications/CR/2025/English/1braea2025001-source-pdf.ashx) (sim) | Menos demanda por trabalho e salários mais baixos reduzem o custo relativo do trabalho. A informalidade >40% (FMI) torna o ajuste via renda mais provável que via desemprego aberto (hipótese). |
| Deslocamento de tarefas → Novas tarefas (ramal) | + | anos a décadas | incerta | sim | [Acemoglu e Restrepo (2019), Automation and New Tasks, JEP (resumo lido](https://doi.org/10.1257/jep.33.2.3) (sim) | Novas tarefas criadas por tecnologia amortecem o efeito líquido; sem medida brasileira. |
| Demanda por trabalho e salários → Demanda agregada das famílias (ramal) | + | 1 ano | media | não | leis_tecnologicas.json#potencia_pareto (não) | Menos renda do trabalho reduz o consumo; a distribuição (leis de potência) define quanto da produtividade vira demanda. Hipótese, não estimada. |

**No modelo:** não simulado (ou só parcialmente). Não simulado. O catálogo de tendências marca a alavanca do modelo como supply_reform e fiscal (arrecadação sobre folha), mas nenhum delas representa deslocamento de trabalho.

**Decisões do catálogo que tocam o anel:** `educacao-tecnica-e-alfabetizacao`, `ampliar-assistencia`, `desoneracao-ampla`, `reforma-previdencia-2`, `acelerar-ibs-cbs`

**Potências:** `capital-humano-gap`, `janela-demografica`, `infraestrutura-publica-digital`. **Tendências:** `ia_generativa_agentes`, `robotica_automacao`, `conectividade`, `difusao_cauda`. **Leis:** `tarefas`, `exposicao_ia`, `baumol`, `kurzweil`. **Pilares:** `capacidades-e-suficiencia`, `reciprocidade-e-darva`.

**Pontos de alavanca (Meadows):**

- Meadows 3: estrutura de requalificação e transição
- Meadows 7: dados de adoção por setor e idade
- Meadows 8: tributação de capital vs. trabalho e proteção social para informais (hipótese)
- Meadows 9: capacidade de negociar a adoção

**Se o anel dominar.** Espiral virtuosa: A automação libera trabalho para novas tarefas, a produtividade sobe e o ganho é compartilhado. Espiral viciosa: Deslocamento rápido de jovens qualificados em tarefas de entrada, com informalidade e renda menor, o que reforça a desigualdade (anel 9) e reduz a base de folha (anel 1).

**O que o enfraqueceria:** Requalificação e educação técnica; Proteção social para informais; Adoção gradual e complementar (humano+máquina); Regulação de IA.

## 12. Anel violência–capital humano (R)

Violência armada local interrompe a escola e reduz a aprendizagem; menos capital humano reduz as alternativas lícitas de renda; menos alternativas facilitam o recrutamento por facções; o recrutamento aumenta a violência.

**Diagrama textual** (laço principal; `(+)` mesmo sentido, `(−)` sentido oposto):

```
[Violência armada local]
   ─(−)→ [Aprendizagem e permanência escolar]
   ─(+)→ [Alternativas lícitas de renda]
   ─(−)→ [Recrutamento por facções]
   ─(+)→ [Violência armada local]
   ↺ fecha no início: anel REFORÇADOR (2 sinal(is) negativo(s))
```

| Aresta | Sinal | Defasagem (base) | Força | Contest. | Evidência (verificado) | Nota |
|---|:-:|---|---|:-:|---|---|
| Violência armada local → Aprendizagem e permanência escolar | − | mesmo ano letivo | forte | não | [Monteiro e Rocha (2017), Drug Battles and School Achievement](https://doi.org/10.1162/REST_a_00628) (sim); [fator_humano.json#vu-homicidios-2023](https://www.poder360.com.br/poder-brasil/brasil-teve-60-jovens-assassinados-por-dia-em-2023-diz-relatorio/) (sim) | Monteiro e Rocha (2017): tiroteios entre facções reduzem notas de matemática no Rio, com mecanismo de oferta (faltas de professores, fechamento de escolas). Caso de favelas do Rio; não se extrapola ao país. No Brasil houve 45.747 homicídios em 2023, 21.856 de jovens. |
| Aprendizagem e permanência escolar → Alternativas lícitas de renda | + | 5 a 15 anos | media | não | [Hanushek e Woessmann (2012), Do better schools lead to more growth? (D](https://doi.org/10.1007/s10887-012-9081-x) (não); [fator_humano.json#edu-jovens-sem-em-2023](https://www.ibge.gov.br/estatisticas/sociais/educacao/17270-pnad-continua.html) (não); [potenciais_brasil.json#capital-humano-gap](https://www.oecd.org/en/publications/pisa-2022-results-volume-i-and-ii-country-notes_ed6fbcc5-en/brazil_61690648-en.html) (não) | ~9 milhões de jovens sem ensino médio (não conferido na fonte). O elo educação -> renda lícita é o mesmo do anel 9. |
| Alternativas lícitas de renda → Recrutamento por facções | − | 1 a 5 anos | incerta | sim | [custo_corrupcao.json#becker-crime](https://doi.org/10.1086/259394) (sim); [fator_humano.json#vu-queda-2017](https://www.poder360.com.br/poder-brasil/brasil-teve-60-jovens-assassinados-por-dia-em-2023-diz-relatorio/) (não) | Becker: o crime responde a retornos e punição (DOI conferido no repositório). Evidência brasileira específica sobre renda lícita e recrutamento não foi lida nesta rodada. A queda de 30,2% na taxa de homicídio de jovens entre 2017 e 2023 mostra que o nível pode mudar rápido por outras causas (arranjos entre facções, policiamento). |
| Recrutamento por facções → Violência armada local | + | 1 a 3 anos | media | não | [fator_humano.json#vu-homicidios-2023](https://www.poder360.com.br/poder-brasil/brasil-teve-60-jovens-assassinados-por-dia-em-2023-diz-relatorio/) (sim) | Mais membros e territórios disputados significam mais confrontos (hipótese). |

**No modelo:** não simulado (ou só parcialmente). Não simulado; sem variável de violência ou capital humano em economy.py.

**Decisões do catálogo que tocam o anel:** `educacao-tecnica-e-alfabetizacao`, `ampliar-assistencia`, `orcamento-participativo-e-moedas-sociais`, `combate-garimpo-ilegal-e-rastreio-do-ouro`

**Potências:** `capital-humano-gap`, `janela-demografica`. **Tendências:** `conectividade`. **Leis:** nenhuma. **Pilares:** `autocontrole-e-monopolio-legitimo`, `territorio-e-cuidado`, `capacidades-e-suficiencia`.

**Pontos de alavanca (Meadows):**

- Meadows 3: escola aberta e protegida em áreas de conflito
- Meadows 8: protocolo de operações policiais perto de escolas (hipótese)
- Meadows 7: dados georreferenciados de violência e evasão

**Se o anel dominar.** Espiral virtuosa: Menor violência mantém a escola funcionando, eleva a renda lícita futura e reduz o recrutamento. Espiral viciosa: Territórios em que a escola não funciona e a facção é a opção de renda: armadilha local que reproduz violência por gerações.

**O que o enfraqueceria:** Escola protegida e permanência no ensino médio; Emprego formal para jovens; Policiamento focalizado e inteligência; Políticas de saída para membros jovens.

## 13. Anel balanceador: território, terras indígenas e conservação (B)

Pressão de invasão, garimpo e grilagem causa dano no território; o dano mobiliza fiscalização, homologação e proteção; a proteção efetiva reduz a pressão. O anel é frágil porque a fiscalização depende de capacidade estatal e de decisões políticas e judiciais (marco temporal).

**Diagrama textual** (laço principal; `(+)` mesmo sentido, `(−)` sentido oposto):

```
[Pressão de invasão, garimpo e grilagem]
   ─(+)→ [Dano ao território (desmatamento, saúde, violência)]
   ─(+)→ [Resposta pública (fiscalização, homologação, rastreio do ouro)]
   ─(+)→ [Proteção efetiva do território]
   ─(−)→ [Pressão de invasão, garimpo e grilagem]
   ↺ fecha no início: anel EQUILIBRADOR (1 sinal(is) negativo(s))
```

| Aresta | Sinal | Defasagem (base) | Força | Contest. | Evidência (verificado) | Nota |
|---|:-:|---|---|:-:|---|---|
| Pressão de invasão, garimpo e grilagem → Dano ao território (desmatamento, saúde, violência) | + | meses a 1 ano | forte | não | [potenciais_brasil.json#terras-indigenas-contencao](https://ihu.unisinos.br/categorias/644315-protecao-de-povos-originarios-faz-de-terras-indigenas-as-areas-mais-preservadas-do-brasil) (sim); [custo_corrupcao.json#crime-ambiental-ouro-madeira-terra](https://escolhas.org/wp-content/uploads/2022/12/Ouro-200-toneladas.pdf) (sim); [historia.json#yanomami-2023](https://www.poder360.com.br/brasil/governo-decreta-emergencia-de-saude-publica-em-terra-yanomami/) (sim) | Emergência de saúde na Terra Yanomami (2023); 228,99 t de ouro com indício de ilegalidade em 2015-2020 (47% do estimado); MapBiomas: 1% de perda em TIs vs. 28% em terras privadas (descritivo; TIs ficam em áreas remotas, e a proteção pode ser efeito de localização). |
| Dano ao território (desmatamento, saúde, violência) → Resposta pública (fiscalização, homologação, rastreio do ouro) | + | meses a 2 anos | media | não | [historia.json#yanomami-2023](https://www.poder360.com.br/brasil/governo-decreta-emergencia-de-saude-publica-em-terra-yanomami/) (sim); [potenciais_brasil.json#floresta-carbono-restauracao](https://www.poder360.com.br/poder-sustentavel/desmatamento-no-brasil-cai-324-em-2024-diz-mapbiomas/) (sim); [Nepstad et al. (2014), Slowing Amazon deforestation through public pol](https://doi.org/10.1126/science.1248525) (sim) | A queda de 32,4% da perda de vegetação nativa em 2024 e de 11,8% do PRODES em 2025 é associada à fiscalização, não ao potencial; aumento de 25% no Mato Grosso mostra heterogeneidade. |
| Resposta pública (fiscalização, homologação, rastreio do ouro) → Proteção efetiva do território | + | 1 a 3 anos | media | sim | [BenYishay et al. (2017), Indigenous land rights and deforestation](https://doi.org/10.1016/j.jeem.2017.07.008) (não); [Nolte et al. (2013), Governance regime and location influence avoided ](https://doi.org/10.1073/pnas.1214786110) (sim); [custo_corrupcao.json#crime-ambiental-ouro-madeira-terra](https://portal.tcu.gov.br/data/files/15/96/6E/EB/4E1D28102DFE0FF7F18818A8/038.685-2021-3-MBC%20-%20Auditoria%20operacional%20sancoes%20Ibama.pdf) (sim); [custo_corrupcao.json#crime-ambiental-ouro-madeira-terra](https://www.aosfatos.org/noticias/por-que-o-ibama-arrecada-so-5-das-multas-ambientais-que-aplica/) (não) | BenYishay et al. (DOI conferido; resumo não lido) tratam do reconhecimento de terras indígenas e do desmatamento. Nolte et al.: o debate sobre qual regime de proteção é mais eficaz está aberto. A capacidade de punir é limitada: autuados vs. julgados do Ibama em queda e arrecadação de ~5% das multas (não verificado). |
| Proteção efetiva do território → Pressão de invasão, garimpo e grilagem | − | 1 a 5 anos | media | sim | [potenciais_brasil.json#terras-indigenas-contencao](https://ihu.unisinos.br/categorias/644315-protecao-de-povos-originarios-faz-de-terras-indigenas-as-areas-mais-preservadas-do-brasil) (sim); [historia.json#direcoes/marco-temporal](https://pt.wikipedia.org/wiki/Marco_temporal_das_terras_ind%C3%ADgenas) (sim); [Nolte et al. (2013), Governance regime and location influence avoided ](https://doi.org/10.1073/pnas.1214786110) (sim) | O efeito pode ser desfeito por mudanças de regra: conflito Legislativo x STF sobre o marco temporal (a decisão de 2026 só consta em síntese jornalística). |

**No modelo:** não simulado (ou só parcialmente). Não simulado. As decisões homologar-terras-indigenas-e-titular-quilombos e combate-garimpo-ilegal-e-rastreio-do-ouro entram só com custo fiscal (primary_target -0,05) e institutional_risk -0,02/-0,03; o benefício ambiental não é modelado.

**Decisões do catálogo que tocam o anel:** `homologar-terras-indigenas-e-titular-quilombos`, `combate-garimpo-ilegal-e-rastreio-do-ouro`, `consulta-previa-regulamentada`, `psa-governanca-comunitaria`, `direitos-da-natureza-municipais`, `ampliar-stf`, `remover-ministros-stf`, `reforma-administrativa`

**Potências:** `terras-indigenas-contencao`, `floresta-carbono-restauracao`, `biodiversidade`, `sociobioeconomia`, `diversidade-ativo-institucional`. **Tendências:** `conectividade`, `biotec_agro`. **Leis:** nenhuma. **Pilares:** `territorio-e-cuidado`, `pluralismo-epistemico`, `direitos-da-natureza`, `autonomia-e-confluencia`, `bens-comuns`.

**Pontos de alavanca (Meadows):**

- Meadows 7: monitoramento por satélite com divulgação (DETER/PRODES, MapBiomas)
- Meadows 8: rastreabilidade do ouro e cadeias
- Meadows 9: governança comunitária e consulta prévia
- Meadows 3: presença estatal permanente em campo (base operacional)

**Se o anel dominar.** Espiral virtuosa: Proteção efetiva e titulação reduzem a pressão e mantêm a cobertura que sustenta a chuva (ligação com o anel 7). Espiral viciosa: Se a resposta é intermitente ou revertida, a pressão volta e o dano se acumula; o efeito é de histerese ecológica difícil de reverter.

**O que o enfraqueceria:** Cortes na capacidade de fiscalização e na Funai/Ibama (hipótese; não medido aqui); Mudanças legais como o marco temporal; Alta do preço do ouro e da terra; Captura local (anel 5).

## 14. Anel balanceador: auditoria, imprensa, Judiciário e voto (B)

Irregularidades geram detecção (auditoria, imprensa, MP, PF, tribunais); a detecção gera custo esperado (eleitoral, penal, administrativo); o custo esperado reduz a irregularidade. Este anel funciona quando as quatro condições existem: ser detectado, divulgado, punido e lembrado pelo eleitor.

**Diagrama textual** (laço principal; `(+)` mesmo sentido, `(−)` sentido oposto):

```
[Irregularidade e corrupção]
   ─(+)→ [Detecção e divulgação (auditoria, imprensa, MP/PF, tribunais)]
   ─(+)→ [Custo esperado (eleitoral, penal, administrativo)]
   ─(−)→ [Irregularidade e corrupção]
   ↺ fecha no início: anel EQUILIBRADOR (1 sinal(is) negativo(s))
```

| Aresta | Sinal | Defasagem (base) | Força | Contest. | Evidência (verificado) | Nota |
|---|:-:|---|---|:-:|---|---|
| Irregularidade e corrupção → Detecção e divulgação (auditoria, imprensa, MP/PF, tribunais) | + | meses a anos (auditorias, inquéritos) | media | não | [custo_corrupcao.json#ferraz-finan-reeleicao](https://doi.org/10.1162/qjec.2008.123.2.703) (sim); [custo_corrupcao.json#avis-ferraz-finan-dissuasao](https://doi.org/10.1086/699209) (sim); [historia.json#lj-2014](https://pt.wikipedia.org/wiki/Opera%C3%A7%C3%A3o_Lava_Jato) (sim); [historia.json#mensalao-2012](https://pt.wikipedia.org/wiki/Mensal%C3%A3o) (sim) | As auditorias aleatórias da CGU revelaram irregularidades em municípios sorteados; a CGU registrou irregularidades em licitações em 55 de 60 municípios na 24ª edição (via imprensa, não verificado). |
| Detecção e divulgação (auditoria, imprensa, MP/PF, tribunais) → Custo esperado (eleitoral, penal, administrativo) | + | 1 a 4 anos (ciclo eleitoral, processos) | media | não | [custo_corrupcao.json#ferraz-finan-reeleicao](https://doi.org/10.1162/qjec.2008.123.2.703) (sim); [Ferraz e Finan (2011), Electoral Accountability and Corruption](https://doi.org/10.1257/aer.101.4.1274) (não); [Besley e Burgess (2002), The Political Economy of Government Responsiv](https://doi.org/10.1162/003355302320935061) (não); [historia.json#direcoes/judicializacao](https://pt.wikipedia.org/wiki/Judicializa%C3%A7%C3%A3o_da_pol%C3%ADtica) (sim) | Ferraz e Finan (2008): revelar desvios reduziu a reeleição do prefeito (~20% no resumo do working paper), com efeito maior com rádio local. A resposta do eleitor foi estimada em municípios pequenos e médios; o eleitor pode tolerar corrupção em troca de entregas. Besley e Burgess (Índia) para imprensa e responsividade. |
| Custo esperado (eleitoral, penal, administrativo) → Irregularidade e corrupção | − | 1 a 4 anos | media | sim | [custo_corrupcao.json#avis-ferraz-finan-dissuasao](https://doi.org/10.1086/699209) (sim); [custo_corrupcao.json#klitgaard](https://doi.org/10.1525/9780520911185) (sim); [custo_corrupcao.json#crime-ambiental-ouro-madeira-terra](https://portal.tcu.gov.br/data/files/15/96/6E/EB/4E1D28102DFE0FF7F18818A8/038.685-2021-3-MBC%20-%20Auditoria%20operacional%20sancoes%20Ibama.pdf) (sim); [historia.json#l14230-2021](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14230.htm) (sim); [historia.json#lj-anulacoes-2021](https://www.gazetadopovo.com.br/republica/fachin-explica-anulacao-condenacoes-lula-lava-jato/) (sim) | Avis, Ferraz e Finan (DOI no repositório) mostram menor corrupção em municípios auditados. O custo esperado é minado pela fraqueza de sanção: Ibama (autuados vs. julgados), transação tributária (57,9% voltaram a inadimplir, via imprensa), mudanças legais (Lei 14.230) e anulações da Lava Jato. |

**No modelo:** não simulado (ou só parcialmente). Não simulado. Entra de forma indireta no custo de erosão institucional (institutional_risk) e na credibilidade (fiscal_credibility) quando decisões do catálogo mexem nas alavancas.

**Decisões do catálogo que tocam o anel:** `reforma-administrativa`, `ampliar-stf`, `remover-ministros-stf`, `anistia-politica`, `comissario-das-geracoes-futuras`, `indicadores-complementares-ao-pib`, `orcamento-participativo-e-moedas-sociais`

**Potências:** `infraestrutura-publica-digital`, `diversidade-ativo-institucional`. **Tendências:** `conectividade`, `ia_generativa_agentes`. **Leis:** nenhuma. **Pilares:** `autocontrole-e-monopolio-legitimo`, `pluralismo-epistemico`, `bens-comuns`.

**Pontos de alavanca (Meadows):**

- Meadows 7 (informação): publicação das auditorias antes das eleições, dados abertos, rastreio de despesas
- Meadows 8 (regras): independência e orçamento de órgãos de controle (TCU, CGU, MP); transparência de beneficiários de emendas
- Meadows 5: reforço do laço balanceador com capacidade de julgamento (taxa de julgamento de processos)

**Se o anel dominar.** Espiral virtuosa: Detecção e sanção previsíveis, imparciais e rápidas reduzem a irregularidade e aumentam a confiança (enfraquece o anel 6 e o anel 5). Espiral viciosa: Se a detecção não gera sanção (ou é revertida), o anel se esvazia: a impunidade percebida alimenta o anel 6.

**O que o enfraqueceria:** Redução do orçamento e da autonomia de órgãos de controle; Mudanças legais que dificultam sanção (ex.: prescrição, dolo específico) e anulações processuais; Opacidade de emendas e transferências especiais; Captura dos controladores (anel 5).

## Interações entre anéis (qual alimenta qual)

| De | Para | Tipo | Descrição |
|---|---|---|---|
| 6. `legitimidade-impunidade` | 1. `fiscal-juros-divida` | reforca | institutional_risk eleva o prêmio (prem_inst 2,5 pp por unidade) e reduz o crescimento (g_inst 1,2 pp por unidade): a única ligação entre um anel institucional e o laço fiscal que o modelo simula, e o valor de entrada é exógeno. |
| 2. `expectativas-ancoragem` | 1. `fiscal-juros-divida` | reforca | A Selic mais alta por inflação esperada eleva o custo da dívida; no modelo, o ganho é parcialmente compensado pela erosão nominal da dívida. |
| 1. `fiscal-juros-divida` | 2. `expectativas-ancoragem` | reforca | Dívida alta com baixa credibilidade alimenta a dominância fiscal e a inflação de longo prazo (pi_debt). |
| 1. `fiscal-juros-divida` | 3. `reacao-fiscal` | aciona | A dívida acima de 80% do PIB aciona a reação do primário (react). |
| 3. `reacao-fiscal` | 1. `fiscal-juros-divida` | amortece | O primário maior reduz a dívida e enfraquece o anel 1. |
| 1. `fiscal-juros-divida` | 4. `disciplina-de-mercado` | aciona | Prêmio e Selic altos criam demanda por regra fiscal crível (hipótese). |
| 4. `disciplina-de-mercado` | 1. `fiscal-juros-divida` | amortece | Maior credibilidade reduz o prêmio (prem_cred); simulado como alavanca, não como resposta política. |
| 5. `captura-concentracao` | 1. `fiscal-juros-divida` | reforca | Gastos tributários e emendas reduzem a margem do primário; no modelo, aparecem como primary_target e fiscal_credibility das decisões (cortar-beneficios-fiscais, desoneracao-ampla). |
| 5. `captura-concentracao` | 6. `legitimidade-impunidade` | reforca | Regras favoráveis a poucos alimentam a percepção de impunidade e desconfiança (hipótese). |
| 6. `legitimidade-impunidade` | 14. `controle-externo-eleitor` | enfraquece | Erosão institucional reduz a independência e a capacidade de órgãos de controle. |
| 14. `controle-externo-eleitor` | 6. `legitimidade-impunidade` | amortece | Detecção e sanção previsíveis reduzem a impunidade percebida. |
| 14. `controle-externo-eleitor` | 5. `captura-concentracao` | amortece | Detecção e divulgação reduzem a renda extraordinária obtida por regras favoráveis. |
| 7. `clima-floresta-agro` | 8. `clima-fiscal-adaptacao` | reforca | Seca, fogo e menor chuva aumentam o dano por evento extremo (hipótese; ENSO e focos têm sinal moderado nos dados). |
| 8. `clima-fiscal-adaptacao` | 1. `fiscal-juros-divida` | reforca | climate_shock e climate_premium entram no anel 1 (simulado, mas como suposição de severidade). |
| 1. `fiscal-juros-divida` | 8. `clima-fiscal-adaptacao` | reforca | Menos espaço fiscal reduz recursos de prevenção (hipótese). |
| 13. `territorio-indigena-conservacao` | 7. `clima-floresta-agro` | amortece | Proteção efetiva do território contém o desmatamento e preserva a chuva. |
| 6. `legitimidade-impunidade` | 13. `territorio-indigena-conservacao` | enfraquece | Erosão institucional e captura local reduzem a fiscalização e a segurança jurídica (ex.: marco temporal). |
| 9. `desigualdade-educacao-produtividade` | 12. `violencia-capital-humano` | reforca | Baixa escolaridade reduz alternativas lícitas e alimenta o recrutamento. |
| 12. `violencia-capital-humano` | 9. `desigualdade-educacao-produtividade` | reforca | A violência reduz a aprendizagem, piorando o anel 9. |
| 9. `desigualdade-educacao-produtividade` | 11. `automacao-trabalho-demanda` | modula | Menor qualificação aumenta a exposição ao deslocamento sem acesso a novas tarefas. |
| 11. `automacao-trabalho-demanda` | 9. `desigualdade-educacao-produtividade` | reforca | Deslocamento de jovens em tarefas de entrada pressiona a renda do trabalho de baixa renda. |
| 10. `tecnologia-produtividade-capacidade` | 1. `fiscal-juros-divida` | amortece | tech_boost eleva g e reduz a dívida/PIB (simulado como suposição). |
| 11. `automacao-trabalho-demanda` | 1. `fiscal-juros-divida` | reforca | Se a automação reduz a base de folha e a demanda, a arrecadação cai (hipótese; não simulado). |
| 1. `fiscal-juros-divida` | 9. `desigualdade-educacao-produtividade` | reforca | Aperto fiscal sobre despesa discricionária (investimento, educação) reduz o acesso (hipótese, ligada à rigidez do gasto). |
| 7. `clima-floresta-agro` | 10. `tecnologia-produtividade-capacidade` | modula | A matriz renovável e a hidrologia condicionam o custo de energia para difusão (hipótese). |

Leitura de conjunto (hipótese, não resultado do modelo): o anel fiscal (1) é o ponto de chegada de quase tudo porque é o único com equação; ele recebe o custo da erosão institucional (6), do clima (8) e da tecnologia (10) como parâmetros exógenos. Os anéis 5, 6 e 14 formam um núcleo institucional em que captura e impunidade se reforçam e o controle externo equilibra; os anéis 7, 8 e 13 formam o núcleo território-clima; os anéis 9, 11 e 12 formam o núcleo humano.

## Anéis ausentes por falta de evidência

- **`cambio-divida-inflacao`**: Câmbio, dívida em moeda estrangeira e inflação (o canal de Blanchard 2004). Falta no modelo e não houve evidência atual conferida sobre a estrutura da dívida (prefixada, IPCA, Selic, câmbio) nem sobre o repasse do câmbio.
- **`previdencia-envelhecimento-primario`**: Envelhecimento, gasto previdenciário e primário (RGPS a ~6% do PIB em 2060, projeção das autoridades via FMI). Há dado de nível, mas não elasticidade nem laço de retorno com evidência.
- **`doenca-holandesa`**: Commodities, câmbio e indústria. A armadilha está listada em potenciais_brasil.json, mas nenhuma fonte conferida desmente ou confirma o laço.
- **`informalidade-produtividade-arrecadacao`**: Informalidade (>40% dos ocupados, FMI), baixa produtividade e baixa arrecadação. Sem estimativa causal conferida.
- **`crime-organizado-infiltracao-estado`**: Crime organizado, financiamento ilegal e infiltração em cadeias econômicas (combustíveis, ouro). O repositório lista áreas de custo, mas as fontes do laço político não foram lidas.
- **`federativo-estados-divida`**: Estados endividados, regime de recuperação fiscal e investimento subnacional: sem evidência coletada.
- **`polarizacao-plataformas-digitais`**: Polarização, plataformas digitais e desconfiança: não há dado no repositório, e a literatura não foi aberta.
- **`saude-produtividade`**: Saúde (SUS), produtividade e demanda por gasto: o repositório tem indicadores (mortalidade infantil, epidemias) mas nenhuma relação com produtividade.
- **`data-centers-energia-tarifa`**: Data centers de IA, demanda de energia e tarifas (Jevons). Há número da IEA (resumo, não verificado); sem estimativa para o Brasil.
- **`desigualdade-racial-capital-humano`**: Desigualdade racial de renda e capital humano: o dado de renda por cor não foi coletado (lacuna declarada em potenciais_brasil.json).
- **`credito-publico-subsidio-divida`**: Bancos públicos, crédito subsidiado e dívida pública (equalização): as decisões existem no catálogo, mas o laço (subsídio, concentração, custo fiscal) não tem evidência conferida aqui, só o efeito fiscal em deltas.

## Arestas contestadas (onde a literatura diverge ou o sinal depende de juízo)

- **1. Juro real (Selic - IPCA) → Crescimento do PIB.** g = 2,0 + ... - g_rate*(real - 5,0), com g_rate = 0,30. É um parâmetro de calibração do projeto e não foi estimado em microdados. A relação entre dívida alta e crescimento é contestada (Reinhart-Rogoff vs. Herndon et al.).
- **2. Inflação de longo prazo esperada → Selic.** A inflação entra duas vezes na Selic: 1 para 1 em neutral_real + pi, e 0,5 pela regra de Taylor. A Selic nominal sobe 1,5 pp por pp de inflação (cálculo nosso).
- **2. Selic → Dívida bruta/PIB.** No modelo, mais Selic eleva a dívida, mas mais inflação a reduz pelo denominador nominal. Execução ilustrativa: bc_erosion de 0 para 0,4 sobe a Selic de 2038 de 17,11% para 18,58% e o IPCA de 4,43% para 5,60%, e a dívida cai de 135,7% para 134,8% (sim_ilus). Ou seja, o laço de expectativas NÃO se mostra reforçador na dívida dentro do modelo. Blanchard (2004) argumenta que, com dívida alta e passivos em moeda estrangeira, apertar pode piorar a inflação por depreciação, canal ausente do modelo.
- **2. Independência do BC (alavanca bc_erosion) → Inflação de longo prazo esperada.** Alavanca exógena bc_erosion (0-1) multiplicada por pi_bc = 3,0 pp. A literatura sobre independência do BC (Alesina e Summers; DOI conferido, conteúdo não lido) é cross-country e debate causalidade. Decisões do catálogo mudam a alavanca: reduzir-autonomia-bc +0,4, diretoria-bc-alinhada +0,15.
- **3. Dívida bruta/PIB → Reação fiscal (ajuste do primário).** react = reaction*(0,3 + 0,7*credibilidade)*clip(d - 80, -10, 40), reaction = 0,14. Com d = 100 e credibilidade 0,5, react = 1,8 pp. Bohn (1998) é o referencial teórico (DOI conferido, conteúdo não lido); Ghosh et al. (2013) tratam de fadiga fiscal, em que a reação se esgota em dívida alta. O parâmetro 0,14 é de calibração, não estimativa brasileira com intervalo.
- **4. Prêmio de risco → Custo político de gastar sem regra.** Hipótese: depois dos estresses de 2015-16 vieram a EC 95/2016 e depois a LC 200/2023. A sequência é temporal e não identifica causalidade (houve também mudança de governo). Não há estimativa do custo político.
- **5. Influência política (financiamento, lobby, emendas) → Regras, benefícios e contratos favoráveis.** Há mecanismos documentados de poder do Congresso sobre o orçamento (RP9 declarado inconstitucional por 6 a 5; migração do volume para emendas individuais, de bancada, de comissão e transferências especiais). O tamanho dos gastos tributários (R$ 612,84 bi em 2026, 4,43% do PIB) mede renúncia, e a RFB e o repositório ressaltam que parte é desenho do regime, não abuso. Ligar o tamanho à captura é hipótese.
- **5. Renda extraordinária e vantagem competitiva → Concentração de renda e de mercado.** Acemoglu e Robinson descrevem instituições extrativas que perpetuam elites; a evidência brasileira específica sobre o laço fechado (renda captada que volta a concentrar) não foi encontrada nesta rodada.
- **6. Impunidade percebida → Desconfiança e polarização.** O IPC 2025 do Brasil é 35/100, medida de percepção, não de impunidade real. Fisman e Miguel mostram que a tolerância à corrupção depende de normas (modelo no repositório). Percepção e impunidade real não são a mesma coisa; a causalidade percepção -> desconfiança política é contestada.
- **6. Desconfiança e polarização → Custo político de romper regras.** Hipótese: eleitores polarizados toleram violações de regras do lado de quem apoiam (Svolik 2019, DOI conferido, conteúdo de memória). Não há medida brasileira do 'custo político' no repositório.
- **6. Custo político de romper regras → Erosão institucional (alavanca institutional_risk).** Bermeo e Levitsky-Ziblatt descrevem erosão gradual por meios legais. No catálogo, as decisões institucionais mexem na alavanca (ampliar-stf +0,25; remover-ministros-stf +0,30; anistia-politica +0,08). Os eventos de 2023-2025 mostram também resposta institucional (condenação em 2025), que é o laço balanceador, não o reforçador.
- **6. Erosão institucional (alavanca institutional_risk) → Impunidade percebida.** Mudanças como a Lei 14.230/2021 (dolo específico na improbidade) e as anulações da Lava Jato (2021) são lidas por uns como correção de abuso e por outros como enfraquecimento do controle: a leitura é contestada e depende de juízo normativo.
- **7. Chuva regional na estação seca → Produtividade agropecuária.** A relação regional em Leite-Filho et al. conflita com a ausência de sinal na série nacional do repositório (r = -0,07; IC95 -0,40 a 0,40). A divergência é de escala e de poder estatístico: o repositório declara que a média nacional não representa o ano agrícola regional.
- **7. Renda por hectare → Pressão por abrir área nova.** Se a renda por hectare cai, o produtor pode compensar abrindo mais terra (sinal -, anel reforçador) ou reduzir o investimento em expansão (sinal +, o anel viraria balanceador). Cohn et al. (2014) modelam que intensificar pode poupar terra; de Assis Costa et al. (2026, só o título foi lido) falam em paradoxo de Jevons. Assunção et al. mostram que o desmatamento respondeu aos preços agrícolas. A literatura diverge.
- **7. Chuva regional na estação seca → Focos de calor na Amazônia.** ENSO tende a antecipar menos chuva e mais fogo na Amazônia com 1 ano de defasagem (r = +0,48, 1 teste em 36, n = 23); os focos também seguem fiscalização.
- **8. Gasto de resposta e recuperação → Recursos para prevenção e adaptação.** Gasto federal 2013-2022: 31% em prevenção e 69% em resposta (TCU); CNseg dá razão resposta/prevenção de 9,7 em 2019-2024; as razões não se reconciliam. Healy e Malhotra: nos EUA, eleitores premiam o socorro, não a preparação, o que desloca o orçamento para a resposta (evidência de outro país).
- **8. Dano por evento extremo → Prêmio de risco soberano.** Klusak et al. simulam rebaixamentos soberanos por clima para 109 países a partir de 2030; não é estimativa do Brasil. No modelo, climate_premium é suposição (0,1/0,3/0,6 pp).
- **8. Dano por evento extremo → CMO e tarifa de energia.** Menos afluência significa maior CMO (r = -0,50; ENA do Sudeste vs. CMO do Sudeste, n = 21). A relação com o IPCA de energia não é distinguível de zero (tarifa depende de bandeiras, reajustes e tributos). A crise de 2021 mostra o contexto, não o efeito causal.
- **9. Capital humano e aprendizagem → Renda do trabalho de baixa renda.** Hanushek e Woessmann ligam habilidades cognitivas e resultados econômicos (título lido; a causalidade é discutida). A informalidade >40% (FMI) dilui o retorno à qualificação (hipótese).
- **9. Arrecadação e espaço fiscal → Acesso a educação de qualidade.** Rigidez do gasto obrigatório e vinculação limitam a capacidade de expandir educação (barreira citada em capital-humano-gap).
- **10. Difusão tecnológica → PIB potencial (tech_boost).** tech_boost = tech_productivity * (S(ano - lag) - S0)/(1 - S0), com S logística (tech_midpoint 2031; tech_rate 0,8). tech_productivity é SUPOSIÇÃO explícita. Acemoglu estima ≤ 0,66% de PTF em 10 anos nos EUA (resumo), limite conservador de referência.
- **11. Incentivo à automação (IA, robôs) → Deslocamento de tarefas.** 29,6% dos ocupados com alguma exposição (FGV IBRE) e ~5,2 milhões na mais alta; efeito detectado concentrado em jovens de 18 a 29 anos nos dados de 2022-2025; FMI: nas avançadas, metade dos expostos tende a ganhar. Exposição não é desemprego.
- **11. Deslocamento de tarefas → Demanda por trabalho e salários.** Displacement effect, contrabalançado por reinstatement. O sinal líquido depende da criação de novas tarefas e é a divergência central da literatura.
- **11. Deslocamento de tarefas → Novas tarefas.** Novas tarefas criadas por tecnologia amortecem o efeito líquido; sem medida brasileira.
- **12. Alternativas lícitas de renda → Recrutamento por facções.** Becker: o crime responde a retornos e punição (DOI conferido no repositório). Evidência brasileira específica sobre renda lícita e recrutamento não foi lida nesta rodada. A queda de 30,2% na taxa de homicídio de jovens entre 2017 e 2023 mostra que o nível pode mudar rápido por outras causas (arranjos entre facções, policiamento).
- **13. Resposta pública (fiscalização, homologação, rastreio do ouro) → Proteção efetiva do território.** BenYishay et al. (DOI conferido; resumo não lido) tratam do reconhecimento de terras indígenas e do desmatamento. Nolte et al.: o debate sobre qual regime de proteção é mais eficaz está aberto. A capacidade de punir é limitada: autuados vs. julgados do Ibama em queda e arrecadação de ~5% das multas (não verificado).
- **13. Proteção efetiva do território → Pressão de invasão, garimpo e grilagem.** O efeito pode ser desfeito por mudanças de regra: conflito Legislativo x STF sobre o marco temporal (a decisão de 2026 só consta em síntese jornalística).
- **14. Custo esperado (eleitoral, penal, administrativo) → Irregularidade e corrupção.** Avis, Ferraz e Finan (DOI no repositório) mostram menor corrupção em municípios auditados. O custo esperado é minado pela fraqueza de sanção: Ibama (autuados vs. julgados), transação tributária (57,9% voltaram a inadimplir, via imprensa), mudanças legais (Lei 14.230) e anulações da Lava Jato.

## O que ficou não verificado

- **Arestas sem nenhuma evidência verificada:** 5 de 68. Devem ser lidas como hipótese pura: 9: Desigualdade de renda e de oportunidade → Acesso a educação de qualidade; 9: Acesso a educação de qualidade → Capital humano e aprendizagem; 9: Renda do trabalho de baixa renda → Desigualdade de renda e de oportunidade; 11: Demanda por trabalho e salários → Demanda agregada das famílias; 12: Aprendizagem e permanência escolar → Alternativas lícitas de renda.
- **Referências externas:** 19 de 34 só tiveram o DOI conferido no Crossref (título, autor, ano); o conteúdo do resultado vem de memória ou do título. Lista em `aneis.json#referencias` (campo `tipo_verificacao`).
- **Evidência do repositório** herda o campo `verificado` do arquivo de origem; várias fontes oficiais retornaram 403 em rodadas anteriores (ver `docs/POTENCIAIS.md` e `docs/CUSTO_DA_CORRUPCAO.md`).
- **Defasagens**: são estimativas com base declarada (equação do modelo, defasagem do catálogo de decisões, ciclo político); nenhuma foi estimada em dados nesta rodada.
- **Forças**: qualitativas, atribuídas por julgamento a partir do desenho da evidência; não são elasticidades.
- **Estatísticas de `clima.json`** são cálculo do repositório (séries anuais curtas, IC95 por bootstrap em blocos); servem de contexto, não de efeito causal, e o repositório avisa que o desenho não tem poder para detectar efeitos regionais.

## Referências externas

| Referência | DOI | Verificado | Como foi conferida |
|---|---|:-:|---|
| [Meadows (1999), Leverage Points: Places to Intervene in a System](https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/) | - | sim | resumo ou página aberta nesta rodada |
| [Forrester (1971), Counterintuitive behavior of social systems, Technological Forecasting and Social Change](https://doi.org/10.1016/S0040-1625(71)80001-X) | 10.1016/S0040-1625(71)80001-X | sim | resumo ou página aberta nesta rodada |
| [Blanchard (2004), Fiscal Dominance and Inflation Targeting: Lessons from Brazil, NBER WP 10389](https://www.nber.org/papers/w10389) | 10.3386/w10389 | sim | resumo ou página aberta nesta rodada |
| [Bohn (1998), The Behavior of U.S. Public Debt and Deficits, QJE](https://doi.org/10.1162/003355398555793) | 10.1162/003355398555793 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Taylor (1993), Discretion versus policy rules in practice](https://doi.org/10.1016/0167-2231(93)90009-L) | 10.1016/0167-2231(93)90009-L | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Ardagna, Caselli, Lane (2007), Fiscal Discipline and the Cost of Public Debt Service](https://doi.org/10.2202/1935-1690.1417) | 10.2202/1935-1690.1417 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Alesina e Summers (1993), Central Bank Independence and Macroeconomic Performance, JMCB](https://doi.org/10.2307/2077833) | 10.2307/2077833 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Ghosh et al. (2013), Fiscal Fatigue, Fiscal Space and Debt Sustainability in Advanced Economies, Economic Journal](https://doi.org/10.1111/ecoj.12010) | 10.1111/ecoj.12010 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Herndon, Ash, Pollin (2014), Does high public debt consistently stifle economic growth?, Cambridge Journal of Economics](https://doi.org/10.1093/cje/bet075) | 10.1093/cje/bet075 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Ferraz e Finan (2008), Exposing Corrupt Politicians, QJE](https://doi.org/10.1162/qjec.2008.123.2.703) | 10.1162/qjec.2008.123.2.703 | sim | resumo ou página aberta nesta rodada |
| [Ferraz e Finan (2011), Electoral Accountability and Corruption, AER](https://doi.org/10.1257/aer.101.4.1274) | 10.1257/aer.101.4.1274 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Besley e Burgess (2002), The Political Economy of Government Responsiveness, QJE](https://doi.org/10.1162/003355302320935061) | 10.1162/003355302320935061 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Boas, Hidalgo, Richardson (2014), The Spoils of Victory, Journal of Politics](https://doi.org/10.1017/s002238161300145x) | 10.1017/s002238161300145x | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Healy e Malhotra (2009), Myopic Voters and Natural Disaster Policy, APSR](https://doi.org/10.1017/S0003055409990104) | 10.1017/S0003055409990104 | sim | resumo ou página aberta nesta rodada |
| [Monteiro e Rocha (2017), Drug Battles and School Achievement, Review of Economics and Statistics](https://doi.org/10.1162/REST_a_00628) | 10.1162/REST_a_00628 | sim | resumo ou página aberta nesta rodada |
| [Assunção, Gandour, Rocha, Rocha (2020), The Effect of Rural Credit on Deforestation, Economic Journal](https://doi.org/10.1093/ej/uez060) | 10.1093/ej/uez060 | sim | resumo ou página aberta nesta rodada |
| [Assunção, Gandour, Rocha (2015), Deforestation slowdown in the Brazilian Amazon: prices or policies?, Environment and Development Economics](https://doi.org/10.1017/s1355770x15000078) | 10.1017/s1355770x15000078 | sim | resumo ou página aberta nesta rodada |
| [Leite-Filho et al. (2021), Deforestation reduces rainfall and agricultural revenues in the Brazilian Amazon, Nature Communications](https://doi.org/10.1038/s41467-021-22840-7) | 10.1038/s41467-021-22840-7 | sim | resumo ou página aberta nesta rodada |
| [Staal et al. (2020), Hysteresis of tropical forests in the 21st century, Nature Communications](https://doi.org/10.1038/s41467-020-18728-7) | 10.1038/s41467-020-18728-7 | sim | resumo ou página aberta nesta rodada |
| [Spracklen, Arnold, Taylor (2012), Observations of increased tropical rainfall preceded by air passage over forests, Nature](https://doi.org/10.1038/nature11390) | 10.1038/nature11390 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Nobre et al. (2016), Land-use and climate change risks in the Amazon, PNAS](https://doi.org/10.1073/pnas.1605516113) | 10.1073/pnas.1605516113 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Nepstad et al. (2014), Slowing Amazon deforestation through public policy and interventions in beef and soy supply chains, Science](https://doi.org/10.1126/science.1248525) | 10.1126/science.1248525 | sim | resumo ou página aberta nesta rodada |
| [BenYishay et al. (2017), Indigenous land rights and deforestation, JEEM](https://doi.org/10.1016/j.jeem.2017.07.008) | 10.1016/j.jeem.2017.07.008 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Nolte et al. (2013), Governance regime and location influence avoided deforestation success of protected areas, PNAS](https://doi.org/10.1073/pnas.1214786110) | 10.1073/pnas.1214786110 | sim | resumo ou página aberta nesta rodada |
| [Cohn et al. (2014), Cattle ranching intensification in Brazil can reduce global GHG emissions by sparing land from deforestation, PNAS](https://doi.org/10.1073/pnas.1307163111) | 10.1073/pnas.1307163111 | sim | resumo ou página aberta nesta rodada |
| [de Assis Costa et al. (2026), Agricultural intensification increases rather than reduces pressure on the Amazon Forest, Land Use Policy](https://doi.org/10.1016/j.landusepol.2025.107842) | 10.1016/j.landusepol.2025.107842 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Barona et al. (2010), The role of pasture and soybean in deforestation of the Brazilian Amazon, Environmental Research Letters](https://doi.org/10.1088/1748-9326/5/2/024002) | 10.1088/1748-9326/5/2/024002 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Klusak et al. (2023), Rising Temperatures, Falling Ratings, Management Science](https://doi.org/10.1287/mnsc.2023.4869) | 10.1287/mnsc.2023.4869 | sim | resumo ou página aberta nesta rodada |
| [Acemoglu e Restrepo (2019), Automation and New Tasks, JEP](https://doi.org/10.1257/jep.33.2.3) | 10.1257/jep.33.2.3 | sim | resumo ou página aberta nesta rodada |
| [Galor e Zeira (1993), Income Distribution and Macroeconomics, Review of Economic Studies](https://doi.org/10.2307/2297811) | 10.2307/2297811 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Hanushek e Woessmann (2012), Do better schools lead to more growth?, Journal of Economic Growth](https://doi.org/10.1007/s10887-012-9081-x) | 10.1007/s10887-012-9081-x | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Barro (2000), Inequality and Growth in a Panel of Countries, Journal of Economic Growth](https://doi.org/10.1023/A:1009850119329) | 10.1023/A:1009850119329 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Bourguignon, Ferreira, Menéndez (2007), Inequality of Opportunity in Brazil, Review of Income and Wealth](https://doi.org/10.1111/j.1475-4991.2007.00247.x) | 10.1111/j.1475-4991.2007.00247.x | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |
| [Svolik (2019), Polarization versus Democracy, Journal of Democracy](https://doi.org/10.1353/jod.2019.0039) | 10.1353/jod.2019.0039 | não | DOI conferido no Crossref (título, autor, ano); conteúdo do resultado não lido ou de memória |

Evidências internas citam o id do arquivo do repositório: `historia.json`, `custo_corrupcao.json`, `clima.json`, `clima_valor_financeiro.json`, `potenciais_brasil.json`, `fator_humano.json`, `leis_tecnologicas.json`, `futuros.json` e `economia_historica.json`; os deltas das alavancas vêm de `decisoes.json`.

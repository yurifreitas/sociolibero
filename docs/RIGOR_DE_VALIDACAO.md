# Regras duras de rigor (herdadas do projeto ADIA/CrunchDAO)

O projeto irmão `adia` (detecção de quebras estruturais em tempo real) acumulou meses de tentativas e falsificações.
Daí saíram regras que valem para qualquer análise deste repositório. Cada uma aponta onde já se aplica e onde ainda falta.

| # | Regra aprendida | Por quê (evidência no adia) | Onde se aplica aqui | Estado |
|---|---|---|---|---|
| 1 | **A régua local mente: assuma que o holdout superestima** | holdout local ~+0,013 acima do placar; levers pequenos superestimados ~50× | Backtest macro (`calibrate.py`): a calibração melhorou o treino e piorou o teste (5,66 vs 3,24) | aplicado |
| 2 | **Divida por grupo, não ao acaso (leave-group-out)** | CV aleatório vs por comunidade mudava o resultado | Eleições: validar detectores deixando UFs/regiões de fora; macro: validar deixando períodos inteiros de fora | **falta** nas eleições |
| 3 | **Fingerprint do vazamento do futuro**: se um probe "bate o líder" por muito, desconfie até a versão causal provar | uma estatística sobre a janela inteira parecia +0,028 e era vazamento (3×) | `rho_z` usa o z empírico nacional de todos os municípios; séries normalizadas pela amostra toda; limiares escolhidos vendo os dados | **revisar** |
| 4 | **Mínimo de 3 splits para aceitar um ganho** | a regra pegou ~4 falsos positivos | Calibração do macro e qualquer ajuste de limiar de fraude | **falta** |
| 5 | **Meça o piso de ruído antes de comparar** (variância de semente) | ruído irredutível ~0,01 maior que metade do gap | Bootstrap das curvas (`tecnologia.py`) e do cruzamento voto×território | parcial |
| 6 | **Valide o nulo primeiro** | calibração empírica > fórmula analítica (astrofísica: σ analítico não é calibrado) | Forense eleitoral: FPR sob nulo e fração com p<0,05 ≈ 5% em dados reais | aplicado |
| 7 | **Oráculo com a resposta conhecida dá o teto** | oráculo com τ conhecido ≈ 0,64: o teto informacional | Validação sintética dos detectores eleitorais (fraude conhecida) | aplicado |
| 8 | **Cada detector precisa de um modo de falha declarado** | o sinal e o falso alarme eram a mesma coisa (paradoxo 2) | `docs/METHODS.md §4`: cada teste diz o que NÃO enxerga | aplicado |
| 9 | **Mantenha um cemitério do que falhou** | evita repropor o que já foi falsificado | `docs/QUEBRAS_ESTRUTURAIS.md` (cemitério) e a calibração do macro que não melhorou o teste | em andamento |
| 10 | **Mais dados nem sempre ajudam; cheque a restrição real** | 100% sintético infinito não ajudou: a restrição era a informação por série | Séries históricas curtas: mais anos de história ≠ mais informação sobre o regime atual | nota |

## Como usar esta tabela
Antes de aceitar um resultado novo (um detector, um parâmetro, uma correlação): passe pelas linhas 1–4. Se o ganho for menor que o piso de ruído (linha 5), registre como **não distinguível de zero** em vez de uma melhora.

## Lacunas que esta leitura abriu (viram propostas)
1. Refazer a validação dos detectores eleitorais com **leave-UF-out** e ≥ 3 splits (regras 2 e 4).
2. Auditar o uso de estatísticas globais (z nacional, normalização por amostra completa) contra vazamento (regra 3).
3. Manter um registro versionado de hipóteses **falsificadas** neste repositório (regra 9).

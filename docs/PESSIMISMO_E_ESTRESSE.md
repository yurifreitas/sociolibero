# Pessimismo e estresse: cenários de risco, não previsões

Saída: `web/public/data/pessimismo.json` (`uv run sociolibero pessimismo build`, ~25 s). Código: `src/sociolibero/pessimismo.py`; testes: `tests/test_pessimismo.py`.
O módulo **não altera** `economy.py`, `decisoes.py` nem `scenarios.py`; usa a base macro offline `data.FALLBACK` (dívida 82,86%, Selic 13,5%) para ser reproduzível.

> **Aviso central.** Tudo aqui é *cenário de risco*: o que o modelo reduzido diz quando premissas pessimistas se juntam. Nenhum número tem probabilidade real de ocorrer. As probabilidades de ruptura abaixo são **frações de trajetórias simuladas** sob premissas escolhidas por nós, não chances do mundo real.

## Como ler um teste de estresse

1. **Há sempre uma linha de base.** O estresse é a *diferença* entre linha de base e cenário adverso. Se a linha de base já está quebrada, o choque não acrescenta informação do mesmo tipo. Aqui, `hegemonia` já rompe sem nenhum choque adicional (dívida/PIB 2035 central de 142%, P(ruptura) ≈ 100%), e `lula` também (127%).
2. **Severidade é escolha, não estimativa.** Credibilidade -0,40, BC +0,30, risco institucional +0,45, clima 0,6/0,6, eficiência 0,6 são níveis "ruins mas concebíveis" escolhidos por nós. Mudar o nível muda o resultado quase proporcionalmente.
3. **Ruptura é limiar de modelo.** Dívida bruta > 120% do PIB (`scenarios.BREAK_DEBT`). Depois dele o modelo perde a validade: Selic de 96%, PIB de -20% ao ano e dívida de 900% (hegemonia adversa, 2038) são **artefatos da extrapolação**. O JSON marca `valido_como_trajetoria=false` quando mais da metade das trajetórias já cruzou o limiar; esses níveis não devem ser citados.
4. **p10/p50/p90 medem incerteza de choques e de juro neutro**, não incerteza de modelo nem de severidade. A banda é estreita demais para o que se sabe.
5. **Compare com o piso de ruído.** O p50 da dívida 2035 varia ±0,3 pp entre 5 sementes; diferença menor que 2× isso é "não distinguível de zero" (regra 5 de `RIGOR_DE_VALIDACAO.md`).
6. **Reverse stress** responde "o que basta para quebrar?", e a resposta depende da grade de níveis e do custo escolhido para somar choques.

## O que não é previsão

- Não é a probabilidade de a dívida passar de 120%. É a fração de 10 mil trajetórias que passam, dado o choque imposto.
- Não é uma afirmação sobre qualquer pessoa ou instituição. O bloco judicial descreve um **mecanismo** (vaga + filtro do Senado + perfil do indicado → risco institucional), com perfis hipotéticos do repositório; "vaga capturada" é definição operacional (indicado aprovado com controvérsia ≥ 0,5), não acusação.
- Não é um ranking de qualidade das decisões. A fragilidade mede **quanto do benefício some com má execução**, num modelo que já trata os deltas como julgamento.
- Não tem pesos: os cenários não são ponderados entre si (como o `mix` de `scenarios.py`).

## 1. Eficiência de execução (incompetência como taxa)

`execution_efficiency` ∈ [0,1] multiplica os deltas que **melhoram** (`supply_reform>0`, `fiscal_credibility>0`, `primary_target>0`, `institutional_risk<0`, `bc_erosion<0`); os que **pioram** ficam integrais. Padrão 1,0 reproduz exatamente os resultados atuais (teste de regressão; a alavanca vive em `pessimismo.py`, `Levers` não mudou).

**A eficiência não é medida.** Âncoras de proxy do repositório (`custo_corrupcao.json`): 59% das obras federais não estavam paralisadas em 2023 (8.603 de 21.007 paradas, TCU, verificado), 49% em 2025 (11.469 de 22.621, verificado) e 67% de execução dos valores empenhados em emendas de 2025 (fonte secundária, não verificada). Faixa de proxies 0,49-0,67; central pessimista 0,6; a varredura vai de 1,0 a 0,4. Essas proxies medem execução física/orçamentária de parte do gasto federal, não a eficiência de reformas legais. `visoes_pessimistas.json` não existia; se aparecer, o código o reconhece (`meta`), mas hoje não o usa.

**Resultado (dívida/PIB 2035, vs. pragmático, determinístico).** Perda do benefício com 60% e 40% de eficiência:

| Posto | Decisão | Perda a 60% | Perda a 40% | Primário perdido a 40% | Classe |
|---|---|---:|---:|---:|---|
| 1 | Reforçar o arcabouço | 5,5 pp | 8,5 pp | R$ 91 bi/ano | alta perda, segue positiva |
| 2 | Desvincular mínimo/pisos | 3,7 pp | 5,6 pp | R$ 61 bi/ano | alta perda, segue positiva |
| 3 | Nova reforma da Previdência | 3,4 pp | 5,2 pp | R$ 53 bi/ano | alta perda, segue positiva |
| 4 | Cortar gastos tributários | 2,6 pp | 3,9 pp | R$ 46 bi/ano | alta perda, segue positiva |
| 5 | Reforma administrativa | 1,5 pp | 2,3 pp | R$ 31 bi/ano | alta perda, segue positiva |
| 6-7 | IBS/CBS; privatizações | 1,0; 0,9 pp | 1,5; 1,4 pp | 0; R$ 15 bi/ano | alta perda, segue positiva |

- **Leitura.** As reformas fiscais são as mais frágeis em valor absoluto porque têm mais benefício a perder. Mas **nenhuma delas vira prejuízo** até 40%: é a medida de *quanto do ganho evapora*, não de se vale a pena.
- **Viram prejuízo na faixa varrida** (ponto de virada > 0,4): minerais críticos (≈ 0,69), combate ao garimpo/rastreio do ouro (≈ 0,63) e homologação de terras indígenas/quilombos (≈ 0,95). Todas têm benefício pequeno (via risco institucional) e custo fiscal integral: com execução fraca, ficam só com o custo.
- **Robustas** (perda < 1 pp a 40% e segue positiva): abertura comercial, acordo Mercosul–UE, consulta prévia e Comissário das gerações futuras. Atenção: robustas aqui significa **pouco a perder**; seus benefícios são pequenos (0,5-1,1 pp).
- **Sem benefício a perder** (9): só custo no catálogo (flexibilizar o arcabouço, assistência, perdão de dívidas, redução da autonomia do BC, decisões institucionais). A má execução não as piora por esse mecanismo, mas a variante `sobrecusto` mostra que na prática o custo também pode crescer.
- **Líquido negativo mesmo com execução perfeita** (7): o modelo aplica o custo fiscal desde o 1º ano e o ganho de oferta só aparece como crescimento; em 2035 o saldo na dívida já é negativo (educação, saneamento, pastagens, política industrial verde). É o limite de `defasagem_anos` ignorada, não um julgamento sobre a decisão.
- **Sensibilidade.** O ranking é idêntico entre 60% e 80% (tau de Kendall 1,0, esperado: o modelo é quase linear na eficiência) e estável entre horizontes (tau 0,85 em 2030; 0,96 em 2038) e a `neutral_real` 3,5/5,5 (tau 0,98/0,97); o top-5 é o mesmo em todas as variantes. Na variante `sobrecusto=0,5` o tau cai a 0,57 (muda a cauda; o top-5 é o mesmo). A varredura é determinística: não há ruído amostral, só erro de especificação.
- **No cenário pragmático inteiro** (eficiência 0,6 sobre o esforço de primário e de oferta): +3,3 pp de dívida/PIB 2035 sozinha, monotônico em 1,0 → 0,8 → 0,6 → 0,4 (101,2 → 102,8 → 104,5 → 106,1).

## 2. Vazamento e desperdício como choque

Desvio de referência `corrupcao.py`: 1,84% do PIB/ano (FIESP/Decomtec, extrapolação de percepção, `verificado=false`; faixa 1,38-2,3%), R$ 234 bi/ano na âncora de PIB de R$ 12.700 bi. **Suposições rotuladas:** (i) só 10/25/50% do desvio viram primário federal a menos; (ii) "desperdício por ineficiência" de 0,5/1,0/1,5% do PIB (sem medida aberta); (iii) cada pp perdido reduz a oferta em 0/0,10/0,27 pp/ano (teto ancorado em Mauro, 1995, correlação cross-country; central 0,10).

| Choque (sobre o pragmático) | Primário efetivo | Δ dívida 2035 (pareado) | P(ruptura em algum ano) |
|---|---:|---:|---:|
| referência | - | 101,5% (p50) | 2% |
| corrupção, 10% do desvio | -0,18 pp (R$ 23 bi) | +1,6 pp | 5% |
| corrupção, 25% do desvio | -0,46 pp (R$ 58 bi) | +4,1 pp | 14% |
| corrupção, 50% do desvio | -0,92 pp (R$ 117 bi) | +8,2 pp | 40% |
| desperdício 0,5 / 1,0 / 1,5% do PIB | -0,5 / -1,0 / -1,5 pp | +4,4 / +9,0 / +13,6 pp | 16% / 45% / 77% |
| ambos, central (25% + 1,0%) | -1,46 pp (R$ 185 bi) | +13,2 pp | 74% |
| ambos, alto (50% do 2,3% + 1,5%) | -2,65 pp (R$ 337 bi) | +26,5 pp | 100% |

A perda de oferta importa pouco no central: de 0 a 0,27 pp/ano, o Δ vai de +12,6 a +14,2 pp. O efeito aritmético acumulado seria maior; a regra de reação fiscal do modelo (Bohn) compensa parte, e o modelo é otimista nisso (custo político zero).

## 3. Cenário adverso composto e reverse stress

Choque (sobre `pragmatico` e `hegemonia`): credibilidade fiscal -0,40 (piso 0,05), erosão do BC +0,30, risco institucional +0,45, clima severo (`climate_shock` 0,6 e `climate_premium` 0,6, o "severo" de `clima/macro.py`), eficiência 0,6, tecnologia 0. 5 sementes × 2.000 trajetórias. Mediana [p10-p90]:

| | 2030 dívida | 2035 dívida | 2038 dívida | Selic 2035 | IPCA 2035 | PIB 2035 (a.a.) |
|---|---|---|---|---|---|---|
| pragmático, linha de base | 94 [91-97] | 101 [95-108] | 106 [97-115] | 11,4 | 3,4 | +1,2 |
| pragmático, adverso | 106 [103-110] | 157 [144-173] ⚠ | 248 ⚠ | 21,5 | 6,1 | -2,4 |
| hegemonia, linha de base | 102 [99-105] | 142 [131-155] ⚠ | 202 ⚠ | 19,9 | 5,9 | -0,9 |
| hegemonia, adverso | 114 [111-118] | 249 ⚠ | 903 ⚠ | 38,6 | 10,7 | -6,3 |

⚠ = mais da metade das trajetórias já passou de 120%: nível é artefato (o JSON traz Selic, IPCA, PIB e nível do PIB com p10/p50/p90 para os três anos). **O único trecho confiável do adverso é até ~2030-2033.** P(ruptura em algum ano até 2038): pragmático 2% → 100%; hegemonia 100% → 100% (P(2035) 99,8% → 100%). Com vazamento (+0,96 pp de desvio) o adverso piora mais (pragmático: 175% em 2035, ⚠).

**Atribuição (pragmático, Δ dívida 2035 de cada choque sozinho):** credibilidade +17,7 pp; risco institucional +10,6; clima +6,7; eficiência +3,3; erosão do BC **-0,2**; tecnologia 0. A soma (38,8) é menor que o conjunto (+56,0): os choques se amplificam (1,4×) pelo anel dívida-prêmio. A credibilidade fiscal domina; a erosão do BC não piora a dívida no modelo (a inflação corrói a dívida nominal; sem dívida indexada nem câmbio), só eleva Selic e IPCA.

**Tecnologia nula:** os cenários do repositório já têm `tech_productivity=0`, então o choque não muda nada. O custo de oportunidade aparece no contrafactual: com 0,3 pp/ano (suposição de `tecnologia.py`), a dívida 2035 do adverso cairia 2,2 pp (pragmático) e 4,0 pp (hegemonia).

**Reverse stress (pragmático, grade de 4 níveis × 6 choques = 4.096 combinações; critério dívida 2035 > 120% na trajetória central).**
- Sem choque: 101,4%. **Basta um choque**: queda da credibilidade de 0,80 para 0,35 (limiar contínuo: queda de 0,415, para 0,385) leva a 122%; confirmação estocástica: P(dívida 2035 > 120%) = 60%, ou seja, está **no limiar**, não "inevitável".
- Nenhum outro choque isolado, no nível máximo testado, rompe (clima 108%, desperdício 1,5% do PIB 115%, risco institucional +0,45 112%, eficiência 0,4 106%, BC 101%).
- Sem usar a credibilidade, a combinação mínima é risco institucional +0,30 com desvio de 1,5% do PIB (122,6%). 3.358 das 4.096 combinações rompem: **o pragmático tem pouca margem**, porque a calibração já o coloca a 101% da dívida com juros reais altos.
- `hegemonia` e `lula` já rompem sem choque (ver acima), então o reverse stress não se aplica a eles: a pergunta relevante lá é o oposto (que combinação de ações evita a ruptura).

## 4. Liderança judicial (mecanismo)

Vagas: Fux (2028), Cármen Lúcia (2029), Gilmar Mendes (2030); quórum de 41 votos no Senado. Perfis dos indicados por cenário (`scenarios.py`, julgamentos editáveis): `lula` técnico alinhado à esquerda; `pragmatico` técnico de consenso; `hegemonia` técnico aliado + 2 militantes; `extremo` 2 militantes + perfil sem trajetória jurídica (`meets_art101` 0,05). Perseguem as 4 decisões (ampliar STF, remover ministros, diretoria do BC alinhada, anistia) só `hegemonia` e `extremo` (suposição). Distribuição **exata** (enumeração de 2³×2⁴ resultados, sem Monte Carlo), com 4.000 sorteios para as probabilidades de bancada.

| Cenário | P(vagas capturadas = 0 / 1 / 2 / 3) | Risco inst. p10-p50-p90 | Dívida 2035 p50 (com canal) | Contrafactual técnico | Efeito do canal |
|---|---|---|---:|---:|---:|
| lula | 100 / 0 / 0 / 0 | 0,20-0,22-0,24 | 127,4% | 126,4% | +1,0 pp |
| pragmático | 100 / 0 / 0 / 0 | 0,18-0,195-0,195 | 102,4% | 101,4% | +1,1 pp |
| hegemonia | 56 / 38 / 6 / 0 | 0,32-0,37-0,45 | 145,5% | 142,0% | +3,5 pp |
| extremo | 56 / 38 / 7 / 0,1 | 0,50-0,56-0,63 | 175,1% | 170,9% | +4,2 pp |

- A chance de pelo menos uma vaga capturada é de ~44% em `hegemonia` e `extremo`; a de maioria (2 de 3) é de ~6-7%. O Senado barra muito: aprovação por indicado militante ≈ 25%; só a vaga de Fux entra (indicado técnico aliado, 84%).
- **O canal judicial pesa pouco frente ao resto**: +3,5 a +4,2 pp na dívida 2035; a maior parte do risco do cenário já está em `base_risk` (0,3 e 0,5), que é o julgamento do clima político, não do STF. Em `lula` e `pragmático` o "efeito" de ~+1 pp é só a regra herdada de `scenarios.effective_risk` (0,1 × controvérsia de cada indicado aprovado, inclusive técnico), não captura.
- **Sensibilidade do mapeamento risco→prêmio (SUPOSIÇÃO)**: `prem_inst` 2,5 pp por unidade, variado de ×0,5 a ×2 (e `g_inst` de ×0,5 a ×1,5). Dívida 2035 p50 em `hegemonia`: 139% (×0,5) a 160% (×2,0); em `extremo`: 162% a 203%. O efeito do canal judicial (contra o contrafactual) em `hegemonia` vai de +2,0 pp (×0,5) a +6,8 pp (×2,0), e em `extremo` de +1,8 a +8,1 pp; em `pragmático`, de +0,7 a +1,9 pp, com P(ruptura) de 1% a 18%. A ordem entre cenários não muda; os níveis mudam ~15-25% e o efeito do canal triplica: a conclusão "o canal judicial pesa pouco" depende de `prem_inst`.

## 5. Fragilidade por setor

Sem elasticidade nova: cada escore é contagem ou soma de números já registrados (perda de benefício da varredura, nº de ligações em `custo_corrupcao.json`/`clima.json`/`tecnologia.py`, Σ |delta| do catálogo). O que é **julgamento**: o mapeamento decisão→setor (`SETOR_DECISOES`), a ligação setor→área de corrupção e a leitura de qual ligação conta. Setor sem ligação registrada fica `null`, não zero.

| Choque | Mais exposto | Mais exposto exceto fiscal | Sem ligação registrada |
|---|---|---|---|
| Execução ineficiente | fiscal (16,7 pp) | infraestrutura (2,0) | nenhum |
| Vazamento (nº de áreas) | fiscal (4) | energia (3) | nenhum |
| Clima | infraestrutura, energia, agro (empate, 2 ligações) | idem | educação, segurança |
| Tecnologia nula | energia | energia | 5 setores |
| Credibilidade fiscal | fiscal | energia, agro | saúde, educação, segurança |
| Erosão do BC | fiscal | nenhum | todos os demais |
| Risco institucional | fiscal | energia | saúde, educação, infraestrutura, agro |
| Juros altos (gasto a financiar) | fiscal, por construção | agro (R$ 95 bi/ano, por crédito e perdão) | - |

Leitura: o setor **fiscal** é o mais exposto na maioria por ser o canal do modelo. Fora ele: infraestrutura à má execução, energia ao vazamento, à tecnologia e ao risco institucional, agro ao custo de juros (porque o catálogo liga ao agro crédito subsidiado e perdão de dívidas). Saúde, educação e segurança têm poucas ou nenhuma ligação registrada: **isso é ausência de dado, não evidência de robustez**.

## 6. Validação e rigor

- **Regressão:** com eficiência 1,0, `aplicar_decisao` é idêntica a `decisoes._apply` nas 30 decisões; valores dourados do baseline determinístico em 2035 (dívida 104,48%, Selic 12,14%, IPCA 3,46%, PIB 1,12%); cenário sem choque é identidade; `Levers` não ganhou campo.
- **Monotonicidade:** 30 decisões × 6 pares de eficiência, 0 violações; no cenário pragmático (choques idênticos) a mediana da dívida 2035 sobe de 101,2 a 106,1% ao cair a eficiência de 1,0 a 0,4.
- **Sementes e piso de ruído:** 5 sementes (7, 11, 13, 17, 19). Piso do p50 da dívida 2035: 0,28 pp. Efeito do adverso por semente: 55,6 a 56,2 pp (muito acima do piso). Diferenças pareadas usam os mesmos números aleatórios.
- **Nulo primeiro:** a varredura de decisões é determinística (não há semente a variar); o risco dela é erro de especificação, não amostragem.
- **Testes:** `tests/test_pessimismo.py` (19, offline, ~10 s). `--rapido` reduz só o bloco judicial.

## Cemitério (o que não funcionou)

Registrado em `cemiterio` no JSON (9 itens). Resumo: (1) "difusão tecnológica nula" como estressor é no-op (o padrão já é 0); (2) eficiência sobre benefícios *e* custos escondia a assimetria; (3) `visoes_pessimistas.json` ausente: sem âncora de eficiência medida; (4) busca contínua do limiar no reverse stress dependia de pesos arbitrários; (5) vazamento como subtração do primário realizado não cabe em `simulate` (o alvo é a alavanca e a reação compensa); (6) risco judicial variável no tempo é inviável sem alterar `economy.py`; (7) ranking só em R$ ignora ganho de oferta; (8) o critério único de exposição setorial dava escores idênticos a três choques; (9) erosão do BC não piora a dívida no modelo (artefato da estrutura).

## Limites do modelo (o que o estresse NÃO captura)

- **Sem câmbio.** Não há canal de Blanchard (desvalorização → inflação → Selic → dívida) nem passivo em moeda estrangeira. O canal clássico de crise de balanço de pagamentos está fora: o teste **subestima** ruptura por câmbio.
- **Sem dívida indexada.** Toda a dívida é nominal com custo `0,8 × Selic`; inflação maior **corrói** a dívida no modelo, quando na prática parte é indexada ao IPCA e à Selic. Por isso a erosão do BC não piora a dívida aqui e a desancoragem fica subestimada.
- **Defasagem.** `defasagem_anos` das decisões é ignorada (custo e ganho desde o 1º ano) e o risco do STF entra constante desde 2027, embora as vagas só abram em 2028-2030. Benefícios tardios são subestimados; custos judiciais iniciais, superestimados.
- **Reação fiscal ideal.** O primário reage à dívida (> 80%) sem custo político nem fadiga: em estresse real essa reação pode falhar (o modelo é otimista aqui) ou vir como ajuste desordenado (não modelado). Não há default, reestruturação nem repressão financeira.
- **Parâmetros de calibração, não elasticidades:** `prem_inst`, `g_inst`, `prem_debt` etc. não têm intervalo e a calibração não melhorou o teste fora da amostra.
- **Eficiência, severidade, vazamento, desperdício e perda de oferta são suposições** (ver cada seção); a incerteza sobre elas não entra nos p10/p90.
- **Não há emprego, distribuição, saúde ou efeitos sociais**; só dívida, juros, inflação e PIB. A "fragilidade setorial" é leitura de ligações, não impacto setorial simulado.
- **Clima:** 0,6 pp/ano de PIB e 0,6 pp de prêmio, constantes por 12 anos, são hipotéticos; os dados históricos do repositório não identificam efeito agregado do clima no PIB (`CLIMA_E_ECONOMIA.md`).
- **Base macro offline** (`data.FALLBACK`): se dívida ou Selic iniciais mudarem, os níveis mudam e a margem do pragmático também.

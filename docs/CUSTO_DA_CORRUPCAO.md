# Custo da corrupção e decisões que beneficiam empresas, em reais

Gerado por `uv run sociolibero corrupcao build` a partir de `src/sociolibero/corrupcao_curadoria.json`; saída em
`web/public/data/custo_corrupcao.json`. Pesquisa aberta de 06/10/2026, **não é auditoria**.

**Contagem** = valor apurado em processo, auditoria, balanço ou relatório oficial. **Estimativa** = modelo ou extrapolação.
**Verif. = sim** só quando a fonte primária foi aberta e o número foi lido nela; **não** quando veio de resumo de busca
ou de imprensa que replica o órgão (revisamos para baixo todo `true` cujo link não era de órgão oficial ou periódico).
Resultado: 16 áreas, 75 valores (45 contagem, 30 estimativa; **23 verificados**),
14 itens de benefícios a empresas (7 verificados), 14 modelos.

**Âncora monetária.** PIB nominal 2025 = R$ 12.700 bi (IBGE, Contas Nacionais Anuais, divulgado em 03/03/2026; o IBGE devolveu 403 e o
valor é o arredondado da manchete, `verificado:false`). Para 2026 a Receita usa projeção de R$ 13.826,3 bi (lido no DGT). 1 pp do PIB = R$ 127 bi.

## Panorama macro

| Fonte | O que diz | Tipo | Verif. |
|---|---|---|:-:|
| FIESP/Decomtec (2010) | custo médio de 1,38% a 2,3% do PIB; R$ 41,5-69,1 bi a preços de 2008; aplicado ao PIB 2025 daria R$ 175-292 bi (cálculo nosso) | estimativa | não |
| Transparência Internacional, IPC 2025 | Brasil 35/100, 107º de 182 (34 em 2024) | percepção (não mede R$) | sim |
| FMI, Fiscal Monitor 2019 | países menos corruptos arrecadam ~4% do PIB a mais (cross-country, não é estimativa do Brasil) | estimativa | não |
| Banco Mundial (Kaufmann, 2004) | propinas globais ~US$ 1 tri/ano; citado de memória | estimativa | não |
| FGV | nenhuma estimativa com número foi lida | lacuna | não |

**Crítica metodológica.** (1) Índices de percepção medem opinião, não fluxo financeiro. (2) FIESP e FMI aplicam percentuais
internacionais ao PIB; não são apuração. (3) O que se apura em processos e acordos é fração pequena das estimativas macro e parte é
irrecuperável. (4) As fontes secundárias misturam anos-base (R$ 41,5-69,1 bi de 2008; R$ 80,3-132,8 bi em atualização; R$ 120 bi a preços de 2016).

## Tabela por área

### Sonegacao, economia subterranea e divida ativa

Producao e renda nao declaradas (economia subterranea), tributos devidos nao pagos (sonegacao) e creditos inscritos em divida ativa com baixa capacidade de recuperacao.

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 1.200,0 | – | 2020 | estimativa | não | Indice de Economia Subterranea ETCO/FGV-Ibre 2020: 17,1% do PIB (~R$ 1,2 tri); 2019: 17,3% | ETCO/FGV Ibre via Monitor Mercantil |
| 1.700,0 | – | 2022 | estimativa | não | IES ETCO/FGV mais recente localizado: 2022 = 17,8% do PIB (~R$ 1,7 tri); 2021 = 17,4% | ETCO/FGV Ibre via Contabeis |
| n/d | 500,0–627,0 | 2018 e estudos anteriores | estimativa | não | Sonegometro (Sinprofaz): sem valor 2025 verificado. Historico via busca: 2018 = R$ 626,8 bi; estudo Sinprofaz cita >R$ 500 bi/ano | Sinprofaz (via resultados de busca) |
| 3.000,0 | 2.900,0–3.000,0 | 2024-2025 | contagem | não | Estoque da Divida Ativa da Uniao (PGFN) ~ R$ 3 trilhoes (inclui previdenciario); TCU cita > R$ 2,9 tri | PGFN via IBET; TCU via O Fator |
| 2.130,0 | – | 31/12/2024 | contagem | não | Classificacao PGFN por capacidade de recuperacao (2024): A = R$ 196,7 bi (6,6%); B = R$ 696 bi; irrecuperaveis = ~R$ 2,13 tri (~70% do estoque) | IBET citando PGFN |
| 68,1 | – | 2025 | contagem | não | Recuperacao PGFN 2025: R$ 68,1 bi (recorde; +R$ 8 bi vs 2024), ~R$ 30,8 bi via transacao; LDO preve R$ 89,7 bi em 2025, 60 bi em 2026, 52,9 bi em 2027, 50,8 bi em 2028 | PGFN em Numeros 2026 (via imprensa) |
| 718,4 | – | auditoria TCU (ano nao confirmado, ~2025 | contagem | não | Auditoria TCU sobre transacao tributaria: de R$ 2,9 tri inscritos, R$ 718,41 bi entraram em negociacao; 57,9% dos que negociaram voltaram a inadimplir; ~26% dos acordos nao publicados | TCU via O Fator |

Limites: IES mede producao oculta, nao imposto sonegado; Sonegometro nao e estatistica oficial; divida ativa inclui empresas falidas/baixadas (parte irrecuperavel por natureza) e nao equivale a perda anual; nao somar com gastos tributarios. Estimativa oficial de sonegacao da Receita Federal nao localizada.


### Gastos tributarios federais

Isencoes, deducoes, aliquotas reduzidas e regimes favorecidos que reduzem a arrecadacao federal em relacao a tributacao 'normal' (conceito RFB).

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 612,8 | – | 2026 (projecao PLOA) | estimativa | sim | Gasto tributario total 2026: R$ 612,84 bi = 4,43% do PIB e 20,20% da arrecadacao administrada pela RFB (+12,56% vs DGT PLOA anterior) | Receita Federal - DGT PLOA 2026 |
| 134,3 | 120,1–134,3 | 2026 | estimativa | sim | Simples Nacional - regime especial unificado (21,91% do total) | Receita Federal - DGT PLOA 2026 Quadro X |
| 79,2 | 79,2–101,3 | 2026 | estimativa | sim | Agricultura e agroindustria (12,93%) - inclui exportacao da producao rural R$ 23,99 bi, Funrural R$ 2,76 bi, seguro rural R$ 0,81 bi, defensivos/credito presumido PIS-Cofins | Receita Federal - DGT PLOA 2026 Quadros X e III |
| 55,9 | – | 2026 | estimativa | sim | Entidades sem fins lucrativos imunes/isentas (9,13%) - inclui educacao R$ 10,44 bi e assistencia social e saude R$ 11,10 bi | Receita Federal - DGT PLOA 2026 Quadro X |
| 36,0 | 24,2–55,3 | 2026 | estimativa | sim | Zona Franca de Manaus e areas de livre comercio (5,87%) | Receita Federal - DGT PLOA 2026 Quadro X |
| 13,2 | – | 2026 | estimativa | sim | Desoneracao da folha de salarios (Lei 14.784/2023 e reoneracao gradual 2025-27) R$ 7,65 bi + desoneracao da folha dos municipios R$ 5,50 bi | Receita Federal - DGT PLOA 2026 Quadro III |
| 41,7 | – | 2026 | estimativa | sim | Deducoes IRPF: despesas medicas R$ 35,44 bi; despesas com educacao R$ 6,25 bi; total deducoes do rendimento tributavel R$ 41,69 bi | Receita Federal - DGT PLOA 2026 Quadros III e X |
| 11,3 | – | 2026 | estimativa | sim | MEI (Microempreendedor Individual) | Receita Federal - DGT PLOA 2026 Quadro X |
| 36,9 | – | 2026 | estimativa | sim | Poupanca e titulos de credito do setor imobiliario e do agronegocio (LCI/LCA/CRI/CRA) | Receita Federal - DGT PLOA 2026 Quadro X |
| 138,6 | – | 2026 | estimativa | sim | Total por tributo: COFINS 22,62% (R$ 138,6 bi), IRPJ 19,23% (R$ 117,8 bi), IRPF 17,22% (R$ 105,5 bi), Contrib. Previdenciaria 15,85% (R$ 97,1 bi) | Receita Federal - DGT PLOA 2026 Quadro VI |

Limites: Gasto tributario e estimativa de renuncia (sem contrafactual comportamental) e nao implica abuso; parte e desenho do regime. JCP nao consta como gasto tributario no DGT. LC 224/2025 (corte linear 10% de beneficios, 2026) pode alterar valores; DGT PLOA 2026 foi elaborado em ago-set/2025. Diverge de R$ 620,8 bi (4,53% PIB) citado na imprensa (nao reconciliado).


### Subsidios e encargos no setor eletrico (CDE e 'jabutis')

Conta de Desenvolvimento Energetico (CDE) financia subsidios custeados na tarifa de todos os consumidores; leis com 'jabutis' criam contratacao compulsoria/incentivos com custo na conta de luz.

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 52,7 | 47,8–52,7 | 2026 | contagem | não | Orcamento CDE 2026 proposto pela area tecnica da ANEEL (consulta publica dez/2025): R$ 52,7 bi, +7% vs 2025 homologado; R$ 47,8 bi custeados pelas tarifas | ANEEL via Cenario Energia |
| 19,6 | 16,9–19,6 | 2026 | contagem | não | CDE 2026 - descontos a fontes incentivadas (eolica/solar/biomassa/PCH): R$ 19,6 bi (2025: R$ 16,9 bi, +16%) | ANEEL via Cenario Energia |
| 10,4 | – | 2026 | contagem | não | CDE 2026 - Tarifa Social de Energia Eletrica: R$ 10,4 bi (+33%) | ANEEL via Cenario Energia |
| 6,8 | 3,6–6,8 | 2026 | contagem | não | CDE 2026 - geracao distribuida (GD, subsidio cruzado): R$ 6,8 bi (2025: R$ 3,6 bi, +87,4%) | ANEEL via Cenario Energia |
| 7,9 | – | 2025-2050 | estimativa | não | Jabutis restabelecidos em 2025 (vetos derrubados: Proinfa, 4,9 GW PCHs etc.): R$ 197 bi aos consumidores em 25 anos (~R$ 7,9 bi/ano) | Frente Nacional dos Consumidores de Energia via O Povo |
| n/d | – | ate 2050 | estimativa | não | Pacote de jabutis da lei das eolicas offshore (incl. vetos em votacao): ate R$ 348 bi na conta de luz ate 2050 (+9% no preco da energia) | Jornal de Brasilia (resultado de busca) |
| 5,03 | – | 2026 | contagem | não | TCU bloqueou cautelarmente R$ 5,03 bi destinados a reduzir reajustes tarifarios em areas Sudene/Sudam | TCU via Movimento Economico |

Limites: CDE 2026 e proposta; 'jabutis' sao estimativas de partes interessadas, acumuladas por decadas e nao anuais; nao foram localizados estudos de TCU/ANEEL/ABRADEE com numero verificavel sobre jabutis.


### Saúde / SUS

Fraude e superfaturamento em compras e convênios; aplicação irregular de emendas parlamentares na saúde; capacidade de auditoria (Denasus) reduzida.

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 0,34 | – | até jun/2025 | contagem | não | Prestações de contas de emendas de saúde analisadas pelo Denasus/MS: 698 irregulares de 1.282 (723 propostas), com mais de R$ 335 milhões repassados e cerca de R$ 66 milhões ainda em conta | Correio Braziliense, 'Dino cobra cronograma e reforço de auditorias em |
| 0,03 | – | 2025-2026 (data exata não confirmada) | contagem | não | Possível dano ao erário apontado em auditoria recente do Denasus (caso específico) | Resumo de busca (Correio Braziliense/Congresso em Foco); fonte primári |
| 6,5 | – | não especificado (baixa confiança) | contagem | não | Prejuízo ao sistema de saúde apontado por auditorias em MG, RS e DF (soma citada) | Resumo de busca (veículo não identificado) |
| 26,3 | – | 2025 | estimativa | não | Volume de emendas parlamentares no orçamento da saúde (contexto de exposição a risco): de R$ 5,7 bi (2016) para estimados R$ 26,3 bi (2025) | Resumo de busca (Correio Braziliense, jan/2026) |

Limites: LACUNAS: não obtive total apurado de CGU/TCU/CPI sobre compras na covid (busca devolveu só casos pontuais). DIVERGÊNCIA: no caso Covaxin, CGU concluiu não haver sobrepreço, embora tenha apontado ausência de análise de adequação de preço; o MP junto ao TCU pediu investigação. Nenhuma estimativa de desperdício/fraude do tipo ANS/IESS/Ibeci foi localizada com fonte identificada nesta rodada. Nenhum número foi lido em fonte primária.


### Educação / merenda / FNDE

Fraude licitatória e sobrepreço em contratos de alimentação escolar e obras de educação com recursos do FNDE; obras escolares paralisadas.

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 0 | – | investigação iniciada em 2025 (data da o | contagem | não | Contrato de merenda investigado na Operação Merenda Digna (Ilhéus/BA): valor do contrato R$ 15,5 mi; sobrepreço estimado acima de R$ 1,7 mi | Bahia Notícias (resumo de busca; nota PF) |
| n/d | – | dados até abril/2025 (painel TCU, atuali | contagem | sim | Obras de educação básica paralisadas (financiadas com recursos federais): 3.580 obras; educação e saúde somam 8.053 das 11.469 paradas | TCU, 'Metade das obras financiadas com recursos federais estão paradas |

Limites: LACUNA: não achei total consolidado de desvios do FNDE (CGU/TCU/PF) com fonte aberta. Operações PF/CGU citadas são casos pontuais, sem trânsito em julgado. Operação PF/CGU no FNDE de 2023 (Brasília e Alagoas) apareceu nas buscas sem valor lido.


### Obras e infraestrutura

Obras federais paralisadas ou inacabadas e irregularidades graves (sobrepreço, projeto deficiente) apuradas pelo TCU no Fiscobras.

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 113,7 | – | relatório de 18/10/2023 | contagem | sim | Obras com recursos federais paralisadas: 8.603 de 21.007 (41%); R$ 113,65 bi alocados na carteira | TCU, 'Brasil tem 8,6 mil obras paralisadas financiadas com recursos fe |
| n/d | – | dados até abr/2025 (atualização 30/07/20 | contagem | sim | Obras paralisadas: 11.469 de 22.621 (50,7%); 22% das 5.505 obras iniciadas entre abr/2024 e abr/2025 já paralisadas | TCU, 'Metade das obras financiadas com recursos federais estão paradas |
| 15,9 | – | 2025 | contagem | não | Valor já investido em obras hoje paradas: R$ 15,9 bi (2025) | Resumo de busca (veículo secundário) |
| 7 | – | relatório de 16/10/2024 | contagem | sim | Fiscobras 2024: 23 obras fiscalizadas, mais de R$ 7 bi de recursos fiscalizados, 17 com indício de irregularidade grave (73,9%), 1 com recomendação de paralisação (BR-040/RJ, sobrepreço) | TCU, Fiscobras 2024 |
| 5 | – | sessão de 22/10/2025 | contagem | sim | Fiscobras 2025: 25 obras, cerca de R$ 5 bi fiscalizados, 15 com indício de irregularidade grave (60%), 1 com recomendação de paralisação (BR-040/RJ) | TCU, Fiscobras 2025 |

Limites: LACUNA: não encontrei na página do TCU o valor de sobrepreço agregado por ano do Fiscobras (as notas dão só volume fiscalizado); precisaria do relatório consolidado/acórdão. Paralisação tem causas diversas além de corrupção (projeto, orçamento, gestão); não é medida de desvio. Possível divergência: o resumo de busca cita 'R$ 9 bi investidos até 2024' e 'R$ 15,9 bi' para obras paradas, sem fonte aberta para conciliar.


### Petróleo / Lava Jato

Cartel de empreiteiras e pagamento de propina em contratos da Petrobras (2004-2012); baixa contábil, acordos de colaboração e leniência, devolução de valores; depois anulações e suspensões de multas pelo STF.

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 6,19 | – | contratos 2004-2012; balanço 2014 public | estimativa | não | Baixa contábil por pagamentos indevidos (corrupção) no balanço 2014 da Petrobras: R$ 6,19 bi (propina estimada em 3% dos contratos com 27 empresas do cartel, 2004-2012) | Resumo de busca (Congresso em Foco, CartaCapital); balanço no RI da Pe |
| 4,07 | – | balanço divulgado pelo MPF (data exata n | contagem | não | Valores efetivamente restituídos via colaborações, leniências, TAC e renúncias (MPF): R$ 4,07 bi, dos quais R$ 3,02 bi destinados à Petrobras, R$ 416,5 mi à União e R$ 570 mi à redução de pedágios no PR | Jovem Pan (resumo de busca) |
| 6,17 | – | até dez/2021 | contagem | não | Petrobras: cerca de R$ 6,17 bi acumulados recuperados (leniências, repatriações e delações) até o fim de 2021, segundo a empresa | Resumo de busca (Revista Oeste, Monitor Mercantil) |
| 19,3 | 9,8–19,3 | 2015 a abr/2025 | contagem | não | Acordos de leniência da CGU (todas as empresas, não só Lava Jato): 32 acordos desde 2015, R$ 19,3 bi a devolver, R$ 9,8 bi já pagos | CGU (via resumo de busca; a página gov.br de maio/2025 devolveu 'conte |
| 18,8 | 8,5–18,8 | decisões 2023-2026 (datas exatas não con | contagem | não | Multas de leniência suspensas por decisões do ministro Dias Toffoli (STF): J&F R$ 10,3 bi (Greenfield) e Novonor R$ 8,5 bi, com renegociação autorizada para Novonor via PGR/CGU/AGU | Folha Vitória, Congresso em Foco (resumo de busca) |
| 142,6 | – | 2015 | estimativa | não | Estimativa macro (GO Associados): impacto direto e indireto da Lava Jato de R$ 142,6 bi em 2015, cerca de 2,5% do PIB, cenário descrito pela própria consultoria como relativamente pessimista | Resumo de busca (IHU Unisinos, PT, CUT); estudo original não aberto |

Limites: DIVERGÊNCIAS: (1) não encontrei o 4,4 milhões de vagas do Dieese; só ~3,5 milhões em fontes sindicais e partidárias (CUT/PT) — tratar como não confirmado. (2) Valores de recuperação variam por emissor e data (MPF R$ 4,07 bi; Petrobras R$ 6,17 bi; um título de imprensa fala em R$ 28 bi 'recuperados' segundo o MPF, que parece incluir valores previstos/comprometidos, não verificado). (3) Crítica metodológica (minha ressalva, sem fonte lida): o estudo da GO Associados é cenário contrafactual de choque, não separa recessão doméstica, queda de commodities e corte de investimento da Petrobras do efeito da operação, e não desconta o custo evitado do cartel. (4) Decisões do STF sobre leniência: status posterior a 2025 não confirmado. A página CGU de leniência exigiu autenticação; não contornei.


### Combustíveis / crime organizado

Sonegação de ICMS e tributos federais, adulteração (metanol), lavagem via fintechs e fundos de investimento, em toda a cadeia de combustíveis.

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 8,6 | – | 2020-2024 | estimativa | não | Operação Carbono Oculto (Receita/PF/MPSP, 28/08/2025): movimentação estimada de R$ 52 bi em postos, com recolhimento de tributos incompatível; perdas aos cofres de R$ 8,6 bi | Diário de Pernambuco / Poder360 (resumo de busca); comunicado do Minis |
| 46,0 | – | 2020-2024 | estimativa | não | Mesma operação: fintech que atuava como 'banco paralelo' movimentou mais de R$ 46 bi; 40 fundos de investimento com patrimônio avaliado em R$ 30 bi; bloqueio judicial superior a R$ 1 bi; 350 alvos em 8 estados | Diário de Pernambuco (resumo de busca) |
| 52,0 | – | 2017-2025 | estimativa | não | Denúncia do MPSP/Gaeco contra 16 pessoas por organização criminosa e lavagem (desvio de metanol, adulteração, 2017-2025), grupo teria movimentado cerca de R$ 52 bi; PGFN com ações cíveis bloqueando mais de R$ 1 bi | Agência Brasil / SBT News (resumo de busca) |
| 26,0 | 14,0–30,0 | valores anuais; ano-base não confirmado  | estimativa | não | Estimativa do Instituto Combustível Legal (ICL): perda anual de R$ 14 bi por sonegação e inadimplência (Sonegômetro, base FGV) mais cerca de R$ 15 bi de fraude operacional, total citado de cerca de R$ 26 bi (sem sobreposição) a... | Brazil Journal e resumos de busca; apresentação ICL na CME/Câmara |

Limites: DIVERGÊNCIA de período: Receita fala em 2020-2024 e a denúncia do MPSP em 2017-2025 para o mesmo R$ 52 bi. Movimentação financeira não é sonegação. Estimativas ICL/ETCO partem de entidades do setor. Não achei estimativa ETCO/ANP com valor lido. Nenhum valor lido diretamente na fonte primária (PDFs ilegíveis para a ferramenta).


### Previdência / INSS (descontos associativos)

Descontos mensais de mensalidades associativas em benefícios, sem autorização, via acordos de cooperação técnica entre INSS e entidades; investigado pela PF e CGU (Operação Sem Desconto, abr/2025; Indébito, mar/2026; nova fase em 27/05/2026).

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 6,3 | – | 2019-2024 | estimativa | não | Descontos de cerca de R$ 6,3 bi por entidades investigadas em benefícios de aposentados e pensionistas | O Povo, 27/05/2026 (página aberta, texto de imprensa sobre nota PF/CGU |
| 2,82 | – | posição de fim de 2025 (data exata não c | contagem | não | Ressarcimento a aposentados e pensionistas já pago: R$ 2,82 bi; 4,138 milhões de beneficiários atendidos (prazo de pedido até 14/02/2026, depois prorrogado segundo busca) | SBT News (resumo de busca) |

Limites: DIVERGÊNCIA: o total R$ 6,3 bi aparece como 2019-2024 na maioria das fontes e como mar/2020-mar/2025 em um resumo de busca. O valor é estimativa de descontos pelas entidades investigadas, não o total comprovado como ilícito; há ressarcimento maior ou menor conforme o caso. Não abri o relatório da CGU nem comunicados gov.br. O percentual recuperado dos autores não foi localizado.


### Emendas parlamentares / orçamento secreto

Emendas de relator (RP9), declaradas inconstitucionais pelo STF em dez/2022 (ADPF 850, 851, 854, 1014; 6 a 5); migração do volume para emendas individuais, de bancada, de comissão e transferências especiais ('emendas Pix'), com baixa rastreabilidade.

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 31,5 | – | 2025 | contagem | não | Emendas pagas em 2025: R$ 31,54 bi (recorde nominal), sendo individuais R$ 19,9 bi, bancada R$ 6,3 bi, comissão R$ 5,3 bi; orçamento inicial de cerca de R$ 50 bi, reduzido a cerca de R$ 48,5 bi | Diário de Pernambuco, jan/2026 (resumo de busca) |
| 61,4 | 49,9–61,4 | 2026 (previsão) | contagem | não | Emendas previstas na LOA 2026: R$ 61,4 bi; R$ 49,9 bi sob controle dos parlamentares (RP6 individuais, RP7 bancada, RP8 comissão) e R$ 11,5 bi em RP2 (programação de ministérios) | Money Times (resumo de busca) |
| 18,5 | – | não especificado na fonte (RP9 existiu e | contagem | não | Emendas de relator (RP9, 'orçamento secreto'): R$ 18,5 bi citados em resumo de busca como total das emendas de relator; STF declarou o mecanismo inconstitucional em 19/12/2022 | Conjur / Congresso em Foco (resumo de busca) |
| 22,0 | – | 2020-2024 | contagem | não | Transferências especiais ('emendas Pix'): mais de 4.300 transferências, acima de R$ 22 bi (2020-2024); o TCU informou que 81% não são rastreáveis do autor ao beneficiário final; irregularidades em 82% das auditadas, com prejuíz... | Poder360 / Revista Oeste (resumo de busca); PDF do TCU não legível pel |

Limites: LACUNAS: não calculei o % do orçamento discricionário (precisa do denominador oficial do Tesouro/SIOP); não obtive série RP9 por ano (2020-2022), nem os números da Transparência Brasil/CGU em fonte aberta. Os PDFs de Transparência Brasil e do TCU foram localizados mas não puderam ser lidos pela ferramenta. A CGU audita por determinação do ministro Flávio Dino (ADPF 854); resultados da auditoria da CGU não foram lidos. Nenhum número desta área foi lido em fonte primária.


### Licitações e cartéis

Conluio entre licitantes e contratações diretas elevam o preço pago pelo Estado; a sanção do CADE recupera fração pequena do dano.

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 0,67 | – | 2025 | contagem | sim | Contribuições pecuniárias e multas aplicadas pelo CADE (todas as condutas, inclui TCCs) em 2025; infográfico CADE em Números/Anuário: 669 R$ milhões (TCCs principais: 369 R$ milhões) | CADE - Resumo Anuário 2025 (infográfico) |
| 0,3 | – | 2025 (2024: 0,303) | contagem | não | Multas do CADE em processos administrativos julgados: 2024 R$ 303 mi; 2025 R$ 301 mi; acordos 2025 R$ 390 mi (histórico: 2021 R$ 1,3 bi; 2022 R$ 1,7 bi; 2023 R$ 144 mi); 17 casos de cartel julgados em 2024 | Mattos Filho, Retrospectiva 2025 (secundária) |
| n/d | – | Literatura 1890-2013; aplicação do TCU | estimativa | sim | Sobrepreço típico em cartéis: 10-20% (OCDE), podendo chegar a 50%; TCU adotou 17% sobre a estimativa da licitação (14,49% sobre o valor do contrato) como prejuízo mais provável em ambiente cartelizado | TCU - Cartéis, superfaturamento e a atuação do TCU |
| 151,0 | – | 2019-2023 (acumulado, ~5 anos) | contagem | não | Contratações diretas (dispensa + inexigibilidade) no governo federal: ~R$ 151 bi em 2019-2023 (480.389 de 724.580 compras homologadas, ~67% em número); 2016-2020: dispensa ~R$ 82 bi e inexigibilidade ~R$ 78 bi | Painel de Compras / resumo de busca (secundária) |
| n/d | – | 2021 | contagem | não | Compras públicas no Brasil: ~17% da despesa total do governo (OCDE); % do PIB para o Brasil não localizado em fonte lida (média América Latina e Caribe: 6,6% do PIB em 2021) | OCDE |

Limites: Sobrepreço 10-20% é média internacional, não medida para o Brasil. Não há total oficial de dano de cartel em licitações. Valor de dispensa/inexigibilidade vem de resumo de busca; abrir o Painel de Compras. Mattos Filho retornou 403. Lacuna: % do PIB das compras públicas do Brasil e volume anual de fracionamento.


### Crime ambiental: ouro, madeira e terra

Extração ilegal e lavagem via títulos minerários e DTVMs; multas ambientais pouco pagas; apropriação de terras públicas.

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| n/d | – | 2015-2020 | estimativa | sim | Ouro comercializado com indícios de ilegalidade: 228,99 t em 2015-2020 (47% da produção estimada de 487,6 t); em 2020: 42,4 t (46%) | Instituto Escolhas - Raio X do Ouro (2022) |
| n/d | – | 2021 e 2023 | estimativa | não | Ouro de 2021 com indício de ilegalidade: 52,8 t (54% do comercializado); Europa em 2023: 1,5 t de ~1,7 t importadas vinham de áreas de alto risco | Instituto Escolhas via InfoMoney (secundária) |
| 3,8 | – | 2015-2017 (aplicadas por ano) | contagem | não | Ibama: multas aplicadas ~R$ 3,8 bi/ano em média (2015-2017, ~16,6 mil autos/ano); arrecadação histórica ~5%. Reportagem sobre 5 anos: Ibama aplicou R$ 14,6 bi e arrecadou 0,6% (R$ 84 mi) | Aos Fatos (secundária) citando CGU/Ibama |
| n/d | – | 2019-2021 | contagem | sim | TCU: processos sancionadores ambientais autuados x julgados em 1a instância: 2019 14.426/13.903; 2020 9.184/2.160 (23,5%); 2021 8.931/3.294 (36,9%); desfecho de conciliação: 47% desconto à vista, 41% conversão indireta | TCU - Auditoria 038.685/2021-3 (Ac. 1973/2022) |
| 118,0 | – | Estudo de 2019 | estimativa | não | Grilagem: estudo estima perda de ~R$ 118 bi (7% do PIB) com a regularização de terras públicas griladas a preços abaixo do mercado e estímulo ao desmatamento; Pará: R$ 6,7 bi em descontos a grileiros | Imazon via IHU Unisinos / O Eco (secundária) |
| 1,02 | – | 2011-2025 | contagem | não | PF apreendeu 447,09 kg de ouro ilegal em 2025 (jan-dez) contra 100,7 kg em 2024; apreensões ligadas a garimpo desde 2011 somam ~R$ 1,02 bi | PF via Fiquem Sabendo / Correio da Manhã (secundária) |

Limites: Escolhas é estimativa por indícios, não condenação. Taxa de pagamento de multas do Ibama sem tabela primária lida (o PDF do TCU não traz taxa clara). MapBiomas: garimpo ~241 mil ha na Amazônia (2022) só por resumo de busca; área nacional não verificada. Madeira ilegal: lacuna. Valor em R$ do ouro ilegal: não extraído.


### Concessões e renegociações

Reequilíbrio, repactuação e relicitação de concessões (rodovias, aeroportos), com disputa sobre quem arca com o desequilíbrio.

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 9,3 | – | 2024 | contagem | não | Repactuação de uma concessão rodoviária federal (BR-163/MS) aprovada pelo TCU: capex R$ 9,3 bi e opex R$ 7,1 bi, prazo +10 anos (29 anos). É valor de investimento contratual, não de prejuízo | Agência Infra (secundária) citando TCU |

Limites: Lacuna importante: não obtive valor agregado de aditivos/reequilíbrios (TCU/ANTT) em fonte primária lida; o único número é de um caso e não é perda. Sem agregado, não tratar como custo da corrupção. Buscar auditorias de acompanhamento de reequilíbrios (Covid) do TCU e relatórios da ANTT.


### Fundos de pensão e lavagem de dinheiro

Investimentos temerários ou fraudulentos em fundos de estatais; lavagem via setor financeiro e fintechs.

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 6,62 | – | Relatório final, abr/2016 | contagem | sim | CPI dos Fundos de Pensão (Funcef, Postalis, Petros, Previ): prejuízo apurado R$ 6,62 bi (estimativa inicial R$ 4,26 bi); Funcef R$ 5,5 bi de rombo por negócios de risco. Indiciamentos sugeridos, sem trânsito em julgado | Câmara dos Deputados |
| 2,28 | – | 2016-2017 | contagem | sim | Operação Greenfield (PF/MPF): termos de compromisso com garantias de R$ 2,28 bi de 26 investigados em um mês; bloqueio cautelar de bens de até R$ 8 bi (103 pessoas/empresas, valor do bloqueio vem de resumo de busca); prejuízo s... | MPF - Greenfield |
| 50,0 | 40,0–70,6 | 2016-2017 | estimativa | não | Rombo/déficit dos fundos: R$ 50 bi nos quatro fundos (levantamento da Previc segundo imprensa); R$ 70,6 bi (2017, imprensa). Conceito de déficit atuarial inclui perdas de mercado e não é todo ilícito | Previc via Istoé Dinheiro (secundária) |
| 0,1 | – | 2025 | contagem | sim | Coaf: 20.548 RIFs em 2025 (18.762 em 2024; 16.411 em 2023); 786 processos sancionadores e R$ 96,9 mi em multas; base de >65 milhões de comunicações. Valor monetário = multas aplicadas | Coaf - Relatório de Gestão Integrado 2025 |
| 26,0 | – | 2020-2025 | estimativa | não | Operações Carbono Oculto/Quasar/Tank (PF, Receita, MP-SP): esquema no setor de combustíveis movimentou R$ 52 bi (2020-2024); seis fintechs movimentaram R$ 26 bi (2022-2025). Movimentação não é lucro nem dano; investigação em curso | BBC/O Povo e Money Times sobre PF/Receita (secundária) |

Limites: Estimativa de lavagem no Brasil (% do PIB) não localizada; UNODC 2-5% do PIB mundial não verificado. Divergência: prejuízo da CPI R$ 6,62 bi x déficit Previc R$ 50 bi x desvalorização de ativos R$ 113 bi (resumo de busca) são conceitos distintos. Valores de bets: sem fonte oficial encontrada. Casos sem trânsito em julgado.


### Fraude financeira no sistema (liquidações recentes)

Liquidação extrajudicial por crise de liquidez e infrações regulatórias; custo recai sobre o FGC (bancos associados) e credores.

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 40,6 | 40,6–41,3 | nov/2025 a jan/2026 | contagem | sim | FGC: total de garantias a pagar na liquidação decretada pelo BCB em 18/11/2025 (conglomerado com três instituições): R$ 40,6 bi (estimativa inicial R$ 41,3 bi); ~800 mil credores (estimativa inicial 1,6 milhão) | FGC - Comunicado ao Mercado |
| 38,4 | – | até 05/03/2026 | contagem | não | Pago pelo FGC: R$ 38,4 bi (94% do total) até 05/03/2026; liquidez do FGC de R$ 125 bi (nov/2025) | FGC (resumo de busca) |
| n/d | – | 18/11/2025 | contagem | não | BCB decretou liquidação em 18/11/2025 por grave crise de liquidez e violações regulatórias; o conglomerado detinha 0,57% dos ativos do SFN e 0,55% dos depósitos | BCB via Poder360 (secundária) |
| 12,2 | – | 2025-2026 | estimativa | não | PF/MPF (operação de 18/11/2025, investigação em curso): suspeita de venda de R$ 12,2 bi em carteiras de crédito inexistentes; bloqueio de bens ~R$ 27,7 bi; R$ 230 mi apreendidos | JB / Diário de Pernambuco sobre PF/MPF (secundária) |

Limites: Só o valor do FGC foi lido em fonte primária. Valores de PF/MPF vêm de imprensa e a investigação está em curso (presunção de inocência). Prejuízo total da fraude e perdas de credores não garantidos não verificados. Pessoas não nomeadas.


### Corrupção subnacional e municipal

Fraudes em licitações e desvios de recursos federais transferidos a municípios (saúde, educação, assistência), detectados por sorteios e fiscalizações da CGU.

| Valor (R$ bi) | Faixa | Período | Tipo | Verif. | O que é | Fonte |
|---:|---|---|---|:-:|---|---|
| 13,6 | – | 2025 | contagem | não | CGU: 76 operações especiais com a PF em 2025 contribuíram para prevenir/combater danos ao erário de R$ 13,6 bi (todos os entes, não só municípios) | CGU - Relatório de Gestão 2025 |
| 1 | – | 2003 até data indefinida | contagem | não | Programa de sorteios (desde 2003): 1.881 municípios fiscalizados, ~R$ 18 bi em recursos examinados; ~1.500-1.600 processos/ano enviados ao TCU, ~R$ 1 bi em uso indevido | CGU (resumo de busca) |
| 0,62 | – | Edições 24 e 26 (anos não confirmados) | contagem | não | 24a edição do sorteio: 55 de 60 municípios (92%) com irregularidades em licitações; 26a edição: R$ 620,3 mi examinados em 60 municípios | Congresso em Foco / Istoé Dinheiro (secundária) |

Limites: Sem fonte primária lida. Edições de sorteio citadas são antigas e o ano de encerramento do programa não foi verificado. % de achados graves não localizado. Agregados de Tribunais de Contas estaduais: lacuna. R$ 13,6 bi não separa municípios.


## Benefícios a empresas (decisões e regimes)

Valores em R$ bi por ano; "quem se beneficia" é setor ou porte, nunca empresa. Gasto tributário é renúncia legal, não ilegalidade.

| Tema | Beneficiários (setor) | R$ bi/ano (faixa) | Quem paga | Verif. | Decisão |
|---|---|---|---|:-:|---|
| Desoneracao da folha de pagamento (17 setores + municipios; reoneracao gradual 2025-2027) | empresas de 17 setores intensivos em mao de obra e municipios ate 156 mil hab. | 13,2 (13,2–19,5) | demais contribuintes/Previdencia | sim | desoneracao-ampla |
| Simples Nacional (regime unificado) | micro e pequenas empresas | 134,3 (120,1–134,3) | demais contribuintes | sim | cortar-beneficios-fiscais |
| Zona Franca de Manaus e areas de livre comercio | industria instalada na ZFM e ALCs; consumo regional | 36,0 (24,2–55,3) | demais contribuintes | sim | cortar-beneficios-fiscais |
| Beneficios tributarios do agro (PIS/Cofins, Funrural, exportacao da producao rural, defensivos, seguro rural; ITR ~0) | produtores rurais e agroindustria | 79,2 (79,2–101,3) | demais contribuintes | sim | cortar-beneficios-fiscais |
| Plano Safra - equalizacao de juros (Tesouro) | produtores rurais (Pronaf, Pronamp, demais) | 6,1 (1,7–6,1) | Tesouro Nacional (todos os contribuintes) | não | credito-subsidiado |
| Juros sobre capital proprio (JCP): dedutibilidade e IRRF | empresas do lucro real que pagam JCP e seus acionistas | 6,3 (3,1–6,3) | demais contribuintes (a deducao reduz IRPJ/CSLL) | sim | cortar-beneficios-fiscais |
| Transacao tributaria PGFN/RFB, Litigio Zero e parcelamentos especiais | devedores de grandes debitos (empresas viaveis e inviaveis) | n/d (–) | Uniao (descontos), demais contribuintes | não | perdao-dividas |
| Divida ativa da Uniao: estoque e recuperabilidade | devedores inscritos em divida ativa | n/d (–) | Uniao/contribuintes adimplentes | não | perdao-dividas |
| CDE - subsidios totais pagos na tarifa | fontes incentivadas, GD, tarifa social, irrigantes, areas isoladas | 52,7 (47,8–52,7) | consumidores de energia (tarifas) | não | – |
| Subsidio cruzado da geracao distribuida e descontos a fontes incentivadas | proprietarios de GD e geradores incentivados | 26,4 (20,5–26,4) | demais consumidores (tarifa) | não | politica-industrial-verde |
| Credito subsidiado - Tesouro/BNDES e FINEP (PSI e emprestimos da Uniao) | tomadores de credito BNDES/FINEP | 1,57 (1,57–4,15) | Tesouro Nacional | sim | credito-subsidiado |
| Renegociacao de dividas rurais (MP 1.376/2026) e PL 5.122/2023 | produtores rurais com perdas 2019-2025 | 3,6 (2–22,4) | Tesouro Nacional | não | perdao-dividas |
| Entidades sem fins lucrativos (imunes/isentas) | hospitais filantropicos, escolas e entidades assistenciais | 55,9 (55,9–55,9) | demais contribuintes | sim | cortar-beneficios-fiscais |
| Reforma tributaria: regimes diferenciados IBS/CBS (cesta basica zero, saude, educacao, agro, profissionais liberais) | varios setores e familias de baixa renda | n/d (–) | demais contribuintes via aliquota-padrao (~28% estimada) | não | acelerar-ibs-cbs |

## Modelos e evidência empírica

| Modelo | Autor, ano | Fórmula/ideia | Limite principal |
|---|---|---|---|
| Accountability eleitoral e auditorias públicas (Brasil) | Claudio Ferraz; Frederico Finan, 2008 | Modelo reduzido: Pr(reeleição_m) = a + b·(corrupção apurada_m) + X·g + e, com sorteio das auditorias da CGU gerando variação exógena na divulgação antes/depois da eleição. Teste: b<0 (eleitor pune cor | Municípios pequenos e médios com sorteio; corrupção medida por auditoria (só o que o auditor encontra, por amostra), não percepção; efeito de curto prazo e depende de mídia local; eleitor pode tolerar |
| Corrupção e desempenho escolar (Corrupting Learning) | Claudio Ferraz; Frederico Finan; Diana Moreira, 2012 | Desempenho_escolar_im = a + b·1[corrupção em educação detectada_m] + controles aluno/escola/município + e. Medida objetiva: irregularidades em recursos federais de educação apuradas pela CGU. | Associação condicional (não sorteio) entre corrupção e desempenho; corrupção apurada por amostra de auditoria; possíveis variáveis omitidas (capacidade administrativa); a estimativa de desvio em educa |
| Dissuasão por auditoria e risco de punição | Eric Avis; Claudio Ferraz; Frederico Finan, 2018 | Modelo de agência política: corrupção_t+1 = f(risco percebido de sanção não eleitoral); estimação: corrupção futura do município auditado vs. não auditado antes (diferença por sorteio). Resultado: aud | Programa de sorteio da CGU encerrou em 2015; medição só pelo que auditores acham (efeito pode ser mudança de comportamento ou de ocultação); validade para entes maiores incerta. |
| Monitoramento de corrupção por experimento de campo (Indonésia) | Benjamin A. Olken, 2007 | Despesa ausente = valor declarado − valor estimado por engenharia independente (preço × quantidade); efeito = diferença entre grupos randomizados (auditoria 4% para 100%; participação comunitária). | Pequenas obras de estradas de aldeia; validade externa limitada; medição por engenheiros pode errar; efeito de anúncio pode não persistir. |
| Equação de Klitgaard (monopólio, discricionariedade, accountability) | Robert Klitgaard, 1988 | C = M + D − A (Corrupção = Monopólio + Discricionariedade − Accountability/transparência). | Mnemônico qualitativo, não equação estimável; sem calibração empírica; não distingue tipos de corrupção. Fórmula citada de memória, livro não aberto. |
| Economia do crime e da punição | Gary S. Becker, 1968 | Ganho esperado = (1−p)·B − p·F, onde p = probabilidade de detecção/condenação, B = benefício, F = multa ou custo da pena; ou utilidade esperada EU = (1−p)·U(Y+B) + p·U(Y+B−F). Crime ocorre se EU > U(Y | Agente racional neutro ao risco; ignora normas e estigma; difícil medir p e B; dissuasão empírica varia por delito. |
| Economia da corrupção (propina como preço e leilão de propina) | Susan Rose-Ackerman, 1975 | Funcionário com poder de alocar benefício b cobra propina até o ponto em que o ganho marginal do particular iguala o risco/custo da propina; propina como preço de mercado (leilão) em que o funcionário | Teórico; depende de hipóteses sobre risco e informação; sem teste empírico direto no artigo de 1975. O livro de 1978 (Corruption: A Study in Political Economy) não foi verificado por DOI. |
| Corrupção como monopólio de oferta e estrutura da propina | Andrei Shleifer; Robert W. Vishny, 1993 | Propina = preço de um bem governamental cobrado por monopolista. Corrupção centralizada (um monopolista): propina é preço de monopólio. Descentralizada (vários vendedores de complementos): cada um cob | Modelo estilizado; hipóteses de demanda e monopólio; não identifica magnitudes; corrupção real mistura estruturas. Conteúdo do modelo descrito de memória, artigo não aberto. |
| Custo do monopólio, rent-seeking e renda de proteção | Gordon Tullock (1967); Anne O. Krueger (1974), 1974 | Custo do monopólio = triângulo de Harberger (perda de peso morto) + retângulo de transferência quando gasto em lobby/competição por renda dissipa o retângulo: custo social = triângulo + (parte ou todo | Estimativas de Krueger dependem de hipóteses de preço sombra; dissipação total do retângulo é controversa; não separa rent-seeking de busca legítima de influência. |
| Captura regulatória | George J. Stigler, 1971 | Regulação é demandada pela indústria e oferecida pelo regulador: políticos trocam benefícios regulatórios (subsídio, barreiras, preço) por votos e recursos; captura ocorre se ganho concentrado do grup | Teoria sem teste quantitativo no artigo; ignora benefícios públicos genuínos; captura é difícil de provar. Descrição de memória, artigo não aberto. |
| Instituições extrativas vs inclusivas | Daron Acemoglu; James A. Robinson (Why Nations Fail, 2012); Acemoglu, Johnson, Robinson (AER 2001), 2012 | Prosperidade = f(instituições inclusivas). AJR 2001: renda_i = a + b·instituições_i + e; instituições_i = c + d·mortalidade_de_colonos_i + u (IV). | Debate sobre o instrumento (mortalidade) e causalidade histórica; difícil falsificar; conceito de extrativa é amplo. |
| Corrupção, investimento e crescimento (cross-country) | Paolo Mauro, 1995 | Regressão cross-country: investimento/PIB e crescimento = a + b·índice de eficiência burocrática (ou de corrupção) + controles; IV com fracionamento etnolinguístico. | Índices subjetivos (percepção); correlação cross-country com risco de endogeneidade; instrumento questionável; não separa tipos de corrupção. |
| Desperdício passivo vs ativo em compras públicas | Oriana Bandiera; Andrea Prat; Tommaso Valletti, 2009 | Desperdício total = desperdício ativo (corrupção/extração de renda) + desperdício passivo (ineficiência, falta de capacidade ou incentivo do comprador). | Dados da Itália; separação depende de hipóteses; artigo não lido. |
| Cultura de corrupção (multas de estacionamento de diplomatas) | Raymond Fisman; Edward Miguel, 2007 | Violações por diplomata = f(índice de corrupção do país de origem) sob imunidade (sem enforcement); depois, com sanção, medir efeito do enforcement. | Contexto específico (diplomatas em Nova York); não generalizável para grande corrupção. Artigo não lido, só bibliografia conferida. |

DOIs conferidos em api.crossref.org quando `verificado:true`. Sem DOI conferido: Krueger 1974, Klitgaard 1988 (há reedição de 2019), Rose-Ackerman 1978, Acemoglu-Robinson 2012.
Klitgaard (C = M + D - A), Shleifer-Vishny e Stigler estão descritos de memória; só a referência foi conferida.
**Mauro (1995):** os números de 2,9 pp de investimento e 0,8 pp de crescimento **não** foram confirmados; o artigo reporta, para 1 desvio-padrão no índice de eficiência burocrática, ~4,75 pp de investimento e pouco mais de 0,5 pp de crescimento.

## Recuperar parte do desvio (SUPOSIÇÃO)

Desvio de referência: 1,84% do PIB/ano (ponto médio da faixa FIESP, estimativa de percepção, não verificada). Recuperar x% = primário adicional permanente
desde 2027 no modelo `economy.simulate` (sem choques; referência 2035: dívida 104.5% do PIB, Selic 12.1%).

| Recuperado do desvio | Primário (pp PIB) | R$ bi/ano | Δ dívida/PIB 2035 | Δ Selic 2035 |
|---:|---:|---:|---:|---:|
| 10% | +0,18 | 23,4 | -1,6 pp | -0,12 pp |
| 25% | +0,46 | 58,4 | -4,0 pp | -0,31 pp |
| 50% | +0,92 | 116,8 | -7,9 pp | -0,61 pp |

x = 10/25/50% é suposição rotulada. Parte do desvio não é recuperável (dano indireto, prescrição, empresas insolventes); o cenário mostra o valor de cada ponto percentual, não uma previsão de arrecadação.

## Valor financeiro das decisões

`decisoes.json` ganhou `valor_financeiro` (R$ bi/ano = `primary_target`/100 × PIB nominal da âncora; positivo = melhora do primário) e `beneficiarios_empresas`
(itens acima ligados à decisão). Exemplos: cortar gastos tributários +R$ 76 bi/ano (o gasto tributário total é R$ 613 bi, 12%); desoneração ampla -R$ 64 bi/ano.
Atenção: o delta do catálogo é julgamento, e o custo **documentado** da desoneração da folha (R$ 7,65 bi no DGT mais R$ 5,5 bi de municípios) é menor que o delta de "desoneração ampla e benefícios setoriais".
A conversão dá a escala, não a conta do orçamento.

## O que estes números não dizem

- **Não são somáveis.** Contagem e estimativa, fluxo e estoque, ano e acumulado, ilegalidade e renúncia legal: ver `nao_somar` no JSON. Somar áreas dupla-conta.
- Valor apurado em um caso não é a perda econômica (há dano indireto) nem o valor recuperável.
- Estimativas macro de corrupção descansam em percepção ou extrapolação; as de sonegação (Sonegômetro) e de economia subterrânea são modelos com metodologia contestada.
- Divergências abertas: gasto tributário 2026 R$ 612,84 bi (xlsx da Receita, lido) vs R$ 620,8 bi (imprensa); Lava Jato recuperado R$ 4,07 bi (MPF) vs R$ 6,17 bi (Petrobras); Carbono Oculto R$ 52 bi com dois períodos; INSS R$ 6,3 bi é estimativa de PF/CGU, não total comprovado.
- Evidência causal vem de municípios sorteados (CGU) e de uma auditoria na Indonésia; extrapolar para a União ou para o setor privado exige cautela.
- A maior parte dos "benefícios a empresas" aqui é política pública legal (Simples, ZFM, desoneração). Estar na tabela é custo fiscal, não indício de irregularidade.

### Lacunas
- PIB nominal 2025: IBGE respondeu 403 (não contornado); âncora R$ 12.700 bi é o valor arredondado da manchete do IBGE confirmado em imprensa (verificado=false); conferir em SIDRA/Contas Nacionais.
- FIESP/Decomtec: PDF original não localizado; faixa 1,38-2,3% vem de resumo de busca.
- FGV: nenhuma estimativa com número foi lida (item sem valor).
- Banco Mundial (Kaufmann 2004) e FMI Fiscal Monitor 2019: citados sem abrir a fonte primária.
- Economia subterrânea (ETCO/FGV): só 2020 aberto; 2022 e posteriores por resumo; Sonegômetro sem valor 2025; sem estimativa oficial de sonegação da Receita.
- Saúde/covid: sem total consolidado CGU/TCU/CPI; FNDE: sem total consolidado; obras: sem sobrepreço agregado do Fiscobras (só volume fiscalizado).
- Emendas: sem % do orçamento discricionário, sem série anual do RP9, sem resultado da auditoria da CGU; números de imprensa.
- Combustíveis: estimativa do ICL só por imprensa; sem ETCO/ANP. CADE 2024/2025 (multas) não confirmados na fonte (403). Compras públicas: % do PIB do Brasil não localizado; fracionamento sem dado.
- Ibama (taxa de pagamento), MapBiomas (garimpo), madeira ilegal e valor em R$ do ouro ilegal: sem fonte lida. Concessões: sem agregado de aditivos/reequilíbrios (item de um caso, não é perda). Lavagem: sem estimativa para o Brasil. CGU: relatório de gestão 2025 não carregou; sem % de achados graves nem agregados de Tribunais de Contas.
- Custo dos regimes diferenciados da reforma tributária, desconto concedido em transação tributária e custo total da dedução de JCP: não encontrados em fonte aberta (central=null).
- Jabutis: R$ 197 bi/25 anos (associação de consumidores) e R$ 348 bi até 2050 (autoria não identificada) vêm de resumo de busca; nenhum estudo de TCU/ANEEL/ABRADEE com número foi achado; não foram anualizados.
- Krueger 1974 e livros (Klitgaard 1988, Rose-Ackerman 1978, Acemoglu-Robinson 2012) sem DOI conferido; Klitgaard, Shleifer-Vishny e Stigler descritos de memória (só a referência foi conferida).

## Como não acusar

1. Descreva como "apurado por X (status)": operação, denúncia, acordo, decisão; só "transitado em julgado" autoriza afirmar culpa.
2. Use agregados (setor, programa, ano); o JSON não contém nomes de pessoas nem de empresas investigadas.
3. Operação, denúncia e acordo de leniência não são condenação; valor de denúncia é alegação.
4. Quando decisão judicial suspendeu ou anulou multas ou provas (ex.: leniências), registre o status e não trate o valor como devido.
5. Benefício fiscal é decisão pública legal; "beneficiário" não implica irregularidade.
6. Cite a faixa e a fonte; se `verificado:false`, diga que é preliminar.

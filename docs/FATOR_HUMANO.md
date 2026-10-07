# Fator humano: custo humano e potencial desperdiçado

Companheiro de `web/public/data/fator_humano.json` (53 indicadores). Cada número tem valor, unidade, período, tipo (contagem ou estimativa), fonte e o campo `verificado`.

## Como ler

- **Contagem** é registro (censo, certidão de óbito, ação fiscal). **Estimativa** é reconstrução com método, e a faixa importa mais que o valor central.
- O `ciclo` indica em que período o número cai. Não afirma que o ciclo o causou.
- `verificado=true` só para os 11 números lidos na página da fonte nesta pesquisa. Os outros 42 vieram de resumos de busca ou de memória e precisam de conferência na fonte primária antes de qualquer publicação. A página lida costuma ser imprensa que cita o órgão (Atlas da Violência, Censo 1872), então a conferência no documento original também está pendente.
- Os sites primários (SlaveVoyages, IBGE, CNV) não devolveram dados legíveis pela ferramenta de busca. Isso explica a baixa taxa de verificação.

## Contexto por ciclo

**pau-brasil (c. 1500-1530).** Contato e início do declínio indígena. Não existe contagem de 1500: a faixa de 2 a 5 milhões é estimativa por densidade e a linha de base é controversa. Qualquer proporção de queda herda essa incerteza.

**acucar (séc. XVI-XVII).** Início do tráfico em escala. Eltis estima 187.500 africanos levados ao Brasil em navios portugueses em 1601-1650. O total até 1866 é da ordem de quase 5 milhões de desembarcados, com mortalidade de travessia perto de 1 em 8 nas rotas para o Brasil (valores a conferir no SlaveVoyages).

**ouro-diamantes (séc. XVIII).** Sem indicador nesta versão: a pesquisa não encontrou número com fonte aberta confirmável por ciclo (o tráfico do período está dentro do total acima). Lacuna a preencher com as séries anuais do SlaveVoyages.

**agroexportacao-imperial (1808-1870s).** O Censo de 1872 registra 9.930.478 habitantes e cerca de 1,5 milhão de escravizados (15%). Analfabetismo de 82% entre 6 anos ou mais. A Grande Seca de 1877-79 tem estimativa de 400 a 500 mil mortes, sem método identificado na fonte lida. Guerra do Paraguai: mais de 100 mil mortes somando os países, com estimativas até 4 vezes isso.

**cafe-escravidao-abolicao (1850-1889).** Sem indicador próprio; o tráfico interno e a abolição não têm número verificado aqui.

**borracha-cafe-republica-velha (1889-1930).** Canudos (cerca de 25 mil, faixa a conferir), Contestado (10 a 20 mil), seca de 1915 (27 mil a 100 mil conforme a fonte), gripe de 1918 (35 mil a 300 mil: as fontes divergem e a menor parece ser recorte local). Analfabetismo de 64,9% em 1920 (15 anos ou mais).

**industrializacao-vargas (1930-1945).** Mortalidade infantil de 146,6 por mil em 1940 (série IBGE, resumo) e população indígena estimada entre 70 e 125 mil em meados do século.

**desenvolvimentismo (1946-1964).** Mortalidade infantil de 117,7 em 1960.

**milagre-endividamento (1964-1980s).** CNV: 434 mortos e desaparecidos políticos; ao menos 8.350 indígenas mortos (estimativa, vol. II); Brasil: Nunca Mais: 1.843 depoentes sobre tortura em 707 processos; Comissão Camponesa: 1.196 a 1.654 camponeses. Mortalidade infantil de 69,1 em 1980.

**decada-perdida-hiperinflacao (1980s-1994).** A seca de 1979-83 tem estimativas de 100 mil a 3,5 milhões de mortos. A faixa é um sinal de que não há método comum, não de que se saiba o valor. Falta série de desemprego comparável (a PNAD Contínua começa em 2012).

**estabilizacao-real (1994-2002).** Início da contabilização de resgates de trabalho análogo ao de escravo (1995): 65.598 pessoas até 2024. Mortalidade infantil de 28,1 em 2000. Censo 1991: cerca de 294 mil indígenas (memória).

**boom-commodities-inclusao (2003-2014).** Saída do Mapa da Fome da FAO em 2014; Censo 2010: 896.917 indígenas.

**recessao-ajuste-polarizacao (2015-2022).** Retorno ao Mapa da Fome (2018-2020); 33,1 milhões em insegurança alimentar grave (VIGISAN, 2021-22); desalentados 4,3 milhões em 2017 e 5,95 milhões no tri até fev/2021; covid-19: 700.239 mortes registradas (Conass), com excesso de mortalidade estimado em 792 mil (IHME) e 657 mil (OMS) em 2020-21.

**retomada-incerteza (2023 em diante).** Homicídios: 45.747 (2023); 21.856 jovens; risco 2,7 vezes maior para negros. Nova saída do Mapa da Fome (SOFI 2025). Censo 2022: 1.694.836 indígenas e 5,6% de analfabetismo; cerca de 9 milhões de jovens sem ensino médio completo; 3.145 doutores emigrados (1,2%).

## O que cada bloco não mede

| Bloco | Como foi calculado | O que não mede |
|---|---|---|
| Tráfico | Viagens documentadas mais estimativa de viagens sem registro | Mortes antes do embarque, após o desembarque e o tráfico interno |
| Censo de 1872 | Questionários por paróquia | Subregistro, erros de cor e idade, população remota |
| Indígenas | Reconstruções retroativas; censos por autodeclaração | Causas do declínio; o aumento recente é em parte metodológico |
| Ditadura | Casos individualizados com prova documental | Quem não teve caso documentado; a CNV reconhece piso, não total |
| Guerras | Estimativas de historiadores | Separação entre armas e doença, civis e combatentes |
| Secas e fome | Estimativas e inquéritos por amostra | Causalidade (clima vs. assistência); VIGISAN é inquérito por amostra, não censo |
| Epidemias | Registro de óbito e excesso sobre tendência | Mortes indiretas; os modelos divergem entre si |
| Mortalidade infantil | Método demográfico indireto e registros | Desigualdades internas; mortes de 1 a 5 anos |
| Analfabetismo | Autodeclaração em censos | Alfabetismo funcional |
| Trabalho análogo ao de escravo | Resgates por fiscalização | Vítimas não encontradas; mais resgates pode ser mais fiscalização |
| Desemprego e desalento | Pesquisa amostral domiciliar | Informalidade, subocupação; crises dos anos 1980 sem série comparável |
| Homicídios | Declaração de óbito no SIM | Mortes violentas de causa indeterminada; causas da queda |
| Bônus demográfico | Projeção populacional | Resultado econômico; é potencial, não perda observada |
| Fuga de cérebros | Cruzamento de titulações com residência | Perda de produtividade; emigração de não doutores |

## Perguntas que os dados não respondem

1. Quantas pessoas deixaram de nascer, estudar ou produzir por causa de cada evento? Os números são mortes ou prevalências, não cenários alternativos.
2. Qual era a população indígena em 1500? A faixa de 2 a 5 milhões muda a escala de qualquer declínio.
3. Quanto das mortes por seca e fome decorre do clima e quanto de decisões de assistência?
4. Qual o total de mortos pelo Estado na ditadura com um critério único de prova, somando indígenas, camponeses e urbanos?
5. Quantos trabalhadores em condição análoga à de escravo nunca foram encontrados?
6. Quanto da queda da mortalidade infantil é atribuível a cada política?
7. O que o bônus demográfico rendeu em produtividade e o que teria rendido com outra educação?
8. Que qualidade de aprendizagem se perde com a evasão, além da contagem de quem saiu da escola?
9. O excesso de mortes na covid-19 se divide em diretas e indiretas? IHME e OMS divergem em 135 mil.
10. Quanta fuga de cérebros ocorre além dos doutores titulados no Brasil?
11. O que a queda dos homicídios desde 2017 diz sobre as causas, e não só sobre a contagem?

## Pendências de verificação

Prioridade: SlaveVoyages (desembarcados, embarcados, mortos por período e por rota), tabelas do Censo de 1872 (IBGE), Relatório da CNV vol. II (capítulo indígena), Atlas da Violência 2025 (conflito entre taxas de 45,1 e 72,4 por 100 mil), séries históricas de mortalidade infantil e analfabetismo do IBGE, SOFI 2025 (percentuais de subalimentação), relatório do Ipea sobre emigração de doutores, e as estimativas de Canudos e do Contestado em fontes acadêmicas.

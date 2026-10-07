# O voto do analfabeto: história, dados atuais e futuro

Saídas: `web/public/data/eleitorado_analfabeto.json` e `web/public/data/analfabetos_municipal.json`. Código: `src/sociolibero/eleitorado.py` (CLI `uv run sociolibero eleitorado build`; `... eleitorado baixar` baixa os insumos). Testes: `tests/test_eleitorado.py` (offline).

**Aviso.** "Eleitor analfabeto" é o grau `ANALFABETO` do cadastro do TSE, autodeclarado no alistamento; não é a taxa de analfabetismo da população. A Parte 3 é suposição rotulada, não previsão. Os cruzamentos são ecológicos.

## 1. História: quem podia votar

| Regime | Regra sobre alfabetização | Eleitorado (fonte) |
|---|---|---|
| Império, 1824-1880 | Constituição de 1824 (arts. 90-92): eleição indireta; excluídos da paróquia menores de 25 anos, religiosos de claustro e quem não tivesse 100 mil réis de renda líquida. **Não exigia saber ler e escrever**: analfabetos votavam. | 1.100.008 votantes de 1º grau em 1873 (10,9% da população); 20.020 eleitores de 2º grau (Nicolau, lido na íntegra) |
| Lei Saraiva, 1881 | Decreto 3.029/1881, art. 6º § 1º: exige saber ler e escrever; eleição direta; renda de 200 mil réis. Uma fonte secundária diz que analfabetos já inscritos mantiveram o direito; isso não foi confirmado no texto da lei. | 142.856 eleitores em 1882 (1,2%): queda de 87% frente aos votantes de 1873, mas +614% frente aos eleitores de 2º grau (Nicolau) |
| Primeira República, 1891-1930 | CF/1891, art. 70 § 1º: não podem alistar-se os analfabetos (lido na página da Câmara); voto a descoberto | 2,3% da população em média nas presidenciais; 5% em 1930 (Nicolau); 2,2% (1894), 2,4% (1914), 5,7% (1930) em Engerman e Sokoloff |
| 1932-1934 | Voto feminino e secreto; analfabetos continuam excluídos (CF/1934, art. 108, lida só em resumo de busca) | 1.438.729 eleitores em 1933 (3,3%) |
| 1945-1964 | CF/1946, art. 132: analfabetos excluídos (resumo de busca) | 6.168.695 em 1945 (13,4%); 20,0% em 1962 (Nicolau) |
| Ditadura, 1964-1985 | Exclusão mantida; Presidência por eleição indireta | 20,4% (1966) a 39,3% (1982) da população (Nicolau) |
| EC 25, 15/05/1985 | **A emenda não concede o voto**: o art. 147 § 4º diz que "a Lei disporá sobre a forma pela qual possam os analfabetos alistar-se eleitores e exercer o direito de voto". A regulamentação é a Lei 7.332/1985 (art. 18); analfabetos seguem inelegíveis (art. 150). Esses dois dispositivos vêm da conferência da revisão do projeto; eu li só o art. 147 § 4º. | 1986: +10,6 pontos percentuais da população, por recadastramento e incorporação dos analfabetos (Nicolau); 69.166.810 inscritos |
| CF/1988 | Art. 14 § 1º II a: voto facultativo para analfabetos, maiores de 70 e 16-17; § 4º: analfabetos inelegíveis | 156.454.011 em 2022 (TSE, calculado) |

A taxa de analfabetismo de 15+ (`series_historicas.json`): 65,3% (1900), 64,9% (1920), 33,0% (1970), 25,3% (1980), 20,1% (1991), 13,6% (2000), 9,6% (2010), 7,0% (Censo 2022) e 4,9% (PNAD Contínua 2025). Pela tabela 4 de Engerman e Sokoloff, a alfabetização era de 15,8% (1872, 7+), 14,8% (1890), 25,6% (1900), 30,0% (1920, 10+) e 57,0% (1939).

**O que a literatura mede.** Nicolau: de 1945 a 1998 o eleitorado cresceu 1.330%, contra 250% da população, sem mudar a regra (só em 1985 e 1988), e a explicação plausível é a alfabetização de adultos (48% da população adulta em 1945 para 82% em 1998). A urna eletrônica aparece como a reforma que fez o voto de baixa escolaridade ser contado: Fujiwara (2015, só resumo lido) fala em "grande enfranchisement de fato"; Marcus André Melo (resumo de busca) diria que a EC 25 foi quase simbólica.

## 2. Dados atuais (TSE, calculados dos CSV)

### 2.1 Eleitorado por instrução

Soma por UF igual ao nacional em todos os anos, e igual ao arquivo consolidado `BRASIL.csv` (2022, 2024, 2026). "Nacional" inclui o exterior em 2022 e 2026; a série abaixo é sem exterior.

| Ano | Eleitores (sem exterior) | Analfabetos | % | "Lê e escreve" % |
|---|---|---|---|---|
| 2014 | 142.467.862 | 7.389.081 | 5,19 | 12,11 |
| 2016 | 144.088.912 | 6.981.111 | 4,85 | 10,74 |
| 2018 | 146.805.548 | 6.573.577 | 4,48 | 8,95 |
| 2020 | 147.918.483 | 6.572.249 | 4,44 | 7,83 |
| 2022 | 155.756.933 | 6.339.044 | 4,07 | 7,19 |
| 2024 | 155.912.680 | 5.572.448 | 3,57 | 6,59 |
| 2026 | 157.826.587 | 5.518.553 | 3,50 | 6,09 |

Por região em 2026 (% de analfabetos): Nordeste 6,33; Norte 4,22; Centro-Oeste 2,40; Sudeste 2,33; Sul 1,67. Maiores UFs: AL 9,72, PI 7,70, AC 7,37, MA 7,25, CE 6,48; menores: DF 0,75, SC 1,12, RS 1,67. No mapa municipal de 2026 a mediana é 4,6% e o máximo, 27,6%.

Por idade e sexo (2026, sem exterior): 16-17 anos, 0,24% analfabetos; 18-69, 2,39% (3,32 milhões); 70+, 12,77% (2,20 milhões, 40% de todos os analfabetos). Homens 3,68% e mulheres 3,33%. Por faixa de 5 anos, o percentual passa de 1,4% (40-44) para 21% (90-94). Tabelas completas por faixa, por faixa e sexo e por UF estão no JSON.

**Municípios.** `analfabetos_municipal.json` tem 5.571 códigos IBGE com `uf` e, por ano (2022, 2024, 2026), o bloco de contagens e percentuais ou `null`. Sem dado: Boa Esperança do Norte/MT em 2022 (município novo), Fernando de Noronha/PE e Brasília em 2024 (não há eleição municipal no DF). Nenhum município tem zero verdadeiro de analfabetos; `null` nunca é zero.

### 2.2 Comparecimento por instrução (2022 e 2024; 2026 não foi publicado)

O TSE publica `perfil_comparecimento_abstencao` para 2022 e 2024 (a URL de 2026 devolve 404 em 07/10/2026). Comparecimento (% dos aptos):

| | Analfabeto | Lê e escreve | Fundamental | Médio | Superior | Total |
|---|---|---|---|---|---|---|
| 2022, 1º turno | 47,9 | 68,6 | 76,5 | 82,9 | 87,1 | 79,2 |
| 2022, 2º turno | 50,7 | 70,3 | 77,0 | 82,8 | 87,1 | 79,5 |
| 2024, 1º turno | 59,6 | 74,5 | 77,4 | 80,0 | 81,0 | 78,3 |

Dentro da mesma faixa etária a lacuna é menor: em 2022 (1º turno), entre 18 e 69 anos o comparecimento foi de 66,3% (analfabetos) contra 81,3% (fundamental) e 88,2% (superior); entre 70+, 18,5% contra 42,0% e 69,0%. **Ressalva:** o voto do analfabeto, o de 16-17 e o de 70+ é facultativo, e o analfabeto é muito mais velho; menor comparecimento não é "falta" e mistura escolha, acesso e cadastro desatualizado. Os aptos do arquivo de comparecimento de 2022 (153.553.888) estão 2,2 milhões abaixo do perfil sem exterior (155.756.933); não identifiquei a causa.

### 2.3 Cruzamentos com o voto

Unidade: município. Modelo: mínimos quadrados ponderados pelos votos válidos com efeito fixo de UF; coeficiente = pontos percentuais do voto por +1 ponto percentual de analfabetos dentro da UF; IC 95% por bootstrap de municípios e, mais honesto, de UFs (400 reamostras). Entre colchetes, IC por UF.

| Eleição | Voto em Lula (13), bivariado | Idem, controlando % pretos e pardos e % indígena | Voto em 22, bivariado | Comparecimento, bivariado |
|---|---|---|---|---|
| Presidente 2022, 1º turno | +1,33 [1,04; 1,56] | +1,10 [0,87; 1,32] | -1,00 [-1,24; -0,68] | -0,57 [-0,66; -0,47] |
| Presidente 2022, 2º turno | +1,23 [0,91; 1,48] | +1,00 [0,70; 1,25] | -1,23 [-1,48; -0,91] | -0,63 [-0,70; -0,53] |
| Presidente 2026, 1º turno (preliminar) | +1,32 [1,05; 1,51] | +1,05 [0,80; 1,24] | -0,99 [-1,18; -0,70] | -0,37 [-0,48; -0,25] |

Correlação simples (Pearson, sem controle de UF): 0,64 com o voto em Lula em 2022; correlação de 0,58 entre % de analfabetos e % de pretos e pardos. Com a amplitude interquartil média dentro da UF (3,8 pontos percentuais de analfabetos), o coeficiente de 1,33 equivale a 5 pontos percentuais de voto em Lula entre o município no 3º e no 1º quartil da UF. As inclinações por UF (2022, 1º turno) variam de -1,8 (RJ) a +4,2 (AP); SP (-0,1) e RO (-0,2) ficam em torno de zero, e a inclinação é positiva em 23 das 26 UFs com 10 municípios ou mais.

**Ressalvas (falácia ecológica).** O coeficiente é municipal: não diz como o analfabeto vota, e sim como o voto varia entre municípios com mais ou menos analfabetos no cadastro. A % de analfabetos acompanha pobreza, idade e ruralidade, que o modelo não mede; o efeito fixo de UF controla só o que é comum ao estado. O voto do analfabeto é facultativo (viés de seleção). O IC de municípios supõe independência (otimista); o de UFs tem só 26 conglomerados. A apuração de 2026 é preliminar neste repositório.

## 3. O futuro: projeção até 2038 (suposições rotuladas)

**Método.** Modelo de coortes por idade simples (16-104), com passo anual: cada idade vira a+1, sobrevive com a tábua completa de mortalidade do IBGE (2024, ambos os sexos), ajustada por κ por grupo etário (18-24, 25-39, 40-59, 60-69, 70-79, 80+); entram a cada ano os eleitores de 16 anos. κ = (observado / previsto só pela tábua)^(1/anos) em seis janelas bienais (2014→2016 até 2024→2026). Vale ≈ 1 acima de 25 anos (analfabetos: 0,99 a 1,01, com desvio entre janelas de 0,014 a 0,058), isto é, a tábua do IBGE explica quase toda a evolução da coorte; entre 18 e 24 anos κ ≈ 1,15 (alistamento tardio). 2.000 caminhos: κ sorteado (média e desvio entre janelas), entrantes de 16 anos no nível de 2026 (±20%) e taxa de analfabetos entre eles (0,24%, ±30%).

**Resultado (nacional, sem exterior).**

| Ano | Analfabetos, mediana [p10-p90 simulado] | Faixa calibrada | % do eleitorado | % de analfabetos com 70+ | Eleitores com 60+ |
|---|---|---|---|---|---|
| 2026 (observado) | 5,52 milhões | | 3,50 | 40 | 23,6% (TSE) |
| 2030 | 4,94 [4,65; 5,26] | 4,45-5,48 | 3,06 | 43 | 25,5% |
| 2034 | 4,39 [3,93; 4,97] | 3,80-5,07 | 2,70 | 48 | 27,7% |
| 2038 | 3,84 [3,28; 4,63] | 3,18-4,65 | 2,39 | 53 | 30,5% |

A "faixa calibrada" soma ao desvio simulado o erro RMS (6,6%, escala log) da validação retrospectiva. Idade média do eleitorado: 46,1 (2027) a 49,9 anos (2038). Execução central determinística: 68% dos analfabetos de 2026 ainda estarão inscritos em 2038; os entrantes analfabetos de 2027-2038 (39 mil) são 1% do estoque de 2038. Substituição de coortes: o analfabeto é eleitor idoso e a reposição por coortes alfabetizadas é quase total.

**Peso por região (mediana).** Nordeste: 49,9% dos analfabetos em 2026 e 52,1% em 2038 (de 27,6% para 29,7% do eleitorado); Sudeste: 28,0% para 25,8%; Norte: 10,0% para 10,7%; Sul: 6,9% para 6,4%; Centro-Oeste: 5,2% para 5,0%. A % de analfabetos do Nordeste cai de 6,3% para 4,2% e a do Sul de 1,7% para 1,1%: o peso relativo se concentra ainda mais no Nordeste, ao mesmo tempo em que o contingente cai em todas as regiões.

**Além de 2038 (só ilustração).** Mediana de 2,39 milhões em 2050 e 0,77 milhão em 2070; a mediana cruza 2 milhões em 2054 (p10-p90: 2048-2063) e 1 milhão em 2065 (2059-2074). Extrapolação com κ fixo por décadas, não previsão.

**Validação retrospectiva** (analfabetos, `projecao_2038.validacao_retrospectiva`): previsões feitas só com dados anteriores, a partir de 2018 (para 2020, 2022, 2024, 2026) e de 2022 (para 2024, 2026). Erro absoluto médio de 6,0% do modelo, contra 11,6% de "último valor" e 8,9% de tendência linear. **Mas:** a faixa p10-p90 só cobriu 33% dos casos (por isso a faixa calibrada), o modelo errou para baixo com origem em 2018 (-2% a -8%) e para cima com origem em 2022 (+8,3% em 2024, +3,9% em 2026). A queda de 12% de analfabetos entre 2022 e 2024 (6,34 para 5,57 milhões) é maior que mortalidade e alfabetização: o perfil de 2024 não tem exterior e houve revisão/cancelamento de cadastro, causa não verificada. Previsões regionais de 2022 para 2026: erros de +10,4% (Norte), +3,9% (Nordeste), -0,6% (Centro-Oeste), +3,6% (Sudeste) e +2,1% (Sul); em 2024 todas as regiões superestimaram em 4% a 17%, padrão de choque nacional, de modo que as **participações regionais** são mais confiáveis que os níveis.

**O que o modelo não captura.** Mudança de regra (voto obrigatório ou fim da inelegibilidade); novo recadastramento ou cancelamento em massa (como em 2022-2024); alfabetização de adultos e atualização do grau no cadastro; mortalidade maior dos analfabetos (entra só em κ); diferenças regionais de κ e de mortalidade; migração; a incerteza dos entrantes (domina o total do eleitorado, não os analfabetos); espalhamento uniforme dentro das faixas de 5 anos; e mudança de comportamento do analfabeto (comparecimento).

## 4. Interesses e teorias

Cada linha de `historia[].interesses` é hipótese apoiada na literatura lida, com leitura rival (campo `leituras_rivais`). Resumo:

- **Império:** ganharam proprietários e chefes locais que qualificavam votantes; perderam mulheres, escravizados, livres sem renda e libertos (barrados do 2º grau). Rival: Carvalho (resumo de busca) lê a base de 13% da população livre como inclusão; Faoro (via Nicolau) lê como inflação fraudulenta.
- **Lei Saraiva:** ganhou a elite letrada e urbana; perderam os analfabetos (cerca de 80% da população). Leituras: reforma contra a fraude (Nicolau/Faoro), exclusão deliberada da participação popular (Ferraro, resumo de busca), retrocesso de cidadania (Carvalho).
- **Primeira República:** ganharam oligarquias estaduais e coronéis; perderam os dois terços de adultos analfabetos, mulheres e libertos. Engerman e Sokoloff: restrição por alfabetização com escolas escassas; Leal: o voto de cabresto sobrevive em eleitores alfabetizados.
- **1932-1964:** ganharam mulheres alfabetizadas, trabalhadores urbanos e o governo federal (Justiça Eleitoral); perdeu o campesinato analfabeto. Nicolau: o crescimento veio da alfabetização; Souza (via Nicolau): 21% dos eleitores de 1945 foram alistados ex officio.
- **1985-hoje:** ganharam os próprios analfabetos (direito facultativo), candidatos com penetração em regiões e idades com mais analfabetos; perderam, ainda, como candidatos (inelegíveis). A inclusão efetiva veio mais da urna eletrônica (Fujiwara; Nicolau; Melo).

Teorias (campo `teorias`): Acemoglu e Robinson (2000, ampliação do voto como compromisso diante de ameaça revolucionária), Boix (2003, distribuição de ativos e proprietários de terra), Przeworski (2009, conquistado ou concedido; só título lido, falta ler), Engerman e Sokoloff (2005, lido na íntegra), Nicolau, Fujiwara, Leal, Carvalho e Faoro. Aplicações ao Brasil são hipóteses, não testes.

## 5. O que isto não prova

- Não prova como o analfabeto vota: os cruzamentos são municipais.
- Não prova que o analfabetismo causa o voto: a % de analfabetos acompanha pobreza, idade e região.
- Não é previsão: a projeção é cenário com suposições explícitas; a faixa simulada foi estreita demais em retrospecto.
- Não mede o analfabetismo da população: o grau é autodeclarado e não é atualizado automaticamente no cadastro.
- Não identifica o efeito da EC 25: a literatura lida separa mal alfabetização, recadastramento, urna eletrônica e emenda.

## 6. Validação numérica

- Soma das UFs = nacional (total e analfabetos): diferença 0 em 2014, 2016, 2018, 2020, 2022, 2024 e 2026; igual ao `BRASIL.csv` em 2022, 2024 e 2026.
- Contra publicados do TSE (lidos em resumos de busca, não nas páginas): 2022, total 156.454.011, analfabetos 6.339.894, médio completo 41.161.552 e fundamental incompleto 35.930.401; 2024, total 155.912.680, médio completo 42.154.620, fundamental incompleto 35.055.587, médio incompleto 27.716.058 e superior completo 16.756.310: diferença 0 em todos. 2026: 158.745.463 calculado contra 158.745.502 na Wikipédia (-39). Um resumo de busca atribuía ao TSE 6,9 milhões de analfabetos em 2024; o CSV dá 5.572.448 (outra fonte secundária fala em 5,5 milhões) e 6,9 milhões é o valor de 2016.
- Municípios: 5.571 códigos; eleitores nos municípios mapeados = nacional sem exterior em 2022, 2024 e 2026 (nenhum município do TSE ficou sem correspondência); `null` quando o município não existe no perfil do ano.
- Proveniência: SHA-256 de cada CSV zip em `meta.fontes` e em `data/raw/*/PROVENIENCIA.json`.

## 7. Lacunas

- Páginas do TSE, do Planalto e do Senado retornaram 403 ou erro de rede; textos de 1824, 1934, 1946, 1967/69, CF/88 art. 14 e Lei 7.332/1985 não foram lidos nos portais oficiais.
- Nenhum número de analfabetos inscritos em 1986 foi lido; só a taxa de 15+ (1980: 25,3%) e uma estimativa secundária (cerca de 19 milhões de adultos em 1985).
- Kang, Cunha e Limongi: não encontrei obra específica sobre o voto do analfabeto; não são citados. Maria do Carmo Campello de Souza entra só via Nicolau.
- Não há estudo quantitativo lido sobre o efeito eleitoral da EC 25; Przeworski, Boix, Leal, Carvalho, Ferraro, Fujiwara e Melo foram lidos só em resumos.
- Comparecimento por instrução em 2026 não existe ainda; a causa da diferença de 2,2 milhões de aptos entre o arquivo de comparecimento e o perfil de 2022 e a queda de 2022 a 2024 não foram esclarecidas.

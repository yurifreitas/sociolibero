# Clima e economia do Brasil: o que o clima explica e o que não explica

Dados abertos baixados, conferidos e ligados à economia, com limites declarados. Saída: `web/public/data/clima.json`
(`uv run sociolibero clima baixar` e `uv run sociolibero clima build`). Método e proveniência: `docs/METHODS.md`, seção 11.

**Aviso central.** As relações abaixo são correlações descritivas entre séries anuais curtas (14 a 30 pontos na maioria,
125 no máximo). Não são causalidade, não são previsão e não identificam o efeito de um evento específico. Todos os 36 testes
feitos estão publicados em `relacoes` (não só os "significativos"); com 5% de falso positivo por teste, esperam-se ~1,8
intervalos que excluem zero só por acaso, e 6 excluem (lista em `meta.resumo_testes`).

## 1. O que foi baixado (cobertura real)

| Série (id) | Fonte | Cobertura |
|---|---|---|
| Temperatura do Brasil, anomalia anual (`temp_brasil_berkeley_anual`) | Berkeley Earth (arquivo público termina em 2020) | 1857-2020, com incerteza de 95% |
| Temperatura e chuva do Brasil, anual e mensal (`temp_brasil_cru_*`, `chuva_brasil_cru_*`) | CRU TS 4.09 via Banco Mundial CCKP | 1901-2024 |
| Temperatura e chuva do Brasil, anual (`*_era5_anual`) | ERA5 via CCKP | 1950-2024 |
| Temperatura da América do Sul e global (`temp_america_sul_berkeley_anual`, `temp_global_giss_anual`) | Berkeley Earth; NASA GISTEMP v4 | 1857-2020; 1880-2025 |
| ENSO: ONI, MEI.v2, Niño 3.4 HadISST (`oni_*`, `mei_v2_bimestral`, `nino34_hadisst_*`) | NOAA CPC e PSL | ONI 1950-2026; MEI 1979-2026; Niño 3.4 1870-2026 |
| Focos de calor, Brasil e Amazônia, mensal e anual (`focos_*`) | INPE Queimadas, satélite de referência | 2003-2025 (anual); 2026 incompleto, fora |
| Alertas de desmatamento DETER-B (`deter_*`) | INPE/TerraBrasilis (WFS) | ago/2016 em diante |
| Desmatamento PRODES (`desmatamento_amazonia_prodes`) | INPE (já no projeto) | 1988-2025 |
| Energia armazenada, afluência (% da média) e CMO (`ear_*`, `ena_*`, `cmo_*`) | ONS dados abertos | EAR e ENA 2000 em diante; CMO 2005 em diante |
| PIB agropecuária, indústria, serviços (`pib_*_var`) | IBGE SIDRA 5932 | 1996-2025 |
| IPCA alimentação (`ipca_alimentacao_bcb`; conferência `ipca_alimentacao_sidra`) | BCB SGS 1635; SIDRA 1419 e 7060 | 1992-2025; SIDRA 2012-2025 |
| IPCA energia elétrica residencial (`ipca_energia_eletrica`) | SIDRA 1419 e 7060 | 2012-2025 |
| PIB total e IPCA geral (`pib_total_var`, `ipca_geral_ipeadata`) | Série do projeto (`series_historicas.json`, Ipeadata/IBGE) | 1901-2025; 1980-2025 |

Todas as fontes têm URL, data e SHA-256 em `data/raw/<nome>/PROVENIENCIA.json` e no campo `fonte` de cada série.

**Conferências feitas (`meta.validacao`).**
- CRU contra ERA5, temperatura anual 1950-2024: r = 0,95 (0,93 sem tendência). Chuva: r = 0,75. CRU contra Berkeley (1901-2020): r = 0,94 (0,87 sem tendência).
- IPCA alimentação do BCB contra o do SIDRA, 2012-2025: diferença máxima 0,000 p.p.
- DETER contra PRODES (9 anos PRODES completos): r = 0,92, mas o DETER soma em média 73% do PRODES (alerta, não taxa oficial).
- Focos de calor: sem conferência independente além da leitura de 23 zips anuais (uma coluna de data e uma de bioma), com codificação de caracteres que muda entre anos (UTF-8 e latin-1) tratada no leitor.

**Tendência (`tendencias`).** A temperatura do Brasil (CRU) subiu 0,09 °C por década em 1901-2024 (IC95 0,06 a 0,12) e 0,23 °C por década em 1980-2024 (IC95 0,20 a 0,28), por bootstrap em blocos. O ENSO atual: o ONI de jul-set/2026 é +2,16 °C, ou seja, um El Niño forte em curso na data do download; a janela NDJ de 2026 ainda não existe, então 2026 não entra nos testes.

## 2. O que as relações mostram (e o que não mostram)

Convenção: `defasagem` indica o ano da economia em relação ao do clima (lag 1 = economia no ano seguinte ao pico do ENSO).
O índice de ENSO do ano Y é a média nov(Y)-jan(Y+1). IC95 por bootstrap em blocos móveis de pares (2.000 reamostragens, semente fixa).

**Resultados que o clima parece explicar, com mecanismo físico plausível.**
- ENSO contra chuva média do Brasil (1901-2024, n = 124): r = -0,23 (IC95 -0,35 a -0,07) no mesmo ano e r = -0,33 (-0,50 a -0,15) no ano seguinte. El Niño tende a coincidir com menos chuva na média nacional, com dominância do Norte/Nordeste.
- Afluência no Sudeste contra CMO do Sudeste (2005-2025, n = 21): r = -0,50 (-0,75 a -0,25). Energia armazenada em 30/nov contra o CMO do ano seguinte: r = -0,42 (-0,66 a -0,08). Menos água hoje, custo de despacho maior depois: é a lógica do sistema, mas o CMO responde também à demanda, ao parque térmico e às regras de despacho.
- ENSO contra focos de calor na Amazônia (2003-2025, sem tendência): r = +0,48 (0,08 a 0,72) com defasagem de 1 ano (fogo na estação seca depois do pico do El Niño); r = -0,14 (-0,47 a 0,10) no mesmo ano. É 1 teste entre 36, em 23 pontos, e os focos também seguem política de fiscalização e desmatamento.

**Resultados que NÃO se sustentam como relação clima-economia (intervalos incluem zero).**
- ENSO contra PIB agropecuário (1996-2025, n = 30): r = -0,02 (-0,43 a 0,43) no mesmo ano; r = -0,23 (-0,51 a 0,20) no seguinte.
- Chuva média nacional e temperatura contra PIB agropecuário: r = -0,07 (-0,40 a 0,40) e r = +0,08 (-0,16 a 0,36, sem tendência). A chuva nacional não representa o ano agrícola de cada região; um indicador regional (por cultura e safra) seria necessário.
- ENSO contra inflação de alimentos (IPCA, 1996-2025): r = -0,11 (-0,59 a 0,32) no mesmo ano; contra alimentação menos IPCA geral, r = -0,23 (-0,54 a 0,12).
- ENSO contra PIB total desde 1996: r = -0,25 (-0,63 a 0,24). Desde 1901 (n = 125): r = -0,15 (-0,28 a -0,001), no limite do zero, em série longa que mistura regimes e metodologias, com Niño 3.4 reconstruído antes de ~1950.
- Controle (placebo): ENSO contra PIB de serviços tem r = -0,24 (-0,60 a 0,13) no mesmo ano e r = -0,30 (-0,59 a 0,09) no seguinte, tão "forte" quanto o do agro, que é o que o acaso e o ciclo comum produzem nesse tamanho de amostra.
- Anos de El Niño contra os demais, PIB agropecuário: diferença de -0,3 p.p. (IC95 -3,6 a 4,7) no mesmo ano e -2,4 p.p. (-6,2 a 1,5) no seguinte, com poucos eventos. Média de PIB total desde 1951: +0,3 p.p. (-1,2 a 1,7).
- Energia: ENSO contra IPCA de energia (2012-2025, n = 14): r = +0,58 com IC95 de -0,14 a 0,87 e Spearman de 0,14, ou seja, não distinguível de zero; afluência e CMO contra IPCA de energia também incluem zero. Tarifa responde a reajuste regulatório, bandeiras e tributos (o IPCA de energia caiu 19% em 2022 por corte de tributos, não por hidrologia).
- Afluência do Norte contra focos na Amazônia: r = -0,16 (-0,61 a 0,25).

**Leitura honesta.** Com 30 anos de contas trimestrais, não há como separar o efeito do clima do de câmbio, preço de commodities, juros e política agrícola. A ausência de correlação aqui não prova que o clima não importa: prova que este desenho (série nacional anual curta) não tem poder para detectar. Efeitos regionais, de cultura e de choques extremos (seca ou enchente de um ano) ficam escondidos na média nacional.

## 3. O que o clima explica e o que não explica

**Explica (com evidência direta nos dados abertos).**
1. O Brasil esquentou: tendência de 0,23 °C por década desde 1980 em CRU, concordante com Berkeley e ERA5.
2. O ENSO modula a chuva média e os focos de fogo: sinal robusto à escolha de índice, mas moderado em tamanho.
3. A hidrologia comanda o custo de despacho de energia: afluência e energia armazenada contra CMO. A crise de 2021 aparece nos dados: afluência anual do Sudeste de 72% da média, CMO anual do Sudeste de R$ 548/MWh, IPCA de energia +21,2% e IPCA geral +10,1% (SIDRA).
4. Episódios extremos documentados (seção 4) têm efeito econômico local grande.

**Não explica (ou os dados abertos aqui não conseguem dizer).**
1. O PIB agropecuário anual do país: -3,1% em 2012 (seca no Nordeste), +3,3% em 2015, -5,2% em 2016 e +16,3% em 2023 têm causas de safra, preço e área que a chuva média nacional não captura.
2. A inflação de alimentos de um ano qualquer.
3. Causalidade. Nenhuma relação aqui foi ajustada por variáveis de controle.
4. Eventos únicos: efeitos de 2014-15, 2021 ou 2023-24 sobre o PIB não são estimados aqui; os episódios mostram o contexto anual das séries, não efeito causal.

## 4. Episódios documentados (`episodios`)

Cada episódio tem fontes com trecho conferido, estimativa com faixa quando as fontes divergem, `verificado` verdadeiro ou falso, e
`indicadores_da_serie` (valores anuais das séries deste arquivo nos anos do episódio; contexto, não efeito).

| Episódio | Estado |
|---|---|
| Grande Seca 1877-79 | Verificado. Mortes no Nordeste entre 150 mil e 500 mil (fontes divergem); sem número único por província. Niño 3.4 (HadISST) de 2,33 em 1877: El Niño forte, coerente. |
| Geada negra de julho de 1975 | Verificado. 900 a 950 milhões de cafeeiros perdidos (duas fontes), safra de 10,2 milhões de sacas (48% do país) e ~615 mil ha segundo a FAEP via CNA. Efeito em preço e exportação não conferido. ONI de pico de -1,58 (La Niña), mas geada é evento de massa polar, não de ENSO. |
| Crise hídrica 2014-15 (Cantareira) | Verificado. ANA: afluências a 23% (2014) e 50% (2015) da média; volume morto; bônus e multa. Nos dados: energia armazenada em 30/nov do Sudeste em 15,8% (2014) e mínimo mensal do Sudeste de 16,6% (nov/2014); CMO anual do Sudeste de R$ 841 (2014); IPCA de energia +17,1% (2014) e +51,0% (2015). |
| Crise hídrico-energética 2021 | Parcial: pior afluência em 91 anos (MME) conferida; IPCA conferido via SIDRA; bandeira escassez hídrica só em jornal. |
| Seca amazônica 2023-24 | Verificado com ressalvas: 590 a 608 mil pessoas afetadas (duas fontes divergem); níveis de rios só de imprensa. Nos dados: afluência anual do Norte em 78,7% (2023) e 60,3% (2024) da média; focos na Amazônia 98,6 mil (2023) e 140,3 mil (2024); ONI de pico 1,99 (2023). |
| Seca do Nordeste 2012-2017 | Verificado: perdas de R$ 3,6 bi na agricultura e R$ 3,2 bi na pecuária; 6.295 decretos em 2011-2015 (Pesquisa FAPESP). PIB agropecuário -3,1% (2012) e -5,2% (2016). |
| Enchente do RS 2024 | Verificado: R$ 88,9 bi de danos e perdas (BID/CEPAL/Banco Mundial); 184 mortes e 2,4 milhões de afetados (Defesa Civil RS). Evento de chuva extrema, não de seca. |

`secas_nordeste` lista os períodos de seca severa do Nordeste da única fonte aberta que foi lida na íntegra (Marengo et al., 2017, Anais da ABC).

## 5. Cenários futuros (`cenarios_futuros`, `custos_economicos`)

Cada item registra fonte, SSP ou RCP (ou "n/a" quando o estudo não usa), horizonte, faixa e confiança como na fonte.
- **IPCC AR6** (ficha regional WGI e capítulo 12 do WGII, lidos nos PDFs oficiais): mais calor que a média global (confiança alta); menos chuva no NE e mais no SE da América do Sul; mais de 150 dias a mais com máxima acima de 35 °C na Amazônia no SSP5-8.5 contra menos de 60 no SSP1-2.6 (confiança alta); seca mais longa no NE e mais seca agrícola e ecológica em Amazônia e Brasil central com 2 °C ou mais; +39% a +95% de área queimada no Cerrado em 2050 (RCP4.5 e 8.5); redução de vazão de ~27% (Tapajós) e ~53% (Tocantins-Araguaia) no fim do século; tipping point da Amazônia com confiança média e sem limiar numérico no capítulo.
- **Amazônia**: Lovejoy e Nobre (2018) falam em 20-25% de desmatamento e 4 °C; Nobre et al. (2016) em 4 °C ou 40% de desmatamento. Os limiares divergem entre fontes e são incertos.
- **Embrapa/Unicamp 2008** (cenários SRES A2/B2, não SSP), **PBMC RAN1 2013** (via Agência FAPESP, sem cenário informado), **G20 Climate Risk Atlas (CMCC)** e o **estudo MPO/BID 2025** (custo de inação de R$ 10,3 a 17,1 tri até 2050, 89% a 146% do PIB de 2024; ~3,4 a 4,4 milhões de empregos), **Banco Mundial CCDR 2023** (comunicado: 0,8% do PIB por ano de investimento líquido até 2030) e **BCB** (REF 2024, enchentes do RS: exposição de R$ 53 bi).

**Lacunas que ficam abertas** (todas em `meta.lacunas`): valores do AR6 por nível de aquecimento e SSP estão em figuras e não foram extraídos; Interactive Atlas não consultado; Armstrong McKay (2022), FMI WP/24/185, Burke et al. (2015) e Kahn et al. (2021), Ipea, o relatório completo do CCDR e o Plano Clima não foram abertos (403, PDF ilegível ou só resumo de busca); então seus números não entram. As estimativas de custo medem coisas diferentes (transição, eventos extremos, custo de inação) e não são somáveis.

## 6. Integração no modelo macro (opcional)

`economy.Levers.climate_shock` (pp de PIB perdidos por ano) e `climate_premium` (pp de prêmio de risco), ambos 0,0 por padrão; com o padrão, os resultados são idênticos aos de antes (teste de regressão em `tests/test_clima.py`). A alavanca `tech_productivity` é preservada.
Severidades **leve, moderada e severa (0,1; 0,3 e 0,6 pp/ano, com prêmio de 0,1; 0,3 e 0,6 pp) são SUPOSIÇÕES**, não estimativas. Âncoras de ordem de grandeza: o G20 Climate Risk Atlas (-2,79% de PIB até 2050) equivale a ~0,11 pp/ano de crescimento; o estudo MPO/BID, a ~0,3-0,45 pp/ano. Ambas são contas grosseiras, descritas em `integracao_macro.ancoras_ordem_de_grandeza`.
No cenário pragmático, o choque moderado eleva a dívida bruta/PIB de 2035 em ~3,3 p.p. e rebaixa o PIB em 2035 em ~3% de nível; a grade completa e a variação por cenário político estão em `integracao_macro.sensibilidade` e `por_cenario_politico`. O choque é uma perda constante de crescimento, sem adaptação, sem efeito de oferta na inflação e sem efeito no PIB potencial.

## 7. Lacunas de dados (resumo)

- **PLD (CCEE)**: `dadosabertos.ccee.org.br` devolveu 403, não contornado; o CMO do ONS faz o papel de preço de curto prazo, e não é o preço pago pelo consumidor.
- **Chuva regional**: a série aberta agregada obtida é a média nacional (CRU/ERA5). Não há aqui chuva por Nordeste, Sul ou Amazônia; a afluência do ONS por subsistema serve de proxy hidrológico. CHIRPS/INMET/ANA não foram baixados (arquivos grandes ou cadastro).
- **Temperatura recente da Berkeley Earth**: o arquivo público termina em 2020; 2021-2024 só em CRU e ERA5, sem emenda.
- **2025-2026** em várias séries e **IPCA energia antes de 2012**: sem série aberta contínua; PLD e tarifa de energia não foram obtidos.
- **El Niño de 2015-16** como episódio e várias fontes primárias de episódios e de cenários: ver `lacunas`.

## 8. Valor financeiro da área clima (enchente do RS de 2024 e desastres no Brasil)

`web/public/data/clima_valor_financeiro.json` reúne 14 valores em R$ (14 verificados) e 5 razões prevenção x resposta, com fonte, URL, `tipo` (`contagem` = soma de registros ou declarações; `estimativa` = avaliação, anúncio ou conta derivada) e `verificado` (número lido em página aberta nesta rodada). A estimativa de referência para a enchente de abr-mai/2024 é a avaliação de danos e perdas (metodologia DaLA) de BID, CEPAL e Banco Mundial, de 28/11/2024: **R$ 88,9 bi** (produtivo R$ 61 bi, social R$ 19 bi, infraestrutura R$ 7 bi, ambiente R$ 1,6 bi), verificada. Ao lado dela estão números que medem outra coisa: R$ 10 bi de prejuízos declarados pelos municípios à CNM em 17/05/2024 (parcial, auto-declaração), R$ 3,88 bi de avisos de sinistro em 19/06/2024 e R$ 6,1 bi de indenizações pagas até dezembro de 2024 (CNseg, sem resseguro), R$ 6,9 bi de investimento em reconstrução informado pelo governo do RS em abril de 2025, e R$ 62,5 bi "destinados emergencialmente" pela União em maio de 2024, dos quais a maior parte é crédito e adiamento de dívida, não gasto. No Brasil, a CNM declara R$ 401,3 bi de prejuízos em jan/2013-fev/2023 (média implícita de ~R$ 39,5 bi/ano) e R$ 732,2 bi em 2013-2024 (~R$ 61 bi/ano), séries de declaração municipal que se sobrepõem e discordam entre si. Sobre prevenção e resposta, só há razão com fonte aberta lida para gasto público: 31% de prevenção contra 69% de resposta e recuperação no gasto federal de 2013-2022 (TCU, R$ 5,9 bi e R$ 13,4 bi; razão 2,3) e, em outra base, R$ 2,4 bi de prevenção contra R$ 23,3 bi de resposta em 2019-2024 segundo a CNseg (razão 9,7); as razões não se reconciliam (períodos e classificações diferentes). As razões de retorno internacionais (US$ 1 para US$ 4 em infraestrutura resiliente, Banco Mundial; US$ 1 para US$ 15, UNDRR; R$ 1 para R$ 10, WRI) foram relidas em 07/10/2026 e passaram a `verificado: true`: a razão de 1 para 4 consta na página do GFDRR/Banco Mundial (Lifelines, países de renda baixa e média), a de 1 para 15 na página da publicação do UNDRR (GAR 2025, média de estudos), e a de 1 para 10 foi lida como afirmação da CNseg atribuída ao WRI (o estudo original do WRI não foi localizado); as páginas oficiais antigas seguem dando 403 ou 404. Não se aplicam automaticamente ao RS. A projeção da CNseg de até R$ 8 bi em indenizações (set/2024) também foi lida (CQCS). **Não somar** as linhas: avaliação de dano, declaração municipal, seguro (que já é parte do dano privado), crédito do BID, suspensão de dívida e gasto público medem coisas distintas, e parte é empréstimo. Faltam o relatório completo do BID/CEPAL/Banco Mundial (necessidades de reconstrução), FGV, microdados da Susep e uma média anual oficial do S2iD/MIDR; nada disso entra.

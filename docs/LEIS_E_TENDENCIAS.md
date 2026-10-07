# Leis matemáticas e tendências tecnológicas (horizonte 2026–2040)

Compilado em 2026-10-06 junto com `web/public/data/leis_tecnologicas.json` (27 leis/modelos, 11 tendências). **Leis empíricas descrevem o passado; não são previsão do modelo macro e nenhum número aqui alimenta o modelo sem passar por calibração.**

**Critério de verificação.** `verificado: true` só quando a página da fonte foi aberta (ou o DOI conferido no Crossref: título, autor, ano) nesta compilação. Números que vieram de resumo de busca ou de imprensa (ABSOLAR, ABVE, BCB, IBGE, IEA, IRENA, WIR, Gartner, NHGRI) e valores lembrados de memória (expoentes de Kaplan, p e q de Bass, taxas de Wright/Swanson, Kryder, Haitz) ficam `verificado: false`. Resultado: 44 parâmetros empíricos, 19 verificados; 71 referências (com repetições entre itens), 39 verificadas.

## 1. Leis e modelos (fórmulas)

| Lei | Fórmula | Parâmetro atual (fonte) |
|---|---|---|
| Moore (1965) | $N(t)=N_0 2^{(t-t_0)/T}$ | desempenho por dólar de chips de IA +49%/ano desde 2023 (Epoch, verificado) |
| Dennard (1974) | $P/A=\text{const}$ ao escalar $(L,V)\to(L,V)/k$ | fim prático ~2005 (não verificado) |
| Wright (1936) | $C(x)=C_1x^{-b},\ LR=1-2^{-b}$ | solar LCOE US$0,417→0,043/kWh, 2010–2024 (IRENA, resumo) |
| Swanson | ~20% de queda por dobra do módulo FV | valor popular, não verificado |
| Baterias | Wright aplicada ao pack | US$108/kWh em 2025; estacionário US$70; BEV US$99 (BNEF, verificado) |
| Eletrolisadores | $LCOH=\frac{CAPEX\cdot CRF+OPEX}{h\eta}+\frac{p_{el}}{\eta}$ | sem número conferido |
| Koomey | $E(t)=E_02^{(t-t_0)/T}$, T≈1,5 ano (1,57 no corpo do artigo de 2011), depois ~2,7 (Koomey e Naffziger, 2015) | GPUs: +34%/ano (dobra em 2,4 anos) desde 2008 (Epoch, verificado) |
| Kryder | densidade areal dobra ~13 meses (auge) | desacelerou; não verificado |
| Metcalfe | $V\propto n^2$ vs. $n\ln n$ (Odlyzko–Tilly) | V ∝ n² é a lei que melhor ajusta Tencent e Facebook entre quatro testadas (resumo lido) |
| Haitz | fluxo ×20 e custo ÷10 por década | não verificado; saturou |
| Carlson | $c(t)=c_0e^{-\lambda t}$ | ~US$95 mi (set/2001)→US$525 por genoma (mai/2022) (tabela do NHGRI, lida) |
| Logística (S) | $N(t)=K/(1+e^{-r(t-t_0)})$ | internet em 93,6% dos domicílios, 2024 (IBGE, Agência de Notícias, página lida) |
| Bass (1969) | $\frac{f}{1-F}=p+qF;\ t^*=\frac{\ln(q/p)}{p+q}$ | p≈0,03, q≈0,38 (meta-análise; reportado por trabalho posterior que a cita; tabela original não aberta). **Não ajustamos Bass a dados brasileiros** |
| Kaplan (2020) | $L(N)=(N_c/N)^{\alpha_N}$ | lei de potência em >7 ordens de grandeza (arXiv, verificado) |
| Chinchilla (2022) | $L=E+A/N^\alpha+B/D^\beta,\ C\approx6ND$ | 70B com 4× dados superou Gopher 280B (arXiv, verificado) |
| Compute de IA | $C(t)=C_0g^t$ | 5×/ano (treino), 3,5×/ano (custo), desde 2020 (Epoch, verificado) |
| Preço de inferência | $p(t)=p_0k^{-t}$ | 9× a 900×/ano a desempenho fixo (Epoch, verificado) |
| Amara; hype (Gartner) | qualitativas | posições anuais são opinião de analistas |
| Baumol | $\dot c_s/c_s=g_{a_p}-g_{a_s}$ | sem parâmetro |
| Jevons | $\varepsilon<-1\Rightarrow$ consumo total sobe | data centers 415 TWh (2024) → ~945 TWh (2030), IEA (resumo) |
| Solow | $\dot k=sk^\alpha-(n+\delta+g)k$ | sem parâmetro |
| Romer | $\dot A=\delta H_AA^\phi$ | ideias mais difíceis de achar (Bloom et al.; resumo lido: >18× mais pesquisadores para a Lei de Moore que no início dos anos 1970) |
| Tarefas (Acemoglu–Restrepo) | $\Delta\ln TFP\approx s\cdot\overline{\text{economia}}$ | ≤0,66% em 10 anos nos EUA (resumo lido no NBER) |
| Exposição a IA | $E=\sum_ow_o\mathbb 1[e_o>\tau]$ | FMI ~40% global; OIT 25% com alguma exposição; Brasil 29,6% (verificados) |
| Kurzweil | $\frac{d}{dt}\ln P=r(t),\ r'>0$ | hipótese contestada (Nordhaus 2021) |
| Pareto/Zipf | $P(X>x)=(x_m/x)^\alpha$ | Brasil: 10% mais ricos ~59% da renda (WIR 2026, resumo) |

### Números mais importantes, lidos nas fontes
- **Epoch AI (painel de 05/02/2026):** compute de treino de modelos de fronteira 5×/ano desde 2020 (~10.000× no total); custo de treino 3,5×/ano; estoque de compute 3,4×/ano desde 2022; data center de gigawatt ~2,1 anos para construir.
- **Epoch (preço):** a queda do preço de inferência varia de 9× a 900× por ano conforme o marco; os autores avisam que não se sabe se as taxas maiores vão persistir.
- **BNEF (09/12/2025):** pack médio US$108/kWh (−8%), estacionário US$70 (−45%), LFP US$81, NMC US$128, China US$84.
- **FMI (jan/2024):** ~40% do emprego global exposto; ~60% nas avançadas; 40% nas emergentes; 26% nos países de baixa renda; nas avançadas, metade dos expostos tende a ganhar e metade a perder.
- **OIT (mai/2025):** 1 em 4 trabalhadores com alguma exposição à IA generativa; 3,3% na categoria mais alta; 34% do emprego em países de renda alta vs. 11% em renda baixa.
- **FGV IBRE (Duque, 27/04/2026):** 29,6% dos ocupados brasileiros (~30 milhões, 3º tri/2025) com alguma exposição, ~5,2 milhões com a mais alta; efeito detectado concentrado em jovens de 18 a 29 anos (menos emprego e renda), nos dados de 2022–2025.

Brasil, lidos em matérias de imprensa que citam a fonte (a fonte primária não foi aberta): solar ~55 GW em mar/2025 (22,2% da capacidade; Canal Solar/ABSOLAR; matéria de 21/03/2025, já superada por valores maiores em 2026); 223.912 eletrificados leves em 2025 (9% das vendas; Conexão Tocantins/ABVE); internet em 93,6% dos domicílios em 2024 (IBGE, página lida); Pix com recorde de 318,1 milhões de transações em 04/09/2026, R$ 186,9 bi no dia (GiroNews/BC). Corrigido em 2026-10-07: o custo do genoma era dado como US$500-1.000 em 2022 e é US$525 na tabela do NHGRI; a eficiência de computação recente dobra em ~2,7 anos (não ~2,5).

## 2. Quando cada lei falha

| Lei | Falha quando | Sinal de ruptura |
|---|---|---|
| Moore/Dennard | tensão não cai mais; custo por transistor sobe; calor | clock parado desde ~2005; custo de fab; geopolítica de Taiwan/exportação |
| Wright/Swanson/baterias | insumo sobe; sobrecapacidade acaba; tecnologia não modular | preço de lítio/polissilício sobe; fábricas fecham; hidrogênio fica caro |
| Koomey | ganhos de eficiência são anulados por demanda (Jevons) | eficiência melhora mas TWh de data centers dobra |
| Kryder/Haitz | limite físico | crescimento anual cai para dezena de % |
| Carlson | custo de análise domina o de leitura | queda de custo de leitura sem queda do custo clínico |
| Metcalfe | rede saturada, valor heterogêneo | receita por usuário estagna ($n\ln n$ ajusta melhor) |
| Logística/Bass | teto K muda; oferta restrita; ajuste feito antes do pico | previsões revistas a cada ano |
| Kaplan/Chinchilla | falta de dados; perda ≠ capacidade; mudança de paradigma | platôs de benchmarks; mais gasto em inferência que em treino |
| Compute de IA | capital, energia, chips, dados | atrasos em data centers; revisão de capex |
| Amara/Gartner | uso como previsão | — (não têm poder preditivo) |
| Baumol | serviços ganham produtividade (IA) | custo relativo de saúde/educação cai |
| Jevons | demanda saturada | consumo cai com eficiência |
| Solow/Romer | instituições e capital humano ausentes | convergência não ocorre |
| Tarefas/exposição | exposição ≠ adoção; elasticidade desconhecida | desemprego setorial sem queda de exposição |
| Kurzweil | gargalos físicos e econômicos | crescimento do PIB não acelera (Nordhaus 2021) |
| Pareto/Zipf | dados de topo ruins; lognormal ajusta igual | expoente muda com política |

## 3. Tendências (resumo)
Cada tendência no JSON tem horizonte, evidência, incerteza, impacto econômico plausível (sem número inventado), classes afetadas e alavanca do modelo macro (`supply_reform`, `institutional_risk`, `bc_erosion`, `primary_target`, `fiscal_credibility`):

1. Solar/eólica — forte até 2035; gargalo é rede, curtailment, regra de GD; `supply_reform`.
2. Baterias e VEs — 2026–2040; pressão sobre cadeia automotiva e arrecadação de combustíveis.
3. Hidrogênio verde — incerto, pouco efeito antes de 2030.
4. IA generativa e agentes — adoção 2026–2032; jovens e trabalho de escritório; `supply_reform` se a difusão for ampla.
5. Energia de data centers — oportunidade e risco de rede/tarifa.
6. Biotecnologia e agro — produtividade rural e bioeconomia.
7. Fibra/5G/satélites — fecha a lacuna rural.
8. Pagamentos instantâneos — custo de transação; risco institucional do BCB.
9. Computação quântica — incerteza; sem alavanca de produtividade no horizonte.
10. Robótica — depois de 2030.
11. Concentração e cauda de poder de mercado — `primary_target`, `fiscal_credibility`.

Acemoglu estima ganhos modestos de produtividade total com IA (≤0,66% em 10 anos nos EUA; resumo lido no NBER). Isso é um limite conservador de referência para `supply_reform`, não uma previsão para o Brasil.

## 4. O que a matemática não prevê
- **Rupturas.** Curvas exponenciais mudam de regime sem aviso (fim de Dennard, platôs de custo). Extrapolar mais que poucos anos é especulação.
- **Política.** Tarifas de importação, regras de GD, regulação de IA (PL 2338/2023 em tramitação), tributação de combustíveis e política industrial decidem quem captura os ganhos. Nenhuma lei de aprendizado fixa isso.
- **Energia.** Computação de IA e eletrificação disputam transmissão e geração. Matriz limpa é vantagem só se a rede e os preços permitirem.
- **Geopolítica.** Controles de exportação de chips, concentração de fabricação, sobrecapacidade chinesa e câmbio determinam o preço que o Brasil paga.
- **Instituições e juros.** Juro real alto encarece tecnologias intensivas em capital; risco institucional afeta investimento (alavancas `institutional_risk`, `bc_erosion`).
- **Distribuição.** Exposição técnica não é desemprego nem desigualdade; depende de complementaridade, informalidade, proteção social e concentração (leis de potência).
- **Narrativas.** Amara, hype e Kurzweil servem como lembrete de viés, não como modelo.

## 5. O que ficou não verificado
Rodada de 2026-10-07: foram abertos e lidos Moore (1975, PDF), Kaplan e Chinchilla (arXiv), Acemoglu (NBER), Bloom et al. (resumo), Zhang et al. (resumo), Koomey e Naffziger (2015), a tabela de custo de sequenciamento do NHGRI e a página do IBGE (PNAD TIC) e as matérias de imprensa citadas para ABSOLAR, ABVE e Pix. Seguem **não verificados** (motivo entre parênteses): IRENA, IEA (energia e IA, hidrogênio) e Gartner (403 ou verificação anti-bot) e OCDE (a página de PISA abre, mas as médias 379 e 472 estão só em figura); expoentes de Swanson, Kryder (13 meses, texto cortado) e Haitz (20×/10× por década, só no corpo do artigo); p e q de Bass (tabela de Sultan et al. não aberta); usuários do Pix em 2020-2021 e o trimestre abr-jun/2026 (22,93 bi de transações; a API do BCB falhou na paginação); OIT-Brasil (5,4%, 31,3 milhões); WIR/WID 2026 (só imprensa); eletrolisadores (sem número); computação quântica (sem fonte); Baumol (1967) e Kurzweil (2005) sem texto aberto. Antes de usar qualquer número como entrada de cenário, abrir a fonte.

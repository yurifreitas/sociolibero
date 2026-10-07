# Quebras estruturais nas séries históricas brasileiras

Módulo `src/sociolibero/quebras.py` · CLI `uv run sociolibero quebras build [--rapido] [--reusar]` · saída `web/public/data/quebras.json` · testes `tests/test_quebras.py`.

**Resumo em uma frase.** Com séries anuais de 20 a 200 pontos, persistência alta e tendência, um detector de quebra honesto tem pouco poder; o procedimento aqui só aceita o que sobrevive a um nulo calibrado e a controle de multiplicidade, e das 18 séries testadas só **2 quebras não metodológicas** sobreviveram, nenhuma delas com explicação histórica que o teste consiga sustentar.

Toda a validação usa dados 100% sintéticos com verdade conhecida (`eleicoes/forensics/synthetic.py` é o modelo de espírito). Os números abaixo vêm do `quebras.json` gerado em 2026-10-06 (semente 2026; 300 simulações por célula de nulo, 200 por célula de poder).

## 1. Método

### 1.1 Detectores implementados (NumPy/SciPy, sem dependência nova; `ruptures` não está instalado e não foi usado)

| Detector | Tipo | O que mede |
|---|---|---|
| sup-F / Quandt-Andrews, degrau | offline | mudança de média (com tendência linear como incômodo) |
| sup-F, dobradiça contínua | offline | mudança de inclinação |
| sup-LR de variância | offline | LR gaussiana das inovações pré-branqueadas (**rejeitada**, ver 3.2) |
| CUSUM de quadrados com variância de longo prazo (HAC) | offline | mudança de variância robusta a cauda pesada e volatilidade em grupos (Sansó-Aragó-Carrión) |
| OLS-CUSUM | offline | desvio acumulado de resíduos |
| Bayes factor com mistura uniforme sobre τ | offline | `ln BF = logsumexp(F_τ/2 - ½ ln n_ef) - ln T` (equivale a um exp-F de Andrews-Ploberger com penalidade BIC); a posterior sobre τ dá o intervalo |
| Segmentação ótima MDL/BIC | offline | programação dinâmica O(n²), penalidade `c·2σ²·ln n` por quebra; versão crua (c=1) e calibrada contra o nulo |
| Page-CUSUM, Shiryaev-Roberts (mistura em δ), BOCPD (Adams & MacKay, Normal-Gama) | online | alarme sequencial; só usam o passado |
| Oráculo com τ conhecido | referência | um único candidato, sem varredura: é o teto de poder |

Não implementei Bayesian Blocks: a série anual não é um processo de pontos, e o BOCPD cobre a necessidade bayesiana online.

### 1.2 Calibração: nulo por simulação, não tabela

As estatísticas de varredura são invariantes a média, tendência e escala, então o nulo depende só de `(n, φ̂)`. O p-valor vem de **bootstrap paramétrico AR(1)**: simula-se a série com o φ̂ da própria série e **reestima-se φ̂ em cada réplica**, de modo que o nulo replica o procedimento inteiro (inclusive a incerteza de φ̂), não só o valor crítico. Em dados reais usa-se `n` exato e B = 10 000 (refino para 50 000 quando o p bruto fica abaixo de 0,01, porque o Holm exige p minúsculo). Em validação, `n` e `φ̂` são agrupados (n em múltiplos de 5, φ̂ em passos de 0,05) para reutilizar tabelas.

A variância de longo prazo do AR(1) entra como razão `(1+φ̂)/(1-φ̂)`. Há três estimadores de φ̂ comparados na validação:

- `ols`: lag-1 do resíduo de tendência. Quando há quebra, ela infla φ̂, o que deflaciona a estatística (o poder cai **quando a quebra cresce**).
- `diff`: `γΔ(2)/γΔ(1)`, robusto a um degrau mas ruidoso.
- `alt`: φ̂ e σ̂² reestimados sob a alternativa (melhor degrau ou dobradiça). O bootstrap replica esse passo.

Detectores sem bootstrap (BOCPD, Page, SR, MDL calibrado) são calibrados por posto contra um nulo simulado (mistura de φ em 0, 0,5, 0,8), ao estilo da calibração por posto contra o nulo do adia.

### 1.3 Procedimento final (escolhido pela validação)

1. **Transformação a priori**: log se a série é positiva com amplitude acima de 5x. **Modo diferença** (analisa a primeira diferença) se φ̂ (OLS, resíduo de tendência) passa de 0,7. Em diferença, os três testes viram: degrau na média da diferença (mudança de crescimento, rotulado `tendencia`), variância e **salto isolado** (`media`, mudança de nível entre dois anos), este último com escala local (mediana e MAD de 20 vizinhos).
2. Em cada segmento: p do degrau, da dobradiça e da variância (HAC); p do nó = `min(1, 3·min p)` (Bonferroni entre os 3 tipos).
3. **Segmentação binária**: se `p_nó < 0,05`, divide em τ̂ e repete nos dois lados (segmentos com 14 pontos ou mais).
4. **Holm sobre todos os nós testados de todas as séries** (também os não significativos). O BH (`q_bh`) fica registrado.
5. φ̂ do tipo `ols` para n abaixo do corte e `alt` acima (corte = 30, ver 3.1).
6. Intervalo de τ: posterior de perfil `∝ exp(F_τ/2/T)` com temperagem T = 0,5, escolhida pela cobertura sintética (ver 3.6), intervalo central de 90%.

As escolhas (variância HAC em vez de LR, limiar 0,7, janela 10 do salto, φ̂ por n) vêm de rodadas sintéticas gravadas em `validacao.escolhas_previas` e `validacao.procedimento_final`; nenhuma usou as séries reais.

## 2. Regras de rigor aplicadas

- **Nulo antes da detecção.** Sete nulos: AR(1) com φ = 0, 0,5, 0,8; AR(1) com tendência; ARCH(1) (heterocedasticidade); 2% de outliers de 5σ; passeio aleatório com deriva (I(1)).
- **Sem vazamento do futuro.** Os detectores online estimam φ, média e σ só na janela inicial (20% da série, mínimo 10); `tests/test_quebras.py::test_online_usa_so_o_passado` altera o futuro e checa que o caminho anterior não muda.
- **Oráculo como teto**, varredura de τ como custo.
- **Múltiplas réplicas e piso de ruído**: 200-300 simulações por célula (erro padrão de ~1,5 p.p. no FPR de 5%); diferenças menores que isso não são lidas como ganho (a escolha do limiar de modo, p. ex., não usa a diferença de 0,5 p.p. de poder médio).
- **A régua local superestima**: o poder da validação é teto para as séries reais, que violam AR(1) gaussiano, linearidade da tendência e quebra única.
- **Séries reais não escolhem nada.** O controle metodológico (3.7) só mede.

## 3. Validação sintética

### 3.1 Taxa de falso positivo (α = 0,05)

Procedimento final (`final_*`: FPR de pelo menos uma quebra aceita após Holm dentro da série):

| nulo | n=20 | n=30 | n=50 | n=100 | n=200 |
|---|---|---|---|---|---|
| AR(1), φ=0,5 (`ols` / `alt`) | .01 / .14 | .00 / .05 | .01 / .02 | .02 / .02 | .01 / .02 |
| AR(1), φ=0,8 | .03 / .17 | .00 / .12 | .01 / .07 | .01 / .06 | .02 / .02 |
| AR(1) + tendência | .04 / .13 | .01 / .09 | .01 / .03 | .00 / .02 | .01 / .01 |
| ARCH(1) | .03 / .15 | .01 / .06 | .01 / .04 | .04 / .05 | .02 / .02 |
| outliers 2%, 5σ | .02 / .08 | .02 / .07 | .02 / .03 | .01 / .01 | .02 / .02 |
| passeio aleatório (I(1)) | .01 / .29 | .01 / .24 | .01 / .18 | .02 / .08 | .02 / .02 |

(valores arredondados do `quebras.json`; ver `validacao.nulo` para todos os detectores.) Leituras:

- O `alt` tem FPR acima do nominal para n ≤ 30 (0,07-0,29): φ̂ reestimado após ajustar a melhor quebra é enviesado para baixo e o bootstrap parte desse φ̂. Por isso a regra de escolha **por n** usa `ols` até n < 30 e `alt` de 30 em diante. Mas o `ols` abaixo de 30 tem poder de 3% a 4%: **para n < 30 o procedimento é cego**.
- Em I(1), o FPR do procedimento fica em 0,08 (n=100) e 0,18 (n=50) mesmo com o modo diferença; para n curto, passeio aleatório gera quebras espúrias.
- Com FPR de 7% a 18% nos nulos mais difíceis, **o Holm entre séries não é garantia de 5%** (ver 3.4).

Os detectores concorrentes mostram **o que a validação tira da mesa**:

| detector | FPR AR(1), n>=50 | FPR ARCH/outliers, n>=50 | FPR I(1), n>=50 |
|---|---|---|---|
| sup-F degrau, `ols` | .01-.07 | .04-.07 | .00-.01 |
| sup-F degrau, `diff` | .07-.36 | .12-.21 | .28-.34 |
| sup-F degrau, **sem tendência** | .00-.83 | .05-.08 | **.00-.74** |
| variância LR gaussiana | .03-.07 | **.36-.78** | .03-.08 |
| variância HAC (escolhida) | .04-.07 | .02-.04 | .03-.09 |
| MDL/BIC cru (c=1) | **.13-.60** | **.49-.79** | **.74-.95** |
| MDL/BIC calibrado | .00-.18 | .00-.05 | .34-.85 |
| Page / Shiryaev-Roberts | .00-.63 | .01-.14 | **.83-.98** |
| BOCPD | .00-.10 | **.17-.88** | .02-.09 |

Em AR(1) com tendência, o degrau **sem** tendência como incômodo passa de FPR 0,23 (n=50) para 0,61 (n=100) e 0,83 (n=200): é a quebra espúria por tendência, e cresce com n. O mesmo vale para Page e SR (0,15, 0,32, 0,63) e para o MDL cru (0,44-0,60). O teste de média com tendência linear modelada fica em 0,02-0,07.

### 3.2 Poder por magnitude (n = 30 a 200, quebra em n/2, AR(1) φ=0,5 com tendência incômoda)

Magnitudes: média = salto em desvios marginais; variância = razão de desvios das inovações; tendência = deriva extra acumulada ao fim da série, em desvios marginais. TPR do procedimento final (`final_alt`):

| tipo | magnitude | n=30 | n=50 | n=100 | n=200 |
|---|---|---|---|---|---|
| média | 1,5σ | .12 | .06 | .06 | .23 |
| média | 3σ | .16 | .17 | .55 | .96 |
| média | 5σ | .41 | .67 | .97 | 1,00 |
| média | 8σ | .79 | .96 | 1,00 | 1,00 |
| tendência | 2σ / 4σ / 7σ / 12σ | .10/.30/.60/.86 | .09/.29/.68/.96 | .10/.55/.96/1,00 | .26/.87/1,00/1,00 |
| variância | sd ×1,5 / ×2 / ×3 / ×5 | .06/.12/.16/.20 | .07/.14/.33/.49 | .19/.59/.84/.94 | .66/.98/1,00/1,00 |

Um salto de 3 desvios marginais, que seria óbvio a olho, só é detectado em 17% das vezes com 50 pontos. Duas razões medidas: (i) a tendência linear como incômodo é quase colinear com um degrau no meio da amostra (a parte do degrau ortogonal à reta é pequena); (ii) o ganho de poder do `alt` sobre o `ols` é grande (n=50, 5σ: 0,88 contra 0,44 no sup-F isolado).

O poder do final fica abaixo do sup-F isolado por causa do Bonferroni entre os 3 tipos e do Holm. Isso é o preço do FPR controlado.

### 3.3 Atraso de detecção

- **Offline** (40 anos antes da quebra, série truncada `m` anos depois; `validacao.atraso_offline`): salto de 5σ, TPR 0,63 com 3 anos de dados novos, 0,78 com 8, 0,92 com 40; salto de 8σ, 0,97 já com 3 anos. **Mudança de inclinação de 7σ**: 0,02 (3 anos), 0,07 (12), 0,28 (20), 0,86 (40): a mudança de tendência só é vista depois de décadas. Variância ×3: 0,15 (3), 0,21 (8), 0,55 (20), 0,69 (40).
- **Online** (n=100, quebra de média, `validacao.atraso`): BOCPD alarma quase no mesmo ano (mediana 0-3 anos) mas só detecta 32% dos saltos de 3σ e 82% dos de 5σ; Page e SR detectam mais (75% e 98%) com atraso mediano de 22 e 13 anos (3σ e 5σ). São cegos a tendência e a variância: BOCPD, p. ex., detecta variância ×3 em 42% e tendência em 5%.

### 3.4 Multiplicidade

Séries nulas independentes (n=50, 100 repetições; erro padrão ~3 p.p.): 1 série, FWER sem correção 0,08 e com Holm 0,04; 10 séries, 0,45 e 0,07; 25 séries, 0,79 e 0,11. O Holm contém o grosso do inchaço, mas **com 25 séries o FWER medido (0,11) passa de 0,05**: o p de cada nó não é exatamente nominal (7% em alguns nulos de n curto).

### 3.5 Bordas e múltiplas quebras

- Quebra de média de 5σ perto das bordas (10% e 90% da série, n=100): final com TPR 0,99 e 0,98 e erro de τ nulo. Quebra de **tendência** a 10% da série (7σ): TPR 0,03 (a quebra nem é vista); a 25%: 0,28; a 75%: 0,99. Variância ×3 a 10% e 90%: 0,02 e 0,20. Online: o BOCPD com quebra a 10% falha (0,00) porque a janela inicial (20%) contém a quebra.
- **Duas quebras** (6σ, n=50 a 200, `validacao.duas_quebras`): pulso (sobe e volta) detectado exatamente duas vezes em 15-16% (n=50, 100) e 3% (n=200); **escada** (dois saltos de mesmo sinal): 0,5% a 3,5%, e 70% a 89% das vezes **nenhuma** quebra. A escada é quase colinear com a tendência linear incômoda e o sup-F é um teste de quebra única. Com mais de uma quebra, **o procedimento subestima**.

### 3.6 Intervalo de τ

Cobertura do intervalo de 90% medida só nas simulações em que o teste correspondente disparou (seleção). Com T = 0,5, a média das células dá 0,98 (média), 0,93 (tendência) e 1,00 (variância), mas a **pior célula** cobre apenas 0,82 (média), 0,69 (tendência): os intervalos são bons para quebra grande e subcobrem a de magnitude fraca. A mudança de inclinação é a que o intervalo menos delimita.

### 3.7 Oráculo (τ conhecido)

| tipo | n | magnitude | oráculo | sup-F, τ desconhecido |
|---|---|---|---|---|
| média | 50 | 3σ | .84 | .24 |
| média | 50 | 5σ | .995 | .46 |
| média | 100 | 1,5σ | .59 | .20 |
| média | 100 | 3σ | .99 | .80 |
| tendência | 50 | 7σ | .70 | .34 |
| tendência | 100 | 4σ | .87 | .79 |
| variância | 50 | 2× | .92 | .80 |
| variância | 100 | 1,5× | .80 | .62 |

O custo de não saber τ vale até 60 pontos percentuais de poder (n=50, 5σ: 0,995 contra 0,46). Saber a data de um evento (Real 1994, EC 95) tem valor estatístico: testar uma data fixada **antes** olhar os dados tem muito mais poder que varrer. Mas aqui as datas históricas não foram pré-especificadas por série, e testar todas elas voltaria a ser varredura.

### 3.8 Limiar do modo diferença

Varredura em `validacao.escolhas_previas.modo_diferenca` (FPR do final em AR(1) φ=0,8 e passeio aleatório n=100; poder em saltos de média, tendência e variância): limiar 0,6: 0,05 e 0,015; **0,7: 0,06 e 0,09 (escolhido, o maior limiar que mantém FPR ≤ 0,08 e ≤ 0,10)**; 0,8: 0,04 e 0,20; 0,9: 0,04 e 0,23. O poder médio é praticamente igual (0,72-0,73). Diferenciar custa poder, então a regra pega o maior limiar admissível.

Dentro do modo diferença (passeio aleatório com deriva, n=100): FPR 0,07; salto de 14 desvios da diferença detectado 100%, de 8 desvios 57%; mudança de deriva de 1 desvio 89%; com incrementos de **cauda pesada (t com 3 g.l.)** o FPR sobe a 0,40. A janela do teste de salto (`escolhas_previas.salto_escala_local`) vem de uma varredura: janela 10 dá FPR 0,05 (ruído branco), 0,11 (regime volátil) e poder 0,89 em um salto de 8σ; escala global dá poder 1,0 mas FPR 0,93 em regime volátil.

## 4. Séries reais

Fonte: `web/public/data/series_historicas.json`. Cada série usa o **maior trecho de anos consecutivos** (sem interpolar) e entra se tiver pelo menos 20 anos seguidos: 18 séries testadas, 12 em `meta.lacunas` (Gini, desocupação, pobreza Ipea e IBGE, insegurança alimentar, analfabetismo, tráfico por década). Total de 31 nós testados.

**Poder.** Para n de 20 a 50 o poder médio do procedimento (tabela 3.2, todas as magnitudes) fica em 0,04 a 0,41; `poder_validado` e `poder_baixo` no JSON dão o valor por série. **Ausência de quebra nessas séries não é evidência de ausência.** Das 14 séries sem quebra detectada, 11 têm `poder_baixo` (poder médio abaixo de 0,5).

**Quebras que sobreviveram ao Holm (4):**

| série | ano | intervalo 90% | tipo | p ajustado | metodológica? |
|---|---|---|---|---|---|
| PIB real (nível encadeado) | 1949 | 1927-1997 | variância | 0,037 | **sim** (mudança de fonte do SCN em 1948) |
| PIB: variação real anual | 1949 | 1927-1996 | variância | 0,026 | **sim** (idem) |
| Expectativa de vida (OWID) | 2016 | 2016-2016 | média (degrau) | 0,002 | não declarada |
| Africanos desembarcados por ano | 1700 | 1697-1722 | tendência | 0,016 | não |

Sugestiva (BH q < 0,05, **não** passa Holm, não conta): PIB real, 1981, tendência (q = 0,02).

- **Expectativa de vida 2016.** A série (ONU WPP 2024) sobe 0,25-0,35 ano por ano e cai 0,03 em 2016, depois cai 1,3 e 1,5 em 2020-2021 (pandemia). A estatística (F=90) é enorme porque o resíduo de tendência linear é minúsculo, e o intervalo colapsa em um ano. O degrau de 2016 captura curvatura e a pandemia, não um choque de 2016. Trato como **sinal de má especificação** (tendência linear), não como evento.
- **Tráfico negreiro 1700.** Contagens ruidosas com ciclo (pico de 11 963 em 1698 e vales até 1705): o modelo de tendência linear não representa o ciclo. Dados esparsos antes de 1690 (`pontos` com buracos).
- **PIB 1949.** O Holm aceita só porque a quebra de variância da série encadeada coincide com a troca de fonte (SCN 1948). O 1949 é um erro de um ano da data metodológica 1948; está dentro da tolerância de ±1 ano e **não conta como quebra econômica**.

### Controle metodológico

As `quebras` já registradas em `series_historicas.json` (14 anos dentro da janela testável) servem de gabarito: o detector deve achar os artefatos.

- Recuperados após Holm: **2 de 14** (PIB nível e PIB variação, 1948). Esperado por acaso, dado o nº de quebras aceitas: 0,23.
- **Não recuperados**: IPCA 1994 (nova moeda), salário mínimo 1984, homicídios 1996 (CID-9 para CID-10) nas duas séries, PRODES 1994, PIB 1921, 1991, 1996, 2001. Alguns são degraus pequenos perto do ruído (CID, PIB 1996), outros ficam sem poder: IPCA tem n=46 e poder médio de 0,41.
- Conclusão: **o detector acha artefatos grandes e perde artefatos pequenos**; a ausência de uma quebra detectada **não** valida o dado como homogêneo. E as 2 quebras econômicas que sobraram não estão marcadas porque, na prática, o detector ainda é fraco para localizar qualquer coisa.

## 5. Cruzamento com a história

Datas históricas (`economia_historica.json`: `mudancas_drasticas` dos ciclos, 47 anos distintos; `historia.json`: eventos de categoria economia, crise, constituição, golpe e abertura; total 71 anos distintos; com todos os eventos, 93).

Das **2 quebras não metodológicas**, 1 cai a até 2 anos de uma data histórica (expectativa de vida 2016: Lava Jato, impeachment de 2016, EC 95). O esperado por acaso é 1,22 e o **p de permutação é 1,00**.

O teste mantém o número de quebras por série e sorteia seus anos uniformemente dentro do intervalo testável; 20 000 permutações. A sensibilidade (`cruzamento_historia.sensibilidade`) varia o conjunto e a tolerância:

| conjunto de datas | tolerância | coincidências | esperado por acaso | p |
|---|---|---|---|---|
| só mudanças drásticas | 0 | 1 | 0,35 | 0,34 |
| só mudanças drásticas | 2 | 1 | 1,11 | 0,95 |
| mudanças + eventos de ruptura (primário) | 2 | 1 | 1,22 | 1,00 |
| todos os eventos de história | 2 | 1 | 1,28 | 1,00 |

Uma fração de **81% dos anos do período testado** está a ≤ 2 anos de alguma data histórica (53% com todos os eventos e tolerância 0): datas históricas densas fazem quase toda quebra "coincidir". Com n=2 quebras não há poder para testar o cruzamento.

**Coincidência não é causa**, mesmo quando o p fosse pequeno: uma quebra estatística aponta onde a série mudou, não por quê. E muitas quebras são artefato de mudança metodológica; por isso as quebras dentro de ±1 ano de uma `quebra` registrada **não** entram no cruzamento (`artefato_metodologico: true`).

## 6. Limites

1. **Poder baixo e FPR inflado em n curto**: n < 30 não tem poder (3-4%); `alt` com n ≤ 30 tem FPR 0,07-0,29.
2. **I(1) e tendência**: passeio aleatório curto gera quebras espúrias (FPR 0,18 em n=50 mesmo após o modo diferença); a decisão entre I(1) e quebra de tendência (problema de Perron) não é resolvida por um limiar.
3. **Tendência linear e quebra única**: séries com curvatura ou ciclo geram quebras (expectativa de vida, tráfico); duas quebras se confundem com tendência.
4. **Cauda pesada em diferenças**: o teste de salto sobe a 0,40-0,57 de FPR com t de 3 g.l. (outliers viram "saltos").
5. **Os nulos são sintéticos**: o FPR real pode ser maior (heterogeneidade legítima, medições revisadas, estimativas do próprio instituto).
6. **Séries não independentes**: PIB nível e PIB variação são a mesma informação; as 4 quebras que sobreviveram são 3 achados independentes, e a correlação entre séries ignora o Holm.
7. **Sem causalidade** e **sem explicação**: não há modelo de por que a série mudou.
8. **Poder é teto**: o poder real nas séries reais é menor que o da tabela 3.2 (que usa AR(1) gaussiano com a quebra no meio).

## 7. Cemitério (o que tentei e falhou)

| # | Tentativa | Resultado | Lição |
|---|---|---|---|
| 1 | Degrau de média **sem** tendência como incômodo, ou Page/SR/MDL cru, em séries com tendência | FPR 0,23-0,83 (n=50-200) | tendência gera quebra espúria; modelar a tendência ou não testar |
| 2 | Estatística de variância por LR gaussiana | FPR 0,36-0,78 sob ARCH e outliers | trocada por CUSUM de quadrados HAC (FPR 0,02-0,04), custo de ~3 p.p. de poder |
| 3 | φ̂ por `diff` (`γΔ(2)/γΔ(1)`) para ser robusto ao degrau | FPR 0,07-0,36 (n>=50), 0,28-0,34 em I(1) | estimador ruidoso demais; o nulo em φ̂ pontual subestima a incerteza |
| 4 | φ̂ `ols` puro | conservador e **poder cai quando a quebra cresce** (a quebra infla φ̂) | corrigido com `alt` (φ̂ sob a alternativa), mas `alt` é liberal em n ≤ 30 |
| 5 | Regra de modo diferença com φ̂ sob a alternativa (`alt`) | quase nunca disparava em passeio aleatório (FPR ~0,5) | sob a alternativa o φ̂ do I(1) cai: a quebra e a raiz unitária são indistinguíveis |
| 6 | Regra de modo diferença com limiar 0,85 | FPR do passeio aleatório 0,2 | limiar 0,7 escolhido por varredura |
| 7 | Teste de salto com escala global (MAD) em diferenças | IGP-DI acusou 9 anos consecutivos (1983-1995) e o salário mínimo 4 "saltos" na hiperinflação; FPR 0,93 em regime volátil | escala local (janela 10), custo de poder |
| 8 | Teste de salto recursivo: o salto fica no primeiro ponto do segmento filho | repetiu a mesma quebra até o teto de 12 nós | filhos excluem o ponto do salto |
| 9 | Passeio aleatório sintético começando perto de 0 | log automático distorceu a série (FPR 0,5 falso) | o nulo agora parte de 100; o log é só para amplitude acima de 5x |
| 10 | Bayes factor (BIC) com mistura sobre τ | FPR 0,02-0,08 mas poder bem abaixo do sup-F (n=100, 5σ: 0,77 contra 0,99) | a penalidade BIC e a escala AR(1) cobram caro; mantido só como diagnóstico |
| 11 | OLS-CUSUM | poder pior que sup-F (n=100, 5σ: 0,88 contra 0,99) e cego a mudança de variância | mantido como diagnóstico |
| 12 | MDL/BIC cru (c=1) como detector | FPR 0,13-0,60 mesmo sem tendência e 0,74-0,95 em I(1) | a penalidade BIC pressupõe resíduo independente; calibrar c contra o nulo aproxima um limiar |
| 13 | MDL calibrado em mistura de φ | FPR 0,18 em φ=0,8, 0,34-0,85 em I(1) | calibração por posto contra um nulo só vale perto dele |
| 14 | Page / SR / BOCPD como detectores de quebra de nível | Page/SR: FPR 0,63 com tendência e 0,83-0,98 em I(1); BOCPD: FPR 0,17-0,88 com ARCH/outliers | online não corrige o nulo sem modelar a tendência; e a janela inicial vira ponto cego (quebra a 10%: TPR 0,00) |
| 15 | Procedimento de uma quebra aplicado a duas | escada: 70-89% sem detecção | tendência absorve o degrau duplo |

## 8. Ponte com os aprendizados do adia

O projeto irmão `adia` (competição de quebra estrutural em tempo real, CrunchDAO) acumulou as regras que este módulo herda (`docs/RIGOR_DE_VALIDACAO.md`):

| aprendizado do adia | onde aparece aqui |
|---|---|
| **vazamento do futuro com "fingerprint"**: estatística calculada na janela inteira parecia +0,028 e era vazamento | detectores online estimam φ, média e σ só na janela inicial; teste de causalidade em `test_quebras.py`; e o nulo de φ̂ replica o procedimento inteiro |
| **régua local mente** (holdout local acima do placar) | o poder sintético é teto; as séries reais violam o modelo |
| **calibração por posto contra o nulo** (pivot: score vira quantil contra o nulo da própria série) | todos os p-valores são ranks contra o nulo simulado (bootstrap por série ou nulo agrupado por n) |
| **oráculo com τ conhecido dá o teto** (~0,64 de AUC no adia) | tabela 3.7: custo de não saber τ vale até 60 p.p. |
| **piso de ruído antes de comparar** (variância do seed do TCN ~0,01 maior que metade do gap) | 200-300 réplicas por célula; diferença menor que ~1,5 p.p. no FPR ou ~3 p.p. de poder não é lida como ganho |
| **mínimo de 3 splits** | a escolha do limiar de modo e da janela do salto usa 2 n e vários cenários; não é 3 splits independentes. **Falta** uma validação com semente diferente por escolha |
| **cemitério** do que falhou | seção 7 |
| **detector per-série saturado**: o ganho está na calibração entre séries, não em detector melhor | aqui também: o detector mais sofisticado (BF, BOCPD, MDL) perdeu para sup-F com bootstrap bem calibrado; o ganho veio da calibração (HAC, φ̂, escolha por n) |
| **MDL / regret prequential** | o MDL cru fracassou por falta de calibração; no adia o regret MDL foi 1/3 no gate fiel |
| **ruído de seed não é sinal** | semente fixa (2026) e simulações por célula; o `quebras.json` é determinístico |

## 9. Reprodução

```
uv run sociolibero quebras build            # valida (~15 min, 20 processos), aplica e grava o JSON
uv run sociolibero quebras build --reusar   # reaplica às séries reais com a validação em out/quebras_validacao.json
uv run sociolibero quebras build --rapido   # fumaça (não grava o cache de validação)
uv run pytest -q tests/test_quebras.py
```

Escolhas globais (`PHI_DIFF`, `VAR_KIND`, `TEMPER`, `SPIKE_W`) e o corte por n saem da própria validação e vão para `quebras.json` em `validacao.escolhas_previas`, `validacao.procedimento_final` e `meta.metodo`.

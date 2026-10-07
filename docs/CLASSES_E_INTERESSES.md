# Classes, interesses e regras eleitorais: o que cada grupo ganha e perde, decisões criticadas e o futuro

> Hipótese de leitura, não resultado. Mesmo método para esquerda, centro e direita; sem acusar pessoas; 'interesse' é hipótese teórica, sempre acompanhada da leitura contrária. Dados: `web/public/data/classes_interesses.json` (gerado em 07/10/2026).

## Resumo em números

- **23 classes e grupos**, **17 teorias** (10 com a fonte lida nesta coleta), **79 células** de matriz regra x classe (ganha 27, perde 22, ambíguo 30), **19 decisões criticadas**, **14 itens de futuro**.
- Das 50 linhas 'ganhou/perdeu' das classes, **35** têm o fato lido em fonte aberta; as demais são hipótese ou herdadas do repositório.
- Custos das decisões: contagens lidas 14, contagens não lidas 0; estimativas ou alegações lidas 5, não lidas 0.

## Como ler

1. **Classe** é construção analítica, não grupo de pessoas; as 23 linhas se sobrepõem. **Interesse** é o que o grupo tenderia a preferir dada a base material (hipótese teórica), por exemplo 'proprietário rural tende a preferir regras que mantenham o controle local'. Não descreve preferências medidas.
2. Cada classe traz `base_material`, `interesses` (voto, sistema, financiamento, terra, estado), `aliados`, `ganhou_perdeu` (regra, efeito, evidência, fonte, verificado) e uma `leitura_contraria`. Os itens de reeleição, federalismo, tributos e controle aparecem dentro de 'sistema' e 'estado'.
3. `verificado: true` significa que o número ou fato foi lido numa página ou PDF aberto nesta coleta. Resumos de busca, memória e dados herdados do repositório ficam `false`. **Contagem** (voto, R$ fixado em lei, eleitores) é separada de **estimativa** (indicador, alegação, 'cerca de').
4. A matriz regra x classe usa `ganha`, `perde` e `ambiguo` como julgamento qualitativo, sem peso. Não some células.
5. Cada item de futuro traz status, quem ganha e perde (classes e partidos agregados), evidência comparada, riscos, sinais precoces mensuráveis e o mecanismo na cadeia de Markov e nos anéis do repositório (`aneis.json`, `decisoes.json`). A cadeia tem quatro estados (autocracia fechada, autocracia eleitoral, democracia eleitoral, democracia liberal) e **não modela nenhuma destas regras**; os mapeamentos são hipótese.
6. 'Péssima decisão' é o rótulo do pedido de pesquisa. Aqui significa decisão com custo ou efeito documentado e criticada; cada uma tem a leitura contrária ao lado. Propostas rejeitadas (distritão, voto impresso) entram como risco discutido, não como dano ocorrido.

## Classes e grupos

| id | grupo | base material | linhas ganhou/perdeu (lidas/total) |
|---|---|---|---|
| `escravizados-libertos-negros` | Escravizados, libertos e populações negras | Trabalho cativo até 1888; depois trabalho livre sem terra nem capital inicial (economia_historica.json, classe… | 3/3 |
| `povos-indigenas` | Povos indígenas | Territórios e economia própria; sucessivamente alvo de escambo, cativeiro, aldeamento e tutela (economia_histo… | 2/2 |
| `camponeses-posseiros` | Camponeses e posseiros | Lavradores, agregados e trabalhadores rurais sem título, em estrutura de terra concentrada (economia_historica… | 3/3 |
| `oligarquia-agraria-coroneis` | Oligarquia agrária e coronéis | Propriedade da terra e controle de trabalho cativo e depois dependente; mediação entre o eleitor local e o gov… | 3/3 |
| `burguesia-mercantil-financeira` | Burguesia mercantil e financeira | Comércio de exportação e importação, crédito, bancos e investimento; renda de juros e de intermediação. | 2/2 |
| `burguesia-industrial` | Burguesia industrial | Fábricas, proteção tarifária, crédito subsidiado e demanda interna; dependência de câmbio e de custo do trabal… | 2/2 |
| `classe-media-urbana-funcionalismo` | Classe média urbana, profissionais e funcionalismo | Profissões liberais, bacharéis, servidores e aposentados; renda ligada a escolaridade e emprego público. | 1/3 |
| `operariado-urbano` | Operariado urbano formal e sindicatos | Emprego industrial e de serviços formais; sindicatos oficiais e independentes; CLT (1943) e Justiça do Trabalh… | 3/3 |
| `informais-e-precarizados` | Trabalhadores informais, autônomos e domésticos | Renda fora do contrato formal; domésticas e rurais fora da CLT original; informalidade crescente após os anos… | 2/2 |
| `militares` | Militares (corporação) | Salário e carreira estatais, orçamento de defesa e autonomia institucional; histórico de intervenção política. | 3/3 |
| `igreja-catolica` | Igreja Católica | Rede de paróquias, escolas e obras sociais; padroado no Império; CEBs de base popular nos anos 1970-80. | 1/2 |
| `igrejas-evangelicas` | Igrejas evangélicas | Redes de templos, mídia própria e rendas de contribuição; crescimento populacional de 21,6% (2010) para 26,9%… | 1/2 |
| `mulheres` | Mulheres | Trabalho produtivo e de cuidado; renda menor em média (economia_historica.json); direitos políticos ampliados… | 2/2 |
| `imigrantes` | Imigrantes | Mão de obra de café e indústria; 3,52 milhões entre 1890 e 1929 segundo Wikipédia (repositório); subsídio paul… | 1/1 |
| `oligarquias-estaduais-nordeste` | Elites políticas estaduais do Nordeste | Propriedade rural, redes de clientela, empregos públicos e transferências federais; peso do Nordeste no Senado… | 2/2 |
| `elites-sudeste` | Elites agrárias, industriais e financeiras do Sudeste | Café (SP, RJ, MG), indústria e finanças paulistas e cariocas; hegemonia do 'café com leite' (economia_historic… | 1/2 |
| `agro-agronegocio` | Agro e agronegócio | Exportação de grãos e carnes, crédito rural, terra e tecnologia; boom de commodities 2000s. | 1/2 |
| `trabalhadores-de-aplicativos` | Trabalhadores de aplicativos e plataformas | Renda por tarefa via plataformas digitais; sem vínculo CLT; peso crescente na informalidade pós-2015 (não veri… | 1/1 |
| `idosos-aposentados` | Eleitorado idoso e aposentados | Renda de previdência e de benefícios; peso crescente no eleitorado. | 2/2 |
| `jovens-16-17` | Jovens eleitores (16 e 17 anos) e coortes novas | Estudantes e primeiros empregos; voto facultativo aos 16 desde 1988 (segundo eleicoes_timeline.json). | 2/2 |
| `baixa-renda-transferencias` | Baixa renda beneficiária de transferências (subproletariado) | Renda de trabalho precário somada a Bolsa Família (11,1 milhões de famílias em 2006 e 12,7 milhões em 2010, se… | 1/1 |
| `elite-politica-profissional` | Elite política profissional (parlamentares e direções partidárias) | Mandatos, controle de listas e acesso a fundo público e a emendas. | 3/3 |
| `burocracia-juridica-controle` | Burocracia jurídica e de controle (Judiciário, MP, TCU, Justiça Eleitoral) | Carreiras públicas e competência normativa; Justiça Eleitoral criada em 1932. | 2/2 |

Os interesses por tema, os aliados e a leitura contrária de cada grupo estão no JSON.

## Teorias usadas

| teoria | autor | ano | fonte lida |
|---|---|---|---|
| `marx-engels-classe-estado` | Karl Marx e Friedrich Engels | 1848-1890 | sim (resumo ou texto lido) |
| `weber-classe-estamento-partido` | Max Weber | 1922 (póstumo) | não |
| `gramsci-hegemonia` | Antonio Gramsci | 1929-1935 (Cadernos do Cárcere) | sim |
| `olson-acao-coletiva` | Mancur Olson | 1965 | sim |
| `przeworski-democracia-capitalismo` | Adam Przeworski | 1985; 1991; 2000 | sim |
| `acemoglu-robinson-sufragio` | Daron Acemoglu e James Robinson | 2000 (QJE); 2006 (livro, não lido) | sim (resumo ou texto lido) |
| `boix-democracia-redistribuicao` | Carles Boix | 2003 | sim (resumo ou texto lido) |
| `meltzer-richard` | Allan Meltzer e Scott Richard | 1981 | sim (resumo ou texto lido) |
| `lipset-modernizacao` | Seymour M. Lipset | 1959 | sim |
| `moore-origens-sociais` | Barrington Moore Jr. | 1966 | sim |
| `leal-coronelismo` | Victor Nunes Leal | 1948 (tese) / 1949 (livro) | sim |
| `faoro-donos-do-poder` | Raymundo Faoro | 1958 | sim |
| `carvalho-cidadania` | José Murilo de Carvalho | 2001 | não |
| `nicolau-voto-participacao` | Jairo Nicolau | artigo lido (CES-Coimbra, data não conferida); livro de 2002 (não lido) | sim |
| `abranches-presidencialismo-coalizao` | Sérgio Abranches | 1988 | sim |
| `singer-lulismo` | André Singer | c. 2009-2012 (datas não conferidas) | sim |
| `nobre-imobilismo` | Marcos Nobre | 2013 | não |

Marx e Engels remetem a `marx_capitalismo.json` (textos t01, t02, t15, t16, t26, t60 e teses 07 e 09). O JSON traz, para cada teoria, a aplicação ao Brasil e a leitura contrária.

## Decisões criticadas, com números conferidos

| id | ano | custo ou efeito (tipo) | lido |
|---|---|---|---|
| `lei-de-terras-1850` | 1850 | Lei única de 1850; efeito sobre o acesso à terra não medido em número nas fontes lidas (estimativa) | lido |
| `lei-saraiva-1881` | 1881 | Votantes: 1.100.008 (1873, 10,9% da população) para 142.856 eleitores (1882, 1,2%); queda de 87%. Em eleitores de 2º grau: 20.020 para 142.856, alta de 614%. (contagem) | lido |
| `exclusao-analfabeto-1891` | 1891 | Participação média de 2,3% da população nas eleições presidenciais de 1894-1930; 5% em 1930. (contagem) | lido |
| `voto-aberto-bico-de-pena-1891-1932` | 1891 | Os resultados de 1894 são descritos como impossíveis de determinar 'exatamente' por fraude e coação (eleicoes_timeline.json, página lida lá); fraude 'em larga escala' (Nicolau). (estimativa) | lido |
| `politica-dos-governadores-1898` | 1898 | Vigência de 1898 a 1930 (32 anos); colapso em 1930 por divergência entre SP e MG. (contagem) | lido |
| `estado-novo-1937` | 1937 | Congresso fechado em 10/11/1937; partidos extintos em 02/12/1937; nenhuma eleição até dezembro de 1945; plebiscito previsto nunca convocado. (contagem) | lido |
| `ai2-bipartidarismo-1965` | 1965 | Partidos: de múltiplos para 2; STF: 11 para 16; vigência até 15/03/1967. (contagem) | lido |
| `cassacoes-e-inelegibilidades-1964` | 1964 | Cerca de 3.535 atos punitivos até outubro de 1965 (Wikipédia); 173 deputados federais cassados de 1964 a 1977 (resumo de busca, não verificado). (contagem) | lido |
| `lei-falcao-1976` | 1976 | Lei 6.339/76; vigência de 1976 a 1984. (contagem) | lido |
| `pacote-de-abril-1977` | 1977 | 13/04/1977; quórum de emenda de 2/3 para maioria absoluta (verbete; eleicoes_timeline.json diz 'maioria simples'); na renovação de 2/3 do Senado em 1978, uma das duas vagas de cada estado renovado (22 vagas) por eleição indireta, e a ARENA levou 21 (EC 8, art. 41 §2, lida no Planalto; Wikipédia). (contagem) | lido |
| `emenda-dante-de-oliveira-1984` | 1984 | 298 sim, 65 não, 3 abstenções e 113 ausentes; 320 necessários (2/3 de 480). (contagem) | lido |
| `reeleicao-1997` | 1997 | R$ 200 mil em dinheiro, segundo gravações de dois deputados publicadas pela Folha em 13/05/1997 (alegação); os dois renunciaram em 21/05/1997; Senado aprovou em 2º turno em 04/06/1997; Câmara em 28/01/1997 por 336 x 17 x 6 (resumo de busca). (estimativa) | lido |
| `financiamento-empresarial-ate-2015` | 2015 | Em 2014, empresas doaram cerca de R$ 3 bi (aproximadamente 80% das doações) e pessoas físicas R$ 552,5 mi; doações do 1º turno de 2016 caem 65% (de R$ 7,2 bi em 2012 para R$ 2,5 bi); autofinanciamento sobe de 15,9% para 47,2%. (contagem) | lido |
| `fundo-eleitoral-2017` | 2017 | R$ 1.716.209.431 (2018); R$ 2.034.954.824 (2020); R$ 4.961.519.777 (2022, 2024 e 2026). (contagem) | lido |
| `coligacoes-proporcionais-ate-2017` | 2017 | NEP da Câmara de 16,5 em 2018 (último pleito com coligações) e 9,2 em 2022; outra medida (Nicolau, início do mandato): 16,5 em 2019 e 12,7 em 2022; partidos com bancada: 30 (2019) e 23 (abril de 2022). (estimativa) | lido |
| `orcamento-secreto-rp9-2020` | 2020 | Cerca de R$ 16 bi em 2021 e valor similar em 2022; R$ 19,4 bi reservados para 2023 (reserva, não execução). (estimativa) | lido |
| `distritao-rejeitado-2017-2021` | 2021 | 19/09/2017: 205 sim, 238 não, 1 abstenção (308 necessários); 11/08/2021: destaque que retirou o distritão do texto, 423 x 35. (contagem) | lido |
| `voto-impresso-rejeitado-2021` | 2021 | 229 sim, 218 não, 1 abstenção; 308 necessários. (contagem) | lido |
| `desinformacao-propaganda-res-23714-2022` | 2022 | STF manteve a resolução em 25/10/2022 por 9 x 2 (divergência de Nunes Marques e André Mendonça); multa de R$ 100 mil por hora. (contagem) | lido |

Para cada uma o JSON traz o mecanismo do dano segundo os críticos, quem pagou e a leitura contrária. Dois casos precisam de nota própria:

- **Reeleição (1997):** a gravação de dois deputados dizendo ter recebido R$ 200 mil foi publicada em 13/05/1997; eles renunciaram em 21/05/1997; a PGR arquivou os pedidos e a CPI não prosperou; o ex-presidente disse em 2010 que a compra 'provavelmente' ocorreu mas não pelo governo federal nem pelo seu partido, e em 2020 chamou a emenda de 'erro'. Os nomes citados nas gravações foram omitidos. Disputa interpretativa: se a compra ocorreu e quem a pagou nunca foi estabelecido em juízo; a reeleição também foi usada por chefes do Executivo de vários partidos.
- **Orçamento secreto:** o STF julgou a prática inconstitucional em 19/12/2022 (6 x 5 no InfoMoney); o Congresso aprovou em 19-20/12/2022 mudanças com 328 deputados e 44 senadores. Valores: cerca de R$ 16 bi em 2021 e similar em 2022 (estimativa).

## Futuro: propostas, riscos e sinais

| id | status resumido | anéis | decisões |
|---|---|---|---|
| `novo-codigo-eleitoral-plp-112-2021` | Aprovado na Câmara em 2021; parado na CCJ do Senado (relator Marcelo Castro, mais de 400 emendas, votação adiada diversas vezes em 2025); não vale par… | controle-externo-eleitor, legitimidade-impunidade, captura-concentracao | anistia-politica |
| `distritao-e-distrital-misto` | Distritão rejeitado em 19/09/2017 (205 x 238) e em 11/08/2021 (destaque que o retirou, 423 x 35). Situação do distrital misto em 2026 não verificada (… | captura-concentracao, controle-externo-eleitor | - |
| `lista-fechada` | Proposta recorrente; situação em 2026 não verificada nesta coleta. | captura-concentracao | reforma-administrativa |
| `fim-da-reeleicao-e-mandatos-de-cinco-anos` | CCJ do Senado aprovou em 21/05/2025, em votação simbólica; falta plenário (49 votos em dois turnos) e Câmara; reeleição vedada a partir de 2030 e mand… | controle-externo-eleitor, legitimidade-impunidade | - |
| `unificacao-das-eleicoes` | Parte da PEC acima (Senado, CCJ 21/05/2025); a Câmara não votou segundo as fontes lidas. | controle-externo-eleitor | - |
| `voto-facultativo` | Proposta recorrente; sem tramitação lida nesta coleta. Voto obrigatório vale desde 1932 para a regra geral (Wikipédia: multa de cerca de R$ 3,51; não… | controle-externo-eleitor, desigualdade-educacao-produtividade | ampliar-assistencia, cortar-beneficios-fiscais |
| `voto-impresso` | PEC 135/2019 rejeitada em 10/08/2021 (229 x 218; 308 necessários) (CNN, lida); sem proposta ativa verificada em 2026. | controle-externo-eleitor, legitimidade-impunidade | - |
| `federacoes-e-clausula-de-barreira` | Federações vigentes desde a Lei 14.208/2021; cláusula conforme EC 97/2017 (eleicoes_timeline.json; textos legais não lidos). NEP caiu de 16,5 (2018) a… | captura-concentracao | - |
| `fundo-eleitoral-e-financiamento` | FEFC de R$ 4,962 bi em 2022, 2024 e 2026 (Wikipédia, lida); doação empresarial proibida desde o STF de 2015 (Politize, lido); proposta de retorno da d… | captura-concentracao | cortar-beneficios-fiscais, desoneracao-ampla, credito-subsidiado, perdao-dividas |
| `ia-e-deepfakes-em-campanha` | A Res. 23.732/2024 proíbe 'conteúdo sintético' que crie, substitua ou altere imagem ou voz para prejudicar ou favorecer candidatura (deepfake) e exige… | legitimidade-impunidade, controle-externo-eleitor | - |
| `plataformas-digitais-e-desinformacao` | Res. 23.714/2022 mantida em 25/10/2022 por 9 x 2 (Poder360, lido). STF decidiu em 26/06/2025, 8 x 3, que o art. 19 é parcialmente inconstitucional (re… | controle-externo-eleitor, legitimidade-impunidade | ampliar-stf, remover-ministros-stf |
| `seguranca-da-urna-e-auditoria` | Urna eletrônica em todo o país desde 2000 (eleicoes_timeline.json, resumo de busca); verificações propostas no repositório (propostas.json). | controle-externo-eleitor, legitimidade-impunidade | - |
| `eleitorado-envelhecendo-e-voto-aos-16` | Voto facultativo aos 16 desde 1988. Em 2026, 158.745.463 eleitores; 60+ são 37,4 milhões (23,6%), 4,5 milhões a mais que em 2022; 3,57 milhões de até… | desigualdade-educacao-produtividade, fiscal-juros-divida | reforma-previdencia-2, ampliar-assistencia, educacao-tecnica-e-alfabetizacao |
| `abstencao` | 2024: 21,68% (33,8 milhões de 155,9 milhões); 2022 (1º turno): 20,79%; 2020: 23,15%; 2016: 17,58%; 2008: 14,50%; 2004: 14,22% (Poder360, dados TSE, li… | controle-externo-eleitor, legitimidade-impunidade | - |

Os sinais precoces (todos mensuráveis com dados públicos do TSE ou do Congresso) e a evidência comparada de cada item estão no JSON. Evidência comparada foi pesquisada só para SNTV, voto aos 16, voto obrigatório e lista aberta ou fechada.

## O que isto não prova

- Não prova que uma classe 'queria' uma regra, nem que a regra foi desenhada por interesse de classe. A matriz registra quem tenderia a ganhar ou perder, não a intenção de quem decidiu.
- Não prova causalidade: a queda de 87% do corpo de votantes após a Lei Saraiva (de 1.100.008 votantes em 1873 a 142.856 eleitores em 1882) mistura o efeito da lei com mudança de cadastro e de definição (votante versus eleitor) e com fraude anterior, segundo o próprio Nicolau.
- Não prova que o fim das coligações causou a queda do NEP de 16,5 (2018) para 9,2 (2022): migrações, fusões (União Brasil) e a cláusula de desempenho agiram juntas, e há outra série (12,7 em 2022) com momento diferente.
- Não prova que a doação empresarial causou decisões, nem que sua proibição reduziu influência: reduziu doações declaradas (-65% no 1º turno de 2016) e elevou o autofinanciamento (de 15,9% para 47,2%).
- Não prova que houve compra de votos na reeleição de 1997, nem que não houve: há gravações de dois deputados, negativas das pessoas citadas, arquivamento pela PGR e declaração posterior do ex-presidente, que isenta o governo.
- Não prova efeito de nenhuma regra futura: os mapeamentos para a cadeia de Markov e os anéis são hipóteses; a cadeia do repositório rejeita parte do pressuposto markoviano e não simula estas regras.
- Não é pesquisa de opinião: não há dado lido sobre o que cada classe pensa. Também não há dado por raça, profissão ou renda para a maior parte dos eleitorados históricos.

## Contrapontos

- **Classe versus instituição:** Faoro e Leal enfatizam o estamento burocrático e a troca de proteção por voto; leituras marxistas enfatizam a posição nas relações de produção; Weber separa classe, estamento e partido. Nenhuma delas isolada explica as regras; o JSON coloca as três lado a lado.
- **Ameaça de revolução (Acemoglu e Robinson) versus ausência dela:** Nicolau mostra que o comparecimento de 1933 foi de 3,3% da população mesmo com voto secreto, voto feminino e Justiça Eleitoral. Regra por si não amplia o voto; alistamento ex officio (1945: 6,17 milhões), urbanização e a entrada do analfabeto (1986: +10,6 pontos percentuais) ampliaram.
- **Distritão:** críticos dizem que prejudica partidos pequenos; a literatura sobre o voto único não transferível diz que ele tende a aumentar a representação deles. O argumento de defensores (menos fragmentação) também é contrariado pela literatura lida.
- **Voto obrigatório:** estudos citados associam obrigatoriedade a mais voto à esquerda (até 20 pontos em referendos; 7 a 10 pontos para o Partido Trabalhista na Austrália), outro de 2024 a menos polarização; o Chile acabou com a obrigatoriedade para reduzir multas a pobres e a restabeleceu em 2022. Evidências são de contextos diferentes.
- **Reeleição e fim da reeleição:** accountability retrospectiva e continuidade (defensores) versus vantagem de incumbente e custo da máquina (críticos); o ex-presidente que a sancionou chamou-a de 'erro', e a PEC em tramitação tem apoio de lados diferentes (aprovada em votação simbólica na CCJ do Senado).
- **Regulação de desinformação:** a Res. 23.714/2022 foi mantida por 9 x 2; os dois votos divergentes apontam censura prévia. É decisão contestada nos dois sentidos, sem medida do que foi removido.
- **Lulismo e voto dos pobres:** Singer lê um realinhamento do subproletariado; críticos leem um pacto conservador dependente de crescimento; o peso do Bolsa Família no voto é disputado.
- **Neutralidade:** as mesmas perguntas (quem ganha, quem perde, leitura contrária) foram feitas a regras de qualquer espectro, como a Lei Falcão (1976), o AI-2, o fundo eleitoral, o orçamento secreto e a Res. 23.714/2022, que afetam campos diferentes em momentos diferentes.

## Limites

- Este arquivo é uma hipótese de leitura, não um modelo: não há estimativa causal do efeito de nenhuma regra sobre classes, partidos ou resultados.
- Revisão de 07/10/2026: as regras de CF/88 (arts. 231-232), Decreto 21.076/1932, Constituição de 1934 (art. 23), CLT (art. 7º), EC 8/1977, EC 97/2017 e a ADI 4650 foram lidas nas fontes oficiais (Planalto, STF); a maior parte do restante segue secundária (Wikipédia, jornais, artigos), assinalada em cada campo, e o que veio de resumo de busca está com verificado=false.
- Interesses de classe são hipóteses teóricas do tipo 'o que tenderia a preferir dada a base material'; não são preferências medidas, nem se aplicam a indivíduos.
- Classes e grupos são construções analíticas; as 23 linhas se sobrepõem (um evangélico pode ser informal, mulher e do Nordeste).
- A matriz regra x classe tem 'ganha', 'perde' e 'ambiguo' como julgamento qualitativo, sem peso, sem soma e sem medida de intensidade; não se deve contar células.
- Marx e Engels (Manifesto, carta a Bloch), Acemoglu e Robinson (resumo do QJE), Boix (resumo da CUP) e Meltzer e Richard (abstract do JPE) foram lidos nesta revisão; não foram lidos Weber (obra e ano de 1922 não confirmados), Carvalho e Nobre (só referência bibliográfica confirmada), e o PDF de Acemoglu e Robinson e a tese de Boix; ideias desses vêm de memória ou de resumo.
- Evidência comparada internacional foi pesquisada só para SNTV, voto aos 16, voto obrigatório e lista fechada ou aberta; as demais propostas estão marcadas como não pesquisadas.
- Números de tramitação (PLP 112/2021, PEC do fim da reeleição) refletem as fontes lidas e podem ter mudado até 07/10/2026; não foi aberta a página da Câmara ou do Senado.
- A cadeia de Markov do repositório não modela nenhuma destas regras; os trechos 'mecanismo_na_cadeia' e os ids de aneis e decisoes são mapeamentos por hipótese, não efeitos calculados.
- Contagens divergentes entre fontes foram mantidas e anotadas: NEP de 2022 (9,2 e 12,7), votos do STF no orçamento secreto (6 x 5 e contagem parcial diferente), quórum do Pacote de Abril ('maioria absoluta' e 'maioria simples'), prazo de remoção da Res. 23.714 (2 h e 1 h), ano de Leal (1948 e 1949).
- Nenhuma pessoa é acusada: nomes de quem foi citado em gravações sobre a reeleição foram omitidos; o que consta é alegação atribuída à fonte, com a negativa e o arquivamento registrados.

## Não verificado nesta coleta (resumo)

- Decisões cujo custo principal não foi lido: nenhuma (os números centrais foram lidos; os adicionais, como 173 deputados cassados, 336 x 17 x 6 na reeleição, analfabetismo de 82,6% em 1890 e R$ 16,5 bi em 2022, ficaram em resumo de busca e estão marcados no texto). Os 22 senadores indiretos de 1978 foram confirmados na EC 8/1977.
- Fontes oficiais lidas nesta revisão: Planalto (CF/88, Decreto 21.076, Constituição de 1934, CLT, EC 8/1977, EC 97/2017, AI-1) e STF (ADI 4650). TSE, Câmara e Senado seguem sem leitura direta.
- Itens que continuam `false` por não terem fonte lida: Marcha da Família e cassações do AI-1 (só art. 10 lido), reforma administrativa (hipótese do modelo), CEBs (14 milhões e 1,8 milhão, fonte original de Pierucci e Prandi não lida), 32 constituintes evangélicos, elites agrárias em 1930 e Frente Parlamentar da Agropecuária (62/19/19; "120 a 200 votos").
- Correções desta revisão: eleitores de 16 e 17 anos em 2024 são 1.835.781 (e não 1.836.081); os 20,4% de idosos vêm do IHU-Unisinos com dados do TSE até março de 2022; na EC 97 o percentual medido na eleição vale para a legislatura seguinte.
- Teorias com fonte não lida: weber-classe-estamento-partido, carvalho-cidadania, nobre-imobilismo.
- Itens do futuro com evidência comparada não pesquisada: novo-codigo-eleitoral-plp-112-2021, unificacao-das-eleicoes, voto-impresso, fundo-eleitoral-e-financiamento, ia-e-deepfakes-em-campanha, plataformas-digitais-e-desinformacao, seguranca-da-urna-e-auditoria.


# Economia histórica do Brasil: visão estrutural por ciclo

> Compilado para o repositório sociolibero em 2026-10-06. Dados estruturados em `web/public/data/economia_historica.json`; eventos ligados a `web/public/data/historia.json` pelo campo `links_historia`. **Critério:** 'verificado' = página aberta e dado lido em fonte aberta (aqui, majoritariamente Wikipedia, fonte secundária); trechos '(não verificado)' vêm de memória ou de resumo de busca e precisam de conferência em fonte primária. Contagens são separadas de estimativas. Dados de 2024-2026 e o resultado da eleição de 2026 não foram verificados.

## Como ler

Cada ciclo tem: motor econômico, potenciais (e como foram usados ou desperdiçados), problemas estruturais, classes afetadas, tabela de mudanças drásticas (quem ganhou e quem perdeu) e fontes. O texto descreve sem adjetivar; onde há disputa historiográfica, ela vem em 'Controvérsias'. O intervalo 1780-1808 não é tratado como ciclo próprio.

## Pau-brasil e feitorias (1500-1530)

`id: pau-brasil`

**Motor econômico.** Extração de pau-brasil (corante e madeira) por escambo com povos indígenas, em feitorias litorâneas, sob monopólio régio arrendado a mercadores; comércio disputado por corsários franceses.

**Potenciais e uso.**

- Litoral atlântico extenso e densa Mata Atlântica com pau-brasil abundante.
- Mão de obra indígena conhecedora do território, mobilizada por troca de ferramentas e miçangas (escambo) - relato clássico; a página consultada da Wikipedia não detalha o escambo (não verificado).
- Posição geográfica no Atlântico Sul, que depois serviria às rotas do açúcar e do tráfico.

**Problemas estruturais.**

- Atividade predatória e itinerante: sem povoamento nem produção própria, o Estado quase não se instala.
- Ameaça à posse: contrabando e ataques de corsários franceses (a Wikipedia cita a expedição de Villegaignon em 1555, fora do período) motivam a colonização por capitanias.
- Ausência de dados quantitativos confiáveis: a fonte aberta consultada não traz toneladas nem número de navios.

**Classes e grupos.**

| Classe | Posição | Efeito | Evidência |
|---|---|---|---|
| Povos indígenas | Fornecedores de trabalho por escambo e, depois, alvo de cativeiro | Início da perda territorial e demográfica no litoral | Lei de 1570 e escravização 'em guerra justa' vêm depois (historia.json: lei-1570); volume de mortes no período (não verificado) |
| Mercadores e Coroa | Arrendatários do monopólio e beneficiários da renda | Lucro de curto prazo com baixo investimento fixo | Wikipedia (pau-brasil): 'primeira atividade econômica dos colonos portugueses'; arrendamento a mercadores (não verificado) |
| Corsários e comerciantes franceses | Concorrentes do comércio | Pressionam a Coroa a ocupar o litoral | Wikipedia (pau-brasil) cita corsários franceses atacando navios portugueses |

**Mudanças drásticas.**

| Data | Mudança | Descrição | Quem ganhou | Quem perdeu | Eventos (historia.json) |
|---|---|---|---|---|---|
| 1500-1530 | Monopólio do pau-brasil e feitorias litorâneas | Primeiro uso econômico do território: extração sem produção local, antecedendo a opção da Coroa por colonizar com capitanias hereditárias (1534, de memória (não verificado)). | Mercadores arrendatários e Coroa. | Povos indígenas do litoral, a médio prazo; a floresta costeira. | - |

**Regiões.** Litoral do atual Nordeste e Sudeste (Pernambuco, Bahia, Rio)

**Fontes.**

- [Pau-brasil - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Pau-brasil) - verificado
- [docs/HISTORIA.md e web/public/data/historia.json (repositório; fontes lá têm critério próprio)](docs/HISTORIA.md) - NÃO verificado (página não lida)

## Açúcar e plantation escravista (1530-1700)

`id: acucar`

**Motor econômico.** Engenhos de açúcar em plantation monocultora de exportação, com trabalho escravizado (indígena, depois majoritariamente africano), amarrada ao pacto colonial e ao capital mercantil português e holandês.

**Potenciais e uso.**

- Massapê e clima do litoral nordestino; Pernambuco chegou a ser a maior região açucareira do mundo no início do século XVII (Wikipedia, ciclo do açúcar).
- Capacidade de organizar unidades agroindustriais (engenho) e rotas de exportação; a expulsão dos holandeses (1654) deixou know-how que alimentou o açúcar das Antilhas (Wikipedia, Economic history of Brazil) - ou seja, parte do potencial foi transferida a concorrentes.
- Controle do tráfico atlântico a partir de Angola e do Brasil, gerando renda própria de mercadores coloniais (não verificado).

**Problemas estruturais.**

- Concentração fundiária desde a origem (capitanias, sesmarias, engenhos) e monocultura de exportação.
- Dependência de um único produto e de preços externos; concorrência antilhana encerra o monopólio de fato no fim do século XVII.
- Escravidão como base da produção; o tráfico para o Brasil envolveu mais de 5 milhões de pessoas ao longo de toda a história (Wikipedia); a série completa de desembarques por período não foi conferida.
- Excedente exportado, pouco mercado interno e pouca diversificação: pacto colonial restringe o comércio ao reino.

**Classes e grupos.**

| Classe | Posição | Efeito | Evidência |
|---|---|---|---|
| Escravizados africanos | Base do trabalho dos engenhos | Cativeiro hereditário, alta mortalidade, resistência por quilombos | Palmares destruído em 1694-95 (historia.json: palmares-1695); mortalidade média no período (não verificado) |
| Povos indígenas | Mão de obra cativa inicial e vítimas de aldeamentos e guerras | Escravização, deslocamento, epidemias | Lei de 1570 limita a escravização à 'guerra justa', com burlas (historia.json: lei-1570) |
| Senhores de engenho | Elite agrária local | Poder fundiário, social e político hereditário | Wikipedia (ciclo do açúcar): 256 engenhos em meados do século XVII; 'mais vaidade em Pernambuco que em Lisboa' (Jesuíta citado) |
| Comerciantes e Coroa portuguesa | Capturavam parte do excedente via pacto colonial e tráfico | Renda comercial e fiscal | Wikipedia (ciclo do açúcar): pacto colonial restringia o comércio ao reino; valor do tráfico 'gerava lucros substanciais' |
| Homens livres pobres e mestiços | Agregados, lavradores de cana e de subsistência, pequeno comércio | Dependência dos grandes proprietários | Descrição geral da historiografia; não conferida em fonte específica nesta rodada (não verificado) |

**Mudanças drásticas.**

| Data | Mudança | Descrição | Quem ganhou | Quem perdeu | Eventos (historia.json) |
|---|---|---|---|---|---|
| 1534-1549 | Capitanias hereditárias e primeiros engenhos | Doações de terra a donatários; em 1549 havia 30 engenhos em Pernambuco, 18 na Bahia e 2 em São Vicente (Wikipedia). A data de 1534 é de memória (não verificado). | Donatários, senhores de engenho, mercadores. | Povos indígenas, escravizados. | - |
| 1630-1654 | Ocupação holandesa do Nordeste açucareiro | A Holanda ocupou a zona açucareira entre 1630 e 1654 e adquiriu conhecimento técnico que alimentou o açúcar caribenho (Wikipedia, Economic history of Brazil). | Produtores antilhanos e capital holandês. | Produtores nordestinos, que perderam mercado a longo prazo. | - |
| 1694-1695 | Destruição de Palmares | Maior quilombo colonial é destruído por expedições financiadas pela Coroa; Zumbi morre em 20/11/1695. | Senhores e Coroa (preservação da ordem escravista). | Quilombolas e escravizados. | `palmares-1695` |
| 1570 | Lei de 1570 sobre escravização indígena | Limita o cativeiro indígena à 'guerra justa'; na prática a exceção virou regra em várias regiões. | Colonos que burlavam a norma. | Povos indígenas. | `lei-1570` |

**Regiões.** Zona da Mata nordestina (Pernambuco, Bahia); Recôncavo baiano; Capitanias do Sul: pouca relevância açucareira, base de apresamento indígena (de memória (não verificado))

**Fontes.**

- [Ciclo do açúcar - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Ciclo_do_a%C3%A7%C3%BAcar) - verificado
- [Economic history of Brazil - Wikipedia (en)](https://en.wikipedia.org/wiki/Economic_history_of_Brazil) - verificado
- [Tráfico negreiro no Brasil - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Tr%C3%A1fico_negreiro_no_Brasil) - verificado
- [docs/HISTORIA.md e web/public/data/historia.json (repositório; fontes lá têm critério próprio)](docs/HISTORIA.md) - NÃO verificado (página não lida)

## Ouro e diamantes (1700-1780)

`id: ouro-diamantes`

**Motor econômico.** Mineração aurífera e diamantífera em Minas, Mato Grosso e Goiás, tributada pela Coroa (quinto, capitação, derrama) e sustentada por mão de obra escravizada; ouro escoado para Portugal e, via tratados, para a Inglaterra.

**Potenciais e uso.**

- Jazidas aluviais de ouro, descobertas na década de 1690 e com cerca de mil toneladas extraídas até 1760, segundo a Wikipedia (estimativa).
- Mercado interno inédito: urbanização, abastecimento (pecuária, tropeirismo, agricultura de subsistência) e integração Centro-Sul; capital transferido de Salvador ao Rio em 1763 (Wikipedia).
- Capacidade de arrecadação fiscal da Coroa e circulação monetária interna.

**Problemas estruturais.**

- Riqueza finita: aluviões esgotam-se a partir de 1760 e a economia declina sem diversificação.
- Drenagem: quinto de 20%, capitação (1734-1750) e derrama (pós-1750) e o Tratado de Methuen (1703); historiadores sustentam que o ouro financiou parte da Revolução Industrial inglesa, tese debatida (Wikipedia).
- Escravidão em larga escala e controle de diamantes por monopólio régio (Distrito Diamantino, de memória (não verificado)).
- Fiscalismo gera revolta (Inconfidência Mineira, 1789, de memória (não verificado)).

**Classes e grupos.**

| Classe | Posição | Efeito | Evidência |
|---|---|---|---|
| Escravizados africanos | Força de trabalho nas lavras e na vida urbana mineira | Alta mortalidade, trabalho pesado, alforria por compra em minoria (de memória (não verificado)) | Capitação taxava trabalhadores livres e escravizados (Wikipedia, ciclo do ouro) |
| Mineradores, comerciantes e tropeiros | Novo empresariado colonial | Enriquecimento desigual, endividamento ante a derrama | População de Minas: 319.769 habitantes em 1772 (Wikipedia) |
| Coroa e comerciantes ingleses | Beneficiários da renda fiscal e do comércio | Transferência de excedente ao exterior | Tratado de Methuen (1703) e quotas de 100 arrobas anuais da derrama (Wikipedia) |
| Povos indígenas do interior | Atingidos pelo avanço das frentes mineradoras e bandeiras | Perda de território, apresamento | Diretório dos Índios (1757) seculariza aldeamentos (historia.json: diretorio-1757) |
| Homens livres pobres | Garimpeiros 'faiscadores' e agregados | Instabilidade, dependência de crédito e abastecimento | Descrição geral; não conferida em fonte específica (não verificado) |

**Mudanças drásticas.**

| Data | Mudança | Descrição | Quem ganhou | Quem perdeu | Eventos (historia.json) |
|---|---|---|---|---|---|
| 1690s-1720s | Corrida do ouro e deslocamento populacional | Descobertas na década de 1690 (a Wikipedia cita 1697) e em Mato Grosso (1718-1719) e Goiás (1725); a população colonial aumenta fortemente. O texto fala em 3 milhões ao fim do século, valor ambíguo (não verificado). | Mineradores, comerciantes, Coroa. | Escravizados, indígenas do interior; economia açucareira perde mão de obra. | - |
| 1763 | Capital transferida para o Rio de Janeiro | Reconhece o eixo econômico deslocado para o Centro-Sul, vinculado ao escoamento do ouro (Wikipedia). | Elites do Rio e do Centro-Sul. | Elites baianas. | - |
| c. 1760 | Esgotamento dos aluviões | Produção cai e a economia mineira recua à subsistência regional; a Coroa mantém a cobrança (derrama). | Nenhum grupo; Coroa insiste na fiscalidade. | Mineradores, trabalhadores livres e escravizados. | - |

**Regiões.** Minas Gerais; Goiás e Mato Grosso; Rio de Janeiro (porto e capital em 1763); Nordeste açucareiro em declínio relativo

**Fontes.**

- [Ciclo do ouro - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Ciclo_do_ouro) - verificado
- [docs/HISTORIA.md e web/public/data/historia.json (repositório; fontes lá têm critério próprio)](docs/HISTORIA.md) - NÃO verificado (página não lida)

## Abertura dos portos e agroexportação imperial (1808-1850)

`id: agroexportacao-imperial`

**Motor econômico.** Economia agroexportadora (açúcar, algodão, café em ascensão) com tráfico e escravidão, sob dependência comercial e financeira da Inglaterra, após a abertura dos portos (1808) e a independência (1822). O intervalo 1780-1808 não é coberto como ciclo.

**Potenciais e uso.**

- Vale do Paraíba fluminense: terra, clima e escravos para o café, que se torna o principal produto da pauta.
- Mercado externo em expansão e Estado nacional com capacidade de arrecadação aduaneira.
- Demanda mundial por café, açúcar e algodão em contexto da Revolução Industrial.

**Problemas estruturais.**

- Dependência de tarifas baixas negociadas com a Inglaterra: o Tratado de 1810 (15%) é de memória (não verificado).
- Receita pública presa à tarifa aduaneira e ao endividamento externo (primeiro empréstimo inglês em 1824, de memória (não verificado)).
- Escravidão e tráfico (mesmo ilegal após 1831) mantêm baixo incentivo a salários, tecnologia e mercado interno.
- Concentração fundiária mantida por sesmarias e posses; ausência de lei de terras até 1850.

**Classes e grupos.**

| Classe | Posição | Efeito | Evidência |
|---|---|---|---|
| Escravizados africanos | Maioria do trabalho em plantation e cidade | Intensificação do tráfico ilegal após a lei de 1831, 'para inglês ver' | historia.json: lei-1831 (amplamente descumprida); a Wikipedia indica mais de 5 milhões de pessoas no tráfico total para o Brasil |
| Fazendeiros do café (barões) | Elite agrária ascendente | Poder político no Império e crédito via comissários | Café = 63% das exportações em 1891 (Wikipedia, Economic history) - marca o fim da trajetória iniciada neste período |
| Comerciantes e capital inglês | Credores e exportadores | Controle do crédito e do frete | Tratado de 1810 e posição inglesa (não verificado) |
| Povos indígenas | Atingidos por expansão de frentes agrícolas | Aldeamentos e Regulamento das Missões (1845) | historia.json: missoes-1845 (data de memória lá também) |
| Livres pobres e libertos | Agregados, tropeiros, artesãos | Sem acesso à terra por via regular | Descrição geral (não verificado) |

**Mudanças drásticas.**

| Data | Mudança | Descrição | Quem ganhou | Quem perdeu | Eventos (historia.json) |
|---|---|---|---|---|---|
| 1808 | Abertura dos portos e chegada da corte | Fim do pacto colonial de fato e abertura ao comércio, em prática dominada pela Inglaterra. Detalhes (tarifas de 24% e 15%) de memória (não verificado). | Comerciantes britânicos, exportadores e elites do Rio. | Monopólio mercantil português, artesãos locais. | `indep-1822` |
| 1822 | Independência política com continuidade econômica | Soberania formal sem ruptura na escravidão e na pauta agroexportadora. | Elites agrárias e burocracia do Império. | Escravizados e indígenas, sem mudança de status. | `indep-1822`, `c1824` |
| 1831 | Lei de 7 de novembro de 1831 | Proíbe o tráfico, descumprida; milhares de africanos foram trazidos ilegalmente até 1850. | Traficantes e fazendeiros. | Africanos ilegalmente escravizados. | `lei-1831` |

**Regiões.** Vale do Paraíba (RJ, SP, MG); Nordeste açucareiro e algodoeiro em declínio relativo; Maranhão algodoeiro (de memória (não verificado)); Sul pastoril (charque)

**Fontes.**

- [Economic history of Brazil - Wikipedia (en)](https://en.wikipedia.org/wiki/Economic_history_of_Brazil) - verificado
- [Tráfico negreiro no Brasil - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Tr%C3%A1fico_negreiro_no_Brasil) - verificado
- [docs/HISTORIA.md e web/public/data/historia.json (repositório; fontes lá têm critério próprio)](docs/HISTORIA.md) - NÃO verificado (página não lida)

## Café, fim do tráfico, abolição e imigração (1850-1889)

`id: cafe-escravidao-abolicao`

**Motor econômico.** Expansão cafeeira (Vale do Paraíba, depois Oeste Paulista) com ferrovias e transição do trabalho escravo para o assalariado e imigrante, sob regime de propriedade pela compra (Lei de Terras).

**Potenciais e uso.**

- Terra roxa do Oeste Paulista e demanda mundial por café; ferrovias saem de 223 km (1860) para 6.930 km (1885) (Wikipedia, Economic history).
- Capital liberado pela extinção do tráfico (1850) e acumulado no café, que financia ferrovias, bancos e a incipiente indústria (tese clássica, não conferida em fonte específica (não verificado)).
- Oferta potencial de trabalho livre (nacional, liberto e imigrante), que o Estado optou por subsidiar apenas para imigrantes.

**Problemas estruturais.**

- Lei de Terras (1850): só a compra dá acesso a terras devolutas, o que dificulta o acesso por libertos, posseiros e imigrantes e reforça a concentração; a efetividade foi limitada por fraude e fiscalização fraca (síntese de literatura acadêmica via busca, páginas não abertas).
- Abolição (1888) sem indenização aos libertos nem política de terra, educação ou crédito (historia.json: aurea-1888).
- Dependência do café e de um único mercado comprador (EUA, em período posterior) e do crédito de comissários.
- Desigualdade regional: o Norte e o Nordeste perdem escravos para o Sudeste via tráfico interprovincial (de memória (não verificado)).

**Classes e grupos.**

| Classe | Posição | Efeito | Evidência |
|---|---|---|---|
| Escravizados e libertos | Trabalho forçado, depois liberdade formal sem recursos | Ventre Livre (1871), Sexagenários (1885), Áurea (1888); sem reparação nem terra | historia.json: ventre-1871, sexa-1885, aurea-1888; a população escrava em 1872 (~1,5 milhão) e em 1887 (não verificado) |
| Fazendeiros do Oeste Paulista | Elite agrária modernizadora | Passam a organizar imigração subsidiada e consolidam o poder republicano | Wikipedia (Economic history): 201 mil imigrantes em SP entre 1884-1890 e 733 mil entre 1891-1900 |
| Imigrantes europeus | Trabalho assalariado e colonato nos cafezais | Mobilidade parcial, endividamento nas fazendas | Wikipedia (Imigração): ~71 mil imigrantes/ano entre 1877-1903, 58,5% italianos; subsídio paulista ao imigrante (de memória (não verificado)) |
| Povos indígenas | Perdem terras de aldeamento potencialmente devolutas | Lei de Terras transforma terra em mercadoria | historia.json: terras-1850 (terras de aldeamento potencialmente devolutas) |
| Camponeses e posseiros | Perdem o direito por posse; precisam titular | Exclusão da propriedade formal | Síntese de literatura acadêmica sobre Lei de Terras (página não aberta) |
| Comerciantes, banqueiros e engenheiros | Elite urbana nascente | Ferrovias, bancos, comércio de importação | Ferrovias 223 km (1860) a 6.930 km (1885) (Wikipedia, Economic history) |

**Mudanças drásticas.**

| Data | Mudança | Descrição | Quem ganhou | Quem perdeu | Eventos (historia.json) |
|---|---|---|---|---|---|
| 1850-09-04 | Lei Eusébio de Queirós: fim do tráfico atlântico | Efetiva o fim do tráfico sob pressão britânica; amplia o tráfico interprovincial e libera capital que antes ia ao tráfico (tese corrente, não conferida (não verificado)). | Cafeicultores do Sudeste (que compram escravos do Nordeste), setores financeiros. | Africanos traficados e províncias do Norte e Nordeste, que perdem escravos. | `eusebio-1850` |
| 1850-09-18 | Lei de Terras | Impede a aquisição de terras devolutas por outro modo que não a compra e regulariza posses e sesmarias. | Grandes proprietários, que legalizam áreas. | Libertos, posseiros, indígenas e imigrantes pobres. | `terras-1850` |
| 1871-1885 | Abolição gradual: Ventre Livre e Sexagenários | Reformas que empurram a abolição para o futuro e mantêm a tutela dos senhores. | Senhores, que ganham tempo e indenizações por serviços. | Escravizados, na prática. | `ventre-1871`, `sexa-1885` |
| 1888-05-13 | Lei Áurea | Extingue a escravidão sem indenização aos libertos nem política de acesso à terra ou à educação; o Brasil foi o último país independente das Américas a abolir (historia.json). | Abolicionistas e libertos (liberdade formal); cafeicultores paulistas já recorriam à imigração. | Libertos (sem terra, renda ou instrução), e fazendeiros do Vale do Paraíba, sem mão de obra. | `aurea-1888` |

**Regiões.** Oeste Paulista (polo do café e da imigração); Vale do Paraíba (declínio); Nordeste (exportador de escravos e sem imigração); Amazônia (início da borracha)

**Fontes.**

- [Economic history of Brazil - Wikipedia (en)](https://en.wikipedia.org/wiki/Economic_history_of_Brazil) - verificado
- [Imigração no Brasil - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Imigra%C3%A7%C3%A3o_no_Brasil) - verificado
- [Os paisanos da Campanha (Leipnitz, ANPUH 2019): lido; confirma que a Lei de Terras (Lei 601, 18/09/1850) proibiu a aquisição de terras por outro meio que a compra e que a Lei Eusébio de Queirós (1850) extinguiu o tráfico negreiro](https://anpuh.org.br/uploads/anais-simposios/pdf/2019-01/1548856593_0107914a69584e70fa2736d4b4b1b76e.pdf) - verificado
- [Lei nº 601/1850 (Lei de Terras) - Planalto (lida em 07/10/2026: 18/09/1850, 'Dispõe sobre as terras devolutas do Império')](https://www.planalto.gov.br/ccivil_03/leis/lim/lim601.htm) - verificado
- [Lei nº 581/1850 (Eusébio de Queirós) - Planalto (lida em 07/10/2026: 04/09/1850, 'Estabelece medidas para a repressão do tráfico de africanos neste Império')](https://www.planalto.gov.br/ccivil_03/leis/lim/lim581.htm) - verificado
- [Lei nº 3.353/1888 (Lei Áurea) - Planalto (lida em 07/10/2026: 13/05/1888, 'É declarada extincta, desde a data desta Lei, a escravidão no Brazil')](https://www.planalto.gov.br/ccivil_03/leis/lim/lim3353.htm) - verificado
- [docs/HISTORIA.md e web/public/data/historia.json (repositório; fontes lá têm critério próprio)](docs/HISTORIA.md) - NÃO verificado (página não lida)

## Café com leite, borracha e Encilhamento (1889-1930)

`id: borracha-cafe-republica-velha`

**Motor econômico.** Hegemonia do café (51% das exportações em 1901-1910; 63% em 1891, Wikipedia), com valorização estatal (Convênio de Taubaté, 1906), crédito externo, imigração subsidiada e, em paralelo, boom da borracha amazônica (1879-1912) e início da indústria leve.

**Potenciais e uso.**

- Poder de mercado do Brasil no café: cerca de três quartos da oferta mundial segundo a Wikipedia, o que permitia manipular preços por estoques.
- Fluxo de imigrantes: cerca de 3,52 milhões entre 1890 e 1929, 2,03 milhões para São Paulo (Wikipedia, Imigração, conferido na página, mas números não cruzados).
- Capital cafeeiro que financia ferrovias, comércio e fábricas em São Paulo; indústria têxtil e de alimentos.

**Problemas estruturais.**

- Monocultura e endividamento: o Convênio de Taubaté socializa perdas via empréstimos externos e não reduz a produção.
- Política dos governadores e voto restrito: o Estado serve às oligarquias estaduais (historia.json: governadores-1898).
- Instabilidade monetária: o Encilhamento (1890-91) expande a emissão e termina em colapso de empresas e inflação.
- Exclusão: libertos sem políticas; analfabetos sem voto; indígenas sob tutela (SPI, 1910).
- Borracha: aviamento, dívida e violência; colapso após 1912 pela concorrência asiática.

**Classes e grupos.**

| Classe | Posição | Efeito | Evidência |
|---|---|---|---|
| Libertos e população negra | Sem reparação, empregos precários e discriminação | Exclusão do voto por analfabetismo e menor acesso ao trabalho assalariado do café, preferido ao imigrante | historia.json: chibata-1910 como protesto; a preferência pelo imigrante é consenso historiográfico mas não conferida em fonte aberta específica (não verificado) |
| Imigrantes (italianos, portugueses, espanhóis, japoneses) | Colonos e assalariados do café; operários nas cidades | Mobilidade desigual, greves e anarquismo (de memória (não verificado)) | Wikipedia (Imigração): 58,5% italianos em 1877-1903; portugueses lideram em 1904-1930 |
| Cafeicultores paulistas e mineiros | Elite hegemônica ('café com leite') | Valorização do café protege sua renda com risco socializado | Convênio de Taubaté 26/02/1906: compras com empréstimos externos pagos por imposto de exportação (Wikipedia) |
| Seringueiros e nordestinos na Amazônia | Trabalho sob aviamento | Endividamento, doenças e isolamento | Wikipedia (Ciclo da borracha): aviamento, altas taxas de mortalidade; número exato de migrantes não consta |
| Povos indígenas | Violência na frente da borracha e tutela do SPI | Trabalho forçado, massacres e deslocamentos | Wikipedia (Ciclo da borracha) cita 'deslocamentos forçados e violência'; historia.json: spi-1910 |
| Operários urbanos | Força de trabalho nascente, sem legislação trabalhista ampla | Jornadas longas, trabalho infantil (de memória (não verificado)) | Não conferido em fonte específica (não verificado) |
| Banqueiros e especuladores | Beneficiários do Encilhamento | Concentração de riqueza após o colapso | Wikipedia (Encilhamento): ~90 empresas listadas em 1888 e ~450 em 1891; 'concentrou riqueza entre elites' |

**Mudanças drásticas.**

| Data | Mudança | Descrição | Quem ganhou | Quem perdeu | Eventos (historia.json) |
|---|---|---|---|---|---|
| 1890-1892 | Encilhamento | Política de crédito liberal e emissão de papel-moeda sob Rui Barbosa (decreto de 17/01/1890); a bolha estoura em 1890-91 com a quebra da Baring e o calote argentino; inflação e falências; recuperação só no início do século XX sob austeridade. | Especuladores bem posicionados e elites financeiras. | Pequenos investidores, consumidores urbanos (inflação) e o Tesouro. | `rep-1889`, `c1891` |
| 1906-02-26 | Convênio de Taubaté e valorização do café | SP, MG e RJ acordam comprar excedentes com empréstimos externos, pagos por imposto de exportação em ouro; a produção continuou a crescer. | Cafeicultores (renda garantida). | Contribuintes, consumidores, setores sem proteção e a diversificação econômica. | `governadores-1898` |
| c. 1910-1912 | Colapso da borracha amazônica | A produção asiática supera a amazônica na década de 1910; comércio e urbanização de Manaus e Belém sofrem. | Plantadores asiáticos (britânicos e holandeses). | Seringueiros, casas comerciais, cidades amazônicas. | `spi-1910` |
| 1914-1918 | Primeira Guerra e substituição de importações incidental | Falta de importados estimula a indústria nacional (tese clássica, não conferida (não verificado)). | Industriais paulistas. | Importadores. | - |

**Regiões.** São Paulo (polo cafeeiro, industrial e imigrante); Minas Gerais (política e leite); Amazônia (borracha: Manaus e Belém); Nordeste (fonte de migrantes, estagnação relativa)

**Fontes.**

- [Economic history of Brazil - Wikipedia (en)](https://en.wikipedia.org/wiki/Economic_history_of_Brazil) - verificado
- [Encilhamento - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Encilhamento) - verificado
- [Convênio de Taubaté - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Conv%C3%AAnio_de_Taubat%C3%A9) - verificado
- [Imigração no Brasil - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Imigra%C3%A7%C3%A3o_no_Brasil) - verificado
- [Ciclo da borracha - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Ciclo_da_borracha) - verificado
- [docs/HISTORIA.md e web/public/data/historia.json (repositório; fontes lá têm critério próprio)](docs/HISTORIA.md) - NÃO verificado (página não lida)

## Crise de 1929, industrialização e Estado Novo (1930-1945)

`id: industrializacao-vargas`

**Motor econômico.** Colapso do café, intervenção estatal e substituição de importações; criação de instituições (Justiça do Trabalho, CLT, CSN, Vale), com apoio norte-americano na Segunda Guerra.

**Potenciais e uso.**

- Capital e mercado interno gerados pelo café e por estoques comprados e queimados pelo governo, que mantiveram renda e protegeram implicitamente a indústria (Wikipedia, Economic history).
- Minério de ferro, hidrelétricas potenciais e posição estratégica no Atlântico, usada para barganhar financiamento da CSN com os EUA nos Acordos de Washington (Wikipedia, CSN).
- Massa de trabalhadores urbanos a organizar por legislação e sindicato oficial.

**Problemas estruturais.**

- Falta de estratégia nacional de desenvolvimento: a Wikipedia (Crise de 1929) observa que o crescimento industrial era limitado por falta de orientação nacional.
- Dívida acumulada na defesa do café e dependência de bens de capital importados.
- Autoritarismo: sindicato atrelado ao Estado e fim dos partidos em 1937 (historia.json).
- Direitos urbanos sem extensão ao campo: trabalhadores rurais e domésticos inicialmente fora da CLT, de acordo com a Wikipedia, 'historicamente'.

**Classes e grupos.**

| Classe | Posição | Efeito | Evidência |
|---|---|---|---|
| Trabalhadores urbanos formais | Beneficiários de direitos regulados | CLT (DL 5.452, 01/05/1943), Justiça do Trabalho e salário mínimo; também controle sindical | Wikipedia (CLT): 922 artigos, vigência em 09/08/1943; salário mínimo de 1940, de memória (não verificado) |
| Trabalhadores rurais e domésticos | Excluídos da regulação | Sem proteção até a Constituição de 1988 e a EC 72/2013 | Wikipedia (CLT): rurais e domésticos não cobertos inicialmente; EC 72/2013 estendeu direitos |
| Cafeicultores | Perdem poder político após 1930, mantêm renda via compra estatal | Estado assume dívidas do café | Wikipedia (Convênio de Taubaté e Crise de 1929): governo federal assume obrigações e queima café |
| Industriais e burocracia estatal | Ganham proteção cambial, tarifária e crédito | Indústria acelera após 1930 | Wikipedia (Economic history): crise estimula indústria; CSN criada em 1941 |
| Povos indígenas | Marcha para o Oeste e frentes de expansão | Contatos e epidemias na expansão do Centro-Oeste | historia.json: oeste-1943 |
| População negra e imigrantes | Frente Negra (1931) até a extinção em 1937; imigração diminui | Imigração cai para ~33,5 mil por ano (1931-1963) | Wikipedia (Imigração) e historia.json: fnb-1931 |

**Mudanças drásticas.**

| Data | Mudança | Descrição | Quem ganhou | Quem perdeu | Eventos (historia.json) |
|---|---|---|---|---|---|
| 1929-1930 | Crash de 1929 e queda do café | Os EUA, maior comprador, reduzem importações; preços desabam; o governo compra e queima café, endividando-se. | Industriais e o Estado centralizador, em retrospecto. | Cafeicultores e trabalhadores rurais. | `rev-1930` |
| 1930-10-24 | Revolução de 1930 | Fim da República Velha, concentração de poder no Executivo e início de política econômica federal ativa. | Novas elites políticas, militares e industriais. | Oligarquias cafeeiras paulistas. | `rev-1930`, `rev-1932` |
| 1937-11-10 | Estado Novo | Ditadura com decretos-lei; base para CSN, Vale e CLT. | Burocracia estatal e industriais; trabalhadores formais. | Oposições políticas, sindicatos autônomos, Frente Negra (extinta). | `estado-novo-1937`, `fnb-1931` |
| 1941-04-09 | Companhia Siderúrgica Nacional | Siderurgia estatal em Volta Redonda (operação em 1946), financiada pelo Eximbank em troca do alinhamento aos Aliados. | Indústria nacional de base e Vale do Paraíba. | Nenhum perdedor direto identificado nesta rodada. | `oeste-1943` |
| 1943-05-01 | CLT | Consolida a legislação trabalhista urbana (DL 5.452). | Trabalhadores formais urbanos; Estado (controle sindical). | Trabalhadores informais, rurais e domésticos, excluídos. | `estado-novo-1937` |

**Regiões.** Sudeste (indústria e CSN); Centro-Oeste (Marcha para o Oeste); Nordeste (quase sem industrialização)

**Fontes.**

- [Crise de 1929 - Wikipedia (pt), trecho sobre o Brasil](https://pt.wikipedia.org/wiki/Crise_de_1929) - verificado
- [Convênio de Taubaté - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Conv%C3%AAnio_de_Taubat%C3%A9) - verificado
- [Companhia Siderúrgica Nacional - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Companhia_Sider%C3%BArgica_Nacional) - verificado
- [Consolidação das Leis do Trabalho - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Consolida%C3%A7%C3%A3o_das_Leis_do_Trabalho) - verificado
- [Economic history of Brazil - Wikipedia (en)](https://en.wikipedia.org/wiki/Economic_history_of_Brazil) - verificado
- [Imigração no Brasil - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Imigra%C3%A7%C3%A3o_no_Brasil) - verificado
- [docs/HISTORIA.md e web/public/data/historia.json (repositório; fontes lá têm critério próprio)](docs/HISTORIA.md) - NÃO verificado (página não lida)

## Desenvolvimentismo e substituição de importações (1946-1964)

`id: desenvolvimentismo`

**Motor econômico.** Industrialização por substituição de importações com forte papel do Estado (Plano de Metas, 1956-61), capital estrangeiro (indústria automobilística) e inflação crescente; crescimento do PIB acima de 7% ao ano entre 1950 e 1961.

**Potenciais e uso.**

- Mercado interno urbano e demanda reprimida por bens duráveis; durável sobe de 6% para 18% do valor adicionado industrial entre 1949 e 1960 (Wikipedia, Economic history).
- Energia (de 2.806 MW em 1954 para 5.783 MW em 1962), rodovias e a indústria automobilística via GEIA (Wikipedia, Plano de Metas).
- Capital externo e Estado planejador (BNDE, de memória (não verificado)).

**Problemas estruturais.**

- Inflação e déficit externo: o plano priorizou crescimento sobre estabilidade (Wikipedia, Plano de Metas).
- Concentração regional: industrialização no Centro-Sul; SUDENE só em 1959; a agricultura cresceu cerca de 40% (Wikipedia).
- Questão agrária não enfrentada; reforma agrária como pauta de 1961-64 (de memória (não verificado)).
- Instabilidade política (suicídio de Vargas, renúncia de Jânio, plebiscito) e aumento da polarização.

**Classes e grupos.**

| Classe | Posição | Efeito | Evidência |
|---|---|---|---|
| Trabalhadores urbanos industriais | Crescimento do emprego e da organização sindical | Ganhos reais parciais; greve e mobilização crescente | Indústria cresceu mais de 9% a.a. entre 1950 e 1961 (Wikipedia, Economic history); salários reais, de memória (não verificado) |
| Industriais e capital estrangeiro | Beneficiários de proteção e crédito | Automobilística, bens de capital | Plano de Metas: 30 metas; GEIA; ~43% dos investimentos em bens e serviços importados (Wikipedia) |
| Camponeses, posseiros e trabalhadores rurais | Sem direitos trabalhistas, migração rural-urbana | Êxodo para o Sudeste e conflitos por terra | Agricultura cresceu ~40% (Wikipedia); êxodo e Ligas Camponesas de memória (não verificado) |
| Classe média urbana | Cresce com burocracia, serviços e consumo | Consumo de duráveis, mas corroída pela inflação | Não conferido em fonte específica (não verificado) |
| Povos indígenas | Parque Indígena do Xingu (1961) e expansão do Centro-Oeste e de Brasília | Proteção parcial e pressão por estradas | historia.json: xingu-1961 |
| Nordeste e regiões periféricas | Atrasadas em industrialização | SUDENE (1959) como resposta limitada | Wikipedia (Plano de Metas): SUDENE criada em 1959 |

**Mudanças drásticas.**

| Data | Mudança | Descrição | Quem ganhou | Quem perdeu | Eventos (historia.json) |
|---|---|---|---|---|---|
| 1951-1954 | Segundo governo Vargas e criação da Petrobras | Nacionalismo econômico e Petrobras (1953, de memória (não verificado)). | Estado e nacionalistas. | Capital estrangeiro do petróleo. | `vargas-1954` |
| 1956-1961 | Plano de Metas e Brasília | 30 metas em cinco setores (energia, transporte, alimentação, indústria de base, educação); Brasília e Belém-Brasília reforçam a ocupação do interior; a inflação sobe. | Industriais, capital estrangeiro e classes urbanas do Centro-Sul. | Regiões periféricas, agricultura e poupadores (inflação). | `c1946`, `lott-1955`, `xingu-1961` |
| 1961-1964 | Crise política e econômica | Renúncia de Jânio, parlamentarismo, plebiscito, inflação e estagnação; reformas de base não aprovadas. | Setores que apoiavam o golpe de 1964. | Trabalhadores organizados e camponeses. | `janio-1961`, `plebiscito-1963`, `golpe-1964` |

**Regiões.** Centro-Sul (SP, RJ, MG, indústria); Nordeste (SUDENE); Centro-Oeste (Brasília); Amazônia (Belém-Brasília)

**Fontes.**

- [Plano de Metas - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Plano_de_Metas) - verificado
- [Economic history of Brazil - Wikipedia (en)](https://en.wikipedia.org/wiki/Economic_history_of_Brazil) - verificado
- [docs/HISTORIA.md e web/public/data/historia.json (repositório; fontes lá têm critério próprio)](docs/HISTORIA.md) - NÃO verificado (página não lida)

## Ditadura, milagre econômico e endividamento (1964-1980)

`id: milagre-endividamento`

**Motor econômico.** Crescimento acelerado com Estado e capital estrangeiro (milagre 1968-73, PIB acima de 10% ao ano), depois endividamento externo no II PND (1974-80) após o choque do petróleo.

**Potenciais e uso.**

- Crédito internacional abundante; PIB médio de 11,1% em 1968-73 (Wikipedia, Economic history) e 6,9% em 1974-80.
- Exportações industriais: de US$1,4 bi (1963) para US$6,2 bi (1973); manufaturados de 5% para 29% da pauta (Wikipedia).
- Estrutura estatal (estatais, BNDE, infraestrutura) e fronteira agrícola e amazônica.

**Problemas estruturais.**

- Arrocho salarial e concentração de renda: a Wikipedia cita Gini de 0,581 (1970) a 0,589 (1979) e interpreta como sem grande aumento, enquanto o topo 5% teria chegado a 36,3% da renda; o debate sobre a concentração (Langoni e críticos) não foi conferido nesta rodada.
- Dívida externa: de US$6,4 bi (1963) a quase US$54 bi (1980) segundo a Wikipedia (Economic history), e 'US$90 bi no fim dos anos 1970' em outra página da mesma enciclopédia; a divergência decorre provavelmente de definição bruta/líquida e de curto prazo, e não foi resolvida.
- Violência do Estado, repressão política e censura (historia.json).
- Impacto ambiental e indígena: Transamazônica e BR-174 (historia.json: transam-1970, wai-1974).

**Classes e grupos.**

| Classe | Posição | Efeito | Evidência |
|---|---|---|---|
| Trabalhadores urbanos | Salário mínimo contido, sindicatos sob intervenção | Arrocho e rotatividade; porém salário mínimo real cresceu entre 1969 e 1973 segundo a Wikipedia (milagre) | Evidência divergente entre o discurso do 'arrocho' e a página consultada; matéria disputada (não verificado) |
| Classe média urbana | Beneficiária do crédito ao consumo e do emprego em serviços e estatais | Ampliação do consumo de duráveis | Não conferido em fonte específica (não verificado) |
| Elites industriais e financeiras | Aliadas do regime | Crédito subsidiado, capital externo e grandes obras | Wikipedia (milagre): topo 5% com 36,3% da renda |
| Camponeses e posseiros | Expulsão de terras, conflitos na Amazônia e Araguaia | Colonização dirigida e latifúndios agropecuários | historia.json: araguaia-1972 |
| Povos indígenas | Obras de integração e remoções | Mortes, epidemias, perda de terras | historia.json: transam-1970, wai-1974; CNV cita ao menos 8.350 indígenas mortos (HISTORIA.md) |
| Mulheres e população negra | Trabalho precário, domésticas sem direitos; censura ao tema racial | Exclusão persistente; MNU (1978) reorganiza o movimento | historia.json: mnu-1978 |
| Servidores e militares | Expansão do Estado | Emprego público e estatais | Não conferido (não verificado) |

**Mudanças drásticas.**

| Data | Mudança | Descrição | Quem ganhou | Quem perdeu | Eventos (historia.json) |
|---|---|---|---|---|---|
| 1964-03-31 | Golpe de 1964 e PAEG | Programa de ajuste (PAEG, de memória (não verificado)) com controle salarial; AI-1 e AI-5 retiram contrapesos. | Elites empresariais, capital externo e setores civis aliados. | Sindicatos, camponeses e oposição. | `golpe-1964`, `ai1-1964`, `ai5-1968` |
| 1968-1973 | Milagre econômico | PIB cresce em média acima de 10% a.a. (Wikipedia) com inflação em torno de 15-20%. | Indústria, exportadores, classes médias e altas. | Trabalhadores de baixa renda, em termos relativos; ambiente e indígenas. | `ai5-1968`, `transam-1970` |
| 1973-1979 | Choque do petróleo e II PND | O governo opta por crescer com dívida externa; juros internacionais sobem de 7,7% (1977) para 21,5% (1980) e preços das commodities caem (trecho de busca, PUC-Rio). | Estatais, empreiteiras e bancos credores. | Tesouro e gerações seguintes, pelo serviço da dívida. | - |

**Regiões.** Sudeste (indústria); Amazônia (Transamazônica, projetos minerais e agropecuários); Centro-Oeste (fronteira agrícola); Nordeste (SUDENE, migração para o Sudeste)

**Fontes.**

- [Milagre econômico brasileiro - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Milagre_econ%C3%B4mico_brasileiro) - verificado
- [Economic history of Brazil - Wikipedia (en)](https://en.wikipedia.org/wiki/Economic_history_of_Brazil) - verificado
- [PUC-Rio TD 158, dívida externa (URL deu 404 em 07/10/2026; só trecho de busca)](https://www.econ.puc-rio.br/uploads/adm/trabalhos/files/td158.pdf) - NÃO verificado (URL deu 404 em 07/10/2026; só trecho de busca)
- [docs/HISTORIA.md e web/public/data/historia.json (repositório; fontes lá têm critério próprio)](docs/HISTORIA.md) - NÃO verificado (página não lida)

## Década perdida, crise da dívida e hiperinflação (1980-1994)

`id: decada-perdida-hiperinflacao`

**Motor econômico.** Economia sem motor externo: crise da dívida pós-1982, ajuste recessivo, inflação crônica e indexação, tentativas heterodoxas de estabilização (Cruzado 1986, Bresser 1987, Verão 1989, Collor 1990) e redemocratização com a Constituição de 1988.

**Potenciais e uso.**

- Parque industrial já instalado e superávits comerciais obtidos ao longo dos anos 1980 pela contração (de memória (não verificado)).
- Capacidade técnica estatal (BC, Tesouro, IBGE) e o capital político da redemocratização.
- Mercado interno de grande escala, a ser ancorado em estabilidade monetária futura.

**Problemas estruturais.**

- Dívida externa: US$74,4 bi em 1982 (mais de US$90 bi incluindo curto prazo) após a moratória mexicana de agosto de 1982; acordo com o FMI em 1983 e moratória unilateral em 1987 (resumo de busca, PUC-Rio).
- Inflação: aproximadamente 2.000% em 1993 (Wikipedia, Economic history) ou 2.700% (resumo de busca) conforme o índice; a divergência não foi resolvida.
- Renda per capita: queda de 6% entre 1981 e 1992 e crescimento médio de 2,9% (Wikipedia, Economic history).
- Desigualdade elevada e crescimento da informalidade (de memória (não verificado)).
- Indexação desigual: quem tinha acesso a ativos indexados se protegia; o assalariado de baixa renda e o não bancarizado pagavam o imposto inflacionário (interpretação corrente; não conferida em fonte específica (não verificado)).

**Classes e grupos.**

| Classe | Posição | Efeito | Evidência |
|---|---|---|---|
| Assalariados de baixa renda e informais | Maiores pagadores do imposto inflacionário | Perda de poder de compra e informalidade | Inflação de ~2.000% a 2.700% em 1993 (fontes divergentes); papel do imposto inflacionário não conferido (não verificado) |
| Poupadores e classe média | Atingidos por planos de estabilização | Plano Collor: bloqueio de 80% dos depósitos acima de NCz$50 mil por 18 meses | Wikipedia (Plano Collor); inflação mensal de 81% em março de 1990 e 9% em junho |
| Bancos e detentores de ativos indexados | Ganharam com o 'floating' inflacionário | Lucros bancários com a inflação | Tese corrente, não conferida em fonte específica (não verificado) |
| Servidores públicos | Perdas salariais reais e crise fiscal | Arrocho do funcionalismo e depois estabilidade na CF/88 | Não conferido (não verificado) |
| Povos indígenas e quilombolas | Direitos constitucionais em 1988 (arts. 231-232; ADCT art. 68) | Reconhecimento formal, execução lenta | historia.json: indigena-231-1988, adct68-1988 |
| Mulheres e população negra | Constituição de 1988 e Lei Caó (1989) | Direitos civis ampliados; igualdade econômica distante | historia.json: l7716-1989; indicadores salariais (não verificado) |
| Devedores externos e Estado | Tesouro assume a dívida privada externa (de memória (não verificado)) | Socialização da dívida | Não conferido (não verificado) |

**Mudanças drásticas.**

| Data | Mudança | Descrição | Quem ganhou | Quem perdeu | Eventos (historia.json) |
|---|---|---|---|---|---|
| 1982-1983 | Crise da dívida externa | Moratória mexicana de agosto de 1982; o Brasil recorre ao FMI (acordo em 1983) e gera superávits para pagar juros; a década perdida segue com PIB per capita em queda até 1992. | Bancos credores internacionais. | Trabalhadores, Estado e investimento público. | `dante-1984` |
| 1986-1989 | Planos Cruzado, Bresser e Verão | Congelamentos de preços e proibição de indexação sem sustentação fiscal; fracassam em reduzir a inflação (Wikipedia, Economic history). A data do Cruzado (fev/1986) e do Verão (jan/1989) é de memória (não verificado). | Alguns grupos no curto prazo. | Consumidores e credibilidade do governo. | `constituinte-1987` |
| 1988-10-05 | Constituição de 1988 | Amplia direitos sociais, cria a seguridade social e o SUS (de memória (não verificado)) e reconhece direitos indígenas e quilombolas. | Trabalhadores, indígenas, quilombolas, servidores. | Pressão fiscal futura (debate). | `cf88-1988`, `indigena-231-1988`, `adct68-1988` |
| 1990-03-16 | Plano Collor (confisco) | Bloqueio de 80% dos depósitos acima de NCz$50.000 por 18 meses, retirada de cerca de 80% do meio circulante e troca do cruzado novo pelo cruzeiro 1:1; inflação cai de 81% em março para 9% em junho e volta a 20% em janeiro de 1991 (Wikipedia). | Governo (efeito fiscal de curto prazo). | Poupadores e empresas; recessão com forte queda do comércio e da produção. | `collor-1989`, `collor-impeach-1992` |
| 1993-1994 | Pico inflacionário | Inflação mensal de 46,58% em junho de 1994, às vésperas do Real (Wikipedia, Plano Real). | Detentores de ativos indexados. | Assalariados de baixa renda. | `real-1994` |

**Regiões.** Sudeste (urbano, industrial); Nordeste (pobreza, migração); Amazônia (colonização e garimpo, de memória (não verificado))

**Fontes.**

- [Economic history of Brazil - Wikipedia (en)](https://en.wikipedia.org/wiki/Economic_history_of_Brazil) - verificado
- [Plano Collor - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Plano_Collor) - verificado
- [Plano Real - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Plano_Real) - verificado
- [PUC-Rio TD 158, dívida externa (URL deu 404 em 07/10/2026; só trecho de busca)](https://www.econ.puc-rio.br/uploads/adm/trabalhos/files/td158.pdf) - NÃO verificado (URL deu 404 em 07/10/2026; só trecho de busca)
- [docs/HISTORIA.md e web/public/data/historia.json (repositório; fontes lá têm critério próprio)](docs/HISTORIA.md) - NÃO verificado (página não lida)

## Plano Real, abertura e privatizações (1994-2002)

`id: estabilizacao-real`

**Motor econômico.** Estabilização monetária com âncora cambial (R$1 = US$1 em julho de 1994), abertura comercial, privatizações, reformas institucionais (LRF 2000) e dependência de capitais de curto prazo; crises externas e mudança do câmbio em 1999 (de memória (não verificado)).

**Potenciais e uso.**

- Estabilidade de preços liberta o consumo popular: o Real incluiu cerca de 25 milhões de pessoas no consumo, segundo a Wikipedia (Economic history; número não cruzado).
- Mercado de infraestrutura aberto ao capital privado (telecomunicações, mineração, energia) e modernização regulatória (agências).
- Capacidade institucional do BC e do Tesouro; LRF (2000) como regra fiscal.

**Problemas estruturais.**

- Âncora cambial valorizada: o dólar chegou a R$0,85 em novembro de 1994 (Wikipedia) e deteriorou a balança comercial (de memória (não verificado)).
- Juros altos e dívida pública crescente (de memória (não verificado)).
- Privatização com desindustrialização relativa e debate sobre preços e tarifas; arrecadação do PND no governo Itamar: US$4,6 bi mais US$1,9 bi de dívida transferida (resumo de busca).
- Desigualdade de renda ainda elevada, Gini de 0,587 em 2002 (resumo de busca; no Ipeadata, a série DISOC_RDCG traz 0,589 e a PNADS_GINI, 0,603, ambas em 2002, lidas em 07/10/2026).
- Reforma agrária lenta e informalidade, sem dados conferidos (não verificado).

**Classes e grupos.**

| Classe | Posição | Efeito | Evidência |
|---|---|---|---|
| Trabalhadores de baixa renda | Fim do imposto inflacionário | Ganho de poder de compra com o Real | Primeiro IPC pós-Real de 6,08% (Wikipedia, Plano Real); 25 milhões incluídos no consumo (Wikipedia) |
| Classe média | Crédito e consumo, mas desemprego urbano em alta no fim da década | Beneficiária da estabilidade; vulnerável ao desemprego | Desemprego sem fonte conferida (não verificado) |
| Banqueiros e financeiras | Lucros com juros altos e ativos públicos | Rentabilidade elevada | Não conferido (não verificado) |
| Servidores públicos | Reformas administrativas e da Previdência (1998) | Perdas salariais e mudanças de carreira | Não conferido (não verificado) |
| Operários da indústria | Abertura comercial pressiona a indústria | Perda de postos formais na indústria de transformação | Não conferido (não verificado) |
| Povos indígenas | Decreto 1.775/1996 e contraditório | Demarcação ganha rito e mais judicialização | historia.json: d1775-1996 |
| Empresas estatais privatizadas e compradores | Novos donos da Vale (1997), Telebrás (1998) e outros | Transferência de patrimônio público | Telebrás desmembrada em 12 empresas em 1998 (resumo de busca); data da Vale de memória (não verificado) |

**Mudanças drásticas.**

| Data | Mudança | Descrição | Quem ganhou | Quem perdeu | Eventos (historia.json) |
|---|---|---|---|---|---|
| 1994-07-01 | Plano Real | URV desde 1º de março de 1994, conversão de CR$2.750 a R$1,00 e âncora de R$1 = US$1 (Wikipedia); a inflação cai e o dólar chega a R$0,85 em novembro de 1994. | Assalariados e consumidores de baixa renda; governo FHC. | Exportadores, indústria exposta ao câmbio valorizado e devedores externos. | `real-1994` |
| 1990-2002 | Privatizações e Programa Nacional de Desestatização | Lei 8.031, de 12/04/1990 (Politize, lido em 07/10/2026) e leilões de siderúrgicas, Vale (1997), telecomunicações (1998); o governo Itamar privatizou 15 empresas por US$4,6 bi (busca). | Compradores, consumidores de telefonia (expansão da oferta) e Tesouro (receita). | Servidores das estatais e a política industrial. | `real-1994` |
| 1997-06-04 | Reeleição (EC 16/1997) | Altera a dinâmica política do ciclo de estabilização. | Governo FHC. | Oposição. | `ec16-1997` |
| 2000-05-04 | Lei de Responsabilidade Fiscal | Limites de despesa com pessoal e endividamento para União, estados e municípios. | Credores e estabilidade fiscal. | Gestores com pouca margem; serviços públicos em municípios. | `lrf-2000` |

**Regiões.** Sudeste (privatizações e serviços); Nordeste (pouca industrialização, aumento do consumo); Centro-Oeste (agronegócio emergente)

**Fontes.**

- [Plano Real - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Plano_Real) - verificado
- [Economic history of Brazil - Wikipedia (en)](https://en.wikipedia.org/wiki/Economic_history_of_Brazil) - verificado
- [Privatização no Brasil - Politize! (lida em 07/10/2026: PND criado em 12/04/1990 pela Lei 8.031; ~US$ 78,6 bi arrecadados no governo FHC)](https://www.politize.com.br/privatizacao-no-brasil/) - verificado
- [IPECE NT 14 (jan/2006): nota técnica sobre o índice de Gini com dados do Ceará, Nordeste e Brasil de 2001/2004; lida em 07/10/2026 e NÃO contém a série 2002-2014 (título anterior estava errado)](https://www.ipece.ce.gov.br/wp-content/uploads/sites/45/2012/12/NT_14.pdf) - NÃO verificado (página lida em 07/10/2026; não contém a série 2002-2014)
- [docs/HISTORIA.md e web/public/data/historia.json (repositório; fontes lá têm critério próprio)](docs/HISTORIA.md) - NÃO verificado (página não lida)

## Boom de commodities e inclusão social (2003-2014)

`id: boom-commodities-inclusao`

**Motor econômico.** Alta dos preços de commodities e da demanda chinesa (de memória (não verificado)), expansão do crédito e do mercado interno, valorização do salário mínimo e transferências (Bolsa Família), com crescimento de 5,7% (2004), 6,1% (2007), 5,1% (2008) e 7,5% (2010) (Wikipedia, Economic history).

**Potenciais e uso.**

- Agronegócio e mineração competitivos (soja, minério de ferro, petróleo pré-sal; de memória (não verificado)).
- Estado capaz de transferir renda em escala: o Bolsa Família atendeu 12,7 milhões de famílias em 2010 por cerca de 0,4% do PIB em 2006 (Wikipedia).
- Mercado interno de massa com crédito e emprego formal.

**Problemas estruturais.**

- Reprimarização: a pauta volta a depender de commodities (de memória (não verificado)).
- Desigualdade ainda muito alta: Gini cai de 0,587 (2002) para 0,497 (2014) segundo resumo de busca (PNAD, renda domiciliar; o Ipeadata traz 0,589 para 0,518 na série DISOC_RDCG e 0,603 para 0,526 na PNADS_GINI; a queda se confirma, os níveis dependem da definição de renda e não reproduzem 0,587/0,497); o ritmo de queda estaciona em 2011-2013.
- Baixa produtividade e investimento, e carga tributária regressiva (de memória (não verificado)).
- Dependência política de coalizões e escândalos (Mensalão 2005-2012; historia.json: mensalao-2012).

**Classes e grupos.**

| Classe | Posição | Efeito | Evidência |
|---|---|---|---|
| Pobres e extremamente pobres | Beneficiários de transferências e do emprego formal | Queda de 75% da pobreza extrema entre 2001 e 2014, com múltiplas causas | Wikipedia (Bolsa Família): -75% entre 2001-2014; contribuição de mercado de trabalho e salários também citada |
| Trabalhadores formais de baixa renda | Salário mínimo real em alta | Aumento do poder de compra | Política de valorização do mínimo; percentuais exatos (não verificado) |
| Mulheres | Beneficiárias do cadastro do Bolsa Família (titulares principais) | Autonomia financeira parcial | Não conferido em fonte específica (não verificado) |
| População negra | Cotas (Lei 12.711/2012) e maior acesso ao ensino superior | Mobilidade educacional | historia.json: l12711-2012; efeitos na renda (não verificado) |
| Quilombolas e indígenas | Decreto 4.887/2003 e debates sobre terras e Belo Monte | Titulação lenta; pressão de obras | historia.json: d4887-2003; Belo Monte (não verificado) |
| Agronegócio e mineradoras | Beneficiários do boom | Expansão da fronteira e exportação | Não conferido (não verificado) |
| Classe média tradicional | Perda relativa de posição e concorrência por serviços | Insatisfação política crescente (hipótese) | Interpretação; não conferida (não verificado) |
| Servidores públicos | Expansão de concursos | Estabilidade e recomposição | Não conferido (não verificado) |

**Mudanças drásticas.**

| Data | Mudança | Descrição | Quem ganhou | Quem perdeu | Eventos (historia.json) |
|---|---|---|---|---|---|
| 2003-10-20 | Bolsa Família | Medida Provisória 132 (20/10/2003), convertida na Lei 10.836 (09/01/2004); 12,7 milhões de famílias em 2010; custo de 0,4% do PIB em 2006. | Famílias pobres e economias locais. | Críticas de 'dependência'; a Wikipedia cita avaliação do Banco Mundial de efeito desincentivo 'pequeno'. | - |
| 2003-2014 | Política de valorização do salário mínimo | Reajustes reais do mínimo; percentual preciso não verificado (não verificado). | Trabalhadores formais, aposentados. | Finanças públicas (benefícios previdenciários indexados, de memória (não verificado)). | - |
| 2008-2010 | Crise financeira global e resposta anticíclica | PIB de 5,1% em 2008 e 7,5% em 2010 (Wikipedia); 2009 em queda leve, de memória (não verificado). | Consumidores e indústria beneficiada por crédito público. | Contas públicas no médio prazo. | - |
| 2012-08-29 | Lei de Cotas | Reserva de vagas em universidades federais para escola pública, negros, pardos e indígenas. | Estudantes negros, indígenas e de escola pública. | Debate sobre mérito, sem perdedores diretos medidos. | `l12711-2012` |
| 2014-03-17 | Operação Lava Jato | Investigação de corrupção em Petrobras e empreiteiras; efeitos econômicos sobre construção e petróleo discutidos. | Instituições de controle (visibilidade). | Empreiteiras e empregos no setor (de memória (não verificado)). | `lj-2014` |

**Regiões.** Nordeste (maior ganho relativo de renda, de memória (não verificado)); Centro-Oeste (soja); Sudeste (pré-sal, indústria naval); Amazônia (hidrelétricas e fronteira agrícola)

**Fontes.**

- [Bolsa Família - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Bolsa_Fam%C3%ADlia) - verificado
- [Economic history of Brazil - Wikipedia (en)](https://en.wikipedia.org/wiki/Economic_history_of_Brazil) - verificado
- [IPECE NT 14 (jan/2006): nota técnica sobre o índice de Gini com dados do Ceará, Nordeste e Brasil de 2001/2004; lida em 07/10/2026 e NÃO contém a série 2002-2014 (título anterior estava errado)](https://www.ipece.ce.gov.br/wp-content/uploads/sites/45/2012/12/NT_14.pdf) - NÃO verificado (página lida em 07/10/2026; não contém a série 2002-2014)
- [docs/HISTORIA.md e web/public/data/historia.json (repositório; fontes lá têm critério próprio)](docs/HISTORIA.md) - NÃO verificado (página não lida)

## Recessão, ajuste fiscal e polarização (2015-2022)

`id: recessao-ajuste-polarizacao`

**Motor econômico.** Fim do ciclo de commodities, recessão de 2015-16, ajuste fiscal (EC 95), reformas liberalizantes (trabalhista 2017, previdência 2019), pandemia e estímulos emergenciais; baixo crescimento e inflação em alta em 2021-22.

**Potenciais e uso.**

- Setor agroexportador e mineral ainda competitivo; mercado interno de grande escala.
- Capacidade de resposta fiscal na pandemia: o auxílio emergencial de 2020 incluiu R$600 em cinco parcelas e R$300 em quatro, e reduziu a pobreza ao menor nível em 40 anos segundo o resumo de busca (Correio Braziliense).
- Digitalização e serviços (de memória (não verificado)).

**Problemas estruturais.**

- Recessão de 2015-2016: o PIB caiu 3,8% e 3,6% pela primeira divulgação, com 7,2% acumulados, a maior queda de um biênio desde 1948 segundo a coordenadora do IBGE citada pelo Money Times (o resumo de busca dizia 1947; divergência); a série atual do IBGE (SIDRA, tabela 6784) traz -3,5% em 2015 e -3,3% em 2016.
- Teto de gastos (EC 95/2016, promulgada em 15/12/2016) por 20 anos corrigido pelo IPCA (Congresso em Foco, lido); a compressão da despesa discricionária segue sem fonte lida.
- Informalidade: 41,1% do emprego em 2019 (Wikipedia, Reforma trabalhista) e desocupação de 14,9% no 1º tri de 2021, com 15,2 milhões de desocupados (Wikipedia, Pandemia).
- Polarização política e instabilidade institucional (impeachment 2016, 8 de janeiro de 2023 já fora do ciclo).

**Classes e grupos.**

| Classe | Posição | Efeito | Evidência |
|---|---|---|---|
| Desempregados e informais | Principais atingidos pela recessão e pela pandemia | Desemprego de 14,9% no 1º tri de 2021; aumento da informalidade na recuperação | Wikipedia (Pandemia): 15,2 milhões; 'recuperação com informalidade' |
| Trabalhadores formais | Mudança de regras (reforma trabalhista) | Negociado sobre o legislado, trabalho intermitente, fim da contribuição sindical obrigatória | Wikipedia (Reforma): 13,3% das vagas de 2019 foram intermitentes; ações trabalhistas -32% em dois anos |
| Pobres | Auxílio emergencial amortece a queda e depois cai | Pobreza no menor nível em 40 anos em 2020; recuo posterior | Resumo de busca (Correio Braziliense); trajetória pós-2020 (não verificado) |
| Servidores públicos | Congelamento e limites do teto | Perda real de salários em vários anos (de memória (não verificado)) | Não conferido (não verificado) |
| Mulheres e população negra | Maior perda de emprego na pandemia (de memória (não verificado)) | Aumento de cuidado não remunerado e desemprego | Não conferido (não verificado) |
| Povos indígenas e quilombolas | Pandemia e pressão ambiental | ADPF 709 (2020) e discussão sobre marco temporal | historia.json: indigena-adpf709-2020, re1017365-2023 |
| Elites financeiras e agroexportadoras | Juros altos e câmbio favorável à exportação (de memória (não verificado)) | Renda estável | Não conferido (não verificado) |

**Mudanças drásticas.**

| Data | Mudança | Descrição | Quem ganhou | Quem perdeu | Eventos (historia.json) |
|---|---|---|---|---|---|
| 2015-2016 | Recessão e ajuste | PIB cai 3,8% (2015) e 3,6% (2016) pela primeira divulgação (IBGE, via Money Times, lido; a série atual traz -3,5% e -3,3%); causas debatidas (política fiscal, preços externos e crise política). | Credores e quem tinha ativos indexados. | Desempregados, indústria, construção civil. | `dilma-2016`, `ec86-2015` |
| 2016-12-15 | EC 95/2016: teto de gastos | Limite federal da despesa primária por 20 anos corrigido pelo IPCA; o limite de 2017 correspondeu à despesa de 2016 mais 7,2% (resumo de busca). | Credores e mercado financeiro (previsibilidade). | Saúde, educação e investimento, segundo críticos; debate sobre rigidez. | `ec95-2016` |
| 2017-07-13 | Reforma trabalhista (Lei 13.467) | Aprovada em 296-177 na Câmara e 50-26 no Senado; vigência em 10/11/2017; prevê negociado sobre o legislado, trabalho intermitente e contribuição sindical voluntária; geração de empregos ficou aquém do prometido (Wikipedia). | Empregadores e trabalhadores com contratos flexíveis; menos litígios. | Sindicatos e trabalhadores com menor proteção. | `dilma-2016` |
| 2019-11-12 | Reforma da Previdência (EC 103/2019) | Idade mínima e novas regras; detalhes e estimativas de economia não verificados (não verificado). | Tesouro, em tese. | Futuros aposentados, em especial os de menor contribuição (não verificado). | - |
| 2020-2021 | Pandemia de COVID-19 e auxílio emergencial | Choque econômico e sanitário (716.238 mortes até 06/06/2025, Wikipedia); PIB de 2020 -4,1% pela primeira divulgação (Correio Braziliense); revisado depois para -3,3% na série atual do IBGE (SIDRA, tabela 6784, lida em 07/10/2026); auxílio emergencial de R$600 e depois R$300. | Famílias de baixa renda contempladas; setores digitais. | Informais, serviços presenciais, idosos e populações vulneráveis. | `indigena-adpf709-2020`, `lc179-2021` |
| 2021-02-24 | Autonomia do Banco Central (LC 179/2021) | Mandatos fixos para a diretoria do BC. | Credibilidade monetária. | Margem do Executivo sobre a política monetária. | `lc179-2021`, `rp9-2021` |

**Regiões.** Sudeste (desemprego industrial); Nordeste (dependência de transferências); Centro-Oeste (agronegócio); Amazônia (desmatamento, pandemia)

**Fontes.**

- [PIB fecha 2016 com queda de 3,6% - Money Times (lida em 07/10/2026; 1ª divulgação do IBGE)](https://www.moneytimes.com.br/pib-fecha-2016-com-uma-queda-de-36/) - verificado
- [Senado promulga emenda que congela gastos - Congresso em Foco (lida em 07/10/2026: promulgada em 15/12/2016, 20 anos, IPCA)](https://congressoemfoco.com.br/noticias/senado-promulga-emenda-constitucional-que-congela-gastos-da-uniao-nos-proximos-anos) - verificado
- [Reforma trabalhista no Brasil em 2017 - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Reforma_trabalhista_no_Brasil_em_2017) - verificado
- [Pandemia de COVID-19 no Brasil - Wikipedia (pt)](https://pt.wikipedia.org/wiki/Pandemia_de_COVID-19_no_Brasil) - verificado
- [PIB de 2020 e auxílio emergencial - Correio Braziliense (lida em 07/10/2026: -4,1% na 1ª divulgação)](https://www.correiobraziliense.com.br/economia/2021/03/4910096-pib-de-2020-e-o-terceiro-pior-da-historia-cenario-segue-nebuloso.html) - verificado
- [docs/HISTORIA.md e web/public/data/historia.json (repositório; fontes lá têm critério próprio)](docs/HISTORIA.md) - NÃO verificado (página não lida)

## Retomada, arcabouço fiscal e incerteza (2023-2026)

`id: retomada-incerteza`

**Motor econômico.** Retomada do consumo e das transferências, novo arcabouço fiscal (LC 200/2023), reforma tributária (EC 132/2023) e commodities; incertezas fiscais e eleitorais (eleição de 2026, resultado não verificado). Dados 2024-2026 não foram conferidos nesta rodada.

**Potenciais e uso.**

- Agroexportação, mineração e energia (petróleo e renováveis; de memória (não verificado)).
- Reforma tributária sobre consumo para simplificar impostos (EC 132/2023, historia.json) com efeito esperado de longo prazo (não verificado).
- Capacidade fiscal de combinar regras e flexibilidade, caso o arcabouço seja cumprido.

**Problemas estruturais.**

- Arcabouço fiscal: despesa limitada a 70% do crescimento real da receita, com banda de 0,6% a 2,5%; metas primárias de -1% (2023), 0% (2024), +0,5% (2025) e +1% (2026), segundo resumo de busca; cumprimento não conferido.
- Emendas parlamentares e orçamento secreto (RP9 declarado inconstitucional em 2022; historia.json) reduzem a margem do Executivo.
- Juros altos e dívida pública (de memória (não verificado)).
- Informalidade e baixa produtividade continuam (sem dado conferido para 2023-2026 (não verificado)).

**Classes e grupos.**

| Classe | Posição | Efeito | Evidência |
|---|---|---|---|
| Beneficiários de transferências | Voltam ao Bolsa Família e outros programas | Apoio à renda de baixa classe | Retorno do Bolsa Família citado em busca; valores e impactos (não verificado) |
| Servidores públicos | Pressão fiscal sobre despesas | Reajustes limitados pelo arcabouço | Não conferido (não verificado) |
| Mercado financeiro e credores | Beneficiários de juros altos | Receita financeira e demanda por credibilidade fiscal | Não conferido (não verificado) |
| Povos indígenas e quilombolas | Marco temporal, Yanomami e Censo 2022 | Conflito entre Judiciário e Legislativo; contagem quilombola inédita | historia.json: re1017365-2023, l14701-2023, pec48-2025, yanomami-2023, censo-2022 |
| Trabalhadores informais e mulheres | Mercado de trabalho com recuperação desigual | Sem dados conferidos | Não verificado (não verificado) |
| Agronegócio e mineração | Exportadores | Renda estável | Não conferido (não verificado) |

**Mudanças drásticas.**

| Data | Mudança | Descrição | Quem ganhou | Quem perdeu | Eventos (historia.json) |
|---|---|---|---|---|---|
| 2023-08-30 | Arcabouço fiscal (LC 200/2023) | Substitui o teto de gastos: limita a despesa a 70% do crescimento da receita, com piso de 0,6% e teto de 2,5%; punição automática reduz a 50% se a meta falhar (Money Times, lido em 07/10/2026). | Executivo (margem em relação ao teto) e credores (regra). | Despesas discricionárias; controvérsia sobre cumprimento. | `lc200-2023`, `ec95-2016` |
| 2023-12-20 | Reforma tributária (EC 132/2023) | Aprovada em 20/12/2023 (historia.json); efeitos econômicos de implantação gradual não verificados (não verificado). | Setores com maior carga cumulativa (tese). | Setores beneficiados por regimes especiais (tese). | `ec132-2023` |
| 2023-01-08 | Ataques de 8 de janeiro | Choque institucional com efeito sobre expectativas; efeito econômico direto não verificado (não verificado). | Nenhum identificado. | Confiança institucional. | `oito-janeiro-2023` |
| 2025-2026 | Condenações de 2025 e eleição de 2026 | Quadro político-institucional em disputa; resultado eleitoral e efeitos econômicos não foram verificados (não verificado). | Sem avaliação. | Sem avaliação. | `bolsonaro-2025`, `eleicao-2026` |

**Regiões.** Centro-Oeste e Sul (agronegócio); Nordeste (transferências e renováveis, de memória (não verificado)); Amazônia (Yanomami, desmatamento)

**Fontes.**

- [Arcabouço fiscal x teto de gastos - Money Times (lida em 07/10/2026: banda 0,6%-2,5%, 70% da receita, 50% se falhar a meta)](https://www.moneytimes.com.br/entenda-a-diferenca-entre-novo-arcabouco-fiscal-e-teto-de-gastos/) - verificado
- [docs/HISTORIA.md e web/public/data/historia.json (repositório; fontes lá têm critério próprio)](docs/HISTORIA.md) - NÃO verificado (página não lida)

## Classes transversais

### Escravizados, libertos e populações negras

Africanos e descendentes: do cativeiro (1530-1888) à exclusão pós-abolição e às políticas de cotas.

| Ciclo | Situação |
|---|---|
| acucar | Base do trabalho dos engenhos; resistência por quilombos (Palmares). |
| ouro-diamantes | Força de trabalho das lavras; capitação taxa também escravizados. |
| agroexportacao-imperial | Tráfico ilegal pós-1831; escravidão como base da agroexportação. |
| cafe-escravidao-abolicao | Abolição gradual; Lei Áurea sem reparação nem terra. |
| borracha-cafe-republica-velha | Liberdade formal e exclusão do voto; Revolta da Chibata (1910). |
| industrializacao-vargas | CLT sem cobertura rural e doméstica; Frente Negra (1931-37). |
| desenvolvimentismo | Lei Afonso Arinos (1951); migração rural-urbana. |
| milagre-endividamento | Censura ao tema racial; MNU (1978). |
| decada-perdida-hiperinflacao | Constituição de 1988 e Lei Caó. |
| estabilizacao-real | Sem dados conferidos para renda por raça. |
| boom-commodities-inclusao | Cotas (2012) e ganhos educacionais. |
| recessao-ajuste-polarizacao | Impacto desigual da recessão e da pandemia (hipótese não conferida). |
| retomada-incerteza | Sem dados conferidos. |

### Povos indígenas

Povos originários: escambo, cativeiro, aldeamentos, tutela e disputa por territórios.

| Ciclo | Situação |
|---|---|
| pau-brasil | Escambo e primeiro contato. |
| acucar | Escravização e aldeamentos; lei de 1570. |
| ouro-diamantes | Perdas com frentes mineradoras; Diretório (1757). |
| agroexportacao-imperial | Regulamento das Missões (1845). |
| cafe-escravidao-abolicao | Terras de aldeamento ficam potencialmente devolutas (Lei de Terras). |
| borracha-cafe-republica-velha | SPI (1910) e violência da borracha. |
| industrializacao-vargas | Marcha para o Oeste. |
| desenvolvimentismo | Parque do Xingu (1961). |
| milagre-endividamento | Transamazônica, FUNAI e mortes (CNV). |
| decada-perdida-hiperinflacao | Arts. 231-232 da CF/88. |
| estabilizacao-real | Decreto 1.775/1996. |
| boom-commodities-inclusao | Raposa Serra do Sol (2009) e Belo Monte. |
| recessao-ajuste-polarizacao | ADPF 709 na pandemia. |
| retomada-incerteza | Marco temporal e Yanomami. |

### Camponeses e posseiros

Lavradores sem título, agregados e trabalhadores rurais em um país de terra concentrada.

| Ciclo | Situação |
|---|---|
| acucar | Agregados e lavradores de cana. |
| agroexportacao-imperial | Posse sem lei de terras. |
| cafe-escravidao-abolicao | Lei de Terras exige compra. |
| borracha-cafe-republica-velha | Colonato e aviamento. |
| industrializacao-vargas | Fora da CLT. |
| desenvolvimentismo | Êxodo rural; reforma agrária em pauta (de memória). |
| milagre-endividamento | Conflitos fundiários e Araguaia. |
| decada-perdida-hiperinflacao | Reforma agrária na Constituinte (de memória). |
| boom-commodities-inclusao | Transferências alcançam o campo pobre. |
| recessao-ajuste-polarizacao | Sem dados conferidos. |
| retomada-incerteza | Sem dados conferidos. |

### Trabalhadores urbanos e informais

Operários, comerciários, domésticas e informais, entre CLT e informalidade.

| Ciclo | Situação |
|---|---|
| borracha-cafe-republica-velha | Operariado sem legislação ampla. |
| industrializacao-vargas | CLT (1943) e Justiça do Trabalho. |
| desenvolvimentismo | Crescimento do emprego industrial. |
| milagre-endividamento | Arrocho e sindicatos sob intervenção, com crescimento do emprego. |
| decada-perdida-hiperinflacao | Inflação alta e informalidade crescente. |
| estabilizacao-real | Fim do imposto inflacionário. |
| boom-commodities-inclusao | Salário mínimo em alta e emprego formal. |
| recessao-ajuste-polarizacao | Desemprego de 14,9% (2021) e reforma trabalhista. |
| retomada-incerteza | Sem dados conferidos. |

### Imigrantes

Europeus e asiáticos que vieram trabalhar nos cafezais e nas cidades.

| Ciclo | Situação |
|---|---|
| cafe-escravidao-abolicao | Início do subsídio em SP. |
| borracha-cafe-republica-velha | 3,52 milhões entre 1890 e 1929 (Wikipedia). |
| industrializacao-vargas | Imigração cai; restrições (de memória). |

### Elites agrárias

Proprietários de terra e senhores de engenho, barões do café e agronegócio.

| Ciclo | Situação |
|---|---|
| acucar | Senhores de engenho. |
| ouro-diamantes | Perdem peso relativo. |
| agroexportacao-imperial | Barões do café ascendem. |
| cafe-escravidao-abolicao | Lei de Terras e transição à imigração. |
| borracha-cafe-republica-velha | Hegemonia do café com leite e valorização estatal. |
| industrializacao-vargas | Perdem poder político, mantêm renda. |
| desenvolvimentismo | Questão agrária adiada. |
| milagre-endividamento | Expansão agropecuária subsidiada. |
| boom-commodities-inclusao | Agronegócio no boom. |
| retomada-incerteza | Agroexportação segue relevante (sem dado conferido). |

### Elites industriais e financeiras

Industriais, banqueiros e investidores de capital estrangeiro e nacional.

| Ciclo | Situação |
|---|---|
| borracha-cafe-republica-velha | Encilhamento e indústria leve. |
| industrializacao-vargas | CSN e proteção industrial. |
| desenvolvimentismo | Plano de Metas e GEIA. |
| milagre-endividamento | Crédito subsidiado e capital externo. |
| decada-perdida-hiperinflacao | Bancos ganham com a inflação (hipótese). |
| estabilizacao-real | Privatizações e juros altos. |
| recessao-ajuste-polarizacao | Teto de gastos e reformas. |
| retomada-incerteza | Juros altos e arcabouço (sem dado conferido). |

### Classe média e servidores

Profissionais urbanos, funcionários públicos e aposentados.

| Ciclo | Situação |
|---|---|
| desenvolvimentismo | Cresce com serviços e burocracia. |
| milagre-endividamento | Beneficiária do crédito e do emprego público. |
| decada-perdida-hiperinflacao | Confisco de 1990 e corrosão inflacionária. |
| estabilizacao-real | Crédito e consumo; reformas administrativas. |
| boom-commodities-inclusao | Concorrência por serviços e posição relativa. |
| recessao-ajuste-polarizacao | Congelamento salarial e reforma previdenciária. |
| retomada-incerteza | Pressão fiscal. |

### Mulheres

Trabalho produtivo e reprodutivo, direitos civis e desigualdade de renda.

| Ciclo | Situação |
|---|---|
| industrializacao-vargas | Voto feminino (1934) e proteção no trabalho. |
| milagre-endividamento | Domésticas sem direitos. |
| decada-perdida-hiperinflacao | Igualdade formal na CF/88. |
| boom-commodities-inclusao | Titulares do Bolsa Família. |
| recessao-ajuste-polarizacao | Perda de emprego na pandemia (hipótese). |

## Padrões de longa duração

- **Monocultura e commodity.** Sucessão de produtos dominantes (pau-brasil, açúcar, ouro, café, borracha, depois soja, minério e petróleo): cada ciclo concentra renda e infraestrutura em uma região e termina com choque externo ou esgotamento. Exemplos conferidos: café com 63% das exportações em 1891 e 51% em 1901-1910; colapso da borracha na década de 1910; quedas pós-1929.
- **Concentração fundiária e de renda.** A Lei de Terras (1850) e a abolição sem terra reforçaram a concentração (síntese da literatura; não confirmada em fonte primária nesta rodada). O Gini de renda domiciliar caiu de 0,587 (2002) para 0,497 (2014) em resumo de busca, mas permaneceu alto.
- **Dívida e inflação.** Empréstimos externos para sustentar o café (1906, 1930), o II PND (dívida de quase US$54 bi em 1980, em uma fonte; mais de US$90 bi em outra, divergência não resolvida) e a inflação de 2.000% a 2.700% em 1993 (conforme o índice) mostram o padrão: crédito externo em alta, choque, ajuste pago pela renda do trabalho.
- **Exclusão por desenho institucional.** Escravizados e libertos, indígenas (tutela, SPI, FUNAI), trabalhadores rurais e domésticos fora da CLT e informais sem proteção: a cidadania econômica foi sendo estendida em camadas.
- **Estado como ator central.** Do monopólio do pau-brasil e do quinto até a CSN, o Plano de Metas, as estatais da ditadura e o Bolsa Família, o Estado distribuiu custos e benefícios de forma desigual entre regiões e grupos.
- **Industrialização e desigualdade regional.** O Centro-Sul concentrou indústria desde o café; o Nordeste foi periferia relativa (SUDENE só em 1959).

## Controvérsias (ex.: dependência vs. instituições, papel do Estado)

- **Dependência vs. instituições.** Leituras cepalinas e da teoria da dependência enfatizam a posição periférica e os termos de troca; leituras institucionais (inclusive de Acemoglu e Robinson, em sentido amplo, de memória) enfatizam direitos de propriedade, concentração de terra e inclusão política. As duas explicam o que se repete (monocultura, desigualdade) com ênfases distintas; esta pesquisa não decidiu entre elas.
- **Papel do Estado.** O Plano de Metas e o II PND são lidos ora como aceleração produtiva, ora como origem de inflação e dívida; as privatizações dos anos 1990, ora como modernização (telefonia), ora como transferência de patrimônio.
- **Milagre e concentração.** A Wikipedia indica Gini de 0,581 (1970) a 0,589 (1979) e interpreta como sem grande aumento, enquanto o topo 5% concentra 36,3% da renda; outros autores veem forte concentração. A discussão sobre quanto foi arrocho e quanto composição não foi conferida.
- **Efeito do Bolsa Família.** A queda de 75% da pobreza extrema (2001-2014) tem múltiplas causas, incluindo mercado de trabalho e salário mínimo; a atribuição exata a cada fator não foi conferida.
- **Reforma trabalhista.** Defensores citam queda de 32% de ações trabalhistas em dois anos; críticos (sindicatos, OIT, MPT) apontam precarização, e o então presidente admitiu exagero nas projeções de emprego (Wikipedia).
- **Teto de gastos e arcabouço.** Defesa da disciplina fiscal versus crítica de compressão de investimento e serviços; o arcabouço de 2023 é mais flexível, mas seu cumprimento não foi conferido.
- **Lei de Terras.** Debate sobre o grau de efetividade versus o efeito de exclusão (historia.json).

## Itens não verificados

Lista (resumo; cada um está marcado no texto): dados de 2024-2026 e eleição de 2026; Tratado de 1810 e tarifa de 15%; Petrobras 1953 e PAEG; descobertas e Inconfidência (data); salário mínimo de 1940; população escrava em 1872/1887; Lei 8.031/1990 e data da Vale (1997); EC 103/2019 (estimativa de economia); Gini por fonte e por raça; efeito do câmbio de 1999; dados de desemprego por classe; valores de salário mínimo real; atribuição de fatores no Bolsa Família. Números vindos de resumos de busca (PIB 2015-16, EC 95, arcabouço, Gini 2002-2014, dívida externa 1982, privatizações, auxílio emergencial) têm fonte com verificado=false.

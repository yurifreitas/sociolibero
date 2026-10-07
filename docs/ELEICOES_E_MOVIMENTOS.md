# Eleições e movimentos do Brasil (1532-2026)

Linha do tempo de 60 eleições e marcos de regra, e fichas de 30 movimentos com força, todas com a mesma estrutura. Dados em `web/public/data/eleicoes_timeline.json`. Coletado em 2026-10-07. Não substitui pesquisa historiográfica. Revisada em 2026-10-07 (ver a seção 'Revisão', no fim).

## Como ler

- **Mesmo método para todos os campos políticos.** Cada movimento tem: origem, pautas, base social, organização, mídia e tecnologia, financiamento e regras, alianças e rupturas, viradas datadas, passos de construção, resultado eleitoral, declínio ou transformação e uma linha 'o que se sabe e o que é disputado'. O campo `espectro` (esquerda, centro, direita, transversal, n/a) é convenção editorial e aparece só para localizar; não é julgamento.
- **`verificado: true`** só quando o número ou fato foi lido numa página aberta nesta coleta ou na revisão de 07/10/2026: texto legal no Planalto ou na Câmara, dados abertos do TSE (1994-2026), página do TSE lida no navegador, fonte acadêmica aberta que cita tabela do TSE, ou (2022 e 2026) conferência no repositório contra os totais publicados do TSE (diferença 0). Resumos de busca, memória e páginas que deram erro ficam `false`. Wikipédia continua assinalada como secundária onde é a única fonte; Nicolau (CES-Coimbra) segue como fonte acadêmica principal para participação eleitoral.
- **Contagem separada de estimativa.** Votos, cadeiras e placares são contagem. Eleitorado antigo, público de comícios, militância e `pct_populacao` lido de gráfico são estimativa e vêm com `tipo` ou `nota`.
- **Divergência entre fontes** fica em `nota` e em `meta.revisao` (por exemplo, Prestes 57,7% ou 59,39% em 1930; MDB 160, 161 ou 165 cadeiras em 1974).
- **2026 é preliminar**: 1º turno em 04/10/2026; o 2º turno é em 25/10/2026 e ainda não ocorreu.
- Os percentuais regionais de Lula e Bolsonaro (movimentos lulismo e bolsonarismo) são cálculo nosso, sobre válidos municipais sem exterior.

## Linha do tempo

| Ano | Data | Tipo | Evento | Regime | Resultado (verificado) |
|---|---|---|---|---|---|
| 1532 | 1532-08 | municipal | Conselho/Câmara de vereadores de São Vicente | Colonial (capitania) | sem resultado lido |
| 1821 | 1821-05-14 | geral | Deputados do Brasil às Cortes Constituintes de Lisboa | Reino Unido de Portugal, Brasil e Algarves (monarquia em transição) | sem resultado lido |
| 1824 | 1824-03-25 | geral | Regras eleitorais do Império (Câmara, Senado vitalício por lista tríplice, assembleias provinciais) | Império (monarquia constitucional) | sem resultado lido |
| 1873 | 1873-10 | geral | Qualificação de votantes (censo eleitoral de 1872-73) | Império (monarquia constitucional) | sem resultado lido |
| 1881 | 1881-10-31 | geral | Câmara dos Deputados (1ª eleição direta, sob a Lei Saraiva, Decreto 3.029 de 09/01/1881) | Império (monarquia constitucional) | sem resultado lido |
| 1891 | 1891-02-25 | indireta | Presidente e vice (eleição pela Assembleia Constituinte) | República Velha | Deodoro da Fonseca 129 (55,13%); Prudente de Morais 97 (41,45%) |
| 1894 | 1894-03-01 | geral | Presidente (1ª eleição direta) | República Velha | Prudente de Morais 290.883 (88,38%); Afonso Pena 38.291 (11,32%) |
| 1898 | 1898-03-01 | geral | Presidente | República Velha | Campos Sales 420.286 (91,52%); Lauro Sodré 38.929 (8,48%) |
| 1904 | 1904-11-15 | geral | Lei nº 1.269 (Rosa e Silva): regras eleitorais federais | República Velha | sem resultado lido |
| 1910 | 1910-03-01 | geral | Presidente (campanha civilista) | República Velha | Hermes da Fonseca 403.867 (64,35%); Rui Barbosa 222.822 (35,51%) |
| 1919 | 1919-04-13 | geral | Presidente (eleição extraordinária após a morte de Rodrigues Alves) | República Velha | Epitácio Pessoa 286.373 (70,96%); Rui Barbosa 116.414 (28,85%) |
| 1922 | 1922-03-01 | geral | Presidente (Reação Republicana) | República Velha | Artur Bernardes 466.972 (59,46%); Nilo Peçanha 317.714 (40,46%) |
| 1930 | 1930-03-01 | geral | Presidente (Prestes x Vargas) | República Velha | Júlio Prestes 1.091.709 (59,39%); Getúlio Vargas 742.794 (40,41%) |
| 1932 | 1932-02-24 | geral | Decreto 21.076: Código Eleitoral e Justiça Eleitoral | Governo Provisório (Vargas) | sem resultado lido |
| 1933 | 1933-05-03 | constituinte | Assembleia Nacional Constituinte | Governo Provisório (Vargas) | sem resultado lido |
| 1934 | 1934-07-17 | indireta | Presidente (eleito pela Constituinte) | Governo Provisório → Constitucional | Getúlio Vargas 175 (70,58%); Borges de Medeiros 59 (23,79%) |
| 1937 | 1937-11-10 | geral | Eleição presidencial de janeiro de 1938 cancelada (golpe do Estado Novo) | Estado Novo | sem resultado lido |
| 1945 | 1945-12-02 | geral | Presidente e Assembleia Constituinte (Câmara e Senado) | Redemocratização (República de 1946) | Eurico Gaspar Dutra 3.251.507 (55,39%); Eduardo Gomes 2.039.341 (34,74%) |
| 1950 | 1950-10-03 | geral | Presidente e vice (votos separados) | República de 1946 | Getúlio Vargas 3.849.040 (48,73%); Eduardo Gomes 2.342.384 (29,66%) |
| 1955 | 1955-10-03 | geral | Presidente e vice (votos separados) | República de 1946 | Juscelino Kubitschek 3.077.411 (35,68%); Juarez Távora 2.610.462 (30,27%) |
| 1960 | 1960-10-03 | geral | Presidente e vice (votos separados) | República de 1946 | Jânio Quadros 5.636.623 (48,26%); Henrique Teixeira Lott 3.846.825 (32,94%) |
| 1962 | 1962-10-07 | geral | Câmara, Senado e 11 governadores | República de 1946 (parlamentarismo até jan/1963) | Leonel Brizola 269.384 |
| 1963 | 1963-01-06 | plebiscito | Plebiscito sobre parlamentarismo x presidencialismo | República de 1946 | Não 9.457.448 (82,02%); Sim 2.073.582 (17,98%) |
| 1964 | 1964-04-11 | indireta | Presidente (Congresso Nacional como Colégio Eleitoral, AI-1) | Ditadura civil-militar | Castelo Branco 361 (98,63%) |
| 1965 | 1965-10-27 | indireta | AI-2: fim dos partidos, bipartidarismo e eleição indireta de presidente | Ditadura civil-militar | sem resultado lido |
| 1966 | 1966-10-03 | indireta | Presidente (Costa e Silva) e legislativas de 15/11/1966 | Ditadura civil-militar | Arthur da Costa e Silva 294 |
| 1969 | 1969-10-25 | indireta | Presidente (Médici), Congresso reaberto sob AI-16 | Ditadura civil-militar | Emílio Garrastazu Médici 293 |
| 1970 | 1970-11-15 | geral | Câmara (310 cadeiras), 2/3 do Senado | Ditadura civil-militar | sem resultado lido |
| 1974 | 1974-01-15 | indireta | Presidente (Geisel) com 'anticandidatura' de Ulysses Guimarães | Ditadura civil-militar | Ernesto Geisel 400 (84,03%); Ulysses Guimarães 76 (15,97%) |
| 1974 | 1974-11-15 | geral | Senado (22 vagas), Câmara (364), assembleias | Ditadura civil-militar | MDB 10.954.359; ARENA 11.866.699 |
| 1976 | 1976-07-01 | municipal | Lei nº 6.339: propaganda restrita no rádio e TV | Ditadura civil-militar | sem resultado lido |
| 1977 | 1977-04-14 | geral | Pacote de Abril (Geisel): regras eleitorais por emenda e decreto-lei durante o recesso do Congresso (AC 102, de 01/04/1977; EC 7, de 13/04; EC 8 e DL 1.538, de 14/04; recesso suspenso em 15/04 pelo AC 103) | Ditadura civil-militar | sem resultado lido |
| 1978 | 1978-10-15 | indireta | Presidente (Figueiredo) | Ditadura civil-militar | João Figueiredo 355 (61,1%); Euler Bentes Monteiro 226 (38,9%) |
| 1978 | 1978-11-15 | geral | Senado (45 vagas, 22 indiretas), Câmara (420) | Ditadura civil-militar | sem resultado lido |
| 1982 | 1982-11-15 | geral | Governadores (22), Senado, Câmara | Abertura | Governadores eleitos: PDS 12; Governadores eleitos: PMDB 9 |
| 1984 | 1984-04-25 | geral | Votação da Emenda Dante de Oliveira (eleições diretas para presidente) | Abertura | Sim 298; Não 65 |
| 1985 | 1985-01-15 | indireta | Presidente (Colégio Eleitoral) | Abertura | Tancredo Neves 480 (72,73%); Paulo Maluf 180 (27,27%) |
| 1985 | 1985-05-15 | geral | EC 25/1985: voto do analfabeto | Abertura (Nova República) | sem resultado lido |
| 1986 | 1986-11-15 | constituinte | Câmara, Senado (2/3), 23 governadores (Congresso com poderes constituintes) | Nova República | Governadores: PMDB 22; Governadores: PFL 1 |
| 1988 | 1988-10-05 | geral | Constituição de 1988: sufrágio | Nova República | sem resultado lido |
| 1989 | 1989-11-15 | geral | Presidente (1ª eleição direta pós-ditadura; 2º turno em 17/12/1989) | Nova República | Fernando Collor 20.611.030 (30,48%); Lula 11.622.321 (17,19%) |
| 1993 | 1993-04-21 | plebiscito | Forma e sistema de governo | Nova República | República 43.881.747 (86,6%); Monarquia 6.790.751 (13,4%) |
| 1994 | 1994-10-03 | geral | Presidente (turno único; FHC vence no 1º turno) | Nova República | Fernando Henrique Cardoso 34.350.217 (54,28%); Lula 17.112.255 (27,04%) |
| 1996 | 1996-10-03 | municipal | Primeira eleição com urna eletrônica (Lei 9.100/1995) | Nova República | sem resultado lido |
| 1997 | 1997-06-04 | geral | EC 16/1997: reeleição para presidente, governadores e prefeitos | Nova República | sem resultado lido |
| 1998 | 1998-10-04 | geral | Presidente (reeleição de FHC no 1º turno) | Nova República | Fernando Henrique Cardoso 35.936.382 (53,06%); Lula 21.475.211 (31,71%) |
| 2002 | 2002-10-06 | geral | Presidente (2º turno em 27/10/2002) | Nova República | Lula 39.455.233 (46,44%); José Serra 19.705.445 (23,2%) |
| 2006 | 2006-10-01 | geral | Presidente (2º turno em 29/10/2006) | Nova República | Lula 46.662.365 (48,61%); Geraldo Alckmin 39.968.369 (41,64%) |
| 2010 | 2010-10-03 | geral | Presidente (2º turno em 31/10/2010) | Nova República | Dilma Rousseff 47.651.434 (46,91%); José Serra 33.132.283 (32,61%) |
| 2014 | 2014-10-05 | geral | Presidente (2º turno em 26/10/2014) | Nova República | Dilma Rousseff 43.267.668 (41,59%); Aécio Neves 34.897.211 (33,55%) |
| 2015 | 2015-09-17 | geral | STF: ADI 4650 proíbe doações de empresas a campanhas e partidos | Nova República | sem resultado lido |
| 2016 | 2016-10-02 | municipal | Prefeitos e vereadores (2º turno em 30/10/2016) | Nova República | Prefeituras PMDB 1.038 (18,6%); Prefeituras PSDB 803 (14,4%) |
| 2017 | 2017-10-06 | geral | EC 97/2017 e Lei 13.487/2017: fim das coligações proporcionais, cláusula de desempenho e fundo eleitoral (FEFC) | Nova República | sem resultado lido |
| 2018 | 2018-10-07 | geral | Presidente (2º turno em 28/10/2018) | Nova República | Jair Bolsonaro 49.277.010 (46,03%); Fernando Haddad 31.342.051 (29,28%) |
| 2020 | 2020-11-15 | municipal | Prefeitos e vereadores (2º turno em 29/11/2020; adiada pela EC 107/2020) | Nova República | Prefeituras MDB 784; Prefeituras PP 685 |
| 2022 | 2022-10-02 | geral | Presidente, 1º turno | Nova República | Lula 57.259.504 (48,43%); Jair Bolsonaro 51.072.345 (43,2%) |
| 2022 | 2022-10-30 | geral | Presidente, 2º turno | Nova República | Lula 60.345.999 (50,9%); Jair Bolsonaro 58.206.354 (49,1%) |
| 2024 | 2024-10-06 | municipal | Prefeitos e vereadores (2º turno em 27/10/2024) | Nova República | Prefeituras PSD 891 (15,99%); Prefeituras MDB 856 (15,37%) |
| 2026 | 2026-10-04 | geral | Presidente, 1º turno (PRELIMINAR) | Nova República | Flávio Bolsonaro 56.104.503 (47,03%); Lula 53.879.538 (45,16%) |
| 2026 | 2026-10-25 | geral | Presidente, 2º turno (AGENDADO, sem resultado) | Nova República | sem resultado lido |

## Regras ao longo do tempo

| Ano | Regra | Efeito no eleitorado | Verificado |
|---|---|---|---|
| 1532 | Primeira eleição municipal registrada (São Vicente). | Sem dado de votantes. | sim |
| 1821 | Eleição em graus para as Cortes de Lisboa. | Sem dado lido. | não |
| 1824 | Voto censitário e indireto em dois graus: renda de 100 mil réis para votar, 200 mil para ser eleitor de província e 400 mil para deputado; excluídos menores de 25 (com exceções), filhos-família, criados de servir, religiosos de comunidade claustral e, como eleitores de 2º grau, libertos; escravizados não eram cidadãos; o texto não menciona sexo. | Votantes de 5% a 10% da população até 1880 (Nicolau). | sim |
| 1873 | Qualificação de votantes: 1,1 milhão de votantes e 20 mil eleitores de 2º grau. | 10,9% da população qualificada como votante. | sim |
| 1881 | Lei Saraiva: eleição direta, alfabetização e prova de renda. | De 1.100.008 votantes (1873) para 142.856 eleitores (1882): -87%. | sim |
| 1889 | Decreto nº 6 (19/11/1889): consideram-se eleitores os cidadãos brasileiros em gozo dos direitos civis e políticos que saibam ler e escrever; some o censo de renda. | Sem efeito relevante no tamanho do eleitorado (Nicolau). | sim |
| 1891 | Constituição republicana: homens maiores de 21 anos alfabetizados; voto a descoberto; sem obrigatoriedade. | Média de 2,3% da população votando nas eleições presidenciais de 1894-1930; 5% em 1930. | sim |
| 1904 | Lei Rosa e Silva: distritos de 5, voto cumulativo, alistamento por petição. | Efeito não medido nas fontes lidas. | sim |
| 1932 | Código Eleitoral (Decreto 21.076): eleitor maior de 21 anos sem distinção de sexo, voto secreto, representação proporcional, Justiça Eleitoral, alistamento ex officio; mulheres podiam isentar-se de obrigações eleitorais (art. 121); a obrigatoriedade para homens e funcionárias vem da CF/1934 e de Nicolau. | 3,3% da população votou em 1933. | sim |
| 1934 | Constituição: eleitores de ambos os sexos com 18 anos (art. 108); voto obrigatório para homens e, para mulheres, só funcionárias públicas (art. 109). | Sem dado. | sim |
| 1937 | Estado Novo: suspensão de eleições e extinção de partidos. | Sem eleições até dez/1945. | sim |
| 1945 | Lei Agamenon (DL 7.586/1945): maiores de 18 anos, alfabetizados; voto obrigatório e secreto, com dispensa para mulheres sem profissão lucrativa e maiores de 65 anos; alistamento também ex officio por empresas, sindicatos e ordens (Nicolau). | Eleitores cadastrados de 1,44 milhão (1933) para 6,17 milhões (1945); 13,4% da população. | sim |
| 1946 | Constituição de 1946: eleitores maiores de 18 anos, sem analfabetos (arts. 131-132); alistamento e voto obrigatórios para os brasileiros de ambos os sexos, salvo exceções em lei (art. 133); voto secreto (art. 134). | Crescimento de 13,4% a 20,0% da população até 1962. | sim |
| 1950 | Código Eleitoral (Lei 1.164/1950): maiores de 18 anos; voto obrigatório para ambos os sexos, salvo (alistamento) inválidos, maiores de 70, residentes no exterior e mulheres sem profissão lucrativa; sigilo por sobrecarta oficial uniforme; vedado a partidos receber recursos de procedência estrangeira (arts. 144-145). | Mantém a exclusão de analfabetos; a isenção feminina só desaparece com a Lei 4.737/1965 (art. 6º). | sim |
| 1965 | AI-2: extinção dos partidos, eleição indireta de presidente por maioria absoluta do Congresso em votação nominal e STF com 16 ministros; o Código Eleitoral de julho de 1965 (art. 6º) iguala os deveres de homens e mulheres. | Eleições presidenciais indiretas até 1985. | sim |
| 1976 | Lei Falcão: propaganda no rádio e TV limitada a nome, número, currículo e retrato. | Sem efeito no tamanho do eleitorado; limitou a campanha. | sim |
| 1977 | Pacote de Abril (recesso de 01/04/1977; EC 7 e 8 e DL 1.538, de 13-14/04/1977): senadores biônicos, colégio ampliado para governadores, mandato de 6 anos, emendas por maioria absoluta, Lei Falcão estendida. | Sem efeito no eleitorado; efeito na composição. | sim |
| 1979 | Fim do bipartidarismo (MDB vira PMDB em 20/12/1979). | Cinco partidos em 1982. | sim |
| 1982 | Voto vinculado: voto anulado se o eleitor misturava partidos. | Eleitorado de 58,6 milhões. | sim |
| 1985 | EC 25 (15/05/1985): eleição direta do presidente em 2 turnos, eleitor de 18 anos, e a lei passa a dispor sobre alistamento e voto dos analfabetos (Lei 7.332, de 01/07/1985, art. 18); prefeitos de capitais eleitos em 15/11/1985. | Eleitorado de 1986 saltou 10,6 pontos percentuais da população (recadastramento e analfabetos). | sim |
| 1988 | Constituição: voto facultativo aos 16 e 17 anos, aos analfabetos e aos maiores de 70; obrigatório de 18 a 70 anos (art. 14, §1º); segundo turno presidencial (art. 77). | Eleitorado em torno de 50% da população desde 1986. | sim |
| 1993 | Plebiscito: república (86,60%) e presidencialismo (69,09%). | Eleitorado de 90,26 milhões; comparecimento de 73,36% (TSE). | sim |
| 1995 | Lei 9.096: cláusula de barreira de 5% (derrubada pelo STF em 07/12/2006). | Sem efeito prático lido. | sim |
| 1996 | Urna eletrônica em 57 cidades (eleição municipal de 03/10/1996, Lei 9.100/1995); em 2000, em todo o país (TSE). | Mais de 32 milhões de eleitores, um terço do eleitorado (TSE); eleitorado total 100,17 milhões. | sim |
| 1997 | EC 16: reeleição. | FHC reeleito em 1998 no 1º turno. | sim |
| 2015 | STF (ADI 4650, 17/09/2015): fim das doações de empresas. | Primeira eleição aplicada: 2016. | sim |
| 2017 | EC 97 (04/10/2017) e Lei 13.487 (06/10/2017): fim das coligações proporcionais (2020), cláusula de desempenho gradual (1,5% em 2018 a 3% em 2030) e FEFC. | FEFC de R$ 1,716 bi (2018) a R$ 4,962 bi (2022-2026). | sim |
| 2021 | Lei 14.208: federações partidárias (mínimo de 4 anos). | Três federações em 2022. | sim |

## Movimentos

### Abolicionismo e a política parlamentar do Império (1850-1888; transversal)

**Origem.** Depois da Lei Eusébio de Queirós (04/09/1850) e da Lei do Ventre Livre (28/09/1871), a escravidão passou a ser disputada no Parlamento e nas ruas; o Censo de 1872 fez a primeira matrícula geral de escravizados (abolic).

**Pautas.** Fim imediato e sem indenização (campanha radical depois de 1885); Leis graduais: Ventre Livre (1871) e Sexagenários (1885); Fim do tráfico interno e da fuga como tática

**Base social.** Profissionais liberais, jornalistas, estudantes, libertos e escravizados em fuga; participação feminina existiu (Sociedade Ave Libertas, PE, 1884) mas a historiografia a destacou menos (abolic).

**Organização.** Sociedade Brasileira Contra a Escravidão (1880, Nabuco e Patrocínio); Confederação Abolicionista (13/08/1883); Caifazes (Antônio Bento, interior de SP); Sociedade Dois de Julho (BA, 1852); Sociedade Ave Libertas (PE, 1884)

**Mídia e tecnologia.** Jornal O Abolicionista (Nabuco); Revista Ilustrada (Ângelo Agostini); Comícios públicos e conferências em teatros; Fotografia como documentação (1888)

**Financiamento e regras.** Voto censitário e indireto até 1881; a Lei Saraiva reduziu o eleitorado de 1,1 milhão de votantes (1873) para 142 mil eleitores (1882) (nicolau). Financiamento do movimento: Não verificado nesta rodada.

**Alianças e rupturas.** Lei Saraiva-Cotegipe (Sexagenários, 1885) como acordo parlamentar de minimização; Em 1884 a comissão eleitoral anulou a vitória de Nabuco no 1º distrito do Recife por alegada fraude (resumo de busca; não lido na íntegra); Parte da campanha radical rejeitou indenização a proprietários; segundo a página lida, a Lei Áurea sem indenização gerou adesão de ex-proprietários ao republicanismo

**Como se construiu.**
1. 1850-09-04: Lei Eusébio de Queirós proíbe o tráfico atlântico.
2. 1871-09-28: Lei do Ventre Livre abre a era das leis graduais.
3. 1880-1883: Organização em sociedades e confederação: imprensa ilustrada, comícios e teatros.
4. 1881: Lei Saraiva muda o eleitorado: direto, com alfabetização e renda; limita a base eleitoral em que o abolicionismo poderia ganhar.
5. 1884-1885: Campanha de Nabuco no Recife; eleição anulada em 1884 (resumo de busca). (não verificado)
6. 1885-09-28: Lei dos Sexagenários: compromisso parlamentar.
7. 1888-05-13: Lei Áurea.

**Resultado eleitoral.**
- lei-saraiva-1881: Sem desempenho eleitoral do movimento como tal medido: não há partido abolicionista com votos contados nas fontes lidas.

**Declínio ou transformação.** Com a Lei Áurea o movimento perdeu o objeto; parte do quadro migrou ao republicanismo; o eleitorado só voltou a crescer lentamente (Nicolau: 2,6% em 1912).

**O que se sabe e o que é disputado.** Disputado: o grau de iniciativa dos escravizados versus a elite parlamentar; a carta de 11/08/1889 atribuída à Princesa Isabel ao Visconde de Santa Vitória (compensação a libertos) está no acervo do Museu Imperial e, segundo reportagem lida (Jornal Opção), 'muitos historiadores discutem a autenticidade' apesar da caligrafia da princesa, de modo que a controvérsia verificável é o significado do documento (alegação de fonte jornalística, não confirmada em fonte acadêmica); o despacho de Rui Barbosa de 14/12/1890 mandou queimar papéis, livros e documentos sobre escravos nas repartições da Fazenda, e foi executado pela Circular nº 29, de 13/05/1891, do ministro Alencar Araripe (Fundação Casa de Rui Barbosa, lida); a Fundação sustenta que o fim era eliminar comprovantes fiscais que serviriam a pedidos de indenização e que 'arquivos da escravidão' não existiam como tais, enquanto Otávio Tarquínio de Sousa, citado, lamenta a perda de documentação; eficácia das leis graduais (apenas 118 'ingênuos' entregues ao governo, segundo a página lida). Sabe-se: datas e votações das leis.

**Fontes.** [Abolicionismo no Brasil - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Abolicionismo_no_Brasil); [Nicolau, J. 'A participação eleitoral: evidências sobre o caso brasileiro' (PDF, CES-Coimbra)](https://www.ces.uc.pt/lab2004/pdfs/JairoNicolau.pdf); [Lei Saraiva - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Lei_Saraiva); [Resumos de busca sobre Nabuco e a eleição de 1884 em Recife (infoescola, USP/BBM; não lidos na íntegra)](https://digital.bbm.usp.br/bitstream/bbm/4601/1/012050_COMPLETO.pdf); [Fundação Casa de Rui Barbosa. 'Rui Barbosa e a queima dos arquivos' (1988; lida)](https://www.gov.br/casaruibarbosa/pt-br/centrais-de-conteudo/publicacoes/pdfs/rui-barbosa-e-a-queima-dos-arquivos-ocr.pdf); [Jornal Opção, 'A carta da Princesa Isabel para o Visconde de Santa Victória' (imprensa; lida)](https://www.jornalopcao.com.br/ultimas-noticias/conheca-a-carta-que-indica-que-a-princesa-isabel-queria-pos-abolicao-incluir-os-escravizados-na-sociedade-825367/)

### Republicanismo: clubes, Manifesto de 1870 e Partido Republicano Paulista (1870-1894; transversal)

**Origem.** Dissidentes do Partido Liberal publicaram o Manifesto Republicano em 03/12/1870, no primeiro número do jornal A República, com 60 assinaturas (manifesto).

**Pautas.** República federal; Descentralização; Fim do Poder Moderador (leitura de fontes não lida nesta rodada)

**Base social.** Advogados, médicos, engenheiros, jornalistas e funcionários públicos, isto é, classes médias e altas urbanas (manifesto).

**Organização.** Clube Republicano (Rio, 1870); Jornal A República; Convenção de Itu (1873) e fundação do Partido Republicano Paulista

**Mídia e tecnologia.** Jornal A República; Clubes e convenções

**Financiamento e regras.** Voto censitário até 1881 e eleitorado reduzido depois; financiamento: Não verificado nesta rodada.

**Alianças e rupturas.** Quintino Bocaiúva e Saldanha Marinho entre os signatários; o grupo influenciou a Convenção de Itu (manifesto); Adesão de proprietários após a Lei Áurea sem indenização (abolic; página secundária, tese contestável)

**Como se construiu.**
1. 1870-12-03: Manifesto e jornal.
2. 1873: Convenção de Itu e PRP.
3. 1881: Direto com restrição: eleitorado em 1882 de 142.856 (1,2% da população) (Nicolau).
4. 1888-1889: Reação às medidas do Império; Proclamação em 15/11/1889. (não verificado)
5. 1894-03-01: Primeira eleição direta presidencial: Prudente de Morais 88,38% (votos a descoberto; 356 mil votantes).

**Resultado eleitoral.**
- pres-1894: Prudente de Morais 290.883 votos (88,38%); Afonso Pena 38.291 (11,32%).

**Declínio ou transformação.** Transformou-se em regime: a máquina do PRP e de outros partidos republicanos estaduais sustentou a 'política dos governadores' (governadores).

**O que se sabe e o que é disputado.** Disputado: o papel da classe de fazendeiros versus o do Exército na queda do Império; peso do Manifesto de 1870 (60 assinaturas) sobre o 15/11/1889. Sabe-se: datas e assinaturas; não se sabe nesta rodada o número de clubes republicanos.

**Fontes.** [Manifesto Republicano - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Manifesto_Republicano); [Eleição presidencial de 1894 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1894); [Nicolau, J. 'A participação eleitoral: evidências sobre o caso brasileiro' (PDF, CES-Coimbra)](https://www.ces.uc.pt/lab2004/pdfs/JairoNicolau.pdf); [Política dos governadores - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Pol%C3%ADtica_dos_governadores)

### Tenentismo e Coluna Prestes (1922-1930; transversal)

**Origem.** Revolta do Forte de Copacabana em 05/07/1922, contra a posse do presidente eleito Artur Bernardes e pela demissão do marechal Hermes da Fonseca (tenentismo).

**Pautas.** Voto secreto; Fim do voto de cabresto; Reforma do ensino público

**Base social.** Oficiais subalternos e médios do Exército, de classes médias urbanas (tenentismo).

**Organização.** Líderes: Eduardo Gomes, Siqueira Campos, Luís Carlos Prestes, Isidoro Dias Lopes, Juarez Távora, Cordeiro de Farias; Coluna Prestes: '1ª Divisão Revolucionária', comandada por Prestes e Miguel Costa, cerca de 1.500 combatentes, cerca de 25 mil km por 13 estados (coluna)

**Mídia e tecnologia.** Guerra de movimento; Revolta de 1924 em São Paulo com combates urbanos; Comuna de Manaus (1924)

**Financiamento e regras.** Sem financiamento eleitoral; movimento armado: Não verificado nesta rodada.

**Alianças e rupturas.** Maioria dos tenentes aderiu à Aliança Liberal em 1929 e, após 1930, vários viraram interventores (tenentismo); Prestes não aderiu à revolução de 1930 (página da Coluna não trata do tema; fato não lido)

**Como se construiu.**
1. 1922-03-01: Eleição de Artur Bernardes (59,46%) contestada por fraude.
2. 1922-07-05: Copacabana.
3. 1924: Revoltas de São Paulo e Manaus.
4. 1925-1927: Coluna Prestes.
5. 1929: Maioria adere à Aliança Liberal.
6. 1930-1964: Ex-tenentes em interventorias; muitos militares da geração de 1964 vieram desse meio (tenentismo, página lida).

**Resultado eleitoral.**
- pres-1930: Sem candidatura própria: apoio à Aliança Liberal (Vargas 40,41%).

**Declínio ou transformação.** Dispersão em interventorias e clubes (Clube 3 de Outubro, não lido).

**O que se sabe e o que é disputado.** Disputado: o grau de ideologia (reformismo militar, autoritarismo, programa social) e a relação com o Exército como instituição. Sabe-se: datas, extensão e efetivo aproximado da Coluna (fonte secundária sem ressalvas numéricas).

**Fontes.** [Tenentismo - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Tenentismo); [Coluna Prestes - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Coluna_Prestes); [Eleição presidencial de 1922 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1922); [Eleição presidencial de 1930 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1930)

### Aliança Liberal e a Revolução de 1930 (1929-1930; transversal)

**Origem.** Coalizão formada em agosto de 1929 por Minas Gerais e Rio Grande do Sul, com oposições de outros estados (incluindo o Partido Democrático de São Paulo), para as candidaturas de Getúlio Vargas e João Pessoa (aliancalib).

**Pautas.** Voto secreto; Justiça Eleitoral; Independência do Judiciário; Anistia aos revolucionários; Proteção ao trabalho

**Base social.** Dissidências oligárquicas, tenentes e setores urbanos (aliancalib e rev1930).

**Organização.** Presidente: Afonso Pena Júnior; vice: Ildefonso Simões Lopes; PRM, Partido Libertador, PRR e Partido Democrático (SP)

**Mídia e tecnologia.** Comícios e imprensa de oposição (não lidos em detalhe); Combate armado em 3-24/10/1930 com artilharia e aviação (rev1930)

**Financiamento e regras.** Sem financiamento regulado; voto a descoberto e máquinas estaduais do lado governista. Não verificado nesta rodada.

**Alianças e rupturas.** Aliança entre oligarquias dissidentes e tenentes; A derrota eleitoral em 01/03/1930 foi contestada como fraude; Morte de João Pessoa em 26/07/1930 ('episódio decisivo para a mobilização', rev1930)

**Como se construiu.**
1. 1929-08: Formação da aliança.
2. 1930-03-01: Derrota nas urnas (59,39% x 40,41%).
3. 1930-07-26: Morte de Pessoa e mobilização.
4. 1930-10-03: Insurreição a partir de Porto Alegre.
5. 1932-02-24: Código Eleitoral cumpre pauta do voto secreto e da Justiça Eleitoral.

**Resultado eleitoral.**
- pres-1930: Vargas 742.794 votos (40,41%).

**Declínio ou transformação.** Transformou-se em governo provisório e, depois, na base do getulismo e dos interventores.

**O que se sabe e o que é disputado.** Disputado: peso da fraude sobre o resultado (a fonte lida só informa a alegação), papel do assassinato de João Pessoa (cuja motivação era local, segundo a página lida) e da adesão tenentista. A porcentagem de Prestes varia entre 57,7% e 59,39% conforme a base de cálculo.

**Fontes.** [Aliança Liberal - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Alian%C3%A7a_Liberal); [Eleição presidencial de 1930 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1930); [Revolução de 1930 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Revolu%C3%A7%C3%A3o_de_1930); [Código Eleitoral de 1932 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/C%C3%B3digo_Eleitoral_de_1932)

### Integralismo (Ação Integralista Brasileira) (1932-1937 (e PRP até 1965); direita)

**Origem.** Fundada em 07/10/1932 por Plínio Salgado a partir da Sociedade de Estudos Políticos (aib).

**Pautas.** Ultranacionalismo; Corporativismo; Tradicionalismo católico; Anticomunismo

**Base social.** Classes médias; número de filiados: estimativas de 600 mil a 1 milhão em 1936 e 'mais de 1,3 milhão em 3.600 núcleos' em out/1937, declaração do próprio movimento (aib).

**Organização.** Milícia de camisas-verdes; Sigma (Σ) e saudação 'anauê'; Núcleos municipais; Jornais como A Offensiva

**Mídia e tecnologia.** Imprensa própria; Desfiles e símbolos; Núcleos

**Financiamento e regras.** Financiamento: Não verificado nesta rodada. Regras: a candidatura presidencial de 1937 foi cancelada pelo golpe de 10/11/1937 e o partido, dissolvido.

**Alianças e rupturas.** Apoio inicial ao golpe de 1937 não lido; dissolvido após o golpe (aib); Egressos reorganizaram-se no PRP (1945-1965)

**Como se construiu.**
1. 1932-10-07: Manifesto e fundação.
2. 1933-1936: Crescimento a 600 mil-1 milhão de membros (estimativa).
3. 1937: Candidatura presidencial; golpe do Estado Novo.
4. 1945-1955: Reorganização no PRP.
5. 1955-10-03: Plínio Salgado: 8,28%.

**Resultado eleitoral.**
- pres-1955: Plínio Salgado 714.379 votos (8,28%).

**Declínio ou transformação.** Dissolução em 1937; sobrevive como PRP (1945-1965); extinto pelo AI-2 (a página do AI-2 lista a extinção de todos os partidos).

**O que se sabe e o que é disputado.** Disputado: o número de membros (a própria AIB declarou 1,3 milhão; estimativa independente 600 mil a 1 milhão); a classificação como fascismo versus integralismo católico próprio. Sabe-se: fundação e dissolução.

**Fontes.** [Ação Integralista Brasileira - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/A%C3%A7%C3%A3o_Integralista_Brasileira); [Estado Novo (Brasil) - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Estado_Novo_(Brasil)); [Eleição presidencial de 1955 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1955)

### Aliança Nacional Libertadora (1935; esquerda)

**Origem.** Lançada em março de 1935 no Rio de Janeiro com manifesto lido pelo estudante Carlos Lacerda; programa de fevereiro de 1935 (anl).

**Pautas.** Suspensão do pagamento da dívida externa; Nacionalização de empresas estrangeiras; Reforma agrária; Liberdades democráticas e governo popular

**Base social.** Militares, sindicalistas, intelectuais; segundo a página lida, cerca de 1 milhão de membros no auge (número do movimento/da página; sem fonte independente).

**Organização.** Presidente: Herculino Cascardo; presidente de honra: Luís Carlos Prestes; Aderentes: Miguel Costa, Maurício de Lacerda, Abguar Bastos

**Mídia e tecnologia.** Dois jornais diários (Rio e SP); Comícios de massa

**Financiamento e regras.** Financiamento: Não verificado nesta rodada. Fechada em 11/07/1935 com base na Lei de Segurança Nacional.

**Alianças e rupturas.** Ruptura com o governo após o manifesto de Prestes de 05/07/1935 pedindo a derrubada do governo; Levante de novembro de 1935 e repressão

**Como se construiu.**
1. 1935-02: Programa básico.
2. 1935-03: Lançamento em ato público.
3. 1935-07-05: Manifesto de Prestes.
4. 1935-07-11: Fechamento.
5. 1935-11: Levante armado e repressão intensa.
6. 1937-11-10: Estado Novo.

**Resultado eleitoral.**
- estado-novo-1937: Sem eleições no período; não há desempenho eleitoral medido.

**Declínio ou transformação.** Fechamento e repressão; o PCB só voltou legal em 1945 (página de 1945) e foi cassado em 1947-48.

**O que se sabe e o que é disputado.** Disputado: a relação com a Internacional Comunista e o papel do levante de novembro no endurecimento do regime; o número de 1 milhão de membros (fonte secundária, sem contagem). Sabe-se: datas de lançamento e fechamento.

**Fontes.** [Aliança Nacional Libertadora - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Alian%C3%A7a_Nacional_Libertadora); [Estado Novo (Brasil) - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Estado_Novo_(Brasil)); [Eleições gerais de 1945 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_gerais_no_Brasil_em_1945)

### Trabalhismo e getulismo (PTB, CLT, sindicatos) (1930-1965; transversal)

**Origem.** O PTB foi criado em 15/05/1945 por Vargas, no Rio, para organizar politicamente os trabalhadores urbanos e o sindicalismo, com o ministro do Trabalho Alexandre Marcondes Filho; apoiou-se na CLT (1943) e na Justiça do Trabalho (Decreto-Lei 1.237, de 02/05/1939) (ptb, estado_novo).

**Pautas.** Direitos trabalhistas; Nacionalismo ('o petróleo é nosso', 1950); Desenvolvimento

**Base social.** Trabalhadores urbanos e sindicatos; PTB cresceu de 22 deputados federais (1946) para 66 (1958) e 116 (1962) (ptb).

**Organização.** PTB, PSD (também fundado por Vargas); Ministério do Trabalho e sindicatos oficiais; Líderes: Vargas, João Goulart (presidente do PTB 1952-1964), Leonel Brizola

**Mídia e tecnologia.** Rádio e propaganda oficial (DIP no Estado Novo); Jingle de 1950 'Retrato do Velho' (p1950)

**Financiamento e regras.** Sem financiamento regulado; extinto pelo AI-2 em 27/10/1965 (ptb). Financiamento: Não verificado nesta rodada.

**Alianças e rupturas.** Aliança PSD-PTB (JK 1955, Jango vice, 1955/1960); Antagonismo com a UDN; Queremistas apoiaram Dutra em 1945 por indicação de Vargas (queremismo)

**Como se construiu.**
1. 1939-05-02: Justiça do Trabalho organizada pelo Decreto-Lei 1.237.
2. 1943: CLT.
3. 1945-05-15: PTB.
4. 1945-12-02: 22 cadeiras na Câmara.
5. 1950-10-03: Vargas 48,73%.
6. 1958-1962: 66 e depois 116 deputados (ou 104 em 1962 pela página da eleição).
7. 1965-10-27: Extinto pelo AI-2.

**Resultado eleitoral.**
- pres-1945: Sem candidato próprio; apoio a Dutra (55,39%); PTB 22 deputados.
- pres-1950: Vargas 3.849.040 (48,73%).
- pres-1955: Goulart vice com 3.591.409 (44,25%).
- geral-1962: PTB 104 cadeiras (25,4%) na Câmara.

**Declínio ou transformação.** Extinção em 1965; parte migrou ao MDB (ptb); heranças em PDT e PTB posterior (não lidos).

**O que se sabe e o que é disputado.** Disputado: a natureza do getulismo. A leitura clássica de 'populismo' (massa manipulada) foi criticada por Ângela de Castro Gomes ('A invenção do trabalhismo', 'pacto trabalhista' com trabalhadores como sujeitos) e discutida em coletânea organizada por Jorge Ferreira (fonte lida só em resumo de busca). Sabe-se: datas, números de bancada e votos de Vargas.

**Fontes.** [Partido Trabalhista Brasileiro (1945) - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Partido_Trabalhista_Brasileiro_(1945)); [Estado Novo (Brasil) - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Estado_Novo_(Brasil)); [Eleição presidencial de 1950 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1950); [Eleições gerais de 1945 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_gerais_no_Brasil_em_1945); [Resumo de busca: Gomes, A. C. 'A invenção do trabalhismo'; Ferreira, J. (org.) 'O populismo e sua história' (obras não lidas; só resumo de busca)](https://fpabramo.org.br/lula-e-a-nova-historia-do-brasil/); [Eleições gerais de 1962 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_gerais_no_Brasil_em_1962); [Ato Institucional nº 2 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Ato_Institucional_N%C3%BAmero_Dois); [Decreto-Lei nº 1.237, de 02/05/1939 (Justiça do Trabalho) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/decreto-lei/1937-1946/del1237.htm)

### Queremismo ('Queremos Getúlio') (1945; n/a)

**Origem.** Movimento popular que pedia a permanência de Vargas e uma Constituinte antes das eleições; comício de 20/08/1945 no Largo da Carioca, Rio (queremismo).

**Pautas.** Constituinte com Getúlio; Permanência de Vargas no poder

**Base social.** Setores populares urbanos e lideranças como Hugo Borghi (queremismo).

**Organização.** Comícios; Lideranças queremistas (Hugo Borghi)

**Mídia e tecnologia.** Comícios; slogan 'Ele disse: Vote em Dutra!' (atribuído a Vargas)

**Financiamento e regras.** Financiamento: Não verificado nesta rodada.

**Alianças e rupturas.** Hugo Borghi convenceu Vargas a apoiar Dutra, pelo risco de Eduardo Gomes desmontar o Estado Novo (queremismo)

**Como se construiu.**
1. 1945-08-20: Comício.
2. 1945-10-29: Deposição de Vargas.
3. 1945-12-02: Dutra eleito com 55,39%.

**Resultado eleitoral.**
- pres-1945: Apoio de Vargas a Dutra; Dutra 3.251.507 (55,39%).

**Declínio ou transformação.** Incorporado ao PTB e ao PSD.

**O que se sabe e o que é disputado.** Disputado: se o queremismo foi mobilização espontânea ou construída pelo governo. Não verificado.

**Fontes.** [Eleição presidencial de 1945 - Wikipédia (queremismo, 'Ele disse')](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1945); [Eleição presidencial de 1945 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1945); [Estado Novo (Brasil) - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Estado_Novo_(Brasil))

### UDN e o antigetulismo (1945-1965; direita)

**Origem.** Fundada em 07/04/1945 como frente anti-Vargas: políticos afastados em 1930 e intelectuais liberais; lema da 'vigilância eterna' (udn).

**Pautas.** Oposição a Vargas e ao populismo; Liberalismo e moralização

**Base social.** Camadas médias e oligarquias dissidentes (página lida cita Mangabeira, Júlio Prestes e Carlos Lacerda).

**Organização.** Líderes: Otávio Mangabeira, Júlio Prestes, Carlos Lacerda, Brigadeiro Eduardo Gomes, Juarez Távora

**Mídia e tecnologia.** Imprensa (a página não detalha; Tribuna da Imprensa é citação de memória, não verificada); Rádio e comícios

**Financiamento e regras.** Financiamento: Não verificado nesta rodada. Em 1962 a UDN integrou campanhas apoiadas pelo IBAD/ADEP (ibad; ver geral-1962).

**Alianças e rupturas.** Candidaturas: Eduardo Gomes (1945, 1950), Juarez Távora (1955), apoio a Jânio (1960); Ala de Lacerda participou da Frente Ampla contra o regime após 1964 (página lida)

**Como se construiu.**
1. 1945-04-07: Fundação.
2. 1945-12-02: Eduardo Gomes 34,74%; 82 deputados.
3. 1950-10-03: 29,66%.
4. 1955-10-03: 30,27%.
5. 1960-10-03: Apoio a Jânio.
6. 1962-10-07: 94 deputados (23%).
7. 1965-10-27: Extinção.

**Resultado eleitoral.**
- pres-1945: Eduardo Gomes 2.039.341 (34,74%); 82 deputados.
- pres-1950: Eduardo Gomes 2.342.384 (29,66%).
- pres-1955: Juarez Távora 2.610.462 (30,27%).
- pres-1960: Apoio a Jânio 5.636.623 (48,26%).
- geral-1962: UDN 94 cadeiras (23%).

**Declínio ou transformação.** Extinção em 1965; muitos quadros foram para a ARENA (udn).

**O que se sabe e o que é disputado.** Disputado: classificação do antigetulismo como liberalismo ou como golpismo em 1954-55 e 1964; o grau de apoio da UDN ao golpe de 1964 não foi lido em fonte. Sabe-se: votos e datas.

**Fontes.** [União Democrática Nacional - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Uni%C3%A3o_Democr%C3%A1tica_Nacional); [Eleição presidencial de 1945 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1945); [Eleição presidencial de 1950 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1950); [Eleição presidencial de 1955 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1955); [Eleição presidencial de 1960 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1960); [Eleições gerais de 1962 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_gerais_no_Brasil_em_1962); [IBAD - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Instituto_Brasileiro_de_A%C3%A7%C3%A3o_Democr%C3%A1tica); [Ato Institucional nº 2 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Ato_Institucional_N%C3%BAmero_Dois)

### Desenvolvimentismo (Juscelino Kubitschek) (1955-1961; transversal)

**Origem.** Plano de Metas (1956-1961) com 30 metas em cinco áreas (energia, transportes, alimentação, indústria de base, educação) e o lema '50 anos em 5' (metas).

**Pautas.** Industrialização; Capital estrangeiro; Brasília

**Base social.** Coalizão PSD-PTB; JK 35,68% em 1955, com Goulart (PTB) vice (p1955).

**Organização.** Presidente e ministérios do Plano de Metas; Instituições associadas ao período: Eletrobrás (autorizada pela Lei 3.890-A, de 25/04/1961, já depois do mandato de JK), CSN (anterior a JK, dado de memória) e UnB (fundação de 1962, não estatal)

**Mídia e tecnologia.** Propaganda de obras; Brasília como símbolo do plano (metas)

**Financiamento e regras.** Financiamento da campanha: Não verificado nesta rodada. Do plano: capital estrangeiro, gasto público com déficit e dívida (metas).

**Alianças e rupturas.** PSD-PTB; a UDN foi oposição (p1955); Contragolpe de Lott em 11/11/1955 garantiu a posse (historia.json: lott-1955)

**Como se construiu.**
1. 1955-10-03: Eleição.
2. 1956: Plano de Metas.
3. 1956-1961: Execução (hidrelétricas, rodovias, refino 308.600 barris/dia em 1961).
4. 1960-10-03: Sucessão: Lott (PSD-PTB) 32,94% contra Jânio 48,26%.

**Resultado eleitoral.**
- pres-1955: JK 3.077.411 (35,68%).
- pres-1960: Candidato Lott, apoiado por PSD-PTB: 3.846.825 (32,94%), derrotado.

**Declínio ou transformação.** A coalizão não elegeu o sucessor em 1960.

**O que se sabe e o que é disputado.** Disputado: custo (dívida, inflação) e dependência de capital estrangeiro; concentração industrial no Sudeste (metas). Sabe-se: metas de capacidade elétrica e refino.

**Fontes.** [Plano de Metas - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Plano_de_Metas); [Eleição presidencial de 1955 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1955); [Eleição presidencial de 1960 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1960); [Lei nº 3.890-A, de 25/04/1961 (Eletrobrás) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/leis/L3890Acons.htm)

### Jânio Quadros e o 'varre-varre' (1947-1961; n/a)

**Origem.** Carreira rápida: vereador (1947), deputado estadual (1951), prefeito (1953), governador de SP (1955), presidente (1961) (janio).

**Pautas.** Combate à corrupção (símbolo da vassoura); Política externa independente; Austeridade

**Base social.** Eleitorado amplo; 5,6 milhões de votos, o maior total até então (janio).

**Organização.** Candidatura por PTN, apoio de UDN, PR, PL e PDC; Chapa 'Jan-Jan' (Jânio e Jango) pelo voto separado de vice

**Mídia e tecnologia.** Jingle 'varre, varre vassourinha'; Símbolo da vassoura

**Financiamento e regras.** Regras: voto separado para vice permitiu a eleição de Jango (p1960). Financiamento: Não verificado nesta rodada.

**Alianças e rupturas.** A UDN apoiou o candidato sem integrá-lo; Renúncia em 25/08/1961, aceita pelo Congresso

**Como se construiu.**
1. 1947: Vereador de SP com 1.707 votos.
2. 1953: Prefeito de SP.
3. 1955: Governador, vence por cerca de 1%.
4. 1960-10-03: Presidente.
5. 1961-08-25: Renúncia.

**Resultado eleitoral.**
- pres-1960: 5.636.623 votos (48,26%).

**Declínio ou transformação.** A renúncia abriu a crise da posse de Goulart e o plebiscito de 1963 (historia.json: janio-1961, plebiscito-1963).

**O que se sabe e o que é disputado.** Disputado: motivo da renúncia (a página lida diz que ele possivelmente esperava apoio popular que não veio). Não verificado.

**Fontes.** [Jânio Quadros - Wikipédia (secundária; lida só a 1ª parte)](https://pt.wikipedia.org/wiki/J%C3%A2nio_Quadros); [Eleição presidencial de 1960 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1960)

### Marcha da Família e o golpe de 1964 (1963-1964; direita)

**Origem.** Resposta ao comício de Goulart na Central do Brasil (13/03/1964); marcha de 19/03/1964 em São Paulo (marcha).

**Pautas.** Anticomunismo; Defesa da família e da religião; Destituição de Goulart

**Base social.** Camadas médias urbanas; o embaixador dos EUA Lincoln Gordon registrou 'participação limitada das camadas populares' (marcha).

**Organização.** Campanha da Mulher pela Democracia (Camde); IPES, Fiesp e associações empresariais (30 assinaram o manifesto); Hierarquia católica; Governadores Ademar de Barros e Carlos Lacerda

**Mídia e tecnologia.** Comícios, 49 marchas entre 19/03 e 08/06/1964; Imprensa e rádio (não detalhados)

**Financiamento e regras.** IBAD/ADEP financiaram candidatos anti-Goulart em 1962 (ibad); o embaixador Gordon estimou cerca de US$ 5 milhões de recursos norte-americanos a candidatos em 1962 (entrevistas de 1977 e 2002, lidas em monografia); a CPI do IBAD registrou Cr$ (cerca de 5 bilhões); não há valor em dólares documentado em CPI. Marcha: financiamento Não verificado nesta rodada.

**Alianças e rupturas.** Congregação de empresários, Igreja, militares e políticos; Golpe em 31/03/1964, AI-1 em 09/04/1964

**Como se construiu.**
1. 1959-05: Fundação do IBAD.
2. 1962-10-07: IBAD/ADEP nas eleições.
3. 1963-12-20: IBAD e ADEP dissolvidos por ordem judicial.
4. 1964-03-13: Comício na Central.
5. 1964-03-19: Marcha de São Paulo.
6. 1964-03-31: Golpe.
7. 1964-04-11: Castelo Branco eleito pelo Congresso com 361 votos.

**Resultado eleitoral.**
- indireta-1964: Castelo Branco 361 de 366 votos válidos; não houve voto popular.

**Declínio ou transformação.** O movimento se dissolveu após o golpe; os partidos foram extintos pelo AI-2 (ai2).

**O que se sabe e o que é disputado.** Disputado: peso dos EUA e do IBAD/IPES; sobre o padre Patrick Peyton, o artigo acadêmico lido (Estudos Históricos, 2024) mostra, em documento da CIA (reunião de 23/11/1960), a proposta de Peter Grace de encorajar Peyton a atuar em Cuba, e relata, com base em biografia (Gribble, 2003), que Grace 'teria intermediado' financiamento da CIA à Cruzada do Rosário em Família; nada ali sustenta que Peyton fosse 'agente da CIA', e o vínculo da Cruzada com as Marchas é de continuidade organizacional (a Cruzada de 1962 é vista como embrião delas), não de financiamento documentado das Marchas; tratar como alegação baseada em fonte secundária; estimativas de público (300 mil a 500 mil; 1 milhão) sem indicação do autor da contagem.

**Fontes.** [Marcha da Família com Deus pela Liberdade - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Marcha_da_Fam%C3%ADlia_com_Deus_pela_Liberdade); [IBAD - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Instituto_Brasileiro_de_A%C3%A7%C3%A3o_Democr%C3%A1tica); [Eleições gerais de 1962 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_gerais_no_Brasil_em_1962); [Eleição presidencial de 1964 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1964); [Ato Institucional nº 2 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Ato_Institucional_N%C3%BAmero_Dois); [Rosários contra o comunismo: Patrick Peyton e a Family Rosary Crusade no golpe de 1964, Estudos Históricos 37(82), 2024, doi:10.1590/S2178-149420240212 (lido)](https://www.scielo.br/j/eh/a/PfgjvLy6S6L87bKbc4fBYYf/?lang=pt); [Nóbrega, C. H. S. 'As eleições de 1962' (monografia UFRJ, 2019; cita relatório da CPI do IBAD, Veja 09/03/1977 e entrevista de 2002; lida)](https://pantheon.ufrj.br/bitstream/11422/16980/1/CHSNobrega.pdf)

### Oposição consentida (MDB) e as eleições de 1974, 1978 e 1982 (1965-1985; transversal)

**Origem.** Criado após o AI-2 como único partido de oposição legal; primeira reunião em 04/12/1965, registro em 24/03/1966 (mdb).

**Pautas.** Eleições diretas; Anistia; Contra o custo de vida e o arrocho

**Base social.** Frente de ex-PTB, ex-PSD e correntes de oposição; 'autênticos' e moderados (mdb).

**Organização.** Líder: Ulysses Guimarães (anticandidato 1974); Transformou-se em PMDB em 20/12/1979

**Mídia e tecnologia.** Horário gratuito de rádio e TV usado em 1974; limitado depois pela Lei Falcão (1976), que só permitia nome, número, currículo e retrato (falcao)

**Financiamento e regras.** Regras que o barraram: AI-2 (bipartidarismo), Lei Falcão (1976), Pacote de Abril (1977, senadores biônicos), voto vinculado (1982) (ai2, falcao, pacote, e1982).

**Alianças e rupturas.** Boicote às indiretas de 1966; Anticandidatura de Ulysses em 1974; Pluripartidarismo em 1979 dividiu a oposição em PMDB, PDT, PTB e PT (e1982)

**Como se construiu.**
1. 1965-10-27: AI-2 cria o bipartidarismo.
2. 1966-03-24: Registro do MDB; 132 deputados em 1966.
3. 1970-11-15: 87 deputados; cerca de 30% de votos brancos e nulos.
4. 1974-01-15: Anticandidatura: Ulysses 76 votos contra 400.
5. 1974-11-15: Vitória no Senado.
6. 1976-07-01: Lei Falcão.
7. 1977-04-14: Pacote de Abril (EC 8 e DL 1.538; recesso desde 01/04).
8. 1978-11-15: Cerca de 5 milhões de votos a mais, mas minoria em cadeiras.
9. 1982-11-15: PMDB elege 9 governadores.

**Resultado eleitoral.**
- geral-1974: MDB 10.954.440 votos na Câmara (ARENA 11.866.482); Senado 16 de 22.
- geral-1978: MDB 189 de 420 na Câmara (231 ARENA), segundo Kinzo (1988); a leitura 196 não fecha com o total de cadeiras.
- geral-1982: PMDB 200 deputados e 9 governadores.

**Declínio ou transformação.** Em 1979 virou PMDB; a abertura levou a Diretas Já e ao Colégio de 1985.

**O que se sabe e o que é disputado.** Disputado: se a 'oposição consentida' legitimou ou desgastou o regime; o peso do voto de protesto (cerca de 30% de nulos e brancos na Câmara em 1970, confirmado em tabela do TSE via Pecoraro). Divergência numérica: 1974 tem três leituras (160, 161 ou 165 cadeiras do MDB; Kinzo 160, TSE v. 11 161, página do MDB 165, esta sem fonte aberta); 1978 foi resolvida a favor de 189 (231 + 189 = 420; 196 não fecha).

**Fontes.** [Movimento Democrático Brasileiro (1966) - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Movimento_Democr%C3%A1tico_Brasileiro_(1966)); [Eleições gerais de 1974 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_gerais_no_Brasil_em_1974); [Eleições gerais de 1978 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_gerais_no_Brasil_em_1978); [Eleições gerais de 1982 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_gerais_no_Brasil_em_1982); [Lei nº 6.339/1976 (Lei Falcão) - Câmara dos Deputados, texto original](https://www2.camara.leg.br/legin/fed/lei/1970-1979/lei-6339-1-julho-1976-357658-publicacaooriginal-1-pl.html); [Pacote de Abril - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Pacote_de_Abril); [Ato Institucional nº 2 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Ato_Institucional_N%C3%BAmero_Dois); [1974 Brazilian presidential election - Wikipedia (secundária)](https://en.wikipedia.org/wiki/1974_Brazilian_presidential_election); [Fundação Ulysses Guimarães, 'Número de cadeiras ARENA/MDB 1966 a 1978' (tabela adaptada de Kinzo, 1988; lida)](https://acervo.fundacaoulysses.org.br/wp-content/uploads/2022/10/Numero-cadeiras-ARENA-MDB-1966-a-1978.pdf); [Pecoraro, T. M. 'O MDB durante o governo Geisel' (dissertação UFRRJ, 2019; tabelas do TSE, Dados Estatísticos 1966, 1970 e 1974; lida)](https://rima.ufrrj.br/jspui/bitstream/20.500.14407/13851/3/2019%20-%20Tamires%20Mascarenhas%20Pecoraro.pdf); [Emenda Constitucional nº 8, de 14/04/1977 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc_anterior1988/emc08-77.htm)

### Novo sindicalismo (ABC) e fundação do PT (1978-1989; esquerda)

**Origem.** Greves de 1978-1980 no ABC, lideradas por Lula e pelos metalúrgicos; fundação do PT em 10/02/1980 no Colégio Sion, SP; registro em 11/02/1982 (pt).

**Pautas.** Autonomia sindical; Direitos sociais; Democracia

**Base social.** Sindicalistas independentes, católicos ligados à Teologia da Libertação, intelectuais e artistas (pt).

**Organização.** Núcleos temáticos (não células comunistas); Filiados: 1.647.431 em 2024 (pt)

**Mídia e tecnologia.** Assembleias de fábrica, boletins e rádio (não lidos); TV e horário eleitoral: 3min45s em 1994 (p1994)

**Financiamento e regras.** Regras: registro só em 1982 (pt); voto vinculado de 1982 (e1982). Financiamento: Não verificado nesta rodada.

**Alianças e rupturas.** Expulsão de deputados do PT que votaram em Tancredo em 1985 (p1985); Frente Brasil Popular em 1989 (p1989)

**Como se construiu.**
1. 1978-1980: Greves do ABC.
2. 1980-02-10: Fundação.
3. 1982-02-11: Registro.
4. 1982-11-15: 8 deputados.
5. 1985-01-15: Cinco abstenções e três votos em Tancredo levam a expulsões.
6. 1986-11-15: 16 deputados.
7. 1989-11-15: Lula 2º turno.
8. 1994-10-03: 27,04%.
9. 1998-10-04: 31,71%; 58 deputados.
10. 2002-10-27: Lula 61,27% no 2º turno.

**Resultado eleitoral.**
- geral-1982: PT 8 deputados (1,67%).
- const-1986: PT 16 deputados (3,28%).
- pres-1989: Lula 11.622.321 (17,19%) e 31.075.803 (46,97%).
- pres-1994: Lula 17.112.255 (27,04%), segundo o arquivo atual do TSE.
- pres-1998: Lula 21.475.211 (31,71%).
- pres-2002: Lula 39.455.233 (46,44%) e 52.793.364 (61,27%).

**Declínio ou transformação.** Passou a partido de governo (2003-2016, 2023-); ver lulismo.

**O que se sabe e o que é disputado.** Disputado: peso relativo de sindicatos, CEBs e intelectuais na fundação; fonte lida só traz a composição. Sabe-se: datas, votos e bancadas.

**Fontes.** [Partido dos Trabalhadores - Wikipédia (secundária; lida só a 1ª parte)](https://pt.wikipedia.org/wiki/Partido_dos_Trabalhadores); [Eleições gerais de 1982 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_gerais_no_Brasil_em_1982); [Eleições gerais de 1986 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_gerais_no_Brasil_em_1986); [Eleição presidencial de 1989 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1989); [Eleição presidencial de 1994 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1994); [Eleição presidencial de 1998 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1998); [Eleição presidencial de 2002 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2002); [Eleição presidencial de 1985 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1985); [TSE, Dados abertos: votacao_candidato_munzona_1994 (arquivo BR) e detalhe_votacao_munzona_1994 - leitura em 07/10/2026](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1994.zip)

### CEBs e a Igreja católica (1960-presente; esquerda)

**Origem.** Nasceram no início dos anos 1960 em experiências de catequese (Barra do Piraí, 1956; Natal) diante da falta de padres; Medellín (1968) trouxe temas de libertação; Puebla (1979) a 'opção preferencial pelos pobres' (cebs).

**Pautas.** Opção preferencial pelos pobres; Método ver-julgar-agir; Pedagogia de Paulo Freire

**Base social.** Camadas populares urbanas e rurais organizadas em paróquias.

**Organização.** CNBB e planejamento pastoral; 15 encontros intereclesiais desde 1975; o 15º em Rondonópolis (07/2023); Cerca de 70 mil núcleos em 2000 (estimativa)

**Mídia e tecnologia.** Rede de comunidades, boletins e rádios católicas (não lidos)

**Financiamento e regras.** Financiamento: Não verificado nesta rodada. Regra: a Igreja não é partido; conexão eleitoral via militância (PT, MST).

**Alianças e rupturas.** Conexão com PT, MST e Comissão Pastoral da Terra (pt, mst); Setores conservadores da Igreja e do governo dos EUA criticaram a corrente (documentos de Santa Fé)

**Como se construiu.**
1. 1956-1960: Experiências de catequese.
2. 1968: Medellín.
3. 1975: 1º encontro intereclesial.
4. 1979: Puebla.
5. 1980: Católicos da Teologia da Libertação entre fundadores do PT.
6. 1984: CPT apoia a criação do MST.

**Resultado eleitoral.**
- geral-1982: Sem desempenho eleitoral próprio medido; base de militância do PT.

**Declínio ou transformação.** Trajetória posterior não medida nas fontes lidas; números: 70 mil núcleos em 2000 e 1,8 milhão de adultos atuantes, segundo pesquisa citada na página lida.

**O que se sabe e o que é disputado.** Disputado: acusações de infiltração marxista (conservadores) versus leitura religiosa e pedagógica; alcance real (a página cita 14 milhões de católicos organizados e 1,8 milhão de adultos atuantes; os números divergem por critério).

**Fontes.** [Comunidade eclesial de base - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Comunidade_eclesial_de_base); [Partido dos Trabalhadores - Wikipédia (secundária; lida só a 1ª parte)](https://pt.wikipedia.org/wiki/Partido_dos_Trabalhadores); [Movimento dos Trabalhadores Rurais Sem Terra - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Movimento_dos_Trabalhadores_Rurais_Sem_Terra)

### MST e a luta pela terra (1979-presente; esquerda)

**Origem.** Fundado em 24/01/1984 no 1º Encontro Nacional em Cascavel (PR), com apoio da Comissão Pastoral da Terra; antecedente: acampamento Encruzilhada Natalino (RS, fim dos anos 1970) (mst).

**Pautas.** Redistribuição de terras improdutivas; Reforma agrária

**Base social.** Trabalhadores rurais sem terra e agricultores; o êxodo do 'milagre brasileiro' é citado como pano de fundo.

**Organização.** Organizado em 24 estados; 450 mil famílias assentadas e 90 mil acampadas (números da página lida, de data não informada); 160 cooperativas (2022)

**Mídia e tecnologia.** Marchas, ocupações, rede de Armazém do Campo; Mídia própria (não lida)

**Financiamento e regras.** Recursos públicos: o TCU apontou mais de R$ 3 milhões do Brasil Alfabetizado a setores do MST; CPMI concluiu que não houve desvio comprovado (mst).

**Alianças e rupturas.** Crítica de Lula em 2003 à 'radicalização desnecessária'; Vigília Lula Livre (2018-2019)

**Como se construiu.**
1. fim anos 1970: Encruzilhada Natalino.
2. 1984-01-24: Fundação.
3. 1987: Perde a batalha da reforma agrária na Constituinte (UDR e TFP, resumo de busca). (não verificado)
4. 1996-04-17: Eldorado dos Carajás.
5. 2022-10: 3 deputados federais.
6. 2024-10: 43 vereadores.

**Resultado eleitoral.**
- municipal-2024: 43 vereadores e 2 vice-prefeitos eleitos.

**Declínio ou transformação.** Passou a atuar em cooperativas e na política partidária (PT).

**O que se sabe e o que é disputado.** Disputado: legitimidade das ocupações; financiamento público; contagem de assassinados (a página cita 1.722 militantes mortos desde 1985, segundo a CPT). Sabe-se: datas e eleitos em 2022 e 2024 segundo a página.

**Fontes.** [Movimento dos Trabalhadores Rurais Sem Terra - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Movimento_dos_Trabalhadores_Rurais_Sem_Terra); [Resumo de busca: 122 emendas populares na ANC; UDR e TFP (UFSC/Em Debate; não lido na íntegra)](https://periodicos.ufsc.br/index.php/emdebate/article/view/1980-3532.2011n5p1); [Amnesty International, 'The Eldorado dos Carajás massacre: 20 years of impunity' (2016, lida)](https://www.amnesty.org/en/latest/press-release/2016/04/the-eldorado-dos-carajas-massacre-20-years-of-impunity-and-violence-in-brazil/)

### Diretas Já (1983-1984; transversal)

**Origem.** Teotônio Vilela lançou a ideia no programa Canal Livre em 1983; primeiro ato em 31/03/1983 em Abreu e Lima (PE), com cerca de 100 pessoas (diretas).

**Pautas.** Eleição direta para presidente; Emenda Dante de Oliveira

**Base social.** Multiclassista: partidos de oposição, artistas, intelectuais, sindicalistas.

**Organização.** PMDB, PT, PDT; Líderes: Ulysses Guimarães, Tancredo Neves, Leonel Brizola, Lula (diretas)

**Mídia e tecnologia.** Comícios: Praça da Sé 25/01/1984 (300 mil), Candelária 10/04/1984 (cerca de 1 milhão), Anhangabaú 16/04/1984 (1,5 milhão), números da página lida sem indicar quem contou; Música e artistas; cobertura da TV (papel da Globo discutido, não lido)

**Financiamento e regras.** Regra: a emenda precisava de 2/3 (320 votos); Lei Falcão ainda limitava a propaganda eleitoral até 1984 (falcao).

**Alianças e rupturas.** PT expulsou deputados que votaram em Tancredo no Colégio (p1985); a divisão interna do PMDB sobre o Colégio não foi lida

**Como se construiu.**
1. 1983: Teotônio Vilela e o 1º ato.
2. 1984-01-25: Sé.
3. 1984-04-10: Candelária.
4. 1984-04-16: Anhangabaú.
5. 1984-04-25: Votação da emenda.
6. 1985-01-15: Colégio elege Tancredo.

**Resultado eleitoral.**
- diretas-1984: 298 sim, 65 não, 3 abstenções; rejeitada por falta de quórum.
- colegio-1985: Tancredo 480 (72,73%), Maluf 180.

**Declínio ou transformação.** Derrota formal, vitória política: o Colégio de 1985 elegeu a oposição; eleição direta em 1989.

**O que se sabe e o que é disputado.** Disputado: público (números dependem de quem contou); o papel da imprensa e da TV Globo; se a emenda fracassou por manobra do governo ou pela divisão da oposição. Sabe-se: contagem de votos da emenda (a página diz 112 ausentes).

**Fontes.** [Diretas Já - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Diretas_J%C3%A1); [Eleição presidencial de 1985 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1985)

### Constituinte (1987-88) e emendas populares (1985-1988; transversal)

**Origem.** Convocada pela EC 26/1985; instalada em 01/02/1987 com 559 membros (487 deputados e 72 senadores), 26 mulheres; presidente Ulysses Guimarães; relator Bernardo Cabral (constituinte).

**Pautas.** Direitos sociais; Reforma agrária; Direitos indígenas; Sistema de governo

**Base social.** Congresso eleito em 1986 com poderes constituintes; sociedade civil via emendas populares (122, resumo de busca).

**Organização.** PMDB 303 e PFL 135 entre os constituintes (valores lidos, mas a página mistura contagens); UDR e TFP contra a reforma agrária (resumo de busca)

**Mídia e tecnologia.** Lobby, caravanas a Brasília e emendas populares

**Financiamento e regras.** Regra: Congresso constituinte, sem Assembleia exclusiva; as emendas populares exigiam assinaturas (número não conferido).

**Alianças e rupturas.** Blocos do Centrão (não verificado em fonte); Bancada evangélica de 32 constituintes (evang_busca); Bancada ruralista e UDR

**Como se construiu.**
1. 1985-11-27: EC 26 convoca a Constituinte. (não verificado)
2. 1986-11-15: PMDB elege 260 deputados.
3. 1987-02-01: Instalação.
4. 1987-1988: 122 emendas populares processadas; embate sobre reforma agrária. (não verificado)
5. 1988-10-05: Promulgação. (não verificado)

**Resultado eleitoral.**
- const-1986: PMDB 260 deputados (53,39%), PFL 118.

**Declínio ou transformação.** Resultado: Constituição de 1988, com 250 artigos e, até 2023, 129 emendas (constituinte).

**O que se sabe e o que é disputado.** Disputado: representatividade de um Congresso que acumulava mandato ordinário; peso dos lobbies; número exato de assinaturas das emendas populares (não verificado).

**Fontes.** [Assembleia Nacional Constituinte de 1987 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Assembleia_Nacional_Constituinte_de_1987); [Eleições gerais de 1986 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_gerais_no_Brasil_em_1986); [Resumo de busca: 122 emendas populares na ANC; UDR e TFP (UFSC/Em Debate; não lido na íntegra)](https://periodicos.ufsc.br/index.php/emdebate/article/view/1980-3532.2011n5p1); [Resumos de busca sobre bancada evangélica (ISER; UFPEL; Poder360; O Povo)](https://www.opovo.com.br/eleicoes-2022/2022/10/08/campeoes-de-voto-reforcam-bancada-evangelica-no-congresso.html)

### Collor: outsider, mídia e 'caçador de marajás' (1987-1992; n/a)

**Origem.** Governador de Alagoas (1987-1989) saiu do PMDB para o PRN, partido pequeno; construiu imagem nacional como 'caçador de marajás' (collor).

**Pautas.** Combate a funcionários de altos salários; Choque contra a hiperinflação

**Base social.** Eleitorado de baixa renda e sem filiação partidária; 22 candidatos no 1º turno (p1989).

**Organização.** Movimento Brasil Novo; Tesoureiro Paulo César Farias (collor)

**Mídia e tecnologia.** TV: o debate final de 14/12/1989 na Globo teria sido editado em favor de Collor (documentário 'Beyond Citizen Kane', 1993; ambos negam) (collor, p1989)

**Financiamento e regras.** Sem teto de gastos; financiamento: PC Farias mais tarde implicado (collor). Plano Collor (16/03/1990) congelou depósitos acima de NCz$ 50 mil por 18 meses.

**Alianças e rupturas.** Partido de aluguel e coligação pequena; Pedro Collor expôs o esquema em maio de 1992

**Como se construiu.**
1. 1987-1989: Governo de Alagoas e imagem de 'caçador de marajás'.
2. 1989-11-15: 1º turno.
3. 1989-12-14: Debate final.
4. 1989-12-17: 2º turno.
5. 1990-03-16: Plano Collor.
6. 1992-05: Denúncias de Pedro Collor.
7. 1992-09-29: Impeachment.

**Resultado eleitoral.**
- pres-1989: 30,48% (20.611.030) e 53,03% (35.090.206).

**Declínio ou transformação.** Impeachment em 29/09/1992 e renúncia em 29/12/1992, com perda de direitos políticos por oito anos.

**O que se sabe e o que é disputado.** Disputado: peso da TV Globo na vitória (a página lida chega a afirmar que a vitória não seria possível sem a emissora, tese contestada pela emissora e por Collor); o efeito do debate editado sobre o voto não foi medido nas fontes lidas.

**Fontes.** [Fernando Collor de Mello - Wikipédia (secundária; lida só a 1ª parte)](https://pt.wikipedia.org/wiki/Fernando_Collor_de_Mello); [Eleição presidencial de 1989 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1989)

### Plano Real e a coalizão PSDB-PFL (1993-2002; centro)

**Origem.** FHC virou ministro da Fazenda em 19/05/1993; equipe: Edmar Bacha, Winston Fritsch, Gustavo Franco, Pedro Malan; saiu em 30/03/1994 para a campanha; URV em 01/03/1994 e real em 01/07/1994 (real).

**Pautas.** Estabilização monetária; Reformas; Reeleição (EC 16/1997)

**Base social.** Eleitorado urbano e de renda média/baixa beneficiado pela queda da inflação (real).

**Organização.** Coligação 'União, Trabalho e Progresso': PSDB, PFL e PTB; vice Marco Maciel (PFL) (p1994)

**Mídia e tecnologia.** TV: 8min10s de FHC contra 3min45s de Lula (p1994)

**Financiamento e regras.** Regras: reeleição aprovada em 1997 (p1998); empresas podiam doar. Financiamento: Não verificado nesta rodada.

**Alianças e rupturas.** PT votou contra o Plano Real (real); Substituição do vice Guilherme Palmeira por Marco Maciel após denúncia em agosto de 1994 (p1994)

**Como se construiu.**
1. 1993-05-19: FHC na Fazenda.
2. 1994-03-01: URV.
3. 1994-06: Pesquisas: empate técnico de cerca de 30%.
4. 1994-07-01: Lançamento do real.
5. 1994-08: FHC 40%, Lula 22% nas pesquisas.
6. 1994-10-03: Vitória no 1º turno.
7. 1997-06-04: EC 16 (reeleição). (não verificado)
8. 1998-10-04: Reeleição.

**Resultado eleitoral.**
- pres-1994: FHC 34.350.217 (54,28%), segundo o arquivo atual do TSE.
- pres-1998: FHC 35.936.382 (53,06%); PFL 105 e PSDB 99 deputados.

**Declínio ou transformação.** Em 2002 o candidato do PSDB (Serra) perdeu para Lula: 38,73% no 2º turno (p2002).

**O que se sabe e o que é disputado.** Disputado: o uso eleitoral do plano e a âncora cambial (a página registra a crítica); o peso da inflação baixa versus a coalizão. Sabe-se: datas e votos.

**Fontes.** [Plano Real - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Plano_Real); [Eleição presidencial de 1994 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1994); [Eleição presidencial de 1998 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_1998); [1998 Brazilian general election - Wikipedia (secundária)](https://en.wikipedia.org/wiki/1998_Brazilian_general_election); [TSE, Dados abertos: votacao_candidato_munzona_1994 (arquivo BR) e detalhe_votacao_munzona_1994 - leitura em 07/10/2026](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1994.zip)

### Lulismo e o PT no governo (alianças, Bolsa Família, Nordeste) (2002-presente; esquerda)

**Origem.** Em 2002, Lula formou coligação PT, PL, PCdoB, PMN e PCB com José Alencar (PL) de vice e a 'Carta ao Povo Brasileiro' (p2002).

**Pautas.** Transferência de renda; Estabilidade e inclusão

**Base social.** Nordeste e baixa renda (resultados por região abaixo); Bolsa Família atendia 11,1 milhões de famílias em 2006 e 12,7 milhões em 2010 (bolsafam).

**Organização.** PT e aliados (PMDB, PL, PCdoB); Programa Bolsa Família (MP 132 de 20/10/2003; Lei 10.836 de 09/01/2004)

**Mídia e tecnologia.** Horário eleitoral (Lula 5min19s em 2002 contra 10min24s de Serra); Comícios; WhatsApp e redes em 2022 (p2022)

**Financiamento e regras.** Doações de empresas até 2015; FEFC desde 2018. Bolsa Família em 2006: R$ 8,2 bi (0,4% do PIB) (bolsafam).

**Alianças e rupturas.** Aliança com o PL de Alencar em 2002; Substituição do Bolsa Família pelo Auxílio Brasil (29/12/2021) e restauração do Bolsa Família pela MP 1.164, de 02/03/2023 (Lei 14.601, de 19/06/2023); a MP 1.155, de 01/01/2023, só criou um adicional complementar ao Auxílio Brasil; 2026: Federação Brasil da Esperança + PSB + PSOL-REDE + PDT (p2026)

**Como se construiu.**
1. 2002-10: Coligação e Carta ao Povo Brasileiro.
2. 2003-10-20: Bolsa Família.
3. 2006-10: Reeleição.
4. 2010-10: Dilma 56,05%.
5. 2014-10: Dilma 51,64%.
6. 2016-08-31: Impeachment de Dilma.
7. 2022-10: Retorno.
8. 2026-10-04: 1º turno de 2026 (preliminar).

**Resultado eleitoral.**
- pres-2002: Lula 46,44% e 61,27%.
- pres-2006: Lula 48,61% e 60,83%.
- pres-2010: Dilma 46,91% e 56,05%.
- pres-2014: Dilma 41,59% e 51,64%.
- pres-2022-t2: Lula por região (válidos municipais, sem exterior, repositório): NE 69,34%, SE 45,74%, N 48,97%, CO 39,79%, S 38,16%.
- pres-2026-t1: Lula por região (válidos municipais, preliminar): NE 63,77%, SE 39,68%, N 44,65%, CO 32,62%, S 31,28%.

**Declínio ou transformação.** Sem declínio medido nas fontes; a base nordestina permaneceu (69,34% em 2022 2º turno; 63,77% no 1º turno de 2026).

**O que se sabe e o que é disputado.** Disputado: peso do Bolsa Família no voto (Zucco 2008 e Pereira e Mueller 2010 associam expansão do programa a ganhos do governo nas regiões pobres, segundo a página lida); controvérsia sobre a auditoria do TCU de 2009 (pagamentos a falecidos, 3.791, a políticos, 577) e sobre o efeito educacional (frequência sim, notas não). Percentuais regionais: cálculo nosso sobre dados do TSE, municipal, sem exterior.

**Fontes.** [Eleição presidencial de 2002 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2002); [Eleição presidencial de 2006 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2006); [Eleição presidencial de 2010 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2010); [Eleição presidencial de 2014 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2014); [2014 Brazilian general election - Wikipedia (secundária)](https://en.wikipedia.org/wiki/2014_Brazilian_general_election); [Programa Bolsa Família - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Programa_Bolsa_Fam%C3%ADlia); [Repositório sociolibero: web/public/data/elections/pres_2022_t1.json e pres_2022_t2.json (TSE, totais conferidos, dif 0)](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/votacao_secao_2022_BR.zip); [Repositório sociolibero: web/public/data/elections/pres_2026_t1.json (TSE, snapshot 05/10/2026 14:03, preliminar)](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/votacao_secao_2026_BR.zip); [Eleição presidencial de 2026 - Wikipédia (secundária; página atualizada em 07/10/2026)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2026); [Processo de impeachment de Dilma Rousseff - Wikipédia (secundária; lida só a 1ª parte)](https://pt.wikipedia.org/wiki/Processo_de_impeachment_de_Dilma_Rousseff); [Medida Provisória nº 1.164, de 02/03/2023 (Bolsa Família) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/mpv/mpv1164.htm); [Lei nº 14.601, de 19/06/2023 (Bolsa Família) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/L14601.htm)

### Movimento evangélico na política (Frente Parlamentar Evangélica) (1986-presente; transversal)

**Origem.** Em 1986 foram eleitos 32 constituintes evangélicos, 18 de origem pentecostal e 14 ligados à Assembleia de Deus (resumo de busca); a FPE foi fundada em 18/09/2003 e registrada formalmente na Câmara em 09/09/2015 (REVES, 2024) (fpe).

**Pautas.** Valores familiares e crenças cristãs; oposição a casamento entre pessoas do mesmo sexo e a aborto (fpe)

**Base social.** Fiéis de Assembleia de Deus, Universal e Batista; evangélicos 21,6% da população em 2010 (35 milhões) e 26,9% em 2022 (47,4 milhões), população de 10 anos ou mais, IBGE (censo_relig; reportagem lida que cita o IBGE: 26,9% em 2022 e 21,6% em 2010; o IBGE não foi aberto).

**Organização.** Frente Parlamentar Evangélica; Igrejas e partidos ligados a elas (Republicanos/PRB; não lido)

**Mídia e tecnologia.** Rádio e TV de redes religiosas (não lido); Marcha para Jesus (estudo de 2017: 76,9% dos participantes não se identificam com partido ou liderança evangélica) (fpe)

**Financiamento e regras.** Financiamento: Não verificado nesta rodada.

**Alianças e rupturas.** Bancada plural: ligados a diferentes partidos; em 2006 25 dos 72 parlamentares recomendados para punição no caso Sanguessugas eram evangélicos (fpe); Apoio majoritário a Bolsonaro em 2018 e 2022 (bolsonarismo, página lida)

**Como se construiu.**
1. 1986: 32 constituintes. (não verificado)
2. 2002: Cerca de 60 deputados autoidentificados.
3. 2003-09-18: FPE.
4. 2015: 87 deputados e 3 senadores.
5. 2019: 195 deputados e 8 senadores (membros da frente).
6. 2023: 209 + 26 (frente) ou 102 + 13 (ISER).

**Resultado eleitoral.**
- const-1986: 32 constituintes evangélicos. (não verificado)
- pres-2022-t1: Sem votação própria medida; deputados: 75 (DIAP, lido), 96 (ISER) ou 102 (bancada), mais 13 senadores na contagem da bancada; ver controvérsias. (não verificado)

**Declínio ou transformação.** Crescimento da bancada e da população evangélica; bancada ficou abaixo da meta de 30% das cadeiras em 2022 (102 deputados, 20%).

**O que se sabe e o que é disputado.** Disputado: o que é 'bancada evangélica' (filiação à frente, identidade religiosa ou ligação com igreja), por isso há várias contagens: DIAP, 75 deputados eleitos em 2022 (inclui quem ocupa cargos em igrejas, cantores gospel e quem professa a fé ou vota com o grupo, segundo o artigo da UFV); ISER, 96 parlamentares; bancada, 102 deputados e 13 senadores; Frente Parlamentar Evangélica, 209 deputados e 26 senadores (Wikipédia), 238 membros na lista do Congresso em maio de 2023 (reportagem), com assinantes que nem sempre são evangélicos; o 'voto evangélico' como bloco (o estudo citado sugere distância dos partidos).

**Fontes.** [Frente Parlamentar Evangélica - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Frente_Parlamentar_Evang%C3%A9lica); [Resumos de busca sobre bancada evangélica (ISER; UFPEL; Poder360; O Povo)](https://www.opovo.com.br/eleicoes-2022/2022/10/08/campeoes-de-voto-reforcam-bancada-evangelica-no-congresso.html); [IBGE, Censo 2022: religiões (lido em resumo de busca; Agência Gov)](https://agenciagov.ebc.com.br/noticias/202506/censo-2022-catolicos-seguem-em-queda-evangelicos-e-sem-religiao-crescem-no-pais); [Engler, Portugal e Araújo. 'A Bancada Evangélica eleita em 2022', REVES 7(1), 2024, doi:10.18540/revesvl7iss1pp19054 (lido)](https://periodicos.ufv.br/reves/article/download/19054/9811/85188); [Congresso em Foco, 'Censo 2022: 1 em 4 brasileiros é evangélico' (imprensa; lida)](https://www.congressoemfoco.com.br/noticia/109200/censo-2022-1-em-4-brasileiros-e-evangelico-catolicos-caem-para-56-7)

### Bancada ruralista e do agro (UDR, Frente Parlamentar da Agropecuária) (1985-presente; direita)

**Origem.** Surgiu na Constituinte de 1987, inspirada na UDR, contra o cumprimento de normas da reforma agrária; a FPA foi criada em 2008 (fpa).

**Pautas.** Resistência à reforma agrária; Crédito e dívidas rurais; Flexibilização ambiental; Oposição à demarcação indígena

**Base social.** Proprietários rurais e agroindústria; cerca de 62% dos membros de partidos de direita/centro-direita, 19% de centro-esquerda e 19% do PMDB (fpa).

**Organização.** UDR (fundada em 1985; atuação na Constituinte de 1987-88); FPA (presidente Pedro Lupion, PP-PR)

**Mídia e tecnologia.** Lobby e financiamento de campanha (empresas até 2015)

**Financiamento e regras.** Doações de empresas do agro: dissertação de Sakamoto liga doações de empresas acusadas de trabalho escravo à eleição de dois governadores e cinco deputados (fpa). FPA: 50 senadores confirmados pela Agência FPA em 12/07/2023 (lida); 324 de 513 deputados é número da própria frente (autodeclaração; outras leituras de 2023 variam de 290 a 324 e a posse de Lupion em março citava 300 deputados), sem lista oficial da Câmara lida.

**Alianças e rupturas.** Aliança com a bancada evangélica e outros (não lido); Votos não são em bloco

**Como se construiu.**
1. 1985-1988: UDR e TFP contra a reforma agrária. (não verificado)
2. 1987: Constituinte.
3. 2008: FPA.

**Resultado eleitoral.**
- const-1986: Representação ruralista na Constituinte não quantificada nas fontes lidas. (não verificado)

**Declínio ou transformação.** Cresceu: a FPA reúne parte majoritária do Congresso (estimativa).

**O que se sabe e o que é disputado.** Disputado: a medida da bancada (de 120 a 200 votos conforme o tema, segundo a página lida); doações e trabalho escravo (dissertação citada).

**Fontes.** [Frente Parlamentar da Agropecuária - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Frente_Parlamentar_da_Agropecu%C3%A1ria); [Resumo de busca: 122 emendas populares na ANC; UDR e TFP (UFSC/Em Debate; não lido na íntegra)](https://periodicos.ufsc.br/index.php/emdebate/article/view/1980-3532.2011n5p1); [Agência FPA, 'FPA chega ao número histórico de 50 membros no Senado' (12/07/2023, lida)](https://agencia.fpagropecuaria.org.br/2023/07/12/fpa-chega-ao-numero-historico-de-50-membros-no-senado)

### Jornadas de junho de 2013 (2013; transversal)

**Origem.** Campanha do Movimento Passe Livre contra o aumento de R$ 0,20 na tarifa em São Paulo (R$ 3,00); atos de 06 a 13/06/2013 e repressão policial em 13/06 (j2013).

**Pautas.** Tarifa zero ou menor; Saúde e educação; Contra a violência policial e os gastos dos megaeventos; Corrupção (Datafolha)

**Base social.** Jovens escolarizados: 77% com ensino superior em São Paulo e 87% acima do médio completo no Rio (Datafolha e Clave de Fá; resumo de busca).

**Organização.** Movimento Passe Livre; Convocação difusa por redes

**Mídia e tecnologia.** Facebook, Twitter, Instagram, WhatsApp; Vídeo do Anonymous de 19/06 com mais de 1 milhão de visualizações em 24 h (j2013)

**Financiamento e regras.** Sem financiamento medido. Regra: sem partido condutor.

**Alianças e rupturas.** Resposta do governo: 5 pactos nacionais em 24/06/2013 (j2013)

**Como se construiu.**
1. 2013-06-06: Primeiros atos do MPL.
2. 2013-06-13: Repressão.
3. 2013-06-17: Pico a partir de 17/06.
4. 2013-06-19: Vídeo do Anonymous; ato de 80 mil em Fortaleza.
5. 2013-06-24: Cinco pactos.

**Resultado eleitoral.**
- pres-2014: Sem desempenho eleitoral direto; a eleição de 2014 foi decidida por 3,46 milhões de votos.

**Declínio ou transformação.** Dispersão em movimentos distintos (MBL, Vem pra Rua) e queda de aprovação de governos (não lido).

**O que se sabe e o que é disputado.** Disputado: natureza política dos protestos (esquerda, direita, difusa); papel da imprensa (a página lida diz que os veículos inicialmente minimizaram os protestos; mudança de tom após jornalistas serem feridos); estimativas de público variam por fonte. Sabe-se: datas e perfil da amostra.

**Fontes.** [Protestos no Brasil em 2013 - Wikipédia (secundária; lida só a 1ª parte)](https://pt.wikipedia.org/wiki/Protestos_no_Brasil_em_2013); [Resumo de busca sobre perfil dos manifestantes e estimativa de 20/06/2013 (Ibope, Datafolha, Clave de Fá; A Pública, Ridenti/Unicamp)](https://apublica.org/2023/06/dez-anos-de-protestos-qual-o-perfil-dos-manifestantes-que-vao-as-ruas-no-brasil/)

### MBL, Vem pra Rua e o impeachment de 2015-16 (2014-2016; direita)

**Origem.** MBL fundado em 01/11/2014 por Kim Kataguiri, Renan Santos e outros, como movimento 'liberal-conservador' (mbl).

**Pautas.** Impeachment de Dilma; Redução do Estado

**Base social.** Jovens urbanos; atos de 15/03/2015 em mais de 160 cidades; estimativas de 1,4 a 3,6 milhões em vários atos (mbl).

**Organização.** MBL; Vem pra Rua (mapeava votos de parlamentares; a página específica consultada era do jingle de 2013 e não do movimento)

**Mídia e tecnologia.** YouTube e Facebook; Facebook removeu páginas ligadas ao MBL em julho de 2018 por 'rede de desinformação' (mbl)

**Financiamento e regras.** Financiamento contestado: o MBL cita contribuições de seguidores e empresários; críticos alegam financiamento internacional; treinamento da Students for Liberty (rede financiada pelos Koch); MP alegou ocultação de bens em 2020, rejeitada pela Justiça (mbl).

**Alianças e rupturas.** Impeachment aceito por Eduardo Cunha em 02/12/2015 (pedido de Bicudo, Reale Júnior e Janaína Paschoal) (impeach)

**Como se construiu.**
1. 2014-11-01: Fundação do MBL.
2. 2015-03-15: Atos nacionais.
3. 2015-12-02: Cunha aceita.
4. 2016-04-17: Câmara.
5. 2016-08-31: Senado.
6. 2016-10-02: MBL elege 8 vereadores e 1 prefeito (Monte Sião).

**Resultado eleitoral.**
- municipal-2016: 8 vereadores, incluindo Fernando Holiday (SP), e o prefeito de Monte Sião.

**Declínio ou transformação.** Eleição de 8 vereadores em 2016; trajetória posterior não lida nesta rodada.

**O que se sabe e o que é disputado.** Disputado: 'golpe' versus 'impeachment legal' (defesa: processo político sem crime de responsabilidade; acusação: pedaladas e decretos sem autorização, 'atentados à Constituição'); financiamento do MBL. Sabe-se: datas e placares.

**Fontes.** [Movimento Brasil Livre - Wikipédia (secundária; lida só a 1ª parte)](https://pt.wikipedia.org/wiki/Movimento_Brasil_Livre); [Processo de impeachment de Dilma Rousseff - Wikipédia (secundária; lida só a 1ª parte)](https://pt.wikipedia.org/wiki/Processo_de_impeachment_de_Dilma_Rousseff)

### Lava Jato e antipetismo (2014-2021; n/a)

**Origem.** Operação iniciada em 17/03/2014 sobre corrupção na Petrobras e empreiteiras (lavajato).

**Pautas.** Combate à corrupção

**Base social.** Opinião pública e partidos de oposição; antipetismo como identidade eleitoral: não medido nas fontes lidas.

**Organização.** MPF e Justiça Federal em Curitiba; Balanço do MPF (Curitiba): 113 denúncias, 159 condenados, R$ 4 bi devolvidos, 80 fases; Odebrecht: leniência em dez/2016 e 78 delações

**Mídia e tecnologia.** Divulgação de depoimentos e vazamentos; 'Vaza Jato' (The Intercept, 2019)

**Financiamento e regras.** Regras: delação premiada; STF proibiu doações de empresas em 17/09/2015 (adi4650).

**Alianças e rupturas.** TRF4 condenou Lula em janeiro de 2018; prisão em abril de 2018; STF anulou condenações em março de 2021 e reconheceu suspeição de Moro em junho de 2021 (lavajato)

**Como se construiu.**
1. 2014-03-17: Início.
2. 2015-09-17: Fim das doações de empresas.
3. 2016-12: Odebrecht.
4. 2018-01: Condenação TRF4.
5. 2018-10: Eleição: Lula impedido; Haddad 29,28% no 1º turno.
6. 2019: Vaza Jato.
7. 2021-03: Anulações.

**Resultado eleitoral.**
- pres-2018: Efeito sobre 2018 não medido; Bolsonaro 46,03% (1º turno) e Haddad 29,28%. (não verificado)

**Declínio ou transformação.** Encerrada em 01/02/2021; condenações anuladas pelo STF em 2021.

**O que se sabe e o que é disputado.** Disputado: legalidade dos métodos, o papel do juiz Moro, a leitura política das anulações e o peso da operação no resultado de 2018 (não medido). Sabe-se: balanço do MPF e datas.

**Fontes.** [Operação Lava Jato - Wikipédia (secundária; lida só a 1ª parte)](https://pt.wikipedia.org/wiki/Opera%C3%A7%C3%A3o_Lava_Jato); [Migalhas, 'Proibida doação de empresas a campanhas eleitorais' (ADI 4650, 17/09/2015)](https://www.migalhas.com.br/quentes/227067/proibida-doacao-de-empresas-a-campanhas-eleitorais); [2018 Brazilian general election - Wikipedia (secundária)](https://en.wikipedia.org/wiki/2018_Brazilian_general_election)

### Bolsonarismo (campanha digital de 2018, WhatsApp e redes) (2018-presente; direita)

**Origem.** Candidatura de Jair Bolsonaro pelo PSL na eleição de 2018, em coligação com PRTB (p2018).

**Pautas.** Anticorrupção; Costumes; Segurança; Liberalismo econômico (de 2018)

**Base social.** Evangélicos, agronegócio, militares (bolsonarismo).

**Organização.** PSL (2018), PL (2022, 2026); Frente Parlamentar Evangélica e FPA como aliados

**Mídia e tecnologia.** TV: 8 segundos contra 5min32s de Alckmin em 2018 (p2018); Redes sociais e WhatsApp; facada em 06/09/2018 (bolsonarismo); WhatsApp baniu mais de 400 mil contas entre 15/08 e 28/10/2018 por disparos em massa (resumo de busca)

**Financiamento e regras.** FEFC e fim das doações de empresas desde 2018; fundo de R$ 1,716 bi (fefc). Financiamento de disparos: reportagem da Folha sobre pacotes comprados por empresas; TSE decidiu ignorar documentos do WhatsApp sobre autoria (resumo de busca).

**Alianças e rupturas.** Coligação com PRTB em 2018 (federações partidárias só existem desde a Lei 14.208/2021); 2026: Jair Bolsonaro inelegível até 2030; candidatura do filho Flávio (PL) (p2026); STF condenou Bolsonaro e sete réus em 11/09/2025 (historia.json: bolsonaro-2025)

**Como se construiu.**
1. 2014-2016: Crise econômica e queda do governo Dilma.
2. 2018-09-06: Facada.
3. 2018-10-07: 1º turno 46,03%.
4. 2018-10-28: 2º turno 55,13%.
5. 2022-10-02: 1º turno 43,20%.
6. 2022-10-30: 2º turno 49,10%.
7. 2023-01-08: 8 de janeiro.
8. 2026-10-04: Flávio 47,03% (preliminar).

**Resultado eleitoral.**
- pres-2018: 49.277.010 (46,03%) e 57.797.847 (55,13%).
- pres-2022-t1: 51.072.345 (43,20%).
- pres-2022-t2: 58.206.354 (49,10%).
- pres-2026-t1: Flávio Bolsonaro 56.104.503 (47,03%); por região, válidos municipais preliminares: CO 56,50%, S 60,08%, SE 51,36%, N 49,15%, NE 30,85%.

**Declínio ou transformação.** Em 2023 Bolsonaro foi declarado inelegível por 8 anos pelo TSE (historia.json: tse-inelegivel-2023); o movimento prosseguiu com o filho em 2026.

**O que se sabe e o que é disputado.** Disputado: efeito do WhatsApp e dos disparos em massa sobre o resultado de 2018 (especialistas citados defendem anulação; outros dizem que o impacto é indeterminável); papel do Inquérito das Fake News; interpretação dos atos de 8 de janeiro. O efeito não foi medido nas fontes lidas.

**Fontes.** [Bolsonarismo - Wikipédia (secundária; lida só a 1ª parte)](https://pt.wikipedia.org/wiki/Bolsonarismo); [Eleição presidencial de 2018 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2018); [2018 Brazilian general election - Wikipedia (secundária)](https://en.wikipedia.org/wiki/2018_Brazilian_general_election); [Repositório sociolibero: web/public/data/elections/pres_2022_t1.json e pres_2022_t2.json (TSE, totais conferidos, dif 0)](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/votacao_secao_2022_BR.zip); [Repositório sociolibero: web/public/data/elections/pres_2026_t1.json (TSE, snapshot 05/10/2026 14:03, preliminar)](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/votacao_secao_2026_BR.zip); [Resumo de busca: WhatsApp baniu 400 mil contas entre 15/08 e 28/10/2018 (Poder360), reportagem da Folha sobre disparos em massa](https://www.poder360.com.br/eleicoes/whatsapp-diz-que-baniu-400-mil-contas-na-eleicao-de-2018-por-disparos-em-massa/); [Fundo Especial de Financiamento de Campanha - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Fundo_Especial_de_Financiamento_de_Campanha); [Eleição presidencial de 2026 - Wikipédia (secundária; página atualizada em 07/10/2026)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2026); [Lei nº 14.208, de 28/09/2021 (federações) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14208.htm)

### A frente ampla de 2022 (2022; transversal)

**Origem.** Coligação 'Brasil da Esperança': Federação Brasil da Esperança (PT, PCdoB, PV), Federação PSOL-REDE, PSB, Solidariedade, Avante, Agir e PROS; vice Geraldo Alckmin (PSB) (p2022).

**Pautas.** Retomada de programas sociais; Defesa das instituições

**Base social.** Nordeste e baixa renda (resultados por região); aliança com centro e antigos adversários.

**Organização.** Federações (Lei 14.208, 28/09/2021): Brasil da Esperança (registrada em 24/05/2022), PSDB-Cidadania, PSOL-REDE (federacao)

**Mídia e tecnologia.** TV: Lula 3min39s contra 2min38s de Bolsonaro (PL, Republicanos, PP; vice Braga Netto) (p2022); WhatsApp e Telegram: TSE preocupado com desinformação (p2022)

**Financiamento e regras.** FEFC de R$ 4,962 bi (fefc).

**Alianças e rupturas.** Alckmin (PSDB até 2022) como vice de Lula; Tebet (MDB) 4,16% e Ciro (PDT) 3,04% no 1º turno (repo22)

**Como se construiu.**
1. 2021-09-28: Federações partidárias.
2. 2022-05-24: Registro da Federação Brasil da Esperança.
3. 2022-10-02: 1º turno.
4. 2022-10-30: 2º turno.

**Resultado eleitoral.**
- pres-2022-t1: Lula 57.259.504 (48,43%).
- pres-2022-t2: Lula 60.345.999 (50,90%).

**Declínio ou transformação.** Em 2026 a coligação se reduz à Federação Brasil da Esperança, PSB, PSOL-REDE e PDT (p2026).

**O que se sabe e o que é disputado.** Disputado: se foi frente 'ampla' (centro e direita aderentes) ou aliança de esquerda com adesões pontuais; o papel de Tebet e do MDB no 2º turno não foi lido. Sabe-se: composição formal.

**Fontes.** [Eleição presidencial de 2022 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2022); [Federação partidária - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Federa%C3%A7%C3%A3o_partid%C3%A1ria); [Repositório sociolibero: web/public/data/elections/pres_2022_t1.json e pres_2022_t2.json (TSE, totais conferidos, dif 0)](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/votacao_secao_2022_BR.zip); [Fundo Especial de Financiamento de Campanha - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Fundo_Especial_de_Financiamento_de_Campanha); [Eleição presidencial de 2026 - Wikipédia (secundária; página atualizada em 07/10/2026)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2026)

### Eleições municipais de 2024 e gerais de 2026 (2024-2026; n/a)

**Origem.** Em 2024: 5.569 municípios (5.570 com Fernando de Noronha) votaram; PSD elegeu 891 prefeitos, MDB 856, PP 752, UNIÃO 591 e PL 518 (m2024). Em 2026: 1º turno em 04/10/2026, 2º em 25/10/2026 (p2026).

**Pautas.** Eleições municipais; Disputa presidencial 2026 entre Flávio Bolsonaro (PL) e Lula (PT)

**Base social.** Eleitorado em 2026: 158.745.502 aptos (TSE, detalhe_votacao_secao_2026, snapshot 05/10/2026), dos quais 916.534 no exterior; o repositório soma 157.824.642 nos municípios (diferença de 920.860, sendo 4.326 sem explicação). Eleitorado de 2024: 155.912.680 (TSE).

**Organização.** Federações (2022 em diante); Partidos: PSD, MDB, PP, UNIÃO e PL lideram prefeituras em 2024

**Mídia e tecnologia.** TV e rádio gratuitos (30/08 a 03/10 em 2024); Redes sociais; o debate da Globo em 2026 foi cancelado (p2026)

**Financiamento e regras.** FEFC de R$ 4,962 bi em 2024 e 2026; fim das coligações proporcionais desde 2020; cláusula de desempenho de 2,5% em 2026 (fefc, barreira).

**Alianças e rupturas.** 2026: Lula com Alckmin; Flávio Bolsonaro com Alfredo Gaspar (PL); Caiado/Kassab (PSD); Zema/Girão (NOVO); Cury/Delgado (Avante); Flávio Bolsonaro sem coligação (partido isolado)

**Como se construiu.**
1. 2020-11-15: Primeira eleição sem coligações proporcionais.
2. 2024-10-06: Municipais.
3. 2026-10-04: 1º turno geral.
4. 2026-10-25: 2º turno agendado.

**Resultado eleitoral.**
- municipal-2024: PSD 891, MDB 856, PP 752, UNIÃO 591, PL 518 prefeituras.
- pres-2026-t1: Flávio 56.104.503 (47,03%), Lula 53.879.538 (45,16%).

**Declínio ou transformação.** 2º turno pendente na data da coleta (07/10/2026).

**O que se sabe e o que é disputado.** Disputado: a leitura dos resultados de 2024 como vitória da direita ou do centro (não lida em fonte); o 2º turno ainda não existe. Sabe-se: número de prefeituras e totais conferidos com o TSE.

**Fontes.** [Eleições municipais de 2024 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_municipais_no_Brasil_em_2024); [Repositório sociolibero: web/public/data/elections/pres_2026_t1.json (TSE, snapshot 05/10/2026 14:03, preliminar)](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/votacao_secao_2026_BR.zip); [Eleição presidencial de 2026 - Wikipédia (secundária; página atualizada em 07/10/2026)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2026); [Fundo Especial de Financiamento de Campanha - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Fundo_Especial_de_Financiamento_de_Campanha); [Cláusula de barreira - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Cl%C3%A1usula_de_barreira); [TSE, Dados abertos: detalhe_votacao_secao_2026 e votacao_secao_2026_BR (snapshot 05/10/2026, preliminar; arquivos do repositório)](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2026.zip)

### Sufragismo e voto feminino (1922-1965; transversal)

**Origem.** Federação Brasileira pelo Progresso Feminino, fundada em 1922 por Bertha Lutz (sufragio_fem).

**Pautas.** Voto feminino; Igualdade de direitos políticos

**Base social.** Mulheres urbanas escolarizadas.

**Organização.** FBPF (1922)

**Mídia e tecnologia.** Imprensa e campanhas (não lidos)

**Financiamento e regras.** Regra: Código Eleitoral de 24/02/1932 (Decreto 21.076, art. 2º) definiu eleitores como cidadãos maiores de 21 anos sem distinção de sexo, mas mulheres podiam isentar-se das obrigações eleitorais (art. 121); a CF/1934 (art. 109) tornou o voto obrigatório para homens e, para mulheres, só funcionárias públicas; a isenção das mulheres sem profissão lucrativa permaneceu no DL 7.586/1945 (art. 4º, g) e na Lei 1.164/1950 (art. 4º) e só caiu com a Lei 4.737/1965 (art. 6º). Primeira eleitora: Celina Guimarães (Mossoró, RN, 1927, Lei estadual 660, de 25/10/1927); primeira prefeita: Alzira Soriano (Lajes, RN, eleita em 1928) (TSE); primeira eleição nacional com mulheres: 03/05/1933.

**Alianças e rupturas.** CF/1934 (art. 109) manteve obrigatoriedade para homens e só para funcionárias públicas entre as mulheres; o Código de 1965 (art. 6º) igualou deveres (textos lidos).

**Como se construiu.**
1. 1922: FBPF.
2. 1927-1928: Celina Guimarães Viana (Mossoró, RN) alistada em 1927 pela Lei estadual 660; Alzira Soriano eleita prefeita de Lajes (RN) em 1928 (TSE).
3. 1932-02-24: Código.
4. 1933: Carlota Pereira de Queirós.
5. 1934: Constituição de 1934.
6. 1945: Alistamento obrigatório para mulheres com profissão lucrativa; as demais continuam dispensadas (DL 7.586/1945).
7. 1965: Código Eleitoral de 1965 (art. 6º) elimina a isenção por sexo.

**Resultado eleitoral.**
- const-1933: Primeira mulher eleita constituinte; eleitorado de 1933 de 3,3% da população.

**Declínio ou transformação.** Incorporação plena: voto obrigatório igual a partir de 1965.

**O que se sabe e o que é disputado.** Disputado: o papel do Estado versus o das sufragistas; a eficácia do Código sobre o alistamento (Nicolau: 3,3% da população votou em 1933). Sabe-se: datas.

**Fontes.** [Sufrágio feminino no Brasil - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Sufr%C3%A1gio_feminino_no_Brasil); [Código Eleitoral de 1932 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/C%C3%B3digo_Eleitoral_de_1932); [Eleições gerais de 1933 - Wikipédia (secundária)](https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%B5es_gerais_no_Brasil_em_1933); [Nicolau, J. 'A participação eleitoral: evidências sobre o caso brasileiro' (PDF, CES-Coimbra)](https://www.ces.uc.pt/lab2004/pdfs/JairoNicolau.pdf); [TSE, 'Dia da Conquista do Voto Feminino no Brasil' (notícia lida)](https://www.tse.jus.br/imprensa/noticias-tse/2020/Fevereiro/dia-da-conquista-do-voto-feminino-no-brasil-e-comemorado-nesta-segunda-24-1); [Decreto nº 21.076, de 24/02/1932 (Código Eleitoral) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/decreto/1930-1949/d21076.htm); [Decreto-Lei nº 7.586, de 28/05/1945 (Lei Agamenon) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/decreto-lei/1937-1946/del7586.htm); [Lei nº 4.737, de 15/07/1965 (Código Eleitoral) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/leis/l4737.htm); [Constituição de 1934 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao34.htm)

## O que não foi verificado

- Planalto e Câmara abrem com cabeçalho de navegador; TSE (tse.jus.br, bibliotecadigital, justicaeleitoral.jus.br), TRE-PR e TRE-AP bloqueiam leitura automática. Páginas do TSE foram lidas no navegador; ficaram sem abrir o PDF da tabela do referendo de 1963 e o artigo do TRE-PR sobre a urna.
- Textos legais lidos nesta revisão: Constituições de 1824, 1891, 1934, 1946 e 1988 (art. 14), Decretos 6/1889 e 21.076/1932, DL 7.586/1945, Leis 1.164/1950, 4.737/1965, 7.332/1985, 9.100/1995, 13.487/2017 e 14.208/2021, AI-2 e AI-3, ACs 102 e 103/1977, ECs 7 e 8/1977, 16/1997, 25/1985, 97/2017 e 107/2020, MP 1.164/2023 e Lei 14.601/2023. Não lidos: Decreto 3.029/1881 (Lei Saraiva; só em fonte acadêmica), Instruções de 1820, Lei 9.096/1995.
- Wikipédia é ainda a única fonte de vários números antigos (1891-1922, 1934, 1945-1960, 1962, 1964-1969, 1974-1986, 1989); de 1994 a 2026 os resultados presidenciais vêm do TSE; para 1966, 1970, 1974 e 1978 há tabelas do TSE reproduzidas em fontes acadêmicas.
- Eleitorado absoluto de 1945 a 1960 e de 1982 a 1989 tem fonte parcial; os percentuais da população vêm de rótulos do Gráfico 2 de Nicolau, cuja extração do PDF é ambígua para 1955 e 1960 (o artigo não traz tabela numérica desse gráfico, só texto e quadros de países).
- Plebiscito de 1963: totais de uma reportagem que cita o TSE, conferidos contra o percentual da Agência Senado; a tabela oficial em PDF não abriu. Eleições municipais de 1988 e 1992 e resultados municipais de 1985 não foram lidos; 1985 (regra e data) e 1996 (data, eleitorado, comparecimento) foram.
- Números de militância (integralismo, ANL, CEBs, MST) são declarações ou estimativas e não contagens.
- Financiamento: para a maioria dos movimentos, 'não verificado'; o repositório não tem dado de arrecadação histórica. O 'US$ 5 milhões' de 1962 é estimativa do embaixador Gordon, não valor documentado.
- Percentuais regionais de Lula e Bolsonaro/Flávio são cálculo nosso, sobre válidos municipais sem exterior; diferem do total oficial, que inclui o exterior.
- Eleições estaduais, legislativas de 1958, 1990 e 1994 e a maior parte das eleições municipais não estão cobertas; a linha do tempo é seletiva.
- Não há análise causal: correlação entre movimento e resultado não implica efeito.

Campos marcados `verificado: false` no JSON:

- sao-vicente-1532: regras de voto
- cortes-lisboa-1821: regras de voto
- pres-1955: eleitorado
- pres-1960: eleitorado
- indireta-1964: regras de voto
- indireta-1969: regras de voto
- geral-1970: regras de voto
- geral-1974: regras de voto
- lei-falcao-1976: regras de voto
- geral-1978: regras de voto
- geral-1982: regras de voto
- adi4650-2015: regras de voto
- pres-2026-t2: regras de voto

## Controvérsias

- **Abolicionismo e a política parlamentar do Império.** Disputado: o grau de iniciativa dos escravizados versus a elite parlamentar; a carta de 11/08/1889 atribuída à Princesa Isabel ao Visconde de Santa Vitória (compensação a libertos) está no acervo do Museu Imperial e, segundo reportagem lida (Jornal Opção), 'muitos historiadores discutem a autenticidade' apesar da caligrafia da princesa, de modo que a controvérsia verificável é o significado do documento (alegação de fonte jornalística, não confirmada em fonte acadêmica); o despacho de Rui Barbosa de 14/12/1890 mandou queimar papéis, livros e documentos sobre escravos nas repartições da Fazenda, e foi executado pela Circular nº 29, de 13/05/1891, do ministro Alencar Araripe (Fundação Casa de Rui Barbosa, lida); a Fundação sustenta que o fim era eliminar comprovantes fiscais que serviriam a pedidos de indenização e que 'arquivos da escravidão' não existiam como tais, enquanto Otávio Tarquínio de Sousa, citado, lamenta a perda de documentação; eficácia das leis graduais (apenas 118 'ingênuos' entregues ao governo, segundo a página lida). Sabe-se: datas e votações das leis.
- **Republicanismo: clubes, Manifesto de 1870 e Partido Republicano Paulista.** Disputado: o papel da classe de fazendeiros versus o do Exército na queda do Império; peso do Manifesto de 1870 (60 assinaturas) sobre o 15/11/1889. Sabe-se: datas e assinaturas; não se sabe nesta rodada o número de clubes republicanos.
- **Tenentismo e Coluna Prestes.** Disputado: o grau de ideologia (reformismo militar, autoritarismo, programa social) e a relação com o Exército como instituição. Sabe-se: datas, extensão e efetivo aproximado da Coluna (fonte secundária sem ressalvas numéricas).
- **Aliança Liberal e a Revolução de 1930.** Disputado: peso da fraude sobre o resultado (a fonte lida só informa a alegação), papel do assassinato de João Pessoa (cuja motivação era local, segundo a página lida) e da adesão tenentista. A porcentagem de Prestes varia entre 57,7% e 59,39% conforme a base de cálculo.
- **Integralismo (Ação Integralista Brasileira).** Disputado: o número de membros (a própria AIB declarou 1,3 milhão; estimativa independente 600 mil a 1 milhão); a classificação como fascismo versus integralismo católico próprio. Sabe-se: fundação e dissolução.
- **Aliança Nacional Libertadora.** Disputado: a relação com a Internacional Comunista e o papel do levante de novembro no endurecimento do regime; o número de 1 milhão de membros (fonte secundária, sem contagem). Sabe-se: datas de lançamento e fechamento.
- **Trabalhismo e getulismo (PTB, CLT, sindicatos).** Disputado: a natureza do getulismo. A leitura clássica de 'populismo' (massa manipulada) foi criticada por Ângela de Castro Gomes ('A invenção do trabalhismo', 'pacto trabalhista' com trabalhadores como sujeitos) e discutida em coletânea organizada por Jorge Ferreira (fonte lida só em resumo de busca). Sabe-se: datas, números de bancada e votos de Vargas.
- **Queremismo ('Queremos Getúlio').** Disputado: se o queremismo foi mobilização espontânea ou construída pelo governo. Não verificado.
- **UDN e o antigetulismo.** Disputado: classificação do antigetulismo como liberalismo ou como golpismo em 1954-55 e 1964; o grau de apoio da UDN ao golpe de 1964 não foi lido em fonte. Sabe-se: votos e datas.
- **Desenvolvimentismo (Juscelino Kubitschek).** Disputado: custo (dívida, inflação) e dependência de capital estrangeiro; concentração industrial no Sudeste (metas). Sabe-se: metas de capacidade elétrica e refino.
- **Jânio Quadros e o 'varre-varre'.** Disputado: motivo da renúncia (a página lida diz que ele possivelmente esperava apoio popular que não veio). Não verificado.
- **Marcha da Família e o golpe de 1964.** Disputado: peso dos EUA e do IBAD/IPES; sobre o padre Patrick Peyton, o artigo acadêmico lido (Estudos Históricos, 2024) mostra, em documento da CIA (reunião de 23/11/1960), a proposta de Peter Grace de encorajar Peyton a atuar em Cuba, e relata, com base em biografia (Gribble, 2003), que Grace 'teria intermediado' financiamento da CIA à Cruzada do Rosário em Família; nada ali sustenta que Peyton fosse 'agente da CIA', e o vínculo da Cruzada com as Marchas é de continuidade organizacional (a Cruzada de 1962 é vista como embrião delas), não de financiamento documentado das Marchas; tratar como alegação baseada em fonte secundária; estimativas de público (300 mil a 500 mil; 1 milhão) sem indicação do autor da contagem.
- **Oposição consentida (MDB) e as eleições de 1974, 1978 e 1982.** Disputado: se a 'oposição consentida' legitimou ou desgastou o regime; o peso do voto de protesto (cerca de 30% de nulos e brancos na Câmara em 1970, confirmado em tabela do TSE via Pecoraro). Divergência numérica: 1974 tem três leituras (160, 161 ou 165 cadeiras do MDB; Kinzo 160, TSE v. 11 161, página do MDB 165, esta sem fonte aberta); 1978 foi resolvida a favor de 189 (231 + 189 = 420; 196 não fecha).
- **Novo sindicalismo (ABC) e fundação do PT.** Disputado: peso relativo de sindicatos, CEBs e intelectuais na fundação; fonte lida só traz a composição. Sabe-se: datas, votos e bancadas.
- **CEBs e a Igreja católica.** Disputado: acusações de infiltração marxista (conservadores) versus leitura religiosa e pedagógica; alcance real (a página cita 14 milhões de católicos organizados e 1,8 milhão de adultos atuantes; os números divergem por critério).
- **MST e a luta pela terra.** Disputado: legitimidade das ocupações; financiamento público; contagem de assassinados (a página cita 1.722 militantes mortos desde 1985, segundo a CPT). Sabe-se: datas e eleitos em 2022 e 2024 segundo a página.
- **Diretas Já.** Disputado: público (números dependem de quem contou); o papel da imprensa e da TV Globo; se a emenda fracassou por manobra do governo ou pela divisão da oposição. Sabe-se: contagem de votos da emenda (a página diz 112 ausentes).
- **Constituinte (1987-88) e emendas populares.** Disputado: representatividade de um Congresso que acumulava mandato ordinário; peso dos lobbies; número exato de assinaturas das emendas populares (não verificado).
- **Collor: outsider, mídia e 'caçador de marajás'.** Disputado: peso da TV Globo na vitória (a página lida chega a afirmar que a vitória não seria possível sem a emissora, tese contestada pela emissora e por Collor); o efeito do debate editado sobre o voto não foi medido nas fontes lidas.
- **Plano Real e a coalizão PSDB-PFL.** Disputado: o uso eleitoral do plano e a âncora cambial (a página registra a crítica); o peso da inflação baixa versus a coalizão. Sabe-se: datas e votos.
- **Lulismo e o PT no governo (alianças, Bolsa Família, Nordeste).** Disputado: peso do Bolsa Família no voto (Zucco 2008 e Pereira e Mueller 2010 associam expansão do programa a ganhos do governo nas regiões pobres, segundo a página lida); controvérsia sobre a auditoria do TCU de 2009 (pagamentos a falecidos, 3.791, a políticos, 577) e sobre o efeito educacional (frequência sim, notas não). Percentuais regionais: cálculo nosso sobre dados do TSE, municipal, sem exterior.
- **Movimento evangélico na política (Frente Parlamentar Evangélica).** Disputado: o que é 'bancada evangélica' (filiação à frente, identidade religiosa ou ligação com igreja), por isso há várias contagens: DIAP, 75 deputados eleitos em 2022 (inclui quem ocupa cargos em igrejas, cantores gospel e quem professa a fé ou vota com o grupo, segundo o artigo da UFV); ISER, 96 parlamentares; bancada, 102 deputados e 13 senadores; Frente Parlamentar Evangélica, 209 deputados e 26 senadores (Wikipédia), 238 membros na lista do Congresso em maio de 2023 (reportagem), com assinantes que nem sempre são evangélicos; o 'voto evangélico' como bloco (o estudo citado sugere distância dos partidos).
- **Bancada ruralista e do agro (UDR, Frente Parlamentar da Agropecuária).** Disputado: a medida da bancada (de 120 a 200 votos conforme o tema, segundo a página lida); doações e trabalho escravo (dissertação citada).
- **Jornadas de junho de 2013.** Disputado: natureza política dos protestos (esquerda, direita, difusa); papel da imprensa (a página lida diz que os veículos inicialmente minimizaram os protestos; mudança de tom após jornalistas serem feridos); estimativas de público variam por fonte. Sabe-se: datas e perfil da amostra.
- **MBL, Vem pra Rua e o impeachment de 2015-16.** Disputado: 'golpe' versus 'impeachment legal' (defesa: processo político sem crime de responsabilidade; acusação: pedaladas e decretos sem autorização, 'atentados à Constituição'); financiamento do MBL. Sabe-se: datas e placares.
- **Lava Jato e antipetismo.** Disputado: legalidade dos métodos, o papel do juiz Moro, a leitura política das anulações e o peso da operação no resultado de 2018 (não medido). Sabe-se: balanço do MPF e datas.
- **Bolsonarismo (campanha digital de 2018, WhatsApp e redes).** Disputado: efeito do WhatsApp e dos disparos em massa sobre o resultado de 2018 (especialistas citados defendem anulação; outros dizem que o impacto é indeterminável); papel do Inquérito das Fake News; interpretação dos atos de 8 de janeiro. O efeito não foi medido nas fontes lidas.
- **A frente ampla de 2022.** Disputado: se foi frente 'ampla' (centro e direita aderentes) ou aliança de esquerda com adesões pontuais; o papel de Tebet e do MDB no 2º turno não foi lido. Sabe-se: composição formal.
- **Eleições municipais de 2024 e gerais de 2026.** Disputado: a leitura dos resultados de 2024 como vitória da direita ou do centro (não lida em fonte); o 2º turno ainda não existe. Sabe-se: número de prefeituras e totais conferidos com o TSE.
- **Sufragismo e voto feminino.** Disputado: o papel do Estado versus o das sufragistas; a eficácia do Código sobre o alistamento (Nicolau: 3,3% da população votou em 1933). Sabe-se: datas.

## Revisão

Revisão de fontes de 07/10/2026 sobre a linha do tempo gerada em 07/10/2026 pela primeira coleta. Método: leitura de texto legal no Planalto e na Câmara (acessíveis com cabeçalho de navegador, ao contrário do que a primeira coleta registrou), dados abertos do TSE lidos por requisição parcial dos arquivos zip (apenas as tabelas nacionais), páginas do TSE lidas no navegador, e fontes acadêmicas abertas. Nada foi copiado de resumo de busca como prova; onde só havia resumo, o item continua `false` ou foi rebaixado. O JSON guarda cada alteração em `meta.revisao` (antes, depois, motivo, fonte, verificado); `historia.json` guarda as suas em `meta.revisao`.

### Resumo

- **174 registros** de alteração em `eleicoes_timeline.json` (mais 4 em `historia.json`).
- **30 marcas `verificado` passaram de `false` a `true`** (campos): 25 em `regras_de_voto` (texto constitucional ou legal no Planalto/Câmara: CF/1891, 1934, 1946 e 1988, DL 7.586/1945, Lei 1.164/1950, EC 25/1985, EC 8/1977, EC 16/1997, EC 97/2017), 3 em `eleitorado` (1996, 2016, 2024: dados abertos do TSE), 1 em `fontes` e 1 em `regras_ao_longo_do_tempo`; **111 novas marcas `true`** em fontes, resultados e linhas acrescentadas; **1 passou de `true` a `false`** (eleitorado de 1955, rótulo de gráfico ambíguo).
- **Resultados presidenciais de 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022 e 2026** passaram a citar o arquivo do TSE como fonte. Em 2002, 2006 (votos), 2010, 2014 e 2018 os números da Wikipédia coincidiram exatamente; mudaram 1994 (todos os candidatos e o eleitorado), 1998 (eleitorado) e o eleitorado de 2006, 2018 e 2022.
- Totais de Lula e Bolsonaro/Flávio **reconferidos** com os `totais_publicados` do repositório: 2022 T1 57.259.504 e 51.072.345, 2022 T2 60.345.999 e 58.206.354, 2026 T1 53.879.538 e 56.104.503, diferença 0 em todos.

### O que mudou

Tabela dos registros de `meta.revisao` (textos longos truncados aqui; o JSON tem o texto integral).

| Id | Campo | Antes | Depois | Fonte | Verificado |
|---|---|---|---|---|---|
| constituicao-1824 | regras_de_voto.quem_votava | Homens livres, com renda mínima (censitário), em eleição indireta de dois graus; excluídos menores de 25 anos, criados de servir, escravizados e mulheres (página lida). | Cidadãos brasileiros em gozo de direitos políticos, incluindo naturalizados, em eleição indireta de dois graus (arts. 90-91). Excluídos da assembleia paroquial: menores … | [Constituição Política do Império do Brasil (1824) - Planalto (texto l…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao24.htm) | sim |
| constituicao-1824 | regras_de_voto.analfabetos | (vazio) | true | [Constituição Política do Império do Brasil (1824) - Planalto (texto l…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao24.htm) | sim |
| constituicao-1824 | mudancas_de_regra[1] | Valores em réis: a página lida fala em 100 a 400 mil réis conforme o grau; a fonte primária (Planalto) não abriu por erro de rede e outra página (Lei Saraiva) cita 200 m… | Valores em réis, conforme o texto da Constituição (Planalto, lido): 100 mil para votar na assembleia paroquial (art. 92, V), 200 mil para ser eleitor de província (art. … | [Constituição Política do Império do Brasil (1824) - Planalto (texto l…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao24.htm) | sim |
| regra-1824 | regra | Voto censitário e indireto em dois graus; excluídos menores de 25, criados de servir, escravizados e mulheres. | Voto censitário e indireto em dois graus: renda de 100 mil réis para votar, 200 mil para ser eleitor de província e 400 mil para deputado; excluídos menores de 25 (com e… | [Constituição Política do Império do Brasil (1824) - Planalto (texto l…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao24.htm) | sim |
| lei-saraiva-1881 | mudancas_de_regra[+] | (vazio) | Ferraro (2013), com base nos Anais: o censo de 200 mil réis vinha da Constituição de 1824; o projeto Sinimbu (1879) propunha elevá-lo a 400 mil e excluir os analfabetos,… | [Ferraro, A. R. 'Educação, classe, gênero e voto no Brasil imperial: L…](https://www.redalyc.org/pdf/1550/155029382011.pdf) | sim |
| regra-1889 | regra/fonte | Fim da exigência de comprovação de renda. | Decreto nº 6 (19/11/1889): consideram-se eleitores os cidadãos brasileiros em gozo dos direitos civis e políticos que saibam ler e escrever; some o censo de renda. | [Decreto nº 6, de 19/11/1889 (Governo Provisório) - Planalto (texto li…](https://www.planalto.gov.br/ccivil_03/decreto/1851-1899/d0006.htm) | sim |
| pres-1891 | regras_de_voto.quem_votava | Disposição transitória: o Congresso elegeu o primeiro presidente (a Constituição previa voto direto). | Disposição transitória (art. 1º): o Congresso, reunido em assembleia geral, elegeria presidente e vice em dois escrutínios distintos; a Constituição previa voto direto d… | [Constituição de 1891 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao91.htm) | sim |
| pres-1891 | regras_de_voto.idade_minima | (vazio) | 21 | [Constituição de 1891 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao91.htm) | sim |
| pres-1891 | regras_de_voto.analfabetos | (vazio) | false | [Constituição de 1891 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao91.htm) | sim |
| pres-1891 | regras_de_voto.regras_verificado | false | true | [Constituição de 1891 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao91.htm) | sim |
| regra-1891 | fonte | Nicolau, J. 'A participação eleitoral: evidências sobre o caso brasileiro' (PDF, CES-Coimbra) | Constituição de 1891 - Planalto (texto lido) | [Constituição de 1891 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao91.htm) | sim |
| pres-1930 | resultados[Júlio Prestes].nota | A página da Aliança Liberal registra 57,7% sobre outra base; a de 1930 registra 59,39%. | Divergência de percentual documentada: CPDOC/FGV (verbete Revolução de 1930, lido) diz que Prestes foi 'eleito com 57,7% dos votos'; 59,39% vem de Wikipédia. Nenhuma das… | [CPDOC/FGV, verbete 'Revolução de 1930' (Primeira República; PDF lido)](https://cpdoc.fgv.br/sites/default/files/verbetes/primeira-republica/REVOLU%C3%87%C3%83O%20DE%201930.pdf) | sim |
| pres-1930 | resultados[Getúlio Vargas].nota | Revolução de 1930 (página) registra 742.797 votos; diferença de 3 votos entre páginas. | 742.794 votos aparecem em duas leituras (Wikipédia, página da eleição, e Assembleia Legislativa de SP, lida); 742.797 só em Wikipédia, página da Revolução de 1930. Adota… | [Assembleia Legislativa de SP, 'Revolução de 1930: 75 anos' (lida)](https://www.al.sp.gov.br/noticia/?id=313129) | sim |
| pres-1930 | nota | (vazio) | Fraude 'dos dois lados' e 298 mil votos de Vargas contra 982 de Prestes no Rio Grande do Sul, segundo CPDOC. | [CPDOC/FGV, verbete 'Revolução de 1930' (Primeira República; PDF lido)](https://cpdoc.fgv.br/sites/default/files/verbetes/primeira-republica/REVOLU%C3%87%C3%83O%20DE%201930.pdf) | sim |
| codigo-eleitoral-1932 | regras_de_voto.quem_votava | Cidadãos maiores de 21 anos, sem distinção de sexo; analfabetos excluídos; voto obrigatório para homens e funcionárias públicas. | Eleitor é o cidadão maior de 21 anos, sem distinção de sexo (art. 2º); excluídos mendigos, analfabetos e praças de pré (art. 4º); voto secreto e representação proporcion… | [Decreto nº 21.076, de 24/02/1932 (Código Eleitoral) - Planalto (texto…](https://www.planalto.gov.br/ccivil_03/decreto/1930-1949/d21076.htm) | sim |
| codigo-eleitoral-1932 | regras_de_voto.obrigatorio | true | true | [Decreto nº 21.076, de 24/02/1932 (Código Eleitoral) - Planalto (texto…](https://www.planalto.gov.br/ccivil_03/decreto/1930-1949/d21076.htm) | não |
| codigo-eleitoral-1932 | sistema | (vazio) | Representação proporcional (dois turnos simultâneos, art. 58, §2º; máquinas de votar previstas no art. 57), voto secreto (art. 56) e Justiça Eleitoral instituída (art. 5… | [Decreto nº 21.076, de 24/02/1932 (Código Eleitoral) - Planalto (texto…](https://www.planalto.gov.br/ccivil_03/decreto/1930-1949/d21076.htm) | sim |
| regra-1932 | regra/fonte | Código Eleitoral: voto secreto, feminino, obrigatoriedade (homens e funcionárias), Justiça Eleitoral, proporcional. | Código Eleitoral (Decreto 21.076): eleitor maior de 21 anos sem distinção de sexo, voto secreto, representação proporcional, Justiça Eleitoral, alistamento ex officio; m… | [Decreto nº 21.076, de 24/02/1932 (Código Eleitoral) - Planalto (texto…](https://www.planalto.gov.br/ccivil_03/decreto/1930-1949/d21076.htm) | sim |
| pres-1934 | regras_de_voto.quem_votava | Eleição indireta pela Assembleia Nacional Constituinte. | Eleição indireta pela Assembleia Nacional Constituinte (art. 1º das Disposições Transitórias). Pela CF/1934: eleitores de ambos os sexos maiores de 18 anos, alfabetizado… | [Constituição de 1934 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao34.htm) | sim |
| pres-1934 | regras_de_voto.mulheres | (vazio) | true | [Constituição de 1934 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao34.htm) | sim |
| pres-1934 | regras_de_voto.analfabetos | (vazio) | false | [Constituição de 1934 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao34.htm) | sim |
| pres-1934 | regras_de_voto.idade_minima | (vazio) | 18 | [Constituição de 1934 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao34.htm) | sim |
| pres-1934 | regras_de_voto.obrigatorio | (vazio) | true | [Constituição de 1934 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao34.htm) | sim |
| pres-1934 | regras_de_voto.regras_verificado | false | true | [Constituição de 1934 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao34.htm) | sim |
| pres-1934 | mudancas_de_regra[0] | Constituição de 1934 (16/07/1934): voto obrigatório só para funcionárias públicas, segundo a página de sufrágio feminino. | Constituição de 1934 (16/07/1934), art. 109: alistamento e voto obrigatórios para os homens e, para as mulheres, apenas quando exerçam função pública remunerada; art. 10… | [Constituição de 1934 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao34.htm) | sim |
| regra-1934 | regra/fonte | Constituição: obrigatoriedade só para funcionárias. | Constituição: eleitores de ambos os sexos com 18 anos (art. 108); voto obrigatório para homens e, para mulheres, só funcionárias públicas (art. 109). | [Constituição de 1934 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao34.htm) | sim |
| estado-novo-1937 | tipo | indireta | geral | [Constituição de 1934 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao34.htm) | sim |
| estado-novo-1937 | mudancas_de_regra[+] | (vazio) | A eleição cancelada seria direta: CF/1934, art. 52, §1º (sufrágio universal, direto e secreto). | [Constituição de 1934 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao34.htm) | sim |
| pres-1945 | regras_de_voto.quem_votava | Homens e mulheres alfabetizados; alistamento obrigatório também para mulheres (Nicolau); candidaturas avulsas proibidas. | Brasileiros de ambos os sexos maiores de 18 anos, alfabetizados (DL 7.586/1945, arts. 2º-3º); voto obrigatório, direto e secreto (art. 38); eram dispensadas do alistamen… | [Decreto-Lei nº 7.586, de 28/05/1945 (Lei Agamenon) - Planalto (texto …](https://www.planalto.gov.br/ccivil_03/decreto-lei/1937-1946/del7586.htm) | sim |
| pres-1945 | regras_de_voto.idade_minima | 21 | 18 | [Decreto-Lei nº 7.586, de 28/05/1945 (Lei Agamenon) - Planalto (texto …](https://www.planalto.gov.br/ccivil_03/decreto-lei/1937-1946/del7586.htm) | sim |
| pres-1945 | regras_de_voto.voto_secreto | (vazio) | true | [Decreto-Lei nº 7.586, de 28/05/1945 (Lei Agamenon) - Planalto (texto …](https://www.planalto.gov.br/ccivil_03/decreto-lei/1937-1946/del7586.htm) | sim |
| pres-1945 | mudancas_de_regra[0] | Voto feminino com alistamento obrigatório; nascimento dos partidos nacionais (PSD, PTB, UDN, PCB legalizado). | Voto feminino com alistamento obrigatório, salvo para mulheres sem profissão lucrativa (DL 7.586/1945, art. 4º, g); nascimento dos partidos nacionais (PSD, PTB, UDN, PCB… | [Decreto-Lei nº 7.586, de 28/05/1945 (Lei Agamenon) - Planalto (texto …](https://www.planalto.gov.br/ccivil_03/decreto-lei/1937-1946/del7586.htm) | sim |
| pres-1945 | nota | Percentuais de votos são sobre votos válidos conforme a página; Dutra 55,39% = 3.251.507/5.870.667. | Percentuais de votos são sobre votos válidos conforme a página; Dutra 55,39% = 3.251.507/5.870.667. Bancadas de 1945 (UDN 82 de 286) não foram conferidas em fonte aberta… | [Decreto-Lei nº 7.586, de 28/05/1945 (Lei Agamenon) - Planalto (texto …](https://www.planalto.gov.br/ccivil_03/decreto-lei/1937-1946/del7586.htm) | não |
| regra-1945 | regra/fonte | Alistamento obrigatório estendido a todas as mulheres; ex officio por empresas, sindicatos e ordens. | Lei Agamenon (DL 7.586/1945): maiores de 18 anos, alfabetizados; voto obrigatório e secreto, com dispensa para mulheres sem profissão lucrativa e maiores de 65 anos; ali… | [Decreto-Lei nº 7.586, de 28/05/1945 (Lei Agamenon) - Planalto (texto …](https://www.planalto.gov.br/ccivil_03/decreto-lei/1937-1946/del7586.htm) | sim |
| regra-1946 | regra/fonte | Constituição de 1946: maiores de 18 anos de ambos os sexos, sem analfabetos. | Constituição de 1946: eleitores maiores de 18 anos, sem analfabetos (arts. 131-132); alistamento e voto obrigatórios para os brasileiros de ambos os sexos, salvo exceçõe… | [Constituição de 1946 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao46.htm) | sim |
| regra-1950 | (nova linha) | (vazio) | Código Eleitoral (Lei 1.164/1950): maiores de 18 anos; voto obrigatório para ambos os sexos, salvo (alistamento) inválidos, maiores de 70, residentes no exterior e mulhe… | [Lei nº 1.164, de 24/07/1950 (Código Eleitoral) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/leis/1950-1969/l1164.htm) | sim |
| pres-1950 | regras_de_voto.voto_secreto | (vazio) | true | [Lei nº 1.164, de 24/07/1950 (Código Eleitoral) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/leis/1950-1969/l1164.htm) | sim |
| pres-1950 | regras_de_voto.quem_votava | Brasileiros maiores de 18 anos, de ambos os sexos; analfabetos proibidos (Constituição de 1946). | Brasileiros maiores de 18 anos; analfabetos proibidos (CF/1946, arts. 131-132 e Lei 1.164/1950, art. 3º); alistamento e voto obrigatórios para ambos os sexos, salvo, ent… | [Lei nº 1.164, de 24/07/1950 (Código Eleitoral) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/leis/1950-1969/l1164.htm) | sim |
| pres-1950 | mudancas_de_regra[0] | Cédula única e proporcionalidade para deputados e vereadores aparecem em fontes secundárias (Código Eleitoral de 1950), não verificadas em lei. | Código Eleitoral de 1950 (Lei 1.164, de 24/07/1950, lido): sigilo por sobrecarta oficial uniforme e cédula do partido (art. 54), representação proporcional para deputado… | [Lei nº 1.164, de 24/07/1950 (Código Eleitoral) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/leis/1950-1969/l1164.htm) | sim |
| pres-1955 | eleitorado.verificado/nota | {"valor": null, "pct_populacao": 15.0, "tipo": "votantes como % da população (rótulo de gráfico)", "fonte": "Nicolau, J. 'A participação eleitoral: evidências sobre o ca… | {"valor": null, "pct_populacao": 15.0, "tipo": "votantes como % da população (rótulo de gráfico)", "fonte": "Nicolau, J. 'A participação eleitoral: evidências sobre o ca… | [Nicolau, J. 'A participação eleitoral: evidências sobre o caso brasil…](https://www.ces.uc.pt/lab2004/pdfs/JairoNicolau.pdf) | não |
| pres-1960 | eleitorado.verificado/nota | {"valor": 15542332, "pct_populacao": 18.0, "tipo": "eleitores (resumo de busca de dado TSE)", "fonte": "Nicolau, J. 'A participação eleitoral: evidências sobre o caso br… | {"valor": 15542332, "pct_populacao": 18.0, "tipo": "eleitores (resumo de busca de dado TSE)", "fonte": "Nicolau, J. 'A participação eleitoral: evidências sobre o caso br… | [Nicolau, J. 'A participação eleitoral: evidências sobre o caso brasil…](https://www.ces.uc.pt/lab2004/pdfs/JairoNicolau.pdf) | não |
| pres-1950 | nota | (vazio) | Nicolau, Gráfico 2: 15,9% (1950) é compatível com 16%; ver ambiguidade em 1955 e 1960. | [Nicolau, J. 'A participação eleitoral: evidências sobre o caso brasil…](https://www.ces.uc.pt/lab2004/pdfs/JairoNicolau.pdf) | sim |
| geral-1962 | cargo | Câmara, Senado (23 vagas) e 11 governadores | Câmara, Senado e 11 governadores | [Nóbrega, C. H. S. 'As eleições de 1962' (monografia UFRJ, 2019; cita …](https://pantheon.ufrj.br/bitstream/11422/16980/1/CHSNobrega.pdf) | não |
| geral-1962 | financiamento | Financiamento externo/empresarial pelo IBAD e ADEP (fundado em maio de 1959; dissolvido por ordem judicial em 20/12/1963); a página de 1962 diz que o embaixador Lincoln … | IBAD (fundado em 1959) e ADEP (fundada em março de 1962) financiaram candidatos anticomunistas em 1962; o relator da CPI do IBAD citou gastos em cruzeiros (cerca de Cr$ … | [Nóbrega, C. H. S. 'As eleições de 1962' (monografia UFRJ, 2019; cita …](https://pantheon.ufrj.br/bitstream/11422/16980/1/CHSNobrega.pdf) | sim |
| geral-1962 | nota | Valor de US$ 5 milhões: afirmado numa página secundária; não conferido em fonte primária (CPI do IBAD, 1963). | Valor de US$ 5 milhões: estimativa do ex-embaixador Gordon em entrevistas (lida em monografia acadêmica que cita a Veja de 1977 e a entrevista de 2002); a CPI do IBAD (1… | [Nóbrega, C. H. S. 'As eleições de 1962' (monografia UFRJ, 2019; cita …](https://pantheon.ufrj.br/bitstream/11422/16980/1/CHSNobrega.pdf) | sim |
| geral-1962 | mudancas_de_regra[+] | (vazio) | Código Eleitoral de 1950, arts. 144-145: partidos não podiam receber recursos de procedência estrangeira (Planalto, lido); a CPI do IBAD usou esse dispositivo (monografi… | [Lei nº 1.164, de 24/07/1950 (Código Eleitoral) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/leis/1950-1969/l1164.htm) | sim |
| plebiscito-1963 | regras_de_voto.quem_votava | Eleitorado da República de 1946. | Eleitorado da República de 1946: maiores de 18 anos, sem analfabetos (CF/1946, arts. 131-132), voto obrigatório e secreto (arts. 133-134). Instituído pela EC 4/1961 (02/… | [TSE, Referendo de 1963 (página institucional lida; tabela em PDF não …](https://www.tse.jus.br/eleicoes/plebiscitos-e-referendos/referendo-1963/referendo-de-1963) | sim |
| plebiscito-1963 | regras_de_voto.regras_verificado | false | true | [Constituição de 1946 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao46.htm) | sim |
| plebiscito-1963 | resultados | [] | [{"candidato": "Não (volta ao presidencialismo)", "partido": null, "votos": 9457448, "pct": 82.02, "fonte": "Migalhas, 'Referendo de 1963: votação que restaurou o presid… | [Migalhas, 'Referendo de 1963: votação que restaurou o presidencialism…](https://www.migalhas.com.br/quentes/422408/referendo-de-1963-votacao-que-restaurou-o-presidencialismo-no-brasil) | sim |
| plebiscito-1963 | mudancas_de_regra | ["O resultado numérico não foi lido nesta rodada (as páginas tentadas retornaram 404); só o evento consta de historia.json."] | ["O TSE classifica a consulta como referendo (Lei Complementar nº 2, de 16/09/1962), embora o Senado e a literatura a chamem de plebiscito; vigorava o regime parlamentar… | [TSE, Referendo de 1963 (página institucional lida; tabela em PDF não …](https://www.tse.jus.br/eleicoes/plebiscitos-e-referendos/referendo-1963/referendo-de-1963) | sim |
| ai2-1965 | mudancas_de_regra[1] | O Código Eleitoral de 1965 eliminou diferenças de sexo na obrigatoriedade do voto (sufrágio feminino, página lida). | O Código Eleitoral de 1965 (Lei 4.737, de 15/07/1965, art. 6º) eliminou a isenção das mulheres sem profissão lucrativa, que ainda constava da Lei 1.164/1950, art. 4º; é … | [Lei nº 4.737, de 15/07/1965 (Código Eleitoral) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/leis/l4737.htm) | sim |
| ai2-1965 | sistema | (vazio) | Extinguiu os partidos (art. 18); o bipartidarismo ARENA x MDB veio com o Ato Complementar nº 4 (historia.json). Ampliou o STF de 11 para 16 ministros; permitiu cassar ma… | [Ato Institucional nº 2 (27/10/1965) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/ait/ait-02-65.htm) | sim |
| regra-1965 | regra/fonte | AI-2: bipartidarismo e eleição indireta de presidente em votação nominal; Código Eleitoral iguala deveres de homens e mulheres. | AI-2: extinção dos partidos, eleição indireta de presidente por maioria absoluta do Congresso em votação nominal e STF com 16 ministros; o Código Eleitoral de julho de 1… | [Ato Institucional nº 2 (27/10/1965) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/ait/ait-02-65.htm) | sim |
| indireta-1966 | mudancas_de_regra[0] | MDB obteve em 1966, segundo sua página: 7 senadores (de 23) e 132 deputados federais (de 409). | MDB obteve em 1966, segundo TSE (Dados Estatísticos, v. 8, citado por Pecoraro) e Kinzo (1988): 4 senadores (de 22) e 132 deputados federais (de 409). | [Pecoraro, T. M. 'O MDB durante o governo Geisel' (dissertação UFRRJ, …](https://rima.ufrrj.br/jspui/bitstream/20.500.14407/13851/3/2019%20-%20Tamires%20Mascarenhas%20Pecoraro.pdf) | sim |
| geral-1970 | sistema | ARENA 223 cadeiras e MDB 87 na Câmara; Senado: ARENA 41 e MDB 5 de 46 (composição citada). | ARENA 223 cadeiras e MDB 87 na Câmara (TSE v. 9 via Pecoraro e Kinzo concordam); Senado (46): ARENA 41 e MDB 5 segundo Kinzo, ARENA 40 e MDB 6 segundo o TSE v. 9 citado … | [Pecoraro, T. M. 'O MDB durante o governo Geisel' (dissertação UFRRJ, …](https://rima.ufrrj.br/jspui/bitstream/20.500.14407/13851/3/2019%20-%20Tamires%20Mascarenhas%20Pecoraro.pdf) | sim |
| geral-1970 | mudancas_de_regra[0] | A página do MDB registra cerca de 30% de votos brancos e nulos em 1970 (leitura única, não cruzada). | Câmara 1970: brancos 20,91% e nulos 9,35% (30,26%) segundo o TSE v. 9 citado por Pecoraro; Senado: 21,71% e 6,00% (27,7%). A leitura de 'cerca de 30%' do MDB fica confir… | [Pecoraro, T. M. 'O MDB durante o governo Geisel' (dissertação UFRRJ, …](https://rima.ufrrj.br/jspui/bitstream/20.500.14407/13851/3/2019%20-%20Tamires%20Mascarenhas%20Pecoraro.pdf) | sim |
| geral-1974 | regras_de_voto.quem_votava | Voto direto obrigatório para legislativo; 22 governadores nomeados ('biônicos'). | Voto direto obrigatório para o legislativo; governadores eleitos indiretamente pelas Assembleias (AI-3, 1966), não nomeados diretamente; 'biônicos' são os senadores indi… | [Ato Institucional nº 3 (05/02/1966) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/ait/ait-03-66.htm) | sim |
| geral-1974 | sistema | ARENA 204 e MDB 160 cadeiras na Câmara (página da eleição; a do MDB registra 165). Senado: MDB 16 das 22 vagas e ARENA 6. | Câmara (364): ARENA 204 e MDB 160 segundo Kinzo (1988) e a página da eleição; ARENA 203 e MDB 161 segundo o TSE (Dados Estatísticos, v. 11, 1977, p. 26, citado por Pecor… | [Pecoraro, T. M. 'O MDB durante o governo Geisel' (dissertação UFRRJ, …](https://rima.ufrrj.br/jspui/bitstream/20.500.14407/13851/3/2019%20-%20Tamires%20Mascarenhas%20Pecoraro.pdf) | sim |
| geral-1974 | resultados[MDB (Câmara)].votos | 10954440 | 10954359 | [Pecoraro, T. M. 'O MDB durante o governo Geisel' (dissertação UFRRJ, …](https://rima.ufrrj.br/jspui/bitstream/20.500.14407/13851/3/2019%20-%20Tamires%20Mascarenhas%20Pecoraro.pdf) | sim |
| geral-1974 | resultados[ARENA (Câmara)].votos | 11866482 | 11866699 | [Pecoraro, T. M. 'O MDB durante o governo Geisel' (dissertação UFRRJ, …](https://rima.ufrrj.br/jspui/bitstream/20.500.14407/13851/3/2019%20-%20Tamires%20Mascarenhas%20Pecoraro.pdf) | sim |
| pacote-abril-1977 | data | 1977-04-13 | 1977-04-14 | [Emenda Constitucional nº 8, de 14/04/1977 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc_anterior1988/emc08-77.htm) | sim |
| pacote-abril-1977 | cargo | Pacote de Abril (Geisel): regras eleitorais por decreto | Pacote de Abril (Geisel): regras eleitorais por emenda e decreto-lei durante o recesso do Congresso (AC 102, de 01/04/1977; EC 7, de 13/04; EC 8 e DL 1.538, de 14/04; re… | [Emenda Constitucional nº 8, de 14/04/1977 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc_anterior1988/emc08-77.htm) | sim |
| pacote-abril-1977 | regras_de_voto.quem_votava | Sem mudança no eleitorado; mudança na composição do poder. | Sem mudança na idade nem no alistamento; muda a composição do poder: governadores por colégio com delegados das Câmaras Municipais (art. 13, §2º), um dos dois senadores … | [Emenda Constitucional nº 8, de 14/04/1977 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc_anterior1988/emc08-77.htm) | sim |
| pacote-abril-1977 | regras_de_voto.regras_verificado | false | true | [Emenda Constitucional nº 8, de 14/04/1977 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc_anterior1988/emc08-77.htm) | sim |
| pacote-abril-1977 | sistema | Um terço do Senado por eleição indireta (senadores 'biônicos'), eleição indireta de governadores, mandato presidencial de 5 para 6 anos, colégio com delegados de assembl… | Um terço do Senado por eleição indireta (senadores 'biônicos': na renovação de 2/3, uma vaga direta e outra pelo colégio, art. 41, §2º, EC 8), governadores por colégio a… | [Emenda Constitucional nº 8, de 14/04/1977 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc_anterior1988/emc08-77.htm) | sim |
| pacote-abril-1977 | mudancas_de_regra | ["Congresso foi fechado temporariamente (historia.json: 01/04/1977); a página do Pacote registra 13/04/1977 como data do pacote."] | ["Dois eventos distintos, ambos confirmados em texto primário: (1) o Congresso foi posto em recesso pelo Ato Complementar nº 102, de 01/04/1977; (2) o Executivo promulgo… | [Ato Complementar nº 102, de 01/04/1977 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/ACP/acp-102-77.htm) | sim |
| regra-1977 | regra/fonte | Pacote de Abril: senadores biônicos, governadores indiretos, mandato de 6 anos. | Pacote de Abril (recesso de 01/04/1977; EC 7 e 8 e DL 1.538, de 13-14/04/1977): senadores biônicos, colégio ampliado para governadores, mandato de 6 anos, emendas por ma… | [Emenda Constitucional nº 8, de 14/04/1977 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc_anterior1988/emc08-77.htm) | sim |
| geral-1978 | sistema | ARENA 231 e MDB 189 cadeiras na Câmara (a página do MDB registra 228 x 196). Senado: 22 biônicos indiretos e 23 diretos. | ARENA 231 e MDB 189 cadeiras na Câmara (420), segundo Kinzo (1988); Senado: 22 indiretos (EC 8/1977) e 23 diretos (ARENA 15 e MDB 8). A leitura 228 x 196 (página do MDB)… | [Fundação Ulysses Guimarães, 'Número de cadeiras ARENA/MDB 1966 a 1978…](https://acervo.fundacaoulysses.org.br/wp-content/uploads/2022/10/Numero-cadeiras-ARENA-MDB-1966-a-1978.pdf) | sim |
| geral-1978 | nota | Divergência de cadeiras entre páginas (231/189 x 228/196) não resolvida; votos totais não lidos. | Divergência de cadeiras entre páginas (231/189 x 228/196) não resolvida; votos totais não lidos. Divergência 189 x 196 resolvida a favor de 189 (231 + 189 = 420). | [Fundação Ulysses Guimarães, 'Número de cadeiras ARENA/MDB 1966 a 1978…](https://acervo.fundacaoulysses.org.br/wp-content/uploads/2022/10/Numero-cadeiras-ARENA-MDB-1966-a-1978.pdf) | sim |
| ec25-1985 | data | 1985-05 | 1985-05-15 | [Emenda Constitucional nº 25, de 15/05/1985 - Câmara dos Deputados, pu…](https://www2.camara.leg.br/legin/fed/emecon/1980-1987/emendaconstitucional-25-15-maio-1985-364956-publicacaooriginal-1-pl.html) | sim |
| ec25-1985 | regras_de_voto.quem_votava | Analfabetos passaram a poder votar (facultativo); fonte primária (Planalto) não abriu. | EC 25/1985: eleitores com 18 anos ou mais (art. 147); a lei disporia sobre a forma de os analfabetos se alistarem e votarem (art. 147, §4º, regulamentação por lei não li… | [Emenda Constitucional nº 25, de 15/05/1985 - Câmara dos Deputados, pu…](https://www2.camara.leg.br/legin/fed/emecon/1980-1987/emendaconstitucional-25-15-maio-1985-364956-publicacaooriginal-1-pl.html) | sim |
| ec25-1985 | regras_de_voto.idade_minima | (vazio) | 18 | [Emenda Constitucional nº 25, de 15/05/1985 - Câmara dos Deputados, pu…](https://www2.camara.leg.br/legin/fed/emecon/1980-1987/emendaconstitucional-25-15-maio-1985-364956-publicacaooriginal-1-pl.html) | sim |
| ec25-1985 | regras_de_voto.regras_verificado | false | true | [Emenda Constitucional nº 25, de 15/05/1985 - Câmara dos Deputados, pu…](https://www2.camara.leg.br/legin/fed/emecon/1980-1987/emendaconstitucional-25-15-maio-1985-364956-publicacaooriginal-1-pl.html) | sim |
| ec25-1985 | mudancas_de_regra[1] | A data exata e o conteúdo completo da EC 25 não foram lidos. | Texto lido: o art. 147, §4º da EC 25 remete à lei a forma de alistamento e voto dos analfabetos; a Lei 7.332, de 01/07/1985 (lida), o regulamenta no art. 18 (quem não so… | [Emenda Constitucional nº 25, de 15/05/1985 - Câmara dos Deputados, pu…](https://www2.camara.leg.br/legin/fed/emecon/1980-1987/emendaconstitucional-25-15-maio-1985-364956-publicacaooriginal-1-pl.html) | sim |
| ec25-1985 | mudancas_de_regra[+] | (vazio) | Eleições municipais de 15/11/1985: prefeito e vice nas capitais, estâncias hidrominerais, municípios de segurança nacional e de territórios, e prefeito, vice e vereadore… | [Lei nº 7.332, de 01/07/1985 - Câmara dos Deputados, publicação origin…](https://www2.camara.leg.br/legin/fed/lei/1980-1987/lei-7332-1-julho-1985-367981-publicacaooriginal-1-pl.html) | sim |
| regra-1985 | regra/fonte | EC 25: voto do analfabeto. | EC 25 (15/05/1985): eleição direta do presidente em 2 turnos, eleitor de 18 anos, e a lei passa a dispor sobre alistamento e voto dos analfabetos (Lei 7.332, de 01/07/19… | [Emenda Constitucional nº 25, de 15/05/1985 - Câmara dos Deputados, pu…](https://www2.camara.leg.br/legin/fed/emecon/1980-1987/emendaconstitucional-25-15-maio-1985-364956-publicacaooriginal-1-pl.html) | sim |
| const-1986 | regras_de_voto.regras_verificado | false | true | [Emenda Constitucional nº 25, de 15/05/1985 - Câmara dos Deputados, pu…](https://www2.camara.leg.br/legin/fed/emecon/1980-1987/emendaconstitucional-25-15-maio-1985-364956-publicacaooriginal-1-pl.html) | sim |
| cf-1988 | regras_de_voto.quem_votava | Voto obrigatório para alfabetizados de 18 a 70 anos (regra geral); facultativo para analfabetos, 16-17 anos e maiores de 70. | Alistamento e voto obrigatórios para os maiores de 18 anos; facultativos para os analfabetos, os maiores de 70 anos e os maiores de 16 e menores de 18 (CF/1988, art. 14,… | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| cf-1988 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| cf-1988 | sistema | Segundo turno (a página 'Eleições no Brasil' o data de 1988); a regra dos 200 mil eleitores para municípios não foi lida em lei. | Dois turnos para presidente (art. 77). A regra de segundo turno para prefeitos de municípios com mais de 200 mil eleitores não é de 1988: entrou no art. 29, II, pela EC … | [Emenda Constitucional nº 16, de 04/06/1997 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc16.htm) | sim |
| cf-1988 | mudancas_de_regra[0] | Redução da idade de voto para 16 anos facultativa (Nicolau e 'Eleições no Brasil'); a faixa dos 70 anos e a obrigatoriedade a partir de 18 foram citadas de memória. | Voto facultativo aos 16 e 17 anos (art. 14, §1º, II, c), lido no Planalto; Nicolau registra a mudança como a única de idade desde 1945. | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| regra-1988 | regra/fonte | Constituição: voto aos 16 anos (facultativo) e segundo turno. | Constituição: voto facultativo aos 16 e 17 anos, aos analfabetos e aos maiores de 70; obrigatório de 18 a 70 anos (art. 14, §1º); segundo turno presidencial (art. 77). | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| pres-1989 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| plebiscito-1993 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| pres-1994 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| urna-1996 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| pres-1998 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| pres-2002 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| pres-2006 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| pres-2010 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| pres-2014 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| municipal-2016 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| pres-2018 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| municipal-2020 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| pres-2022-t1 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| pres-2022-t2 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| municipal-2024 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| pres-2026-t1 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| ec16-1997 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| ec97-fefc-2017 | regras_de_voto.regras_verificado | false | true | [Constituição Federal de 1988, texto compilado - Planalto (art. 14 lid…](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) | sim |
| plebiscito-1993 | eleitorado.valor | 90256552 | 90256461 | [TSE, 'Plebiscito sobre forma e sistema de governo completa 20 anos' (…](https://www.tse.jus.br/comunicacao/noticias/2013/Abril/plebiscito-sobre-forma-e-sistema-de-governo-completa-20-anos) | sim |
| plebiscito-1993 | comparecimento.valor | 66226966 | 66209385 | [TSE, 'Plebiscito sobre forma e sistema de governo completa 20 anos' (…](https://www.tse.jus.br/comunicacao/noticias/2013/Abril/plebiscito-sobre-forma-e-sistema-de-governo-completa-20-anos) | sim |
| plebiscito-1993 | comparecimento.pct | 73.38 | 73.36 | [TSE, 'Plebiscito sobre forma e sistema de governo completa 20 anos' (…](https://www.tse.jus.br/comunicacao/noticias/2013/Abril/plebiscito-sobre-forma-e-sistema-de-governo-completa-20-anos) | sim |
| plebiscito-1993 | nota | (vazio) | Percentuais dos resultados são sobre votos válidos (cálculo nosso, coerente com o TSE: 66,28% e 10,26% do comparecimento para República e Monarquia). | [TSE, 'Plebiscito sobre forma e sistema de governo completa 20 anos' (…](https://www.tse.jus.br/comunicacao/noticias/2013/Abril/plebiscito-sobre-forma-e-sistema-de-governo-completa-20-anos) | sim |
| regra-1993 | efeito_no_eleitorado/fonte | Eleitorado de 90,26 milhões; comparecimento de 73,38%. | Eleitorado de 90,26 milhões; comparecimento de 73,36% (TSE). | [TSE, 'Plebiscito sobre forma e sistema de governo completa 20 anos' (…](https://www.tse.jus.br/comunicacao/noticias/2013/Abril/plebiscito-sobre-forma-e-sistema-de-governo-completa-20-anos) | sim |
| pres-1994 | eleitorado.valor | 94782803 | 94710636 | [TSE, Dados abertos: votacao_candidato_munzona_1994 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1994.zip) | sim |
| pres-1994 | comparecimento.valor | 77948464 | 77920633 | [TSE, Dados abertos: votacao_candidato_munzona_1994 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1994.zip) | sim |
| pres-1994 | comparecimento.pct | 82.23 | 82.27 | [TSE, Dados abertos: votacao_candidato_munzona_1994 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1994.zip) | sim |
| pres-1994 | resultados[Fernando Henrique].votos | 34364961 | 34350217 | [TSE, Dados abertos: votacao_candidato_munzona_1994 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1994.zip) | sim |
| pres-1994 | resultados[Lula].votos | 17122127 | 17112255 | [TSE, Dados abertos: votacao_candidato_munzona_1994 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1994.zip) | sim |
| pres-1994 | resultados[Enéas].votos | 4671457 | 4670894 | [TSE, Dados abertos: votacao_candidato_munzona_1994 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1994.zip) | sim |
| pres-1994 | resultados[Orestes].votos | 2772121 | 2771788 | [TSE, Dados abertos: votacao_candidato_munzona_1994 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1994.zip) | sim |
| pres-1994 | resultados[Leonel].votos | 2015836 | 2015284 | [TSE, Dados abertos: votacao_candidato_munzona_1994 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1994.zip) | sim |
| pres-1998 | eleitorado.valor | 106101067 | 106100575 | [TSE, Dados abertos: votacao_candidato_munzona_1998 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1998.zip) | sim |
| pres-1998 | comparecimento.valor | (vazio) | 83297773 | [TSE, Dados abertos: votacao_candidato_munzona_1998 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1998.zip) | sim |
| pres-2006 | eleitorado.valor | 125913134 | 125913235 | [TSE, Dados abertos: votacao_candidato_munzona_2006 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_2006.zip) | sim |
| pres-2018 | eleitorado.valor | 147306294 | 147306295 | [TSE, Dados abertos: votacao_candidato_munzona_2018 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_2018.zip) | sim |
| pres-2022-t1 | eleitorado.valor | 156453354 | 156454011 | [TSE, Dados abertos: detalhe_votacao_secao_2022, votacao_secao_2022_BR…](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2022.zip) | sim |
| pres-2022-t1 | comparecimento.pct | (vazio) | 79.05 | [TSE, Dados abertos: detalhe_votacao_secao_2022, votacao_secao_2022_BR…](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2022.zip) | sim |
| pres-2022-t2 | eleitorado.valor | 156453354 | 156454011 | [TSE, Dados abertos: detalhe_votacao_secao_2022, votacao_secao_2022_BR…](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2022.zip) | sim |
| pres-2022-t2 | comparecimento.pct | (vazio) | 79.42 | [TSE, Dados abertos: detalhe_votacao_secao_2022, votacao_secao_2022_BR…](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2022.zip) | sim |
| pres-2022-t1 | resultados[Simone].votos | 4902256 | 4915423 | [TSE, Dados abertos: detalhe_votacao_secao_2022, votacao_secao_2022_BR…](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2022.zip) | sim |
| pres-2022-t1 | resultados[Ciro].votos | 3585946 | 3599287 | [TSE, Dados abertos: detalhe_votacao_secao_2022, votacao_secao_2022_BR…](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2022.zip) | sim |
| pres-2022-t1 | resultados[Lula/Bolsonaro] | (vazio) | 57.259.504 e 51.072.345 (inalterados) | [TSE, Dados abertos: detalhe_votacao_secao_2022, votacao_secao_2022_BR…](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2022.zip) | sim |
| pres-2026-t1 | eleitorado.tipo/fonte | eleitores inscritos (Wikipédia; repositório soma 157.824.642 nos municípios) | eleitores aptos (TSE, snapshot 05/10/2026; inclui 916.534 no exterior; repositório soma 157.824.642 nos municípios) | [TSE, Dados abertos: detalhe_votacao_secao_2026 e votacao_secao_2026_B…](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2026.zip) | sim |
| pres-2026-t1 | comparecimento.pct | (vazio) | 78.92 | [TSE, Dados abertos: detalhe_votacao_secao_2026 e votacao_secao_2026_B…](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2026.zip) | sim |
| pres-2026-t1 | resultados[Augusto].votos/pct | {"votos": 3438747, "pct": 2.89} | {"votos": 3448569, "pct": 2.89} | [TSE, Dados abertos: detalhe_votacao_secao_2026 e votacao_secao_2026_B…](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2026.zip) | sim |
| pres-2026-t1 | resultados[Renan].votos/pct | {"votos": 2667248, "pct": 2.24} | {"votos": 2675887, "pct": 2.24} | [TSE, Dados abertos: detalhe_votacao_secao_2026 e votacao_secao_2026_B…](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2026.zip) | sim |
| pres-2026-t1 | resultados[Ronaldo].votos/pct | {"votos": 2600412, "pct": 2.19} | {"votos": 2605148, "pct": 2.18} | [TSE, Dados abertos: detalhe_votacao_secao_2026 e votacao_secao_2026_B…](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2026.zip) | sim |
| pres-2026-t1 | resultados[Flávio/Lula] | (vazio) | 56.104.503 e 53.879.538 (inalterados) | [TSE, Dados abertos: detalhe_votacao_secao_2026 e votacao_secao_2026_B…](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2026.zip) | sim |
| urna-1996 | data | 1996-10-06 | 1996-10-03 | [Lei nº 9.100, de 29/09/1995 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/leis/l9100.htm) | sim |
| urna-1996 | eleitorado.valor | 32000000 | 100169609 | [TSE, Dados abertos: votacao_candidato_munzona_1996 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1996.zip) | sim |
| urna-1996 | comparecimento | {} | {"valor": 80820951, "pct": 80.68, "pct_populacao": null, "fonte": "TSE, Dados abertos: detalhe_votacao_munzona_1996 (leitura em 07/10/2026)", "url": "https://cdn.tse.jus… | [TSE, Dados abertos: votacao_candidato_munzona_1996 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1996.zip) | sim |
| urna-1996 | mudancas_de_regra[0] | 1998: 537 municípios com mais de 40 mil eleitores (75% do eleitorado) e, em 2000, todo o país (resumo de busca; páginas TSE e TRE-PR retornaram 403). | TSE (notícia lida): em 2000 as urnas chegaram a todo o país, no primeiro pleito totalmente informatizado. 1998: 537 municípios com mais de 40 mil eleitores (75% do eleit… | [TSE, 'Urna eletrônica 25 anos' (notícia lida)](https://www.tse.jus.br/comunicacao/noticias/2021/Maio/urna-eletronica-25-anos-lancado-em-1996-equipamento-e-o-protagonista-da-maior-eleicao-informatizada-do-mundo) | sim |
| regra-1996 | regra/efeito/fonte | Urna eletrônica (57 municípios); 2000 em todo o país. | Urna eletrônica em 57 cidades (eleição municipal de 03/10/1996, Lei 9.100/1995); em 2000, em todo o país (TSE). | [TSE, 'Urna eletrônica 25 anos' (notícia lida)](https://www.tse.jus.br/comunicacao/noticias/2021/Maio/urna-eletronica-25-anos-lancado-em-1996-equipamento-e-o-protagonista-da-maior-eleicao-informatizada-do-mundo) | sim |
| ec16-1997 | mudancas_de_regra[0] | Data da EC vem de historia.json; a página da eleição de 1998 confirma a emenda 'aprovada pouco antes da eleição'. Texto da emenda (Planalto) não abriu. | Texto lido (Planalto): EC 16, de 04/06/1997, dá nova redação ao art. 14, §5º (reeleição para presidente, governadores e prefeitos por um período), aos arts. 28, 29, II, … | [Emenda Constitucional nº 16, de 04/06/1997 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc16.htm) | sim |
| regra-1997 | fonte | Eleição presidencial de 1998 - Wikipédia (secundária) | Emenda Constitucional nº 16, de 04/06/1997 - Planalto (texto lido) | [Emenda Constitucional nº 16, de 04/06/1997 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc16.htm) | sim |
| ec97-fefc-2017 | sistema | Cláusula de desempenho: 1,5% (2018), 2% (2022), 2,5% (2026), 3% (2030) dos votos válidos, ou 15 deputados em 1/3 das UFs. Fim das coligações em eleições proporcionais a … | Cláusula de desempenho (EC 97, art. 3º, texto lido): para ter fundo partidário e tempo de rádio e TV, os partidos precisam, após as eleições de 2018, de 1,5% dos votos v… | [Emenda Constitucional nº 97, de 04/10/2017 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc97.htm) | sim |
| ec97-fefc-2017 | mudancas_de_regra[0] | Lei sancionada em 06/10/2017 (FEFC); a EC 97 foi lida pelas páginas de cláusula de barreira e de eleições municipais de 2020; o texto no Planalto não abriu. | EC 97 promulgada em 04/10/2017 (Planalto, lida); Lei 13.487 sancionada em 06/10/2017 (Planalto, lida) instituiu o FEFC. Valores do FEFC: R$ 1,716 bi (2018), R$ 2,035 bi … | [Emenda Constitucional nº 97, de 04/10/2017 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc97.htm) | sim |
| regra-2017 | regra/fonte | Lei 13.487 (FEFC) e EC 97: fim das coligações proporcionais (2020) e cláusula de desempenho. | EC 97 (04/10/2017) e Lei 13.487 (06/10/2017): fim das coligações proporcionais (2020), cláusula de desempenho gradual (1,5% em 2018 a 3% em 2030) e FEFC. | [Emenda Constitucional nº 97, de 04/10/2017 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc97.htm) | sim |
| municipal-2020 | fontes[+] | (vazio) | Emenda Constitucional nº 107, de 02/07/2020 - Planalto (texto lido) | [Emenda Constitucional nº 107, de 02/07/2020 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc107.htm) | sim |
| regra-2021 | fonte | Federação partidária - Wikipédia (secundária) | Lei nº 14.208, de 28/09/2021 (federações) - Planalto (texto lido) | [Lei nº 14.208, de 28/09/2021 (federações) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14208.htm) | sim |
| municipal-2016 | eleitorado/comparecimento | {} | {"eleitorado": 144088912, "comparecimento": 118757780} | [TSE, Dados abertos: perfil_eleitorado_2016 (soma de QT_ELEITORES_PERF…](https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitorado/perfil_eleitorado_2016.zip) | sim |
| municipal-2020 | eleitorado | {"valor": 147918483, "pct_populacao": null, "tipo": "eleitores inscritos", "fonte": "Eleições municipais de 2020 - Wikipédia (secundária)", "url": "https://pt.wikipedia.… | {"valor": 147918483, "pct_populacao": null, "tipo": "eleitores aptos (TSE)", "fonte": "TSE, Dados abertos: perfil_eleitorado_2020 (soma de QT_ELEITORES_PERFIL)", "url": … | [TSE, Dados abertos: perfil_eleitorado_2020 (soma de QT_ELEITORES_PERF…](https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitorado/perfil_eleitorado_2020.zip) | sim |
| municipal-2020 | comparecimento | {} | {"valor": 113734114, "pct": 76.89, "pct_populacao": null, "fonte": "TSE, Dados abertos: detalhe_votacao_munzona_2020 (vereador, 1º turno)", "url": "https://cdn.tse.jus.b… | [TSE, Dados abertos: perfil_eleitorado_2020 (soma de QT_ELEITORES_PERF…](https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitorado/perfil_eleitorado_2020.zip) | sim |
| municipal-2024 | eleitorado | {"valor": null, "pct_populacao": null, "tipo": "n/d", "fonte": "2024 Brazilian municipal elections - Wikipedia (secundária; eleitorado diverge, ver 'limites')", "url": "… | {"valor": 155912680, "pct_populacao": null, "tipo": "eleitores aptos (TSE)", "fonte": "TSE, Dados abertos: perfil_eleitorado_2024 (soma de QT_ELEITORES_PERFIL) (arquivo … | [TSE, Dados abertos: perfil_eleitorado_2024 (soma de QT_ELEITORES_PERF…](https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitorado/perfil_eleitorado_2024.zip) | sim |
| municipal-2024 | comparecimento | {} | {"valor": 122132791, "pct": 78.33, "pct_populacao": null, "fonte": "TSE, Dados abertos: detalhe_votacao_munzona_2024 (vereador, 1º turno)", "url": "https://cdn.tse.jus.b… | [TSE, Dados abertos: perfil_eleitorado_2024 (soma de QT_ELEITORES_PERF…](https://cdn.tse.jus.br/estatistica/sead/odsele/perfil_eleitorado/perfil_eleitorado_2024.zip) | sim |
| municipal-2024 | nota | (vazio) | A coluna 'votos' traz número de prefeituras (Wikipédia). Conferência com o TSE (consulta_cand_2024, snapshot 07/10/2026): entre 5.530 prefeitos com situação 'ELEITO', PS… | [TSE, Dados abertos: consulta_cand_2024](https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2024.zip) | sim |
| abolicionismo | controversias | Disputado: o grau de iniciativa dos escravizados versus a elite parlamentar; a carta atribuída à Princesa Isabel (11/08/1889) sobre indenização tem autenticidade questio… | Disputado: o grau de iniciativa dos escravizados versus a elite parlamentar; a carta de 11/08/1889 atribuída à Princesa Isabel ao Visconde de Santa Vitória (compensação … | [Fundação Casa de Rui Barbosa. 'Rui Barbosa e a queima dos arquivos' (…](https://www.gov.br/casaruibarbosa/pt-br/centrais-de-conteudo/publicacoes/pdfs/rui-barbosa-e-a-queima-dos-arquivos-ocr.pdf) | sim |
| getulismo-ptb | origem | Justiça do Trabalho (01/05/1939) | Justiça do Trabalho (Decreto-Lei 1.237, de 02/05/1939) | [Decreto-Lei nº 1.237, de 02/05/1939 (Justiça do Trabalho) - Planalto …](https://www.planalto.gov.br/ccivil_03/decreto-lei/1937-1946/del1237.htm) | sim |
| getulismo-ptb | como_se_construiu[0] | 1939-05-01: Justiça do Trabalho. | 1939-05-02: Justiça do Trabalho organizada pelo Decreto-Lei 1.237. | [Decreto-Lei nº 1.237, de 02/05/1939 (Justiça do Trabalho) - Planalto …](https://www.planalto.gov.br/ccivil_03/decreto-lei/1937-1946/del1237.htm) | sim |
| jk-desenvolvimentismo | organizacao[1] | Estatais: Eletrobrás, CSN, UnB | Instituições associadas ao período: Eletrobrás (autorizada pela Lei 3.890-A, de 25/04/1961, já depois do mandato de JK), CSN (anterior a JK, dado de memória) e UnB (fund… | [Lei nº 3.890-A, de 25/04/1961 (Eletrobrás) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/leis/L3890Acons.htm) | sim |
| marcha-familia-1964 | controversias | Disputado: peso dos EUA e do IBAD/IPES; a página lida afirma que o padre Patrick Peyton seria agente da CIA mobilizando católicos (alegação de fonte secundária, sem prov… | Disputado: peso dos EUA e do IBAD/IPES; sobre o padre Patrick Peyton, o artigo acadêmico lido (Estudos Históricos, 2024) mostra, em documento da CIA (reunião de 23/11/19… | [Rosários contra o comunismo: Patrick Peyton e a Family Rosary Crusade…](https://www.scielo.br/j/eh/a/PfgjvLy6S6L87bKbc4fBYYf/?lang=pt) | sim |
| marcha-familia-1964 | financiamento_e_regras | IBAD/ADEP financiaram candidatos anti-Goulart em 1962 (ibad); recursos externos alegados, valor não conferido. Marcha: financiamento Não verificado nesta rodada. | IBAD/ADEP financiaram candidatos anti-Goulart em 1962 (ibad); o embaixador Gordon estimou cerca de US$ 5 milhões de recursos norte-americanos a candidatos em 1962 (entre… | [Nóbrega, C. H. S. 'As eleições de 1962' (monografia UFRJ, 2019; cita …](https://pantheon.ufrj.br/bitstream/11422/16980/1/CHSNobrega.pdf) | sim |
| mdb-oposicao | viradas[1] | 1977-04-13: Pacote de Abril. | 1977-04-14: Pacote de Abril: EC 8 e DL 1.538 ... | [Emenda Constitucional nº 8, de 14/04/1977 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc_anterior1988/emc08-77.htm) | sim |
| mdb-oposicao | como_se_construiu[6] | 1977-04-13: Pacote de Abril. | 1977-04-14: Pacote de Abril (EC 8 e DL 1.538; recesso desde 01/04). | [Emenda Constitucional nº 8, de 14/04/1977 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc_anterior1988/emc08-77.htm) | sim |
| mdb-oposicao | controversias | Disputado: se a 'oposição consentida' legitimou ou desgastou o regime; o peso do voto de protesto (cerca de 30% de nulos e brancos em 1970, leitura única). Divergência n… | Disputado: se a 'oposição consentida' legitimou ou desgastou o regime; o peso do voto de protesto (cerca de 30% de nulos e brancos na Câmara em 1970, confirmado em tabel… | [Fundação Ulysses Guimarães, 'Número de cadeiras ARENA/MDB 1966 a 1978…](https://acervo.fundacaoulysses.org.br/wp-content/uploads/2022/10/Numero-cadeiras-ARENA-MDB-1966-a-1978.pdf) | sim |
| mst | viradas[Eldorado].fato | Massacre de Eldorado dos Carajás: a página lida fala em 21 mortos (outras fontes registram 19 no local; divergência). | Massacre de Eldorado dos Carajás: 19 trabalhadores sem terra mortos no local ou logo após, 69 feridos e mais dois feridos que morreram depois, totalizando 21 (Anistia In… | [Amnesty International, 'The Eldorado dos Carajás massacre: 20 years o…](https://www.amnesty.org/en/latest/press-release/2016/04/the-eldorado-dos-carajas-massacre-20-years-of-impunity-and-violence-in-brazil/) | sim |
| evangelicos | origem | a FPE foi formalizada em 18/09/2003 | a FPE foi fundada em 18/09/2003 e registrada formalmente na Câmara em 09/09/2015 (REVES, 2024) | [Engler, Portugal e Araújo. 'A Bancada Evangélica eleita em 2022', REV…](https://periodicos.ufv.br/reves/article/download/19054/9811/85188) | sim |
| evangelicos | controversias | Disputado: o que é 'bancada evangélica' (filiação à frente, identidade religiosa ou ligação com igreja), por isso há contagens de 96, 102+13 e 209+26; o 'voto evangélico… | Disputado: o que é 'bancada evangélica' (filiação à frente, identidade religiosa ou ligação com igreja), por isso há várias contagens: DIAP, 75 deputados eleitos em 2022… | [Engler, Portugal e Araújo. 'A Bancada Evangélica eleita em 2022', REV…](https://periodicos.ufv.br/reves/article/download/19054/9811/85188) | sim |
| evangelicos | viradas[2023].fato | 209 deputados e 26 senadores registrados na frente (FPE); outra contagem (ISER): 102 deputados e 13 senadores identificados como evangélicos em 2022. | 209 deputados e 26 senadores registrados na frente (FPE); outra contagem (ISER): 102 deputados e 13 senadores identificados como evangélicos em 2022. DIAP: 75 deputados … | [Engler, Portugal e Araújo. 'A Bancada Evangélica eleita em 2022', REV…](https://periodicos.ufv.br/reves/article/download/19054/9811/85188) | sim |
| evangelicos | resultado_eleitoral[pres-2022-t1] | Sem votação própria medida; parlamentares: 96 a 115 eleitos conforme contagem. | Sem votação própria medida; deputados: 75 (DIAP, lido), 96 (ISER) ou 102 (bancada), mais 13 senadores na contagem da bancada; ver controvérsias. | [Engler, Portugal e Araújo. 'A Bancada Evangélica eleita em 2022', REV…](https://periodicos.ufv.br/reves/article/download/19054/9811/85188) | não |
| evangelicos | base_social | (censo_relig; leitura de resumo) | (censo_relig; reportagem lida que cita o IBGE: 26,9% em 2022 e 21,6% em 2010; o IBGE não foi aberto) | [Congresso em Foco, 'Censo 2022: 1 em 4 brasileiros é evangélico' (imp…](https://www.congressoemfoco.com.br/noticia/109200/censo-2022-1-em-4-brasileiros-e-evangelico-catolicos-caem-para-56-7) | não |
| ruralista | organizacao[0] | UDR (1985-88) | UDR (fundada em 1985; atuação na Constituinte de 1987-88) | [Agência FPA, 'FPA chega ao número histórico de 50 membros no Senado' …](https://agencia.fpagropecuaria.org.br/2023/07/12/fpa-chega-ao-numero-historico-de-50-membros-no-senado) | não |
| ruralista | financiamento_e_regras | Doações de empresas do agro: dissertação de Sakamoto liga doações de empresas acusadas de trabalho escravo à eleição de dois governadores e cinco deputados (fpa). FPA es… | Doações de empresas do agro: dissertação de Sakamoto liga doações de empresas acusadas de trabalho escravo à eleição de dois governadores e cinco deputados (fpa). FPA: 5… | [Agência FPA, 'FPA chega ao número histórico de 50 membros no Senado' …](https://agencia.fpagropecuaria.org.br/2023/07/12/fpa-chega-ao-numero-historico-de-50-membros-no-senado) | sim |
| lulismo | aliancas_e_rupturas[1] | restauração em 01/01/2023 (bolsafam) | restauração do Bolsa Família pela MP 1.164, de 02/03/2023 (Lei 14.601, de 19/06/2023); a MP 1.155, de 01/01/2023, só criou um adicional complementar ao Auxílio Brasil | [Medida Provisória nº 1.164, de 02/03/2023 (Bolsa Família) - Planalto …](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/mpv/mpv1164.htm) | sim |
| bolsonarismo | aliancas_e_rupturas[0] | Federação com PRTB em 2018 | Coligação com PRTB em 2018 (federações partidárias só existem desde a Lei 14.208/2021) | [Lei nº 14.208, de 28/09/2021 (federações) - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14208.htm) | sim |
| municipais-2024-gerais-2026 | base_social | Eleitorado em 2026: 158.745.502 inscritos segundo a página; repositório soma 157.824.642 nos municípios (sem exterior). | Eleitorado em 2026: 158.745.502 aptos (TSE, detalhe_votacao_secao_2026, snapshot 05/10/2026), dos quais 916.534 no exterior; o repositório soma 157.824.642 nos município… | [TSE, Dados abertos: detalhe_votacao_secao_2026 e votacao_secao_2026_B…](https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2026.zip) | sim |
| sufragismo-feminino | financiamento_e_regras | Regra: Código Eleitoral de 24/02/1932 (Decreto 21.076) definiu eleitores como cidadãos maiores de 21 anos sem distinção de sexo (sufragio_fem, cod1932). | Regra: Código Eleitoral de 24/02/1932 (Decreto 21.076, art. 2º) definiu eleitores como cidadãos maiores de 21 anos sem distinção de sexo, mas mulheres podiam isentar-se … | [Decreto nº 21.076, de 24/02/1932 (Código Eleitoral) - Planalto (texto…](https://www.planalto.gov.br/ccivil_03/decreto/1930-1949/d21076.htm) | sim |
| sufragismo-feminino | aliancas_e_rupturas | Constituição de 1934 manteve obrigatoriedade só para funcionárias; o Código de 1965 igualou deveres (sufragio_fem) | CF/1934 (art. 109) manteve obrigatoriedade para homens e só para funcionárias públicas entre as mulheres; o Código de 1965 (art. 6º) igualou deveres (textos lidos). | [Constituição de 1934 - Planalto (texto lido)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao34.htm) | sim |
| sufragismo-feminino | viradas[1945].fato | Alistamento passou a ser obrigatório para todas as mulheres (Nicolau). | Alistamento obrigatório para mulheres com profissão lucrativa (DL 7.586/1945, art. 4º, g, lido); as demais seguiam dispensadas. Nicolau escreve 'obrigatório para todas a… | [Decreto-Lei nº 7.586, de 28/05/1945 (Lei Agamenon) - Planalto (texto …](https://www.planalto.gov.br/ccivil_03/decreto-lei/1937-1946/del7586.htm) | sim |
| sufragismo-feminino | como_se_construiu[2,6,7] | (vazio) | Passos 2, 6 e 7 reescritos | [TSE, 'Dia da Conquista do Voto Feminino no Brasil' (notícia lida)](https://www.tse.jus.br/imprensa/noticias-tse/2020/Fevereiro/dia-da-conquista-do-voto-feminino-no-brasil-e-comemorado-nesta-segunda-24-1) | sim |
| real-psdb-pfl | resultado_eleitoral[pres-1994] | FHC 34.364.961 (54,28%). | FHC 34.350.217 (54,28%), segundo o arquivo atual do TSE. | [TSE, Dados abertos: votacao_candidato_munzona_1994 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1994.zip) | sim |
| sindicalismo-abc-pt | resultado_eleitoral[pres-1994] | Lula 17.122.127 (27,04%). | Lula 17.112.255 (27,04%), segundo o arquivo atual do TSE. | [TSE, Dados abertos: votacao_candidato_munzona_1994 (arquivo BR) e det…](https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_1994.zip) | sim |

Alterações em `historia.json` (`meta.revisao`):

| Id | Campo | Antes | Depois | Fonte | Verificado |
|---|---|---|---|---|---|
| pacote-1977 | data | 1977-04-01 | 1977-04-14 | [Ato Complementar nº 102, de 01/04/1977 - Planalto](https://www.planalto.gov.br/ccivil_03/ACP/acp-102-77.htm) | sim |
| pacote-1977 | resumo | Geisel fecha o Congresso (1º/04/1977) e decreta reformas: mandato presidencial de 6 anos, senadores biônicos, mudança de quórum de emendas, Lei Falcão. | Geisel pôs o Congresso em recesso em 01/04/1977 (Ato Complementar 102) e, durante o recesso, promulgou a EC 7 (13/04, Judiciário), a EC 8 e o Decreto-Lei 1.538 (14/04): … | [Emenda Constitucional nº 8, de 14/04/1977 - Planalto](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc_anterior1988/emc08-77.htm) | sim |
| pacote-1977 | controversias | — | Datas: a Wikipédia dá 13/04/1977 para o pacote; os textos primários mostram 01/04 (recesso), 13/04 (EC 7), 14/04 (EC 8 e DL 1.538) e 15/04 (fim do recesso). | [Ato Complementar nº 103, de 14/04/1977 - Planalto](https://www.planalto.gov.br/ccivil_03/ACP/acp-103-77.htm) | sim |
| c1934 | resumo | Cria Justiça Eleitoral e Justiça do Trabalho, voto feminino, mandado de segurança, ação popular; Senado reduzido a órgão de colaboração; art. 129 respeita a posse de ter… | Constitucionaliza a Justiça Eleitoral (criada pelo Código Eleitoral de 1932; arts. 82-83) e institui a Justiça do Trabalho (art. 122); voto feminino (art. 108), mandado … | [Constituição de 1934 - Planalto (arts. 82, 108, 122 lidos)](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao34.htm) | sim |

### Divergências do primeiro agente: o que se resolveu e o que não

| Item | Leituras encontradas | Decisão | Fonte decisiva | Estado |
|---|---|---|---|---|
| 1930, votos de Vargas | 742.794 (Wikipédia, eleição; ALESP) x 742.797 (Wikipédia, Revolução) | 742.794 | ALESP, página lida | Resolvido por maioria de duas leituras; sem fonte oficial aberta |
| 1930, percentual de Prestes | 57,7% (CPDOC) x 59,39% (Wikipédia) | Mantido 59,39% com nota; CPDOC citado | CPDOC/FGV, verbete lido | **Em aberto**: nenhuma das bases é reproduzível (57,45% sobre votantes; 59,51% sobre Prestes+Vargas) |
| 1974, cadeiras do MDB | 160 (Kinzo; página da eleição), 161 (TSE v. 11 via Pecoraro), 165 (página do MDB) | Três leituras registradas; votos da Câmara trocados pelos do TSE v. 11 | Kinzo e Pecoraro lidos | **Em aberto**; 165 sem fonte aberta |
| 1978, cadeiras do MDB | 189 x 196 | 189 (231 + 189 = 420) | EC 8/1977, art. 39 (até 420 cadeiras) e Kinzo | Resolvido: 196 não fecha com o total |
| 1998, votos de FHC | 35.936.382 (pt.wikipedia) x 35.936.540 (en.wikipedia) | 35.936.382 | TSE, `votacao_candidato_munzona_1998` atual; a outra é a versão de 2005 (Georgetown PDBA, lida) | Resolvido |
| Pacote de Abril | Decreto de 13/04/1977 x recesso de 01/04/1977 | Dois eventos: recesso (AC 102, 01/04), EC 7 (13/04), EC 8 e DL 1.538 (14/04), fim do recesso (AC 103, 14/04, efeito 15/04) | Planalto, textos lidos | Resolvido; `historia.json` corrigido |
| Eldorado dos Carajás | 21 x 19 mortos | Ambos corretos: 19 no local e mais 2 feridos que morreram depois (21) | Anistia Internacional, lida | Resolvido |
| Bancada evangélica | 96, 102+13, 209+26 | Contagens por critérios distintos: DIAP 75 deputados (cargo em igreja, cantores gospel, fé ou voto alinhado); ISER 96; bancada 102+13; Frente 209+26 (Wikipédia) ou 238 na lista do Congresso, com assinantes não evangélicos; Frente fundada em 18/09/2003 e registrada em 09/09/2015 | REVES/UFV 2024, lido | Resolvido como definição; não há 'o' número |
| Bancada ruralista, 324 de 513 | 324 (FPA, Wikipédia); 290-324 em 2023; 300 + 44 na posse de Lupion | 324 é autodeclaração da própria frente; 50 senadores confirmados pela Agência FPA em 12/07/2023 | Agência FPA, lida | **Em aberto** quanto aos deputados (sem lista da Câmara lida) |
| IBAD e US$ 5 milhões | 'Gordon repassou US$ 5 milhões' x CPI sem valores | US$ 5 milhões é estimativa do embaixador em entrevistas (Veja, 09/03/1977; 2002); CPI do IBAD registrou cruzeiros (cerca de Cr$ 5 bilhões); ADEP é de março de 1962 | Monografia UFRJ 2019, lida (cita CPI e entrevistas) | Reclassificado: estimativa, não documento |
| Marcha da Família e Peyton/CIA | 'Peyton seria agente da CIA' | O artigo acadêmico documenta proposta de Peter Grace a Dulles (23/11/1960) e menciona intermediação do financiamento ('teria', via biografia); não sustenta 'agente'; ligação da Cruzada de 1962 com as Marchas é de continuidade | Estudos Históricos 2024, lido | Rebaixado a alegação de fonte secundária |
| Carta da Princesa Isabel (11/08/1889) | 'autenticidade questionada' | Original no Museu Imperial; a dúvida sobre autenticidade aparece só em reportagem (Jornal Opção), que reconhece a caligrafia da princesa; a controvérsia verificável é o significado | Jornal Opção, lida | **Em aberto**; sem fonte acadêmica |
| Queima de arquivos de Rui Barbosa | 14/12/1890 | Despacho de Rui Barbosa, de 14/12/1890, executado pela Circular nº 29 de 13/05/1891; leituras de finalidade (bloquear indenizações x perder memória) mantidas | Fundação Casa de Rui Barbosa (1988), lida | Data confirmada; controvérsia mantida |
| Plebiscito de 1963 | sem número lido | Não 9.457.448 (82,02% dos válidos) e Sim 2.073.582; o TSE chama de referendo (LC 2/1962) | Reportagem (Migalhas) e Agência Senado, lidas; PDF do TSE não abriu | Parcialmente resolvido |
| Eleições municipais de 1985 a 1996 | não lidas | 1985: EC 25, art. 2º e Lei 7.332/1985 (prefeitos de 15/11/1985); 1996: 03/10/1996, 100.169.609 aptos, 80.820.951 comparecimentos (TSE); 1988 e 1992 não lidas | Câmara e dados abertos do TSE | Parcial |
| Lei Agamenon e Código de 1950 | não lidos | Lidos no Planalto; 'cédula única' não aparece no Código de 1950 | Planalto | Resolvido |
| Urna eletrônica | 1996/1998/2000 | 1996: 57 cidades, mais de 32 milhões de eleitores, 70 mil urnas; 2000: todo o país (TSE); 1998 (537 municípios) segue sem fonte aberta | TSE, notícia lida | Parcial |
| Eleitorado de 2024 | 147.918.483 (en.wikipedia, igual a 2020) | 155.912.680 | TSE, perfil_eleitorado_2024 (repositório) | Resolvido |
| Eleitorado e comparecimento de 2022 e 2026 | Wikipédia 156.453.354 (2022) | 2022: 156.454.011 aptos, 123.682.372 (T1) e 124.252.796 (T2); 2026: 158.745.502 aptos, 125.275.835 | TSE, detalhe_votacao_secao | Resolvido; 2026 preliminar |
| Percentuais de Nicolau lidos de gráfico | rótulos de gráfico | O artigo não tem tabela numérica desse gráfico; a extração é ambígua para 1955 e 1960; eleitorado de 1955 rebaixado a `false` | Nicolau, texto lido | **Em aberto** |

### Confirmado sem alteração

- Votos e percentuais presidenciais de 2002, 2006, 2010, 2014 e 2018, e de 1998 (exceto o que a tabela acima registra), conferem com o arquivo atual do TSE.
- EC 16/1997 de 04/06/1997; Lei 9.100/1995 prevê a eleição municipal de 3 de outubro de 1996 e o segundo turno em municípios com mais de 200 mil eleitores; Lei 14.208/2021 (28/09/2021); EC 107/2020 (eleições em 15/11 e 29/11/2020); Lei 13.487/2017 (06/10/2017); Lei Rosa e Silva (1904) já estava lida; Lei Falcão (Lei 6.339, de 01/07/1976) lida.
- Código Eleitoral de 1932: instituição da Justiça Eleitoral (art. 5º), voto secreto e proporcional (art. 56), voto feminino (art. 2º). Voto feminino nos Estados: Lei 660/1927 do Rio Grande do Norte (TSE).
- AI-2 (27/10/1965): STF de 16 ministros, eleição indireta por maioria absoluta em sessão pública e votação nominal, extinção dos partidos. AI-3 (05/02/1966): governadores por maioria absoluta da Assembleia.
- Constituição de 1988, art. 14, §1º: obrigatório de 18 a 70 anos; facultativo para analfabetos, maiores de 70 e de 16 a 17 anos (voto aos 16 desde 1988, confirmado).

### Erros e anacronismos encontrados

Marca: [P] confirmado em texto primário ou em dados do TSE; [S] confirmado em fonte secundária lida; [?] suspeita registrada, sem fonte aberta.

- [P] Idade mínima de 1945: 18 anos (DL 7.586, art. 2º), não 21; voto secreto (art. 38). Mulheres sem profissão lucrativa e maiores de 65 estavam dispensados (art. 4º); Nicolau escreve 'obrigatório para todas as mulheres', o que o texto não confirma. A isenção feminina persiste na Lei 1.164/1950 e termina na Lei 4.737/1965 (art. 6º).
- [P] Constituição de 1934: voto obrigatório para homens e, para mulheres, só funcionárias (art. 109); idade 18 anos (art. 108). Antes (1932) eram 21. Justiça Eleitoral foi criada em 1932, não em 1934 (historia.json corrigido).
- [P] Estado Novo: a eleição cancelada de janeiro de 1938 era direta (CF/1934, art. 52, §1º); o `tipo` 'indireta' estava errado.
- [P] Primeira eleitora: Celina Guimarães (RN, 1927, Lei estadual 660); primeira prefeita: Alzira Soriano (RN, 1928); eleição nacional com mulheres: 03/05/1933 (Constituinte).
- [P] Voto do analfabeto, 1985: a EC 25 não o concede por si; remete à lei (art. 147, §4º), regulada pela Lei 7.332/1985 (art. 18); analfabetos seguem inelegíveis (art. 150).
- [P] Pacote de Abril: quórum de emenda é maioria absoluta do Congresso (art. 48 da EC 8), não 'maioria simples'; governadores já eram indiretos desde o AI-3 (1966), e o novo foi o colégio com delegados municipais; Lei Falcão estendida pelo DL 1.538; data '13/04 por decreto' era confusão entre recesso, EC 7 e EC 8.
- [P] Constituição de 1988: a regra do segundo turno em municípios com mais de 200 mil eleitores é da EC 16/1997 (já usada por lei em 1996), não de 1988.
- [P] Eleição municipal de 1996 foi em 03/10/1996, não em 06/10 (Lei 9.100/1995 e dados do TSE); o campo de eleitorado guardava os 32 milhões da urna em vez do eleitorado de 100.169.609.
- [P] 1966: MDB elegeu 4 senadores de 22 (TSE v. 8 via Pecoraro, Kinzo), não 7 de 23. 1970: Senado com 5 ou 6 do MDB (fontes divergem).
- [P] Bolsa Família: restauração pela MP 1.164, de 02/03/2023 (Lei 14.601, de 19/06/2023); a MP 1.155, de 01/01/2023, criou só um adicional ao Auxílio Brasil.
- [P] Bolsonarismo: 'federação com PRTB em 2018' é anacronismo (federações desde 2021); foi coligação.
- [P] EC 97/2017: a cláusula de desempenho é 1,5% e 9 deputados (legislatura após 2018), 2% e 11 (após 2022), 2,5% e 13 (após 2026), 3% e 15 (2030); a promulgação foi em 04/10/2017 e o FEFC é da Lei 13.487 de 06/10/2017.
- [P] Justiça do Trabalho: Decreto-Lei 1.237 de 02/05/1939 (não 01/05). Eletrobrás: lei de 25/04/1961, depois de JK; UnB é fundação; CSN é anterior ([S]/[?]).
- [P] ADEP foi fundada em março de 1962 (a página dizia 1959, data do IBAD).
- [P] Totais nacionais de 2022 T1 (Tebet, Ciro) e 2026 (Cury, Renan, Caiado) usavam a soma municipal sem exterior; passaram ao total nacional do TSE. Eleitorado de 2006 (125.913.134 -> 125.913.235), 2018 T1 (+1), 2022 (+657) e 1994 (-72.167) corrigidos.
- [?] Bancadas de 1945 (UDN 82) e 1962 (total de vagas do Senado, 'Senado (23 vagas)' contra parcelas que somam 43): sem fonte aberta; o campo 'cargo' de 1962 foi esvaziado do número.
- [?] UDR '(1985-88)' sugere fim em 1988; Lei Falcão 'vigorou de 1976 a 1984' (não verificado); 'Primeira mulher eleita presidente' listada como mudança de regra em 2010 (não é regra); 'cédula única' do Código de 1950 (não encontrada).

### Continua em aberto ou sem fonte aberta

- 1930: base do percentual de Prestes; 1945 e 1962: composição das bancadas; 1974: 165 do MDB; 1970: Senado 5 x 6.
- Cortes de Lisboa (1821) e Instruções de 1820: só resumo de busca (artigo de Motta, TSE/UNIFESP, bloqueado).
- Lei Saraiva (Decreto 3.029/1881): texto não aberto (scan do Senado); regras confirmadas apenas em Ferraro (2013).
- Manifesto Republicano de 1870: 60 signatários na Wikipédia; resumo de busca aponta 57-58 por soma de profissões; contagem não resolvida.
- Plebiscito de 1963: PDF do TSE; urna de 1998 (537 municípios); eleições municipais de 1988 e 1992; FEFC por ano (página do fundo).
- Autenticidade da carta da Princesa Isabel; 324 deputados da FPA; relação entre rótulos do Gráfico 2 de Nicolau e os anos.
- Censo 2022 (evangélicos 26,9%): só em reportagem que cita o IBGE; página do IBGE não aberta.

### Fontes novas por tipo

- **Texto legal (Planalto, Câmara):** Constituições de 1824, 1891, 1934, 1946 e 1988; Decretos 6/1889 e 21.076/1932; DL 7.586/1945, 1.237/1939 e 1.538/1977; Leis 1.164/1950, 4.737/1965, 7.332/1985, 9.100/1995, 13.487/2017, 14.208/2021, 14.601/2023, 3.890-A/1961; AI-2, AI-3; ACs 102 e 103/1977; ECs 7 e 8/1977, 16/1997, 25/1985, 97/2017, 107/2020; MPs 1.164 e 1.155/2023.
- **Dados abertos do TSE (cdn.tse.jus.br):** `votacao_candidato_munzona` e `detalhe_votacao_munzona` de 1994 a 2018 (arquivos BR, lidos por requisição parcial), `detalhe_votacao_munzona_1996/2016/2020/2024`, `perfil_eleitorado_2016/2020/2024`, `consulta_cand_2024`, e os arquivos do repositório (`votacao_secao`, `detalhe_votacao_secao`, `perfil_eleitorado` de 2022 e 2026).
- **Páginas institucionais:** TSE (referendo de 1963, plebiscito de 1993, urna eletrônica 25 anos, voto feminino, glossário da Lei Agamenon), Agência Senado (2005 e 2018), Assembleia Legislativa de SP, Agência FPA, Fundação Ulysses Guimarães (tabela adaptada de Kinzo), Fundação Casa de Rui Barbosa, CPDOC/FGV.
- **Acadêmicas abertas:** Pecoraro (UFRRJ, 2019; tabelas do TSE 1966-1974), Nóbrega (UFRJ, 2019; CPI do IBAD e entrevistas de Gordon), Estudos Históricos 37(82), 2024 (Peyton; doi 10.1590/S2178-149420240212), REVES 7(1), 2024 (bancada evangélica; doi 10.18540/revesvl7iss1pp19054), Educar em Revista 50, 2013 (Lei Saraiva; Ferraro).
- **Imprensa e ONG (secundárias, lidas):** Migalhas (referendo de 1963), Congresso em Foco (Censo 2022), Jornal Opção (carta de Isabel), Anistia Internacional (Eldorado dos Carajás), Georgetown PDBA (versão de 2005 dos resultados de 1998).

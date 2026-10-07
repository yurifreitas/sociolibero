# Biblioteca de fontes primárias

Textos originais de constituições, leis, atos institucionais, emendas e outras fontes, disponíveis para consulta integral no app. Cada texto está em `web/public/textos/<id>.txt` com cabeçalho de proveniência, e o índice legível por máquina está em `web/public/data/textos_index.json`. Data de captura de todos os textos: 2026-10-07.

Resumo: **44 textos integrais** (2.241.839 caracteres) e **6 documentos só com metadados e link** (obra protegida ou texto não obtido). Nenhum JSON de dados existente foi alterado.

## 1. Política de domínio público e direitos autorais

- **Atos oficiais brasileiros** (constituições, leis, decretos, emendas, atos institucionais, mensagens de veto, resoluções do TSE) não são objeto de direito autoral: Lei 9.610/1998, art. 8º, IV. O inciso V do mesmo artigo (informações de uso comum) não se aplica a estes textos e não foi usado como base.
- **Manifestos e discursos** só entram com texto integral se a obra estiver em domínio público por decurso de prazo (vida do autor + 70 anos, art. 41). O Manifesto Republicano de 1870 passa; o Manifesto Integralista (Plínio Salgado, m. 1975, protegido até 2045), o da ANL (Luís Carlos Prestes, m. 1990, protegido até 2060), o discurso de Ailton Krenak (autor vivo), a Carta ao Povo Brasileiro (autor vivo) e o manifesto do PT (1980) **não** foram reproduzidos. Para esses há só metadados e link, com o motivo registrado em cada entrada.
- Os textos gravados são cópias para consulta e **não substituem** a publicação oficial. Quando a fonte é consolidada (traz alterações posteriores), o campo `tipo_de_versao` diz isso; para leis ainda vigentes, `texto_vigente_url` aponta para a versão atualizada do Planalto.
- Critério de versão: "original de época" quando o texto vem da publicação original (Câmara, Legislação Informatizada) ou do Planalto sem redação posterior; "consolidada" quando traz alterações posteriores (só a Lei 14.701/2023 entra nesse caso; as demais leis vigentes trazem a redação original e apontam o texto atual em `texto_vigente_url`).

## 2. Como verificar o hash

O SHA-256 do índice vale para o **corpo** do arquivo: tudo o que vem depois da linha `=== TEXTO ===`, sem a quebra de linha final, em UTF-8. O hash do arquivo inteiro (`sha256_arquivo`) também está no índice.

```python
import hashlib, json
idx = json.load(open("web/public/data/textos_index.json", encoding="utf-8"))
for d in idx["documentos"]:
    s = open("web/public/" + d["arquivo"], encoding="utf-8").read()
    corpo = s.split("\n=== TEXTO ===\n", 1)[1][:-1]
    ok = hashlib.sha256(corpo.encode("utf-8")).hexdigest() == d["origem"]["sha256"]
    print(d["id"], "OK" if ok else "DIVERGE")
```

Cada trecho-chave tem uma `ancora`, uma string literal que existe no corpo do arquivo (`corpo.count(ancora) >= 1`), para o app localizar o trecho. Todas as âncoras foram verificadas por script.

## 3. Documentos com texto integral

Legenda de versão: **orig.** = original de época; **cons.** = consolidada. "Conferência" resume o que foi comparado de fato (ver seção 7).

| Id | Documento | Data | Tipo | Versão | Status | Conferência | Caract. | Fonte |
|---|---|---|---|---|---|---|---|---|
| `constituicao-1824` | Constituição Política do Império do Brasil (1824) | 1824-03-25 | constituição | orig. | revogado | conferido (2 fontes, ≥98% / ≥95%) | 52.766 | Câmara |
| `lei-387-1846` | Lei de 19 de agosto de 1846 (Lei nº 387): regula as eleições de senadores, deputados e outros | 1846-08-19 | lei | orig. | revogado | conferido (2 fontes, ≥98% / ≥95%) | 55.288 | Câmara |
| `decreto-842-1855` | Decreto nº 842, de 19 de setembro de 1855 (Lei dos Círculos) | 1855-09-19 | decreto | orig. | revogado | fonte única | 7.983 | Câmara |
| `decreto-3029-1881` | Decreto nº 3.029, de 9 de janeiro de 1881 (Lei Saraiva) | 1881-01-09 | decreto | orig. | revogado | cruzada parcial | 71.101 | Câmara |
| `lei-1269-1904` | Lei nº 1.269, de 15 de novembro de 1904 (Lei Rosa e Silva) | 1904-11-15 | lei | orig. | revogado | fonte única | 73.407 | Câmara |
| `constituicao-1891` | Constituição da República dos Estados Unidos do Brasil (1891) | 1891-02-24 | constituição | orig. | revogado | cruzada parcial | 59.277 | Câmara |
| `decreto-21076-1932` | Decreto nº 21.076, de 24 de fevereiro de 1932 (Código Eleitoral) | 1932-02-24 | decreto | orig. | revogado | conferido (2 fontes, ≥98% / ≥95%) | 68.271 | Câmara |
| `constituicao-1934` | Constituição da República dos Estados Unidos do Brasil (1934) | 1934-07-16 | constituição | orig. | revogado | cruzada parcial | 148.434 | Câmara |
| `constituicao-1937` | Constituição dos Estados Unidos do Brasil (1937, "Polaca") | 1937-11-10 | constituição | orig. | revogado | cruzada parcial | 90.657 | Câmara |
| `decreto-lei-7586-1945` | Decreto-Lei nº 7.586, de 28 de maio de 1945 (Lei Agamenon) | 1945-05-28 | decreto | orig. | revogado | conferido (2 fontes, ≥98% / ≥95%) | 69.266 | Câmara |
| `constituicao-1946` | Constituição dos Estados Unidos do Brasil (1946) | 1946-09-18 | constituição | orig. | revogado | cruzada parcial | 112.985 | Câmara |
| `lei-1164-1950` | Lei nº 1.164, de 24 de julho de 1950 (Código Eleitoral de 1950) | 1950-07-24 | lei | orig. | revogado | conferido (2 fontes, ≥98% / ≥95%) | 111.392 | Câmara |
| `lei-4737-1965` | Lei nº 4.737, de 15 de julho de 1965 (Código Eleitoral) | 1965-07-15 | lei | orig. | vigente | cruzada parcial | 206.648 | Câmara |
| `ai-1-1964` | Ato Institucional nº 1 (9 de abril de 1964) | 1964-04-09 | ato institucional | orig. | revogado | conferido (2 fontes, ≥98% / ≥95%) | 9.130 | Planalto |
| `ai-2-1965` | Ato Institucional nº 2 (27 de outubro de 1965) | 1965-10-27 | ato institucional | orig. | revogado | cruzada parcial | 19.078 | Planalto |
| `ai-3-1966` | Ato Institucional nº 3 (5 de fevereiro de 1966) | 1966-02-05 | ato institucional | orig. | revogado | conferido (2 fontes, ≥98% / ≥95%) | 4.022 | Planalto |
| `ai-5-1968` | Ato Institucional nº 5 (13 de dezembro de 1968) | 1968-12-13 | ato institucional | orig. | revogado | conferido (2 fontes, ≥98% / ≥95%) | 8.832 | Planalto |
| `ai-6-1969` | Ato Institucional nº 6 (1º de fevereiro de 1969) | 1969-02-01 | ato institucional | orig. | revogado | cruzada parcial | 4.885 | Planalto |
| `constituicao-1967` | Constituição do Brasil (1967) | 1967-01-24 | constituição | orig. | revogado | cruzada parcial | 140.473 | Câmara |
| `ec-1-1969` | Emenda Constitucional nº 1, de 17 de outubro de 1969 (Constituição de 1967 reeditada) | 1969-10-17 | emenda | orig. | revogado | conferido (2 fontes, ≥98% / ≥95%) | 156.443 | Câmara |
| `lei-6339-1976` | Lei nº 6.339, de 1º de julho de 1976 (Lei Falcão) | 1976-07-01 | lei | orig. | revogado | conferido (2 fontes, ≥98% / ≥95%) | 5.067 | Câmara |
| `ato-complementar-102-1977` | Ato Complementar nº 102, de 1º de abril de 1977 (recesso do Congresso) | 1977-04-01 | ato institucional | orig. | histórico | fonte única | 1.222 | Planalto |
| `ec-8-1977` | Emenda Constitucional nº 8, de 14 de abril de 1977 (Pacote de Abril) | 1977-04-14 | emenda | orig. | revogado | conferido (2 fontes, ≥98% / ≥95%) | 8.684 | Planalto |
| `ec-22-1982` | Emenda Constitucional nº 22, de 29 de junho de 1982 | 1982-06-29 | emenda | orig. | revogado | conferido (2 fontes, ≥98% / ≥95%) | 10.835 | Planalto |
| `ec-25-1985` | Emenda Constitucional nº 25, de 15 de maio de 1985 | 1985-05-15 | emenda | orig. | revogado | conferido (2 fontes, ≥98% / ≥95%) | 9.045 | Planalto |
| `constituicao-1988` | Constituição da República Federativa do Brasil (redação original de 5/10/1988) | 1988-10-05 | constituição | orig. | vigente | cruzada parcial | 263.756 | Câmara |
| `adct-1988` | Ato das Disposições Constitucionais Transitórias (ADCT, redação original de 5/10/1988) | 1988-10-05 | constituição | orig. | vigente | fonte única | 62.385 | Câmara |
| `lc-64-1990` | Lei Complementar nº 64, de 18 de maio de 1990 (Lei das Inelegibilidades) | 1990-05-18 | lei | orig. | vigente | cruzada parcial | 26.300 | Câmara |
| `lc-135-2010` | Lei Complementar nº 135, de 4 de junho de 2010 (Lei da Ficha Limpa) | 2010-06-04 | lei | orig. | vigente | cruzada parcial | 12.117 | Câmara |
| `lei-9096-1995` | Lei nº 9.096, de 19 de setembro de 1995 (Lei dos Partidos Políticos) | 1995-09-19 | lei | orig. | vigente | cruzada parcial | 36.382 | Câmara |
| `lei-9504-1997` | Lei nº 9.504, de 30 de setembro de 1997 (Lei das Eleições) | 1997-09-30 | lei | orig. | vigente | cruzada parcial | 84.743 | Câmara |
| `lei-12034-2009` | Lei nº 12.034, de 29 de setembro de 2009 (minirreforma eleitoral) | 2009-09-29 | lei | orig. | vigente | cruzada parcial | 52.618 | Câmara |
| `ec-16-1997` | Emenda Constitucional nº 16, de 4 de junho de 1997 (reeleição) | 1997-06-04 | emenda | orig. | vigente | cruzada parcial | 2.705 | Planalto |
| `ec-52-2006` | Emenda Constitucional nº 52, de 8 de março de 2006 (fim da verticalização das coligações) | 2006-03-08 | emenda | orig. | vigente | cruzada parcial | 1.826 | Planalto |
| `ec-97-2017` | Emenda Constitucional nº 97, de 4 de outubro de 2017 (cláusula de desempenho e fim das coligações proporcionais) | 2017-10-04 | emenda | orig. | vigente | conferido (2 fontes, ≥98% / ≥95%) | 4.909 | Planalto |
| `ec-111-2021` | Emenda Constitucional nº 111, de 28 de setembro de 2021 | 2021-09-28 | emenda | orig. | vigente | conferido (2 fontes, ≥98% / ≥95%) | 5.112 | Planalto |
| `ec-117-2022` | Emenda Constitucional nº 117, de 5 de abril de 2022 | 2022-04-05 | emenda | orig. | vigente | cruzada parcial | 3.393 | Planalto |
| `lei-14701-2023` | Lei nº 14.701, de 20 de outubro de 2023 (marco temporal das terras indígenas) | 2023-10-20 | lei | cons. | vigente | cruzada parcial | 17.081 | Planalto |
| `veto-lei-14701-2023` | Mensagem nº 536, de 20 de outubro de 2023 (veto parcial à Lei 14.701/2023) | 2023-10-20 | mensagem de veto | orig. | histórico | fonte única | 51.946 | Planalto |
| `decreto-4887-2003` | Decreto nº 4.887, de 20 de novembro de 2003 (titulação de terras quilombolas) | 2003-11-20 | decreto | orig. | vigente | cruzada parcial | 12.781 | Planalto |
| `lei-3353-1888` | Lei nº 3.353, de 13 de maio de 1888 (Lei Áurea) | 1888-05-13 | lei | orig. | histórico | conferido (2 fontes, ≥98% / ≥95%) | 1.368 | Planalto |
| `lei-2040-1871` | Lei nº 2.040, de 28 de setembro de 1871 (Lei do Ventre Livre) | 1871-09-28 | lei | orig. | histórico | cruzada parcial | 10.569 | Planalto |
| `res-tse-23732-2024` | Resolução TSE nº 23.732, de 27 de fevereiro de 2024 (propaganda eleitoral e inteligência artificial) | 2024-02-27 | resolução | orig. | histórico | conferido (TSE atual idêntico à captura Wayback) | 46.150 | TSE via Wayback |
| `manifesto-republicano-1870` | Manifesto Republicano (A República, 3 de dezembro de 1870) | 1870-12-03 | manifesto | orig. | histórico | cruzada parcial | 40.507 | espelho privado |

## 4. Cronologia do voto: o que cada texto diz sobre quem vota

Cada célula de citação reproduz um trecho literal do texto gravado (verificado por script). A ortografia é a da fonte.

| Ano | Texto | Quem vota, segundo o texto | Trechos literais |
|---|---|---|---|
| 1824 | `constituicao-1824` | Cidadãos ativos com renda líquida anual de 100 mil réis votam na paróquia (1º grau); eleitores de 2º grau precisam de 200 mil réis; libertos só votam no 1º grau. | "Os que não tiverem de renda liquida annual cem mil réis por bens de raiz, industria, commercio, ou Empregos." / "II. Os Libertos." |
| 1846 | `lei-387-1846` | Mantém o censo: 200 mil réis de renda para eleitor; libertos excluídos. | "a quantia de duzentos mil réis por bens de raiz, commercio, industria, ou Emprego." |
| 1881 | `decreto-3029-1881` | Voto direto, mas só para alistados com renda de 200$ (provas nos arts. 3º e 4º); saber ler e escrever é exigido para a inclusão nas revisões do alistamento (art. 8º, II e § 1º); surge o título de eleitor. | "serão feitas por eleições directas" / "e a de saber ler e escrever pela lettra e assignatura do cidadão que requerer a sua inclusão no alistamento" |
| 1891 | `constituicao-1891` | Cidadãos maiores de 21 anos alistados; analfabetos, mendigos, praças de pré e religiosos de ordem excluídos. | "Art. 70. São eleitores os cidadãos maiores de 21 annos" / "2º Os analphabetos;" |
| 1904 | `lei-1269-1904` | Reafirma maiores de 21 anos e a exclusão dos analfabetos, com prova de escrita perante comissão. | "sómente serão admittidos a votar os cidadãos brazileiros, maiores de 21 annos" / "2º, os analphabetos;" |
| 1932 | `decreto-21076-1932` | Primeira vez que a lei federal fala de eleitor "sem distinção de sexo" (maiores de 21 anos); cria voto secreto e Justiça Eleitoral. | "sem distinção de sexo" / "É instituida a Justiça Eleitoral" |
| 1934 | `constituicao-1934` | Homens e mulheres maiores de 18 anos; analfabetos fora; obrigatório para homens e para mulheres com função pública remunerada. | "de um e de outro sexo, maiores de 18 annos" / "a) os que não saibam ler e escrever;" |
| 1937 | `constituicao-1937` | Mantém homens e mulheres maiores de 18 anos e exclui analfabetos, mas dissolve o Parlamento e suspende eleições até um plebiscito que não houve. | "a) os analphabetos;" / "São dissolvidos nesta data a Camara dos Deputados, o Senado Federal" |
| 1945 | `decreto-lei-7586-1945` | Maiores de 18 anos de ambos os sexos; analfabetos fora; mulheres sem profissão lucrativa dispensadas do voto obrigatório. | "maiores de 18 anos, alistados na conformidade desta lei" / "g) as mulheres que não exerçam profissão lucrativa." |
| 1946 | `constituicao-1946` | Maiores de 18 anos; analfabetos e quem não se exprime em português não se alistam; sufrágio universal e direto, voto secreto. | "Art. 131. São eleitores os brasileiros maiores de dezoito anos" / "Art. 134. O sufrágio é universal e direto; o voto é secreto" |
| 1965 | `lei-4737-1965` | Código Eleitoral: maiores de 18 anos; analfabetos excluídos, num regime que já admitia eleição indireta. | "Art. 4º São eleitores os brasileiros maiores de 18 anos que se alistarem na forma da lei." / "Art. 5º Não podem alistar-se eleitores:" |
| 1967 | `constituicao-1967` | Presidente eleito por colégio eleitoral; eleitores maiores de 18 anos; analfabetos não se alistam. | "Art. 76. O Presidente será eleito pelo sufrágio de um colégio eleitoral" / "Art. 142. São eleitores os brasileiros maiores de dezoito anos" |
| 1969 | `ec-1-1969` | Voto universal, direto e secreto "salvo nos casos previstos nesta Constituição"; analfabetos excluídos. | "salvo nos casos previstos nesta Constituição" / "a) os analfabetos;" |
| 1985 | `ec-25-1985` | Presidente por voto direto (a partir do mandato seguinte); analfabetos passam a poder alistar-se e votar, na forma da lei, mas seguem inelegíveis. | "por sufrágio universal e voto direto e secreto, em todo o País" / "A Lei disporá sobre a forma pela qual possam os analfabetos alistar-se eleitores e exercer o direito de voto." / "Art. 150. São inelegíveis os inalistáveis e os analfabetos." |
| 1988 | `constituicao-1988` | Sufrágio universal, voto direto e secreto, com valor igual para todos; obrigatório a partir de 18 anos; facultativo para analfabetos, maiores de 70 e jovens de 16 e 17 anos; analfabetos continuam inelegíveis. | "pelo sufrágio universal e pelo voto direto e secreto, com valor igual para todos" / "II - facultativos para:" / "§ 4º São inelegíveis os inalistáveis e os analfabetos." |

Leitura em três linhas: (1) o critério de renda domina de 1824 a 1881; a exigência de alfabetização começa em 1881 (alistamento) e 1891 (Constituição) e só cai do alistamento em 1985, aparecendo em quase todos os textos do quadro; (2) mulheres votam por lei federal a partir de 1932, e a Constituição de 1934 constitucionaliza o voto, com obrigatoriedade diferenciada; (3) a EC 25/1985 tira os analfabetos da exclusão do alistamento, mas só a Constituição de 1988 os torna eleitores de forma expressa (facultativa), e eles seguem inelegíveis.

## 5. Anexo: alterações relevantes à Constituição de 1988

O texto de `constituicao-1988` e `adct-1988` é o **original de 5/10/1988**, sem emendas. As alterações abaixo estão em arquivo próprio (`web/public/textos/<id>.txt`) e no campo `anexo_alteracoes_relevantes` do índice. Para o texto atual, ver o link do Planalto em `texto_vigente_url`.

| Emenda | Data | Tema | O que muda | Arquivo |
|---|---|---|---|---|
| EC 16/1997 | 1997-06-04 | reeleicao | Permite uma reeleição para Presidente, governadores e prefeitos (art. 14, § 5º) e fixa mandato de quatro anos (art. 82). | `ec-16-1997` |
| EC 52/2006 | 2006-03-08 | sistema | Acaba com a obrigatoriedade de vinculação das coligações entre esferas (verticalização), art. 17, § 1º. | `ec-52-2006` |
| EC 97/2017 | 2017-10-04 | sistema | Veda coligações em eleições proporcionais e cria cláusula de desempenho escalonada para acesso a fundo partidário e TV (art. 17, §§ 1º e 3º). | `ec-97-2017` |
| EC 111/2021 | 2021-09-28 | financiamento | Conta em dobro os votos em mulheres e negros para a Câmara (2022 a 2030) na divisão de fundos; consultas populares com as eleições municipais; posse presidencial em 5 de janeiro. | `ec-111-2021` |
| EC 117/2022 | 2022-04-05 | financiamento | Reserva mínima de 5% do fundo partidário para a participação política das mulheres (art. 17, §§ 7º e 8º). | `ec-117-2022` |

Fora do anexo, mas presentes: EC 22/1982, EC 25/1985 (anteriores à Constituição) e Lei 12.034/2009. A EC 4/1993 (anualidade do art. 16) e as EC 132/2023 e EC 133/2024 **não** foram coletadas.

## 6. Documentos sem texto integral

| Id | Documento | Motivo | Link verificado |
|---|---|---|---|
| `pec-5-1983-dante-de-oliveira` | Proposta de Emenda à Constituição nº 5/1983 (Emenda Dante de Oliveira) | Não obtive o texto da proposta em formato aberto e confiável. A página da Câmara citada abaixo traz o resultado da votação, mas não o inteiro teor da PEC. | [Câmara dos Deputados, "Diretas Já: 30 anos do movimento" (resultado 298/65/3 lido nesta página)](https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/diretas-ja) |
| `krenak-discurso-constituinte-1987` | Discurso de Ailton Krenak na Assembleia Nacional Constituinte (4/9/1987) | Obra oral de autor vivo (Lei 9.610/1998, art. 7º, V: conferências, alocuções e sermões): protegida por direito autoral. Não reproduzi o texto. A transcrição circula em fonte não oficial; os Anais da Constituinte (Câmara) não foram localizados em formato acessível. | [Transcrição hospedada pelo CEDEC (não oficial; aberta e conferida a primeira página)](https://acervodigital.cedec.org.br/wp-content/uploads/2022/09/Discurso-de-Ailton-Krenak-em-defesa-dos-direitos-dos-indigenas.pdf) |
| `manifesto-integralista-1932` | Manifesto de Outubro da Ação Integralista Brasileira (7/10/1932) | Autor faleceu em 1975: a obra só entra em domínio público em 1º/1/2046 (Lei 9.610/1998, art. 41). Não gravei o texto. Também não localizei uma edição aberta e confiável do texto integral. | nenhum |
| `manifesto-anl-1935` | Manifesto da Aliança Nacional Libertadora (5/7/1935) | Assinado por Luís Carlos Prestes, falecido em 1990: protegido até 2060 (Lei 9.610/1998, art. 41). A transcrição do Marxists Internet Archive declara licença GFDL, mas isso não afasta o direito do autor sobre o texto original; por prudência gravei apenas metadados e link. | [Marxists Internet Archive (aberto e conferido; fonte indicada: A Platéa, 6/7/1935, via PCdoB)](https://www.marxists.org/portugues/prestes/1935/07/05.htm) |
| `manifesto-pt-1980` | Manifesto de fundação do Partido dos Trabalhadores (10/2/1980) | Obra de 1980 de autoria coletiva identificável e ainda protegida; não localizei o texto do manifesto em fonte oficial aberta (a página da Fundação Perseu Abramo aberta é uma matéria sobre os 40 anos do PT, não o documento). | [Fundação Perseu Abramo, "Das fábricas e das ruas, há 40 anos PT chegava pra mudar" (contexto, não o manifesto)](https://fpabramo.org.br/das-fabricas-e-das-ruas-ha-40-anos-pt-chegava-pra-mudar/) |
| `carta-ao-povo-brasileiro-2002` | Carta ao Povo Brasileiro (22/6/2002) | Texto de autor vivo e de 2002: protegido. A íntegra circula em veículo de imprensa (Congresso em Foco), que não é fonte oficial nem domínio público. Gravei apenas metadados e link. | [Congresso em Foco, "Lula quer fazer nova carta aos brasileiros; veja a íntegra da primeira" (aberto; não oficial)](https://www.congressoemfoco.com.br/noticia/51364/lula-quer-fazer-nova-carta-aos-brasileiros-veja-a-integra-da-primeira) |

Resultado da votação da Emenda Dante de Oliveira, conferido na página da Câmara: 298 votos a favor, 65 contra, 3 abstenções, faltando 22 votos para os dois terços (25/04/1984). O inteiro teor da PEC 5/1983 não foi obtido.

## 7. Conferência: o que foi e o que não foi comparado

Dois sentidos de "conferido" foram usados e não se confundem:

- **Extração**: cada texto foi baixado da URL registrada, convertido de HTML para texto UTF-8 por script, e o hash do texto gravado foi registrado. A extração preserva numeração de artigos e a ortografia da fonte. Não li os 2,2 milhões de caracteres um a um.
- **Comparação entre fontes**: para 18 documentos, comparei o texto da Câmara com a página do Planalto por sobreposição de trechos de 4 palavras (normalizada para acentos, "ph"/"y" e notas editoriais entre parênteses). O selo "texto original conferido contra a fonte" só foi dado quando **pelo menos 98%** dos trechos do texto gravado aparecem na segunda fonte **e** pelo menos 95% dos trechos da segunda fonte aparecem no texto gravado. Isso vale para: Constituição de 1824, Decreto 21.076/1932, Decreto-Lei 7.586/1945, Lei 1.164/1950, EC 1/1969 e Lei 6.339/1976. É teste de coincidência, não revisão jurídica.
- **Revisão de 07/10/2026 (segundas fontes para os de fonte única)**: os textos do Planalto foram comparados com a Câmara (publicação original) ou com o Senado (`legis.senado.leg.br`), pelo mesmo critério de 4 palavras, limitado ao dispositivo (até o último artigo, sem assinaturas). Passaram a **conferidos**: AI-1, AI-3, AI-5, EC 8/1977, EC 22/1982, EC 25/1985, EC 97/2017, EC 111/2021, Lei 387/1846, Lei Áurea (leitura lado a lado) e, para a Res. TSE 23.732/2024, a página atual do TSE (idêntica à captura de 2024). Ficaram **parciais**, com divergências verbais listadas no índice: AI-2 (Planalto e Câmara divergem em ao menos 6 passagens), AI-6, EC 16/1997 (o Planalto traz "seginte" e "ao caput do art. 28"), EC 52/2006, EC 117/2022, Lei 2.040/1871 (8 variantes entre Planalto e Senado), Decreto 4.887/2003 (ordinais e notas "Vide ADIN") e Lei 14.701/2023 (a Câmara tem o texto sancionado e o gravado é a consolidada: só 40% do gravado aparece lá). Seguem de **fonte única**: Ato Complementar 102 (Câmara e Senado não localizados), Decreto 842/1855 e Lei 1.269/1904 (só a Câmara), ADCT e o veto à Lei 14.701. O percentual por 4 palavras em textos curtos (ECs, Lei Áurea) é sensível a assinaturas e notas; por isso foi calculado só no dispositivo.

Resultados da comparação (cobertura do gravado na outra fonte / da outra no gravado):

| Documento | Gravado na outra | Outra no gravado | Observação |
|---|---|---|---|
| `constituicao-1824` | 98.4% | 97.6% |  |
| `constituicao-1891` | 71.6% | 61.4% | diferença forte: Planalto traz redação posterior (reformas de 1926) e ortografia atualizada |
| `decreto-21076-1932` | 98.8% | 98.6% |  |
| `constituicao-1934` | 89.4% | 89.8% | diferenças de ortografia e notas |
| `constituicao-1937` | 71.4% | 66.0% | diferença forte: Planalto traz redação posterior e ortografia atualizada |
| `decreto-lei-7586-1945` | 99.6% | 98.2% |  |
| `constituicao-1946` | 97.4% | 69.3% | Planalto traz emendas posteriores |
| `lei-1164-1950` | 99.4% | 98.3% |  |
| `lei-4737-1965` | 86.5% | 83.2% | Planalto é o texto compilado (alterado) |
| `constituicao-1967` | 97.5% | 95.6% |  |
| `ec-1-1969` | 99.9% | 99.8% |  |
| `lei-6339-1976` | 99.5% | 96.1% |  |
| `constituicao-1988` | 97.7% | 42.2% | Planalto é consolidada com 130+ emendas; o gravado é o original |
| `lc-64-1990` | 95.6% | 64.2% | Planalto é consolidada |
| `lc-135-2010` | 94.5% | 92.1% | diferenças de formatação |
| `lei-9096-1995` | 97.9% | 48.9% | Planalto é consolidada, muito alterada |
| `lei-9504-1997` | 96.6% | 43.8% | Planalto é consolidada, muito alterada |
| `lei-12034-2009` | 90.4% | 88.2% | diferenças de formatação |

## 8. O que não foi encontrado, lacunas e divergências

- **Lei Rosa e Silva**: o pedido dizia "Lei 3.208/1904". A norma de 1904 é a **Lei nº 1.269, de 15/11/1904**. A Lei 3.208 é de 27/12/1916 (outra lei eleitoral). Gravei a 1.269.
- **Decreto 3.029/1881 (Lei Saraiva)**: **resolvido em 07/10/2026**. O HTML da Câmara omitia os arts. 3º e 4º (numeração de 2º a 5º, com incisos X a XII soltos) e também o § 2º do art. 31 (multas pelos juízes de direito). A segunda fonte aberta é o glossário eleitoral do TSE (página "Lei Saraiva", que reproduz o decreto e cita a Coleção das Leis do Império, v. 1, p. 1-29; a coleta automática responde 403, a leitura foi feita no navegador). Os trechos faltantes foram incorporados ao texto gravado (o bloco dos arts. 3º e 4º é idêntico ao do TSE por hash de letras e números); dos 36 artigos comparados, 16 coincidem em letras e números e 20 diferem em 1 a 8 caracteres. O texto continua **parcial**: não foi conferido contra a Coleção das Leis do Império. Correção de rótulo: a exigência de saber ler e escrever está no **art. 8º, II e § 1º** (revisão do alistamento), e não no art. 6º § 1º; o art. 6º § 14 prevê o registro, no título, de saber ou não ler e escrever, o que mostra que o primeiro alistamento admitia quem não sabia ler.
- **Erros de transcrição preservados da Câmara**: Constituição de 1824 ("Art.. 81", "Art. 14I"), Lei 1.269/1904 ("Art. 135" no lugar de 13), Decreto-Lei 7.586/1945 ("um e outro anexo" no lugar de "sexo"). Nenhum foi corrigido, para não alterar o texto da fonte.
- **Art. 86 da Constituição de 1891**: **não faltava**. O artigo ("Todo brazileiro é obrigado ao serviço militar...") está no texto, na mesma linha do art. 85 ("85. ... Art. 86. ..."), e coincide com o Planalto; a lacuna era um artefato de busca por início de linha. **Art. 14 da Lei 1.164/1950**: a página do Planalto (l1164.htm, lida em 07/10/2026) também salta do art. 13 para o título "Dos Tribunais Regionais" e o art. 15; o salto está na publicação, não na extração. Não conferido no Diário Oficial de 26/07/1950.
- **EC 8/1977**: confirmada a data 14/04/1977 (a EC 7, do dia anterior, reforma o Judiciário). **Ato Complementar 102**: de 1º/04/1977, publicado em 13/04/1977, antes da EC 8 e suspenso pelo Ato Complementar 103.
- **EC 25/1985**: confirmado que restabelece a eleição direta do Presidente e remete à lei o alistamento e o voto dos analfabetos, **sem** torná-los elegíveis. A convocação da Constituinte foi a EC 26/1985 (27/11/1985, Planalto, lida em 07/10/2026: reunião unicameral em 1º/2/1987), que **não** foi coletada.
- **AI-4 (1966)**: não estava no pedido e não foi coletado.
- **Lei 14.701/2023**: a página do Planalto mostra os vetos e as partes promulgadas depois da derrubada. Por isso o arquivo é marcado **consolidada** e não representa o texto sancionado em 20/10/2023. Andamento (relato do escritório Mattos Filho, 9/4/2026, lido; o acórdão não foi lido): o STF julgou em conjunto a ADC 87 e as ADIs 7582, 7583 e 7586 (início em 10/12/2025), seguiu por maioria o relator Gilmar Mendes, reafirmou o Tema 1.031 (RE 1.017.365, 9 a 2 em 21/9/2023, segundo o título do Poder360) e declarou inconstitucionais dispositivos da Lei 14.701 (por exemplo o art. 4º, caput), em decisão cujo acórdão foi publicado em 18/3/2026. O texto gravado não marca esses dispositivos. A Câmara publica o texto sancionado (94% da publicação original aparece no gravado; só 40% do gravado aparece nela).
- **Resolução TSE 23.732/2024**: o site do TSE responde 403 a coleta automática; usei a captura da Wayback Machine de 25/12/2024 da página "legislação compilada" do TSE (URL no arquivo). **Verificado em 07/10/2026 no navegador**: a página atual do TSE tem exatamente o mesmo texto (mesmo SHA-256 do título a "Brasília, 27 de fevereiro de 2024.", espaços normalizados). A Res. 23.732 apenas altera a Res. 23.610/2019; em 2/3/2026 o TSE aprovou a **Resolução nº 23.755/2026**, que altera de novo a Res. 23.610 (inclusive a regra de inteligência artificial), conforme a compilada da Res. 23.610 e a notícia oficial do TSE de 3/3/2026. O texto de referência para as Eleições 2026 é a Res. 23.610 compilada (`texto_vigente_url`), não a 23.732 isolada, e a 23.755/2026 **não** está entre os textos gravados.
- **Manifesto Republicano (1870)**: sem Wikisource, Câmara, Senado ou Arquivo Nacional acessíveis com o texto. Usei um PDF de site privado (transcrição do manifesto sem os apontamentos do autor do PDF), com ortografia atualizada. **Fonte melhor localizada em 07/10/2026**: R. C. Pessoa, "O Primeiro Centenário do Manifesto Republicano de 1870", *Revista de História* (USP), 1970, p. 401 ss., DOI 10.11606/issn.2316-9141.rh.1970.129541 (DOI conferido no Crossref), que republica o texto integral com a ortografia de época a partir de A. Brasiliense, *Os Programas dos Partidos e o 2º Império* (1878), p. 59-88, e traz notas. Não substituí o texto gravado: o PDF da revista é uma digitalização com ruído de OCR, e a coincidência de trechos (43% de 4 palavras e 53% de 3, após normalizar a ortografia) não permite afirmar equivalência palavra a palavra. **Não está conferido contra o jornal de 1870.** Tratar como transcrição de segunda mão; para citar, preferir a edição da *Revista de História*.
- **Não incluídos por decisão de direitos autorais**: Manifesto Integralista, Manifesto da ANL, manifesto do PT (1980), Carta ao Povo Brasileiro, discurso de Krenak. **Não incluída por ser opcional**: Carta de Pero Vaz de Caminha.
- **Texto não obtido**: PEC 5/1983 (Dante de Oliveira) e lista nominal da votação; Anais da Constituinte (Câmara) com o discurso de Krenak.
- Os textos do Planalto trazem notas remissivas entre parênteses (por exemplo "Vide Constituição de 1988") e, nos Atos Institucionais, marcas "Vide" no corpo; foram mantidas. Em páginas do Planalto, trechos tachados (redação revogada) foram mantidos como texto comum nas poucas páginas em que aparecem (AI-5 e Lei 14.701 têm um tachado vazio ou um "(VETADO)").

## 9. Espelhos e fontes usados

| Fonte | Uso | Observação |
|---|---|---|
| Câmara dos Deputados, Legislação Informatizada (`www2.camara.leg.br/legin`), "publicação original" | 23 textos (constituições de 1824, 1891, 1934, 1937, 1946, 1967 e 1988 e ADCT; leis, decretos e leis complementares de 1846 a 2010; EC 1/1969) | Fonte preferida: traz a redação original; abre com navegador de script (HTTP 200). |
| Planalto (`www.planalto.gov.br/ccivil_03`) | 19 textos (5 Atos Institucionais, Ato Complementar 102, 8 emendas constitucionais de 1977 a 2022, Lei 14.701 e veto, Decreto 4.887, Lei Áurea, Ventre Livre) e 18 páginas usadas só para comparação com os textos da Câmara | HTTP 200 para essas páginas. Algumas normas pedidas (3.029/1881, 1.269/1904, 387/1846, 842/1855) não existem lá nas URLs testadas; AI-1, AI-2, AI-3 e AI-5 foram comparados com a Câmara (`legin/fed/atoins`), cuja URL leva o código numérico da norma. |
| TSE via Wayback Machine (captura 20241225122605) | Res. 23.732/2024 | O TSE direto responde 403. |
| doutormiguelvieiraferreira.org (PDF) | Manifesto Republicano 1870 | Espelho privado, não oficial. |
| Senado Federal (`legis.senado.leg.br/norma/<id>/publicacao/<id>`) | segunda fonte de 10 comparações (AI-3, AI-5, AI-6, EC 16, 52, 97, 117, Lei 387/1846, Lei 2.040/1871, Lei Áurea) | Abre por `curl` com cabeçalho de navegador; a página `www2.senado.leg.br/bdsf` exige verificação de navegador. O LexML (`lexml.gov.br/urn/...`) resolve a URN e lista os links da Câmara e do Senado, mas não resolveu os AIs, o Decreto 842/1855 nem o 3.029/1881. |
| TSE, glossário eleitoral "Lei Saraiva" | arts. 3º, 4º e 31 § 2º do Decreto 3.029/1881 | Responde 403 ao acesso automático; lido no navegador. |
| TSE, legislação compilada (Res. 23.732/2024 e Res. 23.610/2019) | verificação de versão atual | Lido no navegador em 07/10/2026. |
| Revista de História (USP), 1970 | Manifesto Republicano, segunda fonte acadêmica | PDF com OCR; ortografia de época. |
| Não usados | Wikisource, Arquivo Nacional | A página do Wikisource do Manifesto Republicano não existe; Arquivo Nacional não foi consultado. |

## 10. Estrutura de cada entrada do índice

`id`, `titulo`, `data`, `ano`, `tipo` (constituição, lei, decreto, emenda, ato institucional, resolução, manifesto, discurso, proposta; extras: `mensagem de veto`, com `subtipo` para decreto-lei, lei complementar, ato complementar e ADCT), `autoridade`, `status` (vigente, revogado, histórico), `arquivo`, `origem` (`url`, `espelho`, `data_captura`, `sha256`, `sha256_arquivo`, `tipo_de_fonte`), `tipo_de_versao`, `n_caracteres`, `trechos_chave` (`id`, `rotulo`, `ancora`, `por_que_importa`, `tema`, `eleicoes_ids`, `movimentos_ids`, `historia_ids`, `indigenas_ids`), `conferencia` (`status`, `conferido_contra`, `observacoes`, `lacunas`, `comparacao_planalto`), `dominio_publico`, `base_legal_dominio_publico` e `texto_vigente_url` (quando há versão consolidada vigente). Os ids de eleições, movimentos, eventos de história e linha do tempo indígena foram validados contra `eleicoes_timeline.json`, `historia.json` e `indigenas_eleicoes.json`.

# sociolibero

Evidências, textos originais e cenários político-econômicos do Brasil, com **proveniência em cada número**, validação dos detectores e limites declarados.

**Demo:** <https://yurifreitas.github.io/sociolibero/> · **Licenças:** [`LICENSES.md`](LICENSES.md) · **Fontes:** [`ATTRIBUTION.md`](ATTRIBUTION.md) · **Documentação:** [`docs/`](docs/README.md)

> **Leia antes de usar qualquer número.**
> - Anomalia estatística **não é prova** de fraude: é triagem para auditoria.
> - Cenários e efeitos de decisões são **julgamentos editáveis**, não previsões.
> - O selo `verificado` só vale quando o dado foi **lido na fonte**. Muita coisa aqui vem de fonte secundária ou de memória e está marcada `false`; veja o estado de cada base na gaveta "Bases & avisos" do app.
> - Nada acusa pessoas ou empresas. "Interesse próprio" aparece como mecanismo teórico, com a leitura contrária.

## O que é
Um atlas por município (5.570) e uma biblioteca de fontes, construídos com a regra de que **número sem fonte é bug**:

| Camada | O que traz |
|---|---|
| **Eleições** | resultados por município de 2022 e 2026 (1º turno preliminar) a partir do TSE por seção; os totais por seção **batem exatamente** com os publicados (2022 T1/T2 e 2026 T1) |
| **Forense eleitoral** | z contra vizinhos, último dígito, correlação comparecimento × voto, impressão digital; **validada com fraude sintética** (o Benford de 2º dígito foi descartado: reprova ~60% dos municípios sem indício) |
| **Eleições desde 1532** | 60 eleições e marcos de regra, 30 movimentos e como cada um se construiu; 174 registros de revisão contra fontes primárias |
| **Biblioteca de textos originais** | constituições, leis eleitorais, atos institucionais e emendas em **texto integral**, com hash, trechos-chave e botão de verificação no navegador |
| **Marx em texto original** | 66 trechos conferidos palavra por palavra na fonte (alemão, francês, inglês), teses, contra-argumentos e 17 mal-entendidos |
| **Povos indígenas e quilombolas** | história, candidaturas autodeclaradas (TSE), seções em terras indígenas e território por município |
| **Voto do analfabeto** | história do sufrágio restrito, eleitorado por instrução e projeção até 2038 com validação retrospectiva |
| **Economia e decisões** | modelo macro reduzido, 33 decisões com quórum e composição do Congresso de 2026, testes de estresse e cenários de risco |
| **Clima** | séries, relações com a economia (com IC95 e resultados nulos declarados) e camada de risco do RS |
| **Pensamento** | pilares indígenas latino-americanos, 71 pensadores da violência, 23 classes e seus interesses |
| **Futuro** | cadeias de Markov de regimes e de cenários, anéis de realimentação, leis de tecnologia |

## Rodar
```bash
# Python (uv): testes e geração de dados
uv sync
uv run pytest -q                      # offline; alguns testes são ignorados se os dados não foram baixados
uv run sociolibero eleicoes baixar    # ~830 MB do TSE, com SHA-256 (opcional)
uv run sociolibero eleicoes build

# App web
cd web
pnpm install
pnpm dev                              # http://localhost:5173
pnpm build                            # gera web/dist (o mesmo que o GitHub Pages publica)
```
Os dados já prontos estão em `web/public/data/` e os textos em `web/public/textos/`; **não é preciso baixar nada** para rodar o app.

## Como confiar (ou não) nos números
1. **Selos** em cada dado: `oficial`, `preliminar`, `derivado`, `julgamento`, `parcial`, `não verificado` (ver [`docs/SELOS_DE_PROVENIENCIA.md`](docs/SELOS_DE_PROVENIENCIA.md)).
2. **Hash dos textos:** cada arquivo em `web/public/textos/` traz o SHA-256 do corpo; a biblioteca recalcula no navegador.
3. **Validação antes da detecção:** cada detector tem nulo simulado, poder e falsos positivos ([`docs/METHODS.md`](docs/METHODS.md), [`docs/RIGOR_DE_VALIDACAO.md`](docs/RIGOR_DE_VALIDACAO.md)).
4. **Resultados nulos aparecem:** a cadeia de regimes econômicos não bate a baseline; o clima não explica o PIB agro nesta série; as curvas de tecnologia perdem para o ingênuo em 6 de 11 séries.
5. **Contagem ≠ estimativa:** os arquivos de custo trazem `nao_somar`.

## Limites que você deve conhecer
- O modelo macro **não tem câmbio nem dívida indexada**; acima de 120% de dívida/PIB o resultado é "ruptura de regime", não trajetória.
- Os efeitos das decisões no catálogo são **julgamento**; o custo em R$ é escala, não a conta do orçamento.
- Fatores de cruzamento (voto × território) são **correlações entre municípios**, não comportamento individual.
- Boa parte das referências e do conteúdo de pensamento tem verificação **fraca** (DOI conferido, conteúdo de memória ou resumo). A lista está em cada documento, na seção "O que não foi verificado".
- Textos de terceiros ainda protegidos por direito autoral **não** são reproduzidos: entram só metadados e link.

## Estrutura
```
src/sociolibero/   pipelines, modelos e CLI (uv run sociolibero ...)
tests/             testes offline
web/               app React + Vite (mapa, linha do tempo, biblioteca, páginas temáticas)
web/public/data/   dados curados e agregados (JSON)
web/public/textos/ textos integrais com proveniência
docs/              método, validação e um documento por tema
data/hist.json     cache de séries do backtest
```

## Contribuir
Erros factuais e fontes melhores são a contribuição mais valiosa: veja [`CONTRIBUTING.md`](CONTRIBUTING.md) e o modelo de *issue* "Erro factual ou fonte".

## Licença
Código **MIT**; dados e documentos curados **CC BY 4.0**; textos legais e clássicos em **domínio público**; dados de terceiros mantêm a licença da fonte. Detalhes em [`LICENSES.md`](LICENSES.md) e [`ATTRIBUTION.md`](ATTRIBUTION.md). Para citar: [`CITATION.cff`](CITATION.cff).

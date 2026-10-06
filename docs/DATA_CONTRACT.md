# Contrato de dados (pipeline Python → frontend)

Tudo é estático, servido de `web/public/data/` e gerado por `uv run sociolibero eleicoes build`.
Chaves de município = **código IBGE de 7 dígitos como string** (ex.: `"3550308"`).
Todo número exibido na UI deve poder ser rastreado até `meta.fonte`, `meta.baixado_em` e `meta.sha256`.

## `index.json`
```json
{ "gerado_em": "2026-10-06T...Z",
  "geo": "geo/municipios.geojson",
  "eleicoes": [ {"id":"pres_2022_t1","rotulo":"Presidente 2022 · 1º turno","ano":2022,"turno":1,
                 "cargo":"Presidente","status":"oficial|preliminar","municipios":5570} ],
  "forense": ["pres_2022_t1"],
  "validacao_sintetica": "forensics/validacao_sintetica.json",
  "referencias": "references.json" }
```

## `geo/municipios.geojson`
FeatureCollection (IBGE, qualidade mínima). `properties`: `{ibge, nome, uf}`.

## `elections/{id}.json`
```json
{ "meta": { "id":"pres_2022_t1", "rotulo":"...", "ano":2022, "turno":1, "cargo":"Presidente",
            "status":"oficial", "fonte":"https://cdn.tse.jus.br/...zip", "baixado_em":"ISO",
            "sha256":"...", "candidatos":[{"numero":13,"nome":"LULA","partido":"PT"}] },
  "linhas": { "3550308": { "aptos":9000000, "comparecimento":7000000, "validos":6800000,
                           "brancos":90000, "nulos":110000, "votos":{"13":3000000,"22":2900000} } } }
```
Exterior (ZZ) e municípios sem correspondência no IBGE ficam fora de `linhas` e são listados em
`meta.sem_correspondencia` (validação do join).

## `forensics/{id}.json`
```json
{ "meta": { "id":"pres_2022_t1", "testes":[ {"chave":"zt","rotulo":"Comparecimento vs vizinhos",
             "descricao":"...", "interpretacao":"...", "limitacoes":"..."} ],
            "aviso":"Anomalia estatística não é prova de fraude." },
  "nacional": { "fingerprint": {"x_bins":[...],"y_bins":[...],"contagem":[[...]]},
                "benford_2bl": {"digitos":[0,...,9],"observado":[...],"esperado":[...],"p":0.31},
                "ultimo_digito": {"digitos":[...],"observado":[...],"esperado":[...],"p":0.52} },
  "linhas": { "3550308": { "n_secoes":12000, "zt":0.4, "zs":{"13":-1.2,"22":1.1}, "zn":0.2,
              "ld_p":0.41, "b2_p":0.66, "bunching":0.0, "score":12, "confianca":"alta|media|baixa",
              "flags":["zt"] } } }
```
`z*` = z-score robusto (mediana/MAD) contra municípios vizinhos (contiguidade). `*_p` = p-valor
(ajustado para múltiplas comparações no `score`). `score` 0–100 = prioridade de auditoria, **não** prova.
`confianca` depende do nº de eleitores aptos (alta ≥ 20 mil, média ≥ 5 mil, baixa abaixo): municípios pequenos oscilam por acaso. Testes de dígito exigem ≥ 100 contagens (≈ 50 seções), senão `null`.
Campos extras: `rho` (Spearman comparecimento×voto), `rho_z` (z empírico nacional, usado no flag), `mult5_p`, `bunching`. `b2_p` (Benford 2º dígito) é publicado só por transparência e **fora do score**.
`nacional.calibracao`: fração de municípios com p<0,05 (esperado ≈ 5% se o teste for válido) e `persistencia` (flags repetidos entre pleitos).

## `forensics/validacao_sintetica.json`
Poder/falsos positivos de cada detector com fraude injetada sinteticamente (ground truth):
`{ "cenarios":[ {"nome":"enchimento de urna","intensidade":[0.01,0.02,...],
  "detectores":{"zt":{"tpr":[...],"fpr":0.05},"ld_p":{...}} } ] }`

## `references.json`
`[{ "id","categoria","titulo","autores","ano","url","doi","o_que_aproveitar","verificado":true }]`
Categorias: `forense-eleitoral`, `dados-abertos`, `visualizacao`, `antifraude-gastos`, `seguranca-urna`.

## `decisoes.json` (camada de decisões — gerado por `uv run sociolibero decisoes`)
```json
{ "meta": { "baseline":"pragmatico", "referencia_2035":{"debt":104.5,"selic":12.1,"ipca":3.5,"gdp":1.1},
            "composicao":{"camara":{"PL":121,...},"senado":{"PL":28,...}},
            "quoruns":{"PEC":{"camara":308,"senado":49},"LC":{"camara":257,"senado":41}},
            "aviso":"..." },
  "decisoes": [ { "id":"reforcar-arcabouco","rotulo":"...","dominio":"fiscal|monetário|tributário|institucional|social|setorial|externo",
      "instrumento":"PEC|LC|LO|SENADO_ABS|SENADO_2_3|EXECUTIVO","ideologia":0.5,"controversia":0.35,
      "deltas":{"primary_target":1.2,"fiscal_credibility":0.2},"racional":"...",
      "ganhadores":["..."],"perdedores":["..."],"defasagem_anos":2,"reversibilidade":"alta|média|baixa",
      "base_evidencia":"julgamento",
      "p_aprovacao":{"direita":0.42,"esquerda":0.09},
      "impacto_2035":{"debt":-15.2,"selic":-1.8,"ipca":-0.1,"gdp":0.2} } ] }
```
`impacto_2035` = variação vs. o cenário pragmático **se aprovada** (pp do PIB, pp a.a.). `p_aprovacao` é
condicional à presidência (quem ocupa o Planalto) e usa o quórum real × composição eleita em 2026.
Visual sugerido: dispersão **viabilidade (P) × impacto (Δdívida)**, quadrantes "fácil e bom / difícil e bom /
fácil e ruim / difícil e ruim", alternando presidência; tabela com instrumento/quórum, ganhadores/perdedores,
defasagem, reversibilidade e o aviso de que efeitos são *julgamentos*.

## `exposicao.json` (opcional, quando disponível)
Estrutura econômica municipal (IBGE/SIDRA): `{ "linhas": { ibge: {"agro":0.31,"industria":0.12,"servicos":0.35,"adm_publica":0.22} } }`
para cruzar decisões × municípios (ex.: quem perde com reforma administrativa ou ganha com acordo Mercosul–UE).

## Notas de implementação (reconciliadas com o frontend)
- `fingerprint.contagem` é `[x][y]` (x = comparecimento, y = voto do líder); `x_bins`/`y_bins` são **bordas** (n+1 valores).
- `zs`, `ld_p`, `b2_p`, `rho`, `mult5_p`, `bunching` podem ser `null` (poucas seções/vizinhos). `null` ≠ 0.
- Na validação sintética o detector de correlação chama-se `rho_p`; na UI corresponde ao teste `rho`.
- `meta.score` descreve a fórmula do score; `nacional.calibracao` traz fração com p<0,05 e `persistencia`.
- `historia.json`: cada evento tem `trilha` (`estado|indigena|quilombola`) ou `trilhas[]`/`cruza[]` para cruzamentos; sem trilha ⇒ `estado`.
- `territorios.json`: `pct_*` em fração **ou** percentual (a UI infere pelo máximo do arquivo); preferir um só e documentar.
- Caminhos padrão quando ausentes do `index.json`: `historia.json`, `territorios.json`, `decisoes.json`, `exposicao.json`, `references.json`.

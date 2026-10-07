# Licenças

Este repositório mistura material de naturezas diferentes. Cada parte segue a regra abaixo.

| O quê | Onde | Licença |
|---|---|---|
| **Código** (Python, TypeScript, CSS, scripts) | `src/`, `tests/`, `web/src/`, `web/scripts/` | **MIT** (arquivo [`LICENSE`](LICENSE)) |
| **Dados e documentos curados por este projeto** (JSON de análise, documentos em `docs/`, fichas, matrizes, teses) | `web/public/data/*.json` (exceto os de terceiros abaixo), `docs/` | **CC BY 4.0** (texto em [`LICENSE-CC-BY-4.0.txt`](LICENSE-CC-BY-4.0.txt)). Atribuição: "Yuri Freitas — sociolibero" |
| **Textos legais e atos oficiais brasileiros** | `web/public/textos/` | **Domínio público** (Lei 9.610/1998, art. 8º, IV): não há direitos a licenciar. Cada arquivo registra a fonte e o hash |
| **Obras clássicas de domínio público** (Marx, Engels e outros) | `web/public/textos/` | **Domínio público** na regra "vida + 70 anos" e nos EUA (obra publicada até 1930 ou sem proteção restaurada). A base de cada obra consta no índice e em `docs/BIBLIOTECA_CLASSICOS.md`. Traduções e edições modernas protegidas **não** são reproduzidas |
| **Dados de terceiros** (TSE, IBGE, BCB, OWID/V-Dem, Maddison, WID, INPE, ONS, ANEEL, FUNAI, INCRA, NOAA etc.) | agregados em `web/public/data/` e `data/hist.json` | **Mantêm a licença e os termos de cada fonte**; ver [`ATTRIBUTION.md`](ATTRIBUTION.md) |

## Observações importantes
- A licença CC BY 4.0 cobre **a nossa curadoria** (seleção, estruturação, selos, análises). Ela **não** relicencia dados de terceiros nem textos de domínio público.
- Partes derivadas do OpenStreetMap (ODbL) podem trazer obrigação de **compartilhamento pela mesma licença**; ver `ATTRIBUTION.md`.
- Trechos curtos de obras ainda protegidas podem aparecer como citação identificada (com fonte). Citação não transfere direitos sobre a obra.
- Nada aqui é aconselhamento jurídico. Se você acredita que algum conteúdo viola direitos, abra uma *issue* e ele será revisado ou removido.

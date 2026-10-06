# sociolibero

Cenários político-econômicos do Brasil + evidências eleitorais por município, com foco em **dados rastreáveis,
validação e triagem antifraude estatística**. Tudo em um repositório: pipeline Python (`uv`), modelo macro,
camada de decisões e frontend com mapa (`web/`, Vite + React + TypeScript).

> Anomalia estatística não é prova de fraude. Cenários e efeitos de decisões são **julgamentos editáveis**,
> não previsões. Leia `docs/METHODS.md` antes de usar qualquer número.

## O que tem aqui
| Camada | Onde | O que faz |
|---|---|---|
| Eleições por município | `src/sociolibero/eleicoes/` | TSE por seção → município (5570), reconciliação entre arquivos, join com IBGE, hash de proveniência |
| Forense eleitoral | `eleicoes/forensics/` | z vs. vizinhos, último dígito, correlação comparecimento×voto, impressão digital, validação sintética |
| Modelo macro | `economy.py`, `scenarios.py` | dívida + juros + expectativas + canal de risco institucional; 4 cenários; backtest em `calibrate.py` |
| Decisões | `decisoes.py` | 20 decisões econômicas/institucionais: instrumento, quórum × composição real do Congresso, impacto 2035 |
| Instituições | `institutions.py` | quóruns da CF/88, aprovação de indicados ao STF, P(2º turno) |
| Frontend | `web/` | mapa coroplético, município, forense, decisões, método, referências |
| Docs | `docs/` | `METHODS.md`, `REFERENCES.md` (54 itens, 51 verificados), `DATA_CONTRACT.md` |

## Rodar
```bash
uv sync
uv run sociolibero eleicoes baixar     # ~830 MB do TSE, com SHA-256 (uma vez)
uv run sociolibero eleicoes build      # → web/public/data/*.json (~4 min)
uv run sociolibero decisoes            # catálogo de decisões → decisoes.json
uv run sociolibero                     # cenários macro → out/trajetorias.csv
uv run sociolibero calibrate | sens    # backtest 2015-25 | sensibilidade
uv run pytest
cd web && pnpm install && pnpm dev
```

## Resultados que já saem dos dados (06/10/2026)
- Ingestão reconcilia **exatamente** com os totais publicados do TSE (2022 T1/T2 e 2026 T1) e entre os dois arquivos por seção.
- Join TSE→IBGE: 5570/5570 em 2022; 5569/5570 em 2026 (município novo fora da malha).
- Último dígito bem calibrado em dados reais (5,6–5,8% < 0,05); **Benford 2º dígito é inválido** nesta escala (rejeita ~60% sem indício).
- Flags forenses persistem entre pleitos (5–9× o acaso): refletem sobretudo estrutura local, não eventos.
- 2026 1º turno: Flávio Bolsonaro 47,03% × Lula 45,16%; 2º turno em 25/10/2026 (**preliminar**).

## Fontes
TSE Dados Abertos (`cdn.tse.jus.br/estatistica/sead/odsele`), IBGE (malhas e localidades), BCB SGS (dívida bruta), Focus.
Detalhes e hashes: `docs/METHODS.md` e `data/raw/*/PROVENIENCIA.json`.

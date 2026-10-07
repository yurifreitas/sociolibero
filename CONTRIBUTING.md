# Como contribuir

Este projeto vive de **evidência rastreável**. A contribuição mais valiosa é **corrigir um número, uma data ou uma fonte**.

## Reportar um erro factual
Abra uma *issue* com o modelo "Erro factual ou fonte" e inclua: o arquivo e o `id` do item, o que está errado, a **fonte que você leu** (URL e trecho) e, se possível, a correção. Sem fonte, a correção entra como "não verificado".

## Regras do projeto (valem para qualquer mudança)
1. **Número sem fonte é bug.** Todo valor traz fonte, ano e `verificado`. `verificado: true` só quando o dado foi **lido na fonte**; resumo de busca e memória ficam `false`.
2. **Ausência é `null`, nunca `0`.**
3. **Contagem ≠ estimativa.** Não some o que não é somável (os arquivos de custo trazem `nao_somar`).
4. **Anomalia estatística não é prova de fraude.** Cenário não é previsão. Interesse próprio é mecanismo teórico, não acusação.
5. **Neutralidade partidária:** o mesmo método para esquerda, centro e direita; sem adjetivos; leituras rivais com a melhor versão de cada uma.
6. **Não acuse pessoas ou empresas nominalmente** por fatos sem trânsito em julgado.
7. **Validação antes de detecção:** todo detector novo precisa de nulo simulado, poder e falsos positivos (ver `docs/RIGOR_DE_VALIDACAO.md`).
8. **Textos de terceiros:** só obras em domínio público (BR e EUA) ou atos oficiais; informe origem e hash (ver `docs/BIBLIOTECA_DE_FONTES.md`).

## Ambiente
```bash
uv sync
uv run pytest -q          # testes offline; alguns são ignorados se os dados não foram baixados
cd web && pnpm install && pnpm dev
```
Commits em *Conventional Commits* (`feat(escopo): ...`), em português, no imperativo.

## Conduta
Respeito a vítimas, a povos e comunidades e a posições divergentes. Debate sobre evidência, não sobre pessoas.

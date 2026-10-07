# web — interface (Vite + React + TypeScript)

Atomic Design (`src/components/{atoms,molecules,organisms,templates}`), páginas em `src/pages`,
dados em `src/features/data` (zod valida cada JSON contra `docs/DATA_CONTRACT.md`).

```bash
pnpm install
pnpm mock       # dados de demonstração (não sobrescreve arquivos reais)
pnpm dev        # http://localhost:5173
pnpm build      # tsc --noEmit + vite build
pnpm preview    # serve dist/ em :4173
```

Páginas: Visão geral (`/`), Mapa (`/mapa`), Município (`/municipio/:ibge`), Decisões, História, Economia & gente, Forense, Futuro, Propostas, Método & Fontes, Referências.
Estado de filtros na URL (hash): `e` eleição, `m` métrica, `c` candidato, `b` comparar, `mun` município.

Mapa: canvas 2D com snapshot offscreen (pan/zoom só transformam a imagem; o redesenho vetorial acontece
quando o gesto para), culling por viewport com zoom, hover/seleção em canvas de overlay.

## Camada de evidência (avisos, bases, referências, propostas)
- **Régua de evidência** (sob o header): um chip por base que sustenta a página (glifo + status). Clique abre a **gaveta “Bases & avisos”** já na base certa.
- **Gaveta** (`<dialog>` modal nativo: foco preso, `Esc` fecha, foco volta ao gatilho): fonte e link, data de extração, SHA-256 copiável, validações com números reais, “o que esta base não diz”, links e páginas que a usam.
- **Atalhos:** `B` abre/fecha a gaveta · `Ctrl/⌘ K` paleta de comandos (navegar, buscar entre os 5.570 municípios, abrir uma base, alternar tema).
- **Registro de bases:** `pnpm bases` gera `public/data/bases.json` a partir dos metas reais dos JSON (roda sozinho em `predev` e `prebuild`). Bases que não são arquivos (modelo macro, Arandu/trans) estão no registro estático do próprio script.
- **Rodapé de cada página:** “Referências desta página” (selo verificado / a confirmar / link ok) e “Propostas relacionadas” (`propostas.json`). Página `/propostas` com filtros por área e status.
- **Notas inline** (`InlineNote`) substituem os banners; dispensáveis por sessão, exceto avisos que não devem sumir (julgamento dos efeitos; “anomalia ≠ prova”).

## Páginas novas
`/` visão geral (bento com KPIs vivos) · `/mapa` · `/gente` economia & gente (14 ciclos, classes, custo humano, séries) · `/futuro` leis e projeções (KaTeX sob demanda) · `/propostas`.
Mapa: métricas de violência por município (`humano_municipal.json`, 14 MB, só carrega quando a métrica é escolhida).

## Parâmetros de teste (só em `pnpm dev`)
`#/gente?series=<arquivo em public/data>` e `#/futuro?futuros=<arquivo>` apontam para fixtures sem tocar nos arquivos reais.

## Contrato: tolerâncias aprendidas
`meta.lacunas` das séries pode ser texto **ou** `{serie, motivo}`; ambos são aceitos. `valor`/`intervalo` nulos nunca viram zero.

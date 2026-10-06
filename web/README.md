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

Páginas: Mapa (`/`), Município (`/municipio/:ibge`), Decisões, História, Forense, Método & Fontes, Referências.
Estado de filtros na URL (hash): `e` eleição, `m` métrica, `c` candidato, `b` comparar, `mun` município.

Mapa: canvas 2D com snapshot offscreen (pan/zoom só transformam a imagem; o redesenho vetorial acontece
quando o gesto para), culling por viewport com zoom, hover/seleção em canvas de overlay.

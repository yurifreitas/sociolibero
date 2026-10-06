"""Cruza voto municipal (TSE) × composição territorial (Censo 2022, FUNAI, INCRA).

Leitura ecológica: correlações são entre *municípios* e NÃO dizem como indivíduos de qualquer grupo
votaram (falácia ecológica). Dentro de cada UF removemos a média para isolar o efeito regional
(Nordeste vota diferente do Sul por muitos motivos além de composição étnica).
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

D = Path("web/public/data")
CAMPOS = ("pct_indigena", "pct_quilombola", "pct_pretos_pardos")


def _load(rel: str) -> dict:
    return json.loads((D / rel).read_text(encoding="utf-8"))


def _wcorr(x: np.ndarray, y: np.ndarray, w: np.ndarray) -> float:
    mx, my = np.average(x, weights=w), np.average(y, weights=w)
    cov = np.average((x - mx) * (y - my), weights=w)
    return float(
        cov
        / np.sqrt(
            np.average((x - mx) ** 2, weights=w) * np.average((y - my) ** 2, weights=w)
        )
    )


def _demean_by_group(v: np.ndarray, g: np.ndarray, w: np.ndarray) -> np.ndarray:
    out = v.copy()
    for k in np.unique(g):
        m = g == k
        out[m] = v[m] - np.average(v[m], weights=w[m])
    return out


def _boot_ci(x, y, w, g, rng, n=300) -> tuple[float, float]:
    idx = np.arange(len(x))
    cs = []
    for _ in range(n):
        s = rng.choice(idx, len(idx))
        cs.append(
            _wcorr(
                _demean_by_group(x[s], g[s], w[s]),
                _demean_by_group(y[s], g[s], w[s]),
                w[s],
            )
        )
    return float(np.percentile(cs, 2.5)), float(np.percentile(cs, 97.5))


def run(seed: int = 5) -> dict:
    rng = np.random.default_rng(seed)
    ter = _load("territorios.json")["linhas"]
    geo = {
        f["properties"]["ibge"]: f["properties"]["uf"]
        for f in _load("geo/municipios.geojson")["features"]
    }
    out = {}
    for pid in ("pres_2022_t1", "pres_2022_t2", "pres_2026_t1"):
        e = _load(f"elections/{pid}.json")
        cands = [
            str(c["numero"])
            for c in e["meta"]["candidatos"]
            if str(c["numero"]) in ("13", "22")
        ]
        rows = []
        for ibge, r in e["linhas"].items():
            t = ter.get(ibge)
            if not t or not r["validos"] or t.get("pop_total") in (None, 0):
                continue
            pop = t["pop_total"]
            rows.append(
                (
                    geo[ibge],
                    r["validos"],
                    {c: r["votos"].get(c, 0) / r["validos"] for c in cands},
                    {
                        "pct_indigena": t["pop_indigena"] / pop * 100
                        if t.get("pop_indigena") is not None
                        else None,
                        "pct_quilombola": t["pop_quilombola"] / pop * 100
                        if t.get("pop_quilombola") is not None
                        else None,
                        "pct_pretos_pardos": t["pct_pretos_pardos"]
                        if t.get("pct_pretos_pardos") is not None
                        else None,
                    },
                )
            )
        res = {}
        for c in cands:
            for campo in CAMPOS:
                sel = [r for r in rows if r[3][campo] is not None]
                x = np.array([r[3][campo] for r in sel], dtype=float)
                if campo == "pct_pretos_pardos" and x.max() <= 1.5:
                    x = x * 100
                y = np.array([r[2][c] for r in sel])
                w = np.array([r[1] for r in sel], dtype=float)
                g = np.array([r[0] for r in sel])
                bruto = _wcorr(x, y, w)
                dentro = _wcorr(_demean_by_group(x, g, w), _demean_by_group(y, g, w), w)
                lo, hi = _boot_ci(x, y, w, g, rng)
                res[f"{c}|{campo}"] = {
                    "n_municipios": len(sel),
                    "corr_bruta": round(bruto, 3),
                    "corr_dentro_uf": round(dentro, 3),
                    "ic95_dentro_uf": [round(lo, 3), round(hi, 3)],
                }
        out[pid] = res
    doc = {
        "meta": {
            "aviso": (
                "Correlação entre municípios, ponderada pelos votos válidos; 'dentro da UF' remove a média estadual. "
                "Não descreve o comportamento de indivíduos (falácia ecológica) nem é causal."
            ),
            "fontes": [
                "elections/*.json (TSE)",
                "territorios.json (IBGE Censo 2022, FUNAI, INCRA)",
            ],
        },
        "correlacoes": out,
    }
    (D / "cruzamento_territorial.json").write_text(
        json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    return doc

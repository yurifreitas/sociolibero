"""Estatística descritiva e cautelosa para séries anuais curtas.

Tudo aqui é descrição, não causalidade. Séries anuais são autocorrelacionadas e têm poucos pontos:
o intervalo de confiança vem de bootstrap **em blocos móveis** de pares (preserva a dependência
temporal local); a semente é fixa, então o resultado é reprodutível.
"""

from __future__ import annotations

import math
from collections.abc import Mapping

import numpy as np
from scipy import stats

B_PADRAO = 2000
SEMENTE = 20260607


def bloco(n: int) -> int:
    """Tamanho do bloco: ~n^(1/3), no mínimo 2 (regra usual para séries curtas)."""
    return max(2, round(n ** (1 / 3)))


def _idx_blocos(n: int, b: int, rng: np.random.Generator) -> np.ndarray:
    k = math.ceil(n / b)
    ini = rng.integers(0, n - b + 1, k)
    return (ini[:, None] + np.arange(b)[None, :]).ravel()[:n]


def destendenciar(t: np.ndarray, v: np.ndarray) -> np.ndarray:
    """Resíduo da regressão linear em t (remove tendência linear)."""
    a, b = np.polyfit(t, v, 1)
    return v - (a * t + b)


def alinhar(
    x: Mapping[int, float],
    y: Mapping[int, float],
    lag: int = 0,
    ini: int | None = None,
    fim: int | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Pares (x[t], y[t+lag]) nos anos comuns; `ini`/`fim` limitam o ano t de y (t+lag)."""
    anos = sorted(
        t
        for t in x
        if (t + lag) in y
        and (ini is None or t + lag >= ini)
        and (fim is None or t + lag <= fim)
        and x[t] is not None
        and y[t + lag] is not None
        and math.isfinite(x[t])
        and math.isfinite(y[t + lag])
    )
    return (
        np.array(anos, float),
        np.array([x[t] for t in anos], float),
        np.array([y[t + lag] for t in anos], float),
    )


def correlacao(
    t: np.ndarray,
    x: np.ndarray,
    y: np.ndarray,
    tendencia: bool = False,
    B: int = B_PADRAO,
    seed: int = SEMENTE,
) -> dict:
    """Pearson e Spearman com IC95 (percentis) por bootstrap em blocos de pares.

    `tendencia=True` retira a tendência linear de x e y antes (séries com tendência secular, como
    temperatura e focos, geram correlação espúria por simples coincidência de tendência).
    """
    n = len(x)
    if n < 8:
        return {"n": n, "pearson": None, "ic95": None, "spearman": None, "bloco": None}
    if tendencia:
        x, y = destendenciar(t, x), destendenciar(t, y)
    r = float(np.corrcoef(x, y)[0, 1])
    rho = float(stats.spearmanr(x, y).statistic)
    b = bloco(n)
    rng = np.random.default_rng(seed)
    rs = []
    for _ in range(B):
        i = _idx_blocos(n, b, rng)
        xi, yi = x[i], y[i]
        if xi.std() == 0 or yi.std() == 0:
            continue
        rs.append(np.corrcoef(xi, yi)[0, 1])
    lo, hi = np.percentile(rs, [2.5, 97.5])
    return {
        "n": n,
        "pearson": round(r, 3),
        "ic95": [round(float(lo), 3), round(float(hi), 3)],
        "spearman": round(rho, 3),
        "bloco": b,
        "bootstrap": B,
        "destendenciado": tendencia,
    }


def diferenca_medias(
    y: np.ndarray,
    grupo: np.ndarray,
    B: int = B_PADRAO,
    seed: int = SEMENTE,
) -> dict:
    """Média de y no grupo (True) menos média nos demais; IC95 por bootstrap em blocos."""
    n = len(y)
    g = grupo.astype(bool)
    if g.sum() < 3 or (~g).sum() < 3:
        return {"n": n, "n_grupo": int(g.sum()), "valor": None, "ic95": None}
    d = float(y[g].mean() - y[~g].mean())
    b = bloco(n)
    rng = np.random.default_rng(seed)
    ds = []
    for _ in range(B):
        i = _idx_blocos(n, b, rng)
        gi, yi = g[i], y[i]
        if gi.sum() == 0 or (~gi).sum() == 0:
            continue
        ds.append(yi[gi].mean() - yi[~gi].mean())
    lo, hi = np.percentile(ds, [2.5, 97.5])
    return {
        "n": n,
        "n_grupo": int(g.sum()),
        "media_grupo": round(float(y[g].mean()), 3),
        "media_demais": round(float(y[~g].mean()), 3),
        "valor": round(d, 3),
        "ic95": [round(float(lo), 3), round(float(hi), 3)],
        "bloco": b,
        "bootstrap": B,
    }


def tendencia_linear(
    t: np.ndarray, v: np.ndarray, B: int = B_PADRAO, seed: int = SEMENTE
) -> dict:
    """Inclinação por década (OLS) com IC95 por bootstrap em blocos de pares (t, v)."""
    n = len(t)
    a = float(np.polyfit(t, v, 1)[0]) * 10
    b = bloco(n)
    rng = np.random.default_rng(seed)
    sl = []
    for _ in range(B):
        i = _idx_blocos(n, b, rng)
        if np.ptp(t[i]) == 0:
            continue
        sl.append(np.polyfit(t[i], v[i], 1)[0] * 10)
    lo, hi = np.percentile(sl, [2.5, 97.5])
    return {
        "n": n,
        "por_decada": round(a, 4),
        "ic95": [round(float(lo), 4), round(float(hi), 4)],
        "bloco": b,
        "bootstrap": B,
    }

"""Comparação espacial: um município é anômalo *em relação aos vizinhos*, não a uma média nacional.

Isso controla padrões regionais legítimos (voto por região, urbano/rural). z robusto =
(x − mediana dos vizinhos) / (1,4826·MAD dos vizinhos, com piso global).
"""

from __future__ import annotations

import numpy as np
from shapely.geometry import shape
from shapely.strtree import STRtree


def adjacency(
    features: list[dict], key: str = "ibge", tol: float = 1e-3
) -> dict[str, list[str]]:
    """Contiguidade 'queen' (compartilha borda ou vértice) via STRtree. `tol` em graus (~100 m)."""
    geoms = [shape(f["geometry"]).buffer(tol) for f in features]
    ids = [f["properties"][key] for f in features]
    tree = STRtree(geoms)
    out: dict[str, list[str]] = {i: [] for i in ids}
    for i, g in enumerate(geoms):
        for j in tree.query(g, predicate="intersects"):
            if j != i:
                out[ids[i]].append(ids[int(j)])
    return out


def robust_z(
    values: dict[str, float], nb: dict[str, list[str]], min_nb: int = 3
) -> dict[str, float | None]:
    """z robusto vs. vizinhos. Municípios com < `min_nb` vizinhos válidos ficam `None`."""
    arr = np.array([v for v in values.values() if v is not None and np.isfinite(v)])
    if arr.size == 0:
        return {k: None for k in values}
    gmad = 1.4826 * float(np.median(np.abs(arr - np.median(arr))))
    floor = max(0.25 * gmad, 1e-9)  # evita z gigante quando vizinhos são quase iguais
    out: dict[str, float | None] = {}
    for k, v in values.items():
        vs = [
            values[n]
            for n in nb.get(k, [])
            if values.get(n) is not None and np.isfinite(values[n])
        ]
        if v is None or not np.isfinite(v) or len(vs) < min_nb:
            out[k] = None
            continue
        med = float(np.median(vs))
        mad = 1.4826 * float(np.median(np.abs(np.array(vs) - med)))
        out[k] = float((v - med) / max(mad, floor))
    return out

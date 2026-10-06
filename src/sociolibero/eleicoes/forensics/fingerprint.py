"""Impressão digital eleitoral (Klimek et al. 2012): distribuição conjunta de comparecimento e
voto do vencedor por seção. Eleições limpas formam uma nuvem unimodal; fraude por enchimento de
urna cria um 'rabo' em direção a (100%, 100%); *fraude extrema* cria um pico nesse canto.

Também há 'bunching' legítimo (seções pequenas, zonas rurais, voto muito coeso), portanto o
indicador é comparado ao vizinho e à calibração sintética — nunca lido isoladamente.
"""

from __future__ import annotations

import numpy as np


def hist2d(turnout: np.ndarray, share: np.ndarray, bins: int = 50) -> dict:
    edges = np.linspace(0, 1, bins + 1)
    h, _, _ = np.histogram2d(turnout, share, bins=[edges, edges])
    return {
        "x_bins": edges.round(4).tolist(),
        "y_bins": edges.round(4).tolist(),
        "contagem": h.astype(int).tolist(),
    }


def bunching(
    turnout: np.ndarray, share: np.ndarray, t: float = 0.95, s: float = 0.95
) -> float | None:
    """Fração de seções com comparecimento E voto do líder ≥ limiares (canto 100/100)."""
    if turnout.size < 30:
        return None
    return float(np.mean((turnout >= t) & (share >= s)))

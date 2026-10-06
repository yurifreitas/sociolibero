"""Testes de dígitos: Benford (2º dígito) e uniformidade do último dígito.

Limitações que o código já impõe (e a UI repete):
- O 2º dígito de Benford só é aproximadamente válido para contagens que cobrem várias ordens de
  grandeza; seções eleitorais (~100-400 votos) violam isso, então o teste é *fraco* e pode dar
  falso positivo por viés estrutural (Deckert, Myagkov & Ordeshook 2011). Use como triagem.
- O último dígito é mais robusto (Beber & Scacco 2012), mas exige contagens grandes (≥ 10).
"""

from __future__ import annotations

import numpy as np
from scipy import stats

D1 = np.arange(1, 10)
BENFORD_2 = np.array(
    [np.log10(1 + 1 / (10 * D1 + d)).sum() for d in range(10)]
)  # P(2º dígito = d)
UNIFORME = np.full(10, 0.1)


def second_digit(x: np.ndarray) -> np.ndarray:
    x = np.asarray(x, dtype=np.int64)
    x = x[x >= 10]
    return (x // 10 ** (np.floor(np.log10(x)).astype(np.int64) - 1)) % 10


def last_digit(x: np.ndarray, min_count: int = 10) -> np.ndarray:
    """Último dígito de contagens ≥ `min_count` (contagens pequenas têm dígito final não uniforme)."""
    x = np.asarray(x, dtype=np.int64)
    return x[x >= min_count] % 10


def _chi2(digits: np.ndarray, expected: np.ndarray, min_n: int) -> dict:
    n = int(digits.size)
    obs = np.bincount(digits, minlength=10).astype(float)
    if n < min_n:
        return {
            "n": n,
            "p": None,
            "chi2": None,
            "observado": obs.tolist(),
            "esperado": (expected * n).tolist(),
        }
    exp = expected * n
    chi2 = float(((obs - exp) ** 2 / exp).sum())
    return {
        "n": n,
        "p": float(stats.chi2.sf(chi2, df=9)),
        "chi2": chi2,
        "observado": obs.tolist(),
        "esperado": exp.tolist(),
    }


def benford_2bl(counts: np.ndarray, min_n: int = 100) -> dict:
    return _chi2(second_digit(counts), BENFORD_2, min_n)


def last_digit_uniform(
    counts: np.ndarray, min_n: int = 100, min_count: int = 50
) -> dict:
    return _chi2(last_digit(counts, min_count), UNIFORME, min_n)


def multiples_excess(counts: np.ndarray) -> float | None:
    """Excesso de contagens múltiplas de 5 vs. 20% esperado (números 'redondos' fabricados)."""
    x = np.asarray(counts, dtype=np.int64)
    x = x[x >= 10]
    if x.size < 50:
        return None
    k = int((x % 5 == 0).sum())
    return float(stats.binomtest(k, x.size, 0.2, alternative="greater").pvalue)

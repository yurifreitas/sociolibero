"""Validação sintética dos detectores: fraude injetada com verdade conhecida.

Pergunta respondida: *se houvesse fraude do tipo X em fração f das seções de um município, com que
frequência cada detector dispararia (TPR), e com que frequência dispara sem fraude (FPR)?*
Detector sem poder para um tipo de fraude NÃO pode ser citado como evidência de ausência dela.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from scipy import stats

from . import digits, fingerprint

ALPHA = 0.05
DETECTORES = ("ld_p", "b2_p", "rho_p", "mult5_p", "bunching")


def simulate_null(
    rng: np.random.Generator, n_sec: int = 300, mu: float = 0.5
) -> dict[str, np.ndarray]:
    aptos = np.clip(rng.normal(300, 60, n_sec), 80, 600).round().astype(int)
    turnout = np.clip(rng.normal(0.80, 0.06, n_sec), 0.4, 0.97)
    comp = rng.binomial(aptos, turnout)
    valid = rng.binomial(comp, 0.97)
    share = np.clip(rng.normal(mu, 0.08, n_sec), 0.05, 0.95)
    a = rng.binomial(valid, share)
    return {"aptos": aptos, "comp": comp, "valid": valid, "a": a}


def inject_stuffing(rng, s: dict, f: float) -> dict:
    """Enchimento: em fração f das seções, comparecimento ≈ 98% e votos extras todos para A."""
    s = {k: v.copy() for k, v in s.items()}
    idx = rng.random(s["aptos"].size) < f
    target = np.minimum(s["aptos"][idx], (s["aptos"][idx] * 0.98).round().astype(int))
    extra = np.maximum(target - s["comp"][idx], 0)
    s["comp"][idx] += extra
    s["valid"][idx] += extra
    s["a"][idx] += extra
    return s


def inject_shift(rng, s: dict, f: float, frac: float = 0.15) -> dict:
    """Transferência: em fração f das seções, 15% dos votos de B vão para A (comparecimento intacto)."""
    s = {k: v.copy() for k, v in s.items()}
    idx = rng.random(s["aptos"].size) < f
    b = s["valid"][idx] - s["a"][idx]
    s["a"][idx] += rng.binomial(b, frac)
    return s


def inject_fabrication(rng, s: dict, f: float) -> dict:
    """Números fabricados: em fração f das seções, contagens arredondadas para múltiplos de 5."""
    s = {k: v.copy() for k, v in s.items()}
    idx = rng.random(s["aptos"].size) < f
    s["a"][idx] = (s["a"][idx] / 5).round().astype(int) * 5
    return s


def detect(s: dict) -> dict[str, float | None]:
    valid = np.maximum(s["valid"], 1)
    turnout = s["comp"] / s["aptos"]
    share = s["a"] / valid
    rho = stats.spearmanr(turnout, share, alternative="greater")
    bunch = fingerprint.bunching(turnout, share)
    return {
        "ld_p": digits.last_digit_uniform(s["a"], min_n=30)["p"],
        "b2_p": digits.benford_2bl(s["a"], min_n=30)["p"],
        "rho_p": float(rho.pvalue),
        "mult5_p": digits.multiples_excess(s["a"]),
        "bunching": None
        if bunch is None
        else float(bunch),  # só sinal: dispara se > 2%
    }


def _fires(name: str, v: float | None) -> bool:
    if v is None:
        return False
    return v > 0.02 if name == "bunching" else v < ALPHA


CENARIOS = {
    "enchimento": (
        "Enchimento de urna (comparecimento ≈ 98%, votos extras para A)",
        inject_stuffing,
    ),
    "transferencia": (
        "Transferência de 15% dos votos de B para A (comparecimento intacto)",
        inject_shift,
    ),
    "fabricacao": (
        "Números fabricados (contagens arredondadas para múltiplos de 5)",
        inject_fabrication,
    ),
}


def run_validation(n_sim: int = 300, n_sec: int = 300, seed: int = 3) -> dict:
    rng = np.random.default_rng(seed)
    intens = [0.02, 0.05, 0.10, 0.20, 0.40]
    null_hits = {d: 0 for d in DETECTORES}
    for _ in range(n_sim):
        r = detect(simulate_null(rng, n_sec))
        for d in DETECTORES:
            null_hits[d] += _fires(d, r[d])
    fpr = {d: null_hits[d] / n_sim for d in DETECTORES}
    cenarios = []
    for key, (desc, fn) in CENARIOS.items():
        tpr = {d: [] for d in DETECTORES}
        for f in intens:
            hits = {d: 0 for d in DETECTORES}
            for _ in range(n_sim):
                r = detect(fn(rng, simulate_null(rng, n_sec), f))
                for d in DETECTORES:
                    hits[d] += _fires(d, r[d])
            for d in DETECTORES:
                tpr[d].append(round(hits[d] / n_sim, 3))
        cenarios.append(
            {
                "nome": key,
                "descricao": desc,
                "intensidade": intens,
                "detectores": {
                    d: {"tpr": tpr[d], "fpr": round(fpr[d], 3)} for d in DETECTORES
                },
            }
        )
    return {
        "parametros": {
            "n_sim": n_sim,
            "secoes_por_municipio": n_sec,
            "alpha": ALPHA,
            "seed": seed,
        },
        "nota": (
            "Dados 100% sintéticos (nulo: comparecimento ~N(0,80; 0,06), voto de A ~N(0,5; 0,08)). "
            "O FPR real em dados verdadeiros pode ser maior por heterogeneidade legítima; "
            "TPR baixo = o detector não enxerga aquela fraude, e isso não prova ausência dela."
        ),
        "cenarios": cenarios,
    }


def export(
    path: str = "web/public/data/forensics/validacao_sintetica.json", **kw
) -> dict:
    r = run_validation(**kw)
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(r, ensure_ascii=False, indent=1), encoding="utf-8")
    return r

"""Cenários 2027-2038: alavancas econômicas + indicações ao STF filtradas pelo Senado."""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from . import data, economy, institutions
from .economy import Levers
from .institutions import Nominee

# Hipóteses de indicados. Os parâmetros são JULGAMENTOS do modelo, editáveis — não fatos.
TECNICO_ALIADO = Nominee(
    "Aliado técnico", ideology=0.8, controversy=0.2, meets_art101=0.95
)
MILITANTE = Nominee(
    "Aliado militante", ideology=0.9, controversy=0.6, meets_art101=0.85
)
# Hipótese pedida: figura sem trajetória jurídica. `meets_art101` baixo porque o art. 101
# exige notável saber jurídico e reputação ilibada (verificar status jurídico/eleitoral atual).
HIPOTESE_MARCAL = Nominee(
    "Hipótese: Pablo Marçal", ideology=0.8, controversy=0.7, meets_art101=0.05
)


@dataclass(frozen=True)
class Scenario:
    key: str
    label: str
    levers: Levers
    nominees: list[Nominee] = field(default_factory=list)
    base_risk: float = 0.0


SCENARIOS = [
    Scenario(
        "lula",
        "Lula reeleito, Congresso de direita",
        Levers(
            primary_target=0.0,
            institutional_risk=0.2,
            bc_erosion=0.10,
            supply_reform=0.1,
            fiscal_credibility=0.5,
        ),
    ),
    Scenario(
        "pragmatico", "Flávio + centrão pragmático", Levers(0.8, 0.15, 0.05, 0.4, 0.8)
    ),
    Scenario(
        "hegemonia",
        "Flávio + hegemonia da direita radical",
        Levers(-0.5, 0.3, 0.40, 0.3, 0.4),
        [TECNICO_ALIADO, MILITANTE, MILITANTE],
        base_risk=0.3,
    ),
    Scenario(
        "extremo",
        "Hipótese extrema: STF com indicados de alto conflito",
        Levers(-1.0, 0.5, 0.60, 0.2, 0.3),
        [MILITANTE, MILITANTE, HIPOTESE_MARCAL],
        base_risk=0.5,
    ),
]

# Acima disso o modelo não vale como projeção: indica ruptura de regime (reestruturação,
# dominância fiscal, ajuste forçado), não uma trajetória a extrapolar.
BREAK_DEBT = 120.0

# Dado Flávio vence, peso de cada cenário (SUPOSIÇÃO — principal incerteza do modelo).
WEIGHTS_IF_FLAVIO = {"pragmatico": 0.50, "hegemonia": 0.35, "extremo": 0.15}


def effective_risk(sc: Scenario, rng: np.random.Generator) -> tuple[float, list[float]]:
    """Risco institucional = base + 0,1 por vaga do STF esperada de ser capturada."""
    probs = [institutions.senate_approval_prob(n, rng, 5_000) for n in sc.nominees]
    return min(
        1.0,
        sc.base_risk + 0.1 * sum(p * n.controversy for p, n in zip(probs, sc.nominees)),
    ), probs


def run(seed: int = 7, n: int = 2000) -> dict:
    rng = np.random.default_rng(seed)
    base = data.load_macro_base()
    p_flavio = institutions.runoff_win_prob(rng)

    paths, rows, approvals, breach = {}, [], {}, {}
    for sc in SCENARIOS:
        risk, probs = effective_risk(sc, rng)
        approvals[sc.key] = {n.name: round(p, 3) for n, p in zip(sc.nominees, probs)}
        lv = Levers(
            **{
                **sc.levers.__dict__,
                "institutional_risk": max(sc.levers.institutional_risk, risk),
            }
        )
        # incerteza de parâmetro: juro neutro real não é identificado pelos dados (backtest)
        params = economy.DEFAULT.with_(neutral_real=rng.uniform(3.5, 5.5, n))
        paths[sc.key] = economy.simulate(base, lv, rng, n, params)
        breach[sc.key] = float((paths[sc.key]["debt"].max(axis=1) > BREAK_DEBT).mean())
        for var, arr in paths[sc.key].items():
            for q in (10, 50, 90):
                for yr, v in zip(economy.YEARS, np.percentile(arr, q, axis=0)):
                    rows.append(
                        {
                            "scenario": sc.key,
                            "var": var,
                            "q": q,
                            "year": int(yr),
                            "value": round(float(v), 2),
                        }
                    )

    # mistura ponderada pela chance de vitória (probabilística, amostrando trajetórias)
    w = {
        "lula": 1 - p_flavio,
        **{k: p_flavio * v for k, v in WEIGHTS_IF_FLAVIO.items()},
    }
    mix = {}
    for var in ("debt", "selic", "ipca", "gdp"):
        pool = np.concatenate([paths[k][var][: int(round(w[k] * n))] for k in w])
        for q in (10, 50, 90):
            for yr, v in zip(economy.YEARS, np.percentile(pool, q, axis=0)):
                rows.append(
                    {
                        "scenario": "mix",
                        "var": var,
                        "q": q,
                        "year": int(yr),
                        "value": round(float(v), 2),
                    }
                )
        mix[var] = np.percentile(pool, 50, axis=0)

    return {
        "macro_base": base,
        "p_flavio": p_flavio,
        "weights": w,
        "senate_approval": approvals,
        "table": pd.DataFrame(rows),
        "mix_median": mix,
        "breach": breach,
    }

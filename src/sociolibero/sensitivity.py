"""Sensibilidade (tornado): o que mais move a dívida/PIB em 2035, por cenário."""

from __future__ import annotations

from dataclasses import fields

import numpy as np
import pandas as pd

from . import data, economy
from .economy import DEFAULT, Levers, Params
from .scenarios import SCENARIOS

IDX = 2035 - int(economy.YEARS[0])
LEVER_RANGE = {
    "primary_target": 1.0,  # ± pp PIB
    "institutional_risk": 0.2,
    "bc_erosion": 0.2,
    "supply_reform": 0.3,
    "fiscal_credibility": 0.2,
}
PARAM_FRAC = 0.25  # ± 25% em cada parâmetro estrutural


def _debt(base, lv: Levers, p: Params) -> float:
    rng = np.random.default_rng(0)
    return float(economy.simulate(base, lv, rng, 1, p, shocks=False)["debt"][0, IDX])


def tornado() -> pd.DataFrame:
    base = data.load_macro_base()
    rows = []
    for sc in SCENARIOS:
        lv0 = sc.levers
        ref = _debt(base, lv0, DEFAULT)
        for name, delta in LEVER_RANGE.items():
            v = getattr(lv0, name)
            lo, hi = (
                _debt(base, Levers(**{**lv0.__dict__, name: v - delta}), DEFAULT),
                _debt(base, Levers(**{**lv0.__dict__, name: v + delta}), DEFAULT),
            )
            rows.append((sc.key, f"alavanca:{name}", ref, lo, hi))
        for f in fields(Params):
            v = getattr(DEFAULT, f.name)
            lo = _debt(base, lv0, DEFAULT.with_(**{f.name: v * (1 - PARAM_FRAC)}))
            hi = _debt(base, lv0, DEFAULT.with_(**{f.name: v * (1 + PARAM_FRAC)}))
            rows.append((sc.key, f"param:{f.name}", ref, lo, hi))
    df = pd.DataFrame(
        rows, columns=["scenario", "fator", "ref", "dívida_lo", "dívida_hi"]
    )
    df["swing"] = (df.dívida_hi - df.dívida_lo).abs()
    return df.sort_values(["scenario", "swing"], ascending=[True, False])

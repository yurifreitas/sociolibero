"""Backtest 2015-2025 + calibração + sensibilidade.

Backtest: parte do estado de dez/2014 e roda o modelo usando o primário *observado* como
política exógena; compara Selic, IPCA e dívida/PIB com o realizado. Calibra por busca aleatória
em 2015-2021 e testa fora da amostra em 2022-2025.
"""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path

import numpy as np

from . import economy
from .data import MacroBase
from .economy import Levers, Params

CACHE = Path("data/hist.json")
SERIES = {
    "debt": 13762,
    "selic": 4189,
    "ipca": 13522,
    "primary": 5793,
    "gdp": 7326,
}  # primary: NFSP, + = déficit


def _sgs(code: int) -> list[dict]:
    url = (
        f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados"
        "?formato=json&dataInicial=01/01/2014&dataFinal=31/12/2025"
    )
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def load_history() -> dict[str, dict[int, float]]:
    """Valores de dezembro por ano (2014-2025), em cache local."""
    if CACHE.exists():
        raw = json.loads(CACHE.read_text())
        return {k: {int(y): v for y, v in d.items()} for k, d in raw.items()}
    out: dict[str, dict[int, float]] = {}
    for name, code in SERIES.items():
        rows = _sgs(code)
        key = "01/01/" if name == "gdp" else "01/12/"  # PIB é anual (rótulo 01/01/AAAA)
        out[name] = {
            int(r["data"][-4:]): float(r["valor"])
            for r in rows
            if r["data"].startswith(key)
        }
    out["primary"] = {y: -v for y, v in out["primary"].items()}  # + = superávit
    CACHE.parent.mkdir(exist_ok=True)
    CACHE.write_text(json.dumps(out))
    return out


# Risco institucional/credibilidade históricos: proxies *julgados* (0-1), editáveis.
# 2015-16 crise fiscal e impeachment; 2020 pandemia; 2021-22 teto furado/ruído institucional.
HIST_RISK = {
    2015: 0.45,
    2016: 0.45,
    2017: 0.2,
    2018: 0.15,
    2019: 0.1,
    2020: 0.3,
    2021: 0.4,
    2022: 0.4,
    2023: 0.2,
    2024: 0.25,
    2025: 0.25,
}
HIST_CRED = {
    2015: 0.3,
    2016: 0.4,
    2017: 0.6,
    2018: 0.6,
    2019: 0.7,
    2020: 0.5,
    2021: 0.4,
    2022: 0.4,
    2023: 0.55,
    2024: 0.45,
    2025: 0.45,
}


def backtest(
    params: Params, h: dict[str, dict[int, float]], years: range
) -> dict[str, np.ndarray]:
    """Roda ano a ano com risco/credibilidade variando; reinicia do estado observado no 1º ano."""
    y0 = years[0] - 1
    base = MacroBase(
        h["debt"][y0], h["selic"][y0], h["ipca"][y0], 0.0, h["primary"][y0], "hist"
    )
    rng = np.random.default_rng(0)
    out = {k: [] for k in ("debt", "selic", "ipca")}
    state = base
    for y in years:
        lv = Levers(0.0, HIST_RISK[y], 0.1, 0.0, HIST_CRED[y])
        r = economy.simulate(
            state,
            lv,
            rng,
            1,
            params,
            horizon=1,
            primary_path=np.array([h["primary"][y]]),
            shocks=False,
        )
        for k in out:
            out[k].append(float(r[k][0, 0]))
        # realimenta com o estado *simulado* (não com o observado): mede erro acumulado de verdade
        state = MacroBase(
            out["debt"][-1],
            out["selic"][-1],
            out["ipca"][-1],
            0.0,
            h["primary"][y],
            "sim",
        )
    return {k: np.array(v) for k, v in out.items()}


def one_step(params: Params, h: dict, years: range) -> dict[str, np.ndarray]:
    """Previsão 1 passo: parte do estado *observado* de y-1 (sem acumular erro)."""
    out = {k: [] for k in ("debt", "selic", "ipca")}
    rng = np.random.default_rng(0)
    for y in years:
        st = MacroBase(
            h["debt"][y - 1],
            h["selic"][y - 1],
            h["ipca"][y - 1],
            h["gdp"][y - 1],
            h["primary"][y - 1],
            "obs",
        )
        lv = Levers(0.0, HIST_RISK[y], 0.1, 0.0, HIST_CRED[y])
        r = economy.simulate(
            st,
            lv,
            rng,
            1,
            params,
            horizon=1,
            primary_path=np.array([h["primary"][y]]),
            shocks=False,
        )
        for k in out:
            out[k].append(float(r[k][0, 0]))
    return {k: np.array(v) for k, v in out.items()}


SCALE = {"debt": 5.0, "selic": 2.0, "ipca": 1.5}


def onestep_rmse(params: Params, h: dict, years: range) -> dict[str, float]:
    sim = one_step(params, h, years)
    return {
        k: float(np.sqrt(np.mean((sim[k] - np.array([h[k][y] for y in years])) ** 2)))
        for k in sim
    }


def naive_rmse(h: dict, years: range) -> dict[str, float]:
    """Benchmark ingênuo: o ano que vem = este ano."""
    return {
        k: float(np.sqrt(np.mean([(h[k][y] - h[k][y - 1]) ** 2 for y in years])))
        for k in SCALE
    }


def loss(params: Params, h: dict, years: range) -> float:
    r = onestep_rmse(params, h, years)
    return float(sum((r[k] / SCALE[k]) ** 2 for k in SCALE))


FIT = {  # parâmetros livres e limites (poucos, para não sobreajustar 7 pontos)
    "neutral_real": (3.0, 7.0),
    "taylor_pi": (0.0, 2.0),
    "taylor_gap": (0.0, 1.5),
    "implicit": (0.6, 1.0),
}


def fit(h: dict, years: range, draws: int = 4000, seed: int = 1) -> Params:
    rng = np.random.default_rng(seed)
    best, best_l = economy.DEFAULT, loss(economy.DEFAULT, h, years)
    for _ in range(draws):
        cand = economy.DEFAULT.with_(
            **{k: float(rng.uniform(*b)) for k, b in FIT.items()}
        )
        ll = loss(cand, h, years)
        if ll < best_l:
            best, best_l = cand, ll
    return best


def report() -> dict:
    h = load_history()
    train, test = range(2015, 2022), range(2022, 2026)
    fitted = fit(h, train)
    out = {"naive": {"treino": naive_rmse(h, train), "teste": naive_rmse(h, test)}}
    for label, p in (("padrão", economy.DEFAULT), ("calibrado", fitted)):
        out[label] = {
            "treino": onestep_rmse(p, h, train),
            "teste": onestep_rmse(p, h, test),
            "params": p.as_dict(),
        }
    return {"report": out, "fitted": fitted, "hist": h}

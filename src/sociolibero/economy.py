"""Modelo macro anual reduzido com canal de risco institucional.

Não é DSGE: é uma dinâmica de dívida + regra de juros + expectativas. Os parâmetros em
`Params` são calibrados em `calibrate.py` contra a história 2015-2025.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, replace

import numpy as np

from .data import MacroBase

YEARS = np.arange(2027, 2039)
TARGET_INFLATION = 3.0
POTENTIAL_GROWTH = 2.0


@dataclass(frozen=True)
class Levers:
    """Alavancas de um cenário. Todas editáveis."""

    primary_target: float  # resultado primário alvo, % PIB
    institutional_risk: float  # 0-1: erosão de BC/STF/regras fiscais
    bc_erosion: float  # 0-1: perda de independência do BC (ancoragem)
    supply_reform: float  # pp de PIB potencial/ano por reformas
    fiscal_credibility: float  # 0-1: quanto o mercado acredita no alvo primário


@dataclass(frozen=True)
class Params:
    """Parâmetros estruturais (calibráveis)."""

    neutral_real: float = 5.0  # juro real neutro
    prem_base: float = 1.0  # prêmio de risco base (pp)
    prem_debt: float = 0.8  # pp de prêmio por 10pp de dívida acima de 75%
    prem_inst: float = 2.5  # pp de prêmio por unidade de risco institucional
    prem_cred: float = 2.0  # amplificação do prêmio pela falta de credibilidade
    pi_bc: float = 3.0  # pp de inflação de longo prazo por unidade de erosão do BC
    pi_debt: float = 0.6  # pp de inflação por dominância fiscal
    implicit: float = 0.8  # custo implícito da dívida / Selic
    g_rate: float = 0.30  # pp de PIB por pp de juro real acima do neutro
    g_inst: float = 1.2  # pp de PIB por unidade de risco institucional
    reaction: float = 0.14  # reação do primário à dívida acima de 80%
    taylor_pi: float = 0.5  # resposta da Selic ao desvio da inflação (acima do princípio de Taylor = 0.5 extra)
    taylor_gap: float = 0.5  # resposta da Selic ao hiato do produto

    def with_(self, **kw: float) -> Params:
        return replace(self, **kw)

    def as_dict(self) -> dict[str, float]:
        return asdict(self)


DEFAULT = Params()


def simulate(
    base: MacroBase,
    lv: Levers,
    rng: np.random.Generator,
    n: int = 2000,
    params: Params = DEFAULT,
    horizon: int | None = None,
    primary_path: np.ndarray | None = None,
    shocks: bool = True,
) -> dict[str, np.ndarray]:
    """Trajetórias (n, T) de dívida, Selic, IPCA e PIB.

    `primary_path` (T,) substitui a regra de política por um primário observado (backtest);
    `shocks=False` torna a simulação determinística.
    """
    P = params
    T = horizon or len(YEARS)
    s = 1.0 if shocks else 0.0
    debt, selic, ipca, gdp = (np.empty((n, T)) for _ in range(4))

    d = np.full(n, base.debt_gross_gdp)
    i_prev = np.full(n, base.selic)
    pi_prev = np.full(n, base.ipca_expect)
    p_prev = np.full(n, base.primary)
    gap = np.full(
        n, base.gdp_growth - POTENTIAL_GROWTH
    )  # hiato: persiste e acumula desvios do PIB

    for t in range(T):
        if primary_path is not None:
            p = np.full(n, float(primary_path[t]))
        else:
            # reação fiscal (tipo Bohn): dívida acima de 80% força ajuste; mais forte com credibilidade
            react = (
                P.reaction
                * (0.3 + 0.7 * lv.fiscal_credibility)
                * np.clip(d - 80.0, -10, 40)
            )
            p = (
                0.6 * p_prev
                + 0.4 * (lv.primary_target + react)
                + s * rng.normal(0, 0.35, n)
            )
        debt_excess = np.maximum(d - 75.0, 0) / 10.0
        premium = (
            P.prem_base
            + P.prem_debt * debt_excess
            + P.prem_inst * lv.institutional_risk
            + P.prem_cred * (1 - lv.fiscal_credibility) * debt_excess
        )
        pi_lr = (
            TARGET_INFLATION
            + P.pi_bc * lv.bc_erosion
            + P.pi_debt * debt_excess * (1 - lv.fiscal_credibility)
        )
        pi = np.maximum(0.5 * pi_prev + 0.5 * pi_lr + s * rng.normal(0, 0.5, n), 1.0)
        taylor = P.taylor_pi * (pi - TARGET_INFLATION) + P.taylor_gap * gap
        i = (
            0.6 * i_prev
            + 0.4 * (P.neutral_real + pi + premium + taylor)
            + s * rng.normal(0, 0.3, n)
        )
        i = np.maximum(i, 2.0)
        real = i - pi
        g = (
            POTENTIAL_GROWTH
            + lv.supply_reform
            - P.g_rate * (real - P.neutral_real)
            - P.g_inst * lv.institutional_risk
            + s * rng.normal(0, 0.9, n)
        )
        gap = 0.6 * gap + (g - POTENTIAL_GROWTH)
        nominal_g = (1 + g / 100) * (1 + pi / 100) - 1
        d = d * (1 + P.implicit * i / 100) / (1 + nominal_g) - p

        debt[:, t], selic[:, t], ipca[:, t], gdp[:, t] = d, i, pi, g
        i_prev, pi_prev, p_prev = i, pi, p

    return {"debt": debt, "selic": selic, "ipca": ipca, "gdp": gdp}

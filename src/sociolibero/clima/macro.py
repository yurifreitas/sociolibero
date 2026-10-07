"""Integração opcional do choque climático no modelo macro (`economy.Levers.climate_shock`).

`climate_shock` (pp de PIB por ano) e `climate_premium` (pp de prêmio de risco) são **SUPOSIÇÕES de
severidade**, nunca estimativas deste projeto: os dados de `relacoes` são correlações em séries curtas e
não identificam um efeito causal que se possa projetar. Com os dois em 0.0 (padrão) o modelo devolve
exatamente os mesmos números de antes (teste de regressão em tests/test_clima.py).
"""

from __future__ import annotations

from dataclasses import replace

import numpy as np

from .. import data, economy

# SUPOSIÇÃO: rótulos de severidade. A faixa 0,1-0,4 pp/ano é a ordem de grandeza que se obtém ao
# converter, de modo grosseiro, estimativas publicadas de perda de nível do PIB (ver ANCORAS).
SEVERIDADES = {
    "leve": {"climate_shock": 0.1, "climate_premium": 0.1},
    "moderado": {"climate_shock": 0.3, "climate_premium": 0.3},
    "severo": {"climate_shock": 0.6, "climate_premium": 0.6},
}
GRADE_SHOCK = (0.05, 0.1, 0.2, 0.3, 0.45, 0.6)
GRADE_PREMIO = (0.0, 0.25, 0.5, 1.0)

SUPOSICAO_TXT = (
    "SUPOSIÇÃO: os valores de climate_shock e climate_premium são severidades hipotéticas, escolhidas para "
    "mostrar a sensibilidade do modelo, não estimativas deste projeto nem previsões. As correlações em `relacoes` "
    "(séries anuais curtas) não identificam efeito causal que possa ser projetado. O choque entra como perda "
    "constante de crescimento em todo o horizonte (efeito permanente sobre o nível do PIB), sem dinâmica de "
    "adaptação, sem choque de oferta de alimentos/energia sobre a inflação e sem efeito sobre o PIB potencial; o "
    "prêmio entra somado ao prêmio de risco da Selic. Efeitos regionais e distributivos ficam fora."
)

ANCORAS = [
    {
        "fonte": "G20 Climate Risk Atlas - Brasil (CMCC/Enel Foundation)",
        "dado": "perda de 2,79% do PIB até 2050 em trajetória de alta emissão (0,06% na de baixa)",
        "equivale_a_pp_por_ano": round(2.79 / 25, 3),
        "conta": "2,79% de perda de nível acumulada em ~25 anos (2025-2050) = ~0,11 pp de crescimento por ano. Conta grosseira; o estudo não detalha a metodologia na página lida.",
    },
    {
        "fonte": "Estudo Estratégico MPO/BID (2025)",
        "dado": "perda cumulativa 2025-2050 de R$ 10,3 a 17,1 tri, 89% a 146% do PIB de 2024 (4 C contra 2 C e 1,5 C)",
        "equivale_a_pp_por_ano": [0.3, 0.45],
        "conta": "Perda média anual de 3,4% a 5,6% do PIB de 2024 em 26 anos corresponde a um nível de PIB em 2050 ~7-11% menor, ou ~0,3-0,45 pp por ano de crescimento, supondo perda crescente e linear no tempo. Conta grosseira, depende de como o estudo cumula valores (correntes do modelo).",
    },
    {
        "fonte": "SUPOSIÇÃO do projeto",
        "dado": "severo = 0,6 pp/ano acima do que as duas estimativas acima sustentam",
        "equivale_a_pp_por_ano": 0.6,
        "conta": "Cenário de estresse para sensibilidade (inclui eventos extremos, queda de produtividade agrícola e hídrica, risco de inflexão da Amazônia), não calibrado em dado.",
    },
]


def _rodar(lv: economy.Levers, n: int, seed: int = 7) -> dict[str, np.ndarray]:
    """Mesmas sementes e base macro offline (data.FALLBACK): diferenças pareadas, reprodutíveis."""
    rng = np.random.default_rng(seed)
    params = economy.DEFAULT.with_(neutral_real=rng.uniform(3.5, 5.5, n))
    return economy.simulate(data.FALLBACK, lv, rng, n, params)


def _delta(tr: dict, ref: dict, ano: int) -> dict:
    j = ano - int(economy.YEARS[0])
    out = {}
    for v in ("debt", "selic", "ipca", "gdp"):
        d = tr[v][:, j] - ref[v][:, j]
        out[v] = {
            "mediana": round(float(np.median(tr[v][:, j])), 2),
            "delta_mediano": round(float(np.median(d)), 2),
            "delta_p10": round(float(np.percentile(d, 10)), 2),
            "delta_p90": round(float(np.percentile(d, 90)), 2),
        }
    # PIB em nível acumulado até o ano (trajetórias pareadas)
    cum = np.exp(
        np.log1p(tr["gdp"][:, : j + 1] / 100).sum(axis=1)
        - np.log1p(ref["gdp"][:, : j + 1] / 100).sum(axis=1)
    )
    out["nivel_pib_vs_referencia_pct"] = round(float(100 * (np.median(cum) - 1)), 2)
    return out


def integracao(n: int = 2000) -> dict:
    from ..scenarios import SCENARIOS

    por_chave = {s.key: s.levers for s in SCENARIOS}
    prag = por_chave["pragmatico"]
    ref = _rodar(prag, n)
    res: dict = {}
    for nome, kw in SEVERIDADES.items():
        tr = _rodar(replace(prag, **kw), n)
        res[nome] = {
            "alavancas": kw,
            "2030": _delta(tr, ref, 2030),
            "2035": _delta(tr, ref, 2035),
            "2038": _delta(tr, ref, 2038),
        }
    por_cenario = {}
    for chave, lv in por_chave.items():
        r0 = _rodar(lv, n)
        por_cenario[chave] = {
            nome: {
                "delta_divida_pib_2035_pp": _delta(
                    _rodar(replace(lv, **kw), n), r0, 2035
                )["debt"]["delta_mediano"]
            }
            for nome, kw in SEVERIDADES.items()
        }
    sens = []
    for s in GRADE_SHOCK:
        for p in GRADE_PREMIO:
            d = _delta(
                _rodar(replace(prag, climate_shock=s, climate_premium=p), n), ref, 2035
            )
            sens.append(
                {
                    "climate_shock_pp_ano": s,
                    "climate_premium_pp": p,
                    "delta_divida_pib_2035_pp": d["debt"]["delta_mediano"],
                    "delta_selic_2035_pp": d["selic"]["delta_mediano"],
                    "delta_ipca_2035_pp": d["ipca"]["delta_mediano"],
                    "delta_pib_2035_pp": d["gdp"]["delta_mediano"],
                    "nivel_pib_2035_vs_referencia_pct": d[
                        "nivel_pib_vs_referencia_pct"
                    ],
                }
            )
    return {
        "suposicao": SUPOSICAO_TXT,
        "alavancas": {
            "climate_shock": "pp de PIB perdidos por ano (padrão 0.0)",
            "climate_premium": "pp adicionais de prêmio de risco (padrão 0.0)",
        },
        "cenario_referencia": "pragmatico (scenarios.py) com climate_shock=0 e climate_premium=0; sementes e choques idênticos; "
        "base macro offline (data.FALLBACK). Qualquer `tech_productivity` do cenário é preservado.",
        "ancoras_ordem_de_grandeza": ANCORAS,
        "severidades_suposicao": res,
        "por_cenario_politico": por_cenario,
        "sensibilidade": sens,
        "leitura": "Deltas são medianas das diferenças pareadas por trajetória. Cada 0,1 pp/ano de perda de crescimento "
        "acumula ~1% de nível em 10 anos; o efeito na dívida/PIB vem do denominador menor e do prêmio, e na Selic "
        "do hiato (a política monetária afrouxa quando o PIB cai). Não é previsão.",
    }

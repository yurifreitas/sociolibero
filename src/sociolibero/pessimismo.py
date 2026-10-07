"""Testes de estresse pessimistas: CENÁRIOS DE RISCO, não previsões.

Reaproveita `economy.simulate` e o catálogo de `decisoes.py` sem alterar nenhum dos dois. Tudo é
offline e determinístico dadas as sementes: a base macro é `data.FALLBACK` (nunca a rede), para
que a saída seja reproduzível. Cinco blocos:

1. eficiência de execução (`execution_efficiency` ∈ [0,1]): benefícios das decisões × eficiência,
   custos integrais; varredura 100% → 40% e ranking de fragilidade;
2. vazamento/desperdício como choque de primário efetivo e de oferta;
3. cenário adverso composto + reverse stress test;
4. liderança judicial (vagas do STF) como mecanismo de risco institucional;
5. fragilidade por setor.

A eficiência NÃO é medida: as âncoras vêm de proxies do repositório (obras federais paralisadas,
execução de emendas) e são rotuladas como tal. O padrão 1.0 reproduz os resultados atuais bit a
bit (teste de regressão).
"""

from __future__ import annotations

import itertools
import json
from dataclasses import dataclass, replace
from datetime import date
from pathlib import Path

import numpy as np

from . import corrupcao, data, decisoes, economy, institutions, scenarios
from .economy import DEFAULT, YEARS, Levers

SAIDA = "web/public/data/pessimismo.json"
VISOES = "web/public/data/visoes_pessimistas.json"
AVISO = "cenários de risco, não previsões"

BASE = data.FALLBACK  # offline por construção
SEMENTES = (7, 11, 13, 17, 19)
N_PADRAO = 2000
ANOS_REL = (2030, 2035, 2038)
IDX = {int(y): i for i, y in enumerate(YEARS)}
BREAK = scenarios.BREAK_DEBT
NEUTRO_CENTRAL = 4.5  # centro do sorteio U(3,5; 5,5) de scenarios.run (determinístico)
EFICIENCIAS = (1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4)

# Âncoras de eficiência: proxies do repositório (custo_corrupcao.json), NÃO uma medida de eficiência.
ANCORAS_EFICIENCIA = {
    "obras_federais_paralisadas_2023": {
        "valor": round(1 - 8603 / 21007, 3),
        "leitura": "fração de obras com recursos federais NÃO paralisadas (8.603 de 21.007 paradas; TCU, 18/10/2023, verificado=true)",
    },
    "obras_federais_paralisadas_2025": {
        "valor": round(1 - 11469 / 22621, 3),
        "leitura": "idem, painel TCU até abr/2025 (11.469 de 22.621 paradas; verificado=true)",
    },
    "execucao_de_emendas_2025": {
        "valor": 0.67,
        "leitura": "execução de 67% dos valores empenhados em emendas (fonte secundária, verificado=false)",
    },
}
# Central pessimista = 0,6, dentro da faixa dos proxies (0,49-0,67); a faixa de varredura (0,4-1,0)
# é mais larga que a dos proxies de propósito.
EFICIENCIA_CENTRAL = 0.6


# ---------------------------------------------------------------------------
# utilidades
# ---------------------------------------------------------------------------
def _q(a: np.ndarray, qs=(10, 50, 90)) -> dict[str, float]:
    return {f"p{q}": round(float(np.percentile(a, q)), 2) for q in qs}


def _det(lv: Levers, params=DEFAULT) -> dict[str, np.ndarray]:
    """Trajetória determinística (T,) sem choques, como `decisoes._run` mas com base offline."""
    r = economy.simulate(BASE, lv, np.random.default_rng(0), 1, params, shocks=False)
    return {k: v[0] for k, v in r.items()}


def _nivel_pib(g: np.ndarray, ate: int = 2035) -> float:
    """Nível do PIB (2026 = 100) em `ate`, a partir da taxa anual g (%)."""
    return float(100 * np.prod(1 + g[: IDX[ate] + 1] / 100))


def eh_beneficio(chave: str, v: float) -> bool:
    """Delta que MELHORA o resultado: sobe primário/oferta/credibilidade, cai risco/erosão do BC."""
    return (
        chave in ("supply_reform", "fiscal_credibility", "primary_target") and v > 0
    ) or (chave in ("institutional_risk", "bc_erosion") and v < 0)


def deltas_efetivos(
    deltas: dict[str, float], eficiencia: float = 1.0, sobrecusto: float = 0.0
) -> dict[str, float]:
    """Benefícios × eficiência; custos integrais (× (1 + sobrecusto·(1-eficiência)) na variante)."""
    if not 0.0 <= eficiencia <= 1.0:
        raise ValueError("execution_efficiency deve estar em [0, 1]")
    out = {}
    for k, v in deltas.items():
        if eh_beneficio(k, v):
            out[k] = v * eficiencia
        else:
            out[k] = v * (1.0 + sobrecusto * (1.0 - eficiencia))
    return out


def aplicar_decisao(
    base: Levers,
    deltas: dict[str, float],
    eficiencia: float = 1.0,
    sobrecusto: float = 0.0,
) -> Levers:
    """Igual a `decisoes._apply`, com a eficiência de execução. Com 1.0 é idêntico a ele."""
    return decisoes._apply(base, deltas_efetivos(deltas, eficiencia, sobrecusto))


def aplicar_eficiencia_cenario(lv: Levers, eficiencia: float) -> Levers:
    """Eficiência sobre um cenário inteiro: só a parte POSITIVA de primário e de oferta (o esforço
    prometido) é multiplicada; déficit e demais alavancas ficam como estão."""
    pt = lv.primary_target * eficiencia if lv.primary_target > 0 else lv.primary_target
    return replace(lv, primary_target=pt, supply_reform=lv.supply_reform * eficiencia)


def _visoes_pessimistas() -> dict | None:
    """Âncoras opcionais de outro agente (`visoes_pessimistas.json`), se o arquivo existir e trouxer
    `faixa_eficiencia: [lo, hi]`. Hoje não existe: a faixa vem dos proxies acima."""
    p = Path(VISOES)
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


# ---------------------------------------------------------------------------
# (1) eficiência de execução
# ---------------------------------------------------------------------------
def _resultado_decisao(d, eff: float, params=DEFAULT, sobrecusto: float = 0.0) -> dict:
    lv = aplicar_decisao(decisoes.BASELINE, d.deltas, eff, sobrecusto)
    return _det(lv, params)


def varredura_eficiencia(
    efs=EFICIENCIAS, params=DEFAULT, sobrecusto: float = 0.0, ano: int = 2035
) -> dict[str, dict[float, dict]]:
    """Por decisão com efeito macro: melhora da dívida/PIB vs. BASELINE em cada eficiência
    (positivo = melhora), mais PIB-nível e Selic."""
    ref = _det(decisoes.BASELINE, params)
    i = IDX[ano]
    out: dict[str, dict[float, dict]] = {}
    for d in decisoes.CATALOGO:
        if not d.deltas:
            continue
        out[d.id] = {}
        for e in efs:
            r = _resultado_decisao(d, e, params, sobrecusto)
            out[d.id][e] = {
                "melhora_divida_pp": float(ref["debt"][i] - r["debt"][i]),
                "melhora_selic_pp": float(ref["selic"][i] - r["selic"][i]),
                "ganho_pib_nivel_pct": float(
                    _nivel_pib(r["gdp"], ano) / _nivel_pib(ref["gdp"], ano) * 100 - 100
                ),
            }
    return out


def _ponto_de_virada(d, params=DEFAULT) -> float | None:
    """Eficiência abaixo da qual a decisão passa a PIORAR a dívida em 2035 (None se não há virada)."""
    ref = _det(decisoes.BASELINE, params)["debt"][IDX[2035]]

    def f(e):  # >0 melhora
        return ref - _resultado_decisao(d, e, params)["debt"][IDX[2035]]

    if f(1.0) <= 0 or f(0.0) >= 0:
        return None
    lo, hi = 0.0, 1.0  # f(lo)<0<f(hi)
    for _ in range(40):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if f(mid) < 0 else (lo, mid)
    return round(hi, 3)


LIMIAR_ROBUSTA_PP = (
    1.0  # perda < 1 pp de dívida/PIB a 40% (a banda p10-p90 em 2035 é de ±6 pp)
)


def _classe(sw: dict, d, virada: float | None) -> str:
    """frágil = vira prejuízo dentro da faixa varrida (eficiência ≥ 0,4); robusta = segue positiva a 0,4
    com perda < 1 pp; 'alta perda, segue positiva' = benefício grande que encolhe muito mas não vira."""
    n_ben = sum(eh_beneficio(k, v) for k, v in d.deltas.items())
    if n_ben == 0:
        return "sem benefício a perder"
    m1, m4 = sw[1.0]["melhora_divida_pp"], sw[0.4]["melhora_divida_pp"]
    if m1 <= 0:
        return "líquido negativo mesmo com execução perfeita"
    if virada is not None and virada > 0.4:
        return "frágil (vira prejuízo)"
    if m4 > 0 and (m1 - m4) < LIMIAR_ROBUSTA_PP:
        return "robusta"
    return "alta perda, segue positiva"


def eficiencia_de_execucao() -> dict:
    sw = varredura_eficiencia()
    pib = corrupcao.ancora_pib()["valor_rs_bi"]
    linhas = []
    for d in decisoes.CATALOGO:
        if d.id not in sw:
            continue
        s = sw[d.id]
        pt = d.deltas.get("primary_target", 0.0)
        ben = {k: v for k, v in d.deltas.items() if eh_beneficio(k, v)}
        cus = {k: v for k, v in d.deltas.items() if not eh_beneficio(k, v)}
        v = _ponto_de_virada(d)
        perda = {e: s[1.0]["melhora_divida_pp"] - s[e]["melhora_divida_pp"] for e in s}
        perda_prim_rs = lambda e: (  # noqa: E731
            corrupcao.pp_para_rs_bi(max(pt, 0.0) * (1 - e), pib)
        )
        perda_pib_rs = lambda e: corrupcao.pp_para_rs_bi(  # noqa: E731
            (s[1.0]["ganho_pib_nivel_pct"] - s[e]["ganho_pib_nivel_pct"]), pib
        )
        linhas.append(
            {
                "id": d.id,
                "rotulo": d.rotulo,
                "dominio": d.dominio,
                "beneficios": ben,
                "custos": cus,
                "melhora_divida_2035_pp": {
                    f"{e:.1f}": round(s[e]["melhora_divida_pp"], 2) for e in s
                },
                "perda_beneficio_divida_pp": {
                    f"{e:.1f}": round(perda[e], 2) for e in s
                },
                "perda_primario_rs_bi_ano": {
                    f"{e:.1f}": round(perda_prim_rs(e), 1) for e in s
                },
                "perda_pib_nivel_2035_rs_bi": {
                    f"{e:.1f}": round(perda_pib_rs(e), 1) for e in s
                },
                "ponto_de_virada": v,
                "classe": _classe(s, d, v),
                "limite": decisoes._limite_modelo(d),
            }
        )
    ordem = sorted(
        (x for x in linhas if x["beneficios"]),
        key=lambda x: (
            -x["perda_beneficio_divida_pp"]["0.4"],
            -x["perda_primario_rs_bi_ano"]["0.4"],
        ),
    )
    for k, x in enumerate(ordem, 1):
        x["posto_fragilidade"] = k
    ranking = [
        {
            "posto": x["posto_fragilidade"],
            "id": x["id"],
            "rotulo": x["rotulo"],
            "classe": x["classe"],
            "perda_divida_pp_a_60": x["perda_beneficio_divida_pp"]["0.6"],
            "perda_divida_pp_a_40": x["perda_beneficio_divida_pp"]["0.4"],
            "perda_primario_rs_bi_ano_a_40": x["perda_primario_rs_bi_ano"]["0.4"],
            "ponto_de_virada": x["ponto_de_virada"],
        }
        for x in ordem
    ]
    robustas = [
        {
            "id": x["id"],
            "rotulo": x["rotulo"],
            "melhora_divida_2035_pp_a_100": x["melhora_divida_2035_pp"]["1.0"],
            "melhora_divida_2035_pp_a_40": x["melhora_divida_2035_pp"]["0.4"],
        }
        for x in linhas
        if x["classe"] == "robusta"
    ]
    sem_beneficio = [
        {"id": x["id"], "rotulo": x["rotulo"], "nota": x["classe"]}
        for x in linhas
        if not x["beneficios"]
    ]
    return {
        "definicao": (
            "execution_efficiency ∈ [0,1] multiplica os deltas que MELHORAM (supply_reform>0, "
            "fiscal_credibility>0, primary_target>0, institutional_risk<0, bc_erosion<0); os deltas "
            "que PIORAM ficam integrais. Padrão 1,0 = resultados atuais. Resultado 'melhora' = queda "
            "da dívida/PIB 2035 vs. cenário pragmático (positivo = melhor); 'perda' = melhora com "
            "100% menos melhora com a eficiência indicada."
        ),
        "base_macro": BASE.source,
        "ancoras_proxy": ANCORAS_EFICIENCIA,
        "eficiencia_central_pessimista": EFICIENCIA_CENTRAL,
        "faixa_proxies": [
            min(a["valor"] for a in ANCORAS_EFICIENCIA.values()),
            max(a["valor"] for a in ANCORAS_EFICIENCIA.values()),
        ],
        "aviso_ancora": (
            "A eficiência de execução NÃO é medida. Obras paralisadas e execução de emendas são proxies "
            "de execução física/orçamentária de um subconjunto do gasto federal; não medem a "
            "eficiência de reformas legais (que dependem de regulamentação e fiscalização)."
        ),
        "visoes_pessimistas_json": "presente" if _visoes_pessimistas() else "ausente",
        "varredura": linhas,
        "ranking_fragilidade": ranking,
        "robustas": robustas,
        "sem_beneficio_a_perder": sem_beneficio,
        "sensibilidade": _sensibilidade_eficiencia(sw),
    }


def _kendall(a: list[str], b: list[str]) -> float:
    from scipy.stats import kendalltau

    ia = {k: i for i, k in enumerate(a)}
    return round(float(kendalltau([ia[k] for k in a], [b.index(k) for k in a])[0]), 3)


def _ranking_ids(sw: dict, e: float) -> list[str]:
    com_ben = [
        d.id
        for d in decisoes.CATALOGO
        if d.id in sw and any(eh_beneficio(k, v) for k, v in d.deltas.items())
    ]
    return sorted(
        com_ben,
        key=lambda i: (
            -(sw[i][1.0]["melhora_divida_pp"] - sw[i][e]["melhora_divida_pp"])
        ),
    )


def _sensibilidade_eficiencia(sw: dict) -> dict:
    base = _ranking_ids(sw, 0.4)
    out: dict = {"ranking_de_referencia": "perda de benefício em dívida/PIB 2035 a 40%"}
    out["tau_vs_outras_eficiencias"] = {
        f"{e:.1f}": _kendall(base, _ranking_ids(sw, e)) for e in (0.8, 0.6)
    }
    for rot, kw in (
        ("neutral_real=3,5", {"params": DEFAULT.with_(neutral_real=3.5)}),
        ("neutral_real=5,5", {"params": DEFAULT.with_(neutral_real=5.5)}),
        ("sobrecusto=0,5 (custos também pioram com má execução)", {"sobrecusto": 0.5}),
        ("horizonte 2030", {"ano": 2030}),
        ("horizonte 2038", {"ano": 2038}),
    ):
        alt = varredura_eficiencia(**kw)
        r = _ranking_ids(alt, 0.4)
        out.setdefault("variantes", {})[rot] = {
            "tau": _kendall(base, r),
            "top5": r[:5],
            "top5_igual_ao_de_referencia": r[:5] == base[:5],
            "sobreposicao_top5": len(set(r[:5]) & set(base[:5])),
        }
    out["top5_referencia"] = base[:5]
    out["leitura"] = (
        "tau de Kendall perto de 1 = o ranking quase não muda. A sobrecusto inflaciona o custo de "
        "quem tem custo fiscal, então reordena mais; a ordem é estável a neutral_real."
    )
    return out


# ---------------------------------------------------------------------------
# (2) vazamento / desperdício como choque
# ---------------------------------------------------------------------------
FRACOES_FISCAIS = (
    0.10,
    0.25,
    0.50,
)  # SUPOSIÇÃO: parcela do desvio que vira primário a menos
FRACAO_FISCAL_CENTRAL = 0.25
# SUPOSIÇÃO: pp/ano de oferta perdidos por pp de PIB desviado/desperdiçado. Teto de referência:
# Mauro (1995) acha +0,5 pp de crescimento por 1 DP de eficiência burocrática (correlação
# cross-country; ~0,27 pp por pp de PIB se 1 DP ≈ 1,84 pp). Central 0,10 fica bem abaixo do teto.
PERDA_OFERTA_POR_PP = (0.0, 0.10, 0.27)
PERDA_OFERTA_CENTRAL = 0.10
DESPERDICIO_PP = (
    0.5,
    1.0,
    1.5,
)  # SUPOSIÇÃO: % do PIB perdido por ineficiência (fora da corrupção)
DESPERDICIO_CENTRAL = 1.0


def aplicar_vazamento(
    lv: Levers, desvio_pp: float, perda_oferta_por_pp: float = PERDA_OFERTA_CENTRAL
) -> Levers:
    """`desvio_pp` (% PIB/ano) reduz o primário efetivo (alvo) e a oferta (potencial)."""
    return replace(
        lv,
        primary_target=lv.primary_target - desvio_pp,
        supply_reform=lv.supply_reform - perda_oferta_por_pp * desvio_pp,
    )


def _amostra(
    lv: Levers, seed: int, n: int = N_PADRAO, params_kw: dict | None = None
) -> dict[str, np.ndarray]:
    """Mesma construção de `scenarios.run`: juro neutro incerto + choques; semente única."""
    rng = np.random.default_rng(seed)
    p = DEFAULT.with_(neutral_real=rng.uniform(3.5, 5.5, n), **(params_kw or {}))
    return economy.simulate(BASE, lv, rng, n, p)


def _resumo(paths: list[dict[str, np.ndarray]]) -> dict:
    """Quantis agrupando sementes + piso de ruído (amplitude do p50 entre sementes)."""
    out: dict = {"anos": {}, "sementes": len(paths)}
    for y in ANOS_REL:
        i = IDX[y]
        cell = {}
        for var in ("debt", "selic", "ipca", "gdp"):
            pool = np.concatenate([p[var][:, i] for p in paths])
            med = [float(np.median(p[var][:, i])) for p in paths]
            cell[var] = {**_q(pool), "ruido_p50": round(max(med) - min(med), 2)}
        lvl = np.concatenate(
            [100 * np.prod(1 + p["gdp"][:, : i + 1] / 100, axis=1) for p in paths]
        )
        cell["pib_nivel_2026_100"] = _q(lvl)
        rompeu = np.concatenate(
            [(p["debt"][:, : i + 1].max(axis=1) > BREAK) for p in paths]
        )
        cell["prob_rompeu_ate_o_ano"] = round(float(rompeu.mean()), 3)
        cell["valido_como_trajetoria"] = bool(rompeu.mean() < 0.5)
        out["anos"][str(y)] = cell
    debt = np.concatenate([p["debt"] for p in paths])
    out["prob_ruptura_qualquer_ano"] = round(
        float((debt.max(axis=1) > BREAK).mean()), 3
    )
    out["nota_pos_ruptura"] = (
        "Onde `valido_como_trajetoria` é falso, mais da metade das trajetórias já passou de 120% da dívida/PIB: "
        "os níveis (dívida, Selic, IPCA, PIB) são ARTEFATO da extrapolação do modelo, não um valor a citar; "
        "leia como 'o modelo perdeu a validade antes disso'."
    )
    out["prob_divida_2035_acima_120"] = round(
        float((debt[:, IDX[2035]] > BREAK).mean()), 3
    )
    return out


def _rodar(lv: Levers, seeds=SEMENTES, n: int = N_PADRAO, params_kw=None) -> dict:
    return _resumo([_amostra(lv, s, n, params_kw) for s in seeds])


def _par(lv_a: Levers, lv_b: Levers, seeds=SEMENTES, n: int = N_PADRAO) -> dict:
    """Diferença pareada (b - a) em 2035: mediana e IC entre sementes (mesmos choques)."""
    d = {v: [] for v in ("debt", "selic", "ipca", "gdp")}
    for s in seeds:
        pa, pb = _amostra(lv_a, s, n), _amostra(lv_b, s, n)
        for v in d:
            d[v].append(float(np.median(pb[v][:, IDX[2035]] - pa[v][:, IDX[2035]])))
    return {
        v: {
            "delta_mediano_2035": round(float(np.mean(x)), 2),
            "min_entre_sementes": round(min(x), 2),
            "max_entre_sementes": round(max(x), 2),
        }
        for v, x in d.items()
    }


def desperdicio_como_choque() -> dict:
    cur = corrupcao.carregar()
    dr = cur["desvio_referencia"]
    pib = cur["ancora_pib"]["valor_rs_bi"]
    ref_lv = decisoes.BASELINE
    ref = _rodar(ref_lv)
    pc = dr["pct_pib_central"]
    faixa = dr["faixa_pct_pib"]

    def cen(rotulo, desvio_pp, perda=PERDA_OFERTA_CENTRAL, extra=None):
        lv = aplicar_vazamento(ref_lv, desvio_pp, perda)
        r = _rodar(lv)
        return {
            "rotulo": rotulo,
            "desvio_efetivo_pp_pib": round(desvio_pp, 3),
            "rs_bi_ano": round(corrupcao.pp_para_rs_bi(desvio_pp, pib), 1),
            "perda_oferta_pp_ano": round(perda * desvio_pp, 3),
            "resultado": r,
            "delta_vs_referencia_2035": _par(ref_lv, lv),
            **(extra or {}),
        }

    corr = [
        cen(
            f"corrupção: {int(f * 100)}% do desvio central ({pc}% do PIB)",
            pc * f,
            extra={"fracao_fiscal": f},
        )
        for f in FRACOES_FISCAIS
    ]
    desp = [
        cen(f"desperdício por ineficiência: {w}% do PIB", w) for w in DESPERDICIO_PP
    ]
    junto = cen(
        "ambos (central): corrupção 25% do desvio + desperdício 1,0% do PIB",
        pc * FRACAO_FISCAL_CENTRAL + DESPERDICIO_CENTRAL,
    )
    alto = cen(
        "ambos (alto): 50% do desvio superior (2,3%) + desperdício 1,5% do PIB",
        faixa[1] * 0.5 + DESPERDICIO_PP[-1],
        perda=PERDA_OFERTA_POR_PP[-1],
    )
    sens = []
    for perda in PERDA_OFERTA_POR_PP:
        lv = aplicar_vazamento(ref_lv, pc * 0.25 + DESPERDICIO_CENTRAL, perda)
        sens.append(
            {
                "perda_oferta_por_pp": perda,
                "delta_divida_2035": _par(ref_lv, lv)["debt"]["delta_mediano_2035"],
                "prob_ruptura_qualquer_ano": _rodar(lv)["prob_ruptura_qualquer_ano"],
            }
        )
    return {
        "suposicao": (
            "SUPOSIÇÕES rotuladas, não estimativas: (i) o desvio de referência é "
            f"{pc}% do PIB/ano (FIESP/Decomtec, faixa {faixa[0]}-{faixa[1]}%, extrapolação de "
            "percepção, verificado=false); (ii) só uma FRAÇÃO dele reduz o primário federal efetivo "
            "(10/25/50%): parte é privada, subnacional ou dano indireto; (iii) 'desperdício por "
            "ineficiência' é parametrizado (0,5/1,0/1,5% do PIB) porque não há medida aberta "
            "no repositório; (iv) cada pp desviado ou desperdiçado reduz a oferta em "
            f"{PERDA_OFERTA_POR_PP} pp/ano (teto ancorado em Mauro, 1995, correlação cross-country)."
        ),
        "mecanica": (
            "primary_target -= desvio; supply_reform -= perda_oferta_por_pp × desvio; simulado em "
            "economy.simulate sobre o cenário pragmático. A regra fiscal do modelo reage à dívida "
            "(reaction) e compensa parte do vazamento: o efeito sobre a dívida é MENOR que o "
            "acumulado aritmético do desvio."
        ),
        "ancora_pib_rs_bi": pib,
        "desvio_referencia": dr,
        "referencia_pragmatico": ref,
        "corrupcao": corr,
        "desperdicio": desp,
        "combinados": {"central": junto, "alto": alto},
        "sensibilidade_perda_de_oferta": sens,
    }


# ---------------------------------------------------------------------------
# (3) cenário adverso composto + reverse stress
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class Choque:
    cred: float = 0.0  # queda absoluta da credibilidade fiscal (piso 0,05)
    bc: float = 0.0  # + erosão do BC
    inst: float = 0.0  # + risco institucional
    clima: float = 0.0  # fração de "severo" (0,6 pp de PIB/ano e 0,6 pp de prêmio)
    eficiencia: float = 1.0  # execução
    desvio_pp: float = 0.0  # vazamento/desperdício (% PIB)
    tech_nula: bool = True  # difusão tecnológica nula (tech_productivity=0)


ADVERSO = Choque(
    cred=0.40,
    bc=0.30,
    inst=0.45,
    clima=1.0,
    eficiencia=EFICIENCIA_CENTRAL,
    desvio_pp=0.0,
)
ADVERSO_COM_VAZAMENTO = replace(ADVERSO, desvio_pp=0.46 + 0.5)
CLIMA_SEVERO = {
    "climate_shock": 0.6,
    "climate_premium": 0.6,
}  # `clima/macro.py`, 'severo'


def aplicar_choque(lv: Levers, ch: Choque) -> Levers:
    out = replace(
        aplicar_eficiencia_cenario(lv, ch.eficiencia),
        fiscal_credibility=max(0.05, lv.fiscal_credibility - ch.cred),
        bc_erosion=min(1.0, lv.bc_erosion + ch.bc),
        institutional_risk=min(1.0, lv.institutional_risk + ch.inst),
        climate_shock=lv.climate_shock + CLIMA_SEVERO["climate_shock"] * ch.clima,
        climate_premium=lv.climate_premium + CLIMA_SEVERO["climate_premium"] * ch.clima,
    )
    if ch.tech_nula:
        out = replace(out, tech_productivity=0.0)
    if ch.desvio_pp:
        out = aplicar_vazamento(out, ch.desvio_pp)
    return out


def _rot_choque(ch: Choque) -> dict:
    return {
        "queda_credibilidade_fiscal": ch.cred,
        "aumento_erosao_bc": ch.bc,
        "aumento_risco_institucional": ch.inst,
        "clima_fracao_severo": ch.clima,
        "execution_efficiency": ch.eficiencia,
        "desvio_pp_pib": ch.desvio_pp,
        "tech_nula": ch.tech_nula,
    }


def _sc(key: str):
    return next(s for s in scenarios.SCENARIOS if s.key == key)


def _lv_cenario(key: str) -> Levers:
    """Alavancas do cenário como em `scenarios.run` (sem o termo de vagas do STF)."""
    return _sc(key).levers


def _det_debt(lv: Levers, ano: int = 2035) -> float:
    return float(_det(lv, DEFAULT.with_(neutral_real=NEUTRO_CENTRAL))["debt"][IDX[ano]])


def cenario_adverso() -> dict:
    nomes = {
        "pragmatico": "Flávio + centrão pragmático",
        "hegemonia": "Flávio + hegemonia da direita radical",
    }
    baseline, resultados, prob = {}, {}, {}
    atribuicao = {}
    for key in nomes:
        lv0 = _lv_cenario(key)
        base_r = _rodar(lv0)
        baseline[key] = {"rotulo": nomes[key], "levers": lv0.__dict__, **base_r}
        lv1 = aplicar_choque(lv0, ADVERSO)
        lv2 = aplicar_choque(lv0, ADVERSO_COM_VAZAMENTO)
        resultados[key] = {
            "adverso": {
                "choque": _rot_choque(ADVERSO),
                "levers": lv1.__dict__,
                **_rodar(lv1),
            },
            "adverso_mais_vazamento": {
                "choque": _rot_choque(ADVERSO_COM_VAZAMENTO),
                "levers": lv2.__dict__,
                **_rodar(lv2),
            },
        }
        prob[key] = {
            "baseline": {
                "qualquer_ano": base_r["prob_ruptura_qualquer_ano"],
                "em_2035": base_r["prob_divida_2035_acima_120"],
            },
            "adverso": {
                "qualquer_ano": resultados[key]["adverso"]["prob_ruptura_qualquer_ano"],
                "em_2035": resultados[key]["adverso"]["prob_divida_2035_acima_120"],
            },
            "adverso_mais_vazamento": {
                "qualquer_ano": resultados[key]["adverso_mais_vazamento"][
                    "prob_ruptura_qualquer_ano"
                ],
                "em_2035": resultados[key]["adverso_mais_vazamento"][
                    "prob_divida_2035_acima_120"
                ],
            },
        }
        # atribuição: cada choque sozinho e "tudo menos esse" (dívida 2035, mediana pareada)
        comps = {
            "credibilidade fiscal": {"cred": ADVERSO.cred},
            "independência do BC": {"bc": ADVERSO.bc},
            "risco institucional": {"inst": ADVERSO.inst},
            "clima severo": {"clima": ADVERSO.clima},
            "ineficiência de execução": {"eficiencia": ADVERSO.eficiencia},
            "difusão tecnológica nula": {"tech_nula": True},
        }
        at = {}
        for nome, kw in comps.items():
            sozinho = _par(lv0, aplicar_choque(lv0, Choque(**kw)))
            sem = replace(
                ADVERSO, **{k: Choque.__dataclass_fields__[k].default for k in kw}
            )
            sem_lv = aplicar_choque(lv0, sem)
            at[nome] = {
                "sozinho_delta_divida_2035": sozinho["debt"]["delta_mediano_2035"],
                "sozinho_delta_selic_2035": sozinho["selic"]["delta_mediano_2035"],
                "todos_menos_este_delta_divida_2035": _par(lv0, sem_lv)["debt"][
                    "delta_mediano_2035"
                ],
            }
        atribuicao[key] = at
    # contrafactual da tecnologia: o que a difusão base (0,3 pp/ano) teria compensado
    tech = {}
    for key in nomes:
        lv0 = _lv_cenario(key)
        adv = aplicar_choque(lv0, ADVERSO)
        com = replace(adv, tech_productivity=0.3)
        tech[key] = {
            "delta_divida_2035_se_tech_0_3": _par(adv, com)["debt"][
                "delta_mediano_2035"
            ],
            "nota": "tech_productivity=0,3 é suposição de tecnologia.py; o cenário adverso fica em 0.",
        }
    return {
        "definicao_ruptura": f"dívida/PIB > {BREAK:.0f}% (scenarios.BREAK_DEBT): o modelo deixa de valer como trajetória",
        "choque_composto": _rot_choque(ADVERSO),
        "nota_tecnologia": (
            "Os cenários do repositório já têm tech_productivity=0: 'difusão nula' não muda "
            "nada em relação à linha de base; o custo de oportunidade aparece em `contrafactual_tecnologia`."
        ),
        "baseline": baseline,
        "resultados": resultados,
        "prob_ruptura": prob,
        "atribuicao_por_choque": atribuicao,
        "contrafactual_tecnologia": tech,
        "reverse_stress": reverse_stress(),
        "base_macro": BASE.source,
    }


NIVEIS_REVERSE = {
    "cred": (0.0, 0.15, 0.30, 0.45),
    "bc": (0.0, 0.15, 0.30, 0.45),
    "inst": (0.0, 0.15, 0.30, 0.45),
    "clima": (0.0, 1 / 3, 2 / 3, 1.0),
    "eficiencia": (1.0, 0.8, 0.6, 0.4),
    "desvio_pp": (0.0, 0.5, 1.0, 1.5),
}


def reverse_stress(
    scen: str = "pragmatico", niveis: dict | None = None, verificar: int = 3
) -> dict:
    """Menor combinação de choques cuja trajetória DETERMINÍSTICA (juro neutro 4,5, sem ruído) leva a
    dívida/PIB 2035 acima de 120%; custo = soma dos níveis normalizados (0 a 1 por choque).
    Confirma os candidatos com a simulação estocástica."""
    niveis = niveis or NIVEIS_REVERSE
    chaves = list(niveis)
    lv0 = _lv_cenario(scen)
    ja = _det_debt(lv0)
    out: dict = {
        "cenario": scen,
        "criterio": f"dívida/PIB 2035 > {BREAK:.0f}% na trajetória central determinística; custo = Σ (nível/nível máximo) por choque",
        "niveis_testados": {k: [round(x, 3) for x in v] for k, v in niveis.items()},
        "divida_2035_sem_choque": round(ja, 1),
        "ja_rompe_sem_choque": ja > BREAK,
    }
    todas = []
    for idx in itertools.product(*[range(len(niveis[k])) for k in chaves]):
        ch = Choque(**{k: niveis[k][i] for k, i in zip(chaves, idx)})
        custo = sum(i / (len(niveis[k]) - 1) for k, i in zip(chaves, idx))
        todas.append((custo, sum(1 for i in idx if i), idx, ch))
    out["combinacoes_avaliadas"] = len(todas)
    unico = {}
    for k, i in zip(chaves, range(len(chaves))):
        mx = niveis[k][-1]
        ch = Choque(**{k: mx})
        unico[k] = {
            "nivel_maximo": round(mx, 3),
            "divida_2035": round(_det_debt(aplicar_choque(lv0, ch)), 1),
        }
    out["choque_unico_no_maximo"] = unico
    out["algum_choque_unico_rompe"] = any(
        v["divida_2035"] > BREAK for v in unico.values()
    )
    rompe = []
    for custo, nchoq, idx, ch in todas:
        if _det_debt(aplicar_choque(lv0, ch)) > BREAK:
            rompe.append((custo, nchoq, idx, ch))
    out["combinacoes_que_rompem"] = len(rompe)
    if not rompe:
        out["minimas"] = []
        out["total_no_maximo_rompe"] = False
        return out
    rompe.sort(key=lambda t: (t[0], t[1]))
    cmin = rompe[0][0]
    minimas = [t for t in rompe if abs(t[0] - cmin) < 1e-9]
    menos = min(t[1] for t in rompe)
    pareto = [t for t in rompe if t[1] == menos][:3]

    def fmt(t, verificar=verificar):
        _, nchoq, idx, ch = t
        lv = aplicar_choque(lv0, ch)
        r = {
            "custo": round(t[0], 3),
            "n_choques": nchoq,
            "choque": {k: round(niveis[k][i], 3) for k, i in zip(chaves, idx) if i},
            "divida_2035_central": round(_det_debt(lv), 1),
        }
        if verificar:
            res = _rodar(lv, SEMENTES[:3])
            r["prob_divida_2035_acima_120_estocastica"] = res[
                "prob_divida_2035_acima_120"
            ]
            r["divida_2035_p50_estocastica"] = res["anos"]["2035"]["debt"]["p50"]
        return r

    # rota alternativa: a menor combinação que rompe SEM usar cada choque (mostra o quanto o
    # resultado depende de um só deles)
    sem = {}
    for j, k in enumerate(chaves):
        alt = [t for t in rompe if t[2][j] == 0]
        sem[k] = fmt(alt[0], verificar=False) if alt else None
    out["minima_sem_cada_choque"] = sem
    # limiar contínuo do choque de credibilidade sozinho
    lo, hi = 0.0, 0.75
    if _det_debt(aplicar_choque(lv0, Choque(cred=hi))) > BREAK:
        for _ in range(30):
            mid = (lo + hi) / 2
            if _det_debt(aplicar_choque(lv0, Choque(cred=mid))) > BREAK:
                hi = mid
            else:
                lo = mid
        out["limiar_credibilidade_sozinha"] = {
            "queda": round(hi, 3),
            "credibilidade_de": lv0.fiscal_credibility,
            "credibilidade_para": round(lv0.fiscal_credibility - hi, 3),
        }
    out["minimas"] = [fmt(t) for t in minimas[:5]]
    out["menor_numero_de_choques"] = [fmt(t) for t in pareto]
    out["leitura"] = (
        "Cada linha é uma combinação distinta que cruza o limiar na trajetória central. A "
        "estocástica mostra a chance real: perto de 50% = no limiar, não 'inevitável'."
    )
    return out


# ---------------------------------------------------------------------------
# (4) liderança judicial
# ---------------------------------------------------------------------------
VAGAS = (("Fux", 2028), ("Cármen Lúcia", 2029), ("Gilmar Mendes", 2030))
QUORUM_SENADO = institutions.SENATE_ABS  # 41 votos
CAPTURA_CONTROVERSIA = (
    0.5  # vaga 'capturada' = aprovada com controvérsia >= 0,5 (perfil de conflito)
)
DECISOES_JUDICIAIS = (
    "ampliar-stf",
    "remover-ministros-stf",
    "diretoria-bc-alinhada",
    "anistia-politica",
)
TECNICO_CONSENSUAL = institutions.Nominee(
    "Indicado técnico de consenso", ideology=0.2, controversy=0.15, meets_art101=0.97
)
TECNICO_ESQUERDA = institutions.Nominee(
    "Indicado técnico alinhado à esquerda",
    ideology=-0.7,
    controversy=0.2,
    meets_art101=0.95,
)
SEM_TRAJETORIA = institutions.Nominee(
    "Perfil sem trajetória jurídica (hipótese do cenário 'extremo')",
    ideology=scenarios.HIPOTESE_MARCAL.ideology,
    controversy=scenarios.HIPOTESE_MARCAL.controversy,
    meets_art101=scenarios.HIPOTESE_MARCAL.meets_art101,
)
# Perfil dos 3 indicados por cenário, na ordem das vagas. JULGAMENTOS do modelo, editáveis.
PERFIS = {
    "lula": [TECNICO_ESQUERDA] * 3,
    "pragmatico": [TECNICO_CONSENSUAL] * 3,
    "hegemonia": [scenarios.TECNICO_ALIADO, scenarios.MILITANTE, scenarios.MILITANTE],
    "extremo": [scenarios.MILITANTE, scenarios.MILITANTE, SEM_TRAJETORIA],
}
# probabilidade de o governo perseguir cada decisão judicial/institucional (SUPOSIÇÃO)
PERSEGUE = {"lula": 0.0, "pragmatico": 0.0, "hegemonia": 1.0, "extremo": 1.0}
PRESIDENTE = {
    "lula": "esquerda",
    "pragmatico": "direita",
    "hegemonia": "direita",
    "extremo": "direita",
}


def _p_decisao(d, president: str, rng: np.random.Generator, draws: int) -> float:
    """Mesmo cálculo de `decisoes.p_approval`, com `draws` configurável."""
    aligned = (d.ideologia >= 0) == (president == "direita")
    if d.instrumento == "EXECUTIVO":
        return 1.0 if aligned else 0.0
    init = 0.9 if aligned else (0.3 if d.iniciativa_congresso else 0.0)
    ctrl = d.controversia * (0.85 if aligned else 1.15)
    qc, qs = institutions.QUORUM[d.instrumento]
    pc = institutions.pass_prob(
        institutions.chamber_seats(),
        institutions.CHAMBER_BLOCS,
        qc,
        d.ideologia,
        ctrl,
        rng,
        draws,
    )
    ps = institutions.pass_prob(
        institutions.senate_seats(),
        institutions.BLOCS,
        qs,
        d.ideologia,
        ctrl,
        rng,
        draws,
    )
    return init * pc * ps


def _distribuicao_judicial(key: str, rng: np.random.Generator, draws: int) -> dict:
    """Distribuição exata (enumeração de 2^3 × 2^4 resultados) de vagas capturadas e do risco."""
    perfis = PERFIS[key]
    p_vaga = [institutions.senate_approval_prob(n, rng, draws) for n in perfis]
    cat = {d.id: d for d in decisoes.CATALOGO}
    p_dec = {
        i: PERSEGUE[key] * _p_decisao(cat[i], PRESIDENTE[key], rng, draws)
        for i in DECISOES_JUDICIAIS
    }
    sc = _sc(key)
    base = max(sc.levers.institutional_risk, sc.base_risk)
    resultados = []  # (prob, nº capturadas, risco, bc)
    for vag in itertools.product((0, 1), repeat=3):
        pv = np.prod([p if a else 1 - p for p, a in zip(p_vaga, vag)])
        ncap = sum(
            a
            for a, n in zip(vag, perfis)
            if a and n.controversy >= CAPTURA_CONTROVERSIA
        )
        dvag = sum(0.1 * n.controversy for a, n in zip(vag, perfis) if a)
        for dec in itertools.product((0, 1), repeat=len(DECISOES_JUDICIAIS)):
            pd_ = np.prod(
                [
                    p_dec[i] if a else 1 - p_dec[i]
                    for i, a in zip(DECISOES_JUDICIAIS, dec)
                ]
            )
            ddec = sum(
                cat[i].deltas.get("institutional_risk", 0.0)
                for i, a in zip(DECISOES_JUDICIAIS, dec)
                if a
            )
            dbc = sum(
                cat[i].deltas.get("bc_erosion", 0.0)
                for i, a in zip(DECISOES_JUDICIAIS, dec)
                if a
            )
            resultados.append(
                (
                    float(pv * pd_),
                    ncap,
                    float(min(1.0, base + dvag + ddec)),
                    float(min(1.0, sc.levers.bc_erosion + dbc)),
                    vag,
                    dec,
                )
            )
    return {
        "p_aprovacao_indicado": {v[0]: round(p, 3) for v, p in zip(VAGAS, p_vaga)},
        "p_decisao_perseguida_e_aprovada": {i: round(p, 4) for i, p in p_dec.items()},
        "base_risco": base,
        "resultados": resultados,
    }


def _binar(
    resultados, passo_inst=0.02, passo_bc=0.05
) -> dict[tuple[float, float], float]:
    cel: dict[tuple[float, float], float] = {}
    for p, _, r, bc, _, _ in resultados:
        k = (
            round(round(r / passo_inst) * passo_inst, 4),
            round(round(bc / passo_bc) * passo_bc, 4),
        )
        cel[k] = cel.get(k, 0.0) + p
    return cel


def _macro_mistura(
    key: str, cel: dict, seeds=SEMENTES[:3], n_total: int = 3000, params_kw=None
) -> dict:
    """Roda a macro em cada célula (risco, erosão do BC) e junta por probabilidade (mesmos números
    aleatórios entre células)."""
    lv0 = _lv_cenario(key)
    paths = []
    for s in seeds:
        acc: dict[str, list[np.ndarray]] = {
            v: [] for v in ("debt", "selic", "ipca", "gdp")
        }
        for (r, bc), p in cel.items():
            m = int(round(p * n_total))
            if m < 1:
                continue
            lv = replace(lv0, institutional_risk=r, bc_erosion=bc)
            sim = _amostra(lv, s, m, params_kw)
            for v in acc:
                acc[v].append(sim[v])
        paths.append({v: np.concatenate(x) for v, x in acc.items()})
    return _resumo(paths)


def lideranca_judicial(
    draws: int = 4000, n_total: int = 3000, sens: bool = True
) -> dict:
    rng = np.random.default_rng(2026)
    dist, risco, macro, contra, sens_out = {}, {}, {}, {}, {}
    for key in PERFIS:
        d = _distribuicao_judicial(key, rng, draws)
        res = d["resultados"]
        ncap = np.zeros(4)
        for p, c, *_ in res:
            ncap[c] += p
        dist[key] = {
            "perfil_indicados": {
                v[0]: PERFIS[key][i].name for i, v in enumerate(VAGAS)
            },
            "p_aprovacao_indicado": d["p_aprovacao_indicado"],
            "p_decisao_perseguida_e_aprovada": d["p_decisao_perseguida_e_aprovada"],
            "distribuicao_vagas_capturadas": {
                str(i): round(float(ncap[i]), 4) for i in range(4)
            },
            "esperanca_vagas_capturadas": round(float((ncap * np.arange(4)).sum()), 3),
            "p_pelo_menos_uma": round(float(ncap[1:].sum()), 4),
            "p_maioria_das_tres": round(float(ncap[2:].sum()), 4),
        }
        r = np.array([x[2] for x in res])
        w = np.array([x[0] for x in res])
        o = np.argsort(r)
        cw = np.cumsum(w[o])

        def qq(p):
            return round(float(r[o][np.searchsorted(cw, p * cw[-1])]), 3)

        risco[key] = {
            "base_do_cenario": d["base_risco"],
            "p10": qq(0.10),
            "p50": qq(0.50),
            "p90": qq(0.90),
            "media": round(float((r * w).sum() / w.sum()), 3),
        }
        macro[key] = _macro_mistura(key, _binar(res), n_total=n_total)
        # contrafactual: indicações técnicas aprovadas e nenhuma decisão de ruptura
        sc = _sc(key)
        base = d["base_risco"]
        r_cf = min(1.0, base)  # canal judicial neutro: só o risco-base do cenário
        lv_cf = replace(
            _lv_cenario(key), institutional_risk=r_cf, bc_erosion=sc.levers.bc_erosion
        )
        cf = _rodar(lv_cf, SEMENTES[:3], n_total)
        contra[key] = {
            "risco_institucional": round(r_cf, 3),
            "resultado": cf,
            "intervalo_divida_2035_p50": [
                cf["anos"]["2035"]["debt"]["p50"],
                macro[key]["anos"]["2035"]["debt"]["p50"],
            ],
            "efeito_do_canal_judicial_divida_2035_pp": round(
                macro[key]["anos"]["2035"]["debt"]["p50"]
                - cf["anos"]["2035"]["debt"]["p50"],
                2,
            ),
            "efeito_do_canal_judicial_prob_ruptura": round(
                macro[key]["prob_ruptura_qualquer_ano"]
                - cf["prob_ruptura_qualquer_ano"],
                3,
            ),
        }
        if sens and key in ("hegemonia", "extremo", "pragmatico"):
            sens_out[key] = []
            for rot, kw in (
                ("prem_inst × 0,5", {"prem_inst": DEFAULT.prem_inst * 0.5}),
                ("prem_inst × 1,0 (modelo)", {}),
                ("prem_inst × 1,5", {"prem_inst": DEFAULT.prem_inst * 1.5}),
                ("prem_inst × 2,0", {"prem_inst": DEFAULT.prem_inst * 2.0}),
                ("prem_inst × 1,0 e g_inst × 0,5", {"g_inst": DEFAULT.g_inst * 0.5}),
                (
                    "prem_inst × 2,0 e g_inst × 1,5",
                    {
                        "prem_inst": DEFAULT.prem_inst * 2.0,
                        "g_inst": DEFAULT.g_inst * 1.5,
                    },
                ),
            ):
                m = _macro_mistura(key, _binar(res), n_total=1500, params_kw=kw)
                c = _rodar(lv_cf, SEMENTES[:3], 1500, kw)
                sens_out[key].append(
                    {
                        "mapeamento": rot,
                        "divida_2035_p50": m["anos"]["2035"]["debt"]["p50"],
                        "divida_2035_p50_contrafactual": c["anos"]["2035"]["debt"][
                            "p50"
                        ],
                        "prob_ruptura_qualquer_ano": m["prob_ruptura_qualquer_ano"],
                        "prob_ruptura_contrafactual": c["prob_ruptura_qualquer_ano"],
                        "selic_2035_p50": m["anos"]["2035"]["selic"]["p50"],
                    }
                )
    return {
        "aviso": (
            "Mecanismo, não acusação: 'vaga capturada' = indicado aprovado com controvérsia ≥ 0,5 "
            "(perfil de alto conflito/baixo requisito do art. 101), sem julgar nenhuma pessoa real. "
            "O filtro do Senado (41 de 81 votos) é o mesmo para qualquer lado; os perfis por "
            "cenário são hipóteses do repositório (`scenarios.py`)."
        ),
        "calendario_vagas": [{"vaga": v, "ano": a} for v, a in VAGAS],
        "quorum_senado": QUORUM_SENADO,
        "regra_risco": (
            "risco = max(alavanca do cenário, base_risk) + 0,1 × controvérsia de cada indicado aprovado "
            "(regra de scenarios.effective_risk) + Σ delta institutional_risk das decisões judiciais "
            "perseguidas e aprovadas (ampliar-stf, remover-ministros-stf, diretoria-bc-alinhada, "
            "anistia-politica); diretoria-bc-alinhada também soma bc_erosion."
        ),
        "suposicao_mapeamento": (
            "SUPOSIÇÃO: risco institucional → prêmio (prem_inst = 2,5 pp por unidade) e → crescimento "
            "(g_inst = 1,2 pp por unidade) são parâmetros de calibração do modelo, não elasticidades "
            "medidas; ver `sensibilidade_mapeamento`."
        ),
        "persegue_agenda_de_ruptura": PERSEGUE,
        "vagas_capturadas": {"distribuicao": dist},
        "risco_institucional": risco,
        "macro": macro,
        "contrafactual": contra,
        "sensibilidade_mapeamento": sens_out,
        "limites_proprios": [
            "O risco entra constante desde 2027, mas as vagas só abrem em 2028-2030: o modelo SUPERESTIMA o efeito nos primeiros anos.",
            "Probabilidades de aprovação vêm do modelo de bancadas (suposições editáveis), não de pesquisa.",
            "Aposentadoria compulsória (75 anos) e as datas são as informadas na tarefa; antecipações, vacâncias imprevistas e vaga de mandatos anteriores não entram.",
            "Capturar uma vaga não equivale a capturar o tribunal (11 ministros, decisões colegiadas): o 0,1 por indicado é julgamento herdado de scenarios.py.",
        ],
    }


# ---------------------------------------------------------------------------
# (5) fragilidade por setor
# ---------------------------------------------------------------------------
SETORES = (
    "saúde",
    "educação",
    "infraestrutura",
    "energia",
    "agro",
    "segurança",
    "fiscal",
)
# Mapeamento decisão -> setor: JULGAMENTO do mapeamento; a ligação decisão↔potência↔pilar registrada
# está em `Decisao.origem`, `ligacao_decisoes` (potenciais_brasil.json) e `ganhadores`.
SETOR_DECISOES: dict[str, list[str]] = {
    "saúde": ["seguranca-hidrica-saneamento"],
    "educação": ["educacao-tecnica-e-alfabetizacao"],
    "infraestrutura": [
        "privatizacoes",
        "seguranca-hidrica-saneamento",
        "acelerar-ibs-cbs",
    ],
    "energia": [
        "politica-industrial-verde",
        "estrategia-minerais-criticos",
        "politica-precos-combustiveis",
    ],
    "agro": [
        "recuperar-pastagens-degradadas",
        "psa-governanca-comunitaria",
        "acordo-mercosul-ue",
        "abertura-comercial",
        "credito-subsidiado",
        "perdao-dividas",
    ],
    "segurança": [
        "combate-garimpo-ilegal-e-rastreio-do-ouro",
        "homologar-terras-indigenas-e-titular-quilombos",
    ],
    "fiscal": [
        "flexibilizar-arcabouco",
        "reforcar-arcabouco",
        "reforma-administrativa",
        "desvincular-minimo",
        "reforma-previdencia-2",
        "cortar-beneficios-fiscais",
        "desoneracao-ampla",
        "ampliar-assistencia",
        "reduzir-autonomia-bc",
        "diretoria-bc-alinhada",
    ],
}
# áreas de custo_corrupcao.json ligadas a cada setor (registro, não soma)
SETOR_AREAS_CORRUPCAO = {
    "saúde": ["saude-sus", "previdencia-inss-descontos"],
    "educação": ["educacao-merenda-fnde"],
    "infraestrutura": ["obras-infraestrutura", "concessoes-renegociacoes"],
    "energia": [
        "tributos-subsidios-energia",
        "petroleo-lava-jato",
        "combustiveis-crime-organizado",
    ],
    "agro": ["crime-ambiental-ouro-madeira-terra"],
    "segurança": ["combustiveis-crime-organizado", "corrupcao-subnacional-municipal"],
    "fiscal": [
        "gastos-tributarios",
        "sonegacao-economia-subterranea",
        "emendas-orcamento-secreto",
        "licitacoes-carteis",
    ],
}
# ligações climáticas registradas (aneis.json, clima.json, clima_valor_financeiro.json, decisões)
SETOR_CLIMA = {
    "saúde": [
        "decisão seguranca-hidrica-saneamento: 'reduz exposição a secas e custos de saúde' (julgamento do catálogo)"
    ],
    "educação": [],
    "infraestrutura": [
        "clima_valor_financeiro.json, RS 2024: infraestrutura 8% dos danos e perdas (DaLA, verificado)",
        "obras paralisadas e anel clima-fiscal-adaptacao (aneis.json)",
    ],
    "energia": [
        "clima.json: afluência SE × CMO r = -0,50 (IC95 -0,75 a -0,25), 2005-2025",
        "clima.json: energia armazenada × CMO do ano seguinte r = -0,42",
    ],
    "agro": [
        "aneis.json: anel clima-floresta-agro (produtividade e renda)",
        "clima_valor_financeiro.json, RS 2024: setor produtivo 69% dos danos e perdas (não separa o agro)",
    ],
    "segurança": [],
    "fiscal": ["aneis.json: anel clima-fiscal-adaptacao (gasto emergencial → dívida)"],
}
SETOR_TECNOLOGIA = {
    "energia": [
        "tecnologia.py: solar_total_brasil e solar_gd_brasil",
        "tecnologia.py: carros_eletricos_brasil",
    ],
    "infraestrutura": [
        "tecnologia.py: internet_domicilios e celular_pessoas (conectividade)"
    ],
}
CHOQUES_SETOR = (
    "execucao_ineficiente",
    "vazamento",
    "clima",
    "tecnologia_nula",
    "credibilidade_fiscal",
    "erosao_bc",
    "risco_institucional",
    "juros_altos",
)
ALAVANCA_DO_CHOQUE = {
    "credibilidade_fiscal": "fiscal_credibility",
    "erosao_bc": "bc_erosion",
    "risco_institucional": "institutional_risk",
}


def fragilidade_setorial(ef: dict | None = None) -> list[dict]:
    """Por choque, o setor mais exposto. SEM elasticidade nova: as pontuações são contagens ou somas
    de números já registrados (perda de benefício do varredura, nº de ligações, gasto a financiar)."""
    ef = ef or eficiencia_de_execucao()
    perda60 = {x["id"]: x["perda_beneficio_divida_pp"]["0.6"] for x in ef["varredura"]}
    cat = {d.id: d for d in decisoes.CATALOGO}
    cur_ids = {a["id"] for a in corrupcao.carregar()["areas"]}
    pib = corrupcao.ancora_pib()["valor_rs_bi"]
    linhas = []
    for ch in CHOQUES_SETOR:
        sc = {}
        for s in SETORES:
            ids = SETOR_DECISOES[s]
            if ch == "execucao_ineficiente":
                v = round(sum(perda60.get(i, 0.0) for i in ids), 2)
                nota = f"Σ perda de benefício em dívida/PIB 2035 a 60% de eficiência ({len(ids)} decisões ligadas)"
                base = "registrado (varredura do modelo); mapeamento setor↔decisão é julgamento"
            elif ch == "vazamento":
                areas = [a for a in SETOR_AREAS_CORRUPCAO[s] if a in cur_ids]
                v = len(areas)
                nota = f"nº de áreas de custo_corrupcao.json ligadas ({', '.join(areas) or 'nenhuma'}); contagem, sem somar R$"
                base = "registrado (curadoria); ligação setor↔área é julgamento"
            elif ch == "clima":
                v = len(SETOR_CLIMA[s]) or None
                nota = "; ".join(SETOR_CLIMA[s]) or "sem ligação registrada"
                base = "registrado" if v else "sem ligação registrada"
            elif ch == "tecnologia_nula":
                lig = SETOR_TECNOLOGIA.get(s, [])
                v = len(lig) or None
                nota = "; ".join(lig) or "sem curva de difusão registrada"
                base = "registrado" if v else "sem ligação registrada"
            elif ch == "juros_altos":
                if s == "fiscal":
                    v = None
                    nota = "o canal do choque é a própria dívida: exposto por construção (não pontuado)"
                    base = "julgamento"
                else:
                    gasto = sum(
                        -cat[i].deltas["primary_target"]
                        for i in ids
                        if cat[i].deltas.get("primary_target", 0.0) < 0
                    )
                    v = round(corrupcao.pp_para_rs_bi(gasto, pib), 1) if gasto else None
                    nota = "Σ |primary_target<0| das decisões ligadas, R$ bi/ano: gasto que depende de financiar com juro maior"
                    base = (
                        "registrado (deltas do catálogo, que são julgamentos)"
                        if v
                        else "sem ligação registrada"
                    )
            else:
                lever = ALAVANCA_DO_CHOQUE[ch]
                usa = [i for i in ids if lever in cat[i].deltas]
                v = round(sum(abs(cat[i].deltas[lever]) for i in usa), 3) or None
                nota = (
                    f"Σ |delta de {lever}| nas decisões ligadas ({', '.join(usa) or 'nenhuma usa a alavanca'}): "
                    "quanto do cardápio do setor passa por essa alavanca"
                )
                base = (
                    "registrado (deltas do catálogo, que são julgamentos)"
                    if v
                    else "sem ligação registrada"
                )
            sc[s] = {"escore": v, "base": base, "nota": nota}
        pont = {s: x["escore"] for s, x in sc.items() if x["escore"] is not None}
        top = max(pont.values()) if pont else None
        mais = [s for s, v in pont.items() if v == top] if top is not None else []
        sem_f = {s: v for s, v in pont.items() if s != "fiscal"}
        topf = max(sem_f.values()) if sem_f else None
        mais_exceto_fiscal = (
            [s for s, v in sem_f.items() if v == topf] if topf is not None else []
        )
        mais_exposto = (
            ["fiscal (por construção)"] if ch == "juros_altos" or not mais else mais
        )
        linhas.append(
            {
                "choque": ch,
                "mais_exposto": mais_exposto,
                "mais_exposto_exceto_fiscal": mais_exceto_fiscal,
                "empate": len(mais) > 1,
                "setores": sc,
                "sem_ligacao": [s for s, x in sc.items() if x["escore"] is None],
                "unidade": {
                    "execucao_ineficiente": "pp de dívida/PIB 2035",
                    "vazamento": "nº de áreas",
                    "clima": "nº de ligações",
                    "tecnologia_nula": "nº de curvas/ligações",
                    "juros_altos": "R$ bi/ano a financiar",
                }.get(ch, "Σ |delta| da alavanca"),
            }
        )
    return linhas


# ---------------------------------------------------------------------------
# (6) validação, cemitério, limites
# ---------------------------------------------------------------------------
def validacao(ef: dict, adv: dict) -> dict:
    # regressão: eficiência 1,0 reproduz decisoes._apply e o BASELINE nas 5 alavancas
    ok_reg = True
    maxdiff = 0.0
    for d in decisoes.CATALOGO:
        a = aplicar_decisao(decisoes.BASELINE, d.deltas, 1.0)
        b = decisoes._apply(decisoes.BASELINE, d.deltas)
        ok_reg &= a == b
        ra, rb = _det(a), _det(b)
        maxdiff = max(maxdiff, max(float(np.abs(ra[k] - rb[k]).max()) for k in ra))
    # monotonicidade: mais ineficiência nunca melhora (decisões; determinístico)
    sw = varredura_eficiencia()
    viol = []
    ordem = sorted(EFICIENCIAS)
    for i, por in sw.items():
        for lo, hi in zip(ordem, ordem[1:]):
            if por[lo]["melhora_divida_pp"] > por[hi]["melhora_divida_pp"] + 1e-9:
                viol.append({"decisao": i, "de": hi, "para": lo})
    # monotonicidade no cenário (estocástico, mesmos choques)
    lv0 = _lv_cenario("pragmatico")
    meds = []
    for e in (1.0, 0.8, 0.6, 0.4):
        pa = _amostra(aplicar_eficiencia_cenario(lv0, e), SEMENTES[0], 1000)
        meds.append(float(np.median(pa["debt"][:, IDX[2035]])))
    mono_cen = all(b >= a - 1e-9 for a, b in zip(meds, meds[1:]))
    # piso de ruído: amplitude do p50 entre sementes na linha de base
    base = adv["baseline"]["pragmatico"]["anos"]["2035"]["debt"]
    adv_r = adv["resultados"]["pragmatico"]["adverso"]["anos"]["2035"]["debt"]
    piso = base["ruido_p50"]
    # sensibilidade a sementes: efeito (adverso - base) em cada semente
    efeitos = []
    for s in SEMENTES:
        a = _amostra(lv0, s, 1000)
        b = _amostra(aplicar_choque(lv0, ADVERSO), s, 1000)
        efeitos.append(
            float(
                np.median(b["debt"][:, IDX[2035]]) - np.median(a["debt"][:, IDX[2035]])
            )
        )
    return {
        "regressao": {
            "eficiencia_1_igual_ao_catalogo": bool(ok_reg),
            "diferenca_maxima_trajetorias": maxdiff,
            "alavanca_padrao": "execution_efficiency=1,0: deltas inalterados; economy.py e decisoes.py não foram modificados",
            "base_macro": BASE.source,
        },
        "monotonicidade": {
            "decisoes_testadas": len(sw),
            "pares_de_eficiencia_testados": len(ordem) - 1,
            "violacoes": viol,
            "cenario_pragmatico_p50_divida_2035_por_eficiencia": dict(
                zip(("1.0", "0.8", "0.6", "0.4"), [round(m, 2) for m in meds])
            ),
            "cenario_monotono": mono_cen,
        },
        "sementes": {
            "sementes": list(SEMENTES),
            "n_por_semente": N_PADRAO,
            "piso_de_ruido_p50_divida_2035": piso,
            "efeito_adverso_por_semente_divida_2035": [round(x, 2) for x in efeitos],
            "efeito_adverso_p50": adv_r["p50"] - base["p50"],
            "regra": "diferença abaixo de 2× o piso de ruído é 'não distinguível de zero' (RIGOR_DE_VALIDACAO.md, regra 5); ≥3 sementes (regra 4)",
            "efeito_acima_do_piso": abs(np.mean(efeitos)) > 2 * max(piso, 0.01),
        },
        "nulo_primeiro": (
            "A varredura de decisões é determinística (n=1, sem choques): não há ruído amostral, só "
            "erro de especificação. Os blocos estocásticos usam 5 sementes e reportam o piso."
        ),
    }


def cemiterio(ef: dict, adv: dict, jud: dict) -> list[dict]:
    rs = adv["reverse_stress"]
    itens = [
        {
            "tentativa": "Choque 'difusão tecnológica nula' como estressor",
            "resultado": "Não funciona: todos os cenários do repositório já têm tech_productivity=0, então o choque não muda nada. Só dá para medir o custo de oportunidade (contrafactual com 0,3 pp/ano).",
            "licao": "Estresse só existe relativo a uma linha de base que tenha o que perder.",
        },
        {
            "tentativa": "Eficiência aplicada ao pacote inteiro (benefícios e custos)",
            "resultado": "Descartada: tornava a má execução 'neutra' (reduz também o custo) e escondia a assimetria que o teste quer mostrar. Mantida como variante 'sobrecusto', que piora os custos.",
            "licao": "Incompetência é assimétrica: o custo do gasto sai, o benefício não chega.",
        },
        {
            "tentativa": "Calibrar a eficiência com `visoes_pessimistas.json`",
            "resultado": "O arquivo não existe no repositório nesta execução; a faixa vem de proxies (obras paralisadas, execução de emendas), que não medem eficiência de reformas.",
            "licao": "Declarar a suposição em vez de fingir uma estimativa; o código lê `faixa_eficiencia` se o arquivo aparecer.",
        },
        {
            "tentativa": "Reverse stress com busca contínua do limiar",
            "resultado": "Substituída por grade discreta de 4 níveis por choque (4096 combinações) com custo normalizado: o limiar contínuo dependia de pesos arbitrários entre choques.",
            "licao": "A 'combinação mínima' depende da grade e do custo escolhido; é uma entre várias.",
        },
        {
            "tentativa": "Vazamento como subtração direta do primário realizado",
            "resultado": "Não dá sem alterar economy.simulate (a alavanca é o alvo, e a regra de reação compensa parte do vazamento). Aplicado no alvo e declarado: o efeito sobre a dívida é menor que o acumulado aritmético.",
            "licao": "O estabilizador fiscal do modelo suaviza o vazamento; o canal real (menos reação política) não está lá.",
        },
        {
            "tentativa": "Risco judicial variando no tempo conforme o calendário (2028, 2029, 2030)",
            "resultado": "Inviável sem alterar economy.simulate, cujas alavancas são constantes no horizonte. O risco entra desde 2027 e superestima o início.",
            "licao": "Declarado em `limites`; viés conservador (pessimista) nos primeiros anos.",
        },
        {
            "tentativa": "Ranking de fragilidade só em R$ bi/ano",
            "resultado": "O R$ do primário ignora o ganho de oferta (decisões de oferta não têm primário positivo). Mantidos dois critérios (dívida/PIB e R$), com a dívida como primário.",
            "licao": "Perda em R$ de primário e perda em PIB nível são naturezas diferentes; não se somam.",
        },
    ]
    itens += [
        {
            "tentativa": "Pontuar a exposição setorial a credibilidade, BC e risco institucional pelo mesmo critério (gasto a financiar)",
            "resultado": "Os três choques davam escores idênticos, sem informação. Trocado por Σ|delta| da alavanca própria nas decisões ligadas; 'juros_altos' ficou como coluna à parte (gasto a financiar).",
            "licao": "Um critério que não distingue os choques não mede fragilidade a cada um.",
        },
        {
            "tentativa": "Tratar 'independência do BC em queda' como estressor da dívida",
            "resultado": "No modelo, mais erosão do BC REDUZ ligeiramente a dívida/PIB (a inflação maior corrói a dívida nominal) e só eleva Selic e IPCA; sem câmbio nem dívida indexada o canal que piora a dívida não existe. Mantido no choque composto pela Selic/IPCA, não pela dívida.",
            "licao": "Resultado artefato da estrutura (ver `limites`), não evidência de que a perda de independência é inócua.",
        },
    ]
    if rs.get("algum_choque_unico_rompe") is False:
        itens.append(
            {
                "tentativa": "Achar um choque único que rompa o cenário pragmático",
                "resultado": "Nenhum choque isolado, no nível máximo testado, leva a dívida a mais de 120% em 2035; a ruptura exige combinação.",
                "licao": "Resultado do teste, não falha: o modelo é aditivo em prêmio e sem câmbio, então choques isolados são amortecidos.",
            }
        )
    return itens


LIMITES = [
    "Sem câmbio: não há canal de Blanchard (desvalorização → inflação → Selic), nem passivo externo; o canal clássico de crise de balanço de pagamentos está FORA do modelo e, portanto, o teste subestima ruptura por câmbio.",
    "Sem dívida indexada: toda a dívida é tratada como nominal com custo `implicit × Selic`; inflação maior CORRÓI a dívida no modelo, quando na prática parte é indexada a IPCA e Selic (e o repasse piora o estoque). O efeito de desancoragem sobre a dívida é subestimado ou até invertido.",
    "Defasagem: as decisões aplicam custo e benefício desde o 1º ano (`defasagem_anos` ignorado) e as vagas do STF entram desde 2027; benefícios tardios são subestimados e custos judiciais iniciais, superestimados.",
    "Eficiência de execução NÃO é medida: a faixa 0,4-1,0 e o central 0,6 são suposições ancoradas em proxies (obras paralisadas, emendas).",
    "Os deltas das decisões são julgamentos (base_evidencia='julgamento'); o ranking de fragilidade herda essa incerteza e não tem intervalo.",
    "Parâmetros de calibração (prem_inst, g_inst, prem_debt) não são elasticidades estimadas com intervalo; a calibração não melhorou o teste fora da amostra (RIGOR_DE_VALIDACAO, regra 1).",
    "Primário reage à dívida (Bohn) com custo político zero: em estresse real, a reação fiscal pode falhar, e o modelo é otimista nesse ponto; por outro lado, não há default nem reestruturação.",
    "Ruptura = dívida bruta > 120% do PIB: é limiar de modelo, não previsão de calote; acima dele a trajetória simulada não vale.",
    "Clima: choque constante de 0,6 pp/ano de PIB e 0,6 pp de prêmio é severidade hipotética (clima/macro.py), não estimativa; os dados históricos não identificam efeito agregado do clima no PIB.",
    "Base macro offline `data.FALLBACK` (dívida 82,86%, Selic 13,5%): se os dados mudarem, os níveis mudam.",
    "A fragilidade setorial é contagem e soma de ligações registradas, não elasticidade; saúde, educação e segurança têm poucas ligações registradas (ver `sem_ligacao`).",
    "Sem emprego, distribuição, mortalidade, nem efeitos sociais: o estresse mede apenas dívida, juros, inflação e PIB.",
]

SUPOSICOES = [
    "execution_efficiency (0,4-1,0; central 0,6) não é medida: proxies de obras paralisadas (TCU) e execução de emendas.",
    "Vazamento: só 10/25/50% do desvio de referência (1,84% do PIB, FIESP/Decomtec, extrapolação de percepção) vira primário a menos; cada pp perdido reduz a oferta em 0-0,27 pp/ano (central 0,10).",
    "Desperdício por ineficiência: 0,5/1,0/1,5% do PIB, parametrizado (sem medida aberta).",
    "Choque composto: credibilidade -0,40, erosão do BC +0,30, risco institucional +0,45, clima severo (0,6/0,6), eficiência 0,6, tecnologia 0; severidades escolhidas, não estimadas.",
    "Ruptura de regime = dívida bruta/PIB > 120% (scenarios.BREAK_DEBT).",
    "Liderança judicial: perfis dos indicados e perseguição de decisões por cenário são hipóteses; risco→prêmio (2,5 pp/unidade) e risco→PIB (1,2 pp/unidade) são parâmetros do modelo.",
    "Base macro: data.FALLBACK (BCB 08/2026 + Focus 02/10/2026), sem rede, para reprodutibilidade.",
]


def build(path: str | None = SAIDA, rapido: bool = False) -> dict:
    """`rapido` só reduz amostras do bloco judicial (uso em teste/depuração)."""
    ef = eficiencia_de_execucao()
    desp = desperdicio_como_choque()
    adv = cenario_adverso()
    jud = lideranca_judicial(
        draws=400 if rapido else 4000, n_total=800 if rapido else 3000, sens=not rapido
    )
    setor = fragilidade_setorial(ef)
    val = validacao(ef, adv)
    out = {
        "meta": {
            "gerado_em": date.today().isoformat(),
            "aviso": AVISO,
            "aviso_longo": (
                "Testes de estresse são cenários de risco: mostram o que o modelo diz quando "
                "premissas pessimistas se juntam, não o que vai acontecer. Nenhum resultado aqui "
                "tem probabilidade real de ocorrência."
            ),
            "suposicoes": SUPOSICOES,
            "base_macro": BASE.source,
            "sementes": list(SEMENTES),
        },
        "eficiencia_de_execucao": {k: ef[k] for k in ef},
        "desperdicio_como_choque": desp,
        "cenario_adverso": adv,
        "lideranca_judicial": jud,
        "fragilidade_setorial": setor,
        "validacao": val,
        "cemiterio": cemiterio(ef, adv, jud),
        "limites": LIMITES,
    }
    if path:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        Path(path).write_text(
            json.dumps(out, ensure_ascii=False, indent=1, default=_json_default),
            encoding="utf-8",
        )
    return out


def _json_default(o):
    if isinstance(o, (np.floating, np.integer)):
        return o.item()
    if isinstance(o, np.bool_):
        return bool(o)
    raise TypeError(type(o))

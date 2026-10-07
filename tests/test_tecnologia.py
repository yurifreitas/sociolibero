"""Testes offline: curvas sintéticas com parâmetros conhecidos + regressão do macro."""

import numpy as np
import pytest

from sociolibero import data, economy
from sociolibero import tecnologia as tec
from sociolibero.economy import Levers


def _ruido(y, s, seed):
    return y * np.exp(np.random.default_rng(seed).normal(0, s, len(y)))


def test_logistica_recupera_parametros():
    t = np.arange(2010, 2036, dtype=float)
    y = _ruido(tec.logistica(t, 100, 0.5, 2024), 0.01, 1)
    p, _ = tec.ajustar("logistica", t, y, K_max=1000)
    assert p["K"] == pytest.approx(100, rel=0.05)
    assert p["r"] == pytest.approx(0.5, rel=0.05)
    assert p["t0"] == pytest.approx(2024, abs=0.3)


def test_bass_recupera_parametros():
    t = np.arange(2020.0, 2040.0, 0.25)[1:]
    y = _ruido(tec.bass_cum(t, 200, 0.03, 0.4, 2020.0), 0.01, 2)
    p, _ = tec.ajustar("bass", t, y, K_max=2000, ts=2020.0)
    assert p["m"] == pytest.approx(200, rel=0.05)
    assert p["q"] == pytest.approx(0.4, rel=0.2)
    assert p["p"] == pytest.approx(0.03, rel=0.3)


def test_wright_e_exponencial_recuperam_parametros():
    x = np.geomspace(1, 1000, 30)
    c = _ruido(tec.wright(x, 80.0, 0.35), 0.01, 3)
    p, _ = tec.ajustar("wright", x, c)
    assert p["b"] == pytest.approx(0.35, abs=0.01)
    assert p["a"] == pytest.approx(80.0, rel=0.05)
    assert tec.taxa_aprendizado(1.0) == pytest.approx(0.5)
    t = np.arange(2000, 2020, dtype=float)
    y = _ruido(tec.exponencial(t, 5.0, -0.2, 2010.0), 0.01, 4)
    q, _ = tec.ajustar("exponencial", t, y, tref=2010.0)
    assert q["g"] == pytest.approx(-0.2, abs=0.01)
    assert q["a"] == pytest.approx(5.0, rel=0.05)


def test_teto_pouco_identificado_antes_do_ponto_de_inflexao():
    """Só a cauda inferior da S: a banda do teto precisa ser larga (honestidade sobre K)."""
    t = np.arange(2015, 2023, dtype=float)
    y = _ruido(tec.logistica(t, 100, 0.6, 2030), 0.03, 5)
    ps, _ = tec.bootstrap("logistica", t, y, np.array([2030.0]), B=60, K_max=5000)
    K = np.array([p["K"] for p in ps])
    assert np.percentile(K, 90) / np.percentile(K, 10) > 2.0


def test_validacao_fora_da_amostra_vs_baselines():
    t = np.arange(2005, 2031, dtype=float)
    y = _ruido(tec.logistica(t, 100, 0.5, 2020), 0.01, 6)
    v = tec.validar("logistica", t, y, 4, K_max=1000)
    assert v["modelo"]["rmse"] < v["ingenuo"]["rmse"]
    assert v["modelo"]["rmse"] < v["linear"]["rmse"]
    assert v["ganha_do_melhor_baseline"]
    assert len(v["previsto"]) == 4


def test_duracao_10_90_logistica():
    assert tec.duracao_10_90("logistica", {"r": 1.0}) == pytest.approx(2 * np.log(9))


def test_cenarios_difusao_ordenados():
    curvas = [
        {
            "id": f"c{i}",
            "modelo": "logistica",
            "parametros": {"K": 1, "r": r, "t0": 2020},
        }
        for i, r in enumerate([0.2, 0.4, 0.8, 1.6])
    ]
    c = tec.cenarios_difusao(curvas)["cenarios"]
    assert (
        c["lento"]["duracao_10_90_anos"]
        > c["base"]["duracao_10_90_anos"]
        > c["rapido"]["duracao_10_90_anos"]
    )
    assert c["lento"]["tech_rate"] < c["rapido"]["tech_rate"]


# --- macro: tech_productivity -------------------------------------------------------------
PRAG = Levers(0.8, 0.15, 0.05, 0.4, 0.8)


def test_tech_productivity_zero_mantem_resultados_antigos():
    """Valores de referência calculados com o `economy.simulate` ANTES da alavanca (idênticos bit a bit)."""
    base = data.FALLBACK
    r = economy.simulate(base, PRAG, np.random.default_rng(7), 500)
    got = [float(np.median(r[k][:, 8])) for k in ("debt", "selic", "ipca", "gdp")]
    assert got == pytest.approx([104.7335, 12.1422, 3.4956, 1.0738], abs=1e-4)
    d = economy.simulate(base, PRAG, np.random.default_rng(0), 10, shocks=False)
    assert [
        float(d[k][0, 8]) for k in ("debt", "selic", "ipca", "gdp")
    ] == pytest.approx([104.4783, 12.1354, 3.4625, 1.1181], abs=1e-4)
    # parâmetros da difusão não importam com produtividade 0
    from dataclasses import replace

    o = replace(PRAG, tech_midpoint=2029.0, tech_rate=2.0, tech_lag=3.0)
    r2 = economy.simulate(base, o, np.random.default_rng(7), 500)
    assert all(np.array_equal(r[k], r2[k]) for k in r)


def test_tech_productivity_positiva_eleva_pib_e_reduz_divida():
    from dataclasses import replace

    base = data.FALLBACK
    a = economy.simulate(base, PRAG, np.random.default_rng(7), 400)
    b = economy.simulate(
        base, replace(PRAG, tech_productivity=0.5), np.random.default_rng(7), 400
    )
    assert np.median(b["gdp"][:, 8]) > np.median(a["gdp"][:, 8])
    assert np.median(b["debt"][:, 8]) < np.median(a["debt"][:, 8])
    # saturação: o reforço cresce e fica limitado pela produtividade
    boosts = [
        economy.tech_boost(replace(PRAG, tech_productivity=0.5), float(y))
        for y in economy.YEARS
    ]
    assert boosts[0] < boosts[-1] <= 0.5 + 1e-9
    assert all(np.diff(boosts) >= 0)


def test_integracao_macro_estrutura_e_monotonia():
    curvas = [
        {
            "id": f"c{i}",
            "modelo": "logistica",
            "parametros": {"K": 1, "r": r, "t0": 2020},
        }
        for i, r in enumerate([0.3, 0.6, 1.2])
    ]
    m = tec.integracao_macro(curvas, n=150)
    assert set(m["resultados_2035"]) == {"lento", "base", "rapido"}
    assert "SUPOSIÇÃO" in m["suposicao_produtividade"]
    ef = {
        k: m["resultados_2035"][k]["2035"]["gdp"]["delta_vs_pragmatico"]
        for k in ("lento", "base", "rapido")
    }
    assert (
        ef["lento"] <= ef["base"] <= ef["rapido"]
    )  # difusão mais rápida chega antes a 2035
    s = [
        x
        for x in m["sensibilidade"]
        if x["parametro"] == "tech_productivity" and x["difusao"] == "base"
    ]
    d = [x["delta_pib_2035_pp"] for x in sorted(s, key=lambda x: x["valor"])]
    assert d == sorted(d) and d[-1] > d[0] > 0


@pytest.mark.skipif(
    not (tec.RAW / "ibge_sidra_7307_internet" / "PROVENIENCIA.json").exists(),
    reason="dados brutos não baixados (uv run sociolibero futuros baixar)",
)
def test_build_esquema_e_proveniencia(tmp_path):
    r = tec.build(n_macro=100, out=tmp_path / "futuros.json")
    assert set(r) == {"meta", "curvas", "integracao_macro"}
    assert {"gerado_em", "aviso", "lacunas"} <= set(r["meta"])
    assert len(r["curvas"]) >= 8
    for c in r["curvas"]:
        assert {"id", "rotulo", "dominio", "modelo", "fonte_dados", "limites"} <= set(c)
        assert c["modelo"] in ("logistica", "bass", "wright", "exponencial")
        if c.get("erro"):
            continue
        assert len(c["fonte_dados"]["sha256"]) == 64
        assert {"metodo", "periodo_treino", "erro_teste", "baseline_erro_teste"} <= set(
            c["ajuste"]
        )
        pr = c["projecao"]
        assert len(pr["anos"]) == len(pr["central"]) == len(pr["p10"]) == len(pr["p90"])
        assert set(c["cenarios"]) == {"lento", "base", "rapido"}
        assert c["pontos_observados"]

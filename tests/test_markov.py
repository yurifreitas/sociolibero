"""Testes offline de `markov.py`: verdade conhecida, identidades analíticas e regressões."""

from __future__ import annotations

import itertools

import numpy as np
import pandas as pd
import pytest

from sociolibero import data, scenarios
from sociolibero import markov as m

P_VERDADE = np.array(
    [
        [0.90, 0.08, 0.02, 0.00],
        [0.06, 0.88, 0.05, 0.01],
        [0.01, 0.05, 0.90, 0.04],
        [0.00, 0.01, 0.04, 0.95],
    ]
)


def _painel(P, n=150, T=120, seed=0):
    rng = np.random.default_rng(seed)
    sim = m.simular(P, rng.integers(0, 4, n), T - 1, rng)
    return sim.astype(np.int8), np.arange(1900, 1900 + T)


def test_recupera_cadeia_sintetica():
    S, anos = _painel(P_VERDADE, n=200, T=140)
    C = m.contar(S, anos, 1900, int(anos[-1])).sum(0)
    P = m.normalizar(C + 0.5)
    assert np.abs(P - P_VERDADE).max() < 0.02
    # cobertura do IC90 do posterior perto do nominal (média sobre células, com folga)
    rng = np.random.default_rng(1)
    cob = []
    for s in range(30):
        S2, a2 = _painel(P_VERDADE, n=60, T=100, seed=100 + s)
        C2 = m.contar(S2, a2, 1900, int(a2[-1])).sum(0)
        d = m.amostrar_P(C2 + 0.5, 400, rng)
        lo, hi = np.quantile(d, [0.05, 0.95], axis=0)
        pos = (
            P_VERDADE > 0
        )  # células de verdade zero não são cobríveis por um posterior com prior > 0
        cob.append((((P_VERDADE >= lo) & (P_VERDADE <= hi))[pos]).mean())
    assert 0.8 < float(np.mean(cob)) < 0.99


def test_estacionaria_identidade_e_simulacao():
    pi = m.estacionaria(P_VERDADE)
    assert pi.sum() == pytest.approx(1.0)
    assert np.allclose(pi @ P_VERDADE, pi, atol=1e-10)
    rng = np.random.default_rng(2)
    sim = m.simular(P_VERDADE, rng.integers(0, 4, 400), 600, rng)[:, 100:]
    freq = np.bincount(sim.ravel(), minlength=4) / sim.size
    assert np.abs(freq - pi).max() < 0.02
    # lote
    S, anos = _painel(P_VERDADE)
    d = m.amostrar_P(m.contar(S, anos, 1900, 2019).sum(0) + 1, 5, rng)
    assert np.allclose(m.estacionaria(d).sum(-1), 1.0)


def test_duracao_esperada_geometrica():
    assert m.duracao_esperada(P_VERDADE) == pytest.approx(1 / (1 - np.diag(P_VERDADE)))


def test_primeira_passagem_analitica_vs_simulacao():
    alvo = [0, 1]
    rng = np.random.default_rng(3)
    n, h = 40000, 12
    for origem in (2, 3):
        analitico = m.primeira_passagem(P_VERDADE, alvo, h)[origem]
        sim = m.simular(P_VERDADE, np.full(n, origem), h, rng)
        emp = np.isin(sim, alvo).any(1).mean()
        ep = np.sqrt(analitico * (1 - analitico) / n)
        assert abs(emp - analitico) < 4 * ep + 1e-4
    # monotonia em h e alvo contido
    p5, p10 = (m.primeira_passagem(P_VERDADE, alvo, h)[2] for h in (5, 10))
    assert p10 > p5
    assert (
        m.primeira_passagem(P_VERDADE, [1], 10)[2]
        <= m.primeira_passagem(P_VERDADE, [0, 1], 10)[2]
    )


def test_tempo_medio_passagem_vs_simulacao():
    alvo = [0, 1]
    esperado = m.tempo_medio_passagem(P_VERDADE, alvo)[2]
    rng = np.random.default_rng(4)
    sim = m.simular(P_VERDADE, np.full(6000, 2), 1500, rng)
    t = np.where(np.isin(sim, alvo).any(1), np.isin(sim, alvo).argmax(1), 1500)
    assert abs(t.mean() - esperado) < 0.08 * esperado


def test_projecoes_somam_um():
    rng = np.random.default_rng(5)
    d = m.amostrar_P(np.full((4, 4), 2.0) + 30 * np.eye(4), 50, rng)
    pr = m.projetar(d, 2, 13)
    assert pr.shape == (13, 50, 4)
    assert np.allclose(pr.sum(-1), 1.0)
    fan = m._fan_proj(d, 2, 2025)
    assert np.allclose(np.sum(fan["media_preditiva"], axis=1), 1.0, atol=1e-3)
    assert len(fan["p50"]) == len(m.ANOS_PROJ) == 12
    # quantis em ordem
    assert np.all(np.array(fan["p10"]) <= np.array(fan["p50"]) + 1e-9)
    assert np.all(np.array(fan["p50"]) <= np.array(fan["p90"]) + 1e-9)


def test_matriz_julgada_e_ocupacao_somam_um():
    M = m.matriz_julgada(0.07, 0.06)
    assert M.shape == (4, 4) and np.all(M >= 0) and np.allclose(M.sum(1), 1.0)
    w0 = np.array([0.2, 0.4, 0.28, 0.12])
    occ = m.ocupacao(M, w0)
    assert occ.shape == (4, 4) and np.allclose(occ.sum(1), 1.0)
    for ov in m.VARIANTES.values():
        Mv = m._M_variante({"eps": 0.07, "rho": 0.06}, ov, w0)
        assert np.allclose(Mv.sum(1), 1.0) and np.all(Mv >= 0)
    # mais erosão -> mais massa em 'extremo' ao fim
    o0 = m.ocupacao(m.matriz_julgada(0.07, 0.06, m_erosao=0.0), w0)[-1, 3]
    o4 = m.ocupacao(m.matriz_julgada(0.07, 0.06, m_erosao=4.0), w0)[-1, 3]
    assert o4 > o0


def test_ancoras_dependem_da_matriz():
    a = m.ancoras(P_VERDADE)
    assert 0 < a["eps"] < 1 and 0 < a["rho"] < 1
    assert a["eps"] == pytest.approx(m.primeira_passagem(P_VERDADE, [0, 1], 4)[2])


def test_weibull_detecta_dependencia_de_duracao():
    rng = np.random.default_rng(6)
    # geométrico (q=0.9): LRT pequeno
    L = rng.geometric(0.1, 600)
    cens = np.zeros(600, bool)
    r = m.lrt_duracao(L, cens)
    assert r["lrt"] < 8 and 0.7 < r["beta"] < 1.4
    # risco decrescente (Weibull discreta beta=0.5): LRT grande, beta < 1
    u = rng.random(600)
    lam = 0.3
    L2 = np.maximum(np.ceil((-np.log(u) / lam) ** (1 / 0.5)), 1).astype(int)
    r2 = m.lrt_duracao(L2, cens)
    assert r2["lrt"] > 30 and r2["beta"] < 0.8


def test_ordem2_nao_rejeita_cadeia_de_ordem1():
    S, anos = _painel(P_VERDADE, n=200, T=120, seed=7)
    r = m.lrt_ordem2(m.contagens3(S, anos, 1900, int(anos[-1])))
    assert r["lrt"] < 3 * max(r["gl"], 1)


def test_hmm_recupera_parametros():
    rng = np.random.default_rng(8)
    A = np.array([[0.9, 0.1], [0.2, 0.8]])
    mu, sd = np.array([-1.0, 4.0]), np.array([1.5, 1.0])
    _, y = m.hmm_simular(A, mu, sd, 800, rng)
    f = m.hmm_ajustar(y, 2, n_init=4, seed=1)
    assert np.abs(f["mu"] - mu).max() < 0.4
    assert np.abs(f["sd"] - sd).max() < 0.4
    assert np.abs(np.diag(f["A"]) - np.diag(A)).max() < 0.08
    assert f["ll"] > m.hmm_ajustar(y, 1, n_init=1)["ll"]
    # filtro soma 1 e previsão de classes soma 1
    al, *_ = m.hmm_filtrar(y, f["A"], f["mu"], f["sd"], f["pi0"])
    assert np.allclose(al.sum(1), 1.0)
    pc = m.hmm_previsao_classes(y, f, np.array([0.0, 2.5, 5.0]), [1, 5, 12])
    assert np.allclose(pc.sum(1), 1.0)


def test_kappa_escolhe_pouco_encolhimento_com_paises_heterogeneos():
    rng = np.random.default_rng(9)
    base = np.full((4, 4), 0.25)
    # países parecidos com a média: kappa alto
    homog = np.array([rng.multinomial(60, base[0], size=4) for _ in range(12)], float)
    k_hom, _ = m.escolher_kappa(homog, [base] * 12)
    # países com perfis opostos: kappa baixo
    het = []
    for i in range(12):
        p = np.eye(4)[i % 4] * 0.9 + 0.025
        het.append(np.array([rng.multinomial(60, p) for _ in range(4)], float))
    k_het, _ = m.escolher_kappa(np.array(het), [base] * 12)
    assert k_hom > k_het


def test_pontuacao_brier_e_logloss():
    D = np.zeros((4, 4))
    D[2, 2] = 10
    perfeita = np.eye(4)
    ll, br, n = m.pontuar(D, perfeita)
    assert n == 10 and br == pytest.approx(0.0) and ll == pytest.approx(0.0, abs=1e-9)
    ll2, br2, _ = m.pontuar(D, np.full((4, 4), 0.25))
    assert br2 == pytest.approx(10 * 0.75) and ll2 == pytest.approx(10 * np.log(0.25))


def test_mistura_quantis_bate_com_amostras_empilhadas(monkeypatch):
    monkeypatch.setattr(data, "load_macro_base", lambda: data.FALLBACK)
    am = m.amostras_cenarios(seed=7, n=300, base=data.FALLBACK)
    mist = m.Mistura(am["paths"], 300)
    occ = np.tile([0.25, 0.25, 0.25, 0.25], (3, 1))
    t = 5
    pool = np.concatenate([am["paths"][k]["debt"][:, t] for k in m.CEN])
    q = mist.quantis(occ, "debt", t, (0.1, 0.5, 0.9))
    assert q == pytest.approx(list(np.quantile(pool, [0.1, 0.5, 0.9])), rel=0.03)
    # peso total em um cenário reproduz esse cenário
    occ1 = np.tile([0, 1.0, 0, 0], (3, 1))
    q1 = mist.quantis(occ1, "debt", t, (0.5,))[0]
    assert q1 == pytest.approx(
        np.median(am["paths"]["pragmatico"]["debt"][:, t]), rel=0.02
    )


def test_amostras_consistentes_com_scenarios_run(monkeypatch):
    monkeypatch.setattr(data, "load_macro_base", lambda: data.FALLBACK)
    am = m.amostras_cenarios(seed=7, n=300, base=data.FALLBACK)
    r = scenarios.run(seed=7, n=300)
    t = r["table"]
    for k in ("lula", "extremo"):
        for v in ("debt", "gdp"):
            ref = t[
                (t.scenario == k) & (t["var"] == v) & (t.q == 50) & (t.year == 2038)
            ].value.iat[0]
            assert np.percentile(am["paths"][k][v][:, -1], 50) == pytest.approx(
                ref, abs=0.01
            )
    assert am["p_flavio"] == pytest.approx(r["p_flavio"])


def test_ruptura_cumulativa_monotona():
    am = {
        k: {
            "debt": np.cumsum(
                np.random.default_rng(0).normal(10 + i * 3, 2, (200, 12)), axis=1
            )
        }
        for i, k in enumerate(m.CEN)
    }
    rup = m.ruptura({k: {"debt": v["debt"] + 60} for k, v in am.items()})
    for k in m.CEN:
        f = list(rup[k]["p_acumulada_por_ano"].values())
        assert all(b >= a for a, b in itertools.pairwise(f))
    occ = np.tile([0.4, 0.3, 0.2, 0.1], (3, 1))
    assert m.ruptura_cadeia(rup, occ)["p_ruptura_ate_2038"] <= 1.0


def test_discretizacao_e_cadeia_economica():
    x = np.array([-1.0, 0.5, 3.0, 6.0, 2.0])
    assert m.discretizar(x, m.CORTES_PIB).tolist() == [0, 1, 2, 3, 1]
    z = m.discretizar(np.random.default_rng(0).normal(2.5, 3, 80), m.CORTES_PIB)
    P = m.normalizar(m.cadeia_econ_alpha(z))
    assert np.allclose(P.sum(1), 1.0)


def test_painel_real_brasil_2025_se_baixado():
    from pathlib import Path

    if not Path("data/raw/owid_political_regime/political-regime.csv").exists():
        pytest.skip("dados não baixados")
    S, codes, anos, _ = m.carregar_painel()
    ib = codes.index("BRA")
    assert S[ib, 2025 - anos[0]] == 2  # democracia eleitoral no dado (V-Dem v16)
    traj = m.trajetoria_brasil(S, codes, anos)
    assert traj[0][0] == 1822 and traj[-1][0] == 2025
    hist = pd.DataFrame(traj, columns=["a", "s"])
    assert hist.s.isin([0, 1, 2, 3]).all()

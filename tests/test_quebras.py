"""Testes offline de quebras.py (dados 100% sintéticos, verdade conhecida)."""

import numpy as np

from sociolibero import quebras as q


def test_quebra_de_media_recuperada():
    rng = np.random.default_rng(1)
    ok = 0
    for _ in range(12):
        y = q.simulate_break(rng, 100, "media", 7.0, 50, 0.5)
        br, modo, _ = q.detect_series(y, "alt")
        ok += modo == "nivel" and any(abs(b["tau"] - 50) <= 4 for b in br)
    assert ok >= 9  # validação: TPR ~1,0 para salto de 7-8 desvios com n=100


def test_quebra_de_variancia_e_tendencia_detectadas():
    rng = np.random.default_rng(2)
    v = t = 0
    for _ in range(10):
        r = q.test_series(q.simulate_break(rng, 100, "variancia", 4.0, 50, 0.5), "alt")
        v += r["variancia"]["p"] < 0.01
        r = q.test_series(q.simulate_break(rng, 100, "tendencia", 8.0, 50, 0.5), "alt")
        t += r["tendencia"]["p"] < 0.05
    assert v >= 7 and t >= 6


def test_fpr_perto_do_nominal_sob_nulo_ar1():
    rng = np.random.default_rng(3)
    ps = [
        q.test_series(q.simulate_null(rng, 60, "ar1_phi05"))["media"]["p"]
        for _ in range(200)
    ]
    fpr = np.mean(np.array(ps) < 0.05)
    assert 0.005 < fpr < 0.10


def test_nulo_sem_quebra_nao_gera_deteccao_sistematica():
    rng = np.random.default_rng(4)
    n_det = 0
    for _ in range(40):
        br, _, _ = q.detect_series(q.simulate_null(rng, 60, "ar1_tendencia"), "ols")
        n_det += bool(br)
    assert n_det <= 5  # <= 12,5% (nominal 5%; o procedimento é conservador)


def test_degrau_sem_tendencia_infla_em_serie_com_tendencia():
    """Honestidade: ignorar a tendência faz o teste de média 'achar' quebras em série sem quebra."""
    rng = np.random.default_rng(5)
    com = sem = 0
    for _ in range(60):
        y = q.simulate_null(rng, 100, "ar1_tendencia")
        r = q.test_series(y, "ols", True)
        r0 = q.test_series(y, "ols", False)
        com += r["media"]["p"] < 0.05
        sem += r0["media"]["p"] < 0.05
    assert sem > 3 * max(com, 1)


def test_holm_e_bh():
    p = [0.001, 0.02, 0.04, 0.5]
    h = q._holm(p)
    assert h[0] == 0.004 and h[-1] == 0.5 and np.all(np.diff(h) >= 0)
    assert np.all(q._bh(p) <= h + 1e-12)


def test_dp_mdl_acha_degrau_claro():
    rng = np.random.default_rng(6)
    y = rng.standard_normal(80) * 0.3
    y[40:] += 3
    cps = q.dp_segment(y, 2 * 0.09 * np.log(80))
    assert len(cps) == 1 and abs(cps[0] - 40) <= 2


def test_online_usa_so_o_passado():
    """Mudar o futuro não altera o caminho dos detectores online antes da mudança (sem vazamento)."""
    rng = np.random.default_rng(7)
    y = rng.standard_normal(60)
    y2 = y.copy()
    y2[40:] += 5
    for f in (q.page_path, q.sr_path, q.bocpd_path):
        a, b = f(y), f(y2)
        assert np.allclose(a[:38], b[:38])


def test_bocpd_alarma_apos_salto():
    rng = np.random.default_rng(8)
    y = rng.standard_normal(80)
    y[50:] += 4
    pth = q.bocpd_path(y)
    assert (
        pth[50:58].max() > 0.4 and pth[:45].max() < 0.3
    )  # pulso transitório de P(run<=5)


def test_permutacao_cruzamento_detecta_coincidencia_acima_do_acaso():
    spans = {"a": (1960, 2020), "b": (1960, 2020)}
    datas = [1964, 1994]  # poucas datas: coincidir é raro
    r = q.perm_cruzamento([("a", 1964), ("b", 1994)], spans, datas, tol=1, nperm=2000)
    assert r["coincidencias"] == 2 and r["p_permutacao"] < 0.05
    densas = list(range(1960, 2021))  # todo ano é data: nada é surpresa
    r2 = q.perm_cruzamento([("a", 1964), ("b", 1994)], spans, densas, tol=1, nperm=500)
    assert r2["p_permutacao"] > 0.9


def test_run_consecutivo_nao_interpola():
    run = q._run_consecutivo([[1990, 1], [1991, 2], [1993, 3], [1994, 4], [1995, 5]])
    assert [a for a, _ in run] == [1993, 1994, 1995]


def test_prepare_modo_diferenca_para_passeio_aleatorio():
    rng = np.random.default_rng(9)
    y = np.cumsum(rng.standard_normal(150)) + 100
    z, modo, off, _ = q.prepare(y)
    assert modo == "diferenca" and off == 1 and len(z) == 149

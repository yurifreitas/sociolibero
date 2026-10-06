import numpy as np

from sociolibero.eleicoes.forensics import digits, spatial, synthetic


def test_benford_second_digit_sums_to_one():
    assert abs(digits.BENFORD_2.sum() - 1) < 1e-12
    assert digits.BENFORD_2[0] > digits.BENFORD_2[9]


def test_last_digit_uniform_not_rejected_on_random_counts():
    rng = np.random.default_rng(0)
    ps = [
        digits.last_digit_uniform(rng.integers(50, 400, 600), min_n=100)["p"]
        for _ in range(200)
    ]
    assert 0.01 < np.mean(np.array(ps) < 0.05) < 0.12  # ≈ nominal 5%


def test_last_digit_detects_rounding():
    rng = np.random.default_rng(1)
    x = rng.integers(10, 80, 600) * 5
    assert digits.last_digit_uniform(x, min_n=100)["p"] < 1e-6
    assert digits.multiples_excess(x) < 1e-6


def test_small_samples_return_none():
    assert digits.last_digit_uniform(np.arange(60, 80), min_n=100)["p"] is None


def test_robust_z_flags_outlier_and_none_for_few_neighbors():
    vals = {str(i): 0.8 + 0.01 * (i % 3) for i in range(10)}
    vals["x"] = 0.99
    nb = {k: [m for m in vals if m != k] for k in vals}
    nb["lonely"] = ["0"]
    vals["lonely"] = 0.8
    z = spatial.robust_z(vals, nb)
    assert z["x"] > 4
    assert z["lonely"] is None


def test_synthetic_stuffing_is_detected_by_rho_but_not_digits():
    r = synthetic.run_validation(n_sim=60, n_sec=300, seed=5)
    st = next(c for c in r["cenarios"] if c["nome"] == "enchimento")["detectores"]
    assert st["rho_p"]["tpr"][-1] > 0.9  # 40% das seções
    assert st["ld_p"]["tpr"][-1] < 0.25
    fab = next(c for c in r["cenarios"] if c["nome"] == "fabricacao")["detectores"]
    assert fab["ld_p"]["tpr"][-1] > 0.9


def test_benford_second_digit_is_invalid_on_section_counts():
    """Regressão do achado: Benford 2BL rejeita quase sempre mesmo sem fraude."""
    r = synthetic.run_validation(n_sim=60, n_sec=300, seed=5)
    assert r["cenarios"][0]["detectores"]["b2_p"]["fpr"] > 0.5

import numpy as np

from sociolibero import decisoes, institutions


def test_catalog_ids_unique_and_deltas_known():
    ids = [d.id for d in decisoes.CATALOGO]
    assert len(ids) == len(set(ids))
    valid = {
        "primary_target",
        "institutional_risk",
        "bc_erosion",
        "supply_reform",
        "fiscal_credibility",
    }
    assert all(set(d.deltas) <= valid for d in decisoes.CATALOGO)
    assert all(d.instrumento in institutions.QUORUM for d in decisoes.CATALOGO)


def test_executive_decision_depends_only_on_alignment():
    rng = np.random.default_rng(0)
    d = next(x for x in decisoes.CATALOGO if x.id == "abertura-comercial")
    assert decisoes.p_approval(d, "direita", rng) == 1.0
    assert decisoes.p_approval(d, "esquerda", rng) == 0.0


def test_pec_is_harder_than_ordinary_law_for_same_position():
    rng = np.random.default_rng(0)
    pec = decisoes.Decisao("a", "a", "fiscal", "PEC", 0.5, 0.4, {}, "")
    lo = decisoes.Decisao("b", "b", "fiscal", "LO", 0.5, 0.4, {}, "")
    assert decisoes.p_approval(pec, "direita", rng) <= decisoes.p_approval(
        lo, "direita", rng
    )


def test_quorums_match_constitution():
    assert institutions.QUORUM["PEC"] == (308, 49)
    assert institutions.QUORUM["SENADO_2_3"] == (None, 54)
    assert sum(institutions.chamber_seats().values()) == 513
    assert sum(institutions.senate_seats().values()) == 81


def test_fiscal_loosening_raises_debt_and_tightening_lowers_it():
    ref = decisoes._run(decisoes.BASELINE)["debt"]
    loose = next(d for d in decisoes.CATALOGO if d.id == "flexibilizar-arcabouco")
    tight = next(d for d in decisoes.CATALOGO if d.id == "reforcar-arcabouco")
    assert decisoes._run(decisoes._apply(decisoes.BASELINE, loose.deltas))["debt"] > ref
    assert decisoes._run(decisoes._apply(decisoes.BASELINE, tight.deltas))["debt"] < ref

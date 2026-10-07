"""Testes offline de climars.py (fixture mínima de 3 municípios, sem rede e sem o projeto climate)."""

import json

from sociolibero import climars as cl


def _comp(i, d, e):
    def c(v, det=None):
        return {
            "valor": v,
            "basis": None if v is None else "measured",
            "detalhe": det or {},
        }

    return {
        "impacto": c(
            i,
            {}
            if i is not None
            else {"motivo": "municipio nao respondeu ao suplemento"},
        ),
        "deficit_prevencao": c(d),
        "exposicao": c(e),
        "perigo_sazonal": {"valor": 0.8, "basis": "measured", "detalhe": {}},
        "manutencao_ativos": {
            "valor": None,
            "basis": None,
            "detalhe": {"motivo": "sem fonte"},
        },
    }


def _score(i, d, e, mult):
    pres = {
        k: v
        for k, v in (("impacto", i), ("deficit_prevencao", d), ("exposicao", e))
        if v is not None
    }
    base = sum(cl.PESOS[k] * v for k, v in pres.items()) / sum(
        cl.PESOS[k] for k in pres
    )
    return round(100 * base * mult, 1)


def _mun(cod, nome, pop, i, d, e, mult=0.9, completude="completo", score="auto"):
    return {
        "cod_mun": cod,
        "municipio": nome,
        "populacao": pop,
        "aguas": {
            "permanente": {"km2": 1.0, "frac": 0.01},
            "sazonal": {"km2": 0, "frac": 0.0},
            "perdida": {"km2": 0, "frac": 0.0},
            "efemera": {"km2": 0, "frac": 0.0},
            "area_grade_km2": 100.0,
            "memoria_hidrica_km2": 0.0,
            "memoria_hidrica_frac": 0.0,
            "basis": "measured",
        },
        "score": _score(i, d, e, mult) if score == "auto" else score,
        "level": "low" if score == "auto" or score is not None else None,
        "basis": "modeled" if score == "auto" or score is not None else None,
        "completude": completude,
        "componentes": _comp(i, d, e),
    }


def _risk(mult):
    muns = [
        _mun(4300001, "Completo", 1000, 0.5, 0.4, 0.6, mult),
        _mun(
            4300002, "Parcial", 2000, 0.5, None, 0.6, mult, completude="parcial"
        ),  # peso 0.66
        _mun(
            4300003,
            "Bage",
            3000,
            None,
            None,
            0.97,
            mult,
            completude="insuficiente",
            score=None,
        ),
    ]
    return {
        "cenario_spec": {"multiplicador": mult},
        "municipios": muns,
        "model_card": {"version": "t", "limites": ["l1"]},
        "as_of": "2026-01-01",
        "n_total": 3,
        "n_completo": 1,
        "n_parcial": 1,
        "n_insuficiente": 1,
        "_snapshot": {"capturado_em": "2026-01-01T00:00:00Z"},
    }


def _dossie(cod):
    return {
        "posicao": {"posicao_no_ranking": 1 if cod != 4300003 else None},
        "perigo": {
            "impermeabilizacao": {
                "frac_construida": None,
                "limiar_rs": 0.019,
                "acima_do_limiar": None,
                "basis": "measured",
            },
            "terreno": {
                "cn2": 80.0,
                "cn3_solo_umido": 90.0,
                "resposta": "moderada",
                "basis": "modeled",
            },
            "degradacao_solo": None,
            "geotecnico": {"score": 0.1, "basis": "measured"},
            "acesso": {"dano_viario": None, "ficou_ilhado": None, "basis": None},
        },
    }


def _out():
    risk = {"atual": _risk(0.9), "estrutural": _risk(1.0), "ond2026": _risk(1.0)}
    dos = {str(c): _dossie(c) for c in (4300001, 4300002, 4300003)}
    geo = {"4300001": "Completo", "4300002": "Parcial", "4300003": "Bage"}
    pop = {"4300001": 1000, "4300002": 2100, "4300003": 3000}
    return cl.montar(risk, dos, geo, pop)


def test_cobertura_peso():
    c = _comp(0.5, None, 0.6)
    assert cl.cobertura_peso(c) == 0.66
    assert cl.cobertura_peso(_comp(None, None, 0.9)) == 0.28
    assert (
        cl.cobertura_peso(_comp(0.0, 0.0, 0.0)) == 1.0
    )  # zero medido conta como presente


def test_ausencia_e_null_nunca_zero():
    r = _out()
    b = r["linhas"]["4300003"]
    assert (
        b["indice"]["score_atual"] is None
        and b["indice"]["completude"] == "insuficiente"
    )
    assert (
        b["componentes"]["impacto"]["valor"] is None
        and b["componentes"]["impacto"]["basis"] is None
    )
    assert b["componentes"]["manutencao_ativos"] == {"valor": None, "basis": None}
    # campos ausentes no dossiê ficam null, não 0
    assert b["medidos"]["superficie_construida_ghsl"]["frac_construida"] is None
    assert b["medidos"]["acesso"]["dano_viario"] is None
    assert b["modelados"]["erosao_rusle"] is None
    assert b["indice"]["posicao_ranking_atual"] is None


def test_selo_por_componente_e_modelado_no_composto():
    r = _out()
    a = r["linhas"]["4300001"]
    assert a["indice"]["basis"] == "modeled"
    assert {k: x["basis"] for k, x in a["componentes"].items()} == {
        "impacto": "measured",
        "deficit_prevencao": "measured",
        "exposicao": "measured",
        "perigo_sazonal": "measured",
        "manutencao_ativos": None,
    }
    assert a["modelados"]["curve_number"]["basis"] == "modeled"


def test_validacao_juncao_populacao_cobertura_formula():
    v = _out()["meta"]["validacao"]
    assert v["juncao_ok"] and v["sem_geometria"] == [] and v["geometria_sem_dado"] == []
    assert v["populacao_snapshot_vs_territorios"]["n_comparados"] == 3
    assert v["populacao_snapshot_vs_territorios"]["n_iguais"] == 2
    assert v["regra_cobertura_minima"]["violacoes"] == []
    assert v["regra_cobertura_minima"]["n_sem_indice_corretamente"] == 1
    assert v["regra_cobertura_minima"]["min_cobertura_entre_com_indice"] == 0.66
    assert (
        v["reproducao_da_formula_atual"]["n"] == 2
        and v["reproducao_da_formula_atual"]["max_dif_abs"] < 0.11
    )
    assert v["sem_nenhum_componente_de_sinal"] == ["4300003"]
    assert v["componente_com_valor_sem_selo_valido"] == []


def test_validacao_pega_violacao_de_cobertura():
    risk = {"atual": _risk(0.9)}
    # promove Bagé por falta de dado (o erro da ADR-019): índice presente com cobertura 0.28
    risk["atual"]["municipios"][2]["score"] = 90.0
    r = cl.montar(risk, {}, {"4300001": "a", "4300002": "b", "4300003": "c"}, {})
    assert r["meta"]["validacao"]["regra_cobertura_minima"]["violacoes"] == ["4300003"]


def test_juncao_diferente_e_meta():
    risk = {"atual": _risk(0.9)}
    r = cl.montar(risk, {}, {"4300001": "a", "4399999": "z"}, {})
    v = r["meta"]["validacao"]
    assert (
        not v["juncao_ok"]
        and v["geometria_sem_dado"] == ["4399999"]
        and "4300002" in v["sem_geometria"]
    )
    assert "previsão" in r["meta"]["aviso"] and any(
        "manutencao_ativos" in x for x in r["meta"]["ressalvas"]
    )
    assert r["meta"]["modelo"]["cobertura_minima_peso"] == 0.60


def test_build_de_arquivos(tmp_path):
    snap = tmp_path / "snap"
    snap.mkdir()
    for n, m in (("atual", 0.9), ("estrutural", 1.0), ("ond2026", 1.0)):
        (snap / f"risk_municipal~cenario-{n}.json").write_text(
            json.dumps(_risk(m)), encoding="utf-8"
        )
    for c in (4300001, 4300002, 4300003):
        (snap / f"dossie_{c}~cenario-atual.json").write_text(
            json.dumps(_dossie(c)), encoding="utf-8"
        )
    feats = [
        {"properties": {"ibge": str(c), "nome": n, "uf": "RS"}}
        for c, n in ((4300001, "Completo"), (4300002, "Parcial"), (4300003, "Bage"))
    ]
    feats.append({"properties": {"ibge": "3500000", "nome": "Fora", "uf": "SP"}})
    geo = tmp_path / "g.json"
    geo.write_text(json.dumps({"features": feats}), encoding="utf-8")
    terr = tmp_path / "t.json"
    terr.write_text(
        json.dumps(
            {
                "linhas": {
                    "4300001": {"pop_total": 1000},
                    "4300002": {"pop_total": 2100},
                    "4300003": {"pop_total": 3000},
                    "3500000": {"pop_total": 9},
                }
            }
        ),
        encoding="utf-8",
    )
    out = tmp_path / "o" / "x.json"
    cl.build(snap, geo, terr, out)
    j = json.loads(out.read_text(encoding="utf-8"))
    assert len(j["linhas"]) == 3 and j["meta"]["validacao"]["juncao_ok"]

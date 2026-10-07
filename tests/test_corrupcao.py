"""Testes offline do custo da corrupção: curadoria válida, âncora em R$, cenário de recuperação."""

import json

from sociolibero import corrupcao, decisoes


def test_curadoria_valida():
    assert corrupcao.validar(corrupcao.carregar()) == []


def test_minimos_e_tipos():
    cur = corrupcao.carregar()
    assert len(cur["areas"]) >= 12
    assert len(cur["beneficios_a_empresas"]) >= 12
    assert len(cur["modelos"]) >= 10
    for a in cur["areas"]:
        for v in a["valores"]:
            assert v["tipo"] in {"contagem", "estimativa"}
            assert isinstance(v["verificado"], bool)
            assert v["fonte"] and v["periodo"] and v["metodo"]


def test_verificado_exige_url():
    cur = corrupcao.carregar()
    for a in cur["areas"]:
        for v in a["valores"]:
            assert not v["verificado"] or v["url"].startswith("http")


def test_pp_para_rs_bi_usa_pib_nominal():
    pib = corrupcao.ancora_pib()["valor_rs_bi"]
    assert pib > 5000  # PIB nominal brasileiro em R$ bi (ordem de grandeza)
    assert abs(corrupcao.pp_para_rs_bi(1.0) - pib / 100) < 1e-9
    assert corrupcao.pp_para_rs_bi(0.0) == 0.0


def test_valor_financeiro_segue_primary_target():
    assert corrupcao.valor_financeiro_decisao({"supply_reform": 0.1}) is None
    v = corrupcao.valor_financeiro_decisao({"primary_target": 0.6})
    assert v["rs_bi_ano"] > 0 and v["ancora_pib"]["ano"]
    n = corrupcao.valor_financeiro_decisao({"primary_target": -0.6})
    assert n["rs_bi_ano"] == -v["rs_bi_ano"]


def test_decisoes_export_traz_valor_financeiro():
    r = decisoes.run()
    por_id = {d["id"]: d for d in r["decisoes"]}
    cb = por_id["cortar-beneficios-fiscais"]
    assert cb["valor_financeiro"]["rs_bi_ano"] > 0
    assert por_id["direitos-da-natureza-municipais"]["valor_financeiro"] is None
    assert all("beneficiarios_empresas" in d for d in r["decisoes"])


def test_beneficios_ligados_a_decisoes_existentes():
    ids = {d.id for d in decisoes.CATALOGO}
    cur = corrupcao.carregar()
    ligados = [b for b in cur["beneficios_a_empresas"] if b.get("decisao_id")]
    assert ligados
    assert all(b["decisao_id"] in ids for b in ligados)


def test_recuperacao_monotona_e_proporcional():
    r = corrupcao.recuperacao_macro(corrupcao.carregar())
    c = r["cenarios"]
    assert [x["recuperado_pct"] for x in c] == [10, 25, 50]
    assert c[0]["primario_pp"] < c[1]["primario_pp"] < c[2]["primario_pp"]
    assert abs(c[2]["primario_pp"] - 5 * c[0]["primario_pp"]) < 0.01
    # mais primário => menos dívida e Selic não maior
    assert c[0]["debt_2035_delta"] < 0
    assert c[2]["debt_2035_delta"] < c[0]["debt_2035_delta"]
    assert c[2]["selic_2035_delta"] <= c[0]["selic_2035_delta"] <= 0
    assert "SUPOSIÇÃO" in r["suposicao"]


def test_build_nao_soma_e_grava(tmp_path):
    p = tmp_path / "cc.json"
    out = corrupcao.build(str(p))
    assert json.loads(p.read_text(encoding="utf-8"))["meta"]["ancora_pib"]
    assert "Não some" in out["nao_somar"]
    assert out["meta"]["resumo"]["valores"] >= 30
    assert set(out) >= {
        "meta",
        "panorama",
        "areas",
        "beneficios_a_empresas",
        "modelos",
        "recuperacao_macro",
        "nao_somar",
    }


def test_validar_detecta_problemas():
    cur = corrupcao.carregar()
    ruim = json.loads(json.dumps(cur))
    ruim["areas"][0]["valores"][0]["tipo"] = "palpite"
    ruim["beneficios_a_empresas"][0]["decisao_id"] = "nao-existe"
    erros = corrupcao.validar(ruim)
    assert any("tipo" in e for e in erros)
    assert any("inexistente" in e for e in erros)

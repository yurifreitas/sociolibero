"""Testes offline do módulo de estresse (`pessimismo.py`): sem rede, sem escrever em web/."""

from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from sociolibero import decisoes, economy, pessimismo as P, scenarios


def test_regressao_eficiencia_1_reproduz_o_catalogo():
    for d in decisoes.CATALOGO:
        assert P.aplicar_decisao(decisoes.BASELINE, d.deltas, 1.0) == decisoes._apply(
            decisoes.BASELINE, d.deltas
        )


def test_regressao_valores_dourados_do_baseline():
    """Valores calculados pelo código existente (economy.py inalterado) com a base offline."""
    r = P._det(decisoes.BASELINE)
    i = P.IDX[2035]
    assert r["debt"][i] == pytest.approx(104.478277, abs=1e-4)
    assert r["selic"][i] == pytest.approx(12.135434, abs=1e-4)
    assert r["ipca"][i] == pytest.approx(3.462481, abs=1e-4)
    assert r["gdp"][i] == pytest.approx(1.118114, abs=1e-4)


def test_regressao_cenarios_sem_choque_sao_identidade():
    for sc in scenarios.SCENARIOS:
        assert P.aplicar_choque(sc.levers, P.Choque()) == sc.levers


def test_beneficios_escalam_e_custos_ficam_integrais():
    d = {
        "supply_reform": 0.2,
        "primary_target": -0.5,
        "institutional_risk": -0.1,
        "bc_erosion": 0.2,
    }
    e = P.deltas_efetivos(d, 0.5)
    assert e["supply_reform"] == pytest.approx(0.1)
    assert e["institutional_risk"] == pytest.approx(-0.05)
    assert e["primary_target"] == -0.5  # custo
    assert e["bc_erosion"] == 0.2  # custo
    assert P.deltas_efetivos(d, 0.0)["supply_reform"] == 0.0
    c = P.deltas_efetivos(d, 0.5, sobrecusto=1.0)
    assert c["primary_target"] == pytest.approx(-0.75)


def test_eficiencia_fora_de_0_1_levanta():
    with pytest.raises(ValueError):
        P.deltas_efetivos({"supply_reform": 0.1}, 1.2)
    with pytest.raises(ValueError):
        P.deltas_efetivos({"supply_reform": 0.1}, -0.1)


def test_monotonicidade_mais_ineficiencia_nunca_melhora():
    sw = P.varredura_eficiencia(efs=(1.0, 0.8, 0.6, 0.4))
    assert len(sw) >= 20
    for i, por in sw.items():
        for hi, lo in ((1.0, 0.8), (0.8, 0.6), (0.6, 0.4)):
            assert (
                por[lo]["melhora_divida_pp"] <= por[hi]["melhora_divida_pp"] + 1e-9
            ), i


def test_monotonicidade_no_cenario_com_mesmos_choques():
    lv = P._lv_cenario("pragmatico")
    meds = []
    for e in (1.0, 0.7, 0.4):
        s = P._amostra(P.aplicar_eficiencia_cenario(lv, e), 7, 500)
        meds.append(float(np.median(s["debt"][:, P.IDX[2035]])))
    assert meds[0] <= meds[1] <= meds[2]


def test_eficiencia_de_cenario_nao_escala_deficit():
    lv = economy.Levers(-0.5, 0.3, 0.4, 0.3, 0.4)
    out = P.aplicar_eficiencia_cenario(lv, 0.5)
    assert out.primary_target == -0.5
    assert out.supply_reform == pytest.approx(0.15)


def test_vazamento_reduz_primario_e_oferta_e_piora_a_divida():
    lv = decisoes.BASELINE
    v = P.aplicar_vazamento(lv, 1.0, 0.1)
    assert v.primary_target == pytest.approx(lv.primary_target - 1.0)
    assert v.supply_reform == pytest.approx(lv.supply_reform - 0.1)
    d0 = P._det(lv)["debt"][P.IDX[2035]]
    d1 = P._det(v)["debt"][P.IDX[2035]]
    d2 = P._det(P.aplicar_vazamento(lv, 2.0, 0.1))["debt"][P.IDX[2035]]
    assert d0 < d1 < d2


def test_ranking_e_classes_da_eficiencia():
    r = P.eficiencia_de_execucao()
    rk = r["ranking_fragilidade"]
    perdas = [x["perda_divida_pp_a_40"] for x in rk]
    assert perdas == sorted(perdas, reverse=True)
    # a decisão fiscal de maior alvo de primário é a mais frágil em valor absoluto
    assert rk[0]["id"] == "reforcar-arcabouco"
    ids_sem = {x["id"] for x in r["sem_beneficio_a_perder"]}
    assert "flexibilizar-arcabouco" in ids_sem  # só tem custo: nada a perder
    assert all(x["perda_divida_pp_a_40"] >= 0 for x in rk)
    assert r["faixa_proxies"][0] < r["eficiencia_central_pessimista"] < 1.0
    assert 0.0 < r["faixa_proxies"][1] <= 1.0
    # sensibilidade declarada
    assert r["sensibilidade"]["variantes"]


def test_visoes_pessimistas_ausente_nao_quebra(monkeypatch, tmp_path):
    monkeypatch.setattr(P, "VISOES", str(tmp_path / "nao_existe.json"))
    assert P._visoes_pessimistas() is None


def test_adverso_piora_em_relacao_ao_baseline_com_mesmas_sementes():
    lv = P._lv_cenario("pragmatico")
    a = P._amostra(lv, 7, 400)
    b = P._amostra(P.aplicar_choque(lv, P.ADVERSO), 7, 400)
    i = P.IDX[2035]
    assert np.median(b["debt"][:, i]) > np.median(a["debt"][:, i])
    assert np.median(b["selic"][:, i]) > np.median(a["selic"][:, i])
    assert np.median(b["gdp"][:, i]) < np.median(a["gdp"][:, i])


def test_resumo_marca_trajetoria_invalida_apos_ruptura():
    lv = P.aplicar_choque(P._lv_cenario("hegemonia"), P.ADVERSO)
    r = P._rodar(lv, (7, 11, 13), 300)
    assert r["sementes"] == 3
    assert r["prob_ruptura_qualquer_ano"] == 1.0
    assert r["anos"]["2038"]["valido_como_trajetoria"] is False
    for y in ("2030", "2035", "2038"):
        c = r["anos"][y]["debt"]
        assert c["p10"] <= c["p50"] <= c["p90"]


def test_reverse_stress_grade_pequena_acha_a_combinacao_minima():
    niv = {
        "cred": (0.0, 0.45),
        "bc": (0.0, 0.3),
        "inst": (0.0, 0.45),
        "clima": (0.0, 1.0),
        "eficiencia": (1.0, 0.4),
        "desvio_pp": (0.0, 1.5),
    }
    r = P.reverse_stress("pragmatico", niv, verificar=0)
    assert r["combinacoes_avaliadas"] == 2**6
    assert r["ja_rompe_sem_choque"] is False
    assert r["minimas"], "deveria haver combinação que rompe"
    m = r["minimas"][0]
    # nenhuma combinação mais barata rompe
    assert m["custo"] <= min(x["custo"] for x in r["menor_numero_de_choques"])
    assert m["divida_2035_central"] > P.BREAK
    # o baseline (sem choque) está abaixo do limiar
    assert r["divida_2035_sem_choque"] < P.BREAK


def test_reverse_stress_hegemonia_ja_rompe_sem_choque():
    r = P.reverse_stress("hegemonia", {"cred": (0.0, 0.1)}, verificar=0)
    assert r["ja_rompe_sem_choque"] is True


def test_judicial_distribuicao_soma_1_e_contrafactual():
    j = P.lideranca_judicial(draws=300, n_total=500, sens=False)
    for k, d in j["vagas_capturadas"]["distribuicao"].items():
        dist = d["distribuicao_vagas_capturadas"]
        assert sum(dist.values()) == pytest.approx(1.0, abs=1e-3)
        assert set(dist) == {"0", "1", "2", "3"}
    d = j["vagas_capturadas"]["distribuicao"]
    # perfis técnicos não capturam vaga
    assert d["pragmatico"]["distribuicao_vagas_capturadas"]["0"] == pytest.approx(1.0)
    assert d["lula"]["distribuicao_vagas_capturadas"]["0"] == pytest.approx(1.0)
    # hegemonia e extremo têm alguma chance de captura
    assert d["hegemonia"]["p_pelo_menos_uma"] > 0.05
    assert d["extremo"]["p_pelo_menos_uma"] > 0.05
    r = j["risco_institucional"]
    for k in r:
        assert r[k]["p10"] <= r[k]["p50"] <= r[k]["p90"]
    # o contrafactual (canal judicial neutro) nunca fica acima do cenário nos cenários com agenda
    for k in ("hegemonia", "extremo"):
        assert j["contrafactual"][k]["risco_institucional"] <= r[k]["media"] + 1e-9
    assert "SUPOSIÇÃO" in j["suposicao_mapeamento"]
    assert [v["ano"] for v in j["calendario_vagas"]] == [2028, 2029, 2030]
    assert j["quorum_senado"] == 41


def test_fragilidade_setorial_cobre_setores_e_declara_lacunas():
    linhas = P.fragilidade_setorial()
    assert {x["choque"] for x in linhas} == set(P.CHOQUES_SETOR)
    for x in linhas:
        assert set(x["setores"]) == set(P.SETORES)
        assert x["mais_exposto"]
        for s in x["setores"].values():
            assert s["escore"] is None or s["escore"] >= 0
            assert s["base"] and s["nota"]
    tec = next(x for x in linhas if x["choque"] == "tecnologia_nula")
    assert "energia" in tec["mais_exposto"]
    assert (
        "saúde" in tec["sem_ligacao"]
    )  # sem ligação registrada: None, nunca 0 inventado
    ex = next(x for x in linhas if x["choque"] == "execucao_ineficiente")
    assert ex["mais_exposto"] == ["fiscal"]


def test_arquivo_gerado_tem_o_formato_pedido():
    import json
    from pathlib import Path

    p = Path(P.SAIDA)
    if not p.exists():
        pytest.skip("rode `uv run sociolibero pessimismo build`")
    d = json.loads(p.read_text(encoding="utf-8"))
    for k in (
        "meta",
        "eficiencia_de_execucao",
        "desperdicio_como_choque",
        "cenario_adverso",
        "lideranca_judicial",
        "fragilidade_setorial",
        "validacao",
        "cemiterio",
        "limites",
    ):
        assert k in d
    assert d["meta"]["aviso"] == "cenários de risco, não previsões"
    assert d["meta"]["suposicoes"]
    assert {"varredura", "ranking_fragilidade", "robustas"} <= set(
        d["eficiencia_de_execucao"]
    )
    assert {"baseline", "resultados", "prob_ruptura", "reverse_stress"} <= set(
        d["cenario_adverso"]
    )
    assert {"vagas_capturadas", "risco_institucional", "macro", "contrafactual"} <= set(
        d["lideranca_judicial"]
    )
    assert d["validacao"]["regressao"]["eficiencia_1_igual_ao_catalogo"] is True
    assert d["validacao"]["monotonicidade"]["violacoes"] == []
    assert len(d["validacao"]["sementes"]["sementes"]) >= 3


def test_levers_nao_foi_modificado():
    """A alavanca de eficiência vive em pessimismo.py; Levers mantém os campos originais."""
    campos = set(economy.Levers.__dataclass_fields__)
    assert "execution_efficiency" not in campos
    assert replace(decisoes.BASELINE) == decisoes.BASELINE

"""Testes offline do módulo de clima: parsers, estatística com verdade conhecida, regressão do macro."""

import io
import json
import zipfile
from datetime import date

import numpy as np
import pandas as pd
import pytest

from sociolibero import data, economy
from sociolibero.clima import build as cb
from sociolibero.clima import estat, ingest, macro, parse
from sociolibero.economy import Levers
from sociolibero.scenarios import SCENARIOS


# ----------------------------------------------------------------------------- ENSO
def _oni_txt(valores):
    """valores: lista de (ano, mês_central, anomalia) -> texto no formato do CPC."""
    out = [" SEAS  YR   TOTAL   ANOM"]
    for a, m, v in valores:
        out.append(f"  {parse.SEASONS[m - 1]} {a}  26.00  {v:5.2f}")
    return "\n".join(out)


def test_oni_parse_e_pico_ndj():
    t = _oni_txt([(1997, 11, 2.0), (1997, 12, 2.3), (1998, 1, 2.4)])
    o = parse.oni(t)
    assert o == [(1997, 11, 2.0), (1997, 12, 2.3), (1998, 1, 2.4)]
    assert parse.oni_pico(o) == {
        1997: 2.3
    }  # NDJ de 1997 (centro em dez/1997) é o pico do evento de 1997


def test_episodios_oni_regra_de_cinco_janelas():
    seq = []
    ym = [(1997, m) for m in range(5, 13)] + [(1998, m) for m in range(1, 8)]
    vals = [0.6, 0.9, 1.4, 1.8, 2.1, 2.3, 2.2, 2.4, 2.2, 1.9, 1.2, 0.6, 0.2, -0.1, -0.3]
    seq = [(a, m, v) for (a, m), v in zip(ym, vals, strict=True)]
    # curto demais (4 janelas) não conta
    seq += [
        (1998, 8, -0.6),
        (1998, 9, -0.7),
        (1998, 10, -0.8),
        (1998, 11, -0.9),
        (1998, 12, -0.4),
    ]
    ep = parse.episodios_oni(seq)
    assert len(ep) == 1
    e = ep[0]
    assert e["tipo"] == "El Niño" and e["janelas"] == 12
    assert (
        e["oni_pico"] == 2.4 and e["ano_pico"] == 1997
    )  # pico em jan/1998 = DJF 1998 -> ano 1997
    assert e["inicio"] == "1997-04"


def test_classe_enso():
    c = parse.classe_enso({2000: -0.9, 2001: 0.1, 2002: 0.5})
    assert c == {2000: "la_nina", 2001: "neutro", 2002: "el_nino"}


def test_hadisst_grade_e_pico_mensal():
    linha = lambda a, v: f" {a} " + " ".join(f"{x:7.2f}" for x in v)
    t = "\n".join(
        [
            "      1870        2026",
            linha(1997, [0] * 10 + [2.0, 2.4]),
            linha(1998, [2.2] + [-99.99] * 11),
            "  HadISST ",
        ]
    )
    g = parse.monthly_grid(t)
    assert (1998, 2) not in g  # -99.99 = sem dado
    assert parse.pico_mensal(g) == {
        1997: pytest.approx((2.0 + 2.4 + 2.2) / 3, abs=1e-3)
    }


def test_mei_v2_ignora_sem_dado():
    m = parse.mei_v2(
        "header\n2025,1.0,1.1,***,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2.0,2.1,0,0,0,0,0,0\n"
    )
    assert m[(2025, 1)] == 1.0 and (2025, 3) not in m and m[(2025, 12)] == 2.1


# ----------------------------------------------------------------------------- temperatura
def test_berkeley_mensal_anual_e_base():
    t = "\n".join(
        [
            "%%  Estimated Jan 1951-Dec 1980 absolute temperature (C): 24.98 +/- 0.09",
            "% comentário",
            "  1950     5    -0.100  0.2       NaN    NaN       NaN    NaN       NaN    NaN       NaN    NaN",
            "  1950     6     0.200  0.2     0.050  0.1       NaN    NaN       NaN    NaN       NaN    NaN",
        ]
    )
    m, an, base = parse.berkeley(t)
    assert base == 24.98 and m[(1950, 5)] == (-0.1, 0.2) and an == {1950: (0.05, 0.1)}


def test_giss_e_cckp():
    g = parse.giss(
        "Land-Ocean\nYear,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,J-D,D-N\n1880,0,0,0,0,0,0,0,0,0,0,0,0,-.18,***\n2026,0,0,0,0,0,0,0,0,***,***,***,***,***,***\n"
    )
    assert g == {1880: -0.18}
    j = json.dumps(
        {
            "data": {
                "pr": {"BRA": {"1901-07": 1777.8}},
                "tas": {"BRA": {"1901-07": 24.9}},
            }
        }
    )
    assert parse.cckp_anual(j, "pr") == {1901: 1777.8}
    jm = json.dumps({"data": {"BRA": {"1901-01": 237.07, "1901-02": 224.4}}})
    assert parse.cckp_mensal(jm)[(1901, 2)] == 224.4


# ----------------------------------------------------------------------------- ONS / INPE / IBGE
def test_ons_mensal_e_fim_de_novembro():
    df = pd.DataFrame(
        {
            "id_subsistema": ["SE"] * 5,
            "d": ["2021-11-29", "2021-11-30", "2021-12-01", "2021-11-01", "2020-11-30"],
            "v": [18.0, 19.0, 25.0, 10.0, 30.0],
        }
    )
    m = parse.ons_mensal([df], "d", "v")
    assert m["SE"]["2021-11"] == pytest.approx((18 + 19 + 10) / 3)
    assert parse.ons_fim_de_mes([df], "d", "v", 11)["SE"] == {2020: 30.0, 2021: 19.0}
    assert parse.media_anual_de_mensal(
        {f"2020-{m:02d}": 1.0 for m in range(1, 13)} | {"2021-01": 9.0}
    ) == {2020: 1.0}


def _zip(nome, texto, enc):
    b = io.BytesIO()
    with zipfile.ZipFile(b, "w") as z:
        z.writestr(nome, texto.encode(enc))
    return b.getvalue()


@pytest.mark.parametrize("enc", ["utf-8", "latin-1"])
def test_focos_zip_codificacoes_e_subdiretorio(enc):
    csv = "id_bdq,foco_id,data_pas,bioma\n1,a,2019-08-01 10:00:00,Amazônia\n2,b,2019-08-02 10:00:00,Cerrado\n3,c,2019-09-01 10:00:00,\n"
    tot, amz, sem = parse.focos_zip(_zip("tmp/focos.csv", csv, enc))
    assert tot == {"2019-08": 2, "2019-09": 1} and amz == {"2019-08": 1} and sem == 1


def test_focos_zip_recusa_caminho_suspeito():
    with pytest.raises(ValueError):
        parse.focos_zip(_zip("../x.csv", "a,b\n", "utf-8"))


def test_deter_mensal_separa_desmatamento():
    t = "FID,classname,view_date,areamunkm\na,DESMATAMENTO_CR,2020-01-05,1.5\nb,MINERACAO,2020-01-09,0.5\nc,DEGRADACAO,2020-01-10,3\n"
    d, o = parse.deter_mensal(t)
    assert d == {"2020-01": 2.0} and o == {"2020-01": 3.0}


def test_sidra_pib_setor_usa_quarto_trimestre():
    rows = [{"hdr": 1}] + [
        {"D3C": "202004", "D4C": "90687", "V": "2.0"},
        {"D3C": "202003", "D4C": "90687", "V": "9.9"},
        {"D3C": "202104", "D4C": "90687", "V": "-"},
    ]
    assert parse.pib_setor_anual(json.dumps(rows)) == {"90687": {2020: 2.0}}


def test_acumulado_anual_composto_e_incompleto():
    m = {(2020, i): 1.0 for i in range(1, 13)} | {(2021, 1): 5.0}
    an, inc = parse.acumulado_anual(m)
    assert an[2020] == pytest.approx((1.01**12 - 1) * 100, abs=1e-3) and inc == [2021]
    s = parse.sgs_mensal(json.dumps([{"data": "01/02/1991", "valor": "18.49"}]))
    assert s == {(1991, 2): 18.49}


def test_ipca_mensal_junta_fontes():
    a = json.dumps([{}, {"D3C": "201912", "D4C": "7170", "V": "0.5"}])
    b = json.dumps(
        [
            {},
            {"D3C": "202001", "D4C": "7170", "V": "0.4"},
            {"D3C": "202001", "D4C": "7169", "V": "..."},
        ]
    )
    r = parse.ipca_mensal([a, b])
    assert r["7170"] == {(2019, 12): 0.5, (2020, 1): 0.4} and "7169" not in r


# ----------------------------------------------------------------------------- estatística
def test_correlacao_recupera_r_conhecido_e_ic_cobre():
    rng = np.random.default_rng(1)
    n = 120
    x = rng.normal(size=n)
    y = 0.5 * x + np.sqrt(1 - 0.25) * rng.normal(size=n)
    r = estat.correlacao(np.arange(n, dtype=float), x, y, B=500)
    assert r["ic95"][0] < 0.5 < r["ic95"][1] or abs(r["pearson"] - 0.5) < 0.2
    assert r["ic95"][0] > 0.2  # n grande: claramente positiva
    assert r["n"] == n and r["bloco"] >= 2


def test_ruido_independente_ic_inclui_zero():
    rng = np.random.default_rng(2)
    r = estat.correlacao(
        np.arange(30.0), rng.normal(size=30), rng.normal(size=30), B=500
    )
    assert r["ic95"][0] <= 0 <= r["ic95"][1]


def test_destendenciar_remove_correlacao_espuria():
    t = np.arange(40.0)
    rng = np.random.default_rng(3)
    x = 0.1 * t + rng.normal(0, 0.3, 40)
    y = 0.2 * t + rng.normal(0, 0.3, 40)
    bruto = estat.correlacao(t, x, y, tendencia=False, B=200)
    limpo = estat.correlacao(t, x, y, tendencia=True, B=200)
    assert bruto["pearson"] > 0.9 and abs(limpo["pearson"]) < 0.5


def test_poucos_pares_nao_estima():
    r = estat.correlacao(np.arange(5.0), np.arange(5.0), np.arange(5.0))
    assert r["pearson"] is None


def test_alinhar_defasagem():
    x = {2000: 1.0, 2001: 2.0, 2002: 3.0}
    y = {2001: 10.0, 2002: 20.0, 2003: 30.0}
    t, xx, yy = estat.alinhar(x, y, lag=1)
    assert list(t) == [2000, 2001, 2002] and list(yy) == [10, 20, 30]
    t, *_ = estat.alinhar(x, y, lag=1, ini=2002)
    assert list(t) == [2001, 2002]


def test_diferenca_e_tendencia():
    rng = np.random.default_rng(4)
    y = rng.normal(0, 1, 60)
    g = np.zeros(60, bool)
    g[::4] = True
    y[g] += 3.0
    d = estat.diferenca_medias(y, g, B=500)
    assert 2 < d["valor"] < 4 and d["ic95"][0] > 0
    t = np.arange(50.0)
    tr = estat.tendencia_linear(t, 0.02 * t + rng.normal(0, 0.1, 50), B=500)
    assert (
        tr["por_decada"] == pytest.approx(0.2, abs=0.05)
        and tr["ic95"][0] < 0.2 < tr["ic95"][1]
    )


def test_reprodutivel():
    t = np.arange(30.0)
    x = np.sin(t)
    y = np.cos(t) + 0.1 * t
    assert estat.correlacao(t, x, y, B=200) == estat.correlacao(t, x, y, B=200)


# ----------------------------------------------------------------------------- macro: regressão
GOLDEN = {  # capturado ANTES de existir climate_shock (n=300, semente 7, base data.FALLBACK)
    "lula": {
        "debt": 127.486691,
        "selic": 15.896536,
        "ipca": 4.431935,
        "gdp": -0.261835,
    },
    "pragmatico": {
        "debt": 102.195909,
        "selic": 11.422333,
        "ipca": 3.412949,
        "gdp": 1.158059,
    },
    "hegemonia": {
        "debt": 143.258572,
        "selic": 19.947092,
        "ipca": 5.870074,
        "gdp": -0.956865,
    },
    "extremo": {
        "debt": 172.259147,
        "selic": 25.362877,
        "ipca": 7.41889,
        "gdp": -2.38402,
    },
}


def _sim(lv, n=300):
    rng = np.random.default_rng(7)
    p = economy.DEFAULT.with_(neutral_real=rng.uniform(3.5, 5.5, n))
    return economy.simulate(data.FALLBACK, lv, rng, n, p)


@pytest.mark.parametrize("sc", SCENARIOS, ids=lambda s: s.key)
def test_climate_shock_padrao_nao_muda_resultados(sc):
    assert sc.levers.climate_shock == 0.0 and sc.levers.climate_premium == 0.0
    r = _sim(sc.levers)
    for v, ref in GOLDEN[sc.key].items():
        assert float(np.median(r[v][:, 8])) == pytest.approx(ref, abs=1e-5)


def test_climate_shock_reduz_pib_e_eleva_divida_e_preserva_tech():
    prag = next(s.levers for s in SCENARIOS if s.key == "pragmatico")
    base = _sim(prag)
    sh = _sim(Levers(**{**prag.__dict__, "climate_shock": 0.5}))
    pr = _sim(Levers(**{**prag.__dict__, "climate_premium": 1.0}))
    assert np.median(sh["gdp"][:, 5] - base["gdp"][:, 5]) < -0.3
    assert np.median(sh["debt"][:, -1] - base["debt"][:, -1]) > 0
    assert np.median(pr["selic"][:, 5] - base["selic"][:, 5]) > 0.2
    # tech_productivity continua valendo junto com o choque
    t = Levers(**{**prag.__dict__, "tech_productivity": 0.5, "climate_shock": 0.2})
    t0 = Levers(**{**prag.__dict__, "tech_productivity": 0.5})
    assert np.median(_sim(t)["gdp"][:, -1]) < np.median(_sim(t0)["gdp"][:, -1])
    assert np.median(_sim(t0)["gdp"][:, -1]) > np.median(base["gdp"][:, -1])


def test_integracao_macro_rotulada_como_suposicao():
    r = macro.integracao(n=60)
    assert "SUPOSIÇÃO" in r["suposicao"]
    assert set(r["severidades_suposicao"]) == {"leve", "moderado", "severo"}
    d = [
        r["severidades_suposicao"][k]["2035"]["debt"]["delta_mediano"]
        for k in ("leve", "moderado", "severo")
    ]
    assert d == sorted(d) and d[0] > 0
    assert len(r["sensibilidade"]) == len(macro.GRADE_SHOCK) * len(macro.GRADE_PREMIO)


# ----------------------------------------------------------------------------- ingest e build
def test_meses_gera_blocos_contiguos():
    bl = list(ingest._meses(date(2016, 11, 1), date(2017, 2, 10)))
    assert bl[0] == (date(2016, 11, 1), date(2016, 11, 30))
    assert bl[1] == (date(2016, 12, 1), date(2016, 12, 31))
    assert bl[-1] == (date(2017, 2, 1), date(2017, 2, 28))
    assert len(bl) == 4


def test_tarefas_cobrem_as_fontes_pedidas():
    nomes = {n for n, _, _ in ingest.tarefas()}
    for esperado in (
        "noaa_oni",
        "noaa_meiv2",
        "berkeley_brazil_tavg",
        "cckp_clima_brasil",
        "ons_ear_subsistema",
        "ons_cmo_semanal",
        "inpe_focos_ref_anual",
        "inpe_deter_amz",
        "sidra_5932_pib_setores",
    ):
        assert esperado in nomes


def test_build_sem_dados_baixados_vira_lacuna_nao_erro(tmp_path, monkeypatch):
    from sociolibero.series import ingest as si

    monkeypatch.setattr(si, "RAW", tmp_path / "raw")
    monkeypatch.setattr(cb, "RAW", tmp_path / "raw")
    monkeypatch.setattr(cb, "SERIES_HIST", tmp_path / "nao_existe.json")
    out = tmp_path / "clima.json"
    r = cb.build(out=out, n_macro=40)
    j = json.loads(out.read_text(encoding="utf-8"))
    assert j["series"] == [] and j["relacoes"] == []
    assert any("não baixado" in l["motivo"] for l in j["meta"]["lacunas"])
    assert "causalidade" in j["meta"]["aviso"]
    assert {
        "meta",
        "series",
        "relacoes",
        "episodios",
        "cenarios_futuros",
        "integracao_macro",
    } <= set(j)
    assert r["resumo"]["n_relacoes"] == 0


def test_curadoria_tem_fonte_e_nao_inventa_verificado():
    for arq, chave in (
        ("ipcc_ar6.json", "cenarios_futuros"),
        ("cenarios.json", "cenarios_futuros"),
        ("episodios.json", "episodios"),
    ):
        c = json.loads((cb.CURADORIA / arq).read_text(encoding="utf-8"))
        assert c[chave]
        for it in c[chave]:
            assert it.get("verificado") in (True, False)
            if chave == "cenarios_futuros":
                assert it["fonte_url"].startswith("http") and it["trecho_conferido"]
            else:
                assert it["fontes"] and all(
                    f["url"].startswith("http") for f in it["fontes"]
                )

"""Testes offline de indigenas.py (fixture mínima de candidaturas e de municípios)."""

import math

from shapely.geometry import box

from sociolibero import indigenas as I

COLS = [
    "SQ_CANDIDATO", "SG_UF", "DS_CARGO", "SG_PARTIDO", "DS_COR_RACA",
    "DS_SITUACAO_CANDIDATURA", "DS_SIT_TOT_TURNO", "NR_TURNO", "NM_URNA_CANDIDATO",
]  # fmt: skip

LINHAS = [
    (
        "1",
        "AC",
        "DEPUTADO FEDERAL",
        "PT",
        "INDÍGENA",
        "APTO",
        "ELEITO POR QP",
        "1",
        "Fulana",
    ),
    (
        "2",
        "AC",
        "DEPUTADO FEDERAL",
        "PL",
        "BRANCA",
        "APTO",
        "NÃO ELEITO",
        "1",
        "Beltrano",
    ),
    (
        "3",
        "AM",
        "DEPUTADO ESTADUAL",
        "PSOL",
        "INDÍGENA",
        "APTO",
        "SUPLENTE",
        "1",
        "Ciclano",
    ),
    ("4", "AM", "DEPUTADO ESTADUAL", "XYZ", "PARDA", "APTO", "ELEITO", "1", "Outro"),
    ("5", "AM", "GOVERNADOR", "MDB", "INDÍGENA", "APTO", "2º TURNO", "1", "Gov"),
    ("5", "AM", "GOVERNADOR", "MDB", "INDÍGENA", "APTO", "ELEITO", "2", "Gov"),
    ("6", "AM", "1º SUPLENTE", "MDB", "INDÍGENA", "APTO", "ELEITO", "1", "Sup"),
]


def _fixture(tmp_path, ano=2022):
    pasta = tmp_path / f"consulta_cand_{ano}"
    pasta.mkdir()
    txt = ";".join(f'"{c}"' for c in COLS) + "\n"
    for r in LINHAS:
        txt += ";".join(f'"{v}"' for v in r) + "\n"
    (pasta / f"consulta_cand_{ano}_BRASIL.csv").write_bytes(txt.encode("latin-1"))
    return tmp_path


def test_ler_e_resumir(tmp_path):
    df = I.ler_candidaturas(2022, _fixture(tmp_path))
    assert len(df) == 6  # SQ 5 deduplicado (vale o 2º turno)
    r = I.resumo_ano(df)
    assert r["total_candidaturas"] == 6
    assert r["indigenas"] == 4
    assert r["eleitos"] == 2  # Fulana e o governador; suplente de senador não conta
    assert r["suplentes_indigenas"] == 1
    assert r["por_cargo"]["GOVERNADOR"]["eleitos_indigenas"] == 1
    assert r["por_uf"]["AC"]["indigenas"] == 1
    assert r["por_espectro"]["esquerda"]["indigenas"] == 2
    assert "XYZ" in r["partidos_sem_classificacao"]
    assert r["por_cor_raca"]["indigena"]["candidaturas"] == 4
    assert r["razao_eleitos_candidaturas_indigenas"] == 50.0


def test_figuras_publicas_so_eleitos(tmp_path):
    base = _fixture(tmp_path)
    fs = I.eleitos_figuras(2022, base)
    assert {f["cargo"] for f in fs} == {"Deputado Federal", "Governador"}
    assert all(f["nome"] in ("Fulana", "Gov") for f in fs)


def test_categoria_e_espectro():
    assert I.categoria_cor("INDÍGENA") == "indigena"
    assert I.categoria_cor("NÃO INFORMADO") == "sem_informacao"
    assert I.espectro_partido("PT") == "esquerda"
    assert I.espectro_partido("ZZZ") == "sem_classificacao"


def _m(uf, pct, ap, comp, v13, v22):
    return {
        "uf": uf, "pct_ind": pct, "aptos": ap, "comparecimento": comp,
        "validos": v13 + v22, "brancos": 0, "nulos": comp - v13 - v22,
        "votos": {"13": v13, "22": v22},
    }  # fmt: skip


def test_comparar_grupos_dentro_da_uf():
    munis = [
        _m("AA", 30, 100, 70, 60, 10),
        _m("AA", 0.1, 100, 80, 30, 50),
        _m("BB", 30, 100, 60, 40, 10),
        _m("BB", 0.2, 100, 80, 30, 40),
        _m("CC", 0.3, 100, 80, 40, 40),  # UF sem grupo alto: ignorada
    ]
    r = I.comparar_grupos(munis, ["13", "22"], 10.0, n_boot=30)
    assert r["ufs"] == ["AA", "BB"]
    assert r["municipios_alto"] == 2
    d = r["diferenca_pp_dentro_da_uf"]
    assert math.isclose(d["comparecimento_pct"], -15.0)
    assert d["voto_13_pct"] > 0 > d["voto_22_pct"]


def test_locais_em_ti():
    import pandas as pd

    df = pd.DataFrame({"lat": [-1.0, -50.0, 0.5], "lon": [-60.0, -60.0, -60.0]})
    tis = [{"nome": "TI Teste", "geom": box(-61, -2, -59, 1)}]
    out = I.locais_em_ti(df, tis)
    assert out["ti"].notna().tolist() == [True, False, True]
    assert out["ti"].iloc[0] == "TI Teste"
    assert list(out["coord_ok"]) == [True, False, True]

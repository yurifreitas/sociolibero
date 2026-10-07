"""Testes offline de humano.py com um SQLite minúsculo (sem rede, sem o banco real)."""

import json
import sqlite3

import pytest

from sociolibero import humano as h

A, B = "1100015", "1100023"  # RO


def _geo(tmp_path):
    gj = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": None,
                "properties": {"ibge": i, "nome": n, "uf": "RO"},
            }
            for i, n in ((A, "A"), (B, "B"))
        ],
    }
    p = tmp_path / "geo.json"
    p.write_text(json.dumps(gj), encoding="utf-8")
    return p


def _db(tmp_path):
    p = tmp_path / "trans.db"
    c = sqlite3.connect(p)
    c.executescript(
        """
        create table violencia(codigo_ibge, uf, ano, homicidios, homicidios_jovens,
          homicidios_mulheres, homicidios_homens, suicidios, populacao);
        create table mortes_violentas(codigo_ibge, uf, ano, tipo, meio, raca, sexo, local,
          jovem, total, faixa, alcool_cat, mencao_alcool);
        create table violencia_infantil(codigo_ibge, uf, ano, faixa, sexo, total,
          interpessoal, autoprovocada, fisica, psicologica, sexual, negligencia, tortura,
          trabalho_infantil);
        create table sinan_violencia(codigo_ibge, uf, ano, sexo, total, parceiro, sexual);
        create table nascidos_mae_menor(codigo_ibge, uf, ano, total, mae_ate_9, mae_10_14,
          mae_15_17);
        create table populacao_grupo(codigo_ibge, ano, total, jovens_15_29, mulheres,
          brancos, pretos, pardos, amarelos, indigenas, fonte);
        """
    )
    # Brasil ('0') e UF (11) ao lado dos municípios
    v = [
        ("0", None, 2022, 15, 8, 3, 12, 2, 300000),
        ("11", "RO", 2022, 15, 8, 3, 12, 2, 300000),
        (A, "RO", 2022, 10, 5, 2, 8, 1, 100000),
        (B, "RO", 2022, 4, 3, 1, 3, 1, 200000),  # soma municípios (14) < UF (15)
        # ano incoerente (jovens > total em 100% das linhas): excluído no município
        (A, "RO", 2020, 2, 9, 0, 2, 0, 100000),
        (B, "RO", 2020, 1, 7, 0, 1, 0, 200000),
    ]
    c.executemany("insert into violencia values (?,?,?,?,?,?,?,?,?)", v)
    m = [
        (A, "RO", 2022, "homicidio", "arma_fogo", "parda", "M", "via", 1, 6, "15-29", None, 0),
        (A, "RO", 2022, "homicidio", "outro", "branca", "F", "dom", 0, 2, "30-44", None, 0),
        (A, "RO", 2022, "homicidio", "outro", "ignorada", "M", "out", 0, 2, "30-44", None, 0),
        (A, "RO", 2022, "intervencao_legal", "arma_fogo", "preta", "M", "via", 1, 1, "15-29", None, 0),
        (B, "RO", 2022, "homicidio", "outro", "preta", "M", "via", 0, 4, "30-44", None, 0),
    ]  # fmt: skip
    c.executemany("insert into mortes_violentas values (?,?,?,?,?,?,?,?,?,?,?,?,?)", m)
    c.execute(
        "insert into violencia_infantil values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (A, "RO", 2022, "0-4", "F", 5, 4, 1, 2, 1, 2, 0, 0, 0),
    )
    c.execute(
        "insert into sinan_violencia values (?,?,?,?,?,?,?)",
        (A, "RO", 2022, "F", 9, 4, 1),
    )
    c.execute(
        "insert into nascidos_mae_menor values (?,?,?,?,?,?,?)",
        (A, "RO", 2022, 100, 0, 2, 8),
    )
    pg = [
        (A, 2022, 100000, 25000, 51000, 40000, 10000, 40000, 1000, 9000, "censo"),
        (B, 2022, 200000, 50000, 99000, 80000, 20000, 80000, 2000, 18000, "censo"),
        (
            "11",
            2022,
            300000,
            75000,
            150000,
            120000,
            30000,
            120000,
            3000,
            27000,
            "censo",
        ),
        ("0", 2021, 300000, 75000, 150000, None, None, None, None, None, "projecao"),
    ]
    c.executemany("insert into populacao_grupo values (?,?,?,?,?,?,?,?,?,?,?)", pg)
    c.commit()
    c.close()
    return p


def test_abrir_ro_nao_grava(tmp_path):
    con = h.abrir_ro(_db(tmp_path))
    with pytest.raises(sqlite3.OperationalError):
        con.execute("create table x(a)")
    with pytest.raises(sqlite3.OperationalError):
        con.execute("delete from violencia")
    con.close()
    with pytest.raises(FileNotFoundError):
        h.abrir_ro(tmp_path / "nao_existe.db")
    assert not (tmp_path / "nao_existe.db").exists()


def test_resolver_6_digitos_e_sem_match(tmp_path):
    res = h.Resolver(h.carregar_geo(_geo(tmp_path)))
    assert res(A) == A
    assert res("110001") == A  # 6 dígitos -> 7 pelo prefixo da malha
    assert res("9999999") is None and res("") is None
    r = res.relatorio()
    assert r["codigos_6_digitos_convertidos"] == 1 and r["linhas_sem_match"] == 2


def test_colisao_de_prefixo_6d_e_descartada(tmp_path):
    gj = {
        "features": [
            {"properties": {"ibge": "1234561", "nome": "x", "uf": "RO"}},
            {"properties": {"ibge": "1234562", "nome": "y", "uf": "RO"}},
        ]
    }
    p = tmp_path / "g.json"
    p.write_text(json.dumps(gj))
    res = h.Resolver(h.carregar_geo(p))
    assert res("123456") is None
    assert res.relatorio()["colisoes_de_prefixo_6d_na_malha"] == 1
    assert res.relatorio()["codigos_6_digitos_ambiguos_descartados"] == 1


def test_build_fixture(tmp_path):
    out = tmp_path / "out"
    r = h.build(
        _db(tmp_path),
        geo=_geo(tmp_path),
        out_dir=out,
        territorios_path=None,
        fator_path=None,
    )
    mun, nac = r["municipal"], r["nacional"]
    assert (out / "humano_municipal.json").exists()
    assert (out / "humano_nacional.json").exists()

    a = mun["linhas"][A]
    assert a["homicidios"] == {"2022": 10}  # 2020 incoerente fica de fora (null, não 0)
    assert "2020" not in a["homicidios_jovens"]
    assert a["pop"]["2020"] == 100000  # população do ano excluído permanece
    assert a["taxa_homicidios"]["2022"] == 10.0
    assert a["taxa_homicidios_jovens"]["2022"] == 20.0  # 5 / 25.000 jovens
    assert a["sim_homicidios"]["2022"] == 10 and a["sim_intervencao_legal"]["2022"] == 1
    assert a["vitimas_raca_informada"]["2022"] == 8  # 'ignorada' sai do denominador
    assert a["pct_vitimas_negras"]["2022"] == 75.0  # 6 de 8
    assert a["mae_ate_17"]["2022"] == 10 and a["mae_ate_14"]["2022"] == 2
    assert a["viol_infantil_notif"]["2022"] == 5
    assert a["sinan_parceiro_mulheres"]["2022"] == 4
    assert a["pop_pretos"]["2022"] == 10000
    assert (
        "viol_infantil_notif" not in mun["linhas"][B]
    )  # sem notificação = null, não 0
    assert mun["linhas"][B]["sim_homicidios"]["2022"] == 4

    s = nac["series"]
    assert s["atlas_homicidios"]["brasil"]["2022"] == 15
    assert s["atlas_homicidios"]["uf"]["RO"]["2022"] == 15
    assert s["sim_homicidios"]["brasil"]["2022"] == 14
    assert s["sim_homicidios"]["uf"]["RO"]["2022"] == 14
    assert s["sim_homicidios_negros"]["brasil"]["2022"] == 10
    assert s["pop_total"]["brasil"]["2022"] == 300000  # ano de Censo: soma das UFs
    assert all(x["tabela"] and x["fonte_primaria"] for x in nac["meta"]["series"])

    v = mun["meta"]["validacao"]
    assert "2020" in v["anos_atlas_municipal_excluidos"]
    t = {x["ano"]: x for x in v["homicidios_nacional_por_ano"]}
    assert t[2022]["atlas_brasil"] == 15 and t[2022]["atlas_soma_municipios"] == 14
    assert t[2022]["dif_atlas_brasil_menos_soma_municipios"] == 1
    assert v["valores_negativos_por_tabela"]["violencia"] == 0
    assert v["join_municipal"]["linhas_sem_match"] == 0
    assert {f["tabela"] for f in mun["meta"]["fontes"]} >= {
        "violencia",
        "mortes_violentas",
    }
    json.dumps(mun)  # serializável


def test_validacao_vs_territorios(tmp_path):
    terr = tmp_path / "t.json"
    linhas = {
        A: {"pop_total": 100000, "pop_indigena": 9100, "pop_indigena_cor_raca": 9000, "pct_pretos_pardos": 50.0},
        B: {"pop_total": 200001, "pop_indigena": None, "pop_indigena_cor_raca": 18000, "pct_pretos_pardos": 50.0},
    }  # fmt: skip
    terr.write_text(json.dumps({"linhas": linhas}))
    r = h.build(
        _db(tmp_path),
        geo=_geo(tmp_path),
        out_dir=tmp_path / "o",
        territorios_path=terr,
        fator_path=None,
    )
    rel = {
        x["campo"]: x
        for x in r["municipal"]["meta"]["validacao"]["populacao_grupo_vs_territorios"]
    }
    assert rel["pop_total (Censo 2022)"]["municipios_iguais"] == 1
    assert rel["pop_total (Censo 2022)"]["maior_diferenca_absoluta"] == -1
    assert rel["pct_pretos_pardos"]["municipios_iguais_tol_0.01pp"] == 2
    assert "quilombolas" in rel


def test_db_ausente_exige_argumento(monkeypatch):
    monkeypatch.delenv(h.ENV_DB, raising=False)
    with pytest.raises(SystemExit):
        h.build(None)

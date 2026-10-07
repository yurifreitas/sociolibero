"""Testes offline de series/ (fixtures minúsculas, sem rede)."""

import hashlib
import json

import pytest
import requests

from sociolibero.series import build as b
from sociolibero.series import ingest as ing


def _put(raw, nome, arquivos: dict, extra=None):
    """Cria data/raw/<nome>/ com PROVENIENCIA.json, como `ingest.gravar`."""
    pasta = raw / nome
    pasta.mkdir(parents=True)
    regs = []
    for fn, conteudo in arquivos.items():
        bts = conteudo if isinstance(conteudo, bytes) else conteudo.encode("utf-8")
        (pasta / fn).write_bytes(bts)
        regs.append(
            {
                "nome": fn,
                "url": f"http://x/{fn}",
                "sha256": hashlib.sha256(bts).hexdigest(),
                "bytes": len(bts),
            }
        )
    meta = {
        "nome": nome,
        "baixado_em": "2026-01-01T00:00:00+00:00",
        "sha256": regs[0]["sha256"],
        "arquivos": regs,
        **(extra or {}),
    }
    (pasta / "PROVENIENCIA.json").write_text(json.dumps(meta), encoding="utf-8")


def _ipea_json(rows):
    return json.dumps(
        {
            "value": [
                {
                    "SERCODIGO": "X",
                    "VALDATA": f"{a}-01-01T00:00:00-02:00",
                    "VALVALOR": v,
                    "NIVNOME": n,
                    "TERCODIGO": "",
                }
                for a, v, n in rows
            ]
        }
    )


def _ipea_meta(codigo="X", com="coment"):
    return json.dumps(
        {
            "value": [
                {
                    "SERCODIGO": codigo,
                    "SERNOME": "nome",
                    "FNTSIGLA": "IBGE",
                    "FNTNOME": "IBGE",
                    "SERCOMENTARIO": com,
                }
            ]
        }
    )


@pytest.fixture
def raw(tmp_path, monkeypatch):
    monkeypatch.setattr(b, "RAW", tmp_path)
    return tmp_path


def test_faixas():
    assert (
        b._faixas([1981, 1982, 1983, 1990, 2000, 2001]) == "1981-1983, 1990, 2000-2001"
    )
    assert b._faixas([]) == ""


def test_sem_repeticao_remove_carry_forward():
    pts = [
        (1980, 0.27),
        (1981, 0.27),
        (1982, 0.27),
        (2002, 0.26),
        (2003, 0.27),
        (2004, 0.27),
    ]
    out, rem = b._sem_repeticao(pts)
    assert out == [(1980, 0.27), (2002, 0.26), (2003, 0.27)]
    assert rem == [1981, 1982, 2004]


def test_sem_repeticao_nao_mexe_em_anos_nao_consecutivos():
    # valores iguais separados por salto de anos (dados decenais) não são carry-forward
    assert b._sem_repeticao([(1820, 867.0), (1850, 867.0)])[0] == [
        (1820, 867.0),
        (1850, 867.0),
    ]


def test_validar_pontos_duplicados_e_limites():
    v = b.validar_pontos("x", [[2000, 1.0], [2000, 2.0], [2001, 500.0]], (0, 100))
    assert v["anos_duplicados"] == [2000]
    assert v["fora_dos_limites"] == [[2001, 500.0]]
    assert v["ordenada"] is True
    assert b.validar_pontos("x", [[2001, 1.0], [2000, 1.0]], None)["ordenada"] is False


def test_ipea_filtra_brasil_e_ignora_nulos(raw):
    rows = [
        (2020, 1.0, "Estados"),
        (2020, 5.0, "Brasil"),
        (2021, None, "Brasil"),
        (2022, 7.0, "Brasil"),
    ]
    _put(
        raw,
        "ipeadata_X",
        {"valores.json": _ipea_json(rows), "metadados.json": _ipea_meta()},
    )
    assert b._ipea("X") == [(2020, 5.0), (2022, 7.0)]


def test_ipea_sem_nivel_brasil_mantem_tudo(raw):
    _put(
        raw,
        "ipeadata_X",
        {
            "valores.json": _ipea_json([(1999, 2.0, ""), (2000, 3.0, "")]),
            "metadados.json": _ipea_meta(),
        },
    )
    assert b._ipea("X") == [(1999, 2.0), (2000, 3.0)]


def test_salario_minimo_so_anos_completos(raw):
    meses = [(2020, 100.0 + m, "") for m in range(12)] + [
        (2021, 50.0, "")
    ] * 3  # 2021 incompleto
    rows = [(a, v, n) for a, v, n in meses]
    # datas mensais distintas
    js = {"value": []}
    for i, (a, v, n) in enumerate(rows):
        mes = i % 12 + 1 if a == 2020 else (i - 12) + 1
        js["value"].append(
            {
                "SERCODIGO": "G",
                "VALDATA": f"{a}-{mes:02d}-01T00:00:00-03:00",
                "VALVALOR": v,
                "NIVNOME": n,
                "TERCODIGO": "",
            }
        )
    _put(
        raw,
        "ipeadata_GAC12_SALMINRE12",
        {
            "valores.json": json.dumps(js),
            "metadados.json": _ipea_meta("GAC12_SALMINRE12"),
        },
    )
    s = b.s_salario_minimo()
    assert s["pontos"] == [(2020, pytest.approx(105.5))]
    assert "2021" in s["notas"]  # ano incompleto declarado
    assert s["unidade"].endswith("03/2021")


def test_prodes_soma_estados_e_ano_de_termino(raw):
    d = {
        "periods": [
            {
                "startDate": {"year": 1987},
                "endDate": {"year": 1988},
                "features": [
                    {"areas": [{"type": 1, "area": 620}]},
                    {"areas": [{"type": 1, "area": 1510}]},
                ],
            },
            {
                "startDate": {"year": 1988},
                "endDate": {"year": 1989},
                "features": [{"areas": [{"type": 1, "area": 100}]}],
            },
            {
                "startDate": {"year": 1989},
                "endDate": {"year": 1990},
                "features": [{"areas": [{"type": 1, "area": 100}]}],
            },
        ]
    }
    _put(raw, "inpe_prodes_taxas", {"rates2025.json": json.dumps(d)})
    s = b.s_prodes()
    assert s["pontos"] == [(1988, 2130.0), (1989, 100.0), (1990, 100.0)]
    assert "1990" in s["notas"]  # repetição na fonte é declarada


def test_divida_pega_dezembro(raw):
    d = [
        {"data": "01/11/2020", "valor": "88.0"},
        {"data": "01/12/2020", "valor": "89.5"},
        {"data": "01/12/2021", "valor": ""},
        {"data": "01/12/2022", "valor": "71.7"},
    ]
    _put(raw, "bcb_sgs_13762", {"sgs_13762.json": json.dumps(d)})
    assert b.s_divida()["pontos"] == [(2020, 89.5), (2022, 71.7)]


def test_slavevoyages_brasil(raw):
    csv_txt = "VOYAGEID,YEARAM,MJSELIMP,SLAMIMP,OUTRA\n1,1800,50200,300,x\n2,1800,50400,200,x\n3,1800,31300,999,x\n4,1801,50200,,x\n5,1812,50100,10,x\n"
    _put(
        raw,
        "slavevoyages_tastdb_2019",
        {"tastdb-exp-2019.csv": csv_txt.encode("latin-1")},
    )
    s = b.s_escravizados()
    assert s["pontos"] == [
        (1800, 500.0),
        (1812, 10.0),
    ]  # Cuba fora; sem SLAMIMP omitido, não zerado
    assert "(1)" in s["notas"]
    dec = b.s_escravizados_decada()["pontos"]
    assert dec == [(1800, 500.0), (1810, 10.0)]


def test_top1_wid_remove_repetidos(raw):
    cab = "country;variable;percentile;year;value;age;pop;data_quality\n"
    linhas = "".join(
        f"BR;sptincj992;p99p100;{a};{v};992;j;\n"
        for a, v in [(1980, 0.27), (1981, 0.27), (2002, 0.26)]
    )
    linhas += (
        "BR;sptincj992;p90p100;1980;0.5;992;j;\nBR;sptincj999;p99p100;1980;0.9;999;j;\n"
    )
    _put(raw, "wid_BR", {"WID_data_BR.csv": cab + linhas, "WID_metadata_BR.csv": "x"})
    s = b.s_top1()
    assert s["pontos"] == [(1980, 0.27), (2002, 0.26)]
    assert "1981" in s["notas"]


def test_build_lacunas_ciclos_e_esquema(raw, tmp_path):
    d = [{"data": "01/12/2020", "valor": "89.5"}]
    _put(raw, "bcb_sgs_13762", {"sgs_13762.json": json.dumps(d)})
    ing_falha = raw / "_falhas_series.json"
    ing_falha.write_text(
        json.dumps({"x": {"url": "http://u", "erro": "403", "em": "t"}}),
        encoding="utf-8",
    )
    out = tmp_path / "saida" / "s.json"
    r = b.build(raw=raw, out=out)
    assert out.exists() and json.loads(out.read_text(encoding="utf-8")) == r
    assert [s["id"] for s in r["series"]] == ["divida_bruta_pib"]
    s = r["series"][0]
    assert set(s) == {
        "id",
        "rotulo",
        "unidade",
        "cobertura",
        "fonte",
        "qualidade",
        "quebras",
        "notas",
        "pontos",
    }
    assert set(s["fonte"]) == {"nome", "url", "baixado_em", "sha256", "codigo_serie"}
    assert s["cobertura"] == [2020, 2020] and s["qualidade"] in (
        "alta",
        "media",
        "baixa",
    )
    ids = [c["id"] for c in r["ciclos"]]
    assert ids[0] == "pau-brasil" and ids[-1] == "retomada-incerteza" and len(ids) == 14
    assert r["ciclos"][1] == {"id": "acucar", "inicio": 1530, "fim": 1700}
    lac = {x["serie"] for x in r["meta"]["lacunas"]}
    assert "trabalhadores_resgatados_trabalho_escravo" in lac  # lacuna registrada
    assert "ipca" in lac  # não baixado → lacuna, não erro
    assert "download:x" in lac  # falha de acesso propagada
    assert {"gerado_em", "aviso", "lacunas"} <= set(r["meta"])


def test_ids_de_series_unicos_e_com_limite():
    ids = [i for i, _ in b.SERIES]
    assert len(ids) == len(set(ids))
    assert set(b.LIMITES) == set(ids)


def test_gravar_proveniencia(tmp_path, monkeypatch):
    monkeypatch.setattr(ing, "RAW", tmp_path)
    m = ing.gravar(
        "fonte", [("a.json", "http://x/a", b"abc"), ("b.json", "http://x/b", b"def")]
    )
    assert m["arquivos"][0]["sha256"] == hashlib.sha256(b"abc").hexdigest()
    assert (tmp_path / "fonte" / "PROVENIENCIA.json").exists()
    assert (
        ing.proveniencia("fonte")["sha256"] == m["sha256"]
        and ing.proveniencia("nada") is None
    )


def test_get_nao_contorna_403(monkeypatch):
    chamadas = []

    class R:
        status_code = 403

        def raise_for_status(self):
            raise requests.HTTPError(response=self)

    monkeypatch.setattr(ing.requests, "get", lambda *a, **k: chamadas.append(1) or R())
    with pytest.raises(requests.HTTPError):
        ing._get("http://x")
    assert len(chamadas) == 1  # sem retry, sem fallback


def test_falha_de_download_e_registrada(tmp_path, monkeypatch):
    monkeypatch.setattr(ing, "RAW", tmp_path)
    monkeypatch.setattr(ing, "FALHAS", tmp_path / "_falhas_series.json")

    def boom():
        raise RuntimeError("certificado")

    monkeypatch.setattr(ing, "tarefas", lambda: [("fonte_x", "http://x", boom)])
    out = ing.baixar_tudo()
    assert out == {}
    f = json.loads((tmp_path / "_falhas_series.json").read_text(encoding="utf-8"))
    assert "certificado" in f["fonte_x"]["erro"]


def test_maddison_ancoras_e_pais(raw):
    import pandas as pd

    pasta = raw / "maddison_mpd2023"
    pasta.mkdir()
    df = pd.DataFrame(
        {
            "countrycode": ["BRA"] * 5 + ["ARG"],
            "country": ["Brazil"] * 5 + ["Argentina"],
            "region": ["x"] * 6,
            "year": [1800, 1820, 1850, 1851, 1852, 1851],
            "gdppc": [867.0, 867.0, 867.0, 926.0, float("nan"), 1.0],
            "pop": [1.0] * 6,
        }
    )
    df.to_stata(pasta / "maddison2023_web.dta", write_index=False)
    (pasta / "PROVENIENCIA.json").write_text(
        json.dumps({"baixado_em": "t", "sha256": "s", "arquivos": [{"url": "u"}]}),
        encoding="utf-8",
    )
    s = b.s_maddison()
    # 1800 fora (pedido: 1820+), NaN omitido (não interpolado), outro país fora
    assert s["pontos"] == [(1820, 867.0), (1850, 867.0), (1851, 926.0)]
    assert "1820, 1850" in s["notas"]


def test_analfabetismo_hist_junta_duas_series_ipeadata(raw):
    _put(
        raw,
        "ipeadata_TXA15M",
        {
            "valores.json": _ipea_json(
                [
                    (1900, 65.0, "Brasil"),
                    (1920, 64.0, "Brasil"),
                    (1900, 99.0, "Estados"),
                ]
            ),
            "metadados.json": _ipea_meta("TXA15M"),
        },
    )
    _put(
        raw,
        "ipeadata_TXA15M7091",
        {
            "valores.json": _ipea_json(
                [
                    (1970, 33.0, "Brasil"),
                    (1991, 19.4, "Brasil"),
                    (1991, 5.0, "Microrregiões"),
                ]
            ),
            "metadados.json": _ipea_meta("TXA15M7091"),
        },
    )
    s = b.s_analfabetismo_censos()
    assert s["pontos"] == [(1900, 65.0), (1920, 64.0), (1970, 33.0), (1991, 19.4)]
    assert s["quebras"][0]["ano"] == 1970


def test_build_nao_emite_ano_duplicado(raw, monkeypatch):
    def dup():
        return {
            "id": "x",
            "rotulo": "x",
            "unidade": "x",
            "fonte": {},
            "qualidade": "alta",
            "quebras": [],
            "notas": "",
            "pontos": [(2000, 1.0), (2000, 2.0)],
        }

    monkeypatch.setattr(b, "SERIES", [("x", dup)])
    r = b.build(raw=raw, out=None)
    assert r["series"] == []
    assert any(
        x["serie"] == "x" and "duplicados" in x["motivo"] for x in r["meta"]["lacunas"]
    )

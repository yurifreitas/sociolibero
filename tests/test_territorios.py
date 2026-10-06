"""Testes offline de territorios.py (fixtures minúsculas, sem rede)."""

import struct

import numpy as np
from shapely.geometry import box

from sociolibero import territorios as t


def _cab(extra=()):
    h = {
        "NC": "6",
        "D1C": "Município (Código)",
        "D2C": "Variável (Código)",
        "D3C": "Ano (Código)",
    }
    h.update({"D1N": "Município", "V": "Valor"})
    h.update(dict(extra))
    return h


def _r(terr, var, v, **cls):
    d = {"NC": "6", "D1C": terr, "D1N": "x", "D2C": var, "D3C": "2022", "V": v}
    d.update(cls)
    return d


def test_valor():
    assert t.valor("-") == 0  # zero verdadeiro
    assert t.valor("X") is None and t.valor("..") is None and t.valor("...") is None
    assert t.valor("1234") == 1234 and t.valor(None) is None


def test_parse_e_montagem_censo():
    cab = _cab({"D4C": "Cor ou raça (Código)"})
    rows = [cab]
    for terr, vals in {
        "1100015": (100, 10, 50, 5),
        "1100023": (200, 20, 60, "X"),
    }.items():
        for cod, v in zip(("95251", "2777", "2779", "2780"), vals):
            rows.append(_r(terr, "93", str(v), D4C=cod))
    cor = t._por_terr(t.parse_sidra(rows), t.campos_9605)
    assert cor["1100015"] == {"total": 100, "preta": 10, "parda": 50, "indigena": 5}
    assert cor["1100023"]["indigena"] is None  # suprimido ⇒ null, não zero

    cab2 = _cab(
        {
            "D4C": "Quesito de declaração indígena (Código)",
            "D5C": "Localização do domicílio (Código)",
        }
    )
    ind_rows = [cab2, _r("1100015", "350", "7", D4C="60024", D5C="32776"),
                _r("1100015", "350", "-", D4C="60024", D5C="12869"),
                _r("1100023", "350", "X", D4C="60024", D5C="32776")]  # fmt: skip
    ind = t._por_terr(t.parse_sidra(ind_rows), t.campos_9718)
    assert ind["1100015"] == {"indigena": 7, "indigena_em_ti": 0}

    linhas = t.montar_censo({"9605": cor, "9718": ind, "9578": {}})
    a, b = linhas["1100015"], linhas["1100023"]
    assert a["pop_total"] == 100 and a["pop_indigena"] == 7 and a["pct_indigena"] == 7.0
    assert (
        a["pct_pretos_pardos"] == 60.0
        and a["pop_quilombola"] is None
        and a["pct_quilombola"] is None
    )
    assert b["pop_indigena"] is None and b["pct_indigena"] is None


def test_validar_soma():
    linhas = {"1100015": {"p": 5}, "1100023": {"p": None}, "1200013": {"p": 3}}
    r = t.validar_soma(linhas, {"11": {"x": 10}, "12": {"x": 3}}, {"x": 13}, "p", "x")
    assert r["soma_municipios"] == 8 and r["dif_brasil"] == -5
    assert (
        r["ufs_com_diferenca"]["11"]["municipios_nulos"] == 1
        and "12" not in r["ufs_com_diferenca"]
    )


def test_codigos():
    r = t.validar_codigos(["3550308", "123", "9950308"])
    assert r["formato_invalido"] == ["123", "9950308"] and r["dv_nao_conforme"] == []


def test_albers_area_equal_area():
    # 1° x 1° no equador ≈ 12.364 km² (elipsoide GRS80); 1° x 1° a 30°S é menor
    eq = t.area_ha(t.proj(box(-50, -0.5, -49, 0.5)))
    assert abs(eq - 1_236_400) / 1_236_400 < 0.005
    sul = t.area_ha(t.proj(box(-50, -30.5, -49, -29.5)))
    assert 0.85 < sul / eq < 0.88
    assert np.isfinite(t.albers(np.array([[-54.0, -12.0]]))).all()


def _shp(polys):
    """Shapefile Polygon mínimo; cada item = lista de anéis (cada anel = lista de (x, y))."""
    recs = b""
    for i, rings in enumerate(polys, 1):
        pts = [p for r in rings for p in r]
        parts, k = [], 0
        for r in rings:
            parts.append(k)
            k += len(r)
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        c = struct.pack(
            "<i4d2i", 5, min(xs), min(ys), max(xs), max(ys), len(parts), len(pts)
        )
        c += struct.pack(f"<{len(parts)}i", *parts) + b"".join(
            struct.pack("<2d", *p) for p in pts
        )
        recs += struct.pack(">2i", i, len(c) // 2) + c
    head = struct.pack(">i20xi", 9994, (100 + len(recs)) // 2) + struct.pack(
        "<2i8d", 1000, 5, *([0.0] * 8)
    )
    return head + recs


def _dbf(rows, campos):
    hl, rl = 32 + 32 * len(campos) + 1, 1 + sum(w for _, w in campos)
    b = struct.pack("<4xIHH20x", len(rows), hl, rl)
    b = bytes([3]) + b[1:]
    for nome, w in campos:
        b += nome.encode().ljust(11, b"\0") + b"C" + b"\0" * 4 + bytes([w]) + b"\0" * 15
    b += b"\r"
    for r in rows:
        b += b" " + b"".join(str(r[n]).encode("cp1252").ljust(w) for n, w in campos)
    return b


def test_shapefile_e_dbf_com_furo():
    cw = [(0, 0), (0, 10), (10, 10), (10, 0), (0, 0)]  # horário = casca
    ccw = [(2, 2), (8, 2), (8, 8), (2, 8), (2, 2)]  # anti-horário = furo
    shp = _shp([[cw, ccw], [[(20, 0), (20, 1), (21, 1), (21, 0), (20, 0)]]])
    g = t.ler_shp(shp)
    assert abs(g[0].area - (100 - 36)) < 1e-9 and abs(g[1].area - 1) < 1e-9
    dbf = _dbf(
        [{"nm": "TQ São João", "fase": "titulado"}, {"nm": "B", "fase": "RTID"}],
        [("nm", 20), ("fase", 10)],
    )
    rows = t.ler_dbf(dbf)
    assert (
        rows[0] == {"nm": "TQ São João", "fase": "titulado"}
        and rows[1]["fase"] == "RTID"
    )


def test_sobreposicao_agregar_e_juntar():
    # dois "municípios" lado a lado (~1° cada) e uma TI que cobre 50% do A e 10% do B
    munis = {"1100015": box(-60, -10, -59, -9), "1100023": box(-59, -10, -58, -9)}
    ti = box(-59.5, -10, -58.9, -9)
    fei = [{"chave": "1", "nome": "TI X", "fase": "Regularizada", "ha_fonte": None, "geom": ti},
           {"chave": "2", "nome": "sliver", "fase": "Declarada", "ha_fonte": None,
            "geom": box(-59.0000001, -10, -58.9999999, -9.9999999)}]  # fmt: skip
    sob, diag = t.sobreposicao(fei, munis, min_ha=1.0)
    assert set(sob) == {"1100015", "1100023"} and list(sob["1100015"]) == [
        "1"
    ]  # sliver descartado
    a, b = sob["1100015"]["1"]["ha"], sob["1100023"]["1"]["ha"]
    assert abs(a / b - 5) < 0.15
    ag = t.agregar(sob)
    assert ag["1100015"]["n"] == 1 and ag["1100015"]["fases"]["Regularizada"]["n"] == 1
    assert (
        abs(diag["area_poligonos_ha"] - (a + b)) / (a + b) < 1e-3
    )  # cordas da projeção: ok com vértices densos

    censo = {
        "1100015": {"pop_total": 1},
        "1100023": {"pop_total": 1},
        "1200013": {"pop_total": 1},
    }
    out = t.juntar(censo, ag, None)
    assert (
        out["1200013"]["ti_n"] == 0 and out["1200013"]["ti_area_ha"] == 0.0
    )  # camada cobre o país: 0 real
    assert (
        out["1200013"]["quilombo_n"] is None
        and out["1200013"]["quilombo_titulado_n"] is None
    )  # sem camada ⇒ null


def test_feicoes_incra_alinha_shp_dbf():
    sq = [(0, 0), (0, 1), (1, 1), (1, 0), (0, 0)]
    shp = _shp([[sq], [sq]])
    rows = [
        {"nr_process": "1", "nm_comunid": "A", "fase": "TITULADO"},
        {"nr_process": "", "nm_comunid": "B", "fase": " rtid "},
    ]
    f = t.feicoes_incra(
        shp, _dbf(rows, [("nr_process", 5), ("nm_comunid", 5), ("fase", 10)])
    )
    assert [x["chave"] for x in f] == ["1", "B"] and f[1]["fase"] == "RTID"
    ag = t.agregar(
        {"1": {"1": {"fase": "TITULADO", "ha": 5.0}, "B": {"fase": "RTID", "ha": 1.0}}}
    )
    assert ag["1"]["titulado_n"] == 1


def test_weighted_correlation_and_group_demeaning():
    import numpy as np

    from sociolibero import cruzamento

    x = np.array([1.0, 2.0, 3.0, 10.0, 11.0, 12.0])
    y = np.array([2.0, 4.0, 6.0, 1.0, 2.0, 3.0])
    w = np.ones(6)
    g = np.array(["a", "a", "a", "b", "b", "b"])
    assert cruzamento._wcorr(x, y, w) < 0.5  # grupos com sinais opostos misturados
    xd, yd = cruzamento._demean_by_group(x, g, w), cruzamento._demean_by_group(y, g, w)
    assert (
        cruzamento._wcorr(xd, yd, w) > 0.9
    )  # dentro de cada grupo a relação é positiva

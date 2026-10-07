"""Testes offline de eleitorado.py (CSV sintético mínimo, sem tocar em data/raw)."""

import json
from pathlib import Path

import numpy as np
import pandas as pd

from sociolibero import eleitorado as E

HEADER = (
    '"DT_GERACAO";"HH_GERACAO";"AA_ELEICAO";"SG_UF";"CD_MUNICIPIO";"NM_MUNICIPIO";'
    '"NR_ZONA";"CD_GENERO";"DS_GENERO";"CD_FAIXA_ETARIA";"DS_FAIXA_ETARIA";'
    '"CD_GRAU_ESCOLARIDADE";"DS_GRAU_ESCOLARIDADE";"QT_ELEITORES"'
)


def _linha(uf, cd, nome, genero, faixa, grau, qt):
    return f'"x";"y";2026;"{uf}";"{cd}";"{nome}";1;{genero};"G";{faixa};"F";{grau};"D";{qt}'


LINHAS = {
    "AC": [
        _linha("AC", "01007", "BUJARI", 2, 7074, 1, 10),
        _linha("AC", "01007", "BUJARI", 4, 7074, 1, 6),
        _linha("AC", "01007", "BUJARI", 4, 3034, 6, 30),
        _linha("AC", "01392", "RIO BRANCO", 2, 2529, 8, 54),
    ],
    "AL": [_linha("AL", "27005", "MACEIO", 4, 1600, 2, 4)],
    "ZZ": [_linha("ZZ", "99999", "EXTERIOR", 2, 4549, 6, 7)],
}


def _fixture(tmp_path: Path) -> Path:
    pasta = tmp_path / "perfil_eleitorado_2026"
    pasta.mkdir()
    for uf, linhas in LINHAS.items():
        (pasta / f"perfil_eleitorado_2026_{uf}.csv").write_text(
            "\n".join([HEADER, *linhas]) + "\n", encoding="latin-1"
        )
    todas = [x for ls in LINHAS.values() for x in ls]
    (pasta / "perfil_eleitorado_2026_BRASIL.csv").write_text(
        "\n".join([HEADER, *todas]) + "\n", encoding="latin-1"
    )
    return tmp_path


def test_agregar_e_soma_ufs_igual_nacional(tmp_path):
    base = _fixture(tmp_path)
    df = E.agregar_perfil(2026, base, cache=None)
    assert int(df.qt.sum()) == 111
    d = E.eleitorado_por_instrucao(df)
    assert (
        sum(b["total"] for b in d["por_uf"].values()) == d["nacional"]["total"] == 111
    )
    assert d["nacional_sem_exterior"]["total"] == 104
    assert d["nacional"]["por_grupo"]["analfabeto"] == 16
    assert d["por_uf"]["AC"]["pct_analfabeto"] == round(100 * 16 / 100, 3)
    assert E.total_consolidado(2026, base) == {"total": 111, "analfabetos": 16}


def test_null_diferente_de_zero(tmp_path):
    base = _fixture(tmp_path)
    df = E.agregar_perfil(2026, base, cache=None)
    idx = {("AC", "BUJARI"): "1200336", ("AC", "RIO BRANCO"): "1200401"}
    idx[("AL", "MACEIO")] = "2704302"
    c2i, miss = E.mapa_tse_ibge(df, idx)
    assert miss == [] and len(c2i) == 3
    m = E.municipal(df, c2i)
    assert m["1200401"]["analfabeto"] == 0  # zero verdadeiro (município com dado)
    assert m["1200401"]["pct_analfabeto"] == 0.0
    uf_de = {"1200336": "AC", "1200401": "AC", "2704302": "AL", "9999999": "AL"}
    j = E._municipal_json({2026: m}, uf_de)
    assert j["9999999"]["2026"] is None  # sem dado: null, nunca 0
    assert j["1200401"]["2026"]["analfabeto"] == 0
    assert json.loads(json.dumps(j))["9999999"]["2026"] is None


def test_faixas_cobrem_idades_sem_buraco():
    ini = [FA[0] for FA in (E.FAIXAS[c] for c in sorted(E.FAIXAS))]
    fim = [FA[1] for FA in (E.FAIXAS[c] for c in sorted(E.FAIXAS))]
    assert ini[0] == E.IDADE_MIN and fim[-1] == E.IDADE_MAX
    assert all(a == b + 1 for a, b in zip(ini[1:], fim[:-1]))


def _q():
    # tábua sintética: mortalidade crescente com a idade
    return np.clip(
        0.0005 * np.exp(0.09 * np.arange(E.IDADE_MIN, E.IDADE_MAX + 1) / 1.0), 0, 0.6
    )


def test_vetor_idades_preserva_total():
    df = pd.DataFrame(
        {
            "uf": ["AC", "AC", "ZZ"],
            "faixa": [2529, 7074, 2529],
            "grau": [1, 1, 1],
            "qt": [50, 20, 99],
        }
    )
    v = E.vetor_idades(df, (1,))
    assert round(v.sum()) == 70  # exterior fora
    assert v[E.FAIXAS[2529][0] - E.IDADE_MIN] == 10


def test_projecao_coerente_e_monotonica():
    q = _q()
    v0 = np.zeros(E.N_IDADES)
    v0[30:60] = 1000.0  # idades 46-75
    kg = np.ones((3, len(E.GRUPOS_ETARIOS_K)))
    ent = np.zeros((3, 12))
    res = E.simular(v0, q, kg, ent, 12)
    tot = [res[t][0].sum() for t in range(1, 13)]
    assert all(b < a for a, b in zip([v0.sum(), *tot], tot))  # sem entrantes só encolhe
    assert tot[0] <= v0.sum() * (1 - q[30:60].min())
    # com entrantes positivos e κ=1 o estoque nunca fica abaixo do caso sem entrantes
    ent2 = np.full((3, 12), 500.0)
    com = E.simular(v0, q, kg, ent2, 12)
    assert all(com[t][0].sum() >= res[t][0].sum() for t in res)
    # κ maior => estoque maior
    mais = E.simular(v0, q, kg * 1.02, ent, 12)
    assert mais[12][0].sum() > res[12][0].sum()


def test_kappa_recupera_um_quando_so_ha_mortalidade():
    q = _q()
    v0 = np.zeros(E.N_IDADES)
    v0[:] = 1000.0
    um = np.ones(E.N_IDADES)
    v2 = E.passo(E.passo(v0, q, um), q, um)
    ks = E.kappas_por_janela({2024: v0, 2026: v2}, q)
    assert np.allclose(ks[(2024, 2026)], 1.0)


def test_faixa_calibrada_mais_larga_que_simulada():
    qs = {"p10": 90.0, "p50": 100.0, "p90": 110.0}
    lo, hi = E.faixa_calibrada(qs, 0.05)
    assert lo < 90 and hi > 110 and lo < 100 < hi


def test_efeito_intra_uf_recupera_inclinacao():
    rng = np.random.default_rng(0)
    linhas = []
    for uf, nivel in (("AA", 10.0), ("BB", 60.0)):
        x = rng.uniform(0, 10, 80)
        y = nivel + 2.0 * x + rng.normal(0, 0.5, 80)
        linhas += [
            {"uf": uf, "peso": 1000.0, "x": a, "y": b}
            for a, b in zip(x, y, strict=True)
        ]
    df = pd.DataFrame(linhas)
    r = E.efeito_intra_uf(df, "y", ["x"], n_boot=30)
    assert abs(r["x"]["beta_pp_por_pp"] - 2.0) < 0.1  # o nível por UF não contamina
    lo, hi = r["x"]["ic95_municipios"]
    assert lo <= r["x"]["beta_pp_por_pp"] <= hi


def test_curadoria_valida():
    c = E.carregar_curadoria()
    assert E.validar_curadoria(c) == []
    ids = [h["id"] for h in c["historia"]]
    assert len(ids) == len(set(ids))
    ec25 = next(h for h in c["historia"] if h["id"] == "ec25_1985")
    assert "NÃO concede" in ec25["regra"]  # a emenda remete à lei


def test_json_publicado_consistente_se_existir():
    p = E.SAIDA
    if not p.exists():
        return
    d = json.loads(p.read_text(encoding="utf-8"))
    for ano, b in d["eleitorado_por_instrucao"].items():
        assert (
            sum(x["total"] for x in b["por_uf"].values()) == b["nacional"]["total"]
        ), ano
    anos = d["projecao_2038"]["faixa"]["nacional_por_ano"]
    a = [anos[str(y)]["analfabetos"]["p50"] for y in range(2027, 2039)]
    assert all(y <= x for x, y in zip(a, a[1:]))

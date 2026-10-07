"""Eleitorado por grau de instrução (analfabetos e 'lê e escreve'): dados do TSE, cruzamentos
com o voto, projeção por coortes até 2038 e a história do voto restrito.

Entradas (todas não confiáveis, lidas só por DuckDB/JSON, nunca executadas):
- `data/raw/perfil_eleitorado_AAAA/` (TSE; 2014-2020 um CSV nacional, 2022-2026 um CSV por UF);
- `data/raw/perfil_comparecimento_abstencao_AAAA/` (TSE; só 2022 e 2024 publicados);
- `data/raw/ibge_tabua_mortalidade_2024/ambos_os_sexos.xlsx` (IBGE, tábua completa);
- `web/public/data/territorios.json`, `elections/*.json` e `data/raw/ibge/municipios.json`;
- `eleitorado_curadoria.json` (narrativa histórica e teorias, escrita à mão a partir das fontes
  lidas; este módulo a valida e a junta aos números calculados).

Saídas: `web/public/data/eleitorado_analfabeto.json` e `analfabetos_municipal.json`.
"""

from __future__ import annotations

import hashlib
import json
import re
import zipfile
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pandas as pd

from .eleicoes import geo

RAW = Path("data/raw")
WEB = Path("web/public/data")
SAIDA = WEB / "eleitorado_analfabeto.json"
SAIDA_MUN = WEB / "analfabetos_municipal.json"
CACHE = Path("out/eleitorado")
CURADORIA = Path(__file__).with_name("eleitorado_curadoria.json")
TSE = "https://cdn.tse.jus.br/estatistica/sead/odsele"
IBGE_TABUA = (
    "https://ftp.ibge.gov.br/Tabuas_Completas_de_Mortalidade/"
    "Tabuas_Completas_de_Mortalidade_2024/xlsx/ambos_os_sexos.xlsx"
)

ANOS_PERFIL = (2014, 2016, 2018, 2020, 2022, 2024, 2026)
ANOS_MUN = (2022, 2024, 2026)
ANOS_COMPARECIMENTO = (2022, 2024)
ANO_FIM = 2038

GRAUS = {
    0: "nao_informado",
    1: "analfabeto",
    2: "le_escreve",
    3: "fund_incompleto",
    4: "fund_completo",
    5: "medio_incompleto",
    6: "medio_completo",
    7: "superior_incompleto",
    8: "superior_completo",
}
# Os cinco grupos pedidos (analfabeto, lê e escreve, fundamental, médio, superior).
GRUPOS = {
    "analfabeto": (1,),
    "le_escreve": (2,),
    "fundamental": (3, 4),
    "medio": (5, 6),
    "superior": (7, 8),
    "nao_informado": (0,),
}

UF_REGIAO = {
    **dict.fromkeys(("AC", "AM", "AP", "PA", "RO", "RR", "TO"), "Norte"),
    **dict.fromkeys(("AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"), "Nordeste"),
    **dict.fromkeys(("DF", "GO", "MS", "MT"), "Centro-Oeste"),
    **dict.fromkeys(("ES", "MG", "RJ", "SP"), "Sudeste"),
    **dict.fromkeys(("PR", "RS", "SC"), "Sul"),
    "ZZ": "Exterior",
}
REGIOES = ("Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul")

# Faixa etária do TSE (código) -> (idade inicial, idade final) inclusivas.
FAIXAS: dict[int, tuple[int, int]] = {
    1600: (16, 16),
    1700: (17, 17),
    1800: (18, 18),
    1900: (19, 19),
    2000: (20, 20),
    2124: (21, 24),
    **{c: (a, a + 4) for a in range(25, 100, 5) for c in (a * 100 + a + 4,)},
    9999: (100, 104),
}
IDADE_MIN, IDADE_MAX = 16, 104
N_IDADES = IDADE_MAX - IDADE_MIN + 1


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _prov(nome: str, base: Path = RAW) -> dict | None:
    p = base / nome / "PROVENIENCIA.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


# ----------------------------------------------------------------------------------------
# Leitura e agregação (DuckDB)
# ----------------------------------------------------------------------------------------


def _csv(arqs: list[str]) -> str:
    return (
        f"read_csv({arqs!r}, delim=';', header=true, encoding='latin-1', "
        "all_varchar=true, union_by_name=true, quote='\"')"
    )


def arquivos_perfil(ano: int, base: Path = RAW) -> tuple[list[str], str]:
    """Arquivos de perfil do ano (sem o consolidado BRASIL) e o nome da coluna de quantidade."""
    pasta = base / f"perfil_eleitorado_{ano}"
    if ano <= 2020:
        arqs = [str(pasta / f"perfil_eleitorado_{ano}.csv")]
        qt = "QT_ELEITORES_PERFIL"
    else:
        arqs = sorted(
            str(p)
            for p in pasta.glob(f"perfil_eleitorado_{ano}_*.csv")
            if not p.name.endswith("_BRASIL.csv")
        )
        qt = "QT_ELEITORES"
    return [a for a in arqs if Path(a).exists()], qt


def agregar_perfil(
    ano: int, base: Path = RAW, cache: Path | None = CACHE
) -> pd.DataFrame:
    """Soma de eleitores por (uf, município TSE, grau, faixa etária, gênero).

    Colunas: uf, cd (código TSE), nm, grau (0-8), faixa (código TSE), genero (código TSE), qt.
    O resultado é guardado em parquet (cache) para não reler CSVs de GB.
    """
    import duckdb

    pq = cache / f"perfil_{ano}.parquet" if cache else None
    if pq is not None and pq.exists():
        return (
            duckdb.connect().sql(f"select * from read_parquet('{pq.as_posix()}')").df()
        )
    arqs, qt = arquivos_perfil(ano, base)
    if not arqs:
        raise FileNotFoundError(f"perfil_eleitorado_{ano} ausente em {base}")
    q = (
        "select SG_UF uf, try_cast(CD_MUNICIPIO as int) cd, any_value(NM_MUNICIPIO) nm, "
        "try_cast(CD_GRAU_ESCOLARIDADE as int) grau, try_cast(CD_FAIXA_ETARIA as int) faixa, "
        "try_cast(CD_GENERO as int) genero, sum(try_cast("
        f"{qt} as bigint)) qt from {_csv(arqs)} group by 1,2,4,5,6"
    )
    con = duckdb.connect()
    df = con.sql(q).df()
    if pq is not None:
        pq.parent.mkdir(parents=True, exist_ok=True)
        con.register("res", df)
        con.sql(f"copy res to '{pq.as_posix()}' (format parquet)")
    return df


def total_consolidado(ano: int, base: Path = RAW) -> dict | None:
    """Soma do arquivo consolidado BRASIL (2022+), para conferir a soma das UFs."""
    import duckdb

    p = base / f"perfil_eleitorado_{ano}" / f"perfil_eleitorado_{ano}_BRASIL.csv"
    if not p.exists():
        return None
    r = (
        duckdb.connect()
        .sql(
            "select sum(try_cast(QT_ELEITORES as bigint)), "
            "sum(case when try_cast(CD_GRAU_ESCOLARIDADE as int)=1 then "
            f"try_cast(QT_ELEITORES as bigint) else 0 end) from {_csv([str(p)])}"
        )
        .fetchone()
    )
    return {"total": int(r[0]), "analfabetos": int(r[1])}


# ----------------------------------------------------------------------------------------
# Tabelas de instrução
# ----------------------------------------------------------------------------------------


def _pct(a: float, b: float, nd: int = 3) -> float | None:
    return None if not b else round(100.0 * a / b, nd)


def _bloco_instrucao(d: pd.DataFrame) -> dict:
    """Contagens por grau, por grupo e percentuais para um recorte (DataFrame com grau, qt)."""
    por_grau = d.groupby("grau").qt.sum()
    total = int(por_grau.sum())
    graus = {GRAUS[g]: int(por_grau.get(g, 0)) for g in GRAUS}
    grupos = {k: int(sum(por_grau.get(g, 0) for g in v)) for k, v in GRUPOS.items()}
    return {
        "total": total,
        "por_grau": graus,
        "por_grupo": grupos,
        "pct_grupo": {k: _pct(v, total) for k, v in grupos.items()},
        "pct_analfabeto": _pct(grupos["analfabeto"], total),
        "pct_le_escreve": _pct(grupos["le_escreve"], total),
        "pct_analfabeto_ou_le_escreve": _pct(
            grupos["analfabeto"] + grupos["le_escreve"], total
        ),
    }


def eleitorado_por_instrucao(df: pd.DataFrame) -> dict:
    """Nacional (com e sem exterior) e por UF para um ano."""
    por_uf = {uf: _bloco_instrucao(g) for uf, g in df.groupby("uf")}
    sem_ext = df[df.uf != "ZZ"]
    return {
        "nacional": _bloco_instrucao(df),
        "nacional_sem_exterior": _bloco_instrucao(sem_ext),
        "por_uf": por_uf,
        "por_regiao": {
            r: _bloco_instrucao(df[df.uf.map(UF_REGIAO) == r]) for r in REGIOES
        },
    }


def _grupo_etario(faixa: int) -> str | None:
    if faixa in (1600, 1700):
        return "16-17"
    if faixa not in FAIXAS:
        return None
    a0 = FAIXAS[faixa][0]
    return "70+" if a0 >= 70 else "18-69"


def por_faixa_e_sexo(df: pd.DataFrame) -> dict:
    """% de analfabetos e de 'lê e escreve' por faixa etária e por sexo (sem exterior)."""
    d = df[df.uf != "ZZ"]
    out: dict = {
        "por_faixa": {},
        "por_sexo": {},
        "por_faixa_sexo": {},
        "por_grupo_etario": {},
    }
    nome_f = {c: f"{a}-{b}" if a != b else str(a) for c, (a, b) in FAIXAS.items()}
    nome_f[9999] = "100+"
    for c in sorted(FAIXAS):
        g = d[d.faixa == c]
        if g.qt.sum() == 0:
            continue
        b = _bloco_instrucao(g)
        out["por_faixa"][nome_f[c]] = {
            k: b[k] for k in ("total", "pct_analfabeto", "pct_le_escreve")
        } | {"analfabetos": b["por_grupo"]["analfabeto"]}
    sexo = {2: "masculino", 4: "feminino"}
    for cod, nm in sexo.items():
        g = d[d.genero == cod]
        b = _bloco_instrucao(g)
        out["por_sexo"][nm] = {
            k: b[k] for k in ("total", "pct_analfabeto", "pct_le_escreve")
        } | {"analfabetos": b["por_grupo"]["analfabeto"]}
        for c in sorted(FAIXAS):
            gg = g[g.faixa == c]
            if gg.qt.sum():
                bb = _bloco_instrucao(gg)
                out["por_faixa_sexo"].setdefault(nome_f[c], {})[nm] = {
                    "total": bb["total"],
                    "pct_analfabeto": bb["pct_analfabeto"],
                    "pct_le_escreve": bb["pct_le_escreve"],
                }
    d2 = d.assign(ge=d.faixa.map(_grupo_etario))
    for ge, g in d2.groupby("ge"):
        b = _bloco_instrucao(g)
        out["por_grupo_etario"][ge] = {
            k: b[k] for k in ("total", "pct_analfabeto", "pct_le_escreve")
        } | {"analfabetos": b["por_grupo"]["analfabeto"]}
    out["sexo_nao_classificado"] = int(d[~d.genero.isin(sexo)].qt.sum())
    return out


# ----------------------------------------------------------------------------------------
# Mapa municipal (código TSE -> IBGE; null != 0)
# ----------------------------------------------------------------------------------------


def indice_ibge(base: Path = RAW) -> tuple[dict[tuple[str, str], str], dict[str, str]]:
    """(UF, nome normalizado) -> IBGE e IBGE -> UF, a partir de `data/raw/ibge/municipios.json`."""
    ms = json.loads((base / "ibge" / "municipios.json").read_text(encoding="utf-8"))
    idx: dict[tuple[str, str], str] = {}
    uf_de: dict[str, str] = {}
    for m in ms:
        uf = geo._uf(m)
        ibge = str(m["id"])
        idx[(uf, geo.norm(m["nome"]))] = ibge
        uf_de[ibge] = uf
    return idx, uf_de


def mapa_tse_ibge(df: pd.DataFrame, idx: dict) -> tuple[dict[int, str], list[dict]]:
    mun = df[df.uf != "ZZ"].drop_duplicates("cd")[["cd", "uf", "nm"]]
    trip = [(int(r.cd), r.uf, r.nm) for r in mun.itertuples()]
    return geo.tse_to_ibge(trip, idx)


def municipal(df: pd.DataFrame, cd2ibge: dict[int, str]) -> dict[str, dict]:
    """Por município IBGE: eleitores por grupo de instrução, percentuais e % de analfabetos 60+."""
    d = df[df.cd.isin(cd2ibge)].copy()
    d["ibge"] = d.cd.map(cd2ibge)
    d["g"] = d.grau.map({g: k for k, v in GRUPOS.items() for g in v})
    piv = d.pivot_table(
        index="ibge", columns="g", values="qt", aggfunc="sum", fill_value=0
    )
    for k in GRUPOS:
        if k not in piv:
            piv[k] = 0
    v60 = d[d.faixa.map(lambda f: f in FAIXAS and FAIXAS[f][0] >= 60)]
    p60 = v60.pivot_table(
        index="ibge", columns="g", values="qt", aggfunc="sum", fill_value=0
    )
    out: dict[str, dict] = {}
    for ibge, r in piv.iterrows():
        tot = int(r.sum())
        n60 = int(p60.loc[ibge].sum()) if ibge in p60.index else 0
        a60 = int(p60.loc[ibge].get("analfabeto", 0)) if ibge in p60.index else 0
        out[str(ibge)] = {
            "eleitores": tot,
            "analfabeto": int(r["analfabeto"]),
            "le_escreve": int(r["le_escreve"]),
            "fundamental": int(r["fundamental"]),
            "medio": int(r["medio"]),
            "superior": int(r["superior"]),
            "nao_informado": int(r["nao_informado"]),
            "pct_analfabeto": _pct(r["analfabeto"], tot, 2),
            "pct_le_escreve": _pct(r["le_escreve"], tot, 2),
            "eleitores_60mais": n60,
            "pct_analfabeto_60mais": _pct(a60, n60, 2),
        }
    return out


# ----------------------------------------------------------------------------------------
# Comparecimento por grau de instrução (perfil_comparecimento_abstencao)
# ----------------------------------------------------------------------------------------


def comparecimento_por_instrucao(ano: int, base: Path = RAW) -> dict | None:
    """Aptos, comparecimento e abstenção por turno x grau (nacional) e x grupo etário.

    O voto do analfabeto, de 16-17 e de 70+ é facultativo: a abstenção deles não é 'falta'.
    """
    import duckdb

    pasta = base / f"perfil_comparecimento_abstencao_{ano}"
    arqs = sorted(
        str(p)
        for p in pasta.glob(f"perfil_comparecimento_abstencao_{ano}_*.csv")
        if not p.name.endswith("_BRASIL.csv")
    )
    if not arqs:
        return None
    sql = (
        "select try_cast(NR_TURNO as int) turno, SG_UF uf, "
        "try_cast(CD_GRAU_ESCOLARIDADE as int) grau, try_cast(CD_FAIXA_ETARIA as int) faixa, "
        "sum(try_cast(QT_APTOS as bigint)) aptos, sum(try_cast(QT_COMPARECIMENTO as bigint)) comp, "
        "sum(try_cast(QT_ABSTENCAO as bigint)) abst, "
        "sum(try_cast(QT_COMPAREC_FACULTATIVO as bigint)) comp_fac, "
        "sum(try_cast(QT_ABST_FACULTATIVO as bigint)) abst_fac "
        f"from {_csv(arqs)} group by 1,2,3,4"
    )
    d = duckdb.connect().sql(sql).df()
    out: dict = {"ano": ano, "turnos": {}}
    for turno, t in d.groupby("turno"):
        t = t.assign(
            ge=t.faixa.map(_grupo_etario),
            g=t.grau.map({g: k for k, v in GRUPOS.items() for g in v}),
        )

        def cel(x: pd.DataFrame) -> dict:
            ap, co = int(x.aptos.sum()), int(x.comp.sum())
            return {
                "aptos": ap,
                "comparecimento": co,
                "abstencao": int(x.abst.sum()),
                "pct_comparecimento": _pct(co, ap, 2),
                "aptos_facultativo": int(x.comp_fac.sum() + x.abst_fac.sum()),
            }

        por_grupo = {k: cel(g) for k, g in t.groupby("g")}
        por_grupo_etario = {
            ge: {k: cel(g) for k, g in x.groupby("g")} for ge, x in t.groupby("ge")
        }
        analf_uf = {
            uf: cel(x[x.g == "analfabeto"])
            for uf, x in t.groupby("uf")
            if (x.g == "analfabeto").any()
        }
        out["turnos"][str(int(turno))] = {
            "total": cel(t),
            "por_grupo_instrucao": por_grupo,
            "por_grupo_etario_x_instrucao": por_grupo_etario,
            "analfabeto_por_uf": analf_uf,
        }
    return out


# ----------------------------------------------------------------------------------------
# Tábua de mortalidade do IBGE (xlsx lido sem dependência extra)
# ----------------------------------------------------------------------------------------


def ler_tabua_ibge(path: Path) -> np.ndarray:
    """q(x) anual (probabilidade de morte entre x e x+1) para x = 0..90, a partir do xlsx.

    A linha '90 ou mais' não tem q anual definido; usa-se q = 1 - exp(-1/e(90)).
    """
    with zipfile.ZipFile(path) as z:
        ss = re.findall(
            r"<si>(.*?)</si>",
            z.read("xl/sharedStrings.xml").decode("utf-8"),
            flags=re.DOTALL,
        )
        ss = ["".join(re.findall(r"<t[^>]*>([^<]*)</t>", s)) for s in ss]
        x = z.read("xl/worksheets/sheet1.xml").decode("utf-8")
    q: dict[int, float] = {}
    e90 = None
    for row in re.findall(r"<row [^>]*>(.*?)</row>", x, flags=re.DOTALL):
        cells = {}
        for ref, attrs, val in re.findall(
            r'<c r="([A-Z]+)\d+"([^>]*?)(?:/>|>(?:<v>([^<]*)</v>)?</c>)', row
        ):
            if val == "":
                continue
            cells[ref] = ss[int(val)] if 't="s"' in attrs else val
        a = cells.get("A", "")
        try:
            idade = int(float(a))
        except ValueError:
            if a.strip().startswith("90"):
                e90 = float(cells["G"])
            continue
        if 0 <= idade <= 89 and "B" in cells:
            q[idade] = float(cells["B"]) / 1000.0
    if len(q) != 90 or e90 is None:
        raise ValueError(f"tábua IBGE inesperada: {len(q)} idades, e90={e90}")
    q[90] = 1 - float(np.exp(-1 / e90))
    return np.array([q[i] for i in range(91)])


def q_por_idade(qx: np.ndarray) -> np.ndarray:
    """q para as idades 16..104 (acima de 90 repete q(90))."""
    return np.array([qx[min(a, 90)] for a in range(IDADE_MIN, IDADE_MAX + 1)])


# ----------------------------------------------------------------------------------------
# Séries por grau (nacional e região) e projeção por coortes
# ----------------------------------------------------------------------------------------

GRUPOS_ETARIOS_K = ((18, 24), (25, 39), (40, 59), (60, 69), (70, 79), (80, 104))
VARIAVEIS = {"T": None, "A": (1,), "L": (2,)}


def vetor_idades(df: pd.DataFrame, graus: tuple[int, ...] | None = None) -> np.ndarray:
    """Eleitores por idade simples (16..104), espalhando cada faixa uniformemente.

    Exclui exterior (ZZ) e faixa inválida. Suposição: uniforme dentro da faixa de 5 anos.
    """
    d = df[(df.uf != "ZZ") & df.faixa.isin(FAIXAS)]
    if graus is not None:
        d = d[d.grau.isin(graus)]
    v = np.zeros(N_IDADES)
    for c, n in d.groupby("faixa").qt.sum().items():
        a0, a1 = FAIXAS[c]
        v[a0 - IDADE_MIN : a1 - IDADE_MIN + 1] += n / (a1 - a0 + 1)
    return v


def _idx_grupo(ini: int, fim: int) -> slice:
    return slice(ini - IDADE_MIN, fim - IDADE_MIN + 1)


def passo(v: np.ndarray, q: np.ndarray, k: np.ndarray) -> np.ndarray:
    """Um ano: quem tem idade a passa a a+1, sobrevive com (1-q(a)) e é ajustado por k(a+1).

    `v` pode ter forma (idades,) ou (caminhos, idades). Não cria entrantes (idade 16 fica 0).
    A última idade (104) é aberta: acumula quem já estava nela.
    """
    n = np.zeros_like(v)
    sob = v * (1 - q) * k
    n[..., 1:] = sob[..., :-1]
    n[..., -1] += sob[..., -1]
    return n


def kappas_por_janela(
    vetores: dict[int, np.ndarray], q: np.ndarray
) -> dict[tuple[int, int], np.ndarray]:
    """κ anual por grupo etário, em cada par de levantamentos consecutivos.

    κ = (observado / previsto só com a tábua do IBGE)^(1/anos). κ≈1 quer dizer que a coorte
    evolui como a tábua prevê; <1 saída extra (cancelamento, mortalidade maior); >1 entrada
    (alistamento tardio, recadastramento).
    """
    anos = sorted(vetores)
    um = np.ones(N_IDADES)
    out = {}
    for a0, a1 in zip(anos[:-1], anos[1:]):
        dt = a1 - a0
        p = vetores[a0]
        for _ in range(dt):
            p = passo(p, q, um)
        obs = vetores[a1]
        ks = []
        for g0, g1 in GRUPOS_ETARIOS_K:
            s = _idx_grupo(g0, g1)
            ks.append(
                (obs[s].sum() / p[s].sum()) ** (1 / dt) if p[s].sum() > 0 else 1.0
            )
        out[(a0, a1)] = np.array(ks)
    return out


def _k_por_idade(kg: np.ndarray) -> np.ndarray:
    """Expande κ por grupo (..., 6) para κ por idade (..., 89); idades 16-17 usam o grupo 18-24."""
    ids = np.zeros(N_IDADES, dtype=int)
    for i, (g0, g1) in enumerate(GRUPOS_ETARIOS_K):
        ids[_idx_grupo(g0, g1)] = i
    return kg[..., ids]


def simular(
    v0: np.ndarray,
    q: np.ndarray,
    kg: np.ndarray,
    entrantes: np.ndarray,
    anos: int,
) -> dict[int, np.ndarray]:
    """Projeta `anos` passos anuais. kg: (caminhos, 6). entrantes: (caminhos, anos).

    Devolve {passo: matriz (caminhos, idades)}.
    """
    n = kg.shape[0]
    v = np.tile(v0, (n, 1))
    k = _k_por_idade(kg)
    res: dict[int, np.ndarray] = {}
    for t in range(1, anos + 1):
        v = passo(v, q, k)
        v[:, 0] += entrantes[:, t - 1]
        res[t] = v.copy()
    return res


def _quantis(x: np.ndarray, ps=(10, 50, 90)) -> dict[str, float]:
    return {f"p{p}": float(np.percentile(x, p)) for p in ps}


def projetar(
    dfs: dict[int, pd.DataFrame],
    q: np.ndarray,
    origem: int,
    ate: int,
    n_caminhos: int = 2000,
    seed: int = 20260101,
    filtro=None,
) -> dict:
    """Projeção por coortes a partir do levantamento `origem`, usando só janelas já observadas.

    `filtro`: função df -> df (recorta a região; κ continua o nacional).
    Componentes: (1) envelhecimento: cada idade vira a+1 por ano; (2) mortalidade: tábua do IBGE
    2024 (q por idade) vezes κ do grupo etário; (3) reposição: entrantes de 16 anos, com nível
    do levantamento de origem (±20% por caminho) e taxa de analfabetos/'lê e escreve' observada
    nos de 16-17 anos da origem (±30% por caminho).
    """
    rng = np.random.default_rng(seed)
    anos_cal = [y for y in sorted(dfs) if y <= origem]
    vec_nac = {
        nome: {y: vetor_idades(dfs[y], g) for y in anos_cal}
        for nome, g in VARIAVEIS.items()
    }
    sub = filtro if filtro else (lambda d: d)
    base = sub(dfs[origem])
    vec_loc = {nome: vetor_idades(base, g) for nome, g in VARIAVEIS.items()}
    passos = ate - origem
    entr_t = vetor_idades(base)[0]
    entrantes_T = entr_t * np.exp(rng.normal(0, 0.2, size=(n_caminhos, 1)))
    entrantes_T = entrantes_T * np.ones((1, passos))
    jovens = base[(base.uf != "ZZ") & base.faixa.isin((1600, 1700))]
    taxa = {
        nome: float(jovens[jovens.grau.isin(g)].qt.sum() / max(jovens.qt.sum(), 1))
        for nome, g in VARIAVEIS.items()
        if g is not None
    }
    z_r = np.exp(rng.normal(0, 0.3, size=(n_caminhos, 1)))
    # z comum às variáveis: a incerteza de κ é persistente no caminho
    z_k = rng.normal(0, 1, size=(n_caminhos, len(GRUPOS_ETARIOS_K)))
    out: dict = {"origem": origem, "ate": ate, "caminhos": n_caminhos, "kappa": {}}
    res: dict = {}
    for nome in VARIAVEIS:
        arr = np.array(list(kappas_por_janela(vec_nac[nome], q).values()))
        mu = arr.mean(axis=0)
        sd = arr.std(axis=0, ddof=1) if len(arr) > 1 else np.zeros_like(mu)
        kg = mu + z_k * sd
        ent = entrantes_T if nome == "T" else entrantes_T * taxa[nome] * z_r
        res[nome] = simular(vec_loc[nome], q, kg, ent, passos)
        out["kappa"][nome] = {
            "media": [round(float(x), 4) for x in mu],
            "desvio": [round(float(x), 4) for x in sd],
            "janelas": len(arr),
        }
    out["vetores"] = res
    out["taxa_entrantes_16_17"] = {k: round(v, 6) for k, v in taxa.items()}
    return out


def resumo_projecao(p: dict, anos: list[int] | None = None) -> dict:
    """Quantis por ano: T, A, L, % analfabeto, % 'lê e escreve', % 60+, % 70+, idade média."""
    origem = p["origem"]
    idades = np.arange(IDADE_MIN, IDADE_MAX + 1)
    out: dict = {}
    for t in sorted(p["vetores"]["T"]):
        ano = origem + t
        if anos is not None and ano not in anos:
            continue
        T, A, L = (p["vetores"][k][t] for k in ("T", "A", "L"))
        tot = T.sum(axis=1)
        out[str(ano)] = {
            "eleitores": _quantis(tot),
            "analfabetos": _quantis(A.sum(axis=1)),
            "le_escreve": _quantis(L.sum(axis=1)),
            "pct_analfabeto": _quantis(100 * A.sum(axis=1) / tot),
            "pct_le_escreve": _quantis(100 * L.sum(axis=1) / tot),
            "pct_60mais": _quantis(100 * T[:, idades >= 60].sum(axis=1) / tot),
            "pct_70mais": _quantis(100 * T[:, idades >= 70].sum(axis=1) / tot),
            "idade_media": _quantis((T * idades).sum(axis=1) / tot),
            "pct_dos_analfabetos_com_70mais": _quantis(
                100 * A[:, idades >= 70].sum(axis=1) / A.sum(axis=1)
            ),
        }
    return out


def _arred(d, nd: int = 3):
    if isinstance(d, dict):
        return {k: _arred(v, nd) for k, v in d.items()}
    if isinstance(d, float):
        return round(d, nd)
    return d


def _linear(anos: list[int], vals: list[float], alvo: int) -> float:
    b, a = np.polyfit(anos, vals, 1)
    return float(a + b * alvo)


def validacao_retrospectiva(
    dfs: dict[int, pd.DataFrame], q: np.ndarray, n: int = 1000
) -> dict:
    """Prevê levantamentos já observados com dados anteriores (origens 2018 e 2022).

    Compara a mediana e a faixa p10-p90 com o observado e com duas linhas de base: 'último
    valor' e 'tendência linear' dos três últimos levantamentos. Mede o erro relativo.
    """
    obs = {
        nome: {y: float(vetor_idades(dfs[y], g).sum()) for y in dfs}
        for nome, g in VARIAVEIS.items()
    }
    out: dict = {
        "metodo": (
            "Calibra κ só com janelas até a origem; simula caminhos; compara com o "
            "levantamento real (sem exterior, idades válidas). Linhas de base: último valor "
            "e extrapolação linear dos três últimos levantamentos."
        ),
        "origens": {},
    }
    nomes = (("A", "analfabetos"), ("L", "le_escreve"), ("T", "eleitores"))
    for origem in (2018, 2022):
        alvos = [y for y in sorted(dfs) if y > origem]
        p = projetar(dfs, q, origem, max(alvos), n_caminhos=n, seed=7 + origem)
        tabela = []
        for nome, rot in nomes:
            hist = [y for y in sorted(dfs) if y <= origem][-3:]
            for y in alvos:
                dist = p["vetores"][nome][y - origem].sum(axis=1)
                q10, q50, q90 = np.percentile(dist, [10, 50, 90])
                real, ing = obs[nome][y], obs[nome][origem]
                lin = _linear(hist, [obs[nome][h] for h in hist], y)
                tabela.append(
                    {
                        "variavel": rot,
                        "ano_alvo": y,
                        "horizonte": y - origem,
                        "observado": round(real),
                        "previsto_p50": round(float(q50)),
                        "faixa_p10_p90": [round(float(q10)), round(float(q90))],
                        "erro_modelo_pct": round(100 * (q50 - real) / real, 2),
                        "erro_ultimo_valor_pct": round(100 * (ing - real) / real, 2),
                        "erro_linear_pct": round(100 * (lin - real) / real, 2),
                        "dentro_da_faixa": bool(q10 <= real <= q90),
                    }
                )
        out["origens"][str(origem)] = {
            "kappa_analfabetos": p["kappa"]["A"],
            "tabela": tabela,
        }
    linhas = [
        r
        for o in out["origens"].values()
        for r in o["tabela"]
        if r["variavel"] == "analfabetos"
    ]
    mae = lambda k: round(float(np.mean([abs(r[k]) for r in linhas])), 2)
    out["resumo_analfabetos"] = {
        "n_previsoes": len(linhas),
        "erro_absoluto_medio_modelo_pct": mae("erro_modelo_pct"),
        "erro_absoluto_medio_ultimo_valor_pct": mae("erro_ultimo_valor_pct"),
        "erro_absoluto_medio_linear_pct": mae("erro_linear_pct"),
        "cobertura_faixa_p10_p90": round(
            float(np.mean([r["dentro_da_faixa"] for r in linhas])), 2
        ),
    }
    return out


def validacao_regional(
    dfs: dict[int, pd.DataFrame], q: np.ndarray, n: int = 600
) -> dict:
    """Prevê analfabetos por região em 2024 e 2026 a partir de 2022, com κ nacional."""
    out: dict = {}
    for r in REGIOES:

        def f(d, r=r):
            return d[d.uf.map(UF_REGIAO) == r]

        p = projetar(dfs, q, 2022, 2026, n_caminhos=n, seed=11, filtro=f)
        for y in (2024, 2026):
            dist = p["vetores"]["A"][y - 2022].sum(axis=1)
            real = float(vetor_idades(f(dfs[y]), (1,)).sum())
            p10, p50, p90 = np.percentile(dist, [10, 50, 90])
            out.setdefault(r, {})[str(y)] = {
                "observado": round(real),
                "previsto_p50": round(float(p50)),
                "faixa_p10_p90": [round(float(p10)), round(float(p90))],
                "erro_pct": round(100 * (p50 - real) / real, 2),
            }
    return out


def _sd_log(d: dict) -> float:
    """Desvio-padrão em escala log implícito em p10-p90 (normal: z=1,2816)."""
    return float((np.log(d["p90"]) - np.log(d["p10"])) / (2 * 1.2816))


def faixa_calibrada(q: dict[str, float], sd_backtest: float) -> list[float]:
    """Faixa p10-p90 que soma à incerteza simulada o erro RMS medido na validação retrospectiva."""
    sd = float(np.hypot(_sd_log(q), sd_backtest))
    return [
        round(q["p50"] * float(np.exp(-1.2816 * sd))),
        round(q["p50"] * float(np.exp(1.2816 * sd))),
    ]


def sd_erro_backtest(val: dict) -> float:
    """RMS do erro logarítmico (previsto/observado) dos analfabetos nas validações."""
    e = [
        np.log(r["previsto_p50"] / r["observado"])
        for o in val["origens"].values()
        for r in o["tabela"]
        if r["variavel"] == "analfabetos"
    ]
    return float(np.sqrt(np.mean(np.square(e))))


def projecao_2038(
    dfs: dict[int, pd.DataFrame], q: np.ndarray, val: dict, n: int = 2000
) -> dict:
    """Projeção do eleitorado e dos analfabetos, 2026-2038 (nacional e por região) e longo prazo."""
    sd_bt = sd_erro_backtest(val)
    p = projetar(dfs, q, 2026, ANO_FIM, n_caminhos=n)
    res = resumo_projecao(p)
    for ano, r in res.items():
        r["analfabetos_faixa_calibrada_p10_p90"] = faixa_calibrada(
            r["analfabetos"], sd_bt
        )
        r["le_escreve_faixa_calibrada_p10_p90"] = faixa_calibrada(
            r["le_escreve"], sd_bt
        )
    # Regiões: mesmo seed => mesmos sorteios em cada caminho; participações por caminho.
    por_regiao: dict = {}
    pr = {}
    for r in REGIOES:

        def f(d, r=r):
            return d[d.uf.map(UF_REGIAO) == r]

        pr[r] = projetar(dfs, q, 2026, ANO_FIM, n_caminhos=n, filtro=f)
    for ano in (2026, 2030, 2034, 2038):
        t = ano - 2026
        base = {
            r: (
                {
                    "A": vetor_idades(
                        dfs[2026][dfs[2026].uf.map(UF_REGIAO) == r], (1,)
                    ).sum(),
                    "T": vetor_idades(
                        dfs[2026][dfs[2026].uf.map(UF_REGIAO) == r]
                    ).sum(),
                }
                if t == 0
                else {
                    "A": pr[r]["vetores"]["A"][t].sum(axis=1),
                    "T": pr[r]["vetores"]["T"][t].sum(axis=1),
                }
            )
            for r in REGIOES
        }
        totA = sum(base[r]["A"] for r in REGIOES)
        totT = sum(base[r]["T"] for r in REGIOES)
        for r in REGIOES:
            a, tt = base[r]["A"], base[r]["T"]
            cel = {
                "analfabetos": _quantis(np.atleast_1d(a)),
                "pct_analfabeto_da_regiao": _quantis(np.atleast_1d(100 * a / tt)),
                "participacao_nos_analfabetos_pct": _quantis(
                    np.atleast_1d(100 * a / totA)
                ),
                "participacao_no_eleitorado_pct": _quantis(
                    np.atleast_1d(100 * tt / totT)
                ),
            }
            por_regiao.setdefault(r, {})[str(ano)] = cel
    # Decomposição determinística (κ = média das janelas, entrantes no nível central)
    dec = _decomposicao(dfs, q)
    longo = _longo_prazo(dfs, q)
    return {
        "suposicoes": SUPOSICOES_PROJECAO,
        "parametros": {
            "origem": 2026,
            "ate": ANO_FIM,
            "caminhos": n,
            "kappa_por_grupo_etario": {
                "grupos": [f"{a}-{b}" for a, b in GRUPOS_ETARIOS_K],
                **p["kappa"],
            },
            "taxa_analfabetos_entre_16_17_anos": p["taxa_entrantes_16_17"],
            "erro_backtest_log_rms": round(sd_bt, 4),
        },
        "validacao_retrospectiva": val,
        "faixa": {
            "descricao": (
                "p10-p90 simulado (incerteza de κ e de entrantes) e 'faixa_calibrada', que soma "
                "o erro RMS da validação retrospectiva; a simulada sozinha cobriu só uma "
                "fração dos casos observados e é estreita demais."
            ),
            "nacional_por_ano": res,
        },
        "por_regiao": por_regiao,
        "decomposicao_2026_2038": dec,
        "longo_prazo": longo,
    }


SUPOSICOES_PROJECAO = [
    "SUPOSIÇÃO: a idade vira a+1 a cada ano e cada coorte sobrevive com a tábua completa de "
    "mortalidade do IBGE (ambos os sexos, 2024), igual para analfabetos e alfabetizados "
    "(analfabetos tendem a morrer mais cedo; isso entra no ajuste κ, não na tábua).",
    "SUPOSIÇÃO: κ (ajuste anual por grupo etário) = média das janelas bienais observadas entre "
    "2014 e 2026, mais um sorteio normal com o desvio entre janelas, fixo ao longo do caminho. "
    "κ junta mortalidade diferencial, cancelamento de títulos, alistamento tardio e "
    "alfabetização de adultos; não separa esses efeitos.",
    "SUPOSIÇÃO: ninguém troca de grau de instrução dentro da coorte além do que κ absorve "
    "(a série mostra κ≈1 acima de 25 anos).",
    "SUPOSIÇÃO: o número de eleitores de 16 anos que entram a cada ano fica no nível de 2026 "
    "(±20% por caminho, sem tendência), e a taxa de analfabetos/'lê e escreve' entre eles "
    "fica na observada em 2026 nos de 16-17 anos (±30%).",
    "SUPOSIÇÃO: as regras do voto não mudam (facultativo para analfabetos, 16-17 e 70+; "
    "analfabeto continua inelegível, CF art. 14 §4º).",
    "SUPOSIÇÃO: o cadastro de 2026 (julho) representa a população votante; sem migração "
    "internacional relevante e sem novo recadastramento forçado.",
    "A projeção é de eleitores inscritos com grau declarado, não de população analfabeta; "
    "o grau é autodeclarado no alistamento e não é atualizado automaticamente.",
]


def _decomposicao(dfs: dict[int, pd.DataFrame], q: np.ndarray) -> dict:
    anos_cal = [y for y in sorted(dfs) if y <= 2026]
    vec = {
        nome: {y: vetor_idades(dfs[y], g) for y in anos_cal}
        for nome, g in VARIAVEIS.items()
    }
    mu = np.array(list(kappas_por_janela(vec["A"], q).values())).mean(axis=0)[None, :]
    v0 = vetor_idades(dfs[2026], (1,))
    passos = ANO_FIM - 2026
    jov = dfs[2026][(dfs[2026].uf != "ZZ") & dfs[2026].faixa.isin((1600, 1700))]
    taxa = float(jov[jov.grau == 1].qt.sum() / jov.qt.sum())
    e0 = vetor_idades(dfs[2026])[0] * taxa
    ent = np.full((1, passos), e0)
    com = simular(v0, q, mu, ent, passos)[passos].sum()
    sem_ent = simular(v0, q, mu, np.zeros((1, passos)), passos)[passos].sum()
    so_tabua = simular(v0, q, np.ones_like(mu), np.zeros((1, passos)), passos)[
        passos
    ].sum()
    a26 = float(v0.sum())
    return {
        "analfabetos_2026": round(a26),
        "sobreviventes_de_2026_so_tabua_ibge": round(float(so_tabua)),
        "sobreviventes_de_2026_com_kappa": round(float(sem_ent)),
        "entrantes_analfabetos_2027_2038": round(float(com - sem_ent)),
        "analfabetos_2038_central": round(float(com)),
        "pct_de_2026_ainda_inscrito_2038": round(100 * float(sem_ent) / a26, 2),
        "pct_do_estoque_2038_que_vem_de_entrantes": round(
            100 * float(com - sem_ent) / float(com), 2
        ),
        "nota": (
            "Execução determinística com κ = média das janelas e entrantes no nível central; "
            "o p50 da simulação pode diferir levemente."
        ),
    }


def _longo_prazo(dfs: dict[int, pd.DataFrame], q: np.ndarray, n: int = 600) -> dict:
    """Extrapolação até 2080 para mostrar a substituição de coortes (muito incerta)."""
    ate = 2080
    p = projetar(dfs, q, 2026, ate, n_caminhos=n, seed=99)
    A = {t: p["vetores"]["A"][t].sum(axis=1) for t in p["vetores"]["A"]}
    T = {t: p["vetores"]["T"][t].sum(axis=1) for t in p["vetores"]["T"]}
    anos = {str(2026 + t): _quantis(a) for t, a in A.items() if (2026 + t) % 10 == 0}
    pct = {
        str(2026 + t): _quantis(100 * A[t] / T[t]) for t in A if (2026 + t) % 10 == 0
    }
    cruz = {}
    for lim in (4_000_000, 3_000_000, 2_000_000, 1_000_000):
        anos_cruz = []
        for i in range(n):
            ok = [2026 + t for t in A if A[t][i] < lim]
            anos_cruz.append(min(ok) if ok else np.nan)
        arr = np.array(anos_cruz, dtype=float)
        cruz[str(lim)] = {
            "p10": None
            if np.isnan(arr).mean() > 0.9
            else float(np.nanpercentile(arr, 10)),
            "p50": None
            if np.isnan(arr).mean() > 0.5
            else float(np.nanpercentile(arr, 50)),
            "p90": None
            if np.isnan(arr).mean() > 0.1
            else float(np.nanpercentile(arr, 90)),
            "fracao_caminhos_que_cruzam_ate_2080": round(
                float(1 - np.isnan(arr).mean()), 3
            ),
        }
    return {
        "aviso": "Extrapolação além de 2038: κ e entrantes fixos por décadas; só ilustra a "
        "substituição de coortes, não é previsão.",
        "analfabetos_por_decada": anos,
        "pct_analfabeto_por_decada": pct,
        "ano_em_que_cai_abaixo_de": cruz,
    }


# ----------------------------------------------------------------------------------------
# Cruzamentos: % de analfabetos x voto, dentro da UF
# ----------------------------------------------------------------------------------------


def _wls(y: np.ndarray, X: np.ndarray, w: np.ndarray) -> tuple[np.ndarray, float]:
    """MQP ponderados sem intercepto (variáveis já centradas na UF). Devolve (β, R²)."""
    Xw = X * w[:, None]
    beta = np.linalg.solve(X.T @ Xw + 1e-12 * np.eye(X.shape[1]), Xw.T @ y)
    res = y - X @ beta
    sst = float((w * y**2).sum())
    return beta, (1 - float((w * res**2).sum()) / sst) if sst > 0 else float("nan")


def _centrar(M: np.ndarray, uf: np.ndarray, w: np.ndarray) -> np.ndarray:
    out = M.astype(float).copy()
    for u in np.unique(uf):
        i = uf == u
        out[i] -= (w[i, None] * M[i]).sum(axis=0) / w[i].sum()
    return out


def efeito_intra_uf(
    df: pd.DataFrame, y: str, xs: list[str], n_boot: int = 400, seed: int = 1
) -> dict:
    """β de y ~ xs com efeito fixo de UF, ponderado pelos votos válidos.

    IC 95% por bootstrap de municípios (dentro da UF) e por bootstrap de UFs (conglomerado).
    β = pontos percentuais de y por +1 ponto percentual do regressor, dentro da UF.
    """
    d = df.dropna(subset=[y, *xs, "peso"]).copy()
    d = d[d.peso > 0]
    rng = np.random.default_rng(seed)
    uf = d.uf.to_numpy()
    w = d.peso.to_numpy(float)
    M = d[[y, *xs]].to_numpy(float)
    C = _centrar(M, uf, w)
    beta, r2 = _wls(C[:, 0], C[:, 1:], w)
    ufs = np.unique(uf)
    idx_uf = {u: np.flatnonzero(uf == u) for u in ufs}
    b_mun, b_uf = [], []
    for _ in range(n_boot):
        sel = np.concatenate([rng.choice(ix, size=len(ix)) for ix in idx_uf.values()])
        c = _centrar(M[sel], uf[sel], w[sel])
        b_mun.append(_wls(c[:, 0], c[:, 1:], w[sel])[0])
        sorteio = rng.choice(ufs, size=len(ufs))
        sel2 = np.concatenate([idx_uf[u] for u in sorteio])
        rot = np.concatenate(
            [np.full(len(idx_uf[u]), f"{i}") for i, u in enumerate(sorteio)]
        )
        c2 = _centrar(M[sel2], rot, w[sel2])
        b_uf.append(_wls(c2[:, 0], c2[:, 1:], w[sel2])[0])
    b_mun, b_uf = np.array(b_mun), np.array(b_uf)
    out = {
        "n_municipios": len(d),
        "n_ufs": len(ufs),
        "r2_intra_uf": round(r2, 4),
    }
    for j, x in enumerate(xs):
        iqr = d.groupby("uf")[x].agg(lambda s: s.quantile(0.75) - s.quantile(0.25))
        iqr_med = float(
            np.average(iqr.to_numpy(), weights=d.groupby("uf").peso.sum().to_numpy())
        )
        out[x] = {
            "beta_pp_por_pp": round(float(beta[j]), 4),
            "ic95_municipios": [
                round(float(np.percentile(b_mun[:, j], 2.5)), 4),
                round(float(np.percentile(b_mun[:, j], 97.5)), 4),
            ],
            "ic95_ufs": [
                round(float(np.percentile(b_uf[:, j], 2.5)), 4),
                round(float(np.percentile(b_uf[:, j], 97.5)), 4),
            ],
            "efeito_da_amplitude_interquartil_intra_uf_pp": round(
                float(beta[j]) * iqr_med, 3
            ),
            "amplitude_interquartil_media_pp": round(iqr_med, 3),
        }
    return out


def inclinacao_por_uf(
    df: pd.DataFrame, y: str, x: str, n_boot: int = 300, seed: int = 3
) -> dict:
    """Inclinação ponderada de y em x dentro de cada UF (>= 10 municípios), IC por bootstrap."""
    rng = np.random.default_rng(seed)
    out = {}
    for uf, g in df.dropna(subset=[y, x, "peso"]).groupby("uf"):
        g = g[g.peso > 0]
        if len(g) < 10 or g[x].std() == 0:
            continue
        xx, yy, ww = g[x].to_numpy(float), g[y].to_numpy(float), g.peso.to_numpy(float)

        def inc(i):
            xm, ym = np.average(xx[i], weights=ww[i]), np.average(yy[i], weights=ww[i])
            vx = (ww[i] * (xx[i] - xm) ** 2).sum()
            return (
                (ww[i] * (xx[i] - xm) * (yy[i] - ym)).sum() / vx if vx > 0 else np.nan
            )

        todos = np.arange(len(g))
        b = [inc(rng.choice(todos, len(todos))) for _ in range(n_boot)]
        out[uf] = {
            "n": len(g),
            "beta_pp_por_pp": round(float(inc(todos)), 4),
            "ic95": [
                round(float(np.nanpercentile(b, 2.5)), 4),
                round(float(np.nanpercentile(b, 97.5)), 4),
            ],
        }
    return out


def montar_painel(
    pid: str, mun: dict[str, dict], terr: dict, uf_de: dict, web: Path = WEB
) -> pd.DataFrame:
    """Junta voto (elections/<pid>.json), território (Censo 2022) e % de analfabetos (perfil)."""
    el = json.loads((web / "elections" / f"{pid}.json").read_text(encoding="utf-8"))
    cand = {int(c["numero"]): c["nome"] for c in el["meta"]["candidatos"]}
    linhas = []
    for ibge, r in el["linhas"].items():
        m = mun.get(ibge)
        t = terr.get(ibge, {})
        va = r["validos"]
        linhas.append(
            {
                "ibge": ibge,
                "uf": uf_de.get(ibge),
                "peso": va,
                "pct_analfabeto": None if m is None else m["pct_analfabeto"],
                "pct_le_escreve": None if m is None else m["pct_le_escreve"],
                "pct_pretos_pardos": t.get("pct_pretos_pardos"),
                "pct_indigena": t.get("pct_indigena"),
                "comparecimento_pct": 100 * r["comparecimento"] / r["aptos"]
                if r["aptos"]
                else None,
                "voto_13": 100 * r["votos"].get("13", 0) / va if va else None,
                "voto_22": 100 * r["votos"].get("22", 0) / va if va else None,
            }
        )
    df = pd.DataFrame(linhas)
    df.attrs["candidatos"] = {13: cand.get(13), 22: cand.get(22)}
    df.attrs["status"] = el["meta"].get("status")
    return df


def cruzamentos(
    mun_por_ano: dict[int, dict],
    terr: dict,
    uf_de: dict,
    n_boot: int = 400,
    web: Path = WEB,
) -> dict:
    """Voto em 13 e em 22 e comparecimento x % de analfabetos, dentro da UF."""
    pleitos = (("pres_2022_t1", 2022), ("pres_2022_t2", 2022), ("pres_2026_t1", 2026))
    resultados: dict = {}
    for pid, ano in pleitos:
        if not (web / "elections" / f"{pid}.json").exists() or ano not in mun_por_ano:
            continue
        df = montar_painel(pid, mun_por_ano[ano], terr, uf_de, web)
        r: dict = {
            "ano_do_perfil": ano,
            "status_da_apuracao": df.attrs["status"],
            "candidatos": df.attrs["candidatos"],
            "n_municipios_com_voto_e_perfil": int(df.pct_analfabeto.notna().sum()),
            "correlacao_simples_pearson": {
                c: round(float(df[["pct_analfabeto", c]].corr().iloc[0, 1]), 3)
                for c in ("voto_13", "voto_22", "comparecimento_pct")
            },
            "correlacao_entre_regressores": round(
                float(df[["pct_analfabeto", "pct_pretos_pardos"]].corr().iloc[0, 1]), 3
            ),
        }
        for c in ("voto_13", "voto_22", "comparecimento_pct"):
            r[c] = {
                "bivariado_intra_uf": efeito_intra_uf(
                    df, c, ["pct_analfabeto"], n_boot
                ),
                "multivariado_intra_uf": efeito_intra_uf(
                    df,
                    c,
                    ["pct_analfabeto", "pct_pretos_pardos", "pct_indigena"],
                    n_boot,
                ),
            }
        r["por_uf_voto_13"] = inclinacao_por_uf(df, "voto_13", "pct_analfabeto")
        r["por_uf_voto_22"] = inclinacao_por_uf(df, "voto_22", "pct_analfabeto")
        resultados[pid] = r
    return resultados


RESSALVAS_CRUZAMENTO = [
    "Falácia ecológica: as unidades são municípios. Um coeficiente municipal NÃO diz como o "
    "analfabeto vota; ele descreve como o voto varia entre municípios com mais ou menos "
    "analfabetos entre os inscritos. Só dados individuais (pesquisa) responderiam à pergunta.",
    "Dentro da UF (efeito fixo) controla o que é comum ao estado (campanha, geografia, "
    "estrutura partidária), mas a % de analfabetos acompanha pobreza, ruralidade, idade e "
    "renda, que o modelo não mede: o coeficiente é associação, não efeito do analfabetismo.",
    "O voto do analfabeto é facultativo; o comparecimento dele é menor e o perfil de quem "
    "comparece difere do de quem não comparece (viés de seleção).",
    "% de pretos e pardos e % indígena vêm do Censo 2022 (população), não do eleitorado; "
    "analfabetos e 'lê e escreve' vêm do cadastro eleitoral do mesmo ano (autodeclarado).",
    "Os ICs por bootstrap de municípios supõem municípios independentes (otimista, há "
    "correlação espacial); o IC por UF (conglomerado) é mais honesto, mas tem só ~26 UFs.",
    "A apuração de 2026 (1º turno) é preliminar neste repositório.",
]


# ----------------------------------------------------------------------------------------
# Download com proveniência
# ----------------------------------------------------------------------------------------

DOWNLOADS = {
    **{
        f"perfil_eleitorado_{a}": f"{TSE}/perfil_eleitorado/perfil_eleitorado_{a}.zip"
        for a in ANOS_PERFIL
    },
    **{
        f"perfil_comparecimento_abstencao_{a}": (
            f"{TSE}/perfil_comparecimento_abstencao/perfil_comparecimento_abstencao_{a}.zip"
        )
        for a in ANOS_COMPARECIMENTO
    },
}


def baixar_tabua(base: Path = RAW) -> dict:
    """Baixa (se ausente) a tábua completa de mortalidade do IBGE e registra a proveniência."""
    import requests

    pasta = base / "ibge_tabua_mortalidade_2024"
    meta_p = pasta / "PROVENIENCIA.json"
    if meta_p.exists():
        return json.loads(meta_p.read_text(encoding="utf-8"))
    pasta.mkdir(parents=True, exist_ok=True)
    r = requests.get(IBGE_TABUA, timeout=60)
    r.raise_for_status()
    arq = pasta / "ambos_os_sexos.xlsx"
    arq.write_bytes(r.content)
    meta = {
        "nome": "ibge_tabua_mortalidade_2024",
        "fonte": IBGE_TABUA,
        "baixado_em": datetime.now(UTC).isoformat(timespec="seconds"),
        "last_modified": r.headers.get("Last-Modified"),
        "bytes": len(r.content),
        "sha256": _sha256(arq),
    }
    meta_p.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    return meta


def baixar_tudo(apagar_zip: bool = True) -> dict[str, dict]:
    """Baixa os perfis do TSE (2014-2026), o comparecimento (2022, 2024) e a tábua do IBGE.

    Os zips novos são apagados depois da extração (hash e metadados ficam em PROVENIENCIA.json).
    """
    from .eleicoes import ingest

    out = {}
    for nome, url in DOWNLOADS.items():
        existia = (RAW / nome / "PROVENIENCIA.json").exists()
        out[nome] = ingest.baixar(nome, url)
        z = RAW / nome / f"{nome}.zip"
        if apagar_zip and not existia and z.exists():
            z.unlink()
    out["ibge_tabua_mortalidade_2024"] = baixar_tabua()
    return out


def _fonte(nome: str, base: Path = RAW) -> dict | None:
    p = _prov(nome, base)
    if p is None:
        return None
    return {
        "nome": nome,
        "url": p["fonte"],
        "baixado_em": p["baixado_em"],
        "last_modified": p.get("last_modified"),
        "sha256": p["sha256"],
    }


def _fonte_arquivo(nome: str, path: Path, url: str | None, nota: str) -> dict:
    return {
        "nome": nome,
        "url": url,
        "baixado_em": datetime.fromtimestamp(path.stat().st_mtime, UTC).isoformat(
            timespec="seconds"
        ),
        "sha256": _sha256(path),
        "nota": nota,
    }


# ----------------------------------------------------------------------------------------
# Séries históricas de analfabetismo (para o JSON)
# ----------------------------------------------------------------------------------------

SERIES_ANALFABETISMO_IDS = (
    "analfabetismo_15mais_censos_hist",
    "analfabetismo_15mais_censos_atlas",
    "analfabetismo_15mais_pnadc",
)

# Engerman & Sokoloff (2005, NBER w8512, Tabela 4), lida na íntegra; taxa de ALFABETIZAÇÃO.
ENGERMAN_SOKOLOFF_ALFAB = [
    (1872, 7, 15.8),
    (1890, 7, 14.8),
    (1900, 7, 25.6),
    (1920, 10, 30.0),
    (1939, 10, 57.0),
]


def serie_analfabetismo(web: Path = WEB, serie_tse: dict | None = None) -> list[dict]:
    sh = json.loads((web / "series_historicas.json").read_text(encoding="utf-8"))
    por_id = {s["id"]: s for s in sh["series"]}
    out = []
    for sid in SERIES_ANALFABETISMO_IDS:
        s = por_id.get(sid)
        if s is None:
            continue
        out.append(
            {
                "id": sid,
                "rotulo": s["rotulo"],
                "unidade": s["unidade"],
                "pontos": s["pontos"],
                "fonte": s["fonte"],
                "notas": s.get("notas"),
                "origem": "web/public/data/series_historicas.json (já validada no projeto)",
            }
        )
    out.append(
        {
            "id": "analfabetismo_populacao_alfabetizacao_engerman_sokoloff",
            "rotulo": "Taxa de analfabetismo implícita (100 - alfabetização), Brasil, Censos 1872-1939",
            "unidade": "% da população (7+ anos em 1872-1900; 10+ anos em 1920 e 1939)",
            "pontos": [[a, round(100 - t, 1)] for a, _, t in ENGERMAN_SOKOLOFF_ALFAB],
            "bases_etarias": {
                str(a): f"{i}+ anos" for a, i, _ in ENGERMAN_SOKOLOFF_ALFAB
            },
            "fonte": {
                "nome": "Engerman & Sokoloff (2005), 'The Evolution of Suffrage Institutions in the "
                "New World', NBER WP 8512, Tabela 4 (lida na íntegra)",
                "url": "https://www.nber.org/system/files/working_papers/w8512/w8512.pdf",
            },
            "notas": "Bases etárias diferentes da série IBGE de 15+: não emendar com ela.",
            "origem": "literatura (lida)",
        }
    )
    if serie_tse:
        out.append(
            {
                "id": "analfabetos_no_eleitorado_tse",
                "rotulo": "Eleitores analfabetos (cadastro do TSE), % do eleitorado",
                "unidade": "% do eleitorado inscrito (sem exterior)",
                "pontos": [[a, v["pct_analfabeto"]] for a, v in serie_tse.items()],
                "fonte": {
                    "nome": "TSE, perfil do eleitorado (calculado neste projeto)"
                },
                "notas": "Autodeclarado no alistamento; não é a taxa de analfabetismo da população.",
                "origem": "calculado",
            }
        )
    return out


# ----------------------------------------------------------------------------------------
# Curadoria (narrativa) e validação
# ----------------------------------------------------------------------------------------


def carregar_curadoria(path: Path = CURADORIA) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def validar_curadoria(c: dict) -> list[str]:
    """Problemas de estrutura (lista vazia = ok). Exige fonte, URL e flag `verificado`."""
    erros = []
    for k in ("historia", "teorias", "limites", "lacunas"):
        if not c.get(k):
            erros.append(f"curadoria sem '{k}'")
    ids = set()
    for h in c.get("historia", []):
        for k in (
            "id",
            "periodo",
            "regra",
            "quem_votava",
            "eleitorado",
            "efeito",
            "interesses",
            "fontes",
        ):
            if k not in h:
                erros.append(f"historia {h.get('id')}: falta '{k}'")
        if h.get("id") in ids:
            erros.append(f"id repetido: {h.get('id')}")
        ids.add(h.get("id"))
        e = h.get("eleitorado", {})
        for k in ("valor", "pct_populacao", "fonte", "url", "verificado"):
            if k not in e:
                erros.append(f"historia {h.get('id')}: eleitorado sem '{k}'")
        if not isinstance(e.get("verificado"), bool):
            erros.append(f"historia {h.get('id')}: 'verificado' deve ser bool")
        i = h.get("interesses", {})
        if not isinstance(i.get("ganhou"), list) or not isinstance(
            i.get("perdeu"), list
        ):
            erros.append(f"historia {h.get('id')}: interesses sem ganhou/perdeu")
        if not h.get("fontes"):
            erros.append(f"historia {h.get('id')}: sem fontes")
    for t in c.get("teorias", []):
        for k in ("id", "autor", "ano", "ideia", "aplicacao_brasil", "fontes"):
            if k not in t:
                erros.append(f"teoria {t.get('id')}: falta '{k}'")
    return erros


def _subst(x, valores: dict):
    if isinstance(x, dict):
        return {k: _subst(v, valores) for k, v in x.items()}
    if isinstance(x, list):
        return [_subst(v, valores) for v in x]
    if isinstance(x, str) and x.startswith("@") and x[1:] in valores:
        return valores[x[1:]]
    return x


PUBLICADOS = [
    # (ano, campo, valor publicado, fonte, url, como foi lido)
    (
        2022,
        "total",
        156_454_011,
        "TSE, estatísticas do eleitorado (julho/2022)",
        "https://www.tse.jus.br/comunicacao/noticias/2022/Julho/brasil-tem-mais-de-156-milhoes-de-eleitoras-e-eleitores-aptos-a-votar-em-2022-601043",
        "resumo de busca da página (a página retornou 403 ao WebFetch)",
    ),
    (
        2022,
        "analfabeto",
        6_339_894,
        "TSE, idem (4,05% do eleitorado)",
        "https://www.tse.jus.br/comunicacao/noticias/2022/Julho/eleitoras-e-eleitores-com-ensino-medio-completo-formam-a-maioria-do-eleitorado-brasileiro",
        "resumo de busca da página (403 ao WebFetch)",
    ),
    (
        2022,
        "medio_completo",
        41_161_552,
        "TSE, idem (26,31%)",
        "https://www.tse.jus.br/comunicacao/noticias/2022/Julho/eleitoras-e-eleitores-com-ensino-medio-completo-formam-a-maioria-do-eleitorado-brasileiro",
        "resumo de busca da página (403 ao WebFetch)",
    ),
    (
        2022,
        "fund_incompleto",
        35_930_401,
        "TSE, idem (22,97%)",
        "https://www.tse.jus.br/comunicacao/noticias/2022/Julho/eleitoras-e-eleitores-com-ensino-medio-completo-formam-a-maioria-do-eleitorado-brasileiro",
        "resumo de busca da página (403 ao WebFetch)",
    ),
    (
        2024,
        "total",
        155_912_680,
        "TSE, eleitorado das eleições municipais de 2024 (via Correio Braziliense)",
        "https://www.correiobraziliense.com.br/politica/2024/12/amp/7008092-eleicoes-2024-relatorio-do-tse-apresenta-perfil-do-eleitorado.html",
        "resumo de busca",
    ),
    (
        2024,
        "medio_completo",
        42_154_620,
        "idem (27%)",
        "https://www.correiobraziliense.com.br/politica/2024/12/amp/7008092-eleicoes-2024-relatorio-do-tse-apresenta-perfil-do-eleitorado.html",
        "resumo de busca",
    ),
    (
        2024,
        "fund_incompleto",
        35_055_587,
        "idem (22,4%)",
        "https://www.correiobraziliense.com.br/politica/2024/12/amp/7008092-eleicoes-2024-relatorio-do-tse-apresenta-perfil-do-eleitorado.html",
        "resumo de busca",
    ),
    (
        2024,
        "medio_incompleto",
        27_716_058,
        "idem (17,78%)",
        "https://www.correiobraziliense.com.br/politica/2024/12/amp/7008092-eleicoes-2024-relatorio-do-tse-apresenta-perfil-do-eleitorado.html",
        "resumo de busca",
    ),
    (
        2024,
        "superior_completo",
        16_756_310,
        "idem (10,75%)",
        "https://www.correiobraziliense.com.br/politica/2024/12/amp/7008092-eleicoes-2024-relatorio-do-tse-apresenta-perfil-do-eleitorado.html",
        "resumo de busca",
    ),
    (
        2026,
        "total",
        158_745_502,
        "Wikipédia (página atualizada em 07/10/2026), citada em eleicoes_timeline.json",
        "https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2026",
        "secundária",
    ),
]


def validar_publicados(por_instr: dict[int, dict]) -> list[dict]:
    out = []
    for ano, campo, pub, fonte, url, como in PUBLICADOS:
        if ano not in por_instr:
            continue
        b = por_instr[ano]["nacional"]
        calc = b["total"] if campo == "total" else b["por_grau"][campo]
        out.append(
            {
                "ano": ano,
                "campo": campo,
                "publicado": pub,
                "calculado": calc,
                "dif": calc - pub,
                "fonte": fonte,
                "url": url,
                "como_foi_lido": como,
            }
        )
    return out


def _divergencias_nao_reproduzidas() -> list[str]:
    return [
        "Um resumo de busca atribuía ao TSE '6,9 milhões de analfabetos' e '15,4 milhões que "
        "leem e escrevem' em 2024; o CSV dá 5.572.448 e 10.272.196, e um segundo resumo "
        "(Jornal de Brasília) fala em 5,5 milhões em 2024. Os 6,9/15,4 milhões batem com o "
        "perfil de 2016 (6.981.111 e 15.480.806); tratado como erro do resumo, não do CSV.",
    ]


def validar_somas(
    dfs: dict[int, pd.DataFrame], por_instr: dict[int, dict], base: Path = RAW
) -> dict:
    out: dict = {"soma_ufs_igual_nacional": {}, "arquivo_consolidado_brasil": {}}
    for ano, d in por_instr.items():
        soma_uf = sum(b["total"] for b in d["por_uf"].values())
        soma_an = sum(b["por_grupo"]["analfabeto"] for b in d["por_uf"].values())
        nac = d["nacional"]
        out["soma_ufs_igual_nacional"][str(ano)] = {
            "ufs": len(d["por_uf"]),
            "soma_ufs_total": soma_uf,
            "nacional_total": nac["total"],
            "dif_total": soma_uf - nac["total"],
            "soma_ufs_analfabetos": soma_an,
            "nacional_analfabetos": nac["por_grupo"]["analfabeto"],
            "dif_analfabetos": soma_an - nac["por_grupo"]["analfabeto"],
            "soma_regioes_mais_exterior_total": sum(
                b["total"] for b in d["por_regiao"].values()
            )
            + d["por_uf"].get("ZZ", {"total": 0})["total"],
        }
    for ano in ANOS_PERFIL:
        c = total_consolidado(ano, base)
        if c is None or ano not in por_instr:
            continue
        nac = por_instr[ano]["nacional"]
        out["arquivo_consolidado_brasil"][str(ano)] = {
            **c,
            "dif_total_vs_soma_das_ufs": nac["total"] - c["total"],
            "dif_analfabetos_vs_soma_das_ufs": nac["por_grupo"]["analfabeto"]
            - c["analfabetos"],
        }
    return out


def validar_municipal(
    mun_ano: dict[int, dict],
    por_instr: dict[int, dict],
    uf_de: dict[str, str],
    miss: dict[int, list],
) -> dict:
    out = {}
    for ano, m in mun_ano.items():
        nac = por_instr[ano]["nacional_sem_exterior"]["total"]
        soma = sum(v["eleitores"] for v in m.values())
        ibges = set(uf_de)
        sem = sorted(ibges - set(m))
        zeros = sum(1 for v in m.values() if v["analfabeto"] == 0)
        out[str(ano)] = {
            "municipios_ibge": len(ibges),
            "com_dado": len(m),
            "sem_dado_null": len(sem),
            "sem_dado_exemplos": sem[:10],
            "municipios_tse_sem_correspondencia_ibge": miss.get(ano, []),
            "eleitores_nos_municipios_mapeados": soma,
            "eleitores_nacional_sem_exterior": nac,
            "eleitores_nao_mapeados": nac - soma,
            "municipios_com_zero_analfabetos_verdadeiro": zeros,
        }
    return out


def build(escrever: bool = True, n_caminhos: int = 2000, n_boot: int = 400) -> dict:
    """Constrói os dois JSON e devolve o dicionário principal."""
    cur = carregar_curadoria()
    erros = validar_curadoria(cur)
    if erros:
        raise ValueError("curadoria inválida: " + "; ".join(erros))
    qx = ler_tabua_ibge(RAW / "ibge_tabua_mortalidade_2024" / "ambos_os_sexos.xlsx")
    q = q_por_idade(qx)
    dfs = {a: agregar_perfil(a) for a in ANOS_PERFIL}

    por_instr: dict[int, dict] = {}
    for a in ANOS_MUN:
        d = eleitorado_por_instrucao(dfs[a])
        d["faixa_etaria_e_sexo"] = por_faixa_e_sexo(dfs[a])
        por_instr[a] = d
    serie_nac = {
        a: {
            k: v
            for k, v in _bloco_instrucao(dfs[a][dfs[a].uf != "ZZ"]).items()
            if k != "pct_grupo"
        }
        for a in ANOS_PERFIL
    }
    for a in ANOS_PERFIL:
        if a not in por_instr:
            por_instr[a] = {
                "nacional": _bloco_instrucao(dfs[a]),
                "nacional_sem_exterior": _bloco_instrucao(dfs[a][dfs[a].uf != "ZZ"]),
                "por_uf": {u: _bloco_instrucao(g) for u, g in dfs[a].groupby("uf")},
                "por_regiao": {
                    r: _bloco_instrucao(dfs[a][dfs[a].uf.map(UF_REGIAO) == r])
                    for r in REGIOES
                },
            }

    idx, uf_de = indice_ibge()
    terr = json.loads((WEB / "territorios.json").read_text(encoding="utf-8"))["linhas"]
    mun_ano: dict[int, dict] = {}
    miss: dict[int, list] = {}
    for a in ANOS_MUN:
        c2i, m = mapa_tse_ibge(dfs[a], idx)
        miss[a] = m
        mun_ano[a] = municipal(dfs[a], c2i)

    comp = {}
    for a in ANOS_COMPARECIMENTO:
        r = comparecimento_por_instrucao(a)
        if r:
            comp[str(a)] = r
    comp["2026"] = None

    cruz = cruzamentos(mun_ano, terr, uf_de, n_boot=n_boot)
    val = validacao_retrospectiva(dfs, q)
    val["regional_2022_para_2024_2026"] = validacao_regional(dfs, q)
    proj = projecao_2038(dfs, q, val, n=n_caminhos)

    pop_2022 = sum(v["pop_total"] for v in terr.values() if v.get("pop_total"))
    n22 = por_instr[2022]["nacional"]
    valores = {
        "total_2022": n22["total"],
        "pct_pop_2022": round(100 * n22["total"] / pop_2022, 2),
        "analf_2022": n22["por_grupo"]["analfabeto"],
        "pct_analf_2022": n22["pct_analfabeto"],
        "analf_2024": por_instr[2024]["nacional"]["por_grupo"]["analfabeto"],
        "pct_analf_2024": por_instr[2024]["nacional"]["pct_analfabeto"],
        "analf_2026": por_instr[2026]["nacional"]["por_grupo"]["analfabeto"],
        "pct_analf_2026": por_instr[2026]["nacional"]["pct_analfabeto"],
        "total_2026": por_instr[2026]["nacional"]["total"],
    }
    historia = _subst(cur["historia"], valores)

    validacao = {
        **validar_somas(dfs, por_instr),
        "totais_vs_publicados": validar_publicados(por_instr),
        "divergencias_nao_reproduzidas": _divergencias_nao_reproduzidas(),
        "municipal": validar_municipal(mun_ano, por_instr, uf_de, miss),
        "populacao_censo_2022_soma_municipios": pop_2022,
        "comparecimento_vs_perfil": _validar_comparecimento(comp, por_instr),
        "tabua_ibge": {
            "q0": round(float(qx[0]), 6),
            "q60": round(float(qx[60]), 6),
            "q90_derivado_de_e90": round(float(qx[90]), 6),
            "anos_de_idade": len(qx),
        },
    }

    fontes = [f for f in (_fonte(f"perfil_eleitorado_{a}") for a in ANOS_PERFIL) if f]
    fontes += [
        f
        for f in (
            _fonte(f"perfil_comparecimento_abstencao_{a}") for a in ANOS_COMPARECIMENTO
        )
        if f
    ]
    tp = _prov("ibge_tabua_mortalidade_2024")
    if tp:
        fontes.append(
            {
                "nome": "IBGE, Tábua completa de mortalidade 2024 (ambos os sexos)",
                "url": tp["fonte"],
                "baixado_em": tp["baixado_em"],
                "last_modified": tp.get("last_modified"),
                "sha256": tp["sha256"],
            }
        )
    for nome, p, nota in (
        (
            "territorios.json (Censo 2022: % pretos e pardos, % indígena)",
            WEB / "territorios.json",
            "arquivo derivado deste repositório; fontes primárias em territorios.json/meta",
        ),
        (
            "series_historicas.json (analfabetismo 15+)",
            WEB / "series_historicas.json",
            "arquivo derivado deste repositório; fontes primárias em cada série",
        ),
    ):
        fontes.append(_fonte_arquivo(nome, p, None, nota))
    for pid in ("pres_2022_t1", "pres_2022_t2", "pres_2026_t1"):
        f = WEB / "elections" / f"{pid}.json"
        if f.exists():
            m = json.loads(f.read_text(encoding="utf-8"))["meta"]
            fontes.append(
                {
                    "nome": f"TSE, votação por seção ({pid})",
                    "url": m["fonte"],
                    "baixado_em": m["baixado_em"],
                    "sha256": m["sha256"],
                }
            )

    lacunas = list(cur["lacunas"]) + [
        "perfil_comparecimento_abstencao de 2026 ainda não existe no CDN do TSE (HTTP 404 em "
        "07/10/2026): comparecimento por instrução só para 2022 e 2024.",
        "Eleitorado de 2026 é o cadastro de julho/2026; a apuração de 2026 usada nos cruzamentos "
        "é preliminar.",
    ]
    for a, m in miss.items():
        if m:
            lacunas.append(
                f"{a}: {len(m)} município(s) do perfil do TSE sem correspondência no IBGE "
                f"(entram no total e na UF, ficam fora do mapa municipal): "
                + "; ".join(f"{x['nome']}/{x['uf']}" for x in m)
            )

    res = {
        "meta": {
            "gerado_em": datetime.now(UTC).isoformat(timespec="seconds"),
            "aviso": (
                "Eleitor analfabeto = grau 'ANALFABETO' do cadastro do TSE (autodeclarado no "
                "alistamento, pode estar desatualizado); não é a taxa de analfabetismo da "
                "população. 'Nacional' inclui o exterior (UF ZZ) em 2022 e 2026, que não vota no "
                "município; as séries e a projeção usam 'nacional sem exterior'. A seção de "
                "projeção é suposição rotulada, não previsão. Cruzamentos são ecológicos."
            ),
            "fontes": fontes,
            "lacunas": lacunas,
            "mapa_municipal": "analfabetos_municipal.json: {ibge: {ano: {...} | null}}; null = sem "
            "dado (município ausente do perfil), nunca zero.",
            "codigo_de_grau": GRAUS,
        },
        "historia": historia,
        "serie_analfabetismo": serie_analfabetismo(serie_tse=serie_nac),
        "serie_eleitorado_por_instrucao_nacional_sem_exterior": {
            str(a): v for a, v in serie_nac.items()
        },
        "eleitorado_por_instrucao": {str(a): por_instr[a] for a in ANOS_MUN},
        "comparecimento_por_instrucao": {
            "ressalva": (
                "O voto do analfabeto é facultativo (CF art. 14 §1º II a), assim como o de 16-17 "
                "e o de 70+. Menor comparecimento deles não é 'falta' e mistura escolha, "
                "dificuldade de acesso e cadastro desatualizado (inscritos que morreram ou "
                "mudaram). Comparar analfabetos com alfabetizados exige olhar a mesma faixa "
                "etária: os analfabetos são muito mais velhos."
            ),
            **comp,
        },
        "cruzamentos": {
            "metodo": (
                "Unidade: município (IBGE), 5.570. Variável explicativa: % de eleitores "
                "analfabetos no perfil do TSE do mesmo ano da eleição. Resposta: % dos votos "
                "válidos em Lula (13) e em Bolsonaro/Flávio (22) e % de comparecimento. Modelo: "
                "mínimos quadrados ponderados pelos votos válidos com efeito fixo de UF "
                "(variáveis centradas na UF); versão multivariada soma % de pretos e pardos e "
                "% indígena do Censo 2022 (territorios.json). Coeficiente = pontos percentuais "
                "do voto por +1 ponto percentual de analfabetos, dentro da UF. IC 95% por "
                f"bootstrap ({n_boot} reamostras) de municípios e de UFs. Inclinação por UF "
                "(>=10 municípios) com IC por bootstrap."
            ),
            "resultados": cruz,
            "ressalvas": RESSALVAS_CRUZAMENTO,
        },
        "projecao_2038": proj,
        "teorias": cur["teorias"],
        "validacao": validacao,
        "limites": cur["limites"],
    }
    mun_json = _municipal_json(mun_ano, uf_de)
    if escrever:
        SAIDA.parent.mkdir(parents=True, exist_ok=True)
        SAIDA.write_text(
            json.dumps(
                _arred(res, 4), ensure_ascii=False, indent=1, default=_json_default
            ),
            encoding="utf-8",
        )
        SAIDA_MUN.write_text(
            json.dumps(mun_json, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
    return res


def _json_default(o):
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, (np.floating,)):
        return float(o)
    if isinstance(o, np.bool_):
        return bool(o)
    raise TypeError(type(o))


def _municipal_json(mun_ano: dict[int, dict], uf_de: dict[str, str]) -> dict:
    """{ibge: {"uf":..., "2022": {...}|null, ...}}; município sem dado no ano = null (não 0)."""
    out = {}
    for ibge in sorted(uf_de):
        out[ibge] = {"uf": uf_de[ibge]} | {
            str(a): mun_ano[a].get(ibge) for a in sorted(mun_ano)
        }
    return out


def _validar_comparecimento(comp: dict, por_instr: dict[int, dict]) -> dict:
    out = {}
    for a, r in comp.items():
        if not r:
            continue
        ano = int(a)
        for t, d in r["turnos"].items():
            out[f"{a}_turno_{t}"] = {
                "aptos_no_arquivo_de_comparecimento": d["total"]["aptos"],
                "eleitores_no_perfil_sem_exterior": por_instr[ano][
                    "nacional_sem_exterior"
                ]["total"],
                "dif": d["total"]["aptos"]
                - por_instr[ano]["nacional_sem_exterior"]["total"],
            }
    return out

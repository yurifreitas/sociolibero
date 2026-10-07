"""História indígena e eleições: candidaturas autodeclaradas (TSE), municípios e seções em TI.

Entradas (todas não confiáveis, lidas só por DuckDB/JSON, nunca executadas):
- `data/raw/consulta_cand_AAAA/` (TSE; cor/raça só existe a partir de 2014);
- `web/public/data/territorios.json` e `elections/*.json` (já agregados pelo projeto);
- `data/raw/eleitorado_local_votacao_2022`, `detalhe_votacao_secao_2022`, `votacao_secao_2022_BR`
  e `funai_tis_poligonais` (seções em terras indígenas).

A narrativa (`indigenas_curadoria.json`) é escrita à mão a partir de fontes abertas lidas na
pesquisa; este módulo apenas a valida e a junta aos números calculados. Saída:
`web/public/data/indigenas_eleicoes.json`.
"""

from __future__ import annotations

import json
import unicodedata
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pandas as pd

RAW = Path("data/raw")
TSE = "https://cdn.tse.jus.br/estatistica/sead/odsele"
SAIDA = Path("web/public/data/indigenas_eleicoes.json")
CURADORIA = Path(__file__).with_name("indigenas_curadoria.json")
ANOS = (2014, 2018, 2022, 2026)
ANO_MUNICIPAL = 2024
LIMIARES_PCT = (5.0, 10.0, 20.0)
SUPLENTES_SENADO = ("1º SUPLENTE", "2º SUPLENTE")

UF_IBGE = {
    "11": "RO",
    "12": "AC",
    "13": "AM",
    "14": "RR",
    "15": "PA",
    "16": "AP",
    "17": "TO",
    "21": "MA",
    "22": "PI",
    "23": "CE",
    "24": "RN",
    "25": "PB",
    "26": "PE",
    "27": "AL",
    "28": "SE",
    "29": "BA",
    "31": "MG",
    "32": "ES",
    "33": "RJ",
    "35": "SP",
    "41": "PR",
    "42": "SC",
    "43": "RS",
    "50": "MS",
    "51": "MT",
    "52": "GO",
    "53": "DF",
}

# Espectro: classificação CONVENCIONAL e simplificada deste projeto (não é a de um autor
# específico); partidos fora da lista entram em "sem_classificacao". É agregada de propósito.
ESPECTRO = {
    "esquerda": {
        "PT",
        "PSOL",
        "PC DO B",
        "PCDOB",
        "PDT",
        "PSB",
        "PV",
        "PCB",
        "PSTU",
        "PCO",
        "UP",
        "REDE",
        "PPL",
        "PMN",
    },
    "centro": {
        "MDB",
        "PMDB",
        "PSDB",
        "CIDADANIA",
        "PPS",
        "AVANTE",
        "PT DO B",
        "SOLIDARIEDADE",
        "SD",
        "PODE",
        "PODEMOS",
        "PTN",
        "PROS",
        "PMB",
        "PSD",
        "PHS",
        "PRP",
    },
    "direita": {
        "PP",
        "PL",
        "PR",
        "REPUBLICANOS",
        "PRB",
        "UNIÃO",
        "UNIAO",
        "DEM",
        "PTB",
        "PSL",
        "NOVO",
        "PRTB",
        "DC",
        "PATRIOTA",
        "PATRI",
        "PEN",
        "PRD",
        "PSC",
        "AGIR",
        "PTC",
        "MOBILIZA",
        "MISSÃO",
        "MISSAO",
        "PODEMOS ",
    },
}


def _sem_acento(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s or "") if not unicodedata.combining(c)
    ).upper()


def espectro_partido(sigla: str) -> str:
    s = (sigla or "").strip().upper()
    for k, v in ESPECTRO.items():
        if s in v:
            return k
    return "sem_classificacao"


def categoria_cor(ds: str) -> str:
    """Normaliza DS_COR_RACA (BRANCA, PARDA, PRETA, AMARELA, INDÍGENA, sem_informacao)."""
    k = _sem_acento(ds)
    if k in ("BRANCA", "PARDA", "PRETA", "AMARELA", "INDIGENA"):
        return k.lower()
    return "sem_informacao"


def _arquivos_cand(pasta: Path, ano: int) -> list[str]:
    br = pasta / f"consulta_cand_{ano}_BRASIL.csv"
    if br.exists():
        return [str(br)]
    return sorted(str(p) for p in pasta.glob(f"consulta_cand_{ano}_*.csv"))


def ler_candidaturas(ano: int, base: Path = RAW) -> pd.DataFrame:
    """Uma linha por candidatura (SQ_CANDIDATO; se houve 2º turno, vale a linha do 2º)."""
    import duckdb

    arqs = _arquivos_cand(base / f"consulta_cand_{ano}", ano)
    if not arqs:
        raise FileNotFoundError(f"sem consulta_cand_{ano} em {base}")
    q = (
        "select SQ_CANDIDATO sq, SG_UF uf, DS_CARGO cargo, SG_PARTIDO partido, "
        "DS_COR_RACA cor, DS_SITUACAO_CANDIDATURA sit_cand, DS_SIT_TOT_TURNO sit_tot, "
        "try_cast(NR_TURNO as int) turno "
        f"from read_csv({arqs!r}, delim=';', header=true, encoding='latin-1', "
        "all_varchar=true, union_by_name=true)"
    )
    df = duckdb.connect().sql(q).df()
    df = df.sort_values(["sq", "turno"]).drop_duplicates("sq", keep="last")
    df["cat"] = df["cor"].map(categoria_cor)
    k = df["sit_tot"].map(_sem_acento)
    df["eleito"] = k.str.startswith("ELEITO") & ~df["cargo"].isin(SUPLENTES_SENADO)
    df["suplente"] = k.eq("SUPLENTE")
    df["indigena"] = df["cat"].eq("indigena")
    df["espectro"] = df["partido"].map(espectro_partido)
    return df.reset_index(drop=True)


CARGOS_PUBLICOS = (
    "PRESIDENTE",
    "VICE-PRESIDENTE",
    "SENADOR",
    "GOVERNADOR",
    "VICE-GOVERNADOR",
    "DEPUTADO FEDERAL",
)


def eleitos_figuras(ano: int, base: Path = RAW) -> list[dict]:
    """Eleitos autodeclarados indígenas só em cargos nacionais/estaduais majoritários e Câmara
    Federal (figuras públicas). Nunca lista candidatos não eleitos nem vereadores/estaduais."""
    import duckdb

    arqs = _arquivos_cand(base / f"consulta_cand_{ano}", ano)
    q = (
        "select DS_CARGO cargo, SG_UF uf, SG_PARTIDO partido, NM_URNA_CANDIDATO nome, "
        "DS_COR_RACA cor, DS_SIT_TOT_TURNO sit, try_cast(NR_TURNO as int) turno, SQ_CANDIDATO sq "
        f"from read_csv({arqs!r}, delim=';', header=true, encoding='latin-1', all_varchar=true, "
        "union_by_name=true)"
    )
    df = (
        duckdb.connect()
        .sql(q)
        .df()
        .sort_values(["sq", "turno"])
        .drop_duplicates("sq", keep="last")
    )
    ok = (
        df["cor"].map(categoria_cor).eq("indigena")
        & df["sit"].map(_sem_acento).str.startswith("ELEITO")
        & df["cargo"].isin(CARGOS_PUBLICOS)
    )
    return [
        {
            "nome": r.nome.title(),
            "cargo": r.cargo.title(),
            "ano": ano,
            "uf": r.uf,
            "partido": r.partido,
        }
        for r in df[ok].sort_values(["cargo", "uf"]).itertuples()
    ]


def _pct(a: float, b: float) -> float | None:
    return round(100 * a / b, 3) if b else None


def _bloco(d: pd.DataFrame) -> dict:
    n, i = len(d), int(d["indigena"].sum())
    ei = int((d["eleito"] & d["indigena"]).sum())
    return {
        "candidaturas": n,
        "indigenas": i,
        "pct_indigenas": _pct(i, n),
        "eleitos": int(d["eleito"].sum()),
        "eleitos_indigenas": ei,
        "suplentes_indigenas": int((d["suplente"] & d["indigena"]).sum()),
    }


def resumo_ano(df: pd.DataFrame) -> dict:
    """Agregados de um ano (sem nomes de pessoas)."""
    tot = _bloco(df)
    por_cargo = {c: _bloco(g) for c, g in sorted(df.groupby("cargo"))}
    por_uf = {u: _bloco(g) for u, g in sorted(df.groupby("uf"))}
    por_cor = {}
    for c, g in sorted(df.groupby("cat")):
        n, e = len(g), int(g["eleito"].sum())
        por_cor[c] = {
            "candidaturas": n,
            "eleitos": e,
            "razao_eleitos_candidaturas": _pct(e, n),
        }
    fed = df[df["cargo"].isin(["DEPUTADO FEDERAL"])]
    por_cor_fed = {}
    for c, g in sorted(fed.groupby("cat")):
        n, e = len(g), int(g["eleito"].sum())
        por_cor_fed[c] = {
            "candidaturas": n,
            "eleitos": e,
            "razao_eleitos_candidaturas": _pct(e, n),
        }
    ind = df[df["indigena"]]
    por_partido = {
        p: {"indigenas": len(g), "eleitos_indigenas": int(g["eleito"].sum())}
        for p, g in sorted(ind.groupby("partido"), key=lambda kv: -len(kv[1]))
    }
    por_esp = {}
    for e, g in df.groupby("espectro"):
        gi = g[g["indigena"]]
        por_esp[e] = {
            "candidaturas": len(g),
            "indigenas": len(gi),
            "pct_indigenas": _pct(len(gi), len(g)),
            "eleitos_indigenas": int(gi["eleito"].sum()),
        }
    sit = {
        str(k): int(v) for k, v in ind["sit_cand"].value_counts().sort_index().items()
    }
    sem_cls = sorted(set(df.loc[df["espectro"].eq("sem_classificacao"), "partido"]))
    return {
        "total_candidaturas": tot["candidaturas"],
        "indigenas": tot["indigenas"],
        "pct": tot["pct_indigenas"],
        "eleitos": tot["eleitos_indigenas"],
        "eleitos_total": tot["eleitos"],
        "pct_dos_eleitos": _pct(tot["eleitos_indigenas"], tot["eleitos"]),
        "suplentes_indigenas": tot["suplentes_indigenas"],
        "razao_eleitos_candidaturas_indigenas": _pct(
            tot["eleitos_indigenas"], tot["indigenas"]
        ),
        "razao_eleitos_candidaturas_demais": _pct(
            tot["eleitos"] - tot["eleitos_indigenas"],
            tot["candidaturas"] - tot["indigenas"],
        ),
        "por_cargo": por_cargo,
        "por_uf": por_uf,
        "por_cor_raca": por_cor,
        "por_cor_raca_deputado_federal": por_cor_fed,
        "por_partido_indigenas": por_partido,
        "por_espectro": por_esp,
        "situacao_candidatura_indigenas": sit,
        "partidos_sem_classificacao": sem_cls,
    }


# ----------------------------------------------------------------------------------------
# Censo 2022 e eleitorado
# ----------------------------------------------------------------------------------------


def censo(terr: dict) -> dict:
    L = terr["linhas"]
    tot = sum(v["pop_total"] for v in L.values())
    cr = sum(v["pop_indigena_cor_raca"] or 0 for v in L.values())
    amp = sum(v["pop_indigena"] or 0 for v in L.values())
    por_uf: dict[str, dict] = {}
    for cod, v in L.items():
        u = UF_IBGE[cod[:2]]
        d = por_uf.setdefault(u, {"pop_total": 0, "cor_raca": 0, "ampliado": 0})
        d["pop_total"] += v["pop_total"]
        d["cor_raca"] += v["pop_indigena_cor_raca"] or 0
        d["ampliado"] += v["pop_indigena"] or 0
    for d in por_uf.values():
        d["pct_cor_raca"] = _pct(d["cor_raca"], d["pop_total"])
        d["pct_ampliado"] = _pct(d["ampliado"], d["pop_total"])
    return {
        "pop_total": tot,
        "indigena_cor_raca": cr,
        "indigena_ampliado": amp,
        "pct_cor_raca": _pct(cr, tot),
        "pct_ampliado": _pct(amp, tot),
        "por_uf": por_uf,
    }


def eleitorado_cor_raca(ano: int = 2022, base: Path = RAW) -> dict | None:
    """Perfil do eleitorado por cor/raça (TSE). Cobertura parcial: tudo que não é declarado
    aparece como NÃO INFORMADO."""
    import duckdb

    pasta = base / f"perfil_eleitorado_{ano}"
    arqs = sorted(
        str(p)
        for p in pasta.glob(f"perfil_eleitorado_{ano}_*.csv")
        if not p.name.endswith(("_BRASIL.csv", "_ZZ.csv"))
    )
    if not arqs:
        return None
    q = (
        "select DS_RACA_COR cor, sum(try_cast(QT_ELEITORES as bigint)) n "
        f"from read_csv({arqs!r}, delim=';', header=true, encoding='latin-1', all_varchar=true, "
        "union_by_name=true) group by 1"
    )
    rows = duckdb.connect().sql(q).fetchall()
    cat: dict[str, int] = {}
    for cor, n in rows:
        k = categoria_cor(cor)
        cat[k] = cat.get(k, 0) + int(n)
    tot = sum(cat.values())
    ni = cat.get("sem_informacao", 0)
    return {
        "ano": ano,
        "total_eleitores": tot,
        "por_cat": cat,
        "pct_indigena_do_total": _pct(cat.get("indigena", 0), tot),
        "pct_sem_informacao": _pct(ni, tot),
        "pct_indigena_dos_declarados": _pct(cat.get("indigena", 0), tot - ni),
    }


# ----------------------------------------------------------------------------------------
# Municípios com maior % indígena × demais, dentro da UF
# ----------------------------------------------------------------------------------------


def _agrega(linhas: list[dict], cands: list[str]) -> dict[str, float]:
    ap = sum(m["aptos"] for m in linhas)
    cp = sum(m["comparecimento"] for m in linhas)
    va = sum(m["validos"] for m in linhas)
    out = {
        "aptos": ap,
        "comparecimento_pct": 100 * cp / ap if ap else float("nan"),
        "brancos_nulos_pct": 100 * sum(m["brancos"] + m["nulos"] for m in linhas) / cp
        if cp
        else float("nan"),
    }
    for c in cands:
        out[f"voto_{c}_pct"] = (
            100 * sum(m["votos"].get(c, 0) for m in linhas) / va if va else float("nan")
        )
    return out


def comparar_grupos(
    munis: list[dict], cands: list[str], limiar: float, n_boot: int = 400, seed: int = 7
) -> dict:
    """munis: [{uf, pct_ind, aptos, comparecimento, validos, brancos, nulos, votos{cand: n}}].

    Alto = pct_ind >= limiar; baixo = demais. Diferença (alto − baixo) calculada dentro de cada
    UF e combinada com peso = aptos do grupo alto na UF. IC 95% por bootstrap de municípios
    estratificado por UF×grupo (ignora correlação espacial: indicativo, não inferencial)."""
    por_uf: dict[str, dict[str, list]] = {}
    for m in munis:
        g = "alto" if m["pct_ind"] >= limiar else "baixo"
        por_uf.setdefault(m["uf"], {"alto": [], "baixo": []})[g].append(m)
    ufs = {u: g for u, g in por_uf.items() if g["alto"] and g["baixo"]}
    chaves = ["comparecimento_pct", "brancos_nulos_pct"] + [
        f"voto_{c}_pct" for c in cands
    ]

    def combinar(sel: dict[str, dict[str, list]]) -> tuple[dict, dict]:
        num = dict.fromkeys(chaves, 0.0)
        peso = 0.0
        alto_l, baixo_l = [], []
        for g in sel.values():
            a, b = _agrega(g["alto"], cands), _agrega(g["baixo"], cands)
            w = a["aptos"]
            peso += w
            for k in chaves:
                num[k] += w * (a[k] - b[k])
            alto_l += g["alto"]
            baixo_l += g["baixo"]
        dif = {k: num[k] / peso if peso else float("nan") for k in chaves}
        return dif, {"alto": _agrega(alto_l, cands), "baixo": _agrega(baixo_l, cands)}

    if not ufs:
        return {"limiar_pct_indigena": limiar, "ufs": [], "municipios_alto": 0}
    dif, niveis = combinar(ufs)
    rng = np.random.default_rng(seed)
    boots = {k: [] for k in chaves}
    for _ in range(n_boot):
        amostra = {}
        for u, g in ufs.items():
            amostra[u] = {
                gg: [g[gg][i] for i in rng.integers(0, len(g[gg]), len(g[gg]))]
                for gg in ("alto", "baixo")
            }
        d, _ = combinar(amostra)
        for k in chaves:
            boots[k].append(d[k])
    ic = {
        k: [
            round(float(np.nanpercentile(v, 2.5)), 2),
            round(float(np.nanpercentile(v, 97.5)), 2),
        ]
        for k, v in boots.items()
    }
    return {
        "limiar_pct_indigena": limiar,
        "ufs": sorted(ufs),
        "municipios_alto": sum(len(g["alto"]) for g in ufs.values()),
        "municipios_baixo": sum(len(g["baixo"]) for g in ufs.values()),
        "aptos_alto": int(niveis["alto"]["aptos"]),
        "nivel_alto": {
            k: round(v, 2) for k, v in niveis["alto"].items() if k != "aptos"
        },
        "nivel_baixo": {
            k: round(v, 2) for k, v in niveis["baixo"].items() if k != "aptos"
        },
        "diferenca_pp_dentro_da_uf": {k: round(v, 2) for k, v in dif.items()},
        "ic95_bootstrap_pp": ic,
    }


def municipios_indigenas(
    terr: dict, eleicoes: dict[str, dict], n_boot: int = 400
) -> dict:
    res = {}
    for pid, e in eleicoes.items():
        votos_nac: dict[str, int] = {}
        for m in e["linhas"].values():
            for c, v in m["votos"].items():
                votos_nac[c] = votos_nac.get(c, 0) + v
        top = [c for c, _ in sorted(votos_nac.items(), key=lambda kv: -kv[1])[:2]]
        nomes = {str(c["numero"]): c for c in e["meta"].get("candidatos", [])}
        munis = []
        for cod, m in e["linhas"].items():
            t = terr["linhas"].get(cod)
            if not t or t.get("pct_indigena") is None or not m.get("aptos"):
                continue
            munis.append(
                {
                    "uf": UF_IBGE[cod[:2]],
                    "pct_ind": t["pct_indigena"],
                    "aptos": m["aptos"],
                    "comparecimento": m["comparecimento"],
                    "validos": m["validos"],
                    "brancos": m["brancos"],
                    "nulos": m["nulos"],
                    "votos": {str(c): v for c, v in m["votos"].items()},
                }
            )
        res[pid] = {
            "rotulo": e["meta"]["rotulo"],
            "status": e["meta"].get("status"),
            "candidatos_analisados": [
                {
                    "numero": int(c),
                    "nome": nomes.get(c, {}).get("nome"),
                    "partido": nomes.get(c, {}).get("partido"),
                }
                for c in top
            ],
            "municipios_com_dados": len(munis),
            "comparacoes": [
                comparar_grupos(munis, top, lim, n_boot=n_boot) for lim in LIMIARES_PCT
            ],
        }
    return res


# ----------------------------------------------------------------------------------------
# Seções eleitorais dentro de terras indígenas (coordenadas dos locais de votação × FUNAI)
# ----------------------------------------------------------------------------------------


def _num(s) -> float | None:
    try:
        v = float(str(s).replace("+", ""))
    except ValueError:
        return None
    return v


def locais_em_ti(locais: pd.DataFrame, tis: list[dict]) -> pd.DataFrame:
    """locais: colunas lat, lon (float). Marca `ti` (nome) para pontos dentro de polígono FUNAI.
    tis: [{"nome", "geom"(shapely)}]."""
    from shapely import STRtree, points

    ok = locais["lat"].between(-34, 6) & locais["lon"].between(-74, -34)
    out = locais.copy()
    out["coord_ok"] = ok
    out["ti"] = None
    if not ok.any() or not tis:
        return out
    idx = np.flatnonzero(ok.to_numpy())
    pts = points(out["lon"].to_numpy()[idx], out["lat"].to_numpy()[idx])
    tree = STRtree([t["geom"] for t in tis])
    pi, gi = tree.query(pts, predicate="intersects")
    tis_col = np.array(out["ti"].tolist(), dtype=object)
    for p, g in zip(pi, gi, strict=True):
        if tis_col[idx[p]] is None:
            tis_col[idx[p]] = tis[g]["nome"]
    out["ti"] = tis_col
    return out


def carregar_tis(base: Path = RAW) -> list[dict]:
    from shapely import make_valid
    from shapely.geometry import shape

    d = json.loads(
        (base / "funai_tis_poligonais" / "tis_poligonais.json").read_text(
            encoding="utf-8"
        )
    )
    out = []
    for f in d["features"]:
        if not f.get("geometry"):
            continue
        out.append(
            {
                "nome": f["properties"].get("terrai_nome"),
                "fase": f["properties"].get("fase_ti"),
                "geom": make_valid(shape(f["geometry"])),
            }
        )
    return out


def secoes_em_ti(base: Path = RAW, ano: int = 2022) -> dict:
    import duckdb

    arq = (
        base / f"eleitorado_local_votacao_{ano}" / f"eleitorado_local_votacao_{ano}.csv"
    )
    if not arq.exists():
        return {"disponivel": False, "motivo": f"{arq} ausente"}
    con = duckdb.connect()
    sec = con.sql(
        "select SG_UF uf, try_cast(CD_MUNICIPIO as int) cdm, NM_MUNICIPIO mun, "
        "try_cast(NR_ZONA as int) zona, try_cast(NR_SECAO as int) secao, "
        "NR_LOCAL_VOTACAO loc, NM_LOCAL_VOTACAO nome_local, "
        "try_cast(NR_LATITUDE as double) lat, try_cast(NR_LONGITUDE as double) lon, "
        "try_cast(QT_ELEITOR_SECAO as int) eleitores, DS_TIPO_SECAO_AGREGADA tipo "
        f"from read_csv('{arq.as_posix()}', delim=';', header=true, encoding='latin-1', "
        "all_varchar=true) where NR_TURNO = '1'"
    ).df()
    tis = carregar_tis(base)
    sec = locais_em_ti(sec, tis)
    sec["em_ti"] = sec["ti"].notna()
    loc_unico = sec.drop_duplicates(["uf", "cdm", "zona", "loc"])
    nome_u = (
        loc_unico["nome_local"]
        .fillna("")
        .map(_sem_acento)
        .str.contains("INDIGENA|ALDEIA|ALDEA")
    )
    valid = {
        "secoes_total": len(sec),
        "secoes_com_coordenada_valida": int(sec["coord_ok"].sum()),
        "pct_secoes_com_coordenada_valida": _pct(int(sec["coord_ok"].sum()), len(sec)),
        "locais_total": len(loc_unico),
        "locais_nome_indigena_ou_aldeia": int(nome_u.sum()),
        "locais_nome_indigena_ou_aldeia_dentro_de_TI": int(
            (nome_u & loc_unico["em_ti"]).sum()
        ),
        "locais_nome_indigena_ou_aldeia_com_coordenada_valida": int(
            (nome_u & loc_unico["coord_ok"]).sum()
        ),
        "locais_dentro_de_TI_sem_nome_indigena": int(
            (~nome_u & loc_unico["em_ti"]).sum()
        ),
    }
    ti = sec[sec["em_ti"]]
    por_uf = {
        u: {
            "secoes": len(g),
            "locais": g.drop_duplicates(["cdm", "zona", "loc"]).shape[0],
            "eleitores": int(g["eleitores"].fillna(0).sum()),
        }
        for u, g in sorted(ti.groupby("uf"))
    }
    por_mun = (
        ti.groupby(["uf", "mun"])
        .agg(secoes=("secao", "size"), eleitores=("eleitores", "sum"))
        .reset_index()
        .sort_values("eleitores", ascending=False)
        .head(15)
    )
    resultado = {
        "disponivel": True,
        "ano": ano,
        "secoes_em_ti": len(ti),
        "locais_em_ti": int(ti.drop_duplicates(["uf", "cdm", "zona", "loc"]).shape[0]),
        "eleitores_em_secoes_em_ti": int(ti["eleitores"].fillna(0).sum()),
        "eleitores_total": int(sec["eleitores"].fillna(0).sum()),
        "pct_eleitores_em_secoes_em_ti": _pct(
            int(ti["eleitores"].fillna(0).sum()), int(sec["eleitores"].fillna(0).sum())
        ),
        "municipios_com_secao_em_ti": int(ti[["uf", "cdm"]].drop_duplicates().shape[0]),
        "tis_com_secao": int(ti["ti"].nunique()),
        "por_uf": por_uf,
        "maiores_municipios": [
            {
                "uf": r.uf,
                "municipio": r.mun,
                "secoes": int(r.secoes),
                "eleitores": int(r.eleitores),
            }
            for r in por_mun.itertuples()
        ],
        "validacao_geocodificacao": valid,
    }
    resultado["comportamento"] = _comportamento_ti(con, base, ano, sec)
    return resultado


def _comportamento_ti(con, base: Path, ano: int, sec: pd.DataFrame) -> dict:
    """Comparecimento e voto presidencial em seções dentro de TI × demais seções dos MESMOS
    municípios (os que têm ≥ 1 seção em TI)."""
    det = base / f"detalhe_votacao_secao_{ano}" / f"detalhe_votacao_secao_{ano}_BR.csv"
    vot = base / f"votacao_secao_{ano}_BR" / f"votacao_secao_{ano}_BR.csv"
    if not det.exists() or not vot.exists():
        return {"disponivel": False}
    chave = sec[["uf", "cdm", "zona", "secao", "em_ti"]].drop_duplicates(
        ["uf", "cdm", "zona", "secao"]
    )
    con.register("chave", chave)
    muni_ti = sec.loc[sec["em_ti"], ["uf", "cdm"]].drop_duplicates()
    con.register("muni_ti", muni_ti)
    out = {"disponivel": True, "turnos": {}}
    for turno in (1, 2):
        d = con.sql(
            "select c.em_ti, sum(try_cast(QT_APTOS as bigint)) aptos, "
            "sum(try_cast(QT_COMPARECIMENTO as bigint)) comp, count(*) secoes "
            f"from read_csv('{det.as_posix()}', delim=';', header=true, encoding='latin-1', "
            "all_varchar=true) d "
            "join chave c on c.uf=d.SG_UF and c.cdm=try_cast(d.CD_MUNICIPIO as int) "
            "and c.zona=try_cast(d.NR_ZONA as int) and c.secao=try_cast(d.NR_SECAO as int) "
            "join muni_ti m on m.uf=c.uf and m.cdm=c.cdm "
            f"where d.NR_TURNO='{turno}' and d.DS_CARGO='Presidente' group by 1"
        ).df()
        v = con.sql(
            "select c.em_ti, v.NR_VOTAVEL num, sum(try_cast(v.QT_VOTOS as bigint)) votos "
            f"from read_csv('{vot.as_posix()}', delim=';', header=true, encoding='latin-1', "
            "all_varchar=true) v "
            "join chave c on c.uf=v.SG_UF and c.cdm=try_cast(v.CD_MUNICIPIO as int) "
            "and c.zona=try_cast(v.NR_ZONA as int) and c.secao=try_cast(v.NR_SECAO as int) "
            "join muni_ti m on m.uf=c.uf and m.cdm=c.cdm "
            f"where v.NR_TURNO='{turno}' and v.DS_CARGO='PRESIDENTE' group by 1,2"
        ).df()
        grupos = {}
        for em_ti, g in d.groupby("em_ti"):
            vv = v[v["em_ti"] == em_ti]
            validos = vv[~vv["num"].isin(["95", "96"])]["votos"].sum()
            tops = vv[~vv["num"].isin(["95", "96"])].sort_values(
                "votos", ascending=False
            )
            grupos["em_ti" if em_ti else "demais_secoes_dos_mesmos_municipios"] = {
                "secoes_com_dado": int(g["secoes"].iloc[0]),
                "aptos": int(g["aptos"].iloc[0]),
                "comparecimento_pct": _pct(
                    int(g["comp"].iloc[0]), int(g["aptos"].iloc[0])
                ),
                "votos_validos": int(validos),
                "voto_pct": {
                    r.num: _pct(int(r.votos), int(validos))
                    for r in tops.head(3).itertuples()
                },
            }
        out["turnos"][str(turno)] = grupos
    return out


# ----------------------------------------------------------------------------------------
# Orquestração
# ----------------------------------------------------------------------------------------


def _prov(nome: str, base: Path = RAW) -> dict | None:
    p = base / nome / "PROVENIENCIA.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def validar_curadoria(c: dict, historia_ids: set[str]) -> list[str]:
    erros = []
    ids = set()
    for e in c["linha_do_tempo"]:
        for k in (
            "id",
            "data",
            "titulo",
            "resumo",
            "passos_de_construcao",
            "controversia",
            "fontes",
        ):
            if k not in e:
                erros.append(f"{e.get('id')}: falta {k}")
        if e["id"] in ids:
            erros.append(f"id duplicado {e['id']}")
        ids.add(e["id"])
        for h in e.get("historia_ids", []):
            if h not in historia_ids:
                erros.append(f"{e['id']}: historia_id inexistente {h}")
        for f in e["fontes"]:
            if not str(f.get("url", "")).startswith("http"):
                erros.append(f"{e['id']}: fonte sem URL")
    return erros


def validacao(anos: dict, cen: dict, eleit: dict | None) -> dict:
    """Confronta o calculado com números publicados (imprensa/TSE) e registra a diferença."""
    a = lambda y: anos[str(y)]
    cf = lambda y, c: a(y)["por_cargo"].get(c, {})
    ap = "Levantamento APIB/Campanha Indígena (Conexão Tocantins 19/08/2026)"
    linhas = [
        ("candidaturas indígenas 2014", a(2014)["indigenas"], 85, ap, True),
        ("candidaturas indígenas 2018", a(2018)["indigenas"], 133, ap, True),
        ("candidaturas indígenas 2022", a(2022)["indigenas"], 186, ap, True),
        (
            "candidaturas indígenas 2026",
            a(2026)["indigenas"],
            191,
            ap + " (corte de 19/08; o snapshot do TSE é de 06/10)",
            True,
        ),
        (
            "candidaturas indígenas a deputado federal 2026",
            cf(2026, "DEPUTADO FEDERAL").get("indigenas"),
            73,
            "Agência Brasil 05/10/2026 (a APIB conta 75)",
            True,
        ),
        (
            "candidaturas indígenas 2024 (municipais)",
            anos["municipal_2024"]["indigenas"] if "municipal_2024" in anos else None,
            2479,
            "Rádio Senado 03/10/2024 (dados do TSE)",
            True,
        ),
        (
            "deputados federais indígenas eleitos 2022",
            cf(2022, "DEPUTADO FEDERAL").get("eleitos_indigenas"),
            5,
            "Agência Câmara / Brasil de Fato (Folha, via Vero, conta 4); o TSE registra Silvia Waiãpi como NÃO ELEITO",
            True,
        ),
        (
            "senadores indígenas eleitos 2022",
            cf(2022, "SENADOR").get("eleitos_indigenas"),
            2,
            "ISA via Outras Palavras 17/10/2022",
            True,
        ),
        (
            "deputados estaduais indígenas eleitos 2022",
            cf(2022, "DEPUTADO ESTADUAL").get("eleitos_indigenas"),
            2,
            "ISA via Outras Palavras 17/10/2022",
            True,
        ),
        (
            "deputados federais indígenas eleitos 2026",
            cf(2026, "DEPUTADO FEDERAL").get("eleitos_indigenas"),
            3,
            "Agência Brasil 05/10/2026 (preliminar)",
            True,
        ),
        (
            "deputados estaduais indígenas eleitos 2026",
            cf(2026, "DEPUTADO ESTADUAL").get("eleitos_indigenas"),
            4,
            "Folha via Vero Notícias 06/10/2026",
            True,
        ),
        (
            "senadores indígenas eleitos 2026",
            cf(2026, "SENADOR").get("eleitos_indigenas"),
            0,
            "Folha via Vero Notícias 06/10/2026",
            True,
        ),
        (
            "deputado federal indígena eleito 2018",
            cf(2018, "DEPUTADO FEDERAL").get("eleitos_indigenas"),
            1,
            "Agência Brasil 2018 (Joênia Wapichana)",
            True,
        ),
    ]
    out = [
        {
            "item": i,
            "calculado": c,
            "publicado": p_,
            "diferenca": None if c is None else c - p_,
            "fonte": f,
            "fonte_aberta": v,
        }
        for i, c, p_, f, v in linhas
    ]
    vereadores = anos.get("municipal_2024", {}).get("por_cargo", {}).get("VEREADOR", {})
    return {
        "comparacoes": out,
        "censo_2022": {
            "pct_cor_raca_calculado": cen["pct_cor_raca"],
            "pct_ampliado_calculado": cen["pct_ampliado"],
            "pct_cor_raca_publicado": 0.6,
            "pct_ampliado_publicado": 0.83,
            "fonte": "IBGE Censo 2022 (SIDRA 9605/9718); soma dos 5.570 municípios confere com o total do Brasil (dif. 0)",
        },
        "variavel_cor_raca": "O campo DS_COR_RACA existe nas consultas de candidatos a partir de 2014 (primeira exigência de autodeclaração no registro, segundo TSE/imprensa); 2012 e anteriores não foram baixados.",
        "eleitorado": eleit,
        "vereadores_indigenas_eleitos_2024_calculado": vereadores.get(
            "eleitos_indigenas"
        ),
        "vereadores_indigenas_eleitos_2024_publicado": 241,
    }


def figuras(verif: dict) -> list[dict]:
    out = []
    for ano in ANOS:
        for f in eleitos_figuras(ano):
            v = verif.get(f"{f['nome']}|{ano}") or verif.get(f["nome"]) or {}
            f["fonte"] = (
                v.get("fonte") or f"TSE consulta_cand_{ano} (DS_COR_RACA = INDÍGENA)"
            )
            f["verificado"] = bool(v.get("verificado", False))
            if v.get("nota"):
                f["nota"] = v["nota"]
            if ano == 2026:
                f["status"] = "preliminar (snapshot TSE 06/10/2026)"
            out.append(f)
    return out


def build(escrever: bool = True, n_boot: int = 400) -> dict:
    web = Path("web/public/data")
    terr = json.loads((web / "territorios.json").read_text(encoding="utf-8"))
    hist = json.loads((web / "historia.json").read_text(encoding="utf-8"))
    cur = json.loads(CURADORIA.read_text(encoding="utf-8"))
    erros = validar_curadoria(cur, {e["id"] for e in hist["eventos"]})
    if erros:
        raise ValueError("curadoria inválida: " + "; ".join(erros))

    anos = {}
    fontes = []
    for ano in (*ANOS, ANO_MUNICIPAL):
        df = ler_candidaturas(ano)
        anos[str(ano)] = resumo_ano(df)
        p = _prov(f"consulta_cand_{ano}")
        if p:
            fontes.append(
                {
                    "nome": f"TSE consulta_cand {ano}",
                    "url": p["fonte"],
                    "baixado_em": p["baixado_em"],
                    "sha256": p["sha256"],
                }
            )
    cen = censo(terr)
    eleit = eleitorado_cor_raca(2022)
    for a in anos.values():
        a["pct_censo_cor_raca"] = cen["pct_cor_raca"]
        a["pct_censo_ampliado"] = cen["pct_ampliado"]
        a["razao_representacao_vs_censo_cor_raca"] = (
            round(a["pct"] / cen["pct_cor_raca"], 2) if a["pct"] else None
        )
        for u, b in a["por_uf"].items():
            c = cen["por_uf"].get(u)
            if c:
                b["pct_censo_cor_raca"] = c["pct_cor_raca"]
                b["pct_censo_ampliado"] = c["pct_ampliado"]

    eleicoes = {
        pid: json.loads((web / "elections" / f"{pid}.json").read_text(encoding="utf-8"))
        for pid in ("pres_2022_t1", "pres_2022_t2", "pres_2026_t1")
    }
    mun = municipios_indigenas(terr, eleicoes, n_boot=n_boot)
    secoes = secoes_em_ti()

    for nome, url in (
        ("IBGE SIDRA 9605 / 9718 (Censo 2022) via territorios.json", None),
    ):
        fontes.append(
            {
                "nome": nome,
                "url": url or "web/public/data/territorios.json",
                "baixado_em": terr["meta"]["gerado_em"],
                "sha256": None,
            }
        )
    for nome in (
        "perfil_eleitorado_2022",
        "perfil_eleitorado_2024",
        "eleitorado_local_votacao_2022",
        "detalhe_votacao_secao_2022",
        "votacao_secao_2022_BR",
        "funai_tis_poligonais",
    ):
        p = _prov(nome)
        if p:
            fontes.append(
                {
                    "nome": nome,
                    "url": p.get("fonte") or (p.get("arquivos") or [{}])[0].get("url"),
                    "baixado_em": p["baixado_em"],
                    "sha256": p["sha256"],
                }
            )

    out = {
        "meta": {
            "gerado_em": datetime.now(UTC).isoformat(timespec="seconds"),
            "aviso": cur["aviso"],
            "fontes": fontes,
            "lacunas": cur["lacunas"],
        },
        "linha_do_tempo": cur["linha_do_tempo"],
        "candidaturas": {
            "anos": {k: v for k, v in anos.items() if k != str(ANO_MUNICIPAL)},
            "municipal_2024": anos[str(ANO_MUNICIPAL)],
            "censo_2022": {k: v for k, v in cen.items() if k != "por_uf"},
            "eleitorado_2022_cor_raca": eleit,
            "eleitorado_2024_cor_raca": eleitorado_cor_raca(2024),
            "validacao": None,
        },
        "municipios_indigenas": {
            "metodo": cur["metodo_municipios"],
            "resultados": mun,
            "secoes_em_terras_indigenas": secoes,
            "ressalvas": cur["ressalvas_municipios"],
        },
        "eleitos_figuras_publicas": figuras(cur.get("verificacao_figuras", {})),
        "limites": cur["limites"],
    }
    out["candidaturas"]["validacao"] = validacao(
        {**out["candidaturas"]["anos"], "municipal_2024": anos[str(ANO_MUNICIPAL)]},
        cen,
        eleit,
    )
    if escrever:
        SAIDA.parent.mkdir(parents=True, exist_ok=True)
        SAIDA.write_text(
            json.dumps(out, ensure_ascii=False, indent=1, default=str), encoding="utf-8"
        )
    return out

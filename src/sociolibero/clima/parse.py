"""Leitores puros (texto/bytes → estruturas) dos arquivos brutos; testáveis offline.

Nada aqui executa conteúdo dos arquivos: só `str.split`, `json`, `csv`, `zipfile` (leitura em
memória, sem extrair para disco) e pandas.
"""

from __future__ import annotations

import csv
import io
import json
import math
import unicodedata
import zipfile
from collections import defaultdict
from collections.abc import Iterable

import pandas as pd

SEASONS = (
    "DJF",
    "JFM",
    "FMA",
    "MAM",
    "AMJ",
    "MJJ",
    "JJA",
    "JAS",
    "ASO",
    "SON",
    "OND",
    "NDJ",
)
MISSING = -90.0  # valores <= -90 nos arquivos NOAA são "sem dado" (-99.9, -99.99, -999)


def _num(s: str) -> float | None:
    try:
        v = float(s)
    except ValueError:
        return None
    return v if math.isfinite(v) else None


# ----------------------------------------------------------------------------- ENSO
def oni(text: str) -> list[tuple[int, int, float]]:
    """ONI (NOAA/CPC, ERSSTv5): [(ano, mes_central, anomalia)] em ordem cronológica.

    O ano do arquivo é o do mês CENTRAL da janela de 3 meses (DJF 1951 = dez/1950-fev/1951 com
    centro em jan/1951; NDJ 1950 = nov/1950-jan/1951, centro em dez/1950).
    """
    out = []
    for ln in text.splitlines():
        p = ln.split()
        if len(p) == 4 and p[0] in SEASONS and p[1].isdigit():
            v = _num(p[3])
            if v is not None and v > MISSING:
                out.append((int(p[1]), SEASONS.index(p[0]) + 1, v))
    return sorted(out)


def oni_pico(serie: list[tuple[int, int, float]]) -> dict[int, float]:
    """ONI da janela NDJ (centro em dezembro do ano Y): índice de pico do evento que começa em Y."""
    return {a: v for a, m, v in serie if m == 12}


def episodios_oni(
    serie: list[tuple[int, int, float]], limiar: float = 0.5, min_trim: int = 5
) -> list[dict]:
    """Episódios NOAA: >= `min_trim` janelas consecutivas com ONI >= +0,5 (El Niño) ou <= -0,5 (La Niña).

    `ano_pico` = ano do primeiro mês da janela de pico (DJF 1998 -> 1997), a mesma convenção de
    `oni_pico` (NDJ do ano Y), para alinhar o evento ao ano em que ele começa.
    """
    out: list[dict] = []
    for tipo, sinal in (("El Niño", 1), ("La Niña", -1)):
        run: list[tuple[int, int, float]] = []

        def fecha(run=run, tipo=tipo, sinal=sinal):
            if len(run) >= min_trim:
                pk = max(run, key=lambda r: sinal * r[2])
                a0, m0 = run[0][0], run[0][1] - 1
                if m0 == 0:
                    a0, m0 = a0 - 1, 12
                out.append(
                    {
                        "tipo": tipo,
                        "inicio": f"{a0}-{m0:02d}",
                        "fim": f"{run[-1][0]}-{run[-1][1]:02d}",
                        "janelas": len(run),
                        "oni_pico": pk[2],
                        "ano_pico": pk[0] - 1 if pk[1] == 1 else pk[0],
                    }
                )

        prev = None
        for a, m, v in serie:
            cont = prev is None or (a * 12 + m) - (prev[0] * 12 + prev[1]) == 1
            if sinal * v >= limiar and cont:
                run.append((a, m, v))
            else:
                fecha()
                run.clear()
                if sinal * v >= limiar:
                    run.append((a, m, v))
            prev = (a, m)
        fecha()
    return sorted(out, key=lambda e: e["inicio"])


def classe_enso(pico: dict[int, float], limiar: float = 0.5) -> dict[int, str]:
    return {
        a: ("el_nino" if v >= limiar else "la_nina" if v <= -limiar else "neutro")
        for a, v in pico.items()
    }


def monthly_grid(text: str) -> dict[tuple[int, int], float]:
    """Arquivos PSL 'ano + 12 meses' (HadISST Niño3.4): {(ano, mes): anomalia}."""
    out = {}
    for ln in text.splitlines():
        p = ln.split()
        if len(p) == 13 and p[0].isdigit() and len(p[0]) == 4:
            for m, s in enumerate(p[1:], 1):
                v = _num(s)
                if v is not None and v > MISSING:
                    out[(int(p[0]), m)] = v
    return out


def pico_mensal(grade: dict[tuple[int, int], float]) -> dict[int, float]:
    """Média nov(Y), dez(Y), jan(Y+1); exige os três meses."""
    out = {}
    for a, m in grade:
        if m == 11 and (a, 12) in grade and (a + 1, 1) in grade:
            out[a] = round((grade[(a, 11)] + grade[(a, 12)] + grade[(a + 1, 1)]) / 3, 3)
    return out


def mei_v2(text: str) -> dict[tuple[int, int], float]:
    """MEI.v2: 12 estações bimestrais por ano (DJ..ND); o ponto vai no mês final do bimestre."""
    out = {}
    for ln in text.splitlines():
        p = ln.split(",") if "," in ln else ln.split()
        if len(p) >= 13 and p[0].strip().isdigit() and len(p[0].strip()) == 4:
            for m, s in enumerate(p[1:13], 1):
                v = _num(s.strip())
                if v is not None and v > MISSING:
                    out[(int(p[0]), m)] = v
    return out


# ----------------------------------------------------------------------------- temperatura
def berkeley(
    text: str,
) -> tuple[
    dict[tuple[int, int], tuple[float, float]],
    dict[int, tuple[float, float]],
    float | None,
]:
    """Berkeley Earth regional: (mensal {(a,m):(anom,inc)}, anual {a:(anom,inc)}, base_absoluta_C).

    A média anual centrada vem na linha de junho (jan-dez do ano a). Anomalia vs 1951-1980;
    `inc` é a incerteza de 95% publicada.
    """
    mensal, anual, base = {}, {}, None
    for ln in text.splitlines():
        if ln.startswith("%%  Estimated Jan 1951-Dec 1980 absolute temperature"):
            base = _num(ln.split(":")[1].split("+/-")[0].strip())
        if ln.startswith("%") or not ln.strip():
            continue
        p = ln.split()
        if len(p) < 6:
            continue
        a, m = int(p[0]), int(p[1])
        v, u = _num(p[2]), _num(p[3])
        if v is not None:
            mensal[(a, m)] = (v, u if u is not None else float("nan"))
        if m == 6:
            va, ua = _num(p[4]), _num(p[5])
            if va is not None:
                anual[a] = (va, ua if ua is not None else float("nan"))
    return mensal, anual, base


def giss(text: str) -> dict[int, float]:
    """GISTEMP global (J-D, anomalia vs 1951-1980); anos incompletos ('***') omitidos."""
    out = {}
    for row in csv.reader(io.StringIO(text)):
        if row and row[0].isdigit() and len(row) > 13:
            v = _num(row[13])
            if v is not None:
                out[int(row[0])] = v
    return out


def cckp_anual(texto: str | bytes, variavel: str | None = None) -> dict[int, float]:
    """Anual CCKP: as chaves vêm como 'YYYY-07' (meio do ano); devolve {ano: valor}."""
    d = json.loads(texto)["data"]
    if variavel is not None and variavel in d:
        d = d[variavel]
    d = d.get("BRA", d)
    return {int(k[:4]): float(v) for k, v in d.items() if v is not None}


def cckp_mensal(texto: str | bytes) -> dict[tuple[int, int], float]:
    d = json.loads(texto)["data"]
    d = d.get("BRA", d)
    return {(int(k[:4]), int(k[5:7])): float(v) for k, v in d.items() if v is not None}


# ----------------------------------------------------------------------------- ONS
def _csv_ons(bytes_: bytes) -> pd.DataFrame:
    return pd.read_csv(io.BytesIO(bytes_), sep=";", encoding="utf-8")


def ons_mensal(
    frames: Iterable[pd.DataFrame],
    col_data: str,
    col_valor: str,
    col_sub: str = "id_subsistema",
) -> dict[str, dict[str, float]]:
    """Média mensal por subsistema: {sub: {'YYYY-MM': média}}. Linhas sem valor não entram."""
    out: dict[str, dict[str, float]] = defaultdict(dict)
    df = pd.concat(list(frames), ignore_index=True)
    df = df[[col_sub, col_data, col_valor]].dropna()
    df["mes"] = df[col_data].astype(str).str.slice(0, 7)
    g = df.groupby([col_sub, "mes"])[col_valor].mean()
    for (s, m), v in g.items():
        out[s][m] = float(v)
    return dict(out)


def ons_fim_de_mes(
    frames: Iterable[pd.DataFrame],
    col_data: str,
    col_valor: str,
    mes: int,
    col_sub: str = "id_subsistema",
) -> dict[str, dict[int, float]]:
    """Último valor diário disponível do mês `mes` em cada ano: {sub: {ano: valor}}."""
    df = pd.concat(list(frames), ignore_index=True)[
        [col_sub, col_data, col_valor]
    ].dropna()
    df["d"] = pd.to_datetime(df[col_data].astype(str).str.slice(0, 10))
    df = df[df["d"].dt.month == mes]
    out: dict[str, dict[int, float]] = defaultdict(dict)
    for (s, a), g in df.groupby([col_sub, df["d"].dt.year]):
        out[s][int(a)] = float(g.sort_values("d")[col_valor].iloc[-1])
    return dict(out)


def media_anual_de_mensal(
    mensal: dict[str, float], min_meses: int = 12
) -> dict[int, float]:
    por: dict[int, list[float]] = defaultdict(list)
    for k, v in mensal.items():
        por[int(k[:4])].append(v)
    return {a: sum(v) / len(v) for a, v in por.items() if len(v) >= min_meses}


# ----------------------------------------------------------------------------- INPE
def _sem_acento(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", str(s)) if not unicodedata.combining(c)
    ).lower()


def focos_zip(blob: bytes) -> tuple[dict[str, int], dict[str, int], int]:
    """Um zip anual do Programa Queimadas: (contagem mensal Brasil, mensal Amazônia, linhas sem bioma).

    Lido em memória: só o CSV do zip (nome checado contra o padrão), nada vai para o disco.
    """
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        nomes = [
            n
            for n in z.namelist()
            if n.lower().endswith(".csv") and ".." not in n and not n.startswith("/")
        ]
        if len(nomes) != 1:
            raise ValueError(f"zip de focos com {len(nomes)} CSVs: {z.namelist()}")
        raw = z.read(nomes[0])
    try:  # a codificação muda de ano para ano (UTF-8 nos recentes, latin-1 nos antigos)
        txt = raw.decode("utf-8")
    except UnicodeDecodeError:
        txt = raw.decode("latin-1")
    df = pd.read_csv(io.StringIO(txt), usecols=["data_pas", "bioma"], dtype=str)
    df["mes"] = df["data_pas"].str.slice(0, 7)
    tot = df.groupby("mes").size()
    amz = df[df["bioma"].map(_sem_acento) == "amazonia"].groupby("mes").size()
    sem_bioma = int(df["bioma"].isna().sum())
    return (
        {k: int(v) for k, v in tot.items()},
        {k: int(v) for k, v in amz.items()},
        sem_bioma,
    )


DETER_DESMAT = ("DESMATAMENTO_CR", "DESMATAMENTO_VEG", "MINERACAO")


def deter_mensal(texto: str) -> tuple[dict[str, float], dict[str, float]]:
    """DETER-B: (desmatamento {'YYYY-MM': km²}, outras classes de degradação {'YYYY-MM': km²})."""
    df = pd.read_csv(
        io.StringIO(texto), usecols=["classname", "view_date", "areamunkm"]
    )
    df["mes"] = df["view_date"].astype(str).str.slice(0, 7)
    d = df[df["classname"].isin(DETER_DESMAT)].groupby("mes")["areamunkm"].sum()
    o = df[~df["classname"].isin(DETER_DESMAT)].groupby("mes")["areamunkm"].sum()
    return {k: float(v) for k, v in d.items()}, {k: float(v) for k, v in o.items()}


# ----------------------------------------------------------------------------- IBGE / BCB
def sidra_rows(texto: str | bytes) -> list[dict]:
    """Linhas de dados do SIDRA (a primeira linha da resposta é o cabeçalho)."""
    d = json.loads(texto)
    return d[1:]


def pib_setor_anual(texto: str | bytes) -> dict[str, dict[int, float]]:
    """SIDRA 5932 (var 6562, acumulado em 4 trimestres): no 4º tri é o crescimento do ano.

    Devolve {código_do_setor: {ano: % a.a.}}.
    """
    out: dict[str, dict[int, float]] = defaultdict(dict)
    for r in sidra_rows(texto):
        per = r["D3C"]
        if per.endswith("04") and r["V"] not in ("-", "...", "X", ""):
            out[r["D4C"]][int(per[:4])] = float(r["V"])
    return dict(out)


def ipca_mensal(
    textos: Iterable[str | bytes],
) -> dict[str, dict[tuple[int, int], float]]:
    """SIDRA 1419/7060: {código_item: {(ano, mês): variação mensal %}}."""
    out: dict[str, dict[tuple[int, int], float]] = defaultdict(dict)
    for t in textos:
        for r in sidra_rows(t):
            if r["V"] in ("-", "...", "X", ""):
                continue
            p = r["D3C"]
            out[r["D4C"]][(int(p[:4]), int(p[4:6]))] = float(r["V"])
    return dict(out)


def sgs_mensal(texto: str | bytes) -> dict[tuple[int, int], float]:
    out = {}
    for r in json.loads(texto):
        dd, mm, aa = r["data"].split("/")
        v = _num(r["valor"])
        if v is not None:
            out[(int(aa), int(mm))] = v
    return out


def acumulado_anual(
    mensal: dict[tuple[int, int], float],
) -> tuple[dict[int, float], list[int]]:
    """Composição Jan-Dez de variações mensais (%); só anos com 12 meses. Devolve (anual, anos_incompletos)."""
    por: dict[int, dict[int, float]] = defaultdict(dict)
    for (a, m), v in mensal.items():
        por[a][m] = v
    anual, inc = {}, []
    for a, ms in sorted(por.items()):
        if len(ms) == 12:
            f = 1.0
            for v in ms.values():
                f *= 1 + v / 100
            anual[a] = round((f - 1) * 100, 4)
        else:
            inc.append(a)
    return anual, inc

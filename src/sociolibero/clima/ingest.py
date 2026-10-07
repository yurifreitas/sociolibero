"""Download com proveniência das fontes climáticas (cada fonte em `data/raw/<nome>/`).

Mesmas regras de `series/ingest.py`: tudo que é baixado é dado não confiável (leitura posterior só
por `json`/`csv`/`zipfile` sem executar nada); cada pasta ganha `PROVENIENCIA.json` com URL, data e
SHA-256 por arquivo. 401/403/404 e erro de certificado são registrados em
`data/raw/_falhas_clima.json` e **não são contornados**.
"""

from __future__ import annotations

import json
import time
from collections.abc import Callable
from datetime import UTC, date, datetime

from ..series import ingest as si

RAW = si.RAW
FALHAS = RAW / "_falhas_clima.json"
UA = si.UA

NOAA = {
    "noaa_oni": (
        "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt",
        "oni.ascii.txt",
    ),
    "noaa_meiv2": ("https://psl.noaa.gov/enso/mei/data/meiv2.data", "meiv2.data"),
    "noaa_nino34_hadisst": (
        "https://psl.noaa.gov/data/timeseries/month/data/nino34.long.anom.data",
        "nino34.long.anom.data",
    ),
    "berkeley_brazil_tavg": (
        "https://berkeley-earth-temperature.s3.us-west-1.amazonaws.com/Regional/TAVG/brazil-TAVG-Trend.txt",
        "brazil-TAVG-Trend.txt",
    ),
    "berkeley_samerica_tavg": (
        "https://berkeley-earth-temperature.s3.us-west-1.amazonaws.com/Regional/TAVG/south-america-TAVG-Trend.txt",
        "south-america-TAVG-Trend.txt",
    ),
    "nasa_giss_gistemp": (
        "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv",
        "GLB.Ts+dSST.csv",
    ),
}

CCKP = "https://cckpapi.worldbank.org/cckp/v1/{c}/BRA?_format=json"
CCKP_ARQ = {
    "cru_ts409_tas_anual.json": "cru-x0.5_timeseries_tas_timeseries_annual_1901-2024_mean_historical_cru_ts4.09_mean",
    "cru_ts409_pr_anual.json": "cru-x0.5_timeseries_pr_timeseries_annual_1901-2024_mean_historical_cru_ts4.09_mean",
    "cru_ts409_tas_mensal.json": "cru-x0.5_timeseries_tas_timeseries_monthly_1901-2024_mean_historical_cru_ts4.09_mean",
    "cru_ts409_pr_mensal.json": "cru-x0.5_timeseries_pr_timeseries_monthly_1901-2024_mean_historical_cru_ts4.09_mean",
    "era5_tas_pr_anual.json": "era5-x0.25_timeseries_tas,pr_timeseries_annual_1950-2024_mean_historical_era5_x0.25_mean",
}

SIDRA = "https://apisidra.ibge.gov.br/values"
SIDRA_ARQ = {
    "sidra_5932_pib_setores": (
        f"{SIDRA}/t/5932/n1/all/v/6562/p/all/c11255/90687,90691,90696?formato=json",
        "5932.json",
    ),
    "sidra_7060_ipca_2020": (
        f"{SIDRA}/t/7060/n1/all/v/63/p/all/c315/7170,7485,7169?formato=json",
        "7060.json",
    ),
    "sidra_1419_ipca_2012_2019": (
        f"{SIDRA}/t/1419/n1/all/v/63/p/all/c315/7170,7485,7169?formato=json",
        "1419.json",
    ),
}
BCB_ALIMENTACAO = (
    "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1635/dados?formato=json",
    "sgs_1635.json",
)

CKAN = "https://dados.ons.org.br/api/3/action/package_show?id={d}"
ONS = {
    "ons_ear_subsistema": "ear-diario-por-subsistema",
    "ons_ena_subsistema": "ena-diario-por-subsistema",
    "ons_cmo_semanal": "cmo-semanal",
}

FOCOS_ZIP = "https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/anual/Brasil_sat_ref/focos_br_ref_{a}.zip"
FOCOS_ANOS = range(2003, 2026)  # 2026 ainda é ano corrente: não entra na série anual
WFS = (
    "https://terrabrasilis.dpi.inpe.br/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature"
    "&typeName=deter-amz:deter_amz&outputFormat=csv&propertyName=classname,view_date,areamunkm"
    "&CQL_FILTER=view_date%20BETWEEN%20%27{a}%27%20AND%20%27{b}%27"
)
WFS_TETO = (
    50000  # o GeoServer corta em 50 001 linhas: bloco cheio = dado truncado = erro
)


def registrar_falha(nome: str, url: str, erro: str) -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    d = json.loads(FALHAS.read_text(encoding="utf-8")) if FALHAS.exists() else {}
    d[nome] = {"url": url, "erro": erro, "em": si._agora()}
    FALHAS.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")


def _simples(nome: str, url: str, fn: str) -> dict:
    r = si._get(url, json_esperado=fn.endswith(".json"))
    return si.gravar(
        nome, [(fn, url, r.content)], {"last_modified": r.headers.get("Last-Modified")}
    )


def _cckp() -> dict:
    arqs = []
    for fn, c in CCKP_ARQ.items():
        u = CCKP.format(c=c)
        arqs.append((fn, u, si._get(u, json_esperado=True).content))
    return si.gravar(
        "cckp_clima_brasil",
        arqs,
        {
            "obs": "Banco Mundial CCKP: agregado nacional (média espacial) de CRU TS 4.09 (0,5 grau) "
            "e ERA5 (0,25 grau); temperatura em graus C, chuva em mm/ano ou mm/mês."
        },
    )


def _sidra(nome: str) -> dict:
    u, fn = SIDRA_ARQ[nome]
    return _simples(nome, u, fn)


def _ons(nome: str) -> dict:
    u_pkg = CKAN.format(d=ONS[nome])
    pkg = json.loads(si._get(u_pkg, json_esperado=True).content)["result"]
    rec = [
        r
        for r in pkg["resources"]
        if str(r.get("format", "")).upper() == "CSV" and r.get("url")
    ]
    arqs = []
    for r in sorted(rec, key=lambda x: x["url"]):
        u = r["url"]
        if not u.startswith("https://ons-aws-prod-opendata.s3.amazonaws.com/"):
            raise RuntimeError(f"URL fora do bucket aberto do ONS: {u}")
        arqs.append((u.rsplit("/", 1)[1], u, si._get(u).content))
        time.sleep(0.2)
    return si.gravar(
        nome,
        arqs,
        {
            "ckan": u_pkg,
            "titulo": pkg.get("title"),
            "licenca": pkg.get("license_title"),
            "metadata_modified": pkg.get("metadata_modified"),
        },
    )


def _focos() -> dict:
    arqs = []
    for a in FOCOS_ANOS:
        u = FOCOS_ZIP.format(a=a)
        arqs.append((f"focos_br_ref_{a}.zip", u, si._get(u).content))
    return si.gravar(
        "inpe_focos_ref_anual",
        arqs,
        {
            "obs": "Programa Queimadas/INPE, satélite de referência (série comparável desde 2003); "
            "um zip por ano com um foco por linha."
        },
    )


IPCC = {
    "IPCC_AR6_WGII_Chapter12.pdf": "https://www.ipcc.ch/report/ar6/wg2/downloads/report/IPCC_AR6_WGII_Chapter12.pdf",
    "IPCC_AR6_WGI_Regional_Fact_Sheet_Central_and_South_America.pdf": "https://www.ipcc.ch/report/ar6/wg1/downloads/factsheets/IPCC_AR6_WGI_Regional_Fact_Sheet_Central_and_South_America.pdf",
}


def _ipcc() -> dict:
    arqs = []
    for fn, u in IPCC.items():
        c = si._get(u).content
        if not c.startswith(b"%PDF-"):
            raise RuntimeError(f"{fn}: resposta não é PDF")
        arqs.append((fn, u, c))
    return si.gravar(
        "ipcc_ar6_america_do_sul",
        arqs,
        {
            "obs": "PDFs lidos para a curadoria de cenários (clima/curadoria/ipcc_ar6.json)."
        },
    )


def _meses(ini: date, fim: date):
    y, m = ini.year, ini.month
    while (y, m) <= (fim.year, fim.month):
        a = date(y, m, 1)
        b = date(y + (m == 12), m % 12 + 1, 1)
        yield a, date.fromordinal(b.toordinal() - 1)
        y, m = b.year, b.month


def _deter() -> dict:
    """DETER-B Amazônia (WFS do TerraBrasilis) em blocos mensais, só 3 colunas, gravado como um CSV."""
    linhas: list[str] = []
    urls = []
    for a, b in _meses(date(2016, 8, 1), datetime.now(UTC).date()):
        u = WFS.format(a=a.isoformat(), b=b.isoformat())
        txt = si._get(u).content.decode("utf-8")
        ls = txt.splitlines()
        if not ls or not ls[0].startswith("FID,classname"):
            raise RuntimeError(f"resposta inesperada do WFS em {a}")
        if len(ls) - 1 >= WFS_TETO:
            raise RuntimeError(f"bloco {a} truncado pelo teto do WFS")
        urls.append(u)
        linhas.extend(ls[1:] if linhas else ls)
    return si.gravar(
        "inpe_deter_amz",
        [("deter_amz.csv", urls[0], "\n".join(linhas).encode("utf-8"))],
        {"blocos_mensais": len(urls), "urls_blocos": urls},
    )


def tarefas() -> list[tuple[str, str, Callable[[], dict]]]:
    t: list[tuple[str, str, Callable[[], dict]]] = []
    for n, (u, fn) in NOAA.items():
        t.append((n, u, lambda n=n, u=u, fn=fn: _simples(n, u, fn)))
    t.append(("cckp_clima_brasil", CCKP.format(c="..."), _cckp))
    for n in SIDRA_ARQ:
        t.append((n, SIDRA_ARQ[n][0], lambda n=n: _sidra(n)))
    t.append(
        (
            "bcb_sgs_1635",
            BCB_ALIMENTACAO[0],
            lambda: _simples("bcb_sgs_1635", *BCB_ALIMENTACAO),
        )
    )
    for n, d in ONS.items():
        t.append((n, CKAN.format(d=d), lambda n=n: _ons(n)))
    t.append(("ipcc_ar6_america_do_sul", next(iter(IPCC.values())), _ipcc))
    t.append(("inpe_focos_ref_anual", FOCOS_ZIP.format(a="AAAA"), _focos))
    t.append(("inpe_deter_amz", WFS.format(a="AAAA-MM-01", b="AAAA-MM-31"), _deter))
    return t


def baixar_tudo(refazer: bool = False) -> dict[str, dict]:
    """Baixa o que falta; falha de acesso vira registro em `_falhas_clima.json` e a execução segue."""
    out: dict[str, dict] = {}
    for nome, url, fn in tarefas():
        if not refazer and (m := si.proveniencia(nome)):
            out[nome] = m
            continue
        try:
            out[nome] = fn()
            print("ok   ", nome, out[nome]["sha256"][:12], flush=True)
        except Exception as e:  # noqa: BLE001 - registrar e seguir
            registrar_falha(nome, url, repr(e))
            print("FALHA", nome, repr(e), flush=True)
    return out


def proveniencia(nome: str) -> dict | None:
    return si.proveniencia(nome)

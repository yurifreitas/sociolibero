"""Clima × economia do Brasil → `web/public/data/clima.json`.

Só entra série lida de arquivo baixado por `ingest.py` (SHA-256 em PROVENIENCIA.json). O que não
tem fonte aberta acessível vai para `meta.lacunas`; nada é interpolado. As relações são
DESCRITIVAS (correlação com IC95 por bootstrap em blocos), todas as testadas são publicadas (não só
as "significativas") e o total de testes é declarado, para que o leitor desconte o acaso.
"""

from __future__ import annotations

import json
import math
from datetime import UTC, datetime
from pathlib import Path

import numpy as np

from ..series.ingest import proveniencia
from . import estat, macro, parse

RAW = Path("data/raw")
OUT = Path("web/public/data/clima.json")
SERIES_HIST = Path("web/public/data/series_historicas.json")
CURADORIA = Path(__file__).parent / "curadoria"

AVISO = (
    "Relações descritivas entre séries curtas e autocorrelacionadas NÃO são causalidade: variáveis "
    "omitidas (juros, câmbio, preço de commodities, política agrícola e energética), poucas "
    "observações e múltiplos testes produzem correlações que somem ou invertem de sinal. Os IC95 vêm "
    "de bootstrap em blocos e descrevem só a incerteza amostral, não a de especificação. Cenários "
    "futuros e o choque no modelo macro são suposições rotuladas, não previsões."
)

LIMITES_GERAIS = (
    "Correlação de série curta não é causalidade; o IC cobre só incerteza amostral; variáveis "
    "omitidas e múltiplos testes (ver meta.resumo_testes) podem produzir ou apagar o padrão."
)


class Falta(Exception):
    """Fonte não baixada ou sem dado utilizável → vira lacuna, não erro."""


def _prov(pasta: str) -> dict:
    m = proveniencia(pasta)
    if m is None:
        raise Falta(f"{pasta} não baixado (rode `sociolibero clima baixar`)")
    return m


def _fonte(pasta: str, nome: str, url: str | None = None) -> dict:
    m = _prov(pasta)
    return {
        "nome": nome,
        "url": url or m["arquivos"][0]["url"],
        "baixado_em": m["baixado_em"],
        "sha256": m["sha256"],
        "arquivos": len(m["arquivos"]),
    }


def _ler(pasta: str, arq: str) -> bytes:
    _prov(pasta)
    return (RAW / pasta / arq).read_bytes()


def _txt(pasta: str, arq: str) -> str:
    return _ler(pasta, arq).decode("utf-8", errors="replace")


def _arquivos(pasta: str, prefixo: str = "") -> list[Path]:
    _prov(pasta)
    return sorted(
        p
        for p in (RAW / pasta).iterdir()
        if p.name.startswith(prefixo) and p.suffix in (".csv", ".zip")
    )


def _pontos(d: dict, nd: int = 3) -> list:
    out = []
    for k in sorted(d, key=lambda x: x if isinstance(x, tuple) else str(x)):
        v = d[k]
        if v is None or (isinstance(v, float) and not math.isfinite(v)):
            continue
        kk = f"{k[0]}-{k[1]:02d}" if isinstance(k, tuple) else k
        out.append([kk, round(float(v), nd)])
    return out


def _cob(pts: list) -> list:
    return [pts[0][0], pts[-1][0]] if pts else []


def serie(
    id_, rotulo, unidade, fonte, qualidade, dados: dict, notas: str, nd=3
) -> dict:
    pts = _pontos(dados, nd)
    return {
        "id": id_,
        "rotulo": rotulo,
        "unidade": unidade,
        "cobertura": _cob(pts),
        "fonte": fonte,
        "qualidade": qualidade,
        "pontos": pts,
        "notas": notas,
    }


def _anual(d: dict) -> dict[int, float]:
    return {int(k): v for k, v in d.items()}


def _base_mean(d: dict[int, float], a0: int, a1: int) -> float:
    v = [d[a] for a in range(a0, a1 + 1) if a in d]
    if len(v) < (a1 - a0 + 1) * 0.9:
        raise Falta(f"base {a0}-{a1} incompleta")
    return sum(v) / len(v)


class Ctx:
    """Séries carregadas (dicts ano→valor) e lista de lacunas, para uso das relações."""

    def __init__(self) -> None:
        self.series: list[dict] = []
        self.d: dict[str, dict] = {}  # id -> {ano: valor} (anuais) para as relações
        self.lacunas: list[dict] = []
        self.validacao: dict = {}
        self.extra: dict = {}

    def add(self, s: dict, anual: dict | None = None) -> None:
        self.series.append(s)
        if anual is not None:
            self.d[s["id"]] = anual

    def lacuna(self, o: str, motivo: str) -> None:
        self.lacunas.append({"item": o, "motivo": motivo})


def tentar(ctx: Ctx, nome: str, fn) -> None:
    try:
        fn(ctx)
    except (Falta, FileNotFoundError) as e:
        ctx.lacuna(nome, str(e))


# --------------------------------------------------------------------------- ENSO
def c_enso(ctx: Ctx) -> None:
    f = _fonte("noaa_oni", "NOAA/CPC — Oceanic Niño Index (ERSSTv5)")
    o = parse.oni(_txt("noaa_oni", "oni.ascii.txt"))
    ctx.add(
        serie(
            "oni_mensal",
            "ONI: anomalia de TSM do Niño 3.4 (média móvel de 3 meses)",
            "°C",
            f,
            "alta",
            {(a, m): v for a, m, v in o},
            "Ponto no mês central da janela (NDJ -> dezembro). Base móvel de 30 anos recalculada a cada 5 anos "
            "pela NOAA. El Niño: ONI >= +0,5 por 5 janelas seguidas; La Niña: <= -0,5.",
            2,
        )
    )
    pico = parse.oni_pico(o)
    ctx.add(
        serie(
            "oni_pico_ndj",
            "ONI da janela NDJ de cada ano (índice de pico do evento que começa nesse ano)",
            "°C",
            f,
            "alta",
            pico,
            "NDJ do ano Y = nov(Y), dez(Y), jan(Y+1). Usado para classificar o ano em El Niño/La Niña/neutro.",
            2,
        ),
        pico,
    )
    ctx.extra["enso_episodios"] = parse.episodios_oni(o)
    ctx.d["enso_classe"] = parse.classe_enso(pico)  # type: ignore[assignment]
    fh = _fonte(
        "noaa_nino34_hadisst", "NOAA/PSL — Niño 3.4, HadISST (anomalia vs 1981-2010)"
    )
    g = parse.monthly_grid(_txt("noaa_nino34_hadisst", "nino34.long.anom.data"))
    pm = parse.pico_mensal(g)
    ctx.add(
        serie(
            "nino34_hadisst_pico",
            "Niño 3.4 (HadISST), média nov-dez-jan de cada ano",
            "°C",
            fh,
            "media",
            pm,
            "Reconstrução de TSM desde 1870; antes de ~1950 a cobertura de observações é esparsa e o índice é "
            "bem menos preciso. Mesmo recorte NDJ de oni_pico_ndj (Y = ano do mês de novembro).",
            2,
        ),
        pm,
    )
    ctx.add(
        serie(
            "nino34_hadisst_mensal",
            "Niño 3.4 (HadISST), mensal",
            "°C",
            fh,
            "media",
            g,
            "Anomalia vs 1981-2010. Último mês pode estar incompleto na fonte; meses sem dado omitidos.",
            2,
        )
    )
    try:
        fm = _fonte("noaa_meiv2", "NOAA/PSL — Multivariate ENSO Index v2")
        mei = parse.mei_v2(_txt("noaa_meiv2", "meiv2.data"))
        ctx.add(
            serie(
                "mei_v2_bimestral",
                "MEI.v2 (índice multivariado de ENSO), bimestres",
                "desvios-padrão",
                fm,
                "alta",
                mei,
                "Ponto no mês final do bimestre (DJ -> janeiro). Combina TSM, pressão, vento e radiação; "
                "série desde 1979.",
                2,
            )
        )
    except Falta as e:
        ctx.lacuna("mei_v2", str(e))


# --------------------------------------------------------------------------- temperatura e chuva
def c_temperatura(ctx: Ctx) -> None:
    fb = _fonte(
        "berkeley_brazil_tavg",
        "Berkeley Earth — Brasil, temperatura do ar na superfície (terra)",
    )
    m, an, base = parse.berkeley(_txt("berkeley_brazil_tavg", "brazil-TAVG-Trend.txt"))
    an_pts = {a: v for a, (v, u) in an.items()}
    ctx.add(
        serie(
            "temp_brasil_berkeley_anual",
            "Anomalia anual de temperatura do Brasil (Berkeley Earth)",
            "°C vs 1951-1980",
            fb,
            "media",
            an_pts,
            "Média anual jan-dez; incerteza de 95% publicada em `incerteza_95` (muito maior antes de 1900). "
            f"Temperatura absoluta 1951-1980 estimada: {base} °C. O arquivo público termina em 2020 "
            "(análise de jan/2021); anos posteriores vêm das séries CRU/ERA5, sem emendar.",
            3,
        ),
        an_pts,
    )
    ctx.series[-1]["incerteza_95"] = _pontos({a: u for a, (v, u) in an.items()})
    try:
        fs = _fonte(
            "berkeley_samerica_tavg",
            "Berkeley Earth — América do Sul, temperatura do ar (terra)",
        )
        _, ans, _ = parse.berkeley(
            _txt("berkeley_samerica_tavg", "south-america-TAVG-Trend.txt")
        )
        ctx.add(
            serie(
                "temp_america_sul_berkeley_anual",
                "Anomalia anual de temperatura da América do Sul (Berkeley Earth)",
                "°C vs 1951-1980",
                fs,
                "media",
                {a: v for a, (v, u) in ans.items()},
                "Mesma metodologia e mesmo corte (2020) da série do Brasil.",
                3,
            ),
            {a: v for a, (v, u) in ans.items()},
        )
    except Falta as e:
        ctx.lacuna("temp_america_sul_berkeley_anual", str(e))
    try:
        fg = _fonte(
            "nasa_giss_gistemp",
            "NASA GISS — GISTEMP v4, média global terra+oceano (J-D)",
        )
        gl = parse.giss(_txt("nasa_giss_gistemp", "GLB.Ts+dSST.csv"))
        ctx.add(
            serie(
                "temp_global_giss_anual",
                "Anomalia anual da temperatura global (NASA GISTEMP)",
                "°C vs 1951-1980",
                fg,
                "alta",
                gl,
                "Contexto global; anos incompletos na fonte ('***') omitidos.",
                2,
            ),
            gl,
        )
    except Falta as e:
        ctx.lacuna("temp_global_giss_anual", str(e))

    fc = _fonte(
        "cckp_clima_brasil",
        "Banco Mundial CCKP — CRU TS 4.09, média espacial do Brasil",
        None,
    )
    tas = parse.cckp_anual(_ler("cckp_clima_brasil", "cru_ts409_tas_anual.json"))
    pr = parse.cckp_anual(_ler("cckp_clima_brasil", "cru_ts409_pr_anual.json"))
    b_t = _base_mean(tas, 1951, 1980)
    b_p = _base_mean(pr, 1961, 1990)
    ta = {a: v - b_t for a, v in tas.items()}
    pa = {a: 100 * (v / b_p - 1) for a, v in pr.items()}
    ctx.add(
        serie(
            "temp_brasil_cru_anomalia",
            "Anomalia anual de temperatura do Brasil (CRU TS 4.09)",
            "°C vs 1951-1980",
            fc,
            "media",
            ta,
            f"Média espacial sobre o território (grade de 0,5°); anomalia calculada aqui contra a média 1951-1980 "
            f"da própria série ({b_t:.2f} °C). Termina em 2024. CRU é interpolação de estações: antes de ~1950 "
            "há poucas estações na Amazônia e no Centro-Oeste.",
            3,
        ),
        ta,
    )
    ctx.add(
        serie(
            "chuva_brasil_cru_anual",
            "Precipitação anual média do Brasil (CRU TS 4.09)",
            "mm/ano",
            fc,
            "media",
            pr,
            "Média espacial do território. Média nacional esconde o contraste regional (Nordeste, Sul, Amazônia): "
            "um ano seco no semiárido pode passar quase invisível aqui.",
            1,
        ),
        pr,
    )
    ctx.add(
        serie(
            "chuva_brasil_cru_anomalia_pct",
            "Anomalia da precipitação anual do Brasil (CRU TS 4.09)",
            "% vs média 1961-1990",
            fc,
            "media",
            pa,
            f"Calculada aqui: 100 x (P / {b_p:.0f} mm - 1).",
            2,
        ),
        pa,
    )
    for nome, arq, rot, un in (
        (
            "temp_brasil_cru_mensal",
            "cru_ts409_tas_mensal.json",
            "Temperatura média mensal do Brasil (CRU TS 4.09)",
            "°C",
        ),
        (
            "chuva_brasil_cru_mensal",
            "cru_ts409_pr_mensal.json",
            "Precipitação mensal média do Brasil (CRU TS 4.09)",
            "mm/mês",
        ),
    ):
        ctx.add(
            serie(
                nome,
                rot,
                un,
                fc,
                "media",
                parse.cckp_mensal(_ler("cckp_clima_brasil", arq)),
                "Valor absoluto (não anomalia); o ciclo sazonal domina.",
                2,
            )
        )
    e = json.loads(_ler("cckp_clima_brasil", "era5_tas_pr_anual.json"))
    et = {int(k[:4]): v for k, v in e["data"]["tas"]["BRA"].items()}
    ep = {int(k[:4]): v for k, v in e["data"]["pr"]["BRA"].items()}
    fe = _fonte(
        "cckp_clima_brasil",
        "Banco Mundial CCKP — ERA5 (reanálise), média espacial do Brasil",
    )
    ctx.add(
        serie(
            "temp_brasil_era5_anual",
            "Temperatura média anual do Brasil (ERA5)",
            "°C",
            fe,
            "alta",
            et,
            "Reanálise ECMWF (0,25°) desde 1950; valor absoluto, difere do CRU por método e grade.",
            2,
        ),
        et,
    )
    ctx.add(
        serie(
            "chuva_brasil_era5_anual",
            "Precipitação anual média do Brasil (ERA5)",
            "mm/ano",
            fe,
            "media",
            ep,
            "Chuva de reanálise é produto do modelo (assimilação), menos confiável que estações em trópicos.",
            0,
        ),
        ep,
    )
    # validação cruzada entre produtos
    v = {}
    for nome, x, y in (
        ("cru_vs_era5_temp", ta, et),
        ("cru_vs_era5_chuva", pr, ep),
        ("cru_vs_berkeley_temp", ta, an_pts),
    ):
        t, xx, yy = estat.alinhar(x, y)
        r = float(np.corrcoef(xx, yy)[0, 1])
        v[nome] = {
            "r_niveis": round(r, 3),
            "n": len(t),
            "periodo": [int(t[0]), int(t[-1])],
        }
        tt, xd, yd = t, estat.destendenciar(t, xx), estat.destendenciar(t, yy)
        v[nome]["r_sem_tendencia"] = round(float(np.corrcoef(xd, yd)[0, 1]), 3)
    ctx.validacao["concordancia_entre_produtos_climaticos"] = v
    td = np.array(sorted(ta))
    for ini in (1901, 1980):
        sel = np.array([a for a in td if a >= ini])
        ctx.extra.setdefault("tendencias", []).append(
            {
                "serie": "temp_brasil_cru_anomalia",
                "periodo": [int(sel[0]), int(sel[-1])],
                **estat.tendencia_linear(
                    sel.astype(float), np.array([ta[a] for a in sel])
                ),
                "unidade": "°C por década",
            }
        )


# --------------------------------------------------------------------------- fogo e desmatamento
def c_fogo(ctx: Ctx) -> None:
    f = _fonte(
        "inpe_focos_ref_anual",
        "INPE — Programa Queimadas, focos de calor (satélite de referência)",
    )
    tot: dict[str, int] = {}
    amz: dict[str, int] = {}
    sb_total = 0
    for p in _arquivos("inpe_focos_ref_anual", "focos_br_ref_"):
        t, a, sb = parse.focos_zip(p.read_bytes())
        tot.update(t)
        amz.update(a)
        sb_total += sb
    nota = (
        "Focos detectados pelo satélite de referência (série comparável desde 2003); contam detecções, não "
        "área queimada nem incêndios distintos, e dependem de nuvem e passagem do satélite. "
        f"Linhas sem bioma: {sb_total}."
    )
    chave = lambda d: {(int(k[:4]), int(k[5:7])): v for k, v in d.items()}
    ctx.add(
        serie(
            "focos_brasil_mensal",
            "Focos de calor no Brasil, por mês",
            "focos/mês",
            f,
            "media",
            chave(tot),
            nota,
            0,
        )
    )
    ctx.add(
        serie(
            "focos_amazonia_mensal",
            "Focos de calor no bioma Amazônia, por mês",
            "focos/mês",
            f,
            "media",
            chave(amz),
            nota,
            0,
        )
    )

    def ano(d):
        por: dict[int, int] = {}
        for k, v in d.items():
            por[int(k[:4])] = por.get(int(k[:4]), 0) + v
        n_m = {a: sum(1 for k in d if int(k[:4]) == a) for a in por}
        return {a: v for a, v in por.items() if n_m[a] == 12}

    ta, aa = ano(tot), ano(amz)
    ctx.add(
        serie(
            "focos_brasil_anual",
            "Focos de calor no Brasil, por ano",
            "focos/ano",
            f,
            "media",
            ta,
            nota,
            0,
        ),
        ta,
    )
    ctx.add(
        serie(
            "focos_amazonia_anual",
            "Focos de calor no bioma Amazônia, por ano",
            "focos/ano",
            f,
            "media",
            aa,
            nota,
            0,
        ),
        aa,
    )
    ctx.lacuna(
        "focos_2026",
        "2026 é ano corrente e não entra na série anual (só anos com 12 meses completos nos arquivos anuais).",
    )


def c_deter(ctx: Ctx) -> None:
    f = _fonte("inpe_deter_amz", "INPE/TerraBrasilis — DETER-B Amazônia (alertas, WFS)")
    txt = _txt("inpe_deter_amz", "deter_amz.csv")
    des, outras = parse.deter_mensal(txt)
    mes_atual = datetime.now(UTC).strftime("%Y-%m")
    des = {k: v for k, v in des.items() if k < mes_atual}
    outras = {k: v for k, v in outras.items() if k < mes_atual}
    nota = (
        "DETER é sistema de ALERTA (não é a taxa oficial, que é o PRODES) e a cobertura de nuvens afeta a "
        "detecção. Desmatamento = DESMATAMENTO_CR + DESMATAMENTO_VEG + MINERACAO. Mês corrente omitido (incompleto). "
        "Disponível desde ago/2016."
    )
    k2 = lambda d: {(int(k[:4]), int(k[5:7])): v for k, v in d.items()}
    ctx.add(
        serie(
            "deter_desmatamento_mensal",
            "DETER-B Amazônia: alertas de desmatamento, por mês",
            "km²/mês",
            f,
            "media",
            k2(des),
            nota,
            2,
        )
    )
    ctx.add(
        serie(
            "deter_degradacao_mensal",
            "DETER-B Amazônia: degradação, cicatriz de queimada e corte seletivo, por mês",
            "km²/mês",
            f,
            "media",
            k2(outras),
            "Todas as classes que não são desmatamento. " + nota,
            2,
        )
    )
    por: dict[int, float] = {}
    n: dict[int, int] = {}
    for k, v in des.items():
        a, m = int(k[:4]), int(k[5:7])
        ap = a + 1 if m >= 8 else a  # ano PRODES (ago-jul), igual ao do PRODES
        por[ap] = por.get(ap, 0) + v
        n[ap] = n.get(ap, 0) + 1
    # só anos PRODES com 12 meses
    ok = {a: v for a, v in por.items() if n[a] == 12}
    ctx.add(
        serie(
            "deter_desmatamento_ano_prodes",
            "DETER-B: desmatamento por ano PRODES (ago-jul)",
            "km²/ano",
            f,
            "media",
            ok,
            "Ano = ano de término (ago a jul), igual ao PRODES. " + nota,
            0,
        ),
        ok,
    )
    # PRODES
    from ..series import build as sb

    p = sb.s_prodes()
    pd_ = {int(a): v for a, v in p["pontos"]}
    pts = [[int(a), float(v)] for a, v in p["pontos"]]
    ctx.add(
        {
            **{
                k: p[k]
                for k in ("id", "rotulo", "unidade", "fonte", "qualidade", "notas")
            },
            "cobertura": _cob(pts),
            "pontos": pts,
        },
        pd_,
    )
    t, x, y = estat.alinhar(ok, pd_)
    if len(t) >= 5:
        ctx.validacao["deter_vs_prodes"] = {
            "r": round(float(np.corrcoef(x, y)[0, 1]), 3),
            "n": len(t),
            "razao_media_deter_sobre_prodes": round(float(np.mean(x / y)), 3),
            "leitura": "DETER subestima o PRODES em nível (resolução e nuvem), mas acompanha o sentido.",
        }


# --------------------------------------------------------------------------- energia (ONS)
def _frames(pasta: str) -> list:
    import pandas as pd

    return [pd.read_csv(p, sep=";") for p in _arquivos(pasta, "") if p.suffix == ".csv"]


def c_ons(ctx: Ctx) -> None:
    f_ear = _fonte(
        "ons_ear_subsistema",
        "ONS dados abertos — Energia Armazenada (EAR) diária por subsistema",
        None,
    )
    fr = _frames("ons_ear_subsistema")
    ear_m = parse.ons_mensal(fr, "ear_data", "ear_verif_subsistema_percentual")
    ear_nov = parse.ons_fim_de_mes(
        fr, "ear_data", "ear_verif_subsistema_percentual", 11
    )
    nomes = {"SE": "Sudeste/Centro-Oeste", "NE": "Nordeste", "S": "Sul", "N": "Norte"}
    nota_ear = (
        "EAR = energia armazenada nos reservatórios como % da capacidade máxima do subsistema (verificada, "
        "média do mês). Reflete operação (despacho), não só chuva."
    )
    for s, nm in nomes.items():
        if s in ear_m:
            ctx.add(
                serie(
                    f"ear_{s.lower()}_mensal",
                    f"Energia armazenada, {nm}",
                    "% da capacidade",
                    f_ear,
                    "alta",
                    {(int(k[:4]), int(k[5:7])): v for k, v in ear_m[s].items()},
                    nota_ear,
                    2,
                )
            )
    for s in ("SE", "NE"):
        if s in ear_nov:
            ctx.add(
                serie(
                    f"ear_{s.lower()}_fim_nov",
                    f"Energia armazenada em 30/nov, {nomes[s]} (fim da estação seca)",
                    "% da capacidade",
                    f_ear,
                    "alta",
                    ear_nov[s],
                    "Último valor diário de novembro: o ponto de menor folga do ano hidrológico, antes das águas.",
                    2,
                ),
                ear_nov[s],
            )
    f_ena = _fonte(
        "ons_ena_subsistema",
        "ONS dados abertos — Energia Natural Afluente (ENA) diária por subsistema",
    )
    fe = _frames("ons_ena_subsistema")
    ena_m = parse.ons_mensal(fe, "ena_data", "ena_bruta_regiao_percentualmlt")
    nota_ena = (
        "ENA bruta como % da média de longo prazo (MLT): mede a vazão natural afluente às usinas, um proxy de "
        "chuva/hidrologia da bacia mais próximo da energia que da chuva em si. 100% = média histórica."
    )
    for s in ("SE", "NE", "N", "S"):
        if s in ena_m:
            ctx.add(
                serie(
                    f"ena_{s.lower()}_mensal",
                    f"Afluência natural (% da MLT), {nomes[s]}",
                    "% da MLT",
                    f_ena,
                    "alta",
                    {(int(k[:4]), int(k[5:7])): v for k, v in ena_m[s].items()},
                    nota_ena,
                    1,
                )
            )
            an = parse.media_anual_de_mensal(ena_m[s])
            ctx.add(
                serie(
                    f"ena_{s.lower()}_anual",
                    f"Afluência natural média do ano (% da MLT), {nomes[s]}",
                    "% da MLT",
                    f_ena,
                    "alta",
                    an,
                    nota_ena + " Só anos com 12 meses.",
                    1,
                ),
                an,
            )
    f_cmo = _fonte(
        "ons_cmo_semanal",
        "ONS dados abertos — Custo Marginal de Operação (CMO) semanal",
    )
    fc = _frames("ons_cmo_semanal")
    cmo_m = parse.ons_mensal(fc, "din_instante", "val_cmomediasemanal")
    nota_cmo = (
        "CMO = custo marginal de operação semanal do modelo de despacho (R$/MWh); referência do preço de curto "
        "prazo, mas NÃO é o PLD (que tem piso e teto regulatórios) nem a tarifa paga pelo consumidor. "
        "Valor mensal = média das semanas que começam no mês. "
        "O CMO pode ser exatamente zero (vertimento/reservatórios cheios): nos dados do ONS as médias mensais são ~0 de "
        "nov/2022 a mar/2024 e a média de 2023 é 0,0 (valor da fonte, não falha de leitura)."
    )
    for s in ("SE", "NE"):
        if s in cmo_m:
            ctx.add(
                serie(
                    f"cmo_{s.lower()}_mensal",
                    f"CMO semanal médio do mês, {nomes[s]}",
                    "R$/MWh",
                    f_cmo,
                    "media",
                    {(int(k[:4]), int(k[5:7])): v for k, v in cmo_m[s].items()},
                    nota_cmo,
                    2,
                )
            )
            an = parse.media_anual_de_mensal(cmo_m[s])
            ctx.add(
                serie(
                    f"cmo_{s.lower()}_anual",
                    f"CMO médio do ano, {nomes[s]}",
                    "R$/MWh",
                    f_cmo,
                    "media",
                    an,
                    nota_cmo + " Só anos com 12 meses.",
                    2,
                ),
                an,
            )
    ctx.lacuna(
        "pld_ccee",
        "PLD (preço de liquidação das diferenças, CCEE): dadosabertos.ccee.org.br respondeu 403 (Forbidden) nesta "
        "execução; não contornado. O CMO do ONS (aberto) foi usado como proxy de preço de curto prazo.",
    )


# --------------------------------------------------------------------------- economia
def c_economia(ctx: Ctx) -> None:
    f = _fonte(
        "sidra_5932_pib_setores",
        "IBGE/SIDRA 5932 — Contas Nacionais Trimestrais, taxa acumulada em 4 trimestres",
    )
    set_ = parse.pib_setor_anual(_ler("sidra_5932_pib_setores", "5932.json"))
    nomes = {
        "90687": ("pib_agro_var", "PIB da agropecuária, variação real anual"),
        "90691": ("pib_industria_var", "PIB da indústria, variação real anual"),
        "90696": ("pib_servicos_var", "PIB dos serviços, variação real anual"),
    }
    for cod, (id_, rot) in nomes.items():
        d = set_.get(cod, {})
        ctx.add(
            serie(
                id_,
                rot,
                "% a.a.",
                f,
                "alta",
                d,
                "Taxa acumulada em 4 trimestres lida no 4º trimestre = variação do ano sobre o anterior (volume). "
                "Contas Nacionais Trimestrais cobrem 1996 em diante; 1996-2025 anos completos."
                + (
                    " Serviços entram como controle (placebo): não se espera efeito direto do clima."
                    if cod == "90696"
                    else ""
                ),
                2,
            ),
            d,
        )
    mens = parse.ipca_mensal(
        [
            _ler("sidra_1419_ipca_2012_2019", "1419.json"),
            _ler("sidra_7060_ipca_2020", "7060.json"),
        ]
    )
    fi = {
        "nome": "IBGE/SIDRA 1419 (2012-2019) e 7060 (2020 em diante) — IPCA variação mensal",
        "url": "https://apisidra.ibge.gov.br/values/t/7060/n1/all/v/63/p/all/c315/7170,7485,7169",
        "baixado_em": _prov("sidra_7060_ipca_2020")["baixado_em"],
        "sha256": _prov("sidra_7060_ipca_2020")["sha256"],
        "arquivos": 2,
    }
    inc_alim = []
    for cod, id_, rot in (
        (
            "7170",
            "ipca_alimentacao_sidra",
            "IPCA, grupo alimentação e bebidas, acumulado jan-dez",
        ),
        (
            "7485",
            "ipca_energia_eletrica",
            "IPCA, energia elétrica residencial, acumulado jan-dez",
        ),
        ("7169", "ipca_geral_sidra", "IPCA geral, acumulado jan-dez"),
    ):
        an, inc = parse.acumulado_anual(mens.get(cod, {}))
        if cod == "7170":
            inc_alim = inc
        ctx.add(
            serie(
                id_,
                rot,
                "% a.a.",
                fi,
                "alta",
                an,
                f"Composição das 12 variações mensais; anos incompletos omitidos: {inc or 'nenhum'}. "
                "Série mensal do SIDRA começa em 2012.",
                2,
            ),
            an,
        )
    # alimentação desde 1991 via BCB SGS 1635
    try:
        fs = _fonte(
            "bcb_sgs_1635",
            "BCB/SGS 1635 — IPCA, alimentação e bebidas (variação mensal)",
        )
        sg = parse.sgs_mensal(_ler("bcb_sgs_1635", "sgs_1635.json"))
        an, inc = parse.acumulado_anual(sg)
        ctx.add(
            serie(
                "ipca_alimentacao_bcb",
                "IPCA, grupo alimentação e bebidas, acumulado jan-dez (BCB/SGS)",
                "% a.a.",
                fs,
                "alta",
                an,
                f"Composição das variações mensais do SGS 1635 (IBGE). Anos com mês faltando na fonte omitidos: {inc}. "
                "Anos até 1994 têm hiperinflação e não são comparáveis em nível.",
                2,
            ),
            an,
        )
        a2 = ctx.d.get("ipca_alimentacao_sidra", {})
        comuns = sorted(set(an) & set(a2))
        if comuns:
            ctx.validacao["ipca_alimentacao_sgs_vs_sidra"] = {
                "anos": [comuns[0], comuns[-1]],
                "max_dif_pp": round(max(abs(an[a] - a2[a]) for a in comuns), 3),
            }
    except Falta as e:
        ctx.lacuna("ipca_alimentacao_bcb", str(e))
    # alimentação relativa ao IPCA geral
    ag = ctx.d.get("ipca_alimentacao_bcb", {})
    ge = {}
    if SERIES_HIST.exists():
        sh = {
            s["id"]: s
            for s in json.loads(SERIES_HIST.read_text(encoding="utf-8"))["series"]
        }
        for sid, novo in (
            ("pib_var_real_ibge", "pib_total_var"),
            ("ipca", "ipca_geral_ipeadata"),
        ):
            if sid in sh:
                s = sh[sid]
                d = {int(a): v for a, v in s["pontos"]}
                ctx.add(
                    {
                        **{
                            k: s[k]
                            for k in (
                                "rotulo",
                                "unidade",
                                "cobertura",
                                "fonte",
                                "qualidade",
                                "notas",
                                "pontos",
                            )
                        },
                        "id": novo,
                        "notas": s["notas"]
                        + " (Série do projeto: web/public/data/series_historicas.json.)",
                    },
                    d,
                )
                if sid == "ipca":
                    ge = d
        if ge and ag:
            rel = {a: ag[a] - ge[a] for a in ag if a in ge and a >= 1996}
            ctx.add(
                serie(
                    "alimentacao_menos_ipca_geral",
                    "Inflação de alimentação menos IPCA geral (pp)",
                    "pp",
                    fi,
                    "alta",
                    rel,
                    "Isola o choque de preço de alimentos do nível geral de preços (1996 em diante, pós-Real).",
                    2,
                ),
                rel,
            )
    else:
        ctx.lacuna(
            "pib_total_var / ipca_geral_ipeadata",
            "web/public/data/series_historicas.json ausente: rode `sociolibero series build`.",
        )


# --------------------------------------------------------------------------- relações
def _leitura(r: float | None, ic, n: int, nome: str) -> str:
    if r is None:
        return f"Poucos pares ({n}) para estimar."
    a = abs(r)
    forca = (
        "muito fraca"
        if a < 0.2
        else "fraca"
        if a < 0.4
        else "moderada"
        if a < 0.6
        else "forte"
    )
    sinal = "positiva" if r > 0 else "negativa"
    zero = ic[0] <= 0 <= ic[1]
    base = f"Correlação {sinal} {forca} (r = {r:+.2f}; IC95 {ic[0]:+.2f} a {ic[1]:+.2f}; n = {n})."
    return base + (
        " O intervalo inclui zero: os dados não distinguem este padrão de ausência de relação."
        if zero
        else " O intervalo exclui zero, mas isto vale só para esta amostra e especificação; com dezenas de testes publicados, parte dos intervalos que excluem zero ocorre por acaso."
    )


def relacoes(ctx: Ctx) -> list[dict]:
    d = ctx.d
    cls = d.get("enso_classe", {})
    rels: list[dict] = []

    def corr(
        id_,
        cl,
        ec,
        lag,
        ini=None,
        fim=None,
        tend=False,
        limites="",
        rot_cl=None,
        rot_ec=None,
    ):
        if cl not in d or ec not in d:
            ctx.lacuna(f"relacao:{id_}", f"série ausente ({cl if cl not in d else ec})")
            return
        t, x, y = estat.alinhar(d[cl], d[ec], lag, ini, fim)
        if len(t) < 8:
            ctx.lacuna(f"relacao:{id_}", f"pares insuficientes (n={len(t)})")
            return
        est = estat.correlacao(t, x, y, tend)
        rels.append(
            {
                "id": id_,
                "clima": rot_cl or cl,
                "economia": rot_ec or ec,
                "periodo": [int(t[0]) + lag, int(t[-1]) + lag],
                "defasagem": f"clima no ano t, economia no ano t+{lag}"
                if lag
                else "mesmo ano",
                "estatistica": {
                    "metodo": "correlação de Pearson (Spearman em `spearman`); IC95 por bootstrap em blocos móveis de pares"
                    + ("; ambas as séries sem tendência linear" if tend else ""),
                    "valor": est["pearson"],
                    "ic95": est["ic95"],
                    "n": est["n"],
                    "spearman": est["spearman"],
                    "bloco": est["bloco"],
                    "bootstrap": est["bootstrap"],
                },
                "leitura": _leitura(est["pearson"], est["ic95"], est["n"], id_),
                "limites": (limites + " " if limites else "") + LIMITES_GERAIS,
                "series": [cl, ec],
            }
        )

    def evento(id_, ec, lag, ini, limites=""):
        if ec not in d or not cls:
            return
        anos = sorted(a for a in cls if (a + lag) in d[ec] and (a + lag) >= ini)
        y = np.array([d[ec][a + lag] for a in anos], float)
        g = np.array([cls[a] == "el_nino" for a in anos])
        est = estat.diferenca_medias(y, g)
        if est["valor"] is None:
            return
        rels.append(
            {
                "id": id_,
                "clima": "anos de El Niño (ONI da janela NDJ >= +0,5) contra os demais anos",
                "economia": ec,
                "periodo": [anos[0] + lag, anos[-1] + lag],
                "defasagem": f"El Niño começando em t, economia em t+{lag}"
                if lag
                else "mesmo ano",
                "estatistica": {
                    "metodo": "diferença de médias (anos de El Niño menos demais); IC95 por bootstrap em blocos",
                    "valor": est["valor"],
                    "ic95": est["ic95"],
                    "n": est["n"],
                    "n_el_nino": est["n_grupo"],
                    "media_el_nino": est["media_grupo"],
                    "media_demais": est["media_demais"],
                },
                "leitura": (
                    f"Média nos {est['n_grupo']} anos de El Niño {est['media_grupo']:+.2f} contra {est['media_demais']:+.2f} nos demais "
                    f"(diferença {est['valor']:+.2f}; IC95 {est['ic95'][0]:+.2f} a {est['ic95'][1]:+.2f})."
                    + (
                        " O intervalo inclui zero."
                        if est["ic95"][0] <= 0 <= est["ic95"][1]
                        else " O intervalo exclui zero nesta amostra."
                    )
                ),
                "limites": (limites + " " if limites else "")
                + "Poucos eventos (cada El Niño tem intensidade e impacto diferentes). "
                + LIMITES_GERAIS,
                "series": ["oni_pico_ndj", ec],
            }
        )

    N = "nino34_hadisst_pico"
    O = "oni_pico_ndj"
    for lag in (0, 1):
        corr(
            f"nino_pib_total_lag{lag}_1996",
            N,
            "pib_total_var",
            lag,
            1996,
            2025,
            limites="Quase 30 anos de PIB total, que mistura choques de política econômica muito maiores que o clima.",
        )
        corr(
            f"nino_pib_total_lag{lag}_longo",
            N,
            "pib_total_var",
            lag,
            1901,
            2025,
            limites="Período longo mistura regimes e mudança de metodologia do PIB (ver quebras em series_historicas.json); Niño 3.4 antes de ~1950 é reconstrução.",
        )
        corr(
            f"nino_pib_agro_lag{lag}",
            N,
            "pib_agro_var",
            lag,
            1996,
            2025,
            limites="Agropecuária brasileira é heterogênea: El Niño tende a ajudar o Sul (chuva) e prejudicar partes do Norte/Nordeste, o que pode anular no agregado.",
        )
        corr(
            f"nino_pib_servicos_lag{lag}",
            N,
            "pib_servicos_var",
            lag,
            1996,
            2025,
            limites="CONTROLE (placebo): não se espera relação direta; se aparecer, indica o quanto o acaso e o ciclo comum produzem.",
        )
        corr(
            f"nino_alimentacao_lag{lag}",
            N,
            "ipca_alimentacao_bcb",
            lag,
            1996,
            2025,
            limites="Inflação de alimentos depende de câmbio, commodities internacionais e política; desde 1996 só ~30 pontos.",
        )
        corr(
            f"nino_alim_relativa_lag{lag}",
            N,
            "alimentacao_menos_ipca_geral",
            lag,
            1996,
            2025,
        )
        corr(
            f"nino_energia_ipca_lag{lag}",
            N,
            "ipca_energia_eletrica",
            lag,
            2012,
            2025,
            limites="Só 14 anos; o IPCA de energia é dominado por reajustes tarifários e bandeiras.",
        )
        corr(
            f"chuva_agro_lag{lag}",
            "chuva_brasil_cru_anomalia_pct",
            "pib_agro_var",
            lag,
            1996,
            2024,
            limites="Chuva média nacional não representa o ano agrícola de cada região.",
        )
        corr(
            f"temp_agro_lag{lag}",
            "temp_brasil_cru_anomalia",
            "pib_agro_var",
            lag,
            1996,
            2024,
            tend=True,
            limites="Tendência linear removida de ambas.",
        )
        corr(
            f"chuva_alim_relativa_lag{lag}",
            "chuva_brasil_cru_anomalia_pct",
            "alimentacao_menos_ipca_geral",
            lag,
            1996,
            2024,
        )
    for lag in (0, 1):
        corr(
            f"nino_chuva_brasil_lag{lag}",
            N,
            "chuva_brasil_cru_anomalia_pct",
            lag,
            1901,
            2024,
            limites="Teleconexão conhecida é regional (Nordeste seco, Sul úmido); na média nacional tende a se diluir.",
        )
    for s, nm in (("ne", "Nordeste"), ("n", "Norte"), ("se", "Sudeste/Centro-Oeste")):
        corr(
            f"nino_ena_{s}_lag0",
            O,
            f"ena_{s}_anual",
            0,
            2000,
            2025,
            limites=f"ENA {nm}: janela 2000-2025 tem poucos eventos de ENSO.",
        )
    corr(
        "ena_se_cmo_se_lag0",
        "ena_se_anual",
        "cmo_se_anual",
        0,
        2005,
        2025,
        limites="CMO responde também à demanda, ao parque térmico e a regras de despacho.",
    )
    corr(
        "ear_nov_se_cmo_se_lag1",
        "ear_se_fim_nov",
        "cmo_se_anual",
        1,
        2005,
        2026,
        limites="Armazenamento no fim de novembro condiciona o despacho térmico do ano seguinte.",
    )
    corr(
        "ena_se_ipca_energia_lag0",
        "ena_se_anual",
        "ipca_energia_eletrica",
        0,
        2012,
        2025,
        limites="14 pontos; tarifas só repassam hidrologia com defasagem regulatória (bandeiras, reajustes).",
    )
    corr(
        "cmo_se_ipca_energia_lag1",
        "cmo_se_anual",
        "ipca_energia_eletrica",
        1,
        2012,
        2025,
        limites="14 pontos.",
    )
    corr(
        "ena_n_focos_amazonia_lag0",
        "ena_n_anual",
        "focos_amazonia_anual",
        0,
        2003,
        2025,
        tend=True,
        limites="ENA do Norte como proxy hidrológico da Amazônia; focos também seguem desmatamento e política (fiscalização).",
    )
    for lag in (0, 1):
        corr(
            f"nino_focos_amazonia_lag{lag}",
            O,
            "focos_amazonia_anual",
            lag,
            2003,
            2025,
            tend=True,
        )
    evento("el_nino_vs_demais_pib_agro", "pib_agro_var", 0, 1996)
    evento("el_nino_vs_demais_pib_agro_lag1", "pib_agro_var", 1, 1996)
    evento("el_nino_vs_demais_alim_relativa", "alimentacao_menos_ipca_geral", 0, 1996)
    evento(
        "el_nino_vs_demais_pib_total_1951",
        "pib_total_var",
        0,
        1951,
        limites="PIB total desde 1951 mistura ciclos de política (Plano Cruzado, Collor, 2015-16).",
    )
    return rels


# --------------------------------------------------------------------------- curadoria
def _curadoria(nome: str) -> dict:
    p = CURADORIA / nome
    if not p.exists():
        raise Falta(f"curadoria/{nome} ausente")
    return json.loads(p.read_text(encoding="utf-8"))


def _anos_do_episodio(ano) -> list[int]:
    s = str(ano).replace("–", "-")
    if "-" in s:
        a, b = s.split("-")[:2]
        if len(b) == 2:
            b = a[:2] + b
        return list(range(int(a), int(b) + 1))
    return [int(s)]


def episodios(ctx: Ctx) -> list[dict]:
    try:
        c = _curadoria("episodios.json")
    except Falta as e:
        ctx.lacuna("episodios", str(e))
        return []
    ctx.extra["secas_nordeste"] = c.get("secas_nordeste", [])
    for l in c.get("lacunas", []):
        ctx.lacuna("episodio", l)
    anuais = {
        k: v for k, v in ctx.d.items() if k != "enso_classe" and isinstance(v, dict)
    }
    out = []
    for e in c.get("episodios", []):
        anos = [a for a in _anos_do_episodio(e["ano"]) if 1850 <= a <= 2030]
        ind = {}
        for a in anos:
            vals = {
                k: round(float(v[a]), 2)
                for k, v in anuais.items()
                if a in v and not k.endswith("_pib_total")
            }
            if vals:
                ind[str(a)] = vals
        out.append(
            {
                **e,
                "indicadores_da_serie": ind,
                "nota_indicadores": "Valores anuais das séries deste arquivo nos anos do episódio (quando existem); mostram contexto, não efeito causal.",
            }
        )
    return out


def cenarios(ctx: Ctx) -> tuple[list[dict], list[dict]]:
    cen: list[dict] = []
    custos: list[dict] = []
    for arq in ("ipcc_ar6.json", "cenarios.json"):
        try:
            c = _curadoria(arq)
        except Falta as e:
            ctx.lacuna(f"cenarios_futuros:{arq}", str(e))
            continue
        for l in c.get("lacunas", []):
            ctx.lacuna(f"cenarios:{arq}", l)
        cen += c.get("cenarios_futuros", [])
        custos += c.get("custos_economicos", [])
    return cen, custos


# --------------------------------------------------------------------------- build
def build(out: Path = OUT, n_macro: int = 2000) -> dict:
    ctx = Ctx()
    for nome, fn in (
        ("enso", c_enso),
        ("temperatura_e_chuva", c_temperatura),
        ("focos_de_calor", c_fogo),
        ("deter_prodes", c_deter),
        ("ons_energia", c_ons),
        ("economia", c_economia),
    ):
        tentar(ctx, nome, fn)
    rels = relacoes(ctx)
    eps = episodios(ctx)
    cen, custos = cenarios(ctx)
    n = len(rels)
    excl = [
        r["id"]
        for r in rels
        if r["estatistica"]["ic95"]
        and not (r["estatistica"]["ic95"][0] <= 0 <= r["estatistica"]["ic95"][1])
    ]
    resumo_testes = {
        "testes_publicados": n,
        "ic95_exclui_zero": len(excl),
        "ids_ic95_exclui_zero": excl,
        "esperado_por_acaso_se_nenhuma_relacao_real": round(0.05 * n, 1),
        "leitura": (
            "Todos os testes feitos estão publicados. Com ~5% de falso positivo por teste, parte dos intervalos "
            "que excluem zero é esperada por puro acaso; testes sobre as mesmas séries também não são independentes."
        ),
    }
    try:
        integ = macro.integracao(n_macro)
    except Exception as e:  # noqa: BLE001
        integ = {"erro": repr(e)}
        ctx.lacuna("integracao_macro", repr(e))
    res = {
        "meta": {
            "gerado_em": datetime.now(UTC).isoformat(timespec="seconds"),
            "aviso": AVISO,
            "lacunas": ctx.lacunas,
            "validacao": ctx.validacao,
            "resumo_testes": resumo_testes,
        },
        "series": ctx.series,
        "relacoes": rels,
        "episodios": eps,
        "cenarios_futuros": cen,
        "custos_economicos": custos,
        "integracao_macro": integ,
        "enso_episodios": ctx.extra.get("enso_episodios", []),
        "secas_nordeste": ctx.extra.get("secas_nordeste", []),
        "tendencias": ctx.extra.get("tendencias", []),
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        json.dumps(res, ensure_ascii=False, indent=1, default=float), encoding="utf-8"
    )
    res["resumo"] = {
        "series": {s["id"]: s["cobertura"] for s in ctx.series},
        "n_relacoes": n,
        "ic95_exclui_zero": excl,
        "lacunas": [f"{l['item']}: {l['motivo'][:90]}" for l in ctx.lacunas],
        "validacao": ctx.validacao,
    }
    return res

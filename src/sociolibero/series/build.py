"""Séries históricas anuais do Brasil → `web/public/data/series_historicas.json`.

Só entra série lida de arquivo baixado por `ingest.py` (com SHA-256 em PROVENIENCIA.json). Nada vem
de memória: o que não tem fonte aberta acessível vai para `meta.lacunas`. Valor ausente = ponto
omitido; nenhuma interpolação. Metodologias diferentes ficam em séries separadas ou com `quebras`.

Leitura segura: JSON/CSV/Stata por parsers de dados (json, csv, pandas.read_stata); nada é executado.
"""

from __future__ import annotations

import csv
import json
import math
from collections import Counter, defaultdict
from collections.abc import Callable
from datetime import UTC, datetime
from itertools import pairwise
from pathlib import Path

RAW = Path("data/raw")
OUT = Path("web/public/data/series_historicas.json")

AVISO = (
    "Séries de fontes e metodologias distintas: compare níveis só dentro da mesma série. "
    "Pontos ausentes foram omitidos (nada interpolado). `quebras` marcam mudança de pesquisa, "
    "método ou estimativa; não leia tendência através de uma quebra sem ler `notas`. "
    "Séries anteriores a 1900 e estimativas de longo prazo (Maddison, WID, expectativa de vida "
    "pré-1950, tráfico negreiro) têm incerteza grande e são reconstruções, não censos anuais."
)

CICLOS = [
    ("pau-brasil", 1500, 1530),
    ("acucar", 1530, 1700),
    ("ouro-diamantes", 1700, 1780),
    ("agroexportacao-imperial", 1808, 1850),
    ("cafe-escravidao-abolicao", 1850, 1889),
    ("borracha-cafe-republica-velha", 1889, 1930),
    ("industrializacao-vargas", 1930, 1945),
    ("desenvolvimentismo", 1946, 1964),
    ("milagre-endividamento", 1964, 1980),
    ("decada-perdida-hiperinflacao", 1980, 1994),
    ("estabilizacao-real", 1994, 2002),
    ("boom-commodities-inclusao", 2003, 2014),
    ("recessao-ajuste-polarizacao", 2015, 2022),
    ("retomada-incerteza", 2023, 2026),
]

BRASIL_SV = (
    50100,
    50200,
    50300,
    50400,
    50500,
)  # Amazonia, Bahia, Pernambuco, Sudeste, Outro (rótulos do .sav)


class Falta(Exception):
    """Fonte não baixada ou sem dado utilizável → vira lacuna, não erro."""


# ----------------------------------------------------------------------------------------------
# Leitura de raw
# ----------------------------------------------------------------------------------------------
def _prov(pasta: str) -> dict:
    p = RAW / pasta / "PROVENIENCIA.json"
    if not p.exists():
        raise Falta(f"{pasta} não baixado (rode `sociolibero series baixar`)")
    return json.loads(p.read_text(encoding="utf-8"))


def _json(pasta: str, arq: str):
    _prov(pasta)
    return json.loads((RAW / pasta / arq).read_text(encoding="utf-8"))


def _fonte(pasta: str, nome: str, codigo: str, url: str | None = None) -> dict:
    m = _prov(pasta)
    return {
        "nome": nome,
        "url": url or m["arquivos"][0]["url"],
        "baixado_em": m["baixado_em"],
        "sha256": m["sha256"],
        "codigo_serie": codigo,
    }


def _ipea_rows(codigo: str) -> list[dict]:
    d = _json(f"ipeadata_{codigo}", "valores.json")["value"]
    if any(
        r["NIVNOME"] == "Brasil" for r in d
    ):  # séries com UF/região/município: só Brasil
        d = [r for r in d if r["NIVNOME"] == "Brasil"]
    return d


def _ipea(codigo: str) -> list[tuple[int, float]]:
    pts = [
        (int(r["VALDATA"][:4]), float(r["VALVALOR"]))
        for r in _ipea_rows(codigo)
        if r["VALVALOR"] is not None
    ]
    return sorted(pts)


def _ipea_meta(codigo: str) -> dict:
    return _json(f"ipeadata_{codigo}", "metadados.json")["value"][0]


def _fonte_ipea(codigo: str) -> dict:
    m = _ipea_meta(codigo)
    return _fonte(
        f"ipeadata_{codigo}",
        f"Ipeadata ({m.get('FNTSIGLA') or m.get('FNTNOME')}) — {m['SERNOME']}",
        codigo,
        f"http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='{codigo}')",
    )


def _wb(ind: str) -> list[tuple[int, float]]:
    d = _json(f"worldbank_{ind}", "serie.json")
    return sorted(
        (int(r["date"]), float(r["value"])) for r in d[1] if r["value"] is not None
    )


def _fonte_wb(ind: str, org: str) -> dict:
    return _fonte(
        f"worldbank_{ind}",
        f"Banco Mundial, World Development Indicators ({org})",
        ind,
        f"https://api.worldbank.org/v2/country/BRA/indicator/{ind}",
    )


def _sem_repeticao(
    pts: list[tuple[int, float]],
) -> tuple[list[tuple[int, float]], list[int]]:
    """Remove pontos idênticos ao anterior em ano consecutivo (carry-forward). Retorna (pts, anos removidos)."""
    out: list[tuple[int, float]] = []
    removidos: list[int] = []
    ant: tuple[int, float] | None = None
    for a, v in pts:
        if ant is not None and ant[0] == a - 1 and ant[1] == v:
            removidos.append(a)
        else:
            out.append((a, v))
        ant = (a, v)
    return out, removidos


def _faixas(anos: list[int]) -> str:
    if not anos:
        return ""
    g: list[list[int]] = [[anos[0], anos[0]]]
    for a in anos[1:]:
        if a == g[-1][1] + 1:
            g[-1][1] = a
        else:
            g.append([a, a])
    return ", ".join(str(x) if x == y else f"{x}-{y}" for x, y in g)


# ----------------------------------------------------------------------------------------------
# Séries (cada função devolve um dict; Falta ⇒ lacuna)
# ----------------------------------------------------------------------------------------------
def s_maddison() -> dict:
    import pandas as pd

    _prov("maddison_mpd2023")
    d = pd.read_stata(RAW / "maddison_mpd2023" / "maddison2023_web.dta")
    b = d[(d.countrycode == "BRA") & (d.year >= 1820)].dropna(subset=["gdppc"])
    pts = [(int(a), float(v)) for a, v in zip(b.year, b.gdppc, strict=True)]
    anos = [a for a, _ in pts]
    ancoras = sorted({x for a, c in pairwise(anos) if c - a > 1 for x in (a, c)})
    iguais = [(a, c) for a, c in pairwise(pts) if a[1] == c[1]]
    return {
        "id": "pib_pc_maddison",
        "rotulo": "PIB per capita real, longo prazo (Maddison Project Database 2023)",
        "unidade": "US$ internacionais de 2011 (PPC)",
        "fonte": _fonte(
            "maddison_mpd2023",
            "Maddison Project Database 2023 (Bolt & van Zanden 2024), Dataverse NL",
            "gdppc (countrycode=BRA)",
            "https://doi.org/10.34894/INZBF2",
        ),
        "qualidade": "media",
        "quebras": [
            {
                "ano": 1851,
                "motivo": "antes, só anos-âncora (1820, 1850); a série anual começa em 1851",
            }
        ],
        "notas": (
            "Maddison Project Database 2023 (última versão publicada no Dataverse; cobre até 2022). "
            "Unidade 'Real GDP per capita in 2011$' conforme a planilha oficial do mesmo release "
            "(o .dta baixado não traz rótulo de unidade). Anos-âncora sem observação anual: "
            f"{', '.join(map(str, ancoras))}; nesses anos-âncora o valor é idêntico na fonte "
            f"({', '.join(f'{a[0]}-{c[0]}' for a, c in iguais)}: sem variação estimada, não observação). Reconstrução histórica: "
            "incerteza alta antes de 1900; cite os trabalhos originais do MPD ao exibir."
        ),
        "pontos": pts,
    }


def s_pib_real() -> dict:
    pts = _ipea("SCN10_PIBP10")
    m = _ipea_meta("SCN10_PIBP10")
    return {
        "id": "pib_real_ibge",
        "rotulo": "PIB real (preços de 2010), Contas Nacionais encadeadas",
        "unidade": "R$ milhões de 2010",
        "fonte": _fonte_ipea("SCN10_PIBP10"),
        "qualidade": "media",
        "quebras": [
            {
                "ano": 1901,
                "motivo": "1901-1920: Haddad (1980), produto total reformulado; 1900 é a base do encadeamento",
            },
            {"ano": 1921, "motivo": "1921-1947: Haddad (1978) apud Abreu (1992)"},
            {
                "ano": 1948,
                "motivo": "1948-1990: Sistema de Contas Nacionais Consolidadas",
            },
            {"ano": 1991, "motivo": "SCN Referência 1985 (1991-1995)"},
            {
                "ano": 1996,
                "motivo": "1996-2000 estimado a partir das Contas Trimestrais Referência 2010",
            },
            {
                "ano": 2001,
                "motivo": "SCN Referência 2010 (2001 em diante); últimos anos preliminares",
            },
        ],
        "notas": (
            "Série encadeada pelo Ipeadata a partir de fontes distintas (ver quebras e o comentário "
            "oficial da série: "
            + " ".join((m["SERCOMENTARIO"] or "").split())[:600]
            + "). "
            "Não é um PIB per capita; para renda por pessoa de longo prazo use Maddison."
        ),
        "pontos": pts,
    }


def s_pib_var() -> dict:
    return {
        "id": "pib_var_real_ibge",
        "rotulo": "PIB: variação real anual",
        "unidade": "% a.a.",
        "fonte": _fonte_ipea("SCN10_PIBG10"),
        "qualidade": "media",
        "quebras": [
            {"ano": 1948, "motivo": "ver pib_real_ibge: fontes encadeadas"},
            {"ano": 1991, "motivo": "ver pib_real_ibge"},
            {"ano": 1996, "motivo": "ver pib_real_ibge"},
            {"ano": 2001, "motivo": "ver pib_real_ibge"},
        ],
        "notas": "IBGE/SCN via Ipeadata (encadeada); mesma ressalva de pib_real_ibge.",
        "pontos": _ipea("SCN10_PIBG10"),
    }


def s_pib_pc_var_ibge() -> dict:
    d = _json("sidra_6784_pib", "pib.json")[1:]
    pts = sorted(
        (int(r["D3C"]), float(r["V"]))
        for r in d
        if r["D2C"] == "9814" and r["V"] not in ("-", "X", "..", "...")
    )
    return {
        "id": "pib_pc_var_real_ibge",
        "rotulo": "PIB per capita: variação real anual (IBGE, Contas Nacionais Anuais)",
        "unidade": "% a.a.",
        "fonte": _fonte(
            "sidra_6784_pib",
            "IBGE, SIDRA tabela 6784 (Contas Nacionais Anuais), variável 9814",
            "6784/v9814",
        ),
        "qualidade": "alta",
        "quebras": [],
        "notas": "Variação em volume do PIB per capita (preços do ano anterior). A tabela 6784 vai até o último ano fechado das Contas Anuais.",
        "pontos": pts,
    }


def s_pib_pc_ppc() -> dict:
    return {
        "id": "pib_pc_ppc_bm",
        "rotulo": "PIB per capita, PPC (Banco Mundial)",
        "unidade": "US$ internacionais constantes (PPC, ano-base do WDI)",
        "fonte": _fonte_wb("NY.GDP.PCAP.PP.KD", "compilação do Banco Mundial/OCDE/ICP"),
        "qualidade": "alta",
        "quebras": [],
        "notas": "Ano-base e PPC são os do WDI na data do download (reestimados a cada rodada do ICP): não encadear com Maddison (US$ 2011).",
        "pontos": _wb("NY.GDP.PCAP.PP.KD"),
    }


def s_ipca() -> dict:
    return {
        "id": "ipca",
        "rotulo": "Inflação: IPCA (dez/dez)",
        "unidade": "% a.a.",
        "fonte": _fonte_ipea("PRECOS_IPCAG"),
        "qualidade": "alta",
        "quebras": [
            {
                "ano": 1994,
                "motivo": "Plano Real (nova moeda, fim da hiperinflação): valores até 1994 e de 1995 em diante têm ordens de grandeza muito diferentes",
            },
        ],
        "notas": "Variação do índice de dezembro sobre dezembro (cálculo do Ipeadata sobre o IPCA/IBGE). Agosto/1991 foi calculado pelo IBGE como média geométrica (ver fonte). Níveis de hiperinflação não são comparáveis em escala linear com os de hoje.",
        "pontos": _ipea("PRECOS_IPCAG"),
    }


def s_igpdi() -> dict:
    return {
        "id": "igp_di",
        "rotulo": "Inflação: IGP-DI (FGV)",
        "unidade": "% a.a.",
        "fonte": _fonte_ipea("IGP_IGPDIG"),
        "qualidade": "alta",
        "quebras": [],
        "notas": "Variação anual do IGP-DI (60% IPA, 30% IPC, 10% INCC), FGV; é índice de preços ao produtor/atacado em boa parte, não só consumidor. Cobre a partir de 1945.",
        "pontos": _ipea("IGP_IGPDIG"),
    }


def s_salario_minimo() -> dict:
    rows = _ipea_rows("GAC12_SALMINRE12")
    por_ano: dict[int, list[float]] = defaultdict(list)
    for r in rows:
        if r["VALVALOR"] is not None:
            por_ano[int(r["VALDATA"][:4])].append(float(r["VALVALOR"]))
    pts = sorted((a, sum(v) / 12) for a, v in por_ano.items() if len(v) == 12)
    parciais = sorted(a for a, v in por_ano.items() if len(v) != 12)
    ultimo = max(r["VALDATA"] for r in rows)[:7]
    return {
        "id": "salario_minimo_real",
        "rotulo": "Salário mínimo real (média anual)",
        "unidade": f"R$ constantes de {ultimo[5:]}/{ultimo[:4]}",
        "fonte": _fonte_ipea("GAC12_SALMINRE12"),
        "qualidade": "alta",
        "quebras": [
            {
                "ano": 1984,
                "motivo": "até maio/1984 valem os salários mínimos regionais (série usa o maior vigente); unificação nacional em maio de 1984",
            },
        ],
        "notas": (
            "Média aritmética dos 12 valores mensais do 'Salário mínimo real' do Ipea (nominal MTE deflacionado "
            "por índices encadeados pelo Ipea, em R$ do último mês da série). Só anos com 12 meses; anos "
            f"incompletos omitidos: {_faixas(parciais) or 'nenhum'}. A média anual dilui reajustes no meio do ano."
        ),
        "pontos": pts,
    }


def s_gini() -> dict:
    return {
        "id": "gini_renda_dom_pc",
        "rotulo": "Gini da renda domiciliar per capita (todas as fontes)",
        "unidade": "índice 0-100",
        "fonte": _fonte_ipea("PNADS_GINI"),
        "qualidade": "media",
        "quebras": [
            {
                "ano": 2012,
                "motivo": "PNAD (até 2011) → PNAD Contínua (2012+); Ipea multiplica a PNAD por um fator que iguala 2012 (Souza & Hecksher 2025): nível encadeado, não observação direta",
            },
        ],
        "notas": "Série do Ipea, 'todas as fontes' de renda. Sem PNAD em anos de Censo (2000, 2010) e antes de 1995 não há série nesta fonte. Para o Gini direto do IBGE (PNADC, só 2012+) ver Ipeadata PNADCA_GINIUF (não incluído).",
        "pontos": _ipea("PNADS_GINI"),
    }


def s_desocupacao() -> dict:
    return {
        "id": "desocupacao_pnadc",
        "rotulo": "Taxa de desocupação (PNAD Contínua)",
        "unidade": "% da força de trabalho",
        "fonte": _fonte_ipea("PAN_TDESOC"),
        "qualidade": "alta",
        "quebras": [],
        "notas": "Média anual da série mensal da PNAD Contínua (IBGE), desde 2012 (o primeiro ano entra só se houver 12 meses). Séries anteriores (PME, PNAD) têm outra metodologia e não foram emendadas.",
        "pontos": _ipea("PAN_TDESOC"),
    }


def _pobreza_ibge(codigo: str, rot: str, linha: str) -> dict:
    meta = _ipea_meta(codigo)
    return {
        "id": {
            "PNADCA_TXPIUF": "pobreza_ppc300_ibge",
            "PNADCA_TXPNUF": "pobreza_ppc830_ibge",
        }[codigo],
        "rotulo": rot,
        "unidade": "% da população",
        "fonte": _fonte_ipea(codigo),
        "qualidade": "media",
        "quebras": [
            {
                "ano": 2020,
                "motivo": "2020-2022: quintas entrevistas da PNADC (COVID); demais anos: primeiras entrevistas",
            },
            {"ano": 2023, "motivo": "volta às primeiras entrevistas"},
            {
                "ano": 2025,
                "motivo": "valor estimado pelo Ipeadata a partir do IBGE (Rendimentos de todas as fontes 2025), não tabulação direta",
            },
        ],
        "notas": f"IBGE/PNADC, {linha} (PPC 2021, consumo final). Comentário da fonte: "
        + " ".join(
            (meta["SERCOMENTARIO"] or "").replace("<b>", "").replace("</b>", "").split()
        )[:420],
        "pontos": _ipea(codigo),
    }


def s_pobreza_ibge_300() -> dict:
    return _pobreza_ibge(
        "PNADCA_TXPIUF",
        "Pobreza extrema: abaixo de US$ 3,00/dia PPC 2021 (IBGE/PNADC)",
        "linha de US$ 3,00/dia",
    )


def s_pobreza_ibge_830() -> dict:
    return _pobreza_ibge(
        "PNADCA_TXPNUF",
        "Pobreza: abaixo de US$ 8,30/dia PPC 2021 (IBGE/PNADC, linha nacional ODS)",
        "linha de US$ 8,30/dia",
    )


def _pobreza_ipea(codigo: str, rot: str, sid: str) -> dict:
    return {
        "id": sid,
        "rotulo": rot,
        "unidade": "% da população",
        "fonte": _fonte_ipea(codigo),
        "qualidade": "media",
        "quebras": [
            {
                "ano": 2012,
                "motivo": "PNAD (até 2011) → PNAD Contínua; Ipea encadeia multiplicando a PNAD por fator que iguala 2012 (Souza & Hecksher 2025)",
            },
        ],
        "notas": "Renda domiciliar per capita, linha em PPC 2021 (ver código da série). Série encadeada pelo Ipea; não misturar com a série IBGE/PNADC homônima sem ler as quebras.",
        "pontos": _ipea(codigo),
    }


def s_pobreza_ipea_300() -> dict:
    return _pobreza_ipea(
        "PNADS_PERCPOBRE300",
        "Pobreza extrema: abaixo de US$ 3,00/dia PPC 2021 (Ipea, encadeada)",
        "pobreza_ppc300_ipea",
    )


def s_pobreza_ipea_830() -> dict:
    return _pobreza_ipea(
        "PNADS_PERCPOBRE830",
        "Pobreza: abaixo de US$ 8,30/dia PPC 2021 (Ipea, encadeada)",
        "pobreza_ppc830_ipea",
    )


def s_inseg_ibge() -> dict:
    meta = _ipea_meta("PNAD_IAGRV")
    return {
        "id": "inseg_alimentar_grave_ibge",
        "rotulo": "Domicílios com insegurança alimentar grave (IBGE, EBIA)",
        "unidade": "% dos domicílios",
        "fonte": _fonte_ipea("PNAD_IAGRV"),
        "qualidade": "media",
        "quebras": [
            {
                "ano": 2013,
                "motivo": "pontos de 2004-2013 e de 2018/2023 podem vir de pesquisas distintas; o Ipeadata não discrimina a pesquisa de cada ponto (verificar no IBGE antes de comparar)",
            }
        ],
        "notas": (
            "Escala EBIA (Escala Brasileira de Insegurança Alimentar), IBGE; unidade = domicílios; "
            "só anos de levantamento (2004, 2009, 2013, 2018, 2023), não anual. Não comparável com FIES/FAO (pessoas) "
            "nem com o VIGISAN/Rede PENSSAN. Comentário da fonte: "
            + " ".join((meta["SERCOMENTARIO"] or "").split())[:400]
        ),
        "pontos": _ipea("PNAD_IAGRV"),
    }


def s_inseg_fao() -> dict:
    return {
        "id": "inseg_alimentar_grave_fao",
        "rotulo": "Prevalência de insegurança alimentar grave, pessoas (FAO, escala FIES)",
        "unidade": "% da população",
        "fonte": _fonte_wb("SN.ITK.SVFI.ZS", "FAO, escala FIES; via Banco Mundial"),
        "qualidade": "baixa",
        "quebras": [],
        "notas": "Escala FIES (FAO, pessoas) via WDI: domicílio com ao menos um adulto exposto a experiências graves (reduzir porções, pular refeições, passar fome, ficar um dia sem comer por falta de recursos; definição do próprio WDI). Metodologia e unidade diferentes da EBIA/IBGE (domicílios) e do VIGISAN; os relatórios SOFI revisam estimativas. Só 2015-2023 nesta fonte.",
        "pontos": _wb("SN.ITK.SVFI.ZS"),
    }


def s_vida_owid() -> dict:
    p = _prov("owid_life_expectancy")
    pts: list[tuple[int, float]] = []
    with (RAW / "owid_life_expectancy" / "life-expectancy.csv").open(
        encoding="utf-8", newline=""
    ) as f:
        for r in csv.DictReader(f):
            if r["Code"] == "BRA":
                pts.append(
                    (
                        int(r["Year"]),
                        float(
                            r[next(k for k in r if k not in ("Entity", "Code", "Year"))]
                        ),
                    )
                )
    pts.sort()
    return {
        "id": "expectativa_vida_owid",
        "rotulo": "Expectativa de vida ao nascer, longo prazo (Our World in Data)",
        "unidade": "anos",
        "fonte": _fonte(
            "owid_life_expectancy",
            "Our World in Data — Life expectancy (Zijdeman et al. 2015; HMD 2025; UN WPP 2024)",
            "grapher/life-expectancy",
            p["arquivos"][0]["url"],
        ),
        "qualidade": "media",
        "quebras": [
            {
                "ano": 1950,
                "motivo": "até 1940: pontos decenais com valores inteiros; de 1950: ONU WPP 2024, anual (metadado do OWID)",
            },
        ],
        "notas": "Compilação do OWID (metadado: Zijdeman et al. 2015 e HMD 2025 antes de 1950; ONU WPP 2024 depois). A fonte de cada ponto está na planilha citada no metadado do gráfico; os pontos pré-1950 do Brasil são decenais e inteiros, ou seja, estimativa grosseira.",
        "pontos": pts,
    }


def s_vida_ibge() -> dict:
    return {
        "id": "expectativa_vida_ibge",
        "rotulo": "Expectativa de vida ao nascer (IBGE, projeções)",
        "unidade": "anos",
        "fonte": _fonte_ipea("DEPIS_ESVIDA"),
        "qualidade": "alta",
        "quebras": [],
        "notas": "Estimativa anual do IBGE/DEPIS (tábuas de mortalidade e projeção da população, revisão em vigor na data do download).",
        "pontos": _ipea("DEPIS_ESVIDA"),
    }


def s_tmi_bm() -> dict:
    return {
        "id": "mortalidade_infantil_bm",
        "rotulo": "Mortalidade infantil (ONU IGME via Banco Mundial)",
        "unidade": "óbitos <1 ano por mil nascidos vivos",
        "fonte": _fonte_wb("SP.DYN.IMRT.IN", "UN IGME"),
        "qualidade": "alta",
        "quebras": [],
        "notas": "Estimativa do Grupo Interagências da ONU (UN IGME) ajustada a registros e inquéritos; difere da estimativa do IBGE.",
        "pontos": _wb("SP.DYN.IMRT.IN"),
    }


def s_tmi_ibge() -> dict:
    return {
        "id": "mortalidade_infantil_ibge",
        "rotulo": "Mortalidade infantil (IBGE, projeções)",
        "unidade": "óbitos <1 ano por mil nascidos vivos",
        "fonte": _fonte_ipea("DEPIS_TMI"),
        "qualidade": "alta",
        "quebras": [],
        "notas": "Estimativa anual do IBGE/DEPIS desde 2000 (revisão de 2018, segundo o Ipeadata), via Ipeadata.",
        "pontos": _ipea("DEPIS_TMI"),
    }


def s_analfabetismo_censos() -> dict:
    meta = _ipea_meta("TXA15M")
    pts = _ipea("TXA15M") + _ipea("TXA15M7091")  # 1900, 1920 | 1970, 1980, 1991
    f = _fonte_ipea("TXA15M")
    f["codigo_serie"] = "TXA15M (1900, 1920) + TXA15M7091 (1970-1991)"
    return {
        "id": "analfabetismo_15mais_censos_hist",
        "rotulo": "Taxa de analfabetismo, 15 anos ou mais, Censos históricos (1900-1991)",
        "unidade": "% da população de 15+",
        "fonte": f,
        "qualidade": "media",
        "quebras": [
            {
                "ano": 1970,
                "motivo": "1900-1920: série IBGE (TXA15M); 1970-1991: Ipea sobre Censos ('não sabe ler nem escrever um bilhete simples'); conceitos podem diferir",
            }
        ],
        "notas": (
            "Só pontos censitários (1900, 1920, 1970, 1980, 1991); 1872-1890 só têm taxa para toda a população, "
            "e 1930-1960 não estão nestas séries do Ipeadata (lacuna, não interpolada). Ambas as séries estão "
            "INATIVAS no Ipeadata (histórico mantido). Nota da fonte: "
            + " ".join((meta["SERCOMENTARIO"] or "").split())[:260]
        ),
        "pontos": sorted(pts),
    }


def s_analfabetismo_atlas() -> dict:
    return {
        "id": "analfabetismo_15mais_censos_atlas",
        "rotulo": "Taxa de analfabetismo, 15 anos ou mais, Censos 1991-2022 (Atlas DH / IBGE)",
        "unidade": "% da população de 15+",
        "fonte": _fonte_ipea("ADH_T_ANALF15M"),
        "qualidade": "alta",
        "quebras": [],
        "notas": "Censos Demográficos 1991, 2000, 2010 e 2022 (nível Brasil da série do Atlas do Desenvolvimento Humano, via Ipeadata). O ponto de 1991 difere do de 1991 da série histórica (outra apuração): não emendar.",
        "pontos": _ipea("ADH_T_ANALF15M"),
    }


def s_analfabetismo_pnadc() -> dict:
    return {
        "id": "analfabetismo_15mais_pnadc",
        "rotulo": "Taxa de analfabetismo, 15 anos ou mais (PNAD Contínua)",
        "unidade": "% da população de 15+",
        "fonte": _fonte_ipea("PNADCA_TXA15MUF"),
        "qualidade": "alta",
        "quebras": [],
        "notas": "PNADC/IBGE (Brasil); começa em 2016 nesta fonte. Não emendar com a série de censos sem ler as notas.",
        "pontos": _ipea("PNADCA_TXA15MUF"),
    }


def s_homicidios() -> dict:
    return {
        "id": "homicidios_100mil",
        "rotulo": "Taxa de homicídios por 100 mil habitantes (Ipea/Atlas da Violência, SIM/DATASUS)",
        "unidade": "por 100 mil habitantes",
        "fonte": _fonte_ipea("AVIOL12_THOMIC"),
        "qualidade": "media",
        "quebras": [
            {
                "ano": 1996,
                "motivo": "1979-1995 classificados pela CID-9; de 1996 em diante, CID-10 (nota do Ipeadata)",
            },
        ],
        "notas": (
            "Nível Brasil da série municipal do Ipeadata (AVIOL12_THOMIC; MS/SVS/SIM; óbitos por residência; população IBGE). "
            "ATENÇÃO: o texto de comentário dessa série no Ipeadata cita códigos de suicídio (X60-X84), aparente erro de "
            "cópia; os valores têm ordem de grandeza de homicídios e foram conferidos contra a contagem AVIOL12_HOMIC dividida "
            "pela população do Maddison (ver meta.validacao.conferencias). Quedas bruscas (ex. 2003→2004, 2018→2019) "
            "podem refletir mudanças de registro ou de classificação de mortes violentas de causa indeterminada; "
            "não verificado nesta ingestão."
        ),
        "pontos": _ipea("AVIOL12_THOMIC"),
    }


def s_homicidios_n() -> dict:
    return {
        "id": "homicidios_numero",
        "rotulo": "Número de homicídios (Ipea/Atlas da Violência, SIM/DATASUS)",
        "unidade": "óbitos por ano",
        "fonte": _fonte_ipea("AVIOL12_HOMIC"),
        "qualidade": "media",
        "quebras": [{"ano": 1996, "motivo": "CID-9 (1979-1995) → CID-10"}],
        "notas": "Nível Brasil da série AVIOL12_HOMIC (óbitos por residência, SIM/DATASUS). Mesmas ressalvas de classificação de homicidios_100mil.",
        "pontos": _ipea("AVIOL12_HOMIC"),
    }


def s_prodes() -> dict:
    d = _json("inpe_prodes_taxas", "rates2025.json")
    por_ano: dict[int, float] = {}
    for p in d["periods"]:
        ano = int(p["endDate"]["year"])
        por_ano[ano] = float(sum(a["area"] for f in p["features"] for a in f["areas"]))
    pts = sorted(por_ano.items())
    iguais = [a for (a, v), (_, w) in zip(pts[1:], pts, strict=False) if v == w]
    return {
        "id": "desmatamento_amazonia_prodes",
        "rotulo": "Desmatamento na Amazônia Legal: taxa PRODES (corte raso)",
        "unidade": "km² por ano PRODES (ago-jul)",
        "fonte": _fonte(
            "inpe_prodes_taxas",
            "INPE/TerraBrasilis — PRODES Amazônia Legal, taxas anuais por estado (dashboard)",
            "rates2025.json (soma dos 9 estados)",
        ),
        "qualidade": "alta",
        "quebras": [
            {
                "ano": 1994,
                "motivo": "valores de 1993 e 1994 idênticos na fonte (média do biênio, não observação anual)",
            },
        ],
        "notas": (
            "Soma das taxas dos 9 estados da Amazônia Legal; o ano é o de término do período PRODES (ago do ano "
            "anterior a jul). Valores arredondados pelo INPE nos anos analógicos. Valores idênticos consecutivos "
            f"na fonte: {_faixas(iguais) or 'nenhum'}. A fonte pode revisar anos consolidados."
        ),
        "pontos": pts,
    }


def _sv_brasil() -> tuple[dict[int, float], dict[int, int], int]:
    import pandas as pd

    _prov("slavevoyages_tastdb_2019")
    d = pd.read_csv(
        RAW / "slavevoyages_tastdb_2019" / "tastdb-exp-2019.csv",
        encoding="latin-1",
        usecols=["YEARAM", "MJSELIMP", "SLAMIMP"],
        low_memory=False,
    )
    b = d[d.MJSELIMP.isin(BRASIL_SV)].dropna(subset=["YEARAM"])
    sem = int(b.SLAMIMP.isna().sum())
    b = b.dropna(subset=["SLAMIMP"])
    g = b.groupby(b.YEARAM.astype(int))
    return (
        {int(a): float(v) for a, v in g.SLAMIMP.sum().items()},
        {int(a): int(v) for a, v in g.size().items()},
        sem,
    )


def s_escravizados() -> dict:
    por_ano, _, sem = _sv_brasil()
    return {
        "id": "africanos_desembarcados_brasil_ano",
        "rotulo": "Africanos escravizados desembarcados no Brasil, por ano (voyages documentadas)",
        "unidade": "pessoas (imputadas) por ano de chegada",
        "fonte": _fonte(
            "slavevoyages_tastdb_2019",
            "SlaveVoyages / Trans-Atlantic Slave Trade Database (tastdb-exp-2019)",
            "SLAMIMP por YEARAM, MJSELIMP 50100-50500",
        ),
        "qualidade": "baixa",
        "quebras": [],
        "notas": (
            "Soma de SLAMIMP (total desembarcado, imputado pela base) nas viagens cuja região principal de "
            "desembarque (MJSELIMP) é Brasil (50100 Amazônia, 50200 Bahia, 50300 Pernambuco, 50400 Sudeste, "
            "50500 Outro Brasil; rótulos conferidos no .sav oficial). É a soma das viagens DOCUMENTADAS na "
            "base, não a estimativa total do tráfico (que adiciona viagens sem registro): subestima o total. "
            f"Viagens para o Brasil sem SLAMIMP foram omitidas ({sem}). Anos sem viagem documentada não aparecem. "
            "Edição 2019 do banco (exportação .csv disponível no site; verifique se há edição mais nova)."
        ),
        "pontos": sorted(por_ano.items()),
    }


def s_escravizados_decada() -> dict:
    por_ano, _, _ = _sv_brasil()
    dec: dict[int, float] = defaultdict(float)
    for a, v in por_ano.items():
        dec[a // 10 * 10] += v
    return {
        "id": "africanos_desembarcados_brasil_decada",
        "rotulo": "Africanos escravizados desembarcados no Brasil, por década (voyages documentadas)",
        "unidade": "pessoas (imputadas) na década iniciada no ano indicado",
        "fonte": _fonte(
            "slavevoyages_tastdb_2019",
            "SlaveVoyages / Trans-Atlantic Slave Trade Database (tastdb-exp-2019)",
            "SLAMIMP por década de YEARAM, MJSELIMP 50100-50500",
        ),
        "qualidade": "baixa",
        "quebras": [],
        "notas": "Agregação por década (ano = primeiro ano da década) da série anual; mesmas ressalvas. A primeira e a última década são parciais (1514-1519 e 1860-1866).",
        "pontos": sorted(dec.items()),
    }


def s_divida() -> dict:
    d = _json("bcb_sgs_13762", "sgs_13762.json")
    dez: dict[int, float] = {}
    for r in d:
        _, mes, ano = r["data"].split("/")
        if mes == "12" and r["valor"] not in ("", None):
            dez[int(ano)] = float(r["valor"])
    return {
        "id": "divida_bruta_pib",
        "rotulo": "Dívida bruta do governo geral (% do PIB), posição em dezembro",
        "unidade": "% do PIB",
        "fonte": _fonte("bcb_sgs_13762", "Banco Central do Brasil, SGS 13762", "13762"),
        "qualidade": "alta",
        "quebras": [],
        "notas": "Valor de dezembro de cada ano (série mensal do BCB, que só existe de dez/2006). Anos sem dezembro publicado (ano corrente) omitidos. O BCB revisa a série retroativamente; vale a metodologia da data do download.",
        "pontos": sorted(dez.items()),
    }


def s_top1() -> dict:
    _prov("wid_BR")
    brutos: list[tuple[int, float]] = []
    with (RAW / "wid_BR" / "WID_data_BR.csv").open(encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f, delimiter=";"):
            if (
                r["variable"] == "sptincj992"
                and r["percentile"] == "p99p100"
                and r["value"]
            ):
                brutos.append((int(r["year"]), float(r["value"])))
    brutos.sort()
    pts, removidos = _sem_repeticao(brutos)
    return {
        "id": "top1_renda_wid",
        "rotulo": "Participação do 1% mais rico na renda nacional pré-imposto (WID)",
        "unidade": "fração da renda nacional (0-1)",
        "fonte": _fonte(
            "wid_BR",
            "World Inequality Database (WID.world), bulk download, Brasil",
            "sptincj992 / p99p100",
            "https://wid.world/bulk_download/wid_all_data.zip",
        ),
        "qualidade": "media",
        "quebras": [
            {
                "ano": 1980,
                "motivo": "antes de 1980: estimativas decenais/esparsas (1820-1970); 1980 em diante: valor repetido até 2001",
            },
            {
                "ano": 2002,
                "motivo": "retomada de valores anuais distintos (combina pesquisas domiciliares e dados de imposto de renda)",
            },
        ],
        "notas": (
            "Renda nacional pré-imposto, adultos (divisão igual entre cônjuges), variável sptincj992. "
            f"A WID repete o mesmo valor em anos consecutivos onde não há dado anual; esses repetidos foram OMITIDOS ({_faixas(removidos)}), "
            "ficando só o primeiro ano de cada trecho. Pré-1980: estimativas esparsas, não amostras anuais. Resultados "
            "dependem da combinação de pesquisas e dados fiscais (ver metadados da WID)."
        ),
        "pontos": pts,
    }


SERIES: list[tuple[str, Callable[[], dict]]] = [
    ("pib_pc_maddison", s_maddison),
    ("pib_real_ibge", s_pib_real),
    ("pib_var_real_ibge", s_pib_var),
    ("pib_pc_var_real_ibge", s_pib_pc_var_ibge),
    ("pib_pc_ppc_bm", s_pib_pc_ppc),
    ("ipca", s_ipca),
    ("igp_di", s_igpdi),
    ("salario_minimo_real", s_salario_minimo),
    ("gini_renda_dom_pc", s_gini),
    ("top1_renda_wid", s_top1),
    ("desocupacao_pnadc", s_desocupacao),
    ("pobreza_ppc300_ipea", s_pobreza_ipea_300),
    ("pobreza_ppc830_ipea", s_pobreza_ipea_830),
    ("pobreza_ppc300_ibge", s_pobreza_ibge_300),
    ("pobreza_ppc830_ibge", s_pobreza_ibge_830),
    ("inseg_alimentar_grave_ibge", s_inseg_ibge),
    ("inseg_alimentar_grave_fao", s_inseg_fao),
    ("expectativa_vida_owid", s_vida_owid),
    ("expectativa_vida_ibge", s_vida_ibge),
    ("mortalidade_infantil_bm", s_tmi_bm),
    ("mortalidade_infantil_ibge", s_tmi_ibge),
    ("analfabetismo_15mais_censos_hist", s_analfabetismo_censos),
    ("analfabetismo_15mais_censos_atlas", s_analfabetismo_atlas),
    ("analfabetismo_15mais_pnadc", s_analfabetismo_pnadc),
    ("homicidios_100mil", s_homicidios),
    ("homicidios_numero", s_homicidios_n),
    ("desmatamento_amazonia_prodes", s_prodes),
    ("africanos_desembarcados_brasil_ano", s_escravizados),
    ("africanos_desembarcados_brasil_decada", s_escravizados_decada),
    ("divida_bruta_pib", s_divida),
]

# Limites plausíveis (min, max) por série — violações são reportadas em meta.validacao
LIMITES: dict[str, tuple[float, float]] = {
    "pib_pc_maddison": (300, 30000),
    "pib_real_ibge": (1e3, 1e7),
    "pib_var_real_ibge": (-15, 20),
    "pib_pc_var_real_ibge": (-12, 12),
    "pib_pc_ppc_bm": (3000, 30000),
    "ipca": (-2, 3000),
    "igp_di": (-5, 3000),
    "salario_minimo_real": (100, 5000),
    "gini_renda_dom_pc": (30, 75),
    "top1_renda_wid": (0.1, 0.5),
    "desocupacao_pnadc": (3, 20),
    "pobreza_ppc300_ipea": (0, 60),
    "pobreza_ppc830_ipea": (0, 100),
    "pobreza_ppc300_ibge": (0, 60),
    "pobreza_ppc830_ibge": (0, 100),
    "inseg_alimentar_grave_ibge": (0, 30),
    "inseg_alimentar_grave_fao": (0, 30),
    "expectativa_vida_owid": (20, 90),
    "expectativa_vida_ibge": (40, 90),
    "mortalidade_infantil_bm": (0, 200),
    "mortalidade_infantil_ibge": (0, 200),
    "analfabetismo_15mais_censos_hist": (0, 100),
    "analfabetismo_15mais_censos_atlas": (0, 100),
    "analfabetismo_15mais_pnadc": (0, 30),
    "homicidios_100mil": (0, 60),
    "homicidios_numero": (0, 100000),
    "desmatamento_amazonia_prodes": (0, 40000),
    "africanos_desembarcados_brasil_ano": (0, 200000),
    "africanos_desembarcados_brasil_decada": (0, 2e6),
    "divida_bruta_pib": (20, 120),
}

LACUNAS_FIXAS = [
    {
        "serie": "trabalhadores_resgatados_trabalho_escravo",
        "motivo": (
            "Sem fonte aberta acessível: o Smartlab (smartlabbr.org) falha na validação do certificado TLS "
            "(SEC_E_WRONG_PRINCIPAL, não contornado); o Radar SIT/MTE está 'temporariamente fora do ar' (comunicado "
            "oficial em sit.trabalho.gov.br/radar); dados.gov.br exige token (HTTP 401). O Cadastro de Empregadores "
            "do MTE (lista suja) é aberto, mas é fotografia atual de empregadores, não série de resgatados por ano."
        ),
    },
    {
        "serie": "inseg_alimentar_grave_penssan",
        "motivo": "Rede PENSSAN/VIGISAN (2020, 2022) publica relatórios em PDF sem tabela aberta estruturada; não ingeridos para não transcrever números à mão.",
    },
    {
        "serie": "desocupacao_antes_de_2012",
        "motivo": "Séries anteriores (PME, PNAD) têm universo e metodologia diferentes da PNADC e aparecem como INATIVAS no Ipeadata (DISOC_DESE, Dese_Pnad). Não ingeridas nem emendadas.",
    },
    {
        "serie": "pobreza_extrema_pobreza_antes_de_1995",
        "motivo": "Nas fontes abertas usadas, a série Ipea começa em 1995 (PNAD); antes disso não há série comparável acessível.",
    },
    {
        "serie": "analfabetismo_censos_1930_1960_e_anual_1992_2015",
        "motivo": "Censos de 1930-1960 não constam nas séries abertas do Ipeadata consultadas (TXA15M, TXA15M7091, ADH_T_ANALF15M); PNAD anual 1992-2015 não foi ingerida; a PNADC começa em 2016.",
    },
    {
        "serie": "pib_per_capita_real_ibge_longo_prazo",
        "motivo": "Não encontrado PIB per capita real contínuo do IBGE antes de 1996 em tabela aberta verificada (SIDRA 6784 começa em 1996); o longo prazo vem do Maddison.",
    },
    {
        "serie": "africanos_total_estimado_do_trafico",
        "motivo": "Só as viagens documentadas da base SlaveVoyages (edição 2019) foram somadas; as estimativas totais do tráfico (com viagens sem registro) ficam em página dinâmica do site, sem download estruturado verificado. Não foi possível verificar se há edição mais nova da base.",
    },
]


# ----------------------------------------------------------------------------------------------
# Validação
# ----------------------------------------------------------------------------------------------
def validar_pontos(
    sid: str, pts: list[list], limites: tuple[float, float] | None
) -> dict:
    anos = [p[0] for p in pts]
    dup = sorted(a for a, n in Counter(anos).items() if n > 1)
    fora = [p for p in pts if not (limites[0] <= p[1] <= limites[1])] if limites else []
    nan = [p for p in pts if not math.isfinite(p[1])]
    return {
        "n": len(pts),
        "anos_duplicados": dup,
        "ordenada": anos == sorted(anos),
        "fora_dos_limites": fora,
        "nao_finitos": nan,
        "limites": list(limites) if limites else None,
        "ultimo": pts[-1] if pts else None,
    }


def _corr(x: list[float], y: list[float]) -> float | None:
    if len(x) < 3:
        return None
    mx, my = sum(x) / len(x), sum(y) / len(y)
    sx = math.sqrt(sum((a - mx) ** 2 for a in x))
    sy = math.sqrt(sum((b - my) ** 2 for b in y))
    if sx == 0 or sy == 0:
        return None
    return round(
        sum((a - mx) * (b - my) for a, b in zip(x, y, strict=True)) / (sx * sy), 4
    )


def _conferencias(series: dict[str, dict]) -> list[dict]:
    """Checagens cruzadas contra outra fonte aberta baixada (relatadas, nunca silenciadas)."""
    out: list[dict] = []

    def add(nome, **kw):
        out.append({"checagem": nome, **kw})

    def d(s):
        return {a: v for a, v in series[s]["pontos"]}

    # IPCA Ipeadata (dez/dez) vs SIDRA 1737 (acumulado 12 meses em dezembro)
    try:
        sid = _json("sidra_1737_ipca", "ipca.json")[1:]
        ref = {
            int(r["D3C"][:4]): float(r["V"])
            for r in sid
            if r["D3C"].endswith("12") and r["V"] not in ("...", "-", "..", "X")
        }
        a = d("ipca")
        comum = sorted(set(a) & set(ref))
        dif = {y: round(a[y] - ref[y], 3) for y in comum if abs(a[y] - ref[y]) > 0.06}
        add(
            "ipca: Ipeadata (dez/dez) vs IBGE SIDRA 1737 (acum. 12 meses, dez)",
            anos_comparados=len(comum),
            maior_diferenca_pp=max((abs(a[y] - ref[y]) for y in comum), default=None),
            divergencias_acima_0_06pp=dif,
        )
    except (Falta, KeyError, FileNotFoundError) as e:
        add("ipca vs SIDRA 1737", indisponivel=str(e))
    # PIB var real: Ipeadata vs SIDRA 6784 v/9810
    try:
        sid = _json("sidra_6784_pib", "pib.json")[1:]
        ref = {
            int(r["D3C"]): float(r["V"])
            for r in sid
            if r["D2C"] == "9810" and r["V"] not in ("-", "X", "..", "...")
        }
        a = d("pib_var_real_ibge")
        comum = sorted(set(a) & set(ref))
        dif = {y: round(a[y] - ref[y], 2) for y in comum if abs(a[y] - ref[y]) > 0.15}
        add(
            "PIB var. real: Ipeadata (SCN10_PIBG10) vs IBGE SIDRA 6784/v9810",
            anos_comparados=len(comum),
            maior_diferenca_pp=max((abs(a[y] - ref[y]) for y in comum), default=None),
            divergencias_acima_0_15pp=dif,
        )
    except (Falta, KeyError, FileNotFoundError) as e:
        add("PIB var. real vs SIDRA 6784", indisponivel=str(e))
    # PIB var real vs variação do nível PIBP10
    try:
        n = d("pib_real_ibge")
        v = d("pib_var_real_ibge")
        dif = {
            y: round((n[y] / n[y - 1] - 1) * 100 - v[y], 2)
            for y in v
            if y in n and y - 1 in n and abs((n[y] / n[y - 1] - 1) * 100 - v[y]) > 0.1
        }
        add(
            "PIB: variação implícita do nível (R$ 2010) vs série de variação real",
            divergencias_acima_0_1pp=dif,
        )
    except KeyError as e:
        add("PIB nível vs variação", indisponivel=str(e))
    # Expectativa de vida OWID (UN WPP) vs Banco Mundial (UN WPP) e IBGE
    try:
        wb = _wb("SP.DYN.LE00.IN")
        o = d("expectativa_vida_owid")
        comum = [(a, v) for a, v in wb if a in o]
        add(
            "expectativa de vida: OWID vs Banco Mundial (SP.DYN.LE00.IN)",
            anos_comparados=len(comum),
            maior_diferenca_anos=max((abs(o[a] - v) for a, v in comum), default=None),
        )
    except (Falta, KeyError, FileNotFoundError) as e:
        add("expectativa de vida OWID vs BM", indisponivel=str(e))
    # Mortalidade infantil IBGE vs BM
    try:
        a, b = d("mortalidade_infantil_ibge"), d("mortalidade_infantil_bm")
        comum = sorted(set(a) & set(b))
        add(
            "mortalidade infantil: IBGE vs UN IGME (Banco Mundial)",
            anos_comparados=len(comum),
            maior_diferenca_por_mil=max(
                (abs(a[y] - b[y]) for y in comum), default=None
            ),
        )
    except KeyError as e:
        add("mortalidade infantil IBGE vs BM", indisponivel=str(e))
    # Pobreza Ipea vs Banco Mundial $3.00 (PIP)
    try:
        wb = dict(_wb("SI.POV.DDAY"))
        a = d("pobreza_ppc300_ipea")
        comum = sorted(set(a) & set(wb))
        dif = [a[y] - wb[y] for y in comum]
        add(
            "pobreza US$3,00 PPC 2021: Ipea (PNAD encadeada) vs Banco Mundial PIP (SI.POV.DDAY)",
            anos_comparados=len(comum),
            diferenca_media_pp=round(sum(dif) / len(dif), 2) if dif else None,
            maior_diferenca_pp=round(max((abs(x) for x in dif), default=0), 2),
            correlacao=_corr([a[y] for y in comum], [wb[y] for y in comum]),
            leitura="mesma trajetória, mas nível do Ipea sistematicamente maior (tratamento de renda/linha diferente do PIP); não misturar as séries",
        )
    except (Falta, KeyError, FileNotFoundError) as e:
        add("pobreza Ipea vs BM", indisponivel=str(e))
    # Maddison vs PIB pc PPC Banco Mundial: correlação das variações anuais
    try:
        m, b = d("pib_pc_maddison"), d("pib_pc_ppc_bm")
        ys = [y for y in sorted(b) if y - 1 in b and y in m and y - 1 in m]
        gm = [m[y] / m[y - 1] - 1 for y in ys]
        gb = [b[y] / b[y - 1] - 1 for y in ys]
        if len(ys) > 3:
            mm, mb = sum(gm) / len(gm), sum(gb) / len(gb)
            cov = sum((x - mm) * (z - mb) for x, z in zip(gm, gb, strict=True))
            r = cov / math.sqrt(
                sum((x - mm) ** 2 for x in gm) * sum((z - mb) ** 2 for z in gb)
            )
            add(
                "PIB per capita: crescimento anual Maddison vs Banco Mundial PPC (correlação)",
                anos_comparados=len(ys),
                correlacao=round(r, 3),
            )
    except (KeyError, ZeroDivisionError) as e:
        add("Maddison vs BM", indisponivel=str(e))
    # Homicídios: taxa × população (Maddison, mil pessoas) vs contagem
    try:
        import pandas as pd

        _prov("maddison_mpd2023")
        m = pd.read_stata(RAW / "maddison_mpd2023" / "maddison2023_web.dta")
        m = m[m.countrycode == "BRA"]
        pop = {
            int(a): float(p) * 1000
            for a, p in zip(m.year, m["pop"], strict=True)
            if not math.isnan(float(p))
        }
        n, tx = d("homicidios_numero"), d("homicidios_100mil")
        rel = {
            y: abs(tx[y] * pop[y] / 1e5 / n[y] - 1) for y in tx if y in n and y in pop
        }
        add(
            "homicídios: taxa × população (Maddison) vs contagem AVIOL12_HOMIC",
            anos_comparados=len(rel),
            maior_desvio_relativo=round(max(rel.values(), default=0), 4),
            anos_desvio_acima_5pct=sorted(y for y, v in rel.items() if v > 0.05),
        )
    except (Falta, KeyError, FileNotFoundError) as e:
        add("homicídios taxa vs contagem", indisponivel=str(e))
    # SlaveVoyages: Brasil vs total da base
    try:
        por_ano, nviag, sem = _sv_brasil()
        add(
            "SlaveVoyages: total Brasil documentado (soma SLAMIMP)",
            total_pessoas=sum(por_ano.values()),
            viagens=sum(nviag.values()),
            primeiro_ano=min(por_ano),
            ultimo_ano=max(por_ano),
            viagens_brasil_sem_SLAMIMP=sem,
        )
    except (Falta, FileNotFoundError) as e:
        add("SlaveVoyages", indisponivel=str(e))
    return out


def build(raw: Path | None = None, out: Path | None = OUT) -> dict:
    """Monta o JSON. `raw`/`out` são parâmetros para teste; `out=None` não grava."""
    global RAW
    antigo = RAW
    if raw is not None:
        RAW = raw
    try:
        series: dict[str, dict] = {}
        lacunas: list[dict] = list(LACUNAS_FIXAS)
        for sid, fn in SERIES:
            try:
                s = fn()
            except (Falta, FileNotFoundError, KeyError, IndexError, ValueError) as e:
                lacunas.append(
                    {"serie": sid, "motivo": f"não construída: {type(e).__name__}: {e}"}
                )
                continue
            s["pontos"] = [[int(a), round(float(v), 6)] for a, v in sorted(s["pontos"])]
            dup = [a for a, n in Counter(p[0] for p in s["pontos"]).items() if n > 1]
            if dup:  # nunca emitir ano duplicado: a série vira lacuna e o problema é reportado
                lacunas.append(
                    {"serie": sid, "motivo": f"anos duplicados na fonte: {dup}"}
                )
                continue
            if not s["pontos"]:
                lacunas.append(
                    {"serie": sid, "motivo": "fonte baixada sem pontos utilizáveis"}
                )
                continue
            s["cobertura"] = [s["pontos"][0][0], s["pontos"][-1][0]]
            series[sid] = s
        falhas = RAW / "_falhas_series.json"
        if falhas.exists():
            for n, f in json.loads(falhas.read_text(encoding="utf-8")).items():
                lacunas.append(
                    {
                        "serie": f"download:{n}",
                        "motivo": f"falha de acesso em {f['url']}: {f['erro']}",
                        "em": f["em"],
                    }
                )
        validacao = {
            sid: validar_pontos(sid, s["pontos"], LIMITES.get(sid))
            for sid, s in series.items()
        }
        res = {
            "meta": {
                "gerado_em": datetime.now(UTC).isoformat(timespec="seconds"),
                "aviso": AVISO,
                "lacunas": lacunas,
                "validacao": {
                    "series": validacao,
                    "conferencias": _conferencias(series),
                },
            },
            "ciclos": [{"id": i, "inicio": a, "fim": b} for i, a, b in CICLOS],
            "series": [
                {
                    k: s[k]
                    for k in (
                        "id",
                        "rotulo",
                        "unidade",
                        "cobertura",
                        "fonte",
                        "qualidade",
                        "quebras",
                        "notas",
                        "pontos",
                    )
                }
                for s in series.values()
            ],
        }
        if out is not None:
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(
                json.dumps(res, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )
        return res
    finally:
        RAW = antigo

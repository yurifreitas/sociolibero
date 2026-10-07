"""Fator humano municipal: agregados de violência, saúde e demografia por município/UF/ano.

Saídas: `web/public/data/humano_municipal.json` e `web/public/data/humano_nacional.json`
(ver docs/METHODS.md, seção "Fator humano municipal").

PROVENIÊNCIA INDIRETA. Os dados NÃO vêm das fontes primárias: vêm do banco SQLite do projeto
irmão do autor (Arandu/"trans"), que por sua vez baixou SIM/SINAN/SINASC (DATASUS), Atlas da
Violência (Ipea/FBSP via Ipeadata), IBGE/SIDRA, CNES, SENAPPEN. Esta etapa não revalida a ETL
daquele projeto: confere o que dá para conferir (somas, duplicatas, negativos, comparação com
números publicados e com `territorios.json`) e reporta o resto como lacuna.

Segurança:
- o banco é aberto SOMENTE LEITURA (`mode=ro` + `PRAGMA query_only`) e tratado como não
  confiável: só se leem números e rótulos de listas fechadas (UF, tipo, raça); nada do banco é
  executado, importado ou desserializado;
- nada pessoal é exportado: só contagens por município/UF/ano. Nenhuma coluna de nome,
  documento, doador, sócio ou parlamentar é consultada.

Convenções: `null` ≠ 0 (campo ausente quando a fonte não tem o dado). Código de município =
IBGE de 7 dígitos como string; códigos de 6 dígitos são convertidos pelo prefixo contra
`geo/municipios.geojson` (colisões e sem-match são reportados).
"""

from __future__ import annotations

import json
import os
import sqlite3
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path

ENV_DB = "SOCIOLIBERO_TRANS_DB"
GEO = Path("web/public/data/geo/municipios.geojson")
TERRITORIOS = Path("web/public/data/territorios.json")
FATOR_HUMANO = Path("web/public/data/fator_humano.json")
OUT_DIR = Path("web/public/data")

ANO_MIN, ANO_MAX = 2010, 2024
ANO_MIN_OUTROS = 2015
UFS = {
    "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
    "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL",
    "28": "SE", "29": "BA", "31": "MG", "32": "ES", "33": "RJ", "35": "SP", "41": "PR",
    "42": "SC", "43": "RS", "50": "MS", "51": "MT", "52": "GO", "53": "DF",
}  # fmt: skip
RACAS = ("branca", "preta", "parda", "amarela", "indigena", "ignorada")

# Publicados conferidos em fonte aberta nesta rodada (páginas de imprensa/Ipea que citam o Atlas).
PUBLICADOS_HOMICIDIOS = {
    2022: {
        "valor": 46409,
        "fonte": "Atlas da Violência 2024/2025 (Ipea/FBSP), via imprensa",
        "url": "https://sbtnews.sbt.com.br/noticia/brasil/atlas-da-violencia-brasil-tem-menor-taxa-de-homicidios-em-11-anos-mas-assassinatos-de-mulheres-aumentam",
    },
    2023: {
        "valor": 45747,
        "fonte": "Atlas da Violência 2025 (Ipea/FBSP), via imprensa",
        "url": "https://sbtnews.sbt.com.br/noticia/brasil/atlas-da-violencia-brasil-tem-menor-taxa-de-homicidios-em-11-anos-mas-assassinatos-de-mulheres-aumentam",
    },
    2024: {
        "valor": 42590,
        "fonte": "Atlas da Violência 2026 (Ipea/FBSP), nota do Ipea",
        "url": "https://www.ipea.gov.br/portal/categorias/45-todas-as-noticias/noticias/16394-atlas-da-violencia-brasil-registrou-42-590-homicidios-em-2024-menor-resultado-da-serie-historica-mas-subnotificacao-preocupa",
    },
}

AVISO = (
    "Agregados municipais derivados do banco do projeto Arandu/trans (proveniência indireta: o banco "
    "cita SIM/SINAN/SINASC/DATASUS, Atlas da Violência, IBGE, CNES e SENAPPEN). Contagens pequenas "
    "oscilam por acaso: não ranqueie taxas de municípios pequenos. Notificação (SINAN) mede o que os "
    "serviços registraram, não incidência. Município = residência da vítima/mãe. Nada aqui é causal."
)

FONTES = [
    ("violencia", "Atlas da Violência: homicídios, jovens 15-29, mulheres, suicídios e população",
     "Atlas da Violência (Ipea/FBSP) via Ipeadata AVIOL12_*, a partir do SIM/DATASUS; população: estimativa TCU/IBGE",
     "http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='AVIOL12_HOMIC')"),
    ("mortes_violentas", "Óbitos agregados (tipo, raça, sexo, jovem, meio) por município de residência",
     "SIM/DATASUS, declaração de óbito (CID-10 X85-Y09 homicídio; Y35-Y36 intervenção legal; X60-X84 suicídio)",
     "ftp://ftp.datasus.gov.br/dissemin/publicos/SIM/CID10/DORES/"),
    ("violencia_infantil", "Violência notificada contra 0-17 anos, por tipo",
     "SINAN Violência interpessoal/autoprovocada (DATASUS)",
     "https://datasus.saude.gov.br/transferencia-de-arquivos/"),
    ("sinan_violencia", "Violência notificada (todas as idades) por sexo; parceiro íntimo",
     "SINAN Violência interpessoal/autoprovocada (DATASUS)",
     "https://datasus.saude.gov.br/transferencia-de-arquivos/"),
    ("nascidos_mae_menor", "Nascidos vivos por idade da mãe (até 9, 10-14, 15-17)",
     "SINASC/DATASUS (CODMUNRES, IDADEMAE)",
     "ftp://ftp.datasus.gov.br/dissemin/publicos/SINASC/1996_/Dados/DNRES/"),
    ("populacao_grupo", "População por raça, sexo e faixa etária (Censo 2010/2022; projeção por UF)",
     "IBGE SIDRA 9514 (Censo 2022, idade/sexo), 7358 (projeção, UF) e tabelas de cor/raça",
     "https://sidra.ibge.gov.br/tabela/9514"),
    ("consumo_alcool", "Consumo de álcool (UF medido; município = taxa da UF aplicada, ESTIMADO)",
     "PNS 2019 (IBGE) via SIDRA", "https://sidra.ibge.gov.br/"),
    ("saude_mental", "CAPS, hospitais especializados e leitos psiquiátricos (retrato CNES)",
     "CNES/DATASUS", "ftp://ftp.datasus.gov.br/dissemin/publicos/CNES/200508_/Dados/"),
    ("indicadores_sociais", "Pobreza, desemprego, Gini e analfabetismo por UF",
     "Ipeadata, base Social (PNAD Contínua/IBGE)", "http://www.ipeadata.gov.br/"),
    ("populacao_prisional", "Incidências penais e cor/raça da população prisional, por UF (2025/2)",
     "SISDEPEN/SENAPPEN (contagens por estabelecimento, nunca cruzadas)",
     "https://www.gov.br/senappen/pt-br/servicos/sisdepen/bases-de-dados"),
]  # fmt: skip


# ----------------------------------------------------------------------------------------------
# Infra
# ----------------------------------------------------------------------------------------------
def abrir_ro(caminho: str | Path) -> sqlite3.Connection:
    """Abre o SQLite SOMENTE LEITURA. Falha se o arquivo não existir (não cria)."""
    p = Path(caminho).resolve()
    if not p.is_file():
        raise FileNotFoundError(f"banco não encontrado: {p}")
    con = sqlite3.connect(f"{p.as_uri()}?mode=ro", uri=True)
    con.execute("PRAGMA query_only=ON")
    return con


def _i(v):
    return None if v is None else int(round(v))


def _r(v, nd=2):
    return None if v is None else round(float(v), nd)


def _taxa(n, pop, nd=2):
    if n is None or not pop or pop <= 0:
        return None
    return round(n / pop * 1e5, nd)


def carregar_geo(caminho: Path = GEO) -> dict:
    """ibge7 → {nome, uf}, mais mapa 6→7 dígitos e colisões."""
    gj = json.loads(Path(caminho).read_text(encoding="utf-8"))
    ids = {}
    for f in gj["features"]:
        p = f["properties"]
        ids[str(p["ibge"])] = {"nome": p.get("nome"), "uf": p.get("uf")}
    p6: dict[str, list[str]] = defaultdict(list)
    for i in ids:
        p6[i[:6]].append(i)
    colisoes = {k: v for k, v in p6.items() if len(v) > 1}
    return {
        "ids": ids,
        "p6": {k: v[0] for k, v in p6.items() if len(v) == 1},
        "colisoes_6d": colisoes,
    }


class Resolver:
    """Converte códigos do banco (6 ou 7 dígitos) em IBGE-7 e contabiliza os sem match."""

    def __init__(self, geo: dict):
        self.geo = geo
        self.sem_match: dict[str, int] = defaultdict(int)
        self.convertidos_6d = 0
        self.ambiguos_6d = 0

    def __call__(self, cod) -> str | None:
        c = str(cod or "").strip()
        if len(c) == 7 and c in self.geo["ids"]:
            return c
        if len(c) == 6:
            if c in self.geo["colisoes_6d"]:
                self.ambiguos_6d += 1
            elif c in self.geo["p6"]:
                self.convertidos_6d += 1
                return self.geo["p6"][c]
        self.sem_match[c] += 1
        return None

    def relatorio(self) -> dict:
        return {
            "codigos_6_digitos_convertidos": self.convertidos_6d,
            "codigos_6_digitos_ambiguos_descartados": self.ambiguos_6d,
            "colisoes_de_prefixo_6d_na_malha": len(self.geo["colisoes_6d"]),
            "linhas_sem_match": sum(self.sem_match.values()),
            "codigos_sem_match": len(self.sem_match),
            "exemplos_sem_match": sorted(self.sem_match)[:10],
        }


def _q(con, sql, args=()):
    return con.execute(sql, args).fetchall()


def _tem(con, tabela: str) -> bool:
    return bool(
        _q(con, "select 1 from sqlite_master where type='table' and name=?", (tabela,))
    )


# ----------------------------------------------------------------------------------------------
# Coleta municipal
# ----------------------------------------------------------------------------------------------
class Acum:
    """Acumula {ibge: {campo: {ano: valor}}} ignorando None (null ≠ 0)."""

    def __init__(self):
        self.d: dict[str, dict[str, dict[str, float]]] = {}

    def put(self, ibge, campo, ano, v):
        if v is None or ano is None:
            return
        self.d.setdefault(ibge, {}).setdefault(campo, {})[str(ano)] = v


def coletar_municipal(con, res: Resolver, anos=(ANO_MIN, ANO_MAX)) -> tuple[dict, dict]:
    """Retorna (linhas, diag). `diag` leva as exclusões e verificações internas."""
    a = Acum()
    diag: dict = {"anos_atlas_municipal_excluidos": {}, "tabelas": {}}
    lo, hi = anos
    lo2 = max(
        lo, ANO_MIN_OUTROS
    )  # tabelas não-Atlas: a partir de 2015 (tamanho do arquivo)

    # --- Atlas (violencia): só linhas com código de 7 dígitos (as de 1-2 dígitos são Brasil/UF)
    atlas = _q(
        con,
        "select codigo_ibge, ano, homicidios, homicidios_jovens, homicidios_mulheres, suicidios, populacao "
        "from violencia where length(codigo_ibge) in (6,7) and ano between ? and ?",
        (lo, hi),
    )
    por_ano: dict[int, list] = defaultdict(list)
    for r in atlas:
        por_ano[r[1]].append(r)
    for ano, rows in sorted(por_ano.items()):
        inc = sum(
            1
            for r in rows
            if (r[3] is not None and r[2] is not None and r[3] > r[2])
            or (r[4] is not None and r[2] is not None and r[4] > r[2])
        )
        ruim = inc / len(rows) >= 0.01
        if ruim:
            diag["anos_atlas_municipal_excluidos"][str(ano)] = {
                "linhas": len(rows),
                "linhas_com_jovens_ou_mulheres_maior_que_total": inc,
                "motivo": "incoerência interna (subgrupo > total) em >= 1% dos municípios; campos Atlas do ano ficam null",
            }
        for cod, ano_, h, hj, hm, sui, pop in rows:
            i = res(cod)
            if i is None:
                continue
            a.put(i, "pop", ano_, _i(pop))
            if ruim:
                continue
            a.put(i, "homicidios", ano_, _i(h))
            a.put(i, "homicidios_jovens", ano_, _i(hj))
            a.put(i, "homicidios_mulheres", ano_, _i(hm))
            a.put(i, "suicidios", ano_, _i(sui))
            a.put(i, "taxa_homicidios", ano_, _taxa(h, pop))
    diag["tabelas"]["violencia"] = {"linhas_municipais": len(atlas)}

    # --- População do Censo (2010/2022): denominadores etários/raciais
    cens = _q(
        con,
        "select codigo_ibge, ano, total, jovens_15_29, mulheres, brancos, pretos, pardos, amarelos, indigenas "
        "from populacao_grupo where length(codigo_ibge) in (6,7) and fonte='censo'",
    )
    censo: dict[tuple[str, int], tuple] = {}
    for cod, ano, tot, jov, mul, br, pr, pa, am, ind in cens:
        i = res(cod)
        if i is None:
            continue
        censo[(i, ano)] = (jov, mul, pr, pa)
        for campo, v in (
            ("pop_censo", tot), ("pop_jovens_15_29", jov), ("pop_mulheres", mul),
            ("pop_brancos", br), ("pop_pretos", pr), ("pop_pardos", pa),
            ("pop_amarelos", am), ("pop_indigenas", ind),
        ):  # fmt: skip
            a.put(i, campo, ano, _i(v))
    # taxas específicas só onde a população do grupo existe no mesmo ano (anos de Censo)
    for (i, ano), (jov, mul, _pr, _pa) in censo.items():
        ln = a.d.get(i, {})
        hj = ln.get("homicidios_jovens", {}).get(str(ano))
        hm = ln.get("homicidios_mulheres", {}).get(str(ano))
        a.put(i, "taxa_homicidios_jovens", ano, _taxa(hj, jov))
        a.put(i, "taxa_homicidios_mulheres", ano, _taxa(hm, mul))
    diag["tabelas"]["populacao_grupo"] = {"linhas_censo_municipais": len(cens)}

    # --- SIM agregado
    sim = _q(
        con,
        """select codigo_ibge, ano,
             sum(case when tipo='homicidio' then total end),
             sum(case when tipo='homicidio' and raca in ('preta','parda') then total end),
             sum(case when tipo='homicidio' and raca!='ignorada' then total end),
             sum(case when tipo='homicidio' and raca='indigena' then total end),
             sum(case when tipo='homicidio' and meio='arma_fogo' then total end),
             sum(case when tipo='homicidio' and jovem=1 then total end),
             sum(case when tipo='homicidio' and sexo='F' then total end),
             sum(case when tipo='intervencao_legal' then total end),
             sum(case when tipo='suicidio' then total end)
           from mortes_violentas where ano between ? and ? group by codigo_ibge, ano""",
        (lo2, hi),
    )
    sim_anos = sorted({r[1] for r in sim})
    vistos = set()
    for cod, ano, h, neg, rinf, ind, fogo, jov, mul, il, sui in sim:
        i = res(cod)
        if i is None:
            continue
        vistos.add((i, ano))
        a.put(i, "sim_homicidios", ano, _i(h or 0))
        if h:
            a.put(i, "sim_homicidios_arma_fogo", ano, _i(fogo or 0))
            a.put(i, "sim_homicidios_jovens", ano, _i(jov or 0))
            a.put(i, "sim_homicidios_mulheres", ano, _i(mul or 0))
            a.put(i, "vitimas_raca_informada", ano, _i(rinf or 0))
            if rinf:
                a.put(i, "pct_vitimas_negras", ano, _r((neg or 0) / rinf * 100, 1))
        a.put(i, "sim_intervencao_legal", ano, _i(il or 0))
    # SIM cobre o país todo em cada ano carregado: município sem linha = 0 óbitos de residente.
    for ano in sim_anos:
        for i in res.geo["ids"]:
            if (i, ano) not in vistos:
                a.put(i, "sim_homicidios", ano, 0)
    diag["tabelas"]["mortes_violentas"] = {"anos": sim_anos}

    # --- SINASC
    for cod, ano, tot, a9, a14, a17 in _q(
        con,
        "select codigo_ibge, ano, total, mae_ate_9, mae_10_14, mae_15_17 from nascidos_mae_menor "
        "where ano between ? and ?",
        (lo2, hi),
    ):
        i = res(cod)
        if i is None:
            continue
        a.put(i, "nascidos", ano, _i(tot))
        if a9 is not None and a14 is not None:
            a.put(i, "mae_ate_14", ano, _i(a9 + a14))
            if a17 is not None:
                a.put(i, "mae_ate_17", ano, _i(a9 + a14 + a17))

    # --- SINAN infantil (soma de sexo/faixa)
    for cod, ano, tot, inter, sex in _q(
        con,
        "select codigo_ibge, ano, sum(total), sum(interpessoal), sum(sexual) from violencia_infantil "
        "where ano between ? and ? group by codigo_ibge, ano",
        (lo2, hi),
    ):
        i = res(cod)
        if i is None:
            continue
        a.put(i, "viol_infantil_notif", ano, _i(tot))
        a.put(i, "viol_infantil_sexual", ano, _i(sex))

    # --- SINAN geral: mulheres
    for cod, ano, tot, parc in _q(
        con,
        "select codigo_ibge, ano, total, parceiro from sinan_violencia where sexo='F' and ano between ? and ?",
        (lo2, hi),
    ):
        i = res(cod)
        if i is None:
            continue
        a.put(i, "sinan_notif_mulheres", ano, _i(tot))
        a.put(i, "sinan_parceiro_mulheres", ano, _i(parc))

    # --- CNES (retrato único)
    if _tem(con, "saude_mental"):
        for cod, ano, caps, hosp, leitos in _q(
            con,
            "select codigo_ibge, ano, caps, hospitais_especializados, leitos_psiquiatricos_sus from saude_mental",
        ):
            i = res(cod)
            if i is None:
                continue
            a.put(i, "caps", ano, _i(caps))
            a.put(i, "leitos_psiq_sus", ano, _i(leitos))
    return a.d, diag


# ----------------------------------------------------------------------------------------------
# Séries nacionais e por UF
# ----------------------------------------------------------------------------------------------
class Series:
    def __init__(self):
        self.meta: list[dict] = []
        self.dados: dict[str, dict] = {}

    def add(
        self, sid, rotulo, tabela, fonte, unidade, nivel, brasil=None, uf=None, obs=None
    ):
        def lim(v):
            return int(v) if isinstance(v, float) and v.is_integer() else v

        brasil = {k: lim(v) for k, v in (brasil or {}).items() if v is not None}
        uf = {
            u: {k: v for k, v in s.items() if v is not None}
            for u, s in (uf or {}).items()
        }
        uf = {u: s for u, s in uf.items() if s}
        anos = sorted(
            {int(k) for k in brasil} | {int(k) for s in uf.values() for k in s}
        )
        m = {
            "id": sid, "rotulo": rotulo, "tabela": tabela, "fonte_primaria": fonte,
            "unidade": unidade, "nivel": nivel, "anos": [anos[0], anos[-1]] if anos else None,
        }  # fmt: skip
        if obs:
            m["obs"] = obs
        self.meta.append(m)
        self.dados[sid] = {"brasil": brasil, "uf": uf}


def _por_uf(rows, brasil_proprio=None):
    """rows: [(cod_uf2, ano, valor)] → (brasil=soma das UFs, uf). Brasil próprio tem precedência."""
    uf: dict[str, dict[str, float]] = defaultdict(dict)
    br: dict[str, float] = defaultdict(float)
    for cu, ano, v in rows:
        sg = UFS.get(str(cu)[:2])
        if sg is None or v is None:
            continue
        uf[sg][str(ano)] = uf[sg].get(str(ano), 0) + v
        br[str(ano)] += v
    return (brasil_proprio if brasil_proprio is not None else dict(br)), dict(uf)


def _div(num: dict, den: dict, k=1e5, nd=2):
    return {a: _taxa(v, den.get(a), nd) for a, v in num.items() if den.get(a)}


def coletar_nacional(con) -> tuple[dict, dict]:
    S = Series()
    diag: dict = {}

    # Atlas: linhas '0' (Brasil) e UF de 2 dígitos
    cols = {
        "homicidios": "Homicídios (Atlas, SIM + intervenção legal)",
        "homicidios_jovens": "Homicídios de jovens 15-29",
        "homicidios_mulheres": "Homicídios de mulheres",
        "homicidios_homens": "Homicídios de homens",
        "suicidios": "Suicídios",
        "populacao": "População residente (estimativa TCU/IBGE)",
    }
    atlas_br: dict[str, dict] = {c: {} for c in cols}
    atlas_uf: dict[str, dict] = {c: defaultdict(dict) for c in cols}
    for r in _q(
        con,
        "select codigo_ibge, ano, " + ",".join(cols) + " from violencia "
        "where length(codigo_ibge)<=2 and ano>=2000",
    ):
        cod, ano = r[0], r[1]
        for c, v in zip(cols, r[2:]):
            if v is None:
                continue
            if cod == "0":
                atlas_br[c][str(ano)] = _i(v)
            elif cod in UFS:
                atlas_uf[c][UFS[cod]][str(ano)] = _i(v)
    fonte_atlas = (
        "Atlas da Violência (Ipea/FBSP) via Ipeadata AVIOL12_*, a partir do SIM/DATASUS"
    )
    for c, rot in cols.items():
        S.add(
            f"atlas_{c}", rot, "violencia", fonte_atlas,
            "pessoas" if c == "populacao" else "óbitos", "Brasil e UF (série oficial do próprio nível)",
            atlas_br[c], atlas_uf[c],
        )  # fmt: skip

    # População por grupo (projeção UF/Brasil e Censo)
    pg = {
        c: {"br": {}, "uf": defaultdict(dict)}
        for c in ("total", "jovens_15_29", "mulheres")
    }
    for r in _q(
        con,
        "select codigo_ibge, ano, total, jovens_15_29, mulheres from populacao_grupo "
        "where length(codigo_ibge)<=2 and fonte in ('projecao','censo')",
    ):
        for c, v in zip(pg, r[2:]):
            if v is None:
                continue
            if r[0] == "0":
                pg[c]["br"][str(r[1])] = _i(v)
            elif r[0] in UFS:
                pg[c]["uf"][UFS[r[0]]][str(r[1])] = _i(v)
    for (
        c
    ) in pg:  # anos de Censo: Brasil = soma das UFs (o banco só tem Brasil na projeção)
        for u in pg[c]["uf"].values():
            for ano in u:
                if ano not in pg[c]["br"]:
                    pg[c]["br"][ano] = sum(x.get(ano, 0) for x in pg[c]["uf"].values())
    for c, rot in (("total", "População total"), ("jovens_15_29", "População 15-29 anos"),
                   ("mulheres", "População feminina")):  # fmt: skip
        S.add(
            f"pop_{c}", rot + " (projeção IBGE; 2010 e 2022 = Censo)", "populacao_grupo",
            "IBGE SIDRA 7358 (projeção, UF/Brasil) e 9514 (Censo 2010/2022, UF)", "pessoas", "Brasil e UF",
            pg[c]["br"], pg[c]["uf"],
        )  # fmt: skip
    # taxas por 100 mil do grupo (denominador do grupo, não da população toda)
    S.add(
        "taxa_homicidios",
        "Taxa de homicídios por 100 mil habitantes",
        "violencia + populacao_grupo",
        fonte_atlas + "; denominador IBGE",
        "por 100 mil hab.",
        "Brasil e UF",
        _div(atlas_br["homicidios"], pg["total"]["br"]),
        {
            u: _div(s, pg["total"]["uf"].get(u, {}))
            for u, s in atlas_uf["homicidios"].items()
        },
        obs="Denominador = projeção IBGE (pop_total); a taxa do Atlas usa população TCU, por isso difere ligeiramente.",
    )
    S.add(
        "taxa_homicidios_jovens", "Taxa de homicídios de jovens por 100 mil jovens 15-29",
        "violencia + populacao_grupo", fonte_atlas + "; denominador IBGE", "por 100 mil jovens",
        "Brasil e UF",
        _div(atlas_br["homicidios_jovens"], pg["jovens_15_29"]["br"]),
        {u: _div(s, pg["jovens_15_29"]["uf"].get(u, {})) for u, s in atlas_uf["homicidios_jovens"].items()},
    )  # fmt: skip
    S.add(
        "taxa_homicidios_mulheres", "Taxa de homicídios de mulheres por 100 mil mulheres",
        "violencia + populacao_grupo", fonte_atlas + "; denominador IBGE", "por 100 mil mulheres",
        "Brasil e UF",
        _div(atlas_br["homicidios_mulheres"], pg["mulheres"]["br"]),
        {u: _div(s, pg["mulheres"]["uf"].get(u, {})) for u, s in atlas_uf["homicidios_mulheres"].items()},
    )  # fmt: skip

    # Censo: população por raça (Brasil = soma de UF)
    censo_cols = ("pretos", "pardos", "brancos", "amarelos", "indigenas")
    for c in censo_cols:
        rows = _q(
            con,
            f"select codigo_ibge, ano, {c} from populacao_grupo where length(codigo_ibge)=2 and fonte='censo'",
        )
        br, uf = _por_uf(rows)
        S.add(
            f"pop_{c}", f"População {c} (Censo, autodeclaração de cor/raça)", "populacao_grupo",
            "IBGE Censo Demográfico 2010 e 2022 (SIDRA)", "pessoas", "UF; Brasil = soma das UFs", br, uf,
        )  # fmt: skip

    # SIM
    fonte_sim = "SIM/DATASUS, declaração de óbito (município de residência)"

    def sim_serie(sid, rotulo, cond, unidade="óbitos"):
        rows = _q(
            con,
            f"select substr(codigo_ibge,1,2), ano, sum(total) from mortes_violentas where {cond} "
            "group by 1,2",
        )
        br, uf = _por_uf(rows)
        S.add(
            sid,
            rotulo,
            "mortes_violentas",
            fonte_sim,
            unidade,
            "UF; Brasil = soma das UFs",
            br,
            uf,
        )
        return br, uf

    sim_serie("sim_homicidios", "Homicídios (CID-10 X85-Y09)", "tipo='homicidio'")
    sim_serie(
        "sim_intervencao_legal",
        "Mortes por intervenção legal (Y35-Y36)",
        "tipo='intervencao_legal'",
    )
    sim_serie("sim_suicidios", "Suicídios (X60-X84)", "tipo='suicidio'")
    for rc in RACAS:
        sim_serie(
            f"sim_homicidios_raca_{rc}",
            f"Homicídios, vítima {rc}",
            f"tipo='homicidio' and raca='{rc}'",
        )
    neg = sim_serie(
        "sim_homicidios_negros",
        "Homicídios, vítima preta ou parda",
        "tipo='homicidio' and raca in ('preta','parda')",
    )
    for sx, nm in (("M", "homens"), ("F", "mulheres"), ("I", "sexo ignorado")):
        sim_serie(
            f"sim_homicidios_{nm.replace(' ', '_')}",
            f"Homicídios, vítimas {nm}",
            f"tipo='homicidio' and sexo='{sx}'",
        )
    sim_serie(
        "sim_homicidios_jovens",
        "Homicídios de jovens 15-29",
        "tipo='homicidio' and jovem=1",
    )
    sim_serie(
        "sim_homicidios_arma_fogo",
        "Homicídios por arma de fogo (X93-X95)",
        "tipo='homicidio' and meio='arma_fogo'",
    )
    # % negras: sobre homicídios com raça informada
    tot_i = _por_uf(_q(con, "select substr(codigo_ibge,1,2), ano, sum(total) from mortes_violentas "
                            "where tipo='homicidio' and raca!='ignorada' group by 1,2"))  # fmt: skip
    tot_t = _por_uf(_q(con, "select substr(codigo_ibge,1,2), ano, sum(total) from mortes_violentas "
                            "where tipo='homicidio' group by 1,2"))  # fmt: skip
    pct = lambda n, d: {a: _r(v / d[a] * 100, 1) for a, v in n.items() if d.get(a)}  # noqa: E731
    S.add(
        "pct_vitimas_negras_raca_informada", "% de vítimas de homicídio pretas/pardas (entre as com raça informada)",
        "mortes_violentas", fonte_sim, "%", "UF; Brasil = soma das UFs",
        pct(neg[0], tot_i[0]), {u: pct(s, tot_i[1].get(u, {})) for u, s in neg[1].items()},
    )  # fmt: skip
    S.add(
        "pct_vitimas_negras_total", "% de vítimas de homicídio pretas/pardas (sobre todas, raça ignorada no denominador)",
        "mortes_violentas", fonte_sim, "%", "UF; Brasil = soma das UFs",
        pct(neg[0], tot_t[0]), {u: pct(s, tot_t[1].get(u, {})) for u, s in neg[1].items()},
    )  # fmt: skip

    # SINAN infantil
    fonte_sinan = "SINAN Violência (DATASUS), notificações; município de residência"
    for c, rot in (
        ("total", "Notificações de violência contra 0-17 anos (inclui autoprovocada)"),
        ("interpessoal", "Notificações de violência interpessoal contra 0-17"),
        ("autoprovocada", "Notificações de violência autoprovocada 0-17"),
        ("fisica", "Notificações de violência física 0-17"),
        ("psicologica", "Notificações de violência psicológica 0-17"),
        ("sexual", "Notificações de violência sexual 0-17"),
        ("negligencia", "Notificações de negligência 0-17"),
        ("tortura", "Notificações de tortura 0-17"),
        ("trabalho_infantil", "Notificações de trabalho infantil 0-17"),
    ):
        rows = _q(
            con,
            f"select substr(codigo_ibge,1,2), ano, sum({c}) from violencia_infantil group by 1,2",
        )
        br, uf = _por_uf(rows)
        S.add(
            f"viol_infantil_{c}", rot, "violencia_infantil", fonte_sinan, "notificações",
            "UF; Brasil = soma das UFs", br, uf,
            obs="Tipos se sobrepõem (uma notificação pode ser física e sexual). Mede notificação, não incidência.",
        )  # fmt: skip
    # SINAN geral, mulheres
    for c, rot in (("total", "Notificações de violência contra mulheres"),
                   ("parceiro", "Notificações de violência contra mulheres por parceiro/ex"),
                   ("sexual", "Notificações de violência sexual contra mulheres")):  # fmt: skip
        rows = _q(
            con,
            f"select substr(codigo_ibge,1,2), ano, sum({c}) from sinan_violencia where sexo='F' group by 1,2",
        )
        br, uf = _por_uf(rows)
        S.add(
            f"sinan_mulheres_{c}", rot, "sinan_violencia", fonte_sinan, "notificações",
            "UF; Brasil = soma das UFs", br, uf,
            obs="Mede notificação, não incidência; cobertura desigual entre municípios.",
        )  # fmt: skip
    # SINASC
    fonte_sinasc = "SINASC/DATASUS (município de residência da mãe)"
    for sid, rot, expr in (
        ("nascidos_total", "Nascidos vivos", "total"),
        ("mae_ate_14", "Nascidos vivos de mães até 14 anos", "mae_ate_9+mae_10_14"),
        ("mae_15_17", "Nascidos vivos de mães de 15 a 17 anos", "mae_15_17"),
        (
            "mae_ate_17",
            "Nascidos vivos de mães até 17 anos",
            "mae_ate_9+mae_10_14+mae_15_17",
        ),
    ):
        rows = _q(
            con,
            f"select substr(codigo_ibge,1,2), ano, sum({expr}) from nascidos_mae_menor group by 1,2",
        )
        br, uf = _por_uf(rows)
        S.add(
            sid,
            rot,
            "nascidos_mae_menor",
            fonte_sinasc,
            "nascidos",
            "UF; Brasil = soma das UFs",
            br,
            uf,
        )
    # População prisional (snapshot 2025/2)
    if _tem(con, "populacao_prisional"):
        cols_p = {
            "pretos": "Presos pretos", "pardos": "Presos pardos", "brancos": "Presos brancos",
            "amarelos": "Presos amarelos", "indigenas": "Presos indígenas",
            "raca_nao_informada": "Presos sem raça informada",
            "estupro": "Incidências penais: estupro", "estupro_vulneravel": "Incidências penais: estupro de vulnerável",
            "homicidio_simples": "Incidências penais: homicídio simples",
            "homicidio_qualificado": "Incidências penais: homicídio qualificado",
            "latrocinio": "Incidências penais: latrocínio", "trafico_drogas": "Incidências penais: tráfico de drogas",
        }  # fmt: skip
        pr = _q(
            con,
            "select uf, ano, referencia, "
            + ",".join(cols_p)
            + " from populacao_prisional",
        )
        for k, (c, rot) in enumerate(cols_p.items()):
            uf: dict = defaultdict(dict)
            for row in pr:
                if row[0] in UFS.values() and row[3 + k] is not None:
                    uf[row[0]][str(row[1])] = _i(row[3 + k])
            br: dict = defaultdict(int)
            for s in uf.values():
                for a_, v in s.items():
                    br[a_] += v
            S.add(
                f"prisional_{c}", rot + " (2025/2)", "populacao_prisional",
                "SISDEPEN/SENAPPEN, 2025 semestre 2 (contagens por estabelecimento)",
                "pessoas" if k < 6 else "incidências", "UF; Brasil = soma das UFs", dict(br), uf,
                obs="Raça e tipo penal são contagens paralelas: nunca cruzar. Incidência penal ≠ pessoa (uma pessoa pode ter várias).",
            )  # fmt: skip
    # Indicadores sociais
    if _tem(con, "indicadores_sociais"):
        for ind, rot, un in (
            ("pobreza", "Pobreza", "% da população"), ("desemprego", "Desemprego", "%"),
            ("gini", "Índice de Gini", "0-1"), ("analfabetismo", "Analfabetismo (15 anos ou mais)", "%"),
        ):  # fmt: skip
            uf: dict = defaultdict(dict)
            for u, ano, v in _q(
                con,
                "select uf, ano, valor from indicadores_sociais where indicador=?",
                (ind,),
            ):
                if u in UFS.values():
                    uf[u][str(ano)] = _r(v, 3)
            S.add(
                f"social_{ind}", rot, "indicadores_sociais", "Ipeadata, base Social (PNAD Contínua/IBGE)", un,
                "UF (sem linha Brasil na tabela)", None, uf,
            )  # fmt: skip
    # Álcool
    if _tem(con, "consumo_alcool"):
        for ind in ("abusivo", "frequente"):
            br = {}
            uf: dict = defaultdict(dict)
            for cod, ano, v in _q(
                con,
                "select codigo_ibge, ano, valor from consumo_alcool where indicador=? and length(codigo_ibge)<=2",
                (ind,),
            ):
                if cod == "0":
                    br[str(ano)] = _r(v, 4)
                elif cod in UFS:
                    uf[UFS[cod]][str(ano)] = _r(v, 4)
            S.add(
                f"alcool_{ind}", f"Consumo de álcool {ind} (fração dos adultos)", "consumo_alcool",
                "PNS 2019 (IBGE) via SIDRA", "fração 0-1", "Brasil e UF (medido). Município NÃO exportado: é a taxa da UF repetida",
                br, uf,
            )  # fmt: skip
    # Saúde mental
    if _tem(con, "saude_mental"):
        for c, rot in (("caps", "CAPS"), ("leitos_psiquiatricos_sus", "Leitos psiquiátricos SUS"),
                       ("hospitais_especializados", "Hospitais especializados")):  # fmt: skip
            rows = _q(
                con,
                f"select substr(codigo_ibge,1,2), ano, sum({c}) from saude_mental group by 1,2",
            )
            br, uf = _por_uf(rows)
            S.add(
                f"saude_mental_{c}", rot + " (CNES, retrato 2024)", "saude_mental", "CNES/DATASUS", "unidades/leitos",
                "UF; Brasil = soma das UFs", br, uf,
            )  # fmt: skip
    return S, diag


# ----------------------------------------------------------------------------------------------
# Validações
# ----------------------------------------------------------------------------------------------
def _soma(d: dict, a) -> float | None:
    return d.get(str(a))


def validar(
    con, res: Resolver, linhas: dict, S: Series, diag_mun: dict, territorios, fator
) -> dict:
    V: dict = {}
    D = S.dados

    # (a) homicídios nacionais por ano
    anos = sorted(
        {int(k) for k in D["atlas_homicidios"]["brasil"]} & set(range(2010, 2025))
    )
    tab = []
    for ano in anos:
        k = str(ano)
        br = D["atlas_homicidios"]["brasil"].get(k)
        suf = sum(s.get(k, 0) for s in D["atlas_homicidios"]["uf"].values())
        smun = sum(ln.get("homicidios", {}).get(k, 0) for ln in linhas.values())
        tem_mun = any(
            "homicidios" in ln and k in ln["homicidios"] for ln in linhas.values()
        )
        sh = D["sim_homicidios"]["brasil"].get(k)
        si = D["sim_intervencao_legal"]["brasil"].get(k)
        tab.append({
            "ano": ano, "atlas_brasil": br, "atlas_soma_uf": suf or None,
            "atlas_soma_municipios": _i(smun) if tem_mun else None,
            "sim_homicidio": sh, "sim_intervencao_legal": si,
            "sim_homicidio_mais_intervencao": (sh + si) if sh is not None and si is not None else None,
            "dif_atlas_brasil_menos_soma_uf": (br - suf) if br is not None and suf else None,
            "dif_atlas_brasil_menos_soma_municipios": (br - smun) if br is not None and tem_mun else None,
            "dif_atlas_brasil_menos_sim_hom_int": (br - (sh + si)) if None not in (br, sh, si) else None,
        })  # fmt: skip
    V["homicidios_nacional_por_ano"] = tab
    conf = []
    for ano, p in PUBLICADOS_HOMICIDIOS.items():
        br = D["atlas_homicidios"]["brasil"].get(str(ano))
        conf.append({
            "ano": ano, "publicado": p["valor"], "banco_atlas_brasil": br,
            "diferenca": None if br is None else br - p["valor"],
            "fonte": p["fonte"], "url": p["url"],
        })  # fmt: skip
    V["homicidios_vs_publicado"] = conf

    # Atlas municipal vs SIM por município (onde ambos existem)
    cmp_ = {}
    for ano in range(ANO_MIN, ANO_MAX + 1):
        k = str(ano)
        n = ig = 0
        for ln in linhas.values():
            h = ln.get("homicidios", {}).get(k)
            sh = ln.get("sim_homicidios", {}).get(k)
            if h is None or sh is None:
                continue
            si = ln.get("sim_intervencao_legal", {}).get(k, 0)
            n += 1
            ig += h == sh + si
        if n:
            cmp_[k] = {
                "municipios_comparados": n,
                "iguais": ig,
                "pct_iguais": round(ig / n * 100, 2),
            }
    V["atlas_municipal_vs_sim_por_municipio"] = cmp_
    V["anos_atlas_municipal_excluidos"] = diag_mun["anos_atlas_municipal_excluidos"]

    # (a2) fator_humano
    fh: dict = {}
    if fator:
        fh = {i["id"]: i for i in fator.get("indicadores", [])}
    corrob = []

    def item(fid, calc, nota, tol_rel=0.005, corroborado=None, v=None):
        ind = fh.get(fid)
        if ind is None:
            return
        v = ind.get("valor") if v is None else v
        st = corroborado
        if st is None and v is not None and calc is not None:
            st = abs(calc - v) <= abs(v) * tol_rel
        corrob.append({
            "id": fid, "valor_fator_humano": v, "verificado_no_fator_humano": ind.get("verificado"),
            "valor_dado_primario_agregado": calc,
            "status": "corrobora" if st else ("diverge" if st is False else "nao_conferivel"),
            "nota": nota,
        })  # fmt: skip

    h23 = D["atlas_homicidios"]["brasil"].get("2023")
    j23 = D["atlas_homicidios_jovens"]["brasil"].get("2023")
    j17 = D["atlas_homicidios_jovens"]["brasil"].get("2017")
    item(
        "vu-homicidios-2023", h23, "Atlas/Ipeadata 2023, Brasil (violencia.homicidios)"
    )
    item("vu-jovens-2023", j23, "Atlas/Ipeadata 2023, jovens 15-29")
    pj = D["pop_jovens_15_29"]["brasil"]
    t23 = D["taxa_homicidios_jovens"]["brasil"].get("2023")
    t17 = D["taxa_homicidios_jovens"]["brasil"].get("2017")
    item("vu-taxa-jovens-2023", t23,
         f"jovens 2023 / pop. 15-29 projeção IBGE ({pj.get('2023')}); tolerância 2%", tol_rel=0.02)  # fmt: skip
    t_all = D["taxa_homicidios"]["brasil"].get("2023")
    if t17 and t23:
        item("vu-queda-2017", round((1 - t23 / t17) * 100, 1),
             f"queda da taxa de jovens 2017 ({t17}) a 2023 ({t23}) com pop. 15-29 da projeção IBGE vigente no banco; "
            f"a contagem cai {round((1 - j23 / j17) * 100, 1)}% (35.783 -> 21.856). A diferença vem do denominador: "
            "o Atlas usa a população de cada edição, o banco guarda uma só revisão. Direção corrobora; o 30,2% não reproduz.", tol_rel=0.02)  # fmt: skip
    pct23 = D["pct_vitimas_negras_total"]["brasil"].get("2023")
    item(
        "vu-negros-2023",
        pct23,
        "Parte 76,97% do campo `unidade`. % pretas/pardas entre TODOS os homicídios SIM 2023 "
        "(raça ignorada no denominador, sem intervenção legal); tolerância 0,3 pp.",
        v=76.97,
        tol_rel=0.004,
    )
    ig = D["pop_indigenas"]["brasil"]
    item("ind-censo-2022", ig.get("2022"),
         "populacao_grupo.indigenas = quesito cor/raça (SIDRA 9605); o número oficial 1.694.836 inclui "
         "'se considera indígena' (SIDRA 9718). Diverge por definição, não por erro.")  # fmt: skip
    item(
        "ind-censo-2010",
        ig.get("2010"),
        "Censo 2010: o banco tem 817.963 (só quesito cor/raça); 896.917 é o total que inclui indígenas que se "
        "declararam de outra cor/raça mas vivem em terras indígenas. Diverge por definição, não por erro.",
    )
    # 47,8% de jovens
    if h23 and j23:
        corrob.append({
            "id": "vu-jovens-2023 (47,8% do total)", "valor_fator_humano": 47.8,
            "valor_dado_primario_agregado": round(j23 / h23 * 100, 1),
            "status": "corrobora" if abs(j23 / h23 * 100 - 47.8) < 0.1 else "diverge",
            "nota": "jovens/total, Atlas 2023", "verificado_no_fator_humano": None,
        })  # fmt: skip
    # analfabetismo 2022 (PNAD, 15+) ponderado por população total das UFs: aproximação
    if "social_analfabetismo" in D and "atlas_populacao" in D:
        s = D["social_analfabetismo"]["uf"]
        pt = D["atlas_populacao"]["uf"]
        num = den = 0
        for u, ser in s.items():
            if "2022" in ser and "2022" in pt.get(u, {}):
                num += ser["2022"] * pt[u]["2022"]
                den += pt[u]["2022"]
        if den:
            item("edu-analf-2022", round(num / den, 2),
                 "média das UFs ponderada pela população TOTAL (aproximação; o denominador correto é a pop. 15+); "
                 "PNAD Contínua, não o Censo; tolerância 15%", tol_rel=0.15)  # fmt: skip
    V["fator_humano_corroboracao"] = corrob
    V["taxa_homicidios_brasil_2023_por_100mil_hab"] = t_all

    # Razão de risco 2022 (negros vs não negros) com Censo 2022 — referência, não corrobora o 2,7 de 2023
    try:
        k = "2022"
        pn = D["pop_pretos"]["brasil"][k] + D["pop_pardos"]["brasil"][k]
        pb = sum(
            D[f"pop_{c}"]["brasil"][k] for c in ("brancos", "amarelos", "indigenas")
        )
        hn = D["sim_homicidios_negros"]["brasil"][k]
        hb = sum(
            D[f"sim_homicidios_raca_{c}"]["brasil"][k]
            for c in ("branca", "amarela", "indigena")
        )
        hi = D["sim_homicidios_raca_ignorada"]["brasil"][k]
        bruto = (hn / pn) / (hb / pb)
        realoc = ((hn * (1 + hi / (hn + hb))) / pn) / ((hb * (1 + hi / (hn + hb))) / pb)
        V["razao_risco_negros_2022"] = {
            "razao_bruta_sim_homicidio_x_censo_2022": round(bruto, 2),
            "nota": "taxa(preta+parda)/taxa(branca+amarela+indígena); homicídios SIM 2022 (sem intervenção legal) / Censo 2022; "
                    f"{hi} vítimas de raça ignorada ficaram fora (realocação proporcional não altera a razão). "
                    "Referência para o 2,7 do Atlas (que é média 2012-2022 e usa outra base).",
        }  # fmt: skip
        del realoc
        if "vu-negros-2023" in fh:
            corrob.append({
                "id": "vu-negros-2023 (razão de risco 2,7)", "valor_fator_humano": 2.7,
                "verificado_no_fator_humano": fh["vu-negros-2023"].get("verificado"),
                "valor_dado_primario_agregado": round(bruto, 2),
                "status": "corrobora" if abs(bruto - 2.7) <= 0.2 else "diverge",
                "nota": "Razão bruta 2022 (SIM homicídio / Censo 2022), não 2023: ordem de grandeza compatível; "
                        "o 2,7 do Atlas é média 2012-2022 com outra base. Corroboração aproximada, não reprodução.",
            })  # fmt: skip
    except (KeyError, ZeroDivisionError):
        pass

    # (b) populacao_grupo vs territorios.json
    if territorios:
        tl = territorios["linhas"]
        cen = {}
        for i, ln in linhas.items():
            if "pop_censo" in ln and "2022" in ln["pop_censo"]:
                cen[i] = ln

        def comp(campo_db, f_terr, nome):
            n = ig_ = 0
            maxd = 0
            soma_db = soma_t = 0
            exemplos = []
            for i, ln in cen.items():
                t = tl.get(i)
                if not t or t.get(f_terr(t, "k")) is None:
                    continue
                v = f_terr(t, "v")
                d = campo_db(ln)
                if d is None or v is None:
                    continue
                n += 1
                soma_db += d
                soma_t += v
                dif = d - v
                ig_ += dif == 0
                if abs(dif) > abs(maxd):
                    maxd = dif
                if dif != 0 and len(exemplos) < 5:
                    exemplos.append({"ibge": i, "banco": d, "territorios": v})
            return {
                "campo": nome, "municipios_comparados": n, "municipios_iguais": ig_,
                "soma_banco": _i(soma_db), "soma_territorios": _i(soma_t),
                "maior_diferenca_absoluta": maxd, "exemplos_divergentes": exemplos,
            }  # fmt: skip

        g = lambda c: lambda ln: ln.get(c, {}).get("2022")  # noqa: E731
        rel = [
            comp(g("pop_censo"), lambda t, m: "pop_total" if m == "k" else t["pop_total"], "pop_total (Censo 2022)"),
            comp(g("pop_indigenas"), lambda t, m: "pop_indigena_cor_raca" if m == "k" else t["pop_indigena_cor_raca"],
                 "indígenas por cor/raça (populacao_grupo.indigenas × pop_indigena_cor_raca)"),
            comp(g("pop_indigenas"), lambda t, m: "pop_indigena" if m == "k" else t["pop_indigena"],
                 "indígenas (populacao_grupo.indigenas × pop_indigena oficial, inclui 'se considera')"),
        ]  # fmt: skip
        # pretos+pardos em % × pct_pretos_pardos
        n = bem = 0
        maxd = 0.0
        for i, ln in cen.items():
            t = tl.get(i)
            if not t or t.get("pct_pretos_pardos") is None:
                continue
            p, pa, tot = (
                ln.get(c, {}).get("2022")
                for c in ("pop_pretos", "pop_pardos", "pop_censo")
            )
            if None in (p, pa, tot) or not tot:
                continue
            d = (p + pa) / tot * 100 - t["pct_pretos_pardos"]
            n += 1
            bem += abs(d) < 0.01
            maxd = max(maxd, abs(d))
        rel.append({"campo": "pct_pretos_pardos", "municipios_comparados": n,
                    "municipios_iguais_tol_0.01pp": bem, "maior_diferenca_pp": round(maxd, 4)})  # fmt: skip
        rel.append({
            "campo": "quilombolas",
            "nota": "populacao_grupo NÃO tem coluna de população quilombola nem religião quilombola: a conferência "
                    "de quilombolas contra territorios.json (SIDRA 9578) não é possível com este banco.",
        })  # fmt: skip
        no_banco = set(tl) - set(cen)
        rel.append({"campo": "cobertura", "municipios_territorios_sem_censo_no_banco": len(no_banco),
                    "municipios_banco_sem_territorios": len(set(cen) - set(tl))})  # fmt: skip
        V["populacao_grupo_vs_territorios"] = rel

    # (c) soma por UF = Brasil, duplicatas e negativos
    chk = []
    for sid in (
        "atlas_homicidios",
        "atlas_homicidios_jovens",
        "atlas_homicidios_mulheres",
        "atlas_populacao",
        "pop_total",
        "pop_jovens_15_29",
        "pop_mulheres",
    ):
        d = D[sid]
        n = bad = 0
        maxd = 0
        for k, v in d["brasil"].items():
            suf = sum(s.get(k, 0) for s in d["uf"].values())
            n += 1
            if abs(suf - v) > 0:
                bad += 1
                maxd = max(maxd, abs(suf - v))
        chk.append(
            {
                "serie": sid,
                "anos": n,
                "anos_com_soma_uf_diferente_de_brasil": bad,
                "maior_diferenca": maxd,
            }
        )
    V["soma_uf_vs_brasil_series_com_total_proprio"] = chk
    V["soma_uf_vs_brasil_series_derivadas"] = (
        "Nas demais séries Brasil = soma das UFs por construção; a checagem útil é a soma municipal = soma UF, "
        "feita abaixo para sim_homicidios (municípios sem match não entram em nenhum dos lados)."
    )
    dup = {}
    for tab, chave in (
        ("violencia", "codigo_ibge, ano"),
        (
            "mortes_violentas",
            "codigo_ibge, ano, tipo, meio, raca, sexo, local, jovem, faixa, alcool_cat, mencao_alcool",
        ),
        ("violencia_infantil", "codigo_ibge, ano, faixa, sexo"),
        ("sinan_violencia", "codigo_ibge, ano, sexo"),
        ("nascidos_mae_menor", "codigo_ibge, ano"),
        ("populacao_grupo", "codigo_ibge, ano, fonte"),
        ("consumo_alcool", "codigo_ibge, ano, indicador"),
        ("saude_mental", "codigo_ibge, ano"),
        ("indicadores_sociais", "uf, ano, indicador"),
        ("populacao_prisional", "uf, ano, referencia"),
    ):
        if _tem(con, tab):
            dup[tab] = _q(
                con,
                f"select count(*) from (select 1 from {tab} group by {chave} having count(*)>1)",
            )[0][0]
    V["chaves_duplicadas_por_tabela"] = dup
    neg = {}
    for tab, cols in (
        (
            "violencia",
            [
                "homicidios",
                "homicidios_jovens",
                "homicidios_mulheres",
                "suicidios",
                "populacao",
            ],
        ),
        ("mortes_violentas", ["total"]),
        ("violencia_infantil", ["total", "sexual", "fisica"]),
        ("sinan_violencia", ["total", "parceiro"]),
        ("nascidos_mae_menor", ["total", "mae_10_14", "mae_15_17"]),
        (
            "populacao_grupo",
            ["total", "jovens_15_29", "mulheres", "pretos", "pardos", "indigenas"],
        ),
    ):
        if _tem(con, tab):
            neg[tab] = sum(
                _q(con, f"select count(*) from {tab} where {c}<0")[0][0] for c in cols
            )
    V["valores_negativos_por_tabela"] = neg
    # UF do código × coluna uf
    inc = {}
    for tab in (
        "mortes_violentas",
        "violencia_infantil",
        "sinan_violencia",
        "nascidos_mae_menor",
    ):
        if _tem(con, tab):
            ufs_inv = {k: v for k, v in UFS.items()}
            n = 0
            for cod2, uf in _q(
                con, f"select distinct substr(codigo_ibge,1,2), uf from {tab}"
            ):
                if uf is not None and ufs_inv.get(cod2) != uf:
                    n += 1
            inc[tab] = n
    V["pares_prefixo_uf_x_coluna_uf_inconsistentes"] = inc
    # soma municipal × UF para o SIM
    bruto = {
        str(a): _q(
            con,
            "select sum(total) from mortes_violentas where tipo='homicidio' and ano=?",
            (a,),
        )[0][0]
        for a in (2015, 2022, 2023)
    }
    emitido = {
        k: _i(sum(ln.get("sim_homicidios", {}).get(k, 0) for ln in linhas.values()))
        for k in bruto
    }
    V["sim_homicidios_soma_banco_vs_exportado_municipal"] = {
        k: {"banco": bruto[k], "exportado": emitido[k]} for k in bruto
    }
    V["join_municipal"] = res.relatorio()
    return V


# ----------------------------------------------------------------------------------------------
# Build
# ----------------------------------------------------------------------------------------------
def _fontes_meta(con) -> list[dict]:
    out = []
    for tab, desc, prim, url in FONTES:
        if not _tem(con, tab):
            continue
        n = _q(con, f"select count(*) from {tab}")[0][0]
        cols = {r[1] for r in _q(con, f"pragma table_info({tab})")}
        if "ano" in cols:
            lo, hi = _q(con, f"select min(ano), max(ano) from {tab}")[0]
            anos = [lo, hi]
        else:
            anos = None
        out.append({"tabela": tab, "descricao": desc, "fonte_primaria": prim, "anos": anos,
                    "linhas": n, "url": url})  # fmt: skip
    return out


LACUNAS = [
    "Proveniência indireta: números vêm do banco do projeto Arandu/trans, não das fontes primárias; a ETL "
    "daquele projeto não foi reauditada aqui.",
    "Atlas municipal termina em 2022 (SIM consolida tarde); 2023-2024 só existem no nível UF/Brasil do Atlas. "
    "Em 2023, `sim_homicidios`/`sim_intervencao_legal` (SIM agregado) cobrem o município; 2024 não tem SIM municipal.",
    "consumo_alcool municipal NÃO é exportado: é a taxa da UF repetida para cada município (estimativa, não medida). "
    "O valor medido (PNS 2019) está em humano_nacional.json por UF.",
    "saude_mental só tem retrato 2024 e só municípios com alguma estrutura (2.363); ausência de linha NÃO é exportada "
    "como zero (pode ser zero real ou lacuna do CNES).",
    "violencia_infantil e sinan_violencia: contagem de notificações, não de casos; municípios sem linha ficam null "
    "(sem notificante ≠ sem violência).",
    "populacao_grupo municipal só existe nos anos de Censo (2010, 2022); taxas por grupo (jovens, mulheres) só nesses anos.",
    "populacao_grupo não tem população quilombola; a conferência de quilombolas com territorios.json não é possível.",
    "populacao_prisional é UF-only (2025/2) e conta incidências penais, não pessoas; sem município.",
    "indicadores_sociais é UF-only (PNAD Contínua) e não tem linha Brasil.",
    "Nada mede: causalidade, mortes de causa indeterminada (MVCI, que o Atlas 2024-26 estima em dezenas de milhares), "
    "subnotificação, nem violência não letal fora do SINAN.",
]


def build(
    db: str | Path | None = None,
    geo: Path = GEO,
    out_dir: Path = OUT_DIR,
    territorios_path: Path | None = TERRITORIOS,
    fator_path: Path | None = FATOR_HUMANO,
) -> dict:
    caminho = db or os.environ.get(ENV_DB)
    if not caminho:
        raise SystemExit(
            f"informe --db <caminho do trans.db> ou a variável de ambiente {ENV_DB}"
        )
    con = abrir_ro(caminho)
    try:
        res = Resolver(carregar_geo(geo))
        linhas, diag = coletar_municipal(con, res)
        S, _ = coletar_nacional(con)
        terr = (
            json.loads(Path(territorios_path).read_text(encoding="utf-8"))
            if territorios_path and Path(territorios_path).exists()
            else None
        )
        fat = (
            json.loads(Path(fator_path).read_text(encoding="utf-8"))
            if fator_path and Path(fator_path).exists()
            else None
        )
        val = validar(con, res, linhas, S, diag, terr, fat)
        fontes = _fontes_meta(con)
    finally:
        con.close()

    anos = sorted({int(a) for ln in linhas.values() for s in ln.values() for a in s})
    agora = datetime.now(UTC).isoformat(timespec="seconds")
    mun = {
        "meta": {"gerado_em": agora, "fontes": fontes, "aviso": AVISO, "lacunas": LACUNAS, "validacao": val,
                 "campos": "cada campo é {ano: valor}; só aparecem campos/anos com dado (null ≠ 0)"},
        "anos": anos,
        "linhas": {i: linhas[i] for i in sorted(linhas)},
    }  # fmt: skip
    nac = {
        "meta": {
            "gerado_em": agora,
            "aviso": AVISO,
            "fontes": fontes,
            "lacunas": LACUNAS,
            "series": S.meta,
            "validacao_resumo": {
                k: val[k]
                for k in (
                    "homicidios_nacional_por_ano",
                    "homicidios_vs_publicado",
                    "fator_humano_corroboracao",
                )
                if k in val
            },
        },  # fmt: skip
        "anos": sorted(
            {int(a) for d in S.dados.values() for a in d["brasil"]}
            | {int(a) for d in S.dados.values() for s in d["uf"].values() for a in s}
        ),  # fmt: skip
        "series": S.dados,
    }
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    for nome, obj in (("humano_municipal.json", mun), ("humano_nacional.json", nac)):
        (out_dir / nome).write_text(
            json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )
    return {"municipal": mun, "nacional": nac}

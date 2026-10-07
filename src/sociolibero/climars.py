"""Camada climática municipal do RS (índice de prioridade preventiva), vinda do projeto irmão `climate`.

Saída: `web/public/data/clima_rs_municipal.json` (ver docs/METHODS.md, seção "Camada climática RS" e
docs/SELOS_DE_PROVENIENCIA.md).

Proveniência indireta: os números NÃO são recalculados aqui. Vêm do snapshot congelado da API do projeto
`F:\\CODE\\climate` ("Central de Risco Climática RS"), que por sua vez cita IBGE MUNIC 2024, JRC Global
Surface Water, GHSL, ANA, CNES e OSM. Este módulo só LÊ o snapshot (nunca escreve no projeto de origem),
junta por código IBGE de 7 dígitos, preserva o selo `basis` de cada componente e valida.

Regras herdadas e conferidas aqui:
- ausência é `null`, nunca `0` (nenhum valor ausente é convertido em número);
- o índice é prioridade preventiva, NÃO previsão de cheia; `manutencao_ativos` é sempre nulo;
- cobertura mínima de peso 0,60 e impacto ou déficit presente (ADR-019 do projeto climate): município que
  não passa fica sem índice (caso Bagé), nunca promovido por falta de dado.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

SNAPSHOT = Path(r"F:\CODE\climate\web\public\static-api")
GEO = Path("web/public/data/geo/municipios.geojson")
TERR = Path("web/public/data/territorios.json")
OUT = Path("web/public/data/clima_rs_municipal.json")

PESOS = {"impacto": 0.38, "deficit_prevencao": 0.34, "exposicao": 0.28}
MIN_COBERTURA_PESO = 0.60
BASIS_VALIDOS = {"measured", "modeled", "synthetic"}
CENARIOS = ("atual", "estrutural", "ond2026")

AVISO = (
    "Índice de PRIORIDADE PREVENTIVA, não previsão de cheia: ordena onde a próxima tempestade encontra a pior "
    "combinação de impacto já observado (MUNIC 2024, evento de 26/04/2024), déficit declarado de prevenção e "
    "exposição. Os componentes impacto e déficit são auto-declaração da prefeitura ao IBGE. O perigo sazonal (ONI) "
    "é estadual e uniforme: desloca o nível de todos, nunca reordena. Pesos são escolha editorial declarada, "
    "nunca calibrada contra desfecho. Valores vêm do snapshot do projeto climate; aqui não foram recalculados."
)
RESSALVAS = [
    "Município que não respondeu ao suplemento MUNIC fica sem índice (null), não com índice baixo nem alto.",
    "manutencao_ativos (casas de bomba, diques, comportas) é sempre null: não existe base pública municipal.",
    "Memória hídrica (JRC 1984-2021) não entra no índice: satélite óptico não distingue banhado de arrozal irrigado.",
    "Superfície construída (GHSL) é proxy de impermeabilização, não medida dela.",
    "CN e erosão (RUSLE, P=1) são modelados sem calibração contra vazão: só sustentam ordem entre municípios, não lâmina nem t/ha.",
    "Retrato de um único evento (26/04/2024): município poupado por trajetória aparece com impacto baixo.",
    "Inconsistência de origem: no cenário atual o snapshot dá selo measured ao perigo_sazonal, mas o model_card o descreve como modeled (H é função modelada do ONI medido).",
    "Não há previsão ENSO para 2027; para 2027 em diante vale o cenário estrutural (sem perigo sazonal).",
]
FONTES_PRIMARIAS = [
    "IBGE MUNIC 2024, suplemento Evento Climático RS (impacto, déficit, grupos expostos)",
    "IBGE malha e população 2024",
    "NOAA CPC ONI (perigo sazonal)",
    "JRC Global Surface Water v1.4, 1984-2021 (memória hídrica)",
    "GHSL Built-up Surface 2025 (superfície construída)",
    "IBGE BDiA 1:250.000 (solo, cobertura, relevo para CN e RUSLE), GHCN-Daily (chuva)",
    "ANA/SNIRH (regime de cheia), CNES/DATASUS e OpenStreetMap (recursos, fora deste recorte)",
]


def _ler(p: Path) -> dict:
    return json.loads(p.read_text(encoding="utf-8"))


def cobertura_peso(comp: dict) -> float:
    """Peso coberto pelos componentes I, D, E presentes (valor não nulo). Derivado aqui, não vem do snapshot."""
    return round(
        sum(
            w for k, w in PESOS.items() if (comp.get(k) or {}).get("valor") is not None
        ),
        2,
    )


def _get(d: dict | None, *ks):
    for k in ks:
        if not isinstance(d, dict):
            return None
        d = d.get(k)
    return d


def _frac(aguas: dict | None, k: str):
    return _get(aguas, k, "frac")


def linha(
    cod: str,
    nome_geo: str | None,
    m_atual: dict,
    m_estr: dict | None,
    m_ond: dict | None,
    dossie: dict | None,
) -> dict:
    """Uma linha municipal. Só repassa o que o snapshot traz; ausente vira None."""
    comp = m_atual["componentes"]

    def c(k):
        x = comp.get(k) or {}
        return {
            "valor": x.get("valor"),
            "basis": x.get("basis"),
            "detalhe": x.get("detalhe"),
        }

    aguas = m_atual.get("aguas")
    per = (dossie or {}).get("perigo") or {}
    pos = (dossie or {}).get("posicao") or {}
    imp = per.get("impermeabilizacao")
    terr = per.get("terreno")
    eros = per.get("degradacao_solo")
    aces = per.get("acesso")
    geot = per.get("geotecnico")
    return {
        "nome": nome_geo or m_atual.get("municipio"),
        "nome_snapshot": m_atual.get("municipio"),
        "populacao_snapshot": m_atual.get("populacao"),
        "indice": {
            "score_atual": m_atual.get("score"),
            "nivel_atual": m_atual.get("level"),
            "score_estrutural": (m_estr or {}).get("score"),
            "nivel_estrutural": (m_estr or {}).get("level"),
            "score_ond2026": (m_ond or {}).get("score"),
            "basis": m_atual.get("basis"),
            "completude": m_atual.get("completude"),
            "cobertura_peso": cobertura_peso(comp),
            "posicao_ranking_atual": pos.get("posicao_no_ranking"),
        },
        "componentes": {
            "impacto": c("impacto"),
            "deficit_prevencao": c("deficit_prevencao"),
            "exposicao": c("exposicao"),
            "perigo_sazonal": {
                "valor": _get(comp, "perigo_sazonal", "valor"),
                "basis": _get(comp, "perigo_sazonal", "basis"),
            },
            "manutencao_ativos": {"valor": None, "basis": None},
        },
        "medidos": {
            "memoria_hidrica": None
            if aguas is None
            else {
                "permanente_frac": _frac(aguas, "permanente"),
                "sazonal_frac": _frac(aguas, "sazonal"),
                "perdida_frac": _frac(aguas, "perdida"),
                "efemera_frac": _frac(aguas, "efemera"),
                "memoria_hidrica_frac": aguas.get("memoria_hidrica_frac"),
                "memoria_hidrica_km2": aguas.get("memoria_hidrica_km2"),
                "area_grade_km2": aguas.get("area_grade_km2"),
                "basis": aguas.get("basis"),
            },
            "superficie_construida_ghsl": None
            if imp is None
            else {
                "frac_construida": imp.get("frac_construida"),
                "limiar_rs": imp.get("limiar_rs"),
                "acima_do_limiar": imp.get("acima_do_limiar"),
                "basis": imp.get("basis"),
            },
            "acesso": None
            if aces is None
            else {
                "dano_viario": aces.get("dano_viario"),
                "ficou_ilhado": aces.get("ficou_ilhado"),
                "basis": aces.get("basis"),
            },
            "geotecnico": None
            if geot is None
            else {"score": geot.get("score"), "basis": geot.get("basis")},
        },
        "modelados": {
            "curve_number": None
            if terr is None
            else {
                "cn2": terr.get("cn2"),
                "cn3_solo_umido": terr.get("cn3_solo_umido"),
                "resposta": terr.get("resposta"),
                "basis": terr.get("basis"),
            },
            "erosao_rusle": None
            if eros is None
            else {
                "indice_t_ha_ano": eros.get("indice_rusle_t_ha_ano"),
                "percentil_rs": eros.get("percentil_rs"),
                "classe": eros.get("classe"),
                "frac_uso_intensivo_em_declive": eros.get(
                    "frac_uso_intensivo_em_declive"
                ),
                "basis": eros.get("basis"),
            },
        },
    }


def validar(
    linhas: dict,
    rs_geo: dict[str, str],
    terr_pop: dict[str, int | None],
    risk_atual: dict,
) -> dict:
    """Validações numéricas. `rs_geo` = {codigo: nome} dos municípios RS da malha; `terr_pop` = pop_total (Censo 2022)."""
    cods = set(linhas)
    geo = set(rs_geo)
    v: dict = {
        "n_snapshot": len(cods),
        "n_geojson_rs": len(geo),
        "sem_geometria": sorted(cods - geo),
        "geometria_sem_dado": sorted(geo - cods),
        "juncao_ok": cods == geo,
    }
    nomes_dif = [
        {"cod": c, "snapshot": linhas[c]["nome_snapshot"], "geojson": rs_geo[c]}
        for c in sorted(cods & geo)
        if linhas[c]["nome_snapshot"] != rs_geo[c]
    ]
    v["nomes_diferentes_snapshot_vs_geojson"] = {
        "n": len(nomes_dif),
        "amostra": nomes_dif[:8],
    }

    # população: estimativa 2024 do snapshot x Censo 2022 (territorios.json)
    difs = []
    for c in sorted(cods):
        a, b = linhas[c]["populacao_snapshot"], terr_pop.get(c)
        if a is not None and b:
            difs.append((c, a, b, a - b, (a - b) / b))
    soma_a = sum(d[1] for d in difs)
    soma_b = sum(d[2] for d in difs)
    absp = sorted(abs(d[4]) for d in difs)
    maiores = sorted(difs, key=lambda d: -abs(d[4]))[:5]
    v["populacao_snapshot_vs_territorios"] = {
        "n_comparados": len(difs),
        "sem_pop_em_alguma_fonte": sorted(
            c
            for c in cods
            if linhas[c]["populacao_snapshot"] is None or not terr_pop.get(c)
        ),
        "soma_snapshot": soma_a,
        "soma_territorios_censo2022": soma_b,
        "dif_soma": soma_a - soma_b,
        "dif_soma_pct": round(100 * (soma_a - soma_b) / soma_b, 2) if soma_b else None,
        "mediana_abs_dif_pct": round(100 * absp[len(absp) // 2], 2) if absp else None,
        "n_iguais": sum(1 for d in difs if d[3] == 0),
        "n_dif_acima_10pct": sum(1 for d in difs if abs(d[4]) > 0.10),
        "maiores_diferencas": [
            {
                "cod": d[0],
                "nome": linhas[d[0]]["nome"],
                "snapshot": d[1],
                "censo2022": d[2],
                "dif_pct": round(100 * d[4], 1),
            }
            for d in maiores
        ],
        "nota": "Snapshot usa a população estimada 2024 do IBGE; territorios.json usa o Censo 2022. Diferença esperada, não erro.",
    }

    # dados ausentes por componente
    aus = {}
    for k in (
        "impacto",
        "deficit_prevencao",
        "exposicao",
        "perigo_sazonal",
        "manutencao_ativos",
    ):
        aus[k] = sum(1 for c in cods if linhas[c]["componentes"][k]["valor"] is None)
    v["municipios_sem_valor_por_componente"] = aus
    v["sem_nenhum_componente_de_sinal"] = sorted(
        c
        for c in cods
        if linhas[c]["componentes"]["impacto"]["valor"] is None
        and linhas[c]["componentes"]["deficit_prevencao"]["valor"] is None
    )

    # regra de cobertura (ADR-019)
    viol, sem_score_ok = [], 0
    for c in cods:
        ix = linhas[c]["indice"]
        comp = linhas[c]["componentes"]
        tem_sinal = (
            comp["impacto"]["valor"] is not None
            or comp["deficit_prevencao"]["valor"] is not None
        )
        deveria = ix["cobertura_peso"] >= MIN_COBERTURA_PESO and tem_sinal
        if deveria != (ix["score_atual"] is not None):
            viol.append(c)
        elif not deveria:
            sem_score_ok += 1
    v["regra_cobertura_minima"] = {
        "min_cobertura_peso": MIN_COBERTURA_PESO,
        "violacoes": sorted(viol),
        "n_sem_indice_corretamente": sem_score_ok,
        "min_cobertura_entre_com_indice": min(
            (
                linhas[c]["indice"]["cobertura_peso"]
                for c in cods
                if linhas[c]["indice"]["score_atual"] is not None
            ),
            default=None,
        ),
    }

    # selos
    selos: dict = {}
    maus = []
    for c in cods:
        for k, x in linhas[c]["componentes"].items():
            b = x["basis"]
            selos.setdefault(k, {}).setdefault(str(b), 0)
            selos[k][str(b)] += 1
            if x["valor"] is not None and b not in BASIS_VALIDOS:
                maus.append((c, k, b))
            if x["valor"] is None and b is not None:
                maus.append((c, k, "selo sem valor"))
    v["selos_por_componente"] = selos
    v["componente_com_valor_sem_selo_valido"] = maus[:10]

    # fórmula: score = round(100 * base * mult, 1) com renormalização sobre os presentes
    mult = _get(risk_atual, "cenario_spec", "multiplicador")
    maxd = 0.0
    nchk = 0
    for c in cods:
        ix = linhas[c]["indice"]
        if ix["score_atual"] is None or mult is None:
            continue
        comp = linhas[c]["componentes"]
        pres = {k: comp[k]["valor"] for k in PESOS if comp[k]["valor"] is not None}
        base = sum(PESOS[k] * x for k, x in pres.items()) / sum(PESOS[k] for k in pres)
        maxd = max(maxd, abs(round(100 * base * mult, 1) - ix["score_atual"]))
        nchk += 1
    v["reproducao_da_formula_atual"] = {
        "n": nchk,
        "max_dif_abs": round(maxd, 3),
        "multiplicador": mult,
    }

    # zeros suspeitos: componente igual a 0 exato com detalhe de ausência
    v["componentes_zero_exato"] = {
        k: sum(1 for c in cods if linhas[c]["componentes"][k]["valor"] == 0)
        for k in PESOS
    }
    return v


def montar(
    risk: dict[str, dict],
    dossies: dict[str, dict],
    geo_rs: dict[str, str],
    terr_pop: dict[str, int | None],
    capturado_em: str | None = None,
) -> dict:
    """Função pura: recebe o conteúdo do snapshot e devolve o JSON de saída."""
    por = {
        n: {str(m["cod_mun"]): m for m in risk[n]["municipios"]}
        for n in risk
        if risk[n]
    }
    atual = por["atual"]
    linhas = {}
    for cod in sorted(atual):
        linhas[cod] = linha(
            cod,
            geo_rs.get(cod),
            atual[cod],
            por.get("estrutural", {}).get(cod),
            por.get("ond2026", {}).get(cod),
            dossies.get(cod),
        )
    ra = risk["atual"]
    mc = ra.get("model_card", {})
    contagem = {
        k: ra.get(k) for k in ("n_total", "n_completo", "n_parcial", "n_insuficiente")
    }
    meta = {
        "gerado_em": datetime.now(UTC).isoformat(timespec="seconds"),
        "fonte": {
            "projeto": "climate (Central de Risco Climática RS), snapshot congelado da API estática",
            "snapshot_capturado_em": capturado_em
            or _get(ra, "_snapshot", "capturado_em"),
            "as_of": ra.get("as_of"),
            "as_of_fonte": ra.get("as_of_source"),
            "versao_modelo": mc.get("version"),
            "proveniencia_indireta": FONTES_PRIMARIAS,
        },
        "aviso": AVISO,
        "ressalvas": RESSALVAS + list(mc.get("limites") or []),
        "modelo": {
            "formula": mc.get("formula"),
            "pesos": mc.get("pesos"),
            "piso_sazonal": mc.get("piso_sazonal"),
            "cortes_nivel": mc.get("cortes"),
            "cobertura_minima_peso": MIN_COBERTURA_PESO,
            "regra": "peso coberto >= 0,60 e impacto OU déficit presente; senão score = null (completude 'insuficiente')",
            "componentes": mc.get("componentes"),
            "memoria_hidrica": mc.get("memoria_hidrica"),
        },
        "selos": {
            "impacto": "measured (declarado ao IBGE)",
            "deficit_prevencao": "measured (declarado ao IBGE)",
            "exposicao": "measured",
            "perigo_sazonal": "measured no cenário atual (ONI); modeled no OND 2026; null no estrutural; ESTADUAL e uniforme",
            "manutencao_ativos": "null sempre, sem selo",
            "indice_composto": "modeled",
            "memoria_hidrica_ghsl": "measured",
            "curve_number_e_erosao": "modeled",
        },
        "cenarios": {
            n: {
                "multiplicador": _get(risk.get(n), "cenario_spec", "multiplicador"),
                "saturado": _get(risk.get(n), "cenario_spec", "saturado"),
                "oni": (risk.get(n) or {}).get("oni"),
            }
            for n in CENARIOS
            if risk.get(n)
        },
        "contagem_snapshot": contagem,
        "validacao": validar(linhas, geo_rs, terr_pop, ra),
    }
    return {"meta": meta, "linhas": linhas}


def carregar(snapshot: Path = SNAPSHOT) -> tuple[dict, dict]:
    risk = {}
    for n in CENARIOS:
        p = snapshot / f"risk_municipal~cenario-{n}.json"
        risk[n] = _ler(p) if p.exists() else None
    if risk["atual"] is None:
        raise FileNotFoundError(f"{snapshot} sem risk_municipal~cenario-atual.json")
    dossies = {}
    for m in risk["atual"]["municipios"]:
        p = snapshot / f"dossie_{m['cod_mun']}~cenario-atual.json"
        if p.exists():
            dossies[str(m["cod_mun"])] = _ler(p)
    return risk, dossies


def geo_rs(geo: Path = GEO) -> dict[str, str]:
    fc = _ler(geo)
    return {
        f["properties"]["ibge"]: f["properties"]["nome"]
        for f in fc["features"]
        if f["properties"].get("uf") == "RS"
    }


def terr_pop(terr: Path = TERR) -> dict[str, int | None]:
    linhas = _ler(terr)["linhas"]
    return {
        c: (v or {}).get("pop_total") for c, v in linhas.items() if c.startswith("43")
    }


def build(
    snapshot: Path = SNAPSHOT, geo: Path = GEO, terr: Path = TERR, out: Path = OUT
) -> dict:
    risk, dossies = carregar(snapshot)
    r = montar(risk, dossies, geo_rs(geo), terr_pop(terr))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(r, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return r

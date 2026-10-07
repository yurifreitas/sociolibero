"""Custo da corrupção e benefícios a empresas, em R$, com fonte, ano, método e incerteza.

A curadoria (`corrupcao_curadoria.json`) é escrita à mão a partir de fontes abertas lidas na
pesquisa; cada número carrega `tipo` (contagem × estimativa) e `verificado` (true só se o
número foi lido na fonte; false se veio de resumo/imprensa). Este módulo NÃO baixa nada: valida a
curadoria, converte pp do PIB em R$ com a âncora do PIB nominal, calcula o cenário de
recuperação com `economy.simulate` e grava `web/public/data/custo_corrupcao.json`.

Regra de ouro: valores de natureza diferente (contagem de processos, estimativa macro, renúncia
fiscal, subsídio) NÃO são somáveis; o módulo nunca soma entre linhas.
"""

from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path

CURADORIA = Path(__file__).with_name("corrupcao_curadoria.json")
SAIDA = "web/public/data/custo_corrupcao.json"
TIPOS = {"contagem", "estimativa"}
DOI_RE = re.compile(r"^10\.\d{4,9}/\S+$")
MINIMOS = {"areas": 12, "beneficios_a_empresas": 12, "modelos": 10}
PERCENTUAIS_RECUPERACAO = (10, 25, 50)  # SUPOSIÇÃO rotulada, não estimativa

# Ligação editorial área -> decisões do catálogo (ids de decisoes.py).
AREA_DECISOES: dict[str, list[str]] = {
    "gastos-tributarios": [
        "cortar-beneficios-fiscais",
        "desoneracao-ampla",
        "acelerar-ibs-cbs",
    ],
    "sonegacao-economia-subterranea": ["acelerar-ibs-cbs", "cortar-beneficios-fiscais"],
    "petroleo-lava-jato": ["politica-precos-combustiveis", "privatizacoes"],
    "combustiveis-crime-organizado": ["politica-precos-combustiveis"],
    "crime-ambiental-ouro-madeira-terra": [
        "combate-garimpo-ilegal-e-rastreio-do-ouro",
        "homologar-terras-indigenas-e-titular-quilombos",
    ],
    "concessoes-renegociacoes": ["privatizacoes"],
    "emendas-orcamento-secreto": ["reforcar-arcabouco"],
    "tributos-subsidios-energia": ["politica-industrial-verde"],
}

NAO_SOMAR = (
    "Não some linhas deste arquivo. (1) Contagem (apurado em processo, auditoria ou balanço) e "
    "estimativa (modelo) medem coisas diferentes; (2) valores de períodos e bases diferentes "
    "(ano-calendário, acumulado de vários anos, estoque, fluxo) não se comparam; (3) gasto "
    "tributário é renúncia de receita prevista em lei, não desvio nem ilegalidade; (4) valor "
    "apurado em um caso não é a perda econômica total (há dano indireto) nem é valor recuperável; "
    "(5) estimativas macro (FIESP, FGV) já incluem, por construção, parte do que as áreas contam. "
    "Somar áreas, ou áreas com o panorama, dupla-conta."
)

AVISO = (
    "Levantamento de pesquisa aberta, não auditoria. Contagem não é estimativa e nenhuma das duas é "
    "prova de culpa de pessoa ou empresa: casos aparecem como 'apurado por X' com o status; "
    "nada aqui acusa nominalmente. Estimativas macro de corrupção (percepção, extrapolações) têm "
    "incerteza grande e fontes com interesse; parte do desvio não é recuperável. Nenhum número "
    "alimenta o modelo macro sem a suposição rotulada em `recuperacao_macro`."
)

CRITERIO = (
    "verificado=true: a página/PDF da fonte foi aberta nesta pesquisa e o número foi lido nela. "
    "verificado=false: o número veio de resumo de busca ou de imprensa secundária e precisa ser "
    "reconferido antes de citar. contagem = valor apurado em processo, auditoria, balanço ou "
    "relatório oficial; estimativa = modelo ou extrapolação."
)


def carregar() -> dict:
    return json.loads(CURADORIA.read_text(encoding="utf-8"))


def ancora_pib() -> dict:
    """PIB nominal oficial (IBGE) usado para converter pp do PIB em R$."""
    return carregar()["ancora_pib"]


def pp_para_rs_bi(pp: float, pib_rs_bi: float | None = None) -> float:
    """Converte pontos percentuais do PIB em R$ bilhões/ano (âncora: PIB nominal)."""
    pib = pib_rs_bi if pib_rs_bi is not None else ancora_pib()["valor_rs_bi"]
    return pp / 100.0 * pib


def valor_financeiro_decisao(deltas: dict[str, float]) -> dict | None:
    """R$ bi/ano equivalente ao `primary_target` da decisão (positivo = melhora do primário).

    Só existe se a decisão mexe no primário; é a conversão aritmética do delta (julgamento) em R$
    pelo PIB nominal da âncora, em preços do ano da âncora. Não é projeção nem orçamento.
    """
    if "primary_target" not in deltas:
        return None
    a = ancora_pib()
    pp = float(deltas["primary_target"])
    return {
        "rs_bi_ano": round(pp_para_rs_bi(pp, a["valor_rs_bi"]), 1),
        "primary_target_pp": pp,
        "formula": "primary_target (pp do PIB) / 100 × PIB nominal",
        "ancora_pib": {
            "ano": a["ano"],
            "valor_rs_bi": a["valor_rs_bi"],
            "fonte": a["fonte"],
        },
        "natureza": "estimativa",
        "nota": (
            "Conversão do delta de primário (julgamento do catálogo) pelo PIB nominal do ano da "
            "âncora; sinal positivo = melhora do resultado primário. Não é projeção, é a escala "
            "em R$ do que o delta representa."
        ),
    }


def beneficiarios_por_decisao(cur: dict | None = None) -> dict[str, list[dict]]:
    """decisao_id -> itens de benefícios a empresas ligados (id, tema, central, faixa)."""
    cur = cur or carregar()
    out: dict[str, list[dict]] = {}
    for b in cur["beneficios_a_empresas"]:
        if b.get("decisao_id"):
            out.setdefault(b["decisao_id"], []).append(
                {
                    "id": b["id"],
                    "tema": b["tema"],
                    "valor_rs_bi_ano": b["valor_rs_bi_ano"],
                    "verificado": b["verificado"],
                }
            )
    return out


def validar(cur: dict) -> list[str]:
    """Lista de problemas (vazia = ok). Checa estrutura, tipos, faixas, DOIs e ids."""
    from . import decisoes

    erros: list[str] = []
    ids_dec = {d.id for d in decisoes.CATALOGO}

    def faixa_ok(c, f, onde):
        if f is None:
            return
        if len(f) != 2 or not (f[0] <= f[1]):
            erros.append(f"{onde}: faixa inválida {f}")
        elif c is not None and not (f[0] - 1e-9 <= c <= f[1] + 1e-9):
            erros.append(f"{onde}: central {c} fora da faixa {f}")

    a = cur.get("ancora_pib", {})
    for k in ("ano", "valor_rs_bi", "fonte", "url"):
        if k not in a:
            erros.append(f"ancora_pib sem {k}")
    for k in MINIMOS:
        if len(cur.get(k, [])) < MINIMOS[k]:
            erros.append(f"{k}: {len(cur.get(k, []))} < mínimo {MINIMOS[k]}")
    vistos: set[str] = set()
    for ar in cur["areas"]:
        if ar["id"] in vistos:
            erros.append(f"área duplicada {ar['id']}")
        vistos.add(ar["id"])
        for v in ar["valores"]:
            onde = f"{ar['id']}/{v['descricao'][:40]}"
            if v["tipo"] not in TIPOS:
                erros.append(f"{onde}: tipo {v['tipo']}")
            if not isinstance(v["verificado"], bool):
                erros.append(f"{onde}: verificado não booleano")
            if v["verificado"] and not v.get("url"):
                erros.append(f"{onde}: verificado sem url")
            if v["valor_rs_bi"] is not None and v["valor_rs_bi"] < 0:
                erros.append(f"{onde}: valor negativo")
            faixa_ok(v["valor_rs_bi"], v.get("faixa_rs_bi"), onde)
            for k in ("periodo", "metodo", "fonte"):
                if not v.get(k):
                    erros.append(f"{onde}: sem {k}")
        for e in ar.get("evidencia_empirica", []):
            if e.get("doi") and not DOI_RE.match(e["doi"]):
                erros.append(f"{ar['id']}: DOI malformado {e['doi']}")
        for d in ar.get("decisoes_relacionadas", []):
            if d not in ids_dec:
                erros.append(f"{ar['id']}: decisão inexistente {d}")
    for b in cur["beneficios_a_empresas"]:
        onde = f"beneficio {b['id']}"
        if b.get("decisao_id") and b["decisao_id"] not in ids_dec:
            erros.append(f"{onde}: decisão inexistente {b['decisao_id']}")
        vb = b["valor_rs_bi_ano"]
        faixa_ok(vb.get("central"), vb.get("faixa"), onde)
        if b["verificado"] and not b.get("url"):
            erros.append(f"{onde}: verificado sem url")
    for m in cur["modelos"]:
        for r in m.get("referencias", []):
            if r.get("doi") and not DOI_RE.match(r["doi"]):
                erros.append(f"modelo {m['id']}: DOI malformado {r['doi']}")
    return erros


def recuperacao_macro(cur: dict, seed: int = 0) -> dict:
    """Cenário 'recuperar x% do desvio estimado' como aumento do primário.

    SUPOSIÇÃO: o desvio de referência é `desvio_referencia.pct_pib_central` (estimativa macro);
    x ∈ {10, 25, 50}% dele vira primário adicional permanente a partir de 2027 e passa pelo
    mesmo modelo macro dos demais cenários (`economy.simulate`, sem choques, pares com o
    BASELINE de decisoes). Parte do desvio não é recuperável (custo indireto, prescrição,
    insolvência, processos); x já é um julgamento sobre essa parte.
    """
    from . import decisoes

    ref = decisoes._run(decisoes.BASELINE)
    dr = cur["desvio_referencia"]
    pib = cur["ancora_pib"]["valor_rs_bi"]
    cen = []
    for x in PERCENTUAIS_RECUPERACAO:
        pp = dr["pct_pib_central"] * x / 100.0
        res = decisoes._run(decisoes._apply(decisoes.BASELINE, {"primary_target": pp}))
        cen.append(
            {
                "recuperado_pct": x,
                "primario_pp": round(pp, 3),
                "rs_bi_ano": round(pp_para_rs_bi(pp, pib), 1),
                "debt_2035_delta": round(res["debt"] - ref["debt"], 2),
                "selic_2035_delta": round(res["selic"] - ref["selic"], 2),
            }
        )
    return {
        "suposicao": (
            f"SUPOSIÇÃO rotulada (não estimativa): o desvio de referência é {dr['pct_pib_central']}% do "
            f"PIB/ano ({dr['descricao']}); recupera-se 10/25/50% dele como aumento permanente do "
            "resultado primário a partir de 2027. Parte do desvio não é recuperável (é dano "
            "indireto, custo de oportunidade, ou está em processos prescritos/insolventes) e a "
            "estimativa macro tem incerteza maior que a do modelo; leia os cenários como "
            "'quanto vale cada ponto percentual', não como previsão de arrecadação."
        ),
        "desvio_referencia": dr,
        "referencia_2035": {k: round(v, 2) for k, v in ref.items()},
        "cenarios": cen,
        "limites": (
            "Modelo macro reduzido (economy.py), sem choques, sem incerteza paramétrica; o efeito "
            "sobre Selic passa só pelo prêmio de dívida e pelo hiato. Não inclui ganho de "
            "produtividade pelo menor desperdício (canal que a literatura aponta, ver `modelos`)."
        ),
    }


def build(path: str | None = SAIDA) -> dict:
    cur = carregar()
    erros = validar(cur)
    if erros:
        raise ValueError("curadoria inválida:\n- " + "\n- ".join(erros))
    pib = cur["ancora_pib"]
    areas = []
    for ar in cur["areas"]:
        ar = dict(ar)
        ar.setdefault("evidencia_empirica", [])
        ar["decisoes_relacionadas"] = AREA_DECISOES.get(ar["id"], [])
        areas.append(ar)
    # valor financeiro por decisão (derivado) -- espelha o que decisoes.py grava
    from . import decisoes

    fin = {
        d.id: valor_financeiro_decisao(d.deltas)
        for d in decisoes.CATALOGO
        if valor_financeiro_decisao(d.deltas)
    }
    panorama = []
    for p in cur["panorama"]:
        p = dict(p)
        if p.get("faixa_pct_pib"):
            lo, hi = (pp_para_rs_bi(x, pib["valor_rs_bi"]) for x in p["faixa_pct_pib"])
            p["equivalente_rs_bi_ancora"] = {
                "faixa": [round(lo), round(hi)],
                "nota": f"% do PIB × PIB nominal {pib['ano']}; cálculo nosso, não da fonte.",
            }
        panorama.append(p)
    todos = [v for a in areas for v in a["valores"]]
    resumo = {
        "areas": len(areas),
        "valores": len(todos),
        "valores_verificados": sum(v["verificado"] for v in todos),
        "contagem": sum(v["tipo"] == "contagem" for v in todos),
        "estimativa": sum(v["tipo"] == "estimativa" for v in todos),
        "beneficios": len(cur["beneficios_a_empresas"]),
        "beneficios_verificados": sum(
            b["verificado"] for b in cur["beneficios_a_empresas"]
        ),
        "modelos": len(cur["modelos"]),
    }
    out = {
        "meta": {
            "gerado_em": date.today().isoformat(),
            "aviso": AVISO,
            "criterio_verificacao": CRITERIO,
            "ancora_pib": pib,
            "resumo": resumo,
            "lacunas": cur.get("lacunas", []),
            "divergencias": cur.get("divergencias", []),
        },
        "panorama": panorama,
        "areas": areas,
        "beneficios_a_empresas": cur["beneficios_a_empresas"],
        "modelos": cur["modelos"],
        "valor_financeiro_decisoes": fin,
        "recuperacao_macro": recuperacao_macro(cur),
        "nao_somar": NAO_SOMAR,
    }
    if path:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        Path(path).write_text(
            json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8"
        )
    return out

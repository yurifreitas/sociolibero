"""Catálogo de decisões econômicas/institucionais: viabilidade (quórum) × impacto (modelo macro).

Cada decisão tem instrumento legal, quórum, posição no espectro, custo político e efeito nas
alavancas do modelo. Os efeitos (`deltas`) são JULGAMENTOS ancorados em `racional`, não
estimativas da literatura — por isso `base_evidencia="julgamento"`. Substitua por estimativas
publicadas quando houver.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path

import numpy as np

from . import data, economy, institutions
from .economy import Levers
from .institutions import CHAMBER_BLOCS, QUORUM, chamber_seats

# Ponto de comparação: cenário "pragmático" (ver scenarios.py).
BASELINE = Levers(0.8, 0.15, 0.05, 0.4, 0.8)
IDX_2035 = 2035 - int(economy.YEARS[0])
UNIT = {"institutional_risk", "bc_erosion", "fiscal_credibility"}  # limitadas a [0, 1]


@dataclass(frozen=True)
class Decisao:
    id: str
    rotulo: str
    dominio: str  # fiscal | monetário | tributário | institucional | social | setorial | externo
    instrumento: str  # chave de QUORUM
    ideologia: float  # -1 esquerda … +1 direita (posição da proposta)
    controversia: float  # 0-1: custo político (julgamento)
    deltas: dict[str, float]  # variação nas alavancas se aprovada e implementada
    racional: str
    ganhadores: list[str] = field(default_factory=list)
    perdedores: list[str] = field(default_factory=list)
    defasagem_anos: int = 1
    reversibilidade: str = "média"  # alta | média | baixa
    iniciativa_congresso: bool = True  # Congresso pode iniciar sem o Executivo
    origem: str = ""  # ex.: 'pilares:V04 · potencias:agua-doce' (ligação a outros arquivos de dados)


def _d(*a, **k) -> Decisao:
    return Decisao(*a, **k)


CATALOGO: list[Decisao] = [
    # --- fiscal
    _d(
        "flexibilizar-arcabouco",
        "Flexibilizar o arcabouço fiscal (LC 200/2023)",
        "fiscal",
        "LC",
        -0.3,
        0.3,
        {
            "primary_target": -1.0,
            "fiscal_credibility": -0.25,
            "institutional_risk": 0.05,
        },
        "Menos superávit exigido e piso de gasto; o custo vem pelo prêmio de risco e pela credibilidade.",
        ["beneficiários de gasto público", "investimento público"],
        ["detentores de títulos", "geração futura"],
        1,
        "alta",
    ),
    _d(
        "reforcar-arcabouco",
        "Reforçar o arcabouço (gatilhos de despesa)",
        "fiscal",
        "PEC",
        0.5,
        0.35,
        {"primary_target": 1.2, "fiscal_credibility": 0.2, "supply_reform": 0.05},
        "Gatilhos automáticos e desindexação reduzem a dívida; efeito depende de execução.",
        ["detentores de títulos", "setor privado (juros menores)"],
        ["servidores", "beneficiários de gasto"],
        2,
        "média",
    ),
    _d(
        "reforma-administrativa",
        "Reforma administrativa (carreiras, estabilidade, mérito)",
        "fiscal",
        "PEC",
        0.6,
        0.55,
        {"primary_target": 0.4, "supply_reform": 0.1},
        "Economia gradual (novos entrantes) e ganho de eficiência; efeito fiscal lento.",
        ["contribuintes"],
        ["servidores"],
        5,
        "baixa",
    ),
    _d(
        "desvincular-minimo",
        "Desvincular salário mínimo e pisos da indexação",
        "fiscal",
        "PEC",
        0.7,
        0.8,
        {"primary_target": 0.8, "fiscal_credibility": 0.1},
        "Maior efeito fiscal por real; alto custo distributivo e político.",
        ["contribuintes", "detentores de títulos"],
        ["aposentados e beneficiários de piso"],
        2,
        "média",
    ),
    _d(
        "reforma-previdencia-2",
        "Nova reforma da Previdência (idade, regras)",
        "fiscal",
        "PEC",
        0.5,
        0.7,
        {"primary_target": 0.7, "fiscal_credibility": 0.1},
        "Contém gasto obrigatório; efeito cresce com a demografia.",
        ["contribuintes", "geração futura"],
        ["aposentáveis"],
        4,
        "baixa",
    ),
    _d(
        "cortar-beneficios-fiscais",
        "Cortar gastos tributários (benefícios fiscais)",
        "fiscal",
        "LO",
        0.1,
        0.45,
        {"primary_target": 0.6, "fiscal_credibility": 0.05},
        "Receita sem aumentar alíquota; resistência de setores beneficiados.",
        ["contribuintes gerais"],
        ["setores beneficiados"],
        1,
        "alta",
    ),
    _d(
        "desoneracao-ampla",
        "Desoneração ampla da folha e benefícios setoriais",
        "fiscal",
        "LO",
        0.4,
        0.3,
        {"primary_target": -0.5, "supply_reform": 0.05},
        "Reduz custo do emprego; perda de arrecadação supera ganho de curto prazo.",
        ["setores intensivos em mão de obra"],
        ["contribuintes gerais"],
        1,
        "alta",
    ),
    _d(
        "ampliar-assistencia",
        "Ampliar programas de transferência de renda",
        "social",
        "LO",
        -0.7,
        0.25,
        {"primary_target": -0.4, "fiscal_credibility": -0.05},
        "Mais gasto corrente com efeito de demanda local; pesa na trajetória da dívida.",
        ["famílias de baixa renda", "economias locais"],
        ["contribuintes"],
        1,
        "alta",
    ),
    _d(
        "perdao-dividas",
        "Renegociação/perdão amplo de dívidas (rural, famílias, estados)",
        "fiscal",
        "LC",
        -0.1,
        0.35,
        {"primary_target": -0.3, "fiscal_credibility": -0.1},
        "Alivia devedores com custo fiscal e risco de expectativa de repetição.",
        ["devedores"],
        ["contribuintes", "credores"],
        1,
        "baixa",
    ),
    _d(
        "credito-subsidiado",
        "Expandir crédito subsidiado (BNDES/bancos públicos)",
        "setorial",
        "EXECUTIVO",
        -0.4,
        0.2,
        {"primary_target": -0.2, "supply_reform": 0.05},
        "Custo quase-fiscal; efeito de produtividade depende da seleção.",
        ["setores beneficiados"],
        ["contribuintes"],
        1,
        "média",
        False,
    ),
    # --- monetário / institucional
    _d(
        "reduzir-autonomia-bc",
        "Reduzir a autonomia do Banco Central (LC 179/2021)",
        "monetário",
        "LC",
        0.0,
        0.7,
        {"bc_erosion": 0.4, "institutional_risk": 0.2, "fiscal_credibility": -0.2},
        "Expectativas de inflação desancoram e o prêmio sobe; efeito forte e assimétrico.",
        ["devedores no curto prazo"],
        ["poupadores", "toda a economia no médio prazo"],
        1,
        "média",
    ),
    _d(
        "diretoria-bc-alinhada",
        "Indicar diretoria do BC por alinhamento político",
        "monetário",
        "SENADO_ABS",
        0.0,
        0.5,
        {"bc_erosion": 0.15, "institutional_risk": 0.05},
        "Mandatos escalonados diluem o efeito; depende de sabatina e perfil técnico.",
        ["governo de turno"],
        ["credibilidade da meta"],
        3,
        "média",
        False,
    ),
    _d(
        "politica-precos-combustiveis",
        "Controlar preços de combustíveis pela Petrobras",
        "setorial",
        "EXECUTIVO",
        -0.5,
        0.2,
        {"institutional_risk": 0.1, "fiscal_credibility": -0.1},
        "Alivia inflação no curto prazo; custo patrimonial/estatal e risco de governança.",
        ["consumidores no curto prazo"],
        ["acionistas minoritários", "Tesouro"],
        1,
        "alta",
        False,
    ),
    # --- tributário / produtividade
    _d(
        "acelerar-ibs-cbs",
        "Acelerar a reforma tributária do consumo (IBS/CBS)",
        "tributário",
        "LC",
        0.1,
        0.2,
        {"supply_reform": 0.25, "fiscal_credibility": 0.05},
        "Menos distorção e cumulatividade elevam produtividade; ganho gradual.",
        ["setor produtivo", "exportadores"],
        ["setores com regimes especiais"],
        4,
        "baixa",
    ),
    _d(
        "privatizacoes",
        "Privatizações e concessões (estatais não financeiras)",
        "setorial",
        "LO",
        0.8,
        0.5,
        {"primary_target": 0.2, "supply_reform": 0.15},
        "Receita pontual e ganho de eficiência; efeito fiscal recorrente é pequeno.",
        ["consumidores (eficiência)", "investidores"],
        ["servidores das estatais"],
        3,
        "baixa",
    ),
    _d(
        "abertura-comercial",
        "Abertura comercial (redução de tarifas, acordos)",
        "externo",
        "EXECUTIVO",
        0.7,
        0.3,
        {"supply_reform": 0.3},
        "Competição e insumos baratos elevam produtividade; ajuste custoso a setores protegidos.",
        ["consumidores", "importadores"],
        ["indústria protegida"],
        3,
        "média",
        False,
    ),
    _d(
        "acordo-mercosul-ue",
        "Ratificar acordo Mercosul–União Europeia",
        "externo",
        "LO",
        0.2,
        0.3,
        {"supply_reform": 0.15},
        "Acesso a mercado com salvaguardas; efeito gradual.",
        ["agro", "exportadores"],
        ["setores sensíveis"],
        3,
        "média",
    ),
    # --- institucional (STF e outros)
    _d(
        "ampliar-stf",
        "Ampliar o número de ministros do STF",
        "institucional",
        "PEC",
        0.5,
        0.75,
        {"institutional_risk": 0.25},
        "Altera maioria sem vaga natural; sinal forte a investidores sobre segurança jurídica.",
        ["governo de turno"],
        ["segurança jurídica"],
        1,
        "baixa",
    ),
    _d(
        "remover-ministros-stf",
        "Remoção de ministros do STF (2/3 do Senado)",
        "institucional",
        "SENADO_2_3",
        0.8,
        0.9,
        {"institutional_risk": 0.3},
        "Quórum de 54 senadores torna o caminho improvável; seria ruptura de equilíbrio entre Poderes.",
        ["governo de turno"],
        ["independência judicial"],
        1,
        "baixa",
    ),
    _d(
        "anistia-politica",
        "Anistia política ampla e mudança em regras de inelegibilidade",
        "institucional",
        "LO",
        0.9,
        0.7,
        {"institutional_risk": 0.08},
        "Efeito econômico direto pequeno; opera por incerteza institucional e conflito com o Judiciário.",
        ["beneficiários da anistia"],
        ["previsibilidade institucional"],
        1,
        "baixa",
    ),
]

# --- Decisões ligadas às potências (potenciais_brasil.json) e aos pilares (pilares_pensamento.json).
# Efeitos pequenos e JULGADOS; deltas vazios = sem efeito macro estimável (o valor é qualitativo/local).
CATALOGO += [
    _d(
        "homologar-terras-indigenas-e-titular-quilombos",
        "Homologar terras indígenas e titular territórios quilombolas com meta anual",
        "social",
        "EXECUTIVO",
        -0.6,
        0.5,
        {"institutional_risk": -0.02, "primary_target": -0.05},
        "Segurança fundiária e contenção do desmatamento (reputação ambiental); custo orçamentário pequeno e conflito com ocupações.",
        ["povos indígenas e quilombolas", "clima e biodiversidade"],
        ["ocupações irregulares", "garimpo e grilagem"],
        3,
        "média",
        False,
        origem="pilares:V01,V02 · potencias:terras-indigenas-contencao",
    ),
    _d(
        "consulta-previa-regulamentada",
        "Regulamentar a consulta prévia (OIT 169) com procedimento claro e consentimento qualificado",
        "institucional",
        "LO",
        -0.5,
        0.55,
        {"institutional_risk": -0.02},
        "Reduz litígio e incerteza de licenciamento se bem desenhada; risco de atraso de projetos se vaga.",
        ["povos e comunidades tradicionais", "investidores (previsibilidade)"],
        ["projetos sem diálogo prévio"],
        2,
        "média",
        origem="pilares:V04",
    ),
    _d(
        "psa-governanca-comunitaria",
        "Pagamento por serviços ambientais com governança comunitária",
        "setorial",
        "LO",
        0.0,
        0.25,
        {"primary_target": -0.1, "supply_reform": 0.08},
        "Remunera quem conserva; efeito produtivo via bioeconomia e reputação, com custo fiscal recorrente.",
        ["comunidades e produtores que conservam"],
        ["quem lucra com desmatamento"],
        3,
        "alta",
        origem="pilares:V06 · potencias:floresta-carbono-restauracao",
    ),
    _d(
        "recuperar-pastagens-degradadas",
        "Programa de recuperação de pastagens degradadas (expansão sem novo desmatamento)",
        "setorial",
        "LO",
        0.2,
        0.2,
        {"supply_reform": 0.15, "primary_target": -0.15},
        "Mais produção por hectare reduz pressão sobre floresta; exige crédito e assistência técnica.",
        ["produtores rurais", "clima"],
        ["contribuintes (custo do crédito)"],
        4,
        "média",
        origem="potencias:pastagens-recuperaveis,agricultura-tropical-ptf",
    ),
    _d(
        "seguranca-hidrica-saneamento",
        "Segurança hídrica e saneamento (irrigação eficiente, reuso e gestão de bacias)",
        "setorial",
        "LO",
        0.0,
        0.2,
        {"supply_reform": 0.08, "primary_target": -0.2},
        "Reduz exposição a secas e custos de saúde; investimento de retorno lento.",
        ["população urbana e rural", "agro irrigado"],
        ["contribuintes no curto prazo"],
        5,
        "baixa",
        origem="potencias:agua-doce · clima:seca",
    ),
    _d(
        "estrategia-minerais-criticos",
        "Estratégia de minerais críticos com agregação de valor e governança contra captura",
        "setorial",
        "LO",
        0.3,
        0.4,
        {"supply_reform": 0.15, "institutional_risk": 0.03, "primary_target": 0.05},
        "Capturar mais da cadeia (refino, baterias) em vez de exportar minério; risco de captura por poucos e impacto socioambiental.",
        ["indústria de transição", "regiões mineradoras"],
        ["comunidades afetadas se mal regulada"],
        6,
        "baixa",
        origem="potencias:niobio-concentracao-global,minerais-transicao-reservas",
    ),
    _d(
        "educacao-tecnica-e-alfabetizacao",
        "Expandir ensino médio técnico e alfabetização na idade certa",
        "social",
        "LO",
        -0.2,
        0.2,
        {"supply_reform": 0.12, "primary_target": -0.3},
        "Capital humano é o maior gap de produtividade; retorno chega em uma década ou mais.",
        ["jovens de baixa renda", "setor produtivo"],
        ["contribuintes no curto prazo"],
        8,
        "baixa",
        origem="potencias:capital-humano-gap,janela-demografica",
    ),
    _d(
        "politica-industrial-verde",
        "Política industrial verde (hidrogênio, baterias, bioindústria)",
        "setorial",
        "LO",
        -0.3,
        0.35,
        {"supply_reform": 0.15, "primary_target": -0.3, "institutional_risk": 0.02},
        "Aposta em vantagem energética; risco de escolher vencedores e de subsídio permanente.",
        ["regiões com potencial renovável", "novas cadeias"],
        ["contribuintes", "setores não escolhidos"],
        6,
        "média",
        origem="potencias:eolica-offshore-hidrogenio-verde,matriz-eletrica-renovavel",
    ),
    _d(
        "combate-garimpo-ilegal-e-rastreio-do-ouro",
        "Rastreabilidade do ouro e combate ao garimpo ilegal em terras indígenas",
        "institucional",
        "EXECUTIVO",
        -0.3,
        0.3,
        {"institutional_risk": -0.03, "primary_target": -0.05},
        "Menos crime ambiental e lavagem; custo de fiscalização; depende de rastreio efetivo.",
        ["povos indígenas", "mercado formal de ouro"],
        ["garimpo ilegal e compradores"],
        2,
        "média",
        False,
        origem="pilares:V07 · potencias:terras-indigenas-contencao",
    ),
    _d(
        "direitos-da-natureza-municipais",
        "Direitos da natureza em leis orgânicas municipais",
        "institucional",
        "LO",
        -0.3,
        0.3,
        {},
        "Sem efeito macro estimável: o valor é local e jurídico; não há evidência medida de efeito nos casos brasileiros conhecidos.",
        ["ecossistemas locais", "comunidades"],
        [],
        2,
        "alta",
        origem="pilares:V05",
    ),
    _d(
        "orcamento-participativo-e-moedas-sociais",
        "Orçamento participativo e economia solidária (moedas sociais, compras públicas)",
        "social",
        "LO",
        -0.4,
        0.2,
        {},
        "Sem efeito macro estimável; evidência de efeito local em indicadores sociais, com forte dependência de desenho e continuidade.",
        ["comunidades organizadas"],
        [],
        2,
        "alta",
        origem="pilares:V08,V09",
    ),
    _d(
        "indicadores-complementares-ao-pib",
        "Painel oficial de indicadores complementares ao PIB (bem viver, contas ambientais)",
        "institucional",
        "EXECUTIVO",
        -0.2,
        0.1,
        {},
        "Sem efeito macro direto; muda o que é medido e discutido. Risco de virar vitrine sem uso orçamentário.",
        ["debate público"],
        [],
        2,
        "alta",
        False,
        origem="pilares:V11",
    ),
    _d(
        "comissario-das-geracoes-futuras",
        "Comissário/Defensoria das gerações futuras (avaliação intergeracional de leis e orçamento)",
        "institucional",
        "LC",
        -0.1,
        0.35,
        {"fiscal_credibility": 0.03},
        "Pode melhorar a disciplina de longo prazo se tiver poder real; risco de órgão sem efeito.",
        ["gerações futuras"],
        [],
        3,
        "média",
        origem="pilares:V12",
    ),
]


def _apply(base: Levers, deltas: dict[str, float]) -> Levers:
    d = dict(base.__dict__)
    for k, v in deltas.items():
        d[k] = float(np.clip(d[k] + v, 0.0, 1.0)) if k in UNIT else d[k] + v
    return Levers(**d)


def _run(lv: Levers) -> dict[str, float]:
    r = economy.simulate(
        data.load_macro_base(), lv, np.random.default_rng(0), 1, shocks=False
    )
    return {k: float(v[0, IDX_2035]) for k, v in r.items()}


def p_approval(d: Decisao, president: str, rng: np.random.Generator) -> float:
    """P(aprovação) = P(iniciativa) × P(Câmara) × P(Senado), independentes (suposição).
    `president` ∈ {"direita","esquerda"}: alinhado à proposta → agenda do Executivo ajuda."""
    aligned = (d.ideologia >= 0) == (president == "direita")
    if d.instrumento == "EXECUTIVO":
        return 1.0 if aligned else 0.0
    init = 0.9 if aligned else (0.3 if d.iniciativa_congresso else 0.0)
    ctrl = d.controversia * (0.85 if aligned else 1.15)
    qc, qs = QUORUM[d.instrumento]
    pc = institutions.pass_prob(
        chamber_seats(), CHAMBER_BLOCS, qc, d.ideologia, ctrl, rng
    )
    ps = institutions.pass_prob(
        institutions.senate_seats(), institutions.BLOCS, qs, d.ideologia, ctrl, rng
    )
    return init * pc * ps


def _limite_modelo(d: Decisao) -> str | None:
    """O modelo aplica custo e benefício desde o 1º ano; ignora `defasagem_anos`."""
    if d.defasagem_anos >= 3 and d.deltas.get("supply_reform", 0) > 0:
        return (
            f"Benefício só começa após ~{d.defasagem_anos} anos, mas o modelo aplica o efeito desde o 1º ano "
            "(custo e ganho simultâneos). Em horizontes curtos o impacto em 2035 tende a subestimar o benefício."
        )
    if not d.deltas:
        return "Sem efeito macro estimável: o valor é qualitativo ou local."
    return None


def run(seed: int = 11) -> dict:
    from . import corrupcao  # import tardio: corrupcao também importa decisoes

    rng = np.random.default_rng(seed)
    ref = _run(BASELINE)
    benef = corrupcao.beneficiarios_por_decisao()
    out = []
    for d in CATALOGO:
        res = _run(_apply(BASELINE, d.deltas))
        out.append(
            {
                **asdict(d),
                "base_evidencia": "julgamento",
                "p_aprovacao": {
                    p: round(p_approval(d, p, rng), 3) for p in ("direita", "esquerda")
                },
                "impacto_2035": {k: round(res[k] - ref[k], 2) for k in ref},
                "limite_modelo": _limite_modelo(d),
                # R$ bi/ano do delta de primário (PIB nominal da âncora) e itens de benefício a
                # empresas ligados a esta decisão (custo_corrupcao.json); None/[] se não houver.
                "valor_financeiro": corrupcao.valor_financeiro_decisao(d.deltas),
                "beneficiarios_empresas": benef.get(d.id, []),
            }
        )
    return {
        "meta": {
            "baseline": "pragmatico",
            "referencia_2035": {k: round(v, 2) for k, v in ref.items()},
            "composicao": {
                "camara": chamber_seats(),
                "senado": institutions.senate_seats(),
            },
            "quoruns": {k: {"camara": v[0], "senado": v[1]} for k, v in QUORUM.items()},
            "aviso": "Efeitos são julgamentos editáveis; P(aprovação) usa modelo de bancadas simplificado.",
        },
        "decisoes": out,
    }


def export(path: str = "web/public/data/decisoes.json") -> dict:
    r = run()
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(r, ensure_ascii=False, indent=1), encoding="utf-8")
    return r

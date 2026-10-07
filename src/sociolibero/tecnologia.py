"""Futuro tecnológico: curvas de adoção/custo AJUSTADAS a dados reais + integração ao macro.

Saída: `web/public/data/futuros.json` (ver docs/METHODS.md, seção "Futuro tecnológico").

O que é DADO (baixado, com `data/raw/<nome>/PROVENIENCIA.json`: URL, data, SHA-256):
Pix (BCB Olinda), internet e celular (IBGE/PNAD Contínua TIC via SIDRA), geração distribuída
(ANEEL), solar instalada no Brasil, vendas de carros elétricos (IEA), custo de módulo solar e
capacidade global (OWID/Lafond et al./IRENA) e computação de treino (Epoch AI via OWID).

O que é SUPOSIÇÃO e fica rotulada: tetos físicos usados só como limite superior de busca do
parâmetro K (ex.: população), o ganho de produtividade `tech_productivity` do macro e a faixa
de sensibilidade. Projeção NÃO é previsão: é a extrapolação de uma forma funcional com
incerteza de parâmetro (bootstrap de resíduos), sem incerteza estrutural.

Estimação: mínimos quadrados não lineares (`scipy.optimize.least_squares`) no espaço do log
(resíduo multiplicativo), vários pontos de partida. Incerteza: bootstrap de resíduos (refit
em cada réplica). Validação: treina até T-k e prevê os k seguintes; compara com baseline
ingênuo (último valor) e linear (OLS nos pontos de treino).
"""

from __future__ import annotations

import csv
import io
import json
import math
from dataclasses import dataclass, field, replace
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
from scipy.optimize import least_squares

from . import economy
from .territorios import RAW, baixar_pasta

OUT = Path("web/public/data/futuros.json")
HORIZONTE = list(range(2026, 2039))
ANO_REF_MACRO = 2035
B_BOOT = 300

# --------------------------------------------------------------------------------------------
# Formas funcionais
# --------------------------------------------------------------------------------------------


def logistica(t, K, r, t0):
    """Curva S: K / (1 + exp(-r (t - t0)))."""
    return K / (1.0 + np.exp(-r * (np.asarray(t, float) - t0)))


def bass_cum(t, m, p, q, ts):
    """Bass (1969), adotantes acumulados: m * F(t - ts), F = (1-e^{-(p+q)u}) / (1+(q/p)e^{-(p+q)u})."""
    u = np.maximum(np.asarray(t, float) - ts, 0.0)
    e = np.exp(-(p + q) * u)
    return m * (1.0 - e) / (1.0 + (q / p) * e)


def wright(x, a, b):
    """Lei de Wright: custo = a * x^-b (x = produção/capacidade acumulada)."""
    return a * np.asarray(x, float) ** (-b)


def exponencial(t, a, g, tref):
    """Moore/exponencial: a * exp(g (t - tref)). g<0 para custo (Moore), g>0 para capacidade."""
    return a * np.exp(g * (np.asarray(t, float) - tref))


def taxa_aprendizado(b: float) -> float:
    """Redução de custo a cada dobra da produção: 1 - 2^-b."""
    return 1.0 - 2.0 ** (-b)


@dataclass(frozen=True)
class Forma:
    nome: str  # logistica | bass | wright | exponencial
    nomes: tuple[str, ...]
    f: object  # f(t, *params)
    espaco_x: str = "t"  # "t" (tempo) ou "logx" (Wright)


def _multi_starts_logistica(t, y, lo, hi):
    ymax = float(np.max(y))
    out = []
    for kf in (1.05, 1.5, 3.0, 10.0):
        K = min(max(ymax * kf, lo[0]), hi[0])
        for r in (0.2, 0.6, 1.5):
            for t0 in (t.min(), np.median(t), t.max(), t.max() + 5):
                out.append([K, r, float(np.clip(t0, lo[2], hi[2]))])
    return out


def _fit_ls(res, starts, lo, hi):
    best = None
    for p0 in starts:
        try:
            s = least_squares(
                res, np.clip(p0, lo, hi), bounds=(lo, hi), x_scale="jac", max_nfev=2000
            )
        except Exception:
            continue
        if best is None or s.cost < best.cost:
            best = s
    return best


def ajustar(forma: str, t, y, K_max=None, ts=None, tref=None, inicio=None):
    """Ajusta `forma` a (t, y) por LS não linear no log. Devolve (params dict, ŷ) ou None.

    `K_max` é o limite superior de busca do teto (suposição declarada por curva);
    `ts` é o ano de lançamento (fixo) no Bass; `tref` é o centro de tempo da exponencial.
    """
    t, y = np.asarray(t, float), np.asarray(y, float)
    ok = np.isfinite(t) & np.isfinite(y) & (y > 0)
    t, y = t[ok], y[ok]
    ly = np.log(y)
    if len(t) < 3:
        return None
    ymax = float(y.max())
    if forma == "logistica":
        hi_K = K_max if K_max is not None else 1e3 * ymax
        lo = [ymax, 1e-3, t.min() - 40.0]
        hi = [max(hi_K, ymax * 1.0001), 8.0, t.max() + 60.0]

        def res(p):
            return np.log(np.maximum(logistica(t, *p), 1e-300)) - ly

        starts = [inicio] if inicio else _multi_starts_logistica(t, y, lo, hi)
        s = _fit_ls(res, starts, lo, hi)
        if s is None:
            return None
        K, r, t0 = s.x
        return {"K": float(K), "r": float(r), "t0": float(t0)}, logistica(t, *s.x)
    if forma == "bass":
        ts = float(ts)
        hi_K = K_max if K_max is not None else 1e3 * ymax
        lo = [ymax, 1e-5, 1e-3]
        hi = [max(hi_K, ymax * 1.0001), 1.0, 10.0]

        def res(p):
            return np.log(np.maximum(bass_cum(t, p[0], p[1], p[2], ts), 1e-300)) - ly

        starts = [
            [min(max(ymax * kf, lo[0]), hi[0]), p, q]
            for kf in (1.05, 1.5, 3.0)
            for p in (0.005, 0.03, 0.1)
            for q in (0.3, 1.0, 3.0)
        ]
        s = _fit_ls(res, [inicio] if inicio else starts, lo, hi)
        if s is None:
            return None
        m, p, q = s.x
        return {"m": float(m), "p": float(p), "q": float(q), "ts": ts}, bass_cum(
            t, m, p, q, ts
        )
    if forma == "exponencial":
        tr = float(t.mean() if tref is None else tref)
        g, la = np.polyfit(t - tr, ly, 1)
        return {"a": float(math.exp(la)), "g": float(g), "tref": tr}, exponencial(
            t, math.exp(la), g, tr
        )
    if forma == "wright":  # t aqui é o x acumulado
        b, la = np.polyfit(np.log(t), ly, 1)
        return {"a": float(math.exp(la)), "b": float(-b)}, wright(t, math.exp(la), -b)
    raise ValueError(forma)


def prever(forma: str, params: dict, t):
    if forma == "logistica":
        return logistica(t, params["K"], params["r"], params["t0"])
    if forma == "bass":
        return bass_cum(t, params["m"], params["p"], params["q"], params["ts"])
    if forma == "exponencial":
        return exponencial(t, params["a"], params["g"], params["tref"])
    if forma == "wright":
        return wright(t, params["a"], params["b"])
    raise ValueError(forma)


def bootstrap(forma, t, y, fut, B=B_BOOT, seed=11, **kw):
    """Bootstrap de resíduos (log, multiplicativos): devolve (params, projeções) por réplica.

    `fut` são os instantes de projeção. Resíduos são reamostrados com reposição; ignora
    autocorrelação (séries curtas e suavizadas ⇒ a banda tende a SUBESTIMAR a incerteza).
    """
    t, y = np.asarray(t, float), np.asarray(y, float)
    base = ajustar(forma, t, y, **kw)
    if base is None:
        return [], np.empty((0, len(fut)))
    p0, yh = base
    hint = (
        [p0[k] for k in ("K", "r", "t0")]
        if forma == "logistica"
        else [p0[k] for k in ("m", "p", "q")]
        if forma == "bass"
        else None
    )
    e = np.log(y[y > 0]) - np.log(yh)
    rng = np.random.default_rng(seed)
    ps, proj = [], []
    tt = t[y > 0]
    for _ in range(B):
        ystar = yh * np.exp(rng.choice(e, size=len(e), replace=True) - e.mean())
        r = ajustar(forma, tt, ystar, inicio=hint, **kw)
        if r is None:
            continue
        ps.append(r[0])
        proj.append(prever(forma, r[0], fut))
    return ps, np.array(proj)


# --------------------------------------------------------------------------------------------
# Validação fora da amostra
# --------------------------------------------------------------------------------------------


def _metricas(obs, pred):
    obs, pred = np.asarray(obs, float), np.asarray(pred, float)
    return {
        "rmse": float(np.sqrt(np.mean((obs - pred) ** 2))),
        "mape_pct": float(100 * np.mean(np.abs(obs - pred) / np.abs(obs))),
    }


def validar(forma, t, y, k, x_futuro=None, **kw):
    """Treina até T-k e prevê os k seguintes. Compara com baseline ingênuo e linear.

    Para Wright, `t` é o x acumulado e a previsão é CONDICIONAL ao x observado no teste.
    Em todos os casos o modelo vê só os pontos de treino.
    """
    t, y = np.asarray(t, float), np.asarray(y, float)
    if len(t) - k < 4:
        return None
    ttr, ytr, tte, yte = t[:-k], y[:-k], t[-k:], y[-k:]
    if forma == "wright":
        kw = {}
    fit = ajustar(forma, ttr, ytr, **kw)
    if fit is None:
        return None
    pred = prever(forma, fit[0], tte)
    ing = np.full(k, ytr[-1])
    xs = np.log(ttr) if forma == "wright" else ttr
    xt = np.log(tte) if forma == "wright" else tte
    if forma == "wright":
        sl, ic = np.polyfit(xs, np.log(ytr), 1)
        lin = np.exp(ic + sl * xt)  # baseline linear no mesmo espaço (log-log)
    else:
        sl, ic = np.polyfit(xs, ytr, 1)
        lin = ic + sl * xt
    m = _metricas(yte, pred)
    bi, bl = _metricas(yte, ing), _metricas(yte, lin)
    return {
        "k": int(k),
        "modelo": m,
        "ingenuo": bi,
        "linear": bl,
        "ganha_do_melhor_baseline": bool(m["rmse"] < min(bi["rmse"], bl["rmse"])),
        "previsto": [float(v) for v in pred],
        "observado": [float(v) for v in yte],
    }


# --------------------------------------------------------------------------------------------
# Dados (download com proveniência)
# --------------------------------------------------------------------------------------------
OLINDA = "https://olinda.bcb.gov.br/olinda/servico/Pix_DadosAbertos/versao/v1/odata"
OWID = "https://ourworldindata.org/grapher/{g}.csv?csvType=full"
SIDRA = "https://apisidra.ibge.gov.br/values/t/{t}/{q}"
ANEEL_GD = (
    "https://dadosabertos.aneel.gov.br/dataset/5e0fafd2-21b9-4d5b-b622-40438d40aba2/resource/"
    "cd29f6eb-e08d-4db7-b6fb-ed6e3b682d27/download/empreendimento-geracao-distribuida.parquet"
)


def _meses(ini=(2020, 11), fim=(2026, 9)):
    a, m = ini
    while (a, m) <= fim:
        yield a, m
        a, m = (a + 1, 1) if m == 12 else (a, m + 1)


def _url_pix(a, m):
    ym = f"{a}{m:02d}"
    return (
        f"{OLINDA}/EstatisticasTransacoesPix(Database=@d)?@d='{ym}'&$format=json"
        f"&$select=AnoMes,QUANTIDADE,VALOR&$filter=AnoMes%20eq%20{ym}&$top=1000000"
    )


FONTES: dict[str, list[tuple[str, str]]] = {
    "bcb_pix_transacoes": [(f"{a}{m:02d}.json", _url_pix(a, m)) for a, m in _meses()],
    "bcb_pix_usuarios_dict": [
        (
            "usuarios.json",
            f"{OLINDA}/PixUsuariosCadastradosDICT?$format=json&$top=5000",
        )
    ],
    "ibge_sidra_7307_internet": [
        (
            "brasil.json",
            SIDRA.format(t=7307, q="n1/all/v/9784/p/all/c1/6795/c688/all"),
        )
    ],
    "ibge_sidra_6863_celular": [
        (
            "brasil.json",
            SIDRA.format(t=6863, q="n1/all/v/5039/p/all/c1/6795/c2/6794"),
        )
    ],
    "aneel_gd_empreendimentos": [("gd.parquet", ANEEL_GD)],
    "owid_solar_capacidade": [
        ("solar.csv", OWID.format(g="installed-solar-pv-capacity"))
    ],
    "owid_solar_custo_capacidade": [
        ("solar_custo.csv", OWID.format(g="solar-pv-prices-vs-cumulative-capacity"))
    ],
    "owid_carros_eletricos": [("carros.csv", OWID.format(g="electric-car-sales"))],
    "owid_epoch_computacao_treino": [
        ("treino.csv", OWID.format(g="artificial-intelligence-training-computation"))
    ],
}


def baixar_tudo() -> dict[str, dict]:
    return {n: baixar_pasta(n, itens) for n, itens in FONTES.items()}


def _fonte(nome: str, arquivo: str | None = None) -> dict:
    meta = json.loads((RAW / nome / "PROVENIENCIA.json").read_text(encoding="utf-8"))
    arqs = meta["arquivos"]
    url = (
        arqs[0]["url"]
        if len(arqs) == 1
        else f"{arqs[0]['url']} (+{len(arqs) - 1} arquivos mensais; ver PROVENIENCIA.json)"
    )
    return {
        "nome": nome,
        "url": url,
        "baixado_em": meta["baixado_em"],
        "sha256": meta["sha256"],
    }


def _fonte_ou_nulo(nome: str) -> dict:
    try:
        return _fonte(nome)
    except FileNotFoundError:
        return {"nome": nome, "url": None, "baixado_em": None, "sha256": None}


def _csv(nome, arq):
    txt = (RAW / nome / arq).read_text(encoding="utf-8")
    return list(csv.DictReader(io.StringIO(txt)))


def serie_pix_transacoes() -> list[tuple[float, float]]:
    """Transações Pix por mês (milhões), t = ano + (mês-0,5)/12. Meses vazios/parciais ficam fora."""
    pts = []
    for a, m in _meses():
        p = RAW / "bcb_pix_transacoes" / f"{a}{m:02d}.json"
        if not p.exists():
            continue
        v = json.loads(p.read_text(encoding="utf-8")).get("value", [])
        if v:
            pts.append((a + (m - 0.5) / 12, sum(x["QUANTIDADE"] for x in v) / 1e6))
    # mês corrente sem fechamento aparece com volume muito abaixo do anterior
    if len(pts) > 2 and pts[-1][1] < 0.7 * pts[-2][1]:
        pts.pop()
    return pts


def serie_pix_usuarios() -> list[tuple[float, float]]:
    """Usuários (PF+PJ) cadastrados no DICT, milhões, no fim de cada mês."""
    j = json.loads((RAW / "bcb_pix_usuarios_dict" / "usuarios.json").read_text("utf-8"))
    out = []
    for r in j["value"]:
        d = r["DataGraficosPix"]
        a, m = int(d[:4]), int(d[5:7])
        out.append((a + m / 12, r["qtdUsuariosCadastradosDICTTotal"] / 1e6))
    return sorted(out)


def _sidra_anual(nome, filtro) -> list[tuple[float, float]]:
    j = json.loads((RAW / nome / "brasil.json").read_text("utf-8"))[1:]
    return sorted((float(r["D3N"]), float(r["V"])) for r in j if filtro(r))


def serie_internet() -> list[tuple[float, float]]:
    return _sidra_anual(
        "ibge_sidra_7307_internet", lambda r: r["D5N"] == "Havia utilização de internet"
    )


def serie_celular() -> list[tuple[float, float]]:
    return _sidra_anual(
        "ibge_sidra_6863_celular", lambda r: r["V"] not in ("-", "..", "...")
    )


def serie_gd_solar() -> list[tuple[float, float]]:
    """Potência FV de geração distribuída (UFV, MMGD) acumulada no fim de cada ano, GW (ANEEL).

    Usa `DthAtualizaCadastralEmpreend` (única data do arquivo; o nome diz atualização cadastral, mas
    a soma acumulada bate com os ~50 GW de GD solar conhecidos, ver `limites`). Anos < 2000 (46
    registros com data 1900) e o ano corrente (parcial) ficam fora.
    """
    import duckdb

    ano_corrente = datetime.now(UTC).year
    p = (RAW / "aneel_gd_empreendimentos" / "gd.parquet").as_posix()
    rows = (
        duckdb.connect()
        .execute(
            "select year(DthAtualizaCadastralEmpreend) a, sum(MdaPotenciaInstaladaKW) kw "
            f"from '{p}' where SigTipoGeracao = 'UFV' and year(DthAtualizaCadastralEmpreend) between 2000 and ? "
            "group by 1 order by 1",
            [ano_corrente - 1],
        )
        .fetchall()
    )
    acc, out = 0.0, []
    for a, kw in rows:
        acc += kw or 0.0
        out.append((float(a), acc / 1e6))
    return out


def serie_solar_brasil() -> list[tuple[float, float]]:
    return sorted(
        (float(r["Year"]), float(r["Solar"]))
        for r in _csv("owid_solar_capacidade", "solar.csv")
        if r["Code"] == "BRA"
    )


def serie_carros_eletricos() -> list[tuple[float, float]]:
    return sorted(
        (float(r["Year"]), float(r["Electric cars sold"]))
        for r in _csv("owid_carros_eletricos", "carros.csv")
        if r["Code"] == "BRA"
    )


def serie_solar_custo() -> list[tuple[float, float, float]]:
    """(ano, custo US$/W do módulo, capacidade global acumulada GW)."""
    out = []
    for r in _csv("owid_solar_custo_capacidade", "solar_custo.csv"):
        if (
            r["Code"] == "OWID_WRL"
            and r["Solar PV module cost"]
            and r["Cumulative installed solar PV capacity"]
        ):
            out.append(
                (
                    float(r["Year"]),
                    float(r["Solar PV module cost"]),
                    float(r["Cumulative installed solar PV capacity"]),
                )
            )
    return sorted(out)


def serie_computacao_treino() -> list[tuple[float, float]]:
    """Fronteira anual: maior computação de treino (FLOP) entre modelos notáveis (Epoch AI)."""
    por_ano: dict[int, float] = {}
    for r in _csv("owid_epoch_computacao_treino", "treino.csv"):
        v = r["Training computation (petaFLOP)"]
        if not v or not r["Day"]:
            continue
        a = int(r["Day"][:4])
        por_ano[a] = max(por_ano.get(a, 0.0), float(v) * 1e15)
    ano_corrente = datetime.now(UTC).year
    return sorted((float(a), v) for a, v in por_ano.items() if 2012 <= a < ano_corrente)


# --------------------------------------------------------------------------------------------
# Catálogo de curvas
# --------------------------------------------------------------------------------------------


@dataclass
class Spec:
    id: str
    rotulo: str
    dominio: str
    modelo: str
    fonte: str
    serie: object  # callable -> pontos
    unidade: str
    k: int  # horizonte de validação (pontos)
    kw: dict = field(default_factory=dict)  # K_max, ts
    inicio: float | None = None  # só ajusta a partir daqui
    mensal: bool = False
    limites: str = ""
    teto_justificativa: str = ""
    deriva_difusao: bool = True  # entra na derivação da velocidade lento/base/rápido
    horizonte_fim: int = 2038


def catalogo() -> list[Spec]:
    return [
        Spec(
            "pix_usuarios",
            "Pix: usuários cadastrados no DICT (PF+PJ)",
            "pagamentos",
            "logistica",
            "bcb_pix_usuarios_dict",
            serie_pix_usuarios,
            "milhões",
            12,
            {"K_max": 300.0},
            inicio=2021.5,
            mensal=True,
            teto_justificativa="K ≤ 300 mi (SUPOSIÇÃO: ~213 mi de habitantes + empresas; só limite de busca)",
            limites="Cadastro no DICT não é uso efetivo: quem tem conta e nunca usou Pix pode estar fora ou "
            "dentro, e chaves de PJ entram. Ajuste só a partir de jun/2021: os primeiros meses são a "
            "campanha de pré-cadastro do lançamento (out/2020), não difusão orgânica.",
        ),
        Spec(
            "pix_usuarios_bass",
            "Pix: usuários cadastrados no DICT (forma de Bass)",
            "pagamentos",
            "bass",
            "bcb_pix_usuarios_dict",
            serie_pix_usuarios,
            "milhões",
            12,
            {"K_max": 300.0, "ts": 2020.76},
            inicio=2021.5,
            mensal=True,
            deriva_difusao=False,
            teto_justificativa="m ≤ 300 mi (SUPOSIÇÃO; limite de busca)",
            limites="Mesma série da curva logística, forma de Bass (ts = 2020,76, abertura do cadastro de "
            "chaves). O ajuste empurra o coeficiente de imitação q ao limite inferior (curva de pura "
            "inovação, sem efeito de rede) e erra mais que a logística no treino: a forma de Bass não "
            "descreve bem esta série e não entra na derivação da velocidade de difusão.",
        ),
        Spec(
            "pix_transacoes",
            "Pix: transações por mês",
            "pagamentos",
            "logistica",
            "bcb_pix_transacoes",
            serie_pix_transacoes,
            "milhões/mês",
            12,
            {"K_max": 60000.0},
            inicio=2021.5,
            mensal=True,
            teto_justificativa="K ≤ 60 bi/mês (SUPOSIÇÃO ~ 280 transações/hab/mês; limite de busca)",
            limites="Ajuste a partir de jun/2021 (rampa de lançamento tem crescimento de centenas de % ao mês e "
            "domina o erro no log). Série mensal tem sazonalidade (dezembro) e efeito de dias úteis que a logística "
            "ignora; os resíduos autocorrelacionados fazem a banda do bootstrap ser estreita demais.",
        ),
        Spec(
            "internet_domicilios",
            "Domicílios com utilização de internet (%)",
            "conectividade",
            "logistica",
            "ibge_sidra_7307_internet",
            serie_internet,
            "% dos domicílios",
            3,
            {"K_max": 100.0},
            teto_justificativa="K ≤ 100% (definição)",
            limites="9 pontos (2016-2025, sem 2020) e já perto do teto: a curva S só vê a cauda, o teto K "
            "é pouco identificado e sub-100% é plausível (domicílios sem interesse/acesso).",
        ),
        Spec(
            "celular_pessoas",
            "Pessoas de 10+ anos com celular para uso pessoal (%)",
            "conectividade",
            "logistica",
            "ibge_sidra_6863_celular",
            serie_celular,
            "% das pessoas 10+",
            3,
            {"K_max": 100.0},
            teto_justificativa="K ≤ 100% (definição)",
            limites="Poucos pontos anuais já saturando; o teto é praticamente fixado pelo limite superior.",
        ),
        Spec(
            "solar_gd_brasil",
            "Solar fotovoltaica distribuída (MMGD): potência acumulada",
            "energia",
            "logistica",
            "aneel_gd_empreendimentos",
            serie_gd_solar,
            "GW acumulados",
            3,
            {"K_max": 300.0},
            inicio=2017.0,
            teto_justificativa="K ≤ 300 GW (SUPOSIÇÃO; ~1,4× a capacidade elétrica total do país; limite de busca)",
            limites="Potência acumulada por ano da data cadastral do arquivo de empreendimentos da ANEEL (o nome do "
            "campo é 'atualização cadastral', não 'conexão'; a soma até hoje, ~50 GW de UFV, é coerente com "
            "o parque de GD solar conhecido, mas a data pode adiantar/atrasar a conexão real). "
            "Crescimento foi puxado por regulação (Lei 14.300/2022) e subsídio, não só por custo: "
            "mudança de regra quebra a forma logística. Teto muito incerto.",
        ),
        Spec(
            "solar_total_brasil",
            "Solar fotovoltaica instalada no Brasil (GD + centralizada)",
            "energia",
            "logistica",
            "owid_solar_capacidade",
            serie_solar_brasil,
            "GW acumulados",
            3,
            {"K_max": 300.0},
            inicio=2017.0,
            teto_justificativa="K ≤ 300 GW (SUPOSIÇÃO; limite de busca)",
            limites="Fonte secundária (OWID, compilando IRENA/Ember). O recorte 'só centralizada' não foi "
            "publicado como série aberta confirmada: seria o total menos a GD, com bases de datas "
            "distintas, e não foi calculado.",
        ),
        Spec(
            "carros_eletricos_brasil",
            "Carros elétricos (BEV+PHEV) vendidos no Brasil por ano",
            "mobilidade",
            "logistica",
            "owid_carros_eletricos",
            serie_carros_eletricos,
            "unidades/ano",
            3,
            {"K_max": 4_000_000.0},
            inicio=2018.0,
            teto_justificativa="K ≤ 4 mi/ano (SUPOSIÇÃO ~ mercado total de leves; limite de busca)",
            limites="IEA via OWID, não ABVE/Fenabrave (emplacamentos não achados em fonte aberta "
            "baixável). Cresceu com isenção/queda de tarifa de importação que mudou de regra; "
            "o teto (participação do mercado) é essencialmente não identificado.",
        ),
        Spec(
            "computacao_treino_fronteira",
            "Computação de treino de IA na fronteira (global, FLOP)",
            "computacao",
            "exponencial",
            "owid_epoch_computacao_treino",
            serie_computacao_treino,
            "FLOP",
            3,
            inicio=2016.0,
            horizonte_fim=2030,
            limites="Projeção só até 2030. Série GLOBAL de referência (Epoch AI, só modelos notáveis publicados); não é do Brasil. "
            "Exponencial não satura: extrapolar além de poucos anos é aritmética, não previsão "
            "(energia, chips e capital limitam).",
        ),
        Spec(
            "solar_custo_wright",
            "Custo do módulo solar vs capacidade acumulada (Wright)",
            "energia",
            "wright",
            "owid_solar_custo_capacidade",
            None,
            "US$/W",
            5,
            limites="Série GLOBAL (Nemet/Farmer-Lafond/IRENA via OWID), não do Brasil. Projeção CONDICIONAL "
            "ao crescimento da capacidade global, extrapolado por exponencial (suposição).",
        ),
        Spec(
            "solar_custo_moore",
            "Custo do módulo solar vs tempo (exponencial/Moore)",
            "energia",
            "exponencial",
            "owid_solar_custo_capacidade",
            None,
            "US$/W",
            5,
            limites="Mesmo dado da curva de Wright, forma temporal. Comparar os erros de teste das duas.",
        ),
    ]


# --------------------------------------------------------------------------------------------
# Ajuste de uma curva (dados -> JSON)
# --------------------------------------------------------------------------------------------
def _r(x, n=4):
    return None if x is None or not np.isfinite(x) else round(float(x), n)


def _quantis(v):
    a = np.asarray(v, float)
    return {
        "p10": _r(np.percentile(a, 10), 6),
        "p50": _r(np.percentile(a, 50), 6),
        "p90": _r(np.percentile(a, 90), 6),
    }


def duracao_10_90(modelo: str, p: dict) -> float | None:
    """Anos para ir de 10% a 90% do teto (logística: 2 ln9 / r; Bass: numérico)."""
    if modelo == "logistica":
        return 2 * math.log(9) / p["r"]
    if modelo == "bass":

        def u(x):
            return -math.log((1 - x) / (1 + (p["q"] / p["p"]) * x)) / (p["p"] + p["q"])

        return u(0.9) - u(0.1)
    return None


def _janela(spec: Spec, pts):
    a = np.array(pts, float)
    if spec.inicio is not None:
        a = a[a[:, 0] >= spec.inicio]
    return a


def _cenarios(spec, ps, proj, anos, custo=False):
    """lento/base/rapido = réplicas do bootstrap com valor em 2035 nos quantis 10/50/90 (parâmetros
    coerentes, não quantis parâmetro a parâmetro). Para custo, 'rápido' = custo menor."""
    ano_ref = min(ANO_REF_MACRO, anos[-1])
    j = anos.index(ano_ref)
    col = proj[:, j]
    qs = {"lento": 10, "base": 50, "rapido": 90}
    if custo:
        qs = {"lento": 90, "base": 50, "rapido": 10}
    out = {}
    for nome, q in qs.items():
        i = int(np.argmin(np.abs(col - np.percentile(col, q))))
        p = ps[i]
        d = {
            "ano_referencia": ano_ref,
            "quantil_valor_ano_ref": q,
            "parametros": {k: _r(v, 6) for k, v in p.items()},
            "valor_ano_ref": _r(proj[i, j], 6),
        }
        dur = duracao_10_90(spec.modelo, p)
        if dur is not None:
            d["duracao_10_90_anos"] = _r(dur, 2)
        out[nome] = d
    return out


def _erros(val, ts, k, extra=None):
    if not val:
        return None, None
    erro = {
        "k": k,
        **val["modelo"],
        "treino_ate": _r(float(ts[:-k][-1]), 3),
        "periodo_teste": [_r(float(ts[-k]), 3), _r(float(ts[-1]), 3)],
        "previsto": [_r(v, 4) for v in val["previsto"]],
        "observado": [_r(v, 4) for v in val["observado"]],
        **(extra or {}),
    }
    base = {
        "ingenuo": val["ingenuo"],
        "linear": val["linear"],
        "ganha_do_melhor_baseline": val["ganha_do_melhor_baseline"],
    }
    return erro, base


def _proj_json(anos, central, proj):
    return {
        "anos": anos,
        "central": [_r(v, 6) for v in central],
        "p10": [_r(v, 6) for v in np.percentile(proj, 10, axis=0)],
        "p90": [_r(v, 6) for v in np.percentile(proj, 90, axis=0)],
    }


def curva(spec: Spec) -> dict:
    base = {
        "id": spec.id,
        "rotulo": spec.rotulo,
        "dominio": spec.dominio,
        "modelo": spec.modelo,
        "unidade": spec.unidade,
        "usada_na_difusao": bool(
            spec.deriva_difusao and spec.modelo in ("logistica", "bass")
        ),
        "fonte_dados": _fonte_ou_nulo(spec.fonte),
        "convencao_tempo": (
            "série mensal: t = ano + (mês-0,5)/12 (fluxo) ou fim do mês (estoque); projeção em meio de ano"
            if spec.mensal
            else "série anual: t = ano; projeção no ano"
        ),
        "limites": spec.limites
        + (
            " Teto de busca: " + spec.teto_justificativa + "."
            if spec.teto_justificativa
            else ""
        ),
    }
    try:
        if spec.id.startswith("solar_custo"):
            return {**base, **_curva_custo(spec)}
        return {**base, **_curva_serie(spec)}
    except Exception as e:  # nunca derruba o build: vira lacuna explícita
        return {**base, "erro": f"{type(e).__name__}: {e}", "pontos_observados": []}


def _curva_serie(spec: Spec) -> dict:
    a = _janela(spec, spec.serie())
    t, y = a[:, 0], a[:, 1]
    kw = dict(spec.kw)
    anos = [y for y in HORIZONTE if y <= spec.horizonte_fim]
    tf = np.array([x + (0.5 if spec.mensal else 0.0) for x in anos], float)
    fit = ajustar(spec.modelo, t, y, **kw)
    if fit is None:
        raise RuntimeError("ajuste não convergiu")
    pars, yh = fit
    ps, proj = bootstrap(spec.modelo, t, y, tf, **kw)
    kname = {"logistica": "K", "bass": "m"}.get(spec.modelo)
    inc = {n: _quantis([p[n] for p in ps]) for n in pars if n not in ("ts", "tref")}
    ident = {}
    if kname:
        Kmax = kw.get("K_max")
        Ks = np.array([p[kname] for p in ps])
        ident = {
            "teto_obs_max": _r(float(np.max(y)), 4),
            "teto_ajustado": _r(pars[kname], 4),
            "teto_p10_p90": [
                _r(np.percentile(Ks, 10), 4),
                _r(np.percentile(Ks, 90), 4),
            ],
            "razao_teto_p90_sobre_p10": _r(
                np.percentile(Ks, 90) / np.percentile(Ks, 10), 2
            ),
            "replicas_no_limite_superior_pct": _r(
                100 * float(np.mean(Ks >= 0.999 * Kmax)) if Kmax else 0.0, 1
            ),
            "replicas_com_teto_igual_ao_maximo_observado_pct": _r(
                100 * float(np.mean(Ks <= 1.001 * float(np.max(y)))), 1
            ),
            "central_dentro_de_p10_p90": bool(
                np.percentile(Ks, 10) <= pars[kname] <= np.percentile(Ks, 90)
            ),
            "ajuste_na_fronteira": bool(
                pars[kname] <= 1.001 * float(np.max(y))
                or (Kmax is not None and pars[kname] >= 0.999 * Kmax)
            ),
            "frac_do_teto_ja_atingida": _r(float(y[-1] / pars[kname]), 3),
        }
    val = validar(spec.modelo, t, y, spec.k, **kw)
    erro, base_err = _erros(val, t, spec.k)
    return {
        "parametros": {k: _r(v, 6) for k, v in pars.items()},
        "identificacao_teto": ident,
        "ajuste": {
            "metodo": "mínimos quadrados não lineares no log (scipy least_squares, multi-start); "
            f"incerteza: bootstrap de resíduos (B={len(ps)})",
            "periodo_treino": [_r(float(t[0]), 3), _r(float(t[-1]), 3)],
            "n_pontos": len(t),
            "rmse_log_in_sample": _r(
                float(np.sqrt(np.mean((np.log(y) - np.log(yh)) ** 2))), 4
            ),
            "incerteza_parametros": inc,
            "erro_teste": erro,
            "baseline_erro_teste": base_err,
        },
        "pontos_observados": [[_r(x, 3), _r(v, 6)] for x, v in zip(t, y)],
        "projecao": _proj_json(anos, prever(spec.modelo, pars, tf), proj),
        "cenarios": _cenarios(spec, ps, proj, anos),
    }


def _curva_custo(spec: Spec) -> dict:
    a = np.array(serie_solar_custo(), float)  # ano, custo, capacidade acumulada
    a = a[a[:, 0] >= 1990.0]
    ano, c, x = a[:, 0], a[:, 1], a[:, 2]
    anos = HORIZONTE
    tf = np.array(anos, float)
    ax, yx = ano[-10:], x[-10:]
    if spec.modelo == "wright":
        pars, yh = ajustar("wright", x, c)
        psw, _ = bootstrap("wright", x, c, [1.0])
        psx, _ = bootstrap("exponencial", ax, yx, tf)
        m = min(len(psw), len(psx))
        proj = np.array(
            [
                wright(
                    exponencial(tf, psx[i]["a"], psx[i]["g"], psx[i]["tref"]),
                    psw[i]["a"],
                    psw[i]["b"],
                )
                for i in range(m)
            ]
        )
        ps = [
            {**psw[i], "cresc_capacidade_pct_ano": 100 * (math.exp(psx[i]["g"]) - 1)}
            for i in range(m)
        ]
        fx = ajustar("exponencial", ax, yx)[0]
        central = wright(
            exponencial(tf, fx["a"], fx["g"], fx["tref"]), pars["a"], pars["b"]
        )
        val = validar("wright", x, c, spec.k)
        pars_out = {
            **pars,
            "taxa_aprendizado_por_dobra_pct": 100 * taxa_aprendizado(pars["b"]),
            "cresc_capacidade_global_pct_ano": 100 * (math.exp(fx["g"]) - 1),
        }
        inc = {
            "b": _quantis([p["b"] for p in ps]),
            "taxa_aprendizado_por_dobra_pct": _quantis(
                [100 * taxa_aprendizado(p["b"]) for p in ps]
            ),
            "cresc_capacidade_pct_ano": _quantis(
                [p["cresc_capacidade_pct_ano"] for p in ps]
            ),
        }
        metodo = (
            "Wright por LS no log-log; capacidade global extrapolada por exponencial (últimos 10 anos); "
            f"bootstrap independente de resíduos dos dois ajustes (B={m})"
        )
        extra = {"condicional_ao_x_observado": True}
    else:
        pars, yh = ajustar("exponencial", ano, c)
        ps, proj = bootstrap("exponencial", ano, c, tf)
        central = prever("exponencial", pars, tf)
        val = validar("exponencial", ano, c, spec.k)
        pars_out = {**pars, "queda_pct_ano": 100 * (1 - math.exp(pars["g"]))}
        inc = {n: _quantis([p[n] for p in ps]) for n in ("a", "g")}
        metodo = f"exponencial por LS no log; bootstrap de resíduos (B={len(ps)})"
        extra = None
    erro, base_err = _erros(val, ano, spec.k, extra)
    return {
        "parametros": {k: _r(v, 6) for k, v in pars_out.items()},
        "ajuste": {
            "metodo": metodo,
            "periodo_treino": [_r(float(ano[0]), 0), _r(float(ano[-1]), 0)],
            "n_pontos": len(ano),
            "rmse_log_in_sample": _r(
                float(np.sqrt(np.mean((np.log(c) - np.log(yh)) ** 2))), 4
            ),
            "incerteza_parametros": inc,
            "erro_teste": erro,
            "baseline_erro_teste": base_err,
        },
        "pontos_observados": [
            [_r(float(u), 0), _r(float(v), 6)] for u, v in zip(ano, c)
        ],
        "projecao": _proj_json(anos, central, proj),
        "cenarios": _cenarios(spec, ps, proj, anos, custo=True),
    }


# --------------------------------------------------------------------------------------------
# Integração ao modelo macro
# --------------------------------------------------------------------------------------------
# SUPOSIÇÃO (julgamento, NÃO estimativa deste repositório): ganho de PIB potencial, em pp/ano,
# quando a difusão satura. Valor central e faixa abaixo; a sensibilidade varre a faixa inteira.
PRODUTIVIDADE_CENTRAL = 0.3
PRODUTIVIDADE_GRADE = [0.0, 0.05, 0.1, 0.2, 0.3, 0.5, 1.0]
DEFASAGEM_ANOS = 1.0
SUPOSICAO_TXT = (
    "SUPOSIÇÃO EXPLÍCITA (julgamento, não estimativa): a difusão tecnológica eleva o crescimento potencial em "
    f"{PRODUTIVIDADE_CENTRAL} pp/ano quando satura (faixa varrida: 0,05 a 1,0 pp/ano; 0 = desligado), com "
    f"defasagem de {DEFASAGEM_ANOS:g} ano e curva logística normalizada a zero em 2026. A velocidade da difusão "
    "(lento/base/rapido) vem das curvas ajustadas aos dados do Brasil (duração 10%→90% do teto); o TAMANHO "
    "do ganho não vem de nenhum ajuste. Âncoras de literatura (citadas de memória, não reconferidas nesta "
    "execução; conferir antes de usar): Acemoglu (2024, NBER w32487) estima ganho de PTF de IA ≤ ~0,7% em 10 "
    "anos (~0,07 pp/ano) nos EUA; McKinsey (2023) estima 0,1-0,6 pp/ano de produtividade do trabalho por IA "
    "generativa até 2040; Goldman Sachs (2023) projeta ~1,5 pp/ano nos EUA em 10 anos (extremo otimista). "
    "Nenhuma é estimativa para o Brasil, e a faixa entre elas é de uma ordem de grandeza: o resultado do macro "
    "é proporcional a essa suposição. O modelo não inclui deslocamento de emprego, custo de transição, efeito "
    "fiscal direto (receita, gasto) nem distribuição do ganho."
)


def cenarios_difusao(curvas: list[dict]) -> dict:
    """Velocidade de difusão derivada dos ajustes: duração 10%→90% (central) das curvas de adoção
    brasileiras de ajuste logístico/Bass. lento = 3º quartil das durações (mais lenta), base = mediana, rápido = 1º quartil."""
    durs = {}
    for c in curvas:
        if (
            c.get("modelo") in ("logistica", "bass")
            and c.get("parametros")
            and c.get("usada_na_difusao", True)
        ):
            d = duracao_10_90(c["modelo"], c["parametros"])
            if d and np.isfinite(d) and 0.3 < d < 60:
                durs[c["id"]] = d
    if len(durs) < 2:
        durs = {"suposicao_lento": 12.0, "suposicao_base": 8.0, "suposicao_rapido": 4.0}
    v = np.array(list(durs.values()))
    alvo = {
        "lento": float(np.percentile(v, 75)),
        "base": float(np.median(v)),
        "rapido": float(np.percentile(v, 25)),
    }
    out = {}
    for nome, dur in alvo.items():
        out[nome] = {
            "duracao_10_90_anos": round(dur, 2),
            "tech_rate": round(2 * math.log(9) / dur, 4),
            "tech_midpoint": round(float(economy.YEARS[0]) - 1 + dur / 2, 2),
            "tech_lag": DEFASAGEM_ANOS,
        }
    return {
        "duracoes_por_curva": {k: round(float(d), 2) for k, d in durs.items()},
        "cenarios": out,
    }


def _rodar_macro(lv, n=2000, seed=7):
    """Mesmas sementes para todos os cenários: as diferenças são pareadas (mesmos choques)."""
    from . import data

    base = (
        data.load_macro_base() if False else data.FALLBACK
    )  # offline e determinístico
    rng = np.random.default_rng(seed)
    params = economy.DEFAULT.with_(neutral_real=rng.uniform(3.5, 5.5, n))
    return economy.simulate(base, lv, rng, n, params)


def _resumo(tr, ref, ano):
    j = ano - int(economy.YEARS[0])
    out = {}
    for var in ("debt", "selic", "ipca", "gdp"):
        v = tr[var][:, j]
        d = v - ref[var][:, j]
        out[var] = {
            "mediana": round(float(np.median(v)), 2),
            "p10": round(float(np.percentile(v, 10)), 2),
            "p90": round(float(np.percentile(v, 90)), 2),
            "delta_vs_pragmatico": round(float(np.median(d)), 3),
            "delta_p10_p90": [
                round(float(np.percentile(d, 10)), 3),
                round(float(np.percentile(d, 90)), 3),
            ],
        }
    nivel = np.prod(1 + tr["gdp"][:, : j + 1] / 100, axis=1) / np.prod(
        1 + ref["gdp"][:, : j + 1] / 100, axis=1
    )
    out["pib_nivel_vs_pragmatico_pct"] = round(float(100 * (np.median(nivel) - 1)), 2)
    return out


def integracao_macro(curvas: list[dict], n: int = 2000) -> dict:
    from .scenarios import SCENARIOS

    prag = next(s for s in SCENARIOS if s.key == "pragmatico").levers
    ref = _rodar_macro(prag, n)
    dif = cenarios_difusao(curvas)

    def lv(nome, prod, **kw):
        c = dif["cenarios"][nome]
        return replace(
            prag,
            tech_productivity=prod,
            tech_midpoint=kw.get("tech_midpoint", c["tech_midpoint"]),
            tech_rate=c["tech_rate"],
            tech_lag=kw.get("tech_lag", c["tech_lag"]),
        )

    res = {}
    for nome in ("lento", "base", "rapido"):
        tr = _rodar_macro(lv(nome, PRODUTIVIDADE_CENTRAL), n)
        res[nome] = {
            "difusao": dif["cenarios"][nome],
            "tech_productivity_pp_ano": PRODUTIVIDADE_CENTRAL,
            "2035": _resumo(tr, ref, 2035),
            "2036": _resumo(tr, ref, 2036),
            "2037": _resumo(tr, ref, 2037),
            "2038": _resumo(tr, ref, 2038),
        }
    sens = []
    for prod in PRODUTIVIDADE_GRADE[1:]:
        for nome in ("lento", "base", "rapido"):
            r = _resumo(_rodar_macro(lv(nome, prod), n), ref, 2035)
            sens.append(
                {
                    "parametro": "tech_productivity",
                    "valor": prod,
                    "difusao": nome,
                    "delta_divida_pib_2035_pp": r["debt"]["delta_vs_pragmatico"],
                    "delta_selic_2035_pp": r["selic"]["delta_vs_pragmatico"],
                    "delta_ipca_2035_pp": r["ipca"]["delta_vs_pragmatico"],
                    "delta_pib_2035_pp": r["gdp"]["delta_vs_pragmatico"],
                    "pib_nivel_vs_pragmatico_pct": r["pib_nivel_vs_pragmatico_pct"],
                }
            )
    for tag, kw in (("tech_lag", [0.0, 3.0]), ("tech_midpoint", None)):
        if kw is None:
            c = dif["cenarios"]["base"]
            kw = [c["tech_midpoint"] - 2, c["tech_midpoint"] + 2]
        for val in kw:
            r = _resumo(
                _rodar_macro(lv("base", PRODUTIVIDADE_CENTRAL, **{tag: val}), n),
                ref,
                2035,
            )
            sens.append(
                {
                    "parametro": tag,
                    "valor": round(float(val), 2),
                    "difusao": "base",
                    "delta_divida_pib_2035_pp": r["debt"]["delta_vs_pragmatico"],
                    "delta_selic_2035_pp": r["selic"]["delta_vs_pragmatico"],
                    "delta_ipca_2035_pp": r["ipca"]["delta_vs_pragmatico"],
                    "delta_pib_2035_pp": r["gdp"]["delta_vs_pragmatico"],
                    "pib_nivel_vs_pragmatico_pct": r["pib_nivel_vs_pragmatico_pct"],
                }
            )
    return {
        "suposicao_produtividade": SUPOSICAO_TXT,
        "cenario_referencia": "pragmatico (scenarios.py), tech_productivity=0, sementes e choques idênticos; "
        "base macro offline (data.FALLBACK) para reprodutibilidade",
        "difusao_derivada_das_curvas": dif,
        "referencia_pragmatico": {
            str(a): {
                v: round(float(np.median(ref[v][:, a - int(economy.YEARS[0])])), 2)
                for v in ("debt", "selic", "ipca", "gdp")
            }
            for a in (2035, 2038)
        },
        "resultados_2035": res,
        "sensibilidade": sens,
        "leitura": "Deltas são medianas das diferenças pareadas por trajetória (mesmos choques). O efeito é "
        "proporcional à suposição de produtividade e NÃO é previsão; a incerteza de PARÂMETRO das curvas de "
        "adoção só entra pela velocidade (lento/base/rapido), nunca pelo tamanho do ganho.",
    }


# --------------------------------------------------------------------------------------------
# Build
# --------------------------------------------------------------------------------------------
LACUNAS = [
    "Emplacamentos de veículos elétricos e híbridos (ABVE/Fenabrave): sem série aberta baixável "
    "confirmada nesta execução; usadas vendas de carros elétricos BEV+PHEV da IEA via OWID (anual, sem "
    "híbridos leves).",
    "Cetic.br TIC Domicílios: não baixado (tabelas em portal sem API aberta verificada); usadas as "
    "séries IBGE/PNAD Contínua TIC via SIDRA (tabelas 7307 e 6863). 2020 não existe na PNAD TIC.",
    "Solar centralizada separada da distribuída: não há série aberta publicada que a separe; "
    "'solar_total_brasil' (OWID/IRENA) inclui GD e 'solar_gd_brasil' (ANEEL) é só a GD. Não derivei a diferença.",
    "ABSOLAR e EPE (capacidade solar por ano): não usadas; ANEEL (GD) e OWID/IRENA (total) as substituem.",
    "Custo da computação por FLOP (Moore para hardware): série aberta não confirmada; a curva de computação "
    "usa FLOP de TREINO na fronteira (Epoch AI via OWID), que mede escala de investimento, não custo.",
    "Pix: série de transações por pessoa/usuários ativos (uso efetivo) não existe aberta; usuários = cadastro DICT.",
    "Geração distribuída (ANEEL): o ano corrente (2026, parcial) fica fora; a série cobre até 2025.",
    "ABSOLAR, EPE e IRENA não foram consultadas diretamente; nenhuma conferência cruzada da GD com outra fonte "
    "além da ordem de grandeza (~50 GW de UFV).",
    "Todas as curvas globais (custo solar, computação) são referência, não dados do Brasil.",
]
AVISO = (
    "Projeções são extrapolações de formas funcionais ajustadas a poucos pontos, com incerteza apenas de "
    "parâmetro (bootstrap de resíduos). NÃO são previsões. O teto (K) de curvas S é pouco identificado quando a "
    "série ainda não saturou; ver identificacao_teto. O ganho de produtividade do macro é suposição explícita."
)


def build(n_macro: int = 2000, out: Path = OUT) -> dict:
    curvas = [curva(s) for s in catalogo()]
    macro = integracao_macro(curvas, n_macro)
    r = {
        "meta": {
            "gerado_em": datetime.now(UTC).isoformat(timespec="seconds"),
            "aviso": AVISO,
            "lacunas": LACUNAS
            + [
                f"Curva {c['id']} não ajustada: {c['erro']}"
                for c in curvas
                if c.get("erro")
            ],
            "horizonte": [HORIZONTE[0], HORIZONTE[-1]],
            "bootstrap_replicas": B_BOOT,
        },
        "curvas": curvas,
        "integracao_macro": macro,
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(r, ensure_ascii=False, indent=1), encoding="utf-8")
    return r

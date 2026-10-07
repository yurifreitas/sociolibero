"""Evoluções possíveis por cadeias de Markov: regimes políticos, regimes econômicos e cadeia de cenários.

Saída: `web/public/data/evolucoes.json` (ver docs/EVOLUCOES_MARKOV.md e docs/METHODS.md, "Evoluções (Markov)").

**Markov não é previsão.** É a extrapolação de frequências históricas de transição sob um pressuposto
(estados discretos, probabilidade de saída que depende só do estado atual) que este módulo testa e, em parte,
REFUTA (dependência de duração). Choques externos e eventos raros que não aparecem nas transições passadas não
estão no modelo. A matriz de cenários (parte 3) é JULGAMENTO rotulado, ancorado em taxas empíricas, não estimativa.

O que é DADO (baixado com `data/raw/<nome>/PROVENIENCIA.json`): regime político por país-ano (V-Dem, Regimes of the
World, via Our World in Data, CC BY 4.0) e continentes (OWID); séries econômicas vêm de `series_historicas.json`.
Estimação: contagens + prior de Dirichlet com encolhimento hierárquico (Brasil -> América Latina -> mundo; a força
do encolhimento é escolhida por verossimilhança marginal Dirichlet-multinomial leave-one-country-out); incerteza por
amostragem do posterior. Validação: leave-country-out, leave-region-out e cortes temporais, contra persistência e
climatologia, mais controles sintéticos de verdade conhecida (RIGOR_DE_VALIDACAO.md).
"""

from __future__ import annotations

import json
import math
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import optimize, special, stats

from . import data as _data
from . import economy, scenarios
from .territorios import RAW, baixar_pasta

OUT = Path("web/public/data/evolucoes.json")
SERIES = Path("web/public/data/series_historicas.json")
HISTORIA = Path("web/public/data/historia.json")

URL_REGIME = "https://ourworldindata.org/grapher/political-regime.csv"
URL_REGIME_META = "https://api.ourworldindata.org/v1/indicators/1210053.metadata.json"
URL_CONT = (
    "https://ourworldindata.org/grapher/continents-according-to-our-world-in-data.csv"
)
ESTADOS = [
    "autocracia fechada",
    "autocracia eleitoral",
    "democracia eleitoral",
    "democracia liberal",
]
K = 4
ANO_MIN_EST = 1900  # estimação: antes disso muitas séries são imputadas do ente histórico anterior
ANO_FIM = 2025
ANO_BRASIL = 1822  # independência
LATAM = [
    "ARG",
    "BOL",
    "BRA",
    "CHL",
    "COL",
    "CRI",
    "CUB",
    "DOM",
    "ECU",
    "SLV",
    "GTM",
    "HND",
    "HTI",
    "MEX",
    "NIC",
    "PAN",
    "PRY",
    "PER",
    "URY",
    "VEN",
]
HORIZ = (1, 5, 10)
SEED = 20261006
UA = {"User-Agent": "sociolibero/0.1 (pesquisa; dados abertos)"}


# --------------------------------------------------------------------------------------------
# Dados (proveniência)
# --------------------------------------------------------------------------------------------


def baixar() -> dict[str, dict]:
    """Baixa regime político (CSV + metadados com a licença) e continentes. Sem login/contorno."""
    return {
        "owid_political_regime": baixar_pasta(
            "owid_political_regime",
            [
                ("political-regime.csv", URL_REGIME),
                ("political-regime.metadata.json", URL_REGIME_META),
            ],
            headers=UA,
        ),
        "owid_continentes": baixar_pasta(
            "owid_continentes", [("continentes.csv", URL_CONT)], headers=UA
        ),
    }


def carregar_painel(
    raw: Path | None = None,
) -> tuple[np.ndarray, list[str], np.ndarray, dict[str, str]]:
    """Painel (países x anos) de estados 0..3 (-1 = ausente), códigos, anos, continente por código."""
    raw = raw or RAW
    d = pd.read_csv(raw / "owid_political_regime" / "political-regime.csv")
    c = pd.read_csv(raw / "owid_continentes" / "continentes.csv")
    cont = dict(zip(c["Code"], c["World region according to OWID"], strict=True))
    # só países atuais (descarta entes históricos OWID_*)
    d = d[d.Code.notna() & d.Code.isin(cont.keys())]
    anos = np.arange(1789, ANO_FIM + 1)
    codes = sorted(d.Code.unique())
    S = -np.ones((len(codes), len(anos)), dtype=np.int8)
    idx = {c: i for i, c in enumerate(codes)}
    for code, ano, v in zip(d.Code, d.Year, d["Political regime"], strict=True):
        if 1789 <= ano <= ANO_FIM:
            S[idx[code], ano - 1789] = int(v)
    return S, codes, anos, {k: cont[k] for k in codes}


# --------------------------------------------------------------------------------------------
# Núcleo: contagens, posterior, estacionária, duração, primeira passagem
# --------------------------------------------------------------------------------------------


def contar(S: np.ndarray, anos: np.ndarray, y0: int, y1: int, h: int = 1) -> np.ndarray:
    """Contagens (n_paises, K, K) de transições de t para t+h com y0 <= t e t+h <= y1."""
    i0, i1 = int(y0 - anos[0]), int(y1 - anos[0])
    a, b = S[:, i0 : i1 + 1 - h], S[:, i0 + h : i1 + 1]
    ok = (a >= 0) & (b >= 0)
    out = np.zeros((S.shape[0], K, K))
    ci, ti = np.nonzero(ok)
    np.add.at(out, (ci, a[ci, ti], b[ci, ti]), 1.0)
    return out


def normalizar(C: np.ndarray) -> np.ndarray:
    s = C.sum(-1, keepdims=True)
    return np.where(s > 0, C / np.where(s > 0, s, 1), 1.0 / C.shape[-1])


def amostrar_P(alpha: np.ndarray, n: int, rng: np.random.Generator) -> np.ndarray:
    g = rng.gamma(np.maximum(alpha, 1e-12), size=(n, *alpha.shape))
    return g / g.sum(-1, keepdims=True)


def estacionaria(P: np.ndarray) -> np.ndarray:
    """Distribuição estacionária (resolve pi (P - I) = 0, sum = 1). Aceita lote (..., K, K)."""
    k = P.shape[-1]
    A = np.swapaxes(P, -1, -2) - np.eye(k)
    A[..., -1, :] = 1.0
    b = np.zeros(P.shape[:-1])
    b[..., -1] = 1.0
    return np.linalg.solve(A, b[..., None])[..., 0]


def duracao_esperada(P: np.ndarray) -> np.ndarray:
    """Anos esperados num estado antes de sair: 1/(1 - p_ii) (geométrico). (..., K)."""
    d = np.diagonal(P, axis1=-2, axis2=-1)
    return 1.0 / np.maximum(1.0 - d, 1e-9)


def _matpow(Q: np.ndarray, h: int) -> np.ndarray:
    out = np.broadcast_to(np.eye(Q.shape[-1]), Q.shape).copy()
    for _ in range(h):
        out = out @ Q
    return out


def primeira_passagem(P: np.ndarray, alvo: list[int], h: int) -> np.ndarray:
    """P(atingir `alvo` em até h anos | estado inicial), com `alvo` absorvente. (..., K).

    Para estados iniciais dentro do alvo o resultado é 1 (já está lá); use só origens fora dele.
    """
    Q = P.copy()
    for a in alvo:
        Q[..., a, :] = 0.0
        Q[..., a, a] = 1.0
    return _matpow(Q, h)[..., alvo].sum(-1)


def tempo_medio_passagem(P: np.ndarray, alvo: list[int]) -> np.ndarray:
    """E[tempo até `alvo`] a partir de cada estado (0 dentro do alvo). (K,)."""
    k = P.shape[0]
    fora = [i for i in range(k) if i not in alvo]
    m = np.zeros(k)
    N = np.eye(len(fora)) - P[np.ix_(fora, fora)]
    m[fora] = np.linalg.solve(N, np.ones(len(fora)))
    return m


def simular(
    P: np.ndarray, s0: np.ndarray, T: int, rng: np.random.Generator
) -> np.ndarray:
    """Trajetórias (n, T+1) de uma cadeia com matriz P a partir de estados iniciais s0 (n,)."""
    n = len(s0)
    out = np.empty((n, T + 1), dtype=np.int8)
    out[:, 0] = s0
    cdf = np.cumsum(P, axis=1)
    for t in range(T):
        u = rng.random(n)
        out[:, t + 1] = np.minimum((u[:, None] > cdf[out[:, t]]).sum(1), P.shape[0] - 1)
    return out


def dm_loglik(C: np.ndarray, alpha: np.ndarray) -> float:
    """log P(contagens | Dirichlet-multinomial) somado por linha (C e alpha: K x K)."""
    n = C.sum(-1)
    a0 = alpha.sum(-1)
    return float(
        (
            special.gammaln(a0)
            - special.gammaln(a0 + n)
            + (special.gammaln(alpha + C) - special.gammaln(alpha)).sum(-1)
        ).sum()
    )


KAPPAS = (1, 2, 5, 10, 20, 50, 100, 200, 500, 1000)


def escolher_kappa(Cpais: np.ndarray, medias: list[np.ndarray]) -> tuple[float, dict]:
    """kappa por verossimilhança marginal leave-one-country-out.

    `Cpais`: (n, K, K) contagens dos países do grupo; `medias[i]` é a média a priori para o país i
    calculada SEM o país i. Maximiza soma_i log DM(C_i | kappa * media_i).
    """
    ll = {
        str(kp): float(
            sum(dm_loglik(Cpais[i], kp * medias[i] + 1e-9) for i in range(len(medias)))
        )
        for kp in KAPPAS
    }
    return float(max(ll, key=ll.get)), ll


def cadeia_hierarquica(
    S: np.ndarray,
    anos: np.ndarray,
    codes: list[str],
    y0: int = ANO_MIN_EST,
    y1: int = ANO_FIM,
) -> dict:
    """Mundo (prior fraco) -> América Latina -> Brasil; devolve alphas, kappas e contagens."""
    C = contar(S, anos, y0, y1)
    ci = {c: i for i, c in enumerate(codes)}
    la = [ci[c] for c in LATAM if c in ci]
    br = ci["BRA"]
    rest = np.array([i for i in range(len(codes)) if i not in set(la)])
    prior_w = 0.5  # Jeffreys-like por célula
    Cw = C.sum(0)
    Pw = normalizar(Cw + prior_w)
    Pw_sem_la = normalizar(C[rest].sum(0) + prior_w)
    kappa_la, ll_la = escolher_kappa(C[la], [Pw_sem_la] * len(la))
    Cla = C[la].sum(0)
    alpha_la = kappa_la * Pw + Cla
    # Brasil em torno da AL SEM o Brasil (evita contar o Brasil duas vezes); contagens próprias de 1822
    # (o Brasil é soberano desde então; antes disso o dado é imputado de Portugal e não é usado).
    medias_br = [
        normalizar(kappa_la * Pw + C[[j for k, j in enumerate(la) if k != i]].sum(0))
        for i in range(len(la))
    ]
    kappa_br, ll_br = escolher_kappa(C[la], medias_br)
    Pla_sem_br = normalizar(kappa_la * Pw + C[[j for j in la if j != br]].sum(0))
    Cbr = contar(S, anos, ANO_BRASIL, y1)[br]
    alpha_br = kappa_br * Pla_sem_br + Cbr
    return {
        "C": C,
        "la_idx": la,
        "br_idx": br,
        "alpha": {
            "global": Cw + prior_w,
            "america_latina": alpha_la,
            "brasil": alpha_br,
        },
        "kappa": {"america_latina": kappa_la, "brasil": kappa_br},
        "ll_kappa": {"america_latina": ll_la, "brasil": ll_br},
        "contagens": {"global": Cw, "america_latina": Cla, "brasil": Cbr},
    }


# --------------------------------------------------------------------------------------------
# Testes do pressuposto markoviano
# --------------------------------------------------------------------------------------------


def espells(
    S: np.ndarray, anos: np.ndarray, y0: int = ANO_MIN_EST, y1: int = ANO_FIM
) -> pd.DataFrame:
    """Permanências (spells) por país: estado, início, duração em anos, censuras e destino.

    `esq` = já em curso em y0 (idade desconhecida); `dir` = ainda em curso no último ano válido.
    """
    i0, i1 = int(y0 - anos[0]), int(y1 - anos[0])
    linhas = []
    for c in range(S.shape[0]):
        x = S[c, i0 : i1 + 1]
        t = 0
        n = len(x)
        while t < n:
            if x[t] < 0:
                t += 1
                continue
            s = int(x[t])
            u = t
            while u + 1 < n and x[u + 1] == s:
                u += 1
            nxt = int(x[u + 1]) if u + 1 < n else -1
            linhas.append(
                {
                    "pais": c,
                    "estado": s,
                    "inicio": int(anos[i0] + t),
                    "dur": u - t + 1,
                    "esq": t == 0,
                    "dir": nxt < 0,
                    "destino": nxt,
                }
            )
            t = u + 1
    return pd.DataFrame(linhas)


def _ll_dweibull(theta: np.ndarray, L: np.ndarray, cens: np.ndarray) -> float:
    """-loglik Weibull discreta: S(t) = exp(-lam t^beta); completa em L, ou censurada (L-1 'stays')."""
    lam, beta = np.exp(theta[0]), np.exp(theta[1])
    a = lam * (L - 1.0) ** beta
    b = lam * L**beta
    ll_c = -(lam * (L - 1.0) ** beta)
    ll_d = -a + np.log1p(-np.exp(-(b - a)) + 1e-300)
    return -float(np.where(cens, ll_c, ll_d).sum())


def lrt_duracao(L: np.ndarray, cens: np.ndarray) -> dict:
    """Geométrica (beta=1; equivale à linha da matriz) vs Weibull discreta: razão de verossimilhança."""
    L = L.astype(float)
    stays = float((L - 1).sum())
    exits = float((~cens).sum())
    if exits < 3:
        return {"n_spells": len(L), "n_saidas": int(exits), "lrt": None}
    q = stays / (stays + exits)
    ll_g = -(_ll_dweibull(np.array([math.log(-math.log(q)), 0.0]), L, cens))
    best = None
    for b0 in (0.5, 1.0, 1.5):
        r = optimize.minimize(
            _ll_dweibull,
            np.array([math.log(-math.log(q)), math.log(b0)]),
            args=(L, cens),
            method="Nelder-Mead",
            options={"xatol": 1e-6, "fatol": 1e-8, "maxiter": 2000},
        )
        if best is None or r.fun < best.fun:
            best = r
    ll_w = -best.fun
    lrt = max(0.0, 2 * (ll_w - ll_g))
    return {
        "n_spells": len(L),
        "n_saidas": int(exits),
        "lam": float(np.exp(best.x[0])),
        "beta": float(np.exp(best.x[1])),
        "p_geometrica": float(q),
        "lrt": float(lrt),
        "p_chi2_1gl": float(stats.chi2.sf(lrt, 1)),
        "aic_geom": float(-2 * ll_g + 2),
        "aic_weibull": float(-2 * ll_w + 4),
    }


def testes_duracao(sp: pd.DataFrame, codes: list[str]) -> dict:
    """LRT por estado (spells não censurados à esquerda), global e América Latina; hazard por idade."""
    ok = ~sp["esq"]
    la = sp["pais"].isin([codes.index(c) for c in LATAM if c in codes])
    out = {"global": {}, "america_latina": {}, "hazard_por_idade_global": {}}
    for s in range(K):
        for nome, m in (("global", ok), ("america_latina", ok & la)):
            g = sp[m & (sp.estado == s)]
            out[nome][ESTADOS[s]] = lrt_duracao(
                g["dur"].to_numpy(), g["dir"].to_numpy()
            )
    faixas = [(1, 1), (2, 3), (4, 7), (8, 15), (16, 31), (32, 999)]
    tab = hazard_idade(sp[ok])
    for s in range(K):
        out["hazard_por_idade_global"][ESTADOS[s]] = [
            {
                "idade": f"{a}-{b}" if b < 999 else f"{a}+",
                "exposicao": int(tab["expo"][s, i]),
                "saidas": int(tab["exits"][s, i]),
                "hazard": (
                    float(tab["exits"][s, i] / tab["expo"][s, i])
                    if tab["expo"][s, i] > 0
                    else None
                ),
            }
            for i, (a, b) in enumerate(faixas)
        ]
    return out


NB = 6  # faixas de idade: 1 | 2-3 | 4-7 | 8-15 | 16-31 | 32+
AMAX = 32


def faixa_idade(a: np.ndarray | int) -> np.ndarray | int:
    return np.digitize(a, [2, 4, 8, 16, 32])


def hazard_idade(sp: pd.DataFrame) -> dict:
    """Exposição (tentativas de saída) e saídas por (estado, faixa de idade)."""
    expo = np.zeros((K, NB))
    exits = np.zeros((K, NB))
    dest = np.zeros((K, K))
    for s, L, dr, d in zip(sp.estado, sp.dur, sp["dir"], sp.destino, strict=True):
        n_tent = L - 1 if dr else L  # censurado: só L-1 permanências observadas
        if n_tent > 0:
            ages = np.arange(1, n_tent + 1)
            np.add.at(expo[s], faixa_idade(ages), 1.0)
        if not dr:
            exits[s, int(faixa_idade(L))] += 1
            dest[s, d] += 1
    return {"expo": expo, "exits": exits, "dest": dest}


def semi_markov_P(tab: dict, kappa0: float = 5.0) -> np.ndarray:
    """Matriz (K*AMAX)^2 do semi-Markov com risco por faixa de idade (encolhido ao risco médio do estado)."""
    expo, exits, dest = tab["expo"], tab["exits"], tab["dest"]
    hs = exits.sum(1) / np.maximum(expo.sum(1), 1.0)
    haz = (exits + kappa0 * hs[:, None]) / (expo + kappa0)
    n = K * AMAX
    M = np.zeros((n, n))
    for s in range(K):
        d = dest[s].copy() + 0.5
        d[s] = 0.0
        d /= d.sum()
        for a in range(1, AMAX + 1):
            h = haz[s, int(faixa_idade(a))]
            i = s * AMAX + a - 1
            M[i, s * AMAX + min(a + 1, AMAX) - 1] += 1 - h
            for j in range(K):
                if j != s:
                    M[i, j * AMAX] += h * d[j]
    return M


def contagens3(S: np.ndarray, anos: np.ndarray, y0: int, y1: int) -> np.ndarray:
    i0, i1 = int(y0 - anos[0]), int(y1 - anos[0])
    a, b, c = S[:, i0 : i1 - 1], S[:, i0 + 1 : i1], S[:, i0 + 2 : i1 + 1]
    ok = (a >= 0) & (b >= 0) & (c >= 0)
    out = np.zeros((K, K, K))
    np.add.at(out, (a[ok], b[ok], c[ok]), 1.0)
    return out


def _gl_suporte(C: np.ndarray) -> int:
    """Parâmetros livres de uma cadeia: soma por contexto (destinos observados - 1)."""
    return int(((C > 0).sum(-1) - 1).clip(min=0).sum())


def lrt_ordem2(C3: np.ndarray) -> dict:
    C2 = C3.sum(0)  # (j, k) pooled
    mask = C3 > 0
    p3 = C3 / np.where(C3.sum(-1, keepdims=True) > 0, C3.sum(-1, keepdims=True), 1)
    p2 = C2 / np.where(C2.sum(-1, keepdims=True) > 0, C2.sum(-1, keepdims=True), 1)
    ll3 = float((C3[mask] * np.log(p3[mask])).sum())
    ll2 = float((C2[C2 > 0] * np.log(p2[C2 > 0])).sum())
    lrt = max(0.0, 2 * (ll3 - ll2))
    gl = _gl_suporte(C3.reshape(K * K, K)) - _gl_suporte(C2)
    n = float(C3.sum())
    return {
        "lrt": lrt,
        "gl": gl,
        "p_chi2": float(stats.chi2.sf(lrt, max(gl, 1))),
        "aic_ordem1": float(-2 * ll2 + 2 * _gl_suporte(C2)),
        "aic_ordem2": float(-2 * ll3 + 2 * _gl_suporte(C3.reshape(K * K, K))),
        "bic_ordem1": float(-2 * ll2 + math.log(n) * _gl_suporte(C2)),
        "bic_ordem2": float(-2 * ll3 + math.log(n) * _gl_suporte(C3.reshape(K * K, K))),
        "n": int(n),
    }


def lrt_grupos(Cg: np.ndarray) -> dict:
    """Matriz comum vs matriz por grupo (era/região): LRT com gl = (G-1) * parâmetros livres."""
    Cg = np.asarray(Cg)
    Cp = Cg.sum(0)
    Pp = normalizar(Cp)
    ll_g = ll_p = 0.0
    for C in Cg:
        P = normalizar(C)
        m = C > 0
        ll_g += float((C[m] * np.log(P[m])).sum())
        ll_p += float((C[m] * np.log(Pp[m])).sum())
    lrt = max(0.0, 2 * (ll_g - ll_p))
    gl = (len(Cg) - 1) * _gl_suporte(Cp)
    return {
        "lrt": lrt,
        "gl": gl,
        "p_chi2": float(stats.chi2.sf(lrt, max(gl, 1))),
        "n_por_grupo": [int(c.sum()) for c in Cg],
    }


ERAS = [(1900, 1945), (1946, 1989), (1990, ANO_FIM - 1)]


def _estat_nulo(
    S: np.ndarray, anos: np.ndarray, grupo_cont: np.ndarray
) -> dict[str, float]:
    C3 = contagens3(S, anos, ANO_MIN_EST, ANO_FIM)
    ce = np.array([contar(S, anos, a, b + 1).sum(0) for a, b in ERAS])
    cr = np.array(
        [
            contar(S, anos, ANO_MIN_EST, ANO_FIM)[grupo_cont == g].sum(0)
            for g in np.unique(grupo_cont)
        ]
    )
    sp = espells(S, anos)
    sp = sp[~sp["esq"]]
    out = {
        "ordem2": lrt_ordem2(C3)["lrt"],
        "era": lrt_grupos(ce)["lrt"],
        "regiao": lrt_grupos(cr)["lrt"],
    }
    for s in (0, 1, 2, 3):
        g = sp[sp.estado == s]
        r = lrt_duracao(g["dur"].to_numpy(), g["dir"].to_numpy())
        out[f"weibull_{s}"] = r["lrt"] if r["lrt"] is not None else float("nan")
    return out


def painel_sintetico_homogeneo(
    S: np.ndarray, anos: np.ndarray, P: np.ndarray, rng: np.random.Generator
) -> np.ndarray:
    """Painel com a MESMA máscara de ausência do real e dinâmica Markov homogênea P (nulo)."""
    i0 = int(ANO_MIN_EST - anos[0])
    Sw = S.copy()
    first = np.array(
        [x[x >= 0][0] if (x[i0:] >= 0).any() else 0 for x in S[:, i0:]], dtype=np.int8
    )
    sim = simular(P, first, S.shape[1] - 1 - i0, rng)
    out = S.copy()
    out[:, i0:] = np.where(S[:, i0:] >= 0, sim, -1)
    del Sw
    return out


def calibrar_nulo(
    S: np.ndarray, anos: np.ndarray, P: np.ndarray, cont_idx: np.ndarray, R: int = 60
) -> dict:
    """FPR dos testes sob o nulo (cadeia homogênea, sem duração/ordem 2/heterogeneidade)."""
    rng = np.random.default_rng(SEED + 1)
    reais = _estat_nulo(S, anos, cont_idx)
    sims = [
        _estat_nulo(painel_sintetico_homogeneo(S, anos, P, rng), anos, cont_idx)
        for _ in range(R)
    ]
    df = pd.DataFrame(sims)
    gls = {
        "ordem2": lrt_ordem2(contagens3(S, anos, ANO_MIN_EST, ANO_FIM))["gl"],
        "era": lrt_grupos(
            np.array([contar(S, anos, a, b + 1).sum(0) for a, b in ERAS])
        )["gl"],
        "regiao": None,
    }
    res = {}
    for col in df.columns:
        x = df[col].dropna().to_numpy()
        gl = gls.get(col, 1)
        crit_emp = float(np.quantile(x, 0.95))
        item = {
            "n_sims": len(x),
            "media_sob_nulo": float(x.mean()),
            "p95_sob_nulo": crit_emp,
            "lrt_observado": float(reais[col]),
            "p_empirico": float((np.sum(x >= reais[col]) + 1) / (len(x) + 1)),
        }
        if gl:
            crit = float(stats.chi2.ppf(0.95, gl))
            item["gl_nominal"] = int(gl)
            item["fpr_no_corte_chi2"] = float((x > crit).mean())
        res[col] = item
    return res


# --------------------------------------------------------------------------------------------
# Validação fora da amostra
# --------------------------------------------------------------------------------------------

EPS_DURA = 0.01
MODELOS = ("markov", "direto", "persist_calibrada", "persist_dura", "climatologia")
BINS = np.array([0, 0.01, 0.03, 0.1, 0.2, 0.35, 0.5, 0.7, 0.9, 0.97, 1.0001])


def prever(C1: np.ndarray, Dh: np.ndarray, h: int) -> dict[str, np.ndarray]:
    """Previsões de h passos (K x K, linha = estado atual) de cada modelo, treinadas em C1 (1 passo) e Dh (h passos)."""
    P = normalizar(C1 + 0.5)
    clim = estacionaria(P)
    direto = normalizar(Dh + 0.5)
    stay = np.diag(Dh) / np.maximum(Dh.sum(1), 1)
    pc = np.zeros((K, K))
    for s in range(K):
        resto = np.delete(clim, s)
        pc[s] = np.insert((1 - stay[s]) * resto / resto.sum(), s, stay[s])
    pd_ = np.full((K, K), EPS_DURA / (K - 1))
    np.fill_diagonal(pd_, 1 - EPS_DURA)
    return {
        "markov": np.linalg.matrix_power(P, h),
        "direto": direto,
        "persist_calibrada": pc,
        "persist_dura": pd_,
        "climatologia": np.tile(clim, (K, 1)),
    }


def pontuar(D: np.ndarray, Pm: np.ndarray) -> tuple[float, float, float]:
    """(log-verossimilhança, Brier, n) de contagens de teste D (K x K) sob previsão Pm."""
    ll = float((D * np.log(np.maximum(Pm, 1e-12))).sum())
    br = float((D * ((Pm**2).sum(1)[:, None] - 2 * Pm + 1)).sum())
    return ll, br, float(D.sum())


def _boot_dif(
    n: np.ndarray, a: np.ndarray, b: np.ndarray, rng: np.random.Generator, B: int = 300
) -> dict:
    """Diferença de perda média (a - b; negativa = a melhor) com bootstrap por cluster (país)."""
    ok = n > 0
    n, a, b = n[ok], a[ok], b[ok]
    d0 = float((a.sum() - b.sum()) / n.sum())
    idx = rng.integers(0, len(n), size=(B, len(n)))
    bs = (a[idx].sum(1) - b[idx].sum(1)) / n[idx].sum(1)
    return {
        "dif": d0,
        "ep": float(bs.std()),
        "ic90": [float(np.quantile(bs, 0.05)), float(np.quantile(bs, 0.95))],
        "distingue_de_zero": bool(
            np.quantile(bs, 0.05) > 0 or np.quantile(bs, 0.95) < 0
        ),
    }


def _agregar(
    acc: dict[str, dict[str, np.ndarray]],
    n: np.ndarray,
    rng: np.random.Generator,
    base: tuple[str, ...] = ("persist_calibrada", "climatologia"),
) -> dict:
    """Resume (por modelo) log-loss e Brier e as diferenças pareadas contra as baselines."""
    out = {
        "n_transicoes": int(n.sum()),
        "n_clusters": int((n > 0).sum()),
        "modelos": {},
    }
    for m, v in acc.items():
        out["modelos"][m] = {
            "logloss": float(-v["ll"].sum() / n.sum()),
            "brier": float(v["br"].sum() / n.sum()),
        }
    out["dif_logloss"] = {}
    out["dif_brier"] = {}
    for m in acc:
        if m in base:
            continue
        for b in base:
            if b not in acc:
                continue
            out["dif_logloss"][f"{m}_vs_{b}"] = _boot_dif(
                n, -acc[m]["ll"], -acc[b]["ll"], rng
            )
            out["dif_brier"][f"{m}_vs_{b}"] = _boot_dif(
                n, acc[m]["br"], acc[b]["br"], rng
            )
    return out


def _novo_acc(nc: int, modelos) -> dict[str, dict[str, np.ndarray]]:
    return {m: {"ll": np.zeros(nc), "br": np.zeros(nc)} for m in modelos}


def validar_fora_da_amostra(
    S: np.ndarray, anos: np.ndarray, codes: list[str], cont: dict[str, str], hier: dict
) -> dict:
    """Leave-country-out, leave-region-out, cortes temporais e AL hierárquica; h = 1, 5, 10."""
    rng = np.random.default_rng(SEED + 2)
    n = len(codes)
    y0, y1 = ANO_MIN_EST, ANO_FIM
    D = {h: contar(S, anos, y0, y1, h) for h in HORIZ}
    Dt = {h: D[h].sum(0) for h in HORIZ}
    regs = np.array([cont[c] for c in codes])
    la_idx = np.array(hier["la_idx"])
    res: dict = {"loco": {}, "leave_region_out": {}, "corte_temporal": {}}
    calib: dict = {}

    def _calib(buf, h, nome, p, D_row):
        for i in range(K):
            w = D_row[i].sum()
            if w > 0:
                for k in range(K):
                    buf.setdefault((nome, h), []).append((p[i, k], w, D_row[i, k]))

    for h in HORIZ:
        # --- leave-country-out
        acc = _novo_acc(n, MODELOS)
        nn = np.zeros(n)
        buf: dict = {}
        for c in range(n):
            pr = prever(Dt[1] - D[1][c], Dt[h] - D[h][c], h)
            for m in MODELOS:
                ll, br, nc = pontuar(D[h][c], pr[m])
                acc[m]["ll"][c], acc[m]["br"][c] = ll, br
            nn[c] = D[h][c].sum()
            for m in ("markov", "direto"):
                _calib(buf, h, m, pr[m], D[h][c])
        res["loco"][f"h{h}"] = _agregar(acc, nn, rng)
        for (nome, hh), lst in buf.items():
            calib.setdefault(nome, {})[f"h{hh}"] = _tabela_calibracao(lst)
        # --- leave-region-out (continentes OWID)
        acc = _novo_acc(n, MODELOS)
        for g in sorted(set(regs)):
            m_g = regs == g
            pr = prever(Dt[1] - D[1][m_g].sum(0), Dt[h] - D[h][m_g].sum(0), h)
            for c in np.nonzero(m_g)[0]:
                for m in MODELOS:
                    ll, br, _ = pontuar(D[h][c], pr[m])
                    acc[m]["ll"][c], acc[m]["br"][c] = ll, br
        res["leave_region_out"].setdefault("continentes", {})[f"h{h}"] = _agregar(
            acc, nn, rng
        )
        # --- leave-LatAm-out
        acc = _novo_acc(n, MODELOS)
        pr = prever(Dt[1] - D[1][la_idx].sum(0), Dt[h] - D[h][la_idx].sum(0), h)
        for c in la_idx:
            for m in MODELOS:
                ll, br, _ = pontuar(D[h][c], pr[m])
                acc[m]["ll"][c], acc[m]["br"][c] = ll, br
        nl = np.zeros(n)
        nl[la_idx] = nn[la_idx]
        res["leave_region_out"].setdefault("america_latina", {})[f"h{h}"] = _agregar(
            acc, nl, rng
        )
        # --- cortes temporais (treina com transições até o corte; testa t > corte)
        for cut in (1960, 1980, 2000):
            if cut + h + 1 > y1:
                continue
            Ctr1 = contar(S, anos, y0, cut, 1).sum(0)
            Dtr = contar(S, anos, y0, cut, h).sum(0)
            Dte = contar(S, anos, cut + 1, y1, h)
            pr = prever(Ctr1, Dtr, h)
            acc = _novo_acc(n, MODELOS)
            for c in range(n):
                for m in MODELOS:
                    ll, br, _ = pontuar(Dte[c], pr[m])
                    acc[m]["ll"][c], acc[m]["br"][c] = ll, br
            res["corte_temporal"].setdefault(f"corte_{cut}", {})[f"h{h}"] = _agregar(
                acc, Dte.sum((1, 2)), rng
            )
    # --- AL hierárquica (leave-country-out dentro da AL): global vs AL encolhida
    C1 = hier["C"]
    Pw_tot = C1.sum(0)
    kl = hier["kappa"]["america_latina"]
    res["america_latina_hierarquica"] = {}
    for h in HORIZ:
        mods = ("markov_global", "markov_AL_hier", "persist_calibrada", "climatologia")
        acc = _novo_acc(n, mods)
        nl = np.zeros(n)
        for c in la_idx:
            pr = prever(Dt[1] - D[1][c], Dt[h] - D[h][c], h)
            Pw_c = normalizar(Pw_tot - C1[c] + 0.5)
            la_c = [j for j in la_idx if j != c]
            Pal = normalizar(kl * Pw_c + C1[la_c].sum(0))
            pm = {
                "markov_global": pr["markov"],
                "markov_AL_hier": np.linalg.matrix_power(Pal, h),
                "persist_calibrada": pr["persist_calibrada"],
                "climatologia": pr["climatologia"],
            }
            for m in mods:
                ll, br, _ = pontuar(D[h][c], pm[m])
                acc[m]["ll"][c], acc[m]["br"][c] = ll, br
            nl[c] = D[h][c].sum()
        res["america_latina_hierarquica"][f"h{h}"] = _agregar(
            acc, nl, rng, base=("persist_calibrada", "markov_global")
        )
    res["calibracao_por_faixas_loco"] = calib
    return res


def _tabela_calibracao(lst: list[tuple[float, float, float]]) -> dict:
    a = np.array(lst)
    p, w, o = a[:, 0], a[:, 1], a[:, 2]
    idx = np.digitize(p, BINS) - 1
    faixas = []
    ece = 0.0
    for b in range(len(BINS) - 1):
        m = idx == b
        if not m.any() or w[m].sum() == 0:
            continue
        pm = float((p[m] * w[m]).sum() / w[m].sum())
        ob = float(o[m].sum() / w[m].sum())
        ece += w[m].sum() * abs(pm - ob)
        faixas.append(
            {
                "faixa": [float(BINS[b]), float(min(BINS[b + 1], 1.0))],
                "n": int(w[m].sum()),
                "previsto": pm,
                "observado": ob,
            }
        )
    return {"ece": float(ece / w.sum()), "faixas": faixas}


def _teste_ordem2_ooS(S: np.ndarray, anos: np.ndarray, kappa: float = 5.0) -> dict:
    """Ordem 2 (prior = ordem 1, força kappa) vs ordem 1, leave-country-out, 1 passo, mesmos pontos."""
    n = S.shape[0]
    i0, i1 = int(ANO_MIN_EST - anos[0]), int(ANO_FIM - anos[0])
    a, b, c = S[:, i0 : i1 - 1], S[:, i0 + 1 : i1], S[:, i0 + 2 : i1 + 1]
    ok = (a >= 0) & (b >= 0) & (c >= 0)
    T = np.zeros((n, K, K, K))
    for ci in range(n):
        m = ok[ci]
        np.add.at(T[ci], (a[ci][m], b[ci][m], c[ci][m]), 1.0)
    Tt = T.sum(0)
    ll1 = np.zeros(n)
    ll2 = np.zeros(n)
    nn = T.sum((1, 2, 3))
    for ci in range(n):
        Ttr = Tt - T[ci]
        P1 = normalizar(Ttr.sum(0) + 0.5)
        P2 = (kappa * P1[None] + Ttr) / (kappa + Ttr.sum(-1, keepdims=True))
        ll1[ci] = (T[ci] * np.log(P1[None])).sum()
        ll2[ci] = (T[ci] * np.log(P2)).sum()
    rng = np.random.default_rng(SEED + 3)
    return {
        "logloss_ordem1": float(-ll1.sum() / nn.sum()),
        "logloss_ordem2": float(-ll2.sum() / nn.sum()),
        "dif_ordem2_menos_ordem1": _boot_dif(nn, -ll2, -ll1, rng),
        "kappa_prior_ordem2": kappa,
        "n": int(nn.sum()),
    }


def _teste_semimarkov_ooS(S: np.ndarray, anos: np.ndarray, sp: pd.DataFrame) -> dict:
    """Semi-Markov (risco por faixa de idade) vs Markov, leave-country-out, nos pontos com idade conhecida."""
    n = S.shape[0]
    ok = sp[~sp["esq"]]
    tabs = [
        hazard_idade(ok[ok.pais == c]) if (ok.pais == c).any() else _tab_vazia()
        for c in range(n)
    ]
    tot = {k: sum(t[k] for t in tabs) for k in ("expo", "exits", "dest")}
    # pontos de teste (estado, idade, resultado em t+h) por país, só spells com idade conhecida
    y1 = int(ANO_FIM - anos[0])
    E = {h: np.zeros((n, K * AMAX, K)) for h in HORIZ}
    Dk = {h: np.zeros((n, K, K)) for h in HORIZ}
    for c, s, ini, L in zip(ok.pais, ok.estado, ok.inicio, ok.dur, strict=True):
        t0 = int(ini - anos[0])
        for t in range(t0, t0 + L):
            a = min(t - t0 + 1, AMAX)
            for h in HORIZ:
                if t + h <= y1 and S[c, t + h] >= 0:
                    E[h][c, s * AMAX + a - 1, S[c, t + h]] += 1
                    Dk[h][c, s, S[c, t + h]] += 1
    rng = np.random.default_rng(SEED + 4)
    C1 = contar(S, anos, ANO_MIN_EST, ANO_FIM, 1)
    Dall = {h: contar(S, anos, ANO_MIN_EST, ANO_FIM, h) for h in HORIZ}
    out = {}
    for h in HORIZ:
        mods = ("semi_markov", "markov", "persist_calibrada", "climatologia")
        acc = _novo_acc(n, mods)
        nn = Dk[h].sum((1, 2))
        for c in range(n):
            if nn[c] == 0:
                continue
            tr = {k: tot[k] - tabs[c][k] for k in tot}
            M = np.linalg.matrix_power(semi_markov_P(tr), h)
            # agrega a previsão de estado destino por (s,a): soma sobre idades destino
            Ph = np.zeros((K * AMAX, K))
            for j in range(K):
                Ph[:, j] = M[:, j * AMAX : (j + 1) * AMAX].sum(1)
            Ph = np.maximum(Ph, 1e-12)
            Ph /= Ph.sum(1, keepdims=True)
            ll = float((E[h][c] * np.log(Ph)).sum())
            sm_br = 0.0
            for r in range(K * AMAX):
                if E[h][c][r].sum() > 0:
                    sm_br += float(
                        (E[h][c][r] * ((Ph[r] ** 2).sum() - 2 * Ph[r] + 1)).sum()
                    )
            acc["semi_markov"]["ll"][c], acc["semi_markov"]["br"][c] = ll, sm_br
            pr = prever(
                C1.sum(0) - C1[c], Dall[h].sum(0) - Dall[h][c], h
            )  # treino em todos os pontos
            for m in ("markov", "persist_calibrada", "climatologia"):
                l2, b2, _ = pontuar(Dk[h][c], pr[m])
                acc[m]["ll"][c], acc[m]["br"][c] = l2, b2
        out[f"h{h}"] = _agregar(acc, nn, rng, base=("markov", "persist_calibrada"))
    return out


def _tab_vazia() -> dict:
    return {
        "expo": np.zeros((K, NB)),
        "exits": np.zeros((K, NB)),
        "dest": np.zeros((K, K)),
    }


# --------------------------------------------------------------------------------------------
# Controles sintéticos (verdade conhecida)
# --------------------------------------------------------------------------------------------


def controle_sintetico(
    S: np.ndarray, anos: np.ndarray, P_true: np.ndarray, R: int = 100
) -> dict:
    """Recupera P de painéis simulados com a mesma máscara do real: erro, cobertura do IC90, teto (oráculo)."""
    rng = np.random.default_rng(SEED + 5)
    i0 = int(ANO_MIN_EST - anos[0])
    first = np.array(
        [x[x >= 0][0] if (x >= 0).any() else 0 for x in S[:, i0:]], dtype=np.int8
    )
    err, cob, est_err, dur_err, gap = [], [], [], [], []
    pi_t = estacionaria(P_true)
    dur_t = duracao_esperada(P_true)
    for _ in range(R):
        sim = simular(P_true, first, S.shape[1] - 1 - i0, rng)
        sim = np.where(S[:, i0:] >= 0, sim, -1)
        S2 = S.copy()
        S2[:, i0:] = sim
        C = contar(S2, anos, ANO_MIN_EST, ANO_FIM).sum(0)
        Ph = normalizar(C + 0.5)
        err.append(np.abs(Ph - P_true))
        draws = amostrar_P(C + 0.5, 400, rng)
        lo, hi = np.quantile(draws, 0.05, 0), np.quantile(draws, 0.95, 0)
        cob.append((P_true >= lo) & (P_true <= hi))
        est_err.append(np.abs(estacionaria(Ph) - pi_t))
        dur_err.append(np.abs(duracao_esperada(Ph) / dur_t - 1))
        # teto informacional: log-loss por transição de P verdadeiro vs P estimado em painel novo
        sim2 = simular(P_true, first, S.shape[1] - 1 - i0, rng)
        sim2 = np.where(S[:, i0:] >= 0, sim2, -1)
        S3 = S.copy()
        S3[:, i0:] = sim2
        Cn = contar(S3, anos, ANO_MIN_EST, ANO_FIM).sum(0)
        gap.append(float((Cn * (np.log(P_true) - np.log(Ph))).sum() / Cn.sum()))
    err, cob = np.array(err), np.array(cob)
    return {
        "R": R,
        "erro_abs_medio_por_celula": err.mean(0).round(5).tolist(),
        "erro_abs_medio": float(err.mean()),
        "cobertura_ic90_por_celula": cob.mean(0).round(3).tolist(),
        "cobertura_ic90_media": float(cob.mean()),
        "erro_abs_estacionaria": np.mean(est_err, 0).round(4).tolist(),
        "erro_relativo_duracao": np.mean(dur_err, 0).round(3).tolist(),
        "oraculo_logloss_ganho_por_transicao": float(np.mean(gap)),
        "P_verdadeira": P_true.round(5).tolist(),
    }


def controle_tamanho_brasil(
    P_true: np.ndarray,
    prior_media: np.ndarray,
    kappa: float,
    n_passos: int = 204,
    R: int = 300,
) -> dict:
    """Cadeia curta (tamanho do Brasil) com P conhecida: encolhimento a um prior (certo/errado) vs prior fraco."""
    rng = np.random.default_rng(SEED + 6)
    res = {}
    cfgs = {
        "prior_fraco_0.5": (np.full((K, K), 0.5), 1.0),
        f"encolhido_a_prior_dado_k{int(kappa)}": (prior_media, kappa),
    }
    for nome, (pm, kp) in cfgs.items():
        e, c, ll = [], [], []
        for r in range(R):
            path = simular(P_true, np.array([1]), n_passos, rng)[0]
            C = np.zeros((K, K))
            np.add.at(C, (path[:-1], path[1:]), 1.0)
            al = kp * pm + C
            Ph = normalizar(al)
            e.append(np.abs(Ph - P_true).mean())
            dr = amostrar_P(al, 200, rng)
            lo, hi = np.quantile(dr, 0.05, 0), np.quantile(dr, 0.95, 0)
            c.append(((P_true >= lo) & (P_true <= hi)).mean())
            ll.append(float((P_true * (np.log(P_true) - np.log(Ph))).sum(1).mean()))
        res[nome] = {
            "erro_abs_medio": float(np.mean(e)),
            "cobertura_ic90_media": float(np.mean(c)),
            "kl_medio_P_verdadeira_vs_estimada": float(np.mean(ll)),
        }
    return res


# --------------------------------------------------------------------------------------------
# (1) Regimes políticos: montagem
# --------------------------------------------------------------------------------------------

ANOS_PROJ = list(range(2027, 2039))
ALVOS = {
    "autocracia (fechada ou eleitoral)": [0, 1],
    "autocracia eleitoral": [1],
    "autocracia fechada": [0],
}


def _ic(x: np.ndarray, axis: int = 0) -> tuple[np.ndarray, np.ndarray]:
    return np.quantile(x, 0.05, axis), np.quantile(x, 0.95, axis)


def _r(a, nd: int = 5):
    return np.round(np.asarray(a, float), nd).tolist()


def _matriz_json(
    alpha: np.ndarray, contagens: np.ndarray, rng: np.random.Generator, nd: int = 3000
) -> tuple[dict, np.ndarray]:
    draws = amostrar_P(alpha, nd, rng)
    lo, hi = _ic(draws)
    return (
        {
            "P": _r(normalizar(alpha)),
            "ic90": {"lo": _r(lo), "hi": _r(hi)},
            "n_transicoes": int(contagens.sum()),
            "contagens": contagens.astype(int).tolist(),
        },
        draws,
    )


def trajetoria_brasil(
    S: np.ndarray, codes: list[str], anos: np.ndarray
) -> list[list[int]]:
    b = S[codes.index("BRA")]
    return [
        [int(a), int(v)]
        for a, v in zip(anos, b, strict=True)
        if a >= ANO_BRASIL and v >= 0
    ]


def brasil_por_periodo(traj: list[list[int]], historia: dict) -> list[dict]:
    """Cruza o estado V-Dem/RoW do Brasil com os períodos de historia.json (periodização ≠ classificação)."""
    anos = np.array([t[0] for t in traj])
    est = np.array([t[1] for t in traj])
    out = []
    for p in historia["periodos"]:
        a, b = int(str(p["inicio"])[:4]), int(str(p["fim"])[:4])
        m = (anos >= max(a, ANO_BRASIL)) & (anos <= min(b, ANO_FIM))
        if not m.any():
            continue
        cnt = np.bincount(est[m], minlength=K)
        out.append(
            {
                "periodo": p["id"],
                "rotulo_historia": p["regime"],
                "anos": [int(anos[m].min()), int(anos[m].max())],
                "n_anos": int(m.sum()),
                "anos_por_estado": {ESTADOS[i]: int(cnt[i]) for i in range(K)},
                "estado_modal": ESTADOS[int(cnt.argmax())],
            }
        )
    return out


def projetar(P: np.ndarray, s0: int, passos: int) -> np.ndarray:
    """Distribuição do estado a cada ano (1..passos) partindo de s0. P: (..., K, K) -> (passos, ..., K)."""
    v = np.zeros((*P.shape[:-2], K))
    v[..., s0] = 1.0
    out = []
    for _ in range(passos):
        v = np.einsum("...i,...ij->...j", v, P)
        out.append(v)
    return np.array(out)


def _fan_proj(P: np.ndarray, s0: int, ano_base: int) -> dict:
    n_pass = ANOS_PROJ[-1] - ano_base
    pr = projetar(P, s0, n_pass)  # (T, n, K) ou (T, K)
    sel = [a - ano_base - 1 for a in ANOS_PROJ]
    if pr.ndim == 2:
        return {"anos": ANOS_PROJ, "estados": ESTADOS, "p50": _r(pr[sel], 4)}
    q10, q50, q90 = (np.quantile(pr[sel], q, axis=1) for q in (0.1, 0.5, 0.9))
    return {
        "anos": ANOS_PROJ,
        "estados": ESTADOS,
        "p10": _r(q10, 4),
        "p50": _r(q50, 4),
        "p90": _r(q90, 4),
        "media_preditiva": _r(pr[sel].mean(1), 4),
    }


def _semi_markov_brasil(
    S: np.ndarray,
    anos: np.ndarray,
    sp: pd.DataFrame,
    codes: list[str],
    idade: int,
    B: int,
) -> dict:
    """Projeção e primeira passagem do semi-Markov global (risco por idade), bootstrap por país."""
    rng = np.random.default_rng(SEED + 7)
    ok = sp[~sp["esq"]]
    n = S.shape[0]
    tabs = [
        hazard_idade(ok[ok.pais == c]) if (ok.pais == c).any() else _tab_vazia()
        for c in range(n)
    ]
    s0 = 2 * AMAX + min(idade, AMAX) - 1
    n_pass = ANOS_PROJ[-1] - ANO_FIM
    sel = [a - ANO_FIM - 1 for a in ANOS_PROJ]

    def _run(w: np.ndarray) -> tuple[np.ndarray, dict]:
        tab = {
            k: sum(w[c] * tabs[c][k] for c in range(n))
            for k in ("expo", "exits", "dest")
        }
        M = semi_markov_P(tab)
        v = np.zeros(K * AMAX)
        v[s0] = 1
        traj = []
        for _ in range(n_pass):
            v = v @ M
            traj.append(v.reshape(K, AMAX).sum(1))
        fp = {}
        for nome, alvo in (("autocracia (fechada ou eleitoral)", [0, 1]),):
            # alvo absorvente no nível de estados: estados de alvo viram absorventes
            Q = M.copy()
            for a in alvo:
                for i in range(a * AMAX, (a + 1) * AMAX):
                    Q[i, :] = 0
                    Q[i, i] = 1
            for h in (5, 10, 12):
                Qh = np.linalg.matrix_power(Q, h)
                fp[(nome, h)] = float(
                    sum(Qh[s0, a * AMAX : (a + 1) * AMAX].sum() for a in alvo)
                )
        return np.array(traj), fp

    base_traj, base_fp = _run(np.ones(n))
    trajs, fps = [], []
    for _ in range(B):
        w = np.bincount(rng.integers(0, n, n), minlength=n).astype(float)
        t, f = _run(w)
        trajs.append(t[sel])
        fps.append(f)
    trajs = np.array(trajs)
    q = {
        f"p{int(x * 100)}": _r(np.quantile(trajs, x, axis=0), 4)
        for x in (0.1, 0.5, 0.9)
    }
    fpj = [
        {
            "origem": "democracia eleitoral há 39 anos (Brasil em 2025)",
            "alvo": nome,
            "h": h,
            "p": round(v, 4),
            "ic90": [
                round(float(np.quantile([f[(nome, h)] for f in fps], 0.05)), 4),
                round(float(np.quantile([f[(nome, h)] for f in fps], 0.95)), 4),
            ],
        }
        for (nome, h), v in base_fp.items()
    ]
    return {
        "metodo": "semi-Markov global: risco de saída por faixa de idade do regime atual (bootstrap por país)",
        "idade_usada_anos": idade,
        "projecao": {
            "anos": ANOS_PROJ,
            "estados": ESTADOS,
            "ponto": _r(base_traj[sel], 4),
            **q,
        },
        "primeira_passagem": fpj,
    }


def _heterogeneidade(S, anos, codes, cont, hier) -> dict:
    C = hier["C"]
    regs = np.array([cont[c] for c in codes])
    nomes = sorted(set(regs))
    cr = np.array([C[regs == g].sum(0) for g in nomes])
    ce = np.array([contar(S, anos, a, b + 1).sum(0) for a, b in ERAS])
    la = np.array(hier["la_idx"])
    outros = np.setdiff1d(np.arange(len(codes)), la)
    out = {
        "por_era": {"eras": [list(e) for e in ERAS], **lrt_grupos(ce)},
        "por_continente": {"continentes": nomes, **lrt_grupos(cr)},
        "america_latina_vs_resto": lrt_grupos(
            np.array([C[la].sum(0), C[outros].sum(0)])
        ),
        "brasil_vs_resto_da_AL_(desde_1900)": lrt_grupos(
            np.array(
                [C[hier["br_idx"]], C[[j for j in la if j != hier["br_idx"]]].sum(0)]
            )
        ),
    }
    # a matriz de 1900 vale para 2020? treina em uma era, testa em 2000-2024 (1 passo)
    Cte = contar(S, anos, 2000, ANO_FIM).sum(0)
    tr = {}
    for nome, (a, b) in {
        "1900-1949": (1900, 1949),
        "1950-1989": (1950, 1989),
        "1990-1999": (1990, 1999),
        "1900-1999 (tudo antes do teste)": (1900, 1999),
        "2000-2024 (na própria amostra: teto)": (2000, ANO_FIM),
    }.items():
        P = normalizar(contar(S, anos, a, b).sum(0) + 0.5)
        tr[nome] = float(-(Cte * np.log(P)).sum() / Cte.sum())
    out["matriz_antiga_no_teste_2000_2024_logloss"] = tr
    out["leitura"] = (
        "Rejeita-se a homogeneidade por era e por continente (LRT calibrado pelo nulo simulado, ver `nulo_calibrado`). "
        "A matriz de 1900-1949 prevê 2000-2024 pior que a de 1990-1999; usar a matriz recente é melhor, "
        "mas há poucas transições recentes."
    )
    return out


def regimes_politicos(
    S: np.ndarray,
    codes: list[str],
    anos: np.ndarray,
    cont: dict[str, str],
    historia: dict,
    rapido: bool = False,
) -> dict:
    rng = np.random.default_rng(SEED)
    hier = cadeia_hierarquica(S, anos, codes)
    mats, draws = {}, {}
    for k in ("global", "america_latina", "brasil"):
        mats[k], draws[k] = _matriz_json(hier["alpha"][k], hier["contagens"][k], rng)
        mats[k]["kappa_encolhimento"] = {
            "global": None,
            "america_latina": hier["kappa"]["america_latina"],
            "brasil": hier["kappa"]["brasil"],
        }[k]
    mats["global"]["prior"] = "Dirichlet(0,5) por célula (Jeffreys-like)"
    mats["america_latina"]["prior"] = (
        f"Dirichlet(kappa * P_global + contagens AL), kappa={hier['kappa']['america_latina']:g}"
    )
    mats["brasil"]["prior"] = (
        f"Dirichlet(kappa * P_AL sem Brasil + contagens do Brasil 1822-2025), kappa={hier['kappa']['brasil']:g}"
    )
    mats["brasil"]["periodo"] = [ANO_BRASIL, ANO_FIM]
    mats["global"]["periodo"] = [ANO_MIN_EST, ANO_FIM]
    mats["america_latina"]["periodo"] = [ANO_MIN_EST, ANO_FIM]
    mats["america_latina"]["paises"] = LATAM
    mats["kappa_escolha_ll_loo"] = hier["ll_kappa"]

    estac, dur, fp = {}, {}, []
    for k in ("global", "america_latina", "brasil"):
        pi = estacionaria(draws[k])
        lo, hi = _ic(pi)
        estac[k] = {
            "media": _r(estacionaria(normalizar(hier["alpha"][k])), 4),
            "ic90": {"lo": _r(lo, 4), "hi": _r(hi, 4)},
        }
        d = duracao_esperada(draws[k])
        dlo, dhi = _ic(d)
        dur[k] = {
            ESTADOS[i]: {
                "anos": round(
                    float(duracao_esperada(normalizar(hier["alpha"][k]))[i]), 1
                ),
                "ic90": [round(float(dlo[i]), 1), round(float(dhi[i]), 1)],
            }
            for i in range(K)
        }
        for o in (2, 3):
            for nome_alvo, alvo in ALVOS.items():
                for h in (5, 10, 12):
                    v = primeira_passagem(draws[k], alvo, h)[:, o]
                    lo_, hi_ = np.quantile(v, [0.05, 0.95])
                    fp.append(
                        {
                            "matriz": k,
                            "origem": ESTADOS[o],
                            "alvo": nome_alvo,
                            "h_anos": h,
                            "p": round(
                                float(
                                    primeira_passagem(
                                        normalizar(hier["alpha"][k]), alvo, h
                                    )[o]
                                ),
                                4,
                            ),
                            "ic90": [round(float(lo_), 4), round(float(hi_), 4)],
                        }
                    )
    tmp = {
        k: {
            ESTADOS[o]: round(
                float(tempo_medio_passagem(normalizar(hier["alpha"][k]), [0, 1])[o]), 1
            )
            for o in (2, 3)
        }
        for k in ("global", "america_latina", "brasil")
    }

    # estado atual (verificado no dado) e projeção
    ib = codes.index("BRA")
    s_atual = int(S[ib, ANO_FIM - anos[0]])
    traj = trajetoria_brasil(S, codes, anos)
    desde = ANO_FIM
    for a, v in reversed(traj):
        if v != s_atual:
            break
        desde = a
    proj = _fan_proj(draws["brasil"], s_atual, ANO_FIM)
    proj.update(
        {
            "estado_inicial": {
                "ano": ANO_FIM,
                "estado": s_atual,
                "rotulo": ESTADOS[s_atual],
                "no_estado_desde": desde,
                "fonte": "V-Dem v16 / Regimes of the World via OWID (verificado no dado baixado; 2026 ainda não existe na fonte)",
            },
            "matriz_usada": "brasil (encolhida AL/mundo)",
            "o_que_mostram_p10_p90": "incerteza sobre os PARÂMETROS da matriz (posterior), não a chance de choques fora do modelo",
        }
    )
    alt = {
        "global": _fan_proj(draws["global"], s_atual, ANO_FIM),
        "america_latina": _fan_proj(draws["america_latina"], s_atual, ANO_FIM),
        "global_so_1990_2024": _fan_proj(
            amostrar_P(contar(S, anos, 1990, ANO_FIM).sum(0) + 0.5, 1500, rng),
            s_atual,
            ANO_FIM,
        ),
    }
    sp = espells(S, anos)
    semi = _semi_markov_brasil(
        S, anos, sp, codes, ANO_FIM - desde + 1, 40 if rapido else 150
    )

    cn = np.array(sorted(set(cont.values())))
    gi = np.array([list(cn).index(cont[c]) for c in codes])
    nulo = calibrar_nulo(
        S, anos, normalizar(hier["alpha"]["global"]), gi, R=10 if rapido else 100
    )
    dur_t = testes_duracao(sp, codes)
    dur_t["semi_markov_vs_markov_fora_da_amostra"] = _teste_semimarkov_ooS(S, anos, sp)
    dur_t["leitura"] = (
        "Rejeita-se o tempo de permanência geométrico (LRT contra Weibull discreta, calibrado pelo nulo simulado): "
        "para autocracias o risco de sair cai fortemente com a idade do regime (beta ~ 0,6). Para a democracia "
        "eleitoral o risco cai até ~16 anos e a faixa 32+ volta a subir (poucas saídas): NÃO é monótono. "
        "O semi-Markov (risco por faixa de idade) vence o Markov fora da amostra, mas, para o Brasil (idade 39), "
        "projeta risco igual ou MAIOR que o Markov global — a persistência de regimes antigos não é garantia."
    )
    heter = _heterogeneidade(S, anos, codes, cont, hier)
    ordem = lrt_ordem2(contagens3(S, anos, ANO_MIN_EST, ANO_FIM))
    ordem["fora_da_amostra_leave_country_out"] = _teste_ordem2_ooS(S, anos)
    ordem["leitura"] = (
        "A ordem 2 melhora a verossimilhança e a previsão fora da amostra (ganho pequeno por transição): "
        "o estado anterior carrega informação — outra face da dependência de duração."
    )
    val = validar_fora_da_amostra(S, anos, codes, cont, hier)
    val["controle_sintetico_global"] = controle_sintetico(
        S, anos, normalizar(hier["alpha"]["global"]), R=15 if rapido else 100
    )
    val["controle_sintetico_tamanho_brasil"] = {
        "verdade=P_AL, prior=P_AL (prior certo)": controle_tamanho_brasil(
            normalizar(hier["alpha"]["america_latina"]),
            normalizar(hier["alpha"]["america_latina"]),
            hier["kappa"]["brasil"],
            n_passos=ANO_FIM - ANO_BRASIL + 1,
            R=60 if rapido else 300,
        ),
        "verdade=P_AL, prior=P_global (prior errado)": controle_tamanho_brasil(
            normalizar(hier["alpha"]["america_latina"]),
            normalizar(hier["alpha"]["global"]),
            hier["kappa"]["brasil"],
            n_passos=ANO_FIM - ANO_BRASIL + 1,
            R=60 if rapido else 300,
        ),
    }
    return {
        "estados": ESTADOS,
        "definicao_estados": "Regimes of the World (Lührmann et al. 2018, V-Dem): 0 autocracia fechada, 1 autocracia eleitoral, 2 democracia eleitoral, 3 democracia liberal",
        "matrizes": mats,
        "estacionaria": estac,
        "duracao_esperada": dur,
        "primeira_passagem": fp,
        "tempo_medio_ate_autocracia_anos": tmp,
        "projecao_brasil": proj,
        "projecao_brasil_alternativas": alt,
        "semi_markov_brasil": semi,
        "trajetoria_brasil": traj,
        "brasil_por_periodo_historia": brasil_por_periodo(traj, historia),
        "testes_pressuposto": {
            "duracao": dur_t,
            "ordem_2_vs_1": ordem,
            "heterogeneidade": heter,
            "nulo_calibrado": nulo,
        },
        "validacao": val,
        "_interno": {"hier": hier},
    }


# --------------------------------------------------------------------------------------------
# (2) Regimes econômicos: cadeia discretizada + HMM gaussiano (Baum-Welch em NumPy)
# --------------------------------------------------------------------------------------------

CORTES_INFL = [
    8.0,
    30.0,
    300.0,
]  # % a.a.: baixa < 8 <= moderada < 30 <= alta < 300 <= hiperinflação
ROT_INFL = [
    "baixa (<8%)",
    "moderada (8-30%)",
    "alta (30-300%)",
    "hiperinflação (>=300%)",
]
CORTES_PIB = [0.0, 2.5, 5.0]  # % a.a.: recessão < 0 <= baixo < 2,5 <= médio < 5 <= alto
ROT_PIB = ["recessão (<0%)", "baixo (0-2,5%)", "médio (2,5-5%)", "alto (>=5%)"]
KAPPA_ECON = 4.0  # força do prior (em transições) em torno da frequência marginal
H_ECON = (1, 3, 5)


def carregar_serie(sid: str, caminho: Path | None = None) -> pd.Series:
    d = json.loads((caminho or SERIES).read_text(encoding="utf-8"))
    s = next(x for x in d["series"] if x["id"] == sid)
    return pd.Series({int(a): float(v) for a, v in s["pontos"]}).sort_index()


def discretizar(x: np.ndarray, cortes: list[float]) -> np.ndarray:
    return np.digitize(x, cortes).astype(int)


def contar_seq(z: np.ndarray, k: int = K) -> np.ndarray:
    C = np.zeros((k, k))
    np.add.at(C, (z[:-1], z[1:]), 1.0)
    return C


def cadeia_econ_alpha(z: np.ndarray, kappa: float = KAPPA_ECON) -> np.ndarray:
    marg = (np.bincount(z, minlength=K) + 0.5) / (len(z) + 0.5 * K)
    return kappa * marg[None, :] + contar_seq(z)


# ---- HMM gaussiano ----


def _emis(y: np.ndarray, mu: np.ndarray, sd: np.ndarray) -> np.ndarray:
    return np.maximum(stats.norm.pdf(y[:, None], mu[None], sd[None]), 1e-300)


def hmm_filtrar(
    y: np.ndarray, A: np.ndarray, mu: np.ndarray, sd: np.ndarray, pi0: np.ndarray
):
    """Forward escalado: filtros alpha_t(k)=P(s_t=k | y_1..t) e log-verossimilhança."""
    B = _emis(y, mu, sd)
    T, k = B.shape
    al = np.empty((T, k))
    c = np.empty(T)
    a = pi0 * B[0]
    c[0] = a.sum()
    al[0] = a / c[0]
    for t in range(1, T):
        a = (al[t - 1] @ A) * B[t]
        c[t] = a.sum()
        al[t] = a / c[t]
    return al, float(np.log(c).sum()), c, B


def _em_passo(y, A, mu, sd, pi0):
    al, ll, c, B = hmm_filtrar(y, A, mu, sd, pi0)
    T, k = B.shape
    be = np.ones((T, k))
    for t in range(T - 2, -1, -1):
        be[t] = (A @ (B[t + 1] * be[t + 1])) / c[t + 1]
    gam = al * be
    gam /= gam.sum(1, keepdims=True)
    M = al[:-1, :, None] * A[None] * (B[1:] * be[1:])[:, None, :]
    M /= M.sum((1, 2), keepdims=True)
    xi = M.sum(0)
    return gam, xi, ll


def hmm_ajustar(
    y: np.ndarray,
    k: int,
    n_init: int = 4,
    iters: int = 300,
    seed: int = 0,
    inicio: dict | None = None,
    tol: float = 1e-7,
) -> dict:
    """Baum-Welch (EM) para HMM gaussiano univariado; pi0 = estacionária de A; médias ordenadas."""
    rng = np.random.default_rng(seed)
    y = np.asarray(y, float)
    piso = max(0.1 * y.std(), 1e-3)
    best = None
    inits = []
    if inicio is not None:
        inits.append((inicio["A"].copy(), inicio["mu"].copy(), inicio["sd"].copy()))
    for _ in range(n_init):
        q = (
            np.sort(rng.choice(y, size=k, replace=False))
            if k > 1
            else np.array([y.mean()])
        )
        A0 = np.full((k, k), 0.2 / max(k - 1, 1))
        np.fill_diagonal(A0, 0.8 if k > 1 else 1.0)
        inits.append((A0, q + rng.normal(0, 0.1 * y.std(), k), np.full(k, y.std())))
    for A, mu, sd in inits:
        prev = -np.inf
        ll = -np.inf
        for _ in range(iters):
            pi0 = estacionaria(A) if k > 1 else np.ones(1)
            gam, xi, ll = _em_passo(y, A, mu, sd, pi0)
            A = xi / np.maximum(xi.sum(1, keepdims=True), 1e-12)
            A = 0.999 * A + 0.001 / k  # evita linhas degeneradas
            w = gam.sum(0)
            mu = (gam * y[:, None]).sum(0) / np.maximum(w, 1e-9)
            sd = np.sqrt((gam * (y[:, None] - mu) ** 2).sum(0) / np.maximum(w, 1e-9))
            sd = np.maximum(sd, piso)
            if abs(ll - prev) < tol:
                break
            prev = ll
        if best is None or ll > best["ll"]:
            best = {"A": A, "mu": mu, "sd": sd, "ll": float(ll)}
    o = np.argsort(best["mu"])
    best = {
        "A": best["A"][np.ix_(o, o)],
        "mu": best["mu"][o],
        "sd": best["sd"][o],
        "ll": best["ll"],
        "k": k,
    }
    best["pi0"] = estacionaria(best["A"]) if k > 1 else np.ones(1)
    best["n_par"] = 2 * k + k * (k - 1)
    best["bic"] = float(-2 * best["ll"] + best["n_par"] * math.log(len(y)))
    return best


def hmm_simular(
    A: np.ndarray, mu: np.ndarray, sd: np.ndarray, T: int, rng: np.random.Generator
) -> tuple[np.ndarray, np.ndarray]:
    k = len(mu)
    pi0 = estacionaria(A) if k > 1 else np.ones(1)
    s = np.empty(T, int)
    s[0] = rng.choice(k, p=pi0)
    for t in range(1, T):
        s[t] = rng.choice(k, p=A[s[t - 1]])
    return s, rng.normal(mu[s], sd[s])


def hmm_classe_por_estado(mu, sd, cortes_y: np.ndarray) -> np.ndarray:
    """P(classe | estado oculto): massa gaussiana em cada faixa de `cortes_y` (K classes)."""
    e = np.concatenate([[-np.inf], cortes_y, [np.inf]])
    cdf = stats.norm.cdf((e[None, :] - mu[:, None]) / sd[:, None])
    return np.diff(cdf, axis=1)


def hmm_previsao_classes(
    y: np.ndarray, fit: dict, cortes_y: np.ndarray, hs: list[int]
) -> np.ndarray:
    """P(classe em t+h | y_1..t) para cada h em hs, filtrando com os parâmetros de `fit`."""
    al, *_ = hmm_filtrar(y, fit["A"], fit["mu"], fit["sd"], fit["pi0"])
    pi = al[-1]
    Bk = hmm_classe_por_estado(fit["mu"], fit["sd"], cortes_y)
    out = []
    hmax = max(hs)
    cur = pi
    pis = {}
    for h in range(1, hmax + 1):
        cur = cur @ fit["A"]
        pis[h] = cur
    return np.array([pis[h] @ Bk for h in hs])


def _piso(p: np.ndarray, eps: float = 1e-3) -> np.ndarray:
    p = np.maximum(p, eps)
    return p / p.sum()


def avaliar_economia(
    x: np.ndarray,
    anos: np.ndarray,
    cortes: list[float],
    transf,
    k_hmm: int,
    blocos: list[tuple[int, int]],
    t_min: int,
    refit_cada: int = 5,
) -> dict:
    """Origem móvel (expanding window): treina com anos <= t0 e prevê a classe em t0+h (h=1,3,5).

    Modelos: cadeia (prior em torno da marginal), climatologia, persistência calibrada, HMM.
    Retorna log-loss e Brier por bloco de origens e no pool, com o nº de previsões.
    """
    z = discretizar(x, cortes)
    y = transf(x)
    cortes_y = transf(np.array(cortes))
    T = len(x)
    regs = []
    fit = None
    for t0 in range(t_min - 1, T - 1):
        zt = z[: t0 + 1]
        if fit is None or (t0 - (t_min - 1)) % refit_cada == 0:
            fit = hmm_ajustar(y[: t0 + 1], k_hmm, n_init=3, seed=t0, inicio=fit)
        P = normalizar(cadeia_econ_alpha(zt))
        marg = (np.bincount(zt, minlength=K) + 0.5) / (len(zt) + 0.5 * K)
        ph = hmm_previsao_classes(y[: t0 + 1], fit, cortes_y, list(H_ECON))
        for ih, h in enumerate(H_ECON):
            if t0 + h >= T:
                continue
            pares = (zt[:-h], zt[h:]) if len(zt) > h else (zt[:0], zt[:0])
            stay = ((pares[0] == pares[1]).sum() + 1) / (len(pares[0]) + 2)
            outros = np.delete(marg, zt[-1])
            pc = np.insert((1 - stay) * outros / outros.sum(), zt[-1], stay)
            preds = {
                "cadeia": np.linalg.matrix_power(P, h)[zt[-1]],
                "climatologia": marg,
                "persist_calibrada": pc,
                "hmm": ph[ih],
            }
            obs = z[t0 + h]
            for m, p in preds.items():
                p = _piso(p)
                regs.append(
                    {
                        "origem": int(anos[t0]),
                        "h": h,
                        "modelo": m,
                        "ll": float(np.log(p[obs])),
                        "br": float(((p - np.eye(K)[obs]) ** 2).sum()),
                    }
                )
    df = pd.DataFrame(regs)
    out = {}
    for h in H_ECON:
        d = df[df.h == h]
        item = {"pool": {}, "blocos": {}}
        for m, g in d.groupby("modelo"):
            item["pool"][m] = {
                "logloss": float(-g.ll.mean()),
                "brier": float(g.br.mean()),
                "n": len(g),
            }
        for a, b in blocos:
            dd = d[(d.origem >= a) & (d.origem <= b)]
            if len(dd) == 0:
                continue
            item["blocos"][f"{a}-{b}"] = {
                m: {
                    "logloss": float(-g.ll.mean()),
                    "brier": float(g.br.mean()),
                    "n": len(g),
                }
                for m, g in dd.groupby("modelo")
            }
        # nº de blocos em que cada modelo ganha da persistência calibrada (regra: >= 3 splits)
        vitorias = {}
        for m in ("cadeia", "hmm", "climatologia"):
            v = 0
            tot = 0
            for blk in item["blocos"].values():
                if m in blk and "persist_calibrada" in blk:
                    tot += 1
                    v += blk[m]["logloss"] < blk["persist_calibrada"]["logloss"]
            vitorias[m] = {
                "blocos_em_que_vence_persistencia": int(v),
                "blocos": int(tot),
            }
        item["vitorias_sobre_persistencia"] = vitorias
        # piso de ruído: SE do log-loss pareado (cadeia - persistência) por bloco de origens
        d_ll = {}
        for m in ("cadeia", "hmm"):
            a_ = d[d.modelo == m].set_index("origem").ll
            b_ = d[d.modelo == "persist_calibrada"].set_index("origem").ll
            dif = (
                a_ - b_
            ).dropna()  # >0: m melhor que a persistência (log-score maior)
            n_ef = max(
                len(dif) / max(h, 1), 1
            )  # previsões sobrepostas: ~ n/h independentes
            d_ll[m] = {
                "ganho_logloss_vs_persistencia": float(dif.mean()),
                "ep_aprox": float(dif.std() / math.sqrt(n_ef)),
            }
        item["ganho_vs_persistencia"] = d_ll
        out[f"h{h}"] = item
    return out


def hmm_controle_sintetico(R: int = 30, seed: int = SEED + 8) -> dict:
    """HMM de parâmetros conhecidos: recuperação (médias, DPs, A), acurácia de decodificação vs oráculo e BIC."""
    rng = np.random.default_rng(seed)
    A = np.array([[0.85, 0.15], [0.20, 0.80]])
    mu = np.array([-1.0, 4.0])
    sd = np.array([2.5, 1.5])
    out = {
        "verdade": {"A": A.tolist(), "mu": mu.tolist(), "sd": sd.tolist()},
        "por_T": {},
    }
    for T in (125, 500):
        errs, acc, acc_or, k_bic = [], [], [], []
        for r in range(R):
            s, y = hmm_simular(A, mu, sd, T, rng)
            fit = hmm_ajustar(y, 2, n_init=4, seed=r)
            errs.append(
                np.r_[
                    fit["mu"] - mu,
                    fit["sd"] - sd,
                    np.diag(fit["A"]) - np.diag(A),
                ]
            )
            al, *_ = hmm_filtrar(y, fit["A"], fit["mu"], fit["sd"], fit["pi0"])
            alo, *_ = hmm_filtrar(y, A, mu, sd, estacionaria(A))
            acc.append(float((al.argmax(1) == s).mean()))
            acc_or.append(float((alo.argmax(1) == s).mean()))
            bics = {k: hmm_ajustar(y, k, n_init=3, seed=r)["bic"] for k in (1, 2, 3)}
            k_bic.append(min(bics, key=bics.get))
        e = np.array(errs)
        out["por_T"][str(T)] = {
            "R": R,
            "vies_medio": dict(
                zip(
                    ["mu0", "mu1", "sd0", "sd1", "A00", "A11"],
                    e.mean(0).round(3).tolist(),
                    strict=True,
                )
            ),
            "erro_absoluto_medio": dict(
                zip(
                    ["mu0", "mu1", "sd0", "sd1", "A00", "A11"],
                    np.abs(e).mean(0).round(3).tolist(),
                    strict=True,
                )
            ),
            "acuracia_decodificacao_filtro_estimado": float(np.mean(acc)),
            "acuracia_decodificacao_filtro_oraculo": float(np.mean(acc_or)),
            "frac_BIC_escolhe_k2": float(np.mean(np.array(k_bic) == 2)),
        }
    return out


def _projecao_hmm(y, fit, cortes_y, anos_h, B, rng) -> dict:
    """Distribuição de classes em 2027-2038 pelo HMM, com bootstrap paramétrico (reajuste a cada réplica)."""
    ph = hmm_previsao_classes(y, fit, cortes_y, anos_h)
    reps = []
    for _ in range(B):
        _, ys = hmm_simular(fit["A"], fit["mu"], fit["sd"], len(y), rng)
        f = hmm_ajustar(
            ys,
            fit["k"],
            n_init=1,
            iters=120,
            seed=int(rng.integers(1 << 30)),
            inicio=fit,
        )
        reps.append(hmm_previsao_classes(y, f, cortes_y, anos_h))
    reps = np.array(reps)
    al, *_ = hmm_filtrar(y, fit["A"], fit["mu"], fit["sd"], fit["pi0"])
    return {
        "estado_oculto_atual_filtrado": _r(al[-1], 3),
        "ponto": _r(ph, 4),
        "p10": _r(np.quantile(reps, 0.1, 0), 4),
        "p50": _r(np.quantile(reps, 0.5, 0), 4),
        "p90": _r(np.quantile(reps, 0.9, 0), 4),
        "B_bootstrap": B,
    }


def _um_regime_econ(
    nome: str,
    x: pd.Series,
    cortes: list[float],
    rotulos: list[str],
    transf,
    k_hmm_max: int,
    blocos: list[tuple[int, int]],
    t_min: int,
    rapido: bool,
) -> dict:
    rng = np.random.default_rng(SEED + 9)
    anos = x.index.to_numpy()
    xv = x.to_numpy()
    z = discretizar(xv, cortes)
    y = transf(xv)
    cortes_y = transf(np.array(cortes))
    alpha = cadeia_econ_alpha(z)
    P = normalizar(alpha)
    draws = amostrar_P(alpha, 3000, rng)
    lo, hi = _ic(draws)
    pi = estacionaria(draws)
    plo, phi = _ic(pi)
    dlo, dhi = _ic(duracao_esperada(draws))
    # HMM: k por BIC
    fits = {
        k: hmm_ajustar(y, k, n_init=4 if not rapido else 2, seed=1)
        for k in range(1, k_hmm_max + 1)
    }
    k_bic = min(fits, key=lambda k: fits[k]["bic"])
    k_uso = max(k_bic, 2)  # k=1 não é um modelo de regimes: avalia-se ao menos 2
    fit = fits[k_uso]
    # projeção condicionada ao estado atual (último ano da série)
    ano_fim = int(anos[-1])
    s0 = int(z[-1])
    hs = [a - ano_fim for a in ANOS_PROJ]
    pr = np.array([_matpow(draws, h)[:, s0, :] for h in hs])  # (anos, n, K)
    proj_cadeia = {
        "p10": _r(np.quantile(pr, 0.1, 1), 4),
        "p50": _r(np.quantile(pr, 0.5, 1), 4),
        "p90": _r(np.quantile(pr, 0.9, 1), 4),
        "media_preditiva": _r(pr.mean(1), 4),
    }
    av = avaliar_economia(
        xv,
        anos,
        cortes,
        transf,
        k_uso,
        blocos,
        t_min,
        refit_cada=5 if not rapido else 10,
    )
    return {
        "serie": nome,
        "anos": [int(anos[0]), ano_fim],
        "n": len(x),
        "estados": rotulos,
        "cortes": cortes,
        "contagem_por_estado": np.bincount(z, minlength=K).tolist(),
        "estado_atual": {
            "ano": ano_fim,
            "valor": float(xv[-1]),
            "estado": s0,
            "rotulo": rotulos[s0],
        },
        "cadeia": {
            "P": _r(P),
            "ic90": {"lo": _r(lo), "hi": _r(hi)},
            "contagens": contar_seq(z).astype(int).tolist(),
            "prior": f"Dirichlet({KAPPA_ECON:g} x frequência marginal + contagens)",
            "estacionaria": {
                "media": _r(estacionaria(P), 4),
                "ic90": {"lo": _r(plo, 4), "hi": _r(phi, 4)},
            },
            "duracao_esperada_anos": {
                rotulos[i]: {
                    "anos": round(float(duracao_esperada(P)[i]), 1),
                    "ic90": [round(float(dlo[i]), 1), round(float(dhi[i]), 1)],
                }
                for i in range(K)
            },
        },
        "hmm": {
            "k_escolhido_por_BIC": int(k_bic),
            "k_usado": int(k_uso),
            "bic_por_k": {str(k): round(f["bic"], 1) for k, f in fits.items()},
            "parametros": {
                "mu": _r(fit["mu"], 3),
                "sd": _r(fit["sd"], 3),
                "A": _r(fit["A"], 4),
                "escala_y": "ln(1+IGP-DI/100)"
                if nome.startswith("inflacao")
                else "% a.a. de crescimento real",
            },
        },
        "projecao_2027_2038": {
            "anos": ANOS_PROJ,
            "condicionada_ao_estado": rotulos[s0],
            "cadeia": proj_cadeia,
            "hmm": _projecao_hmm(y, fit, cortes_y, hs, 8 if rapido else 30, rng),
        },
        "validacao_fora_da_amostra": av,
    }


def regimes_economicos(
    rapido: bool = False, caminho_series: Path | None = None
) -> dict:
    ig = carregar_serie("igp_di", caminho_series)
    ipca = carregar_serie("ipca", caminho_series)
    pib = carregar_serie("pib_var_real_ibge", caminho_series)
    infl = _um_regime_econ(
        "inflacao_igp_di",
        ig,
        CORTES_INFL,
        ROT_INFL,
        lambda v: np.log1p(np.asarray(v) / 100.0),
        3,
        [(1960, 1979), (1980, 1999), (2000, 2024)],
        15,
        rapido,
    )
    cres = _um_regime_econ(
        "crescimento_pib_real",
        pib,
        CORTES_PIB,
        ROT_PIB,
        lambda v: np.asarray(v, float),
        3,
        [(1940, 1959), (1960, 1979), (1980, 1999), (2000, 2024)],
        40,
        rapido,
    )
    # checagem cruzada: IPCA (1980-2025) discretizado com os mesmos cortes vs IGP-DI nos mesmos anos
    comuns = ipca.index.intersection(ig.index)
    zi, zg = (
        discretizar(ipca[comuns].to_numpy(), CORTES_INFL),
        discretizar(ig[comuns].to_numpy(), CORTES_INFL),
    )
    infl["checagem_cruzada_ipca"] = {
        "anos": [int(comuns.min()), int(comuns.max())],
        "concordancia_de_classe": float((zi == zg).mean()),
        "estado_atual_ipca_2025": ROT_INFL[
            int(discretizar(np.array([ipca.iloc[-1]]), CORTES_INFL)[0])
        ],
        "nota": "IPCA tem quebra em 1994 (Plano Real; ordens de grandeza diferentes antes), mas as classes de inflação são robustas a isso.",
    }
    return {
        "inflacao": infl,
        "crescimento": cres,
        "controles_sinteticos": {
            "hmm_parametros_conhecidos": hmm_controle_sintetico(R=8 if rapido else 30),
        },
        "regras": {
            "estado_inicial": "último ano observado das séries (IGP-DI, PIB real do IBGE) — verificado no dado",
            "limite": "2 cadeias independentes (inflação e crescimento): não captura a relação entre elas nem choques externos (preço de commodities, juros globais, pandemia).",
        },
    }


# --------------------------------------------------------------------------------------------
# (3) Cadeia de cenários (liga ao modelo macro de scenarios.py)
# --------------------------------------------------------------------------------------------

CICLOS = [2026, 2030, 2034, 2038]
CEN = [s.key for s in scenarios.SCENARIOS]  # lula, pragmatico, hegemonia, extremo
VARS = ("debt", "selic", "ipca", "gdp")
N_MACRO = 2000
# Parâmetros JULGADOS da matriz (rótulo: julgamento). Os ANCORADOS são eps e rho (ver `ancoras`).
JULGADO = {
    "stay_lula": 0.40,  # P(governo de esquerda continua no ciclo seguinte)
    "alt": 0.40,  # P(esquerda volta num ciclo seguinte a governo de direita com eleições livres)
    "drift_pragmatico": {"pragmatico": 0.70, "hegemonia": 0.25, "extremo": 0.05},
    "capture": 0.50,  # captura de instituições reduz a alternância pela metade
    "m_erosao": 2.0,  # multiplicador da taxa empírica de erosão para um país JÁ em 'hegemonia'
    "pesos_direita": dict(
        scenarios.WEIGHTS_IF_FLAVIO
    ),  # reuso (julgamento de scenarios.py)
    "recup_para": {"lula": 0.4, "pragmatico": 0.3, "hegemonia": 0.3},
    "heg_modera": 0.15,
}


def ancoras(P: np.ndarray, h: int = 4) -> dict:
    """Taxas empíricas por ciclo eleitoral (h=4 anos) a partir de uma matriz anual.

    eps: P(democracia eleitoral -> alguma autocracia em até 4 anos). rho: P(autocracia eleitoral -> democracia em até 4 anos).
    """
    eps = float(primeira_passagem(P, [0, 1], h)[2])
    rho = float(primeira_passagem(P, [2, 3], h)[1])
    return {"eps": eps, "rho": rho, "h_anos": h}


def matriz_julgada(
    eps: float,
    rho: float,
    j: dict | None = None,
    **over,
) -> np.ndarray:
    """Matriz 4x4 (lula, pragmatico, hegemonia, extremo) por ciclo eleitoral. JULGAMENTO ancorado em eps/rho."""
    j = {**(j or JULGADO), **over}
    wd = j["pesos_direita"]
    sL = j["stay_lula"]
    M = np.zeros((4, 4))
    M[0] = [
        sL,
        (1 - sL) * wd["pragmatico"],
        (1 - sL) * wd["hegemonia"],
        (1 - sL) * wd["extremo"],
    ]
    d = j["drift_pragmatico"]
    a = j["alt"]
    M[1] = [
        a,
        (1 - a) * d["pragmatico"],
        (1 - a) * d["hegemonia"],
        (1 - a) * d["extremo"],
    ]
    e_h = min(1.0, j["m_erosao"] * eps)
    lula_h = a * (1 - j["capture"]) * (1 - e_h)
    prag_h = j["heg_modera"] * (1 - e_h - lula_h)
    M[2] = [lula_h, prag_h, 1 - e_h - lula_h - prag_h, e_h]
    r = j["recup_para"]
    M[3] = [rho * r["lula"], rho * r["pragmatico"], rho * r["hegemonia"], 1 - rho]
    return M / M.sum(1, keepdims=True)


def ocupacao(M: np.ndarray, w0: np.ndarray, ciclos: int = len(CICLOS)) -> np.ndarray:
    """(ciclos, 4): distribuição por ciclo; a linha 0 é a de 2026 (resultado da eleição de 2026)."""
    out = [np.asarray(w0, float)]
    for _ in range(ciclos - 1):
        out.append(out[-1] @ M)
    return np.array(out)


def amostras_cenarios(
    seed: int = 7, n: int = N_MACRO, base: _data.MacroBase | None = None
) -> dict:
    """Mesmas amostras de `scenarios.run` (mesma ordem de sorteios), mas devolvendo as trajetórias (n, T)."""
    from . import institutions

    rng = np.random.default_rng(seed)
    base = base or _data.load_macro_base()
    p_flavio = institutions.runoff_win_prob(rng)
    paths = {}
    for sc in scenarios.SCENARIOS:
        risk, _ = scenarios.effective_risk(sc, rng)
        lv = economy.Levers(
            **{
                **sc.levers.__dict__,
                "institutional_risk": max(sc.levers.institutional_risk, risk),
            }
        )
        params = economy.DEFAULT.with_(neutral_real=rng.uniform(3.5, 5.5, n))
        paths[sc.key] = economy.simulate(base, lv, rng, n, params)
    w = {
        "lula": 1 - p_flavio,
        **{k: p_flavio * v for k, v in scenarios.WEIGHTS_IF_FLAVIO.items()},
    }
    return {"paths": paths, "p_flavio": p_flavio, "w": w, "base": base}


class Mistura:
    """Quantis de uma mistura de cenários com pesos (por mandato) sobre amostras pré-ordenadas."""

    def __init__(self, paths: dict, n: int):
        self.n = n
        self.T = len(economy.YEARS)
        self._ord = {}
        for v in VARS:
            for t in range(self.T):
                vals = np.concatenate([paths[k][v][:, t] for k in CEN])
                lab = np.repeat(np.arange(len(CEN)), n)
                o = np.argsort(vals, kind="stable")
                self._ord[(v, t)] = (vals[o], lab[o])

    def pesos_ano(self, occ: np.ndarray, t: int) -> np.ndarray:
        """Mandato do ano t: 2027-30 -> ciclo 2026; 2031-34 -> 2030; 2035-38 -> 2034."""
        return occ[min(t // 4, len(occ) - 1)]

    def quantis(
        self, occ: np.ndarray, v: str, t: int, qs=(0.1, 0.5, 0.9)
    ) -> list[float]:
        vals, lab = self._ord[(v, t)]
        w = self.pesos_ano(occ, t)[lab] / self.n
        cum = np.cumsum(w)
        return [
            float(vals[min(np.searchsorted(cum, q * cum[-1]), len(vals) - 1)])
            for q in qs
        ]

    def frac_acima(self, occ: np.ndarray, v: str, t: int, lim: float) -> float:
        vals, lab = self._ord[(v, t)]
        w = self.pesos_ano(occ, t)[lab] / self.n
        return float(w[vals > lim].sum() / w.sum())

    def media(self, occ: np.ndarray, v: str, t: int) -> float:
        vals, lab = self._ord[(v, t)]
        return float((vals * self.pesos_ano(occ, t)[lab]).sum() / self.n)


def ruptura(paths: dict) -> dict:
    """Tempo até ruptura de regime (dívida/PIB > BREAK_DEBT), por cenário, usando as trajetórias existentes."""
    out = {}
    anos = economy.YEARS
    H = len(anos)
    for k in CEN:
        d = paths[k]["debt"]
        acima = d > scenarios.BREAK_DEBT
        ja = np.maximum.accumulate(acima, axis=1)
        F = ja.mean(0)  # P(ruptura até o ano t)
        tem = acima.any(1)
        primeiro = np.where(tem, acima.argmax(1), H)
        t_anos = np.where(tem, anos[np.minimum(primeiro, H - 1)] - 2026, np.nan)
        T_trunc = np.where(
            tem, anos[np.minimum(primeiro, H - 1)] - 2026, H + 1
        )  # censura: H+1 anos
        out[k] = {
            "p_ruptura_ate_2038": float(tem.mean()),
            "p_acumulada_por_ano": {
                int(a): round(float(f), 4) for a, f in zip(anos, F, strict=True)
            },
            "tempo_esperado_restrito_anos": round(
                float(np.minimum(T_trunc, H + 1).mean()), 2
            ),
            "tempo_medio_dado_ruptura_anos": (
                round(float(np.nanmean(t_anos)), 2) if tem.any() else None
            ),
            "primeiro_ano_com_p_acumulada_maior_50pct": next(
                (int(a) for a, f in zip(anos, F, strict=True) if f > 0.5), None
            ),
            "nota_censura": f"tempo contado em anos desde 2026; sem ruptura até 2038 vale {H + 1} (censura), "
            "então o 'esperado restrito' é um limite inferior do tempo esperado verdadeiro",
        }
    return out


def ruptura_cadeia(rup: dict, occ: np.ndarray) -> dict:
    anos = economy.YEARS
    F = []
    for t, a in enumerate(anos):
        w = occ[min(t // 4, len(occ) - 1)]
        F.append(
            sum(w[i] * rup[k]["p_acumulada_por_ano"][int(a)] for i, k in enumerate(CEN))
        )
    F = np.array(F)
    tempo = float(
        sum(1.0 - f for f in np.r_[0.0, F[:-1]])
    )  # E[min(T, H)] pela soma da sobrevivência
    return {
        "p_acumulada_por_ano": {
            int(a): round(float(f), 4) for a, f in zip(anos, F, strict=True)
        },
        "p_ruptura_ate_2038": round(float(F[-1]), 4),
        "tempo_esperado_restrito_anos": round(tempo, 2),
        "aproximacao": "mistura de seções transversais: cada ano usa os pesos do mandato; "
        "ignora a dívida herdada na troca de cenário (sem dependência de trajetória)",
    }


VARIANTES = {
    "julgada (referência)": {},
    "sem erosão (m=0, nada acelera)": {"m_erosao": 0.0},
    "erosão 4x a taxa empírica": {"m_erosao": 4.0},
    "catraca forte: erosão 6x e recuperação nula": {"m_erosao": 6.0, "rho_scale": 0.0},
    "esquerda persistente (continua 70%)": {"stay_lula": 0.70},
    "direita persistente (esquerda volta 15%)": {"alt": 0.15},
    "sem memória (cada ciclo sorteia como em 2026)": {"iid": True},
}


def _M_variante(anc: dict, over: dict, w0: np.ndarray) -> np.ndarray:
    over = dict(over)
    if over.pop("iid", False):
        return np.tile(w0, (4, 1))
    rho = anc["rho"] * over.pop("rho_scale", 1.0)
    return matriz_julgada(anc["eps"], rho, **over)


def cadeia_cenarios(
    P_ancora: np.ndarray, am: dict, rapido: bool = False, nome_ancora: str = "brasil"
) -> dict:
    rng = np.random.default_rng(SEED + 10)
    paths, w = am["paths"], am["w"]
    w0 = np.array([w[k] for k in CEN])
    anc = ancoras(P_ancora)
    M = matriz_julgada(anc["eps"], anc["rho"])
    occ = ocupacao(M, w0)
    mist = Mistura(paths, paths["lula"]["debt"].shape[0])
    T = len(economy.YEARS)
    anos = [int(a) for a in economy.YEARS]

    def macro(occ_):
        res = {}
        for v in VARS:
            q = np.array([mist.quantis(occ_, v, t) for t in range(T)])
            res[v] = {
                "anos": anos,
                "p10": _r(q[:, 0], 2),
                "p50": _r(q[:, 1], 2),
                "p90": _r(q[:, 2], 2),
                "media": _r([mist.media(occ_, v, t) for t in range(T)], 2),
            }
            if v == "debt":
                res[v]["fracao_acima_de_120_por_ano"] = _r(
                    [
                        mist.frac_acima(occ_, v, t, scenarios.BREAK_DEBT)
                        for t in range(T)
                    ],
                    4,
                )
                res[v]["aviso"] = (
                    "valores acima de 120% do PIB indicam RUPTURA de regime (scenarios.BREAK_DEBT), não trajetória a extrapolar; "
                    "leia a fração acima do limite, não a mediana"
                )
        return res

    occ_estatica = np.tile(w0, (len(CICLOS), 1))
    rup = ruptura(paths)

    # (a) Dirichlet em torno da matriz julgada
    sens: dict = {"dirichlet": {}}
    nd = 300 if rapido else 1500
    for conc in (30, 100):
        occs = []
        for _ in range(nd):
            Md = np.vstack([rng.dirichlet(conc * M[i] + 1e-3) for i in range(4)])
            occs.append(ocupacao(Md, w0))
        occs = np.array(occs)  # (nd, ciclos, 4)
        q10, q50, q90 = (np.quantile(occs, q, 0) for q in (0.1, 0.5, 0.9))
        erosao = occs[:, :, 2] + occs[:, :, 3]
        # efeito na dívida 2038 (mediana da mistura) por amostras de matrizes
        med_d = []
        for o in occs[: min(nd, 300)]:
            med_d.append(mist.quantis(o, "debt", T - 1, (0.5,))[0])
        sens["dirichlet"][f"concentracao_{conc}"] = {
            "n_matrizes": nd,
            "ocupacao_p10": _r(q10, 4),
            "ocupacao_p50": _r(q50, 4),
            "ocupacao_p90": _r(q90, 4),
            "hegemonia_mais_extremo_p10_p50_p90": [
                _r(np.quantile(erosao, q, 0), 4) for q in (0.1, 0.5, 0.9)
            ],
            "divida_2038_mediana_da_mistura_p10_p50_p90": [
                round(float(np.quantile(med_d, q)), 2) for q in (0.1, 0.5, 0.9)
            ],
        }
    # (b) varredura de dois parâmetros: m_erosao x alt
    ms, als = (0.0, 0.5, 1.0, 2.0, 4.0, 6.0), (0.15, 0.25, 0.40, 0.55, 0.70)
    grade = []
    for m in ms:
        for a in als:
            Mg = matriz_julgada(anc["eps"], anc["rho"], m_erosao=m, alt=a)
            o = ocupacao(Mg, w0)
            grade.append(
                {
                    "m_erosao": m,
                    "alt": a,
                    "hegemonia_mais_extremo_2034": round(float(o[2, 2] + o[2, 3]), 4),
                    "hegemonia_mais_extremo_2038": round(float(o[3, 2] + o[3, 3]), 4),
                    "divida_2038_p50": round(
                        mist.quantis(o, "debt", T - 1, (0.5,))[0], 2
                    ),
                    "p_ruptura_ate_2038": ruptura_cadeia(rup, o)["p_ruptura_ate_2038"],
                }
            )
    sens["varredura_m_erosao_x_alt"] = {
        "m_erosao": list(ms),
        "alt": list(als),
        "celulas": grade,
    }
    # (c) variantes nomeadas: o que muda se a matriz muda
    var = {}
    for nome, over in VARIANTES.items():
        Mv = _M_variante(anc, over, w0)
        o = ocupacao(Mv, w0)
        d = {
            "matriz": _r(Mv, 4),
            "ocupacao": _r(o, 4),
            "p_ruptura_ate_2038": ruptura_cadeia(rup, o)["p_ruptura_ate_2038"],
        }
        for v in VARS:
            d[f"{v}_2038_p10_p50_p90"] = [
                round(x, 2) for x in mist.quantis(o, v, T - 1)
            ]
        var[nome] = d
    sens["variantes"] = var
    # (d) amplitude: o efeito de TROCAR a matriz vs a incerteza dentro da própria mistura
    sens["leitura"] = (
        "A ocupação por ciclo é muito mais sensível às probabilidades de alternância/erosão do que a mistura macro, "
        "porque os cenários extremos já entram em 2026 com o peso de scenarios.py; compare `variantes`."
    )

    mix_run = {
        "pesos_estaticos_como_em_scenarios_run": {
            k: round(float(v), 4) for k, v in w.items()
        },
        "macro": macro(occ_estatica),
    }
    return {
        "ciclos": CICLOS,
        "cenarios": CEN,
        "rotulos": {s.key: s.label for s in scenarios.SCENARIOS},
        "matriz_julgada": _r(M, 4),
        "origem_da_matriz": (
            "JULGAMENTO rotulado, não estimativa. ANCORADA em duas taxas empíricas por ciclo de 4 anos "
            f"(matriz '{nome_ancora}' da seção regimes_politicos): eps = P(democracia eleitoral -> autocracia em até 4 anos) = "
            f"{anc['eps']:.3f}, usada (x m_erosao={JULGADO['m_erosao']}) como taxa hegemonia -> extremo; "
            f"rho = P(autocracia eleitoral -> democracia em até 4 anos) = {anc['rho']:.3f}, usada como a saída de 'extremo'. "
            "Parâmetros SÓ julgados (sem âncora empírica): permanência da esquerda, alternância, deriva do pragmático, "
            "efeito da captura institucional, e os pesos de direita reusados de scenarios.WEIGHTS_IF_FLAVIO (também julgamento). "
            "A distribuição inicial (2026) usa os pesos de scenarios.run (P de Flávio vencer é do simulador de 2º turno, "
            "eleição ainda em aberto em 25/10/2026)."
        ),
        "ancoras_empiricas": anc,
        "julgamentos": {k: v for k, v in JULGADO.items()},
        "distribuicao_inicial_2026": {k: round(float(w[k]), 4) for k in CEN},
        "nota_ciclos": "2026 = resultado da eleição de 2026 (governa 2027-30); 2030 governa 2031-34; 2034 governa 2035-38; "
        "2038 = resultado da eleição de 2038 (fora do horizonte macro, só ocupação).",
        "ocupacao": {
            "por_ciclo": {str(c): _r(occ[i], 4) for i, c in enumerate(CICLOS)},
            "cenarios": CEN,
            "estacionaria_da_matriz": _r(estacionaria(M), 4),
        },
        "macro_esperada": {
            "metodo": "mistura de seções transversais: em cada ano, as amostras de scenarios.run (n=2000 por cenário) "
            "ponderadas pela ocupação do mandato; NÃO há dependência de trajetória (a dívida herdada na troca de cenário "
            "é ignorada, o que suaviza o que seria uma transição real).",
            "cadeia": macro(occ),
            "estatica_scenarios_run": mix_run,
            "unidades": {
                "debt": "% PIB (bruta)",
                "selic": "% a.a.",
                "ipca": "%",
                "gdp": "% a.a.",
            },
        },
        "ruptura_regime_divida_acima_de_120": {
            "limiar_pct_pib": scenarios.BREAK_DEBT,
            "por_cenario": rup,
            "mistura_cadeia": ruptura_cadeia(rup, occ),
        },
        "sensibilidade": sens,
    }


# --------------------------------------------------------------------------------------------
# Cemitério, limites, meta e build
# --------------------------------------------------------------------------------------------


def _g(d: dict, *ks, default=None):
    for k in ks:
        try:
            d = d[k]
        except (KeyError, IndexError, TypeError):
            return default
    return d


def cemiterio(pol: dict, eco: dict, cen: dict) -> list[dict]:
    """O que NÃO funcionou (ou só funcionou com ressalva): números vindos dos próprios resultados."""
    tp = pol["testes_pressuposto"]
    dur = tp["duracao"]["global"]
    betas = {s: _g(dur, s, "beta") for s in ESTADOS}
    loco5 = _g(pol, "validacao", "loco", "h5", "modelos", default={})
    loco10 = _g(pol, "validacao", "loco", "h10", "modelos", default={})
    ra = _g(pol, "validacao", "controle_sintetico_tamanho_brasil", default={})
    fraco = _g(
        ra, "verdade=P_AL, prior=P_global (prior errado)", "prior_fraco_0.5", default={}
    )
    nulo = tp["nulo_calibrado"]
    cres = eco["crescimento"]
    infl = eco["inflacao"]

    def ll(x, h, m):
        return _g(x, "validacao_fora_da_amostra", f"h{h}", "pool", m, "logloss")

    return [
        {
            "tentativa": "Cadeia de Markov simples (permanência geométrica) para regimes políticos",
            "resultado": f"Rejeitada pelo teste de duração: beta da Weibull discreta < 1 em todos os estados (por estado: { ({k: round(v, 2) for k, v in betas.items() if v}) }); "
            "o risco de sair cai com a idade do regime. A ordem 2 e o semi-Markov (risco por faixa de idade) vencem a ordem 1 fora da amostra.",
            "licao": "Usar a matriz anual como 'fato' subestima persistência de regimes antigos e superestima a de regimes recém-criados; preferir leitura com semi-Markov ao lado.",
        },
        {
            "tentativa": "Uma única matriz de transição para todas as eras e regiões",
            "resultado": f"Rejeitada: LRT por era = {_g(tp, 'heterogeneidade', 'por_era', 'lrt'):.0f} (gl {_g(tp, 'heterogeneidade', 'por_era', 'gl')}), por continente = {_g(tp, 'heterogeneidade', 'por_continente', 'lrt'):.0f} (gl {_g(tp, 'heterogeneidade', 'por_continente', 'gl')}), contra os pontos de corte do nulo simulado.",
            "licao": "A matriz global serve de prior do encolhimento, não de resposta para o Brasil; a matriz de 1900-1949 prevê 2000-2024 pior que a de 1990-1999.",
        },
        {
            "tentativa": "Estimar a matriz do Brasil só com a história do Brasil (prior fraco)",
            "resultado": f"Em cadeia sintética do tamanho do Brasil com verdade conhecida, o prior fraco recupera P com erro absoluto médio {_g(fraco, 'erro_abs_medio', default=float('nan')):.3f} "
            f"e cobertura do IC90 de {_g(fraco, 'cobertura_ic90_media', default=float('nan')):.0%} (nominal 90%); o Brasil tem ~8 trocas de regime em 204 anos.",
            "licao": "Brasil sozinho não é estimável: sem encolhimento hierárquico a matriz e os intervalos são enganosos. Mesmo com encolhimento, o IC90 fica abaixo de 90% de cobertura quando o prior é errado.",
        },
        {
            "tentativa": "Persistência 'dura' (probabilidade 0,99 de ficar) como baseline",
            "resultado": f"Log-loss {_g(loco10, 'persist_dura', 'logloss', default=float('nan')):.2f} (h=10) contra {_g(loco10, 'persist_calibrada', 'logloss', default=float('nan')):.2f} da persistência calibrada e {_g(loco10, 'markov', 'logloss', default=float('nan')):.2f} da cadeia.",
            "licao": "Comparar a cadeia com uma persistência não calibrada infla o ganho; a baseline correta é a persistência com a taxa de permanência do treino (regra 5/6 de RIGOR_DE_VALIDACAO).",
        },
        {
            "tentativa": "Chapman-Kolmogorov: prever h anos como P^h",
            "resultado": f"Fora da amostra a previsão direta de h passos bate P^h em h=5 ({_g(loco5, 'direto', 'logloss', default=float('nan')):.3f} contra {_g(loco5, 'markov', 'logloss', default=float('nan')):.3f}) e h=10 ({_g(loco10, 'direto', 'logloss', default=float('nan')):.3f} contra {_g(loco10, 'markov', 'logloss', default=float('nan')):.3f}); "
            "ou seja, a cadeia de 1 passo não é um gerador fiel dos horizontes longos.",
            "licao": "As probabilidades de primeira passagem em 10-12 anos herdam esse viés; tratar como ordem de grandeza.",
        },
        {
            "tentativa": "Leave-country-out como régua de generalização",
            "resultado": "Países de uma mesma época compartilham choques (descolonização, 1989, III onda); sair um país por vez não remove isso. Por isso há também leave-region-out e cortes temporais (1960/1980/2000): os ganhos sobre a persistência continuam, mas o log-loss absoluto piora nos cortes temporais.",
            "licao": "Regra 1 (a régua local mente): os números do leave-country-out são o teto otimista.",
        },
        {
            "tentativa": "Teste qui-quadrado nominal para ordem 2 / era / região em painel",
            "resultado": f"No nulo simulado (cadeia homogênea, mesma máscara), o corte nominal do LRT de ordem 2 foi ultrapassado em {_g(nulo, 'ordem2', 'fpr_no_corte_chi2', default=float('nan')):.0%} das simulações (esperado 5%) e o de era em {_g(nulo, 'era', 'fpr_no_corte_chi2', default=float('nan')):.0%}: células raras tornam o qui-quadrado inexato.",
            "licao": "Reportar o p empírico do nulo simulado, não o p do qui-quadrado; mesmo assim os LRT observados estão muito além do nulo.",
        },
        {
            "tentativa": "Brasil vs resto da América Latina como teste de 'o Brasil é diferente'",
            "resultado": f"LRT = {_g(tp, 'heterogeneidade', 'brasil_vs_resto_da_AL_(desde_1900)', 'lrt', default=float('nan')):.1f}, p = {_g(tp, 'heterogeneidade', 'brasil_vs_resto_da_AL_(desde_1900)', 'p_chi2', default=float('nan')):.2f} (125 transições desde 1900): sem poder.",
            "licao": "Não rejeitar não é igualdade; o Brasil continua a ser tratado como 'AL + dados do Brasil', não como idêntico à AL.",
        },
        {
            "tentativa": "Semi-Markov monotônico (democracia velha = democracia segura)",
            "resultado": "O risco de saída da democracia eleitoral cai até ~16 anos de idade mas a faixa 32+ volta a subir (15 saídas em 233 exposições); a da democracia liberal oscila. Não há monotonicidade estável em democracias.",
            "licao": "A projeção semi-Markov do Brasil (idade 39) NÃO é menor que a do Markov: não se pode vender 'democracia consolidada' como proteção a partir destes dados.",
        },
        {
            "tentativa": "Cadeia de Markov para classes de crescimento do PIB",
            "resultado": f"Fora da amostra a cadeia não bate a climatologia (log-loss h=1: cadeia {ll(cres, 1, 'cadeia'):.3f} vs climatologia {ll(cres, 1, 'climatologia'):.3f}); o HMM com BIC escolhe k={_g(cres, 'hmm', 'k_escolhido_por_BIC')} (um regime) — o crescimento anual é quase i.i.d. nas classes.",
            "licao": "Para crescimento, 'regime' é nome para ruído: a distribuição 2027-2038 é, na prática, a incondicional; só a persistência calibrada perde.",
        },
        {
            "tentativa": "Cadeia/HMM de regimes de inflação para horizontes de 3-5 anos",
            "resultado": f"Fora da amostra a persistência calibrada vence a cadeia em h=3 (log-loss {ll(infl, 3, 'persist_calibrada'):.2f} vs {ll(infl, 3, 'cadeia'):.2f}) e em h=5 ({ll(infl, 5, 'persist_calibrada'):.2f} vs {ll(infl, 5, 'cadeia'):.2f}); o HMM de 3 estados tem linhas de transição quase degeneradas.",
            "licao": "Os regimes de inflação duram mais que o geométrico e há um único grande episódio de hiperinflação; a projeção condicional é indicativa, não calibrada.",
        },
        {
            "tentativa": "Cenários macro como seção transversal ponderada pela ocupação da cadeia",
            "resultado": "Sem dependência de trajetória: na troca de cenário a dívida herdada é ignorada. Em três dos quatro cenários a dívida mediana de 2038 já passa de 120% do PIB (limiar de ruptura), faixa em que o modelo macro 'não vale como projeção'.",
            "licao": "As faixas de dívida acima de 120% não são trajetórias; ler a probabilidade de ruptura e o tempo até ela, não a mediana da dívida.",
        },
    ]


def limites() -> list[str]:
    return [
        "Cadeia de Markov NÃO é previsão: é a extrapolação de frequências históricas de transição. Eventos raros (golpes, guerras, crises globais) e choques externos só entram na medida em que ocorreram nas amostras; não há modelo causal.",
        "Os intervalos p10-p90 das projeções são incerteza sobre os PARÂMETROS da matriz (posterior de Dirichlet); não incluem erro de especificação (duração, heterogeneidade, ordem 2) nem choques fora do modelo.",
        "Classificação V-Dem/Regimes of the World é uma medida especializada, não um fato: ela codifica o Brasil de 1950 a 1986 como 'autocracia eleitoral' e o Brasil de 1946-49 como 'autocracia fechada', o que diverge da periodização de historia.json (República de 1946 como democracia). Os estados aqui são os da fonte, não do projeto.",
        "A fonte (OWID/V-Dem) imputa regimes de entes históricos a países que ainda não eram soberanos, sem marcar linhas imputadas; usa-se 1900 em diante para o painel e 1822 em diante para o Brasil (soberano desde então). Séries duplicadas de ex-colônias reduzem o número efetivo de unidades independentes: os ICs são provavelmente estreitos demais.",
        "O último ano do dado é 2025 (V-Dem v16); o estado atual do Brasil é o de 2025 (democracia eleitoral, desde 1987). 2026 ainda não existe na fonte e a eleição de 25/10/2026 está em aberto.",
        "A cadeia de cenários usa uma matriz de JULGAMENTO (ancorada em duas taxas empíricas: erosão e recuperação), não estimada. A taxa empírica é de regimes (V-Dem), enquanto os cenários são combinações de governo e risco institucional; o mapeamento hegemonia/extremo -> autocracia é uma suposição.",
        "A macro esperada é uma mistura de seções transversais sem dependência de trajetória; acima de 120% de dívida/PIB o modelo macro não vale como projeção.",
        "Regimes econômicos: duas cadeias independentes (inflação, crescimento) de séries anuais curtas (80-125 pontos); sem relação entre elas e sem choques de commodities, juros globais ou pandemias; o HMM é gaussiano univariado.",
        "Com poucas transições recentes, a matriz da era atual é imprecisa; a matriz antiga é viesada: não há matriz 'certa' para 2027-2038.",
    ]


def _limpar(o):
    if isinstance(o, dict):
        return {str(k): _limpar(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [_limpar(v) for v in o]
    if isinstance(o, (np.floating, float)):
        v = float(o)
        return v if math.isfinite(v) else None
    if isinstance(o, np.integer):
        return int(o)
    if isinstance(o, np.bool_):
        return bool(o)
    if isinstance(o, np.ndarray):
        return _limpar(o.tolist())
    return o


def _fonte(meta: dict, nome: str, url: str, **extra) -> dict:
    return {
        "nome": nome,
        "url": url,
        "baixado_em": meta["baixado_em"],
        "sha256": meta["sha256"],
        "arquivos": [
            {"nome": a["nome"], "sha256": a["sha256"], "bytes": a["bytes"]}
            for a in meta["arquivos"]
        ],
        **extra,
    }


def build(rapido: bool = False, out: Path | None = None, base=None) -> dict:
    """Gera `web/public/data/evolucoes.json`. `rapido` reduz simulações/bootstraps (só para depuração)."""
    out = out or OUT
    prov = baixar()
    S, codes, anos, cont = carregar_painel()
    historia = json.loads(HISTORIA.read_text(encoding="utf-8"))
    pol = regimes_politicos(S, codes, anos, cont, historia, rapido=rapido)
    hier = pol.pop("_interno")["hier"]
    eco = regimes_economicos(rapido=rapido)
    am = amostras_cenarios(base=base)
    P_br = normalizar(hier["alpha"]["brasil"])
    cen = cadeia_cenarios(P_br, am, rapido=rapido)
    cem = cemiterio(pol, eco, cen)
    res = {
        "meta": {
            "gerado_em": datetime.now(UTC).isoformat(timespec="seconds"),
            "aviso": (
                "Cadeias de Markov NÃO são previsão: extrapolam frequências históricas de transição sob um pressuposto "
                "(estado discreto, saída dependente só do estado atual) que os testes abaixo REFUTAM em parte (dependência de duração, "
                "heterogeneidade por era/região). Eventos raros e choques externos não estão no modelo. Os intervalos são incerteza de "
                "parâmetro. A matriz da cadeia de cenários é SUPOSIÇÃO (julgamento ancorado em duas taxas empíricas)."
            ),
            "fontes": [
                _fonte(
                    prov["owid_political_regime"],
                    "Regime político (Regimes of the World, Lührmann et al. 2018) — V-Dem v16 processado por Our World in Data",
                    URL_REGIME,
                    licenca="CC BY 4.0 (conferida em political-regime.metadata.json: origins[0].license)",
                    citacao="V-Dem (2026), Democracy report v16, via Our World in Data",
                    ultima_atualizacao_fonte="2026-03-17",
                ),
                _fonte(
                    prov["owid_continentes"],
                    "Continentes segundo Our World in Data (agrupamento de países para leave-region-out)",
                    URL_CONT,
                    licenca="CC BY 4.0 (OWID)",
                ),
                {
                    "nome": "Séries econômicas (IGP-DI, IPCA, PIB real) de series_historicas.json",
                    "url": "web/public/data/series_historicas.json",
                    "nota": "Ipeadata (FGV/IBGE); proveniência e SHA-256 na própria série (campo `fonte`)",
                },
                {
                    "nome": "Cenários e trajetórias macro (scenarios.py / economy.py)",
                    "url": "src/sociolibero/scenarios.py",
                    "nota": "mesmas amostras de scenarios.run(seed=7, n=2000); consistência verificada contra out/trajetorias.csv",
                },
                {
                    "nome": "Períodos históricos (historia.json)",
                    "url": "web/public/data/historia.json",
                },
            ],
            "lacunas": [
                "V-Dem completo (indicadores contínuos de democracia, golpes por ano) não usado: só a classificação Regimes of the World; sem cadastro exigido, mas fora do escopo.",
                "O dado termina em 2025; o estado do Brasil em 2026 e o resultado da eleição de 25/10/2026 são desconhecidos.",
                "A fonte não sinaliza linhas imputadas de entes históricos (ex-colônias); não foi possível removê-las, só limitar a janela (>=1900; Brasil >=1822).",
                "Sem série longa e aberta de Selic e de dívida/PIB (a dívida bruta existe só desde 2006): regimes de juros e de dívida NÃO foram estimados; a dívida entra só via cenários.",
                "Probabilidade de golpe ou de ruptura por evento: não existe série de eventos ligada às transições, então 'por quê' das transições não é modelado.",
                "Matriz de cenários: sem dado que a estime (4 cenários são construtos do projeto, não observações).",
            ],
            "metodo_resumo": (
                "Contagens + Dirichlet; encolhimento hierárquico Brasil -> AL -> mundo (kappa por verossimilhança marginal leave-one-country-out); "
                "ICs por amostragem do posterior; testes de duração (geométrica vs Weibull), ordem 2, heterogeneidade por era/região "
                "com nulo simulado; validação leave-country-out, leave-region-out e cortes temporais (h=1,5,10) contra persistência calibrada "
                "e climatologia; controles sintéticos; HMM gaussiano por Baum-Welch em NumPy."
            ),
            "seed": SEED,
            "rapido": rapido,
        },
        "regimes_politicos": pol,
        "regimes_economicos": eco,
        "cadeia_cenarios": cen,
        "cemiterio": cem,
        "limites": limites(),
    }
    res = _limpar(res)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    return res

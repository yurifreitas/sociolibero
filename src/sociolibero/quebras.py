"""Quebras estruturais em séries anuais: detectores, validação sintética e aplicação.

Ordem de trabalho (regras de rigor herdadas do projeto adia, ver docs/RIGOR_DE_VALIDACAO.md):
1. o NULO é validado antes de qualquer detecção (FPR sob AR(1), tendência, heterocedasticidade,
   outliers e passeio aleatório);
2. o procedimento final é ESCOLHIDO pela validação sintética, não por ajuste às séries reais;
3. o oráculo com τ conhecido dá o teto de poder;
4. detectores online só usam o passado (φ, média e σ estimados na janela inicial: sem vazamento);
5. coincidência com datas históricas não é causa; quebras metodológicas são controle, não resultado.

Convenção: a quebra em ``tau`` (índice) significa que as observações ``t >= tau`` pertencem ao novo regime.
"""

from __future__ import annotations

import json
import math
from concurrent.futures import ProcessPoolExecutor
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
from scipy.signal import lfilter
from scipy.special import gammaln, logsumexp

ALPHA = 0.05
PHI_LO, PHI_HI = -0.3, 0.95
PHI_DIFF = 0.7  # φ̂ (resíduo de tendência) acima disso => analisa a diferença; varredura em run_validation
MIN_N = 20
SPIKE_W = 10  # janela local (2w vizinhos) da escala do teste de salto; 0 = escala global. Ver _spike_cell
KAPPAS = (0.05, 0.1, 0.15, 0.25, 0.35, 0.5, 0.75, 1.0, 1.5, 2.0)
MODE_PHI = "ols"  # estimador de φ̂ da regra de modo (ols: nulo; alt: sob a alternativa)
TIPOS = ("media", "tendencia", "variancia")
PHI_METHODS = ("ols", "diff", "alt")
DATA = Path("web/public/data")


# ---------------------------------------------------------------------------------------------
# Geradores sintéticos (nulos e quebras com verdade conhecida)
# ---------------------------------------------------------------------------------------------
def ar1(rng, n, phi, rows=1, sigma_y=1.0):
    """AR(1) estacionário com desvio marginal ``sigma_y``; devolve (rows, n)."""
    s_e = sigma_y * math.sqrt(1 - phi**2)
    e = rng.standard_normal((rows, n)) * s_e
    e[:, 0] = rng.standard_normal(rows) * sigma_y
    return lfilter([1.0], [1.0, -phi], e, axis=1)


def simulate_null(rng, n, kind="ar1_phi05"):
    """Nulos sem quebra. ``rw_drift`` é I(1); ``tendencia`` soma uma reta aleatória."""
    t = np.arange(n)
    if kind == "ar1_phi0":
        return ar1(rng, n, 0.0)[0]
    if kind == "ar1_phi05":
        return ar1(rng, n, 0.5)[0]
    if kind == "ar1_phi08":
        return ar1(rng, n, 0.8)[0]
    if kind == "ar1_tendencia":
        return ar1(rng, n, 0.5)[0] + rng.uniform(0.5, 4.0) * (t / n) * rng.choice(
            [-1, 1]
        )
    if kind == "heterocedastico":  # ARCH(1) com agrupamento de volatilidade, sem quebra
        e = np.empty(n)
        h = 1.0
        for i in range(n):
            e[i] = math.sqrt(h) * rng.standard_normal()
            h = 0.4 + 0.6 * e[i] ** 2
        return lfilter([1.0], [1.0, -0.5], e) / 1.15
    if kind == "outliers":  # AR(1) com 2% de outliers aditivos de 5σ
        y = ar1(rng, n, 0.5)[0]
        k = rng.random(n) < 0.02
        return y + k * rng.choice([-5.0, 5.0], n)
    if kind == "rw_drift":  # passeio aleatório com deriva (I(1))
        return 100 + np.cumsum(rng.standard_normal(n) * 0.3 + rng.uniform(0.0, 0.3))
    raise ValueError(kind)


NULOS = (
    "ar1_phi0",
    "ar1_phi05",
    "ar1_phi08",
    "ar1_tendencia",
    "heterocedastico",
    "outliers",
    "rw_drift",
)


def simulate_break(
    rng, n, tipo, mag, tau=None, phi=0.5, trend=True, tau2=None, escada=False
):
    """AR(1)+tendência incômoda com quebra de ``tipo`` e magnitude ``mag``.

    media: salto de ``mag`` desvios marginais; variancia: razão de desvios das inovações ``mag``;
    tendencia: mudança de inclinação tal que a deriva extra ao fim vale ``mag`` desvios.
    """
    tau = n // 2 if tau is None else tau
    t = np.arange(n)
    s_e = math.sqrt(1 - phi**2)
    e = rng.standard_normal(n) * s_e
    e[0] = rng.standard_normal()
    scale = np.ones(n)
    if tipo == "variancia":
        scale[tau:] = mag
        if tau2 is not None:
            scale[tau2:] = 1.0
    ee = e * scale
    ee[0] = e[0]
    y = lfilter([1.0], [1.0, -phi], ee)
    if trend:
        y = y + rng.uniform(0.5, 3.0) * (t / n) * rng.choice([-1, 1])
    if tipo == "media":
        y = y + mag * (t >= tau)
        if tau2 is not None:
            y = y + (1 if escada else -1) * mag * (t >= tau2)
    elif tipo == "tendencia":
        y = y + mag * np.maximum(t - tau, 0) / max(n - tau, 1)
    return y


# ---------------------------------------------------------------------------------------------
# Motor de varredura: sup-F / LR / CUSUM / Bayes (mistura em τ) sobre linhas (réplicas) de séries
# ---------------------------------------------------------------------------------------------
_MATS: dict = {}


def _range(n):
    lo = max(5, math.ceil(0.1 * n))
    return lo, n - lo  # τ ∈ [lo, hi] (primeiro índice do novo regime)


def _mats(n, trend):
    """Projetor de resíduos e regressores (degrau/dobradiça) residualizados, cacheados por (n, tendência)."""
    key = (n, trend)
    if key in _MATS:
        return _MATS[key]
    t = np.arange(n, dtype=float)
    N = np.column_stack([np.ones(n), t]) if trend else np.ones((n, 1))
    P = np.eye(n) - N @ np.linalg.pinv(N)
    lo, hi = _range(n)
    taus = np.arange(lo, hi + 1)
    step = (t[None, :] >= taus[:, None]).astype(float)
    hinge = np.maximum(t[None, :] - taus[:, None], 0.0)
    out = {"P": P, "q": N.shape[1], "taus": taus}
    for nome, S in (("step", step), ("hinge", hinge)):
        St = S @ P  # P simétrico
        out[nome] = St
        out[nome + "_n2"] = np.maximum((St**2).sum(1), 1e-12)
    _MATS[key] = out
    return out


def _phi_from(Y, R, method):
    """φ̂ por linha. ``ols``: lag-1 dos resíduos; ``diff``: γΔ(2)/γΔ(1) (robusto a um degrau)."""
    ols = (R[:, 1:] * R[:, :-1]).sum(1) / np.maximum((R**2).sum(1), 1e-12)
    ols = ols + (1 + 3 * ols) / R.shape[1]  # correção de viés de pequena amostra
    if method == "ols":
        phi = ols
    else:
        D = np.diff(Y, axis=1)
        D = D - D.mean(1, keepdims=True)
        g1 = (D[:, 1:] * D[:, :-1]).sum(1)
        g2 = (D[:, 2:] * D[:, :-2]).sum(1)
        with np.errstate(divide="ignore", invalid="ignore"):
            phi = np.where(g1 < 0, g2 / g1, ols)
    return np.clip(phi, PHI_LO, PHI_HI)


def scan(Y, method="ols", trend=True):
    """Estatísticas de todas as varreduras para as linhas de Y (B×n).

    Devolve dict com F_step, F_hinge (B×T, já com variância de longo prazo AR(1)), LR_var, cusum e φ̂.
    """
    Y = np.atleast_2d(Y)
    n = Y.shape[1]
    m = _mats(n, trend)
    R = Y @ m["P"]
    numS = (R @ m["step"].T) ** 2 / m["step_n2"][None, :]
    numH = (R @ m["hinge"].T) ** 2 / m["hinge_n2"][None, :]
    Rv = R  # resíduo usado no teste de variância
    if method == "alt":
        # φ̂ e σ̂² reestimados sob a ALTERNATIVA (melhor degrau ou dobradiça): a própria quebra não
        # infla a persistência estimada. O bootstrap replica este passo, então o p segue calibrado.
        jS, jH = numS.argmax(1), numH.argmax(1)
        useS = numS.max(1) >= numH.max(1)
        St = np.where(useS[:, None], m["step"][jS], m["hinge"][jH])
        n2 = np.where(useS, m["step_n2"][jS], m["hinge_n2"][jH])
        beta = (R * St).sum(1) / n2
        Rv = R - beta[:, None] * St
        s2 = np.maximum((Rv**2).sum(1) / (n - m["q"] - 2), 1e-12)
        ph = (Rv[:, 1:] * Rv[:, :-1]).sum(1) / np.maximum((Rv**2).sum(1), 1e-12)
        phi = np.clip(ph + (1 + 3 * ph) / n, PHI_LO, PHI_HI)
    else:
        s2 = np.maximum((R**2).sum(1) / (n - m["q"] - 1), 1e-12)
        phi = _phi_from(Y, R, method)
    lam = (1 + phi) / (1 - phi)  # razão variância de longo prazo / variância marginal
    out = {"phi": phi, "taus": m["taus"], "R": R, "s2": s2, "lam": lam}
    den = (s2 * lam)[:, None]
    out["F_step"] = numS / den
    out["F_hinge"] = numH / den
    out["cusum"] = np.abs(np.cumsum(R, axis=1)).max(1) / np.sqrt(s2 * lam * n)
    out["cusum_arg"] = np.abs(np.cumsum(R, axis=1)).argmax(1) + 1
    # variância: LR sobre as inovações pré-branqueadas
    E = Rv[:, 1:] - phi[:, None] * Rv[:, :-1]
    mm = E.shape[1]
    lo, hi = _range(n)
    ks = np.arange(lo - 1, hi)  # k = nº de inovações no regime antigo (índice τ-1)
    ks = ks[(ks >= 3) & (ks <= mm - 3)]
    cs = np.cumsum(E**2, axis=1)
    tot = cs[:, -1][:, None]
    c1 = cs[:, ks - 1]
    c2 = tot - c1
    with np.errstate(divide="ignore", invalid="ignore"):
        LR = (
            mm * np.log(tot / mm)
            - ks * np.log(c1 / ks)
            - (mm - ks) * np.log(c2 / (mm - ks))
        )
    # variante robusta (Sansó-Aragó-Carrión 2004): CUSUM de quadrados com variância de longo prazo
    # (Bartlett) do quadrado das inovações, válida sob caudas pesadas e agrupamento de volatilidade
    g = E**2 - (E**2).mean(1, keepdims=True)
    gc = np.cumsum(g, axis=1)
    L = max(1, int(mm ** (1 / 3)))
    lrv = (g**2).mean(1)
    for j in range(1, L + 1):
        lrv = lrv + 2 * (1 - j / (L + 1)) * (g[:, j:] * g[:, :-j]).mean(1)
    lrv = np.maximum(lrv, 0.3 * (g**2).mean(1))
    out["LR_var_hac"] = np.nan_to_num(gc[:, ks - 1] ** 2 / (mm * lrv[:, None]), nan=0.0)
    out["LR_var"] = np.nan_to_num(LR, nan=0.0)
    out["taus_var"] = ks + 1
    return out


def _bf_stat(F, n, lam):
    """ln BF com mistura uniforme em τ (aprox. BIC; = exp-F de Andrews–Ploberger com penalidade)."""
    neff = np.maximum(n / lam, 2.0)
    lnbf = F / 2 - 0.5 * np.log(neff)[:, None]
    return logsumexp(lnbf, axis=1) - np.log(F.shape[1])


def _stats_rows(Y, method, trend=True):
    sc = scan(Y, method, trend)
    n = Y.shape[1]
    return sc, {
        "step": sc["F_step"].max(1),
        "hinge": sc["F_hinge"].max(1),
        "var": sc["LR_var"].max(1),
        "var_hac": sc["LR_var_hac"].max(1),
        "cusum": sc["cusum"],
        "bf": _bf_stat(sc["F_step"], n, sc["lam"]),
    }


_NULLS: dict = {}
B_CACHE = 2500
CHUNK = 5000
B_REFINO = (
    50000  # refino do bootstrap quando o p bruto é pequeno (Holm exige p minúsculo)
)


def _bucket(n, phi):
    nb = n if n <= 40 else int(round(n / 5) * 5)
    return nb, float(np.clip(round(phi * 20) / 20, PHI_LO, PHI_HI))


def null_table(n, phi, method, trend=True, B=B_CACHE, seed=11, exact=False):
    """Distribuição nula (ordenada) por estatística: bootstrap paramétrico AR(1) com φ̂ da série.

    As estatísticas são invariantes a média, tendência e escala, então só (n, φ̂) importam. Em cada
    réplica φ̂ é reestimado, replicando o procedimento inteiro (não só o valor crítico).
    """
    if exact:
        nb, pb = n, float(np.clip(phi, PHI_LO, PHI_HI))
    else:
        nb, pb = _bucket(n, phi)
    key = (nb, pb, method, trend, B, exact)
    if key in _NULLS:
        return _NULLS[key]
    rng = np.random.default_rng(seed + nb * 7 + int((pb + 1) * 100))
    parts: dict[str, list] = {}
    for _ in range(max(1, math.ceil(B / CHUNK))):
        Y = ar1(rng, nb, pb, rows=min(B, CHUNK))
        _, st = _stats_rows(Y, method, trend)
        for k, v in st.items():
            parts.setdefault(k, []).append(v)
    tab = {k: np.sort(np.concatenate(v)) for k, v in parts.items()}
    _NULLS[key] = tab
    return tab


def _pval(stat, sorted_null):
    """p = (1 + #{nulo >= stat}) / (B + 1)."""
    k = len(sorted_null) - np.searchsorted(sorted_null, stat, side="left")
    return (1 + k) / (len(sorted_null) + 1)


def _post_interval(logpost, taus, temper=1.0, level=0.9):
    w = logpost / temper
    w = np.exp(w - w.max())
    w /= w.sum()
    c = np.cumsum(w)
    a = (1 - level) / 2
    i0 = int(np.searchsorted(c, a))
    i1 = int(np.searchsorted(c, 1 - a))
    return int(taus[min(i0, len(taus) - 1)]), int(taus[min(i1, len(taus) - 1)]), w


VAR_KIND = "var_hac"  # "var" (LR gaussiana) ou "var_hac"; escolhido pela validação
_VARCOL = {"var": "LR_var", "var_hac": "LR_var_hac"}
TEMPER = 1.0  # fixado pela validação (cobertura do intervalo de τ), ver run_validation


def test_series(y, method="ols", trend=True, exact=False, B=None):
    """Aplica os 5 testes a UMA série; p por bootstrap AR(1). Retorna dict por teste."""
    y = np.asarray(y, float)
    n = len(y)
    sc, st = _stats_rows(y[None, :], method, trend)
    phi = float(sc["phi"][0])
    tab = null_table(
        n, phi, method, trend, **({"B": B, "exact": True} if exact else {})
    )
    res = {"phi": phi, "n": n}
    taus = sc["taus"]
    kinds = {
        "media": ("step", sc["F_step"][0], taus),
        "tendencia": ("hinge", sc["F_hinge"][0], taus),
        "variancia": (VAR_KIND, sc[_VARCOL[VAR_KIND]][0], sc["taus_var"]),
    }
    for tipo, (k, vec, tt) in kinds.items():
        j = int(np.argmax(vec))
        lo, hi, _ = _post_interval(vec / 2.0, tt, TEMPER)
        res[tipo] = {
            "stat": float(vec[j]),
            "tau": int(tt[j]),
            "p": float(_pval(vec[j], tab[k])),
            "intervalo": [lo, hi],
        }
    res["variancia_raw"] = {
        "p": float(_pval(sc["LR_var"][0].max(), tab["var"])),
    }
    res["variancia_hac"] = {
        "p": float(_pval(sc["LR_var_hac"][0].max(), tab["var_hac"])),
    }
    res["cusum"] = {
        "stat": float(st["cusum"][0]),
        "tau": int(sc["cusum_arg"][0]),
        "p": float(_pval(st["cusum"][0], tab["cusum"])),
    }
    res["bf"] = {"stat": float(st["bf"][0]), "p": float(_pval(st["bf"][0], tab["bf"]))}
    return res


# ---------------------------------------------------------------------------------------------
# Modo (nível x diferença) e transformação a priori
# ---------------------------------------------------------------------------------------------
def prepare(y):
    """Transformação PRÉ-REGISTRADA (sem olhar para quebras): log se positiva com amplitude > 5x;
    modo diferença se φ̂ (OLS, resíduo de tendência) > ``PHI_DIFF``.
    Retorna (z, modo, offset): z[i] corresponde ao ano índice i+offset."""
    y = np.asarray(y, float)
    log = bool(np.all(y > 0) and y.max() / max(y.min(), 1e-12) > 5)
    x = np.log(y) if log else y
    sc = scan(
        x[None, :], "alt", True
    )  # φ̂ sob a alternativa: a própria quebra não força a diferença
    if sc["phi"][0] > PHI_DIFF:
        return np.diff(x), "diferenca", 1, log
    return x, "nivel", 0, log


def _spike_stat(d, w=None):
    """Salto isolado numa diferença, com escala LOCAL (mediana e MAD dos 2w vizinhos, sem o próprio
    ponto): max |d_t - med_t| / (1,4826 MAD_t). A escala local evita que um regime volátil
    (hiperinflação) faça todo ponto parecer salto. Calibrado por bootstrap, como os demais."""
    d = np.atleast_2d(d)
    n = d.shape[1]
    w = SPIKE_W if w is None else w
    gm = np.median(d, axis=1, keepdims=True)
    gmad = np.median(np.abs(d - gm), axis=1, keepdims=True) * 1.4826
    w = min(w, max(3, n // 4))
    if w <= 0:
        z = np.abs(d - gm) / np.maximum(gmad, 1e-12)
        return z.max(1), z.argmax(1)
    pad = np.pad(d, ((0, 0), (w, w)), mode="reflect")
    win = np.lib.stride_tricks.sliding_window_view(pad, 2 * w + 1, axis=1)
    nb = np.concatenate([win[:, :, :w], win[:, :, w + 1 :]], axis=2)
    med = np.median(nb, axis=2)
    mad = np.median(np.abs(nb - med[:, :, None]), axis=2) * 1.4826
    z = np.abs(d - med) / np.maximum(mad, 0.3 * np.maximum(gmad, 1e-12))
    return z.max(1), z.argmax(1)


def _spike_null(n, phi, B=B_CACHE, seed=5, exact=False):
    nb, pb = (n, phi) if exact else _bucket(n, phi)
    key = ("spike", nb, pb, B, SPIKE_W)
    if key in _NULLS:
        return _NULLS[key]
    rng = np.random.default_rng(seed + nb)
    parts = []
    for _ in range(max(1, math.ceil(B / 2000))):
        parts.append(_spike_stat(ar1(rng, nb, pb, rows=min(B, 2000)))[0])
    _NULLS[key] = np.sort(np.concatenate(parts))
    return _NULLS[key]


# ---------------------------------------------------------------------------------------------
# Procedimento final: três tipos (min-p ×3), segmentação binária recursiva, Holm
# ---------------------------------------------------------------------------------------------
def _node_test(seg, modo, method, exact, B):
    """Testa um segmento. Em modo nível: media/tendencia/variancia. Em modo diferença:
    degrau na média da diferença (= mudança de crescimento, rotulado 'tendencia'), variância e salto
    ('media', mudança de nível entre dois anos)."""
    if isinstance(method, dict):
        method = method["curto"] if len(seg) < method["corte"] else method["longo"]
    r = test_series(seg, method, True, exact, B)
    n = len(seg)
    if modo == "nivel":
        cand = {t: r[t] for t in TIPOS}
        cand = {t: {**v} for t, v in cand.items()}
    else:
        # na diferença: usa varredura com média constante (sem tendência) para o degrau de crescimento
        r0 = test_series(seg, method, False, exact, B)
        sp, arg = _spike_stat(seg[None, :])
        phi = float(np.clip(r["phi"], PHI_LO, PHI_HI))
        tab = _spike_null(n, phi, **({"B": B, "exact": True} if exact else {}))
        cand = {
            "tendencia": {**r0["media"]},
            "variancia": {**r["variancia"]},
            "media": {
                "stat": float(sp[0]),
                "tau": int(arg[0]),
                "p": float(_pval(sp[0], tab)),
                "intervalo": [int(arg[0]), int(arg[0])],
            },
        }
    tipo = min(cand, key=lambda t: cand[t]["p"])
    if exact and B and B < B_REFINO and cand[tipo]["p"] < 0.01:
        return _node_test(seg, modo, method, exact, B_REFINO)
    c = cand[tipo]
    return {
        "tipo": tipo,
        "salto": modo == "diferenca" and tipo == "media",
        "tau": c["tau"],
        "stat": c["stat"],
        "p_node": min(1.0, 3 * c["p"]),
        "intervalo": c["intervalo"],
        "todos": {t: round(v["p"], 5) for t, v in cand.items()},
        "phi": r["phi"],
    }


def _holm(ps):
    ps = np.asarray(ps, float)
    m = len(ps)
    order = np.argsort(ps)
    adj = np.empty(m)
    run = 0.0
    for rank, i in enumerate(order):
        run = max(run, min(1.0, (m - rank) * ps[i]))
        adj[i] = run
    return adj


def _bh(ps):
    ps = np.asarray(ps, float)
    m = len(ps)
    order = np.argsort(ps)[::-1]
    adj = np.empty(m)
    run = 1.0
    for k, i in enumerate(order):
        rank = m - k
        run = min(run, ps[i] * m / rank)
        adj[i] = run
    return adj


def find_nodes(z, modo, method="ols", exact=False, B=None, min_len=14, screen=ALPHA):
    """Segmentação binária: testa o segmento; se p_node<screen, divide em τ̂ e repete nos dois lados.
    Devolve TODOS os nós testados (a multiplicidade conta os não significativos também)."""
    nodes = []
    stack = [(0, len(z))]
    while stack:
        a, b = stack.pop()
        if b - a < min_len:
            continue
        nd = _node_test(z[a:b], modo, method, exact, B)
        nd["tau"] += a
        nd["intervalo"] = [nd["intervalo"][0] + a, nd["intervalo"][1] + a]
        nd["seg"] = (a, b)
        nodes.append(nd)
        if nd["p_node"] < screen and len(nodes) < 12:
            stack.append((a, nd["tau"]))
            stack.append((nd["tau"] + (1 if nd.get("salto") else 0), b))
    return nodes


def detect_series(y, method="ols", exact=False, B=None, alpha=ALPHA):
    """Procedimento final numa série isolada (família = seus nós). Retorna lista de quebras."""
    z, modo, off, _ = prepare(y)
    nodes = find_nodes(z, modo, method, exact, B)
    if not nodes:
        return [], modo, off
    padj = _holm([nd["p_node"] for nd in nodes])
    out = []
    for nd, p in zip(nodes, padj):
        nd["p_adj"] = float(p)
        if p < alpha:
            out.append(nd)
    return out, modo, off


# ---------------------------------------------------------------------------------------------
# Detectores concorrentes (online e segmentação MDL) para a validação
# ---------------------------------------------------------------------------------------------
def _burn_len(n):
    return max(10, round(0.2 * n))


def _online_u(y):
    """Padroniza causalmente: φ, média e σ só da janela inicial (sem olhar o futuro)."""
    n = len(y)
    m0 = _burn_len(n)
    b = y[:m0] - y[:m0].mean()
    phi = float(np.clip((b[1:] * b[:-1]).sum() / max((b**2).sum(), 1e-12), 0.0, 0.9))
    z = y[1:] - phi * y[:-1]
    mu, sd = z[: m0 - 1].mean(), max(z[: m0 - 1].std(ddof=1), 1e-9)
    return (z - mu) / sd, m0 - 1


def page_path(y, k=0.5):
    u, m0 = _online_u(y)
    gp = gm = 0.0
    out = np.zeros(len(u))
    for i in range(len(u)):
        gp = max(0.0, gp + u[i] - k)
        gm = max(0.0, gm - u[i] - k)
        out[i] = max(gp, gm) if i >= m0 else 0.0
    return out


def sr_path(y, deltas=(-2.0, -1.0, 1.0, 2.0)):
    u, m0 = _online_u(y)
    d = np.array(deltas)
    R = np.zeros(len(d))
    out = np.zeros(len(u))
    for i in range(len(u)):
        R = (1 + R) * np.exp(np.clip(d * u[i] - d**2 / 2, -50, 50))
        R = np.minimum(R, 1e200)
        out[i] = np.log(max(R.mean(), 1e-300)) if i >= m0 else -50.0
    return out


def bocpd_path(y, hazard=1 / 100, w=5):
    """BOCPD (Adams & MacKay 2007), Normal-Gama conjugado; devolve P(run length <= w | y_1:t)."""
    u, m0 = _online_u(y)
    n = len(u)
    mu = np.array([0.0])
    ka = np.array([1.0])
    al = np.array([1.0])
    be = np.array([1.0])
    logr = np.array([0.0])
    out = np.zeros(n)
    lh, l1h = math.log(hazard), math.log(1 - hazard)
    for i in range(n):
        x = u[i]
        df = 2 * al
        sc2 = be * (ka + 1) / (al * ka)
        lp = (
            gammaln((df + 1) / 2)
            - gammaln(df / 2)
            - 0.5 * np.log(df * np.pi * sc2)
            - (df + 1) / 2 * np.log1p((x - mu) ** 2 / (df * sc2))
        )
        new = logr + lp
        cp = logsumexp(new + lh)
        grow = new + l1h
        logr = np.concatenate([[cp], grow])
        logr -= logsumexp(logr)
        mu_n = (ka * mu + x) / (ka + 1)
        be_n = be + ka * (x - mu) ** 2 / (2 * (ka + 1))
        mu = np.concatenate([[0.0], mu_n])
        ka = np.concatenate([[1.0], ka + 1])
        al = np.concatenate([[1.0], al + 0.5])
        be = np.concatenate([[1.0], be_n])
        out[i] = np.exp(logsumexp(logr[: w + 1])) if i >= m0 else 0.0
    return out


def dp_segment(z, penalty, lmin=5):
    """Partição ótima (soma de quadrados por segmento + penalidade por quebra), O(n²) em NumPy."""
    n = len(z)
    cs = np.concatenate([[0.0], np.cumsum(z)])
    cs2 = np.concatenate([[0.0], np.cumsum(z**2)])
    F = np.full(n + 1, np.inf)
    F[0] = -penalty
    last = np.zeros(n + 1, dtype=int)
    for e in range(lmin, n + 1):
        s = np.arange(0, e - lmin + 1)
        ln = e - s
        cost = (cs2[e] - cs2[s]) - (cs[e] - cs[s]) ** 2 / ln
        tot = F[s] + cost + penalty
        j = int(np.argmin(tot))
        F[e] = tot[j]
        last[e] = s[j]
    cps = []
    e = n
    while e > 0:
        s = last[e]
        if s > 0:
            cps.append(int(s))
        e = s
    return sorted(cps)


def _dp_input(y):
    sc = scan(y[None, :], "diff", False)
    phi = float(sc["phi"][0])
    z = y[1:] - phi * y[:-1]
    d = np.diff(z)
    sig2 = (np.median(np.abs(d - np.median(d))) * 1.4826) ** 2 / 2  # robusto a saltos
    return z, max(sig2, 1e-9)


def dp_bic(y, c=1.0):
    """K̂ por MDL/BIC sobre a série pré-branqueada: penalidade c·2·σ²·ln n por quebra."""
    z, s2 = _dp_input(y)
    return dp_segment(z, c * 2 * s2 * math.log(len(z)))


_ONLINE_NULL: dict = {}
NULL_MIX = (0.0, 0.5, 0.8)


def online_null(n, nsim=300, seed=17):
    """Máximos nulos de page/sr/bocpd e multiplicador c do dp calibrado, por n (mistura de φ)."""
    if n in _ONLINE_NULL:
        return _ONLINE_NULL[n]
    rng = np.random.default_rng(seed + n)
    pg, sr, bo = [], [], []
    ys = []
    for i in range(nsim):
        y = ar1(rng, n, NULL_MIX[i % len(NULL_MIX)])[0]
        ys.append(y)
        pg.append(page_path(y).max())
        sr.append(sr_path(y).max())
        bo.append(bocpd_path(y).max())
    cal = None
    for c in (1, 2, 3, 4, 5, 6, 8, 10, 14, 20):
        fp = np.mean([len(dp_bic(y, c)) > 0 for y in ys[:150]])
        if fp <= ALPHA:
            cal = float(c)
            break
    cal = cal or 30.0
    _ONLINE_NULL[n] = {
        "page": np.sort(pg),
        "sr": np.sort(sr),
        "bocpd": np.sort(bo),
        "dp_c": cal,
    }
    return _ONLINE_NULL[n]


def _alarm_time(path, thr):
    idx = np.nonzero(path > thr)[0]
    return int(idx[0]) + 1 if len(idx) else None  # +1: u[i] usa y[i+1]


# ---------------------------------------------------------------------------------------------
# Validação sintética
# ---------------------------------------------------------------------------------------------
DETECT_OFF = (
    "supF_media_ols",
    "supF_media_diff",
    "supF_media_alt",
    "supF_media_sem_tend",
    "supF_tend",
    "supLR_var",
    "supVAR_hac",
    "cusum_ols",
    "bf_media",
)
DETECT_ON = ("page", "sr", "bocpd")
DETECT_SEG = ("dp_bic", "dp_cal")
FINAIS = ("final_ols", "final_alt")
TODOS = DETECT_OFF + DETECT_ON + DETECT_SEG + FINAIS


def run_detectors(y, tau=None, full=True):
    """Roda todos os detectores numa série. Retorna (p por detector, extras)."""
    n = len(y)
    p = {}
    r_ols = test_series(y, "ols", True)
    r_diff = test_series(y, "diff", True)
    r_alt = test_series(y, "alt", True)
    r_nt = test_series(y, "ols", False)
    p["supF_media_ols"] = r_ols["media"]["p"]
    p["supF_media_diff"] = r_diff["media"]["p"]
    p["supF_media_alt"] = r_alt["media"]["p"]
    p["supF_media_sem_tend"] = r_nt["media"]["p"]
    p["supF_tend"] = r_ols["tendencia"]["p"]
    p["supLR_var"] = r_ols["variancia_raw"]["p"]
    p["supVAR_hac"] = r_ols["variancia_hac"]["p"]
    p["cusum_ols"] = r_ols["cusum"]["p"]
    p["bf_media"] = r_ols["bf"]["p"]
    ex = {"tau_media": r_ols["media"]["tau"], "r_ols": r_ols}
    if full:
        on = online_null(n)
        paths = {"page": page_path(y), "sr": sr_path(y), "bocpd": bocpd_path(y)}
        for k, pa in paths.items():
            p[k] = float(_pval(pa.max(), on[k]))
            ex[k + "_alarm"] = _alarm_time(pa, on[k][int(0.95 * len(on[k]))])
        p["dp_bic"] = 0.0 if len(dp_bic(y, 1.0)) else 1.0
        p["dp_cal"] = 0.0 if len(dp_bic(y, on["dp_c"])) else 1.0
        for nm, meth in (("final_ols", "ols"), ("final_alt", "alt")):
            br, _, _ = detect_series(y, meth)
            p[nm] = 0.0 if br else 1.0
            ex[nm + "_taus"] = [b["tau"] for b in br]
            ex[nm + "_n"] = len(br)
    return p, ex


def _cell(args):
    kind, n, par, nsim, seed, full = args
    rng = np.random.default_rng(seed)
    hits = {k: 0 for k in (TODOS if full else DETECT_OFF)}
    delays = {k: [] for k in DETECT_ON}
    taus_err = []
    cover = {}
    for _ in range(nsim):
        if kind == "nulo":
            y = simulate_null(rng, n, par)
            tau = None
        else:
            tipo, mag, pos, phi = par
            tau = round(pos * n)
            y = simulate_break(rng, n, tipo, mag, tau, phi)
        p, ex = run_detectors(y, tau, full)
        for k in hits:
            hits[k] += p[k] < ALPHA
        if tau is not None:
            for k in DETECT_ON:
                a = ex.get(k + "_alarm")
                if a is not None and p[k] < ALPHA and a >= tau:
                    delays[k].append(a - tau)
            taus_err.append(ex["tau_media"] - tau)
            pk = {
                "media": "supF_media_ols",
                "tendencia": "supF_tend",
                "variancia": "supVAR_hac",
            }[par[0]]
            if p[pk] < ALPHA:
                sc = scan(y[None, :], "ols", True)
                vec, tt = {
                    "media": (sc["F_step"][0], sc["taus"]),
                    "tendencia": (sc["F_hinge"][0], sc["taus"]),
                    "variancia": (sc["LR_var_hac"][0], sc["taus_var"]),
                }[par[0]]
                for kp in KAPPAS:
                    lo, hi, _ = _post_interval(vec / 2, tt, kp)
                    c = cover.setdefault(kp, [0, 0])
                    c[0] += lo <= tau <= hi
                    c[1] += 1
    return {
        "kind": kind,
        "n": n,
        "par": par,
        "nsim": nsim,
        "rate": {k: v / nsim for k, v in hits.items()},
        "delays": {k: v for k, v in delays.items()},
        "tau_err": taus_err,
        "cover": cover,
    }


def _init_worker(phi_diff, var_kind, temper, spike_w):
    global PHI_DIFF, VAR_KIND, TEMPER, SPIKE_W
    PHI_DIFF, VAR_KIND, TEMPER, SPIKE_W = phi_diff, var_kind, temper, spike_w


def _pool(workers):
    return ProcessPoolExecutor(
        workers,
        initializer=_init_worker,
        initargs=(PHI_DIFF, VAR_KIND, TEMPER, SPIKE_W),
    )


def _run_cells(cells, workers=None):
    workers = workers or min(20, max(1, (__import__("os").cpu_count() or 4) - 2))
    if workers == 1 or len(cells) == 1:
        return [_cell(c) for c in cells]
    with _pool(workers) as ex:
        return list(ex.map(_cell, cells, chunksize=1))


def _fam_cell(args):
    """Multiplicidade: M séries nulas independentes; FWER sem correção vs Holm."""
    M, n, nsim, seed, method = args
    rng = np.random.default_rng(seed)
    nom = hol = 0
    for _ in range(nsim):
        ps = []
        for _s in range(M):
            y = simulate_null(rng, n, "ar1_phi05")
            z, modo, _o, _l = prepare(y)
            nodes = find_nodes(z, modo, method)
            ps.append([nd["p_node"] for nd in nodes])
        allp = [p for sub in ps for p in sub]
        nom += any(p < ALPHA for p in allp)
        hol += bool(np.any(_holm(allp) < ALPHA))
    return {
        "M": M,
        "n": n,
        "nsim": nsim,
        "fwer_sem_correcao": nom / nsim,
        "fwer_holm": hol / nsim,
    }


def _multi_cell(args):
    """Duas quebras de média de sinal oposto (0,33n e 0,66n): recuperação e erro de τ."""
    n, mag, nsim, seed, method, escada = args
    rng = np.random.default_rng(seed)
    k_hist = {0: 0, 1: 0, 2: 0, 3: 0}
    err = []
    for _ in range(nsim):
        t1, t2 = int(0.33 * n), int(0.66 * n)
        y = simulate_break(rng, n, "media", mag, t1, 0.5, True, tau2=t2, escada=escada)
        br, _m, _o = detect_series(y, method)
        k_hist[min(len(br), 3)] += 1
        taus = sorted(b["tau"] for b in br)
        if len(taus) == 2:
            err.append(max(abs(taus[0] - t1), abs(taus[1] - t2)))
    return {
        "n": n,
        "cenario": "escada (2 saltos de mesmo sinal)"
        if escada
        else "pulso (sobe e volta)",
        "magnitude": mag,
        "nsim": nsim,
        "dist_k_detectado": {k: v / nsim for k, v in k_hist.items()},
        "p_exatamente_2": k_hist[2] / nsim,
        "erro_tau_mediano_quando_2": float(np.median(err)) if err else None,
    }


def _mode_cell(args):
    """Modo diferença: I(1) com salto de nível / mudança de deriva / variância (verdade conhecida)."""
    n, tipo, mag, nsim, seed, method = args
    rng = np.random.default_rng(seed)
    hit = lvl = 0
    for _ in range(nsim):
        e = rng.standard_normal(n) * 0.3
        tau = n // 2
        if tipo == "nulo":
            d = e + 0.15
        elif tipo == "nulo_t3":  # incrementos de cauda pesada (t com 3 gl), sem quebra
            d = rng.standard_t(3, n) * 0.18 + 0.15
        elif (
            tipo == "nulo_regime_volatil"
        ):  # volatilidade 4x na 2a metade: é uma quebra de variância real
            d = e + 0.15
            d[n // 2 :] = e[n // 2 :] * 4 + 0.15
        elif tipo == "salto":
            d = e + 0.15
            d[tau] += mag * 0.3
        elif tipo == "deriva":
            d = e + 0.15 + mag * 0.3 * (np.arange(n) >= tau)
        else:  # variancia
            d = e + 0.15
            d[tau:] = e[tau:] * mag + 0.15
        y = 100 + np.cumsum(d)
        br, modo, _ = detect_series(y, method)
        hit += bool(br)
        lvl += modo == "diferenca"
    return {
        "n": n,
        "cenario": tipo,
        "magnitude": mag,
        "nsim": nsim,
        "taxa_deteccao": hit / nsim,
        "frac_modo_diferenca": lvl / nsim,
    }


def _sweep_cell(args):
    """Varredura do limiar do modo diferença: FPR em AR(1) φ=0,8 e passeio aleatório; poder em quebras."""
    global PHI_DIFF
    thr, cen, n, nsim, seed = args
    PHI_DIFF = thr
    rng = np.random.default_rng(seed)
    hit = dm = 0
    for _ in range(nsim):
        if cen in ("ar1_phi08", "rw_drift", "ar1_phi05"):
            y = simulate_null(rng, n, cen)
        else:
            tipo, mag = cen.split(":")
            y = simulate_break(rng, n, tipo, float(mag), n // 2, 0.5)
        br, modo, _ = detect_series(y, {"curto": "ols", "longo": "alt", "corte": 40})
        hit += bool(br)
        dm += modo == "diferenca"
    return {
        "limiar_phi": thr,
        "cenario": cen,
        "n": n,
        "taxa_deteccao": hit / nsim,
        "frac_modo_diferenca": dm / nsim,
    }


def _var_cell(args):
    """Teste de variância: LR gaussiana (raw) contra CUSUM de quadrados com variância de longo prazo (hac)."""
    cen, n, nsim, seed = args
    rng = np.random.default_rng(seed)
    raw = hac = 0
    for _ in range(nsim):
        if cen.startswith("var:"):
            y = simulate_break(rng, n, "variancia", float(cen[4:]), n // 2, 0.5)
        else:
            y = simulate_null(rng, n, cen)
        r = test_series(y, "ols", True)
        raw += r["variancia_raw"]["p"] < ALPHA
        hac += r["variancia_hac"]["p"] < ALPHA
    return {
        "cenario": cen,
        "n": n,
        "nsim": nsim,
        "supLR_var": raw / nsim,
        "supVAR_hac": hac / nsim,
    }


def _spike_cell(args):
    """Teste de salto em diferenças: janela da escala local (w) contra escala global (w=0)."""
    global SPIKE_W
    w, cen, n, nsim, seed = args
    SPIKE_W = w
    _NULLS.clear()
    rng = np.random.default_rng(seed)
    hit = 0
    for _ in range(nsim):
        e = rng.standard_normal(n)
        if cen == "regime_volatil":  # volatilidade 4x na 2a metade, sem salto isolado
            e[n // 2 :] *= 4
        elif cen == "cauda_t3":
            e = rng.standard_t(3, n)
        elif cen.startswith("salto"):
            e[n // 2] += float(cen[5:])
        nd = _node_test(e, "diferenca", "alt", False, None)
        hit += nd["todos"]["media"] < ALPHA
    _NULLS.clear()
    return {"w": w, "cenario": cen, "n": n, "nsim": nsim, "taxa_deteccao": hit / nsim}


def _delay_cell(args):
    """Atraso do procedimento offline: série truncada m anos após a quebra (npre=40 anos antes)."""
    tipo, mag, nsim, seed, method = args
    rng = np.random.default_rng(seed)
    ms = (3, 5, 8, 12, 20, 40)
    hit = {m: 0 for m in ms}
    for _ in range(nsim):
        y = simulate_break(rng, 80, tipo, mag, 40, 0.5)
        for m in ms:
            br, _mo, _o = detect_series(y[: 40 + m], method)
            hit[m] += bool(br)
    return {
        "tipo": tipo,
        "magnitude": mag,
        "nsim": nsim,
        "tpr_apos_m_anos": {str(m): hit[m] / nsim for m in ms},
    }


def _oracle_cell(args):
    """Oráculo: τ conhecido ⇒ um único candidato (sem varredura, sem multiplicidade em τ)."""
    tipo, n, mag, nsim, seed = args
    rng = np.random.default_rng(seed)
    tau = n // 2
    lo = _range(n)[0]
    j = tau - lo
    hits = hits_sup = 0
    for _ in range(nsim):
        y = simulate_break(rng, n, tipo, mag, tau, 0.5)
        sc = scan(y[None, :], "ols", True)
        tab = null_table(n, float(sc["phi"][0]), "ols", True)
        if tipo == "media":
            s_or, s_sup, k = sc["F_step"][0][j], sc["F_step"][0].max(), "step"
            tab_or = np.sort(null_table_fixed(n, float(sc["phi"][0]), "step", j))
        elif tipo == "tendencia":
            s_or, s_sup, k = sc["F_hinge"][0][j], sc["F_hinge"][0].max(), "hinge"
            tab_or = np.sort(null_table_fixed(n, float(sc["phi"][0]), "hinge", j))
        else:
            kk = np.nonzero(sc["taus_var"] == tau)[0]
            idx = int(kk[0]) if len(kk) else len(sc["taus_var"]) // 2
            s_or, s_sup, k = sc["LR_var"][0][idx], sc["LR_var"][0].max(), "var"
            tab_or = np.sort(null_table_fixed(n, float(sc["phi"][0]), "var", idx))
        hits += _pval(s_or, tab_or) < ALPHA
        hits_sup += _pval(s_sup, tab[k]) < ALPHA
    return {
        "tipo": tipo,
        "n": n,
        "magnitude": mag,
        "nsim": nsim,
        "tpr_oraculo": hits / nsim,
        "tpr_sup_tau_desconhecido": hits_sup / nsim,
    }


_FIXED: dict = {}


def null_table_fixed(n, phi, kind, j, B=B_CACHE, seed=23):
    """Nulo da estatística em UM τ fixo (índice ``j`` da grade)."""
    nb, pb = _bucket(n, phi)
    key = (nb, pb, kind, j, B)
    if key in _FIXED:
        return _FIXED[key]
    rng = np.random.default_rng(seed + nb)
    Y = ar1(rng, nb, pb, rows=B)
    sc = scan(Y, "ols", True)
    jj = (
        min(j, sc["F_step"].shape[1] - 1)
        if kind != "var"
        else min(j, sc["LR_var"].shape[1] - 1)
    )
    col = {"step": "F_step", "hinge": "F_hinge", "var": "LR_var"}[kind]
    _FIXED[key] = sc[col][:, jj]
    return _FIXED[key]


MAGS = {
    "media": (1.5, 3.0, 5.0, 8.0),
    "variancia": (1.5, 2.0, 3.0, 5.0),
    "tendencia": (2.0, 4.0, 7.0, 12.0),
}
NS = (20, 30, 50, 100, 200)


def _escolher(nulo, poder):
    """Regra de escolha do procedimento final, POR n: entre final_ols e final_alt, o de maior poder médio
    (posição central) desde que o FPR médio sob AR(1) (φ=0, 0,5, 0,8 e com tendência) não passe de 0,08;
    se nenhum cumprir, o de menor FPR. Não olha as séries reais. Devolve {'curto','longo','corte'}."""
    por_n, cand = {}, {}
    for n in sorted({c["n"] for c in nulo}):
        row = {}
        for f in FINAIS:
            fpr = [
                c["fpr"][f]
                for c in nulo
                if c["n"] == n
                and c["nulo"] in ("ar1_phi0", "ar1_phi05", "ar1_phi08", "ar1_tendencia")
            ]
            pw = [c["tpr"][f] for c in poder if c["n"] == n and c["posicao"] == 0.5]
            row[f] = {
                "fpr_medio": float(np.mean(fpr)),
                "poder_medio": float(np.mean(pw)) if pw else 0.0,
            }
        ok = {f: v for f, v in row.items() if v["fpr_medio"] <= 0.08}
        best = (
            max(ok, key=lambda f: ok[f]["poder_medio"])
            if ok
            else min(row, key=lambda f: row[f]["fpr_medio"])
        )
        por_n[n] = best.split("_")[1]
        cand[str(n)] = {**row, "escolhido": best}
    ns = sorted(por_n)
    longo = por_n[ns[-1]]
    corte = ns[
        0
    ]  # primeiro n da sequência final de 'longo' (abaixo dele, usa-se o 'curto')
    for n in ns:
        if por_n[n] != longo:
            corte = next((m for m in ns if m > n), n)
    curto = next((por_n[n] for n in ns if por_n[n] != longo), longo)
    if curto == longo:
        corte = 0
    return {"curto": curto, "longo": longo, "corte": corte}, cand


def run_validation(nsim=200, nsim_nulo=300, seed=2026, workers=None, quick=False):
    """Validação completa; devolve o dict de ``validacao`` do JSON."""
    global TEMPER, PHI_DIFF, VAR_KIND, SPIKE_W
    ns = (30, 100) if quick else NS
    nulos = ("ar1_phi05", "ar1_tendencia") if quick else NULOS
    ss = np.random.SeedSequence(seed)
    sd = lambda: int(ss.spawn(1)[0].generate_state(1)[0])
    # 0. escolhas prévias, só com dados sintéticos: variância (raw vs hac) e limiar do modo diferença
    vc = [
        (c, n, nsim, sd())
        for c in (
            "ar1_phi05",
            "heterocedastico",
            "outliers",
            "ar1_tendencia",
            "var:2.0",
        )
        for n in ((100,) if quick else (50, 100, 200))
    ]
    var_res = _pool_map(_var_cell, vc, workers)
    fpr_v = {
        k: max(r[k] for r in var_res if not r["cenario"].startswith("var:"))
        for k in ("supLR_var", "supVAR_hac")
    }
    VAR_KIND = "var" if fpr_v["supLR_var"] < fpr_v["supVAR_hac"] else "var_hac"
    spk = _pool_map(
        _spike_cell,
        [
            (w, c, n, nsim, sd())
            for w in (3, 5, 10, 0)
            for c in ("branco", "regime_volatil", "cauda_t3", "salto8")
            for n in ((100,) if quick else (50, 120))
        ],
        workers,
    )

    def _sp(w, c):
        v = [r["taxa_deteccao"] for r in spk if r["w"] == w and r["cenario"] == c]
        return float(np.mean(v))

    # regra: a menor janela local cujo FPR no regime volátil fica <= 0,15 e no ruído branco <= 0,08,
    # com o maior poder para salto; escala global (w=0) só se nenhuma local cumprir
    okw = [
        w
        for w in (3, 5, 10)
        if _sp(w, "regime_volatil") <= 0.15 and _sp(w, "branco") <= 0.08
    ]
    SPIKE_W = max(okw, key=lambda w: _sp(w, "salto8")) if okw else 0
    thrs = (0.6, 0.7, 0.8, 0.9)
    cens = ("ar1_phi08", "rw_drift", "media:5.0", "tendencia:7.0", "variancia:3.0")
    sw = _pool_map(
        _sweep_cell,
        [
            (t, c, n, nsim, sd())
            for t in thrs
            for c in cens
            for n in ((100,) if quick else (50, 100))
        ],
        workers,
    )
    escolha = {}
    for t in thrs:
        rows = [r for r in sw if r["limiar_phi"] == t]
        f8 = np.mean([r["taxa_deteccao"] for r in rows if r["cenario"] == "ar1_phi08"])
        frw = np.mean(
            [
                r["taxa_deteccao"]
                for r in rows
                if r["cenario"] == "rw_drift" and r["n"] == 100
            ]
        )
        pw = np.mean([r["taxa_deteccao"] for r in rows if ":" in r["cenario"]])
        escolha[t] = {
            "fpr_ar1_phi08": float(f8),
            "fpr_passeio_aleatorio_n100": float(frw),
            "poder_medio": float(pw),
        }
    ok = {
        t: v
        for t, v in escolha.items()
        if v["fpr_ar1_phi08"] <= 0.08 and v["fpr_passeio_aleatorio_n100"] <= 0.10
    }
    # regra: o MAIOR limiar que mantém o FPR (AR(1) φ=0,8 <= 0,08 e I(1) n=100 <= 0,10): diferenciar o
    # mínimo de séries, porque diferenciar custa poder; o poder médio fica registrado
    PHI_DIFF = (
        max(ok)
        if ok
        else min(escolha, key=lambda t: escolha[t]["fpr_passeio_aleatorio_n100"])
    )
    # 1. nulo
    cells = [("nulo", n, k, nsim_nulo, sd(), True) for k in nulos for n in ns]
    res = _run_cells(cells, workers)
    nulo = [
        {"nulo": c["par"], "n": c["n"], "nsim": c["nsim"], "fpr": c["rate"]}
        for c in res
    ]
    # 2. poder por magnitude (posição central) + bordas
    tipos = ("media",) if quick else TIPOS
    cells = [
        ("quebra", n, (t, m, 0.5, 0.5), nsim, sd(), True)
        for t in tipos
        for n in ns
        for m in MAGS[t]
    ]
    pos_list = (0.1, 0.25, 0.75, 0.9) if not quick else (0.1,)
    cells += [
        ("quebra", 100, (t, MAGS[t][2], pos, 0.5), nsim, sd(), True)
        for t in tipos
        for pos in pos_list
    ]
    res_p = _run_cells(cells, workers)
    poder, atraso, cover_tot = [], [], {}
    for c in res_p:
        tipo, mag, pos, phi = c["par"]
        poder.append(
            {
                "tipo": tipo,
                "n": c["n"],
                "magnitude": mag,
                "posicao": pos,
                "phi": phi,
                "nsim": c["nsim"],
                "tpr": c["rate"],
                "erro_tau_mediano_abs": float(np.median(np.abs(c["tau_err"])))
                if c["tau_err"]
                else None,
            }
        )
        if pos == 0.5:
            atraso.append(
                {
                    "tipo": tipo,
                    "n": c["n"],
                    "magnitude": mag,
                    "online": {
                        k: {
                            "fracao_detectada_no_prazo": len(v) / c["nsim"],
                            "atraso_mediano_anos": float(np.median(v)) if v else None,
                        }
                        for k, v in c["delays"].items()
                    },
                }
            )
        if pos == 0.5:
            for kp, (a, b) in c["cover"].items():
                cover_tot.setdefault((tipo, kp), []).append((a, b, c["n"], mag))
    cobertura = {}
    for (tipo, kp), cells_ in sorted(cover_tot.items()):
        ok_c = [a / b for a, b, _, _ in cells_ if b >= 20]
        cobertura.setdefault(tipo, {})[str(kp)] = {
            "media_das_celulas": float(np.mean(ok_c)) if ok_c else None,
            "minimo_celula": float(np.min(ok_c)) if ok_c else None,
            "n_celulas": len(ok_c),
        }
    TEMPER = float(KAPPAS[-1])
    for kp in KAPPAS:
        vs = [
            cobertura[t][str(kp)]["media_das_celulas"]
            for t in cobertura
            if cobertura[t].get(str(kp))
        ]
        if vs and min(v for v in vs if v is not None) >= 0.9:
            TEMPER = float(kp)
            break
    # 3. escolha do procedimento
    method, cand = _escolher(nulo, poder)
    best = method
    # 4. extras com o procedimento escolhido
    ex = {}
    fam = [(M, 50, 100 if not quick else 8, sd(), method) for M in (1, 10, 25)]
    ex["multiplicidade"] = _pool_map(_fam_cell, fam, workers)
    multi = [
        (n, 6.0, nsim, sd(), method, esc)
        for esc in (True, False)
        for n in (50, 100, 200)
    ]
    ex["duas_quebras"] = _pool_map(
        _multi_cell, multi if not quick else multi[:1], workers
    )
    modo = [
        (n, t, m, nsim, sd(), method)
        for n in (50, 100)
        for t, m in (
            ("nulo", 0),
            ("nulo_t3", 0),
            ("salto", 8),
            ("salto", 14),
            ("deriva", 1.0),
            ("deriva", 2.0),
            ("variancia", 3.0),
        )
    ]
    ex["modo_diferenca_i1"] = _pool_map(
        _mode_cell, modo if not quick else modo[:2], workers
    )
    dl = [(t, MAGS[t][i], nsim, sd(), method) for t in tipos for i in (1, 2, 3)]
    ex["atraso_offline"] = _pool_map(_delay_cell, dl, workers)
    orc = [
        (t, n, MAGS[t][i], nsim, sd())
        for t in tipos
        for n in (50, 100)
        for i in (0, 1, 2)
    ]
    ex["oraculo"] = _pool_map(_oracle_cell, orc, workers)
    return {
        "parametros": {
            "nsim_poder": nsim,
            "nsim_nulo": nsim_nulo,
            "alpha": ALPHA,
            "seed": seed,
            "B_nulo_cache": B_CACHE,
            "n": list(ns),
            "magnitudes": {k: list(v) for k, v in MAGS.items()},
            "unidades": {
                "media": "salto em desvios-padrão marginais",
                "variancia": "razão entre desvios-padrão das inovações (depois/antes)",
                "tendencia": "deriva extra acumulada ao fim da série, em desvios-padrão marginais",
            },
            "dgp_quebra": "AR(1) φ=0,5 + tendência linear incômoda (0,5-3σ) + quebra em τ=n/2",
        },
        "nulo": nulo,
        "poder": poder,
        "atraso": atraso,
        "oraculo_tau_conhecido": ex["oraculo"],
        "escolhas_previas": {
            "salto_escala_local": {"w_escolhido": SPIKE_W, "celulas": spk},
            "variancia": {
                "fpr_maximo_sob_nulos": fpr_v,
                "escolhido": VAR_KIND,
                "celulas": var_res,
            },
            "modo_diferenca": {
                "limiar_phi_escolhido": PHI_DIFF,
                "por_limiar": {str(k): v for k, v in escolha.items()},
                "celulas": sw,
            },
        },
        "procedimento_final": {
            "escolhido": best,
            "candidatos": cand,
            "criterio": _escolher.__doc__,
        },
        "cobertura_intervalo_tau_90": {
            "por_temperagem": cobertura,
            "temperagem_escolhida": TEMPER,
        },
        "multiplicidade": ex["multiplicidade"],
        "duas_quebras": ex["duas_quebras"],
        "modo_diferenca_i1": ex["modo_diferenca_i1"],
        "atraso_offline": ex["atraso_offline"],
        "metodo_escolhido": method,
    }


def _pool_map(fn, args, workers=None):
    workers = workers or min(20, max(1, (__import__("os").cpu_count() or 4) - 2))
    if workers == 1 or len(args) == 1:
        return [fn(a) for a in args]
    with _pool(workers) as ex:
        return list(ex.map(fn, args, chunksize=1))


# ---------------------------------------------------------------------------------------------
# Aplicação às séries reais
# ---------------------------------------------------------------------------------------------
MIN_ANOS = 20


def _run_consecutivo(pontos):
    """Maior trecho de anos consecutivos (sem interpolar)."""
    pts = sorted((int(a), float(v)) for a, v in pontos)
    best, cur = [], []
    for a, v in pts:
        if cur and a == cur[-1][0] + 1:
            cur.append((a, v))
        else:
            cur = [(a, v)]
        if len(cur) > len(best):
            best = list(cur)
    return best


def datas_historicas(economia: dict, historia: dict):
    """Datas de mudança drástica: ``mudancas_drasticas`` dos ciclos + eventos de ruptura/economia.
    Retorna (primario, completo): listas de (ano, id)."""
    prim = []
    for c in economia.get("ciclos", []):
        for m in c.get("mudancas_drasticas", []):
            try:
                prim.append((int(str(m["data"])[:4]), m["id"]))
            except (KeyError, ValueError):
                pass
    cats = {"economia", "crise", "constituicao", "golpe", "abertura"}
    ev_prim, ev_all = [], []
    for e in historia.get("eventos", []):
        try:
            a = int(str(e["data"])[:4])
        except (KeyError, ValueError):
            continue
        ev_all.append((a, e["id"]))
        if e.get("categoria") in cats:
            ev_prim.append((a, e["id"]))
    return prim + ev_prim, prim + ev_all, prim


def perm_cruzamento(breaks, spans, anos_h, tol=2, nperm=20000, seed=7):
    """Teste de permutação: quantas quebras caem a ≤ tol anos de uma data histórica, contra quebras
    com o mesmo número por série e anos sorteados uniformemente dentro do intervalo testável da série."""
    rng = np.random.default_rng(seed)
    anos_h = np.unique(np.asarray(anos_h, int))
    breaks = [(i, a) for i, a in breaks]

    def near(a):
        return bool(np.any(np.abs(anos_h - a) <= tol))

    obs = sum(near(a) for _, a in breaks)
    if not breaks:
        return {
            "coincidencias": 0,
            "n_quebras": 0,
            "esperado_por_acaso": None,
            "p_permutacao": None,
            "n_datas_historicas_distintas": len(anos_h),
        }
    cover = []
    for si, (a0, a1) in spans.items():
        ys = np.arange(a0, a1 + 1)
        cover.append(np.mean([near(a) for a in ys]))
    sims = np.empty(nperm)
    cache = {}
    for si, (a0, a1) in spans.items():
        ys = np.arange(a0, a1 + 1)
        cache[si] = np.array([near(a) for a in ys])
    ks = [si for si, _ in breaks]
    for r in range(nperm):
        sims[r] = sum(cache[si][rng.integers(len(cache[si]))] for si in ks)
    return {
        "coincidencias": int(obs),
        "n_quebras": len(breaks),
        "esperado_por_acaso": float(sims.mean()),
        "desvio_padrao_nulo": float(sims.std()),
        "p_permutacao": float((1 + np.sum(sims >= obs)) / (nperm + 1)),
        "fracao_anos_a_menos_de_tol_de_uma_data": float(
            np.mean(np.concatenate([cache[s] for s in cache]))
        ),
        "tolerancia_anos": tol,
        "n_datas_historicas_distintas": len(anos_h),
        "nperm": nperm,
    }


def _poder_tipico(val, n, method):
    """TPR médio do procedimento final (posição central, todas as magnitudes e tipos) no n validado mais próximo."""
    if not val:
        return None
    ns = sorted({c["n"] for c in val["poder"]})
    nn = min(ns, key=lambda x: abs(x - n))
    meth = method["curto"] if n < method["corte"] else method["longo"]
    k = "final_" + meth
    v = [c["tpr"][k] for c in val["poder"] if c["n"] == nn and c["posicao"] == 0.5]
    return {
        "n_validado_mais_proximo": nn,
        "tpr_medio_do_procedimento": round(float(np.mean(v)), 3),
    }


def aplicar(
    series_json: dict, economia: dict, historia: dict, method, B=10000, tol=2, val=None
):
    """Aplica o procedimento final às séries reais, com Holm sobre TODOS os nós (séries × candidatas)."""
    h_prim, h_all, h_mud = datas_historicas(economia, historia)
    per_series, lacunas = [], []
    all_nodes = []
    for s in series_json["series"]:
        run = _run_consecutivo(s["pontos"])
        if len(run) < MIN_ANOS:
            lacunas.append(
                {
                    "serie": s["id"],
                    "motivo": f"menos de {MIN_ANOS} anos consecutivos (n={len(run)}); poder desprezível na validação",
                }
            )
            continue
        anos = np.array([a for a, _ in run])
        y = np.array([v for _, v in run])
        z, modo, off, log = prepare(y)
        nodes = find_nodes(z, modo, method, exact=True, B=B)
        per_series.append(
            {
                "s": s,
                "anos": anos,
                "n": len(y),
                "modo": modo,
                "off": off,
                "log": log,
                "nodes": nodes,
            }
        )
        all_nodes.extend(nodes)
    ps = [nd["p_node"] for nd in all_nodes]
    holm = _holm(ps) if ps else []
    qbh = _bh(ps) if ps else []
    for nd, a, q in zip(all_nodes, holm, qbh):
        nd["p_adj"] = float(a)
        nd["q_bh"] = float(q)
    out_series, econ_breaks, spans, esp_acaso = [], [], {}, {}
    meta_anos = {}
    for ps_ in per_series:
        s, anos, off = ps_["s"], ps_["anos"], ps_["off"]
        metod_years = [q["ano"] for q in s.get("quebras", [])]
        brk = []
        for nd in ps_["nodes"]:
            if nd["p_adj"] >= ALPHA:
                continue
            ano = int(anos[nd["tau"] + off])
            lo, hi = (
                int(anos[min(max(i + off, 0), len(anos) - 1)]) for i in nd["intervalo"]
            )
            artef = any(abs(ano - m) <= 1 for m in metod_years)
            prox = sorted({i for a, i in h_prim if abs(a - ano) <= tol})
            brk.append(
                {
                    "ano": ano,
                    "intervalo": [lo, hi],
                    "tipo": nd["tipo"],
                    "evidencia": {
                        "estatistica": round(nd["stat"], 3),
                        "p_ajustado": round(nd["p_adj"], 5),
                        "q_bh": round(nd["q_bh"], 5),
                        "p_bruto_no_no": round(nd["p_node"] / 3, 5),
                    },
                    "artefato_metodologico": artef,
                    "eventos_historicos_proximos": prox,
                }
            )
            if not artef:
                econ_breaks.append((s["id"], ano))
        brk.sort(key=lambda b: b["ano"])
        spans[s["id"]] = (int(anos[0] + 5), int(anos[-1] - 5))
        # controle: artefatos metodológicos dentro da janela testada e se foram recuperados
        ctrl = [m for m in metod_years if anos[0] + 5 <= m <= anos[-1] - 5]
        rec_nom = [
            m
            for m in ctrl
            if any(
                abs(int(anos[nd["tau"] + off]) - m) <= 1 and nd["p_node"] < ALPHA
                for nd in ps_["nodes"]
            )
        ]
        rec_adj = [m for m in ctrl if any(abs(b["ano"] - m) <= 1 for b in brk)]
        span_len = max(len(anos) - 9, 1)
        esp_acaso[s["id"]] = len(ctrl) * min(1.0, len(brk) * 3 / span_len)
        out_series.append(
            {
                "id": s["id"],
                "rotulo": s["rotulo"],
                "n": ps_["n"],
                "periodo": [int(anos[0]), int(anos[-1])],
                "modo": ps_["modo"],
                "log": ps_["log"],
                "quebras": brk,
                "sem_quebra_detectada": not brk,
                "poder_baixo": bool(
                    (_poder_tipico(val, ps_["n"], method) or {}).get(
                        "tpr_medio_do_procedimento", 1
                    )
                    < 0.5
                ),
                "poder_validado": _poder_tipico(val, ps_["n"], method),
                "quebras_sugestivas_nao_contadas": [
                    {
                        "ano": int(anos[min(nd["tau"] + off, len(anos) - 1)]),
                        "tipo": nd["tipo"],
                        "q_bh": round(nd["q_bh"], 5),
                        "p_holm": round(nd["p_adj"], 5),
                    }
                    for nd in ps_["nodes"]
                    if nd["q_bh"] < ALPHA <= nd["p_adj"]
                ],
                "controle_metodologico": {
                    "anos_testaveis": ctrl,
                    "recuperados_p_bruto_5pct": rec_nom,
                    "recuperados_apos_holm": rec_adj,
                },
                "nos_testados": [
                    {
                        "ano": int(anos[min(nd["tau"] + off, len(anos) - 1)]),
                        "tipo": nd["tipo"],
                        "p_bruto": round(nd["p_node"] / 3, 5),
                        "p_holm": round(nd["p_adj"], 5),
                    }
                    for nd in ps_["nodes"]
                ],
            }
        )
        meta_anos[s["id"]] = ctrl
    cruz = perm_cruzamento(econ_breaks, spans, [a for a, _ in h_prim], tol)
    sens = {}
    for nome, conj in (
        ("so_mudancas_drasticas", h_mud),
        ("primario_mais_eventos_de_ruptura", h_prim),
        ("todos_eventos_de_historia", h_all),
    ):
        for tl in (0, 1, 2):
            r_ = perm_cruzamento(
                econ_breaks, spans, [a for a, _ in conj], tl, nperm=5000
            )
            sens[f"{nome}|tol={tl}"] = {
                k: r_.get(k)
                for k in (
                    "coincidencias",
                    "esperado_por_acaso",
                    "p_permutacao",
                    "n_datas_historicas_distintas",
                    "fracao_anos_a_menos_de_tol_de_uma_data",
                )
            }
    cruz["sensibilidade"] = sens
    cruz["aviso"] = (
        "Coincidência não é causa. Com datas históricas densas, quase todo ano está perto de algum "
        "evento (ver fracao_anos_a_menos_de_tol_de_uma_data); o esperado por acaso já é alto."
    )
    # controle metodológico agregado
    tot = sum(len(x["controle_metodologico"]["anos_testaveis"]) for x in out_series)
    rn = sum(
        len(x["controle_metodologico"]["recuperados_p_bruto_5pct"]) for x in out_series
    )
    ra = sum(
        len(x["controle_metodologico"]["recuperados_apos_holm"]) for x in out_series
    )
    return (
        out_series,
        lacunas,
        cruz,
        {
            "artefatos_testaveis": tot,
            "recuperados_p_bruto_5pct": rn,
            "recuperados_apos_holm": ra,
            "esperado_por_acaso_recuperados_apos_holm": round(
                sum(esp_acaso.values()), 3
            ),
            "n_nos_testados": len(all_nodes),
        },
    )


def build(quick=False, workers=None, nsim=200, reusar_validacao=False):
    """Valida, escolhe o procedimento, aplica às séries reais e grava web/public/data/quebras.json.
    ``reusar_validacao`` relê out/quebras_validacao.json (e restaura as escolhas), para iterar na aplicação."""
    global PHI_DIFF, VAR_KIND, TEMPER, SPIKE_W
    cache = Path("out/quebras_validacao.json")
    if reusar_validacao and cache.exists():
        val = json.loads(cache.read_text(encoding="utf-8"))
        val["metodo_escolhido"], cand_ = _escolher(val["nulo"], val["poder"])
        val["procedimento_final"].update(
            escolhido=val["metodo_escolhido"], candidatos=cand_
        )
        PHI_DIFF = float(
            val["escolhas_previas"]["modo_diferenca"]["limiar_phi_escolhido"]
        )
        VAR_KIND = val["escolhas_previas"]["variancia"]["escolhido"]
        TEMPER = float(val["cobertura_intervalo_tau_90"]["temperagem_escolhida"])
        SPIKE_W = int(val["escolhas_previas"]["salto_escala_local"]["w_escolhido"])
    else:
        val = run_validation(
            nsim=nsim if not quick else 40,
            nsim_nulo=300 if not quick else 80,
            quick=quick,
            workers=workers,
        )
        if not quick:
            cache.parent.mkdir(exist_ok=True)
            cache.write_text(json.dumps(val, default=float), encoding="utf-8")
    method = val["metodo_escolhido"]
    series_json = json.loads(
        (DATA / "series_historicas.json").read_text(encoding="utf-8")
    )
    economia = json.loads(
        (DATA / "economia_historica.json").read_text(encoding="utf-8")
    )
    historia = json.loads((DATA / "historia.json").read_text(encoding="utf-8"))
    series, lacunas, cruz, ctrl = aplicar(
        series_json,
        economia,
        historia,
        method,
        B=10000 if not quick else 2000,
        val=val,
    )
    res = {
        "meta": {
            "gerado_em": datetime.now(UTC).isoformat(timespec="seconds"),
            "aviso": (
                "Quebra estatística não é causa nem evento: coincidência com datas históricas é "
                "descritiva. Muitas quebras são artefatos de mudança metodológica das séries (marcadas). "
                "Com n pequeno e persistência alta, o detector tem poder baixo e FPR acima do nominal "
                "sob heterocedasticidade/outliers/I(1): ver validacao."
            ),
            "metodo": {
                "procedimento": f"sup-F (degrau, dobradiça) e CUSUM de quadrados (variância, kind={VAR_KIND}) com p por "
                f"bootstrap AR(1); φ̂ '{method['longo']}' para n>={method['corte']} e '{method['curto']}' abaixo; "
                "mínimo dos 3 tipos x3, segmentação binária, Holm sobre todos os nós testados de todas as séries",
                "transformacao": f"log se positiva e amplitude>5x; modo diferença se φ̂>{PHI_DIFF}",
                "alpha": ALPHA,
                "bootstrap_B_real": 10000,
                "intervalo_tau": f"posterior perfil exp(F/2/T), T={TEMPER} escolhido na validação, 90% central",
                "controle_metodologico": ctrl,
            },
            "lacunas": lacunas
            + [
                {
                    "serie": "(todas)",
                    "motivo": "Séries com <20 anos consecutivos, ou pontos esparsos, não são testadas; "
                    "sem interpolação.",
                }
            ],
        },
        "validacao": {
            "nulo": val["nulo"],
            "poder": val["poder"],
            "atraso": val["atraso"],
            "atraso_offline": val["atraso_offline"],
            "oraculo_tau_conhecido": val["oraculo_tau_conhecido"],
            "procedimento_final": val["procedimento_final"],
            "cobertura_intervalo_tau_90": val["cobertura_intervalo_tau_90"],
            "multiplicidade": val["multiplicidade"],
            "duas_quebras": val["duas_quebras"],
            "modo_diferenca_i1": val["modo_diferenca_i1"],
            "escolhas_previas": val["escolhas_previas"],
            "parametros": val["parametros"],
        },
        "series": series,
        "cruzamento_historia": cruz,
    }
    out = DATA / "quebras.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        json.dumps(res, ensure_ascii=False, indent=1, default=float), encoding="utf-8"
    )
    return res

"""Métricas forenses por município a partir das seções, com triagem (não prova).

Decisões de método (todas visíveis na UI):
- Benford de 2º dígito é calculado mas **fora do score**: a validação sintética mostrou FPR ≈ 98%
  em contagens por seção.
- A correlação comparecimento×voto é lida pelo z *empírico nacional* (`rho_z`), porque a
  heterogeneidade legítima faz o p-valor paramétrico ser anticonservador em dados reais.
- Testes de dígito exigem muitas seções; abaixo do mínimo ficam `None` e a confiança cai.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats

from .forensics import digits, fingerprint, spatial

MIN_SEC_DIGITOS = 50
Z_FLAG = 4.0

TESTES = [
    {
        "chave": "zt",
        "rotulo": "Comparecimento vs. vizinhos",
        "descricao": "z robusto do comparecimento municipal contra a mediana dos municípios vizinhos.",
        "interpretacao": "|z| ≥ 4 indica comparecimento muito fora do padrão local.",
        "limitacoes": "Comparecimento varia com migração, transporte e voto facultativo; ilhas e fronteiras têm poucos vizinhos.",
    },
    {
        "chave": "zs",
        "rotulo": "Voto vs. vizinhos",
        "descricao": "z robusto da participação do candidato nos votos válidos contra os vizinhos.",
        "interpretacao": "|z| ≥ 4 indica município muito diferente do entorno para aquele candidato.",
        "limitacoes": "Voto tem fortes razões locais legítimas (lideranças, religião, economia). Único teste sensível a transferência de votos.",
    },
    {
        "chave": "zn",
        "rotulo": "Brancos+nulos vs. vizinhos",
        "descricao": "z robusto da taxa de brancos e nulos sobre o comparecimento.",
        "interpretacao": "Taxa muito alta ou baixa pode indicar problema de participação ou de registro.",
        "limitacoes": "Depende de escolaridade, idade e rotas de acesso.",
    },
    {
        "chave": "ld_p",
        "rotulo": "Último dígito (uniformidade)",
        "descricao": "χ² do último dígito das contagens por seção (≥ 50 votos) contra a uniforme.",
        "interpretacao": "p baixo (após correção) sugere números não aleatórios, p. ex. contagens fabricadas.",
        "limitacoes": "Só detecta fabricação de números; cego a enchimento e transferência (validação sintética).",
    },
    {
        "chave": "rho",
        "rotulo": "Correlação comparecimento × voto (seções)",
        "descricao": "Spearman entre comparecimento e voto do candidato nas seções do município; lido por z empírico nacional.",
        "interpretacao": "Correlação positiva extrema é a assinatura teórica de enchimento de urnas.",
        "limitacoes": "Perfis sociais podem produzir correlação legítima; seções de bairros ricos e pobres diferem.",
    },
    {
        "chave": "mult5_p",
        "rotulo": "Excesso de múltiplos de 5",
        "descricao": "Binomial unilateral: contagens múltiplas de 5 vs. 20% esperado.",
        "interpretacao": "Excesso sugere arredondamento humano.",
        "limitacoes": "Poucas seções ⇒ pouco poder.",
    },
    {
        "chave": "b2_p",
        "rotulo": "Benford 2º dígito (fora do score)",
        "descricao": "χ² do 2º dígito contra Benford.",
        "interpretacao": "NÃO usar como evidência.",
        "limitacoes": "Na validação sintética rejeitou 98% dos municípios *sem* fraude: contagens por seção não seguem Benford.",
    },
]


def _bh(p: np.ndarray) -> np.ndarray:
    """Benjamini–Hochberg q-valores (NaN preservados)."""
    q = np.full_like(p, np.nan, dtype=float)
    ok = np.isfinite(p)
    pv = p[ok]
    order = np.argsort(pv)
    ranked = pv[order] * len(pv) / (np.arange(len(pv)) + 1)
    ranked = np.minimum.accumulate(ranked[::-1])[::-1]
    out = np.empty_like(pv)
    out[order] = np.minimum(ranked, 1.0)
    q[ok] = out
    return q


def _num(x) -> float | None:
    return None if x is None or not np.isfinite(x) else float(round(x, 4))


def por_municipio(
    secoes: pd.DataFrame,
    top2: list[int],
    nb: dict[str, list[str]],
    cd2ibge: dict[int, str],
) -> dict:
    s = secoes[secoes.cd.isin(cd2ibge)].copy()
    s["ibge"] = s.cd.map(cd2ibge)
    s["turnout"] = s.comp / s.aptos.clip(lower=1)
    cols = [f"v{c}" for c in top2]

    base: dict[str, dict] = {}
    for ibge, g in s.groupby("ibge"):
        aptos, comp, val = int(g.aptos.sum()), int(g.comp.sum()), int(g.validos.sum())
        row = {
            "n_secoes": len(g),
            "aptos": aptos,
            "turnout": comp / aptos if aptos else None,
            "nulbr": (g.brancos.sum() + g.nulos.sum()) / comp if comp else None,
            "share": {str(c): (g[f"v{c}"].sum() / val if val else None) for c in top2},
        }
        # dígitos nos votos dos dois candidatos (pool)
        pool = np.concatenate([g[c].to_numpy() for c in cols])
        ld = digits.last_digit_uniform(pool, min_n=2 * MIN_SEC_DIGITOS)
        b2 = digits.benford_2bl(pool, min_n=2 * MIN_SEC_DIGITOS)
        row["ld_p"], row["b2_p"] = ld["p"], b2["p"]
        row["mult5_p"] = digits.multiples_excess(pool)
        # correlação comparecimento × voto
        rhos = []
        if len(g) >= 30:
            for c in top2:
                share = g[f"v{c}"] / g.validos.clip(lower=1)
                rhos.append(float(stats.spearmanr(g.turnout, share).statistic))
        row["rho"] = max(rhos) if rhos else None
        row["bunching"] = fingerprint.bunching(
            g.turnout.to_numpy(),
            (g[cols].max(axis=1) / g.validos.clip(lower=1)).to_numpy(),
        )
        base[ibge] = row

    zt = spatial.robust_z({k: v["turnout"] for k, v in base.items()}, nb)
    zn = spatial.robust_z({k: v["nulbr"] for k, v in base.items()}, nb)
    zs = {
        str(c): spatial.robust_z({k: v["share"][str(c)] for k, v in base.items()}, nb)
        for c in top2
    }
    # z empírico nacional (todos os municípios como referência)
    rv = np.array([v["rho"] for v in base.values() if v["rho"] is not None])
    med, mad = (
        float(np.median(rv)),
        1.4826 * float(np.median(np.abs(rv - np.median(rv))))
        if rv.size
        else (0.0, 1.0),
    )
    rho_z = {
        k: (None if v["rho"] is None else (v["rho"] - med) / max(mad, 1e-6))
        for k, v in base.items()
    }

    ids = list(base)
    ldq = dict(
        zip(
            ids,
            _bh(
                np.array(
                    [
                        np.nan if base[i]["ld_p"] is None else base[i]["ld_p"]
                        for i in ids
                    ]
                )
            ),
        )
    )
    m5q = dict(
        zip(
            ids,
            _bh(
                np.array(
                    [
                        np.nan if base[i]["mult5_p"] is None else base[i]["mult5_p"]
                        for i in ids
                    ]
                )
            ),
        )
    )

    linhas = {}
    for i in ids:
        b = base[i]
        z_s = {c: _num(zs[c][i]) for c in zs}
        flags = []
        if zt[i] is not None and abs(zt[i]) >= Z_FLAG:
            flags.append("zt")
        if any(v is not None and abs(v) >= Z_FLAG for v in z_s.values()):
            flags.append("zs")
        if zn[i] is not None and abs(zn[i]) >= Z_FLAG:
            flags.append("zn")
        if ldq[i] == ldq[i] and ldq[i] < 0.05:
            flags.append("ld_p")
        if rho_z[i] is not None and rho_z[i] >= Z_FLAG:
            flags.append("rho")
        if m5q[i] == m5q[i] and m5q[i] < 0.05:
            flags.append("mult5_p")
        mz = max(
            [abs(v) for v in [zt[i], zn[i], *z_s.values()] if v is not None] or [0.0]
        )
        n = b["n_secoes"]
        linhas[i] = {
            "n_secoes": n,
            "zt": _num(zt[i]),
            "zs": z_s,
            "zn": _num(zn[i]),
            "ld_p": _num(b["ld_p"]),
            "b2_p": _num(b["b2_p"]),
            "rho": _num(b["rho"]),
            "rho_z": _num(rho_z[i]),
            "mult5_p": _num(b["mult5_p"]),
            "bunching": _num(b["bunching"]),
            "score": int(min(100, 25 * len(flags) + 5 * max(0.0, mz - 2))),
            # confiança do z espacial e dos testes: municípios pequenos oscilam mais por acaso
            "confianca": "alta"
            if b["aptos"] >= 20_000
            else "media"
            if b["aptos"] >= 5_000
            else "baixa",
            "flags": flags,
        }

    # bloco nacional
    s["lider"] = s[cols].max(axis=1) / s.validos.clip(lower=1)
    pool_all = s[cols].to_numpy().ravel()
    nacional = {
        "fingerprint": fingerprint.hist2d(s.turnout.to_numpy(), s.lider.to_numpy()),
        "benford_2bl": _fmt(digits.benford_2bl(pool_all, min_n=1)),
        "ultimo_digito": _fmt(digits.last_digit_uniform(pool_all, min_n=1)),
        "calibracao": {
            "municipios_ld_p_menor_0_05": _frac([base[i]["ld_p"] for i in ids]),
            "municipios_b2_p_menor_0_05": _frac([base[i]["b2_p"] for i in ids]),
            "municipios_com_flag": float(
                np.mean([bool(linhas[i]["flags"]) for i in ids])
            ),
        },
    }
    return {"linhas": linhas, "nacional": nacional}


def _frac(ps: list) -> float | None:
    v = [p for p in ps if p is not None]
    return float(np.mean(np.array(v) < 0.05)) if v else None


def _fmt(d: dict) -> dict:
    tot = sum(d["observado"]) or 1
    return {
        "digitos": list(range(10)),
        "observado": [round(x / tot, 5) for x in d["observado"]],
        "esperado": [round(x / tot, 5) for x in d["esperado"]],
        "p": d["p"],
        "n": d["n"],
    }

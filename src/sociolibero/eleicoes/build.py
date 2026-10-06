"""Orquestra: dados brutos → web/public/data/ (contrato em docs/DATA_CONTRACT.md)."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

import pandas as pd

from . import aggregate, analise, geo, ingest
from .forensics import spatial, synthetic

OUT = Path("web/public/data")
PLEITOS = [  # (id, ano, turno, rotulo, status)
    ("pres_2022_t1", 2022, 1, "Presidente 2022 · 1º turno", "oficial"),
    ("pres_2022_t2", 2022, 2, "Presidente 2022 · 2º turno", "oficial"),
    ("pres_2026_t1", 2026, 1, "Presidente 2026 · 1º turno", "preliminar"),
]
FORENSE = {"pres_2022_t1", "pres_2022_t2", "pres_2026_t1"}


def _write(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )


def _partidos(ano: int) -> dict[int, str]:
    f = Path(f"data/raw/consulta_cand_{ano}/consulta_cand_{ano}_BRASIL.csv")
    if not f.exists():
        return {}
    df = pd.read_csv(
        f,
        sep=";",
        encoding="latin-1",
        dtype=str,
        usecols=["DS_CARGO", "NR_CANDIDATO", "SG_PARTIDO"],
    )
    df = df[df.DS_CARGO.str.upper() == "PRESIDENTE"].drop_duplicates("NR_CANDIDATO")
    return {int(r.NR_CANDIDATO): r.SG_PARTIDO for r in df.itertuples()}


def _prov(nome: str) -> dict:
    return json.loads(
        (ingest.RAW / nome / "PROVENIENCIA.json").read_text(encoding="utf-8")
    )


def build(com_validacao: bool = True) -> dict:
    gj, index = geo.build_geo()
    nb = spatial.adjacency(gj["features"])
    index_json = {
        "gerado_em": datetime.now(UTC).isoformat(timespec="seconds"),
        "geo": "geo/municipios.geojson",
        "eleicoes": [],
        "forense": [],
        "validacao_sintetica": "forensics/validacao_sintetica.json",
        "referencias": "references.json",
        "decisoes": "decisoes.json",
    }
    relatorio: dict = {}
    for pid, ano, turno, rotulo, status in PLEITOS:
        res = aggregate.carregar(ano, turno)
        tse = res.secoes[["cd", "uf"]].drop_duplicates("cd")
        nomes = pd.read_csv(  # nome do município por código TSE vem do arquivo de votos
            ingest.RAW / f"votacao_secao_{ano}_BR" / f"votacao_secao_{ano}_BR.csv",
            sep=";",
            encoding="latin-1",
            dtype=str,
            usecols=["CD_MUNICIPIO", "NM_MUNICIPIO", "SG_UF"],
            quotechar='"',
        ).drop_duplicates("CD_MUNICIPIO")
        nomes["cd"] = nomes.CD_MUNICIPIO.astype(int)
        trip = [
            (int(r.cd), r.SG_UF, r.NM_MUNICIPIO)
            for r in nomes.itertuples()
            if r.cd in set(tse.cd)
        ]
        cd2ibge, miss = geo.tse_to_ibge(trip, index)

        s = res.secoes[res.secoes.cd.isin(cd2ibge)].copy()
        s["ibge"] = s.cd.map(cd2ibge)
        g = s.groupby("ibge")[["aptos", "comp", "validos", "brancos", "nulos"]].sum()
        votos = res.candidatos[res.candidatos.cd.isin(cd2ibge)].copy()
        votos["ibge"] = votos.cd.map(cd2ibge)
        vmap = votos.groupby("ibge").apply(
            lambda d: {str(int(n)): int(v) for n, v in zip(d.nr, d.votos)},
            include_groups=False,
        )
        linhas = {
            ibge: {
                "aptos": int(r.aptos),
                "comparecimento": int(r.comp),
                "validos": int(r.validos),
                "brancos": int(r.brancos),
                "nulos": int(r.nulos),
                "votos": vmap.get(ibge, {}),
            }
            for ibge, r in g.iterrows()
        }
        part = _partidos(ano)
        prov_v, prov_d = (
            _prov(f"votacao_secao_{ano}_BR"),
            _prov(f"detalhe_votacao_secao_{ano}"),
        )
        meta = {
            "id": pid,
            "rotulo": rotulo,
            "ano": ano,
            "turno": turno,
            "cargo": "Presidente",
            "status": status,
            "fonte": prov_v["fonte"],
            "fonte_detalhe": prov_d["fonte"],
            "baixado_em": prov_v["baixado_em"],
            "sha256": prov_v["sha256"],
            "sha256_detalhe": prov_d["sha256"],
            "candidatos": [
                {"numero": int(n), "nome": nome, "partido": part.get(int(n))}
                for n, nome in sorted(res.candidatos_nome.items())
            ],
            "validacao": res.checagens,
            "sem_correspondencia": miss,
            "municipios_com_correspondencia": len(cd2ibge),
        }
        _write(OUT / "elections" / f"{pid}.json", {"meta": meta, "linhas": linhas})
        index_json["eleicoes"].append(
            {
                "id": pid,
                "rotulo": rotulo,
                "ano": ano,
                "turno": turno,
                "cargo": "Presidente",
                "status": status,
                "municipios": len(linhas),
            }
        )

        if pid in FORENSE:
            f = analise.por_municipio(res.secoes, res.checagens["top2"], nb, cd2ibge)
            _write(
                OUT / "forensics" / f"{pid}.json",
                {
                    "meta": {
                        "id": pid,
                        "testes": analise.TESTES,
                        "top2": res.checagens["top2"],
                        "aviso": "Anomalia estatística não é prova de fraude.",
                        "score": "25 pontos por teste sinalizado (q<0,05 ou |z|≥4) + 5 por unidade de |z| acima de 2; heurístico.",
                    },
                    "nacional": f["nacional"],
                    "linhas": f["linhas"],
                },
            )
            index_json["forense"].append(pid)
        relatorio[pid] = {"sem_correspondencia": len(miss), "validacao": res.checagens}

    _persistencia(index_json["forense"])
    if com_validacao:
        synthetic.export(str(OUT / "forensics" / "validacao_sintetica.json"))
    _write(OUT / "index.json", index_json)
    return relatorio


def _persistencia(ids: list[str]) -> None:
    """Flags que se repetem entre pleitos indicam causa estrutural (demografia, geografia), não evento."""
    docs = {
        i: json.loads((OUT / "forensics" / f"{i}.json").read_text(encoding="utf-8"))
        for i in ids
    }
    for a in ids:
        fa = {k for k, v in docs[a]["linhas"].items() if v["flags"]}
        out = {}
        for b in ids:
            if a == b:
                continue
            fb = {k for k, v in docs[b]["linhas"].items() if v["flags"]}
            inter = len(fa & fb)
            out[b] = {
                "flags_a": len(fa),
                "flags_b": len(fb),
                "em_ambos": inter,
                "p_b_dado_a": round(inter / len(fa), 3) if fa else None,
                "base_b": round(len(fb) / max(len(docs[b]["linhas"]), 1), 3),
            }
        docs[a]["nacional"]["calibracao"]["persistencia"] = out
        _write(OUT / "forensics" / f"{a}.json", docs[a])

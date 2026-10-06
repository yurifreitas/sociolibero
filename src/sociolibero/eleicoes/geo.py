"""Malha municipal (IBGE) e ponte código TSE → código IBGE.

O TSE usa códigos próprios de município; o IBGE, os de 7 dígitos. Sem tabela oficial de
equivalência em dados abertos, o join é por (UF, nome normalizado) e **qualquer não-correspondência
é relatada**, nunca silenciada (validação do join aparece em `meta.sem_correspondencia`).
"""

from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from datetime import UTC, datetime
from pathlib import Path

import requests

IBGE_MALHA = (
    "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR"
    "?formato=application/vnd.geo%2Bjson&qualidade=minima&intrarregiao=municipio"
)
IBGE_NOMES = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios"
RAW = Path("data/raw/ibge")
OUT = Path("web/public/data/geo/municipios.geojson")

# TSE grafa alguns nomes diferente do IBGE (grafias oficiais antigas/atuais). Chave: (UF, nome TSE norm.)
# Grafias do TSE ≠ IBGE, conferidas uma a uma (mesma UF, único candidato, mesmo município).
# Boa Saúde (RN) = Januário Cicco (renomeado). Boa Esperança do Norte (MT) não consta na malha
# do IBGE (município novo) e permanece sem correspondência, listado em meta.sem_correspondencia.
ALIASES: dict[tuple[str, str], str] = {
    ("SP", "SAO LUIS DO PARAITINGA"): "SAO LUIZ DO PARAITINGA",
    ("PA", "SANTA ISABEL DO PARA"): "SANTA IZABEL DO PARA",
    ("RO", "ESPIGAO DO OESTE"): "ESPIGAO D OESTE",
    ("MT", "SANTO ANTONIO DO LEVERGER"): "SANTO ANTONIO DE LEVERGER",
    ("MG", "DONA EUSEBIA"): "DONA EUZEBIA",
    ("RO", "ALVORADA DO OESTE"): "ALVORADA D OESTE",
    ("BA", "CAMACA"): "CAMACAN",
    ("MG", "BARAO DE MONTE ALTO"): "BARAO DO MONTE ALTO",
    ("PA", "ELDORADO DOS CARAJAS"): "ELDORADO DO CARAJAS",
    ("RN", "BOA SAUDE"): "JANUARIO CICCO",
    ("MG", "SAO THOME DAS LETRAS"): "SAO TOME DAS LETRAS",
    ("RR", "SAO LUIZ"): "SAO LUIZ DO ANAUA",
    ("SE", "AMPARO DE SAO FRANCISCO"): "AMPARO DO SAO FRANCISCO",
    ("GO", "BOM JESUS"): "BOM JESUS DE GOIAS",
    ("PR", "MUNHOZ DE MELLO"): "MUNHOZ DE MELO",
}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Z0-9]+", " ", s.upper()).strip()


def _get(url: str, dest: Path) -> dict:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        r = requests.get(url, timeout=120)
        r.raise_for_status()
        dest.write_bytes(r.content)
        (dest.parent / f"{dest.stem}.PROVENIENCIA.json").write_text(
            json.dumps(
                {
                    "fonte": url,
                    "baixado_em": datetime.now(UTC).isoformat(timespec="seconds"),
                    "sha256": hashlib.sha256(r.content).hexdigest(),
                    "bytes": len(r.content),
                },
                indent=1,
            )
        )
    return json.loads(dest.read_text(encoding="utf-8"))


def _uf(m: dict) -> str | None:
    try:
        return m["microrregiao"]["mesorregiao"]["UF"]["sigla"]
    except (KeyError, TypeError):
        try:
            return m["regiao-imediata"]["regiao-intermediaria"]["UF"]["sigla"]
        except (KeyError, TypeError):
            return None


def build_geo() -> tuple[dict, dict[tuple[str, str], str]]:
    """Retorna (geojson com {ibge,nome,uf}, índice (UF, nome_norm) → ibge)."""
    mesh = _get(IBGE_MALHA, RAW / "malha_municipios.json")
    nomes = {str(m["id"]): m for m in _get(IBGE_NOMES, RAW / "municipios.json")}
    index: dict[tuple[str, str], str] = {}
    feats = []
    for f in mesh["features"]:
        ibge = str(f["properties"]["codarea"])
        m = nomes.get(ibge)
        if m is None:
            continue
        uf = _uf(m)
        f["properties"] = {"ibge": ibge, "nome": m["nome"], "uf": uf}
        index[(uf, norm(m["nome"]))] = ibge
        feats.append(f)
    gj = {"type": "FeatureCollection", "features": feats}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(gj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    return gj, index


def tse_to_ibge(
    tse: list[tuple[int, str, str]], index: dict[tuple[str, str], str]
) -> tuple[dict[int, str], list[dict]]:
    """tse: [(cd_municipio_tse, uf, nome)] → ({cd_tse: ibge}, [não correspondidos])."""
    ok: dict[int, str] = {}
    miss: list[dict] = []
    for cd, uf, nome in tse:
        n = norm(nome)
        n = ALIASES.get((uf, n), n)
        ibge = index.get((uf, n))
        if ibge:
            ok[cd] = ibge
        else:
            miss.append({"cd_tse": cd, "uf": uf, "nome": nome})
    return ok, miss

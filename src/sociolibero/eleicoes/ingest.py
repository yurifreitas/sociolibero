"""Download com proveniência: cada arquivo vai para sua própria pasta e gera hash + metadados.

Dados baixados são tratados como não confiáveis: nada aqui executa código vindo deles, e a
leitura posterior é feita por DuckDB (CSV), nunca por import/eval.
"""

from __future__ import annotations

import hashlib
import json
import zipfile
from datetime import UTC, datetime
from pathlib import Path

import requests

RAW = Path("data/raw")
TSE = "https://cdn.tse.jus.br/estatistica/sead/odsele"

FONTES = {
    "votacao_secao_2022_BR": f"{TSE}/votacao_secao/votacao_secao_2022_BR.zip",
    "votacao_secao_2026_BR": f"{TSE}/votacao_secao/votacao_secao_2026_BR.zip",
    "detalhe_votacao_secao_2022": f"{TSE}/detalhe_votacao_secao/detalhe_votacao_secao_2022.zip",
    "detalhe_votacao_secao_2026": f"{TSE}/detalhe_votacao_secao/detalhe_votacao_secao_2026.zip",
    "consulta_cand_2022": f"{TSE}/consulta_cand/consulta_cand_2022.zip",
    "consulta_cand_2026": f"{TSE}/consulta_cand/consulta_cand_2026.zip",
}


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def baixar(nome: str, url: str | None = None) -> dict:
    """Baixa (se ausente), extrai e registra em `<pasta>/PROVENIENCIA.json`."""
    url = url or FONTES[nome]
    pasta = RAW / nome
    meta_path = pasta / "PROVENIENCIA.json"
    if meta_path.exists():
        return json.loads(meta_path.read_text(encoding="utf-8"))
    pasta.mkdir(parents=True, exist_ok=True)
    zpath = pasta / f"{nome}.zip"
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        last_mod = r.headers.get("Last-Modified")
        with zpath.open("wb") as f:
            for chunk in r.iter_content(1 << 20):
                f.write(chunk)
    sha = _sha256(zpath)
    with zipfile.ZipFile(zpath) as z:
        # zip-slip: só extrai nomes sem caminho
        membros = [
            m for m in z.namelist() if "/" not in m and "\\" not in m and ".." not in m
        ]
        for m in membros:
            z.extract(m, pasta)
    meta = {
        "nome": nome,
        "fonte": url,
        "baixado_em": datetime.now(UTC).isoformat(timespec="seconds"),
        "last_modified": last_mod,
        "bytes": zpath.stat().st_size,
        "sha256": sha,
        "arquivos": membros,
    }
    meta_path.write_text(
        json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    return meta

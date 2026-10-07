"""Download com proveniência das séries históricas (cada fonte em `data/raw/<nome>/`).

Tudo que é baixado é dado não confiável: nada aqui executa código vindo dos arquivos; a leitura
posterior é por `json`/`csv`/pandas (`read_stata`). Cada pasta ganha `PROVENIENCIA.json` com URL,
data, SHA-256 e bytes por arquivo. Falha de acesso (403, certificado inválido, login) é registrada
em `data/raw/_falhas_series.json` e **não é contornada** (nada de `verify=False`, nada de login).
"""

from __future__ import annotations

import hashlib
import io
import json
import time
import zipfile
from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path

import requests

RAW = Path("data/raw")
FALHAS = RAW / "_falhas_series.json"
UA = {"User-Agent": "sociolibero/0.1 (pesquisa; dados abertos)"}

IPEA = "http://www.ipeadata.gov.br/api/odata4"
# Séries do Ipeadata (código = SERCODIGO). Os rótulos finais ficam em build.py.
IPEADATA = [
    "PRECOS_IPCAG",
    "IGP_IGPDIG",
    "GAC12_SALMINRE12",
    "PNADS_GINI",
    "PAN_TDESOC",
    "SCN10_PIBG10",
    "SCN10_PIBP10",
    "PNADS_PERCPOBRE300",
    "PNADS_PERCPOBRE830",
    "PNADCA_TXPIUF",
    "PNADCA_TXPNUF",
    "PNAD_IAGRV",
    "AVIOL12_THOMIC",
    "DEPIS_ESVIDA",
    "DEPIS_TMI",
    "TXA15M",
    "TXA15M7091",
    "ADH_T_ANALF15M",
    "AVIOL12_HOMIC",
    "PNADCA_TXA15MUF",
]
WB = "https://api.worldbank.org/v2/country/BRA/indicator/{i}?format=json&per_page=200&date=1960:2026"
WB_IND = [
    "SP.DYN.IMRT.IN",
    "SN.ITK.SVFI.ZS",
    "SI.POV.DDAY",
    "NY.GDP.PCAP.PP.KD",
    "SP.DYN.LE00.IN",
]
URLS = {
    "maddison_mpd2023": (
        "https://dataverse.nl/api/access/datafile/421303",
        "maddison2023_web.dta",
    ),
    "bcb_sgs_13762": (
        "https://api.bcb.gov.br/dados/serie/bcdata.sgs.13762/dados?formato=json",
        "sgs_13762.json",
    ),
    "owid_life_expectancy": (
        "https://ourworldindata.org/grapher/life-expectancy.csv",
        "life-expectancy.csv",
    ),
    "slavevoyages_tastdb_2019": (
        "https://www.slavevoyages.org/documents/download/tastdb-exp-2019.csv",
        "tastdb-exp-2019.csv",
    ),
    "inpe_prodes_taxas": (
        "https://terrabrasilis.dpi.inpe.br/app/prodes/dashboard/deforestation/files/rates2025.json",
        "rates2025.json",
    ),
    "sidra_1737_ipca": (
        "https://apisidra.ibge.gov.br/values/t/1737/n1/all/v/2265/p/all?formato=json",
        "ipca.json",
    ),
    "sidra_6784_pib": (
        "https://apisidra.ibge.gov.br/values/t/6784/n1/all/v/all/p/all?formato=json",
        "pib.json",
    ),
}
WID_ZIP = "https://wid.world/bulk_download/wid_all_data.zip"
WID_MEMBROS = ("WID_data_BR.csv", "WID_metadata_BR.csv")


def _sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def _agora() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


class ConteudoInvalido(requests.RequestException):
    """Resposta 200 com corpo que não é o formato esperado (ex.: página de erro HTML de gateway)."""


def _get(
    url: str,
    headers: dict | None = None,
    tentativas: int = 4,
    json_esperado: bool = False,
) -> requests.Response:
    """GET com tentativas; 401/403/404 não se repetem e nunca são contornados.

    `json_esperado`: corpo precisa ser JSON válido (gateways às vezes devolvem HTML com status 200).
    """
    ultimo: Exception | None = None
    for i in range(tentativas):
        try:
            r = requests.get(url, headers={**UA, **(headers or {})}, timeout=(30, 300))
            r.raise_for_status()
            if json_esperado:
                try:
                    json.loads(r.content)
                except ValueError as e:
                    raise ConteudoInvalido(
                        f"corpo não é JSON: {r.content[:80]!r}"
                    ) from e
            return r
        except requests.HTTPError as e:
            if e.response is not None and e.response.status_code in (401, 403, 404):
                raise
            ultimo = e
        except requests.RequestException as e:
            ultimo = e
        time.sleep(2 * (i + 1))
    assert ultimo is not None
    raise ultimo


def registrar_falha(nome: str, url: str, erro: str) -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    d = json.loads(FALHAS.read_text(encoding="utf-8")) if FALHAS.exists() else {}
    d[nome] = {"url": url, "erro": erro, "em": _agora()}
    FALHAS.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")


def gravar(
    nome: str, arquivos: list[tuple[str, str, bytes]], extra: dict | None = None
) -> dict:
    """Grava `[(arquivo, url, bytes)]` em `RAW/nome/` e cria `PROVENIENCIA.json`."""
    pasta = RAW / nome
    pasta.mkdir(parents=True, exist_ok=True)
    regs = []
    for fn, url, conteudo in arquivos:
        (pasta / fn).write_bytes(conteudo)
        regs.append(
            {
                "nome": fn,
                "url": url,
                "sha256": _sha256(conteudo),
                "bytes": len(conteudo),
            }
        )
    sha = (
        regs[0]["sha256"]
        if len(regs) == 1
        else _sha256(
            "\n".join(sorted(f"{a['nome']}:{a['sha256']}" for a in regs)).encode()
        )
    )
    meta = {
        "nome": nome,
        "baixado_em": _agora(),
        "sha256": sha,
        "arquivos": regs,
        **(extra or {}),
    }
    (pasta / "PROVENIENCIA.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    return meta


def proveniencia(nome: str) -> dict | None:
    p = RAW / nome / "PROVENIENCIA.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def _simples(nome: str, url: str, fn: str) -> dict:
    r = _get(url, json_esperado=fn.endswith(".json"))
    return gravar(
        nome, [(fn, url, r.content)], {"last_modified": r.headers.get("Last-Modified")}
    )


def _ipeadata(codigo: str) -> dict:
    u_val = f"{IPEA}/ValoresSerie(SERCODIGO='{codigo}')"
    u_met = f"{IPEA}/Metadados('{codigo}')"
    return gravar(
        f"ipeadata_{codigo}",
        [
            ("valores.json", u_val, _get(u_val, json_esperado=True).content),
            ("metadados.json", u_met, _get(u_met, json_esperado=True).content),
        ],
        {"codigo_serie": codigo},
    )


def _wb(ind: str) -> dict:
    u = WB.format(i=ind)
    return gravar(
        f"worldbank_{ind}",
        [("serie.json", u, _get(u, json_esperado=True).content)],
        {"codigo_serie": ind},
    )


class _ZipHttp(io.RawIOBase):
    """Arquivo somente-leitura sobre HTTP Range, para extrair 2 membros de um zip de ~880 MB."""

    def __init__(self, url: str):
        self.url = url
        h = requests.head(url, headers=UA, timeout=60, allow_redirects=True)
        h.raise_for_status()
        self.n = int(h.headers["Content-Length"])
        self.last_modified = h.headers.get("Last-Modified")
        self.p = 0

    def seekable(self) -> bool:
        return True

    def readable(self) -> bool:
        return True

    def tell(self) -> int:
        return self.p

    def seek(self, off: int, whence: int = 0) -> int:
        self.p = {0: off, 1: self.p + off, 2: self.n + off}[whence]
        return self.p

    def read(self, k: int = -1) -> bytes:
        k = self.n - self.p if k < 0 else min(k, self.n - self.p)
        if k <= 0:
            return b""
        r = _get(self.url, {"Range": f"bytes={self.p}-{self.p + k - 1}"})
        if r.status_code != 206:
            raise RuntimeError("servidor ignorou Range; não vou baixar 880 MB")
        self.p += len(r.content)
        return r.content


def _wid() -> dict:
    f = _ZipHttp(WID_ZIP)
    with zipfile.ZipFile(f) as z:
        nomes = set(z.namelist())
        arqs = []
        for m in WID_MEMBROS:
            if m not in nomes:  # só nomes fixos: nada de extrair caminhos do zip
                raise RuntimeError(f"{m} ausente do zip WID")
            arqs.append((m, WID_ZIP, z.read(m)))
    return gravar(
        "wid_BR",
        arqs,
        {
            "last_modified": f.last_modified,
            "obs": "membros extraídos do zip por HTTP Range",
        },
    )


def tarefas() -> list[tuple[str, str, Callable[[], dict]]]:
    t: list[tuple[str, str, Callable[[], dict]]] = []
    for c in IPEADATA:
        t.append(
            (
                f"ipeadata_{c}",
                f"{IPEA}/ValoresSerie(SERCODIGO='{c}')",
                lambda c=c: _ipeadata(c),
            )
        )
    for i in WB_IND:
        t.append((f"worldbank_{i}", WB.format(i=i), lambda i=i: _wb(i)))
    for n, (u, fn) in URLS.items():
        t.append((n, u, lambda n=n, u=u, fn=fn: _simples(n, u, fn)))
    t.append(("wid_BR", WID_ZIP, _wid))
    return t


def baixar_tudo(refazer: bool = False) -> dict[str, dict]:
    """Baixa o que falta; falha de acesso é registrada em `_falhas_series.json` e a execução segue."""
    out: dict[str, dict] = {}
    for nome, url, fn in tarefas():
        if not refazer and (m := proveniencia(nome)):
            out[nome] = m
            continue
        try:
            out[nome] = fn()
            print("ok   ", nome, out[nome]["sha256"][:12], flush=True)
        except Exception as e:  # noqa: BLE001 - registrar e seguir
            registrar_falha(nome, url, repr(e))
            print("FALHA", nome, repr(e), flush=True)
    return out

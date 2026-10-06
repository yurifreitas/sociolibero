"""Povos indígenas e quilombolas por município (IBGE Censo 2022 + FUNAI + INCRA).

Saída: `web/public/data/territorios.json` (ver docs/DATA_CONTRACT.md e docs/METHODS.md, seção Territórios).

Segurança: tudo que é baixado é tratado como **não confiável**. Cada fonte vai para a sua própria
pasta `data/raw/<nome>/` com `PROVENIENCIA.json` (URL, data, SHA-256). A leitura é só de dados:
JSON (`json`), shapefile/DBF por parser binário próprio (`struct`). Nada é importado, executado ou
avaliado a partir dos arquivos baixados, e o ZIP do INCRA é extraído com nomes fixos (anti zip-slip).

Convenções de valor (SIDRA): `-` = zero verdadeiro; `X`, `..`, `...` = sem dado ⇒ `null`.
Nunca se grava zero no lugar de dado ausente. Para as camadas territoriais (FUNAI/INCRA), 0 significa
"nenhuma feição da camada sobrepõe o município", não "ausência de povo" (ver METHODS.md).
"""

from __future__ import annotations

import hashlib
import json
import math
import struct
import subprocess
import time
import zipfile
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import quote

import numpy as np
import requests
from shapely import STRtree, make_valid, transform, union_all
from shapely.geometry import Polygon, shape
from shapely.geometry.base import BaseGeometry

RAW = Path("data/raw")
OUT = Path("web/public/data/territorios.json")
GEO = Path("web/public/data/geo/municipios.geojson")
UA = {"User-Agent": "sociolibero/0.1 (pesquisa; dados abertos)"}

SIDRA = "https://apisidra.ibge.gov.br/values"
SIDRA_AGREGADO = "https://servicodados.ibge.gov.br/api/v3/agregados/{t}/metadados"
IBGE_MALHA_UF = (
    "https://servicodados.ibge.gov.br/api/v3/malhas/estados/{uf}"
    "?formato=application/vnd.geo%2Bjson&qualidade=maxima&intrarregiao=municipio"
)
FUNAI_WFS = (
    "https://geoserver.funai.gov.br/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature"
    "&typeName=Funai:tis_poligonais&outputFormat=application/json&maxFeatures=5000"
)
INCRA_ZIP = (
    "https://certificacao.incra.gov.br/csv_shp/zip/%C3%81reas%20de%20Quilombolas.zip"
)

# Códigos IBGE das UFs (N3 do SIDRA)
UFS = {
    "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
    "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL",
    "28": "SE", "29": "BA", "31": "MG", "32": "ES", "33": "RJ", "35": "SP", "41": "PR",
    "42": "SC", "43": "RS", "50": "MS", "51": "MT", "52": "GO", "53": "DF",
}  # fmt: skip

# Tabelas SIDRA (Censo Demográfico 2022) — confirmadas em /api/v3/agregados/{id}/metadados.
# chave: (descrição, caminho de variáveis/classificações; o território entra como n6/n3/n1)
TABELAS = {
    "9605": (
        "População residente, por cor ou raça, nos Censos Demográficos (2022)",
        "v/93/p/2022/c86/all",
    ),
    "9718": (
        "População residente, total e indígena, por localização do domicílio e quesito de declaração "
        "indígena (Censo 2022, primeiros resultados do universo)",
        "v/350/p/2022/c1714/60024,60025/c2661/32776,12869",
    ),
    "9578": (
        "População residente, total e quilombola, por localização do domicílio (Censo 2022)",
        "v/4709/p/2022/c2661/32776,60027",
    ),
}
COR = {
    "95251": "total",
    "2776": "branca",
    "2777": "preta",
    "2778": "amarela",
    "2779": "parda",
    "2780": "indigena",
}
FASES_TITULADO = {"TITULADO", "TITULO PARCIAL", "CCDRU"}

AVISO = (
    "População indígena/quilombola vem do Censo 2022 (autodeclaração); áreas de TI e de território "
    "quilombola vêm de camadas oficiais de FUNAI/INCRA e NÃO são equivalentes: morar em terra indígena "
    "≠ autodeclarar-se indígena, e o INCRA só cobre territórios com processo/delimitação, não toda "
    "comunidade quilombola. Zero em ti_*/quilombo_* = nenhuma feição da camada no município."
)


# ----------------------------------------------------------------------------------------------
# Download com proveniência
# ----------------------------------------------------------------------------------------------
def _sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def _agora() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def _sha_pasta(arquivos: list[dict]) -> str:
    """Hash da pasta = SHA-256 de 'nome:sha' ordenados (para fontes com vários arquivos)."""
    if len(arquivos) == 1:
        return arquivos[0]["sha256"]
    return _sha256_bytes(
        "\n".join(sorted(f"{a['nome']}:{a['sha256']}" for a in arquivos)).encode()
    )


class _Resp:
    def __init__(self, content: bytes, headers: dict):
        self.content, self.headers = content, headers


def _get(url: str, headers: dict | None = None, timeout: int = 300):
    """GET com verificação TLS sempre ligada.

    O geoserver da FUNAI serve a cadeia de certificados incompleta (falta o intermediário), o que o
    `requests` (certifi) rejeita. Em vez de desligar a verificação, cai para o `curl` do sistema, que
    valida pela loja de certificados do SO (completa a cadeia via AIA) e continua exigindo certificado válido.
    """
    try:
        for tentativa in range(4):
            try:
                r = requests.get(url, headers=headers, timeout=(30, timeout))
                r.raise_for_status()
                return r
            except (requests.ConnectionError, requests.Timeout) as e:
                if isinstance(e, requests.exceptions.SSLError) or tentativa == 3:
                    raise
                time.sleep(2 * (tentativa + 1))
    except requests.exceptions.SSLError:
        cmd = [
            "curl",
            "-sS",
            "--fail",
            "-L",
            "--max-time",
            str(timeout),
            "-D",
            "-",
            "-o",
            "-",
        ]
        for k, v in (headers or {}).items():
            cmd += ["-H", f"{k}: {v}"]
        out = subprocess.run([*cmd, url], capture_output=True, check=True).stdout
        sep = bytes([13, 10, 13, 10])
        body, hs = out, {}
        while body.startswith(b"HTTP/"):  # um bloco de cabeçalhos por redirecionamento
            head, _, body = body.partition(sep)
            hs = {}
            for ln in head.decode("latin1").splitlines()[1:]:
                k, _, v = ln.partition(":")
                hs[k.strip()] = v.strip()
        return _Resp(body, hs)


def baixar_pasta(
    nome: str, itens: list[tuple[str, str]], headers: dict | None = None, **extra
) -> dict:
    """Baixa `itens` [(nome_arquivo, url)] para `data/raw/<nome>/` (se ausente) e grava PROVENIENCIA.json."""
    pasta = RAW / nome
    meta_path = pasta / "PROVENIENCIA.json"
    if meta_path.exists():
        return json.loads(meta_path.read_text(encoding="utf-8"))
    pasta.mkdir(parents=True, exist_ok=True)
    arquivos = []
    last_mod = None
    for arq, url in itens:
        if (pasta / arq).exists():  # retomada de download interrompido
            conteudo = (pasta / arq).read_bytes()
        else:
            r = _get(url, headers)
            last_mod = r.headers.get("Last-Modified") or last_mod
            conteudo = r.content
            (pasta / arq).write_bytes(conteudo)
        arquivos.append(
            {
                "nome": arq,
                "url": url,
                "sha256": _sha256_bytes(conteudo),
                "bytes": len(conteudo),
            }
        )
    meta = {
        "nome": nome,
        "baixado_em": _agora(),
        "last_modified": last_mod,
        "sha256": _sha_pasta(arquivos),
        "arquivos": arquivos,
        **extra,
    }
    meta_path.write_text(
        json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    return meta


def sidra_url(tabela: str, nivel: str) -> str:
    """nivel: 'n1/all' | 'n3/all' | 'n6/in n3 13'."""
    return f"{SIDRA}/t/{tabela}/{quote(nivel, safe='/')}/{TABELAS[tabela][1]}"


def baixar_sidra(tabela: str) -> dict:
    itens = [
        ("brasil.json", sidra_url(tabela, "n1/all")),
        ("uf.json", sidra_url(tabela, "n3/all")),
    ]
    itens += [(f"mun_{cd}.json", sidra_url(tabela, f"n6/in n3 {cd}")) for cd in UFS]
    return baixar_pasta(
        f"sidra_{tabela}", itens, tabela=tabela, descricao=TABELAS[tabela][0]
    )


def baixar_funai() -> dict:
    # O geoserver da FUNAI devolve 403 sem `maxFeatures` e sem User-Agent identificado (filtro de
    # tráfego, não é login); a camada tem ~665 feições, então 5000 cobre tudo.
    return baixar_pasta(
        "funai_tis_poligonais",
        [("tis_poligonais.json", FUNAI_WFS)],
        headers=UA,
        tabela="Funai:tis_poligonais",
    )


def baixar_malha_maxima() -> dict:
    itens = [(f"uf_{cd}.json", IBGE_MALHA_UF.format(uf=cd)) for cd in UFS]
    return baixar_pasta(
        "ibge_malha_maxima", itens, tabela="malhas/estados/{uf}?qualidade=maxima"
    )


def baixar_incra() -> dict:
    """ZIP do INCRA: extrai só os 4 componentes do shapefile, com nomes fixos (anti zip-slip)."""
    pasta = RAW / "incra_quilombolas"
    meta_path = pasta / "PROVENIENCIA.json"
    if meta_path.exists():
        return json.loads(meta_path.read_text(encoding="utf-8"))
    pasta.mkdir(parents=True, exist_ok=True)
    r = _get(INCRA_ZIP, UA)
    (pasta / "areas_quilombolas.zip").write_bytes(r.content)
    with zipfile.ZipFile(pasta / "areas_quilombolas.zip") as z:
        for m in z.infolist():
            ext = m.filename.rsplit(".", 1)[-1].lower()
            if (
                ext in ("shp", "dbf", "shx", "prj")
                and "/" not in m.filename
                and "\\" not in m.filename
            ):
                (pasta / f"areas_quilombolas.{ext}").write_bytes(z.read(m))
    meta = {
        "nome": "incra_quilombolas",
        "baixado_em": _agora(),
        "last_modified": r.headers.get("Last-Modified"),
        "sha256": _sha256_bytes(r.content),
        "arquivos": [{"nome": "areas_quilombolas.zip", "url": INCRA_ZIP, "bytes": len(r.content),
                      "sha256": _sha256_bytes(r.content)}],
        "tabela": "Áreas de Quilombolas (shapefile)",
    }  # fmt: skip
    meta_path.write_text(
        json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    return meta


def baixar_tudo() -> dict[str, dict]:
    out = {f"sidra_{t}": baixar_sidra(t) for t in TABELAS}
    out["funai_tis_poligonais"] = baixar_funai()
    out["incra_quilombolas"] = baixar_incra()
    out["ibge_malha_maxima"] = baixar_malha_maxima()
    return out


# ----------------------------------------------------------------------------------------------
# SIDRA: parsing e pivot
# ----------------------------------------------------------------------------------------------
def valor(v: str | None) -> int | None:
    """'-' é zero verdadeiro; 'X', '..', '...', vazio ⇒ None (sem dado)."""
    if v is None:
        return None
    v = str(v).strip()
    if v == "-":
        return 0
    try:
        return int(v)
    except ValueError:
        try:
            return int(round(float(v)))
        except ValueError:
            return None


def parse_sidra(rows: list[dict]) -> list[dict]:
    """Primeira linha é o cabeçalho. Devolve [{terr, nome, var, ano, cls:{nome_classif: cod}, v}]."""
    head, data = rows[0], rows[1:]
    cls_keys = [
        k
        for k in head
        if k.startswith("D") and k.endswith("C") and k not in ("D1C", "D2C", "D3C")
    ]
    cls_nome = {k: head[k].replace(" (Código)", "") for k in cls_keys}
    out = []
    for r in data:
        out.append(
            {
                "terr": r["D1C"],
                "nome": r.get("D1N"),
                "var": r["D2C"],
                "ano": r["D3C"],
                "cls": {cls_nome[k]: r[k] for k in cls_keys},
                "v": valor(r["V"]),
            }
        )
    return out


def _por_terr(reg: list[dict], campo) -> dict[str, dict]:
    """campo(reg) -> nome do campo ou None; agrupa por território."""
    out: dict[str, dict] = defaultdict(dict)
    for r in reg:
        c = campo(r)
        if c:
            out[r["terr"]][c] = r["v"]
    return out


def campos_9605(r: dict) -> str | None:
    return COR.get(r["cls"].get("Cor ou raça"))


def campos_9718(r: dict) -> str | None:
    q, loc = (
        r["cls"].get("Quesito de declaração indígena"),
        r["cls"].get("Localização do domicílio"),
    )
    if r["var"] != "350":
        return None
    if q == "60024" and loc == "32776":
        return "indigena"
    if q == "60025" and loc == "32776":
        return "indigena_cor_raca"
    if q == "60024" and loc == "12869":
        return "indigena_em_ti"
    return None


def campos_9578(r: dict) -> str | None:
    loc = r["cls"].get("Localização do domicílio")
    if r["var"] != "4709":
        return None
    return {"32776": "quilombola", "60027": "quilombola_em_territorio"}.get(loc)


CAMPOS = {"9605": campos_9605, "9718": campos_9718, "9578": campos_9578}


def pct(a: int | None, b: int | None) -> float | None:
    if a is None or not b:
        return None
    return round(100 * a / b, 4)


def montar_censo(pivots: dict[str, dict[str, dict]]) -> dict[str, dict]:
    """pivots[tabela][ibge] -> campos. Devolve {ibge: linha com pops e percentuais}."""
    ids = set()
    for p in pivots.values():
        ids |= set(p)
    linhas = {}
    for ibge in sorted(ids):
        cor = pivots.get("9605", {}).get(ibge, {})
        ind = pivots.get("9718", {}).get(ibge, {})
        qui = pivots.get("9578", {}).get(ibge, {})
        tot = cor.get("total")
        pp = (
            None
            if cor.get("preta") is None or cor.get("parda") is None
            else cor["preta"] + cor["parda"]
        )
        linhas[ibge] = {
            "pop_total": tot,
            "pop_indigena": ind.get("indigena"),
            "pop_quilombola": qui.get("quilombola"),
            "pct_indigena": pct(ind.get("indigena"), tot),
            "pct_quilombola": pct(qui.get("quilombola"), tot),
            "pct_pretos_pardos": pct(pp, tot),
            "pop_indigena_cor_raca": ind.get("indigena_cor_raca"),
            "pop_indigena_em_ti": ind.get("indigena_em_ti"),
            "pop_quilombola_em_territorio": qui.get("quilombola_em_territorio"),
        }
    return linhas


# ----------------------------------------------------------------------------------------------
# Geometria: projeção Albers equal-area (áreas exatas em ha) e leitor de shapefile
# ----------------------------------------------------------------------------------------------
_A, _F = 6378137.0, 1 / 298.257222101  # GRS80/SIRGAS 2000
_E2 = _F * (2 - _F)
_E = math.sqrt(_E2)


def _q(phi):
    s = np.sin(phi)
    return (1 - _E2) * (
        s / (1 - _E2 * s * s) - np.log((1 - _E * s) / (1 + _E * s)) / (2 * _E)
    )


def _m(phi):
    s = np.sin(phi)
    return np.cos(phi) / np.sqrt(1 - _E2 * s * s)


_P1, _P2, _P0, _L0 = (
    np.radians(x) for x in (-2.0, -22.0, -12.0, -54.0)
)  # parâmetros do IBGE para o Brasil
_N = (_m(_P1) ** 2 - _m(_P2) ** 2) / (_q(_P2) - _q(_P1))
_C = _m(_P1) ** 2 + _N * _q(_P1)
_RHO0 = _A * np.sqrt(_C - _N * _q(_P0)) / _N


def albers(xy: np.ndarray) -> np.ndarray:
    """(lon, lat) em graus -> (x, y) em metros, Albers equal-area (Brasil)."""
    lon, lat = np.radians(xy[:, 0]), np.radians(xy[:, 1])
    rho = _A * np.sqrt(_C - _N * _q(lat)) / _N
    th = _N * (lon - _L0)
    return np.column_stack([rho * np.sin(th), _RHO0 - rho * np.cos(th)])


def proj(g: BaseGeometry) -> BaseGeometry:
    return transform(g, albers)


def area_ha(g_proj: BaseGeometry) -> float:
    return g_proj.area / 10_000.0


def _ring_area(pts: list[tuple[float, float]]) -> float:
    return (
        sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1])) / 2
    )


def ler_shp(shp: bytes) -> list[BaseGeometry | None]:
    """Parser mínimo de shapefile Polygon (5/15/25). Anéis horários = casca; anti-horários = furo."""
    if len(shp) < 100 or struct.unpack(">i", shp[:4])[0] != 9994:
        raise ValueError("não é shapefile")
    out: list[BaseGeometry | None] = []
    pos = 100
    while pos + 8 <= len(shp):
        (n_words,) = struct.unpack(">i", shp[pos + 4 : pos + 8])
        rec = shp[pos + 8 : pos + 8 + 2 * n_words]
        pos += 8 + 2 * n_words
        (st,) = struct.unpack("<i", rec[:4])
        if st == 0:
            out.append(None)
            continue
        if st not in (5, 15, 25):
            raise ValueError(f"tipo de forma não suportado: {st}")
        n_parts, n_pts = struct.unpack("<ii", rec[36:44])
        parts = list(struct.unpack(f"<{n_parts}i", rec[44 : 44 + 4 * n_parts]))
        off = 44 + 4 * n_parts
        flat = struct.unpack(f"<{2 * n_pts}d", rec[off : off + 16 * n_pts])
        pts = list(zip(flat[0::2], flat[1::2]))
        parts.append(n_pts)
        shells, holes = [], []
        for a, b in zip(parts, parts[1:]):
            ring = pts[a:b]
            if len(ring) < 4:
                continue
            (shells if _ring_area(ring[:-1]) < 0 else holes).append(Polygon(ring))
        if not shells:  # sentido invertido: trata todos como cascas
            shells, holes = holes, []
        g = union_all([make_valid(s) for s in shells])
        if holes:
            g = g.difference(union_all([make_valid(h) for h in holes]))
        out.append(g)
    return out


def ler_dbf(dbf: bytes) -> list[dict | None]:
    """Linhas do DBF (None = registro apagado, preserva o alinhamento com o .shp)."""
    n, hl, rl = struct.unpack("<IHH", dbf[4:12])
    campos, p = [], 32
    while dbf[p] != 0x0D:
        campos.append(
            (dbf[p : p + 11].split(b"\0")[0].decode("ascii", "replace"), dbf[p + 16])
        )
        p += 32
    rows: list[dict | None] = []
    for i in range(n):
        r = dbf[hl + i * rl : hl + (i + 1) * rl]
        if r[:1] == b"*":
            rows.append(None)
            continue
        o, row = 1, {}
        for nome, ln in campos:
            row[nome] = r[o : o + ln].decode("cp1252", "replace").strip()
            o += ln
        rows.append(row)
    return rows


# ----------------------------------------------------------------------------------------------
# Feições territoriais e sobreposição com municípios
# ----------------------------------------------------------------------------------------------
def feicoes_funai(fc: dict) -> list[dict]:
    out = []
    for f in fc["features"]:
        p = f["properties"]
        if not f.get("geometry"):
            continue
        out.append(
            {
                "chave": str(p.get("terrai_codigo") or p.get("terrai_nome")),
                "nome": p.get("terrai_nome"),
                "fase": (p.get("fase_ti") or "Sem fase").strip(),
                "ha_fonte": p.get("superficie_perimetro_ha"),
                "geom": shape(f["geometry"]),
            }
        )
    return out


def _fase_norm(s: str) -> str:
    return " ".join((s or "").upper().split()) or "SEM FASE"


def feicoes_incra(shp: bytes, dbf: bytes) -> list[dict]:
    geoms, rows = ler_shp(shp), ler_dbf(dbf)
    if len(geoms) != len(rows):
        raise ValueError("shp e dbf com nº de registros diferente")
    out = []
    for g, r in zip(geoms, rows):
        if g is None or r is None:
            continue
        nome = r.get("nm_comunid") or ""
        out.append(
            {
                "chave": r.get("nr_process") or nome,
                "nome": nome,
                "fase": _fase_norm(r.get("fase", "")),
                "ha_fonte": None,
                "geom": g,
            }
        )
    return out


def malha_municipios(fcs: list[dict]) -> dict[str, BaseGeometry]:
    out = {}
    for fc in fcs:
        for f in fc["features"]:
            out[str(f["properties"]["codarea"])] = make_valid(shape(f["geometry"]))
    return out


def sobreposicao(
    feicoes: list[dict], munis: dict[str, BaseGeometry], min_ha: float = 1.0
) -> tuple[dict, dict]:
    """Interseção feição × município em Albers equal-area.

    Retorna ({ibge: {chave: {fase, ha}}}, diagnóstico). Pares com < `min_ha` são tratados como
    sliver de borda (malhas diferentes) e descartados do **n**, mas a área total é reportada.
    """
    ids = list(munis)
    mp = [proj(munis[i]) for i in ids]
    tree = STRtree(mp)
    res: dict[str, dict[str, dict]] = defaultdict(dict)
    ha_feicoes = ha_atribuida = ha_slivers = 0.0
    for f in feicoes:
        g = make_valid(proj(f["geom"]))
        ha_feicoes += area_ha(g)
        for j in tree.query(g, predicate="intersects"):
            ha = area_ha(g.intersection(mp[j]))
            if ha < min_ha:
                ha_slivers += ha
                continue
            ha_atribuida += ha
            e = res[ids[j]].setdefault(f["chave"], {"fase": f["fase"], "ha": 0.0})
            e["ha"] += ha
    diag = {
        "feicoes": len(feicoes),
        "area_poligonos_ha": round(ha_feicoes, 1),
        "area_atribuida_ha": round(ha_atribuida, 1),
        "area_slivers_descartados_ha": round(ha_slivers, 1),
        "area_fora_da_malha_ha": round(ha_feicoes - ha_atribuida - ha_slivers, 1),
        "municipios_com_feicao": len(res),
    }
    return res, diag


def agregar(sob: dict[str, dict[str, dict]]) -> dict[str, dict]:
    """{ibge: {chave: {fase, ha}}} -> {ibge: {n, area_ha, fases:{fase:{n, area_ha}}, titulado_n}}."""
    out = {}
    for ibge, feis in sob.items():
        fases: dict[str, dict] = defaultdict(lambda: {"n": 0, "area_ha": 0.0})
        for e in feis.values():
            fases[e["fase"]]["n"] += 1
            fases[e["fase"]]["area_ha"] += e["ha"]
        out[ibge] = {
            "n": len(feis),
            "area_ha": round(sum(e["ha"] for e in feis.values()), 2),
            "fases": {
                k: {"n": v["n"], "area_ha": round(v["area_ha"], 2)}
                for k, v in sorted(fases.items())
            },
            "titulado_n": sum(v["n"] for k, v in fases.items() if k in FASES_TITULADO),
        }
    return out


# ----------------------------------------------------------------------------------------------
# Montagem final e validações
# ----------------------------------------------------------------------------------------------
def juntar(
    censo: dict[str, dict], ti: dict[str, dict] | None, qu: dict[str, dict] | None
) -> dict[str, dict]:
    """Funde censo + camadas. Camada ausente (None) ⇒ campos null; camada presente e sem feição ⇒ 0."""
    linhas = {}
    for ibge, c in censo.items():
        l = dict(c)
        for pre, camada in (("ti", ti), ("quilombo", qu)):
            if camada is None:
                l[f"{pre}_n"] = l[f"{pre}_area_ha"] = l[f"{pre}_fases"] = None
                continue
            a = camada.get(ibge)
            l[f"{pre}_n"] = a["n"] if a else 0
            l[f"{pre}_area_ha"] = a["area_ha"] if a else 0.0
            l[f"{pre}_fases"] = a["fases"] if a else None
        l["quilombo_titulado_n"] = (
            None if qu is None else (qu[ibge]["titulado_n"] if ibge in qu else 0)
        )
        linhas[ibge] = l
    return linhas


CAMPOS_CONTAGEM = {
    "9605": [("total", "pop_total")],
    "9718": [("indigena", "pop_indigena"), ("indigena_cor_raca", "pop_indigena_cor_raca"),
             ("indigena_em_ti", "pop_indigena_em_ti")],
    "9578": [("quilombola", "pop_quilombola"), ("quilombola_em_territorio", "pop_quilombola_em_territorio")],
}  # fmt: skip


def validar_soma(
    linhas: dict[str, dict],
    publicado_uf: dict[str, dict],
    publicado_br: dict,
    campo: str,
    rot: str,
) -> dict:
    """Soma dos municípios (por UF e Brasil) vs. total publicado pelo IBGE (SIDRA n3/n1)."""
    por_uf: dict[str, int] = defaultdict(int)
    nulos_uf: dict[str, int] = defaultdict(int)
    for ibge, l in linhas.items():
        if l.get(campo) is None:
            nulos_uf[ibge[:2]] += 1
        else:
            por_uf[ibge[:2]] += l[campo]
    dif = {}
    for uf, pub in publicado_uf.items():
        pv = pub.get(rot)
        if pv is None:
            continue
        d = por_uf.get(uf, 0) - pv
        if d or nulos_uf.get(uf):
            dif[uf] = {
                "soma": por_uf.get(uf, 0),
                "publicado": pv,
                "dif": d,
                "municipios_nulos": nulos_uf.get(uf, 0),
            }
    soma_br = sum(por_uf.values())
    pb = publicado_br.get(rot)
    return {
        "campo": campo,
        "soma_municipios": soma_br,
        "publicado_brasil": pb,
        "dif_brasil": None if pb is None else soma_br - pb,
        "ufs_com_diferenca": dif,
        "municipios_nulos": sum(nulos_uf.values()),
    }


def validar_codigos(ids: list[str]) -> dict:
    """Código: 7 dígitos, string, UF conhecida; dígito verificador IBGE só informativo (alguns códigos oficiais
    não obedecem ao algoritmo, por isso `dv_nao_conforme` não reprova o build)."""

    def dv_ok(c: str) -> bool:
        pesos = (1, 2, 1, 2, 1, 2)
        s = 0
        for d, p in zip(c[:6], pesos):
            x = int(d) * p
            s += x // 10 + x % 10
        return (10 - s % 10) % 10 == int(c[6])

    ruins = [c for c in ids if not (len(c) == 7 and c.isdigit() and c[:2] in UFS)]
    dv = [c for c in ids if c not in ruins and not dv_ok(c)]
    return {"n": len(ids), "formato_invalido": ruins, "dv_nao_conforme": dv}


# ----------------------------------------------------------------------------------------------
# Build
# ----------------------------------------------------------------------------------------------
def _json(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def _ler_sidra(tabela: str) -> tuple[dict, dict, dict]:
    pasta = RAW / f"sidra_{tabela}"
    cam = CAMPOS[tabela]
    reg = []
    for cd in UFS:
        reg += parse_sidra(_json(pasta / f"mun_{cd}.json"))
    return (
        _por_terr(reg, cam),
        _por_terr(parse_sidra(_json(pasta / "uf.json")), cam),
        _por_terr(parse_sidra(_json(pasta / "brasil.json")), cam),
    )


def _fonte(nome: str, meta: dict, url: str, tabela: str) -> dict:
    return {
        "nome": nome,
        "url": url,
        "tabela": tabela,
        "baixado_em": meta["baixado_em"],
        "sha256": meta["sha256"],
    }


def build(baixar: bool = True) -> dict:
    provs = baixar_tudo() if baixar else {n: _json(RAW / n / "PROVENIENCIA.json") for n in
        [f"sidra_{t}" for t in TABELAS] + ["funai_tis_poligonais", "incra_quilombolas", "ibge_malha_maxima"]}  # fmt: skip
    lacunas = [
        "Território quilombola: a camada do INCRA contém só territórios com processo/delimitação; a maioria "
        "das comunidades quilombolas identificadas pelo Censo não tem polígono (quilombo_n = 0 não significa "
        "ausência de população quilombola).",
        "Terras indígenas: o Censo 2022 publica a população residente em TI por município (pop_indigena_em_ti), "
        "mas TIs sem polígono na FUNAI (p.ex. reservas/ocupações não delimitadas) e áreas em estudo sem "
        "geometria ficam fora de ti_*.",
        "Territórios quilombolas tradicionais sem processo no INCRA, terras estaduais não repassadas ao INCRA "
        "e quilombos urbanos não aparecem na camada. Nenhuma fonte exigiu login; nada foi contornado.",
    ]

    # --- censo ---
    pivots, pub_uf, pub_br = {}, {}, {}
    for t in TABELAS:
        pivots[t], pub_uf[t], pub_br[t] = _ler_sidra(t)
    censo = montar_censo(pivots)

    # --- camadas territoriais ---
    pf = RAW / "funai_tis_poligonais" / "tis_poligonais.json"
    pi = RAW / "incra_quilombolas"
    munis = malha_municipios(
        [_json(RAW / "ibge_malha_maxima" / f"uf_{cd}.json") for cd in UFS]
    )
    f_ti = feicoes_funai(_json(pf))
    f_qu = feicoes_incra(
        (pi / "areas_quilombolas.shp").read_bytes(),
        (pi / "areas_quilombolas.dbf").read_bytes(),
    )
    sob_ti, diag_ti = sobreposicao(f_ti, munis)
    sob_qu, diag_qu = sobreposicao(f_qu, munis)
    diag_ti["area_declarada_funai_ha"] = round(sum(f["ha_fonte"] or 0 for f in f_ti), 1)
    linhas = juntar(censo, agregar(sob_ti), agregar(sob_qu))

    # --- validações ---
    val: dict = {"codigos": validar_codigos(list(linhas))}
    val["somas"] = [
        validar_soma(linhas, pub_uf[t], pub_br[t].get("1", {}), c, r)
        for t, pares in CAMPOS_CONTAGEM.items() for r, c in pares
    ]  # fmt: skip
    val["municipios_com_pop_total_nula"] = sorted(
        i for i, l in linhas.items() if l["pop_total"] is None
    )
    val["municipios_sem_dado_censo"] = {
        c: sorted(i for i, l in linhas.items() if l[c] is None)
        for c in ("pop_indigena", "pop_quilombola", "pop_total")
    }
    if GEO.exists():
        geo_ids = {f["properties"]["ibge"] for f in _json(GEO)["features"]}
        val["join_geo"] = {
            "geo": len(geo_ids),
            "censo_sem_geo": sorted(set(linhas) - geo_ids),
            "geo_sem_censo": sorted(geo_ids - set(linhas)),
        }
    val["camada_sem_municipio_na_malha"] = {
        "ti": sorted(set(sob_ti) - set(munis)),
        "quilombo": sorted(set(sob_qu) - set(munis)),
    }
    val["malha_maxima_sem_censo"] = sorted(set(munis) - set(linhas))
    val["ti"] = diag_ti
    val["quilombo"] = diag_qu
    val["sobreposicao_min_ha"] = 1.0

    fontes = [
        _fonte(
            f"IBGE SIDRA tabela {t}", provs[f"sidra_{t}"], sidra_url(t, "n6/in n3 {UF}"),
            f"{t} — {TABELAS[t][0]}",
        )
        for t in TABELAS
    ]  # fmt: skip
    fontes.append(_fonte("FUNAI Geoserver — terras indígenas (polígonos)", provs["funai_tis_poligonais"], FUNAI_WFS,
                         "Funai:tis_poligonais"))  # fmt: skip
    fontes.append(_fonte("INCRA — Áreas de Quilombolas (shapefile)", provs["incra_quilombolas"], INCRA_ZIP,
                         "Áreas de Quilombolas"))  # fmt: skip
    fontes.append(_fonte("IBGE — malha municipal (qualidade máxima, por UF)", provs["ibge_malha_maxima"],
                         IBGE_MALHA_UF, "malhas/estados/{uf}"))  # fmt: skip

    out = {
        "meta": {
            "gerado_em": _agora(),
            "fontes": fontes,
            "aviso": AVISO,
            "lacunas": lacunas,
            "validacao": val,
        },
        "linhas": linhas,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    return out

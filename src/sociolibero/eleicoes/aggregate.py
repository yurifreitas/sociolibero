"""Seção eleitoral → município, com checagens de integridade entre arquivos independentes do TSE.

`votacao_secao` (votos por candidato) e `detalhe_votacao_secao` (aptos, comparecimento, brancos,
nulos) são publicados separadamente; reconciliá-los é a primeira validação do pipeline.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import duckdb
import pandas as pd

RAW = Path("data/raw")

# Totais nacionais publicados (conferência externa, inclui exterior). 2026: TSE 100% apurado
# em 05/10/2026 (noticiado); 2022: TSE oficial.
TOTAIS_PUBLICADOS = {
    (2026, 1): {13: 53_879_538, 22: 56_104_503},
    (2022, 1): {13: 57_259_504, 22: 51_072_345},
    (2022, 2): {13: 60_345_999, 22: 58_206_354},
}


@dataclass
class Resultado:
    ano: int
    turno: int
    secoes: pd.DataFrame  # uma linha por seção (sem exterior)
    candidatos: pd.DataFrame  # cd, nr, nome, votos (por município, sem exterior)
    candidatos_nome: dict[int, str]
    checagens: dict


def _csv(path: Path) -> str:
    return (
        f"read_csv('{path.as_posix()}', delim=';', quote='\"', header=true, "
        "encoding='latin-1', all_varchar=true, ignore_errors=false)"
    )


def carregar(ano: int, turno: int) -> Resultado:
    pv = RAW / f"votacao_secao_{ano}_BR" / f"votacao_secao_{ano}_BR.csv"
    pd_ = (
        RAW / f"detalhe_votacao_secao_{ano}" / f"detalhe_votacao_secao_{ano}_BRASIL.csv"
    )
    con = duckdb.connect()
    votos = con.sql(
        f"""
        SELECT CAST(CD_MUNICIPIO AS INT) cd, SG_UF uf, NM_MUNICIPIO nm,
               CAST(NR_ZONA AS INT) zona, CAST(NR_SECAO AS INT) secao,
               CAST(NR_VOTAVEL AS INT) nr, NM_VOTAVEL nome, CAST(QT_VOTOS AS INT) votos
        FROM {_csv(pv)}
        WHERE CAST(NR_TURNO AS INT) = {turno} AND CAST(CD_CARGO AS INT) = 1
        """
    ).df()
    det = con.sql(
        f"""
        SELECT CAST(CD_MUNICIPIO AS INT) cd, SG_UF uf, CAST(NR_ZONA AS INT) zona, CAST(NR_SECAO AS INT) secao,
               CAST(QT_APTOS AS INT) aptos, CAST(QT_COMPARECIMENTO AS INT) comp,
               CAST(QT_VOTOS_NOMINAIS AS INT) nominais, CAST(QT_VOTOS_LEGENDA AS INT) legenda,
               CAST(QT_VOTOS_BRANCOS AS INT) brancos, CAST(QT_VOTOS_NULOS AS INT) nulos,
               DS_MODELO_URNA urna, ST_SECAO_INSTALADA instalada, ST_SECAO_ANULADA anulada
        FROM {_csv(pd_)}
        WHERE CAST(NR_TURNO AS INT) = {turno} AND CAST(CD_CARGO AS INT) = 1
        """
    ).df()
    con.close()

    ck: dict = {"linhas_votos": len(votos), "linhas_detalhe": len(det)}

    # 1) totais nacionais (com exterior) vs. publicados
    nac = votos[~votos.nr.isin([95, 96])].groupby("nr").votos.sum()
    pub = TOTAIS_PUBLICADOS.get((ano, turno))
    if pub:
        ck["totais_publicados"] = {
            str(n): {
                "calculado": int(nac.get(n, 0)),
                "publicado": v,
                "dif": int(nac.get(n, 0)) - v,
            }
            for n, v in pub.items()
        }

    # 2) unicidade da chave de seção
    ck["secoes_duplicadas"] = int(det.duplicated(["cd", "zona", "secao"]).sum())

    # sem exterior (ZZ) e só seções instaladas e não anuladas
    det = det[(det.uf != "ZZ")]
    ck["secoes_nao_instaladas_ou_anuladas"] = int(
        ((det.instalada != "Sim") | (det.anulada == "Sim")).sum()
    )
    det = det[(det.instalada == "Sim") & (det.anulada != "Sim")].copy()
    det["validos"] = det.nominais + det.legenda

    # 3) coerência interna
    ck["comparecimento_maior_que_aptos"] = int((det.comp > det.aptos).sum())
    ck["validos_mais_brancos_nulos_diferente_comparecimento"] = int(
        ((det.validos + det.brancos + det.nulos) != det.comp).sum()
    )

    # 4) reconciliação entre arquivos: soma dos candidatos por seção == nominais+legenda
    cand = votos[(~votos.nr.isin([95, 96])) & (votos.uf != "ZZ")]
    soma = (
        cand.groupby(["cd", "zona", "secao"])
        .votos.sum()
        .rename("soma_cand")
        .reset_index()
    )
    m = det.merge(soma, on=["cd", "zona", "secao"], how="left")
    ck["secoes_sem_votos_no_outro_arquivo"] = int(m.soma_cand.isna().sum())
    ck["secoes_divergentes_votos_vs_detalhe"] = int(
        (m.soma_cand.notna() & (m.soma_cand != m.validos)).sum()
    )
    ck["secoes_total"] = len(det)

    nomes = (
        cand.drop_duplicates("nr").set_index("nr").nome.to_dict()
        if not cand.empty
        else {}
    )
    top2 = [int(n) for n in nac.sort_values(ascending=False).index[:2]]
    ck["top2"] = top2

    wide = (
        cand[cand.nr.isin(top2)]
        .pivot_table(
            index=["cd", "zona", "secao"], columns="nr", values="votos", aggfunc="sum"
        )
        .fillna(0)
        .astype(int)
    )
    wide.columns = [f"v{c}" for c in wide.columns]
    secoes = det.merge(
        wide.reset_index(), on=["cd", "zona", "secao"], how="left"
    ).fillna({f"v{c}": 0 for c in top2})
    mun = cand.groupby(["cd", "nr"]).votos.sum().reset_index()
    return Resultado(ano, turno, secoes, mun, nomes, ck)

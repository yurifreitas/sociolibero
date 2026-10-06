"""Dados de base: eleições (2022, 2024, 2026) e macro (BCB/Focus).

Tudo que é número eleitoral vem das fontes listadas em README.md. O que é
suposição do modelo (e não dado) fica em `ASSUMED` para ser visível e editável.
"""

from __future__ import annotations

import json
import urllib.request
from dataclasses import dataclass

# --- Eleições (dados) --------------------------------------------------------

PRESIDENT_2022_R2 = {"Lula": 50.9, "Bolsonaro": 49.1}  # % votos válidos

PRESIDENT_2026_R1 = {  # TSE, 100% apurado, 04/10/2026; % dos votos válidos
    "Flávio Bolsonaro (PL)": 47.03,
    "Lula (PT)": 45.16,
}
RUNOFF_DATE = "2026-10-25"

# Câmara 2026 (eleitos). PL=121, PT=70 (federação PT-PCdoB-PV=88), PP/União=87.
CHAMBER_2026 = {
    "PL": 121,
    "Fed. PT-PCdoB-PV": 88,
    "Fed. PP-União": 87,
    "PSD": 43,
    "Republicanos": 41,
}
CHAMBER_SEATS = 513

# Senado 2027 (81 cadeiras). Fontes divergem em 1 vaga no PL (28 vs 29).
SENATE_2027 = {
    "PL": 28,
    "Fed. União-PP": 12,
    "PT": 9,
    "MDB": 8,
    "PSD": 5,
}
SENATE_SEATS = 81

# Prefeituras 2024: PSD 891, MDB 864, PL 517. Capitais: PSD 5, MDB 5, PL 4.
MUNICIPAL_2024 = {"PSD": 891, "MDB": 864, "PL": 517}

# Governadores 2026 eleitos no 1º turno (20 de 27 UFs) — recorte por partido.
GOVERNORS_2026_R1 = {
    "PL": ["RS", "SC", "PR", "RO", "RR"],
    "Republicanos": ["SP", "MG", "MT"],
    "PT": ["CE", "PI", "BA"],
    "PSD": ["MA", "SE", "PE", "AP"],
    "PP": ["MS", "PB"],
    "MDB": ["GO"],
    "Podemos": ["PA"],
    "PSDB": ["AL"],
}

# STF: aposentadorias compulsórias (75 anos) no próximo mandato presidencial.
STF_VACANCIES = [
    {"ministro": "Luiz Fux", "data": "2028-04-26"},
    {"ministro": "Cármen Lúcia", "data": "2029-04-19"},
    {"ministro": "Gilmar Mendes", "data": "2030-12-30"},
]

# --- Suposições do modelo (NÃO são dados) -----------------------------------

ASSUMED = {
    # Composição do restante do Senado (19 cadeiras): fontes não discriminam.
    "senate_others": 19,
    # Fatia dos votos válidos restantes (7,81 pp) que vai para Flávio no 2º turno.
    "runoff_transfer_mean": 0.52,
    "runoff_transfer_sd": 0.07,
    "runoff_turnout_noise_pp": 1.2,
}


# --- Macro -------------------------------------------------------------------


@dataclass(frozen=True)
class MacroBase:
    debt_gross_gdp: float  # % PIB (DBGG)
    selic: float  # % a.a.
    ipca_expect: float  # % (Focus 2026)
    gdp_growth: float  # % (Focus 2026)
    primary: float  # % PIB (Focus 2026)
    source: str


FALLBACK = MacroBase(
    82.86, 13.50, 5.01, 1.85, -0.40, "fallback (BCB 08/2026 + Focus 02/10/2026)"
)


def _sgs(code: int) -> float | None:
    url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados/ultimos/1?formato=json"
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            return float(json.load(r)[0]["valor"])
    except Exception:
        return None


def load_macro_base() -> MacroBase:
    """DBGG ao vivo (SGS 13762); Selic/IPCA/PIB/primário vêm do Focus (manual)."""
    debt = _sgs(13762)
    if debt is None:
        return FALLBACK
    return MacroBase(
        debt,
        FALLBACK.selic,
        FALLBACK.ipca_expect,
        FALLBACK.gdp_growth,
        FALLBACK.primary,
        "BCB SGS 13762 (ao vivo) + Focus 02/10/2026",
    )

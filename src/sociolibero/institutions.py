"""Matriz de poder: o que cada maioria consegue (ou não) fazer.

Aqui entram os limites constitucionais. Um cenário só é "possível" se passa
pelos quóruns abaixo — é isso que transforma "e se X no STF" em probabilidade.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from . import data

# Quóruns (CF/88)
SENATE_ABS = 41  # art. 101: aprovação de ministro do STF, maioria absoluta (41/81)
PEC_SENATE = 49  # 3/5 de 81
PEC_CHAMBER = 308  # 3/5 de 513
SENATE_REMOVE_MINISTER = 54  # 2/3 de 81: impeachment de ministro do STF

# Posição ideológica (-1 esquerda … +1 direita) e disciplina de bancada no Senado.
# Posições são suposições editáveis.
BLOCS = {
    "PL": (+0.9, 0.95),
    "Fed. União-PP": (+0.4, 0.6),
    "PT": (-0.9, 0.97),
    "MDB": (0.0, 0.5),
    "PSD": (0.0, 0.5),
    "outros": (0.1, 0.4),
}


def senate_seats() -> dict[str, int]:
    seats = dict(data.SENATE_2027)
    seats["outros"] = data.SENATE_SEATS - sum(seats.values())
    return seats


@dataclass(frozen=True)
class Nominee:
    """Indicado ao STF. `controversy` é 0-1 e deve vir de fatos documentados
    (condenação, denúncia recebida, falta de requisito do art. 101), não de boato."""

    name: str
    ideology: float  # -1…+1
    controversy: float  # 0…1
    meets_art101: float  # prob. de preencher: 35-70 anos, notável saber jurídico, reputação ilibada


def senate_approval_prob(
    n: Nominee, rng: np.random.Generator, draws: int = 20_000
) -> float:
    """P(≥41 votos). Cada senador vota sim com prob. logística de (afinidade − controvérsia);
    bancadas disciplinadas se movem em bloco, indisciplinadas em indivíduos."""
    seats = senate_seats()
    ok = 0.0
    for _ in range(draws):
        yes = 0
        for bloc, k in seats.items():
            ideo, disc = BLOCS[bloc]
            dist = abs(n.ideology - ideo)  # 0…2
            logit = 2.5 * (1.3 - dist) - 4.0 * n.controversy
            p = 1 / (1 + np.exp(-logit))
            if rng.random() < disc:  # bloco move junto
                yes += k if rng.random() < p else 0
            else:
                yes += rng.binomial(k, p)
        ok += yes >= SENATE_ABS
    return ok / draws * n.meets_art101


def runoff_win_prob(rng: np.random.Generator, draws: int = 200_000) -> float:
    """P(Flávio vence o 2º turno) a partir do 1º turno de 04/10/2026.
    Sem pesquisa de 2º turno: depende das suposições em data.ASSUMED."""
    f, l = data.PRESIDENT_2026_R1.values()
    rest = 100 - f - l
    a = data.ASSUMED
    share = rng.normal(a["runoff_transfer_mean"], a["runoff_transfer_sd"], draws).clip(
        0, 1
    )
    noise = rng.normal(0, a["runoff_turnout_noise_pp"], draws)
    flavio = f + rest * share + noise
    return float((flavio > 50).mean())


# --- Câmara e votação genérica ---------------------------------------------------

CHAMBER_BLOCS = {  # (ideologia, disciplina) — suposições editáveis
    "PL": (+0.9, 0.95),
    "Fed. PP-União": (+0.4, 0.6),
    "Fed. PT-PCdoB-PV": (-0.9, 0.97),
    "PSD": (0.0, 0.5),
    "Republicanos": (+0.6, 0.7),
    "outros": (0.0, 0.4),
}
# Quóruns por instrumento (Câmara, Senado). LO: aproximação por presença (~90%) — proxy.
QUORUM = {
    "PEC": (PEC_CHAMBER, PEC_SENATE),
    "LC": (257, 41),
    "LO": (231, 37),
    "SENADO_ABS": (None, SENATE_ABS),
    "SENADO_2_3": (None, SENATE_REMOVE_MINISTER),
    "EXECUTIVO": (None, None),
}


def chamber_seats() -> dict[str, int]:
    seats = {
        k: data.CHAMBER_2026[k]
        for k in ("PL", "Fed. PP-União", "Fed. PT-PCdoB-PV", "PSD", "Republicanos")
    }
    seats["outros"] = data.CHAMBER_SEATS - sum(seats.values())
    return seats


def pass_prob(
    seats: dict[str, int],
    blocs: dict[str, tuple[float, float]],
    quorum: int | None,
    ideology: float,
    controversy: float,
    rng: np.random.Generator,
    draws: int = 5_000,
) -> float:
    """P(votos sim >= quorum) numa casa. Mesmo modelo de bancadas do Senado."""
    if quorum is None:
        return 1.0
    ok = 0
    for _ in range(draws):
        yes = 0
        for bloc, k in seats.items():
            ideo, disc = blocs[bloc]
            logit = 2.5 * (1.3 - abs(ideology - ideo)) - 4.0 * controversy
            p = 1 / (1 + np.exp(-logit))
            yes += (
                (k if rng.random() < p else 0)
                if rng.random() < disc
                else rng.binomial(k, p)
            )
        ok += yes >= quorum
    return ok / draws

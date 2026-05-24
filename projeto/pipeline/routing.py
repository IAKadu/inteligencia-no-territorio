"""
Gera o roteiro diário otimizado para cada ACS de uma equipe.
Usa Nearest Neighbor (greedy) para ordenar as visitas minimizando
a distância total percorrida a partir da sede da equipe.
"""

import pandas as pd
import numpy as np
from math import radians, sin, cos, sqrt, atan2
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
from config.settings import PARQUETS, load_config
from pipeline.score import calcular_scores


def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def _nearest_neighbor(origem: tuple, pontos: list[tuple]) -> list[int]:
    """
    Retorna índices de `pontos` na ordem da rota ótima (Nearest Neighbor).
    origem: (lat, lon) da sede
    pontos: lista de (lat, lon)
    """
    nao_visitados = list(range(len(pontos)))
    rota = []
    atual = origem

    while nao_visitados:
        distancias = [
            _haversine_km(atual[0], atual[1], pontos[i][0], pontos[i][1])
            for i in nao_visitados
        ]
        idx_min = nao_visitados[int(np.argmin(distancias))]
        rota.append(idx_min)
        atual = pontos[idx_min]
        nao_visitados.remove(idx_min)

    return rota


def gerar_agenda_equipe(
    equipe_id: str,
    df_scored: pd.DataFrame | None = None,
    capacidade: int | None = None,
) -> pd.DataFrame:
    """
    Gera a agenda diária para uma equipe, com rota otimizada.

    Retorna DataFrame com os pacientes selecionados na ordem de visita,
    com coluna `distancia_anterior_km` e `distancia_acumulada_km`.
    """
    import duckdb

    cfg = load_config()
    cap = capacidade or cfg["capacidade_turno_padrao"]

    if df_scored is None:
        df_scored = calcular_scores()

    # sede da equipe
    con = duckdb.connect()
    sede = con.execute(
        f"SELECT endereco_latitude, endereco_longitude FROM read_parquet('{PARQUETS['equipes']}')"
        f" WHERE equipe_id = '{equipe_id}'"
    ).fetchone()
    con.close()

    if not sede:
        raise ValueError(f"Equipe não encontrada: {equipe_id}")

    sede_lat, sede_lon = sede

    # candidatos da equipe com score > 0, ordenados por score desc
    candidatos = df_scored[
        (df_scored["equipe_id"] == equipe_id) &
        (df_scored["score_total"] > 0)
    ].copy()

    if candidatos.empty:
        return pd.DataFrame()

    candidatos = candidatos.sort_values("score_total", ascending=False)
    selecionados = candidatos.head(cap).reset_index(drop=True)

    # otimiza a rota
    pontos = list(zip(selecionados["endereco_latitude"], selecionados["endereco_longitude"]))
    ordem = _nearest_neighbor((sede_lat, sede_lon), pontos)

    selecionados = selecionados.iloc[ordem].reset_index(drop=True)
    selecionados["ordem_visita"] = selecionados.index + 1

    # calcula distâncias
    lats = [sede_lat] + list(selecionados["endereco_latitude"])
    lons = [sede_lon] + list(selecionados["endereco_longitude"])

    distancias = [
        _haversine_km(lats[i], lons[i], lats[i + 1], lons[i + 1])
        for i in range(len(selecionados))
    ]
    selecionados["distancia_anterior_km"] = [round(d, 2) for d in distancias]
    selecionados["distancia_acumulada_km"] = selecionados["distancia_anterior_km"].cumsum().round(2)

    return selecionados


def gerar_agendas_todas_equipes(df_scored: pd.DataFrame | None = None) -> dict[str, pd.DataFrame]:
    """Gera agendas para todas as equipes disponíveis."""
    if df_scored is None:
        df_scored = calcular_scores()

    equipes = df_scored["equipe_id"].unique()
    return {eid: gerar_agenda_equipe(eid, df_scored) for eid in equipes}


if __name__ == "__main__":
    df = calcular_scores()

    equipe_id = df["equipe_id"].value_counts().index[0]
    agenda = gerar_agenda_equipe(equipe_id, df)

    print(f"=== AGENDA DA EQUIPE {equipe_id[-8:]} ===\n")
    print(f"Distância total: {agenda['distancia_acumulada_km'].max():.1f} km\n")

    cols = ["ordem_visita", "faixa_etaria", "hipertenso", "diabetico", "gestacao",
            "n_visitas", "n_urg_ano", "score_total", "prioridade",
            "distancia_anterior_km", "flag_invisivel", "flag_crise_sem_vinculo"]
    print(agenda[cols].to_string())

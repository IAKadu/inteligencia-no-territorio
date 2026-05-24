"""
Calcula o score de risco para cada paciente e classifica a prioridade.
Consome o DataFrame de features e retorna o mesmo com colunas de score.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
from config.settings import load_config
from pipeline.features import extract_features


def _minimo_visitas(row: pd.Series, cfg: dict) -> int:
    mv = cfg["minimo_visitas_ano"]
    if row["faixa_etaria"] == "0-6":
        return mv["faixa_0_6"]
    if row["gestacao"]:
        return mv["gestacao"]
    if row["hipertenso"] and row["diabetico"]:
        return mv["hipertenso_diabetico"]
    if row["hipertenso"]:
        return mv["hipertenso"]
    if row["diabetico"]:
        return mv["diabetico"]
    if row["faixa_etaria"] == "66+":
        return mv["idoso_66plus"]
    return mv["default"]


def _score_clinico(row: pd.Series, cfg: dict) -> int:
    dc = cfg["dimensao_clinica"]
    score = 0
    if row["gestacao"]:
        score += dc["gestacao"]
    if row["faixa_etaria"] == "0-6":
        score += dc["faixa_0_6"]
    if row["hipertenso"] and row["diabetico"]:
        score += dc["hipertenso_diabetico"]
    elif row["hipertenso"]:
        score += dc["hipertenso"]
    elif row["diabetico"]:
        score += dc["diabetico"]
    if row["faixa_etaria"] == "66+":
        score += dc["idoso_66plus"]
    if row["situacao_vulnerabilidade"]:
        score += dc["vulnerabilidade"]
    return score


def calcular_scores(df: pd.DataFrame | None = None) -> pd.DataFrame:
    """
    Recebe DataFrame de features (ou extrai se None) e retorna
    o DataFrame com colunas de score adicionadas.
    """
    cfg = load_config()

    if df is None:
        df = extract_features()

    df = df.copy()

    # mínimo de visitas por perfil
    df["min_visitas"] = df.apply(_minimo_visitas, axis=1, cfg=cfg)

    # dimensão 1 — perfil clínico/social
    df["score_clinico"] = df.apply(_score_clinico, axis=1, cfg=cfg)

    # dimensão 2 — déficit vs. régua
    df["deficit_visitas"] = (df["min_visitas"] - df["n_visitas"]).clip(lower=0)
    df["score_deficit"] = df["deficit_visitas"] * cfg["dimensao_deficit"]["peso_por_visita_faltante"]

    # dimensão 3 — urgências recentes (decaimento temporal)
    du = cfg["dimensao_urgencia"]
    df["score_urgencia"] = (
        df["n_urg_30d"]  * du["peso_30d"] +
        df["n_urg_90d"]  * du["peso_90d"] +
        df["n_urg_180d"] * du["peso_180d"] +
        df["n_urg_ano"]  * du["peso_ano"]
    )

    # dimensão 4 — agendamento futuro
    df["score_agendamento"] = df["tem_agendamento_futuro"].map(
        {True: cfg["dimensao_agendamento"]["tem_agendamento"], False: 0}
    )

    # bônus para invisíveis
    bonus = cfg["bonus_invisivel"]
    df["flag_invisivel"] = False
    df["flag_crise_sem_vinculo"] = False

    alto_risco = (
        df["gestacao"] |
        (df["faixa_etaria"] == "0-6") |
        df["hipertenso"] |
        df["diabetico"] |
        (df["faixa_etaria"] == "66+") |
        df["situacao_vulnerabilidade"]
    )
    sem_visita = df["n_visitas"] == 0

    mask_ar = sem_visita & alto_risco
    mask_cs = sem_visita & (df["n_urg_ano"] >= 3)

    df.loc[mask_ar, "flag_invisivel"] = True
    df.loc[mask_cs, "flag_crise_sem_vinculo"] = True

    df["score_bonus"] = 0
    df.loc[mask_ar, "score_bonus"] += bonus["alto_risco_sem_visita"]
    df.loc[mask_cs, "score_bonus"] += bonus["crise_sem_vinculo"]

    # score total
    df["score_total"] = (
        df["score_clinico"] +
        df["score_deficit"] +
        df["score_urgencia"] +
        df["score_agendamento"] +
        df["score_bonus"]
    )

    # faixa de prioridade
    fp = cfg["faixas_prioridade"]
    df["prioridade"] = pd.cut(
        df["score_total"],
        bins=[-1, fp["atencao"] - 1, fp["urgente"] - 1, fp["critico"] - 1, float("inf")],
        labels=["ROTINA", "ATENCAO", "URGENTE", "CRITICO"],
    )

    return df


if __name__ == "__main__":
    df = calcular_scores()
    print(f"\nScore calculado para {len(df):,} pacientes\n")
    print("Distribuição de prioridade:")
    print(df["prioridade"].value_counts().sort_index().to_string())
    print(f"\nScore total — stats:")
    print(df["score_total"].describe().to_string())
    print(f"\nInvisíveis alto risco:      {df['flag_invisivel'].sum():,}")
    print(f"Crise sem vínculo (3+ urg): {df['flag_crise_sem_vinculo'].sum():,}")
    print(f"\nTop 5 scores:")
    cols = ["paciente_id","faixa_etaria","hipertenso","diabetico","gestacao",
            "n_visitas","n_urg_ano","score_total","prioridade"]
    print(df.nlargest(5, "score_total")[cols].to_string())

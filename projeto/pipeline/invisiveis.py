"""
Detecta e classifica pacientes invisíveis — sem nenhuma visita registrada.
Retorna três categorias por equipe ou para toda a base.
"""

import pandas as pd
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
from pipeline.score import calcular_scores


CATEGORIAS = {
    1: "Crise sem vínculo",
    2: "Alto risco sem contato",
    3: "Sem contato (sem condição especial)",
}


def detectar_invisiveis(df_scored: pd.DataFrame | None = None) -> pd.DataFrame:
    """
    Recebe DataFrame com scores calculados e retorna apenas os invisíveis
    classificados por categoria.
    """
    if df_scored is None:
        df_scored = calcular_scores()

    sem_visita = df_scored[df_scored["n_visitas"] == 0].copy()

    alto_risco = (
        sem_visita["gestacao"] |
        (sem_visita["faixa_etaria"] == "0-6") |
        sem_visita["hipertenso"] |
        sem_visita["diabetico"] |
        (sem_visita["faixa_etaria"] == "66+") |
        sem_visita["situacao_vulnerabilidade"]
    )

    sem_visita["categoria_invisivel"] = 3
    sem_visita.loc[alto_risco, "categoria_invisivel"] = 2
    sem_visita.loc[sem_visita["n_urg_ano"] >= 3, "categoria_invisivel"] = 1

    sem_visita["label_categoria"] = sem_visita["categoria_invisivel"].map(CATEGORIAS)

    return sem_visita.sort_values(["categoria_invisivel", "score_total"], ascending=[True, False])


def resumo_por_equipe(df_scored: pd.DataFrame | None = None) -> pd.DataFrame:
    """
    Retorna contagem de invisíveis por categoria e equipe.
    """
    if df_scored is None:
        df_scored = calcular_scores()

    inv = detectar_invisiveis(df_scored)

    resumo = (
        inv.groupby(["equipe_id", "categoria_invisivel", "label_categoria"])
        .size()
        .reset_index(name="n_invisiveis")
        .sort_values(["equipe_id", "categoria_invisivel"])
    )

    pivot = resumo.pivot_table(
        index="equipe_id",
        columns="categoria_invisivel",
        values="n_invisiveis",
        fill_value=0,
    ).rename(columns={1: "crise_sem_vinculo", 2: "alto_risco", 3: "sem_cond_especial"})

    pivot["total_invisiveis"] = pivot.sum(axis=1)
    return pivot.reset_index().sort_values("crise_sem_vinculo", ascending=False)


if __name__ == "__main__":
    df = calcular_scores()
    inv = detectar_invisiveis(df)

    print("=== PACIENTES INVISÍVEIS ===\n")
    for cat, label in CATEGORIAS.items():
        sub = inv[inv["categoria_invisivel"] == cat]
        print(f"Categoria {cat} — {label}: {len(sub):,}")

    print(f"\nTotal invisíveis: {len(inv):,} de {len(df):,} ({len(inv)/len(df)*100:.1f}%)")

    print("\n=== TOP 10 CRISES SEM VÍNCULO ===")
    cols = ["paciente_id", "equipe_id", "faixa_etaria", "hipertenso",
            "diabetico", "n_urg_ano", "score_total"]
    print(inv[inv["categoria_invisivel"] == 1].head(10)[cols].to_string())

    print("\n=== RESUMO POR EQUIPE (top 10) ===")
    print(resumo_por_equipe(df).head(10).to_string())

"""
Extração de features a partir dos Parquets via DuckDB.
Retorna um DataFrame com uma linha por paciente e todas as features
necessárias para o cálculo do score.
"""

import duckdb
import pandas as pd
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
from config.settings import PARQUETS


def extract_features(data_referencia: str | None = None) -> pd.DataFrame:
    """
    Extrai features de todos os pacientes.

    data_referencia: data de corte no formato 'YYYY-MM-DD'.
    Se None, usa a data máxima dos registros de visitas.
    """
    con = duckdb.connect()

    con.execute(f"CREATE VIEW equipes   AS SELECT * FROM read_parquet('{PARQUETS['equipes']}')")
    con.execute(f"CREATE VIEW pacientes AS SELECT * FROM read_parquet('{PARQUETS['pacientes']}')")
    con.execute(f"CREATE VIEW visitas   AS SELECT * FROM read_parquet('{PARQUETS['visitas']}')")
    con.execute(f"CREATE VIEW eventos   AS SELECT * FROM read_parquet('{PARQUETS['eventos']}')")

    if data_referencia is None:
        data_referencia = con.execute(
            "SELECT MAX(registrados_em) FROM visitas"
        ).fetchone()[0]

    df = con.execute(f"""
        WITH
        -- visitas por paciente
        vis AS (
            SELECT
                paciente_id,
                COUNT(*)                                       AS n_visitas,
                MAX(registrados_em::DATE)                      AS ultima_visita,
                DATE_DIFF('day', MAX(registrados_em::DATE),
                          '{data_referencia}'::DATE)           AS dias_sem_visita
            FROM visitas
            GROUP BY paciente_id
        ),

        -- urgências por paciente em diferentes janelas
        urg AS (
            SELECT
                paciente_id,
                COUNT(*) FILTER (WHERE data_referencia::DATE >=
                    ('{data_referencia}'::DATE - INTERVAL 30 DAY))   AS n_urg_30d,
                COUNT(*) FILTER (WHERE data_referencia::DATE >=
                    ('{data_referencia}'::DATE - INTERVAL 90 DAY))   AS n_urg_90d,
                COUNT(*) FILTER (WHERE data_referencia::DATE >=
                    ('{data_referencia}'::DATE - INTERVAL 180 DAY))  AS n_urg_180d,
                COUNT(*)                                              AS n_urg_ano
            FROM eventos
            WHERE tipo = 'urgencia-emergencia-ou-internacao'
            GROUP BY paciente_id
        ),

        -- agendamentos futuros
        age AS (
            SELECT
                paciente_id,
                COUNT(*) > 0  AS tem_agendamento_futuro
            FROM eventos
            WHERE tipo = 'agendamento'
              AND data_referencia::DATE > '{data_referencia}'::DATE
            GROUP BY paciente_id
        )

        SELECT
            p.paciente_id,
            p.equipe_id,
            p.unidade_id,
            p.faixa_etaria,
            p.sexo,
            p.raca_cor,
            p.situacao_vulnerabilidade,
            p.endereco_latitude,
            p.endereco_longitude,
            p.hipertenso,
            p.diabetico,
            p.gestacao,

            -- visitas
            COALESCE(v.n_visitas,       0)    AS n_visitas,
            v.ultima_visita,
            COALESCE(v.dias_sem_visita, 999)  AS dias_sem_visita,

            -- urgências
            COALESCE(u.n_urg_30d,  0) AS n_urg_30d,
            COALESCE(u.n_urg_90d,  0) AS n_urg_90d,
            COALESCE(u.n_urg_180d, 0) AS n_urg_180d,
            COALESCE(u.n_urg_ano,  0) AS n_urg_ano,

            -- agendamento
            COALESCE(a.tem_agendamento_futuro, FALSE) AS tem_agendamento_futuro

        FROM pacientes p
        LEFT JOIN vis v USING (paciente_id)
        LEFT JOIN urg u USING (paciente_id)
        LEFT JOIN age a USING (paciente_id)
    """).df()

    con.close()
    return df


if __name__ == "__main__":
    df = extract_features()
    print(f"Features extraídas: {len(df):,} pacientes, {df.shape[1]} colunas")
    print(df.dtypes)
    print(df.head(3).to_string())

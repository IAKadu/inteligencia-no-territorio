import sys
sys.path.insert(0, ".")

from pipeline.score import calcular_scores
from pipeline.invisiveis import detectar_invisiveis, resumo_por_equipe
from pipeline.routing import gerar_agenda_equipe
from pipeline.justificativas import adicionar_justificativas

print("=== VALIDACAO PIPELINE END-TO-END ===\n")

df = calcular_scores()
print(f"[1] Score calculado: {len(df):,} pacientes")
criticos = (df["prioridade"] == "CRITICO").sum()
urgentes = (df["prioridade"] == "URGENTE").sum()
print(f"    CRITICO: {criticos:,} | URGENTE: {urgentes:,}")
print(f"    Crise sem vinculo: {df['flag_crise_sem_vinculo'].sum():,}")

inv = detectar_invisiveis(df)
print(f"\n[2] Invisiveis detectados: {len(inv):,}")
for cat in [1, 2, 3]:
    n = (inv["categoria_invisivel"] == cat).sum()
    print(f"    Cat {cat}: {n:,}")

resumo = resumo_por_equipe(df)
print(f"\n[3] Resumo por equipe: {len(resumo)} equipes")
print(f"    Equipe com mais crises sem vinculo: {resumo.iloc[0]['crise_sem_vinculo']:.0f}")

equipe_id = df["equipe_id"].value_counts().index[0]
agenda = gerar_agenda_equipe(equipe_id, df, capacidade=6)
print(f"\n[4] Agenda equipe {equipe_id[-8:]}: {len(agenda)} visitas")
print(f"    Distancia total: {agenda['distancia_acumulada_km'].max():.2f} km")
print(f"    Scores: {agenda['score_total'].astype(int).tolist()}")

agenda = adicionar_justificativas(agenda)
print(f"\n[5] Justificativas geradas: {len(agenda)}")
print(f"    Exemplo: {agenda.iloc[0]['justificativa'][:80]}...")

print("\n=== TUDO OK ===")

"""
Painel do Gestor — Streamlit
Visualiza cobertura, risco e invisíveis por equipe.
"""

import sys
from pathlib import Path
import pandas as pd
import streamlit as st

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from pipeline.score import calcular_scores
from pipeline.invisiveis import detectar_invisiveis, resumo_por_equipe
from pipeline.routing import gerar_agenda_equipe
from pipeline.justificativas import adicionar_justificativas

st.set_page_config(
    page_title="Inteligência no Território",
    page_icon="🏥",
    layout="wide",
)

# ── Cache de dados ──────────────────────────────────────────────────────────────

@st.cache_data(show_spinner="Calculando scores...")
def carregar_dados():
    df = calcular_scores()
    inv = detectar_invisiveis(df)
    resumo = resumo_por_equipe(df)

    alto_risco = (
        df["gestacao"] | (df["faixa_etaria"] == "0-6") |
        df["hipertenso"] | df["diabetico"] |
        (df["faixa_etaria"] == "66+") | df["situacao_vulnerabilidade"]
    )
    df["alto_risco"] = alto_risco
    df["sem_visita"] = df["n_visitas"] == 0
    df["tem_urgencia"] = df["n_urg_ano"] > 0

    by_eq = df.groupby("equipe_id").agg(
        total=("paciente_id", "count"),
        alto_risco=("alto_risco", "sum"),
        sem_visita=("sem_visita", "sum"),
        urgencia=("tem_urgencia", "sum"),
    ).reset_index()
    by_eq["pct_risco"]    = (by_eq["alto_risco"] / by_eq["total"] * 100).round(1)
    by_eq["pct_sem_vis"]  = (by_eq["sem_visita"] / by_eq["total"] * 100).round(1)
    by_eq["pct_urgencia"] = (by_eq["urgencia"]   / by_eq["total"] * 100).round(1)
    by_eq["score_pressao"] = (
        by_eq["pct_risco"] * 0.4 +
        by_eq["pct_sem_vis"] * 0.4 +
        by_eq["pct_urgencia"] * 0.2
    ).round(1)
    by_eq["equipe_curta"] = by_eq["equipe_id"].str[-8:]
    by_eq = by_eq.sort_values("score_pressao", ascending=False).reset_index(drop=True)

    return df, inv, resumo, by_eq


df_scored, df_inv, df_resumo, df_equipes = carregar_dados()

# ── Header ──────────────────────────────────────────────────────────────────────

st.title("Inteligência no Território")
st.caption("Secretaria Municipal de Saúde — Rio de Janeiro")

# ── Métricas globais ────────────────────────────────────────────────────────────

c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("Pacientes cadastrados", f"{len(df_scored):,}")
c2.metric("CRÍTICO / URGENTE",
          f"{(df_scored['prioridade'].isin(['CRITICO','URGENTE'])).sum():,}")
c3.metric("Sem nenhuma visita",
          f"{(df_scored['n_visitas'] == 0).sum():,}",
          delta=f"{(df_scored['n_visitas']==0).mean()*100:.1f}% do total",
          delta_color="inverse")
c4.metric("Crise sem vínculo",
          f"{df_scored['flag_crise_sem_vinculo'].sum():,}",
          delta="3+ urgências, 0 visitas",
          delta_color="inverse")
c5.metric("Equipes monitoradas", f"{df_equipes['equipe_id'].nunique()}")

st.divider()

# ── Abas ────────────────────────────────────────────────────────────────────────

aba1, aba2, aba3, aba4 = st.tabs([
    "Ranking de Equipes",
    "Pacientes Invisíveis",
    "Agenda do ACS",
    "Distribuição de Risco",
])

# ── Aba 1 — Ranking de Equipes ──────────────────────────────────────────────────

with aba1:
    st.subheader("Score de pressão por equipe")
    st.caption("Peso: 40% risco clínico + 40% sem visita + 20% urgência")

    col_tabela, col_barra = st.columns([3, 2])

    with col_tabela:
        df_display = df_equipes[["equipe_curta", "total", "pct_risco",
                                  "pct_sem_vis", "pct_urgencia", "score_pressao"]].copy()
        df_display.columns = ["Equipe", "Pacientes", "% Risco", "% Sem Visita",
                               "% Urgência", "Score Pressão"]
        st.dataframe(
            df_display.style.background_gradient(subset=["Score Pressão"], cmap="RdYlGn_r"),
            use_container_width=True,
            height=500,
        )

    with col_barra:
        st.bar_chart(
            df_equipes.set_index("equipe_curta")["score_pressao"].head(20),
            color="#e74c3c",
        )

# ── Aba 2 — Pacientes Invisíveis ────────────────────────────────────────────────

with aba2:
    st.subheader("Pacientes sem nenhuma visita registrada")

    ci1, ci2, ci3 = st.columns(3)
    ci1.metric("Crise sem vínculo (3+ urgências)", f"{(df_inv['categoria_invisivel']==1).sum():,}",
               delta="prioridade máxima", delta_color="inverse")
    ci2.metric("Alto risco sem contato", f"{(df_inv['categoria_invisivel']==2).sum():,}",
               delta="condição crônica ou 66+", delta_color="inverse")
    ci3.metric("Sem condição especial", f"{(df_inv['categoria_invisivel']==3).sum():,}",
               delta="abaixo do mínimo de 2 visitas/ano", delta_color="inverse")

    st.divider()

    cat_sel = st.selectbox("Filtrar por categoria", [
        "Todas",
        "1 — Crise sem vínculo",
        "2 — Alto risco sem contato",
        "3 — Sem condição especial",
    ])

    equipe_sel_inv = st.selectbox(
        "Filtrar por equipe",
        ["Todas"] + df_equipes["equipe_id"].tolist(),
        format_func=lambda x: x if x == "Todas" else x[-8:],
    )

    filtro = df_inv.copy()
    if cat_sel != "Todas":
        filtro = filtro[filtro["categoria_invisivel"] == int(cat_sel[0])]
    if equipe_sel_inv != "Todas":
        filtro = filtro[filtro["equipe_id"] == equipe_sel_inv]

    cols_inv = ["paciente_id", "equipe_id", "faixa_etaria", "hipertenso",
                "diabetico", "gestacao", "n_urg_ano", "score_total",
                "prioridade", "label_categoria"]
    filtro["score_total"] = filtro["score_total"].astype(int)
    filtro["prioridade"] = filtro["prioridade"].astype(str)

    st.dataframe(
        filtro[cols_inv].head(500).style.background_gradient(subset=["score_total"], cmap="RdYlGn_r"),
        use_container_width=True,
        height=400,
    )
    st.caption(f"{len(filtro):,} pacientes invisíveis encontrados")

# ── Aba 3 — Agenda do ACS ───────────────────────────────────────────────────────

with aba3:
    st.subheader("Agenda diária por equipe")

    col_sel1, col_sel2 = st.columns([3, 1])
    equipe_agenda = col_sel1.selectbox(
        "Selecionar equipe",
        df_equipes["equipe_id"].tolist(),
        format_func=lambda x: x[-8:],
        key="sel_equipe_agenda",
    )
    capacidade = col_sel2.number_input("Visitas/turno", min_value=1, max_value=15, value=6)

    if st.button("Gerar agenda"):
        with st.spinner("Gerando agenda e justificativas..."):
            agenda = gerar_agenda_equipe(equipe_agenda, df_scored, capacidade)
            agenda = adicionar_justificativas(agenda)
            agenda["score_total"] = agenda["score_total"].astype(int)
            agenda["prioridade"] = agenda["prioridade"].astype(str)

        st.success(f"Agenda gerada — {len(agenda)} visitas | "
                   f"{agenda['distancia_acumulada_km'].max():.1f} km total")

        for _, row in agenda.iterrows():
            prioridade_cor = {
                "CRITICO": "🔴", "URGENTE": "🟠", "ATENCAO": "🟡", "ROTINA": "🟢"
            }.get(str(row["prioridade"]), "⚪")

            with st.expander(
                f"{prioridade_cor} Visita {int(row['ordem_visita'])} — "
                f"Score {int(row['score_total'])} | {row['prioridade']} | "
                f"{row['distancia_anterior_km']:.2f} km"
            ):
                cols_card = st.columns(2)
                with cols_card[0]:
                    st.markdown(f"**Perfil:** {row['faixa_etaria']}")
                    flags = []
                    if row["hipertenso"]: flags.append("Hipertenso")
                    if row["diabetico"]:  flags.append("Diabético")
                    if row["gestacao"]:   flags.append("Gestante")
                    if row["situacao_vulnerabilidade"]: flags.append("Vulnerável")
                    if row["flag_invisivel"]: flags.append("★ Primeiro contato")
                    if row["flag_crise_sem_vinculo"]: flags.append("⚠ Crise sem vínculo")
                    st.markdown(f"**Condições:** {', '.join(flags) if flags else '—'}")
                    st.markdown(f"**Visitas no ano:** {int(row['n_visitas'])}")
                    st.markdown(f"**Urgências no ano:** {int(row['n_urg_ano'])}")
                with cols_card[1]:
                    st.info(row["justificativa"])

        st.map(agenda[["endereco_latitude", "endereco_longitude"]].rename(
            columns={"endereco_latitude": "lat", "endereco_longitude": "lon"}
        ))

# ── Aba 4 — Distribuição de Risco ──────────────────────────────────────────────

with aba4:
    st.subheader("Distribuição de prioridade — todos os pacientes")

    col_pie, col_bar = st.columns(2)

    with col_pie:
        dist_prior = df_scored["prioridade"].value_counts().reset_index()
        dist_prior.columns = ["Prioridade", "Pacientes"]
        dist_prior["prioridade_str"] = dist_prior["Prioridade"].astype(str)
        st.dataframe(dist_prior[["prioridade_str", "Pacientes"]], use_container_width=True)

    with col_bar:
        st.bar_chart(
            df_scored["prioridade"].astype(str).value_counts(),
            color="#3498db",
        )

    st.divider()
    st.subheader("Cobertura por grupo prioritário")

    grupos = {
        "Gestantes":          df_scored["gestacao"],
        "Criancas 0-6":       df_scored["faixa_etaria"] == "0-6",
        "Hipertensos":        df_scored["hipertenso"],
        "Diabeticos":         df_scored["diabetico"],
        "Idosos 66+":         df_scored["faixa_etaria"] == "66+",
        "Vulneraveis":        df_scored["situacao_vulnerabilidade"],
    }

    rows = []
    for nome, mask in grupos.items():
        sub = df_scored[mask]
        visitados = (sub["n_visitas"] > 0).sum()
        abaixo = (sub["deficit_visitas"] > 0).sum()
        rows.append({
            "Grupo": nome,
            "Total": len(sub),
            "Visitados": visitados,
            "% Visitados": round(visitados / len(sub) * 100, 1) if len(sub) else 0,
            "Abaixo da regua": abaixo,
            "% Abaixo": round(abaixo / len(sub) * 100, 1) if len(sub) else 0,
        })

    df_grupos = pd.DataFrame(rows)
    st.dataframe(
        df_grupos.style.background_gradient(subset=["% Abaixo"], cmap="RdYlGn_r"),
        use_container_width=True,
    )

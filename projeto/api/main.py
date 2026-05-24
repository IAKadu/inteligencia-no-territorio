"""
API FastAPI — Inteligência no Território
Serve os dados de score, agenda, invisíveis e painel do gestor.
"""

from contextlib import asynccontextmanager
from typing import Optional
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
from config.settings import PARQUETS
from pipeline.score import calcular_scores
from pipeline.invisiveis import detectar_invisiveis, resumo_por_equipe
from pipeline.routing import gerar_agenda_equipe
from pipeline.justificativas import adicionar_justificativas


# cache em memória — recalculado no startup
_cache: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Carregando dados e calculando scores...")
    _cache["df_scored"] = calcular_scores()
    import pandas as pd
    from config.settings import PARQUETS
    eq = pd.read_parquet(PARQUETS["equipes"])
    _cache["equipes_hq"] = eq.set_index("equipe_id")[["endereco_latitude", "endereco_longitude"]].to_dict("index")
    print(f"Pronto. {len(_cache['df_scored']):,} pacientes | {len(eq)} equipes.")
    yield
    _cache.clear()


app = FastAPI(
    title="Inteligência no Território",
    description="API para priorização de visitas domiciliares dos ACS",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ────────────────────────────────────────────────────────────────────

class ItemAgenda(BaseModel):
    ordem_visita: int
    paciente_id: str
    faixa_etaria: str
    hipertenso: bool
    diabetico: bool
    gestacao: bool
    situacao_vulnerabilidade: bool
    score_total: int
    score_clinico: int
    score_deficit: int
    score_urgencia: int
    score_agendamento: int
    score_bonus: int
    deficit_visitas: int
    prioridade: str
    n_visitas: int
    dias_sem_visita: int
    n_urg_30d: int
    n_urg_ano: int
    tem_agendamento_futuro: bool
    flag_invisivel: bool
    flag_crise_sem_vinculo: bool
    distancia_anterior_km: float
    distancia_acumulada_km: float
    justificativa: str
    endereco_latitude: float
    endereco_longitude: float


class ResumoPainel(BaseModel):
    equipe_id: str
    total_pacientes: int
    pct_alto_risco: float
    pct_sem_visita: float
    pct_urgencia: float
    score_pressao: float
    crise_sem_vinculo: int
    alto_risco_invisivel: int


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "status": "ok",
        "pacientes_carregados": len(_cache.get("df_scored", [])),
        "endpoints": [
            "/equipes",
            "/equipes/{equipe_id}/agenda",
            "/equipes/{equipe_id}/invisiveis",
            "/gestao/painel",
            "/gestao/invisiveis",
            "/pipeline/recalcular",
        ],
    }


@app.get("/equipes")
def listar_equipes():
    df = _cache["df_scored"]
    equipes = df["equipe_id"].unique().tolist()
    hq = _cache.get("equipes_hq", {})
    coordenadas = {eid: hq[eid] for eid in equipes if eid in hq}
    return {"total": len(equipes), "equipes": equipes, "coordenadas": coordenadas}


@app.get("/equipes/{equipe_id}/agenda", response_model=list[ItemAgenda])
def agenda_equipe(
    equipe_id: str,
    capacidade: Optional[int] = Query(default=None, ge=1, le=450),
    com_justificativas: bool = Query(default=True),
):
    df = _cache.get("df_scored")
    if df is None:
        raise HTTPException(503, "Dados ainda carregando")

    if equipe_id not in df["equipe_id"].values:
        raise HTTPException(404, f"Equipe '{equipe_id}' não encontrada")

    agenda = gerar_agenda_equipe(equipe_id, df, capacidade)
    if agenda.empty:
        return []

    if com_justificativas:
        agenda = adicionar_justificativas(agenda)
    else:
        agenda["justificativa"] = ""

    for col in ["score_total", "score_clinico", "score_deficit", "score_urgencia",
                "score_agendamento", "score_bonus", "deficit_visitas",
                "n_visitas", "dias_sem_visita", "n_urg_30d", "n_urg_ano"]:
        agenda[col] = agenda[col].astype(int)
    agenda["prioridade"] = agenda["prioridade"].astype(str)

    return agenda.to_dict(orient="records")


@app.get("/equipes/{equipe_id}/invisiveis")
def invisiveis_equipe(equipe_id: str, categoria: Optional[int] = Query(default=None, ge=1, le=3)):
    df = _cache.get("df_scored")
    if df is None:
        raise HTTPException(503, "Dados ainda carregando")

    inv = detectar_invisiveis(df)
    inv = inv[inv["equipe_id"] == equipe_id]

    if inv.empty:
        return {"equipe_id": equipe_id, "total": 0, "invisiveis": []}

    if categoria:
        inv = inv[inv["categoria_invisivel"] == categoria]

    cols = ["paciente_id", "faixa_etaria", "hipertenso", "diabetico", "gestacao",
            "situacao_vulnerabilidade", "n_urg_ano", "score_total", "prioridade",
            "categoria_invisivel", "label_categoria", "endereco_latitude", "endereco_longitude"]

    inv["score_total"] = inv["score_total"].astype(int)
    inv["prioridade"] = inv["prioridade"].astype(str)

    return {
        "equipe_id": equipe_id,
        "total": len(inv),
        "invisiveis": inv[cols].head(200).to_dict(orient="records"),
    }


@app.get("/gestao/painel", response_model=list[ResumoPainel])
def painel_gestor():
    df = _cache.get("df_scored")
    if df is None:
        raise HTTPException(503, "Dados ainda carregando")

    inv_resumo = resumo_por_equipe(df).set_index("equipe_id")

    alto_risco = (
        df["gestacao"] | (df["faixa_etaria"] == "0-6") |
        df["hipertenso"] | df["diabetico"] |
        (df["faixa_etaria"] == "66+") | df["situacao_vulnerabilidade"]
    )
    df = df.copy()
    df["alto_risco"] = alto_risco
    df["sem_visita"] = df["n_visitas"] == 0
    df["tem_urgencia"] = df["n_urg_ano"] > 0

    by_eq = df.groupby("equipe_id").agg(
        total_pacientes=("paciente_id", "count"),
        n_alto_risco=("alto_risco", "sum"),
        n_sem_visita=("sem_visita", "sum"),
        n_urgencia=("tem_urgencia", "sum"),
    ).reset_index()

    by_eq["pct_alto_risco"] = (by_eq["n_alto_risco"] / by_eq["total_pacientes"] * 100).round(1)
    by_eq["pct_sem_visita"] = (by_eq["n_sem_visita"] / by_eq["total_pacientes"] * 100).round(1)
    by_eq["pct_urgencia"]   = (by_eq["n_urgencia"]   / by_eq["total_pacientes"] * 100).round(1)
    by_eq["score_pressao"]  = (
        by_eq["pct_alto_risco"] * 0.4 +
        by_eq["pct_sem_visita"] * 0.4 +
        by_eq["pct_urgencia"]   * 0.2
    ).round(1)

    by_eq = by_eq.join(
        inv_resumo[["crise_sem_vinculo", "alto_risco"]].rename(
            columns={"alto_risco": "alto_risco_invisivel"}
        ),
        on="equipe_id",
    )
    by_eq["crise_sem_vinculo"]   = by_eq["crise_sem_vinculo"].fillna(0).astype(int)
    by_eq["alto_risco_invisivel"] = by_eq["alto_risco_invisivel"].fillna(0).astype(int)

    return by_eq.sort_values("score_pressao", ascending=False).to_dict(orient="records")


@app.get("/gestao/indicadores")
def indicadores_dashboard():
    df = _cache.get("df_scored")
    if df is None:
        raise HTTPException(503, "Dados ainda carregando")

    df = df.copy()
    visitas = pd.read_parquet(PARQUETS["visitas"])
    eventos = pd.read_parquet(PARQUETS["eventos"])

    visitas["registrados_em"] = pd.to_datetime(visitas["registrados_em"])
    eventos["data_referencia"] = pd.to_datetime(eventos["data_referencia"])
    data_ref = visitas["registrados_em"].max()

    alto_risco = (
        df["gestacao"] | (df["faixa_etaria"] == "0-6") |
        df["hipertenso"] | df["diabetico"] |
        (df["faixa_etaria"] == "66+") | df["situacao_vulnerabilidade"]
    )
    sem_visita = df["n_visitas"] == 0
    deficit = df["deficit_visitas"] > 0
    urgencias = eventos[eventos["tipo"] == "urgencia-emergencia-ou-internacao"].copy()
    agendamentos = eventos[eventos["tipo"] == "agendamento"].copy()

    inv = detectar_invisiveis(df)
    por_cat = inv["categoria_invisivel"].value_counts().sort_index().to_dict()

    visitas_7d = visitas[visitas["registrados_em"] >= data_ref - pd.Timedelta(days=7)]
    visitas_30d = visitas[visitas["registrados_em"] >= data_ref - pd.Timedelta(days=30)]
    urg_30d = urgencias[urgencias["data_referencia"] >= data_ref - pd.Timedelta(days=30)]

    weekly = (
        visitas.assign(semana=visitas["registrados_em"].dt.to_period("W").dt.start_time)
        .groupby("semana")
        .size()
        .tail(8)
        .reset_index(name="visitas")
    )
    weekly["semana"] = weekly["semana"].dt.strftime("%d/%m")

    eventos_mensais = (
        eventos.assign(mes=eventos["data_referencia"].dt.to_period("M").astype(str))
        .groupby(["mes", "tipo"])
        .size()
        .reset_index(name="total")
        .tail(12)
    )

    top_profissionais = (
        visitas.groupby("profissional_id")
        .size()
        .sort_values(ascending=False)
        .head(10)
        .reset_index(name="visitas")
    )
    top_profissionais["profissional"] = top_profissionais["profissional_id"].str[-8:]

    # Para cada urgência, verifica se houve visita nos 30 dias anteriores.
    urg_com_visita = 0
    if not urgencias.empty:
        ultimas_visitas = visitas[["paciente_id", "registrados_em"]].rename(columns={"registrados_em": "data_visita"})
        urg_tmp = urgencias[["paciente_id", "data_referencia"]].reset_index(drop=True)
        merged = urg_tmp.merge(ultimas_visitas, on="paciente_id", how="left")
        janela = (
            (merged["data_visita"] <= merged["data_referencia"]) &
            (merged["data_visita"] >= merged["data_referencia"] - pd.Timedelta(days=30))
        )
        urg_com_visita = int(merged.loc[janela, ["paciente_id", "data_referencia"]].drop_duplicates().shape[0])
    urg_total = int(len(urgencias))
    urg_sem_visita = max(urg_total - urg_com_visita, 0)

    grupos = [
        {"grupo": "Gestantes", "total": int(df["gestacao"].sum())},
        {"grupo": "Crianças 0-6", "total": int((df["faixa_etaria"] == "0-6").sum())},
        {"grupo": "Hipertensos", "total": int(df["hipertenso"].sum())},
        {"grupo": "Diabéticos", "total": int(df["diabetico"].sum())},
        {"grupo": "Idosos 66+", "total": int((df["faixa_etaria"] == "66+").sum())},
        {"grupo": "Vulneráveis", "total": int(df["situacao_vulnerabilidade"].sum())},
    ]

    matriz = [
        {"bloco": "Visão Geral", "indicador": "Volume total da população", "valor": int(len(df)), "tipo": "Bruto"},
        {"bloco": "Visão Geral", "indicador": "Pacientes invisíveis", "valor": int(sem_visita.sum()), "tipo": "Cruzamento"},
        {"bloco": "Visão Geral", "indicador": "Crise sem vínculo", "valor": int(df["flag_crise_sem_vinculo"].sum()), "tipo": "Cruzamento"},
        {"bloco": "Equipes", "indicador": "Cadastro das equipes", "valor": int(df["equipe_id"].nunique()), "tipo": "Bruto"},
        {"bloco": "Visitas", "indicador": "Histórico bruto de visitas", "valor": int(len(visitas)), "tipo": "Bruto"},
        {"bloco": "Visitas", "indicador": "Produtividade por ACS", "valor": int(visitas["profissional_id"].nunique()), "tipo": "Bruto"},
        {"bloco": "Pacientes", "indicador": "Pacientes abaixo da régua", "valor": int(deficit.sum()), "tipo": "Cruzamento"},
        {"bloco": "Eventos", "indicador": "Histórico bruto de eventos", "valor": int(len(eventos)), "tipo": "Bruto"},
        {"bloco": "Eventos", "indicador": "Urgência sem visita prévia em 30 dias", "valor": int(urg_sem_visita), "tipo": "Cruzamento"},
    ]

    return {
        "atualizado_em": data_ref.strftime("%Y-%m-%d"),
        "visao_geral": {
            "total_pacientes": int(len(df)),
            "total_equipes": int(df["equipe_id"].nunique()),
            "alto_risco": int(alto_risco.sum()),
            "pct_alto_risco": round(float(alto_risco.mean() * 100), 1),
            "sem_visita": int(sem_visita.sum()),
            "pct_sem_visita": round(float(sem_visita.mean() * 100), 1),
            "critico_urgente": int(df["prioridade"].astype(str).isin(["CRITICO", "URGENTE"]).sum()),
            "crise_sem_vinculo": int(df["flag_crise_sem_vinculo"].sum()),
        },
        "composicao_clinica": grupos,
        "invisiveis": {
            "total": int(len(inv)),
            "crise_sem_vinculo": int(por_cat.get(1, 0)),
            "alto_risco_sem_contato": int(por_cat.get(2, 0)),
            "sem_condicao_especial": int(por_cat.get(3, 0)),
        },
        "visitas": {
            "total": int(len(visitas)),
            "ultimos_7d": int(len(visitas_7d)),
            "ultimos_30d": int(len(visitas_30d)),
            "profissionais_ativos": int(visitas["profissional_id"].nunique()),
            "media_por_profissional": round(float(len(visitas) / max(visitas["profissional_id"].nunique(), 1)), 1),
            "por_semana": weekly.to_dict(orient="records"),
            "top_profissionais": top_profissionais[["profissional", "visitas"]].to_dict(orient="records"),
        },
        "eventos": {
            "total": int(len(eventos)),
            "urgencias": urg_total,
            "agendamentos": int(len(agendamentos)),
            "urgencias_30d": int(len(urg_30d)),
            "urgencias_com_visita_30d": int(urg_com_visita),
            "urgencias_sem_visita_30d": int(urg_sem_visita),
            "pct_urgencias_sem_visita_30d": round(float(urg_sem_visita / max(urg_total, 1) * 100), 1),
            "por_mes_tipo": eventos_mensais.to_dict(orient="records"),
        },
        "pacientes": {
            "abaixo_regua": int(deficit.sum()),
            "pct_abaixo_regua": round(float(deficit.mean() * 100), 1),
            "dias_sem_visita_mediana": int(df["dias_sem_visita"].median()),
            "score_medio": round(float(df["score_total"].mean()), 1),
        },
        "matriz": matriz,
    }


@app.get("/gestao/risco")
def risco_geral():
    df = _cache.get("df_scored")
    if df is None:
        raise HTTPException(503, "Dados ainda carregando")

    resumo_prioridade = df["prioridade"].astype(str).value_counts().to_dict()

    grupos = {
        "Gestantes":     df["gestacao"],
        "Crianças 0-6":  df["faixa_etaria"] == "0-6",
        "Hipertensos":   df["hipertenso"],
        "Diabéticos":    df["diabetico"],
        "Idosos 66+":    df["faixa_etaria"] == "66+",
        "Vulneráveis":   df["situacao_vulnerabilidade"],
    }

    cobertura_grupos = []
    for nome, mask in grupos.items():
        sub = df[mask]
        total = len(sub)
        if total == 0:
            continue
        visitados = int((sub["n_visitas"] > 0).sum())
        abaixo = int((sub["deficit_visitas"] > 0).sum())
        cobertura_grupos.append({
            "Grupo": nome,
            "Total": total,
            "Visitados": visitados,
            "% Visitados": round(visitados / total * 100, 1),
            "Abaixo da regua": abaixo,
            "% Abaixo": round(abaixo / total * 100, 1),
        })

    return {
        "resumo_prioridade": resumo_prioridade,
        "cobertura_grupos": cobertura_grupos,
    }


@app.get("/gestao/invisiveis")
def invisiveis_geral(categoria: Optional[int] = Query(default=None, ge=1, le=3)):
    df = _cache.get("df_scored")
    if df is None:
        raise HTTPException(503, "Dados ainda carregando")

    inv = detectar_invisiveis(df)
    por_cat = inv["categoria_invisivel"].value_counts().sort_index().to_dict()

    if categoria:
        inv = inv[inv["categoria_invisivel"] == categoria]

    cols = ["paciente_id", "equipe_id", "faixa_etaria", "hipertenso", "diabetico", "gestacao",
            "situacao_vulnerabilidade", "n_urg_ano", "score_total", "prioridade",
            "categoria_invisivel", "label_categoria"]

    inv["score_total"] = inv["score_total"].astype(int)
    inv["prioridade"] = inv["prioridade"].astype(str)

    return {
        "total": len(inv),
        "por_categoria": por_cat,
        "invisiveis": inv[cols].head(500).to_dict(orient="records"),
    }


@app.post("/pipeline/recalcular")
def recalcular():
    _cache["df_scored"] = calcular_scores()
    return {"status": "ok", "pacientes": len(_cache["df_scored"])}

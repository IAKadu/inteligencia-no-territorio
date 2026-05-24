"""
Gera justificativas em linguagem natural para cada visita
usando o Claude Haiku via Anthropic API.
"""

import os
import pandas as pd
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

# carrega .env se existir
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

try:
    import anthropic
    _api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    _CLIENT = anthropic.Anthropic(api_key=_api_key) if _api_key else None
    _DISPONIVEL = bool(_api_key)
except Exception:
    _CLIENT = None
    _DISPONIVEL = False


_FALLBACKS = {
    "gestacao": (
        "Gestante em acompanhamento. Verificar andamento do pré-natal, "
        "checar pressão arterial e adesão às orientações de saúde."
    ),
    "faixa_0_6": (
        "Criança em faixa etária prioritária. Verificar desenvolvimento, "
        "calendário vacinal e condições gerais de saúde."
    ),
    "hipertenso_diabetico": (
        "Paciente com hipertensão e diabetes. Verificar pressão arterial, "
        "glicemia, adesão à medicação e sinais de complicações."
    ),
    "hipertenso": (
        "Paciente hipertenso. Verificar pressão arterial, "
        "adesão ao tratamento e eventuais queixas."
    ),
    "diabetico": (
        "Paciente diabético. Verificar glicemia, pés, "
        "adesão ao tratamento e sinais de complicações."
    ),
    "idoso": (
        "Idoso em acompanhamento. Verificar condições gerais, "
        "mobilidade, medicações e rede de suporte."
    ),
    "crise_sem_vinculo": (
        "Paciente com histórico de urgências sem acompanhamento prévio. "
        "Realizar primeiro contato, avaliar situação e iniciar vínculo de cuidado."
    ),
    "invisivel": (
        "Primeiro contato com este paciente. Apresentar-se, "
        "verificar condições de saúde e iniciar vínculo com a equipe."
    ),
    "urgencia_recente": (
        "Paciente com atendimento de urgência recente. "
        "Verificar o que ocorreu, checar evolução e avaliar necessidade de encaminhamento."
    ),
    "default": (
        "Visita de acompanhamento rotineiro. "
        "Verificar condições gerais de saúde e necessidades do paciente."
    ),
}


def _contexto_paciente(row: pd.Series) -> str:
    partes = []
    if row.get("flag_crise_sem_vinculo"):
        partes.append(f"{int(row['n_urg_ano'])} idas à urgência no último ano, sem nenhuma visita prévia do ACS")
    elif row.get("flag_invisivel"):
        partes.append("nunca recebeu visita do ACS")

    condicoes = []
    if row.get("gestacao"):
        condicoes.append("gestante")
    if row.get("hipertenso") and row.get("diabetico"):
        condicoes.append("hipertensa e diabética")
    elif row.get("hipertenso"):
        condicoes.append("hipertensa")
    elif row.get("diabetico"):
        condicoes.append("diabética")
    if row.get("faixa_etaria") == "0-6":
        condicoes.append("criança (0-6 anos)")
    if row.get("faixa_etaria") == "66+":
        condicoes.append("idosa (66+ anos)")
    if row.get("situacao_vulnerabilidade"):
        condicoes.append("em situação de vulnerabilidade social")
    if condicoes:
        partes.append("condições: " + ", ".join(condicoes))

    dias = row.get("dias_sem_visita", 0)
    if dias and dias < 999:
        partes.append(f"última visita há {int(dias)} dias")
    elif dias == 999:
        partes.append("sem registro de visitas anteriores")

    urg_30 = row.get("n_urg_30d", 0)
    urg_90 = row.get("n_urg_90d", 0)
    if urg_30:
        partes.append(f"{int(urg_30)} urgência(s) nos últimos 30 dias")
    elif urg_90:
        partes.append(f"{int(urg_90)} urgência(s) nos últimos 90 dias")

    if row.get("tem_agendamento_futuro"):
        partes.append("tem consulta agendada próxima")

    return "; ".join(partes) if partes else "sem condições especiais identificadas"


def _fallback(row: pd.Series) -> str:
    if row.get("flag_crise_sem_vinculo"):
        return _FALLBACKS["crise_sem_vinculo"]
    if row.get("n_urg_30d", 0) > 0:
        return _FALLBACKS["urgencia_recente"]
    if row.get("flag_invisivel"):
        return _FALLBACKS["invisivel"]
    if row.get("gestacao"):
        return _FALLBACKS["gestacao"]
    if row.get("faixa_etaria") == "0-6":
        return _FALLBACKS["faixa_0_6"]
    if row.get("hipertenso") and row.get("diabetico"):
        return _FALLBACKS["hipertenso_diabetico"]
    if row.get("hipertenso"):
        return _FALLBACKS["hipertenso"]
    if row.get("diabetico"):
        return _FALLBACKS["diabetico"]
    if row.get("faixa_etaria") == "66+":
        return _FALLBACKS["idoso"]
    return _FALLBACKS["default"]


def gerar_justificativa(row: pd.Series) -> str:
    """Gera justificativa para uma visita. Usa Claude se disponível, fallback se não."""
    if not _DISPONIVEL or not os.environ.get("ANTHROPIC_API_KEY"):
        return _fallback(row)

    contexto = _contexto_paciente(row)
    prompt = (
        "Você é um assistente de saúde da família do Rio de Janeiro. "
        "Gere uma instrução curta (2-3 linhas) para o Agente Comunitário de Saúde "
        "sobre por que visitar este paciente e o que verificar. "
        "Seja direto, clínico e acionável. Use português simples, sem jargão técnico. "
        "Não sugira diagnósticos. Não use mais de 3 linhas.\n\n"
        f"Perfil do paciente: {contexto}"
    )

    try:
        resp = _CLIENT.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.content[0].text.strip()
    except Exception:
        return _fallback(row)


def adicionar_justificativas(df_agenda: pd.DataFrame) -> pd.DataFrame:
    """Adiciona coluna 'justificativa' a um DataFrame de agenda."""
    df = df_agenda.copy()
    df["justificativa"] = df.apply(gerar_justificativa, axis=1)
    return df


if __name__ == "__main__":
    from pipeline.routing import gerar_agenda_equipe
    from pipeline.score import calcular_scores

    df = calcular_scores()
    equipe_id = df["equipe_id"].value_counts().index[0]
    agenda = gerar_agenda_equipe(equipe_id, df)
    agenda = adicionar_justificativas(agenda)

    print(f"=== AGENDA COM JUSTIFICATIVAS — Equipe {equipe_id[-8:]} ===\n")
    for _, row in agenda.iterrows():
        print(f"Visita {int(row['ordem_visita'])} | {row['prioridade']} | Score {int(row['score_total'])}")
        print(f"  {row['justificativa']}")
        print(f"  Dist: {row['distancia_anterior_km']:.2f} km\n")

# Arquitetura e Stack Técnica — Inteligência no Território

**Referência:** [06_sugestoes_de_solucao.md](06_sugestoes_de_solucao.md)
**Contexto:** hackathon com dados reais anonimizados; arquitetura deve ser funcional agora e extensível para produção

---

## Visão geral da arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         DADOS BRUTOS                           │
│   equipes.parquet  pacientes.parquet  visitas.parquet          │
│   eventos_clinicos.parquet                                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PIPELINE DE PROCESSAMENTO                    │
│                                                                 │
│   1. Ingestão & validação (DuckDB)                             │
│   2. Feature engineering (pandas / DuckDB SQL)                 │
│   3. Score de risco (regras + pesos configuráveis)             │
│   4. Roteamento (OR-Tools / Nearest Neighbor)                  │
│   5. Geração de justificativas (Claude API)                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API / BACKEND                          │
│                    FastAPI + DuckDB/SQLite                     │
└──────────────┬─────────────────────────────┬───────────────────┘
               │                             │
               ▼                             ▼
┌──────────────────────┐         ┌───────────────────────────┐
│   INTERFACE DO ACS   │         │    PAINEL DO GESTOR       │
│  (mobile-first web)  │         │  (dashboard analítico)    │
│  React / Next.js     │         │  Streamlit ou React       │
└──────────────────────┘         └───────────────────────────┘
```

---

## Camadas da arquitetura

### Camada 1 — Dados

**Stack:** DuckDB

**Por quê DuckDB?**
- Lê Parquet nativamente sem conversão: `SELECT * FROM 'pacientes.parquet'`
- In-process (sem servidor): zero infraestrutura para o hackathon
- Performance columnar: agrega 97k pacientes em milissegundos
- SQL padrão: fácil de auditar e explicar para a equipe da SMS

```sql
-- Exemplo: calcular déficit de visitas por paciente em uma query
SELECT
    p.paciente_id,
    p.equipe_id,
    p.hipertenso,
    p.diabetico,
    p.gestacao,
    p.faixa_etaria,
    p.situacao_vulnerabilidade,
    p.endereco_latitude,
    p.endereco_longitude,
    COUNT(v.paciente_id) AS n_visitas,
    MAX(v.registrados_em) AS ultima_visita,
    CURRENT_DATE - MAX(v.registrados_em::DATE) AS dias_sem_visita
FROM 'pacientes.parquet' p
LEFT JOIN 'visitas.parquet' v USING (paciente_id)
GROUP BY ALL
```

**Para produção:** migrar para PostgreSQL + PostGIS (suporte geoespacial nativo para roteamento).

---

### Camada 2 — Pipeline de Processamento

**Stack:** Python 3.11+ · pandas · DuckDB · OR-Tools · scikit-learn (opcional)

#### 2a. Feature Engineering

```python
# features calculadas a partir dos Parquets
features = [
    'n_visitas_ano',           # COUNT de visitas.parquet
    'dias_sem_visita',         # hoje - MAX(registrados_em)
    'n_urgencias_30d',         # COUNT eventos tipo urgência nos últimos 30 dias
    'n_urgencias_90d',
    'n_urgencias_ano',
    'tem_agendamento_futuro',  # COUNT eventos tipo agendamento com data futura
    'deficit_regua',           # min_visitas_perfil - n_visitas_ano
    # campos diretos de pacientes.parquet:
    'hipertenso', 'diabetico', 'gestacao',
    'faixa_etaria_0_6',        # one-hot de faixa_etaria
    'faixa_etaria_66plus',
    'situacao_vulnerabilidade',
]
```

#### 2b. Score de Risco

Duas abordagens possíveis — recomendamos começar pela A:

**Abordagem A — Regras com pesos explícitos (recomendada)**

```python
class ScoreRisco:
    PESOS = {
        'gestacao':              40,
        'faixa_etaria_0_6':      35,
        'hipertenso_diabetico':  30,
        'hipertenso':            20,
        'diabetico':             20,
        'faixa_etaria_66plus':   15,
        'vulnerabilidade':       10,
    }
    PESO_DEFICIT_VISITA   = 8   # por visita faltante vs. régua
    PESO_URGENCIA_30D     = 25  # por urgência nos últimos 30 dias
    PESO_URGENCIA_90D     = 15
    PESO_AGENDAMENTO      = 10  # tem consulta futura agendada
```

Vantagens: interpretável, auditável, editável pela SMS sem código, alinhado com protocolos clínicos existentes.

**Abordagem B — Modelo ML supervisionado (para fase 2)**

Target: `teve_urgencia_nos_proximos_90d` (label binária)
Features: todas as listadas acima
Modelo: `XGBClassifier` ou `RandomForestClassifier`

Requer validação clínica antes de usar em produção. Não recomendado para o hackathon pela dificuldade de explicar ao ACS.

#### 2c. Roteamento

**Stack:** Google OR-Tools (open source) ou algoritmo Nearest Neighbor manual

```python
# Nearest Neighbor — simples, suficiente para 5-7 pontos
from scipy.spatial.distance import cdist

def rotear_visitas(sede: tuple, pacientes: list[tuple]) -> list[int]:
    """
    sede: (lat, lon) da equipe
    pacientes: lista de (lat, lon) ordenada por score desc
    retorna: índices na ordem de visita otimizada
    """
    pontos = [sede] + pacientes
    distancias = cdist(pontos, pontos, metric='euclidean')
    # Nearest Neighbor a partir da sede
    ...
```

**Por quê não usar Google Maps API?**
- Coordenadas têm ruído de 100m — precisão de rota de rua seria falsa
- Custo de API desnecessário para o hackathon
- Distância euclidiana é suficiente para ordenar 5-7 pontos próximos

**Para produção:** OSRM (Open Source Routing Machine) com dados do OpenStreetMap — gratuito e preciso.

#### 2d. Justificativas em Linguagem Natural

**Stack:** Claude API (claude-haiku-4-5 para velocidade e custo)

```python
import anthropic

client = anthropic.Anthropic()

def gerar_justificativa(paciente: dict) -> str:
    prompt = f"""
    Você é um assistente de saúde da família.
    Gere uma instrução curta (2-3 linhas) para o Agente Comunitário de Saúde
    sobre por que visitar este paciente e o que verificar.

    Perfil do paciente:
    - Condições: {paciente['condicoes']}
    - Última visita: {paciente['dias_sem_visita']} dias atrás
    - Urgências recentes: {paciente['n_urgencias_90d']} nos últimos 90 dias
    - Consulta agendada: {paciente['agendamento']}
    - Déficit de visitas: {paciente['deficit_regua']} visitas abaixo da régua

    Seja direto, clínico e acionável. Não use jargão técnico.
    """
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text
```

Haiku é usado aqui pela latência baixa e custo mínimo — geração de texto simples e estruturado não requer Sonnet/Opus.

---

### Camada 3 — Backend / API

**Stack:** FastAPI · Uvicorn · DuckDB (embedded) · Pydantic

**Por quê FastAPI?**
- Python nativo: mesmo stack do pipeline
- Tipagem com Pydantic: validação automática
- OpenAPI docs automático: facilita integração com o frontend

#### Endpoints principais

```
GET  /equipes/{equipe_id}/agenda-semanal
     → lista priorizada + roteiro para os próximos 5 dias

GET  /equipes/{equipe_id}/invisíveis
     → pacientes de alto risco sem nenhuma visita

GET  /pacientes/{paciente_id}/score
     → score detalhado por dimensão + justificativa

GET  /gestao/painel
     → métricas consolidadas por equipe

POST /pipeline/recalcular
     → re-executa o score para todas as equipes
```

#### Estrutura de pastas

```
projeto/
├── data/
│   ├── equipes_anonimizadas.parquet
│   ├── pacientes_anonimizados.parquet
│   ├── visitas_anonimizadas.parquet
│   └── eventos_clinicos_anonimizados.parquet
├── pipeline/
│   ├── features.py          # extração de features via DuckDB
│   ├── score.py             # cálculo do score de risco
│   ├── routing.py           # roteamento por equipe
│   └── justificativas.py    # integração Claude API
├── api/
│   ├── main.py              # FastAPI app
│   ├── routers/
│   │   ├── equipes.py
│   │   ├── pacientes.py
│   │   └── gestao.py
│   └── schemas.py           # modelos Pydantic
├── frontend/
│   ├── acs/                 # interface do agente
│   └── gestor/              # painel do gestor
└── config/
    └── regua_visitas.yaml   # frequências mínimas por perfil (editável)
```

**`regua_visitas.yaml`** — configuração editável sem tocar em código:

```yaml
regras:
  - perfil: faixa_0_6
    min_visitas_ano: 7
    peso_score: 35
  - perfil: gestante
    min_visitas_ano: 6
    peso_score: 40
  - perfil: hipertenso_diabetico
    min_visitas_ano: 4
    peso_score: 30
  - perfil: idoso_66plus
    min_visitas_ano: 4
    peso_score: 15
  - perfil: default
    min_visitas_ano: 2
    peso_score: 0
```

---

### Camada 4 — Interfaces

#### 4a. Interface do ACS (mobile-first)

**Stack:** Next.js · Tailwind CSS · PWA

**Por quê mobile-first?**
O ACS trabalha em campo com smartphone. A interface precisa funcionar com conexão instável (PWA com cache offline) e ser operável com uma mão.

**Telas essenciais:**

```
┌─────────────────────────┐
│ Suas visitas de hoje    │
│ Equipe: [nome]          │
├─────────────────────────┤
│ 1. [Paciente A]         │
│    Gestante · 45d s/vis │
│    "Verificar pré-natal │
│    e consulta de 15/06" │
│    📍 2,3 km da sede    │
├─────────────────────────┤
│ 2. [Paciente B]         │
│    Hipertenso · 2 urg.  │
│    "Verificar adesão    │
│    à medicação"         │
│    📍 2,8 km da sede    │
├─────────────────────────┤
│ [Ver rota no mapa]      │
│ [Registrar visita]      │
└─────────────────────────┘
```

**Funcionalidades mínimas:**
- Lista de visitas do dia ordenada por rota
- Card com motivo da visita (gerado pelo Claude)
- Botão "Visita realizada" → atualiza o registro
- Modo offline com sincronização quando voltar a ter sinal

#### 4b. Painel do Gestor

**Stack (hackathon):** Streamlit
**Stack (produção):** React + Recharts/Nivo

**Por quê Streamlit no hackathon?**
Permite construir um painel analítico funcional em 2-3 horas, sem frontend developer dedicado.

**Visões do painel:**
- Mapa de calor das 49 equipes por score de pressão
- Gráfico: % cobertura por grupo prioritário (gestantes, crianças, hipertensos)
- Tabela: top pacientes invisíveis por equipe (drilldown)
- Evolução mensal do déficit de visitas

---

## Stack consolidada

| Camada | Hackathon | Produção |
|---|---|---|
| Armazenamento | DuckDB + Parquet | PostgreSQL + PostGIS |
| Pipeline | Python · pandas · DuckDB | Python · dbt · Airflow |
| Score | Regras com pesos (YAML) | Regras + XGBoost validado |
| Roteamento | Nearest Neighbor (scipy) | OR-Tools · OSRM |
| Justificativas | Claude API (Haiku) | Claude API (Haiku) |
| Backend | FastAPI · Uvicorn | FastAPI · Uvicorn · Docker |
| Interface ACS | Next.js · Tailwind · PWA | Next.js · Tailwind · PWA |
| Painel gestor | Streamlit | React · Recharts |
| Infra | Local / Railway | GCP Cloud Run · Cloud SQL |
| CI/CD | — | GitHub Actions |

---

## Decisões de arquitetura e justificativas

### Por que não ML supervisionado desde o início?

O modelo baseado em regras é preferível para o hackathon por três razões:
1. **Explicabilidade:** o ACS e o gestor precisam entender por que um paciente foi priorizado — um score de random forest não oferece isso
2. **Sem label confiável:** para treinar um modelo supervisionado, precisaríamos de "urgência nos próximos 90 dias" como target, mas o date shifting na anonimização compromete a integridade temporal
3. **Auditabilidade:** protocolos de saúde pública exigem rastreabilidade de decisões; regras explícitas são auditáveis, modelos caixa-preta não

### Por que processamento em batch e não real-time?

O ACS planeja a semana na segunda-feira de manhã. Um pipeline que roda uma vez por semana (ou diariamente à noite) é suficiente — não há necessidade de real-time. Isso simplifica drasticamente a infraestrutura.

### Por que Claude para as justificativas?

O texto gerado pelo Claude transforma um score numérico em instrução clínica acionável. Isso resolve o problema de adoção: o ACS não precisa entender o algoritmo — ele recebe uma instrução em português simples que faz sentido para ele. É a camada de "última milha" entre os dados e o trabalho de campo.

### Separação entre régua e código

Colocar as regras de frequência de visita em `regua_visitas.yaml` (e não hardcoded no Python) permite que a equipe da SMS atualize os protocolos sem alterar o código — o que é fundamental para manutenção a longo prazo por uma equipe de saúde, não de engenharia.

---

## Sequência de implementação sugerida

```
Semana 1 (hackathon)
├── Dia 1: Pipeline → features.py + score.py (regras)
├── Dia 1: Query de invisíveis (solução 2 — entrega rápida)
├── Dia 2: routing.py + integração Claude API (justificativas)
├── Dia 2: FastAPI básico (3 endpoints)
├── Dia 3: Interface ACS (lista do dia + cards)
└── Dia 3: Painel gestor (Streamlit)

Pós-hackathon (se aprovado)
├── Testes com ACS reais + validação dos pesos com a SMS
├── Migração para PostgreSQL + dados reais (sem anonimização)
├── Deploy em GCP Cloud Run
└── Integração com prontuário eletrônico (PEC/e-SUS)
```

# Spec — MVP para apoio à decisão dos ACS na reunião semanal

**Data:** 2026-05-24
**Contexto:** Claude Impact Lab Rio — desafio de saúde / Inteligência no Território (Agentes Comunitários de Saúde)
**Deadline:** entrega às 16:15 do dia 2026-05-24, submissão por email `eventos@taicor.ai`
**Nome interno (provisório):** Vigia ACS (definitivo a definir antes do pitch)

---

## 1. Resumo executivo

Construir uma ferramenta web — **um mini ERP** — que apoia a **reunião semanal** da equipe de Saúde da Família (médico, enfermeiro, ACS) na **repriorização** dos pacientes do território. A ferramenta:

1. **Recebe ingestão** das observações dos ACS via **WhatsApp em texto** (após a visita), processa com Claude e atualiza um banco estruturado.
2. **Mostra um dashboard** com pacientes priorizados por um **score composto e transparente**, listas filtráveis, alertas, e um **chat IA** que responde perguntas em linguagem natural usando o banco como contexto.
3. **Calcula um score escalável** baseado em 4 eixos (clínico, social, temporal, gatilho), com pesos parametrizáveis, pronto pra calibração em outras regiões.

O produto é **paralelo** ao Vitacare (sistema atual da prefeitura) — não substitui, complementa. Integração via export/import vai pro roadmap.

## 2. Contexto e motivação

### 2.1 Achados do dataset que justificam o produto

(referência completa em [docs/analise-completa-dataset-saude.md](../../analise-completa-dataset-saude.md))

- **50% dos cadastros nunca foram visitados em 1 ano** (48.838 de 97.938)
- **54.4% dos pacientes com urgência esperam >30 dias por followup** do ACS (mediana 36 dias)
- **43% dos pacientes são "fantasma"** (sem visita E sem evento clínico)
- **12.636 idosos 66+** nunca visitados — gap politicamente sensível

### 2.2 Citações que ancoram o pitch

- *"Hoje a gente não tem escore de risco."* — Carol Tarento, SMS-Rio (Q&A do Lab)
- *"Esse conhecimento tá na cabeça de cada um deles."*
- *"Botou caderninho. Tem muita gente pra botar caderninho."*
- *"No Brasil, o WhatsApp é um super."*
- *"Se o cara nunca foi, ele não tá na rota."*

### 2.3 O que NÃO existe hoje no sistema da SMS

- Escore de risco implementado (existe critério no doc, mas não há cálculo)
- Captura estruturada da reunião semanal (vive em caderno)
- Estrutura no uso do WhatsApp (canal existe, conversas são livres)
- Família como unidade (não existe na ferramenta atual)

## 3. Objetivos e não-objetivos

### 3.1 Objetivos (escopo do MVP)

1. **Ingestão via WhatsApp**: ACS manda mensagem de texto descrevendo o que viu na visita; sistema processa, identifica paciente, extrai dados estruturados, cria alertas se cabíveis.
2. **Dashboard de priorização**: lista de pacientes ordenada por score composto, com filtros e drill-down.
3. **Chat IA contextual**: usuário pergunta em linguagem natural; sistema responde com base no banco (RAG simples).
4. **Score transparente e escalável**: 4 eixos, pesos em JSON config, justificativa por paciente.
5. **Agenda por ACS**: visualização mensal por agente com % de completion do alvo de cobertura.

### 3.2 Não-objetivos (explicitamente fora do MVP)

- Substituir o Vitacare (integração via export é roadmap)
- Transcrição de áudio (Claude não transcreve; ingestão é text-only)
- Família como entidade canônica (vira roadmap; usamos heatmap territorial sem nomear "família")
- Autenticação multi-usuário (single-user na demo)
- Deploy em produção (rodamos localmente + ngrok pra webhook)
- Roteirização ótima de rotas (mencionamos como roadmap)
- Conexão real com Vitacare
- Integração com Bolsa Família ou outros sistemas externos
- Notificações push pro ACS (resposta é via WhatsApp reply do Twilio)
- Confirmação de identidade do ACS além do número WhatsApp

## 4. Stack e dependências

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | Next.js 15 (App Router) | Padrão atual, SSR/CSR fácil, deploy Vercel se precisar |
| Estilo | Tailwind + shadcn/ui | Velocidade + polish |
| Backend | Node.js 20 + TypeScript + Hono | Hono é leve, rápido, tipo bem, ideal pra hackathon |
| Banco | SQLite via `better-sqlite3` | Zero config, file-based, suficiente pra 100k registros |
| IA | Anthropic Claude (Sonnet 4.6) via `@anthropic-ai/sdk` | Modelo principal pra extração + chat |
| WhatsApp | Twilio WhatsApp Sandbox + SDK Node direto (`twilio` npm) | Setup ~20 min via Twilio CLI, real WhatsApp na demo, sem layer extra |
| Mapa | Leaflet + tiles OpenStreetMap | Gratuito, zero API key, suficiente pra heatmap |
| Webhook público | ngrok (free tier) | Expõe `localhost:3001` pro Twilio |
| ETL inicial | Python 3.14 + pandas + pyarrow | Reaproveita venv e EDA existentes |
| Empacotamento | `npm` | Padrão, evita debate de tool |
| Composio | **fora do MVP** (CLI instalado mas não usado) | Avaliado e rejeitado — pra WhatsApp sozinho é overhead. Roadmap: usar pra tool use Claude se conectar mais APIs |

### 4.1 Dependências externas (env vars necessárias)

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Twilio (SDK direto, via Twilio CLI / Console)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886    # sandbox padrão

# Banco
DATABASE_PATH=./db.sqlite

# Backend
PORT=3001
PUBLIC_WEBHOOK_URL=https://<ngrok-id>.ngrok.io

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Tudo isso vai em `.env` (gitignored) na raiz e em `.env.example` (commitado, sem valores).

## 5. Estrutura de pastas

```
Impact/
├── src/
│   ├── frontend/                       # Next.js
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                # dashboard home
│   │   │   ├── pacientes/
│   │   │   │   ├── page.tsx            # lista com filtros
│   │   │   │   └── [id]/page.tsx       # detalhe
│   │   │   ├── agenda/page.tsx         # calendário ACS + completion
│   │   │   └── chat/page.tsx           # chat IA
│   │   ├── components/
│   │   │   ├── ui/                     # shadcn components
│   │   │   ├── score-badge.tsx
│   │   │   ├── kpi-card.tsx
│   │   │   ├── patient-row.tsx
│   │   │   ├── heatmap-map.tsx         # Leaflet dynamic import
│   │   │   ├── chat/
│   │   │   │   ├── messages-list.tsx
│   │   │   │   ├── chat-input.tsx
│   │   │   │   └── streaming-message.tsx
│   │   │   └── filters/...
│   │   ├── lib/
│   │   │   ├── api.ts                  # client p/ backend
│   │   │   └── format.ts
│   │   ├── public/
│   │   ├── tailwind.config.ts
│   │   ├── next.config.mjs
│   │   └── package.json
│   │
│   └── backend/                        # Node API
│       ├── src/
│       │   ├── index.ts                # Hono entry, mount routes
│       │   ├── routes/
│       │   │   ├── webhook.ts          # POST /webhook/whatsapp
│       │   │   ├── patients.ts         # GET /api/patients, /:id
│       │   │   ├── score.ts            # GET /api/score/:id, POST /api/score/recompute
│       │   │   ├── chat.ts             # POST /api/chat (SSE streaming)
│       │   │   ├── alerts.ts           # GET /api/alerts
│       │   │   ├── agenda.ts           # GET /api/agenda
│       │   │   └── kpis.ts             # GET /api/kpis
│       │   ├── lib/
│       │   │   ├── db.ts               # better-sqlite3 client + helpers
│       │   │   ├── anthropic.ts        # Claude SDK wrapper
│       │   │   ├── twilio.ts           # Twilio SDK wrapper (send/receive)
│       │   │   ├── scoring.ts          # scoring engine (lê weights.json)
│       │   │   ├── extract.ts          # Claude prompt p/ extração de mensagem
│       │   │   └── chat-tools.ts       # tool definitions (query_patients, query_alerts, query_kpis)
│       │   ├── prompts/                # arquivos .md com prompts versionados
│       │   │   ├── extract-message.md
│       │   │   └── chat-system.md
│       │   ├── config/
│       │   │   └── scoring-weights.json
│       │   ├── types.ts
│       │   └── server.ts               # boot
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md                   # instruções de dev
│
├── scripts/                            # python existente + seed
│   ├── eda_*.py                        # ja existem (4 scripts)
│   └── seed_sqlite.py                  # NOVO: Parquet → SQLite + initial scoring
│
├── _inbox/data/*.parquet               # dados (ja existem)
├── _inbox/*.md                         # briefings e transcricoes
├── _refs/                              # repos de referencia (gitlinks)
├── docs/                               # ja existe
├── db.sqlite                           # gerado por seed_sqlite.py, NAO commitado
├── .env                                # gitignored
├── .env.example                        # template, commitado
├── .gitignore                          # ja existe, adicionar db.sqlite + node_modules
├── requirements.txt                    # ja existe
├── package.json                        # raiz, workspaces se quisermos
└── README.md                           # README do projeto (ja existe ou criar)
```

## 6. Schema do banco

### 6.1 Tabelas portadas do Parquet (script `seed_sqlite.py`)

```sql
CREATE TABLE equipes (
  equipe_id           TEXT PRIMARY KEY,
  endereco_latitude   REAL,
  endereco_longitude  REAL
);

CREATE TABLE pacientes (
  paciente_id               TEXT PRIMARY KEY,
  equipe_id                 TEXT REFERENCES equipes(equipe_id),
  unidade_id                TEXT,
  faixa_etaria              TEXT,
  sexo                      TEXT,
  raca_cor                  TEXT,
  situacao_vulnerabilidade  INTEGER,    -- 0/1 (bool)
  endereco_latitude         REAL,
  endereco_longitude        REAL,
  hipertenso                INTEGER,
  diabetico                 INTEGER,
  gestacao                  INTEGER
);
CREATE INDEX idx_pacientes_equipe ON pacientes(equipe_id);

CREATE TABLE visitas (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  profissional_id   TEXT,
  registrados_em    DATE,
  ordem_visita_dia  INTEGER,
  paciente_id       TEXT REFERENCES pacientes(paciente_id),
  origem            TEXT DEFAULT 'parquet'  -- 'parquet' | 'whatsapp'
);
CREATE INDEX idx_visitas_paciente ON visitas(paciente_id);
CREATE INDEX idx_visitas_data ON visitas(registrados_em);

CREATE TABLE eventos_clinicos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id     TEXT REFERENCES pacientes(paciente_id),
  tipo            TEXT,
  data_referencia DATE
);
CREATE INDEX idx_eventos_paciente ON eventos_clinicos(paciente_id);
```

### 6.2 Tabelas novas (criadas pelo backend)

```sql
CREATE TABLE registros_whatsapp (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  whatsapp_msg_id     TEXT UNIQUE,
  from_number         TEXT,                  -- telefone do ACS
  profissional_id     TEXT,                  -- match após lookup do número
  mensagem_texto      TEXT,
  dados_extraidos     TEXT,                  -- JSON: {paciente_referido, equipe_id, sintomas, acoes, alertas}
  paciente_id         TEXT REFERENCES pacientes(paciente_id),  -- nullable até match
  status              TEXT DEFAULT 'recebido',  -- 'recebido' | 'processado' | 'falha'
  recebido_em         DATETIME DEFAULT CURRENT_TIMESTAMP,
  processado_em      DATETIME
);

CREATE TABLE alertas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id   TEXT REFERENCES pacientes(paciente_id),
  tipo          TEXT,                        -- 'urgencia-followup' | 'gestante-risco' | 'medicacao-abandono' | etc
  mensagem      TEXT,
  prioridade    INTEGER DEFAULT 2,           -- 1=alta, 2=media, 3=baixa
  origem        TEXT,                        -- 'auto-scoring' | 'whatsapp' | 'manual'
  criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolvido_em  DATETIME
);
CREATE INDEX idx_alertas_paciente ON alertas(paciente_id);
CREATE INDEX idx_alertas_status ON alertas(resolvido_em);

CREATE TABLE pacientes_scores (
  paciente_id    TEXT PRIMARY KEY REFERENCES pacientes(paciente_id),
  score          REAL,                        -- 0-100
  fatores        TEXT,                        -- JSON array de factor IDs que contribuíram
  justificativa  TEXT,                        -- 1 frase gerada por Claude
  calculado_em   DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_scores_value ON pacientes_scores(score DESC);
```

## 7. Metodologia de scoring

### 7.1 Filosofia

- **Transparente**: cada paciente carrega a lista de fatores que contribuíram pro seu score
- **Explicável**: Claude gera 1 frase de justificativa em linguagem amigável
- **Calibrável**: pesos em JSON config (`backend/src/config/scoring-weights.json`) → outra região = outro arquivo
- **Determinístico**: dado o mesmo estado do banco, o score é reproduzível (sem aleatoriedade)
- **4 eixos**: clínico, social, temporal, gatilho

### 7.2 Fatores e pesos (padrão p/ Rio)

Arquivo `backend/src/config/scoring-weights.json`:

```json
{
  "max_score": 100,
  "factors": {
    "clinical": {
      "gestante": 15,
      "crianca_0_6": 12,
      "hipertenso_e_diabetico": 12,
      "hipertenso_xor_diabetico": 6,
      "idoso_66_mais": 8
    },
    "social": {
      "situacao_vulnerabilidade": 12
    },
    "temporal": {
      "sem_visita_180_mais": 20,
      "sem_visita_90_a_180": 10,
      "sem_visita_30_a_90": 3
    },
    "gatilho": {
      "urgencia_menor_30d": 25,
      "urgencia_30_a_90d": 10,
      "agendamento_proximo_14d": 5
    }
  }
}
```

Soma teórica máxima: ~113 → clipped a 100 (ou min(soma, 100)).

### 7.3 Pseudocódigo do scoring engine

```typescript
function computeScore(patientId: string, weights: ScoringWeights): ScoreResult {
  const p = db.getPaciente(patientId);
  const visitas = db.getVisitas(patientId);
  const eventos = db.getEventos(patientId);

  const fatores: string[] = [];
  let total = 0;

  // Clinico
  if (p.gestacao) { fatores.push('gestante'); total += weights.clinical.gestante; }
  if (p.faixa_etaria === '0-6') { fatores.push('crianca_0_6'); total += weights.clinical.crianca_0_6; }
  if (p.hipertenso && p.diabetico) {
    fatores.push('hipertenso_e_diabetico');
    total += weights.clinical.hipertenso_e_diabetico;
  } else if (p.hipertenso || p.diabetico) {
    fatores.push('hipertenso_xor_diabetico');
    total += weights.clinical.hipertenso_xor_diabetico;
  }
  if (p.faixa_etaria === '66+') { fatores.push('idoso_66_mais'); total += weights.clinical.idoso_66_mais; }

  // Social
  if (p.situacao_vulnerabilidade) { fatores.push('situacao_vulnerabilidade'); total += weights.social.situacao_vulnerabilidade; }

  // Temporal — dias desde última visita (intra-paciente, válido apesar do date shift)
  const ultimaVisita = visitas.length ? maxDate(visitas.map(v => v.registrados_em)) : null;
  const diasSemVisita = ultimaVisita ? daysBetween(ultimaVisita, now()) : Infinity;
  if (diasSemVisita > 180) { fatores.push('sem_visita_180_mais'); total += weights.temporal.sem_visita_180_mais; }
  else if (diasSemVisita > 90) { fatores.push('sem_visita_90_a_180'); total += weights.temporal.sem_visita_90_a_180; }
  else if (diasSemVisita > 30) { fatores.push('sem_visita_30_a_90'); total += weights.temporal.sem_visita_30_a_90; }

  // Gatilho — urgência recente, agendamento próximo
  const urgencias = eventos.filter(e => e.tipo === 'urgencia-emergencia-ou-internacao');
  const ultimaUrgencia = urgencias.length ? maxDate(urgencias.map(e => e.data_referencia)) : null;
  if (ultimaUrgencia) {
    const dias = daysBetween(ultimaUrgencia, now());
    if (dias < 30) { fatores.push('urgencia_menor_30d'); total += weights.gatilho.urgencia_menor_30d; }
    else if (dias < 90) { fatores.push('urgencia_30_a_90d'); total += weights.gatilho.urgencia_30_a_90d; }
  }
  const agendamentos = eventos.filter(e => e.tipo === 'agendamento' && daysBetween(now(), e.data_referencia) <= 14);
  if (agendamentos.length) { fatores.push('agendamento_proximo_14d'); total += weights.gatilho.agendamento_proximo_14d; }

  const score = Math.min(total, weights.max_score);
  return { score, fatores };
}
```

A justificativa em texto é gerada chamando Claude com `fatores` + dados do paciente, pedindo 1 frase ≤120 chars. Cache em `pacientes_scores.justificativa`.

### 7.4 Quando o score é recalculado

- **Batch inicial** em `seed_sqlite.py` (todos os 97.938 pacientes)
- **Por paciente** quando uma nova visita ou evento é inserido (ex: webhook do WhatsApp criou visita derivada)
- **Endpoint manual** `POST /api/score/recompute` (admin)

### 7.5 Ressalva sobre datas

Como o dataset tem date shifting por paciente, "dias desde última visita" só é confiável **intra-paciente**. Pra demo, isso basta — a comparação entre pacientes é por score absoluto, não por data.

## 8. Fluxos críticos

### 8.1 Ingestão via WhatsApp (text-only)

```
ACS faz a visita → abre WhatsApp da equipe → digita:
  "Visitei Antonia Souza, equipe 3. Pressão alta, não tomou remédio essa semana. Filho com tosse."
  ↓
Twilio Sandbox recebe → manda POST p/ ngrok → POST /webhook/whatsapp
  ↓
Backend:
  1. Valida assinatura Twilio
  2. Persiste raw em registros_whatsapp (status=recebido)
  3. Chama Claude com prompt extract-message:
     - input: texto + (opcional) últimos N pacientes da equipe do remetente
     - output JSON: {paciente_referido: "Antonia Souza", equipe_id: "3", sintomas: [...], alertas: [...], visita_realizada: true}
  4. Match paciente_id por:
     - lookup no DB: equipe + similarity de nome
     - se ambíguo: usa o melhor score + flag confidence
     - se zero match: status=falha + Twilio reply "Não encontrei paciente"
  5. Insere registro derivado em visitas (origem='whatsapp')
  6. Insere alertas se aplicável
  7. Recompute score do paciente
  8. Atualiza registros_whatsapp.status=processado
  9. Twilio reply: "✅ Registrado pra Antonia S. (equipe 3). Score 58→81. Alerta de hipertensão criado."
  ↓
Frontend (dashboard aberto): polling a cada 5s pega novos alertas + scores (SSE pode entrar como melhoria pós-MVP)
```

### 8.2 Chat IA na reunião semanal (SSE streaming)

```
Usuário no dashboard /chat digita:
  "Quem precisa de visita prioritária amanhã na equipe 3?"
  ↓
Frontend → POST /api/chat (body: { message, history })
  ↓
Backend:
  1. Chama Claude com **tool use** — disponibiliza ferramentas read-only do tipo `query_patients`, `query_alerts`, `query_kpis` com parâmetros estruturados (sem SQL livre — whitelist explícita)
  2. Claude decide quais ferramentas chamar, backend executa as queries, devolve resultados
  3. Limit 50 linhas por query
  4. Compõe prompt final:
     - system: chat-system.md (regras, schema, persona "assistente da reunião semanal")
     - tool definitions com whitelist (query_patients, query_alerts, query_kpis)
     - history + user message
  5. Stream resposta final do Claude via SSE pro frontend (após tool use loop fechar)
  6. Frontend renderiza streaming, inclui citações (paciente_id, equipe_id) quando Claude citar
```

### 8.3 Edge cases

| Caso | Tratamento |
|---|---|
| Mensagem WhatsApp sem paciente identificável | reply solicitando esclarecimento |
| Múltiplos pacientes com nomes similares | usa o melhor match + reply pedindo confirmação |
| Webhook duplicado (Twilio retry) | unique constraint em `whatsapp_msg_id` evita dup |
| ngrok cair | webhook reply falha; ACS recebe erro do Twilio |
| Claude timeout | retry 1x; se falhar, status=falha + log + alerta |
| Mensagem com áudio anexado | reply "Por favor envie como texto. Em breve aceitamos áudio." |
| ACS desconhecido (número não cadastrado) | aceita mas marca `profissional_id=null`; assume primeiro ACS da equipe se houver |

## 9. APIs / endpoints (backend)

| Método | Rota | Função |
|---|---|---|
| `POST` | `/webhook/whatsapp` | Twilio webhook |
| `GET` | `/api/kpis` | KPIs do dashboard home |
| `GET` | `/api/patients` | listagem com filtros (`?equipe_id=&score_min=&group=&limit=&offset=`) |
| `GET` | `/api/patients/:id` | detalhe + score breakdown + visitas + eventos |
| `GET` | `/api/alerts` | lista de alertas (`?status=open`) |
| `POST` | `/api/alerts/:id/resolve` | marca alerta como resolvido |
| `GET` | `/api/agenda` | calendário/completion por ACS (`?profissional_id=&month=`) |
| `POST` | `/api/score/recompute` | force recompute (admin) |
| `POST` | `/api/chat` | chat IA com SSE streaming |
| `GET` | `/api/territory/heatmap` | dados pro heatmap (urgências por célula 100m) |

Todas as rotas devolvem JSON. CORS configurado pra frontend localhost.

## 10. UI / rotas (frontend)

| Rota | Componentes-chave |
|---|---|
| `/` | KPI cards (cobertura, alertas novos, gap pós-urgência), top 20 pacientes prioritários, heatmap territorial |
| `/pacientes` | tabela filtrável (equipe, faixa, grupos), badge de fatores, paginação |
| `/pacientes/[id]` | tabs: histórico, score breakdown (axis chart), alertas ativos, registros WhatsApp |
| `/agenda` | seletor de ACS + calendário mensal + % completion vs alvo |
| `/chat` | lista de mensagens, input, streaming, sugestões de pergunta |

Layout: sidebar fixa com nav, header com identificador da equipe selecionada, conteúdo principal.

## 11. Demo narrative (6 min)

| Tempo | Cena | Ator |
|---|---|---|
| 0:00-0:30 | Problema: estatísticas-headline + caderninho | Apresentador 1 |
| 0:30-1:30 | Tour do dashboard projetado, top pacientes priorizados, mapa | Apresentador 1 |
| 1:30-3:30 | **Demo ao vivo:** Apresentador 2 (ACS no palco) abre WhatsApp Sandbox, digita "Visitei dona Antônia equipe 3 pressão alta não tomou remédio filho com tosse". Mensagem chega. Dashboard atualiza em ~5s. Alerta novo aparece. Score sobe. | Ambos |
| 3:30-5:00 | **Chat IA:** Apresentador 1 pergunta "Quem precisa de visita prioritária amanhã na equipe 3?" → IA responde com lista justificada | Apresentador 1 |
| 5:00-6:00 | Roadmap (família, voz, integração Vitacare, escalabilidade) + fechamento | Apresentador 1 |

## 12. Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Twilio Sandbox não autoriza/configura | Baixa | Alto | Em paralelo, ter mock de UI que simule WhatsApp (web page com form de mensagem); cair pra mock se 1h sem progresso |
| Match de paciente falha muito | Alta | Médio | Limitar demo a 2-3 pacientes pré-cadastrados com nomes únicos; aceitar fallback "qual paciente?" como conversa |
| ngrok cai durante demo | Baixa | Alto | Iniciar ngrok antes, testar webhook 30 min antes do pitch, ter URL backup |
| Claude rate limit / lentidão | Baixa | Médio | Usar Sonnet (mais barato/rápido que Opus), cache de prompts comuns |
| Schema do Parquet quebrar no SQLite (tipos) | Baixa | Alto | seed_sqlite.py com asserts explícitos; rodar early |
| Dashboard polling não atualiza visivelmente na demo | Baixa | Alto | Forçar fetch on focus + botão "refresh" visível como backup |
| Bug na hora H | Média | Variável | Testar end-to-end 1h antes; ter screenshots de backup pra slides |

## 13. Trabalho paralelizado (sugestão)

| Dev | Trilha | Tempo (~4h) |
|---|---|---|
| **A** (backend/TS) | Hono setup → webhook Twilio → Claude extração → scoring engine → endpoints REST | 3.5h |
| **B** (frontend/TS) | Next.js scaffold → shadcn install → páginas `/`, `/pacientes`, `/pacientes/[id]`, `/chat` → integração com backend | 3.5h |
| **C** (Python+Composio) | `seed_sqlite.py` (~30min) → Composio/Twilio init (~30min) → ngrok config → ajuda backend ou frontend nos buracos | 3.5h |
| **Peter** | Orquestração + README + demo script + ensaio + submissão | continuo |

Marcos:
- **+0:30** ngrok up, env files distribuídos, composio link rodado
- **+2:00** primeira mensagem WhatsApp chegando no backend (mesmo que parsing falhe)
- **+3:00** end-to-end funcionando (WhatsApp → dashboard atualiza)
- **+3:45** polish + README + ensaio
- **+4:00** submeter para `eventos@taicor.ai`

## 14. Definition of Done (critério de "pronto pra entregar")

- [ ] `seed_sqlite.py` popula `db.sqlite` com todas as tabelas + scores iniciais sem erro
- [ ] Backend roda em `localhost:3001` e responde a `/api/kpis` retornando JSON válido
- [ ] Webhook recebe mensagem do WhatsApp Sandbox e persiste em `registros_whatsapp`
- [ ] Para uma mensagem-teste válida, o pipeline completa: persiste → extrai → match → cria visita → recompute score → reply
- [ ] Frontend mostra lista de pacientes ordenada por score, com filtros funcionais
- [ ] Frontend `/pacientes/[id]` mostra detalhe + score breakdown
- [ ] Chat IA responde uma pergunta de listagem retornando lista coerente
- [ ] Heatmap renderiza no `/` (pode ser estático, ok)
- [ ] README com nome da equipe, membros, tema, resumo, arquitetura, link demo (ou vídeo de 60s)
- [ ] Push final pro `peterflagdooor/impact-acs-rio`
- [ ] Email enviado pra `eventos@taicor.ai` com link do repo até 16:15

## 15. Decisões registradas

(captura para futura referência durante implementação)

- **Família como entidade canônica:** removida do MVP. Roadmap. Calibração técnica preservada em `scripts/eda_completo.py`.
- **STT/áudio:** fora do MVP. Ingestão é text-only. Claude não transcreve áudio nativamente.
- **Stack:** Next.js + Node + Hono + SQLite + Claude. Sem Streamlit, sem Python no runtime (Python só pro ETL).
- **WhatsApp:** Twilio SDK Node **direto** (não via Composio). Composio considerado e rejeitado pra MVP — overhead desnecessário pra um único canal. CLI fica instalado pra eventual uso futuro.
- **Mapa:** Leaflet + OpenStreetMap tiles. Google Maps **não** será usado (overkill + API key).
- **Auth:** sem. Single-user.
- **Deploy:** local + ngrok pra demo. Sem Vercel/Railway no MVP.
- **Estilo de código:** TypeScript estrito no backend, shadcn/ui no frontend, sem TailwindCSS custom além do necessário, lint mínimo (priorizar funcionar).
- **Testes:** sem testes automatizados no MVP (hackathon). Validação manual end-to-end.

## 16. Apêndice — links de referência

- Análise completa: [docs/analise-completa-dataset-saude.md](../../analise-completa-dataset-saude.md)
- Briefing oficial: [_inbox/briefing-acs-vulnerabilidade.md](../../../_inbox/briefing-acs-vulnerabilidade.md)
- Transcrição Q&A SMS-Rio: [_inbox/transcricao-qa-sms-rio.md](../../../_inbox/transcricao-qa-sms-rio.md)
- Proposta v1 (memória): `~/.claude/projects/-Users-peterflag-Documents-Projects-Impact/memory/project_product_proposal_v1.md`
- ACS realities (memória): `~/.claude/projects/-Users-peterflag-Documents-Projects-Impact/memory/project_acs_workflow_realities.md`
- Regras do hackathon: [_refs/claude-impact-lab-rio/README.md](../../../_refs/claude-impact-lab-rio/README.md)
- Dataset README: [_refs/claude-impact-lab-saude/README.md](../../../_refs/claude-impact-lab-saude/README.md)

---

*Spec gerada durante brainstorm formal com a skill `superpowers:brainstorming`. Pronta pra ser convertida em plano de implementação pela skill `superpowers:writing-plans`.*

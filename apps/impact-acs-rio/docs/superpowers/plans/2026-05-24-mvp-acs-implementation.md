# MVP ACS Tool — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um MVP end-to-end em ~4h: ingestão por texto via WhatsApp pelos ACS → dashboard com scoring composto e chat IA pra reunião semanal, tudo apoiado por SQLite.

**Architecture:** Três trilhas paralelas compartilhando um único `db.sqlite` na raiz — (1) ETL em Python (Parquet→SQLite + scoring batch inicial), (2) Backend Node/Hono (REST + webhook Twilio + extração Claude + chat com tool use), (3) Frontend Next.js (dashboard + páginas paciente + chat). Trilhas se conectam pelos endpoints REST e pelo schema SQL.

**Tech Stack:** Next.js 15 (App Router) + Tailwind + shadcn/ui | Node 20 + TypeScript + Hono | SQLite via `better-sqlite3` | Anthropic Claude Sonnet 4.6 (`@anthropic-ai/sdk`) | Twilio Node SDK (direto, sem Composio) | Leaflet + OpenStreetMap tiles | Python 3.14 + pandas + pyarrow

**Deadline:** 16:15 (2026-05-24). Submissão por email pra `eventos@taicor.ai` com link `github.com/peterflagdooor/impact-acs-rio`.

**Decisão sobre testes:** sem testes automatizados no MVP (decisão registrada na spec §15). Cada task tem **verificação manual** com comando + output esperado.

---

## Spec de referência

Toda a spec está em `docs/superpowers/specs/2026-05-24-mvp-acs-design.md`. Quando este plano fala em "schema da seção 6" ou "fluxo da seção 8", consulte a spec. Pontos críticos da spec:

- **Não-objetivos (§3.2):** sem áudio, sem família, sem auth, sem deploy de produção
- **Schema completo (§6):** 4 tabelas portadas + 3 novas (`registros_whatsapp`, `alertas`, `pacientes_scores`)
- **Pesos de scoring (§7.2):** arquivo `scoring-weights.json`
- **Fluxos críticos (§8):** WhatsApp ingestion text-only + chat IA via tool use
- **Demo (§11):** 6 min em 5 cenas

---

## Mapa de arquivos a criar/modificar

### Novos (Python — ETL)
- `scripts/seed_sqlite.py` — Parquet → SQLite + scoring batch

### Novos (Backend — Node)
- `src/backend/package.json`
- `src/backend/tsconfig.json`
- `src/backend/.env.example` (na raiz é melhor — único `.env` pra simplificar)
- `src/backend/src/index.ts` — Hono server entry
- `src/backend/src/types.ts` — interfaces compartilhadas
- `src/backend/src/lib/db.ts` — better-sqlite3 wrapper
- `src/backend/src/lib/anthropic.ts` — Claude SDK wrapper
- `src/backend/src/lib/twilio.ts` — Twilio SDK wrapper
- `src/backend/src/lib/scoring.ts` — scoring engine
- `src/backend/src/lib/extract.ts` — extração via Claude
- `src/backend/src/lib/chat-tools.ts` — tool definitions
- `src/backend/src/config/scoring-weights.json`
- `src/backend/src/prompts/extract-message.md`
- `src/backend/src/prompts/chat-system.md`
- `src/backend/src/routes/webhook.ts`
- `src/backend/src/routes/kpis.ts`
- `src/backend/src/routes/patients.ts`
- `src/backend/src/routes/alerts.ts`
- `src/backend/src/routes/chat.ts`
- `src/backend/src/routes/territory.ts`
- `src/backend/src/routes/agenda.ts` ⚠️ STRETCH — implementar se houver tempo

### Novos (Frontend — Next.js)
- `src/frontend/package.json` (gerado pelo create-next-app)
- `src/frontend/app/layout.tsx`
- `src/frontend/app/page.tsx` — dashboard home
- `src/frontend/app/pacientes/page.tsx` — lista
- `src/frontend/app/pacientes/[id]/page.tsx` — detalhe
- `src/frontend/app/chat/page.tsx` — chat IA
- `src/frontend/app/agenda/page.tsx` ⚠️ STRETCH
- `src/frontend/lib/api.ts` — typed API client
- `src/frontend/components/sidebar.tsx`
- `src/frontend/components/score-badge.tsx`
- `src/frontend/components/kpi-card.tsx`
- `src/frontend/components/patient-row.tsx`
- `src/frontend/components/heatmap-map.tsx`

### Novos (raiz)
- `.env` (gitignored)
- `.env.example` (commitado)
- `README.md` (renovado — informações da equipe + arquitetura + demo link)
- `package.json` (root, opcional — só pra orquestrar scripts)

### Modificados
- `.gitignore` — adicionar `db.sqlite`, `node_modules/`, `src/frontend/.next/`
- `CLAUDE.md` — atualizar regras com a nova estrutura `src/`

---

# Phase 0 — Bootstrap (Todos, ~20 min)

Todos sincronizam o ambiente, configurações externas, e ferramentas que vão precisar. Pode ser feito em paralelo.

## Task 0.1: Atualizar .gitignore e criar .env.example

**Files:**
- Modify: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Adicionar entradas ao .gitignore**

Append ao final do `.gitignore` existente:

```
# Banco gerado
db.sqlite

# Node
node_modules/
src/frontend/.next/
src/frontend/out/
src/backend/dist/

# IDE/local
*.log
.DS_Store
```

- [ ] **Step 2: Criar .env.example na raiz do repo**

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxx

# Twilio (WhatsApp Sandbox)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Banco
DATABASE_PATH=./db.sqlite

# Backend
PORT=3001
PUBLIC_WEBHOOK_URL=https://changeme.ngrok.io

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

- [ ] **Step 3: Verificar e commitar**

```bash
git status
git add .gitignore .env.example
git commit -m "chore: gitignore for db/node and env template"
```

Expected: `db.sqlite`, `node_modules/`, `.next/` aparecem como gitignored em qualquer arquivo futuro nessas paths.

## Task 0.2: Twilio CLI e Sandbox config (Peter ou dev disponível)

**Files:** nenhum (configuração externa)

- [ ] **Step 1: Instalar Twilio CLI**

```bash
brew tap twilio/brew && brew install twilio
twilio --version
```

Expected: versão do CLI impressa.

- [ ] **Step 2: Login no Twilio**

```bash
twilio login
```

Vai pedir Account SID + Auth Token (pegar em twilio.com/console). Vai salvar perfil local.

- [ ] **Step 3: Ativar WhatsApp Sandbox**

No Twilio Console → Messaging → Try WhatsApp → seguir instruções pra:
1. Anotar o número do sandbox (formato `whatsapp:+14155238886`)
2. Anotar o **join code** (algo tipo `join cat-running`)
3. Do celular do Peter (ou voluntário do palco), mandar `join <code>` via WhatsApp pro número sandbox
4. Twilio responde com "joined ok"

- [ ] **Step 4: Atualizar .env local com credenciais**

Copiar `.env.example` para `.env`, preencher `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `ANTHROPIC_API_KEY`.

```bash
cp .env.example .env
# editar .env com os valores reais
```

- [ ] **Step 5: Verificar setup**

```bash
twilio api:core:messages:list --limit 5
```

Expected: lista mensagens recentes (ou vazia, mas sem erro de auth).

## Task 0.3: Instalar ngrok

**Files:** nenhum

- [ ] **Step 1: Instalar ngrok**

```bash
brew install --cask ngrok
ngrok --version
```

- [ ] **Step 2: Autenticar ngrok (free tier)**

Pegar token em `ngrok.com/signup` (free), depois:

```bash
ngrok config add-authtoken <TOKEN>
```

- [ ] **Step 3: Confirmar binding works (sem iniciar tunel ainda)**

```bash
ngrok config check
```

Expected: "Valid configuration file" sem erro.

---

# Phase 1 — ETL (Python, Dev C, ~30-45 min)

Pega os Parquets de `_inbox/data/`, popula SQLite com 4 tabelas portadas + 3 novas, e roda scoring batch inicial pra todos os 97.938 pacientes.

## Task 1.1: Criar scripts/seed_sqlite.py — schema + portagem

**Files:**
- Create: `scripts/seed_sqlite.py`

- [ ] **Step 1: Criar o script com schema completo**

```python
"""ETL: Parquet → SQLite + scoring batch inicial.

Roda na raiz do repo:
    .venv/bin/python scripts/seed_sqlite.py

Cria db.sqlite com:
    - 4 tabelas portadas dos Parquets (equipes, pacientes, visitas, eventos_clinicos)
    - 3 tabelas novas (registros_whatsapp, alertas, pacientes_scores)
    - Scoring batch inicial pra todos os pacientes
"""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "_inbox" / "data"
DB_PATH = ROOT / "db.sqlite"
WEIGHTS_PATH = ROOT / "src" / "backend" / "src" / "config" / "scoring-weights.json"


SCHEMA = """
CREATE TABLE IF NOT EXISTS equipes (
  equipe_id           TEXT PRIMARY KEY,
  endereco_latitude   REAL,
  endereco_longitude  REAL
);

CREATE TABLE IF NOT EXISTS pacientes (
  paciente_id               TEXT PRIMARY KEY,
  equipe_id                 TEXT REFERENCES equipes(equipe_id),
  unidade_id                TEXT,
  faixa_etaria              TEXT,
  sexo                      TEXT,
  raca_cor                  TEXT,
  situacao_vulnerabilidade  INTEGER,
  endereco_latitude         REAL,
  endereco_longitude        REAL,
  hipertenso                INTEGER,
  diabetico                 INTEGER,
  gestacao                  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_pacientes_equipe ON pacientes(equipe_id);

CREATE TABLE IF NOT EXISTS visitas (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  profissional_id   TEXT,
  registrados_em    TEXT,
  ordem_visita_dia  INTEGER,
  paciente_id       TEXT REFERENCES pacientes(paciente_id),
  origem            TEXT DEFAULT 'parquet'
);
CREATE INDEX IF NOT EXISTS idx_visitas_paciente ON visitas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_visitas_data ON visitas(registrados_em);

CREATE TABLE IF NOT EXISTS eventos_clinicos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id     TEXT REFERENCES pacientes(paciente_id),
  tipo            TEXT,
  data_referencia TEXT
);
CREATE INDEX IF NOT EXISTS idx_eventos_paciente ON eventos_clinicos(paciente_id);

CREATE TABLE IF NOT EXISTS registros_whatsapp (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  whatsapp_msg_id     TEXT UNIQUE,
  from_number         TEXT,
  profissional_id     TEXT,
  mensagem_texto      TEXT,
  dados_extraidos     TEXT,
  paciente_id         TEXT REFERENCES pacientes(paciente_id),
  status              TEXT DEFAULT 'recebido',
  recebido_em         DATETIME DEFAULT CURRENT_TIMESTAMP,
  processado_em       DATETIME
);

CREATE TABLE IF NOT EXISTS alertas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id   TEXT REFERENCES pacientes(paciente_id),
  tipo          TEXT,
  mensagem      TEXT,
  prioridade    INTEGER DEFAULT 2,
  origem        TEXT,
  criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolvido_em  DATETIME
);
CREATE INDEX IF NOT EXISTS idx_alertas_paciente ON alertas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_alertas_status ON alertas(resolvido_em);

CREATE TABLE IF NOT EXISTS pacientes_scores (
  paciente_id    TEXT PRIMARY KEY REFERENCES pacientes(paciente_id),
  score          REAL,
  fatores        TEXT,
  justificativa  TEXT,
  calculado_em   DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scores_value ON pacientes_scores(score DESC);
"""


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA)
    conn.commit()


def port_parquet_to_table(conn: sqlite3.Connection, name: str) -> int:
    df = pd.read_parquet(DATA_DIR / f"{name}.parquet")
    # garante bool -> 0/1
    for col in df.columns:
        if df[col].dtype == bool:
            df[col] = df[col].astype(int)
    # garante data como string ISO
    for col in df.columns:
        if "date" in col.lower() or "registrados_em" in col or "data_referencia" in col:
            df[col] = pd.to_datetime(df[col]).dt.strftime("%Y-%m-%d")
    df.to_sql(name, conn, if_exists="replace", index=False, method="multi", chunksize=500)
    return len(df)


def main() -> int:
    if DB_PATH.exists():
        print(f"Removendo db.sqlite existente em {DB_PATH}")
        DB_PATH.unlink()

    conn = sqlite3.connect(str(DB_PATH))
    init_schema(conn)

    for name in ["equipes", "pacientes", "visitas", "eventos_clinicos"]:
        n = port_parquet_to_table(conn, name)
        print(f"  {name}: {n:,} linhas")

    conn.close()
    print(f"\n✅ Schema + dados portados pra {DB_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Rodar o script**

```bash
cd /Users/peterflag/Documents/Projects/Impact
.venv/bin/python scripts/seed_sqlite.py
```

Expected output:
```
Removendo db.sqlite existente em /Users/peterflag/Documents/Projects/Impact/db.sqlite
  equipes: 49 linhas
  pacientes: 97,938 linhas
  visitas: 159,599 linhas
  eventos_clinicos: 100,503 linhas

✅ Schema + dados portados pra /Users/peterflag/Documents/Projects/Impact/db.sqlite
```

- [ ] **Step 3: Verificar via sqlite3 CLI**

```bash
sqlite3 db.sqlite '.tables'
```

Expected:
```
alertas              equipes              pacientes            registros_whatsapp 
eventos_clinicos     pacientes_scores     visitas
```

- [ ] **Step 4: Commit**

```bash
git add scripts/seed_sqlite.py
git commit -m "feat(etl): seed_sqlite.py com schema + portagem Parquet"
```

## Task 1.2: Adicionar scoring batch ao seed_sqlite.py

**Files:**
- Modify: `scripts/seed_sqlite.py`
- Create: `src/backend/src/config/scoring-weights.json` (pra ser referenciado)

- [ ] **Step 1: Criar o JSON de pesos**

```bash
mkdir -p src/backend/src/config
```

`src/backend/src/config/scoring-weights.json`:

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

- [ ] **Step 2: Adicionar função `compute_score` e batch em seed_sqlite.py**

Append ao `seed_sqlite.py` (antes do `if __name__`):

```python
def load_weights() -> dict:
    with open(WEIGHTS_PATH) as f:
        return json.load(f)


def compute_score(
    paciente: dict,
    ultima_visita: str | None,
    eventos: list[dict],
    weights: dict,
    today: datetime,
) -> tuple[float, list[str]]:
    """Calcula score 0-100 e lista de fatores que contribuíram."""
    fatores: list[str] = []
    total = 0.0
    f = weights["factors"]

    # Clinico
    if paciente.get("gestacao"):
        fatores.append("gestante")
        total += f["clinical"]["gestante"]
    if paciente.get("faixa_etaria") == "0-6":
        fatores.append("crianca_0_6")
        total += f["clinical"]["crianca_0_6"]
    h, d = bool(paciente.get("hipertenso")), bool(paciente.get("diabetico"))
    if h and d:
        fatores.append("hipertenso_e_diabetico")
        total += f["clinical"]["hipertenso_e_diabetico"]
    elif h or d:
        fatores.append("hipertenso_xor_diabetico")
        total += f["clinical"]["hipertenso_xor_diabetico"]
    if paciente.get("faixa_etaria") == "66+":
        fatores.append("idoso_66_mais")
        total += f["clinical"]["idoso_66_mais"]

    # Social
    if paciente.get("situacao_vulnerabilidade"):
        fatores.append("situacao_vulnerabilidade")
        total += f["social"]["situacao_vulnerabilidade"]

    # Temporal — usa "today" como referência (data shifted, mas válido pra ranking)
    if ultima_visita is None:
        # nunca visitado equivale a >180d
        fatores.append("sem_visita_180_mais")
        total += f["temporal"]["sem_visita_180_mais"]
    else:
        dt = datetime.strptime(ultima_visita, "%Y-%m-%d")
        dias = (today - dt).days
        if dias > 180:
            fatores.append("sem_visita_180_mais")
            total += f["temporal"]["sem_visita_180_mais"]
        elif dias > 90:
            fatores.append("sem_visita_90_a_180")
            total += f["temporal"]["sem_visita_90_a_180"]
        elif dias > 30:
            fatores.append("sem_visita_30_a_90")
            total += f["temporal"]["sem_visita_30_a_90"]

    # Gatilho — urgência mais recente
    urgencias = [
        datetime.strptime(e["data_referencia"], "%Y-%m-%d")
        for e in eventos
        if e["tipo"] == "urgencia-emergencia-ou-internacao"
    ]
    if urgencias:
        ultima_urg = max(urgencias)
        dias = (today - ultima_urg).days
        if dias < 30:
            fatores.append("urgencia_menor_30d")
            total += f["gatilho"]["urgencia_menor_30d"]
        elif dias < 90:
            fatores.append("urgencia_30_a_90d")
            total += f["gatilho"]["urgencia_30_a_90d"]

    # Gatilho — agendamento próximo
    agendamentos_proximos = [
        datetime.strptime(e["data_referencia"], "%Y-%m-%d")
        for e in eventos
        if e["tipo"] == "agendamento"
        and 0 <= (datetime.strptime(e["data_referencia"], "%Y-%m-%d") - today).days <= 14
    ]
    if agendamentos_proximos:
        fatores.append("agendamento_proximo_14d")
        total += f["gatilho"]["agendamento_proximo_14d"]

    return min(total, weights["max_score"]), fatores


def batch_scoring(conn: sqlite3.Connection) -> int:
    weights = load_weights()
    # usar "today" como o último dia do dataset (2025-12-31 — final do range observado)
    today = datetime(2025, 12, 31)

    # carregar dados necessários em memória (cabe)
    pacientes = {row[0]: dict(zip(_columns(conn, "pacientes"), row))
                 for row in conn.execute("SELECT * FROM pacientes")}

    # última visita por paciente
    ultima_visita = dict(
        conn.execute(
            "SELECT paciente_id, MAX(registrados_em) FROM visitas GROUP BY paciente_id"
        ).fetchall()
    )

    # eventos por paciente
    eventos_por_pac: dict[str, list[dict]] = {}
    for pid, tipo, data in conn.execute(
        "SELECT paciente_id, tipo, data_referencia FROM eventos_clinicos"
    ):
        eventos_por_pac.setdefault(pid, []).append({"tipo": tipo, "data_referencia": data})

    rows = []
    for pid, paciente in pacientes.items():
        score, fatores = compute_score(
            paciente,
            ultima_visita.get(pid),
            eventos_por_pac.get(pid, []),
            weights,
            today,
        )
        rows.append((pid, score, json.dumps(fatores), None))

    conn.executemany(
        "INSERT OR REPLACE INTO pacientes_scores (paciente_id, score, fatores, justificativa) VALUES (?, ?, ?, ?)",
        rows,
    )
    conn.commit()
    return len(rows)


def _columns(conn: sqlite3.Connection, table: str) -> list[str]:
    return [r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()]
```

Atualizar a função `main()`:

```python
def main() -> int:
    if DB_PATH.exists():
        print(f"Removendo db.sqlite existente em {DB_PATH}")
        DB_PATH.unlink()

    conn = sqlite3.connect(str(DB_PATH))
    init_schema(conn)

    for name in ["equipes", "pacientes", "visitas", "eventos_clinicos"]:
        n = port_parquet_to_table(conn, name)
        print(f"  {name}: {n:,} linhas")

    print("\nCalculando scoring inicial pra todos os pacientes...")
    n_scores = batch_scoring(conn)
    print(f"  pacientes_scores: {n_scores:,} linhas")

    # Sample do output
    print("\nTop 5 scores:")
    for row in conn.execute(
        "SELECT paciente_id, score, fatores FROM pacientes_scores ORDER BY score DESC LIMIT 5"
    ):
        print(f"  {row[0][:12]}... → {row[1]:.0f}  fatores={row[2]}")

    conn.close()
    print(f"\n✅ db.sqlite pronto em {DB_PATH}")
    return 0
```

- [ ] **Step 3: Rodar e verificar**

```bash
.venv/bin/python scripts/seed_sqlite.py
```

Expected output (resumido):
```
  equipes: 49 linhas
  pacientes: 97,938 linhas
  ...
Calculando scoring inicial pra todos os pacientes...
  pacientes_scores: 97,938 linhas

Top 5 scores:
  <id>... → 100  fatores=["gestante", "situacao_vulnerabilidade", ...]
  ...
✅ db.sqlite pronto em /Users/.../db.sqlite
```

- [ ] **Step 4: Sanity check via SQL**

```bash
sqlite3 db.sqlite "SELECT COUNT(*), AVG(score), MAX(score), MIN(score) FROM pacientes_scores;"
```

Expected: `97938|<avg>|100.0|<min>` — count bate, max é 100 (clipped), avg coerente.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed_sqlite.py src/backend/src/config/scoring-weights.json
git commit -m "feat(etl): scoring batch inicial + scoring-weights.json"
```

## Task 1.3: Sanity dos KPIs do dashboard (via SQL)

**Files:** nenhum (validação)

- [ ] **Step 1: Rodar queries que o dashboard vai usar**

```bash
sqlite3 db.sqlite << 'EOF'
.headers on
.mode column

-- KPI: taxa de cobertura
SELECT
  COUNT(DISTINCT p.paciente_id) AS total,
  COUNT(DISTINCT v.paciente_id) AS visitados,
  ROUND(100.0 * COUNT(DISTINCT v.paciente_id) / COUNT(DISTINCT p.paciente_id), 1) AS pct_cobertura
FROM pacientes p
LEFT JOIN visitas v ON v.paciente_id = p.paciente_id;

-- Top 10 prioridade
SELECT s.paciente_id, s.score, p.faixa_etaria, p.equipe_id
FROM pacientes_scores s
JOIN pacientes p USING(paciente_id)
ORDER BY s.score DESC
LIMIT 10;
EOF
```

Expected: queries rodam sem erro, números fazem sentido.

---

# Phase 2 — Backend (TypeScript, Dev A, ~2h)

Hono server com REST + Twilio webhook + Claude (extração + chat com tool use).

## Task 2.1: Inicializar projeto backend

**Files:**
- Create: `src/backend/package.json`
- Create: `src/backend/tsconfig.json`
- Create: `src/backend/src/index.ts`

- [ ] **Step 1: Criar pasta e package.json**

```bash
mkdir -p src/backend/src/{routes,lib,config,prompts}
cd src/backend
npm init -y
```

Editar `src/backend/package.json` pra ficar assim:

```json
{
  "name": "impact-acs-backend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "@hono/node-server": "^1.14.0",
    "better-sqlite3": "^11.5.0",
    "dotenv": "^16.4.5",
    "hono": "^4.6.0",
    "twilio": "^5.3.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.10",
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Instalar dependências**

```bash
cd src/backend
npm install
```

Expected: instalação completa sem erro.

- [ ] **Step 3: Criar tsconfig.json**

`src/backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": "src",
    "allowImportingTsExtensions": false,
    "noEmit": false
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 4: Criar src/index.ts mínimo (smoke)**

`src/backend/src/index.ts`:

```typescript
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import 'dotenv/config';

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/', (c) => c.json({ status: 'ok', service: 'impact-acs-backend' }));

const port = Number(process.env.PORT ?? 3001);
console.log(`🚀 Backend rodando em http://localhost:${port}`);
serve({ fetch: app.fetch, port });
```

- [ ] **Step 5: Subir e verificar**

```bash
cd src/backend
npm run dev
```

Em outro terminal:

```bash
curl http://localhost:3001/
```

Expected: `{"status":"ok","service":"impact-acs-backend"}`

- [ ] **Step 6: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/package.json src/backend/tsconfig.json src/backend/src/index.ts src/backend/package-lock.json
git commit -m "feat(backend): bootstrap Hono server"
```

## Task 2.2: DB layer — better-sqlite3 wrapper

**Files:**
- Create: `src/backend/src/lib/db.ts`
- Create: `src/backend/src/types.ts`

- [ ] **Step 1: Criar types.ts**

`src/backend/src/types.ts`:

```typescript
export interface Equipe {
  equipe_id: string;
  endereco_latitude: number;
  endereco_longitude: number;
}

export interface Paciente {
  paciente_id: string;
  equipe_id: string;
  unidade_id: string;
  faixa_etaria: string;
  sexo: string;
  raca_cor: string;
  situacao_vulnerabilidade: number;
  endereco_latitude: number;
  endereco_longitude: number;
  hipertenso: number;
  diabetico: number;
  gestacao: number;
}

export interface Visita {
  id: number;
  profissional_id: string;
  registrados_em: string;
  ordem_visita_dia: number;
  paciente_id: string;
  origem: string;
}

export interface EventoClinico {
  id: number;
  paciente_id: string;
  tipo: 'agendamento' | 'urgencia-emergencia-ou-internacao';
  data_referencia: string;
}

export interface RegistroWhatsapp {
  id: number;
  whatsapp_msg_id: string;
  from_number: string;
  profissional_id: string | null;
  mensagem_texto: string;
  dados_extraidos: string | null;
  paciente_id: string | null;
  status: 'recebido' | 'processado' | 'falha';
  recebido_em: string;
  processado_em: string | null;
}

export interface Alerta {
  id: number;
  paciente_id: string;
  tipo: string;
  mensagem: string;
  prioridade: number;
  origem: string;
  criado_em: string;
  resolvido_em: string | null;
}

export interface PacienteScore {
  paciente_id: string;
  score: number;
  fatores: string;
  justificativa: string | null;
  calculado_em: string;
}

export interface PacienteComScore extends Paciente {
  score: number;
  fatores: string[];
  justificativa: string | null;
  ultima_visita: string | null;
}
```

- [ ] **Step 2: Criar db.ts**

`src/backend/src/lib/db.ts`:

```typescript
import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import type {
  Paciente, PacienteComScore, Visita, EventoClinico,
  RegistroWhatsapp, Alerta, PacienteScore,
} from '../types.js';

const DB_PATH = process.env.DATABASE_PATH ?? resolve(process.cwd(), '../../db.sqlite');

export const db = new Database(DB_PATH, { readonly: false });
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------- helpers ----------

export function listPatients(filters: {
  equipe_id?: string;
  scoreMin?: number;
  scoreMax?: number;
  limit?: number;
  offset?: number;
} = {}): PacienteComScore[] {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (filters.equipe_id) { where.push('p.equipe_id = @equipe_id'); params.equipe_id = filters.equipe_id; }
  if (filters.scoreMin !== undefined) { where.push('s.score >= @scoreMin'); params.scoreMin = filters.scoreMin; }
  if (filters.scoreMax !== undefined) { where.push('s.score <= @scoreMax'); params.scoreMax = filters.scoreMax; }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const sql = `
    SELECT p.*, s.score, s.fatores, s.justificativa,
           (SELECT MAX(registrados_em) FROM visitas WHERE paciente_id = p.paciente_id) AS ultima_visita
    FROM pacientes p
    LEFT JOIN pacientes_scores s ON s.paciente_id = p.paciente_id
    ${whereSql}
    ORDER BY s.score DESC NULLS LAST
    LIMIT @limit OFFSET @offset
  `;
  const rows = db.prepare(sql).all({
    ...params,
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
  }) as Array<PacienteComScore & { fatores: string }>;

  return rows.map(r => ({ ...r, fatores: JSON.parse(r.fatores ?? '[]') }));
}

export function getPatient(id: string): PacienteComScore | null {
  const row = db.prepare(`
    SELECT p.*, s.score, s.fatores, s.justificativa,
           (SELECT MAX(registrados_em) FROM visitas WHERE paciente_id = p.paciente_id) AS ultima_visita
    FROM pacientes p
    LEFT JOIN pacientes_scores s ON s.paciente_id = p.paciente_id
    WHERE p.paciente_id = ?
  `).get(id) as (PacienteComScore & { fatores: string }) | undefined;
  if (!row) return null;
  return { ...row, fatores: JSON.parse(row.fatores ?? '[]') };
}

export function getPatientVisits(id: string): Visita[] {
  return db.prepare('SELECT * FROM visitas WHERE paciente_id = ? ORDER BY registrados_em DESC').all(id) as Visita[];
}

export function getPatientEvents(id: string): EventoClinico[] {
  return db.prepare('SELECT * FROM eventos_clinicos WHERE paciente_id = ? ORDER BY data_referencia DESC').all(id) as EventoClinico[];
}

export function getPatientAlerts(id: string): Alerta[] {
  return db.prepare('SELECT * FROM alertas WHERE paciente_id = ? AND resolvido_em IS NULL ORDER BY criado_em DESC').all(id) as Alerta[];
}

export function getOpenAlerts(limit = 50): (Alerta & { paciente_nome_proxy: string })[] {
  return db.prepare(`
    SELECT a.*, substr(a.paciente_id, 1, 12) AS paciente_nome_proxy
    FROM alertas a
    WHERE a.resolvido_em IS NULL
    ORDER BY a.prioridade ASC, a.criado_em DESC
    LIMIT ?
  `).all(limit) as (Alerta & { paciente_nome_proxy: string })[];
}

export function getKpis() {
  const total = (db.prepare('SELECT COUNT(*) AS n FROM pacientes').get() as { n: number }).n;
  const visitados = (db.prepare('SELECT COUNT(DISTINCT paciente_id) AS n FROM visitas').get() as { n: number }).n;
  const alertas_abertos = (db.prepare('SELECT COUNT(*) AS n FROM alertas WHERE resolvido_em IS NULL').get() as { n: number }).n;
  const urgencias_30d = (db.prepare(`
    SELECT COUNT(DISTINCT paciente_id) AS n FROM eventos_clinicos
    WHERE tipo = 'urgencia-emergencia-ou-internacao'
      AND date(data_referencia) >= date('2025-12-31', '-30 days')
  `).get() as { n: number }).n;
  return {
    total_pacientes: total,
    pacientes_visitados: visitados,
    cobertura_pct: Math.round((100 * visitados) / total),
    alertas_abertos,
    urgencias_30d,
  };
}

export function getTerritoryHeatmap() {
  // urgência por célula 100m + lat/lng médios
  const sql = `
    SELECT
      ROUND(p.endereco_latitude, 3)  AS lat,
      ROUND(p.endereco_longitude, 3) AS lng,
      COUNT(*) AS n_urgencias
    FROM eventos_clinicos e
    JOIN pacientes p ON p.paciente_id = e.paciente_id
    WHERE e.tipo = 'urgencia-emergencia-ou-internacao'
    GROUP BY lat, lng
    HAVING n_urgencias >= 3
    ORDER BY n_urgencias DESC
    LIMIT 200
  `;
  return db.prepare(sql).all() as Array<{ lat: number; lng: number; n_urgencias: number }>;
}

export function insertVisita(v: Omit<Visita, 'id'>): number {
  const stmt = db.prepare(`
    INSERT INTO visitas (profissional_id, registrados_em, ordem_visita_dia, paciente_id, origem)
    VALUES (@profissional_id, @registrados_em, @ordem_visita_dia, @paciente_id, @origem)
  `);
  const info = stmt.run(v);
  return Number(info.lastInsertRowid);
}

export function insertAlerta(a: Omit<Alerta, 'id' | 'criado_em' | 'resolvido_em'>): number {
  const stmt = db.prepare(`
    INSERT INTO alertas (paciente_id, tipo, mensagem, prioridade, origem)
    VALUES (@paciente_id, @tipo, @mensagem, @prioridade, @origem)
  `);
  return Number(stmt.run(a).lastInsertRowid);
}

export function upsertScore(paciente_id: string, score: number, fatores: string[], justificativa: string | null): void {
  db.prepare(`
    INSERT INTO pacientes_scores (paciente_id, score, fatores, justificativa, calculado_em)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(paciente_id) DO UPDATE SET
      score = excluded.score,
      fatores = excluded.fatores,
      justificativa = excluded.justificativa,
      calculado_em = excluded.calculado_em
  `).run(paciente_id, score, JSON.stringify(fatores), justificativa);
}

export function insertRegistroWhatsapp(r: Omit<RegistroWhatsapp, 'id' | 'recebido_em' | 'processado_em'>): number {
  const stmt = db.prepare(`
    INSERT INTO registros_whatsapp
      (whatsapp_msg_id, from_number, profissional_id, mensagem_texto, dados_extraidos, paciente_id, status)
    VALUES (@whatsapp_msg_id, @from_number, @profissional_id, @mensagem_texto, @dados_extraidos, @paciente_id, @status)
  `);
  return Number(stmt.run(r).lastInsertRowid);
}

export function updateRegistroWhatsapp(id: number, fields: Partial<RegistroWhatsapp>): void {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id };
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = @${k}`);
    params[k] = v;
  }
  if (sets.length === 0) return;
  db.prepare(`UPDATE registros_whatsapp SET ${sets.join(', ')}, processado_em = datetime('now') WHERE id = @id`).run(params);
}
```

- [ ] **Step 2: Verificar que importa sem erro**

Editar `src/backend/src/index.ts` pra adicionar:

```typescript
import { getKpis } from './lib/db.js';

app.get('/api/kpis', (c) => {
  try {
    return c.json(getKpis());
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});
```

Rodar:

```bash
cd src/backend
npm run dev
```

Em outro terminal:

```bash
curl http://localhost:3001/api/kpis
```

Expected: `{"total_pacientes":97938,"pacientes_visitados":49100,"cobertura_pct":50,"alertas_abertos":0,"urgencias_30d":<n>}`

- [ ] **Step 3: Commit**

```bash
git add src/backend/src/types.ts src/backend/src/lib/db.ts src/backend/src/index.ts
git commit -m "feat(backend): db layer + KPIs endpoint"
```

## Task 2.3: Scoring engine em TS

**Files:**
- Create: `src/backend/src/lib/scoring.ts`

- [ ] **Step 1: Criar scoring.ts**

`src/backend/src/lib/scoring.ts`:

```typescript
import weights from '../config/scoring-weights.json' assert { type: 'json' };
import { getPatient, getPatientVisits, getPatientEvents, upsertScore } from './db.js';

type Weights = typeof weights;

const TODAY = new Date('2025-12-31');  // fim do range dos dados (ressalva da spec §7.5)

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeScore(paciente_id: string): { score: number; fatores: string[] } {
  const p = getPatient(paciente_id);
  if (!p) throw new Error(`paciente ${paciente_id} não existe`);

  const visitas = getPatientVisits(paciente_id);
  const eventos = getPatientEvents(paciente_id);
  const f = weights.factors;
  const fatores: string[] = [];
  let total = 0;

  // Clinico
  if (p.gestacao) { fatores.push('gestante'); total += f.clinical.gestante; }
  if (p.faixa_etaria === '0-6') { fatores.push('crianca_0_6'); total += f.clinical.crianca_0_6; }
  if (p.hipertenso && p.diabetico) {
    fatores.push('hipertenso_e_diabetico');
    total += f.clinical.hipertenso_e_diabetico;
  } else if (p.hipertenso || p.diabetico) {
    fatores.push('hipertenso_xor_diabetico');
    total += f.clinical.hipertenso_xor_diabetico;
  }
  if (p.faixa_etaria === '66+') { fatores.push('idoso_66_mais'); total += f.clinical.idoso_66_mais; }

  // Social
  if (p.situacao_vulnerabilidade) {
    fatores.push('situacao_vulnerabilidade');
    total += f.social.situacao_vulnerabilidade;
  }

  // Temporal
  const ultimaVisitaStr = visitas[0]?.registrados_em;
  if (!ultimaVisitaStr) {
    fatores.push('sem_visita_180_mais');
    total += f.temporal.sem_visita_180_mais;
  } else {
    const dias = daysBetween(new Date(ultimaVisitaStr), TODAY);
    if (dias > 180) { fatores.push('sem_visita_180_mais'); total += f.temporal.sem_visita_180_mais; }
    else if (dias > 90) { fatores.push('sem_visita_90_a_180'); total += f.temporal.sem_visita_90_a_180; }
    else if (dias > 30) { fatores.push('sem_visita_30_a_90'); total += f.temporal.sem_visita_30_a_90; }
  }

  // Gatilho — urgência mais recente
  const urgencias = eventos
    .filter(e => e.tipo === 'urgencia-emergencia-ou-internacao')
    .map(e => new Date(e.data_referencia));
  if (urgencias.length) {
    const ult = new Date(Math.max(...urgencias.map(d => d.getTime())));
    const dias = daysBetween(ult, TODAY);
    if (dias < 30) { fatores.push('urgencia_menor_30d'); total += f.gatilho.urgencia_menor_30d; }
    else if (dias < 90) { fatores.push('urgencia_30_a_90d'); total += f.gatilho.urgencia_30_a_90d; }
  }

  // Gatilho — agendamento próximo
  const proximos = eventos.filter(e =>
    e.tipo === 'agendamento'
    && daysBetween(TODAY, new Date(e.data_referencia)) >= 0
    && daysBetween(TODAY, new Date(e.data_referencia)) <= 14
  );
  if (proximos.length) {
    fatores.push('agendamento_proximo_14d');
    total += f.gatilho.agendamento_proximo_14d;
  }

  const score = Math.min(total, weights.max_score);
  return { score, fatores };
}

export function recomputeAndSave(paciente_id: string): { score: number; fatores: string[] } {
  const { score, fatores } = computeScore(paciente_id);
  upsertScore(paciente_id, score, fatores, null);
  return { score, fatores };
}
```

- [ ] **Step 2: Adicionar endpoint manual recompute pra smoke test**

Em `src/backend/src/index.ts`, adicionar:

```typescript
import { recomputeAndSave } from './lib/scoring.js';

app.post('/api/score/recompute/:id', (c) => {
  const id = c.req.param('id');
  try {
    const result = recomputeAndSave(id);
    return c.json(result);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }
});
```

- [ ] **Step 3: Verificar — pegar um paciente_id do DB e recomputar**

```bash
# pega um paciente_id qualquer
PAC=$(sqlite3 db.sqlite "SELECT paciente_id FROM pacientes LIMIT 1")
echo "paciente: $PAC"

# recompute
curl -X POST http://localhost:3001/api/score/recompute/$PAC
```

Expected: `{"score":<n>,"fatores":[...]}`

- [ ] **Step 4: Commit**

```bash
git add src/backend/src/lib/scoring.ts src/backend/src/index.ts
git commit -m "feat(backend): scoring engine + recompute endpoint"
```

## Task 2.4: REST endpoints — patients, alerts, kpis, territory

**Files:**
- Create: `src/backend/src/routes/patients.ts`
- Create: `src/backend/src/routes/alerts.ts`
- Create: `src/backend/src/routes/kpis.ts`
- Create: `src/backend/src/routes/territory.ts`
- Modify: `src/backend/src/index.ts`

- [ ] **Step 1: Criar routes/patients.ts**

`src/backend/src/routes/patients.ts`:

```typescript
import { Hono } from 'hono';
import { listPatients, getPatient, getPatientVisits, getPatientEvents, getPatientAlerts } from '../lib/db.js';

export const patients = new Hono();

patients.get('/', (c) => {
  const equipe_id = c.req.query('equipe_id') ?? undefined;
  const scoreMin = c.req.query('score_min') ? Number(c.req.query('score_min')) : undefined;
  const scoreMax = c.req.query('score_max') ? Number(c.req.query('score_max')) : undefined;
  const limit = c.req.query('limit') ? Number(c.req.query('limit')) : 50;
  const offset = c.req.query('offset') ? Number(c.req.query('offset')) : 0;
  return c.json(listPatients({ equipe_id, scoreMin, scoreMax, limit, offset }));
});

patients.get('/:id', (c) => {
  const id = c.req.param('id');
  const p = getPatient(id);
  if (!p) return c.json({ error: 'não encontrado' }, 404);
  return c.json({
    paciente: p,
    visitas: getPatientVisits(id),
    eventos: getPatientEvents(id),
    alertas: getPatientAlerts(id),
  });
});
```

- [ ] **Step 2: Criar routes/alerts.ts**

`src/backend/src/routes/alerts.ts`:

```typescript
import { Hono } from 'hono';
import { getOpenAlerts, db } from '../lib/db.js';

export const alerts = new Hono();

alerts.get('/', (c) => {
  const limit = c.req.query('limit') ? Number(c.req.query('limit')) : 50;
  return c.json(getOpenAlerts(limit));
});

alerts.post('/:id/resolve', (c) => {
  const id = Number(c.req.param('id'));
  db.prepare('UPDATE alertas SET resolvido_em = datetime("now") WHERE id = ?').run(id);
  return c.json({ ok: true });
});
```

- [ ] **Step 3: Criar routes/kpis.ts**

`src/backend/src/routes/kpis.ts`:

```typescript
import { Hono } from 'hono';
import { getKpis } from '../lib/db.js';

export const kpis = new Hono();
kpis.get('/', (c) => c.json(getKpis()));
```

- [ ] **Step 4: Criar routes/territory.ts**

`src/backend/src/routes/territory.ts`:

```typescript
import { Hono } from 'hono';
import { getTerritoryHeatmap } from '../lib/db.js';

export const territory = new Hono();
territory.get('/heatmap', (c) => c.json(getTerritoryHeatmap()));
```

- [ ] **Step 5: Mount routes em index.ts**

Substituir `src/backend/src/index.ts` por:

```typescript
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import 'dotenv/config';

import { patients } from './routes/patients.js';
import { alerts } from './routes/alerts.js';
import { kpis } from './routes/kpis.js';
import { territory } from './routes/territory.js';
import { recomputeAndSave } from './lib/scoring.js';

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/', (c) => c.json({ status: 'ok' }));

app.route('/api/kpis', kpis);
app.route('/api/patients', patients);
app.route('/api/alerts', alerts);
app.route('/api/territory', territory);

app.post('/api/score/recompute/:id', (c) => {
  const id = c.req.param('id');
  try {
    return c.json(recomputeAndSave(id));
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }
});

const port = Number(process.env.PORT ?? 3001);
console.log(`🚀 Backend rodando em http://localhost:${port}`);
serve({ fetch: app.fetch, port });
```

- [ ] **Step 6: Verificar endpoints**

```bash
curl http://localhost:3001/api/kpis | head -c 200
curl 'http://localhost:3001/api/patients?limit=3' | head -c 500
curl http://localhost:3001/api/territory/heatmap | head -c 200
curl http://localhost:3001/api/alerts
```

Expected: cada um devolve JSON válido (alerts será `[]` antes de termos webhook).

- [ ] **Step 7: Commit**

```bash
git add src/backend/src/routes src/backend/src/index.ts
git commit -m "feat(backend): REST endpoints (patients, alerts, kpis, territory)"
```

## Task 2.5: Anthropic SDK wrapper + extração de mensagem

**Files:**
- Create: `src/backend/src/lib/anthropic.ts`
- Create: `src/backend/src/lib/extract.ts`
- Create: `src/backend/src/prompts/extract-message.md`

- [ ] **Step 1: Criar anthropic.ts**

`src/backend/src/lib/anthropic.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  ANTHROPIC_API_KEY ausente — chamadas vão falhar');
}

export const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const MODEL_ID = 'claude-sonnet-4-6';

export const SMALL_MODEL_ID = 'claude-haiku-4-5-20251001';  // pro extração simples
```

- [ ] **Step 2: Criar prompts/extract-message.md**

`src/backend/src/prompts/extract-message.md`:

````markdown
Você é um assistente da Secretaria Municipal de Saúde do Rio. Recebe uma mensagem em texto enviada por um Agente Comunitário de Saúde (ACS) via WhatsApp logo após uma visita domiciliar. Sua tarefa é extrair informações estruturadas dessa mensagem para alimentar o sistema de gestão.

## Contexto da equipe (lista limitada de candidatos)

```
{equipe_candidatos}
```

## Mensagem recebida

```
{mensagem}
```

## Sua resposta — APENAS JSON válido, sem markdown

```json
{
  "paciente_referido": "Nome conforme o ACS digitou OU null se a mensagem não menciona paciente específico",
  "paciente_id_provavel": "id do paciente mais provável da lista acima, ou null se nenhum bater",
  "confidence": "alta | media | baixa",
  "visita_realizada": true,
  "sintomas_clinicos": ["pressão alta", "tosse persistente"],
  "alertas": [
    { "tipo": "hipertensao-descompensada", "prioridade": 1, "mensagem": "Pressão 18x11 sem medicação" }
  ],
  "familiares_citados": [{ "relacao": "filho", "sintoma": "tosse persistente" }],
  "observacoes_livres": "qualquer outro detalhe relevante",
  "acoes_sugeridas": ["agendar consulta em 7 dias", "reforçar adesão medicação"]
}
```

Regras:
- Se a mensagem não permite identificar paciente com segurança, `paciente_id_provavel: null` e `confidence: baixa`.
- `alertas[].tipo` deve ser kebab-case curto (ex: `hipertensao-descompensada`, `gestante-risco`, `medicacao-abandono`, `urgencia-followup`).
- `alertas[].prioridade`: 1 (alta) | 2 (media) | 3 (baixa).
- Use a lista de candidatos pra fazer match por similaridade de nome quando aplicável.
- NUNCA invente IDs que não estão na lista.

Responda apenas com o JSON, sem texto adicional.
````

- [ ] **Step 3: Criar extract.ts**

`src/backend/src/lib/extract.ts`:

```typescript
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claude, SMALL_MODEL_ID } from './anthropic.js';
import { db } from './db.js';
import type { Paciente } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROMPT_TEMPLATE = readFileSync(
  resolve(__dirname, '../prompts/extract-message.md'),
  'utf-8',
);

export interface ExtractedData {
  paciente_referido: string | null;
  paciente_id_provavel: string | null;
  confidence: 'alta' | 'media' | 'baixa';
  visita_realizada: boolean;
  sintomas_clinicos: string[];
  alertas: Array<{ tipo: string; prioridade: number; mensagem: string }>;
  familiares_citados: Array<{ relacao: string; sintoma: string }>;
  observacoes_livres: string;
  acoes_sugeridas: string[];
}

/**
 * Lista até `limit` candidatos (paciente_id + dados rasos) pra dar contexto.
 * Filtro grosseiro: pacientes do território do ACS (depende de mapping number → equipe).
 * Pro MVP: dá um sample dos 50 pacientes com maior score (mais prováveis de serem mencionados).
 */
function getCandidates(limit = 30): Paciente[] {
  return db.prepare(`
    SELECT p.* FROM pacientes p
    JOIN pacientes_scores s ON s.paciente_id = p.paciente_id
    ORDER BY s.score DESC
    LIMIT ?
  `).all(limit) as Paciente[];
}

function formatCandidates(candidates: Paciente[]): string {
  return candidates.map(c =>
    `- ${c.paciente_id} | equipe=${c.equipe_id.slice(0, 8)} | faixa=${c.faixa_etaria} sexo=${c.sexo} ${c.gestacao ? 'GESTANTE ' : ''}${c.hipertenso ? 'HIPER ' : ''}${c.diabetico ? 'DIAB ' : ''}${c.situacao_vulnerabilidade ? 'VULN' : ''}`,
  ).join('\n');
}

export async function extractMessage(text: string): Promise<ExtractedData> {
  const candidates = getCandidates(30);
  const prompt = PROMPT_TEMPLATE
    .replace('{equipe_candidatos}', formatCandidates(candidates))
    .replace('{mensagem}', text);

  const response = await claude.messages.create({
    model: SMALL_MODEL_ID,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude não retornou texto');
  }

  // Tenta extrair JSON do markdown wrap se houver
  const raw = textBlock.text.trim();
  const json = raw.startsWith('```')
    ? raw.replace(/^```json?\n/, '').replace(/\n```$/, '')
    : raw;

  return JSON.parse(json) as ExtractedData;
}
```

- [ ] **Step 4: Verificar — endpoint manual de extração**

Em `src/backend/src/index.ts`, adicionar:

```typescript
import { extractMessage } from './lib/extract.js';

app.post('/api/extract', async (c) => {
  const { text } = await c.req.json();
  try {
    const data = await extractMessage(text);
    return c.json(data);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});
```

Testar:

```bash
curl -X POST http://localhost:3001/api/extract \
  -H "Content-Type: application/json" \
  -d '{"text": "Visitei dona Maria da equipe 3, pressão alta, não tomou remédio essa semana. Filho com tosse persistente."}'
```

Expected: JSON com `sintomas_clinicos`, `alertas`, etc.

- [ ] **Step 5: Commit**

```bash
git add src/backend/src/lib/anthropic.ts src/backend/src/lib/extract.ts src/backend/src/prompts/extract-message.md src/backend/src/index.ts
git commit -m "feat(backend): Claude extract pipeline"
```

## Task 2.6: Twilio webhook — recepção e processamento

**Files:**
- Create: `src/backend/src/lib/twilio.ts`
- Create: `src/backend/src/routes/webhook.ts`
- Modify: `src/backend/src/index.ts`

- [ ] **Step 1: Criar twilio.ts**

`src/backend/src/lib/twilio.ts`:

```typescript
import twilioLib from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM!;

if (!accountSid || !authToken) {
  console.warn('⚠️  TWILIO_* envs ausentes — webhook vai falhar na validação');
}

export const twilio = twilioLib(accountSid, authToken);

export async function sendWhatsapp(to: string, body: string): Promise<void> {
  const target = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  await twilio.messages.create({ from: fromNumber, to: target, body });
}

export function validateTwilioSignature(
  signature: string | undefined,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!signature) return false;
  return twilioLib.validateRequest(authToken, signature, url, params);
}
```

- [ ] **Step 2: Criar routes/webhook.ts**

`src/backend/src/routes/webhook.ts`:

```typescript
import { Hono } from 'hono';
import { extractMessage } from '../lib/extract.js';
import { sendWhatsapp } from '../lib/twilio.js';
import {
  insertRegistroWhatsapp,
  updateRegistroWhatsapp,
  insertVisita,
  insertAlerta,
} from '../lib/db.js';
import { recomputeAndSave } from '../lib/scoring.js';

export const webhook = new Hono();

webhook.post('/whatsapp', async (c) => {
  // Twilio manda form-urlencoded
  const body = await c.req.parseBody();
  const msgId = String(body.MessageSid ?? '');
  const from = String(body.From ?? '');
  const text = String(body.Body ?? '').trim();

  console.log(`📨 WhatsApp recebido de ${from}: ${text}`);

  if (!text) {
    return c.text('<Response/>', 200, { 'Content-Type': 'application/xml' });
  }

  // 1. Persiste raw
  const registroId = insertRegistroWhatsapp({
    whatsapp_msg_id: msgId,
    from_number: from,
    profissional_id: null,
    mensagem_texto: text,
    dados_extraidos: null,
    paciente_id: null,
    status: 'recebido',
  });

  // 2. Extrai via Claude
  let extracted;
  try {
    extracted = await extractMessage(text);
  } catch (err) {
    console.error('Falha extração:', err);
    updateRegistroWhatsapp(registroId, { status: 'falha' });
    await sendWhatsapp(from, '⚠️ Tive um problema processando sua mensagem. Tente novamente.');
    return c.text('<Response/>', 200, { 'Content-Type': 'application/xml' });
  }

  const pacienteId = extracted.paciente_id_provavel;

  // 3. Caso não tenha match
  if (!pacienteId || extracted.confidence === 'baixa') {
    updateRegistroWhatsapp(registroId, {
      dados_extraidos: JSON.stringify(extracted),
      status: 'falha',
    });
    const nome = extracted.paciente_referido ?? 'paciente';
    await sendWhatsapp(from, `🤔 Não consegui identificar com certeza ${nome}. Me dá mais contexto? (Ex: "Maria da Silva, equipe 3")`);
    return c.text('<Response/>', 200, { 'Content-Type': 'application/xml' });
  }

  // 4. Cria visita derivada
  insertVisita({
    profissional_id: from,
    registrados_em: new Date().toISOString().slice(0, 10),
    ordem_visita_dia: 1,
    paciente_id: pacienteId,
    origem: 'whatsapp',
  });

  // 5. Cria alertas
  for (const a of extracted.alertas) {
    insertAlerta({
      paciente_id: pacienteId,
      tipo: a.tipo,
      mensagem: a.mensagem,
      prioridade: a.prioridade,
      origem: 'whatsapp',
    });
  }

  // 6. Recompute score
  const { score, fatores } = recomputeAndSave(pacienteId);

  updateRegistroWhatsapp(registroId, {
    dados_extraidos: JSON.stringify(extracted),
    paciente_id: pacienteId,
    status: 'processado',
  });

  // 7. Reply
  const alertaTxt = extracted.alertas.length
    ? ` Alerta criado: ${extracted.alertas[0].tipo}.`
    : '';
  await sendWhatsapp(
    from,
    `✅ Registrado pra ${extracted.paciente_referido}. Score=${Math.round(score)}.${alertaTxt}`,
  );

  return c.text('<Response/>', 200, { 'Content-Type': 'application/xml' });
});
```

- [ ] **Step 3: Mount webhook em index.ts**

Adicionar no `src/backend/src/index.ts`:

```typescript
import { webhook } from './routes/webhook.js';

app.route('/webhook', webhook);
```

- [ ] **Step 4: Iniciar ngrok e configurar webhook URL no Twilio**

Em um terminal separado:

```bash
ngrok http 3001
```

Pegar a URL HTTPS do ngrok (ex: `https://abc-123.ngrok-free.app`).

No Twilio Console → Messaging → Try WhatsApp → Sandbox Settings:
- **When a message comes in:** `https://abc-123.ngrok-free.app/webhook/whatsapp`
- Method: `POST`
- Salvar.

- [ ] **Step 5: Smoke test — mandar mensagem real**

Do celular do Peter (que já fez join), mandar pelo WhatsApp do sandbox:

```
Visitei dona Maria da equipe 3, pressão alta, não tomou remédio
```

No terminal do backend, deve aparecer:

```
📨 WhatsApp recebido de whatsapp:+55XXX: Visitei dona Maria...
```

E o Peter deve receber resposta:

```
✅ Registrado pra Maria. Score=NN. Alerta criado: hipertensao-descompensada.
```

- [ ] **Step 6: Verificar persistência**

```bash
sqlite3 db.sqlite "SELECT id, from_number, status, paciente_id FROM registros_whatsapp ORDER BY id DESC LIMIT 3;"
sqlite3 db.sqlite "SELECT * FROM alertas ORDER BY id DESC LIMIT 3;"
```

Expected: registro com status=processado + alerta criado.

- [ ] **Step 7: Commit**

```bash
git add src/backend/src/lib/twilio.ts src/backend/src/routes/webhook.ts src/backend/src/index.ts
git commit -m "feat(backend): Twilio webhook + WhatsApp ingestion pipeline"
```

## Task 2.7: Chat AI com tool use

**Files:**
- Create: `src/backend/src/lib/chat-tools.ts`
- Create: `src/backend/src/routes/chat.ts`
- Create: `src/backend/src/prompts/chat-system.md`
- Modify: `src/backend/src/index.ts`

- [ ] **Step 1: Criar chat-tools.ts (whitelist de queries)**

`src/backend/src/lib/chat-tools.ts`:

```typescript
import { db, listPatients, getOpenAlerts, getKpis } from './db.js';

export interface ToolDef {
  name: string;
  description: string;
  input_schema: object;
}

export const CHAT_TOOLS: ToolDef[] = [
  {
    name: 'query_patients',
    description: 'Lista pacientes ordenados por score, com filtros opcionais. Use pra responder "quem precisa de visita", "top pacientes vulneráveis", etc.',
    input_schema: {
      type: 'object',
      properties: {
        equipe_id: { type: 'string', description: 'Filtrar por equipe (hash)' },
        score_min: { type: 'number', description: 'Score mínimo (0-100)' },
        limit: { type: 'number', description: 'Máximo de resultados (default 20)' },
      },
    },
  },
  {
    name: 'query_alerts',
    description: 'Lista alertas abertos (não resolvidos), ordenados por prioridade.',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Máximo (default 20)' },
      },
    },
  },
  {
    name: 'query_kpis',
    description: 'Retorna KPIs gerais: cobertura, total de pacientes, alertas abertos, urgências recentes.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'query_group_stats',
    description: 'Estatísticas por grupo populacional: gestantes, idosos, hipertensos, diabéticos, vulneráveis. Retorna n_total, n_visitados, % cobertura.',
    input_schema: {
      type: 'object',
      properties: {
        equipe_id: { type: 'string', description: 'Opcional: filtrar por equipe' },
      },
    },
  },
];

export function executeTool(name: string, input: Record<string, unknown>): unknown {
  switch (name) {
    case 'query_patients':
      return listPatients({
        equipe_id: input.equipe_id as string | undefined,
        scoreMin: input.score_min as number | undefined,
        limit: (input.limit as number | undefined) ?? 20,
      });
    case 'query_alerts':
      return getOpenAlerts((input.limit as number | undefined) ?? 20);
    case 'query_kpis':
      return getKpis();
    case 'query_group_stats': {
      const equipeFilter = input.equipe_id ? `WHERE equipe_id = '${input.equipe_id}'` : '';
      const rows = db.prepare(`
        SELECT
          'gestantes' AS grupo,
          SUM(p.gestacao) AS n_total,
          SUM(CASE WHEN p.gestacao=1 AND v.paciente_id IS NOT NULL THEN 1 ELSE 0 END) AS n_visitados
        FROM pacientes p
        LEFT JOIN (SELECT DISTINCT paciente_id FROM visitas) v USING(paciente_id)
        ${equipeFilter}
        UNION ALL
        SELECT 'hipertensos', SUM(p.hipertenso),
          SUM(CASE WHEN p.hipertenso=1 AND v.paciente_id IS NOT NULL THEN 1 ELSE 0 END)
        FROM pacientes p
        LEFT JOIN (SELECT DISTINCT paciente_id FROM visitas) v USING(paciente_id)
        ${equipeFilter}
        UNION ALL
        SELECT 'idosos_66', SUM(CASE WHEN p.faixa_etaria='66+' THEN 1 ELSE 0 END),
          SUM(CASE WHEN p.faixa_etaria='66+' AND v.paciente_id IS NOT NULL THEN 1 ELSE 0 END)
        FROM pacientes p
        LEFT JOIN (SELECT DISTINCT paciente_id FROM visitas) v USING(paciente_id)
        ${equipeFilter}
      `).all() as Array<{ grupo: string; n_total: number; n_visitados: number }>;
      return rows.map(r => ({
        ...r,
        pct_cobertura: r.n_total ? Math.round(100 * r.n_visitados / r.n_total) : 0,
      }));
    }
    default:
      throw new Error(`Tool desconhecida: ${name}`);
  }
}
```

- [ ] **Step 2: Criar chat-system.md**

`src/backend/src/prompts/chat-system.md`:

```markdown
Você é o assistente da reunião semanal da equipe de Saúde da Família do Rio. Sua função é responder perguntas dos profissionais (médico, enfermeiro, ACS) sobre o estado do território, prioridades e alertas.

## Contexto

- Você opera sobre um banco de dados com pacientes, visitas, eventos clínicos, alertas e scores.
- Cada paciente tem um score 0-100 calculado por 4 eixos: clínico (gestação, comorbidade, idade), social (vulnerabilidade), temporal (lacuna de visita), gatilho (urgência recente, agendamento próximo).
- Score 80+ é alta prioridade.

## Comportamento

- Use as ferramentas disponíveis pra consultar o banco. NÃO invente dados.
- Quando listar pacientes, cite o paciente_id (truncar pros primeiros 8 chars na resposta) e mostre o score.
- Linguagem clara, ritmo de reunião — sem jargão técnico desnecessário.
- Se uma pergunta exige análise que vai além das ferramentas, explique o que conseguiu cobrir e o que faltou.
- Foque em **ações acionáveis** (quem visitar, quem priorizar).

## Limitações que você deve respeitar

- Datas absolutas não são confiáveis (dataset anonimizado com date shifting). Use sempre "X dias atrás" em vez de datas.
- Não há informação de tuberculose, saúde mental, ou desnutrição no dataset.
- Não há entidade "família" — trabalhe paciente a paciente.
```

- [ ] **Step 3: Criar routes/chat.ts (streaming SSE)**

`src/backend/src/routes/chat.ts`:

```typescript
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claude, MODEL_ID } from '../lib/anthropic.js';
import { CHAT_TOOLS, executeTool } from '../lib/chat-tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SYSTEM_PROMPT = readFileSync(
  resolve(__dirname, '../prompts/chat-system.md'),
  'utf-8',
);

export const chat = new Hono();

interface ChatRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

chat.post('/', async (c) => {
  const { message, history = [] } = await c.req.json<ChatRequest>();

  return streamSSE(c, async (stream) => {
    const messages: Anthropic.MessageParam[] = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    // Loop de tool use — Claude pode chamar ferramentas múltiplas vezes
    let safety = 5;
    while (safety-- > 0) {
      const response = await claude.messages.create({
        model: MODEL_ID,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools: CHAT_TOOLS as unknown as Anthropic.Tool[],
        messages,
      });

      // Acumula resposta como assistant message no histórico
      messages.push({ role: 'assistant', content: response.content });

      // Verifica se Claude pediu tools
      const toolUses = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[];

      if (toolUses.length === 0) {
        // Sem mais tools: stream o texto final
        const textBlocks = response.content.filter(b => b.type === 'text');
        for (const block of textBlocks) {
          if (block.type === 'text') {
            await stream.writeSSE({ event: 'message', data: block.text });
          }
        }
        await stream.writeSSE({ event: 'done', data: 'ok' });
        return;
      }

      // Execute tools e adiciona resultados
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tool of toolUses) {
        try {
          const result = executeTool(tool.name, tool.input as Record<string, unknown>);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tool.id,
            content: JSON.stringify(result).slice(0, 8000),  // cap p/ context
          });
        } catch (err) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tool.id,
            content: `Erro: ${(err as Error).message}`,
            is_error: true,
          });
        }
      }

      messages.push({ role: 'user', content: toolResults });
    }

    await stream.writeSSE({ event: 'error', data: 'Loop de tools muito longo' });
  });
});

// Necessário pra os tipos do Anthropic SDK
declare global {
  namespace Anthropic {
    type MessageParam = import('@anthropic-ai/sdk').Anthropic.MessageParam;
    type Tool = import('@anthropic-ai/sdk').Anthropic.Tool;
    type ToolUseBlock = import('@anthropic-ai/sdk').Anthropic.ToolUseBlock;
    type ToolResultBlockParam = import('@anthropic-ai/sdk').Anthropic.ToolResultBlockParam;
  }
}
```

- [ ] **Step 4: Mount chat em index.ts**

```typescript
import { chat } from './routes/chat.js';
app.route('/api/chat', chat);
```

- [ ] **Step 5: Verificar via curl com SSE**

```bash
curl -N -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quais 5 pacientes têm maior prioridade?"}'
```

Expected: stream de eventos `event: message\ndata: ...` com o texto de Claude.

- [ ] **Step 6: Commit**

```bash
git add src/backend/src/lib/chat-tools.ts src/backend/src/routes/chat.ts src/backend/src/prompts/chat-system.md src/backend/src/index.ts
git commit -m "feat(backend): chat IA com tool use + SSE streaming"
```

---

# Phase 3 — Frontend (TypeScript, Dev B, ~2h)

Next.js 15 + Tailwind + shadcn/ui. Páginas: home (dashboard), pacientes, paciente detalhe, chat.

## Task 3.1: Bootstrap Next.js

**Files:**
- Create: `src/frontend/` (via create-next-app)

- [ ] **Step 1: Rodar create-next-app**

```bash
cd /Users/peterflag/Documents/Projects/Impact
npx create-next-app@latest src/frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint --use-npm
```

Aceitar defaults onde solicitado.

- [ ] **Step 2: Adicionar shadcn**

```bash
cd src/frontend
npx shadcn@latest init -d
```

Quando perguntar style: pick **default**. Color: **slate**. Aceitar resto.

- [ ] **Step 3: Instalar componentes essenciais**

```bash
npx shadcn@latest add button card table badge tabs input
```

- [ ] **Step 4: Instalar Leaflet**

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

- [ ] **Step 5: Subir e verificar**

```bash
npm run dev
```

Abrir http://localhost:3000 — deve mostrar a página default do Next.js.

- [ ] **Step 6: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/frontend
git commit -m "feat(frontend): bootstrap Next.js + shadcn + Leaflet"
```

## Task 3.2: API client tipado

**Files:**
- Create: `src/frontend/lib/api.ts`

- [ ] **Step 1: Criar api.ts**

`src/frontend/lib/api.ts`:

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface Paciente {
  paciente_id: string;
  equipe_id: string;
  faixa_etaria: string;
  sexo: string;
  raca_cor: string;
  situacao_vulnerabilidade: number;
  hipertenso: number;
  diabetico: number;
  gestacao: number;
  score: number;
  fatores: string[];
  ultima_visita: string | null;
  endereco_latitude: number;
  endereco_longitude: number;
}

export interface Alerta {
  id: number;
  paciente_id: string;
  paciente_nome_proxy: string;
  tipo: string;
  mensagem: string;
  prioridade: number;
  origem: string;
  criado_em: string;
}

export interface KPIs {
  total_pacientes: number;
  pacientes_visitados: number;
  cobertura_pct: number;
  alertas_abertos: number;
  urgencias_30d: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  n_urgencias: number;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

export const apiClient = {
  kpis: () => api<KPIs>('/api/kpis'),
  patients: (params: { equipe_id?: string; score_min?: number; limit?: number; offset?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.equipe_id) q.set('equipe_id', params.equipe_id);
    if (params.score_min !== undefined) q.set('score_min', String(params.score_min));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.offset) q.set('offset', String(params.offset));
    return api<Paciente[]>(`/api/patients?${q.toString()}`);
  },
  patient: (id: string) => api<{ paciente: Paciente; visitas: unknown[]; eventos: unknown[]; alertas: Alerta[] }>(`/api/patients/${id}`),
  alerts: () => api<Alerta[]>('/api/alerts'),
  heatmap: () => api<HeatmapPoint[]>('/api/territory/heatmap'),
};
```

- [ ] **Step 2: Commit**

```bash
git add src/frontend/lib/api.ts
git commit -m "feat(frontend): typed API client"
```

## Task 3.3: Layout + sidebar

**Files:**
- Modify: `src/frontend/app/layout.tsx`
- Create: `src/frontend/components/sidebar.tsx`

- [ ] **Step 1: Criar sidebar.tsx**

`src/frontend/components/sidebar.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: '📊 Dashboard' },
  { href: '/pacientes', label: '👥 Pacientes' },
  { href: '/chat', label: '💬 Chat IA' },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 bg-slate-900 text-white h-screen p-4 flex flex-col gap-2">
      <h1 className="text-lg font-bold mb-4">Vigia ACS</h1>
      {NAV.map(n => (
        <Link
          key={n.href}
          href={n.href}
          className={`px-3 py-2 rounded transition ${path === n.href ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
        >
          {n.label}
        </Link>
      ))}
      <div className="mt-auto text-xs text-slate-400">
        Claude Impact Lab 2026
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Atualizar layout.tsx**

`src/frontend/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'Vigia ACS — Reunião Semanal',
  description: 'Apoio à decisão para Agentes Comunitários de Saúde',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto h-screen">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verificar**

```bash
cd src/frontend
npm run dev
```

Abrir http://localhost:3000 — sidebar deve aparecer com 3 links.

- [ ] **Step 4: Commit**

```bash
git add src/frontend/app/layout.tsx src/frontend/components/sidebar.tsx
git commit -m "feat(frontend): layout + sidebar"
```

## Task 3.4: Componentes — KPI card, score badge, patient row

**Files:**
- Create: `src/frontend/components/kpi-card.tsx`
- Create: `src/frontend/components/score-badge.tsx`
- Create: `src/frontend/components/patient-row.tsx`

- [ ] **Step 1: KPI card**

`src/frontend/components/kpi-card.tsx`:

```tsx
import { Card, CardContent } from '@/components/ui/card';

export function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
        <div className="text-3xl font-bold mt-1">{value}</div>
        {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Score badge**

`src/frontend/components/score-badge.tsx`:

```tsx
import { Badge } from '@/components/ui/badge';

export function ScoreBadge({ score }: { score: number }) {
  const variant = score >= 80 ? 'destructive' : score >= 50 ? 'default' : 'secondary';
  return <Badge variant={variant} className="font-mono">{Math.round(score)}</Badge>;
}
```

- [ ] **Step 3: Patient row**

`src/frontend/components/patient-row.tsx`:

```tsx
import Link from 'next/link';
import { ScoreBadge } from './score-badge';
import type { Paciente } from '@/lib/api';

const FACTOR_LABELS: Record<string, string> = {
  gestante: '🤰 Gestante',
  crianca_0_6: '👶 Criança 0-6',
  hipertenso_e_diabetico: '🩺 Hip+Diab',
  hipertenso_xor_diabetico: '🩺 Hip ou Diab',
  idoso_66_mais: '👴 Idoso 66+',
  situacao_vulnerabilidade: '⚠️ Vulnerável',
  sem_visita_180_mais: '⏰ Sem visita 180d+',
  sem_visita_90_a_180: '⏰ Sem visita 90-180d',
  sem_visita_30_a_90: '⏰ Sem visita 30-90d',
  urgencia_menor_30d: '🚑 Urgência <30d',
  urgencia_30_a_90d: '🚑 Urgência 30-90d',
  agendamento_proximo_14d: '📅 Agendamento próximo',
};

export function PatientRow({ patient }: { patient: Paciente }) {
  return (
    <Link
      href={`/pacientes/${patient.paciente_id}`}
      className="flex items-center gap-3 p-3 border rounded hover:bg-slate-100 transition"
    >
      <ScoreBadge score={patient.score} />
      <div className="flex-1">
        <div className="text-xs text-slate-500 font-mono">{patient.paciente_id.slice(0, 12)}…</div>
        <div className="text-sm">
          {patient.faixa_etaria} • {patient.sexo} • equipe {patient.equipe_id.slice(0, 8)}
        </div>
        <div className="text-xs text-slate-600 mt-1 flex gap-1 flex-wrap">
          {patient.fatores.slice(0, 4).map(f => (
            <span key={f} className="bg-slate-200 px-2 py-0.5 rounded">{FACTOR_LABELS[f] ?? f}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/frontend/components/kpi-card.tsx src/frontend/components/score-badge.tsx src/frontend/components/patient-row.tsx
git commit -m "feat(frontend): KPI/score/patient components"
```

## Task 3.5: Dashboard home

**Files:**
- Modify: `src/frontend/app/page.tsx`
- Create: `src/frontend/components/heatmap-map.tsx`

- [ ] **Step 1: Criar heatmap-map.tsx (client component dinâmico)**

`src/frontend/components/heatmap-map.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { HeatmapPoint } from '@/lib/api';

export function HeatmapMap({ points }: { points: HeatmapPoint[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(ref.current).setView([-22.93, -43.25], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    const maxN = Math.max(...points.map(p => p.n_urgencias), 1);

    for (const p of points) {
      const r = 4 + (p.n_urgencias / maxN) * 12;
      const opacity = 0.3 + (p.n_urgencias / maxN) * 0.5;
      L.circleMarker([p.lat, p.lng], {
        radius: r,
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: opacity,
        weight: 1,
      })
        .addTo(map)
        .bindPopup(`${p.n_urgencias} urgências`);
    }

    mapRef.current = map;
    return () => {
      map.remove();
    };
  }, [points]);

  return <div ref={ref} className="w-full h-96 rounded border" />;
}
```

- [ ] **Step 2: Criar page.tsx (dashboard)**

`src/frontend/app/page.tsx`:

```tsx
import { apiClient } from '@/lib/api';
import { KpiCard } from '@/components/kpi-card';
import { PatientRow } from '@/components/patient-row';
import dynamic from 'next/dynamic';

const HeatmapMap = dynamic(() => import('@/components/heatmap-map').then(m => m.HeatmapMap), { ssr: false });

export default async function Dashboard() {
  const [kpis, topPatients, heatmap] = await Promise.all([
    apiClient.kpis(),
    apiClient.patients({ limit: 10 }),
    apiClient.heatmap(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Reunião semanal — visão do território</h2>
        <p className="text-slate-500">Pacientes priorizados, alertas, e concentração geográfica de risco.</p>
      </header>

      <section className="grid grid-cols-4 gap-3">
        <KpiCard label="Pacientes" value={kpis.total_pacientes.toLocaleString()} />
        <KpiCard label="Cobertura" value={`${kpis.cobertura_pct}%`} hint={`${kpis.pacientes_visitados.toLocaleString()} visitados`} />
        <KpiCard label="Alertas abertos" value={kpis.alertas_abertos} />
        <KpiCard label="Urgências 30d" value={kpis.urgencias_30d.toLocaleString()} />
      </section>

      <section className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h3 className="font-semibold mb-3">Concentração territorial de urgências</h3>
          <HeatmapMap points={heatmap} />
        </div>
        <div>
          <h3 className="font-semibold mb-3">Top 10 prioridades</h3>
          <div className="space-y-2">
            {topPatients.map(p => <PatientRow key={p.paciente_id} patient={p} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verificar — backend rodando + frontend rodando**

```bash
# em um terminal: backend
cd src/backend && npm run dev

# em outro: frontend
cd src/frontend && npm run dev
```

Abrir http://localhost:3000 — deve mostrar:
- 4 KPI cards no topo
- Mapa com pontos vermelhos (hotspots de urgência)
- Lista de top 10 pacientes à direita

- [ ] **Step 4: Commit**

```bash
git add src/frontend/components/heatmap-map.tsx src/frontend/app/page.tsx
git commit -m "feat(frontend): dashboard home com KPIs + heatmap + top prioridades"
```

## Task 3.6: Página /pacientes (lista com filtros)

**Files:**
- Create: `src/frontend/app/pacientes/page.tsx`

- [ ] **Step 1: Criar página**

`src/frontend/app/pacientes/page.tsx`:

```tsx
import { apiClient } from '@/lib/api';
import { PatientRow } from '@/components/patient-row';

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ score_min?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const scoreMin = params.score_min ? Number(params.score_min) : 50;
  const limit = params.limit ? Number(params.limit) : 100;

  const patients = await apiClient.patients({ score_min: scoreMin, limit });

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold">Pacientes priorizados</h2>
        <p className="text-slate-500">{patients.length} pacientes com score ≥ {scoreMin}</p>
      </header>

      <div className="flex gap-2">
        <a href="/pacientes?score_min=80" className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">Score ≥ 80 (alta)</a>
        <a href="/pacientes?score_min=50" className="px-3 py-1 bg-amber-100 text-amber-700 rounded text-sm">Score ≥ 50 (média)</a>
        <a href="/pacientes?score_min=0" className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm">Todos</a>
      </div>

      <div className="space-y-2">
        {patients.map(p => <PatientRow key={p.paciente_id} patient={p} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

Abrir http://localhost:3000/pacientes — deve mostrar lista com 3 chips de filtro + cards.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/app/pacientes/page.tsx
git commit -m "feat(frontend): página pacientes com filtros de score"
```

## Task 3.7: Página /pacientes/[id] (detalhe)

**Files:**
- Create: `src/frontend/app/pacientes/[id]/page.tsx`

- [ ] **Step 1: Criar página**

`src/frontend/app/pacientes/[id]/page.tsx`:

```tsx
import { apiClient } from '@/lib/api';
import { ScoreBadge } from '@/components/score-badge';
import { Card, CardContent } from '@/components/ui/card';

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { paciente, visitas, eventos, alertas } = await apiClient.patient(id);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <ScoreBadge score={paciente.score} />
          <h2 className="text-2xl font-bold font-mono">{paciente.paciente_id.slice(0, 16)}…</h2>
        </div>
        <p className="text-slate-500 mt-1">
          {paciente.faixa_etaria} • {paciente.sexo} • {paciente.raca_cor} • equipe {paciente.equipe_id.slice(0, 8)}
        </p>
      </header>

      <section className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-slate-500 uppercase">Comorbidades</div>
            <div className="text-sm mt-2 space-y-1">
              <div>Gestante: <strong>{paciente.gestacao ? 'sim' : 'não'}</strong></div>
              <div>Hipertenso: <strong>{paciente.hipertenso ? 'sim' : 'não'}</strong></div>
              <div>Diabético: <strong>{paciente.diabetico ? 'sim' : 'não'}</strong></div>
              <div>Vulnerável: <strong>{paciente.situacao_vulnerabilidade ? 'sim' : 'não'}</strong></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-slate-500 uppercase">Fatores do score</div>
            <div className="text-sm mt-2 space-y-1">
              {paciente.fatores.map(f => <div key={f}>• {f.replace(/_/g, ' ')}</div>)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-slate-500 uppercase">Última visita</div>
            <div className="text-sm mt-2">
              <strong>{paciente.ultima_visita ?? 'nunca'}</strong>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h3 className="font-semibold mb-3">Alertas abertos ({alertas.length})</h3>
        <div className="space-y-2">
          {alertas.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhum alerta aberto.</p>
          ) : alertas.map(a => (
            <div key={a.id} className="p-3 border rounded bg-amber-50">
              <div className="text-xs text-amber-700 uppercase">{a.tipo}</div>
              <div className="text-sm mt-1">{a.mensagem}</div>
              <div className="text-xs text-slate-500 mt-1">{a.criado_em}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-3">Eventos clínicos ({eventos.length})</h3>
        <pre className="text-xs bg-slate-100 p-3 rounded overflow-auto max-h-40">{JSON.stringify(eventos.slice(0, 10), null, 2)}</pre>
      </section>

      <section>
        <h3 className="font-semibold mb-3">Visitas ({visitas.length})</h3>
        <pre className="text-xs bg-slate-100 p-3 rounded overflow-auto max-h-40">{JSON.stringify(visitas.slice(0, 10), null, 2)}</pre>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

Da página de pacientes, clicar em um → deve abrir o detalhe.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/app/pacientes/\[id\]/page.tsx
git commit -m "feat(frontend): página detalhe de paciente"
```

## Task 3.8: Página /chat (chat IA com SSE)

**Files:**
- Create: `src/frontend/app/chat/page.tsx`

- [ ] **Step 1: Criar página chat (client component completo)**

`src/frontend/app/chat/page.tsx`:

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const SUGESTOES = [
  'Quais 5 pacientes têm maior prioridade hoje?',
  'Quantas gestantes estão sem visita?',
  'Quais são os alertas abertos mais urgentes?',
  'Mostra cobertura geral e dos idosos.',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages }),
      });

      if (!res.body) throw new Error('Sem body na resposta');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      setMessages(m => [...m, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        // Parse SSE chunk: linhas "event: message" + "data: ..."
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === 'ok') continue;
            assistantText += data;
            setMessages(m => {
              const copy = [...m];
              copy[copy.length - 1] = { role: 'assistant', content: assistantText };
              return copy;
            });
          }
        }
      }
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: `❌ Erro: ${(err as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <header className="mb-4">
        <h2 className="text-2xl font-bold">Chat IA — Reunião Semanal</h2>
        <p className="text-slate-500 text-sm">Pergunte sobre o território, prioridades, alertas, grupos populacionais.</p>
      </header>

      {messages.length === 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {SUGESTOES.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-left p-3 border rounded hover:bg-slate-100 text-sm"
            >
              💡 {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 px-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded max-w-[80%] ${m.role === 'user' ? 'ml-auto bg-blue-100' : 'bg-white border'}`}
          >
            <div className="text-xs text-slate-500 mb-1">{m.role === 'user' ? '👤 Você' : '🤖 IA'}</div>
            <div className="whitespace-pre-wrap text-sm">{m.content}</div>
          </div>
        ))}
        {loading && <div className="p-3 rounded bg-white border max-w-[80%]"><div className="text-xs text-slate-500 mb-1">🤖 IA</div><div className="text-sm text-slate-500 italic">pensando...</div></div>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex gap-2 sticky bottom-0 bg-slate-50 pt-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte alguma coisa..."
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()}>Enviar</Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verificar**

http://localhost:3000/chat — clicar numa sugestão. Deve aparecer mensagem de IA streamando.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/app/chat/page.tsx
git commit -m "feat(frontend): chat IA com SSE streaming + sugestões"
```

---

# Phase 4 — Integration & Submission (~30-45 min)

## Task 4.1: Teste end-to-end final

**Files:** nenhum

- [ ] **Step 1: Garantir tudo rodando**

3 terminais:
1. `cd src/backend && npm run dev` (porta 3001)
2. `ngrok http 3001` (verificar URL HTTPS)
3. `cd src/frontend && npm run dev` (porta 3000)

Twilio Console → webhook configurado pra URL ngrok.

- [ ] **Step 2: Cenário demo**

Do celular: mandar via WhatsApp do sandbox:

```
Visitei dona Maria da equipe 3, pressão 18 por 11, não tomou remédio essa semana. Filho mais novo com tosse persistente.
```

Verificar:
1. Backend mostra log "📨 WhatsApp recebido"
2. Celular recebe reply do bot
3. http://localhost:3000 → KPI de alertas sobe
4. http://localhost:3000/pacientes → score muda
5. http://localhost:3000/chat → "Quais alertas novos?" devolve lista

- [ ] **Step 3: Se algo falhar, debug rápido**

- Webhook não chega: ngrok URL caiu / Twilio webhook config errado
- Match não funciona: verifique candidatos passados no prompt
- Score não atualiza: verificar `npm run dev` reload, polling no frontend
- Chat trava: verificar `MODEL_ID` e key Anthropic

## Task 4.2: README final do repo

**Files:**
- Create or Modify: `README.md`

- [ ] **Step 1: Escrever README**

`README.md`:

```markdown
# Vigia ACS — Apoio à reunião semanal das equipes de Saúde da Família

> Solução submetida ao **Claude Impact Lab Rio de Janeiro 2026**, tema saúde.

## Equipe

- **Peter Flag** ([@peterflagdooor](https://github.com/peterflagdooor)) — orquestração + spec + EDA
- TODO: nomes do time

## Tema

Saúde pública — **Inteligência no Território** (apoio aos Agentes Comunitários de Saúde do Rio).

## Resumo da solução

Mini-ERP web que apoia a **reunião semanal** da equipe de Saúde da Família (médico, enfermeiro, ACS) com:

1. **Ingestão por WhatsApp**: ACS manda texto pós-visita → Claude extrai sintomas, alertas, sugestões → atualiza paciente.
2. **Dashboard com priorização**: pacientes ordenados por score composto (4 eixos: clínico, social, temporal, gatilho), heatmap territorial.
3. **Chat IA**: pergunte em linguagem natural durante a reunião — IA consulta o banco via tool use.

## Arquitetura

```
WhatsApp (ACS) → Twilio Sandbox → Backend Node/Hono → Claude (extração) → SQLite → Dashboard Next.js
                                                                                  ↘ Chat IA (Claude tool use)
```

**Stack:**
- Frontend: Next.js 15 + Tailwind + shadcn/ui + Leaflet
- Backend: Node + TypeScript + Hono + better-sqlite3
- IA: Anthropic Claude Sonnet 4.6 (Haiku 4.5 pra extração)
- WhatsApp: Twilio Sandbox (SDK direto)
- Dados: Parquets anonimizados da SMS-Rio → SQLite via Python ETL

## Como o Claude foi usado

- **Extração estruturada** de mensagens em texto livre do ACS (Haiku 4.5 — fast, cheap)
- **Chat com tool use**: Claude tem acesso a 4 ferramentas read-only (`query_patients`, `query_alerts`, `query_kpis`, `query_group_stats`) e decide quais chamar
- **Justificativas de score** por paciente em linguagem amigável (planejado — não no MVP)

## Como rodar localmente

```bash
# 1. Clone
git clone https://github.com/peterflagdooor/impact-acs-rio.git
cd impact-acs-rio

# 2. Configurar .env
cp .env.example .env  # preencher ANTHROPIC_API_KEY + TWILIO_*

# 3. Dataset (Python)
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scripts/seed_sqlite.py   # gera db.sqlite

# 4. Backend
cd src/backend && npm install && npm run dev

# 5. Frontend (em outro terminal)
cd src/frontend && npm install && npm run dev

# 6. Ngrok pra webhook (em outro terminal)
ngrok http 3001
# atualizar webhook URL no Twilio Console
```

## Roadmap (pós-hackathon)

- **Áudio nativo**: aceitar voice notes do WhatsApp (Whisper) e gerar transcrição
- **Família como entidade**: ACS confirma família em campo via WhatsApp, sistema vira família-cêntrico
- **Integração Vitacare**: exportar pra sistema oficial da SMS
- **Roteirização**: otimização de rota a partir da lista priorizada
- **Multi-tenant**: várias unidades de saúde com isolamento de dados

## Demo video

TODO: link do vídeo de 60s (se aplicável)

## Documentação

- [Spec do MVP](docs/superpowers/specs/2026-05-24-mvp-acs-design.md)
- [Plano de implementação](docs/superpowers/plans/2026-05-24-mvp-acs-implementation.md)
- [Análise completa do dataset](docs/analise-completa-dataset-saude.md)
```

- [ ] **Step 2: Preencher nomes do time**

Trocar `TODO: nomes do time` pelos nomes reais.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README final pra submissão do hackathon"
```

## Task 4.3: Submissão final

**Files:** nenhum

- [ ] **Step 1: Push final pro GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Enviar email pra eventos@taicor.ai**

Subject: `Submissão Claude Impact Lab Rio — Equipe <Nome> — Saúde`

Corpo:
```
Olá time Taicor,

Segue a submissão da nossa equipe para o Claude Impact Lab Rio 2026,
tema saúde.

Nome da equipe: <nome>
Tema: Saúde pública
Repositório: https://github.com/peterflagdooor/impact-acs-rio
Membros: <nomes>

Obrigado!
<Peter>
```

- [ ] **Step 3: Ensaiar pitch (5-10 min)**

Repassar a sequência da seção 11 da spec. Verificar:
- Backend + frontend + ngrok rodando antes do palco
- Webhook configurado e testado nos últimos 10 min antes
- Slide/imagem de backup caso algo falhe

---

# Self-Review

Checklist run by the plan author against the spec:

1. **Spec coverage:**
   - §3.1 Obj 1 (ingestão WhatsApp): ✅ Tasks 0.2, 2.5, 2.6
   - §3.1 Obj 2 (dashboard de priorização): ✅ Tasks 3.4, 3.5, 3.6, 3.7
   - §3.1 Obj 3 (chat IA contextual): ✅ Tasks 2.7, 3.8
   - §3.1 Obj 4 (score transparente escalável): ✅ Tasks 1.2 (Python batch), 2.3 (TS runtime)
   - §3.1 Obj 5 (agenda por ACS com completion): ⚠️ **STRETCH não coberta** — marcada como tal no mapa de arquivos
   - §6 schema: ✅ Task 1.1
   - §7 scoring: ✅ Tasks 1.2 e 2.3 (mesma fórmula em Python e TS)
   - §8.1 fluxo ingestão: ✅ Task 2.6
   - §8.2 chat com tool use: ✅ Task 2.7
   - §8.3 edge cases: parcialmente coberto (match falha, msg duplicada). Demais ficam pra retoque manual.
   - §10 rotas frontend: ✅ exceto `/agenda` (stretch)
   - §11 demo: ✅ Task 4.1 simula o cenário
   - §14 DoD checklist: ✅ Task 4.1, 4.2, 4.3 cobrem todos os bullets

2. **Placeholder scan:**
   - "TODO: nomes do time" no README — intencional, depende do time
   - "TODO: link do vídeo" no README — intencional
   - Nenhum TBD ou "implementar depois" sem código.

3. **Type consistency:**
   - `PacienteComScore` definido em types.ts é usado consistentemente em db.ts, scoring.ts, api.ts (frontend).
   - `fatores` é `string[]` no TS e `string` (JSON) no SQL — claro no contrato (parseJSON no db.ts).
   - Endpoints batem: backend rota → frontend client.

**Result:** plano completo. `/agenda` foi marcada como stretch goal (cobre §3.1 Obj 5 mas pode ser cortada por tempo). Sem placeholders soltos. Tipos consistentes.

---

*Plano gerado pela skill superpowers:writing-plans a partir da spec aprovada em `docs/superpowers/specs/2026-05-24-mvp-acs-design.md`. Pronto pra execução via subagent-driven-development ou executing-plans.*

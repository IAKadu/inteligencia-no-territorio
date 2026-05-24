# Inteligência no Território

Aplicação de apoio à Estratégia de Saúde da Família para priorizar visitas domiciliares de ACS a partir de dados anonimizados de pacientes, visitas, equipes e eventos clínicos.

## O que o projeto entrega

- Score de risco por paciente.
- Ranking de pressão por equipe.
- Detecção de pacientes invisíveis, sem nenhuma visita registrada.
- Agenda diária por equipe, considerando quantidade de ACS e visitas por ACS.
- Roteirização por proximidade geográfica.
- Justificativas operacionais para o ACS.
- Painel web para gestor e ACS.
- App full-stack integrado em Next.js, Hono e Supabase para a versão ampliada do MVP.

## Estrutura

```text
.
├── Dados/
│   ├── equipes_anonimizadas.parquet
│   ├── eventos_clinicos_anonimizados.parquet
│   ├── pacientes_anonimizados.parquet
│   └── visitas_anonimizadas.parquet
├── analises/
├── Branding Book/
├── apps/
│   └── impact-acs-rio/
│       ├── src/backend/      # API Hono + Anthropic + Twilio + Supabase
│       ├── src/frontend/     # Next.js + mapa + painel da reunião semanal
│       ├── supabase/         # migrations versionadas
│       └── _inbox/data/      # Parquets anonimizados para ingestão
├── projeto/
│   ├── api/
│   ├── config/
│   ├── frontend/
│   └── pipeline/
├── briefing-inteligencia-no-territorio.md
└── indicadores_dashboard 2.xlsx
```

## Dados para ingestão

Os dados anonimizados ficam em `Dados/` e são lidos diretamente pelo pipeline em `projeto/config/settings.py`.

Arquivos esperados:

| Arquivo | Uso |
| --- | --- |
| `equipes_anonimizadas.parquet` | Sedes e vínculos das equipes |
| `pacientes_anonimizados.parquet` | Perfil clínico/social dos pacientes |
| `visitas_anonimizadas.parquet` | Histórico de visitas domiciliares |
| `eventos_clinicos_anonimizados.parquet` | Urgências, internações e agendamentos |

## Instalação

Use Python 3.11+.

```bash
cd projeto
python -m pip install fastapi uvicorn pandas numpy duckdb pyyaml pyarrow anthropic
```

O uso da API Anthropic para justificativas é opcional. Se não houver chave, o sistema usa textos de fallback.

Crie `projeto/.env` se quiser habilitar justificativas via modelo:

```text
ANTHROPIC_API_KEY=sua_chave
```

## Rodar a API

```bash
cd projeto
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000
```

Ao iniciar, a API carrega os Parquets e calcula os scores em memória.

Endpoints principais:

- `GET /`
- `GET /equipes`
- `GET /equipes/{equipe_id}/agenda?capacidade=36&com_justificativas=false`
- `GET /gestao/painel`
- `GET /gestao/risco`
- `GET /gestao/invisiveis`
- `POST /pipeline/recalcular`

## Abrir o painel

Com a API rodando, abra:

```text
projeto/frontend/gestor/index.html
```

O painel consome a API em `http://localhost:8000`.

## App full-stack integrado

A versão ampliada do MVP fica em `apps/impact-acs-rio/`.

Ela traz:

- Frontend Next.js com painel territorial, mapa, pacientes invisíveis, agenda e chat.
- Backend TypeScript/Hono com endpoints REST, webhook WhatsApp/Twilio e integração Anthropic.
- Migrations Supabase em `apps/impact-acs-rio/supabase/migrations/`.
- Dados parquet anonimizados em `apps/impact-acs-rio/_inbox/data/`.

Rodar backend:

```bash
cd apps/impact-acs-rio/src/backend
npm install
npm run dev
```

Rodar frontend:

```bash
cd apps/impact-acs-rio/src/frontend
npm install
npm run dev
```

Por padrão, o frontend espera a API em `http://localhost:3001`.

## Validar o pipeline

```bash
cd projeto
python test_api.py
python test_pipeline.py
```

## Como o score é composto

O score combina:

- Perfil clínico/social.
- Déficit de visitas em relação à régua anual.
- Urgências recentes.
- Agendamento futuro.
- Bônus para pacientes invisíveis.

As regras ficam em:

```text
projeto/config/regua_visitas.yaml
```

Faixas de prioridade:

| Score | Prioridade |
| --- | --- |
| 0-19 | Rotina |
| 20-49 | Atenção |
| 50-79 | Urgente |
| 80+ | Crítico |

## Observações de segurança

- Os Parquets deste repositório são anonimizados.
- Arquivos `.env` ficam fora do Git.
- Não commitar chaves de API, tokens ou dados identificáveis.

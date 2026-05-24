# Fases de Construção e Escopo da Solução

**Referências:** [06_sugestoes_de_solucao.md](06_sugestoes_de_solucao.md) · [07_arquitetura_e_stack.md](07_arquitetura_e_stack.md)

---

## Pergunta central: uma solução ou várias?

**Recomendação: uma solução, com módulos independentes.**

O problema do ACS é um fluxo único e contínuo:

```
dados → score → priorização → rota → agenda → campo → registro
```

Segmentar em soluções separadas fragmenta esse fluxo e enfraquece a narrativa. O valor da plataforma está em entregar o fluxo completo — do dado bruto à instrução no bolso do ACS.

O que deve ser modular é a **implementação**, não o produto. Cada módulo pode ser construído e demonstrado independentemente, mas o produto final é uma plataforma coesa.

---

## O que pode ser construído AGORA

Com os 4 arquivos Parquet disponíveis e a stack definida, é possível construir hoje:

### Módulo A — Motor de Priorização ✅ Pronto para construir

**Esforço estimado: 3–4 horas**

O que inclui:
- Feature engineering completo (DuckDB sobre os Parquets)
- Score de risco por paciente (regras + pesos em YAML)
- Lista de invisíveis críticos (790 casos com 3+ urgências e zero visita)
- Output: `pacientes_scored.parquet` com score, dimensões e flags

Nada bloqueia esse módulo. Todos os dados necessários estão presentes e sem nulls. As queries já foram validadas na exploração.

```python
# O que sai desse módulo:
{
  "paciente_id": "abc123...",
  "equipe_id": "def456...",
  "score_total": 87,
  "score_clinico": 40,       # gestante
  "score_deficit": 32,       # 4 visitas abaixo da régua
  "score_urgencia": 15,      # 1 urgência nos últimos 90 dias
  "score_agendamento": 0,
  "dias_sem_visita": 78,
  "prioridade": "CRITICA",
  "lat": -22.913,
  "lon": -43.252
}
```

---

### Módulo B — Agenda Diária por Equipe ✅ Pronto para construir

**Esforço estimado: 3–4 horas** (depende do Módulo A)

O que inclui:
- Seleção dos top N pacientes por equipe (N = capacidade do turno)
- Roteamento por Nearest Neighbor (origin = sede da equipe)
- Geração de justificativas via Claude API (Haiku)
- Output: lista ordenada com motivo legível por humano

O roteamento com 5–7 pontos por turno é simples o suficiente para Nearest Neighbor. Não requer OR-Tools nesta fase.

```
Agenda da Equipe ba1cb3b7 — 26/05/2025
Capacidade do turno: 6 visitas

1. Paciente [ID] — 1,2 km da sede
   ⚠ CRÍTICO | Score 94
   Gestante sem visita há 78 dias. Verificar pré-natal e
   comunicar consulta agendada para 02/06.

2. Paciente [ID] — 1,8 km
   ⚠ URGENTE | Score 71
   Hipertenso + diabético. 2 idas a urgência nos últimos
   90 dias. Verificar adesão à medicação.
   ...
```

---

### Módulo C — API Backend ✅ Pronto para construir

**Esforço estimado: 2–3 horas** (depende dos Módulos A e B)

3 endpoints mínimos para o hackathon:

```
GET /equipes/{equipe_id}/agenda      → agenda do dia/semana
GET /equipes/{equipe_id}/invisíveis  → pacientes críticos sem visita
GET /gestao/painel                   → métricas por equipe
```

---

### Módulo D — Interface do ACS 🟡 Construível com escopo reduzido

**Esforço estimado: 4–6 horas**

Para o hackathon, o mínimo viável é uma página web mobile-first que exibe:
- Lista de visitas do dia com cards (motivo + distância)
- Botão "Marcar como visitado"
- Mapa básico com os pontos do dia

PWA com cache offline e sincronização é pós-hackathon.

---

### Módulo E — Painel do Gestor 🟡 Construível rapidamente com Streamlit

**Esforço estimado: 2–3 horas**

Streamlit permite construir o painel analítico em uma tarde:
- Score de pressão por equipe (tabela + mapa de pontos)
- % cobertura por grupo prioritário
- Lista de pacientes invisíveis por equipe

---

## O que NÃO pode ser construído agora

| Item | Bloqueio | Quando |
|---|---|---|
| Integração com prontuário eletrônico (e-SUS/PEC) | Acesso à API de produção da SMS | Pós-hackathon |
| PWA com modo offline real | Requer deploy + service workers | Pós-hackathon |
| Validação dos pesos com profissionais clínicos | Requer sessão com equipe da SMS | Pós-hackathon |
| Roteamento com OpenStreetMap (OSRM) | Setup de infraestrutura | Fase 2 |
| ML supervisionado (XGBoost) | Label confiável comprometido pelo date shifting | Fase 3 |
| Distinção bebês < 1 ano dentro de "0-6" | Campo ausente nos dados anonimizados | Dados reais |
| Campo tuberculose (visita diária) | Campo ausente nos dados anonimizados | Dados reais |

---

## Fases de construção

### Fase 0 — Hoje (hackathon, horas) ⚡

**Objetivo:** motor funcionando, demonstração com dados reais

| Módulo | Entregável | Tempo |
|---|---|---|
| A | Script Python: score de todos os 97.938 pacientes | 3–4h |
| A | Lista dos 790 casos críticos (3+ urgências, 0 visitas) | 30min |
| B | Agenda de uma equipe com justificativas Claude | 3–4h |
| C | FastAPI com 3 endpoints rodando local | 2–3h |
| E | Painel Streamlit com métricas por equipe | 2–3h |

**Total estimado: 1 a 2 dias de trabalho**

Ao final da Fase 0, é possível demonstrar: "dado o território X, aqui estão os 6 pacientes que o ACS da equipe Y deve visitar amanhã, por essas razões, nessa ordem."

---

### Fase 1 — Semana 1 (hackathon, dias) 🏗

**Objetivo:** produto navegável e demonstrável para juízes

| Módulo | Entregável | Tempo |
|---|---|---|
| D | Interface ACS mobile-first (Next.js) | 4–6h |
| C | Endpoint POST /visitas/registrar | 1–2h |
| E | Painel gestor com mapa de calor das equipes | 2–3h |
| — | Deploy no Railway ou Render (URL pública) | 1–2h |

**Total estimado: 2 a 3 dias adicionais**

---

### Fase 2 — Pós-hackathon (semanas) 🔧

**Objetivo:** qualidade de produção, validação com usuários reais

- Migração DuckDB → PostgreSQL + PostGIS
- Roteamento com OSRM (OpenStreetMap)
- Validação dos pesos do score com equipe clínica da SMS
- Interface ACS como PWA (offline + sincronização)
- Testes com ACS reais em campo (piloto em 1 equipe)
- Deploy em GCP Cloud Run

---

### Fase 3 — Longo prazo (meses) 🚀

**Objetivo:** integração sistêmica e escala

- Integração com e-SUS/PEC (prontuário eletrônico)
- Dados em tempo quase-real (sem necessidade de Parquet manual)
- Modelo ML supervisionado com dados reais e validação clínica
- Expansão para outras Áreas Programáticas
- Campo tuberculose e distinção de faixas etárias detalhadas
- Módulo de feedback: ACS registra o que encontrou em campo → melhora o score

---

## Uma solução ou várias? — argumento final

| Critério | Uma solução | Soluções separadas |
|---|---|---|
| Narrativa para demo | ✅ Fluxo completo e impactante | ❌ Histórias fragmentadas |
| Risco de entrega | ⚠ Se uma parte atrasa, o todo atrasa | ✅ Cada parte entrega valor isolado |
| Impacto para o ACS | ✅ O ACS precisa do fluxo completo | ❌ Score sem interface não chega ao campo |
| Manutenção futura | ✅ Um repositório, uma equipe | ⚠ Coordenação entre times |
| Demonstração no hackathon | ✅ Um demo coeso e memorável | ❌ Três demos mediocres |

**Conclusão:** construir como **uma plataforma com módulos independentes**. No hackathon, demonstrar o fluxo ponta a ponta com uma equipe real dos dados. Internamente, cada módulo (score, roteamento, interface, painel) tem seu próprio arquivo e pode ser desenvolvido em paralelo.

---

## Sequência de build recomendada para hoje

```
1. pipeline/features.py         ← extração DuckDB (base de tudo)
2. pipeline/score.py            ← regras + pesos
3. pipeline/invisíveis.py       ← 790 casos críticos (demo rápida)
4. pipeline/routing.py          ← nearest neighbor para 1 equipe
5. pipeline/justificativas.py   ← Claude Haiku
6. api/main.py                  ← FastAPI 3 endpoints
7. frontend/gestor/app.py       ← Streamlit painel
8. frontend/acs/                ← interface mobile (por último)
```

O item 3 (invisíveis) pode ser demonstrado antes do item 4 estar pronto — é um resultado imediato e impactante que serve como prova de conceito enquanto o resto é construído.

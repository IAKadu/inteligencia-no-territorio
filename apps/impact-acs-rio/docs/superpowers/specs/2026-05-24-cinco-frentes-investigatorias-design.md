# Design — Cinco frentes investigatórias sobre o dataset ACS

**Data:** 2026-05-24
**Origem:** Capítulo 10 ("Próximos passos analíticos") do documento `docs/analise-completa-dataset-saude.md`. Peter aprovou executar todas as 5 frentes nesta rodada.
**Stakeholder:** Peter Flag (Claude Impact Lab 2026 — hackathon SMS Rio).

**Relação com o MVP do produto (trilho paralelo):**
Existe em paralelo a este trilho analítico um MVP funcional do produto, já implementado (commits `feae6cf` em diante): backend Hono+TS com scoring engine, frontend Next.js institucional, dashboard com heatmap Leaflet + ORS isochrones, chat IA, Twilio webhook. Specs em `docs/superpowers/specs/2026-05-24-mvp-acs-design.md` e plan em `plans/2026-05-24-mvp-acs-implementation.md`. **Estes dois trilhos não se sobrepõem em código** — o MVP é o produto rodando; este spec é deep-dive analítico em Python pra alimentar números do pitch e fechar o ciclo de EDA. Os outputs podem cruzar (ex.: score do MVP em TS vs score aditivo em Python desta spec — comparação intencional para validar implementação do MVP).

**ORS_API_KEY:** vive em `src/backend/.env` (não na raiz). Scripts Python desta spec carregam via `dotenv` apontando para esse caminho (`load_dotenv("src/backend/.env")`).

---

## 1. Contexto e objetivos

O EDA atual (4 scripts em `scripts/eda_*.py`) já produziu uma análise consolidada em `docs/analise-completa-dataset-saude.md`. O capítulo 10 lista 5 frentes investigatórias que precisam ser executadas para fechar o ciclo analítico antes do pitch:

1. Recalibrar inferência espacial de família com grid 30m + filtro [2-8]
2. Construir score de risco composto
3. Simular fluxo de "lista do dia" / capacidade de cobertura
4. Heatmap geográfico das urgências
5. Análise de "famílias com fantasmas"

Cada frente entrega: (a) 1 script Python autocontido, (b) outputs em `docs/outputs/`, (c) uma seção nova no `analise-completa-dataset-saude.md`.

**Critério de sucesso global:** ao final, o `analise-completa-dataset-saude.md` tem 5 capítulos novos com números executáveis pelo pitch, e o `scripts/` tem 5 scripts novos rodáveis com `.venv/bin/python scripts/<nome>.py`.

---

## 2. Decisões transversais

### 2.1 Estrutura de outputs

> **Nota sobre `.gitignore`:** a regra global `outputs/` foi removida do `.gitignore` para permitir que `docs/outputs/` seja versionado. Decisão alinhada com o Peter: os outputs das frentes vão pro git (todos têm tamanho moderado: parquets pequenos, HTML, CSV).


```
docs/
  analise-completa-dataset-saude.md  (atualizado: cap 10 reescrito + cap 11-15 novos)
  outputs/                            (novo diretório)
    familias_30m.parquet
    score_pacientes.parquet
    score_familias.parquet
    simulacao_cobertura.csv
    heatmap_urgencias.html
    fantasmas_enderecos.parquet
scripts/
  eda_familias_calibrada.py           (frente 1)
  score_composto.py                    (frente 2)
  simulacao_cobertura.py               (frente 3)
  heatmap_geografico.py                (frente 4)
  analise_fantasmas.py                 (frente 5)
```

### 2.2 Dependências novas

Adicionar ao `requirements.txt`:
- `folium` (>=0.16) — mapa Leaflet em HTML estático
- `openrouteservice` (>=2.3) — cliente Python pro ORS (opcional, só usado se quisermos isochrones depois)
- `python-dotenv` (>=1.0) — pra carregar `.env` nos scripts Python

### 2.3 Credenciais

- `ORS_API_KEY` vive em **`src/backend/.env`** (gitignored). Backend Node já usa a chave server-side em `/api/territory/isochrones` (commit `fd25406`).
- `.env.example` consolidado na raiz tem referência; cada subapp tem seu próprio `.env.example`.
- Scripts Python desta spec carregam via `python-dotenv` apontando explicitamente: `load_dotenv("src/backend/.env")`.
- **Nunca** expor via `NEXT_PUBLIC_*` — backend faz proxy.

### 2.4 Premissas comuns aos scripts

Todos os scripts:
- Carregam Parquets de `_inbox/data/*.parquet`.
- Filtram outliers extremos de geo (>10km da sede da equipe) antes de qualquer análise espacial.
- Imprimem progresso no stdout para inspeção rápida.
- Salvam outputs determinísticos em `docs/outputs/` (commit no git).
- **Não** dependem do SQLite — leem direto dos Parquets do `_inbox/data/`.

---

## 3. Frente 1 — Famílias recalibradas (grid 30m)

### Objetivo
Substituir os números estimados do §6.3 (que vinham de grid 50m extrapolado) por valores reais sobre grid 30m + filtro [2-8].

### Script: `scripts/eda_familias_calibrada.py`

**Inputs:**
- `_inbox/data/pacientes.parquet`
- `_inbox/data/visitas.parquet`
- `_inbox/data/eventos_clinicos.parquet`

**Algoritmo:**
1. Descartar pacientes a >10km da sede da equipe.
2. Agregar por célula de grid 30m (`lat_round = round(lat * 1000)`, idem `lng`).
3. Filtrar células com 2-8 membros → essas viram famílias candidatas.
4. Para cada família: somar sinais de risco (idoso, hipertenso, diabético, gestante, criança 0-6, vulnerável).
5. Anexar última visita / eventos clínicos por agregação `paciente_id` → família.

**Output: `docs/outputs/familias_30m.parquet`**

Colunas:
- `familia_id` (string: `f_<lat_grid>_<lng_grid>`)
- `n_membros` (int)
- `equipe_id` (majoritária — `mode()` sobre os pacientes da família; em empate, escolher menor id)
- `lat_centro`, `lng_centro`
- `n_idosos`, `n_hipertensos`, `n_diabeticos`, `n_gestantes`, `n_criancas_0_6`, `n_vulneraveis`
- `n_sinais_risco` (soma dos não-zero)
- `n_pacientes_nunca_visitados`
- `n_pacientes_com_urgencia_30d`
- `data_ultima_visita_familia`

**Análises a imprimir + ir pro doc:**
- Total de famílias candidatas (esperado: ~15.300)
- Tamanho médio (esperado: ~3.17, alinhado com briefing)
- Distribuição por # de sinais (0 / 1 / 2 / 3 / 4+)
- Top 20 famílias com triplete completo (idoso + hip + diab + vuln)
- Distribuição por equipe

### Capítulo no doc
**Capítulo 11 — Famílias recalibradas (grid 30m).** Substitui e refina o §6.3. Mantém §6.4 (problema da confirmação).

---

## 4. Frente 2 — Score de risco composto (aditivo)

### Objetivo
Ranquear pacientes e famílias para alimentar a "lista do dia" da reunião semanal.

### Script: `scripts/score_composto.py`

**Esquema de pesos (auditável):**

| Sinal | Peso | Fonte (briefing/dataset) |
|---|---|---|
| Urgência nos últimos 30d | +5 | Briefing: "internação recente" dispara visita |
| Sem visita há >90 dias | +3 | Achado nosso §3.2 (19.3% dos gaps) |
| Nunca visitado | +4 | Achado nosso §5.1 (49.9% silêncio absoluto) |
| Gestante | +3 | Briefing: alto risco padrão |
| Vulnerável social | +2 | Briefing: alto risco |
| Idoso 66+ | +2 | Briefing: idoso frágil = médio risco |
| Criança 0-6 | +2 | Briefing: mensal mas alvo prioritário |
| Hipertenso | +1 | Briefing: mensal |
| Diabético | +1 | Briefing: mensal |

**Score total = soma.**

**Buckets:**
- 0-3: rotina
- 4-7: médio
- 8-11: alto
- 12+: urgente

**Algoritmo:**
1. Para cada paciente, calcular score_paciente.
2. Para cada família (vinda da Frente 1), agregar: `score_familia = sum(score_paciente) + bonus_se_>=3_sinais_simultaneos (+2)`.
3. Ranquear.

**Outputs:**
- `docs/outputs/score_pacientes.parquet`: `paciente_id`, `score`, `bucket`, `equipe_id`, breakdown por sinal.
- `docs/outputs/score_familias.parquet`: `familia_id`, `score`, `bucket`, breakdown.

**Análises pro doc:**
- Histograma de scores (paciente e família).
- % da base em cada bucket.
- Top 100 pacientes por score (anonimizado: só `paciente_id`).
- Top 50 famílias por score.
- Cross-tab bucket × equipe (quais equipes têm mais "urgente"?).

### Capítulo no doc
**Capítulo 12 — Score de risco composto.** Tabela de pesos, distribuição, ranking, cross-tab por equipe.

---

## 5. Frente 3 — Simulação de cobertura

### Objetivo
Responder concretamente: "dada a capacidade real, quantas semanas pra cobrir as ~2.150 famílias prioritárias?"

### Script: `scripts/simulacao_cobertura.py`

**Parâmetros configuráveis no topo do script:**
```python
N_ACS_REAIS = 265
TURNOS_VISITA_SEMANA = 6
FAMILIAS_POR_TURNO = 3  # rodar tb com 4
ALVO_PRIORITARIO = "score >= 8"  # bucket alto + urgente
N_SEMANAS_SIM = 12
```

**Algoritmo (greedy por equipe):**
1. Para cada ACS, identificar equipe (via visitas históricas).
2. Distribuir as famílias prioritárias da equipe entre os ACS daquela equipe, ranqueadas por score.
3. Cada ACS cobre `TURNOS_VISITA_SEMANA × FAMILIAS_POR_TURNO` famílias/semana.
4. Família "coberta" = pelo menos 1 visita feita na semana.
5. Simular 12 semanas. Registrar cobertura cumulativa.

**Cenário alternativo:** rodar a simulação reservando 1 turno/semana exclusivo pra prioritários (vs distribuído).

**Output: `docs/outputs/simulacao_cobertura.csv`**

Colunas: `semana`, `cenario` (baseline/turno_reservado), `n_familias_cobertas`, `pct_cobertura`, `n_acs_sobrecarregados` (>capacidade), `n_acs_ociosos` (<50% da capacidade).

**Análises pro doc:**
- Tabela: semanas pra 100% cobertura, % cobertura em sem 1/2/4/8.
- Quantos ACS sobrecarregados/ociosos no baseline.
- Comparação cenários.
- Insight: a capacidade casa com a demanda? Onde estoura?

### Capítulo no doc
**Capítulo 13 — Simulação de cobertura.** Tabela + narrativa.

---

## 6. Frente 4 — Heatmap geográfico (Folium standalone)

### Objetivo
Visualizar geograficamente as concentrações de urgência (4 equipes hotspot, célula de 220 urgências em 100m). Servir de prova visual no pitch e base pra overlay futuro de microáreas.

**Diferença vs heatmap do MVP:** o MVP TS já tem `frontend/components/heatmap-map.tsx` (Leaflet dentro do Next, commit `fd25406`). Este aqui é diferente: **artefato standalone** em HTML autocontido, com mais camadas (incluindo "nunca visitados"), pensado para o doc final / anexo de pitch / inspeção offline — não para rodar dentro do app. Implementações independentes; o trilho Python não toca em `src/frontend/`.

### Script: `scripts/heatmap_geografico.py`

**Stack:**
- `folium` (Leaflet em Python) — gera HTML standalone.
- Base tile: **CartoDB Positron** (free, sem cadastro, visual clean parecido com Google Maps).
  - **Por que não Google Maps:** tiles oficiais exigem billing habilitado mesmo no tier gratuito. Fora do escopo "tudo free" do hackathon.
  - **Por que não Mapbox:** free tier exige cartão.
  - Folium suporta troca de tile depois sem refatoração.
- ORS API só usada se quisermos plotar isochrones depois (não nesta rodada).

**Camadas (todas com toggle on/off via `folium.LayerControl`):**
1. **Heatmap de urgências**: `folium.plugins.HeatMap` com lat/lng dos eventos `urgencia-emergencia-ou-internacao`.
2. **Marcadores das equipes hotspot** (>1.5σ): círculos vermelhos com popup mostrando taxa de urgência.
3. **Marcadores das 9 unidades de saúde** (sedes agregadas): pins azuis.
4. **Heatmap de pacientes nunca visitados** (camada opcional, off por default — densidade complementar).
5. **Overlay de microáreas (GeoJSON)** — ver próxima seção.

**Centro do mapa:** centroide das equipes (~Rio de Janeiro centro).
**Zoom inicial:** 12.

**Output: `docs/outputs/heatmap_urgencias.html`** (vai pro git, autocontido, abre direto no browser).

### 6.1 Overlay GeoJSON de microáreas (implementado agora com graceful skip)

Função no script: `add_microareas_overlay(folium_map, geojson_path)`.

**Comportamento:**
- Lê o arquivo em `_inbox/data/microareas.geojson` (caminho fixo).
- Se o arquivo **não existir**, imprime aviso amigável no stdout e segue sem erro (o mapa ainda funciona com as 4 camadas existentes).
- Se existir, adiciona como `folium.GeoJson` layer com:
  - Estilo: borda azul institucional do brandbook (`#004a80`), preenchimento transparente.
  - Tooltip ao passar mouse: mostra `equipe_id`, `acs_id` (se presentes nos atributos).
  - Popup ao clicar: detalhes da microárea.

**Formato esperado do GeoJSON** (documentado no script):
```geojson
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "equipe_id": "...", "acs_id": "...", "microarea_nome": "..." },
      "geometry": { "type": "Polygon", "coordinates": [...] }
    }
  ]
}
```

**TODO documentado no script (comentário no topo):**
```python
# TODO (quando arquivo de microáreas chegar):
#   1. Salvar GeoJSON oficial em _inbox/data/microareas.geojson
#   2. Re-rodar este script — o overlay será carregado automaticamente
#   3. (Opcional, futuro) Cruzar pacientes/famílias com polígono para atribuir microárea oficial
#      (em vez do proxy "equipe_id majoritária" usado hoje na Frente 1)
```

### Capítulo no doc
**Capítulo 14 — Geografia das urgências.** Screenshot (PNG) + link pro HTML + descrição das camadas + TODO sobre microáreas.

---

## 7. Frente 5 — Análise de fantasmas (relatório honesto)

### Objetivo
Identificar alvos prioritários entre os 42.068 pacientes fantasma, sem fazer afirmações fortes sobre "família real" — o Peter explicitamente sinalizou baixa confiança nessa inferência.

### Script: `scripts/analise_fantasmas.py`

**Estrutura do relatório (3 níveis de confiança):**

#### Nível FIRME — pacientes fantasma individuais
- Reaproveita números já conhecidos: 11.564 idosos fantasmas, 4.445 hipertensos fantasmas, 2.219 vulneráveis fantasmas.
- Cross-tab por equipe: quais equipes têm mais fantasmas?
- Quem mora a <500m da sede da equipe? (Esses são fáceis de visitar e estranho terem zero touchpoints.)

#### Nível RAZOÁVEL — endereços com fantasmas
- Agregação por `(round(lat, 4), round(lng, 4))` ≈ ~11m.
- Categorias:
  - **Endereço só-fantasma:** todos no endereço sem visita E sem evento (totalmente invisível).
  - **Endereço misto:** pelo menos 1 visitado + pelo menos 1 fantasma. **Alvo natural:** o ACS já vai naquela porta.
- Distribuição: quantos endereços em cada categoria.
- Top 100 endereços mistos por # de fantasmas (alvos pro ACS).

#### Nível ESPECULATIVO — famílias com fantasmas (sensibilidade)
- Roda em 3 grids (30m / 50m / 100m), filtro [2-8].
- Para cada grid, calcula: % famílias com ≥1 fantasma, # absoluto, tamanho médio dessas famílias.
- Mostra **explicitamente a variância** dos números entre os grids (se varia muito → frágil; se converge → mais confiável).
- Lista 50 "famílias mais conservadoras" como subset de alta confiança, com critério acumulado:
  - Grid 30m
  - 2-4 membros
  - Todos os membros do cluster compartilham o **mesmo endereço exato** (mesmo `(round(lat,5), round(lng,5))` ≈ ~1m) — não só a mesma célula 30m
  - Pelo menos 1 paciente do cluster já visitado (confirma que o endereço é "real" do ponto de vista do ACS)

**Output: `docs/outputs/fantasmas_enderecos.parquet`**

Colunas: `lat_round`, `lng_round`, `n_pacientes`, `n_fantasmas`, `n_visitados`, `categoria` (so_fantasma/misto/so_visitado), `equipe_id_majoritaria`.

**Análises pro doc:**
- Tabela de 3 níveis com diferenciação clara de confiança.
- Recomendação: usar os endereços mistos (nível RAZOÁVEL) como entrada para reunião semanal.

### Capítulo no doc
**Capítulo 15 — Análise de fantasmas (relatório por confiança).** Estrutura explícita FIRME/RAZOÁVEL/ESPECULATIVO.

---

## 8. Atualização do documento principal

### `docs/analise-completa-dataset-saude.md` — mudanças

**Mantém intacto:** capítulos 1-9 e apêndice (numerar como 16).

**Reescreve capítulo 10:** vira "Sumário das frentes investigatórias executadas" — uma página com links para os 5 capítulos novos.

**Adiciona capítulos 11-15:**
- 11. Famílias recalibradas (grid 30m)
- 12. Score de risco composto
- 13. Simulação de cobertura
- 14. Geografia das urgências
- 15. Análise de fantasmas

**Atualiza apêndice:** adiciona os 5 scripts novos.

---

## 9. Plano de execução (ordem)

Ordem fixa porque há dependências entre frentes:

1. **Frente 1** primeiro — Frente 2 e 5 consomem o output de famílias.
2. **Frente 2** depois — Frente 3 consome o score.
3. **Frentes 3, 4, 5** em paralelo (independentes entre si).
4. **Doc principal** por último — consolida tudo.

---

## 10. Pontos de atenção / trade-offs aceitos

- **Folium com base OSM** em vez de Google Maps: sem custo, sem API key, e o folium suporta troca de tile depois.
- **Score aditivo** em vez de modelo estatístico: auditável no pitch, fácil de explicar pesos. Trade-off conhecido.
- **Simulação greedy** ignora geografia intra-microárea: aceitável pro hackathon.
- **Frente 5** entrega relatório por confiança em vez de afirmações fortes: alinhado com o ceticismo do Peter.
- **Sem testes unitários nos scripts** (são EDA, não código de produção). Verificação manual pelos números no stdout.

---

## 11. Critérios de pronto (Definition of Done)

Para cada frente:
- [ ] Script roda end-to-end sem erro com `.venv/bin/python scripts/<nome>.py`
- [ ] Outputs gerados em `docs/outputs/`
- [ ] Seção nova no `analise-completa-dataset-saude.md`
- [ ] Números do stdout batem com o que está no doc

Global:
- [ ] `requirements.txt` atualizado
- [ ] `.env.example` atualizado com `ORS_API_KEY` placeholder
- [ ] `docs/outputs/heatmap_urgencias.html` abre num browser e mostra as 3 camadas

---

*Spec gerada via brainstorming skill, baseada nas respostas do Peter em 2026-05-24.*

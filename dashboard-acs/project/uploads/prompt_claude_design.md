# Prompt — Painel Gestor ACS Inteligente · SMS Rio

## Contexto do produto

Estou construindo um painel de gestão para a Secretaria Municipal de Saúde do Rio de Janeiro (SMS Rio). O painel é usado por **gestores de Área Programática** para monitorar e priorizar o trabalho de **6.200 Agentes Comunitários de Saúde (ACS)** que cobrem 4,5 milhões de residentes.

O objetivo do painel é responder duas perguntas por turno:
1. **O que não pode esperar até amanhã?** (alertas e pacientes críticos sem agenda)
2. **Onde estou perdendo cobertura?** (equipes e perfis fora da régua)

---

## Design System — SMS Rio

**Cores:**
- Primary (header, navbar): `#004a80`
- Secundário (títulos de seção): `#00508a`
- CTA (botões): `#1863dc`
- Acento verde (links, sucesso): `#0bb975`
- Fundo da página: `#f5f7fa`
- Superfície card: `#ffffff`
- Texto principal: `#181818`
- Texto corpo: `#333333`
- Muted/caption: `#6b6b6b`
- Borda: `#cac7c7`

**Bandas de risco (score 0–100):**
- CRÍTICO ≥ 80 → `#dc3545` (vermelho)
- URGENTE 50–79 → `#fd7e14` (laranja)
- ATENÇÃO 20–49 → `#ffc107` (amarelo)
- ROTINA < 20 → `#28a745` (verde)

**Tipografia:** IBM Plex Sans (headlines bold, corpo regular). Monospace para IDs de paciente/equipe.

**Visual:** Institucional, denso em informação. Cards brancos com sombra azulada suave (`0 4px 12px rgba(0,74,128,0.15)`). Bordas finas. Sem gradientes decorativos. Header sempre `#004a80` com texto branco.

**Componentes:**
- `StatTile`: número grande + label + sublabel, com cor de banda de risco
- `BandPill`: chip colorido com score (ex: chip vermelho "85 CRÍTICO")
- `CoverageBar`: barra de progresso com linha de meta em 80%
- `FilterBar`: campo de busca + selects encadeados
- Tabela com coluna de sparkline (5 semanas)

---

## Estrutura do painel — 5 abas

### ABA 1 — Visão Geral
> Briefing executivo: o que está acontecendo na AP agora

**Linha de KPIs (4 StatTiles):**
- `97.938` · Pacientes cadastrados · AP 3.1
- `26.164` · Alto risco · gestantes, crônicos, idosos (laranja)
- `604` · Críticos sem agenda · score ≥ 80 (vermelho)
- `82` · Alertas ativos · aguardam ação (vermelho)

**2 cards — linha do meio:**
- **Cobertura esta semana**: CoverageBar em 68%, meta tracejada em 80%. Texto: "Diferença = 3.140 pacientes críticos sem visita esta semana."
- **Pacientes invisíveis**: 3 números empilhados:
  - `790` · Crise sem vínculo · 3+ urgências, 0 visitas (vermelho)
  - `6.744` · Alto risco sem contato (laranja)
  - `42.000` · Sem condição especial (cinza)

**2 cards — linha inferior:**
- **Agir hoje** (alertas por tipo, com dot colorido):
  - 47 · Urgência recente sem visita (vermelho)
  - 23 · Espiral de crises ativa (laranja)
  - 12 · Gestante sem visita há 30+ dias (amarelo)
  - 7 · Alertas não alocados · capacidade atingida (cinza)
- **Tendência mensal** (barras verticais Jan–Mai): 54% / 58% / 61% / 65% / 68%

---

### ABA 2 — Equipes
> Onde intervir: ranking das 49 equipes por pressão

**Select de ordenação** (topo direito): Score de pressão / % sem visita / % urgência

**Tabela ranqueada** — colunas:
`Equipe (código + nome CF)` | `Pacientes` | `% Risco` | `% Sem visita` | `% Urgência` | `Score` (chip colorido) | `Tendência ↑↓` | `5 semanas (sparkline)`

Exemplos de linhas:
| Equipe | Pacs | %Risco | %Sem visita | %Urg | Score |
|--------|------|--------|-------------|------|-------|
| #ba1cb3b7 · CF Maré | 2.001 | 38,1% | 41,3% | 18,4% | 47,2 🔴 |
| #7e4d858c · CF Manguinhos | 1.844 | 35,2% | 38,7% | 17,1% | 44,8 🔴 |
| #3f9a12cd · CF Penha | 1.623 | 31,4% | 34,2% | 14,3% | 41,3 🟡 |
| #c8e201fa · CF Caju | 1.412 | 22,1% | 28,4% | 11,2% | 36,1 🟢 |

**2 cards abaixo da tabela:**
- **Drilldown — CF Maré**: 4 mini-stats (5 ACS / 23 visitas hoje / 14 alertas / 47 invisíveis cat.1) + histograma horizontal por banda (Crítico 184 · Urgente 422 · Atenção 731 · Rotina 660)
- **Composição clínica**: lista com dot colorido: Hipertensos 421 (21%) / Diabéticos 278 (14%) / Gestantes 34 (1,7%) / Crianças 0-6 312 (15,6%) / Idosos 66+ 388 (19,4%) / Vulneráveis 602 (30,1%)

---

### ABA 3 — Visitas
> Cobertura real: quem está sendo visitado e quem não está

**3 StatTiles:**
- `159.599` · Visitas registradas · histórico total
- `68%` · Cobertura da régua · visitas realizadas vs esperadas
- `32.400` · Pacientes sem visita · nunca foram visitados (vermelho)

**Card largo — Déficit por perfil clínico** (tabela):

| Perfil | Régua (vis/ano) | Realizadas | Déficit | % Cumprimento |
|--------|----------------|------------|---------|---------------|
| Criança 0-6 | 7 | 4,2 | 2,8 | 60% 🔴 |
| Gestante | 6 | 4,8 | 1,2 | 80% 🟡 |
| Hipertenso | 4 | 2,9 | 1,1 | 72% 🟡 |
| Diabético | 4 | 3,1 | 0,9 | 78% 🟡 |
| Idoso 66+ | 4 | 2,4 | 1,6 | 60% 🔴 |
| Outros | 2 | 1,7 | 0,3 | 85% 🟢 |

Colorir % cumprimento: vermelho <60%, amarelo 60-80%, verde >80%.

**2 cards:**
- **Produtividade por ACS**: barras horizontais com 8 profissionais (ID abreviado), visitas na semana, ordenado do maior pro menor
- **Cadência de visitas**: barras verticais com distribuição do intervalo entre visitas — <15d / 15-30d / 30-60d / 60-90d / >90d

---

### ABA 4 — Pacientes
> Quem priorizar: lista filtrável de todos os pacientes

**FilterBar**: busca por ID/perfil/equipe + 4 selects:
- Prioridade: todas / crítico / urgente / atenção
- Condição: todas / gestante / hipertenso / diabético / criança 0-6 / idoso 66+
- Equipe: todas / [lista de equipes]
- Status: todos / na agenda / sem agendamento / 1º contato pendente

**Tabela** — colunas:
`ID` (monospace) | `Perfil clínico` | `Dias sem visita` | `Urgências/ano` | `Score` (BandPill) | `Equipe` | `Status` | `Ação`

Exemplos (8 linhas):
- 3 linhas CRÍTICO vermelho: score 80+, status "⚠ Sem agendamento", dias sem visita 60-120
- 3 linhas URGENTE laranja: score 50-79
- 2 linhas ATENÇÃO amarelo: score 20-49, status "✓ Na agenda"

Status usa ícones: ✓ verde / ⚠ laranja / ★ azul

Rodapé: "Exibindo 8 de 97.938 pacientes"

---

### ABA 5 — Eventos
> Padrão de deterioração: urgências, espiral e correlação com visitas

**3 StatTiles:**
- `100.503` · Eventos registrados · urgências + agendamentos
- `47.821` · Urgências no período · 48% do total (laranja)
- `790` · Espiral de crises · 3+ urgências, 0 visitas ACS (vermelho)

**2 cards:**
- **Sazonalidade mensal**: gráfico de linha dupla Jan–Dez — linha vermelha (urgências, pico ~5.800 em jul/ago) + linha azul (agendamentos, mais estável ~4.200). Valores de exemplo realistas.
- **Urgência precedida de visita?**: donut chart — 34% sim (verde `#0bb975`) / 66% não (vermelho `#dc3545`). Legenda: "66% das crises ocorreram sem contato ACS nos 30 dias anteriores."

**Card largo — Espiral de crises** (tabela):

| ID | Perfil | Urgências/ano | Última urgência | Visitado antes? | Equipe |
|----|--------|--------------|----------------|----------------|--------|
| #b9c2e041 | Hiper + Diabético | 5 | há 8 dias | ✗ | CF Maré |
| #q105ff20 | Idoso 66+ · Hipertenso | 4 | há 12 dias | ✗ | CF Manguinhos |
| #d3a771bc | Gestante · Vulnerável | 4 | há 3 dias | ✓ | CF Penha |

---

## Instrução final

Monte as 5 telas acima como um painel de gestão desktop, respeitando rigorosamente o design system SMS Rio descrito. Cada tela deve ter:
- Header fixo azul `#004a80` com navegação em abas (aba ativa destacada)
- Fundo de página `#f5f7fa`
- Cards brancos com sombra azulada suave
- Densidade de informação alta — este é um painel profissional, não um app consumer
- Tipografia IBM Plex Sans

Comece pela **Aba 1 — Visão Geral** e depois gere as demais em sequência.

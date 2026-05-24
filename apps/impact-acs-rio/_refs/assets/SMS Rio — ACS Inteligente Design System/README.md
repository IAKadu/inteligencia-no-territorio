# SMS Rio — Inteligência no Território · Design System

> Sistema de design para a plataforma **Inteligência no Território**, desenvolvida
> para a **Secretaria Municipal de Saúde da Prefeitura do Rio de Janeiro (SMS Rio)**.
> A plataforma reorganiza o trabalho dos Agentes Comunitários de Saúde
> (mais de 6.200 ACS, cobrindo 4,5 milhões de habitantes) com base em risco
> clínico real — emergências recentes, atrasos de visita, condições crônicas,
> gestação e vulnerabilidade.
>
> O design system suporta **duas superfícies**:
> - **App do ACS** (mobile-first) — agenda do dia, cards de paciente,
>   primeiro contato, alertas de deterioração.
> - **Painel do Gestor** (web-based, desktop/tablet) — visão estratégica:
>   KPIs da AP, ranking de equipes, mapa de cobertura, lista de críticos,
>   alertas não alocados.

---

## Context & sources

| Asset                             | Origem                                                            |
| --------------------------------- | ----------------------------------------------------------------- |
| `reference/brandbook-original.html` | BrandBook v1.0 — Mai 2026 (Hackathon Claude Impact Lab 2026)     |
| `reference/solucao_01_…` → `solucao_05_…` | Especificações funcionais das 5 soluções da plataforma     |
| `assets/logo-prefeitura-saude.png`  | Logo institucional Prefeitura RIO · Saúde                        |
| `fonts/Cera_Pro_*.otf`              | Família tipográfica oficial (licenciada, fornecida pelo cliente) |
| Palette                            | Extraída de `saude.prefeitura.rio` (site oficial da SMS)         |

As especificações das 5 soluções definem o domínio do produto:
1. **Score de Risco** — motor central (0–200), 4 dimensões clínicas.
2. **Roteiro Diário Otimizado** — agenda do ACS, ordenada por score + rota.
3. **Pacientes Invisíveis** — descoberta de quem nunca foi visitado.
4. **Painel do Gestor** — visão estratégica do território.
5. **Alertas de Deterioração** — resposta a eventos clínicos recentes.

---

## Index — what's in this folder

```
.
├── README.md                  ← this file
├── SKILL.md                   ← Agent-Skill manifest (cross-compatible w/ Claude Code)
├── colors_and_type.css        ← CSS custom-properties + @font-face + .t-* utilities
├── assets/
│   └── logo-prefeitura-saude.png
├── fonts/                     ← Cera Pro family (.otf)
├── reference/
│   ├── brandbook-original.html
│   └── solucao_0{1..5}_*.md   ← specs das 5 soluções da plataforma
├── preview/                   ← Design-System-tab cards (1 card per concept)
└── ui_kits/
    ├── acs-inteligente/       ← App do ACS (workspace mobile-friendly)
    │   ├── index.html         ← protótipo interativo (filtros + foco do paciente)
    │   ├── kit.css
    │   ├── Primitives.jsx     ← MainNav, Buttons, Pills, Tags, Search, Section heads
    │   ├── PatientCard.jsx
    │   └── Workspace.jsx      ← DayStrip, FiltersSidebar, TodayVisits, PatientFocus
    └── gestor-dashboard/      ← Painel do Gestor (web-based dashboard)
        ├── index.html         ← 5 abas interativas (Visão Geral · Equipes · Mapa · Críticos · Alertas)
        ├── kit.css
        ├── Primitives.jsx     ← TopBar, MainNav, BandPill, Sparkline, Trend, CoverageBar
        ├── Cards.jsx          ← StatTile, TeamRow, ScoreHistogram, AlertGroupList, UnallocatedAlert, TerritoryMap
        ├── Tabs.jsx           ← TabOverview, TabTeams, TabMap, TabPatients, TabAlerts
        └── SampleData.jsx     ← KPIs, equipes, pacientes, alertas (números das specs)
```

---

## Content fundamentals

A voz do produto é **institucional, factual e direta** — em português
brasileiro, registro formal mas acessível. Não há sarcasmo, ironia ou bordões.

**Pessoa:** prefere construções impessoais ("Confirmar visita", "Sem visita há
14 dias") sobre 1ª ou 2ª pessoa. Quando endereçando o ACS, usa **"você"** ("Sua
rota de hoje", "Suas visitas concluídas"), nunca "tu".

**Casing:**
- Títulos de seção e botões em **MAIÚSCULAS** com tracking aberto (`0.08em`).
- Cards e tiles também em maiúsculas com tracking aberto.
- Títulos editoriais (hero / H1 / H2) em **Title Case** ou frase normal,
  pesos 900.
- Corpo em frase natural.

**Tom — exemplos:**
- Título hero — _"Inteligência no Território"_
- Subtítulo — _"O ACS é o profissional responsável por fazer visitas não
  agendadas e acompanhar as famílias onde elas moram."_
- Card de alerta — _"Ida à urgência há 3 dias. Sem visita há 14 dias.
  Hipertensa."_ — telegráfico, sem adjetivos.
- CTA — _"Iniciar visita agora"_, _"Confirmar visita"_, _"Ver perfil"_ — sempre
  verbo + objeto, infinitivo.

**Emojis:** **Não usar emojis** em produção, mesmo que o brandbook original os
mostre nas tags. A iconografia deve resolver o mesmo papel visual.

**Vibe:** SUS digital de qualidade — instituição confiável, dados clínicos
sérios, sem decoração. Mais perto de um prontuário moderno do que de uma
fintech amigável.

---

## Visual foundations

### Cor
- **Centrada em azul institucional** (`#004a80`). Quase nada quebra esse azul
  como fundo principal — header, navbar, footer, cards de destaque.
- **Verde Rio (`#0bb975`)** marca sucesso e o detalhe do logo ("RIO" em
  destaque); é o único acento orgânico no sistema.
- **Cyan (`#00c0f4`)** = agendamentos / informativos.
- **Escala P1–P4** (red→orange→yellow→green) é exclusiva de prioridade
  clínica — nunca usar em outros contextos.
- Não há modo escuro definido.

### Tipografia
- Família única: **Cera Pro** (geométrica sans), shipping em Light/Medium/Bold/
  Black. Mono usa **JetBrains Mono** para IDs, hexes, horários.
- Escala discreta: 11 / 13 / 16 / 20 / 28 / 40 / 52.
- Pesos extremos — corpo em 500, títulos em **900 (Black)**, nada de "semibold".
- Títulos de seção sempre **uppercase** com `letter-spacing: 0.08em`.

### Layout
- Largura máxima de conteúdo: ~1200px, centralizada.
- Grid de 8pt (`--space-1` … `--space-9`).
- Layouts densos, **pouca respiração interna** em cards (padding 20–22px).
- Cards de serviço em **grid de 4 colunas** no desktop, 2 no tablet, 1 no mobile.

### Cards
- Fundo branco com borda 1px `#cac7c7`.
- Cantos `radius-md` (8px) — institucional, não friendly.
- **Borda esquerda colorida** (4px) codifica prioridade quando aplicável.
- Sombras tingidas de azul: `0 4px 12px rgba(0,74,128,.15)`, nunca cinza neutro.

### Borders & radii
- Tudo bem retangular — `radius-sm` (4px) para botões, inputs, cards de serviço.
- `radius-md` (8px) para cards "documentais" (paciente, info clínica).
- `radius-pill` (999px) só em badges e tags. Sem corners arredondados grandes.

### Backgrounds & imagery
- **Sem ilustrações decorativas**, sem patterns, sem texturas, sem grain.
- **Sem gradientes coloridos** — exceção: o gradient azul-escuro→azul-primário
  do "Day Strip" da workspace (`135deg, #003660, #004a80`).
- Quando houver fotografia (não há no escopo atual), esperar imagens
  documentais frias — equipes em campo, clínicas reais, sem filtros warm.
- **Sem full-bleed hero images.**

### Sombras
- `shadow-sm` para cards em repouso (subtle elevation).
- `shadow-md` em hover de cards interativos.
- `shadow-lg` reservada para o destaque principal da tela (Day Strip).
- Todas tingidas no azul institucional, **nunca** `rgba(0,0,0,…)` puro.

### Estados de interação
- **Hover botão primário:** escurece para `--blue-dark` (`#003660`).
- **Hover botão secundário:** preenche com `--blue-primary`, texto fica branco.
- **Hover card:** ganha `shadow-md`; o conteúdo não se move (sem `translateY`).
- **Hover link de nav (sobre azul):** opacidade 100% (vinha de 78%) + leve
  `background: rgba(255,255,255,.08)`.
- **Active filter na sidebar:** fundo `rgba(0,74,128,.08)`, texto vira azul.
- **Press:** não há _shrink_ ou _scale_ — apenas a transição de cor.
- **Disabled:** opacidade 0.45 + cursor `not-allowed`.

### Animação
- Transições rápidas e funcionais: `transition: … .15s` em hover de botões,
  cards, filtros. Nada de spring/bounce.
- **Sem entry animations** (sem fade-in na carga das telas).
- O único movimento "expressivo" é o `stroke-dasharray` do anel de progresso
  do Day Strip — visualização de dado, não decoração.

### Transparência & blur
- Transparência **só sobre o azul institucional** — `rgba(255,255,255,.14)`
  em badges sobre header, `rgba(255,255,255,.08)` em hover de nav.
- **Sem `backdrop-filter`** (sem glass).
- Em fundos brancos: zero transparência — usar cinzas sólidos.

### Iconografia (placeholder)
- Não vimos um icon-set oficial. Adotamos **Lucide** (CDN-available, mesmo
  stroke weight da iconografia que aparece no site SMS) como substituto.
- Documentado em `preview/brand-iconography.html` e na seção abaixo.

---

## Iconography

O site oficial da SMS usa um conjunto pequeno de glyphs line-art em peso de
traço médio (~1.75px @ 24px). **Não existe icon font oficial** distribuído
com o brandbook.

**Substituto adotado:** [Lucide](https://lucide.dev) — line icons SVG via CDN,
stroke 1.75, `currentColor`, `viewBox="0 0 24 24"`. Estilo coerente com o
visual SMS.

**Como usar:**
```html
<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="1.75"
     stroke-linecap="round" stroke-linejoin="round">
  <!-- path do Lucide -->
</svg>
```

**Em React:** carregar `lucide-react` (não incluído neste kit).

**Emojis:** o brandbook original mostra emojis dentro de tags clínicas
(💊 🩺 🤱 🚨). **Remover em produção** — usar Lucide (`pill`, `stethoscope`,
`baby`, `siren`) para manter consistência institucional.

**Logotipo:** `assets/logo-prefeitura-saude.png` (372×113, PNG transparente).
Deve aparecer **sobre fundo azul institucional `#004a80`** ou branco com
clear-space mínimo de 0.5× a altura do logo. Não recolorir, não dispor
inclinado, não usar sobre fotografias.

---

## UI Kits

- **`ui_kits/acs-inteligente/`** — **App do ACS**, mobile-friendly. Workspace
  com filtro por prioridade, rota do dia com progresso, lista de visitas, card
  de paciente com tags clínicas, e foco do paciente com resumo clínico e
  justificativa da priorização.

- **`ui_kits/gestor-dashboard/`** — **Painel do Gestor**, web-based. 5 abas
  navegáveis:
  - **Visão Geral** — 4 KPIs grandes (equipes, alto risco, abaixo da régua,
    crise sem vínculo), barra de cobertura, evolução mensal, painel de
    alertas, panel de invisíveis, qualidade de dados.
  - **Por Equipe** — tabela ranking das 49 equipes com score chip, trend
    arrow e sparkline de 5 semanas; drilldown com histograma de scores e
    composição clínica.
  - **Mapa de Cobertura** — bolhas territoriais coloridas por pressão
    (placeholder geográfico — substituir por mapa real em produção).
  - **Pacientes Críticos** — tabela consolidada da AP com filtros (prioridade,
    condição, equipe, status na agenda).
  - **Alertas** — categorias ativas, alertas por equipe (alocados vs total),
    e cards de ação para alertas não alocados.

### Padrões específicos do dashboard
- **Score chip** — caixa colorida sólida com o score numérico em mono. Cor
  segue as bandas (CRÍTICO ≥ 80 / URGENTE 50–79 / ATENÇÃO 20–49 / ROTINA < 20).
- **Sparkline de 5 semanas** — 120×36px, sem eixos, ponto final destacado.
  Cor do traço acompanha o band atual da equipe.
- **Trend arrow** — `▲ +1.2` (vermelho, piorando), `▼ -0.8` (verde, melhorando),
  `— 0.0` (cinza, estável). _Subir = ruim_, _descer = bom_ (score é pressão).
- **CoverageBar** — barra única com gradient `#1863dc → #0bb975`, sempre
  acompanhada do número grande em 900.
- **StatTile** — fundo branco, borda esquerda 3px na cor da band; valor em
  28–36px Black, label em 13px Bold, sub em 11px regular cinza.
- **DataQuality panel** — fundo `rgba(255,193,7,.08)` com borda âmbar fraca;
  reservado a sinais de qualidade de cadastro (não confundir com alerta clínico).

---

## Substitutions & flags

1. **Sem `Cera Pro Regular` (400)** entre os arquivos enviados — usamos `Medium`
   (500) como stand-in. _Pedir ao licenciador o arquivo Regular se houver._
2. **Iconografia institucional não fornecida** — usamos Lucide como substituto.
   _Anexar SVGs/PNGs da SMS para refinar._
3. **Sem fotografia / imagens reais** disponíveis. Os mockups omitem hero
   imagery. _Anexar fotos de campo / clínicas se quiser estender o sistema._
4. **Sem codebase do produto ACS Inteligente** — UI kit recriado a partir do
   brandbook. Importar o repositório real para alinhar com componentes em uso.

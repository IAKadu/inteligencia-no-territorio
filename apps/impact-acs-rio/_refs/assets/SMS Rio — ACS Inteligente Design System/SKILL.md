---
name: sms-rio-inteligencia-no-territorio-design
description: Use this skill to generate well-branded interfaces and assets for SMS Rio · Inteligência no Território (Secretaria Municipal de Saúde da Prefeitura do Rio de Janeiro). The platform has TWO surfaces — a mobile-friendly ACS app and a web-based Gestor dashboard. Contains essential design guidelines, colors, typography (Cera Pro), fonts, logos, and UI kit components for prototyping either surface.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy
assets out and create static HTML files for the user to view. If working on
production code, you can copy assets and read the rules here to become an
expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they
want to build or design, ask some questions, and act as an expert designer
who outputs HTML artifacts _or_ production code, depending on the need.

## Where things live

- `README.md` — full brand bible: content fundamentals, visual foundations,
  iconography, substitutions & flags. Start here.
- `colors_and_type.css` — drop-in tokens (CSS custom properties) + `@font-face`
  declarations for Cera Pro + semantic type utilities (`.t-hero`, `.t-h1`, …).
  Link this file from any new HTML you create and you get the system for free.
- `fonts/` — Cera Pro `.otf` files. Keep these next to any HTML that references
  the tokens; the `@font-face` paths are relative.
- `assets/logo-prefeitura-saude.png` — institutional logo. Use on `#004a80`.
- `preview/` — small example cards showing one concept each (color groups,
  type specimens, components). Useful as visual references.
- `ui_kits/acs-inteligente/` — **App do ACS** (mobile-friendly). Full
  interactive workspace prototype + React primitives (`MainNav`, `PatientCard`,
  `PriorityPill`, `ClinicalTag`, `Button`, `DayStrip`).
- `ui_kits/gestor-dashboard/` — **Painel do Gestor** (web-based dashboard).
  5 tabs (Visão Geral, Por Equipe, Mapa, Pacientes Críticos, Alertas), with
  `StatTile`, `TeamRow` + sparkline, `ScoreHistogram`, `AlertGroupList`,
  `UnallocatedAlert`, `TerritoryMap`, `BandPill`, `Trend`, `CoverageBar`.
- `reference/brandbook-original.html` — the source brandbook from the client.
- `reference/solucao_0{1..5}_*.md` — product specs for the 5 solutions of
  the platform: Score de Risco, Roteiro Diário, Invisíveis, Painel do Gestor,
  Alertas de Deterioração. Read these to learn the domain language.

## Core rules to remember

- Single typeface: **Cera Pro**, weights 300/500/700/900. Body is 500 (no
  Regular file shipped).
- Institutional palette is **blue-first** (`#004a80`). Verde Rio (`#0bb975`)
  for success/links on dark. **Clinical priority bands** (CRÍTICO ≥ 80 → red,
  URGENTE 50–79 → orange, ATENÇÃO 20–49 → yellow, ROTINA < 20 → green) are
  the score-driven color contract used by both surfaces.
- No gradients beyond the dark-blue → blue Day Strip and the blue→green
  CoverageBar fill. No glass / backdrop blur. **No emojis** (the brandbook
  shows some — strip in production). No decorative illustrations.
- Section titles + buttons are **UPPERCASE with `letter-spacing: 0.08em`**.
- Cards: white bg, 8px radius, blue-tinted shadow, optional 4px left border in
  the priority color.
- Trend convention: **score subir = piorar** (vermelho); descer = melhorar
  (verde). Don't flip the colors.
- Iconography: Lucide as substitute (stroke 1.75, currentColor). The brandbook
  emojis are placeholders — substitute with Lucide line icons.

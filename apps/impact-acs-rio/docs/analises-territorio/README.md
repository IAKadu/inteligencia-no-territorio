# Análises do território — material do dev parceiro

Conjunto de 15 documentos de análise do dataset SMS Rio, produzidos pelo dev parceiro no repo externo `/Users/peterflag/Documents/Projects/inteligencia-no-territorio/`.

Esses documentos são a **base de conhecimento** que fundamenta o produto: explicam o problema em números, validam a régua de visitas, descrevem as 5 soluções propostas e a arquitetura de referência. Servem como:

- Insumo para o `system prompt` do chat IA (achados quantitativos viram contexto que o Claude usa nas respostas).
- Justificativa do impacto no pitch / submissão.
- Base para calibração do score, da régua de visitas e da detecção de invisíveis no backend.

## Origem

- Fonte: `inteligencia-no-territorio/analises/` (repo externo do parceiro, read-only — ver regra em [`/CLAUDE.md`](../../CLAUDE.md)).
- Importado em: 2026-05-24 (Fase 1 do plano de integração).
- Atualização: se o dev refazer as análises, rodar `git pull` no repo externo e re-copiar manualmente os arquivos alterados.

## Índice

| Arquivo | Conteúdo |
|---|---|
| [00_sumario_executivo.md](00_sumario_executivo.md) | Visão geral dos achados (50% sem visita, 75,9% abaixo da régua, etc) |
| [01_visao_geral_dados.md](01_visao_geral_dados.md) | Schema, volumes, qualidade dos 4 Parquets |
| [02_lacunas_regua_visitas.md](02_lacunas_regua_visitas.md) | Déficit por grupo de risco (idosos, crianças 0-6, hipertensos) |
| [03_correlacao_urgencia_visita.md](03_correlacao_urgencia_visita.md) | Como ACS já prioriza intuitivamente — mas tarde demais |
| [04_capacidade_acs.md](04_capacidade_acs.md) | Capacidade real por turno (5–7 visitas) e padrão de registro em papel |
| [05_distribuicao_geografica.md](05_distribuicao_geografica.md) | Score de pressão por equipe (variação 29,2 a 45,3) |
| [06_sugestoes_de_solucao.md](06_sugestoes_de_solucao.md) | 5 soluções propostas |
| [07_arquitetura_e_stack.md](07_arquitetura_e_stack.md) | Stack de referência do dev (Python/FastAPI/DuckDB) — **não é a nossa stack** |
| [08_fases_e_escopo.md](08_fases_e_escopo.md) | Roadmap em fases proposto pelo dev |
| [solucao_01_score_de_risco.md](solucao_01_score_de_risco.md) | Detalhe da solução: score composto |
| [solucao_02_roteiro_diario.md](solucao_02_roteiro_diario.md) | Detalhe: roteirização por proximidade |
| [solucao_03_pacientes_invisiveis.md](solucao_03_pacientes_invisiveis.md) | Detalhe: 3 categorias de invisíveis |
| [solucao_04_painel_gestor.md](solucao_04_painel_gestor.md) | Detalhe: painel de pressão por equipe |
| [solucao_05_alertas_deterioracao.md](solucao_05_alertas_deterioracao.md) | Detalhe: alertas preditivos |

## O que é referência vs. o que vai ser implementado aqui

- **Conteúdo de domínio** (achados, régua, categorias de invisíveis, pesos de score) → portar para o Impact.
- **Stack técnica descrita em `07_arquitetura_e_stack.md`** (FastAPI/DuckDB/HTML estático) → **não é a stack do Impact**. Aqui usamos Node/Hono + Supabase Postgres + Next.js + Cera Pro. Ler como referência conceitual, reimplementar no nosso padrão.

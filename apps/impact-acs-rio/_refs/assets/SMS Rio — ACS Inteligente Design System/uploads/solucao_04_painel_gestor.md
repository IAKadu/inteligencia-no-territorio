# Solução 4 — Painel do Gestor por Equipe

**Papel na plataforma:** visibilidade estratégica. O gestor enxerga o que o ACS não pode ver — o território inteiro, todas as equipes, tendências ao longo do tempo.

---

## O que é

Um painel analítico para coordenadores de unidade e gestores de área programática acompanharem em tempo real a cobertura de visitas, o risco acumulado por equipe e os pacientes que estão sendo sistematicamente negligenciados. É a visão de cima da mesma plataforma que o ACS usa no campo.

O gestor não define a agenda individual — isso é papel do sistema. O gestor identifica onde o sistema está falhando e age no nível de equipe ou de protocolo.

---

## Usuários e contexto de uso

| Perfil | Como usa |
|---|---|
| Coordenador da clínica da família | Monitora as 5–8 equipes da sua unidade diariamente |
| Gestor de Área Programática (AP) | Monitora dezenas de equipes semanalmente |
| Equipe de dados da SMS | Avalia efetividade do modelo e ajusta parâmetros |

O painel é acessado via navegador desktop ou tablet — não é mobile-first como a interface do ACS.

---

## Estrutura do painel

O painel tem quatro seções, acessíveis por abas:

### Aba 1 — Visão Geral (home)

Tela inicial com os números mais importantes da unidade/AP:

```
┌─────────────────────────────────────────────────────────────────┐
│  Inteligência no Território — Visão Geral                       │
│  Área Programática X · Semana 21/2025                          │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│   49         │   26.164     │   74.303     │      790          │
│  Equipes     │ Alto risco   │ Abaixo da    │  Crise sem        │
│  ativas      │ cadastradas  │ régua        │  vínculo          │
├──────────────┴──────────────┴──────────────┴───────────────────┤
│                                                                  │
│  Cobertura esta semana                                          │
│  ████████████████████░░░░░░  68% dos pacientes de alta prioridade│
│                                                                  │
│  Evolução mensal (%):                                           │
│  Jan  Fev  Mar  Abr  Mai                                        │
│  ██   ██   ██   ██   ███                                        │
│  61%  63%  65%  61%  68%                                        │
│                                                                  │
│  [Ver por equipe →]   [Ver invisíveis →]   [Exportar →]        │
└─────────────────────────────────────────────────────────────────┘
```

---

### Aba 2 — Por Equipe

Tabela comparativa de todas as equipes com ordenação pelo score de pressão:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Ranking de equipes por score de pressão                                 │
│  [Filtrar por: ▼ Todas]  [Ordenar por: ▼ Score pressão]                 │
├──────────┬───────┬─────────┬──────────┬───────────┬────────┬────────────┤
│ Equipe   │ Pacs  │ %Risco  │ %SemVis  │ %Urgência │ Score  │ Tendência  │
├──────────┼───────┼─────────┼──────────┼───────────┼────────┼────────────┤
│ ba1cb3b7 │ 1.997 │ 39,6%   │ 58,4%    │ 30,4%     │  45,3  │ ↑ +1,2    │
│ 8c7e94fb │ 1.998 │ 41,9%   │ 55,1%    │ 19,3%     │  42,7  │ → 0,0     │
│ 7e4d858c │ 1.998 │ 56,0%   │ 41,1%    │ 17,0%     │  42,3  │ ↓ -0,8    │
│ ...      │ ...   │ ...     │ ...      │ ...       │  ...   │ ...       │
└──────────┴───────┴─────────┴──────────┴───────────┴────────┴────────────┘
```

A coluna "Tendência" mostra se o score de pressão da equipe está subindo ou caindo em relação à semana anterior. Score subindo = situação piorando; descendo = melhorando.

**Drilldown por equipe:** ao clicar em uma equipe, o gestor vê:
- Quantos ACS ativos registraram visitas esta semana
- Distribuição de scores dos pacientes (histograma)
- Pacientes críticos ainda não visitados
- Alertas de urgência recente pendentes

---

### Aba 3 — Mapa de Cobertura

Visualização geográfica das 49 equipes por intensidade de pressão:

```
┌─────────────────────────────────────────┐
│  [MAPA DO TERRITÓRIO]                   │
│                                         │
│   • = equipe com score < 35  (verde)   │
│   • = equipe com score 35-42 (amarelo)  │
│   • = equipe com score > 42  (vermelho) │
│                                         │
│  ●●●                                   │
│  ●  ●●                                 │
│    ●●                                  │
│  ●    ●                                │
│   ●●●                                  │
│                                         │
│  [Filtros: ▼ Condição  ▼ Faixa etária] │
└─────────────────────────────────────────┘
```

O gestor pode filtrar o mapa por condição (mostrar só equipes com alta concentração de diabéticos, por exemplo) para identificar necessidades de campanha ou apoio específico.

---

### Aba 4 — Pacientes Críticos

Lista consolidada dos pacientes mais críticos de toda a AP, independentemente da equipe:

```
┌────────────────────────────────────────────────────────────────────┐
│  Pacientes críticos — toda a Área Programática                    │
│  [Filtrar: ▼ Prioridade  ▼ Condição  ▼ Equipe  ▼ Status agenda]  │
├──────────┬──────────────┬───────────┬────────┬────────────────────┤
│ ID       │ Perfil       │ Urgências │ Score  │ Status             │
├──────────┼──────────────┼───────────┼────────┼────────────────────┤
│ abc...   │ Gest. Hiper  │ 1 (30d)   │   94  │ ✓ Na agenda hoje  │
│ def...   │ Hiper + DB   │ 4 (ano)   │   87  │ ⚠ Sem agendamento │
│ ghi...   │ Criança 0-6  │ 0         │   83  │ ✓ Na agenda hoje  │
│ jkl...   │ Idoso 66+    │ 6 (ano)   │   79  │ ★ 1º contato pend.│
│ ...      │ ...          │ ...       │  ...   │ ...               │
└──────────┴──────────────┴───────────┴────────┴────────────────────┘

★ = Primeiro contato pendente (nunca foi visitado)
⚠ = Crítico sem data de visita agendada
✓ = Já está na agenda de algum ACS
```

O gestor pode filtrar por "⚠ Sem agendamento" para identificar pacientes críticos que ainda não foram alocados na agenda de nenhum ACS — e agir manualmente se necessário.

---

### Indicadores de qualidade dos dados

Uma seção no painel exibe problemas de qualidade detectados:

```
┌─────────────────────────────────────────┐
│  ⚠ Alertas de qualidade de dados       │
├─────────────────────────────────────────┤
│  23 endereços não localizados           │
│    (ACS reportaram "não encontrei")     │
│                                         │
│  47 pacientes marcados como             │
│    "não mora mais aqui"                 │
│                                         │
│  138 pacientes sem equipe vinculada     │
│                                         │
│  [Encaminhar para revisão de cadastro] │
└─────────────────────────────────────────┘
```

Esses problemas são detectados automaticamente a partir dos registros de visita dos ACS (Solução 2) e alimentam a qualidade dos dados ao longo do tempo.

---

## Métricas acompanhadas pelo gestor

| Métrica | Fonte | Meta sugerida |
|---|---|---|
| % pacientes de alta prioridade com visita na semana | visitas + score | > 80% |
| % gestantes com visita em dia (régua) | visitas + pacientes | > 90% |
| % crianças 0-6 com visita em dia | visitas + pacientes | > 85% |
| Número de invisíveis críticos (cat. 1) | score + visitas | → 0 |
| Score médio de pressão das equipes | score por equipe | → redução semanal |
| Pacientes com 2+ urgências sem visita recente | eventos + visitas | → 0 |

---

## Integração com as outras soluções

| Entrada | Vem de |
|---|---|
| Score por equipe | Solução 1 (Score de Risco) |
| Agenda e registros de visita | Solução 2 (Roteiro Diário) |
| Contagem de invisíveis | Solução 3 (Invisíveis) |
| Alertas urgência pendentes | Solução 5 (Alertas) |

| Saída | Vai para |
|---|---|
| Ajuste de pesos da régua | Atualiza `regua_visitas.yaml` (Solução 1) |
| Redistribuição de capacidade | Ajusta capacidade por equipe (Solução 2) |
| Revisão de cadastros inválidos | Qualidade dos dados |

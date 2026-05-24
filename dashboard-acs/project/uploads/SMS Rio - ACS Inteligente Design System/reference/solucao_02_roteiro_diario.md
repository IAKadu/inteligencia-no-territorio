# Solução 2 — Roteiro Diário Otimizado para o ACS

**Papel na plataforma:** entrega operacional. Transforma o score em ação — uma lista ordenada geograficamente que o ACS executa em campo.

---

## O que é

Uma agenda diária gerada automaticamente para cada ACS, contendo os pacientes mais prioritários do seu território, ordenados pela rota mais eficiente a partir da sede da equipe. Cada item da agenda vem com o motivo da visita em linguagem natural, gerado pelo Claude.

O ACS abre o aplicativo de manhã e encontra a lista pronta. Sem decisão, sem memória, sem papel.

---

## Como funciona

O roteiro passa por quatro etapas em sequência:

### Etapa 1 — Seleção dos candidatos

A partir da lista de pacientes com score calculado (Solução 1), filtra os elegíveis para visita hoje:

```
Candidatos = pacientes da equipe onde:
  - score_total > 0
  - dias_desde_ultima_visita >= intervalo_minimo_do_perfil
  - não foram visitados hoje
  - ordenados por score_total DESC
```

O `intervalo_mínimo_do_perfil` evita revisitar pacientes recém-atendidos:
- Gestantes e crianças 0-6: mínimo 7 dias entre visitas
- Hipertensos/diabéticos: mínimo 14 dias
- Demais: mínimo 30 dias

Sem esse filtro, o mesmo paciente crítico apareceria todos os dias.

### Etapa 2 — Corte por capacidade do turno

Seleciona os **top N** por score, onde N é a capacidade configurada para a equipe (padrão: 6 visitas por turno).

```python
capacidade_turno = config['equipes'][equipe_id].get('capacidade', 6)
agenda_candidatos = candidatos_ordenados[:capacidade_turno]
```

Se a equipe tem 6 ACS e cada um faz 6 visitas, são 36 visitas por turno — distribuídas entre os ACS pelo sistema.

### Etapa 3 — Otimização da rota

Com os N pacientes selecionados, calcula a ordem de visita que minimiza o deslocamento total. Ponto de partida: coordenadas da sede da equipe em `equipes.parquet`.

**Algoritmo:** Nearest Neighbor (greedy)

```
início: sede da equipe (lat, lon)
para cada passo:
  próximo ponto = paciente mais próximo ainda não visitado
fim: retorno à sede (opcional)
```

Dado que são 5–7 pontos por rota, o Nearest Neighbor é suficientemente bom — o ganho do algoritmo exato (TSP) não justifica a complexidade para esse volume.

**Distância usada:** Haversine (distância geodésica entre dois pontos de lat/lon). Não usa API de rotas — as coordenadas têm ruído de 100m, então precisão de rua seria falsa.

### Etapa 4 — Geração de justificativas com Claude

Para cada paciente na rota, monta um prompt estruturado com a decomposição do score e chama o Claude Haiku:

```
Input para o Claude:
  - Condições clínicas do paciente
  - Dias sem visita
  - Urgências recentes
  - Agendamentos futuros
  - Posição na rota (1ª visita = mais crítica)

Output esperado:
  2–3 linhas em português simples
  Começa com a situação, termina com a ação
  Sem jargão médico
  Sem sugestão de diagnóstico
```

Resultado:
> "Gestante há 78 dias sem visita domiciliar. Foi à urgência em 18/05 e tem consulta agendada para 02/06. Verificar andamento do pré-natal, checar pressão arterial e confirmar presença na consulta."

---

## Como funciona na interface

### Tela principal do ACS — Agenda do dia

```
┌─────────────────────────────────────────┐
│  ← Inteligência no Território           │
│                                         │
│  Bom dia, Maria!                        │
│  Hoje: 26/05 · Equipe ba1cb3b7          │
│  6 visitas planejadas · ~4,2 km total   │
├─────────────────────────────────────────┤
│  [Iniciar rota]  [Ver no mapa]          │
├─────────────────────────────────────────┤
│                                         │
│  ████ 1  Paciente F., 34 anos    1,2km  │
│  CRÍTICO · Gestante · Hipertensa        │
│  "Verificar pré-natal e confirmar       │
│   consulta de 02/06"                    │
│                          [Detalhes >]   │
├─────────────────────────────────────────┤
│  ███  2  Paciente R., 71 anos    1,8km  │
│  URGENTE · Hipertenso                   │
│  "2 urgências nos últimos 90 dias.      │
│   Verificar adesão à medicação"         │
│                          [Detalhes >]   │
├─────────────────────────────────────────┤
│  ██   3  Paciente A., 4 anos     2,1km  │
│  URGENTE · Criança 0-6                  │
│  "Sem visita há 65 dias (limite: 45).   │
│   Verificar desenvolvimento e vacinas"  │
│                          [Detalhes >]   │
├─────────────────────────────────────────┤
│  ...mais 3 visitas                      │
└─────────────────────────────────────────┘
```

A cor da barra lateral esquerda do card indica a faixa de prioridade (vermelho = crítico, laranja = urgente, amarelo = atenção). A distância no canto direito é a distância da visita anterior (ou da sede para a primeira).

### Tela de mapa da rota

```
┌─────────────────────────────────────────┐
│  ← Voltar          Rota de hoje        │
├─────────────────────────────────────────┤
│                                         │
│   [MAPA]                                │
│     ★ Sede                             │
│      ↘                                 │
│       ① F. (CRÍTICO)                   │
│        ↘                               │
│         ② R. (URGENTE)                 │
│          ↘                             │
│           ③ A. (URGENTE)               │
│            ...                          │
│                                         │
│   Distância total: 4,2 km              │
│   Tempo estimado: ~2h de caminhada     │
├─────────────────────────────────────────┤
│  [Iniciar primeira visita →]           │
└─────────────────────────────────────────┘
```

### Tela de execução — durante a visita

Ao tocar em um card, o ACS entra na tela de execução:

```
┌─────────────────────────────────────────┐
│  ← Agenda       Visita 1 de 6          │
├─────────────────────────────────────────┤
│  Paciente F., 34 anos · Gestante        │
│                                         │
│  Por que visitar agora:                 │
│  • Gestante sem visita há 78 dias       │
│  • Foi à urgência em 18/05             │
│  • Consulta agendada para 02/06        │
│                                         │
│  O que verificar:                       │
│  "Confirmar andamento do pré-natal,     │
│   checar pressão arterial, verificar    │
│   adesão à medicação e lembrar da       │
│   consulta de segunda-feira"            │
│                                         │
│  📍 Endereço: próximo à Rua X, nº ~45  │
│     (precisão ±100m)                   │
├─────────────────────────────────────────┤
│  [ Visita realizada ✓ ]                │
│  [ Não encontrei o paciente ]          │
│  [ Paciente recusou a visita ]         │
└─────────────────────────────────────────┘
```

### Registro da visita

Ao tocar em "Visita realizada", um modal simples aparece:

```
┌─────────────────────────────────────────┐
│  Registrar visita                       │
├─────────────────────────────────────────┤
│  Como estava o paciente?                │
│  ○ Estável                             │
│  ○ Com queixa — encaminhar à clínica   │
│  ○ Em situação de emergência           │
│                                         │
│  Observação (opcional):                 │
│  ┌─────────────────────────────────┐   │
│  │ Digite aqui...                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [ Salvar e ir para próxima visita ]   │
└─────────────────────────────────────────┘
```

O registro atualiza o banco de dados (`visitas`) e o score do paciente é recalculado automaticamente — removendo-o da fila de prioritários até o próximo intervalo mínimo.

---

## Distribuição entre ACS da mesma equipe

Uma equipe tem tipicamente 5–6 ACS, cada um com uma sub-área territorial. O sistema distribui os pacientes candidatos entre os ACS da equipe com base em proximidade geográfica:

```
Para cada ACS da equipe:
  candidatos_do_acs = pacientes mais próximos geograficamente ao ACS
  (cada paciente é atribuído ao ACS mais próximo de seu endereço)
  agenda_do_acs = top 6 por score dentro dos seus candidatos
```

Na interface, cada ACS vê apenas os pacientes da sua sub-área — não a lista completa da equipe.

---

## O que acontece quando o paciente não é encontrado

Ao marcar "Não encontrei o paciente", o sistema:
1. Registra a tentativa de visita
2. Mantém o paciente na fila com score inalterado
3. Na próxima agenda, reposiciona o paciente como "tentativa anterior" com leve redução de score (evita loop infinito)
4. Após 3 tentativas sem sucesso, gera um alerta para o gestor

---

## Integração com as outras soluções

| Entrada | Vem de |
|---|---|
| Score de cada paciente | Solução 1 (Score de Risco) |
| Pacientes invisíveis na fila | Solução 3 (Invisíveis) |
| Alertas de urgência recente | Solução 5 (Alertas) |

| Saída | Vai para |
|---|---|
| Registro de visitas | Atualiza score (Solução 1) |
| Pacientes não encontrados | Alerta para gestor (Solução 4) |

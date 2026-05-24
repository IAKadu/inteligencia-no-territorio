# Solução 1 — Score de Risco por Paciente

**Papel na plataforma:** motor central. Todas as outras soluções consomem o score como input — sem ele, nada funciona.

---

## O que é

Um número entre 0 e 200 que representa a urgência de visita de cada paciente, calculado automaticamente a partir dos dados clínicos, histórico de visitas e eventos de saúde. É o cérebro da plataforma.

O ACS não vê o número diretamente — ele vê a consequência do score na forma de prioridade, posição na fila e motivo da visita. O gestor vê o score em contexto de análise. O número existe para que a máquina tome a decisão de ordem; o humano recebe a instrução.

---

## Como é calculado

O score é composto por quatro dimensões independentes, cada uma com fonte de dado específica:

### Dimensão 1 — Perfil clínico e social
**Fonte:** `pacientes.parquet`

Baseado nos campos booleanos e na faixa etária do cadastro. Reflete o risco intrínseco do paciente — o que ele é, não o que aconteceu com ele recentemente.

| Condição | Pontos | Justificativa clínica |
|---|---|---|
| Gestante | +40 | Maior urgência no protocolo do Rio |
| Criança 0-6 anos | +35 | 7–8 visitas/ano exigidas pelo município |
| Hipertenso + Diabético | +30 | Combinação de maior risco cardiovascular |
| Hipertenso | +20 | Protocolo trimestral obrigatório |
| Diabético | +20 | Protocolo trimestral obrigatório |
| Idoso 66+ | +15 | Protocolo trimestral, alta vulnerabilidade |
| Vulnerabilidade social | +10 | Bolsa Família e equivalentes |

Um paciente pode acumular pontos de múltiplas condições. Uma gestante hipertensa em situação de vulnerabilidade soma +70 só nessa dimensão.

### Dimensão 2 — Déficit em relação à régua de visitas
**Fonte:** `visitas.parquet` + configuração `regua_visitas.yaml`

Mede o quanto o paciente está atrasado em relação à frequência mínima de visitas obrigatória para seu perfil.

```
déficit = max(0, mínimo_anual_do_perfil - visitas_realizadas_no_ano)
pontos  = déficit × 8
```

Exemplos práticos:
- Criança 0-6 com 0 visitas no ano: déficit = 7 → **+56 pontos**
- Hipertenso com 1 visita no ano: déficit = 3 → **+24 pontos**
- Gestante com 3 visitas: déficit = 3 → **+24 pontos**
- Paciente sem condição especial com 2 visitas: déficit = 0 → **+0 pontos**

Esta dimensão penaliza o abandono progressivo: quanto mais tempo sem visita, maior o score.

### Dimensão 3 — Urgências e internações recentes
**Fonte:** `eventos_clinicos.parquet` (tipo = `urgencia-emergencia-ou-internacao`)

Mede sinais recentes de deterioração clínica. Uma ida a urgência indica que o paciente não está controlado ambulatorialmente — e o ACS precisa agir antes da próxima crise.

```
pontos = (urgências últimos 30d × 25)
       + (urgências últimos 90d × 15)
       + (urgências últimos 180d × 8)
       + (total urgências no ano × 3)
```

Lógica de decaimento temporal: urgência recente vale muito mais que urgência antiga. Os 790 pacientes com 3+ urgências e zero visita chegam a ter 75+ pontos só nessa dimensão.

### Dimensão 4 — Agendamento futuro pendente
**Fonte:** `eventos_clinicos.parquet` (tipo = `agendamento`)

Se o paciente tem uma consulta agendada nas próximas semanas, o ACS precisa comunicá-lo pessoalmente. Não é risco clínico — é uma obrigação operacional que gera pontuação moderada.

```
pontos = 10 se tem agendamento futuro, 0 caso contrário
```

### Score final

```
score_total = score_clinico
            + score_deficit_visitas
            + score_urgencias
            + score_agendamento

Faixas de prioridade:
  CRÍTICO  → score >= 80   (vermelho)
  URGENTE  → score 50–79   (laranja)
  ATENÇÃO  → score 20–49   (amarelo)
  ROTINA   → score < 20    (verde)
```

---

## Como funciona na interface

O score nunca aparece como número isolado para o ACS. Ele se manifesta em três lugares da aplicação:

### 1. Cor e tag de prioridade no card de visita

```
┌─────────────────────────────────────────┐
│ ████ CRÍTICO                            │
│ Paciente F., 34 anos                    │
│ Gestante · Hipertensa                   │
│                                         │
│ Sem visita há 78 dias                   │
│ 1 urgência nos últimos 30 dias          │
│ Consulta agendada para 02/06            │
│                                         │
│ "Verificar pré-natal, comunicar         │
│  consulta e checar pressão arterial"    │
│                                         │
│ 📍 1,4 km da sede          [Ver mapa]  │
└─────────────────────────────────────────┘
```

A cor da borda esquerda do card é determinada pela faixa de prioridade. O ACS não precisa saber que o score é 94 — ele vê "CRÍTICO" e entende.

### 2. Posição na lista da agenda

A lista da agenda do ACS é ordenada pelo score. O paciente com score mais alto aparece primeiro na lista — e é a primeira visita da rota do dia. O ACS nunca precisa decidir a ordem: ela já está definida.

### 3. Decomposição visível para o ACS no detalhe do paciente

Ao tocar no card, o ACS vê o motivo estruturado da priorização:

```
┌─────────────────────────────────────────┐
│ Por que esta visita é prioritária?      │
├─────────────────────────────────────────┤
│ ✓ Gestante em acompanhamento           │
│ ✓ Hipertensa — risco cardiovascular    │
│ ✓ 78 dias sem visita (limite: 30 dias) │
│ ✓ Foi à urgência em 18/05              │
│ ✓ Consulta agendada para 02/06         │
│                                         │
│ O que verificar:                        │
│ "Confirmar acompanhamento de pré-natal, │
│  checar pressão e adesão à medicação,   │
│  e lembrar da consulta de segunda-feira"│
└─────────────────────────────────────────┘
```

O texto "O que verificar" é gerado pelo Claude Haiku a partir da decomposição do score — transforma dados estruturados em instrução clínica legível.

### 4. Filtros no painel do gestor

O gestor pode filtrar pacientes por faixa de prioridade para identificar concentrações de risco por equipe ou território.

---

## Parâmetros configuráveis

Os pesos e as regras vivem em `config/regua_visitas.yaml`. A equipe da SMS pode ajustar sem tocar no código:

```yaml
dimensao_clinica:
  gestacao: 40
  faixa_0_6: 35
  hipertenso_diabetico: 30
  hipertenso: 20
  diabetico: 20
  idoso_66plus: 15
  vulnerabilidade: 10

dimensao_deficit:
  peso_por_visita_faltante: 8

dimensao_urgencia:
  peso_30d: 25
  peso_90d: 15
  peso_180d: 8
  peso_ano: 3

dimensao_agendamento:
  tem_agendamento: 10

faixas_prioridade:
  critico: 80
  urgente: 50
  atencao: 20
```

---

## Quando o score é recalculado

O score é recalculado em três situações:
1. **Toda segunda-feira às 6h** — batch semanal para preparar a agenda da semana
2. **Após uma visita ser registrada** — recalcula o score do paciente visitado (dias sem visita zera)
3. **Manualmente pelo gestor** — botão "Atualizar scores" no painel

---

## Limitações conhecidas

- Faixa `0-6` agrega bebês (< 1 ano) com crianças maiores — bebês têm prioridade ainda maior no protocolo real, mas o dado anonimizado não distingue
- Tuberculose não tem campo nos dados — pacientes TB precisam ser marcados manualmente
- Os pesos foram definidos com base no briefing clínico; precisam de validação com a equipe da SMS antes do uso em produção

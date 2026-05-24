# Solução 5 — Alertas Automáticos de Deterioração

**Papel na plataforma:** resposta a eventos. Enquanto as outras soluções são proativas e planejadas, os alertas são reativos a sinais de crise — garantindo que o sistema não ignore o que acabou de acontecer.

---

## O que é

Um sistema de regras que monitora continuamente os eventos clínicos e dispara notificações quando um paciente apresenta sinal de deterioração — especialmente ida a urgência/emergência — sem que o ACS tenha reagido. O alerta interrompe o fluxo normal e insere o paciente na agenda com urgência máxima.

Sem alertas, o sistema funcionaria bem para planejamento semanal, mas seria cego a crises que ocorrem entre uma semana e outra.

---

## Por que esse problema existe

Quando um paciente vai à urgência, o evento entra em `eventos_clinicos` — mas ninguém notifica o ACS. O ACS só saberia na próxima vez que olhasse o cadastro, que pode ser semanas depois. A crise aconteceu, o paciente foi atendido (ou não), e o acompanhamento preventivo pós-crise nunca ocorre.

**Dado que valida o problema:**
- 10.037 pacientes visitados que foram à urgência estavam sem visita há **mediana de 78 dias** antes do evento
- 45,6% estavam sem visita há mais de 90 dias quando a crise ocorreu

O alerta cria o elo que faltava: urgência → notificação → visita preventiva pós-crise.

---

## As três regras de alerta

### Regra 1 — Urgência recente sem visita de acompanhamento

```
SE  paciente teve urgência/internação nos últimos 7 dias
E   NÃO teve visita do ACS nos últimos 14 dias
ENTÃO  gerar alerta URGÊNCIA RECENTE
       inserir na agenda com prioridade máxima
       notificar ACS responsável
```

Esta é a regra mais importante. O período pós-urgência é o de maior risco de recorrência — e também a janela mais efetiva para intervenção preventiva.

### Regra 2 — Espiral de crises (múltiplas urgências)

```
SE  paciente teve 3 ou mais urgências nos últimos 90 dias
E   NÃO tem visita do ACS registrada nos últimos 30 dias
ENTÃO  gerar alerta ESPIRAL DE CRISES
       marcar como invisível de categoria 1 (Solução 3)
       notificar gestor da equipe
```

Múltiplas urgências indicam ausência de controle clínico ambulatorial. Este alerta identifica quem está em deterioração progressiva.

### Regra 3 — Gestante sem visita recente

```
SE  paciente tem gestacao = True
E   NÃO teve visita nos últimos 30 dias
ENTÃO  gerar alerta GESTANTE SEM ACOMPANHAMENTO
       inserir na agenda com prioridade CRÍTICO
       notificar ACS responsável
```

Gestantes exigem acompanhamento mensal mínimo. Um mês sem visita já é uma lacuna grave dado o protocolo do Rio.

---

## Como funciona na interface

### Para o ACS — notificação push

Quando um alerta é gerado para um paciente da carteira do ACS, ele recebe uma notificação no aplicativo:

```
┌─────────────────────────────────────────┐
│  🔴 Alerta de saúde                     │
├─────────────────────────────────────────┤
│  Paciente R., 71 anos                   │
│  Foi à urgência em 23/05               │
│                                         │
│  Última visita: 15/03 (69 dias atrás)  │
│                                         │
│  Adicionado à sua agenda para amanhã   │
│                                         │
│  [Ver agenda]  [Ver detalhes]          │
└─────────────────────────────────────────┘
```

O paciente já foi inserido automaticamente na agenda do próximo dia — o ACS não precisa fazer nada além de executar a visita.

### Para o ACS — card de alerta na agenda

Pacientes com alerta ativo aparecem na agenda com tag diferenciada:

```
┌─────────────────────────────────────────┐
│ ████ CRÍTICO  🔴 ALERTA: Urgência 23/05 │
│ Paciente R., 71 anos                    │
│ Hipertenso · Idoso                      │
│                                         │
│ Foi à urgência há 3 dias               │
│ Sem visita há 69 dias                   │
│                                         │
│ "Paciente teve atendimento de urgência  │
│  recentemente. Verificar o que ocorreu, │
│  checar pressão e medicação, e avaliar  │
│  necessidade de encaminhamento"         │
│                                         │
│ 📍 2,1 km da sede                      │
└─────────────────────────────────────────┘
```

A tag 🔴 ALERTA diferencia do card de priorização normal e indica ao ACS que a visita tem caráter de resposta a evento, não de rotina.

### Para o ACS — tela de detalhes do alerta

```
┌─────────────────────────────────────────┐
│  ← Voltar       Alerta ativo           │
├─────────────────────────────────────────┤
│  Paciente R., 71 anos · Hipertenso      │
│                                         │
│  HISTÓRICO DE EVENTOS (últimos 90 dias) │
│                                         │
│  23/05 ▶ Urgência/emergência           │
│  18/04 ▶ Urgência/emergência           │
│  15/03 ▶ Visita ACS (última visita)    │
│  02/03 ▶ Consulta agendada             │
│  14/02 ▶ Urgência/emergência           │
│                                         │
│  3 idas à urgência desde a última      │
│  visita do ACS                          │
│                                         │
│  O que verificar na visita:             │
│  "Paciente apresenta padrão de crises  │
│   repetidas. Verificar se está tomando  │
│   medicação corretamente, se compareceu │
│   às consultas agendadas e se há barrei-│
│   ras de acesso ao serviço de saúde"   │
└─────────────────────────────────────────┘
```

A linha do tempo de eventos mostra ao ACS o contexto completo — não apenas a urgência mais recente, mas o padrão. O texto gerado pelo Claude é contextualizado para pacientes com histórico de espiral de crises.

### Para o gestor — painel de alertas

O painel do gestor tem uma seção de alertas ativos:

```
┌─────────────────────────────────────────────────────────────────┐
│  ALERTAS ATIVOS — Área Programática X                          │
├─────────────────────────────────────────────────────────────────┤
│  🔴 Urgência recente sem acompanhamento     47 pacientes        │
│  🔴 Espiral de crises (3+ urgências/90d)    23 pacientes        │
│  🟡 Gestante sem visita há 30+ dias         12 pacientes        │
│                                                                  │
│  Total de alertas ativos: 82                                    │
│  Resolvidos esta semana: 61 (74%)                              │
├─────────────────────────────────────────────────────────────────┤
│  Por equipe:                                                     │
│  ba1cb3b7  ████████  14 alertas  (8 alocados na agenda)        │
│  9f8755f2  ██████    11 alertas  (11 alocados na agenda)       │
│  8c7e94fb  █████      9 alertas  ( 6 alocados na agenda)       │
│  ...                                                             │
├─────────────────────────────────────────────────────────────────┤
│  [Ver todos os alertas]   [Alertas não alocados]               │
└─────────────────────────────────────────────────────────────────┘
```

A distinção entre "alertas ativos" e "alocados na agenda" é crítica para o gestor: um alerta não alocado significa que o sistema gerou a prioridade, mas ela ainda não foi atribuída a nenhum ACS — o gestor precisa agir.

### Para o gestor — alerta não alocado

Quando um alerta crítico existe mas nenhum ACS foi designado para resolvê-lo:

```
┌─────────────────────────────────────────┐
│  ⚠ Alerta não alocado                  │
├─────────────────────────────────────────┤
│  Paciente M., 68 anos                   │
│  Hiper + Diabético · 4 urgências/ano   │
│  Alerta gerado há 2 dias               │
│  Equipe: ba1cb3b7                       │
│                                         │
│  Motivo sem alocação:                  │
│  Capacidade da equipe atingida          │
│  (6/6 visitas alocadas)                │
│                                         │
│  [Alocar manualmente]                  │
│  [Aumentar capacidade da equipe hoje]  │
└─────────────────────────────────────────┘
```

O gestor pode manualmente alocar a visita ou temporariamente aumentar a capacidade da equipe para o dia.

---

## Ciclo de vida de um alerta

```
Evento clínico registrado
        ↓
Regra de alerta avaliada (a cada hora)
        ↓
Alerta gerado → paciente recebe bônus de score (+50 pontos)
        ↓
ACS notificado → paciente inserido na agenda de amanhã
        ↓
ACS executa a visita → registra o resultado
        ↓
Alerta marcado como "resolvido"
        ↓
Score recalculado sem o bônus de alerta
```

Se a visita não for realizada em 48h após o alerta, ele escala para o gestor automaticamente.

---

## Integração com as outras soluções

| Entrada | Vem de |
|---|---|
| Eventos de urgência | `eventos_clinicos.parquet` (tipo = urgência) |
| Última visita do paciente | `visitas.parquet` |
| Perfil clínico (gestante) | `pacientes.parquet` |

| Saída | Vai para |
|---|---|
| Bônus emergencial de score | Solução 1 (Score de Risco) |
| Inserção prioritária na agenda | Solução 2 (Roteiro Diário) |
| Contagem de alertas por equipe | Solução 4 (Painel do Gestor) |
| Paciente com espiral de crises | Solução 3 (Invisíveis — Categoria 1) |

---

## Limitação principal

O sistema de alertas depende da tempestividade dos dados. Na base anonimizada (batch semanal), alertas são processados uma vez por semana. Em produção com integração ao e-SUS/PEC, eventos de urgência seriam processados em horas — tornando os alertas verdadeiramente reativos.

Para o hackathon, os alertas funcionam no modo batch e demonstram corretamente a lógica — o valor da solução está na regra, não na latência.

# Solução 3 — Detecção de Pacientes Invisíveis

**Papel na plataforma:** descoberta proativa. Identifica quem nunca apareceu na memória do ACS e, por isso, nunca foi visitado — mesmo estando em situação crítica.

---

## O que é

Um mecanismo automático que detecta pacientes que o sistema nunca alcançou: sem nenhuma visita registrada no período, independentemente do perfil clínico. Esses pacientes têm score calculado (Solução 1), mas nunca entram na agenda porque o ACS simplesmente não sabe que existem.

A detecção de invisíveis não é uma tela separada — é uma camada que injeta esses pacientes nas agendas e nos alertas do gestor com marcação especial.

---

## Por que esse problema existe

O ACS prioriza quem ele conhece. Pacientes que nunca tiveram contato com o sistema — novos cadastros, famílias que se mudaram, pessoas que nunca buscaram atendimento — são sistematicamente ignorados não por negligência, mas por ausência de sinal. Sem sinal, não há priorização.

**Dados que demonstram o problema:**
- 48.838 pacientes (49,9% do total) sem nenhuma visita no período analisado
- 6.744 desses são de alto risco clínico (gestante, criança, hipertenso, diabético, idoso 66+)
- 790 tiveram 3 ou mais idas a urgência e ainda assim nunca receberam uma visita

Esses 790 são o grupo mais crítico: em espiral de crises repetidas, sem nenhum acompanhamento.

---

## Como funciona

### Classificação de invisíveis

Três categorias, por gravidade decrescente:

**Categoria 1 — Crise sem vínculo (prioridade máxima)**
```
pacientes onde:
  n_visitas == 0
  AND n_urgencias_ano >= 3
```
790 pacientes identificados. Estão repetindo crises sem que ninguém intervenha preventivamente.

**Categoria 2 — Alto risco sem contato**
```
pacientes onde:
  n_visitas == 0
  AND (gestacao OR faixa_etaria='0-6' OR hipertenso OR diabetico
       OR faixa_etaria='66+' OR situacao_vulnerabilidade)
```
6.744 pacientes. Têm condição clínica que exige acompanhamento regular e nunca foram visitados.

**Categoria 3 — Sem contato (sem condição especial)**
```
pacientes onde:
  n_visitas == 0
  AND sem condição de risco
```
~42.000 pacientes. Baixa prioridade individual, mas representam cobertura territorial — a régua mínima de 2 visitas/ano não está sendo cumprida.

---

### Injeção automática na agenda

Pacientes das Categorias 1 e 2 recebem um **bônus fixo de score** que garante sua entrada na agenda mesmo que o score base seja baixo:

```python
if n_visitas == 0 and alto_risco:
    score_total += 30          # bônus invisível alto risco
    flag_invisivel = True

if n_visitas == 0 and n_urgencias >= 3:
    score_total += 50          # bônus crise sem vínculo
    flag_crise_sem_vinculo = True
```

O bônus é suficiente para que um paciente invisível de alto risco entre na agenda mesmo com score clínico baixo — porque o maior risco aqui é o desconhecimento, não necessariamente a condição.

---

### Rotação de invisíveis

Para garantir que pacientes invisíveis da Categoria 3 sejam alcançados ao longo do tempo sem sobrecarregar a agenda dos ACS de Categoria 1, o sistema aplica rotação semanal:

```
Semana 1: injeta 1 invisível de cat.3 por turno (menor score da fila de alto score)
Semana 2: próximo lote de invisíveis
...
```

Assim, a cobertura dos 42.000 pacientes sem condição especial avança gradualmente sem sacrificar a priorização dos casos críticos.

---

## Como funciona na interface

### Para o ACS — marcação visual no card

Invisíveis aparecem na agenda com marcação especial:

```
┌─────────────────────────────────────────┐
│ ████ CRÍTICO  ★ PRIMEIRO CONTATO        │
│ Paciente M., 68 anos                    │
│ Hipertenso · Diabético                  │
│                                         │
│ Nenhuma visita registrada               │
│ 4 idas à urgência no último ano        │
│                                         │
│ "Primeiro contato com este paciente.    │
│  Apresentar-se, verificar condições     │
│  de saúde e iniciar vínculo"            │
│                                         │
│ 📍 1,9 km da sede                      │
└─────────────────────────────────────────┘
```

A tag **★ PRIMEIRO CONTATO** diferencia do card padrão e instrui o ACS sobre a natureza especial da visita: não é acompanhamento, é abertura de vínculo. O texto gerado pelo Claude reflete isso.

### Para o ACS — tela de registro adaptada

Na tela de execução de um primeiro contato, o formulário de registro é ligeiramente diferente:

```
┌─────────────────────────────────────────┐
│  Primeiro contato — Paciente M.         │
├─────────────────────────────────────────┤
│  O paciente foi encontrado?             │
│  ○ Sim, realizei o contato             │
│  ○ Endereço não localizado             │
│  ○ Paciente não mora mais aqui         │
│  ○ Paciente se recusou ao contato      │
│                                         │
│  Situação encontrada:                   │
│  ○ Estável, sem queixas                │
│  ○ Queixas — encaminhar à clínica      │
│  ○ Situação de emergência              │
│                                         │
│  [ Confirmar e avançar ]               │
└─────────────────────────────────────────┘
```

Se o endereço não existe ou o paciente não mora mais lá, o registro dispara uma revisão do cadastro — alimentando a qualidade dos dados.

### Para o gestor — seção dedicada no painel

O painel do gestor tem uma seção "Invisíveis" com três números em destaque:

```
┌─────────────────────────────────────────────────────────────────┐
│  PACIENTES SEM CONTATO — Equipe ba1cb3b7                       │
├───────────────┬───────────────┬───────────────────────────────  │
│      47       │     312       │          1.149                  │
│  Crise sem    │  Alto risco   │       Sem condição              │
│  vínculo      │  sem contato  │       especial                  │
│  (3+ urgênc.) │               │                                 │
└───────────────┴───────────────┴───────────────────────────────  │
│                                                                  │
│  Progressão semanal:                                            │
│  ████████░░░░░░░  47% cobertos este mês                        │
│                                                                  │
│  [Ver lista completa]  [Exportar]                              │
└─────────────────────────────────────────────────────────────────┘
```

O gestor consegue ver em tempo real quantos invisíveis críticos ainda existem na equipe e o ritmo de cobertura semanal.

### Para o gestor — lista detalhada de invisíveis

```
┌───────────────────────────────────────────────────────────────┐
│  Invisíveis críticos — ordenados por urgência                 │
├────────────┬──────────┬───────────┬────────────┬─────────────┤
│ Paciente   │ Perfil   │ Urgências │ Score      │ Status      │
├────────────┼──────────┼───────────┼────────────┼─────────────┤
│ M., 68a    │ Hiper+DB │ 4/ano     │ 134 CRÍTICO│ Na agenda   │
│ T., 72a    │ Idoso    │ 6/ano     │ 121 CRÍTICO│ Pendente    │
│ P., 0-6    │ Criança  │ 0         │  95 CRÍTICO│ Pendente    │
│ ...        │ ...      │ ...       │ ...        │ ...         │
└────────────┴──────────┴───────────┴────────────┴─────────────┘
```

"Na agenda" significa que o paciente já foi alocado na agenda de algum ACS desta semana. "Pendente" significa que ainda não foi alcançado.

---

## Integração com as outras soluções

| Entrada | Vem de |
|---|---|
| n_visitas, ultima_visita | Calculado a partir de `visitas.parquet` |
| n_urgencias | Calculado a partir de `eventos_clinicos.parquet` |
| Perfil clínico | `pacientes.parquet` |

| Saída | Vai para |
|---|---|
| Bônus de score | Solução 1 (Score de Risco) |
| Injeção na agenda | Solução 2 (Roteiro Diário) |
| Contagem por equipe | Solução 4 (Painel do Gestor) |
| Endereço inválido | Qualidade de dados (retroalimenta cadastro) |

---

## Impacto demonstrável

Os 790 pacientes com 3+ urgências e zero visita são o caso de uso mais poderoso para demonstrar o valor desta solução:

> "Esses 790 pessoas foram à urgência 3 ou mais vezes no último ano — e nenhuma delas foi visitada por um ACS nesse período. Se tivessem sido acompanhadas preventivamente, parte dessas idas à urgência poderia ter sido evitada."

Esse número é calculável a partir dos dados agora, sem nenhuma suposição adicional.

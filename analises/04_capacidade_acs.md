# Capacidade Real por ACS/Turno

**Pergunta:** Quantas visitas um ACS realiza por dia na prática? Qual é a restrição de capacidade real para o roteamento?

---

## Aviso metodológico importante

O campo `registrados_em` na tabela `visitas` é a **data de registro no sistema**, não a data real da visita. O ACS anota visitas no caderno durante o campo e pode lançar todas no sistema no mesmo dia ou em dias posteriores. Isso distorce severamente qualquer análise de capacidade baseada nos dados de registro.

Os números abaixo devem ser interpretados como **padrões de registro**, não como produtividade operacional real.

---

## Distribuição de visitas por dia de trabalho

*(dias em que houve ao menos 1 visita registrada)*

| Estatística | Valor |
|---|---|
| Total de dias com registro | 80.134 |
| Média de visitas/dia | 2,0 |
| Mediana | 1 |
| P75 | 3 |
| P90 | 4 |
| P95 | 5 |
| Máximo | 15 |

**51,1% dos dias têm exatamente 1 visita registrada** — fortíssimo indicador de que a maioria dos lançamentos é retroativo e pontual, não reflexo da jornada real de campo.

Apenas 6,2% dos dias têm 5 ou mais visitas registradas; 0,1% tem 10 ou mais.

---

## Distribuição de profissionais por atividade

| Estatística | Dias ativos/ano por profissional |
|---|---|
| Total de profissionais com registro | 3.531 |
| Mediana | 3 dias |
| P75 | 7 dias |
| Máximo | 342 dias |
| Desvio padrão | 63 dias |

A distribuição é **extremamente assimétrica**: a maioria dos profissionais tem pouquíssimos dias com registro, enquanto um grupo pequeno concentra quase toda a atividade. Isso pode refletir:
- ACS que não registram no sistema (mas visitam no campo)
- ACS afastados ou com baixa atividade
- Diferenças de adoção do sistema eletrônico entre equipes

---

## Padrão por dia da semana

| Dia | Visitas |
|---|---|
| Segunda | 22.714 |
| Terça | 23.274 |
| Quarta | 23.728 |
| Quinta | 23.199 |
| Sexta | 23.582 |
| Sábado | 21.584 |
| Domingo | 21.518 |

Distribuição **surpreendentemente uniforme**, incluindo fins de semana. Isso confirma que os lançamentos não seguem necessariamente o dia real de campo — o ACS registra quando acessa o sistema, independentemente do dia da semana.

---

## Padrão por mês

| Mês | Visitas |
|---|---|
| Janeiro | 12.886 |
| Fevereiro | 13.862 |
| Março | 14.876 |
| Abril | 10.767 |
| Maio | 13.405 |
| Junho | 12.193 |
| Julho | 12.975 |
| Agosto | 14.115 |
| Setembro | 13.492 |
| Outubro | 14.556 |
| Novembro | 13.649 |
| Dezembro | 12.823 |

Abril tem o menor volume (10.767) — possível efeito de feriados (Semana Santa). Variação mensal é baixa (~25%), sem sazonalidade forte.

---

## Estimativa de capacidade real por turno

Apesar das limitações dos dados de registro, é possível estimar a capacidade real com base em:

1. **Literatura e protocolos do MS:** o ACS deve realizar entre 5 e 7 visitas por turno de trabalho
2. **Dados de P90-P95:** dias com 4-5 visitas registradas existem e são o teto observável nos dados
3. **Capacidade física:** cada visita domiciliar leva 20-40 min; um turno de 4h comporta 6-12 visitas dependendo da densidade territorial

**Estimativa adotada para o modelo de roteamento: 5 a 7 visitas por turno**

Este valor deve ser parametrizável na solução — equipes em territórios densos (favelas) podem ter capacidade diferente de equipes em territórios dispersos.

---

## Implicação para o roteamento

A restrição de capacidade é a principal limitação do problema de otimização:

```
Dado: lista de pacientes priorizados por score de risco
Restrição: capacidade_turno = 5 a 7 visitas
Objetivo: maximizar impacto clínico (soma dos scores) dentro da capacidade
Secundário: minimizar deslocamento total (TSP aproximado)
Origem: coordenadas da sede da equipe
```

O roteamento é um problema de **Capacitated Vehicle Routing (CVRP)** simplificado — um "veículo" (ACS), capacidade fixa, ponto de origem fixo, minimização de distância com maximização de impacto.

# Sugestões de Solução — Inteligência no Território

**Baseado em:** análise exploratória dos 4 arquivos Parquet (97.938 pacientes, 159.599 visitas, 100.503 eventos clínicos, 49 equipes)

---

## O problema central em uma frase

O ACS já sabe intuitivamente quem está em risco — mas chega tarde, visita por memória e cobre metade do território. Os dados existem para mudar isso.

---

## Mapa de soluções

```
Dados → Score de Risco → Priorização → Roteamento → Agenda do ACS
                ↓
         Painel do Gestor
```

---

## Solução 1 — Score de Risco por Paciente

**Problema que resolve:** 75,9% dos pacientes estão abaixo da régua de visitas; o ACS não tem como saber quem é mais urgente sem dados estruturados.

### Como funciona

Cada paciente recebe uma pontuação composta por quatro dimensões:

#### Dimensão 1: Perfil clínico e social
Baseado nos campos booleanos de `pacientes`:

| Condição | Peso sugerido |
|---|---|
| `gestacao = True` | +40 |
| `faixa_etaria = '0-6'` | +35 |
| `hipertenso = True` AND `diabetico = True` | +30 |
| `hipertenso = True` | +20 |
| `diabetico = True` | +20 |
| `faixa_etaria = '66+'` | +15 |
| `situacao_vulnerabilidade = True` | +10 |

#### Dimensão 2: Déficit de visitas (régua do Rio)
Calculado a partir de `visitas.registrados_em`:

```python
min_visitas = {
    '0-6': 7, 'gestacao': 6,
    'hipertenso_ou_diabetico': 4, '66+': 4, 'default': 2
}
deficit = max(0, min_visitas[perfil] - n_visitas_realizadas)
score_deficit = deficit * 8   # cada visita faltante vale 8 pontos
```

A lógica: um hipertenso com 0 visitas tem déficit de 4 → +32 pontos. Já está muito atrás da régua.

#### Dimensão 3: Urgências recentes
Calculado a partir de `eventos_clinicos` onde `tipo = 'urgencia-emergencia-ou-internacao'`:

```python
score_urgencia = (
    n_urgencias_ultimos_30d  * 25 +
    n_urgencias_ultimos_90d  * 15 +
    n_urgencias_ultimos_180d *  8 +
    n_urgencias_ano_total    *  3
)
```

Justificativa nos dados: 45,6% dos pacientes visitados que foram a urgência já estavam sem visita há mais de 90 dias. Urgência recente é o sinal de maior valor preditivo.

#### Dimensão 4: Agendamento futuro sem comunicação
A partir de `eventos_clinicos` onde `tipo = 'agendamento'`:

```python
score_agendamento = 10 if tem_agendamento_futuro else 0
```

O ACS precisa avisar o paciente sobre a consulta agendada — motivo concreto de visita.

#### Score final

```python
score_total = (
    score_perfil_clinico +
    score_deficit_visitas +
    score_urgencias +
    score_agendamento
)
```

### Dados necessários
- `pacientes`: todos os campos booleanos + `faixa_etaria`
- `visitas`: `registrados_em` + `paciente_id` (para calcular n_visitas e data da última visita)
- `eventos_clinicos`: `tipo` + `data_referencia` + `paciente_id`

### Output
Uma tabela `pacientes_scored` com `paciente_id`, `score_total` e decomposição por dimensão — para rastreabilidade e para o ACS entender o motivo.

---

## Solução 2 — Roteiro Diário Otimizado para o ACS

**Problema que resolve:** mesmo com priorização correta, o ACS perde tempo com deslocamento ineficiente. A capacidade real é de 5–7 visitas/turno e cada minuto conta.

### Como funciona

#### Passo 1: Selecionar os candidatos do dia
Para cada equipe, pegar os N pacientes com maior score que:
- Não foram visitados nos últimos K dias (K depende do perfil)
- Estão geograficamente no território da equipe

#### Passo 2: Filtrar pela capacidade do turno
Selecionar os top 7 (ou configurável) por score — garantindo que os mais críticos entrem primeiro.

#### Passo 3: Otimizar a rota
Problema de roteamento com ponto de origem fixo (sede da equipe em `equipes.endereco_latitude/longitude`):

```
Origem: (lat, lon) da equipe
Pontos: endereços dos 7 pacientes selecionados
Objetivo: minimizar distância total percorrida
Algoritmo: Nearest Neighbor (simples, rápido) ou 2-opt (melhor qualidade)
```

Dado o ruído de 100m nas coordenadas, algoritmos heurísticos são suficientes — não faz sentido usar otimização exata com dados imprecisos.

#### Passo 4: Gerar a agenda com motivo legível
Para cada visita na rota:

```
Visita 1: [Nome/ID do paciente]
  Motivo: Gestante — sem visita há 45 dias (mínimo: mensal)
  Ação: verificar pré-natal e agendamento de consulta

Visita 2: [Nome/ID do paciente]
  Motivo: Hipertenso + Diabético — 3 idas a urgência nos últimos 90 dias
  Ação: verificar adesão à medicação

Visita 3: [Nome/ID do paciente]
  Motivo: Consulta agendada para 15/06 — paciente precisa ser comunicado
  Ação: confirmar presença na consulta
```

### Dados necessários
- `equipes`: lat/lon da sede (ponto de partida)
- `pacientes`: lat/lon (endereço), condições clínicas
- `visitas`: data da última visita por paciente
- `eventos_clinicos`: urgências recentes + agendamentos futuros

### Restrições a respeitar
- Capacidade do turno: 5–7 visitas (parametrizável)
- Pacientes TB (tuberculose): visita diária — campo ausente nos dados, mas pode ser adicionado manualmente pela equipe
- Dados de endereço com ruído de 100m: adequados para roteamento, não para navegação GPS precisa

---

## Solução 3 — Detecção de Pacientes Invisíveis

**Problema que resolve:** 48.838 pacientes (49,9%) nunca foram visitados no período. Entre eles, 6.744 são de alto risco clínico. O sistema atual não emite nenhum alerta sobre essas lacunas.

### Como funciona

Uma lista semanal por equipe com pacientes que:

1. **Nunca foram visitados** + condição de risco → prioridade crítica
2. **Sem visita há mais de 180 dias** + condição de risco → prioridade alta
3. **3+ urgências** + sem nenhuma visita → prioridade máxima (790 pacientes identificados)

### Implementação simples

```python
invisíveis_críticos = pacientes[
    (pacientes['alto_risco'] == True) &
    (pacientes['n_visitas'] == 0)
]
# 6.744 pacientes — saída imediata para fila de alta prioridade

espiral_de_crises = urgencias_por_pac[
    (urgencias_por_pac['n_urg'] >= 3) &
    (~urgencias_por_pac['paciente_id'].isin(pac_com_visita))
]
# 790 pacientes — caso de uso mais impactante para demonstração
```

### Por que isso importa
Esses pacientes não aparecem na memória do ACS porque nunca tiveram contato. A solução não melhora o que já existe — ela descobre o que está invisível.

---

## Solução 4 — Painel do Gestor por Equipe

**Problema que resolve:** gestores de unidade e de área programática não têm visibilidade sobre qual equipe está com maior déficit de cobertura ou maior risco acumulado.

### Indicadores sugeridos por equipe

| Indicador | Fonte | Referência |
|---|---|---|
| % pacientes visitados no mês | `visitas` | Meta: >60% |
| % alto risco com visita em dia | `pacientes` + `visitas` + régua | Meta: >80% |
| Pacientes com 2+ urgências sem visita | `eventos_clinicos` + `visitas` | Meta: 0 |
| Score de pressão da equipe | calculado | ranking entre as 49 equipes |
| Déficit total de visitas (régua) | `visitas` + régua | tendência mensal |

### Score de pressão das equipes (já calculado)

O score varia de 29,2 a 45,3 entre as 49 equipes. As 4 equipes com score > 42 devem ser o foco inicial de intervenção. Dois perfis identificados:

- **Perfil A (alta densidade clínica):** >50% de pacientes com condição crônica — prioridade é aumentar frequência de visita para quem já é acompanhado
- **Perfil B (alta invisibilidade):** >60% sem nenhuma visita — prioridade é cobertura dos invisíveis

### Visualizações úteis
- Mapa de calor por equipe: % sem visita vs. % alto risco (quadrante 2×2)
- Evolução mensal do % de cobertura por grupo prioritário
- Lista de pacientes críticos não visitados por equipe (drilldown)

---

## Solução 5 — Alertas Automáticos de Deterioração

**Problema que resolve:** quando um paciente vai a urgência, o ACS geralmente não sabe. O evento clínico fica no sistema e ninguém aciona a visita preventiva pós-crise.

### Regra de alerta pós-urgência

```
SE paciente teve urgência nos últimos 7 dias
E NÃO teve visita do ACS nos últimos 14 dias
ENTÃO gerar alerta: "Paciente teve atendimento de urgência — visita prioritária"
```

### Dados disponíveis para implementar
- `eventos_clinicos.tipo = 'urgencia-emergencia-ou-internacao'`
- `eventos_clinicos.data_referencia`
- `visitas.registrados_em`

### Limitação conhecida
O date shifting aplicado na anonimização desloca as datas por paciente. A lógica de alerta funciona corretamente nos dados reais de produção — na base anonimizada, os resultados são ilustrativos.

---

## Priorização das soluções

| Solução | Impacto | Complexidade | Dados disponíveis | Prioridade |
|---|---|---|---|---|
| Score de risco | Alto | Média | Sim (completos) | **1ª** |
| Detecção de invisíveis | Alto | Baixa | Sim | **2ª** |
| Roteiro otimizado | Alto | Média-alta | Sim (com limitações) | **3ª** |
| Alertas pós-urgência | Médio | Baixa | Sim | **4ª** |
| Painel do gestor | Médio | Média | Sim | **5ª** |

A Solução 2 (detecção de invisíveis) pode ser entregue em horas — é uma query simples com impacto imediato e demonstrável. A Solução 1 (score) é o núcleo da plataforma e deve ser construída primeiro. O Roteiro (Solução 3) depende do score estar pronto.

---

## Limitações que a solução deve reconhecer

| Limitação | Impacto | Mitigação |
|---|---|---|
| Faixa `0-6` agrupa bebês e crianças maiores | Subestima prioridade de < 1 ano | Campo adicional no cadastro real |
| Tuberculose ausente nos dados | Não modela visita diária obrigatória | Adicionar manualmente pela equipe |
| `profissional_id` sem vínculo a `equipe_id` | Não sabe qual ACS cobre qual paciente | Usar equipe_id como proxy |
| Coordenadas com ruído de 100m | Rota não é GPS-precisa | Adequado para priorização; não para navegação |
| Registro ≠ visita real | Capacidade parece menor que é | Usar P90 (4-5) como baseline conservador |

---

## Próximos passos concretos

1. **Hoje:** implementar a Solução 2 (detecção de invisíveis) — query de 20 linhas, resultado imediato com os 790 casos críticos
2. **Curto prazo:** construir o score de risco (Solução 1) e validar com a equipe da SMS os pesos por grupo
3. **Médio prazo:** integrar score + roteamento (Solução 3) em um pipeline semanal por equipe
4. **Demonstração:** usar os 790 pacientes com 3+ urgências e zero visita como caso de uso âncora — é o número mais impactante para comunicar o valor da solução

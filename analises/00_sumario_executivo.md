# Sumário Executivo — Inteligência no Território

**Projeto:** Claude Impact Lab 2026 — Secretaria Municipal de Saúde do Rio de Janeiro
**Fonte:** Repositório `prefeitura-rio/claude-impact-lab-saude`
**Dados:** 4 arquivos Parquet anonimizados — período 2025-01-01 a 2025-12-31

---

## O problema em números

O Rio de Janeiro tem 6.200 Agentes Comunitários de Saúde cobrindo 4,5 milhões de habitantes. O planejamento de visitas ainda é feito por memória e papel, sem inteligência de dados. Os dados revelam a dimensão real do problema:

| Indicador | Valor |
|---|---|
| Pacientes no território analisado | 97.938 |
| Pacientes sem nenhuma visita no ano | **48.838 (49,9%)** |
| Pacientes de alto risco sem visita ou com visita defasada | **~14.700** |
| Pacientes abaixo da frequência mínima da régua do Rio | **74.303 (75,9%)** |
| Pacientes com 3+ urgências e zero visita | **790** |

---

## Principais achados

### 1. Metade dos pacientes nunca foi visitada
50,1% dos pacientes tiveram ao menos uma visita no período. Os outros 49,9% ficaram invisíveis para o sistema de atenção primária durante todo o ano.

### 2. A régua de visitas do Rio não está sendo cumprida
75,9% dos pacientes receberam menos visitas do que o mínimo protocolar. Os grupos mais críticos:
- **Idosos 66+**: 81,3% abaixo da régua (déficit médio de 3,3 visitas)
- **Crianças 0-6 anos**: 74,8% abaixo (déficit médio de 4,8 visitas — o maior)
- **Hipertensos**: 73,3% abaixo (déficit médio de 2,9 visitas)

### 3. A correlação urgência × visita valida a hipótese central
Pacientes que foram a urgência/emergência tinham **proporcionalmente mais visitas** que os que não foram — o ACS já prioriza intuitivamente os mais graves. Mas tarde demais: 45,6% dos pacientes visitados que foram a urgência já estavam sem visita há mais de 90 dias quando a crise ocorreu. A mediana era 78 dias sem visita antes do evento.

### 4. O registro subestima a capacidade real
51% dos dias registrados têm apenas 1 visita. A mediana de visitas por dia de trabalho é 1, e o P90 é 4. Isso reflete o comportamento de registro em papel com lançamento posterior — não a operação real de campo. Para o modelo, a capacidade realista por turno é de **5 a 7 visitas**.

### 5. Há heterogeneidade territorial relevante entre equipes
O score de pressão por equipe (risco × cobertura × urgência) varia de 29,2 a 45,3. Nove equipes têm mais de 60% dos pacientes sem nenhuma visita; 30 das 49 equipes têm mais de 30% de pacientes de alto risco.

---

## O que a solução precisa fazer

Com os dados disponíveis, é possível construir um pipeline que, para cada ACS a cada semana:

1. **Calcula score de risco por paciente** — combinando condição clínica, tempo sem visita, urgências recentes e vulnerabilidade social
2. **Aplica a régua de visitas** como restrição mínima de frequência
3. **Roteiriza as visitas** respeitando a capacidade de turno (5–7 visitas) e minimizando deslocamento a partir da sede da equipe
4. **Entrega ao ACS com motivo legível** — quem visitar, por quê e em que ordem

---

## Arquivos de análise detalhada

| Arquivo | Conteúdo |
|---|---|
| [01_visao_geral_dados.md](01_visao_geral_dados.md) | Schema, volumes, qualidade dos dados |
| [02_lacunas_regua_visitas.md](02_lacunas_regua_visitas.md) | Déficit de visitas por grupo de risco |
| [03_correlacao_urgencia_visita.md](03_correlacao_urgencia_visita.md) | Relação entre urgências e ausência de visita |
| [04_capacidade_acs.md](04_capacidade_acs.md) | Capacidade real por ACS e padrões de registro |
| [05_distribuicao_geografica.md](05_distribuicao_geografica.md) | Score de pressão e cobertura por equipe |

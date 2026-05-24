# Visão Geral dos Dados

**Fonte:** 4 arquivos Parquet em `Dados/`
**Período coberto:** 2025-01-01 a 2025-12-31
**Território:** Recorte de 1 área programática do Rio de Janeiro (replicável para outras)

---

## Arquivos e volumes

| Arquivo | Linhas | Colunas |
|---|---|---|
| `equipes_anonimizadas.parquet` | 49 | 3 |
| `pacientes_anonimizados.parquet` | 97.938 | 12 |
| `visitas_anonimizadas.parquet` | 159.599 | 4 |
| `eventos_clinicos_anonimizados.parquet` | 100.503 | 3 |

---

## Modelo Entidade-Relacionamento

```
equipes (49)
    └── pacientes (97.938)   [FK: equipe_id]
            ├── visitas (159.599)           [FK: paciente_id]
            └── eventos_clinicos (100.503)  [FK: paciente_id]
```

Todas as chaves são hashes SHA256 com secret — sem possibilidade de reidentificação.

---

## Dicionário de dados

### `equipes`

| Coluna | Tipo | Descrição |
|---|---|---|
| `equipe_id` | string | Hash SHA256 da equipe |
| `endereco_latitude` | float | Latitude da sede (ponto de partida do ACS) |
| `endereco_longitude` | float | Longitude da sede |

**Observação:** múltiplas equipes compartilham as mesmas coordenadas — são equipes diferentes na mesma clínica da família. Exatamente ~2.000 pacientes por equipe (corte de anonimização).

---

### `pacientes`

| Coluna | Tipo | Valores | Observação |
|---|---|---|---|
| `paciente_id` | string | hash | Chave primária |
| `equipe_id` | string | hash | FK para equipes |
| `unidade_id` | string | hash | FK para unidade de saúde |
| `faixa_etaria` | string | `0-6`, `6-18`, `19-45`, `45-65`, `66+` | Generalizada — não há idade exata |
| `sexo` | string | Feminino, Masculino | — |
| `raca_cor` | string | Branca, Parda, Preta, Outros | — |
| `situacao_vulnerabilidade` | bool | True/False | Inclui Bolsa Família e equivalentes |
| `endereco_latitude` | float | — | Ruído de até 100m aplicado |
| `endereco_longitude` | float | — | Ruído de até 100m aplicado |
| `hipertenso` | bool | True/False | — |
| `diabetico` | bool | True/False | — |
| `gestacao` | bool | True/False | — |

**Zero nulls em todas as colunas.**

#### Distribuição das condições clínicas

| Condição | N | % |
|---|---|---|
| Hipertenso | 21.017 | 21,5% |
| Diabético | 8.172 | 8,3% |
| Hipertenso + Diabético | 6.385 | 6,5% |
| Gestante | 661 | 0,7% |
| Vulnerabilidade social | 9.191 | 9,4% |
| Faixa 0-6 anos | 2.746 | 2,8% |
| Faixa 66+ anos | 24.858 | 25,4% |
| Sem condição especial | 58.517 | 59,7% |

#### Distribuição demográfica

| Campo | Distribuição |
|---|---|
| Sexo | Feminino 56,4% / Masculino 43,6% |
| Raça/cor | Branca 47,6% / Parda 36,0% / Preta 14,7% / Outros 1,7% |

---

### `visitas`

| Coluna | Tipo | Observação |
|---|---|---|
| `profissional_id` | string | Hash do ACS (não há FK explícita para equipes) |
| `registrados_em` | date | Data de **registro**, não necessariamente da visita |
| `ordem_visita_dia` | int | Sequência no dia (1 a 15) |
| `paciente_id` | string | FK para pacientes |

**Atenção crítica:** o ACS anota visitas no papel e pode lançar várias no mesmo dia. A data é confiável; o horário não existe.

---

### `eventos_clinicos`

| Coluna | Tipo | Valores |
|---|---|---|
| `paciente_id` | string | FK para pacientes |
| `tipo` | string | `agendamento` (71.668) \| `urgencia-emergencia-ou-internacao` (28.835) |
| `data_referencia` | date | Data do evento |

**Apenas dois tipos de evento** — consultas agendadas via regulação e idas a urgência/emergência/internação.

---

## Qualidade dos dados

| Dimensão | Status |
|---|---|
| Completude | Excelente — zero nulls em todas as tabelas |
| Consistência de chaves | OK — todas as FK testadas |
| Datas | Confiáveis como data; horário não existe/não é confiável |
| Coordenadas | Ruído de até 100m — adequadas para roteamento, não para geolocalização precisa |
| Volumes por equipe | Artificialmente uniformes (~2.000/equipe) — artefato da anonimização |

---

## O que NÃO está nos dados (lacunas para o modelo)

- **Tuberculose** — mencionada no briefing como caso de visita diária obrigatória, mas sem campo nos cadastros
- **`profissional_id` sem vínculo a `equipe_id`** — não é possível saber diretamente quais pacientes cada ACS cobre
- **Frequência mínima de visitas** — não está codificada nos dados; precisa ser implementada via régua do Rio
- **Faixas etárias detalhadas** — `0-6` agrega bebês (< 1 ano, prioridade máxima) e crianças maiores
- **Valores enumerados de `tipo`** — apenas dois valores; não há granularidade de procedimento clínico

# Lacunas vs. Régua de Visitas

**Pergunta:** Quantos pacientes estão abaixo da frequência mínima de visitas definida pelo município do Rio de Janeiro?

---

## Régua de visitas adotada

O Rio de Janeiro segue protocolo mais exigente que o Ministério da Saúde. A régua aplicada nesta análise:

| Grupo | Frequência mínima/ano | Referência |
|---|---|---|
| Crianças 0-6 anos | 7 visitas | Rio exige 7-8 (MS recomenda 4) |
| Gestantes | 6 visitas | ~1 visita/mês durante gestação ativa |
| Hipertensos e/ou diabéticos | 4 visitas | Acompanhamento trimestral |
| Idosos 66+ | 4 visitas | Acompanhamento trimestral |
| Demais pacientes | 2 visitas | Mínimo bimestral |

> **Nota:** A régua completa está nos Guias de Visitas da Biblioteca Carioca do SUS. Os valores acima são a aproximação baseada no briefing para fins de análise exploratória.

---

## Resultado geral

**74.303 pacientes (75,9%) estão abaixo da frequência mínima** para seu perfil.

Apenas 1 em cada 4 pacientes está com a régua de visitas em dia.

---

## Resultado por grupo de risco

| Grupo | Total | Abaixo da régua | % | Déficit médio |
|---|---|---|---|---|
| Idosos 66+ | 24.858 | **20.220** | **81,3%** | 3,3 visitas |
| Crianças 0-6 anos | 2.746 | 2.053 | 74,8% | **4,8 visitas** |
| Hipertensos (sem diabetes) | 14.632 | 10.727 | 73,3% | 2,9 visitas |
| Diabéticos (sem hipertensão) | 1.787 | 1.248 | 69,8% | 2,8 visitas |
| Hipertenso + Diabético | 6.385 | 3.640 | 57,0% | 2,7 visitas |
| Vulneráveis (social) | 9.191 | 5.438 | 59,2% | 2,1 visitas |
| Gestantes | 661 | 309 | 46,7% | 3,6 visitas |
| Sem condição especial | 58.517 | 43.961 | 75,1% | 1,7 visitas |

---

## Observações críticas

### Idosos 66+ são o maior volume absoluto de lacuna
Com 20.220 pacientes abaixo da régua, idosos representam 27% de todo o déficit. É o grupo que mais sobrecarregaria o sistema de saúde caso evoluam para condições agudas.

### Crianças 0-6 têm o maior déficit por paciente
Déficit médio de 4,8 visitas/ano para quem está abaixo da régua — o mais alto de todos os grupos. A régua de 7 visitas/ano é muito mais exigente que os outros grupos, e a cobertura atual está muito aquém.

**Limitação importante:** a faixa `0-6` agrega crianças de até 6 anos. Bebês com menos de 1 ano têm prioridade ainda mais alta (o município exige frequência diferenciada), mas não é possível distingui-los com os dados disponíveis.

### Gestantes têm a melhor cobertura relativa
Com 46,7% abaixo da régua, gestantes são o grupo mais bem assistido. O ACS claramente já prioriza gestantes — o desafio é formalizar e escalar esse comportamento para todos os grupos.

### O problema é sistêmico, não pontual
Mesmo pacientes "sem condição especial" têm 75,1% abaixo da régua mínima de 2 visitas/ano. O déficit não é concentrado em um perfil — é uma falha de capacidade operacional geral.

---

## Implicação para o score de risco

O déficit de visitas em relação à régua é uma das variáveis mais diretas para o score de priorização:

```
deficit_visitas = max(0, min_visitas_regua - n_visitas_realizadas)
```

Um paciente hipertenso com 0 visitas no ano tem déficit de 4 — deve estar no topo da fila, independentemente de outros fatores.

---

## Distribuição de visitas realizadas (todos os pacientes)

| Faixa de visitas | N pacientes | % |
|---|---|---|
| 0 visitas | 48.838 | 49,9% |
| 1-2 visitas | 22.847 | 23,3% |
| 3-5 visitas | 17.489 | 17,9% |
| 6-10 visitas | 7.215 | 7,4% |
| 11+ visitas | 1.549 | 1,6% |

Metade dos pacientes não recebeu nenhuma visita. Apenas 9% recebeu 6 ou mais.

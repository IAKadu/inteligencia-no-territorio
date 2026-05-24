# Correlação Urgência × Ausência de Visita

**Pergunta:** Pacientes que foram a urgência/emergência são os mesmos que não receberam visitas? A ausência de visita preventiva está associada a crises?

---

## Matriz de cobertura × urgência

|  | Com visita | Sem visita | Total |
|---|---|---|---|
| **Com urgência/internação** | 10.037 | 4.400 | **14.437** |
| **Sem urgência** | 39.063 | 44.438 | **83.501** |
| **Total** | **49.100** | **48.838** | **97.938** |

---

## Achado principal: o ACS já prioriza os mais graves — mas chega tarde

Pacientes que foram a urgência têm **proporcionalmente mais visitas** (69,5% visitados) do que os que não foram (46,8% visitados). Isso significa que o ACS já identifica intuitivamente os pacientes mais críticos e os visita mais.

**O problema não é quem o ACS visita — é quando.**

Entre os pacientes visitados que ainda foram a urgência:
- **Mediana de 78 dias sem visita** antes do evento
- **Média de 108 dias sem visita**
- **45,6% estavam sem visita há mais de 90 dias** quando a crise ocorreu

O cuidado chegou — mas com atraso suficiente para que a crise se instalasse.

---

## Os 790 casos mais críticos

**790 pacientes foram a urgência 3 ou mais vezes e nunca receberam nenhuma visita.**

Este subgrupo representa o fracasso mais grave do sistema atual: pacientes em espiral de crises repetidas, sem nenhum acompanhamento preventivo. São o caso de uso mais impactante para demonstrar o valor da solução.

---

## Distribuição de urgências por paciente

| Urgências no ano | N pacientes |
|---|---|
| 1 | 8.666 |
| 2 | 2.830 |
| 3-5 | 2.271 |
| 6-10 | 553 |
| 11+ | 117 |

117 pacientes tiveram 11 ou mais idas a urgência/emergência em um único ano — média superior a 1 por mês. Esses casos extremos indicam condições crônicas não controladas e ausência de acompanhamento ambulatorial.

---

## Interpretação para o modelo de risco

### Urgência recente é o sinal de maior valor preditivo

Uma ida a urgência nos últimos 30-60 dias deve ter peso alto no score de priorização porque:
1. Indica condição clínica instável
2. Sugere que o paciente não conseguiu resolver o problema no nível ambulatorial
3. Aumenta probabilidade de nova crise em breve

### Múltiplas urgências elevam exponencialmente o risco

Pacientes com 3+ urgências no histórico devem receber peso extra no score. A correlação entre urgências repetidas e ausência de visita é o sinal mais claro de quem está sendo sistematicamente negligenciado.

### Estrutura sugerida do sinal de urgência no score

```
score_urgencia = (
    n_urgencias_ultimos_30d * 3.0 +
    n_urgencias_ultimos_90d * 2.0 +
    n_urgencias_ultimos_180d * 1.0 +
    n_urgencias_ano_total * 0.5
)
```

---

## Limitações desta análise

- A anonimização aplicou **date shifting por paciente** — a sequência temporal está preservada, mas as datas absolutas não correspondem à realidade. Não é possível calcular com precisão "X dias entre última visita e urgência" para datas reais.
- A supressão de eventos raros pode ter removido alguns padrões extremos de urgência.
- Não há informação sobre o motivo da urgência — não é possível distinguir trauma de crise hipertensiva, por exemplo.

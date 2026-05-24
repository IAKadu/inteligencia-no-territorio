# Distribuição Geográfica: Risco vs. Cobertura por Equipe

**Pergunta:** Onde estão concentrados os pacientes de alto risco sem visita? Quais equipes estão mais pressionadas?

---

## Metodologia

Para cada uma das 49 equipes, calculamos três indicadores:

- **% alto risco:** pacientes com ao menos uma condição (gestante, 0-6 anos, hipertenso, diabético, vulnerabilidade social)
- **% sem visita:** pacientes sem nenhum registro de visita no ano
- **% com urgência:** pacientes com ao menos 1 ida a urgência/emergência

**Score de pressão** = `%risco × 0,4 + %sem_visita × 0,4 + %urgência × 0,2`

Os pesos refletem a importância relativa: risco e cobertura têm peso igual e dominante; urgência é sinal complementar.

---

## Amplitude do score entre equipes

| Estatística | Score de pressão |
|---|---|
| Mínimo | 29,2 |
| Máximo | 45,3 |
| Desvio padrão | 3,6 |

A variação é moderada (amplitude de 16 pontos, DP de 3,6) — não há uma equipe com desempenho radicalmente diferente das demais. O problema é sistêmico, não concentrado em uma equipe específica.

---

## Top 15 equipes por score de pressão

| Equipe (sufixo) | Total | % Risco | % Sem visita | % Urgência | Score |
|---|---|---|---|---|---|
| ba1cb3b7 | 1.997 | 39,6% | 58,4% | 30,4% | **45,3** |
| 8c7e94fb | 1.998 | 41,9% | 55,1% | 19,3% | 42,7 |
| 7e4d858c | 1.998 | 56,0% | 41,1% | 17,0% | 42,3 |
| ba293c87 | 1.998 | 55,6% | 38,1% | 23,9% | 42,3 |
| 8b97b5db | 1.998 | 33,7% | 61,3% | 16,2% | 41,2 |
| dfdca825 | 2.000 | 46,2% | 46,6% | 16,4% | 40,4 |
| 5743b5b0 | 2.000 | 32,4% | 63,9% | 7,1% | 40,0 |
| cb31a849 | 2.000 | 26,6% | 65,6% | 15,4% | 40,0 |
| 9f8755f2 | 2.000 | 34,8% | 49,2% | 31,0% | 39,8 |
| 947181bc | 1.999 | 50,7% | 39,5% | 18,1% | 39,7 |
| c09ee01d | 1.997 | 32,9% | 59,3% | 11,7% | 39,2 |
| 378c0a93 | 2.000 | 32,1% | 53,1% | 25,1% | 39,1 |
| d2abc3f4 | 1.996 | 35,0% | 51,1% | 23,3% | 39,1 |
| 445e6077 | 2.000 | 30,8% | 60,2% | 13,4% | 39,1 |
| 9ca1a20a | 1.999 | 44,7% | 40,8% | 23,1% | 38,8 |

---

## Perfis de pressão (dois padrões distintos)

A análise revela dois perfis de equipe com scores similares mas origens diferentes:

### Perfil A — "Alta vulnerabilidade clínica"
Equipes com alto % de risco (>50%) mas cobertura razoável. O problema é a **densidade de condições crônicas**, não a ausência de visita.
- Exemplos: `7e4d858c` (56% risco, 41% sem visita), `ba293c87` (55,6% risco), `947181bc` (50,7% risco)

### Perfil B — "Alta invisibilidade"
Equipes com % de risco moderado mas altíssimo % sem visita (>60%). O problema é a **falta de cobertura**.
- Exemplos: `cb31a849` (65,6% sem visita), `5743b5b0` (63,9%), `8b97b5db` (61,3%)

A solução deve tratar esses perfis diferentemente: no Perfil A, o foco é aumentar frequência para quem já é visitado; no Perfil B, o foco é alcançar os invisíveis.

---

## Destaques por indicador

| Indicador | Valor extremo |
|---|---|
| Equipes com >60% sem visita | **9 de 49** |
| Equipes com >30% alto risco | **30 de 49** |
| Equipe com maior % urgência | 31,0% (`9f8755f2`) |
| Equipe com menor % urgência | 7,1% (`5743b5b0`) |

---

## Considerações geográficas

As coordenadas das sedes das equipes têm ruído de até 100m aplicado. Para a análise de roteamento isso é aceitável — a precisão é suficiente para calcular distâncias de deslocamento no território.

Múltiplas equipes compartilham as mesmas coordenadas de sede (mesma clínica da família). No roteamento, cada equipe parte do mesmo ponto geográfico, mas opera com sua própria carteira de pacientes.

---

## Implicação para priorização de implantação

Se a solução for implantada de forma faseada por equipe, a ordem sugerida com base no score de pressão seria:

1. **Equipes com score > 42**: 4 equipes — prioridade máxima
2. **Equipes com score 38–42**: ~20 equipes — segunda onda
3. **Equipes com score < 38**: restante — terceira onda

Essa sequência garante que o impacto inicial seja máximo e demonstrável.

# Briefing — Desafio "Inteligência no Território"

**Secretaria Municipal de Saúde do Rio de Janeiro**
Apresentado por: Ana Carolina Carone (Carol) — Gerente de Dados | Pedro — Dados e Tecnologia

---

## 1. Contexto: o agente comunitário de saúde (ACS)

O Agente Comunitário de Saúde é o profissional responsável por realizar visitas domiciliares e acompanhar famílias no território onde vivem. É o elo entre a comunidade e as equipes de saúde da família que atuam nas clínicas.

**Números do Rio de Janeiro:**
- Mais de **6.200 ACS** ativos na cidade
- Responsáveis por **mais de 4,5 milhões de habitantes**
- **100% de cobertura** em favelas e comunidades
- Mais de **1.200 equipes de saúde da família**
- **70% de cobertura** de saúde da família — maior entre as capitais brasileiras

**Composição de cada equipe de saúde da família:**
- 1 médico
- 1 enfermeiro
- 1 técnico de enfermagem
- 5 a 6 agentes comunitários de saúde
- Profissionais administrativos, farmacêuticos e equipe multiprofissional

Cada equipe de 6 ACS cuida de aproximadamente **750 pessoas**. Para ser ACS, é obrigatório morar no território de atuação.

---

## 2. O problema atual

Hoje, o trabalho do ACS depende essencialmente de:
- **Memória** e conhecimento informal do território
- **Papel e caderno** para registro de campo
- Lançamento posterior no prontuário eletrônico (com lag de horas ou dias)

> "Como o agente trabalha? Quem ele visita? Em qual ordem? Por qual motivo?"

Não há inteligência de dados orientando a ordem e a prioridade das visitas. O cuidado é **reativo** — espera-se o paciente pedir ou piorar — em vez de **preventivo e preditivo**.

---

## 3. O desafio: transformar dados em inteligência territorial

**Objetivo:** usar os dados já existentes para ajudar o ACS a decidir **quem visitar**, **em qual ordem** e **por qual motivo** — tornando o cuidado mais preventivo e as visitas mais impactantes.

### Impactos esperados

| Resultado | Descrição |
|-----------|-----------|
| Presença mais direcionada | Visitas respeitam critérios de vulnerabilidade, não memória ou acaso |
| Cuidado preventivo | ACS sabe quem visitar antes que a situação piore |
| Alcance de famílias de alto risco | Prioriza risco de saúde **e** vulnerabilidade social |
| Detecção precoce | Identificação de condições antes de virarem emergência |
| Redução de internações evitáveis | Menos hospitalizações desnecessárias |

### Populações prioritárias (conforme diretrizes do Ministério da Saúde e protocolos do Rio)

- Gestantes
- Crianças (especialmente menores de 1 ano)
- Pacientes com hipertensão arterial
- Pacientes com diabetes mellitus
- Pacientes com tuberculose (visita **diária** para tratamento supervisionado)
- Famílias em vulnerabilidade social (beneficiários do Bolsa Família e outros)

### Régua de visitas do Rio de Janeiro

O município adota uma régua **mais exigente** que a do Ministério da Saúde.
Exemplo: crianças de até 1 ano — MS recomenda 4 visitas/ano; Rio exige **7 a 8 visitas/ano**.

Os manuais e guias completos estão disponíveis nos materiais de apoio do repositório.

---

## 4. Dados disponíveis

O recorte contempla **98 mil cadastros** de um território específico da cidade. A solução desenvolvida para esse território é replicável para outros.

### Tabelas fornecidas

| Dado | Conteúdo | Observação relevante |
|------|----------|----------------------|
| **Cadastros de pacientes** | Perfil em nível generalizado: faixa etária, histórico de gestação, condições de saúde | Anonimizados para evitar reidentificação |
| **Consultas agendadas** | Agendamentos futuros nas clínicas | ACS precisa comunicar ao paciente — entra no planejamento de visita |
| **Idas a urgências e emergências** | Histórico de passagens por UPA e PS | Sobe a prioridade de visita ao paciente |
| **Histórico de visitas dos ACS** | Registro das visitas realizadas por equipe | Permite identificar padrões e lacunas |
| **Equipes** | Lista das equipes de saúde da família | Referência para vínculo territórial |

**Formato:** arquivos Parquet com dicionário de dados e modelo de relacionamento disponíveis no repositório.

### Ponto de partida geográfico

A unidade de saúde (clínica da família) é a posição inicial da jornada do ACS. Os dados de endereço permitem modelar o deslocamento a partir desse ponto.

---

## 5. Técnicas de anonimização aplicadas

| Técnica | Detalhe |
|---------|---------|
| **Amostragem e embaralhamento de cadastros** | Datas embaralhadas, mas **sequência de eventos preservada** |
| **Randomização de endereços** | Ruído de **100 metros** no endereço; distribuição territorial mantida |
| **Supressão de eventos raros** | Eventos únicos ou quase únicos foram removidos para evitar reidentificação |

> **Importante para a modelagem:** o horário registrado no sistema não é necessariamente o horário da visita — o ACS pode acumular visitas em papel e registrar todas no mesmo dia. A data é uma aproximação confiável, mas não o horário preciso.

---

## 6. Materiais de apoio

- **Biblioteca Carioca do SUS** — repositório digital de protocolos, textos e guias da Saúde do Rio
- **Dicionário de dados** — modelo de relacionamento entre tabelas, chaves primárias e estrangeiras
- **Guias de régua de visitas** — frequência recomendada por perfil de paciente
- **Documento de anonimização** — metodologia, impactos e referências técnicas

---

## 7. Divisão territorial da cidade

O Rio de Janeiro é dividido em **10 Áreas de Planejamento (APs)**, cada uma com coordenação local de saúde. Dentro de cada AP há as clínicas da família, e dentro de cada clínica há de 2 a 16 equipes de saúde da família.

---

## 8. Questão central do desafio

> **Dado o perfil clínico e social das famílias de um território, como ajudar o ACS a planejar sua semana de visitas de forma que o impacto em saúde seja máximo dentro da sua capacidade de turno?**

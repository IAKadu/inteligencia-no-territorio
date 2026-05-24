# Transcrição da Apresentação do Problema

**Apresentadores:**
- **Carol Tarento** (Carolina Henrique Tarento) — Gerente de Dados, Secretaria Municipal de Saúde do Rio de Janeiro
- **Pedro** — Equipe de Dados, Secretaria Municipal de Saúde do Rio de Janeiro

---

## Parte 1 — Carol: O Desafio da Inteligência no Território

### Contexto: O Agente Comunitário de Saúde (ACS)

O desafio está relacionado à jornada do Agente Comunitário de Saúde (ACS). Quem mora no Rio de Janeiro provavelmente já teve contato com a clínica da família ou o centro municipal de saúde.

O ACS é o profissional responsável por fazer visitas não agendadas e acompanhar as famílias onde elas moram. É a ponte entre o território e as equipes de saúde da família nas clínicas.

**Escala atual:**
- Mais de **6.200 agentes comunitários** atuando no Rio de Janeiro
- Cobertura de mais de **4,5 milhões de habitantes**
- **100% de cobertura nas favelas e comunidades**
- Mais de **1.200 equipes de saúde da família**
- Cobertura de **80% de saúde da família** — maior entre as capitais brasileiras

### Como funciona hoje

Cada equipe de saúde da família é composta por:
- 1 médico
- 1 enfermeiro
- 1 técnico de enfermagem
- 5 a 6 agentes comunitários de saúde
- Profissionais administrativos, farmacêuticos, equipe de suporte

A cidade está dividida em **10 distritos** (áreas de planejamento), cada um com coordenação local. Dentro de cada distrito há clínicas da família com múltiplas equipes — desde 2 até 16 equipes por clínica. Cada ACS cuida de aproximadamente **750 pessoas**.

Hoje o processo de visita **depende de memória, papel e conhecimento informal do território**. Ser morador local é pré-requisito para ser ACS. As fichas de papel passam por um processo de digitalização para o prontuário eletrônico, mas na prática muitas vezes o agente usa o caderno e depois transcreve no sistema.

### Populações prioritárias para visita

- Gestantes
- Crianças
- Pacientes com hipertensão e diabetes
- Pacientes com tuberculose (tratamento supervisionado — visita diária)
- Famílias em vulnerabilidade social (Bolsa Família e outros benefícios)

### O Desafio

**"Transformar dados em inteligência para os Agentes Comunitários de Saúde."**

As perguntas centrais são: *Quem visitar? Em qual ordem? Por qual motivo?*

**O que muda se o desafio for resolvido:**
- Presença no território passa a ser mais direcionada e baseada em critérios de vulnerabilidade
- O cuidado se torna mais preventivo e menos reativo
- O ACS passa a priorizar quem realmente precisa, com prazo definido
- Famílias de alto risco são alcançadas mais rapidamente
- Condições detectáveis são identificadas mais cedo
- Emergências e hospitalizações evitáveis tendem a diminuir

### Regras de Visita

Os manuais do Ministério da Saúde definem as diretrizes gerais, mas o Rio de Janeiro opera com padrões mais elevados. Exemplo: o Ministério recomenda 4 visitas/ano para crianças até 1 ano; o Rio pede de **7 a 8 visitas**. Todos os protocolos e guias estão disponíveis nos materiais do repositório.

---

## Parte 2 — Pedro: Os Dados

### Ponto de partida da jornada

A unidade de saúde é a origem da jornada do ACS. A bolinha cinza no mapa representa a unidade posicionada, e o ACS parte dali para cobrir seu território.

Há uma distinção importante entre o **momento da visita** e o **momento do registro no sistema**. Os dados exportados trazem o horário do registro, não da visita — e podem acumular várias visitas registradas no mesmo dia. Para fins práticos, a data pode ser interpretada como aproximadamente o dia da visita, mas com essa ressalva.

### Dados disponíveis

**98 mil cadastros** de um recorte territorial específico da cidade, estruturados para preservar privacidade e ainda permitir análise.

| Dataset | Conteúdo | Relevância |
|---|---|---|
| Cadastros | Faixa etária, histórico de gestação, perfil geral | Entender o perfil do paciente sem reidentificação |
| Consultas agendadas | Agendamentos futuros | ACS pode precisar comunicar ao paciente; critério de prioridade |
| Idas a urgências/emergências | Episódios de internação ou emergência | Sinaliza escalada de prioridade na fila de visitas |
| Histórico de visitas dos ACS | Registros passados | Identificar padrões e comportamento de visitação |
| Equipes | Lista das equipes | Estrutura organizacional das equipes |

### Técnicas de anonimização aplicadas

Para liberar dados com granularidade suficiente sem comprometer a privacidade, foram aplicadas:

1. **Amostragem e embaralhamento de datas** — a sequência dos eventos foi mantida, mas as datas absolutas foram alteradas. O relacionamento temporal entre eventos é confiável; as datas exatas, não.
2. **Perturbação de endereços (100 metros de ruído)** — os endereços fazem sentido dentro do território, mas não correspondem aos endereços reais. Heatmaps e análises de distribuição espacial permanecem válidos.
3. **Supressão de casos raros** — perfis únicos (ex: única gestante de 14 anos) foram removidos para evitar reidentificação por conhecimento externo.

O shift de distribuição gerado por essas técnicas é leve. A dinâmica territorial permanece representativa.

### Recursos adicionais no repositório

- Acesso rápido aos dados
- Materiais de apoio, incluindo link para a **Biblioteca Carioca do SUS** (repositório digital de protocolos e publicações da saúde do Rio)
- Descrição do desafio
- Dicionário de dados e modelo relacional (chaves, chaves estrangeiras, relacionamentos entre tabelas)
- Arquivos em formato `.csv` (Parquet)
- Desafio bônus: descrição do processo de anonimização com referências técnicas

---

*Transcrição gerada a partir da apresentação do problema — ImpactLab / Secretaria Municipal de Saúde do Rio de Janeiro.*

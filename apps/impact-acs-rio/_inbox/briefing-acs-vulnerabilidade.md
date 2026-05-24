# Briefing oficial — Framework de Vulnerabilidade e Protocolos do ACS

**Fonte:** Briefing adicionado em `_refs/claude-impact-lab-saude/README.md` em 2026-05-24 10:46 BRT (commit `fe656fd`). Documento original: <https://docs.google.com/document/d/1hwk6J7hjSNvCJL2QLxpYUdCjB7u1ec3A/>

---

## Escala e papel do ACS

- ~6.200 ACS em **1.240 equipes** de Saúde da Família
- Cobre toda a cidade (todas as áreas programáticas), >4,5M residentes
- Cada ACS gerencia uma **microárea** de até **750 pessoas / 250-300 domicílios**

## Responsabilidades

- Manter cadastro atualizado
- Visitas domiciliares regulares
- Mapeamento territorial e identificação de risco
- **Busca ativa** de faltosos (consultas, vacinas)
- Registro sistemático

## Fluxo atual (operacional)

- Sem automação. Rotas organizadas em **reuniões semanais** da equipe
- Papel, caderno, memória
- Decisão de rota no início do turno, ajustes ad-hoc durante o dia
- Lançamento no prontuário ao retornar à clínica

---

## 🎯 Framework de Vulnerabilidade — Escala de Risco Familiar

| Categoria | Exemplos | Frequência de visita |
|---|---|---|
| **Alto risco** | Acamados/deficientes, gestantes alto risco, crianças desnutridas, usuários de drogas, famílias sem renda | **Semanal ou quinzenal** |
| **Médio risco** | Idosos frágeis, doenças crônicas descompensadas, monoparentais vulneráveis | **Quinzenal a mensal** |
| **Risco rotineiro** | Sem condições especiais | **Mensal** |

## 🎯 Protocolos por linha de cuidado

| Grupo | Frequência mínima | Sinais de alerta (disparam visita) |
|---|---|---|
| **Gestante alto risco** | **Semanal** | Faltas pré-natal, sinais clínicos |
| Gestante padrão | Mensal | Faltas pré-natal |
| Puérpera (pós-parto) | 1 visita na 1ª semana pós-alta | Faltas no teste do pezinho, internação prolongada |
| **TB em tratamento ativo** | **DIÁRIA** (TDO) | Não-adesão, efeitos adversos |
| Criança 0-2 anos | **Mensal** | Atrasos vacinais, perda de peso |
| Hipertensão / Diabetes | Mensal (quinzenal se descompensado) | Faltas a consultas, internação recente |
| Idoso frágil / acamado | **Quinzenal** | Quedas, isolamento, internação recente |
| Saúde mental | Conforme plano terapêutico | Crise, abandono de medicação |

## Gaps reconhecidos pelo briefing

- Planejamento por memória vs. dado de necessidade
- Lacunas de cobertura não detectadas
- Roteirização ineficiente
- Priorização não-sistematizada
- Comunicação fragmentada sobre internações/emergências

---

## Implicações pro nosso ataque ao problema

- **Categorias de risco mapeadas pra nossos dados:**
  - Gestante = `gestacao=True` (mas perdemos "alto risco" — fica no boolean genérico)
  - Hipertenso/Diabético = colunas booleans
  - Idoso = `faixa_etaria='66+'` (não dá pra distinguir "frágil")
  - Vulneráveis = `situacao_vulnerabilidade=True`
  - TB = **ausente no dataset** (sumido na anonimização)
  - Acamado / saúde mental / desnutrido / usuário de drogas = **ausentes** no dataset
  - "Alto risco gestacional", "descompensado" = **ausentes**
- **Sinais de alerta mapeáveis:**
  - Internação recente = `eventos_clinicos.tipo == 'urgencia-emergencia-ou-internacao'`
  - Faltas a consultas = **não temos** "compareceu/faltou", só `agendamento` (necessário inferir)
  - Quedas, atrasos vacinais, crise mental = **ausentes**
- **Os critérios "alto/médio/rotineiro" agora dão frequência de visita esperada por grupo** — permite calcular gap protocolar (visitas reais vs prescritas) e usar isso como métrica de cobertura por equipe / por família.

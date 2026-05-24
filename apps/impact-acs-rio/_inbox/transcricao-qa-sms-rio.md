# Q&A com a equipe da SMS-Rio — detalhes operacionais do ACS

**Fonte:** Sessão de Q&A com a equipe da Secretaria Municipal de Saúde do Rio durante o Claude Impact Lab. Speaker C aparenta ser **Carol Tarento** (gerente de dados, SMS-Rio) que conduziu a apresentação inicial. Outros speakers da SMS respondendo perguntas dos times.

**Por que essa transcrição importa:** tem detalhes operacionais que NÃO estavam no briefing nem na apresentação ao vivo. Inclui sistemas em uso, dinâmica concreta da reunião semanal com exemplo real, canais de comunicação já existentes, e — crítico — **o que NÃO está implementado hoje**. Esses gaps são onde nosso produto pode brilhar.

---

## 🔑 Resumo executivo — o que essa sessão adiciona

1. **WhatsApp já é canal ativo** entre equipe e pacientes ("eles usam muito"). Nossa hipótese de ingest-via-WhatsApp não precisa "introduzir" o canal — só formalizar e estruturar.
2. **Vitacare é o sistema atual** (prontuário eletrônico contratado, em uso desde 2010). Todo profissional preenche. ACS volta e digita após visita.
3. **NÃO existe escore de risco implementado hoje na prefeitura.** Carol (literal): *"Hoje a gente não tem escore de risco, por exemplo. A gente tem isso daí, mas a gente não soma escore de riscos."*
4. **Família como unidade NÃO é usada hoje.** Carol: *"Vulnerabilidade, se é por sua família que não é, isso a gente não tem."*
5. **Rotina do ACS = 10 turnos/semana** com proporção definida: 6 turnos visita + 2 acolhimento + 1 reunião + 1 administrativo.
6. **Existe um terceiro vetor de cadastro de paciente:** hoje só (a) presença em clínica ou (b) ACS visita residência. *Quem nunca foi à clínica e nunca recebeu visita não está no sistema.*
7. **Reunião semanal tem dinâmica concreta de repriorização** com exemplo: pré-natal detecta pressão alta → vira gestante de risco → ACS muda frequência de visita.
8. **Faltas são comuns por motivos não-clínicos**: violência (Cruz Vermelha verde/amarelo/vermelho), calor extremo (existe protocolo Rio premiado), chuva.

---

## 1. Rotina do ACS — turnos e ritmo

**Carga semanal padronizada (carol):** ~10 turnos/semana
- **6 turnos de visita domiciliar**
- **2 turnos de acolhimento** (ACS no guichê da clínica, recebe quem chega, cadastra, direciona pra vacina, etc.)
- **1 turno de reunião de equipe** (a famosa reunião semanal)
- **1 turno administrativo** (digitação no Vitacare, lançamento de visitas)

**Jornada diária:**
- Clínicas funcionam **segunda a sexta, 8h-20h**; algumas sábado 8h-12h
- Alguns ACS começam às 7h; outros estendem até 20h pra pegar trabalhador
- Time típico: 1 médico, 1 enfermeiro, 1 técnico de enfermagem, 5-6 ACS, equipe de apoio

**Composição variável das equipes:**
- Mínimo: 2 equipes por clínica (difícil rodar 8-20 com só duas)
- Máximo: 16 equipes (folga máxima)
- Quanto mais equipes, mais flexibilidade pra cobrir horário estendido

**Filosofia do trabalho:**
> "O trabalho do agente comunitário não é por demanda. É como se você tivesse que todo dia sentar lá e bater o seu ponto na sua mesa. O trabalho do agente comunitário é cobrir aquele território. O certo seria, todos os meses, cobrir o território inteiro." — Carol

Ou seja: a meta é cobertura, não responder a chamados. Visitas reativas (após urgência) são exceção, não regra.

---

## 2. Sistema atual: Vitacare

- **Prontuário eletrônico do paciente**, em uso desde **2010**
- **Sistema contratado** (não próprio da prefeitura — vendor externo)
- Todo mundo preenche: médico, enfermeiro, ACS — qualquer um da equipe
- **Fluxo do ACS:** visita → cadastra/anota no papel → volta pra clínica → lança no Vitacare

**Implicação pro nosso produto:** qualquer ferramenta que a gente construa hoje provavelmente precisa coexistir ao lado do Vitacare (não substituí-lo). Integração via export/import seria o caminho de produção; pra demo, ferramenta paralela é aceitável.

---

## 3. Cadastro: como uma pessoa entra no sistema

**Hoje, dois caminhos:**

1. **Atendimento na clínica** (consulta, urgência, etc.) — paciente vai à clínica → recepção cadastra → vira "paciente do território". Família dele passa a ser acompanhada.
2. **Visita domiciliar do ACS** — ACS bate na porta de uma residência nova → cadastra na hora se ainda não existe.

**Quem NÃO entra hoje:**
> "Se o cara nunca foi, ele não tá na rota."

Exemplo concreto que apareceu: idoso que morava no Grajaú foi pra Tijuca pra ficar com a filha. A filha teve que **ir à clínica da família** pra cadastrá-lo no sistema novo, e só depois passou a receber visita do ACS local.

**Implicação pra produto:** facilitar o caminho 2 (e talvez criar um caminho 3 via WhatsApp) é vetor de impacto direto — captura quem hoje está invisível ao sistema.

---

## 4. A reunião semanal — dinâmica concreta com exemplo

Esse é o coração do processo de repriorização que tínhamos visto antes só em alto nível. Agora temos exemplo concreto.

**Composição da reunião:** ACS + enfermeiro + médico + psicólogo + outros profissionais da equipe.

**Função real:** *não* é onde tudo se decide — Carol diz que o ACS *já sabe o que tem que fazer*. A reunião é:
- **Momento de repriorizar** com base no que aconteceu na semana
- **Adicionar coisas novas** que surgiram durante atendimentos

**Exemplo dado pela Carol (gold pro nosso pitch):**

> "Eu posso estar fazendo um pré-natal lá [como enfermeira], e vi que uma gestante que estava super bem começou a ter pressão alta. Eu posso chegar pra gente [ACS] com um comentário e falar assim, ó, eu quero que você acompanhe essa gestante aqui. Ela vai ter que vir aqui na clínica, ela vai ter que medir a pressão todos os dias. Passa lá pra lembrar ela, pra saber se ela fez a pressão."

E completa:
> "Essa gestante é uma gestante que precisaria ser acompanhada pelo agente comunitário em uma visita mensal. Só que agora, depois que ela passou em uma consulta comigo, ela passou a se tornar uma gestante de risco, porque a pressão dela está alta."

**Pontos extraíveis:**
- Mudança de classificação de risco acontece em **eventos clínicos** (consulta detecta algo)
- Hoje essa mudança é **comunicada verbalmente na reunião** (ou em conversa direta enfermeira → ACS)
- O ACS atualiza mentalmente a frequência da gestante: mensal → semanal
- **Não há registro estruturado dessa mudança** — vira conhecimento tácito
- "Botou caderninho" — anotações em papel são onde isso vive

**Vínculo é princípio:**
> "Vínculo é um princípio importante para quem trabalha em uma equipe de saúde da família. Saúde e confiança. E é vínculo com médico, com enfermeiro, com agentes comunitários."

ACS mora no território — pré-requisito. Conhece a vizinhança. Sabe que "seu João é alcoólatra", que "fulano teve neném essa semana". Esse capital de confiança é central pra função.

---

## 5. Comunicação atual com pacientes — WhatsApp já é o canal

> *Speaker E (participante):* "Existe uma comunicação com os pacientes? Tipo, WhatsApp, SMS?"
>
> *Carol:* "Isso, hoje existe. SMS a gente não tem, mas tem o WhatsApp da equipe e a pessoa pode se comunicar ali. **Eles usam muito o WhatsApp.**"
>
> *Speaker E:* "Os pacientes aderem a essa comunicação?"
>
> *Carol:* "Aderem a essa comunicação. **No Brasil, o WhatsApp é um super.**"

**Implicações enormes:**
- WhatsApp **da equipe** (não do ACS individual) — é o canal oficial
- Pacientes já interagem por ele
- Não precisamos "introduzir" o canal — só formalizar/estruturar a interação
- O que pode mudar: hoje a conversa é livre, sem estrutura. Nosso produto pode plugar aqui sem fricção de adoção.

---

## 6. Particularidades territoriais

**Tipos de área no recorte do dataset:**
- **Asfalto** — prédios, áreas como Tijuca, Copacabana, Leblon (não mencionado mas exemplificado pelo contraste). Característica: muita gente com plano de saúde, menos demanda do SUS.
- **Favela / morro** — onde mora o grosso dos territórios prioritários

O recorte do dataset é uma **área diversificada** (favela + asfalto). Carol comentou que "tem bastante área do asfalto" — então é representativo de uma região mista do Rio.

**Mobilidade do ACS:**
- Padrão: a pé
- Quando precisa, pega ônibus
- Casos extremos: Ilha de Paquetá / Gigoia — ACS pega barquinho

**Riscos territoriais:**
- **Violência**: protocolo de segurança da Cruz Vermelha
  - **Verde**: tudo normal
  - **Amarelo**: suspende visitas, clínica continua funcionando
  - **Vermelho**: fecha tudo
- **Clima**: protocolo de calor extremo (Rio ganhou prêmio por isso) — ACS evita rua em temperaturas muito elevadas
- **Chuva intensa**: também suspende visitas

**Demarcação territorial:**
- IBGE 2022 usado pra dividir territórios (lat/lng oficial)
- Media de 3.2 pessoas/família → 750 pessoas/microárea ≈ **300-350 famílias por ACS**
- Exemplo de mix típico de uma microárea: 50 gestantes + 200 crianças + 100 idosos + 400 jovens trabalhadores ativos

---

## 7. O que NÃO existe hoje — gaps explícitos de produto

Citações literais que justificam features do nosso produto:

| Gap atual | Citação | Oportunidade |
|---|---|---|
| **Sem escore de risco** | "Hoje a gente não tem escore de risco, por exemplo. A gente tem isso daí [vulnerabilidade, escore de risco descritos no briefing] mas a gente não soma escore de riscos." | Implementar escore composto |
| **Sem unidade família** | "Vulnerabilidade, se é por sua família que não é, isso a gente não tem." | Família como entidade canônica (nossa hipótese se confirma como diferenciada) |
| **Repriorização fica em "caderninho"** | "Botou caderninho. Tem muita gente pra botar caderninho." | Captura estruturada da reunião semanal (transcrição/sintetizada) |
| **Conhecimento tácito do território** | "Esse conhecimento tá na cabeça de cada um deles." | Capturar via voz/notas pós-visita |
| **WhatsApp não estruturado** | "Tem o WhatsApp da equipe e a pessoa pode se comunicar ali." (sem fluxo definido) | Estruturar templates: confirmação, follow-up, alerta |
| **Mudança de status não-registrada** | Exemplo da gestante que vira "de risco" e a frequência muda só pela palavra | Mudança de classificação capturada em evento clínico → propaga pra rota do ACS |
| **Quem nunca foi à clínica é invisível** | "Se o cara nunca foi, ele não tá na rota." | Cadastro via WhatsApp ou via vizinhança (família) |

---

## 8. Outros pontos pontuais valiosos

- **Não é só o ACS que visita**: médico, enfermeiro, técnico de enfermagem também têm plano de visita. ACS é o **captador da informação**.
- **Exemplos de visita por outros profissionais**: gestante obesa com dificuldade de deslocamento (enfermeira fazia pré-natal em casa); idoso acamado (vacinação domiciliar).
- **ACS é nível médio** com formação técnica recente (técnico de ACS já existe). Maior valor é **conhecer o território**.
- **Pré-requisito ACS**: morar no território. Por isso não existe ACS no Leblon na prática (Carol: "não tem ensino médio no Leblon, normalmente").
- **Faltas do paciente são comuns**: pessoa não estava em casa, foi vacinar em outro lugar, está trabalhando, etc. Visita "perdida" não é fracasso — é parte da realidade.
- **750 pessoas/microárea ≈ 300-350 famílias** (média 3.2 pessoas/família). Esse número 3.2 é importante pra calibrar nossa inferência espacial de família.

---

## 9. Frases que valem citar no pitch ou demo

- *"Esse conhecimento tá na cabeça de cada um deles."* (Carol, sobre conhecimento tácito do território)
- *"Hoje a gente não tem escore de risco."* (Carol)
- *"Vulnerabilidade, se é por sua família que não é, isso a gente não tem."* (Carol)
- *"Botou caderninho. Tem muita gente pra botar caderninho."* (Carol, descrevendo reunião semanal)
- *"O trabalho do agente comunitário é cobrir aquele território. O certo seria, todos os meses, cobrir o território inteiro."* (Carol — fixa a meta)
- *"No Brasil, o WhatsApp é um super."* (Carol — valida nosso canal)
- *"Se o cara nunca foi, ele não tá na rota."* (Carol — define o gap do invisível)
- *"Vínculo é princípio."* (Carol, sobre saúde da família)

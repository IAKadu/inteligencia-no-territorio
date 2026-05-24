# Impact — Claude Impact Hackathon (Rio)

Repo sandbox da participacao do Peter no Claude Impact, hackathon da Anthropic no Rio.
Tema: **saude ou seguranca**. Formato: dataset entregue no evento, solucao construida em poucas horas.

## Regras do repo

- **`_inbox/`** — documentos e dados brutos do evento (transcricoes, briefings, datasets em `_inbox/data/`). **Vai pro git** (sincronizado entre o time). Manter conteudo bruto sem renomear; versoes processadas vao para `scripts/` ou `src/`.
- **`_refs/`** — repos externos de referencia, clonados como subrepos independentes (cada um com seu `.git/`). **ZONA READ-ONLY** (ver regra abaixo). **NAO vai pro git** deste repo — cada pessoa do time clona localmente (ver "Setup / onboarding" abaixo).
- **`src/`** — codigo da solucao.
- **`scripts/`** — scripts de exploracao, ETL, one-shots.
- **`notes/`** — anotacoes livres do Peter durante o evento.
- **`docs/`** — documentacao final / writeup / apresentacao.
- **`.venv/`** — virtualenv Python local. Gitignored.

### `_refs/` — zona read-only (regra dura)

Os repos clonados em `_refs/` sao nossa base de dados/referencia preservada para mineracao. **NUNCA modificar nada dentro de `_refs/`**:

- Nao editar, renomear, mover ou deletar arquivos em `_refs/**`.
- Nao rodar `git commit`, `git checkout`, `git reset`, `git pull` ou qualquer outra operacao git em `_refs/**` sem instrucao explicita do Peter.
- Nao criar arquivos novos dentro de `_refs/**` (nem caches, nem outputs).
- Leitura, grep, copia para fora (`_inbox/`, `src/`, `scripts/`, `notes/`) — tudo liberado.
- Se um script Python ou ETL precisar processar dados de `_refs/`, ler de la e escrever o resultado fora. Nunca escrever de volta em `_refs/`.

Repos atualmente em `_refs/`:
- `claude-impact-lab-rio/` — instrucoes gerais do hackathon (taicor-ai)
- `claude-impact-lab-saude/` — dataset do projeto de saude (prefeitura-rio), tema central do grupo

### Repos externos do time (fora deste diretorio) — read-only

Alem de `_refs/`, existem repos do time clonados em outros caminhos do disco. Eles servem como **fonte de conhecimento** (codigo, analises, design) para portar ideias e materiais para este repo, que e a fonte de verdade. As mesmas regras de read-only do `_refs/` se aplicam: **nunca write, nunca git, so leitura e copia para fora**.

Repos externos atualmente acompanhados:

| Path absoluto | Origem | Conteudo util |
|---|---|---|
| `/Users/peterflag/Documents/Projects/inteligencia-no-territorio/` | Dev parceiro do Peter | Frontend HTML estatico (gestor + ACS), pipeline Python (score, invisiveis, roteirizacao), 15 analises em MD, regua de visitas YAML |

Regras (espelham as do `_refs/`):

- Nao editar, renomear, mover ou deletar arquivos dentro desses paths.
- Nao rodar `git commit`, `git checkout`, `git reset`, `git push` ou qualquer outra operacao git que modifique o repo externo. O **unico** comando git permitido e `git pull` (e so quando o Peter pedir explicitamente, para sincronizar com o trabalho atualizado do parceiro).
- Nao criar arquivos novos la dentro (nem caches, nem outputs, nem `.venv`).
- Leitura, grep, copia para dentro do repo Impact (`_inbox/`, `docs/`, `scripts/`, `src/`) — tudo liberado.
- Quando portar codigo, **reescrever no padrao do Impact** (TS no backend Hono, React/Next no frontend, Cera Pro como fonte, brand Prefeitura Rio que ja temos em `_inbox/brandbook.html`). Nao copiar Python ou HTML literalmente.

## Setup / onboarding (para novos membros do time)

Depois de `git clone` deste repo, rodar:

```bash
# 1. Clonar os repos de referencia em _refs/ (read-only, nao vao pro git deste repo)
mkdir -p _refs && cd _refs
git clone https://github.com/taicor-ai/claude-impact-lab-rio.git
git clone https://github.com/prefeitura-rio/claude-impact-lab-saude.git
cd ..

# 2. Criar virtualenv Python e instalar dependencias
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

Os datasets em formato Parquet ja vem comitados em `_inbox/data/` (sao anonimizados). Se quiser baixar dos links originais do Google Drive, ver `_refs/claude-impact-lab-saude/README.md`.

### Atualizar os repos de referencia

```bash
cd _refs/claude-impact-lab-rio && git pull && cd ../..
cd _refs/claude-impact-lab-saude && git pull && cd ../..
```

Rodar isso so se o organizador anunciar update. Esses repos nao vao mudar mais durante o evento.

## Fluxo de trabalho

- Hackathon = timebox curto. Priorizar **brainstorming** antes de codar e **plans** antes de implementacoes nao-triviais.
- Usar **skills do superpowers** pesado: `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `dispatching-parallel-agents`, `systematic-debugging`.
- Antes de declarar algo "pronto", rodar verificacao real (skill `verification-before-completion`). Sem alegacoes de sucesso sem evidencia.

# Fase 3 — Agenda diária por equipe (backend)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Endpoint `GET /api/equipes/:equipe_id/agenda?capacidade=N&com_justificativas=bool` que retorna a agenda diária otimizada: top N pacientes da equipe ordenados por score, rota nearest-neighbor a partir da sede da equipe, e (opcionalmente) justificativa em linguagem natural gerada pelo Claude Haiku.

**Architecture:** Lógica de roteirização e justificativa fica em módulos isolados de `src/lib/`. O endpoint orquestra: query → seleção top N → reordenação por NN a partir da sede → enriquecimento com distâncias → (opt) justificativa. Sede da equipe vem de `equipes(endereco_latitude, endereco_longitude)`. Distância via Haversine (mesma fórmula do dev parceiro). Justificativa via Claude Haiku 4.5 com fallback determinístico.

**Tech Stack:** Node 20 + TS + Hono + `postgres` + Anthropic SDK + Haversine puro (sem dependência externa).

---

## File Structure

**Create:**
- `src/backend/src/lib/routing.ts` — Haversine + nearest-neighbor + `buildAgenda(equipe_id, capacidade)`.
- `src/backend/src/lib/justificativas.ts` — `gerarJustificativa(paciente)` com fallback determinístico + Claude opcional.
- `src/backend/src/prompts/justificativa-visita.md` — template do prompt (curto).

**Modify:**
- `src/backend/src/lib/db.ts` — adicionar `getEquipeSede(equipe_id)` e `getCandidatosAgenda(equipe_id, limit)`.
- `src/backend/src/index.ts` — registrar rota `/api/equipes/:equipe_id/agenda`.
- `src/backend/src/lib/chat-tools.ts` — adicionar tool `query_agenda_equipe` (opcional, recomendado).

**Não modificar:** `scoring.ts`, schema do banco. A Fase 3 é leitura.

---

### Task 1: Helpers de db para agenda

**Files:**
- Modify: `src/backend/src/lib/db.ts` (append no final)

- [ ] **Step 1: Adicionar `getEquipeSede` e `getCandidatosAgenda`**

Append ao final de `src/backend/src/lib/db.ts`:

```typescript

// ── Fase 3: agenda diaria por equipe ──────────────────────────────────────

export interface EquipeSede {
  equipe_id: string;
  endereco_latitude: number;
  endereco_longitude: number;
}

export async function getEquipeSede(equipe_id: string): Promise<EquipeSede | null> {
  const rows = await sql<EquipeSede[]>`
    SELECT equipe_id, endereco_latitude, endereco_longitude
    FROM equipes
    WHERE equipe_id = ${equipe_id}
  `;
  return rows[0] ?? null;
}

export interface CandidatoAgenda {
  paciente_id: string;
  equipe_id: string;
  faixa_etaria: string;
  hipertenso: number;
  diabetico: number;
  gestacao: number;
  situacao_vulnerabilidade: number;
  endereco_latitude: number;
  endereco_longitude: number;
  score: number;
  prioridade: string | null;
  fatores: string[];
  flag_invisivel: boolean;
  flag_crise_sem_vinculo: boolean;
  ultima_visita: string | null;
  dias_sem_visita: number;
  n_urg_30d: number;
  n_urg_ano: number;
  tem_agendamento_futuro: boolean;
}

export async function getCandidatosAgenda(equipe_id: string, limit: number): Promise<CandidatoAgenda[]> {
  // Top N pacientes da equipe por score desc. Inclui campos necessarios pra justificativa.
  const rows = await sql<Array<CandidatoAgenda & { fatores: unknown; ultima_visita: string | null }>>`
    SELECT
      p.paciente_id, p.equipe_id, p.faixa_etaria,
      p.hipertenso, p.diabetico, p.gestacao, p.situacao_vulnerabilidade,
      p.endereco_latitude, p.endereco_longitude,
      COALESCE(s.score, 0)::float                                     AS score,
      s.prioridade,
      COALESCE(s.fatores, '[]'::jsonb)                                AS fatores,
      COALESCE(s.flag_invisivel, FALSE)                               AS flag_invisivel,
      COALESCE(s.flag_crise_sem_vinculo, FALSE)                       AS flag_crise_sem_vinculo,
      (SELECT MAX(registrados_em)::text FROM visitas v
        WHERE v.paciente_id = p.paciente_id)                          AS ultima_visita,
      COALESCE(
        (SELECT (DATE '2025-12-31' - MAX(registrados_em))::int FROM visitas v
          WHERE v.paciente_id = p.paciente_id),
        999
      )::int                                                          AS dias_sem_visita,
      (SELECT COUNT(*)::int FROM eventos_clinicos e
        WHERE e.paciente_id = p.paciente_id
          AND e.tipo = 'urgencia-emergencia-ou-internacao'
          AND e.data_referencia >= DATE '2025-12-31' - INTERVAL '30 days') AS n_urg_30d,
      (SELECT COUNT(*)::int FROM eventos_clinicos e
        WHERE e.paciente_id = p.paciente_id
          AND e.tipo = 'urgencia-emergencia-ou-internacao')           AS n_urg_ano,
      EXISTS(SELECT 1 FROM eventos_clinicos e
        WHERE e.paciente_id = p.paciente_id
          AND e.tipo = 'agendamento'
          AND e.data_referencia > DATE '2025-12-31')                  AS tem_agendamento_futuro
    FROM pacientes p
    LEFT JOIN pacientes_scores s USING (paciente_id)
    WHERE p.equipe_id = ${equipe_id}
      AND COALESCE(s.score, 0) > 0
    ORDER BY score DESC
    LIMIT ${limit}
  `;
  return rows.map(r => ({ ...r, fatores: (r.fatores as string[]) ?? [] }));
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/peterflag/Documents/Projects/Impact/src/backend && npx tsc --noEmit 2>&1 | tail -10`

Expected: only the pre-existing `db.ts:232` error.

- [ ] **Step 3: Smoke test**

```bash
cd /Users/peterflag/Documents/Projects/Impact/src/backend && npx tsx -e "
import { sql, getEquipeSede, getCandidatosAgenda } from './src/lib/db.js';
const [{ equipe_id }] = await sql\`SELECT equipe_id FROM equipes LIMIT 1\`;
console.log('Equipe:', equipe_id);
const sede = await getEquipeSede(equipe_id);
console.log('Sede:', sede);
const cands = await getCandidatosAgenda(equipe_id, 5);
console.log('Top 5 candidatos:');
console.table(cands.map(c => ({ id: c.paciente_id.slice(0,8), score: c.score, prioridade: c.prioridade, dias_sv: c.dias_sem_visita, urg_30: c.n_urg_30d })));
await sql.end();
"
```

Expected: 1 sede com lat/lon, e 5 candidatos com score > 0. Como o rescore não rodou completo, pode haver poucos candidatos com score > 0 em algumas equipes; se a primeira equipe não retornar candidatos, é OK.

- [ ] **Step 4: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/src/lib/db.ts
git commit -m "feat(db): getEquipeSede e getCandidatosAgenda para Fase 3"
```

---

### Task 2: Módulo de roteirização (Haversine + Nearest Neighbor)

**Files:**
- Create: `src/backend/src/lib/routing.ts`

- [ ] **Step 1: Criar o arquivo**

```typescript
/**
 * Roteirização nearest-neighbor a partir da sede da equipe.
 * Portado de inteligencia-no-territorio/projeto/pipeline/routing.py.
 * Distancia: Haversine (km).
 */

export interface Ponto {
  lat: number;
  lon: number;
}

export function haversineKm(a: Ponto, b: Ponto): number {
  const R = 6371.0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Retorna os indices de `pontos` na ordem de visita (NN a partir de `origem`).
 */
export function nearestNeighborOrder(origem: Ponto, pontos: Ponto[]): number[] {
  const restantes = new Set<number>(pontos.map((_, i) => i));
  const rota: number[] = [];
  let atual = origem;

  while (restantes.size > 0) {
    let melhor = -1;
    let melhorDist = Infinity;
    for (const i of restantes) {
      const d = haversineKm(atual, pontos[i]);
      if (d < melhorDist) {
        melhorDist = d;
        melhor = i;
      }
    }
    rota.push(melhor);
    atual = pontos[melhor];
    restantes.delete(melhor);
  }

  return rota;
}

export interface RotaItem<T> {
  ordem_visita: number;
  paciente: T;
  distancia_anterior_km: number;
  distancia_acumulada_km: number;
}

/**
 * Ordena `candidatos` (cada um com `endereco_latitude`/`endereco_longitude`)
 * em uma rota NN a partir da sede. Retorna lista enriquecida.
 */
export function buildRota<T extends { endereco_latitude: number; endereco_longitude: number }>(
  sede: Ponto,
  candidatos: T[],
): RotaItem<T>[] {
  if (candidatos.length === 0) return [];

  const pontos: Ponto[] = candidatos.map(c => ({ lat: c.endereco_latitude, lon: c.endereco_longitude }));
  const ordem = nearestNeighborOrder(sede, pontos);

  const itens: RotaItem<T>[] = [];
  let acumulado = 0;
  let anterior: Ponto = sede;

  ordem.forEach((idx, i) => {
    const p = candidatos[idx];
    const ponto: Ponto = { lat: p.endereco_latitude, lon: p.endereco_longitude };
    const d = haversineKm(anterior, ponto);
    acumulado += d;
    itens.push({
      ordem_visita: i + 1,
      paciente: p,
      distancia_anterior_km: Math.round(d * 100) / 100,
      distancia_acumulada_km: Math.round(acumulado * 100) / 100,
    });
    anterior = ponto;
  });

  return itens;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: 0 new errors.

- [ ] **Step 3: Sanity test (Haversine + NN)**

```bash
cd /Users/peterflag/Documents/Projects/Impact/src/backend && npx tsx -e "
import { haversineKm, buildRota } from './src/lib/routing.js';

// Sanity Haversine: Rio (~-22.9, -43.2) a Niteroi (~-22.9, -43.1) ≈ 10km
const d = haversineKm({ lat: -22.9, lon: -43.2 }, { lat: -22.9, lon: -43.1 });
console.log('Rio-Niteroi:', d.toFixed(2), 'km (esperado ~10)');

// NN simples: sede no (0,0), 3 pontos: (1,1), (2,2), (5,5) — ordem esperada (1,1)→(2,2)→(5,5)
const rota = buildRota({ lat: 0, lon: 0 }, [
  { endereco_latitude: 5, endereco_longitude: 5, id: 'C' },
  { endereco_latitude: 1, endereco_longitude: 1, id: 'A' },
  { endereco_latitude: 2, endereco_longitude: 2, id: 'B' },
]);
console.log('Ordem NN:', rota.map(r => r.paciente.id).join(' → '));
console.log('Esperado:    A → B → C');
"
```

Expected: distância Rio-Niteroi entre 8 e 12 km. Ordem NN = `A → B → C`.

- [ ] **Step 4: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/src/lib/routing.ts
git commit -m "feat(lib): roteirizacao Haversine + Nearest Neighbor"
```

---

### Task 3: Módulo de justificativas (fallback + Claude opcional)

**Files:**
- Create: `src/backend/src/prompts/justificativa-visita.md`
- Create: `src/backend/src/lib/justificativas.ts`

- [ ] **Step 1: Criar o prompt template**

`src/backend/src/prompts/justificativa-visita.md`:

```markdown
Você é um assistente de saúde da família do Rio de Janeiro. Gere uma instrução curta (2-3 linhas) para o Agente Comunitário de Saúde (ACS) sobre por que visitar este paciente e o que verificar na visita.

Seja direto, clínico e acionável. Use português simples, sem jargão técnico. Não sugira diagnósticos. Não use mais de 3 linhas.

Perfil do paciente: {contexto}
```

- [ ] **Step 2: Criar o módulo**

`src/backend/src/lib/justificativas.ts`:

```typescript
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claude, SMALL_MODEL_ID } from './anthropic.js';
import type { CandidatoAgenda } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROMPT_TEMPLATE = readFileSync(
  resolve(__dirname, '../prompts/justificativa-visita.md'),
  'utf-8',
);

const FALLBACKS: Record<string, string> = {
  crise_sem_vinculo:
    'Paciente com histórico de urgências sem acompanhamento prévio. Realizar primeiro contato, avaliar situação e iniciar vínculo de cuidado.',
  urgencia_recente:
    'Paciente com atendimento de urgência recente. Verificar o que ocorreu, checar evolução e avaliar necessidade de encaminhamento.',
  invisivel:
    'Primeiro contato com este paciente. Apresentar-se, verificar condições de saúde e iniciar vínculo com a equipe.',
  gestante:
    'Gestante em acompanhamento. Verificar andamento do pré-natal, checar pressão arterial e adesão às orientações de saúde.',
  faixa_0_6:
    'Criança em faixa etária prioritária. Verificar desenvolvimento, calendário vacinal e condições gerais de saúde.',
  hipertenso_diabetico:
    'Paciente com hipertensão e diabetes. Verificar pressão arterial, glicemia, adesão à medicação e sinais de complicações.',
  hipertenso:
    'Paciente hipertenso. Verificar pressão arterial, adesão ao tratamento e eventuais queixas.',
  diabetico:
    'Paciente diabético. Verificar glicemia, pés, adesão ao tratamento e sinais de complicações.',
  idoso:
    'Idoso em acompanhamento. Verificar condições gerais, mobilidade, medicações e rede de suporte.',
  default:
    'Visita de acompanhamento rotineiro. Verificar condições gerais de saúde e necessidades do paciente.',
};

function fallback(c: CandidatoAgenda): string {
  if (c.flag_crise_sem_vinculo)                   return FALLBACKS.crise_sem_vinculo;
  if (c.n_urg_30d > 0)                            return FALLBACKS.urgencia_recente;
  if (c.flag_invisivel)                           return FALLBACKS.invisivel;
  if (c.gestacao === 1)                           return FALLBACKS.gestante;
  if (c.faixa_etaria === '0-6')                   return FALLBACKS.faixa_0_6;
  if (c.hipertenso === 1 && c.diabetico === 1)    return FALLBACKS.hipertenso_diabetico;
  if (c.hipertenso === 1)                         return FALLBACKS.hipertenso;
  if (c.diabetico === 1)                          return FALLBACKS.diabetico;
  if (c.faixa_etaria === '66+')                   return FALLBACKS.idoso;
  return FALLBACKS.default;
}

function montaContexto(c: CandidatoAgenda): string {
  const partes: string[] = [];

  if (c.flag_crise_sem_vinculo)
    partes.push(`${c.n_urg_ano} idas à urgência no último ano, sem nenhuma visita prévia do ACS`);
  else if (c.flag_invisivel)
    partes.push('nunca recebeu visita do ACS');

  const cond: string[] = [];
  if (c.gestacao === 1) cond.push('gestante');
  if (c.hipertenso === 1 && c.diabetico === 1) cond.push('hipertenso e diabético');
  else if (c.hipertenso === 1) cond.push('hipertenso');
  else if (c.diabetico === 1) cond.push('diabético');
  if (c.faixa_etaria === '0-6') cond.push('criança (0-6 anos)');
  if (c.faixa_etaria === '66+') cond.push('idoso (66+ anos)');
  if (c.situacao_vulnerabilidade === 1) cond.push('em situação de vulnerabilidade social');
  if (cond.length > 0) partes.push(`condições: ${cond.join(', ')}`);

  if (c.dias_sem_visita < 999) partes.push(`última visita há ${c.dias_sem_visita} dias`);
  else                          partes.push('sem registro de visitas anteriores');

  if (c.n_urg_30d > 0) partes.push(`${c.n_urg_30d} urgência(s) nos últimos 30 dias`);

  if (c.tem_agendamento_futuro) partes.push('tem consulta agendada próxima');

  return partes.length > 0 ? partes.join('; ') : 'sem condições especiais identificadas';
}

/**
 * Gera justificativa. Usa Claude Haiku se a env var ANTHROPIC_API_KEY estiver setada;
 * fallback determinístico em qualquer outro caso.
 */
export async function gerarJustificativa(c: CandidatoAgenda): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return fallback(c);

  const prompt = PROMPT_TEMPLATE.replace('{contexto}', montaContexto(c));

  try {
    const resp = await claude.messages.create({
      model: SMALL_MODEL_ID,
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = resp.content.find(b => b.type === 'text');
    if (!block || block.type !== 'text') return fallback(c);
    return block.text.trim();
  } catch {
    return fallback(c);
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: 0 new errors.

- [ ] **Step 4: Smoke test (verifica fallback e Claude)**

```bash
cd /Users/peterflag/Documents/Projects/Impact/src/backend && npx tsx -e "
import { sql, getCandidatosAgenda } from './src/lib/db.js';
import { gerarJustificativa } from './src/lib/justificativas.js';
const [{ equipe_id }] = await sql\`SELECT equipe_id FROM equipes LIMIT 1\`;
const cands = await getCandidatosAgenda(equipe_id, 2);
if (cands.length === 0) { console.log('Sem candidatos nessa equipe'); process.exit(0); }
for (const c of cands) {
  const j = await gerarJustificativa(c);
  console.log('---');
  console.log('Paciente:', c.paciente_id.slice(0,8), 'score:', c.score);
  console.log('Justif:', j);
}
await sql.end();
"
```

Expected: 2 justificativas curtas (2-3 linhas cada). Com `ANTHROPIC_API_KEY` ativa: textos variados, contextualizados. Sem a key: textos vindos do `FALLBACKS`.

- [ ] **Step 5: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/src/prompts/justificativa-visita.md src/backend/src/lib/justificativas.ts
git commit -m "feat(lib): justificativas com Claude Haiku + fallback deterministico"
```

---

### Task 4: Função `buildAgenda` orquestradora

**Files:**
- Modify: `src/backend/src/lib/routing.ts` (append no final)

- [ ] **Step 1: Adicionar função `buildAgenda` no final do arquivo**

Append ao final de `src/backend/src/lib/routing.ts`:

```typescript

import { getEquipeSede, getCandidatosAgenda, type CandidatoAgenda } from './db.js';
import { gerarJustificativa } from './justificativas.js';

export interface AgendaItem {
  ordem_visita: number;
  paciente_id: string;
  faixa_etaria: string;
  hipertenso: number;
  diabetico: number;
  gestacao: number;
  situacao_vulnerabilidade: number;
  score: number;
  prioridade: string | null;
  flag_invisivel: boolean;
  flag_crise_sem_vinculo: boolean;
  dias_sem_visita: number;
  n_urg_30d: number;
  n_urg_ano: number;
  tem_agendamento_futuro: boolean;
  distancia_anterior_km: number;
  distancia_acumulada_km: number;
  endereco_latitude: number;
  endereco_longitude: number;
  justificativa: string | null;
}

export interface Agenda {
  equipe_id: string;
  sede: { lat: number; lon: number };
  capacidade: number;
  total_itens: number;
  distancia_total_km: number;
  agenda: AgendaItem[];
}

const CAPACIDADE_PADRAO = 6;

export async function buildAgenda(opts: {
  equipe_id: string;
  capacidade?: number;
  com_justificativas?: boolean;
}): Promise<Agenda | null> {
  const cap = opts.capacidade ?? CAPACIDADE_PADRAO;
  const sede = await getEquipeSede(opts.equipe_id);
  if (!sede) return null;

  const candidatos = await getCandidatosAgenda(opts.equipe_id, cap);
  const rota = buildRota({ lat: sede.endereco_latitude, lon: sede.endereco_longitude }, candidatos);

  const itens: AgendaItem[] = [];
  for (const r of rota) {
    const c = r.paciente;
    const justificativa = opts.com_justificativas ? await gerarJustificativa(c) : null;
    itens.push({
      ordem_visita: r.ordem_visita,
      paciente_id: c.paciente_id,
      faixa_etaria: c.faixa_etaria,
      hipertenso: c.hipertenso,
      diabetico: c.diabetico,
      gestacao: c.gestacao,
      situacao_vulnerabilidade: c.situacao_vulnerabilidade,
      score: c.score,
      prioridade: c.prioridade,
      flag_invisivel: c.flag_invisivel,
      flag_crise_sem_vinculo: c.flag_crise_sem_vinculo,
      dias_sem_visita: c.dias_sem_visita,
      n_urg_30d: c.n_urg_30d,
      n_urg_ano: c.n_urg_ano,
      tem_agendamento_futuro: c.tem_agendamento_futuro,
      distancia_anterior_km: r.distancia_anterior_km,
      distancia_acumulada_km: r.distancia_acumulada_km,
      endereco_latitude: c.endereco_latitude,
      endereco_longitude: c.endereco_longitude,
      justificativa,
    });
  }

  const distancia_total_km = itens.length > 0 ? itens[itens.length - 1].distancia_acumulada_km : 0;

  return {
    equipe_id: opts.equipe_id,
    sede: { lat: sede.endereco_latitude, lon: sede.endereco_longitude },
    capacidade: cap,
    total_itens: itens.length,
    distancia_total_km,
    agenda: itens,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: 0 new errors. (O import circular potencial entre `routing.ts → db.ts` está ok porque `db.ts` não importa `routing.ts`.)

- [ ] **Step 3: Smoke test integrado**

```bash
cd /Users/peterflag/Documents/Projects/Impact/src/backend && npx tsx -e "
import { sql } from './src/lib/db.js';
import { buildAgenda } from './src/lib/routing.js';

// Pega uma equipe que tenha algum candidato com score>0
const eqs = await sql\`
  SELECT p.equipe_id FROM pacientes p
  JOIN pacientes_scores s USING (paciente_id)
  WHERE s.score > 0
  GROUP BY p.equipe_id LIMIT 1
\`;
if (eqs.length === 0) { console.log('Nenhuma equipe com pacientes scored (>0). Rode rescore_all primeiro.'); process.exit(0); }
const equipe_id = eqs[0].equipe_id;

const sem = await buildAgenda({ equipe_id, capacidade: 4, com_justificativas: false });
console.log('=== SEM JUSTIFICATIVAS ===');
console.log('Equipe:', equipe_id.slice(0,8), '| Total:', sem.total_itens, '| Dist total:', sem.distancia_total_km, 'km');
console.table(sem.agenda.map(a => ({ ord: a.ordem_visita, id: a.paciente_id.slice(0,8), score: a.score, prior: a.prioridade, dist: a.distancia_anterior_km })));

const com = await buildAgenda({ equipe_id, capacidade: 2, com_justificativas: true });
console.log('=== COM JUSTIFICATIVAS (2 itens) ===');
for (const a of com.agenda) {
  console.log(\`Visita \${a.ordem_visita} | score \${a.score} | \${a.prioridade}\`);
  console.log(\`  \${a.justificativa}\`);
  console.log(\`  Dist: \${a.distancia_anterior_km} km\\n\`);
}

await sql.end();
"
```

Expected: 4 itens sem justificativa (rápido) + 2 itens com justificativa (cada um com texto curto da Claude Haiku ou do fallback). Distância acumulada crescente. `ordem_visita` 1, 2, 3, 4.

- [ ] **Step 4: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/src/lib/routing.ts
git commit -m "feat(lib): buildAgenda orquestra sede + rota NN + justificativas"
```

---

### Task 5: Rota HTTP `/api/equipes/:equipe_id/agenda`

**Files:**
- Modify: `src/backend/src/index.ts`

- [ ] **Step 1: Adicionar import**

Localizar a linha:
```typescript
import { recomputeAndSave } from './lib/scoring.js';
```

E logo abaixo adicionar:
```typescript
import { buildAgenda } from './lib/routing.js';
```

- [ ] **Step 2: Adicionar a rota**

Encontrar o bloco da rota `/api/gestao/invisiveis` (a última rota antes de `/api/patients` ou similar). Logo após o `});` que fecha essa rota, adicionar:

```typescript

app.get('/api/equipes/:equipe_id/agenda', async (c) => {
  try {
    const equipe_id = c.req.param('equipe_id');
    const capStr = c.req.query('capacidade');
    const comStr = c.req.query('com_justificativas');

    const capacidade = capStr ? Math.max(1, Math.min(50, Number(capStr))) : undefined;
    const com_justificativas = comStr === 'true' || comStr === '1';

    const agenda = await buildAgenda({ equipe_id, capacidade, com_justificativas });
    if (!agenda) {
      return c.json({ error: `equipe ${equipe_id} não encontrada` }, 404);
    }
    return c.json(agenda);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: 0 new errors.

- [ ] **Step 4: Smoke test via curl**

Start backend in background, then curl. Use `run_in_background: true`:

```bash
# (em background) npm run dev
sleep 5

# pega uma equipe valida
EID=$(curl -s http://localhost:3001/api/patients?limit=1 | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['equipe_id'])")
echo "Testando equipe: $EID"

# sem justificativas (rapido)
curl -s "http://localhost:3001/api/equipes/$EID/agenda?capacidade=3&com_justificativas=false" | head -c 600
echo
echo "---"

# com justificativas (vai chamar Claude)
curl -s "http://localhost:3001/api/equipes/$EID/agenda?capacidade=2&com_justificativas=true" | head -c 1000
```

Expected:
- Status 200 com JSON contendo `equipe_id`, `sede`, `capacidade`, `total_itens`, `distancia_total_km`, `agenda` (array).
- Cada item da agenda tem `ordem_visita`, `paciente_id`, `score`, `prioridade`, `distancia_anterior_km`, `justificativa` (null ou texto curto).
- 404 em equipe inexistente: `curl -s http://localhost:3001/api/equipes/inexistente/agenda` retorna `{"error":"equipe inexistente não encontrada"}`.

Não esquecer de matar o backend ao final (pkill -f "tsx watch" ou TaskStop).

- [ ] **Step 5: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/src/index.ts
git commit -m "feat(api): GET /api/equipes/:equipe_id/agenda com NN + justificativas"
```

---

### Task 6: Adicionar tool de chat `query_agenda_equipe` (opcional, recomendado)

**Files:**
- Modify: `src/backend/src/lib/chat-tools.ts`

- [ ] **Step 1: Atualizar import**

```typescript
import { listPatients, getOpenAlerts, getKpis, queryGroupStats, getInvisiveis, getGestaoPainel } from './db.js';
import { buildAgenda } from './routing.js';
```

- [ ] **Step 2: Adicionar a tool no array `CHAT_TOOLS`**

Antes do `];` final do array, adicionar:

```typescript
  {
    name: 'query_agenda_equipe',
    description: 'Gera a agenda diária otimizada de visitas para uma equipe específica. Retorna lista ordenada por proximidade geográfica (nearest neighbor a partir da sede), com top N pacientes por score. Use quando o usuário perguntar "qual a agenda da equipe X" ou "quem visitar amanhã na equipe Y".',
    input_schema: {
      type: 'object',
      properties: {
        equipe_id: { type: 'string', description: 'ID da equipe (obrigatório)' },
        capacidade: { type: 'number', description: 'Número de visitas (default 6, max 50)' },
        com_justificativas: { type: 'boolean', description: 'Se true, inclui justificativa por paciente (mais lento). Default false.' },
      },
      required: ['equipe_id'],
    },
  },
```

- [ ] **Step 3: Adicionar case no `executeTool`**

Antes do `default:`, adicionar:

```typescript
    case 'query_agenda_equipe': {
      const equipe_id = input.equipe_id as string;
      const capacidade = input.capacidade as number | undefined;
      const com_justificativas = input.com_justificativas as boolean | undefined;
      const r = await buildAgenda({ equipe_id, capacidade, com_justificativas });
      if (!r) return { error: `equipe ${equipe_id} nao encontrada` };
      return r;
    }
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: 0 new errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/src/lib/chat-tools.ts
git commit -m "feat(chat): expor query_agenda_equipe ao Claude"
```

---

## Self-Review

**1. Spec coverage:**

| Frente da Fase 3 | Task |
|---|---|
| Endpoint `/api/equipes/:id/agenda` | Task 5 |
| Roteirização nearest-neighbor + Haversine | Task 2 |
| Sede da equipe carregada | Task 1 |
| Top N pacientes da equipe por score | Task 1 |
| Justificativa via Claude com fallback | Task 3 |
| Orquestração (sede → candidatos → NN → justificativa) | Task 4 |
| Chat IA conhece a agenda | Task 6 (opcional) |

**2. Placeholder scan:** zero "TBD", todos os steps com código completo. Smoke tests dependem do estado do banco — Task 4 explicita: "se nenhuma equipe tem candidato, rodar rescore primeiro".

**3. Type consistency:**
- `CandidatoAgenda` (Task 1) usado em Tasks 3, 4.
- `Ponto`, `RotaItem` definidos em Task 2, usados em Task 4.
- `AgendaItem`, `Agenda` definidos em Task 4, usados em Task 5 e Task 6.
- Capacidade default 6 (constante `CAPACIDADE_PADRAO` em routing.ts).

**4. Riscos conhecidos:**
- **Justificativa via Claude pode ser lenta** com capacidade alta (cada paciente = 1 chamada Haiku). Por isso `com_justificativas` é flag opcional (default false). Para 6 pacientes com Haiku, esperar 4–8s.
- **Equipes sem pacientes scored** retornam agenda vazia (`total_itens: 0`). É comportamento aceitável.
- **Frontend ainda não consome** — esta fase é backend-only. UI da agenda virá na Fase 4 (`/acs`).
- **Sequência de visita não respeita capacidade temporal** (régua de revisita mínima por perfil) — o YAML do dev tem `intervalo_minimo_revisita_dias`, mas como nossa agenda tira "top N por score" não estamos selecionando revisitas, e sim quem precisa visitar agora. Se virar problema, é Fase 5+.

---

## Execution Handoff

Plano completo e salvo em `docs/superpowers/plans/2026-05-24-fase3-agenda-diaria.md`. Modo: **subagent-driven** (mesmo da Fase 2). Disparando o primeiro implementer.

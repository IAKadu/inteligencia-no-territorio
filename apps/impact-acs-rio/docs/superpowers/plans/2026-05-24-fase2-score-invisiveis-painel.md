# Fase 2 — Score recalibrado + Invisíveis + Painel de Pressão

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portar a calibração de score do dev parceiro (`inteligencia-no-territorio/`) para o backend TS: escala 0–250, régua de visitas por perfil, déficit, bônus de invisível, e novo endpoint de painel de pressão por equipe.

**Architecture:** O `scoring.ts` ganha 3 dimensões novas: (1) déficit vs. régua de visitas (peso 8 por visita faltante), (2) bônus invisível alto-risco (+30) e crise sem vínculo (+50), (3) urgência granulada em 4 janelas (30/90/180/ano). O cap `max_score: 100` é removido. Tabela `pacientes_scores` ganha colunas `flag_invisivel`, `flag_crise_sem_vinculo`, `categoria_invisivel`, `prioridade` (computadas via trigger? não — via TS no recompute). Novo endpoint `/api/gestao/painel` agrega por equipe.

**Tech Stack:** Node 20 + TypeScript + Hono + `postgres` (porsager) + Supabase Postgres + Anthropic SDK + tsx para scripts ad-hoc.

---

## File Structure

**Modify:**
- `src/backend/src/config/scoring-weights.json` — novos pesos + faixas de prioridade.
- `src/backend/src/lib/scoring.ts` — adicionar régua, déficit, urgência multi-janela, bônus invisível, faixa de prioridade. Remover cap.
- `src/backend/src/lib/db.ts` — `upsertScore` aceita campos novos; novas funções `getGestaoPainel`, `getInvisiveis`, `countOpenAlertsP1` mantida.
- `src/backend/src/types.ts` — campos novos em `PacienteScore` e `PacienteComScore`.
- `src/backend/src/index.ts` — registrar 2 rotas novas.

**Create:**
- `supabase/migrations/20260524190000_fase2_score_flags.sql` — adiciona colunas e índice.
- `src/backend/scripts/rescore_all.ts` — recalcula score para todos os pacientes.
- `src/backend/scripts/validate_fase2.ts` — valida números esperados contra os achados do dev (50% sem visita, 75,9% abaixo da régua, etc).

**Reference (não editar):**
- `_inbox/regua-visitas-do-dev.yaml` — fonte da régua.
- `docs/analises-territorio/00_sumario_executivo.md` — números esperados.
- `docs/analises-territorio/solucao_03_pacientes_invisiveis.md` — regras das 3 categorias.

---

### Task 1: Migration — colunas de flags e prioridade

**Files:**
- Create: `supabase/migrations/20260524190000_fase2_score_flags.sql`

- [ ] **Step 1: Criar o arquivo da migration**

```sql
-- Fase 2: adiciona flags de invisível e prioridade calculada em pacientes_scores.
-- Remove cap implícito do score (era enforced via Math.min em TS) — score agora
-- pode ir até ~250. Adiciona índices para o endpoint de painel de gestão.

ALTER TABLE pacientes_scores
  ADD COLUMN IF NOT EXISTS flag_invisivel          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flag_crise_sem_vinculo  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS categoria_invisivel     INTEGER,
  ADD COLUMN IF NOT EXISTS prioridade              TEXT;

-- categoria_invisivel: 1=crise_sem_vinculo, 2=alto_risco_sem_contato, 3=sem_cond_especial
-- prioridade: 'CRITICO' | 'URGENTE' | 'ATENCAO' | 'ROTINA' (cut por faixas de score)

CREATE INDEX IF NOT EXISTS idx_scores_prioridade   ON pacientes_scores(prioridade);
CREATE INDEX IF NOT EXISTS idx_scores_invisivel    ON pacientes_scores(flag_invisivel) WHERE flag_invisivel = TRUE;
CREATE INDEX IF NOT EXISTS idx_scores_crise        ON pacientes_scores(flag_crise_sem_vinculo) WHERE flag_crise_sem_vinculo = TRUE;
```

- [ ] **Step 2: Aplicar a migration**

Run: `cd /Users/peterflag/Documents/Projects/Impact && supabase db push`
Expected: "Applying migration 20260524190000_fase2_score_flags.sql... done"

- [ ] **Step 3: Verificar colunas no Supabase**

Run:
```bash
cd /Users/peterflag/Documents/Projects/Impact/src/backend && npx tsx -e "
import { sql } from './src/lib/db.js';
const r = await sql\`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='pacientes_scores' ORDER BY ordinal_position\`;
console.log(r);
await sql.end();
"
```

Expected: lista incluindo `flag_invisivel`, `flag_crise_sem_vinculo`, `categoria_invisivel`, `prioridade`.

- [ ] **Step 4: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add supabase/migrations/20260524190000_fase2_score_flags.sql
git commit -m "feat(db): fase2 — flags de invisivel e prioridade em pacientes_scores"
```

---

### Task 2: Atualizar pesos e faixas em scoring-weights.json

**Files:**
- Modify: `src/backend/src/config/scoring-weights.json` (substituição completa)

- [ ] **Step 1: Reescrever o arquivo com os pesos do dev parceiro**

```json
{
  "_doc": "Pesos portados de _inbox/regua-visitas-do-dev.yaml. Escala 0-250+, sem cap. Ver docs/analises-territorio/solucao_01_score_de_risco.md.",

  "clinical": {
    "gestante":              40,
    "crianca_0_6":           35,
    "hipertenso_e_diabetico":30,
    "hipertenso":            20,
    "diabetico":             20,
    "idoso_66_mais":         15
  },

  "social": {
    "situacao_vulnerabilidade": 10
  },

  "temporal_regua": {
    "_doc": "Mínimo de visitas/ano por perfil (régua do Rio).",
    "crianca_0_6":            7,
    "gestante":               6,
    "hipertenso":             4,
    "diabetico":              4,
    "hipertenso_e_diabetico": 4,
    "idoso_66_mais":          4,
    "default":                2,
    "peso_por_visita_faltante": 8
  },

  "urgencia": {
    "_doc": "Pesos cumulativos por janela. n_urg_30d * peso_30d + n_urg_90d * peso_90d + ...",
    "peso_30d":  25,
    "peso_90d":  15,
    "peso_180d": 8,
    "peso_ano":  3
  },

  "agendamento": {
    "tem_agendamento_futuro": 10
  },

  "gatilho": {
    "alerta_critico_aberto": 20
  },

  "bonus_invisivel": {
    "alto_risco_sem_visita": 30,
    "crise_sem_vinculo":     50
  },

  "faixas_prioridade": {
    "_doc": "Limiares inclusive-low para classificar score em prioridade.",
    "critico":  80,
    "urgente":  50,
    "atencao":  20
  }
}
```

- [ ] **Step 2: Validar JSON**

Run: `cd /Users/peterflag/Documents/Projects/Impact/src/backend && node --input-type=module -e "import w from './src/config/scoring-weights.json' with {type:'json'}; console.log(Object.keys(w))"`
Expected: `[ '_doc', 'clinical', 'social', 'temporal_regua', 'urgencia', 'agendamento', 'gatilho', 'bonus_invisivel', 'faixas_prioridade' ]`

- [ ] **Step 3: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/src/config/scoring-weights.json
git commit -m "feat(scoring): recalibrar pesos para escala 0-250 com regua e bonus invisivel"
```

---

### Task 3: Atualizar types.ts com campos novos

**Files:**
- Modify: `src/backend/src/types.ts`

- [ ] **Step 1: Adicionar campos em `PacienteScore`**

Substituir a interface `PacienteScore` por:

```typescript
export type Prioridade = 'CRITICO' | 'URGENTE' | 'ATENCAO' | 'ROTINA';

export interface PacienteScore {
  paciente_id: string;
  score: number;
  fatores: string;
  justificativa: string | null;
  calculado_em: string;
  flag_invisivel: boolean;
  flag_crise_sem_vinculo: boolean;
  categoria_invisivel: 1 | 2 | 3 | null;
  prioridade: Prioridade | null;
}
```

- [ ] **Step 2: Adicionar mesmos campos em `PacienteComScore`**

Substituir a interface `PacienteComScore` por:

```typescript
export interface PacienteComScore extends Paciente {
  score: number;
  fatores: string[];
  justificativa: string | null;
  ultima_visita: string | null;
  flag_invisivel: boolean;
  flag_crise_sem_vinculo: boolean;
  categoria_invisivel: 1 | 2 | 3 | null;
  prioridade: Prioridade | null;
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `cd /Users/peterflag/Documents/Projects/Impact/src/backend && npx tsc --noEmit`
Expected: pode haver erros temporários em `scoring.ts`/`db.ts` (vamos resolver nas próximas tasks). Anotar erros — devem ser apenas em arquivos que ainda não modificamos.

- [ ] **Step 4: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/src/types.ts
git commit -m "feat(types): adicionar prioridade, flags de invisivel em PacienteScore"
```

---

### Task 4: Reescrever computeScore com régua, déficit, multi-janela e bônus

**Files:**
- Modify: `src/backend/src/lib/scoring.ts` (rewrite)

- [ ] **Step 1: Reescrever o arquivo inteiro**

```typescript
import weights from '../config/scoring-weights.json' with { type: 'json' };
import {
  getPatient, getPatientVisits, getPatientEvents,
  upsertScore, countOpenAlertsP1,
} from './db.js';
import type { Prioridade } from '../types.js';

const TODAY = new Date('2025-12-31');

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function minimoVisitasAno(p: { faixa_etaria: string; gestacao: number; hipertenso: number; diabetico: number }): number {
  const r = weights.temporal_regua;
  if (p.faixa_etaria === '0-6')                  return r.crianca_0_6;
  if (p.gestacao === 1)                          return r.gestante;
  if (p.hipertenso === 1 && p.diabetico === 1)   return r.hipertenso_e_diabetico;
  if (p.hipertenso === 1)                        return r.hipertenso;
  if (p.diabetico === 1)                         return r.diabetico;
  if (p.faixa_etaria === '66+')                  return r.idoso_66_mais;
  return r.default;
}

function classificarPrioridade(score: number): Prioridade {
  const f = weights.faixas_prioridade;
  if (score >= f.critico) return 'CRITICO';
  if (score >= f.urgente) return 'URGENTE';
  if (score >= f.atencao) return 'ATENCAO';
  return 'ROTINA';
}

export interface ScoreBreakdown {
  score: number;
  fatores: string[];
  flag_invisivel: boolean;
  flag_crise_sem_vinculo: boolean;
  categoria_invisivel: 1 | 2 | 3 | null;
  prioridade: Prioridade;
}

export async function computeScore(paciente_id: string): Promise<ScoreBreakdown> {
  const p = await getPatient(paciente_id);
  if (!p) throw new Error(`paciente ${paciente_id} não existe`);

  const [visitas, eventos, n_alertas_p1] = await Promise.all([
    getPatientVisits(paciente_id),
    getPatientEvents(paciente_id),
    countOpenAlertsP1(paciente_id),
  ]);

  const fatores: string[] = [];
  let total = 0;

  // ── clínico ─────────────────────────────────────────────────────────────
  const c = weights.clinical;
  if (p.gestacao === 1)                                  { fatores.push('gestante');               total += c.gestante; }
  if (p.faixa_etaria === '0-6')                          { fatores.push('crianca_0_6');            total += c.crianca_0_6; }
  if (p.hipertenso === 1 && p.diabetico === 1)           { fatores.push('hipertenso_e_diabetico'); total += c.hipertenso_e_diabetico; }
  else if (p.hipertenso === 1)                           { fatores.push('hipertenso');             total += c.hipertenso; }
  else if (p.diabetico === 1)                            { fatores.push('diabetico');              total += c.diabetico; }
  if (p.faixa_etaria === '66+')                          { fatores.push('idoso_66_mais');          total += c.idoso_66_mais; }

  // ── social ──────────────────────────────────────────────────────────────
  if (p.situacao_vulnerabilidade === 1) {
    fatores.push('situacao_vulnerabilidade');
    total += weights.social.situacao_vulnerabilidade;
  }

  // ── temporal/régua ──────────────────────────────────────────────────────
  const min_visitas = minimoVisitasAno(p);
  const n_visitas = visitas.length;
  const deficit = Math.max(0, min_visitas - n_visitas);
  if (deficit > 0) {
    fatores.push(`deficit_${deficit}_visitas`);
    total += deficit * weights.temporal_regua.peso_por_visita_faltante;
  }

  // ── urgência (4 janelas cumulativas) ────────────────────────────────────
  const urgDates = eventos
    .filter(e => e.tipo === 'urgencia-emergencia-ou-internacao')
    .map(e => new Date(e.data_referencia));

  const n_30  = urgDates.filter(d => daysBetween(d, TODAY) <= 30).length;
  const n_90  = urgDates.filter(d => daysBetween(d, TODAY) <= 90).length;
  const n_180 = urgDates.filter(d => daysBetween(d, TODAY) <= 180).length;
  const n_ano = urgDates.length;

  const u = weights.urgencia;
  const scoreUrg = n_30 * u.peso_30d + n_90 * u.peso_90d + n_180 * u.peso_180d + n_ano * u.peso_ano;
  if (scoreUrg > 0) {
    if (n_30 > 0)  fatores.push(`urg_30d_${n_30}`);
    if (n_90 > 0)  fatores.push(`urg_90d_${n_90}`);
    if (n_180 > 0) fatores.push(`urg_180d_${n_180}`);
    if (n_ano > 0) fatores.push(`urg_ano_${n_ano}`);
    total += scoreUrg;
  }

  // ── agendamento futuro ──────────────────────────────────────────────────
  const temAgendFuturo = eventos.some(e =>
    e.tipo === 'agendamento' && new Date(e.data_referencia) > TODAY
  );
  if (temAgendFuturo) {
    fatores.push('agendamento_futuro');
    total += weights.agendamento.tem_agendamento_futuro;
  }

  // ── gatilho: alerta crítico aberto ──────────────────────────────────────
  if (n_alertas_p1 > 0) {
    fatores.push('alerta_critico_aberto');
    total += weights.gatilho.alerta_critico_aberto;
  }

  // ── bônus invisível ─────────────────────────────────────────────────────
  const altoRisco =
    p.gestacao === 1 ||
    p.faixa_etaria === '0-6' ||
    p.hipertenso === 1 ||
    p.diabetico === 1 ||
    p.faixa_etaria === '66+' ||
    p.situacao_vulnerabilidade === 1;

  const semVisita = n_visitas === 0;
  const flag_invisivel = semVisita && altoRisco;
  const flag_crise_sem_vinculo = semVisita && n_ano >= 3;

  if (flag_invisivel) {
    fatores.push('invisivel_alto_risco');
    total += weights.bonus_invisivel.alto_risco_sem_visita;
  }
  if (flag_crise_sem_vinculo) {
    fatores.push('crise_sem_vinculo');
    total += weights.bonus_invisivel.crise_sem_vinculo;
  }

  // ── categoria de invisível (apenas se sem visita) ───────────────────────
  let categoria_invisivel: 1 | 2 | 3 | null = null;
  if (semVisita) {
    if (n_ano >= 3)      categoria_invisivel = 1;       // crise sem vínculo
    else if (altoRisco)  categoria_invisivel = 2;       // alto risco sem contato
    else                 categoria_invisivel = 3;       // sem condição especial
  }

  const score = total;  // sem cap
  const prioridade = classificarPrioridade(score);

  return { score, fatores, flag_invisivel, flag_crise_sem_vinculo, categoria_invisivel, prioridade };
}

export async function recomputeAndSave(paciente_id: string): Promise<ScoreBreakdown> {
  const r = await computeScore(paciente_id);
  await upsertScore(paciente_id, r.score, r.fatores, null, {
    flag_invisivel: r.flag_invisivel,
    flag_crise_sem_vinculo: r.flag_crise_sem_vinculo,
    categoria_invisivel: r.categoria_invisivel,
    prioridade: r.prioridade,
  });
  return r;
}
```

- [ ] **Step 2: Verificar typecheck (vai falhar em db.ts ainda)**

Run: `cd /Users/peterflag/Documents/Projects/Impact/src/backend && npx tsc --noEmit`
Expected: erro em `upsertScore` chamada com 5 args mas declarada com 4. Vamos consertar na Task 5.

- [ ] **Step 3: NÃO commitar ainda** — espera Task 5 pra fazer um commit coeso

---

### Task 5: Atualizar upsertScore em db.ts

**Files:**
- Modify: `src/backend/src/lib/db.ts` (função `upsertScore`)

- [ ] **Step 1: Substituir a assinatura e o corpo de `upsertScore`**

Localizar `export async function upsertScore(` no arquivo e substituir todo o bloco da função por:

```typescript
export async function upsertScore(
  paciente_id: string,
  score: number,
  fatores: string[],
  justificativa: string | null,
  flags: {
    flag_invisivel: boolean;
    flag_crise_sem_vinculo: boolean;
    categoria_invisivel: 1 | 2 | 3 | null;
    prioridade: 'CRITICO' | 'URGENTE' | 'ATENCAO' | 'ROTINA';
  },
): Promise<void> {
  await sql`
    INSERT INTO pacientes_scores
      (paciente_id, score, fatores, justificativa, calculado_em,
       flag_invisivel, flag_crise_sem_vinculo, categoria_invisivel, prioridade)
    VALUES (
      ${paciente_id}, ${score}, ${sql.json(fatores)}, ${justificativa}, NOW(),
      ${flags.flag_invisivel}, ${flags.flag_crise_sem_vinculo},
      ${flags.categoria_invisivel}, ${flags.prioridade}
    )
    ON CONFLICT (paciente_id) DO UPDATE SET
      score                  = EXCLUDED.score,
      fatores                = EXCLUDED.fatores,
      justificativa          = EXCLUDED.justificativa,
      calculado_em           = EXCLUDED.calculado_em,
      flag_invisivel         = EXCLUDED.flag_invisivel,
      flag_crise_sem_vinculo = EXCLUDED.flag_crise_sem_vinculo,
      categoria_invisivel    = EXCLUDED.categoria_invisivel,
      prioridade             = EXCLUDED.prioridade
  `;
}
```

- [ ] **Step 2: Atualizar `listPatients` e `getPatient` pra trazer os campos novos**

Localizar a query do `listPatients`. Substituir o `SELECT p.*, s.score, s.fatores, s.justificativa,` por:

```sql
SELECT p.*, s.score, s.fatores, s.justificativa,
       s.flag_invisivel, s.flag_crise_sem_vinculo, s.categoria_invisivel, s.prioridade,
```

Fazer a mesma alteração em `getPatient`.

- [ ] **Step 3: Verificar typecheck**

Run: `cd /Users/peterflag/Documents/Projects/Impact/src/backend && npx tsc --noEmit`
Expected: 0 erros.

- [ ] **Step 4: Smoke test — recomputar 1 paciente**

Run:
```bash
cd /Users/peterflag/Documents/Projects/Impact/src/backend && npx tsx -e "
import { sql } from './src/lib/db.js';
import { recomputeAndSave } from './src/lib/scoring.js';
const [p] = await sql\`SELECT paciente_id FROM pacientes LIMIT 1\`;
const r = await recomputeAndSave(p.paciente_id);
console.log('OK', r);
await sql.end();
"
```

Expected: `OK { score: <num>, fatores: [...], flag_invisivel: ..., prioridade: '...' }` sem erro.

- [ ] **Step 5: Commit (Tasks 4 e 5 juntas)**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/src/lib/scoring.ts src/backend/src/lib/db.ts
git commit -m "feat(scoring): regua de visitas, urgencia multi-janela, bonus invisivel, prioridade"
```

---

### Task 6: Script de re-score em batch

**Files:**
- Create: `src/backend/scripts/rescore_all.ts`

- [ ] **Step 1: Criar o script**

```typescript
/**
 * Re-scora todos os pacientes em lote.
 * Imprime progresso a cada 1000 pacientes e estatísticas finais.
 *
 * Uso: npx tsx scripts/rescore_all.ts
 */
import { sql } from '../src/lib/db.js';
import { recomputeAndSave } from '../src/lib/scoring.js';

async function main() {
  console.log('Buscando todos os paciente_id...');
  const rows = await sql<Array<{ paciente_id: string }>>`SELECT paciente_id FROM pacientes`;
  console.log(`Total: ${rows.length} pacientes\n`);

  const t0 = Date.now();
  let n = 0;

  for (const { paciente_id } of rows) {
    await recomputeAndSave(paciente_id);
    n++;
    if (n % 1000 === 0) {
      const elapsed = (Date.now() - t0) / 1000;
      const rate = n / elapsed;
      const eta = (rows.length - n) / rate;
      console.log(`  ${n}/${rows.length}  (${rate.toFixed(0)} p/s, ETA ${(eta/60).toFixed(1)}min)`);
    }
  }

  const totalSec = (Date.now() - t0) / 1000;
  console.log(`\nConcluído: ${n} pacientes em ${(totalSec/60).toFixed(1)} min\n`);

  console.log('=== DISTRIBUIÇÃO DE PRIORIDADE ===');
  const distr = await sql`
    SELECT prioridade, COUNT(*)::int AS n
    FROM pacientes_scores
    GROUP BY prioridade
    ORDER BY CASE prioridade
      WHEN 'CRITICO' THEN 1
      WHEN 'URGENTE' THEN 2
      WHEN 'ATENCAO' THEN 3
      WHEN 'ROTINA'  THEN 4
      ELSE 5 END
  `;
  console.table(distr);

  console.log('\n=== INVISÍVEIS POR CATEGORIA ===');
  const inv = await sql`
    SELECT categoria_invisivel, COUNT(*)::int AS n
    FROM pacientes_scores
    WHERE categoria_invisivel IS NOT NULL
    GROUP BY categoria_invisivel
    ORDER BY categoria_invisivel
  `;
  console.table(inv);

  console.log('\n=== STATS DE SCORE ===');
  const stats = await sql`
    SELECT
      ROUND(MIN(score)::numeric, 1)               AS min,
      ROUND(AVG(score)::numeric, 1)               AS avg,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY score)::numeric, 1) AS p50,
      ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY score)::numeric, 1) AS p90,
      ROUND(MAX(score)::numeric, 1)               AS max
    FROM pacientes_scores
  `;
  console.table(stats);

  await sql.end();
}

main().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Rodar o script (vai levar alguns minutos)**

Run: `cd /Users/peterflag/Documents/Projects/Impact/src/backend && npx tsx scripts/rescore_all.ts`

Expected output (números aproximados, baseado nos achados do dev):
- Total: ~97.938 pacientes
- Distribuição: ROTINA mais comum, CRITICO menor (algumas centenas a milhares).
- Invisíveis categoria 1: poucas centenas (790 conforme análise).
- Invisíveis categoria 2: ~14.000.
- Score max: 200+ (sem cap).

Tempo estimado: 5–15 min (depende de latência Supabase). Se cair durante: re-rodar é idempotente (upsert).

- [ ] **Step 3: Commit do script (não dos dados — eles não estão no git)**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/scripts/rescore_all.ts
git commit -m "feat(scripts): rescore_all em batch com stats finais"
```

---

### Task 7: Script de validação contra achados do dev

**Files:**
- Create: `src/backend/scripts/validate_fase2.ts`

- [ ] **Step 1: Criar script de validação**

```typescript
/**
 * Valida números do score recalibrado contra os achados do dev parceiro
 * (docs/analises-territorio/00_sumario_executivo.md).
 *
 * Falha (exit 1) se algum valor estiver fora da banda esperada.
 *
 * Uso: npx tsx scripts/validate_fase2.ts
 */
import { sql } from '../src/lib/db.js';

interface Check { name: string; actual: number; expected: number; tolerance: number; }

const checks: Check[] = [];

function check(name: string, actual: number, expected: number, tolerancePct: number) {
  checks.push({ name, actual, expected, tolerance: tolerancePct });
}

async function main() {
  // 1. Total de pacientes
  const [{ total }] = await sql<[{ total: number }]>`SELECT COUNT(*)::int AS total FROM pacientes`;
  check('Total pacientes', total, 97938, 0.01);

  // 2. % sem nenhuma visita no ano (esperado ~49,9% = 48.838)
  const [{ sem_visita }] = await sql<[{ sem_visita: number }]>`
    SELECT COUNT(*)::int AS sem_visita
    FROM pacientes p
    LEFT JOIN (SELECT DISTINCT paciente_id FROM visitas) v USING (paciente_id)
    WHERE v.paciente_id IS NULL
  `;
  check('Pacientes sem visita', sem_visita, 48838, 0.02);

  // 3. Invisíveis categoria 1 (crise sem vínculo) — esperado ~790
  const [{ cat1 }] = await sql<[{ cat1: number }]>`
    SELECT COUNT(*)::int AS cat1 FROM pacientes_scores WHERE categoria_invisivel = 1
  `;
  check('Crise sem vínculo (cat 1)', cat1, 790, 0.10);

  // 4. Idosos 66+ sem visita — esperado ~12.636 (do meu próprio README)
  const [{ idosos }] = await sql<[{ idosos: number }]>`
    SELECT COUNT(*)::int AS idosos
    FROM pacientes p
    LEFT JOIN (SELECT DISTINCT paciente_id FROM visitas) v USING (paciente_id)
    WHERE p.faixa_etaria = '66+' AND v.paciente_id IS NULL
  `;
  check('Idosos 66+ sem visita', idosos, 12636, 0.02);

  // 5. Sem cap — esperar pelo menos um score > 100
  const [{ max_score }] = await sql<[{ max_score: number }]>`SELECT MAX(score)::numeric AS max_score FROM pacientes_scores`;
  if (Number(max_score) < 100) {
    console.error(`FAIL: max_score = ${max_score}, esperado > 100 (cap removido)`);
    process.exit(1);
  }

  // 6. Distribuição de prioridade — pelo menos 1 paciente em cada faixa
  const distr = await sql<Array<{ prioridade: string; n: number }>>`
    SELECT prioridade, COUNT(*)::int AS n
    FROM pacientes_scores
    GROUP BY prioridade
  `;
  const faixas = new Set(distr.map(d => d.prioridade));
  for (const f of ['CRITICO', 'URGENTE', 'ATENCAO', 'ROTINA']) {
    if (!faixas.has(f)) {
      console.error(`FAIL: nenhum paciente com prioridade ${f}`);
      process.exit(1);
    }
  }

  // ── relatório ──────────────────────────────────────────────────────────
  console.log('=== VALIDAÇÃO FASE 2 ===\n');
  let failed = 0;
  for (const c of checks) {
    const diff = Math.abs(c.actual - c.expected) / c.expected;
    const ok = diff <= c.tolerance;
    const flag = ok ? 'OK  ' : 'FAIL';
    console.log(`  ${flag}  ${c.name.padEnd(35)} actual=${c.actual} expected=${c.expected} (Δ=${(diff*100).toFixed(1)}%)`);
    if (!ok) failed++;
  }

  console.log(`\nMax score: ${max_score}  (cap removido)`);
  console.log('Distribuição prioridade:');
  console.table(distr);

  await sql.end();

  if (failed > 0) {
    console.error(`\n${failed} validação(ões) falhou. Investigar.`);
    process.exit(1);
  }
  console.log('\nTodas as validações passaram.');
}

main().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Rodar a validação (só depois do rescore_all completar)**

Run: `cd /Users/peterflag/Documents/Projects/Impact/src/backend && npx tsx scripts/validate_fase2.ts`

Expected: todas as 4 checagens OK, e nenhuma faixa de prioridade vazia. Se algo falhar, **parar e investigar** antes de seguir — quase certo que um peso está errado.

- [ ] **Step 3: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/scripts/validate_fase2.ts
git commit -m "feat(scripts): validate_fase2 contra achados do dev parceiro"
```

---

### Task 8: Funções db para painel de gestão e invisíveis

**Files:**
- Modify: `src/backend/src/lib/db.ts` (adicionar duas funções no final, antes do export de `queryGroupStats`)

- [ ] **Step 1: Adicionar `getGestaoPainel`**

Inserir no final do arquivo (depois de todas as funções existentes):

```typescript
export interface PainelEquipe {
  equipe_id: string;
  total_pacientes: number;
  pct_alto_risco: number;
  pct_sem_visita: number;
  pct_urgencia: number;
  score_pressao: number;
  crise_sem_vinculo: number;
  alto_risco_invisivel: number;
}

export async function getGestaoPainel(): Promise<PainelEquipe[]> {
  const rows = await sql<PainelEquipe[]>`
    WITH base AS (
      SELECT
        p.paciente_id,
        p.equipe_id,
        (p.gestacao = 1 OR p.faixa_etaria = '0-6' OR p.hipertenso = 1
          OR p.diabetico = 1 OR p.faixa_etaria = '66+' OR p.situacao_vulnerabilidade = 1) AS alto_risco,
        EXISTS (SELECT 1 FROM visitas v WHERE v.paciente_id = p.paciente_id)            AS visitado,
        EXISTS (SELECT 1 FROM eventos_clinicos e
                WHERE e.paciente_id = p.paciente_id
                  AND e.tipo = 'urgencia-emergencia-ou-internacao')                      AS teve_urgencia
      FROM pacientes p
    ),
    flags AS (
      SELECT
        p.equipe_id,
        SUM((s.categoria_invisivel = 1)::int)::int AS crise_sem_vinculo,
        SUM((s.flag_invisivel)::int)::int          AS alto_risco_invisivel
      FROM pacientes p
      LEFT JOIN pacientes_scores s USING (paciente_id)
      GROUP BY p.equipe_id
    )
    SELECT
      b.equipe_id,
      COUNT(*)::int                                                       AS total_pacientes,
      ROUND(100.0 * SUM(b.alto_risco::int)    / COUNT(*), 1)::float       AS pct_alto_risco,
      ROUND(100.0 * SUM((NOT b.visitado)::int)/ COUNT(*), 1)::float       AS pct_sem_visita,
      ROUND(100.0 * SUM(b.teve_urgencia::int) / COUNT(*), 1)::float       AS pct_urgencia,
      ROUND((
        100.0 * SUM(b.alto_risco::int)    / COUNT(*) * 0.4 +
        100.0 * SUM((NOT b.visitado)::int)/ COUNT(*) * 0.4 +
        100.0 * SUM(b.teve_urgencia::int) / COUNT(*) * 0.2
      )::numeric, 1)::float                                               AS score_pressao,
      COALESCE(f.crise_sem_vinculo, 0)::int                               AS crise_sem_vinculo,
      COALESCE(f.alto_risco_invisivel, 0)::int                            AS alto_risco_invisivel
    FROM base b
    LEFT JOIN flags f USING (equipe_id)
    GROUP BY b.equipe_id, f.crise_sem_vinculo, f.alto_risco_invisivel
    ORDER BY score_pressao DESC
  `;
  return rows;
}
```

- [ ] **Step 2: Adicionar `getInvisiveis`**

Logo abaixo de `getGestaoPainel`:

```typescript
export interface InvisivelRow {
  paciente_id: string;
  equipe_id: string;
  faixa_etaria: string;
  hipertenso: number;
  diabetico: number;
  gestacao: number;
  situacao_vulnerabilidade: number;
  n_urg_ano: number;
  score: number;
  prioridade: string | null;
  categoria_invisivel: 1 | 2 | 3;
  label_categoria: string;
}

const LABEL_INVISIVEL: Record<1 | 2 | 3, string> = {
  1: 'Crise sem vínculo',
  2: 'Alto risco sem contato',
  3: 'Sem contato (sem condição especial)',
};

export async function getInvisiveis(opts: {
  equipe_id?: string;
  categoria?: 1 | 2 | 3;
  limit?: number;
} = {}): Promise<{ total: number; por_categoria: Record<1|2|3, number>; invisiveis: InvisivelRow[] }> {
  const limit = opts.limit ?? 200;

  const por_cat = await sql<Array<{ categoria_invisivel: 1 | 2 | 3; n: number }>>`
    SELECT categoria_invisivel, COUNT(*)::int AS n
    FROM pacientes_scores s
    JOIN pacientes p USING (paciente_id)
    WHERE s.categoria_invisivel IS NOT NULL
      ${opts.equipe_id ? sql`AND p.equipe_id = ${opts.equipe_id}` : sql``}
    GROUP BY categoria_invisivel
    ORDER BY categoria_invisivel
  `;
  const por_categoria = { 1: 0, 2: 0, 3: 0 } as Record<1|2|3, number>;
  for (const r of por_cat) por_categoria[r.categoria_invisivel] = r.n;

  const rows = await sql<Array<InvisivelRow & { n_urg_ano_raw: number }>>`
    SELECT
      p.paciente_id, p.equipe_id, p.faixa_etaria,
      p.hipertenso, p.diabetico, p.gestacao, p.situacao_vulnerabilidade,
      (SELECT COUNT(*)::int FROM eventos_clinicos e
        WHERE e.paciente_id = p.paciente_id
          AND e.tipo = 'urgencia-emergencia-ou-internacao')      AS n_urg_ano,
      s.score, s.prioridade, s.categoria_invisivel
    FROM pacientes_scores s
    JOIN pacientes p USING (paciente_id)
    WHERE s.categoria_invisivel IS NOT NULL
      ${opts.equipe_id ? sql`AND p.equipe_id = ${opts.equipe_id}` : sql``}
      ${opts.categoria ? sql`AND s.categoria_invisivel = ${opts.categoria}` : sql``}
    ORDER BY s.categoria_invisivel, s.score DESC
    LIMIT ${limit}
  `;

  const invisiveis = rows.map(r => ({
    ...r,
    label_categoria: LABEL_INVISIVEL[r.categoria_invisivel],
  }));

  const total = por_categoria[1] + por_categoria[2] + por_categoria[3];
  return { total, por_categoria, invisiveis };
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `cd /Users/peterflag/Documents/Projects/Impact/src/backend && npx tsc --noEmit`
Expected: 0 erros.

- [ ] **Step 4: Smoke test direto no db**

Run:
```bash
cd /Users/peterflag/Documents/Projects/Impact/src/backend && npx tsx -e "
import { sql, getGestaoPainel, getInvisiveis } from './src/lib/db.js';
const painel = await getGestaoPainel();
console.log('Equipes:', painel.length, '— top 3:');
console.table(painel.slice(0,3));
const inv = await getInvisiveis({ categoria: 1, limit: 5 });
console.log('Crise sem vinculo total:', inv.por_categoria[1], 'amostra:');
console.table(inv.invisiveis.slice(0,3));
await sql.end();
"
```

Expected: lista de equipes ordenada por score_pressao desc, e amostra de 3 invisíveis categoria 1.

- [ ] **Step 5: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/src/lib/db.ts
git commit -m "feat(db): getGestaoPainel e getInvisiveis para Fase 2"
```

---

### Task 9: Rotas HTTP /api/gestao/painel e /api/gestao/invisiveis

**Files:**
- Modify: `src/backend/src/index.ts`

- [ ] **Step 1: Adicionar import**

Localizar o bloco de imports do `./lib/db.js` e adicionar `getGestaoPainel, getInvisiveis`:

```typescript
import {
  getKpis,
  listPatients,
  getPatient,
  getPatientVisits,
  getPatientEvents,
  getPatientAlerts,
  getOpenAlerts,
  getTerritoryHeatmap,
  getEquipesSedes,
  getGestaoPainel,
  getInvisiveis,
} from './lib/db.js';
```

- [ ] **Step 2: Adicionar as duas rotas (depois de `/api/kpis`, antes do `/api/patients`)**

```typescript
app.get('/api/gestao/painel', async (c) => {
  try {
    return c.json(await getGestaoPainel());
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.get('/api/gestao/invisiveis', async (c) => {
  try {
    const equipe_id = c.req.query('equipe_id') ?? undefined;
    const catStr = c.req.query('categoria');
    const categoria = (catStr === '1' || catStr === '2' || catStr === '3')
      ? (Number(catStr) as 1 | 2 | 3) : undefined;
    const limitStr = c.req.query('limit');
    const limit = limitStr ? Number(limitStr) : undefined;
    return c.json(await getInvisiveis({ equipe_id, categoria, limit }));
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});
```

- [ ] **Step 3: Subir o servidor**

Run (em terminal separado): `cd /Users/peterflag/Documents/Projects/Impact/src/backend && npm run dev`
Expected: "Backend rodando em http://localhost:3001" (sem erros).

- [ ] **Step 4: Smoke test via curl**

```bash
curl -s http://localhost:3001/api/gestao/painel | head -c 500
echo
curl -s "http://localhost:3001/api/gestao/invisiveis?categoria=1&limit=3"
echo
curl -s "http://localhost:3001/api/gestao/invisiveis?equipe_id=<algum_id_real>&categoria=2&limit=2"
```

Expected: JSON válido com painel ordenado, e invisíveis categoria 1 com label "Crise sem vínculo". A última chamada precisa de um `equipe_id` real — pegar de `curl http://localhost:3001/api/patients?limit=1`.

- [ ] **Step 5: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/src/index.ts
git commit -m "feat(api): rotas /api/gestao/painel e /api/gestao/invisiveis"
```

---

### Task 10: Atualizar chat-tools para expor invisíveis e painel

**Files:**
- Modify: `src/backend/src/lib/chat-tools.ts`

> **Nota:** Esta task é opcional pra Fase 2 mas tem alto valor — sem ela, o chat IA continua sem saber das categorias de invisíveis. Se faltar tempo, pular e fazer junto da Fase 4.

- [ ] **Step 1: Ler o arquivo atual e identificar onde estão as 4 tools (`query_patients`, `query_alerts`, `query_kpis`, `query_group_stats`)**

Run: `cd /Users/peterflag/Documents/Projects/Impact/src/backend && grep -n '"name":' src/lib/chat-tools.ts`
Expected: 4 entradas com name.

- [ ] **Step 2: Adicionar duas novas tools no array de tools**

Inserir ANTES do fechamento do array de tools:

```typescript
{
  name: 'query_invisiveis',
  description: 'Lista pacientes invisíveis (sem nenhuma visita registrada no ano), classificados em 3 categorias: 1=crise sem vínculo (3+ urgências e zero visita), 2=alto risco sem contato (gestante, criança 0-6, hipertenso, diabético, idoso 66+ ou vulnerável sem visita), 3=sem contato (sem condição especial). Filtros opcionais: equipe_id, categoria.',
  input_schema: {
    type: 'object' as const,
    properties: {
      equipe_id: { type: 'string', description: 'Filtrar por equipe (opcional)' },
      categoria: { type: 'number', enum: [1, 2, 3], description: '1, 2 ou 3 (opcional)' },
      limit:     { type: 'number', description: 'Máximo de pacientes a retornar (default 50, max 200)' },
    },
  },
},
{
  name: 'query_painel_pressao',
  description: 'Retorna o painel de pressão por equipe: total de pacientes, % alto risco, % sem visita, % urgência e score de pressão (0–100). Ordenado por score_pressao desc.',
  input_schema: {
    type: 'object' as const,
    properties: {},
  },
},
```

- [ ] **Step 3: Adicionar os handlers**

No `switch` que despacha as tool calls (procurar `case 'query_kpis'` etc), adicionar:

```typescript
case 'query_invisiveis': {
  const args = toolInput as { equipe_id?: string; categoria?: 1|2|3; limit?: number };
  const limit = Math.min(args.limit ?? 50, 200);
  return await getInvisiveis({ equipe_id: args.equipe_id, categoria: args.categoria, limit });
}
case 'query_painel_pressao': {
  return await getGestaoPainel();
}
```

E garantir que `getInvisiveis, getGestaoPainel` estão importados no topo do arquivo.

- [ ] **Step 4: Verificar typecheck e smoke test no chat**

Run typecheck: `npx tsc --noEmit`
Expected: 0 erros.

Smoke test (com backend rodando):

```bash
curl -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Quantos pacientes em crise sem vinculo a gente tem? E qual equipe tem mais?"}]}' \
  | head -c 1000
```

Expected: resposta menciona número (~790) e nome da equipe com mais cat 1.

- [ ] **Step 5: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/backend/src/lib/chat-tools.ts
git commit -m "feat(chat): expor query_invisiveis e query_painel_pressao ao Claude"
```

---

### Task 11: Atualizar README/docs com achados pós-recalibração

**Files:**
- Modify: `README.md` (seção "Justificativa do impacto")

- [ ] **Step 1: Atualizar o bloco de impacto com números pós-recalibração**

Localizar a seção "**Justificativa do impacto**" no README.md. Substituir o bullet list por (rodar os números reais via `validate_fase2.ts` e o painel — não chutar):

```markdown
**Justificativa do impacto** (baseado em EDA + scoring recalibrado, ver [docs/analises-territorio/](docs/analises-territorio/) e [docs/analise-completa-dataset-saude.md](docs/analise-completa-dataset-saude.md)):

- **50% dos cadastros nunca foram visitados em 1 ano** (~48.838 de 97.938)
- **75,9% dos pacientes estão abaixo da régua de visitas** do Rio (idosos 66+ com déficit médio de 3,3 visitas; crianças 0-6 com déficit médio de 4,8)
- **Crise sem vínculo:** ~790 pacientes com 3+ urgências e zero visita no ano
- **Alto risco sem contato:** ~14.000 invisíveis (gestantes, crianças 0-6, hipertensos, diabéticos, idosos, vulneráveis sem nenhuma visita)
- **12.636 idosos 66+** sem visita
```

> Substituir os números aproximados pelos exatos vindos do `validate_fase2.ts`. Se algum número estiver muito diferente (>20% de gap), investigar antes de comitar.

- [ ] **Step 2: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add README.md
git commit -m "docs: atualizar achados do README com numeros pos-recalibracao"
```

---

## Self-Review

**1. Spec coverage check:**

| Tema do plano original (Fase 2) | Task |
|---|---|
| Régua de visitas do Rio aplicada | Task 2 (config), Task 4 (lógica em scoring) |
| 3 categorias de invisíveis | Task 1 (coluna), Task 4 (cálculo), Task 8 (query), Task 9 (rota) |
| Bônus de score (30 / 50) | Task 2, Task 4 |
| Endpoint `/api/gestao/painel` | Task 8, Task 9 |
| Verificação contra achados do dev | Task 7 |
| Re-score completo | Task 6 |
| Schema com flags | Task 1, Task 5 |
| Chat IA com novo conhecimento | Task 10 (opcional, recomendado) |

**2. Placeholder scan:** zero "TBD", zero "implementar depois". Tasks 6, 7 e 11 dependem de números reais — anotado nos passos para usar a saída dos scripts, não chutar.

**3. Type consistency:**
- `Prioridade` definida em Task 3 (`types.ts`), usada em Tasks 4, 5, 8.
- `categoria_invisivel: 1 | 2 | 3 | null` consistente em Tasks 3, 4, 5, 8.
- `upsertScore(...)` assinatura nova com objeto `flags` definida em Task 5, usada em Task 4 (`recomputeAndSave`).

**4. Riscos conhecidos:**
- **Latência Supabase em batch.** O `rescore_all.ts` faz uma round-trip por paciente; com 97k pacientes pode levar 10–20min. Se for inaceitável, paralelizar com `Promise.all` em chunks de ~50, mas só se virar gargalo real. **YAGNI por enquanto.**
- **`recomputeAndSave` em outros lugares.** O `webhook.ts` chama essa função quando processa mensagem WhatsApp. Como mudei a assinatura interna (`upsertScore`), mas a assinatura externa do `recomputeAndSave` voltou compatível (retorno é um objeto rico), o webhook não quebra — só ganha mais campos no retorno que ele pode ignorar. **Verificar manualmente no Step de smoke test da Task 5.**
- **Frontend pode quebrar visualmente.** O `ScoreBadge` está calibrado pra escala 0–100; com scores >100 vai precisar de update na Fase 4. **Não é problema desta fase**, mas anotar pro Peter testar `/pacientes` no browser depois do rescore.

---

## Execution Handoff

Plano completo e salvo em `docs/superpowers/plans/2026-05-24-fase2-score-invisiveis-painel.md`. Duas opções de execução:

**1. Subagent-Driven (recomendado)** — eu disparo um subagent fresco por task, reviso o resultado entre tasks, iteração rápida. Bom pra tasks isoladas como esta.

**2. Inline Execution** — eu executo as tasks nesta sessão mesmo via skill `executing-plans`, com checkpoints pra você revisar em lotes.

Qual abordagem?

# Fase 4a — Ampliação do dashboard com painel de pressão e invisíveis

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Tasks 1–4. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Mostrar no `/` (dashboard home) duas seções novas vindas dos endpoints da Fase 2: (a) painel de pressão por equipe (tabela ordenada por `score_pressao`), (b) contadores das 3 categorias de invisíveis com drill-down.

**Architecture:** Frontend-only. Reutiliza `KpiCard`, `ScoreBadge` existentes. Cria 2 novos componentes pequenos (`PressaoTable`, `InvisivelCounters`). Atualiza `lib/api.ts` com endpoints da Fase 2/3.

**Tech Stack:** Next.js 16 App Router + Tailwind v4 + Cera Pro + brand Prefeitura Rio (tokens já em `globals.css`).

---

## File Structure

**Create:**
- `src/frontend/components/pressao-table.tsx`
- `src/frontend/components/invisivel-counters.tsx`

**Modify:**
- `src/frontend/lib/api.ts` — adicionar `PainelEquipe`, `InvisivelResponse`, `Agenda` types + métodos do `apiClient`.
- `src/frontend/app/page.tsx` — adicionar 2 seções novas (Painel de pressão + Invisíveis).

---

### Task 1: Atualizar lib/api.ts com novos tipos e métodos

**Files:**
- Modify: `src/frontend/lib/api.ts`

- [ ] **Step 1: Adicionar types e métodos**

Append no final do arquivo `src/frontend/lib/api.ts` (antes do `export const apiClient = {`):

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

export interface InvisivelResponse {
  total: number;
  por_categoria: { 1: number; 2: number; 3: number };
  invisiveis: InvisivelRow[];
}

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
```

E adicionar os 3 métodos novos ao `apiClient` (logo após `isochrones`, antes do `}` final):

```typescript
  gestaoPainel: () => api<PainelEquipe[]>('/api/gestao/painel'),
  gestaoInvisiveis: (params: { equipe_id?: string; categoria?: 1 | 2 | 3; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.equipe_id) q.set('equipe_id', params.equipe_id);
    if (params.categoria) q.set('categoria', String(params.categoria));
    if (params.limit) q.set('limit', String(params.limit));
    return api<InvisivelResponse>(`/api/gestao/invisiveis?${q.toString()}`);
  },
  agendaEquipe: (equipe_id: string, params: { capacidade?: number; com_justificativas?: boolean } = {}) => {
    const q = new URLSearchParams();
    if (params.capacidade) q.set('capacidade', String(params.capacidade));
    if (params.com_justificativas !== undefined) q.set('com_justificativas', String(params.com_justificativas));
    return api<Agenda>(`/api/equipes/${equipe_id}/agenda?${q.toString()}`);
  },
```

- [ ] **Step 2: Atualizar `scoreToPriority` para a nova escala**

Localizar a função:
```typescript
export function scoreToPriority(score: number): 1 | 2 | 3 | 4 {
  if (score >= 70) return 1;
  if (score >= 50) return 2;
  if (score >= 30) return 3;
  return 4;
}
```

Substituir por (alinhada com backend `classificarPrioridade`):
```typescript
export function scoreToPriority(score: number): 1 | 2 | 3 | 4 {
  if (score >= 80) return 1;   // CRITICO
  if (score >= 50) return 2;   // URGENTE
  if (score >= 20) return 3;   // ATENCAO
  return 4;                    // ROTINA
}
```

- [ ] **Step 3: Atualizar `priorityLabel`**

Substituir:
```typescript
export function priorityLabel(p: 1 | 2 | 3 | 4): string {
  return { 1: 'Urgente', 2: 'Alto', 3: 'Médio', 4: 'Rotina' }[p];
}
```

Por:
```typescript
export function priorityLabel(p: 1 | 2 | 3 | 4): string {
  return { 1: 'Crítico', 2: 'Urgente', 3: 'Atenção', 4: 'Rotina' }[p];
}
```

- [ ] **Step 4: Typecheck**

Run: `cd /Users/peterflag/Documents/Projects/Impact/src/frontend && npx tsc --noEmit 2>&1 | tail -10`

Expected: zero errors. Se aparecer erro em algum componente que usa `priorityLabel` (ex: `score-badge.tsx`), é porque o label mudou de "Alto"/"Médio" pra "Crítico"/"Atenção" — isso é por design, não corrige (vai aparecer no UI corretamente).

- [ ] **Step 5: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/frontend/lib/api.ts
git commit -m "feat(frontend): types e endpoints da Fase 2/3 no apiClient; priority escala 0-250"
```

---

### Task 2: Componente `PressaoTable`

**Files:**
- Create: `src/frontend/components/pressao-table.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
import type { PainelEquipe } from '@/lib/api';

interface Props {
  painel: PainelEquipe[];
  limit?: number;
}

function pressaoColor(score: number): string {
  if (score >= 45) return 'var(--p1-text)';
  if (score >= 38) return 'var(--p2-text)';
  if (score >= 30) return 'var(--p3-text)';
  return 'var(--p4-text)';
}

export function PressaoTable({ painel, limit = 10 }: Props) {
  const top = painel.slice(0, limit);

  if (top.length === 0) {
    return (
      <div className="rounded-lg p-6 text-sm" style={{ background: 'var(--grey-card)', color: 'var(--grey-text)' }}>
        Sem dados de pressão por equipe ainda. Recalcular scores primeiro.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg" style={{ background: 'var(--white)', border: '1px solid var(--grey-mid)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'var(--grey-card)' }}>
            <th className="text-left px-4 py-3 font-bold uppercase tracking-wide" style={{ color: 'var(--blue-dark)', fontSize: '11px', letterSpacing: '0.08em' }}>Equipe</th>
            <th className="text-right px-3 py-3 font-bold uppercase tracking-wide" style={{ color: 'var(--blue-dark)', fontSize: '11px' }}>Pacientes</th>
            <th className="text-right px-3 py-3 font-bold uppercase tracking-wide" style={{ color: 'var(--blue-dark)', fontSize: '11px' }}>% Alto risco</th>
            <th className="text-right px-3 py-3 font-bold uppercase tracking-wide" style={{ color: 'var(--blue-dark)', fontSize: '11px' }}>% Sem visita</th>
            <th className="text-right px-3 py-3 font-bold uppercase tracking-wide" style={{ color: 'var(--blue-dark)', fontSize: '11px' }}>% Urgência</th>
            <th className="text-right px-3 py-3 font-bold uppercase tracking-wide" style={{ color: 'var(--blue-dark)', fontSize: '11px' }}>Pressão</th>
            <th className="text-right px-3 py-3 font-bold uppercase tracking-wide" style={{ color: 'var(--blue-dark)', fontSize: '11px' }}>Invisíveis</th>
          </tr>
        </thead>
        <tbody>
          {top.map(p => (
            <tr key={p.equipe_id} className="border-t" style={{ borderColor: 'var(--grey-mid)' }}>
              <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--grey-dark)' }}>
                {p.equipe_id.slice(0, 8)}…
              </td>
              <td className="px-3 py-3 text-right" style={{ color: 'var(--grey-text)' }}>{p.total_pacientes.toLocaleString('pt-BR')}</td>
              <td className="px-3 py-3 text-right" style={{ color: 'var(--grey-text)' }}>{p.pct_alto_risco.toFixed(1)}%</td>
              <td className="px-3 py-3 text-right" style={{ color: 'var(--grey-text)' }}>{p.pct_sem_visita.toFixed(1)}%</td>
              <td className="px-3 py-3 text-right" style={{ color: 'var(--grey-text)' }}>{p.pct_urgencia.toFixed(1)}%</td>
              <td className="px-3 py-3 text-right font-bold" style={{ color: pressaoColor(p.score_pressao) }}>
                {p.score_pressao.toFixed(1)}
              </td>
              <td className="px-3 py-3 text-right" style={{ color: 'var(--grey-text)' }}>
                <span title="Alto risco sem visita">{p.alto_risco_invisivel}</span>
                {p.crise_sem_vinculo > 0 && (
                  <span className="ml-2 text-xs px-2 py-1 rounded-full font-bold" style={{ background: 'var(--p1-bg)', color: 'var(--p1-text)' }} title="Crise sem vínculo">
                    {p.crise_sem_vinculo} crise
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/peterflag/Documents/Projects/Impact/src/frontend && npx tsc --noEmit 2>&1 | tail -5`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/frontend/components/pressao-table.tsx
git commit -m "feat(frontend): componente PressaoTable (Fase 4a)"
```

---

### Task 3: Componente `InvisivelCounters`

**Files:**
- Create: `src/frontend/components/invisivel-counters.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
import type { InvisivelResponse } from '@/lib/api';

interface Props {
  data: InvisivelResponse;
}

const LABELS: Record<1 | 2 | 3, { titulo: string; descricao: string; tom: 'red' | 'orange' | 'yellow' }> = {
  1: {
    titulo: 'Crise sem vínculo',
    descricao: '3+ urgências e zero visita do ACS no ano',
    tom: 'red',
  },
  2: {
    titulo: 'Alto risco sem contato',
    descricao: 'Gestante, criança 0-6, hipertenso, diabético, idoso ou vulnerável sem visita',
    tom: 'orange',
  },
  3: {
    titulo: 'Sem contato',
    descricao: 'Sem condição especial, mas zero visita',
    tom: 'yellow',
  },
};

function tomToStyles(tom: 'red' | 'orange' | 'yellow') {
  if (tom === 'red')    return { bg: 'var(--p1-bg)', text: 'var(--p1-text)', border: 'var(--p1-border)' };
  if (tom === 'orange') return { bg: 'var(--p2-bg)', text: 'var(--p2-text)', border: 'var(--p2-border)' };
  return                       { bg: 'var(--p3-bg)', text: 'var(--p3-text)', border: 'var(--p3-border)' };
}

export function InvisivelCounters({ data }: Props) {
  if (data.total === 0) {
    return (
      <div className="rounded-lg p-6 text-sm" style={{ background: 'var(--grey-card)', color: 'var(--grey-text)' }}>
        Sem invisíveis detectados ainda. Recalcular scores primeiro para popular as categorias.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {([1, 2, 3] as const).map(cat => {
        const meta = LABELS[cat];
        const s = tomToStyles(meta.tom);
        const n = data.por_categoria[cat];
        return (
          <div
            key={cat}
            className="rounded-lg p-5"
            style={{ background: s.bg, borderLeft: `4px solid ${s.border}` }}
          >
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: s.text }}>
              Categoria {cat}
            </p>
            <p className="text-4xl font-black mt-2" style={{ color: s.text }}>
              {n.toLocaleString('pt-BR')}
            </p>
            <p className="text-sm font-bold mt-2" style={{ color: 'var(--grey-dark)' }}>
              {meta.titulo}
            </p>
            <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--grey-text)' }}>
              {meta.descricao}
            </p>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/frontend/components/invisivel-counters.tsx
git commit -m "feat(frontend): componente InvisivelCounters (Fase 4a)"
```

---

### Task 4: Integrar no `app/page.tsx`

**Files:**
- Modify: `src/frontend/app/page.tsx`

- [ ] **Step 1: Atualizar imports**

No topo do arquivo, adicionar aos imports existentes:

```typescript
import { PressaoTable } from '@/components/pressao-table';
import { InvisivelCounters } from '@/components/invisivel-counters';
```

- [ ] **Step 2: Adicionar fetches em `Promise.all`**

Substituir o atual:
```typescript
const [kpis, topPatients, hotspots, equipes] = await Promise.all([
  apiClient.kpis(),
  apiClient.patients({ limit: 12 }),
  apiClient.heatmap().catch(() => []),
  apiClient.equipesSedes().catch(() => []),
]);
```

Por:
```typescript
const [kpis, topPatients, hotspots, equipes, painel, invisiveis] = await Promise.all([
  apiClient.kpis(),
  apiClient.patients({ limit: 12 }),
  apiClient.heatmap().catch(() => []),
  apiClient.equipesSedes().catch(() => []),
  apiClient.gestaoPainel().catch(() => []),
  apiClient.gestaoInvisiveis({ limit: 1 }).catch(() => ({ total: 0, por_categoria: { 1: 0, 2: 0, 3: 0 }, invisiveis: [] })),
]);
```

- [ ] **Step 3: Adicionar duas seções novas no JSX**

Inserir DEPOIS da seção "Mapa do território" (o `<section>` que tem `<MapSection .../>`) e ANTES da seção "Top 12 prioridades":

```tsx
<section>
  <h2 className="text-2xl font-black mb-3" style={{ color: 'var(--blue-secondary)' }}>
    Pacientes invisíveis
  </h2>
  <p className="text-sm mb-4 max-w-2xl" style={{ color: 'var(--grey-text)' }}>
    Pacientes sem nenhuma visita registrada no ano, classificados em 3 categorias de risco.
    O grupo 1 (crise sem vínculo) é o mais crítico — pessoas que foram ao hospital 3+ vezes
    e ainda assim não têm vínculo com a equipe de saúde da família.
  </p>
  <InvisivelCounters data={invisiveis} />
</section>

<section>
  <h2 className="text-2xl font-black mb-3" style={{ color: 'var(--blue-secondary)' }}>
    Pressão por equipe
  </h2>
  <p className="text-sm mb-4 max-w-2xl" style={{ color: 'var(--grey-text)' }}>
    Ranking de equipes por score composto de pressão (40% alto risco + 40% sem visita +
    20% urgência). Top 10 equipes do território — quem precisa de reforço operacional.
  </p>
  <PressaoTable painel={painel} limit={10} />
</section>
```

- [ ] **Step 4: Validar visualmente — subir frontend e bater na home**

Subir frontend em background:
```bash
cd /Users/peterflag/Documents/Projects/Impact/src/frontend && npm run dev
```

Esperar 10s, depois fazer um curl pra confirmar que a página renderiza:

```bash
sleep 10
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/
```

Esperado: HTTP 200. Se 500, há algum erro de runtime — investigar nos logs do dev server. (Backend precisa estar rodando também — caso contrário os `.catch(() => [])` cobrem.)

Matar o frontend antes do commit.

- [ ] **Step 5: Typecheck final**

Run: `cd /Users/peterflag/Documents/Projects/Impact/src/frontend && npx tsc --noEmit 2>&1 | tail -5`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/frontend/app/page.tsx
git commit -m "feat(frontend): dashboard com painel de pressao e invisiveis (Fase 4a)"
```

---

## Self-Review

**1. Spec coverage:**

| Frente | Task |
|---|---|
| Tabela de pressão por equipe na home | Task 2 + Task 4 |
| Contadores das 3 categorias de invisíveis | Task 3 + Task 4 |
| `apiClient.gestaoPainel`, `gestaoInvisiveis` | Task 1 |
| `apiClient.agendaEquipe` (pro `/acs` da Fase 4b) | Task 1 |
| Recalibração de `scoreToPriority` pra escala 0-250 | Task 1 |

**2. Placeholder scan:** zero TBD. Smoke test no Step 4 da Task 4 valida render — não força dados; usa `.catch` pra tolerar backend offline.

**3. Type consistency:**
- `PainelEquipe` e `InvisivelResponse` definidos em Task 1, usados em Tasks 2 e 3.
- Tokens CSS do brandbook (`--p1-text`, `--blue-secondary`, etc) já existem no `globals.css` (Fase 1 anterior).

**4. Riscos:**
- **`InvisivelCounters` recebe `limit: 1`** no fetch do `page.tsx` porque só queremos os contadores `por_categoria`, não a lista. Custo de query menor.
- **Sem rescore completo**, `por_categoria` ainda mostra `{1:1, 2:87, 3:148}` — quando você rodar `rescore_all`, sobe pra ~790 / ~14k / etc.
- **`scoreToPriority` mudou.** Se algum componente do frontend já estava usando "Alto"/"Médio" como string, vai ficar "Atenção". Isso é desejado (alinhamento com backend), mas conferir no `score-badge.tsx` que a UI continua coerente.

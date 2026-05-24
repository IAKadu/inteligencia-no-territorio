# Fase 4b — Rota `/acs` (agenda diária)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Tasks 1–3.

**Goal:** Nova rota `/acs` no Next.js mostrando a agenda diária otimizada de uma equipe — pacientes ordenados em sequência de visita por proximidade, com justificativa Claude, distância acumulada, e mapa da rota. UI mobile-first, mas usável em desktop pra demo.

**Architecture:** 1 página server component que aceita query params `?equipe_id=X&capacidade=N`. Sem query params: mostra select de equipe + botão "Gerar". Com query params: chama `apiClient.agendaEquipe()` e renderiza summary + lista de cards + mapa. **Não** vamos reproduzir os 4 painéis do dev parceiro — visão única, scrollável, simples. Suficiente pro pitch.

**Tech Stack:** Next.js 16 + Tailwind v4 + brand tokens. Componentes server por padrão; só vira client quando precisar de estado (seletor de equipe interativo).

**Escopo intencional:**
- ✅ Listar agenda gerada
- ✅ Summary bar (n visitas, km total, n críticos)
- ✅ Cards com tags de risco, score, distância, justificativa
- ✅ Mapa com sede + pontos numerados (reutiliza `MapSection`-like component novo)
- ❌ Bottom-nav, painéis Invisíveis/Perfil (cobertos pelo dashboard `/`)
- ❌ Check-in de visita / fluxo de campo real (Fase 5+ se sobrar tempo)

---

## File Structure

**Create:**
- `src/frontend/app/acs/page.tsx` — server component, recebe `searchParams`, renderiza tudo.
- `src/frontend/components/agenda-summary.tsx` — barra com n visitas, km, críticos, urgentes.
- `src/frontend/components/agenda-card.tsx` — card de um item da agenda (server component puro).
- `src/frontend/components/agenda-map.tsx` — mapa client component com sede + pontos numerados.
- `src/frontend/components/equipe-selector.tsx` — client component pequeno: select de equipe + capacidade + botão.

**Modify:**
- `src/frontend/components/topbar.tsx` — adicionar link "Agenda do dia" pra `/acs`.

---

### Task 1: Selector + Summary + Card (componentes)

**Files:**
- Create: `src/frontend/components/equipe-selector.tsx`
- Create: `src/frontend/components/agenda-summary.tsx`
- Create: `src/frontend/components/agenda-card.tsx`

- [ ] **Step 1: equipe-selector.tsx (client component)**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { EquipeSede } from '@/lib/api';

interface Props {
  equipes: EquipeSede[];
  initialEquipe?: string;
  initialCapacidade?: number;
}

export function EquipeSelector({ equipes, initialEquipe, initialCapacidade }: Props) {
  const router = useRouter();
  const [equipe, setEquipe] = useState(initialEquipe ?? '');
  const [capacidade, setCapacidade] = useState(initialCapacidade ?? 6);

  function gerar() {
    if (!equipe) return;
    const q = new URLSearchParams({ equipe_id: equipe, capacidade: String(capacidade) });
    router.push(`/acs?${q.toString()}`);
  }

  return (
    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end p-4 rounded-lg" style={{ background: 'var(--grey-card)' }}>
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--blue-dark)' }}>
          Equipe
        </label>
        <select
          value={equipe}
          onChange={e => setEquipe(e.target.value)}
          className="w-full px-3 py-2 rounded-md font-mono text-sm"
          style={{ background: 'var(--white)', border: '1px solid var(--grey-mid)', color: 'var(--grey-dark)' }}
        >
          <option value="">— Selecionar equipe —</option>
          {equipes.map(e => (
            <option key={e.equipe_id} value={e.equipe_id}>
              {e.equipe_id.slice(0, 12)}… · {e.n_pacientes} pacientes
            </option>
          ))}
        </select>
      </div>
      <div className="w-full md:w-28">
        <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--blue-dark)' }}>
          Capacidade
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={capacidade}
          onChange={e => setCapacidade(Number(e.target.value))}
          className="w-full px-3 py-2 rounded-md text-sm"
          style={{ background: 'var(--white)', border: '1px solid var(--grey-mid)', color: 'var(--grey-dark)' }}
        />
      </div>
      <button
        onClick={gerar}
        disabled={!equipe}
        className="px-5 py-2 rounded-md font-bold uppercase tracking-wider text-sm whitespace-nowrap transition-opacity"
        style={{
          background: equipe ? 'var(--blue-light)' : 'var(--grey-mid)',
          color: 'var(--white)',
          opacity: equipe ? 1 : 0.6,
          cursor: equipe ? 'pointer' : 'not-allowed',
        }}
      >
        Gerar agenda
      </button>
    </div>
  );
}
```

- [ ] **Step 2: agenda-summary.tsx**

```tsx
import type { Agenda } from '@/lib/api';

interface Props {
  agenda: Agenda;
}

export function AgendaSummary({ agenda }: Props) {
  const criticos = agenda.agenda.filter(a => a.prioridade === 'CRITICO').length;
  const urgentes = agenda.agenda.filter(a => a.prioridade === 'URGENTE').length;
  const invisiveis = agenda.agenda.filter(a => a.flag_invisivel || a.flag_crise_sem_vinculo).length;

  const items = [
    { label: 'Visitas',     value: agenda.total_itens, color: 'var(--blue-secondary)' },
    { label: 'Distância',   value: `${agenda.distancia_total_km.toFixed(1)} km`, color: 'var(--grey-dark)' },
    { label: 'Críticos',    value: criticos, color: 'var(--p1-text)' },
    { label: 'Urgentes',    value: urgentes, color: 'var(--p2-text)' },
    { label: 'Invisíveis',  value: invisiveis, color: 'var(--p3-text)' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {items.map(it => (
        <div key={it.label} className="rounded-lg p-3 text-center" style={{ background: 'var(--white)', border: '1px solid var(--grey-mid)' }}>
          <p className="text-2xl font-black" style={{ color: it.color }}>{it.value}</p>
          <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--grey-text)' }}>{it.label}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: agenda-card.tsx**

```tsx
import type { AgendaItem } from '@/lib/api';

interface Props {
  item: AgendaItem;
}

const PRIOR_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  CRITICO: { bg: 'var(--p1-bg)', text: 'var(--p1-text)', border: 'var(--p1-border)' },
  URGENTE: { bg: 'var(--p2-bg)', text: 'var(--p2-text)', border: 'var(--p2-border)' },
  ATENCAO: { bg: 'var(--p3-bg)', text: 'var(--p3-text)', border: 'var(--p3-border)' },
  ROTINA:  { bg: 'var(--p4-bg)', text: 'var(--p4-text)', border: 'var(--p4-border)' },
};

function tags(item: AgendaItem): { text: string; tone: 'red' | 'orange' | 'blue' | 'grey' }[] {
  const out: { text: string; tone: 'red' | 'orange' | 'blue' | 'grey' }[] = [];
  if (item.flag_crise_sem_vinculo) out.push({ text: 'Crise sem vínculo', tone: 'red' });
  if (item.flag_invisivel)         out.push({ text: '★ 1º contato',     tone: 'orange' });
  if (item.gestacao === 1)         out.push({ text: 'Gestante',         tone: 'orange' });
  if (item.hipertenso === 1)       out.push({ text: 'Hipertenso',       tone: 'blue' });
  if (item.diabetico === 1)        out.push({ text: 'Diabético',        tone: 'blue' });
  if (item.situacao_vulnerabilidade === 1) out.push({ text: 'Vulnerável', tone: 'grey' });
  if (item.faixa_etaria === '66+') out.push({ text: 'Idoso 66+',        tone: 'grey' });
  if (item.faixa_etaria === '0-6') out.push({ text: 'Criança 0-6',      tone: 'grey' });
  if (item.n_urg_30d > 0)          out.push({ text: `${item.n_urg_30d} urg < 30d`, tone: 'red' });
  if (item.tem_agendamento_futuro) out.push({ text: 'Consulta agendada', tone: 'blue' });
  return out;
}

function tagStyle(tone: 'red' | 'orange' | 'blue' | 'grey') {
  if (tone === 'red')    return { bg: 'var(--p1-bg)', text: 'var(--p1-text)' };
  if (tone === 'orange') return { bg: 'var(--p2-bg)', text: 'var(--p2-text)' };
  if (tone === 'blue')   return { bg: 'rgba(0,192,244,.12)', text: 'var(--blue-dark)' };
  return                       { bg: 'var(--grey-card)', text: 'var(--grey-text)' };
}

export function AgendaCard({ item }: Props) {
  const prior = PRIOR_STYLE[item.prioridade ?? 'ROTINA'] ?? PRIOR_STYLE.ROTINA;

  return (
    <article className="rounded-lg overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--grey-mid)' }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: prior.bg, borderBottom: `2px solid ${prior.border}` }}>
        <div className="flex items-center justify-center w-10 h-10 rounded-full font-black text-lg" style={{ background: 'var(--white)', color: prior.text, border: `2px solid ${prior.border}` }}>
          {item.ordem_visita}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: prior.text }}>
            {item.prioridade ?? 'ROTINA'} · Score {Math.round(item.score)}
          </p>
          <p className="text-xs font-mono mt-0.5 truncate" style={{ color: 'var(--grey-dark)' }}>
            {item.paciente_id.slice(0, 16)}…
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--grey-text)' }}>Trecho</p>
          <p className="text-sm font-black" style={{ color: 'var(--grey-dark)' }}>{item.distancia_anterior_km.toFixed(2)} km</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {tags(item).map((t, i) => {
            const s = tagStyle(t.tone);
            return (
              <span key={i} className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: s.bg, color: s.text }}>
                {t.text}
              </span>
            );
          })}
        </div>

        {item.justificativa && (
          <div className="rounded-md p-3 text-sm leading-snug" style={{ background: 'var(--grey-card)', color: 'var(--grey-dark)' }}>
            {item.justificativa}
          </div>
        )}

        <div className="flex justify-between text-xs" style={{ color: 'var(--grey-text)' }}>
          <span>Última visita: {item.dias_sem_visita < 999 ? `há ${item.dias_sem_visita}d` : 'nunca'}</span>
          <span>Acumulado: {item.distancia_acumulada_km.toFixed(2)} km</span>
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `cd /Users/peterflag/Documents/Projects/Impact/src/frontend && npx tsc --noEmit 2>&1 | tail -5`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/frontend/components/equipe-selector.tsx src/frontend/components/agenda-summary.tsx src/frontend/components/agenda-card.tsx
git commit -m "feat(frontend): componentes equipe-selector, agenda-summary, agenda-card (Fase 4b)"
```

---

### Task 2: Mapa da agenda (client component com Leaflet)

**Files:**
- Create: `src/frontend/components/agenda-map.tsx`

> Padrão Leaflet do projeto já está em `components/heatmap-map.tsx` e `components/map-section.tsx`. Esse novo mapa é simpler: sede + N pontos numerados + linha conectando-os na ordem.

- [ ] **Step 1: Criar o componente**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import type { Agenda } from '@/lib/api';

interface Props {
  agenda: Agenda;
}

export function AgendaMap({ agenda }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Dynamic import — Leaflet só roda no browser
      const L = (await import('leaflet')).default;
      // CSS já é importado globalmente (ver layout.tsx ou outro mapa do projeto)
      await import('leaflet/dist/leaflet.css');

      if (cancelled || !containerRef.current) return;

      // Limpar mapa anterior se houver (HMR / re-mount)
      const w = containerRef.current as unknown as { _leaflet_id?: number };
      if (w._leaflet_id) {
        const old = mapRef.current as { remove?: () => void } | null;
        if (old?.remove) old.remove();
      }

      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false });
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      // Pontos da rota
      const pts: [number, number][] = [
        [agenda.sede.lat, agenda.sede.lon],
        ...agenda.agenda.map(a => [a.endereco_latitude, a.endereco_longitude] as [number, number]),
      ];

      // Bounds
      map.fitBounds(pts, { padding: [30, 30] });

      // Sede (azul escuro)
      L.circleMarker([agenda.sede.lat, agenda.sede.lon], {
        radius: 10,
        color: '#003660',
        weight: 3,
        fillColor: '#1863dc',
        fillOpacity: 0.9,
      }).addTo(map).bindTooltip('Sede da equipe', { permanent: false });

      // Linha da rota
      L.polyline(pts, {
        color: '#1863dc',
        weight: 3,
        opacity: 0.6,
        dashArray: '6,8',
      }).addTo(map);

      // Pontos numerados
      agenda.agenda.forEach(a => {
        const color =
          a.prioridade === 'CRITICO' ? '#dc3545' :
          a.prioridade === 'URGENTE' ? '#fd7e14' :
          a.prioridade === 'ATENCAO' ? '#ffc107' : '#28a745';

        const html = `<div style="
          background:${color};
          color:white;
          width:28px;height:28px;
          border-radius:50%;
          border:2px solid white;
          box-shadow:0 1px 4px rgba(0,0,0,.35);
          display:flex;align-items:center;justify-content:center;
          font-weight:900;font-size:13px;font-family:sans-serif;
        ">${a.ordem_visita}</div>`;

        const icon = L.divIcon({ html, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
        L.marker([a.endereco_latitude, a.endereco_longitude], { icon })
          .addTo(map)
          .bindTooltip(`Visita ${a.ordem_visita} · ${a.prioridade ?? 'ROTINA'} · ${a.distancia_anterior_km.toFixed(2)} km`);
      });
    })();

    return () => {
      cancelled = true;
      const m = mapRef.current as { remove?: () => void } | null;
      if (m?.remove) m.remove();
      mapRef.current = null;
    };
  }, [agenda]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
      style={{ height: '420px', border: '1px solid var(--grey-mid)' }}
    />
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/frontend/components/agenda-map.tsx
git commit -m "feat(frontend): AgendaMap com Leaflet (rota numerada por prioridade)"
```

---

### Task 3: Página /acs + link no topbar

**Files:**
- Create: `src/frontend/app/acs/page.tsx`
- Modify: `src/frontend/components/topbar.tsx`

- [ ] **Step 1: Criar a página**

```tsx
import { apiClient } from '@/lib/api';
import { EquipeSelector } from '@/components/equipe-selector';
import { AgendaSummary } from '@/components/agenda-summary';
import { AgendaCard } from '@/components/agenda-card';
import { AgendaMap } from '@/components/agenda-map';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ equipe_id?: string; capacidade?: string; com_justificativas?: string }>;
}

export default async function AcsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const equipe_id = params.equipe_id;
  const capacidade = params.capacidade ? Number(params.capacidade) : 6;
  const com_justificativas = params.com_justificativas === 'true';

  const equipes = await apiClient.equipesSedes().catch(() => []);

  let agenda = null as Awaited<ReturnType<typeof apiClient.agendaEquipe>> | null;
  let erro: string | null = null;
  if (equipe_id) {
    try {
      agenda = await apiClient.agendaEquipe(equipe_id, { capacidade, com_justificativas: true });
    } catch (err) {
      erro = (err as Error).message;
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="t-section-label">ACS</p>
        <h1 className="t-section-title">Agenda do dia</h1>
        <p className="text-sm mt-3 max-w-2xl leading-relaxed" style={{ color: 'var(--grey-text)' }}>
          Sequência otimizada de visitas para a equipe selecionada. Pacientes ordenados por
          proximidade geográfica a partir da sede, priorizados por score composto.
        </p>
      </header>

      <EquipeSelector equipes={equipes} initialEquipe={equipe_id} initialCapacidade={capacidade} />

      {!equipe_id && (
        <div className="rounded-lg p-8 text-center" style={{ background: 'var(--grey-card)', color: 'var(--grey-text)' }}>
          Selecione uma equipe acima para gerar a agenda do dia.
        </div>
      )}

      {erro && (
        <div className="rounded-lg p-4 text-sm" style={{ background: 'var(--p1-bg)', color: 'var(--p1-text)', border: '1px solid var(--p1-border)' }}>
          Erro: {erro}
        </div>
      )}

      {agenda && (
        <>
          <AgendaSummary agenda={agenda} />

          {agenda.total_itens === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ background: 'var(--grey-card)', color: 'var(--grey-text)' }}>
              Nenhum paciente prioritário encontrado pra essa equipe.
              <br />
              Os scores podem ainda não ter sido calculados — rodar o re-score completo.
            </div>
          ) : (
            <>
              <section>
                <h2 className="text-xl font-black mb-3" style={{ color: 'var(--blue-secondary)' }}>
                  Rota
                </h2>
                <AgendaMap agenda={agenda} />
              </section>

              <section>
                <h2 className="text-xl font-black mb-3" style={{ color: 'var(--blue-secondary)' }}>
                  Sequência de visitas
                </h2>
                <div className="space-y-3">
                  {agenda.agenda.map(it => <AgendaCard key={it.paciente_id} item={it} />)}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Adicionar link "Agenda do dia" no topbar**

Ler `src/frontend/components/topbar.tsx` primeiro pra identificar onde estão os outros links de navegação.

Esperado: o topbar tem links pra `/`, `/pacientes`, `/chat`. Use Edit pra adicionar um link `/acs` com label `Agenda` no mesmo padrão dos outros. Se a estrutura do topbar não tiver pattern claro de links, REPORT com o conteúdo atual e eu (controller) decido onde adicionar.

- [ ] **Step 3: Typecheck**

Run: `cd /Users/peterflag/Documents/Projects/Impact/src/frontend && npx tsc --noEmit 2>&1 | tail -10`
Expected: 0 errors.

- [ ] **Step 4: Visual smoke test**

Start frontend in background:
```bash
cd /Users/peterflag/Documents/Projects/Impact/src/frontend && npm run dev
```

Wait 15s for compile, then:

```bash
sleep 15

# 1. /acs sem params — deve mostrar seletor + mensagem "Selecione uma equipe"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/acs
curl -s http://localhost:3000/acs | grep -c "Selecione uma equipe" || true

# 2. /acs com equipe valida (pegar do backend)
EID=$(curl -s "http://localhost:3001/api/territory/equipes" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data[0]['equipe_id'] if data else '')")
echo "Equipe usada: $EID"
curl -s -o /dev/null -w "HTTP %{http_code}\n" "http://localhost:3000/acs?equipe_id=$EID&capacidade=4"
curl -s "http://localhost:3000/acs?equipe_id=$EID&capacidade=4" | grep -c "Sequência de visitas\|Nenhum paciente prioritário" || true
```

Expected:
- Caso (1): HTTP 200, grep ≥ 1 (mensagem aparece)
- Caso (2): HTTP 200, grep ≥ 1 (seja a tabela de visitas ou o estado vazio)

**Importante:** o smoke test depende do backend estar rodando. Se HTTP 500, ver os logs do dev server. Se backend offline, o `.catch` na equipesSedes salva, mas `agendaEquipe` vai jogar erro (capturado em `erro`). Aceitar caso (1) sem caso (2) **se backend não estiver rodando** — reportar nesse caso.

Matar o dev server (pkill -f "next dev" ou TaskStop) antes do commit.

- [ ] **Step 5: Commit**

```bash
cd /Users/peterflag/Documents/Projects/Impact
git add src/frontend/app/acs/page.tsx src/frontend/components/topbar.tsx
git commit -m "feat(frontend): rota /acs com agenda otimizada + mapa + cards (Fase 4b)"
```

---

## Self-Review

**1. Spec coverage:**

| Frente | Task |
|---|---|
| Página `/acs` com query params | Task 3 |
| Seletor de equipe/capacidade | Task 1 (EquipeSelector) |
| Summary com n visitas, km, críticos, urgentes, invisíveis | Task 1 (AgendaSummary) |
| Card de paciente da agenda com tags + justificativa + distância | Task 1 (AgendaCard) |
| Mapa com sede + pontos numerados + linha | Task 2 (AgendaMap) |
| Link no topbar pra /acs | Task 3 Step 2 |
| Estado vazio (sem equipe, agenda vazia, erro) | Task 3 |
| Mobile-first | grid-cols-1 → md:grid-cols-N em todos os componentes |

**2. Placeholder scan:** zero TBD. Todos os componentes tem código completo. Smoke test depende de backend — Step 4 da Task 3 anota explicitamente o que esperar caso backend esteja offline.

**3. Type consistency:**
- `Agenda`, `AgendaItem`, `EquipeSede` (de `@/lib/api`) usados em todos os 5 componentes.
- `prioridade` é `string | null` no tipo (backend retorna `'CRITICO'|'URGENTE'|'ATENCAO'|'ROTINA'|null`). Componentes tratam `null` como ROTINA (fallback no `PRIOR_STYLE` da agenda-card).

**4. Riscos:**
- **Leaflet em SSR:** `useEffect` + dynamic import já evita SSR. Padrão idêntico ao `heatmap-map.tsx` que já está no projeto.
- **Justificativa demora 2-5s por paciente** (6 pacientes = 12-30s no primeiro load). Para o demo, pode aceitar. Se virar problema, adicionar opção `com_justificativas=false` no selector (já é suportado).
- **com_justificativas hard-coded como true** na chamada `apiClient.agendaEquipe` — sempre puxa justificativa quando há equipe_id. Trade-off de tempo de load vs. completude da UI. Aceitar pra demo.
- **Equipe sem score** retorna `total_itens: 0` — estado vazio coberto.

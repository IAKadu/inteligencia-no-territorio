// ACS Inteligente — Workspace screens
// Demonstrates the 3 main flows: rota of the day, patient detail, team summary.

const SAMPLE_PATIENTS = [
  { id: 'a3f7b812', team: '3c1d', name: 'Marisa A. de Souza',  priority: 1, age: 64, address: 'R. Visc. de Itaúna, 312 — Maré', lastVisit: '14 dias atrás', window: '08:30 – 09:00', reason: 'Ida à urgência há 3 dias. Hipertensa, sem visita há 14 dias. Risco de descompensação.', tags: [ { kind: 'hipertenso', label: 'Hipertenso' }, { kind: 'emergencia', label: 'Emergência recente' }, { kind: 'vulneravel', label: 'Vulnerável' } ] },
  { id: 'b9c2e041', team: '3c1d', name: 'Beatriz N. Cardoso',  priority: 2, age: 28, address: 'R. Sen. Pompeu, 88 — Caju',     lastVisit: '6 dias atrás',  window: '09:15 – 09:45', reason: 'Gestante de 32 semanas. Consulta de pré-natal agendada para amanhã — ACS deve comunicar e confirmar transporte.', tags: [ { kind: 'gestante', label: 'Gestante' }, { kind: 'agendamento', label: 'Pré-natal amanhã' } ] },
  { id: 'd2a8f934', team: '3c1d', name: 'Carlos E. Tavares',   priority: 3, age: 71, address: 'Av. Brasil, 4.110 — Bonsucesso', lastVisit: '9 dias atrás',  window: '10:00 – 10:30', reason: 'Diabético. Última visita há 9 dias; frequência recomendada é 7. Sem sinais de descompensação reportados.', tags: [ { kind: 'diabetico', label: 'Diabético' } ] },
  { id: 'f1e50c77', team: '3c1d', name: 'Lúcia Pereira Lima',  priority: 4, age: 53, address: 'R. das Acácias, 27 — Penha',     lastVisit: '25 dias atrás', window: '11:00 – 11:30', reason: 'Visita de rotina. Sem condições crônicas ativas. Família com criança em vacinação em dia.', tags: [ { kind: 'crianca', label: 'Família com criança' } ] },
  { id: 'h74cabd1', team: '3c1d', name: 'João Batista Silva',  priority: 2, age: 67, address: 'R. Almeida, 14 — Manguinhos',    lastVisit: '8 dias atrás',  window: '13:30 – 14:00', reason: 'Hipertenso e diabético. Receita controlada vence em 4 dias — verificar reposição e adesão.', tags: [ { kind: 'hipertenso', label: 'Hipertenso' }, { kind: 'diabetico', label: 'Diabético' } ] },
  { id: 'k02e1187', team: '3c1d', name: 'Helena Marques Reis', priority: 1, age: 82, address: 'R. da Saudade, 9 — Ramos',       lastVisit: '21 dias atrás', window: '14:30 – 15:00', reason: 'Idosa, mora sozinha. Sem visita há 3 semanas. Última pressão aferida: 170/100.', tags: [ { kind: 'hipertenso', label: 'Hipertenso' }, { kind: 'vulneravel', label: 'Vulnerável' } ] },
];

// ─── Sidebar / Filters ─────────────────────────────────────────────────
function FiltersSidebar({ value, onChange, counts }) {
  const opts = [
    { key: 'all',  label: 'Todos os pacientes',   n: counts.all },
    { key: 'p1',   label: 'P1 · Urgente',          n: counts.p1,  dot: '#dc3545' },
    { key: 'p2',   label: 'P2 · Alto risco',       n: counts.p2,  dot: '#fd7e14' },
    { key: 'p3',   label: 'P3 · Médio',            n: counts.p3,  dot: '#ffc107' },
    { key: 'p4',   label: 'P4 · Rotina',           n: counts.p4,  dot: '#28a745' },
  ];
  return (
    <aside className="acs-sidebar">
      <p className="acs-eyebrow" style={{ marginBottom: 12 }}>Filtrar por prioridade</p>
      <ul className="acs-filters">
        {opts.map(o => (
          <li key={o.key}
              className={cx('acs-filter', value === o.key && 'is-active')}
              onClick={() => onChange(o.key)}>
            {o.dot && <span className="acs-filter__dot" style={{ background: o.dot }} />}
            <span className="acs-filter__label">{o.label}</span>
            <span className="acs-filter__count">{o.n}</span>
          </li>
        ))}
      </ul>

      <p className="acs-eyebrow" style={{ marginTop: 28, marginBottom: 12 }}>Condições clínicas</p>
      <div className="acs-chip-row">
        <span className="acs-chip">Hipertensos · 142</span>
        <span className="acs-chip">Diabéticos · 88</span>
        <span className="acs-chip">Gestantes · 17</span>
        <span className="acs-chip">{'<'} 2 anos · 34</span>
      </div>

      <div className="acs-team-card">
        <p className="acs-eyebrow">Equipe</p>
        <p className="acs-team-card__name">#3c1d — Maré / Manguinhos</p>
        <div className="acs-team-card__stats">
          <div><strong>421</strong><span>famílias</span></div>
          <div><strong>1.247</strong><span>pessoas</span></div>
          <div><strong>92%</strong><span>cobertura</span></div>
        </div>
      </div>
    </aside>
  );
}

// ─── Day strip — hero of the workspace ────────────────────────────────
function DayStrip({ done, total }) {
  const pct = Math.round((done / total) * 100);
  return (
    <section className="acs-day">
      <div>
        <p className="acs-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>Quinta · 21 de maio</p>
        <h1 className="acs-day__title">Sua rota de hoje</h1>
        <p className="acs-day__sub">
          {total} visitas priorizadas — começando pelos pacientes mais críticos.
          A IA do ACS Inteligente reorganizou a ordem com base em emergências da última semana.
        </p>
      </div>
      <div className="acs-day__progress">
        <div className="acs-day__ring">
          <svg viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0bb975" strokeWidth="3"
                    strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset="25" strokeLinecap="round" />
          </svg>
          <div className="acs-day__ring-label"><strong>{done}</strong>/{total}</div>
        </div>
        <div>
          <p className="acs-day__progress-label">Visitas concluídas</p>
          <p className="acs-day__progress-pct">{pct}% da rota</p>
        </div>
      </div>
    </section>
  );
}

// ─── List of today's visits (left column on workspace) ───────────────
function TodayVisits({ visits, onOpen, doneIds }) {
  return (
    <div className="acs-today">
      <SectionHead eyebrow="Cronograma" title="Próximas visitas"
                   action={<Button variant="ghost" size="sm">Reordenar manualmente</Button>} />
      <div className="acs-today__list">
        {visits.map(v => (
          <VisitListItem key={v.id} patient={v} onOpen={onOpen} done={doneIds.has(v.id)} />
        ))}
      </div>
    </div>
  );
}

// ─── Right column — the focused patient ─────────────────────────────
function PatientFocus({ patient, onStart, onClose }) {
  if (!patient) return (
    <div className="acs-focus acs-focus--empty">
      <p className="acs-eyebrow">Selecione um paciente</p>
      <p className="acs-focus__hint">Toque em uma visita à esquerda para ver o resumo clínico, motivo da prioridade e o histórico recente do paciente.</p>
    </div>
  );
  return (
    <div className="acs-focus">
      <PatientCard patient={patient} />
      <div className="acs-focus__details">
        <div className="acs-focus__col">
          <p className="acs-eyebrow">Resumo clínico</p>
          <ul className="acs-focus__list">
            <li><strong>{patient.age} anos</strong> · acompanhamento contínuo</li>
            <li>Última pressão: <strong>148/92</strong> (há 14 dias)</li>
            <li>Glicemia: <strong>118 mg/dL</strong> (em jejum)</li>
            <li>Receita de losartana <strong>vence em 6 dias</strong></li>
          </ul>
        </div>
        <div className="acs-focus__col">
          <p className="acs-eyebrow">Por que está priorizado</p>
          <ul className="acs-focus__list acs-focus__list--reasons">
            <li><span className="dot" style={{background:'#dc3545'}} />Passagem por UPA há 3 dias</li>
            <li><span className="dot" style={{background:'#fd7e14'}} />Sem visita há 14 dias (meta: 7)</li>
            <li><span className="dot" style={{background:'#ffc107'}} />Hipertensa com receita vencendo</li>
          </ul>
        </div>
      </div>
      <div className="acs-focus__cta">
        <Button variant="cta" onClick={() => onStart?.(patient)}>Iniciar visita agora</Button>
        <Button variant="secondary">Marcar como tentativa</Button>
      </div>
    </div>
  );
}

Object.assign(window, { SAMPLE_PATIENTS, FiltersSidebar, DayStrip, TodayVisits, PatientFocus });

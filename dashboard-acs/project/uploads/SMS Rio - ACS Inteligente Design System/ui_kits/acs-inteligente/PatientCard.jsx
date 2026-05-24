// ACS Inteligente — Patient card variants
// Used in: priority list, the rota of the day, search results.

function PatientCard({ patient, onOpen, compact = false }) {
  const p = PRIORITY[patient.priority] || PRIORITY[4];
  return (
    <article
      className={cx('acs-patient', compact && 'acs-patient--compact')}
      style={{ borderLeftColor: p.dot }}
      onClick={() => onOpen?.(patient)}
    >
      <div className="acs-patient__head">
        <div>
          <p className="acs-patient__id">Paciente #{patient.id} · Equipe #{patient.team}</p>
          <h3 className="acs-patient__name">{patient.name}</h3>
        </div>
        <PriorityPill level={patient.priority} />
      </div>

      <p className="acs-patient__reason">{patient.reason}</p>

      <div className="acs-patient__meta">
        <span className="acs-patient__meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 22s-7-5.5-7-12a7 7 0 0 1 14 0c0 6.5-7 12-7 12Z"/></svg>
          {patient.address}
        </span>
        <span className="acs-patient__meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          Última visita: {patient.lastVisit}
        </span>
      </div>

      {patient.tags?.length > 0 && (
        <div className="acs-patient__tags">
          {patient.tags.map(t => <ClinicalTag key={t.kind} kind={t.kind}>{t.label}</ClinicalTag>)}
        </div>
      )}

      {!compact && (
        <div className="acs-patient__actions">
          <Button variant="primary" size="sm">Iniciar visita</Button>
          <Button variant="secondary" size="sm">Ver perfil</Button>
          <Button variant="ghost" size="sm">Reagendar</Button>
        </div>
      )}
    </article>
  );
}

function VisitListItem({ patient, onOpen, done }) {
  const p = PRIORITY[patient.priority] || PRIORITY[4];
  return (
    <div className={cx('acs-list-item', done && 'is-done')} onClick={() => onOpen?.(patient)}>
      <span className="acs-list-item__dot" style={{ background: p.dot }} />
      <div className="acs-list-item__main">
        <div className="acs-list-item__row">
          <span className="acs-list-item__name">{patient.name}</span>
          <span className="acs-list-item__time">{patient.window}</span>
        </div>
        <div className="acs-list-item__row">
          <span className="acs-list-item__addr">{patient.address}</span>
          <span className="acs-list-item__pri" style={{ color: p.dot }}>P{patient.priority}</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PatientCard, VisitListItem });

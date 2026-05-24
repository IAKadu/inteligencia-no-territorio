// ACS Inteligente — shared UI primitives
// All components written as plain functional React, no JSX-runtime fancy.

const cx = (...a) => a.filter(Boolean).join(' ');

// ─── Brand bar (gray utility strip) ──────────────────────────────────────
function TopUtilityBar() {
  return (
    <div className="acs-topbar">
      <span className="acs-topbar__brand">PREFEITURA.RIO</span>
      <div className="acs-topbar__links">
        <span>Acessibilidade</span>
        <span>Carioca Digital</span>
        <span>1746</span>
      </div>
    </div>
  );
}

// ─── Main institutional nav ──────────────────────────────────────────────
function MainNav({ user, onLogout }) {
  return (
    <header className="acs-nav">
      <div className="acs-nav__logo">
        <img src="../../assets/logo-prefeitura-saude.png" alt="Prefeitura Rio · Saúde" />
        <div className="acs-nav__product">
          <span className="acs-nav__pill">ACS Inteligente</span>
        </div>
      </div>
      <nav className="acs-nav__links">
        <a className="is-active">Minha rota</a>
        <a>Pacientes</a>
        <a>Equipe</a>
        <a>Mapa</a>
        <a>Relatórios</a>
      </nav>
      <div className="acs-nav__user">
        <div className="acs-nav__user-info">
          <span className="acs-nav__user-name">{user?.name || 'Ana Souza'}</span>
          <span className="acs-nav__user-role">ACS · Equipe #3c1d</span>
        </div>
        <div className="acs-nav__avatar">{(user?.name || 'AS').slice(0,2).toUpperCase()}</div>
      </div>
    </header>
  );
}

// ─── Buttons ────────────────────────────────────────────────────────────
function Button({ variant = 'primary', size = 'md', children, icon, ...rest }) {
  return (
    <button className={cx('acs-btn', `acs-btn--${variant}`, size !== 'md' && `acs-btn--${size}`)} {...rest}>
      {icon && <span className="acs-btn__icon">{icon}</span>}
      {children}
    </button>
  );
}

// ─── Priority pill (P1–P4) ─────────────────────────────────────────────
const PRIORITY = {
  1: { label: 'Urgente',     bg: 'rgba(220,53,69,.10)',   fg: '#9b1c28', dot: '#dc3545' },
  2: { label: 'Alto risco',  bg: 'rgba(253,126,20,.10)',  fg: '#8d4a0c', dot: '#fd7e14' },
  3: { label: 'Médio',       bg: 'rgba(255,193,7,.12)',   fg: '#856404', dot: '#ffc107' },
  4: { label: 'Rotina',      bg: 'rgba(40,167,69,.10)',   fg: '#1a6630', dot: '#28a745' },
};
function PriorityPill({ level }) {
  const p = PRIORITY[level] || PRIORITY[4];
  return (
    <span className="acs-pill" style={{ background: p.bg, color: p.fg }}>
      <span className="acs-pill__dot" style={{ background: p.dot }} /> P{level} · {p.label}
    </span>
  );
}

// ─── Clinical tag ───────────────────────────────────────────────────────
const TAG_STYLES = {
  hipertenso:  { bg: 'rgba(0,192,244,.15)',  fg: '#0072a3' },
  diabetico:   { bg: 'rgba(253,126,20,.15)', fg: '#8d4a0c' },
  gestante:    { bg: 'rgba(232,62,140,.15)', fg: '#9d1f62' },
  vulneravel:  { bg: 'rgba(255,193,7,.20)',  fg: '#856404' },
  emergencia:  { bg: 'rgba(220,53,69,.12)',  fg: '#9b1c28' },
  agendamento: { bg: 'rgba(0,192,244,.15)',  fg: '#007fa5' },
  crianca:     { bg: 'rgba(11,185,117,.15)', fg: '#087a52' },
};
function ClinicalTag({ kind, children }) {
  const s = TAG_STYLES[kind] || { bg: '#ededed', fg: '#333' };
  return <span className="acs-tag" style={{ background: s.bg, color: s.fg }}>{children}</span>;
}

// ─── Status badge (general) ────────────────────────────────────────────
function Badge({ tone = 'neutral', children }) {
  return <span className={cx('acs-badge', `acs-badge--${tone}`)}>{children}</span>;
}

// ─── Search input ──────────────────────────────────────────────────────
function SearchInput({ placeholder = 'Buscar paciente, endereço ou condição…', value, onChange }) {
  return (
    <div className="acs-search">
      <input
        type="text"
        placeholder={placeholder}
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
      />
      <button aria-label="buscar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
      </button>
    </div>
  );
}

// ─── Section header used inside the workspace ──────────────────────────
function SectionHead({ eyebrow, title, action }) {
  return (
    <div className="acs-sec-head">
      <div>
        {eyebrow && <p className="acs-eyebrow">{eyebrow}</p>}
        <h2 className="acs-h2">{title}</h2>
      </div>
      {action}
    </div>
  );
}

Object.assign(window, { cx, TopUtilityBar, MainNav, Button, PriorityPill, ClinicalTag, Badge, SearchInput, SectionHead, PRIORITY });

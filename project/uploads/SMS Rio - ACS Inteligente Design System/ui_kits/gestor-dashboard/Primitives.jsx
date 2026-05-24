// Gestor Dashboard — atoms and shared primitives.
// Reuses the institutional Top Bar + Nav language from the ACS kit
// but reads "Painel do Gestor" mode.

const cx = (...a) => a.filter(Boolean).join(' ');

const SCORE_BAND = {
  critico:  { label: 'CRÍTICO',  color: '#dc3545', bg: 'rgba(220,53,69,.10)',  fg: '#9b1c28', range: '≥ 80' },
  urgente:  { label: 'URGENTE',  color: '#fd7e14', bg: 'rgba(253,126,20,.10)', fg: '#8d4a0c', range: '50–79' },
  atencao:  { label: 'ATENÇÃO',  color: '#ffc107', bg: 'rgba(255,193,7,.14)',  fg: '#856404', range: '20–49' },
  rotina:   { label: 'ROTINA',   color: '#28a745', bg: 'rgba(40,167,69,.10)',  fg: '#1a6630', range: '< 20' },
};
const scoreBand = (score) => score >= 80 ? 'critico' : score >= 50 ? 'urgente' : score >= 20 ? 'atencao' : 'rotina';

// ─── Institutional bars (gestor variant) ────────────────────────────
function TopUtilityBar() {
  return (
    <div className="gst-topbar">
      <span className="gst-topbar__brand">PREFEITURA.RIO</span>
      <div className="gst-topbar__links">
        <span>Acessibilidade</span><span>Carioca Digital</span><span>1746</span>
      </div>
    </div>
  );
}

function MainNav({ tab, onTab, user }) {
  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'teams',    label: 'Por Equipe' },
    { id: 'map',      label: 'Mapa de Cobertura' },
    { id: 'patients', label: 'Pacientes Críticos' },
    { id: 'alerts',   label: 'Alertas' },
  ];
  return (
    <header className="gst-nav">
      <div className="gst-nav__brand">
        <img src="../../assets/logo-prefeitura-saude.png" alt="Prefeitura Rio · Saúde" />
        <div className="gst-nav__product">
          <span className="gst-nav__pill">Inteligência no Território</span>
          <span className="gst-nav__role">Painel do Gestor · AP 3.1</span>
        </div>
      </div>
      <nav className="gst-nav__tabs">
        {tabs.map(t => (
          <a key={t.id}
             className={cx('gst-nav__tab', tab === t.id && 'is-active')}
             onClick={() => onTab(t.id)}>
            {t.label}
          </a>
        ))}
      </nav>
      <div className="gst-nav__user">
        <div className="gst-nav__user-info">
          <span className="gst-nav__user-name">{user?.name || 'Dra. Helena Vieira'}</span>
          <span className="gst-nav__user-role">{user?.role || 'Coordenadora · CF Ramos'}</span>
        </div>
        <div className="gst-nav__avatar">{(user?.name || 'HV').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>
      </div>
    </header>
  );
}

// ─── Section header ───────────────────────────────────────────────
function SectionHead({ eyebrow, title, action, sub }) {
  return (
    <div className="gst-sec-head">
      <div>
        {eyebrow && <p className="gst-eyebrow">{eyebrow}</p>}
        {title && <h2 className="gst-h2">{title}</h2>}
        {sub && <p className="gst-sub">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Button ──────────────────────────────────────────────────────
function Button({ variant = 'primary', size = 'md', children, icon, ...rest }) {
  return (
    <button className={cx('gst-btn', `gst-btn--${variant}`, size !== 'md' && `gst-btn--${size}`)} {...rest}>
      {icon && <span className="gst-btn__icon">{icon}</span>}{children}
    </button>
  );
}

// ─── Score / band pill ───────────────────────────────────────────
function BandPill({ band, score }) {
  const b = SCORE_BAND[band] || SCORE_BAND.rotina;
  return (
    <span className="gst-pill" style={{ background: b.bg, color: b.fg }}>
      <span className="gst-pill__dot" style={{ background: b.color }} />
      {b.label}{score != null && <span className="gst-pill__score"> · {score}</span>}
    </span>
  );
}

// ─── Status icons for the critical-patients table ────────────────
function StatusGlyph({ status }) {
  if (status === 'agenda')   return <span className="gst-status gst-status--ok">✓ Na agenda hoje</span>;
  if (status === 'sem')      return <span className="gst-status gst-status--warn">⚠ Sem agendamento</span>;
  if (status === 'primeiro') return <span className="gst-status gst-status--star">★ 1º contato pend.</span>;
  return <span className="gst-status">{status}</span>;
}

// ─── Coverage bar ────────────────────────────────────────────────
function CoverageBar({ pct, label }) {
  return (
    <div className="gst-coverage">
      {label && <div className="gst-coverage__label"><span>{label}</span><strong>{pct}%</strong></div>}
      <div className="gst-coverage__track">
        <div className="gst-coverage__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Trend arrow (↑ / → / ↓) ─────────────────────────────────────
function Trend({ delta }) {
  if (delta > 0) return <span className="gst-trend gst-trend--up">▲ +{delta.toFixed(1)}</span>;
  if (delta < 0) return <span className="gst-trend gst-trend--down">▼ {delta.toFixed(1)}</span>;
  return <span className="gst-trend gst-trend--flat">— 0.0</span>;
}

// ─── Sparkline (5 weekly values) ─────────────────────────────────
function Sparkline({ values, stroke = '#1863dc' }) {
  const max = Math.max(...values), min = Math.min(...values);
  const range = Math.max(1, max - min);
  const w = 120, h = 36;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg className="gst-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => (
        <circle key={i} cx={i * step} cy={h - ((v - min) / range) * (h - 4) - 2} r={i === values.length - 1 ? 2.5 : 1.5} fill={stroke} />
      ))}
    </svg>
  );
}

Object.assign(window, {
  cx, SCORE_BAND, scoreBand,
  TopUtilityBar, MainNav, SectionHead, Button, BandPill, StatusGlyph,
  CoverageBar, Trend, Sparkline,
});

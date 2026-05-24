// Gestor Dashboard — composite cards and dashboard widgets.

function StatTile({ value, label, sub, tone = 'neutral', big = false }) {
  return (
    <div className={cx('gst-stat', `gst-stat--${tone}`, big && 'gst-stat--big')}>
      <div className="gst-stat__value">{value}</div>
      <div className="gst-stat__label">{label}</div>
      {sub && <div className="gst-stat__sub">{sub}</div>}
    </div>
  );
}

function BandLegend() {
  const bands = [
    { k: 'critico', range: '≥ 80' },
    { k: 'urgente', range: '50–79' },
    { k: 'atencao', range: '20–49' },
    { k: 'rotina',  range: '< 20' },
  ];
  return (
    <div className="gst-legend">
      {bands.map(b => {
        const s = SCORE_BAND[b.k];
        return (
          <div className="gst-legend__item" key={b.k}>
            <span className="gst-legend__dot" style={{ background: s.color }} />
            <span className="gst-legend__label">{s.label}</span>
            <span className="gst-legend__range">{b.range}</span>
          </div>
        );
      })}
    </div>
  );
}

// Evolution bars used in the overview tab
function MonthlyBars({ values, labels }) {
  const max = Math.max(...values);
  return (
    <div className="gst-bars">
      {values.map((v, i) => (
        <div className="gst-bars__col" key={i}>
          <div className="gst-bars__bar" style={{ height: `${(v / max) * 100}%` }}>
            <span className="gst-bars__val">{v}%</span>
          </div>
          <div className="gst-bars__lbl">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

// Histogram for the team drilldown
function ScoreHistogram({ buckets }) {
  // buckets: [{ band, count }] in order critico → urgente → atencao → rotina
  const max = Math.max(...buckets.map(b => b.count));
  return (
    <div className="gst-hist">
      {buckets.map(b => {
        const s = SCORE_BAND[b.band];
        return (
          <div className="gst-hist__row" key={b.band}>
            <span className="gst-hist__band" style={{ color: s.fg }}>
              <span className="gst-hist__dot" style={{ background: s.color }} />{s.label}
            </span>
            <div className="gst-hist__track">
              <div className="gst-hist__fill" style={{ width: `${(b.count / max) * 100}%`, background: s.color }} />
            </div>
            <span className="gst-hist__n">{b.count.toLocaleString('pt-BR')}</span>
          </div>
        );
      })}
    </div>
  );
}

// Team-ranking row used inside the Por Equipe table
function TeamRow({ e, onOpen, active }) {
  const band = e.score >= 44 ? 'urgente' : e.score >= 38 ? 'atencao' : 'rotina';
  const color = SCORE_BAND[band].color;
  return (
    <tr className={cx('gst-row', active && 'is-active')} onClick={() => onOpen?.(e)}>
      <td>
        <div className="gst-team-cell">
          <code>#{e.id.slice(0,8)}</code>
          <span>{e.cf}</span>
        </div>
      </td>
      <td className="num">{e.pacs.toLocaleString('pt-BR')}</td>
      <td className="num">{e.risco.toFixed(1)}%</td>
      <td className="num">{e.semVis.toFixed(1)}%</td>
      <td className="num">{e.urg.toFixed(1)}%</td>
      <td>
        <span className="gst-score-chip" style={{ background: color, color: '#fff' }}>{e.score.toFixed(1)}</span>
      </td>
      <td><Trend delta={e.delta} /></td>
      <td><Sparkline values={e.spark} stroke={color} /></td>
    </tr>
  );
}

// Alert summary list
function AlertGroupList({ groups }) {
  return (
    <ul className="gst-alert-list">
      {groups.map(g => (
        <li key={g.kind} className={cx('gst-alert-row', `gst-alert-row--${g.tone}`)}>
          <span className="gst-alert-row__dot" />
          <span className="gst-alert-row__label">{g.label}</span>
          <span className="gst-alert-row__n">{g.n} pacientes</span>
        </li>
      ))}
    </ul>
  );
}

// Alerts-by-team summary used inside the alerts tab
function AlertsByTeamList({ rows }) {
  const max = Math.max(...rows.map(r => r.total));
  return (
    <div className="gst-abt">
      {rows.map(r => (
        <div className="gst-abt__row" key={r.id}>
          <code className="gst-abt__id">#{r.id.slice(0,8)}</code>
          <div className="gst-abt__bar">
            <div className="gst-abt__fill" style={{ width: `${(r.total / max) * 100}%` }}>
              <div className="gst-abt__alloc" style={{ width: `${(r.alloc / r.total) * 100}%` }} />
            </div>
          </div>
          <span className="gst-abt__count">{r.total} <span className="muted">/ {r.alloc} alocados</span></span>
        </div>
      ))}
    </div>
  );
}

// Card that surfaces a single unallocated alert needing manager action
function UnallocatedAlert({ patient }) {
  return (
    <div className="gst-unalloc">
      <div className="gst-unalloc__head">
        <span className="gst-unalloc__icon">⚠</span>
        <div>
          <p className="gst-unalloc__title">Alerta não alocado</p>
          <p className="gst-unalloc__meta">Paciente #{patient.id} · Equipe #{patient.equipe}</p>
        </div>
        <span className="gst-unalloc__ago">há 2 dias</span>
      </div>
      <p className="gst-unalloc__perfil">{patient.perfil} · {patient.urg} urgências/ano</p>
      <p className="gst-unalloc__reason">
        Motivo da não alocação: <strong>capacidade da equipe atingida</strong> (6/6 visitas alocadas).
      </p>
      <div className="gst-unalloc__actions">
        <Button variant="primary" size="sm">Alocar manualmente</Button>
        <Button variant="secondary" size="sm">Aumentar capacidade hoje</Button>
      </div>
    </div>
  );
}

// Data-quality alert panel
function DataQualityPanel({ items }) {
  return (
    <div className="gst-dq">
      <div className="gst-dq__head">
        <p className="gst-eyebrow">Qualidade de dados</p>
        <Button variant="ghost" size="sm">Encaminhar para revisão</Button>
      </div>
      <div className="gst-dq__grid">
        {items.map((it, i) => (
          <div className="gst-dq__item" key={i}>
            <div className="gst-dq__n">{it.n}</div>
            <div className="gst-dq__label">{it.label}</div>
            <div className="gst-dq__sub">{it.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Critical patients table
function CriticalPatientsTable({ rows, onOpen }) {
  return (
    <table className="gst-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Perfil clínico</th>
          <th>Urgências</th>
          <th>Score</th>
          <th>Equipe</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rows.map(p => {
          const band = scoreBand(p.score);
          return (
            <tr key={p.id} onClick={() => onOpen?.(p)}>
              <td><code className="gst-mono">#{p.id}</code></td>
              <td>{p.perfil}</td>
              <td className="num">{p.urg}</td>
              <td><BandPill band={band} score={p.score} /></td>
              <td><code className="gst-mono">#{p.equipe.slice(0,8)}</code></td>
              <td><StatusGlyph status={p.status} /></td>
              <td className="num"><a className="gst-link">Abrir →</a></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Filters bar used above tables
function FilterBar({ filters, onChange, query, onQuery }) {
  return (
    <div className="gst-filters">
      <div className="gst-search">
        <input value={query || ''} onChange={e => onQuery(e.target.value)} placeholder="Buscar paciente, equipe, condição…" />
        <button>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        </button>
      </div>
      {filters.map(f => (
        <select key={f.key} value={f.value} onChange={e => onChange(f.key, e.target.value)} className="gst-select">
          {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
    </div>
  );
}

// Map placeholder — a stylised territorial dotmap.
function TerritoryMap({ teams }) {
  // Deterministic-ish positions for visual layout — not real geo
  const dots = teams.map((t, i) => {
    const x = 80 + (i % 7) * 90 + ((i * 13) % 40);
    const y = 80 + Math.floor(i / 7) * 110 + ((i * 17) % 40);
    const band = t.score >= 44 ? '#dc3545' : t.score >= 38 ? '#ffc107' : '#28a745';
    const r = 14 + (t.pacs / 250);
    return { x, y, r, band, ...t };
  });

  return (
    <div className="gst-map">
      <svg viewBox="0 0 720 360" preserveAspectRatio="xMidYMid meet" className="gst-map__svg">
        <defs>
          <pattern id="gridP" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e5e5" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="720" height="360" fill="url(#gridP)" />
        {/* Coastline-ish curve, suggestive of Baía de Guanabara */}
        <path d="M0,280 C 120,260 200,300 300,250 C 400,200 540,260 720,210 L720,360 L0,360 Z"
              fill="rgba(0,74,128,.05)" stroke="#cfd6dc" strokeWidth="1" />
        {dots.map((d, i) => (
          <g key={i}>
            <circle cx={d.x} cy={d.y} r={d.r + 6} fill={d.band} opacity=".18" />
            <circle cx={d.x} cy={d.y} r={d.r} fill={d.band} opacity=".75" stroke="#fff" strokeWidth="2" />
            <text x={d.x} y={d.y + 4} textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff">
              {d.score.toFixed(0)}
            </text>
          </g>
        ))}
      </svg>
      <div className="gst-map__legend">
        <div><span className="gst-map__dot" style={{ background: '#dc3545' }} />Alta pressão (≥ 44)</div>
        <div><span className="gst-map__dot" style={{ background: '#ffc107' }} />Atenção (38–43)</div>
        <div><span className="gst-map__dot" style={{ background: '#28a745' }} />Sob controle (&lt; 38)</div>
        <div className="gst-map__hint">tamanho da bolha = pacientes cobertos</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  StatTile, BandLegend, MonthlyBars, ScoreHistogram, TeamRow,
  AlertGroupList, AlertsByTeamList, UnallocatedAlert,
  DataQualityPanel, CriticalPatientsTable, FilterBar, TerritoryMap,
});

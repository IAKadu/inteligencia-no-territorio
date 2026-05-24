// Painel do Gestor — composite cards & widgets.
// Reuses the design-system primitives (BandPill, Trend, Sparkline, etc).

// ─── Stat tile ───────────────────────────────────────────────
function StatTile({ value, label, sub, tone = 'neutral', big = false }) {
  return (
    <div className={cx('gst-stat', `gst-stat--${tone}`, big && 'gst-stat--big')}>
      <div className="gst-stat__value">{value}</div>
      <div className="gst-stat__label">{label}</div>
      {sub && <div className="gst-stat__sub">{sub}</div>}
    </div>
  );
}

// ─── Coverage with meta line ─────────────────────────────────
function CoverageWithMeta({ pct, meta, label }) {
  return (
    <div className="gst-cov2">
      <div className="gst-cov2__head">
        <span className="gst-cov2__label">{label}</span>
        <strong className="gst-cov2__pct">{pct}%</strong>
      </div>
      <div className="gst-cov2__track">
        <div className="gst-cov2__fill" style={{ width: `${pct}%` }} />
        <div className="gst-cov2__meta" style={{ left: `${meta}%` }}>
          <span className="gst-cov2__meta-lbl">Meta {meta}%</span>
        </div>
      </div>
      <div className="gst-cov2__scale">
        <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
      </div>
    </div>
  );
}

// ─── Monthly bars (vertical) ─────────────────────────────────
function MonthlyBars({ values, labels, suffix = '%' }) {
  const max = Math.max(...values);
  return (
    <div className="gst-bars">
      {values.map((v, i) => (
        <div className="gst-bars__col" key={i}>
          <div className="gst-bars__bar" style={{ height: `${(v / max) * 100}%` }}>
            <span className="gst-bars__val">{v}{suffix}</span>
          </div>
          <div className="gst-bars__lbl">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Score histogram (horizontal bars) ───────────────────────
function ScoreHistogram({ buckets }) {
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

// ─── Action list with priority dot ───────────────────────────
function ActionList({ items }) {
  const toneColor = { critico: '#dc3545', urgente: '#fd7e14', atencao: '#ffc107', rotina: '#28a745', neutral: '#6b6b6b' };
  return (
    <ul className="gst-actions">
      {items.map(it => (
        <li key={it.kind} className="gst-actions__row">
          <span className="gst-actions__dot" style={{ background: toneColor[it.tone] }} />
          <span className="gst-actions__n">{it.n}</span>
          <span className="gst-actions__label">{it.label}</span>
          <a className="gst-actions__cta">Ver →</a>
        </li>
      ))}
    </ul>
  );
}

// ─── Clinical tally ──────────────────────────────────────────
function ClinicalTally({ items }) {
  return (
    <ul className="gst-tally">
      {items.map((c, i) => (
        <li key={i}>
          <span className="dot" style={{ background: c.color }} />
          {c.label}
          <strong>{c.n.toLocaleString('pt-BR')}</strong>
          <span>({c.pct.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%)</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Team ranking row ────────────────────────────────────────
function TeamRow({ e, onOpen, active }) {
  const band = scoreBand(e.score);
  const color = SCORE_BAND[band].color;
  return (
    <tr className={cx(active && 'is-active')} onClick={() => onOpen?.(e)}>
      <td>
        <div className="gst-team-cell">
          <code>#{e.id}</code>
          <span>{e.cf}</span>
        </div>
      </td>
      <td className="num">{e.pacs.toLocaleString('pt-BR')}</td>
      <td className="num">{e.risco.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%</td>
      <td className="num">{e.semVis.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%</td>
      <td className="num">{e.urg.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%</td>
      <td><span className="gst-score-chip" style={{ background: color, color: '#fff' }}>{e.score.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</span></td>
      <td><Trend delta={e.delta} /></td>
      <td><Sparkline values={e.spark} stroke={color} /></td>
    </tr>
  );
}

// ─── Deficit-by-profile table ────────────────────────────────
function DeficitTable({ rows }) {
  return (
    <table className="gst-table gst-table--deficit">
      <thead>
        <tr>
          <th>Perfil</th>
          <th className="num">Régua (vis/ano)</th>
          <th className="num">Realizadas</th>
          <th className="num">Déficit</th>
          <th>% Cumprimento</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => {
          const b = SCORE_BAND[r.tone];
          return (
            <tr key={r.perfil}>
              <td><strong>{r.perfil}</strong></td>
              <td className="num">{r.regua.toLocaleString('pt-BR')}</td>
              <td className="num">{r.real.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</td>
              <td className="num gst-deficit">{r.deficit.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</td>
              <td>
                <div className="gst-pctcell">
                  <div className="gst-pctcell__track"><div className="gst-pctcell__fill" style={{ width: `${r.pct}%`, background: b.color }} /></div>
                  <span className="gst-pctcell__pct" style={{ color: b.fg }}>{r.pct}%</span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Horizontal bars (produtividade ACS) ─────────────────────
function HBarList({ rows }) {
  const max = Math.max(...rows.map(r => r.visitas));
  return (
    <ul className="gst-hbar">
      {rows.map(r => (
        <li key={r.id}>
          <div className="gst-hbar__meta">
            <code className="gst-hbar__id">{r.id}</code>
            <span className="gst-hbar__name">{r.nome}</span>
            <span className="gst-hbar__team">{r.equipe}</span>
          </div>
          <div className="gst-hbar__track">
            <div className="gst-hbar__fill" style={{ width: `${(r.visitas / max) * 100}%` }}>
              <span className="gst-hbar__n">{r.visitas}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Cadência bars ───────────────────────────────────────────
function CadenciaBars({ rows }) {
  const max = Math.max(...rows.map(r => r.n));
  return (
    <div className="gst-bars">
      {rows.map((r, i) => (
        <div className="gst-bars__col" key={i}>
          <div className="gst-bars__bar" style={{ height: `${(r.n / max) * 100}%` }}>
            <span className="gst-bars__val">{r.n.toLocaleString('pt-BR')}</span>
          </div>
          <div className="gst-bars__lbl">{r.faixa}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Patient critical table ──────────────────────────────────
function PatientsTable({ rows }) {
  return (
    <table className="gst-table gst-table--patients">
      <thead>
        <tr>
          <th>ID</th>
          <th>Perfil clínico</th>
          <th className="num">Dias sem visita</th>
          <th className="num">Urgências/ano</th>
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
            <tr key={p.id}>
              <td><code className="gst-mono">#{p.id}</code></td>
              <td>{p.perfil}</td>
              <td className="num">{p.diasSemVis}</td>
              <td className="num">{p.urgAno}</td>
              <td><BandPill band={band} score={p.score} /></td>
              <td><code className="gst-mono">#{p.equipe}</code></td>
              <td><StatusGlyph status={p.status} /></td>
              <td className="num"><a className="gst-link">Abrir →</a></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Dual line chart (sazonalidade) ──────────────────────────
function DualLineChart({ labels, a, b, aColor = '#dc3545', bColor = '#1863dc', aLabel = 'Urgências', bLabel = 'Agendamentos' }) {
  const W = 720, H = 220, P = { l: 48, r: 16, t: 16, b: 30 };
  const all = [...a, ...b];
  const max = Math.ceil(Math.max(...all) / 1000) * 1000;
  const min = 0;
  const innerW = W - P.l - P.r;
  const innerH = H - P.t - P.b;
  const x = (i) => P.l + (i * innerW) / (labels.length - 1);
  const y = (v) => P.t + innerH - ((v - min) / (max - min)) * innerH;
  const path = arr => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  const yTicks = 5;
  return (
    <div className="gst-chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="gst-chart__svg">
        {/* grid */}
        {Array.from({length: yTicks + 1}).map((_, i) => {
          const v = max - (i * max) / yTicks;
          const yy = P.t + (i * innerH) / yTicks;
          return (
            <g key={i}>
              <line x1={P.l} y1={yy} x2={W - P.r} y2={yy} stroke="#ededed" strokeWidth="1" />
              <text x={P.l - 8} y={yy + 4} fontSize="10" textAnchor="end" fill="#6b6b6b" fontFamily="JetBrains Mono">{v.toLocaleString('pt-BR')}</text>
            </g>
          );
        })}
        {/* x labels */}
        {labels.map((l, i) => (
          <text key={i} x={x(i)} y={H - 10} fontSize="10" textAnchor="middle" fill="#6b6b6b" fontWeight="700" style={{textTransform:'uppercase', letterSpacing:'0.06em'}}>{l}</text>
        ))}
        {/* agendamentos line */}
        <path d={path(b)} fill="none" stroke={bColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {b.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={bColor} />)}
        {/* urgências line */}
        <path d={path(a)} fill="none" stroke={aColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {a.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={aColor} />)}
      </svg>
      <div className="gst-chart__legend">
        <span><i style={{background: aColor}} />{aLabel}</span>
        <span><i style={{background: bColor}} />{bLabel}</span>
      </div>
    </div>
  );
}

// ─── Donut chart (urgência precedida) ────────────────────────
function DonutChart({ sim, nao, simColor = '#0bb975', naoColor = '#dc3545' }) {
  const total = sim + nao;
  const C = 2 * Math.PI * 50;
  const simArc = (sim / total) * C;
  return (
    <div className="gst-donut">
      <svg viewBox="0 0 140 140" className="gst-donut__svg">
        <circle cx="70" cy="70" r="50" fill="none" stroke={naoColor} strokeWidth="20" />
        <circle cx="70" cy="70" r="50" fill="none" stroke={simColor} strokeWidth="20"
                strokeDasharray={`${simArc} ${C - simArc}`} strokeDashoffset="0"
                transform="rotate(-90 70 70)" />
        <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="900" fill="#9b1c28" fontFamily="Cera Pro">{nao}%</text>
        <text x="70" y="86" textAnchor="middle" fontSize="9" fill="#6b6b6b" fontWeight="700" style={{textTransform:'uppercase', letterSpacing:'0.08em'}}>Sem contato</text>
      </svg>
      <div className="gst-donut__legend">
        <div><i style={{background: simColor}} /><strong>{sim}%</strong> com visita prévia (30d)</div>
        <div><i style={{background: naoColor}} /><strong>{nao}%</strong> sem visita prévia</div>
      </div>
    </div>
  );
}

// ─── Espiral table ───────────────────────────────────────────
function EspiralTable({ rows }) {
  return (
    <table className="gst-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Perfil clínico</th>
          <th className="num">Urgências/ano</th>
          <th>Última urgência</th>
          <th>Visitado antes?</th>
          <th>Equipe</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id}>
            <td><code className="gst-mono">#{r.id}</code></td>
            <td>{r.perfil}</td>
            <td className="num">{r.urgAno}</td>
            <td>{r.ultima}</td>
            <td>
              {r.visitado
                ? <span className="gst-status gst-status--ok">✓ Sim</span>
                : <span className="gst-status gst-status--warn">✗ Não</span>}
            </td>
            <td>{r.equipe}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

Object.assign(window, {
  StatTile, CoverageWithMeta, MonthlyBars, ScoreHistogram,
  ActionList, ClinicalTally, TeamRow,
  DeficitTable, HBarList, CadenciaBars,
  PatientsTable, DualLineChart, DonutChart, EspiralTable,
});

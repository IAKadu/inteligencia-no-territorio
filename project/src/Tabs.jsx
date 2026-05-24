// Painel do Gestor — conteúdo das 5 abas.

// ═══════════════════════════════════════════════════════════════
// ABA 1 — VISÃO GERAL
// ═══════════════════════════════════════════════════════════════
function TabOverview() {
  const k = KPI_OVERVIEW;
  return (
    <div className="gst-tab" data-screen-label="01 Visão Geral">
      <SectionHead
        eyebrow="Painel · Área Programática 3.1 · Semana 21/2025"
        title="Visão Geral"
        sub="O que decidir hoje, o que recuperar esta semana, para onde a AP está indo."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm">Atualizar scores</Button>
            <Button variant="secondary" size="sm">Exportar</Button>
          </div>
        }
      />

      {/* Decision block — agir hoje / esta semana / tendência */}
      <div className="gst-decision">
        <div className="gst-decision__row gst-decision__row--hoje">
          <div className="gst-decision__head">
            <span className="gst-decision__tag">Agir hoje</span>
            <span className="gst-decision__when">Antes do fim do turno</span>
          </div>
          <div className="gst-decision__body">
            <p className="gst-decision__line">
              <strong>7 alertas não alocados</strong> — capacidade atingida em
              <strong> 3 equipes</strong> (CF Maré, CF Manguinhos, CF Penha).
            </p>
            <p className="gst-decision__sub">
              Pacientes com urgência recente sem ACS designado. Decisão: redistribuir ou aumentar capacidade.
            </p>
          </div>
          <Button variant="primary" size="md">Alocar agora →</Button>
        </div>

        <div className="gst-decision__row gst-decision__row--semana">
          <div className="gst-decision__head">
            <span className="gst-decision__tag">Esta semana</span>
            <span className="gst-decision__when">Semana 21/2025</span>
          </div>
          <div className="gst-decision__body">
            <p className="gst-decision__line">
              <strong>68% de cobertura</strong> — faltam
              <strong> 3.140 visitas críticas</strong> para fechar a régua de 80%.
            </p>
            <p className="gst-decision__sub">
              <strong>CF Maré, Manguinhos e Penha</strong> concentram 62% do déficit. Plano de recuperação até sex.
            </p>
          </div>
          <Button variant="secondary" size="md">Ver equipes →</Button>
        </div>

        <div className="gst-decision__row gst-decision__row--tendencia">
          <div className="gst-decision__head">
            <span className="gst-decision__tag">Tendência</span>
            <span className="gst-decision__when">Últimos 5 meses</span>
          </div>
          <div className="gst-decision__body">
            <p className="gst-decision__line">
              <strong>+14 pp de cobertura</strong> desde janeiro — primeira semana acima de 65% no ano.
            </p>
            <p className="gst-decision__sub">
              Persistem <strong>790 pacientes em espiral de crises</strong> ainda sem vínculo com ACS.
            </p>
          </div>
          <Button variant="ghost" size="md">Ver série →</Button>
        </div>
      </div>

      {/* KPI context line — 4 tiles, secondary */}
      <div>
        <p className="gst-eyebrow" style={{ marginBottom: 10 }}>Contexto da AP</p>
        <div className="gst-grid-4">
          <StatTile tone="neutral" value={k.cadastrados.toLocaleString('pt-BR')} label="Pacientes cadastrados" sub="AP 3.1 · 49 equipes" />
          <StatTile tone="urgente" value={k.altoRisco.toLocaleString('pt-BR')} label="Alto risco" sub="gestantes, crônicos, idosos, crianças" />
          <StatTile tone="critico" value={k.criticosSemAg.toLocaleString('pt-BR')} label="Críticos sem agenda" sub="score ≥ 80 · sem visita agendada" />
          <StatTile tone="critico" value={k.alertasAtivos.toLocaleString('pt-BR')} label="Alertas ativos" sub="aguardam ação do gestor" />
        </div>
      </div>

      {/* Middle row — Cobertura + Invisíveis */}
      <div className="gst-grid-2">
        <div className="gst-card">
          <SectionHead eyebrow="Cobertura" title="Esta semana" />
          <CoverageWithMeta pct={k.coberturaSemana} meta={k.metaCobertura} label="Visitas realizadas vs. régua" />
          <p className="gst-card__hint">
            Diferença para a meta = <strong>3.140 pacientes críticos</strong> sem visita esta semana.
          </p>
        </div>

        <div className="gst-card">
          <SectionHead eyebrow="Pacientes invisíveis" title="Sem nenhuma visita registrada" />
          <div className="gst-invis">
            {INVISIVEIS.map((it, i) => (
              <div key={i} className={cx('gst-invis__row', `gst-invis__row--${it.tone}`)}>
                <span className="gst-invis__value">{it.value}</span>
                <div className="gst-invis__meta">
                  <span className="gst-invis__label">{it.label}</span>
                  <span className="gst-invis__sub">{it.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row — Agir hoje + Tendência mensal */}
      <div className="gst-grid-2">
        <div className="gst-card">
          <SectionHead eyebrow="Agir hoje" title="Alertas por tipo"
            action={<Button variant="ghost" size="sm">Ver todos →</Button>} />
          <ActionList items={AGIR_HOJE} />
        </div>

        <div className="gst-card">
          <SectionHead eyebrow="Tendência mensal" title="% cobertura — alta prioridade" />
          <MonthlyBars values={k.evolucao} labels={k.evolucaoLabels} suffix="%" />
          <p className="gst-card__hint">+14 pontos desde janeiro · primeira semana acima de 65% no ano.</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ABA 2 — EQUIPES
// ═══════════════════════════════════════════════════════════════
function TabTeams() {
  const [sort, setSort] = React.useState('score');
  const [activeId, setActiveId] = React.useState('ba1cb3b7');

  const sorted = React.useMemo(() => {
    const xs = [...EQUIPES];
    if (sort === 'score')  xs.sort((a, b) => b.score - a.score);
    if (sort === 'semVis') xs.sort((a, b) => b.semVis - a.semVis);
    if (sort === 'urg')    xs.sort((a, b) => b.urg - a.urg);
    return xs;
  }, [sort]);

  const d = DRILLDOWN_MARE;

  return (
    <div className="gst-tab" data-screen-label="02 Equipes">
      <SectionHead
        eyebrow="Ranking"
        title="Equipes por pressão"
        sub="Score combina déficit de visitas, urgências recentes e perfil clínico. Maior = situação mais tensa. Clique numa linha para abrir o drilldown."
        action={
          <select className="gst-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="score">Ordenar: Score de pressão</option>
            <option value="semVis">Ordenar: % sem visita</option>
            <option value="urg">Ordenar: % com urgência</option>
          </select>
        }
      />

      <div className="gst-card gst-card--flush">
        <table className="gst-table gst-table--teams">
          <thead>
            <tr>
              <th>Equipe</th>
              <th className="num">Pacs</th>
              <th className="num">% Risco</th>
              <th className="num">% Sem visita</th>
              <th className="num">% Urgência</th>
              <th>Score</th>
              <th>Tendência</th>
              <th>5 semanas</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(e => (
              <TeamRow key={e.id} e={e} active={e.id === activeId} onOpen={x => setActiveId(x.id)} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="gst-grid-2">
        <div className="gst-card">
          <SectionHead eyebrow="Drilldown · equipe selecionada"
            title={`#${d.team.id} · ${d.team.cf}`}
            action={<Button variant="ghost" size="sm">Abrir equipe →</Button>} />
          <div className="gst-mini-stats">
            {d.miniStats.map((m, i) => (
              <div key={i}><strong>{m.value}</strong><span>{m.label}</span></div>
            ))}
          </div>
          <p className="gst-eyebrow" style={{ marginTop: 4 }}>Distribuição por banda</p>
          <ScoreHistogram buckets={d.histogram} />
        </div>

        <div className="gst-card">
          <SectionHead eyebrow="Composição clínica" title="Onde está o risco" />
          <ClinicalTally items={d.composicao} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ABA 3 — VISITAS
// ═══════════════════════════════════════════════════════════════
function TabVisits() {
  const k = VISITAS_KPI;
  return (
    <div className="gst-tab" data-screen-label="03 Visitas">
      <SectionHead
        eyebrow="Cobertura real"
        title="Visitas registradas"
        sub="Quem está sendo visitado, em que cadência, e quem ainda não foi alcançado."
        action={<Button variant="secondary" size="sm">Exportar dataset</Button>}
      />

      <div className="gst-grid-3">
        <StatTile big tone="neutral" value={k.registradas.toLocaleString('pt-BR')} label="Visitas registradas" sub="histórico total · 24 meses" />
        <StatTile big tone="atencao" value={`${k.cobertura}%`} label="Cobertura da régua" sub="visitas realizadas vs. esperadas" />
        <StatTile big tone="critico" value={k.semVisita.toLocaleString('pt-BR')} label="Pacientes sem visita" sub="nunca foram visitados" />
      </div>

      <div className="gst-card">
        <SectionHead eyebrow="Déficit por perfil clínico"
          title="Onde a régua não é cumprida"
          sub="Comparação entre visitas/ano esperadas (régua de cuidado) e realizadas em média por paciente do perfil." />
        <DeficitTable rows={DEFICIT_PERFIL} />
      </div>

      <div className="gst-grid-2">
        <div className="gst-card">
          <SectionHead eyebrow="Produtividade por ACS"
            title="Visitas registradas · esta semana"
            action={<Button variant="ghost" size="sm">Top 50 →</Button>} />
          <HBarList rows={PRODUTIVIDADE_ACS} />
        </div>

        <div className="gst-card">
          <SectionHead eyebrow="Cadência de visitas"
            title="Intervalo entre visitas consecutivas"
            sub="Distribuição calculada sobre todas as duplas (visita N, visita N-1) nas últimas 12 semanas." />
          <CadenciaBars rows={CADENCIA} />
          <p className="gst-card__hint">
            <strong>16% dos pacientes</strong> ficaram &gt;60 dias sem visita — concentrados em Idosos 66+ e Crianças 0-6.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ABA 4 — PACIENTES
// ═══════════════════════════════════════════════════════════════
function TabPatients() {
  const [query, setQuery] = React.useState('');
  const [filters, setFilters] = React.useState({ prio: 'all', cond: 'all', equipe: 'all', status: 'all' });

  const filtered = React.useMemo(() => {
    let xs = CRITICAL_PATIENTS;
    if (filters.prio !== 'all') {
      xs = xs.filter(p => scoreBand(p.score) === filters.prio);
    }
    if (filters.status !== 'all') xs = xs.filter(p => p.status === filters.status);
    if (filters.equipe !== 'all') xs = xs.filter(p => p.equipe === filters.equipe);
    if (filters.cond !== 'all') {
      const map = {
        gestante: 'gestante', hipertenso: 'hiper', diabetico: 'diabético',
        crianca: 'criança', idoso: 'idoso',
      };
      xs = xs.filter(p => p.perfil.toLowerCase().includes(map[filters.cond]));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      xs = xs.filter(p => p.id.includes(q) || p.perfil.toLowerCase().includes(q) || p.equipe.includes(q));
    }
    return xs;
  }, [query, filters]);

  return (
    <div className="gst-tab" data-screen-label="04 Pacientes">
      <SectionHead
        eyebrow="Toda a AP · 97.938 cadastrados"
        title="Pacientes"
        sub="Lista filtrável — independente da equipe. Use os filtros para encontrar quem ainda não foi alocado, ou exporte uma lista direcionada."
        action={<Button variant="primary" size="sm">Exportar lista</Button>}
      />

      <FilterBar
        query={query} onQuery={setQuery}
        filters={[
          { key: 'prio', value: filters.prio, options: [
            { value: 'all',     label: 'Prioridade: todas' },
            { value: 'critico', label: 'Apenas crítico' },
            { value: 'urgente', label: 'Apenas urgente' },
            { value: 'atencao', label: 'Apenas atenção' },
          ]},
          { key: 'cond', value: filters.cond, options: [
            { value: 'all',         label: 'Condição: todas' },
            { value: 'gestante',    label: 'Gestantes' },
            { value: 'hipertenso',  label: 'Hipertensos' },
            { value: 'diabetico',   label: 'Diabéticos' },
            { value: 'crianca',     label: 'Crianças 0-6' },
            { value: 'idoso',       label: 'Idosos 66+' },
          ]},
          { key: 'equipe', value: filters.equipe, options: [
            { value: 'all', label: 'Equipe: todas' },
            ...EQUIPES.map(e => ({ value: e.id, label: `#${e.id} · ${e.cf}` })),
          ]},
          { key: 'status', value: filters.status, options: [
            { value: 'all',      label: 'Status: todos' },
            { value: 'agenda',   label: 'Na agenda' },
            { value: 'sem',      label: 'Sem agendamento' },
            { value: 'primeiro', label: '1º contato pendente' },
          ]},
        ]}
        onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
      />

      <div className="gst-card gst-card--flush">
        <PatientsTable rows={filtered} />
        <div className="gst-tablefoot">
          Exibindo <strong>{filtered.length}</strong> de <strong>97.938</strong> pacientes
          <span className="muted"> · ordenados por score (descendente)</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ABA 5 — EVENTOS
// ═══════════════════════════════════════════════════════════════
function TabEvents() {
  const k = EVENTOS_KPI;
  return (
    <div className="gst-tab" data-screen-label="05 Eventos">
      <SectionHead
        eyebrow="Padrão de deterioração"
        title="Eventos clínicos"
        sub="Urgências, agendamentos e a correlação entre visitas ACS e crises evitáveis."
        action={<Button variant="secondary" size="sm">Exportar série</Button>}
      />

      <div className="gst-grid-3">
        <StatTile big tone="neutral" value={k.total.toLocaleString('pt-BR')} label="Eventos registrados" sub="urgências + agendamentos · 12 meses" />
        <StatTile big tone="urgente" value={k.urgencias.toLocaleString('pt-BR')} label="Urgências no período" sub={`${k.urgPct}% do total de eventos`} />
        <StatTile big tone="critico" value={k.espiral.toLocaleString('pt-BR')} label="Espiral de crises" sub="3+ urgências/ano · 0 visitas ACS" />
      </div>

      <div className="gst-grid-2">
        <div className="gst-card">
          <SectionHead eyebrow="Sazonalidade" title="Urgências vs. agendamentos · 2024" />
          <DualLineChart
            labels={SAZONALIDADE.labels}
            a={SAZONALIDADE.urgencias}
            b={SAZONALIDADE.agendamentos}
          />
          <p className="gst-card__hint">
            Pico de urgências em <strong>jul–ago</strong> (~5.800/mês) coincide com agravo respiratório.
            Agendamentos permanecem estáveis em ~4.200/mês, sem responder ao pico.
          </p>
        </div>

        <div className="gst-card">
          <SectionHead eyebrow="Correlação" title="Urgência precedida de visita?"
            sub="Para cada urgência registrada, verificamos se houve visita ACS nos 30 dias anteriores." />
          <DonutChart sim={URGENCIA_PRECEDIDA.sim} nao={URGENCIA_PRECEDIDA.nao} />
          <p className="gst-card__hint">
            <strong>66% das crises</strong> ocorreram sem contato ACS nos 30 dias anteriores — sinal de cuidado preventivo
            insuficiente, não de eventos imprevisíveis.
          </p>
        </div>
      </div>

      <div className="gst-card">
        <SectionHead eyebrow="Espiral de crises"
          title="Pacientes com 3+ urgências/ano"
          sub="Lista priorizada para vinculação imediata. Coluna “Visitado antes?” mostra se houve visita ACS nos 30 dias prévios à última urgência." />
        <EspiralTable rows={ESPIRAL_TABLE} />
      </div>
    </div>
  );
}

Object.assign(window, { TabOverview, TabTeams, TabVisits, TabPatients, TabEvents });

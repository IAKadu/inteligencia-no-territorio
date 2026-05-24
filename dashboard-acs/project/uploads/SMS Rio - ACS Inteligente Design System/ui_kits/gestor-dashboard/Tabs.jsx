// Gestor Dashboard — tab content pages.

function TabOverview() {
  const kpi = KPI_OVERVIEW;
  return (
    <div className="gst-tab" data-screen-label="01 Visão Geral">
      <SectionHead
        eyebrow="Painel · Área Programática 3.1 · Semana 21/2025"
        title="Visão Geral"
        sub="Cobertura, risco e cuidado preventivo das 49 equipes da AP."
        action={<div style={{display:'flex',gap:8}}>
          <Button variant="ghost" size="sm">Atualizar scores</Button>
          <Button variant="secondary" size="sm">Exportar</Button>
        </div>}
      />

      <div className="gst-grid-4">
        <StatTile big tone="neutral"   value="49"    label="Equipes ativas" sub="da AP 3.1" />
        <StatTile big tone="atencao"   value="26.164" label="Alto risco cadastrados" sub="gestantes, crianças, crônicos, idosos" />
        <StatTile big tone="urgente"   value="74.303" label="Abaixo da régua" sub="visitas em atraso para o perfil" />
        <StatTile big tone="critico"   value="790"   label="Crise sem vínculo" sub="3+ urgências/ano · 0 visitas" />
      </div>

      <div className="gst-grid-2">
        <div className="gst-card">
          <SectionHead eyebrow="Cobertura" title="Esta semana" />
          <CoverageBar pct={kpi.coberturaSemana} label="Pacientes de alta prioridade visitados" />
          <p className="gst-card__hint">Meta sugerida: 80%. A diferença de 12 pontos representa cerca de <strong>3.140 pacientes críticos</strong> ainda sem agenda nesta semana.</p>
          <BandLegend />
        </div>

        <div className="gst-card">
          <SectionHead eyebrow="Evolução mensal" title="% cobertura — alta prioridade" />
          <MonthlyBars values={kpi.evolucao} labels={kpi.evolucaoLabels} />
          <p className="gst-card__hint">+7 pontos em relação a abril — primeira semana com a régua reajustada para idosos 66+.</p>
        </div>
      </div>

      <div className="gst-grid-2">
        <div className="gst-card">
          <SectionHead eyebrow="Alertas ativos" title="Resposta a deterioração"
                       action={<Button variant="ghost" size="sm">Ver alertas →</Button>} />
          <AlertGroupList groups={ALERT_GROUPS} />
          <p className="gst-card__hint"><strong>61 alertas resolvidos</strong> esta semana de um total de 82 (74%).</p>
        </div>

        <div className="gst-card">
          <SectionHead eyebrow="Pacientes invisíveis" title="Sem nenhuma visita registrada" />
          <div className="gst-grid-3">
            <StatTile tone="critico" value={INVISIVEIS.criseSemVinculo}        label="Crise sem vínculo" sub="3+ urgências" />
            <StatTile tone="urgente" value={INVISIVEIS.altoRiscoSemContato}    label="Alto risco sem contato" />
            <StatTile tone="atencao" value={INVISIVEIS.semCondicaoEspecial.toLocaleString('pt-BR')} label="Sem condição especial" />
          </div>
          <CoverageBar pct={INVISIVEIS.coberturaMes} label="Cobertura de invisíveis este mês" />
        </div>
      </div>

      <DataQualityPanel items={DATA_QUALITY} />
    </div>
  );
}

function TabTeams({ onOpenTeam, activeId }) {
  const [sort, setSort] = React.useState('score');
  const sorted = React.useMemo(() => {
    const xs = [...EQUIPES];
    if (sort === 'score')  xs.sort((a,b) => b.score - a.score);
    if (sort === 'urg')    xs.sort((a,b) => b.urg - a.urg);
    if (sort === 'semVis') xs.sort((a,b) => b.semVis - a.semVis);
    return xs;
  }, [sort]);

  return (
    <div className="gst-tab" data-screen-label="02 Por Equipe">
      <SectionHead
        eyebrow="Ranking"
        title="Equipes por score de pressão"
        sub="Score combina déficit de visitas, urgências recentes e perfil clínico. Maior = situação mais tensa."
        action={
          <select className="gst-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="score">Ordenar: Score de pressão</option>
            <option value="urg">Ordenar: % com urgência recente</option>
            <option value="semVis">Ordenar: % sem visita</option>
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
            {sorted.map(e => <TeamRow key={e.id} e={e} active={e.id === activeId} onOpen={onOpenTeam} />)}
          </tbody>
        </table>
      </div>

      <div className="gst-grid-2">
        <div className="gst-card">
          <SectionHead eyebrow="Drilldown — equipe selecionada" title="ba1cb3b7 · CF Maré · Nova Holanda"
                       action={<Button variant="ghost" size="sm">Abrir equipe →</Button>} />
          <div className="gst-mini-stats">
            <div><strong>5</strong><span>ACS ativos hoje</span></div>
            <div><strong>23</strong><span>visitas planejadas</span></div>
            <div><strong>14</strong><span>alertas pendentes</span></div>
            <div><strong>47</strong><span>invisíveis cat. 1</span></div>
          </div>
          <ScoreHistogram buckets={[
            { band: 'critico', count: 184 },
            { band: 'urgente', count: 422 },
            { band: 'atencao', count: 731 },
            { band: 'rotina',  count: 660 },
          ]} />
        </div>

        <div className="gst-card">
          <SectionHead eyebrow="Composição clínica" title="Onde está o risco" />
          <ul className="gst-tally">
            <li><span className="dot" style={{background:'#0072a3'}}/>Hipertensos<strong>421</strong><span>(21%)</span></li>
            <li><span className="dot" style={{background:'#8d4a0c'}}/>Diabéticos<strong>278</strong><span>(14%)</span></li>
            <li><span className="dot" style={{background:'#9d1f62'}}/>Gestantes<strong>34</strong><span>(1,7%)</span></li>
            <li><span className="dot" style={{background:'#087a52'}}/>Crianças 0-6<strong>312</strong><span>(15,6%)</span></li>
            <li><span className="dot" style={{background:'#856404'}}/>Idosos 66+<strong>388</strong><span>(19,4%)</span></li>
            <li><span className="dot" style={{background:'#1a6630'}}/>Vulnerabilidade<strong>602</strong><span>(30,1%)</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function TabMap() {
  return (
    <div className="gst-tab" data-screen-label="03 Mapa de Cobertura">
      <SectionHead
        eyebrow="Mapa"
        title="Pressão por equipe na AP 3.1"
        sub="Cada bolha representa uma equipe; cor indica score de pressão, tamanho indica pacientes cobertos."
        action={
          <div style={{display:'flex',gap:8}}>
            <select className="gst-select"><option>Filtrar: Todas as condições</option><option>Hipertensos</option><option>Diabéticos</option><option>Gestantes</option><option>Crianças 0-6</option></select>
            <select className="gst-select"><option>Faixa: Todas</option><option>0-6 anos</option><option>66+ anos</option></select>
          </div>
        }
      />

      <div className="gst-card gst-card--flush">
        <TerritoryMap teams={EQUIPES.concat(EQUIPES).concat(EQUIPES.slice(0,3))} />
      </div>

      <div className="gst-grid-3">
        <div className="gst-card">
          <p className="gst-eyebrow">Concentrações detectadas</p>
          <h3 className="gst-h3" style={{marginTop:6}}>3 hotspots de hipertensão</h3>
          <p className="gst-card__hint">CF Maré, Manguinhos e Penha Circular concentram <strong>62% dos hipertensos descompensados</strong> da AP. Recomendação: campanha de aferição.</p>
        </div>
        <div className="gst-card">
          <p className="gst-eyebrow">Lacuna territorial</p>
          <h3 className="gst-h3" style={{marginTop:6}}>Olaria · sem ACS designado</h3>
          <p className="gst-card__hint">Área com 312 famílias cadastradas e nenhum ACS atribuído nas últimas duas semanas. Score territorial: 51.</p>
        </div>
        <div className="gst-card">
          <p className="gst-eyebrow">Tendência</p>
          <h3 className="gst-h3" style={{marginTop:6}}>Caju ↓ -1,1 em 4 semanas</h3>
          <p className="gst-card__hint">Melhor evolução da AP. Equipe completou cobertura de gestantes (100%) e reduziu a fila de invisíveis em 38%.</p>
        </div>
      </div>
    </div>
  );
}

function TabPatients() {
  const [query, setQuery] = React.useState('');
  const [filters, setFilters] = React.useState({ prio: 'all', cond: 'all', equipe: 'all', status: 'all' });

  const filtered = React.useMemo(() => {
    let xs = CRITICAL_PATIENTS;
    if (filters.status !== 'all') xs = xs.filter(p => p.status === filters.status);
    if (query.trim()) {
      const q = query.toLowerCase();
      xs = xs.filter(p => p.id.includes(q) || p.perfil.toLowerCase().includes(q) || p.equipe.includes(q));
    }
    return xs;
  }, [query, filters]);

  return (
    <div className="gst-tab" data-screen-label="04 Pacientes Críticos">
      <SectionHead
        eyebrow="Toda a AP"
        title="Pacientes críticos"
        sub="Lista consolidada — independente da equipe. Use os filtros para encontrar quem ainda não foi alocado."
        action={<Button variant="primary" size="sm">Exportar lista</Button>}
      />

      <FilterBar
        query={query} onQuery={setQuery}
        filters={[
          { key: 'prio',   value: filters.prio,   options: [
            { value: 'all', label: 'Prioridade: todas' },
            { value: 'critico', label: 'Apenas crítico' },
            { value: 'urgente', label: 'Apenas urgente' },
          ]},
          { key: 'cond',   value: filters.cond,   options: [
            { value: 'all', label: 'Condição: todas' },
            { value: 'gestante', label: 'Gestantes' },
            { value: 'hipertenso', label: 'Hipertensos' },
            { value: 'diabetico', label: 'Diabéticos' },
            { value: 'crianca', label: 'Crianças 0-6' },
            { value: 'idoso', label: 'Idosos 66+' },
          ]},
          { key: 'equipe', value: filters.equipe, options: [
            { value: 'all', label: 'Equipe: todas' },
            ...EQUIPES.map(e => ({ value: e.id, label: `#${e.id.slice(0,8)} · ${e.cf}` })),
          ]},
          { key: 'status', value: filters.status, options: [
            { value: 'all', label: 'Status: todos' },
            { value: 'agenda', label: '✓ Na agenda hoje' },
            { value: 'sem',    label: '⚠ Sem agendamento' },
            { value: 'primeiro', label: '★ 1º contato pendente' },
          ]},
        ]}
        onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
      />

      <div className="gst-card gst-card--flush">
        <CriticalPatientsTable rows={filtered} />
      </div>
    </div>
  );
}

function TabAlerts() {
  return (
    <div className="gst-tab" data-screen-label="05 Alertas">
      <SectionHead
        eyebrow="Resposta a eventos"
        title="Alertas de deterioração"
        sub="Pacientes com sinais clínicos recentes que ainda não foram visitados."
      />

      <div className="gst-grid-3">
        <StatTile big tone="critico" value="82"  label="Alertas ativos" sub="urgência, espiral, gestante" />
        <StatTile big tone="rotina"  value="61"  label="Resolvidos esta semana" sub="74% de taxa de resolução" />
        <StatTile big tone="urgente" value="7"   label="Não alocados" sub="aguardando ação do gestor" />
      </div>

      <div className="gst-grid-2">
        <div className="gst-card">
          <SectionHead eyebrow="Por tipo" title="Categorias ativas" />
          <AlertGroupList groups={ALERT_GROUPS} />
        </div>

        <div className="gst-card">
          <SectionHead eyebrow="Por equipe" title="Alertas vs. alocação"
                       action={<Button variant="ghost" size="sm">Ver não alocados →</Button>} />
          <AlertsByTeamList rows={ALERTS_BY_TEAM} />
        </div>
      </div>

      <SectionHead eyebrow="Ação necessária" title="Alertas não alocados" sub="Capacidade da equipe atingida — gestor precisa redistribuir." />
      <div className="gst-grid-2">
        <UnallocatedAlert patient={{ id: 'b9c2e041', equipe: '8c7e94fb', perfil: 'Hiper + Diabético', urg: 4 }} />
        <UnallocatedAlert patient={{ id: 'q105ff20', equipe: '7e4d858c', perfil: 'Idoso 66+ · Hipertenso', urg: 5 }} />
      </div>
    </div>
  );
}

Object.assign(window, { TabOverview, TabTeams, TabMap, TabPatients, TabAlerts });

// ────────────────────────────────────────────────────────────────
// Painel do Gestor — dados de amostra
// AP 3.1 · 49 equipes · ~97k pacientes · Semana 21/2025
// Números calibrados pelas specs em reference/solucao_*.md.
// ────────────────────────────────────────────────────────────────

// ─── ABA 1 — Visão Geral ──────────────────────────────────────
const KPI_OVERVIEW = {
  cadastrados:     97938,
  altoRisco:       26164,
  criticosSemAg:   604,
  alertasAtivos:   82,
  coberturaSemana: 68,
  metaCobertura:   80,
  semVisitaCritico: 3140,
  evolucao:        [54, 58, 61, 65, 68],
  evolucaoLabels:  ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
};

const INVISIVEIS = [
  { tone: 'critico', value: '790',    label: 'Crise sem vínculo',       sub: '3+ urgências/ano · 0 visitas' },
  { tone: 'urgente', value: '6.744',  label: 'Alto risco sem contato',  sub: 'gestantes, crônicos, idosos · 0 visitas' },
  { tone: 'neutral', value: '42.000', label: 'Sem condição especial',   sub: 'cadastrados não-prioritários sem visita' },
];

const AGIR_HOJE = [
  { kind: 'urg',      label: 'Urgência recente sem visita',            n: 47, tone: 'critico' },
  { kind: 'espiral',  label: 'Espiral de crises ativa',                n: 23, tone: 'urgente' },
  { kind: 'gestante', label: 'Gestante sem visita há 30+ dias',        n: 12, tone: 'atencao' },
  { kind: 'unalloc',  label: 'Alertas não alocados · capacidade atingida', n: 7,  tone: 'neutral' },
];

// ─── ABA 2 — Equipes ──────────────────────────────────────────
// Ranking realista; score = pressão (subir = piorar)
const EQUIPES = [
  { id: 'ba1cb3b7', cf: 'CF Maré · Nova Holanda',     pacs: 2001, risco: 38.1, semVis: 41.3, urg: 18.4, score: 47.2, delta: +1.2, spark: [44.1, 45.0, 45.6, 46.3, 47.2] },
  { id: '7e4d858c', cf: 'CF Manguinhos',              pacs: 1844, risco: 35.2, semVis: 38.7, urg: 17.1, score: 44.8, delta: +0.6, spark: [43.4, 43.9, 44.2, 44.4, 44.8] },
  { id: '8c7e94fb', cf: 'CF Complexo do Alemão',      pacs: 1923, risco: 33.8, semVis: 36.4, urg: 15.8, score: 43.1, delta: +0.4, spark: [42.0, 42.4, 42.7, 42.9, 43.1] },
  { id: '3f9a12cd', cf: 'CF Penha Circular',          pacs: 1623, risco: 31.4, semVis: 34.2, urg: 14.3, score: 41.3, delta: -0.2, spark: [41.7, 41.6, 41.5, 41.4, 41.3] },
  { id: '9f8755f2', cf: 'CF Bonsucesso',              pacs: 1872, risco: 29.6, semVis: 33.1, urg: 13.7, score: 40.0, delta: +0.3, spark: [39.4, 39.6, 39.8, 39.9, 40.0] },
  { id: '11ae3c02', cf: 'CF Ramos',                   pacs: 2104, risco: 28.3, semVis: 31.5, urg: 12.4, score: 38.7, delta: -0.5, spark: [39.4, 39.2, 39.0, 38.8, 38.7] },
  { id: '6b2d910c', cf: 'CF Higienópolis',            pacs: 1758, risco: 25.7, semVis: 30.0, urg: 12.1, score: 37.2, delta: -0.3, spark: [37.7, 37.5, 37.4, 37.3, 37.2] },
  { id: 'c8e201fa', cf: 'CF Caju',                    pacs: 1412, risco: 22.1, semVis: 28.4, urg: 11.2, score: 36.1, delta: -1.1, spark: [37.4, 37.0, 36.8, 36.4, 36.1] },
  { id: 'd9f3c021', cf: 'CF Olaria',                  pacs: 1554, risco: 21.4, semVis: 26.7, urg: 10.5, score: 34.6, delta: -0.4, spark: [35.1, 34.9, 34.8, 34.7, 34.6] },
  { id: 'e2a09b78', cf: 'CF Vigário Geral',           pacs: 1689, risco: 19.8, semVis: 24.3, urg:  9.7, score: 32.9, delta: -0.2, spark: [33.2, 33.1, 33.0, 33.0, 32.9] },
  { id: 'f1b430cc', cf: 'CF Jardim América',          pacs: 1432, risco: 18.1, semVis: 22.5, urg:  8.4, score: 30.6, delta: -0.7, spark: [31.4, 31.1, 30.9, 30.7, 30.6] },
  { id: 'a8d5c901', cf: 'CF Cordovil',                pacs: 1611, risco: 16.4, semVis: 19.8, urg:  7.2, score: 28.3, delta: +0.1, spark: [28.1, 28.2, 28.2, 28.3, 28.3] },
];

const DRILLDOWN_MARE = {
  team: { id: 'ba1cb3b7', cf: 'CF Maré · Nova Holanda', score: 47.2 },
  miniStats: [
    { value: 5,  label: 'ACS ativos hoje' },
    { value: 23, label: 'Visitas planejadas' },
    { value: 14, label: 'Alertas pendentes' },
    { value: 47, label: 'Invisíveis cat. 1' },
  ],
  histogram: [
    { band: 'critico', count: 184 },
    { band: 'urgente', count: 422 },
    { band: 'atencao', count: 731 },
    { band: 'rotina',  count: 660 },
  ],
  composicao: [
    { label: 'Hipertensos',      n: 421, pct: 21.0, color: '#0072a3' },
    { label: 'Diabéticos',       n: 278, pct: 14.0, color: '#8d4a0c' },
    { label: 'Gestantes',        n:  34, pct:  1.7, color: '#9d1f62' },
    { label: 'Crianças 0-6',     n: 312, pct: 15.6, color: '#087a52' },
    { label: 'Idosos 66+',       n: 388, pct: 19.4, color: '#856404' },
    { label: 'Vulneráveis',      n: 602, pct: 30.1, color: '#1a6630' },
  ],
};

// ─── ABA 3 — Visitas ──────────────────────────────────────────
const VISITAS_KPI = {
  registradas: 159599,
  cobertura:   68,
  semVisita:   32400,
};

const DEFICIT_PERFIL = [
  { perfil: 'Criança 0-6',  regua: 7, real: 4.2, deficit: 2.8, pct: 60, tone: 'critico' },
  { perfil: 'Gestante',     regua: 6, real: 4.8, deficit: 1.2, pct: 80, tone: 'atencao' },
  { perfil: 'Hipertenso',   regua: 4, real: 2.9, deficit: 1.1, pct: 72, tone: 'atencao' },
  { perfil: 'Diabético',    regua: 4, real: 3.1, deficit: 0.9, pct: 78, tone: 'atencao' },
  { perfil: 'Idoso 66+',    regua: 4, real: 2.4, deficit: 1.6, pct: 60, tone: 'critico' },
  { perfil: 'Outros',       regua: 2, real: 1.7, deficit: 0.3, pct: 85, tone: 'rotina' },
];

const PRODUTIVIDADE_ACS = [
  { id: 'ACS-0341', nome: 'M. Souza',   visitas: 42, equipe: 'CF Maré' },
  { id: 'ACS-0588', nome: 'J. Pereira', visitas: 38, equipe: 'CF Penha' },
  { id: 'ACS-0712', nome: 'A. Lima',    visitas: 35, equipe: 'CF Bonsucesso' },
  { id: 'ACS-0298', nome: 'R. Silva',   visitas: 33, equipe: 'CF Maré' },
  { id: 'ACS-0455', nome: 'C. Alves',   visitas: 31, equipe: 'CF Manguinhos' },
  { id: 'ACS-0901', nome: 'P. Costa',   visitas: 28, equipe: 'CF Caju' },
  { id: 'ACS-0177', nome: 'B. Rocha',   visitas: 24, equipe: 'CF Ramos' },
  { id: 'ACS-0633', nome: 'T. Mendes',  visitas: 19, equipe: 'CF Olaria' },
];

const CADENCIA = [
  { faixa: '<15d',     n: 18200, pct: 27 },
  { faixa: '15–30d',   n: 23400, pct: 35 },
  { faixa: '30–60d',   n: 14600, pct: 22 },
  { faixa: '60–90d',   n:  6800, pct: 10 },
  { faixa: '>90d',     n:  4100, pct:  6 },
];

// ─── ABA 4 — Pacientes ────────────────────────────────────────
const CRITICAL_PATIENTS = [
  { id: 'a3f7b812', perfil: 'Gestante · Hipertensa',     diasSemVis: 118, urgAno: 1, score: 94, status: 'sem',      equipe: 'ba1cb3b7' },
  { id: 'b9c2e041', perfil: 'Hiper + Diabético',          diasSemVis:  96, urgAno: 4, score: 87, status: 'sem',      equipe: '7e4d858c' },
  { id: 'd2a8f934', perfil: 'Criança 0-6 · Vulnerável',   diasSemVis:  64, urgAno: 0, score: 83, status: 'sem',      equipe: '8c7e94fb' },
  { id: 'f1e50c77', perfil: 'Idoso 66+',                  diasSemVis:  52, urgAno: 6, score: 79, status: 'primeiro', equipe: 'ba1cb3b7' },
  { id: 'h74cabd1', perfil: 'Hipertenso',                 diasSemVis:  41, urgAno: 2, score: 71, status: 'agenda',   equipe: '9f8755f2' },
  { id: 'k02e1187', perfil: 'Gestante',                   diasSemVis:  35, urgAno: 1, score: 64, status: 'agenda',   equipe: '11ae3c02' },
  { id: 'p82e44ab', perfil: 'Diabético · Vulnerável',     diasSemVis:  28, urgAno: 3, score: 42, status: 'agenda',   equipe: '3f9a12cd' },
  { id: 'r3120abc', perfil: 'Idoso 66+ · Hipertenso',     diasSemVis:  24, urgAno: 0, score: 31, status: 'agenda',   equipe: 'c8e201fa' },
];

// ─── ABA 5 — Eventos ──────────────────────────────────────────
const EVENTOS_KPI = {
  total:           100503,
  urgencias:       47821,
  urgPct:          48,
  espiral:         790,
};

const SAZONALIDADE = {
  labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  urgencias:    [3800, 3900, 4200, 4500, 4800, 5300, 5800, 5700, 5100, 4700, 4300, 4000],
  agendamentos: [4100, 4200, 4250, 4150, 4200, 4180, 4220, 4150, 4200, 4230, 4180, 4150],
};

const URGENCIA_PRECEDIDA = { sim: 34, nao: 66 };

const ESPIRAL_TABLE = [
  { id: 'b9c2e041', perfil: 'Hiper + Diabético',          urgAno: 5, ultima: 'há 8 dias',  visitado: false, equipe: 'CF Maré' },
  { id: 'q105ff20', perfil: 'Idoso 66+ · Hipertenso',     urgAno: 4, ultima: 'há 12 dias', visitado: false, equipe: 'CF Manguinhos' },
  { id: 'd3a771bc', perfil: 'Gestante · Vulnerável',      urgAno: 4, ultima: 'há 3 dias',  visitado: true,  equipe: 'CF Penha' },
  { id: 'f7e21089', perfil: 'Diabético',                  urgAno: 4, ultima: 'há 6 dias',  visitado: false, equipe: 'CF Bonsucesso' },
  { id: 'h2c8e145', perfil: 'Hipertenso · Idoso 66+',     urgAno: 3, ultima: 'há 9 dias',  visitado: false, equipe: 'CF Ramos' },
  { id: 'k90b3a72', perfil: 'Criança 0-6',                urgAno: 3, ultima: 'há 15 dias', visitado: false, equipe: 'CF Caju' },
];

Object.assign(window, {
  KPI_OVERVIEW, INVISIVEIS, AGIR_HOJE,
  EQUIPES, DRILLDOWN_MARE,
  VISITAS_KPI, DEFICIT_PERFIL, PRODUTIVIDADE_ACS, CADENCIA,
  CRITICAL_PATIENTS,
  EVENTOS_KPI, SAZONALIDADE, URGENCIA_PRECEDIDA, ESPIRAL_TABLE,
});

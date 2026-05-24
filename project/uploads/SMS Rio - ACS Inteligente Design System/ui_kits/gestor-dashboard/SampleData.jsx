// Gestor Dashboard — sample data shared across tabs.
// Numbers borrowed from reference/solucao_*.md so the prototype reflects
// realistic operating ranges for SMS Rio (AP 3.1, ~49 teams).

const KPI_OVERVIEW = {
  equipes: 49,
  altoRisco: 26164,
  abaixoRegua: 74303,
  criseSemVinculo: 790,
  coberturaSemana: 68,
  evolucao: [61, 63, 65, 61, 68],
  evolucaoLabels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
};

const EQUIPES = [
  { id: 'ba1cb3b7', cf: 'CF Maré · Nova Holanda',     pacs: 1997, risco: 39.6, semVis: 58.4, urg: 30.4, score: 45.3, delta: +1.2, spark: [42.1, 43.0, 43.8, 44.1, 45.3] },
  { id: '8c7e94fb', cf: 'CF Manguinhos',              pacs: 1998, risco: 41.9, semVis: 55.1, urg: 19.3, score: 42.7, delta:  0.0, spark: [42.6, 42.5, 42.8, 42.7, 42.7] },
  { id: '7e4d858c', cf: 'CF Penha Circular',          pacs: 1998, risco: 56.0, semVis: 41.1, urg: 17.0, score: 42.3, delta: -0.8, spark: [44.0, 43.5, 43.1, 42.7, 42.3] },
  { id: '9f8755f2', cf: 'CF Bonsucesso',              pacs: 1872, risco: 38.4, semVis: 49.7, urg: 22.1, score: 40.5, delta: +0.4, spark: [40.0, 40.1, 40.3, 40.2, 40.5] },
  { id: '11ae3c02', cf: 'CF Ramos',                   pacs: 2104, risco: 35.9, semVis: 46.2, urg: 18.6, score: 38.4, delta: -0.3, spark: [38.9, 38.7, 38.6, 38.5, 38.4] },
  { id: 'c4a1bb8f', cf: 'CF Caju',                    pacs: 1830, risco: 33.1, semVis: 42.8, urg: 14.7, score: 36.1, delta: -1.1, spark: [37.4, 37.0, 36.8, 36.4, 36.1] },
  { id: '6b2d910c', cf: 'CF Higienópolis',            pacs: 2011, risco: 31.7, semVis: 38.2, urg: 11.4, score: 33.7, delta: -0.5, spark: [34.4, 34.2, 33.9, 33.8, 33.7] },
  { id: 'd9f3c021', cf: 'CF Olaria',                  pacs: 1955, risco: 28.5, semVis: 36.0, urg:  9.2, score: 31.8, delta: -0.2, spark: [32.1, 32.0, 31.9, 32.0, 31.8] },
];

const CRITICAL_PATIENTS = [
  { id: 'a3f7b812', perfil: 'Gestante · Hipertensa',     urg: '1 (30d)', score: 94, status: 'agenda',   equipe: 'ba1cb3b7' },
  { id: 'b9c2e041', perfil: 'Hiper + Diabético',          urg: '4 (ano)', score: 87, status: 'sem',      equipe: '8c7e94fb' },
  { id: 'd2a8f934', perfil: 'Criança 0-6',                urg: '0',       score: 83, status: 'agenda',   equipe: '7e4d858c' },
  { id: 'f1e50c77', perfil: 'Idoso 66+',                  urg: '6 (ano)', score: 79, status: 'primeiro', equipe: 'ba1cb3b7' },
  { id: 'h74cabd1', perfil: 'Hipertenso',                 urg: '2 (90d)', score: 76, status: 'agenda',   equipe: '9f8755f2' },
  { id: 'k02e1187', perfil: 'Gestante',                   urg: '1 (90d)', score: 74, status: 'sem',      equipe: '11ae3c02' },
  { id: 'p82e44ab', perfil: 'Diabético · Vulnerável',     urg: '3 (ano)', score: 71, status: 'agenda',   equipe: '8c7e94fb' },
  { id: 'q105ff20', perfil: 'Idoso 66+ · Hipertenso',     urg: '5 (ano)', score: 68, status: 'primeiro', equipe: '7e4d858c' },
  { id: 'r3120abc', perfil: 'Criança 0-6 · Vulnerável',   urg: '0',       score: 64, status: 'sem',      equipe: 'c4a1bb8f' },
];

const ALERT_GROUPS = [
  { kind: 'urgencia-recente',  label: 'Urgência recente sem acompanhamento', n: 47, tone: 'danger' },
  { kind: 'espiral',           label: 'Espiral de crises (3+ urgências / 90d)', n: 23, tone: 'danger' },
  { kind: 'gestante',          label: 'Gestante sem visita há 30+ dias',     n: 12, tone: 'warning' },
];

const ALERTS_BY_TEAM = [
  { id: 'ba1cb3b7', total: 14, alloc:  8 },
  { id: '9f8755f2', total: 11, alloc: 11 },
  { id: '8c7e94fb', total:  9, alloc:  6 },
  { id: '7e4d858c', total:  7, alloc:  5 },
  { id: '11ae3c02', total:  6, alloc:  6 },
];

const INVISIVEIS = {
  criseSemVinculo: 47,
  altoRiscoSemContato: 312,
  semCondicaoEspecial: 1149,
  coberturaMes: 47,
};

const DATA_QUALITY = [
  { n: 23,  label: 'endereços não localizados', sub: 'ACS reportaram “não encontrei”' },
  { n: 47,  label: 'pacientes "não mora mais aqui"',  sub: 'cadastros a revisar' },
  { n: 138, label: 'pacientes sem equipe vinculada',  sub: 'precisam de matriciamento' },
];

Object.assign(window, {
  KPI_OVERVIEW, EQUIPES, CRITICAL_PATIENTS, ALERT_GROUPS, ALERTS_BY_TEAM, INVISIVEIS, DATA_QUALITY
});

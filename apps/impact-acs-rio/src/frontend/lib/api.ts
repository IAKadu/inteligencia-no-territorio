const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface Paciente {
  paciente_id: string;
  equipe_id: string;
  faixa_etaria: string;
  sexo: string;
  raca_cor: string;
  situacao_vulnerabilidade: number;
  hipertenso: number;
  diabetico: number;
  gestacao: number;
  score: number;
  fatores: string[];
  ultima_visita: string | null;
  endereco_latitude: number;
  endereco_longitude: number;
}

export interface Alerta {
  id: number;
  paciente_id: string;
  paciente_nome_proxy: string;
  tipo: string;
  mensagem: string;
  prioridade: number;
  origem: string;
  criado_em: string;
}

export interface KPIs {
  total_pacientes: number;
  pacientes_visitados: number;
  cobertura_pct: number;
  alertas_abertos: number;
  urgencias_30d: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  n_urgencias: number;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

export interface EquipeSede {
  equipe_id: string;
  lat: number;
  lng: number;
  n_pacientes: number;
}

export interface IsochroneFeature {
  type: 'Feature';
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] };
  properties: { value: number; area?: number; reachfactor?: number };
}

export interface IsochroneResponse {
  type: 'FeatureCollection';
  features: IsochroneFeature[];
}

export interface PainelEquipe {
  equipe_id: string;
  total_pacientes: number;
  pct_alto_risco: number;
  pct_sem_visita: number;
  pct_urgencia: number;
  score_pressao: number;
  crise_sem_vinculo: number;
  alto_risco_invisivel: number;
}

export interface InvisivelRow {
  paciente_id: string;
  equipe_id: string;
  faixa_etaria: string;
  hipertenso: number;
  diabetico: number;
  gestacao: number;
  situacao_vulnerabilidade: number;
  n_urg_ano: number;
  score: number;
  prioridade: string | null;
  categoria_invisivel: 1 | 2 | 3;
  label_categoria: string;
}

export interface InvisivelResponse {
  total: number;
  por_categoria: { 1: number; 2: number; 3: number };
  invisiveis: InvisivelRow[];
}

export interface AgendaItem {
  ordem_visita: number;
  paciente_id: string;
  faixa_etaria: string;
  hipertenso: number;
  diabetico: number;
  gestacao: number;
  situacao_vulnerabilidade: number;
  score: number;
  prioridade: string | null;
  flag_invisivel: boolean;
  flag_crise_sem_vinculo: boolean;
  dias_sem_visita: number;
  n_urg_30d: number;
  n_urg_ano: number;
  tem_agendamento_futuro: boolean;
  distancia_anterior_km: number;
  distancia_acumulada_km: number;
  endereco_latitude: number;
  endereco_longitude: number;
  justificativa: string | null;
}

export interface Agenda {
  equipe_id: string;
  sede: { lat: number; lon: number };
  capacidade: number;
  total_itens: number;
  distancia_total_km: number;
  agenda: AgendaItem[];
}

export const apiClient = {
  kpis: () => api<KPIs>('/api/kpis'),
  patients: (params: { equipe_id?: string; score_min?: number; limit?: number; offset?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.equipe_id) q.set('equipe_id', params.equipe_id);
    if (params.score_min !== undefined) q.set('score_min', String(params.score_min));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.offset) q.set('offset', String(params.offset));
    return api<Paciente[]>(`/api/patients?${q.toString()}`);
  },
  patient: (id: string) => api<{ paciente: Paciente; visitas: unknown[]; eventos: unknown[]; alertas: Alerta[] }>(`/api/patients/${id}`),
  alerts: () => api<Alerta[]>('/api/alerts'),
  heatmap: () => api<HeatmapPoint[]>('/api/territory/heatmap'),
  equipesSedes: () => api<EquipeSede[]>('/api/territory/equipes'),
  isochrones: (lat: number, lng: number, ranges_min: number[] = [10, 15]) =>
    api<IsochroneResponse>('/api/territory/isochrones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng, ranges_min }),
    }),
  gestaoPainel: () => api<PainelEquipe[]>('/api/gestao/painel'),
  gestaoInvisiveis: (params: { equipe_id?: string; categoria?: 1 | 2 | 3; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.equipe_id) q.set('equipe_id', params.equipe_id);
    if (params.categoria) q.set('categoria', String(params.categoria));
    if (params.limit) q.set('limit', String(params.limit));
    return api<InvisivelResponse>(`/api/gestao/invisiveis?${q.toString()}`);
  },
  agendaEquipe: (equipe_id: string, params: { capacidade?: number; com_justificativas?: boolean } = {}) => {
    const q = new URLSearchParams();
    if (params.capacidade) q.set('capacidade', String(params.capacidade));
    if (params.com_justificativas !== undefined) q.set('com_justificativas', String(params.com_justificativas));
    return api<Agenda>(`/api/equipes/${equipe_id}/agenda?${q.toString()}`);
  },
};

// Helper: priority level from score (1=critico, 4=rotina). Escala 0-250+ apos Fase 2.
export function scoreToPriority(score: number): 1 | 2 | 3 | 4 {
  if (score >= 80) return 1;   // CRITICO
  if (score >= 50) return 2;   // URGENTE
  if (score >= 20) return 3;   // ATENCAO
  return 4;                    // ROTINA
}

export function priorityLabel(p: 1 | 2 | 3 | 4): string {
  return { 1: 'Crítico', 2: 'Urgente', 3: 'Atenção', 4: 'Rotina' }[p];
}

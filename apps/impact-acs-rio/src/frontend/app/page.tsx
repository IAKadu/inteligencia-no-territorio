import { apiClient } from '@/lib/api';
import { KpiCard } from '@/components/kpi-card';
import { PatientCard } from '@/components/patient-card';
import { MapSection } from '@/components/map-section';
import { PressaoTable } from '@/components/pressao-table';
import { InvisivelCounters } from '@/components/invisivel-counters';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [kpis, topPatients, hotspots, equipes, painel, invisiveis] = await Promise.all([
    apiClient.kpis(),
    apiClient.patients({ limit: 12 }),
    apiClient.heatmap().catch(() => []),
    apiClient.equipesSedes().catch(() => []),
    apiClient.gestaoPainel().catch(() => []),
    apiClient.gestaoInvisiveis({ limit: 1 }).catch(() => ({ total: 0, por_categoria: { 1: 0, 2: 0, 3: 0 }, invisiveis: [] })),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <p className="t-section-label">Reunião Semanal</p>
        <h1 className="t-section-title">Inteligência no Território</h1>
        <p className="text-sm mt-3 max-w-2xl leading-relaxed" style={{ color: 'var(--grey-text)' }}>
          Visão do território com pacientes priorizados, alertas operacionais
          e concentração de risco. Ferramenta de apoio à decisão na reunião
          semanal da equipe de Saúde da Família.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Pacientes" value={kpis.total_pacientes.toLocaleString('pt-BR')} accent="blue" />
        <KpiCard
          label="Cobertura"
          value={`${kpis.cobertura_pct}%`}
          hint={`${kpis.pacientes_visitados.toLocaleString('pt-BR')} visitados`}
          accent="green"
        />
        <KpiCard label="Alertas abertos" value={kpis.alertas_abertos} accent="red" />
        <KpiCard label="Urgências 30d" value={kpis.urgencias_30d.toLocaleString('pt-BR')} accent="cyan" />
      </section>

      <section>
        <h2 className="text-2xl font-black mb-3" style={{ color: 'var(--blue-secondary)' }}>
          Mapa do território
        </h2>
        <p className="text-sm mb-4 max-w-2xl" style={{ color: 'var(--grey-text)' }}>
          Hotspots de urgência (vermelho) sobre o território. Clique em uma sede de equipe (azul)
          para ver o alcance a pé do ACS em 10 e 15 minutos.
        </p>
        <MapSection hotspots={hotspots} equipes={equipes} />
      </section>

      <section>
        <h2 className="text-2xl font-black mb-3" style={{ color: 'var(--blue-secondary)' }}>
          Pacientes invisíveis
        </h2>
        <p className="text-sm mb-4 max-w-2xl" style={{ color: 'var(--grey-text)' }}>
          Pacientes sem nenhuma visita registrada no ano, classificados em 3 categorias de risco.
          O grupo 1 (crise sem vínculo) é o mais crítico — pessoas que foram ao hospital 3+ vezes
          e ainda assim não têm vínculo com a equipe de saúde da família.
        </p>
        <InvisivelCounters data={invisiveis} />
      </section>

      <section>
        <h2 className="text-2xl font-black mb-3" style={{ color: 'var(--blue-secondary)' }}>
          Pressão por equipe
        </h2>
        <p className="text-sm mb-4 max-w-2xl" style={{ color: 'var(--grey-text)' }}>
          Ranking de equipes por score composto de pressão (40% alto risco + 40% sem visita +
          20% urgência). Top 10 equipes do território — quem precisa de reforço operacional.
        </p>
        <PressaoTable painel={painel} limit={10} />
      </section>

      <section>
        <h2 className="text-2xl font-black mb-5" style={{ color: 'var(--blue-secondary)' }}>
          Top 12 prioridades
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topPatients.map(p => <PatientCard key={p.paciente_id} patient={p} />)}
        </div>
      </section>
    </div>
  );
}

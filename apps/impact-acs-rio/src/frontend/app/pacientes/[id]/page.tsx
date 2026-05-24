import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { ScoreBadge } from '@/components/score-badge';
import { ClinicalTag, factorToTagKind } from '@/components/clinical-tag';

export const dynamic = 'force-dynamic';

interface Visita {
  id: number;
  profissional_id: string;
  registrados_em: string;
  paciente_id: string;
  origem: string;
}

interface EventoClinico {
  paciente_id: string;
  tipo: string;
  data_referencia: string;
}

interface Alerta {
  id: number;
  paciente_id: string;
  tipo: string;
  mensagem: string;
  prioridade: number;
  criado_em: string;
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data;
  try {
    data = await apiClient.patient(id);
  } catch (err) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-black text-brand-blue-secondary">Paciente não encontrado</h1>
        <Link href="/pacientes" className="text-brand-blue-light underline mt-4 inline-block">← Voltar pra lista</Link>
      </div>
    );
  }
  const { paciente, visitas, eventos, alertas } = data as {
    paciente: typeof data.paciente;
    visitas: Visita[];
    eventos: EventoClinico[];
    alertas: Alerta[];
  };

  const tagKinds = Array.from(new Set(paciente.fatores.map(factorToTagKind)));

  return (
    <div className="space-y-8">
      <header>
        <Link href="/pacientes" className="text-xs text-brand-blue-primary font-bold uppercase tracking-wide">← Voltar pra lista</Link>
        <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
          <div>
            <p className="t-section-label">Paciente</p>
            <h1 className="text-2xl font-black text-brand-blue-secondary font-mono mt-1">
              #{paciente.paciente_id.slice(0, 16)}…
            </h1>
            <p className="text-grey-text mt-2">
              {paciente.faixa_etaria} · {paciente.sexo} · {paciente.raca_cor} · equipe #{paciente.equipe_id.slice(0, 8)}
            </p>
          </div>
          <ScoreBadge score={paciente.score} />
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-grey-mid rounded-md p-5 shadow-sm">
          <p className="t-eyebrow mb-3">Comorbidades</p>
          <dl className="space-y-2 text-sm">
            <Row k="Gestante" v={paciente.gestacao ? 'Sim' : 'Não'} highlight={!!paciente.gestacao} />
            <Row k="Hipertenso" v={paciente.hipertenso ? 'Sim' : 'Não'} highlight={!!paciente.hipertenso} />
            <Row k="Diabético" v={paciente.diabetico ? 'Sim' : 'Não'} highlight={!!paciente.diabetico} />
            <Row k="Vulnerável" v={paciente.situacao_vulnerabilidade ? 'Sim' : 'Não'} highlight={!!paciente.situacao_vulnerabilidade} />
          </dl>
        </div>

        <div className="bg-white border border-grey-mid rounded-md p-5 shadow-sm">
          <p className="t-eyebrow mb-3">Fatores do score</p>
          <div className="space-y-2">
            {paciente.fatores.length === 0 ? (
              <p className="text-sm text-grey-text">Nenhum fator de risco identificado.</p>
            ) : (
              paciente.fatores.map(f => (
                <div key={f} className="text-sm flex items-start gap-2">
                  <span className="text-brand-blue-primary mt-0.5">•</span>
                  <span>{f.replace(/_/g, ' ')}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-grey-mid rounded-md p-5 shadow-sm">
          <p className="t-eyebrow mb-3">Última visita</p>
          <p className="text-2xl font-black text-grey-dark">
            {paciente.ultima_visita ?? 'Nunca'}
          </p>
          {paciente.ultima_visita && <p className="text-sm text-grey-text mt-2">{visitas.length} visita{visitas.length > 1 ? 's' : ''} registrada{visitas.length > 1 ? 's' : ''}</p>}
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {tagKinds.map(k => <ClinicalTag key={k} kind={k} />)}
      </section>

      <section>
        <h2 className="text-lg font-bold text-grey-dark mb-3">
          Alertas abertos ({alertas.length})
        </h2>
        <div className="space-y-2">
          {alertas.length === 0 ? (
            <p className="text-sm text-grey-text bg-grey-card rounded-sm p-4">Nenhum alerta aberto pra este paciente.</p>
          ) : alertas.map(a => (
            <div key={a.id} className="bg-white border border-grey-mid rounded-sm p-4 border-l-4 border-l-[var(--priority-2)]">
              <div className="flex justify-between items-start">
                <p className="text-xs text-brand-blue-primary font-bold uppercase tracking-wide">{a.tipo}</p>
                <span className="text-xs text-grey-text">{a.criado_em}</span>
              </div>
              <p className="text-sm mt-2">{a.mensagem}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-bold text-grey-dark mb-3">Eventos clínicos ({eventos.length})</h2>
          {eventos.length === 0 ? (
            <p className="text-sm text-grey-text bg-grey-card rounded-sm p-4">Sem eventos clínicos.</p>
          ) : (
            <ul className="space-y-1 text-sm bg-grey-card rounded-sm p-4 max-h-64 overflow-y-auto">
              {eventos.slice(0, 30).map((e, i) => (
                <li key={i} className="flex justify-between">
                  <span className={e.tipo === 'urgencia-emergencia-ou-internacao' ? 'font-bold text-[var(--priority-1)]' : 'text-grey-text'}>
                    {e.tipo}
                  </span>
                  <span className="text-grey-text font-mono">{e.data_referencia}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-grey-dark mb-3">Visitas ({visitas.length})</h2>
          {visitas.length === 0 ? (
            <p className="text-sm text-grey-text bg-grey-card rounded-sm p-4">Sem visitas registradas.</p>
          ) : (
            <ul className="space-y-1 text-sm bg-grey-card rounded-sm p-4 max-h-64 overflow-y-auto">
              {visitas.slice(0, 30).map((v) => (
                <li key={v.id} className="flex justify-between">
                  <span className={v.origem === 'whatsapp' ? 'font-bold text-brand-green' : 'text-grey-text'}>
                    {v.origem === 'whatsapp' ? '💬 WhatsApp' : '📋 Sistema'}
                  </span>
                  <span className="text-grey-text font-mono">{v.registrados_em}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-grey-text">{k}</dt>
      <dd className={`font-bold ${highlight ? 'text-brand-blue-primary' : 'text-grey-dark'}`}>{v}</dd>
    </div>
  );
}

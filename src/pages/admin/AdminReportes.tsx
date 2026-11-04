import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowSquareOut,
  CheckCircle,
  Flag,
  MagnifyingGlass,
  NotePencil,
  X,
  XCircle,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/lib/toast';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select, inputClass } from '@/components/ui/Field';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { DemoNotice } from '@/components/common/DemoNotice';
import { formatDateTime, relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { AdminReport } from '@/lib/types';

type ReportStatus = 'all' | AdminReport['status'];

const targetLabels: Record<AdminReport['target_type'], string> = {
  exercise: 'Ejercicio',
  challenge: 'Reto',
  user: 'Usuario',
};

const targetLinks: Record<AdminReport['target_type'], string> = {
  exercise: '/admin/ejercicios',
  challenge: '/admin/retos',
  user: '/admin/usuarios',
};

const statusTone = {
  open: 'amber',
  reviewed: 'emerald',
  dismissed: 'slate',
} as const;

const statusLabels = {
  open: 'Abierto',
  reviewed: 'Revisado',
  dismissed: 'Descartado',
} as const;

export default function AdminReportes() {
  const toast = useToast();
  const [status, setStatus] = useState<ReportStatus>('all');
  const [q, setQ] = useState('');
  const { data, loading, error, reload } = useAsyncData(
    () => api.get<{ items: AdminReport[] }>('/admin/reports', { status: status === 'all' ? '' : status }),
    [status],
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const reports = data?.items || [];
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return reports;
    return reports.filter((report) =>
      [report.reason, report.reporter_name || '', report.reporter_email || '', report.target_id, report.target_type]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [q, reports]);

  const summary = useMemo(
    () => ({
      total: reports.length,
      open: reports.filter((report) => report.status === 'open').length,
      reviewed: reports.filter((report) => report.status === 'reviewed').length,
      dismissed: reports.filter((report) => report.status === 'dismissed').length,
    }),
    [reports],
  );

  async function updateStatus(report: AdminReport, next: AdminReport['status']) {
    setBusyId(report.id);
    try {
      await api.patch(`/admin/reports/${report.id}`, { status: next });
      toast.success(
        next === 'reviewed' ? 'Reporte marcado como revisado.' : next === 'dismissed' ? 'Reporte descartado.' : 'Reporte reabierto.',
      );
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos actualizar el reporte.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <PageLoader label="Cargando reportes…" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Revisa el contenido señalado por la comunidad y registra una decisión. Los reportes no eliminan contenido automáticamente: la moderación se hace desde la sección correspondiente."
      />

      <DemoNotice>
        El reporte inicial forma parte de los datos de demostración. Los reportes nuevos provienen de cuentas de la base local y no representan denuncias reales.
      </DemoNotice>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de reportes">
        <StatCard label="Visibles" value={summary.total} hint="Con el filtro actual" icon={<Flag size={18} />} tone="violet" />
        <StatCard label="Abiertos" value={summary.open} hint="Pendientes de decisión" icon={<NotePencil size={18} />} tone="amber" />
        <StatCard label="Revisados" value={summary.reviewed} hint="Atendidos" icon={<CheckCircle size={18} />} tone="emerald" />
        <StatCard label="Descartados" value={summary.dismissed} hint="Sin acción necesaria" icon={<XCircle size={18} />} />
      </section>

      <section className="surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar por motivo, usuario o identificador…"
              aria-label="Buscar reportes"
              className={cn(inputClass, 'pl-9')}
            />
          </div>
          <Select
            aria-label="Filtrar por estado"
            value={status}
            onChange={(event) => setStatus(event.target.value as ReportStatus)}
            className="sm:w-48"
          >
            <option value="all">Todos los estados</option>
            <option value="open">Abiertos</option>
            <option value="reviewed">Revisados</option>
            <option value="dismissed">Descartados</option>
          </Select>
          {(q || status !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setQ(''); setStatus('all'); }} icon={<X size={13} />}>Limpiar</Button>
          )}
        </div>
        <p className="mt-3 text-[11px] text-muted">{filtered.length} de {reports.length} reportes visibles.</p>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Flag}
          title={reports.length === 0 ? 'No hay reportes en este estado' : 'Ningún reporte coincide'}
          description={
            reports.length === 0
              ? 'Cuando una persona reporte un ejercicio, reto o usuario, aparecerá aquí para revisión.'
              : 'Prueba con otro término de búsqueda o cambia el filtro de estado.'
          }
          action={reports.length > 0 ? <Button variant="secondary" size="sm" onClick={() => { setQ(''); setStatus('all'); }}>Quitar filtros</Button> : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((report) => {
            const busy = busyId === report.id;
            return (
              <li key={report.id} className="surface p-4 sm:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={statusTone[report.status]}>{statusLabels[report.status]}</Badge>
                      <Badge tone="slate">{targetLabels[report.target_type]}</Badge>
                      {report.id === 'report-demo' && <Badge tone="amber">Demo</Badge>}
                      <span className="text-[10px] text-muted">{relativeTime(report.created_at)}</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink">{report.reason}</p>
                    <p className="mt-1.5 text-[10.5px] text-muted">
                      Reportado por <span className="font-medium text-ink-soft">{report.reporter_name || 'usuario eliminado'}</span>
                      {report.reporter_email ? ` · ${report.reporter_email}` : ''}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted">
                      <span className="font-mono text-[9.5px]">ID: {report.target_id}</span>
                      <Link to={targetLinks[report.target_type]} className="inline-flex items-center gap-1 rounded font-semibold text-electric hover:underline focus-ring">
                        Ir a {targetLabels[report.target_type].toLowerCase()}s <ArrowSquareOut size={10} aria-hidden="true" />
                      </Link>
                      <span title={formatDateTime(report.created_at)}>{formatDateTime(report.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                    {report.status !== 'reviewed' && (
                      <Button
                        variant="success"
                        size="sm"
                        loading={busy}
                        onClick={() => updateStatus(report, 'reviewed')}
                        icon={<CheckCircle size={13} aria-hidden="true" />}
                      >
                        Revisado
                      </Button>
                    )}
                    {report.status !== 'dismissed' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={busy}
                        onClick={() => updateStatus(report, 'dismissed')}
                        icon={<XCircle size={13} aria-hidden="true" />}
                      >
                        Descartar
                      </Button>
                    )}
                    {report.status !== 'open' && (
                      <Button variant="ghost" size="sm" loading={busy} onClick={() => updateStatus(report, 'open')}>
                        Reabrir
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[10.5px] leading-relaxed text-muted">
        “Revisado” indica que el equipo atendió el reporte. Si el contenido requiere una acción, ocúltalo o ciérralo desde las secciones de ejercicios o retos.
      </p>
    </div>
  );
}

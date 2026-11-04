import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowSquareOut,
  Briefcase,
  CalendarBlank,
  ClipboardText,
  MapPin,
  PencilSimple,
  Plus,
  Trash,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/lib/toast';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { buttonStyles } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { DemoNotice } from '@/components/common/DemoNotice';
import { daysUntil, formatDate, plural } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { CompanyVacancy, VacancyStatus, VacancyType } from '@/lib/types';

const typeLabels: Record<VacancyType, string> = {
  empleo: 'Empleo',
  practica: 'Práctica',
  junior: 'Junior',
};

const statusLabels: Record<VacancyStatus, string> = {
  draft: 'Borrador',
  open: 'Publicada',
  closed: 'Cerrada',
};

const statusTone = {
  draft: 'amber',
  open: 'emerald',
  closed: 'slate',
} as const;

export default function EmpresaVacantes() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsyncData(
    () => api.get<{ items: CompanyVacancy[] }>('/company/vacancies'),
    [],
  );
  const [deleteTarget, setDeleteTarget] = useState<CompanyVacancy | null>(null);
  const [deleting, setDeleting] = useState(false);

  const items = data?.items || [];
  const totals = {
    open: items.filter((item) => item.status === 'open').length,
    draft: items.filter((item) => item.status === 'draft').length,
    closed: items.filter((item) => item.status === 'closed').length,
    tests: items.reduce((sum, item) => sum + item.testsCount, 0),
  };

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/company/vacancies/${deleteTarget.id}`);
      toast.success('Vacante eliminada.');
      setDeleteTarget(null);
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos eliminar la vacante.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <PageLoader label="Cargando vacantes…" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vacantes"
        description="Publica empleos, prácticas y roles junior. Agrega requisitos claros y vincula una prueba técnica de admisión."
        actions={
          <Link to="/empresa/vacantes/nuevo" className={buttonStyles('primary', 'md')}>
            <Plus size={15} aria-hidden="true" /> Nueva vacante
          </Link>
        }
      />

      <DemoNotice>
        Las vacantes de demostración están identificadas. Publicar una vacante no garantiza contratación ni representa una
        oferta laboral real.
      </DemoNotice>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de vacantes">
        <StatCard label="Publicadas" value={totals.open} hint="Visibles en el portal público" icon={<Briefcase size={18} />} tone="emerald" />
        <StatCard label="Borradores" value={totals.draft} hint="Solo visibles para tu empresa" icon={<PencilSimple size={18} />} tone="amber" />
        <StatCard label="Cerradas" value={totals.closed} hint="Fuera del portal público" icon={<CalendarBlank size={18} />} />
        <StatCard label="Pruebas vinculadas" value={totals.tests} hint="Evaluaciones adjuntas" icon={<ClipboardText size={18} />} tone="violet" />
      </section>

      {items.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Aún no has creado vacantes"
          description="Publica una práctica, un rol junior o un empleo con contexto. Después puedes agregar una prueba técnica desde el panel."
          action={<Link to="/empresa/vacantes/nuevo" className={buttonStyles('primary', 'sm')}>Crear mi primera vacante</Link>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((vacancy) => {
            const remaining = daysUntil(vacancy.deadline);
            return (
              <article key={vacancy.id} className="surface flex flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={statusTone[vacancy.status]}>{statusLabels[vacancy.status]}</Badge>
                  <Badge tone="blue">{typeLabels[vacancy.type]}</Badge>
                  {vacancy.isDemo && <Badge tone="amber">Demo</Badge>}
                  {vacancy.testsCount > 0 && <Badge tone="violet">{plural(vacancy.testsCount, 'prueba', 'pruebas')}</Badge>}
                </div>
                <h2 className="mt-3 text-lg font-semibold leading-snug tracking-[-0.025em] text-ink">{vacancy.title}</h2>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{vacancy.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[10.5px] text-muted">
                  {vacancy.location && <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-1"><MapPin size={11} aria-hidden="true" />{vacancy.location}</span>}
                  {vacancy.modality && <span className="rounded-full bg-paper px-2 py-1 capitalize">{vacancy.modality}</span>}
                  {vacancy.salaryRange && <span className="rounded-full bg-paper px-2 py-1">{vacancy.salaryRange}</span>}
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-[11px]">
                  <div>
                    <dt className="text-muted">Cierre</dt>
                    <dd className="mt-0.5 font-semibold text-ink">{formatDate(vacancy.deadline)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Plazo</dt>
                    <dd className={cn('mt-0.5 font-semibold', vacancy.status === 'open' && remaining >= 0 && remaining <= 7 ? 'text-amber' : 'text-ink')}>
                      {vacancy.status === 'closed' ? 'Cerrada' : remaining < 0 ? 'Vencida' : remaining === 0 ? 'Hoy' : `${remaining} días`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Pruebas</dt>
                    <dd className="mt-0.5 font-semibold text-ink">{vacancy.testsCount}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link to={`/empresa/vacantes/${vacancy.id}`} className={buttonStyles('secondary', 'sm')}>
                    <PencilSimple size={13} aria-hidden="true" /> Editar
                  </Link>
                  <Link to="/empresa/pruebas/nuevo" className={buttonStyles('ghost', 'sm')}>
                    <ClipboardText size={13} aria-hidden="true" /> Agregar prueba
                  </Link>
                  {vacancy.status === 'open' && (
                    <Link to="/empresas#vacantes" className={buttonStyles('ghost', 'sm')}>
                      <ArrowSquareOut size={13} aria-hidden="true" /> Ver portal
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(vacancy)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted transition hover:bg-rose/5 hover:text-rose focus-ring"
                    aria-label={`Eliminar ${vacancy.title}`}
                  >
                    <Trash size={13} aria-hidden="true" /> Eliminar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="surface flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric/8 text-electric">
            <ClipboardText size={19} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">¿Ya tienes una prueba técnica?</h2>
            <p className="mt-0.5 max-w-2xl text-[11.5px] leading-relaxed text-muted">
              Crea la evaluación, define preguntas y puntaje mínimo, y vincúlala a una de tus vacantes publicadas.
            </p>
          </div>
        </div>
        <Link to="/empresa/pruebas/nuevo" className={buttonStyles('secondary', 'sm')}>
          <Plus size={14} aria-hidden="true" /> Nueva prueba
        </Link>
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Eliminar vacante"
        description={`Se eliminará "${deleteTarget?.title || ''}" de forma permanente. Las pruebas vinculadas quedarán sin vacante.`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowSquareOut,
  ClipboardText,
  Clock,
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
import { plural } from '@/lib/format';
import type { CompanyTechnicalTest } from '@/lib/types';

const statusLabels: Record<CompanyTechnicalTest['status'], string> = {
  draft: 'Borrador',
  published: 'Publicada',
  archived: 'Archivada',
};

const statusTone = {
  draft: 'amber',
  published: 'emerald',
  archived: 'slate',
} as const;

export default function EmpresaPruebas() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsyncData(
    () => api.get<{ items: CompanyTechnicalTest[] }>('/company/technical-tests'),
    [],
  );
  const [deleteTarget, setDeleteTarget] = useState<CompanyTechnicalTest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const items = data?.items || [];
  const totals = {
    published: items.filter((item) => item.status === 'published').length,
    draft: items.filter((item) => item.status === 'draft').length,
    archived: items.filter((item) => item.status === 'archived').length,
    questions: items.reduce((sum, item) => sum + item.questionCount, 0),
  };

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/company/technical-tests/${deleteTarget.id}`);
      toast.success('Prueba técnica eliminada.');
      setDeleteTarget(null);
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos eliminar la prueba.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <PageLoader label="Cargando pruebas técnicas…" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pruebas técnicas"
        description="Crea evaluaciones de admisión con preguntas abiertas u opciones múltiples, duración y puntaje mínimo. Vincúlalas a una vacante."
        actions={
          <Link to="/empresa/pruebas/nuevo" className={buttonStyles('primary', 'md')}>
            <Plus size={15} aria-hidden="true" /> Nueva prueba
          </Link>
        }
      />

      <DemoNotice>
        Las pruebas son datos de demostración. No sustituyen procesos de selección reales ni certifican competencias.
      </DemoNotice>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de pruebas">
        <StatCard label="Publicadas" value={totals.published} hint="Visibles en el portal" icon={<ClipboardText size={18} />} tone="emerald" />
        <StatCard label="Borradores" value={totals.draft} hint="Solo visibles para tu empresa" icon={<PencilSimple size={18} />} tone="amber" />
        <StatCard label="Archivadas" value={totals.archived} hint="Fuera del portal público" icon={<ClipboardText size={18} />} />
        <StatCard label="Preguntas" value={totals.questions} hint="En todas las pruebas" icon={<ClipboardText size={18} />} tone="violet" />
      </section>

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardText}
          title="Aún no has creado pruebas técnicas"
          description="Agrega preguntas, define duración y puntaje mínimo, y publica la evaluación cuando esté lista."
          action={<Link to="/empresa/pruebas/nuevo" className={buttonStyles('primary', 'sm')}>Crear mi primera prueba</Link>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((test) => (
            <article key={test.id} className="surface flex flex-col p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={statusTone[test.status]}>{statusLabels[test.status]}</Badge>
                {test.vacancyTitle && <Badge tone="blue">{test.vacancyTitle}</Badge>}
                {test.isDemo && <Badge tone="amber">Demo</Badge>}
              </div>
              <h2 className="mt-3 text-lg font-semibold leading-snug tracking-[-0.025em] text-ink">{test.title}</h2>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{test.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10.5px] text-muted">
                <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-1"><Clock size={11} aria-hidden="true" />{test.durationMinutes} min</span>
                <span className="rounded-full bg-paper px-2 py-1">Mínimo {test.passingScore}%</span>
                <span className="rounded-full bg-paper px-2 py-1">{plural(test.questionCount, 'pregunta', 'preguntas')}</span>
                {test.instructions && <span className="rounded-full bg-paper px-2 py-1">Con instrucciones</span>}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <Link to={`/empresa/pruebas/${test.id}`} className={buttonStyles('secondary', 'sm')}>
                  <PencilSimple size={13} aria-hidden="true" /> Editar
                </Link>
                {test.status === 'published' && (
                  <Link to="/empresas#pruebas" className={buttonStyles('ghost', 'sm')}>
                    <ArrowSquareOut size={13} aria-hidden="true" /> Ver portal
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(test)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted transition hover:bg-rose/5 hover:text-rose focus-ring"
                  aria-label={`Eliminar ${test.title}`}
                >
                  <Trash size={13} aria-hidden="true" /> Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Eliminar prueba técnica"
        description={`Se eliminará "${deleteTarget?.title || ''}" de forma permanente. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}

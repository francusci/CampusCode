import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowSquareOut,
  CalendarBlank,
  Eye,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Trash,
  Trophy,
  UsersThree,
  X,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/lib/toast';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Select, inputClass } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { DemoNotice } from '@/components/common/DemoNotice';
import { daysUntil, formatDate, plural } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { CompanyChallenge } from '@/lib/types';

type StatusFilter = 'all' | CompanyChallenge['status'];

const statusLabels: Record<CompanyChallenge['status'], string> = {
  open: 'Abierto',
  draft: 'Borrador',
  closed: 'Cerrado',
};

const statusTone = {
  open: 'emerald',
  draft: 'amber',
  closed: 'slate',
} as const;

export default function EmpresaRetos() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsyncData(
    () => api.get<{ items: CompanyChallenge[] }>('/company/challenges'),
    [],
  );
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<CompanyChallenge | null>(null);
  const [deleting, setDeleting] = useState(false);

  const challenges = data?.items || [];
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return challenges.filter((challenge) => {
      if (status !== 'all' && challenge.status !== status) return false;
      if (!term) return true;
      return [challenge.title, challenge.category, challenge.summary, ...challenge.skills]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [challenges, q, status]);

  const totals = useMemo(
    () => ({
      open: challenges.filter((challenge) => challenge.status === 'open').length,
      draft: challenges.filter((challenge) => challenge.status === 'draft').length,
      closed: challenges.filter((challenge) => challenge.status === 'closed').length,
      applications: challenges.reduce((sum, challenge) => sum + challenge.applicationsCount, 0),
      newApplications: challenges.reduce((sum, challenge) => sum + challenge.newApplications, 0),
    }),
    [challenges],
  );

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/company/challenges/${deleteTarget.id}`);
      toast.success('Reto eliminado.');
      setDeleteTarget(null);
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos eliminar el reto.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <PageLoader label="Cargando tus retos…" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  const hasDemo = challenges.some((challenge) => challenge.isDemo);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis retos"
        description="Crea, publica y cierra desafíos. Cada reto muestra a los estudiantes el contexto, los requisitos y los entregables esperados."
        actions={<Link to="/empresa/retos/nuevo" className={buttonStyles('primary', 'md')}><Plus size={15} aria-hidden="true" /> Nuevo reto</Link>}
      />

      {hasDemo && (
        <DemoNotice>
          Algunos retos de esta cuenta son ejemplos ficticios creados para la demostración. Puedes editarlos o eliminarlos si no tienen postulaciones.
        </DemoNotice>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Resumen de retos">
        <StatCard label="Abiertos" value={totals.open} hint="Visibles para estudiantes" icon={<Trophy size={18} />} tone="emerald" />
        <StatCard label="Borradores" value={totals.draft} hint="Solo visibles para tu empresa" icon={<PencilSimple size={18} />} tone="amber" />
        <StatCard label="Cerrados" value={totals.closed} hint="Fuera del catálogo público" icon={<X size={18} />} />
        <StatCard label="Postulaciones" value={totals.applications} hint="Histórico de tus retos" icon={<UsersThree size={18} />} tone="violet" />
        <StatCard label="Sin revisar" value={totals.newApplications} hint="Estado enviada" icon={<Eye size={18} />} tone="violet" />
      </section>

      <section className="surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar por título, categoría o habilidad…"
              aria-label="Buscar en mis retos"
              className={cn(inputClass, 'pl-9')}
            />
          </div>
          <Select
            aria-label="Filtrar retos por estado"
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="sm:w-44"
          >
            <option value="all">Todos los estados</option>
            <option value="open">Abiertos</option>
            <option value="draft">Borradores</option>
            <option value="closed">Cerrados</option>
          </Select>
          {(q || status !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ('');
                setStatus('all');
              }}
              icon={<X size={13} />}
            >
              Limpiar
            </Button>
          )}
        </div>
        <p className="mt-3 text-[11px] text-muted">
          {plural(filtered.length, 'reto visible', 'retos visibles')} de {challenges.length} en total.
        </p>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={challenges.length === 0 ? 'Aún no has creado retos' : 'Ningún reto coincide con los filtros'}
          description={
            challenges.length === 0
              ? 'Empieza con un problema concreto de tu sector, define los entregables y publica cuando esté listo. Puedes guardarlo como borrador.'
              : 'Prueba con otra palabra o cambia el filtro de estado para ver tus retos.'
          }
          action={
            challenges.length === 0 ? (
              <Link to="/empresa/retos/nuevo" className={buttonStyles('primary', 'sm')}>Crear mi primer reto</Link>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => { setQ(''); setStatus('all'); }}>Ver todos</Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((challenge) => {
            const remaining = daysUntil(challenge.deadline);
            return (
              <article key={challenge.id} className="surface flex flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={statusTone[challenge.status]}>{statusLabels[challenge.status]}</Badge>
                  <Badge tone="slate">{challenge.category}</Badge>
                  {challenge.featured && <Badge tone="violet">Destacado</Badge>}
                  {challenge.isDemo && <Badge tone="amber">Demo</Badge>}
                </div>
                <h2 className="mt-3 text-lg font-semibold leading-snug tracking-[-0.025em] text-ink">{challenge.title}</h2>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{challenge.summary}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {challenge.skills.slice(0, 5).map((skill) => (
                    <span key={skill} className="rounded-md bg-paper px-2 py-0.5 text-[10.5px] font-medium text-ink-soft">{skill}</span>
                  ))}
                  {challenge.skills.length > 5 && <span className="px-1 py-0.5 text-[10.5px] text-muted">+{challenge.skills.length - 5}</span>}
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-[11px]">
                  <div>
                    <dt className="text-muted">Postulaciones</dt>
                    <dd className="mt-0.5 font-semibold text-ink">
                      {challenge.applicationsCount}
                      {challenge.newApplications > 0 && <span className="ml-1 text-[10px] font-medium text-electric">({challenge.newApplications} nuevas)</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Cierre</dt>
                    <dd className="mt-0.5 font-semibold text-ink">{formatDate(challenge.deadline)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Plazo</dt>
                    <dd className={cn('mt-0.5 font-semibold', challenge.status === 'open' && remaining >= 0 && remaining <= 7 ? 'text-amber' : 'text-ink')}>
                      {challenge.status === 'closed' ? 'Cerrado' : remaining < 0 ? 'Vencido' : remaining === 0 ? 'Hoy' : `${remaining} días`}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link to={`/empresa/retos/${challenge.id}`} className={buttonStyles('secondary', 'sm')}>
                    <PencilSimple size={13} aria-hidden="true" /> Editar
                  </Link>
                  {challenge.status !== 'draft' && (
                    <Link to={`/retos/${challenge.slug}`} className={buttonStyles('ghost', 'sm')}>
                      <ArrowSquareOut size={13} aria-hidden="true" /> Ver público
                    </Link>
                  )}
                  <Link to="/empresa/postulaciones" className={buttonStyles('ghost', 'sm')}>
                    <UsersThree size={13} aria-hidden="true" /> Postulaciones
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(challenge)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted transition hover:bg-rose/5 hover:text-rose focus-ring"
                    aria-label={`Eliminar ${challenge.title}`}
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
            <CalendarBlank size={19} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Buenas prácticas para publicar</h2>
            <p className="mt-0.5 max-w-2xl text-[11.5px] leading-relaxed text-muted">
              Define un problema acotado, explica el contexto de negocio y describe entregables verificables. Los retos con alcance claro reciben mejores postulaciones.
            </p>
          </div>
        </div>
        <Link to="/empresa/retos/nuevo" className={buttonStyles('primary', 'sm')}>
          <Plus size={14} aria-hidden="true" /> Crear reto
        </Link>
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Eliminar reto"
        description={
          deleteTarget && deleteTarget.applicationsCount > 0
            ? `"${deleteTarget.title}" tiene ${deleteTarget.applicationsCount} postulaciones. El servidor impedirá eliminarlo; ciérralo en su lugar.`
            : `Se eliminará "${deleteTarget?.title || ''}" de forma permanente. Esta acción no se puede deshacer.`
        }
        confirmLabel="Eliminar"
      />
    </div>
  );
}

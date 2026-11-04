import { useMemo, useState } from 'react';
import {
  Buildings,
  CalendarBlank,
  CheckCircle,
  MagnifyingGlass,
  Star,
  Trophy,
  UsersThree,
  X,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData, useDebouncedValue } from '@/hooks/useAsyncData';
import { useToast } from '@/lib/toast';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select, inputClass } from '@/components/ui/Field';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { DemoNotice } from '@/components/common/DemoNotice';
import { daysUntil, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { AdminChallengeRow } from '@/lib/types';

type StatusFilter = 'all' | AdminChallengeRow['status'];

const statusTone = {
  open: 'emerald',
  draft: 'amber',
  closed: 'slate',
} as const;

export default function AdminRetos() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const debouncedQ = useDebouncedValue(q, 320);
  const { data, loading, error, reload } = useAsyncData(
    () => api.get<{ items: AdminChallengeRow[] }>('/admin/challenges', { q: debouncedQ }),
    [debouncedQ],
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const challenges = data?.items || [];
  const filtered = useMemo(
    () =>
      challenges.filter((challenge) => {
        if (status !== 'all' && challenge.status !== status) return false;
        if (onlyFeatured && !challenge.featured) return false;
        return true;
      }),
    [challenges, onlyFeatured, status],
  );

  const summary = useMemo(
    () => ({
      total: challenges.length,
      open: challenges.filter((challenge) => challenge.status === 'open').length,
      drafts: challenges.filter((challenge) => challenge.status === 'draft').length,
      featured: challenges.filter((challenge) => challenge.featured).length,
      applications: challenges.reduce((sum, challenge) => sum + challenge.applicationsCount, 0),
    }),
    [challenges],
  );

  async function updateChallenge(challenge: AdminChallengeRow, body: { status?: AdminChallengeRow['status']; featured?: boolean }) {
    setBusyId(challenge.id);
    try {
      await api.patch(`/admin/challenges/${challenge.id}`, body);
      toast.success(
        body.status
          ? 'Estado del reto actualizado.'
          : body.featured
            ? 'Reto destacado en el catálogo.'
            : 'Reto retirado de destacados.',
      );
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos actualizar el reto.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <PageLoader label="Cargando retos…" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Retos de empresas"
        description="Modera la publicación de retos, destaca los más relevantes y revisa su actividad. Los cambios afectan al catálogo público de inmediato."
      />

      <DemoNotice>
        Los retos y empresas iniciales son ficticios y están etiquetados como demostración. Destacar un reto no lo convierte en una alianza real.
      </DemoNotice>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Resumen de retos">
        <StatCard label="Total" value={summary.total} hint="Incluye borradores" icon={<Trophy size={18} />} />
        <StatCard label="Abiertos" value={summary.open} hint="Visibles en el catálogo" icon={<CheckCircle size={18} />} tone="emerald" />
        <StatCard label="Borradores" value={summary.drafts} hint="No públicos" icon={<Buildings size={18} />} tone="amber" />
        <StatCard label="Destacados" value={summary.featured} hint="Selección editorial" icon={<Star size={18} />} tone="violet" />
        <StatCard label="Postulaciones" value={summary.applications} hint="En todos los retos" icon={<UsersThree size={18} />} tone="violet" />
      </section>

      <section className="surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar por título o empresa…"
              aria-label="Buscar retos"
              className={cn(inputClass, 'pl-9')}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              aria-label="Filtrar por estado"
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              className="w-40"
            >
              <option value="all">Todos los estados</option>
              <option value="open">Abiertos</option>
              <option value="draft">Borradores</option>
              <option value="closed">Cerrados</option>
            </Select>
            <button
              type="button"
              onClick={() => setOnlyFeatured((current) => !current)}
              aria-pressed={onlyFeatured}
              className={cn(
                'inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-[11.5px] font-semibold transition focus-ring',
                onlyFeatured ? 'border-violet/25 bg-violet/10 text-violet' : 'border-line-strong bg-white text-ink-soft hover:bg-paper',
              )}
            >
              <Star size={14} weight={onlyFeatured ? 'fill' : 'regular'} aria-hidden="true" /> Solo destacados
            </button>
            {(q || status !== 'all' || onlyFeatured) && (
              <Button variant="ghost" size="sm" onClick={() => { setQ(''); setStatus('all'); setOnlyFeatured(false); }} icon={<X size={13} />}>Limpiar</Button>
            )}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted">{filtered.length} de {challenges.length} retos con los filtros actuales.</p>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No hay retos con esos filtros"
          description="Ajusta la búsqueda o el estado para encontrar otros retos."
          action={<Button variant="secondary" size="sm" onClick={() => { setQ(''); setStatus('all'); setOnlyFeatured(false); }}>Quitar filtros</Button>}
        />
      ) : (
        <section className="surface overflow-hidden" aria-label="Listado de retos">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-paper/50 text-[9.5px] uppercase tracking-[0.12em] text-muted">
                  <th className="px-4 py-3 font-semibold">Reto</th>
                  <th className="px-4 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold">Cierre</th>
                  <th className="px-4 py-3 font-semibold">Postulaciones</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((challenge) => {
                  const remaining = daysUntil(challenge.deadline);
                  const busy = busyId === challenge.id;
                  return (
                    <tr key={challenge.id} className="border-b border-line/70 last:border-0">
                      <td className="max-w-[280px] px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-[12.5px] font-semibold text-ink">{challenge.title}</p>
                          {challenge.featured && <Star size={12} weight="fill" className="text-violet" aria-label="Destacado" />}
                          {challenge.isDemo && <span className="rounded bg-amber/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber">Demo</span>}
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted">Creado {formatDate(challenge.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted">{challenge.companyName}</td>
                      <td className="px-4 py-3"><Badge tone="slate">{challenge.category}</Badge></td>
                      <td className="px-4 py-3 text-[10.5px] text-muted">
                        <p className="flex items-center gap-1"><CalendarBlank size={11} aria-hidden="true" /> {formatDate(challenge.deadline)}</p>
                        {challenge.status !== 'closed' && (
                          <p className={cn('mt-0.5', remaining < 0 ? 'text-rose' : remaining <= 7 ? 'text-amber' : 'text-muted')}>
                            {remaining < 0 ? 'Vencido' : remaining === 0 ? 'Vence hoy' : `${remaining} días`}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-ink">{challenge.applicationsCount}</td>
                      <td className="px-4 py-3">
                        <Select
                          aria-label={`Estado de ${challenge.title}`}
                          value={challenge.status}
                          disabled={busy}
                          onChange={(event) => updateChallenge(challenge, { status: event.target.value as AdminChallengeRow['status'] })}
                          className="h-8 w-32 py-0 text-[11.5px]"
                        >
                          <option value="draft">Borrador</option>
                          <option value="open">Abierto</option>
                          <option value="closed">Cerrado</option>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => updateChallenge(challenge, { featured: !challenge.featured })}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10.5px] font-semibold transition focus-ring disabled:opacity-40',
                              challenge.featured
                                ? 'border-violet/25 bg-violet/10 text-violet hover:bg-violet/15'
                                : 'border-line-strong text-ink-soft hover:bg-paper',
                            )}
                            aria-pressed={challenge.featured}
                            aria-label={challenge.featured ? `Quitar de destacados ${challenge.title}` : `Destacar ${challenge.title}`}
                          >
                            <Star size={12} weight={challenge.featured ? 'fill' : 'regular'} aria-hidden="true" />
                            {challenge.featured ? 'Destacado' : 'Destacar'}
                          </button>
                          {challenge.status !== 'draft' && (
                            <a
                              href={`/retos/${challenge.slug}`}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="rounded-lg border border-line-strong px-2 py-1 text-[10.5px] font-semibold text-ink-soft transition hover:bg-paper focus-ring"
                            >
                              Ver
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4">
        <Badge tone={statusTone.open}>Abierto</Badge>
        <p className="text-[11px] leading-relaxed text-muted">
          Los retos abiertos aparecen en el catálogo público. Los borradores solo los ve la empresa. Los cerrados permanecen visibles como histórico sin aceptar postulaciones nuevas.
        </p>
      </div>
    </div>
  );
}

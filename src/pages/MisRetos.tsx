import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarBlank,
  CheckCircle,
  Clock,
  FileText,
  LinkSimple,
  Trophy,
  XCircle,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Field';
import { CardSkeleton } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { DemoNotice } from '@/components/common/DemoNotice';
import { applicationStatusClass, applicationStatusLabels, formatDate, plural } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Application } from '@/lib/types';

export default function MisRetos() {
  const toast = useToast();
  const applications = useAsyncData(() => api.get<{ items: Application[] }>('/me/applications'), []);
  const [items, setItems] = useState<Application[] | null>(null);
  const [filter, setFilter] = useState('');
  const [deliverableTarget, setDeliverableTarget] = useState<Application | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<Application | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const list = items ?? applications.data?.items ?? [];
  const filtered = filter ? list.filter((application) => application.status === filter) : list;

  async function addDeliverable() {
    if (!deliverableTarget) return;
    if (title.trim().length < 3) return toast.error('El título debe tener al menos 3 caracteres.');
    if (!/^https?:\/\/[^\s]+$/i.test(url.trim())) return toast.error('El enlace debe comenzar por http:// o https://.');
    setSaving(true);
    try {
      const response = await api.post<{ id: string; message: string }>(`/applications/${deliverableTarget.id}/deliverables`, {
        title: title.trim(),
        url: url.trim(),
        notes: notes.trim() || undefined,
      });
      setItems(list.map((application) =>
        application.id === deliverableTarget.id
          ? {
              ...application,
              deliverables: [
                { id: response.id, title: title.trim(), url: url.trim(), notes: notes.trim() || null, created_at: new Date().toISOString().slice(0, 19).replace('T', ' ') },
                ...application.deliverables,
              ],
            }
          : application,
      ));
      toast.success(response.message);
      setDeliverableTarget(null);
      setTitle('');
      setUrl('');
      setNotes('');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos registrar el entregable.');
    } finally {
      setSaving(false);
    }
  }

  async function withdraw() {
    if (!withdrawTarget) return;
    setWithdrawing(true);
    try {
      await api.post(`/applications/${withdrawTarget.id}/withdraw`);
      setItems(list.map((application) => application.id === withdrawTarget.id ? { ...application, status: 'withdrawn' } : application));
      toast.success('Postulación retirada.');
      setWithdrawTarget(null);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos retirar la postulación.');
    } finally {
      setWithdrawing(false);
    }
  }

  if (applications.loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mis retos" description="Sigue tus postulaciones y entregables." />
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }).map((_, index) => <CardSkeleton key={index} />)}</div>
      </div>
    );
  }
  if (applications.error) return <ErrorState message={applications.error.message} onRetry={applications.reload} />;

  const active = list.filter((application) => application.status !== 'withdrawn').length;
  const accepted = list.filter((application) => application.status === 'accepted').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis retos"
        description="Consulta el estado de tus postulaciones, agrega entregables y retírate si cambias de decisión."
        actions={<Link to="/retos" className={buttonStyles('primary', 'md')}>Explorar retos <ArrowRight size={15} aria-hidden="true" /></Link>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-4"><p className="text-[11px] text-muted">Postulaciones totales</p><p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-ink">{list.length}</p></div>
        <div className="surface p-4"><p className="text-[11px] text-muted">Activas</p><p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-ink">{active}</p></div>
        <div className="surface p-4"><p className="text-[11px] text-muted">Aceptadas</p><p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-emerald">{accepted}</p></div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" aria-label="Filtrar postulaciones por estado">
          {[
            { value: '', label: 'Todas' },
            { value: 'submitted', label: 'Enviadas' },
            { value: 'reviewing', label: 'En revisión' },
            { value: 'accepted', label: 'Aceptadas' },
            { value: 'rejected', label: 'No seleccionadas' },
            { value: 'withdrawn', label: 'Retiradas' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition focus-ring',
                filter === option.value ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-soft hover:border-line-strong',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <DemoNotice compact className="max-w-sm">Los estados se actualizan desde el panel de la empresa correspondiente.</DemoNotice>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={filter ? 'No hay postulaciones en este estado' : 'Aún no te has postulado a un reto'}
          description={filter ? 'Prueba con otro filtro o revisa todos tus retos.' : 'Explora los retos abiertos, elige uno que te interese y envía tu postulación. Después podrás agregar entregables.'}
          action={<Link to="/retos" className={buttonStyles('primary', 'sm')}>Ver retos abiertos</Link>}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((application) => {
            const canManage = application.status !== 'withdrawn';
            return (
              <article key={application.id} className="surface p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold', applicationStatusClass[application.status])}>{applicationStatusLabels[application.status]}</span>
                      <Badge tone="slate">{application.challenge.category}</Badge>
                      {application.challenge.status === 'closed' && <Badge tone="amber">Reto cerrado</Badge>}
                    </div>
                    <h2 className="mt-2 text-[16px] font-semibold tracking-[-0.02em] text-ink">
                      <Link to={`/retos/${application.challenge.slug}`} className="rounded transition hover:text-electric focus-ring">{application.challenge.title}</Link>
                    </h2>
                    <p className="mt-1 text-[11.5px] text-muted">{application.company.name} · Postulada {formatDate(application.createdAt)}</p>
                    <p className="mt-1 flex items-center gap-1 text-[10.5px] text-muted"><CalendarBlank size={11} aria-hidden="true" /> Fecha límite del reto: {formatDate(application.challenge.deadline)}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link to={`/retos/${application.challenge.slug}`} className={buttonStyles('secondary', 'sm')}>Ver reto</Link>
                    {canManage && <Button variant="soft" size="sm" onClick={() => setDeliverableTarget(application)} icon={<LinkSimple size={13} />}>Entregable</Button>}
                  </div>
                </div>

                {application.message && (
                  <div className="mt-4 rounded-xl border border-line bg-paper px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Tu mensaje</p>
                    <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-ink-soft">{application.message}</p>
                  </div>
                )}

                <div className="mt-4 border-t border-line pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-1.5 text-[12px] font-semibold text-ink"><FileText size={14} className="text-electric" aria-hidden="true" /> Entregables ({application.deliverables.length})</h3>
                    {canManage && <button type="button" onClick={() => setDeliverableTarget(application)} className="rounded text-[10.5px] font-semibold text-electric hover:underline focus-ring">Agregar enlace</button>}
                  </div>
                  {application.deliverables.length === 0 ? (
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">Aún no hay entregables. Puedes registrar enlaces a repositorios, documentos o prototipos.</p>
                  ) : (
                    <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
                      {application.deliverables.map((deliverable) => (
                        <li key={deliverable.id} className="rounded-lg border border-line bg-white px-3 py-2">
                          <p className="truncate text-[11.5px] font-medium text-ink">{deliverable.title}</p>
                          <a href={deliverable.url} target="_blank" rel="noreferrer noopener" className="mt-0.5 block truncate text-[10.5px] text-electric hover:underline">{deliverable.url}</a>
                          {deliverable.notes && <p className="mt-0.5 text-[10px] text-muted">{deliverable.notes}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {canManage && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                    <span className="flex items-center gap-1 text-[10.5px] text-muted"><Clock size={11} aria-hidden="true" /> Actualizada {formatDate(application.updatedAt)}</span>
                    <button type="button" onClick={() => setWithdrawTarget(application)} className="ml-auto inline-flex items-center gap-1 rounded text-[10.5px] font-medium text-rose hover:underline focus-ring"><XCircle size={12} aria-hidden="true" /> Retirar postulación</button>
                  </div>
                )}
                {application.status === 'accepted' && (
                  <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-emerald/[0.05] px-3 py-2 text-[11px] leading-relaxed text-emerald"><CheckCircle size={14} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" /> La empresa marcó tu postulación como aceptada. Revisa tus notificaciones para más contexto.</p>
                )}
              </article>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-muted">{plural(list.length, 'postulación registrada', 'postulaciones registradas')} en tu cuenta. Las empresas del catálogo son ficticias.</p>

      <Modal
        open={Boolean(deliverableTarget)}
        onClose={() => setDeliverableTarget(null)}
        title="Agregar entregable"
        description={deliverableTarget ? `Para “${deliverableTarget.challenge.title}”.` : undefined}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeliverableTarget(null)} disabled={saving}>Cancelar</Button>
            <Button size="sm" onClick={addDeliverable} loading={saving}>Guardar entregable</Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div>
            <label htmlFor="my-deliverable-title" className="mb-1.5 block text-[13px] font-semibold text-ink">Título</label>
            <Input id="my-deliverable-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Ejemplo: Documento de propuesta" />
          </div>
          <div>
            <label htmlFor="my-deliverable-url" className="mb-1.5 block text-[13px] font-semibold text-ink">Enlace</label>
            <Input id="my-deliverable-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} maxLength={500} placeholder="https://…" />
          </div>
          <div>
            <label htmlFor="my-deliverable-notes" className="mb-1.5 block text-[13px] font-semibold text-ink">Notas (opcional)</label>
            <textarea id="my-deliverable-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={1000} placeholder="Describe qué contiene el enlace." className="w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-electric focus:outline-none focus:ring-4 focus:ring-electric/10" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(withdrawTarget)}
        onClose={() => setWithdrawTarget(null)}
        onConfirm={withdraw}
        title="Retirar postulación"
        description={`Se retirará tu postulación a “${withdrawTarget?.challenge.title || ''}”. La empresa recibirá una notificación y no podrás volver a postularte a este reto.`}
        confirmLabel="Retirar"
        loading={withdrawing}
      />
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowSquareOut,
  CheckCircle,
  EnvelopeSimple,
  Eye,
  FileText,
  Funnel,
  LinkedinLogo,
  MagnifyingGlass,
  PaperPlaneTilt,
  UsersThree,
  X,
  XCircle,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/lib/toast';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Select, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { applicationStatusClass, applicationStatusLabels, formatDateTime, relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { CompanyApplication } from '@/lib/types';

type StatusFilter = 'all' | CompanyApplication['status'];
type CompanyStatus = 'submitted' | 'reviewing' | 'accepted' | 'rejected';

export default function EmpresaPostulaciones() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsyncData(
    () => api.get<{ items: CompanyApplication[] }>('/company/applications'),
    [],
  );
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [challengeId, setChallengeId] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const applications = data?.items || [];
  const selected = applications.find((application) => application.id === openId) || null;

  const challenges = useMemo(() => {
    const map = new Map<string, string>();
    for (const application of applications) {
      if (application.challenge) map.set(application.challenge.id, application.challenge.title);
    }
    return [...map.entries()].map(([id, title]) => ({ id, title }));
  }, [applications]);

  const totals = useMemo(
    () => ({
      total: applications.length,
      submitted: applications.filter((application) => application.status === 'submitted').length,
      reviewing: applications.filter((application) => application.status === 'reviewing').length,
      accepted: applications.filter((application) => application.status === 'accepted').length,
    }),
    [applications],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return applications.filter((application) => {
      if (status !== 'all' && application.status !== status) return false;
      if (challengeId && application.challenge?.id !== challengeId) return false;
      if (!term) return true;
      return [
        application.student.name,
        application.student.email,
        application.student.careerName || '',
        application.challenge?.title || '',
        application.message || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [applications, challengeId, q, status]);

  async function changeStatus(application: CompanyApplication, next: CompanyStatus) {
    setBusyId(application.id);
    try {
      await api.patch(`/company/applications/${application.id}`, { status: next });
      toast.success('Estado de la postulación actualizado. El estudiante recibió una notificación.');
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos actualizar la postulación.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <PageLoader label="Cargando postulaciones…" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Postulaciones"
        description="Revisa los perfiles que aplicaron a tus retos, consulta sus entregables y actualiza el estado del proceso. Cada cambio notifica al estudiante."
        actions={<Link to="/empresa/retos" className={buttonStyles('secondary', 'md')}>Gestionar retos</Link>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de postulaciones">
        <StatCard label="Total recibidas" value={totals.total} hint="Todos tus retos" icon={<UsersThree size={18} />} />
        <StatCard label="Sin revisar" value={totals.submitted} hint="Estado enviada" icon={<PaperPlaneTilt size={18} />} tone="violet" />
        <StatCard label="En revisión" value={totals.reviewing} hint="En conversación" icon={<Eye size={18} />} tone="amber" />
        <StatCard label="Aceptadas" value={totals.accepted} hint="Estudiantes seleccionados" icon={<CheckCircle size={18} />} tone="emerald" />
      </section>

      <section className="surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar por estudiante, correo, carrera o reto…"
              aria-label="Buscar postulaciones"
              className={cn(inputClass, 'pl-9')}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select
              aria-label="Filtrar por estado"
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              className="sm:w-40"
            >
              <option value="all">Todos los estados</option>
              <option value="submitted">Enviadas</option>
              <option value="reviewing">En revisión</option>
              <option value="accepted">Aceptadas</option>
              <option value="rejected">No seleccionadas</option>
              <option value="withdrawn">Retiradas</option>
            </Select>
            <Select
              aria-label="Filtrar por reto"
              value={challengeId}
              onChange={(event) => setChallengeId(event.target.value)}
              className="sm:w-52"
            >
              <option value="">Todos los retos</option>
              {challenges.map((challenge) => (
                <option key={challenge.id} value={challenge.id}>{challenge.title}</option>
              ))}
            </Select>
            {(q || status !== 'all' || challengeId) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQ('');
                  setStatus('all');
                  setChallengeId('');
                }}
                icon={<X size={13} />}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Funnel}
          title={applications.length === 0 ? 'Aún no hay postulaciones' : 'Ninguna postulación coincide'}
          description={
            applications.length === 0
              ? 'Cuando los estudiantes se postulen a tus retos abiertos, aparecerán aquí con su perfil, mensaje y entregables.'
              : 'Ajusta la búsqueda o los filtros para ver otros resultados.'
          }
          action={
            applications.length === 0 ? (
              <Link to="/empresa/retos" className={buttonStyles('primary', 'sm')}>Revisar mis retos</Link>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => { setQ(''); setStatus('all'); setChallengeId(''); }}>Quitar filtros</Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted">{filtered.length} de {applications.length} postulaciones</p>
            <span className="text-[10px] text-muted">Las más recientes primero</span>
          </div>

          <ul className="space-y-3">
            {filtered.map((application) => (
              <li key={application.id} className="surface p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-electric/8 text-[14px] font-semibold text-electric" aria-hidden="true">
                      {application.student.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-semibold text-ink">{application.student.name}</p>
                        <span className={cn('rounded-full border px-2 py-0.5 text-[9.5px] font-semibold', applicationStatusClass[application.status])}>
                          {applicationStatusLabels[application.status]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-muted">
                        {application.student.careerName || 'Sin carrera declarada'}
                        {application.student.semester ? ` · Semestre ${application.student.semester}` : ''}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink-soft">
                        <span className="text-muted">Reto:</span> {application.challenge?.title || 'Reto no disponible'}
                        {application.challenge?.isDemo && <Badge tone="amber">Demo</Badge>}
                      </p>
                      <p className="mt-1 text-[10.5px] text-muted">{relativeTime(application.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button variant="secondary" size="sm" onClick={() => setOpenId(application.id)} icon={<Eye size={14} aria-hidden="true" />}>
                      Ver detalle
                    </Button>
                    {application.status !== 'withdrawn' && (
                      <Select
                        aria-label={`Cambiar estado de la postulación de ${application.student.name}`}
                        value={application.status}
                        disabled={busyId === application.id}
                        onChange={(event) => changeStatus(application, event.target.value as CompanyStatus)}
                        className="h-9 w-40 py-0 text-[12px]"
                      >
                        <option value="submitted">Enviada</option>
                        <option value="reviewing">En revisión</option>
                        <option value="accepted">Aceptada</option>
                        <option value="rejected">No seleccionada</option>
                      </Select>
                    )}
                  </div>
                </div>

                {application.message && (
                  <p className="mt-3 line-clamp-2 rounded-xl bg-paper/60 px-3 py-2 text-[11.5px] leading-relaxed text-ink-soft">
                    “{application.message}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setOpenId(null)}
        title={selected ? `Postulación de ${selected.student.name}` : 'Postulación'}
        description={selected?.challenge?.title}
        size="lg"
        footer={
          selected && selected.status !== 'withdrawn' ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setOpenId(null)}>Cerrar</Button>
              <Button
                variant="danger"
                size="sm"
                loading={busyId === selected.id}
                onClick={() => changeStatus(selected, 'rejected')}
                icon={<XCircle size={14} aria-hidden="true" />}
              >
                No seleccionar
              </Button>
              {selected.status !== 'reviewing' && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={busyId === selected.id}
                  onClick={() => changeStatus(selected, 'reviewing')}
                >
                  Marcar en revisión
                </Button>
              )}
              {selected.status !== 'accepted' && (
                <Button
                  variant="success"
                  size="sm"
                  loading={busyId === selected.id}
                  onClick={() => changeStatus(selected, 'accepted')}
                  icon={<CheckCircle size={14} aria-hidden="true" />}
                >
                  Aceptar
                </Button>
              )}
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setOpenId(null)}>Cerrar</Button>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold', applicationStatusClass[selected.status])}>
                {applicationStatusLabels[selected.status]}
              </span>
              <Badge tone="slate">{formatDateTime(selected.createdAt)}</Badge>
              {selected.updatedAt && <Badge tone="slate">Actualizada {relativeTime(selected.updatedAt)}</Badge>}
            </div>

            <dl className="grid gap-3 rounded-2xl border border-line bg-paper/40 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">Correo</dt>
                <dd className="mt-1">
                  <a href={`mailto:${selected.student.email}`} className="inline-flex items-center gap-1.5 break-all text-[12px] font-medium text-electric hover:underline focus-ring">
                    <EnvelopeSimple size={13} aria-hidden="true" /> {selected.student.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">Carrera y semestre</dt>
                <dd className="mt-1 text-[12px] text-ink-soft">
                  {selected.student.careerName || 'Sin carrera'}
                  {selected.student.semester ? ` · Semestre ${selected.student.semester}` : ''}
                </dd>
              </div>
              {selected.student.headline && (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">Titular</dt>
                  <dd className="mt-1 text-[12px] text-ink-soft">{selected.student.headline}</dd>
                </div>
              )}
              {selected.student.bio && (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">Sobre el estudiante</dt>
                  <dd className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-ink-soft">{selected.student.bio}</dd>
                </div>
              )}
              {selected.student.linkedin && (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">LinkedIn</dt>
                  <dd className="mt-1">
                    <a href={selected.student.linkedin} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 break-all text-[12px] font-medium text-electric hover:underline focus-ring">
                      <LinkedinLogo size={13} aria-hidden="true" /> Ver perfil profesional
                      <ArrowSquareOut size={11} aria-hidden="true" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            <section aria-labelledby="mensaje-title">
              <h3 id="mensaje-title" className="text-[11px] font-semibold uppercase tracking-wider text-muted">Mensaje de postulación</h3>
              <p className="mt-1.5 whitespace-pre-line rounded-2xl border border-line bg-white px-4 py-3 text-[12.5px] leading-relaxed text-ink-soft">
                {selected.message || 'El estudiante no incluyó un mensaje adicional.'}
              </p>
            </section>

            <section aria-labelledby="entregables-title">
              <h3 id="entregables-title" className="text-[11px] font-semibold uppercase tracking-wider text-muted">Entregables registrados</h3>
              {selected.deliverables.length === 0 ? (
                <p className="mt-1.5 rounded-xl border border-dashed border-line bg-paper/40 px-4 py-4 text-[11.5px] text-muted">
                  Todavía no hay entregables. El estudiante puede añadirlos desde “Mis retos”.
                </p>
              ) : (
                <ul className="mt-1.5 divide-y divide-line rounded-2xl border border-line bg-white">
                  {selected.deliverables.map((deliverable) => (
                    <li key={deliverable.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                      <div className="flex min-w-0 items-start gap-2">
                        <FileText size={15} className="mt-0.5 shrink-0 text-electric" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-ink">{deliverable.title}</p>
                          {deliverable.notes && <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">{deliverable.notes}</p>}
                        </div>
                      </div>
                      <a
                        href={deliverable.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 rounded text-[10.5px] font-semibold text-electric hover:underline focus-ring"
                      >
                        Abrir enlace <ArrowSquareOut size={11} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <p className="text-[10.5px] leading-relaxed text-muted">
              Al cambiar el estado, el estudiante recibe una notificación en su panel. La decisión final y el contacto posterior son responsabilidad de la empresa.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

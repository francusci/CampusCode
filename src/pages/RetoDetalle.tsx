import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Buildings,
  CalendarBlank,
  CheckCircle,
  Clock,
  FileText,
  LinkSimple,
  PaperPlaneTilt,
  ShieldCheck,
  Sparkle,
  Trophy,
  UsersThree,
  WarningCircle,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Avatar } from '@/components/ui/Avatar';
import { Markdown } from '@/components/ui/Markdown';
import { DemoNotice } from '@/components/common/DemoNotice';
import { applicationStatusClass, applicationStatusLabels, daysUntil, formatDate, relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Application, Challenge, Deliverable } from '@/lib/types';

interface LocalApplication {
  id: string;
  status: Application['status'];
  message: string | null;
  createdAt: string;
  updatedAt: string;
  deliverables: Deliverable[];
}

interface ChallengeDetail {
  challenge: Challenge;
  application: LocalApplication | null;
  applicationsCount?: number;
  isPastDeadline: boolean;
  demoNotice: string;
}

const logoColors: Record<string, string> = {
  blue: 'bg-[#dbe7ff] text-[#1d4ed8]',
  emerald: 'bg-[#d9f7eb] text-[#087f5b]',
  rose: 'bg-[#ffe4ea] text-[#9f1239]',
  violet: 'bg-[#ece7ff] text-[#6d28d9]',
  amber: 'bg-[#fdf0d5] text-[#92400e]',
  cyan: 'bg-[#d9f4fa] text-[#0e7490]',
};

export default function RetoDetalle() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const { data, loading, error, reload } = useAsyncData(
    () => api.get<ChallengeDetail>(`/challenges/${slug}`),
    [slug],
  );

  const [localApplication, setLocalApplication] = useState<LocalApplication | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [deliverableOpen, setDeliverableOpen] = useState(false);
  const [deliverableTitle, setDeliverableTitle] = useState('');
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [deliverableNotes, setDeliverableNotes] = useState('');
  const [savingDeliverable, setSavingDeliverable] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    setLocalApplication(null);
  }, [data]);

  if (loading) return <PageLoader label="Cargando reto…" />;
  if (error) {
    return (
      <div className="container-page py-16">
        <ErrorState message={error.message} onRetry={reload} />
        <div className="mt-5 text-center"><Link to="/retos" className={buttonStyles('secondary', 'md')}>Volver a los retos</Link></div>
      </div>
    );
  }
  if (!data) return null;

  const { challenge } = data;
  const application = localApplication ?? data.application;
  const remaining = daysUntil(challenge.deadline);
  const isClosed = challenge.status === 'closed' || data.isPastDeadline || remaining < 0;
  const isStudent = user?.role === 'student';
  const canManage = Boolean(application && application.status !== 'withdrawn' && isStudent);

  async function submitApplication() {
    setApplying(true);
    try {
      const response = await api.post<{ application: { id: string; status: Application['status']; message: string | null }; message: string }>(
        `/challenges/${challenge.id}/applications`,
        { message: message.trim() || undefined },
      );
      setLocalApplication({
        id: response.application.id,
        status: response.application.status,
        message: response.application.message,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        deliverables: [],
      });
      setApplyOpen(false);
      setMessage('');
      toast.success(response.message);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos registrar tu postulación.');
    } finally {
      setApplying(false);
    }
  }

  async function addDeliverable() {
    if (!application) return;
    if (deliverableTitle.trim().length < 3) {
      toast.error('El título debe tener al menos 3 caracteres.');
      return;
    }
    if (!/^https?:\/\/[^\s]+$/i.test(deliverableUrl.trim())) {
      toast.error('El enlace debe comenzar por http:// o https://.');
      return;
    }
    setSavingDeliverable(true);
    try {
      const response = await api.post<{ id: string; message: string }>(`/applications/${application.id}/deliverables`, {
        title: deliverableTitle.trim(),
        url: deliverableUrl.trim(),
        notes: deliverableNotes.trim() || undefined,
      });
      setLocalApplication({
        ...application,
        deliverables: [
          {
            id: response.id,
            title: deliverableTitle.trim(),
            url: deliverableUrl.trim(),
            notes: deliverableNotes.trim() || null,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          },
          ...application.deliverables,
        ],
      });
      setDeliverableOpen(false);
      setDeliverableTitle('');
      setDeliverableUrl('');
      setDeliverableNotes('');
      toast.success(response.message);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos registrar el entregable.');
    } finally {
      setSavingDeliverable(false);
    }
  }

  async function withdrawApplication() {
    if (!application) return;
    setWithdrawing(true);
    try {
      await api.post(`/applications/${application.id}/withdraw`);
      setLocalApplication({ ...application, status: 'withdrawn' });
      setWithdrawOpen(false);
      toast.success('Postulación retirada.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos retirar la postulación.');
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div>
      <section className="border-b border-line bg-white">
        <div className="container-page py-8 sm:py-12">
          <PageHeader
            breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Retos', to: '/retos' }, { label: challenge.company.name }]}
            title={challenge.title}
            description={challenge.summary}
            actions={
              <Link to="/retos" className={buttonStyles('ghost', 'sm')}>
                <ArrowLeft size={14} aria-hidden="true" /> Todos los retos
              </Link>
            }
          />
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge tone="slate">{challenge.category}</Badge>
            {challenge.featured && <Badge tone="violet">Destacado</Badge>}
            <Badge tone={isClosed ? 'slate' : 'emerald'} dot>{isClosed ? 'Cerrado' : 'Abierto'}</Badge>
            <Badge tone={remaining < 0 ? 'rose' : remaining <= 7 ? 'amber' : 'blue'}>
              <CalendarBlank size={11} aria-hidden="true" /> {remaining < 0 ? 'Fecha límite vencida' : `${remaining} días restantes`}
            </Badge>
            {challenge.isDemo && <Badge tone="amber">Reto de ejemplo</Badge>}
          </div>
        </div>
      </section>

      <div className="container-page py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-5">
            <article className="surface p-5 sm:p-7">
              <h2 className="text-lg font-semibold text-ink">Contexto del reto</h2>
              <div className="mt-3 text-[13.5px] leading-relaxed text-ink-soft">
                <Markdown content={challenge.description} />
              </div>

              <div className="mt-7 border-t border-line pt-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                  <WarningCircle size={19} className="text-amber" aria-hidden="true" /> El problema
                </h2>
                <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-soft">{challenge.problem}</p>
              </div>

              <div className="mt-7 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <FileText size={16} className="text-electric" aria-hidden="true" /> Entregables esperados
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">{challenge.deliverables}</p>
                </div>
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <ShieldCheck size={16} className="text-emerald" aria-hidden="true" /> Requisitos
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">{challenge.requirements}</p>
                </div>
              </div>

              {challenge.skills.length > 0 && (
                <div className="mt-7 border-t border-line pt-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Habilidades que practicarás</h2>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {challenge.skills.map((skill) => <Badge key={skill} tone="blue">{skill}</Badge>)}
                  </div>
                </div>
              )}
            </article>

            {application && (
              <article className="surface p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">Tu postulación</h2>
                    <p className="mt-1 text-xs text-muted">Enviada {relativeTime(application.createdAt)} · {formatDate(application.createdAt)}</p>
                  </div>
                  <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', applicationStatusClass[application.status])}>
                    {applicationStatusLabels[application.status]}
                  </span>
                </div>

                {application.message && (
                  <div className="mt-4 rounded-xl border border-line bg-paper p-4">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Tu mensaje</p>
                    <p className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-ink-soft">{application.message}</p>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ink">Entregables registrados</h3>
                  {canManage && <Button size="sm" variant="soft" onClick={() => setDeliverableOpen(true)} icon={<LinkSimple size={14} />}>Agregar entregable</Button>}
                </div>

                {application.deliverables.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-dashed border-line-strong bg-paper/60 px-4 py-6 text-center">
                    <LinkSimple size={22} className="mx-auto text-muted/70" aria-hidden="true" />
                    <p className="mt-2 text-xs text-muted">Aún no has registrado entregables. Puedes agregar enlaces a repositorios, documentos o prototipos.</p>
                  </div>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {application.deliverables.map((deliverable) => (
                      <li key={deliverable.id} className="flex flex-col gap-1 rounded-xl border border-line bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-ink">{deliverable.title}</p>
                          <a href={deliverable.url} target="_blank" rel="noreferrer noopener" className="mt-0.5 block truncate text-[11px] text-electric hover:underline">{deliverable.url}</a>
                          {deliverable.notes && <p className="mt-1 text-[11px] leading-relaxed text-muted">{deliverable.notes}</p>}
                        </div>
                        <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-wider text-muted">{formatDate(deliverable.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {canManage && (
                  <div className="mt-5 border-t border-line pt-4">
                    <button type="button" onClick={() => setWithdrawOpen(true)} className="rounded text-xs font-semibold text-rose hover:underline focus-ring">
                      Retirar mi postulación
                    </button>
                    <p className="mt-1 text-[10.5px] text-muted">Puedes retirarte mientras el proceso siga abierto. La empresa recibirá una notificación.</p>
                  </div>
                )}
              </article>
            )}

            <DemoNotice>{data.demoNotice}</DemoNotice>
          </div>

          <aside className="space-y-4">
            <div className="surface p-5">
              <div className="flex items-start gap-3">
                <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold', logoColors[challenge.company.logoColor] || logoColors.blue)}>
                  {challenge.company.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{challenge.company.name}</p>
                  <p className="text-[11px] text-muted">{challenge.company.sector}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {challenge.company.verified && <Badge tone="emerald">Verificada</Badge>}
                    {challenge.company.isDemo && <Badge tone="amber">Empresa demo</Badge>}
                  </div>
                </div>
              </div>
              <dl className="mt-4 space-y-2 border-t border-line pt-3 text-[11.5px]">
                <div className="flex justify-between gap-3"><dt className="text-muted">Publicado</dt><dd className="font-medium text-ink">{formatDate(challenge.publishedAt)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Fecha límite</dt><dd className="font-medium text-ink">{formatDate(challenge.deadline)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Categoría</dt><dd className="font-medium text-ink">{challenge.category}</dd></div>
                {typeof data.applicationsCount === 'number' && (
                  <div className="flex justify-between gap-3"><dt className="text-muted">Postulaciones</dt><dd className="font-medium text-ink">{data.applicationsCount}</dd></div>
                )}
              </dl>
            </div>

            <div className="surface p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Trophy size={16} className="text-violet" aria-hidden="true" /> Participar</h2>
              {!user ? (
                <>
                  <p className="mt-2 text-xs leading-relaxed text-muted">Inicia sesión con tu cuenta de estudiante para postularte y registrar entregables.</p>
                  <Link to="/login" state={{ from: location.pathname }} className={buttonStyles('primary', 'sm', 'mt-3 w-full')}>Iniciar sesión</Link>
                  <Link to="/registro" className={buttonStyles('secondary', 'sm', 'mt-2 w-full')}>Crear cuenta</Link>
                </>
              ) : !isStudent ? (
                <>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    Estás en una cuenta de {user.role === 'company' ? 'empresa' : 'administración'}. Solo las cuentas de estudiante pueden postularse a retos.
                  </p>
                  {user.role === 'company' && <Link to="/empresa/retos" className={buttonStyles('secondary', 'sm', 'mt-3 w-full')}>Ir a mis retos</Link>}
                </>
              ) : application ? (
                <>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald"><CheckCircle size={14} weight="fill" aria-hidden="true" /> Ya tienes una postulación registrada.</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">Consulta el estado y agrega entregables desde esta página o desde Mis retos.</p>
                  <Link to="/mis-retos" className={buttonStyles('secondary', 'sm', 'mt-3 w-full')}>Ver mis retos</Link>
                </>
              ) : isClosed ? (
                <>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted"><Clock size={14} aria-hidden="true" /> Este reto ya no recibe postulaciones.</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">Puedes explorar otros retos abiertos y guardar este como referencia.</p>
                  <Link to="/retos" className={buttonStyles('secondary', 'sm', 'mt-3 w-full')}>Ver retos abiertos</Link>
                </>
              ) : (
                <>
                  <p className="mt-2 text-xs leading-relaxed text-muted">Postúlate con un mensaje breve sobre tu interés y cómo abordarías el problema. Después podrás agregar entregables.</p>
                  <Button className="mt-3 w-full" size="sm" onClick={() => setApplyOpen(true)} icon={<PaperPlaneTilt size={15} />}>Postularme al reto</Button>
                  <p className="mt-2 text-[10px] leading-relaxed text-muted">Una postulación por estudiante. Podrás retirarla antes de que cierre el reto.</p>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-electric/15 bg-[#edf3ff] p-5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white text-electric shadow-sm"><Sparkle size={18} weight="duotone" aria-hidden="true" /></span>
              <h2 className="mt-3 text-sm font-semibold text-ink">Prepara tu postulación</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                Repasa los temas relacionados en el banco de ejercicios y usa el asistente para estructurar tu propuesta.
              </p>
              <div className="mt-3 flex gap-2">
                <Link to="/ejercicios" className="text-xs font-semibold text-electric hover:underline">Practicar</Link>
                <span className="text-muted" aria-hidden="true">·</span>
                <Link to="/asistente" className="text-xs font-semibold text-electric hover:underline">Asistente</Link>
              </div>
            </div>

            <div className="surface p-4">
              <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted"><UsersThree size={13} aria-hidden="true" /> Cómo se evalúa</h2>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                La empresa revisa tu perfil, tu mensaje y los entregables. El estado cambia a “en revisión”, “aceptada” o “no seleccionada”; recibirás una notificación.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title="Postularte a este reto"
        description="Cuéntale a la empresa por qué te interesa y cómo piensas abordar el problema."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setApplyOpen(false)} disabled={applying}>Cancelar</Button>
            <Button size="sm" onClick={submitApplication} loading={applying} icon={<PaperPlaneTilt size={14} />}>Enviar postulación</Button>
          </>
        }
      >
        <label htmlFor="application-message" className="mb-1.5 block text-[13px] font-semibold text-ink">Mensaje (opcional)</label>
        <textarea
          id="application-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          maxLength={1200}
          placeholder="Ejemplo: Me interesa este reto porque… Mi enfoque inicial sería…"
          className="w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-electric focus:outline-none focus:ring-4 focus:ring-electric/10"
        />
        <p className="mt-1.5 text-[11px] text-muted">{message.length}/1200 caracteres. Tu perfil académico se comparte con la empresa junto con la postulación.</p>
      </Modal>

      <Modal
        open={deliverableOpen}
        onClose={() => setDeliverableOpen(false)}
        title="Agregar entregable"
        description="Registra un enlace a tu repositorio, documento, prototipo o presentación."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeliverableOpen(false)} disabled={savingDeliverable}>Cancelar</Button>
            <Button size="sm" onClick={addDeliverable} loading={savingDeliverable}>Guardar entregable</Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div>
            <label htmlFor="deliverable-title" className="mb-1.5 block text-[13px] font-semibold text-ink">Título</label>
            <input id="deliverable-title" value={deliverableTitle} onChange={(event) => setDeliverableTitle(event.target.value)} maxLength={120} placeholder="Ejemplo: Repositorio del prototipo" className="w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-electric focus:outline-none focus:ring-4 focus:ring-electric/10" />
          </div>
          <div>
            <label htmlFor="deliverable-url" className="mb-1.5 block text-[13px] font-semibold text-ink">Enlace</label>
            <input id="deliverable-url" type="url" value={deliverableUrl} onChange={(event) => setDeliverableUrl(event.target.value)} maxLength={500} placeholder="https://github.com/…" className="w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-electric focus:outline-none focus:ring-4 focus:ring-electric/10" />
          </div>
          <div>
            <label htmlFor="deliverable-notes" className="mb-1.5 block text-[13px] font-semibold text-ink">Notas (opcional)</label>
            <textarea id="deliverable-notes" value={deliverableNotes} onChange={(event) => setDeliverableNotes(event.target.value)} rows={3} maxLength={1000} placeholder="Qué incluye y cómo revisarlo." className="w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-electric focus:outline-none focus:ring-4 focus:ring-electric/10" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={withdrawApplication}
        title="Retirar postulación"
        description={`Tu postulación a “${challenge.title}” quedará retirada. La empresa verá el cambio y no podrás volver a postularte a este mismo reto.`}
        confirmLabel="Retirar"
        loading={withdrawing}
      />

      {!user && (
        <div className="fixed inset-x-4 bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3 shadow-lift sm:hidden">
          <div className="flex items-center gap-2">
            <Avatar name="CampusCode" color="blue" size="xs" />
            <p className="text-[11px] leading-tight text-ink-soft">Inicia sesión para postularte</p>
          </div>
          <Link to="/login" state={{ from: location.pathname }} className={buttonStyles('primary', 'sm')}>Entrar <ArrowRight size={12} aria-hidden="true" /></Link>
        </div>
      )}

      {application?.status === 'withdrawn' && (
        <div className="container-page pb-8">
          <EmptyState
            icon={Buildings}
            title="Postulación retirada"
            description="Ya no participas en este reto. Puedes explorar otros desafíos abiertos y postularte cuando estés listo."
            action={<Link to="/retos" className={buttonStyles('primary', 'sm')}>Explorar retos</Link>}
          />
        </div>
      )}
    </div>
  );
}

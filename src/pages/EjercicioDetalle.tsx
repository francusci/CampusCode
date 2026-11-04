import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookmarkSimple,
  CheckCircle,
  Clock,
  Code,
  Eye,
  Flag,
  Lightbulb,
  ListChecks,
  Sparkle,
  TextAlignLeft,
  XCircle,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Markdown } from '@/components/ui/Markdown';
import { PageLoader } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { ExerciseCard } from '@/components/common/ExerciseCard';
import { DemoNotice } from '@/components/common/DemoNotice';
import { difficultyLabels, formatDate, typeLabels } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Exercise } from '@/lib/types';

interface ExerciseDetail {
  exercise: Exercise;
  related: Exercise[];
}

const typeIcon = { multiple: ListChecks, abierta: TextAlignLeft, codigo: Code };

export default function EjercicioDetalle() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsyncData(
    () => api.get<ExerciseDetail>(`/exercises/${id}`),
    [id],
  );

  const [answer, setAnswer] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  if (loading) return <PageLoader label="Cargando ejercicio…" />;
  if (error) {
    return (
      <div className="container-page py-16">
        <ErrorState message={error.message} onRetry={reload} />
        <div className="mt-5 text-center"><Link to="/ejercicios" className={buttonStyles('secondary', 'md')}>Volver al banco de ejercicios</Link></div>
      </div>
    );
  }
  if (!data) return null;

  const { exercise, related } = data;
  const TypeIcon = typeIcon[exercise.type];
  const solved = exercise.userState.status === 'completed';
  const hasAttempted = exercise.userState.attempts > 0 || Boolean(result);

  function updateExercise(patch: Partial<Exercise>) {
    setData((current) => (current ? { ...current, exercise: { ...current.exercise, ...patch } } : current));
  }

  async function handleCheck() {
    if (!answer.trim()) {
      toast.error('Escribe o selecciona una respuesta antes de comprobar.');
      return;
    }
    setChecking(true);
    try {
      const response = await api.post<{ correct: boolean; message: string }>(`/exercises/${exercise.id}/check`, { answer });
      setResult(response);
      updateExercise({
        userState: {
          ...exercise.userState,
          status: response.correct ? 'completed' : 'in_progress',
          attempts: exercise.userState.attempts + 1,
        },
      });
      if (response.correct) {
        setShowSolution(true);
        toast.success('¡Respuesta correcta! Revisa el procedimiento para consolidar.');
      } else {
        setShowHint(true);
      }
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos comprobar la respuesta.');
    } finally {
      setChecking(false);
    }
  }

  async function toggleFavorite() {
    if (!user) {
      toast.info('Inicia sesión para guardar ejercicios en favoritos.');
      return;
    }
    setFavoriteBusy(true);
    try {
      const response = await api.post<{ favorite: boolean }>(`/exercises/${exercise.id}/favorite`);
      updateExercise({ userState: { ...exercise.userState, isFavorite: response.favorite } });
      toast.success(response.favorite ? 'Ejercicio guardado.' : 'Ejercicio eliminado de favoritos.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos actualizar el favorito.');
    } finally {
      setFavoriteBusy(false);
    }
  }

  async function markComplete() {
    if (!user) {
      toast.info('Inicia sesión para registrar el progreso.');
      return;
    }
    setCompleting(true);
    try {
      await api.post(`/exercises/${exercise.id}/complete`);
      updateExercise({ userState: { ...exercise.userState, status: 'completed' } });
      toast.success('Ejercicio marcado como completado.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos actualizar el progreso.');
    } finally {
      setCompleting(false);
    }
  }

  async function submitReport() {
    if (reportReason.trim().length < 10) {
      toast.error('Describe el motivo con al menos 10 caracteres.');
      return;
    }
    setReporting(true);
    try {
      await api.post('/reports', { targetType: 'exercise', targetId: exercise.id, reason: reportReason.trim() });
      toast.success('Reporte enviado. El equipo administrador lo revisará.');
      setReportOpen(false);
      setReportReason('');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos enviar el reporte.');
    } finally {
      setReporting(false);
    }
  }

  return (
    <div>
      <section className="border-b border-line bg-white">
        <div className="container-page py-8 sm:py-10">
          <PageHeader
            breadcrumb={[
              { label: 'Inicio', to: '/' },
              { label: 'Ejercicios', to: '/ejercicios' },
              { label: exercise.subject.name, to: `/catalogo/${exercise.subject.id}` },
              { label: 'Práctica' },
            ]}
            title={exercise.title}
            description={`${exercise.subject.name} · ${exercise.topic.name} · ${exercise.career.name}`}
            actions={
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={exercise.userState.isFavorite ? 'soft' : 'secondary'}
                  size="sm"
                  onClick={toggleFavorite}
                  loading={favoriteBusy}
                  icon={<BookmarkSimple size={15} weight={exercise.userState.isFavorite ? 'fill' : 'regular'} />}
                  aria-pressed={exercise.userState.isFavorite}
                >
                  {exercise.userState.isFavorite ? 'Guardado' : 'Guardar'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setReportOpen(true)} icon={<Flag size={14} />}>
                  Reportar
                </Button>
              </div>
            }
          />
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge tone={exercise.difficulty === 'basico' ? 'emerald' : exercise.difficulty === 'intermedio' ? 'amber' : 'rose'}>
              {difficultyLabels[exercise.difficulty]}
            </Badge>
            <Badge tone="slate"><TypeIcon size={11} aria-hidden="true" /> {typeLabels[exercise.type]}</Badge>
            <Badge tone="blue">{exercise.userState.attempts} {exercise.userState.attempts === 1 ? 'intento' : 'intentos'}</Badge>
            {solved && <Badge tone="emerald"><CheckCircle size={11} weight="fill" aria-hidden="true" /> Completado</Badge>}
            {exercise.isDemo && <Badge tone="amber">Ejercicio de ejemplo</Badge>}
          </div>
        </div>
      </section>

      <div className="container-page py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-5">
            <article className="surface p-5 sm:p-7">
              <div className="flex items-center gap-2 border-b border-line pb-4">
                <span className="flex size-8 items-center justify-center rounded-lg bg-electric/8 text-electric"><TypeIcon size={17} aria-hidden="true" /></span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Enunciado</h2>
                  <p className="text-[10.5px] text-muted">Lee con calma y resuelve sin ayudas si es posible.</p>
                </div>
              </div>
              <div className="mt-5">
                <Markdown content={exercise.statement} />
              </div>

              <div className="mt-7 border-t border-line pt-5">
                <h2 className="text-sm font-semibold text-ink">Tu respuesta</h2>

                {exercise.type === 'multiple' ? (
                  <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Opciones de respuesta">
                    {exercise.options.map((option, index) => {
                      const selected = answer === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => { setAnswer(option); setResult(null); }}
                          className={cn(
                            'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition focus-ring',
                            selected ? 'border-electric bg-electric/[0.055] text-ink ring-1 ring-electric/15' : 'border-line bg-white text-ink-soft hover:border-line-strong',
                          )}
                        >
                          <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-semibold', selected ? 'border-electric bg-electric text-white' : 'border-line text-muted')}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : exercise.type === 'codigo' ? (
                  <div className="mt-3">
                    <label htmlFor="answer-code" className="sr-only">Código de respuesta</label>
                    <textarea
                      id="answer-code"
                      value={answer}
                      onChange={(event) => { setAnswer(event.target.value); setResult(null); }}
                      rows={8}
                      spellCheck={false}
                      placeholder={'# Escribe tu solución aquí\n'}
                      className="w-full rounded-xl border border-line-strong bg-[#07152c] px-4 py-3 font-mono text-[13px] leading-relaxed text-[#e8eefc] placeholder:text-white/25 focus:border-electric focus:outline-none focus:ring-4 focus:ring-electric/10"
                    />
                    <p className="mt-1.5 text-[10.5px] text-muted">La comprobación acepta variantes equivalentes. No es un evaluador de producción.</p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <label htmlFor="answer-open" className="sr-only">Respuesta</label>
                    <textarea
                      id="answer-open"
                      value={answer}
                      onChange={(event) => { setAnswer(event.target.value); setResult(null); }}
                      rows={4}
                      placeholder="Escribe tu respuesta…"
                      className="w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-electric focus:outline-none focus:ring-4 focus:ring-electric/10"
                    />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button onClick={handleCheck} loading={checking} icon={<CheckCircle size={16} />}>
                    Comprobar respuesta
                  </Button>
                  <Button variant="secondary" onClick={() => setShowHint((value) => !value)} icon={<Lightbulb size={15} />}>
                    {showHint ? 'Ocultar pista' : 'Ver pista'}
                  </Button>
                  {!user && <Link to="/login" className={buttonStyles('ghost', 'md')}>Inicia sesión para guardar</Link>}
                </div>

                {result && (
                  <div
                    className={cn(
                      'mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed',
                      result.correct ? 'border-emerald/25 bg-emerald/[0.06] text-emerald' : 'border-rose/25 bg-rose/[0.05] text-rose',
                    )}
                    role="status"
                  >
                    {result.correct ? <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" /> : <XCircle size={20} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" />}
                    <div>
                      <p className="font-semibold">{result.correct ? 'Respuesta correcta' : 'Todavía no es correcto'}</p>
                      <p className="mt-0.5 text-[12.5px] opacity-90">{result.message}</p>
                      {!result.correct && <p className="mt-1 text-[12px] opacity-80">Intenta de nuevo con la pista. También puedes revisar la solución explicada abajo.</p>}
                    </div>
                  </div>
                )}

                {showHint && (
                  <div className="mt-4 rounded-xl border border-amber/25 bg-amber/[0.055] p-4">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber"><Lightbulb size={13} aria-hidden="true" /> Pista</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{exercise.hint || 'Este ejercicio no tiene pista adicional.'}</p>
                  </div>
                )}

                {hasAttempted && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowSolution((value) => !value)}
                      className="inline-flex items-center gap-1.5 rounded text-xs font-semibold text-electric hover:underline focus-ring"
                      aria-expanded={showSolution}
                    >
                      <Eye size={14} aria-hidden="true" /> {showSolution ? 'Ocultar solución explicada' : 'Mostrar solución explicada'}
                    </button>
                  </div>
                )}

                {showSolution && (
                  <div className="mt-4 space-y-4 rounded-xl border border-line bg-paper p-4 sm:p-5">
                    {exercise.procedure && exercise.procedure.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Procedimiento</h3>
                        <ol className="mt-2 space-y-2">
                          {exercise.procedure.map((step, index) => (
                            <li key={index} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-electric/10 font-mono text-[9px] font-semibold text-electric">{index + 1}</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {exercise.explanation && (
                      <div className="border-t border-line pt-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Por qué funciona</h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{exercise.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </article>

            {related.length > 0 && (
              <section aria-labelledby="relacionados-title">
                <div className="flex items-end justify-between gap-3">
                  <h2 id="relacionados-title" className="text-lg font-semibold text-ink">Ejercicios relacionados</h2>
                  <Link to={`/ejercicios?subject=${exercise.subject.id}`} className="text-xs font-semibold text-electric hover:underline">Ver materia</Link>
                </div>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {related.map((item) => <ExerciseCard key={item.id} exercise={item} />)}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="surface p-5">
              <h2 className="text-sm font-semibold text-ink">Datos del ejercicio</h2>
              <dl className="mt-3 space-y-2.5 text-[12px]">
                <div className="flex justify-between gap-3"><dt className="text-muted">Dificultad</dt><dd className="font-medium text-ink">{difficultyLabels[exercise.difficulty]}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Tipo</dt><dd className="font-medium text-ink">{typeLabels[exercise.type]}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Tema</dt><dd className="max-w-[60%] text-right font-medium text-ink">{exercise.topic.name}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Autor</dt><dd className="max-w-[60%] text-right font-medium text-ink">{exercise.author}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Publicado</dt><dd className="font-medium text-ink">{formatDate(exercise.publishedAt)}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {exercise.tags.map((tag) => <span key={tag} className="rounded-md border border-line bg-paper px-2 py-0.5 text-[10px] text-muted">{tag}</span>)}
              </div>
              <p className="mt-4 border-t border-line pt-3 text-[10.5px] leading-relaxed text-muted">{exercise.source}</p>
            </div>

            <div className="surface p-5">
              <h2 className="text-sm font-semibold text-ink">Acciones</h2>
              <div className="mt-3 space-y-2">
                <Button variant="soft" size="sm" className="w-full" onClick={markComplete} loading={completing} disabled={solved} icon={<CheckCircle size={15} />}>
                  {solved ? 'Ya está completado' : 'Marcar como completado'}
                </Button>
                <Link to="/favoritos" className={buttonStyles('secondary', 'sm', 'w-full')}>
                  <BookmarkSimple size={15} aria-hidden="true" /> Ver mis favoritos
                </Link>
                <Link to="/mi-progreso" className={buttonStyles('ghost', 'sm', 'w-full')}>
                  <Clock size={15} aria-hidden="true" /> Revisar mi progreso
                </Link>
              </div>
              {!user && <p className="mt-3 text-[10.5px] leading-relaxed text-muted">Los visitantes pueden practicar. Para conservar intentos, favoritos y objetivos, crea una cuenta gratuita.</p>}
            </div>

            <div className="rounded-2xl border border-electric/15 bg-[#edf3ff] p-5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white text-electric shadow-sm"><Sparkle size={18} weight="duotone" aria-hidden="true" /></span>
              <h2 className="mt-3 text-sm font-semibold text-ink">Pide otra explicación</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">El asistente puede explicarte el mismo concepto con otro enfoque y resolver dudas relacionadas.</p>
              <Link to="/asistente" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-electric hover:underline">Abrir asistente <ArrowRight size={12} aria-hidden="true" /></Link>
            </div>

            <DemoNotice compact>
              Ejercicio original de demostración. No es material oficial ni evaluación de la institución.
            </DemoNotice>

            <Link to="/ejercicios" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-ink">
              <ArrowLeft size={13} aria-hidden="true" /> Volver al banco
            </Link>
          </aside>
        </div>
      </div>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Reportar un problema"
        description="Cuéntanos qué ocurre con este ejercicio. El equipo administrador revisará el reporte."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setReportOpen(false)} disabled={reporting}>Cancelar</Button>
            <Button size="sm" onClick={submitReport} loading={reporting}>Enviar reporte</Button>
          </>
        }
      >
        <label htmlFor="report-reason" className="mb-1.5 block text-[13px] font-semibold text-ink">Motivo</label>
        <textarea
          id="report-reason"
          value={reportReason}
          onChange={(event) => setReportReason(event.target.value)}
          rows={4}
          maxLength={800}
          placeholder="Ejemplo: el enunciado tiene un error, la respuesta correcta no coincide…"
          className="w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-electric focus:outline-none focus:ring-4 focus:ring-electric/10"
        />
        <p className="mt-1.5 text-[11px] text-muted">Mínimo 10 caracteres. Los reportes se revisan desde el panel de administración.</p>
      </Modal>
    </div>
  );
}

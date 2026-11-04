import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookmarkSimple,
  Books,
  Briefcase,
  CalendarBlank,
  CheckCircle,
  Clock,
  Laptop,
  Robot,
  Sparkle,
  Target,
  Trophy,
  WarningCircle,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/lib/auth';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { ProgressChart } from '@/components/common/ProgressChart';
import { buttonStyles } from '@/components/ui/Button';
import { difficultyLabels, formatDate, relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { DashboardData } from '@/lib/types';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsyncData(() => api.get<DashboardData>('/me/dashboard'), []);

  if (loading) return <PageLoader label="Preparando tu panel…" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data) return null;

  const firstName = user?.fullName.split(' ')[0] || 'estudiante';
  const total = data.series.reduce((sum, point) => sum + point.count, 0);
  const maxGoal = data.goals[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName}.`}
        description="Este es tu punto de partida. Retoma donde lo dejaste, revisa tu progreso real y encuentra el siguiente paso."
        actions={
          <>
            <Link to="/ejercicios" className={buttonStyles('primary', 'md')}>Practicar ahora <ArrowRight size={15} aria-hidden="true" /></Link>
            <Link to="/asistente" className={buttonStyles('secondary', 'md')}><Robot size={15} aria-hidden="true" /> Asistente</Link>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Accesos del campus">
        <Link to="/materias" className="surface hover-lift flex items-center gap-3 p-4 focus-ring">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric/8 text-electric"><Books size={19} weight="duotone" aria-hidden="true" /></span>
          <span className="min-w-0">
            <span className="block text-[12.5px] font-semibold text-ink">Mis materias</span>
            <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">Registra y organiza tu tablero.</span>
          </span>
          <ArrowRight size={15} className="ml-auto shrink-0 text-electric" aria-hidden="true" />
        </Link>
        <Link to="/prestamo-pcs" className="surface hover-lift flex items-center gap-3 p-4 focus-ring">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald"><Laptop size={19} weight="duotone" aria-hidden="true" /></span>
          <span className="min-w-0">
            <span className="block text-[12.5px] font-semibold text-ink">Préstamo de PCs</span>
            <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">Registra equipos y salidas.</span>
          </span>
          <ArrowRight size={15} className="ml-auto shrink-0 text-emerald" aria-hidden="true" />
        </Link>
        <Link to="/empresas#vacantes" className="surface hover-lift flex items-center gap-3 p-4 focus-ring">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet/10 text-violet"><Briefcase size={19} weight="duotone" aria-hidden="true" /></span>
          <span className="min-w-0">
            <span className="block text-[12.5px] font-semibold text-ink">Vacantes y prácticas</span>
            <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">Explora oportunidades junior.</span>
          </span>
          <ArrowRight size={15} className="ml-auto shrink-0 text-violet" aria-hidden="true" />
        </Link>
      </section>

      {data.newUser && (
        <section className="overflow-hidden rounded-2xl border border-electric/15 bg-[linear-gradient(120deg,#edf3ff_0%,#f7f9ff_60%,#ffffff_100%)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-electric shadow-sm"><Sparkle size={22} weight="duotone" aria-hidden="true" /></span>
              <div>
                <h2 className="text-[15px] font-semibold text-ink">Tu panel está listo para empezar</h2>
                <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-muted">
                  Elige una materia, resuelve tu primer ejercicio y guarda un objetivo. Tu progreso se construirá con actividad real, no con datos de ejemplo.
                </p>
              </div>
            </div>
            <Link to="/catalogo" className={buttonStyles('primary', 'sm', 'shrink-0')}>Elegir materia <ArrowRight size={13} aria-hidden="true" /></Link>
          </div>
        </section>
      )}

      <section aria-label="Resumen de actividad" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ejercicios completados" value={data.stats.completed} hint={`de ${data.stats.available} disponibles`} icon={<CheckCircle size={18} />} tone="emerald" />
        <StatCard label="En curso" value={data.stats.inProgress} hint="Ejercicios iniciados sin completar" icon={<Clock size={18} />} tone="amber" />
        <StatCard label="Favoritos" value={data.stats.favorites} hint="Guardados para volver después" icon={<BookmarkSimple size={18} />} />
        <StatCard label="Postulaciones" value={data.stats.applications} hint="Retos activos o en revisión" icon={<Trophy size={18} />} tone="violet" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          {data.continueExercise ? (
            <section className="surface p-5 sm:p-6" aria-labelledby="continuar-title">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="continuar-title" className="text-sm font-semibold text-ink">Continúa donde lo dejaste</h2>
                <Badge tone="amber">En curso</Badge>
              </div>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold tracking-[-0.02em] text-ink">{data.continueExercise.title}</p>
                  <p className="mt-1 text-[12px] text-muted">{data.continueExercise.subjectName} · {difficultyLabels[data.continueExercise.difficulty]}</p>
                </div>
                <Link to={`/ejercicios/${data.continueExercise.id}`} className={buttonStyles('primary', 'sm', 'shrink-0')}>Retomar <ArrowRight size={13} aria-hidden="true" /></Link>
              </div>
            </section>
          ) : (
            <section className="surface p-5" aria-labelledby="sin-continuar-title">
              <h2 id="sin-continuar-title" className="text-sm font-semibold text-ink">No tienes ejercicios pendientes</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">Empieza por una recomendación o explora el banco completo cuando quieras.</p>
            </section>
          )}

          <section className="surface p-5 sm:p-6" aria-labelledby="recomendados-title">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 id="recomendados-title" className="text-sm font-semibold text-ink">Recomendados para ti</h2>
                <p className="mt-0.5 text-[11px] text-muted">Basados en tu carrera y en lo que aún no has completado.</p>
              </div>
              <Link to="/ejercicios" className="text-[11px] font-semibold text-electric hover:underline">Ver todos</Link>
            </div>
            {data.recommended.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-line-strong bg-paper/50 px-4 py-6 text-center text-xs text-muted">No hay recomendaciones nuevas. Explora el catálogo para encontrar más práctica.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {data.recommended.map((exercise) => (
                  <li key={exercise.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link to={`/ejercicios/${exercise.id}`} className="block truncate text-[13px] font-medium text-ink transition hover:text-electric focus-ring">{exercise.title}</Link>
                      <p className="mt-0.5 text-[10.5px] text-muted">{exercise.subjectName} · {difficultyLabels[exercise.difficulty]}</p>
                    </div>
                    <Link to={`/ejercicios/${exercise.id}`} className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-paper hover:text-electric focus-ring" aria-label={`Resolver ${exercise.title}`}>
                      <ArrowRight size={15} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="surface p-5 sm:p-6" aria-labelledby="materias-title">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 id="materias-title" className="text-sm font-semibold text-ink">Avance por materia</h2>
                <p className="mt-0.5 text-[11px] text-muted">Solo se muestran materias con actividad registrada.</p>
              </div>
              <Link to="/mi-progreso" className="text-[11px] font-semibold text-electric hover:underline">Detalle completo</Link>
            </div>
            {data.subjects.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-line-strong bg-paper/50 px-4 py-6 text-center text-xs text-muted">Aún no has practicado. Cuando completes ejercicios verás el avance por materia.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {data.subjects.map((subject) => (
                  <div key={subject.id}>
                    <div className="mb-1.5 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-medium text-ink-soft">{subject.name}</p>
                        <p className="text-[10px] text-muted">{subject.completed} de {subject.total} ejercicios · {subject.careerName}</p>
                      </div>
                      <span className="font-mono text-[10px] text-muted">{subject.percent}%</span>
                    </div>
                    <ProgressBar value={subject.percent} size="sm" label={`Progreso en ${subject.name}`} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="surface p-5 sm:p-6" aria-labelledby="retos-title">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 id="retos-title" className="text-sm font-semibold text-ink">Retos abiertos para ti</h2>
                <p className="mt-0.5 text-[11px] text-muted">Ejemplos de empresas ficticias, listos para practicar.</p>
              </div>
              <Link to="/retos" className="text-[11px] font-semibold text-electric hover:underline">Ver retos</Link>
            </div>
            {data.challenges.length === 0 ? (
              <p className="mt-4 text-xs text-muted">No hay retos abiertos en este momento.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {data.challenges.map((challenge) => (
                  <Link key={challenge.id} to={`/retos/${challenge.slug}`} className="group rounded-xl border border-line bg-white p-3.5 transition hover:border-electric/30 hover:bg-electric/[0.02] focus-ring">
                    <Badge tone="slate">{challenge.category}</Badge>
                    <p className="mt-2 clamp-2 text-[12.5px] font-semibold leading-snug text-ink group-hover:text-electric">{challenge.title}</p>
                    <p className="mt-1 text-[10px] text-muted">{challenge.company_name}</p>
                    <p className="mt-2 flex items-center gap-1 text-[10px] text-muted"><CalendarBlank size={11} aria-hidden="true" /> {formatDate(challenge.deadline)}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="surface p-5" aria-labelledby="actividad-title">
            <div className="flex items-center justify-between gap-2">
              <h2 id="actividad-title" className="text-sm font-semibold text-ink">Actividad</h2>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted">Últimos 14 días</span>
            </div>
            <div className="mt-4"><ProgressChart series={data.series} height={110} /></div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-muted">{total} {total === 1 ? 'ejercicio completado' : 'ejercicios completados'} en las últimas dos semanas.</p>
            <div className="mt-4 border-t border-line pt-3">
              <ActivityFeed items={data.activity.slice(0, 5)} emptyLabel="Tu actividad aparecerá aquí cuando practiques." />
            </div>
          </section>

          <section className="surface p-5" aria-labelledby="objetivos-title">
            <div className="flex items-center justify-between gap-2">
              <h2 id="objetivos-title" className="text-sm font-semibold text-ink">Objetivos</h2>
              <Link to="/mi-progreso" className="text-[10.5px] font-semibold text-electric hover:underline">Gestionar</Link>
            </div>
            {!maxGoal ? (
              <div className="mt-3 rounded-xl border border-dashed border-line-strong bg-paper/50 px-3 py-4 text-center">
                <Target size={20} className="mx-auto text-muted/70" aria-hidden="true" />
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted">Crea un objetivo para medir tu constancia semana a semana.</p>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12.5px] font-semibold text-ink">{maxGoal.title}</p>
                  <span className="shrink-0 font-mono text-[10px] text-muted">{maxGoal.percent}%</span>
                </div>
                <p className="mt-0.5 text-[10.5px] text-muted">{maxGoal.current} de {maxGoal.targetCount} ejercicios{maxGoal.subjectName ? ` · ${maxGoal.subjectName}` : ''}</p>
                <ProgressBar value={maxGoal.percent} tone={maxGoal.percent >= 100 ? 'emerald' : 'blue'} size="sm" className="mt-2" label={`Progreso del objetivo ${maxGoal.title}`} />
                {maxGoal.dueDate && <p className="mt-2 flex items-center gap-1 text-[10px] text-muted"><CalendarBlank size={11} aria-hidden="true" /> Hasta {formatDate(maxGoal.dueDate)}</p>}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-electric/15 bg-[#edf3ff] p-5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white text-electric shadow-sm"><Sparkle size={18} weight="duotone" aria-hidden="true" /></span>
            <h2 className="mt-3 text-sm font-semibold text-ink">¿Necesitas una explicación?</h2>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-soft">Pregunta al asistente por el tema que estás estudiando. Verás si la IA está conectada o si responde la guía local.</p>
            <Link to="/asistente" className={buttonStyles('primary', 'sm', 'mt-3 w-full')}>Abrir asistente <ArrowRight size={13} aria-hidden="true" /></Link>
          </section>

          {data.stats.unread > 0 && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-violet/20 bg-violet/[0.05] p-4">
              <WarningCircle size={17} className="mt-0.5 shrink-0 text-violet" aria-hidden="true" />
              <div>
                <p className="text-[12px] font-semibold text-ink">Tienes {data.stats.unread} {data.stats.unread === 1 ? 'notificación sin leer' : 'notificaciones sin leer'}</p>
                <p className="mt-0.5 text-[10.5px] text-muted">Revisa los cambios en tus postulaciones y tu cuenta.</p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {data.stats.completed === 0 && data.stats.favorites === 0 && (
        <section className="grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-3">
          {[
            { icon: Books, title: '1. Elige una materia', text: 'Revisa temas y ejercicios disponibles.', to: '/catalogo', label: 'Explorar' },
            { icon: CheckCircle, title: '2. Resuelve un ejercicio', text: 'Usa la pista solo después de intentarlo.', to: '/ejercicios', label: 'Practicar' },
            { icon: Target, title: '3. Define un objetivo', text: 'Convierte tu constancia en una meta medible.', to: '/mi-progreso', label: 'Crear meta' },
          ].map((step) => (
            <div key={step.title} className="flex items-start gap-3">
              <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl bg-paper text-electric')}><step.icon size={18} weight="duotone" aria-hidden="true" /></span>
              <div>
                <p className="text-[12.5px] font-semibold text-ink">{step.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{step.text}</p>
                <Link to={step.to} className="mt-1 inline-block text-[10.5px] font-semibold text-electric hover:underline">{step.label} <ArrowRight size={10} className="inline" aria-hidden="true" /></Link>
              </div>
            </div>
          ))}
        </section>
      )}

      <p className="text-[10px] text-muted">Actividad más reciente: {data.activity[0] ? relativeTime(data.activity[0].created_at) : 'sin actividad'}. Las cifras se calculan con tu cuenta real dentro de la base de demostración.</p>
    </div>
  );
}

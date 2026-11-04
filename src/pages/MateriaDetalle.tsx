import { Link, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, Books, CheckCircle, Clock, Sparkle } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ExerciseCard } from '@/components/common/ExerciseCard';
import { DemoNotice } from '@/components/common/DemoNotice';
import { buttonStyles } from '@/components/ui/Button';
import { plural } from '@/lib/format';
import type { Exercise, SubjectSummary, Topic } from '@/lib/types';

interface SubjectDetail {
  subject: SubjectSummary & { career: { id: string; name: string; slug: string } };
  topics: Topic[];
  exercises: Exercise[];
}

export default function MateriaDetalle() {
  const { id = '' } = useParams();
  const { data, loading, error, reload } = useAsyncData(
    () => api.get<SubjectDetail>(`/subjects/${id}`),
    [id],
  );

  if (loading) return <PageLoader label="Cargando materia…" />;
  if (error) {
    return (
      <div className="container-page py-16">
        <ErrorState message={error.message} onRetry={reload} />
        <div className="mt-5 text-center"><Link to="/catalogo" className={buttonStyles('secondary', 'md')}>Volver al catálogo</Link></div>
      </div>
    );
  }
  if (!data) return null;

  const { subject, topics, exercises } = data;
  const totalExercises = topics.reduce((sum, topic) => sum + (topic.exerciseCount || 0), 0);

  return (
    <div>
      <section className="border-b border-line bg-white">
        <div className="container-page py-10 sm:py-14">
          <PageHeader
            breadcrumb={[
              { label: 'Inicio', to: '/' },
              { label: 'Catálogo', to: '/catalogo' },
              { label: subject.career.name, to: `/carreras/${subject.career.slug}` },
              { label: subject.name },
            ]}
            title={subject.name}
            description={subject.description}
            actions={
              <Link to={`/ejercicios?subject=${subject.id}`} className={buttonStyles('primary', 'md')}>
                Practicar esta materia <ArrowRight size={15} aria-hidden="true" />
              </Link>
            }
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:max-w-2xl">
            <StatCard label="Temas" value={topics.length} icon={<BookOpen size={18} />} tone="violet" />
            <StatCard label="Ejercicios" value={totalExercises} icon={<Books size={18} />} />
            <StatCard label="Créditos" value={subject.credits ?? '—'} icon={<CheckCircle size={18} />} tone="emerald" hint={subject.semester ? `Semestre ${subject.semester}` : undefined} />
          </div>
        </div>
      </section>

      <div className="container-page py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-8">
            <section aria-labelledby="temas-title">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="temas-title" className="text-xl font-semibold text-ink">Temas de la materia</h2>
                  <p className="mt-1 text-xs text-muted">Cada tema agrupa ejercicios con dificultad y tipo de respuesta.</p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{plural(topics.length, 'tema', 'temas')}</span>
              </div>

              {topics.length === 0 ? (
                <div className="mt-4"><EmptyState icon={BookOpen} title="Aún no hay temas publicados" description="Esta materia está en preparación dentro del catálogo de demostración." /></div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
                  {topics.map((topic, index) => {
                    const count = topic.exerciseCount || 0;
                    return (
                      <div key={topic.id} className="group flex flex-col gap-3 border-b border-line px-5 py-4 transition last:border-0 hover:bg-paper/60 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3.5">
                          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-paper font-mono text-[10px] font-semibold text-ink-soft">{String(index + 1).padStart(2, '0')}</span>
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-semibold text-ink">{topic.name}</p>
                            <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{topic.description || 'Tema del catálogo de demostración.'}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 pl-10 sm:pl-0">
                          <Badge tone={count > 0 ? 'blue' : 'slate'}>{plural(count, 'ejercicio', 'ejercicios')}</Badge>
                          <Link
                            to={`/ejercicios?subject=${subject.id}&topic=${topic.slug}`}
                            className="inline-flex items-center gap-1 rounded text-[11px] font-semibold text-electric opacity-100 transition hover:underline focus-ring sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            Practicar <ArrowRight size={12} aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section aria-labelledby="ejercicios-title">
              <div className="flex items-end justify-between gap-3">
                <h2 id="ejercicios-title" className="text-xl font-semibold text-ink">Ejercicios de la materia</h2>
                <Link to={`/ejercicios?subject=${subject.id}`} className="text-xs font-semibold text-electric hover:underline">Ver todos</Link>
              </div>
              {exercises.length === 0 ? (
                <div className="mt-4"><EmptyState icon={Books} title="Sin ejercicios todavía" description="Los ejercicios publicados de esta materia aparecerán aquí." /></div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {exercises.map((exercise) => <ExerciseCard key={exercise.id} exercise={exercise} />)}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <div className="surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">Tu avance en la materia</h2>
                <Clock size={16} className="text-muted" aria-hidden="true" />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                El progreso se calcula con tu actividad real una vez inicias sesión. No usamos cifras estimadas.
              </p>
              <div className="mt-4 space-y-2">
                {topics.slice(0, 3).map((topic) => (
                  <div key={topic.id}>
                    <div className="mb-1 flex justify-between text-[10.5px] text-muted"><span className="truncate">{topic.name}</span><span>{topic.exerciseCount || 0}</span></div>
                    <ProgressBar value={0} size="sm" label={`Progreso pendiente en ${topic.name}`} />
                  </div>
                ))}
              </div>
              <Link to="/mi-progreso" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-electric hover:underline">
                Ver mi progreso <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>

            <div className="rounded-2xl border border-electric/15 bg-[#edf3ff] p-5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white text-electric shadow-sm"><Sparkle size={18} weight="duotone" aria-hidden="true" /></span>
              <h2 className="mt-3 text-sm font-semibold text-ink">¿Atascado en un tema?</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                Pide al asistente una explicación paso a paso. Si el servidor tiene una clave de IA configurada, responde un modelo real; si no, verás una guía local identificada.
              </p>
              <Link to="/asistente" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-electric hover:underline">
                Abrir asistente <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>

            <DemoNotice compact>
              Materia de demostración. El contenido es original y no reemplaza la orientación docente.
            </DemoNotice>
          </aside>
        </div>
      </div>
    </div>
  );
}

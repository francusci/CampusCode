import { Link, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, Books, GraduationCap } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { CareerIcon } from '@/components/ui/CareerIcon';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { DemoNotice } from '@/components/common/DemoNotice';
import { ExerciseCard } from '@/components/common/ExerciseCard';
import { buttonStyles } from '@/components/ui/Button';
import type { Career, Exercise, SubjectSummary } from '@/lib/types';

interface CareerDetail {
  career: Career;
  subjects: Array<SubjectSummary & { semester: number | null; credits: number | null }>;
  exercises: Exercise[];
}

export default function CarreraDetalle() {
  const { slug = '' } = useParams();
  const { data, loading, error, reload } = useAsyncData(
    () => api.get<CareerDetail>(`/careers/${slug}`),
    [slug],
  );

  if (loading) return <PageLoader label="Cargando carrera…" />;
  if (error) {
    return (
      <div className="container-page py-16">
        <ErrorState message={error.message} onRetry={reload} />
        <div className="mt-5 text-center">
          <Link to="/catalogo" className={buttonStyles('secondary', 'md')}>Volver al catálogo</Link>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const { career, subjects, exercises } = data;
  const semesters = [...new Set(subjects.map((subject) => subject.semester).filter((value): value is number => value !== null))].sort((a, b) => a - b);
  const ungrouped = subjects.filter((subject) => subject.semester === null);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_88%_10%,rgba(37,99,235,0.08),transparent_70%)]" aria-hidden="true" />
        <div className="container-page relative py-10 sm:py-14">
          <PageHeader
            breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Catálogo', to: '/catalogo' }, { label: career.name }]}
            title={career.name}
            description={career.description}
            actions={
              <Link to={`/ejercicios?career=${career.slug}`} className={buttonStyles('primary', 'md')}>
                Practicar ejercicios <ArrowRight size={15} aria-hidden="true" />
              </Link>
            }
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:max-w-2xl">
            <StatCard label="Materias" value={career.counts.subjects} icon={<Books size={18} />} />
            <StatCard label="Temas" value={career.counts.topics} icon={<BookOpen size={18} />} tone="violet" />
            <StatCard label="Ejercicios" value={career.counts.exercises} icon={<GraduationCap size={18} />} tone="emerald" />
          </div>
        </div>
      </section>

      <div className="container-page py-8 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1 space-y-8">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-ink">Plan de materias</h2>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{career.faculty}</span>
              </div>
              {subjects.length === 0 ? (
                <div className="mt-4"><EmptyState icon={Books} title="Esta carrera aún no tiene materias" description="El catálogo de demostración está en construcción. Explora otras carreras mientras tanto." action={<Link to="/catalogo" className={buttonStyles('secondary', 'sm')}>Ver catálogo</Link>} /></div>
              ) : (
                <div className="mt-4 space-y-6">
                  {semesters.map((semester) => (
                    <section key={semester} aria-labelledby={`semestre-${semester}`}>
                      <div className="mb-2.5 flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-ink font-mono text-[10px] font-semibold text-white">{semester}</span>
                        <h3 id={`semestre-${semester}`} className="text-[13px] font-semibold text-ink">Semestre {semester}</h3>
                        <span className="h-px flex-1 bg-line" aria-hidden="true" />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {subjects.filter((subject) => subject.semester === semester).map((subject) => (
                          <SubjectRow key={subject.id} subject={subject} />
                        ))}
                      </div>
                    </section>
                  ))}
                  {ungrouped.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {ungrouped.map((subject) => <SubjectRow key={subject.id} subject={subject} />)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <section aria-labelledby="recientes-title">
              <div className="flex items-end justify-between gap-3">
                <h2 id="recientes-title" className="text-xl font-semibold text-ink">Ejercicios recientes</h2>
                <Link to={`/ejercicios?career=${career.slug}`} className="text-xs font-semibold text-electric hover:underline">Ver todos</Link>
              </div>
              {exercises.length === 0 ? (
                <div className="mt-4"><EmptyState icon={GraduationCap} title="Sin ejercicios todavía" description="Cuando se publiquen ejercicios de esta carrera aparecerán aquí." /></div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {exercises.map((exercise) => <ExerciseCard key={exercise.id} exercise={exercise} />)}
                </div>
              )}
            </section>
          </div>

          <aside className="w-full shrink-0 space-y-4 lg:w-72">
            <div className="surface p-5">
              <CareerIcon name={career.icon} color={career.color} size="lg" />
              <h2 className="mt-4 text-sm font-semibold text-ink">{career.faculty}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">Contenido académico de demostración organizado por materia y tema.</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge tone="amber">Catálogo demo</Badge>
                <Badge tone="slate">Sin tutorías</Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-electric/15 bg-[#edf3ff] p-5">
              <h2 className="text-sm font-semibold text-ink">¿Cómo aprovechar esta carrera?</h2>
              <ol className="mt-3 space-y-2 text-xs leading-relaxed text-ink-soft">
                <li>1. Entra a una materia y revisa sus temas.</li>
                <li>2. Resuelve ejercicios con pistas y explicación.</li>
                <li>3. Consulta al asistente cuando algo no cierre.</li>
                <li>4. Aplica lo aprendido en un reto empresarial.</li>
              </ol>
              <Link to="/asistente" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-electric hover:underline">
                Abrir asistente <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <DemoNotice compact>
              Los ejercicios son originales y no representan evaluaciones oficiales de la institución.
            </DemoNotice>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SubjectRow({ subject }: { subject: SubjectSummary }) {
  return (
    <Link to={`/catalogo/${subject.id}`} className="surface hover-lift group flex items-start justify-between gap-3 p-4 focus-ring">
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-ink group-hover:text-electric">{subject.name}</span>
        <span className="clamp-2 mt-1 block text-[11px] leading-relaxed text-muted">{subject.description}</span>
        <span className="mt-2 block font-mono text-[9.5px] uppercase tracking-wider text-muted/80">
          {subject.counts.topics} temas · {subject.counts.exercises} ejercicios
        </span>
      </span>
      <ArrowRight size={15} className="mt-1 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-electric" aria-hidden="true" />
    </Link>
  );
}

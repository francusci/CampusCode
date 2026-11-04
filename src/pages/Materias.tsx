import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Books, MagnifyingGlass, X } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData, useDebouncedValue } from '@/hooks/useAsyncData';
import { PageHeader } from '@/components/ui/PageHeader';
import { CareerIcon } from '@/components/ui/CareerIcon';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { CardSkeleton } from '@/components/ui/Spinner';
import { inputClass } from '@/components/ui/Field';
import { buttonStyles } from '@/components/ui/Button';
import { DemoNotice } from '@/components/common/DemoNotice';
import { plural } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Career, SubjectSummary } from '@/lib/types';

export default function Materias() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [career, setCareer] = useState(params.get('career') || '');
  const debouncedQ = useDebouncedValue(q, 320);
  const careers = useAsyncData(() => api.get<{ items: Career[] }>('/careers'), []);
  const subjects = useAsyncData(
    () => api.get<{ items: SubjectSummary[] }>('/subjects', { q: debouncedQ, career }),
    [debouncedQ, career],
  );

  useEffect(() => {
    const next = new URLSearchParams();
    if (q.trim()) next.set('q', q.trim());
    if (career) next.set('career', career);
    setParams(next, { replace: true });
    // setParams es estable; solo sincronizamos cuando cambian los filtros.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, career]);

  const activeCareer = careers.data?.items.find((item) => item.slug === career || item.id === career);
  const total = subjects.data?.items.length || 0;

  return (
    <div>
      <section className="border-b border-line bg-white">
        <div className="container-page py-10 sm:py-14">
          <PageHeader
            breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Materias' }]}
            title="Explora el catálogo académico"
            description="Encuentra tu carrera, entra a una materia y practica por tema. Todo el contenido está organizado para que sepas exactamente dónde estás y qué sigue."
            actions={
              <Link to="/ejercicios" className={buttonStyles('secondary', 'md')}>
                Ir al banco de ejercicios
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            }
          />
          <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-md">
              <MagnifyingGlass size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="search"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                className={cn(inputClass, 'pl-10')}
                placeholder="Busca una materia, tema o carrera…"
                aria-label="Buscar materias"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-paper hover:text-ink focus-ring"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5" aria-label="Filtrar por carrera">
              <button
                type="button"
                onClick={() => setCareer('')}
                aria-pressed={!career}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[11px] font-semibold transition focus-ring',
                  !career ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-soft hover:border-line-strong',
                )}
              >
                Todas
              </button>
              {(careers.data?.items || []).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCareer(item.slug)}
                  aria-pressed={career === item.slug}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[11px] font-semibold transition focus-ring',
                    career === item.slug ? 'border-electric bg-electric text-white' : 'border-line bg-white text-ink-soft hover:border-line-strong',
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-8 sm:py-10">
        <DemoNotice className="mb-8">
          Catálogo de demostración: carreras, materias y ejercicios originales creados para este proyecto. No corresponden al pénsum oficial ni a material docente.
        </DemoNotice>

        <section aria-labelledby="carreras-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="carreras-title" className="text-lg font-semibold text-ink">Áreas de conocimiento</h2>
              <p className="mt-1 text-xs text-muted">{plural(careers.data?.items.length || 0, 'carrera disponible', 'carreras disponibles')} en el catálogo.</p>
            </div>
            {activeCareer && (
              <Link to={`/carreras/${activeCareer.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-electric hover:underline">
                Ver detalle de {activeCareer.name} <ArrowRight size={13} aria-hidden="true" />
              </Link>
            )}
          </div>

          {careers.loading ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => <CardSkeleton key={index} />)}
            </div>
          ) : careers.error ? (
            <ErrorState message={careers.error.message} onRetry={careers.reload} />
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(careers.data?.items || []).map((item) => (
                <Link
                  key={item.id}
                  to={`/carreras/${item.slug}`}
                  className={cn(
                    'surface hover-lift group flex items-start gap-3 p-4 focus-ring',
                    (career === item.slug || career === item.id) && 'border-electric/40 ring-1 ring-electric/15',
                  )}
                >
                  <CareerIcon name={item.icon} color={item.color} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-ink group-hover:text-electric">{item.name}</span>
                    <span className="mt-0.5 block text-[10.5px] text-muted">{item.faculty}</span>
                    <span className="mt-2 block font-mono text-[9.5px] uppercase tracking-wider text-muted/80">
                      {item.counts.subjects} materias · {item.counts.exercises} ejercicios
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10" aria-labelledby="materias-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="materias-title" className="text-lg font-semibold text-ink">
                {activeCareer ? `Materias de ${activeCareer.name}` : q ? `Resultados para “${q}”` : 'Todas las materias'}
              </h2>
              <p className="mt-1 text-xs text-muted">
                {subjects.loading ? 'Cargando materias…' : `${plural(total, 'materia encontrada', 'materias encontradas')}.`}
              </p>
            </div>
            {(q || career) && (
              <button
                type="button"
                onClick={() => { setQ(''); setCareer(''); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-medium text-ink-soft transition hover:border-line-strong focus-ring"
              >
                <X size={12} aria-hidden="true" /> Limpiar filtros
              </button>
            )}
          </div>

          {subjects.loading ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <CardSkeleton key={index} />)}
            </div>
          ) : subjects.error ? (
            <div className="mt-4"><ErrorState message={subjects.error.message} onRetry={subjects.reload} /></div>
          ) : total === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Books}
                title="No encontramos materias con esos filtros"
                description="Prueba con otra palabra o selecciona una carrera distinta. El catálogo de demostración crece con nuevas materias."
                action={<button type="button" onClick={() => { setQ(''); setCareer(''); }} className={buttonStyles('secondary', 'sm')}>Ver todo el catálogo</button>}
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subjects.data?.items.map((subject) => (
                <article key={subject.id} className="surface hover-lift flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Badge tone="slate">{subject.career.name}</Badge>
                    {subject.semester && <span className="font-mono text-[10px] uppercase tracking-wider text-muted">Semestre {subject.semester}</span>}
                  </div>
                  <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.02em] text-ink">
                    <Link to={`/catalogo/${subject.id}`} className="rounded transition hover:text-electric focus-ring">{subject.name}</Link>
                  </h3>
                  <p className="clamp-3 mt-1.5 text-[12.5px] leading-relaxed text-muted">{subject.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <Badge tone="blue">{subject.counts.exercises} ejercicios</Badge>
                    <Badge tone="slate">{subject.counts.topics} temas</Badge>
                    {subject.credits && <Badge tone="slate">{subject.credits} créditos</Badge>}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/80 pt-3.5">
                    <Link to={`/carreras/${subject.career.slug}`} className="truncate rounded text-[10.5px] text-muted hover:text-electric focus-ring">
                      {subject.career.name}
                    </Link>
                    <Link to={`/catalogo/${subject.id}`} className="inline-flex shrink-0 items-center gap-1 rounded text-[11px] font-semibold text-electric hover:underline focus-ring">
                      Ver materia <ArrowRight size={12} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

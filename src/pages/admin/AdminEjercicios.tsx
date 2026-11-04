import { useMemo, useState } from 'react';
import {
  CheckCircle,
  Code,
  Eye,
  EyeSlash,
  MagnifyingGlass,
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
import { difficultyLabels, formatDate, typeLabels } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { AdminExercise, Difficulty } from '@/lib/types';

type PublishedFilter = 'all' | 'published' | 'hidden';

const difficultyTone = {
  basico: 'emerald',
  intermedio: 'amber',
  avanzado: 'rose',
} as const;

export default function AdminEjercicios() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 320);
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [published, setPublished] = useState<PublishedFilter>('all');
  const { data, loading, error, reload } = useAsyncData(
    () => api.get<{ items: AdminExercise[] }>('/admin/exercises', { q: debouncedQ }),
    [debouncedQ],
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const exercises = data?.items || [];
  const filtered = useMemo(
    () =>
      exercises.filter((exercise) => {
        if (difficulty && exercise.difficulty !== difficulty) return false;
        if (published === 'published' && !exercise.is_published) return false;
        if (published === 'hidden' && exercise.is_published) return false;
        return true;
      }),
    [difficulty, exercises, published],
  );

  const summary = useMemo(
    () => ({
      total: exercises.length,
      published: exercises.filter((exercise) => Boolean(exercise.is_published)).length,
      hidden: exercises.filter((exercise) => !exercise.is_published).length,
      demo: exercises.filter((exercise) => exercise.isDemo).length,
    }),
    [exercises],
  );

  async function togglePublish(exercise: AdminExercise) {
    setBusyId(exercise.id);
    try {
      await api.patch(`/admin/exercises/${exercise.id}`, { isPublished: !exercise.is_published });
      toast.success(exercise.is_published ? 'Ejercicio ocultado del catálogo.' : 'Ejercicio publicado.');
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos actualizar el ejercicio.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <PageLoader label="Cargando ejercicios…" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ejercicios"
        description="Revisa el banco de ejercicios y controla su publicación. Un ejercicio oculto deja de aparecer en el catálogo y en las recomendaciones."
      />

      <DemoNotice>
        El banco inicial está compuesto por ejercicios de demostración. Las etiquetas “Demo” indican contenido creado para este proyecto, no ejercicios de producción.
      </DemoNotice>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de ejercicios">
        <StatCard label="En el banco" value={summary.total} hint="Con la búsqueda actual" icon={<Code size={18} />} />
        <StatCard label="Publicados" value={summary.published} hint="Visibles para estudiantes" icon={<Eye size={18} />} tone="emerald" />
        <StatCard label="Ocultos" value={summary.hidden} hint="Fuera del catálogo" icon={<EyeSlash size={18} />} tone="amber" />
        <StatCard label="De demostración" value={summary.demo} hint="Etiquetados en el listado" icon={<CheckCircle size={18} />} tone="violet" />
      </section>

      <section className="surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar por título, materia o tema…"
              aria-label="Buscar ejercicios"
              className={cn(inputClass, 'pl-9')}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select
              aria-label="Filtrar por dificultad"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty | '')}
              className="sm:w-40"
            >
              <option value="">Toda dificultad</option>
              <option value="basico">Básico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </Select>
            <Select
              aria-label="Filtrar por publicación"
              value={published}
              onChange={(event) => setPublished(event.target.value as PublishedFilter)}
              className="sm:w-40"
            >
              <option value="all">Todos</option>
              <option value="published">Publicados</option>
              <option value="hidden">Ocultos</option>
            </Select>
            {(q || difficulty || published !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setQ(''); setDifficulty(''); setPublished('all'); }}
                icon={<X size={13} />}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted">{filtered.length} de {exercises.length} ejercicios visibles con los filtros actuales.</p>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Code}
          title="No hay ejercicios con esos filtros"
          description="Prueba con otra palabra, dificultad o estado de publicación."
          action={<Button variant="secondary" size="sm" onClick={() => { setQ(''); setDifficulty(''); setPublished('all'); }}>Quitar filtros</Button>}
        />
      ) : (
        <section className="surface overflow-hidden" aria-label="Listado de ejercicios">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-paper/50 text-[9.5px] uppercase tracking-[0.12em] text-muted">
                  <th className="px-4 py-3 font-semibold">Ejercicio</th>
                  <th className="px-4 py-3 font-semibold">Materia y tema</th>
                  <th className="px-4 py-3 font-semibold">Dificultad</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Carrera</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exercise) => (
                  <tr key={exercise.id} className="border-b border-line/70 last:border-0">
                    <td className="max-w-[280px] px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-[12.5px] font-semibold text-ink">{exercise.title}</p>
                        {exercise.isDemo && <span className="rounded bg-amber/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber">Demo</span>}
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted">{exercise.author} · {formatDate(exercise.published_at)}</p>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted">
                      <p className="font-medium text-ink-soft">{exercise.subject_name}</p>
                      <p className="mt-0.5">{exercise.topic_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={difficultyTone[exercise.difficulty]}>{difficultyLabels[exercise.difficulty]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted">{typeLabels[exercise.type]}</td>
                    <td className="px-4 py-3 text-[10.5px] text-muted">{exercise.career_name}</td>
                    <td className="px-4 py-3">
                      <Badge tone={exercise.is_published ? 'emerald' : 'slate'}>{exercise.is_published ? 'Publicado' : 'Oculto'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={busyId === exercise.id}
                        onClick={() => togglePublish(exercise)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10.5px] font-semibold transition focus-ring disabled:opacity-40',
                          exercise.is_published
                            ? 'border-line-strong text-ink-soft hover:bg-paper'
                            : 'border-emerald/25 text-emerald hover:bg-emerald/5',
                        )}
                      >
                        {exercise.is_published ? <EyeSlash size={12} aria-hidden="true" /> : <Eye size={12} aria-hidden="true" />}
                        {exercise.is_published ? 'Ocultar' : 'Publicar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

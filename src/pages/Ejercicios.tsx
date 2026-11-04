import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Books, Funnel, MagnifyingGlass, X } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData, useDebouncedValue } from '@/hooks/useAsyncData';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select, inputClass } from '@/components/ui/Field';
import { Button, buttonStyles } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ExerciseCard } from '@/components/common/ExerciseCard';
import { DemoNotice } from '@/components/common/DemoNotice';
import { plural } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Career, Exercise, SubjectSummary } from '@/lib/types';

const PAGE_SIZE = 12;

interface ExerciseResponse {
  items: Exercise[];
  total: number;
  hasMore: boolean;
}

export default function Ejercicios() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();

  const [q, setQ] = useState(params.get('q') || '');
  const [career, setCareer] = useState(params.get('career') || '');
  const [subject, setSubject] = useState(params.get('subject') || '');
  const [topic, setTopic] = useState(params.get('topic') || '');
  const [difficulty, setDifficulty] = useState(params.get('difficulty') || '');
  const [type, setType] = useState(params.get('type') || '');
  const [sort, setSort] = useState(params.get('sort') || 'recent');
  const [status, setStatus] = useState(params.get('status') || '');
  const debouncedQ = useDebouncedValue(q, 320);

  const [items, setItems] = useState<Exercise[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const careers = useAsyncData(() => api.get<{ items: Career[] }>('/careers'), []);
  const subjects = useAsyncData(() => api.get<{ items: SubjectSummary[] }>('/subjects'), []);

  const canFavorite = Boolean(user && user.role !== 'company');
  const visibleSubjects = (subjects.data?.items || []).filter((item) => {
    if (!career) return true;
    return item.career.slug === career || item.career.id === career;
  });

  useEffect(() => {
    const next = new URLSearchParams();
    const entries: Array<[string, string]> = [
      ['q', q.trim()],
      ['career', career],
      ['subject', subject],
      ['topic', topic],
      ['difficulty', difficulty],
      ['type', type],
      ['sort', sort === 'recent' ? '' : sort],
      ['status', status],
    ];
    for (const [key, value] of entries) if (value) next.set(key, value);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, career, subject, topic, difficulty, type, sort, status]);

  const activeFilters = [career, subject, topic, difficulty, type, status].filter(Boolean).length;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api
      .get<ExerciseResponse>(
        '/exercises',
        {
          q: debouncedQ,
          career,
          subject,
          topic,
          difficulty,
          type,
          sort,
          status: user && user.role !== 'company' ? status : '',
          limit: PAGE_SIZE,
          offset: 0,
        },
        controller.signal,
      )
      .then((response) => {
        setItems(response.items);
        setTotal(response.total);
        setHasMore(response.hasMore);
        setLoading(false);
      })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        setError(caught instanceof Error ? caught : new Error('No pudimos cargar los ejercicios.'));
        setLoading(false);
      });
    return () => controller.abort();
  }, [debouncedQ, career, subject, topic, difficulty, type, sort, status, user, reloadToken]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const response = await api.get<ExerciseResponse>('/exercises', {
        q: debouncedQ,
        career,
        subject,
        topic,
        difficulty,
        type,
        sort,
        status: user && user.role !== 'company' ? status : '',
        limit: PAGE_SIZE,
        offset: items.length,
      });
      setItems((current) => [...current, ...response.items]);
      setHasMore(response.hasMore);
      setTotal(response.total);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos cargar más ejercicios.');
    } finally {
      setLoadingMore(false);
    }
  }

  async function toggleFavorite(exercise: Exercise) {
    if (favoriteBusy) return;
    setFavoriteBusy(true);
    try {
      const response = await api.post<{ favorite: boolean }>(`/exercises/${exercise.id}/favorite`);
      setItems((current) =>
        current.map((item) =>
          item.id === exercise.id
            ? { ...item, userState: { ...item.userState, isFavorite: response.favorite } }
            : item,
        ),
      );
      toast.success(response.favorite ? 'Ejercicio guardado en favoritos.' : 'Ejercicio eliminado de favoritos.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos actualizar tus favoritos.');
    } finally {
      setFavoriteBusy(false);
    }
  }

  function clearFilters() {
    setQ('');
    setCareer('');
    setSubject('');
    setTopic('');
    setDifficulty('');
    setType('');
    setStatus('');
    setSort('recent');
  }

  return (
    <div>
      <section className="border-b border-line bg-white">
        <div className="container-page py-10 sm:py-14">
          <PageHeader
            breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Ejercicios' }]}
            title="Banco de ejercicios"
            description="Practica por materia, tema, dificultad o tipo de respuesta. Cada ejercicio incluye pista, procedimiento y explicación para aprender del error."
            actions={
              <Link to="/asistente" className={buttonStyles('secondary', 'md')}>
                Consultar al asistente
              </Link>
            }
          />
        </div>
      </section>

      <div className="container-page py-8 sm:py-10">
        <DemoNotice className="mb-6">
          Ejercicios originales de demostración. Los intentos se guardan solo si inicias sesión; los visitantes pueden practicar sin historial.
        </DemoNotice>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside aria-label="Filtros de ejercicios" className="space-y-4">
            <div className="surface p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Funnel size={15} className="text-electric" aria-hidden="true" /> Filtros
                </h2>
                {activeFilters > 0 && (
                  <button type="button" onClick={clearFilters} className="rounded text-[10.5px] font-semibold text-electric hover:underline focus-ring">
                    Limpiar ({activeFilters})
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-3.5">
                <div>
                  <label htmlFor="filter-q" className="mb-1.5 block text-[11px] font-semibold text-ink-soft">Buscar</label>
                  <div className="relative">
                    <MagnifyingGlass size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
                    <input
                      id="filter-q"
                      type="search"
                      value={q}
                      onChange={(event) => setQ(event.target.value)}
                      placeholder="Título, tema, etiqueta…"
                      className={cn(inputClass, 'pl-9 text-[12.5px]')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="filter-career" className="mb-1.5 block text-[11px] font-semibold text-ink-soft">Carrera</label>
                  <Select id="filter-career" value={career} onChange={(event) => { setCareer(event.target.value); setSubject(''); }} className="text-[12.5px]">
                    <option value="">Todas las carreras</option>
                    {(careers.data?.items || []).map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
                  </Select>
                </div>

                <div>
                  <label htmlFor="filter-subject" className="mb-1.5 block text-[11px] font-semibold text-ink-soft">Materia</label>
                  <Select id="filter-subject" value={subject} onChange={(event) => setSubject(event.target.value)} className="text-[12.5px]">
                    <option value="">Todas las materias</option>
                    {visibleSubjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </Select>
                </div>

                {topic && (
                  <div>
                    <span className="mb-1.5 block text-[11px] font-semibold text-ink-soft">Tema activo</span>
                    <div className="flex items-center justify-between rounded-lg border border-electric/20 bg-electric/[0.04] px-2.5 py-2 text-[11.5px] text-electric">
                      <span className="truncate">{topic}</span>
                      <button type="button" onClick={() => setTopic('')} aria-label="Quitar filtro de tema" className="rounded p-0.5 hover:bg-electric/10 focus-ring"><X size={12} /></button>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="filter-difficulty" className="mb-1.5 block text-[11px] font-semibold text-ink-soft">Dificultad</label>
                  <Select id="filter-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="text-[12.5px]">
                    <option value="">Todas</option>
                    <option value="basico">Básico</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </Select>
                </div>

                <div>
                  <label htmlFor="filter-type" className="mb-1.5 block text-[11px] font-semibold text-ink-soft">Tipo de respuesta</label>
                  <Select id="filter-type" value={type} onChange={(event) => setType(event.target.value)} className="text-[12.5px]">
                    <option value="">Todos</option>
                    <option value="multiple">Opción múltiple</option>
                    <option value="abierta">Respuesta abierta</option>
                    <option value="codigo">Código</option>
                  </Select>
                </div>

                {user && user.role !== 'company' && (
                  <div>
                    <label htmlFor="filter-status" className="mb-1.5 block text-[11px] font-semibold text-ink-soft">Mi estado</label>
                    <Select id="filter-status" value={status} onChange={(event) => setStatus(event.target.value)} className="text-[12.5px]">
                      <option value="">Todos</option>
                      <option value="pending">Sin completar</option>
                      <option value="in_progress">En curso</option>
                      <option value="completed">Completados</option>
                    </Select>
                  </div>
                )}

                <div>
                  <label htmlFor="filter-sort" className="mb-1.5 block text-[11px] font-semibold text-ink-soft">Ordenar por</label>
                  <Select id="filter-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="text-[12.5px]">
                    <option value="recent">Más recientes</option>
                    <option value="title">Título (A–Z)</option>
                    <option value="difficulty">Dificultad</option>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="text-[11px] font-semibold text-ink">Consejo de estudio</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Intenta primero sin mirar la solución. Si fallas, revisa la pista y vuelve a intentarlo antes de abrir el procedimiento.
              </p>
            </div>
          </aside>

          <section aria-labelledby="resultados-title" className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="resultados-title" className="text-lg font-semibold text-ink">Ejercicios disponibles</h2>
                <p className="mt-1 text-xs text-muted">
                  {loading ? 'Buscando ejercicios…' : `${plural(total, 'ejercicio encontrado', 'ejercicios encontrados')}${activeFilters ? ' con los filtros actuales' : ''}.`}
                </p>
              </div>
              {!user && (
                <Link to="/login" className="text-[11px] font-semibold text-electric hover:underline">
                  Inicia sesión para guardar tu progreso
                </Link>
              )}
            </div>

            {loading ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => <CardSkeleton key={index} />)}
              </div>
            ) : error ? (
              <div className="mt-4"><ErrorState message={error.message} onRetry={() => setReloadToken((value) => value + 1)} /></div>
            ) : items.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={Books}
                  title="No hay ejercicios con esos filtros"
                  description="Prueba quitando algún filtro o buscando por otro concepto. También puedes recorrer el catálogo completo."
                  action={<Button variant="secondary" size="sm" onClick={clearFilters}>Quitar filtros</Button>}
                />
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {items.map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onToggleFavorite={canFavorite ? toggleFavorite : undefined}
                      favoriteBusy={favoriteBusy}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-6 flex justify-center">
                    <Button variant="secondary" loading={loadingMore} onClick={loadMore}>
                      Cargar más ejercicios
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

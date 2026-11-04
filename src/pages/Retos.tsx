import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Funnel, MagnifyingGlass, Sparkle, Trophy, X } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData, useDebouncedValue } from '@/hooks/useAsyncData';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Select, inputClass } from '@/components/ui/Field';
import { Button, buttonStyles } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { DemoNotice } from '@/components/common/DemoNotice';
import { daysUntil, plural } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Challenge } from '@/lib/types';

interface ChallengesResponse {
  items: Challenge[];
  total: number;
  facets: { categories: string[]; skills: string[] };
  demoNotice: string;
}

export default function Retos() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [skill, setSkill] = useState(params.get('skill') || '');
  const [status, setStatus] = useState(params.get('status') || '');
  const debouncedQ = useDebouncedValue(q, 320);
  const challenges = useAsyncData(
    () => api.get<ChallengesResponse>('/challenges', { q: debouncedQ, category, skill, status }),
    [debouncedQ, category, skill, status],
  );

  useEffect(() => {
    const next = new URLSearchParams();
    if (q.trim()) next.set('q', q.trim());
    if (category) next.set('category', category);
    if (skill) next.set('skill', skill);
    if (status) next.set('status', status);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, skill, status]);

  const items = challenges.data?.items || [];
  const featured = items.find((challenge) => challenge.featured) || items[0];
  const rest = items.filter((challenge) => challenge.id !== featured?.id);
  const openCount = items.filter((challenge) => challenge.status === 'open' && daysUntil(challenge.deadline) >= 0).length;
  const activeFilters = [category, skill, status].filter(Boolean).length;

  function clearFilters() {
    setQ('');
    setCategory('');
    setSkill('');
    setStatus('');
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_90%_15%,rgba(124,58,237,0.07),transparent_70%)]" aria-hidden="true" />
        <div className="container-page relative py-10 sm:py-14">
          <PageHeader
            breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Retos' }]}
            title="Retos de empresas"
            description="Aplica lo que aprendes a problemas reales de negocio. Cada reto define contexto, requisitos y entregables para que sepas qué construir."
            actions={<Link to="/empresas" className={buttonStyles('secondary', 'md')}>Conocer las empresas</Link>}
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:max-w-2xl">
            <StatCard label="Retos en el catálogo" value={items.length || '—'} icon={<Trophy size={18} />} tone="violet" hint="Incluye retos abiertos y cerrados" />
            <StatCard label="Abiertos ahora" value={openCount || '—'} icon={<Sparkle size={18} />} tone="emerald" hint="Con fecha límite vigente" />
            <StatCard label="Categorías" value={challenges.data?.facets.categories.length || '—'} icon={<Funnel size={18} />} hint="Filtra por área de negocio" />
          </div>
        </div>
      </section>

      <div className="container-page py-8 sm:py-10">
        <DemoNotice className="mb-6">
          {challenges.data?.demoNotice || 'Los retos y empresas de esta sección son ejemplos ficticios para demostración. No representan alianzas reales.'}
        </DemoNotice>

        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Busca por título, empresa, habilidad…"
              aria-label="Buscar retos"
              className={cn(inputClass, 'pl-9')}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select aria-label="Filtrar por categoría" value={category} onChange={(event) => setCategory(event.target.value)} className="text-[12.5px] sm:w-44">
              <option value="">Todas las categorías</option>
              {(challenges.data?.facets.categories || []).map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select aria-label="Filtrar por habilidad" value={skill} onChange={(event) => setSkill(event.target.value)} className="text-[12.5px] sm:w-40">
              <option value="">Todas las habilidades</option>
              {(challenges.data?.facets.skills || []).map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select aria-label="Filtrar por estado" value={status} onChange={(event) => setStatus(event.target.value)} className="text-[12.5px] sm:w-32">
              <option value="">Todos</option>
              <option value="open">Abiertos</option>
              <option value="closed">Cerrados</option>
            </Select>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} icon={<X size={13} />}>Limpiar</Button>
            )}
          </div>
        </div>

        {challenges.loading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <CardSkeleton key={index} />)}
          </div>
        ) : challenges.error ? (
          <div className="mt-6"><ErrorState message={challenges.error.message} onRetry={challenges.reload} /></div>
        ) : items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={Trophy}
              title="No hay retos con esos filtros"
              description="Prueba con otra categoría, habilidad o palabra. También puedes ver todos los retos disponibles."
              action={<Button variant="secondary" size="sm" onClick={clearFilters}>Ver todos los retos</Button>}
            />
          </div>
        ) : (
          <>
            {featured && (
              <section className="mt-6" aria-labelledby="destacado-title">
                <div className="mb-3 flex items-center gap-2">
                  <Badge tone="violet">Reto destacado</Badge>
                  <span className="font-mono text-[9.5px] uppercase tracking-wider text-muted">Selección del equipo</span>
                </div>
                <h2 id="destacado-title" className="sr-only">Reto destacado</h2>
                <ChallengeCard challenge={featured} featured />
              </section>
            )}

            <section className="mt-8" aria-labelledby="todos-retos-title">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="todos-retos-title" className="text-lg font-semibold text-ink">Todos los retos</h2>
                  <p className="mt-1 text-xs text-muted">{plural(items.length, 'reto disponible', 'retos disponibles')} en el catálogo de demostración.</p>
                </div>
                <span className="text-[10.5px] text-muted">Ordenados por destacados y fecha de publicación</span>
              </div>
              {rest.length === 0 ? (
                <div className="mt-4"><EmptyState icon={Trophy} title="Este es el único reto por ahora" description="Cuando las empresas publiquen nuevos desafíos aparecerán en esta sección." /></div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rest.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)}
                </div>
              )}
            </section>
          </>
        )}

        <section className="mt-10 overflow-hidden rounded-3xl bg-ink-gradient p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <Badge tone="navy" className="border-white/15 bg-white/10 text-white">Para empresas</Badge>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">Publica un reto con contexto real</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Define el problema, los requisitos y los entregables. Revisa postulaciones y descubre cómo piensan los estudiantes.
              </p>
            </div>
            <Link to="/empresas" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#eef4ff] focus-ring">
              Conocer el programa <Sparkle size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

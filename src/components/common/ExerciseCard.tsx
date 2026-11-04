import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookmarkSimple,
  CheckCircle,
  Clock,
  Code,
  ListChecks,
  TextAlignLeft,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { difficultyLabels } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Exercise } from '@/lib/types';

const typeIcon = {
  multiple: ListChecks,
  abierta: TextAlignLeft,
  codigo: Code,
};

const typeLabel = {
  multiple: 'Opción múltiple',
  abierta: 'Respuesta abierta',
  codigo: 'Código',
};

export function ExerciseCard({
  exercise,
  onToggleFavorite,
  favoriteBusy = false,
}: {
  exercise: Exercise;
  onToggleFavorite?: (exercise: Exercise) => void;
  favoriteBusy?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const TypeIcon = typeIcon[exercise.type];
  const completed = exercise.userState.status === 'completed';
  const inProgress = exercise.userState.status === 'in_progress';

  return (
    <article className="surface hover-lift flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={exercise.difficulty === 'basico' ? 'emerald' : exercise.difficulty === 'intermedio' ? 'amber' : 'rose'}>
            {difficultyLabels[exercise.difficulty]}
          </Badge>
          <Badge tone="slate">{exercise.subject.name}</Badge>
          {completed && (
            <Badge tone="emerald">
              <CheckCircle size={11} weight="fill" aria-hidden="true" /> Completado
            </Badge>
          )}
          {inProgress && <Badge tone="blue">En curso</Badge>}
          {exercise.isDemo && <Badge tone="amber">Ejemplo</Badge>}
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={async () => {
              setBusy(true);
              try {
                await onToggleFavorite(exercise);
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy || favoriteBusy}
            aria-pressed={exercise.userState.isFavorite}
            aria-label={exercise.userState.isFavorite ? `Quitar ${exercise.title} de favoritos` : `Guardar ${exercise.title} en favoritos`}
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg border transition focus-ring disabled:opacity-50',
              exercise.userState.isFavorite
                ? 'border-electric/25 bg-electric/8 text-electric'
                : 'border-line text-muted hover:border-line-strong hover:text-ink',
            )}
          >
            <BookmarkSimple size={16} weight={exercise.userState.isFavorite ? 'fill' : 'regular'} aria-hidden="true" />
          </button>
        )}
      </div>

      <h3 className="mt-3.5 text-[16px] font-semibold leading-snug tracking-[-0.02em] text-ink">
        <Link to={`/ejercicios/${exercise.id}`} className="rounded transition hover:text-electric focus-ring">
          {exercise.title}
        </Link>
      </h3>
      <p className="clamp-2 mt-1.5 text-[12.5px] leading-relaxed text-muted">{exercise.statement.replace(/[`*#$]/g, '').slice(0, 170)}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-muted">
        <span className="inline-flex items-center gap-1">
          <TypeIcon size={12} aria-hidden="true" /> {typeLabel[exercise.type]}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} aria-hidden="true" /> {exercise.userState.attempts} {exercise.userState.attempts === 1 ? 'intento' : 'intentos'}
        </span>
        <span className="truncate">{exercise.topic.name}</span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/80 pt-3.5">
        <span className="truncate text-[10.5px] text-muted">{exercise.career.name}</span>
        <Link
          to={`/ejercicios/${exercise.id}`}
          className="inline-flex shrink-0 items-center gap-1 rounded text-[11px] font-semibold text-electric transition hover:underline focus-ring"
        >
          {completed ? 'Repasar' : inProgress ? 'Continuar' : 'Resolver'}
          <ArrowUpRight size={12} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

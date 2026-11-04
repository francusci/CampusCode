import { Link } from 'react-router-dom';
import {
  BookmarkSimple,
  Books,
  CheckCircle,
  Flag,
  LinkSimple,
  Target,
  Trophy,
} from '@phosphor-icons/react';
import { activityLabels, relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { ActivityItem } from '@/lib/types';

const iconByType: Record<string, typeof Books> = {
  exercise_completed: CheckCircle,
  exercise_attempt: Books,
  favorite: BookmarkSimple,
  goal_created: Target,
  goal_completed: Target,
  application: Trophy,
  deliverable: LinkSimple,
  login: Flag,
};

function linkFor(item: ActivityItem) {
  if (item.entity_type === 'exercise' && item.entity_id) return `/ejercicios/${item.entity_id}`;
  if (item.entity_type === 'goal') return '/mi-progreso';
  if (item.entity_type === 'challenge') return '/mis-retos';
  if (item.entity_type === 'application') return '/mis-retos';
  return null;
}

export function ActivityFeed({ items, emptyLabel = 'Aún no hay actividad registrada.' }: { items: ActivityItem[]; emptyLabel?: string }) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-line-strong bg-paper/50 px-4 py-6 text-center text-xs text-muted">{emptyLabel}</p>;
  }

  return (
    <ol className="space-y-0.5">
      {items.map((item, index) => {
        const Icon = iconByType[item.type] || Books;
        const title = typeof item.metadata.title === 'string' ? item.metadata.title : null;
        const detail = typeof item.metadata.subject === 'string' ? item.metadata.subject : typeof item.metadata.company === 'string' ? item.metadata.company : null;
        const href = linkFor(item);
        const content = (
          <>
            <span className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg', item.type === 'exercise_completed' ? 'bg-emerald/10 text-emerald' : item.type === 'application' ? 'bg-violet/10 text-violet' : 'bg-electric/8 text-electric')}>
              <Icon size={14} weight={item.type === 'exercise_completed' ? 'fill' : 'duotone'} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium leading-snug text-ink-soft">{activityLabels[item.type] || item.type}</span>
              {title && <span className="mt-0.5 block truncate text-[11px] text-muted">{title}{detail ? ` · ${detail}` : ''}</span>}
              <span className="mt-0.5 block text-[10px] text-muted/80">{relativeTime(item.created_at)}</span>
            </span>
          </>
        );
        return (
          <li key={`${item.id}-${index}`}>
            {href ? (
              <Link to={href} className="flex items-start gap-2.5 rounded-xl px-2 py-2.5 transition hover:bg-paper focus-ring">{content}</Link>
            ) : (
              <div className="flex items-start gap-2.5 px-2 py-2.5">{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarBlank, Trophy } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { daysUntil, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Challenge } from '@/lib/types';

const logoColors: Record<string, string> = {
  blue: 'bg-[#dbe7ff] text-[#1d4ed8]',
  emerald: 'bg-[#d9f7eb] text-[#087f5b]',
  rose: 'bg-[#ffe4ea] text-[#9f1239]',
  violet: 'bg-[#ece7ff] text-[#6d28d9]',
  amber: 'bg-[#fdf0d5] text-[#92400e]',
  cyan: 'bg-[#d9f4fa] text-[#0e7490]',
};

export function ChallengeCard({ challenge, featured = false }: { challenge: Challenge; featured?: boolean }) {
  const remaining = daysUntil(challenge.deadline);
  const isClosed = challenge.status === 'closed' || remaining < 0;

  return (
    <Link
      to={`/retos/${challenge.slug}`}
      className={cn(
        'group surface hover-lift flex h-full flex-col p-5 focus-ring',
        featured && 'relative overflow-hidden border-electric/20 bg-[linear-gradient(150deg,#ffffff_0%,#f8faff_55%,#eef4ff_100%)] p-6',
      )}
    >
      {featured && <div className="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full bg-electric/10 blur-2xl" aria-hidden="true" />}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="slate">{challenge.category}</Badge>
          {challenge.featured && <Badge tone="violet">Destacado</Badge>}
          {challenge.isDemo && <Badge tone="amber">Ejemplo</Badge>}
        </div>
        <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold', isClosed ? 'border-slate-200 bg-slate-100 text-slate-500' : 'border-emerald/20 bg-emerald/8 text-emerald')}>
          {isClosed ? 'Cerrado' : 'Abierto'}
        </span>
      </div>

      <h3 className={cn('mt-3.5 font-semibold tracking-[-0.02em] text-ink transition group-hover:text-electric', featured ? 'text-xl' : 'text-[17px]')}>
        {challenge.title}
      </h3>
      <p className="clamp-3 mt-2 text-[13px] leading-relaxed text-muted">{challenge.summary}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {challenge.skills.slice(0, featured ? 4 : 3).map((skill) => (
          <span key={skill} className="rounded-md border border-line bg-white/80 px-2 py-0.5 text-[10px] font-medium text-ink-soft">
            {skill}
          </span>
        ))}
        {challenge.skills.length > (featured ? 4 : 3) && (
          <span className="px-1 py-0.5 text-[10px] text-muted">+{challenge.skills.length - (featured ? 4 : 3)}</span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line/80 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold', logoColors[challenge.company.logoColor] || logoColors.blue)}>
            {challenge.company.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="truncate text-[11px] font-medium text-ink-soft">{challenge.company.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-[10px] text-muted">
          {isClosed ? <Trophy size={12} aria-hidden="true" /> : <CalendarBlank size={12} aria-hidden="true" />}
          {isClosed ? 'Finalizado' : `${remaining} días`}
          <ArrowUpRight size={12} className="ml-0.5 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
        </div>
      </div>
      <span className="sr-only">Publicado el {formatDate(challenge.publishedAt)}</span>
    </Link>
  );
}

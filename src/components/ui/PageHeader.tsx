import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CaretRight } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: Array<{ label: string; to?: string }>;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-5 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-2xl">
        {breadcrumb && (
          <nav aria-label="Ruta de navegación" className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            {breadcrumb.map((item, index) => (
              <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
                {index > 0 && <CaretRight size={11} aria-hidden="true" />}
                {item.to ? (
                  <Link to={item.to} className="rounded transition hover:text-electric focus-ring">
                    {item.label}
                  </Link>
                ) : (
                  <span className="font-medium text-ink-soft">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-[2.1rem]">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'blue',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: 'blue' | 'emerald' | 'amber' | 'violet';
}) {
  const tones = {
    blue: 'bg-electric/8 text-electric',
    emerald: 'bg-emerald/10 text-emerald',
    amber: 'bg-amber/10 text-amber',
    violet: 'bg-violet/10 text-violet',
  };
  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {icon && <span className={cn('flex size-9 items-center justify-center rounded-xl', tones[tone])}>{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

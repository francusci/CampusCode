import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';

export function Spinner({ className, label = 'Cargando' }: { className?: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted" role="status">
      <CircleNotch size={18} className={cn('animate-spin text-electric', className)} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function PageLoader({ label = 'Cargando contenido…' }: { label?: string }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <span className="relative flex size-14 items-center justify-center rounded-2xl bg-white shadow-soft">
        <CircleNotch size={26} className="animate-spin text-electric" aria-hidden="true" />
      </span>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-[#e8edf6]', className)} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="surface p-5">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-6 w-4/5" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

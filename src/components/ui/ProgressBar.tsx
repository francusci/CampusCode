import { cn } from '@/lib/cn';

export function ProgressBar({
  value,
  tone = 'blue',
  size = 'md',
  label,
  className,
}: {
  value: number;
  tone?: 'blue' | 'emerald' | 'amber' | 'violet' | 'white';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}) {
  const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const tones = {
    blue: 'bg-gradient-to-r from-electric to-indigo',
    emerald: 'bg-gradient-to-r from-emerald to-[#14b8a6]',
    amber: 'bg-gradient-to-r from-amber to-[#d97706]',
    violet: 'bg-gradient-to-r from-indigo to-violet',
    white: 'bg-white',
  };
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' };
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-[#e9eef7]', heights[size], className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safe}
      aria-label={label || 'Progreso'}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-out', tones[tone])}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

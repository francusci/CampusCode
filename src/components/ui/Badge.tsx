import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate' | 'cyan' | 'navy';

const tones: Record<Tone, string> = {
  blue: 'bg-electric/9 text-electric border-electric/20',
  emerald: 'bg-emerald/10 text-emerald border-emerald/20',
  amber: 'bg-amber/10 text-amber border-amber/20',
  rose: 'bg-rose/10 text-rose border-rose/20',
  violet: 'bg-violet/10 text-violet border-violet/20',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  cyan: 'bg-cyan/10 text-cyan border-cyan/20',
  navy: 'bg-ink text-white border-ink',
};

export function Badge({
  children,
  tone = 'blue',
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.01em] whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

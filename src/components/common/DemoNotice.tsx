import { Flask } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';

export function DemoNotice({
  children,
  className,
  compact = false,
}: {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-2xl border border-amber/20 bg-amber/[0.055] text-amber',
        compact ? 'px-3 py-2 text-[11px] leading-relaxed' : 'px-4 py-3 text-xs leading-relaxed',
        className,
      )}
      role="note"
    >
      <Flask size={compact ? 14 : 16} weight="duotone" className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

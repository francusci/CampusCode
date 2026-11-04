import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

const colors: Record<string, string> = {
  blue: 'bg-[#dbe7ff] text-[#1d4ed8] border-[#bfd4ff]',
  indigo: 'bg-[#e4e2ff] text-[#4338ca] border-[#cdc9ff]',
  violet: 'bg-[#f0e3ff] text-[#6d28d9] border-[#e2ccff]',
  cyan: 'bg-[#d9f5fa] text-[#0e7490] border-[#b8ebf4]',
  emerald: 'bg-[#d9f7eb] text-[#087f5b] border-[#b5efd9]',
  amber: 'bg-[#fdf0d5] text-[#92400e] border-[#f8dfae]',
  rose: 'bg-[#ffe4ea] text-[#9f1239] border-[#ffc9d6]',
  slate: 'bg-[#e9eef6] text-[#44546a] border-[#d5deea]',
  navy: 'bg-ink text-white border-ink',
};

export function Avatar({
  name,
  color = 'blue',
  size = 'md',
  className,
}: {
  name: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    xs: 'size-7 text-[10px]',
    sm: 'size-9 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-14 text-lg',
    xl: 'size-20 text-2xl',
  };
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border font-semibold tracking-wide',
        colors[color] || colors.blue,
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

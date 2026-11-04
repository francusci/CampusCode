import type { Icon } from '@phosphor-icons/react';
import { Briefcase, ChartLineUp, Code, Compass, GearSix, Heartbeat, Scales } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';

const icons: Record<string, Icon> = {
  Code,
  GearSix,
  Briefcase,
  Scales,
  Heartbeat,
  ChartLineUp,
  Compass,
};

const toneClasses: Record<string, string> = {
  blue: 'bg-[#dfe9ff] text-[#1d4ed8]',
  cyan: 'bg-[#d9f4fa] text-[#0e7490]',
  amber: 'bg-[#fdf0d5] text-[#92400e]',
  rose: 'bg-[#ffe4ea] text-[#9f1239]',
  emerald: 'bg-[#d9f7eb] text-[#087f5b]',
  violet: 'bg-[#ece7ff] text-[#6d28d9]',
  slate: 'bg-[#e9eef6] text-[#44546a]',
};

export function CareerIcon({
  name,
  color = 'blue',
  size = 'md',
}: {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const IconComponent = icons[name] || Compass;
  const sizes = {
    sm: 'size-9 rounded-xl',
    md: 'size-12 rounded-2xl',
    lg: 'size-14 rounded-2xl',
  };
  const iconSizes = { sm: 18, md: 23, lg: 27 };
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center', sizes[size], toneClasses[color] || toneClasses.blue)}>
      <IconComponent size={iconSizes[size]} weight="duotone" aria-hidden="true" />
    </span>
  );
}

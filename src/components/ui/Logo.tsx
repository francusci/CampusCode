import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

interface LogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  to?: string;
  className?: string;
}

const sizes = {
  sm: { mark: 30, name: 'text-lg', tagline: 'text-[10px]' },
  md: { mark: 38, name: 'text-[1.35rem]', tagline: 'text-[11px]' },
  lg: { mark: 48, name: 'text-3xl', tagline: 'text-xs' },
};

export function Logo({ variant = 'dark', size = 'md', showTagline = false, to = '/', className }: LogoProps) {
  const scale = sizes[size];
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src="/logo-mark.svg"
        alt=""
        width={scale.mark}
        height={scale.mark}
        className="shrink-0 rounded-[22%]"
        aria-hidden="true"
      />
      <span className="flex flex-col leading-none">
        <span className={cn('font-semibold tracking-[-0.04em]', scale.name)}>
          <span className={variant === 'light' ? 'text-white' : 'text-ink'}>Campus</span>
          <span className={variant === 'light' ? 'text-[#a5b4fc]' : 'text-indigo'}>Code</span>
        </span>
        {showTagline && (
          <span
            className={cn(
              'mt-1 font-medium tracking-[0.005em]',
              scale.tagline,
              variant === 'light' ? 'text-white/60' : 'text-muted',
            )}
          >
            Aprende, conecta y construye tu futuro
          </span>
        )}
      </span>
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} className="rounded-lg focus-ring" aria-label="CampusCode · inicio">
      {content}
    </Link>
  );
}

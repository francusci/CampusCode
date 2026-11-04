import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'navy' | 'secondary' | 'ghost' | 'soft' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition duration-200 focus-ring disabled:cursor-not-allowed disabled:opacity-55 active:translate-y-px whitespace-nowrap';

const variants: Record<Variant, string> = {
  primary:
    'bg-electric text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,0.8)] hover:bg-electric-dark hover:shadow-[0_14px_30px_-12px_rgba(37,99,235,0.9)]',
  navy: 'bg-ink text-white hover:bg-[#142a52] shadow-[0_10px_24px_-14px_rgba(11,27,58,0.9)]',
  secondary: 'bg-white text-ink border border-line-strong hover:border-[#b8c7dd] hover:bg-paper shadow-sm',
  ghost: 'text-ink-soft hover:bg-ink/[0.055] hover:text-ink',
  soft: 'bg-electric/8 text-electric hover:bg-electric/14',
  danger: 'bg-rose text-white hover:bg-[#9f1239]',
  success: 'bg-emerald text-white hover:bg-[#0b8a5f]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export function buttonStyles(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <CircleNotch size={17} className="animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}

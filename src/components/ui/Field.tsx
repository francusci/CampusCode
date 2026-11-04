import { cn } from '@/lib/cn';
import { WarningCircle } from '@phosphor-icons/react';
import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export const inputClass =
  'w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 shadow-[0_1px_1px_rgba(11,27,58,0.03)] transition focus:border-electric focus:outline-none focus:ring-4 focus:ring-electric/10 disabled:bg-paper disabled:text-muted';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ink">
        {label}
        {required && <span className="ml-1 text-rose" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs leading-relaxed text-muted">{hint}</p>}
      {error && (
        <p className="flex items-start gap-1.5 text-xs font-medium text-rose" role="alert">
          <WarningCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(inputClass, invalid && 'border-rose/60 focus:border-rose focus:ring-rose/10', className)}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(inputClass, 'min-h-28 resize-y leading-relaxed', invalid && 'border-rose/60 focus:border-rose focus:ring-rose/10', className)}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(inputClass, 'cursor-pointer pr-9', className)} {...props}>
        {children}
      </select>
    );
  },
);

export function Checkbox({
  label,
  description,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 text-sm text-ink-soft', className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded border-line-strong text-electric accent-[#2563eb] focus:ring-electric/30"
        {...props}
      />
      <span>
        <span className="font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span>}
      </span>
    </label>
  );
}

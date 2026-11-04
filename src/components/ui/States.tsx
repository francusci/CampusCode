import type { Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { WarningCircle, ArrowClockwise } from '@phosphor-icons/react';
import { Button } from './Button';

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
}: {
  icon: Icon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-electric/8 text-electric">
        <IconComponent size={25} weight="duotone" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message = 'No pudimos cargar esta información.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="surface flex flex-col items-center justify-center px-6 py-12 text-center" role="alert">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-rose/10 text-rose">
        <WarningCircle size={24} weight="duotone" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-ink">Algo no salió como esperábamos</h3>
      <p className="mt-1.5 max-w-md text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry} icon={<ArrowClockwise size={15} />}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

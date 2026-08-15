import type { ReactNode } from 'react';
import { cn } from '@it-sum/ui';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-5 border-b border-outline-variant/60 bg-surface-container-lowest px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between md:py-16 lg:px-8', className)}>
      <div className="mx-auto w-full max-w-[var(--it-sum-content-max-width)] md:mx-0">
        {eyebrow != null && <p className="text-label-large text-primary">{eyebrow}</p>}
        <h1 className="mt-2 text-display-small text-on-surface">{title}</h1>
        {description != null && <p className="mt-3 max-w-2xl text-body-large text-on-surface-variant">{description}</p>}
      </div>
      {action != null && <div className="mx-auto w-full max-w-[var(--it-sum-content-max-width)] md:mx-0 md:w-auto">{action}</div>}
    </div>
  );
}

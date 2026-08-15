import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * Loading and empty states.
 *
 * `EmptyState` requires a `reason` because the plan commits to explaining *why* a
 * shelf is empty — unpublished, unmapped, or genuinely absent — instead of showing
 * a blank panel. That distinction is the difference between a student thinking the
 * site is broken and understanding that content is coming.
 */

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('glass-soft animate-pulse rounded-[15px]', className)}
      {...rest}
    />
  );
}

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label: string;
}

const SPINNER_SIZES = { sm: 'size-4 border-2', md: 'size-6 border-2', lg: 'size-10 border-[3px]' };

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'animate-spin rounded-full border-current border-t-transparent text-primary',
          SPINNER_SIZES[size],
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  /**
   * Why the collection is empty. Kept mandatory so no screen can ship with an
   * unexplained blank area.
   */
  reason: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, reason, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'glass-soft flex flex-col items-center justify-center gap-3 rounded-[15px] border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      {icon != null && (
        <span className="text-on-surface-variant [&>svg]:size-10" aria-hidden="true">
          {icon}
        </span>
      )}
      <h3 className="text-title-medium text-on-surface">{title}</h3>
      <p className="max-w-prose text-body-medium text-on-surface-variant">{reason}</p>
      {action != null && <div className="mt-2">{action}</div>}
    </div>
  );
}

export interface AlertProps {
  tone?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  className?: string;
}

const ALERT_TONES = {
  info: 'border-secondary/20 bg-secondary-container/75 text-on-secondary-container',
  success: 'border-tertiary/20 bg-tertiary-container/75 text-on-tertiary-container',
  warning: 'glass-control text-on-surface',
  error: 'border-error/20 bg-error-container/75 text-on-error-container',
};

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('glass-soft rounded-[15px] border px-4 py-3 backdrop-blur-sm', ALERT_TONES[tone], className)}
    >
      {title != null && <p className="text-title-small">{title}</p>}
      <div className="text-body-medium">{children}</div>
    </div>
  );
}

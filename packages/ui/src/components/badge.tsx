import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * Badge — a small, non-interactive status marker.
 *
 * The tone set maps to meanings the product actually needs: `neutral` for facets
 * such as page counts, `warning` for the "not searchable" state on scanned PDFs,
 * `reward` for points and badges, and `info` for the AI-generated marker. Having
 * a fixed vocabulary stops the same idea being coloured three different ways in
 * three different screens.
 */

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'reward' | 'info';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'glass-soft text-on-surface-variant',
  primary: 'border border-primary/20 bg-primary-container/75 text-on-primary-container backdrop-blur-sm',
  success: 'border border-tertiary/20 bg-tertiary-container/75 text-on-tertiary-container backdrop-blur-sm',
  warning: 'glass-control text-on-surface-variant',
  danger: 'border border-error/20 bg-error-container/75 text-on-error-container backdrop-blur-sm',
  reward: 'border border-reward/20 bg-reward-container/75 text-on-reward-container backdrop-blur-sm',
  info: 'border border-secondary/20 bg-secondary-container/75 text-on-secondary-container backdrop-blur-sm',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: ReactNode;
  /** Renders the numeric content with tabular Latin digits, even in Arabic. */
  numeric?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'neutral', icon, numeric = false, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      data-numeric={numeric ? 'true' : undefined}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-[15px] border px-2.5 py-1 text-label-medium backdrop-blur-sm',
        TONE_CLASSES[tone],
        className,
      )}
      {...rest}
    >
      {icon != null && (
        <span className="shrink-0 [&>svg]:size-3.5" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
});

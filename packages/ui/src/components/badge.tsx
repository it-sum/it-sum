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
  neutral: 'bg-surface-highest text-on-surface-variant',
  primary: 'bg-primary-container text-on-primary-container',
  success: 'bg-tertiary-container text-on-tertiary-container',
  warning: 'bg-surface-highest text-on-surface-variant border border-outline',
  danger: 'bg-error-container text-on-error-container',
  reward: 'bg-reward-container text-on-reward-container',
  info: 'bg-secondary-container text-on-secondary-container',
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
        'inline-flex shrink-0 items-center gap-1 rounded-sm px-2 py-0.5 text-label-medium',
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

import { cn } from '../lib/cn';

/**
 * Progress indicators.
 *
 * The ring is used on library cards to show how far through a document a student
 * is, so it must read correctly at 32 px and in both text directions. It is drawn
 * with an SVG stroke rather than a conic gradient because the stroke version
 * antialiases cleanly at small sizes and can be mirrored for RTL by rotating the
 * start angle rather than flipping the element.
 */

export interface ProgressRingProps {
  /** Completion from 0 to 100. Values outside the range are clamped. */
  value: number;
  /** Diameter in pixels. */
  size?: number;
  strokeWidth?: number;
  /** Shows the numeric percentage inside the ring. */
  showLabel?: boolean;
  className?: string;
  /** Accessible label; required because a bare ring means nothing to a reader. */
  label: string;
}

export function ProgressRing({
  value,
  size = 40,
  strokeWidth = 4,
  showLabel = false,
  className,
  label,
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const isComplete = clamped >= 100;

  return (
    <div
      className={cn('relative inline-grid shrink-0 place-items-center', className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-outline-variant"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={cn(
            'transition-[stroke-dashoffset] duration-500 ease-standard',
            isComplete ? 'text-tertiary' : 'text-primary',
          )}
        />
      </svg>
      {showLabel && (
        <span
          data-numeric="true"
          className="absolute text-label-small text-on-surface-variant"
          aria-hidden="true"
        >
          {Math.round(clamped)}
        </span>
      )}
    </div>
  );
}

export interface ProgressBarProps {
  value: number;
  label: string;
  /** Renders an indeterminate animation when the total is unknown. */
  indeterminate?: boolean;
  className?: string;
  tone?: 'primary' | 'reward';
}

export function ProgressBar({
  value,
  label,
  indeterminate = false,
  className,
  tone = 'primary',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn('h-1 w-full overflow-hidden rounded-full bg-surface-highest', className)}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[inline-size] duration-500 ease-standard',
          tone === 'reward' ? 'bg-reward' : 'bg-primary',
          indeterminate && 'animate-pulse',
        )}
        style={{ inlineSize: indeterminate ? '40%' : `${clamped}%` }}
      />
    </div>
  );
}

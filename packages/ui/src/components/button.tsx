import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * MD3 button.
 *
 * The five variants are the specification's own (filled, tonal, outlined, text,
 * elevated) rather than an invented set, plus a `reward` variant that uses the
 * pinned lime accent for celebratory actions. Sizing follows MD3's 40 px default
 * height, and every variant keeps a minimum 44 px touch target on small screens
 * because most students will use this on a phone.
 */

export type ButtonVariant =
  | 'filled'
  | 'tonal'
  | 'outlined'
  | 'text'
  | 'elevated'
  | 'reward'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  filled: 'bg-primary text-on-primary shadow-none hover:shadow-level1',
  tonal: 'bg-secondary-container text-on-secondary-container hover:shadow-level1',
  outlined: 'border border-outline text-primary bg-transparent hover:bg-primary/[0.08]',
  text: 'text-primary bg-transparent hover:bg-primary/[0.08]',
  elevated: 'bg-surface-low text-primary shadow-level1 hover:shadow-level2',
  reward: 'bg-reward-container text-on-reward-container hover:shadow-level1',
  danger: 'bg-error text-on-error hover:shadow-level1',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 min-h-9 px-3 gap-1.5 text-label-large',
  md: 'h-10 min-h-11 sm:min-h-10 px-6 gap-2 text-label-large',
  lg: 'h-12 min-h-12 px-8 gap-2.5 text-title-medium',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon; rendered before the label in the reading direction. */
  startIcon?: ReactNode;
  /** Trailing icon; rendered after the label in the reading direction. */
  endIcon?: ReactNode;
  /** Shows a spinner and blocks interaction without changing layout width. */
  isLoading?: boolean;
  /** Stretches the button to fill its container. */
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'filled',
    size = 'md',
    startIcon,
    endIcon,
    isLoading = false,
    fullWidth = false,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled === true || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cn(
        'state-layer inline-flex items-center justify-center rounded-full font-semibold',
        'transition-[box-shadow,background-color,color] duration-200 ease-standard',
        'disabled:pointer-events-none disabled:opacity-38',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <span
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        startIcon != null && (
          <span className="shrink-0 [&>svg]:size-[1.125rem]" aria-hidden="true">
            {startIcon}
          </span>
        )
      )}
      <span className="truncate">{children}</span>
      {endIcon != null && !isLoading && (
        <span className="shrink-0 [&>svg]:size-[1.125rem]" aria-hidden="true">
          {endIcon}
        </span>
      )}
    </button>
  );
});

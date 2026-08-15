import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
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
  filled: 'border border-primary/30 bg-gradient-to-br from-primary to-primary/85 text-on-primary shadow-level2 backdrop-blur-xl hover:-translate-y-0.5 hover:shadow-level3 active:translate-y-0 active:scale-[0.98]',
  tonal: 'border border-secondary/20 bg-secondary-container/70 text-on-secondary-container shadow-level1 backdrop-blur-xl hover:-translate-y-0.5 hover:bg-secondary-container/85 hover:shadow-level2 active:translate-y-0 active:scale-[0.98]',
  outlined: 'border border-outline-variant/80 bg-surface/45 text-primary shadow-level1 backdrop-blur-xl hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/[0.10] hover:shadow-level2 active:translate-y-0 active:scale-[0.98]',
  text: 'border border-transparent bg-transparent text-primary hover:-translate-y-0.5 hover:border-outline-variant/60 hover:bg-primary/[0.08] hover:shadow-level1 active:translate-y-0 active:scale-[0.98]',
  elevated: 'border border-outline-variant/70 bg-surface/65 text-primary shadow-level2 backdrop-blur-xl hover:-translate-y-0.5 hover:bg-surface-container/85 hover:shadow-level3 active:translate-y-0 active:scale-[0.98]',
  reward: 'border border-reward/30 bg-gradient-to-br from-reward to-reward/80 text-on-reward shadow-level2 backdrop-blur-xl hover:-translate-y-0.5 hover:shadow-level3 active:translate-y-0 active:scale-[0.98]',
  danger: 'border border-error/25 bg-gradient-to-br from-error to-error/85 text-on-error shadow-level2 backdrop-blur-xl hover:-translate-y-0.5 hover:shadow-level3 active:translate-y-0 active:scale-[0.98]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 gap-2 text-label-large',
  md: 'min-h-11 px-5 gap-2 text-label-large',
  lg: 'min-h-12 px-7 gap-2.5 text-title-medium',
};

export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton(
  { variant = 'filled', size = 'md', startIcon, endIcon, fullWidth = false, className, children, ...rest },
  ref,
) {
  return (
    <a ref={ref} className={cn(
      'state-layer inline-flex items-center justify-center rounded-[15px] font-semibold tracking-[-0.01em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-standard',
      VARIANT_CLASSES[variant], SIZE_CLASSES[size], fullWidth && 'w-full', className,
    )} {...rest}>
      {startIcon != null && <span className="shrink-0 [&>svg]:size-[1.125rem]" aria-hidden="true">{startIcon}</span>}
      <span className="truncate">{children}</span>
      {endIcon != null && <span className="shrink-0 [&>svg]:size-[1.125rem]" aria-hidden="true">{endIcon}</span>}
    </a>
  );
});

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
        'state-layer inline-flex items-center justify-center rounded-[15px] font-semibold tracking-[-0.01em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-standard',
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

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * MD3 card and its parts.
 *
 * The three MD3 card styles are all present because they carry different meaning:
 * `filled` for grouped content, `elevated` for content that floats above the
 * page, and `outlined` for low-emphasis lists where too many shadows would turn
 * a library grid into visual noise.
 */

export type CardVariant = 'filled' | 'elevated' | 'outlined';

const CARD_VARIANTS: Record<CardVariant, string> = {
  filled: 'glass-soft',
  elevated: 'glass-surface',
  outlined: 'glass-control',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Adds hover elevation and a pointer cursor for cards that navigate. */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'filled', interactive = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-[15px] text-on-surface',
        'transition-[box-shadow,transform] duration-200 ease-standard',
        CARD_VARIANTS[variant],
        interactive &&
          'cursor-pointer hover:-translate-y-0.5 hover:shadow-level2 focus-within:shadow-level2 motion-reduce:hover:translate-y-0',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...rest }, ref) {
    return <div ref={ref} className={cn('flex flex-col gap-1 p-4 pb-2', className)} {...rest} />;
  },
);

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardBody({ className, ...rest }, ref) {
    return <div ref={ref} className={cn('p-4 pt-2', className)} {...rest} />;
  },
);

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn('flex flex-wrap items-center gap-2 p-4 pt-0', className)}
        {...rest}
      />
    );
  },
);

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h2' | 'h3' | 'h4';
  children: ReactNode;
}

export function CardTitle({ as: Tag = 'h3', className, children, ...rest }: CardTitleProps) {
  return (
    <Tag className={cn('text-title-medium text-on-surface', className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-body-medium text-on-surface-variant', className)} {...rest} />;
}

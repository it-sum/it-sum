import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../lib/cn';

/**
 * Form fields.
 *
 * Each control owns its own label, description and error wiring through
 * `aria-describedby` and `aria-invalid`, so a screen-reader user hears the error
 * without the caller having to remember to connect anything. This is the single
 * most commonly skipped accessibility detail in form code, so it is built in
 * rather than left to discipline.
 */

interface FieldShellProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

function FieldShell({
  id,
  label,
  description,
  error,
  required,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-label-large text-on-surface">
        {label}
        {required === true && (
          <span className="text-error ms-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {description != null && error == null && (
        <p id={`${id}-description`} className="text-body-small text-on-surface-variant">
          {description}
        </p>
      )}
      {error != null && (
        <p id={`${id}-error`} className="text-body-small text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const CONTROL_CLASSES =
  'min-h-12 w-full rounded-xl border bg-surface-lowest px-4 py-3 text-body-large text-on-surface shadow-sm ' +
  'placeholder:text-on-surface-variant/70 transition-[border-color,box-shadow,background-color] duration-200 ease-standard ' +
  'hover:border-primary/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ' +
  'disabled:cursor-not-allowed disabled:opacity-38';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  description?: string;
  error?: string;
  startIcon?: ReactNode;
  containerClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, description, error, startIcon, className, containerClassName, required, ...rest },
  ref,
) {
  const generatedId = useId();
  const id = rest.name != null ? `field-${rest.name}` : generatedId;
  const describedBy = error != null ? `${id}-error` : description != null ? `${id}-description` : undefined;

  return (
    <FieldShell
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
      className={containerClassName}
    >
      <div className="relative flex items-center">
        {startIcon != null && (
          <span
            className="pointer-events-none absolute start-3 text-on-surface-variant [&>svg]:size-4"
            aria-hidden="true"
          >
            {startIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error != null || undefined}
          aria-describedby={describedBy}
          className={cn(
            CONTROL_CLASSES,
            error != null
              ? 'border-error focus:border-error'
              : 'border-outline focus:border-primary',
            startIcon != null && 'ps-9',
            className,
          )}
          {...rest}
        />
      </div>
    </FieldShell>
  );
});

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  description?: string;
  error?: string;
  containerClassName?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField(
    { label, description, error, className, containerClassName, required, rows = 5, ...rest },
    ref,
  ) {
    const generatedId = useId();
    const id = rest.name != null ? `field-${rest.name}` : generatedId;
    const describedBy =
      error != null ? `${id}-error` : description != null ? `${id}-description` : undefined;

    return (
      <FieldShell
        id={id}
        label={label}
        description={description}
        error={error}
        required={required}
        className={containerClassName}
      >
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          required={required}
          aria-invalid={error != null || undefined}
          aria-describedby={describedBy}
          className={cn(
            CONTROL_CLASSES,
            'resize-y',
            error != null ? 'border-error focus:border-error' : 'border-outline focus:border-primary',
            className,
          )}
          {...rest}
        />
      </FieldShell>
    );
  },
);

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  description?: string;
  error?: string;
  containerClassName?: string;
  options: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  {
    label,
    description,
    error,
    className,
    containerClassName,
    required,
    options,
    placeholder,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = rest.name != null ? `field-${rest.name}` : generatedId;
  const describedBy =
    error != null ? `${id}-error` : description != null ? `${id}-description` : undefined;

  return (
    <FieldShell
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
      className={containerClassName}
    >
      <select
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error != null || undefined}
        aria-describedby={describedBy}
        className={cn(
          CONTROL_CLASSES,
          'appearance-none pe-9',
          error != null ? 'border-error focus:border-error' : 'border-outline focus:border-primary',
          className,
        )}
        {...rest}
      >
        {placeholder != null && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
});

export interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label: ReactNode;
  error?: string;
  containerClassName?: string;
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  function CheckboxField({ label, error, className, containerClassName, ...rest }, ref) {
    const generatedId = useId();
    const id = rest.name != null ? `field-${rest.name}` : generatedId;

    return (
      <div className={cn('flex flex-col gap-1', containerClassName)}>
        <div className="flex items-start gap-2.5">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            aria-invalid={error != null || undefined}
            aria-describedby={error != null ? `${id}-error` : undefined}
            className={cn(
              'mt-0.5 size-5 shrink-0 cursor-pointer rounded-md border-2 border-outline bg-surface shadow-sm transition-colors',
              'accent-[var(--md-sys-color-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:ring-offset-2',
              error != null && 'border-error',
              className,
            )}
            {...rest}
          />
          <label htmlFor={id} className="cursor-pointer text-body-medium text-on-surface">
            {label}
          </label>
        </div>
        {error != null && (
          <p id={`${id}-error`} className="text-body-small text-error ms-7" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

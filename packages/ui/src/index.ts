/**
 * `@it-sum/ui` — the IT-SUM design system.
 *
 * Components here are presentation-only: they never fetch, never read global
 * state and never import from `apps/*`. That constraint is what allows the same
 * component to be rendered by a server component, a client component or a test
 * without any environment setup.
 */

export { cn } from './lib/cn';

export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './components/button';
export {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps,
  type CardVariant,
} from './components/card';
export { Badge, type BadgeProps, type BadgeTone } from './components/badge';
export {
  ProgressBar,
  ProgressRing,
  type ProgressBarProps,
  type ProgressRingProps,
} from './components/progress';
export {
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
  type CheckboxFieldProps,
  type SelectFieldProps,
  type TextAreaFieldProps,
  type TextFieldProps,
} from './components/field';
export {
  Alert,
  EmptyState,
  Skeleton,
  Spinner,
  type AlertProps,
  type EmptyStateProps,
  type SpinnerProps,
} from './components/feedback';

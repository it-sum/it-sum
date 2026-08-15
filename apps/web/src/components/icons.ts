export {
  ArrowRight as ArrowInline,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FolderTree,
  Map,
  Route,
  Moon,
  PlayCircle,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';

export type { LucideProps } from 'lucide-react';

/**
 * The alias deliberately maps the directional arrow to Lucide's logical right
 * arrow. CSS and the SVG direction attribute mirror it automatically in RTL via
 * the page's `dir`, so page components never hard-code left/right icon variants.
 */

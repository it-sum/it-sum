'use client';

import {
  BarChart3,
  Bookmark,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

const DASHBOARD_NAV = [
  { href: '/app', key: 'overview', icon: LayoutDashboard },
  { href: '/app/progress', key: 'progress', icon: BarChart3 },
  { href: '/app/bookmarks', key: 'bookmarks', icon: Bookmark },
  { href: '/app/achievements', key: 'achievements', icon: Trophy },
  { href: '/app/settings', key: 'settings', icon: Settings },
  { href: '/admin', key: 'admin', icon: ShieldCheck },
] as const;

export function DashboardSidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const resolvedPath = pathname.replace(/^\/(ar|en)/, '') || '/';

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-60 lg:self-start" aria-label={t('dashboardSidebar.label')}>
      <div className="glass-panel rounded-[15px] p-2">
        <div className="hidden px-3 pb-3 pt-2 lg:block">
          <p className="text-label-medium uppercase tracking-[0.12em] text-primary">IT-SUM</p>
          <p className="mt-1 text-body-small text-on-surface-variant">{t('dashboardSidebar.title')}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label={t('dashboardSidebar.label')}>
          {DASHBOARD_NAV.map(({ href, key, icon: Icon }) => {
            const active = href === '/app' ? resolvedPath === href : resolvedPath.startsWith(href);
            return (
              <Link
                key={key}
                href={href as never}
                aria-current={active ? 'page' : undefined}
                className={`state-layer flex min-w-max items-center gap-3 rounded-[15px] border border-transparent px-3 py-2.5 text-label-large transition-colors ${active ? 'border-secondary/20 bg-secondary-container/80 text-on-secondary-container shadow-level1' : 'text-on-surface-variant hover:border-outline-variant/60 hover:bg-surface-high/70 hover:text-on-surface'}`}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span>{t(`dashboardSidebar.${key}`)}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

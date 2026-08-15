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
      <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low p-2 shadow-level1">
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
                className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-label-large transition-colors ${active ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
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

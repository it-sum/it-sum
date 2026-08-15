'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, Button } from '@it-sum/ui';
import { Link } from '@/i18n/routing';
import { clearDemoSession, getDemoSession, type DemoSession } from '@/lib/demo-auth';
import { useTheme } from './theme-provider';

const PUBLIC_NAV = [
  { href: '/', key: 'home' },
  { href: '/departments', key: 'departments' },
  { href: '/resources', key: 'resources' },
  { href: '/roadmaps', key: 'roadmaps' },
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
] as const;

export function SiteShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<DemoSession | null>(null);

  const alternateLocale = currentLocale === 'ar' ? 'en' : 'ar';
  const alternateLabel = currentLocale === 'ar' ? 'English' : 'العربية';
  const resolvedPath = pathname.replace(/^\/(ar|en)/, '') || '/';
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const themeLabel = theme === 'dark' ? t('theme.light') : t('theme.dark');
  const isAuthenticated = session !== null;
  const isWorkspace = resolvedPath === '/app' || resolvedPath.startsWith('/app/') || resolvedPath === '/student' || resolvedPath.startsWith('/student/') || resolvedPath === '/admin' || resolvedPath.startsWith('/admin/');

  useEffect(() => {
    setSession(getDemoSession());
    const onSessionChange = () => setSession(getDemoSession());
    window.addEventListener('it_sum_session_change', onSessionChange);
    window.addEventListener('storage', onSessionChange);
    return () => {
      window.removeEventListener('it_sum_session_change', onSessionChange);
      window.removeEventListener('storage', onSessionChange);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, isAuthenticated]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  function handleLogout() {
    clearDemoSession();
    setMenuOpen(false);
    router.push(`/${currentLocale}/login`);
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-background text-on-background">
      <a href="#main-content" className="sr-only-focusable fixed start-4 top-4 z-50 rounded-[15px] bg-primary px-4 py-2 text-on-primary">
        {t('nav.skipToContent')}
      </a>

      {!isWorkspace && <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[var(--it-sum-content-max-width)]">
          <div className="glass-panel flex min-h-16 items-center gap-2 rounded-[15px] px-3 sm:gap-3 sm:px-4">
            <Link href="/" aria-label={t('meta.siteName')} className="group flex shrink-0 items-center gap-2 rounded-[15px] px-1.5 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <span className="glass-control grid size-9 place-items-center overflow-hidden rounded-[15px] p-0 shadow-level1 transition-transform duration-200 group-hover:-rotate-3 sm:size-10">
                <Image src="/brand/it-sum-logo.webp" alt="" width={40} height={40} className="size-full object-cover" priority />
              </span>
              <span className="hidden text-title-medium tracking-tight text-on-surface sm:inline">IT<span className="text-primary">-SUM</span></span>
            </Link>

            <div className="hidden h-7 w-px bg-outline-variant/60 lg:block" aria-hidden="true" />

            <nav aria-label={t('nav.mainNavigation')} className="hidden flex-1 items-center gap-1 lg:flex">
              {PUBLIC_NAV.map((item) => {
                const active = item.href === '/' ? resolvedPath === '/' : resolvedPath.startsWith(item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`state-layer relative rounded-[15px] border border-transparent px-3 py-2 text-label-large transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary 2xl:px-3.5 ${active ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-high hover:text-on-surface'}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                );
              })}
            </nav>

            <div className="ms-auto flex items-center gap-1.5">
              <Badge tone="success" className="hidden rounded-full px-2.5 py-1 text-label-small xl:inline-flex">Open source</Badge>
              <Link href={resolvedPath as never} locale={alternateLocale} className="glass-control rounded-[15px] px-2.5 py-2 text-label-large text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={alternateLabel}>
                {alternateLabel}
              </Link>
              <button
                type="button"
                onClick={() => setTheme(nextTheme)}
                className="glass-control grid size-10 place-items-center rounded-[15px] text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={t('theme.toggle')}
                title={themeLabel}
              >
                {theme === 'dark' ? <Sun className="size-[1.125rem]" aria-hidden="true" /> : <Moon className="size-[1.125rem]" aria-hidden="true" />}
              </button>
              {isAuthenticated ? (
                <Button type="button" size="sm" variant="outlined" onClick={handleLogout}>{t('nav.logout')}</Button>
              ) : (
                <Link href="/login" className="hidden md:inline-flex">
                  <Button size="sm" variant="filled">{t('nav.login')}</Button>
                </Link>
              )}
              <button
                type="button"
                className="glass-control grid size-10 place-items-center rounded-[15px] text-on-surface transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
                title={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              >
                {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {menuOpen && !isAuthenticated && (
            <>
              <button type="button" aria-label={t('nav.closeMenu')} className="fixed inset-0 top-24 z-30 bg-scrim/25 lg:hidden" onClick={() => setMenuOpen(false)} />
              <nav id="mobile-navigation" aria-label={t('nav.mainNavigation')} className="glass-panel relative z-40 mt-2 rounded-[15px] p-2 lg:hidden">
                <div className="flex flex-col gap-1">
                  {PUBLIC_NAV.map((item) => {
                    const active = item.href === '/' ? resolvedPath === '/' : resolvedPath.startsWith(item.href);
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={`state-layer rounded-[15px] border border-transparent px-4 py-3 text-title-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? 'bg-primary-container text-on-primary-container' : 'text-on-surface hover:bg-surface-high'}`}
                      >
                        {t(`nav.${item.key}`)}
                      </Link>
                    );
                  })}
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="mt-1 rounded-[15px] border border-primary/20 bg-primary px-4 py-3 text-center text-label-large text-on-primary shadow-level1 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    {t('nav.login')}
                  </Link>
                </div>
              </nav>
            </>
          )}
        </div>
      </header>}

      <main id="main-content" tabIndex={-1}>{children}</main>

      {!isWorkspace && <footer className="glass-panel mt-20 rounded-none border-x-0 border-b-0">
        <div className="mx-auto grid max-w-[var(--it-sum-content-max-width)] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/brand/it-sum-logo.webp" alt="" width={36} height={36} className="size-9 rounded-[15px] object-cover" />
              <span className="text-title-medium text-on-surface">IT<span className="text-primary">-SUM</span></span>
            </div>
            <p className="mt-3 max-w-sm text-body-medium text-on-surface-variant">{t('meta.description')}</p>
            <p className="mt-4 text-body-small text-on-surface-variant">{t('common.poweredBy')}</p>
          </div>
          <div>
            <h2 className="text-title-small text-on-surface">{t('footer.quickLinks')}</h2>
            <div className="mt-3 flex flex-col items-start gap-2">
              <Link href="/departments" className="text-body-medium text-on-surface-variant hover:text-primary">{t('nav.departments')}</Link>
              <Link href="/resources" className="text-body-medium text-on-surface-variant hover:text-primary">{t('nav.resources')}</Link>
              <Link href="/roadmaps" className="text-body-medium text-on-surface-variant hover:text-primary">{t('nav.roadmaps')}</Link>
              <Link href="/about" className="text-body-medium text-on-surface-variant hover:text-primary">{t('nav.about')}</Link>
            </div>
          </div>
          <div>
            <h2 className="text-title-small text-on-surface">{t('footer.legal')}</h2>
            <div className="mt-3 flex flex-col items-start gap-2">
              <Link href="/contact" className="text-body-medium text-on-surface-variant hover:text-primary">{t('nav.contact')}</Link>
              <span className="text-body-medium text-on-surface-variant">{t('footer.privacy')}</span>
              <span className="text-body-medium text-on-surface-variant">{t('footer.contentPolicyTitle')}</span>
            </div>
          </div>
        </div>
        <div className="border-t border-outline-variant/60 px-4 py-4 text-center text-body-small text-on-surface-variant">{t('footer.rights')}</div>
      </footer>}
    </div>
  );
}

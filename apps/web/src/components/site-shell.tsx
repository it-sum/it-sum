'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, Moon, Sun, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@it-sum/ui';
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
  const isAuthenticated = session !== null;

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
      <a href="#main-content" className="sr-only-focusable fixed start-4 top-4 z-50 rounded-[15px] bg-primary px-4 py-2 text-on-primary shadow-level2">
        {t('nav.skipToContent')}
      </a>

      <header className="glass-surface sticky top-0 z-40 border-x-0 border-t-0">
        <div className="mx-auto flex min-h-16 max-w-[var(--it-sum-content-max-width)] items-center gap-4 px-4 py-2 sm:px-6 lg:px-8">
          <Link href="/" aria-label={t('meta.siteName')} className="group flex shrink-0 items-center gap-3 rounded-[15px]">
            <span className="grid size-10 place-items-center rounded-[15px] bg-primary p-1 shadow-level1 transition-transform duration-200 ease-standard group-hover:-rotate-3">
              <Image src="/brand/it-sum-logo.webp" alt="" width={34} height={34} className="size-8 rounded-[15px] object-cover" priority />
            </span>
            <span className="hidden text-title-medium tracking-tight text-on-surface sm:inline">IT-SUM<span className="text-primary">.</span></span>
          </Link>

          {!isAuthenticated && (
            <nav aria-label={t('nav.mainNavigation')} className="hidden flex-1 items-center justify-center gap-1 xl:flex">
              {PUBLIC_NAV.map((item) => {
                const active = item.href === '/' ? resolvedPath === '/' : resolvedPath.startsWith(item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`state-layer rounded-[15px] px-4 py-2.5 text-label-large transition-colors ${active ? 'glass-soft text-on-secondary-container shadow-level1' : 'text-on-surface-variant hover:text-on-surface'}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="ms-auto flex items-center gap-1">
            {isAuthenticated ? (
              <Button type="button" size="sm" variant="outlined" onClick={handleLogout}>{t('nav.logout')}</Button>
            ) : (
              <>
                <Link href={resolvedPath as never} locale={alternateLocale} className="state-layer rounded-[15px] px-3 py-2 text-label-large text-on-surface-variant hover:text-on-surface" aria-label={alternateLabel}>
                  {alternateLabel}
                </Link>
                <button type="button" onClick={() => setTheme(nextTheme)} className="state-layer grid size-10 place-items-center rounded-[15px] border border-outline-variant/50 text-on-surface-variant hover:text-on-surface" aria-label={t('theme.toggle')} title={theme === 'dark' ? t('theme.light') : t('theme.dark')}>
                  {theme === 'dark' ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
                </button>
                <Link href="/login" className="hidden md:inline-flex"><Button size="sm" variant="outlined">{t('nav.login')}</Button></Link>
                <button type="button" className="state-layer grid size-11 place-items-center rounded-[15px] border border-outline-variant/50 text-on-surface xl:hidden" title={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')} onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}>
                  {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
                </button>
              </>
            )}
          </div>
        </div>

        {menuOpen && !isAuthenticated && (
          <>
            <button type="button" aria-label={t('nav.closeMenu')} className="fixed inset-0 top-16 z-30 bg-scrim/30 backdrop-blur-sm xl:hidden" onClick={() => setMenuOpen(false)} />
            <nav id="mobile-navigation" aria-label={t('nav.mainNavigation')} className="glass-surface relative z-40 border-x-0 border-b-0 px-4 py-4 shadow-level2 xl:hidden">
              <div className="mx-auto flex max-w-[var(--it-sum-content-max-width)] flex-col gap-1">
                {PUBLIC_NAV.map((item) => {
                  const active = item.href === '/' ? resolvedPath === '/' : resolvedPath.startsWith(item.href);
                  return <Link key={item.key} href={item.href} onClick={() => setMenuOpen(false)} aria-current={active ? 'page' : undefined} className={`state-layer rounded-[15px] px-4 py-3 text-title-small ${active ? 'glass-soft text-on-secondary-container' : 'text-on-surface hover:bg-surface-high'}`}>{t(`nav.${item.key}`)}</Link>;
                })}
                <Link href="/login" onClick={() => setMenuOpen(false)} className="mt-3 rounded-[15px] border border-primary/20 bg-primary px-4 py-3 text-center text-label-large text-on-primary shadow-level1 transition-transform hover:-translate-y-0.5">{t('nav.login')}</Link>
              </div>
            </nav>
          </>
        )}
      </header>

      <main id="main-content" tabIndex={-1}>{children}</main>

      <footer className="glass-soft mt-20 rounded-t-[15px] border-x-0 border-b-0">
        <div className="mx-auto grid max-w-[var(--it-sum-content-max-width)] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_0.8fr_0.8fr] lg:px-8 lg:py-16">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-[15px] border border-outline-variant/50 bg-surface/40 p-1"><Image src="/brand/it-sum-logo.webp" alt="" width={34} height={34} className="size-8 rounded-[15px] object-cover" /></span>
              <span className="text-title-medium text-on-surface">IT-SUM<span className="text-primary">.</span></span>
            </div>
            <p className="mt-5 max-w-sm text-body-medium text-on-surface-variant">{t('meta.description')}</p>
            <p className="mt-5 text-body-small text-on-surface-variant">{t('common.poweredBy')}</p>
          </div>
          <div>
            <h2 className="text-title-small text-on-surface">{t('footer.quickLinks')}</h2>
            <div className="mt-4 flex flex-col items-start gap-3">{PUBLIC_NAV.slice(1, 5).map((item) => <Link key={item.key} href={item.href} className="text-body-medium text-on-surface-variant transition-colors hover:text-primary">{t(`nav.${item.key}`)}</Link>)}</div>
          </div>
          <div>
            <h2 className="text-title-small text-on-surface">{t('footer.legal')}</h2>
            <div className="mt-4 flex flex-col items-start gap-3">
              <Link href="/contact" className="inline-flex items-center gap-1 text-body-medium text-on-surface-variant transition-colors hover:text-primary">{t('nav.contact')}<ArrowUpRight className="size-3" aria-hidden="true" /></Link>
              <span className="text-body-medium text-on-surface-variant">{t('footer.privacy')}</span>
              <span className="text-body-medium text-on-surface-variant">{t('footer.contentPolicyTitle')}</span>
            </div>
          </div>
        </div>
        <div className="border-t border-outline-variant/60 px-4 py-4 text-center text-body-small text-on-surface-variant">{t('footer.rights')}</div>
      </footer>
    </div>
  );
}


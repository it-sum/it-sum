'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@it-sum/ui';
import { Link } from '@/i18n/routing';
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
  const currentLocale = useLocale();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const alternateLocale = currentLocale === 'ar' ? 'en' : 'ar';
  const alternateLabel = currentLocale === 'ar' ? 'English' : 'العربية';
  const resolvedPath = pathname.replace(/^\/(ar|en)/, '') || '/';
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <div className="min-h-dvh bg-background text-on-background">
      <a href="#main-content" className="sr-only-focusable fixed start-4 top-4 z-50 rounded-sm bg-primary px-4 py-2 text-on-primary">
        {t('nav.skipToContent')}
      </a>

      <header className="sticky top-0 z-40 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[var(--it-sum-content-max-width)] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label={t('meta.siteName')} className="flex shrink-0 items-center gap-2 rounded-md">
            <Image src="/brand/it-sum-logo.webp" alt="" width={42} height={42} className="size-10 rounded-full object-cover" priority />
            <span className="hidden text-title-medium text-primary sm:inline">IT-SUM</span>
          </Link>

          <nav aria-label={t('nav.mainNavigation')} className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {PUBLIC_NAV.map((item) => {
              const active = item.href === '/' ? resolvedPath === '/' : resolvedPath.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`state-layer rounded-full px-4 py-2 text-label-large transition-colors ${active ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              );
            })}
          </nav>

          <div className="ms-auto flex items-center gap-1">
            <Link href={resolvedPath as never} locale={alternateLocale} className="state-layer rounded-full px-3 py-2 text-label-large text-on-surface-variant hover:text-on-surface" aria-label={alternateLabel}>
              {alternateLabel}
            </Link>
            <button
              type="button"
              onClick={() => setTheme(nextTheme)}
              className="state-layer grid size-10 place-items-center rounded-full text-on-surface-variant hover:text-on-surface"
              aria-label={t('theme.toggle')}
              title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
            >
              {theme === 'dark' ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
            </button>
            <Link href="/login" className="hidden sm:inline-flex">
              <Button size="sm" variant="outlined">{t('nav.login')}</Button>
            </Link>
            <button
              type="button"
              className="state-layer grid size-11 place-items-center rounded-full text-on-surface lg:hidden"
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

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label={t('nav.closeMenu')}
              className="fixed inset-0 top-16 z-30 bg-scrim/30 lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <nav id="mobile-navigation" aria-label={t('nav.mainNavigation')} className="relative z-40 border-t border-outline-variant/60 bg-surface px-4 py-3 shadow-level2 lg:hidden">
              <div className="mx-auto flex max-w-[var(--it-sum-content-max-width)] flex-col gap-1">
                {PUBLIC_NAV.map((item) => {
                  const active = item.href === '/' ? resolvedPath === '/' : resolvedPath.startsWith(item.href);
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`state-layer rounded-md px-4 py-3 text-title-small ${active ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface hover:bg-surface-high'}`}
                    >
                      {t(`nav.${item.key}`)}
                    </Link>
                  );
                })}
                <Link href="/login" onClick={() => setMenuOpen(false)} className="mt-2 rounded-full bg-primary px-4 py-3 text-center text-label-large text-on-primary">
                  {t('nav.login')}
                </Link>
              </div>
            </nav>
          </>
        )}
      </header>

      <main id="main-content" tabIndex={-1}>{children}</main>

      <footer className="mt-20 border-t border-outline-variant/60 bg-surface-container">
        <div className="mx-auto grid max-w-[var(--it-sum-content-max-width)] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/brand/it-sum-logo.webp" alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
              <span className="text-title-medium text-primary">IT-SUM</span>
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
        <div className="border-t border-outline-variant/60 px-4 py-4 text-center text-body-small text-on-surface-variant">
          {t('footer.rights')}
        </div>
      </footer>
    </div>
  );
}

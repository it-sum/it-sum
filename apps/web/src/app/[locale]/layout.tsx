import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { LOCALE_DIRECTION, LOCALES, type Locale } from '@it-sum/shared';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteShell } from '@/components/site-shell';
import { routing } from '@/i18n/routing';
import '@it-sum/ui/styles.css';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();

  const locale = rawLocale as Locale;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: {
      default: t('siteName'),
      template: `%s | ${t('siteName')}`,
    },
    description: t('description'),
    alternates: {
      languages: {
        ar: '/ar',
        en: '/en',
      },
    },
    openGraph: {
      type: 'website',
      siteName: t('siteName'),
      title: t('tagline'),
      description: t('description'),
      locale,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fafdfb',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();

  const locale = rawLocale as Locale;
  const direction = LOCALE_DIRECTION[locale];
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            <SiteShell>{children}</SiteShell>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}


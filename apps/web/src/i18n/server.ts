import { getLocale, getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { DEFAULT_LOCALE, type Locale } from '@it-sum/shared';
import { routing } from './routing';

/**
 * Server-page translation helper.
 *
 * Static generation can evaluate a bare `getTranslations()` before the nested
 * locale layout has established its request context, which silently falls back
 * to Arabic. Reading the locale explicitly after `setRequestLocale` makes `/en`
 * and `/ar` deterministic and prevents a bilingual page from mixing languages.
 */
export async function getPageTranslations(requestedLocale?: string) {
  const requested = requestedLocale ?? (await getLocale());
  const locale: Locale = hasLocale(routing.locales, requested) ? requested : DEFAULT_LOCALE;
  return { locale, t: await getTranslations({ locale }) };
}

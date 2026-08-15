import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { DEFAULT_LOCALE, type Locale } from '@it-sum/shared';
import { routing } from './routing';

/**
 * Per-request i18n configuration.
 *
 * Formats are declared centrally rather than at each call site so that a date or
 * a percentage looks identical everywhere. Numerals stay Latin in Arabic copy
 * (`latn`) because students read scores, page numbers and file sizes far more
 * fluently that way, and mixing Arabic-Indic digits into an RTL line invites
 * bidirectional reordering bugs.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = hasLocale(routing.locales, requested) ? requested : DEFAULT_LOCALE;

  const messages = (await import(`../../messages/${locale}.json`)) as { default: object };

  return {
    locale,
    messages: messages.default,
    timeZone: 'Africa/Cairo',
    now: new Date(),
    formats: {
      dateTime: {
        short: { day: 'numeric', month: 'short', year: 'numeric', numberingSystem: 'latn' },
        long: { dateStyle: 'long', numberingSystem: 'latn' },
        withTime: { dateStyle: 'medium', timeStyle: 'short', numberingSystem: 'latn' },
      },
      number: {
        integer: { maximumFractionDigits: 0, numberingSystem: 'latn' },
        percent: { style: 'percent', maximumFractionDigits: 0, numberingSystem: 'latn' },
        oneDecimal: { maximumFractionDigits: 1, numberingSystem: 'latn' },
      },
      list: {
        conjunction: { style: 'long', type: 'conjunction' },
      },
    },
  };
});

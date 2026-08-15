import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { DEFAULT_LOCALE, LOCALES } from '@it-sum/shared';

/**
 * Locale routing.
 *
 * Arabic is the default and is *not* hidden from the URL: `/ar/...` and `/en/...`
 * are both explicit. An always-visible prefix costs one redirect on the root path
 * but removes a whole class of confusion where a shared link renders in the
 * wrong language because it inherited a cookie from whoever pasted it.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: true,
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { LOCALES } from '@it-sum/shared';
import { routing } from './i18n/routing';

/**
 * Edge request handling.
 *
 * Next 16 renamed `middleware.ts` to `proxy.ts`; the exported function must be
 * named `proxy`. Two concerns are handled here and nothing else, because every
 * millisecond spent in this file is paid on every single request:
 *
 *   1. Locale negotiation and prefixing, delegated to next-intl.
 *   2. A cheap presence check on the session cookie for `/app` and `/admin`, so
 *      an unauthenticated visitor is redirected before any page work happens.
 *
 * The cookie is deliberately *not* verified here. Signature verification belongs
 * to the API, which owns the JWKS; duplicating it at the edge would mean two
 * places to get crypto wrong. A forged cookie therefore reaches the page shell
 * and is rejected on the first data fetch, which is the correct trade: the edge
 * check exists to improve the experience of legitimate users, not to be the
 * security boundary.
 */

const intlMiddleware = createIntlMiddleware(routing);

const SESSION_COOKIE = 'it_sum_session';
const LOCALE_SEGMENT = `(?:${LOCALES.join('|')})`;
const PROTECTED_PATTERN = new RegExp(`^/${LOCALE_SEGMENT}/(app|admin)(?:/|$)`);
const GUEST_ONLY_PATTERN = new RegExp(`^/${LOCALE_SEGMENT}/(login|register|forgot-password)(?:/|$)`);

export function proxy(request: NextRequest): NextResponse {
  const response = intlMiddleware(request);

  // A redirect from locale negotiation must win; re-deriving the path from a
  // rewritten response would send the visitor into a redirect loop.
  if (response.headers.has('location')) {
    return response;
  }

  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (PROTECTED_PATTERN.test(pathname) && !hasSession) {
    const locale = pathname.split('/')[1] ?? routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (GUEST_ONLY_PATTERN.test(pathname) && hasSession) {
    const locale = pathname.split('/')[1] ?? routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/app`, request.url));
  }

  return response;
}

export const config = {
  /**
   * Everything except Next internals, the API namespace and static assets. Files
   * are matched by extension so that `/logo.webp` and `/robots.txt` are served
   * without paying for locale negotiation.
   */
  matcher: ['/((?!api|_next|_vercel|.*\\.[^/]+$).*)'],
};

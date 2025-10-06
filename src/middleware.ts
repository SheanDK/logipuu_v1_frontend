//frontend/src/middleware.ts

import { NextResponse, NextRequest } from 'next/server';
import { languages, fallbackLng } from '@/i18n/settings';

/**
 * Determine the preferred language for the request.
 * Priority:
 *  1) i18n cookie (i18nextLng or lng)
 *  2) Accept-Language header
 *  3) Fallback language
 */
function preferredLang(req: NextRequest) {
  // 1) Try language from cookie (normalize like "fi-FI" -> "fi")
  const cookie = req.cookies.get('i18nextLng')?.value || req.cookies.get('lng')?.value;
  const fromCookie = cookie?.split('-')[0];
  if (fromCookie && languages.includes(fromCookie)) return fromCookie;

  // 2) Try from Accept-Language header (e.g., "en-US,en;q=0.9" -> "en")
  const accept = req.headers.get('accept-language') ?? '';
  const pref = accept.split(',')[0]?.split('-')[0];
  if (pref && languages.includes(pref)) return pref;

  // 3) Fallback if nothing matched
  return fallbackLng;
}

/**
 * Middleware that prefixes routes with the detected language code.
 * Examples:
 *   "/"           -> "/fi/"
 *   "/login"      -> "/fi/login"
 *   "/dashboard"  -> "/fi/dashboard"
 *
 * It **skips** requests that:
 *   - already include a supported language prefix (e.g., "/fi/...")
 *   - are for Next.js internals or static assets
 *   - are API routes
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next.js internals, API, static files, and requests that already have a language prefix
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    languages.some(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  ) {
    return NextResponse.next();
  }

  // Redirect to the same path with a language prefix (e.g., "/login" -> "/fi/login")
  const lng = preferredLang(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${lng}${pathname}`;
  return NextResponse.redirect(url);
}

/**
 * Configure which paths this middleware runs on.
 * - It matches everything **except** Next.js internals and file requests with an extension.
 * - Adjust this if you have additional static paths to exclude.
 */
export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};

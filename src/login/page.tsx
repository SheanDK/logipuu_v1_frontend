// frontend/src/app/login/page.tsx

/*
This file handles the root `/login` route and immediately server-redirects
to the language-prefixed login route (e.g., `/fi/login`, `/en/login`).
*/

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { languages, fallbackLng } from '@/i18n/settings';

/*
 Determine the language in priority order:
 1) i18n cookies (i18next / i18nextLng / lng)
 2) `Accept-Language` header
 3) fallback language from settings

 Normalizes values like "fi-FI" to "fi" and checks against supported languages.
 */


function pickLang(cookieLngRaw: string | undefined, acceptLanguage: string | null) {
  const fromCookie = (cookieLngRaw ?? '').split('-')[0].toLowerCase();
  if (fromCookie && languages.includes(fromCookie)) return fromCookie;

  const fromHeader = (acceptLanguage ?? '')
    .split(',')[0]
    ?.split('-')[0]
    ?.toLowerCase() || '';
  if (languages.includes(fromHeader)) return fromHeader;

  return fallbackLng;
}

export default async function LoginRootRedirect() {

  const cookieStore = await cookies();
  const hdrs = await headers();

  const cookieLng =
    cookieStore.get('i18next')?.value ??
    cookieStore.get('i18nextLng')?.value ??
    cookieStore.get('lng')?.value;

  const accept = hdrs.get('accept-language');

  const lng = pickLang(cookieLng, accept);

  // Redirect `/login` -> `/{lng}/login` (e.g., `/fi/login`)
  redirect(`/${lng}/login`);
}

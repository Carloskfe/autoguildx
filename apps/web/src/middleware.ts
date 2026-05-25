import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  // localeDetection: true reads the NEXT_LOCALE cookie set by LocaleSwitcher,
  // then falls back to the Accept-Language header if no cookie is present.
  localeDetection: true,
  localePrefix: 'always',
});

export const config = {
  // Match all paths except API routes, Next.js internals, and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

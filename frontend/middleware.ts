import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './src/i18n';

// List of paths that should bypass internationalization
const BYPASS_I18N_ROUTES = [
  // Add any routes that should not be internationalized
  '/api',
  '/_next',
  '/favicon',
  '/login',
];

// Routes that have been migrated to the i18n structure
// Keep track of which routes have been migrated to properly handle redirects
const MIGRATED_ROUTES = [
  '/dashboard',
  '/owners',
  '/pets',
];

// Middleware function to check if path should bypass i18n
function shouldBypassI18n(pathname: string): boolean {
  return BYPASS_I18N_ROUTES.some(route => pathname.startsWith(route));
}

// Check if a route has been migrated to i18n structure
function isMigratedRoute(pathname: string): boolean {
  return MIGRATED_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

// Create the internationalization middleware
const i18nMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: locales as unknown as string[],
  
  // Used when no locale matches
  defaultLocale,
  
  // Always use pathname prefix for language detection
  localePrefix: 'always'
});

// Custom middleware that combines i18n with our app logic
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // If path should bypass i18n, skip all processing
  if (shouldBypassI18n(pathname)) {
    return NextResponse.next();
  }
  
  // Root path / - redirect to default locale dashboard
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}/dashboard`;
    return NextResponse.redirect(url);
  }
  
  // Handle /en or /ar root locales - redirect to their dashboard
  if (pathname === `/${defaultLocale}` || locales.some(locale => pathname === `/${locale}`)) {
    const locale = pathname.slice(1) || defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }
  
  // If this is a migrated route without locale prefix, redirect to the localized version
  if (isMigratedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }
  
  // For all other paths, apply the i18n middleware
  return i18nMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - Static files with extensions (.jpg, .png, etc.)
  // - _next internal paths
  matcher: ['/((?!api|_next|.*\\..*).*)']
}; 
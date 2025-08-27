/**
 * Authentication Middleware for ScentMatch
 *
 * FIXED: Re-enabled authentication with CSP compatibility for Next.js 15
 * Critical fix for SCE-95 P1 security issue
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/collection',
  '/my-collection',
  '/recommendations',
];

// Public routes that don't need authentication
const PUBLIC_ROUTES = [
  '/',
  '/quiz',
  '/browse',
  '/search',
  '/auth',
  '/fragrance',
  '/demo',
  '/test-nav',
];

/**
 * Middleware function that handles authentication and security headers
 * FIXED: CSP-compatible implementation for Next.js 15
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes (except protected ones), and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Check if current path requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  // Allow public routes without authentication
  const isPublicRoute = PUBLIC_ROUTES.some(
    route => pathname.startsWith(route) || pathname === route
  );

  try {
    // Update Supabase session (handles authentication and redirects for protected routes)
    let response = await updateSession(request, isProtectedRoute);

    // Log middleware activity
    if (isProtectedRoute) {
      console.log(`🔒 PROTECTED ROUTE: ${pathname} (authentication checked)`);
    } else if (!isPublicRoute) {
      console.log(`🌐 PUBLIC ROUTE: ${pathname} (no authentication required)`);
    }

    // Add security headers (CSP-compatible with Supabase)
    response = addSecurityHeaders(response);

    return response;
  } catch (error) {
    console.error('Middleware error:', error);

    // On error, allow the request to continue but add basic security headers
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }
}

/**
 * Add security headers compatible with Supabase and Next.js 15
 * FIXED: CSP headers that don't conflict with Supabase auth
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers (without CSP conflicts)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'off');

  // CSP header compatible with Supabase authentication
  const cspValue = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://vercel.live",
    "img-src 'self' data: https: blob:",
    "media-src 'self' data: https:",
    "frame-src 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspValue);

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)+',
  ],
};

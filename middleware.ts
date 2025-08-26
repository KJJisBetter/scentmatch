import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';
// Note: Edge runtime is configured via config.matcher, not export const runtime

/**
 * Generate cryptographic nonce for CSP using Web Crypto API (Edge Runtime compatible)
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Security logging helper - only logs in development
 */
function logSecurityEvent(event: string, details?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SECURITY] ${event}`, details);
  }
  // In production, would integrate with security monitoring service
}

/**
 * URL redirect rules for common broken patterns (SCE-63)
 */
function getUrlRedirects(pathname: string): {
  shouldRedirect: boolean;
  destination?: string;
} {
  const lowercasePath = pathname.toLowerCase();

  // Handle common authentication redirects
  const authRedirects: Record<string, string> = {
    '/login': '/auth/login',
    '/signin': '/auth/login',
    '/signup': '/auth/signup',
    '/register': '/auth/signup',
    '/reset-password': '/auth/reset',
    '/forgot-password': '/auth/reset',
  };

  if (authRedirects[lowercasePath]) {
    return { shouldRedirect: true, destination: authRedirects[lowercasePath] };
  }

  // Handle missing navigation routes identified in audit
  const missingRouteRedirects: Record<string, string> = {
    '/samples': '/browse?category=samples',
    '/profile': '/dashboard',
    '/account': '/dashboard',
    '/settings': '/dashboard',
    '/collection': '/dashboard/collection',
  };

  if (missingRouteRedirects[lowercasePath]) {
    return {
      shouldRedirect: true,
      destination: missingRouteRedirects[lowercasePath],
    };
  }

  // Handle fragrance-related URL variations
  const fragranceRedirects: Record<string, string> = {
    '/fragrances': '/browse',
    '/perfumes': '/browse',
    '/scents': '/browse',
    '/products': '/browse',
  };

  if (fragranceRedirects[lowercasePath]) {
    return {
      shouldRedirect: true,
      destination: fragranceRedirects[lowercasePath],
    };
  }

  // Handle case sensitivity issues
  if (pathname !== lowercasePath && !/^\/api\//.test(pathname)) {
    return { shouldRedirect: true, destination: lowercasePath };
  }

  // Handle trailing slash issues (remove trailing slash except for root)
  if (pathname !== '/' && pathname.endsWith('/')) {
    return { shouldRedirect: true, destination: pathname.slice(0, -1) };
  }

  // Handle double slashes
  if (pathname.includes('//')) {
    const cleaned = pathname.replace(/\/+/g, '/');
    return { shouldRedirect: true, destination: cleaned };
  }

  // Handle legacy product URLs (example: /product/123 -> /browse)
  if (pathname.match(/^\/product\/\w+$/)) {
    return { shouldRedirect: true, destination: '/browse' };
  }

  // Handle brand-specific URLs (example: /brand/chanel -> /browse?search=chanel)
  const brandMatch = pathname.match(/^\/brand\/([a-zA-Z0-9\-]+)$/);
  if (brandMatch) {
    const brandName = brandMatch[1];
    return {
      shouldRedirect: true,
      destination: `/browse?search=${encodeURIComponent(brandName)}`,
    };
  }

  return { shouldRedirect: false };
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const isProduction = process.env.NODE_ENV === 'production';
  const isPreview = process.env.VERCEL_ENV === 'preview';

  // Add security headers
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Strict Transport Security for production
  if (isProduction) {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // Content Security Policy - Production Hardened
  const nonce = generateNonce();

  if (isProduction) {
    // Production CSP - Maximum Security (No unsafe-inline/eval)
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.voyageai.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ];
    res.headers.set('Content-Security-Policy', cspDirectives.join('; '));

    // Additional Production Security Headers
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-XSS-Protection', '0'); // Disable legacy XSS filter
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    res.headers.set('Origin-Agent-Cluster', '?1');
  } else if (isPreview) {
    // Preview Environment - Balanced Security
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' https://vercel.live https://va.vercel-scripts.com`,
      `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co https://vercel.live https://va.vercel-scripts.com wss://*.supabase.co",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ];
    res.headers.set('Content-Security-Policy', cspDirectives.join('; '));
  }

  // Set nonce for script and style elements
  res.headers.set('X-Nonce', nonce);

  // Add deployment information headers (for debugging)
  if (process.env.VERCEL_ENV) {
    res.headers.set('X-Deployment-Environment', process.env.VERCEL_ENV);
  }
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    res.headers.set(
      'X-Git-Commit',
      process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
    );
  }

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Optional: Add authentication requirements for protected routes
  const protectedPaths = ['/dashboard', '/collection', '/recommendations'];
  const currentPath = req.nextUrl.pathname;

  // Check if the current path requires authentication
  const isProtectedPath = protectedPaths.some(path =>
    currentPath.startsWith(path)
  );

  if (isProtectedPath && !session) {
    // Redirect to login page if accessing protected route without session
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirectTo', currentPath);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle common URL redirects and fixes (SCE-63)
  const redirects = getUrlRedirects(currentPath);
  if (redirects.shouldRedirect) {
    logSecurityEvent('URL_REDIRECT', {
      from: currentPath,
      to: redirects.destination,
    });
    return NextResponse.redirect(new URL(redirects.destination, req.url));
  }

  // If user is logged in and tries to access auth pages, redirect to dashboard
  // Exception: allow password reset page even when logged in (for security)
  const authPaths = ['/auth/login', '/auth/signup'];
  const isAuthPath = authPaths.some(path => currentPath.startsWith(path));

  // Allow password reset page regardless of session status
  const isPasswordResetPath = currentPath.startsWith('/auth/reset');

  if (isAuthPath && session && !isPasswordResetPath) {
    const redirectTo =
      req.nextUrl.searchParams.get('redirectTo') || '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and API routes
     * Fixed JSON parsing issues with proper cookie handling
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};

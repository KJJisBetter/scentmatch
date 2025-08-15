import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';

// Note: Edge runtime is configured via config.matcher, not export const runtime

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

  // Content Security Policy for production and preview
  if (isProduction || isPreview) {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
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
  const supabase = createMiddlewareClient<Database>({ req, res });

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

  // If user is logged in and tries to access auth pages, redirect to dashboard
  const authPaths = ['/auth/login', '/auth/signup'];
  const isAuthPath = authPaths.some(path => currentPath.startsWith(path));

  if (isAuthPath && session) {
    const redirectTo =
      req.nextUrl.searchParams.get('redirectTo') || '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

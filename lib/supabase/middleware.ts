import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Update user session for middleware
 * FIXED: Following official @supabase/ssr pattern exactly for Next.js 15
 * This function should be called from middleware.ts to refresh sessions
 */
export async function updateSession(
  request: NextRequest,
  isProtectedRoute: boolean = false
) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // CRITICAL: Always call getUser() to refresh tokens and session
  // This prevents "invalid-token" errors during email confirmation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only redirect to login for protected routes when user is not authenticated
  if (
    !user &&
    isProtectedRoute &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // Redirect unauthenticated users from protected routes to login
    console.log(
      `🔒 AUTH REDIRECT: ${request.nextUrl.pathname} -> /auth/login (user not authenticated)`
    );
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Log successful authentication for protected routes
  if (user && isProtectedRoute) {
    console.log(
      `✅ AUTH SUCCESS: ${request.nextUrl.pathname} (user: ${user.email || user.id})`
    );
  }

  return supabaseResponse;
}

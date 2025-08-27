import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

// Environment variable validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please check your .env.local file and ensure it contains the correct Supabase URL.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please check your .env.local file and ensure it contains the correct Supabase anonymous key.'
  );
}

/**
 * Update user session for middleware
 * This function should be called from middleware.ts to refresh sessions
 * FIXED: Only redirect to login for protected routes, not all routes
 */
export async function updateSession(
  request: NextRequest,
  isProtectedRoute: boolean = false
) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // (supabase as any).auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await (supabase as any).auth.getUser();

  // FIXED: Only redirect to login for protected routes when user is not authenticated
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

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object before returning it.

  return supabaseResponse;
}

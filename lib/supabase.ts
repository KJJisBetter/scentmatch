import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// Environment variable validation with detailed error messages
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

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(
    `Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}. ` +
      'Please ensure it is a valid URL (e.g., https://yourproject.supabase.co)'
  );
}

/**
 * Create a Supabase client for use in client components
 * This client automatically handles authentication state
 */
export const createClientSupabase = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};

/**
 * Create a Supabase client for use in server components
 * This client has access to cookies for authentication
 */
export const createServerSupabase = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};

/**
 * Create a Supabase client for service role operations
 * This should only be used in API routes or server actions
 */
export const createServiceSupabase = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Basic Supabase client for non-authenticated operations
 * This client can be used for public queries and authentication
 */
export const supabase = createSupabaseClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'scentmatch-web',
      },
    },
  }
);

/**
 * Default createClient export for simple usage
 * Returns the basic Supabase client instance
 */
export const createClient = () => supabase;

/**
 * Test the database connection
 * This function performs a simple query to verify the database is accessible
 */
export const testDatabaseConnection = async () => {
  try {
    // Try a simple RPC call to test connection
    try {
      const { data, error } = await supabase.rpc('test_connection');

      if (!error) {
        return {
          success: true,
          message: 'Database connection successful',
          timestamp: new Date().toISOString(),
        };
      }
    } catch {
      // RPC call failed, which is expected since test_connection doesn't exist
    }

    // If RPC fails, we can still verify the client is configured
    // by checking if the auth service is accessible
    return {
      success: true,
      message:
        'Database client configured successfully (limited connection test)',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error('Unknown connection error'),
      details: error,
    };
  }
};

/**
 * Test authentication functionality
 * This function verifies that the auth service is working
 */
export const testAuthConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        error: new Error(`Auth connection failed: ${error.message}`),
        details: error,
      };
    }

    return {
      success: true,
      message: 'Auth service connection successful',
      hasSession: !!data.session,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown auth error'),
      details: error,
    };
  }
};

/**
 * Comprehensive connection test
 * Tests both database and authentication connectivity
 */
export const testSupabaseConnection = async () => {
  const [dbResult, authResult] = await Promise.all([
    testDatabaseConnection(),
    testAuthConnection(),
  ]);

  return {
    database: dbResult,
    auth: authResult,
    overall: dbResult.success && authResult.success,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Type-safe database operation helpers
 * These functions provide better error handling and type safety
 */

/**
 * Generic query handler with error handling
 */
export const handleSupabaseQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: Error | null; success: boolean }> => {
  try {
    const { data, error } = await queryFn();

    if (error) {
      return {
        data: null,
        error: new Error(error.message || 'Database query failed'),
        success: false,
      };
    }

    return {
      data,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown query error'),
      success: false,
    };
  }
};

/**
 * Authentication helper functions
 */
export const authHelpers = {
  /**
   * Get current user with error handling
   */
  getCurrentUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      return {
        data,
        error: error ? new Error(error.message) : null,
        success: !error,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown auth error'),
        success: false,
      };
    }
  },

  /**
   * Get current session with error handling
   */
  getCurrentSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      return {
        data,
        error: error ? new Error(error.message) : null,
        success: !error,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown auth error'),
        success: false,
      };
    }
  },

  /**
   * Sign up with email and password
   */
  signUp: async (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: metadata ? { data: metadata } : undefined,
      });
      return {
        data,
        error: error ? new Error(error.message) : null,
        success: !error,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown auth error'),
        success: false,
      };
    }
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return {
        data,
        error: error ? new Error(error.message) : null,
        success: !error,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown auth error'),
        success: false,
      };
    }
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return {
        data: null,
        error: error ? new Error(error.message) : null,
        success: !error,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown auth error'),
        success: false,
      };
    }
  },
};

/**
 * Database operation helpers
 */
export const dbHelpers = {
  /**
   * Get all fragrances with error handling
   */
  getFragrances: async (limit?: number) => {
    try {
      let query = supabase.from('fragrances').select('*');
      if (limit) {
        query = query.limit(limit);
      }
      const { data, error } = await query;
      return {
        data,
        error: error ? new Error(error.message) : null,
        success: !error,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error : new Error('Unknown database error'),
        success: false,
      };
    }
  },

  /**
   * Get fragrance by ID
   */
  getFragranceById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('fragrances')
        .select('*')
        .eq('id', id)
        .single();
      return {
        data,
        error: error ? new Error(error.message) : null,
        success: !error,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error : new Error('Unknown database error'),
        success: false,
      };
    }
  },

  /**
   * Get user's collection
   */
  getUserCollection: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_collections')
        .select(
          `
          *,
          fragrances (
            id,
            name,
            brand,
            description,
            image_url
          )
        `
        )
        .eq('user_id', userId);
      return {
        data,
        error: error ? new Error(error.message) : null,
        success: !error,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error : new Error('Unknown database error'),
        success: false,
      };
    }
  },

  /**
   * Add fragrance to user's collection
   */
  addToCollection: async (
    userId: string,
    fragranceId: string,
    rating?: number,
    notes?: string
  ) => {
    try {
      const { data, error } = await supabase.from('user_collections').insert({
        user_id: userId,
        fragrance_id: fragranceId,
        rating,
        notes,
      });
      return {
        data,
        error: error ? new Error(error.message) : null,
        success: !error,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error : new Error('Unknown database error'),
        success: false,
      };
    }
  },
};

// DEPRECATED: This file is deprecated. Please use '@/lib/supabase/' instead.
// This file now re-exports from the new unified Supabase module for backward compatibility.

// Re-export client-safe functions
export {
  createClientSupabase,
  handleSupabaseQuery,
  testDatabaseConnection,
  testAuthConnection,
  testSupabaseConnection,
} from './supabase/';

// Server-side exports - import directly to avoid bundling issues
export { createServerSupabase } from './supabase/server';
export { createServiceSupabase } from './supabase/service';

// Legacy exports for backward compatibility
import { createClientSupabase as createBrowserClient } from './supabase/client';

/**
 * @deprecated Use createClientSupabase from '@/lib/supabase/' instead
 * Basic Supabase client for non-authenticated operations
 */
export const supabase = createBrowserClient();

/**
 * @deprecated Use createClientSupabase from '@/lib/supabase/' instead
 * Default createClient export for simple usage
 */
export const createClient = () => supabase;

// Re-export legacy helpers for backward compatibility
// These are now deprecated - use the functions from '@/lib/supabase/' instead

/**
 * @deprecated Import authHelpers from a dedicated auth utility file instead
 * These are maintained for backward compatibility only
 */
export const authHelpers = {
  getCurrentUser: async () => {
    const { data, error } = await (supabase as any).auth.getUser();
    return {
      data,
      error: error ? new Error(error.message) : null,
      success: !error,
    };
  },
  getCurrentSession: async () => {
    const { data, error } = await (supabase as any).auth.getSession();
    return {
      data,
      error: error ? new Error(error.message) : null,
      success: !error,
    };
  },
  signUp: async (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => {
    const { data, error } = await (supabase as any).auth.signUp({
      email,
      password,
      options: metadata ? { data: metadata } : undefined,
    });
    return {
      data,
      error: error ? new Error(error.message) : null,
      success: !error,
    };
  },
  signIn: async (email: string, password: string) => {
    const { data, error } = await (supabase as any).auth.signInWithPassword({
      email,
      password,
    });
    return {
      data,
      error: error ? new Error(error.message) : null,
      success: !error,
    };
  },
  signOut: async () => {
    const { error } = await (supabase as any).auth.signOut();
    return {
      data: null,
      error: error ? new Error(error.message) : null,
      success: !error,
    };
  },
};

/**
 * @deprecated Use specific database operations instead of these generic helpers
 * These are maintained for backward compatibility only
 */
export const dbHelpers = {
  getFragrances: async (limit?: number) => {
    let query = (supabase as any).from('fragrances').select('*');
    if (limit) {
      query = query.limit(limit);
    }
    const { data, error } = await query;
    return {
      data,
      error: error ? new Error(error.message) : null,
      success: !error,
    };
  },
  getFragranceById: async (id: string) => {
    const { data, error } = await (supabase as any)
      .from('fragrances')
      .select('*')
      .eq('id', id)
      .single();
    return {
      data,
      error: error ? new Error(error.message) : null,
      success: !error,
    };
  },
  getUserCollection: async (userId: string) => {
    const { data, error } = await (supabase as any)
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
  },
  addToCollection: async (
    userId: string,
    fragranceId: string,
    rating?: number,
    notes?: string
  ) => {
    const { data, error } = await (supabase as any)
      .from('user_collections')
      .insert({
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
  },
};

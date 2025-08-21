import { createClientSupabase as createBrowserClient } from './client';
import { createServerSupabase as createServerClient } from './server';

/**
 * Generic query handler with error handling
 * Can be used with both client and server instances
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
 * Test database connection using browser client
 */
export const testDatabaseConnection = async () => {
  try {
    const supabase = createBrowserClient();

    // Simple query to test connection
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        error: new Error(`Database connection failed: ${error.message}`),
        details: error,
      };
    }

    return {
      success: true,
      message: 'Database connection successful',
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
 */
export const testAuthConnection = async () => {
  try {
    const supabase = createBrowserClient();
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

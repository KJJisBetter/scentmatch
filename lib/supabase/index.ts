// Modern Supabase client utilities for Next.js App Router
// This module provides client-safe exports only

// Client-side client (for browser components)
export { createClientSupabase } from './client';

// Utility functions (client-safe)
export {
  handleSupabaseQuery,
  testDatabaseConnection,
  testAuthConnection,
  testSupabaseConnection,
} from './utils';

// Legacy compatibility aliases
export { createClientSupabase as createBrowserClient } from './client';
export { createClientSupabase as createClient } from './client';

// Re-export types for convenience
export type { Database } from '@/types/database';

// For server-side usage, import directly from the specific files:
// import { createClient as createServerSupabase } from '@/lib/supabase/server'
// import { createClient as createServiceSupabase } from '@/lib/supabase/service'
// import { updateSession } from '@/lib/supabase/middleware'

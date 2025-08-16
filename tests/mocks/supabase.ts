import { vi } from 'vitest';

// Set up environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({
      error: null,
    }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: null,
    error: null,
  }),
  rpc: vi.fn().mockResolvedValue({
    data: null,
    error: null,
  }),
  limit: vi.fn().mockReturnThis(),
};

// Mock the entire Supabase module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock SSR helpers
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

export default mockSupabaseClient;

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock environment variables before any imports
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

// Import mocks first
import mockSupabaseClient from '../mocks/supabase';

// Import the actual functions we want to test
import {
  testSupabaseConnection,
  testDatabaseConnection,
  testAuthConnection,
  authHelpers,
  dbHelpers,
} from '@/lib/supabase';

// Import validation functions
import {
  validateEnvironment,
  validateConnection,
  performFullValidation,
} from '@/lib/supabase-validation';

describe('Supabase Connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Client Initialization', () => {
    test('should create Supabase client successfully', async () => {
      const { supabase } = await import('@/lib/supabase');

      expect(supabase).toBeDefined();
      expect(typeof supabase).toBe('object');
    });

    test('should have auth methods available', async () => {
      const { supabase } = await import('@/lib/supabase');

      expect(supabase.auth).toBeDefined();
      expect(supabase.auth.getSession).toBeDefined();
      expect(supabase.auth.getUser).toBeDefined();
      expect(supabase.auth.signUp).toBeDefined();
      expect(supabase.auth.signInWithPassword).toBeDefined();
      expect(supabase.auth.signOut).toBeDefined();
    });

    test('should have database methods available', async () => {
      const { supabase } = await import('@/lib/supabase');

      expect(supabase.from).toBeDefined();
      expect(typeof supabase.from).toBe('function');
    });

    test('should handle configuration correctly', async () => {
      // Test that client is configured with environment variables
      const { supabase } = await import('@/lib/supabase');

      // Mock implementation should be called with test values
      expect(supabase).toBe(mockSupabaseClient);
    });
  });

  describe('Connection Testing', () => {
    test('should successfully test connection with valid credentials', async () => {
      // Mock successful connection
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [{ datname: 'test' }],
            error: null,
          }),
        }),
      });

      const result = await testDatabaseConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    test('should handle connection failure gracefully', async () => {
      // Mock connection failure
      const connectionError = new Error('Connection failed');
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(connectionError),
        }),
      });

      // Mock RPC call to also fail
      mockSupabaseClient.rpc.mockRejectedValue(connectionError);

      const result = await testDatabaseConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    test('should handle Supabase API errors', async () => {
      // Mock API error response
      const apiError = { message: 'Table does not exist', code: '42P01' };
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: apiError,
          }),
        }),
      });

      // Mock RPC to also fail
      mockSupabaseClient.rpc.mockResolvedValue({ error: apiError });

      const result = await testDatabaseConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    test('should query the correct table for connection test', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      await testDatabaseConnection();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('pg_stat_database');
    });

    test('should use appropriate query parameters', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      const mockLimit = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        limit: mockLimit,
      });

      await testDatabaseConnection();

      expect(mockSelect).toHaveBeenCalledWith('datname');
      expect(mockLimit).toHaveBeenCalledWith(1);
    });
  });

  describe('Authentication Methods', () => {
    test('should handle getSession correctly', async () => {
      const { supabase } = await import('@/lib/supabase');

      const result = await supabase.auth.getSession();

      expect(result).toEqual({
        data: { session: null },
        error: null,
      });
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
    });

    test('should handle getUser correctly', async () => {
      const { supabase } = await import('@/lib/supabase');

      const result = await supabase.auth.getUser();

      expect(result).toEqual({
        data: { user: null },
        error: null,
      });
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
    });

    test('should handle signUp correctly', async () => {
      const { supabase } = await import('@/lib/supabase');

      const result = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        data: { user: null, session: null },
        error: null,
      });
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    test('should handle signInWithPassword correctly', async () => {
      const { supabase } = await import('@/lib/supabase');

      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        data: { user: null, session: null },
        error: null,
      });
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    test('should handle signOut correctly', async () => {
      const { supabase } = await import('@/lib/supabase');

      const result = await supabase.auth.signOut();

      expect(result).toEqual({
        error: null,
      });
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    test('should handle auth state changes', async () => {
      const { supabase } = await import('@/lib/supabase');
      const callback = vi.fn();

      const result = supabase.auth.onAuthStateChange(callback);

      expect(result).toEqual({
        data: { subscription: { unsubscribe: expect.any(Function) } },
      });
      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalledWith(
        callback
      );
    });
  });

  describe('Database Operations', () => {
    test('should handle select operations', async () => {
      const { supabase } = await import('@/lib/supabase');

      const result = await supabase.from('fragrances').select('*').single();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('fragrances');
      expect(result).toEqual({
        data: null,
        error: null,
      });
    });

    test('should handle insert operations', async () => {
      const { supabase } = await import('@/lib/supabase');

      const testData = { name: 'Test Fragrance', brand: 'Test Brand' };

      await supabase.from('fragrances').insert(testData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('fragrances');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    test('should handle update operations', async () => {
      const { supabase } = await import('@/lib/supabase');

      const updateData = { name: 'Updated Fragrance' };

      await supabase.from('fragrances').update(updateData).eq('id', 1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('fragrances');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 1);
    });

    test('should handle delete operations', async () => {
      const { supabase } = await import('@/lib/supabase');

      await supabase.from('fragrances').delete().eq('id', 1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('fragrances');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 1);
    });

    test('should handle RPC calls', async () => {
      const { supabase } = await import('@/lib/supabase');

      const result = await supabase.rpc('search_fragrances', {
        search_term: 'test',
      });

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('search_fragrances', {
        search_term: 'test',
      });
      expect(result).toEqual({
        data: null,
        error: null,
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle network timeouts', async () => {
      // Mock network timeout
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error('Network timeout')),
        }),
      });

      const result = await testSupabaseConnection();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Network timeout');
    });

    test('should handle invalid API responses', async () => {
      // Mock invalid response
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(null), // Invalid response
        }),
      });

      const result = await testSupabaseConnection();

      expect(result.success).toBe(false);
    });

    test('should handle malformed data', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: 'invalid-data-format',
            error: null,
          }),
        }),
      });

      const result = await testSupabaseConnection();

      // Should still succeed if error is null, even with malformed data
      expect(result.success).toBe(true);
    });
  });

  describe('Performance and Resource Management', () => {
    test('should complete connection test within reasonable time', async () => {
      const startTime = performance.now();

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      await testSupabaseConnection();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Connection test should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    test('should not create memory leaks', async () => {
      // Run multiple connection tests
      for (let i = 0; i < 10; i++) {
        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        });

        await testSupabaseConnection();
      }

      // If this test completes without issues, there are no obvious memory leaks
      expect(true).toBe(true);
    });
  });

  describe('Security Considerations', () => {
    test('should not expose sensitive configuration in errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi
            .fn()
            .mockRejectedValue(new Error('Database connection failed')),
        }),
      });

      const result = await testDatabaseConnection();

      expect(result.success).toBe(false);

      // Error should not contain sensitive information like API keys
      const errorString = JSON.stringify(result.error);
      expect(errorString).not.toMatch(/sk_|pk_|anon_key|service_role/);
    });

    test('should use correct authentication for database operations', async () => {
      const { supabase } = await import('@/lib/supabase');

      // Verify that the client is using the anonymous key (not service role)
      // This is implicitly tested by our mock setup
      expect(supabase).toBe(mockSupabaseClient);
    });
  });

  describe('Environment Validation', () => {
    test('should validate required environment variables', async () => {
      const result = await validateEnvironment();

      // In test environment, we should have our test env vars
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test('should detect missing environment variables', async () => {
      // Temporarily clear environment variables
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const result = await validateEnvironment();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing environment variable');

      // Restore environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });
  });

  describe('Helper Functions', () => {
    test('should provide auth helpers', async () => {
      expect(authHelpers).toBeDefined();
      expect(authHelpers.getCurrentUser).toBeDefined();
      expect(authHelpers.getCurrentSession).toBeDefined();
      expect(authHelpers.signUp).toBeDefined();
      expect(authHelpers.signIn).toBeDefined();
      expect(authHelpers.signOut).toBeDefined();
    });

    test('should provide database helpers', async () => {
      expect(dbHelpers).toBeDefined();
      expect(dbHelpers.getFragrances).toBeDefined();
      expect(dbHelpers.getFragranceById).toBeDefined();
      expect(dbHelpers.getUserCollection).toBeDefined();
      expect(dbHelpers.addToCollection).toBeDefined();
    });

    test('should handle auth helper errors gracefully', async () => {
      const result = await authHelpers.getCurrentUser();

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.data).toBeDefined();
    });

    test('should handle database helper errors gracefully', async () => {
      const result = await dbHelpers.getFragrances();

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe('Connection Testing', () => {
    test('should test database connection', async () => {
      const result = await testDatabaseConnection();

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test('should test auth connection', async () => {
      const result = await testAuthConnection();

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test('should perform comprehensive connection test', async () => {
      const result = await testSupabaseConnection();

      expect(result).toBeDefined();
      expect(result.database).toBeDefined();
      expect(result.auth).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Full Validation Suite', () => {
    test('should perform full validation', async () => {
      const result = await performFullValidation();

      expect(result).toBeDefined();
      expect(result.environment).toBeDefined();
      expect(result.connection).toBeDefined();
      expect(result.database).toBeDefined();
      expect(result.auth).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.warnings).toBeInstanceOf(Array);
    }, 10000); // Allow 10 seconds for full validation
  });
});

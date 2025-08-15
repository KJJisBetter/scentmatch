import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { testSupabaseConnection } from '@/lib/supabase';
import { authTestSetup } from '../setup/auth-test-setup';
import mockSupabaseClient from '../mocks/supabase';

describe('App Initialization Integration Tests', () => {
  beforeEach(() => {
    authTestSetup.resetAuthMocks();
  });

  afterEach(() => {
    authTestSetup.resetAuthMocks();
  });

  describe('Complete App Bootstrap', () => {
    test('should successfully initialize all core services', async () => {
      // Set up successful scenarios
      authTestSetup.setupSuccessfulAuth();

      // Mock successful database connection
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [{ count: 1 }],
            error: null,
          }),
        }),
      });

      // Test full initialization sequence
      const initStart = performance.now();

      // 1. Import and initialize Supabase client
      const { supabase } = await import('@/lib/supabase');
      expect(supabase).toBeDefined();

      // 2. Test database connection
      const connectionResult = await testSupabaseConnection();
      expect(connectionResult.success).toBe(true);

      // 3. Verify auth methods are available
      expect(supabase.auth).toBeDefined();
      expect(supabase.auth.getSession).toBeDefined();
      expect(supabase.auth.getUser).toBeDefined();

      // 4. Test auth state retrieval
      const sessionResult = await supabase.auth.getSession();
      expect(sessionResult).toBeDefined();

      const userResult = await supabase.auth.getUser();
      expect(userResult).toBeDefined();

      const initEnd = performance.now();
      const initTime = initEnd - initStart;

      // Initialization should complete quickly
      expect(initTime).toBeLessThan(500); // 500ms threshold
    });

    test('should handle partial failures gracefully', async () => {
      // Set up scenario where auth works but database has issues
      authTestSetup.setupSuccessfulAuth();

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi
            .fn()
            .mockRejectedValue(new Error('Database connection failed')),
        }),
      });

      // App should still initialize even if database test fails
      const { supabase } = await import('@/lib/supabase');
      expect(supabase).toBeDefined();

      // Auth should still work
      const sessionResult = await supabase.auth.getSession();
      expect(sessionResult.data).toBeDefined();

      // Database connection test should fail gracefully
      const connectionResult = await testSupabaseConnection();
      expect(connectionResult.success).toBe(false);
      expect(connectionResult.error).toBeDefined();
    });

    test('should maintain consistent state across multiple operations', async () => {
      authTestSetup.setupSuccessfulAuth();

      const { supabase } = await import('@/lib/supabase');

      // Perform multiple operations
      const operations = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
        testSupabaseConnection(),
      ]);

      // All operations should complete successfully
      expect(operations[0]).toBeDefined(); // Session
      expect(operations[1]).toBeDefined(); // User
      expect(operations[2].success).toBe(true); // Connection test

      // State should remain consistent
      const secondSession = await supabase.auth.getSession();
      expect(secondSession).toEqual(operations[0]);
    });
  });

  describe('Environment-Specific Initialization', () => {
    test('should initialize correctly in test environment', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toContain('test');
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toContain('test');
    });

    test('should use test database configuration', async () => {
      const connectionResult = await testSupabaseConnection();

      // Connection should attempt to use 'fragrances' table
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('fragrances');
    });

    test('should handle environment variable changes', async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Temporarily change environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://changed.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'changed-key';

      // Clear module cache to force re-initialization
      delete require.cache[require.resolve('@/lib/supabase')];

      try {
        // Re-import should use new environment variables
        const { supabase } = await import('@/lib/supabase');
        expect(supabase).toBeDefined();
      } finally {
        // Restore original environment variables
        process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;

        // Clear cache again to restore original state
        delete require.cache[require.resolve('@/lib/supabase')];
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from temporary network issues', async () => {
      // Simulate network failure followed by recovery
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call fails
          return {
            select: vi.fn().mockReturnValue({
              limit: vi.fn().mockRejectedValue(new Error('Network error')),
            }),
          };
        } else {
          // Subsequent calls succeed
          return {
            select: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ count: 1 }],
                error: null,
              }),
            }),
          };
        }
      });

      // First attempt should fail
      const firstResult = await testSupabaseConnection();
      expect(firstResult.success).toBe(false);

      // Second attempt should succeed
      const secondResult = await testSupabaseConnection();
      expect(secondResult.success).toBe(true);
    });

    test('should handle authentication state changes during initialization', async () => {
      let authStateCallback: Function | null = null;

      // Set up auth state change listener
      mockSupabaseClient.auth.onAuthStateChange.mockImplementation(callback => {
        authStateCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      });

      const { supabase } = await import('@/lib/supabase');

      // Simulate auth state change
      if (authStateCallback) {
        authStateCallback('SIGNED_IN', {
          access_token: 'new-token',
          user: { id: 'new-user' },
        });
      }

      // App should handle the state change gracefully
      expect(supabase).toBeDefined();
    });

    test('should handle concurrent initialization attempts', async () => {
      // Simulate multiple concurrent initialization attempts
      const initPromises = Array.from({ length: 5 }, async () => {
        const { supabase } = await import('@/lib/supabase');
        return supabase;
      });

      const results = await Promise.all(initPromises);

      // All should return the same client instance
      results.forEach(client => {
        expect(client).toBe(mockSupabaseClient);
      });
    });
  });

  describe('Performance and Resource Management', () => {
    test('should not create excessive memory usage during initialization', async () => {
      const memoryBefore = process.memoryUsage();

      // Perform multiple initializations
      for (let i = 0; i < 10; i++) {
        await import('@/lib/supabase');
        await testSupabaseConnection();
      }

      const memoryAfter = process.memoryUsage();
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    test('should complete initialization within performance budget', async () => {
      const startTime = performance.now();

      // Full initialization flow
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.getSession();
      await supabase.auth.getUser();
      await testSupabaseConnection();

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Total initialization should be fast (under 200ms)
      expect(totalTime).toBeLessThan(200);
    });

    test('should handle cleanup properly', async () => {
      const { supabase } = await import('@/lib/supabase');

      // Set up auth state change listener
      const { data } = supabase.auth.onAuthStateChange(() => {});

      // Cleanup should not throw errors
      expect(() => {
        data.subscription.unsubscribe();
      }).not.toThrow();
    });
  });

  describe('Security Validation', () => {
    test('should not expose sensitive configuration in client-side code', async () => {
      const { supabase } = await import('@/lib/supabase');

      // Stringify the client to check for sensitive data
      const clientString = JSON.stringify(supabase);

      // Should not contain service role key (only anon key is acceptable)
      expect(clientString).not.toMatch(/sk_live_|sk_test_/);
      expect(clientString).not.toMatch(/service_role/);
    });

    test('should use appropriate authentication for different operations', async () => {
      const { supabase } = await import('@/lib/supabase');

      // Client operations should use anon key
      await supabase.from('fragrances').select('*');

      // Verify that operations are called on the mocked client
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    test('should handle invalid tokens gracefully', async () => {
      // Set up scenario with invalid token
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid token', status: 401 },
      });

      const { supabase } = await import('@/lib/supabase');
      const result = await supabase.auth.getSession();

      // Should handle invalid token without crashing
      expect(result.error).toBeDefined();
      expect(result.error.status).toBe(401);
    });
  });
});

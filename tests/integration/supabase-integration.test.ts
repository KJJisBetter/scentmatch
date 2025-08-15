import { describe, test, expect } from 'vitest';
import { performFullValidation } from '@/lib/supabase-validation';

describe('Supabase Integration', () => {
  test('should validate Supabase configuration', async () => {
    const result = await performFullValidation();

    expect(result).toBeDefined();
    expect(result.environment).toBeDefined();
    expect(result.connection).toBeDefined();
    expect(result.database).toBeDefined();
    expect(result.auth).toBeDefined();
    expect(result.overall).toBeDefined();
    expect(result.errors).toBeInstanceOf(Array);
    expect(result.warnings).toBeInstanceOf(Array);

    // In test environment, some aspects might not pass
    // but the structure should be correct
    expect(result.environment.success).toBe(true);
  }, 10000);

  test('should have proper environment validation structure', async () => {
    const { validateEnvironment } = await import('@/lib/supabase-validation');
    const result = await validateEnvironment();

    expect(result.success).toBeDefined();
    expect(result.message).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  test('should expose required Supabase client functions', async () => {
    const {
      createClientSupabase,
      createServerSupabase,
      createServiceSupabase,
      supabase,
      authHelpers,
      dbHelpers,
    } = await import('@/lib/supabase');

    expect(createClientSupabase).toBeDefined();
    expect(createServerSupabase).toBeDefined();
    expect(createServiceSupabase).toBeDefined();
    expect(supabase).toBeDefined();
    expect(authHelpers).toBeDefined();
    expect(dbHelpers).toBeDefined();
  });

  test('should have auth helpers with correct methods', async () => {
    const { authHelpers } = await import('@/lib/supabase');

    expect(authHelpers.getCurrentUser).toBeDefined();
    expect(authHelpers.getCurrentSession).toBeDefined();
    expect(authHelpers.signUp).toBeDefined();
    expect(authHelpers.signIn).toBeDefined();
    expect(authHelpers.signOut).toBeDefined();
  });

  test('should have database helpers with correct methods', async () => {
    const { dbHelpers } = await import('@/lib/supabase');

    expect(dbHelpers.getFragrances).toBeDefined();
    expect(dbHelpers.getFragranceById).toBeDefined();
    expect(dbHelpers.getUserCollection).toBeDefined();
    expect(dbHelpers.addToCollection).toBeDefined();
  });
});

/**
 * Authentication Flow Debugging Test Suite
 *
 * Comprehensive tests to identify and debug 401 authorization errors
 * during account creation and authentication flows
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { signUp, signIn, getUser } from '@/app/actions/auth';

// Test configuration
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

describe('Authentication Flow Debugging', () => {
  let supabase: any;
  let testUserId: string | null = null;

  beforeEach(async () => {
    // Initialize Supabase client for direct testing
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  });

  afterEach(async () => {
    // Cleanup test user if created
    if (testUserId && supabase) {
      try {
        await supabase.auth.admin.deleteUser(testUserId);
      } catch (error) {
        console.warn('Failed to cleanup test user:', error);
      }
    }
  });

  describe('1. Environment and Connection Testing', () => {
    it('should have all required environment variables', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
    });

    it('should connect to Supabase successfully', async () => {
      const { data, error } = await supabase.auth.getSession();
      expect(error).toBeNull();
      // Session might be null (not logged in) but connection should work
    });

    it('should be able to query the database', async () => {
      const { data, error } = await supabase
        .from('fragrances')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('2. Direct Supabase Auth Testing', () => {
    it('should create user directly via Supabase client', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      console.log('Direct signup result:', { data, error });

      if (data.user) {
        testUserId = data.user.id;
      }

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe(TEST_EMAIL);
    });

    it('should verify user profile table schema', async () => {
      // Check what columns actually exist in user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);

      console.log('User profiles schema sample:', { data, error });

      // This should not fail - if it does, there's a schema issue
      expect(error).toBeNull();
    });

    it('should test user_profiles insert permissions', async () => {
      // Create a test user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `permission-test-${Date.now()}@example.com`,
        password: TEST_PASSWORD,
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeDefined();

      if (authData.user) {
        testUserId = authData.user.id;

        // Test if we can insert into user_profiles
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            user_id: authData.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        console.log('Profile insert result:', { profileData, profileError });

        if (profileError) {
          console.error('Profile creation failed:', profileError.message);
          console.error('Error details:', profileError);
        }

        expect(profileError).toBeNull();
      }
    });
  });

  describe('3. Server Action Testing', () => {
    it('should test signUp server action step by step', async () => {
      console.log('Testing signUp server action with:', TEST_EMAIL);

      const result = await signUp(TEST_EMAIL, TEST_PASSWORD);

      console.log('SignUp result:', result);

      // Analyze the specific error
      if (result.error) {
        console.error('SignUp failed with error:', result.error);

        // Common 401 error patterns
        if (
          result.error.includes('401') ||
          result.error.includes('unauthorized')
        ) {
          console.error('🚨 401 UNAUTHORIZED ERROR DETECTED');
          console.error('This suggests auth session or permission issues');
        }

        if (result.error.includes('profile')) {
          console.error('🚨 PROFILE CREATION ERROR DETECTED');
          console.error('This suggests database schema or RLS policy issues');
        }
      }

      // Should succeed or give us detailed error info
      expect(result).toBeDefined();
    });

    it('should test getUser server action', async () => {
      const user = await getUser();
      console.log('Current user from getUser():', user);

      // User might be null if not logged in, but function should work
      expect(user !== undefined).toBe(true);
    });
  });

  describe('4. Database Schema Validation', () => {
    it('should validate user_profiles table structure', async () => {
      // Query the information schema to get actual table structure
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: 'user_profiles' })
        .single();

      if (error) {
        console.warn(
          'Could not get table structure, testing with direct query'
        );

        // Alternative: try to insert with different field combinations
        const testFields = [
          { id: 'test-id', user_id: 'test-user-id' },
          { id: 'test-id', email: 'test@example.com' },
          { user_id: 'test-user-id', email: 'test@example.com' },
        ];

        for (const fields of testFields) {
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert(fields);

          console.log(
            `Testing fields ${JSON.stringify(fields)}:`,
            insertError ? `ERROR: ${insertError.message}` : 'SUCCESS'
          );
        }
      } else {
        console.log('Table structure:', data);
      }
    });

    it('should check RLS policies on user_profiles', async () => {
      // Test if we can read from user_profiles without auth
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      console.log('RLS test (should be restricted):', { data, error });

      // If we can read without auth, RLS might be misconfigured
      if (!error && data && data.length > 0) {
        console.warn(
          '⚠️ WARNING: RLS might not be properly configured - can read without auth'
        );
      }
    });
  });

  describe('5. Complete Flow Testing', () => {
    it('should test the complete signup → profile creation flow', async () => {
      console.log('🧪 Testing complete auth flow...');

      // Step 1: Test direct Supabase signup
      console.log('Step 1: Direct Supabase signup');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `complete-test-${Date.now()}@example.com`,
        password: TEST_PASSWORD,
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeDefined();

      if (authData.user) {
        testUserId = authData.user.id;
        console.log('✅ User created:', authData.user.id);

        // Step 2: Test profile creation manually
        console.log('Step 2: Manual profile creation');
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            user_id: authData.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (profileError) {
          console.error('❌ Profile creation failed:', profileError);
        } else {
          console.log('✅ Profile created:', profileData);
        }

        // Step 3: Test if we can read the profile back
        console.log('Step 3: Profile retrieval test');
        const { data: retrievedProfile, error: retrieveError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (retrieveError) {
          console.error('❌ Profile retrieval failed:', retrieveError);
        } else {
          console.log('✅ Profile retrieved:', retrievedProfile);
        }
      }
    });
  });

  describe('6. Error Pattern Analysis', () => {
    it('should identify common 401 error patterns', async () => {
      const testCases = [
        {
          name: 'Invalid email format',
          email: 'invalid-email',
          password: TEST_PASSWORD,
          expectedError: 'email',
        },
        {
          name: 'Weak password',
          email: `weak-${Date.now()}@example.com`,
          password: '123',
          expectedError: 'password',
        },
        {
          name: 'Valid credentials',
          email: `valid-${Date.now()}@example.com`,
          password: TEST_PASSWORD,
          expectedError: null,
        },
      ];

      for (const testCase of testCases) {
        console.log(`Testing: ${testCase.name}`);

        const result = await signUp(testCase.email, testCase.password);

        console.log(`Result for ${testCase.name}:`, result);

        if (testCase.expectedError) {
          expect(result.error).toContain(testCase.expectedError);
        } else {
          // Valid case should either succeed or give us specific error info
          if (result.error) {
            console.error(`Unexpected error for valid case: ${result.error}`);
          }
        }
      }
    });
  });
});

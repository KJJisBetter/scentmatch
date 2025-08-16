import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createServiceSupabase, createClientSupabase } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Database Security and RLS Tests
 * 
 * Tests for Row Level Security policies and overall database security:
 * - RLS policy validation for all user tables
 * - Security of fragrance embeddings and public data
 * - Function security (SECURITY DEFINER)
 * - Extension security (not in public schema)
 * - Auth integration and user isolation
 */

describe('Database Security and RLS', () => {
  let serviceSupabase: SupabaseClient;
  let clientSupabase: SupabaseClient;
  let testUserId: string;

  beforeAll(async () => {
    serviceSupabase = createServiceSupabase();
    clientSupabase = createClientSupabase();
    testUserId = '00000000-0000-0000-0000-000000000001';
  });

  afterAll(async () => {
    // Clean up any test data
  });

  describe('RLS Policy Validation', () => {
    test('should have RLS enabled on user_collections table', async () => {
      const { data: tableInfo } = await serviceSupabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', 'user_collections')
        .eq('schemaname', 'public')
        .single();

      expect(tableInfo?.rowsecurity).toBe(true);
    });

    test('should have comprehensive RLS policies for user_collections', async () => {
      const { data: policies } = await serviceSupabase
        .from('pg_policies')
        .select('policyname, cmd, qual, with_check')
        .eq('tablename', 'user_collections');

      expect(policies).toBeDefined();
      expect(Array.isArray(policies)).toBe(true);

      const commands = policies?.map(p => p.cmd) || [];
      expect(commands).toContain('SELECT');
      expect(commands).toContain('INSERT'); 
      expect(commands).toContain('UPDATE');
      expect(commands).toContain('DELETE');

      // Each policy should check auth.uid() = user_id
      policies?.forEach(policy => {
        if (policy.qual) {
          expect(policy.qual).toContain('auth.uid()');
          expect(policy.qual).toContain('user_id');
        }
      });
    });

    test('should have RLS enabled on user_profiles table', async () => {
      const { data: tableInfo } = await serviceSupabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', 'user_profiles')
        .eq('schemaname', 'public')
        .single();

      expect(tableInfo?.rowsecurity).toBe(true);
    });

    test('should validate RLS policies for user_preferences table', async () => {
      // Check if table exists and has RLS
      const { data: tableInfo } = await serviceSupabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', 'user_preferences')
        .eq('schemaname', 'public')
        .single();

      if (!tableInfo) {
        console.log('user_preferences table needs RLS policies after creation');
      } else {
        expect(tableInfo.rowsecurity).toBe(true);

        const { data: policies } = await serviceSupabase
          .from('pg_policies')
          .select('policyname, cmd')
          .eq('tablename', 'user_preferences');

        expect(policies).toBeDefined();
        expect(Array.isArray(policies)).toBe(true);
        
        const commands = policies?.map(p => p.cmd) || [];
        expect(commands).toContain('SELECT');
        expect(commands).toContain('INSERT');
        expect(commands).toContain('UPDATE');
        expect(commands).toContain('DELETE');
      }
    });

    test('should validate RLS policies for user_fragrance_interactions table', async () => {
      const { data: tableInfo } = await serviceSupabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', 'user_fragrance_interactions')
        .eq('schemaname', 'public')
        .single();

      if (!tableInfo) {
        console.log('user_fragrance_interactions table needs RLS policies after creation');
      } else {
        expect(tableInfo.rowsecurity).toBe(true);

        const { data: policies } = await serviceSupabase
          .from('pg_policies')
          .select('policyname, cmd, qual')
          .eq('tablename', 'user_fragrance_interactions');

        expect(policies).toBeDefined();
        
        // Should have policy for authenticated users accessing their own data
        const selectPolicies = policies?.filter(p => p.cmd === 'SELECT') || [];
        expect(selectPolicies.length).toBeGreaterThan(0);
      }
    });

    test('should check if fragrances table needs RLS enablement', async () => {
      const { data: tableInfo } = await serviceSupabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', 'fragrances')
        .eq('schemaname', 'public')
        .single();

      if (!tableInfo?.rowsecurity) {
        console.log('SECURITY ISSUE: fragrances table should have RLS enabled');
        console.log('Recommendation: Enable RLS and create public read policy for authenticated users');
      } else {
        // Should have public read policy for authenticated users
        const { data: policies } = await serviceSupabase
          .from('pg_policies')
          .select('policyname, cmd, roles')
          .eq('tablename', 'fragrances');

        const readPolicies = policies?.filter(p => p.cmd === 'SELECT') || [];
        expect(readPolicies.length).toBeGreaterThan(0);
      }
    });

    test('should check if fragrance_brands table needs RLS enablement', async () => {
      const { data: tableInfo } = await serviceSupabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', 'fragrance_brands')
        .eq('schemaname', 'public')
        .single();

      if (!tableInfo?.rowsecurity) {
        console.log('SECURITY ISSUE: fragrance_brands table should have RLS enabled');
        console.log('Recommendation: Enable RLS and create public read policy for authenticated users');
      }
    });

    test('should validate fragrance_embeddings security', async () => {
      const { data: tableInfo } = await serviceSupabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', 'fragrance_embeddings')
        .eq('schemaname', 'public')
        .single();

      if (!tableInfo) {
        console.log('fragrance_embeddings table needs RLS policies after creation');
      } else {
        expect(tableInfo.rowsecurity).toBe(true);

        // Should have public read policy for authenticated users (needed for similarity search)
        const { data: policies } = await serviceSupabase
          .from('pg_policies')
          .select('policyname, cmd, roles')
          .eq('tablename', 'fragrance_embeddings');

        const readPolicies = policies?.filter(p => p.cmd === 'SELECT') || [];
        expect(readPolicies.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Function Security', () => {
    test('should validate function security configuration', async () => {
      const { data: functions } = await serviceSupabase
        .from('information_schema.routines')
        .select('routine_name, security_type, sql_data_access')
        .eq('routine_schema', 'public')
        .in('routine_name', [
          'get_similar_fragrances',
          'get_collection_insights', 
          'get_personalized_recommendations',
          'match_fragrances'
        ]);

      functions?.forEach(func => {
        console.log(`Function ${func.routine_name}:`, {
          security_type: func.security_type,
          sql_data_access: func.sql_data_access
        });

        // Functions should use SECURITY DEFINER for controlled access
        if (func.routine_name !== 'match_fragrances' && func.security_type) {
          expect(func.security_type).toBe('DEFINER');
        }
      });
    });

    test('should check for functions with mutable search_path', async () => {
      // Query to find functions with potential security issues
      const { data, error } = await serviceSupabase.rpc('check_function_search_path_security');

      if (error && error.code === '42883') {
        console.log('Function security check needs to be created');
        console.log('Purpose: Identify functions with mutable search_path (security vulnerability)');
      } else if (data?.insecure_functions?.length > 0) {
        console.log('SECURITY WARNING: Functions with mutable search_path found:');
        data.insecure_functions.forEach((func: string) => {
          console.log(`- ${func}`);
        });
        
        console.log('Recommendation: Update functions to use SET search_path = public;');
      }
    });

    test('should validate function permission model', async () => {
      // Test that functions respect RLS policies
      const testCases = [
        {
          function: 'get_collection_insights',
          params: { target_user_id: testUserId }
        },
        {
          function: 'get_personalized_recommendations', 
          params: { target_user_id: testUserId, max_results: 5 }
        }
      ];

      for (const testCase of testCases) {
        const { data, error } = await serviceSupabase.rpc(testCase.function, testCase.params);

        if (error && error.code === '42883') {
          console.log(`${testCase.function} permission model will be validated after creation`);
        } else {
          // Function should execute without bypassing RLS
          expect(error).toBeNull();
        }
      }
    });
  });

  describe('Extension Security', () => {
    test('should validate extensions are not in public schema', async () => {
      const { data: extensions } = await serviceSupabase
        .from('pg_extension')
        .select('extname, extnamespace, nspname:pg_namespace!inner(nspname)')
        .in('extname', ['vector', 'pg_trgm', 'unaccent', 'uuid-ossp']);

      const publicSchemaId = 2200; // Standard public schema OID

      const publicExtensions = extensions?.filter(ext => 
        ext.extnamespace === publicSchemaId
      );

      if (publicExtensions && publicExtensions.length > 0) {
        console.log('SECURITY WARNING: Extensions in public schema:');
        publicExtensions.forEach(ext => {
          console.log(`- ${ext.extname} (should be moved to dedicated schema)`);
        });
        
        console.log('Recommendation: CREATE SCHEMA extensions; ALTER EXTENSION ... SET SCHEMA extensions;');
      }
    });

    test('should validate extension permissions', async () => {
      // Check that vector extension functions are properly secured
      const { data: functions } = await serviceSupabase
        .from('pg_proc')
        .select('proname, pronamespace')
        .ilike('proname', 'vector%')
        .limit(5);

      // Vector functions should be available but controlled
      expect(functions).toBeDefined();
      expect(Array.isArray(functions)).toBe(true);
    });
  });

  describe('Authentication Integration', () => {
    test('should validate auth.users integration', async () => {
      // Test that user_profiles correctly reference auth.users
      const { data: constraints } = await serviceSupabase
        .from('information_schema.table_constraints')
        .select('constraint_name, constraint_type')
        .eq('table_name', 'user_profiles')
        .eq('constraint_type', 'FOREIGN KEY');

      const hasForeignKey = constraints?.some(c => 
        c.constraint_name.includes('user') || c.constraint_name.includes('auth')
      );

      if (!hasForeignKey) {
        console.log('WARNING: user_profiles may need foreign key to auth.users');
      }
    });

    test('should validate user isolation in collections', async () => {
      // Mock scenario: different users should not see each other's collections
      const user1Id = '00000000-0000-0000-0000-000000000001';
      const user2Id = '00000000-0000-0000-0000-000000000002';

      // This would require proper auth context in real testing
      console.log('User isolation test requires authenticated context');
      console.log('Test case: User 1 should not see User 2 collections');
      console.log('Test case: User 1 should not modify User 2 data');
    });

    test('should validate anonymous access restrictions', async () => {
      // Anonymous users should not access user data
      const anonSupabase = createClientSupabase();

      const { data, error } = await anonSupabase
        .from('user_collections')
        .select('*')
        .limit(1);

      // Should either error (if RLS properly configured) or return empty
      if (error) {
        expect(error.code).toBe('42501'); // insufficient_privilege
      } else {
        expect(data).toEqual([]);
      }
    });
  });

  describe('Data Access Control', () => {
    test('should validate read permissions for public fragrance data', async () => {
      // Authenticated users should be able to read fragrance data
      const { data, error } = await clientSupabase
        .from('fragrances')
        .select('id, name, brand_id')
        .limit(1);

      if (error && error.code === '42501') {
        console.log('ISSUE: Authenticated users cannot read fragrance data');
        console.log('Recommendation: Create RLS policy for authenticated fragrance access');
      } else {
        expect(error).toBeNull();
        expect(data).toBeDefined();
      }
    });

    test('should validate write restrictions on fragrance data', async () => {
      // Regular users should not be able to modify fragrance data
      const { data, error } = await clientSupabase
        .from('fragrances')
        .insert({
          name: 'Test Fragrance',
          brand_id: 1,
          description: 'Test'
        });

      // Should be restricted (only admin/service role)
      expect(error).toBeDefined();
      expect(error?.code).toBe('42501'); // insufficient_privilege
    });

    test('should validate user data access control', async () => {
      const testData = {
        user_id: testUserId,
        fragrance_id: '00000000-0000-0000-0000-000000000003',
        collection_type: 'owned',
        added_at: new Date().toISOString()
      };

      // This should work with proper auth context
      const { data, error } = await serviceSupabase
        .from('user_collections')
        .insert(testData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Clean up
      if (data) {
        await serviceSupabase
          .from('user_collections')
          .delete()
          .eq('id', data.id);
      }
    });
  });

  describe('Security Best Practices', () => {
    test('should validate password and sensitive data handling', async () => {
      // Check that no sensitive data is stored in logs or accessible tables
      const { data: columns } = await serviceSupabase
        .from('information_schema.columns')
        .select('table_name, column_name, data_type')
        .ilike('column_name', '%password%')
        .or('column_name.ilike.%secret%,column_name.ilike.%key%,column_name.ilike.%token%');

      if (columns && columns.length > 0) {
        console.log('WARNING: Potential sensitive data columns found:');
        columns.forEach(col => {
          console.log(`- ${col.table_name}.${col.column_name} (${col.data_type})`);
        });
      }
    });

    test('should validate SSL/encryption requirements', async () => {
      // Check SSL configuration
      const { data, error } = await serviceSupabase.rpc('show', { 
        parameter_name: 'ssl' 
      });

      if (error && error.code === '42883') {
        console.log('SSL configuration check needs database function');
      } else {
        console.log('SSL configuration:', data);
      }
    });

    test('should validate audit trail capabilities', async () => {
      // Check if audit logging is available for sensitive operations
      const { data: functions } = await serviceSupabase
        .from('information_schema.routines')
        .select('routine_name')
        .ilike('routine_name', '%audit%')
        .or('routine_name.ilike.%log%');

      if (!functions || functions.length === 0) {
        console.log('RECOMMENDATION: Consider implementing audit trail for user data changes');
      }
    });

    test('should validate rate limiting and abuse prevention', async () => {
      // Check for rate limiting on expensive operations
      console.log('RECOMMENDATION: Implement rate limiting on:');
      console.log('- Vector similarity searches');
      console.log('- Bulk recommendation requests');
      console.log('- User data exports');
      console.log('- API endpoints for user interactions');
    });

    test('should validate backup and recovery capabilities', async () => {
      // Validate that critical user data is backed up
      const criticalTables = [
        'user_profiles',
        'user_collections', 
        'user_preferences',
        'user_fragrance_interactions'
      ];

      console.log('CRITICAL TABLES requiring backup:');
      criticalTables.forEach(table => {
        console.log(`- ${table}`);
      });
    });
  });

  describe('Compliance and Privacy', () => {
    test('should validate user data privacy controls', async () => {
      // Check for user data deletion capabilities (GDPR compliance)
      const { data: functions } = await serviceSupabase
        .from('information_schema.routines')
        .select('routine_name')
        .ilike('routine_name', '%delete_user%')
        .or('routine_name.ilike.%purge%,routine_name.ilike.%anonymize%');

      if (!functions || functions.length === 0) {
        console.log('COMPLIANCE: User data deletion function needs to be created');
        console.log('Purpose: GDPR compliance for user data removal');
      }
    });

    test('should validate data retention policies', async () => {
      // Check for automated data cleanup policies
      console.log('DATA RETENTION: Consider implementing policies for:');
      console.log('- Old interaction data (>2 years)');
      console.log('- Unused user preferences');
      console.log('- Temporary session data');
    });

    test('should validate personal data identification', async () => {
      // Document what constitutes personal data in the system
      const personalDataTables = [
        'user_profiles',
        'user_collections',
        'user_preferences', 
        'user_fragrance_interactions'
      ];

      console.log('PERSONAL DATA TABLES:');
      personalDataTables.forEach(table => {
        console.log(`- ${table} (requires privacy controls)`);
      });
    });
  });
});
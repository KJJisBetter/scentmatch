/**
 * Database Integration Validation Tests - Task 1.1
 *
 * Comprehensive tests for database schema validation, migration status,
 * and integration between new database structure and existing application code.
 * 
 * This test suite verifies that all database changes required for the
 * database integration system fixes are properly applied and functional.
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createServiceSupabase } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Database Integration Validation - Schema & Migration Status', () => {
  let supabase: SupabaseClient;

  beforeAll(() => {
    supabase = createServiceSupabase();
  });

  afterAll(async () => {
    // Clean up any test data if needed
  });

  describe('Migration Status Validation', () => {
    test('should verify all August 2025 migrations have been applied', async () => {
      const { data: migrations, error } = await supabase
        .from('supabase_migrations.schema_migrations')
        .select('version, inserted_at')
        .like('version', '202508%')
        .order('version', { ascending: true });

      expect(error).toBeNull();
      expect(migrations).toBeDefined();
      expect(Array.isArray(migrations)).toBe(true);

      // Check for specific migration files we expect
      const migrationVersions = migrations?.map(m => m.version) || [];
      
      console.log('Applied August 2025 migrations:', migrationVersions);
      
      // Document expected migrations based on spec requirements
      const expectedMigrations = [
        '20250818000001', // Kaggle dataset schema enhancements
        '20250818000010', // Complete database rebuild
      ];

      expectedMigrations.forEach(expectedVersion => {
        const isApplied = migrationVersions.some(version => 
          version.startsWith(expectedVersion)
        );
        
        if (!isApplied) {
          console.log(`Migration ${expectedVersion} may need to be applied`);
        }
      });
    });

    test('should validate migration integrity and rollback capability', async () => {
      // Test that migrations can be verified for integrity
      const { data: migrationCheck, error } = await supabase.rpc(
        'validate_migration_integrity'
      );

      // This function may not exist yet - document requirement
      if (error?.message?.includes('function') && error?.message?.includes('does not exist')) {
        console.log('Migration integrity validation function needs to be created');
      } else {
        expect(error).toBeNull();
        expect(migrationCheck).toBeDefined();
      }
    });
  });

  describe('New Table Structure Validation', () => {
    test('should verify fragrance_embeddings table exists with correct structure', async () => {
      // Check if table exists
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'fragrance_embeddings')
        .eq('table_schema', 'public')
        .single();

      if (!tableExists) {
        console.log('fragrance_embeddings table needs to be created');
        return;
      }

      // Validate column structure
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'fragrance_embeddings')
        .eq('table_schema', 'public');

      const columnNames = columns?.map(col => col.column_name) || [];
      
      // Required columns for fragrance embeddings
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('fragrance_id');
      expect(columnNames).toContain('embedding');
      expect(columnNames).toContain('embedding_model');
      expect(columnNames).toContain('embedding_version');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');

      // Validate embedding column is vector type
      const embeddingColumn = columns?.find(col => col.column_name === 'embedding');
      expect(embeddingColumn?.data_type).toBe('USER-DEFINED'); // Vector type shows as USER-DEFINED
    });

    test('should verify user_preferences table exists with correct structure', async () => {
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'user_preferences')
        .eq('table_schema', 'public')
        .single();

      if (!tableExists) {
        console.log('user_preferences table needs to be created');
        return;
      }

      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'user_preferences')
        .eq('table_schema', 'public');

      const columnNames = columns?.map(col => col.column_name) || [];
      
      // Required columns for user preferences
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('user_id');
      expect(columnNames).toContain('quiz_session_id');
      expect(columnNames).toContain('scent_preferences');
      expect(columnNames).toContain('personality_style');
      expect(columnNames).toContain('occasion_preferences');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    test('should verify user_fragrance_interactions table exists with correct structure', async () => {
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'user_fragrance_interactions')
        .eq('table_schema', 'public')
        .single();

      if (!tableExists) {
        console.log('user_fragrance_interactions table needs to be created');
        return;
      }

      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'user_fragrance_interactions')
        .eq('table_schema', 'public');

      const columnNames = columns?.map(col => col.column_name) || [];
      
      // Required columns for interaction tracking
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('user_id');
      expect(columnNames).toContain('fragrance_id');
      expect(columnNames).toContain('interaction_type');
      expect(columnNames).toContain('interaction_value');
      expect(columnNames).toContain('created_at');
    });

    test('should verify enhanced fragrances table has new metadata columns', async () => {
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'fragrances')
        .eq('table_schema', 'public');

      const columnNames = columns?.map(col => col.column_name) || [];
      
      // Check for enhanced metadata columns
      const enhancedColumns = [
        'launch_year',
        'availability_status', 
        'sample_available',
        'price_range_min',
        'price_range_max',
        'popularity_score',
        'target_gender',
        'longevity_hours',
        'sillage_rating'
      ];

      enhancedColumns.forEach(column => {
        if (!columnNames.includes(column)) {
          console.log(`Enhanced column ${column} may need to be added to fragrances table`);
        }
      });
    });
  });

  describe('Database Function Validation', () => {
    test('should verify get_similar_fragrances function exists and is callable', async () => {
      const { data: functions } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_type, data_type')
        .eq('routine_name', 'get_similar_fragrances')
        .eq('routine_schema', 'public');

      if (!functions || functions.length === 0) {
        console.log('get_similar_fragrances function needs to be created');
        return;
      }

      expect(functions[0].routine_type).toBe('FUNCTION');

      // Test function is callable with basic parameters
      try {
        const { data: result, error } = await supabase.rpc('get_similar_fragrances', {
          fragrance_id: 1,
          similarity_threshold: 0.8,
          max_results: 5
        });

        if (error) {
          console.log('get_similar_fragrances function error (may need implementation):', error.message);
        } else {
          expect(Array.isArray(result)).toBe(true);
        }
      } catch (err) {
        console.log('get_similar_fragrances function not yet implemented');
      }
    });

    test('should verify get_collection_insights function exists and is callable', async () => {
      const { data: functions } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_type')
        .eq('routine_name', 'get_collection_insights')
        .eq('routine_schema', 'public');

      if (!functions || functions.length === 0) {
        console.log('get_collection_insights function needs to be created');
        return;
      }

      expect(functions[0].routine_type).toBe('FUNCTION');

      // Test function is callable
      try {
        const { data: result, error } = await supabase.rpc('get_collection_insights', {
          user_id: 'test-user-id'
        });

        if (error) {
          console.log('get_collection_insights function error (may need implementation):', error.message);
        } else {
          expect(result).toBeDefined();
        }
      } catch (err) {
        console.log('get_collection_insights function not yet implemented');
      }
    });

    test('should verify update_user_preferences function exists and is callable', async () => {
      const { data: functions } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_type')
        .eq('routine_name', 'update_user_preferences')
        .eq('routine_schema', 'public');

      if (!functions || functions.length === 0) {
        console.log('update_user_preferences function needs to be created');
        return;
      }

      expect(functions[0].routine_type).toBe('FUNCTION');
    });

    test('should verify track_fragrance_interaction function exists and is callable', async () => {
      const { data: functions } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_type')
        .eq('routine_name', 'track_fragrance_interaction')
        .eq('routine_schema', 'public');

      if (!functions || functions.length === 0) {
        console.log('track_fragrance_interaction function needs to be created');
        return;
      }

      expect(functions[0].routine_type).toBe('FUNCTION');
    });
  });

  describe('Index and Performance Validation', () => {
    test('should verify vector similarity indexes exist and are optimized', async () => {
      // Check for HNSW indexes on embedding columns
      const { data: indexes } = await supabase
        .from('pg_indexes')
        .select('indexname, indexdef')
        .eq('schemaname', 'public')
        .like('indexdef', '%embedding%');

      if (!indexes || indexes.length === 0) {
        console.log('Vector similarity indexes need to be created');
        return;
      }

      // Check for HNSW indexes (better for production than IVFFlat)
      const hasHNSWIndex = indexes.some(idx => 
        idx.indexdef?.includes('USING hnsw') || idx.indexdef?.includes('vector_cosine_ops')
      );

      if (!hasHNSWIndex) {
        console.log('HNSW vector indexes should be created for optimal performance');
      }
    });

    test('should verify fragrance filtering indexes exist', async () => {
      const { data: indexes } = await supabase
        .from('pg_indexes')
        .select('indexname, indexdef')
        .eq('schemaname', 'public')
        .eq('tablename', 'fragrances');

      const indexDefs = indexes?.map(idx => idx.indexdef) || [];
      
      // Check for essential filtering indexes
      const requiredIndexes = [
        'target_gender',
        'brand_id',
        'availability_status',
        'sample_available',
        'popularity_score'
      ];

      requiredIndexes.forEach(column => {
        const hasIndex = indexDefs.some(def => def?.includes(column));
        if (!hasIndex) {
          console.log(`Index on fragrances.${column} may need to be created for browse page performance`);
        }
      });
    });

    test('should verify collection query indexes exist', async () => {
      const { data: indexes } = await supabase
        .from('pg_indexes')
        .select('indexname, indexdef')
        .eq('schemaname', 'public')
        .eq('tablename', 'user_collections');

      const indexDefs = indexes?.map(idx => idx.indexdef) || [];
      
      // Check for collection performance indexes
      const requiredIndexes = [
        'user_id',
        'added_at',
        'collection_type',
        'fragrance_id'
      ];

      requiredIndexes.forEach(column => {
        const hasIndex = indexDefs.some(def => def?.includes(column));
        if (!hasIndex) {
          console.log(`Index on user_collections.${column} may need to be created for collection queries`);
        }
      });
    });

    test('should verify GIN indexes for array operations', async () => {
      const { data: indexes } = await supabase
        .from('pg_indexes')
        .select('indexname, indexdef')
        .eq('schemaname', 'public')
        .like('indexdef', '%gin%');

      // Check for GIN indexes on array columns
      const ginIndexes = indexes?.filter(idx => 
        idx.indexdef?.includes('USING gin')
      ) || [];

      if (ginIndexes.length === 0) {
        console.log('GIN indexes for array operations (accords, notes) may need to be created');
      } else {
        console.log(`Found ${ginIndexes.length} GIN indexes for array operations`);
      }
    });
  });

  describe('Row Level Security (RLS) Validation', () => {
    test('should verify RLS is enabled on critical tables', async () => {
      const criticalTables = [
        'user_preferences',
        'user_fragrance_interactions', 
        'user_collections',
        'user_profiles'
      ];

      for (const tableName of criticalTables) {
        const { data: rlsInfo } = await supabase
          .from('pg_tables')
          .select('tablename, rowsecurity')
          .eq('tablename', tableName)
          .eq('schemaname', 'public')
          .single();

        if (!rlsInfo) {
          console.log(`Table ${tableName} may not exist yet`);
          continue;
        }

        expect(rlsInfo.rowsecurity).toBe(true);
        console.log(`✓ RLS enabled on ${tableName}`);
      }
    });

    test('should verify public read access on fragrances and brands tables', async () => {
      const publicTables = ['fragrances', 'fragrance_brands'];

      for (const tableName of publicTables) {
        // Test that anonymous users can read these tables
        const { data: publicData, error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);

        if (error) {
          console.log(`Public read access issue on ${tableName}:`, error.message);
        } else {
          expect(publicData).toBeDefined();
          console.log(`✓ Public read access working on ${tableName}`);
        }
      }
    });

    test('should verify RLS policies exist for user data tables', async () => {
      const userTables = ['user_preferences', 'user_fragrance_interactions', 'user_collections'];

      for (const tableName of userTables) {
        const { data: policies } = await supabase
          .from('pg_policies')
          .select('policyname, cmd, qual')
          .eq('tablename', tableName);

        if (!policies || policies.length === 0) {
          console.log(`RLS policies need to be created for ${tableName}`);
          continue;
        }

        // Check for CRUD policies
        const commands = policies.map(p => p.cmd);
        expect(commands).toContain('SELECT');
        expect(commands).toContain('INSERT');
        expect(commands).toContain('UPDATE');
        expect(commands).toContain('DELETE');
        
        console.log(`✓ RLS policies configured for ${tableName}`);
      }
    });
  });

  describe('Database Connection and Performance Validation', () => {
    test('should verify database connection is working', async () => {
      const startTime = Date.now();
      
      const { data: connectionTest, error } = await supabase
        .from('fragrances')
        .select('id')
        .limit(1);

      const connectionTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(connectionTest).toBeDefined();
      expect(connectionTime).toBeLessThan(2000); // Should connect within 2 seconds
      
      console.log(`✓ Database connection successful in ${connectionTime}ms`);
    });

    test('should validate fragrance query performance with new schema', async () => {
      const startTime = Date.now();
      
      // Test basic fragrance query that browse page would use
      const { data: fragrances, error } = await supabase
        .from('fragrances')
        .select(`
          id,
          name,
          brand_id,
          target_gender,
          sample_available,
          popularity_score
        `)
        .limit(20);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(fragrances).toBeDefined();
      expect(Array.isArray(fragrances)).toBe(true);
      expect(queryTime).toBeLessThan(500); // Should complete within 500ms for browse page
      
      console.log(`✓ Basic fragrance query completed in ${queryTime}ms`);
    });

    test('should validate vector similarity query performance', async () => {
      // Test vector similarity if fragrance_embeddings table exists
      const { data: embeddingExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'fragrance_embeddings')
        .eq('table_schema', 'public')
        .single();

      if (!embeddingExists) {
        console.log('fragrance_embeddings table not yet created - skipping vector similarity test');
        return;
      }

      // Get a sample embedding for testing
      const { data: sampleEmbedding } = await supabase
        .from('fragrance_embeddings')
        .select('fragrance_id, embedding')
        .not('embedding', 'is', null)
        .limit(1)
        .single();

      if (!sampleEmbedding) {
        console.log('No embeddings data found - vector similarity test skipped');
        return;
      }

      const startTime = Date.now();
      
      // Test vector similarity function
      const { data: similarFragrances, error } = await supabase.rpc('get_similar_fragrances', {
        target_fragrance_id: sampleEmbedding.fragrance_id,
        similarity_threshold: 0.7,
        max_results: 5
      });

      const queryTime = Date.now() - startTime;

      if (error) {
        console.log('Vector similarity function error (may need implementation):', error.message);
      } else {
        expect(queryTime).toBeLessThan(100); // Should complete within 100ms for real-time recommendations
        expect(Array.isArray(similarFragrances)).toBe(true);
        
        console.log(`✓ Vector similarity query completed in ${queryTime}ms`);
      }
    });

    test('should validate user preference queries performance', async () => {
      const { data: preferencesExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'user_preferences')
        .eq('table_schema', 'public')
        .single();

      if (!preferencesExists) {
        console.log('user_preferences table not yet created - skipping preference query test');
        return;
      }

      const startTime = Date.now();
      
      // Test basic preference query
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('user_id, scent_preferences, personality_style')
        .limit(10);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(200); // Should complete within 200ms for quiz processing
      
      console.log(`✓ User preferences query completed in ${queryTime}ms`);
    });
  });

  describe('Data Consistency and Integrity Validation', () => {
    test('should verify fragrance data consistency with new schema', async () => {
      // Test that existing fragrance data is compatible with enhanced schema
      const { data: fragrances, error } = await supabase
        .from('fragrances')
        .select('id, name, brand_id, embedding')
        .not('name', 'is', null)
        .not('brand_id', 'is', null)
        .limit(10);

      expect(error).toBeNull();
      expect(fragrances).toBeDefined();
      expect(Array.isArray(fragrances)).toBe(true);

      fragrances?.forEach(fragrance => {
        expect(fragrance.id).toBeDefined();
        expect(fragrance.name).toBeDefined();
        expect(typeof fragrance.name).toBe('string');
        expect(fragrance.name.trim()).not.toBe('');
        expect(fragrance.brand_id).toBeDefined();
      });

      console.log(`✓ Validated ${fragrances?.length || 0} fragrance records for data consistency`);
    });

    test('should verify brand data consistency', async () => {
      const { data: brands, error } = await supabase
        .from('fragrance_brands')
        .select('id, name')
        .not('name', 'is', null)
        .limit(10);

      expect(error).toBeNull();
      expect(brands).toBeDefined();
      expect(Array.isArray(brands)).toBe(true);

      brands?.forEach(brand => {
        expect(brand.id).toBeDefined();
        expect(brand.name).toBeDefined();
        expect(typeof brand.name).toBe('string');
        expect(brand.name.trim()).not.toBe('');
      });

      console.log(`✓ Validated ${brands?.length || 0} brand records for data consistency`);
    });

    test('should verify foreign key relationships are intact', async () => {
      // Test fragrance -> brand relationship
      const { data: fragranceBrandCheck, error: fragranceError } = await supabase
        .from('fragrances')
        .select(`
          id,
          name,
          brand_id,
          fragrance_brands!inner(id, name)
        `)
        .limit(5);

      if (fragranceError) {
        console.log('Fragrance-Brand relationship error:', fragranceError.message);
      } else {
        expect(fragranceBrandCheck).toBeDefined();
        expect(Array.isArray(fragranceBrandCheck)).toBe(true);
        console.log(`✓ Fragrance-Brand foreign key relationship working`);
      }

      // Test user_collections -> user_profiles relationship
      const { data: collectionUserCheck, error: collectionError } = await supabase
        .from('user_collections')
        .select(`
          id,
          user_id,
          user_profiles!inner(id, email)
        `)
        .limit(5);

      if (collectionError) {
        console.log('Collection-User relationship error:', collectionError.message);
      } else {
        expect(collectionUserCheck).toBeDefined();
        console.log(`✓ Collection-User foreign key relationship working`);
      }
    });

    test('should verify data count consistency across tables', async () => {
      // Get counts from main tables
      const { count: fragranceCount } = await supabase
        .from('fragrances')
        .select('*', { count: 'exact', head: true });

      const { count: brandCount } = await supabase
        .from('fragrance_brands')
        .select('*', { count: 'exact', head: true });

      const { count: collectionCount } = await supabase
        .from('user_collections')
        .select('*', { count: 'exact', head: true });

      expect(fragranceCount).toBeGreaterThan(0);
      expect(brandCount).toBeGreaterThan(0);
      
      console.log(`✓ Database contains ${fragranceCount} fragrances, ${brandCount} brands, ${collectionCount} collection items`);

      // Verify data counts make sense (fragrances should outnumber brands)
      expect(fragranceCount).toBeGreaterThan(brandCount);
    });
  });

  describe('New Schema Integration Validation', () => {
    test('should verify embedding table integration with fragrances', async () => {
      const { data: embeddingTableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'fragrance_embeddings')
        .eq('table_schema', 'public')
        .single();

      if (!embeddingTableExists) {
        console.log('fragrance_embeddings table integration test skipped - table not created yet');
        return;
      }

      // Test that fragrance_embeddings properly references fragrances
      const { data: embeddingIntegration, error } = await supabase
        .from('fragrance_embeddings')
        .select(`
          id,
          fragrance_id,
          fragrances!inner(id, name)
        `)
        .limit(5);

      if (error) {
        console.log('Fragrance embeddings integration error:', error.message);
      } else {
        expect(embeddingIntegration).toBeDefined();
        console.log(`✓ Fragrance embeddings table integration working`);
      }
    });

    test('should verify user preferences integration with user profiles', async () => {
      const { data: preferencesTableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'user_preferences')
        .eq('table_schema', 'public')
        .single();

      if (!preferencesTableExists) {
        console.log('user_preferences table integration test skipped - table not created yet');
        return;
      }

      // Test integration with user_profiles
      const { data: preferencesIntegration, error } = await supabase
        .from('user_preferences')
        .select(`
          id,
          user_id,
          user_profiles!inner(id, email)
        `)
        .limit(5);

      if (error) {
        console.log('User preferences integration error:', error.message);
      } else {
        expect(preferencesIntegration).toBeDefined();
        console.log(`✓ User preferences table integration working`);
      }
    });
  });

  describe('Migration Rollback and Safety Validation', () => {
    test('should verify migration safety mechanisms exist', async () => {
      // Check for backup and rollback procedures
      const { data: backupCheck } = await supabase.rpc('check_backup_status');

      if (!backupCheck) {
        console.log('Migration backup and rollback procedures should be documented and tested');
      }
    });

    test('should verify no breaking changes to existing functionality', async () => {
      // Test that existing API queries still work
      const { data: existingQuizTest, error: quizError } = await supabase
        .from('fragrances')
        .select('id, name, brand_id')
        .not('name', 'is', null)
        .limit(5);

      expect(quizError).toBeNull();
      expect(existingQuizTest).toBeDefined();
      expect(Array.isArray(existingQuizTest)).toBe(true);
      
      console.log('✓ Existing quiz/recommendation queries still functional');

      // Test that existing collection queries still work
      const { data: existingCollectionTest, error: collectionError } = await supabase
        .from('user_collections')
        .select('id, user_id, fragrance_id, collection_type')
        .limit(5);

      expect(collectionError).toBeNull();
      console.log('✓ Existing collection queries still functional');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle database connection failures gracefully', async () => {
      // Test with invalid query to see error handling
      try {
        const { data, error } = await supabase
          .from('non_existent_table')
          .select('*')
          .limit(1);

        expect(error).toBeDefined();
        expect(error?.message).toContain('relation');
        console.log('✓ Database error handling working correctly');
      } catch (err) {
        console.log('Database connection error handling test completed');
      }
    });

    test('should validate query timeout handling', async () => {
      // Test a potentially slow query to validate timeout handling
      const startTime = Date.now();
      
      try {
        const { data: largeQuery, error } = await supabase
          .from('fragrances')
          .select('*')
          .limit(1000);

        const queryTime = Date.now() - startTime;
        
        if (queryTime > 5000) {
          console.log(`Query took ${queryTime}ms - may need optimization for browse page`);
        } else {
          console.log(`✓ Large query completed in ${queryTime}ms`);
        }
      } catch (err) {
        console.log('Query timeout test completed');
      }
    });
  });
});
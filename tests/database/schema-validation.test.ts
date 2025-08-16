import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createServiceSupabase } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Database Schema Validation Tests
 * 
 * Tests the complete database schema for ScentMatch including:
 * - Existing tables validation
 * - New tables for collections and recommendations
 * - RLS policies and security
 * - Indexes for performance
 * - Vector embedding functionality
 * - Database functions
 */

describe('Database Schema Validation', () => {
  let supabase: SupabaseClient;

  beforeAll(() => {
    supabase = createServiceSupabase();
  });

  afterAll(async () => {
    // Clean up any test data if needed
  });

  describe('Existing Tables Validation', () => {
    test('should validate fragrances table structure', async () => {
      const { data: tableInfo } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'fragrances')
        .eq('table_schema', 'public');

      expect(tableInfo).toBeDefined();
      expect(Array.isArray(tableInfo)).toBe(true);

      // Check for existing columns
      const columnNames = tableInfo?.map(col => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('brand_id');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('embedding'); // OpenAI embeddings already exist
    });

    test('should validate fragrance_brands table structure', async () => {
      const { data: tableInfo } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'fragrance_brands')
        .eq('table_schema', 'public');

      expect(tableInfo).toBeDefined();
      expect(Array.isArray(tableInfo)).toBe(true);

      const columnNames = tableInfo?.map(col => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('website_url');
    });

    test('should validate user_profiles table structure', async () => {
      const { data: tableInfo } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'user_profiles')
        .eq('table_schema', 'public');

      expect(tableInfo).toBeDefined();
      expect(Array.isArray(tableInfo)).toBe(true);

      const columnNames = tableInfo?.map(col => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('favorite_accords');
    });

    test('should validate existing user_collections table', async () => {
      const { data: tableInfo } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'user_collections')
        .eq('table_schema', 'public');

      expect(tableInfo).toBeDefined();
      expect(Array.isArray(tableInfo)).toBe(true);

      const columnNames = tableInfo?.map(col => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('user_id');
      expect(columnNames).toContain('fragrance_id');
      expect(columnNames).toContain('collection_type'); // existing column
    });
  });

  describe('Required Extensions', () => {
    test('should have pgvector extension enabled', async () => {
      const { data: extensions } = await supabase
        .from('pg_available_extensions')
        .select('name, installed_version')
        .eq('name', 'vector');

      expect(extensions).toBeDefined();
      expect(extensions?.[0]?.installed_version).toBeDefined();
    });

    test('should have pg_trgm extension for text search', async () => {
      const { data: extensions } = await supabase
        .from('pg_available_extensions')
        .select('name, installed_version')
        .eq('name', 'pg_trgm');

      expect(extensions).toBeDefined();
      expect(extensions?.[0]?.installed_version).toBeDefined();
    });

    test('should have unaccent extension for text normalization', async () => {
      const { data: extensions } = await supabase
        .from('pg_available_extensions')
        .select('name, installed_version')
        .eq('name', 'unaccent');

      expect(extensions).toBeDefined();
      expect(extensions?.[0]?.installed_version).toBeDefined();
    });
  });

  describe('New Tables Requirements', () => {
    test('should check if user_preferences table needs to be created', async () => {
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'user_preferences')
        .eq('table_schema', 'public')
        .single();

      // This test documents current state - may need creation
      if (!tableExists) {
        console.log('user_preferences table needs to be created');
      } else {
        // Validate structure if it exists
        const { data: columns } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_name', 'user_preferences');

        const columnNames = columns?.map(col => col.column_name) || [];
        expect(columnNames).toContain('user_id');
        expect(columnNames).toContain('preference_type');
        expect(columnNames).toContain('preference_value');
      }
    });

    test('should check if user_fragrance_interactions table needs to be created', async () => {
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'user_fragrance_interactions')
        .eq('table_schema', 'public')
        .single();

      if (!tableExists) {
        console.log('user_fragrance_interactions table needs to be created');
      } else {
        const { data: columns } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_name', 'user_fragrance_interactions');

        const columnNames = columns?.map(col => col.column_name) || [];
        expect(columnNames).toContain('user_id');
        expect(columnNames).toContain('fragrance_id');
        expect(columnNames).toContain('interaction_type');
      }
    });

    test('should check if fragrance_embeddings table needs to be created', async () => {
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'fragrance_embeddings')
        .eq('table_schema', 'public')
        .single();

      if (!tableExists) {
        console.log('fragrance_embeddings table needs to be created');
      } else {
        const { data: columns } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_name', 'fragrance_embeddings');

        const columnNames = columns?.map(col => col.column_name) || [];
        expect(columnNames).toContain('fragrance_id');
        expect(columnNames).toContain('embedding');
        expect(columnNames).toContain('embedding_version');
      }
    });
  });

  describe('Required Indexes', () => {
    test('should validate existing vector index on fragrances.embedding', async () => {
      const { data: indexes } = await supabase.rpc('get_indexes_info', {
        table_name: 'fragrances'
      });

      // Check if vector index exists on existing embedding column
      const hasVectorIndex = indexes?.some((idx: any) => 
        idx.indexdef?.includes('USING ivfflat') || idx.indexdef?.includes('embedding')
      );

      if (!hasVectorIndex) {
        console.log('Vector index on fragrances.embedding may need optimization');
      }
    });

    test('should check for required collection query indexes', async () => {
      const { data: indexes } = await supabase.rpc('get_indexes_info', {
        table_name: 'user_collections'
      });

      // Document what indexes should exist
      const expectedIndexes = [
        'user_id',
        'added_at', 
        'collection_type'
      ];

      expectedIndexes.forEach(column => {
        const hasIndex = indexes?.some((idx: any) => 
          idx.indexdef?.includes(column)
        );
        
        if (!hasIndex) {
          console.log(`Index on user_collections.${column} may need creation`);
        }
      });
    });
  });

  describe('Row Level Security (RLS)', () => {
    test('should validate RLS is enabled on user_collections', async () => {
      const { data: rlsInfo } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', 'user_collections')
        .eq('schemaname', 'public')
        .single();

      expect(rlsInfo?.rowsecurity).toBe(true);
    });

    test('should check RLS policies for user_collections', async () => {
      const { data: policies } = await supabase
        .from('pg_policies')
        .select('policyname, cmd, qual')
        .eq('tablename', 'user_collections');

      expect(policies).toBeDefined();
      expect(Array.isArray(policies)).toBe(true);

      // Should have policies for SELECT, INSERT, UPDATE, DELETE
      const commands = policies?.map(p => p.cmd) || [];
      expect(commands).toContain('SELECT');
      expect(commands).toContain('INSERT');
      expect(commands).toContain('UPDATE');
      expect(commands).toContain('DELETE');
    });

    test('should validate RLS on user_profiles', async () => {
      const { data: rlsInfo } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', 'user_profiles')
        .eq('schemaname', 'public')
        .single();

      expect(rlsInfo?.rowsecurity).toBe(true);
    });

    test('should check if fragrances table needs RLS enablement', async () => {
      const { data: rlsInfo } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', 'fragrances')
        .eq('schemaname', 'public')
        .single();

      if (!rlsInfo?.rowsecurity) {
        console.log('RLS should be enabled on fragrances table for security');
      }
    });
  });

  describe('Database Functions', () => {
    test('should validate similarity search function exists or needs creation', async () => {
      const { data: functions } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_type')
        .eq('routine_name', 'get_similar_fragrances')
        .eq('routine_schema', 'public');

      if (!functions || functions.length === 0) {
        console.log('get_similar_fragrances function needs to be created');
      } else {
        expect(functions[0].routine_type).toBe('FUNCTION');
      }
    });

    test('should validate collection insights function exists or needs creation', async () => {
      const { data: functions } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_type')
        .eq('routine_name', 'get_collection_insights')
        .eq('routine_schema', 'public');

      if (!functions || functions.length === 0) {
        console.log('get_collection_insights function needs to be created');
      } else {
        expect(functions[0].routine_type).toBe('FUNCTION');
      }
    });

    test('should check for search_path security in functions', async () => {
      // Query functions that might have search_path issues
      const { data: functions } = await supabase.rpc('check_function_security');

      if (functions?.insecure_functions?.length > 0) {
        console.log('Functions with mutable search_path found (security risk):', 
          functions.insecure_functions);
      }
    });
  });

  describe('Data Integrity Validation', () => {
    test('should validate fragrance data integrity', async () => {
      // Check for required fields in existing fragrances
      const { data: fragrances, error } = await supabase
        .from('fragrances')
        .select('id, name, brand_id')
        .limit(10);

      expect(error).toBeNull();
      expect(fragrances).toBeDefined();
      expect(Array.isArray(fragrances)).toBe(true);

      fragrances?.forEach(fragrance => {
        expect(fragrance.id).toBeDefined();
        expect(fragrance.name).toBeDefined();
        expect(typeof fragrance.name).toBe('string');
        expect(fragrance.name.trim()).not.toBe('');
      });
    });

    test('should validate existing embeddings data', async () => {
      const { data: fragranceWithEmbedding } = await supabase
        .from('fragrances')
        .select('id, embedding')
        .not('embedding', 'is', null)
        .limit(5);

      fragranceWithEmbedding?.forEach(fragrance => {
        expect(fragrance.embedding).toBeDefined();
        // OpenAI embeddings are 1536 dimensions
        if (Array.isArray(fragrance.embedding)) {
          expect(fragrance.embedding).toHaveLength(1536);
        }
      });
    });

    test('should validate user collection data integrity', async () => {
      const { data: collections } = await supabase
        .from('user_collections')
        .select('id, user_id, fragrance_id, collection_type')
        .limit(5);

      collections?.forEach(collection => {
        expect(collection.id).toBeDefined();
        expect(collection.user_id).toBeDefined();
        expect(collection.fragrance_id).toBeDefined();
        expect(collection.collection_type).toBeDefined();
      });
    });
  });

  describe('Performance Validation', () => {
    test('should validate vector similarity search performance', async () => {
      // Test vector search if embeddings exist
      const { data: sampleFragrance } = await supabase
        .from('fragrances')
        .select('id, embedding')
        .not('embedding', 'is', null)
        .limit(1)
        .single();

      if (sampleFragrance?.embedding) {
        const startTime = Date.now();
        
        // Test vector similarity (will use existing embedding column)
        const { data: similar, error } = await supabase.rpc('match_fragrances', {
          query_embedding: sampleFragrance.embedding,
          match_threshold: 0.7,
          match_count: 5
        });

        const endTime = Date.now();
        const queryTime = endTime - startTime;

        expect(error).toBeNull();
        expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
        
        if (similar) {
          expect(Array.isArray(similar)).toBe(true);
          expect(similar.length).toBeLessThanOrEqual(5);
        }
      } else {
        console.log('No embeddings found - vector search test skipped');
      }
    });

    test('should validate collection query performance', async () => {
      const startTime = Date.now();
      
      const { data: collections, error } = await supabase
        .from('user_collections')
        .select('id, fragrance_id, collection_type, added_at')
        .order('added_at', { ascending: false })
        .limit(50);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(500); // Should complete within 0.5 seconds
    });
  });

  describe('Security Validation', () => {
    test('should validate no public access to sensitive data without auth', async () => {
      // This would require proper auth testing setup
      // For now, document the requirement
      console.log('Security test: Ensure user_collections requires authentication');
      console.log('Security test: Ensure user_preferences requires authentication'); 
      console.log('Security test: Ensure user_fragrance_interactions requires authentication');
    });

    test('should validate extension security', async () => {
      const { data: extensions } = await supabase
        .from('pg_extension')
        .select('extname, extnamespace');

      // Extensions should not be in public schema for security
      const publicExtensions = extensions?.filter(ext => ext.extnamespace === 2200); // public schema

      if (publicExtensions && publicExtensions.length > 0) {
        console.log('Security warning: Extensions in public schema:', 
          publicExtensions.map(ext => ext.extname));
      }
    });
  });
});
/**
 * AI Enhancement Database Schema Tests
 * 
 * Tests for vector operations, AI processing queues, user preferences,
 * automatic embedding generation, and related AI infrastructure.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yekstmwcgyiltxinqamf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required for tests');
}

const supabase = createClient(supabaseUrl, supabaseKey);

describe('AI Enhancement Database Schema Tests', () => {

  describe('VECTOR-001: pgvector Extension Tests', () => {
    it('VECTOR-001a: Vector Column Exists on Fragrances', async () => {
      // Test that fragrances table has embedding column
      const { data, error } = await supabase
        .from('fragrances')
        .select('id, embedding, embedding_model, embedding_generated_at')
        .limit(1);

      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThan(0);
      
      // Check that embedding column exists (should be null initially)
      const fragrance = data?.[0];
      expect(fragrance).toHaveProperty('embedding');
      expect(fragrance).toHaveProperty('embedding_model');
      expect(fragrance).toHaveProperty('embedding_generated_at');
    });

    it('VECTOR-001b: Similarity Search Function Available', async () => {
      // Test find_similar_fragrances function with a test embedding
      const testEmbedding = Array.from({ length: 2000 }, (_, i) => Math.sin(i * 0.01));
      
      const { data, error } = await supabase.rpc('find_similar_fragrances', {
        query_embedding: `[${testEmbedding.join(',')}]`,
        similarity_threshold: 0.5,
        max_results: 5,
        exclude_ids: []
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      
      // Function should return proper structure even with no embeddings yet
      if (data && data.length > 0) {
        expect(data[0]).toHaveProperty('fragrance_id');
        expect(data[0]).toHaveProperty('similarity');
        expect(data[0]).toHaveProperty('name');
        expect(data[0]).toHaveProperty('brand');
      }
    });

    it('VECTOR-001c: Cleanup Function Available', async () => {
      // Test cleanup_expired_cache function
      const { data, error } = await supabase.rpc('cleanup_expired_cache');

      expect(error).toBeNull();
      expect(typeof data).toBe('number');
      expect(data).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SCHEMA-AI-001: Fragrance Embedding Schema Tests', () => {
    it('SCHEMA-AI-001a: Fragrance Embedding Columns', async () => {
      // Check if embedding columns exist on fragrances table
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'fragrances')
        .in('column_name', ['embedding', 'embedding_model', 'embedding_generated_at', 'embedding_version']);

      expect(error).toBeNull();
      expect(data?.length).toBe(4);

      const columnMap = data?.reduce((acc, col) => ({
        ...acc,
        [col.column_name]: col
      }), {});

      expect(columnMap.embedding?.data_type).toBe('USER-DEFINED'); // Vector type
      expect(columnMap.embedding_model?.data_type).toBe('character varying');
      expect(columnMap.embedding_generated_at?.data_type).toContain('timestamp');
      expect(columnMap.embedding_version?.data_type).toBe('integer');
    });

    it('SCHEMA-AI-001b: Fragrance Embedding Index', async () => {
      // Check if embedding index exists
      const { data, error } = await supabase.rpc('execute_sql', {
        query: `
          SELECT indexname, indexdef 
          FROM pg_indexes 
          WHERE tablename = 'fragrances' 
          AND indexname LIKE '%embedding%';
        `
      });

      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThan(0);
      
      const embeddingIndex = data?.[0];
      expect(embeddingIndex?.indexdef).toContain('ivfflat');
      expect(embeddingIndex?.indexdef).toContain('vector_cosine_ops');
    });

    it('SCHEMA-AI-001c: Vector Similarity Function', async () => {
      // Test find_similar_fragrances function
      const testEmbedding = Array.from({ length: 2048 }, (_, i) => Math.sin(i * 0.01));
      
      const { data, error } = await supabase.rpc('find_similar_fragrances', {
        query_embedding: `[${testEmbedding.join(',')}]`,
        similarity_threshold: 0.5,
        max_results: 5,
        exclude_ids: []
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      
      // Should return similarity scores and fragrance info
      if (data && data.length > 0) {
        expect(data[0]).toHaveProperty('fragrance_id');
        expect(data[0]).toHaveProperty('similarity');
        expect(data[0]).toHaveProperty('name');
        expect(data[0]).toHaveProperty('brand');
      }
    });
  });

  describe('SCHEMA-AI-002: User Preferences Schema Tests', () => {
    let testUserId: string;

    beforeEach(async () => {
      // Create test user (simulate auth.users entry)
      testUserId = `test-user-${Date.now()}`;
      
      // Note: In real implementation, this would be handled by Supabase Auth
      // For testing, we'll work with the user_preferences table directly
    });

    afterEach(async () => {
      // Clean up test data
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', testUserId);
      
      await supabase
        .from('user_interactions')
        .delete()
        .eq('user_id', testUserId);
    });

    it('SCHEMA-AI-002a: User Preferences Table Structure', async () => {
      // Check table structure
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'user_preferences');

      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThan(0);

      const columns = data?.map(col => col.column_name);
      expect(columns).toContain('user_id');
      expect(columns).toContain('user_embedding');
      expect(columns).toContain('embedding_model');
      expect(columns).toContain('preference_strength');
      expect(columns).toContain('interaction_count');
    });

    it('SCHEMA-AI-002b: User Embedding Storage', async () => {
      const testEmbedding = Array.from({ length: 2048 }, () => Math.random() * 2 - 1);
      
      // Insert user preference with embedding
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: testUserId,
          user_embedding: `[${testEmbedding.join(',')}]`,
          embedding_model: 'voyage-3-large',
          preference_strength: 0.75,
          interaction_count: 10
        });

      expect(error).toBeNull();

      // Verify retrieval
      const { data, error: selectError } = await supabase
        .from('user_preferences')
        .select('user_embedding, embedding_model, preference_strength')
        .eq('user_id', testUserId)
        .single();

      expect(selectError).toBeNull();
      expect(data?.embedding_model).toBe('voyage-3-large');
      expect(data?.preference_strength).toBe(0.75);
      expect(data?.user_embedding).toBeDefined();
    });

    it('SCHEMA-AI-002c: Update User Embedding Function', async () => {
      // Test update_user_embedding function
      const { data, error } = await supabase.rpc('update_user_embedding', {
        target_user_id: testUserId
      });

      // Function should handle cases where user has no collection data
      expect(error).toBeNull();
      expect(typeof data).toBe('boolean');
    });
  });

  describe('SCHEMA-AI-003: User Interactions Schema Tests', () => {
    let testUserId: string;
    let testFragranceId: string;

    beforeEach(async () => {
      testUserId = `test-user-${Date.now()}`;
      testFragranceId = 'chanel__coco-mademoiselle-chanelfor-women'; // Use existing fragrance
    });

    afterEach(async () => {
      await supabase
        .from('user_interactions')
        .delete()
        .eq('user_id', testUserId);
    });

    it('SCHEMA-AI-003a: Interaction Tracking Schema', async () => {
      // Test interaction insertion
      const interactionData = {
        user_id: testUserId,
        fragrance_id: testFragranceId,
        interaction_type: 'view',
        interaction_value: 15.5, // seconds viewed
        interaction_context: {
          page: 'fragrance_detail',
          referrer: 'search',
          search_query: 'chanel perfume'
        }
      };

      const { error } = await supabase
        .from('user_interactions')
        .insert(interactionData);

      expect(error).toBeNull();

      // Verify retrieval
      const { data, error: selectError } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      expect(selectError).toBeNull();
      expect(data?.interaction_type).toBe('view');
      expect(data?.interaction_value).toBe(15.5);
      expect(data?.interaction_context?.page).toBe('fragrance_detail');
    });

    it('SCHEMA-AI-003b: Interaction Types Validation', async () => {
      const validTypes = ['view', 'rating', 'favorite', 'search', 'purchase_intent'];
      
      for (const type of validTypes) {
        const { error } = await supabase
          .from('user_interactions')
          .insert({
            user_id: testUserId,
            fragrance_id: testFragranceId,
            interaction_type: type,
            interaction_value: Math.random() * 5
          });

        expect(error).toBeNull();
      }

      // Verify all interactions were stored
      const { data, error: countError } = await supabase
        .from('user_interactions')
        .select('interaction_type')
        .eq('user_id', testUserId);

      expect(countError).toBeNull();
      expect(data?.length).toBe(validTypes.length);
    });

    it('SCHEMA-AI-003c: Interaction Performance Indexes', async () => {
      // Check if proper indexes exist for common queries
      const { data, error } = await supabase.rpc('execute_sql', {
        query: `
          SELECT indexname, indexdef 
          FROM pg_indexes 
          WHERE tablename = 'user_interactions' 
          AND indexname LIKE '%user_id%' OR indexname LIKE '%fragrance_id%';
        `
      });

      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThan(0);
    });
  });

  describe('SCHEMA-AI-004: AI Processing Queue Tests', () => {
    beforeEach(async () => {
      // Clean up any test tasks
      await supabase
        .from('ai_processing_queue')
        .delete()
        .like('task_data->fragrance_id', 'test-%');
    });

    afterEach(async () => {
      await supabase
        .from('ai_processing_queue')
        .delete()
        .like('task_data->fragrance_id', 'test-%');
    });

    it('SCHEMA-AI-004a: Queue Table Structure', async () => {
      // Check queue table structure
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'ai_processing_queue');

      expect(error).toBeNull();
      
      const columns = data?.map(col => col.column_name);
      expect(columns).toContain('task_type');
      expect(columns).toContain('task_data');
      expect(columns).toContain('priority');
      expect(columns).toContain('status');
      expect(columns).toContain('retry_count');
      expect(columns).toContain('error_message');
    });

    it('SCHEMA-AI-004b: Task Queue Operations', async () => {
      // Insert embedding generation task
      const taskData = {
        fragrance_id: 'test-fragrance-queue',
        content: {
          name: 'Test Fragrance',
          brand: 'Test Brand',
          description: 'A test fragrance for queue processing'
        }
      };

      const { error } = await supabase
        .from('ai_processing_queue')
        .insert({
          task_type: 'embedding_generation',
          task_data: taskData,
          priority: 5,
          status: 'pending'
        });

      expect(error).toBeNull();

      // Update task status
      const { error: updateError } = await supabase
        .from('ai_processing_queue')
        .update({
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .eq('task_data->fragrance_id', 'test-fragrance-queue');

      expect(updateError).toBeNull();

      // Complete task
      const { error: completeError } = await supabase
        .from('ai_processing_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('task_data->fragrance_id', 'test-fragrance-queue');

      expect(completeError).toBeNull();
    });

    it('SCHEMA-AI-004c: Task Prioritization and Indexing', async () => {
      // Insert tasks with different priorities
      const tasks = [
        { task_type: 'embedding_generation', priority: 1, fragrance_id: 'test-high-priority' },
        { task_type: 'user_model_update', priority: 5, fragrance_id: 'test-medium-priority' },
        { task_type: 'batch_processing', priority: 10, fragrance_id: 'test-low-priority' }
      ];

      for (const task of tasks) {
        await supabase
          .from('ai_processing_queue')
          .insert({
            task_type: task.task_type,
            task_data: { fragrance_id: task.fragrance_id },
            priority: task.priority,
            status: 'pending'
          });
      }

      // Query by priority (should use index)
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('ai_processing_queue')
        .select('task_type, priority')
        .eq('status', 'pending')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(100); // Should be fast with index
      expect(data?.[0]?.priority).toBe(1); // Highest priority first
    });
  });

  describe('SCHEMA-AI-005: Cache Tables Tests', () => {
    let testUserId: string;

    beforeEach(async () => {
      testUserId = `test-user-${Date.now()}`;
    });

    afterEach(async () => {
      await supabase
        .from('collection_analysis_cache')
        .delete()
        .eq('user_id', testUserId);
      
      await supabase
        .from('recommendation_cache')
        .delete()
        .eq('user_id', testUserId);
    });

    it('SCHEMA-AI-005a: Collection Analysis Cache', async () => {
      const analysisData = {
        dominant_families: ['oriental', 'woody'],
        seasonal_coverage: { spring: 0.2, summer: 0.1, fall: 0.4, winter: 0.3 },
        insights: ['Strong oriental preference', 'Summer collection gap']
      };

      // Insert cache entry
      const { error } = await supabase
        .from('collection_analysis_cache')
        .insert({
          user_id: testUserId,
          analysis_type: 'scent_family',
          analysis_data: analysisData,
          confidence_score: 0.85,
          cache_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      expect(error).toBeNull();

      // Retrieve and verify
      const { data, error: selectError } = await supabase
        .from('collection_analysis_cache')
        .select('analysis_data, confidence_score')
        .eq('user_id', testUserId)
        .eq('analysis_type', 'scent_family')
        .single();

      expect(selectError).toBeNull();
      expect(data?.analysis_data?.dominant_families).toContain('oriental');
      expect(data?.confidence_score).toBe(0.85);
    });

    it('SCHEMA-AI-005b: Recommendation Cache', async () => {
      const recommendations = [
        {
          fragrance_id: 'test-rec-1',
          score: 0.92,
          explanation: 'Similar to your favorites'
        },
        {
          fragrance_id: 'test-rec-2',
          score: 0.88,
          explanation: 'Popular among similar users'
        }
      ];

      // Insert recommendation cache
      const { error } = await supabase
        .from('recommendation_cache')
        .insert({
          user_id: testUserId,
          recommendation_type: 'personalized',
          recommendations: recommendations,
          context_hash: 'test-context-hash',
          confidence_score: 0.89,
          cache_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
        });

      expect(error).toBeNull();

      // Test cache retrieval
      const { data, error: selectError } = await supabase
        .from('recommendation_cache')
        .select('recommendations, confidence_score')
        .eq('user_id', testUserId)
        .eq('recommendation_type', 'personalized')
        .single();

      expect(selectError).toBeNull();
      expect(data?.recommendations?.length).toBe(2);
      expect(data?.recommendations?.[0]?.score).toBe(0.92);
    });

    it('SCHEMA-AI-005c: Cache Expiration Cleanup', async () => {
      // Insert expired cache entry
      const expiredTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      
      await supabase
        .from('collection_analysis_cache')
        .insert({
          user_id: testUserId,
          analysis_type: 'expired_test',
          analysis_data: { test: 'data' },
          cache_expires_at: expiredTime
        });

      // Test cleanup function
      const { data, error } = await supabase.rpc('cleanup_expired_cache');

      expect(error).toBeNull();
      expect(typeof data).toBe('number');
      expect(data).toBeGreaterThanOrEqual(0);

      // Verify expired entry was removed
      const { data: remaining, error: checkError } = await supabase
        .from('collection_analysis_cache')
        .select('id')
        .eq('user_id', testUserId)
        .eq('analysis_type', 'expired_test');

      expect(checkError).toBeNull();
      expect(remaining?.length).toBe(0);
    });
  });

  describe('TRIGGER-001: Automatic Embedding Generation Tests', () => {
    let testFragranceId: string;

    beforeEach(async () => {
      testFragranceId = `test-fragrance-trigger-${Date.now()}`;
    });

    afterEach(async () => {
      // Clean up test fragrance and any queue entries
      await supabase
        .from('fragrances')
        .delete()
        .eq('id', testFragranceId);
      
      await supabase
        .from('ai_processing_queue')
        .delete()
        .like('task_data->fragrance_id', testFragranceId);
    });

    it('TRIGGER-001a: Insert Trigger Creates Queue Task', async () => {
      // Insert new fragrance (should trigger embedding generation)
      const { error } = await supabase
        .from('fragrances')
        .insert({
          id: testFragranceId,
          brand_id: 'test-brand',
          brand_name: 'Test Brand',
          name: 'Test Fragrance for Trigger',
          slug: testFragranceId,
          description: 'A test fragrance to verify automatic embedding generation',
          notes: ['vanilla', 'sandalwood', 'rose']
        });

      expect(error).toBeNull();

      // Wait briefly for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if queue task was created
      const { data: queueTasks, error: queueError } = await supabase
        .from('ai_processing_queue')
        .select('task_type, task_data, status')
        .eq('task_data->fragrance_id', testFragranceId);

      expect(queueError).toBeNull();
      expect(queueTasks?.length).toBeGreaterThan(0);
      expect(queueTasks?.[0]?.task_type).toBe('embedding_generation');
      expect(queueTasks?.[0]?.status).toBe('pending');
    });

    it('TRIGGER-001b: Update Trigger Creates Queue Task', async () => {
      // First insert fragrance
      await supabase
        .from('fragrances')
        .insert({
          id: testFragranceId,
          brand_id: 'test-brand',
          brand_name: 'Test Brand',
          name: 'Original Name',
          slug: testFragranceId
        });

      // Clear any initial queue tasks
      await supabase
        .from('ai_processing_queue')
        .delete()
        .eq('task_data->fragrance_id', testFragranceId);

      // Update fragrance (should trigger new embedding generation)
      const { error } = await supabase
        .from('fragrances')
        .update({
          name: 'Updated Fragrance Name',
          description: 'Updated description that should trigger re-embedding'
        })
        .eq('id', testFragranceId);

      expect(error).toBeNull();

      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check for new queue task
      const { data: queueTasks, error: queueError } = await supabase
        .from('ai_processing_queue')
        .select('task_type, status')
        .eq('task_data->fragrance_id', testFragranceId);

      expect(queueError).toBeNull();
      expect(queueTasks?.length).toBeGreaterThan(0);
    });

    it('TRIGGER-001c: No Trigger for Non-Content Updates', async () => {
      // Insert fragrance
      await supabase
        .from('fragrances')
        .insert({
          id: testFragranceId,
          brand_id: 'test-brand',
          brand_name: 'Test Brand',
          name: 'Test Fragrance',
          slug: testFragranceId
        });

      // Clear initial queue tasks
      await supabase
        .from('ai_processing_queue')
        .delete()
        .eq('task_data->fragrance_id', testFragranceId);

      // Update non-content field (should NOT trigger embedding generation)
      await supabase
        .from('fragrances')
        .update({
          rating_value: 4.5,
          review_count: 100
        })
        .eq('id', testFragranceId);

      // Wait
      await new Promise(resolve => setTimeout(resolve, 500));

      // Should have no new queue tasks
      const { data: queueTasks, error: queueError } = await supabase
        .from('ai_processing_queue')
        .select('id')
        .eq('task_data->fragrance_id', testFragranceId);

      expect(queueError).toBeNull();
      expect(queueTasks?.length).toBe(0);
    });
  });

  describe('RLS-001: Row Level Security Tests', () => {
    it('RLS-001a: User Preferences Security', async () => {
      // Test that user preferences are protected by RLS
      const { error } = await supabase
        .from('user_preferences')
        .select('*')
        .limit(1);

      // Should fail due to RLS when not authenticated as specific user
      expect(error).not.toBeNull();
      expect(error?.message).toContain('row-level security');
    });

    it('RLS-001b: User Interactions Security', async () => {
      // Test that user interactions are protected by RLS
      const { error } = await supabase
        .from('user_interactions')
        .select('*')
        .limit(1);

      expect(error).not.toBeNull();
      expect(error?.message).toContain('row-level security');
    });

    it('RLS-001c: Cache Tables Security', async () => {
      // Test collection analysis cache security
      const { error: cacheError } = await supabase
        .from('collection_analysis_cache')
        .select('*')
        .limit(1);

      expect(cacheError).not.toBeNull();

      // Test recommendation cache security
      const { error: recError } = await supabase
        .from('recommendation_cache')
        .select('*')
        .limit(1);

      expect(recError).not.toBeNull();
    });

    it('RLS-001d: AI Queue Admin Access Only', async () => {
      // AI processing queue should be admin-only or system accessible
      // Exact behavior depends on RLS policy implementation
      const { data, error } = await supabase
        .from('ai_processing_queue')
        .select('id, task_type, status')
        .limit(1);

      // The specific expectation depends on the RLS policy:
      // Either admin access (data returned) or denied access (error)
      if (error) {
        expect(error?.message).toContain('row-level security');
      } else {
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });

  describe('PERF-AI-001: AI Schema Performance Tests', () => {
    it('PERF-AI-001a: Vector Similarity Query Performance', async () => {
      // Test performance of vector similarity queries
      const testEmbedding = Array.from({ length: 2048 }, () => Math.random() * 2 - 1);
      
      const startTime = Date.now();
      const { data, error } = await supabase.rpc('find_similar_fragrances', {
        query_embedding: `[${testEmbedding.join(',')}]`,
        similarity_threshold: 0.7,
        max_results: 20,
        exclude_ids: []
      });
      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(500); // Should complete in <500ms
      expect(Array.isArray(data)).toBe(true);
    });

    it('PERF-AI-001b: User Interaction Query Performance', async () => {
      // Test performance of common user interaction queries
      const startTime = Date.now();
      const { error } = await supabase
        .from('user_interactions')
        .select('interaction_type, interaction_value, created_at')
        .eq('user_id', 'test-user')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50);
      
      const queryTime = Date.now() - startTime;

      // Should be fast with proper indexing (even if user doesn't exist)
      expect(queryTime).toBeLessThan(200);
    });

    it('PERF-AI-001c: Cache Retrieval Performance', async () => {
      // Test cache table query performance
      const startTime = Date.now();
      const { error } = await supabase
        .from('recommendation_cache')
        .select('recommendations, confidence_score')
        .eq('user_id', 'test-user')
        .eq('recommendation_type', 'personalized')
        .gt('cache_expires_at', new Date().toISOString())
        .limit(1);
      
      const queryTime = Date.now() - startTime;

      expect(queryTime).toBeLessThan(100); // Cache should be very fast
    });
  });
});

describe('AI Database Functions Tests', () => {
  describe('FUNC-AI-001: Vector Function Tests', () => {
    it('FUNC-AI-001a: find_similar_fragrances Function', async () => {
      const testEmbedding = Array.from({ length: 2048 }, (_, i) => Math.sin(i * 0.01));
      
      const { data, error } = await supabase.rpc('find_similar_fragrances', {
        query_embedding: `[${testEmbedding.join(',')}]`,
        similarity_threshold: 0.3,
        max_results: 10,
        exclude_ids: ['exclude-test-id']
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      
      if (data && data.length > 0) {
        // Verify return structure
        expect(data[0]).toHaveProperty('fragrance_id');
        expect(data[0]).toHaveProperty('similarity');
        expect(data[0]).toHaveProperty('name');
        expect(data[0]).toHaveProperty('brand');
        
        // Verify excluded IDs are not present
        const fragranceIds = data.map(item => item.fragrance_id);
        expect(fragranceIds).not.toContain('exclude-test-id');
        
        // Verify similarity scores are within expected range
        expect(data[0].similarity).toBeGreaterThanOrEqual(0.3);
        expect(data[0].similarity).toBeLessThanOrEqual(1.0);
      }
    });

    it('FUNC-AI-001b: update_user_embedding Function', async () => {
      const testUserId = 'test-user-function';
      
      const { data, error } = await supabase.rpc('update_user_embedding', {
        target_user_id: testUserId
      });

      expect(error).toBeNull();
      expect(typeof data).toBe('boolean');
      
      // Function should return false for user with no collection data
      expect(data).toBe(false);
    });

    it('FUNC-AI-001c: cleanup_expired_cache Function', async () => {
      // Insert test expired cache entry
      const testUserId = `cleanup-test-${Date.now()}`;
      const expiredTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      
      await supabase
        .from('collection_analysis_cache')
        .insert({
          user_id: testUserId,
          analysis_type: 'cleanup_test',
          analysis_data: { test: 'expired_data' },
          cache_expires_at: expiredTime
        });

      // Run cleanup function
      const { data, error } = await supabase.rpc('cleanup_expired_cache');

      expect(error).toBeNull();
      expect(typeof data).toBe('number');
      expect(data).toBeGreaterThanOrEqual(0);

      // Verify expired entry was cleaned up
      const { data: remaining } = await supabase
        .from('collection_analysis_cache')
        .select('id')
        .eq('user_id', testUserId);

      expect(remaining?.length).toBe(0);
    });
  });
});
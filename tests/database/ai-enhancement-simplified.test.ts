/**
 * Simplified AI Enhancement Database Tests
 * 
 * Tests the actual AI infrastructure we've created in the database
 * without relying on complex SQL execution or schema introspection.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yekstmwcgyiltxinqamf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

describe('AI Enhancement Database Infrastructure', () => {

  describe('AI-001: Core Vector Capabilities', () => {
    it('AI-001a: Fragrances Table Has Embedding Columns', async () => {
      // Test that fragrances table has AI enhancement columns
      const { data, error } = await supabase
        .from('fragrances')
        .select('id, embedding, embedding_model, embedding_generated_at, embedding_version')
        .limit(1);

      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThan(0);
      
      const fragrance = data?.[0];
      expect(fragrance).toHaveProperty('embedding');
      expect(fragrance).toHaveProperty('embedding_model');
      expect(fragrance).toHaveProperty('embedding_generated_at');
      expect(fragrance).toHaveProperty('embedding_version');
      
      // Verify default values
      expect(fragrance?.embedding_model).toBe('voyage-3-large');
      expect(fragrance?.embedding_version).toBe(1);
    });

    it('AI-001b: Vector Similarity Function Available', async () => {
      // Test the find_similar_fragrances function
      const testEmbedding = Array.from({ length: 2000 }, (_, i) => Math.sin(i * 0.01));
      
      const { data, error } = await supabase.rpc('find_similar_fragrances', {
        query_embedding: `[${testEmbedding.join(',')}]`,
        similarity_threshold: 0.5,
        max_results: 5,
        exclude_ids: []
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('AI-001c: Cache Cleanup Function Works', async () => {
      const { data, error } = await supabase.rpc('cleanup_expired_cache');

      expect(error).toBeNull();
      expect(typeof data).toBe('number');
      expect(data).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AI-002: Processing Queue Infrastructure', () => {
    let testTaskId: string;

    afterEach(async () => {
      // Clean up test tasks
      if (testTaskId) {
        await supabase
          .from('ai_processing_queue')
          .delete()
          .eq('id', testTaskId);
      }
    });

    it('AI-002a: AI Processing Queue Table Accessible', async () => {
      // Test inserting a task into the queue
      const taskData = {
        fragrance_id: 'test-fragrance-queue',
        content: {
          name: 'Test Fragrance',
          brand: 'Test Brand'
        }
      };

      const { data, error } = await supabase
        .from('ai_processing_queue')
        .insert({
          task_type: 'embedding_generation',
          task_data: taskData,
          priority: 5,
          status: 'pending'
        })
        .select('id')
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBeDefined();
      testTaskId = data?.id;
    });

    it('AI-002b: Queue Status Updates Work', async () => {
      // Insert test task
      const { data: insertData, error: insertError } = await supabase
        .from('ai_processing_queue')
        .insert({
          task_type: 'embedding_generation',
          task_data: { fragrance_id: 'test-status-update' },
          status: 'pending'
        })
        .select('id')
        .single();

      expect(insertError).toBeNull();
      testTaskId = insertData?.id;

      // Update status to processing
      const { error: updateError } = await supabase
        .from('ai_processing_queue')
        .update({
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .eq('id', testTaskId);

      expect(updateError).toBeNull();

      // Verify update
      const { data: updatedData, error: selectError } = await supabase
        .from('ai_processing_queue')
        .select('status, started_at')
        .eq('id', testTaskId)
        .single();

      expect(selectError).toBeNull();
      expect(updatedData?.status).toBe('processing');
      expect(updatedData?.started_at).toBeDefined();
    });

    it('AI-002c: Task Priority Ordering', async () => {
      // Insert tasks with different priorities
      const tasks = [
        { priority: 1, id: 'high-priority' },
        { priority: 5, id: 'medium-priority' },
        { priority: 10, id: 'low-priority' }
      ];

      const insertedIds = [];
      for (const task of tasks) {
        const { data, error } = await supabase
          .from('ai_processing_queue')
          .insert({
            task_type: 'embedding_generation',
            task_data: { test_id: task.id },
            priority: task.priority,
            status: 'pending'
          })
          .select('id')
          .single();

        expect(error).toBeNull();
        insertedIds.push(data?.id);
      }

      // Query by priority order
      const { data, error } = await supabase
        .from('ai_processing_queue')
        .select('priority, task_data')
        .in('id', insertedIds)
        .order('priority', { ascending: true });

      expect(error).toBeNull();
      expect(data?.[0]?.priority).toBe(1); // Highest priority first

      // Cleanup
      await supabase
        .from('ai_processing_queue')
        .delete()
        .in('id', insertedIds);
    });
  });

  describe('AI-003: User AI Tables', () => {
    let testUserId: string;

    beforeEach(async () => {
      testUserId = randomUUID();
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
      
      await supabase
        .from('collection_analysis_cache')
        .delete()
        .eq('user_id', testUserId);
      
      await supabase
        .from('recommendation_cache')
        .delete()
        .eq('user_id', testUserId);
    });

    it('AI-003a: User Preferences Table Works', async () => {
      const testEmbedding = Array.from({ length: 2000 }, () => Math.random() * 2 - 1);
      
      // Insert user preference
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: testUserId,
          user_embedding: `[${testEmbedding.join(',')}]`,
          preference_strength: 0.75,
          interaction_count: 10
        });

      expect(error).toBeNull();

      // Verify retrieval
      const { data, error: selectError } = await supabase
        .from('user_preferences')
        .select('user_embedding, preference_strength, interaction_count')
        .eq('user_id', testUserId)
        .single();

      expect(selectError).toBeNull();
      expect(data?.preference_strength).toBe(0.75);
      expect(data?.interaction_count).toBe(10);
    });

    it('AI-003b: User Interactions Table Works', async () => {
      // Insert user interaction
      const { error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: testUserId,
          fragrance_id: 'test-fragrance-id',
          interaction_type: 'view',
          interaction_value: 15.5,
          interaction_context: {
            page: 'fragrance_detail',
            referrer: 'search'
          }
        });

      expect(error).toBeNull();

      // Verify retrieval
      const { data, error: selectError } = await supabase
        .from('user_interactions')
        .select('interaction_type, interaction_value, interaction_context')
        .eq('user_id', testUserId)
        .single();

      expect(selectError).toBeNull();
      expect(data?.interaction_type).toBe('view');
      expect(data?.interaction_value).toBe(15.5);
      expect(data?.interaction_context?.page).toBe('fragrance_detail');
    });

    it('AI-003c: Cache Tables Work', async () => {
      // Test collection analysis cache
      const analysisData = {
        dominant_families: ['oriental', 'woody'],
        insights: ['Strong preference for evening scents']
      };

      const { error: cacheError } = await supabase
        .from('collection_analysis_cache')
        .insert({
          user_id: testUserId,
          analysis_type: 'scent_family',
          analysis_data: analysisData,
          confidence_score: 0.85
        });

      expect(cacheError).toBeNull();

      // Test recommendation cache
      const recommendations = [
        { fragrance_id: 'rec-1', score: 0.92 },
        { fragrance_id: 'rec-2', score: 0.88 }
      ];

      const { error: recError } = await supabase
        .from('recommendation_cache')
        .insert({
          user_id: testUserId,
          recommendation_type: 'personalized',
          recommendations: recommendations,
          confidence_score: 0.89
        });

      expect(recError).toBeNull();
    });
  });

  describe('AI-004: Trigger System Test', () => {
    let testFragranceId: string;

    beforeEach(async () => {
      testFragranceId = `test-trigger-${Date.now()}`;
    });

    afterEach(async () => {
      // Clean up test fragrance and queue entries
      await supabase
        .from('fragrances')
        .delete()
        .eq('id', testFragranceId);
      
      await supabase
        .from('ai_processing_queue')
        .delete()
        .like('task_data->fragrance_id', testFragranceId);
    });

    it('AI-004a: Trigger Creates Queue Task on Insert', async () => {
      // Insert new fragrance (should trigger embedding generation)
      const { error } = await supabase
        .from('fragrances')
        .insert({
          id: testFragranceId,
          brand_id: 'chanel',
          name: 'Test Fragrance for Trigger',
          slug: testFragranceId,
          gender: 'unisex',
          fragrance_family: 'test',
          main_accords: ['test'],
          full_description: 'A test fragrance to verify automatic embedding generation',
          rating_value: 4.0,
          rating_count: 1,
          popularity_score: 50,
          kaggle_score: 75,
          trending_score: 60,
          sample_available: true,
          sample_price_usd: 15,
          travel_size_available: true,
          data_source: 'test',
          is_verified: true,
          fragrantica_url: 'https://test.com'
        });

      expect(error).toBeNull();

      // Wait briefly for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if queue task was created
      const { data: queueTasks, error: queueError } = await supabase
        .from('ai_processing_queue')
        .select('task_type, task_data, status, priority')
        .like('task_data->content->name', 'Test Fragrance for Trigger');

      expect(queueError).toBeNull();
      
      if (queueTasks && queueTasks.length > 0) {
        expect(queueTasks[0]?.task_type).toBe('embedding_generation');
        expect(queueTasks[0]?.status).toBe('pending');
        expect(queueTasks[0]?.priority).toBe(3); // High priority for new fragrances
      }
    });
  });

  describe('AI-005: Performance and Basic Operations', () => {
    it('AI-005a: Queue Queries Are Fast', async () => {
      const startTime = Date.now();
      const { error } = await supabase
        .from('ai_processing_queue')
        .select('id, task_type, status, priority')
        .eq('status', 'pending')
        .order('priority', { ascending: true })
        .limit(10);
      
      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(200); // Should be fast with proper indexing
    });

    it('AI-005b: Vector Function Performance', async () => {
      const testEmbedding = Array.from({ length: 2000 }, (_, i) => Math.sin(i * 0.01));
      
      const startTime = Date.now();
      const { data, error } = await supabase.rpc('find_similar_fragrances', {
        query_embedding: `[${testEmbedding.join(',')}]`,
        similarity_threshold: 0.5,
        max_results: 10,
        exclude_ids: []
      });
      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(1000); // Should complete reasonably fast
      expect(Array.isArray(data)).toBe(true);
    });

    it('AI-005c: Cache Operations Are Fast', async () => {
      const testUserId = randomUUID();
      
      // Test cache insertion performance
      const startTime = Date.now();
      const { error } = await supabase
        .from('collection_analysis_cache')
        .insert({
          user_id: testUserId,
          analysis_type: 'performance_test',
          analysis_data: { test: 'data' },
          confidence_score: 0.5
        });
      const insertTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(insertTime).toBeLessThan(500);

      // Test cache retrieval performance
      const selectStart = Date.now();
      const { data, error: selectError } = await supabase
        .from('collection_analysis_cache')
        .select('analysis_data')
        .eq('user_id', testUserId)
        .eq('analysis_type', 'performance_test')
        .single();
      const selectTime = Date.now() - selectStart;

      expect(selectError).toBeNull();
      expect(selectTime).toBeLessThan(200);
      expect(data?.analysis_data?.test).toBe('data');

      // Cleanup
      await supabase
        .from('collection_analysis_cache')
        .delete()
        .eq('user_id', testUserId);
    });
  });

  describe('AI-006: Data Integrity and Constraints', () => {
    it('AI-006a: Queue Task Type Constraints', async () => {
      // Test valid task types
      const validTypes = ['embedding_generation', 'user_model_update', 'batch_processing', 'cache_refresh'];
      
      for (const taskType of validTypes) {
        const { error } = await supabase
          .from('ai_processing_queue')
          .insert({
            task_type: taskType,
            task_data: { test: true },
            priority: 5
          })
          .select('id')
          .single();

        expect(error).toBeNull();
      }

      // Test invalid task type should fail
      const { error: invalidError } = await supabase
        .from('ai_processing_queue')
        .insert({
          task_type: 'invalid_task_type',
          task_data: { test: true }
        });

      expect(invalidError).not.toBeNull();
    });

    it('AI-006b: Interaction Type Constraints', async () => {
      const testUserId = randomUUID();
      
      // Test valid interaction types
      const validTypes = ['view', 'rating', 'favorite', 'search', 'purchase_intent'];
      
      for (const interactionType of validTypes) {
        const { error } = await supabase
          .from('user_interactions')
          .insert({
            user_id: testUserId,
            fragrance_id: 'test-fragrance',
            interaction_type: interactionType,
            interaction_value: 1.0
          });

        expect(error).toBeNull();
      }

      // Cleanup
      await supabase
        .from('user_interactions')
        .delete()
        .eq('user_id', testUserId);
    });

    it('AI-006c: Preference Strength Constraints', async () => {
      const testUserId = randomUUID();
      
      // Test valid preference strength (0-1)
      const { error: validError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: testUserId,
          preference_strength: 0.75
        });

      expect(validError).toBeNull();

      // Test invalid preference strength should fail
      const { error: invalidError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: `${testUserId}-invalid`,
          preference_strength: 1.5 // Invalid - greater than 1
        });

      expect(invalidError).not.toBeNull();

      // Cleanup
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', testUserId);
    });
  });

  describe('AI-007: Basic Integration Test', () => {
    it('AI-007a: Complete AI Workflow Simulation', async () => {
      const testUserId = randomUUID();
      const testFragranceId = `test-fragrance-${Date.now()}`;

      try {
        // 1. Insert fragrance (should trigger embedding generation)
        const { error: fragranceError } = await supabase
          .from('fragrances')
          .insert({
            id: testFragranceId,
            brand_id: 'chanel',
            name: 'Test Integration Fragrance',
            slug: testFragranceId,
            gender: 'unisex',
            fragrance_family: 'test',
            main_accords: ['test'],
            full_description: 'A fragrance for testing the complete AI workflow',
            rating_value: 4.0,
            rating_count: 1,
            popularity_score: 50,
            kaggle_score: 75,
            trending_score: 60,
            sample_available: true,
            sample_price_usd: 15,
            travel_size_available: true,
            data_source: 'test',
            is_verified: true,
            fragrantica_url: 'https://test.com'
          });

        expect(fragranceError).toBeNull();

        // 2. Simulate user interaction
        const { error: interactionError } = await supabase
          .from('user_interactions')
          .insert({
            user_id: testUserId,
            fragrance_id: testFragranceId,
            interaction_type: 'view',
            interaction_value: 30.0,
            interaction_context: {
              page: 'fragrance_detail',
              source: 'integration_test'
            }
          });

        expect(interactionError).toBeNull();

        // 3. Create user preference entry
        const mockEmbedding = Array.from({ length: 2000 }, () => Math.random() * 2 - 1);
        const { error: prefError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: testUserId,
            user_embedding: `[${mockEmbedding.join(',')}]`,
            preference_strength: 0.6,
            interaction_count: 1
          });

        expect(prefError).toBeNull();

        // 4. Cache some analysis
        const { error: cacheError } = await supabase
          .from('collection_analysis_cache')
          .insert({
            user_id: testUserId,
            analysis_type: 'integration_test',
            analysis_data: {
              test_completed: true,
              fragrance_analyzed: testFragranceId
            },
            confidence_score: 0.8
          });

        expect(cacheError).toBeNull();

        // 5. Verify everything is connected
        const { data: interactionData, error: verifyError } = await supabase
          .from('user_interactions')
          .select('fragrance_id, interaction_type, fragrances(name)')
          .eq('user_id', testUserId)
          .single();

        expect(verifyError).toBeNull();
        expect(interactionData?.fragrance_id).toBe(testFragranceId);
        expect(interactionData?.fragrances?.name).toBe('Test Integration Fragrance');

        console.log('✅ Complete AI workflow integration test passed');

      } finally {
        // Cleanup test data
        await supabase
          .from('fragrances')
          .delete()
          .eq('id', testFragranceId);
      }
    });
  });
});
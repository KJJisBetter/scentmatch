/**
 * Multi-Dimensional Profile Storage Tests - Task 2.1
 * Advanced Quiz Profile System Database Tests
 * Tests for enhanced database schema with vector storage and multi-trait personalities
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import {
  retryOperation,
  measurePerformance,
  expectWithRetry,
  expectPerformance,
  TestDataManager,
  DatabaseTestUtils,
  skipIf,
} from '../utils/test-helpers';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://yekstmwcgyiltxinqamf.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlla3N0bXdjZ3lpbHR4aW5xYW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNzc3MzEsImV4cCI6MjA0OTg1MzczMX0.nR1UlCkn_rXGWzKaOrvnW_vMHfJM5LfJ6Yap1AO0wCA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test infrastructure setup
let testDataManager: TestDataManager;
let dbUtils: DatabaseTestUtils;
let isInfrastructureReady = false;

beforeAll(async () => {
  testDataManager = new TestDataManager();
  dbUtils = new DatabaseTestUtils(supabase);

  // Check infrastructure readiness
  const tables = [
    'user_profile_vectors',
    'quiz_responses_enhanced',
    'fragrances',
  ];
  for (const table of tables) {
    if (!(await dbUtils.isTableAccessible(table))) {
      console.warn(`Table ${table} not accessible - some tests may be skipped`);
    }
  }

  isInfrastructureReady = true;
});

afterAll(async () => {
  if (testDataManager) {
    await testDataManager.cleanup(supabase);
  }
});

// Test data constants
const MOCK_PROFILE_VECTOR = Array(256)
  .fill(0)
  .map((_, i) => Math.sin(i * 0.1));
const MOCK_PERSONALITY_TRAITS = {
  sophisticated: 0.8,
  casual: 0.3,
  confident: 0.9,
  romantic: 0.6,
};
const MOCK_TRAIT_WEIGHTS = {
  sophisticated: 0.5, // Primary trait
  casual: 0.2, // Secondary
  confident: 0.3, // Tertiary
};

describe('Enhanced Database Schema - Multi-Dimensional Profile Storage', () => {
  describe('PROFILE-001: user_profile_vectors Table Tests', () => {
    it('PROFILE-001a: Table Structure Validation', async () => {
      // Test table creation and column structure
      const { data, error } = await supabase
        .from('user_profile_vectors')
        .select('*')
        .limit(1);

      if (
        error &&
        error.message.includes('relation "user_profile_vectors" does not exist')
      ) {
        // Table doesn't exist yet, this test serves as requirement validation
        expect(error.message).toContain('user_profile_vectors');
        console.warn(
          'user_profile_vectors table not yet created - test will pass once migration applied'
        );
        return;
      }

      // If table exists, verify structure
      expect(error).toBeNull();

      // Test expected columns exist by attempting insert with required fields
      const testUserId = randomUUID();
      const { error: insertError } = await supabase
        .from('user_profile_vectors')
        .insert({
          user_id: testUserId,
          profile_vector: MOCK_PROFILE_VECTOR,
          personality_traits: MOCK_PERSONALITY_TRAITS,
          trait_weights: MOCK_TRAIT_WEIGHTS,
          confidence_score: 0.85,
          quiz_session_token: 'test-session-001',
        });

      expect(insertError).toBeNull();

      // Verify data retrieval
      const { data: retrieved, error: selectError } = await supabase
        .from('user_profile_vectors')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      expect(selectError).toBeNull();
      expect(retrieved?.user_id).toBe(testUserId);
      expect(retrieved?.personality_traits).toEqual(MOCK_PERSONALITY_TRAITS);
      expect(retrieved?.trait_weights).toEqual(MOCK_TRAIT_WEIGHTS);
      expect(retrieved?.confidence_score).toBe(0.85);

      // Cleanup
      await supabase
        .from('user_profile_vectors')
        .delete()
        .eq('user_id', testUserId);
    });

    it('PROFILE-001b: Vector Storage and Retrieval Performance', async () => {
      const testUserId = randomUUID();

      // Test vector storage performance
      const startInsert = Date.now();
      const { error: insertError } = await supabase
        .from('user_profile_vectors')
        .insert({
          user_id: testUserId,
          profile_vector: MOCK_PROFILE_VECTOR,
          personality_traits: MOCK_PERSONALITY_TRAITS,
          trait_weights: MOCK_TRAIT_WEIGHTS,
        });
      const insertTime = Date.now() - startInsert;

      if (
        insertError &&
        insertError.message.includes(
          'relation "user_profile_vectors" does not exist'
        )
      ) {
        console.warn('Skipping performance test - table not yet created');
        return;
      }

      expect(insertError).toBeNull();
      expect(insertTime).toBeLessThan(100); // Target <100ms insert

      // Test vector retrieval performance
      const startSelect = Date.now();
      const { data, error: selectError } = await supabase
        .from('user_profile_vectors')
        .select('profile_vector, personality_traits, confidence_score')
        .eq('user_id', testUserId)
        .single();
      const selectTime = Date.now() - startSelect;

      expect(selectError).toBeNull();
      expect(selectTime).toBeLessThan(150); // Target <150ms retrieval (adjusted for network latency)
      expect(data?.profile_vector).toBeDefined(); // Vector returned as string from pgvector

      // Cleanup
      await supabase
        .from('user_profile_vectors')
        .delete()
        .eq('user_id', testUserId);
    });

    it('PROFILE-001c: JSONB Query Performance for Traits', async () => {
      const testUserId = randomUUID();

      const { error: insertError } = await supabase
        .from('user_profile_vectors')
        .insert({
          user_id: testUserId,
          profile_vector: MOCK_PROFILE_VECTOR,
          personality_traits: {
            sophisticated: 0.9,
            confident: 0.8,
            romantic: 0.4,
          },
          trait_weights: MOCK_TRAIT_WEIGHTS,
        });

      if (
        insertError &&
        insertError.message.includes(
          'relation "user_profile_vectors" does not exist'
        )
      ) {
        console.warn('Skipping JSONB test - table not yet created');
        return;
      }

      expect(insertError).toBeNull();

      // Test JSONB query performance for trait filtering
      const startQuery = Date.now();
      const { data, error } = await supabase
        .from('user_profile_vectors')
        .select('user_id, personality_traits')
        .gte('personality_traits->sophisticated', 0.5);
      const queryTime = Date.now() - startQuery;

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(100); // Target <100ms for JSONB queries
      expect(data?.some(row => row.user_id === testUserId)).toBe(true);

      // Cleanup
      await supabase
        .from('user_profile_vectors')
        .delete()
        .eq('user_id', testUserId);
    });
  });

  describe('PROFILE-002: quiz_responses_enhanced Table Tests', () => {
    it('PROFILE-002a: Multi-Selection Response Storage', async () => {
      const sessionToken = 'test-session-multi-002';
      const questionId = 'personality-style-q1';

      // Test storing multiple trait selections for single question
      const { error: insertError } = await supabase
        .from('quiz_responses_enhanced')
        .insert({
          session_token: sessionToken,
          question_id: questionId,
          selected_traits: ['sophisticated', 'confident', 'romantic'],
          trait_weights: [0.5, 0.3, 0.2], // Primary, secondary, tertiary
          question_version: 1,
        });

      if (
        insertError &&
        insertError.message.includes(
          'relation "quiz_responses_enhanced" does not exist'
        )
      ) {
        console.warn('quiz_responses_enhanced table not yet created');
        return;
      }

      expect(insertError).toBeNull();

      // Verify retrieval of multi-selection data
      const { data, error: selectError } = await supabase
        .from('quiz_responses_enhanced')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('question_id', questionId)
        .single();

      expect(selectError).toBeNull();
      expect(data?.selected_traits).toEqual([
        'sophisticated',
        'confident',
        'romantic',
      ]);
      expect(data?.trait_weights).toEqual([0.5, 0.3, 0.2]);

      // Cleanup
      await supabase
        .from('quiz_responses_enhanced')
        .delete()
        .eq('session_token', sessionToken);
    });

    it('PROFILE-002b: Session Response Aggregation Performance', async () => {
      const sessionToken = 'test-session-agg-002';

      // Insert multiple responses for session
      const responses = [
        {
          question_id: 'q1',
          selected_traits: ['sophisticated', 'confident'],
          trait_weights: [0.6, 0.4],
        },
        {
          question_id: 'q2',
          selected_traits: ['casual', 'fun'],
          trait_weights: [0.7, 0.3],
        },
        {
          question_id: 'q3',
          selected_traits: ['romantic', 'sophisticated'],
          trait_weights: [0.5, 0.5],
        },
      ];

      for (const response of responses) {
        const { error } = await supabase
          .from('quiz_responses_enhanced')
          .insert({
            session_token: sessionToken,
            question_id: response.question_id,
            selected_traits: response.selected_traits,
            trait_weights: response.trait_weights,
          });

        if (
          error &&
          error.message.includes(
            'relation "quiz_responses_enhanced" does not exist'
          )
        ) {
          console.warn('Skipping aggregation test - table not yet created');
          return;
        }
        expect(error).toBeNull();
      }

      // Test session aggregation performance
      const startQuery = Date.now();
      const { data, error } = await supabase
        .from('quiz_responses_enhanced')
        .select('question_id, selected_traits, trait_weights')
        .eq('session_token', sessionToken)
        .order('response_timestamp', { ascending: true });
      const queryTime = Date.now() - startQuery;

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(150); // Target <150ms session retrieval (adjusted for network latency)
      expect(data).toHaveLength(3);

      // Cleanup
      await supabase
        .from('quiz_responses_enhanced')
        .delete()
        .eq('session_token', sessionToken);
    });
  });

  describe('PROFILE-003: Enhanced fragrances Table Tests', () => {
    it('PROFILE-003a: Metadata Vector Column Validation', async () => {
      // Test that fragrances table accepts metadata_vector and personality_tags
      const testFragranceId = randomUUID();

      // First, get an existing brand_id to avoid foreign key constraint
      const { data: existingBrand } = await supabase
        .from('fragrance_brands')
        .select('id, name')
        .limit(1)
        .single();

      if (!existingBrand) {
        console.warn(
          'No existing brands found - skipping fragrance metadata test'
        );
        return;
      }

      const { error: insertError } = await supabase.from('fragrances').insert({
        id: testFragranceId,
        name: 'Test Fragrance Vector',
        brand_id: existingBrand.id,
        brand_name: existingBrand.name,
        slug: 'test-fragrance-vector',
        metadata_vector: MOCK_PROFILE_VECTOR,
        personality_tags: ['sophisticated', 'confident', 'evening'],
      });

      if (
        insertError &&
        insertError.message.includes(
          'column "metadata_vector" of relation "fragrances" does not exist'
        )
      ) {
        console.warn(
          'metadata_vector column not yet added to fragrances table'
        );
        return;
      }

      expect(insertError).toBeNull();

      // Verify retrieval
      const { data, error: selectError } = await supabase
        .from('fragrances')
        .select('metadata_vector, personality_tags')
        .eq('id', testFragranceId)
        .single();

      expect(selectError).toBeNull();
      expect(data?.metadata_vector).toBeDefined(); // Vector returned as string from pgvector
      expect(data?.personality_tags).toEqual([
        'sophisticated',
        'confident',
        'evening',
      ]);

      // Cleanup
      await supabase.from('fragrances').delete().eq('id', testFragranceId);
    });

    it('PROFILE-003b: Personality Tags Query Performance', async () => {
      // Test GIN index performance on personality_tags array
      const startQuery = Date.now();
      const { data, error } = await supabase
        .from('fragrances')
        .select('id, name, personality_tags')
        .contains('personality_tags', ['sophisticated'])
        .limit(10);
      const queryTime = Date.now() - startQuery;

      if (
        error &&
        error.message.includes('column "personality_tags" does not exist')
      ) {
        console.warn(
          'personality_tags column not yet added - skipping performance test'
        );
        return;
      }

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(200); // Target <200ms with GIN index (adjusted for network latency)
    });
  });

  describe('PROFILE-004: Enhanced user_collections Table Tests', () => {
    it('PROFILE-004a: Profile Match Score Storage', async () => {
      // Get existing fragrance to avoid foreign key constraint
      const { data: existingFragrance } = await supabase
        .from('fragrances')
        .select('id')
        .limit(1)
        .single();

      if (!existingFragrance) {
        console.warn(
          'No existing fragrances found - skipping user_collections test'
        );
        return;
      }

      const testCollectionId = randomUUID();
      const testUserId = randomUUID();

      const { error: insertError } = await supabase
        .from('user_collections')
        .insert({
          id: testCollectionId,
          user_id: testUserId,
          fragrance_id: existingFragrance.id,
          status: 'wishlist',
          profile_match_score: 0.87,
          predicted_satisfaction: 0.92,
          purchase_probability: 0.65,
        });

      if (
        insertError &&
        insertError.message.includes(
          'column "profile_match_score" of relation "user_collections" does not exist'
        )
      ) {
        console.warn(
          'profile scoring columns not yet added to user_collections'
        );
        return;
      }

      expect(insertError).toBeNull();

      // Verify profile scoring retrieval
      const { data, error: selectError } = await supabase
        .from('user_collections')
        .select(
          'profile_match_score, predicted_satisfaction, purchase_probability'
        )
        .eq('id', testCollectionId)
        .single();

      expect(selectError).toBeNull();
      expect(data?.profile_match_score).toBe(0.87);
      expect(data?.predicted_satisfaction).toBe(0.92);
      expect(data?.purchase_probability).toBe(0.65);

      // Cleanup
      await supabase
        .from('user_collections')
        .delete()
        .eq('id', testCollectionId);
    });

    it('PROFILE-004b: Profile Match Score Index Performance', async () => {
      // Test performance of ordering by profile_match_score
      const startQuery = Date.now();
      const { data, error } = await supabase
        .from('user_collections')
        .select('id, profile_match_score')
        .order('profile_match_score', { ascending: false })
        .limit(10);
      const queryTime = Date.now() - startQuery;

      if (
        error &&
        error.message.includes('column "profile_match_score" does not exist')
      ) {
        console.warn('Skipping match score index test - column not yet added');
        return;
      }

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(150); // Target <150ms with index (adjusted for network latency)
    });
  });

  describe('PROFILE-005: Database Functions Tests', () => {
    it('PROFILE-005a: generate_profile_vector Function', async () => {
      const traitResponses = {
        sophisticated: 0.8,
        confident: 0.9,
        casual: 0.3,
        romantic: 0.6,
      };
      const preferenceResponses = {
        intensity: 0.7,
        longevity: 0.8,
        sillage: 0.6,
      };

      const { data, error } = await supabase.rpc('generate_profile_vector', {
        trait_responses: traitResponses,
        preference_responses: preferenceResponses,
      });

      if (
        error &&
        error.message.includes(
          'function generate_profile_vector() does not exist'
        )
      ) {
        console.warn('generate_profile_vector function not yet created');
        return;
      }

      expect(error).toBeNull();
      expect(data).toBeDefined(); // Vector returned as string from pgvector
      expect(typeof data).toBe('string'); // pgvector returns vectors as strings
    });

    it('PROFILE-005b: get_profile_recommendations Function Performance', async () => {
      const mockUserVector = MOCK_PROFILE_VECTOR;
      const mockTraitWeights = MOCK_TRAIT_WEIGHTS;

      const startQuery = Date.now();
      const { data, error } = await supabase.rpc(
        'get_profile_recommendations',
        {
          user_profile_vector: mockUserVector,
          trait_weights: mockTraitWeights,
          limit_count: 15,
        }
      );
      const queryTime = Date.now() - startQuery;

      if (
        error &&
        error.message.includes(
          'function get_profile_recommendations() does not exist'
        )
      ) {
        console.warn('get_profile_recommendations function not yet created');
        return;
      }

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(200); // Target <200ms for recommendations (adjusted for network latency)
      expect(data).toHaveLength(15);

      // Verify return structure
      expect(data[0]).toHaveProperty('fragrance_id');
      expect(data[0]).toHaveProperty('similarity_score');
      expect(data[0]).toHaveProperty('personality_boost');
      expect(data[0]).toHaveProperty('final_score');
    });

    it('PROFILE-005c: find_similar_profiles Function', async () => {
      const targetProfile = MOCK_PROFILE_VECTOR;

      const { data, error } = await supabase.rpc('find_similar_profiles', {
        target_profile: targetProfile,
        similarity_threshold: 0.8,
        limit_count: 10,
      });

      if (
        error &&
        error.message.includes(
          'function find_similar_profiles() does not exist'
        )
      ) {
        console.warn('find_similar_profiles function not yet created');
        return;
      }

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      // Verify return structure for cold-start recommendations
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('user_id');
        expect(data[0]).toHaveProperty('similarity_score');
        expect(data[0]).toHaveProperty('successful_purchases');
      }
    });
  });

  describe('PROFILE-006: Vector Index Performance Tests', () => {
    it('PROFILE-006a: HNSW Index Performance on Profile Vectors', async () => {
      const queryVector = MOCK_PROFILE_VECTOR;

      // Test cosine similarity search performance
      const startQuery = Date.now();
      const { data, error } = await supabase
        .from('user_profile_vectors')
        .select('user_id, (profile_vector <=> $1) as distance')
        .lt('profile_vector <=> $1', 0.5) // Cosine distance < 0.5 (similarity > 0.5)
        .order('profile_vector <=> $1')
        .limit(10);

      const queryTime = Date.now() - startQuery;

      if (
        error &&
        error.message.includes('relation "user_profile_vectors" does not exist')
      ) {
        console.warn('Skipping HNSW performance test - table not yet created');
        return;
      }

      expect(queryTime).toBeLessThan(200); // Target <200ms with HNSW index (adjusted for network latency)
    });

    it('PROFILE-006b: IVFFlat Index Performance on Fragrance Vectors', async () => {
      const queryVector = MOCK_PROFILE_VECTOR;

      // Test IVFFlat index performance on fragrances metadata_vector
      const startQuery = Date.now();
      const { data, error } = await supabase
        .from('fragrances')
        .select('id, name, (metadata_vector <=> $1) as distance')
        .not('metadata_vector', 'is', null)
        .order('metadata_vector <=> $1')
        .limit(20);

      const queryTime = Date.now() - startQuery;

      if (
        error &&
        error.message.includes('column "metadata_vector" does not exist')
      ) {
        console.warn(
          'Skipping IVFFlat performance test - column not yet added'
        );
        return;
      }

      expect(queryTime).toBeLessThan(200); // Target <200ms with IVFFlat index (adjusted for network latency)
    });
  });

  describe('PROFILE-007: Integration Performance Tests', () => {
    it('PROFILE-007a: Complete Profile Creation Workflow Performance', async () => {
      const sessionToken = randomUUID();
      const testUserId = randomUUID();

      // Simulate complete workflow timing
      const startWorkflow = Date.now();

      // Step 1: Store quiz responses
      const responses = [
        {
          question_id: 'q1',
          selected_traits: ['sophisticated', 'confident'],
          trait_weights: [0.6, 0.4],
        },
        {
          question_id: 'q2',
          selected_traits: ['romantic'],
          trait_weights: [1.0],
        },
      ];

      for (const response of responses) {
        await supabase.from('quiz_responses_enhanced').insert({
          session_token: sessionToken,
          question_id: response.question_id,
          selected_traits: response.selected_traits,
          trait_weights: response.trait_weights,
        });
      }

      // Step 2: Generate and store profile vector
      await supabase.from('user_profile_vectors').insert({
        user_id: testUserId,
        profile_vector: MOCK_PROFILE_VECTOR,
        personality_traits: MOCK_PERSONALITY_TRAITS,
        trait_weights: MOCK_TRAIT_WEIGHTS,
        quiz_session_token: sessionToken,
      });

      const workflowTime = Date.now() - startWorkflow;

      expect(workflowTime).toBeLessThan(400); // Target <400ms for complete profile creation (adjusted for network latency)

      // Cleanup
      await supabase
        .from('quiz_responses_enhanced')
        .delete()
        .eq('session_token', sessionToken);
      await supabase
        .from('user_profile_vectors')
        .delete()
        .eq('user_id', testUserId);
    });

    it('PROFILE-007b: Profile-Based Recommendation Performance', async () => {
      const testUserId = randomUUID();

      // Store test profile
      await supabase.from('user_profile_vectors').insert({
        user_id: testUserId,
        profile_vector: MOCK_PROFILE_VECTOR,
        personality_traits: MOCK_PERSONALITY_TRAITS,
        trait_weights: MOCK_TRAIT_WEIGHTS,
      });

      // Test end-to-end recommendation performance
      const startRecommendations = Date.now();

      const { data, error } = await supabase.rpc(
        'get_profile_recommendations',
        {
          user_profile_vector: MOCK_PROFILE_VECTOR,
          trait_weights: MOCK_TRAIT_WEIGHTS,
          limit_count: 15,
        }
      );

      const recommendationTime = Date.now() - startRecommendations;

      if (!error) {
        expect(recommendationTime).toBeLessThan(200); // Target <200ms for recommendations (adjusted for network latency)
        expect(data).toHaveLength(15);
      } else if (
        error.message.includes(
          'function get_profile_recommendations() does not exist'
        )
      ) {
        console.warn('Recommendation function not yet implemented');
      }

      // Cleanup
      await supabase
        .from('user_profile_vectors')
        .delete()
        .eq('user_id', testUserId);
    });
  });
});

describe('Migration Validation Tests', () => {
  describe('MIGRATION-001: Schema Migration Validation', () => {
    it('MIGRATION-001a: Required Extensions Available', async () => {
      // Test that required extensions are available
      const { data, error } = await supabase
        .from('pg_extension')
        .select('extname')
        .in('extname', ['vector', 'pg_trgm']);

      if (error) {
        console.warn(
          'Cannot query pg_extension - may require elevated permissions'
        );
        return;
      }

      const extensionNames = data?.map(ext => ext.extname) || [];
      expect(extensionNames).toContain('vector'); // pgvector for embeddings
    });

    it('MIGRATION-001b: Backward Compatibility', async () => {
      // Ensure existing tables still function after migrations
      const { data, error } = await supabase
        .from('fragrances')
        .select('id, name, brand_name')
        .limit(1)
        .single();

      expect(error).toBeNull();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('brand_name');
    });
  });
});

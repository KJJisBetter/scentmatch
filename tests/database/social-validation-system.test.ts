import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServiceSupabase } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * SCE-69: Social Validation and Peer Context System Tests
 * 
 * Tests the complete social validation system including:
 * - User demographics tracking
 * - Social metrics calculation
 * - Peer approval ratings
 * - Popularity trends
 * - Uniqueness scoring
 * - Social context generation
 */

describe('Social Validation System', () => {
  let supabase: SupabaseClient;
  let testUserId: string;
  let testGuestSessionId: string;
  let testFragranceId: string;

  beforeAll(async () => {
    supabase = createServiceSupabase();
    
    // Create test user and fragrance data
    testUserId = '550e8400-e29b-41d4-a716-446655440000';
    testGuestSessionId = 'guest_123456789';
    testFragranceId = 'test-fragrance-social';
    
    // Ensure test fragrance exists
    await supabase.from('fragrances').upsert({
      id: testFragranceId,
      brand_id: 'test-brand',
      name: 'Test Social Fragrance',
      gender: 'unisex',
      main_accords: ['fresh', 'citrus'],
      rating_value: 4.2,
      rating_count: 150
    });
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await supabase.from('peer_approval_ratings').delete().eq('fragrance_id', testFragranceId);
    await supabase.from('fragrance_social_metrics').delete().eq('fragrance_id', testFragranceId);
    await supabase.from('user_demographics').delete().in('user_id', [testUserId]);
    await supabase.from('user_demographics').delete().eq('guest_session_id', testGuestSessionId);
  });

  afterAll(async () => {
    // Clean up all test data
    await supabase.from('peer_approval_ratings').delete().eq('fragrance_id', testFragranceId);
    await supabase.from('fragrance_social_metrics').delete().eq('fragrance_id', testFragranceId);
    await supabase.from('fragrance_popularity_trends').delete().eq('fragrance_id', testFragranceId);
    await supabase.from('fragrance_uniqueness_scores').delete().eq('fragrance_id', testFragranceId);
    await supabase.from('user_demographics').delete().in('user_id', [testUserId]);
    await supabase.from('user_demographics').delete().eq('guest_session_id', testGuestSessionId);
    await supabase.from('fragrances').delete().eq('id', testFragranceId);
  });

  describe('Database Schema Validation', () => {
    test('should have all required social validation tables', async () => {
      const requiredTables = [
        'user_demographics',
        'fragrance_social_metrics', 
        'fragrance_popularity_trends',
        'peer_approval_ratings',
        'fragrance_uniqueness_scores'
      ];

      for (const table of requiredTables) {
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', table);

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data?.length).toBeGreaterThan(0);
      }
    });

    test('should have proper RLS policies enabled', async () => {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name, row_security')
        .eq('table_schema', 'public')
        .in('table_name', [
          'user_demographics',
          'fragrance_social_metrics',
          'peer_approval_ratings'
        ]);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      // All social tables should have RLS enabled
      data?.forEach(table => {
        expect(table.row_security).toBe('YES');
      });
    });

    test('should have required indexes for performance', async () => {
      const requiredIndexes = [
        'idx_user_demographics_user_id',
        'idx_social_metrics_fragrance',
        'idx_peer_ratings_fragrance',
        'idx_popularity_trends_fragrance'
      ];

      for (const indexName of requiredIndexes) {
        const { data, error } = await supabase
          .from('pg_indexes')
          .select('indexname')
          .eq('schemaname', 'public')
          .eq('indexname', indexName);

        expect(error).toBeNull();
        expect(data?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('User Demographics', () => {
    test('should store user demographic data correctly', async () => {
      const demographicData = {
        user_id: testUserId,
        age_group: '18-24',
        experience_level: 'beginner',
        gender_preference: 'unisex',
        social_influence_level: 7,
        uniqueness_preference: 6,
        style_preferences: ['fresh', 'modern', 'casual'],
        occasion_preferences: ['daily', 'work', 'casual']
      };

      const { data, error } = await supabase
        .from('user_demographics')
        .insert(demographicData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.age_group).toBe('18-24');
      expect(data?.experience_level).toBe('beginner');
      expect(data?.style_preferences).toEqual(['fresh', 'modern', 'casual']);
    });

    test('should handle guest user demographics', async () => {
      const guestData = {
        guest_session_id: testGuestSessionId,
        age_group: '25-34',
        experience_level: 'intermediate',
        uniqueness_preference: 8
      };

      const { data, error } = await supabase
        .from('user_demographics')
        .insert(guestData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.guest_session_id).toBe(testGuestSessionId);
      expect(data?.user_id).toBeNull();
    });

    test('should validate age group constraints', async () => {
      const invalidData = {
        user_id: testUserId,
        age_group: 'invalid-age',
        experience_level: 'beginner'
      };

      const { error } = await supabase
        .from('user_demographics')
        .insert(invalidData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('violates check constraint');
    });
  });

  describe('Peer Approval Ratings', () => {
    beforeEach(async () => {
      // Create test user demographics
      await supabase.from('user_demographics').insert({
        user_id: testUserId,
        age_group: '18-24',
        experience_level: 'beginner'
      });
    });

    test('should store peer ratings correctly', async () => {
      const ratingData = {
        user_id: testUserId,
        fragrance_id: testFragranceId,
        overall_rating: 4.5,
        would_recommend: true,
        experience_rating: 'love',
        usage_occasion: 'daily',
        experience_level_when_rated: 'beginner',
        confidence_in_rating: 8,
        quick_review: 'Amazing fresh scent, perfect for summer!'
      };

      const { data, error } = await supabase
        .from('peer_approval_ratings')
        .insert(ratingData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.overall_rating).toBe(4.5);
      expect(data?.would_recommend).toBe(true);
      expect(data?.quick_review).toBe('Amazing fresh scent, perfect for summer!');
    });

    test('should prevent duplicate ratings from same user', async () => {
      const ratingData = {
        user_id: testUserId,
        fragrance_id: testFragranceId,
        overall_rating: 4.0
      };

      // Insert first rating
      const { error: firstError } = await supabase
        .from('peer_approval_ratings')
        .insert(ratingData);

      expect(firstError).toBeNull();

      // Try to insert duplicate rating
      const { error: duplicateError } = await supabase
        .from('peer_approval_ratings')
        .insert({ ...ratingData, overall_rating: 5.0 });

      expect(duplicateError).toBeDefined();
      expect(duplicateError?.message).toContain('duplicate key value');
    });

    test('should handle guest user ratings', async () => {
      await supabase.from('user_demographics').insert({
        guest_session_id: testGuestSessionId,
        age_group: '25-34',
        experience_level: 'intermediate'
      });

      const guestRating = {
        guest_session_id: testGuestSessionId,
        fragrance_id: testFragranceId,
        overall_rating: 3.5,
        experience_rating: 'like'
      };

      const { data, error } = await supabase
        .from('peer_approval_ratings')
        .insert(guestRating)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.guest_session_id).toBe(testGuestSessionId);
      expect(data?.user_id).toBeNull();
    });
  });

  describe('Social Metrics Calculation', () => {
    beforeEach(async () => {
      // Create multiple test users with ratings
      const users = [
        { id: testUserId, age: '18-24', exp: 'beginner', rating: 4.5 },
        { id: 'user2', age: '18-24', exp: 'beginner', rating: 4.0 },
        { id: 'user3', age: '18-24', exp: 'intermediate', rating: 3.5 },
        { id: 'user4', age: '25-34', exp: 'experienced', rating: 4.8 },
        { id: 'user5', age: '25-34', exp: 'experienced', rating: 4.2 }
      ];

      for (const user of users) {
        await supabase.from('user_demographics').insert({
          user_id: user.id,
          age_group: user.age,
          experience_level: user.exp
        });

        await supabase.from('peer_approval_ratings').insert({
          user_id: user.id,
          fragrance_id: testFragranceId,
          overall_rating: user.rating,
          would_recommend: user.rating >= 4.0
        });
      }
    });

    afterEach(async () => {
      // Clean up additional test users
      const userIds = ['user2', 'user3', 'user4', 'user5'];
      await supabase.from('peer_approval_ratings').delete().in('user_id', userIds);
      await supabase.from('user_demographics').delete().in('user_id', userIds);
    });

    test('should calculate social metrics automatically via trigger', async () => {
      // Wait a moment for triggers to process
      await new Promise(resolve => setTimeout(resolve, 100));

      const { data, error } = await supabase
        .from('fragrance_social_metrics')
        .select('*')
        .eq('fragrance_id', testFragranceId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThan(0);

      // Should have metrics for different demographic groups
      const beginnerGroup = data?.find(d => d.demographic_group.includes('beginner'));
      const experiencedGroup = data?.find(d => d.demographic_group.includes('experienced'));

      expect(beginnerGroup).toBeDefined();
      expect(experiencedGroup).toBeDefined();
    });

    test('should calculate correct approval ratings', async () => {
      // Manually trigger social metrics update
      const { data, error } = await supabase.rpc('update_fragrance_social_metrics', {
        p_fragrance_id: testFragranceId
      });

      expect(error).toBeNull();

      const { data: metrics } = await supabase
        .from('fragrance_social_metrics')
        .select('*')
        .eq('fragrance_id', testFragranceId)
        .eq('demographic_group', 'age:18-24,exp:beginner');

      expect(metrics?.length).toBe(1);
      const metric = metrics?.[0];
      expect(metric?.approval_rating).toBeCloseTo(4.25, 1); // Average of 4.5 and 4.0
      expect(metric?.approval_count).toBe(2);
    });

    test('should calculate love percentage correctly', async () => {
      await supabase.rpc('update_fragrance_social_metrics', {
        p_fragrance_id: testFragranceId
      });

      const { data: metrics } = await supabase
        .from('fragrance_social_metrics')
        .select('*')
        .eq('fragrance_id', testFragranceId);

      expect(metrics).toBeDefined();
      
      // Should have high love percentage (ratings >= 4.0)
      const overallLove = metrics?.reduce((sum, m) => sum + (m.love_percentage || 0), 0) / metrics!.length;
      expect(overallLove).toBeGreaterThan(70); // Most ratings are 4.0+
    });

    test('should calculate confidence scores based on sample size', async () => {
      await supabase.rpc('update_fragrance_social_metrics', {
        p_fragrance_id: testFragranceId
      });

      const { data: metrics } = await supabase
        .from('fragrance_social_metrics')
        .select('*')
        .eq('fragrance_id', testFragranceId);

      expect(metrics).toBeDefined();
      
      metrics?.forEach(metric => {
        expect(metric.confidence_score).toBeGreaterThan(0);
        expect(metric.confidence_score).toBeLessThanOrEqual(1);
        
        // Confidence should be related to sample size
        const expectedConfidence = Math.min(1.0, metric.sample_size! / 20.0);
        expect(metric.confidence_score).toBeCloseTo(expectedConfidence, 1);
      });
    });
  });

  describe('Social Context Generation', () => {
    beforeEach(async () => {
      // Set up comprehensive test data
      await supabase.from('user_demographics').insert({
        user_id: testUserId,
        age_group: '18-24',
        experience_level: 'beginner'
      });

      await supabase.from('peer_approval_ratings').insert([
        { user_id: testUserId, fragrance_id: testFragranceId, overall_rating: 4.5 },
        { user_id: 'user2', fragrance_id: testFragranceId, overall_rating: 4.0 },
        { user_id: 'user3', fragrance_id: testFragranceId, overall_rating: 3.8 }
      ]);

      await supabase.from('fragrance_uniqueness_scores').insert({
        fragrance_id: testFragranceId,
        popularity_score: 7.5,
        distinctiveness_score: 4.2,
        market_saturation: 8.5,
        conformity_pressure: 6.0
      });

      // Update social metrics
      await supabase.rpc('update_fragrance_social_metrics', {
        p_fragrance_id: testFragranceId
      });
    });

    afterEach(async () => {
      await supabase.from('peer_approval_ratings').delete().in('user_id', ['user2', 'user3']);
      await supabase.from('user_demographics').delete().in('user_id', ['user2', 'user3']);
    });

    test('should generate comprehensive social context', async () => {
      const { data, error } = await supabase.rpc('get_fragrance_social_context', {
        p_fragrance_id: testFragranceId,
        p_user_age_group: '18-24',
        p_user_experience_level: 'beginner'
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const context = data as any;
      expect(context.overall).toBeDefined();
      expect(context.peer_context).toBeDefined();
      expect(context.uniqueness).toBeDefined();

      // Check overall metrics
      expect(context.overall.total_approvals).toBeGreaterThan(0);
      expect(context.overall.avg_approval).toBeGreaterThan(0);

      // Check peer context for user's demographic
      expect(context.peer_context.approval_rating).toBeGreaterThan(0);
      expect(context.peer_context.confidence).toBeGreaterThan(0);

      // Check uniqueness data
      expect(context.uniqueness.popularity_level).toBeDefined();
      expect(context.uniqueness.distinctiveness).toBeDefined();
    });

    test('should provide context without user demographic', async () => {
      const { data, error } = await supabase.rpc('get_fragrance_social_context', {
        p_fragrance_id: testFragranceId
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const context = data as any;
      expect(context.overall).toBeDefined();
      expect(context.peer_context).toBeNull(); // No user demographic provided
      expect(context.uniqueness).toBeDefined();
    });

    test('should handle fragrance with no social data', async () => {
      const { data, error } = await supabase.rpc('get_fragrance_social_context', {
        p_fragrance_id: 'nonexistent-fragrance'
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const context = data as any;
      expect(context.overall.total_approvals).toBe(0);
      expect(context.peer_context).toBeNull();
    });
  });

  describe('Popularity Trends', () => {
    test('should store popularity trend data', async () => {
      const trendData = {
        fragrance_id: testFragranceId,
        period_type: 'weekly',
        period_start: '2025-08-15',
        period_end: '2025-08-21',
        search_count: 150,
        view_count: 300,
        collection_adds: 25,
        trending_score: 7.5,
        velocity_score: 2.3,
        rank_in_category: 5,
        percentile_score: 85.2
      };

      const { data, error } = await supabase
        .from('fragrance_popularity_trends')
        .insert(trendData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.trending_score).toBe(7.5);
      expect(data?.rank_in_category).toBe(5);
    });

    test('should prevent duplicate period entries', async () => {
      const trendData = {
        fragrance_id: testFragranceId,
        period_type: 'weekly',
        period_start: '2025-08-15',
        period_end: '2025-08-21',
        search_count: 100
      };

      // Insert first entry
      const { error: firstError } = await supabase
        .from('fragrance_popularity_trends')
        .insert(trendData);

      expect(firstError).toBeNull();

      // Try to insert duplicate
      const { error: duplicateError } = await supabase
        .from('fragrance_popularity_trends')
        .insert({ ...trendData, search_count: 200 });

      expect(duplicateError).toBeDefined();
      expect(duplicateError?.message).toContain('duplicate key value');
    });
  });

  describe('Uniqueness Scoring', () => {
    test('should store and retrieve uniqueness scores', async () => {
      const uniquenessData = {
        fragrance_id: testFragranceId,
        popularity_score: 8.5,
        distinctiveness_score: 3.2,
        market_saturation: 12.5,
        conformity_pressure: 7.0,
        similar_but_unique: JSON.stringify([
          { id: 'alt1', name: 'Alternative 1', similarity: 0.85 },
          { id: 'alt2', name: 'Alternative 2', similarity: 0.78 }
        ])
      };

      const { data, error } = await supabase
        .from('fragrance_uniqueness_scores')
        .insert(uniquenessData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.popularity_score).toBe(8.5);
      expect(data?.distinctiveness_score).toBe(3.2);
      expect(data?.similar_but_unique).toBeDefined();
    });

    test('should validate score constraints', async () => {
      const invalidData = {
        fragrance_id: testFragranceId,
        popularity_score: 15.0, // Invalid - should be 1-10
        distinctiveness_score: 5.0
      };

      const { error } = await supabase
        .from('fragrance_uniqueness_scores')
        .insert(invalidData);

      expect(error).toBeDefined();
      expect(error?.message).toContain('violates check constraint');
    });
  });

  describe('Performance and Scalability', () => {
    test('should efficiently query social metrics with indexes', async () => {
      // Insert multiple metrics for performance testing
      const metricsData = Array.from({ length: 10 }, (_, i) => ({
        fragrance_id: `test-frag-${i}`,
        demographic_group: `age:18-24,exp:beginner`,
        total_users: 50 + i,
        approval_rating: 3.5 + (i * 0.1),
        approval_count: 40 + i,
        confidence_score: 0.8
      }));

      await supabase.from('fragrance_social_metrics').insert(metricsData);

      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('fragrance_social_metrics')
        .select('*')
        .eq('demographic_group', 'age:18-24,exp:beginner')
        .gte('approval_rating', 4.0)
        .order('approval_rating', { ascending: false });

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(queryTime).toBeLessThan(100); // Should be fast with proper indexes

      // Clean up
      await supabase.from('fragrance_social_metrics').delete().like('fragrance_id', 'test-frag-%');
    });

    test('should handle concurrent rating submissions', async () => {
      // Create multiple demographics
      const demographics = Array.from({ length: 5 }, (_, i) => ({
        user_id: `concurrent-user-${i}`,
        age_group: '18-24',
        experience_level: 'beginner'
      }));

      await supabase.from('user_demographics').insert(demographics);

      // Submit concurrent ratings
      const ratingPromises = demographics.map((demo, i) =>
        supabase.from('peer_approval_ratings').insert({
          user_id: demo.user_id,
          fragrance_id: testFragranceId,
          overall_rating: 4.0 + (i * 0.1)
        })
      );

      const results = await Promise.all(ratingPromises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.error).toBeNull();
      });

      // Clean up
      const userIds = demographics.map(d => d.user_id);
      await supabase.from('peer_approval_ratings').delete().in('user_id', userIds);
      await supabase.from('user_demographics').delete().in('user_id', userIds);
    });
  });
});
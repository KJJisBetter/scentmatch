import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createServiceSupabase } from '@/lib/supabase';
import { socialContextService } from '@/lib/services/social-context';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * SCE-69: Social Validation System Integration Tests
 * 
 * End-to-end tests for the complete social validation system:
 * - Database operations with real data
 * - API endpoint functionality
 * - Component integration with live data
 * - Social metrics calculation accuracy
 * - Performance under realistic load
 */

describe('Social Validation System Integration', () => {
  let supabase: SupabaseClient;
  let testData: {
    fragranceId: string;
    userIds: string[];
    guestSessionIds: string[];
  };

  beforeAll(async () => {
    supabase = createServiceSupabase();
    
    // Set up test data
    testData = {
      fragranceId: 'integration-test-fragrance',
      userIds: [
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333',
        '44444444-4444-4444-4444-444444444444',
        '55555555-5555-5555-5555-555555555555'
      ],
      guestSessionIds: [
        'guest_integration_001',
        'guest_integration_002',
        'guest_integration_003'
      ]
    };

    // Create test fragrance
    await supabase.from('fragrances').upsert({
      id: testData.fragranceId,
      brand_id: 'test-brand-integration',
      name: 'Integration Test Fragrance',
      gender: 'unisex',
      main_accords: ['fresh', 'woody'],
      rating_value: 0,
      rating_count: 0
    });

    // Create test brand
    await supabase.from('fragrance_brands').upsert({
      id: 'test-brand-integration',
      name: 'Test Brand Integration',
      slug: 'test-brand-integration'
    });
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await supabase.from('peer_approval_ratings').delete().eq('fragrance_id', testData.fragranceId);
    await supabase.from('fragrance_social_metrics').delete().eq('fragrance_id', testData.fragranceId);
    await supabase.from('user_demographics').delete().in('user_id', testData.userIds);
    await supabase.from('user_demographics').delete().in('guest_session_id', testData.guestSessionIds);
    await supabase.from('fragrance_uniqueness_scores').delete().eq('fragrance_id', testData.fragranceId);
  });

  afterAll(async () => {
    // Clean up all test data
    await supabase.from('peer_approval_ratings').delete().eq('fragrance_id', testData.fragranceId);
    await supabase.from('fragrance_social_metrics').delete().eq('fragrance_id', testData.fragranceId);
    await supabase.from('fragrance_popularity_trends').delete().eq('fragrance_id', testData.fragranceId);
    await supabase.from('fragrance_uniqueness_scores').delete().eq('fragrance_id', testData.fragranceId);
    await supabase.from('user_demographics').delete().in('user_id', testData.userIds);
    await supabase.from('user_demographics').delete().in('guest_session_id', testData.guestSessionIds);
    await supabase.from('fragrances').delete().eq('id', testData.fragranceId);
    await supabase.from('fragrance_brands').delete().eq('id', 'test-brand-integration');
  });

  describe('Complete User Journey: Social Validation Flow', () => {
    test('should handle complete social validation workflow', async () => {
      // Step 1: Create diverse user demographics
      const demographicsData = [
        {
          user_id: testData.userIds[0],
          age_group: '18-24' as const,
          experience_level: 'beginner' as const,
          uniqueness_preference: 3,
          social_influence_level: 8
        },
        {
          user_id: testData.userIds[1],
          age_group: '18-24' as const,
          experience_level: 'beginner' as const,
          uniqueness_preference: 4,
          social_influence_level: 7
        },
        {
          user_id: testData.userIds[2],
          age_group: '25-34' as const,
          experience_level: 'experienced' as const,
          uniqueness_preference: 8,
          social_influence_level: 4
        },
        {
          guest_session_id: testData.guestSessionIds[0],
          age_group: '18-24' as const,
          experience_level: 'intermediate' as const,
          uniqueness_preference: 6,
          social_influence_level: 6
        }
      ];

      // Create demographics using service
      for (const demo of demographicsData) {
        await socialContextService.updateUserDemographics(demo);
      }

      // Step 2: Submit ratings from different user types
      const ratings = [
        {
          user_id: testData.userIds[0],
          fragrance_id: testData.fragranceId,
          overall_rating: 4.5,
          would_recommend: true,
          experience_rating: 'love' as const,
          experience_level_when_rated: 'beginner' as const,
          confidence_in_rating: 8,
          quick_review: 'Perfect for beginners!'
        },
        {
          user_id: testData.userIds[1],
          fragrance_id: testData.fragranceId,
          overall_rating: 4.0,
          would_recommend: true,
          experience_rating: 'like' as const,
          experience_level_when_rated: 'beginner' as const,
          confidence_in_rating: 7
        },
        {
          user_id: testData.userIds[2],
          fragrance_id: testData.fragranceId,
          overall_rating: 3.5,
          would_recommend: false,
          experience_rating: 'neutral' as const,
          experience_level_when_rated: 'experienced' as const,
          confidence_in_rating: 9,
          quick_review: 'Too mainstream for my taste'
        },
        {
          guest_session_id: testData.guestSessionIds[0],
          fragrance_id: testData.fragranceId,
          overall_rating: 4.2,
          would_recommend: true,
          experience_rating: 'like' as const,
          experience_level_when_rated: 'intermediate' as const,
          confidence_in_rating: 6
        }
      ];

      for (const rating of ratings) {
        await socialContextService.submitPeerRating(rating);
      }

      // Wait for triggers to process
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 3: Verify social metrics calculation
      const { data: socialMetrics } = await supabase
        .from('fragrance_social_metrics')
        .select('*')
        .eq('fragrance_id', testData.fragranceId);

      expect(socialMetrics).toBeDefined();
      expect(socialMetrics!.length).toBeGreaterThan(0);

      // Should have separate metrics for different demographic groups
      const beginnerGroup = socialMetrics!.find(m => m.demographic_group.includes('beginner'));
      const experiencedGroup = socialMetrics!.find(m => m.demographic_group.includes('experienced'));

      expect(beginnerGroup).toBeDefined();
      expect(experiencedGroup).toBeDefined();

      // Beginner group should have higher approval (4.5, 4.0, 4.2 avg ≈ 4.23)
      expect(beginnerGroup!.approval_rating).toBeGreaterThan(4.0);
      
      // Should have correct approval counts
      expect(beginnerGroup!.approval_count).toBe(3); // 2 users + 1 guest
      expect(experiencedGroup!.approval_count).toBe(1);

      // Step 4: Test social context generation
      const socialContext = await socialContextService.getFragranceSocialContext(
        testData.fragranceId,
        '18-24',
        'beginner'
      );

      expect(socialContext).toBeDefined();
      expect(socialContext!.overall.total_approvals).toBe(4);
      expect(socialContext!.overall.avg_approval).toBeGreaterThan(3.5);
      expect(socialContext!.peer_context).toBeDefined();
      expect(socialContext!.peer_context!.approval_rating).toBeGreaterThan(4.0);

      // Step 5: Test social validation badges generation
      const badges = await socialContextService.getSocialValidationBadges(
        testData.fragranceId,
        '18-24',
        'beginner'
      );

      expect(badges).toBeDefined();
      expect(badges.length).toBeGreaterThan(0);

      // Should have demographic badge
      const demographicBadge = badges.find(b => b.type === 'demographic');
      expect(demographicBadge).toBeDefined();
      expect(demographicBadge!.confidence).toBeGreaterThan(0.5);

      // Should have peer approval badge
      const approvalBadge = badges.find(b => b.type === 'peer_approval');
      expect(approvalBadge).toBeDefined();
    });

    test('should handle confidence boost calculation correctly', async () => {
      // Create user with high social influence and preference for popular scents
      const socialUser = {
        user_id: testData.userIds[0],
        age_group: '18-24' as const,
        experience_level: 'beginner' as const,
        uniqueness_preference: 3, // Prefers popular
        social_influence_level: 9  // Highly influenced by others
      };

      await socialContextService.updateUserDemographics(socialUser);

      // Create multiple positive ratings to build strong social proof
      const highApprovalRatings = Array.from({ length: 10 }, (_, i) => ({
        user_id: `user_${i}`,
        fragrance_id: testData.fragranceId,
        overall_rating: 4.0 + (Math.random() * 1.0), // 4.0-5.0
        would_recommend: true,
        experience_rating: 'love' as const,
        experience_level_when_rated: 'beginner' as const,
        confidence_in_rating: 8
      }));

      // Create demographics for these users
      for (let i = 0; i < 10; i++) {
        await supabase.from('user_demographics').insert({
          user_id: `user_${i}`,
          age_group: '18-24',
          experience_level: 'beginner'
        });
      }

      // Submit ratings
      for (const rating of highApprovalRatings) {
        await supabase.from('peer_approval_ratings').insert(rating);
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Manually update social metrics
      await supabase.rpc('update_fragrance_social_metrics', {
        p_fragrance_id: testData.fragranceId
      });

      // Get social context
      const context = await socialContextService.getFragranceSocialContext(
        testData.fragranceId,
        '18-24',
        'beginner'
      );

      // Calculate confidence boost
      const confidenceBoost = socialContextService.calculateConfidenceBoost(
        context!,
        {
          uniqueness_preference: socialUser.uniqueness_preference,
          social_influence_level: socialUser.social_influence_level
        }
      );

      expect(confidenceBoost.confidence_boost).toBeGreaterThan(0.5);
      expect(confidenceBoost.reasoning).toContain('Strong peer approval');
      expect(confidenceBoost.reasoning).toContain('Good match for people like you');

      // Clean up additional test data
      await supabase.from('peer_approval_ratings').delete().in('user_id', 
        Array.from({ length: 10 }, (_, i) => `user_${i}`)
      );
      await supabase.from('user_demographics').delete().in('user_id', 
        Array.from({ length: 10 }, (_, i) => `user_${i}`)
      );
    });
  });

  describe('API Endpoints Integration', () => {
    test('should handle demographics API workflow', async () => {
      const userId = testData.userIds[0];
      
      // POST: Create demographics
      const createResponse = await fetch('/api/social/demographics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          age_group: '25-34',
          experience_level: 'intermediate',
          uniqueness_preference: 7,
          social_influence_level: 5,
          style_preferences: ['sophisticated', 'woody']
        })
      });

      expect(createResponse.ok).toBe(true);
      const createData = await createResponse.json();
      expect(createData.success).toBe(true);
      expect(createData.data.age_group).toBe('25-34');

      // GET: Retrieve demographics
      const getResponse = await fetch(`/api/social/demographics?user_id=${userId}`);
      expect(getResponse.ok).toBe(true);
      const getData = await getResponse.json();
      expect(getData.success).toBe(true);
      expect(getData.data.age_group).toBe('25-34');
      expect(getData.data.style_preferences).toEqual(['sophisticated', 'woody']);

      // PUT: Update demographics
      const updateResponse = await fetch('/api/social/demographics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          experience_level: 'experienced',
          uniqueness_preference: 8
        })
      });

      expect(updateResponse.ok).toBe(true);
      const updateData = await updateResponse.json();
      expect(updateData.success).toBe(true);

      // Verify update
      const verifyResponse = await fetch(`/api/social/demographics?user_id=${userId}`);
      const verifyData = await verifyResponse.json();
      expect(verifyData.data.experience_level).toBe('experienced');
      expect(verifyData.data.uniqueness_preference).toBe(8);
      expect(verifyData.data.age_group).toBe('25-34'); // Should remain unchanged
    });

    test('should handle ratings API workflow', async () => {
      const userId = testData.userIds[0];
      
      // Create user demographics first
      await socialContextService.updateUserDemographics({
        user_id: userId,
        age_group: '18-24',
        experience_level: 'beginner'
      });

      // POST: Submit rating
      const submitResponse = await fetch('/api/social/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          fragrance_id: testData.fragranceId,
          overall_rating: 4.3,
          would_recommend: true,
          experience_rating: 'love',
          experience_level_when_rated: 'beginner',
          confidence_in_rating: 8,
          quick_review: 'Amazing scent for beginners!'
        })
      });

      expect(submitResponse.ok).toBe(true);
      const submitData = await submitResponse.json();
      expect(submitData.success).toBe(true);

      // GET: Retrieve ratings
      const getRatingsResponse = await fetch(
        `/api/social/ratings?fragrance_id=${testData.fragranceId}`
      );
      expect(getRatingsResponse.ok).toBe(true);
      const getRatingsData = await getRatingsResponse.json();
      expect(getRatingsData.success).toBe(true);
      expect(getRatingsData.data.length).toBe(1);
      expect(getRatingsData.data[0].overall_rating).toBe(4.3);
      expect(getRatingsData.data[0].quick_review).toBe('Amazing scent for beginners!');

      // PUT: Update rating
      const updateResponse = await fetch('/api/social/ratings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          fragrance_id: testData.fragranceId,
          overall_rating: 4.8,
          quick_review: 'Even better than I thought!'
        })
      });

      expect(updateResponse.ok).toBe(true);

      // Verify update
      const verifyResponse = await fetch(
        `/api/social/ratings?user_id=${userId}&fragrance_id=${testData.fragranceId}`
      );
      const verifyData = await verifyResponse.json();
      expect(verifyData.data[0].overall_rating).toBe(4.8);
      expect(verifyData.data[0].quick_review).toBe('Even better than I thought!');

      // Test duplicate rating prevention
      const duplicateResponse = await fetch('/api/social/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          fragrance_id: testData.fragranceId,
          overall_rating: 3.0
        })
      });

      expect(duplicateResponse.status).toBe(409); // Conflict
      const duplicateData = await duplicateResponse.json();
      expect(duplicateData.success).toBe(false);
      expect(duplicateData.error).toContain('already rated');
    });

    test('should handle social context API', async () => {
      // Set up test data
      await socialContextService.updateUserDemographics({
        user_id: testData.userIds[0],
        age_group: '18-24',
        experience_level: 'beginner'
      });

      await socialContextService.submitPeerRating({
        user_id: testData.userIds[0],
        fragrance_id: testData.fragranceId,
        overall_rating: 4.5,
        would_recommend: true,
        experience_rating: 'love',
        experience_level_when_rated: 'beginner',
        confidence_in_rating: 9
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Test basic social context
      const contextResponse = await fetch(
        `/api/social/context?fragrance_id=${testData.fragranceId}`
      );
      expect(contextResponse.ok).toBe(true);
      const contextData = await contextResponse.json();
      expect(contextData.success).toBe(true);
      expect(contextData.data.context).toBeDefined();

      // Test with user demographics
      const userContextResponse = await fetch(
        `/api/social/context?fragrance_id=${testData.fragranceId}&user_age_group=18-24&user_experience_level=beginner`
      );
      expect(userContextResponse.ok).toBe(true);
      const userContextData = await userContextResponse.json();
      expect(userContextData.data.context.peer_context).toBeDefined();

      // Test with badges
      const badgesResponse = await fetch(
        `/api/social/context?fragrance_id=${testData.fragranceId}&user_age_group=18-24&user_experience_level=beginner&include_badges=true`
      );
      expect(badgesResponse.ok).toBe(true);
      const badgesData = await badgesResponse.json();
      expect(badgesData.data.badges).toBeDefined();
      expect(Array.isArray(badgesData.data.badges)).toBe(true);

      // Test interaction tracking
      const trackResponse = await fetch('/api/social/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragrance_id: testData.fragranceId,
          interaction_type: 'view'
        })
      });

      expect(trackResponse.ok).toBe(true);
      const trackData = await trackResponse.json();
      expect(trackData.success).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent rating submissions efficiently', async () => {
      // Create multiple user demographics
      const userPromises = testData.userIds.map((userId, index) =>
        socialContextService.updateUserDemographics({
          user_id: userId,
          age_group: index < 3 ? '18-24' : '25-34',
          experience_level: index < 2 ? 'beginner' : 'experienced'
        })
      );

      await Promise.all(userPromises);

      // Submit concurrent ratings
      const ratingPromises = testData.userIds.map((userId, index) =>
        socialContextService.submitPeerRating({
          user_id: userId,
          fragrance_id: testData.fragranceId,
          overall_rating: 3.5 + (index * 0.3),
          would_recommend: index < 3,
          experience_rating: index < 2 ? 'love' : 'like',
          experience_level_when_rated: index < 2 ? 'beginner' : 'experienced',
          confidence_in_rating: 7 + index
        })
      );

      const startTime = performance.now();
      await Promise.all(ratingPromises);
      const submitTime = performance.now() - startTime;

      expect(submitTime).toBeLessThan(2000); // Should complete within 2 seconds

      // Wait for triggers to process
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verify all ratings were processed correctly
      const contextStartTime = performance.now();
      const context = await socialContextService.getFragranceSocialContext(
        testData.fragranceId,
        '18-24',
        'beginner'
      );
      const contextTime = performance.now() - contextStartTime;

      expect(contextTime).toBeLessThan(500); // Context generation should be fast
      expect(context!.overall.total_approvals).toBe(testData.userIds.length);
    });

    test('should efficiently generate badges for multiple demographics', async () => {
      // Set up diverse user base
      const users = Array.from({ length: 20 }, (_, i) => ({
        user_id: `perf_user_${i}`,
        age_group: i < 10 ? '18-24' : '25-34',
        experience_level: i % 4 === 0 ? 'beginner' : 
                         i % 4 === 1 ? 'intermediate' :
                         i % 4 === 2 ? 'experienced' : 'expert'
      }));

      // Create demographics
      for (const user of users) {
        await supabase.from('user_demographics').insert(user);
      }

      // Submit ratings
      for (let i = 0; i < users.length; i++) {
        await supabase.from('peer_approval_ratings').insert({
          user_id: users[i].user_id,
          fragrance_id: testData.fragranceId,
          overall_rating: 3.0 + (Math.random() * 2.0),
          would_recommend: Math.random() > 0.3,
          experience_rating: 'like',
          experience_level_when_rated: users[i].experience_level,
          confidence_in_rating: 5 + Math.floor(Math.random() * 5)
        });
      }

      // Force metrics update
      await supabase.rpc('update_fragrance_social_metrics', {
        p_fragrance_id: testData.fragranceId
      });

      // Test badge generation performance
      const startTime = performance.now();
      const badges = await socialContextService.getSocialValidationBadges(
        testData.fragranceId,
        '18-24',
        'beginner'
      );
      const badgeTime = performance.now() - startTime;

      expect(badgeTime).toBeLessThan(300); // Should be fast
      expect(badges.length).toBeGreaterThan(0);

      // Clean up performance test data
      await supabase.from('peer_approval_ratings').delete().in('user_id',
        users.map(u => u.user_id)
      );
      await supabase.from('user_demographics').delete().in('user_id',
        users.map(u => u.user_id)
      );
    });
  });
});
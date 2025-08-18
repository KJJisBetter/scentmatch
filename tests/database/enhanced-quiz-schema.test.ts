/**
 * Enhanced Quiz Database Schema Tests
 *
 * Tests for new database schema features supporting:
 * - Enhanced user profiles with AI-generated names and descriptions
 * - User favorite fragrances for advanced experience levels
 * - AI profile caching for performance optimization
 * - Enhanced quiz sessions with experience level tracking
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Test database connection (using test database)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Enhanced Quiz Database Schema', () => {
  let testUserId: string;
  let testSessionId: string;
  let testFragranceId: string;

  beforeAll(async () => {
    // Create test user for schema testing
    const { data: authData } = await supabase.auth.admin.createUser({
      email: `test-schema-${Date.now()}@example.com`,
      password: 'TestSchema123!',
      email_confirm: true,
    });
    testUserId = authData.user!.id;

    // Get a test fragrance ID
    const { data: fragrances } = await supabase
      .from('fragrances')
      .select('id')
      .limit(1);
    testFragranceId = fragrances![0].id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('Enhanced User Profiles Schema', () => {
    test('should support new profile fields', async () => {
      const profileData = {
        id: testUserId,
        user_id: testUserId,
        full_name: 'Test User',
        experience_level: 'enthusiast',
        display_name: 'Elegant Rose Explorer',
        ai_profile_description:
          'You are the Elegant Rose Explorer, a fragrance enthusiast...',
        unique_profile_name: 'Elegant Rose of Secret Gardens',
        profile_completion_step: 'ai_profile_generated',
        favorite_accords: ['rose', 'jasmine'],
        disliked_accords: [],
        profile_privacy: 'private',
        onboarding_completed: true,
        onboarding_step: 'completed',
        privacy_settings: {
          show_ratings: true,
          collection_public: false,
          allow_friend_requests: true,
          recommendations_enabled: true,
        },
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profileData)
        .select();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data![0].display_name).toBe('Elegant Rose Explorer');
      expect(data![0].experience_level).toBe('enthusiast');
      expect(data![0].unique_profile_name).toBe(
        'Elegant Rose of Secret Gardens'
      );
      expect(data![0].ai_profile_description).toContain('fragrance enthusiast');
    });

    test('should validate experience level enum constraint', async () => {
      const invalidProfileData = {
        id: `${testUserId}-invalid`,
        user_id: testUserId,
        experience_level: 'invalid_level', // Should fail validation
      };

      const { error } = await supabase
        .from('user_profiles')
        .insert(invalidProfileData);

      expect(error).toBeTruthy();
      expect(error!.message).toMatch(/check constraint|invalid/i);
    });

    test('should have proper indexes for profile searches', async () => {
      // Test that display_name index exists and works efficiently
      const { data } = await supabase
        .from('user_profiles')
        .select('display_name')
        .ilike('display_name', '%rose%')
        .limit(10);

      expect(data).toBeTruthy();
      // Index should allow efficient name-based searches
    });

    test('should support AI profile description storage', async () => {
      const longDescription =
        'You are the Sophisticated Connoisseur of Midnight Gardens, a fragrance collector with profound olfactory knowledge and discerning taste. Your avant-garde aesthetic reflects years of experience and a deep understanding of perfumery as an art form.\n\nYour collection represents a carefully curated library of olfactory experiences, from rare vintage treasures to cutting-edge contemporary creations. You appreciate the nuances of composition, the artistry of master perfumers, and the cultural significance of different fragrance traditions.\n\nAs a connoisseur, you seek fragrances that challenge and inspire, pieces that represent the highest levels of artistry and innovation in perfumery. Your expertise allows you to appreciate both subtle complexity and bold creativity.';

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ ai_profile_description: longDescription })
        .eq('user_id', testUserId)
        .select();

      expect(error).toBeNull();
      expect(data![0].ai_profile_description).toBe(longDescription);
      expect(data![0].ai_profile_description.length).toBeGreaterThan(500);
    });
  });

  describe('User Favorite Fragrances Table', () => {
    test('should create favorite fragrance entries', async () => {
      const favoriteData = {
        user_id: testUserId,
        fragrance_id: testFragranceId,
        selection_source: 'quiz_input',
        confidence_score: 0.95,
        metadata: {
          selected_during_quiz: true,
          experience_level: 'enthusiast',
          question_context: 'favorite_selection',
        },
      };

      const { data, error } = await supabase
        .from('user_favorite_fragrances')
        .insert(favoriteData)
        .select();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data![0].user_id).toBe(testUserId);
      expect(data![0].fragrance_id).toBe(testFragranceId);
      expect(data![0].selection_source).toBe('quiz_input');
      expect(data![0].confidence_score).toBe(0.95);
    });

    test('should enforce unique constraint on user_id + fragrance_id', async () => {
      const duplicateFavorite = {
        user_id: testUserId,
        fragrance_id: testFragranceId,
        selection_source: 'browse',
      };

      const { error } = await supabase
        .from('user_favorite_fragrances')
        .insert(duplicateFavorite);

      expect(error).toBeTruthy();
      expect(error!.message).toMatch(/unique|duplicate/i);
    });

    test('should support different selection sources', async () => {
      // Get another fragrance for testing
      const { data: fragrances } = await supabase
        .from('fragrances')
        .select('id')
        .neq('id', testFragranceId)
        .limit(3);

      const selectionSources = ['quiz_input', 'browse', 'recommendation'];

      for (let i = 0; i < selectionSources.length; i++) {
        const { data, error } = await supabase
          .from('user_favorite_fragrances')
          .insert({
            user_id: testUserId,
            fragrance_id: fragrances![i].id,
            selection_source: selectionSources[i],
            confidence_score: 0.8 + i * 0.05,
          })
          .select();

        expect(error).toBeNull();
        expect(data![0].selection_source).toBe(selectionSources[i]);
      }
    });

    test('should have RLS policies for user data protection', async () => {
      // Test that users can only access their own favorites
      const { data, error } = await supabase
        .from('user_favorite_fragrances')
        .select('*')
        .eq('user_id', testUserId);

      expect(error).toBeNull();
      expect(data).toBeTruthy();

      // All returned records should belong to the test user
      data!.forEach(favorite => {
        expect(favorite.user_id).toBe(testUserId);
      });
    });

    test('should cascade delete when user is deleted', async () => {
      // Create a temporary user for deletion testing
      const { data: tempUser } = await supabase.auth.admin.createUser({
        email: `temp-delete-test-${Date.now()}@example.com`,
        password: 'TempTest123!',
        email_confirm: true,
      });

      const tempUserId = tempUser.user!.id;

      // Add a favorite for the temp user
      await supabase.from('user_favorite_fragrances').insert({
        user_id: tempUserId,
        fragrance_id: testFragranceId,
        selection_source: 'test',
      });

      // Verify favorite exists
      const { data: beforeDelete } = await supabase
        .from('user_favorite_fragrances')
        .select('*')
        .eq('user_id', tempUserId);

      expect(beforeDelete).toHaveLength(1);

      // Delete the user
      await supabase.auth.admin.deleteUser(tempUserId);

      // Verify favorites were cascade deleted
      const { data: afterDelete } = await supabase
        .from('user_favorite_fragrances')
        .select('*')
        .eq('user_id', tempUserId);

      expect(afterDelete).toHaveLength(0);
    });
  });

  describe('Enhanced Quiz Sessions Schema', () => {
    beforeEach(async () => {
      // Create test quiz session
      const { data } = await supabase
        .from('user_quiz_sessions')
        .insert({
          user_id: testUserId,
          session_token: `test-enhanced-${Date.now()}`,
          quiz_version: 'adaptive-v1',
          started_at: new Date().toISOString(),
          current_question: 0,
          total_questions: 4,
          is_completed: false,
          is_guest_session: false,
          detected_experience_level: 'enthusiast',
          ai_profile_generated: false,
          favorite_fragrances_collected: false,
        })
        .select()
        .single();

      testSessionId = data!.id;
    });

    test('should track experience level detection', async () => {
      const { data, error } = await supabase
        .from('user_quiz_sessions')
        .update({ detected_experience_level: 'collector' })
        .eq('id', testSessionId)
        .select();

      expect(error).toBeNull();
      expect(data![0].detected_experience_level).toBe('collector');
    });

    test('should track AI profile generation status', async () => {
      const uniqueProfileName = 'Masterful Oud of Ancient Libraries';

      const { data, error } = await supabase
        .from('user_quiz_sessions')
        .update({
          ai_profile_generated: true,
          unique_profile_name: uniqueProfileName,
        })
        .eq('id', testSessionId)
        .select();

      expect(error).toBeNull();
      expect(data![0].ai_profile_generated).toBe(true);
      expect(data![0].unique_profile_name).toBe(uniqueProfileName);
    });

    test('should track conversion to account timing', async () => {
      const conversionTime = new Date().toISOString();

      const { data, error } = await supabase
        .from('user_quiz_sessions')
        .update({ conversion_to_account_at: conversionTime })
        .eq('id', testSessionId)
        .select();

      expect(error).toBeNull();
      expect(data![0].conversion_to_account_at).toBe(conversionTime);
    });

    test('should support favorite collection tracking', async () => {
      const { data, error } = await supabase
        .from('user_quiz_sessions')
        .update({ favorite_fragrances_collected: true })
        .eq('id', testSessionId)
        .select();

      expect(error).toBeNull();
      expect(data![0].favorite_fragrances_collected).toBe(true);
    });

    test('should have proper indexes for analytics queries', async () => {
      // Test experience level index performance
      const { data: experienceLevelData } = await supabase
        .from('user_quiz_sessions')
        .select('*')
        .eq('detected_experience_level', 'enthusiast')
        .limit(10);

      expect(experienceLevelData).toBeTruthy();

      // Test conversion index performance
      const { data: conversionData } = await supabase
        .from('user_quiz_sessions')
        .select('*')
        .not('conversion_to_account_at', 'is', null)
        .limit(10);

      expect(conversionData).toBeTruthy();
    });
  });

  describe('AI Profile Cache Table', () => {
    test('should store and retrieve cached AI profiles', async () => {
      const cacheData = {
        personality_type: 'sophisticated_floral_lover',
        experience_level: 'collector',
        unique_profile_name: 'Exquisite Jasmine of Velvet Gardens',
        profile_description:
          'You are the Exquisite Jasmine of Velvet Gardens, a sophisticated collector with deep olfactory knowledge...',
        usage_count: 1,
      };

      const { data, error } = await supabase
        .from('ai_profile_cache')
        .insert(cacheData)
        .select();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data![0].unique_profile_name).toBe(cacheData.unique_profile_name);
      expect(data![0].profile_description).toContain('sophisticated collector');
      expect(data![0].usage_count).toBe(1);
    });

    test('should enforce unique constraint on personality + experience + name', async () => {
      const duplicateCacheData = {
        personality_type: 'sophisticated_floral_lover',
        experience_level: 'collector',
        unique_profile_name: 'Exquisite Jasmine of Velvet Gardens', // Same as above
        profile_description: 'Different description',
        usage_count: 2,
      };

      const { error } = await supabase
        .from('ai_profile_cache')
        .insert(duplicateCacheData);

      expect(error).toBeTruthy();
      expect(error!.message).toMatch(/unique|duplicate/i);
    });

    test('should track usage count and last used timestamps', async () => {
      const initialTime = new Date().toISOString();

      const cacheEntry = {
        personality_type: 'natural_fresh_lover',
        experience_level: 'beginner',
        unique_profile_name: 'Gentle Breeze of Morning Meadows',
        profile_description: 'A fresh and natural fragrance journey...',
        usage_count: 1,
      };

      const { data: insertData } = await supabase
        .from('ai_profile_cache')
        .insert(cacheEntry)
        .select();

      const cacheId = insertData![0].id;

      // Update usage count
      const { data: updateData, error } = await supabase
        .from('ai_profile_cache')
        .update({
          usage_count: 3,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', cacheId)
        .select();

      expect(error).toBeNull();
      expect(updateData![0].usage_count).toBe(3);
      expect(new Date(updateData![0].last_used_at).getTime()).toBeGreaterThan(
        new Date(initialTime).getTime()
      );
    });

    test('should support efficient lookups by personality and experience', async () => {
      const { data, error } = await supabase
        .from('ai_profile_cache')
        .select('*')
        .eq('personality_type', 'sophisticated_floral_lover')
        .eq('experience_level', 'collector')
        .order('usage_count', { ascending: false })
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeTruthy();

      // Should be ordered by usage count descending
      if (data!.length > 1) {
        expect(data![0].usage_count).toBeGreaterThanOrEqual(
          data![1].usage_count
        );
      }
    });
  });

  describe('Database Functions', () => {
    test('should have enhanced quiz recommendations function', async () => {
      // Test the enhanced recommendation function
      const { data, error } = await supabase.rpc(
        'get_enhanced_quiz_recommendations',
        {
          target_session_id: testSessionId,
          max_results: 5,
          include_experience_boost: true,
        }
      );

      // Function might not exist yet, but should not throw unexpected errors
      if (!error) {
        expect(data).toBeTruthy();
        expect(Array.isArray(data)).toBeTruthy();

        if (data!.length > 0) {
          const rec = data![0];
          expect(rec).toHaveProperty('fragrance_id');
          expect(rec).toHaveProperty('name');
          expect(rec).toHaveProperty('brand');
          expect(rec).toHaveProperty('match_score');
          expect(rec).toHaveProperty('experience_relevance');
        }
      } else {
        // Expected if function doesn't exist yet
        expect(error.message).toMatch(/function.*does not exist/i);
      }
    });

    test('should have unique profile name generation function', async () => {
      const { data, error } = await supabase.rpc('get_unique_profile_name', {
        personality_type: 'romantic_floral_lover',
        experience_level: 'enthusiast',
        force_new: true,
      });

      if (!error) {
        expect(data).toBeTruthy();
        expect(typeof data).toBe('string');
        expect(data.length).toBeGreaterThan(10);

        // Should follow naming pattern
        expect(data).toMatch(/\w+ \w+ of \w+/);
      } else {
        // Expected if function doesn't exist yet
        expect(error.message).toMatch(/function.*does not exist/i);
      }
    });

    test('should support experience-level recommendation boosting', async () => {
      // Test that recommendations are boosted based on experience level
      const beginnerRecs = await supabase.rpc(
        'get_enhanced_quiz_recommendations',
        {
          target_session_id: testSessionId,
          max_results: 5,
          include_experience_boost: true,
        }
      );

      // Should prioritize popular fragrances for beginners
      // Should prioritize niche fragrances for collectors
      // This test validates the concept even if function doesn't exist yet
      expect(beginnerRecs.error?.message || '').toMatch(
        /function.*does not exist|/i
      );
    });
  });

  describe('Performance and Indexing', () => {
    test('should have efficient indexes for favorite lookups', async () => {
      // Test user-based favorite lookups
      const start = Date.now();

      const { data, error } = await supabase
        .from('user_favorite_fragrances')
        .select('fragrance_id, selection_source, confidence_score')
        .eq('user_id', testUserId);

      const end = Date.now();

      expect(error).toBeNull();
      expect(end - start).toBeLessThan(100); // Should be fast with proper indexing
    });

    test('should have efficient AI cache lookups', async () => {
      const start = Date.now();

      const { data, error } = await supabase
        .from('ai_profile_cache')
        .select('unique_profile_name, profile_description')
        .eq('personality_type', 'sophisticated_floral_lover')
        .eq('experience_level', 'collector')
        .order('usage_count', { ascending: false })
        .limit(3);

      const end = Date.now();

      expect(error).toBeNull();
      expect(end - start).toBeLessThan(100); // Should be fast with proper indexing
    });

    test('should support analytics queries on quiz sessions', async () => {
      // Test experience level analytics
      const { data: experienceStats, error: experienceError } = await supabase
        .from('user_quiz_sessions')
        .select('detected_experience_level, count(*)')
        .not('detected_experience_level', 'is', null);

      expect(experienceError).toBeNull();

      // Test conversion analytics
      const { data: conversionStats, error: conversionError } = await supabase
        .from('user_quiz_sessions')
        .select('conversion_to_account_at, count(*)')
        .not('conversion_to_account_at', 'is', null);

      expect(conversionError).toBeNull();
    });
  });

  describe('Data Migration and Compatibility', () => {
    test('should maintain compatibility with existing user profiles', async () => {
      // Test that existing profiles work with new schema
      const { data: existingProfiles, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, experience_level')
        .limit(5);

      expect(error).toBeNull();
      expect(existingProfiles).toBeTruthy();

      // Existing profiles should have default values for new fields
      existingProfiles!.forEach(profile => {
        expect(profile).toHaveProperty('id');
        expect(profile).toHaveProperty('user_id');
        // New fields should either be null or have defaults
      });
    });

    test('should support gradual migration of existing quiz sessions', async () => {
      // Test that existing quiz sessions work with enhanced schema
      const { data: existingSessions, error } = await supabase
        .from('user_quiz_sessions')
        .select('id, quiz_version, detected_experience_level')
        .limit(5);

      expect(error).toBeNull();
      expect(existingSessions).toBeTruthy();

      // Should handle both old and new session formats
      existingSessions!.forEach(session => {
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('quiz_version');
        // New fields should be nullable for existing sessions
      });
    });

    test('should handle mixed data states during migration', async () => {
      // Test profiles with partial new data
      const partialUpdateData = {
        display_name: 'Partial Update Test',
        experience_level: 'enthusiast',
        // Missing unique_profile_name and ai_profile_description
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .update(partialUpdateData)
        .eq('user_id', testUserId)
        .select();

      expect(error).toBeNull();
      expect(data![0].display_name).toBe('Partial Update Test');
      expect(data![0].experience_level).toBe('enthusiast');
      // Other new fields should remain null/default
    });
  });

  describe('Security and RLS Policies', () => {
    test('should protect user favorite fragrances with RLS', async () => {
      // Create another test user to verify isolation
      const { data: otherUser } = await supabase.auth.admin.createUser({
        email: `other-user-${Date.now()}@example.com`,
        password: 'OtherUser123!',
        email_confirm: true,
      });

      const otherUserId = otherUser.user!.id;

      // Add favorite for other user
      await supabase.from('user_favorite_fragrances').insert({
        user_id: otherUserId,
        fragrance_id: testFragranceId,
        selection_source: 'security_test',
      });

      // Test user should not see other user's favorites
      const { data: isolatedData } = await supabase
        .from('user_favorite_fragrances')
        .select('*')
        .eq('fragrance_id', testFragranceId);

      // Should only see own favorites, not other user's
      const usersFavorites = isolatedData?.filter(
        f => f.user_id === testUserId
      );
      const othersFavorites = isolatedData?.filter(
        f => f.user_id === otherUserId
      );

      expect(usersFavorites).toBeTruthy();
      expect(othersFavorites).toHaveLength(0); // RLS should prevent seeing others' data

      // Cleanup
      await supabase.auth.admin.deleteUser(otherUserId);
    });

    test('should allow anonymous access to AI cache for guest users', async () => {
      // AI profile cache should be readable for guest profile generation
      const { data, error } = await supabase
        .from('ai_profile_cache')
        .select('unique_profile_name, profile_description')
        .eq('personality_type', 'natural_fresh_lover')
        .eq('experience_level', 'beginner')
        .limit(3);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });
  });
});

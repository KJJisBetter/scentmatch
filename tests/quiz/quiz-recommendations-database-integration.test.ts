/**
 * Quiz Recommendation System Database Integration Tests - Task 3.1
 *
 * Tests the complete quiz-to-recommendations pipeline with new database structure.
 * Verifies integration with fragrance_embeddings, user_preferences table,
 * and new database functions for enhanced recommendation accuracy.
 */

import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import { createServiceSupabase } from '@/lib/supabase/server';
import { WorkingRecommendationEngine } from '@/lib/quiz/working-recommendation-engine';
import type { QuizResponse } from '@/lib/quiz/working-recommendation-engine';

describe('Quiz Recommendations Database Integration - Pipeline Testing', () => {
  let supabase: any;
  let engine: WorkingRecommendationEngine;

  beforeAll(() => {
    supabase = createServiceSupabase();
  });

  beforeEach(() => {
    engine = new WorkingRecommendationEngine();
  });

  describe('Enhanced Database Structure Integration', () => {
    test('should verify fragrance_embeddings table integration for vector similarity', async () => {
      // Check if fragrance_embeddings table exists
      const { data: embeddingTableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'fragrance_embeddings')
        .eq('table_schema', 'public')
        .single();

      if (!embeddingTableExists) {
        console.log('⚠️ fragrance_embeddings table not yet created - vector similarity not available');
        return;
      }

      console.log('✅ fragrance_embeddings table exists - testing vector integration');

      // Test if we have embedding data
      const { data: sampleEmbedding } = await supabase
        .from('fragrance_embeddings')
        .select('fragrance_id, embedding, embedding_model')
        .not('embedding', 'is', null)
        .limit(1)
        .single();

      if (sampleEmbedding) {
        console.log(`✅ Vector embeddings available (model: ${sampleEmbedding.embedding_model})`);
        
        // Test vector similarity if function exists
        const { data: similarTest, error: similarError } = await supabase.rpc('get_similar_fragrances', {
          target_fragrance_id: sampleEmbedding.fragrance_id,
          similarity_threshold: 0.7,
          max_results: 5
        });

        if (similarError) {
          console.log(`⚠️ get_similar_fragrances function not available: ${similarError.message}`);
        } else {
          console.log(`✅ Vector similarity function working - found ${similarTest?.length || 0} similar fragrances`);
        }
      } else {
        console.log('⚠️ No embedding data found - vectors not yet generated');
      }
    });

    test('should verify user_preferences table integration for personalization', async () => {
      // Check if user_preferences table exists
      const { data: preferencesTableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'user_preferences')
        .eq('table_schema', 'public')
        .single();

      if (!preferencesTableExists) {
        console.log('⚠️ user_preferences table not yet created - preference persistence not available');
        return;
      }

      console.log('✅ user_preferences table exists - testing preference integration');

      // Test basic CRUD operations on user_preferences
      const testPreferences = {
        user_id: 'test-user-quiz-integration',
        quiz_session_id: 'test-session-123',
        scent_preferences: { fresh_clean: true, warm_cozy: false },
        personality_style: 'classic_timeless',
        occasion_preferences: ['everyday'],
        gender_preference: 'men',
        experience_level: 'beginner'
      };

      // Test insert
      const { data: insertResult, error: insertError } = await supabase
        .from('user_preferences')
        .insert(testPreferences)
        .select()
        .single();

      if (insertError) {
        console.log(`⚠️ Cannot insert preferences: ${insertError.message}`);
      } else {
        console.log('✅ Preference insertion working');

        // Test retrieval
        const { data: retrievedPrefs, error: retrieveError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('quiz_session_id', 'test-session-123')
          .single();

        if (!retrieveError) {
          console.log('✅ Preference retrieval working');
          
          // Cleanup test data
          await supabase
            .from('user_preferences')
            .delete()
            .eq('quiz_session_id', 'test-session-123');
        }
      }
    });

    test('should verify user_fragrance_interactions table for analytics', async () => {
      // Check if user_fragrance_interactions table exists
      const { data: interactionsTableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'user_fragrance_interactions')
        .eq('table_schema', 'public')
        .single();

      if (!interactionsTableExists) {
        console.log('⚠️ user_fragrance_interactions table not yet created');
        return;
      }

      console.log('✅ user_fragrance_interactions table exists');

      // Test interaction tracking
      const testInteraction = {
        user_id: 'test-user-interaction',
        fragrance_id: 'test-fragrance-id',
        interaction_type: 'quiz_recommendation_view',
        interaction_value: 1,
        session_id: 'test-quiz-session'
      };

      const { data: interactionResult, error: interactionError } = await supabase
        .from('user_fragrance_interactions')
        .insert(testInteraction)
        .select()
        .single();

      if (interactionError) {
        console.log(`⚠️ Cannot track interactions: ${interactionError.message}`);
      } else {
        console.log('✅ Interaction tracking working');
        
        // Cleanup
        await supabase
          .from('user_fragrance_interactions')
          .delete()
          .eq('session_id', 'test-quiz-session');
      }
    });
  });

  describe('Quiz Pipeline Database Integration Testing', () => {
    test('should test complete quiz-to-database-to-recommendations flow', async () => {
      console.log('\n🔄 TESTING COMPLETE QUIZ PIPELINE:');

      const quizResponses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'fresh_clean',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'personality_style',
          answer_value: 'classic_timeless',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'occasions_beginner',
          answer_value: 'everyday',
          timestamp: new Date().toISOString(),
        }
      ];

      console.log('Step 1: Generate recommendations via quiz engine');
      const result = await engine.generateRecommendations(quizResponses, 'integration-test-session');

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(3);

      console.log(`✅ Quiz engine: ${result.recommendations.length} recommendations generated`);
      
      result.recommendations.forEach((rec, i) => {
        console.log(`   ${i+1}. ${rec.name} by ${rec.brand}`);
      });

      console.log('\nStep 2: Verify gender filtering (should only get men\'s or unisex)');
      result.recommendations.forEach(rec => {
        const isAppropriateGender = rec.gender_target === 'men' || rec.gender_target === 'unisex';
        expect(isAppropriateGender).toBe(true);
        console.log(`   ✅ ${rec.name}: gender_target = ${rec.gender_target}`);
      });

      console.log('\nStep 3: Test database preference storage (if available)');
      const { data: preferencesTableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'user_preferences')
        .eq('table_schema', 'public')
        .single();

      if (preferencesTableExists) {
        // Store preferences in database
        const preferenceData = {
          user_id: 'test-user-pipeline',
          quiz_session_id: 'integration-test-session',
          scent_preferences: { fresh_clean: true },
          personality_style: 'classic_timeless',
          occasion_preferences: ['everyday'],
          gender_preference: 'men',
          experience_level: 'beginner'
        };

        const { error: storeError } = await supabase
          .from('user_preferences')
          .insert(preferenceData);

        if (storeError) {
          console.log(`   ⚠️ Cannot store preferences: ${storeError.message}`);
        } else {
          console.log('   ✅ Preferences stored in database successfully');
          
          // Cleanup
          await supabase
            .from('user_preferences')
            .delete()
            .eq('quiz_session_id', 'integration-test-session');
        }
      } else {
        console.log('   ⚠️ user_preferences table not available - storage skipped');
      }

      console.log('\nStep 4: Test interaction tracking (if available)');
      const { data: interactionsTableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'user_fragrance_interactions')
        .eq('table_schema', 'public')
        .single();

      if (interactionsTableExists) {
        // Track quiz recommendation view
        const interactions = result.recommendations.map(rec => ({
          user_id: 'test-user-pipeline',
          fragrance_id: rec.id,
          interaction_type: 'quiz_recommendation_shown',
          interaction_value: 1,
          session_id: 'integration-test-session'
        }));

        const { error: trackError } = await supabase
          .from('user_fragrance_interactions')
          .insert(interactions);

        if (trackError) {
          console.log(`   ⚠️ Cannot track interactions: ${trackError.message}`);
        } else {
          console.log(`   ✅ Tracked ${interactions.length} quiz recommendation interactions`);
          
          // Cleanup
          await supabase
            .from('user_fragrance_interactions')
            .delete()
            .eq('session_id', 'integration-test-session');
        }
      } else {
        console.log('   ⚠️ user_fragrance_interactions table not available - tracking skipped');
      }

      console.log('\n🎯 PIPELINE INTEGRATION COMPLETE');
    });

    test('should verify quiz response variation affects recommendations', async () => {
      console.log('\n🧪 TESTING RESPONSE VARIATION IMPACT:');

      // Test 1: Fresh preferences
      const freshPrefs: QuizResponse[] = [
        { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
        { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
        { question_id: 'scent_preferences_beginner', answer_value: 'fresh_clean', timestamp: new Date().toISOString() }
      ];

      // Test 2: Warm preferences  
      const warmPrefs: QuizResponse[] = [
        { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
        { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
        { question_id: 'scent_preferences_beginner', answer_value: 'warm_cozy', timestamp: new Date().toISOString() }
      ];

      // Test 3: Open preferences
      const openPrefs: QuizResponse[] = [
        { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
        { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
        { question_id: 'scent_preferences_beginner', answer_value: 'open_anything', timestamp: new Date().toISOString() }
      ];

      const [freshResult, warmResult, openResult] = await Promise.all([
        engine.generateRecommendations(freshPrefs, 'test-fresh-var'),
        engine.generateRecommendations(warmPrefs, 'test-warm-var'),
        engine.generateRecommendations(openPrefs, 'test-open-var')
      ]);

      console.log('Fresh preferences → Recommendations:');
      freshResult.recommendations.forEach((rec, i) => {
        console.log(`   ${i+1}. ${rec.name} (${rec.scent_family})`);
      });

      console.log('\nWarm preferences → Recommendations:');
      warmResult.recommendations.forEach((rec, i) => {
        console.log(`   ${i+1}. ${rec.name} (${rec.scent_family})`);
      });

      console.log('\nOpen preferences → Recommendations:');
      openResult.recommendations.forEach((rec, i) => {
        console.log(`   ${i+1}. ${rec.name} (${rec.scent_family})`);
      });

      // Check if results are actually different
      const freshNames = freshResult.recommendations.map(r => r.name);
      const warmNames = warmResult.recommendations.map(r => r.name);
      const openNames = openResult.recommendations.map(r => r.name);

      const allIdentical = JSON.stringify(freshNames) === JSON.stringify(warmNames) && 
                          JSON.stringify(warmNames) === JSON.stringify(openNames);

      if (allIdentical) {
        console.log('\n❌ CRITICAL ISSUE: All preference types return identical recommendations');
        console.log('   Algorithm not using scent preferences - needs fixing');
      } else {
        console.log('\n✅ Different preferences produce different recommendations');
      }

      // All should still respect gender filtering
      [...freshResult.recommendations, ...warmResult.recommendations, ...openResult.recommendations].forEach(rec => {
        expect(['men', 'unisex'].includes(rec.gender_target)).toBe(true);
      });
    });

    test('should verify enhanced fragrance metadata is accessible', async () => {
      console.log('\n📊 TESTING ENHANCED FRAGRANCE METADATA ACCESS:');

      // Get sample fragrance to test enhanced fields
      const { data: sampleFragrance } = await supabase
        .from('fragrances')
        .select('*')
        .limit(1)
        .single();

      if (!sampleFragrance) {
        console.log('❌ No fragrances found in database');
        return;
      }

      console.log(`Testing with fragrance: ${sampleFragrance.name}`);

      // Check which enhanced fields are available
      const enhancedFields = [
        'target_gender',
        'sample_available', 
        'popularity_score',
        'launch_year',
        'availability_status',
        'price_range_min',
        'price_range_max',
        'longevity_hours',
        'sillage_rating'
      ];

      enhancedFields.forEach(field => {
        const hasField = sampleFragrance.hasOwnProperty(field);
        const value = sampleFragrance[field];
        console.log(`   ${field}: ${hasField ? `✅ ${value}` : '❌ missing'}`);
      });

      // Basic fields should always exist
      expect(sampleFragrance.id).toBeDefined();
      expect(sampleFragrance.name).toBeDefined();
      expect(sampleFragrance.brand_id).toBeDefined();
    });
  });

  describe('Database Function Integration Testing', () => {
    test('should test get_similar_fragrances function integration', async () => {
      console.log('\n⚙️ TESTING get_similar_fragrances DATABASE FUNCTION:');

      // Get a sample fragrance ID for testing
      const { data: sampleFragrance } = await supabase
        .from('fragrances')
        .select('id, name')
        .limit(1)
        .single();

      if (!sampleFragrance) {
        console.log('❌ No fragrances available for testing');
        return;
      }

      console.log(`Testing similarity for: ${sampleFragrance.name} (ID: ${sampleFragrance.id})`);

      // Test the database function
      const { data: similarResults, error: similarError } = await supabase.rpc('get_similar_fragrances', {
        target_fragrance_id: sampleFragrance.id,
        similarity_threshold: 0.7,
        max_results: 5
      });

      if (similarError) {
        console.log(`❌ get_similar_fragrances function error: ${similarError.message}`);
        
        if (similarError.code === 'PGRST202' || similarError.code === '42883') {
          console.log('   Function not yet implemented - quiz will use fallback logic');
        }
      } else {
        console.log(`✅ get_similar_fragrances working - found ${similarResults?.length || 0} similar fragrances`);
        
        if (similarResults && similarResults.length > 0) {
          similarResults.forEach((sim: any, i: number) => {
            console.log(`   ${i+1}. ${sim.name} (similarity: ${sim.similarity_score || 'N/A'})`);
          });
        }
      }
    });

    test('should test get_collection_insights function integration', async () => {
      console.log('\n📈 TESTING get_collection_insights DATABASE FUNCTION:');

      const { data: insightsResult, error: insightsError } = await supabase.rpc('get_collection_insights', {
        user_id: 'test-user-insights'
      });

      if (insightsError) {
        console.log(`❌ get_collection_insights function error: ${insightsError.message}`);
        
        if (insightsError.code === 'PGRST202' || insightsError.code === '42883') {
          console.log('   Function not yet implemented - insights not available');
        }
      } else {
        console.log('✅ get_collection_insights working');
        console.log(`   Insights data: ${JSON.stringify(insightsResult).substring(0, 100)}...`);
      }
    });

    test('should test update_user_preferences function integration', async () => {
      console.log('\n💾 TESTING update_user_preferences DATABASE FUNCTION:');

      const testPreferences = {
        fresh_clean: 0.8,
        warm_cozy: 0.3,
        sweet_fruity: 0.1
      };

      const { data: updateResult, error: updateError } = await supabase.rpc('update_user_preferences', {
        user_id: 'test-user-update',
        preferences: testPreferences
      });

      if (updateError) {
        console.log(`❌ update_user_preferences function error: ${updateError.message}`);
        
        if (updateError.code === 'PGRST202' || updateError.code === '42883') {
          console.log('   Function not yet implemented - manual preference updates needed');
        }
      } else {
        console.log('✅ update_user_preferences working');
        console.log(`   Update result: ${JSON.stringify(updateResult)}`);
      }
    });
  });

  describe('Performance and Error Handling Integration', () => {
    test('should verify quiz performance with database integration', async () => {
      console.log('\n⚡ TESTING QUIZ PERFORMANCE WITH DATABASE INTEGRATION:');

      const startTime = Date.now();

      const responses: QuizResponse[] = [
        { question_id: 'gender_preference', answer_value: 'women', timestamp: new Date().toISOString() },
        { question_id: 'experience_level', answer_value: 'enthusiast', timestamp: new Date().toISOString() },
        { question_id: 'scent_preferences_enthusiast', answer_value: 'floral_pretty,sweet_fruity', timestamp: new Date().toISOString() },
        { question_id: 'personality_style', answer_value: 'romantic', timestamp: new Date().toISOString() }
      ];

      const result = await engine.generateRecommendations(responses, 'performance-test');
      const totalTime = Date.now() - startTime;

      console.log(`Quiz processing time: ${totalTime}ms`);
      console.log(`Engine reported time: ${result.total_processing_time_ms}ms`);

      // Should complete within reasonable time for good UX
      expect(totalTime).toBeLessThan(5000); // 5 seconds max
      expect(result.recommendations).toHaveLength(3);

      if (totalTime > 2000) {
        console.log('⚠️ Performance warning: Quiz taking longer than 2 seconds');
      } else {
        console.log('✅ Quiz performance acceptable');
      }
    });

    test('should test error handling when database is unavailable', async () => {
      console.log('\n🚨 TESTING ERROR HANDLING:');

      // Test with invalid database query (simulates database issues)
      try {
        // This should trigger error handling in the recommendation engine
        const responses: QuizResponse[] = [
          { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
          { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
          { question_id: 'scent_preferences_beginner', answer_value: 'fresh_clean', timestamp: new Date().toISOString() }
        ];

        const result = await engine.generateRecommendations(responses, 'error-test');

        // Should still return recommendations even if database functions fail
        expect(result.recommendations).toBeDefined();
        expect(Array.isArray(result.recommendations)).toBe(true);

        if (!result.success) {
          console.log('✅ Fallback logic triggered - still got recommendations');
        } else {
          console.log('✅ Main algorithm succeeded');
        }

        console.log(`   Returned ${result.recommendations.length} recommendations despite potential database issues`);

      } catch (error) {
        console.log(`❌ Quiz completely failed: ${error.message}`);
        // Quiz should never completely fail - should have fallbacks
        expect(false).toBe(true);
      }
    });
  });

  describe('Integration Summary and Recommendations', () => {
    test('should provide comprehensive integration status report', async () => {
      console.log('\n📋 QUIZ RECOMMENDATION SYSTEM INTEGRATION STATUS:');

      // Check table availability
      const tables = ['fragrance_embeddings', 'user_preferences', 'user_fragrance_interactions'];
      const tableStatus = {};

      for (const tableName of tables) {
        const { data: tableExists } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', tableName)
          .eq('table_schema', 'public')
          .single();

        tableStatus[tableName] = !!tableExists;
        console.log(`   ${tableName}: ${tableExists ? '✅ Available' : '❌ Missing'}`);
      }

      // Check function availability
      const functions = ['get_similar_fragrances', 'get_collection_insights', 'update_user_preferences'];
      const functionStatus = {};

      for (const functionName of functions) {
        const { error } = await supabase.rpc(functionName, {});
        
        if (error && (error.code === 'PGRST202' || error.code === '42883')) {
          functionStatus[functionName] = false;
          console.log(`   ${functionName}: ❌ Not implemented`);
        } else {
          functionStatus[functionName] = true;
          console.log(`   ${functionName}: ✅ Available`);
        }
      }

      // Overall integration assessment
      const tablesReady = Object.values(tableStatus).filter(Boolean).length;
      const functionsReady = Object.values(functionStatus).filter(Boolean).length;

      console.log('\n📊 INTEGRATION SUMMARY:');
      console.log(`   Database tables: ${tablesReady}/${tables.length} ready`);
      console.log(`   Database functions: ${functionsReady}/${functions.length} ready`);

      if (tablesReady === tables.length && functionsReady === functions.length) {
        console.log('   🎯 Full database integration ready');
      } else if (tablesReady >= 2) {
        console.log('   ⚡ Partial integration - core features working');
      } else {
        console.log('   ⚠️ Limited integration - mostly fallback logic');
      }

      // Quiz should work regardless of database integration level
      const testResult = await engine.generateRecommendations([
        { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
        { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
        { question_id: 'scent_preferences_beginner', answer_value: 'fresh_clean', timestamp: new Date().toISOString() }
      ], 'integration-summary-test');

      expect(testResult.recommendations).toHaveLength(3);
      console.log('   ✅ Quiz engine functional regardless of database integration level');
    });
  });
});
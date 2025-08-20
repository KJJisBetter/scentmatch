import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Data Migration Verification (Simplified)', () => {
  
  describe('Database Tables and Structure', () => {
    it('should have fragrances table with AI enhancement columns', async () => {
      const { data: fragrances, error } = await supabase
        .from('fragrances')
        .select('id, name, embedding, embedding_model, embedding_generated_at, content_hash')
        .limit(1);

      expect(error).toBeNull();
      expect(fragrances).toBeDefined();
      
      if (fragrances && fragrances.length > 0) {
        const fragrance = fragrances[0];
        expect(fragrance).toHaveProperty('embedding');
        expect(fragrance).toHaveProperty('embedding_model');
        expect(fragrance).toHaveProperty('embedding_generated_at');
        expect(fragrance).toHaveProperty('content_hash');
      }
    });

    it('should have user_preferences table', async () => {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('id, user_id, user_embedding, preference_strength')
        .limit(1);

      expect(error).toBeNull();
      expect(Array.isArray(preferences)).toBe(true);
    });

    it('should have user_interactions table', async () => {
      const { data: interactions, error } = await supabase
        .from('user_interactions')
        .select('id, user_id, fragrance_id, interaction_type, interaction_value')
        .limit(1);

      expect(error).toBeNull();
      expect(Array.isArray(interactions)).toBe(true);
    });

    it('should have ai_processing_queue table', async () => {
      const { data: queue, error } = await supabase
        .from('ai_processing_queue')
        .select('id, task_type, status, priority')
        .limit(1);

      expect(error).toBeNull();
      expect(Array.isArray(queue)).toBe(true);
    });

    it('should have recommendation_cache table', async () => {
      const { data: cache, error } = await supabase
        .from('recommendation_cache')
        .select('id, user_id, recommendation_type, recommendations')
        .limit(1);

      expect(error).toBeNull();
      expect(Array.isArray(cache)).toBe(true);
    });

    it('should have collection_analysis_cache table', async () => {
      const { data: cache, error } = await supabase
        .from('collection_analysis_cache')
        .select('id, user_id, analysis_type, analysis_data')
        .limit(1);

      expect(error).toBeNull();
      expect(Array.isArray(cache)).toBe(true);
    });
  });

  describe('Embedding Data Quality', () => {
    it('should have high embedding coverage for fragrances', async () => {
      const { data: fragrances, error } = await supabase
        .from('fragrances')
        .select('id, embedding')
        .limit(100);

      expect(error).toBeNull();
      expect(fragrances).toBeDefined();
      
      if (fragrances && fragrances.length > 0) {
        const withEmbeddings = fragrances.filter(f => f.embedding !== null);
        const coverage = withEmbeddings.length / fragrances.length;
        
        expect(coverage).toBeGreaterThan(0.9); // Expect >90% coverage
        console.log(`Embedding coverage: ${(coverage * 100).toFixed(1)}% (${withEmbeddings.length}/${fragrances.length})`);
      }
    });

    it('should have consistent embedding dimensions', async () => {
      const { data: fragrances, error } = await supabase
        .from('fragrances')
        .select('id, embedding, embedding_model')
        .not('embedding', 'is', null)
        .limit(5);

      expect(error).toBeNull();
      
      if (fragrances && fragrances.length > 0) {
        for (const fragrance of fragrances) {
          if (fragrance.embedding) {
            const embeddingArray = JSON.parse(fragrance.embedding as any);
            expect(Array.isArray(embeddingArray)).toBe(true);
            expect(embeddingArray.length).toBe(2000); // voyage-3-large uses 2000 dimensions
            expect(fragrance.embedding_model).toBe('voyage-3-large');
            
            // Validate embedding values are numbers in reasonable range
            expect(embeddingArray.every((v: number) => typeof v === 'number')).toBe(true);
            expect(embeddingArray.every((v: number) => v >= -1 && v <= 1)).toBe(true);
          }
        }
      }
    });

    it('should have functional vector similarity search', async () => {
      // Get a sample embedding
      const { data: sampleFragrance, error: fragranceError } = await supabase
        .from('fragrances')
        .select('id, embedding')
        .not('embedding', 'is', null)
        .limit(1)
        .single();

      expect(fragranceError).toBeNull();
      expect(sampleFragrance?.embedding).toBeDefined();

      // Test similarity search function
      const { data: similarFragrances, error: searchError } = await supabase.rpc('find_similar_fragrances', {
        query_embedding: sampleFragrance!.embedding as any,
        similarity_threshold: 0.5,
        max_results: 5,
        exclude_ids: [sampleFragrance!.id]
      });

      expect(searchError).toBeNull();
      expect(Array.isArray(similarFragrances)).toBe(true);
      
      if (similarFragrances && similarFragrances.length > 0) {
        // Check similarity scores are valid
        for (const result of similarFragrances) {
          expect(result.similarity).toBeGreaterThanOrEqual(0);
          expect(result.similarity).toBeLessThanOrEqual(1);
          expect(result.fragrance_id).toBeDefined();
          expect(result.name).toBeDefined();
        }
      }
    });
  });

  describe('User Preference Models', () => {
    it('should validate user preference model structure', async () => {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('*')
        .not('user_embedding', 'is', null)
        .limit(5);

      expect(error).toBeNull();
      
      if (preferences && preferences.length > 0) {
        for (const pref of preferences) {
          expect(pref.user_id).toBeDefined();
          expect(pref.user_embedding).toBeDefined();
          expect(pref.preference_strength).toBeGreaterThanOrEqual(0);
          expect(pref.preference_strength).toBeLessThanOrEqual(1);
          expect(pref.embedding_model).toBe('voyage-3-large');
          
          // Validate user embedding format
          if (pref.user_embedding) {
            const embedding = JSON.parse(pref.user_embedding as any);
            expect(Array.isArray(embedding)).toBe(true);
            expect(embedding.length).toBe(2000); // voyage-3-large dimensions
            expect(embedding.every((v: number) => typeof v === 'number')).toBe(true);
          }
        }
      }
    });

    it('should have reasonable user preference distribution', async () => {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('preference_strength, interaction_count')
        .not('user_embedding', 'is', null);

      expect(error).toBeNull();
      
      if (preferences && preferences.length > 0) {
        const avgStrength = preferences.reduce((sum, p) => sum + (p.preference_strength || 0), 0) / preferences.length;
        const avgInteractions = preferences.reduce((sum, p) => sum + (p.interaction_count || 0), 0) / preferences.length;
        
        expect(avgStrength).toBeGreaterThan(0.1);
        expect(avgStrength).toBeLessThan(1.0);
        expect(avgInteractions).toBeGreaterThan(0);
        
        console.log(`User preference stats: avg strength ${avgStrength.toFixed(3)}, avg interactions ${avgInteractions.toFixed(1)}`);
      }
    });

    it('should be able to update user embeddings from interactions', async () => {
      // Test the update_user_embedding function
      const { data: userWithInteractions, error: userError } = await supabase
        .from('user_interactions')
        .select('user_id')
        .neq('user_id', 'anonymous')
        .limit(1)
        .single();

      if (userError || !userWithInteractions) {
        console.log('No users with interactions found, skipping test');
        return;
      }

      const { data: updateResult, error: updateError } = await supabase.rpc('update_user_embedding', {
        target_user_id: userWithInteractions.user_id
      });

      expect(updateError).toBeNull();
      expect(typeof updateResult).toBe('boolean');
    });
  });

  describe('AI System Health', () => {
    it('should validate ai_system_health view', async () => {
      const { data: healthData, error } = await supabase
        .from('ai_system_health')
        .select('*');

      expect(error).toBeNull();
      expect(Array.isArray(healthData)).toBe(true);
      
      if (healthData && healthData.length > 0) {
        const metrics = healthData.reduce((acc, item) => {
          acc[item.metric] = item.value;
          return acc;
        }, {} as Record<string, number>);

        // Check key metrics exist
        expect(metrics).toHaveProperty('embedding_coverage');
        expect(metrics).toHaveProperty('pending_tasks');
        expect(metrics).toHaveProperty('user_preferences_count');
        
        // Validate embedding coverage is high
        if (metrics.embedding_coverage !== undefined) {
          expect(metrics.embedding_coverage).toBeGreaterThan(0.8);
        }
        
        console.log('System health metrics:', metrics);
      }
    });

    it('should validate fragrance_vectors view', async () => {
      const { data: vectors, error } = await supabase
        .from('fragrance_vectors')
        .select('*')
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(vectors)).toBe(true);
      
      if (vectors && vectors.length > 0) {
        for (const vector of vectors) {
          expect(vector).toHaveProperty('id');
          expect(vector).toHaveProperty('name');
          expect(vector).toHaveProperty('embedding');
          expect(vector).toHaveProperty('embedding_status');
          
          expect(['current', 'stale', 'missing']).toContain(vector.embedding_status);
        }
      }
    });

    it('should have functional database cleanup', async () => {
      const { data: deletedCount, error } = await supabase.rpc('cleanup_expired_cache');

      expect(error).toBeNull();
      expect(typeof deletedCount).toBe('number');
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Integrity and Consistency', () => {
    it('should have consistent interaction data types', async () => {
      const { data: interactions, error } = await supabase
        .from('user_interactions')
        .select('interaction_type, interaction_value')
        .limit(100);

      expect(error).toBeNull();
      
      if (interactions && interactions.length > 0) {
        const validTypes = ['view', 'rating', 'favorite', 'search', 'purchase_intent', 'collection_add', 'collection_remove'];
        
        for (const interaction of interactions) {
          expect(validTypes).toContain(interaction.interaction_type);
          
          if (interaction.interaction_value !== null) {
            expect(typeof interaction.interaction_value).toBe('number');
          }
        }
      }
    });

    it('should have valid user preference constraints', async () => {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('preference_strength, interaction_count')
        .limit(50);

      expect(error).toBeNull();
      
      if (preferences && preferences.length > 0) {
        for (const pref of preferences) {
          if (pref.preference_strength !== null) {
            expect(pref.preference_strength).toBeGreaterThanOrEqual(0);
            expect(pref.preference_strength).toBeLessThanOrEqual(1);
          }
          
          if (pref.interaction_count !== null) {
            expect(pref.interaction_count).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    it('should have reasonable cache data structure', async () => {
      const { data: recCache, error: recError } = await supabase
        .from('recommendation_cache')
        .select('user_id, recommendation_type, recommendations, confidence_score')
        .limit(10);

      expect(recError).toBeNull();
      
      if (recCache && recCache.length > 0) {
        for (const cache of recCache) {
          expect(cache.user_id).toBeDefined();
          expect(['personalized', 'trending', 'seasonal', 'adventurous', 'similar', 'gap_filling']).toContain(cache.recommendation_type);
          
          if (cache.recommendations) {
            const recs = Array.isArray(cache.recommendations) ? cache.recommendations : JSON.parse(cache.recommendations as any);
            expect(Array.isArray(recs)).toBe(true);
          }
          
          if (cache.confidence_score !== null) {
            expect(cache.confidence_score).toBeGreaterThanOrEqual(0);
            expect(cache.confidence_score).toBeLessThanOrEqual(1);
          }
        }
      }

      const { data: analysisCache, error: analysisError } = await supabase
        .from('collection_analysis_cache')
        .select('user_id, analysis_type, analysis_data, confidence_score')
        .limit(10);

      expect(analysisError).toBeNull();
      
      if (analysisCache && analysisCache.length > 0) {
        for (const cache of analysisCache) {
          expect(cache.user_id).toBeDefined();
          expect(['scent_family', 'seasonal', 'gaps', 'insights', 'personality', 'optimization']).toContain(cache.analysis_type);
          expect(cache.analysis_data).toBeDefined();
          
          if (cache.confidence_score !== null) {
            expect(cache.confidence_score).toBeGreaterThanOrEqual(0);
            expect(cache.confidence_score).toBeLessThanOrEqual(1);
          }
        }
      }
    });
  });

  describe('AI Function Validation', () => {
    it('should validate generate_content_hash function', async () => {
      const { data: hash, error } = await supabase.rpc('generate_content_hash', {
        fragrance_name: 'Test Fragrance',
        brand_name: 'Test Brand',
        description: 'Test description',
        notes: ['rose', 'vanilla']
      });

      expect(error).toBeNull();
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toHaveLength(64); // SHA256 hex
    });

    it('should validate find_similar_fragrances function', async () => {
      // Get a real embedding first
      const { data: sampleFragrance, error: fragranceError } = await supabase
        .from('fragrances')
        .select('id, embedding')
        .not('embedding', 'is', null)
        .limit(1)
        .single();

      expect(fragranceError).toBeNull();
      expect(sampleFragrance?.embedding).toBeDefined();

      if (sampleFragrance?.embedding) {
        const { data: similarFragrances, error: searchError } = await supabase.rpc('find_similar_fragrances', {
          query_embedding: sampleFragrance.embedding as any,
          similarity_threshold: 0.3,
          max_results: 5,
          exclude_ids: [sampleFragrance.id]
        });

        expect(searchError).toBeNull();
        expect(Array.isArray(similarFragrances)).toBe(true);
        
        if (similarFragrances && similarFragrances.length > 0) {
          for (const result of similarFragrances) {
            expect(result).toHaveProperty('fragrance_id');
            expect(result).toHaveProperty('similarity');
            expect(result).toHaveProperty('name');
            expect(result.similarity).toBeGreaterThanOrEqual(0);
            expect(result.similarity).toBeLessThanOrEqual(1);
          }
        }
      }
    });

    it('should validate cleanup_expired_cache function', async () => {
      const { data: deletedCount, error } = await supabase.rpc('cleanup_expired_cache');

      expect(error).toBeNull();
      expect(typeof deletedCount).toBe('number');
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('System Performance Validation', () => {
    it('should perform vector search within reasonable time', async () => {
      const { data: sampleFragrance, error: fragranceError } = await supabase
        .from('fragrances')
        .select('embedding')
        .not('embedding', 'is', null)
        .limit(1)
        .single();

      if (fragranceError || !sampleFragrance?.embedding) {
        console.log('No sample embedding available, skipping performance test');
        return;
      }

      const startTime = Date.now();
      
      const { data: results, error: searchError } = await supabase.rpc('find_similar_fragrances', {
        query_embedding: sampleFragrance.embedding as any,
        similarity_threshold: 0.5,
        max_results: 10
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(searchError).toBeNull();
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      
      console.log(`Vector search performance: ${duration}ms for ${results?.length || 0} results`);
    });

    it('should validate database query performance', async () => {
      const startTime = Date.now();
      
      const { data: fragrances, error } = await supabase
        .from('fragrances')
        .select('id, name, brand_name, embedding, scent_family')
        .not('embedding', 'is', null)
        .limit(50);

      const duration = Date.now() - startTime;

      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(fragrances?.length).toBeGreaterThan(0);
      
      console.log(`Database query performance: ${duration}ms for ${fragrances?.length || 0} records`);
    });
  });

  describe('Migration Completeness', () => {
    it('should have migration completion records', async () => {
      const { data: migrationRecords, error } = await supabase
        .from('ai_processing_queue')
        .select('*')
        .eq('task_type', 'migration_complete')
        .order('created_at', { ascending: false })
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(migrationRecords)).toBe(true);
      
      if (migrationRecords && migrationRecords.length > 0) {
        const latestMigration = migrationRecords[0];
        expect(latestMigration.task_data).toHaveProperty('migration');
        expect(latestMigration.task_data).toHaveProperty('completion_time');
        expect(latestMigration.status).toBe('completed');
        
        console.log(`Latest migration: ${latestMigration.task_data.migration} at ${latestMigration.task_data.completion_time}`);
      }
    });

    it('should validate overall system readiness', async () => {
      // Check that we have the minimum data needed for AI features
      const checks = await Promise.all([
        supabase.from('fragrances').select('id', { count: 'exact', head: true }).not('embedding', 'is', null),
        supabase.from('user_preferences').select('id', { count: 'exact', head: true }),
        supabase.from('user_interactions').select('id', { count: 'exact', head: true }),
        supabase.from('ai_processing_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      const [fragrancesResult, preferencesResult, interactionsResult, queueResult] = checks;

      expect(fragrancesResult.error).toBeNull();
      expect(preferencesResult.error).toBeNull();
      expect(interactionsResult.error).toBeNull();
      expect(queueResult.error).toBeNull();

      const systemReadiness = {
        fragrances_with_embeddings: fragrancesResult.count || 0,
        user_preference_models: preferencesResult.count || 0,
        user_interactions: interactionsResult.count || 0,
        pending_ai_tasks: queueResult.count || 0
      };

      // Validate minimum thresholds for production readiness
      expect(systemReadiness.fragrances_with_embeddings).toBeGreaterThan(100);
      expect(systemReadiness.user_interactions).toBeGreaterThanOrEqual(0);
      expect(systemReadiness.pending_ai_tasks).toBeLessThan(1000); // Not too many pending tasks

      console.log('System readiness:', systemReadiness);
      console.log(`✅ AI system appears ready for production use`);
    });
  });

  describe('Integration with Existing APIs', () => {
    it('should validate that existing fragrance API still works', async () => {
      const { data: fragrances, error } = await supabase
        .from('fragrances')
        .select('id, name, brand_name, scent_family, rating_value, embedding')
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(fragrances)).toBe(true);
      
      if (fragrances && fragrances.length > 0) {
        for (const fragrance of fragrances) {
          expect(fragrance.id).toBeDefined();
          expect(fragrance.name).toBeDefined();
          // Embedding should be present for most fragrances now
          if (fragrance.embedding) {
            const embedding = JSON.parse(fragrance.embedding as any);
            expect(Array.isArray(embedding)).toBe(true);
          }
        }
      }
    });

    it('should validate user-specific AI features work', async () => {
      // Test that we can get user preferences and use them
      const { data: userPrefs, error } = await supabase
        .from('user_preferences')
        .select('user_id, user_embedding')
        .not('user_embedding', 'is', null)
        .limit(1)
        .single();

      if (error || !userPrefs) {
        console.log('No user preferences found, skipping user-specific test');
        return;
      }

      // Test that we can use user embedding for recommendations
      const { data: recommendations, error: recError } = await supabase.rpc('find_similar_fragrances', {
        query_embedding: userPrefs.user_embedding as any,
        similarity_threshold: 0.2,
        max_results: 5
      });

      expect(recError).toBeNull();
      expect(Array.isArray(recommendations)).toBe(true);
      
      console.log(`User ${userPrefs.user_id} can get ${recommendations?.length || 0} personalized recommendations`);
    });
  });
});

// Helper functions for manual verification
export const runSystemHealthCheck = async () => {
  console.log('🏥 Running AI System Health Check...\n');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check embedding coverage
    const { data: fragrances, error: fragranceError } = await supabase
      .from('fragrances')
      .select('id, embedding')
      .limit(1000);

    if (!fragranceError && fragrances) {
      const withEmbeddings = fragrances.filter(f => f.embedding !== null).length;
      const coverage = withEmbeddings / fragrances.length;
      console.log(`🔍 Embedding Coverage: ${(coverage * 100).toFixed(1)}% (${withEmbeddings}/${fragrances.length})`);
    }

    // Check user preference models
    const { count: userPrefsCount, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*', { count: 'exact', head: true });

    if (!prefsError) {
      console.log(`👤 User Preference Models: ${userPrefsCount || 0}`);
    }

    // Check interaction data
    const { count: interactionsCount, error: interactionsError } = await supabase
      .from('user_interactions')
      .select('*', { count: 'exact', head: true });

    if (!interactionsError) {
      console.log(`🔄 User Interactions: ${interactionsCount || 0}`);
    }

    // Check AI processing queue
    const { count: pendingTasks, error: queueError } = await supabase
      .from('ai_processing_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (!queueError) {
      console.log(`⏳ Pending AI Tasks: ${pendingTasks || 0}`);
    }

    // Test vector search performance
    console.log('\n⚡ Testing Performance...');
    
    const { data: sampleFragrance, error: sampleError } = await supabase
      .from('fragrances')
      .select('embedding')
      .not('embedding', 'is', null)
      .limit(1)
      .single();

    if (!sampleError && sampleFragrance?.embedding) {
      const startTime = Date.now();
      
      const { data: similar, error: searchError } = await supabase.rpc('find_similar_fragrances', {
        query_embedding: sampleFragrance.embedding as any,
        similarity_threshold: 0.5,
        max_results: 10
      });

      const searchTime = Date.now() - startTime;
      
      if (!searchError) {
        console.log(`🔍 Vector Search: ${searchTime}ms for ${similar?.length || 0} results`);
      }
    }

    console.log('\n✅ Health check completed');
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
};

// Export for CLI usage
if (require.main === module) {
  runSystemHealthCheck();
}
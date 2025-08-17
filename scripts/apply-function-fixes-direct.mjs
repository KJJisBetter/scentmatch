import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyFunctionFixes() {
  try {
    console.log('🔄 Applying database function fixes...')
    
    // Test current function first
    console.log('📋 Testing current get_profile_recommendations function...')
    const { data, error } = await supabase.rpc('get_profile_recommendations', {
      user_profile_vector: Array(256).fill(0.1),
      trait_weights: { sophisticated: 0.5 },
      limit_count: 5
    })
    
    if (error) {
      console.log('⚠️  Function error (as expected):', error.message)
    } else {
      console.log('✅ Function works correctly')
    }
    
    // Fix 1: Apply new get_profile_recommendations function
    console.log('📋 Updating get_profile_recommendations function...')
    const updateFunc1 = `
      CREATE OR REPLACE FUNCTION get_profile_recommendations(
        user_profile_vector vector(256),
        trait_weights JSONB,
        limit_count INTEGER DEFAULT 15
      ) RETURNS TABLE (
        fragrance_id TEXT,
        name TEXT,
        brand_name TEXT,
        similarity_score REAL,
        personality_boost REAL,
        final_score REAL
      ) AS $$
      BEGIN
        RETURN QUERY
        WITH scored_fragrances AS (
          SELECT
            f.id,
            f.name,
            f.brand_name,
            GREATEST(0, 1 - (f.metadata_vector <=> user_profile_vector)) AS base_similarity,
            CASE
              WHEN f.personality_tags IS NOT NULL 
                   AND f.personality_tags && ARRAY(SELECT jsonb_object_keys(trait_weights))
              THEN 0.15
              ELSE 0.0
            END AS trait_bonus,
            0.0 AS purchase_boost
          FROM fragrances f
          WHERE
            f.metadata_vector IS NOT NULL
            AND GREATEST(0, 1 - (f.metadata_vector <=> user_profile_vector)) > 0.6
        )
        SELECT
          sf.id,
          sf.name,
          sf.brand_name,
          sf.base_similarity,
          sf.trait_bonus,
          (sf.base_similarity + sf.trait_bonus + sf.purchase_boost) AS final_score
        FROM scored_fragrances sf
        ORDER BY final_score DESC
        LIMIT limit_count;
      END;
      $$ LANGUAGE plpgsql;
    `
    
    // Note: We can't execute DDL directly through rpc, but we can test the function
    console.log('⚠️  Cannot update functions directly through API. Functions need to be updated through migrations.')
    console.log('✅ Function fix script prepared')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

applyFunctionFixes()
/**
 * Add Missing Schema Elements
 * Adds specific missing database elements for integration fixes
 */

import { createServiceSupabase } from '@/lib/supabase';

async function addMissingSchemaElements() {
  console.log('🔧 Adding missing database schema elements...\n');
  
  const supabase = createServiceSupabase();
  
  try {
    // Step 1: Add missing columns to fragrances table
    console.log('🔄 Adding enhanced columns to fragrances table...');
    
    // We'll add columns one by one to handle any that might already exist
    const columnsToAdd = [
      { name: 'target_gender', type: 'TEXT' },
      { name: 'sample_available', type: 'BOOLEAN DEFAULT false' },
      { name: 'popularity_score', type: 'DECIMAL(8,4) DEFAULT 0' },
      { name: 'launch_year', type: 'INTEGER' },
      { name: 'availability_status', type: 'TEXT DEFAULT \'available\'' },
      { name: 'price_range_min', type: 'DECIMAL(8,2)' },
      { name: 'price_range_max', type: 'DECIMAL(8,2)' },
      { name: 'longevity_hours', type: 'INTEGER' },
      { name: 'sillage_rating', type: 'INTEGER CHECK (sillage_rating >= 1 AND sillage_rating <= 5)' }
    ];

    for (const column of columnsToAdd) {
      try {
        // Test if column exists by trying to select it
        const { error: testError } = await supabase
          .from('fragrances')
          .select(column.name)
          .limit(1);

        if (testError && testError.message.includes('does not exist')) {
          console.log(`   Adding column: ${column.name} (${column.type})`);
          
          // Column doesn't exist, we need to add it
          // Since we can't execute DDL directly, we'll document what needs to be done
          console.log(`   ⚠️  Column ${column.name} needs to be added manually`);
        } else {
          console.log(`   ✅ Column ${column.name} already exists`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking column ${column.name}: ${error.message}`);
      }
    }

    // Step 2: Check user_preferences table
    console.log('\n👤 Checking user_preferences table...');
    
    const { data: preferencesTest, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('id')
      .limit(1);

    if (preferencesError && preferencesError.message.includes('does not exist')) {
      console.log('   ⚠️  user_preferences table needs to be created');
      console.log('   📋 Required structure:');
      console.log('      - id (PRIMARY KEY)');
      console.log('      - user_id (UUID REFERENCES auth.users)');
      console.log('      - quiz_session_id (TEXT)');
      console.log('      - scent_preferences (JSONB)');
      console.log('      - personality_style (TEXT)');
      console.log('      - occasion_preferences (TEXT[])');
      console.log('      - gender_preference (TEXT)');
      console.log('      - experience_level (TEXT)');
      console.log('      - created_at, updated_at (TIMESTAMP)');
    } else {
      console.log('   ✅ user_preferences table exists');
    }

    // Step 3: Verify other enhanced tables
    console.log('\n🗃️ Verifying enhanced tables...');
    
    const { data: embeddingsTest, error: embeddingsError } = await supabase
      .from('fragrance_embeddings')
      .select('id, fragrance_id, embedding')
      .limit(1);

    if (embeddingsError) {
      console.log(`   ❌ fragrance_embeddings: ${embeddingsError.message}`);
    } else {
      console.log('   ✅ fragrance_embeddings table verified');
    }

    const { data: interactionsTest, error: interactionsError } = await supabase
      .from('user_fragrance_interactions')
      .select('id, user_id, fragrance_id, interaction_type')
      .limit(1);

    if (interactionsError) {
      console.log(`   ❌ user_fragrance_interactions: ${interactionsError.message}`);
    } else {
      console.log('   ✅ user_fragrance_interactions table verified');
    }

    // Step 4: Check for database functions
    console.log('\n⚙️ Testing database functions...');
    
    // Test get_similar_fragrances function
    try {
      const { data: similarTest, error: similarError } = await supabase.rpc('get_similar_fragrances', {
        target_fragrance_id: 1,
        similarity_threshold: 0.8,
        max_results: 5
      });

      if (similarError) {
        console.log(`   ❌ get_similar_fragrances: ${similarError.message}`);
      } else {
        console.log('   ✅ get_similar_fragrances function working');
      }
    } catch (error) {
      console.log(`   ❌ get_similar_fragrances: Function test failed`);
    }

    // Test get_collection_insights function
    try {
      const { data: insightsTest, error: insightsError } = await supabase.rpc('get_collection_insights', {
        user_id: 'test-user-id'
      });

      if (insightsError) {
        console.log(`   ❌ get_collection_insights: ${insightsError.message}`);
      } else {
        console.log('   ✅ get_collection_insights function working');
      }
    } catch (error) {
      console.log(`   ❌ get_collection_insights: Function test failed`);
    }

    // Step 5: Data count summary
    console.log('\n📊 Data Summary:');
    
    const { count: fragranceCount } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true });

    const { count: brandCount } = await supabase
      .from('fragrance_brands')
      .select('*', { count: 'exact', head: true });

    console.log(`   📦 ${fragranceCount} fragrances in database`);
    console.log(`   🏢 ${brandCount} brands in database`);

    // Step 6: Recommendations for next steps
    console.log('\n💡 Integration Status & Next Steps:');
    
    if (embeddingsError || preferencesError || enhancedError) {
      console.log('❌ Schema incomplete - migrations needed:');
      if (preferencesError) console.log('   • Create user_preferences table');
      if (enhancedError) console.log('   • Add enhanced columns to fragrances table');
      console.log('   • Apply database migrations to complete schema');
      console.log('   • Then proceed with API endpoint integration');
    } else {
      console.log('✅ Schema appears complete - ready for API integration');
      console.log('   • Test API endpoints with new schema');
      console.log('   • Update quiz recommendation system');
      console.log('   • Fix browse page integration');
    }

    return true;

  } catch (error) {
    console.error('💥 Database state check failed:', error.message);
    return false;
  }
}

// Run the analysis
addMissingSchemaElements();
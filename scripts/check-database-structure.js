/**
 * Check Current Database Structure
 * Quick script to see what actually exists in the database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('🔍 Checking actual database structure...\n');

  // Check fragrances table
  console.log('📋 Fragrances table:');
  const { data: fragrances, error: fragranceError } = await supabase
    .from('fragrances')
    .select('*')
    .limit(1);

  if (fragranceError) {
    console.log(`   ❌ Error: ${fragranceError.message}`);
  } else if (fragrances?.[0]) {
    console.log('   ✅ Available columns:');
    Object.keys(fragrances[0]).forEach(col => {
      console.log(`      - ${col}: ${typeof fragrances[0][col]} (${fragrances[0][col] === null ? 'NULL' : 'has data'})`);
    });
  }

  // Check brands table  
  console.log('\n📋 Fragrance brands table:');
  const { data: brands, error: brandError } = await supabase
    .from('fragrance_brands')
    .select('*')
    .limit(1);

  if (brandError) {
    console.log(`   ❌ Error: ${brandError.message}`);
  } else if (brands?.[0]) {
    console.log('   ✅ Available columns:');
    Object.keys(brands[0]).forEach(col => {
      console.log(`      - ${col}: ${typeof brands[0][col]}`);
    });
  }

  // Check AI tables
  console.log('\n🤖 AI Infrastructure:');
  
  const aiTables = [
    'ai_processing_queue',
    'user_preferences', 
    'user_interactions',
    'collection_analysis_cache',
    'recommendation_cache'
  ];

  for (const tableName of aiTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`   ❌ ${tableName}: ${error.message}`);
    } else {
      console.log(`   ✅ ${tableName}: accessible`);
      if (data?.[0]) {
        console.log(`      Columns: ${Object.keys(data[0]).join(', ')}`);
      }
    }
  }

  // Test functions
  console.log('\n🔧 Testing AI functions:');
  
  const { data: similarityData, error: similarityError } = await supabase
    .rpc('find_similar_fragrances', {
      query_embedding: '[' + Array.from({length: 2000}, () => 0.1).join(',') + ']',
      max_results: 1
    });
    
  if (similarityError) {
    console.log(`   ❌ find_similar_fragrances: ${similarityError.message}`);
  } else {
    console.log('   ✅ find_similar_fragrances: works');
  }

  const { data: cleanupData, error: cleanupError } = await supabase
    .rpc('cleanup_expired_cache');
    
  if (cleanupError) {
    console.log(`   ❌ cleanup_expired_cache: ${cleanupError.message}`);
  } else {
    console.log(`   ✅ cleanup_expired_cache: works (cleaned ${cleanupData} records)`);
  }

  console.log('\n🎯 Database structure check complete!');
}

checkDatabaseStructure().catch(console.error);
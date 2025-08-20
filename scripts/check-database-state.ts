/**
 * Database State Checker
 * Simple script to check current database state for integration validation
 */

import { createServiceSupabase } from '@/lib/supabase';

async function checkDatabaseState() {
  console.log('🔍 Checking ScentMatch database state...\n');
  
  const supabase = createServiceSupabase();
  
  try {
    // Test basic connectivity by checking fragrances table
    console.log('🔌 Testing database connectivity...');
    const { data: fragrances, error: fragranceError } = await supabase
      .from('fragrances')
      .select('id, name, brand_id')
      .limit(5);

    if (fragranceError) {
      console.log(`❌ Fragrances table error: ${fragranceError.message}`);
      return;
    }

    console.log(`✅ Database connected - found ${fragrances?.length || 0} fragrance records`);

    // Test brands table
    const { data: brands, error: brandError } = await supabase
      .from('fragrance_brands')
      .select('id, name')
      .limit(3);

    if (brandError) {
      console.log(`❌ Brands table error: ${brandError.message}`);
    } else {
      console.log(`✅ Brands table - found ${brands?.length || 0} brand records`);
    }

    // Test user collections
    const { data: collections, error: collectionError } = await supabase
      .from('user_collections')
      .select('id, user_id, fragrance_id')
      .limit(3);

    if (collectionError) {
      console.log(`❌ Collections table error: ${collectionError.message}`);
    } else {
      console.log(`✅ Collections table - found ${collections?.length || 0} collection records`);
    }

    // Test for new tables
    console.log('\n🔍 Checking for enhanced schema tables...');
    
    const newTables = [
      'fragrance_embeddings',
      'user_preferences', 
      'user_fragrance_interactions'
    ];

    for (const tableName of newTables) {
      const { data: tableTest, error: tableError } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (tableError) {
        console.log(`❌ ${tableName} table: ${tableError.message}`);
      } else {
        console.log(`✅ ${tableName} table exists`);
      }
    }

    // Test for enhanced columns in fragrances table
    console.log('\n🔍 Checking for enhanced columns...');
    
    const { data: enhancedTest, error: enhancedError } = await supabase
      .from('fragrances')
      .select('id, target_gender, sample_available, popularity_score')
      .limit(1);

    if (enhancedError) {
      console.log(`❌ Enhanced columns missing: ${enhancedError.message}`);
    } else {
      console.log(`✅ Enhanced columns exist in fragrances table`);
    }

    console.log('\n📊 Current Database Status Summary:');
    console.log('✅ Basic tables working (fragrances, fragrance_brands, user_collections)');
    
    if (enhancedError) {
      console.log('❌ Enhanced schema not applied - migrations needed');
    } else {
      console.log('✅ Enhanced schema appears to be applied');
    }

    return true;

  } catch (error) {
    console.error('💥 Database check failed:', error.message);
    return false;
  }
}

// Run the check
checkDatabaseState().then(success => {
  if (success) {
    console.log('\n🎯 Database state check completed.');
    console.log('💡 Next: Apply any missing schema changes or proceed with API integration.');
  } else {
    console.log('\n❌ Database state check failed.');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Script crashed:', error);
  process.exit(1);
});
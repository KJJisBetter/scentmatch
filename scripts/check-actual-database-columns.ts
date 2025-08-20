/**
 * Check Actual Database Columns
 * See what columns actually exist in the current database
 */

import { createServiceSupabase } from '@/lib/supabase';

async function checkActualColumns() {
  const supabase = createServiceSupabase();
  
  try {
    console.log('🔍 Checking actual database columns...\n');
    
    // Check fragrances table columns
    const { data: fragranceColumns, error: fragranceError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'fragrances')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (fragranceError) {
      console.error('❌ Cannot check fragrances columns:', fragranceError.message);
      return;
    }

    console.log('📋 fragrances table columns:');
    fragranceColumns?.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type})`);
    });

    // Test a simple query to fragrances table
    console.log('\n🧪 Testing basic fragrances query...');
    
    const { data: sampleFragrances, error: sampleError } = await supabase
      .from('fragrances')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Basic fragrances query failed:', sampleError.message);
    } else {
      console.log('✅ Basic fragrances query working');
      console.log('📊 Sample fragrance data:', Object.keys(sampleFragrances?.[0] || {}));
    }

    // Check brands table columns
    const { data: brandColumns, error: brandError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'fragrance_brands')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (!brandError) {
      console.log('\n📋 fragrance_brands table columns:');
      brandColumns?.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.column_name} (${col.data_type})`);
      });
    }

    return { fragranceColumns, brandColumns };

  } catch (error) {
    console.error('💥 Column check failed:', error);
  }
}

checkActualColumns();
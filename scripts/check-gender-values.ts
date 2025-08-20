/**
 * Check Gender Values in Database
 * Simple script to see what gender values are actually stored
 */

import { createServiceSupabase } from '@/lib/supabase';

async function checkGenderValues() {
  const supabase = createServiceSupabase();
  
  try {
    // Get sample of gender values from database
    const { data: genderSample, error } = await supabase
      .from('fragrances')
      .select('id, name, brand_id, gender')
      .limit(20);

    if (error) {
      console.error('❌ Error querying gender values:', error.message);
      return;
    }

    console.log('🔍 Sample of gender values in database:');
    genderSample?.forEach(fragrance => {
      console.log(`   ${fragrance.name} -> gender: "${fragrance.gender}"`);
    });

    // Get unique gender values
    const { data: uniqueGenders, error: uniqueError } = await supabase
      .from('fragrances')
      .select('gender')
      .not('gender', 'is', null);

    if (!uniqueError) {
      const genderSet = new Set(uniqueGenders?.map(f => f.gender));
      console.log('\n📊 Unique gender values found:', Array.from(genderSet));
    }

    // Check for Ariana Grande specifically
    const { data: arianaGrande, error: arianaError } = await supabase
      .from('fragrances')
      .select('id, name, gender')
      .ilike('name', '%ariana%')
      .limit(5);

    if (!arianaError && arianaGrande?.length > 0) {
      console.log('\n🎯 Ariana Grande fragrances (the problematic ones):');
      arianaGrande.forEach(fragrance => {
        console.log(`   ${fragrance.name} -> gender: "${fragrance.gender}"`);
      });
    }

    return true;

  } catch (error) {
    console.error('💥 Gender check failed:', error);
    return false;
  }
}

checkGenderValues();
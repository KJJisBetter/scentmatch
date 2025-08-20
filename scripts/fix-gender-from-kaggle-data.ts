import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface KaggleFragrance {
  url: string;
  perfume: string;
  brand: string;
  country: string;
  gender: 'women' | 'men' | 'unisex';
}

async function fixGenderFromKaggleData() {
  try {
    console.log('🔍 Reading Kaggle fragrance data...');
    
    // Read the fra_cleaned.csv file
    const csvPath = path.join(process.cwd(), 'data/kaggle/fra_cleaned.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV (skip header)
    const lines = csvContent.trim().split('\n').slice(1);
    const kaggleData: KaggleFragrance[] = [];
    
    for (const line of lines) {
      const parts = line.split(';');
      if (parts.length >= 5) {
        kaggleData.push({
          url: parts[0],
          perfume: parts[1],
          brand: parts[2], 
          country: parts[3],
          gender: parts[4] as 'women' | 'men' | 'unisex'
        });
      }
    }
    
    console.log(`📊 Loaded ${kaggleData.length} fragrances from Kaggle data`);
    
    // Analyze gender distribution in Kaggle data
    const genderCounts = kaggleData.reduce((acc, frag) => {
      acc[frag.gender] = (acc[frag.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📈 Kaggle gender distribution:', genderCounts);
    
    // Get current database fragrances
    const { data: dbFragrances, error } = await supabase
      .from('fragrances')
      .select('id, name, brand_id');
      
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`🗄️ Found ${dbFragrances.length} fragrances in database`);
    
    // Create matching logic
    let matched = 0;
    let updated = 0;
    
    for (const dbFrag of dbFragrances) {
      // Try to match by fragrance name (normalize for comparison)
      const dbName = dbFrag.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const kaggleMatch = kaggleData.find(k => {
        const kaggleName = k.perfume.toLowerCase().replace(/[^a-z0-9]/g, '');
        return kaggleName === dbName || kaggleName.includes(dbName) || dbName.includes(kaggleName);
      });
      
      if (kaggleMatch) {
        matched++;
        
        // Update gender in database if different
        const { error: updateError } = await supabase
          .from('fragrances')
          .update({ gender: kaggleMatch.gender })
          .eq('id', dbFrag.id);
          
        if (updateError) {
          console.error(`❌ Error updating ${dbFrag.name}:`, updateError.message);
        } else {
          updated++;
          if (updated % 100 === 0) {
            console.log(`✅ Updated ${updated} fragrances...`);
          }
        }
      }
    }
    
    console.log(`🎯 Matching complete: ${matched} matched, ${updated} updated`);
    
    // Final gender distribution check
    const { data: finalDistribution } = await supabase
      .from('fragrances')
      .select('gender')
      .not('gender', 'is', null);
      
    const finalCounts = finalDistribution?.reduce((acc, frag) => {
      acc[frag.gender] = (acc[frag.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    console.log('🏁 Final database gender distribution:', finalCounts);
    
    return {
      kaggleTotal: kaggleData.length,
      dbTotal: dbFragrances.length,
      matched,
      updated,
      finalDistribution: finalCounts
    };
    
  } catch (error) {
    console.error('💥 Error fixing gender data:', error);
    throw error;
  }
}

fixGenderFromKaggleData()
  .then(result => {
    console.log('✅ Gender fix complete:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Gender fix failed:', error);
    process.exit(1);
  });
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function createSearchableKey(name: string, brand: string): string {
  // Create a searchable key for fast matching
  const cleanName = name.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\b(eau|de|parfum|edp|edt|cologne|toilette|intense|extreme|elixir|pour)\b/g, '')
    .replace(/\d+/g, '');
    
  const cleanBrand = brand.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\b(perfumes|parfums|fragrances|colognes)\b/g, '');
    
  return `${cleanBrand}${cleanName}`;
}

async function fastCSVGenderSync() {
  try {
    console.log('🚀 Fast CSV → Database Gender Sync...');
    
    // Step 1: Build CSV lookup map for O(1) access
    console.log('📊 Building CSV lookup map...');
    const csvPath = path.join(process.cwd(), 'data/kaggle/fra_cleaned.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvLines = csvContent.trim().split('\n').slice(1);
    
    const csvLookup = new Map<string, { gender: string; name: string; brand: string }>();
    
    for (const line of csvLines) {
      const parts = line.split(';');
      if (parts.length >= 5 && parts[4].trim()) {
        const key = createSearchableKey(parts[1], parts[2]);
        csvLookup.set(key, {
          gender: parts[4].trim(),
          name: parts[1].trim(),
          brand: parts[2].trim()
        });
      }
    }
    
    console.log(`✅ CSV lookup map: ${csvLookup.size} entries`);
    
    // Step 2: Get database fragrances (most popular first for maximum impact)
    const { data: dbFragrances, error } = await supabase
      .from('fragrances')
      .select('id, name, brand_id, gender, popularity_score')
      .order('popularity_score', { ascending: false });
      
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`✅ Database fragrances: ${dbFragrances.length}`);
    
    // Step 3: Fast lookup and batch updates
    const updates = [];
    let exactMatches = 0;
    let partialMatches = 0;
    let noMatches = 0;
    
    for (const dbFrag of dbFragrances) {
      const searchKey = createSearchableKey(dbFrag.name, dbFrag.brand_id);
      
      // Try exact match first
      let csvMatch = csvLookup.get(searchKey);
      
      // If no exact match, try partial matching for high-popularity fragrances
      if (!csvMatch && dbFrag.popularity_score > 80) {
        for (const [key, value] of csvLookup.entries()) {
          const nameMatch = key.includes(searchKey.slice(0, Math.min(searchKey.length, 8))) ||
                           searchKey.includes(key.slice(0, Math.min(key.length, 8)));
          if (nameMatch && key.length > 5 && searchKey.length > 5) {
            csvMatch = value;
            partialMatches++;
            break;
          }
        }
      }
      
      if (csvMatch) {
        if (!csvMatch.name.includes(searchKey.slice(0, 5))) {
          exactMatches++;
        }
        
        // Only update if gender is different
        if (csvMatch.gender !== dbFrag.gender) {
          updates.push({
            id: dbFrag.id,
            name: dbFrag.name,
            oldGender: dbFrag.gender,
            newGender: csvMatch.gender,
            popularity: dbFrag.popularity_score,
            csvSource: csvMatch.name
          });
        }
      } else {
        noMatches++;
      }
    }
    
    console.log(`🔍 Matching results:`);
    console.log(`  Exact matches: ${exactMatches}`);
    console.log(`  Partial matches: ${partialMatches}`);
    console.log(`  No matches: ${noMatches}`);
    console.log(`  Updates needed: ${updates.length}`);
    
    // Step 4: Apply updates in batches
    console.log('💾 Applying gender updates...');
    
    for (let i = 0; i < updates.length; i += 50) {
      const batch = updates.slice(i, i + 50);
      
      const { error: batchError } = await supabase
        .from('fragrances')
        .upsert(
          batch.map(update => ({
            id: update.id,
            gender: update.newGender
          })),
          { onConflict: 'id' }
        );
        
      if (batchError) {
        console.error(`❌ Batch update error:`, batchError.message);
      } else {
        console.log(`✅ Updated batch ${Math.floor(i/50) + 1}/${Math.ceil(updates.length/50)}`);
      }
    }
    
    // Step 5: Final verification
    const { data: verification } = await supabase
      .from('fragrances')
      .select('gender')
      .not('gender', 'is', null);
      
    const verificationCounts = verification?.reduce((acc, frag) => {
      acc[frag.gender] = (acc[frag.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    console.log('🏁 FINAL VERIFIED DISTRIBUTION:');
    Object.entries(verificationCounts).forEach(([gender, count]) => {
      const percentage = ((count / (verification?.length || 1)) * 100).toFixed(1);
      console.log(`  ${gender}: ${count} (${percentage}%)`);
    });
    
    // Show top corrections by popularity
    console.log('\n🎯 Top corrections (by popularity):');
    updates
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 10)
      .forEach(update => {
        console.log(`  ${update.name}: ${update.oldGender} → ${update.newGender} [${update.popularity}] (${update.csvSource})`);
      });
    
    return {
      csvFragrances: csvLookup.size,
      dbFragrances: dbFragrances.length,
      updated: updates.length,
      finalDistribution: verificationCounts
    };
    
  } catch (error) {
    console.error('💥 Fast sync error:', error);
    throw error;
  }
}

if (require.main === module) {
  fastCSVGenderSync()
    .then(result => {
      console.log('✅ FAST CSV sync COMPLETE:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Fast sync failed:', error);
      process.exit(1);
    });
}
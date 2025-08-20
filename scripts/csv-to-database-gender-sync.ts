import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CSVFragrance {
  name: string;
  brand: string;
  gender: 'men' | 'women' | 'unisex';
  url: string;
}

interface DBFragrance {
  id: string;
  name: string;
  brand_id: string;
  gender: string;
}

function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\b(eau|de|parfum|edp|edt|cologne|toilette)\b/g, '')
    .replace(/\d+/g, '')
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeForMatching(str1);
  const norm2 = normalizeForMatching(str2);
  
  // Exact match
  if (norm1 === norm2) return 1.0;
  
  // One contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const shorter = Math.min(norm1.length, norm2.length);
    const longer = Math.max(norm1.length, norm2.length);
    return shorter / longer;
  }
  
  // Levenshtein distance similarity
  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);
  return maxLength > 0 ? (maxLength - distance) / maxLength : 0;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

async function csvToDatabaseGenderSync() {
  try {
    console.log('🎯 Starting CSV → Database Gender Synchronization...');
    
    // Step 1: Load CSV data as source of truth
    console.log('📊 Loading fra_cleaned.csv as source of truth...');
    const csvPath = path.join(process.cwd(), 'data/kaggle/fra_cleaned.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvLines = csvContent.trim().split('\n').slice(1); // Skip header
    
    const csvFragrances: CSVFragrance[] = [];
    
    for (const line of csvLines) {
      const parts = line.split(';');
      if (parts.length >= 5) {
        csvFragrances.push({
          name: parts[1].trim(),
          brand: parts[2].trim(), 
          gender: parts[4].trim() as 'men' | 'women' | 'unisex',
          url: parts[0].trim()
        });
      }
    }
    
    console.log(`✅ Loaded ${csvFragrances.length} fragrances from CSV`);
    
    // Analyze CSV gender distribution
    const csvGenderCounts = csvFragrances.reduce((acc, frag) => {
      acc[frag.gender] = (acc[frag.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📈 CSV gender distribution (source of truth):', csvGenderCounts);
    
    // Step 2: Load all database fragrances
    console.log('🗄️ Loading database fragrances...');
    const { data: dbFragrances, error } = await supabase
      .from('fragrances')
      .select('id, name, brand_id, gender')
      .order('popularity_score', { ascending: false });
      
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`✅ Loaded ${dbFragrances.length} fragrances from database`);
    
    // Step 3: Match and sync
    console.log('🔍 Matching fragrances and syncing genders...');
    
    let exactMatches = 0;
    let fuzzyMatches = 0;
    let updated = 0;
    let noMatch = 0;
    const updateLog = [];
    
    for (const dbFrag of dbFragrances) {
      let bestMatch: CSVFragrance | null = null;
      let bestScore = 0;
      let matchType = '';
      
      // Try to find best match in CSV
      for (const csvFrag of csvFragrances) {
        // Calculate name similarity
        const nameSimilarity = calculateSimilarity(dbFrag.name, csvFrag.name);
        
        // Brand similarity boost (same brand = more likely match)
        const brandMatch = normalizeForMatching(dbFrag.brand_id) === normalizeForMatching(csvFrag.brand);
        const finalScore = brandMatch ? nameSimilarity + 0.2 : nameSimilarity;
        
        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestMatch = csvFrag;
          
          if (nameSimilarity >= 0.95) {
            matchType = 'exact';
          } else if (finalScore >= 0.8) {
            matchType = 'fuzzy';
          } else {
            matchType = 'weak';
          }
        }
      }
      
      // Apply update if we found a good match and gender is different
      if (bestMatch && bestScore >= 0.8 && bestMatch.gender !== dbFrag.gender) {
        const { error: updateError } = await supabase
          .from('fragrances')
          .update({ gender: bestMatch.gender })
          .eq('id', dbFrag.id);
          
        if (!updateError) {
          updated++;
          updateLog.push({
            dbName: dbFrag.name,
            csvName: bestMatch.name,
            brand: dbFrag.brand_id,
            oldGender: dbFrag.gender,
            newGender: bestMatch.gender,
            similarity: Math.round(bestScore * 100),
            matchType
          });
          
          if (matchType === 'exact') exactMatches++;
          else if (matchType === 'fuzzy') fuzzyMatches++;
          
          if (updated % 100 === 0) {
            console.log(`✅ Synced ${updated} fragrances from CSV...`);
          }
        }
      } else if (!bestMatch || bestScore < 0.8) {
        noMatch++;
      }
    }
    
    console.log(`🎯 Synchronization complete:`);
    console.log(`  📍 Exact matches: ${exactMatches}`);
    console.log(`  🔍 Fuzzy matches: ${fuzzyMatches}`);  
    console.log(`  ✅ Total updated: ${updated}`);
    console.log(`  ❌ No reliable match: ${noMatch}`);
    
    // Step 4: Verify final results
    const { data: finalDistribution } = await supabase
      .from('fragrances')
      .select('gender')
      .not('gender', 'is', null);
      
    const finalCounts = finalDistribution?.reduce((acc, frag) => {
      acc[frag.gender] = (acc[frag.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    console.log('🏁 Final database distribution (synced from CSV):');
    Object.entries(finalCounts).forEach(([gender, count]) => {
      const percentage = ((count / (finalDistribution?.length || 1)) * 100).toFixed(1);
      console.log(`  ${gender}: ${count} (${percentage}%)`);
    });
    
    // Show sample successful matches
    console.log('\n📝 Sample successful synchronizations:');
    updateLog
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 15)
      .forEach(update => {
        console.log(`  ${update.dbName} → ${update.newGender} (${update.similarity}% match, ${update.matchType})`);
      });
    
    return {
      csvTotal: csvFragrances.length,
      dbTotal: dbFragrances.length,
      exactMatches,
      fuzzyMatches, 
      updated,
      noMatch,
      finalDistribution: finalCounts,
      sampleUpdates: updateLog.slice(0, 10)
    };
    
  } catch (error) {
    console.error('💥 CSV sync error:', error);
    throw error;
  }
}

if (require.main === module) {
  csvToDatabaseGenderSync()
    .then(result => {
      console.log('✅ CSV → Database gender sync COMPLETE:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ CSV sync failed:', error);
      process.exit(1);
    });
}
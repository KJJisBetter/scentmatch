import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface KaggleFragrance {
  perfume: string;
  brand: string;
  gender: 'women' | 'men' | 'unisex';
}

interface PerfumeTableEntry {
  title: string;
  designer: string;
  description: string;
}

function parseCSV(content: string, delimiter: string = ';'): string[][] {
  const lines = content.trim().split('\n');
  return lines.map(line => {
    const parts = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim());
    return parts;
  });
}

function extractGenderFromDescription(description: string, title: string): 'men' | 'women' | 'unisex' {
  const text = (description + ' ' + title).toLowerCase();
  
  // Check for explicit gender indicators
  if (text.includes('for women and men') || text.includes('for men and women')) return 'unisex';
  if (text.includes('for women') && !text.includes('for men')) return 'women';
  if (text.includes('for men') && !text.includes('for women')) return 'men';
  
  // Count gender-specific indicators
  const womenIndicators = [
    'for women', 'women', 'woman', 'feminine', 'lady', 'girl', 'her', 'she',
    'mademoiselle', 'madame', 'belle', 'donna', 'femme'
  ];
  
  const menIndicators = [
    'for men', 'men', 'man', 'masculine', 'homme', 'monsieur', 'guy', 'his', 'he'
  ];
  
  const womenCount = womenIndicators.filter(indicator => text.includes(indicator)).length;
  const menCount = menIndicators.filter(indicator => text.includes(indicator)).length;
  
  if (womenCount > menCount) return 'women';
  if (menCount > womenCount) return 'men';
  
  return 'unisex';
}

async function accurateGenderClassification() {
  try {
    console.log('🔍 Reading both Kaggle datasets...');
    
    // Read fra_cleaned.csv 
    const fraPath = path.join(process.cwd(), 'data/kaggle/fra_cleaned.csv');
    const fraContent = fs.readFileSync(fraPath, 'utf-8');
    const fraData = parseCSV(fraContent);
    
    const kaggleData: KaggleFragrance[] = fraData.slice(1).map(parts => ({
      perfume: parts[1],
      brand: parts[2],
      gender: parts[4] as 'women' | 'men' | 'unisex'
    }));
    
    console.log(`📊 Fra_cleaned: ${kaggleData.length} fragrances`);
    
    // Read perfumes_table.csv
    const perfPath = path.join(process.cwd(), 'data/kaggle/perfumes_table.csv');
    const perfContent = fs.readFileSync(perfPath, 'utf-8');
    const perfLines = perfContent.trim().split('\n');
    
    const perfumeTableData: PerfumeTableEntry[] = [];
    
    for (let i = 1; i < Math.min(perfLines.length, 1000); i++) { // Limit to prevent memory issues
      const parts = parseCSV(perfLines[i], ',')[0]; // It's comma-separated
      if (parts.length >= 6) {
        try {
          const parsed = parts.split(',');
          perfumeTableData.push({
            title: parsed[parsed.length - 1] || '',
            designer: parsed[2] || '',
            description: parsed[4] || ''
          });
        } catch (e) {
          // Skip malformed lines
        }
      }
    }
    
    console.log(`📊 Perfumes_table: ${perfumeTableData.length} entries processed`);
    
    // Get database fragrances
    const { data: dbFragrances, error } = await supabase
      .from('fragrances')
      .select('id, name, brand_id, gender');
      
    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`🗄️ Database: ${dbFragrances.length} fragrances`);
    
    let updated = 0;
    const corrections = [];
    
    for (const dbFrag of dbFragrances) {
      const dbName = dbFrag.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      let bestMatch: { gender: string; source: string; confidence: number } | null = null;
      
      // Try fra_cleaned.csv first (most reliable)
      const fraMatch = kaggleData.find(k => {
        const kaggleName = k.perfume.toLowerCase().replace(/[^a-z0-9]/g, '');
        return kaggleName === dbName || 
               (kaggleName.includes(dbName) && kaggleName.length - dbName.length < 5) ||
               (dbName.includes(kaggleName) && dbName.length - kaggleName.length < 5);
      });
      
      if (fraMatch) {
        bestMatch = { gender: fraMatch.gender, source: 'fra_cleaned', confidence: 0.9 };
      } else {
        // Try perfumes_table.csv with description analysis
        const perfMatch = perfumeTableData.find(p => {
          const title = p.title.toLowerCase();
          return title.includes(dbName) || dbName.includes(title.replace(/[^a-z0-9]/g, ''));
        });
        
        if (perfMatch) {
          const extractedGender = extractGenderFromDescription(perfMatch.description, perfMatch.title);
          bestMatch = { gender: extractedGender, source: 'perfumes_table', confidence: 0.7 };
        }
      }
      
      // Update if we found a reliable match and it's different from current
      if (bestMatch && bestMatch.gender !== dbFrag.gender && bestMatch.confidence > 0.8) {
        const { error: updateError } = await supabase
          .from('fragrances')
          .update({ gender: bestMatch.gender })
          .eq('id', dbFrag.id);
          
        if (!updateError) {
          updated++;
          corrections.push({
            name: dbFrag.name,
            old: dbFrag.gender,
            new: bestMatch.gender,
            source: bestMatch.source
          });
          
          if (updated % 50 === 0) {
            console.log(`✅ Updated ${updated} fragrances...`);
          }
        }
      }
    }
    
    console.log(`🎯 Classification complete: ${updated} updated`);
    console.log('📝 Sample corrections:', corrections.slice(0, 10));
    
    // Final verification
    const { data: finalDistribution } = await supabase
      .from('fragrances')
      .select('gender')
      .not('gender', 'is', null);
      
    const finalCounts = finalDistribution?.reduce((acc, frag) => {
      acc[frag.gender] = (acc[frag.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    console.log('🏁 Final accurate gender distribution:', finalCounts);
    
    return { updated, corrections: corrections.slice(0, 20), finalCounts };
    
  } catch (error) {
    console.error('💥 Error in accurate classification:', error);
    throw error;
  }
}

if (require.main === module) {
  accurateGenderClassification()
    .then(result => {
      console.log('✅ Accurate gender classification complete:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Classification failed:', error);
      process.exit(1);
    });
}
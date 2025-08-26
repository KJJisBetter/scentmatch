#!/usr/bin/env node

/**
 * Gender Data Correction Script
 * 
 * Compares original CSV gender values with database values
 * and creates a migration to fix mismatches.
 * 
 * Root cause: standardizeGender() function was over-complicated
 * and converted clean CSV "women" values to "unisex"
 */

import fs from 'fs/promises';
import { createReadStream } from 'fs';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CSVRow {
  Perfume: string;
  Brand: string;
  Gender: string;
  url: string;
}

interface DatabaseFragrance {
  id: string;
  name: string;
  brand_name: string;
  gender: string;
  fragrantica_url: string;
}

async function readCSVData(): Promise<CSVRow[]> {
  console.log('📖 Reading original CSV data...');
  
  const csvData: CSVRow[] = [];
  
  return new Promise((resolve, reject) => {
    createReadStream('/home/kevinjavier/dev/scentmatch/data/kaggle/fra_cleaned.csv')
      .pipe(csv({ separator: ';' }))
      .on('data', (row: CSVRow) => {
        if (row.Perfume && row.Brand && row.Gender) {
          csvData.push({
            Perfume: row.Perfume.trim(),
            Brand: row.Brand.trim(),
            Gender: row.Gender.toLowerCase().trim(),
            url: row.url
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Read ${csvData.length} fragrances from CSV`);
        resolve(csvData);
      })
      .on('error', reject);
  });
}

async function getDatabaseFragrances(): Promise<DatabaseFragrance[]> {
  console.log('🗄️ Fetching current database fragrances...');
  
  const { data, error } = await supabase
    .from('fragrances')
    .select(`
      id, 
      name, 
      gender, 
      fragrantica_url,
      fragrance_brands!inner(name)
    `)
    .not('fragrantica_url', 'is', null);
    
  if (error) throw error;
  
  // Transform the data to flatten the brand name
  const flatData = data?.map((item: any) => ({
    id: item.id,
    name: item.name,
    brand_name: item.fragrance_brands?.name || 'Unknown',
    gender: item.gender,
    fragrantica_url: item.fragrantica_url
  })) || [];
  
  console.log(`✅ Retrieved ${flatData.length} fragrances from database`);
  return flatData;
}

function createSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function findMismatches(csvData: CSVRow[], dbData: DatabaseFragrance[]) {
  console.log('🔍 Comparing CSV vs Database gender values...');
  
  const mismatches: Array<{
    fragrance_id: string;
    name: string;
    brand: string;
    csv_gender: string;
    db_gender: string;
    url: string;
  }> = [];

  // Create lookup maps
  const dbByUrl = new Map(dbData.map(f => [f.fragrantica_url, f]));
  
  for (const csvRow of csvData) {
    const dbFragment = dbByUrl.get(csvRow.url);
    
    if (dbFragment && csvRow.Gender !== dbFragment.gender) {
      mismatches.push({
        fragrance_id: dbFragment.id,
        name: dbFragment.name,
        brand: dbFragment.brand_name,
        csv_gender: csvRow.Gender,
        db_gender: dbFragment.gender,
        url: csvRow.url
      });
    }
  }
  
  return mismatches;
}

async function generateMigration(mismatches: any[]) {
  console.log(`📝 Generating migration for ${mismatches.length} gender corrections...`);
  
  if (mismatches.length === 0) {
    console.log('✅ No gender mismatches found! Data is already correct.');
    return;
  }

  // Group by correction type
  const corrections = {
    women: mismatches.filter(m => m.csv_gender === 'women'),
    men: mismatches.filter(m => m.csv_gender === 'men'),
    unisex: mismatches.filter(m => m.csv_gender === 'unisex')
  };

  console.log('\n📊 Gender Correction Summary:');
  console.log(`   → ${corrections.women.length} fragrances should be "women"`);
  console.log(`   → ${corrections.men.length} fragrances should be "men"`);
  console.log(`   → ${corrections.unisex.length} fragrances should be "unisex"`);

  // Generate SQL migration
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const migrationPath = `/home/kevinjavier/dev/scentmatch/supabase/migrations/${timestamp}_fix_gender_from_original_csv.sql`;
  
  let sql = `-- Fix Gender Classifications Based on Original CSV Data
-- Generated on ${new Date().toISOString()}
--
-- Root cause: standardizeGender() function was over-complicated and 
-- incorrectly converted clean CSV gender values to unisex
--
-- This migration restores the original, correct gender classifications

`;

  // Add women corrections
  if (corrections.women.length > 0) {
    sql += `-- Fix fragrances that should be "women" (${corrections.women.length})\n`;
    sql += `UPDATE fragrances SET 
  gender = 'women',
  last_updated = now()
WHERE id IN (
${corrections.women.map(m => `  '${m.fragrance_id}' -- ${m.name} by ${m.brand}`).join(',\n')}
);\n\n`;
  }

  // Add men corrections  
  if (corrections.men.length > 0) {
    sql += `-- Fix fragrances that should be "men" (${corrections.men.length})\n`;
    sql += `UPDATE fragrances SET 
  gender = 'men',
  last_updated = now()
WHERE id IN (
${corrections.men.map(m => `  '${m.fragrance_id}' -- ${m.name} by ${m.brand}`).join(',\n')}
);\n\n`;
  }

  // Add unisex corrections
  if (corrections.unisex.length > 0) {
    sql += `-- Fix fragrances that should be "unisex" (${corrections.unisex.length})\n`;
    sql += `UPDATE fragrances SET 
  gender = 'unisex',
  last_updated = now()
WHERE id IN (
${corrections.unisex.map(m => `  '${m.fragrance_id}' -- ${m.name} by ${m.brand}`).join(',\n')}
);\n\n`;
  }

  // Add verification query
  sql += `-- Verification: Check gender distribution after fix
SELECT 
  gender,
  count(*) as count,
  round(count(*) * 100.0 / sum(count(*)) over(), 1) as percentage
FROM fragrances 
GROUP BY gender 
ORDER BY count DESC;
`;

  await fs.writeFile(migrationPath, sql);
  console.log(`✅ Migration created: ${migrationPath}`);
  
  // Show sample mismatches
  console.log('\n🔍 Sample Corrections:');
  mismatches.slice(0, 10).forEach(m => {
    console.log(`   ${m.name} (${m.brand}): ${m.db_gender} → ${m.csv_gender}`);
  });
  
  if (mismatches.length > 10) {
    console.log(`   ... and ${mismatches.length - 10} more`);
  }
}

async function main() {
  try {
    console.log('🚀 Starting gender data correction analysis...\n');
    
    const csvData = await readCSVData();
    const dbData = await getDatabaseFragrances();
    
    const mismatches = findMismatches(csvData, dbData);
    
    await generateMigration(mismatches);
    
    console.log('\n✅ Analysis complete!');
    if (mismatches.length > 0) {
      console.log('\n📋 Next steps:');
      console.log('1. Review the generated migration file');  
      console.log('2. Apply it with: supabase db push');
      console.log('3. Test quiz recommendations to verify fixes');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
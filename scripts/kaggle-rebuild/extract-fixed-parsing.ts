#!/usr/bin/env node

/**
 * FIXED KAGGLE PARSING - Correct Brand/Name Extraction
 *
 * Fixed parsing based on actual Kaggle format:
 * Name: "9am Afnanfor women" (fragrance+brand+gender concatenated)
 * Description: "9ambyAfnanis a fragrance for women" (contains real brand)
 */

import { createReadStream } from 'fs';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface KaggleRow {
  Name: string;
  Gender: string;
  'Rating Value': string;
  'Rating Count': string;
  'Main Accords': string;
  Perfumers: string;
  Description: string;
  url: string;
}

/**
 * FIXED: Extract brand from description field
 */
function extractBrandFromDescription(
  description: string,
  name: string
): { brandName: string; fragranceName: string } {
  // Pattern: "[FragranceName]by[BrandName]is a fragrance"
  const byPattern = /(.+?)by([A-Za-z\s&'.]+?)is\s+a/;
  const match = description.match(byPattern);

  if (match && match[2]) {
    const brandName = match[2].trim();
    const fragranceFromDesc = match[1].trim();

    return {
      brandName: brandName,
      fragranceName: fragranceFromDesc,
    };
  }

  // Fallback: try to extract from Name field by removing gender suffix
  const cleanedName = name
    .replace(/(for\s+(women|men|women\s+and\s+men))$/i, '')
    .trim();

  // Try to split on capital letters or common patterns
  const words = cleanedName.split(/(?=[A-Z][a-z])/);
  if (words.length >= 2) {
    return {
      brandName: words[words.length - 1] || 'Unknown',
      fragranceName: words.slice(0, -1).join('').trim(),
    };
  }

  return {
    brandName: 'Unknown',
    fragranceName: cleanedName,
  };
}

/**
 * FIXED: Standardize gender correctly (avoid "women" containing "men")
 */
function standardizeGender(gender: string): string {
  const g = gender.toLowerCase().trim();

  // Check for "women and men" or "men and women" first
  if (g.includes('women and men') || g.includes('men and women')) {
    return 'unisex';
  }
  // Check for standalone "women" (but not "men" that's part of "women")
  else if (
    g.includes('for women') ||
    (g.includes('women') && !g.includes(' men'))
  ) {
    return 'women';
  }
  // Check for standalone "men"
  else if (
    g.includes('for men') ||
    (g.includes(' men') && !g.includes('women'))
  ) {
    return 'men';
  }

  return 'unisex';
}

/**
 * Sample extraction to verify parsing
 */
async function testParsing(): Promise<void> {
  console.log('🧪 Testing Kaggle data parsing...');

  const kagglePath =
    '/home/kevinjavier/dev/scentmatch-scrapped-last/research/fra_perfumes.csv';
  const samples: any[] = [];

  return new Promise((resolve, reject) => {
    createReadStream(kagglePath)
      .pipe(csv())
      .on('data', (row: KaggleRow) => {
        if (samples.length < 20) {
          // Take first 20 for testing

          const { brandName, fragranceName } = extractBrandFromDescription(
            row.Description,
            row.Name
          );
          const standardGender = standardizeGender(row.Gender);

          samples.push({
            original_name: row.Name,
            extracted_brand: brandName,
            extracted_fragrance: fragranceName,
            original_gender: row.Gender,
            standardized_gender: standardGender,
            description_snippet: row.Description.substring(0, 50) + '...',
          });
        }
      })
      .on('end', () => {
        console.log('\n📋 PARSING TEST RESULTS:');
        console.table(samples);

        // Count gender distribution in sample
        const genderCounts = samples.reduce((acc, s) => {
          acc[s.standardized_gender] = (acc[s.standardized_gender] || 0) + 1;
          return acc;
        }, {});

        console.log('\n📊 Gender Distribution in Sample:');
        console.log(genderCounts);

        resolve();
      })
      .on('error', reject);
  });
}

// Run parsing test
if (require.main === module) {
  testParsing()
    .then(() => {
      console.log('\n✅ Parsing test complete. Review results above.');
      console.log('\n🚀 To run full import after verification:');
      console.log('npm run extract:kaggle');
    })
    .catch(error => {
      console.error('❌ Parsing test failed:', error);
    });
}

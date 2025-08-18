#!/usr/bin/env node

/**
 * KAGGLE DATASET EXTRACTION SCRIPT
 *
 * Extracts top 2000 high-quality fragrances from massive 70k Kaggle dataset
 * Source: /home/kevinjavier/dev/scentmatch-scrapped-last/research/fra_perfumes.csv
 *
 * Quality Criteria:
 * - Rating Value >= 3.8 (high quality)
 * - Rating Count >= 200 (sufficient reviews)
 * - Valid name, brand, and gender
 * - Rich accord data available
 *
 * Usage: npm run extract:kaggle
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

interface ProcessedBrand {
  id: string;
  name: string;
  slug: string;
  brand_tier: string;
  origin_country?: string;
  founded_year?: number;
  website_url?: string;
  affiliate_supported: boolean;
}

interface ProcessedFragrance {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  gender: string;
  perfumers: string[];
  main_accords: string[];
  full_description: string;
  rating_value: number;
  rating_count: number;
  popularity_score: number;
  kaggle_score: number;
  sample_available: boolean;
  sample_price_usd: number;
  fragrantica_url: string;
  fragrance_family: string;
  data_source: string;
  is_verified: boolean;
}

/**
 * Read and filter Kaggle dataset with quality criteria
 */
async function extractQualityFragrances(): Promise<KaggleRow[]> {
  console.log('🔍 Reading massive Kaggle dataset (70k+ fragrances)...');

  const kagglePath =
    '/home/kevinjavier/dev/scentmatch-scrapped-last/research/fra_perfumes.csv';
  const qualityFragrances: KaggleRow[] = [];

  return new Promise((resolve, reject) => {
    createReadStream(kagglePath)
      .pipe(csv())
      .on('data', (row: KaggleRow) => {
        try {
          // Quality filtering criteria
          const ratingValue = parseFloat(row['Rating Value']);
          const ratingCount = parseInt(row['Rating Count']);

          // Strict quality criteria for top 2000
          if (
            ratingValue >= 3.8 && // High rating threshold
            ratingCount >= 200 && // Sufficient review count
            row.Name &&
            row.Name.length > 3 && // Valid name
            row.Gender && // Valid gender
            row['Main Accords'] &&
            row['Main Accords'] !== '[]' && // Has accords
            row.Description &&
            row.Description.length > 10 // Has description
          ) {
            qualityFragrances.push(row);
          }
        } catch (error) {
          // Skip malformed rows
          console.warn(`⚠️ Skipping malformed row: ${row.Name}`);
        }
      })
      .on('end', () => {
        // Sort by popularity (rating * sqrt(count)) and take top 2500 for further filtering
        const sorted = qualityFragrances
          .sort((a, b) => {
            const scoreA =
              parseFloat(a['Rating Value']) *
              Math.sqrt(parseInt(a['Rating Count']));
            const scoreB =
              parseFloat(b['Rating Value']) *
              Math.sqrt(parseInt(b['Rating Count']));
            return scoreB - scoreA;
          })
          .slice(0, 2500); // Get top 2500 for brand diversity filtering

        console.log(
          `✅ Extracted ${sorted.length} high-quality fragrances from Kaggle`
        );
        resolve(sorted);
      })
      .on('error', reject);
  });
}

/**
 * FIXED: Extract brand from description field (Kaggle format)
 */
function extractBrandInfo(
  fragranceName: string,
  description: string
): { brandName: string; cleanName: string } {
  // Pattern: "[FragranceName]by[BrandName]is a fragrance"
  const byPattern = /(.+?)by([A-Za-z\s&'.]+?)is\s+a/;
  const match = description.match(byPattern);

  if (match && match[2]) {
    const brandName = match[2].trim();
    const fragranceFromDesc = match[1].trim();

    return {
      brandName: brandName,
      cleanName: fragranceFromDesc,
    };
  }

  // Fallback: try to extract from Name field by removing gender suffix
  const cleanedName = fragranceName
    .replace(/(for\s+(women|men|women\s+and\s+men))$/i, '')
    .trim();

  // Try to split on capital letters or common patterns
  const words = cleanedName.split(/(?=[A-Z][a-z])/);
  if (words.length >= 2) {
    return {
      brandName: words[words.length - 1] || 'Unknown',
      cleanName: words.slice(0, -1).join('').trim(),
    };
  }

  return {
    brandName: 'Unknown',
    cleanName: cleanedName,
  };
}

/**
 * Determine brand tier based on brand name
 */
function determineBrandTier(brandName: string): string {
  const brand = brandName.toLowerCase();

  // Luxury brands
  if (
    ['tom ford', 'creed', 'clive christian', 'amouage', 'roja dove'].some(b =>
      brand.includes(b)
    )
  ) {
    return 'luxury';
  }

  // Premium designer brands
  if (
    ['chanel', 'dior', 'guerlain', 'hermès', 'hermes'].some(b =>
      brand.includes(b)
    )
  ) {
    return 'premium';
  }

  // Designer brands
  if (
    [
      'versace',
      'prada',
      'armani',
      'burberry',
      'gucci',
      'ysl',
      'calvin klein',
    ].some(b => brand.includes(b))
  ) {
    return 'designer';
  }

  // Niche brands
  if (
    [
      'le labo',
      'byredo',
      'maison margiela',
      'kilian',
      'maison francis kurkdjian',
    ].some(b => brand.includes(b))
  ) {
    return 'niche';
  }

  // Celebrity brands
  if (
    ['ariana grande', 'billie eilish', 'taylor swift', 'rihanna'].some(b =>
      brand.includes(b)
    )
  ) {
    return 'celebrity';
  }

  return 'mass'; // Default category
}

/**
 * Parse JSON-like strings from Kaggle data
 */
function parseJsonArray(jsonString: string): string[] {
  if (!jsonString || jsonString.trim() === '[]') return [];

  try {
    // Fix common JSON issues in Kaggle data
    const cleaned = jsonString
      .replace(/'/g, '"') // Single quotes to double quotes
      .replace(/\b(\w+):/g, '"$1":') // Unquoted keys
      .trim();

    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Fallback: manual parsing
    return jsonString
      .replace(/[\[\]'"]/g, '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }
}

/**
 * Process Kaggle data into our database format
 */
function processKaggleData(kaggleRows: KaggleRow[]): {
  brands: ProcessedBrand[];
  fragrances: ProcessedFragrance[];
} {
  console.log('🔄 Processing Kaggle data into database format...');

  const brandsMap = new Map<string, ProcessedBrand>();
  const fragrances: ProcessedFragrance[] = [];
  const batchNumber = Date.now();

  for (const row of kaggleRows) {
    try {
      // Extract brand and fragrance name
      const { brandName, cleanName } = extractBrandInfo(
        row.Name,
        row.Description
      );
      const brandId = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const brandTier = determineBrandTier(brandName);

      // Create brand entry if not exists
      if (!brandsMap.has(brandId)) {
        brandsMap.set(brandId, {
          id: brandId,
          name: brandName,
          slug: brandId,
          brand_tier: brandTier,
          website_url: extractDomainFromUrl(row.url),
          affiliate_supported: isAffiliateSupported(brandName),
        });
      }

      // Process fragrance data
      const ratingValue = parseFloat(row['Rating Value']);
      const ratingCount = parseInt(row['Rating Count']);
      const accords = parseJsonArray(row['Main Accords']);
      const perfumers = parseJsonArray(row.Perfumers);

      // Calculate popularity score
      const popularityScore = (ratingValue * Math.sqrt(ratingCount)) / 10;

      // Generate fragrance ID and slug
      const fragranceId = `${brandId}__${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-');

      // Standardize gender
      const standardGender = standardizeGender(row.Gender);

      fragrances.push({
        id: fragranceId,
        brand_id: brandId,
        name: cleanName.replace(/\s*(for\s+(women|men|unisex))?\s*$/i, ''), // Remove gender suffixes
        slug: slug,
        gender: standardGender,
        perfumers: perfumers,
        main_accords: accords,
        full_description: row.Description,
        rating_value: ratingValue,
        rating_count: ratingCount,
        popularity_score: popularityScore,
        kaggle_score: popularityScore,
        sample_available: true,
        sample_price_usd: calculateSamplePrice(
          brandName,
          brandTier,
          popularityScore,
          ratingValue
        ),
        fragrantica_url: row.url,
        fragrance_family: determineFragranceFamily(accords),
        data_source: 'kaggle_70k',
        is_verified: true,
      });
    } catch (error) {
      console.warn(`⚠️ Error processing: ${row.Name} - ${error}`);
    }
  }

  console.log(
    `✅ Processed ${fragrances.length} fragrances from ${brandsMap.size} brands`
  );

  return {
    brands: Array.from(brandsMap.values()),
    fragrances: fragrances,
  };
}

/**
 * Helper functions
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

function determineFragranceFamily(accords: string[]): string {
  if (!accords || accords.length === 0) return 'miscellaneous';

  const primary = accords[0].toLowerCase();

  if (
    ['citrus', 'fresh', 'green', 'aquatic', 'aromatic'].some(f =>
      primary.includes(f)
    )
  )
    return 'fresh';
  if (
    ['floral', 'rose', 'jasmine', 'white floral'].some(f => primary.includes(f))
  )
    return 'floral';
  if (['woody', 'cedar', 'sandalwood', 'oud'].some(f => primary.includes(f)))
    return 'woody';
  if (
    ['oriental', 'amber', 'vanilla', 'spicy', 'warm'].some(f =>
      primary.includes(f)
    )
  )
    return 'oriental';

  return 'miscellaneous';
}

function calculateSamplePrice(
  brandName: string,
  tier: string,
  popularity: number,
  rating: number
): number {
  let price = 8;

  switch (tier) {
    case 'luxury':
      price += 10;
      break;
    case 'premium':
      price += 6;
      break;
    case 'designer':
      price += 4;
      break;
    case 'niche':
      price += 8;
      break;
    case 'celebrity':
      price += 2;
      break;
  }

  if (popularity > 20) price += 5;
  else if (popularity > 15) price += 3;

  if (rating > 4.5) price += 3;
  else if (rating > 4.0) price += 2;

  return Math.min(price, 30);
}

function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function isAffiliateSupported(brandName: string): boolean {
  // Major brands likely to have affiliate programs
  const affiliateBrands = [
    'chanel',
    'dior',
    'versace',
    'prada',
    'gucci',
    'armani',
    'tom ford',
    'ysl',
    'calvin klein',
    'burberry',
    'marc jacobs',
  ];

  return affiliateBrands.some(brand => brandName.toLowerCase().includes(brand));
}

/**
 * Apply brand diversity filtering to ensure good representation
 */
function applyBrandDiversity(
  fragrances: ProcessedFragrance[]
): ProcessedFragrance[] {
  console.log('🎯 Applying brand diversity filtering...');

  // Group by brand and limit per brand for diversity
  const brandGroups = new Map<string, ProcessedFragrance[]>();

  for (const frag of fragrances) {
    if (!brandGroups.has(frag.brand_id)) {
      brandGroups.set(frag.brand_id, []);
    }
    brandGroups.get(frag.brand_id)!.push(frag);
  }

  // Limit per brand based on brand tier
  const diverseSelection: ProcessedFragrance[] = [];

  for (const [brandId, brandFragrances] of brandGroups) {
    // Sort by popularity within brand
    const sorted = brandFragrances.sort(
      (a, b) => b.popularity_score - a.popularity_score
    );

    // Determine limit based on brand tier
    const brandTier = sorted[0]?.brand_id
      ? getBrandTier(sorted[0].brand_id)
      : 'mass';
    let limit = 15; // Default

    switch (brandTier) {
      case 'luxury':
        limit = 25;
        break; // More from luxury brands
      case 'premium':
        limit = 20;
        break;
      case 'designer':
        limit = 18;
        break;
      case 'niche':
        limit = 15;
        break;
      case 'celebrity':
        limit = 8;
        break; // Fewer from celebrity brands
      case 'mass':
        limit = 12;
        break;
    }

    diverseSelection.push(...sorted.slice(0, limit));
  }

  // Final sort and limit to 2000
  const final = diverseSelection
    .sort((a, b) => b.popularity_score - a.popularity_score)
    .slice(0, 2000);

  console.log(
    `✅ Selected ${final.length} fragrances with diversity across ${brandGroups.size} brands`
  );
  return final;
}

function getBrandTier(brandId: string): string {
  // This would ideally reference the brands table, but for processing we'll use the same logic
  return determineBrandTier(brandId.replace(/-/g, ' '));
}

/**
 * Import data into Supabase
 */
async function importToDatabase(
  brands: ProcessedBrand[],
  fragrances: ProcessedFragrance[]
) {
  const batchNumber = Date.now();

  try {
    console.log('🚀 Starting database import...');

    // Step 1: Import brands
    console.log(`📥 Importing ${brands.length} brands...`);

    const { error: brandsError } = await supabase
      .from('fragrance_brands')
      .insert(brands);

    if (brandsError) {
      console.error('❌ Brand import failed:', brandsError);
      throw brandsError;
    }

    console.log('✅ Brands imported successfully');

    // Step 2: Import fragrances in batches
    console.log(`📥 Importing ${fragrances.length} fragrances...`);

    const batchSize = 100; // Larger batches for efficiency
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < fragrances.length; i += batchSize) {
      const batch = fragrances.slice(i, i + batchSize);

      console.log(
        `📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(fragrances.length / batchSize)} (${batch.length} items)...`
      );

      const { error } = await supabase.from('fragrances').insert(batch);

      if (error) {
        console.error(`❌ Batch failed:`, error.message);
        errors += batch.length;
      } else {
        imported += batch.length;
        console.log(`✅ ${imported}/${fragrances.length} imported`);
      }

      // Brief pause between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Step 3: Log import results
    await supabase.from('kaggle_import_tracking').insert({
      import_batch: batchNumber,
      source_file: 'fra_perfumes.csv',
      total_records_processed: fragrances.length,
      brands_imported: brands.length,
      fragrances_imported: imported,
      duplicates_skipped: 0,
      errors_encountered: errors,
      quality_score: (imported / fragrances.length) * 100,
      notes: `Complete database rebuild with top ${fragrances.length} quality fragrances from 70k Kaggle dataset`,
    });

    console.log(`🎉 Import complete!`);
    console.log(`📊 Results: ${imported} fragrances, ${brands.length} brands`);
    console.log(`❌ Errors: ${errors}`);
    console.log(
      `✅ Success rate: ${((imported / fragrances.length) * 100).toFixed(1)}%`
    );
  } catch (error) {
    console.error('💥 Import failed:', error);
    throw error;
  }
}

/**
 * Main extraction and import function
 */
async function extractAndImport() {
  const startTime = Date.now();

  try {
    console.log('🎯 KAGGLE DATASET EXTRACTION STARTING...');
    console.log('📊 Target: 2000 high-quality fragrances from 70k dataset');

    // Step 1: Extract quality fragrances
    const qualityData = await extractQualityFragrances();

    // Step 2: Process into database format
    const { brands, fragrances: allFragrances } =
      processKaggleData(qualityData);

    // Step 3: Apply brand diversity filtering
    const finalFragrances = applyBrandDiversity(allFragrances);

    // Step 4: Get unique brands for final selection
    const finalBrandIds = new Set(finalFragrances.map(f => f.brand_id));
    const finalBrands = brands.filter(b => finalBrandIds.has(b.id));

    console.log(`🎯 FINAL SELECTION:`);
    console.log(`📋 Brands: ${finalBrands.length}`);
    console.log(`📋 Fragrances: ${finalFragrances.length}`);
    console.log(
      `📋 Quality Score: ${(finalFragrances.reduce((sum, f) => sum + f.rating_value, 0) / finalFragrances.length).toFixed(2)}/5.0`
    );

    // Step 5: Import to database
    await importToDatabase(finalBrands, finalFragrances);

    const duration = Date.now() - startTime;
    console.log(`⏱️ Total time: ${(duration / 1000).toFixed(1)}s`);
    console.log(
      `🎉 EXTRACTION COMPLETE - Database rebuilt with 2000 quality fragrances!`
    );
  } catch (error) {
    console.error('💥 Extraction failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  extractAndImport()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { extractAndImport };

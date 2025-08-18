/**
 * Import Additional Fragrances from Kaggle Dataset
 * Goal: Expand from 1,467 to 2,000+ high-quality fragrances
 * Source: Already processed JSON data from research output
 */

import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface KaggleFragrance {
  id: string;
  brandId: string;
  brandName: string;
  name: string;
  slug: string;
  ratingValue: number;
  ratingCount: number;
  score: number;
  gender: string;
  accords: string[];
  perfumers: string[];
  url: string;
}

interface ProcessedFragrance {
  id: string;
  brand_id: string;
  brand_name: string;
  name: string;
  slug: string;
  rating_value: number;
  rating_count: number;
  score: number;
  gender: string;
  accords: string[];
  perfumers: string[];
  fragrantica_url: string;
  full_description: string;
  main_accords: string[];
  data_source: string;
  kaggle_score: number;
  is_verified: boolean;
  import_batch: number;
  sample_price_usd: number;
  sample_available: boolean;
}

/**
 * Select additional high-quality fragrances from 70k Kaggle dataset
 */
async function selectAdditionalFragrances(): Promise<KaggleFragrance[]> {
  console.log('🔍 Reading massive Kaggle dataset...');

  const kagglePath =
    '/home/kevinjavier/dev/scentmatch-scrapped-last/research/fra_perfumes.csv';
  const fragrances: KaggleFragrance[] = [];

  return new Promise((resolve, reject) => {
    createReadStream(kagglePath)
      .pipe(csv())
      .on('data', (row: KaggleFragrance) => {
        // Filter for high-quality additions
        const ratingValue = parseFloat(row['Rating Value']);
        const ratingCount = parseInt(row['Rating Count']);

        // Quality criteria for additional fragrances
        if (
          ratingValue >= 3.8 && // Good rating
          ratingCount >= 500 && // Significant review count
          row.Name && // Valid name
          row.Gender && // Valid gender
          row['Main Accords'] // Has accord data
        ) {
          fragrances.push(row);
        }
      })
      .on('end', () => {
        console.log(
          `✅ Found ${fragrances.length} high-quality candidates from Kaggle`
        );
        resolve(fragrances);
      })
      .on('error', reject);
  });
}

/**
 * Check which fragrances we already have
 */
async function getExistingFragranceIds(): Promise<Set<string>> {
  console.log('📊 Checking existing fragrances...');

  const { data: existing, error } = await supabase
    .from('fragrances')
    .select('id, name, brand_name');

  if (error) {
    throw new Error(`Failed to fetch existing fragrances: ${error.message}`);
  }

  // Create set of existing fragrance identifiers
  const existingIds = new Set<string>();
  existing?.forEach(frag => {
    existingIds.add(frag.id);
    // Also check by name + brand to avoid duplicates with different IDs
    existingIds.add(
      `${frag.brand_name.toLowerCase()}-${frag.name.toLowerCase()}`
    );
  });

  console.log(`📋 Found ${existing?.length} existing fragrances`);
  return existingIds;
}

/**
 * Process Kaggle fragrance into our database format
 */
function processKaggleFragrance(
  kaggle: KaggleFragrance,
  batchNumber: number
): ProcessedFragrance {
  // Extract brand and clean name
  const nameParts = kaggle.Name.split(' ');
  const brandName = extractBrandName(kaggle.Name);
  const cleanName = cleanFragranceName(kaggle.Name, brandName);

  // Generate IDs
  const brandId = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const fragId = `${brandId}__${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Parse accords
  const accordsArray = parseAccords(kaggle['Main Accords']);

  // Parse perfumers
  const perfumersArray = parsePerfumers(kaggle.Perfumers);

  // Calculate scores
  const ratingValue = parseFloat(kaggle['Rating Value']) || 0;
  const ratingCount = parseInt(kaggle['Rating Count']) || 0;
  const popularityScore = calculatePopularityScore(ratingValue, ratingCount);

  return {
    id: fragId,
    brand_id: brandId,
    brand_name: brandName,
    name: cleanName,
    slug: slug,
    rating_value: ratingValue,
    rating_count: ratingCount,
    score: popularityScore,
    gender: standardizeGender(kaggle.Gender),
    accords: accordsArray,
    perfumers: perfumersArray,
    fragrantica_url: kaggle.url || '',
    full_description: kaggle.Description || '',
    main_accords: accordsArray,
    data_source: 'kaggle_expansion',
    kaggle_score: popularityScore,
    is_verified: true,
    import_batch: batchNumber,
    sample_price_usd: calculateSamplePrice(
      brandName,
      popularityScore,
      ratingValue
    ),
    sample_available: true,
  };
}

/**
 * Helper functions for data processing
 */
function extractBrandName(fullName: string): string {
  // Common brand extraction patterns
  const brandPatterns = [
    /^(.+?)\s+(?:Eau de|EDT|EDP|Parfum|Cologne)/i,
    /^(.+?)\s+for\s+(?:men|women)/i,
    /^(.+?)\s*—\s*.+/,
    /^([A-Z][^a-z]*(?:\s+[A-Z][^a-z]*)*)/,
  ];

  for (const pattern of brandPatterns) {
    const match = fullName.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // Fallback: first 2-3 words
  const words = fullName.split(' ');
  if (words.length >= 2) {
    return words.slice(0, 2).join(' ');
  }

  return 'Unknown Brand';
}

function cleanFragranceName(fullName: string, brandName: string): string {
  let clean = fullName;

  // Remove brand name if it's at the start
  if (clean.toLowerCase().startsWith(brandName.toLowerCase())) {
    clean = clean.substring(brandName.length).trim();
  }

  // Remove common suffixes
  clean = clean.replace(/\s*for\s+(men|women|women and men)$/i, '');
  clean = clean.replace(
    /\s*(EDT|EDP|Eau de Toilette|Eau de Parfum|Cologne)$/i,
    ''
  );

  return clean.trim() || fullName;
}

function parseAccords(accordsString: string): string[] {
  if (!accordsString || accordsString === '[]') return [];

  try {
    // Parse JSON-like array string
    const cleaned = accordsString.replace(/'/g, '"');
    return JSON.parse(cleaned);
  } catch {
    // Fallback: split by comma
    return accordsString
      .replace(/[\[\]']/g, '')
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);
  }
}

function parsePerfumers(perfumersString: string): string[] {
  if (!perfumersString || perfumersString === '[]') return [];

  try {
    const cleaned = perfumersString.replace(/'/g, '"');
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

function standardizeGender(gender: string): string {
  if (gender.includes('women and men') || gender.includes('unisex')) {
    return 'unisex';
  } else if (gender.includes('women')) {
    return 'women';
  } else if (gender.includes('men')) {
    return 'men';
  }
  return 'unisex';
}

function calculatePopularityScore(rating: number, count: number): number {
  // Weighted popularity score: (rating * sqrt(count)) / 100
  return (rating * Math.sqrt(count)) / 100;
}

function calculateSamplePrice(
  brand: string,
  score: number,
  rating: number
): number {
  let price = 8; // Base price

  // Luxury brand pricing
  if (
    ['Tom Ford', 'Creed', 'Maison Margiela', 'KILIAN'].some(b =>
      brand.includes(b)
    )
  ) {
    price += 7;
  } else if (
    ['Chanel', 'Dior', 'Guerlain', 'Hermès'].some(b => brand.includes(b))
  ) {
    price += 5;
  } else if (
    ['Versace', 'Prada', 'Armani', 'Burberry'].some(b => brand.includes(b))
  ) {
    price += 3;
  }

  // Popularity bonus
  if (score > 18) price += 4;
  else if (score > 15) price += 2;

  // Rating bonus
  if (rating > 4.5) price += 2;
  else if (rating > 4.0) price += 1;

  return Math.min(price, 25);
}

/**
 * Main import function
 */
async function importAdditionalFragrances() {
  const batchNumber = Date.now();

  try {
    console.log('🚀 Starting Kaggle dataset expansion import...');

    // Get additional candidates from massive dataset
    const candidates = await selectAdditionalFragrances();

    // Get existing fragrances to avoid duplicates
    const existingIds = await getExistingFragranceIds();

    // Filter out duplicates and select best additions
    const newFragrances = candidates
      .filter(frag => {
        const testKey = `${extractBrandName(frag.Name).toLowerCase()}-${frag.Name.toLowerCase()}`;
        return !existingIds.has(testKey);
      })
      .sort((a, b) => {
        // Sort by rating * review count for quality
        const scoreA =
          parseFloat(a['Rating Value']) *
          Math.sqrt(parseInt(a['Rating Count']));
        const scoreB =
          parseFloat(b['Rating Value']) *
          Math.sqrt(parseInt(b['Rating Count']));
        return scoreB - scoreA;
      })
      .slice(0, 600); // Take top 600 to reach 2000+ total

    console.log(`📝 Processing ${newFragrances.length} new fragrances...`);

    // Process and batch import
    const processed = newFragrances.map(frag =>
      processKaggleFragrance(frag, batchNumber)
    );

    // Import in batches of 50 for reliability
    const batchSize = 50;
    let imported = 0;

    for (let i = 0; i < processed.length; i += batchSize) {
      const batch = processed.slice(i, i + batchSize);

      console.log(
        `📥 Importing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(processed.length / batchSize)}...`
      );

      const { error } = await supabase.from('fragrances').insert(batch);

      if (error) {
        console.error(`❌ Batch import error:`, error);
        break;
      }

      imported += batch.length;
      console.log(`✅ Imported ${imported}/${processed.length} fragrances`);

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Log import results
    await supabase.from('kaggle_import_log').insert({
      import_batch: batchNumber,
      source_file: 'fra_perfumes.csv',
      fragrances_imported: imported,
      fragrances_updated: 0,
      success_rate: (imported / processed.length) * 100,
      notes: `Expanded dataset from 1,467 to ${1467 + imported} fragrances using quality-filtered Kaggle data`,
    });

    console.log(`🎉 Import complete! Added ${imported} fragrances.`);
    console.log(`📊 Total fragrances: ~${1467 + imported}`);
  } catch (error) {
    console.error('💥 Import failed:', error);
    throw error;
  }
}

// Execute import
if (require.main === module) {
  importAdditionalFragrances()
    .then(() => {
      console.log('✅ Kaggle dataset expansion complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

export { importAdditionalFragrances };

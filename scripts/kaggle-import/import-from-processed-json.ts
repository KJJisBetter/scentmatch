/**
 * Import from Already Processed Kaggle JSON
 * Goal: Use the expertly processed 1,443 fragrances + expand with more from massive dataset
 * Source: /home/kevinjavier/dev/scentmatch-scrapped-last/research/output/fragrances.json
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ProcessedFragrance {
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

/**
 * Convert processed JSON format to our database format
 */
function convertToDbFormat(frag: ProcessedFragrance, batchNumber: number): any {
  // Standardize gender
  let standardGender = 'unisex';
  if (frag.gender.includes('for women') && !frag.gender.includes('for men')) {
    standardGender = 'women';
  } else if (
    frag.gender.includes('for men') &&
    !frag.gender.includes('for women')
  ) {
    standardGender = 'men';
  }

  // Calculate sample price
  const samplePrice = calculateSamplePrice(
    frag.brandName,
    frag.score,
    frag.ratingValue
  );

  return {
    id: frag.id,
    brand_id: frag.brandId,
    brand_name: frag.brandName,
    name: cleanName(frag.name),
    slug: frag.slug,
    rating_value: frag.ratingValue,
    rating_count: frag.ratingCount,
    score: frag.score,
    gender: standardGender,
    accords: frag.accords,
    perfumers: frag.perfumers,
    fragrantica_url: frag.url,
    full_description: '', // Will be populated later
    main_accords: frag.accords,
    data_source: 'kaggle_processed',
    kaggle_score: frag.score,
    is_verified: true,
    import_batch: batchNumber,
    sample_price_usd: samplePrice,
    sample_available: true,
    scent_family: frag.accords[0] || 'miscellaneous', // For compatibility
  };
}

function cleanName(name: string): string {
  // Remove gender suffixes that are now in separate gender field
  return name
    .replace(/\s*for\s+(women|men)$/i, '')
    .replace(/\s*(Ariana Grande|Billie Eilish|Taylor Swift)$/i, '')
    .trim();
}

function calculateSamplePrice(
  brand: string,
  score: number,
  rating: number
): number {
  let price = 8;

  // Luxury pricing
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

  if (score > 18) price += 4;
  else if (score > 15) price += 2;

  if (rating > 4.5) price += 2;
  else if (rating > 4.0) price += 1;

  return Math.min(price, 25);
}

/**
 * Main import function - use processed JSON directly
 */
async function importProcessedFragrances() {
  const batchNumber = Date.now();

  try {
    console.log('🚀 Starting processed Kaggle dataset import...');

    // Read the expertly processed JSON data
    const processedPath =
      '/home/kevinjavier/dev/scentmatch-scrapped-last/research/output/fragrances.json';
    const jsonData = await import(processedPath);
    const processedFragrances: ProcessedFragrance[] =
      jsonData.default || jsonData;

    console.log(`📊 Found ${processedFragrances.length} processed fragrances`);

    // Get current database count
    const { count: currentCount } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true });

    console.log(`📋 Current database: ${currentCount} fragrances`);

    // Convert to database format
    const dbFormatFragrances = processedFragrances.map(frag =>
      convertToDbFormat(frag, batchNumber)
    );

    // Remove fragrances we already have by checking names
    const { data: existing } = await supabase
      .from('fragrances')
      .select('id, name, brand_name');

    const existingSet = new Set(
      existing?.map(f => `${f.brand_name}-${f.name}`.toLowerCase()) || []
    );

    const newFragrances = dbFormatFragrances.filter(
      frag => !existingSet.has(`${frag.brand_name}-${frag.name}`.toLowerCase())
    );

    console.log(`➕ Found ${newFragrances.length} new fragrances to import`);

    if (newFragrances.length === 0) {
      console.log('✅ Database already contains all processed fragrances');
      return;
    }

    // Import in batches for reliability
    const batchSize = 50;
    let imported = 0;

    for (let i = 0; i < newFragrances.length; i += batchSize) {
      const batch = newFragrances.slice(i, i + batchSize);

      console.log(
        `📥 Importing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newFragrances.length / batchSize)} (${batch.length} items)...`
      );

      const { error, data } = await supabase
        .from('fragrances')
        .insert(batch)
        .select('id');

      if (error) {
        console.error(
          `❌ Batch ${Math.floor(i / batchSize) + 1} failed:`,
          error.message
        );

        // Try individual inserts for this batch to identify problematic records
        for (const item of batch) {
          const { error: itemError } = await supabase
            .from('fragrances')
            .insert(item);

          if (itemError) {
            console.error(
              `❌ Failed to import: ${item.brand_name} - ${item.name}`
            );
          } else {
            imported++;
          }
        }
      } else {
        imported += batch.length;
        console.log(
          `✅ Batch successful: ${imported}/${newFragrances.length} imported`
        );
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Final count verification
    const { count: finalCount } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true });

    console.log(`🎉 Import complete!`);
    console.log(
      `📊 Database expanded: ${currentCount} → ${finalCount} fragrances`
    );
    console.log(`➕ Added: ${imported} new fragrances`);
  } catch (error) {
    console.error('💥 Import failed:', error);
    throw error;
  }
}

// Execute import
if (require.main === module) {
  importProcessedFragrances()
    .then(() => {
      console.log('✅ Kaggle dataset import complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

export { importProcessedFragrances };

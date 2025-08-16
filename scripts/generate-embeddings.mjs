/**
 * Generate Voyage AI embeddings for all fragrances
 * Cost: ~$0.013 for 1,467 fragrances
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const voyageApiKey = process.env.VOYAGE_API_KEY;

if (!supabaseUrl || !serviceRoleKey || !voyageApiKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Voyage AI client
class VoyageClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.voyageai.com/v1';
  }

  async embed(texts, model = 'voyage-3.5') {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        input: texts,
        model: model,
        input_type: 'document'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voyage AI API error: ${response.status} ${error}`);
    }

    const result = await response.json();
    return result.data.map(item => item.embedding);
  }
}

const voyage = new VoyageClient(voyageApiKey);

// Create embedding text from fragrance data
function createEmbeddingText(fragrance) {
  const parts = [
    `Name: ${fragrance.name}`,
    `Brand: ${fragrance.brand_name}`,
    fragrance.accords?.length ? `Accords: ${fragrance.accords.join(', ')}` : '',
    fragrance.perfumers?.length ? `Perfumers: ${fragrance.perfumers.join(', ')}` : '',
    `Gender: ${fragrance.gender || 'unisex'}`,
    `Rating: ${fragrance.rating_value}/5 (${fragrance.rating_count || 0} reviews)`
  ].filter(Boolean);
  
  return parts.join(' | ');
}

async function generateEmbeddings() {
  console.log('🚀 Starting Voyage AI embedding generation...\n');

  // Get fragrances that don't have embeddings yet using a simpler approach
  console.log('📊 Fetching fragrances...');
  
  // Use fallback method directly
  console.log('📋 Using direct method...');
  const { data: allFragrances } = await supabase
    .from('fragrances') 
    .select('id, name, brand_name, accords, perfumers, gender, rating_value, rating_count')
    .order('score', { ascending: false });
  
  const { data: existingEmbeddings } = await supabase
    .from('fragrance_embeddings')
    .select('fragrance_id')
    .eq('embedding_version', 'voyage-3.5');
  
  const existingIds = new Set(existingEmbeddings?.map(e => e.fragrance_id) || []);
  const fragrances = allFragrances?.filter(f => !existingIds.has(f.id)) || [];
  
  console.log(`📋 Found ${existingIds.size} existing, ${fragrances.length} remaining`);
  
  const error = null;

  if (error) {
    console.error('❌ Error fetching fragrances:', error);
    process.exit(1);
  }

  console.log(`📈 Found ${fragrances.length} fragrances needing embeddings`);

  if (fragrances.length === 0) {
    console.log('✅ All fragrances already have embeddings!');
    return;
  }

  // Process in batches
  const BATCH_SIZE = 100; // Conservative for API limits
  const batches = [];
  for (let i = 0; i < fragrances.length; i += BATCH_SIZE) {
    batches.push(fragrances.slice(i, i + BATCH_SIZE));
  }

  console.log(`🔄 Processing ${batches.length} batches of ${BATCH_SIZE} fragrances each...\n`);

  let totalProcessed = 0;
  let totalCost = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`📦 Batch ${batchIndex + 1}/${batches.length} (${batch.length} fragrances)`);

    try {
      // Create embedding texts
      const texts = batch.map(createEmbeddingText);
      const tokenEstimate = texts.reduce((sum, text) => sum + (text.split(' ').length * 1.3), 0);
      const batchCost = (tokenEstimate / 1000000) * 0.06; // voyage-3.5 pricing
      
      console.log(`   💰 Estimated cost: $${batchCost.toFixed(4)} (${Math.round(tokenEstimate)} tokens)`);

      // Generate embeddings
      console.log('   🧠 Generating embeddings...');
      const startTime = Date.now();
      const embeddings = await voyage.embed(texts);
      const duration = Date.now() - startTime;
      
      console.log(`   ⚡ Generated in ${duration}ms (${Math.round(duration/batch.length)}ms per fragrance)`);

      // Store in fragrance_embeddings table (supports 1024 dimensions)
      console.log('   💾 Storing embeddings...');
      const embeddingRecords = batch.map((fragrance, index) => ({
        fragrance_id: fragrance.id,
        embedding: embeddings[index],
        embedding_version: 'voyage-3.5',
        embedding_source: 'combined'
      }));

      const { error: updateError } = await supabase
        .from('fragrance_embeddings')
        .upsert(embeddingRecords, { onConflict: 'fragrance_id,embedding_version,embedding_source' });

      if (updateError) {
        console.error(`   ❌ Database update error:`, updateError);
        continue;
      }

      totalProcessed += batch.length;
      totalCost += batchCost;
      
      console.log(`   ✅ Batch complete (${totalProcessed}/${fragrances.length} total)\n`);

      // Rate limiting delay
      if (batchIndex < batches.length - 1) {
        console.log('   ⏳ Rate limiting delay...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }

    } catch (error) {
      console.error(`   ❌ Batch ${batchIndex + 1} failed:`, error.message);
      continue;
    }
  }

  console.log('🎉 Embedding generation complete!');
  console.log(`📊 Final stats:`);
  console.log(`   ✅ Processed: ${totalProcessed}/${fragrances.length} fragrances`);
  console.log(`   💰 Total cost: $${totalCost.toFixed(4)}`);
  console.log(`   🧠 Model: voyage-3.5 (1024 dimensions)`);
}

// Run embedding generation
generateEmbeddings().catch(error => {
  console.error('💥 Embedding generation failed:', error);
  process.exit(1);
});
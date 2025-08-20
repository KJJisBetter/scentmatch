/**
 * Simple Embedding Generation Script
 * 
 * Uses existing voyage-client to generate embeddings for all fragrances
 * Bypasses complex pipeline for immediate embedding generation
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const voyageApiKey = process.env.VOYAGE_AI_API_KEY;

if (!supabaseUrl || !serviceRoleKey || !voyageApiKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VOYAGE_AI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Voyage AI Configuration
const VOYAGE_CONFIG = {
  baseUrl: 'https://api.voyageai.com/v1',
  model: 'voyage-3-large',
  dimensions: 2000 // pgvector compatibility
};

// Processing configuration
const BATCH_CONFIG = {
  batchSize: 25,
  delayBetweenBatches: 3000,
  maxRetries: 3
};

// Statistics
let stats = {
  total: 0,
  processed: 0,
  successful: 0,
  failed: 0,
  totalCost: 0,
  startTime: Date.now()
};

async function generateEmbedding(text) {
  const response = await fetch(`${VOYAGE_CONFIG.baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${voyageApiKey}`,
    },
    body: JSON.stringify({
      input: [text],
      model: VOYAGE_CONFIG.model,
      input_type: 'document'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Voyage AI API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.data || result.data.length === 0) {
    throw new Error('No embedding returned from Voyage AI');
  }

  return {
    embedding: result.data[0].embedding,
    tokens_used: result.usage.total_tokens,
    cost: result.usage.total_tokens * (0.18 / 1000000) // voyage-3-large cost
  };
}

function prepareFragranceContent(fragrance) {
  const parts = [];
  
  // Add brand and name  
  const brandName = fragrance.fragrance_brands?.name || 'Unknown Brand';
  parts.push(`${brandName} ${fragrance.name}`);
  
  // Add description
  if (fragrance.full_description && fragrance.full_description.trim()) {
    parts.push(fragrance.full_description);
  }
  
  // Add main accords
  if (fragrance.main_accords && Array.isArray(fragrance.main_accords) && fragrance.main_accords.length > 0) {
    parts.push(`Main accords: ${fragrance.main_accords.join(', ')}`);
  }
  
  // Add fragrance family
  if (fragrance.fragrance_family && fragrance.fragrance_family.trim()) {
    parts.push(`Fragrance family: ${fragrance.fragrance_family}`);
  }
  
  return parts.join('. ');
}

async function processFragrance(fragrance) {
  try {
    // Prepare content for embedding
    const content = prepareFragranceContent(fragrance);
    
    // Generate embedding
    const embeddingResult = await generateEmbedding(content);
    
    // Ensure exactly 2000 dimensions for pgvector
    let finalEmbedding = embeddingResult.embedding;
    if (finalEmbedding.length > 2000) {
      finalEmbedding = finalEmbedding.slice(0, 2000);
    } else if (finalEmbedding.length < 2000) {
      finalEmbedding = [...finalEmbedding, ...Array(2000 - finalEmbedding.length).fill(0)];
    }

    // Store in database
    const { error: updateError } = await supabase
      .from('fragrances')
      .update({
        embedding: `[${finalEmbedding.join(',')}]`,
        embedding_model: VOYAGE_CONFIG.model,
        embedding_generated_at: new Date().toISOString(),
        embedding_version: 1
      })
      .eq('id', fragrance.id);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    stats.successful++;
    stats.totalCost += embeddingResult.cost;
    
    return {
      success: true,
      cost: embeddingResult.cost,
      tokens: embeddingResult.tokens_used
    };

  } catch (error) {
    stats.failed++;
    console.log(`   ❌ ${fragrance.name}: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
}

async function generateAllEmbeddings() {
  console.log('🤖 Generating AI Embeddings for All Fragrances\n');
  console.log(`🎯 Model: ${VOYAGE_CONFIG.model}`);
  console.log(`📏 Dimensions: ${VOYAGE_CONFIG.dimensions}`);
  console.log(`📦 Batch size: ${BATCH_CONFIG.batchSize}\n`);

  try {
    // Get fragrances that need embeddings
    const { data: fragrancesNeedingEmbeddings, error: countError } = await supabase
      .from('fragrances')
      .select('id')
      .is('embedding', null);

    if (countError) {
      throw new Error(`Failed to get fragrances: ${countError.message}`);
    }

    stats.total = fragrancesNeedingEmbeddings?.length || 0;
    console.log(`📊 Found ${stats.total} fragrances needing embeddings`);

    if (stats.total === 0) {
      console.log('🎉 All fragrances already have embeddings!');
      
      // Double-check with sample
      const { data: sample } = await supabase
        .from('fragrances')
        .select('id, embedding, embedding_model')
        .limit(3);
        
      console.log('📋 Sample check:');
      sample?.forEach((f, i) => {
        console.log(`   ${i+1}. ${f.id}: ${f.embedding ? 'HAS' : 'NO'} embedding (${f.embedding_model})`);
      });
      
      return;
    }

    // Calculate estimates
    const estimatedCost = stats.total * 30 * (0.18 / 1000000); // 30 tokens avg * $0.18/1M
    const estimatedMinutes = Math.ceil((stats.total / BATCH_CONFIG.batchSize) * (BATCH_CONFIG.delayBetweenBatches / 1000) / 60);

    console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`);
    console.log(`⏳ Estimated time: ~${estimatedMinutes} minutes\n`);

    // Process in batches
    let offset = 0;
    let batchNumber = 0;

    while (offset < stats.total) {
      batchNumber++;
      
      console.log(`🔄 Batch ${batchNumber}/${Math.ceil(stats.total / BATCH_CONFIG.batchSize)} (${offset + 1}-${Math.min(offset + BATCH_CONFIG.batchSize, stats.total)})`);
      
      // Get batch of fragrances
      const { data: fragrances, error: fetchError } = await supabase
        .from('fragrances')
        .select('id, name, brand_id, full_description, main_accords, fragrance_family, fragrance_brands(name)')
        .is('embedding', null)
        .range(offset, offset + BATCH_CONFIG.batchSize - 1);

      if (fetchError) {
        console.error(`❌ Failed to fetch batch: ${fetchError.message}`);
        break;
      }

      if (!fragrances || fragrances.length === 0) {
        console.log('   📭 No more fragrances to process');
        break;
      }

      // Process each fragrance
      for (const fragrance of fragrances) {
        stats.processed++;
        const result = await processFragrance(fragrance);
        
        if (result.success) {
          console.log(`   ✅ ${fragrance.name} ($${result.cost.toFixed(6)})`);
        }
      }

      // Progress report
      const progressPercent = Math.round((stats.processed / stats.total) * 100);
      const successRate = Math.round((stats.successful / stats.processed) * 100);
      console.log(`   📈 Progress: ${stats.processed}/${stats.total} (${progressPercent}%) | Success: ${successRate}%`);

      // Delay between batches for rate limiting
      if (offset + BATCH_CONFIG.batchSize < stats.total) {
        console.log(`   ⏸️  Waiting ${BATCH_CONFIG.delayBetweenBatches}ms...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.delayBetweenBatches));
      }

      offset += BATCH_CONFIG.batchSize;
    }

    // Final results
    const totalMinutes = Math.round((Date.now() - stats.startTime) / 60000);
    const successRate = Math.round((stats.successful / stats.processed) * 100);

    console.log('\n🎉 Embedding Generation Complete!');
    console.log(`   📊 Processed: ${stats.processed} fragrances`);
    console.log(`   ✅ Successful: ${stats.successful} (${successRate}%)`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log(`   💰 Total cost: $${stats.totalCost.toFixed(6)}`);
    console.log(`   ⏱️  Duration: ${totalMinutes} minutes`);
    console.log(`   🚀 Throughput: ${Math.round(stats.successful / totalMinutes)} embeddings/minute`);

    // Verify coverage
    await verifyCoverage();

  } catch (error) {
    console.error('💥 Generation failed:', error);
    process.exit(1);
  }
}

async function verifyCoverage() {
  console.log('\n🔍 Verifying embedding coverage...');

  const { data: totalFragrances } = await supabase
    .from('fragrances')
    .select('id', { count: 'exact', head: true });

  const { data: withEmbeddings } = await supabase
    .from('fragrances')
    .select('id', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  const coverage = totalFragrances > 0 ? ((withEmbeddings || 0) / totalFragrances * 100).toFixed(1) : '0';

  console.log(`   📈 Coverage: ${withEmbeddings}/${totalFragrances} (${coverage}%)`);

  if (withEmbeddings === totalFragrances) {
    console.log('   🎯 Perfect! All fragrances have embeddings');
    console.log('\n🔥 Your AI-powered recommendations are now ready!');
  } else {
    console.log(`   ⚠️  ${totalFragrances - (withEmbeddings || 0)} fragrances still need embeddings`);
  }

  // Test similarity search
  console.log('\n🔍 Testing vector similarity search...');
  
  const { data: testFragrance } = await supabase
    .from('fragrances')
    .select('embedding')
    .not('embedding', 'is', null)
    .limit(1)
    .single();

  if (testFragrance?.embedding) {
    const { data: similarFragrances, error: searchError } = await supabase
      .rpc('find_similar_fragrances', {
        query_embedding: testFragrance.embedding,
        similarity_threshold: 0.3,
        max_results: 5
      });

    if (searchError) {
      console.log(`   ❌ Search test failed: ${searchError.message}`);
    } else {
      console.log(`   ✅ Vector search works! Found ${similarFragrances?.length || 0} similar fragrances`);
    }
  }
}

// Run the generation
generateAllEmbeddings().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
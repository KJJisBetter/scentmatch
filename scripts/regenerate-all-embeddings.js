/**
 * Batch Embedding Regeneration System
 * 
 * Processes all fragrances in the database to generate embeddings using voyage-3-large.
 * Handles the complete regeneration after database cleanup.
 */

import { createClient } from '@supabase/supabase-js';
import { getAIService } from '../lib/ai/index.ts';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create service role client for full database access
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Configuration
const BATCH_CONFIG = {
  batchSize: 25, // Process 25 fragrances at a time
  delayBetweenBatches: 3000, // 3 second delay to respect rate limits
  maxRetries: 3,
  targetModel: 'voyage-3-large', // Use best model
  progressReportInterval: 5 // Report progress every 5 batches
};

// Statistics tracking
let stats = {
  totalFragrances: 0,
  processed: 0,
  successful: 0,
  failed: 0,
  totalCost: 0,
  startTime: Date.now(),
  errors: []
};

async function regenerateAllEmbeddings() {
  console.log('🤖 Starting Complete Embedding Regeneration...\n');
  console.log(`🎯 Target: All fragrances using ${BATCH_CONFIG.targetModel}`);
  console.log(`📦 Batch size: ${BATCH_CONFIG.batchSize}`);
  console.log(`⏱️  Delay between batches: ${BATCH_CONFIG.delayBetweenBatches}ms\n`);

  try {
    // Initialize AI service
    const aiService = getAIService();
    console.log('✅ AI service initialized');

    // Get total count of fragrances needing embeddings
    const { data: totalCount, error: countError } = await supabase
      .from('fragrances')
      .select('id', { count: 'exact', head: true })
      .is('embedding', null);

    if (countError) {
      throw new Error(`Failed to count fragrances: ${countError.message}`);
    }

    stats.totalFragrances = totalCount || 0;
    console.log(`📊 Found ${stats.totalFragrances} fragrances needing embeddings\n`);

    if (stats.totalFragrances === 0) {
      console.log('🎉 All fragrances already have embeddings!');
      return;
    }

    // Calculate estimated cost and time
    const estimatedTokensPerFragrance = 30; // Conservative estimate
    const estimatedCost = stats.totalFragrances * estimatedTokensPerFragrance * (0.18 / 1000000);
    const estimatedTimeMinutes = Math.ceil((stats.totalFragrances / BATCH_CONFIG.batchSize) * (BATCH_CONFIG.delayBetweenBatches / 1000) / 60);

    console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`);
    console.log(`⏳ Estimated time: ~${estimatedTimeMinutes} minutes\n`);

    // Process in batches
    let offset = 0;
    let batchNumber = 0;

    while (offset < stats.totalFragrances) {
      batchNumber++;
      
      try {
        console.log(`🔄 Processing batch ${batchNumber}/${Math.ceil(stats.totalFragrances / BATCH_CONFIG.batchSize)} (items ${offset + 1}-${Math.min(offset + BATCH_CONFIG.batchSize, stats.totalFragrances)})`);
        
        // Get batch of fragrances
        const { data: fragrances, error: fetchError } = await supabase
          .from('fragrances')
          .select('id, name, brand_id, full_description, main_accords, fragrance_family, fragrance_brands(name)')
          .is('embedding', null)
          .range(offset, offset + BATCH_CONFIG.batchSize - 1);

        if (fetchError) {
          throw new Error(`Failed to fetch batch: ${fetchError.message}`);
        }

        if (!fragrances || fragrances.length === 0) {
          console.log('   📭 No more fragrances to process');
          break;
        }

        // Process each fragrance in the batch
        const batchResults = await processBatch(fragrances, aiService);
        
        // Update statistics
        stats.processed += batchResults.processed;
        stats.successful += batchResults.successful;
        stats.failed += batchResults.failed;
        stats.totalCost += batchResults.totalCost;
        stats.errors.push(...batchResults.errors);

        // Report progress
        if (batchNumber % BATCH_CONFIG.progressReportInterval === 0) {
          reportProgress();
        }

        // Delay between batches to respect rate limits
        if (offset + BATCH_CONFIG.batchSize < stats.totalFragrances) {
          console.log(`   ⏸️  Waiting ${BATCH_CONFIG.delayBetweenBatches}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.delayBetweenBatches));
        }

        offset += BATCH_CONFIG.batchSize;

      } catch (batchError) {
        console.error(`❌ Batch ${batchNumber} failed:`, batchError.message);
        stats.errors.push(`Batch ${batchNumber}: ${batchError.message}`);
        
        // Continue with next batch rather than failing completely
        offset += BATCH_CONFIG.batchSize;
      }
    }

    // Final report
    console.log('\n📊 Embedding Regeneration Complete!');
    reportFinalResults();

  } catch (error) {
    console.error('💥 Regeneration failed:', error);
    process.exit(1);
  }
}

async function processBatch(fragrances, aiService) {
  const batchResults = {
    processed: 0,
    successful: 0,
    failed: 0,
    totalCost: 0,
    errors: []
  };

  for (const fragrance of fragrances) {
    batchResults.processed++;
    
    try {
      // Prepare content for embedding
      const content = prepareFragranceContent(fragrance);
      
      // Generate embedding using AI service
      const embeddingResult = await aiService.generateEmbedding(content);
      
      // Ensure 2000 dimensions for pgvector compatibility
      let finalEmbedding = embeddingResult.embedding;
      if (finalEmbedding.length > 2000) {
        finalEmbedding = finalEmbedding.slice(0, 2000);
      } else if (finalEmbedding.length < 2000) {
        finalEmbedding = [...finalEmbedding, ...Array(2000 - finalEmbedding.length).fill(0)];
      }

      // Store embedding in database
      const { error: updateError } = await supabase
        .from('fragrances')
        .update({
          embedding: `[${finalEmbedding.join(',')}]`,
          embedding_model: embeddingResult.model,
          embedding_generated_at: new Date().toISOString(),
          embedding_version: 1
        })
        .eq('id', fragrance.id);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      batchResults.successful++;
      batchResults.totalCost += embeddingResult.cost || 0;
      
      console.log(`   ✅ ${fragrance.name} (${embeddingResult.model})`);

    } catch (fragranceError) {
      batchResults.failed++;
      const errorMsg = `${fragrance.name}: ${fragranceError.message}`;
      batchResults.errors.push(errorMsg);
      console.log(`   ❌ ${errorMsg}`);
    }
  }

  return batchResults;
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

function reportProgress() {
  const elapsed = Date.now() - stats.startTime;
  const elapsedMinutes = Math.round(elapsed / 60000);
  const successRate = stats.processed > 0 ? (stats.successful / stats.processed * 100).toFixed(1) : '0';
  const avgCostPerEmbedding = stats.successful > 0 ? (stats.totalCost / stats.successful).toFixed(6) : '0';
  const progress = stats.totalFragrances > 0 ? (stats.processed / stats.totalFragrances * 100).toFixed(1) : '0';
  
  console.log(`\n📈 Progress Report:`);
  console.log(`   🎯 Overall: ${stats.processed}/${stats.totalFragrances} (${progress}%)`);
  console.log(`   ✅ Successful: ${stats.successful} (${successRate}%)`);
  console.log(`   ❌ Failed: ${stats.failed}`);
  console.log(`   💰 Total cost: $${stats.totalCost.toFixed(6)}`);
  console.log(`   📊 Avg cost per embedding: $${avgCostPerEmbedding}`);
  console.log(`   ⏱️  Elapsed time: ${elapsedMinutes} minutes\n`);
}

function reportFinalResults() {
  const totalTime = Date.now() - stats.startTime;
  const totalMinutes = Math.round(totalTime / 60000);
  const successRate = (stats.successful / stats.processed * 100).toFixed(1);
  const avgCostPerEmbedding = stats.successful > 0 ? (stats.totalCost / stats.successful).toFixed(6) : '0';
  
  console.log(`\n🎉 Final Results:`);
  console.log(`   📊 Processed: ${stats.processed} fragrances`);
  console.log(`   ✅ Successful: ${stats.successful} (${successRate}%)`);
  console.log(`   ❌ Failed: ${stats.failed}`);
  console.log(`   💰 Total cost: $${stats.totalCost.toFixed(6)}`);
  console.log(`   📈 Average cost per embedding: $${avgCostPerEmbedding}`);
  console.log(`   ⏱️  Total time: ${totalMinutes} minutes`);
  console.log(`   🚀 Throughput: ${Math.round(stats.successful / totalMinutes)} embeddings/minute`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`);
    stats.errors.forEach((error, index) => {
      if (index < 10) { // Show first 10 errors
        console.log(`   ${index + 1}. ${error}`);
      }
    });
    
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more errors`);
    }
  }

  // Database verification
  console.log('\n🔍 Verifying embedding coverage...');
  verifyEmbeddingCoverage();
}

async function verifyEmbeddingCoverage() {
  try {
    // Get embedding coverage statistics
    const { data: totalFragrances } = await supabase
      .from('fragrances')
      .select('id', { count: 'exact', head: true });

    const { data: withEmbeddings } = await supabase
      .from('fragrances')
      .select('id', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    const coveragePercentage = totalFragrances > 0 
      ? ((withEmbeddings || 0) / totalFragrances * 100).toFixed(1)
      : '0';

    console.log(`   📈 Embedding coverage: ${withEmbeddings}/${totalFragrances} (${coveragePercentage}%)`);

    if (withEmbeddings === totalFragrances) {
      console.log('   🎯 Perfect! All fragrances have embeddings');
    } else {
      console.log(`   ⚠️  ${totalFragrances - (withEmbeddings || 0)} fragrances still need embeddings`);
    }

    // Test vector similarity search
    console.log('\n🔍 Testing vector similarity search...');
    
    const { data: sampleEmbedding } = await supabase
      .from('fragrances')
      .select('embedding')
      .not('embedding', 'is', null)
      .limit(1)
      .single();

    if (sampleEmbedding?.embedding) {
      const { data: similarFragrances, error: searchError } = await supabase
        .rpc('find_similar_fragrances', {
          query_embedding: sampleEmbedding.embedding,
          similarity_threshold: 0.5,
          max_results: 5
        });

      if (searchError) {
        console.log(`   ❌ Similarity search failed: ${searchError.message}`);
      } else {
        console.log(`   ✅ Similarity search works! Found ${similarFragrances?.length || 0} similar fragrances`);
      }
    } else {
      console.log('   ⚠️  No embeddings available for similarity testing');
    }

  } catch (error) {
    console.error('   ❌ Verification failed:', error.message);
  }
}

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  // Check AI service configuration
  try {
    const aiService = getAIService();
    const health = await aiService.getSystemHealth();
    console.log(`   ✅ AI service: ${health.available_providers.length} providers available`);
  } catch (error) {
    console.error(`   ❌ AI service not available: ${error.message}`);
    return false;
  }

  // Check database connection
  try {
    const { data, error } = await supabase
      .from('fragrances')
      .select('id')
      .limit(1);
      
    if (error) {
      throw new Error(error.message);
    }
    
    console.log('   ✅ Database connection working');
  } catch (error) {
    console.error(`   ❌ Database connection failed: ${error.message}`);
    return false;
  }

  // Check if embedding column exists
  try {
    const { data, error } = await supabase
      .from('fragrances')
      .select('id, embedding, embedding_model')
      .limit(1);
      
    if (error) {
      throw new Error(`Embedding columns not available: ${error.message}`);
    }
    
    console.log('   ✅ Embedding columns available');
  } catch (error) {
    console.error(`   ❌ ${error.message}`);
    return false;
  }

  // Check environment variables
  const requiredEnvVars = ['VOYAGE_API_KEY', 'OPENAI_API_KEY'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`   ❌ Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  console.log('   ✅ Environment variables configured');
  
  return true;
}

async function createProgressTrackingJob() {
  // Create job tracking entry in the queue
  const jobData = {
    operation: 'batch_embedding_regeneration',
    total_fragrances: stats.totalFragrances,
    batch_size: BATCH_CONFIG.batchSize,
    target_model: BATCH_CONFIG.targetModel,
    started_at: new Date().toISOString(),
    estimated_cost: stats.totalFragrances * 30 * (0.18 / 1000000)
  };

  const { data: job, error } = await supabase
    .from('ai_processing_queue')
    .insert({
      task_type: 'batch_processing',
      task_data: jobData,
      priority: 1,
      status: 'processing'
    })
    .select('id')
    .single();

  if (error) {
    console.warn(`⚠️  Could not create progress tracking job: ${error.message}`);
    return null;
  }

  console.log(`📋 Created progress tracking job: ${job.id}`);
  return job.id;
}

async function updateProgressJob(jobId, status = 'processing') {
  if (!jobId) return;

  try {
    const progressData = {
      processed: stats.processed,
      successful: stats.successful,
      failed: stats.failed,
      total_cost: stats.totalCost,
      current_batch: Math.ceil(stats.processed / BATCH_CONFIG.batchSize),
      completion_percentage: Math.round((stats.processed / stats.totalFragrances) * 100)
    };

    await supabase
      .from('ai_processing_queue')
      .update({
        status: status,
        task_data: {
          ...progressData,
          last_updated: new Date().toISOString()
        },
        ...(status === 'completed' && { completed_at: new Date().toISOString() })
      })
      .eq('id', jobId);

  } catch (error) {
    console.warn(`⚠️  Could not update progress job: ${error.message}`);
  }
}

// Main execution
async function main() {
  console.log('🚀 ScentMatch Embedding Regeneration System\n');

  // Check prerequisites
  const prerequisitesOk = await checkPrerequisites();
  if (!prerequisitesOk) {
    console.error('\n❌ Prerequisites check failed. Please fix the issues above.');
    process.exit(1);
  }

  console.log('\n✅ All prerequisites satisfied. Starting regeneration...\n');

  // Create progress tracking
  const jobId = await createProgressTrackingJob();

  try {
    // Run the regeneration
    await regenerateAllEmbeddings();
    
    // Update final status
    await updateProgressJob(jobId, 'completed');
    
    console.log('\n🎉 Embedding regeneration completed successfully!');
    console.log('\n🔥 Your AI-powered fragrance recommendations are now ready!');
    
  } catch (error) {
    await updateProgressJob(jobId, 'failed');
    throw error;
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n⏹️  Regeneration interrupted by user');
  console.log('📊 Partial results:');
  reportProgress();
  process.exit(0);
});

// Run the regeneration
main().catch(error => {
  console.error('💥 Regeneration failed:', error);
  process.exit(1);
});
/**
 * Production-grade embedding generation with cursor pagination
 * Handles Supabase's 1000 row limit and ensures all 1,467 fragrances get embeddings
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync, existsSync } from 'fs';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const voyageApiKey = process.env.VOYAGE_API_KEY;

if (!supabaseUrl || !serviceRoleKey || !voyageApiKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// State management for recovery
const STATE_FILE = 'embedding-progress.json';

class EmbeddingGenerator {
  constructor() {
    this.state = this.loadState();
    this.voyage = new VoyageClient(voyageApiKey);
  }

  loadState() {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
    }
    return {
      lastProcessedId: '',
      totalProcessed: 0,
      totalCost: 0,
      failedIds: [],
      startTime: Date.now()
    };
  }

  saveState() {
    writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  async getActualCounts() {
    console.log('🔍 Getting actual counts...');
    
    const [fragmentsResult, embeddingsResult] = await Promise.all([
      supabase.from('fragrances').select('*', { count: 'exact', head: true }),
      supabase.from('fragrance_embeddings').select('*', { count: 'exact', head: true })
    ]);

    const totalFragrances = fragmentsResult.count || 0;
    const totalEmbeddings = embeddingsResult.count || 0;
    const remaining = totalFragrances - totalEmbeddings;

    console.log(`📊 Total fragrances: ${totalFragrances}`);
    console.log(`📊 Total embeddings: ${totalEmbeddings}`);
    console.log(`📊 Remaining needed: ${remaining}`);

    return { totalFragrances, totalEmbeddings, remaining };
  }

  async getMissingFragrances() {
    console.log('🔍 Finding fragrances without embeddings using cursor pagination...');
    
    const missing = [];
    let lastId = this.state.lastProcessedId || '';
    let hasMore = true;
    const batchSize = 200; // Larger batches for fetching

    while (hasMore && missing.length < 500) { // Safety limit
      console.log(`   Fetching batch from ID: ${lastId || 'start'}`);
      
      // Get next batch of fragrances using cursor pagination
      let query = supabase
        .from('fragrances')
        .select('id, name, brand_name, accords, perfumers, gender, rating_value, rating_count')
        .order('id');

      if (lastId) {
        query = query.gt('id', lastId);
      }

      const { data: batch, error } = await query.limit(batchSize);

      if (error) {
        console.error('❌ Error fetching batch:', error);
        break;
      }

      if (!batch || batch.length === 0) {
        hasMore = false;
        break;
      }

      // Check which ones don't have embeddings
      for (const fragrance of batch) {
        const { data: existing } = await supabase
          .from('fragrance_embeddings')
          .select('id')
          .eq('fragrance_id', fragrance.id)
          .eq('embedding_version', 'voyage-3.5')
          .single();

        if (!existing) {
          missing.push(fragrance);
        }
      }

      lastId = batch[batch.length - 1].id;
      console.log(`   Found ${missing.length} missing so far...`);

      // Prevent infinite loops
      if (batch.length < batchSize) {
        hasMore = false;
      }
    }

    console.log(`📋 Total missing fragrances found: ${missing.length}`);
    return missing;
  }

  async generateBatchEmbeddings(fragrances) {
    if (fragrances.length === 0) return { success: 0, failed: 0, cost: 0 };

    console.log(`🧠 Generating embeddings for ${fragrances.length} fragrances...`);

    // Create embedding texts
    const texts = fragrances.map(f => this.createEmbeddingText(f));
    const tokenEstimate = texts.reduce((sum, text) => sum + (text.split(' ').length * 1.3), 0);
    const estimatedCost = (tokenEstimate / 1000000) * 0.06;

    console.log(`   💰 Estimated cost: $${estimatedCost.toFixed(4)} (${Math.round(tokenEstimate)} tokens)`);

    try {
      // Generate embeddings with retry
      const embeddings = await this.retry(async () => {
        return await this.voyage.embed(texts);
      });

      console.log(`   ✅ Generated ${embeddings.length} embeddings`);

      // Store in database with retry
      const embeddingRecords = fragrances.map((fragrance, index) => ({
        fragrance_id: fragrance.id,
        embedding: embeddings[index],
        embedding_version: 'voyage-3.5',
        embedding_source: 'combined'
      }));

      await this.retry(async () => {
        const { error } = await supabase
          .from('fragrance_embeddings')
          .insert(embeddingRecords);
        if (error) throw error;
      });

      console.log(`   💾 Stored ${embeddingRecords.length} embeddings successfully`);

      return {
        success: fragrances.length,
        failed: 0,
        cost: estimatedCost
      };

    } catch (error) {
      console.error(`   ❌ Batch failed:`, error.message);
      
      // Add failed IDs to state
      this.state.failedIds.push(...fragrances.map(f => f.id));
      
      return {
        success: 0,
        failed: fragrances.length,
        cost: 0
      };
    }
  }

  async retry(operation, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`   ⏳ Retry ${attempt}/${maxAttempts} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  createEmbeddingText(fragrance) {
    const parts = [
      `Name: ${fragrance.name}`,
      `Brand: ${fragrance.brand_name}`,
      fragrance.accords?.length ? `Accords: ${fragrance.accords.join(', ')}` : '',
      fragrance.perfumers?.length ? `Perfumers: ${fragrance.perfumers.join(', ')}` : '',
      `Gender: ${fragrance.gender || 'unisex'}`,
      `Rating: ${fragrance.rating_value || 0}/5 (${fragrance.rating_count || 0} reviews)`
    ].filter(Boolean);
    
    return parts.join(' | ');
  }

  async processAll() {
    console.log('🚀 Starting comprehensive embedding generation...\n');

    const counts = await this.getActualCounts();
    if (counts.remaining === 0) {
      console.log('✅ All fragrances already have embeddings!');
      return;
    }

    const missingFragrances = await this.getMissingFragrances();
    
    if (missingFragrances.length === 0) {
      console.log('✅ No missing fragrances found!');
      return;
    }

    // Process in smaller batches for reliability
    const PROCESSING_BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < missingFragrances.length; i += PROCESSING_BATCH_SIZE) {
      batches.push(missingFragrances.slice(i, i + PROCESSING_BATCH_SIZE));
    }

    console.log(`🔄 Processing ${batches.length} batches of ${PROCESSING_BATCH_SIZE} fragrances each...\n`);

    let totalSuccess = 0;
    let totalFailed = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`📦 Batch ${batchIndex + 1}/${batches.length} (${batch.length} fragrances)`);

      const result = await this.generateBatchEmbeddings(batch);
      
      totalSuccess += result.success;
      totalFailed += result.failed;
      this.state.totalCost += result.cost;
      this.state.totalProcessed += result.success;

      if (batch.length > 0) {
        this.state.lastProcessedId = batch[batch.length - 1].id;
      }

      this.saveState();

      // Progress update
      const progress = ((totalSuccess + totalFailed) / missingFragrances.length) * 100;
      console.log(`   📊 Progress: ${progress.toFixed(1)}% (${totalSuccess} success, ${totalFailed} failed)`);
      console.log(`   💰 Total cost so far: $${this.state.totalCost.toFixed(4)}\n`);

      // Rate limiting between batches
      if (batchIndex < batches.length - 1) {
        console.log('   ⏳ Rate limiting delay...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('🎉 Embedding generation complete!');
    console.log(`📊 Final stats:`);
    console.log(`   ✅ Successfully processed: ${totalSuccess}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   💰 Total cost: $${this.state.totalCost.toFixed(4)}`);
    console.log(`   ⏱️  Total time: ${((Date.now() - this.state.startTime) / 1000).toFixed(1)}s`);

    // Final verification
    const finalCounts = await this.getActualCounts();
    console.log(`\n🔍 Final verification:`);
    console.log(`   Total embeddings: ${finalCounts.totalEmbeddings}/${finalCounts.totalFragrances}`);
    console.log(`   Completion: ${((finalCounts.totalEmbeddings / finalCounts.totalFragrances) * 100).toFixed(1)}%`);

    // Clean up state file if successful
    if (totalFailed === 0 && finalCounts.remaining === 0) {
      try {
        require('fs').unlinkSync(STATE_FILE);
        console.log('✅ State file cleaned up');
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

// Voyage AI client (simplified)
class VoyageClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.voyageai.com/v1';
  }

  async embed(texts) {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        input: texts,
        model: 'voyage-3.5',
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

// Run the generator
const generator = new EmbeddingGenerator();
generator.processAll().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
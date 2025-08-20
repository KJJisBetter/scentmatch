#!/usr/bin/env npx tsx
/**
 * Complete Embedding Generation
 * Process ALL remaining fragrances efficiently in batches
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiKey = process.env.OPENAI_API_KEY!;

async function generateEmbedding(text: string): Promise<{success: boolean, embedding?: number[], error?: string}> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-large',
        dimensions: 2048
      })
    });
    
    const result = await response.json();
    
    if (response.status === 200 && result.data && result.data[0]) {
      // Truncate to exactly 2000 dimensions for pgvector compatibility
      const fullEmbedding = result.data[0].embedding;
      const truncatedEmbedding = fullEmbedding.slice(0, 2000);
      
      return {
        success: true,
        embedding: truncatedEmbedding
      };
    } else {
      return {
        success: false,
        error: `API Error ${response.status}: ${JSON.stringify(result)}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: `Network error: ${error.message}`
    };
  }
}

async function processAllRemainingFragrances() {
  console.log('🚀 Complete embedding generation for ALL remaining fragrances...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  let totalProcessed = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;
  const batchSize = 100; // Process 100 at a time
  let hasMore = true;
  
  while (hasMore) {
    console.log(`\\n🔄 Processing batch starting from ${totalProcessed}...`);
    
    // Get next batch of fragrances without embeddings
    const { data: fragrances, error } = await supabase
      .from('fragrances')
      .select(`
        id, name, brand_id, main_accords, full_description, 
        fragrance_brands(name)
      `)
      .is('embedding', null)
      .limit(batchSize);
    
    if (error) {
      console.error('❌ Failed to fetch fragrances:', error);
      break;
    }
    
    if (!fragrances || fragrances.length === 0) {
      console.log('✅ No more fragrances to process!');
      hasMore = false;
      break;
    }
    
    console.log(`📊 Processing ${fragrances.length} fragrances in this batch...`);
    
    // Process each fragrance in the batch
    for (const fragrance of fragrances) {
      try {
        totalProcessed++;
        
        // Build content text
        const brandName = (fragrance.fragrance_brands as any)?.name || '';
        const accordsText = fragrance.main_accords?.join(', ') || '';
        const description = fragrance.full_description || '';
        
        const contentText = `${fragrance.name} by ${brandName}. ${description} Accords: ${accordsText}`.trim();
        
        // Generate embedding
        const result = await generateEmbedding(contentText);
        
        if (result.success && result.embedding) {
          // Store in database
          const { error: updateError } = await supabase
            .from('fragrances')
            .update({
              embedding: result.embedding,
              embedding_generated_at: new Date().toISOString(),
              embedding_model: 'text-embedding-3-large',
              embedding_version: 1
            })
            .eq('id', fragrance.id);
          
          if (updateError) {
            console.log(`❌ ${fragrance.name}: DB Error - ${updateError.message}`);
            totalFailed++;
          } else {
            totalSuccessful++;
            if (totalSuccessful % 50 == 0) {
              console.log(`✅ Progress: ${totalSuccessful} successful, ${totalFailed} failed`);
            }
          }
        } else {
          console.log(`❌ ${fragrance.name}: ${result.error}`);
          totalFailed++;
        }
        
        // Rate limiting delay (OpenAI allows ~3000 RPM)
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms = ~1200 RPM
        
      } catch (error) {
        console.error(`💥 ${fragrance.name}: ${error}`);
        totalFailed++;
      }
    }
    
    // Progress summary after each batch
    const successRate = (totalSuccessful / totalProcessed * 100).toFixed(1);
    console.log(`\\n📊 Batch ${Math.ceil(totalProcessed/batchSize)} completed:`);
    console.log(`  Processed: ${totalProcessed}`);
    console.log(`  Successful: ${totalSuccessful}`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`  Success rate: ${successRate}%`);
    
    // Check remaining count
    const { data: remainingCount } = await supabase
      .from('fragrances')
      .select('count')
      .is('embedding', null);
    
    const remaining = remainingCount?.[0]?.count || 0;
    console.log(`  Remaining: ${remaining} fragrances`);
    
    if (remaining === 0) {
      hasMore = false;
    }
  }
  
  // Final summary
  console.log(`\\n🎉 COMPLETE EMBEDDING GENERATION FINISHED!`);
  console.log(`📊 FINAL RESULTS:`);
  console.log(`  Total processed: ${totalProcessed}`);
  console.log(`  Total successful: ${totalSuccessful}`);
  console.log(`  Total failed: ${totalFailed}`);
  console.log(`  Overall success rate: ${(totalSuccessful/totalProcessed*100).toFixed(1)}%`);
  
  // Get final embedding count
  const { data: finalCount } = await supabase
    .from('fragrances')
    .select('count')
    .not('embedding', 'is', null);
  
  const totalEmbedded = finalCount?.[0]?.count || 0;
  console.log(`  Total fragrances with embeddings: ${totalEmbedded}/1978`);
  console.log(`  Embedding completion: ${(totalEmbedded/1978*100).toFixed(1)}%`);
  
  if (totalEmbedded >= 1950) {
    console.log(`\\n🏆 PERFECT! AI pipeline is now fully operational!`);
    console.log(`🧠 All AI features now work: recommendations, similarity, quiz matching`);
  } else {
    console.log(`\\n⚠️  ${1978 - totalEmbedded} fragrances still need embeddings`);
    console.log(`🔄 Run this script again to continue processing`);
  }
  
  return {
    processed: totalProcessed,
    successful: totalSuccessful,
    failed: totalFailed,
    totalEmbedded: totalEmbedded
  };
}

// Run the complete generation
if (require.main === module) {
  processAllRemainingFragrances()
    .then(results => {
      console.log(`\\n✅ Process completed with ${results.successful}/${results.processed} success rate`);
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Process failed:', error);
      process.exit(1);
    });
}
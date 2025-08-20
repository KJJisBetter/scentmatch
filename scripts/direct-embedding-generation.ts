#!/usr/bin/env npx tsx
/**
 * Direct Embedding Generation
 * Generate embeddings for all fragrances using direct API calls
 * Bypasses the problematic AI service wrapper
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const voyageKey = process.env.VOYAGE_API_KEY!;
const openaiKey = process.env.OPENAI_API_KEY!;

async function generateEmbeddingDirect(text: string): Promise<{success: boolean, embedding?: number[], error?: string}> {
  try {
    // Use OpenAI to get 3072 dimensions, then truncate to 2048
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-large',
        dimensions: 2048  // Request exactly 2048 dimensions
      })
    });
    
    const result = await response.json();
    
    if (response.status === 200 && result.data && result.data[0]) {
      // Truncate to exactly 2000 dimensions to match database schema
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

async function generateAllEmbeddings() {
  console.log('🚀 Direct embedding generation for all fragrances...');
  
  // Initialize Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get fragrances without embeddings
  console.log('🔍 Finding fragrances without embeddings...');
  
  const { data: fragrances, error } = await supabase
    .from('fragrances')
    .select(`
      id, name, brand_id, main_accords, full_description, 
      fragrance_brands(name)
    `)
    .is('embedding', null)
    .limit(50); // Process 50 at a time
  
  if (error) {
    console.error('❌ Failed to fetch fragrances:', error);
    return;
  }
  
  console.log(`📊 Found ${fragrances?.length || 0} fragrances to process`);
  
  if (!fragrances || fragrances.length === 0) {
    console.log('✅ All fragrances already have embeddings!');
    return;
  }
  
  let processed = 0;
  let successful = 0;
  let failed = 0;
  
  // Process each fragrance
  for (const fragrance of fragrances) {
    try {
      processed++;
      
      // Build content text for embedding
      const brandName = (fragrance.fragrance_brands as any)?.name || '';
      const accordsText = fragrance.main_accords?.join(', ') || '';
      const description = fragrance.full_description || '';
      
      const contentText = `${fragrance.name} by ${brandName}. ${description} Accords: ${accordsText}`.trim();
      
      console.log(`🔄 ${processed}/${fragrances.length}: ${fragrance.name}`);
      
      // Generate embedding
      const result = await generateEmbeddingDirect(contentText);
      
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
          console.log(`  ❌ DB Error: ${updateError.message}`);
          failed++;
        } else {
          console.log(`  ✅ Success (${result.embedding.length} dims)`);
          successful++;
        }
      } else {
        console.log(`  ❌ API Error: ${result.error}`);
        failed++;
      }
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
      
    } catch (error) {
      console.error(`  💥 Error: ${error}`);
      failed++;
    }
  }
  
  console.log(`\\n🎉 Batch completed!`);
  console.log(`📊 Results:`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Successful: ${successful}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Success rate: ${(successful/processed*100).toFixed(1)}%`);
  
  // Check total embeddings now
  const { data: embeddedCount } = await supabase
    .from('fragrances')
    .select('count')
    .not('embedding', 'is', null);
  
  const totalEmbedded = embeddedCount?.[0]?.count || 0;
  
  console.log(`\\n📊 OVERALL STATUS:`);
  console.log(`  Total fragrances with embeddings: ${totalEmbedded}`);
  console.log(`  Remaining to process: ${1978 - totalEmbedded}`);
  
  if (totalEmbedded > 0) {
    console.log(`\\n🎉 EMBEDDING GENERATION IS WORKING!`);
    console.log(`🔄 Run this script multiple times to process all 1,978 fragrances`);
  }
}

generateAllEmbeddings().catch(console.error);
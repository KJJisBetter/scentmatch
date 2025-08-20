#!/usr/bin/env npx tsx
/**
 * Manual Embedding Generation Script
 * Generate embeddings for all fragrances using the existing embedding pipeline
 */

import { createClient } from '@supabase/supabase-js';
import { AIService } from '../lib/ai/index';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const voyageKey = process.env.VOYAGE_AI_API_KEY!;
const openaiKey = process.env.OPENAI_API_KEY!;

async function generateEmbeddingsManually() {
  console.log('🚀 Starting manual embedding generation...');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }
  
  if (!voyageKey && !openaiKey) {
    console.error('❌ Missing AI API keys');
    process.exit(1);
  }
  
  console.log('✅ API keys present:');
  console.log(`  Voyage AI: ${voyageKey ? '✅' : '❌'}`);
  console.log(`  OpenAI: ${openaiKey ? '✅' : '❌'}`);
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Initialize AI service
  const aiService = new AIService();
  
  // Get fragrances without embeddings
  console.log('🔍 Finding fragrances without embeddings...');
  
  const { data: fragrances, error } = await supabase
    .from('fragrances')
    .select('id, name, brand_id, main_accords, full_description, fragrance_brands(name)')
    .is('embedding', null)
    .limit(20); // Start with small batch
  
  if (error) {
    console.error('❌ Failed to fetch fragrances:', error);
    process.exit(1);
  }
  
  console.log(`📊 Found ${fragrances?.length || 0} fragrances without embeddings`);
  
  if (!fragrances || fragrances.length === 0) {
    console.log('✅ All fragrances already have embeddings!');
    process.exit(0);
  }
  
  // Process first 5 fragrances as test
  console.log('🧪 Testing with first 5 fragrances...');
  
  const testFragrances = fragrances.slice(0, 5);
  
  for (const fragrance of testFragrances) {
    try {
      console.log(`🔄 Processing: ${fragrance.name} (${fragrance.id})`);
      
      // Prepare content for embedding
      const content = {
        name: fragrance.name || '',
        brand: (fragrance.fragrance_brands as any)?.name || '',
        description: fragrance.full_description || '',
        accords: fragrance.main_accords || [],
        family: ''
      };
      
      // Generate embedding using AI service
      const contentText = `${content.name} by ${content.brand}. ${content.description}. Accords: ${content.accords.join(', ')}`;
      const result = await aiService.generateEmbedding(contentText);
      
      if (result.success && result.embedding) {
        console.log(`  ✅ Generated embedding (${result.embedding.length} dims)`);
        
        // Store in database
        const { error: updateError } = await supabase
          .from('fragrances')
          .update({
            embedding: result.embedding,
            embedding_generated_at: new Date().toISOString(),
            embedding_model: result.model || 'unknown',
            embedding_version: '1.0'
          })
          .eq('id', fragrance.id);
        
        if (updateError) {
          console.log(`  ❌ Failed to store: ${updateError.message}`);
        } else {
          console.log(`  💾 Stored embedding successfully`);
        }
      } else {
        console.log(`  ❌ Failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error(`  💥 Error processing ${fragrance.id}:`, error);
    }
  }
  
  console.log('\\n🎉 Manual embedding test completed!');
  
  // Check results
  const { data: updatedFragrances } = await supabase
    .from('fragrances')
    .select('id, name, embedding_generated_at')
    .not('embedding', 'is', null)
    .limit(10);
  
  console.log(`\\n📊 Results:`);
  console.log(`  Fragrances with embeddings: ${updatedFragrances?.length || 0}`);
  
  if (updatedFragrances && updatedFragrances.length > 0) {
    console.log('✅ Embedding generation is working!');
    console.log('🎯 Ready to process all 1,978 fragrances');
  } else {
    console.log('❌ Embedding generation still not working');
    console.log('🔧 Need to debug further');
  }
}

// Run the script
generateEmbeddingsManually().catch(console.error);
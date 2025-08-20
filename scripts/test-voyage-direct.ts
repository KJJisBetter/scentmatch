#!/usr/bin/env npx tsx
/**
 * Direct Voyage AI Test
 * Test Voyage AI API directly to diagnose embedding issues
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testVoyageAIDirect() {
  const voyageKey = process.env.VOYAGE_API_KEY;
  
  if (!voyageKey) {
    console.error('❌ VOYAGE_API_KEY not found');
    process.exit(1);
  }
  
  console.log('🧪 Testing Voyage AI API directly...');
  console.log(`🔑 Key: ${voyageKey.substring(0, 10)}...`);
  
  const testText = "Aventus by Creed is a fruity woody fragrance with bergamot, pineapple, and oakmoss.";
  
  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${voyageKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: [testText],
        model: 'voyage-3'
      })
    });
    
    const result = await response.json();
    
    console.log(`📊 Voyage AI Response Status: ${response.status}`);
    
    if (response.status === 200 && result.data && result.data[0]) {
      const embedding = result.data[0].embedding;
      console.log(`✅ SUCCESS!`);
      console.log(`  Embedding length: ${embedding.length}`);
      console.log(`  Model: ${result.model || 'unknown'}`);
      console.log(`  Usage: ${JSON.stringify(result.usage || {})}`);
      console.log(`  First 5 values: [${embedding.slice(0, 5).join(', ')}...]`);
      
      return { success: true, embedding, model: result.model };
    } else {
      console.log(`❌ FAILED:`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(result, null, 2)}`);
      
      return { success: false, error: result };
    }
    
  } catch (error) {
    console.error('💥 Network/API Error:', error);
    return { success: false, error: error.message };
  }
}

// Test OpenAI as fallback
async function testOpenAIDirect() {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    console.error('❌ OPENAI_API_KEY not found');
    return { success: false };
  }
  
  console.log('\\n🧪 Testing OpenAI API as fallback...');
  console.log(`🔑 Key: ${openaiKey.substring(0, 10)}...`);
  
  const testText = "Aventus by Creed is a fruity woody fragrance with bergamot, pineapple, and oakmoss.";
  
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: testText,
        model: 'text-embedding-3-large'
      })
    });
    
    const result = await response.json();
    
    console.log(`📊 OpenAI Response Status: ${response.status}`);
    
    if (response.status === 200 && result.data && result.data[0]) {
      const embedding = result.data[0].embedding;
      console.log(`✅ SUCCESS!`);
      console.log(`  Embedding length: ${embedding.length}`);
      console.log(`  Model: ${result.model || 'text-embedding-3-large'}`);
      console.log(`  Usage: ${JSON.stringify(result.usage || {})}`);
      
      return { success: true, embedding, model: result.model };
    } else {
      console.log(`❌ FAILED:`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(result, null, 2)}`);
      
      return { success: false, error: result };
    }
    
  } catch (error) {
    console.error('💥 Network/API Error:', error);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🎯 Testing both AI providers directly...');
  
  const voyageResult = await testVoyageAIDirect();
  const openaiResult = await testOpenAIDirect();
  
  console.log('\\n📊 RESULTS SUMMARY:');
  console.log(`Voyage AI: ${voyageResult.success ? '✅ Working' : '❌ Failed'}`);
  console.log(`OpenAI: ${openaiResult.success ? '✅ Working' : '❌ Failed'}`);
  
  if (voyageResult.success || openaiResult.success) {
    console.log('\\n🎉 At least one AI provider is working!');
    console.log('🔧 The issue is in the ScentMatch AI service wrapper, not the APIs');
  } else {
    console.log('\\n❌ Both AI providers failed');
    console.log('🔧 Check API keys and network connectivity');
  }
}

main().catch(console.error);
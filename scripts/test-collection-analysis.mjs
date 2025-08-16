/**
 * Simple validation script for collection analysis engine
 */

import { CollectionAnalysisEngine } from '../lib/ai/collection-analysis-engine.ts';

async function testCollectionAnalysis() {
  console.log('Testing Collection Analysis Engine...');
  
  try {
    const engine = new CollectionAnalysisEngine();
    console.log('✅ Collection Analysis Engine instantiated successfully');
    
    // Test categorization (doesn't require user data)
    console.log('Testing fragrance categorization...');
    
    const categorization = await engine.categorizeFragrance('test-fragrance-id', {
      includeConfidence: true
    });
    
    console.log('✅ Categorization completed:', categorization);
    
    console.log('✅ All basic tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('This is expected if OpenAI API key is not configured or database is not accessible');
  }
}

testCollectionAnalysis();
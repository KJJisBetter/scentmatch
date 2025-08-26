/**
 * Test file for Beginner Explanation System
 * 
 * This file validates the enhanced AI prompt engineering system
 * for generating beginner-friendly explanations (SCE-66 & SCE-67)
 */

import { beginnerExplanationEngine, type BeginnerExplanationRequest } from './beginner-explanation-engine';
import { validateBeginnerExplanation } from './adaptive-prompts';
import { aiClient } from './client';

// Test configuration
const testRequest: BeginnerExplanationRequest = {
  fragranceId: 'test-fragrance-001',
  fragranceName: 'Sauvage',
  brand: 'Dior',
  scentFamily: 'fresh',
  userContext: 'new to fragrances, likes fresh morning scents, office worker',
  priceRange: { min: 50, max: 100 },
};

/**
 * Test the beginner explanation engine
 */
export async function testBeginnerExplanationEngine(): Promise<{
  success: boolean;
  explanation?: string;
  validation?: any;
  errors?: string[];
}> {
  try {
    console.log('🧪 Testing Beginner Explanation Engine...');
    
    const result = await beginnerExplanationEngine.generateExplanation(testRequest);
    
    console.log('📝 Generated Explanation:', result.explanation);
    console.log('📊 Word Count:', result.validation.wordCount);
    console.log('✅ Meets Requirements:', result.validation.meetsRequirements);
    console.log('🎯 Final Score:', result.metadata.finalScore);
    console.log('🔄 Attempts:', result.metadata.generationAttempts);
    
    // Additional validation
    const validation = validateBeginnerExplanation(result.explanation);
    
    return {
      success: validation.valid,
      explanation: result.explanation,
      validation: {
        wordCount: validation.wordCount,
        hasFormat: validation.hasFormat,
        hasReference: validation.hasReference,
        hasPracticalTip: validation.hasPracticalTip,
        issues: validation.issues,
      },
    };
  } catch (error) {
    console.error('❌ Beginner Explanation Engine Test Failed:', error);
    return {
      success: false,
      errors: [String(error)],
    };
  }
}

/**
 * Test batch explanation generation
 */
export async function testBatchExplanations(): Promise<{
  success: boolean;
  results?: any[];
  errors?: string[];
}> {
  try {
    console.log('🧪 Testing Batch Explanation Generation...');
    
    const testRequests: BeginnerExplanationRequest[] = [
      testRequest,
      {
        ...testRequest,
        fragranceId: 'test-fragrance-002',
        fragranceName: 'Aqua di Gio',
        brand: 'Armani',
        scentFamily: 'aquatic',
      },
    ];
    
    const results = await beginnerExplanationEngine.generateBatchExplanations(testRequests);
    
    console.log('📊 Batch Results Count:', results.length);
    results.forEach((result, index) => {
      console.log(`📝 Result ${index + 1}:`, result.explanation.substring(0, 50) + '...');
      console.log(`   Word Count: ${result.validation.wordCount}`);
      console.log(`   Valid: ${result.validation.meetsRequirements}`);
    });
    
    return {
      success: true,
      results: results.map(r => ({
        explanation: r.explanation,
        wordCount: r.validation.wordCount,
        valid: r.validation.meetsRequirements,
      })),
    };
  } catch (error) {
    console.error('❌ Batch Explanation Test Failed:', error);
    return {
      success: false,
      errors: [String(error)],
    };
  }
}

/**
 * Test AI client beginner methods
 */
export async function testAIClientBeginnerMethods(): Promise<{
  success: boolean;
  explanation?: string;
  errors?: string[];
}> {
  try {
    console.log('🧪 Testing AI Client Beginner Methods...');
    
    const result = await aiClient.explainForBeginner(
      testRequest.fragranceId,
      testRequest.userContext,
      `${testRequest.fragranceName} by ${testRequest.brand} (${testRequest.scentFamily})`
    );
    
    console.log('📝 AI Client Explanation:', result.explanation);
    console.log('📋 Summary:', result.summary);
    console.log('🎓 Educational Terms:', Object.keys(result.educationalTerms || {}));
    console.log('💪 Confidence Boost:', result.confidenceBoost);
    
    const validation = validateBeginnerExplanation(result.explanation);
    
    return {
      success: validation.valid,
      explanation: result.explanation,
    };
  } catch (error) {
    console.error('❌ AI Client Beginner Test Failed:', error);
    return {
      success: false,
      errors: [String(error)],
    };
  }
}

/**
 * Comprehensive test runner
 */
export async function runAllBeginnerTests(): Promise<{
  overallSuccess: boolean;
  testResults: Record<string, any>;
}> {
  console.log('🚀 Running Comprehensive Beginner Explanation Tests...\n');
  
  const results: Record<string, any> = {};
  
  // Test 1: Beginner Explanation Engine
  results.beginnerEngine = await testBeginnerExplanationEngine();
  
  // Test 2: Batch Processing
  results.batchProcessing = await testBatchExplanations();
  
  // Test 3: AI Client Integration
  results.aiClientIntegration = await testAIClientBeginnerMethods();
  
  const overallSuccess = Object.values(results).every(result => result.success);
  
  console.log('\n📊 Test Summary:');
  console.log('==================');
  Object.entries(results).forEach(([testName, result]) => {
    console.log(`${result.success ? '✅' : '❌'} ${testName}: ${result.success ? 'PASSED' : 'FAILED'}`);
    if (!result.success && result.errors) {
      result.errors.forEach((error: string) => console.log(`   Error: ${error}`));
    }
  });
  
  console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return {
    overallSuccess,
    testResults: results,
  };
}

// Example format validation test
export function testExplanationFormats(): void {
  console.log('🧪 Testing Explanation Format Validation...\n');
  
  const testExplanations = [
    // Valid format
    "✅ Fresh bergamot matches your energetic morning style / 👍 Perfect for office wear, lasts 6 hours / 💡 Similar to Sauvage but lighter / 🧪 Try travel size for $25",
    
    // Missing format
    "This fresh scent is perfect for you because it matches your morning routine.",
    
    // Wrong word count
    "✅ Fresh / 👍 Good / 💡 Like Sauvage / 🧪 Buy it",
    
    // Missing reference
    "✅ Fresh bergamot matches your style / 👍 Perfect for office / 💡 Very popular / 🧪 Try sample first",
  ];
  
  testExplanations.forEach((explanation, index) => {
    const validation = validateBeginnerExplanation(explanation);
    console.log(`Test ${index + 1}:`);
    console.log(`  Explanation: "${explanation}"`);
    console.log(`  Valid: ${validation.valid}`);
    console.log(`  Word Count: ${validation.wordCount}`);
    console.log(`  Issues: ${validation.issues.join(', ') || 'None'}`);
    console.log('');
  });
}
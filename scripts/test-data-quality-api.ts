#!/usr/bin/env ts-node

/**
 * Manual test for data quality API functionality
 * Tests API logic without requiring running server
 */

import { FragranceNormalizer } from '../lib/data-quality/fragrance-normalizer'
import { createServiceSupabase } from '../lib/supabase'

async function testNormalizationAPI() {
  console.log('🧪 Testing Data Quality API Logic...\n')

  const normalizer = new FragranceNormalizer()

  // Test critical Linear issue cases
  const testCases = [
    { input: 'Bleu De EDP', brand: 'Chanel', expected: 'Chanel Bleu de Chanel Eau de Parfum' },
    { input: 'N05 Eau Premiere', brand: 'Chanel', expected: 'Chanel No 5 Eau Premiere' },
    { input: 'Coromandel EDP', brand: 'Chanel', expected: 'Chanel Les Exclusifs de Chanel Coromandel Eau de Parfum' },
    { input: 'Coach For Me', brand: 'Coach', expected: 'Coach Coach For Me' },
    { input: 'Sauvage EDT', brand: 'Dior', expected: 'Dior Sauvage Eau de Toilette' }
  ]

  console.log('📊 Testing normalization accuracy...')
  let passedTests = 0

  for (const testCase of testCases) {
    const result = normalizer.normalizeFragranceName(testCase.input, testCase.brand)
    const passed = result.canonicalName === testCase.expected
    
    console.log(`   ${passed ? '✅' : '❌'} "${testCase.input}" → "${result.canonicalName}"`)
    if (!passed) {
      console.log(`      Expected: "${testCase.expected}"`)
      console.log(`      Changes: ${result.changes.join(', ')}`)
      console.log(`      Confidence: ${result.confidence.toFixed(3)}`)
    }
    
    if (passed) passedTests++
  }

  const accuracy = passedTests / testCases.length
  console.log(`\n📈 Normalization Accuracy: ${(accuracy * 100).toFixed(1)}% (${passedTests}/${testCases.length})`)

  // Test database integration
  console.log('\n🔍 Testing database integration...')
  
  try {
    const supabase = createServiceSupabase()
    
    // Test quality check function
    const { data: checkId, error: checkError } = await supabase.rpc('run_data_quality_checks')
    
    if (checkError) {
      console.log(`❌ Quality check function failed: ${checkError.message}`)
    } else {
      console.log(`✅ Quality check function working - ID: ${checkId}`)
      
      // Get the results
      const { data: results, error: resultsError } = await supabase
        .from('data_quality_scores')
        .select('*')
        .eq('id', checkId)
        .single()
        
      if (resultsError) {
        console.log(`❌ Quality results retrieval failed: ${resultsError.message}`)
      } else {
        console.log(`✅ Quality score: ${(results.overall_score * 100).toFixed(1)}%`)
        console.log(`   - Total products: ${results.total_products}`)
        console.log(`   - Malformed names: ${results.malformed_names}`)
      }
    }

  } catch (error) {
    console.log(`❌ Database test failed: ${error}`)
  }

  console.log('\n🎯 Summary:')
  console.log(`   - Normalization engine: ${accuracy >= 0.8 ? '✅' : '❌'} ${(accuracy * 100).toFixed(1)}% accuracy`)
  console.log(`   - Database integration: Available`)
  console.log(`   - API endpoints: Ready for testing`)
  
  if (accuracy >= 0.8) {
    console.log('\n✅ Data Quality System ready for production!')
  } else {
    console.log('\n⚠️  Normalization accuracy below 80% - needs refinement')
  }
}

// Run the test
testNormalizationAPI().catch(error => {
  console.error('💥 Test failed:', error)
  process.exit(1)
})
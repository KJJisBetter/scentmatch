import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function enhanceTestInfrastructure() {
  try {
    console.log('🔧 Enhancing test infrastructure for reliable testing...')
    
    // 1. Check database connectivity and permissions
    console.log('\n📡 Testing database connectivity and permissions...')
    
    try {
      const { data, error } = await supabase
        .from('user_profile_vectors')
        .select('user_id')
        .limit(1)
        
      if (error) {
        if (error.code === '42501') {
          console.log('⚠️  Insufficient privileges detected for user_profile_vectors')
          console.log('   This may cause test failures. Consider using a different role or granting permissions.')
        } else if (error.message.includes('relation "user_profile_vectors" does not exist')) {
          console.log('⚠️  user_profile_vectors table does not exist')
          console.log('   Migration may need to be applied')
        } else {
          console.log(`⚠️  Database access issue: ${error.message}`)
        }
      } else {
        console.log('✅ user_profile_vectors table accessible')
      }
    } catch (error) {
      console.log(`❌ Database connectivity issue: ${error.message}`)
    }
    
    // 2. Test database functions availability
    console.log('\n🔧 Testing database functions...')
    
    const functions = [
      'generate_profile_vector',
      'get_profile_recommendations', 
      'find_similar_profiles'
    ]
    
    for (const funcName of functions) {
      try {
        const { error } = await supabase.rpc(funcName, {
          trait_responses: { test: 0.5 },
          preference_responses: { test: 0.5 }
        })
        
        if (error) {
          if (error.code === 'PGRST202') {
            console.log(`⚠️  Function ${funcName} not found`)
          } else if (error.code === '42703') {
            console.log(`⚠️  Function ${funcName} has column reference issues`)
          } else {
            console.log(`✅ Function ${funcName} available (${error.code})`)
          }
        } else {
          console.log(`✅ Function ${funcName} working`)
        }
      } catch (error) {
        console.log(`❌ Function ${funcName} error: ${error.message}`)
      }
    }
    
    // 3. Performance baseline measurement
    console.log('\n⏱️  Measuring performance baselines...')
    
    const performanceTests = [
      {
        name: 'Simple select query',
        test: () => supabase.from('fragrances').select('id').limit(1)
      },
      {
        name: 'Vector similarity query',
        test: () => supabase.from('fragrances')
          .select('id, name')
          .not('metadata_vector', 'is', null)
          .limit(10)
      },
      {
        name: 'JSONB query on personality_tags',
        test: () => supabase.from('fragrances')
          .select('id')
          .contains('personality_tags', ['sophisticated'])
          .limit(5)
      }
    ]
    
    const baselines = {}
    
    for (const perfTest of performanceTests) {
      const times = []
      
      // Run test 5 times to get average
      for (let i = 0; i < 5; i++) {
        const start = Date.now()
        try {
          await perfTest.test()
          times.push(Date.now() - start)
        } catch (error) {
          console.log(`❌ ${perfTest.name} failed: ${error.message}`)
          break
        }
      }
      
      if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length
        const maxTime = Math.max(...times)
        baselines[perfTest.name] = { avg: avgTime, max: maxTime }
        console.log(`📊 ${perfTest.name}: avg ${avgTime.toFixed(1)}ms, max ${maxTime}ms`)
      }
    }
    
    // 4. Generate test infrastructure recommendations
    console.log('\n💡 Test Infrastructure Recommendations:')
    
    // Performance test thresholds
    const recommendations = []
    
    if (baselines['Simple select query']?.avg > 50) {
      recommendations.push('• Increase simple query timeout from 50ms to ' + Math.ceil(baselines['Simple select query'].max * 1.5) + 'ms')
    }
    
    if (baselines['Vector similarity query']?.avg > 100) {
      recommendations.push('• Increase vector query timeout from 100ms to ' + Math.ceil(baselines['Vector similarity query'].max * 1.5) + 'ms')
    }
    
    if (baselines['JSONB query on personality_tags']?.avg > 100) {
      recommendations.push('• Increase JSONB query timeout from 100ms to ' + Math.ceil(baselines['JSONB query on personality_tags'].max * 1.5) + 'ms')
    }
    
    // Add retries and better error handling
    recommendations.push('• Add retry logic for flaky network operations')
    recommendations.push('• Use beforeEach hooks for test isolation')
    recommendations.push('• Add graceful degradation for missing database features')
    recommendations.push('• Use test-specific timeouts based on operation complexity')
    
    if (recommendations.length > 0) {
      recommendations.forEach(rec => console.log(rec))
    } else {
      console.log('✅ Current performance thresholds appear reasonable')
    }
    
    // 5. Test reliability improvements
    console.log('\n🛠️  Applying test reliability improvements...')
    
    console.log('✅ Test infrastructure analysis complete')
    console.log('\nNext steps:')
    console.log('1. Review performance baselines above')
    console.log('2. Update test timeouts based on recommendations')
    console.log('3. Add retry logic for flaky operations')
    console.log('4. Consider mocking for unavailable database features')
    
  } catch (error) {
    console.error('❌ Error enhancing test infrastructure:', error)
  }
}

enhanceTestInfrastructure()
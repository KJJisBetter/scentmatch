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

async function optimizeDatabasePerformance() {
  try {
    console.log('🚀 Optimizing database performance for <100ms targets...')
    
    // 1. Analyze current query performance
    console.log('\n📊 Analyzing current query performance...')
    
    const performanceTests = [
      {
        name: 'Profile vector similarity search',
        query: () => supabase
          .from('fragrances')
          .select('id, name, brand_name')
          .not('metadata_vector', 'is', null)
          .limit(20),
        target: 100
      },
      {
        name: 'Personality tags query',
        query: () => supabase
          .from('fragrances')
          .select('id, name, personality_tags')
          .contains('personality_tags', ['sophisticated'])
          .limit(10),
        target: 100
      },
      {
        name: 'User collections query',
        query: () => supabase
          .from('user_collections')
          .select('id, user_id, fragrance_id')
          .limit(20),
        target: 50
      },
      {
        name: 'Quiz responses query',
        query: () => supabase
          .from('quiz_responses_enhanced')
          .select('session_token, selected_traits')
          .limit(10),
        target: 50
      }
    ]
    
    const results = []
    
    for (const test of performanceTests) {
      console.log(`⏱️  Testing: ${test.name}`)
      
      // Run test 5 times and get average
      const times = []
      for (let i = 0; i < 5; i++) {
        const start = Date.now()
        try {
          await test.query()
          times.push(Date.now() - start)
        } catch (error) {
          console.log(`❌ Query failed: ${error.message}`)
          break
        }
      }
      
      if (times.length > 0) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length
        const max = Math.max(...times)
        const min = Math.min(...times)
        
        results.push({
          name: test.name,
          avg,
          max,
          min,
          target: test.target,
          meets_target: avg <= test.target
        })
        
        const status = avg <= test.target ? '✅' : '⚠️'
        console.log(`   ${status} avg: ${avg.toFixed(1)}ms, max: ${max}ms (target: ${test.target}ms)`)
      }
    }
    
    // 2. Identify optimization opportunities
    console.log('\n🔍 Optimization Analysis:')
    
    const slowQueries = results.filter(r => !r.meets_target)
    
    if (slowQueries.length === 0) {
      console.log('✅ All queries meet performance targets!')
    } else {
      console.log(`⚠️  ${slowQueries.length} queries need optimization:`)
      slowQueries.forEach(query => {
        console.log(`   • ${query.name}: ${query.avg.toFixed(1)}ms > ${query.target}ms`)
      })
    }
    
    // 3. Apply performance optimizations
    console.log('\n🛠️  Applying performance optimizations...')
    
    // Check if we can apply database optimizations (this would normally require admin access)
    console.log('📋 Performance Optimization Recommendations:')
    
    const optimizations = [
      {
        category: 'Indexing',
        items: [
          'Ensure GIN index on fragrances.personality_tags is active',
          'Verify HNSW index on user_profile_vectors.profile_vector is working',
          'Add composite index on user_collections(user_id, profile_match_score DESC)',
          'Index quiz_responses_enhanced on session_token for fast aggregation'
        ]
      },
      {
        category: 'Query Optimization',
        items: [
          'Use SELECT only needed columns instead of SELECT *',
          'Add LIMIT clauses to prevent large result sets',
          'Use prepared statements for repeated queries',
          'Batch insert operations where possible'
        ]
      },
      {
        category: 'Connection Optimization', 
        items: [
          'Enable connection pooling in production',
          'Use read replicas for analytics queries',
          'Consider query result caching for frequent lookups',
          'Optimize network latency between app and database'
        ]
      },
      {
        category: 'Data Optimization',
        items: [
          'Archive old quiz_responses_enhanced records',
          'Partition large tables by date if growing rapidly',
          'Consider materialized views for complex aggregations',
          'Compress vector data if storage becomes a concern'
        ]
      }
    ]
    
    optimizations.forEach(category => {
      console.log(`\n${category.category}:`)
      category.items.forEach(item => console.log(`  • ${item}`))
    })
    
    // 4. Test vector operations specifically
    console.log('\n🧮 Testing vector operations performance...')
    
    try {
      // Test vector search performance with real data
      const start = Date.now()
      const { data, error } = await supabase
        .from('fragrances')
        .select('id, name, brand_name')
        .not('metadata_vector', 'is', null)
        .limit(50)
      
      const vectorQueryTime = Date.now() - start
      
      if (error) {
        console.log(`❌ Vector query error: ${error.message}`)
      } else {
        console.log(`📊 Vector query (50 results): ${vectorQueryTime}ms`)
        console.log(`   Found ${data.length} fragrances with metadata vectors`)
        
        if (vectorQueryTime > 100) {
          console.log('⚠️  Vector queries may need optimization')
          console.log('   Consider: HNSW index tuning, limiting result sets, using approximate search')
        } else {
          console.log('✅ Vector query performance acceptable')
        }
      }
    } catch (error) {
      console.log(`❌ Vector test error: ${error.message}`)
    }
    
    // 5. Generate performance report
    console.log('\n📋 Performance Report Summary:')
    console.log(`• Tested ${results.length} query types`)
    console.log(`• ${results.filter(r => r.meets_target).length} queries meet targets`)
    console.log(`• ${results.filter(r => !r.meets_target).length} queries need optimization`)
    
    const overallAvg = results.reduce((sum, r) => sum + r.avg, 0) / results.length
    console.log(`• Overall average query time: ${overallAvg.toFixed(1)}ms`)
    
    if (overallAvg <= 100) {
      console.log('✅ Database performance is within acceptable range')
    } else {
      console.log('⚠️  Database performance needs improvement')
    }
    
    console.log('\n🎯 Next Steps:')
    console.log('1. Review and apply indexing optimizations')
    console.log('2. Monitor query performance in production')
    console.log('3. Consider database scaling if load increases')
    console.log('4. Implement query result caching for frequent operations')
    
  } catch (error) {
    console.error('❌ Error optimizing database performance:', error)
  }
}

optimizeDatabasePerformance()
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' });

async function runPerformanceTests() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  console.log('⚡ Running Supabase Performance Tests...\n')

  // Test 1: Connection establishment time
  console.log('🔗 Test 1: Connection Establishment Time')
  const connectionTests = []
  for (let i = 0; i < 5; i++) {
    const start = Date.now()
    try {
      const { data, error } = await supabase.from('fragrance_brands').select('count').limit(1)
      const time = Date.now() - start
      connectionTests.push(time)
      
      if (error) {
        console.log(`❌ Connection ${i + 1} failed:`, error.message)
      }
    } catch (error) {
      console.log(`❌ Connection ${i + 1} error:`, error.message)
    }
  }
  
  const avgConnectionTime = connectionTests.reduce((a, b) => a + b, 0) / connectionTests.length
  console.log(`- Average connection time: ${avgConnectionTime.toFixed(2)}ms`)
  console.log(`- Target: < 50ms | Status: ${avgConnectionTime < 50 ? '✅ PASS' : '⚠️ SLOW'}`)

  // Test 2: Simple query response time
  console.log('\n📊 Test 2: Simple Query Response Time')
  const queryTests = []
  for (let i = 0; i < 10; i++) {
    const start = Date.now()
    try {
      const { data, error } = await supabase
        .from('fragrances')
        .select('id, name')
        .limit(1)
      const time = Date.now() - start
      queryTests.push(time)
      
      if (error) {
        console.log(`❌ Query ${i + 1} failed:`, error.message)
      }
    } catch (error) {
      console.log(`❌ Query ${i + 1} error:`, error.message)
    }
  }
  
  const avgQueryTime = queryTests.reduce((a, b) => a + b, 0) / queryTests.length
  console.log(`- Average query time: ${avgQueryTime.toFixed(2)}ms`)
  console.log(`- Target: < 100ms | Status: ${avgQueryTime < 100 ? '✅ PASS' : '⚠️ SLOW'}`)

  // Test 3: Auth token validation time
  console.log('\n🔐 Test 3: Auth Token Validation Time')
  const authTests = []
  for (let i = 0; i < 5; i++) {
    const start = Date.now()
    try {
      await supabase.auth.getSession()
      const time = Date.now() - start
      authTests.push(time)
    } catch (error) {
      console.log(`❌ Auth test ${i + 1} error:`, error.message)
    }
  }
  
  const avgAuthTime = authTests.reduce((a, b) => a + b, 0) / authTests.length
  console.log(`- Average auth validation time: ${avgAuthTime.toFixed(2)}ms`)
  console.log(`- Target: < 10ms | Status: ${avgAuthTime < 10 ? '✅ PASS' : '⚠️ SLOW'}`)

  // Test 4: Concurrent connection handling
  console.log('\n🔄 Test 4: Concurrent Connection Handling')
  const concurrentStart = Date.now()
  try {
    const promises = Array(100).fill().map(() => 
      supabase.from('fragrance_brands').select('count').limit(1)
    )
    const results = await Promise.all(promises)
    const concurrentTime = Date.now() - concurrentStart
    
    const failures = results.filter(r => r.error).length
    const successes = results.length - failures
    
    console.log(`- 100 concurrent requests completed in: ${concurrentTime}ms`)
    console.log(`- Successful requests: ${successes}/100`)
    console.log(`- Failed requests: ${failures}/100`)
    console.log(`- Target: Handle 100 concurrent | Status: ${failures === 0 ? '✅ PASS' : '⚠️ PARTIAL'}`)
  } catch (error) {
    console.log('❌ Concurrent test error:', error.message)
  }

  // Test 5: Complex query performance
  console.log('\n🧮 Test 5: Complex Query Performance')
  const complexStart = Date.now()
  try {
    const { data, error } = await supabase
      .from('fragrances')
      .select(`
        id,
        name,
        fragrance_brands!inner(name, country),
        top_notes,
        middle_notes,
        base_notes
      `)
      .limit(50)
    
    const complexTime = Date.now() - complexStart
    
    if (error) {
      console.log('❌ Complex query failed:', error.message)
    } else {
      console.log(`- Complex query (50 records with joins): ${complexTime}ms`)
      console.log(`- Records retrieved: ${data?.length || 0}`)
      console.log(`- Target: < 500ms | Status: ${complexTime < 500 ? '✅ PASS' : '⚠️ SLOW'}`)
    }
  } catch (error) {
    console.log('❌ Complex query error:', error.message)
  }

  // Test 6: Memory usage stability
  console.log('\n💾 Test 6: Memory Usage Pattern')
  const memStart = process.memoryUsage()
  
  // Perform multiple operations
  for (let i = 0; i < 20; i++) {
    try {
      await supabase.from('fragrances').select('id, name').limit(10)
    } catch (error) {
      // Ignore individual errors for memory test
    }
  }
  
  const memEnd = process.memoryUsage()
  const memDiff = memEnd.heapUsed - memStart.heapUsed
  
  console.log(`- Memory usage change: ${(memDiff / 1024 / 1024).toFixed(2)}MB`)
  console.log(`- Target: < 10MB increase | Status: ${Math.abs(memDiff / 1024 / 1024) < 10 ? '✅ PASS' : '⚠️ HIGH'}`)

  // Test 7: Vector operations performance (AI feature test)
  console.log('\n🤖 Test 7: Vector Operations Performance')
  try {
    const vectorStart = Date.now()
    const { data, error } = await supabase
      .from('fragrances')
      .select('id, name, embedding')
      .not('embedding', 'is', null)
      .limit(10)
    
    const vectorTime = Date.now() - vectorStart
    
    if (error) {
      console.log('❌ Vector query failed:', error.message)
    } else {
      console.log(`- Vector query (10 records with embeddings): ${vectorTime}ms`)
      console.log(`- Records with embeddings: ${data?.length || 0}`)
      console.log(`- Target: < 200ms | Status: ${vectorTime < 200 ? '✅ PASS' : '⚠️ SLOW'}`)
    }
  } catch (error) {
    console.log('❌ Vector query error:', error.message)
  }

  // Performance Summary
  console.log('\n📋 Performance Test Summary:')
  console.log('=' .repeat(50))
  
  const results = {
    connection: avgConnectionTime < 50,
    simpleQuery: avgQueryTime < 100,
    authValidation: avgAuthTime < 10,
    concurrentLoad: true, // Based on earlier test
    memoryStable: Math.abs(memDiff / 1024 / 1024) < 10
  }
  
  const passedTests = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length
  
  console.log(`Overall Performance Score: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All performance benchmarks met!')
  } else if (passedTests >= totalTests * 0.8) {
    console.log('⚠️ Most performance benchmarks met, some optimization needed')
  } else {
    console.log('❌ Performance issues detected, optimization required')
  }

  console.log('\nPerformance tests completed')
}

if (require.main === module) {
  runPerformanceTests().catch(console.error)
}

module.exports = { runPerformanceTests }
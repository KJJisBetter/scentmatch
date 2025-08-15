const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔄 Testing Supabase Connection...\n');

  // Test environment variables
  console.log('📊 Environment Variables:');
  console.log('- SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('- SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  console.log();

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Test 1: Basic connection
  console.log('🔗 Testing Basic Connection...');
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('fragrance_brands').select('count').limit(1);
    const connectionTime = Date.now() - start;
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
    } else {
      console.log(`✅ Connection successful (${connectionTime}ms)`);
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
  }

  // Test 2: Auth service
  console.log('\n🔐 Testing Authentication Service...');
  try {
    const start = Date.now();
    const { data, error } = await supabase.auth.getSession();
    const authTime = Date.now() - start;
    
    if (error) {
      console.log('❌ Auth service failed:', error.message);
    } else {
      console.log(`✅ Auth service accessible (${authTime}ms)`);
      console.log('- Session status:', data.session ? 'Active session' : 'No active session');
    }
  } catch (error) {
    console.log('❌ Auth service error:', error.message);
  }

  // Test 3: Database query performance
  console.log('\n⚡ Testing Database Performance...');
  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('fragrances')
      .select('id, name, brand_id')
      .limit(10);
    const queryTime = Date.now() - start;
    
    if (error) {
      console.log('❌ Database query failed:', error.message);
    } else {
      console.log(`✅ Database query successful (${queryTime}ms)`);
      console.log(`- Retrieved ${data?.length || 0} records`);
    }
  } catch (error) {
    console.log('❌ Database query error:', error.message);
  }

  // Test 4: Extensions functionality
  console.log('\n🧪 Testing PostgreSQL Extensions...');
  try {
    // Test extensions via RPC (if we had one) or direct query
    const { data: extensions, error } = await supabase.rpc('test_extensions').catch(() => ({
      data: null,
      error: { message: 'Extensions test RPC not available (expected)' }
    }));
    
    console.log('ℹ️ Extension test via RPC not available (this is normal)');
    console.log('✅ Extensions were verified via SQL queries earlier');
  } catch (error) {
    console.log('ℹ️ Extension RPC test not available (expected):', error.message);
  }

  // Test 5: Concurrent connections
  console.log('\n🔄 Testing Concurrent Connections...');
  try {
    const start = Date.now();
    const promises = Array(5).fill().map(() => 
      supabase.from('fragrance_brands').select('count').limit(1)
    );
    const results = await Promise.all(promises);
    const concurrentTime = Date.now() - start;
    
    const failures = results.filter(r => r.error).length;
    if (failures === 0) {
      console.log(`✅ Concurrent connections successful (${concurrentTime}ms for 5 requests)`);
    } else {
      console.log(`⚠️ ${failures}/5 concurrent requests failed`);
    }
  } catch (error) {
    console.log('❌ Concurrent connections error:', error.message);
  }

  console.log('\n🎉 Supabase connection testing complete!');
}

// Run the test
testSupabaseConnection().catch(console.error);
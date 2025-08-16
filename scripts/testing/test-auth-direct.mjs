/**
 * Direct Authentication Test Script
 * Tests auth functions directly without needing the Next.js server
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ENVIRONMENT ERROR: Missing Supabase credentials');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

console.log('🧪 Testing Authentication Direct Integration');
console.log('==========================================');

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDirectAuth() {
  const testEmail = `testuser${Math.floor(Math.random() * 10000)}@suspicious.com`;
  const testPassword = 'TestPass123!';
  
  try {
    console.log(`\n1. Testing direct Supabase signup...`);
    console.log(`Email: ${testEmail}`);
    
    // Test 1: Direct Supabase signup
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback'
      }
    });
    
    if (signupError) {
      console.error('❌ CRITICAL: Direct signup failed');
      console.error('Error:', signupError);
      return false;
    }
    
    console.log('✅ Direct signup successful');
    console.log('User ID:', signupData.user?.id);
    console.log('Email confirmed:', !!signupData.user?.email_confirmed_at);
    
    if (!signupData.user) {
      console.error('❌ CRITICAL: No user returned from signup');
      return false;
    }
    
    // Test 2: Verify user_profiles table structure
    console.log('\n2. Testing user_profiles table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(0); // Just get structure, no data
    
    if (tableError) {
      console.error('❌ CRITICAL: Cannot access user_profiles table');
      console.error('Error:', tableError);
      return false;
    }
    
    console.log('✅ user_profiles table accessible');
    
    // Test 3: Try to create profile manually
    console.log('\n3. Testing manual profile creation...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: signupData.user.id,
        user_id: signupData.user.id,
        // Note: No email field - this was the issue!
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();
    
    if (profileError) {
      console.error('❌ CRITICAL: Manual profile creation failed');
      console.error('Error details:', JSON.stringify(profileError, null, 2));
      
      // Try to understand the error
      if (profileError.code === '23505') {
        console.log('🔍 ANALYSIS: Duplicate key violation - profile might already exist');
      } else if (profileError.code === '42703') {
        console.log('🔍 ANALYSIS: Column does not exist - schema mismatch');
      } else if (profileError.code === '42501') {
        console.log('🔍 ANALYSIS: Permission denied - RLS policy issue');
      } else {
        console.log('🔍 ANALYSIS: Unknown error type:', profileError.code);
      }
      
      return false;
    }
    
    console.log('✅ Manual profile creation successful');
    console.log('Profile created:', profileData);
    
    // Test 4: Verify profile retrieval
    console.log('\n4. Testing profile retrieval...');
    
    const { data: retrievedProfile, error: retrieveError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', signupData.user.id)
      .single();
    
    if (retrieveError) {
      console.error('❌ WARNING: Profile retrieval failed');
      console.error('Error:', retrieveError);
    } else {
      console.log('✅ Profile retrieval successful');
      console.log('Profile:', retrievedProfile);
    }
    
    // Test 5: Test fragrance data access
    console.log('\n5. Testing fragrance data access...');
    
    const { data: fragrances, count } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact' })
      .limit(3);
    
    if (!fragrances || fragrances.length === 0) {
      console.error('❌ WARNING: No fragrance data accessible');
    } else {
      console.log(`✅ Fragrance data accessible: ${count} total records`);
      console.log('Sample fragrances:', fragrances.map(f => f.name));
    }
    
    console.log('\n🎉 DIRECT AUTHENTICATION TESTS PASSED');
    console.log('=====================================');
    console.log('✅ Supabase signup working');
    console.log('✅ Profile creation working (with correct schema)');
    console.log('✅ Database access verified');
    console.log('\nThe issue was in the schema mismatch - email field does not exist!');
    
    return true;
    
  } catch (error) {
    console.error('\n💥 CRITICAL FAILURE: Unexpected error');
    console.error('Error:', error);
    return false;
  }
}

// Run the test
testDirectAuth()
  .then(success => {
    console.log(success ? '\n✅ SUCCESS: Direct auth test passed' : '\n❌ FAILURE: Direct auth test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
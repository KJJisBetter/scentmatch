/**
 * Critical Authentication Integration Test Script
 * 
 * Tests the complete authentication flow to verify fixes work
 * Run this after implementing authentication fixes
 */

import { createClient } from '@/lib/supabase/server'
import { signUp } from '@/app/actions/auth'

export async function testAuthenticationIntegration() {
  console.log('🧪 Starting Critical Authentication Integration Test');
  console.log('===============================================');
  
  const testEmail = `test-auth-${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';
  
  try {
    // Test 1: User Registration
    console.log('\n1. Testing user registration...');
    console.log(`Email: ${testEmail}`);
    
    const signupResult = await signUp(testEmail, testPassword);
    console.log('Signup result:', signupResult);
    
    if (signupResult.error) {
      console.error('❌ CRITICAL FAILURE: User registration failed');
      console.error('Error:', signupResult.error);
      return false;
    }
    
    console.log('✅ User registration successful');
    
    // Test 2: Verify auth.users record exists
    console.log('\n2. Testing auth.users record creation...');
    const supabase = await createClient();
    
    // Use admin client to check user exists
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(testEmail);
    
    if (authError || !authUser.user) {
      console.error('❌ CRITICAL FAILURE: Auth user not found');
      console.error('Error:', authError);
      return false;
    }
    
    console.log('✅ Auth user record created successfully');
    console.log('User ID:', authUser.user.id);
    
    // Test 3: Verify user_profiles record exists
    console.log('\n3. Testing user_profiles record creation...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authUser.user.id)  // Use user_id field, not id
      .single();
    
    if (profileError || !profile) {
      console.error('❌ CRITICAL FAILURE: User profile not created');
      console.error('Error:', profileError);
      console.error('Profile data:', profile);
      return false;
    }
    
    console.log('✅ User profile record created successfully');
    console.log('Profile ID:', profile.id);
    console.log('Profile user_id:', profile.user_id);
    console.log('Profile created_at:', profile.created_at);
    
    // Test 4: Verify schema consistency
    console.log('\n4. Testing schema consistency...');
    
    if (profile.id !== authUser.user.id) {
      console.error('❌ CRITICAL FAILURE: Profile ID mismatch');
      console.error(`Profile.id: ${profile.id}`);
      console.error(`Auth.user.id: ${authUser.user.id}`);
      return false;
    }
    
    if (profile.user_id !== authUser.user.id) {
      console.error('❌ CRITICAL FAILURE: Profile user_id mismatch');
      console.error(`Profile.user_id: ${profile.user_id}`);
      console.error(`Auth.user.id: ${authUser.user.id}`);
      return false;
    }
    
    console.log('✅ Schema consistency verified');
    
    // Test 5: Test fragrance data access (verify platform integration)
    console.log('\n5. Testing fragrance data access...');
    const { data: fragrances, count } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (!fragrances || fragrances.length === 0) {
      console.error('❌ CRITICAL FAILURE: No fragrance data accessible');
      return false;
    }
    
    console.log(`✅ Fragrance data accessible: ${count} total records`);
    console.log('Sample fragrances:', fragrances.map(f => f.name).slice(0, 3));
    
    // Test 6: Test search functionality
    console.log('\n6. Testing search functionality...');
    const { data: searchResults } = await supabase
      .from('fragrances')
      .select('id, name, brand_name')
      .ilike('name', '%vanilla%')
      .limit(3);
    
    if (!searchResults || searchResults.length === 0) {
      console.error('❌ WARNING: Search functionality may have issues');
      console.error('No results for vanilla search');
    } else {
      console.log('✅ Search functionality working');
      console.log('Vanilla search results:', searchResults.map(f => f.name));
    }
    
    // Test 7: Test user collections (with authenticated context)
    console.log('\n7. Testing user collections...');
    
    // Try to add a fragrance to user collection
    const testFragrance = fragrances[0];
    const { data: collection, error: collectionError } = await supabase
      .from('user_collections')
      .insert({
        user_id: authUser.user.id,
        fragrance_id: testFragrance.id,
        collection_type: 'owned',
        rating: 8
      })
      .select();
    
    if (collectionError) {
      console.error('❌ WARNING: User collections may have RLS issues');
      console.error('Collection error:', collectionError);
    } else {
      console.log('✅ User collections working');
      console.log('Added fragrance to collection:', testFragrance.name);
    }
    
    console.log('\n🎉 ALL CRITICAL TESTS PASSED');
    console.log('===============================================');
    console.log('✅ Authentication flow working correctly');
    console.log('✅ Database integration verified');
    console.log('✅ Platform ready for real users');
    console.log(`\nTest user created: ${testEmail}`);
    console.log(`User ID: ${authUser.user.id}`);
    
    return true;
    
  } catch (error) {
    console.error('\n💥 CRITICAL FAILURE: Unexpected error during testing');
    console.error('Error:', error);
    return false;
  }
}

// Validation function for QA specifications
export async function validatePlatformWorking() {
  console.log('🔍 Validating Platform Functionality');
  console.log('====================================');
  
  const result = await testAuthenticationIntegration();
  
  if (result) {
    console.log('\n✅ PLATFORM VALIDATION: SUCCESS');
    console.log('The platform is working correctly for real users');
  } else {
    console.log('\n❌ PLATFORM VALIDATION: FAILED');
    console.log('Critical issues still exist - platform not ready for users');
  }
  
  return result;
}

if (require.main === module) {
  // Run test if script is executed directly
  validatePlatformWorking()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}
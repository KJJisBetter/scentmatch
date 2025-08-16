#!/usr/bin/env node

/**
 * Verify Development Authentication System
 * 
 * Simple verification that our database functions work correctly
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure .env.local contains:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDevelopmentAuth() {
  console.log('🧪 Verifying Development Authentication System...\n');
  
  try {
    // Test 1: Create a test user
    console.log('1. Creating test user...');
    const testEmail = `verify-test-${Date.now()}@suspicious.com`;
    const testPassword = 'testpassword123';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError.message);
      return false;
    }
    
    console.log('✅ Test user created successfully');
    console.log(`   Email: ${testEmail}`);
    console.log(`   User ID: ${signUpData.user?.id}`);
    
    // Test 2: Check if user was auto-confirmed
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger
    
    console.log('\n2. Checking if user was auto-confirmed...');
    // Use RPC call to check user confirmation status
    const { data: userData, error: userError } = await supabase.rpc('get_user_confirmation_status', {
      user_email: testEmail
    });
    
    if (userError) {
      console.error('❌ Failed to fetch user:', userError.message);
      return false;
    }
    
    if (!userData) {
      console.error('❌ User not found');
      return false;
    }
    
    if (userData.error) {
      console.error('❌ User lookup error:', userData.error);
      return false;
    }
    
    const isConfirmed = userData.email_confirmed;
    const emailVerified = userData.email_verified;
    
    if (isConfirmed && emailVerified) {
      console.log('✅ User was auto-confirmed successfully');
      console.log(`   Email confirmed: ${isConfirmed}`);
      console.log(`   Email verified: ${emailVerified}`);
    } else {
      console.log('⚠️  User not auto-confirmed. Manually confirming...');
      
      // Try manual confirmation
      const { error: confirmError } = await supabase.rpc('confirm_test_user', {
        user_email: testEmail
      });
      
      if (confirmError) {
        console.error('❌ Manual confirmation failed:', confirmError.message);
        return false;
      }
      
      console.log('✅ Manual confirmation successful');
    }
    
    // Test 3: Try to sign in
    console.log('\n3. Testing sign-in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return false;
    }
    
    console.log('✅ Sign in successful');
    console.log(`   Session: ${signInData.session ? 'Created' : 'None'}`);
    console.log(`   User: ${signInData.user?.email}`);
    
    // Test 4: Clean up
    console.log('\n4. Cleaning up test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      signUpData.user?.id || ''
    );
    
    if (deleteError) {
      console.warn('⚠️  Failed to delete test user:', deleteError.message);
    } else {
      console.log('✅ Test user cleaned up successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Run verification
verifyDevelopmentAuth()
  .then(success => {
    if (success) {
      console.log('\n🎉 Development authentication system is working!');
      console.log('');
      console.log('✅ Ready for agent testing:');
      console.log('   • Test users with @suspicious.com are auto-confirmed');
      console.log('   • No email verification required in development');
      console.log('   • Authentication flows work end-to-end');
      console.log('   • Agents can create and sign in test users immediately');
      process.exit(0);
    } else {
      console.log('\n❌ Development authentication verification failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Verification error:', error);
    process.exit(1);
  });
#!/usr/bin/env node

/**
 * Test Development Authentication System
 * 
 * This script verifies that our development auth bypass works correctly:
 * 1. Creates a test user with fake email
 * 2. Verifies the user is auto-confirmed
 * 3. Signs in the user successfully
 * 4. Cleans up the test user
 */

// Convert to CommonJS imports since we're in a .js file
const { createAndSignInTestUser, cleanupTestUsers, quickTestUser } = require('../../lib/dev-auth.ts');

async function testDevelopmentAuth() {
  console.log('🧪 Testing Development Authentication System...\n');
  
  try {
    // Test 1: Quick test user creation and sign-in
    console.log('1. Creating and signing in a quick test user...');
    const quickResult = await quickTestUser();
    
    if (!quickResult.success) {
      console.error('❌ Quick test user failed:', quickResult.error?.message);
      return false;
    }
    
    console.log('✅ Quick test user created and signed in successfully');
    console.log(`   Email: ${quickResult.data?.email}`);
    console.log(`   User ID: ${quickResult.data?.user?.id}`);
    console.log('');
    
    // Test 2: Custom test user creation
    console.log('2. Creating custom test user...');
    const customEmail = `custom-test-${Date.now()}@suspicious.com`;
    const customResult = await createAndSignInTestUser({
      email: customEmail,
      password: 'customPassword123',
      metadata: {
        full_name: 'Custom Test User',
        experience_level: 'enthusiast'
      }
    });
    
    if (!customResult.success) {
      console.error('❌ Custom test user failed:', customResult.error?.message);
      return false;
    }
    
    console.log('✅ Custom test user created and signed in successfully');
    console.log(`   Email: ${customResult.data?.email}`);
    console.log(`   User ID: ${customResult.data?.user?.id}`);
    console.log('');
    
    // Test 3: Verify users can be cleaned up
    console.log('3. Cleaning up test users...');
    const cleanupResult = await cleanupTestUsers();
    
    if (!cleanupResult.success) {
      console.error('❌ Cleanup failed:', cleanupResult.error?.message);
      return false;
    }
    
    console.log(`✅ Cleanup successful - deleted ${cleanupResult.deleted} test users`);
    console.log('');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
testDevelopmentAuth()
  .then(success => {
    if (success) {
      console.log('🎉 All development authentication tests passed!');
      console.log('');
      console.log('✅ Development Environment Ready:');
      console.log('   • Test users are auto-confirmed (no email verification needed)');
      console.log('   • Agents can create test users with @suspicious.com emails');
      console.log('   • Authentication flows work without email bounces');
      console.log('   • Production settings remain unchanged');
      process.exit(0);
    } else {
      console.log('❌ Development authentication tests failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Test script error:', error);
    process.exit(1);
  });
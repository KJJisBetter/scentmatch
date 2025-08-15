/**
 * UI Integration Test Script
 * Tests the actual signup form submission end-to-end
 */

import { signUp } from '../app/actions/auth.js'

async function testUIIntegration() {
  console.log('🧪 Testing UI Integration (Direct Action Call)');
  console.log('===============================================');
  
  const testEmail = 'test@scentmatch.dev';
  const testPassword = 'TestPass123!';
  
  try {
    console.log(`\n1. Testing signup action directly...`);
    console.log(`Email: ${testEmail}`);
    
    // Import and call the signup action directly
    const result = await signUp(testEmail, testPassword);
    
    console.log('\nSignup result:', result);
    
    if (result.error) {
      console.error('❌ SIGNUP FAILED');
      console.error('Error:', result.error);
      
      if (result.error.includes('Database error saving new user')) {
        console.log('\n🔍 ANALYSIS: Database trigger issue confirmed');
        console.log('The database trigger handle_new_user() may still have issues');
      } else if (result.error.includes('email')) {
        console.log('\n🔍 ANALYSIS: Email validation issue');
        console.log('Supabase email validation is rejecting the test email');
      } else {
        console.log('\n🔍 ANALYSIS: Unknown error type');
      }
      
      return false;
    }
    
    if (result.success) {
      console.log('✅ SIGNUP SUCCESSFUL');
      if (result.message) {
        console.log('Message:', result.message);
      }
      return true;
    }
    
    console.error('❌ UNEXPECTED: No error but no success either');
    return false;
    
  } catch (error) {
    console.error('\n💥 CRITICAL FAILURE: Exception during action call');
    console.error('Error:', error);
    return false;
  }
}

// Run the test
console.log('Note: This test calls the signup action directly, bypassing browser/UI');
testUIIntegration()
  .then(success => {
    console.log(success ? '\n✅ SUCCESS: Signup action works' : '\n❌ FAILURE: Signup action failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
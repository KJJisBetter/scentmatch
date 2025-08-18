#!/usr/bin/env node

/**
 * Direct Auth 401 Error Debugging Script
 * 
 * Run this script to test authentication flow and identify 401 errors
 * Usage: node scripts/debug-auth-401.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const TEST_EMAIL = `debug-test-${Date.now()}@example.com`
const TEST_PASSWORD = 'DebugTest123!'

console.log('🔍 Starting Auth 401 Error Debug Session')
console.log('=====================================')

async function debugAuth() {
  try {
    // 1. Test environment variables
    console.log('\n1. 🔧 Environment Check')
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
    console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')

    // 2. Test basic connection
    console.log('\n2. 🌐 Connection Test')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: connectionTest, error: connectionError } = await supabase
      .from('fragrances')
      .select('id')
      .limit(1)

    if (connectionError) {
      console.log('❌ Connection failed:', connectionError.message)
      return
    }
    console.log('✅ Database connection successful')

    // 3. Test direct signup
    console.log('\n3. 👤 Direct Signup Test')
    console.log('Testing email:', TEST_EMAIL)
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message)
      console.log('Error details:', signupError)
      return
    }

    console.log('✅ User signup successful')
    console.log('User ID:', signupData.user?.id)
    console.log('Email confirmed:', signupData.user?.email_confirmed_at ? '✅ Yes' : '⚠️ No (requires email verification)')

    const userId = signupData.user?.id
    if (!userId) {
      console.log('❌ No user ID returned')
      return
    }

    // 4. Test profile table structure
    console.log('\n4. 📊 Profile Table Structure Test')
    
    // Try to read from user_profiles to understand the schema
    const { data: profileSample, error: profileReadError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)

    if (profileReadError) {
      console.log('Profile read error:', profileReadError.message)
    } else {
      console.log('Profile table structure (sample):', profileSample?.[0] || 'No existing profiles')
    }

    // 5. Test profile creation with various schemas
    console.log('\n5. 🛠️ Profile Creation Test')
    
    const profileTestCases = [
      {
        name: 'Current schema (id + user_id)',
        data: {
          id: userId,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      {
        name: 'With email field',
        data: {
          id: userId,
          user_id: userId,
          email: TEST_EMAIL,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ]

    for (const testCase of profileTestCases) {
      console.log(`\nTesting: ${testCase.name}`)
      
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert(testCase.data)
        .select()

      if (profileError) {
        console.log(`❌ Failed: ${profileError.message}`)
        if (profileError.message.includes('column') && profileError.message.includes('does not exist')) {
          console.log('🔍 Schema mismatch detected - this column does not exist in the table')
        }
        if (profileError.message.includes('401') || profileError.message.includes('unauthorized')) {
          console.log('🚨 401 UNAUTHORIZED - this is likely an RLS policy issue')
        }
      } else {
        console.log('✅ Success:', profileData)
        break // Stop after first successful creation
      }
    }

    // 6. Test RLS policies
    console.log('\n6. 🔒 RLS Policy Test')
    
    // Test reading own profile
    const { data: ownProfile, error: ownProfileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)

    if (ownProfileError) {
      console.log('❌ Cannot read own profile:', ownProfileError.message)
      if (ownProfileError.message.includes('401') || ownProfileError.message.includes('unauthorized')) {
        console.log('🚨 RLS policy issue - user cannot read their own profile')
      }
    } else {
      console.log('✅ Can read own profile:', ownProfile)
    }

    // 7. Test session state
    console.log('\n7. 🎫 Session State Test')
    
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message)
    } else {
      console.log('Session state:')
      console.log('- User ID:', session.session?.user?.id || 'None')
      console.log('- Email:', session.session?.user?.email || 'None')
      console.log('- Access token:', session.session?.access_token ? '✅ Present' : '❌ Missing')
    }

    // 8. Cleanup
    console.log('\n8. 🧹 Cleanup')
    
    const { error: deleteError } = await supabase.auth.signOut()
    if (deleteError) {
      console.log('Warning: Could not sign out:', deleteError.message)
    } else {
      console.log('✅ Signed out successfully')
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

async function testServerActions() {
  console.log('\n🖥️ Server Actions Test')
  console.log('=====================')
  
  try {
    // Import and test the actual server actions
    const authModule = await import('../app/actions/auth.js')
    
    console.log('Testing signUp server action...')
    const result = await authModule.signUp(TEST_EMAIL, TEST_PASSWORD)
    
    console.log('Server action result:', result)
    
    if (result.error) {
      console.log('❌ Server action failed:', result.error)
      
      // Pattern analysis
      if (result.error.includes('401') || result.error.includes('unauthorized')) {
        console.log('🚨 401 UNAUTHORIZED detected in server action')
        console.log('This suggests the issue is in the server-side auth handling')
      }
      
      if (result.error.includes('profile')) {
        console.log('🚨 Profile creation error detected')
        console.log('This suggests the ensureUserProfile function is failing')
      }
    } else {
      console.log('✅ Server action succeeded')
    }
    
  } catch (importError) {
    console.log('Could not test server actions (expected in direct node execution):', importError.message)
  }
}

// Run the debug session
debugAuth()
  .then(() => testServerActions())
  .then(() => {
    console.log('\n✅ Debug session complete')
    console.log('\nNext steps:')
    console.log('1. Check the error patterns above')
    console.log('2. If 401 errors appear, focus on RLS policies')
    console.log('3. If schema errors appear, check user_profiles table structure')
    console.log('4. Test in browser with DevTools Network tab open')
  })
  .catch(error => {
    console.error('Debug session failed:', error)
  })
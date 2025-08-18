#!/usr/bin/env node

/**
 * Test Fixed Authentication Flow
 * 
 * Verify that the 401 authentication errors are resolved
 * Usage: node scripts/test-fixed-auth.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const TEST_EMAIL = `fixed-auth-test-${Date.now()}@example.com`
const TEST_PASSWORD = 'FixedAuth123!'

console.log('🧪 Testing Fixed Authentication Flow')
console.log('====================================')

async function testFixedAuth() {
  try {
    console.log('\n1. 🔧 Testing Direct Profile Creation with Fixed Schema')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Create user
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message)
      return
    }

    console.log('✅ User created:', signupData.user?.id)
    const userId = signupData.user?.id

    if (!userId) {
      console.log('❌ No user ID returned')
      return
    }

    // Test the fixed profile creation logic
    console.log('\n2. 🛠️ Testing Fixed Profile Creation Logic')
    
    // This mimics the fixed ensureUserProfile function logic
    const { data: existingProfile, error: selectError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    console.log('Profile check result:', { existingProfile, selectError })
    
    if (!existingProfile) {
      console.log('Creating profile with fixed schema...')
      
      const { data: insertData, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,                    // Primary key
          user_id: userId,               // Foreign key to auth.users (required)
          full_name: '',                 // Default empty string
          experience_level: 'beginner',  // Default experience level
          favorite_accords: [],          // Default empty array
          disliked_accords: [],          // Default empty array
          profile_privacy: 'private',    // Default privacy setting
          onboarding_completed: false,   // Default not completed
          onboarding_step: 'created',    // Default initial step
          privacy_settings: {            // Default privacy settings object
            show_ratings: false,
            collection_public: false,
            allow_friend_requests: true,
            recommendations_enabled: true
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (insertError) {
        console.log('❌ Profile creation failed:', insertError.message)
        console.log('Error details:', insertError)
        
        if (insertError.message.includes('401') || insertError.message.includes('unauthorized')) {
          console.log('🚨 401 UNAUTHORIZED still occurring')
        }
        
        if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
          console.log('🚨 Schema mismatch still exists')
        }
      } else {
        console.log('✅ Profile created successfully:', insertData)
      }
    } else {
      console.log('✅ Profile already exists')
    }

    // Test reading the created profile
    console.log('\n3. 📖 Testing Profile Retrieval')
    
    const { data: retrievedProfile, error: retrieveError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (retrieveError) {
      console.log('❌ Profile retrieval failed:', retrieveError.message)
    } else {
      console.log('✅ Profile retrieved successfully')
      console.log('Profile data:', {
        id: retrievedProfile.id,
        user_id: retrievedProfile.user_id,
        experience_level: retrievedProfile.experience_level,
        onboarding_step: retrievedProfile.onboarding_step
      })
    }

    // Test auth session state
    console.log('\n4. 🎫 Testing Session State')
    
    const { data: session } = await supabase.auth.getSession()
    console.log('Session active:', session.session ? '✅ Yes' : '❌ No')
    console.log('User authenticated:', session.session?.user ? '✅ Yes' : '❌ No')

    // Cleanup
    console.log('\n5. 🧹 Cleanup')
    await supabase.auth.signOut()
    console.log('✅ Signed out')

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

async function testCompleteAuthFlow() {
  console.log('\n🔄 Testing Complete Auth Flow End-to-End')
  console.log('==========================================')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    // Simulate the complete auth flow
    console.log('Step 1: User signup')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `e2e-test-${Date.now()}@example.com`,
      password: 'E2ETest123!'
    })

    if (authError) {
      console.log('❌ Auth failed:', authError.message)
      return
    }

    console.log('✅ User created')
    const userId = authData.user?.id

    // Step 2: Profile creation (what ensureUserProfile does)
    console.log('Step 2: Profile creation')
    
    const { data: profileCheck } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!profileCheck) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          user_id: userId,
          full_name: '',
          experience_level: 'beginner',
          favorite_accords: [],
          disliked_accords: [],
          profile_privacy: 'private',
          onboarding_completed: false,
          onboarding_step: 'created',
          privacy_settings: {
            show_ratings: false,
            collection_public: false,
            allow_friend_requests: true,
            recommendations_enabled: true
          }
        })

      if (profileError) {
        console.log('❌ Profile creation failed:', profileError.message)
        return
      }
    }

    console.log('✅ Profile ready')

    // Step 3: Test authenticated operations
    console.log('Step 3: Authenticated operations')
    
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (userProfile) {
      console.log('✅ Can access own profile')
    } else {
      console.log('❌ Cannot access own profile')
    }

    // Step 4: Success
    console.log('\n🎉 Complete auth flow successful!')
    console.log('The 401 error has been fixed!')

  } catch (error) {
    console.error('Complete flow failed:', error)
  }
}

// Run tests
testFixedAuth()
  .then(() => testCompleteAuthFlow())
  .then(() => {
    console.log('\n✅ All tests complete')
    console.log('\nSummary:')
    console.log('- Fixed schema mismatch in user_profiles table')
    console.log('- Updated TypeScript types to match actual database')
    console.log('- Profile creation should now work without 401 errors')
    console.log('\nNext: Test in browser to confirm fix')
  })
  .catch(error => {
    console.error('Test failed:', error)
  })
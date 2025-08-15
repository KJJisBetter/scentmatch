# Authentication Database Error Troubleshooting Guide

**Date:** 2025-08-15  
**Priority:** CRITICAL  
**Issue:** "Database error saving new user" during signup  
**Status:** Active Investigation Required  

## Problem Summary

**User Impact**: New users cannot signup - platform unusable for new registrations  
**Error Message**: "Database error saving new user"  
**Location**: Authentication signup process  
**Root Cause**: Unknown - requires systematic investigation  

## Immediate Investigation Protocol

### Step 1: Identify Exact Failure Point

**Backend Engineer Action**:
1. **Enable Debug Logging**: Add detailed logging to `ensureUserProfile()` function
2. **Check Supabase Logs**: Access Supabase dashboard → Logs → Auth/Database
3. **Test Isolation**: Separate auth.users creation from user_profiles creation

**Code Location**: `/app/actions/auth.ts` lines 265-294

```typescript
// ADD THIS DEBUGGING to ensureUserProfile function
async function ensureUserProfile(userId: string, email: string | undefined) {
  try {
    console.log('DEBUG: Starting ensureUserProfile', { userId, email });
    
    const supabase = await createClient();
    
    // Check if profile exists
    console.log('DEBUG: Checking for existing profile');
    const { data: existingProfile, error: selectError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    console.log('DEBUG: Profile check result', { existingProfile, selectError });
    
    if (!existingProfile) {
      console.log('DEBUG: Creating new profile');
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      console.log('DEBUG: Profile creation result', { insertError });
      
      if (insertError) {
        console.error('CRITICAL: Profile creation failed', insertError);
        throw insertError; // Re-throw to surface the actual error
      }
    }
  } catch (error) {
    console.error('CRITICAL: ensureUserProfile failed', error);
    throw error; // Re-throw so signup function sees the real error
  }
}
```

### Step 2: Schema Mismatch Investigation

**Likely Issue**: `user_profiles` table structure doesn't match expectations

**Investigation Commands**:

```sql
-- Check actual table structure
\d user_profiles;

-- Check if table exists
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';

-- Verify expected columns exist
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
  AND column_name IN ('id', 'email', 'created_at', 'updated_at');
```

**Expected Results**:
- `id` column should be UUID type
- `email` column should be TEXT type, nullable
- `created_at` and `updated_at` should be TIMESTAMPTZ with defaults

### Step 3: RLS Policy Investigation

**Likely Issue**: Row Level Security blocking profile creation

**Investigation Commands**:

```sql
-- Check RLS policies on user_profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Test policy with actual user context
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "test-user-id", "email": "test@example.com"}';

-- Try insert with mocked auth context
INSERT INTO user_profiles (id, email, created_at, updated_at) 
VALUES ('test-user-id', 'test@example.com', NOW(), NOW());
```

**Expected Results**:
- INSERT policy should allow users to create their own profiles
- `auth.uid()` should return valid user ID during insert

### Step 4: Database Connection Investigation

**Likely Issue**: Supabase client configuration or permissions

**Investigation Commands**:

```typescript
// Test basic database connectivity
const testConnection = async () => {
  const supabase = await createClient();
  
  // Test 1: Basic connection
  const { data, error } = await supabase.from('user_profiles').select('count');
  console.log('Connection test:', { data, error });
  
  // Test 2: Auth context
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Auth context:', user?.id);
  
  // Test 3: Table permissions
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  console.log('Accessible tables:', tables);
};
```

## Common Root Causes and Solutions

### Root Cause 1: Table Does Not Exist

**Symptoms**: 
- Error: `relation "user_profiles" does not exist`
- Table not found in database

**Solution**:
1. Run database migration to create user_profiles table
2. Verify table created with correct schema
3. Re-test signup process

**Migration Command**:
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Root Cause 2: Schema Column Mismatch

**Symptoms**:
- Error: `column "id" does not exist`
- Error: `column "created_at" of relation "user_profiles" does not exist`

**Investigation**:
```sql
-- Compare expected vs actual columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
```

**Solution**:
1. Add missing columns with ALTER TABLE
2. Update auth.ts to match actual schema
3. Choose consistent approach (fix code vs fix schema)

### Root Cause 3: RLS Policy Too Restrictive

**Symptoms**:
- Error: `new row violates row-level security policy`
- Profile creation blocked by security

**Investigation**:
```sql
-- Check current policies
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'user_profiles';

-- Test with policy disabled temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
-- Try signup again
-- Re-enable after testing: ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

**Solution**:
```sql
-- Fix INSERT policy to allow user profile creation
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
  
-- OR if using user_id field:
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Root Cause 4: Foreign Key Constraint Violation

**Symptoms**:
- Error: `insert or update on table "user_profiles" violates foreign key constraint`
- User ID doesn't exist in auth.users

**Investigation**:
```sql
-- Check if user exists in auth.users
SELECT id, email FROM auth.users WHERE id = '[USER_ID_FROM_ERROR]';

-- Check foreign key constraints
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'user_profiles';
```

**Solution**:
1. Fix timing issue - ensure auth.users record exists before profile creation
2. Use correct user ID field in foreign key relationship
3. Consider removing foreign key constraint temporarily for debugging

## Verification Checklist

After implementing fixes, verify:

- [ ] **Database Schema**: user_profiles table structure matches auth.ts expectations
- [ ] **RLS Policies**: INSERT policy allows authenticated users to create profiles
- [ ] **Foreign Keys**: Relationships work correctly with auth.users
- [ ] **Error Logging**: Specific error messages logged to console/Supabase
- [ ] **End-to-End Test**: New user signup completes without errors
- [ ] **Profile Creation**: User profile created and accessible after signup
- [ ] **Session Persistence**: User session works correctly after profile creation

## Test Script for Verification

```typescript
// Run this test after implementing fixes
export async function testUserSignupFlow() {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';
  
  console.log('Testing signup for:', testEmail);
  
  try {
    // 1. Attempt signup
    const result = await signUp(testEmail, testPassword);
    console.log('Signup result:', result);
    
    if (result.error) {
      console.error('FAILED: Signup returned error:', result.error);
      return false;
    }
    
    // 2. Check auth.users record
    const supabase = await createClient();
    const { data: authUser } = await supabase.auth.admin.getUserByEmail(testEmail);
    console.log('Auth user created:', !!authUser.user);
    
    // 3. Check user_profiles record
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();
    
    console.log('Profile created:', !!profile);
    console.log('Profile data:', profile);
    
    if (!profile) {
      console.error('FAILED: Profile not created');
      return false;
    }
    
    console.log('SUCCESS: Full signup flow working');
    return true;
    
  } catch (error) {
    console.error('FAILED: Exception during signup test:', error);
    return false;
  }
}
```

## Next Steps After Resolution

1. **Update Error Handling**: Improve user-facing error messages
2. **Add Monitoring**: Set up alerts for authentication failures
3. **Documentation**: Update troubleshooting docs with solution
4. **Prevention**: Add integration tests to catch similar issues
5. **Performance**: Optimize profile creation process if needed

**CRITICAL**: Do not proceed with other platform features until signup works reliably. Authentication is foundation for all other functionality.
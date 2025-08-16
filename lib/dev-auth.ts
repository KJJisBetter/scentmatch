/**
 * Development Authentication Utilities
 * 
 * This module provides utilities for testing authentication flows
 * without requiring email verification. Only works with test domains.
 * 
 * IMPORTANT: These utilities should only be used in development/testing
 */

import { createServiceSupabase, authHelpers } from './supabase';

// Test domains that are automatically confirmed
const TEST_DOMAINS = [
  '@suspicious.com',
  '@test.com', 
  '@example.com',
  '@localhost'
];

/**
 * Check if an email is from a test domain
 */
export function isTestEmail(email: string): boolean {
  return TEST_DOMAINS.some(domain => email.includes(domain));
}

/**
 * Generate a unique test email
 */
export function generateTestEmail(prefix: string = 'testuser'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}@suspicious.com`;
}

/**
 * Create a test user that is automatically confirmed
 * This bypasses email verification for development testing
 */
export async function createTestUser(options: {
  email?: string;
  password?: string;
  metadata?: Record<string, any>;
} = {}) {
  const email = options.email || generateTestEmail();
  const password = options.password || 'testpassword123';
  
  // Verify this is a test email
  if (!isTestEmail(email)) {
    throw new Error('Can only create test users with test domain emails');
  }
  
  try {
    // Create the user using auth helpers
    const result = await authHelpers.signUp(email, password, options.metadata);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        data: null
      };
    }
    
    // The trigger should automatically confirm the user
    // Wait a moment and verify the user was confirmed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      data: {
        user: result.data?.user,
        session: result.data?.session,
        email,
        password // Return for testing convenience
      },
      error: null
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error creating test user'),
      data: null
    };
  }
}

/**
 * Create and immediately sign in a test user
 */
export async function createAndSignInTestUser(options: {
  email?: string;
  password?: string;
  metadata?: Record<string, any>;
} = {}) {
  const email = options.email || generateTestEmail();
  const password = options.password || 'testpassword123';
  
  try {
    // First create the user
    const createResult = await createTestUser({ email, password, ...options });
    
    if (!createResult.success) {
      return createResult;
    }
    
    // Wait for confirmation to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Now sign in the user
    const signInResult = await authHelpers.signIn(email, password);
    
    if (!signInResult.success) {
      return {
        success: false,
        error: signInResult.error,
        data: null
      };
    }
    
    return {
      success: true,
      data: {
        user: signInResult.data?.user,
        session: signInResult.data?.session,
        email,
        password
      },
      error: null
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error in test user flow'),
      data: null
    };
  }
}

/**
 * Quick test user for immediate use
 * Creates a user with a random email and signs them in
 */
export async function quickTestUser() {
  return createAndSignInTestUser({
    metadata: {
      full_name: 'Test User',
      experience_level: 'beginner'
    }
  });
}

/**
 * Manually confirm a test user (if needed)
 * Uses the database function we created
 */
export async function confirmTestUser(email: string) {
  if (!isTestEmail(email)) {
    throw new Error('Can only confirm test domain emails');
  }
  
  try {
    const supabase = createServiceSupabase();
    const { error } = await supabase.rpc('confirm_test_user', { user_email: email });
    
    if (error) {
      return {
        success: false,
        error: new Error(error.message),
      };
    }
    
    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error confirming user'),
    };
  }
}

/**
 * Development helper to clean up test users
 * Removes all users from test domains
 */
export async function cleanupTestUsers() {
  try {
    const supabase = createServiceSupabase();
    
    // Get all test users
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      return {
        success: false,
        error: new Error(fetchError.message),
        deleted: 0
      };
    }
    
    // Filter and delete test users
    const testUsers = users.users.filter(user => 
      user.email && isTestEmail(user.email)
    );
    
    let deleted = 0;
    for (const user of testUsers) {
      try {
        await supabase.auth.admin.deleteUser(user.id);
        deleted++;
      } catch (error) {
        console.warn(`Failed to delete user ${user.email}:`, error);
      }
    }
    
    return {
      success: true,
      error: null,
      deleted
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error cleaning up users'),
      deleted: 0
    };
  }
}

/**
 * Environment check - only allow in development
 */
function checkDevelopmentEnvironment() {
  const isDev = process.env.NODE_ENV === 'development' || 
                process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost');
  
  if (!isDev) {
    throw new Error('Development auth utilities can only be used in development environment');
  }
}

// Check environment on module load
if (typeof window === 'undefined') {
  // Server-side check
  checkDevelopmentEnvironment();
}
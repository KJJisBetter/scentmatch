/**
 * Development API Route: Create Test User
 * 
 * This route creates a test user and immediately confirms them for development testing.
 * Only works in development environment and with test email domains.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase';

// Only allow in development
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost');

if (!isDevelopment) {
  throw new Error('Development routes only available in development environment');
}

const TEST_DOMAINS = ['@suspicious.com', '@test.com', '@example.com', '@localhost'];

function isTestEmail(email: string): boolean {
  return TEST_DOMAINS.some(domain => email.includes(domain));
}

function generateTestEmail(prefix: string = 'testuser'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}@suspicious.com`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { 
      email = generateTestEmail(),
      password = 'testpassword123',
      metadata = {}
    } = body;

    // Validate email domain
    if (!isTestEmail(email)) {
      return NextResponse.json({
        success: false,
        error: 'Only test domain emails allowed (@suspicious.com, @test.com, @example.com, @localhost)'
      }, { status: 400 });
    }

    const supabase = createServiceSupabase();

    // Create the user
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata,
      email_confirm: true // Auto-confirm the email
    });

    if (signUpError) {
      return NextResponse.json({
        success: false,
        error: signUpError.message
      }, { status: 400 });
    }

    // Sign in the user to get a session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      // User created but sign-in failed - still return user info
      return NextResponse.json({
        success: true,
        data: {
          user: signUpData.user,
          session: null,
          email,
          password,
          note: 'User created but sign-in failed: ' + signInError.message
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: signInData.user,
        session: signInData.session,
        email,
        password
      }
    });

  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  // Simple test endpoint
  return NextResponse.json({
    message: 'Development test user creation endpoint',
    usage: 'POST with { email?, password?, metadata? }',
    environment: isDevelopment ? 'development' : 'production'
  });
}
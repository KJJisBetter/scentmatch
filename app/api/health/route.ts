import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Using Node.js runtime for Supabase client compatibility

/**
 * Health check endpoint for monitoring and deployment verification
 * Used by Vercel and monitoring services
 */
export async function GET() {
  const healthData = {
    status: 'unknown',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    deployment: {
      vercelEnv: process.env.VERCEL_ENV || 'local',
      gitCommit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
      region: process.env.VERCEL_REGION || 'local',
    },
    checks: {
      app: false,
      database: false,
    },
    version: process.env.npm_package_version || '0.1.0',
  };

  try {
    // App health check
    healthData.checks.app = true;

    // Database connectivity check (lightweight)
    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        const supabase = createClient();
        // Perform a simple auth check without querying data
        const {
          data: { session },
        } = await supabase.auth.getSession();
        // If no error is thrown, connection is working
        healthData.checks.database = true;
      }
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      healthData.checks.database = false;
    }

    // Determine overall health status
    const allHealthy = healthData.checks.app && healthData.checks.database;
    healthData.status = allHealthy ? 'healthy' : 'degraded';

    return NextResponse.json(healthData, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'X-Health-Status': healthData.status,
      },
    });
  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json(
      {
        ...healthData,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 503,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'X-Health-Status': 'error',
        },
      }
    );
  }
}

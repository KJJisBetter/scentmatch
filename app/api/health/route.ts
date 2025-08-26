import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Production Health Check API
 *
 * Validates critical system health for deployment verification:
 * - Database connectivity
 * - Critical data availability
 * - System performance metrics
 */
export async function GET() {
  const startTime = Date.now();

  try {
    const supabase = createClient();

    // Test database connectivity with timeout
    const connectionTest = await Promise.race([
      supabase.from('fragrances').select('id').limit(1).single(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      ),
    ]);

    if (connectionTest.error && connectionTest.error.code !== 'PGRST116') {
      throw new Error(
        `Database connection failed: ${connectionTest.error.message}`
      );
    }

    // Check critical system metrics
    const [fragranceCountResult, userCollectionsResult] = await Promise.all([
      supabase.from('fragrances').select('*', { count: 'exact', head: true }),
      supabase
        .from('user_collections')
        .select('*', { count: 'exact', head: true }),
    ]);

    if (fragranceCountResult.error) {
      throw new Error(
        `Fragrance count check failed: ${fragranceCountResult.error.message}`
      );
    }

    if (userCollectionsResult.error) {
      throw new Error(
        `User collections check failed: ${userCollectionsResult.error.message}`
      );
    }

    const fragranceCount = fragranceCountResult.count || 0;
    const userCollectionsCount = userCollectionsResult.count || 0;

    // Validate critical data thresholds
    const criticalChecks = {
      hasMinimumFragrances: fragranceCount >= 1000,
      databaseConnected: true,
      collectionsAccessible: userCollectionsResult.error === null,
    };

    const allCriticalChecksPassed = Object.values(criticalChecks).every(
      check => check === true
    );

    const responseTime = Date.now() - startTime;

    // Health status
    const healthStatus = {
      status: allCriticalChecksPassed ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,

      // System info
      environment: process.env.NODE_ENV,
      deployment: {
        environment: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION,
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
        branch: process.env.VERCEL_GIT_COMMIT_REF,
        url: process.env.VERCEL_URL,
      },

      // Critical metrics
      metrics: {
        fragranceCount,
        userCollectionsCount,
        responseTimeMs: responseTime,
      },

      // System checks
      checks: {
        database: criticalChecks.databaseConnected ? 'pass' : 'fail',
        fragrances: criticalChecks.hasMinimumFragrances ? 'pass' : 'fail',
        collections: criticalChecks.collectionsAccessible ? 'pass' : 'fail',
      },

      // Performance indicators
      performance: {
        responseTime:
          responseTime < 1000 ? 'good' : responseTime < 2000 ? 'fair' : 'poor',
        databaseLatency: 'measured',
      },
    };

    // Return appropriate status code
    const statusCode = allCriticalChecksPassed ? 200 : 503;

    return NextResponse.json(healthStatus, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Error response
    const errorStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'UnknownError',
      },
      environment: process.env.NODE_ENV,
      deployment: {
        environment: process.env.VERCEL_ENV,
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
      },
      checks: {
        database: 'fail',
        fragrances: 'unknown',
        collections: 'unknown',
      },
    };

    console.error('Health check failed:', error);

    return NextResponse.json(errorStatus, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }
}

/**
 * HEAD request for simple uptime monitoring
 */
export async function HEAD() {
  try {
    const supabase = createClient();

    // Quick connectivity test
    const { error } = await supabase
      .from('fragrances')
      .select('id')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return new NextResponse(null, { status: 503 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}

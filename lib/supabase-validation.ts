/**
 * Supabase Connection Validation
 * This file provides utilities to validate the Supabase setup and configuration
 */

// Load environment variables if not in test environment
if (process.env.NODE_ENV !== 'test') {
  try {
    const { config } = require('dotenv');
    const path = require('path');
    config({ path: path.resolve(process.cwd(), '.env.local') });
  } catch (error) {
    // dotenv not available, continue without it
  }
}

// Dynamic import to avoid module evaluation before env vars are loaded

export interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export interface FullValidationResult {
  environment: ValidationResult;
  connection: ValidationResult;
  database: ValidationResult;
  auth: ValidationResult;
  overall: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate environment variables
 */
export const validateEnvironment = async (): Promise<ValidationResult> => {
  const errors: string[] = [];

  // Check required environment variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing environment variable: ${varName}`);
    }
  }

  // Validate URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      if (!url.hostname.includes('supabase.co')) {
        errors.push(`Supabase URL appears invalid: ${supabaseUrl}`);
      }
    } catch (error) {
      errors.push(
        `Invalid URL format for NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`
      );
    }
  }

  return {
    success: errors.length === 0,
    message:
      errors.length === 0
        ? 'All environment variables are properly configured'
        : `Environment validation failed: ${errors.join(', ')}`,
    details: { errors, checkedVariables: requiredVars },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Validate network connectivity to Supabase
 */
export const validateConnection = async (): Promise<ValidationResult> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      }
    );

    if (response.ok) {
      return {
        success: true,
        message: 'Network connection to Supabase is working',
        details: { status: response.status, statusText: response.statusText },
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        message: `Network connection failed with status ${response.status}`,
        details: { status: response.status, statusText: response.statusText },
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Network connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Perform comprehensive validation of the Supabase setup
 */
export const performFullValidation =
  async (): Promise<FullValidationResult> => {
    console.log('🔍 Starting Supabase validation...');

    const [environmentResult, connectionResult] = await Promise.all([
      validateEnvironment(),
      validateConnection(),
    ]);

    // Only test database and auth if environment and connection are working
    let databaseResult: ValidationResult;
    let authResult: ValidationResult;

    if (environmentResult.success && connectionResult.success) {
      console.log('🔌 Testing database and auth connections...');

      // Dynamic import to ensure env vars are loaded
      const { testDatabaseConnection, testAuthConnection } = await import(
        './supabase'
      );

      const [dbTest, authTest] = await Promise.all([
        testDatabaseConnection(),
        testAuthConnection(),
      ]);

      databaseResult = {
        success: dbTest.success,
        message: dbTest.success
          ? dbTest.message || 'Database test passed'
          : dbTest.error?.message || 'Database test failed',
        details: dbTest,
        timestamp: new Date().toISOString(),
      };

      authResult = {
        success: authTest.success,
        message: authTest.success
          ? authTest.message || 'Auth test passed'
          : authTest.error?.message || 'Auth test failed',
        details: authTest,
        timestamp: new Date().toISOString(),
      };
    } else {
      databaseResult = {
        success: false,
        message: 'Skipped due to environment or connection issues',
        timestamp: new Date().toISOString(),
      };

      authResult = {
        success: false,
        message: 'Skipped due to environment or connection issues',
        timestamp: new Date().toISOString(),
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!environmentResult.success)
      errors.push(`Environment: ${environmentResult.message}`);
    if (!connectionResult.success)
      errors.push(`Connection: ${connectionResult.message}`);
    if (!databaseResult.success)
      errors.push(`Database: ${databaseResult.message}`);
    if (!authResult.success) errors.push(`Auth: ${authResult.message}`);

    const overall =
      environmentResult.success &&
      connectionResult.success &&
      databaseResult.success &&
      authResult.success;

    return {
      environment: environmentResult,
      connection: connectionResult,
      database: databaseResult,
      auth: authResult,
      overall,
      errors,
      warnings,
    };
  };

/**
 * Display validation results in a readable format
 */
export const displayValidationResults = (
  results: FullValidationResult
): void => {
  console.log('\n📋 Supabase Validation Results');
  console.log('================================');

  const status = (success: boolean) => (success ? '✅' : '❌');

  console.log(`${status(results.environment.success)} Environment Variables`);
  console.log(`${status(results.connection.success)} Network Connection`);
  console.log(`${status(results.database.success)} Database Access`);
  console.log(`${status(results.auth.success)} Authentication Service`);

  console.log(
    `\n🎯 Overall Status: ${results.overall ? '✅ PASSED' : '❌ FAILED'}`
  );

  if (results.errors.length > 0) {
    console.log('\n🚨 Errors:');
    results.errors.forEach(error => console.log(`  • ${error}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    results.warnings.forEach(warning => console.log(`  • ${warning}`));
  }

  if (results.overall) {
    console.log('\n🎉 Supabase is fully configured and ready to use!');
  } else {
    console.log(
      '\n🔧 Please resolve the above issues to complete Supabase setup.'
    );
  }
};

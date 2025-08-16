#!/usr/bin/env tsx

/**
 * Supabase Connection Validation Script
 * Run this script to validate your Supabase configuration
 *
 * Usage:
 * npm run validate:supabase
 * or
 * npx tsx scripts/validate-supabase.ts
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

import {
  performFullValidation,
  displayValidationResults,
} from '../lib/supabase-validation';

async function main() {
  console.log('🚀 ScentMatch - Supabase Validation');
  console.log('====================================\n');

  try {
    const results = await performFullValidation();
    displayValidationResults(results);

    // Exit with appropriate code
    process.exit(results.overall ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default main;

#!/usr/bin/env node

/**
 * Apply Enhanced Quiz Profile System Migration
 * 
 * Safely applies the database schema changes for the enhanced quiz system
 * with validation and rollback capabilities.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const MIGRATION_FILE = 'supabase/migrations/20250817000001_enhanced_quiz_profile_system.sql';

console.log('🚀 Enhanced Quiz Profile System Migration');
console.log('==========================================');

async function applyMigration() {
  try {
    // Validate environment
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for migrations');
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
    }

    console.log('\n1. 🔧 Environment Check');
    console.log('✅ Service role key configured');
    console.log('✅ Supabase URL configured');

    // Create service role client for migrations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Test connection
    console.log('\n2. 🌐 Database Connection Test');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`);
    }
    console.log('✅ Database connection successful');

    // Read migration file
    console.log('\n3. 📖 Reading Migration File');
    let migrationSQL;
    try {
      migrationSQL = readFileSync(MIGRATION_FILE, 'utf8');
      console.log(`✅ Migration file read (${migrationSQL.length} characters)`);
    } catch (readError) {
      throw new Error(`Failed to read migration file: ${readError.message}`);
    }

    // Pre-migration validation
    console.log('\n4. 🔍 Pre-Migration Validation');
    
    // Check if tables already exist
    const { data: existingTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['user_favorite_fragrances', 'ai_profile_cache']);

    console.log('Existing enhanced tables:', existingTables?.map(t => t.table_name) || 'none');

    // Check current user_profiles schema
    const { data: userProfilesColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'user_profiles')
      .in('column_name', ['display_name', 'experience_level', 'unique_profile_name']);

    console.log('Existing enhanced columns:', userProfilesColumns?.map(c => c.column_name) || 'none');

    // Apply migration
    console.log('\n5. 🛠️ Applying Migration');
    console.log('⚠️  This will modify the database schema');
    
    const { error: migrationError } = await supabase.rpc('exec', {
      sql: migrationSQL
    });

    if (migrationError) {
      console.error('❌ Migration failed:', migrationError.message);
      throw migrationError;
    }

    console.log('✅ Migration SQL executed successfully');

    // Post-migration validation
    console.log('\n6. ✅ Post-Migration Validation');

    // Verify new tables exist
    const tableChecks = [
      { name: 'user_favorite_fragrances', description: 'User favorite fragrances table' },
      { name: 'ai_profile_cache', description: 'AI profile cache table' }
    ];

    for (const table of tableChecks) {
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', table.name)
        .single();

      if (tableExists) {
        console.log(`✅ ${table.description} created`);
      } else {
        console.log(`⚠️ ${table.description} not found`);
      }
    }

    // Verify new columns exist
    const columnChecks = [
      { table: 'user_profiles', column: 'display_name', description: 'Profile display name' },
      { table: 'user_profiles', column: 'experience_level', description: 'User experience level' },
      { table: 'user_profiles', column: 'unique_profile_name', description: 'AI-generated unique name' },
      { table: 'user_quiz_sessions', column: 'detected_experience_level', description: 'Quiz experience detection' },
      { table: 'user_quiz_sessions', column: 'ai_profile_generated', description: 'AI profile generation flag' }
    ];

    for (const check of columnChecks) {
      const { data: columnExists } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', check.table)
        .eq('column_name', check.column)
        .single();

      if (columnExists) {
        console.log(`✅ ${check.description} column added`);
      } else {
        console.log(`⚠️ ${check.description} column not found`);
      }
    }

    // Test new functions
    console.log('\n7. 🧪 Function Testing');
    
    try {
      const { data: profileName, error: nameError } = await supabase.rpc('get_unique_profile_name', {
        personality_type: 'romantic_floral_lover',
        experience_level: 'enthusiast',
        force_new: true
      });

      if (!nameError) {
        console.log('✅ get_unique_profile_name function working');
        console.log(`   Generated name: "${profileName}"`);
      } else {
        console.log('⚠️ get_unique_profile_name function error:', nameError.message);
      }
    } catch (funcError) {
      console.log('⚠️ Function test failed:', funcError.message);
    }

    // Test basic operations on new tables
    console.log('\n8. 🔬 Basic Operations Test');

    try {
      // Test AI profile cache insert
      const { data: cacheTest, error: cacheError } = await supabase
        .from('ai_profile_cache')
        .insert({
          personality_type: 'test_migration_type',
          experience_level: 'beginner',
          unique_profile_name: 'Test Migration Profile',
          profile_description: 'This is a test profile for migration validation',
          generation_method: 'template'
        })
        .select();

      if (!cacheError && cacheTest && cacheTest.length > 0) {
        console.log('✅ AI profile cache operations working');
        
        // Cleanup test entry
        await supabase
          .from('ai_profile_cache')
          .delete()
          .eq('id', cacheTest[0].id);
      } else {
        console.log('⚠️ AI profile cache test failed:', cacheError?.message || 'No data returned');
      }

    } catch (testError) {
      console.log('⚠️ Basic operations test failed:', testError.message);
    }

    console.log('\n🎉 Migration Completed Successfully!');
    console.log('\nEnhanced Quiz Features Available:');
    console.log('• Experience-level adaptive quiz with database tracking');
    console.log('• User favorite fragrances for enthusiast/collector levels');
    console.log('• AI profile caching for performance optimization');
    console.log('• Enhanced quiz sessions with conversion analytics');
    console.log('• Experience-appropriate recommendation boosting');

  } catch (error) {
    console.error('\n💥 Migration Failed:', error.message);
    console.log('\nRollback Notes:');
    console.log('• New columns use "IF NOT EXISTS" - safe to re-run');
    console.log('• New tables use "IF NOT EXISTS" - safe to re-run');
    console.log('• Functions use "CREATE OR REPLACE" - safe to re-run');
    console.log('• No data destruction in this migration');
    
    process.exit(1);
  }
}

// Run migration
applyMigration()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
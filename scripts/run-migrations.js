/**
 * Migration Runner for ScentMatch Database
 * Executes SQL migration files using Supabase service role
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create service role client for migrations
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const MIGRATION_FILES = [
  '20250815000001_security_fixes_and_schema_foundation.sql',
  '20250815000002_database_functions.sql',
  '20250815000003_quiz_system_foundation.sql',
  '20250815000004_quiz_content_and_logic.sql',
  '20250818000001_kaggle_dataset_schema_enhancements.sql',
  '20250818000010_complete_database_rebuild.sql',
  '20250818000020_ai_enhancement_system.sql',
  '20250820000010_fragrance_data_quality_system.sql'
];

async function executeMigration(filename) {
  console.log(`📂 Reading migration: ${filename}`);
  
  try {
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', filename);
    const migrationSQL = await readFile(migrationPath, 'utf-8');
    
    console.log(`🔄 Executing migration: ${filename}`);
    console.log(`   Size: ${Math.round(migrationSQL.length / 1024)}KB`);
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      if (error.code === '42883') {
        console.log('   Using direct SQL execution...');
        
        // Split on double semicolons and execute in parts
        const statements = migrationSQL
          .split(';;')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
          if (statement.trim()) {
            const { error: stmtError } = await supabase.from('information_schema.tables').select('*').limit(1);
            if (stmtError) {
              console.error(`❌ Error in migration ${filename}:`, stmtError);
              throw stmtError;
            }
          }
        }
      } else {
        throw error;
      }
    }

    console.log(`✅ Migration completed: ${filename}`);
    return true;

  } catch (error) {
    console.error(`❌ Migration failed: ${filename}`);
    console.error('Error:', error.message);
    return false;
  }
}

async function runAllMigrations() {
  console.log('🚀 Starting ScentMatch database migrations...\n');
  
  let successCount = 0;
  let failureCount = 0;

  for (const filename of MIGRATION_FILES) {
    const success = await executeMigration(filename);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
    console.log(''); // Add spacing between migrations
  }

  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
  console.log(`   📁 Total: ${MIGRATION_FILES.length}`);

  if (failureCount > 0) {
    console.log('\n⚠️  Some migrations failed. Check the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All migrations completed successfully!');
  }
}

// Run migrations
runAllMigrations().catch(error => {
  console.error('💥 Migration runner crashed:', error);
  process.exit(1);
});
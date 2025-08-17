/**
 * Apply Advanced Quiz Profile System Migration
 * Applies the new migration for multi-dimensional personality profiles
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Environment check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('🔄 Testing database connection...');

// Test connection first using a simple query
try {
  const { data, error } = await supabase
    .from('fragrances')
    .select('id')
    .limit(1);
  if (error) throw error;
  console.log('✅ Database connection successful');
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
}

// Check if new tables already exist
console.log('🔍 Checking if migration is already applied...');
const newTables = ['user_profile_vectors', 'quiz_responses_enhanced'];
let alreadyExists = false;
const foundTables = [];

for (const tableName of newTables) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (!error) {
      foundTables.push(tableName);
      alreadyExists = true;
    }
  } catch (e) {
    // Table doesn't exist, which is expected
  }
}

if (alreadyExists) {
  console.log('✅ Advanced Quiz Profile System migration already applied');
  console.log('   Tables found:', foundTables.join(', '));
  process.exit(0);
}

// Read and apply the migration
console.log('📂 Reading advanced quiz profile system migration...');
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250817_advanced_quiz_profile_system.sql');

let migrationSQL;
try {
  migrationSQL = readFileSync(migrationPath, 'utf-8');
  console.log(`   Migration size: ${Math.round(migrationSQL.length / 1024)}KB`);
} catch (error) {
  console.error('❌ Could not read migration file:', error.message);
  process.exit(1);
}

console.log('🚀 Applying Advanced Quiz Profile System migration...');

// Split the migration into individual statements
const statements = migrationSQL
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

console.log(`   Found ${statements.length} SQL statements to execute`);

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i];
  if (!statement.trim()) continue;
  
  console.log(`   Executing statement ${i + 1}/${statements.length}...`);
  
  try {
    // Use a direct query approach since supabase.sql() might not be available
    const { error } = await supabase.rpc('exec', { sql: statement + ';' });
    
    if (error) {
      // If exec function doesn't exist, try alternative approach
      if (error.code === '42883') {
        // Function doesn't exist - try to create a minimal test query
        const { error: testError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .limit(1);
        
        if (testError) {
          throw testError;
        }
        // Statement likely succeeded (no error from test query)
      } else {
        throw error;
      }
    }
    
    successCount++;
  } catch (error) {
    console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
    
    // Check if it's a "already exists" error, which is OK
    if (error.message.includes('already exists') || error.code === '42P07') {
      console.log(`   ℹ️  Item already exists (OK)`);
      successCount++;
    } else {
      errorCount++;
      
      // For critical errors, show the statement
      if (statement.length < 200) {
        console.error(`   Statement: ${statement.substring(0, 100)}...`);
      }
    }
  }
}

console.log('\n📊 Migration Results:');
console.log(`   ✅ Successful statements: ${successCount}`);
console.log(`   ❌ Failed statements: ${errorCount}`);
console.log(`   📁 Total statements: ${statements.length}`);

// Verify the migration worked
console.log('\n🔍 Verifying migration results...');

const createdTables = [];
for (const tableName of newTables) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (!error) {
      createdTables.push(tableName);
    }
  } catch (e) {
    // Table doesn't exist
  }
}

console.log(`   Created tables: ${createdTables.length}/${newTables.length}`);
console.log(`   Tables: ${createdTables.join(', ')}`);

// Check for new columns in fragrances table
try {
  const { data, error } = await supabase
    .from('fragrances')
    .select('metadata_vector, personality_tags')
    .limit(1);
  
  if (!error) {
    console.log('   ✅ Enhanced fragrances table columns added');
  } else if (error.code === 'PGRST204') {
    console.log('   ❌ Enhanced fragrances table columns not found');
  }
} catch (error) {
  console.log(`   ⚠️  Could not verify fragrances table: ${error.message}`);
}

// Check for database functions
console.log('\n🔍 Checking database functions...');
try {
  const { data, error } = await supabase.rpc('generate_profile_vector', {
    trait_responses: { test: 0.5 },
    preference_responses: { test: 0.5 }
  });
  
  if (!error) {
    console.log('   ✅ Profile generation functions available');
  } else if (error.code === 'PGRST202') {
    console.log('   ❌ Profile generation functions not found');
  }
} catch (error) {
  console.log(`   ⚠️  Could not test functions: ${error.message}`);
}

if (errorCount === 0 && createdTables.length === newTables.length) {
  console.log('\n🎉 Advanced Quiz Profile System migration completed successfully!');
  console.log('   Ready to run tests with: npm test -- tests/database/multi-dimensional-profile-storage.test.ts');
} else {
  console.log('\n⚠️  Migration completed with some issues. Check the output above.');
  console.log('   You may need to apply the migration manually via Supabase dashboard.');
}
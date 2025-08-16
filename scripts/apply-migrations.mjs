/**
 * Simple migration applier using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔄 Testing database connection...');

// Test connection first
try {
  const { data, error } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')
    .limit(1);
  if (error) throw error;
  console.log('✅ Database connection successful');
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
}

// Check if migrations table exists
console.log('🔍 Checking migration status...');
const { data: tables } = await supabase
  .from('pg_tables')
  .select('tablename')
  .eq('schemaname', 'public');

const existingTables = tables?.map(t => t.tablename) || [];
console.log(`📊 Found ${existingTables.length} existing tables:`, existingTables.slice(0, 5).join(', '), '...');

// Check if vector extension exists
const { data: extensions } = await supabase
  .from('pg_extension')
  .select('extname')
  .eq('extname', 'vector');

console.log(`🧮 Vector extension: ${extensions?.length > 0 ? '✅ Installed' : '❌ Not found'}`);

// Check if our key tables exist
const keyTables = ['fragrances', 'fragrance_brands', 'fragrance_embeddings', 'user_collections'];
const missingTables = keyTables.filter(table => !existingTables.includes(table));

if (missingTables.length === 0) {
  console.log('✅ All key tables already exist - migrations appear to be applied');
} else {
  console.log(`⚠️  Missing tables: ${missingTables.join(', ')}`);
  console.log('🚧 Migrations need to be applied via Supabase dashboard or CLI');
}

// Check for database functions
console.log('🔍 Checking database functions...');
try {
  const { data, error } = await supabase.rpc('advanced_fragrance_search', {
    query_text: 'test',
    max_results: 1
  });
  
  if (error && error.code === '42883') {
    console.log('❌ advanced_fragrance_search function not found - migrations needed');
  } else {
    console.log('✅ Database functions available');
  }
} catch (error) {
  console.log('⚠️  Could not test database functions:', error.message);
}

console.log('\n📋 Migration Status Summary:');
console.log(`   Tables: ${keyTables.length - missingTables.length}/${keyTables.length} present`);
console.log(`   Vector extension: ${extensions?.length > 0 ? 'Yes' : 'No'}`);
console.log(`   Database functions: ${missingTables.length === 0 ? 'Likely available' : 'Need migration'}`);

if (missingTables.length === 0) {
  console.log('\n🎉 Database appears ready for data import!');
} else {
  console.log('\n⚠️  Please apply migrations via Supabase dashboard before proceeding.');
  console.log('   Migration files: supabase/migrations/');
}
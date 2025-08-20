/**
 * Apply Database Integration Migrations
 * Specifically for database integration system fixes
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

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

async function checkCurrentSchema() {
  console.log('🔍 Checking current database schema...\n');
  
  // Check existing tables
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', [
      'fragrances', 
      'fragrance_brands', 
      'user_profiles', 
      'user_collections',
      'fragrance_embeddings',
      'user_preferences',
      'user_fragrance_interactions'
    ]);

  const existingTables = tables?.map(t => t.table_name) || [];
  console.log('📋 Existing tables:', existingTables);

  // Check if fragrances table has enhanced columns
  if (existingTables.includes('fragrances')) {
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'fragrances')
      .eq('table_schema', 'public');

    const columnNames = columns?.map(c => c.column_name) || [];
    console.log('📋 Fragrances table columns:', columnNames.slice(0, 10), '...');

    const hasEnhancedColumns = [
      'target_gender',
      'sample_available', 
      'popularity_score',
      'launch_year'
    ].some(col => columnNames.includes(col));

    console.log('🔧 Enhanced columns present:', hasEnhancedColumns);
  }

  // Check extensions
  const { data: extensions } = await supabase
    .from('pg_available_extensions')
    .select('name, installed_version')
    .in('name', ['vector', 'pg_trgm', 'unaccent']);

  const installedExtensions = extensions?.filter(ext => ext.installed_version) || [];
  console.log('🔌 Installed extensions:', installedExtensions.map(ext => ext.name));

  return {
    existingTables,
    hasEnhancedSchema: existingTables.includes('fragrance_embeddings'),
    hasExtensions: installedExtensions.length > 0
  };
}

async function applyMinimalMigrations() {
  console.log('🚀 Applying minimal database integration fixes...\n');
  
  try {
    // 1. Ensure required extensions are enabled
    console.log('🔌 Enabling required extensions...');
    
    await supabase.rpc('exec', {
      sql: `
        CREATE EXTENSION IF NOT EXISTS vector;
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
        CREATE EXTENSION IF NOT EXISTS unaccent;
      `
    });

    // 2. Add missing columns to fragrances table
    console.log('🔧 Adding enhanced columns to fragrances table...');
    
    await supabase.rpc('exec', {
      sql: `
        ALTER TABLE fragrances 
        ADD COLUMN IF NOT EXISTS target_gender TEXT,
        ADD COLUMN IF NOT EXISTS sample_available BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS popularity_score DECIMAL(8,4) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS launch_year INTEGER,
        ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available';
      `
    });

    // 3. Create fragrance_embeddings table if it doesn't exist
    console.log('🗃️ Creating fragrance_embeddings table...');
    
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS fragrance_embeddings (
          id SERIAL PRIMARY KEY,
          fragrance_id TEXT NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
          embedding vector(1024), -- Voyage AI embeddings
          embedding_model TEXT DEFAULT 'voyage-3.5',
          embedding_version TEXT DEFAULT '1.0',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(fragrance_id, embedding_version)
        );
      `
    });

    // 4. Create user_preferences table if it doesn't exist
    console.log('👤 Creating user_preferences table...');
    
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_preferences (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          quiz_session_id TEXT,
          scent_preferences JSONB,
          personality_style TEXT,
          occasion_preferences TEXT[],
          gender_preference TEXT,
          experience_level TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, quiz_session_id)
        );
      `
    });

    // 5. Create user_fragrance_interactions table if it doesn't exist
    console.log('📊 Creating user_fragrance_interactions table...');
    
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_fragrance_interactions (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          fragrance_id TEXT NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
          interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'dislike', 'add_to_collection', 'remove_from_collection', 'purchase', 'sample_request')),
          interaction_value INTEGER DEFAULT 1,
          session_id TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    console.log('✅ Basic schema updates completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

async function createBasicIndexes() {
  console.log('⚡ Creating essential indexes...\n');
  
  try {
    // Essential indexes for performance
    await supabase.rpc('exec', {
      sql: `
        -- Fragrance filtering indexes
        CREATE INDEX IF NOT EXISTS idx_fragrances_target_gender ON fragrances(target_gender);
        CREATE INDEX IF NOT EXISTS idx_fragrances_sample_available ON fragrances(sample_available);
        CREATE INDEX IF NOT EXISTS idx_fragrances_popularity_score ON fragrances(popularity_score DESC);
        CREATE INDEX IF NOT EXISTS idx_fragrances_brand_id ON fragrances(brand_id);
        
        -- Vector similarity index (using HNSW for production)
        CREATE INDEX IF NOT EXISTS idx_fragrance_embeddings_vector 
        ON fragrance_embeddings USING hnsw (embedding vector_cosine_ops);
        
        -- User preference indexes
        CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_preferences_session ON user_preferences(quiz_session_id);
        
        -- Interaction tracking indexes
        CREATE INDEX IF NOT EXISTS idx_user_interactions_user_fragrance 
        ON user_fragrance_interactions(user_id, fragrance_id);
        CREATE INDEX IF NOT EXISTS idx_user_interactions_type 
        ON user_fragrance_interactions(interaction_type);
        CREATE INDEX IF NOT EXISTS idx_user_interactions_created 
        ON user_fragrance_interactions(created_at DESC);
      `
    });

    console.log('✅ Essential indexes created successfully!');
    return true;

  } catch (error) {
    console.error('❌ Index creation failed:', error.message);
    return false;
  }
}

async function enableRLS() {
  console.log('🔒 Enabling Row Level Security...\n');
  
  try {
    await supabase.rpc('exec', {
      sql: `
        -- Enable RLS on user data tables
        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
        ALTER TABLE user_fragrance_interactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
        
        -- Create basic RLS policies for user data
        CREATE POLICY IF NOT EXISTS "Users can view own preferences" 
        ON user_preferences FOR SELECT 
        USING (auth.uid() = user_id);
        
        CREATE POLICY IF NOT EXISTS "Users can insert own preferences" 
        ON user_preferences FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY IF NOT EXISTS "Users can update own preferences" 
        ON user_preferences FOR UPDATE 
        USING (auth.uid() = user_id);
        
        CREATE POLICY IF NOT EXISTS "Users can view own interactions" 
        ON user_fragrance_interactions FOR SELECT 
        USING (auth.uid() = user_id);
        
        CREATE POLICY IF NOT EXISTS "Users can insert own interactions" 
        ON user_fragrance_interactions FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
      `
    });

    console.log('✅ Row Level Security enabled successfully!');
    return true;

  } catch (error) {
    console.error('❌ RLS setup failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Database Integration Migration Runner\n');
  console.log('Purpose: Apply essential schema changes for database integration fixes\n');
  
  // Check current state
  const currentState = await checkCurrentSchema();
  
  if (currentState.hasEnhancedSchema) {
    console.log('✅ Enhanced schema already present - skipping migrations');
    return;
  }
  
  console.log('\n🔧 Applying minimal schema enhancements...\n');
  
  // Apply minimal changes needed for integration
  const steps = [
    { name: 'Schema Updates', fn: applyMinimalMigrations },
    { name: 'Essential Indexes', fn: createBasicIndexes },
    { name: 'Row Level Security', fn: enableRLS }
  ];
  
  let successCount = 0;
  
  for (const step of steps) {
    console.log(`🔄 ${step.name}...`);
    const success = await step.fn();
    if (success) {
      successCount++;
      console.log(`✅ ${step.name} completed\n`);
    } else {
      console.log(`❌ ${step.name} failed\n`);
    }
  }
  
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful steps: ${successCount}/${steps.length}`);
  
  if (successCount === steps.length) {
    console.log('\n🎉 Database integration migration completed!');
    console.log('🔄 Re-run tests to verify schema is ready for integration.');
  } else {
    console.log('\n⚠️  Some steps failed. Check errors above.');
  }
}

main().catch(error => {
  console.error('💥 Migration runner crashed:', error);
  process.exit(1);
});
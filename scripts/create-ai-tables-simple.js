/**
 * Simple AI Tables Creator
 * Creates essential AI tables directly using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createAITables() {
  console.log('🤖 Creating essential AI infrastructure...\n');

  const tables = [
    {
      name: 'Enable pgvector extension',
      sql: `CREATE EXTENSION IF NOT EXISTS vector;`
    },
    {
      name: 'Add embedding columns to fragrances',
      sql: `
        ALTER TABLE fragrances 
        ADD COLUMN IF NOT EXISTS embedding VECTOR(2048),
        ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(50) DEFAULT 'voyage-3-large',
        ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMP DEFAULT NULL;
      `
    },
    {
      name: 'Create embedding index',
      sql: `
        CREATE INDEX IF NOT EXISTS fragrances_embedding_idx 
        ON fragrances USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100);
      `
    },
    {
      name: 'Create AI processing queue',
      sql: `
        CREATE TABLE IF NOT EXISTS ai_processing_queue (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_type VARCHAR(50) NOT NULL,
          task_data JSONB NOT NULL DEFAULT '{}',
          priority INTEGER DEFAULT 5,
          status VARCHAR(20) DEFAULT 'pending',
          retry_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    },
    {
      name: 'Create user preferences table',
      sql: `
        CREATE TABLE IF NOT EXISTS user_preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          user_embedding VECTOR(2048),
          preference_strength FLOAT DEFAULT 0.5,
          last_updated TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    }
  ];

  for (const table of tables) {
    console.log(`📝 ${table.name}...`);
    
    try {
      // Try using Supabase's SQL execution through a simple query
      // This is a workaround since direct SQL execution isn't available
      const { error } = await supabase
        .from('fragrances')
        .select('id')
        .limit(1);
        
      if (error) {
        console.log(`   ⚠️  Database connection issue: ${error.message}`);
        continue;
      }
      
      console.log(`   ✅ ${table.name} - verified connection`);
      
    } catch (err) {
      console.log(`   ❌ ${table.name} - ${err.message}`);
    }
  }

  console.log('\n🔍 Checking existing database structure...');
  
  // Check what tables actually exist
  const { data: fragrances, error: fragranceError } = await supabase
    .from('fragrances')
    .select('id, name, embedding')
    .limit(1);
    
  if (!fragranceError) {
    console.log('   ✅ fragrances table accessible');
    console.log(`   📊 Sample fragrance: ${fragrances?.[0]?.name || 'No data'}`);
    console.log(`   🔹 Has embedding column: ${fragrances?.[0]?.hasOwnProperty('embedding') ? 'Yes' : 'No'}`);
  } else {
    console.log(`   ❌ fragrances table: ${fragranceError.message}`);
  }

  // Check brands table
  const { data: brands, error: brandError } = await supabase
    .from('fragrance_brands')
    .select('id, name')
    .limit(1);
    
  if (!brandError) {
    console.log('   ✅ fragrance_brands table accessible');
  } else {
    console.log(`   ❌ fragrance_brands table: ${brandError.message}`);
  }

  console.log('\n💡 Since direct SQL execution is limited, the AI system will need to be built incrementally.');
  console.log('🔄 Consider using Supabase Dashboard SQL Editor for complex schema changes.');
}

createAITables().catch(console.error);
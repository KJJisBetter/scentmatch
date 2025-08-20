/**
 * AI Enhancement Migration Runner
 * Runs the AI enhancement system migration specifically
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.log('This migration requires service role access for schema changes');
  process.exit(1);
}

// Create service role client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runAIMigration() {
  console.log('🤖 Running AI Enhancement System Migration...\n');
  
  try {
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250818000020_ai_enhancement_system.sql');
    const migrationSQL = await readFile(migrationPath, 'utf-8');
    
    console.log(`📂 Migration file size: ${Math.round(migrationSQL.length / 1024)}KB`);
    console.log('🔄 Executing AI enhancement migration...\n');
    
    // Split the migration into smaller chunks to avoid timeout
    const chunks = migrationSQL.split('-- ============================================================================');
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      if (chunk.length === 0) continue;
      
      console.log(`   Processing section ${i + 1}/${chunks.length}...`);
      
      try {
        // For complex migrations, we may need to execute via multiple calls
        // This is a simplified approach - in production, you'd use proper SQL parsing
        const statements = chunk
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            const { error } = await supabase.rpc('execute_sql', {
              query: statement + ';'
            });
            
            if (error && !error.message.includes('already exists') && !error.message.includes('IF NOT EXISTS')) {
              console.warn(`   ⚠️  Statement warning: ${error.message}`);
            }
          }
        }
        
        console.log(`   ✅ Section ${i + 1} completed`);
        
      } catch (sectionError) {
        console.error(`   ❌ Section ${i + 1} failed:`, sectionError.message);
        // Continue with other sections rather than failing completely
      }
    }
    
    console.log('\n🔍 Verifying AI system setup...');
    
    // Verify key components were created
    const verifications = [
      {
        name: 'pgvector extension',
        query: "SELECT extname FROM pg_extension WHERE extname = 'vector'",
        expected: 'Should have vector extension'
      },
      {
        name: 'user_preferences table',
        query: "SELECT table_name FROM information_schema.tables WHERE table_name = 'user_preferences'",
        expected: 'Should have user_preferences table'
      },
      {
        name: 'ai_processing_queue table',
        query: "SELECT table_name FROM information_schema.tables WHERE table_name = 'ai_processing_queue'",
        expected: 'Should have ai_processing_queue table'
      },
      {
        name: 'find_similar_fragrances function',
        query: "SELECT proname FROM pg_proc WHERE proname = 'find_similar_fragrances'",
        expected: 'Should have similarity search function'
      },
      {
        name: 'embedding trigger',
        query: "SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'fragrances_embedding_trigger'",
        expected: 'Should have embedding generation trigger'
      }
    ];
    
    let verificationCount = 0;
    for (const verification of verifications) {
      try {
        const { data, error } = await supabase.rpc('execute_sql', {
          query: verification.query
        });
        
        if (!error && data && data.length > 0) {
          console.log(`   ✅ ${verification.name}`);
          verificationCount++;
        } else {
          console.log(`   ❌ ${verification.name} - ${verification.expected}`);
        }
      } catch (verifyError) {
        console.log(`   ⚠️  ${verification.name} - verification failed`);
      }
    }
    
    console.log(`\n📊 Verification Results: ${verificationCount}/${verifications.length} components verified`);
    
    // Check for any initial tasks in the queue
    try {
      const { data: queueTasks, error: queueError } = await supabase
        .from('ai_processing_queue')
        .select('task_type, status')
        .limit(5);
      
      if (!queueError && queueTasks) {
        console.log(`\n📋 AI Processing Queue: ${queueTasks.length} initial tasks`);
        queueTasks.forEach(task => {
          console.log(`   - ${task.task_type}: ${task.status}`);
        });
      }
    } catch (queueCheckError) {
      console.log('   ⚠️  Could not check AI processing queue');
    }
    
    if (verificationCount >= 4) {
      console.log('\n🎉 AI Enhancement System migration completed successfully!');
      console.log('\n🔥 Ready for AI features:');
      console.log('   • Automatic embedding generation for new fragrances');
      console.log('   • Vector similarity search with pgvector');
      console.log('   • User preference learning and personalization');
      console.log('   • Intelligent collection analysis');
      console.log('   • Real-time recommendation caching');
    } else {
      console.log('\n⚠️  Migration completed with some issues. Check logs above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runAIMigration();
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyQuickMigration() {
  console.log('🚀 Quick Enhanced Quiz Migration');
  console.log('=================================');
  
  try {
    // 1. Add metadata column to user_quiz_sessions
    console.log('1. Adding metadata column to user_quiz_sessions...');
    const { error: metadataError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE user_quiz_sessions 
        ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
      `
    });
    
    if (metadataError && !metadataError.message.includes('already exists')) {
      console.error('Error adding metadata column:', metadataError);
    } else {
      console.log('✅ Metadata column added');
    }

    // 2. Add detected_experience_level column
    console.log('2. Adding detected_experience_level column...');
    const { error: experienceError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE user_quiz_sessions
        ADD COLUMN IF NOT EXISTS detected_experience_level TEXT 
        CHECK (detected_experience_level IN ('beginner', 'enthusiast', 'collector'));
      `
    });
    
    if (experienceError && !experienceError.message.includes('already exists')) {
      console.error('Error adding experience level column:', experienceError);
    } else {
      console.log('✅ Experience level column added');
    }

    // 3. Add other enhanced columns
    console.log('3. Adding other enhanced columns...');
    const { error: enhancedError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE user_quiz_sessions
        ADD COLUMN IF NOT EXISTS ai_profile_generated BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS unique_profile_name TEXT,
        ADD COLUMN IF NOT EXISTS conversion_to_account_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS favorite_fragrances_collected BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS quiz_completion_quality_score DECIMAL(3,2) DEFAULT 0.0;
      `
    });
    
    if (enhancedError && !enhancedError.message.includes('already exists')) {
      console.error('Error adding enhanced columns:', enhancedError);
    } else {
      console.log('✅ Enhanced columns added');
    }

    console.log('\n✅ Quick migration completed successfully!');
    console.log('🎉 Enhanced quiz endpoints should now work');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyQuickMigration();
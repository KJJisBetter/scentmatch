#!/usr/bin/env node

/**
 * Migrate Clean Fragrance Data to Supabase
 * 
 * Updates database with clean fragrance names and creates missing tables
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env.local') });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Create missing database table
 */
async function createMissingTables() {
  console.log('Creating missing database tables...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS user_fragrance_personalities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID,
      personality_type TEXT,
      secondary_type TEXT,
      style_descriptor TEXT,
      confidence_score DECIMAL(3,2),
      dimension_fresh DECIMAL(3,2),
      dimension_floral DECIMAL(3,2),
      dimension_oriental DECIMAL(3,2),
      dimension_woody DECIMAL(3,2),
      dimension_fruity DECIMAL(3,2),
      dimension_gourmand DECIMAL(3,2),
      lifestyle_factors JSONB,
      preferred_intensity DECIMAL(3,2),
      occasion_preferences TEXT[],
      seasonal_preferences TEXT[],
      brand_preferences TEXT[],
      quiz_version TEXT,
      analysis_method TEXT,
      ai_enhanced BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  const { error } = await supabase.rpc('exec_sql', { query: createTableSQL });
  
  if (error) {
    console.error('Error creating table:', error);
  } else {
    console.log('✅ user_fragrance_personalities table created');
  }
}

/**
 * Clean fragrance name formatting
 */
function cleanFragranceName(name, brandName) {
  // Remove brand duplication and fix spacing issues
  return name
    .replace(new RegExp(brandName + 'for', 'gi'), '')
    .replace(/([a-z])for\s*(women|men|women and men)/gi, '$1')
    .trim();
}

/**
 * Update fragrance names in database
 */
async function updateFragranceNames() {
  try {
    console.log('Loading clean fragrance data...');
    
    // Load clean JSON data
    const cleanDataPath = path.join(__dirname, '../data/fragrances.json');
    const cleanFragrances = JSON.parse(fs.readFileSync(cleanDataPath, 'utf8'));
    
    console.log(`Processing ${cleanFragrances.length} fragrances...`);
    
    // Get current database fragrances
    const { data: currentFragrances, error: fetchError } = await supabase
      .from('fragrances')
      .select('id, name, brand_name')
      .limit(1000);
    
    if (fetchError) {
      console.error('Error fetching current fragrances:', fetchError);
      return;
    }
    
    console.log(`Found ${currentFragrances?.length || 0} fragrances in database`);
    
    // Update database with clean names
    let updatedCount = 0;
    const updates = [];
    
    for (const clean of cleanFragrances.slice(0, 50)) { // Process in batches
      const cleanName = clean.name;
      const brandName = clean.brandName;
      
      // Find matching entry in database (fuzzy match)
      const dbMatch = currentFragrances?.find(db => 
        db.brand_name === brandName && (
          db.name.includes(cleanName) || 
          cleanName.includes(db.name.replace(/for (women|men).*$/i, '').trim())
        )
      );
      
      if (dbMatch && dbMatch.name !== cleanName) {
        updates.push({
          id: dbMatch.id,
          name: cleanName,
          brand_name: brandName
        });
        updatedCount++;
      }
    }
    
    if (updates.length > 0) {
      console.log(`Updating ${updates.length} fragrance names...`);
      
      // Update in batches
      for (let i = 0; i < updates.length; i += 10) {
        const batch = updates.slice(i, i + 10);
        
        for (const update of batch) {
          const { error } = await supabase
            .from('fragrances')
            .update({ 
              name: update.name,
              brand_name: update.brand_name 
            })
            .eq('id', update.id);
          
          if (error) {
            console.error(`Error updating ${update.name}:`, error);
          } else {
            console.log(`✅ Updated: "${update.name}" by ${update.brand_name}`);
          }
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`✅ Successfully updated ${updatedCount} fragrance names in database`);
    } else {
      console.log('No fragrance names needed updating');
    }
    
  } catch (error) {
    console.error('Error updating fragrance names:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔧 Migrating clean fragrance data to database...\n');
    
    // First create missing tables
    await createMissingTables();
    
    // Then update fragrance names
    await updateFragranceNames();
    
    console.log('\n🎉 Database migration complete!');
    console.log('   Clean fragrance names now in database');
    console.log('   Missing tables created');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
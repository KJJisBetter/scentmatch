#!/usr/bin/env node

/**
 * Fix Fragrance Names - Replace malformed data with clean research data
 * 
 * Problem: Current fragrances.json has malformed names like "Cloud Ariana Grandefor women"
 * Solution: Replace with clean data from research CSV with proper formatting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const cleanCSVPath = '/home/kevinjavier/dev/scentmatch-scrapped-last/research/output/kaggle_top_brands_selection.cleaned.csv';
const currentJSONPath = path.join(__dirname, '../data/fragrances.json');
const backupJSONPath = path.join(__dirname, '../data/fragrances.backup.json');

/**
 * Convert CSV row to proper fragrance object
 */
function csvRowToFragrance(row) {
  const [brand, name, rating_value, rating_count, score, gender, main_accords, perfumers, url] = row;
  
  // Parse arrays safely
  let accords = [];
  let perfumersList = [];
  
  try {
    accords = JSON.parse(main_accords.replace(/'/g, '"'));
  } catch (e) {
    console.warn(`Failed to parse accords for ${name}:`, main_accords);
    accords = [];
  }
  
  try {
    perfumersList = JSON.parse(perfumers.replace(/'/g, '"'));
  } catch (e) {
    perfumersList = [];
  }
  
  // Create clean ID and slug
  const brandSlug = brand.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const nameSlug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const cleanId = `${brandSlug}__${nameSlug}`;
  
  return {
    id: cleanId,
    brandId: brandSlug,
    brandName: brand,
    name: name, // Clean name from CSV
    slug: nameSlug,
    ratingValue: parseFloat(rating_value) || 0,
    ratingCount: parseInt(rating_count) || 0,
    score: parseFloat(score) || 0,
    gender: gender,
    accords: accords,
    perfumers: perfumersList,
    url: url
  };
}

/**
 * Read and process CSV data
 */
function processCleanCSVData() {
  try {
    console.log('Reading clean CSV data...');
    const csvContent = fs.readFileSync(cleanCSVPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    console.log(`Processing ${dataLines.length} fragrance entries...`);
    
    const fragrances = [];
    
    for (const line of dataLines) {
      // Parse CSV with proper quote handling
      const row = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current); // Last column
      
      if (row.length >= 9) {
        try {
          const fragrance = csvRowToFragrance(row);
          fragrances.push(fragrance);
        } catch (error) {
          console.warn(`Failed to process row: ${line.substring(0, 100)}...`);
        }
      }
    }
    
    console.log(`Successfully processed ${fragrances.length} fragrances`);
    return fragrances;
    
  } catch (error) {
    console.error('Error reading CSV file:', error);
    throw error;
  }
}

/**
 * Backup current file and write new data
 */
function replaceFragranceData(newFragrances) {
  try {
    // Create backup of current file
    if (fs.existsSync(currentJSONPath)) {
      console.log('Creating backup of current fragrances.json...');
      fs.copyFileSync(currentJSONPath, backupJSONPath);
    }
    
    // Write new clean data
    console.log('Writing clean fragrance data...');
    fs.writeFileSync(currentJSONPath, JSON.stringify(newFragrances, null, 2));
    
    console.log('✅ Successfully replaced fragrances.json with clean data');
    console.log(`   Backup saved as: ${backupJSONPath}`);
    
    // Show sample of cleaned names
    console.log('\nSample of cleaned fragrance names:');
    newFragrances.slice(0, 5).forEach(f => {
      console.log(`  "${f.name}" by ${f.brandName} (was malformed)`);
    });
    
    return true;
    
  } catch (error) {
    console.error('Error replacing fragrance data:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔧 Fixing fragrance name formatting issues...\n');
    
    // Process clean data
    const cleanFragrances = processCleanCSVData();
    
    if (cleanFragrances.length === 0) {
      throw new Error('No fragrance data processed from CSV');
    }
    
    // Replace broken data with clean data
    replaceFragranceData(cleanFragrances);
    
    console.log('\n🎉 Database name quality fix complete!');
    console.log('   Fragrances now display professionally: "Cloud by Ariana Grande"');
    console.log('   Luxury brands properly formatted: "Coco Mademoiselle by Chanel"');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    // Restore backup if available
    if (fs.existsSync(backupJSONPath)) {
      console.log('Restoring backup...');
      fs.copyFileSync(backupJSONPath, currentJSONPath);
    }
    
    process.exit(1);
  }
}

// Run the fix
main();
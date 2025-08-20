/**
 * Debug Fragrance Data Mapping
 * See what happens when we clean the fragrance data
 */

import { WorkingRecommendationEngine } from '@/lib/quiz/working-recommendation-engine';
import fragranceData from '@/data/fragrances.json';

async function debugDataMapping() {
  console.log('🔍 DEBUGGING FRAGRANCE DATA MAPPING\n');
  
  // Get first few fragrances for debugging
  const sampleFragrances = fragranceData.slice(0, 5);
  
  console.log('Raw fragrance data (first 5):');
  sampleFragrances.forEach((frag, i) => {
    console.log(`${i+1}. ${frag.name}`);
    console.log(`   Raw gender: "${frag.gender}"`);
    console.log(`   Raw accords: [${frag.accords?.join(', ') || 'none'}]`);
    console.log(`   Raw brandName: "${frag.brandName}"`);
    console.log(`   Raw score: ${frag.score}`);
    console.log('');
  });

  // Test the normalizeGender function specifically
  const engine = new (WorkingRecommendationEngine as any)();
  
  console.log('Testing gender normalization:');
  const testGenders = ['for men', 'for women', 'for women and men', 'men', 'women', 'unisex'];
  testGenders.forEach(gender => {
    const normalized = engine.normalizeGender(gender);
    console.log(`   "${gender}" → "${normalized}"`);
  });

  console.log('\nTesting with actual fragrance data:');
  sampleFragrances.forEach((frag, i) => {
    const normalized = engine.normalizeGender(frag.gender);
    console.log(`   ${frag.name}: "${frag.gender}" → "${normalized}"`);
  });

  // Test the cleanFragranceData function
  console.log('\n🧹 Testing cleanFragranceData function:');
  const cleanedData = engine.cleanFragranceData(sampleFragrances);
  
  cleanedData.forEach((cleaned, i) => {
    console.log(`${i+1}. ${cleaned.name}`);
    console.log(`   gender_target: "${cleaned.gender_target}"`);
    console.log(`   scent_family: "${cleaned.scent_family}"`);
    console.log(`   accords: [${cleaned.accords?.join(', ') || 'none'}]`);
    console.log(`   sample_available: ${cleaned.sample_available}`);
    console.log('');
  });

  return true;
}

debugDataMapping();
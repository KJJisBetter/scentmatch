/**
 * Debug Preference Scoring
 * See why fresh preferences return warm fragrances
 */

import { WorkingRecommendationEngine } from '@/lib/quiz/working-recommendation-engine';
import fragranceData from '@/data/fragrances.json';

async function debugPreferenceScoring() {
  console.log('🔍 DEBUGGING PREFERENCE SCORING LOGIC\n');
  
  const engine = new (WorkingRecommendationEngine as any)();
  
  // Test the preference mapping
  console.log('Testing preference-to-accord mapping:');
  const testPreferences = ['fresh_clean', 'warm_cozy', 'sweet_fruity'];
  testPreferences.forEach(pref => {
    const accords = engine.mapPreferenceToAccords(pref);
    console.log(`   "${pref}" → [${accords.join(', ')}]`);
  });

  console.log('\n🔍 Analyzing men\'s fragrances with fresh accords:');
  
  // Find actual men's fragrances with fresh accords
  const menFragrances = fragranceData.filter(f => f.gender === 'for men');
  const freshMenFragrances = menFragrances.filter(f => 
    f.accords?.some(accord => 
      ['fresh', 'citrus', 'aquatic', 'marine', 'clean', 'aromatic', 'green'].includes(accord.toLowerCase())
    )
  );

  console.log(`Found ${freshMenFragrances.length} men's fragrances with fresh accords:`);
  freshMenFragrances.slice(0, 10).forEach(f => {
    console.log(`   ${f.name}: [${f.accords?.join(', ')}] (score: ${f.score})`);
  });

  console.log('\n🔍 Analyzing warm men\'s fragrances:');
  const warmMenFragrances = menFragrances.filter(f => 
    f.accords?.some(accord => 
      ['woody', 'amber', 'spicy', 'warm spicy', 'oriental', 'vanilla'].includes(accord.toLowerCase())
    )
  );

  console.log(`Found ${warmMenFragrances.length} men's fragrances with warm accords:`);
  warmMenFragrances.slice(0, 10).forEach(f => {
    console.log(`   ${f.name}: [${f.accords?.join(', ')}] (score: ${f.score})`);
  });

  // Test the actual scoring logic
  console.log('\n🧮 TESTING SCORING ALGORITHM:');
  
  const freshPreferences = {
    gender_preference: 'men',
    experience_level: 'beginner',
    scent_families: ['fresh_clean'],
    personality_style: 'classic_timeless'
  };

  console.log('Fresh preferences object:', freshPreferences);
  console.log('Mapped accords:', engine.mapPreferenceToAccords('fresh_clean'));

  // Test a few fragrances manually
  const testFragrances = [
    menFragrances.find(f => f.name.includes('Chrome')), // Should be fresh
    menFragrances.find(f => f.name.includes('The Most Wanted')), // Should be warm
  ].filter(Boolean);

  console.log('\nManual scoring test:');
  testFragrances.forEach(frag => {
    const cleaned = engine.cleanFragranceData([frag])[0];
    console.log(`\nTesting: ${cleaned.name}`);
    console.log(`   Gender target: ${cleaned.gender_target}`);
    console.log(`   Accords: [${cleaned.accords?.join(', ')}]`);
    console.log(`   Scent family: ${cleaned.scent_family}`);
    
    // Manually run the scoring logic
    let score = 50; // Base score
    
    // Gender matching
    if (freshPreferences.gender_preference === 'men' && cleaned.gender_target === 'men') {
      score += 15;
      console.log(`   +15 for gender match (${score})`);
    }
    
    // Scent preference matching
    const accordMatches = engine.mapPreferenceToAccords('fresh_clean');
    const hasMatchingAccord = cleaned.accords?.some((accord: string) =>
      accordMatches.some(match => 
        accord.toLowerCase().includes(match.toLowerCase()) ||
        match.toLowerCase().includes(accord.toLowerCase())
      )
    );
    
    if (hasMatchingAccord) {
      score += 25;
      console.log(`   +25 for scent preference match (${score})`);
    } else {
      console.log(`   +0 for scent preference (no match found) (${score})`);
    }
    
    console.log(`   Final score: ${score}`);
  });

  return true;
}

debugPreferenceScoring();
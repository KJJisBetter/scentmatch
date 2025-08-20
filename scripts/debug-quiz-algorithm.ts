/**
 * Debug Quiz Algorithm
 * Investigate why quiz always returns same fragrances
 */

import { WorkingRecommendationEngine } from '@/lib/quiz/working-recommendation-engine';
import fragranceData from '@/data/fragrances.json';

async function debugQuizAlgorithm() {
  console.log('🔍 DEBUGGING QUIZ ALGORITHM ISSUE\n');
  
  const engine = new WorkingRecommendationEngine();
  
  // Test different scent preferences
  const testCases = [
    {
      name: 'Fresh & Clean',
      responses: [
        { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
        { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
        { question_id: 'scent_preferences_beginner', answer_value: 'fresh_clean', timestamp: new Date().toISOString() }
      ]
    },
    {
      name: 'Warm & Cozy',
      responses: [
        { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
        { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
        { question_id: 'scent_preferences_beginner', answer_value: 'warm_cozy', timestamp: new Date().toISOString() }
      ]
    },
    {
      name: 'Sweet & Fruity',
      responses: [
        { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
        { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
        { question_id: 'scent_preferences_beginner', answer_value: 'sweet_fruity', timestamp: new Date().toISOString() }
      ]
    }
  ];

  console.log('Testing different scent preferences:\n');

  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    console.log(`   Input: scent_preferences_beginner = "${testCase.responses[2].answer_value}"`);
    
    const result = await engine.generateRecommendations(testCase.responses, `test-${testCase.name.replace(/\s+/g, '-')}`);
    
    console.log('   Results:');
    result.recommendations.forEach((rec, i) => {
      console.log(`      ${i+1}. ${rec.name} (${rec.scent_family}) [${rec.gender_target}]`);
      console.log(`         Accords: ${rec.accords?.join(', ') || 'none'}`);
    });
    console.log('');
  }

  // Now let's examine the fragrance data to understand accord mapping
  console.log('📊 ANALYZING FRAGRANCE ACCORD PATTERNS:\n');
  
  const menFragrances = fragranceData
    .filter(f => f.gender === 'men' || f.gender === 'unisex')
    .slice(0, 10);

  console.log('Sample of men\'s/unisex fragrances and their accords:');
  menFragrances.forEach((frag, i) => {
    console.log(`${i+1}. ${frag.name} (${frag.gender})`);
    console.log(`   Accords: ${frag.accords?.join(', ') || 'none'}`);
    console.log(`   Score: ${frag.score}`);
  });

  // Check what accords exist for fresh fragrances
  console.log('\n🌿 FRESH/CLEAN FRAGRANCE ANALYSIS:');
  const freshFragrances = fragranceData.filter(f => 
    f.accords?.some(accord => 
      ['fresh', 'citrus', 'aquatic', 'marine', 'clean'].includes(accord.toLowerCase())
    )
  );

  console.log(`Found ${freshFragrances.length} fragrances with fresh/clean accords:`);
  freshFragrances.slice(0, 5).forEach(frag => {
    console.log(`   ${frag.name}: ${frag.accords?.join(', ')}`);
  });

  // Check what accords exist for warm fragrances
  console.log('\n🔥 WARM/COZY FRAGRANCE ANALYSIS:');
  const warmFragrances = fragranceData.filter(f => 
    f.accords?.some(accord => 
      ['woody', 'amber', 'spicy', 'warm', 'vanilla', 'oriental'].includes(accord.toLowerCase())
    )
  );

  console.log(`Found ${warmFragrances.length} fragrances with warm/cozy accords:`);
  warmFragrances.slice(0, 5).forEach(frag => {
    console.log(`   ${frag.name}: ${frag.accords?.join(', ')}`);
  });

  // Check unique accords in the dataset
  console.log('\n📋 UNIQUE ACCORDS IN DATASET:');
  const allAccords = new Set();
  fragranceData.forEach(f => {
    f.accords?.forEach(accord => allAccords.add(accord));
  });

  const sortedAccords = Array.from(allAccords).sort();
  console.log(`Total unique accords: ${sortedAccords.length}`);
  console.log('Sample accords:', sortedAccords.slice(0, 20).join(', '));

  return true;
}

debugQuizAlgorithm();
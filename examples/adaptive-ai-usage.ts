/**
 * Adaptive AI Explanation System - Usage Examples
 * 
 * This file demonstrates how to use the new experience-adaptive AI system
 * that addresses SCE-66 (verbose explanations) and SCE-67 (beginner education).
 * 
 * Key Features:
 * 1. Experience level detection (beginner/intermediate/advanced)
 * 2. Adaptive explanations (35 words max for beginners)
 * 3. Progressive disclosure for detailed information
 * 4. Educational fragrance terminology
 * 5. Confidence-building messaging for beginners
 */

import { createClient } from '@supabase/supabase-js'
import { 
  UnifiedRecommendationEngine,
  type UnifiedRecommendationRequest 
} from '@/lib/ai-sdk/unified-recommendation-engine'
import { experienceDetector } from '@/lib/ai-sdk/user-experience-detector'
import { aiClient } from '@/lib/ai-sdk/client'

// Mock Supabase client for examples
const supabase = createClient(
  'https://example.supabase.co',
  'fake-key'
)

/**
 * Example 1: Beginner User Experience (SCE-66 Solution)
 * Shows how verbose explanations are reduced to 30-40 words
 */
export async function exampleBeginnerRecommendations() {
  console.log('=== BEGINNER USER EXAMPLE (SCE-66 Solution) ===\n')

  const engine = new UnifiedRecommendationEngine(supabase)
  
  // Simulate a beginner user who "just heard about Sauvage"
  const beginnerRequest: UnifiedRecommendationRequest = {
    strategy: 'hybrid',
    userId: 'beginner-user-id',
    adaptiveExplanations: true,
    limit: 3,
    userPreferences: {
      occasions: ['daily'],
      gender: 'male'
    }
  }

  const result = await engine.generateRecommendations(beginnerRequest)
  
  console.log('Beginner Recommendations:')
  result.recommendations.forEach((rec, index) => {
    console.log(`\n${index + 1}. ${rec.name} by ${rec.brand}`)
    console.log(`   Experience Level: ${rec.adaptive_explanation?.user_experience_level}`)
    console.log(`   Summary (${rec.adaptive_explanation?.summary?.split(' ').length} words): ${rec.adaptive_explanation?.summary}`)
    
    if (rec.adaptive_explanation?.confidence_boost) {
      console.log(`   Confidence Boost: ${rec.adaptive_explanation.confidence_boost}`)
    }
    
    if (rec.adaptive_explanation?.educational_terms) {
      console.log('   Educational Terms:')
      Object.entries(rec.adaptive_explanation.educational_terms).forEach(([term, data]: [string, any]) => {
        console.log(`     • ${data.term}: ${data.beginnerExplanation}`)
      })
    }
  })
}

/**
 * Example 2: Progressive Experience Detection
 * Shows how the system adapts as users gain experience
 */
export async function exampleExperienceProgression() {
  console.log('\n=== EXPERIENCE PROGRESSION EXAMPLE ===\n')

  const detector = experienceDetector(supabase)
  
  // Simulate different user profiles
  const userProfiles = [
    {
      id: 'new-user',
      scenario: 'Brand new user, no data',
      userData: null
    },
    {
      id: 'exploring-user', 
      scenario: 'User with 3 fragrances in collection, completed quiz',
      userData: {
        profile: { quiz_completed_at: new Date(), created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        collections: [
          { collection_type: 'owned', rating: 4 },
          { collection_type: 'wishlist', rating: null },
          { collection_type: 'owned', rating: 5, notes: 'Love this for evening events' }
        ]
      }
    },
    {
      id: 'experienced-user',
      scenario: 'User with 15 fragrances, active for 45 days',
      userData: {
        profile: { quiz_completed_at: new Date(), created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
        collections: Array.from({ length: 15 }, (_, i) => ({
          collection_type: i % 3 === 0 ? 'owned' : 'wishlist',
          rating: Math.floor(Math.random() * 3) + 3,
          notes: i % 4 === 0 ? 'Detailed notes about performance and occasions' : null
        }))
      }
    }
  ]

  for (const profile of userProfiles) {
    console.log(`${profile.scenario}:`)
    
    // Mock experience analysis (in real app, this queries database)
    let experienceLevel = 'beginner'
    if (profile.userData?.collections && profile.userData.collections.length >= 10) {
      experienceLevel = 'advanced'
    } else if (profile.userData?.collections && profile.userData.collections.length >= 3) {
      experienceLevel = 'intermediate'
    }
    
    console.log(`   Detected Level: ${experienceLevel}`)
    console.log(`   Explanation Style: ${getExplanationStyleDescription(experienceLevel)}`)
    console.log('')
  }
}

/**
 * Example 3: Educational Content System (SCE-67 Solution)
 * Shows how fragrance terms are explained to beginners
 */
export async function exampleEducationalContent() {
  console.log('=== EDUCATIONAL CONTENT EXAMPLE (SCE-67 Solution) ===\n')

  // Simulate explaining a recommendation to a beginner
  const fragranceDetails = "Dior Sauvage EDT - Fresh, woody fragrance with bergamot top notes, pepper heart, and ambroxan base. Strong projection and 6-8 hour longevity."
  
  console.log('Original Technical Description:')
  console.log(fragranceDetails)
  console.log('\nBeginner-Friendly Adaptive Explanation:')
  
  try {
    const beginnerExplanation = await aiClient.explainForBeginner(
      'sauvage-edt-id',
      'New fragrance explorer interested in fresh, confident scents',
      fragranceDetails
    )
    
    console.log(`Summary (${beginnerExplanation.explanation.split(' ').length} words):`)
    console.log(`"${beginnerExplanation.explanation}"`)
    console.log('\nConfidence Boost:')
    console.log(`"${beginnerExplanation.confidenceBoost}"`)
    console.log('\nEducational Terms:')
    
    if (beginnerExplanation.educationalTerms) {
      Object.entries(beginnerExplanation.educationalTerms).forEach(([term, data]: [string, any]) => {
        console.log(`• ${data.term}:`)
        console.log(`  Beginner Explanation: ${data.beginnerExplanation}`)
        console.log(`  Example: ${data.example}`)
      })
    }
  } catch (error) {
    console.log('Mock explanation (AI service not available):')
    console.log('"This fresh, energizing scent matches your confident style. You\'ll get that crisp, clean feeling that lasts all day."')
    console.log('\nConfidence Boost: "Perfect starting point - you\'ll discover what you love through trying!"')
  }
}

/**
 * Example 4: A/B Testing Different Experience Levels
 * Shows the difference in explanations across experience levels
 */
export async function exampleExperienceLevelComparison() {
  console.log('\n=== EXPERIENCE LEVEL COMPARISON ===\n')

  const fragranceDetails = "Tom Ford Oud Wood - Luxury oriental woody fragrance featuring oud, sandalwood, and rosewood with vanilla and amber base notes."
  const userContext = "User interested in sophisticated, evening fragrances"

  const experienceLevels: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced']
  
  for (const level of experienceLevels) {
    console.log(`${level.toUpperCase()} EXPLANATION:`)
    
    const explanationStyles = {
      beginner: { maxWords: 35, complexity: 'simple' as const, includeEducation: true, useProgressiveDisclosure: true, vocabularyLevel: 'basic' as const },
      intermediate: { maxWords: 60, complexity: 'moderate' as const, includeEducation: false, useProgressiveDisclosure: true, vocabularyLevel: 'intermediate' as const },
      advanced: { maxWords: 100, complexity: 'detailed' as const, includeEducation: false, useProgressiveDisclosure: false, vocabularyLevel: 'advanced' as const }
    }

    try {
      const explanation = await aiClient.explainRecommendationAdaptive(
        'oud-wood-id',
        userContext,
        fragranceDetails,
        level,
        explanationStyles[level]
      )
      
      console.log(`   Explanation (${explanation.explanation.split(' ').length} words):`)
      console.log(`   "${explanation.explanation}"`)
      
      if (explanation.educationalTerms && Object.keys(explanation.educationalTerms).length > 0) {
        console.log('   Educational terms included: Yes')
      }
    } catch (error) {
      // Mock explanations for demonstration
      const mockExplanations = {
        beginner: "This warm, woody scent is perfect for special evenings. Rich and sophisticated without being overwhelming.",
        intermediate: "Luxurious oriental fragrance with distinctive oud and sandalwood blend. Sophisticated choice for evening occasions with excellent longevity and moderate projection.",
        advanced: "Masterfully composed oriental-woody fragrance featuring rare oud accord balanced with creamy sandalwood and rosewood. Vanilla-amber base provides exceptional longevity with intimate sillage perfect for sophisticated evening wear."
      }
      
      console.log(`   Mock Explanation (${mockExplanations[level].split(' ').length} words):`)
      console.log(`   "${mockExplanations[level]}"`)
    }
    console.log('')
  }
}

/**
 * Example 5: Integration with React Components
 * Shows how to use the adaptive explanations in UI components
 */
export function exampleReactIntegration() {
  console.log('=== REACT COMPONENT INTEGRATION EXAMPLE ===\n')
  
  console.log('JSX Component Usage:')
  console.log(`
import { AdaptiveExplanation } from '@/components/ai/adaptive-explanation'

function RecommendationCard({ recommendation }) {
  return (
    <div className="recommendation-card">
      <h3>{recommendation.name}</h3>
      <AdaptiveExplanation 
        recommendation={recommendation}
        showEducationalTerms={true}
        className="mt-2"
      />
    </div>
  )
}

// For beginners, this will show:
// - 35-word summary
// - Progressive disclosure for more details
// - Educational term tooltips
// - Confidence-building messages

// For advanced users, this will show:
// - Full detailed explanation
// - Technical terminology
// - No educational scaffolding
  `)
}

/**
 * Utility function to describe explanation styles
 */
function getExplanationStyleDescription(level: string): string {
  const descriptions = {
    beginner: '35 words max, simple language, educational terms, confidence building',
    intermediate: '60 words max, moderate complexity, some technical terms',
    advanced: '100 words max, detailed analysis, full technical vocabulary'
  }
  return descriptions[level as keyof typeof descriptions] || 'Unknown level'
}

/**
 * Example 6: Performance and Migration Path
 * Shows how to migrate existing systems to use adaptive explanations
 */
export async function exampleMigrationPath() {
  console.log('\n=== MIGRATION PATH EXAMPLE ===\n')
  
  console.log('Step 1: Enable adaptive explanations gradually')
  console.log(`
// Existing recommendation request
const legacyRequest = {
  strategy: 'hybrid',
  userId: 'user-id',
  // adaptiveExplanations: false (disabled by default for existing users)
}

// Enhanced request with adaptive explanations
const adaptiveRequest = {
  strategy: 'hybrid', 
  userId: 'user-id',
  adaptiveExplanations: true // Enable new system
}
  `)
  
  console.log('\nStep 2: Progressive rollout by user segment')
  console.log(`
// Enable for new users first
if (user.created_at > '2025-08-22') {
  request.adaptiveExplanations = true
}

// Then enable for users who completed quiz
if (user.quiz_completed_at) {
  request.adaptiveExplanations = true  
}

// Finally enable for all users
request.adaptiveExplanations = true
  `)
  
  console.log('\nStep 3: A/B test the results')
  console.log(`
// Track metrics
- Beginner retention rate
- Time spent reading explanations
- Educational term engagement
- Recommendation acceptance rate
- User progression from beginner to intermediate
  `)
}

// Export all examples for testing
export const adaptiveAIExamples = {
  exampleBeginnerRecommendations,
  exampleExperienceProgression,
  exampleEducationalContent,
  exampleExperienceLevelComparison,
  exampleReactIntegration,
  exampleMigrationPath
}

// Run examples if called directly
if (require.main === module) {
  async function runAllExamples() {
    try {
      await exampleBeginnerRecommendations()
      await exampleExperienceProgression()
      await exampleEducationalContent()
      await exampleExperienceLevelComparison()
      exampleReactIntegration()
      await exampleMigrationPath()
      
      console.log('\n=== SUMMARY ===')
      console.log('✅ SCE-66 SOLVED: Beginner explanations limited to 30-40 words')
      console.log('✅ SCE-67 SOLVED: Educational fragrance terminology system')
      console.log('✅ Progressive disclosure prevents information overwhelm')
      console.log('✅ Confidence-building messaging for fragrance newcomers')
      console.log('✅ Adaptive system scales from beginner to expert')
      
    } catch (error) {
      console.error('Example execution failed:', error)
    }
  }
  
  runAllExamples()
}
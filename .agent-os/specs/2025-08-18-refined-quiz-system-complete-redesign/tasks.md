# Spec Tasks

## Tasks

- [ ] 1. Fragrance Data Cleanup and Migration
  - [ ] 1.1 Write tests for fragrance data cleanup migration
  - [ ] 1.2 Create backup of existing fragrance data
  - [ ] 1.3 Implement migration script to remove gender suffixes from names
  - [ ] 1.4 Add new database fields for intensity, longevity, and spray guidance
  - [ ] 1.5 Populate new fields with appropriate default values
  - [ ] 1.6 Validate data cleanup and verify no duplicates created
  - [ ] 1.7 Update API responses to use cleaned data format
  - [ ] 1.8 Verify all tests pass for data migration

- [ ] 2. Complete Quiz Question Structure Redesign
  - [ ] 2.1 Write tests for new experience-based question scaling
  - [ ] 2.2 Implement beginner question set (4 scent options + open)
  - [ ] 2.3 Implement enthusiast question set (7 scent options + open)
  - [ ] 2.4 Implement experienced question set (10 scent options + open)
  - [ ] 2.5 Update personality style question (same for all levels)
  - [ ] 2.6 Implement experience-based occasion questions with versatile options
  - [ ] 2.7 Add conditional season/vibe question for enthusiast+ levels
  - [ ] 2.8 Implement favorites selection for enthusiast+ levels
  - [ ] 2.9 Update gender selection and fix "uninex" typo
  - [ ] 2.10 Verify all tests pass for quiz structure changes

- [ ] 3. AI Recommendation System Enhancement
  - [ ] 3.1 Write tests for new AI recommendation prompt system
  - [ ] 3.2 Implement comprehensive AI system prompt with experience adaptation
  - [ ] 3.3 Add scent matching logic for all new question options
  - [ ] 3.4 Implement personality style and occasion matching algorithms
  - [ ] 3.5 Add strength classification and spray guidance logic
  - [ ] 3.6 Create match percentage calculation system
  - [ ] 3.7 Update API to generate exactly 3 recommendations with insights
  - [ ] 3.8 Remove personality profile generation completely
  - [ ] 3.9 Verify all tests pass for AI recommendation system

- [ ] 4. Component Architecture Updates and UI Changes
  - [ ] 4.1 Write tests for updated ExperienceLevelAdaptiveQuiz component
  - [ ] 4.2 Update quiz component with new question sets and natural language
  - [ ] 4.3 Implement conditional question flow based on experience level
  - [ ] 4.4 Create new AI insight display component for 3 recommendations
  - [ ] 4.5 Update ConversionFlow component to handle new result format
  - [ ] 4.6 Remove personality profile display components
  - [ ] 4.7 Update all quiz text with conversational, natural language
  - [ ] 4.8 Implement dynamic option descriptions with fragrance notes
  - [ ] 4.9 Verify all tests pass for component updates

- [ ] 5. API Integration and Data Flow Updates
  - [ ] 5.1 Write tests for updated quiz analysis API endpoints
  - [ ] 5.2 Update /api/quiz/analyze-enhanced to use new question structure
  - [ ] 5.3 Implement new AI prompt processing system
  - [ ] 5.4 Update recommendation selection algorithm for 3-fragrance output
  - [ ] 5.5 Add intensity and spray guidance to recommendation responses
  - [ ] 5.6 Remove personality analysis from API responses
  - [ ] 5.7 Update fragrance search API to use cleaned data
  - [ ] 5.8 Verify all tests pass for API integration changes

- [ ] 6. Comprehensive Integration Testing and Validation
  - [ ] 6.1 Write end-to-end tests for complete quiz flow at all experience levels
  - [ ] 6.2 Test data migration success with browser validation
  - [ ] 6.3 Validate natural language usage throughout quiz experience
  - [ ] 6.4 Test AI recommendation quality with real quiz responses
  - [ ] 6.5 Perform browser testing using Playwright MCP for all user flows
  - [ ] 6.6 Test fragrance name display consistency across application
  - [ ] 6.7 Validate spray guidance and intensity information accuracy
  - [ ] 6.8 Verify all tests pass and complete system works end-to-end

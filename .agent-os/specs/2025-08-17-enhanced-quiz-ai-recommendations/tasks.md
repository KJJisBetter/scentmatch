# Spec Tasks

## Tasks

- [ ] 1. Fix Authentication Flow and 401 Errors
  - [ ] 1.1 Write tests for auth flow debugging
  - [ ] 1.2 Investigate 401 error root causes in browser DevTools
  - [ ] 1.3 Fix server/client component auth boundary issues
  - [ ] 1.4 Implement proper session waiting after signup
  - [ ] 1.5 Update ensureUserProfile function for correct schema
  - [ ] 1.6 Test complete signup → profile creation → redirect flow
  - [ ] 1.7 Verify all auth tests pass

- [ ] 2. Implement Experience-Level Adaptive Quiz System
  - [ ] 2.1 Write tests for experience level detection and branching
  - [ ] 2.2 Create experience level detection question component
  - [ ] 2.3 Implement adaptive UI modes (beginner/standard/advanced)
  - [ ] 2.4 Build dynamic question branching logic in QuizEngine
  - [ ] 2.5 Create experience-appropriate vocabulary and complexity scaling
  - [ ] 2.6 Implement favorite fragrance input for advanced users
  - [ ] 2.7 Verify adaptive quiz flow works for all experience levels

- [ ] 3. Build AI Profile Generation System
  - [ ] 3.1 Write tests for AI profile generation and caching
  - [ ] 3.2 Implement unique profile name generation algorithm
  - [ ] 3.3 Create multi-paragraph AI description generation
  - [ ] 3.4 Build 3-tier caching system (cache/template/AI)
  - [ ] 3.5 Integrate OpenAI GPT-4o-mini for dynamic content
  - [ ] 3.6 Implement profile uniqueness validation
  - [ ] 3.7 Verify AI profiles feel unique and personalized

- [ ] 4. Enhance Database Schema for New Features
  - [ ] 4.1 Write tests for new database schema and functions
  - [ ] 4.2 Create migration scripts for user_profiles enhancements
  - [ ] 4.3 Implement user_favorite_fragrances table
  - [ ] 4.4 Create ai_profile_cache table for performance
  - [ ] 4.5 Update quiz sessions with experience tracking
  - [ ] 4.6 Create enhanced recommendation database functions
  - [ ] 4.7 Verify all database changes work with existing data

- [ ] 5. Implement Real Database Recommendations Engine
  - [ ] 5.1 Write tests for enhanced recommendation system
  - [ ] 5.2 Build hybrid scoring algorithm (vector + collaborative + behavioral)
  - [ ] 5.3 Implement AI-generated match explanations
  - [ ] 5.4 Create experience-level recommendation filtering
  - [ ] 5.5 Build favorite fragrance preference learning
  - [ ] 5.6 Optimize recommendation performance (sub-200ms target)
  - [ ] 5.7 Verify real fragrances appear with meaningful explanations

- [ ] 6. Create Enhanced API Endpoints
  - [ ] 6.1 Write tests for all new API endpoints
  - [ ] 6.2 Implement /api/quiz/start-enhanced endpoint
  - [ ] 6.3 Create /api/quiz/select-favorites endpoint
  - [ ] 6.4 Build /api/quiz/generate-profile endpoint
  - [ ] 6.5 Enhance /api/recommendations/enhanced endpoint
  - [ ] 6.6 Create /api/auth/convert-session endpoint
  - [ ] 6.7 Verify all API endpoints work with proper error handling

- [ ] 7. Build Frontend Experience-Adaptive Components
  - [ ] 7.1 Write tests for adaptive quiz components
  - [ ] 7.2 Create ExperienceLevelSelector component
  - [ ] 7.3 Build FavoriteFragranceInput with autocomplete
  - [ ] 7.4 Implement AdaptiveQuizInterface with three modes
  - [ ] 7.5 Create AIProfileDisplay component
  - [ ] 7.6 Build EnhancedRecommendations component
  - [ ] 7.7 Verify all components work responsively on mobile

- [ ] 8. Optimize Account Conversion Flow
  - [ ] 8.1 Write tests for conversion optimization
  - [ ] 8.2 Implement seamless guest-to-authenticated transition
  - [ ] 8.3 Create profile preservation during account creation
  - [ ] 8.4 Build conversion incentives and rewards system
  - [ ] 8.5 Implement loss aversion messaging
  - [ ] 8.6 Add social proof and trust signals
  - [ ] 8.7 Verify 40% conversion rate target achieved

- [ ] 9. Performance Optimization and Caching
  - [ ] 9.1 Write tests for performance requirements
  - [ ] 9.2 Implement multi-layer caching strategy
  - [ ] 9.3 Optimize database queries and indexes
  - [ ] 9.4 Add Redis caching for frequent operations
  - [ ] 9.5 Implement AI response caching
  - [ ] 9.6 Optimize bundle sizes and loading performance
  - [ ] 9.7 Verify sub-200ms recommendation generation target

- [ ] 10. Integration Testing and Quality Assurance
  - [ ] 10.1 Write comprehensive end-to-end tests
  - [ ] 10.2 Test complete user journey (quiz → profile → recommendations → account)
  - [ ] 10.3 Verify mobile responsiveness and touch interactions
  - [ ] 10.4 Test error handling and fallback scenarios
  - [ ] 10.5 Validate accessibility compliance (WCAG 2.2 AA)
  - [ ] 10.6 Performance testing under load
  - [ ] 10.7 Verify all acceptance criteria met

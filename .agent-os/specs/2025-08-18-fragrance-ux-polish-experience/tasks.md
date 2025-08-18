# Spec Tasks

## Tasks

- [ ] 1. Fix Quiz Questions - Replace Generic with Fragrance-Specific
  - [ ] 1.1 Write tests for fragrance-specific quiz questions and validation
  - [ ] 1.2 Replace personality questions in experience-level-adaptive-quiz.tsx lines 123-291
  - [ ] 1.3 Implement "Which scent families appeal to you?" with Citrus/Floral/Woody/Oriental options
  - [ ] 1.4 Add "When do you want to smell amazing?" with Work/Dates/Everyday/Special occasions
  - [ ] 1.5 Create 5 additional fragrance-specific questions with visual elements
  - [ ] 1.6 Verify fragrance quiz completes successfully and captures scent preferences

- [ ] 2. Fix Broken AI Profile Display - Make It Visible and Prominent
  - [ ] 2.1 Write tests for FragranceProfileCard component and profile visibility
  - [ ] 2.2 Create large, prominent FragranceProfileCard component with personality name display
  - [ ] 2.3 Add fragrance wheel visualization showing user's position on scent families
  - [ ] 2.4 Implement clear explanation text connecting preferences to profile assignment
  - [ ] 2.5 Modify ConversionFlow to show profile BEFORE conversion attempts
  - [ ] 2.6 Verify AI profile displays prominently after quiz completion in browser

- [ ] 3. Fix Database Name Quality - Clean Malformed Names
  - [ ] 3.1 Write tests for name cleaning functions and data validation
  - [ ] 3.2 Implement cleanFragranceName function to fix "Cloud Ariana Grandefor women" issues
  - [ ] 3.3 Create migration script to import clean CSV data from research/kaggle_top_brands_selection.cleaned.csv
  - [ ] 3.4 Update fragrance display to show "Cloud by Ariana Grande" format
  - [ ] 3.5 Add proper luxury brand formatting for Chanel, Dior, etc.
  - [ ] 3.6 Verify all fragrance names display professionally without formatting errors

- [ ] 4. Fix Affiliate Messaging - Clear Discovery Guide Focus
  - [ ] 4.1 Write tests for affiliate messaging and button functionality
  - [ ] 4.2 Replace "Shop Fragrances" with "Discover Your Perfect Fragrance" in headers
  - [ ] 4.3 Update recommendation cards with "Try Sample at Sephora" primary buttons
  - [ ] 4.4 Add "ScentMatch earns commission from retail partners" disclosure
  - [ ] 4.5 Implement sample-first messaging throughout recommendation flow
  - [ ] 4.6 Verify affiliate links work and messaging clearly positions ScentMatch as guide

- [ ] 5. Mobile Touch Optimization - Ensure Functionality on Mobile
  - [ ] 5.1 Write tests for mobile touch interactions and responsive behavior
  - [ ] 5.2 Fix quiz option buttons to minimum 44px height with proper touch zones
  - [ ] 5.3 Make profile card stack vertically on mobile, horizontal on desktop
  - [ ] 5.4 Optimize recommendation cards for mobile single-column layout
  - [ ] 5.5 Test fragrance wheel touch interactions on actual mobile devices
  - [ ] 5.6 Verify complete user journey works on mobile without UI breaks

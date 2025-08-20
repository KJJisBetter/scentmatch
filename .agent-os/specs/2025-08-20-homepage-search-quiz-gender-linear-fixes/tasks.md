# Spec Tasks

## Tasks

- [ ] 1. Fix Homepage Navigation 404 Error (SCE-46) - 🚨 CRITICAL LAUNCH BLOCKER
  - [ ] 1.1 Write tests for homepage navigation functionality
  - [ ] 1.2 Investigate Next.js routing configuration for homepage (`/`) access
  - [ ] 1.3 Debug navigation from fragrance detail pages to homepage using Link components
  - [ ] 1.4 Check for dynamic route conflicts affecting root route (`/fragrance/[id]` vs `/`)
  - [ ] 1.5 Test homepage access from all major platform pages (browse, quiz, fragrance details)
  - [ ] 1.6 Use Playwright MCP to verify homepage loads correctly without 404 errors
  - [ ] 1.7 Update Linear issue SCE-46 status once resolved and verified

- [ ] 2. Restore Search Functionality (SCE-47) - 🚨 CRITICAL LAUNCH BLOCKER
  - [ ] 2.1 Write tests for search API functionality and error handling
  - [ ] 2.2 Debug `/api/search` endpoint configuration and verify route exists
  - [ ] 2.3 Investigate "TypeError: Failed to fetch" error in FragranceBrowseClient component
  - [ ] 2.4 Check fetch request format, URL construction, and headers in search handlers
  - [ ] 2.5 Verify Supabase database connection and query execution in search API
  - [ ] 2.6 Test search functionality in browser using Playwright MCP (e.g., "Chanel No 5" search)
  - [ ] 2.7 Ensure search results return properly formatted fragrance data
  - [ ] 2.8 Update Linear issue SCE-47 status once search is fully functional

- [ ] 3. Fix Quiz "Learn More" Navigation (SCE-42/43) - 🚨 CRITICAL LAUNCH BLOCKER
  - [ ] 3.1 Write tests for quiz to fragrance detail page navigation
  - [ ] 3.2 Debug fragrance ID format from quiz recommendations (e.g., "valentino__valentina-pink")
  - [ ] 3.3 Verify `/app/fragrance/[id]/page.tsx` can handle quiz-generated fragrance IDs
  - [ ] 3.4 Test database queries with fragrance IDs from quiz API responses
  - [ ] 3.5 Fix link generation in quiz recommendation components ("Learn More" buttons)
  - [ ] 3.6 Add proper error handling for fragrance not found cases
  - [ ] 3.7 Use Playwright MCP to test complete quiz → "Learn More" → detail page journey
  - [ ] 3.8 Update Linear issues SCE-42 and SCE-43 status once navigation is working

- [ ] 4. Fix Gender Representation Balance (SCE-44/48) - 🔥 LAUNCH CRITICAL
  - [ ] 4.1 Write tests for gender balance in browse results and recommendations
  - [ ] 4.2 Query Supabase to audit fragrance gender distribution (current: 80% men, 0% women)
  - [ ] 4.3 Identify root cause of gender imbalance in browse page algorithm
  - [ ] 4.4 Update browse page algorithm to include women's and unisex fragrances prominently
  - [ ] 4.5 Verify fragrance gender classifications are accurate in database
  - [ ] 4.6 Test browse page shows balanced gender representation using Playwright MCP
  - [ ] 4.7 Test women's quiz results show relevant women's/unisex fragrance options
  - [ ] 4.8 Verify platform no longer appears male-focused to female users
  - [ ] 4.9 Update Linear issues SCE-44 and SCE-48 status once gender balance is achieved

- [ ] 5. Database Gender Classification Audit and Fixes
  - [ ] 5.1 Create script to query and analyze fragrances by gender category
  - [ ] 5.2 Identify fragrances with incorrect, missing, or null gender classifications
  - [ ] 5.3 Research and correct gender classifications for popular fragrances
  - [ ] 5.4 Create Supabase migration script to fix gender classifications if needed
  - [ ] 5.5 Verify popular women's fragrances are properly included in browse results
  - [ ] 5.6 Update browse and recommendation algorithms to ensure gender inclusivity
  - [ ] 5.7 Test that algorithm changes show appropriate gender balance

- [ ] 6. Comprehensive Launch Verification Testing - 🚀 FINAL VERIFICATION
  - [ ] 6.1 Run complete end-to-end browser testing using Playwright MCP
  - [ ] 6.2 Test complete user journey: homepage → quiz → "Learn More" → detail pages → homepage
  - [ ] 6.3 Test search functionality works for known fragrances ("Chanel No 5", "Dior Sauvage")
  - [ ] 6.4 Verify gender balance is visible throughout platform experience (browse, quiz, recommendations)
  - [ ] 6.5 Test navigation works seamlessly between all major pages without 404 errors
  - [ ] 6.6 Confirm no critical 404 errors in primary user flows
  - [ ] 6.7 Verify all Linear issues (SCE-46, SCE-47, SCE-42/43, SCE-44/48) are marked resolved
  - [ ] 6.8 Final August 21st launch readiness verification - ALL critical functionality working correctly
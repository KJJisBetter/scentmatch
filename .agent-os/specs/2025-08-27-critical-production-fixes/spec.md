# Critical Production Fixes Specification

## Overview

Fix four production-blocking issues preventing ScentMatch launch: broken AI recommendation engine, quiz input control problems, disabled authentication security, and unprofessional auth form UX. These fixes will restore core functionality and enable successful user journeys from quiz completion to fragrance recommendations.

## User Stories

### Story 1: Functional Quiz Journey

**As a** fragrance discovery user  
**I want to** complete the quiz and receive relevant fragrance recommendations  
**So that** I can discover new fragrances based on my preferences

**User Workflow:**

1. User completes quiz with preferences (spicy/woody/citrusy, bold style)
2. System processes inputs through AI recommendation engine
3. User receives 5-10 relevant fragrance recommendations with match percentages
4. User can view sample availability and product details

### Story 2: Secure and Professional Experience

**As a** potential user  
**I want to** create an account through a professional signup flow  
**So that** I can save my results and build fragrance collections

**User Workflow:**

1. User completes quiz and chooses to save results
2. User sees professional "Create your ScentMatch account" form
3. User enters email/password with clear validation
4. User gains access to protected features (collections, recommendations)

### Story 3: Reliable System Performance

**As a** user  
**I want** the quiz to prevent duplicate submissions and show loading states  
**So that** I have a smooth experience without errors or confusion

**User Workflow:**

1. User selects final quiz answer
2. System immediately disables all inputs and shows "Processing your results..."
3. Single API call processes results efficiently
4. User sees results without duplicate requests or cost overruns

## Spec Scope

1. **Fix AI Recommendation Engine (P0 - Showstopper)**
   - Investigate and resolve "Failed to generate sufficient recommendations" error
   - Ensure OpenAI API key accessibility and model configuration
   - Verify Supabase database connectivity and fragrance data
   - Return 5-10 relevant recommendations with proper match percentages

2. **Implement Quiz Input Control (P1 - Cost/Security)**
   - Disable quiz inputs immediately after final answer selection
   - Add loading state with "Processing your results..." message
   - Prevent duplicate API calls to `/api/quiz` endpoint
   - Add proper error handling for failed API requests

3. **Restore Authentication Security (P1 - Security)**
   - Re-enable authentication middleware with CSP compatibility
   - Protect routes: `/dashboard`, `/collection`, `/recommendations`
   - Implement proper session handling for Next.js 15
   - Maintain security headers without breaking functionality

4. **Polish Auth Form UX (P2 - Professional)**
   - Replace "What should we call you?" with professional copy
   - Implement clean shadcn/ui form design
   - Use "Create your ScentMatch account" messaging
   - Add proper form validation and user feedback

## Out of Scope

- New feature development or enhancements
- Social login integration (Google/GitHub)
- Advanced conversion optimization features
- Mobile-first UX enhancements from other issues
- Affiliate marketing integration
- Performance optimization beyond critical fixes

## Expected Deliverable

1. **Functional Quiz-to-Recommendations Flow**: Test user Kevin can complete quiz and receive 5+ relevant fragrance recommendations with proper match percentages

2. **Secure Authentication System**: All protected routes properly secured with working middleware, professional signup/login forms, and session handling

3. **Production-Ready Deployment**: Zero critical errors on Vercel deployment, all systems functional for launch readiness

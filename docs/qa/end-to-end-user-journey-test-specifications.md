# End-to-End User Journey Test Specifications

**Date:** 2025-08-15  
**Priority:** Critical - Platform Readiness Verification  
**Status:** Specifications Ready for Implementation  

## Executive Summary

Complete end-to-end test specifications for verifying the entire ScentMatch platform works for real users. These tests confirm the integration of authentication, database, and application features to ensure platform readiness for production use.

**Critical Success Criteria:** All user journeys must complete successfully with performance targets met and security maintained.

---

## Test Category 1: Complete User Registration Journey

**Priority:** Critical  
**Dependency:** Authentication system (Task 5.x complete)  

### E2E-REG-001: Home Page to Dashboard Complete Flow

**Objective:** Verify complete user onboarding experience from first visit to active platform use

**Test Steps:**
1. **Home Page Access**
   - Navigate to `/` (home page)
   - Verify page loads within 2.5 seconds (LCP target)
   - Check navigation menu contains "Sign Up" and "Sign In" links
   - Validate mobile responsiveness (320px to 1920px viewports)

2. **Registration Initiation**
   - Click "Sign Up" from home page
   - Navigate to `/auth/signup`
   - Verify signup form loads correctly
   - Check form accessibility (WCAG 2.2 AA compliance)

3. **Account Creation Process**
   - Enter valid email and strong password
   - Submit registration form
   - Verify email verification page displays (`/auth/verify`)
   - Check user record created in `auth.users` table
   - Confirm user profile created in `user_profiles` table with correct user_id link

4. **Email Verification Simulation**
   - Use development environment auto-confirmation
   - Or manually confirm via Supabase dashboard
   - Verify user status changes to confirmed
   - Check automatic redirect to dashboard (`/dashboard`)

5. **Dashboard First Access**
   - Confirm dashboard loads successfully
   - Verify user session is active and persistent
   - Check user profile data displays correctly
   - Validate welcome/onboarding elements present

**Expected Results:**
- ✅ Complete flow from home → signup → dashboard in <30 seconds
- ✅ User profile correctly linked to auth.users record
- ✅ Session persists across page navigation
- ✅ All performance and accessibility targets met

**Failure Conditions:**
- ❌ Any step fails or times out beyond limits
- ❌ User profile creation fails or data inconsistency
- ❌ Session not established or immediately expires
- ❌ Performance targets not met (LCP >2.5s, INP >200ms)

### E2E-REG-002: User Profile Integration Verification

**Objective:** Verify user profile creation and synchronization with authentication system

**Test Steps:**
1. **Profile Creation During Registration**
   - Complete registration process from E2E-REG-001
   - Query `user_profiles` table for new record
   - Verify profile fields populated correctly:
     - `user_id` matches `auth.users.id`
     - `email` matches registration email
     - `created_at` timestamp present
     - Default values set appropriately

2. **Profile Data Consistency**
   - Verify RLS policies allow user to access own profile
   - Confirm other users cannot access this profile
   - Test profile update functionality if available
   - Check data synchronization between auth and profile tables

**Expected Results:**
- ✅ Profile created automatically during registration
- ✅ Data consistency maintained between tables
- ✅ RLS policies enforce proper access control
- ✅ Profile updates work correctly if implemented

---

## Test Category 2: Authentication Flow Verification

**Priority:** Critical  
**Dependency:** All authentication components (Tasks 5.2-5.9)  

### E2E-AUTH-001: Complete Sign-In Flow with Session Persistence

**Objective:** Verify users can sign in and maintain authenticated sessions across platform usage

**Test Steps:**
1. **Sign-In Process**
   - Navigate to `/auth/login`
   - Enter valid credentials from E2E-REG-001
   - Submit login form
   - Verify automatic redirect to dashboard
   - Check session cookie established

2. **Session Persistence Testing**
   - Navigate to different pages within platform
   - Refresh browser page
   - Close and reopen browser tab
   - Verify session maintains across all scenarios
   - Check middleware protects routes correctly

3. **Cross-Tab Session Sync**
   - Open platform in second browser tab
   - Verify automatic authentication in new tab
   - Sign out in one tab
   - Confirm sign-out reflected in other tab
   - Test sign-in sync between tabs

**Expected Results:**
- ✅ Sign-in completes within 3 seconds
- ✅ Session persists across page refreshes
- ✅ Cross-tab synchronization works correctly
- ✅ Middleware enforces authentication correctly

### E2E-AUTH-002: Protected Route Access and Redirects

**Objective:** Verify authentication middleware correctly protects application areas

**Test Steps:**
1. **Unauthenticated Access Prevention**
   - Clear all session cookies/storage
   - Attempt direct navigation to `/dashboard`
   - Verify redirect to `/auth/login` with return URL
   - Check other protected routes behave similarly

2. **Post-Authentication Redirect**
   - Complete sign-in process
   - Verify redirect to originally requested URL (`/dashboard`)
   - Test redirect preservation for multiple protected routes
   - Confirm no redirect loops occur

3. **Authentication State Validation**
   - Access protected routes as authenticated user
   - Verify all protected content loads correctly
   - Check user context available throughout application
   - Test sign-out functionality from protected areas

**Expected Results:**
- ✅ Unauthenticated users redirected to login
- ✅ Original URLs preserved and restored after login
- ✅ Protected content accessible to authenticated users
- ✅ Sign-out properly clears session and redirects

### E2E-AUTH-003: Password Reset Complete Flow

**Objective:** Verify password reset functionality works end-to-end

**Test Steps:**
1. **Password Reset Initiation**
   - Navigate to `/auth/reset`
   - Enter email address from E2E-REG-001
   - Submit reset request
   - Verify confirmation message (no user enumeration)

2. **Reset Token Handling**
   - Check Supabase dashboard for reset email/token
   - Use development environment to simulate email click
   - Navigate to reset confirmation page
   - Verify token validation works correctly

3. **Password Update and Sign-In**
   - Enter new password meeting strength requirements
   - Submit password change
   - Verify automatic sign-in after successful reset
   - Test sign-in with new password works correctly

**Expected Results:**
- ✅ Reset process completes without revealing user enumeration
- ✅ Token validation and password update work correctly
- ✅ Automatic sign-in after reset functions properly
- ✅ New password authentication works for future logins

---

## Test Category 3: Database Integration Verification

**Priority:** Critical  
**Dependency:** Database schema implementation (Task 3.x)  

### E2E-DB-001: User Data Access and RLS Policy Enforcement

**Objective:** Verify authenticated users can access appropriate data with proper security isolation

**Test Steps:**
1. **User Profile Data Access**
   - Sign in as authenticated user from E2E-REG-001
   - Query user's own profile data via API/interface
   - Verify all expected profile fields accessible
   - Check data accuracy and completeness

2. **Cross-User Data Isolation**
   - Create second test user via `/api/dev/create-test-user`
   - Sign in as first user
   - Attempt to access second user's profile data
   - Verify RLS policies block unauthorized access
   - Test applies to all user-specific tables

3. **Fragrance Data Access**
   - Sign in as authenticated user
   - Access fragrance listing/search functionality
   - Verify fragrance data loads correctly for authenticated users
   - Check performance meets <200ms targets for basic queries
   - Test fragrance detail views work correctly

**Expected Results:**
- ✅ Users can access their own data correctly
- ✅ RLS policies prevent cross-user data access
- ✅ Fragrance data accessible with proper performance
- ✅ No data leaks or unauthorized access possible

### E2E-DB-002: User Collection Functionality Integration

**Objective:** Verify user collection features work with authenticated sessions

**Test Steps:**
1. **Collection Management Access**
   - Sign in as authenticated user
   - Navigate to collection/library interface
   - Verify empty collection displays correctly for new users
   - Check collection management UI loads properly

2. **Collection Data Operations**
   - Add fragrance to user collection (if implemented)
   - Verify collection item stored correctly in database
   - Check RLS ensures collection items only visible to owner
   - Test collection updates/modifications work correctly

3. **Collection Performance**
   - Test collection loading performance
   - Verify queries complete within <100ms targets
   - Check pagination/filtering works if implemented
   - Validate collection size limits if applicable

**Expected Results:**
- ✅ Collection interface loads correctly for authenticated users
- ✅ Collection operations work with proper data isolation
- ✅ Performance targets met for collection functionality
- ✅ User collections properly secured and functional

---

## Test Category 4: Complete Platform Functionality

**Priority:** High  
**Dependency:** All previous components integrated  

### E2E-PLAT-001: Home to Dashboard Complete User Journey

**Objective:** Verify seamless user experience across entire platform

**Test Steps:**
1. **Home Page Experience**
   - Navigate to home page as anonymous user
   - Verify page loads correctly with full content
   - Check navigation menu and call-to-action buttons
   - Test responsive design across device sizes
   - Validate Core Web Vitals targets met

2. **Navigation and Information Architecture**
   - Test all navigation links from home page
   - Verify information architecture makes sense to users
   - Check content hierarchy and messaging clarity
   - Test mobile navigation functionality

3. **Sign-Up Conversion Flow**
   - Follow natural user path from home to registration
   - Complete entire registration and verification process
   - Access dashboard and key platform features
   - Verify user feels oriented and ready to use platform

4. **Feature Integration Verification**
   - Test all major features accessible from dashboard
   - Verify features work correctly with authenticated context
   - Check feature integration doesn't break platform stability
   - Test user can accomplish primary platform objectives

**Expected Results:**
- ✅ Seamless user experience from first visit to active use
- ✅ Platform features work together coherently
- ✅ User onboarding provides clear value and next steps
- ✅ No broken functionality or integration issues

### E2E-PLAT-002: Cross-Feature Integration Verification

**Objective:** Verify all platform features work together without conflicts

**Test Steps:**
1. **Authentication + Database Integration**
   - Verify authenticated users can access all database features
   - Check user context properly passed to all components
   - Test database queries work correctly with user sessions
   - Validate no session/database sync issues

2. **UI + Backend Integration**
   - Test form submissions work correctly
   - Verify API responses properly handled in UI
   - Check error handling works across all integration points
   - Test loading states and user feedback systems

3. **Feature Interdependency Testing**
   - Use features in various combinations and sequences
   - Verify no feature conflicts or interference
   - Test platform stability under normal usage patterns
   - Check performance remains acceptable with full feature use

**Expected Results:**
- ✅ All features integrate seamlessly
- ✅ No conflicts or interference between components
- ✅ Platform remains stable and performant
- ✅ User experience is cohesive across all features

---

## Test Category 5: Performance & Reliability Verification

**Priority:** High  
**Dependency:** Complete platform functionality  

### E2E-PERF-001: Core Web Vitals and Performance Targets

**Objective:** Verify platform meets all performance benchmarks for real users

**Test Steps:**
1. **Core Web Vitals Measurement**
   - **Largest Contentful Paint (LCP):** <2.5 seconds for all major pages
     - Home page: <2.5s
     - Auth pages: <2.5s  
     - Dashboard: <2.5s
     - Feature pages: <2.5s

2. **Interaction to Next Paint (INP):** <200ms for all interactive elements
     - Form submissions: <200ms
     - Navigation clicks: <200ms
     - Feature interactions: <200ms

3. **Cumulative Layout Shift (CLS):** <0.1 for visual stability
     - Page loading: <0.1 CLS
     - Dynamic content: <0.1 CLS
     - User interactions: <0.1 CLS

**Test Conditions:**
- Test on 3G network simulation
- Test on mobile devices (real or simulated)
- Test on desktop with various connection speeds
- Measure across multiple page loads for consistency

**Expected Results:**
- ✅ All Core Web Vitals targets met consistently
- ✅ Performance acceptable across device types
- ✅ Platform feels fast and responsive to users
- ✅ No performance regressions from feature additions

### E2E-PERF-002: Database Query Performance Under Load

**Objective:** Verify database performance meets targets with realistic usage

**Test Steps:**
1. **Authentication Query Performance**
   - User login queries: <100ms
   - Session validation: <50ms
   - User profile loading: <100ms
   - Concurrent user handling: stable performance

2. **Fragrance Data Query Performance**
   - Basic fragrance listing: <50ms
   - Fragrance search: <100ms
   - Fragrance detail loading: <50ms
   - Filtered searches: <200ms

3. **User Collection Query Performance**
   - Collection loading: <100ms
   - Collection updates: <100ms
   - Collection searches: <150ms
   - Cross-user isolation maintained under load

**Load Test Conditions:**
- Simulate 10 concurrent users minimum
- Test with full fragrance dataset (1,467 records)
- Include realistic user behavior patterns
- Measure 95th percentile response times

**Expected Results:**
- ✅ All database queries meet performance targets
- ✅ Performance stable under concurrent load
- ✅ No query timeout or connection issues
- ✅ System scalable for production user loads

### E2E-PERF-003: Error Handling and Recovery Verification

**Objective:** Verify platform handles errors gracefully and guides users to recovery

**Test Steps:**
1. **Network Error Handling**
   - Simulate network disconnection during operations
   - Verify appropriate error messages shown
   - Test automatic retry functionality where applicable
   - Check user can recover from network issues

2. **Database Error Handling**
   - Simulate database connection issues (if possible safely)
   - Verify graceful degradation of functionality
   - Test error message clarity and user guidance
   - Check platform stability during error conditions

3. **User Error Recovery**
   - Test invalid form submissions
   - Verify clear error messages and correction guidance
   - Test user can correct errors and continue successfully
   - Check no data loss during error recovery

**Expected Results:**
- ✅ All error conditions handled gracefully
- ✅ Users receive clear guidance for error recovery
- ✅ Platform remains stable during error conditions
- ✅ No data loss or corruption during errors

---

## Test Implementation Guidelines

### Test Execution Environment

**Required Setup:**
- Development environment with authentication system
- Test database with fragrance data loaded
- `/api/dev/create-test-user` endpoint available
- Browser automation tools for E2E testing

**Test Data Requirements:**
- Multiple test user accounts with known credentials
- Sample fragrance data for testing searches/collections
- Various device/viewport size simulation capabilities
- Network condition simulation for performance testing

### Test Automation Framework

**Recommended Tools:**
- **Playwright** for browser automation and E2E testing
- **Vitest** for test framework and assertions
- **Database testing utilities** for data verification
- **Performance monitoring tools** for Core Web Vitals measurement

**Test Structure:**
```typescript
// Example test structure
describe('E2E-REG-001: Complete User Registration Journey', () => {
  beforeEach(async () => {
    // Setup fresh test environment
    await setupTestDatabase()
    await clearTestUsers()
  })

  test('Home page to dashboard flow', async ({ page }) => {
    // Test implementation following specification steps
  })

  afterEach(async () => {
    // Cleanup test data
    await cleanupTestData()
  })
})
```

### Success Criteria Summary

**Critical Pass Requirements (All Must Pass):**
- ✅ Complete user registration journey works flawlessly
- ✅ Authentication flows function correctly with session persistence
- ✅ Database integration maintains data integrity and security
- ✅ Platform features integrate seamlessly without conflicts
- ✅ Performance targets met consistently across all scenarios

**Performance Benchmarks (95th Percentile):**
- LCP (Largest Contentful Paint): <2.5 seconds
- INP (Interaction to Next Paint): <200 milliseconds  
- CLS (Cumulative Layout Shift): <0.1
- Database queries: <200ms for complex operations, <100ms for simple
- Authentication operations: <100ms for validation, <200ms for creation

**Security Requirements (100% Pass Rate):**
- RLS policies prevent unauthorized data access
- Cross-user data isolation maintained under all conditions
- Authentication state properly managed and validated
- No session fixation or privilege escalation possible

---

## Test Execution Plan

### Phase 1: Core Functionality Verification (Priority: Critical)
1. Execute E2E-REG-001 and E2E-REG-002 (User Registration)
2. Execute E2E-AUTH-001 through E2E-AUTH-003 (Authentication)
3. Execute E2E-DB-001 and E2E-DB-002 (Database Integration)

### Phase 2: Platform Integration Verification (Priority: High)
1. Execute E2E-PLAT-001 and E2E-PLAT-002 (Platform Functionality)
2. Execute E2E-PERF-001 through E2E-PERF-003 (Performance & Reliability)

### Phase 3: Final Validation (Priority: High)
1. Run complete test suite end-to-end
2. Verify all performance targets consistently met
3. Confirm platform ready for user testing/production deployment

**Estimated Execution Time:** 2-4 hours for complete test suite
**Required Resources:** Backend engineer + Frontend engineer collaboration
**Success Gate:** 100% pass rate on critical tests, 95% on high-priority tests

---

## Documentation and Reporting

### Test Results Documentation
- Document all test execution results with timestamps
- Include performance measurements and screenshots for failures
- Create test report with pass/fail status for each specification
- Note any deviations from expected behavior or performance

### Issue Tracking
- Log any test failures with detailed reproduction steps
- Categorize issues by severity (Critical, High, Medium, Low)
- Track resolution status and retest requirements
- Document workarounds for non-critical issues

### Platform Readiness Assessment
Based on test results, provide clear recommendation:
- ✅ **Production Ready:** All critical tests pass, performance targets met
- ⚠️ **Conditional Ready:** Minor issues present, acceptable for limited testing
- ❌ **Not Ready:** Critical failures present, requires fixes before user access

---

**Test Specifications Complete - Ready for Implementation**

These comprehensive end-to-end test specifications ensure the ScentMatch platform is thoroughly validated for real user usage before production deployment. Implementation should be performed by backend and frontend engineers working together to verify complete system integration.
# Authentication & Fragrance Database Foundation - Acceptance Criteria & Test Plan

**Date:** 2025-08-14  
**Spec:** User Authentication & Fragrance Database Foundation  
**Status:** Definition of Ready - QA Testing Engineer

## Overview

Comprehensive acceptance criteria and test plan for ScentMatch's foundational authentication system and fragrance database setup. This covers MVP flows for user registration, authentication, and basic fragrance data management with strict mobile and accessibility requirements.

## Acceptance Criteria - Authentication Flows

### AC-001: User Registration Flow

**Given** a new user wants to create an account  
**When** they access the registration page  
**Then** they should see:

- Email input field with validation
- Password input field with strength requirements
- "Sign Up" button (disabled until valid inputs)
- "Already have an account? Sign In" link
- Social provider options (Google, Apple)

**Given** a user enters valid registration details  
**When** they submit the form  
**Then** the system should:

- Create Supabase auth user
- Send email verification
- Redirect to email verification pending page
- Display "Check your email" message with resend option

**Given** a user clicks email verification link  
**When** the token is valid  
**Then** they should:

- Be redirected to profile setup page
- Have verified email status in database
- Receive welcome email

### AC-002: User Sign-In Flow

**Given** a registered user wants to sign in  
**When** they access the sign-in page  
**Then** they should see:

- Email input field
- Password input field with show/hide toggle
- "Sign In" button
- "Forgot password?" link
- "Don't have an account? Sign Up" link
- Social provider options

**Given** a user enters correct credentials  
**When** they submit the form  
**Then** they should:

- Be authenticated via Supabase Auth
- Be redirected to dashboard/home page
- Have session persist across browser refresh
- See loading state during authentication

**Given** a user enters incorrect credentials  
**When** they submit the form  
**Then** they should see:

- Clear error message: "Invalid email or password"
- Form fields remain populated (except password)
- No indication of which field is incorrect (security)

### AC-003: Password Reset Flow

**Given** a user forgot their password  
**When** they click "Forgot password?" link  
**Then** they should:

- Be taken to password reset page
- See email input field and "Send Reset Link" button

**Given** a user enters valid email for reset  
**When** they submit the form  
**Then** they should:

- Receive password reset email
- See confirmation "Reset link sent" message
- Be able to request another link after 60 seconds

**Given** a user clicks valid reset link  
**When** the token is not expired  
**Then** they should:

- Be taken to new password creation page
- Be able to set new password meeting requirements
- Be automatically signed in after successful reset

### AC-004: Social Authentication

**Given** a user wants to sign in with Google  
**When** they click "Continue with Google" button  
**Then** they should:

- Be redirected to Google OAuth flow
- Return to app with authenticated session
- Have profile data populated from Google (name, email, avatar)
- Be redirected to appropriate post-auth page

**Given** a user signs in with social provider for first time  
**When** OAuth completes successfully  
**Then** the system should:

- Create new user record in Supabase
- Populate profile with provider data
- Send welcome email
- Redirect to profile setup completion

## Acceptance Criteria - Fragrance Database

### AC-005: Fragrance Data Model

**Given** the system needs to store fragrance information  
**When** a fragrance record is created  
**Then** it should include:

- Name (required, string, max 200 chars)
- Brand (required, string, max 100 chars)
- Fragrance family (enum: Fresh, Floral, Oriental, Woody)
- Notes (top, middle, base - arrays of strings)
- Description (text, max 1000 chars)
- Launch year (optional, integer, 1900-current year)
- Gender classification (Unisex, Masculine, Feminine)
- Price information (optional, decimal)
- Image URLs (array, validated URLs)
- Created/updated timestamps

### AC-006: Fragrance Search & Discovery

**Given** a user wants to search fragrances  
**When** they enter search terms  
**Then** they should see:

- Results filtered by name, brand, notes
- Results sorted by relevance
- Loading states during search
- "No results found" state with suggestions
- Maximum 20 results per page with pagination

**Given** a user filters by fragrance family  
**When** they select filter options  
**Then** results should:

- Update in real-time without page reload
- Show filter badges with removal option
- Maintain search query with filters
- Reset pagination to page 1

### AC-007: User Collection Management

**Given** an authenticated user wants to add fragrance to collection  
**When** they click "Add to Collection" on fragrance detail  
**Then** the system should:

- Add fragrance to user's collection table
- Show success confirmation
- Update UI to show "In Collection" state
- Prevent duplicate additions

**Given** a user views their collection  
**When** they access collection page  
**Then** they should see:

- Grid/list view toggle
- Filter and sort options
- Personal rating system (1-5 stars)
- Private notes field for each fragrance
- Remove from collection option

## Mobile Core Web Vitals Thresholds

### Performance Requirements

**Largest Contentful Paint (LCP):** < 2.5 seconds

- Authentication pages must load primary content within 2.5s
- Fragrance list/grid must render initial items within 2.5s
- Critical above-fold content prioritized

**Interaction to Next Paint (INP):** < 200ms

- Form submissions respond within 200ms
- Button taps show immediate feedback
- Search input shows results within 200ms
- Navigation between pages within 200ms

**Cumulative Layout Shift (CLS):** < 0.1

- No layout shifts during form interactions
- Image loading must not cause layout shifts
- Loading states prevent content jumping
- Font loading optimized to prevent FOIT/FOUT

### Mobile-Specific Requirements

**Touch Targets:** Minimum 44px x 44px for all interactive elements
**Viewport:** Responsive design 320px - 1200px+ widths
**Offline Handling:** Graceful degradation with clear offline messaging
**Network Conditions:** Functional on 3G speeds (1.6Mbps, 300ms RTT)

## WCAG 2.2 AA Accessibility Checklist

### Authentication Flow Accessibility

**Form Controls:**

- [ ] All form inputs have associated labels
- [ ] Error messages linked to form controls via aria-describedby
- [ ] Required fields indicated with aria-required="true"
- [ ] Password visibility toggle accessible via keyboard
- [ ] Form validation errors announced by screen readers

**Keyboard Navigation:**

- [ ] Tab order logical and intuitive
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators clearly visible (3:1 contrast ratio)
- [ ] Skip links available for main content
- [ ] Modal dialogs trap focus appropriately

**Color & Contrast:**

- [ ] Text contrast minimum 4.5:1 for normal text
- [ ] Text contrast minimum 3:1 for large text (18pt+)
- [ ] Error states don't rely solely on color
- [ ] Focus indicators meet 3:1 contrast requirements
- [ ] Interactive elements distinguishable when focused

**Screen Reader Support:**

- [ ] Page titles descriptive and unique
- [ ] Heading structure logical (h1, h2, h3 hierarchy)
- [ ] Loading states announced to screen readers
- [ ] Success/error messages announced automatically
- [ ] Form progress indicated for multi-step flows

**Language & Content:**

- [ ] Page language declared in HTML
- [ ] Instructions clear and concise
- [ ] Error messages specific and actionable
- [ ] Help text available for complex interactions

### Fragrance Database Accessibility

**Data Tables:**

- [ ] Table headers properly associated with data cells
- [ ] Sort controls keyboard accessible
- [ ] Column headers indicate sort direction
- [ ] Row selection announced to screen readers

**Images:**

- [ ] Fragrance images have descriptive alt text
- [ ] Decorative images marked with alt=""
- [ ] Missing images gracefully handled

**Interactive Lists:**

- [ ] Collection lists navigable with arrow keys
- [ ] Selected items announced properly
- [ ] Batch operations keyboard accessible

## Test Data Requirements

### User Test Data

```sql
-- Test Users (Supabase Auth)
INSERT INTO auth.users (email, password) VALUES
('sarah.beginner@example.com', 'SecurePass123!'),
('marcus.enthusiast@example.com', 'SecurePass123!'),
('elena.collector@example.com', 'SecurePass123!'),
('admin.tester@example.com', 'SecurePass123!');

-- User Profiles
INSERT INTO user_profiles (user_id, display_name, bio, experience_level) VALUES
(uuid1, 'Sarah B.', 'New to fragrances', 'beginner'),
(uuid2, 'Marcus E.', 'Fragrance enthusiast', 'intermediate'),
(uuid3, 'Elena C.', 'Collector since 2015', 'expert'),
(uuid4, 'QA Tester', 'Test account', 'intermediate');
```

### Fragrance Test Data

```sql
-- Sample Fragrances for Testing
INSERT INTO fragrances (name, brand, family, description, gender, launch_year) VALUES
('Aventus', 'Creed', 'Fresh', 'Iconic pineapple and birch scent', 'Masculine', 2010),
('Black Opium', 'Yves Saint Laurent', 'Oriental', 'Coffee and vanilla addiction', 'Feminine', 2014),
('Santal 33', 'Le Labo', 'Woody', 'Cult favorite sandalwood', 'Unisex', 2011),
('Light Blue', 'Dolce & Gabbana', 'Fresh', 'Mediterranean summer vibes', 'Unisex', 2001),
('Tom Ford Oud Wood', 'Tom Ford', 'Oriental', 'Luxurious oud blend', 'Unisex', 2007);

-- Fragrance Notes
INSERT INTO fragrance_notes (fragrance_id, note_type, note_name) VALUES
(aventus_id, 'top', 'Pineapple'),
(aventus_id, 'top', 'Black Currant'),
(aventus_id, 'middle', 'Rose'),
(aventus_id, 'base', 'Birch'),
(aventus_id, 'base', 'Oakmoss');
```

### User Collection Test Data

```sql
-- Test Collections
INSERT INTO user_collections (user_id, fragrance_id, rating, notes) VALUES
(marcus_id, aventus_id, 5, 'Perfect for summer, gets compliments'),
(marcus_id, santal33_id, 4, 'Unique but expensive'),
(elena_id, oudwood_id, 5, 'Holy grail fragrance'),
(elena_id, blackopium_id, 3, 'Too sweet for daily wear');
```

## Security Testing Scenarios

### Authentication Security

**Password Security:**

- [ ] Minimum 8 characters, max 128 characters
- [ ] Must contain: uppercase, lowercase, number, special character
- [ ] Passwords hashed with bcrypt/Argon2 in Supabase
- [ ] No password stored in plaintext anywhere

**Session Management:**

- [ ] JWT tokens expire appropriately (15min access, 7 day refresh)
- [ ] Tokens invalidated on logout
- [ ] Concurrent session limits enforced
- [ ] Session fixation attacks prevented

**Input Validation:**

- [ ] SQL injection protection on all database queries
- [ ] XSS prevention on all user inputs
- [ ] CSRF tokens on state-changing operations
- [ ] Rate limiting on authentication endpoints (5 attempts/5 minutes)

**OAuth Security:**

- [ ] State parameter used to prevent CSRF
- [ ] Redirect URIs whitelisted
- [ ] Token exchange over HTTPS only
- [ ] Scope limitations properly enforced

### Data Protection

**PII Handling:**

- [ ] Email addresses encrypted at rest
- [ ] Personal data deletion on account closure
- [ ] Data export functionality available
- [ ] Audit logs for sensitive operations

**API Security:**

- [ ] Authentication required for protected endpoints
- [ ] Input validation on all API routes
- [ ] Output encoding prevents data leakage
- [ ] Error messages don't expose system information

## Test Execution Plan

### Phase 1: Unit Tests (Backend)

- [ ] Supabase Auth integration tests
- [ ] Database model validation tests
- [ ] API endpoint functionality tests
- [ ] Security middleware tests

### Phase 2: Integration Tests (Frontend + Backend)

- [ ] Complete authentication flows
- [ ] Fragrance CRUD operations
- [ ] User collection management
- [ ] Error handling and edge cases

### Phase 3: E2E Tests (Playwright)

- [ ] User registration journey
- [ ] Sign-in/sign-out flows
- [ ] Password reset process
- [ ] Social authentication
- [ ] Fragrance discovery and collection
- [ ] Mobile responsive testing

### Phase 4: Performance Testing

- [ ] Core Web Vitals measurement
- [ ] Database query performance
- [ ] API response times
- [ ] Concurrent user load testing

### Phase 5: Accessibility Testing

- [ ] Screen reader testing (NVDA, JAWS)
- [ ] Keyboard navigation testing
- [ ] Color contrast verification
- [ ] Mobile accessibility testing

### Phase 6: Security Testing

- [ ] Authentication bypass attempts
- [ ] Session management vulnerabilities
- [ ] Input validation testing
- [ ] Rate limiting verification

## Definition of Done

**Functional Requirements:**

- [ ] All acceptance criteria pass
- [ ] Unit tests achieve 80%+ coverage
- [ ] Integration tests cover happy path + error scenarios
- [ ] E2E tests verify core user journeys

**Performance Requirements:**

- [ ] Core Web Vitals meet thresholds on mobile
- [ ] API responses under 500ms
- [ ] Database queries optimized
- [ ] Image loading optimized

**Accessibility Requirements:**

- [ ] WCAG 2.2 AA compliance verified
- [ ] Screen reader testing completed
- [ ] Keyboard navigation functional
- [ ] Color contrast requirements met

**Security Requirements:**

- [ ] Security testing scenarios passed
- [ ] Penetration testing completed
- [ ] Data protection verified
- [ ] Authentication security confirmed

**Quality Requirements:**

- [ ] Code review completed
- [ ] Documentation updated
- [ ] Error handling comprehensive
- [ ] User experience validated

---

**Next Steps:**

1. Review and approve acceptance criteria
2. Set up test data in staging environment
3. Begin implementation with TDD approach
4. Execute test plan phases sequentially
5. Document any deviations or additional requirements discovered during testing

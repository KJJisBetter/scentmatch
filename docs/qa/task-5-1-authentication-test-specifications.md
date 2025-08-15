# Task 5.1: Authentication Flows & Security Testing Specifications

**Date:** 2025-08-15  
**Status:** Ready for Implementation  
**Author:** QA Testing Specialist  
**Target:** Backend Engineer Implementation

## Overview

Comprehensive test specifications for production-ready authentication system with Supabase integration, focusing on security, user experience, and database integration with Row Level Security (RLS) policies.

## Test Environment Setup

### Prerequisites

- Supabase project configured with email/password provider
- Database schema with `user_profiles` table and RLS policies
- Middleware configured for protected routes
- Rate limiting implemented (5 attempts per 15 minutes)
- Email testing setup for verification flows

### Test Data Requirements

```sql
-- Test users for different scenarios
INSERT INTO auth.users (email, email_confirmed_at) VALUES
('test.valid@scentmatch.com', now()),
('test.unverified@scentmatch.com', null),
('test.reset@scentmatch.com', now());

-- Fragrance data for collection testing
INSERT INTO fragrances (name, brand, family) VALUES
('Test Fresh Fragrance', 'Test Brand', 'Fresh'),
('Test Woody Fragrance', 'Test Brand', 'Woody');
```

## 1. User Registration Testing

### 1.1 Valid Registration Flow

**Test ID:** AUTH-REG-001  
**Priority:** Critical  
**Flow:** User Registration → Email Verification → Profile Creation

#### Test Cases

**1.1.1 Successful Registration**
- **Given:** User accesses registration page
- **When:** User enters valid email and password
- **Then:** 
  - Account created in `auth.users`
  - Email verification sent
  - User redirected to verification pending page
  - User profile created in `user_profiles` table

**1.1.2 Email Verification Process**
- **Given:** User registered but not verified
- **When:** User clicks verification link in email
- **Then:**
  - `email_confirmed_at` updated in auth.users
  - User auto-signed in
  - Redirected to dashboard
  - Session cookie set

**1.1.3 Profile Integration**
- **Given:** Email verification completed
- **When:** User accesses dashboard
- **Then:**
  - User profile accessible via RLS
  - User ID matches between auth.users and user_profiles
  - Can create/read personal fragrance collections

### 1.2 Registration Validation

**Test ID:** AUTH-REG-002  
**Priority:** High  
**Focus:** Input validation and error handling

#### Test Cases

**1.2.1 Email Format Validation**
- **Invalid emails:** `test`, `test@`, `@domain.com`, `test@domain`
- **Expected:** Client-side validation error before submission
- **Verify:** Error message linked to input for screen readers

**1.2.2 Password Strength Requirements**
- **Weak passwords:** `123`, `password`, `abc123`
- **Expected:** Password requirements displayed and enforced
- **Verify:** Real-time validation feedback

**1.2.3 Duplicate Account Prevention**
- **Given:** Email already exists in system
- **When:** User attempts registration with same email
- **Then:** Clear error message without revealing account existence

### 1.3 Registration Security Tests

**Test ID:** AUTH-REG-003  
**Priority:** Critical  
**Focus:** Security vulnerability prevention

#### Security Test Cases

**1.3.1 SQL Injection Prevention**
- **Malicious inputs:** `'; DROP TABLE users; --`, `admin@test.com'; DELETE FROM auth.users; --`
- **Expected:** Input sanitized, no database manipulation
- **Verify:** Database integrity maintained

**1.3.2 XSS Prevention**
- **Malicious inputs:** `<script>alert('xss')</script>`, `javascript:alert('xss')`
- **Expected:** Input escaped, no script execution
- **Verify:** Rendered safely in confirmation pages

**1.3.3 Rate Limiting**
- **Test:** 10 registration attempts from same IP within 1 minute
- **Expected:** Rate limiting triggered after 5 attempts
- **Verify:** 429 status code, retry-after header

## 2. Sign-in/Sign-out Testing

### 2.1 Valid Authentication Flow

**Test ID:** AUTH-LOGIN-001  
**Priority:** Critical  
**Flow:** Credential Validation → Session Creation → Route Access

#### Test Cases

**2.1.1 Successful Sign-in**
- **Given:** Valid user credentials
- **When:** User submits login form
- **Then:**
  - Session created in Supabase
  - HttpOnly session cookie set
  - Redirected to dashboard or requested page
  - Middleware allows access to protected routes

**2.1.2 Session Persistence**
- **Given:** User signed in successfully
- **When:** Browser closed and reopened
- **Then:**
  - Session cookie remains valid
  - User stays signed in
  - Protected routes accessible without re-login

**2.1.3 Cross-tab Session Sync**
- **Given:** User signed in one tab
- **When:** Opening new tab/window
- **Then:**
  - Session synchronized across tabs
  - Protected routes accessible in new tab
  - Sign-out in one tab affects all tabs

### 2.2 Invalid Authentication Handling

**Test ID:** AUTH-LOGIN-002  
**Priority:** High  
**Focus:** Error handling and security

#### Test Cases

**2.2.1 Invalid Credentials**
- **Test scenarios:**
  - Wrong password for valid email
  - Non-existent email
  - Unverified email account
- **Expected:** Generic error message, no user enumeration
- **Verify:** No information leak about account existence

**2.2.2 Account Security States**
- **Given:** Account exists but email unverified
- **When:** User attempts sign-in
- **Then:** Redirect to email verification page with resend option

### 2.3 Session Management

**Test ID:** AUTH-SESSION-001  
**Priority:** Critical  
**Focus:** Session lifecycle and security

#### Test Cases

**2.3.1 Session Timeout**
- **Given:** User session active for 24 hours
- **When:** Session expires
- **Then:**
  - User redirected to login on next protected route access
  - Clear session invalidation
  - No persistent access to protected data

**2.3.2 Secure Sign-out**
- **Given:** User signed in
- **When:** User clicks sign-out
- **Then:**
  - Session cookie removed
  - Supabase session invalidated
  - Redirected to home page
  - Protected routes inaccessible

**2.3.3 Concurrent Session Handling**
- **Given:** User signed in on multiple devices
- **When:** User signs out on one device
- **Then:** Sessions on other devices remain valid (optional behavior)

## 3. Password Reset Testing

### 3.1 Password Reset Flow

**Test ID:** AUTH-RESET-001  
**Priority:** Critical  
**Flow:** Reset Request → Email Link → Password Update → Auto Sign-in

#### Test Cases

**3.1.1 Valid Reset Request**
- **Given:** User with valid account
- **When:** User requests password reset
- **Then:**
  - Reset email sent with secure token
  - Token expires in 1 hour
  - Original password remains valid until reset

**3.1.2 Reset Link Validation**
- **Given:** User receives reset email
- **When:** User clicks reset link
- **Then:**
  - Token validated against database
  - Password reset form displayed
  - Secure token handling (no URL exposure)

**3.1.3 Password Update Process**
- **Given:** Valid reset token
- **When:** User enters new password
- **Then:**
  - Password updated in auth system
  - Token invalidated after use
  - User automatically signed in
  - All existing sessions invalidated

### 3.2 Reset Security Tests

**Test ID:** AUTH-RESET-002  
**Priority:** Critical  
**Focus:** Token security and abuse prevention

#### Test Cases

**3.2.1 Token Expiration**
- **Given:** Reset token older than 1 hour
- **When:** User attempts to use expired token
- **Then:** Error message, token rejected, new reset required

**3.2.2 Token Reuse Prevention**
- **Given:** Token already used for password reset
- **When:** Same token used again
- **Then:** Token rejected, security event logged

**3.2.3 Rate Limiting on Reset Requests**
- **Given:** Multiple reset requests for same email
- **When:** More than 3 requests in 5 minutes
- **Then:** Rate limiting triggered, temporary block

## 4. Protected Route Testing

### 4.1 Route Access Control

**Test ID:** AUTH-ROUTES-001  
**Priority:** Critical  
**Focus:** Middleware authentication enforcement

#### Test Cases

**4.1.1 Unauthenticated Access**
- **Protected routes:** `/dashboard`, `/collection`, `/recommendations`
- **Given:** User not signed in
- **When:** User accesses protected route
- **Then:**
  - Redirected to `/auth/login`
  - Original URL preserved in redirect parameter
  - Clear message about authentication requirement

**4.1.2 Post-login Redirect**
- **Given:** User redirected from protected route
- **When:** User successfully signs in
- **Then:**
  - Redirected to originally requested URL
  - Session established for protected areas
  - Subsequent protected routes accessible

**4.1.3 Authenticated Route Blocking**
- **Auth routes:** `/auth/login`, `/auth/signup`
- **Given:** User already signed in
- **When:** User accesses auth routes
- **Then:** Redirected to dashboard or specified redirect URL

### 4.2 RLS Integration

**Test ID:** AUTH-RLS-001  
**Priority:** Critical  
**Focus:** Database access control with authentication

#### Test Cases

**4.2.1 User Data Isolation**
- **Given:** Multiple users with fragrance collections
- **When:** User A accesses collection data
- **Then:**
  - Only User A's data visible
  - User B's data completely inaccessible
  - RLS policies enforced at database level

**4.2.2 Anonymous Access Prevention**
- **Given:** No authenticated session
- **When:** Direct database query attempted
- **Then:**
  - RLS blocks all user_collections access
  - No data leakage
  - Proper error handling

## 5. Security & Rate Limiting Testing

### 5.1 Brute Force Protection

**Test ID:** AUTH-SECURITY-001  
**Priority:** Critical  
**Focus:** Attack prevention and system protection

#### Test Cases

**5.1.1 Login Brute Force Protection**
- **Test:** 20 failed login attempts for same email
- **Expected:** Account temporarily locked after 5 attempts
- **Verify:** 
  - Lock duration: 15 minutes
  - Clear error messages
  - Legitimate users can still register

**5.1.2 Rate Limiting Accuracy**
- **Test:** Exactly 5 attempts within time window
- **Expected:** 5th attempt processed, 6th blocked
- **Verify:** Counter resets after time window

**5.1.3 IP-based Rate Limiting**
- **Test:** Multiple failed attempts from same IP, different emails
- **Expected:** IP-level rate limiting after threshold
- **Verify:** Legitimate traffic from other IPs unaffected

### 5.2 Input Security

**Test ID:** AUTH-SECURITY-002  
**Priority:** Critical  
**Focus:** Input validation and injection prevention

#### Test Cases

**5.2.1 SQL Injection Prevention**
```sql
-- Test inputs for all auth forms
email: admin@test.com'; DROP TABLE users; --
password: test'; DELETE FROM auth.users WHERE '1'='1
```
- **Expected:** Input sanitized, no database manipulation
- **Verify:** Database integrity maintained, queries logged

**5.2.2 XSS Prevention**
```html
<!-- Test inputs for all auth forms -->
email: <script>alert('xss')</script>@test.com
name: <img src=x onerror=alert('xss')>
```
- **Expected:** Content escaped, no script execution
- **Verify:** Safe rendering in all contexts

**5.2.3 CSRF Protection**
- **Test:** Form submission without CSRF token
- **Expected:** Request rejected with 403 status
- **Verify:** Token validation on all state-changing operations

### 5.3 Session Security

**Test ID:** AUTH-SECURITY-003  
**Priority:** High  
**Focus:** Session hijacking prevention

#### Test Cases

**5.3.1 Session Token Security**
- **Verify:** Session cookies marked HttpOnly, Secure, SameSite
- **Test:** JavaScript access to session cookie
- **Expected:** Cookie inaccessible to client-side scripts

**5.3.2 Session Fixation Prevention**
- **Given:** Anonymous session exists
- **When:** User signs in
- **Then:** New session ID generated, old session invalidated

## 6. Mobile & Accessibility Testing

### 6.1 Mobile Performance

**Test ID:** AUTH-MOBILE-001  
**Priority:** High  
**Focus:** Core Web Vitals on authentication flows

#### Test Cases

**6.1.1 Performance Thresholds**
- **Network:** 3G throttling simulation
- **Metrics:**
  - LCP < 2.5s on all auth pages
  - INP < 200ms for form submissions
  - CLS < 0.1 (no layout shifts)
- **Test all:** Registration, login, password reset pages

**6.1.2 Touch Interface Usability**
- **Verify:** Touch targets minimum 44px
- **Test:** Form submission on mobile keyboards
- **Check:** Autocomplete attributes working

### 6.2 Accessibility Compliance

**Test ID:** AUTH-A11Y-001  
**Priority:** High  
**Focus:** WCAG 2.2 AA compliance

#### Test Cases

**6.2.1 Screen Reader Support**
- **Test:** Form navigation with screen reader
- **Verify:**
  - All form fields properly labeled
  - Error messages announced
  - Form validation feedback audible

**6.2.2 Keyboard Navigation**
- **Test:** Complete auth flows using only keyboard
- **Verify:**
  - Logical tab order
  - Focus indicators visible
  - All interactive elements reachable

**6.2.3 Visual Accessibility**
- **Verify:** 4.5:1 contrast ratio on all text
- **Test:** Form usability at 200% zoom
- **Check:** Color not sole indicator of status

## 7. Integration Testing

### 7.1 End-to-End User Journeys

**Test ID:** AUTH-E2E-001  
**Priority:** Critical  
**Focus:** Complete user flows across system

#### Test Cases

**7.1.1 New User Complete Journey**
1. Registration with email verification
2. Email verification click-through
3. First sign-in and dashboard access
4. Add fragrance to collection
5. Sign-out and sign-in verification

**7.1.2 Password Reset Journey**
1. Forgotten password request
2. Email link validation
3. Password reset completion
4. Auto sign-in verification
5. Collection access with new password

**7.1.3 Session Management Journey**
1. Sign-in across multiple tabs
2. Protected route access verification
3. Session timeout handling
4. Sign-out propagation across tabs

### 7.2 Database Integration

**Test ID:** AUTH-DB-001  
**Priority:** Critical  
**Focus:** Authentication and database consistency

#### Test Cases

**7.2.1 User Profile Synchronization**
- **Verify:** `auth.users.id` matches `user_profiles.id`
- **Test:** Profile creation during registration
- **Check:** RLS policies enforced consistently

**7.2.2 Collection Data Access**
- **Test:** Fragrance collection CRUD operations
- **Verify:** User isolation at database level
- **Check:** Consistent user context across operations

## Implementation Notes for Backend Engineer

### Testing Framework Setup

```typescript
// Recommended testing tools
import { createClient } from '@supabase/supabase-js';
import { expect, test, beforeEach } from 'vitest';
import { createAuthenticatedUser, cleanupTestUsers } from '@/tests/fixtures/auth';

// Test configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for testing
);
```

### Key Implementation Areas

1. **Rate Limiting Implementation**
   - Use Redis or in-memory store for rate limit counters
   - Implement both IP and email-based rate limiting
   - Clear error messages for rate limit exceeded

2. **Email Testing Strategy**
   - Use email testing service for E2E tests
   - Mock email service for unit tests
   - Verify email content and link generation

3. **Security Headers**
   - Middleware already configured with security headers
   - Ensure CSRF protection on auth endpoints
   - Validate all inputs server-side

4. **Error Handling**
   - Generic error messages to prevent user enumeration
   - Proper error logging for security events
   - Graceful degradation for auth service failures

### Performance Considerations

- Auth pages should load under 2.5s on 3G
- Form submissions under 200ms response time
- Optimize for mobile-first authentication flows
- Cache static assets aggressively

### Accessibility Requirements

- All forms must pass WCAG 2.2 AA compliance
- Screen reader compatibility essential
- Keyboard navigation support required
- Clear error message association with form fields

---

**Specification Status:** Ready for Implementation  
**Next Steps:** Backend Engineer implementation using these specifications  
**Definition of Done:** All test cases pass, security requirements met, performance targets achieved
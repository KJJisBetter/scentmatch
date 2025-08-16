# Task 5.1: Implementation Roadmap for Backend Engineer

**Date:** 2025-08-15  
**Purpose:** Guide backend engineer through test specification implementation  
**Prerequisites:** Test specifications reviewed and approved

## Phase 1: Core Authentication Setup (Priority 1)

### 1.1 Basic Auth Flow Implementation
**Files to create/modify:**
- `app/auth/login/page.tsx` - Login form component
- `app/auth/signup/page.tsx` - Registration form component
- `app/auth/reset/page.tsx` - Password reset form
- `app/actions/auth.ts` - Server actions for auth operations
- `lib/auth.ts` - Auth utility functions

**Testing Focus:**
- Registration → email verification → profile creation
- Sign-in → session creation → dashboard redirect
- Password reset → email → new password → auto sign-in

### 1.2 Session Management
**Files to create/modify:**
- Update `middleware.ts` - Enhance protected route handling
- `lib/session.ts` - Session management utilities
- `app/api/auth/callback/route.ts` - Handle auth callbacks

**Testing Focus:**
- Session persistence across browser restarts
- Cross-tab session synchronization
- Proper session cleanup on sign-out

## Phase 2: Security Implementation (Priority 1)

### 2.1 Rate Limiting Setup
**Files to create:**
- `lib/rate-limit.ts` - Rate limiting logic
- `app/api/auth/rate-limit.ts` - Rate limit middleware

**Rate Limit Rules:**
```typescript
// Authentication endpoints
const authRateLimits = {
  login: { attempts: 5, window: '15m', lockout: '15m' },
  signup: { attempts: 3, window: '1h' },
  resetPassword: { attempts: 3, window: '5m' },
  verifyEmail: { attempts: 5, window: '1h' }
};
```

**Testing Focus:**
- 5 failed login attempts → 15-minute lockout
- Progressive delays for repeated failures
- IP-based rate limiting for distributed attacks

### 2.2 Input Security
**Files to enhance:**
- All auth form components with validation
- Server actions with input sanitization
- API routes with security checks

**Security Implementation:**
```typescript
// Input validation example
const emailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email');

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number');
```

**Testing Focus:**
- SQL injection prevention on all inputs
- XSS prevention in form handling
- CSRF protection validation

## Phase 3: Database Integration (Priority 2)

### 3.1 User Profile Integration
**Files to create/modify:**
- `lib/user-profile.ts` - User profile operations
- Database migration for user_profiles table sync
- RLS policy validation

**Integration Points:**
- Registration creates both auth.user and user_profiles record
- Session context includes user profile data
- Collection operations use authenticated user context

**Testing Focus:**
- User isolation at database level
- RLS policy enforcement
- Profile creation during registration

### 3.2 Collection Access Control
**Files to create:**
- `app/actions/collections.ts` - Collection management with auth
- `lib/collections.ts` - Collection utilities with RLS

**Testing Focus:**
- User A cannot access User B's collections
- Anonymous users blocked from all collection data
- Proper error handling for unauthorized access

## Phase 4: Advanced Security Features (Priority 3)

### 4.1 Email Security
**Files to create:**
- `lib/email-security.ts` - Email verification and security
- `app/api/auth/verify/route.ts` - Email verification endpoint

**Security Features:**
- Secure token generation for password resets
- Email enumeration prevention
- Token expiration and single-use enforcement

**Testing Focus:**
- Password reset tokens expire in 1 hour
- Tokens invalidated after use
- Generic responses prevent user enumeration

### 4.2 Audit Logging
**Files to create:**
- `lib/security-logger.ts` - Security event logging
- Database schema for security logs

**Events to Log:**
```typescript
interface SecurityEvent {
  event_type: 'failed_login' | 'account_lockout' | 'password_reset' | 'suspicious_activity';
  user_email?: string;
  ip_address: string;
  user_agent: string;
  details: Record<string, any>;
  created_at: Date;
}
```

## Testing Implementation Strategy

### Test File Structure
```
tests/
├── auth/
│   ├── registration.test.ts        # User registration flows
│   ├── login.test.ts              # Sign-in/sign-out flows  
│   ├── password-reset.test.ts     # Password reset flows
│   ├── session-management.test.ts # Session lifecycle tests
│   ├── security.test.ts           # Security and rate limiting
│   ├── protected-routes.test.ts   # Route access control
│   └── integration.test.ts        # End-to-end scenarios
├── fixtures/
│   ├── auth.ts                    # Test user utilities
│   └── database.ts               # Test data setup
└── utils/
    ├── security-testing.ts        # Security test utilities
    └── performance.ts             # Performance test helpers
```

### Test Data Management

**Test User Creation:**
```typescript
// tests/fixtures/auth.ts
export async function createTestUser(overrides = {}) {
  const defaultUser = {
    email: `test.${Date.now()}@scentmatch.com`,
    password: 'TestPassword123!',
    emailVerified: true,
    ...overrides
  };
  
  return await supabase.auth.admin.createUser({
    email: defaultUser.email,
    password: defaultUser.password,
    email_confirm: defaultUser.emailVerified
  });
}

export async function cleanupTestUsers() {
  // Clean up test users after tests
}
```

**Database Test Setup:**
```typescript
// tests/fixtures/database.ts
export async function setupTestDatabase() {
  // Create test fragrances for collection testing
  const testFragrances = await createTestFragrances();
  return { testFragrances };
}

export async function cleanupTestDatabase() {
  // Clean up test data
}
```

## Performance Testing Integration

### Core Web Vitals Testing
```typescript
// tests/auth/performance.test.ts
test('Auth pages meet performance thresholds', async ({ page }) => {
  // Test registration page
  await page.goto('/auth/signup');
  const signupMetrics = await measureCoreWebVitals(page);
  expect(signupMetrics.LCP).toBeLessThan(2500); // 2.5s
  expect(signupMetrics.CLS).toBeLessThan(0.1);
  
  // Test login page
  await page.goto('/auth/login');
  const loginMetrics = await measureCoreWebVitals(page);
  expect(loginMetrics.LCP).toBeLessThan(2500);
  expect(loginMetrics.INP).toBeLessThan(200); // 200ms
});
```

### Mobile Performance Testing
```typescript
test('Mobile auth performance', async ({ page }) => {
  // Throttle to 3G
  await page.context().route('**/*', async route => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Add latency
    route.continue();
  });
  
  await page.goto('/auth/login');
  // Test touch interactions and form submissions
});
```

## Accessibility Testing Integration

### Automated A11y Testing
```typescript
// tests/auth/accessibility.test.ts
import { injectAxe, checkA11y } from 'axe-playwright';

test('Auth forms are accessible', async ({ page }) => {
  await page.goto('/auth/login');
  await injectAxe(page);
  
  await checkA11y(page, null, {
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'form-labels': { enabled: true }
    }
  });
});
```

### Keyboard Navigation Testing
```typescript
test('Keyboard-only navigation', async ({ page }) => {
  await page.goto('/auth/signup');
  
  // Tab through form
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  
  // Verify form can be completed with keyboard only
  await page.keyboard.type('test@example.com');
  await page.keyboard.press('Tab');
  await page.keyboard.type('password123');
  await page.keyboard.press('Enter');
});
```

## Quality Gates

### Before Implementation Complete

- [ ] All critical test cases passing
- [ ] Security tests validate OWASP compliance
- [ ] Performance tests meet Core Web Vitals thresholds
- [ ] Accessibility tests pass WCAG 2.2 AA
- [ ] Rate limiting properly configured and tested
- [ ] Database integration with RLS working correctly

### Before Production Deployment

- [ ] Security penetration testing completed
- [ ] End-to-end user journeys verified
- [ ] Error handling tested comprehensively
- [ ] Monitoring and logging configured
- [ ] Incident response procedures documented

## Implementation Timeline

**Week 1: Core Authentication (Phase 1)**
- Day 1-2: Basic auth forms and server actions
- Day 3-4: Session management implementation  
- Day 5: Testing and validation

**Week 2: Security Features (Phase 2)**
- Day 1-2: Rate limiting implementation
- Day 3-4: Input security and validation
- Day 5: Security testing and validation

**Week 3: Integration & Advanced Features (Phases 3-4)**
- Day 1-2: Database integration and RLS
- Day 3-4: Email security and audit logging
- Day 5: Full integration testing

**Week 4: Quality Assurance & Polish**
- Day 1-2: Performance optimization
- Day 3-4: Accessibility improvements
- Day 5: Final testing and documentation

---

**Implementation Status:** Ready to Begin  
**Next Action:** Backend engineer begins Phase 1 implementation  
**QA Support:** Available for clarification and testing guidance
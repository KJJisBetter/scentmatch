# QA Test Pattern: Authentication Flows

**Pattern Type:** Testing Strategy  
**Context:** ScentMatch Authentication & Database Foundation  
**Date:** 2025-08-14

## Quick Test Execution Checklist

### Critical Path Testing (Must Pass)

**Authentication Core:**

- [ ] New user registration → email verification → profile setup
- [ ] Existing user sign-in → dashboard redirect
- [ ] Password reset → email → new password → auto sign-in
- [ ] Google OAuth → profile creation/sign-in

**Mobile Performance (Non-negotiable):**

- [ ] LCP < 2.5s on auth pages (3G throttling)
- [ ] INP < 200ms for form submissions
- [ ] CLS < 0.1 (no layout shifts during loading)

**Accessibility (WCAG 2.2 AA):**

- [ ] Screen reader announces all form errors
- [ ] Tab navigation logical order
- [ ] 4.5:1 contrast ratio on all text
- [ ] Keyboard-only navigation possible

### Test Data Setup Script

```sql
-- Minimal test users for automation
INSERT INTO auth.users (email) VALUES
('test.beginner@scentmatch.com'),
('test.enthusiast@scentmatch.com'),
('test.admin@scentmatch.com');

-- Basic fragrance data
INSERT INTO fragrances (name, brand, family) VALUES
('Test Fragrance 1', 'Test Brand', 'Fresh'),
('Test Fragrance 2', 'Test Brand', 'Woody'),
('Test Fragrance 3', 'Test Brand', 'Oriental');
```

### Security Tests (Required)

**Rate Limiting:**

- [ ] 5 failed login attempts = 5-minute lockout
- [ ] Password reset emails limited to 1 per minute

**Input Validation:**

- [ ] SQL injection attempts blocked
- [ ] XSS payloads escaped
- [ ] Email format validation strict

### Playwright Test Scenarios

```javascript
// Critical path automation
test('Complete registration flow', async ({ page }) => {
  // Registration → verification → profile setup
});

test('Social auth with Google', async ({ page }) => {
  // Mock OAuth flow
});

test('Password reset journey', async ({ page }) => {
  // Reset request → email → new password
});

test('Mobile performance', async ({ page }) => {
  // Throttle to 3G, measure Core Web Vitals
});
```

### Common Failure Points

**Watch for these issues:**

1. **Layout shift during form loading** (breaks CLS threshold)
2. **Tab order skipping hidden elements** (accessibility fail)
3. **Error messages not linked to inputs** (screen reader issue)
4. **Social auth redirect loops** (OAuth configuration)
5. **Email verification timing issues** (async handling)

### Performance Monitoring

```javascript
// Core Web Vitals measurement
const vitals = await page.evaluate(() => {
  return new Promise(resolve => {
    new PerformanceObserver(list => {
      resolve(list.getEntries());
    }).observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });
  });
});
```

### Quick Accessibility Check

```javascript
// Automated a11y scanning
const a11yResults = await page
  .locator('[role="main"]')
  .evaluate(async element => {
    const axe = await import('axe-core');
    return await axe.run(element);
  });
```

## Definition of Ready Checkpoints

**Before Development:**

- [ ] Acceptance criteria reviewed and approved
- [ ] Test data requirements defined
- [ ] Performance thresholds agreed upon
- [ ] Accessibility requirements understood

**Before Testing:**

- [ ] Test environment with Supabase configured
- [ ] Mock data populated
- [ ] Performance testing tools set up
- [ ] Accessibility testing tools installed

**Before Deployment:**

- [ ] All critical path tests passing
- [ ] Performance thresholds met
- [ ] Security tests passed
- [ ] Accessibility compliance verified

---

**Pattern Success Criteria:**

- Zero critical bugs in production
- Performance targets consistently met
- User can complete entire auth journey on mobile
- Accessible to users with disabilities

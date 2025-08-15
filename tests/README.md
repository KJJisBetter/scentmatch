# ScentMatch Testing Framework

A comprehensive Test-Driven Development (TDD) framework for the ScentMatch Next.js 15 application, featuring mobile-first performance testing, accessibility validation, and robust database testing utilities.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:a11y
npm run test:performance

# Validate testing framework setup
npm run validate:setup
```

## 📋 Framework Overview

This testing framework is built around **Test-Driven Development (TDD)** principles and includes:

- **Unit Testing**: Vitest with React Testing Library
- **Integration Testing**: Full application workflow testing
- **Accessibility Testing**: WCAG 2.2 AA compliance with axe-core
- **Performance Testing**: Mobile-first Core Web Vitals monitoring
- **Database Testing**: Comprehensive Supabase operation testing
- **Authentication Testing**: Complete auth flow validation

## 🏗️ Architecture

```
tests/
├── accessibility/          # Accessibility testing utilities
├── app/                   # Next.js app initialization tests
├── fixtures/              # Test data and mock objects
├── integration/           # Integration test suites
├── lib/                   # Library function tests
├── mocks/                 # Mock implementations
├── performance/           # Performance and Core Web Vitals tests
├── setup/                 # Test environment setup
├── setup-validation/      # Framework validation tests
└── utils/                 # Testing utilities and helpers
```

## 🧪 Test Types

### Unit Tests

Test individual components and functions in isolation:

```typescript
import { describe, test, expect } from 'vitest'
import { render } from '@/tests/utils/test-utils'

describe('FragranceCard', () => {
  test('should display fragrance information', () => {
    const fragrance = { name: 'Test Fragrance', brand: 'Test Brand' }
    const { getByText } = render(<FragranceCard fragrance={fragrance} />)

    expect(getByText('Test Fragrance')).toBeInTheDocument()
    expect(getByText('Test Brand')).toBeInTheDocument()
  })
})
```

### Integration Tests

Test complete user workflows:

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import { authTestSetup } from '@/tests/setup/auth-test-setup';
import { databaseTestHelper } from '@/tests/utils/database-test-utils';

describe('User Collection Workflow', () => {
  beforeEach(() => {
    authTestSetup.setupSuccessfulAuth();
    databaseTestHelper.setupFragranceDatabase();
  });

  test('user can add fragrance to collection', async () => {
    // Test complete workflow from auth to database
  });
});
```

### Accessibility Tests

Ensure WCAG 2.2 AA compliance:

```typescript
import { testAccessibility, testMobileAccessibility } from '@/tests/accessibility/accessibility-helpers'

describe('Accessibility', () => {
  test('should meet WCAG 2.2 AA standards', async () => {
    await testAccessibility(render(<Component />))
  })

  test('should be mobile accessible', async () => {
    await testMobileAccessibility(<Component />)
  })
})
```

### Performance Tests

Monitor Core Web Vitals and performance budgets:

```typescript
import {
  testCoreWebVitals,
  testMobilePerformance,
} from '@/tests/performance/core-web-vitals';

describe('Performance', () => {
  test('should meet mobile Core Web Vitals thresholds', async () => {
    await testCoreWebVitals('http://localhost:3000');
  });

  test('should perform well on mobile devices', async () => {
    await testMobilePerformance('http://localhost:3000');
  });
});
```

## 🎯 TDD Workflow

### 1. Red - Write a Failing Test

```typescript
test('should calculate fragrance similarity score', () => {
  const fragrance1 = { notes: ['citrus', 'woody'] };
  const fragrance2 = { notes: ['citrus', 'fresh'] };

  const similarity = calculateSimilarity(fragrance1, fragrance2);
  expect(similarity).toBe(0.5); // This will fail initially
});
```

### 2. Green - Make the Test Pass

```typescript
function calculateSimilarity(frag1, frag2) {
  const commonNotes = frag1.notes.filter(note => frag2.notes.includes(note));
  return commonNotes.length / Math.max(frag1.notes.length, frag2.notes.length);
}
```

### 3. Refactor - Improve the Code

```typescript
export function calculateSimilarity(
  fragrance1: Fragrance,
  fragrance2: Fragrance
): number {
  const notes1 = new Set(fragrance1.notes);
  const notes2 = new Set(fragrance2.notes);

  const intersection = new Set([...notes1].filter(x => notes2.has(x)));
  const union = new Set([...notes1, ...notes2]);

  return intersection.size / union.size; // Jaccard similarity
}
```

## 📊 Coverage Requirements

The framework enforces the following coverage thresholds:

- **Lines**: 80%
- **Functions**: 75%
- **Branches**: 70%
- **Statements**: 80%

```bash
# Check coverage with thresholds
npm run test:coverage:threshold
```

## 🏃‍♂️ Performance Budgets

### Mobile-First Core Web Vitals Thresholds

- **LCP (Largest Contentful Paint)**: < 2.5s
- **INP (Interaction to Next Paint)**: < 200ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s
- **TTI (Time to Interactive)**: < 3.8s

### Performance Budgets

- **DOM Content Loaded**: < 2s
- **Full Page Load**: < 4s
- **Time to First Byte**: < 800ms
- **Resource Count**: < 50
- **Total Bundle Size**: < 2MB (mobile: 1.5MB)

```bash
# Run Lighthouse mobile audit
npm run lighthouse:mobile
```

## ♿ Accessibility Standards

Tests ensure compliance with:

- **WCAG 2.2 AA** guidelines
- **Mobile accessibility** best practices
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Color contrast** requirements (4.5:1 for normal text)

## 🗃️ Database Testing

### Mock Database Operations

```typescript
import { databaseTestHelper } from '@/tests/utils/database-test-utils';

// Set up successful database operations
databaseTestHelper.setupSuccessfulOperations();

// Set up error scenarios
databaseTestHelper.setupDatabaseErrors('network');

// Set up fragrance-specific data
databaseTestHelper.setupFragranceDatabase();

// Create test data
const testFragrance = databaseTestHelper.createTestData('fragrance', {
  name: 'Custom Test Fragrance',
});
```

### Real-time Testing

```typescript
// Set up real-time subscription testing
const subscription = databaseTestHelper.setupRealtimeSubscription();

// Test real-time updates
test('should handle real-time fragrance updates', async () => {
  // Test real-time functionality
});
```

## 🔐 Authentication Testing

### Mock Authentication States

```typescript
import { authTestSetup } from '@/tests/setup/auth-test-setup';

// Set up authenticated user
authTestSetup.setupSuccessfulAuth();

// Set up unauthenticated state
authTestSetup.setupFailedAuth();

// Create custom user
const customUser = authTestSetup.createMockUser({
  email: 'custom@example.com',
  preferences: ['woody', 'oriental'],
});
```

## 🤖 CI/CD Integration

The framework integrates with GitHub Actions for:

- **Automated testing** on push/PR
- **Coverage reporting** with PR comments
- **Performance monitoring** with regression detection
- **Accessibility auditing** on every change
- **Security scanning** for vulnerabilities

## 📝 Test Utilities

### Custom Render Function

```typescript
import { render } from '@/tests/utils/test-utils'

// Renders with all necessary providers
const { getByText, user } = render(<Component />)
```

### Database Test Helper

```typescript
import { databaseTestHelper } from '@/tests/utils/database-test-utils';

// Comprehensive database testing utilities
databaseTestHelper.setupFragranceDatabase();
databaseTestHelper.validateDatabaseResult(result);
```

### Accessibility Helpers

```typescript
import {
  testAccessibility,
  testMobileAccessibility,
  testKeyboardNavigation,
} from '@/tests/accessibility/accessibility-helpers';

// Comprehensive accessibility testing
await testAccessibility(component);
```

## 🐛 Debugging Tests

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Open Vitest UI

```bash
npm run test:ui
```

### Debug with VS Code

Add to `.vscode/launch.json`:

```json
{
  "name": "Debug Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run", "--no-coverage"],
  "console": "integratedTerminal"
}
```

## 📚 Best Practices

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests focused** on single behaviors
5. **Use setup/teardown** for common test preparation

### Test Data Management

1. **Use fixtures** for consistent test data
2. **Reset mocks** between tests
3. **Isolate tests** from each other
4. **Create meaningful test data** that represents real use cases

### Performance Testing

1. **Test on mobile first**
2. **Set realistic budgets**
3. **Monitor regression**
4. **Test under load**

### Accessibility Testing

1. **Test with assistive technologies**
2. **Verify keyboard navigation**
3. **Check color contrast**
4. **Test responsive design**

## 🔧 Configuration

### Vitest Configuration

Located in `vitest.config.ts` with:

- Coverage thresholds
- Test environment setup
- Path aliases
- Parallel execution

### Environment Variables

Required for testing:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
```

## 📈 Metrics and Reporting

### Coverage Reports

- **HTML**: `coverage/index.html`
- **JSON**: `coverage/coverage.json`
- **LCOV**: `coverage/lcov.info`

### Test Results

- **JUnit XML**: `test-results.xml`
- **Console output**: Verbose test results
- **CI integration**: GitHub Actions summaries

## 🆘 Troubleshooting

### Common Issues

**Tests timing out**:

```bash
# Increase timeout in vitest.config.ts
timeout: 10000
```

**Mock not working**:

```typescript
// Ensure mocks are reset
beforeEach(() => {
  vi.clearAllMocks();
});
```

**Coverage threshold failures**:

```bash
# Check uncovered lines
npm run test:coverage
open coverage/index.html
```

**Accessibility violations**:

```typescript
// Check detailed violations
await testAccessibility(component, {
  includedImpacts: ['minor', 'moderate', 'serious', 'critical'],
});
```

## 🎉 Getting Help

- Check the [test examples](./setup-validation/framework-validation.test.ts)
- Review existing [integration tests](./integration/)
- Consult the [accessibility helpers](./accessibility/accessibility-helpers.ts)
- Examine [performance utilities](./performance/core-web-vitals.ts)

## 📄 License

This testing framework is part of the ScentMatch project and follows the same MIT license.
